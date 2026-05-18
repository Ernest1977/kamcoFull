from rest_framework import serializers
from .models import Partenaire


class PartenaireSerializer(serializers.ModelSerializer):
    description = serializers.SerializerMethodField()
    logo_url = serializers.SerializerMethodField()
    type_display = serializers.CharField(source='get_type_partenaire_display', read_only=True)
    localisation = serializers.SerializerMethodField()

    class Meta:
        model = Partenaire
        fields = [
            'id', 'nom',
            'description', 'description_fr', 'description_en',
            'logo', 'logo_url',
            'type_partenaire', 'type_display',
            'contact_nom', 'contact_email', 'contact_telephone',
            'site_web', 'ville', 'pays', 'localisation',
            'est_visible', 'est_featured',
            'ordre', 'date_debut_partenariat'
        ]
        extra_kwargs = {
            'description_fr': {'write_only': True, 'required': False},
            'description_en': {'write_only': True, 'required': False},
            'logo': {'required': False},
        }

    def get_description(self, obj):
        request = self.context.get('request')
        if request and request.META.get('HTTP_ACCEPT_LANGUAGE', 'fr').startswith('en'):
            return obj.description_en or obj.description_fr
        return obj.description_fr

    def get_logo_url(self, obj):
        request = self.context.get('request')
        if obj.logo and request:
            return request.build_absolute_uri(obj.logo.url)
        return None

    def get_localisation(self, obj):
        parts = []
        if obj.ville:
            parts.append(obj.ville)
        if obj.pays:
            parts.append(obj.pays)
        return ', '.join(parts) if parts else None