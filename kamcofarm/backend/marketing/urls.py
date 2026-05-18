from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import (
    SourceLeadViewSet,
    LeadViewSet,
    InteractionLeadViewSet,
    CampagneMarketingViewSet,
    AbonneNewsletterViewSet,
    PromotionViewSet,
    EvaluationSAVViewSet,
    inscription_newsletter,
    desinscription_newsletter,
    envoyer_campagne_newsletter,
    dashboard_marketing,
    synchroniser_sav,
    ClientConvertiViewSet
)

router = DefaultRouter()
router.register(r'sources-leads', SourceLeadViewSet, basename='source-lead')
router.register(r'leads', LeadViewSet, basename='lead')
router.register(r'interactions', InteractionLeadViewSet, basename='interaction-lead')
router.register(r'campagnes', CampagneMarketingViewSet, basename='campagne')
router.register(r'abonnes', AbonneNewsletterViewSet, basename='abonne')
router.register(r'promotions', PromotionViewSet, basename='promotion')
router.register(r'evaluations-sav', EvaluationSAVViewSet, basename='evaluation-sav')
router.register(r'clients-convertis', ClientConvertiViewSet, basename='client-converti')

urlpatterns = [
    # Newsletter publique
    path('newsletter/subscribe/', inscription_newsletter, name='inscription-newsletter'),
    path('newsletter/unsubscribe/', desinscription_newsletter, name='desinscription-newsletter'),
    path('newsletter/envoyer/', envoyer_campagne_newsletter, name='envoyer-newsletter'),
    path('sav/synchroniser/', synchroniser_sav, name='synchroniser-sav'),

    # Dashboard
    path('dashboard/', dashboard_marketing, name='dashboard-marketing'),
] + router.urls
