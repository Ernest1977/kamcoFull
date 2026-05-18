from django.db import models
from django.conf import settings
import uuid
from django.core.validators import FileExtensionValidator


# ========================================
# SOURCE DE LEAD
# ========================================
class SourceLead(models.Model):
    nom = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    est_active = models.BooleanField(default=True)

    def __str__(self):
        return self.nom

    class Meta:
        ordering = ['nom']
        verbose_name = "Source de lead"
        verbose_name_plural = "Sources de leads"


# ========================================
# LEAD (PROSPECT)
# ========================================
class Lead(models.Model):
    STATUT_CHOICES = [
        ('NOUVEAU', 'Nouveau'),
        ('CONTACTE', 'Contacté'),
        ('QUALIFIE', 'Qualifié'),
        ('PROPOSITION', 'Proposition envoyée'),
        ('NEGOCIATION', 'En négociation'),
        ('CONVERTI', 'Converti en client'),
        ('PERDU', 'Perdu'),
    ]

    PRIORITE_CHOICES = [
        ('BASSE', 'Basse'),
        ('MOYENNE', 'Moyenne'),
        ('HAUTE', 'Haute'),
        ('URGENTE', 'Urgente'),
    ]

    reference = models.CharField(max_length=50, unique=True, editable=False)

    # Informations du prospect
    nom = models.CharField(max_length=200)
    prenom = models.CharField(max_length=200, blank=True, null=True)
    email = models.EmailField()
    telephone = models.CharField(max_length=50, blank=True, null=True)
    entreprise = models.CharField(max_length=255, blank=True, null=True)
    poste = models.CharField(max_length=200, blank=True, null=True)
    pays = models.CharField(max_length=100, default='Cameroun')
    ville = models.CharField(max_length=100, blank=True, null=True)

    # Qualification
    source = models.ForeignKey(
        SourceLead,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='leads'
    )
    statut = models.CharField(max_length=15, choices=STATUT_CHOICES, default='NOUVEAU')
    priorite = models.CharField(max_length=10, choices=PRIORITE_CHOICES, default='MOYENNE')

    # Intérêt commercial
    produits_interesses = models.TextField(
        blank=True, null=True,
        help_text="Produits qui intéressent ce prospect"
    )
    budget_estime = models.DecimalField(max_digits=14, decimal_places=2, blank=True, null=True)
    volume_estime_tonnes = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)

    # Suivi
    notes = models.TextField(blank=True, null=True)
    date_dernier_contact = models.DateTimeField(blank=True, null=True)
    date_prochain_contact = models.DateTimeField(blank=True, null=True)

    # Attribution
    assigne_a = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='leads_assignes'
    )

    # Conversion
    date_conversion = models.DateTimeField(blank=True, null=True)
    raison_perte = models.TextField(blank=True, null=True)

    # Métadonnées
    cree_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='leads_crees'
    )
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.reference:
            self.reference = f"LEAD-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        entreprise_str = f" ({self.entreprise})" if self.entreprise else ""
        return f"{self.reference} - {self.nom}{entreprise_str} [{self.get_statut_display()}]"

    class Meta:
        ordering = ['-date_creation']
        verbose_name = "Lead"
        verbose_name_plural = "Leads"


# ========================================
# INTERACTION LEAD (historique de suivi)
# ========================================
class InteractionLead(models.Model):
    TYPE_CHOICES = [
        ('APPEL', 'Appel téléphonique'),
        ('EMAIL', 'Email'),
        ('REUNION', 'Réunion'),
        ('WHATSAPP', 'WhatsApp'),
        ('VISITE', 'Visite terrain'),
        ('SALON', 'Salon / Événement'),
        ('AUTRE', 'Autre'),
    ]

    lead = models.ForeignKey(
        Lead,
        on_delete=models.CASCADE,
        related_name='interactions'
    )
    type_interaction = models.CharField(max_length=15, choices=TYPE_CHOICES)
    sujet = models.CharField(max_length=255)
    description = models.TextField()
    resultat = models.TextField(blank=True, null=True)

    effectuee_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='interactions_leads'
    )

    date_interaction = models.DateTimeField()
    date_creation = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.get_type_interaction_display()} - {self.lead.nom} ({self.date_interaction.strftime('%d/%m/%Y')})"

    class Meta:
        ordering = ['-date_interaction']
        verbose_name = "Interaction lead"
        verbose_name_plural = "Interactions leads"


