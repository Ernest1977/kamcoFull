from django.db import models
from django.conf import settings
import uuid
from django.core.validators import FileExtensionValidator


image = models.ImageField(
    upload_to='photos/',
    validators=[FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png', 'webp'])],
)

# ========================================
# DEMANDE DE DEVIS (existant - on garde)
# ========================================
class DemandeDevis(models.Model):
    FREQUENCE_CHOICES = [
        ('unique', 'Commande unique'),
        ('mensuelle', 'Mensuelle'),
        ('trimestrielle', 'Trimestrielle'),
        ('annuelle', 'Annuelle'),
    ]

    nom_entreprise = models.CharField(max_length=255)
    nom_contact = models.CharField(max_length=255)
    email = models.EmailField()
    telephone = models.CharField(max_length=50)

    produits = models.TextField(help_text="Liste de produits demandés (JSON ou texte)")
    quantite_tonnes = models.DecimalField(max_digits=10, decimal_places=2)
    frequence = models.CharField(max_length=20, choices=FREQUENCE_CHOICES)
    destination = models.CharField(max_length=255)
    exigences = models.TextField(blank=True, null=True)

    date_demande = models.DateTimeField(auto_now_add=True)
    traite = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.nom_entreprise} - {self.date_demande.strftime('%Y-%m-%d')}"

    class Meta:
        ordering = ['-date_demande']
        verbose_name = "Demande de devis"
        verbose_name_plural = "Demandes de devis"


# ========================================
# FACTURE
# ========================================
class Facture(models.Model):
    STATUT_CHOICES = [
        ('BROUILLON', 'Brouillon'),
        ('ENVOYEE', 'Envoyée'),
        ('PAYEE', 'Payée'),
        ('PARTIELLEMENT_PAYEE', 'Partiellement payée'),
        ('EN_RETARD', 'En retard'),
        ('ANNULEE', 'Annulée'),
    ]

    DEVISE_CHOICES = [
        ('FCFA', 'Franc CFA'),
        ('EUR', 'Euro'),
        ('USD', 'Dollar US'),
        ('GBP', 'Livre Sterling'),
        ('CNY', 'Yuan Chinois'),
        ('NGN', 'Naira nigérian')
    ]

    numero = models.CharField(max_length=50, unique=True, editable=False)

    TYPE_OPERATION_CHOICES = [
        ('ACHAT', 'Vente de produits agricoles (Achat client)'),
        ('ACHAT', 'Vente de matériel (Achat client)'),
        ('LOCATION', 'Location de matériel'),
        ('SERVICE', 'Prestation de service'),
        ('AUTRE', 'Autre'),
    ]

    type_operation = models.CharField(
        max_length=15,
        choices=TYPE_OPERATION_CHOICES,
        default='ACHAT',
        help_text="Type d'opération facturée"
    )

    # Lien vers la commande client (achat)
    commande_source = models.ForeignKey(
        'supplychain.CommandeClient',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='factures_generees',
        help_text="Commande client à l'origine de cette facture"
    )

    # Lien vers le contrat de location
    contrat_location_source = models.ForeignKey(
        'location.ContratLocation',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='factures_generees',
        help_text="Contrat de location à l'origine de cette facture"
    )

    est_auto_generee = models.BooleanField(
        default=False,
        help_text="Facture générée automatiquement par synchronisation"
    )

    # Lien optionnel avec une commande client
    commande = models.ForeignKey(
        'supplychain.CommandeClient',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='factures'
    )

    # Infos client (copiées ou saisies manuellement)
    client_nom = models.CharField(max_length=255)
    client_entreprise = models.CharField(max_length=255, blank=True, null=True)
    client_email = models.EmailField(blank=True, null=True)
    client_telephone = models.CharField(max_length=50, blank=True, null=True)
    client_adresse = models.TextField(blank=True, null=True)

    # Montants
    montant_ht = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    tva_pourcentage = models.DecimalField(max_digits=5, decimal_places=2, default=19.25)
    montant_tva = models.DecimalField(max_digits=14, decimal_places=2, editable=False, default=0)
    montant_ttc = models.DecimalField(max_digits=14, decimal_places=2, editable=False, default=0)
    montant_paye = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    solde_restant = models.DecimalField(max_digits=14, decimal_places=2, editable=False, default=0)

    devise = models.CharField(max_length=10, choices=DEVISE_CHOICES, default='FCFA')
    statut = models.CharField(max_length=25, choices=STATUT_CHOICES, default='BROUILLON')

    # Dates
    date_emission = models.DateField()
    date_echeance = models.DateField()

    # Conditions
    conditions_paiement = models.TextField(
        blank=True, null=True,
        default="Paiement à réception de facture. Pénalité de retard : 1.5% par mois."
    )
    notes = models.TextField(blank=True, null=True)

    # Document
    document = models.FileField(upload_to='finance/factures/', blank=True, null=True)

    # Métadonnées
    creee_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='factures_creees'
    )
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.numero:
            self.numero = f"FAC-{uuid.uuid4().hex[:8].upper()}"

        # Calculs automatiques
        self.montant_tva = self.montant_ht * (self.tva_pourcentage / 100)
        self.montant_ttc = self.montant_ht + self.montant_tva
        self.solde_restant = self.montant_ttc - self.montant_paye

        # Mise à jour du statut selon les paiements
        if self.montant_paye >= self.montant_ttc and self.montant_ttc > 0:
            self.statut = 'PAYEE'
        elif self.montant_paye > 0 and self.montant_paye < self.montant_ttc:
            self.statut = 'PARTIELLEMENT_PAYEE'

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.numero} - {self.client_nom} ({self.get_statut_display()})"

    class Meta:
        ordering = ['-date_emission']
        verbose_name = "Facture"
        verbose_name_plural = "Factures"


