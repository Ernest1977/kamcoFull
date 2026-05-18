from rest_framework import serializers
from .models import Testimonial


class TestimonialSerializer(serializers.ModelSerializer):
    contenu = serializers.SerializerMethodField()
    fonction_client = serializers.SerializerMethodField()
    photo_url = serializers.SerializerMethodField()
    stars = serializers.SerializerMethodField()

    class Meta:
        model = Testimonial
        fields = [
            'id', 'nom_client',
            'fonction_client', 'fonction_client_fr', 'fonction_client_en',
            'entreprise',
            'contenu', 'contenu_fr', 'contenu_en',
            'note', 'stars',
            'avatar_initiales',
            'photo', 'photo_url',
            'est_visible', 'ordre'
        ]
        extra_kwargs = {
            'fonction_client_fr': {'write_only': True},
            'fonction_client_en': {'write_only': True, 'required': False},
            'contenu_fr': {'write_only': True},
            'contenu_en': {'write_only': True, 'required': False},
            'photo': {'required': False},
        }

    def get_contenu(self, obj):
        request = self.context.get('request')
        if request and request.META.get('HTTP_ACCEPT_LANGUAGE', 'fr').startswith('en'):
            return obj.contenu_en or obj.contenu_fr
        return obj.contenu_fr

    def get_fonction_client(self, obj):
        request = self.context.get('request')
        if request and request.META.get('HTTP_ACCEPT_LANGUAGE', 'fr').startswith('en'):
            return obj.fonction_client_en or obj.fonction_client_fr
        return obj.fonction_client_fr

    def get_photo_url(self, obj):
        request = self.context.get('request')
        if obj.photo and request:
            return request.build_absolute_uri(obj.photo.url)
        return None

    def get_stars(self, obj):
        return '⭐' * max(1, min(obj.note, 5))