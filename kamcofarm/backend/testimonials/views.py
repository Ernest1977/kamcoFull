# Create your views here.
from rest_framework import viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from .models import Testimonial
from .serializers import TestimonialSerializer


class TestimonialViewSet(viewsets.ModelViewSet):
    """
    - GET : public (visibles uniquement)
    - POST/PUT/PATCH/DELETE : authentifié (ADMIN, DIR)
    """
    serializer_class = TestimonialSerializer
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        if self.request.user.is_authenticated and self.request.user.role in ['ADMIN', 'DIR']:
            return Testimonial.objects.all().order_by('ordre', '-date_ajout')
        return Testimonial.objects.filter(est_visible=True).order_by('ordre', '-date_ajout')