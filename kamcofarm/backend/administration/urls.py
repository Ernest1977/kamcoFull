from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import enregistrer_consentement, soumettre_demande_rgpd, mes_donnees_personnelles
from .views import (
    LogActiviteViewSet,
    NotificationViewSet,
    AnnonceInterneViewSet,
    ParametreGlobalViewSet,
    TacheInterneViewSet,
    dashboard_global,
    suivi_communications,
    recherche_globale,
    HistoriqueModificationViewSet,
    evenements_calendrier
)

router = DefaultRouter()
router.register(r'logs', LogActiviteViewSet, basename='log-activite')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'annonces', AnnonceInterneViewSet, basename='annonce')
router.register(r'parametres', ParametreGlobalViewSet, basename='parametre')
router.register(r'taches', TacheInterneViewSet, basename='tache')
router.register(r'historique', HistoriqueModificationViewSet, basename='historique')

urlpatterns = [
    path('dashboard/', dashboard_global, name='dashboard-global'),
    path('suivi/', suivi_communications, name='suivi-communications'),
    path('recherche/', recherche_globale, name='recherche-globale'),
    path('calendrier/', evenements_calendrier, name='calendrier'),
    path('rgpd/consentement/', enregistrer_consentement, name='rgpd-consentement'),
    path('rgpd/demande/', soumettre_demande_rgpd, name='rgpd-demande'),
    path('rgpd/mes-donnees/', mes_donnees_personnelles, name='rgpd-mes-donnees'),
] + router.urls