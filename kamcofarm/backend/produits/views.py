# Create your views here.
# produits/views.py
from rest_framework import viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from .models import ProduitAgricole
from .serializers import ProduitSerializer
from administration.mixins import TrackingMixin
from drf_spectacular.utils import extend_schema, extend_schema_view

@extend_schema_view(
    list=extend_schema(tags=['Produits'], summary='Liste des produits', description='Retourne la liste de tous les produits agricoles.'),
    retrieve=extend_schema(tags=['Produits'], summary='Détail d\'un produit'),
    create=extend_schema(tags=['Produits'], summary='Créer un produit'),
    update=extend_schema(tags=['Produits'], summary='Modifier un produit'),
    partial_update=extend_schema(tags=['Produits'], summary='Modifier partiellement un produit'),
    destroy=extend_schema(tags=['Produits'], summary='Supprimer un produit'),
)

class ProduitViewSet(TrackingMixin, viewsets.ModelViewSet):
    """Permet de lister et voir les détails des produits."""
    """
    - GET (list/retrieve) : public
    - POST/PUT/PATCH/DELETE : authentifié (ADMIN, DIR)
    """
    queryset = ProduitAgricole.objects.all()
    serializer_class = ProduitSerializer
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    # Pour la sécurité, on pourrait ajouter ici des permissions si nécessaire
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]