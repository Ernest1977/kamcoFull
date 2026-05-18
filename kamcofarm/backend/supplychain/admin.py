# Register your models here.

from django.contrib import admin
from .models import (
    Fournisseur,
    CommandeClient,
    LigneCommandeClient,
    CommandeFournisseur,
    LigneCommandeFournisseur,
    Livraison,
    MouvementStock
)


# ========================================
# FOURNISSEUR
# ========================================
@admin.register(Fournisseur)
class FournisseurAdmin(admin.ModelAdmin):
    list_display = ('nom', 'type_fournisseur', 'pays', 'telephone', 'est_actif', 'date_creation')
    list_filter = ('type_fournisseur', 'est_actif', 'pays')
    search_fields = ('nom', 'contact_nom', 'email', 'ville')
    ordering = ('nom',)


# ========================================
# COMMANDE CLIENT (avec lignes inline)
# ========================================
class LigneCommandeClientInline(admin.TabularInline):
    model = LigneCommandeClient
    extra = 1
    readonly_fields = ('sous_total',)


@admin.register(CommandeClient)
class CommandeClientAdmin(admin.ModelAdmin):
    list_display = (
        'reference', 'client_nom', 'client_entreprise',
        'statut', 'montant_total', 'devise',
        'date_commande', 'date_livraison_prevue'
    )
    list_filter = ('statut', 'devise')
    search_fields = ('reference', 'client_nom', 'client_entreprise', 'destination')
    readonly_fields = ('reference',)
    ordering = ('-date_commande',)
    inlines = [LigneCommandeClientInline]

    fieldsets = (
        ('Client', {
            'fields': ('client_nom', 'client_entreprise', 'client_email', 'client_telephone')
        }),
        ('Commande', {
            'fields': ('reference', 'destination', 'statut', 'montant_total', 'devise', 'notes')
        }),
        ('Dates', {
            'fields': ('date_livraison_prevue', 'date_livraison_effective')
        }),
        ('Interne', {
            'fields': ('creee_par',)
        }),
    )


# ========================================
# COMMANDE FOURNISSEUR (avec lignes inline)
# ========================================
class LigneCommandeFournisseurInline(admin.TabularInline):
    model = LigneCommandeFournisseur
    extra = 1
    readonly_fields = ('sous_total',)


@admin.register(CommandeFournisseur)
class CommandeFournisseurAdmin(admin.ModelAdmin):
    list_display = (
        'reference', 'fournisseur', 'statut',
        'montant_total', 'devise', 'date_commande', 'date_livraison_prevue'
    )
    list_filter = ('statut',)
    search_fields = ('reference', 'fournisseur__nom')
    readonly_fields = ('reference',)
    ordering = ('-date_commande',)
    inlines = [LigneCommandeFournisseurInline]


# ========================================
# LIVRAISON
# ========================================
@admin.register(Livraison)
class LivraisonAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'commande', 'transporteur', 'mode_transport',
        'statut', 'date_expedition', 'date_livraison_estimee'
    )
    list_filter = ('statut', 'mode_transport')
    search_fields = ('numero_tracking', 'transporteur', 'commande__reference')
    ordering = ('-date_creation',)


# ========================================
# MOUVEMENT STOCK
# ========================================
@admin.register(MouvementStock)
class MouvementStockAdmin(admin.ModelAdmin):
    list_display = (
        'produit', 'type_mouvement', 'quantite_kg',
        'effectue_par', 'date_mouvement'
    )
    list_filter = ('type_mouvement',)
    search_fields = ('produit__nom', 'motif')
    ordering = ('-date_mouvement',)