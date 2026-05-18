from django.contrib import admin
from .models import Partenaire


@admin.register(Partenaire)
class PartenaireAdmin(admin.ModelAdmin):
    list_display = (
        'nom', 'type_partenaire', 'contact_nom',
        'contact_telephone', 'ville', 'pays',
        'est_visible', 'est_featured', 'ordre'
    )
    list_filter = ('type_partenaire', 'est_visible', 'est_featured', 'pays')
    search_fields = (
        'nom', 'description_fr', 'description_en',
        'contact_nom', 'contact_email', 'ville'
    )
    ordering = ('ordre', 'nom')

    fieldsets = (
        ('Informations', {
            'fields': ('nom', 'type_partenaire', 'logo')
        }),
        ('Description', {
            'fields': ('description_fr', 'description_en')
        }),
        ('Contact de référence', {
            'fields': ('contact_nom', 'contact_email', 'contact_telephone')
        }),
        ('Localisation', {
            'fields': ('site_web', 'ville', 'pays')
        }),
        ('Affichage', {
            'fields': (
                'est_visible', 'est_featured', 'ordre',
                'date_debut_partenariat'
            )
        }),
    )