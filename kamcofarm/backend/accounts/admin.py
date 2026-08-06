from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Role
from .forms import CustomUserCreationForm, CustomUserChangeForm


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    add_form = CustomUserCreationForm
    form = CustomUserChangeForm
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Informations KAMCO', {
            'fields': ('role', 'phone', 'department', 'signature'),
        }),
    )
    
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Informations complémentaires', {
            'fields': ('email', 'role', 'phone', 'department', 'signature'),
        }),
    )
    
    list_display = ('username', 'email', 'role', 'is_staff', 'is_superuser')
    list_filter = ('role', 'is_staff', 'is_superuser', 'is_active')
    search_fields = ('username', 'first_name', 'last_name', 'email', 'phone')
    ordering = ('username',)


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ('nom', 'code', 'couleur', 'est_actif', 'ordre')
    list_filter = ('est_actif',)
    search_fields = ('nom', 'code', 'description')
    ordering = ('ordre', 'nom')
