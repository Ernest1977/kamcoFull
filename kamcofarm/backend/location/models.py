from django.db import models
from django.conf import settings
from decimal import Decimal
import uuid
from django.core.validators import FileExtensionValidator


image = models.ImageField(
    upload_to='photos/',
    validators=[FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png', 'webp'])],
)


# ========================================
# RÉSERVATION D'ÉQUIPEMENT
# ========================================
class ReservationEquipement(models.Model):
    STATUT_CHOICES = [
        ('EN_ATTENTE', 'En attente de confirmation'),
        ('CONFIRMEE', 'Confirmée'),
        ('EN_COURS', 'En cours'),
        ('TERMINEE', 'Terminée'),
        ('ANNULEE', 'Annulée'),
        ('REFUSEE', 'Refusée'),
    ]

    MODE_TARIFICATION_CHOICES = [
        ('JOURNALIER', 'Tarif journalier'),
        ('HEBDOMADAIRE', 'Tarif hebdomadaire'),
        ('MENSUEL', 'Tarif mensuel'),
        ('HORAIRE', 'Tarif horaire'),
        ('FORFAIT', 'Forfait personnalisé'),
    ]

    reference = models.CharField(max_length=50, unique=True, editable=False)

    # Équipement
    equipement = models.ForeignKey(
        'equipements.Equipement',
        on_delete=models.PROTECT,
        related_name='reservations'
    )

    # Client
    client_nom = models.CharField(max_length=255)
    client_entreprise = models.CharField(max_length=255, blank=True, null=True)
    client_email = models.EmailField()
    client_telephone = models.CharField(max_length=50)
    client_adresse = models.TextField(blank=True, null=True)
    client_piece_identite = models.CharField(max_length=100, blank=True, null=True)

    # Période
    date_debut_prevue = models.DateField()
    date_fin_prevue = models.DateField()
    nombre_jours = models.PositiveIntegerField(editable=False, default=0)

    # Lieu
    lieu_utilisation = models.CharField(max_length=255, blank=True, null=True)
    lieu_livraison = models.CharField(max_length=255, blank=True, null=True)

    # Tarification
    mode_tarification = models.CharField(
        max_length=15, choices=MODE_TARIFICATION_CHOICES, default='JOURNALIER'
    )
    tarif_applique = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    montant_estime = models.DecimalField(max_digits=14, decimal_places=2, editable=False, default=0)
    devise = models.CharField(max_length=10, default='FCFA')

    # Caution
    caution_requise = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # Statut
    statut = models.CharField(max_length=15, choices=STATUT_CHOICES, default='EN_ATTENTE')
    motif_annulation = models.TextField(blank=True, null=True)

    # Notes
    notes = models.TextField(blank=True, null=True)
    conditions_speciales = models.TextField(blank=True, null=True)

    # Métadonnées
    creee_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='reservations_location_creees'
    )
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.reference:
            self.reference = f"RES-{uuid.uuid4().hex[:8].upper()}"

        if self.date_debut_prevue and self.date_fin_prevue:
            delta = self.date_fin_prevue - self.date_debut_prevue
            self.nombre_jours = max(1, delta.days)

        if self.tarif_applique > 0:
            if self.mode_tarification == 'JOURNALIER':
                self.montant_estime = self.tarif_applique * self.nombre_jours
            elif self.mode_tarification == 'HEBDOMADAIRE':
                semaines = max(1, self.nombre_jours / 7)
                self.montant_estime = self.tarif_applique * Decimal(str(semaines))
            elif self.mode_tarification == 'MENSUEL':
                mois = max(1, self.nombre_jours / 30)
                self.montant_estime = self.tarif_applique * Decimal(str(mois))
            elif self.mode_tarification == 'FORFAIT':
                self.montant_estime = self.tarif_applique
            else:
                self.montant_estime = self.tarif_applique * self.nombre_jours

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.reference} - {self.equipement.nom} pour {self.client_nom} ({self.get_statut_display()})"

    class Meta:
        ordering = ['-date_creation']
        verbose_name = "Réservation"
        verbose_name_plural = "Réservations"


