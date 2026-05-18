# Create your models here.
from django.db import models
from django.conf import settings
import uuid
from django.core.validators import FileExtensionValidator


image = models.ImageField(
    upload_to='photos/',
    validators=[FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png', 'webp'])],
)

# ========================================
# CATÉGORIE D'ÉQUIPEMENT
# ========================================
class CategorieEquipement(models.Model):
    nom = models.CharField(max_length=150)
    description = models.TextField(blank=True, null=True)
    icone = models.CharField(max_length=50, blank=True, null=True)
    est_active = models.BooleanField(default=True)

    def __str__(self):
        return self.nom

    class Meta:
        ordering = ['nom']
        verbose_name = "Catégorie d'équipement"
        verbose_name_plural = "Catégories d'équipements"


# ========================================
# ÉQUIPEMENT (FICHE MAÎTRE)
# ========================================
class Equipement(models.Model):
    STATUT_CHOICES = [
        ('DISPONIBLE', 'Disponible'),
        ('EN_LOCATION', 'En location'),
        ('EN_MAINTENANCE', 'En maintenance'),
        ('EN_REPARATION', 'En réparation'),
        ('HORS_SERVICE', 'Hors service'),
        ('RESERVE', 'Réservé'),
        ('EN_TRANSIT', 'En transit'),
        ('VENDU', 'Vendu / Retiré'),
    ]

    ETAT_CHOICES = [
        ('NEUF', 'Neuf'),
        ('EXCELLENT', 'Excellent'),
        ('BON', 'Bon'),
        ('MOYEN', 'Moyen'),
        ('MAUVAIS', 'Mauvais'),
    ]

    TYPE_ACQUISITION_CHOICES = [
        ('ACHAT', 'Achat'),
        ('LEASING', 'Leasing'),
        ('LOCATION_LONGUE', 'Location longue durée'),
        ('DON', 'Don'),
    ]

    ENERGIE_CHOICES = [
        ('DIESEL', 'Diesel'),
        ('ESSENCE', 'Essence'),
        ('ELECTRIQUE', 'Électrique'),
        ('HYBRIDE', 'Hybride'),
        ('MANUEL', 'Manuel / Sans moteur'),
    ]

    # Identification
    reference = models.CharField(max_length=50, unique=True, editable=False)
    nom = models.CharField(max_length=200)
    categorie = models.ForeignKey(
        CategorieEquipement,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='equipements'
    )
    marque = models.CharField(max_length=100, blank=True, null=True)
    modele = models.CharField(max_length=100, blank=True, null=True)
    numero_serie = models.CharField(max_length=100, unique=True, blank=True, null=True)
    annee_fabrication = models.PositiveIntegerField(blank=True, null=True)
    immatriculation = models.CharField(max_length=50, blank=True, null=True)

    # Caractéristiques techniques
    puissance_cv = models.DecimalField(max_digits=8, decimal_places=2, blank=True, null=True)
    capacite_charge_kg = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    type_energie = models.CharField(max_length=15, choices=ENERGIE_CHOICES, default='DIESEL')
    consommation_moyenne = models.DecimalField(
        max_digits=8, decimal_places=2, blank=True, null=True,
        help_text="Litres/heure ou kWh/heure"
    )
    reservoir_litres = models.DecimalField(max_digits=8, decimal_places=2, blank=True, null=True)

    # Compteurs
    heures_moteur = models.DecimalField(max_digits=10, decimal_places=1, default=0)
    kilometres = models.DecimalField(max_digits=10, decimal_places=1, default=0)

    # État et statut
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='DISPONIBLE')
    etat_general = models.CharField(max_length=15, choices=ETAT_CHOICES, default='BON')

    # Localisation
    localisation_actuelle = models.CharField(max_length=255, default='Base Douala')
    latitude = models.DecimalField(max_digits=10, decimal_places=7, blank=True, null=True)
    longitude = models.DecimalField(max_digits=10, decimal_places=7, blank=True, null=True)

    # Acquisition et cycle de vie
    type_acquisition = models.CharField(max_length=20, choices=TYPE_ACQUISITION_CHOICES, default='ACHAT')
    date_acquisition = models.DateField()
    prix_acquisition = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    valeur_residuelle = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    duree_amortissement_mois = models.PositiveIntegerField(default=60)
    date_fin_garantie = models.DateField(blank=True, null=True)

    # Tarifs de location
    tarif_journalier = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tarif_hebdomadaire = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tarif_mensuel = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tarif_horaire = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    caution_requise = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    devise = models.CharField(max_length=10, default='FCFA')

    # Option d'achat
    option_achat_disponible = models.BooleanField(default=False)
    prix_option_achat = models.DecimalField(max_digits=14, decimal_places=2, default=0)

    # Maintenance
    seuil_maintenance_heures = models.DecimalField(
        max_digits=8, decimal_places=1, default=250,
        help_text="Nombre d'heures avant prochaine maintenance préventive"
    )
    derniere_maintenance = models.DateField(blank=True, null=True)
    heures_derniere_maintenance = models.DecimalField(max_digits=10, decimal_places=1, default=0)

    # Documents et images
    photo_principale = models.ImageField(upload_to='equipements/photos/', blank=True, null=True)
    document_technique = models.FileField(upload_to='equipements/docs/', blank=True, null=True)
    carte_grise = models.FileField(upload_to='equipements/cartes_grises/', blank=True, null=True)

    # Métadonnées
    notes = models.TextField(blank=True, null=True)
    est_actif = models.BooleanField(default=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.reference:
            self.reference = f"EQP-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

    @property
    def heures_avant_maintenance(self):
        """Heures restantes avant prochaine maintenance préventive."""
        heures_depuis = self.heures_moteur - self.heures_derniere_maintenance
        return max(0, float(self.seuil_maintenance_heures) - float(heures_depuis))

    @property
    def maintenance_requise(self):
        """Indique si une maintenance préventive est due."""
        return self.heures_avant_maintenance <= 0

    @property
    def valeur_actuelle_estimee(self):
        """Estimation de la valeur actuelle par amortissement linéaire."""
        from datetime import date
        if not self.date_acquisition or self.duree_amortissement_mois == 0:
            return float(self.prix_acquisition)

        mois_ecoules = (date.today().year - self.date_acquisition.year) * 12 + \
                       (date.today().month - self.date_acquisition.month)

        if mois_ecoules >= self.duree_amortissement_mois:
            return float(self.valeur_residuelle)

        depreciation_mensuelle = (float(self.prix_acquisition) - float(self.valeur_residuelle)) / self.duree_amortissement_mois
        return max(
            float(self.valeur_residuelle),
            float(self.prix_acquisition) - (depreciation_mensuelle * mois_ecoules)
        )

    def __str__(self):
        return f"{self.reference} - {self.nom} ({self.get_statut_display()})"

    class Meta:
        ordering = ['nom']
        verbose_name = "Équipement"
        verbose_name_plural = "Équipements"


# ========================================
# CERTIFICATION / CONTRÔLE TECHNIQUE
# ========================================
class CertificationEquipement(models.Model):
    TYPE_CHOICES = [
        ('CONTROLE_TECHNIQUE', 'Contrôle technique'),
        ('ASSURANCE', 'Assurance'),
        ('NORME_SECURITE', 'Norme de sécurité'),
        ('HOMOLOGATION', 'Homologation'),
        ('CALIBRATION', 'Calibration'),
        ('ENVIRONNEMENT', 'Certification environnementale'),
        ('AUTRE', 'Autre'),
    ]

    STATUT_CHOICES = [
        ('VALIDE', 'Valide'),
        ('EXPIRE', 'Expiré'),
        ('EN_COURS', 'En cours de renouvellement'),
        ('SUSPENDU', 'Suspendu'),
    ]

    equipement = models.ForeignKey(
        Equipement,
        on_delete=models.CASCADE,
        related_name='certifications'
    )
    type_certification = models.CharField(max_length=25, choices=TYPE_CHOICES)
    nom = models.CharField(max_length=200)
    organisme = models.CharField(max_length=200, blank=True, null=True)
    numero_certificat = models.CharField(max_length=100, blank=True, null=True)

    date_obtention = models.DateField()
    date_expiration = models.DateField()

    statut = models.CharField(max_length=15, choices=STATUT_CHOICES, default='VALIDE')
    cout = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    document = models.FileField(upload_to='equipements/certifications/', blank=True, null=True)

    alerte_jours_avant = models.PositiveIntegerField(
        default=30,
        help_text="Nombre de jours avant expiration pour déclencher une alerte"
    )

    notes = models.TextField(blank=True, null=True)
    date_creation = models.DateTimeField(auto_now_add=True)

    @property
    def est_expire(self):
        from datetime import date
        return self.date_expiration < date.today()

    @property
    def jours_restants(self):
        from datetime import date
        delta = self.date_expiration - date.today()
        return delta.days

    @property
    def alerte_active(self):
        return 0 < self.jours_restants <= self.alerte_jours_avant

    def __str__(self):
        return f"{self.nom} - {self.equipement.nom} ({self.get_statut_display()})"

    class Meta:
        ordering = ['date_expiration']
        verbose_name = "Certification"
        verbose_name_plural = "Certifications"


# ========================================
# PLAN MAINTENANCE PRÉVENTIVE
# ========================================
class PlanMaintenancePreventive(models.Model):
    FREQUENCE_CHOICES = [
        ('HEURES', 'Basé sur les heures moteur'),
        ('KILOMETRES', 'Basé sur les kilomètres'),
        ('CALENDAIRE', 'Basé sur le calendrier'),
    ]

    PERIODICITE_CHOICES = [
        ('HEBDOMADAIRE', 'Hebdomadaire'),
        ('MENSUEL', 'Mensuel'),
        ('TRIMESTRIEL', 'Trimestriel'),
        ('SEMESTRIEL', 'Semestriel'),
        ('ANNUEL', 'Annuel'),
    ]

    equipement = models.ForeignKey(
        Equipement,
        on_delete=models.CASCADE,
        related_name='plans_maintenance'
    )
    nom = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)

    type_frequence = models.CharField(max_length=15, choices=FREQUENCE_CHOICES, default='HEURES')
    seuil_heures = models.DecimalField(max_digits=8, decimal_places=1, default=250)
    seuil_km = models.DecimalField(max_digits=10, decimal_places=1, default=0)
    periodicite = models.CharField(max_length=15, choices=PERIODICITE_CHOICES, blank=True, null=True)

    pieces_necessaires = models.TextField(blank=True, null=True, help_text="Liste des pièces et fournitures")
    cout_estime = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    duree_estimee_heures = models.DecimalField(max_digits=5, decimal_places=1, default=2)

    est_actif = models.BooleanField(default=True)
    derniere_execution = models.DateField(blank=True, null=True)
    prochaine_execution = models.DateField(blank=True, null=True)

    def __str__(self):
        return f"{self.nom} - {self.equipement.nom}"

    class Meta:
        ordering = ['equipement', 'nom']
        verbose_name = "Plan de maintenance préventive"
        verbose_name_plural = "Plans de maintenance préventive"


