from django.db import models

# Create your models here.

class Statistiq(models.Model):
    label_fr = models.CharField(max_length=150)
    label_en = models.CharField(max_length=150, blank=True, null=True)
    valeur = models.PositiveIntegerField()
    suffixe = models.CharField(max_length=10, default='+', help_text="Ex: +, %, K")
    ordre = models.PositiveIntegerField(default=0)
    est_visible = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.valeur}{self.suffixe} - {self.label_fr}"

    class Meta:
        ordering = ['ordre', 'id']
        verbose_name = "Statistique"
        verbose_name_plural = "Statistiques"