from rest_framework import serializers
from .models import GaleriePhoto


class GaleriePhotoSerializer(serializers.ModelSerializer):
    titre = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = GaleriePhoto
        fields = [
            'id', 'titre', 'titre_fr', 'titre_en',
            'description', 'description_fr', 'description_en',
            'image', 'image_url',
            'categorie', 'ordre', 'est_visible', 'date_ajout'
        ]
        extra_kwargs = {
            'titre_fr': {'write_only': True},
            'titre_en': {'write_only': True, 'required': False},
            'description_fr': {'write_only': True, 'required': False},
            'description_en': {'write_only': True, 'required': False},
            'image': {'required': False},
        }

    def get_titre(self, obj):
        request = self.context.get('request')
        if request and request.META.get('HTTP_ACCEPT_LANGUAGE', 'fr').startswith('en'):
            return obj.titre_en or obj.titre_fr
        return obj.titre_fr

    def get_description(self, obj):
        request = self.context.get('request')
        if request and request.META.get('HTTP_ACCEPT_LANGUAGE', 'fr').startswith('en'):
            return obj.description_en or obj.description_fr
        return obj.description_fr

    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        return request.build_absolute_uri('/static/images/placeholder.png') if request else None