# ========================================
# INTERVENTION MAINTENANCE
# ========================================
class InterventionMaintenance(models.Model):
    TYPE_CHOICES = [
        ('PREVENTIVE', 'Maintenance préventive'),
        ('CORRECTIVE', 'Réparation corrective'),
        ('URGENCE', 'Réparation d\'urgence'),
        ('AMELIORATION', 'Amélioration'),
        ('INSPECTION', 'Inspection'),
    ]

    STATUT_CHOICES = [
        ('PLANIFIEE', 'Planifiée'),
        ('EN_COURS', 'En cours'),
        ('EN_ATTENTE_PIECES', 'En attente de pièces'),
        ('TERMINEE', 'Terminée'),
        ('ANNULEE', 'Annulée'),
    ]

    PRIORITE_CHOICES = [
        ('BASSE', 'Basse'),
        ('NORMALE', 'Normale'),
        ('HAUTE', 'Haute'),
        ('URGENTE', 'Urgente'),
        ('CRITIQUE', 'Critique'),
    ]

    reference = models.CharField(max_length=50, unique=True, editable=False)
    equipement = models.ForeignKey(
        Equipement,
        on_delete=models.CASCADE,
        related_name='interventions'
    )
    plan_maintenance = models.ForeignKey(
        PlanMaintenancePreventive,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='interventions'
    )

    type_intervention = models.CharField(max_length=20, choices=TYPE_CHOICES)
    priorite = models.CharField(max_length=10, choices=PRIORITE_CHOICES, default='NORMALE')
    statut = models.CharField(max_length=25, choices=STATUT_CHOICES, default='PLANIFIEE')

    description_probleme = models.TextField()
    diagnostic = models.TextField(blank=True, null=True)
    travaux_realises = models.TextField(blank=True, null=True)
    pieces_utilisees = models.TextField(blank=True, null=True)

    heures_moteur_debut = models.DecimalField(max_digits=10, decimal_places=1, default=0)
    km_debut = models.DecimalField(max_digits=10, decimal_places=1, default=0)

    cout_pieces = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    cout_main_oeuvre = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    cout_total = models.DecimalField(max_digits=12, decimal_places=2, editable=False, default=0)

    technicien = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='interventions_technicien'
    )
    prestataire_externe = models.CharField(max_length=200, blank=True, null=True)

    date_planifiee = models.DateField(blank=True, null=True)
    date_debut = models.DateTimeField(blank=True, null=True)
    date_fin = models.DateTimeField(blank=True, null=True)
    duree_reelle_heures = models.DecimalField(max_digits=6, decimal_places=1, default=0)

    rapport = models.FileField(upload_to='equipements/rapports/', blank=True, null=True)
    photos_avant = models.ImageField(upload_to='equipements/interventions/avant/', blank=True, null=True)
    photos_apres = models.ImageField(upload_to='equipements/interventions/apres/', blank=True, null=True)

    declenchee_par_iot = models.BooleanField(default=False, help_text="Déclenchée automatiquement par capteur IoT")
    alerte_iot_data = models.JSONField(blank=True, null=True, help_text="Données IoT ayant déclenché l'alerte")

    signale_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='interventions_signalees'
    )
    date_creation = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.reference:
            self.reference = f"INT-{uuid.uuid4().hex[:8].upper()}"
        self.cout_total = self.cout_pieces + self.cout_main_oeuvre
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.reference} - {self.equipement.nom} ({self.get_type_intervention_display()})"

    class Meta:
        ordering = ['-date_creation']
        verbose_name = "Intervention maintenance"
        verbose_name_plural = "Interventions maintenance"


