# Create your views here.
from django.db import models
from django.db.models import Q
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from datetime import date
from django.utils import timezone
from django.contrib.auth import get_user_model
from accounts.permissions import IsAdminOrDirector
from drf_spectacular.utils import extend_schema, extend_schema_view
from .models import ConsentementRGPD, DemandeRGPD

from .models import (
    LogActivite,
    Notification,
    AnnonceInterne,
    ParametreGlobal,
    TacheInterne,
    HistoriqueModification
)

from .serializers import (
    LogActiviteSerializer,
    NotificationSerializer,
    AnnonceInterneSerializer,
    ParametreGlobalSerializer,
    TacheInterneSerializer,
    TacheResumeSerializer,
    HistoriqueModificationSerializer
)

import logging
logger = logging.getLogger(__name__)


# ========================================
# UTILITAIRE : CRÉER UN LOG
# ========================================
def creer_log(utilisateur, action, module, description,
              severite='INFO', objet_type=None, objet_id=None,
              objet_representation=None, donnees_avant=None,
              donnees_apres=None, request=None):
    """
    Fonction utilitaire pour créer un log d'activité.
    Utilisable depuis n'importe quelle app.
    """
    ip = None
    user_agent = None

    if request:
        ip = request.META.get('REMOTE_ADDR')
        user_agent = request.META.get('HTTP_USER_AGENT', '')[:500]

    LogActivite.objects.create(
        utilisateur=utilisateur,
        action=action,
        module=module,
        severite=severite,
        description=description,
        objet_type=objet_type,
        objet_id=objet_id,
        objet_representation=objet_representation,
        donnees_avant=donnees_avant,
        donnees_apres=donnees_apres,
        ip_address=ip,
        user_agent=user_agent
    )


# ========================================
# UTILITAIRE : CRÉER UNE NOTIFICATION
# ========================================
def creer_notification(destinataire, titre, message,
                       type_notification='INFO', priorite='NORMALE',
                       expediteur=None, lien_url=None,
                       lien_module=None, lien_objet_id=None):
    """
    Fonction utilitaire pour créer une notification.
    Utilisable depuis n'importe quelle app.
    """
    Notification.objects.create(
        destinataire=destinataire,
        expediteur=expediteur,
        titre=titre,
        message=message,
        type_notification=type_notification,
        priorite=priorite,
        lien_url=lien_url,
        lien_module=lien_module,
        lien_objet_id=lien_objet_id
    )


# ========================================
# LOG D'ACTIVITÉ
# ========================================

@extend_schema_view(
    list=extend_schema(tags=['Administration'], summary='Liste des logs'),
    retrieve=extend_schema(tags=['Administration'], summary='Détail d\'un log'),
)

class LogActiviteViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Consultation des logs d'activité.
    Accessible par : ADMIN, DIR uniquement.
    """
    queryset = LogActivite.objects.all()
    serializer_class = LogActiviteSerializer
    permission_classes = [IsAdminOrDirector]

    def get_queryset(self):
        qs = LogActivite.objects.select_related('utilisateur').all()

        action = self.request.query_params.get('action')
        module = self.request.query_params.get('module')
        severite = self.request.query_params.get('severite')
        utilisateur = self.request.query_params.get('utilisateur')
        date_debut = self.request.query_params.get('date_debut')
        date_fin = self.request.query_params.get('date_fin')
        recherche = self.request.query_params.get('q')

        if action:
            qs = qs.filter(action=action.upper())
        if module:
            qs = qs.filter(module=module.upper())
        if severite:
            qs = qs.filter(severite=severite.upper())
        if utilisateur:
            qs = qs.filter(utilisateur__username__icontains=utilisateur)
        if date_debut:
            qs = qs.filter(date_action__gte=date_debut)
        if date_fin:
            qs = qs.filter(date_action__lte=date_fin)
        if recherche:
            qs = qs.filter(description__icontains=recherche)

        return qs[:500]  # Limiter pour la performance


# ========================================
# NOTIFICATION
# ========================================
class NotificationViewSet(viewsets.ModelViewSet):
    """
    CRUD Notifications.
    - Chaque utilisateur voit uniquement ses propres notifications.
    - ADMIN/DIR peuvent envoyer des notifications.
    """
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Notification.objects.filter(destinataire=user)

        est_lue = self.request.query_params.get('lue')
        type_n = self.request.query_params.get('type')
        priorite = self.request.query_params.get('priorite')

        if est_lue is not None:
            qs = qs.filter(est_lue=(est_lue.lower() == 'true'))
        if type_n:
            qs = qs.filter(type_notification=type_n.upper())
        if priorite:
            qs = qs.filter(priorite=priorite.upper())

        return qs

    def perform_create(self, serializer):
        notification = serializer.save(expediteur=self.request.user)

        # Envoyer par email si priorité haute ou urgente
        if notification.priorite in ['HAUTE', 'URGENTE']:
            from administration.email_service import envoyer_email_notification
            envoyer_email_notification(notification)

    @action(detail=True, methods=['post'])
    def marquer_lue(self, request, pk=None):
        notification = self.get_object()
        notification.est_lue = True
        notification.date_lecture = timezone.now()
        notification.save()
        return Response(
            NotificationSerializer(notification, context={'request': request}).data
        )

    @action(detail=False, methods=['post'])
    def marquer_toutes_lues(self, request):
        updated = Notification.objects.filter(
            destinataire=request.user,
            est_lue=False
        ).update(est_lue=True, date_lecture=timezone.now())

        return Response({
            "message": f"{updated} notification(s) marquée(s) comme lue(s)."
        })

    @action(detail=False, methods=['get'])
    def non_lues(self, request):
        count = Notification.objects.filter(
            destinataire=request.user,
            est_lue=False
        ).count()

        notifications = Notification.objects.filter(
            destinataire=request.user,
            est_lue=False
        )[:10]

        serializer = NotificationSerializer(
            notifications, many=True, context={'request': request}
        )

        return Response({
            "count": count,
            "notifications": serializer.data
        })


# ========================================
# ANNONCE INTERNE
# ========================================
class AnnonceInterneViewSet(viewsets.ModelViewSet):
    """
    CRUD Annonces internes.
    - Lecture : employés connectés (filtrée par rôle)
    - Écriture : ADMIN, DIR
    """
    queryset = AnnonceInterne.objects.all()
    serializer_class = AnnonceInterneSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAdminOrDirector()]

    def get_queryset(self):
        qs = AnnonceInterne.objects.filter(est_active=True)
        user = self.request.user

        # Filtrer par destinataire
        if user.role not in ['ADMIN', 'DIR']:
            from django.db.models import Q
            qs = qs.filter(
                Q(destinataires='TOUS') | Q(destinataires=user.role)
            )

        # Exclure les annonces expirées
        qs = qs.filter(
            Q(date_expiration__isnull=True) |
            Q(date_expiration__gte=timezone.now())
        )

        return qs

    def perform_create(self, serializer):
        serializer.save(publiee_par=self.request.user)


# ========================================
# PARAMÈTRE GLOBAL
# ========================================
class ParametreGlobalViewSet(viewsets.ModelViewSet):
    """
    CRUD Paramètres globaux.
    Accessible par : ADMIN, DIR uniquement.
    """
    queryset = ParametreGlobal.objects.all()
    serializer_class = ParametreGlobalSerializer
    permission_classes = [IsAdminOrDirector]
    lookup_field = 'cle'

    def get_queryset(self):
        qs = ParametreGlobal.objects.all()
        categorie = self.request.query_params.get('categorie')
        visible = self.request.query_params.get('visible')

        if categorie:
            qs = qs.filter(categorie=categorie.upper())
        if visible is not None:
            qs = qs.filter(est_visible=(visible.lower() == 'true'))

        return qs

    def perform_update(self, serializer):
        instance = serializer.save(modifie_par=self.request.user)

        # Logger la modification
        creer_log(
            utilisateur=self.request.user,
            action='MODIFICATION',
            module='ADMINISTRATION',
            description=f"Paramètre '{instance.label}' modifié : {instance.valeur}",
            objet_type='ParametreGlobal',
            objet_id=instance.id,
            objet_representation=str(instance),
            request=self.request
        )


# ========================================
# TÂCHE INTERNE
# ========================================
class TacheInterneViewSet(viewsets.ModelViewSet):
    """
    CRUD Tâches internes.
    - Chaque utilisateur voit ses tâches assignées.
    - ADMIN/DIR voient tout.
    """
    queryset = TacheInterne.objects.all()
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list':
            return TacheResumeSerializer
        return TacheInterneSerializer

    def get_queryset(self):
        user = self.request.user
        qs = TacheInterne.objects.select_related('assignee_a', 'creee_par').all()

        # Non-admins voient uniquement leurs tâches
        if user.role not in ['ADMIN', 'DIR']:
            qs = qs.filter(assignee_a=user)

        statut = self.request.query_params.get('statut')
        priorite = self.request.query_params.get('priorite')
        assignee = self.request.query_params.get('assignee')

        if statut:
            qs = qs.filter(statut=statut.upper())
        if priorite:
            qs = qs.filter(priorite=priorite.upper())
        if assignee:
            qs = qs.filter(assignee_a__username__icontains=assignee)

        return qs

    def perform_create(self, serializer):
        tache = serializer.save(creee_par=self.request.user)

        # Notifier l'assigné
        if tache.assignee_a and tache.assignee_a != self.request.user:
            creer_notification(
                destinataire=tache.assignee_a,
                titre=f"Nouvelle tâche : {tache.titre}",
                message=f"Une nouvelle tâche vous a été assignée par {self.request.user.username}.",
                type_notification='TACHE',
                priorite=tache.priorite,
                expediteur=self.request.user
            )

            # Envoyer aussi par email
            from administration.email_service import envoyer_email_tache_assignee
            envoyer_email_tache_assignee(tache, expediteur=self.request.user)

    @action(detail=True, methods=['post'])
    def changer_statut(self, request, pk=None):
        tache = self.get_object()
        nouveau_statut = request.data.get('statut')

        statuts_valides = [s[0] for s in TacheInterne.STATUT_CHOICES]
        if nouveau_statut not in statuts_valides:
            return Response(
                {"erreur": f"Statut invalide. Valides : {statuts_valides}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        ancien_statut = tache.statut
        tache.statut = nouveau_statut

        if nouveau_statut == 'TERMINEE':
            tache.date_fin = timezone.now().date()
        elif nouveau_statut == 'EN_COURS' and not tache.date_debut:
            tache.date_debut = timezone.now().date()

        tache.save()

        # Logger le changement
        creer_log(
            utilisateur=request.user,
            action='MODIFICATION',
            module='ADMINISTRATION',
            description=f"Tâche '{tache.titre}' : {ancien_statut} → {nouveau_statut}",
            objet_type='TacheInterne',
            objet_id=tache.id,
            request=request
        )

        return Response(
            TacheInterneSerializer(tache, context={'request': request}).data
        )

    @action(detail=True, methods=['post'])
    def reassigner(self, request, pk=None):
        tache = self.get_object()
        user_id = request.data.get('user_id')

        if not user_id:
            return Response(
                {"erreur": "user_id requis."},
                status=status.HTTP_400_BAD_REQUEST
            )

        from django.contrib.auth import get_user_model
        User = get_user_model()

        try:
            nouveau_user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response(
                {"erreur": "Utilisateur introuvable."},
                status=status.HTTP_404_NOT_FOUND
            )

        tache.assignee_a = nouveau_user
        tache.save()

        # Notifier le nouveau assigné
        creer_notification(
            destinataire=nouveau_user,
            titre=f"Tâche reassignée : {tache.titre}",
            message=f"La tâche '{tache.titre}' vous a été reassignée par {request.user.username}.",
            type_notification='TACHE',
            expediteur=request.user
        )

        return Response(
            TacheInterneSerializer(tache, context={'request': request}).data
        )


# ========================================
# DASHBOARD GLOBAL
# ========================================
@api_view(['GET'])
@permission_classes([IsAdminOrDirector])
def dashboard_global(request):
    """
    Tableau de bord global de l'entreprise.
    Agrège les données de tous les modules.
    """
    from django.db.models import Sum, Count, Q
    from datetime import date, timedelta

    aujourdhui = date.today()
    debut_mois = aujourdhui.replace(day=1)

    # ---- UTILISATEURS ----
    from django.contrib.auth import get_user_model
    User = get_user_model()
    total_utilisateurs = User.objects.filter(is_active=True).count()

    # ---- PRODUITS ----
    from produits.models import ProduitAgricole
    total_produits = ProduitAgricole.objects.count()

    # ---- SUPPLYCHAIN ----
    try:
        from supplychain.models import CommandeClient, Fournisseur, Livraison
        commandes_en_cours = CommandeClient.objects.exclude(
            statut__in=['LIVREE', 'ANNULEE']
        ).count()
        commandes_ce_mois = CommandeClient.objects.filter(
            date_commande__gte=debut_mois
        ).count()
        fournisseurs_actifs = Fournisseur.objects.filter(est_actif=True).count()
        livraisons_en_transit = Livraison.objects.filter(statut='EN_TRANSIT').count()
    except ImportError:
        commandes_en_cours = 0
        commandes_ce_mois = 0
        fournisseurs_actifs = 0
        livraisons_en_transit = 0

    # ---- RH ----
    try:
        from rh.models import Employe, DemandeConge, Presence
        total_employes = Employe.objects.filter(est_actif=True).count()
        conges_en_attente = DemandeConge.objects.filter(statut='EN_ATTENTE').count()
        presents_aujourdhui = Presence.objects.filter(
            date=aujourdhui, statut='PRESENT'
        ).count()
    except ImportError:
        total_employes = 0
        conges_en_attente = 0
        presents_aujourdhui = 0

    # ---- FINANCE ----
    try:
        from finance.models import Facture, DemandeDevis, DepenseOperationnelle
        factures_impayees = Facture.objects.filter(
            statut__in=['ENVOYEE', 'PARTIELLEMENT_PAYEE', 'EN_RETARD']
        ).count()
        ca_ce_mois = Facture.objects.filter(
            statut='PAYEE',
            date_emission__gte=debut_mois
        ).aggregate(total=Sum('montant_ttc'))['total'] or 0
        devis_non_traites = DemandeDevis.objects.filter(traite=False).count()
        depenses_en_attente = DepenseOperationnelle.objects.filter(
            statut='EN_ATTENTE'
        ).count()
    except ImportError:
        factures_impayees = 0
        ca_ce_mois = 0
        devis_non_traites = 0
        depenses_en_attente = 0

    # ---- MARKETING ----
    try:
        from marketing.models import Lead, CampagneMarketing, AbonneNewsletter
        leads_nouveaux = Lead.objects.filter(statut='NOUVEAU').count()
        campagnes_en_cours = CampagneMarketing.objects.filter(statut='EN_COURS').count()
        total_abonnes = AbonneNewsletter.objects.filter(est_actif=True).count()
    except ImportError:
        leads_nouveaux = 0
        campagnes_en_cours = 0
        total_abonnes = 0

    # ---- CONTENT ----
    try:
        from content.models import PageContenu, DocumentInterne
        pages_publiees = PageContenu.objects.filter(statut='PUBLIEE').count()
        total_documents = DocumentInterne.objects.filter(est_actif=True).count()
    except ImportError:
        pages_publiees = 0
        total_documents = 0

    # ---- TÂCHES ----
    taches_a_faire = TacheInterne.objects.filter(
        statut__in=['A_FAIRE', 'EN_COURS']
    ).count()
    taches_en_retard = TacheInterne.objects.filter(
        statut__in=['A_FAIRE', 'EN_COURS'],
        date_echeance__lt=aujourdhui
    ).count()

    # ---- NOTIFICATIONS NON LUES ----
    notifs_non_lues = Notification.objects.filter(
        destinataire=request.user,
        est_lue=False
    ).count()

    # ---- LOGS RÉCENTS ----
    logs_recents = LogActiviteSerializer(
        LogActivite.objects.all()[:10],
        many=True,
        context={'request': request}
    ).data

    # ---- ANNONCES ACTIVES ----
    annonces_actives = AnnonceInterne.objects.filter(
        est_active=True
    ).filter(
        Q(date_expiration__isnull=True) | Q(date_expiration__gte=timezone.now())
    ).count()

    return Response({
        'date': str(aujourdhui),
        'utilisateurs_actifs': total_utilisateurs,
        'produits': total_produits,
        'supplychain': {
            'commandes_en_cours': commandes_en_cours,
            'commandes_ce_mois': commandes_ce_mois,
            'fournisseurs_actifs': fournisseurs_actifs,
            'livraisons_en_transit': livraisons_en_transit,
        },
        'rh': {
            'total_employes': total_employes,
            'conges_en_attente': conges_en_attente,
            'presents_aujourdhui': presents_aujourdhui,
        },
        'finance': {
            'factures_impayees': factures_impayees,
            'ca_ce_mois': float(ca_ce_mois),
            'devis_non_traites': devis_non_traites,
            'depenses_en_attente': depenses_en_attente,
        },
        'marketing': {
            'leads_nouveaux': leads_nouveaux,
            'campagnes_en_cours': campagnes_en_cours,
            'abonnes_newsletter': total_abonnes,
        },
        'content': {
            'pages_publiees': pages_publiees,
            'documents_internes': total_documents,
        },
        'taches': {
            'a_faire': taches_a_faire,
            'en_retard': taches_en_retard,
        },
        'notifications_non_lues': notifs_non_lues,
        'annonces_actives': annonces_actives,
        'logs_recents': logs_recents,
    })


@api_view(['GET'])
@permission_classes([IsAdminOrDirector])
def suivi_communications(request):
    """
    Vue d'audit de toutes les notifications, tâches et annonces
    avec statut de lecture pour les administrateurs.
    """
    
    User = get_user_model()

    # Toutes les notifications du système
    toutes_notifs = Notification.objects.select_related(
        'destinataire', 'expediteur'
    ).order_by('-date_creation')[:100]

    notifs_data = []
    for n in toutes_notifs:
        notifs_data.append({
            'id': n.id,
            'titre': n.titre,
            'message': n.message[:200],
            'type': n.type_notification,
            'priorite': n.priorite,
            'expediteur': n.expediteur.username if n.expediteur else 'Système',
            'destinataire': n.destinataire.username,
            'destinataire_nom': n.destinataire.get_full_name() or n.destinataire.username,
            'est_lue': n.est_lue,
            'date_lecture': n.date_lecture.isoformat() if n.date_lecture else None,
            'date_creation': n.date_creation.isoformat(),
        })

    # Toutes les tâches
    toutes_taches = TacheInterne.objects.select_related(
        'assignee_a', 'creee_par'
    ).order_by('-date_creation')[:100]

    taches_data = []
    for t in toutes_taches:
        taches_data.append({
            'id': t.id,
            'titre': t.titre,
            'statut': t.statut,
            'priorite': t.priorite,
            'assignee_a': t.assignee_a.username if t.assignee_a else 'Non assigné',
            'assignee_a_nom': t.assignee_a.get_full_name() or t.assignee_a.username if t.assignee_a else 'Non assigné',
            'creee_par': t.creee_par.username if t.creee_par else 'Système',
            'date_echeance': str(t.date_echeance) if t.date_echeance else None,
            'date_debut': str(t.date_debut) if t.date_debut else None,
            'date_fin': str(t.date_fin) if t.date_fin else None,
            'date_creation': t.date_creation.isoformat(),
            'est_en_retard': t.date_echeance and t.statut not in ['TERMINEE', 'ANNULEE'] and t.date_echeance < date.today() if t.date_echeance else False,
            'consultee': t.statut != 'A_FAIRE',
        })

    # Toutes les annonces
    toutes_annonces = AnnonceInterne.objects.select_related(
        'publiee_par'
    ).order_by('-date_publication')[:50]

    annonces_data = []
    for a in toutes_annonces:
        annonces_data.append({
            'id': a.id,
            'titre': a.titre,
            'priorite': a.priorite,
            'destinataires': a.destinataires,
            'publiee_par': a.publiee_par.username if a.publiee_par else 'Système',
            'est_active': a.est_active,
            'est_epinglee': a.est_epinglee,
            'date_publication': a.date_publication.isoformat(),
            'date_expiration': a.date_expiration.isoformat() if a.date_expiration else None,
        })

    # Statistiques
    total_notifs = Notification.objects.count()
    notifs_lues = Notification.objects.filter(est_lue=True).count()
    notifs_non_lues = total_notifs - notifs_lues
    taux_lecture = round((notifs_lues / total_notifs * 100), 1) if total_notifs > 0 else 0

    return Response({
        'statistiques': {
            'total_notifications': total_notifs,
            'notifications_lues': notifs_lues,
            'notifications_non_lues': notifs_non_lues,
            'taux_lecture': taux_lecture,
            'total_taches': TacheInterne.objects.count(),
            'taches_terminees': TacheInterne.objects.filter(statut='TERMINEE').count(),
            'total_annonces': AnnonceInterne.objects.filter(est_active=True).count(),
        },
        'notifications': notifs_data,
        'taches': taches_data,
        'annonces': annonces_data,
    })



@extend_schema(tags=['Administration'], summary='Recherche globale', parameters=[
    {'name': 'q', 'in': 'query', 'required': True, 'schema': {'type': 'string'}, 'description': 'Terme de recherche (min 2 caractères)'}
])
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def recherche_globale(request):
    """
    Recherche dans tous les modules du système.
    Usage : GET /api/administration/recherche/?q=mot_cle
    """
    from django.db.models import Q

    query = request.query_params.get('q', '').strip()
    if not query or len(query) < 2:
        return Response({"erreur": "Le terme de recherche doit faire au moins 2 caractères."}, status=400)

    resultats = {
        'query': query,
        'total': 0,
        'categories': []
    }

    # ========================================
    # PRODUITS
    # ========================================
    try:
        from produits.models import ProduitAgricole
        produits = ProduitAgricole.objects.filter(
            Q(nom__icontains=query) | Q(description_fr__icontains=query) | Q(type_produit__icontains=query)
        )[:5]
        if produits.exists():
            resultats['categories'].append({
                'nom': 'Produits',
                'icone': '🍍',
                'module': 'produits',
                'items': [{'id': p.id, 'titre': p.nom, 'sous_titre': f'{p.get_type_produit_display()} — {p.prix_unitaire_fcfa} FCFA', 'type': 'produit'} for p in produits]
            })
            resultats['total'] += produits.count()
    except Exception as e:
        logger.warning(f"Recherche produits: {e}")

    # ========================================
    # COMMANDES CLIENTS
    # ========================================
    try:
        from supplychain.models import CommandeClient
        commandes = CommandeClient.objects.filter(
            Q(reference__icontains=query) | Q(client_nom__icontains=query) | Q(client_entreprise__icontains=query) | Q(destination__icontains=query)
        )[:5]
        if commandes.exists():
            resultats['categories'].append({
                'nom': 'Commandes',
                'icone': '📦',
                'module': 'supplychain',
                'items': [{'id': c.id, 'titre': c.reference, 'sous_titre': f'{c.client_nom} — {c.destination} ({c.get_statut_display()})', 'type': 'commande'} for c in commandes]
            })
            resultats['total'] += commandes.count()
    except Exception as e:
        logger.warning(f"Recherche commandes: {e}")

    # ========================================
    # FOURNISSEURS
    # ========================================
    try:
        from supplychain.models import Fournisseur
        fournisseurs = Fournisseur.objects.filter(
            Q(nom__icontains=query) | Q(contact_nom__icontains=query) | Q(email__icontains=query)
        )[:5]
        if fournisseurs.exists():
            resultats['categories'].append({
                'nom': 'Fournisseurs',
                'icone': '🏭',
                'module': 'supplychain',
                'items': [{'id': f.id, 'titre': f.nom, 'sous_titre': f'{f.get_type_fournisseur_display()} — {f.pays}', 'type': 'fournisseur'} for f in fournisseurs]
            })
            resultats['total'] += fournisseurs.count()
    except Exception as e:
        logger.warning(f"Recherche fournisseurs: {e}")

    # ========================================
    # FACTURES
    # ========================================
    try:
        from finance.models import Facture
        factures = Facture.objects.filter(
            Q(numero__icontains=query) | Q(client_nom__icontains=query) | Q(client_entreprise__icontains=query)
        )[:5]
        if factures.exists():
            resultats['categories'].append({
                'nom': 'Factures',
                'icone': '📄',
                'module': 'finance',
                'items': [{'id': f.id, 'titre': f.numero, 'sous_titre': f'{f.client_nom} — {f.montant_ttc} {f.devise} ({f.get_statut_display()})', 'type': 'facture'} for f in factures]
            })
            resultats['total'] += factures.count()
    except Exception as e:
        logger.warning(f"Recherche factures: {e}")

    # ========================================
    # EMPLOYÉS
    # ========================================
    try:
        from rh.models import Employe
        employes = Employe.objects.filter(
            Q(matricule__icontains=query) | Q(nom_complet__icontains=query) | Q(poste__icontains=query) |
            Q(user__username__icontains=query) | Q(user__first_name__icontains=query) | Q(user__last_name__icontains=query)
        )[:5]
        if employes.exists():
            resultats['categories'].append({
                'nom': 'Employés',
                'icone': '👥',
                'module': 'rh',
                'items': [{'id': e.id, 'titre': e.nom_affiche, 'sous_titre': f'{e.matricule} — {e.poste or "N/A"}', 'type': 'employe'} for e in employes]
            })
            resultats['total'] += employes.count()
    except Exception as e:
        logger.warning(f"Recherche employes: {e}")

    # ========================================
    # LEADS
    # ========================================
    try:
        from marketing.models import Lead
        leads = Lead.objects.filter(
            Q(reference__icontains=query) | Q(nom__icontains=query) | Q(entreprise__icontains=query) | Q(email__icontains=query)
        )[:5]
        if leads.exists():
            resultats['categories'].append({
                'nom': 'Leads',
                'icone': '🎯',
                'module': 'marketing',
                'items': [{'id': l.id, 'titre': f'{l.nom} {l.prenom or ""}', 'sous_titre': f'{l.reference} — {l.entreprise or "Particulier"} ({l.get_statut_display()})', 'type': 'lead'} for l in leads]
            })
            resultats['total'] += leads.count()
    except Exception as e:
        logger.warning(f"Recherche leads: {e}")

    # ========================================
    # ÉQUIPEMENTS
    # ========================================
    try:
        from equipements.models import Equipement
        equipements = Equipement.objects.filter(
            Q(reference__icontains=query) | Q(nom__icontains=query) | Q(marque__icontains=query) | Q(numero_serie__icontains=query)
        )[:5]
        if equipements.exists():
            resultats['categories'].append({
                'nom': 'Équipements',
                'icone': '🚜',
                'module': 'equipements',
                'items': [{'id': e.id, 'titre': e.nom, 'sous_titre': f'{e.reference} — {e.get_statut_display()}', 'type': 'equipement'} for e in equipements]
            })
            resultats['total'] += equipements.count()
    except Exception as e:
        logger.warning(f"Recherche equipements: {e}")

    # ========================================
    # CONTRATS LOCATION
    # ========================================
    try:
        from location.models import ContratLocation
        contrats = ContratLocation.objects.filter(
            Q(reference__icontains=query) | Q(client_nom__icontains=query) | Q(client_entreprise__icontains=query)
        )[:5]
        if contrats.exists():
            resultats['categories'].append({
                'nom': 'Contrats Location',
                'icone': '📋',
                'module': 'location',
                'items': [{'id': c.id, 'titre': c.reference, 'sous_titre': f'{c.client_nom} — {c.get_statut_display()}', 'type': 'contrat_location'} for c in contrats]
            })
            resultats['total'] += contrats.count()
    except Exception as e:
        logger.warning(f"Recherche contrats: {e}")

    # ========================================
    # UTILISATEURS
    # ========================================
    try:
        from django.contrib.auth import get_user_model
        User = get_user_model()
        users = User.objects.filter(
            Q(username__icontains=query) | Q(first_name__icontains=query) | Q(last_name__icontains=query) | Q(email__icontains=query)
        )[:5]
        if users.exists():
            resultats['categories'].append({
                'nom': 'Utilisateurs',
                'icone': '👤',
                'module': 'accounts',
                'items': [{'id': u.id, 'titre': u.get_full_name() or u.username, 'sous_titre': f'@{u.username} — {u.get_role_display()}', 'type': 'utilisateur'} for u in users]
            })
            resultats['total'] += users.count()
    except Exception as e:
        logger.warning(f"Recherche users: {e}")

    return Response(resultats)



class HistoriqueModificationViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = HistoriqueModification.objects.all()
    serializer_class = HistoriqueModificationSerializer
    permission_classes = [IsAdminOrDirector]

    def get_queryset(self):
        qs = HistoriqueModification.objects.select_related('utilisateur').all()

        module = self.request.query_params.get('module')
        objet_type = self.request.query_params.get('type')
        objet_id = self.request.query_params.get('id')
        utilisateur = self.request.query_params.get('utilisateur')
        action = self.request.query_params.get('action')

        if module:
            qs = qs.filter(module__icontains=module)
        if objet_type:
            qs = qs.filter(objet_type__icontains=objet_type)
        if objet_id:
            qs = qs.filter(objet_id=objet_id)
        if utilisateur:
            qs = qs.filter(utilisateur__username__icontains=utilisateur)
        if action:
            qs = qs.filter(action=action.upper())

        return qs[:200]




@api_view(['GET'])
@permission_classes([IsAuthenticated])
def evenements_calendrier(request):
    """
    Retourne tous les événements pour le calendrier.
    Paramètres : start, end (dates ISO)
    """
    from datetime import datetime

    start = request.query_params.get('start')
    end = request.query_params.get('end')

    events = []

    # ========================================
    # CONGÉS
    # ========================================
    try:
        from rh.models import DemandeConge
        conges_qs = DemandeConge.objects.select_related('employe__user').all()
        if start:
            conges_qs = conges_qs.filter(date_fin__gte=start)
        if end:
            conges_qs = conges_qs.filter(date_debut__lte=end)

        couleurs_conge = {
            'EN_ATTENTE': '#FF9800',
            'APPROUVE': '#4CAF50',
            'REFUSE': '#F44336',
            'ANNULE': '#9E9E9E',
        }

        for conge in conges_qs:
            nom = conge.employe.nom_affiche if hasattr(conge.employe, 'nom_affiche') else conge.employe.user.username
            events.append({
                'id': f'conge_{conge.id}',
                'title': f'📅 {nom} — {conge.get_type_conge_display()}',
                'start': str(conge.date_debut),
                'end': str(conge.date_fin),
                'color': couleurs_conge.get(conge.statut, '#FF9800'),
                'type': 'conge',
                'module': 'rh',
                'statut': conge.statut,
                'details': {
                    'employe': nom,
                    'type': conge.get_type_conge_display(),
                    'jours': conge.nombre_jours,
                    'statut': conge.get_statut_display(),
                    'motif': conge.motif or '',
                }
            })
    except Exception as e:
        logger.warning(f"Calendrier congés: {e}")

    # ========================================
    # MAINTENANCE
    # ========================================
    try:
        from equipements.models import InterventionMaintenance
        maint_qs = InterventionMaintenance.objects.select_related('equipement').all()
        if start:
            maint_qs = maint_qs.filter(date_planifiee__gte=start)
        if end:
            maint_qs = maint_qs.filter(date_planifiee__lte=end)

        couleurs_maint = {
            'PLANIFIEE': '#2196F3',
            'EN_COURS': '#FF9800',
            'EN_ATTENTE_PIECES': '#9C27B0',
            'TERMINEE': '#4CAF50',
            'ANNULEE': '#9E9E9E',
        }

        for maint in maint_qs:
            eq_nom = maint.equipement.nom if maint.equipement else 'N/A'
            date_str = str(maint.date_planifiee) if maint.date_planifiee else str(maint.date_creation.date())

            events.append({
                'id': f'maint_{maint.id}',
                'title': f'🔧 {eq_nom} — {maint.get_type_intervention_display()}',
                'start': date_str,
                'color': couleurs_maint.get(maint.statut, '#2196F3'),
                'type': 'maintenance',
                'module': 'equipements',
                'statut': maint.statut,
                'details': {
                    'reference': maint.reference,
                    'equipement': eq_nom,
                    'type': maint.get_type_intervention_display(),
                    'priorite': maint.get_priorite_display(),
                    'statut': maint.get_statut_display(),
                    'cout': float(maint.cout_total or 0),
                }
            })
    except Exception as e:
        logger.warning(f"Calendrier maintenance: {e}")

    # ========================================
    # LOCATIONS (Contrats)
    # ========================================
    try:
        from location.models import ContratLocation
        loc_qs = ContratLocation.objects.select_related('equipement').all()
        if start:
            loc_qs = loc_qs.filter(date_fin_prevue__gte=start)
        if end:
            loc_qs = loc_qs.filter(date_debut__lte=end)

        couleurs_loc = {
            'BROUILLON': '#9E9E9E',
            'EN_ATTENTE_SIGNATURE': '#FF9800',
            'SIGNE': '#2196F3',
            'ACTIF': '#4CAF50',
            'TERMINE': '#607D8B',
            'RESILIE': '#F44336',
            'LITIGE': '#F44336',
        }

        for loc in loc_qs:
            eq_nom = loc.equipement.nom if loc.equipement else 'N/A'
            events.append({
                'id': f'loc_{loc.id}',
                'title': f'📋 {loc.client_nom} — {eq_nom}',
                'start': str(loc.date_debut),
                'end': str(loc.date_fin_prevue),
                'color': couleurs_loc.get(loc.statut, '#4CAF50'),
                'type': 'location',
                'module': 'location',
                'statut': loc.statut,
                'details': {
                    'reference': loc.reference,
                    'client': loc.client_nom,
                    'equipement': eq_nom,
                    'statut': loc.get_statut_display(),
                    'montant': float(loc.montant_total_ttc or 0),
                    'devise': loc.devise,
                }
            })
    except Exception as e:
        logger.warning(f"Calendrier locations: {e}")

    # ========================================
    # RÉSERVATIONS
    # ========================================
    try:
        from location.models import ReservationEquipement
        res_qs = ReservationEquipement.objects.select_related('equipement').filter(
            statut__in=['EN_ATTENTE', 'CONFIRMEE', 'EN_COURS']
        )
        if start:
            res_qs = res_qs.filter(date_fin_prevue__gte=start)
        if end:
            res_qs = res_qs.filter(date_debut_prevue__lte=end)

        for res in res_qs:
            eq_nom = res.equipement.nom if res.equipement else 'N/A'
            events.append({
                'id': f'res_{res.id}',
                'title': f'📌 Réservation {res.client_nom} — {eq_nom}',
                'start': str(res.date_debut_prevue),
                'end': str(res.date_fin_prevue),
                'color': '#E91E63',
                'type': 'reservation',
                'module': 'location',
                'statut': res.statut,
                'details': {
                    'reference': res.reference,
                    'client': res.client_nom,
                    'equipement': eq_nom,
                    'statut': res.get_statut_display(),
                    'montant': float(res.montant_estime or 0),
                }
            })
    except Exception as e:
        logger.warning(f"Calendrier réservations: {e}")

    # ========================================
    # CERTIFICATIONS (expirations)
    # ========================================
    try:
        from equipements.models import CertificationEquipement
        cert_qs = CertificationEquipement.objects.select_related('equipement').filter(statut='VALIDE')
        if start:
            cert_qs = cert_qs.filter(date_expiration__gte=start)
        if end:
            cert_qs = cert_qs.filter(date_expiration__lte=end)

        for cert in cert_qs:
            events.append({
                'id': f'cert_{cert.id}',
                'title': f'📋 Expiration : {cert.nom} ({cert.equipement.nom if cert.equipement else "N/A"})',
                'start': str(cert.date_expiration),
                'color': '#FF5722',
                'type': 'certification',
                'module': 'equipements',
                'details': {
                    'nom': cert.nom,
                    'equipement': cert.equipement.nom if cert.equipement else 'N/A',
                    'jours_restants': cert.jours_restants,
                }
            })
    except Exception as e:
        logger.warning(f"Calendrier certifications: {e}")

    # ========================================
    # TÂCHES (échéances)
    # ========================================
    try:
        taches_qs = TacheInterne.objects.filter(
            date_echeance__isnull=False,
            statut__in=['A_FAIRE', 'EN_COURS']
        ).select_related('assignee_a')

        if start:
            taches_qs = taches_qs.filter(date_echeance__gte=start)
        if end:
            taches_qs = taches_qs.filter(date_echeance__lte=end)

        for tache in taches_qs:
            assignee = tache.assignee_a.username if tache.assignee_a else 'Non assigné'
            events.append({
                'id': f'tache_{tache.id}',
                'title': f'📋 {tache.titre}',
                'start': str(tache.date_echeance),
                'color': '#673AB7',
                'type': 'tache',
                'module': 'admin',
                'details': {
                    'titre': tache.titre,
                    'assignee': assignee,
                    'priorite': tache.get_priorite_display(),
                    'statut': tache.get_statut_display(),
                }
            })
    except Exception as e:
        logger.warning(f"Calendrier tâches: {e}")

    return Response(events)





@api_view(['POST'])
@permission_classes([])
def enregistrer_consentement(request):
    """Enregistre le consentement cookies/RGPD d'un visiteur."""
    consentements = request.data.get('consentements', {})
    ip = request.META.get('REMOTE_ADDR')
    email = request.data.get('email')

    user = request.user if request.user.is_authenticated else None

    for type_c, accepte in consentements.items():
        ConsentementRGPD.objects.update_or_create(
            utilisateur=user,
            email=email,
            ip_address=ip,
            type_consentement=type_c,
            defaults={
                'accepte': accepte,
                'version_politique': '1.0'
            }
        )

    return Response({"message": "Consentements enregistrés"})


