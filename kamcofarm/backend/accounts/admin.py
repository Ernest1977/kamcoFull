from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Role
from .forms import CustomUserCreationForm, CustomUserChangeForm, RoleForm

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    add_form = CustomUserCreationForm
    form = CustomUserChangeForm
    
    # Correction de l'erreur E117 : Changez None par False
    list_select_related = False 
    
    # Restaurons une liste fonctionnelle et propre
    list_display = ('username', 'email', 'role', 'is_staff', 'is_active')
    list_filter = ('is_staff', 'is_active')
    search_fields = ('username', 'email')
    list_per_page = 50

    # Méthode sécurisée pour afficher le libellé du rôle
    def get_role_label(self, obj):
        try:
            # On essaie de récupérer le nom lisible depuis le catalogue Role
            role_obj = Role.objects.filter(code=obj.role).first()
            if role_obj:
                return role_obj.nom
            return obj.role # Fallback sur le code si non trouvé
        except:
            return obj.role
    
    get_role_label.short_description = 'Rôle actuel'

    fieldsets = BaseUserAdmin.fieldsets + (
        ('Informations KAMCO', {
            'fields': ('role', 'phone', 'department', 'signature'),
        }),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'password1', 'password2'),
        }),
        ('Informations personnelles', {
            'fields': ('email', 'role', 'phone', 'department', 'signature'),
        }),
    )

@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    form = RoleForm
    list_display = ('nom', 'code', 'couleur', 'est_actif', 'ordre')
    list_filter = ('est_actif',)
    search_fields = ('nom', 'code', 'description')
    ordering = ('ordre', 'nom')