# ========================================
# CONSOMMATION CARBURANT
# ========================================
class ConsommationCarburant(models.Model):
    equipement = models.ForeignKey(
        Equipement,
        on_delete=models.CASCADE,
        related_name='consommations_carburant'
    )
    date_plein = models.DateTimeField()
    quantite_litres = models.DecimalField(max_digits=8, decimal_places=2)
    cout_total = models.DecimalField(max_digits=10, decimal_places=2)
    prix_litre = models.DecimalField(max_digits=8, decimal_places=2, editable=False, default=0)

    heures_moteur_au_plein = models.DecimalField(max_digits=10, decimal_places=1, default=0)
    km_au_plein = models.DecimalField(max_digits=10, decimal_places=1, default=0)

    station = models.CharField(max_length=200, blank=True, null=True)
    enregistre_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='pleins_enregistres'
    )
    date_creation = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self.quantite_litres and self.quantite_litres > 0:
            self.prix_litre = self.cout_total / self.quantite_litres
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.equipement.nom} - {self.quantite_litres}L ({self.date_plein.strftime('%d/%m/%Y')})"

    class Meta:
        ordering = ['-date_plein']
        verbose_name = "Consommation carburant"
        verbose_name_plural = "Consommations carburant"


# ========================================
# MOUVEMENT / TRACKING ÉQUIPEMENT
# ========================================
class MouvementEquipement(models.Model):
    TYPE_CHOICES = [
        ('DEPLACEMENT', 'Déplacement'),
        ('SORTIE_BASE', 'Sortie de base'),
        ('RETOUR_BASE', 'Retour à la base'),
        ('TRANSFERT', 'Transfert entre sites'),
        ('LIVRAISON_CLIENT', 'Livraison chez client'),
        ('RECUPERATION', 'Récupération chez client'),
    ]

    equipement = models.ForeignKey(
        Equipement,
        on_delete=models.CASCADE,
        related_name='mouvements'
    )
    type_mouvement = models.CharField(max_length=25, choices=TYPE_CHOICES)
    lieu_depart = models.CharField(max_length=255)
    lieu_arrivee = models.CharField(max_length=255)

    latitude_depart = models.DecimalField(max_digits=10, decimal_places=7, blank=True, null=True)
    longitude_depart = models.DecimalField(max_digits=10, decimal_places=7, blank=True, null=True)
    latitude_arrivee = models.DecimalField(max_digits=10, decimal_places=7, blank=True, null=True)
    longitude_arrivee = models.DecimalField(max_digits=10, decimal_places=7, blank=True, null=True)

    distance_km = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    date_mouvement = models.DateTimeField()
    notes = models.TextField(blank=True, null=True)

    effectue_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='mouvements_equipement'
    )
    date_creation = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Mettre à jour la localisation de l'équipement
        self.equipement.localisation_actuelle = self.lieu_arrivee
        if self.latitude_arrivee:
            self.equipement.latitude = self.latitude_arrivee
        if self.longitude_arrivee:
            self.equipement.longitude = self.longitude_arrivee
        self.equipement.save(update_fields=['localisation_actuelle', 'latitude', 'longitude'])

    def __str__(self):
        return f"{self.equipement.nom}: {self.lieu_depart} → {self.lieu_arrivee}"

    class Meta:
        ordering = ['-date_mouvement']
        verbose_name = "Mouvement équipement"
        verbose_name_plural = "Mouvements équipements"


