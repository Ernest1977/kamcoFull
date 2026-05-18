from django.contrib import admin
from .models import BlogPost

# Register your models here.


@admin.register(BlogPost)
class BlogPostAdmin(admin.ModelAdmin):
    list_display = ('titre_fr', 'auteur', 'date_publication', 'est_publie', 'ordre')
    list_filter = ('est_publie', 'date_publication')
    search_fields = ('titre_fr', 'titre_en', 'extrait_fr', 'extrait_en', 'auteur')
    ordering = ('ordre', '-date_publication')

    fieldsets = (
        ('Français', {
            'fields': ('titre_fr', 'extrait_fr', 'contenu_fr')
        }),
        ('English', {
            'fields': ('titre_en', 'extrait_en', 'contenu_en')
        }),
        ('Média & publication', {
            'fields': ('image', 'auteur', 'date_publication', 'est_publie', 'ordre')
        }),
    )