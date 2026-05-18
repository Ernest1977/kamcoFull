from django.contrib import admin
from .models import Testimonial

# Register your models here.
@admin.register(Testimonial)
class TestimonialAdmin(admin.ModelAdmin):
    list_display = (
        'nom_client',
        'entreprise',
        'note',
        'est_visible',
        'ordre',
        'date_ajout',
    )
    list_filter = ('est_visible', 'note')
    search_fields = (
        'nom_client',
        'entreprise',
        'fonction_client_fr',
        'fonction_client_en',
        'contenu_fr',
        'contenu_en',
    )
    ordering = ('ordre', '-date_ajout')

    fieldsets = (
        ('Informations client', {
            'fields': ('nom_client', 'entreprise', 'avatar_initiales', 'photo')
        }),
        ('Contenus multilingues', {
            'fields': (
                'fonction_client_fr',
                'fonction_client_en',
                'contenu_fr',
                'contenu_en',
            )
        }),
        ('Configuration', {
            'fields': ('note', 'est_visible', 'ordre')
        }),
    )