# ========================================
# CONTRAT DE LOCATION
# ========================================
class ContratLocation(models.Model):
    STATUT_CHOICES = [
        ('BROUILLON', 'Brouillon'),
        ('EN_ATTENTE_SIGNATURE', 'En attente de signature'),
        ('SIGNE', 'Signé'),
        ('ACTIF', 'Actif'),
        ('TERMINE', 'Terminé'),
        ('RESILIE', 'Résilié'),
        ('LITIGE', 'En litige'),
    ]

    MODE_TARIFICATION_CHOICES = [
        ('JOURNALIER', 'Tarif journalier'),
        ('HEBDOMADAIRE', 'Tarif hebdomadaire'),
        ('MENSUEL', 'Tarif mensuel'),
        ('HORAIRE', 'Tarif horaire'),
        ('FORFAIT', 'Forfait personnalisé'),
    ]

    reference = models.CharField(max_length=50, unique=True, editable=False)
    reservation = models.OneToOneField(
        ReservationEquipement,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='contrat'
    )

    # Équipement
    equipement = models.ForeignKey(
        'equipements.Equipement',
        on_delete=models.PROTECT,
        related_name='contrats_location'
    )

    # Client
    client_nom = models.CharField(max_length=255)
    client_entreprise = models.CharField(max_length=255, blank=True, null=True)
    client_email = models.EmailField()
    client_telephone = models.CharField(max_length=50)
    client_adresse = models.TextField(blank=True, null=True)
    client_piece_identite = models.CharField(max_length=100, blank=True, null=True)
    client_registre_commerce = models.CharField(max_length=100, blank=True, null=True)

    # Période
    date_debut = models.DateField()
    date_fin_prevue = models.DateField()
    date_fin_effective = models.DateField(blank=True, null=True)

    # Tarification
    mode_tarification = models.CharField(
        max_length=15, choices=MODE_TARIFICATION_CHOICES, default='JOURNALIER'
    )
    tarif_base = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # Compteurs
    heures_moteur_depart = models.DecimalField(max_digits=10, decimal_places=1, default=0)
    heures_moteur_retour = models.DecimalField(max_digits=10, decimal_places=1, blank=True, null=True)
    km_depart = models.DecimalField(max_digits=10, decimal_places=1, default=0)
    km_retour = models.DecimalField(max_digits=10, decimal_places=1, blank=True, null=True)

    # Montants
    montant_location_ht = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    montant_services_ht = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    montant_penalites = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    remise = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    sous_total_ht = models.DecimalField(max_digits=14, decimal_places=2, editable=False, default=0)
    taux_tva = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('19.25'))
    montant_tva = models.DecimalField(max_digits=14, decimal_places=2, editable=False, default=0)
    montant_total_ttc = models.DecimalField(max_digits=14, decimal_places=2, editable=False, default=0)
    devise = models.CharField(max_length=10, default='FCFA')

    # Pénalités retard
    penalite_retard_par_jour = models.DecimalField(
        max_digits=10, decimal_places=2, default=0,
        help_text="Montant de pénalité par jour de retard"
    )

    # Option d'achat (Rental Purchase Option)
    option_achat_proposee = models.BooleanField(default=False)
    prix_option_achat = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    option_achat_exercee = models.BooleanField(default=False)
    date_exercice_option = models.DateField(blank=True, null=True)

    # Documents
    document_contrat = models.FileField(upload_to='location/contrats/', blank=True, null=True)
    signature_client = models.ImageField(upload_to='location/signatures/', blank=True, null=True)
    signature_entreprise = models.ImageField(upload_to='location/signatures/', blank=True, null=True)
    signe_hors_ligne = models.BooleanField(
        default=False, help_text="Contrat signé sur tablette en mode hors ligne"
    )

    # Statut
    statut = models.CharField(max_length=25, choices=STATUT_CHOICES, default='BROUILLON')
    conditions_generales = models.TextField(
        blank=True, null=True,
        default=(
            "Le locataire s'engage à utiliser le matériel conformément à sa destination. "
            "Toute dégradation hors usure normale sera facturée. "
            "Le matériel doit être restitué propre et en état de fonctionnement. "
            "En cas de retard de restitution, des pénalités journalières s'appliquent."
        )
    )

    notes = models.TextField(blank=True, null=True)

    # Métadonnées
    creee_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='contrats_location_crees'
    )
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.reference:
            self.reference = f"CTL-{uuid.uuid4().hex[:8].upper()}"

        self.sous_total_ht = (
            self.montant_location_ht +
            self.montant_services_ht +
            self.montant_penalites -
            self.remise
        )
        self.montant_tva = self.sous_total_ht * (self.taux_tva / Decimal('100'))
        self.montant_total_ttc = self.sous_total_ht + self.montant_tva

        super().save(*args, **kwargs)

    @property
    def jours_location(self):
        fin = self.date_fin_effective or self.date_fin_prevue
        if fin and self.date_debut:
            return max(1, (fin - self.date_debut).days)
        return 0

    @property
    def jours_retard(self):
        from datetime import date
        if self.date_fin_effective and self.date_fin_prevue:
            retard = (self.date_fin_effective - self.date_fin_prevue).days
            return max(0, retard)
        elif not self.date_fin_effective and self.statut == 'ACTIF':
            retard = (date.today() - self.date_fin_prevue).days
            return max(0, retard)
        return 0

    @property
    def heures_utilisees(self):
        if self.heures_moteur_retour is not None:
            return float(self.heures_moteur_retour) - float(self.heures_moteur_depart)
        return 0

    @property
    def km_parcourus(self):
        if self.km_retour is not None:
            return float(self.km_retour) - float(self.km_depart)
        return 0

    def __str__(self):
        return f"{self.reference} - {self.equipement.nom} pour {self.client_nom} ({self.get_statut_display()})"

    class Meta:
        ordering = ['-date_creation']
        verbose_name = "Contrat de location"
        verbose_name_plural = "Contrats de location"


