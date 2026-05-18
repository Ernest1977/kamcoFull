from django.contrib import admin
from .models import (
    ReservationEquipement,
    ContratLocation,
    EtatDesLieux,
    CautionLocation,
    ServiceAnnexe,
    FacturationLocation,
    LigneFacturationLocation,
    PaiementLocation
)


# ========================================
# RÉSERVATION
# ========================================
@admin.register(ReservationEquipement)
class ReservationEquipementAdmin(admin.ModelAdmin):
    list_display = (
        'reference', 'equipement', 'client_nom', 'client_entreprise',
        'date_debut_prevue', 'date_fin_prevue', 'nombre_jours',
        'montant_estime', 'devise', 'statut', 'date_creation'
    )
    list_filter = ('statut', 'mode_tarification', 'devise')
    search_fields = (
        'reference', 'client_nom', 'client_entreprise',
        'client_email', 'equipement__nom', 'equipement__reference'
    )
    readonly_fields = ('reference', 'nombre_jours', 'montant_estime')
    ordering = ('-date_creation',)

    fieldsets = (
        ('Équipement', {
            'fields': ('reference', 'equipement')
        }),
        ('Client', {
            'fields': (
                'client_nom', 'client_entreprise', 'client_email',
                'client_telephone', 'client_adresse', 'client_piece_identite'
            )
        }),
        ('Période et lieu', {
            'fields': (
                'date_debut_prevue', 'date_fin_prevue', 'nombre_jours',
                'lieu_utilisation', 'lieu_livraison'
            )
        }),
        ('Tarification', {
            'fields': (
                'mode_tarification', 'tarif_applique',
                'montant_estime', 'devise', 'caution_requise'
            )
        }),
        ('Statut', {
            'fields': ('statut', 'motif_annulation')
        }),
        ('Notes', {
            'fields': ('notes', 'conditions_speciales')
        }),
        ('Interne', {
            'fields': ('creee_par',)
        }),
    )


# ========================================
# CONTRAT — INLINES
# ========================================
class EtatDesLieuxInline(admin.TabularInline):
    model = EtatDesLieux
    extra = 0
    readonly_fields = ('date_creation',)
    fields = (
        'type_etat', 'etat_general', 'heures_moteur',
        'kilometres', 'niveau_carburant_pourcentage',
        'realise_par', 'date_realisation'
    )


class CautionInline(admin.TabularInline):
    model = CautionLocation
    extra = 0
    readonly_fields = ('reference', 'date_creation')
    fields = (
        'reference', 'montant_requis', 'montant_verse',
        'montant_retenu', 'montant_restitue',
        'mode_paiement', 'statut', 'date_versement'
    )


class ServiceAnnexeInline(admin.TabularInline):
    model = ServiceAnnexe
    extra = 0
    readonly_fields = ('montant_total',)
    fields = (
        'type_service', 'description', 'quantite',
        'unite', 'prix_unitaire', 'montant_total',
        'taux_tva_service', 'est_facture'
    )


class FacturationInline(admin.TabularInline):
    model = FacturationLocation
    extra = 0
    readonly_fields = ('reference', 'montant_tva', 'montant_ttc', 'solde_restant')
    fields = (
        'reference', 'montant_ht', 'taux_tva', 'montant_tva',
        'montant_ttc', 'montant_paye', 'solde_restant',
        'statut', 'date_emission', 'date_echeance'
    )