# ========================================
# CAMPAGNE MARKETING
# ========================================
class CampagneMarketing(models.Model):
    TYPE_CHOICES = [
        ('EMAIL', 'Campagne email'),
        ('RESEAUX_SOCIAUX', 'Réseaux sociaux'),
        ('SALON', 'Salon / Foire'),
        ('PUBLICITE', 'Publicité'),
        ('PARRAINAGE', 'Parrainage'),
        ('CONTENU', 'Marketing de contenu'),
        ('SMS', 'Campagne SMS'),
        ('AUTRE', 'Autre'),
    ]

    STATUT_CHOICES = [
        ('PLANIFIEE', 'Planifiée'),
        ('EN_COURS', 'En cours'),
        ('TERMINEE', 'Terminée'),
        ('ANNULEE', 'Annulée'),
        ('EN_PAUSE', 'En pause'),
    ]

    nom = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    type_campagne = models.CharField(max_length=20, choices=TYPE_CHOICES)
    statut = models.CharField(max_length=15, choices=STATUT_CHOICES, default='PLANIFIEE')

    date_debut = models.DateField()
    date_fin = models.DateField(blank=True, null=True)

    # Budget & résultats
    budget_prevu = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    budget_depense = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    devise = models.CharField(max_length=10, default='FCFA')

    objectif = models.TextField(blank=True, null=True)
    public_cible = models.TextField(blank=True, null=True)

    # KPIs
    leads_generes = models.PositiveIntegerField(default=0)
    conversions = models.PositiveIntegerField(default=0)
    impressions = models.PositiveIntegerField(default=0)
    clics = models.PositiveIntegerField(default=0)
    taux_conversion = models.DecimalField(max_digits=5, decimal_places=2, editable=False, default=0)
    roi = models.DecimalField(max_digits=8, decimal_places=2, editable=False, default=0)

    # Responsable
    responsable = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='campagnes_responsable'
    )

    notes = models.TextField(blank=True, null=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        # Calcul automatique du taux de conversion
        if self.leads_generes > 0:
            self.taux_conversion = round((self.conversions / self.leads_generes) * 100, 2)
        else:
            self.taux_conversion = 0

        # Calcul automatique du ROI
        if self.budget_depense > 0:
            revenus_estimes = self.conversions * 500000  # estimation simplifiée
            self.roi = round(((revenus_estimes - float(self.budget_depense)) / float(self.budget_depense)) * 100, 2)
        else:
            self.roi = 0

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.nom} ({self.get_type_campagne_display()}) - {self.get_statut_display()}"

    class Meta:
        ordering = ['-date_debut']
        verbose_name = "Campagne marketing"
        verbose_name_plural = "Campagnes marketing"


# ========================================
# ABONNÉ NEWSLETTER
# ========================================
class AbonneNewsletter(models.Model):
    LANGUE_CHOICES = [
        ('fr', 'Français'),
        ('en', 'English'),
    ]

    email = models.EmailField(unique=True)
    nom = models.CharField(max_length=200, blank=True, null=True)
    entreprise = models.CharField(max_length=255, blank=True, null=True)
    langue = models.CharField(max_length=5, choices=LANGUE_CHOICES, default='fr')

    est_actif = models.BooleanField(default=True)
    est_verifie = models.BooleanField(default=False)
    token_verification = models.CharField(max_length=64, blank=True, null=True)
    token_desinscription = models.CharField(max_length=64, blank=True, null=True)

    source = models.CharField(max_length=100, blank=True, null=True, help_text="D'où vient cet abonné")

    date_inscription = models.DateTimeField(auto_now_add=True)
    date_desinscription = models.DateTimeField(blank=True, null=True)

    def save(self, *args, **kwargs):
        if not self.token_verification:
            self.token_verification = uuid.uuid4().hex
        if not self.token_desinscription:
            self.token_desinscription = uuid.uuid4().hex
        super().save(*args, **kwargs)

    def __str__(self):
        status = "✅" if self.est_actif else "❌"
        return f"{status} {self.email}"

    class Meta:
        ordering = ['-date_inscription']
        verbose_name = "Abonné newsletter"
        verbose_name_plural = "Abonnés newsletter"


