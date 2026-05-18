from django.db import models
from django.core.validators import FileExtensionValidator

image = models.ImageField(
    upload_to='photos/',
    validators=[FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png', 'webp'])],
)

class Partenaire(models.Model):
    TYPE_CHOICES = [
        ('FOURNISSEUR', 'Fournisseur'),
        ('CLIENT_B2B', 'Client B2B'),
        ('DISTRIBUTEUR', 'Distributeur'),
        ('INVESTISSEUR', 'Investisseur'),
        ('INSTITUTION', 'Institution'),
        ('ONG', 'ONG / Association'),
        ('AUTRE', 'Autre'),
    ]

    nom = models.CharField(max_length=200)
    description_fr = models.TextField(blank=True, null=True)
    description_en = models.TextField(blank=True, null=True)

    logo = models.ImageField(
        upload_to='partners/',
        blank=True, null=True,
        help_text="Logo du partenaire"
    )

    type_partenaire = models.CharField(
        max_length=20, choices=TYPE_CHOICES, default='AUTRE'
    )

    # Contact
    contact_nom = models.CharField(
        max_length=200, blank=True, null=True,
        help_text="Nom du contact de référence"
    )
    contact_email = models.EmailField(
        blank=True, null=True,
        help_text="Email du contact"
    )
    contact_telephone = models.CharField(
        max_length=50, blank=True, null=True,
        help_text="Téléphone du contact"
    )

    # Localisation
    site_web = models.URLField(
        blank=True, null=True,
        help_text="Site web du partenaire"
    )
    ville = models.CharField(
        max_length=100, blank=True, null=True,
        help_text="Ville du partenaire"
    )
    pays = models.CharField(
        max_length=100, blank=True, null=True,
        default='Cameroun',
        help_text="Pays du partenaire"
    )

    # Affichage
    est_visible = models.BooleanField(
        default=True,
        help_text="Afficher sur le site public"
    )
    est_featured = models.BooleanField(
        default=False,
        help_text="Mettre en avant"
    )
    ordre = models.PositiveIntegerField(
        default=0,
        help_text="Ordre d'affichage"
    )
    date_debut_partenariat = models.DateField(
        blank=True, null=True,
        help_text="Date de début du partenariat"
    )

    def __str__(self):
        return f"{self.nom} ({self.get_type_partenaire_display()})"

    class Meta:
        ordering = ['ordre', 'nom']
        verbose_name = "Partenaire"
        verbose_name_plural = "Partenaires"