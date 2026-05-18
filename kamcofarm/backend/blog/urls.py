from rest_framework.routers import DefaultRouter
from .views import BlogPostViewSet

router = DefaultRouter()
router.register(r'blog', BlogPostViewSet, basename='blog')

urlpatterns = router.urls