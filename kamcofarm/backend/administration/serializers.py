from rest_framework import serializers
from .models import (
    LogActivite,
    Notification,
    AnnonceInterne,
    ParametreGlobal,
    TacheInterne,
    HistoriqueModification
)


# ========================================
# LOG D'ACTIVITÉ
# ========================================
class LogActiviteSerializer(serializers.ModelSerializer):
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    module_display = serializers.CharField(source='get_module_display', read_only=True)
    severite_display = serializers.CharField(source='get_severite_display', read_only=True)
    utilisateur_nom = serializers.CharField(source='utilisateur.username', read_only=True)

    class Meta:
        model = LogActivite
        fields = [
            'id', 'utilisateur', 'utilisateur_nom',
            'action', 'action_display',
            'module', 'module_display',
            'severite', 'severite_display',
            'description',
            'objet_type', 'objet_id', 'objet_representation',
            'donnees_avant', 'donnees_apres',
            'ip_address', 'user_agent',
            'date_action'
        ]
        read_only_fields = ['utilisateur', 'ip_address', 'user_agent']


# ========================================
# NOTIFICATION
# ========================================
class NotificationSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_type_notification_display', read_only=True)
    priorite_display = serializers.CharField(source='get_priorite_display', read_only=True)
    expediteur_nom = serializers.CharField(source='expediteur.username', read_only=True)
    destinataire_nom = serializers.CharField(source='destinataire.username', read_only=True)

    class Meta:
        model = Notification
        fields = [
            'id', 'destinataire', 'destinataire_nom',
            'expediteur', 'expediteur_nom',
            'titre', 'message',
            'type_notification', 'type_display',
            'priorite', 'priorite_display',
            'lien_module', 'lien_objet_id', 'lien_url',
            'est_lue', 'date_lecture',
            'date_creation', 'date_expiration'
        ]
        read_only_fields = ['expediteur', 'date_lecture']


# ========================================
# ANNONCE INTERNE
# ========================================
class AnnonceInterneSerializer(serializers.ModelSerializer):
    priorite_display = serializers.CharField(source='get_priorite_display', read_only=True)
    destinataires_display = serializers.CharField(source='get_destinataires_display', read_only=True)
    publiee_par_nom = serializers.CharField(source='publiee_par.username', read_only=True)
    image_url = serializers.SerializerMethodField()
    piece_jointe_url = serializers.SerializerMethodField()

    class Meta:
        model = AnnonceInterne
        fields = [
            'id', 'titre', 'contenu',
            'priorite', 'priorite_display',
            'destinataires', 'destinataires_display',
            'image', 'image_url',
            'piece_jointe', 'piece_jointe_url',
            'est_active', 'est_epinglee',
            'publiee_par', 'publiee_par_nom',
            'date_publication', 'date_expiration'
        ]
        read_only_fields = ['publiee_par']

    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        return None

    def get_piece_jointe_url(self, obj):
        request = self.context.get('request')
        if obj.piece_jointe and request:
            return request.build_absolute_uri(obj.piece_jointe.url)
        return None


# ========================================
# PARAMÈTRE GLOBAL
# ========================================
class ParametreGlobalSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_type_valeur_display', read_only=True)
    categorie_display = serializers.CharField(source='get_categorie_display', read_only=True)
    modifie_par_nom = serializers.CharField(source='modifie_par.username', read_only=True)

    class Meta:
        model = ParametreGlobal
        fields = [
            'id', 'cle', 'valeur',
            'type_valeur', 'type_display',
            'categorie', 'categorie_display',
            'label', 'description',
            'est_modifiable', 'est_visible',
            'modifie_par', 'modifie_par_nom',
            'date_modification'
        ]
        read_only_fields = ['modifie_par']


# ========================================
# TÂCHE INTERNE
# ========================================
class TacheInterneSerializer(serializers.ModelSerializer):
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    priorite_display = serializers.CharField(source='get_priorite_display', read_only=True)
    assignee_a_nom = serializers.CharField(source='assignee_a.username', read_only=True)
    creee_par_nom = serializers.CharField(source='creee_par.username', read_only=True)
    est_en_retard = serializers.SerializerMethodField()

    class Meta:
        model = TacheInterne
        fields = [
            'id', 'titre', 'description',
            'statut', 'statut_display',
            'priorite', 'priorite_display',
            'assignee_a', 'assignee_a_nom',
            'creee_par', 'creee_par_nom',
            'date_echeance', 'date_debut', 'date_fin',
            'module_lie', 'commentaire',
            'est_en_retard',
            'date_creation', 'date_modification'
        ]
        read_only_fields = ['creee_par']

    def get_est_en_retard(self, obj):
        from datetime import date
        if obj.date_echeance and obj.statut not in ['TERMINEE', 'ANNULEE']:
            return obj.date_echeance < date.today()
        return False


# ========================================
# TÂCHE RÉSUMÉ (pour listes)
# ========================================
class TacheResumeSerializer(serializers.ModelSerializer):
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    priorite_display = serializers.CharField(source='get_priorite_display', read_only=True)
    assignee_a_nom = serializers.CharField(source='assignee_a.username', read_only=True)
    est_en_retard = serializers.SerializerMethodField()

    class Meta:
        model = TacheInterne
        fields = [
            'id', 'titre', 'statut', 'statut_display',
            'priorite', 'priorite_display',
            'assignee_a_nom', 'date_echeance',
            'est_en_retard'
        ]

    def get_est_en_retard(self, obj):
        from datetime import date
        if obj.date_echeance and obj.statut not in ['TERMINEE', 'ANNULEE']:
            return obj.date_echeance < date.today()
        return False




class HistoriqueModificationSerializer(serializers.ModelSerializer):
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    utilisateur_nom = serializers.SerializerMethodField()

    class Meta:
        model = HistoriqueModification
        fields = [
            'id', 'utilisateur', 'utilisateur_nom',
            'action', 'action_display',
            'module', 'objet_type', 'objet_id',
            'objet_representation',
            'champs_modifies', 'resume',
            'ip_address', 'date_modification'
        ]

    def get_utilisateur_nom(self, obj):
        if obj.utilisateur:
            full = obj.utilisateur.get_full_name()
            return full if full else obj.utilisateur.username
        return 'Système'