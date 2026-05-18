from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import (
    CategorieContenuViewSet,
    PageContenuViewSet,
    DocumentInterneViewSet,
    MediaFileViewSet,
    FAQViewSet,
    dashboard_content
)

router = DefaultRouter()
router.register(r'categories', CategorieContenuViewSet, basename='categorie-contenu')
router.register(r'pages', PageContenuViewSet, basename='page-contenu')
router.register(r'documents', DocumentInterneViewSet, basename='document-interne')
router.register(r'medias', MediaFileViewSet, basename='media-file')
router.register(r'faqs', FAQViewSet, basename='faq')

urlpatterns = [
    path('dashboard/', dashboard_content, name='dashboard-content'),
] + router.urls