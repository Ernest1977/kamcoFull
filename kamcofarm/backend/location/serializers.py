from rest_framework import serializers
from decimal import Decimal
from .models import (
    ReservationEquipement,
    ContratLocation,
    EtatDesLieux,
    CautionLocation,
    ServiceAnnexe,
    FacturationLocation,
    LigneFacturationLocation,
    PaiementLocation
)


# ========================================
# RÉSERVATION — COMPLET
# ========================================
class ReservationEquipementSerializer(serializers.ModelSerializer):
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    mode_tarification_display = serializers.CharField(source='get_mode_tarification_display', read_only=True)
    equipement_nom = serializers.CharField(source='equipement.nom', read_only=True)
    equipement_reference = serializers.CharField(source='equipement.reference', read_only=True)
    creee_par_nom = serializers.CharField(source='creee_par.username', read_only=True)
    a_contrat = serializers.SerializerMethodField()

    class Meta:
        model = ReservationEquipement
        fields = [
            'id', 'reference',
            'equipement', 'equipement_nom', 'equipement_reference',
            'client_nom', 'client_entreprise', 'client_email',
            'client_telephone', 'client_adresse', 'client_piece_identite',
            'date_debut_prevue', 'date_fin_prevue', 'nombre_jours',
            'lieu_utilisation', 'lieu_livraison',
            'mode_tarification', 'mode_tarification_display',
            'tarif_applique', 'montant_estime', 'devise',
            'caution_requise',
            'statut', 'statut_display', 'motif_annulation',
            'notes', 'conditions_speciales',
            'creee_par', 'creee_par_nom', 'a_contrat',
            'date_creation', 'date_modification'
        ]
        read_only_fields = ['reference', 'nombre_jours', 'montant_estime', 'creee_par']

    def get_a_contrat(self, obj):
        return hasattr(obj, 'contrat') and obj.contrat is not None


# ========================================
# RÉSERVATION — RÉSUMÉ (pour listes)
# ========================================
class ReservationResumeSerializer(serializers.ModelSerializer):
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    equipement_nom = serializers.CharField(source='equipement.nom', read_only=True)

    class Meta:
        model = ReservationEquipement
        fields = [
            'id', 'reference',
            'equipement_nom', 'client_nom', 'client_entreprise',
            'date_debut_prevue', 'date_fin_prevue', 'nombre_jours',
            'montant_estime', 'devise',
            'statut', 'statut_display',
            'date_creation'
        ]


# ========================================
# ÉTAT DES LIEUX
# ========================================
class EtatDesLieuxSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_type_etat_display', read_only=True)
    etat_general_display = serializers.CharField(source='get_etat_general_display', read_only=True)
    contrat_reference = serializers.CharField(source='contrat.reference', read_only=True)
    realise_par_nom = serializers.CharField(source='realise_par.username', read_only=True)

    # URLs des photos
    photo_avant_url = serializers.SerializerMethodField()
    photo_arriere_url = serializers.SerializerMethodField()
    photo_gauche_url = serializers.SerializerMethodField()
    photo_droite_url = serializers.SerializerMethodField()
    photo_interieur_url = serializers.SerializerMethodField()
    photo_dommages_url = serializers.SerializerMethodField()
    signature_client_url = serializers.SerializerMethodField()
    signature_agent_url = serializers.SerializerMethodField()

    class Meta:
        model = EtatDesLieux
        fields = [
            'id', 'contrat', 'contrat_reference',
            'type_etat', 'type_display',
            'etat_general', 'etat_general_display',
            'etat_carrosserie', 'etat_moteur',
            'etat_pneus', 'etat_hydraulique',
            'etat_electrique', 'etat_accessoires',
            'heures_moteur', 'kilometres', 'niveau_carburant_pourcentage',
            'dommages_constates', 'accessoires_presents', 'observations',
            'photo_avant', 'photo_avant_url',
            'photo_arriere', 'photo_arriere_url',
            'photo_gauche', 'photo_gauche_url',
            'photo_droite', 'photo_droite_url',
            'photo_interieur', 'photo_interieur_url',
            'photo_dommages', 'photo_dommages_url',
            'signature_client', 'signature_client_url',
            'signature_agent', 'signature_agent_url',
            'realise_hors_ligne',
            'realise_par', 'realise_par_nom',
            'date_realisation', 'date_creation'
        ]
        read_only_fields = ['realise_par']

    def _get_url(self, obj, field_name):
        request = self.context.get('request')
        field = getattr(obj, field_name, None)
        if field and request:
            return request.build_absolute_uri(field.url)
        return None

    def get_photo_avant_url(self, obj):
        return self._get_url(obj, 'photo_avant')

    def get_photo_arriere_url(self, obj):
        return self._get_url(obj, 'photo_arriere')

    def get_photo_gauche_url(self, obj):
        return self._get_url(obj, 'photo_gauche')

    def get_photo_droite_url(self, obj):
        return self._get_url(obj, 'photo_droite')

    def get_photo_interieur_url(self, obj):
        return self._get_url(obj, 'photo_interieur')

    def get_photo_dommages_url(self, obj):
        return self._get_url(obj, 'photo_dommages')

    def get_signature_client_url(self, obj):
        return self._get_url(obj, 'signature_client')

    def get_signature_agent_url(self, obj):
        return self._get_url(obj, 'signature_agent')


