# Create your models here.

from django.db import models
from django.conf import settings
import uuid

# ========================================
# FOURNISSEUR
# ========================================
class Fournisseur(models.Model):
    TYPE_CHOICES = [
        ('LOCAL', 'Fournisseur Local'),
        ('INTERNATIONAL', 'Fournisseur International'),
    ]

    nom = models.CharField(max_length=200)
    contact_nom = models.CharField(max_length=150, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    telephone = models.CharField(max_length=50, blank=True, null=True)
    adresse = models.TextField(blank=True, null=True)
    ville = models.CharField(max_length=100, blank=True, null=True)
    pays = models.CharField(max_length=100, default='Cameroun')
    type_fournisseur = models.CharField(max_length=20, choices=TYPE_CHOICES, default='LOCAL')
    produits_fournis = models.TextField(blank=True, null=True, help_text="Description des produits fournis")
    est_actif = models.BooleanField(default=True)
    date_creation = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.nom} ({self.get_type_fournisseur_display()})"

    class Meta:
        ordering = ['nom']
        verbose_name = "Fournisseur"
        verbose_name_plural = "Fournisseurs"


# ========================================
# COMMANDE CLIENT (B2B)
# ========================================
class CommandeClient(models.Model):
    STATUT_CHOICES = [
        ('EN_ATTENTE', 'En attente'),
        ('CONFIRMEE', 'Confirmée'),
        ('EN_PREPARATION', 'En préparation'),
        ('EXPEDIEE', 'Expédiée'),
        ('LIVREE', 'Livrée'),
        ('ANNULEE', 'Annulée'),
    ]

    reference = models.CharField(max_length=50, unique=True, editable=False)
    client_nom = models.CharField(max_length=200)
    client_entreprise = models.CharField(max_length=200, blank=True, null=True)
    client_email = models.EmailField(blank=True, null=True)
    client_telephone = models.CharField(max_length=50, blank=True, null=True)

    destination = models.CharField(max_length=255)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='EN_ATTENTE')

    montant_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    devise = models.CharField(max_length=10, default='FCFA')

    notes = models.TextField(blank=True, null=True)

    date_commande = models.DateTimeField(auto_now_add=True)
    date_livraison_prevue = models.DateField(blank=True, null=True)
    date_livraison_effective = models.DateField(blank=True, null=True)

    creee_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='commandes_creees'
    )

    def save(self, *args, **kwargs):
        if not self.reference:
            self.reference = f"CMD-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.reference} - {self.client_nom} ({self.get_statut_display()})"

    class Meta:
        ordering = ['-date_commande']
        verbose_name = "Commande Client"
        verbose_name_plural = "Commandes Clients"


# ========================================
# LIGNE DE COMMANDE CLIENT
# ========================================
class LigneCommandeClient(models.Model):
    CATEGORIE_CHOICES = [
        ('PRODUIT_AGRICOLE', 'Produit agricole'),
        ('MATERIEL', 'Matériel / Équipement'),
        ('SERVICE', 'Prestation de service'),
        ('AUTRE', 'Autre'),
    ]

    commande = models.ForeignKey(
        CommandeClient,
        on_delete=models.CASCADE,
        related_name='lignes'
    )
    categorie_ligne = models.CharField(
        max_length=20,
        choices=CATEGORIE_CHOICES,
        default='PRODUIT_AGRICOLE'
    )
    produit = models.ForeignKey(
        'produits.ProduitAgricole',
        on_delete=models.PROTECT,
        null=True, blank=True,
        related_name='lignes_commandes'
    )
    equipement = models.ForeignKey(
        'equipements.Equipement',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='lignes_commandes',
        help_text="Équipement si vente de matériel"
    )
    description = models.CharField(max_length=500, blank=True, null=True)
    quantite_kg = models.DecimalField(max_digits=10, decimal_places=2)
    prix_unitaire = models.DecimalField(max_digits=10, decimal_places=2)
    sous_total = models.DecimalField(max_digits=12, decimal_places=2, editable=False, default=0)

    def save(self, *args, **kwargs):
        self.sous_total = self.quantite_kg * self.prix_unitaire

        if not self.categorie_ligne or self.categorie_ligne == 'AUTRE':
            if self.produit:
                self.categorie_ligne = 'PRODUIT_AGRICOLE'
            elif self.equipement:
                self.categorie_ligne = 'MATERIEL'

        # Auto-remplir la description
        if not self.description:
            if self.produit:
                self.description = self.produit.nom
            elif self.equipement:
                self.description = self.equipement.nom

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.description or 'Ligne'} x {self.quantite_kg}kg"


