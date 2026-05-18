# Create your models here.

from django.db import models
from django.conf import settings
import uuid


# ========================================
# DÉPARTEMENT
# ========================================
class Departement(models.Model):
    nom = models.CharField(max_length=150)
    description = models.TextField(blank=True, null=True)
    responsable = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='departements_diriges'
    )
    est_actif = models.BooleanField(default=True)
    date_creation = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nom

    class Meta:
        ordering = ['nom']
        verbose_name = "Département"
        verbose_name_plural = "Départements"


# ========================================
# EMPLOYÉ
# ========================================
class Employe(models.Model):
    TYPE_CONTRAT_CHOICES = [
        ('CDI', 'CDI - Contrat à Durée Indéterminée'),
        ('CDD', 'CDD - Contrat à Durée Déterminée'),
        ('STAGE', 'Stage'),
        ('FREELANCE', 'Freelance'),
        ('INTERIM', 'Intérimaire'),
    ]

    GENRE_CHOICES = [
        ('M', 'Masculin'),
        ('F', 'Féminin'),
        ('A', 'Autre'),
    ]

    # Lien avec le compte utilisateur
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='profil_employe'
    )

    matricule = models.CharField(max_length=20, unique=True, editable=False)
    genre = models.CharField(max_length=1, choices=GENRE_CHOICES, default='M')
    date_naissance = models.DateField(blank=True, null=True)
    lieu_naissance = models.CharField(max_length=150, blank=True, null=True)
    nationalite = models.CharField(max_length=100, default='Camerounaise')

    # Informations personnelles supplémentaires
    nom_complet = models.CharField(
        max_length=255, blank=True, null=True,
        help_text="Nom complet de l'employé (si différent du compte utilisateur)"
    )
    statut_marital = models.CharField(
        max_length=20,
        choices=[
            ('CELIBATAIRE', 'Célibataire'),
            ('MARIE', 'Marié(e)'),
            ('DIVORCE', 'Divorcé(e)'),
            ('VEUF', 'Veuf/Veuve'),
            ('UNION_LIBRE', 'Union libre'),
        ],
        blank=True, null=True,
        help_text="Statut marital de l'employé"
    )
    niveau_etude = models.CharField(
        max_length=50,
        choices=[
            ('SANS_DIPLOME', 'Sans diplôme'),
            ('CEP', 'CEP / FSLC'),
            ('BEPC', 'BEPC / GCE O-Level'),
            ('PROBATOIRE', 'Probatoire'),
            ('BAC', 'Baccalauréat / GCE A-Level'),
            ('BTS', 'BTS / HND'),
            ('LICENCE', 'Licence / Bachelor'),
            ('MASTER', 'Master'),
            ('DOCTORAT', 'Doctorat / PhD'),
            ('AUTRE', 'Autre'),
        ],
        blank=True, null=True,
        help_text="Niveau d'étude de l'employé"
    )
    email_personnel = models.EmailField(
        blank=True, null=True,
        help_text="Email personnel de l'employé"
    )
    ville = models.CharField(
        max_length=100, blank=True, null=True,
        help_text="Ville de résidence"
    )
    pays_residence = models.CharField(
        max_length=100, blank=True, null=True,
        default='Cameroun',
        help_text="Pays de résidence"
    )

    # Informations professionnelles
    poste = models.CharField(max_length=200)
    departement = models.ForeignKey(
        Departement,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='employes'
    )
    type_contrat = models.CharField(max_length=15, choices=TYPE_CONTRAT_CHOICES, default='CDI')
    date_embauche = models.DateField()
    date_fin_contrat = models.DateField(blank=True, null=True)
    salaire_base = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # Contact
    telephone_personnel = models.CharField(max_length=50, blank=True, null=True)
    adresse = models.TextField(blank=True, null=True)
    contact_urgence_nom = models.CharField(max_length=150, blank=True, null=True)
    contact_urgence_telephone = models.CharField(max_length=50, blank=True, null=True)

    # Documents
    # photo = models.ImageField(upload_to='rh/photos/', blank=True, null=True)
    # Dans chaque modèle avec FileField/ImageField
    from django.core.validators import FileExtensionValidator

    photo = models.ImageField(
        upload_to='rh/photos/', blank=True, null=True,
        validators=[FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png', 'webp'])],
    )
    cv = models.FileField(upload_to='rh/cv/', blank=True, null=True)

    # Statut
    est_actif = models.BooleanField(default=True)
    date_creation = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.matricule:
            self.matricule = f"EMP-{uuid.uuid4().hex[:6].upper()}"
        super().save(*args, **kwargs)


    @property
    def age(self):
        """Calcule l'âge actuel de l'employé."""
        if not self.date_naissance:
            return None
        from datetime import date
        today = date.today()
        return today.year - self.date_naissance.year - (
            (today.month, today.day) < (self.date_naissance.month, self.date_naissance.day)
        )

    @property
    def nom_affiche(self):
        """Retourne le nom complet ou le nom du compte utilisateur."""
        if self.nom_complet:
            return self.nom_complet
        full = self.user.get_full_name()
        return full if full else self.user.username

    def __str__(self):
        return f"{self.matricule} - {self.nom_affiche} ({self.poste})"


    class Meta:
        ordering = ['user__last_name', 'user__first_name']
        verbose_name = "Employé"
        verbose_name_plural = "Employés"


# ========================================
# CONTRAT DE TRAVAIL
# ========================================
class ContratTravail(models.Model):
    TYPE_CHOICES = [
        ('CDI', 'CDI'),
        ('CDD', 'CDD'),
        ('STAGE', 'Stage'),
        ('FREELANCE', 'Freelance'),
        ('AVENANT', 'Avenant'),
    ]

    STATUT_CHOICES = [
        ('ACTIF', 'Actif'),
        ('EXPIRE', 'Expiré'),
        ('RESILIE', 'Résilié'),
        ('SUSPENDU', 'Suspendu'),
    ]

    employe = models.ForeignKey(
        Employe,
        on_delete=models.CASCADE,
        related_name='contrats'
    )
    reference = models.CharField(max_length=50, unique=True, editable=False)
    type_contrat = models.CharField(max_length=15, choices=TYPE_CHOICES)
    date_debut = models.DateField()
    date_fin = models.DateField(blank=True, null=True)
    salaire = models.DecimalField(max_digits=12, decimal_places=2)
    avantages = models.TextField(blank=True, null=True, help_text="Prime transport, logement, etc.")
    document = models.FileField(upload_to='rh/contrats/', blank=True, null=True)
    statut = models.CharField(max_length=15, choices=STATUT_CHOICES, default='ACTIF')
    notes = models.TextField(blank=True, null=True)
    date_creation = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.reference:
            self.reference = f"CTR-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.reference} - {self.employe.user.username} ({self.get_type_contrat_display()})"

    class Meta:
        ordering = ['-date_debut']
        verbose_name = "Contrat de travail"
        verbose_name_plural = "Contrats de travail"


# ========================================
# DEMANDE DE CONGÉ
# ========================================
class DemandeConge(models.Model):
    TYPE_CONGE_CHOICES = [
        ('ANNUEL', 'Congé annuel'),
        ('MALADIE', 'Congé maladie'),
        ('MATERNITE', 'Congé maternité'),
        ('PATERNITE', 'Congé paternité'),
        ('SANS_SOLDE', 'Congé sans solde'),
        ('EXCEPTIONNEL', 'Congé exceptionnel'),
        ('FORMATION', 'Congé de formation'),
    ]

    STATUT_CHOICES = [
        ('EN_ATTENTE', 'En attente'),
        ('APPROUVE', 'Approuvé'),
        ('REFUSE', 'Refusé'),
        ('ANNULE', 'Annulé'),
    ]

    employe = models.ForeignKey(
        Employe,
        on_delete=models.CASCADE,
        related_name='demandes_conges'
    )
    type_conge = models.CharField(max_length=20, choices=TYPE_CONGE_CHOICES)
    date_debut = models.DateField()
    date_fin = models.DateField()
    nombre_jours = models.PositiveIntegerField()
    motif = models.TextField()
    justificatif = models.FileField(upload_to='rh/conges/', blank=True, null=True)

    statut = models.CharField(max_length=15, choices=STATUT_CHOICES, default='EN_ATTENTE')
    approuve_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='conges_approuves'
    )
    date_decision = models.DateTimeField(blank=True, null=True)
    commentaire_decision = models.TextField(blank=True, null=True)

    date_demande = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.employe.user.username} - {self.get_type_conge_display()} ({self.get_statut_display()})"

    class Meta:
        ordering = ['-date_demande']
        verbose_name = "Demande de congé"
        verbose_name_plural = "Demandes de congés"


