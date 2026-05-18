# Create your models here.
from django.db import models
from django.conf import settings
from django.utils.text import slugify
import uuid
import os
from django.core.validators import FileExtensionValidator


image = models.ImageField(
    upload_to='photos/',
    validators=[FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png', 'webp'])],
)


def media_upload_path(instance, filename):
    """Organise les fichiers par type dans des sous-dossiers."""
    ext = filename.split('.')[-1].lower()
    nouveau_nom = f"{uuid.uuid4().hex[:10]}.{ext}"

    if ext in ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']:
        return f"content/images/{nouveau_nom}"
    elif ext in ['mp4', 'avi', 'mov', 'mkv', 'webm']:
        return f"content/videos/{nouveau_nom}"
    elif ext in ['mp3', 'wav', 'ogg', 'flac']:
        return f"content/audio/{nouveau_nom}"
    else:
        return f"content/documents/{nouveau_nom}"


# ========================================
# CATÉGORIE DE CONTENU
# ========================================
class CategorieContenu(models.Model):
    nom = models.CharField(max_length=100)
    slug = models.SlugField(max_length=120, unique=True, blank=True)
    description = models.TextField(blank=True, null=True)
    icone = models.CharField(max_length=50, blank=True, null=True, help_text="Emoji ou classe d'icône")
    ordre = models.PositiveIntegerField(default=0)
    est_active = models.BooleanField(default=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.nom)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.nom

    class Meta:
        ordering = ['ordre', 'nom']
        verbose_name = "Catégorie de contenu"
        verbose_name_plural = "Catégories de contenu"


# ========================================
# PAGE DE CONTENU
# ========================================
class PageContenu(models.Model):
    STATUT_CHOICES = [
        ('BROUILLON', 'Brouillon'),
        ('PUBLIEE', 'Publiée'),
        ('ARCHIVEE', 'Archivée'),
    ]

    titre_fr = models.CharField(max_length=255)
    titre_en = models.CharField(max_length=255, blank=True, null=True)
    slug = models.SlugField(max_length=280, unique=True, blank=True)

    categorie = models.ForeignKey(
        CategorieContenu,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='pages'
    )

    contenu_fr = models.TextField()
    contenu_en = models.TextField(blank=True, null=True)

    extrait_fr = models.TextField(blank=True, null=True, help_text="Résumé court pour les listes")
    extrait_en = models.TextField(blank=True, null=True)

    image_couverture = models.ImageField(upload_to='content/pages/', blank=True, null=True)

    statut = models.CharField(max_length=15, choices=STATUT_CHOICES, default='BROUILLON')
    est_mise_en_avant = models.BooleanField(default=False)
    ordre = models.PositiveIntegerField(default=0)

    meta_description_fr = models.CharField(max_length=300, blank=True, null=True)
    meta_description_en = models.CharField(max_length=300, blank=True, null=True)

    auteur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='pages_creees'
    )

    date_publication = models.DateTimeField(blank=True, null=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.titre_fr)
            # Éviter les doublons
            if PageContenu.objects.filter(slug=self.slug).exists():
                self.slug = f"{self.slug}-{uuid.uuid4().hex[:4]}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.titre_fr} ({self.get_statut_display()})"

    class Meta:
        ordering = ['ordre', '-date_publication', '-date_creation']
        verbose_name = "Page de contenu"
        verbose_name_plural = "Pages de contenu"