# ========================================
# CAUTION
# ========================================
class CautionLocationSerializer(serializers.ModelSerializer):
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    mode_paiement_display = serializers.CharField(source='get_mode_paiement_display', read_only=True)
    contrat_reference = serializers.CharField(source='contrat.reference', read_only=True)
    enregistree_par_nom = serializers.CharField(source='enregistree_par.username', read_only=True)
    solde_a_restituer = serializers.DecimalField(
        max_digits=12, decimal_places=2, read_only=True
    )
    preuve_versement_url = serializers.SerializerMethodField()
    preuve_restitution_url = serializers.SerializerMethodField()

    class Meta:
        model = CautionLocation
        fields = [
            'id', 'reference', 'contrat', 'contrat_reference',
            'montant_requis', 'montant_verse',
            'montant_retenu', 'montant_restitue',
            'solde_a_restituer', 'devise',
            'mode_paiement', 'mode_paiement_display',
            'reference_paiement',
            'preuve_versement', 'preuve_versement_url',
            'date_versement',
            'date_restitution', 'motif_retenue',
            'preuve_restitution', 'preuve_restitution_url',
            'statut', 'statut_display', 'notes',
            'enregistree_par', 'enregistree_par_nom',
            'date_creation', 'date_modification'
        ]
        read_only_fields = ['reference', 'enregistree_par']

    def get_preuve_versement_url(self, obj):
        request = self.context.get('request')
        if obj.preuve_versement and request:
            return request.build_absolute_uri(obj.preuve_versement.url)
        return None

    def get_preuve_restitution_url(self, obj):
        request = self.context.get('request')
        if obj.preuve_restitution and request:
            return request.build_absolute_uri(obj.preuve_restitution.url)
        return None


# ========================================
# SERVICE ANNEXE
# ========================================
class ServiceAnnexeSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_type_service_display', read_only=True)
    contrat_reference = serializers.CharField(source='contrat.reference', read_only=True)

    class Meta:
        model = ServiceAnnexe
        fields = [
            'id', 'contrat', 'contrat_reference',
            'type_service', 'type_display',
            'description', 'quantite', 'unite',
            'prix_unitaire', 'montant_total',
            'taux_tva_service',
            'date_prestation', 'est_facture', 'notes',
            'date_creation'
        ]
        read_only_fields = ['montant_total']


# ========================================
# LIGNE DE FACTURATION
# ========================================
class LigneFacturationLocationSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_type_ligne_display', read_only=True)

    class Meta:
        model = LigneFacturationLocation
        fields = [
            'id', 'facturation',
            'type_ligne', 'type_display',
            'description', 'quantite', 'unite',
            'prix_unitaire', 'montant_total',
            'taux_tva_specifique', 'service_annexe'
        ]
        read_only_fields = ['montant_total']