# ========================================
# LIGNE DE FACTURE
# ========================================
class LigneFacture(models.Model):
    CATEGORIE_CHOICES = [
        ('PRODUIT_AGRICOLE', 'Produit agricole'),
        ('MATERIEL', 'Matériel / Équipement'),
        ('LOCATION', 'Location de matériel'),
        ('SERVICE', 'Prestation de service'),
        ('TRANSPORT', 'Transport / Livraison'),
        ('PENALITE', 'Pénalité'),
        ('AUTRE', 'Autre'),
    ]

    facture = models.ForeignKey(
        Facture,
        on_delete=models.CASCADE,
        related_name='lignes'
    )
    categorie_ligne = models.CharField(
        max_length=20,
        choices=CATEGORIE_CHOICES,
        default='PRODUIT_AGRICOLE',
        help_text="Catégorie de la ligne pour le bilan"
    )
    description = models.CharField(max_length=500)
    produit = models.ForeignKey(
        'produits.ProduitAgricole',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='lignes_factures'
    )
    equipement = models.ForeignKey(
        'equipements.Equipement',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='lignes_factures',
        help_text="Équipement concerné (si location/vente matériel)"
    )
    quantite = models.DecimalField(max_digits=10, decimal_places=2)
    unite = models.CharField(max_length=20, default='kg')
    prix_unitaire = models.DecimalField(max_digits=10, decimal_places=2)
    sous_total = models.DecimalField(max_digits=14, decimal_places=2, editable=False, default=0)

    def save(self, *args, **kwargs):
        self.sous_total = self.quantite * self.prix_unitaire

        # Auto-détection de la catégorie
        if not self.categorie_ligne or self.categorie_ligne == 'AUTRE':
            if self.produit:
                self.categorie_ligne = 'PRODUIT_AGRICOLE'
            elif self.equipement:
                self.categorie_ligne = 'MATERIEL'

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.description} - {self.sous_total} {self.facture.devise}"

    class Meta:
        verbose_name = "Ligne de facture"
        verbose_name_plural = "Lignes de facture"


# ========================================
# PAIEMENT
# ========================================
class Paiement(models.Model):
    MODE_CHOICES = [
        ('VIREMENT', 'Virement bancaire'),
        ('ESPECES', 'Espèces'),
        ('MOBILE_MONEY', 'Mobile Money'),
        ('CHEQUE', 'Chèque'),
        ('CARTE', 'Carte bancaire'),
        ('PAYPAL', 'PayPal'),
        ('AUTRE', 'Autre'),
    ]

    STATUT_CHOICES = [
        ('EN_ATTENTE', 'En attente de confirmation'),
        ('CONFIRME', 'Confirmé'),
        ('ECHOUE', 'Échoué'),
        ('REMBOURSE', 'Remboursé'),
    ]

    reference = models.CharField(max_length=50, unique=True, editable=False)
    facture = models.ForeignKey(
        Facture,
        on_delete=models.CASCADE,
        related_name='paiements'
    )
    montant = models.DecimalField(max_digits=14, decimal_places=2)
    mode_paiement = models.CharField(max_length=20, choices=MODE_CHOICES, default='VIREMENT')
    statut = models.CharField(max_length=15, choices=STATUT_CHOICES, default='EN_ATTENTE')

    reference_externe = models.CharField(
        max_length=100, blank=True, null=True,
        help_text="Numéro de transaction, référence bancaire, etc."
    )
    preuve = models.FileField(upload_to='finance/paiements/', blank=True, null=True)
    notes = models.TextField(blank=True, null=True)

    date_paiement = models.DateField()
    date_confirmation = models.DateField(blank=True, null=True)

    confirme_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='paiements_confirmes'
    )
    date_creation = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.reference:
            self.reference = f"PAY-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.reference} - {self.montant} ({self.get_statut_display()})"

    class Meta:
        ordering = ['-date_paiement']
        verbose_name = "Paiement"
        verbose_name_plural = "Paiements"


