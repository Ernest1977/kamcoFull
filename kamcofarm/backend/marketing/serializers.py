from rest_framework import serializers
from .models import (
    SourceLead,
    Lead,
    InteractionLead,
    CampagneMarketing,
    AbonneNewsletter,
    Promotion,
    EvaluationSAV,
    ClientConverti
)


# ========================================
# SOURCE LEAD
# ========================================
class SourceLeadSerializer(serializers.ModelSerializer):
    nombre_leads = serializers.SerializerMethodField()

    class Meta:
        model = SourceLead
        fields = ['id', 'nom', 'description', 'est_active', 'nombre_leads']

    def get_nombre_leads(self, obj):
        return obj.leads.count()


# ========================================
# INTERACTION LEAD
# ========================================
class InteractionLeadSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_type_interaction_display', read_only=True)
    effectuee_par_nom = serializers.CharField(source='effectuee_par.username', read_only=True)

    class Meta:
        model = InteractionLead
        fields = [
            'id', 'lead', 'type_interaction', 'type_display',
            'sujet', 'description', 'resultat',
            'effectuee_par', 'effectuee_par_nom',
            'date_interaction', 'date_creation'
        ]
        read_only_fields = ['effectuee_par']


# ========================================
# LEAD
# ========================================
class LeadSerializer(serializers.ModelSerializer):
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    priorite_display = serializers.CharField(source='get_priorite_display', read_only=True)
    source_nom = serializers.CharField(source='source.nom', read_only=True)
    assigne_a_nom = serializers.CharField(source='assigne_a.username', read_only=True)
    cree_par_nom = serializers.CharField(source='cree_par.username', read_only=True)
    interactions = InteractionLeadSerializer(many=True, read_only=True)
    nombre_interactions = serializers.SerializerMethodField()

    class Meta:
        model = Lead
        fields = [
            'id', 'reference',
            'nom', 'prenom', 'email', 'telephone',
            'entreprise', 'poste', 'pays', 'ville',
            'source', 'source_nom',
            'statut', 'statut_display',
            'priorite', 'priorite_display',
            'produits_interesses', 'budget_estime', 'volume_estime_tonnes',
            'notes', 'date_dernier_contact', 'date_prochain_contact',
            'assigne_a', 'assigne_a_nom',
            'date_conversion', 'raison_perte',
            'cree_par', 'cree_par_nom',
            'date_creation', 'date_modification',
            'interactions', 'nombre_interactions'
        ]
        read_only_fields = ['reference', 'cree_par']

    def get_nombre_interactions(self, obj):
        return obj.interactions.count()


# ========================================
# LEAD RÉSUMÉ (pour listes)
# ========================================
class LeadResumeSerializer(serializers.ModelSerializer):
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    priorite_display = serializers.CharField(source='get_priorite_display', read_only=True)
    source_nom = serializers.CharField(source='source.nom', read_only=True)
    assigne_a_nom = serializers.CharField(source='assigne_a.username', read_only=True)

    class Meta:
        model = Lead
        fields = [
            'id', 'reference', 'nom', 'prenom', 'email',
            'entreprise', 'pays',
            'statut', 'statut_display',
            'priorite', 'priorite_display',
            'source_nom', 'assigne_a_nom',
            'date_creation'
        ]


# ========================================
# CAMPAGNE MARKETING
# ========================================
class CampagneMarketingSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_type_campagne_display', read_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    responsable_nom = serializers.CharField(source='responsable.username', read_only=True)
    budget_restant = serializers.SerializerMethodField()

    class Meta:
        model = CampagneMarketing
        fields = [
            'id', 'nom', 'description',
            'type_campagne', 'type_display',
            'statut', 'statut_display',
            'date_debut', 'date_fin',
            'budget_prevu', 'budget_depense', 'budget_restant', 'devise',
            'objectif', 'public_cible',
            'leads_generes', 'conversions', 'impressions', 'clics',
            'taux_conversion', 'roi',
            'responsable', 'responsable_nom',
            'notes', 'date_creation', 'date_modification'
        ]

    def get_budget_restant(self, obj):
        return float(obj.budget_prevu - obj.budget_depense)


