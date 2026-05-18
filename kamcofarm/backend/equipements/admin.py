# Register your models here.
from django.contrib import admin
from .models import CapteurIoT, DonneesTelemetrie, AlerteIoT, RegleAlerteIoT
from .models import (
    CategorieEquipement,
    Equipement,
    CertificationEquipement,
    PlanMaintenancePreventive,
    InterventionMaintenance,
    ConsommationCarburant,
    MouvementEquipement,
    CycleVieEquipement
)


@admin.register(CategorieEquipement)
class CategorieEquipementAdmin(admin.ModelAdmin):
    list_display = ('nom', 'icone', 'est_active')
    list_filter = ('est_active',)
    search_fields = ('nom',)


class CertificationInline(admin.TabularInline):
    model = CertificationEquipement
    extra = 0
    readonly_fields = ('date_creation',)


class PlanMaintenanceInline(admin.TabularInline):
    model = PlanMaintenancePreventive
    extra = 0


@admin.register(Equipement)
class EquipementAdmin(admin.ModelAdmin):
    list_display = (
        'reference', 'nom', 'categorie', 'marque', 'modele',
        'statut', 'etat_general', 'localisation_actuelle',
        'heures_moteur', 'tarif_journalier', 'est_actif'
    )
    list_filter = ('statut', 'etat_general', 'categorie', 'type_energie', 'type_acquisition')
    search_fields = ('reference', 'nom', 'marque', 'modele', 'numero_serie', 'immatriculation')
    readonly_fields = ('reference',)
    ordering = ('nom',)
    inlines = [CertificationInline, PlanMaintenanceInline]

    fieldsets = (
        ('Identification', {
            'fields': (
                'reference', 'nom', 'categorie',
                'marque', 'modele', 'numero_serie',
                'annee_fabrication', 'immatriculation',
                'photo_principale'
            )
        }),
        ('Caractéristiques techniques', {
            'fields': (
                'puissance_cv', 'capacite_charge_kg',
                'type_energie', 'consommation_moyenne', 'reservoir_litres'
            )
        }),
        ('Compteurs', {
            'fields': ('heures_moteur', 'kilometres')
        }),
        ('État et localisation', {
            'fields': (
                'statut', 'etat_general',
                'localisation_actuelle', 'latitude', 'longitude'
            )
        }),
        ('Acquisition et valeur', {
            'fields': (
                'type_acquisition', 'date_acquisition',
                'prix_acquisition', 'valeur_residuelle',
                'duree_amortissement_mois', 'date_fin_garantie'
            )
        }),
        ('Tarifs de location', {
            'fields': (
                'tarif_journalier', 'tarif_hebdomadaire',
                'tarif_mensuel', 'tarif_horaire',
                'caution_requise', 'devise'
            )
        }),
        ('Option d\'achat', {
            'fields': ('option_achat_disponible', 'prix_option_achat'),
            'classes': ('collapse',)
        }),
        ('Maintenance', {
            'fields': (
                'seuil_maintenance_heures',
                'derniere_maintenance', 'heures_derniere_maintenance'
            )
        }),
        ('Documents', {
            'fields': ('document_technique', 'carte_grise')
        }),
        ('Autres', {
            'fields': ('notes', 'est_actif')
        }),
    )


@admin.register(CertificationEquipement)
class CertificationEquipementAdmin(admin.ModelAdmin):
    list_display = (
        'nom', 'equipement', 'type_certification',
        'date_obtention', 'date_expiration', 'statut', 'cout'
    )
    list_filter = ('type_certification', 'statut')
    search_fields = ('nom', 'equipement__nom', 'numero_certificat')
    ordering = ('date_expiration',)


@admin.register(PlanMaintenancePreventive)
class PlanMaintenancePreventiveAdmin(admin.ModelAdmin):
    list_display = (
        'nom', 'equipement', 'type_frequence',
        'seuil_heures', 'cout_estime', 'est_actif',
        'derniere_execution', 'prochaine_execution'
    )
    list_filter = ('type_frequence', 'est_actif')
    search_fields = ('nom', 'equipement__nom')


