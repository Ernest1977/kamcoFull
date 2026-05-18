# Register your models here.
from django.contrib import admin
from .models import (
    CategorieContenu,
    PageContenu,
    DocumentInterne,
    MediaFile,
    FAQ
)


# ========================================
# CATÉGORIE CONTENU
# ========================================
@admin.register(CategorieContenu)
class CategorieContenuAdmin(admin.ModelAdmin):
    list_display = ('nom', 'slug', 'icone', 'ordre', 'est_active')
    list_filter = ('est_active',)
    search_fields = ('nom',)
    prepopulated_fields = {'slug': ('nom',)}
    ordering = ('ordre', 'nom')


# ========================================
# PAGE CONTENU
# ========================================
@admin.register(PageContenu)
class PageContenuAdmin(admin.ModelAdmin):
    list_display = (
        'titre_fr', 'slug', 'categorie', 'statut',
        'est_mise_en_avant', 'auteur', 'date_publication'
    )
    list_filter = ('statut', 'categorie', 'est_mise_en_avant')
    search_fields = ('titre_fr', 'titre_en', 'contenu_fr', 'contenu_en')
    prepopulated_fields = {'slug': ('titre_fr',)}
    ordering = ('ordre', '-date_publication')

    fieldsets = (
        ('Français', {
            'fields': ('titre_fr', 'extrait_fr', 'contenu_fr', 'meta_description_fr')
        }),
        ('English', {
            'fields': ('titre_en', 'extrait_en', 'contenu_en', 'meta_description_en'),
            'classes': ('collapse',)
        }),
        ('Configuration', {
            'fields': (
                'slug', 'categorie', 'image_couverture',
                'statut', 'est_mise_en_avant', 'ordre',
                'auteur', 'date_publication'
            )
        }),
    )


# ========================================
# DOCUMENT INTERNE
# ========================================
@admin.register(DocumentInterne)
class DocumentInterneAdmin(admin.ModelAdmin):
    list_display = (
        'titre', 'type_document', 'visibilite', 'version',
        'extension', 'est_actif', 'uploade_par', 'date_upload'
    )
    list_filter = ('type_document', 'visibilite', 'est_actif')
    search_fields = ('titre', 'description')
    readonly_fields = ('taille_fichier', 'extension')
    ordering = ('-date_upload',)

    fieldsets = (
        ('Document', {
            'fields': (
                'titre', 'description', 'type_document',
                'visibilite', 'fichier', 'version'
            )
        }),
        ('Métadonnées', {
            'fields': ('taille_fichier', 'extension', 'est_actif', 'uploade_par')
        }),
    )


# ========================================
# FICHIER MÉDIA
# ========================================
@admin.register(MediaFile)
class MediaFileAdmin(admin.ModelAdmin):
    list_display = (
        'nom', 'type_media', 'extension',
        'taille_fichier', 'est_public',
        'uploade_par', 'date_upload'
    )
    list_filter = ('type_media', 'est_public')
    search_fields = ('nom', 'description', 'tags')
    readonly_fields = ('taille_fichier', 'extension', 'type_media')
    ordering = ('-date_upload',)

    fieldsets = (
        ('Fichier', {
            'fields': (
                'nom', 'description', 'fichier', 'miniature',
                'type_media', 'extension', 'taille_fichier'
            )
        }),
        ('Dimensions (images)', {
            'fields': ('largeur', 'hauteur'),
            'classes': ('collapse',)
        }),
        ('Configuration', {
            'fields': ('tags', 'est_public', 'uploade_par')
        }),
    )


# ========================================
# FAQ
# ========================================
@admin.register(FAQ)
class FAQAdmin(admin.ModelAdmin):
    list_display = ('question_fr', 'categorie', 'ordre', 'est_visible')
    list_filter = ('est_visible', 'categorie')
    search_fields = ('question_fr', 'question_en', 'reponse_fr', 'reponse_en')
    ordering = ('ordre', 'id')

    fieldsets = (
        ('Français', {
            'fields': ('question_fr', 'reponse_fr')
        }),
        ('English', {
            'fields': ('question_en', 'reponse_en'),
            'classes': ('collapse',)
        }),
        ('Configuration', {
            'fields': ('categorie', 'ordre', 'est_visible')
        }),
    )