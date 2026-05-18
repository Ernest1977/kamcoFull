from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import (
    CategorieEquipementViewSet,
    EquipementViewSet,
    CertificationEquipementViewSet,
    PlanMaintenancePreventiveViewSet,
    InterventionMaintenanceViewSet,
    ConsommationCarburantViewSet,
    MouvementEquipementViewSet,
    CycleVieEquipementViewSet,
    CapteurIoTViewSet,
    AlerteIoTViewSet,
    RegleAlerteIoTViewSet,
    dashboard_equipements,
    rapport_utilisation,
    rapport_maintenance,
    rapport_carburant,
    rapport_rentabilite_view,
    lancer_verifications,
    recevoir_telemetrie,
    dashboard_iot
)

router = DefaultRouter()
router.register(r'categories', CategorieEquipementViewSet, basename='categorie-equipement')
router.register(r'equipements', EquipementViewSet, basename='equipement')
router.register(r'certifications', CertificationEquipementViewSet, basename='certification')
router.register(r'plans-maintenance', PlanMaintenancePreventiveViewSet, basename='plan-maintenance')
router.register(r'interventions', InterventionMaintenanceViewSet, basename='intervention')
router.register(r'carburant', ConsommationCarburantViewSet, basename='carburant')
router.register(r'mouvements', MouvementEquipementViewSet, basename='mouvement-equipement')
router.register(r'cycle-vie', CycleVieEquipementViewSet, basename='cycle-vie')
router.register(r'capteurs', CapteurIoTViewSet, basename='capteur-iot')
router.register(r'alertes-iot', AlerteIoTViewSet, basename='alerte-iot')
router.register(r'regles-alertes', RegleAlerteIoTViewSet, basename='regle-alerte')

urlpatterns = [
    # Dashboard
    path('dashboard/', dashboard_equipements, name='dashboard-equipements'),
    path('dashboard/iot/', dashboard_iot, name='dashboard-iot'),

    # Rapports
    path('rapports/utilisation/', rapport_utilisation, name='rapport-utilisation'),
    path('rapports/maintenance/', rapport_maintenance, name='rapport-maintenance'),
    path('rapports/carburant/', rapport_carburant, name='rapport-carburant'),
    path('rapports/rentabilite/', rapport_rentabilite_view, name='rapport-rentabilite'),

    # Automatisations
    path('verifications/', lancer_verifications, name='lancer-verifications'),

    # IoT
    path('iot/telemetrie/', recevoir_telemetrie, name='recevoir-telemetrie'),
] + router.urls