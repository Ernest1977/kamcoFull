# Create your views here.

from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from administration.mixins import TrackingMixin
from drf_spectacular.utils import extend_schema, extend_schema_view

from accounts.permissions import (
    IsAdminOrDirector,
    IsLogistique,
    IsCommercial,
    IsCommercialeOuLogistique
)

from .models import (
    Fournisseur,
    CommandeClient,
    LigneCommandeClient,
    CommandeFournisseur,
    LigneCommandeFournisseur,
    Livraison,
    MouvementStock,
    Devis,
    LigneDevis
)

from .serializers import (
    FournisseurSerializer,
    CommandeClientSerializer,
    LigneCommandeClientSerializer,
    CommandeFournisseurSerializer,
    LigneCommandeFournisseurSerializer,
    LivraisonSerializer,
    MouvementStockSerializer,
    DevisSerializer,
    LigneDevisSerializer
)

from .pdf_generator import generer_devis_pdf
from django.http import HttpResponse
from administration.email_service import notifier_acceptation_devis
from administration.models import Notification
from django.contrib.auth import get_user_model
User = get_user_model()



# ========================================
# FOURNISSEUR
# ========================================


@extend_schema_view(
    list=extend_schema(tags=['Supply Chain'], summary='Liste des fournisseurs'),
    retrieve=extend_schema(tags=['Supply Chain'], summary='Détail d\'un fournisseur'),
    create=extend_schema(tags=['Supply Chain'], summary='Créer un fournisseur'),
)

class FournisseurViewSet(viewsets.ModelViewSet):
    """
    CRUD Fournisseurs.
    Accessible par : ADMIN, DIR, LOG
    """
    queryset = Fournisseur.objects.all()
    serializer_class = FournisseurSerializer
    permission_classes = [IsLogistique]

    def get_queryset(self):
        qs = Fournisseur.objects.all()
        actif = self.request.query_params.get('actif')
        type_f = self.request.query_params.get('type')

        if actif is not None:
            qs = qs.filter(est_actif=(actif.lower() == 'true'))
        if type_f:
            qs = qs.filter(type_fournisseur=type_f.upper())

        return qs


# ========================================
# COMMANDE CLIENT
# ========================================

@extend_schema_view(
    list=extend_schema(tags=['Supply Chain'], summary='Liste des commandes clients'),
    retrieve=extend_schema(tags=['Supply Chain'], summary='Détail d\'une commande'),
    create=extend_schema(tags=['Supply Chain'], summary='Créer une commande'),
    update=extend_schema(tags=['Supply Chain'], summary='Modifier une commande'),
    destroy=extend_schema(tags=['Supply Chain'], summary='Supprimer une commande'),
)

