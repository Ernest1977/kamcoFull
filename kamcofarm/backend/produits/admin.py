# produits/admin.py
from django.contrib import admin
from .models import ProduitAgricole

# Enregistrement simple du modèle
admin.site.register(ProduitAgricole)

# (Optionnel: Pour un meilleur affichage dans l'admin)
# @admin.register(ProduitAgricole)
# class ProduitAdmin(admin.ModelAdmin):
#     list_display = ('nom', 'type_produit', 'stock_kg', 'est_premium')
#     list_filter = ('type_produit', 'est_premium')