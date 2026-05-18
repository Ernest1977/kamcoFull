from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.utils import timezone
from django.http import HttpResponse
from administration.mixins import TrackingMixin
from accounts.permissions import IsFinance, IsAdminOrDirector
from drf_spectacular.utils import extend_schema, extend_schema_view

from .models import (
    DemandeDevis,
    Facture,
    LigneFacture,
    Paiement,
    CategorieDépense,
    DepenseOperationnelle,
    BudgetMensuel
)

from .serializers import (
    DemandeDevisSerializer,
    FactureSerializer,
    FactureResumeSerializer,
    LigneFactureSerializer,
    PaiementSerializer,
    CategorieDépenseSerializer,
    DepenseOperationnelleSerializer,
    BudgetMensuelSerializer
)


# ========================================
# ENDPOINTS EXISTANTS (on garde)
# ========================================
@api_view(['GET'])
@permission_classes([IsFinance])
def test_finance(request):
    """Endpoint de test pour vérifier l'accès Finance."""
    return Response({
        "message": "Confidentiel - Accès Finance OK",
        "user": request.user.username,
        "role": request.user.get_role_display(),
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def creer_demande_devis(request):
    """Permet aux visiteurs d'envoyer une demande de devis."""
    serializer = DemandeDevisSerializer(data=request.data)
    if serializer.is_valid():
        devis = serializer.save()

        # Envoyer les emails
        from administration.email_service import (
            envoyer_email_confirmation_devis,
            notifier_equipe_nouveau_devis
        )
        envoyer_email_confirmation_devis(devis)
        notifier_equipe_nouveau_devis(devis)

        return Response(
            {"message": "Demande de devis créée avec succès"},
            status=status.HTTP_201_CREATED
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ========================================
# DEMANDE DEVIS (CRUD admin)
# ========================================
class DemandeDevisViewSet(viewsets.ModelViewSet):
    """
    CRUD Demandes de devis.
    Accessible par : ADMIN, DIR, COMPTA, COMM
    """
    queryset = DemandeDevis.objects.all()
    serializer_class = DemandeDevisSerializer
    permission_classes = [IsFinance]

    def get_queryset(self):
        qs = DemandeDevis.objects.all()
        traite = self.request.query_params.get('traite')
        if traite is not None:
            qs = qs.filter(traite=(traite.lower() == 'true'))
        return qs

    @action(detail=True, methods=['post'])
    def marquer_traite(self, request, pk=None):
        devis = self.get_object()
        devis.traite = True
        devis.save()
        return Response(DemandeDevisSerializer(devis).data)


# ========================================
# FACTURE
# ========================================

@extend_schema_view(
    list=extend_schema(tags=['Finance'], summary='Liste des factures'),
    retrieve=extend_schema(tags=['Finance'], summary='Détail d\'une facture'),
    create=extend_schema(tags=['Finance'], summary='Créer une facture'),
)

class FactureViewSet(TrackingMixin, viewsets.ModelViewSet):
    """
    CRUD Factures.
    Accessible par : ADMIN, DIR, COMPTA
    """
    queryset = Facture.objects.all()
    permission_classes = [IsFinance]

    def get_serializer_class(self):
        if self.action == 'list':
            return FactureResumeSerializer
        return FactureSerializer

    def get_queryset(self):
        qs = Facture.objects.all()
        statut = self.request.query_params.get('statut')
        client = self.request.query_params.get('client')
        devise = self.request.query_params.get('devise')
        date_debut = self.request.query_params.get('date_debut')
        date_fin = self.request.query_params.get('date_fin')

        if statut:
            qs = qs.filter(statut=statut.upper())
        if client:
            qs = qs.filter(client_nom__icontains=client)
        if devise:
            qs = qs.filter(devise=devise.upper())
        if date_debut:
            qs = qs.filter(date_emission__gte=date_debut)
        if date_fin:
            qs = qs.filter(date_emission__lte=date_fin)

        return qs

    def perform_create(self, serializer):
        serializer.save(creee_par=self.request.user)

    @action(detail=True, methods=['post'])
    def ajouter_ligne(self, request, pk=None):
        facture = self.get_object()
        serializer = LigneFactureSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save(facture=facture)

            # Recalculer le montant HT
            total_ht = sum(l.sous_total for l in facture.lignes.all())
            facture.montant_ht = total_ht
            facture.save()

            return Response(
                FactureSerializer(facture, context={'request': request}).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def changer_statut(self, request, pk=None):
        facture = self.get_object()
        nouveau_statut = request.data.get('statut')

        statuts_valides = [s[0] for s in Facture.STATUT_CHOICES]
        if nouveau_statut not in statuts_valides:
            return Response(
                {"erreur": f"Statut invalide. Valides : {statuts_valides}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        facture.statut = nouveau_statut
        facture.save()

        return Response(
            FactureSerializer(facture, context={'request': request}).data
        )

    @action(detail=True, methods=['get'])
    def paiements(self, request, pk=None):
        facture = self.get_object()
        paiements = facture.paiements.all()
        serializer = PaiementSerializer(
            paiements, many=True, context={'request': request}
        )
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def creer_depuis_commande(self, request, pk=None):
        """Créer une facture à partir d'une commande existante."""
        from supplychain.models import CommandeClient

        try:
            commande = CommandeClient.objects.get(pk=pk)
        except CommandeClient.DoesNotExist:
            return Response(
                {"erreur": "Commande introuvable."},
                status=status.HTTP_404_NOT_FOUND
            )

        facture = Facture.objects.create(
            commande=commande,
            client_nom=commande.client_nom,
            client_entreprise=commande.client_entreprise,
            client_email=commande.client_email,
            client_telephone=commande.client_telephone,
            montant_ht=commande.montant_total,
            date_emission=timezone.now().date(),
            date_echeance=timezone.now().date(),
            creee_par=request.user
        )

        # Copier les lignes de commande vers les lignes de facture
        for ligne in commande.lignes.all():
            LigneFacture.objects.create(
                facture=facture,
                description=f"{ligne.produit.nom}",
                produit=ligne.produit,
                quantite=ligne.quantite_kg,
                unite='kg',
                prix_unitaire=ligne.prix_unitaire
            )

        facture.montant_ht = sum(l.sous_total for l in facture.lignes.all())
        facture.save()

        return Response(
            FactureSerializer(facture, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=True, methods=['post'])
    def envoyer_par_email(self, request, pk=None):
        facture = self.get_object()

        if not facture.client_email:
            return Response(
                {"erreur": "Aucun email client renseigné."},
                status=status.HTTP_400_BAD_REQUEST
            )

        from administration.email_service import envoyer_email_facture
        success = envoyer_email_facture(facture)

        if success:
            if facture.statut == 'BROUILLON':
                facture.statut = 'ENVOYEE'
                facture.save()
            return Response({"message": f"Facture {facture.numero} envoyée à {facture.client_email}."})
        else:
            return Response(
                {"erreur": "Erreur lors de l'envoi de l'email."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ========================================
# PAIEMENT
# ========================================
class PaiementViewSet(viewsets.ModelViewSet):
    """
    CRUD Paiements.
    Accessible par : ADMIN, DIR, COMPTA
    """
    queryset = Paiement.objects.all()
    serializer_class = PaiementSerializer
    permission_classes = [IsFinance]

    def get_queryset(self):
        qs = Paiement.objects.all()
        statut = self.request.query_params.get('statut')
        mode = self.request.query_params.get('mode')
        facture_id = self.request.query_params.get('facture')

        if statut:
            qs = qs.filter(statut=statut.upper())
        if mode:
            qs = qs.filter(mode_paiement=mode.upper())
        if facture_id:
            qs = qs.filter(facture__id=facture_id)

        return qs

    def perform_create(self, serializer):
        paiement = serializer.save()

        # Mettre à jour le montant payé sur la facture
        facture = paiement.facture
        total_paye = sum(
            p.montant for p in facture.paiements.filter(statut='CONFIRME')
        )
        if paiement.statut == 'CONFIRME':
            total_paye += paiement.montant

        facture.montant_paye = total_paye
        facture.save()

    @action(detail=True, methods=['post'])
    def confirmer(self, request, pk=None):
        paiement = self.get_object()
        paiement.statut = 'CONFIRME'
        paiement.confirme_par = request.user
        paiement.date_confirmation = timezone.now().date()
        paiement.save()

        # Mettre à jour la facture
        facture = paiement.facture
        total_paye = sum(
            p.montant for p in facture.paiements.filter(statut='CONFIRME')
        )
        facture.montant_paye = total_paye
        facture.save()

        return Response(
            PaiementSerializer(paiement, context={'request': request}).data
        )


# ========================================
# CATÉGORIE DÉPENSE
# ========================================
class CategorieDépenseViewSet(viewsets.ModelViewSet):
    """CRUD Catégories de dépenses."""
    queryset = CategorieDépense.objects.all()
    serializer_class = CategorieDépenseSerializer
    permission_classes = [IsFinance]


# ========================================
# DÉPENSE OPÉRATIONNELLE
# ========================================
class DepenseOperationnelleViewSet(viewsets.ModelViewSet):
    """
    CRUD Dépenses opérationnelles.
    Accessible par : ADMIN, DIR, COMPTA
    """
    queryset = DepenseOperationnelle.objects.all()
    serializer_class = DepenseOperationnelleSerializer
    permission_classes = [IsFinance]

    def get_queryset(self):
        qs = DepenseOperationnelle.objects.all()
        statut = self.request.query_params.get('statut')
        categorie = self.request.query_params.get('categorie')
        date_debut = self.request.query_params.get('date_debut')
        date_fin = self.request.query_params.get('date_fin')

        if statut:
            qs = qs.filter(statut=statut.upper())
        if categorie:
            qs = qs.filter(categorie__nom__icontains=categorie)
        if date_debut:
            qs = qs.filter(date_depense__gte=date_debut)
        if date_fin:
            qs = qs.filter(date_depense__lte=date_fin)

        return qs

    def perform_create(self, serializer):
        serializer.save(soumis_par=self.request.user)

    @action(detail=True, methods=['post'])
    def approuver(self, request, pk=None):
        depense = self.get_object()
        depense.statut = 'APPROUVEE'
        depense.approuve_par = request.user
        depense.date_approbation = timezone.now()
        depense.save()
        return Response(
            DepenseOperationnelleSerializer(depense, context={'request': request}).data
        )

    @action(detail=True, methods=['post'])
    def rejeter(self, request, pk=None):
        depense = self.get_object()
        depense.statut = 'REJETEE'
        depense.approuve_par = request.user
        depense.date_approbation = timezone.now()
        depense.notes = request.data.get('motif', depense.notes)
        depense.save()
        return Response(
            DepenseOperationnelleSerializer(depense, context={'request': request}).data
        )


# ========================================
# BUDGET MENSUEL
# ========================================
class BudgetMensuelViewSet(viewsets.ModelViewSet):
    """
    CRUD Budgets mensuels.
    Accessible par : ADMIN, DIR, COMPTA
    """
    queryset = BudgetMensuel.objects.all()
    serializer_class = BudgetMensuelSerializer
    permission_classes = [IsFinance]

    def get_queryset(self):
        qs = BudgetMensuel.objects.all()
        annee = self.request.query_params.get('annee')
        mois = self.request.query_params.get('mois')
        cloture = self.request.query_params.get('cloture')

        if annee:
            qs = qs.filter(annee=int(annee))
        if mois:
            qs = qs.filter(mois=int(mois))
        if cloture is not None:
            qs = qs.filter(est_cloture=(cloture.lower() == 'true'))

        return qs

    @action(detail=True, methods=['post'])
    def cloturer(self, request, pk=None):
        budget = self.get_object()
        budget.est_cloture = True
        budget.save()
        return Response(
            BudgetMensuelSerializer(budget, context={'request': request}).data
        )


# ========================================
# DASHBOARD FINANCIER
# ========================================

@extend_schema(tags=['Finance'], summary='Dashboard financier')
@api_view(['GET'])
@permission_classes([IsFinance])
def dashboard_finance(request):
    """
    Vue d'ensemble financière complète.
    """
    from django.db.models import Sum, Count, Q
    from datetime import date

    annee = request.query_params.get('annee', date.today().year)

    # Factures
    factures_total = Facture.objects.filter(
        date_emission__year=annee
    ).count()

    factures_payees = Facture.objects.filter(
        statut='PAYEE',
        date_emission__year=annee
    ).count()

    factures_en_attente = Facture.objects.filter(
        statut__in=['ENVOYEE', 'PARTIELLEMENT_PAYEE'],
        date_emission__year=annee
    ).count()

    factures_en_retard = Facture.objects.filter(
        statut='EN_RETARD',
        date_emission__year=annee
    ).count()

    # Chiffre d'affaires
    chiffre_affaires = Facture.objects.filter(
        date_emission__year=annee,
        statut__in=['PAYEE', 'PARTIELLEMENT_PAYEE', 'ENVOYEE']
    ).aggregate(total=Sum('montant_ttc'))['total'] or 0

    # Montant encaissé
    montant_encaisse = Paiement.objects.filter(
        statut='CONFIRME',
        date_paiement__year=annee
    ).aggregate(total=Sum('montant'))['total'] or 0

    # Créances clients
    creances = Facture.objects.filter(
        statut__in=['ENVOYEE', 'PARTIELLEMENT_PAYEE', 'EN_RETARD'],
        date_emission__year=annee
    ).aggregate(total=Sum('solde_restant'))['total'] or 0

    # Dépenses
    depenses_total = DepenseOperationnelle.objects.filter(
        statut__in=['APPROUVEE', 'PAYEE'],
        date_depense__year=annee
    ).aggregate(total=Sum('montant'))['total'] or 0

    depenses_en_attente = DepenseOperationnelle.objects.filter(
        statut='EN_ATTENTE'
    ).count()

    # Devis
    devis_total = DemandeDevis.objects.filter(
        date_demande__year=annee
    ).count()

    devis_non_traites = DemandeDevis.objects.filter(traite=False).count()

    # Résultat net
    resultat_net = float(montant_encaisse) - float(depenses_total)

    # Revenus par mois (pour graphique)
    revenus_par_mois = []
    for m in range(1, 13):
        rev = Paiement.objects.filter(
            statut='CONFIRME',
            date_paiement__year=annee,
            date_paiement__month=m
        ).aggregate(total=Sum('montant'))['total'] or 0

        dep = DepenseOperationnelle.objects.filter(
            statut__in=['APPROUVEE', 'PAYEE'],
            date_depense__year=annee,
            date_depense__month=m
        ).aggregate(total=Sum('montant'))['total'] or 0

        revenus_par_mois.append({
            'mois': m,
            'revenus': float(rev),
            'depenses': float(dep),
            'solde': float(rev) - float(dep)
        })

    return Response({
        'annee': int(annee),
        'factures': {
            'total': factures_total,
            'payees': factures_payees,
            'en_attente': factures_en_attente,
            'en_retard': factures_en_retard,
        },
        'chiffre_affaires': float(chiffre_affaires),
        'montant_encaisse': float(montant_encaisse),
        'creances_clients': float(creances),
        'depenses_total': float(depenses_total),
        'depenses_en_attente': depenses_en_attente,
        'resultat_net': resultat_net,
        'devis': {
            'total': devis_total,
            'non_traites': devis_non_traites,
        },
        'evolution_mensuelle': revenus_par_mois,
    })


@api_view(['POST'])
@permission_classes([IsFinance])
def synchroniser_factures_view(request):
    """Lance la synchronisation automatique des factures."""
    from .facture_service import synchroniser_factures
    resultats = synchroniser_factures()
    return Response({
        'message': 'Synchronisation des factures terminée',
        'resultats': resultats
    })



@api_view(['GET'])
@permission_classes([IsFinance])
def telecharger_facture_pdf(request, pk):
    """Génère et télécharge le PDF d'une facture."""
    try:
        facture = Facture.objects.get(pk=pk)
    except Facture.DoesNotExist:
        return Response({"erreur": "Facture introuvable."}, status=404)

    from .pdf_generator import generer_facture_pdf
    pdf_buffer = generer_facture_pdf(facture)

    response = HttpResponse(pdf_buffer, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="Facture_{facture.numero}.pdf"'
    return response


@api_view(['GET'])
@permission_classes([IsFinance])
def apercu_facture_pdf(request, pk):
    """Affiche le PDF d'une facture dans le navigateur."""
    try:
        facture = Facture.objects.get(pk=pk)
    except Facture.DoesNotExist:
        return Response({"erreur": "Facture introuvable."}, status=404)

    from .pdf_generator import generer_facture_pdf
    pdf_buffer = generer_facture_pdf(facture)

    response = HttpResponse(pdf_buffer, content_type='application/pdf')
    response['Content-Disposition'] = f'inline; filename="Facture_{facture.numero}.pdf"'
    return response