# ========================================
# CONTRAT DE LOCATION
# ========================================
@admin.register(ContratLocation)
class ContratLocationAdmin(admin.ModelAdmin):
    list_display = (
        'reference', 'equipement', 'client_nom', 'client_entreprise',
        'date_debut', 'date_fin_prevue', 'date_fin_effective',
        'montant_total_ttc', 'devise', 'statut',
        'option_achat_proposee', 'date_creation'
    )
    list_filter = (
        'statut', 'mode_tarification', 'devise',
        'option_achat_proposee', 'option_achat_exercee',
        'signe_hors_ligne'
    )
    search_fields = (
        'reference', 'client_nom', 'client_entreprise',
        'client_email', 'equipement__nom', 'equipement__reference'
    )
    readonly_fields = (
        'reference', 'sous_total_ht', 'montant_tva', 'montant_total_ttc'
    )
    ordering = ('-date_creation',)
    inlines = [EtatDesLieuxInline, CautionInline, ServiceAnnexeInline, FacturationInline]

    fieldsets = (
        ('Références', {
            'fields': ('reference', 'reservation')
        }),
        ('Équipement', {
            'fields': ('equipement',)
        }),
        ('Client', {
            'fields': (
                'client_nom', 'client_entreprise', 'client_email',
                'client_telephone', 'client_adresse',
                'client_piece_identite', 'client_registre_commerce'
            )
        }),
        ('Période', {
            'fields': (
                'date_debut', 'date_fin_prevue', 'date_fin_effective'
            )
        }),
        ('Tarification', {
            'fields': (
                'mode_tarification', 'tarif_base',
                'penalite_retard_par_jour'
            )
        }),
        ('Compteurs', {
            'fields': (
                'heures_moteur_depart', 'heures_moteur_retour',
                'km_depart', 'km_retour'
            )
        }),
        ('Montants', {
            'fields': (
                'montant_location_ht', 'montant_services_ht',
                'montant_penalites', 'remise',
                'sous_total_ht', 'taux_tva', 'montant_tva',
                'montant_total_ttc', 'devise'
            )
        }),
        ('Option d\'achat (RPO)', {
            'fields': (
                'option_achat_proposee', 'prix_option_achat',
                'option_achat_exercee', 'date_exercice_option'
            ),
            'classes': ('collapse',)
        }),
        ('Documents et signatures', {
            'fields': (
                'document_contrat', 'signature_client',
                'signature_entreprise', 'signe_hors_ligne'
            )
        }),
        ('Statut', {
            'fields': ('statut', 'conditions_generales', 'notes')
        }),
        ('Interne', {
            'fields': ('creee_par',)
        }),
    )


# ========================================
# ÉTAT DES LIEUX
# ========================================
@admin.register(EtatDesLieux)
class EtatDesLieuxAdmin(admin.ModelAdmin):
    list_display = (
        'contrat', 'type_etat', 'etat_general',
        'heures_moteur', 'kilometres', 'niveau_carburant_pourcentage',
        'realise_par', 'realise_hors_ligne', 'date_realisation'
    )
    list_filter = ('type_etat', 'etat_general', 'realise_hors_ligne')
    search_fields = (
        'contrat__reference', 'contrat__client_nom',
        'dommages_constates', 'observations'
    )
    ordering = ('-date_realisation',)

    fieldsets = (
        ('Contrat', {
            'fields': ('contrat', 'type_etat')
        }),
        ('État par composant', {
            'fields': (
                'etat_general', 'etat_carrosserie', 'etat_moteur',
                'etat_pneus', 'etat_hydraulique',
                'etat_electrique', 'etat_accessoires'
            )
        }),
        ('Compteurs', {
            'fields': (
                'heures_moteur', 'kilometres', 'niveau_carburant_pourcentage'
            )
        }),
        ('Observations', {
            'fields': (
                'dommages_constates', 'accessoires_presents', 'observations'
            )
        }),
        ('Photos', {
            'fields': (
                'photo_avant', 'photo_arriere',
                'photo_gauche', 'photo_droite',
                'photo_interieur', 'photo_dommages'
            ),
            'classes': ('collapse',)
        }),
        ('Signatures', {
            'fields': (
                'signature_client', 'signature_agent',
                'realise_hors_ligne'
            )
        }),
        ('Métadonnées', {
            'fields': ('realise_par', 'date_realisation')
        }),
    )


# ========================================
# CAUTION
# ========================================
@admin.register(CautionLocation)
class CautionLocationAdmin(admin.ModelAdmin):
    list_display = (
        'reference', 'contrat', 'montant_requis', 'montant_verse',
        'montant_retenu', 'montant_restitue',
        'mode_paiement', 'statut', 'date_versement', 'date_restitution'
    )
    list_filter = ('statut', 'mode_paiement')
    search_fields = (
        'reference', 'contrat__reference', 'contrat__client_nom',
        'reference_paiement'
    )
    readonly_fields = ('reference',)
    ordering = ('-date_creation',)

    fieldsets = (
        ('Contrat', {
            'fields': ('reference', 'contrat')
        }),
        ('Montants', {
            'fields': (
                'montant_requis', 'montant_verse',
                'montant_retenu', 'montant_restitue', 'devise'
            )
        }),
        ('Versement', {
            'fields': (
                'mode_paiement', 'reference_paiement',
                'preuve_versement', 'date_versement'
            )
        }),
        ('Restitution', {
            'fields': (
                'date_restitution', 'motif_retenue',
                'preuve_restitution'
            )
        }),
        ('Statut', {
            'fields': ('statut', 'notes')
        }),
        ('Interne', {
            'fields': ('enregistree_par',)
        }),
    )


