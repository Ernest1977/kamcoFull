# Create your models here.
from django.db import models
from django.conf import settings
import uuid


# ========================================
# LOG D'ACTIVITÉ
# ========================================
class LogActivite(models.Model):
    ACTION_CHOICES = [
        ('CONNEXION', 'Connexion'),
        ('DECONNEXION', 'Déconnexion'),
        ('CREATION', 'Création'),
        ('MODIFICATION', 'Modification'),
        ('SUPPRESSION', 'Suppression'),
        ('CONSULTATION', 'Consultation'),
        ('EXPORT', 'Export de données'),
        ('IMPORT', 'Import de données'),
        ('APPROBATION', 'Approbation'),
        ('REJET', 'Rejet'),
        ('ERREUR', 'Erreur système'),
        ('AUTRE', 'Autre'),
    ]

    MODULE_CHOICES = [
        ('PRODUITS', 'Produits'),
        ('SUPPLYCHAIN', 'Supply Chain'),
        ('FINANCE', 'Finance'),
        ('RH', 'Ressources Humaines'),
        ('MARKETING', 'Marketing'),
        ('CONTENT', 'Contenu'),
        ('GALLERY', 'Galerie'),
        ('PARTNERS', 'Partenaires'),
        ('BLOG', 'Blog'),
        ('STATISTICS', 'Statistiques'),
        ('TESTIMONIALS', 'Témoignages'),
        ('ACCOUNTS', 'Comptes utilisateurs'),
        ('ADMINISTRATION', 'Administration'),
        ('AUTH', 'Authentification'),
        ('SYSTEME', 'Système'),
    ]

    SEVERITE_CHOICES = [
        ('INFO', 'Information'),
        ('WARNING', 'Avertissement'),
        ('ERROR', 'Erreur'),
        ('CRITICAL', 'Critique'),
    ]

    utilisateur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='logs_activite'
    )
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    module = models.CharField(max_length=20, choices=MODULE_CHOICES)
    severite = models.CharField(max_length=10, choices=SEVERITE_CHOICES, default='INFO')

    description = models.TextField()
    objet_type = models.CharField(
        max_length=100, blank=True, null=True,
        help_text="Type d'objet concerné (ex: Facture, Commande)"
    )
    objet_id = models.PositiveIntegerField(
        blank=True, null=True,
        help_text="ID de l'objet concerné"
    )
    objet_representation = models.CharField(
        max_length=255, blank=True, null=True,
        help_text="Représentation textuelle de l'objet"
    )

    donnees_avant = models.JSONField(blank=True, null=True, help_text="État avant modification")
    donnees_apres = models.JSONField(blank=True, null=True, help_text="État après modification")

    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True, null=True)

    date_action = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        user = self.utilisateur.username if self.utilisateur else 'Système'
        return f"[{self.get_severite_display()}] {user} - {self.get_action_display()} ({self.get_module_display()})"

    class Meta:
        ordering = ['-date_action']
        verbose_name = "Log d'activité"
        verbose_name_plural = "Logs d'activité"
        indexes = [
            models.Index(fields=['-date_action']),
            models.Index(fields=['utilisateur', '-date_action']),
            models.Index(fields=['module', '-date_action']),
            models.Index(fields=['action', '-date_action']),
        ]


# ========================================
# NOTIFICATION
# ========================================
class Notification(models.Model):
    TYPE_CHOICES = [
        ('INFO', 'Information'),
        ('SUCCESS', 'Succès'),
        ('WARNING', 'Avertissement'),
        ('ERROR', 'Erreur'),
        ('TACHE', 'Tâche à faire'),
    ]

    PRIORITE_CHOICES = [
        ('BASSE', 'Basse'),
        ('NORMALE', 'Normale'),
        ('HAUTE', 'Haute'),
        ('URGENTE', 'Urgente'),
    ]

    destinataire = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    expediteur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='notifications_envoyees'
    )

    titre = models.CharField(max_length=255)
    message = models.TextField()
    type_notification = models.CharField(max_length=10, choices=TYPE_CHOICES, default='INFO')
    priorite = models.CharField(max_length=10, choices=PRIORITE_CHOICES, default='NORMALE')

    # Lien vers l'objet concerné
    lien_module = models.CharField(max_length=100, blank=True, null=True)
    lien_objet_id = models.PositiveIntegerField(blank=True, null=True)
    lien_url = models.CharField(max_length=500, blank=True, null=True, help_text="URL vers la ressource")

    est_lue = models.BooleanField(default=False)
    date_lecture = models.DateTimeField(blank=True, null=True)

    date_creation = models.DateTimeField(auto_now_add=True)
    date_expiration = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        status = "🔵" if not self.est_lue else "✅"
        return f"{status} {self.destinataire.username} - {self.titre}"

    class Meta:
        ordering = ['-date_creation']
        verbose_name = "Notification"
        verbose_name_plural = "Notifications"
        indexes = [
            models.Index(fields=['destinataire', '-date_creation']),
            models.Index(fields=['destinataire', 'est_lue']),
        ]


