
# Create your views here.
from rest_framework import viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from .models import BlogPost
from .serializers import BlogPostSerializer


class BlogPostViewSet(viewsets.ModelViewSet):
    """
    - GET : public (publiés uniquement)
    - POST/PUT/PATCH/DELETE : authentifié (ADMIN, DIR)
    """
    serializer_class = BlogPostSerializer
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        if self.request.user.is_authenticated and self.request.user.role in ['ADMIN', 'DIR']:
            return BlogPost.objects.all().order_by('ordre', '-date_publication', '-id')
        return BlogPost.objects.filter(est_publie=True).order_by('ordre', '-date_publication', '-id')