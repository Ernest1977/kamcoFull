# Create your views here.

from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
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
    MouvementStock
)

from .serializers import (
    FournisseurSerializer,
    CommandeClientSerializer,
    LigneCommandeClientSerializer,
    CommandeFournisseurSerializer,
    LigneCommandeFournisseurSerializer,
    LivraisonSerializer,
    MouvementStockSerializer
)



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
    Vue d'ensemble de la supply chain.
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

    commandes_par_statut = dict(
        CommandeClient.objects.values_list('statut').annotate(count=Count('id')).order_by()
    )

    return Response({
        'commandes_en_cours': commandes_en_cours,
        'commandes_livrees': commandes_livrees,
        'livraisons_en_transit': livraisons_en_transit,
        'fournisseurs_actifs': fournisseurs_actifs,
        'chiffre_affaires_livrees': float(chiffre_affaires),
        'commandes_par_statut': commandes_par_statut,
    })