# ========================================
# PRÉSENCE
# ========================================
class Presence(models.Model):
    STATUT_CHOICES = [
        ('PRESENT', 'Présent'),
        ('ABSENT', 'Absent'),
        ('RETARD', 'Retard'),
        ('CONGE', 'En congé'),
        ('MISSION', 'En mission'),
        ('MALADIE', 'Maladie'),
    ]

    employe = models.ForeignKey(
        Employe,
        on_delete=models.CASCADE,
        related_name='presences'
    )
    date = models.DateField()
    heure_arrivee = models.TimeField(blank=True, null=True)
    heure_depart = models.TimeField(blank=True, null=True)
    statut = models.CharField(max_length=15, choices=STATUT_CHOICES, default='PRESENT')
    commentaire = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-date', 'employe']
        unique_together = ['employe', 'date']
        verbose_name = "Présence"
        verbose_name_plural = "Présences"

    def __str__(self):
        return f"{self.employe.user.username} - {self.date} ({self.get_statut_display()})"


# ========================================
# FICHE DE PAIE
# ========================================
class FichePaie(models.Model):
    MOIS_CHOICES = [
        (1, 'Janvier'), (2, 'Février'), (3, 'Mars'),
        (4, 'Avril'), (5, 'Mai'), (6, 'Juin'),
        (7, 'Juillet'), (8, 'Août'), (9, 'Septembre'),
        (10, 'Octobre'), (11, 'Novembre'), (12, 'Décembre'),
    ]

    STATUT_CHOICES = [
        ('BROUILLON', 'Brouillon'),
        ('VALIDEE', 'Validée'),
        ('PAYEE', 'Payée'),
    ]

    reference = models.CharField(max_length=50, unique=True, editable=False)
    employe = models.ForeignKey(
        Employe,
        on_delete=models.CASCADE,
        related_name='fiches_paie'
    )
    mois = models.PositiveSmallIntegerField(choices=MOIS_CHOICES)
    annee = models.PositiveIntegerField()

    salaire_brut = models.DecimalField(max_digits=12, decimal_places=2)
    prime_transport = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    prime_logement = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    prime_risque = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    autres_primes = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    heures_supplementaires = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    cotisation_cnps = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    impot_irpp = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    autres_deductions = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    salaire_net = models.DecimalField(max_digits=12, decimal_places=2, editable=False, default=0)

    statut = models.CharField(max_length=15, choices=STATUT_CHOICES, default='BROUILLON')
    document = models.FileField(upload_to='rh/fiches_paie/', blank=True, null=True)

    date_generation = models.DateTimeField(auto_now_add=True)
    payee_le = models.DateField(blank=True, null=True)

    def save(self, *args, **kwargs):
        if not self.reference:
            self.reference = f"PAY-{uuid.uuid4().hex[:8].upper()}"

        # Calcul automatique du salaire net
        total_brut = (
            self.salaire_brut +
            self.prime_transport +
            self.prime_logement +
            self.prime_risque +
            self.autres_primes +
            self.heures_supplementaires
        )
        total_deductions = (
            self.cotisation_cnps +
            self.impot_irpp +
            self.autres_deductions
        )
        self.salaire_net = total_brut - total_deductions

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.reference} - {self.employe.user.username} ({self.get_mois_display()} {self.annee})"

    class Meta:
        ordering = ['-annee', '-mois']
        unique_together = ['employe', 'mois', 'annee']
        verbose_name = "Fiche de paie"
        verbose_name_plural = "Fiches de paie"