
# Register your models here.

# gallery/admin.py
from django.contrib import admin
from .models import GaleriePhoto
@admin.register(GaleriePhoto)
class GaleriePhotoAdmin(admin.ModelAdmin):
    list_display = [
        'titre_fr',
        'categorie',
        'emoji',
        'est_visible',
        'ordre',
        'date_ajout'
    ]
    list_filter = ['categorie', 'est_visible']
    list_editable = ['est_visible', 'ordre']
    search_fields = ['titre_fr', 'titre_en', 'description_fr']
    ordering = ['ordre', '-date_ajout']
    fieldsets = (
        ('📸 Informations Principales', {
            'fields': ('image', 'categorie', 'emoji', 'est_visible', 'ordre')
        }),
        ('🇫🇷 Contenu Français', {
            'fields': ('titre_fr', 'description_fr')
        }),
        ('🇬🇧 Contenu Anglais', {
            'fields': ('titre_en', 'description_en'),
            'classes': ('collapse',)
        }),
    )