from django.db import models
from django.core.validators import FileExtensionValidator

# Create your models here.

class Testimonial(models.Model):
    nom_client = models.CharField(max_length=150)
    fonction_client_fr = models.CharField(max_length=200)
    fonction_client_en = models.CharField(max_length=200, blank=True, null=True)

    entreprise = models.CharField(max_length=200, blank=True, null=True)

    contenu_fr = models.TextField()
    contenu_en = models.TextField(blank=True, null=True)

    note = models.PositiveSmallIntegerField(default=5)
    avatar_initiales = models.CharField(max_length=5, blank=True, null=True)

    # photo = models.ImageField(upload_to='testimonials/', blank=True, null=True)
    photo = models.ImageField(
        upload_to='testimonials/', blank=True, null=True,
        validators=[FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png', 'webp'])],
    )

    est_visible = models.BooleanField(default=True)
    ordre = models.PositiveIntegerField(default=0)

    date_ajout = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.nom_client} - {self.entreprise or 'Client'}"

    class Meta:
        ordering = ['ordre', '-date_ajout']
        verbose_name = "Témoignage"
        verbose_name_plural = "Témoignages"