# ========================================
# ANNONCE INTERNE
# ========================================
class AnnonceInterne(models.Model):
    DESTINATAIRE_CHOICES = [
        ('TOUS', 'Tous les employés'),
        ('ADMIN', 'Administrateurs'),
        ('DIR', 'Direction'),
        ('RH', 'Ressources Humaines'),
        ('COMPTA', 'Comptabilité'),
        ('COMM', 'Commerciaux'),
        ('LOG', 'Logistique'),
        ('AGRI', 'Agents terrain'),
    ]

    PRIORITE_CHOICES = [
        ('NORMALE', 'Normale'),
        ('IMPORTANTE', 'Importante'),
        ('URGENTE', 'Urgente'),
    ]

    titre = models.CharField(max_length=255)
    contenu = models.TextField()
    priorite = models.CharField(max_length=15, choices=PRIORITE_CHOICES, default='NORMALE')
    destinataires = models.CharField(max_length=10, choices=DESTINATAIRE_CHOICES, default='TOUS')

    image = models.ImageField(upload_to='administration/annonces/', blank=True, null=True)
    piece_jointe = models.FileField(upload_to='administration/annonces/pj/', blank=True, null=True)

    est_active = models.BooleanField(default=True)
    est_epinglee = models.BooleanField(default=False)

    publiee_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='annonces_publiees'
    )

    date_publication = models.DateTimeField(auto_now_add=True)
    date_expiration = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return f"{'📌' if self.est_epinglee else '📢'} {self.titre}"

    class Meta:
        ordering = ['-est_epinglee', '-date_publication']
        verbose_name = "Annonce interne"
        verbose_name_plural = "Annonces internes"


# ========================================
# PARAMÈTRE GLOBAL
# ========================================
class ParametreGlobal(models.Model):
    TYPE_CHOICES = [
        ('TEXTE', 'Texte'),
        ('NOMBRE', 'Nombre'),
        ('BOOLEEN', 'Booléen'),
        ('EMAIL', 'Email'),
        ('URL', 'URL'),
        ('JSON', 'JSON'),
    ]

    CATEGORIE_CHOICES = [
        ('GENERAL', 'Général'),
        ('ENTREPRISE', 'Informations entreprise'),
        ('FINANCE', 'Finance'),
        ('RH', 'Ressources Humaines'),
        ('MARKETING', 'Marketing'),
        ('NOTIFICATIONS', 'Notifications'),
        ('SECURITE', 'Sécurité'),
        ('SYSTEME', 'Système'),
    ]

    cle = models.CharField(max_length=100, unique=True)
    valeur = models.TextField()
    type_valeur = models.CharField(max_length=10, choices=TYPE_CHOICES, default='TEXTE')
    categorie = models.CharField(max_length=20, choices=CATEGORIE_CHOICES, default='GENERAL')

    label = models.CharField(max_length=200, help_text="Nom lisible du paramètre")
    description = models.TextField(blank=True, null=True)

    est_modifiable = models.BooleanField(default=True)
    est_visible = models.BooleanField(default=True)

    modifie_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='parametres_modifies'
    )
    date_modification = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.label} = {self.valeur[:50]}"

    class Meta:
        ordering = ['categorie', 'cle']
        verbose_name = "Paramètre global"
        verbose_name_plural = "Paramètres globaux"


# ========================================
# TÂCHE INTERNE
# ========================================
class TacheInterne(models.Model):
    STATUT_CHOICES = [
        ('A_FAIRE', 'À faire'),
        ('EN_COURS', 'En cours'),
        ('EN_ATTENTE', 'En attente'),
        ('TERMINEE', 'Terminée'),
        ('ANNULEE', 'Annulée'),
    ]

    PRIORITE_CHOICES = [
        ('BASSE', 'Basse'),
        ('NORMALE', 'Normale'),
        ('HAUTE', 'Haute'),
        ('URGENTE', 'Urgente'),
    ]

    titre = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)

    statut = models.CharField(max_length=15, choices=STATUT_CHOICES, default='A_FAIRE')
    priorite = models.CharField(max_length=10, choices=PRIORITE_CHOICES, default='NORMALE')

    assignee_a = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='taches_assignees'
    )
    creee_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='taches_creees'
    )

    date_echeance = models.DateField(blank=True, null=True)
    date_debut = models.DateField(blank=True, null=True)
    date_fin = models.DateField(blank=True, null=True)

    module_lie = models.CharField(max_length=100, blank=True, null=True)
    commentaire = models.TextField(blank=True, null=True)

    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.titre} ({self.get_statut_display()}) - {self.assignee_a}"

    class Meta:
        ordering = ['-priorite', 'date_echeance', '-date_creation']
        verbose_name = "Tâche interne"
        verbose_name_plural = "Tâches internes"