# ========================================
# ÉTAT DES LIEUX (Check-in / Check-out)
# ========================================
class EtatDesLieux(models.Model):
    TYPE_CHOICES = [
        ('SORTIE', 'État des lieux de sortie (check-out)'),
        ('RETOUR', 'État des lieux de retour (check-in)'),
    ]

    ETAT_CHOICES = [
        ('NEUF', 'Neuf'),
        ('EXCELLENT', 'Excellent'),
        ('BON', 'Bon état'),
        ('ACCEPTABLE', 'Acceptable'),
        ('ENDOMMAGE', 'Endommagé'),
        ('HORS_SERVICE', 'Hors service'),
    ]

    contrat = models.ForeignKey(
        ContratLocation,
        on_delete=models.CASCADE,
        related_name='etats_des_lieux'
    )
    type_etat = models.CharField(max_length=10, choices=TYPE_CHOICES)

    # État par composant
    etat_general = models.CharField(max_length=15, choices=ETAT_CHOICES, default='BON')
    etat_carrosserie = models.CharField(max_length=15, choices=ETAT_CHOICES, default='BON')
    etat_moteur = models.CharField(max_length=15, choices=ETAT_CHOICES, default='BON')
    etat_pneus = models.CharField(max_length=15, choices=ETAT_CHOICES, default='BON')
    etat_hydraulique = models.CharField(max_length=15, choices=ETAT_CHOICES, default='BON')
    etat_electrique = models.CharField(max_length=15, choices=ETAT_CHOICES, default='BON')
    etat_accessoires = models.CharField(max_length=15, choices=ETAT_CHOICES, default='BON')

    # Compteurs
    heures_moteur = models.DecimalField(max_digits=10, decimal_places=1, default=0)
    kilometres = models.DecimalField(max_digits=10, decimal_places=1, default=0)
    niveau_carburant_pourcentage = models.PositiveIntegerField(
        default=100, help_text="Niveau de carburant en pourcentage"
    )

    # Observations
    dommages_constates = models.TextField(blank=True, null=True)
    accessoires_presents = models.TextField(
        blank=True, null=True,
        help_text="Liste des accessoires vérifiés"
    )
    observations = models.TextField(blank=True, null=True)

    # Photos
    photo_avant = models.ImageField(upload_to='location/etats_lieux/avant/', blank=True, null=True)
    photo_arriere = models.ImageField(upload_to='location/etats_lieux/arriere/', blank=True, null=True)
    photo_gauche = models.ImageField(upload_to='location/etats_lieux/gauche/', blank=True, null=True)
    photo_droite = models.ImageField(upload_to='location/etats_lieux/droite/', blank=True, null=True)
    photo_interieur = models.ImageField(upload_to='location/etats_lieux/interieur/', blank=True, null=True)
    photo_dommages = models.ImageField(upload_to='location/etats_lieux/dommages/', blank=True, null=True)

    # Signature
    signature_client = models.ImageField(upload_to='location/etats_lieux/signatures/', blank=True, null=True)
    signature_agent = models.ImageField(upload_to='location/etats_lieux/signatures/', blank=True, null=True)
    realise_hors_ligne = models.BooleanField(
        default=False, help_text="Réalisé sur tablette en mode hors ligne"
    )

    # Métadonnées
    realise_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='etats_lieux_realises'
    )
    date_realisation = models.DateTimeField()
    date_creation = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        # Standardiser les photos avant sauvegarde
        try:
            from .image_service import standardiser_image

            photo_fields = [
                'photo_avant', 'photo_arriere', 'photo_gauche',
                'photo_droite', 'photo_interieur', 'photo_dommages'
            ]

            for field_name in photo_fields:
                field = getattr(self, field_name)
                if field and hasattr(field, 'file'):
                    try:
                        setattr(self, field_name, standardiser_image(field))
                    except Exception:
                        pass

        except ImportError:
            pass

        super().save(*args, **kwargs)
        

    def __str__(self):
        return f"EDL {self.get_type_etat_display()} - {self.contrat.reference} ({self.get_etat_general_display()})"

    class Meta:
        ordering = ['-date_realisation']
        verbose_name = "État des lieux"
        verbose_name_plural = "États des lieux"


