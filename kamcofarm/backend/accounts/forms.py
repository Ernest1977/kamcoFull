from django import forms
from django.contrib.auth.forms import UserCreationForm, UserChangeForm
from .models import User, Role

class CustomUserCreationForm(UserCreationForm):
    role = forms.ChoiceField(choices=[], required=True, label="Rôle")

    class Meta(UserCreationForm.Meta):
        model = User
        fields = ("username", "email", "role", "phone", "department", "signature")

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # On charge les rôles depuis la base de données de manière dynamique
        try:
            roles = Role.objects.filter(est_actif=True).order_by('ordre')
            self.fields['role'].choices = [(r.code, r.nom) for r in roles]
        except:
            self.fields['role'].choices = User.ROLE_CHOICES

class CustomUserChangeForm(UserChangeForm):
    role = forms.ChoiceField(choices=[], required=True, label="Rôle")

    class Meta:
        model = User
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        try:
            # Récupère tous les rôles actifs du catalogue
            roles = Role.objects.filter(est_actif=True).order_by('ordre')
            choices = [(r.code, r.nom) for r in roles]
            if not choices:
                choices = User.ROLE_CHOICES
            self.fields['role'].choices = choices
        except:
            self.fields['role'].choices = User.ROLE_CHOICES

# NOUVEAU : Formulaire ergonomique pour les Rôles
class RoleForm(forms.ModelForm):
    # On transforme le JSON en liste de cases à cocher
    capacites_selection = forms.MultipleChoiceField(
        choices=Role.CAPACITES,
        widget=forms.CheckboxSelectMultiple,
        required=False,
        label="Capacités accordées (Permissions)",
        help_text="Cochez les modules auxquels ce rôle a accès."
    )

    class Meta:
        model = Role
        fields = ['nom', 'code', 'description', 'couleur', 'capacites_selection', 'est_actif', 'ordre']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Si le rôle existe déjà, on pré-coche les cases depuis le JSON
        if self.instance and self.instance.permissions:
            self.fields['capacites_selection'].initial = self.instance.permissions

    def save(self, commit=True):
        instance = super().save(commit=False)
        # On convertit les cases cochées en liste JSON avant de sauvegarder
        instance.permissions = self.cleaned_data.get('capacites_selection')
        if commit:
            instance.save()
        return instance