# ========================================
# PAIEMENT LOCATION
# ========================================
class PaiementLocationSerializer(serializers.ModelSerializer):
    mode_display = serializers.CharField(source='get_mode_paiement_display', read_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    facturation_reference = serializers.CharField(source='facturation.reference', read_only=True)
    confirme_par_nom = serializers.CharField(source='confirme_par.username', read_only=True)
    preuve_url = serializers.SerializerMethodField()

    class Meta:
        model = PaiementLocation
        fields = [
            'id', 'reference', 'facturation', 'facturation_reference',
            'montant', 'mode_paiement', 'mode_display',
            'statut', 'statut_display',
            'reference_externe', 'preuve', 'preuve_url', 'notes',
            'date_paiement', 'date_confirmation',
            'confirme_par', 'confirme_par_nom',
            'date_creation'
        ]
        read_only_fields = ['reference', 'confirme_par']

    def get_preuve_url(self, obj):
        request = self.context.get('request')
        if obj.preuve and request:
            return request.build_absolute_uri(obj.preuve.url)
        return None


# ========================================
# FACTURATION LOCATION — COMPLET (avec lignes et paiements)
# ========================================
class FacturationLocationSerializer(serializers.ModelSerializer):
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    contrat_reference = serializers.CharField(source='contrat.reference', read_only=True)
    equipement_nom = serializers.CharField(source='contrat.equipement.nom', read_only=True)
    emise_par_nom = serializers.CharField(source='emise_par.username', read_only=True)
    lignes = LigneFacturationLocationSerializer(many=True, read_only=True)
    paiements = PaiementLocationSerializer(many=True, read_only=True)
    nombre_paiements = serializers.SerializerMethodField()
    document_url = serializers.SerializerMethodField()

    class Meta:
        model = FacturationLocation
        fields = [
            'id', 'reference', 'contrat', 'contrat_reference', 'equipement_nom',
            'client_nom', 'client_entreprise', 'client_email', 'client_adresse',
            'montant_ht', 'taux_tva', 'montant_tva',
            'montant_ttc', 'montant_paye', 'solde_restant', 'devise',
            'mode_paiement', 'reference_paiement', 'date_paiement',
            'date_emission', 'date_echeance',
            'document', 'document_url',
            'statut', 'statut_display', 'notes',
            'emise_par', 'emise_par_nom',
            'lignes', 'paiements', 'nombre_paiements',
            'date_creation', 'date_modification'
        ]
        read_only_fields = [
            'reference', 'montant_tva', 'montant_ttc',
            'solde_restant', 'emise_par'
        ]

    def get_nombre_paiements(self, obj):
        return obj.paiements.filter(statut='CONFIRME').count()

    def get_document_url(self, obj):
        request = self.context.get('request')
        if obj.document and request:
            return request.build_absolute_uri(obj.document.url)
        return None


# ========================================
# FACTURATION — RÉSUMÉ (pour listes)
# ========================================
class FacturationResumeSerializer(serializers.ModelSerializer):
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    contrat_reference = serializers.CharField(source='contrat.reference', read_only=True)

    class Meta:
        model = FacturationLocation
        fields = [
            'id', 'reference', 'contrat_reference',
            'client_nom', 'client_entreprise',
            'montant_ttc', 'montant_paye', 'solde_restant', 'devise',
            'statut', 'statut_display',
            'date_emission', 'date_echeance'
        ]


# ========================================
# CONTRAT LOCATION — COMPLET (avec sous-ressources)
# ========================================
class ContratLocationSerializer(serializers.ModelSerializer):
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    mode_tarification_display = serializers.CharField(source='get_mode_tarification_display', read_only=True)
    equipement_nom = serializers.CharField(source='equipement.nom', read_only=True)
    equipement_reference = serializers.CharField(source='equipement.reference', read_only=True)
    reservation_reference = serializers.CharField(source='reservation.reference', read_only=True)
    creee_par_nom = serializers.CharField(source='creee_par.username', read_only=True)

    # Propriétés calculées
    jours_location = serializers.IntegerField(read_only=True)
    jours_retard = serializers.IntegerField(read_only=True)
    heures_utilisees = serializers.FloatField(read_only=True)
    km_parcourus = serializers.FloatField(read_only=True)

    # Sous-ressources
    etats_des_lieux = EtatDesLieuxSerializer(many=True, read_only=True)
    cautions = CautionLocationSerializer(many=True, read_only=True)
    services_annexes = ServiceAnnexeSerializer(many=True, read_only=True)
    nombre_factures = serializers.SerializerMethodField()

    # Documents
    document_contrat_url = serializers.SerializerMethodField()
    signature_client_url = serializers.SerializerMethodField()
    signature_entreprise_url = serializers.SerializerMethodField()

    class Meta:
        model = ContratLocation
        fields = [
            'id', 'reference',
            'reservation', 'reservation_reference',
            'equipement', 'equipement_nom', 'equipement_reference',
            'client_nom', 'client_entreprise', 'client_email',
            'client_telephone', 'client_adresse',
            'client_piece_identite', 'client_registre_commerce',
            'date_debut', 'date_fin_prevue', 'date_fin_effective',
            'jours_location', 'jours_retard',
            'mode_tarification', 'mode_tarification_display', 'tarif_base',
            'heures_moteur_depart', 'heures_moteur_retour',
            'km_depart', 'km_retour',
            'heures_utilisees', 'km_parcourus',
            'montant_location_ht', 'montant_services_ht',
            'montant_penalites', 'remise',
            'sous_total_ht', 'taux_tva', 'montant_tva',
            'montant_total_ttc', 'devise',
            'penalite_retard_par_jour',
            'option_achat_proposee', 'prix_option_achat',
            'option_achat_exercee', 'date_exercice_option',
            'document_contrat', 'document_contrat_url',
            'signature_client', 'signature_client_url',
            'signature_entreprise', 'signature_entreprise_url',
            'signe_hors_ligne',
            'statut', 'statut_display',
            'conditions_generales', 'notes',
            'creee_par', 'creee_par_nom',
            'etats_des_lieux', 'cautions',
            'services_annexes', 'nombre_factures',
            'date_creation', 'date_modification'
        ]
        read_only_fields = [
            'reference', 'sous_total_ht', 'montant_tva',
            'montant_total_ttc', 'creee_par'
        ]

    def get_nombre_factures(self, obj):
        return obj.facturations.count()

    def get_document_contrat_url(self, obj):
        request = self.context.get('request')
        if obj.document_contrat and request:
            return request.build_absolute_uri(obj.document_contrat.url)
        return None

    def get_signature_client_url(self, obj):
        request = self.context.get('request')
        if obj.signature_client and request:
            return request.build_absolute_uri(obj.signature_client.url)
        return None

    def get_signature_entreprise_url(self, obj):
        request = self.context.get('request')
        if obj.signature_entreprise and request:
            return request.build_absolute_uri(obj.signature_entreprise.url)
        return None


# ========================================
# CONTRAT — RÉSUMÉ (pour listes)
# ========================================
class ContratLocationResumeSerializer(serializers.ModelSerializer):
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    equipement_nom = serializers.CharField(source='equipement.nom', read_only=True)
    jours_retard = serializers.IntegerField(read_only=True)

    class Meta:
        model = ContratLocation
        fields = [
            'id', 'reference',
            'equipement_nom',
            'client_nom', 'client_entreprise',
            'date_debut', 'date_fin_prevue', 'date_fin_effective',
            'montant_total_ttc', 'devise',
            'statut', 'statut_display', 'jours_retard',
            'option_achat_proposee', 'option_achat_exercee',
            'date_creation'
        ]


# ========================================
# CRÉATION CONTRAT DEPUIS RÉSERVATION
# ========================================
class CreerContratDepuisReservationSerializer(serializers.Serializer):
    reservation_id = serializers.IntegerField()
    heures_moteur_depart = serializers.DecimalField(max_digits=10, decimal_places=1, required=False)
    km_depart = serializers.DecimalField(max_digits=10, decimal_places=1, required=False)
    taux_tva = serializers.DecimalField(max_digits=5, decimal_places=2, required=False, default=Decimal('19.25'))
    penalite_retard_par_jour = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, default=0)
    option_achat_proposee = serializers.BooleanField(required=False, default=False)
    prix_option_achat = serializers.DecimalField(max_digits=14, decimal_places=2, required=False, default=0)
    conditions_generales = serializers.CharField(required=False, allow_blank=True)


# ========================================
# GÉNÉRATION FACTURE DEPUIS CONTRAT
# ========================================
class GenererFactureContratSerializer(serializers.Serializer):
    date_emission = serializers.DateField()
    date_echeance = serializers.DateField()
    inclure_services = serializers.BooleanField(default=True)
    inclure_penalites = serializers.BooleanField(default=True)
    notes = serializers.CharField(required=False, allow_blank=True)