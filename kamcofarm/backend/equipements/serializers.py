from rest_framework import serializers
from .models import (
    CategorieEquipement,
    Equipement,
    CertificationEquipement,
    PlanMaintenancePreventive,
    InterventionMaintenance,
    ConsommationCarburant,
    MouvementEquipement,
    CycleVieEquipement
)


# ========================================
# CATÉGORIE ÉQUIPEMENT
# ========================================
class CategorieEquipementSerializer(serializers.ModelSerializer):
    nombre_equipements = serializers.SerializerMethodField()

    class Meta:
        model = CategorieEquipement
        fields = ['id', 'nom', 'description', 'icone', 'est_active', 'nombre_equipements']

    def get_nombre_equipements(self, obj):
        return obj.equipements.filter(est_actif=True).count()


# ========================================
# CERTIFICATION
# ========================================
class CertificationEquipementSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_type_certification_display', read_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    equipement_nom = serializers.CharField(source='equipement.nom', read_only=True)
    est_expire = serializers.BooleanField(read_only=True)
    jours_restants = serializers.IntegerField(read_only=True)
    alerte_active = serializers.BooleanField(read_only=True)
    document_url = serializers.SerializerMethodField()

    class Meta:
        model = CertificationEquipement
        fields = [
            'id', 'equipement', 'equipement_nom',
            'type_certification', 'type_display',
            'nom', 'organisme', 'numero_certificat',
            'date_obtention', 'date_expiration',
            'statut', 'statut_display',
            'cout', 'document', 'document_url',
            'alerte_jours_avant',
            'est_expire', 'jours_restants', 'alerte_active',
            'notes', 'date_creation'
        ]

    def get_document_url(self, obj):
        request = self.context.get('request')
        if obj.document and request:
            return request.build_absolute_uri(obj.document.url)
        return None


# ========================================
# PLAN MAINTENANCE PRÉVENTIVE
# ========================================
class PlanMaintenancePreventiveSerializer(serializers.ModelSerializer):
    type_frequence_display = serializers.CharField(source='get_type_frequence_display', read_only=True)
    periodicite_display = serializers.CharField(source='get_periodicite_display', read_only=True)
    equipement_nom = serializers.CharField(source='equipement.nom', read_only=True)

    class Meta:
        model = PlanMaintenancePreventive
        fields = [
            'id', 'equipement', 'equipement_nom',
            'nom', 'description',
            'type_frequence', 'type_frequence_display',
            'seuil_heures', 'seuil_km',
            'periodicite', 'periodicite_display',
            'pieces_necessaires', 'cout_estime', 'duree_estimee_heures',
            'est_actif', 'derniere_execution', 'prochaine_execution'
        ]


# ========================================
# INTERVENTION MAINTENANCE
# ========================================
class InterventionMaintenanceSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_type_intervention_display', read_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    priorite_display = serializers.CharField(source='get_priorite_display', read_only=True)
    equipement_nom = serializers.CharField(source='equipement.nom', read_only=True)
    equipement_reference = serializers.CharField(source='equipement.reference', read_only=True)
    technicien_nom = serializers.CharField(source='technicien.username', read_only=True)
    signale_par_nom = serializers.CharField(source='signale_par.username', read_only=True)
    plan_nom = serializers.CharField(source='plan_maintenance.nom', read_only=True)

    class Meta:
        model = InterventionMaintenance
        fields = [
            'id', 'reference', 'equipement', 'equipement_nom', 'equipement_reference',
            'plan_maintenance', 'plan_nom',
            'type_intervention', 'type_display',
            'priorite', 'priorite_display',
            'statut', 'statut_display',
            'description_probleme', 'diagnostic',
            'travaux_realises', 'pieces_utilisees',
            'heures_moteur_debut', 'km_debut',
            'cout_pieces', 'cout_main_oeuvre', 'cout_total',
            'technicien', 'technicien_nom',
            'prestataire_externe',
            'date_planifiee', 'date_debut', 'date_fin', 'duree_reelle_heures',
            'rapport', 'photos_avant', 'photos_apres',
            'declenchee_par_iot', 'alerte_iot_data',
            'signale_par', 'signale_par_nom',
            'date_creation'
        ]
        read_only_fields = ['reference', 'cout_total', 'signale_par']


