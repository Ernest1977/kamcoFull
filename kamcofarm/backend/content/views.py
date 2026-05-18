# Create your views here.
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser

from accounts.permissions import IsAdminOrDirector

from .models import (
    CategorieContenu,
    PageContenu,
    DocumentInterne,
    MediaFile,
    FAQ
)

from .serializers import (
    CategorieContenuSerializer,
    PageContenuSerializer,
    PageContenuResumeSerializer,
    DocumentInterneSerializer,
    MediaFileSerializer,
    FAQSerializer
)


# ========================================
# CATÉGORIE CONTENU
# ========================================
class CategorieContenuViewSet(viewsets.ModelViewSet):
    """
    CRUD Catégories de contenu.
    - Lecture : publique
    - Écriture : ADMIN, DIR
    """
    queryset = CategorieContenu.objects.all()
    serializer_class = CategorieContenuSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAdminOrDirector()]

    def get_queryset(self):
        qs = CategorieContenu.objects.all()
        if self.action in ['list', 'retrieve']:
            qs = qs.filter(est_active=True)
        return qs


# ========================================
# PAGE CONTENU
# ========================================
class PageContenuViewSet(viewsets.ModelViewSet):
    """
    CRUD Pages de contenu.
    - Lecture publique : pages publiées uniquement
    - Écriture : ADMIN, DIR
    """
    queryset = PageContenu.objects.all()
    lookup_field = 'slug'

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAdminOrDirector()]

    def get_serializer_class(self):
        if self.action == 'list':
            return PageContenuResumeSerializer
        return PageContenuSerializer

    def get_queryset(self):
        qs = PageContenu.objects.select_related('categorie', 'auteur').all()

        # Visiteurs : uniquement publiées
        if not self.request.user.is_authenticated:
            qs = qs.filter(statut='PUBLIEE')
        elif self.request.user.role not in ['ADMIN', 'DIR']:
            qs = qs.filter(statut='PUBLIEE')

        categorie = self.request.query_params.get('categorie')
        mise_en_avant = self.request.query_params.get('mise_en_avant')

        if categorie:
            qs = qs.filter(categorie__slug=categorie)
        if mise_en_avant is not None:
            qs = qs.filter(est_mise_en_avant=(mise_en_avant.lower() == 'true'))

        return qs

    def perform_create(self, serializer):
        serializer.save(auteur=self.request.user)


# ========================================
# DOCUMENT INTERNE
# ========================================
class DocumentInterneViewSet(viewsets.ModelViewSet):
    """
    CRUD Documents internes.
    Accessible par : employés connectés selon la visibilité.
    """
    queryset = DocumentInterne.objects.all()
    serializer_class = DocumentInterneSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        qs = DocumentInterne.objects.filter(est_actif=True)
        user = self.request.user

        # Filtrer selon la visibilité et le rôle
        role = user.role
        if role in ['ADMIN', 'DIR']:
            pass  # Accès total
        elif role == 'RH':
            qs = qs.filter(visibilite__in=['TOUS', 'RH'])
        elif role == 'COMPTA':
            qs = qs.filter(visibilite__in=['TOUS', 'FINANCE'])
        elif role == 'LOG':
            qs = qs.filter(visibilite__in=['TOUS', 'LOGISTIQUE'])
        elif role == 'COMM':
            qs = qs.filter(visibilite__in=['TOUS', 'COMMERCIAL'])
        else:
            qs = qs.filter(visibilite='TOUS')

        type_doc = self.request.query_params.get('type')
        if type_doc:
            qs = qs.filter(type_document=type_doc.upper())

        return qs

    def perform_create(self, serializer):
        serializer.save(uploade_par=self.request.user)


# ========================================
# FICHIER MÉDIA
# ========================================
class MediaFileViewSet(viewsets.ModelViewSet):
    """
    CRUD Fichiers médias.
    - Lecture publique : médias publics
    - Écriture : employés connectés
    """
    queryset = MediaFile.objects.all()
    serializer_class = MediaFileSerializer
    parser_classes = [MultiPartParser, FormParser]

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        qs = MediaFile.objects.all()

        # Visiteurs : uniquement les médias publics
        if not self.request.user.is_authenticated:
            qs = qs.filter(est_public=True)

        type_media = self.request.query_params.get('type')
        tags = self.request.query_params.get('tags')

        if type_media:
            qs = qs.filter(type_media=type_media.upper())
        if tags:
            qs = qs.filter(tags__icontains=tags)

        return qs

    def perform_create(self, serializer):
        serializer.save(uploade_par=self.request.user)


# ========================================
# FAQ
# ========================================
class FAQViewSet(viewsets.ModelViewSet):
    """
    CRUD FAQs.
    - Lecture : publique
    - Écriture : ADMIN, DIR
    """
    queryset = FAQ.objects.all()
    serializer_class = FAQSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAdminOrDirector()]

    def get_queryset(self):
        qs = FAQ.objects.select_related('categorie').all()

        if self.action in ['list', 'retrieve']:
            qs = qs.filter(est_visible=True)

        categorie = self.request.query_params.get('categorie')
        if categorie:
            qs = qs.filter(categorie__slug=categorie)

        return qs


# ========================================
# DASHBOARD CONTENU
# ========================================
@api_view(['GET'])
@permission_classes([IsAdminOrDirector])
def dashboard_content(request):
    """
    Vue d'ensemble du contenu.
    """
    from django.db.models import Count, Sum

    total_pages = PageContenu.objects.count()
    pages_publiees = PageContenu.objects.filter(statut='PUBLIEE').count()
    pages_brouillon = PageContenu.objects.filter(statut='BROUILLON').count()

    total_documents = DocumentInterne.objects.filter(est_actif=True).count()
    total_medias = MediaFile.objects.count()
    total_faqs = FAQ.objects.filter(est_visible=True).count()
    total_categories = CategorieContenu.objects.filter(est_active=True).count()

    # Espace disque utilisé (approximatif)
    espace_documents = DocumentInterne.objects.filter(
        est_actif=True
    ).aggregate(total=Sum('taille_fichier'))['total'] or 0

    espace_medias = MediaFile.objects.aggregate(
        total=Sum('taille_fichier')
    )['total'] or 0

    espace_total = espace_documents + espace_medias

    # Formater en Mo
    espace_total_mo = round(espace_total / (1024 * 1024), 2) if espace_total > 0 else 0

    # Médias par type
    medias_par_type = list(
        MediaFile.objects.values('type_media').annotate(
            count=Count('id')
        ).order_by()
    )

    # Documents par type
    documents_par_type = list(
        DocumentInterne.objects.filter(est_actif=True).values('type_document').annotate(
            count=Count('id')
        ).order_by()
    )

    return Response({
        'pages': {
            'total': total_pages,
            'publiees': pages_publiees,
            'brouillon': pages_brouillon,
        },
        'documents_internes': total_documents,
        'medias': total_medias,
        'faqs': total_faqs,
        'categories': total_categories,
        'espace_disque_mo': espace_total_mo,
        'medias_par_type': medias_par_type,
        'documents_par_type': documents_par_type,
    })