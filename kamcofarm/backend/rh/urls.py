from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import (
    DepartementViewSet,
    EmployeViewSet,
    ContratTravailViewSet,
    DemandeCongeViewSet,
    PresenceViewSet,
    FichePaieViewSet,
    dashboard_rh,
    mon_profil_employe,
    mes_conges,
    demander_conge,
    mes_fiches_paie,
    telecharger_bulletin_pdf
)

router = DefaultRouter()
router.register(r'departements', DepartementViewSet, basename='departement')
router.register(r'employes', EmployeViewSet, basename='employe')
router.register(r'contrats', ContratTravailViewSet, basename='contrat')
router.register(r'conges', DemandeCongeViewSet, basename='conge')
router.register(r'presences', PresenceViewSet, basename='presence')
router.register(r'fiches-paie', FichePaieViewSet, basename='fiche-paie')

urlpatterns = [
    # Dashboard RH
    path('dashboard/', dashboard_rh, name='dashboard-rh'),

    # Espace employé (self-service)
    path('mon-profil/', mon_profil_employe, name='mon-profil'),
    path('mes-conges/', mes_conges, name='mes-conges'),
    path('demander-conge/', demander_conge, name='demander-conge'),
    path('mes-fiches-paie/', mes_fiches_paie, name='mes-fiches-paie'),
    path('fiches-paie/<int:pk>/pdf/classique/', telecharger_bulletin_pdf, {'modele': 'classique'}, name='bulletin-classique'),
    path('fiches-paie/<int:pk>/pdf/moderne/', telecharger_bulletin_pdf, {'modele': 'moderne'}, name='bulletin-moderne'),
] + router.urls
