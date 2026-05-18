from rest_framework import serializers
from .models import (
    Departement,
    Employe,
    ContratTravail,
    DemandeConge,
    Presence,
    FichePaie
)


# ========================================
# DÉPARTEMENT
# ========================================
class DepartementSerializer(serializers.ModelSerializer):
    responsable_nom = serializers.CharField(
        source='responsable.username', read_only=True
    )
    nombre_employes = serializers.SerializerMethodField()

    class Meta:
        model = Departement
        fields = [
            'id', 'nom', 'description', 'responsable',
            'responsable_nom', 'nombre_employes', 'est_actif'
        ]

    def get_nombre_employes(self, obj):
        return obj.employes.filter(est_actif=True).count()


# ========================================
# EMPLOYÉ
# ========================================
class EmployeSerializer(serializers.ModelSerializer):
    nom_complet_affiche = serializers.SerializerMethodField()
    username = serializers.CharField(source='user.username', read_only=True)
    email_compte = serializers.CharField(source='user.email', read_only=True)
    role = serializers.CharField(source='user.role', read_only=True)
    role_display = serializers.CharField(source='user.get_role_display', read_only=True)
    departement_nom = serializers.CharField(source='departement.nom', read_only=True)
    type_contrat_display = serializers.CharField(source='get_type_contrat_display', read_only=True)
    genre_display = serializers.CharField(source='get_genre_display', read_only=True)
    statut_marital_display = serializers.SerializerMethodField()
    niveau_etude_display = serializers.SerializerMethodField()
    photo_url = serializers.SerializerMethodField()
    age = serializers.IntegerField(read_only=True)

    class Meta:
        model = Employe
        fields = [
            'id', 'matricule', 'user', 'username', 'email_compte',
            'nom_complet', 'nom_complet_affiche',
            'role', 'role_display',
            'genre', 'genre_display',
            'date_naissance', 'age', 'lieu_naissance', 'nationalite',
            'statut_marital', 'statut_marital_display',
            'niveau_etude', 'niveau_etude_display',
            'email_personnel', 'telephone_personnel',
            'ville', 'pays_residence', 'adresse',
            'poste', 'departement', 'departement_nom',
            'type_contrat', 'type_contrat_display',
            'date_embauche', 'date_fin_contrat',
            'salaire_base',
            'contact_urgence_nom', 'contact_urgence_telephone',
            'photo', 'photo_url', 'cv',
            'est_actif'
        ]
        read_only_fields = ['matricule']
        extra_kwargs = {
            'photo': {'required': False},
            'cv': {'required': False},
            'nom_complet': {'required': False},
            'email_personnel': {'required': False, 'allow_null': True, 'allow_blank': True},
            'statut_marital': {'required': False, 'allow_null': True, 'allow_blank': True},
            'niveau_etude': {'required': False, 'allow_null': True, 'allow_blank': True},
            'date_naissance': {'required': False, 'allow_null': True},
            'lieu_naissance': {'required': False, 'allow_blank': True},
            'nationalite': {'required': False, 'allow_blank': True},
            'telephone_personnel': {'required': False, 'allow_blank': True},
            'ville': {'required': False, 'allow_blank': True},
            'pays_residence': {'required': False, 'allow_blank': True},
            'adresse': {'required': False, 'allow_blank': True},
            'contact_urgence_nom': {'required': False, 'allow_blank': True},
            'contact_urgence_telephone': {'required': False, 'allow_blank': True},
            'date_fin_contrat': {'required': False, 'allow_null': True},
            'departement': {'required': False, 'allow_null': True},
        }

    def get_nom_complet_affiche(self, obj):
        return obj.nom_affiche

    def get_statut_marital_display(self, obj):
        return obj.get_statut_marital_display() if obj.statut_marital else None

    def get_niveau_etude_display(self, obj):
        return obj.get_niveau_etude_display() if obj.niveau_etude else None

    def get_photo_url(self, obj):
        request = self.context.get('request')
        if obj.photo and request:
            return request.build_absolute_uri(obj.photo.url)
        return None


