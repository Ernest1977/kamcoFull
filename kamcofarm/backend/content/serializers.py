from rest_framework import serializers
from .models import (
    CategorieContenu,
    PageContenu,
    DocumentInterne,
    MediaFile,
    FAQ
)


# ========================================
# CATÉGORIE CONTENU
# ========================================
class CategorieContenuSerializer(serializers.ModelSerializer):
    nombre_pages = serializers.SerializerMethodField()

    class Meta:
        model = CategorieContenu
        fields = ['id', 'nom', 'slug', 'description', 'icone', 'ordre', 'est_active', 'nombre_pages']

    def get_nombre_pages(self, obj):
        return obj.pages.filter(statut='PUBLIEE').count()


# ========================================
# PAGE CONTENU
# ========================================
class PageContenuSerializer(serializers.ModelSerializer):
    titre = serializers.SerializerMethodField()
    contenu = serializers.SerializerMethodField()
    extrait = serializers.SerializerMethodField()
    meta_description = serializers.SerializerMethodField()
    categorie_nom = serializers.CharField(source='categorie.nom', read_only=True)
    auteur_nom = serializers.CharField(source='auteur.username', read_only=True)
    image_couverture = serializers.SerializerMethodField()
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)

    class Meta:
        model = PageContenu
        fields = [
            'id', 'titre', 'slug',
            'categorie', 'categorie_nom',
            'contenu', 'extrait', 'meta_description',
            'image_couverture',
            'statut', 'statut_display',
            'est_mise_en_avant', 'ordre',
            'auteur', 'auteur_nom',
            'date_publication', 'date_creation', 'date_modification'
        ]

    def _get_lang(self):
        request = self.context.get('request')
        if request and request.META.get('HTTP_ACCEPT_LANGUAGE', 'fr').startswith('en'):
            return 'en'
        return 'fr'

    def get_titre(self, obj):
        if self._get_lang() == 'en':
            return obj.titre_en or obj.titre_fr
        return obj.titre_fr

    def get_contenu(self, obj):
        if self._get_lang() == 'en':
            return obj.contenu_en or obj.contenu_fr
        return obj.contenu_fr

    def get_extrait(self, obj):
        if self._get_lang() == 'en':
            return obj.extrait_en or obj.extrait_fr
        return obj.extrait_fr

    def get_meta_description(self, obj):
        if self._get_lang() == 'en':
            return obj.meta_description_en or obj.meta_description_fr
        return obj.meta_description_fr

    def get_image_couverture(self, obj):
        request = self.context.get('request')
        if obj.image_couverture and request:
            return request.build_absolute_uri(obj.image_couverture.url)
        return None


# ========================================
# PAGE RÉSUMÉ (pour listes)
# ========================================
class PageContenuResumeSerializer(serializers.ModelSerializer):
    titre = serializers.SerializerMethodField()
    extrait = serializers.SerializerMethodField()
    categorie_nom = serializers.CharField(source='categorie.nom', read_only=True)
    image_couverture = serializers.SerializerMethodField()

    class Meta:
        model = PageContenu
        fields = [
            'id', 'titre', 'slug', 'extrait',
            'categorie_nom', 'image_couverture',
            'est_mise_en_avant', 'date_publication'
        ]

    def _get_lang(self):
        request = self.context.get('request')
        if request and request.META.get('HTTP_ACCEPT_LANGUAGE', 'fr').startswith('en'):
            return 'en'
        return 'fr'

    def get_titre(self, obj):
        if self._get_lang() == 'en':
            return obj.titre_en or obj.titre_fr
        return obj.titre_fr

    def get_extrait(self, obj):
        if self._get_lang() == 'en':
            return obj.extrait_en or obj.extrait_fr
        return obj.extrait_fr

    def get_image_couverture(self, obj):
        request = self.context.get('request')
        if obj.image_couverture and request:
            return request.build_absolute_uri(obj.image_couverture.url)
        return None


