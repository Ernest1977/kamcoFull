# Register your models here.
from django.contrib import admin
from .models import (
    LogActivite,
    Notification,
    AnnonceInterne,
    ParametreGlobal,
    TacheInterne
)


# ========================================
# LOG D'ACTIVITÉ
# ========================================
@admin.register(LogActivite)
class LogActiviteAdmin(admin.ModelAdmin):
    list_display = (
        'date_action', 'utilisateur', 'action', 'module',
        'severite', 'description', 'ip_address'
    )
    list_filter = ('action', 'module', 'severite')
    search_fields = ('description', 'utilisateur__username', 'objet_representation')
    readonly_fields = (
        'utilisateur', 'action', 'module', 'severite',
        'description', 'objet_type', 'objet_id',
        'objet_representation', 'donnees_avant', 'donnees_apres',
        'ip_address', 'user_agent', 'date_action'
    )
    ordering = ('-date_action',)

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser


# ========================================
# NOTIFICATION
# ========================================
@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = (
        'destinataire', 'titre', 'type_notification',
        'priorite', 'est_lue', 'date_creation'
    )
    list_filter = ('type_notification', 'priorite', 'est_lue')
    search_fields = ('titre', 'message', 'destinataire__username')
    ordering = ('-date_creation',)

    fieldsets = (
        ('Destinataire', {
            'fields': ('destinataire', 'expediteur')
        }),
        ('Contenu', {
            'fields': ('titre', 'message', 'type_notification', 'priorite')
        }),
        ('Lien', {
            'fields': ('lien_module', 'lien_objet_id', 'lien_url')
        }),
        ('Statut', {
            'fields': ('est_lue', 'date_lecture', 'date_expiration')
        }),
    )


# ========================================
# ANNONCE INTERNE
# ========================================
@admin.register(AnnonceInterne)
class AnnonceInterneAdmin(admin.ModelAdmin):
    list_display = (
        'titre', 'priorite', 'destinataires',
        'est_active', 'est_epinglee',
        'publiee_par', 'date_publication'
    )
    list_filter = ('priorite', 'destinataires', 'est_active', 'est_epinglee')
    search_fields = ('titre', 'contenu')
    ordering = ('-est_epinglee', '-date_publication')

    fieldsets = (
        ('Contenu', {
            'fields': ('titre', 'contenu', 'image', 'piece_jointe')
        }),
        ('Configuration', {
            'fields': (
                'priorite', 'destinataires',
                'est_active', 'est_epinglee',
                'date_expiration'
            )
        }),
        ('Interne', {
            'fields': ('publiee_par',)
        }),
    )


# ========================================
# PARAMÈTRE GLOBAL
# ========================================
@admin.register(ParametreGlobal)
class ParametreGlobalAdmin(admin.ModelAdmin):
    list_display = (
        'cle', 'label', 'valeur', 'type_valeur',
        'categorie', 'est_modifiable', 'date_modification'
    )
    list_filter = ('categorie', 'type_valeur', 'est_modifiable')
    search_fields = ('cle', 'label', 'valeur', 'description')
    ordering = ('categorie', 'cle')

    fieldsets = (
        ('Paramètre', {
            'fields': ('cle', 'label', 'description')
        }),
        ('Valeur', {
            'fields': ('valeur', 'type_valeur', 'categorie')
        }),
        ('Accès', {
            'fields': ('est_modifiable', 'est_visible', 'modifie_par')
        }),
    )


# ========================================
# TÂCHE INTERNE
# ========================================
@admin.register(TacheInterne)
class TacheInterneAdmin(admin.ModelAdmin):
    list_display = (
        'titre', 'statut', 'priorite',
        'assignee_a', 'creee_par',
        'date_echeance', 'date_creation'
    )
    list_filter = ('statut', 'priorite')
    search_fields = ('titre', 'description', 'assignee_a__username')
    ordering = ('-priorite', 'date_echeance')

    fieldsets = (
        ('Tâche', {
            'fields': ('titre', 'description', 'module_lie')
        }),
        ('Attribution', {
            'fields': ('assignee_a', 'creee_par')
        }),
        ('Statut', {
            'fields': ('statut', 'priorite', 'commentaire')
        }),
        ('Dates', {
            'fields': ('date_echeance', 'date_debut', 'date_fin')
        }),
    )