# ========================================
# PROMOTION
# ========================================
class Promotion(models.Model):
    TYPE_CHOICES = [
        ('POURCENTAGE', 'Réduction en pourcentage'),
        ('MONTANT_FIXE', 'Réduction montant fixe'),
        ('LIVRAISON', 'Livraison gratuite'),
        ('PACK', 'Offre pack'),
    ]

    titre_fr = models.CharField(max_length=255)
    titre_en = models.CharField(max_length=255, blank=True, null=True)
    description_fr = models.TextField()
    description_en = models.TextField(blank=True, null=True)

    type_promotion = models.CharField(max_length=15, choices=TYPE_CHOICES, default='POURCENTAGE')
    valeur_reduction = models.DecimalField(
        max_digits=10, decimal_places=2, default=0,
        help_text="Pourcentage ou montant selon le type"
    )
    code_promo = models.CharField(max_length=50, unique=True, blank=True, null=True)

    # Produits concernés
    produits = models.ManyToManyField(
        'produits.ProduitAgricole',
        blank=True,
        related_name='promotions'
    )
    tous_produits = models.BooleanField(default=False, help_text="Applicable à tous les produits")

    # Conditions
    montant_minimum = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    quantite_minimum_kg = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    usage_maximum = models.PositiveIntegerField(default=0, help_text="0 = illimité")
    usage_actuel = models.PositiveIntegerField(default=0)

    # Période
    date_debut = models.DateTimeField()
    date_fin = models.DateTimeField()
    est_active = models.BooleanField(default=True)

    # Image
    image = models.ImageField(
    upload_to='marketing/promotions/',
    blank=True,
    null=True,
    validators=[FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png', 'webp'])],
    )

    # Métadonnées
    creee_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='promotions_creees'
    )
    date_creation = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.titre_fr} ({self.get_type_promotion_display()})"

    class Meta:
        ordering = ['-date_debut']
        verbose_name = "Promotion"
        verbose_name_plural = "Promotions"




# ========================================
# ÉVALUATION SAV (Service Après Vente)
# ========================================
class EvaluationSAV(models.Model):
    SATISFACTION_CHOICES = [
        (1, '⭐ Moins satisfaisant'),
        (2, '⭐⭐ Moyen'),
        (3, '⭐⭐⭐ Satisfaisant'),
        (4, '⭐⭐⭐⭐ Bon'),
        (5, '⭐⭐⭐⭐⭐ Très bon'),
    ]

    CANAL_CHOICES = [
        ('TELEPHONE', 'Appel téléphonique'),
        ('EMAIL', 'Email'),
        ('WHATSAPP', 'WhatsApp'),
        ('VISITE', 'Visite en personne'),
        ('FORMULAIRE', 'Formulaire en ligne'),
        ('AUTRE', 'Autre'),
    ]

    TYPE_EVALUATION_CHOICES = [
        ('PRODUIT', 'Qualité des produits'),
        ('SERVICE', 'Qualité du service'),
        ('AGENT', 'Qualité des agents'),
        ('LIVRAISON', 'Qualité de la livraison'),
        ('LOCATION', 'Qualité de la location'),
        ('GENERAL', 'Satisfaction générale'),
    ]

    # Client
    client_nom = models.CharField(max_length=255)
    client_entreprise = models.CharField(max_length=255, blank=True, null=True)
    client_email = models.EmailField(blank=True, null=True)
    client_telephone = models.CharField(max_length=50, blank=True, null=True)

    # Évaluation
    type_evaluation = models.CharField(max_length=20, choices=TYPE_EVALUATION_CHOICES, default='GENERAL')
    satisfaction_produit = models.PositiveSmallIntegerField(
        choices=SATISFACTION_CHOICES, default=3,
        help_text="Satisfaction qualité produits"
    )
    satisfaction_service = models.PositiveSmallIntegerField(
        choices=SATISFACTION_CHOICES, default=3,
        help_text="Satisfaction qualité service"
    )
    satisfaction_agent = models.PositiveSmallIntegerField(
        choices=SATISFACTION_CHOICES, default=3,
        help_text="Satisfaction qualité agents"
    )
    satisfaction_globale = models.PositiveSmallIntegerField(
        choices=SATISFACTION_CHOICES, default=3,
        help_text="Satisfaction globale"
    )

    # Feedback
    notes = models.TextField(
        blank=True, null=True,
        help_text="Impressions et commentaires du client"
    )
    points_positifs = models.TextField(blank=True, null=True)
    points_ameliorer = models.TextField(blank=True, null=True)
    recommande = models.BooleanField(
        default=True,
        help_text="Le client recommande-t-il nos services ?"
    )

    # Canal de collecte
    canal = models.CharField(max_length=20, choices=CANAL_CHOICES, default='TELEPHONE')

    # Métadonnées
    enregistre_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='evaluations_sav'
    )
    date_evaluation = models.DateField()
    date_creation = models.DateTimeField(auto_now_add=True)

    @property
    def moyenne_satisfaction(self):
        scores = [self.satisfaction_produit, self.satisfaction_service,
                  self.satisfaction_agent, self.satisfaction_globale]
        return round(sum(scores) / len(scores), 1)

    @property
    def etoiles_moyenne(self):
        return '⭐' * round(self.moyenne_satisfaction)

    def __str__(self):
        return f"SAV — {self.client_nom} ({self.get_satisfaction_globale_display()})"

    class Meta:
        ordering = ['-date_evaluation']
        verbose_name = "Évaluation SAV"
        verbose_name_plural = "Évaluations SAV"