# ========================================
# SERVICE ANNEXE
# ========================================
@admin.register(ServiceAnnexe)
class ServiceAnnexeAdmin(admin.ModelAdmin):
    list_display = (
        'contrat', 'type_service', 'description',
        'quantite', 'unite', 'prix_unitaire', 'montant_total',
        'taux_tva_service', 'est_facture', 'date_prestation'
    )
    list_filter = ('type_service', 'est_facture')
    search_fields = (
        'contrat__reference', 'description',
        'contrat__client_nom'
    )
    readonly_fields = ('montant_total',)
    ordering = ('-date_creation',)

    fieldsets = (
        ('Contrat', {
            'fields': ('contrat',)
        }),
        ('Service', {
            'fields': (
                'type_service', 'description',
                'quantite', 'unite', 'prix_unitaire', 'montant_total'
            )
        }),
        ('TVA et facturation', {
            'fields': ('taux_tva_service', 'est_facture', 'date_prestation')
        }),
        ('Notes', {
            'fields': ('notes',)
        }),
    )


# ========================================
# FACTURATION — INLINES
# ========================================
class LigneFacturationInline(admin.TabularInline):
    model = LigneFacturationLocation
    extra = 1
    readonly_fields = ('montant_total',)
    fields = (
        'type_ligne', 'description', 'quantite',
        'unite', 'prix_unitaire', 'montant_total',
        'taux_tva_specifique'
    )


class PaiementLocationInline(admin.TabularInline):
    model = PaiementLocation
    extra = 0
    readonly_fields = ('reference', 'date_creation')
    fields = (
        'reference', 'montant', 'mode_paiement',
        'statut', 'date_paiement', 'confirme_par'
    )


# ========================================
# FACTURATION LOCATION
# ========================================
@admin.register(FacturationLocation)
class FacturationLocationAdmin(admin.ModelAdmin):
    list_display = (
        'reference', 'contrat', 'client_nom', 'client_entreprise',
        'montant_ht', 'montant_ttc', 'montant_paye', 'solde_restant',
        'devise', 'statut', 'date_emission', 'date_echeance'
    )
    list_filter = ('statut', 'devise')
    search_fields = (
        'reference', 'contrat__reference',
        'client_nom', 'client_entreprise'
    )
    readonly_fields = ('reference', 'montant_tva', 'montant_ttc', 'solde_restant')
    ordering = ('-date_emission',)
    inlines = [LigneFacturationInline, PaiementLocationInline]

    fieldsets = (
        ('Contrat', {
            'fields': ('reference', 'contrat')
        }),
        ('Client', {
            'fields': (
                'client_nom', 'client_entreprise',
                'client_email', 'client_adresse'
            )
        }),
        ('Montants', {
            'fields': (
                'montant_ht', 'taux_tva', 'montant_tva',
                'montant_ttc', 'montant_paye', 'solde_restant', 'devise'
            )
        }),
        ('Paiement direct', {
            'fields': (
                'mode_paiement', 'reference_paiement', 'date_paiement'
            ),
            'classes': ('collapse',)
        }),
        ('Dates', {
            'fields': ('date_emission', 'date_echeance')
        }),
        ('Document', {
            'fields': ('document',)
        }),
        ('Statut', {
            'fields': ('statut', 'notes')
        }),
        ('Interne', {
            'fields': ('emise_par',)
        }),
    )


# ========================================
# LIGNE DE FACTURATION
# ========================================
@admin.register(LigneFacturationLocation)
class LigneFacturationLocationAdmin(admin.ModelAdmin):
    list_display = (
        'facturation', 'type_ligne', 'description',
        'quantite', 'unite', 'prix_unitaire', 'montant_total'
    )
    list_filter = ('type_ligne',)
    search_fields = ('description', 'facturation__reference')
    readonly_fields = ('montant_total',)
    ordering = ('facturation', 'type_ligne')


# ========================================
# PAIEMENT LOCATION
# ========================================
@admin.register(PaiementLocation)
class PaiementLocationAdmin(admin.ModelAdmin):
    list_display = (
        'reference', 'facturation', 'montant',
        'mode_paiement', 'statut',
        'date_paiement', 'date_confirmation', 'confirme_par'
    )
    list_filter = ('statut', 'mode_paiement')
    search_fields = (
        'reference', 'reference_externe',
        'facturation__reference', 'facturation__client_nom'
    )
    readonly_fields = ('reference',)
    ordering = ('-date_paiement',)

    fieldsets = (
        ('Facture', {
            'fields': ('reference', 'facturation')
        }),
        ('Paiement', {
            'fields': (
                'montant', 'mode_paiement',
                'reference_externe', 'preuve',
                'date_paiement'
            )
        }),
        ('Confirmation', {
            'fields': (
                'statut', 'date_confirmation', 'confirme_par'
            )
        }),
        ('Notes', {
            'fields': ('notes',)
        }),
    )