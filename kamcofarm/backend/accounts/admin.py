from django import forms
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.forms import UserCreationForm, UserChangeForm
from .models import User, Role


def _role_choices():
    """Choix dynamiques pour le champ rôle : tous les rôles du catalogue."""
    return [('', '---------')] + [(r.code, r.nom) for r in Role.objects.all().order_by('ordre', 'nom')]


class RoleAwareUserCreationForm(UserCreationForm):
    """Formulaire de création : le rôle vient du catalogue (et non des choix en dur)."""
    class Meta(UserCreationForm.Meta):
        model = User
        fields = (
            'username', 'email', 'first_name', 'last_name',
            'role', 'phone', 'department', 'is_staff', 'is_active'
        )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['role'] = forms.ChoiceField(
            label='Rôle',
            choices=_role_choices(),
            required=False,
            initial='VISITOR'
        )


class RoleAwareUserChangeForm(UserChangeForm):
    """Formulaire de modification : idem, avec la valeur actuelle si absente du catalogue."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        choices = _role_choices()
        current = self.instance.role if (self.instance and self.instance.pk) else None
        if current and current not in [c[0] for c in choices]:
            choices.append((current, current))
        self.fields['role'] = forms.ChoiceField(
            label='Rôle',
            choices=choices,
            required=False
        )


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    form = RoleAwareUserChangeForm
    add_form = RoleAwareUserCreationForm

    # Formulaire d'ajout : on ajoute le rôle (et quelques champs utiles)
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