# ========================================
# CATÉGORIE DE DÉPENSE
# ========================================
class CategorieDépense(models.Model):
    nom = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    est_active = models.BooleanField(default=True)

    def __str__(self):
        return self.nom

    class Meta:
        ordering = ['nom']
        verbose_name = "Catégorie de dépense"
        verbose_name_plural = "Catégories de dépenses"


# ========================================
# DÉPENSE OPÉRATIONNELLE
# ========================================
class DepenseOperationnelle(models.Model):
    STATUT_CHOICES = [
        ('EN_ATTENTE', 'En attente d\'approbation'),
        ('APPROUVEE', 'Approuvée'),
        ('REJETEE', 'Rejetée'),
        ('PAYEE', 'Payée'),
    ]

    reference = models.CharField(max_length=50, unique=True, editable=False)
    categorie = models.ForeignKey(
        CategorieDépense,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='depenses'
    )
    description = models.TextField()
    montant = models.DecimalField(max_digits=12, decimal_places=2)
    devise = models.CharField(max_length=10, default='FCFA')

    date_depense = models.DateField()
    justificatif = models.FileField(upload_to='finance/depenses/', blank=True, null=True)

    statut = models.CharField(max_length=15, choices=STATUT_CHOICES, default='EN_ATTENTE')
    soumis_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='depenses_soumises'
    )
    approuve_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='depenses_approuvees'
    )
    date_approbation = models.DateTimeField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)

    date_creation = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.reference:
            self.reference = f"DEP-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.reference} - {self.description[:50]} ({self.montant} {self.devise})"

    class Meta:
        ordering = ['-date_depense']
        verbose_name = "Dépense opérationnelle"
        verbose_name_plural = "Dépenses opérationnelles"


# ========================================
# BUDGET MENSUEL
# ========================================
class BudgetMensuel(models.Model):
    MOIS_CHOICES = [
        (1, 'Janvier'), (2, 'Février'), (3, 'Mars'),
        (4, 'Avril'), (5, 'Mai'), (6, 'Juin'),
        (7, 'Juillet'), (8, 'Août'), (9, 'Septembre'),
        (10, 'Octobre'), (11, 'Novembre'), (12, 'Décembre'),
    ]

    mois = models.PositiveSmallIntegerField(choices=MOIS_CHOICES)
    annee = models.PositiveIntegerField()

    budget_prevu_revenus = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    budget_prevu_depenses = models.DecimalField(max_digits=14, decimal_places=2, default=0)

    revenus_reels = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    depenses_reelles = models.DecimalField(max_digits=14, decimal_places=2, default=0)

    ecart_revenus = models.DecimalField(max_digits=14, decimal_places=2, editable=False, default=0)
    ecart_depenses = models.DecimalField(max_digits=14, decimal_places=2, editable=False, default=0)
    solde_net = models.DecimalField(max_digits=14, decimal_places=2, editable=False, default=0)

    commentaire = models.TextField(blank=True, null=True)
    est_cloture = models.BooleanField(default=False)

    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        self.ecart_revenus = self.revenus_reels - self.budget_prevu_revenus
        self.ecart_depenses = self.depenses_reelles - self.budget_prevu_depenses
        self.solde_net = self.revenus_reels - self.depenses_reelles
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Budget {self.get_mois_display()} {self.annee}"

    class Meta:
        ordering = ['-annee', '-mois']
        unique_together = ['mois', 'annee']
        verbose_name = "Budget mensuel"
        verbose_name_plural = "Budgets mensuels"