# ========================================
# CAUTION DE LOCATION
# ========================================
class CautionLocation(models.Model):
    STATUT_CHOICES = [
        ('EN_ATTENTE', 'En attente de versement'),
        ('VERSEE', 'Versée'),
        ('PARTIELLEMENT_RESTITUEE', 'Partiellement restituée'),
        ('RESTITUEE', 'Intégralement restituée'),
        ('RETENUE', 'Retenue (dommages)'),
        ('ANNULEE', 'Annulée'),
    ]

    MODE_PAIEMENT_CHOICES = [
        ('ESPECES', 'Espèces'),
        ('VIREMENT', 'Virement bancaire'),
        ('CHEQUE', 'Chèque'),
        ('MOBILE_MONEY', 'Mobile Money'),
        ('CARTE', 'Carte bancaire'),
    ]

    reference = models.CharField(max_length=50, unique=True, editable=False)
    contrat = models.ForeignKey(
        ContratLocation,
        on_delete=models.CASCADE,
        related_name='cautions'
    )

    # Montants
    montant_requis = models.DecimalField(max_digits=12, decimal_places=2)
    montant_verse = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    montant_retenu = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        help_text="Montant retenu pour dommages ou impayés"
    )
    montant_restitue = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    devise = models.CharField(max_length=10, default='FCFA')

    # Versement
    mode_paiement = models.CharField(max_length=15, choices=MODE_PAIEMENT_CHOICES, default='ESPECES')
    reference_paiement = models.CharField(max_length=100, blank=True, null=True)
    preuve_versement = models.FileField(upload_to='location/cautions/versements/', blank=True, null=True)
    date_versement = models.DateField(blank=True, null=True)

    # Restitution
    date_restitution = models.DateField(blank=True, null=True)
    motif_retenue = models.TextField(blank=True, null=True)
    preuve_restitution = models.FileField(upload_to='location/cautions/restitutions/', blank=True, null=True)

    # Statut
    statut = models.CharField(max_length=30, choices=STATUT_CHOICES, default='EN_ATTENTE')
    notes = models.TextField(blank=True, null=True)

    # Métadonnées
    enregistree_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='cautions_enregistrees'
    )
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.reference:
            self.reference = f"CAU-{uuid.uuid4().hex[:8].upper()}"

        # Mise à jour automatique du statut
        if self.montant_verse >= self.montant_requis and self.statut == 'EN_ATTENTE':
            self.statut = 'VERSEE'

        if self.montant_restitue > 0:
            if self.montant_restitue >= self.montant_verse - self.montant_retenu:
                self.statut = 'RESTITUEE'
            else:
                self.statut = 'PARTIELLEMENT_RESTITUEE'

        if self.montant_retenu > 0 and self.montant_restitue == 0:
            self.statut = 'RETENUE'

        super().save(*args, **kwargs)

    @property
    def solde_a_restituer(self):
        return max(Decimal('0'), self.montant_verse - self.montant_retenu - self.montant_restitue)

    def __str__(self):
        return f"{self.reference} - {self.contrat.reference} ({self.get_statut_display()})"

    class Meta:
        ordering = ['-date_creation']
        verbose_name = "Caution"
        verbose_name_plural = "Cautions"


