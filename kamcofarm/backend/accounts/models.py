from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_CHOICES = [
        ('ADMIN', 'Administrateur'),
        ('DIR', 'Directeur Général'),
        ('RH', 'Ressources Humaines'),
        ('COMPTA', 'Comptable'),
        ('COMM', 'Commercial'),
        ('LOG', 'Logistique'),
        ('AGRI', 'Agent terrain'),
        ('VISITOR', 'Visiteur'),
    ]

    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='VISITOR')
    phone = models.CharField(max_length=30, blank=True, null=True)
    department = models.CharField(max_length=100, blank=True, null=True)
    signature = models.ImageField(upload_to='signatures/', blank=True, null=True, help_text="Signature numérisée (fond transparent recommandé)")

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"


class Role(models.Model):
    """Catalogue des rôles de l'ERP (complète le champ User.role)."""

    CAPACITES = [
        ('admin', 'Administration (accès complet)'),
        ('direction', 'Direction générale'),
        ('finance', 'Finance & Comptabilité'),
        ('rh', 'Ressources Humaines'),
        ('logistique', 'Logistique & Supply Chain'),
        ('commercial', 'Commercial'),
        ('marketing', 'Marketing'),
    ]

    code = models.CharField(max_length=20, unique=True, help_text="Code interne (ex: ADMIN, DIR). Doit correspondre au champ User.role.")
    nom = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    couleur = models.CharField(max_length=20, default='#188701', help_text="Couleur du badge (hex).")
    permissions = models.JSONField(default=list, blank=True, help_text="Liste des capacités accordées (ex: ['finance', 'rh']).")
    est_actif = models.BooleanField(default=True)
    ordre = models.PositiveIntegerField(default=0)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['ordre', 'nom']
        verbose_name = 'Rôle'
        verbose_name_plural = 'Rôles'

    def __str__(self):
        return self.nom