# ========================================
# CYCLE DE VIE (acquisition → revente)
# ========================================
class CycleVieEquipement(models.Model):
    EVENEMENT_CHOICES = [
        ('ACQUISITION', 'Acquisition'),
        ('MISE_EN_SERVICE', 'Mise en service'),
        ('RENOVATION', 'Rénovation majeure'),
        ('RECLASSEMENT', 'Reclassement'),
        ('MISE_AU_REBUT', 'Mise au rebut'),
        ('VENTE', 'Vente / Cession'),
        ('OPTION_ACHAT', 'Exercice option d\'achat'),
        ('RETOUR_LEASING', 'Retour de leasing'),
    ]

    equipement = models.ForeignKey(
        Equipement,
        on_delete=models.CASCADE,
        related_name='cycle_vie'
    )
    evenement = models.CharField(max_length=20, choices=EVENEMENT_CHOICES)
    date_evenement = models.DateField()
    description = models.TextField()
    montant = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    acquereur = models.CharField(max_length=255, blank=True, null=True, help_text="En cas de vente/cession")
    document = models.FileField(upload_to='equipements/cycle_vie/', blank=True, null=True)

    enregistre_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True
    )
    date_creation = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.equipement.nom} - {self.get_evenement_display()} ({self.date_evenement})"

    class Meta:
        ordering = ['date_evenement']
        verbose_name = "Événement cycle de vie"
        verbose_name_plural = "Événements cycle de vie"


