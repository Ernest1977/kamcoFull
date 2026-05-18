from django.db import models
from django.core.validators import FileExtensionValidator

image = models.ImageField(
    upload_to='photos/',
    validators=[FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png', 'webp'])],
)

# Create your models here.

class BlogPost(models.Model):
    titre_fr = models.CharField(max_length=255)
    titre_en = models.CharField(max_length=255, blank=True, null=True)

    extrait_fr = models.TextField()
    extrait_en = models.TextField(blank=True, null=True)

    contenu_fr = models.TextField()
    contenu_en = models.TextField(blank=True, null=True)

    auteur = models.CharField(max_length=150, default='Admin')
    image = models.ImageField(upload_to='blog/', blank=True, null=True)

    date_publication = models.DateField()
    est_publie = models.BooleanField(default=True)
    ordre = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.titre_fr

    class Meta:
        ordering = ['ordre', '-date_publication', '-id']
        verbose_name = "Article de blog"
        verbose_name_plural = "Articles de blog"