# ========================================
# SERVICE ANNEXE
# ========================================
class ServiceAnnexe(models.Model):
    TYPE_CHOICES = [
        ('LIVRAISON', 'Livraison'),
        ('RECUPERATION', 'Récupération'),
        ('NETTOYAGE', 'Nettoyage'),
        ('CARBURANT', 'Carburant'),
        ('MAIN_OEUVRE', 'Main d\'oeuvre / Opérateur'),
        ('ASSURANCE', 'Assurance complémentaire'),
        ('FORMATION', 'Formation utilisation'),
        ('INSTALLATION', 'Installation sur site'),
        ('ENTRETIEN', 'Entretien pendant location'),
        ('AUTRE', 'Autre'),
    ]

    contrat = models.ForeignKey(
        ContratLocation,
        on_delete=models.CASCADE,
        related_name='services_annexes'
    )
    type_service = models.CharField(max_length=20, choices=TYPE_CHOICES)
    description = models.TextField()
    quantite = models.DecimalField(max_digits=8, decimal_places=2, default=1)
    unite = models.CharField(max_length=30, default='forfait', help_text="Ex: jour, heure, km, forfait")
    prix_unitaire = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    montant_total = models.DecimalField(max_digits=12, decimal_places=2, editable=False, default=0)

    # TVA spécifique au service
    taux_tva_service = models.DecimalField(
        max_digits=5, decimal_places=2, default=Decimal('19.25'),
        help_text="Certains services ont un taux TVA différent"
    )

    date_prestation = models.DateField(blank=True, null=True)
    est_facture = models.BooleanField(default=False)
    notes = models.TextField(blank=True, null=True)

    date_creation = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        self.montant_total = self.quantite * self.prix_unitaire
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.get_type_service_display()} - {self.contrat.reference} ({self.montant_total} FCFA)"

    class Meta:
        ordering = ['-date_creation']
        verbose_name = "Service annexe"
        verbose_name_plural = "Services annexes"


# ========================================
# FACTURATION DE LOCATION
# ========================================
class FacturationLocation(models.Model):
    STATUT_CHOICES = [
        ('BROUILLON', 'Brouillon'),
        ('EMISE', 'Émise'),
        ('ENVOYEE', 'Envoyée au client'),
        ('PAYEE', 'Payée'),
        ('PARTIELLEMENT_PAYEE', 'Partiellement payée'),
        ('EN_RETARD', 'En retard de paiement'),
        ('ANNULEE', 'Annulée'),
    ]

    MODE_PAIEMENT_CHOICES = [
        ('VIREMENT', 'Virement bancaire'),
        ('ESPECES', 'Espèces'),
        ('MOBILE_MONEY', 'Mobile Money'),
        ('CHEQUE', 'Chèque'),
        ('CARTE', 'Carte bancaire'),
    ]

    reference = models.CharField(max_length=50, unique=True, editable=False)
    contrat = models.ForeignKey(
        ContratLocation,
        on_delete=models.CASCADE,
        related_name='facturations'
    )

    # Client (copie depuis contrat)
    client_nom = models.CharField(max_length=255)
    client_entreprise = models.CharField(max_length=255, blank=True, null=True)
    client_email = models.EmailField(blank=True, null=True)
    client_adresse = models.TextField(blank=True, null=True)

    # Montants
    montant_ht = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    taux_tva = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('19.25'))
    montant_tva = models.DecimalField(max_digits=14, decimal_places=2, editable=False, default=0)
    montant_ttc = models.DecimalField(max_digits=14, decimal_places=2, editable=False, default=0)
    montant_paye = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    solde_restant = models.DecimalField(max_digits=14, decimal_places=2, editable=False, default=0)
    devise = models.CharField(max_length=10, default='FCFA')

    # Paiement
    mode_paiement = models.CharField(max_length=15, choices=MODE_PAIEMENT_CHOICES, blank=True, null=True)
    reference_paiement = models.CharField(max_length=100, blank=True, null=True)
    date_paiement = models.DateField(blank=True, null=True)

    # Dates
    date_emission = models.DateField()
    date_echeance = models.DateField()

    # Document
    document = models.FileField(upload_to='location/factures/', blank=True, null=True)

    # Statut
    statut = models.CharField(max_length=25, choices=STATUT_CHOICES, default='BROUILLON')
    notes = models.TextField(blank=True, null=True)

    # Métadonnées
    emise_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='factures_location_emises'
    )
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.reference:
            self.reference = f"FLC-{uuid.uuid4().hex[:8].upper()}"

        # Calcul montant HT à partir des lignes
        if self.pk:
            total_lignes = sum(l.montant_total for l in self.lignes.all())
            if total_lignes > 0:
                self.montant_ht = total_lignes

        self.montant_tva = self.montant_ht * (self.taux_tva / Decimal('100'))
        self.montant_ttc = self.montant_ht + self.montant_tva
        self.solde_restant = self.montant_ttc - self.montant_paye

        # Mise à jour statut selon paiement
        if self.montant_paye >= self.montant_ttc and self.montant_ttc > 0:
            self.statut = 'PAYEE'
        elif self.montant_paye > 0 and self.montant_paye < self.montant_ttc:
            self.statut = 'PARTIELLEMENT_PAYEE'

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.reference} - {self.client_nom} ({self.get_statut_display()})"

    class Meta:
        ordering = ['-date_emission']
        verbose_name = "Facturation location"
        verbose_name_plural = "Facturations location"


