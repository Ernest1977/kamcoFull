from rest_framework import serializers
from .models import ProduitAgricole


class ProduitSerializer(serializers.ModelSerializer):
    description = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = ProduitAgricole
        fields = [
            'id', 'nom', 'type_produit',
            'description', 'description_fr', 'description_en',
            'prix_unitaire_fcfa', 'stock_kg', 'est_premium',
            'image', 'image_url'
        ]
        extra_kwargs = {
            'description_fr': {'write_only': True},
            'description_en': {'write_only': True, 'required': False},
            'image': {'required': False},
        }

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