@api_view(['POST'])
@permission_classes([])
def soumettre_demande_rgpd(request):
    """Permet à quiconque de soumettre une demande RGPD."""
    from datetime import timedelta

    nom = request.data.get('nom')
    email = request.data.get('email')
    type_d = request.data.get('type_demande')
    description = request.data.get('description', '')

    if not nom or not email or not type_d:
        return Response({"erreur": "Nom, email et type de demande requis."}, status=400)

    demande = DemandeRGPD.objects.create(
        demandeur_nom=nom,
        demandeur_email=email,
        type_demande=type_d,
        description=description,
        date_limite=date.today() + timedelta(days=30)
    )

    return Response({
        "message": "Votre demande RGPD a été enregistrée. Nous avons 30 jours pour y répondre.",
        "reference": demande.id
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mes_donnees_personnelles(request):
    """Permet à un utilisateur de télécharger toutes ses données (portabilité)."""
    user = request.user
    data = {
        'compte': {
            'username': user.username,
            'email': user.email,
            'nom': user.first_name,
            'prenom': user.last_name,
            'telephone': getattr(user, 'phone', ''),
            'role': user.get_role_display(),
            'date_inscription': str(user.date_joined),
        },
        'consentements': list(
            ConsentementRGPD.objects.filter(utilisateur=user).values(
                'type_consentement', 'accepte', 'date_consentement'
            )
        ),
    }

    # Profil employé
    try:
        emp = user.profil_employe
        data['profil_employe'] = {
            'matricule': emp.matricule,
            'poste': emp.poste,
            'date_embauche': str(emp.date_embauche),
            'salaire_base': float(emp.salaire_base),
        }
    except Exception:
        pass

    return Response(data)