from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import (
    ReservationEquipementViewSet,
    ContratLocationViewSet,
    EtatDesLieuxViewSet,
    CautionLocationViewSet,
    ServiceAnnexeViewSet,
    FacturationLocationViewSet,
    PaiementLocationViewSet,
    dashboard_location,
    rapport_activite,
    rapport_rentabilite,
    rapport_retards,
    rapport_cautions_view,
    rapport_evolution,
    rapport_dommages_view,
    telecharger_contrat_pdf,
    synchroniser_factures_loc,
    telecharger_facture_location_pdf
)

router = DefaultRouter()
router.register(r'reservations', ReservationEquipementViewSet, basename='reservation')
router.register(r'contrats', ContratLocationViewSet, basename='contrat-location')
router.register(r'etats-des-lieux', EtatDesLieuxViewSet, basename='etat-des-lieux')
router.register(r'cautions', CautionLocationViewSet, basename='caution')
router.register(r'services', ServiceAnnexeViewSet, basename='service-annexe')
router.register(r'facturations', FacturationLocationViewSet, basename='facturation-location')
router.register(r'paiements', PaiementLocationViewSet, basename='paiement-location')

urlpatterns = [
    # Dashboard
    path('dashboard/', dashboard_location, name='dashboard-location'),

    # Rapports
    path('rapports/activite/', rapport_activite, name='rapport-activite-location'),
    path('rapports/rentabilite/', rapport_rentabilite, name='rapport-rentabilite-location'),
    path('rapports/retards/', rapport_retards, name='rapport-retards'),
    path('rapports/cautions/', rapport_cautions_view, name='rapport-cautions'),
    path('rapports/evolution/', rapport_evolution, name='rapport-evolution'),
    path('rapports/dommages/', rapport_dommages_view, name='rapport-dommages'),
    path('contrats/<int:pk>/pdf/', telecharger_contrat_pdf, name='contrat-pdf'),
    path('synchroniser-factures/', synchroniser_factures_loc, name='synchroniser-factures-location'),
    path('facturations/<int:pk>/pdf/', telecharger_facture_location_pdf, name='facture-location-pdf'),
] + router.urls