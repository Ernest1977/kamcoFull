from rest_framework import viewsets, status
from django.http import HttpResponse
from rest_framework import serializers as drf_serializers
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from django.utils import timezone
from django.db.models import Sum, Count, Q, Avg
from datetime import date, timedelta
from decimal import Decimal
import logging
from administration.mixins import TrackingMixin
from accounts.permissions import IsLogistique, IsAdminOrDirector, IsCommercialeOuLogistique
from drf_spectacular.utils import extend_schema, extend_schema_view

from .models import (
    ReservationEquipement,
    ContratLocation,
    EtatDesLieux,
    CautionLocation,
    ServiceAnnexe,
    FacturationLocation,
    LigneFacturationLocation,
    PaiementLocation
)

from .serializers import (
    ReservationEquipementSerializer,
    ReservationResumeSerializer,
    ContratLocationSerializer,
    ContratLocationResumeSerializer,
    EtatDesLieuxSerializer,
    CautionLocationSerializer,
    ServiceAnnexeSerializer,
    FacturationLocationSerializer,
    FacturationResumeSerializer,
    LigneFacturationLocationSerializer,
    PaiementLocationSerializer,
    CreerContratDepuisReservationSerializer,
    GenererFactureContratSerializer
)

logger = logging.getLogger(__name__)


# ========================================
# UTILITAIRES SÉCURISÉS
# ========================================
def safe_log(utilisateur, action, module, description, **kwargs):
    try:
        from administration.views import creer_log
        creer_log(utilisateur=utilisateur, action=action, module=module, description=description, **kwargs)
    except Exception as e:
        logger.warning(f"Log impossible: {e}")


def safe_notification(destinataire, titre, message, **kwargs):
    try:
        from administration.views import creer_notification
        creer_notification(destinataire=destinataire, titre=titre, message=message, **kwargs)
    except Exception as e:
        logger.warning(f"Notification impossible: {e}")


def notifier_logisticiens(titre, message, **kwargs):
    try:
        from django.contrib.auth import get_user_model
        User = get_user_model()
        users = User.objects.filter(role__in=['ADMIN', 'DIR', 'LOG', 'COMM'], is_active=True)
        for user in users:
            safe_notification(destinataire=user, titre=titre, message=message, **kwargs)
    except Exception as e:
        logger.warning(f"Notification logisticiens impossible: {e}")


# ========================================
# RÉSERVATION
# ========================================

@extend_schema_view(
    list=extend_schema(tags=['Location'], summary='Liste des réservations'),
    retrieve=extend_schema(tags=['Location'], summary='Détail d\'une réservation'),
    create=extend_schema(tags=['Location'], summary='Créer une réservation'),
)

