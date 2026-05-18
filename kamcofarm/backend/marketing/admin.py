# Register your models here.
from django.contrib import admin
from .models import (
    SourceLead,
    Lead,
    InteractionLead,
    CampagneMarketing,
    AbonneNewsletter,
    Promotion,
    EvaluationSAV
)


# ========================================
# SOURCE LEAD
# ========================================
@admin.register(SourceLead)
class SourceLeadAdmin(admin.ModelAdmin):
    list_display = ('nom', 'est_active')
    list_filter = ('est_active',)
    search_fields = ('nom',)


# ========================================
# LEAD (avec interactions inline)
# ========================================
class InteractionLeadInline(admin.TabularInline):
    model = InteractionLead
    extra = 0
    readonly_fields = ('effectuee_par', 'date_creation')


@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display = (
        'reference', 'nom', 'entreprise', 'email',
        'statut', 'priorite', 'source',
        'assigne_a', 'date_creation'
    )
    list_filter = ('statut', 'priorite', 'source', 'pays')
    search_fields = ('reference', 'nom', 'prenom', 'entreprise', 'email')
    readonly_fields = ('reference',)
    ordering = ('-date_creation',)
    inlines = [InteractionLeadInline]

    fieldsets = (
        ('Prospect', {
            'fields': (
                'reference', 'nom', 'prenom', 'email', 'telephone',
                'entreprise', 'poste', 'pays', 'ville'
            )
        }),
        ('Qualification', {
            'fields': (
                'source', 'statut', 'priorite',
                'produits_interesses', 'budget_estime', 'volume_estime_tonnes'
            )
        }),
        ('Suivi', {
            'fields': (
                'notes', 'date_dernier_contact', 'date_prochain_contact',
                'assigne_a'
            )
        }),
        ('Conversion / Perte', {
            'fields': ('date_conversion', 'raison_perte'),
            'classes': ('collapse',)
        }),
        ('Interne', {
            'fields': ('cree_par',)
        }),
    )


# ========================================
# INTERACTION LEAD
# ========================================
@admin.register(InteractionLead)
class InteractionLeadAdmin(admin.ModelAdmin):
    list_display = (
        'lead', 'type_interaction', 'sujet',
        'effectuee_par', 'date_interaction'
    )
    list_filter = ('type_interaction',)
    search_fields = ('sujet', 'description', 'lead__nom')
    ordering = ('-date_interaction',)


# ========================================
# CAMPAGNE MARKETING
# ========================================
@admin.register(CampagneMarketing)
class CampagneMarketingAdmin(admin.ModelAdmin):
    list_display = (
        'nom', 'type_campagne', 'statut',
        'date_debut', 'date_fin',
        'budget_prevu', 'budget_depense',
        'leads_generes', 'conversions', 'taux_conversion',
        'responsable'
    )
    list_filter = ('statut', 'type_campagne')
    search_fields = ('nom', 'description', 'objectif')
    readonly_fields = ('taux_conversion', 'roi')
    ordering = ('-date_debut',)

    fieldsets = (
        ('Campagne', {
            'fields': (
                'nom', 'description', 'type_campagne', 'statut',
                'date_debut', 'date_fin'
            )
        }),
        ('Budget', {
            'fields': ('budget_prevu', 'budget_depense', 'devise')
        }),
        ('Objectifs & cibles', {
            'fields': ('objectif', 'public_cible')
        }),
        ('KPIs', {
            'fields': (
                'leads_generes', 'conversions', 'impressions', 'clics',
                'taux_conversion', 'roi'
            )
        }),
        ('Responsable', {
            'fields': ('responsable', 'notes')
        }),
    )


# ========================================
# ABONNÉ NEWSLETTER
# ========================================
@admin.register(AbonneNewsletter)
class AbonneNewsletterAdmin(admin.ModelAdmin):
    list_display = (
        'email', 'nom', 'entreprise', 'langue',
        'est_actif', 'est_verifie', 'source', 'date_inscription'
    )
    list_filter = ('est_actif', 'est_verifie', 'langue')
    search_fields = ('email', 'nom', 'entreprise')
    ordering = ('-date_inscription',)


# ========================================
# PROMOTION
# ========================================
@admin.register(Promotion)
class PromotionAdmin(admin.ModelAdmin):
    list_display = (
        'titre_fr', 'type_promotion', 'valeur_reduction',
        'code_promo', 'date_debut', 'date_fin',
        'usage_actuel', 'usage_maximum', 'est_active'
    )
    list_filter = ('type_promotion', 'est_active', 'tous_produits')
    search_fields = ('titre_fr', 'titre_en', 'code_promo')
    filter_horizontal = ('produits',)
    ordering = ('-date_debut',)

    fieldsets = (
        ('Français', {
            'fields': ('titre_fr', 'description_fr')
        }),
        ('English', {
            'fields': ('titre_en', 'description_en'),
            'classes': ('collapse',)
        }),
        ('Type & valeur', {
            'fields': ('type_promotion', 'valeur_reduction', 'code_promo', 'image')
        }),
        ('Produits', {
            'fields': ('produits', 'tous_produits')
        }),
        ('Conditions', {
            'fields': ('montant_minimum', 'quantite_minimum_kg', 'usage_maximum', 'usage_actuel')
        }),
        ('Période', {
            'fields': ('date_debut', 'date_fin', 'est_active')
        }),
        ('Interne', {
            'fields': ('creee_par',)
        }),
    )



@admin.register(EvaluationSAV)
class EvaluationSAVAdmin(admin.ModelAdmin):
    list_display = (
        'client_nom', 'client_entreprise', 'type_evaluation',
        'satisfaction_produit', 'satisfaction_service',
        'satisfaction_agent', 'satisfaction_globale',
        'recommande', 'canal', 'date_evaluation'
    )
    list_filter = ('type_evaluation', 'satisfaction_globale', 'recommande', 'canal')
    search_fields = ('client_nom', 'client_entreprise', 'notes')
    ordering = ('-date_evaluation',)