
# Create your views here.
from rest_framework import viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from .models import Statistiq
from .serializers import StatistiqSerializer


class StatistiqViewSet(viewsets.ModelViewSet):
    """
    - GET : public (visibles uniquement)
    - POST/PUT/PATCH/DELETE : authentifié (ADMIN, DIR)
    """
    serializer_class = StatistiqSerializer
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        try:
            if self.request.user.is_authenticated and self.request.user.role in ['ADMIN', 'DIR']:
                return Statistiq.objects.all().order_by('ordre', 'id')
        except Exception:
            pass
        return Statistiq.objects.filter(est_visible=True).order_by('ordre', 'id')