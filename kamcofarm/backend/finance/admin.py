from django.contrib import admin
from .models import (
    DemandeDevis,
    Facture,
    LigneFacture,
    Paiement,
    CategorieDépense,
    DepenseOperationnelle,
    BudgetMensuel
)


# ========================================
# DEMANDE DEVIS
# ========================================
@admin.register(DemandeDevis)
class DemandeDevisAdmin(admin.ModelAdmin):
    list_display = (
        'nom_entreprise', 'nom_contact', 'email',
        'quantite_tonnes', 'frequence', 'destination',
        'traite', 'date_demande'
    )
    list_filter = ('traite', 'frequence')
    search_fields = ('nom_entreprise', 'nom_contact', 'email', 'destination')
    ordering = ('-date_demande',)


# ========================================
# FACTURE (avec lignes inline)
# ========================================
class LigneFactureInline(admin.TabularInline):
    model = LigneFacture
    extra = 1
    readonly_fields = ('sous_total',)


@admin.register(Facture)
class FactureAdmin(admin.ModelAdmin):
    list_display = (
        'numero', 'client_nom', 'client_entreprise',
        'montant_ttc', 'montant_paye', 'solde_restant',
        'devise', 'statut', 'date_emission', 'date_echeance'
    )
    list_filter = ('statut', 'devise')
    search_fields = ('numero', 'client_nom', 'client_entreprise')
    readonly_fields = ('numero', 'montant_tva', 'montant_ttc', 'solde_restant')
    ordering = ('-date_emission',)
    inlines = [LigneFactureInline]

    fieldsets = (
        ('Client', {
            'fields': (
                'commande', 'client_nom', 'client_entreprise',
                'client_email', 'client_telephone', 'client_adresse'
            )
        }),
        ('Montants', {
            'fields': (
                'numero', 'montant_ht', 'tva_pourcentage',
                'montant_tva', 'montant_ttc',
                'montant_paye', 'solde_restant', 'devise'
            )
        }),
        ('Statut & dates', {
            'fields': (
                'statut', 'date_emission', 'date_echeance'
            )
        }),
        ('Conditions', {
            'fields': ('conditions_paiement', 'notes', 'document')
        }),
        ('Interne', {
            'fields': ('creee_par',)
        }),
    )


# ========================================
# PAIEMENT
# ========================================
@admin.register(Paiement)
class PaiementAdmin(admin.ModelAdmin):
    list_display = (
        'reference', 'facture', 'montant',
        'mode_paiement', 'statut',
        'date_paiement', 'confirme_par'
    )
    list_filter = ('statut', 'mode_paiement')
    search_fields = ('reference', 'reference_externe', 'facture__numero')
    readonly_fields = ('reference',)
    ordering = ('-date_paiement',)


# ========================================
# CATÉGORIE DÉPENSE
# ========================================
@admin.register(CategorieDépense)
class CategorieDépenseAdmin(admin.ModelAdmin):
    list_display = ('nom', 'est_active')
    list_filter = ('est_active',)
    search_fields = ('nom',)


# ========================================
# DÉPENSE OPÉRATIONNELLE
# ========================================
@admin.register(DepenseOperationnelle)
class DepenseOperationnelleAdmin(admin.ModelAdmin):
    list_display = (
        'reference', 'categorie', 'description',
        'montant', 'devise', 'statut',
        'date_depense', 'soumis_par', 'approuve_par'
    )
    list_filter = ('statut', 'categorie')
    search_fields = ('reference', 'description')
    readonly_fields = ('reference',)
    ordering = ('-date_depense',)

    fieldsets = (
        ('Détails', {
            'fields': (
                'reference', 'categorie', 'description',
                'montant', 'devise', 'date_depense', 'justificatif'
            )
        }),
        ('Approbation', {
            'fields': (
                'statut', 'soumis_par',
                'approuve_par', 'date_approbation', 'notes'
            )
        }),
    )


# ========================================
# BUDGET MENSUEL
# ========================================
@admin.register(BudgetMensuel)
class BudgetMensuelAdmin(admin.ModelAdmin):
    list_display = (
        'mois', 'annee',
        'budget_prevu_revenus', 'revenus_reels',
        'budget_prevu_depenses', 'depenses_reelles',
        'solde_net', 'est_cloture'
    )
    list_filter = ('annee', 'est_cloture')
    readonly_fields = ('ecart_revenus', 'ecart_depenses', 'solde_net')
    ordering = ('-annee', '-mois')

    fieldsets = (
        ('Période', {
            'fields': ('mois', 'annee')
        }),
        ('Revenus', {
            'fields': (
                'budget_prevu_revenus', 'revenus_reels', 'ecart_revenus'
            )
        }),
        ('Dépenses', {
            'fields': (
                'budget_prevu_depenses', 'depenses_reelles', 'ecart_depenses'
            )
        }),
        ('Résultat', {
            'fields': ('solde_net', 'est_cloture', 'commentaire')
        }),
    )