# ========================================
# DOCUMENT INTERNE
# ========================================
class DocumentInterneSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_type_document_display', read_only=True)
    visibilite_display = serializers.CharField(source='get_visibilite_display', read_only=True)
    uploade_par_nom = serializers.CharField(source='uploade_par.username', read_only=True)
    fichier_url = serializers.SerializerMethodField()
    taille_formatee = serializers.SerializerMethodField()

    class Meta:
        model = DocumentInterne
        fields = [
            'id', 'titre', 'description',
            'type_document', 'type_display',
            'visibilite', 'visibilite_display',
            'fichier', 'fichier_url', 'taille_fichier', 'taille_formatee',
            'extension', 'version', 'est_actif',
            'uploade_par', 'uploade_par_nom',
            'date_upload', 'date_modification'
        ]
        read_only_fields = ['taille_fichier', 'extension', 'uploade_par']

    def get_fichier_url(self, obj):
        request = self.context.get('request')
        if obj.fichier and request:
            return request.build_absolute_uri(obj.fichier.url)
        return None

    def get_taille_formatee(self, obj):
        size = obj.taille_fichier
        if size < 1024:
            return f"{size} o"
        elif size < 1024 * 1024:
            return f"{size / 1024:.1f} Ko"
        elif size < 1024 * 1024 * 1024:
            return f"{size / (1024 * 1024):.1f} Mo"
        else:
            return f"{size / (1024 * 1024 * 1024):.2f} Go"


# ========================================
# FICHIER MÉDIA
# ========================================
class MediaFileSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_type_media_display', read_only=True)
    fichier_url = serializers.SerializerMethodField()
    miniature_url = serializers.SerializerMethodField()
    uploade_par_nom = serializers.CharField(source='uploade_par.username', read_only=True)
    taille_formatee = serializers.SerializerMethodField()

    class Meta:
        model = MediaFile
        fields = [
            'id', 'nom', 'description',
            'type_media', 'type_display',
            'fichier', 'fichier_url',
            'miniature', 'miniature_url',
            'taille_fichier', 'taille_formatee',
            'extension', 'largeur', 'hauteur',
            'tags', 'est_public',
            'uploade_par', 'uploade_par_nom',
            'date_upload'
        ]
        read_only_fields = ['taille_fichier', 'extension', 'type_media', 'uploade_par']

    def get_fichier_url(self, obj):
        request = self.context.get('request')
        if obj.fichier and request:
            return request.build_absolute_uri(obj.fichier.url)
        return None

    def get_miniature_url(self, obj):
        request = self.context.get('request')
        if obj.miniature and request:
            return request.build_absolute_uri(obj.miniature.url)
        return None

    def get_taille_formatee(self, obj):
        size = obj.taille_fichier
        if size < 1024:
            return f"{size} o"
        elif size < 1024 * 1024:
            return f"{size / 1024:.1f} Ko"
        else:
            return f"{size / (1024 * 1024):.1f} Mo"


# ========================================
# FAQ
# ========================================
class FAQSerializer(serializers.ModelSerializer):
    question = serializers.SerializerMethodField()
    reponse = serializers.SerializerMethodField()
    categorie_nom = serializers.CharField(source='categorie.nom', read_only=True)

    class Meta:
        model = FAQ
        fields = [
            'id', 'question', 'reponse',
            'categorie', 'categorie_nom',
            'ordre', 'est_visible'
        ]

    def _get_lang(self):
        request = self.context.get('request')
        if request and request.META.get('HTTP_ACCEPT_LANGUAGE', 'fr').startswith('en'):
            return 'en'
        return 'fr'

    def get_question(self, obj):
        if self._get_lang() == 'en':
            return obj.question_en or obj.question_fr
        return obj.question_fr

    def get_reponse(self, obj):
        if self._get_lang() == 'en':
            return obj.reponse_en or obj.reponse_fr
        return obj.reponse_fr