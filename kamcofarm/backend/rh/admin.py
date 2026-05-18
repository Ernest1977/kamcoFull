from django.contrib import admin

# Register your models here.

from django.contrib import admin
from .models import (
    Departement,
    Employe,
    ContratTravail,
    DemandeConge,
    Presence,
    FichePaie
)


# ========================================
# DÉPARTEMENT
# ========================================
@admin.register(Departement)
class DepartementAdmin(admin.ModelAdmin):
    list_display = ('nom', 'responsable', 'est_actif', 'date_creation')
    list_filter = ('est_actif',)
    search_fields = ('nom', 'description')


# ========================================
# EMPLOYÉ
# ========================================
@admin.register(Employe)
class EmployeAdmin(admin.ModelAdmin):
    list_display = (
        'matricule', 'nom_complet', 'user', 'poste', 'departement',
        'type_contrat', 'date_embauche', 'telephone_personnel', 'est_actif'
    )
    list_filter = ('est_actif', 'type_contrat', 'departement', 'genre')
    search_fields = (
        'matricule', 'user__username', 'user__first_name',
        'user__last_name', 'poste'
    )
    readonly_fields = ('matricule',)
    ordering = ('user__last_name',)

    fieldsets = (
        ('Informations personnelles', {
            'fields': (
                'user', 'matricule', 'nom_complet',
                'genre', 'photo',
                'date_naissance', 'lieu_naissance', 'nationalite',
                'statut_marital', 'niveau_etude'
            )
        }),
        ('Contact', {
            'fields': (
                'email_personnel', 'telephone_personnel',
                'ville', 'pays_residence', 'adresse',
                'contact_urgence_nom', 'contact_urgence_telephone'
            )
        }),
        ('Documents', {
            'fields': ('cv',)
        }),
    )


# ========================================
# CONTRAT DE TRAVAIL
# ========================================
@admin.register(ContratTravail)
class ContratTravailAdmin(admin.ModelAdmin):
    list_display = (
        'reference', 'employe', 'type_contrat',
        'date_debut', 'date_fin', 'salaire', 'statut'
    )
    list_filter = ('type_contrat', 'statut')
    search_fields = ('reference', 'employe__user__username')
    readonly_fields = ('reference',)
    ordering = ('-date_debut',)


# ========================================
# DEMANDE DE CONGÉ
# ========================================
@admin.register(DemandeConge)
class DemandeCongeAdmin(admin.ModelAdmin):
    list_display = (
        'employe', 'type_conge', 'date_debut', 'date_fin',
        'nombre_jours', 'statut', 'approuve_par', 'date_demande'
    )
    list_filter = ('statut', 'type_conge')
    search_fields = ('employe__user__username', 'motif')
    ordering = ('-date_demande',)

    fieldsets = (
        ('Demande', {
            'fields': (
                'employe', 'type_conge',
                'date_debut', 'date_fin', 'nombre_jours',
                'motif', 'justificatif'
            )
        }),
        ('Décision', {
            'fields': (
                'statut', 'approuve_par',
                'date_decision', 'commentaire_decision'
            )
        }),
    )


# ========================================
# PRÉSENCE
# ========================================
@admin.register(Presence)
class PresenceAdmin(admin.ModelAdmin):
    list_display = (
        'employe', 'date', 'heure_arrivee', 'heure_depart', 'statut'
    )
    list_filter = ('statut', 'date')
    search_fields = ('employe__user__username',)
    ordering = ('-date',)


# ========================================
# FICHE DE PAIE
# ========================================
@admin.register(FichePaie)
class FichePaieAdmin(admin.ModelAdmin):
    list_display = (
        'reference', 'employe', 'mois', 'annee',
        'salaire_brut', 'salaire_net', 'statut', 'payee_le'
    )
    list_filter = ('statut', 'mois', 'annee')
    search_fields = ('reference', 'employe__user__username')
    readonly_fields = ('reference', 'salaire_net')
    ordering = ('-annee', '-mois')

    fieldsets = (
        ('Employé & période', {
            'fields': ('reference', 'employe', 'mois', 'annee')
        }),
        ('Rémunération', {
            'fields': (
                'salaire_brut',
                'prime_transport', 'prime_logement',
                'prime_risque', 'autres_primes',
                'heures_supplementaires'
            )
        }),
        ('Déductions', {
            'fields': (
                'cotisation_cnps', 'impot_irpp', 'autres_deductions'
            )
        }),
        ('Résultat', {
            'fields': ('salaire_net', 'statut', 'document', 'payee_le')
        }),
    )