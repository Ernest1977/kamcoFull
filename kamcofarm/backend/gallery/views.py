from rest_framework import viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from .models import GaleriePhoto
from .serializers import GaleriePhotoSerializer


class GaleriePhotoViewSet(viewsets.ModelViewSet):
    """
    - GET : public (visibles uniquement)
    - POST/PUT/PATCH/DELETE : authentifié (ADMIN, DIR)
    """
    serializer_class = GaleriePhotoSerializer
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        if self.request.user.is_authenticated and self.request.user.role in ['ADMIN', 'DIR']:
            return GaleriePhoto.objects.all().order_by('ordre', '-date_ajout')

        queryset = GaleriePhoto.objects.filter(est_visible=True).order_by('ordre', '-date_ajout')
        categorie = self.request.query_params.get('categorie')
        if categorie:
            queryset = queryset.filter(categorie=categorie)
        return queryset