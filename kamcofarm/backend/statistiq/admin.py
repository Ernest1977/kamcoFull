from django.contrib import admin
from .models import Statistiq

# Register your models here.

@admin.register(Statistiq)
class StatistiqAdmin(admin.ModelAdmin):
    list_display = ('label_fr', 'valeur', 'suffixe', 'ordre', 'est_visible')
    list_filter = ('est_visible',)
    search_fields = ('label_fr', 'label_en')
    ordering = ('ordre', 'id')