# ========================================
# DOCUMENT INTERNE
# ========================================
class DocumentInterne(models.Model):
    TYPE_CHOICES = [
        ('PROCEDURE', 'Procédure'),
        ('FORMULAIRE', 'Formulaire'),
        ('RAPPORT', 'Rapport'),
        ('CONTRAT_TYPE', 'Contrat type'),
        ('POLITIQUE', 'Politique interne'),
        ('FORMATION', 'Support de formation'),
        ('COMMUNICATION', 'Communication interne'),
        ('AUTRE', 'Autre'),
    ]

    VISIBILITE_CHOICES = [
        ('TOUS', 'Tous les employés'),
        ('ADMIN_DIR', 'Administrateurs et Direction'),
        ('RH', 'Ressources Humaines'),
        ('FINANCE', 'Finance et Comptabilité'),
        ('LOGISTIQUE', 'Logistique'),
        ('COMMERCIAL', 'Commerciaux'),
    ]

    titre = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    type_document = models.CharField(max_length=20, choices=TYPE_CHOICES, default='AUTRE')
    visibilite = models.CharField(max_length=20, choices=VISIBILITE_CHOICES, default='TOUS')

    fichier = models.FileField(upload_to='content/documents_internes/')
    taille_fichier = models.PositiveIntegerField(editable=False, default=0, help_text="Taille en octets")
    extension = models.CharField(max_length=10, editable=False, blank=True)

    version = models.CharField(max_length=20, default='1.0')
    est_actif = models.BooleanField(default=True)

    uploade_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='documents_uploades'
    )

    date_upload = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if self.fichier:
            self.taille_fichier = self.fichier.size
            self.extension = os.path.splitext(self.fichier.name)[1].lower().replace('.', '')
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.titre} ({self.get_type_document_display()}) v{self.version}"

    class Meta:
        ordering = ['-date_upload']
        verbose_name = "Document interne"
        verbose_name_plural = "Documents internes"


# ========================================
# FICHIER MÉDIA
# ========================================
class MediaFile(models.Model):
    TYPE_CHOICES = [
        ('IMAGE', 'Image'),
        ('VIDEO', 'Vidéo'),
        ('AUDIO', 'Audio'),
        ('DOCUMENT', 'Document'),
        ('AUTRE', 'Autre'),
    ]

    nom = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    type_media = models.CharField(max_length=15, choices=TYPE_CHOICES, default='IMAGE')
    fichier = models.FileField(upload_to=media_upload_path)
    miniature = models.ImageField(upload_to='content/miniatures/', blank=True, null=True)

    taille_fichier = models.PositiveIntegerField(editable=False, default=0)
    extension = models.CharField(max_length=10, editable=False, blank=True)
    largeur = models.PositiveIntegerField(blank=True, null=True, help_text="Pour les images")
    hauteur = models.PositiveIntegerField(blank=True, null=True, help_text="Pour les images")

    tags = models.CharField(max_length=255, blank=True, null=True, help_text="Tags séparés par des virgules")
    est_public = models.BooleanField(default=True)

    uploade_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='medias_uploades'
    )

    date_upload = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self.fichier:
            self.taille_fichier = self.fichier.size
            self.extension = os.path.splitext(self.fichier.name)[1].lower().replace('.', '')

            # Détection automatique du type
            if self.extension in ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']:
                self.type_media = 'IMAGE'
            elif self.extension in ['mp4', 'avi', 'mov', 'mkv', 'webm']:
                self.type_media = 'VIDEO'
            elif self.extension in ['mp3', 'wav', 'ogg', 'flac']:
                self.type_media = 'AUDIO'
            elif self.extension in ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv']:
                self.type_media = 'DOCUMENT'

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.nom} ({self.get_type_media_display()})"

    class Meta:
        ordering = ['-date_upload']
        verbose_name = "Fichier média"
        verbose_name_plural = "Fichiers médias"


# ========================================
# FAQ (Foire Aux Questions)
# ========================================
class FAQ(models.Model):
    question_fr = models.CharField(max_length=500)
    question_en = models.CharField(max_length=500, blank=True, null=True)
    reponse_fr = models.TextField()
    reponse_en = models.TextField(blank=True, null=True)

    categorie = models.ForeignKey(
        CategorieContenu,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='faqs'
    )

    ordre = models.PositiveIntegerField(default=0)
    est_visible = models.BooleanField(default=True)
    date_creation = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.question_fr[:80]

    class Meta:
        ordering = ['ordre', 'id']
        verbose_name = "FAQ"
        verbose_name_plural = "FAQs"