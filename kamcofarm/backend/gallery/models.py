from django.db import models
from django.core.validators import FileExtensionValidator


image = models.ImageField(
    upload_to='photos/',
    validators=[FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png', 'webp'])],
)

# Create your models here.

class GaleriePhoto(models.Model):
    CATEGORIE_CHOICES = [
        ('PLANTATION', 'Plantation'),
        ('RECOLTE', 'Récolte'),
        ('CONDITIONNEMENT', 'Conditionnement'),
        ('EXPORT', 'Export & Logistique'),
        ('EQUIPE', 'Notre Équipe'),
        ('PRODUITS', 'Produits'),
        ('EVENEMENT', 'Événement'),
        ('AUTRE', 'Autre'),
    ]
    titre_fr = models.CharField(max_length=200)
    titre_en = models.CharField(max_length=200, blank=True, null=True)
    description_fr = models.TextField(blank=True, null=True)
    description_en = models.TextField(blank=True, null=True)
    image = models.ImageField(upload_to='gallery/', blank=True, null=True)
    categorie = models.CharField(
        max_length=20,
        choices=CATEGORIE_CHOICES,
        default='AUTRE'
    )
    emoji = models.CharField(
        max_length=10,
        blank=True,
        null=True,
        help_text="Emoji représentant la catégorie (ex: 🍍, 🥭, 📦)"
    )
    est_visible = models.BooleanField(
        default=True,
        help_text="Afficher cette photo sur le site public"
    )
    ordre = models.PositiveIntegerField(
        default=0,
        help_text="Ordre d'affichage (0 = premier)"
    )
    date_ajout = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    class Meta:
        verbose_name = "Photo Galerie"
        verbose_name_plural = "Photos Galerie"
        ordering = ['ordre', '-date_ajout']
    def __str__(self):
        return f"{self.titre_fr} ({self.categorie})"