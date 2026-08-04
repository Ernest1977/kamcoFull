from rest_framework import serializers
from .models import User, Role


class UserSerializer(serializers.ModelSerializer):
    role_display = serializers.SerializerMethodField()
    nom_complet = serializers.SerializerMethodField()
    a_profil_employe = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'nom_complet', 'role', 'role_display',
            'phone', 'department', 'signature',
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

    def _roles_cache(self):
        if not hasattr(self, '_roles_dict'):
            from .models import Role
            try:
                self._roles_dict = {r.code: r.nom for r in Role.objects.all()}
            except Exception:
                self._roles_dict = {}
        return self._roles_dict

    def get_role_display(self, obj):
        # Affiche le libellé du catalogue (ex: "Marketing") pour tous les rôles,
        # standards et personnalisés ; repli sur le code si introuvable.
        return self._roles_cache().get(obj.role, obj.role)

    def get_a_profil_employe(self, obj):
        return hasattr(obj, 'profil_employe')


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = [
            'id', 'code', 'nom', 'description', 'couleur',
            'permissions', 'est_actif', 'ordre',
            'date_creation', 'date_modification'
        ]
        read_only_fields = ['date_creation', 'date_modification']

    def validate_code(self, value):
        value = str(value).strip().upper()
        if not value:
            raise serializers.ValidationError("Le code est requis.")
        if len(value) > 10:
            # Contrainte héritée du champ User.role (CharField max_length=10)
            raise serializers.ValidationError(
                "Le code doit faire au plus 10 caractères (contrainte du champ utilisateur)."
            )
        return value
