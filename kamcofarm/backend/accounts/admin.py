from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Role
from .forms import CustomUserCreationForm, CustomUserChangeForm

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    add_form = CustomUserCreationForm
    form = CustomUserChangeForm
    
    # Configuration de la liste
    list_display = ('username', 'email', 'role', 'is_staff', 'is_active')
    list_filter = ('role', 'is_staff', 'is_superuser', 'is_active')
    search_fields = ('username', 'first_name', 'last_name', 'email', 'phone')
    ordering = ('username',)

    # Sections pour la MODIFICATION d'un utilisateur existant
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Informations KAMCO', {
            'fields': ('role', 'phone', 'department', 'signature'),
        }),
    )
    
    # Sections pour la CRÉATION d'un nouvel utilisateur
    # Note : username et les passwords sont gérés par BaseUserAdmin.add_fieldsets
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
    list_display = ('nom', 'code', 'couleur', 'est_actif', 'ordre')
    list_filter = ('est_actif',)
    search_fields = ('nom', 'code', 'description')
    ordering = ('ordre', 'nom')