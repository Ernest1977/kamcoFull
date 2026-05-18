# partners/urls.py

from rest_framework.routers import DefaultRouter
from .views import PartenaireViewSet

router = DefaultRouter()
router.register(r'partners', PartenaireViewSet, basename='partenaire')
urlpatterns = router.urls