# ========================================
# ========================================
# CAPTEUR IoT
# ========================================
class CapteurIoT(models.Model):
    TYPE_CHOICES = [
        ('TEMPERATURE', 'Température'),
        ('PRESSION', 'Pression'),
        ('VIBRATION', 'Vibration'),
        ('GPS', 'Géolocalisation GPS'),
        ('HEURES_MOTEUR', 'Compteur heures moteur'),
        ('CARBURANT', 'Niveau carburant'),
        ('VITESSE', 'Vitesse'),
        ('HUMIDITE', 'Humidité'),
        ('REGIME_MOTEUR', 'Régime moteur (RPM)'),
        ('BATTERIE', 'Niveau batterie'),
        ('DIAGNOSTIC', 'Diagnostic moteur (OBD)'),
        ('AUTRE', 'Autre'),
    ]

    STATUT_CHOICES = [
        ('ACTIF', 'Actif'),
        ('INACTIF', 'Inactif'),
        ('DEFAILLANT', 'Défaillant'),
        ('DECONNECTE', 'Déconnecté'),
    ]

    equipement = models.ForeignKey(
        Equipement,
        on_delete=models.CASCADE,
        related_name='capteurs'
    )
    identifiant = models.CharField(max_length=100, unique=True, help_text="ID unique du capteur")
    nom = models.CharField(max_length=200)
    type_capteur = models.CharField(max_length=20, choices=TYPE_CHOICES)
    unite_mesure = models.CharField(max_length=30, blank=True, null=True, help_text="Ex: °C, bar, km/h, RPM")

    statut = models.CharField(max_length=15, choices=STATUT_CHOICES, default='ACTIF')

    # Seuils d'alerte
    seuil_min = models.DecimalField(
        max_digits=10, decimal_places=2, blank=True, null=True,
        help_text="Valeur minimum avant alerte"
    )
    seuil_max = models.DecimalField(
        max_digits=10, decimal_places=2, blank=True, null=True,
        help_text="Valeur maximum avant alerte"
    )
    seuil_critique_min = models.DecimalField(
        max_digits=10, decimal_places=2, blank=True, null=True,
        help_text="Valeur minimum critique (arrêt immédiat)"
    )
    seuil_critique_max = models.DecimalField(
        max_digits=10, decimal_places=2, blank=True, null=True,
        help_text="Valeur maximum critique (arrêt immédiat)"
    )

    # Dernière lecture
    derniere_valeur = models.DecimalField(max_digits=12, decimal_places=4, blank=True, null=True)
    derniere_lecture = models.DateTimeField(blank=True, null=True)

    # Configuration
    frequence_lecture_secondes = models.PositiveIntegerField(default=300, help_text="Fréquence d'envoi en secondes")
    est_actif = models.BooleanField(default=True)

    firmware_version = models.CharField(max_length=50, blank=True, null=True)
    date_installation = models.DateField(blank=True, null=True)
    date_creation = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.identifiant} - {self.nom} ({self.equipement.nom})"

    class Meta:
        ordering = ['equipement', 'type_capteur']
        verbose_name = "Capteur IoT"
        verbose_name_plural = "Capteurs IoT"


