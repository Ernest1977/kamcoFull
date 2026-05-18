from rest_framework import serializers
from .models import BlogPost


class BlogPostSerializer(serializers.ModelSerializer):
    titre = serializers.SerializerMethodField()
    extrait = serializers.SerializerMethodField()
    contenu = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = BlogPost
        fields = [
            'id',
            'titre', 'titre_fr', 'titre_en',
            'extrait', 'extrait_fr', 'extrait_en',
            'contenu', 'contenu_fr', 'contenu_en',
            'auteur',
            'image', 'image_url',
            'date_publication', 'est_publie', 'ordre'
        ]
        extra_kwargs = {
            'titre_fr': {'write_only': True},
            'titre_en': {'write_only': True, 'required': False},
            'extrait_fr': {'write_only': True},
            'extrait_en': {'write_only': True, 'required': False},
            'contenu_fr': {'write_only': True},
            'contenu_en': {'write_only': True, 'required': False},
            'image': {'required': False},
        }

    def get_titre(self, obj):
        request = self.context.get('request')
        if request and request.META.get('HTTP_ACCEPT_LANGUAGE', 'fr').startswith('en'):
            return obj.titre_en or obj.titre_fr
        return obj.titre_fr

    def get_extrait(self, obj):
        request = self.context.get('request')
        if request and request.META.get('HTTP_ACCEPT_LANGUAGE', 'fr').startswith('en'):
            return obj.extrait_en or obj.extrait_fr
        return obj.extrait_fr

    def get_contenu(self, obj):
        request = self.context.get('request')
        if request and request.META.get('HTTP_ACCEPT_LANGUAGE', 'fr').startswith('en'):
            return obj.contenu_en or obj.contenu_fr
        return obj.contenu_fr

    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        return request.build_absolute_uri('/static/images/placeholder.png') if request else None