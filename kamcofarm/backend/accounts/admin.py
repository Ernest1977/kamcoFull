from django import forms
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.forms import UserCreationForm
from .models import User, Role


class RoleAwareUserCreationForm(UserCreationForm):
    """Ajoute le champ 'role' (et quelques infos) au formulaire de création."""
    class Meta(UserCreationForm.Meta):
        model = User
        fields = ('username', 'email', 'first_name', 'last_name', 'role', 'phone', 'department', 'is_staff', 'is_active')


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    add_form = RoleAwareUserCreationForm

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': (
                'username', 'password1', 'password2',
                'role', 'email', 'first_name', 'last_name',
                'phone', 'department', 'is_staff', 'is_active'
            ),
        }),
    )

    fieldsets = BaseUserAdmin.fieldsets + (
        ('Rôle & Informations complémentaires', {
            'fields': ('role', 'phone', 'department'),
        }),
    )

    list_display = ('username', 'email', 'role', 'is_staff', 'is_superuser')
    list_filter = ('role', 'is_staff', 'is_superuser', 'is_active')

    def formfield_for_dbfield(self, db_field, request, **kwargs):
        if db_field.name == 'role':
            roles = Role.objects.all().order_by('ordre', 'nom')
            kwargs['choices'] = [('', '---------')] + [(r.code, r.nom) for r in roles]
            kwargs['required'] = False
        return super().formfield_for_dbfield(db_field, request, **kwargs)