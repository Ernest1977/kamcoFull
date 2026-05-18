from django.db import models
from django.core.validators import FileExtensionValidator

# Create your models here.

# produits/models.py


class ProduitAgricole(models.Model):
    TYPE_CHOICES = [
        ('ANANAS', 'Ananas'),
        ('DESHYDRATE', 'Deshydrate'),
        ('EPICES', 'Epices'),
        ('FRUITS', 'Fruits'),
        ('LEGUME', 'Légume'),
        ('TUBERCULE', 'Tubercule'),
        ('AUTRE', 'Autre'),
    ]
    
    nom = models.CharField(max_length=100)
    type_produit = models.CharField(max_length=20, choices=TYPE_CHOICES)
    description_fr = models.TextField()
    description_en = models.TextField(blank=True, null=True)
    prix_unitaire_fcfa = models.DecimalField(max_digits=10, decimal_places=2)
    stock_kg = models.IntegerField(default=0)
    est_premium = models.BooleanField(default=False)


    # ✅ AJOUTE CE CHAMP ICI
    # image = models.ImageField(upload_to='produits/', blank=True, null=True)

    
    image = models.ImageField(
        upload_to='produits/',
        blank=True, null=True,
        validators=[FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png', 'webp'])],
    )

    def __str__(self):
        return self.nom
    
    #class Meta:
        #verbose_name = "Produit Agricole"
        #verbose_name_plural = "Produits Agricoles"