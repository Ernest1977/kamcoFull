from rest_framework import serializers
from .models import (
    DemandeDevis,
    Facture,
    LigneFacture,
    Paiement,
    CategorieDépense,
    DepenseOperationnelle,
    BudgetMensuel
)


# ========================================
# DEMANDE DEVIS (existant - on garde)
# ========================================
class DemandeDevisSerializer(serializers.ModelSerializer):
    class Meta:
        model = DemandeDevis
        fields = '__all__'


# ========================================
# LIGNE FACTURE
# ========================================
class LigneFactureSerializer(serializers.ModelSerializer):
    produit_nom = serializers.CharField(source='produit.nom', read_only=True)
    equipement_nom = serializers.CharField(source='equipement.nom', read_only=True)
    categorie_display = serializers.CharField(source='get_categorie_ligne_display', read_only=True)

    class Meta:
        model = LigneFacture
        fields = [
            'id', 'categorie_ligne', 'categorie_display',
            'description', 'produit', 'produit_nom',
            'equipement', 'equipement_nom',
            'quantite', 'unite', 'prix_unitaire', 'sous_total'
        ]
        read_only_fields = ['sous_total']


# ========================================
# FACTURE
# ========================================
class FactureSerializer(serializers.ModelSerializer):
    lignes = LigneFactureSerializer(many=True, read_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    commande_reference = serializers.CharField(source='commande.reference', read_only=True)
    creee_par_nom = serializers.CharField(source='creee_par.username', read_only=True)
    nombre_paiements = serializers.SerializerMethodField()

    class Meta:
        model = Facture
        fields = [
            'id', 'numero', 'type_operation',
            'commande', 'commande_reference',
            'commande_source', 'contrat_location_source',
            'est_auto_generee',
            'client_nom', 'client_entreprise', 'client_email',
            'client_telephone', 'client_adresse',
            'montant_ht', 'tva_pourcentage', 'montant_tva',
            'montant_ttc', 'montant_paye', 'solde_restant',
            'devise', 'statut', 'statut_display',
            'date_emission', 'date_echeance',
            'conditions_paiement', 'notes', 'document',
            'creee_par', 'creee_par_nom',
            'date_creation', 'date_modification',
            'lignes', 'nombre_paiements'
        ]
        read_only_fields = [
            'numero', 'montant_tva', 'montant_ttc',
            'solde_restant', 'creee_par', 'creee_par_nom',
            'commande_reference', 'statut_display',
            'date_creation', 'date_modification',
            'nombre_paiements'
        ]

    def get_nombre_paiements(self, obj):
        return obj.paiements.filter(statut='CONFIRME').count()


# ========================================
# FACTURE RÉSUMÉ (pour listes)
# ========================================
class FactureResumeSerializer(serializers.ModelSerializer):
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)

    class Meta:
        model = Facture
        fields = [
            'id', 'numero', 'type_operation',
            'client_nom', 'client_entreprise',
            'montant_ttc', 'montant_paye', 'solde_restant',
            'devise', 'statut', 'statut_display',
            'est_auto_generee',
            'date_emission', 'date_echeance'
        ]


# ========================================
# PAIEMENT
# ========================================
class PaiementSerializer(serializers.ModelSerializer):
    facture_numero = serializers.CharField(source='facture.numero', read_only=True)
    mode_display = serializers.CharField(source='get_mode_paiement_display', read_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    confirme_par_nom = serializers.CharField(
        source='confirme_par.username', read_only=True
    )

    class Meta:
        model = Paiement
        fields = [
            'id', 'reference', 'facture', 'facture_numero',
            'montant', 'mode_paiement', 'mode_display',
            'statut', 'statut_display',
            'reference_externe', 'preuve', 'notes',
            'date_paiement', 'date_confirmation',
            'confirme_par', 'confirme_par_nom',
            'date_creation'
        ]
        read_only_fields = ['reference', 'confirme_par']


# ========================================
# CATÉGORIE DÉPENSE
# ========================================
class CategorieDépenseSerializer(serializers.ModelSerializer):
    nombre_depenses = serializers.SerializerMethodField()

    class Meta:
        model = CategorieDépense
        fields = ['id', 'nom', 'description', 'est_active', 'nombre_depenses']

    def get_nombre_depenses(self, obj):
        return obj.depenses.count()


# ========================================
# DÉPENSE OPÉRATIONNELLE
# ========================================
class DepenseOperationnelleSerializer(serializers.ModelSerializer):
    categorie_nom = serializers.CharField(source='categorie.nom', read_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    soumis_par_nom = serializers.CharField(source='soumis_par.username', read_only=True)
    approuve_par_nom = serializers.CharField(
        source='approuve_par.username', read_only=True
    )

    class Meta:
        model = DepenseOperationnelle
        fields = [
            'id', 'reference', 'categorie', 'categorie_nom',
            'description', 'montant', 'devise',
            'date_depense', 'justificatif',
            'statut', 'statut_display',
            'soumis_par', 'soumis_par_nom',
            'approuve_par', 'approuve_par_nom',
            'date_approbation', 'notes',
            'date_creation'
        ]
        read_only_fields = ['reference', 'soumis_par', 'approuve_par']


# ========================================
# BUDGET MENSUEL
# ========================================
class BudgetMensuelSerializer(serializers.ModelSerializer):
    mois_display = serializers.CharField(source='get_mois_display', read_only=True)
    taux_realisation_revenus = serializers.SerializerMethodField()
    taux_realisation_depenses = serializers.SerializerMethodField()

    class Meta:
        model = BudgetMensuel
        fields = [
            'id', 'mois', 'mois_display', 'annee',
            'budget_prevu_revenus', 'budget_prevu_depenses',
            'revenus_reels', 'depenses_reelles',
            'ecart_revenus', 'ecart_depenses', 'solde_net',
            'taux_realisation_revenus', 'taux_realisation_depenses',
            'commentaire', 'est_cloture',
            'date_creation', 'date_modification'
        ]
        read_only_fields = ['ecart_revenus', 'ecart_depenses', 'solde_net']

    def get_taux_realisation_revenus(self, obj):
        if obj.budget_prevu_revenus and obj.budget_prevu_revenus > 0:
            return round(float(obj.revenus_reels / obj.budget_prevu_revenus * 100), 1)
        return 0

    def get_taux_realisation_depenses(self, obj):
        if obj.budget_prevu_depenses and obj.budget_prevu_depenses > 0:
            return round(float(obj.depenses_reelles / obj.budget_prevu_depenses * 100), 1)
        return 0