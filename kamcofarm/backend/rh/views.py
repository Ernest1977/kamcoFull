# Create your views here.
from django.http import HttpResponse
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from administration.mixins import TrackingMixin
from accounts.permissions import IsHR, IsAdminOrDirector
from drf_spectacular.utils import extend_schema, extend_schema_view

from .models import (
    Departement,
    Employe,
    ContratTravail,
    DemandeConge,
    Presence,
    FichePaie
)

from .serializers import (
    DepartementSerializer,
    EmployeSerializer,
    EmployeResumeSerializer,
    ContratTravailSerializer,
    DemandeCongeSerializer,
    PresenceSerializer,
    FichePaieSerializer
)


# ========================================
# DÉPARTEMENT
# ========================================
@extend_schema_view(
    list=extend_schema(tags=['RH'], summary='Liste des départements'),
    retrieve=extend_schema(tags=['RH'], summary='Détail d\'un département'),
    create=extend_schema(tags=['RH'], summary='Créer un département'),
)
class DepartementViewSet(viewsets.ModelViewSet):
    """
    CRUD Départements.
    Accessible par : ADMIN, DIR, RH
    """
    queryset = Departement.objects.all()
    serializer_class = DepartementSerializer
    permission_classes = [IsHR]

    def get_queryset(self):
        qs = Departement.objects.all()
        actif = self.request.query_params.get('actif')
        if actif is not None:
            qs = qs.filter(est_actif=(actif.lower() == 'true'))
        return qs


# ========================================
# EMPLOYÉ
# ========================================

@extend_schema_view(
    list=extend_schema(tags=['RH'], summary='Liste des employés'),
    retrieve=extend_schema(tags=['RH'], summary='Détail d\'un employé'),
    create=extend_schema(tags=['RH'], summary='Créer un employé'),
)