# ========================================
# CLIENT CONVERTI (SAV)
# ========================================
class ClientConverti(models.Model):
    ORIGINE_CHOICES = [
        ('LEAD', 'Depuis un lead converti'),
        ('COMMANDE', 'Depuis une commande'),
        ('LOCATION', 'Depuis une location'),
        ('MANUEL', 'Ajouté manuellement'),
    ]

    # Identité client
    nom = models.CharField(max_length=255)
    entreprise = models.CharField(max_length=255, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    telephone = models.CharField(max_length=50, blank=True, null=True)
    adresse = models.TextField(blank=True, null=True)
    pays = models.CharField(max_length=100, default='Cameroun')
    ville = models.CharField(max_length=100, blank=True, null=True)

    # Origine
    origine = models.CharField(max_length=10, choices=ORIGINE_CHOICES, default='COMMANDE')
    lead_source = models.ForeignKey(
        Lead, on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='client_converti'
    )

    # Compteurs (mis à jour automatiquement)
    nb_achats = models.PositiveIntegerField(default=0)
    total_achats = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    nb_locations = models.PositiveIntegerField(default=0)
    total_locations = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    nb_operations_total = models.PositiveIntegerField(default=0)
    montant_total = models.DecimalField(max_digits=14, decimal_places=2, default=0)

    # Promotion
    eligible_promotion = models.BooleanField(default=False)
    raison_eligibilite = models.TextField(blank=True, null=True)
    promotion_proposee = models.BooleanField(default=False)
    date_derniere_promotion = models.DateField(blank=True, null=True)

    # Satisfaction
    derniere_note_satisfaction = models.PositiveSmallIntegerField(
        blank=True, null=True,
        help_text="Dernière note de satisfaction (1-5)"
    )
    moyenne_satisfaction = models.DecimalField(
        max_digits=3, decimal_places=1, default=0
    )
    nb_evaluations = models.PositiveIntegerField(default=0)

    # Notes SAV
    notes_sav = models.TextField(blank=True, null=True)

    # Dates
    date_premiere_operation = models.DateField(blank=True, null=True)
    date_derniere_operation = models.DateField(blank=True, null=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    est_actif = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.nom} ({self.nb_operations_total} opérations — {self.montant_total} FCFA)"

    class Meta:
        ordering = ['-montant_total']
        verbose_name = "Client converti"
        verbose_name_plural = "Clients convertis"
        unique_together = []

    def verifier_eligibilite_promotion(self):
        """Vérifie si le client est éligible à une promotion."""
        SEUIL_OPS = 4
        SEUIL_MONTANT = 1000000

        raisons = []
        eligible = False

        if self.nb_achats >= SEUIL_OPS and float(self.total_achats) >= SEUIL_MONTANT:
            eligible = True
            raisons.append(f"{self.nb_achats} achats pour {self.total_achats} FCFA")

        if self.nb_locations >= SEUIL_OPS and float(self.total_locations) >= SEUIL_MONTANT:
            eligible = True
            raisons.append(f"{self.nb_locations} locations pour {self.total_locations} FCFA")

        self.eligible_promotion = eligible
        self.raison_eligibilite = ' + '.join(raisons) if raisons else ''
        return eligible