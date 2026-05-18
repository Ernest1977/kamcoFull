from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    # Ajoute le champ "role" dans les champs affichés
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Rôle & Informations complémentaires', {
            'fields': ('role', 'phone', 'department'),
        }),
    )
    
    list_display = ('username', 'email', 'role', 'is_staff', 'is_superuser')
    list_filter = ('role', 'is_staff', 'is_superuser', 'is_active')