# ========================================
# HISTORIQUE DES MODIFICATIONS
# ========================================
class HistoriqueModification(models.Model):
    ACTION_CHOICES = [
        ('CREATION', 'Création'),
        ('MODIFICATION', 'Modification'),
        ('SUPPRESSION', 'Suppression'),
    ]

    utilisateur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='modifications_effectuees'
    )
    action = models.CharField(max_length=15, choices=ACTION_CHOICES)
    module = models.CharField(max_length=100, help_text="App/Modèle concerné")
    objet_type = models.CharField(max_length=100, help_text="Type de l'objet modifié")
    objet_id = models.PositiveIntegerField(help_text="ID de l'objet modifié")
    objet_representation = models.CharField(max_length=500, blank=True, null=True)

    champs_modifies = models.JSONField(
        blank=True, null=True,
        help_text="Liste des champs modifiés avec anciennes et nouvelles valeurs"
    )
    resume = models.TextField(blank=True, null=True, help_text="Résumé lisible de la modification")

    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True, null=True)

    date_modification = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        user = self.utilisateur.username if self.utilisateur else 'Système'
        return f"[{self.get_action_display()}] {user} — {self.objet_type} #{self.objet_id}"

    class Meta:
        ordering = ['-date_modification']
        verbose_name = "Historique de modification"
        verbose_name_plural = "Historique des modifications"
        indexes = [
            models.Index(fields=['-date_modification']),
            models.Index(fields=['objet_type', 'objet_id']),
            models.Index(fields=['utilisateur', '-date_modification']),
        ]


# Dans chaque modèle avec FileField/ImageField
from django.core.validators import FileExtensionValidator

image = models.ImageField(
    upload_to='photos/',
    validators=[FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png', 'webp'])],
)



# ========================================
# RGPD — CONSENTEMENT & POLITIQUE
# ========================================
class ConsentementRGPD(models.Model):
    TYPE_CHOICES = [
        ('COOKIES', 'Cookies'),
        ('NEWSLETTER', 'Newsletter'),
        ('DONNEES_PERSONNELLES', 'Traitement données personnelles'),
        ('MARKETING', 'Communications marketing'),
        ('ANALYTICS', 'Statistiques et analytics'),
        ('TIERS', 'Partage avec des tiers'),
    ]

    utilisateur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True, blank=True,
        related_name='consentements_rgpd'
    )
    email = models.EmailField(blank=True, null=True, help_text="Pour les visiteurs non connectés")
    ip_address = models.GenericIPAddressField(blank=True, null=True)

    type_consentement = models.CharField(max_length=25, choices=TYPE_CHOICES)
    accepte = models.BooleanField(default=False)
    version_politique = models.CharField(max_length=20, default='1.0')

    date_consentement = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    date_retrait = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        user = self.utilisateur.username if self.utilisateur else self.email or self.ip_address
        return f"{user} — {self.get_type_consentement_display()} : {'✅' if self.accepte else '❌'}"

    class Meta:
        ordering = ['-date_consentement']
        verbose_name = "Consentement RGPD"
        verbose_name_plural = "Consentements RGPD"


class DemandeRGPD(models.Model):
    TYPE_CHOICES = [
        ('ACCES', 'Droit d\'accès'),
        ('RECTIFICATION', 'Droit de rectification'),
        ('SUPPRESSION', 'Droit à l\'effacement'),
        ('PORTABILITE', 'Droit à la portabilité'),
        ('OPPOSITION', 'Droit d\'opposition'),
        ('LIMITATION', 'Droit à la limitation'),
    ]

    STATUT_CHOICES = [
        ('EN_ATTENTE', 'En attente de traitement'),
        ('EN_COURS', 'En cours de traitement'),
        ('TRAITE', 'Traité'),
        ('REFUSE', 'Refusé'),
    ]

    demandeur_nom = models.CharField(max_length=255)
    demandeur_email = models.EmailField()
    type_demande = models.CharField(max_length=15, choices=TYPE_CHOICES)
    description = models.TextField()
    statut = models.CharField(max_length=15, choices=STATUT_CHOICES, default='EN_ATTENTE')

    reponse = models.TextField(blank=True, null=True)
    traite_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='demandes_rgpd_traitees'
    )

    date_demande = models.DateTimeField(auto_now_add=True)
    date_traitement = models.DateTimeField(blank=True, null=True)
    date_limite = models.DateField(
        blank=True, null=True,
        help_text="30 jours max selon RGPD"
    )

    def __str__(self):
        return f"{self.demandeur_nom} — {self.get_type_demande_display()} ({self.get_statut_display()})"

    class Meta:
        ordering = ['-date_demande']
        verbose_name = "Demande RGPD"
        verbose_name_plural = "Demandes RGPD"