class CommandeClientViewSet(TrackingMixin, viewsets.ModelViewSet):
    """
    CRUD Commandes clients.
    Accessible par : ADMIN, DIR, COMM, LOG
    """
    queryset = CommandeClient.objects.all()
    serializer_class = CommandeClientSerializer
    permission_classes = [IsCommercialeOuLogistique]

    def get_queryset(self):
        qs = CommandeClient.objects.all()
        statut = self.request.query_params.get('statut')
        client = self.request.query_params.get('client')

        if statut:
            qs = qs.filter(statut=statut.upper())
        if client:
            qs = qs.filter(client_nom__icontains=client)

        return qs

    def perform_create(self, serializer):
        serializer.save(creee_par=self.request.user)

    @action(detail=True, methods=['post'])
    def changer_statut(self, request, pk=None):
        commande = self.get_object()
        nouveau_statut = request.data.get('statut')

        statuts_valides = [s[0] for s in CommandeClient.STATUT_CHOICES]
        if nouveau_statut not in statuts_valides:
            return Response(
                {"erreur": f"Statut invalide. Valides : {statuts_valides}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        commande.statut = nouveau_statut
        commande.save()

        return Response(
            CommandeClientSerializer(commande, context={'request': request}).data
        )

    @action(detail=True, methods=['post'])
    def ajouter_ligne(self, request, pk=None):
        commande = self.get_object()
        serializer = LigneCommandeClientSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save(commande=commande)

            # Recalculer le montant total
            total = sum(l.sous_total for l in commande.lignes.all())
            commande.montant_total = total
            commande.save()

            return Response(
                CommandeClientSerializer(commande, context={'request': request}).data,
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ========================================
# COMMANDE FOURNISSEUR
# ========================================
class CommandeFournisseurViewSet(viewsets.ModelViewSet):
    """
    CRUD Commandes fournisseurs.
    Accessible par : ADMIN, DIR, LOG
    """
    queryset = CommandeFournisseur.objects.all()
    serializer_class = CommandeFournisseurSerializer
    permission_classes = [IsLogistique]

    def get_queryset(self):
        qs = CommandeFournisseur.objects.all()
        statut = self.request.query_params.get('statut')
        fournisseur = self.request.query_params.get('fournisseur')

        if statut:
            qs = qs.filter(statut=statut.upper())
        if fournisseur:
            qs = qs.filter(fournisseur__nom__icontains=fournisseur)

        return qs

    def perform_create(self, serializer):
        serializer.save(creee_par=self.request.user)

    @action(detail=True, methods=['post'])
    def ajouter_ligne(self, request, pk=None):
        commande = self.get_object()
        serializer = LigneCommandeFournisseurSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save(commande=commande)

            total = sum(l.sous_total for l in commande.lignes.all())
            commande.montant_total = total
            commande.save()

            return Response(
                CommandeFournisseurSerializer(commande, context={'request': request}).data,
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ========================================
# LIVRAISON
# ========================================
class LivraisonViewSet(viewsets.ModelViewSet):
    """
    CRUD Livraisons.
    Accessible par : ADMIN, DIR, LOG
    """
    queryset = Livraison.objects.all()
    serializer_class = LivraisonSerializer
    permission_classes = [IsLogistique]

    def get_queryset(self):
        qs = Livraison.objects.all()
        statut = self.request.query_params.get('statut')
        commande = self.request.query_params.get('commande')

        if statut:
            qs = qs.filter(statut=statut.upper())
        if commande:
            qs = qs.filter(commande__reference__icontains=commande)

        return qs

    @action(detail=True, methods=['post'])
    def changer_statut(self, request, pk=None):
        livraison = self.get_object()
        nouveau_statut = request.data.get('statut')

        statuts_valides = [s[0] for s in Livraison.STATUT_CHOICES]
        if nouveau_statut not in statuts_valides:
            return Response(
                {"erreur": f"Statut invalide. Valides : {statuts_valides}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        livraison.statut = nouveau_statut
        livraison.save()

        return Response(
            LivraisonSerializer(livraison, context={'request': request}).data
        )


# ========================================
# MOUVEMENT STOCK
# ========================================
class MouvementStockViewSet(viewsets.ModelViewSet):
    """
    CRUD Mouvements de stock.
    Accessible par : ADMIN, DIR, LOG
    """
    queryset = MouvementStock.objects.all()
    serializer_class = MouvementStockSerializer
    permission_classes = [IsLogistique]

    def get_queryset(self):
        qs = MouvementStock.objects.all()
        type_m = self.request.query_params.get('type')
        produit = self.request.query_params.get('produit')

        if type_m:
            qs = qs.filter(type_mouvement=type_m.upper())
        if produit:
            qs = qs.filter(produit__nom__icontains=produit)

        return qs

    def perform_create(self, serializer):
        mouvement = serializer.save(effectue_par=self.request.user)

        # Mettre à jour le stock du produit
        produit = mouvement.produit
        if mouvement.type_mouvement == 'ENTREE':
            produit.stock_kg += int(mouvement.quantite_kg)
        elif mouvement.type_mouvement in ['SORTIE', 'PERTE']:
            produit.stock_kg = max(0, produit.stock_kg - int(mouvement.quantite_kg))
        elif mouvement.type_mouvement == 'AJUSTEMENT':
            produit.stock_kg = int(mouvement.quantite_kg)

        produit.save()


# ========================================
# DASHBOARD SUPPLYCHAIN
# ========================================
@api_view(['GET'])
@permission_classes([IsCommercialeOuLogistique])
def dashboard_supplychain(request):
    """
    Vue d'ensemble de la supply chain incluant stats de conversion devis.
    """
    from django.db.models import Sum, Count

    commandes_en_cours = CommandeClient.objects.exclude(
        statut__in=['LIVREE', 'ANNULEE']
    ).count()

    commandes_livrees = CommandeClient.objects.filter(statut='LIVREE').count()
    livraisons_en_transit = Livraison.objects.filter(statut='EN_TRANSIT').count()
    fournisseurs_actifs = Fournisseur.objects.filter(est_actif=True).count()

    chiffre_affaires = CommandeClient.objects.filter(
        statut='LIVREE'
    ).aggregate(total=Sum('montant_total'))['total'] or 0

    # Statistiques de conversion Devis
    total_devis = Devis.objects.count()
    devis_acceptes = Devis.objects.filter(statut='ACCEPTE').count()
    taux_conversion = (devis_acceptes / total_devis * 100) if total_devis > 0 else 0
    
    valeur_propositions = Devis.objects.aggregate(total=Sum('montant_ttc'))['total'] or 0

    return Response({
        'commandes_en_cours': commandes_en_cours,
        'commandes_livrees': commandes_livrees,
        'livraisons_en_transit': livraisons_en_transit,
        'fournisseurs_actifs': fournisseurs_actifs,
        'chiffre_affaires_livrees': float(chiffre_affaires),
        'stats_devis': {
            'total_nombre': total_devis,
            'acceptes_nombre': devis_acceptes,
            'taux_conversion': round(taux_conversion, 1),
            'valeur_totale_proposee': float(valeur_propositions)
        }
    })
# ========================================
# DEVIS (QUOTATION)
# ========================================
class DevisViewSet(viewsets.ModelViewSet):
    """
    CRUD Devis (Quotations).
    """
    queryset = Devis.objects.all()
    serializer_class = DevisSerializer
    permission_classes = [IsCommercialeOuLogistique]

    def get_queryset(self):
        qs = Devis.objects.all()
        statut = self.request.query_params.get('statut')
        client = self.request.query_params.get('client')

        if statut:
            qs = qs.filter(statut=statut.upper())
        if client:
            qs = qs.filter(client_nom__icontains=client)

        return qs

    def perform_create(self, serializer):
        serializer.save(creee_par=self.request.user)

    @action(
        detail=True,
        methods=['get'],
        permission_classes=[AllowAny],
        authentication_classes=[]
    )
    def pdf(self, request, pk=None):
        """
        Télécharge le PDF du devis.

        Deux modes d'accès autorisés :
          - Par JWT (en-tête Authorization) -> staff interne via le dashboard.
          - Par le token UUID du devis (?token=...) -> lien public / portail client.

        On évite ainsi l'erreur 401 lorsque le PDF est ouvert dans un nouvel
        onglet (window.open), car le navigateur n'envoie pas l'en-tête
        Authorization dans ce cas.
        """
        from rest_framework_simplejwt.authentication import JWTAuthentication

        devis = Devis.objects.filter(pk=pk).first()
        if not devis:
            return Response({"erreur": "Devis introuvable."}, status=status.HTTP_404_NOT_FOUND)

        autorise = False

        # 1) Accès par le token UUID du devis (lien public)
        token_param = request.query_params.get('token')
        if token_param and str(devis.token) == str(token_param):
            autorise = True

        # 2) Accès par JWT valide dans l'en-tête Authorization (staff interne)
        if not autorise:
            try:
                user_auth = JWTAuthentication().authenticate(request)
                if user_auth is not None:
                    autorise = True
            except Exception:
                autorise = False

        if not autorise:
            return Response(
                {"erreur": "Accès non autorisé à ce document."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        buffer = generer_devis_pdf(devis)
        response = HttpResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="Devis_{devis.reference}.pdf"'
        return response

    @action(detail=True, methods=['post'])
    def convertir_en_commande(self, request, pk=None):
        devis = self.get_object()
        
        if devis.statut == 'ACCEPTE':
            return Response({"erreur": "Ce devis a déjà été converti ou accepté."}, status=status.HTTP_400_BAD_REQUEST)

        # Création de la commande client
        commande = CommandeClient.objects.create(
            client_nom=devis.client_nom,
            client_entreprise=devis.client_entreprise,
            client_email=devis.client_email,
            client_telephone=devis.client_telephone,
            destination=devis.client_adresse or devis.port_chargement or "À préciser",
            montant_total=devis.montant_ttc,
            devise=devis.devise,
            notes=f"Générée à partir du devis {devis.reference}. {devis.notes or ''}",
            creee_par=request.user,
            devis_origine=devis
        )

        # Création des lignes de commande
        for ligne_dev in devis.lignes.all():
            LigneCommandeClient.objects.create(
                commande=commande,
                description=ligne_dev.description,
                quantite_kg=ligne_dev.quantite,
                prix_unitaire=ligne_dev.prix_unitaire,
                categorie_ligne='PRODUIT_AGRICOLE' # Par défaut
            )

        # Mettre à jour le statut du devis
        devis.statut = 'ACCEPTE'
        devis.save()

        return Response({
            "message": "Devis converti avec succès en commande.",
            "commande_id": commande.id,
            "commande_reference": commande.reference
        }, status=status.HTTP_201_CREATED)

# ========================================
# PORTAIL CLIENT PUBLIC (SÉCURISÉ PAR TOKEN)
# ========================================
@api_view(['GET'])
@permission_classes([AllowAny])
def public_devis_detail(request, token):
    try:
        devis = Devis.objects.get(token=token)
        serializer = DevisSerializer(devis, context={'request': request})
        return Response(serializer.data)
    except Devis.DoesNotExist:
        return Response({"erreur": "Lien invalide ou expiré."}, status=404)

@api_view(['POST'])
@permission_classes([AllowAny])
def public_devis_accepter(request, token):
    try:
        devis = Devis.objects.get(token=token)
        if devis.statut == 'ACCEPTE':
            return Response({"message": "Ce devis est déjà accepté."})
        
        # Logique de conversion (identique à celle du ViewSet)
        commande = CommandeClient.objects.create(
            client_nom=devis.client_nom,
            client_entreprise=devis.client_entreprise,
            client_email=devis.client_email,
            client_telephone=devis.client_telephone,
            destination=devis.client_adresse or devis.port_chargement or "À préciser",
            montant_total=devis.montant_ttc,
            devise=devis.devise,
            notes=f"Accepté en ligne par le client. Réf devis: {devis.reference}.",
            devis_origine=devis
        )

        for ligne_dev in devis.lignes.all():
            LigneCommandeClient.objects.create(
                commande=commande,
                description=ligne_dev.description,
                quantite_kg=ligne_dev.quantite,
                prix_unitaire=ligne_dev.prix_unitaire,
                categorie_ligne='PRODUIT_AGRICOLE'
            )

        devis.statut = 'ACCEPTE'
        devis.save()

        # 1. Envoi de l'Email de notification
        try:
            notifier_acceptation_devis(devis, commande.reference)
        except Exception as e:
            print(f"Erreur envoi email notification: {e}")

        # 2. Création des Notifications Push (Système interne)
        # On notifie tous les administrateurs et commerciaux
        equipe_a_notifier = User.objects.filter(role__in=['ADMIN', 'DIR', 'COMM'])
        for staff in equipe_a_notifier:
            Notification.objects.create(
                destinataire=staff,
                titre="✅ Devis accepté en ligne !",
                message=f"Le client {devis.client_nom} a accepté le devis {devis.reference}. Commande {commande.reference} générée.",
                type_notification='SUCCESS',
                priorite='HAUTE',
                lien_module='supplychain',
                lien_url=f"/api/supplychain/commandes-clients/{commande.id}/"
            )

        return Response({
            "message": "Devis accepté avec succès ! Nous préparons votre commande.",
            "reference_commande": commande.reference
        })
    except Devis.DoesNotExist:
        return Response({"erreur": "Lien invalide."}, status=404)
