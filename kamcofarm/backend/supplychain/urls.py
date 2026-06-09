from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import (
    FournisseurViewSet,
    CommandeClientViewSet,
    CommandeFournisseurViewSet,
    LivraisonViewSet,
    MouvementStockViewSet,
    DevisViewSet,
    dashboard_supplychain,
    public_devis_detail,
    public_devis_accepter
)

router = DefaultRouter()
router.register(r'fournisseurs', FournisseurViewSet, basename='fournisseur')
router.register(r'commandes-clients', CommandeClientViewSet, basename='commande-client')
router.register(r'commandes-fournisseurs', CommandeFournisseurViewSet, basename='commande-fournisseur')
router.register(r'livraisons', LivraisonViewSet, basename='livraison')
router.register(r'mouvements-stock', MouvementStockViewSet, basename='mouvement-stock')
router.register(r'devis', DevisViewSet, basename='devis')

urlpatterns = [
    path('dashboard/', dashboard_supplychain, name='dashboard-supplychain'),
    path('public/devis/<uuid:token>/', public_devis_detail, name='public-devis-detail'),
    path('public/devis/<uuid:token>/accepter/', public_devis_accepter, name='public-devis-accepter'),
] + router.urls
