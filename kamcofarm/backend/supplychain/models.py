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

    devis_origine = models.ForeignKey(
        'Devis',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='commandes_generees'
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
# ========================================
# DEVIS (QUOTATION)
# ========================================
class Devis(models.Model):
    STATUT_CHOICES = [
        ('BROUILLON', 'Brouillon'),
        ('ENVOYE', 'Envoyé'),
        ('ACCEPTE', 'Accepté'),
        ('REFUSE', 'Refusé'),
        ('EXPIRE', 'Expiré'),
    ]

    DEVISE_CHOICES = [
        ('FCFA', 'Franc CFA'),
        ('EUR', 'Euro'),
        ('USD', 'Dollar US'),
    ]
    token = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    INCOTERM_CHOICES = [
        ('EXW', 'EXW - Ex Works'),
        ('FCA', 'FCA - Free Carrier'),
        ('FAS', 'FAS - Free Alongside Ship'),
        ('FOB', 'FOB - Free On Board'),
        ('CFR', 'CFR - Cost and Freight'),
        ('CIF', 'CIF - Cost, Insurance and Freight'),
        ('CPT', 'CPT - Carriage Paid To'),
        ('CIP', 'CIP - Carriage and Insurance Paid To'),
        ('DAP', 'DAP - Delivered At Place'),
        ('DPU', 'DPU - Delivered at Place Unloaded'),
        ('DDP', 'DDP - Delivered Duty Paid'),
    ]

    reference = models.CharField(max_length=50, unique=True, editable=False)
    
    # Infos Client/Lead
    client_nom = models.CharField(max_length=255)
    client_entreprise = models.CharField(max_length=255, blank=True, null=True)
    client_email = models.EmailField(blank=True, null=True)
    client_telephone = models.CharField(max_length=50, blank=True, null=True)
    client_adresse = models.TextField(blank=True, null=True)

    # Détails Devis
    date_emission = models.DateField()
    date_validite = models.DateField(blank=True, null=True)
    
    # Conditions
    conditions_paiement = models.TextField(blank=True, null=True)
    delai_livraison = models.CharField(max_length=100, blank=True, null=True)
    port_chargement = models.CharField(max_length=100, blank=True, null=True, default="Douala, Cameroun")
    
    # Nouveaux champs facultatifs
    certifications = models.CharField(max_length=255, blank=True, null=True, help_text="Ex: GLOBALG.A.P., Bio, etc.")
    conditions_emballage = models.TextField(blank=True, null=True, help_text="Ex: Cartons de 4kg, vrac, etc.")
    incoterm = models.CharField(max_length=10, choices=INCOTERM_CHOICES, default='FOB')
    
    # Frais d'exportation (Optionnels)
    frais_inspection = models.DecimalField(max_digits=12, decimal_places=2, default=0, help_text="SGS, Phytosanitaire...")
    frais_logistique = models.DecimalField(max_digits=12, decimal_places=2, default=0, help_text="Fret, Assurance...")
    
    montant_ht = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    tva_pourcentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    montant_tva = models.DecimalField(max_digits=14, decimal_places=2, default=0, editable=False)
    montant_ttc = models.DecimalField(max_digits=14, decimal_places=2, default=0, editable=False)
    
    devise = models.CharField(max_length=10, choices=DEVISE_CHOICES, default='FCFA')
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='BROUILLON')
    
    notes = models.TextField(blank=True, null=True)
    
    creee_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='devis_creees'
    )
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.reference:
            self.reference = f"DEV-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.reference} - {self.client_nom}"

    class Meta:
        ordering = ['-date_creation']
        verbose_name = "Devis"
        verbose_name_plural = "Devis"


class LigneDevis(models.Model):
    devis = models.ForeignKey(
        Devis,
        on_delete=models.CASCADE,
        related_name='lignes'
    )
    description = models.CharField(max_length=500)
    quantite = models.DecimalField(max_digits=10, decimal_places=2)
    unite = models.CharField(max_length=20, default='kg')
    prix_unitaire = models.DecimalField(max_digits=14, decimal_places=2)
    sous_total = models.DecimalField(max_digits=14, decimal_places=2, editable=False)

    def save(self, *args, **kwargs):
        self.sous_total = float(self.quantite) * float(self.prix_unitaire)
        super().save(*args, **kwargs)
        
        # Recalculer le total du devis
        devis = self.devis
        total_ht = sum(float(l.sous_total) for l in devis.lignes.all())
        
        # Ajouter les frais annexes au HT pour le calcul de la TVA si nécessaire, 
        # ou les garder séparés. Ici on les inclut dans le HT global du document.
        frais_annexes = float(devis.frais_inspection or 0) + float(devis.frais_logistique or 0)
        
        devis.montant_ht = total_ht + frais_annexes
        devis.montant_tva = float(devis.montant_ht) * (float(devis.tva_pourcentage) / 100)
        devis.montant_ttc = float(devis.montant_ht) + float(devis.montant_tva)
        
        Devis.objects.filter(id=devis.id).update(
            montant_ht=devis.montant_ht,
            montant_tva=devis.montant_tva,
            montant_ttc=devis.montant_ttc
        )

    def __str__(self):
        return f"{self.description} ({self.devis.reference})"