# ========================================
# COMMANDE FOURNISSEUR
# ========================================
class CommandeFournisseur(models.Model):
    STATUT_CHOICES = [
        ('BROUILLON', 'Brouillon'),
        ('ENVOYEE', 'Envoyée au fournisseur'),
        ('CONFIRMEE', 'Confirmée'),
        ('RECUE', 'Marchandise reçue'),
        ('ANNULEE', 'Annulée'),
    ]

    reference = models.CharField(max_length=50, unique=True, editable=False)
    fournisseur = models.ForeignKey(
        Fournisseur,
        on_delete=models.PROTECT,
        related_name='commandes'
    )
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='BROUILLON')
    montant_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    devise = models.CharField(max_length=10, default='FCFA')
    notes = models.TextField(blank=True, null=True)

    date_commande = models.DateTimeField(auto_now_add=True)
    date_livraison_prevue = models.DateField(blank=True, null=True)
    date_reception = models.DateField(blank=True, null=True)

    creee_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='commandes_fournisseur_creees'
    )

    def save(self, *args, **kwargs):
        if not self.reference:
            self.reference = f"ACH-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.reference} - {self.fournisseur.nom} ({self.get_statut_display()})"

    class Meta:
        ordering = ['-date_commande']
        verbose_name = "Commande Fournisseur"
        verbose_name_plural = "Commandes Fournisseurs"


# ========================================
# LIGNE DE COMMANDE FOURNISSEUR
# ========================================
class LigneCommandeFournisseur(models.Model):
    commande = models.ForeignKey(
        CommandeFournisseur,
        on_delete=models.CASCADE,
        related_name='lignes'
    )
    produit = models.ForeignKey(
        'produits.ProduitAgricole',
        on_delete=models.PROTECT,
        related_name='lignes_achats'
    )
    quantite_kg = models.DecimalField(max_digits=10, decimal_places=2)
    prix_unitaire = models.DecimalField(max_digits=10, decimal_places=2)
    sous_total = models.DecimalField(max_digits=12, decimal_places=2, editable=False, default=0)

    def save(self, *args, **kwargs):
        self.sous_total = self.quantite_kg * self.prix_unitaire
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.produit.nom} x {self.quantite_kg}kg"

    class Meta:
        verbose_name = "Ligne d'achat fournisseur"
        verbose_name_plural = "Lignes d'achat fournisseur"


# ========================================
# LIVRAISON
# ========================================
class Livraison(models.Model):
    STATUT_CHOICES = [
        ('PLANIFIEE', 'Planifiée'),
        ('EN_TRANSIT', 'En transit'),
        ('LIVREE', 'Livrée'),
        ('RETOUR', 'Retour'),
        ('ANNULEE', 'Annulée'),
    ]

    MODE_CHOICES = [
        ('ROUTIER', 'Transport routier'),
        ('MARITIME', 'Transport maritime'),
        ('AERIEN', 'Transport aérien'),
        ('FERROVIAIRE', 'Transport ferroviaire'),
    ]

    commande = models.ForeignKey(
        CommandeClient,
        on_delete=models.CASCADE,
        related_name='livraisons'
    )
    numero_tracking = models.CharField(max_length=100, blank=True, null=True)
    transporteur = models.CharField(max_length=200, blank=True, null=True)
    mode_transport = models.CharField(max_length=20, choices=MODE_CHOICES, default='ROUTIER')

    adresse_depart = models.CharField(max_length=255, default='Douala, Cameroun')
    adresse_arrivee = models.CharField(max_length=255)

    poids_total_kg = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    cout_transport = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='PLANIFIEE')
    date_expedition = models.DateField(blank=True, null=True)
    date_livraison_estimee = models.DateField(blank=True, null=True)
    date_livraison_effective = models.DateField(blank=True, null=True)

    notes = models.TextField(blank=True, null=True)
    date_creation = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"LIV-{self.id} → {self.commande.reference} ({self.get_statut_display()})"

    class Meta:
        ordering = ['-date_creation']
        verbose_name = "Livraison"
        verbose_name_plural = "Livraisons"


# ========================================
# MOUVEMENT DE STOCK
# ========================================
class MouvementStock(models.Model):
    TYPE_CHOICES = [
        ('ENTREE', 'Entrée de stock'),
        ('SORTIE', 'Sortie de stock'),
        ('AJUSTEMENT', 'Ajustement'),
        ('PERTE', 'Perte / Déchet'),
    ]

    produit = models.ForeignKey(
        'produits.ProduitAgricole',
        on_delete=models.PROTECT,
        related_name='mouvements_stock'
    )
    type_mouvement = models.CharField(max_length=20, choices=TYPE_CHOICES)
    quantite_kg = models.DecimalField(max_digits=10, decimal_places=2)
    motif = models.TextField(blank=True, null=True)

    commande_client = models.ForeignKey(
        CommandeClient,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='mouvements_stock'
    )
    commande_fournisseur = models.ForeignKey(
        CommandeFournisseur,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='mouvements_stock'
    )

    effectue_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='mouvements_stock'
    )

    date_mouvement = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        signe = '+' if self.type_mouvement in ['ENTREE'] else '-'
        return f"{signe}{self.quantite_kg}kg {self.produit.nom} ({self.get_type_mouvement_display()})"

    class Meta:
        ordering = ['-date_mouvement']
        verbose_name = "Mouvement de stock"
        verbose_name_plural = "Mouvements de stock"