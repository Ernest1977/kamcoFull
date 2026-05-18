# gallery/urls.py

from rest_framework.routers import DefaultRouter
from .views import GaleriePhotoViewSet

router = DefaultRouter()
router.register(r'gallery', GaleriePhotoViewSet, basename='gallery')
urlpatterns = router.urls