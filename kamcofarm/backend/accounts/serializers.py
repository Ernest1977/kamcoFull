from rest_framework import serializers
from .models import User


class UserSerializer(serializers.ModelSerializer):
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    nom_complet = serializers.SerializerMethodField()
    a_profil_employe = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'nom_complet', 'role', 'role_display',
            'phone', 'department',
            'is_active', 'is_staff', 'is_superuser',
            'date_joined', 'last_login',
            'a_profil_employe'
        ]
        read_only_fields = ['date_joined', 'last_login', 'is_superuser']
        extra_kwargs = {
            'email': {'required': False, 'allow_blank': True},
            'first_name': {'required': False, 'allow_blank': True},
            'last_name': {'required': False, 'allow_blank': True},
            'phone': {'required': False, 'allow_blank': True},
            'department': {'required': False, 'allow_blank': True},
        }

    def get_nom_complet(self, obj):
        full = obj.get_full_name()
        return full if full else obj.username

    def get_a_profil_employe(self, obj):
        return hasattr(obj, 'profil_employe')