from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Role
from .forms import CustomUserCreationForm, CustomUserChangeForm, RoleForm

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    add_form = CustomUserCreationForm
    form = CustomUserChangeForm
    
    # Sécurisation de la liste des colonnes
    #list_display = ('username', 'email', 'get_role_label', 'is_staff', 'is_active')
    #list_filter = ('is_staff', 'is_active') # On simplifie le filtre pour tester
    #search_fields = ('username', 'first_name', 'last_name', 'email')
    #ordering = ('username',)

    list_display = ('username', 'email', 'role', 'is_staff') # Liste ultra simplifiée
    list_select_related = None # Désactive les jointures automatiques pour test
    list_per_page = 20 # Affiche seulement 20 users par page

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