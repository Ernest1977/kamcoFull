from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import (
    FournisseurViewSet,
    CommandeClientViewSet,
    CommandeFournisseurViewSet,
    LivraisonViewSet,
    MouvementStockViewSet,
    dashboard_supplychain
)

router = DefaultRouter()
router.register(r'fournisseurs', FournisseurViewSet, basename='fournisseur')
router.register(r'commandes-clients', CommandeClientViewSet, basename='commande-client')
router.register(r'commandes-fournisseurs', CommandeFournisseurViewSet, basename='commande-fournisseur')
router.register(r'livraisons', LivraisonViewSet, basename='livraison')
router.register(r'mouvements-stock', MouvementStockViewSet, basename='mouvement-stock')

urlpatterns = [
    path('dashboard/', dashboard_supplychain, name='dashboard-supplychain'),
] + router.urls