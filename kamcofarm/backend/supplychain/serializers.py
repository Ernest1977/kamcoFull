from rest_framework import serializers
from .models import (
    Fournisseur,
    CommandeClient,
    LigneCommandeClient,
    CommandeFournisseur,
    LigneCommandeFournisseur,
    Livraison,
    MouvementStock
)


# ========================================
# FOURNISSEUR
# ========================================
class FournisseurSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_type_fournisseur_display', read_only=True)

    class Meta:
        model = Fournisseur
        fields = '__all__'


# ========================================
# LIGNES COMMANDE CLIENT
# ========================================
class LigneCommandeClientSerializer(serializers.ModelSerializer):
    produit_nom = serializers.CharField(source='produit.nom', read_only=True)
    equipement_nom = serializers.CharField(source='equipement.nom', read_only=True)
    categorie_display = serializers.CharField(source='get_categorie_ligne_display', read_only=True)

    class Meta:
        model = LigneCommandeClient
        fields = [
            'id', 'categorie_ligne', 'categorie_display',
            'produit', 'produit_nom',
            'equipement', 'equipement_nom',
            'description', 'quantite_kg', 'prix_unitaire', 'sous_total'
        ]
        read_only_fields = ['sous_total']


# ========================================
# COMMANDE CLIENT
# ========================================
class CommandeClientSerializer(serializers.ModelSerializer):
    lignes = LigneCommandeClientSerializer(many=True, read_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    creee_par_nom = serializers.CharField(source='creee_par.username', read_only=True)

    class Meta:
        model = CommandeClient
        fields = [
            'id', 'reference', 'client_nom', 'client_entreprise',
            'client_email', 'client_telephone', 'destination',
            'statut', 'statut_display', 'montant_total', 'devise',
            'notes', 'date_commande', 'date_livraison_prevue',
            'date_livraison_effective', 'creee_par', 'creee_par_nom',
            'lignes'
        ]
        read_only_fields = ['reference', 'creee_par', 'creee_par_nom']


# ========================================
# LIGNES COMMANDE FOURNISSEUR
# ========================================
class LigneCommandeFournisseurSerializer(serializers.ModelSerializer):
    produit_nom = serializers.CharField(source='produit.nom', read_only=True)

    class Meta:
        model = LigneCommandeFournisseur
        fields = ['id', 'produit', 'produit_nom', 'quantite_kg', 'prix_unitaire', 'sous_total']
        read_only_fields = ['sous_total']


# ========================================
# COMMANDE FOURNISSEUR
# ========================================
class CommandeFournisseurSerializer(serializers.ModelSerializer):
    lignes = LigneCommandeFournisseurSerializer(many=True, read_only=True)
    fournisseur_nom = serializers.CharField(source='fournisseur.nom', read_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    creee_par_nom = serializers.CharField(source='creee_par.username', read_only=True)

    class Meta:
        model = CommandeFournisseur
        fields = [
            'id', 'reference', 'fournisseur', 'fournisseur_nom',
            'statut', 'statut_display', 'montant_total', 'devise',
            'notes', 'date_commande', 'date_livraison_prevue',
            'date_reception', 'creee_par', 'creee_par_nom',
            'lignes'
        ]
        read_only_fields = ['reference', 'creee_par', 'creee_par_nom']


# ========================================
# LIVRAISON
# ========================================
class LivraisonSerializer(serializers.ModelSerializer):
    commande_reference = serializers.CharField(source='commande.reference', read_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    mode_display = serializers.CharField(source='get_mode_transport_display', read_only=True)

    class Meta:
        model = Livraison
        fields = [
            'id', 'commande', 'commande_reference',
            'numero_tracking', 'transporteur', 'mode_transport', 'mode_display',
            'adresse_depart', 'adresse_arrivee',
            'poids_total_kg', 'cout_transport',
            'statut', 'statut_display',
            'date_expedition', 'date_livraison_estimee', 'date_livraison_effective',
            'notes', 'date_creation'
        ]


# ========================================
# MOUVEMENT STOCK
# ========================================
class MouvementStockSerializer(serializers.ModelSerializer):
    produit_nom = serializers.CharField(source='produit.nom', read_only=True)
    type_display = serializers.CharField(source='get_type_mouvement_display', read_only=True)
    effectue_par_nom = serializers.CharField(source='effectue_par.username', read_only=True)
    stock_restant = serializers.SerializerMethodField()
    fournisseur_nom = serializers.SerializerMethodField()
    commande_fournisseur_ref = serializers.SerializerMethodField()

    class Meta:
        model = MouvementStock
        fields = [
            'id', 'produit', 'produit_nom',
            'type_mouvement', 'type_display',
            'quantite_kg', 'motif',
            'commande_client', 'commande_fournisseur',
            'effectue_par', 'effectue_par_nom',
            'fournisseur_nom', 'commande_fournisseur_ref',
            'stock_restant',
            'date_mouvement'
        ]
        read_only_fields = ['effectue_par', 'effectue_par_nom']

    def get_stock_restant(self, obj):
        if obj.produit:
            return obj.produit.stock_kg
        return None

    def get_fournisseur_nom(self, obj):
        if obj.commande_fournisseur and obj.commande_fournisseur.fournisseur:
            return obj.commande_fournisseur.fournisseur.nom
        return None

    def get_commande_fournisseur_ref(self, obj):
        if obj.commande_fournisseur:
            return obj.commande_fournisseur.reference
        return None