# ========================================
# LIGNE DE FACTURATION
# ========================================
class LigneFacturationLocation(models.Model):
    TYPE_CHOICES = [
        ('LOCATION', 'Location équipement'),
        ('SERVICE', 'Service annexe'),
        ('PENALITE', 'Pénalité de retard'),
        ('DOMMAGE', 'Réparation dommages'),
        ('CARBURANT', 'Complément carburant'),
        ('REMISE', 'Remise / Avoir'),
        ('AUTRE', 'Autre'),
    ]

    facturation = models.ForeignKey(
        FacturationLocation,
        on_delete=models.CASCADE,
        related_name='lignes'
    )
    type_ligne = models.CharField(max_length=15, choices=TYPE_CHOICES, default='LOCATION')
    description = models.CharField(max_length=500)
    quantite = models.DecimalField(max_digits=10, decimal_places=2, default=1)
    unite = models.CharField(max_length=30, default='jour')
    prix_unitaire = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    montant_total = models.DecimalField(max_digits=14, decimal_places=2, editable=False, default=0)

    # TVA spécifique si différente
    taux_tva_specifique = models.DecimalField(
        max_digits=5, decimal_places=2, blank=True, null=True,
        help_text="Si vide, utilise le taux TVA de la facture"
    )

    service_annexe = models.ForeignKey(
        ServiceAnnexe,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='lignes_facturation'
    )

    def save(self, *args, **kwargs):
        self.montant_total = self.quantite * self.prix_unitaire
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.description} - {self.montant_total}"

    class Meta:
        ordering = ['type_ligne', 'id']
        verbose_name = "Ligne de facturation"
        verbose_name_plural = "Lignes de facturation"


# ========================================
# PAIEMENT LOCATION
# ========================================
class PaiementLocation(models.Model):
    MODE_CHOICES = [
        ('VIREMENT', 'Virement bancaire'),
        ('ESPECES', 'Espèces'),
        ('MOBILE_MONEY', 'Mobile Money'),
        ('CHEQUE', 'Chèque'),
        ('CARTE', 'Carte bancaire'),
        ('COMPENSATION', 'Compensation avec caution'),
    ]

    STATUT_CHOICES = [
        ('EN_ATTENTE', 'En attente'),
        ('CONFIRME', 'Confirmé'),
        ('ECHOUE', 'Échoué'),
        ('REMBOURSE', 'Remboursé'),
    ]

    reference = models.CharField(max_length=50, unique=True, editable=False)
    facturation = models.ForeignKey(
        FacturationLocation,
        on_delete=models.CASCADE,
        related_name='paiements'
    )

    montant = models.DecimalField(max_digits=14, decimal_places=2)
    mode_paiement = models.CharField(max_length=15, choices=MODE_CHOICES, default='VIREMENT')
    statut = models.CharField(max_length=15, choices=STATUT_CHOICES, default='EN_ATTENTE')

    reference_externe = models.CharField(max_length=100, blank=True, null=True)
    preuve = models.FileField(upload_to='location/paiements/', blank=True, null=True)
    notes = models.TextField(blank=True, null=True)

    date_paiement = models.DateField()
    date_confirmation = models.DateField(blank=True, null=True)

    confirme_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='paiements_location_confirmes'
    )
    date_creation = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.reference:
            self.reference = f"PLO-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.reference} - {self.montant} {self.facturation.devise} ({self.get_statut_display()})"

    class Meta:
        ordering = ['-date_paiement']
        verbose_name = "Paiement location"
        verbose_name_plural = "Paiements location"