# ========================================
# ABONNÉ NEWSLETTER
# ========================================
class AbonneNewsletterSerializer(serializers.ModelSerializer):
    langue_display = serializers.CharField(source='get_langue_display', read_only=True)

    class Meta:
        model = AbonneNewsletter
        fields = [
            'id', 'email', 'nom', 'entreprise',
            'langue', 'langue_display',
            'est_actif', 'est_verifie', 'source',
            'date_inscription', 'date_desinscription'
        ]
        read_only_fields = ['est_verifie', 'token_verification', 'token_desinscription']


# ========================================
# INSCRIPTION NEWSLETTER (public)
# ========================================
class InscriptionNewsletterSerializer(serializers.ModelSerializer):
    class Meta:
        model = AbonneNewsletter
        fields = ['email', 'nom', 'entreprise', 'langue', 'source']


# ========================================
# PROMOTION
# ========================================
class PromotionSerializer(serializers.ModelSerializer):
    titre = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()
    type_display = serializers.CharField(source='get_type_promotion_display', read_only=True)
    produits_noms = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()
    est_valide = serializers.SerializerMethodField()
    usages_restants = serializers.SerializerMethodField()

    class Meta:
        model = Promotion
        fields = [
            'id', 'titre', 'description',
            'type_promotion', 'type_display',
            'valeur_reduction', 'code_promo',
            'produits', 'produits_noms', 'tous_produits',
            'montant_minimum', 'quantite_minimum_kg',
            'usage_maximum', 'usage_actuel', 'usages_restants',
            'date_debut', 'date_fin', 'est_active', 'est_valide',
            'image', 'date_creation'
        ]

    def _get_lang(self):
        request = self.context.get('request')
        if request and request.META.get('HTTP_ACCEPT_LANGUAGE', 'fr').startswith('en'):
            return 'en'
        return 'fr'

    def get_titre(self, obj):
        if self._get_lang() == 'en':
            return obj.titre_en or obj.titre_fr
        return obj.titre_fr

    def get_description(self, obj):
        if self._get_lang() == 'en':
            return obj.description_en or obj.description_fr
        return obj.description_fr

    def get_produits_noms(self, obj):
        return list(obj.produits.values_list('nom', flat=True))

    def get_image(self, obj):
        request = self.context.get('request')
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        return None

    def get_est_valide(self, obj):
        from django.utils import timezone
        now = timezone.now()
        if not obj.est_active:
            return False
        if now < obj.date_debut or now > obj.date_fin:
            return False
        if obj.usage_maximum > 0 and obj.usage_actuel >= obj.usage_maximum:
            return False
        return True

    def get_usages_restants(self, obj):
        if obj.usage_maximum == 0:
            return "Illimité"
        return max(0, obj.usage_maximum - obj.usage_actuel)



class EvaluationSAVSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_type_evaluation_display', read_only=True)
    canal_display = serializers.CharField(source='get_canal_display', read_only=True)
    enregistre_par_nom = serializers.CharField(source='enregistre_par.username', read_only=True)
    moyenne_satisfaction = serializers.FloatField(read_only=True)
    etoiles_moyenne = serializers.CharField(read_only=True)

    class Meta:
        model = EvaluationSAV
        fields = [
            'id', 'client_nom', 'client_entreprise',
            'client_email', 'client_telephone',
            'type_evaluation', 'type_display',
            'satisfaction_produit', 'satisfaction_service',
            'satisfaction_agent', 'satisfaction_globale',
            'moyenne_satisfaction', 'etoiles_moyenne',
            'notes', 'points_positifs', 'points_ameliorer',
            'recommande', 'canal', 'canal_display',
            'enregistre_par', 'enregistre_par_nom',
            'date_evaluation', 'date_creation'
        ]
        read_only_fields = ['enregistre_par']



class ClientConvertiSerializer(serializers.ModelSerializer):
    origine_display = serializers.CharField(source='get_origine_display', read_only=True)
    etoiles_satisfaction = serializers.SerializerMethodField()

    class Meta:
        model = ClientConverti
        fields = '__all__'
        read_only_fields = [
            'nb_achats', 'total_achats', 'nb_locations', 'total_locations',
            'nb_operations_total', 'montant_total', 'eligible_promotion',
            'raison_eligibilite', 'moyenne_satisfaction', 'nb_evaluations',
            'derniere_note_satisfaction', 'date_premiere_operation',
            'date_derniere_operation'
        ]

    def get_etoiles_satisfaction(self, obj):
        if obj.moyenne_satisfaction and float(obj.moyenne_satisfaction) > 0:
            return '⭐' * round(float(obj.moyenne_satisfaction))
        return None