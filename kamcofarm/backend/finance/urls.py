from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import (
    # Endpoints existants
    test_finance,
    creer_demande_devis,
    # Nouveaux ViewSets
    DemandeDevisViewSet,
    FactureViewSet,
    PaiementViewSet,
    CategorieDépenseViewSet,
    DepenseOperationnelleViewSet,
    BudgetMensuelViewSet,
    # Dashboard
    dashboard_finance,
    synchroniser_factures_view,
    # PDF Factures
    telecharger_facture_pdf,
    apercu_facture_pdf
)

router = DefaultRouter()
router.register(r'devis', DemandeDevisViewSet, basename='devis')
router.register(r'factures', FactureViewSet, basename='facture')
router.register(r'paiements', PaiementViewSet, basename='paiement')
router.register(r'categories-depenses', CategorieDépenseViewSet, basename='categorie-depense')
router.register(r'depenses', DepenseOperationnelleViewSet, basename='depense')
router.register(r'budgets', BudgetMensuelViewSet, basename='budget')

urlpatterns = [
    # Endpoints existants
    path('test/', test_finance, name='test_finance'),
    path('creer-demande-devis/', creer_demande_devis, name='creer_demande_devis'),
    path('factures/<int:pk>/pdf/', telecharger_facture_pdf, name='facture-pdf'),
    path('factures/<int:pk>/pdf/apercu/', apercu_facture_pdf, name='facture-pdf-apercu'),

    # Dashboard
    path('dashboard/', dashboard_finance, name='dashboard-finance'),
    path('synchroniser-factures/', synchroniser_factures_view, name='synchroniser-factures'),
] + router.urls
