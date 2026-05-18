from rest_framework import serializers
from .models import Statistiq


class StatistiqSerializer(serializers.ModelSerializer):
    label = serializers.SerializerMethodField()

    class Meta:
        model = Statistiq
        fields = [
            'id',
            'label', 'label_fr', 'label_en',
            'valeur', 'suffixe', 'ordre', 'est_visible'
        ]
        extra_kwargs = {
            'label_fr': {'write_only': True},
            'label_en': {'write_only': True, 'required': False},
        }

    def get_label(self, obj):
        request = self.context.get('request')
        if request and request.META.get('HTTP_ACCEPT_LANGUAGE', 'fr').startswith('en'):
            return obj.label_en or obj.label_fr
        return obj.label_fr