class ReservationEquipementViewSet(TrackingMixin, viewsets.ModelViewSet):
    """
    CRUD Réservations d'équipements.
    Accessible par : ADMIN, DIR, LOG, COMM
    """
    queryset = ReservationEquipement.objects.all()
    permission_classes = [IsCommercialeOuLogistique]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_serializer_class(self):
        if self.action == 'list':
            return ReservationResumeSerializer
        return ReservationEquipementSerializer

    def get_queryset(self):
        qs = ReservationEquipement.objects.select_related('equipement', 'creee_par').all()

        statut = self.request.query_params.get('statut')
        equipement = self.request.query_params.get('equipement')
        client = self.request.query_params.get('client')
        date_debut = self.request.query_params.get('date_debut')
        date_fin = self.request.query_params.get('date_fin')
        recherche = self.request.query_params.get('q')

        if statut:
            qs = qs.filter(statut=statut.upper())
        if equipement:
            qs = qs.filter(equipement__id=equipement)
        if client:
            qs = qs.filter(
                Q(client_nom__icontains=client) |
                Q(client_entreprise__icontains=client)
            )
        if date_debut:
            qs = qs.filter(date_debut_prevue__gte=date_debut)
        if date_fin:
            qs = qs.filter(date_fin_prevue__lte=date_fin)
        if recherche:
            qs = qs.filter(
                Q(reference__icontains=recherche) |
                Q(client_nom__icontains=recherche) |
                Q(equipement__nom__icontains=recherche)
            )

        return qs

    def perform_create(self, serializer):
        reservation = serializer.save(creee_par=self.request.user)

        equipement = reservation.equipement

        # Vérifier disponibilité
        if equipement.statut != 'DISPONIBLE':
            raise drf_serializers.ValidationError(
                {"equipement": f"L'équipement {equipement.nom} n'est pas disponible."}
            )

        # Appliquer le tarif et la caution de l'équipement si non spécifiés
        updated = False

        if not reservation.tarif_applique or reservation.tarif_applique == 0:
            if reservation.mode_tarification == 'JOURNALIER':
                reservation.tarif_applique = equipement.tarif_journalier
            elif reservation.mode_tarification == 'HEBDOMADAIRE':
                reservation.tarif_applique = equipement.tarif_hebdomadaire
            elif reservation.mode_tarification == 'MENSUEL':
                reservation.tarif_applique = equipement.tarif_mensuel
            elif reservation.mode_tarification == 'HORAIRE':
                reservation.tarif_applique = equipement.tarif_horaire
            updated = True

        if not reservation.caution_requise or reservation.caution_requise == 0:
            reservation.caution_requise = equipement.caution_requise
            updated = True

        if updated:
            reservation.save()

        # Log et notification
        safe_log(
            utilisateur=self.request.user,
            action='CREATION',
            module='SUPPLYCHAIN',
            description=f"Réservation {reservation.reference} créée pour {equipement.nom}",
            objet_type='ReservationEquipement',
            objet_id=reservation.id,
            request=self.request
        )

        notifier_logisticiens(
            titre=f"📋 Nouvelle réservation : {equipement.nom}",
            message=(
                f"Réservation {reservation.reference}\n"
                f"Client : {reservation.client_nom}\n"
                f"Équipement : {equipement.reference} - {equipement.nom}\n"
                f"Période : {reservation.date_debut_prevue} → {reservation.date_fin_prevue}\n"
                f"Montant estimé : {reservation.montant_estime} {reservation.devise}"
            ),
            type_notification='INFO',
            priorite='NORMALE'
        )

    @action(detail=True, methods=['post'])
    def confirmer(self, request, pk=None):
        """Confirme une réservation et marque l'équipement comme réservé."""
        reservation = self.get_object()

        if reservation.statut != 'EN_ATTENTE':
            return Response(
                {"erreur": f"Impossible de confirmer une réservation en statut '{reservation.get_statut_display()}'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        reservation.statut = 'CONFIRMEE'
        reservation.save()

        # Marquer l'équipement comme réservé
        equipement = reservation.equipement
        equipement.statut = 'RESERVE'
        equipement.save(update_fields=['statut'])

        safe_log(
            utilisateur=request.user,
            action='MODIFICATION',
            module='SUPPLYCHAIN',
            description=f"Réservation {reservation.reference} confirmée",
            request=request
        )

        return Response(
            ReservationEquipementSerializer(reservation, context={'request': request}).data
        )

    @action(detail=True, methods=['post'])
    def annuler(self, request, pk=None):
        """Annule une réservation."""
        reservation = self.get_object()
        motif = request.data.get('motif', 'Annulation demandée')

        if reservation.statut in ['TERMINEE', 'ANNULEE']:
            return Response(
                {"erreur": "Cette réservation ne peut plus être annulée."},
                status=status.HTTP_400_BAD_REQUEST
            )

        reservation.statut = 'ANNULEE'
        reservation.motif_annulation = motif
        reservation.save()

        # Remettre l'équipement disponible si réservé
        equipement = reservation.equipement
        if equipement.statut == 'RESERVE':
            equipement.statut = 'DISPONIBLE'
            equipement.save(update_fields=['statut'])

        return Response(
            ReservationEquipementSerializer(reservation, context={'request': request}).data
        )

    @action(detail=True, methods=['post'])
    def creer_contrat(self, request, pk=None):
        reservation = self.get_object()

        if reservation.statut not in ['CONFIRMEE']:
            return Response(
                {"erreur": "La réservation doit être confirmée pour créer un contrat."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if hasattr(reservation, 'contrat') and reservation.contrat is not None:
            return Response(
                {"erreur": "Un contrat existe déjà pour cette réservation."},
                status=status.HTTP_400_BAD_REQUEST
            )

        equipement = reservation.equipement

        contrat = ContratLocation.objects.create(
            reservation=reservation,
            equipement=equipement,
            client_nom=reservation.client_nom,
            client_entreprise=reservation.client_entreprise,
            client_email=reservation.client_email,
            client_telephone=reservation.client_telephone,
            client_adresse=reservation.client_adresse or '',
            client_piece_identite=reservation.client_piece_identite or '',
            date_debut=reservation.date_debut_prevue,
            date_fin_prevue=reservation.date_fin_prevue,
            mode_tarification=reservation.mode_tarification,
            tarif_base=reservation.tarif_applique,
            montant_location_ht=reservation.montant_estime,
            heures_moteur_depart=equipement.heures_moteur,
            km_depart=equipement.kilometres,
            taux_tva=request.data.get('taux_tva', Decimal('19.25')),
            penalite_retard_par_jour=request.data.get('penalite_retard_par_jour', 0),
            option_achat_proposee=request.data.get('option_achat_proposee', False),
            prix_option_achat=request.data.get('prix_option_achat', 0),
            conditions_generales=request.data.get('conditions_generales', ''),
            creee_par=request.user
        )

        # CRÉER LA CAUTION AUTOMATIQUEMENT
        caution_montant = reservation.caution_requise
        if not caution_montant or caution_montant <= 0:
            # Prendre la caution de l'équipement si pas définie
            caution_montant = equipement.caution_requise

        if caution_montant and caution_montant > 0:
            CautionLocation.objects.create(
                contrat=contrat,
                montant_requis=caution_montant,
                devise=reservation.devise or 'FCFA',
                enregistree_par=request.user
            )

        # Mettre à jour le statut
        reservation.statut = 'EN_COURS'
        reservation.save()

        equipement.statut = 'EN_LOCATION'
        equipement.save(update_fields=['statut'])

        return Response(
            ContratLocationSerializer(contrat, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )


# ========================================
# CONTRAT DE LOCATION
# ========================================
class ContratLocationViewSet(TrackingMixin, viewsets.ModelViewSet):
    """
    CRUD Contrats de location.
    Accessible par : ADMIN, DIR, LOG, COMM
    """
    queryset = ContratLocation.objects.all()
    permission_classes = [IsCommercialeOuLogistique]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_serializer_class(self):
        if self.action == 'list':
            return ContratLocationResumeSerializer
        return ContratLocationSerializer

    def get_queryset(self):
        qs = ContratLocation.objects.select_related(
            'equipement', 'reservation', 'creee_par'
        ).prefetch_related(
            'etats_des_lieux', 'cautions', 'services_annexes', 'facturations'
        ).all()

        statut = self.request.query_params.get('statut')
        equipement = self.request.query_params.get('equipement')
        client = self.request.query_params.get('client')
        en_retard = self.request.query_params.get('en_retard')
        recherche = self.request.query_params.get('q')

        if statut:
            qs = qs.filter(statut=statut.upper())
        if equipement:
            qs = qs.filter(equipement__id=equipement)
        if client:
            qs = qs.filter(
                Q(client_nom__icontains=client) |
                Q(client_entreprise__icontains=client)
            )
        if en_retard and en_retard.lower() == 'true':
            qs = qs.filter(
                statut='ACTIF',
                date_fin_prevue__lt=date.today(),
                date_fin_effective__isnull=True
            )
        if recherche:
            qs = qs.filter(
                Q(reference__icontains=recherche) |
                Q(client_nom__icontains=recherche) |
                Q(equipement__nom__icontains=recherche)
            )

        return qs

    def perform_create(self, serializer):
        serializer.save(creee_par=self.request.user)

    @action(detail=True, methods=['post'])
    def activer(self, request, pk=None):
        """Active un contrat signé."""
        contrat = self.get_object()

        if contrat.statut not in ['SIGNE', 'EN_ATTENTE_SIGNATURE']:
            return Response(
                {"erreur": "Le contrat doit être signé avant d'être activé."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Vérifier que la caution est versée
        caution_non_versee = contrat.cautions.filter(statut='EN_ATTENTE').exists()
        if caution_non_versee:
            return Response(
                {"erreur": "La caution doit être versée avant l'activation du contrat."},
                status=status.HTTP_400_BAD_REQUEST
            )

        contrat.statut = 'ACTIF'
        contrat.save()

        # Mettre l'équipement en location
        contrat.equipement.statut = 'EN_LOCATION'
        contrat.equipement.save(update_fields=['statut'])

        safe_log(
            utilisateur=request.user,
            action='MODIFICATION',
            module='SUPPLYCHAIN',
            description=f"Contrat {contrat.reference} activé",
            request=request
        )

        return Response(
            ContratLocationSerializer(contrat, context={'request': request}).data
        )

    @action(detail=True, methods=['post'])
    def signer(self, request, pk=None):
        """Marque le contrat comme signé."""
        contrat = self.get_object()

        if contrat.statut not in ['BROUILLON', 'EN_ATTENTE_SIGNATURE']:
            return Response(
                {"erreur": "Ce contrat ne peut pas être signé dans son statut actuel."},
                status=status.HTTP_400_BAD_REQUEST
            )

        signe_hors_ligne = request.data.get('signe_hors_ligne', False)
        contrat.statut = 'SIGNE'
        contrat.signe_hors_ligne = signe_hors_ligne
        contrat.save()

        return Response(
            ContratLocationSerializer(contrat, context={'request': request}).data
        )

    @action(detail=True, methods=['post'])
    def terminer(self, request, pk=None):
        """Termine un contrat de location (retour de l'équipement)."""
        contrat = self.get_object()

        if contrat.statut != 'ACTIF':
            return Response(
                {"erreur": "Seul un contrat actif peut être terminé."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Récupérer les compteurs de retour
        heures_retour = request.data.get('heures_moteur_retour')
        km_retour = request.data.get('km_retour')

        if heures_retour is not None:
            contrat.heures_moteur_retour = heures_retour
        if km_retour is not None:
            contrat.km_retour = km_retour

        contrat.date_fin_effective = date.today()
        contrat.statut = 'TERMINE'

        # Calculer les pénalités de retard
        if contrat.jours_retard > 0 and contrat.penalite_retard_par_jour > 0:
            contrat.montant_penalites = contrat.penalite_retard_par_jour * contrat.jours_retard

        contrat.save()

        # Mettre l'équipement disponible
        equipement = contrat.equipement
        equipement.statut = 'DISPONIBLE'
        if heures_retour:
            equipement.heures_moteur = Decimal(str(heures_retour))
        if km_retour:
            equipement.kilometres = Decimal(str(km_retour))
        equipement.save()

        # Mettre à jour la réservation
        if contrat.reservation:
            contrat.reservation.statut = 'TERMINEE'
            contrat.reservation.save(update_fields=['statut'])

        safe_log(
            utilisateur=request.user,
            action='MODIFICATION',
            module='SUPPLYCHAIN',
            description=(
                f"Contrat {contrat.reference} terminé. "
                f"Retard : {contrat.jours_retard} jour(s), "
                f"Pénalités : {contrat.montant_penalites} {contrat.devise}"
            ),
            request=request
        )

        # Notification si retard
        if contrat.jours_retard > 0:
            notifier_logisticiens(
                titre=f"⚠️ Retour avec retard : {equipement.nom}",
                message=(
                    f"Contrat {contrat.reference} terminé avec {contrat.jours_retard} jour(s) de retard.\n"
                    f"Pénalités appliquées : {contrat.montant_penalites} {contrat.devise}"
                ),
                type_notification='WARNING',
                priorite='HAUTE'
            )

        return Response(
            ContratLocationSerializer(contrat, context={'request': request}).data
        )

    @action(detail=True, methods=['post'])
    def resilier(self, request, pk=None):
        """Résilie un contrat."""
        contrat = self.get_object()
        motif = request.data.get('motif', 'Résiliation demandée')

        if contrat.statut in ['TERMINE', 'RESILIE']:
            return Response(
                {"erreur": "Ce contrat est déjà terminé ou résilié."},
                status=status.HTTP_400_BAD_REQUEST
            )

        contrat.statut = 'RESILIE'
        contrat.date_fin_effective = date.today()
        contrat.notes = f"{contrat.notes or ''}\n\nMotif résiliation : {motif}"
        contrat.save()

        # Remettre l'équipement disponible
        contrat.equipement.statut = 'DISPONIBLE'
        contrat.equipement.save(update_fields=['statut'])

        return Response(
            ContratLocationSerializer(contrat, context={'request': request}).data
        )

    @action(detail=True, methods=['post'])
    def exercer_option_achat(self, request, pk=None):
        """Le client exerce son option d'achat."""
        contrat = self.get_object()

        if not contrat.option_achat_proposee:
            return Response(
                {"erreur": "Aucune option d'achat n'est proposée sur ce contrat."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if contrat.option_achat_exercee:
            return Response(
                {"erreur": "L'option d'achat a déjà été exercée."},
                status=status.HTTP_400_BAD_REQUEST
            )

        contrat.option_achat_exercee = True
        contrat.date_exercice_option = date.today()
        contrat.statut = 'TERMINE'
        contrat.date_fin_effective = date.today()
        contrat.save()

        # Marquer l'équipement comme vendu
        equipement = contrat.equipement
        equipement.statut = 'VENDU'
        equipement.est_actif = False
        equipement.save()

        # Créer un événement cycle de vie
        try:
            from equipements.models import CycleVieEquipement
            CycleVieEquipement.objects.create(
                equipement=equipement,
                evenement='OPTION_ACHAT',
                date_evenement=date.today(),
                description=f"Option d'achat exercée par {contrat.client_nom} (Contrat {contrat.reference})",
                montant=contrat.prix_option_achat,
                acquereur=contrat.client_nom,
                enregistre_par=request.user
            )
        except Exception as e:
            logger.warning(f"Cycle de vie impossible: {e}")

        safe_log(
            utilisateur=request.user,
            action='MODIFICATION',
            module='SUPPLYCHAIN',
            description=(
                f"Option d'achat exercée sur contrat {contrat.reference}. "
                f"Équipement {equipement.reference} vendu à {contrat.client_nom} "
                f"pour {contrat.prix_option_achat} {contrat.devise}"
            ),
            request=request
        )

        return Response(
            ContratLocationSerializer(contrat, context={'request': request}).data
        )

    @action(detail=True, methods=['post'])
    def ajouter_service(self, request, pk=None):
        """Ajoute un service annexe au contrat."""
        contrat = self.get_object()
        serializer = ServiceAnnexeSerializer(data=request.data, context={'request': request})

        if serializer.is_valid():
            service = serializer.save(contrat=contrat)

            # Mettre à jour le montant services du contrat
            total_services = sum(s.montant_total for s in contrat.services_annexes.all())
            contrat.montant_services_ht = total_services
            contrat.save()

            return Response(
                ContratLocationSerializer(contrat, context={'request': request}).data,
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def generer_facture(self, request, pk=None):
        """Génère une facture à partir du contrat."""
        contrat = self.get_object()

        serializer = GenererFactureContratSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        inclure_services = data.get('inclure_services', True)
        inclure_penalites = data.get('inclure_penalites', True)

        # Créer la facture
        facture = FacturationLocation.objects.create(
            contrat=contrat,
            client_nom=contrat.client_nom,
            client_entreprise=contrat.client_entreprise,
            client_email=contrat.client_email,
            client_adresse=contrat.client_adresse,
            montant_ht=0,
            taux_tva=contrat.taux_tva,
            date_emission=data['date_emission'],
            date_echeance=data['date_echeance'],
            notes=data.get('notes', ''),
            emise_par=request.user
        )

        # Ligne de location
        LigneFacturationLocation.objects.create(
            facturation=facture,
            type_ligne='LOCATION',
            description=f"Location {contrat.equipement.nom} ({contrat.get_mode_tarification_display()})",
            quantite=contrat.jours_location,
            unite='jour' if contrat.mode_tarification == 'JOURNALIER' else contrat.mode_tarification.lower(),
            prix_unitaire=contrat.tarif_base
        )

        # Lignes de services
        if inclure_services:
            for service in contrat.services_annexes.filter(est_facture=False):
                LigneFacturationLocation.objects.create(
                    facturation=facture,
                    type_ligne='SERVICE',
                    description=f"{service.get_type_service_display()} - {service.description}",
                    quantite=service.quantite,
                    unite=service.unite,
                    prix_unitaire=service.prix_unitaire,
                    taux_tva_specifique=service.taux_tva_service,
                    service_annexe=service
                )
                service.est_facture = True
                service.save(update_fields=['est_facture'])

        # Ligne de pénalités
        if inclure_penalites and contrat.montant_penalites > 0:
            LigneFacturationLocation.objects.create(
                facturation=facture,
                type_ligne='PENALITE',
                description=f"Pénalité de retard ({contrat.jours_retard} jour(s))",
                quantite=contrat.jours_retard,
                unite='jour',
                prix_unitaire=contrat.penalite_retard_par_jour
            )

        # Recalculer le montant HT
        total_ht = sum(l.montant_total for l in facture.lignes.all())
        facture.montant_ht = total_ht
        facture.statut = 'EMISE'
        facture.save()

        safe_log(
            utilisateur=request.user,
            action='CREATION',
            module='FINANCE',
            description=f"Facture location {facture.reference} générée depuis contrat {contrat.reference}",
            request=request
        )

        return Response(
            FacturationLocationSerializer(facture, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )


# ========================================
# ÉTAT DES LIEUX
# ========================================
class EtatDesLieuxViewSet(viewsets.ModelViewSet):
    """
    CRUD États des lieux (check-in / check-out).
    Accessible par : ADMIN, DIR, LOG
    """
    queryset = EtatDesLieux.objects.all()
    serializer_class = EtatDesLieuxSerializer
    permission_classes = [IsLogistique]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_queryset(self):
        qs = EtatDesLieux.objects.select_related('contrat', 'realise_par').all()

        contrat = self.request.query_params.get('contrat')
        type_etat = self.request.query_params.get('type')

        if contrat:
            qs = qs.filter(contrat__id=contrat)
        if type_etat:
            qs = qs.filter(type_etat=type_etat.upper())

        return qs

    def perform_create(self, serializer):
        instance = serializer.save(creee_par=self.request.user)
        edl = serializer.save(realise_par=self.request.user)
        contrat = edl.contrat

        # Mettre à jour les compteurs du contrat
        if edl.type_etat == 'SORTIE':
            contrat.heures_moteur_depart = edl.heures_moteur
            contrat.km_depart = edl.kilometres
            contrat.save(update_fields=['heures_moteur_depart', 'km_depart'])

        elif edl.type_etat == 'RETOUR':
            contrat.heures_moteur_retour = edl.heures_moteur
            contrat.km_retour = edl.kilometres
            contrat.save(update_fields=['heures_moteur_retour', 'km_retour'])

            # Vérifier les dommages
            if edl.etat_general in ['ENDOMMAGE', 'HORS_SERVICE']:
                notifier_logisticiens(
                    titre=f"🚨 Dommages constatés : {contrat.equipement.nom}",
                    message=(
                        f"L'état des lieux de retour du contrat {contrat.reference} "
                        f"révèle des dommages sur {contrat.equipement.nom}.\n"
                        f"État général : {edl.get_etat_general_display()}\n"
                        f"Dommages : {edl.dommages_constates or 'Non détaillés'}"
                    ),
                    type_notification='ERROR',
                    priorite='URGENTE'
                )

        safe_log(
            utilisateur=self.request.user,
            action='CREATION',
            module='SUPPLYCHAIN',
            description=(
                f"État des lieux {edl.get_type_etat_display()} réalisé "
                f"pour contrat {contrat.reference}"
            ),
            request=self.request
        )

        # Ajouter le tracking
        from administration.tracking import tracker_creation
        tracker_creation(instance, utilisateur=self.request.user, request=self.request)


# ========================================
# CAUTION
# ========================================
class CautionLocationViewSet(viewsets.ModelViewSet):
    """
    CRUD Cautions de location.
    Accessible par : ADMIN, DIR, LOG, COMM
    """
    queryset = CautionLocation.objects.all()
    serializer_class = CautionLocationSerializer
    permission_classes = [IsCommercialeOuLogistique]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_queryset(self):
        qs = CautionLocation.objects.select_related('contrat', 'enregistree_par').all()

        contrat = self.request.query_params.get('contrat')
        statut = self.request.query_params.get('statut')

        if contrat:
            qs = qs.filter(contrat__id=contrat)
        if statut:
            qs = qs.filter(statut=statut.upper())

        return qs

    def perform_create(self, serializer):
        serializer.save(enregistree_par=self.request.user)

    @action(detail=True, methods=['post'])
    def enregistrer_versement(self, request, pk=None):
        """Enregistre le versement de la caution."""
        caution = self.get_object()

        montant = request.data.get('montant')
        mode = request.data.get('mode_paiement', 'ESPECES')
        reference = request.data.get('reference_paiement', '')

        if not montant:
            return Response(
                {"erreur": "Le montant est requis."},
                status=status.HTTP_400_BAD_REQUEST
            )

        caution.montant_verse = Decimal(str(montant))
        caution.mode_paiement = mode
        caution.reference_paiement = reference
        caution.date_versement = date.today()
        caution.save()

        return Response(
            CautionLocationSerializer(caution, context={'request': request}).data
        )

    @action(detail=True, methods=['post'])
    def restituer(self, request, pk=None):
        """Restitue la caution (totalement ou partiellement)."""
        caution = self.get_object()

        montant_retenu = Decimal(str(request.data.get('montant_retenu', 0)))
        motif = request.data.get('motif_retenue', '')

        caution.montant_retenu = montant_retenu
        caution.motif_retenue = motif
        caution.montant_restitue = max(
            Decimal('0'),
            caution.montant_verse - montant_retenu
        )
        caution.date_restitution = date.today()
        caution.save()

        safe_log(
            utilisateur=request.user,
            action='MODIFICATION',
            module='FINANCE',
            description=(
                f"Caution {caution.reference} restituée. "
                f"Versé : {caution.montant_verse}, Retenu : {montant_retenu}, "
                f"Restitué : {caution.montant_restitue}"
            ),
            request=request
        )

        return Response(
            CautionLocationSerializer(caution, context={'request': request}).data
        )


# ========================================
# SERVICE ANNEXE
# ========================================
class ServiceAnnexeViewSet(viewsets.ModelViewSet):
    """
    CRUD Services annexes.
    Accessible par : ADMIN, DIR, LOG, COMM
    """
    queryset = ServiceAnnexe.objects.all()
    serializer_class = ServiceAnnexeSerializer
    permission_classes = [IsCommercialeOuLogistique]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_queryset(self):
        qs = ServiceAnnexe.objects.select_related('contrat').all()

        contrat = self.request.query_params.get('contrat')
        type_s = self.request.query_params.get('type')
        facture = self.request.query_params.get('facture')

        if contrat:
            qs = qs.filter(contrat__id=contrat)
        if type_s:
            qs = qs.filter(type_service=type_s.upper())
        if facture is not None:
            qs = qs.filter(est_facture=(facture.lower() == 'true'))

        return qs

    def perform_create(self, serializer):
        service = serializer.save()

        # Mettre à jour le montant services du contrat
        contrat = service.contrat
        total_services = sum(s.montant_total for s in contrat.services_annexes.all())
        contrat.montant_services_ht = total_services
        contrat.save()


# ========================================
# FACTURATION LOCATION
# ========================================
class FacturationLocationViewSet(viewsets.ModelViewSet):
    """
    CRUD Facturations de location.
    Accessible par : ADMIN, DIR, COMPTA, LOG
    """
    queryset = FacturationLocation.objects.all()
    permission_classes = [IsCommercialeOuLogistique]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_serializer_class(self):
        if self.action == 'list':
            return FacturationResumeSerializer
        return FacturationLocationSerializer

    def get_queryset(self):
        qs = FacturationLocation.objects.select_related('contrat', 'emise_par').prefetch_related(
            'lignes', 'paiements'
        ).all()

        statut = self.request.query_params.get('statut')
        contrat = self.request.query_params.get('contrat')
        client = self.request.query_params.get('client')
        en_retard = self.request.query_params.get('en_retard')

        if statut:
            qs = qs.filter(statut=statut.upper())
        if contrat:
            qs = qs.filter(contrat__id=contrat)
        if client:
            qs = qs.filter(
                Q(client_nom__icontains=client) |
                Q(client_entreprise__icontains=client)
            )
        if en_retard and en_retard.lower() == 'true':
            qs = qs.filter(
                statut__in=['ENVOYEE', 'PARTIELLEMENT_PAYEE'],
                date_echeance__lt=date.today()
            )

        return qs

    def perform_create(self, serializer):
        serializer.save(emise_par=self.request.user)

    @action(detail=True, methods=['post'])
    def ajouter_ligne(self, request, pk=None):
        """Ajoute une ligne à la facture."""
        facture = self.get_object()
        serializer = LigneFacturationLocationSerializer(
            data=request.data, context={'request': request}
        )

        if serializer.is_valid():
            serializer.save(facturation=facture)

            total_ht = sum(l.montant_total for l in facture.lignes.all())
            facture.montant_ht = total_ht
            facture.save()

            return Response(
                FacturationLocationSerializer(facture, context={'request': request}).data,
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def envoyer(self, request, pk=None):
        """Envoie la facture au client par email."""
        facture = self.get_object()

        if not facture.client_email:
            return Response(
                {"erreur": "Aucun email client renseigné."},
                status=status.HTTP_400_BAD_REQUEST
            )

        facture.statut = 'ENVOYEE'
        facture.save()

        # Envoyer par email
        try:
            from administration.email_service import envoyer_email
            from administration.email_service import get_base_template

            contenu = f"""
            <p>Cher(e) <strong>{facture.client_nom}</strong>,</p>
            <p>Veuillez trouver ci-joint votre facture de location.</p>
            <table style="width:100%; background:#f9f9f9; border-radius:10px; margin:20px 0;">
                <tr><td style="padding:15px;">
                    <p><strong>Facture N° :</strong> {facture.reference}</p>
                    <p><strong>Montant TTC :</strong> {facture.montant_ttc:,.0f} {facture.devise}</p>
                    <p><strong>Échéance :</strong> {facture.date_echeance.strftime('%d/%m/%Y')}</p>
                </td></tr>
            </table>
            <p>Cordialement,<br><strong>FOSS AGRO FARM</strong></p>
            """

            html = get_base_template(f"Facture {facture.reference}", contenu)
            envoyer_email(facture.client_email, f"Facture {facture.reference}", html)
        except Exception as e:
            logger.warning(f"Email facture impossible: {e}")

        return Response(
            FacturationLocationSerializer(facture, context={'request': request}).data
        )


# ========================================
# PAIEMENT LOCATION
# ========================================
class PaiementLocationViewSet(viewsets.ModelViewSet):
    """
    CRUD Paiements de location.
    Accessible par : ADMIN, DIR, COMPTA, LOG
    """
    queryset = PaiementLocation.objects.all()
    serializer_class = PaiementLocationSerializer
    permission_classes = [IsCommercialeOuLogistique]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_queryset(self):
        qs = PaiementLocation.objects.select_related('facturation', 'confirme_par').all()

        facturation = self.request.query_params.get('facturation')
        statut = self.request.query_params.get('statut')
        mode = self.request.query_params.get('mode')

        if facturation:
            qs = qs.filter(facturation__id=facturation)
        if statut:
            qs = qs.filter(statut=statut.upper())
        if mode:
            qs = qs.filter(mode_paiement=mode.upper())

        return qs

    @action(detail=True, methods=['post'])
    def confirmer(self, request, pk=None):
        """Confirme un paiement et met à jour la facture."""
        paiement = self.get_object()

        paiement.statut = 'CONFIRME'
        paiement.confirme_par = request.user
        paiement.date_confirmation = date.today()
        paiement.save()

        # Mettre à jour le montant payé sur la facture
        facture = paiement.facturation
        total_paye = facture.paiements.filter(
            statut='CONFIRME'
        ).aggregate(total=Sum('montant'))['total'] or 0

        facture.montant_paye = total_paye
        facture.save()

        safe_log(
            utilisateur=request.user,
            action='MODIFICATION',
            module='FINANCE',
            description=(
                f"Paiement {paiement.reference} confirmé : "
                f"{paiement.montant} {facture.devise} sur facture {facture.reference}"
            ),
            request=request
        )

        return Response(
            PaiementLocationSerializer(paiement, context={'request': request}).data
        )


# ========================================
# DASHBOARD LOCATION
# ========================================
@api_view(['GET'])
@permission_classes([IsCommercialeOuLogistique])
def dashboard_location(request):
    """Dashboard complet de l'activité location."""

    aujourdhui = date.today()
    debut_mois = aujourdhui.replace(day=1)

    # Réservations
    reservations_en_attente = ReservationEquipement.objects.filter(statut='EN_ATTENTE').count()
    reservations_confirmees = ReservationEquipement.objects.filter(statut='CONFIRMEE').count()
    reservations_ce_mois = ReservationEquipement.objects.filter(date_creation__gte=debut_mois).count()

    # Contrats
    contrats_actifs = ContratLocation.objects.filter(statut='ACTIF').count()
    contrats_en_retard = ContratLocation.objects.filter(
        statut='ACTIF',
        date_fin_prevue__lt=aujourdhui,
        date_fin_effective__isnull=True
    ).count()
    contrats_ce_mois = ContratLocation.objects.filter(date_creation__gte=debut_mois).count()

    # Chiffre d'affaires location
    ca_location = FacturationLocation.objects.filter(
        statut__in=['PAYEE', 'PARTIELLEMENT_PAYEE', 'ENVOYEE'],
        date_emission__gte=debut_mois
    ).aggregate(total=Sum('montant_ttc'))['total'] or 0

    encaisse = PaiementLocation.objects.filter(
        statut='CONFIRME',
        date_paiement__gte=debut_mois
    ).aggregate(total=Sum('montant'))['total'] or 0

    # Factures
    factures_impayees = FacturationLocation.objects.filter(
        statut__in=['ENVOYEE', 'PARTIELLEMENT_PAYEE', 'EN_RETARD']
    ).count()

    creances = FacturationLocation.objects.filter(
        statut__in=['ENVOYEE', 'PARTIELLEMENT_PAYEE', 'EN_RETARD']
    ).aggregate(total=Sum('solde_restant'))['total'] or 0

    # Cautions
    cautions_en_attente = CautionLocation.objects.filter(statut='EN_ATTENTE').count()
    total_cautions_versees = CautionLocation.objects.filter(
        statut='VERSEE'
    ).aggregate(total=Sum('montant_verse'))['total'] or 0

    # Contrats en retard (détails)
    contrats_retard_details = []
    for contrat in ContratLocation.objects.filter(
        statut='ACTIF',
        date_fin_prevue__lt=aujourdhui,
        date_fin_effective__isnull=True
    ).select_related('equipement')[:10]:
        contrats_retard_details.append({
            'reference': contrat.reference,
            'equipement': contrat.equipement.nom,
            'client': contrat.client_nom,
            'jours_retard': contrat.jours_retard,
            'date_fin_prevue': str(contrat.date_fin_prevue),
        })

    # Top équipements loués
    from django.db.models import Count as DjCount
    top_equipements = list(
        ContratLocation.objects.filter(
            date_creation__year=aujourdhui.year
        ).values(
            'equipement__reference', 'equipement__nom'
        ).annotate(
            nb_contrats=DjCount('id')
        ).order_by('-nb_contrats')[:5]
    )

    return Response({
        'reservations': {
            'en_attente': reservations_en_attente,
            'confirmees': reservations_confirmees,
            'ce_mois': reservations_ce_mois,
        },
        'contrats': {
            'actifs': contrats_actifs,
            'en_retard': contrats_en_retard,
            'ce_mois': contrats_ce_mois,
            'details_retard': contrats_retard_details,
        },
        'financier': {
            'ca_location_mois': float(ca_location),
            'encaisse_mois': float(encaisse),
            'factures_impayees': factures_impayees,
            'creances': float(creances),
        },
        'cautions': {
            'en_attente': cautions_en_attente,
            'total_versees': float(total_cautions_versees),
        },
        'top_equipements': top_equipements,
    })


# ========================================
# ENDPOINTS RAPPORTS
# ========================================
@api_view(['GET'])
@permission_classes([IsAdminOrDirector])
def rapport_activite(request):
    """Rapport d'activité location."""
    from .reports import rapport_activite_location
    from datetime import datetime

    date_debut = request.query_params.get('date_debut')
    date_fin = request.query_params.get('date_fin')

    kwargs = {}
    if date_debut:
        kwargs['date_debut'] = datetime.strptime(date_debut, '%Y-%m-%d').date()
    if date_fin:
        kwargs['date_fin'] = datetime.strptime(date_fin, '%Y-%m-%d').date()

    return Response(rapport_activite_location(**kwargs))


@api_view(['GET'])
@permission_classes([IsAdminOrDirector])
def rapport_rentabilite(request):
    """Rapport de rentabilité location par équipement."""
    from .reports import rapport_rentabilite_location

    equipement_id = request.query_params.get('equipement')
    annee = request.query_params.get('annee')

    return Response(rapport_rentabilite_location(
        equipement_id=int(equipement_id) if equipement_id else None,
        annee=int(annee) if annee else None
    ))


@api_view(['GET'])
@permission_classes([IsAdminOrDirector])
def rapport_retards(request):
    """Rapport des retards et pénalités."""
    from .reports import rapport_retards_penalites
    from datetime import datetime

    date_debut = request.query_params.get('date_debut')
    date_fin = request.query_params.get('date_fin')

    kwargs = {}
    if date_debut:
        kwargs['date_debut'] = datetime.strptime(date_debut, '%Y-%m-%d').date()
    if date_fin:
        kwargs['date_fin'] = datetime.strptime(date_fin, '%Y-%m-%d').date()

    return Response(rapport_retards_penalites(**kwargs))


@api_view(['GET'])
@permission_classes([IsAdminOrDirector])
def rapport_cautions_view(request):
    """Rapport des cautions."""
    from .reports import rapport_cautions
    from datetime import datetime

    date_debut = request.query_params.get('date_debut')
    date_fin = request.query_params.get('date_fin')

    kwargs = {}
    if date_debut:
        kwargs['date_debut'] = datetime.strptime(date_debut, '%Y-%m-%d').date()
    if date_fin:
        kwargs['date_fin'] = datetime.strptime(date_fin, '%Y-%m-%d').date()

    return Response(rapport_cautions(**kwargs))


@api_view(['GET'])
@permission_classes([IsAdminOrDirector])
def rapport_evolution(request):
    """Rapport évolution mensuelle."""
    from .reports import rapport_evolution_mensuelle

    annee = request.query_params.get('annee')
    return Response(rapport_evolution_mensuelle(int(annee) if annee else None))


@api_view(['GET'])
@permission_classes([IsAdminOrDirector])
def rapport_dommages_view(request):
    """Rapport des dommages."""
    from .reports import rapport_dommages
    from datetime import datetime

    date_debut = request.query_params.get('date_debut')
    date_fin = request.query_params.get('date_fin')

    kwargs = {}
    if date_debut:
        kwargs['date_debut'] = datetime.strptime(date_debut, '%Y-%m-%d').date()
    if date_fin:
        kwargs['date_fin'] = datetime.strptime(date_fin, '%Y-%m-%d').date()

    return Response(rapport_dommages(**kwargs))



@api_view(['GET'])
@permission_classes([IsCommercialeOuLogistique])
def telecharger_contrat_pdf(request, pk):
    try:
        contrat = ContratLocation.objects.get(pk=pk)
    except ContratLocation.DoesNotExist:
        return Response({"erreur": "Contrat introuvable."}, status=404)

    from .pdf_contrat import generer_contrat_pdf
    pdf_buffer = generer_contrat_pdf(contrat)

    response = HttpResponse(pdf_buffer, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="Contrat_{contrat.reference}.pdf"'
    return response



@api_view(['POST'])
@permission_classes([IsCommercialeOuLogistique])
def synchroniser_factures_loc(request):
    """Synchronise les facturations location depuis les contrats."""
    from .facture_sync import synchroniser_factures_location
    resultats = synchroniser_factures_location()
    return Response({
        'message': 'Synchronisation terminée',
        'resultats': resultats
    })


@api_view(['GET'])
@permission_classes([IsCommercialeOuLogistique])
def telecharger_facture_location_pdf(request, pk):
    try:
        facture = FacturationLocation.objects.get(pk=pk)
    except FacturationLocation.DoesNotExist:
        return Response({"erreur": "Facture introuvable."}, status=404)

    from .pdf_facture_location import generer_facture_location_pdf
    pdf_buffer = generer_facture_location_pdf(facture)

    response = HttpResponse(pdf_buffer, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="Facture_Location_{facture.reference}.pdf"'
    return response