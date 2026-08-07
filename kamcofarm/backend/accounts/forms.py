from django import forms
from django.contrib.auth.forms import UserCreationForm, UserChangeForm
from .models import User

class CustomUserCreationForm(UserCreationForm):
    # On s'assure que l'email est présent car il est souvent requis
    email = forms.EmailField(required=False)

    class Meta(UserCreationForm.Meta):
        model = User
        # On liste explicitement TOUS les champs qui apparaîtront dans les sections de l'admin
        fields = ("username", "email", "role", "phone", "department", "signature")

class CustomUserChangeForm(UserChangeForm):
    class Meta:
        model = User
        fields = '__all__'