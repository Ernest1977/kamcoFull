from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    me, liste_utilisateurs, liste_equipe_commerciale,
    UserViewSet, mon_profil_complet, changer_mon_mot_de_passe,
    modifier_mon_profil
)

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    path('me/', me, name='me'),
    path('mon-profil/', mon_profil_complet, name='mon-profil-complet'),
    path('changer-mot-de-passe/', changer_mon_mot_de_passe, name='changer-mdp'),
    path('modifier-profil/', modifier_mon_profil, name='modifier-profil'),
    path('utilisateurs-disponibles/', liste_utilisateurs, name='utilisateurs-disponibles'),
    path('equipe-commerciale/', liste_equipe_commerciale, name='equipe-commerciale'),
] + router.urls