# ========================================
# INTERVENTION RÉSUMÉ (pour listes)
# ========================================
class InterventionResumeSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_type_intervention_display', read_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    priorite_display = serializers.CharField(source='get_priorite_display', read_only=True)
    equipement_nom = serializers.CharField(source='equipement.nom', read_only=True)

    class Meta:
        model = InterventionMaintenance
        fields = [
            'id', 'reference', 'equipement_nom',
            'type_intervention', 'type_display',
            'priorite', 'priorite_display',
            'statut', 'statut_display',
            'cout_total', 'date_planifiee', 'date_creation'
        ]


# ========================================
# CONSOMMATION CARBURANT
# ========================================
class ConsommationCarburantSerializer(serializers.ModelSerializer):
    equipement_nom = serializers.CharField(source='equipement.nom', read_only=True)
    enregistre_par_nom = serializers.CharField(source='enregistre_par.username', read_only=True)

    class Meta:
        model = ConsommationCarburant
        fields = [
            'id', 'equipement', 'equipement_nom',
            'date_plein', 'quantite_litres', 'cout_total', 'prix_litre',
            'heures_moteur_au_plein', 'km_au_plein',
            'station', 'enregistre_par', 'enregistre_par_nom',
            'date_creation'
        ]
        read_only_fields = ['prix_litre', 'enregistre_par']


# ========================================
# MOUVEMENT ÉQUIPEMENT
# ========================================
class MouvementEquipementSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_type_mouvement_display', read_only=True)
    equipement_nom = serializers.CharField(source='equipement.nom', read_only=True)
    effectue_par_nom = serializers.CharField(source='effectue_par.username', read_only=True)

    class Meta:
        model = MouvementEquipement
        fields = [
            'id', 'equipement', 'equipement_nom',
            'type_mouvement', 'type_display',
            'lieu_depart', 'lieu_arrivee',
            'latitude_depart', 'longitude_depart',
            'latitude_arrivee', 'longitude_arrivee',
            'distance_km', 'date_mouvement', 'notes',
            'effectue_par', 'effectue_par_nom',
            'date_creation'
        ]
        read_only_fields = ['effectue_par']


# ========================================
# CYCLE DE VIE
# ========================================
class CycleVieEquipementSerializer(serializers.ModelSerializer):
    evenement_display = serializers.CharField(source='get_evenement_display', read_only=True)
    equipement_nom = serializers.CharField(source='equipement.nom', read_only=True)
    enregistre_par_nom = serializers.CharField(source='enregistre_par.username', read_only=True)
    document_url = serializers.SerializerMethodField()

    class Meta:
        model = CycleVieEquipement
        fields = [
            'id', 'equipement', 'equipement_nom',
            'evenement', 'evenement_display',
            'date_evenement', 'description', 'montant',
            'acquereur', 'document', 'document_url',
            'enregistre_par', 'enregistre_par_nom',
            'date_creation'
        ]
        read_only_fields = ['enregistre_par']

    def get_document_url(self, obj):
        request = self.context.get('request')
        if obj.document and request:
            return request.build_absolute_uri(obj.document.url)
        return None