@admin.register(InterventionMaintenance)
class InterventionMaintenanceAdmin(admin.ModelAdmin):
    list_display = (
        'reference', 'equipement', 'type_intervention',
        'priorite', 'statut', 'cout_total',
        'technicien', 'date_planifiee', 'date_creation'
    )
    list_filter = ('type_intervention', 'statut', 'priorite', 'declenchee_par_iot')
    search_fields = ('reference', 'equipement__nom', 'description_probleme')
    readonly_fields = ('reference', 'cout_total')
    ordering = ('-date_creation',)

    fieldsets = (
        ('Équipement', {
            'fields': ('reference', 'equipement', 'plan_maintenance')
        }),
        ('Type et priorité', {
            'fields': ('type_intervention', 'priorite', 'statut')
        }),
        ('Description', {
            'fields': ('description_probleme', 'diagnostic', 'travaux_realises', 'pieces_utilisees')
        }),
        ('Compteurs', {
            'fields': ('heures_moteur_debut', 'km_debut')
        }),
        ('Coûts', {
            'fields': ('cout_pieces', 'cout_main_oeuvre', 'cout_total')
        }),
        ('Personnel', {
            'fields': ('technicien', 'prestataire_externe', 'signale_par')
        }),
        ('Dates', {
            'fields': ('date_planifiee', 'date_debut', 'date_fin', 'duree_reelle_heures')
        }),
        ('Documents', {
            'fields': ('rapport', 'photos_avant', 'photos_apres')
        }),
        ('IoT', {
            'fields': ('declenchee_par_iot', 'alerte_iot_data'),
            'classes': ('collapse',)
        }),
    )


@admin.register(ConsommationCarburant)
class ConsommationCarburantAdmin(admin.ModelAdmin):
    list_display = (
        'equipement', 'date_plein', 'quantite_litres',
        'cout_total', 'prix_litre', 'station', 'enregistre_par'
    )
    list_filter = ('equipement',)
    search_fields = ('equipement__nom', 'station')
    readonly_fields = ('prix_litre',)
    ordering = ('-date_plein',)


@admin.register(MouvementEquipement)
class MouvementEquipementAdmin(admin.ModelAdmin):
    list_display = (
        'equipement', 'type_mouvement',
        'lieu_depart', 'lieu_arrivee',
        'distance_km', 'date_mouvement', 'effectue_par'
    )
    list_filter = ('type_mouvement',)
    search_fields = ('equipement__nom', 'lieu_depart', 'lieu_arrivee')
    ordering = ('-date_mouvement',)


@admin.register(CycleVieEquipement)
class CycleVieEquipementAdmin(admin.ModelAdmin):
    list_display = (
        'equipement', 'evenement', 'date_evenement',
        'montant', 'acquereur', 'enregistre_par'
    )
    list_filter = ('evenement',)
    search_fields = ('equipement__nom', 'description', 'acquereur')
    ordering = ('date_evenement',)



######################################################
##### ADMINISTRATION DES CAPTEURS ET ALERTES IOT #####
######################################################


@admin.register(CapteurIoT)
class CapteurIoTAdmin(admin.ModelAdmin):
    list_display = (
        'identifiant', 'nom', 'equipement', 'type_capteur',
        'statut', 'derniere_valeur', 'derniere_lecture', 'est_actif'
    )
    list_filter = ('type_capteur', 'statut', 'est_actif')
    search_fields = ('identifiant', 'nom', 'equipement__nom')
    ordering = ('equipement', 'type_capteur')

    fieldsets = (
        ('Identification', {
            'fields': ('identifiant', 'nom', 'equipement', 'type_capteur', 'unite_mesure')
        }),
        ('Seuils d\'alerte', {
            'fields': ('seuil_min', 'seuil_max', 'seuil_critique_min', 'seuil_critique_max')
        }),
        ('État actuel', {
            'fields': ('statut', 'derniere_valeur', 'derniere_lecture')
        }),
        ('Configuration', {
            'fields': ('frequence_lecture_secondes', 'est_actif', 'firmware_version', 'date_installation')
        }),
    )


@admin.register(AlerteIoT)
class AlerteIoTAdmin(admin.ModelAdmin):
    list_display = (
        'titre', 'equipement', 'capteur', 'severite',
        'statut', 'valeur_declenchement', 'date_alerte'
    )
    list_filter = ('severite', 'statut')
    search_fields = ('titre', 'message', 'equipement__nom', 'capteur__identifiant')
    ordering = ('-date_alerte',)


@admin.register(RegleAlerteIoT)
class RegleAlerteIoTAdmin(admin.ModelAdmin):
    list_display = (
        'nom', 'type_capteur', 'condition', 'valeur_seuil',
        'severite', 'action', 'est_active'
    )
    list_filter = ('type_capteur', 'severite', 'action', 'est_active')
    search_fields = ('nom', 'description')
    ordering = ('type_capteur', 'nom')

    fieldsets = (
        ('Règle', {
            'fields': ('nom', 'description', 'type_capteur')
        }),
        ('Condition', {
            'fields': (
                'condition', 'valeur_seuil', 'valeur_seuil_max',
                'pourcentage_variation', 'duree_inactivite_minutes'
            )
        }),
        ('Action', {
            'fields': ('severite', 'action', 'est_active', 'cooldown_minutes')
        }),
    )