# ========================================
# EMPLOYÉ RÉSUMÉ (pour listes)
# ========================================
class EmployeResumeSerializer(serializers.ModelSerializer):
    nom_complet_affiche = serializers.SerializerMethodField()
    departement_nom = serializers.CharField(source='departement.nom', read_only=True)
    age = serializers.IntegerField(read_only=True)

    class Meta:
        model = Employe
        fields = [
            'id', 'matricule', 'nom_complet_affiche',
            'poste', 'departement_nom',
            'telephone_personnel', 'email_personnel',
            'age', 'est_actif'
        ]

    def get_nom_complet_affiche(self, obj):
        return obj.nom_affiche

    def get_age(self, obj):
        return obj.age


# ========================================
# CONTRAT DE TRAVAIL
# ========================================
class ContratTravailSerializer(serializers.ModelSerializer):
    employe_nom = serializers.SerializerMethodField()
    type_display = serializers.CharField(source='get_type_contrat_display', read_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)

    class Meta:
        model = ContratTravail
        fields = [
            'id', 'reference', 'employe', 'employe_nom',
            'type_contrat', 'type_display',
            'date_debut', 'date_fin', 'salaire', 'avantages',
            'document', 'statut', 'statut_display', 'notes'
        ]
        read_only_fields = ['reference']

    def get_employe_nom(self, obj):
        full = obj.employe.user.get_full_name()
        return full if full else obj.employe.user.username


# ========================================
# DEMANDE DE CONGÉ
# ========================================
class DemandeCongeSerializer(serializers.ModelSerializer):
    employe_nom = serializers.SerializerMethodField()
    type_display = serializers.CharField(source='get_type_conge_display', read_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    approuve_par_nom = serializers.CharField(
        source='approuve_par.username', read_only=True
    )

    class Meta:
        model = DemandeConge
        fields = [
            'id', 'employe', 'employe_nom',
            'type_conge', 'type_display',
            'date_debut', 'date_fin', 'nombre_jours', 'motif',
            'justificatif',
            'statut', 'statut_display',
            'approuve_par', 'approuve_par_nom',
            'date_decision', 'commentaire_decision',
            'date_demande'
        ]
        read_only_fields = ['approuve_par', 'date_decision']

    def get_employe_nom(self, obj):
        full = obj.employe.user.get_full_name()
        return full if full else obj.employe.user.username


# ========================================
# PRÉSENCE
# ========================================
class PresenceSerializer(serializers.ModelSerializer):
    employe_nom = serializers.SerializerMethodField()
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)

    class Meta:
        model = Presence
        fields = [
            'id', 'employe', 'employe_nom',
            'date', 'heure_arrivee', 'heure_depart',
            'statut', 'statut_display', 'commentaire'
        ]

    def get_employe_nom(self, obj):
        full = obj.employe.user.get_full_name()
        return full if full else obj.employe.user.username


# ========================================
# FICHE DE PAIE
# ========================================
class FichePaieSerializer(serializers.ModelSerializer):
    employe_nom = serializers.SerializerMethodField()
    mois_display = serializers.CharField(source='get_mois_display', read_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)

    class Meta:
        model = FichePaie
        fields = [
            'id', 'reference', 'employe', 'employe_nom',
            'mois', 'mois_display', 'annee',
            'salaire_brut',
            'prime_transport', 'prime_logement',
            'prime_risque', 'autres_primes',
            'heures_supplementaires',
            'cotisation_cnps', 'impot_irpp', 'autres_deductions',
            'salaire_net',
            'statut', 'statut_display',
            'document', 'payee_le', 'date_generation'
        ]
        read_only_fields = ['reference', 'salaire_net']

    def get_employe_nom(self, obj):
        full = obj.employe.user.get_full_name()
        return full if full else obj.employe.user.username