# ========================================
# ÉQUIPEMENT COMPLET
# ========================================
class EquipementSerializer(serializers.ModelSerializer):
    categorie_nom = serializers.CharField(source='categorie.nom', read_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    etat_display = serializers.CharField(source='get_etat_general_display', read_only=True)
    type_acquisition_display = serializers.CharField(source='get_type_acquisition_display', read_only=True)
    energie_display = serializers.CharField(source='get_type_energie_display', read_only=True)
    photo_url = serializers.SerializerMethodField()

    # Propriétés calculées
    heures_avant_maintenance = serializers.FloatField(read_only=True)
    maintenance_requise = serializers.BooleanField(read_only=True)
    valeur_actuelle_estimee = serializers.FloatField(read_only=True)

    # Sous-ressources
    certifications = CertificationEquipementSerializer(many=True, read_only=True)
    nombre_interventions = serializers.SerializerMethodField()
    nombre_certifications_actives = serializers.SerializerMethodField()

    class Meta:
        model = Equipement
        fields = [
            'id', 'reference', 'nom',
            'categorie', 'categorie_nom',
            'marque', 'modele', 'numero_serie',
            'annee_fabrication', 'immatriculation',
            'puissance_cv', 'capacite_charge_kg',
            'type_energie', 'energie_display',
            'consommation_moyenne', 'reservoir_litres',
            'heures_moteur', 'kilometres',
            'statut', 'statut_display',
            'etat_general', 'etat_display',
            'localisation_actuelle', 'latitude', 'longitude',
            'type_acquisition', 'type_acquisition_display',
            'date_acquisition', 'prix_acquisition',
            'valeur_residuelle', 'duree_amortissement_mois',
            'date_fin_garantie', 'valeur_actuelle_estimee',
            'tarif_journalier', 'tarif_hebdomadaire',
            'tarif_mensuel', 'tarif_horaire',
            'caution_requise', 'devise',
            'option_achat_disponible', 'prix_option_achat',
            'seuil_maintenance_heures', 'derniere_maintenance',
            'heures_derniere_maintenance',
            'heures_avant_maintenance', 'maintenance_requise',
            'photo_principale', 'photo_url',
            'document_technique', 'carte_grise',
            'notes', 'est_actif',
            'date_creation', 'date_modification',
            'certifications', 'nombre_interventions',
            'nombre_certifications_actives'
        ]
        read_only_fields = ['reference']

    def get_photo_url(self, obj):
        request = self.context.get('request')
        if obj.photo_principale and request:
            return request.build_absolute_uri(obj.photo_principale.url)
        return None

    def get_nombre_interventions(self, obj):
        return obj.interventions.count()

    def get_nombre_certifications_actives(self, obj):
        return obj.certifications.filter(statut='VALIDE').count()


# ========================================
# ÉQUIPEMENT RÉSUMÉ (pour listes)
# ========================================
class EquipementResumeSerializer(serializers.ModelSerializer):
    categorie_nom = serializers.CharField(source='categorie.nom', read_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    etat_display = serializers.CharField(source='get_etat_general_display', read_only=True)
    maintenance_requise = serializers.BooleanField(read_only=True)
    photo_url = serializers.SerializerMethodField()

    class Meta:
        model = Equipement
        fields = [
            'id', 'reference', 'nom',
            'categorie_nom', 'marque', 'modele',
            'statut', 'statut_display',
            'etat_general', 'etat_display',
            'localisation_actuelle',
            'heures_moteur', 'kilometres',
            'tarif_journalier', 'devise',
            'maintenance_requise',
            'photo_url', 'est_actif'
        ]

    def get_photo_url(self, obj):
        request = self.context.get('request')
        if obj.photo_principale and request:
            return request.build_absolute_uri(obj.photo_principale.url)
        return None
    

from .models import CapteurIoT, DonneesTelemetrie, AlerteIoT, RegleAlerteIoT


# ========================================
# CAPTEUR IoT
# ========================================
class CapteurIoTSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_type_capteur_display', read_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    equipement_nom = serializers.CharField(source='equipement.nom', read_only=True)
    equipement_reference = serializers.CharField(source='equipement.reference', read_only=True)
    est_en_alerte = serializers.SerializerMethodField()

    class Meta:
        model = CapteurIoT
        fields = [
            'id', 'identifiant', 'nom',
            'equipement', 'equipement_nom', 'equipement_reference',
            'type_capteur', 'type_display', 'unite_mesure',
            'statut', 'statut_display',
            'seuil_min', 'seuil_max',
            'seuil_critique_min', 'seuil_critique_max',
            'derniere_valeur', 'derniere_lecture',
            'frequence_lecture_secondes', 'est_actif',
            'firmware_version', 'date_installation',
            'est_en_alerte', 'date_creation'
        ]

    def get_est_en_alerte(self, obj):
        if obj.derniere_valeur is None:
            return False
        val = float(obj.derniere_valeur)
        if obj.seuil_critique_max and val >= float(obj.seuil_critique_max):
            return True
        if obj.seuil_critique_min and val <= float(obj.seuil_critique_min):
            return True
        if obj.seuil_max and val >= float(obj.seuil_max):
            return True
        if obj.seuil_min and val <= float(obj.seuil_min):
            return True
        return False


# ========================================
# DONNÉES TÉLÉMÉTRIE
# ========================================
class DonneesTelemetrieSerializer(serializers.ModelSerializer):
    capteur_identifiant = serializers.CharField(source='capteur.identifiant', read_only=True)
    capteur_type = serializers.CharField(source='capteur.get_type_capteur_display', read_only=True)
    equipement_nom = serializers.CharField(source='capteur.equipement.nom', read_only=True)

    class Meta:
        model = DonneesTelemetrie
        fields = [
            'id', 'capteur', 'capteur_identifiant', 'capteur_type',
            'equipement_nom',
            'valeur', 'unite',
            'latitude', 'longitude',
            'metadata', 'est_anomalie',
            'timestamp', 'date_reception'
        ]


# ========================================
# DONNÉES TÉLÉMÉTRIE (réception IoT simplifiée)
# ========================================
class ReceptionTelemetrieSerializer(serializers.Serializer):
    capteur_id = serializers.CharField(help_text="Identifiant unique du capteur")
    valeur = serializers.DecimalField(max_digits=12, decimal_places=4)
    unite = serializers.CharField(required=False, allow_blank=True)
    latitude = serializers.DecimalField(max_digits=10, decimal_places=7, required=False)
    longitude = serializers.DecimalField(max_digits=10, decimal_places=7, required=False)
    timestamp = serializers.DateTimeField()
    metadata = serializers.JSONField(required=False)


# ========================================
# ALERTE IoT
# ========================================
class AlerteIoTSerializer(serializers.ModelSerializer):
    severite_display = serializers.CharField(source='get_severite_display', read_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    capteur_identifiant = serializers.CharField(source='capteur.identifiant', read_only=True)
    capteur_type = serializers.CharField(source='capteur.get_type_capteur_display', read_only=True)
    equipement_nom = serializers.CharField(source='equipement.nom', read_only=True)
    equipement_reference = serializers.CharField(source='equipement.reference', read_only=True)
    intervention_reference = serializers.CharField(source='intervention_creee.reference', read_only=True)
    acquittee_par_nom = serializers.CharField(source='acquittee_par.username', read_only=True)

    class Meta:
        model = AlerteIoT
        fields = [
            'id', 'capteur', 'capteur_identifiant', 'capteur_type',
            'equipement', 'equipement_nom', 'equipement_reference',
            'severite', 'severite_display',
            'statut', 'statut_display',
            'titre', 'message',
            'valeur_declenchement', 'seuil_depasse',
            'donnee_telemetrie',
            'intervention_creee', 'intervention_reference',
            'acquittee_par', 'acquittee_par_nom',
            'date_acquittement', 'commentaire_resolution',
            'date_alerte'
        ]
        read_only_fields = ['acquittee_par', 'date_acquittement']


# ========================================
# RÈGLE D'ALERTE IoT
# ========================================
class RegleAlerteIoTSerializer(serializers.ModelSerializer):
    type_capteur_display = serializers.CharField(source='get_type_capteur_display', read_only=True)
    condition_display = serializers.CharField(source='get_condition_display', read_only=True)
    severite_display = serializers.CharField(source='get_severite_display', read_only=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)

    class Meta:
        model = RegleAlerteIoT
        fields = [
            'id', 'nom', 'description',
            'type_capteur', 'type_capteur_display',
            'condition', 'condition_display',
            'valeur_seuil', 'valeur_seuil_max',
            'pourcentage_variation', 'duree_inactivite_minutes',
            'severite', 'severite_display',
            'action', 'action_display',
            'est_active', 'cooldown_minutes',
            'date_creation'
        ]