class EmployeViewSet(TrackingMixin, viewsets.ModelViewSet):
    """
    CRUD Employés.
    Accessible par : ADMIN, DIR, RH
    - Liste : résumé
    - Détail : complet
    """
    queryset = Employe.objects.select_related('user', 'departement').all()
    permission_classes = [IsHR]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_serializer_class(self):
        if self.action == 'list':
            return EmployeResumeSerializer
        return EmployeSerializer

    def get_queryset(self):
        qs = Employe.objects.select_related('user', 'departement').all()

        actif = self.request.query_params.get('actif')
        departement = self.request.query_params.get('departement')
        poste = self.request.query_params.get('poste')

        if actif is not None:
            qs = qs.filter(est_actif=(actif.lower() == 'true'))
        if departement:
            qs = qs.filter(departement__nom__icontains=departement)
        if poste:
            qs = qs.filter(poste__icontains=poste)

        return qs

    @action(detail=True, methods=['get'])
    def contrats(self, request, pk=None):
        employe = self.get_object()
        contrats = employe.contrats.all()
        serializer = ContratTravailSerializer(contrats, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def conges(self, request, pk=None):
        employe = self.get_object()
        conges = employe.demandes_conges.all()
        serializer = DemandeCongeSerializer(conges, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def presences(self, request, pk=None):
        employe = self.get_object()
        presences = employe.presences.all()[:30]
        serializer = PresenceSerializer(presences, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def fiches_paie(self, request, pk=None):
        employe = self.get_object()
        fiches = employe.fiches_paie.all()
        serializer = FichePaieSerializer(fiches, many=True, context={'request': request})
        return Response(serializer.data)

# ========================================
# CONTRAT DE TRAVAIL
# ========================================
class ContratTravailViewSet(viewsets.ModelViewSet):
    """
    CRUD Contrats de travail.
    Accessible par : ADMIN, DIR, RH
    """
    queryset = ContratTravail.objects.select_related('employe__user').all()
    serializer_class = ContratTravailSerializer
    permission_classes = [IsHR]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_queryset(self):
        qs = ContratTravail.objects.select_related('employe__user').all()
        statut = self.request.query_params.get('statut')
        type_c = self.request.query_params.get('type')

        if statut:
            qs = qs.filter(statut=statut.upper())
        if type_c:
            qs = qs.filter(type_contrat=type_c.upper())

        return qs


# ========================================
# DEMANDE DE CONGÉ
# ========================================
class DemandeCongeViewSet(viewsets.ModelViewSet):
    """
    CRUD Demandes de congés.
    Accessible par : ADMIN, DIR, RH
    Un employé connecté peut aussi soumettre une demande via son espace.
    """
    queryset = DemandeConge.objects.select_related('employe__user', 'approuve_par').all()
    serializer_class = DemandeCongeSerializer
    permission_classes = [IsHR]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_queryset(self):
        qs = DemandeConge.objects.select_related('employe__user', 'approuve_par').all()
        statut = self.request.query_params.get('statut')
        type_c = self.request.query_params.get('type')
        employe_id = self.request.query_params.get('employe')

        if statut:
            qs = qs.filter(statut=statut.upper())
        if type_c:
            qs = qs.filter(type_conge=type_c.upper())
        if employe_id:
            qs = qs.filter(employe__id=employe_id)

        return qs

    @action(detail=True, methods=['post'])
    def approuver(self, request, pk=None):
        conge = self.get_object()
        commentaire = request.data.get('commentaire', '')

        conge.statut = 'APPROUVE'
        conge.approuve_par = request.user
        conge.date_decision = timezone.now()
        conge.commentaire_decision = commentaire
        conge.save()

        return Response(
            DemandeCongeSerializer(conge, context={'request': request}).data
        )

    @action(detail=True, methods=['post'])
    def refuser(self, request, pk=None):
        conge = self.get_object()
        commentaire = request.data.get('commentaire', '')

        conge.statut = 'REFUSE'
        conge.approuve_par = request.user
        conge.date_decision = timezone.now()
        conge.commentaire_decision = commentaire
        conge.save()

        return Response(
            DemandeCongeSerializer(conge, context={'request': request}).data
        )
    
    @action(detail=True, methods=['post'])
    def approuver(self, request, pk=None):
        conge = self.get_object()
        commentaire = request.data.get('commentaire', '')

        conge.statut = 'APPROUVE'
        conge.approuve_par = request.user
        conge.date_decision = timezone.now()
        conge.commentaire_decision = commentaire
        conge.save()

        # Envoyer email
        from administration.email_service import envoyer_email_decision_conge
        envoyer_email_decision_conge(conge)

        return Response(
            DemandeCongeSerializer(conge, context={'request': request}).data
        )

    @action(detail=True, methods=['post'])
    def refuser(self, request, pk=None):
        conge = self.get_object()
        commentaire = request.data.get('commentaire', '')

        conge.statut = 'REFUSE'
        conge.approuve_par = request.user
        conge.date_decision = timezone.now()
        conge.commentaire_decision = commentaire
        conge.save()

        # Envoyer email
        from administration.email_service import envoyer_email_decision_conge
        envoyer_email_decision_conge(conge)

        return Response(
            DemandeCongeSerializer(conge, context={'request': request}).data
        )


# ========================================
# PRÉSENCE
# ========================================
class PresenceViewSet(viewsets.ModelViewSet):
    """
    CRUD Présences.
    Accessible par : ADMIN, DIR, RH
    """
    queryset = Presence.objects.select_related('employe__user').all()
    serializer_class = PresenceSerializer
    permission_classes = [IsHR]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_queryset(self):
        qs = Presence.objects.select_related('employe__user').all()
        date = self.request.query_params.get('date')
        statut = self.request.query_params.get('statut')
        employe_id = self.request.query_params.get('employe')

        if date:
            qs = qs.filter(date=date)
        if statut:
            qs = qs.filter(statut=statut.upper())
        if employe_id:
            qs = qs.filter(employe__id=employe_id)

        return qs


# ========================================
# FICHE DE PAIE
# ========================================
class FichePaieViewSet(viewsets.ModelViewSet):
    """
    CRUD Fiches de paie.
    Accessible par : ADMIN, DIR, RH
    """
    queryset = FichePaie.objects.select_related('employe__user').all()
    serializer_class = FichePaieSerializer
    permission_classes = [IsHR]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_queryset(self):
        qs = FichePaie.objects.select_related('employe__user').all()
        mois = self.request.query_params.get('mois')
        annee = self.request.query_params.get('annee')
        statut = self.request.query_params.get('statut')
        employe_id = self.request.query_params.get('employe')

        if mois:
            qs = qs.filter(mois=int(mois))
        if annee:
            qs = qs.filter(annee=int(annee))
        if statut:
            qs = qs.filter(statut=statut.upper())
        if employe_id:
            qs = qs.filter(employe__id=employe_id)

        return qs

    @action(detail=True, methods=['post'])
    def valider(self, request, pk=None):
        fiche = self.get_object()
        fiche.statut = 'VALIDEE'
        fiche.save()
        return Response(
            FichePaieSerializer(fiche, context={'request': request}).data
        )

    @action(detail=True, methods=['post'])
    def marquer_payee(self, request, pk=None):
        fiche = self.get_object()
        fiche.statut = 'PAYEE'
        fiche.payee_le = timezone.now().date()
        fiche.save()
        return Response(
            FichePaieSerializer(fiche, context={'request': request}).data
        )


# ========================================
# DASHBOARD RH
# ========================================
@api_view(['GET'])
@permission_classes([IsHR])
def dashboard_rh(request):
    """
    Vue d'ensemble RH.
    """
    from django.db.models import Sum, Count, Q
    from datetime import date

    total_employes = Employe.objects.filter(est_actif=True).count()
    total_departements = Departement.objects.filter(est_actif=True).count()

    conges_en_attente = DemandeConge.objects.filter(statut='EN_ATTENTE').count()
    conges_approuves = DemandeConge.objects.filter(
        statut='APPROUVE',
        date_debut__lte=date.today(),
        date_fin__gte=date.today()
    ).count()

    presents_aujourdhui = Presence.objects.filter(
        date=date.today(),
        statut='PRESENT'
    ).count()

    absents_aujourdhui = Presence.objects.filter(
        date=date.today(),
        statut__in=['ABSENT', 'MALADIE']
    ).count()

    masse_salariale = FichePaie.objects.filter(
        statut__in=['VALIDEE', 'PAYEE'],
        annee=date.today().year
    ).aggregate(total=Sum('salaire_net'))['total'] or 0

    employes_par_departement = list(
        Departement.objects.filter(est_actif=True).annotate(
            nb_employes=Count('employes', filter=Q(employes__est_actif=True))
        ).values('nom', 'nb_employes')
    )

    contrats_expirant_bientot = ContratTravail.objects.filter(
        statut='ACTIF',
        date_fin__isnull=False,
        date_fin__lte=date.today().replace(month=date.today().month + 1) if date.today().month < 12
        else date.today().replace(year=date.today().year + 1, month=1)
    ).count()

    return Response({
        'total_employes': total_employes,
        'total_departements': total_departements,
        'conges_en_attente': conges_en_attente,
        'employes_en_conge': conges_approuves,
        'presents_aujourdhui': presents_aujourdhui,
        'absents_aujourdhui': absents_aujourdhui,
        'masse_salariale_annee': float(masse_salariale),
        'contrats_expirant_bientot': contrats_expirant_bientot,
        'employes_par_departement': employes_par_departement,
    })


# ========================================
# ESPACE EMPLOYÉ (self-service)
# ========================================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mon_profil_employe(request):
    """
    Permet à un employé connecté de voir son propre profil.
    """
    try:
        employe = request.user.profil_employe
    except Employe.DoesNotExist:
        return Response(
            {"erreur": "Aucun profil employé associé à ce compte."},
            status=status.HTTP_404_NOT_FOUND
        )

    serializer = EmployeSerializer(employe, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mes_conges(request):
    """
    Permet à un employé de voir ses propres demandes de congés.
    """
    try:
        employe = request.user.profil_employe
    except Employe.DoesNotExist:
        return Response(
            {"erreur": "Aucun profil employé associé."},
            status=status.HTTP_404_NOT_FOUND
        )

    conges = employe.demandes_conges.all()
    serializer = DemandeCongeSerializer(conges, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def demander_conge(request):
    """
    Permet à un employé de soumettre une demande de congé.
    """
    try:
        employe = request.user.profil_employe
    except Employe.DoesNotExist:
        return Response(
            {"erreur": "Aucun profil employé associé."},
            status=status.HTTP_404_NOT_FOUND
        )

    data = request.data.copy()
    data['employe'] = employe.id

    serializer = DemandeCongeSerializer(data=data, context={'request': request})
    if serializer.is_valid():
        serializer.save(employe=employe)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mes_fiches_paie(request):
    """
    Permet à un employé de voir ses propres fiches de paie.
    """
    try:
        employe = request.user.profil_employe
    except Employe.DoesNotExist:
        return Response(
            {"erreur": "Aucun profil employé associé."},
            status=status.HTTP_404_NOT_FOUND
        )

    fiches = employe.fiches_paie.filter(statut__in=['VALIDEE', 'PAYEE'])
    serializer = FichePaieSerializer(fiches, many=True, context={'request': request})
    return Response(serializer.data)




@api_view(['GET'])
@permission_classes([IsAuthenticated])
def telecharger_bulletin_pdf(request, pk, modele='classique'):
    """Télécharge le bulletin de paie en PDF."""
    try:
        fiche = FichePaie.objects.select_related('employe__user', 'employe__departement').get(pk=pk)
    except FichePaie.DoesNotExist:
        return Response({"erreur": "Fiche de paie introuvable."}, status=404)

    # Vérifier les droits
    user = request.user
    if user.role not in ['ADMIN', 'DIR', 'RH']:
        if not hasattr(user, 'profil_employe') or user.profil_employe.id != fiche.employe.id:
            return Response({"erreur": "Accès non autorisé."}, status=403)

    from .pdf_bulletin import generer_bulletin_classique, generer_bulletin_moderne

    if modele == 'moderne':
        pdf_buffer = generer_bulletin_moderne(fiche)
    else:
        pdf_buffer = generer_bulletin_classique(fiche)

    nom_fichier = f"Bulletin_{fiche.reference}_{modele}.pdf"
    response = HttpResponse(pdf_buffer, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="{nom_fichier}"'
    return response