from rest_framework import viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from .models import Partenaire
from .serializers import PartenaireSerializer


class PartenaireViewSet(viewsets.ModelViewSet):
    """
    - GET : public (visibles uniquement)
    - POST/PUT/PATCH/DELETE : authentifié (ADMIN, DIR)
    """
    serializer_class = PartenaireSerializer
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        try:
            if self.request.user.is_authenticated and self.request.user.role in ['ADMIN', 'DIR']:
                return Partenaire.objects.all().order_by('ordre', 'nom')
        except Exception:
            pass

        qs = Partenaire.objects.filter(est_visible=True).order_by('ordre', 'nom')

        type_p = self.request.query_params.get('type')
        featured = self.request.query_params.get('featured')

        if type_p:
            qs = qs.filter(type_partenaire=type_p.upper())
        if featured and featured.lower() == 'true':
            qs = qs.filter(est_featured=True)

        return qs