# ========================================
# DONNÉES TÉLÉMÉTRIE
# ========================================
class DonneesTelemetrie(models.Model):
    capteur = models.ForeignKey(
        CapteurIoT,
        on_delete=models.CASCADE,
        related_name='donnees'
    )
    valeur = models.DecimalField(max_digits=12, decimal_places=4)
    unite = models.CharField(max_length=30, blank=True, null=True)

    latitude = models.DecimalField(max_digits=10, decimal_places=7, blank=True, null=True)
    longitude = models.DecimalField(max_digits=10, decimal_places=7, blank=True, null=True)

    metadata = models.JSONField(blank=True, null=True, help_text="Données brutes supplémentaires du capteur")

    est_anomalie = models.BooleanField(default=False)
    timestamp = models.DateTimeField()
    date_reception = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']
        verbose_name = "Donnée télémétrie"
        verbose_name_plural = "Données télémétrie"
        indexes = [
            models.Index(fields=['capteur', '-timestamp']),
            models.Index(fields=['-timestamp']),
            models.Index(fields=['est_anomalie', '-timestamp']),
        ]

    def __str__(self):
        return f"{self.capteur.identifiant}: {self.valeur}{self.unite or ''} ({self.timestamp})"


# ========================================
# ALERTE IoT
# ========================================
class AlerteIoT(models.Model):
    SEVERITE_CHOICES = [
        ('INFO', 'Information'),
        ('WARNING', 'Avertissement'),
        ('DANGER', 'Danger'),
        ('CRITIQUE', 'Critique'),
    ]

    STATUT_CHOICES = [
        ('ACTIVE', 'Active'),
        ('ACQUITTEE', 'Acquittée'),
        ('RESOLUE', 'Résolue'),
        ('IGNOREE', 'Ignorée'),
    ]

    capteur = models.ForeignKey(
        CapteurIoT,
        on_delete=models.CASCADE,
        related_name='alertes'
    )
    equipement = models.ForeignKey(
        Equipement,
        on_delete=models.CASCADE,
        related_name='alertes_iot'
    )

    severite = models.CharField(max_length=10, choices=SEVERITE_CHOICES)
    statut = models.CharField(max_length=15, choices=STATUT_CHOICES, default='ACTIVE')

    titre = models.CharField(max_length=255)
    message = models.TextField()

    valeur_declenchement = models.DecimalField(max_digits=12, decimal_places=4)
    seuil_depasse = models.DecimalField(max_digits=12, decimal_places=4, blank=True, null=True)
    donnee_telemetrie = models.ForeignKey(
        DonneesTelemetrie,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='alertes'
    )

    # Intervention automatique
    intervention_creee = models.ForeignKey(
        InterventionMaintenance,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='alertes_iot_source'
    )

    # Acquittement
    acquittee_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='alertes_acquittees'
    )
    date_acquittement = models.DateTimeField(blank=True, null=True)
    commentaire_resolution = models.TextField(blank=True, null=True)

    date_alerte = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"[{self.get_severite_display()}] {self.titre} - {self.equipement.nom}"

    class Meta:
        ordering = ['-date_alerte']
        verbose_name = "Alerte IoT"
        verbose_name_plural = "Alertes IoT"
        indexes = [
            models.Index(fields=['statut', '-date_alerte']),
            models.Index(fields=['equipement', '-date_alerte']),
            models.Index(fields=['severite', '-date_alerte']),
        ]


