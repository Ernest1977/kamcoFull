# kamcofarm/backend/accounts/admin.py

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Role
from .forms import CustomUserCreationForm, CustomUserChangeForm, RoleForm

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    add_form = CustomUserCreationForm
    form = CustomUserChangeForm
    
    # Correction cruciale pour la performance et éviter l'erreur 2006
    list_select_related = False 
    
    # Colonnes à afficher dans la liste
    list_display = ('username', 'email', 'role', 'is_staff', 'is_active')
    list_filter = ('role', 'is_staff', 'is_active')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    ordering = ('username',)

    # On garde les fieldsets que nous avons déjà corrigés
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