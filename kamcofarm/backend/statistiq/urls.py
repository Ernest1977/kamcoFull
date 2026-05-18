from rest_framework.routers import DefaultRouter
from .views import StatistiqViewSet

router = DefaultRouter()
router.register(r'statistiq', StatistiqViewSet, basename='statistiq')

urlpatterns = router.urls