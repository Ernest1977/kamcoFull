from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from rest_framework import status as http_status
from django.contrib.auth import get_user_model
from drf_spectacular.utils import extend_schema
from .serializers import UserSerializer

User = get_user_model()


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@extend_schema(tags=['Auth'], summary='Profil utilisateur connecté')
def me(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def liste_utilisateurs(request):
    """Liste tous les utilisateurs actifs."""
    users = User.objects.filter(is_active=True).order_by('username')
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def liste_equipe_commerciale(request):
    """Liste les membres de l'équipe commerciale (staff)."""
    users = User.objects.filter(
        is_active=True,
        is_staff=True,
        role__in=['ADMIN', 'DIR', 'COMM']
    ).order_by('username')
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data)


class UserViewSet(viewsets.ModelViewSet):
    """
    CRUD complet des comptes utilisateurs.
    Accessible uniquement par ADMIN et DIR.
    """
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_permissions(self):
        from accounts.permissions import IsAdminOrDirector
        return [IsAdminOrDirector()]

    def get_queryset(self):
        qs = User.objects.all().order_by('-date_joined')

        role = self.request.query_params.get('role')
        actif = self.request.query_params.get('actif')
        staff = self.request.query_params.get('staff')
        recherche = self.request.query_params.get('q')

        if role:
            qs = qs.filter(role=role.upper())
        if actif is not None:
            qs = qs.filter(is_active=(actif.lower() == 'true'))
        if staff is not None:
            qs = qs.filter(is_staff=(staff.lower() == 'true'))
        if recherche:
            from django.db.models import Q
            qs = qs.filter(
                Q(username__icontains=recherche) |
                Q(first_name__icontains=recherche) |
                Q(last_name__icontains=recherche) |
                Q(email__icontains=recherche)
            )

        return qs

    def perform_create(self, serializer):
        user = serializer.save()
        password = self.request.data.get('password')
        if password:
            user.set_password(password)
            user.save()

    @action(detail=True, methods=['post'])
    def changer_role(self, request, pk=None):
        user = self.get_object()
        nouveau_role = request.data.get('role')

        roles_valides = [r[0] for r in User.ROLE_CHOICES]
        if nouveau_role not in roles_valides:
            return Response(
                {"erreur": f"Rôle invalide. Valides : {roles_valides}"},
                status=http_status.HTTP_400_BAD_REQUEST
            )

        user.role = nouveau_role
        user.save()
        return Response(UserSerializer(user).data)

    @action(detail=True, methods=['post'])
    def activer_desactiver(self, request, pk=None):
        user = self.get_object()
        user.is_active = not user.is_active
        user.save()
        return Response(UserSerializer(user).data)

    @action(detail=True, methods=['post'])
    def reset_password(self, request, pk=None):
        user = self.get_object()
        new_password = request.data.get('password', 'FossAgro2026!')
        user.set_password(new_password)
        user.save()
        return Response({
            "message": f"Mot de passe réinitialisé pour {user.username}",
            "nouveau_mot_de_passe": new_password
        })

    @action(detail=True, methods=['post'])
    def toggle_staff(self, request, pk=None):
        user = self.get_object()
        user.is_staff = not user.is_staff
        user.save()
        return Response(UserSerializer(user).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mon_profil_complet(request):
    """Retourne le profil complet de l'utilisateur connecté avec toutes ses données."""
    user = request.user
    data = UserSerializer(user).data

    # Profil employé
    profil_employe = None
    try:
        from rh.models import Employe
        from rh.serializers import EmployeSerializer
        employe = user.profil_employe
        profil_employe = EmployeSerializer(employe, context={'request': request}).data
    except Exception:
        pass

    # Congés
    conges = []
    try:
        from rh.models import DemandeConge
        from rh.serializers import DemandeCongeSerializer
        if hasattr(user, 'profil_employe'):
            conges_qs = DemandeConge.objects.filter(employe=user.profil_employe).order_by('-date_demande')[:20]
            conges = DemandeCongeSerializer(conges_qs, many=True, context={'request': request}).data
    except Exception:
        pass

    # Fiches de paie
    fiches_paie = []
    try:
        from rh.models import FichePaie
        from rh.serializers import FichePaieSerializer
        if hasattr(user, 'profil_employe'):
            fiches_qs = FichePaie.objects.filter(
                employe=user.profil_employe,
                statut__in=['VALIDEE', 'PAYEE']
            ).order_by('-annee', '-mois')[:12]
            fiches_paie = FichePaieSerializer(fiches_qs, many=True, context={'request': request}).data
    except Exception:
        pass

    # Présences
    presences = []
    try:
        from rh.models import Presence
        from rh.serializers import PresenceSerializer
        if hasattr(user, 'profil_employe'):
            presences_qs = Presence.objects.filter(employe=user.profil_employe).order_by('-date')[:30]
            presences = PresenceSerializer(presences_qs, many=True, context={'request': request}).data
    except Exception:
        pass

    # Notifications
    notifications = []
    try:
        from administration.models import Notification
        from administration.serializers import NotificationSerializer
        notifs_qs = Notification.objects.filter(destinataire=user).order_by('-date_creation')[:20]
        notifications = NotificationSerializer(notifs_qs, many=True, context={'request': request}).data
    except Exception:
        pass

    # Tâches assignées
    taches = []
    try:
        from administration.models import TacheInterne
        from administration.serializers import TacheResumeSerializer
        taches_qs = TacheInterne.objects.filter(assignee_a=user).order_by('-date_creation')[:20]
        taches = TacheResumeSerializer(taches_qs, many=True, context={'request': request}).data
    except Exception:
        pass

    # Stats résumé
    stats = {
        'conges_en_attente': len([c for c in conges if c.get('statut') == 'EN_ATTENTE']),
        'conges_approuves': len([c for c in conges if c.get('statut') == 'APPROUVE']),
        'total_conges': len(conges),
        'fiches_paie': len(fiches_paie),
        'notifications_non_lues': len([n for n in notifications if not n.get('est_lue')]),
        'taches_en_cours': len([t for t in taches if t.get('statut') in ['A_FAIRE', 'EN_COURS']]),
        'presences_ce_mois': len([p for p in presences if p.get('statut') == 'PRESENT']),
    }

    return Response({
        'user': data,
        'profil_employe': profil_employe,
        'conges': conges,
        'fiches_paie': fiches_paie,
        'presences': presences,
        'notifications': notifications,
        'taches': taches,
        'stats': stats
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def changer_mon_mot_de_passe(request):
    """Permet à l'utilisateur de changer son mot de passe."""
    user = request.user
    ancien = request.data.get('ancien_mot_de_passe')
    nouveau = request.data.get('nouveau_mot_de_passe')
    confirmation = request.data.get('confirmation')

    if not ancien or not nouveau:
        return Response({"erreur": "Tous les champs sont requis."}, status=400)

    if not user.check_password(ancien):
        return Response({"erreur": "L'ancien mot de passe est incorrect."}, status=400)

    if nouveau != confirmation:
        return Response({"erreur": "Le nouveau mot de passe et la confirmation ne correspondent pas."}, status=400)

    if len(nouveau) < 8:
        return Response({"erreur": "Le mot de passe doit faire au moins 8 caractères."}, status=400)

    user.set_password(nouveau)
    user.save()

    return Response({"message": "Mot de passe changé avec succès."})


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def modifier_mon_profil(request):
    """Permet à l'utilisateur de modifier ses informations personnelles."""
    user = request.user

    champs_modifiables = ['first_name', 'last_name', 'email', 'phone']
    for champ in champs_modifiables:
        if champ in request.data:
            setattr(user, champ, request.data[champ])
    
    if 'signature' in request.FILES:
        user.signature = request.FILES['signature']

    user.save()
    return Response(UserSerializer(user, context={'request': request}).data)