# ========================================
# RÈGLE D'ALERTE IoT
# ========================================
class RegleAlerteIoT(models.Model):
    CONDITION_CHOICES = [
        ('SUP', 'Supérieur à'),
        ('INF', 'Inférieur à'),
        ('EGAL', 'Égal à'),
        ('ENTRE', 'Entre deux valeurs'),
        ('HORS', 'Hors plage'),
        ('VARIATION', 'Variation brusque'),
        ('INACTIVITE', 'Inactivité capteur'),
    ]

    ACTION_CHOICES = [
        ('NOTIFICATION', 'Notification uniquement'),
        ('INTERVENTION', 'Créer intervention automatique'),
        ('ARRET', 'Notification + intervention urgente'),
        ('EMAIL', 'Notification + email'),
    ]

    nom = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    type_capteur = models.CharField(max_length=20, choices=CapteurIoT.TYPE_CHOICES)

    condition = models.CharField(max_length=15, choices=CONDITION_CHOICES)
    valeur_seuil = models.DecimalField(max_digits=12, decimal_places=4)
    valeur_seuil_max = models.DecimalField(
        max_digits=12, decimal_places=4, blank=True, null=True,
        help_text="Pour condition ENTRE ou HORS"
    )
    pourcentage_variation = models.DecimalField(
        max_digits=5, decimal_places=2, blank=True, null=True,
        help_text="Pour condition VARIATION (ex: 20 = 20%)"
    )
    duree_inactivite_minutes = models.PositiveIntegerField(
        blank=True, null=True,
        help_text="Pour condition INACTIVITE"
    )

    severite = models.CharField(max_length=10, choices=AlerteIoT.SEVERITE_CHOICES, default='WARNING')
    action = models.CharField(max_length=15, choices=ACTION_CHOICES, default='NOTIFICATION')

    est_active = models.BooleanField(default=True)
    cooldown_minutes = models.PositiveIntegerField(
        default=30,
        help_text="Minutes minimum entre deux alertes du même type"
    )

    date_creation = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.nom} ({self.get_type_capteur_display()} {self.get_condition_display()} {self.valeur_seuil})"

    class Meta:
        ordering = ['type_capteur', 'nom']
        verbose_name = "Règle d'alerte IoT"
        verbose_name_plural = "Règles d'alerte IoT"