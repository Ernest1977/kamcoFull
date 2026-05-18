from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from django.utils import timezone
from django.db.models import Sum, Count, Q, Avg
from administration.mixins import TrackingMixin
from accounts.permissions import IsLogistique, IsAdminOrDirector
from drf_spectacular.utils import extend_schema, extend_schema_view

from .models import (
    CategorieEquipement,
    Equipement,
    CertificationEquipement,
    PlanMaintenancePreventive,
    InterventionMaintenance,
    ConsommationCarburant,
    MouvementEquipement,
    CycleVieEquipement
)

from .serializers import (
    CategorieEquipementSerializer,
    EquipementSerializer,
    EquipementResumeSerializer,
    CertificationEquipementSerializer,
    PlanMaintenancePreventiveSerializer,
    InterventionMaintenanceSerializer,
    InterventionResumeSerializer,
    ConsommationCarburantSerializer,
    MouvementEquipementSerializer,
    CycleVieEquipementSerializer
)


# ========================================
# FONCTIONS UTILITAIRES SÉCURISÉES
# ========================================
def safe_creer_log(utilisateur, action, module, description, **kwargs):
    """Crée un log de manière sécurisée (sans bloquer si administration n'est pas prête)."""
    try:
        from administration.views import creer_log
        creer_log(utilisateur=utilisateur, action=action, module=module, description=description, **kwargs)
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning(f"Impossible de créer un log: {e}")


def safe_creer_notification(destinataire, titre, message, **kwargs):
    """Crée une notification de manière sécurisée."""
    try:
        from administration.views import creer_notification
        creer_notification(destinataire=destinataire, titre=titre, message=message, **kwargs)
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning(f"Impossible de créer une notification: {e}")


# ========================================
# CATÉGORIE ÉQUIPEMENT
# ========================================
class CategorieEquipementViewSet(viewsets.ModelViewSet):
    queryset = CategorieEquipement.objects.all()
    serializer_class = CategorieEquipementSerializer
    permission_classes = [IsLogistique]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_queryset(self):
        qs = CategorieEquipement.objects.all()
        actif = self.request.query_params.get('actif')
        if actif is not None:
            qs = qs.filter(est_active=(actif.lower() == 'true'))
        return qs


# ========================================
# ÉQUIPEMENT
# ========================================


@extend_schema_view(
    list=extend_schema(tags=['Equipements'], summary='Liste des équipements'),
    retrieve=extend_schema(tags=['Equipements'], summary='Détail d\'un équipement'),
    create=extend_schema(tags=['Equipements'], summary='Créer un équipement'),
)

class EquipementViewSet(TrackingMixin,viewsets.ModelViewSet):
    queryset = Equipement.objects.all()
    permission_classes = [IsLogistique]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_serializer_class(self):
        if self.action == 'list':
            return EquipementResumeSerializer
        return EquipementSerializer

    def get_queryset(self):
        qs = Equipement.objects.select_related('categorie').all()

        statut = self.request.query_params.get('statut')
        categorie = self.request.query_params.get('categorie')
        etat = self.request.query_params.get('etat')
        localisation = self.request.query_params.get('localisation')
        disponible = self.request.query_params.get('disponible')
        recherche = self.request.query_params.get('q')

        if statut:
            qs = qs.filter(statut=statut.upper())
        if categorie:
            qs = qs.filter(categorie__id=categorie)
        if etat:
            qs = qs.filter(etat_general=etat.upper())
        if localisation:
            qs = qs.filter(localisation_actuelle__icontains=localisation)
        if disponible and disponible.lower() == 'true':
            qs = qs.filter(statut='DISPONIBLE', est_actif=True)
        if recherche:
            qs = qs.filter(
                Q(nom__icontains=recherche) |
                Q(reference__icontains=recherche) |
                Q(marque__icontains=recherche) |
                Q(numero_serie__icontains=recherche)
            )

        return qs

    @action(detail=True, methods=['post'])
    def changer_statut(self, request, pk=None):
        equipement = self.get_object()
        nouveau_statut = request.data.get('statut')

        statuts_valides = [s[0] for s in Equipement.STATUT_CHOICES]
        if nouveau_statut not in statuts_valides:
            return Response(
                {"erreur": f"Statut invalide. Valides : {statuts_valides}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        equipement.statut = nouveau_statut
        equipement.save()

        safe_creer_log(
            utilisateur=request.user,
            action='MODIFICATION',
            module='SUPPLYCHAIN',
            description=f"Statut équipement {equipement.reference} changé en {nouveau_statut}",
            objet_type='Equipement',
            objet_id=equipement.id,
            request=request
        )

        return Response(
            EquipementSerializer(equipement, context={'request': request}).data
        )

    @action(detail=True, methods=['post'])
    def mettre_a_jour_compteurs(self, request, pk=None):
        equipement = self.get_object()
        heures = request.data.get('heures_moteur')
        km = request.data.get('kilometres')

        if heures is not None:
            equipement.heures_moteur = heures
        if km is not None:
            equipement.kilometres = km

        equipement.save()

        # Vérifier si maintenance requise
        if equipement.maintenance_requise:
            try:
                from django.contrib.auth import get_user_model
                User = get_user_model()
                logisticiens = User.objects.filter(role__in=['ADMIN', 'DIR', 'LOG'], is_active=True)
                for user in logisticiens:
                    safe_creer_notification(
                        destinataire=user,
                        titre=f"Maintenance requise : {equipement.nom}",
                        message=f"L'équipement {equipement.reference} a atteint le seuil de maintenance ({equipement.heures_moteur}h).",
                        type_notification='WARNING',
                        priorite='HAUTE'
                    )
            except Exception:
                pass

        return Response(
            EquipementSerializer(equipement, context={'request': request}).data
        )

    @action(detail=True, methods=['get'])
    def historique_complet(self, request, pk=None):
        equipement = self.get_object()

        certifications = CertificationEquipementSerializer(
            equipement.certifications.all(), many=True, context={'request': request}
        ).data

        interventions = InterventionResumeSerializer(
            equipement.interventions.all()[:20], many=True, context={'request': request}
        ).data

        consommations = ConsommationCarburantSerializer(
            equipement.consommations_carburant.all()[:20], many=True, context={'request': request}
        ).data

        mouvements = MouvementEquipementSerializer(
            equipement.mouvements.all()[:20], many=True, context={'request': request}
        ).data

        cycle_vie = CycleVieEquipementSerializer(
            equipement.cycle_vie.all(), many=True, context={'request': request}
        ).data

        return Response({
            'equipement': EquipementSerializer(equipement, context={'request': request}).data,
            'certifications': certifications,
            'interventions': interventions,
            'consommations_carburant': consommations,
            'mouvements': mouvements,
            'cycle_vie': cycle_vie
        })

    @action(detail=True, methods=['post'])
    def signaler_panne(self, request, pk=None):
        equipement = self.get_object()
        description = request.data.get('description', 'Panne signalée')
        priorite = request.data.get('priorite', 'URGENTE')
        iot_data = request.data.get('iot_data', None)

        intervention = InterventionMaintenance.objects.create(
            equipement=equipement,
            type_intervention='URGENCE',
            priorite=priorite,
            statut='PLANIFIEE',
            description_probleme=description,
            heures_moteur_debut=equipement.heures_moteur,
            km_debut=equipement.kilometres,
            declenchee_par_iot=bool(iot_data),
            alerte_iot_data=iot_data,
            signale_par=request.user
        )

        equipement.statut = 'EN_REPARATION'
        equipement.save()

        # Notifications sécurisées
        try:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            logisticiens = User.objects.filter(role__in=['ADMIN', 'DIR', 'LOG'], is_active=True)
            for user in logisticiens:
                safe_creer_notification(
                    destinataire=user,
                    titre=f"Panne : {equipement.nom}",
                    message=f"Panne signalée sur {equipement.reference}. Intervention {intervention.reference} créée.",
                    type_notification='ERROR',
                    priorite='URGENTE',
                    expediteur=request.user
                )
        except Exception:
            pass

        return Response(
            InterventionMaintenanceSerializer(intervention, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )


# ========================================
# CERTIFICATION
# ========================================
class CertificationEquipementViewSet(viewsets.ModelViewSet):
    queryset = CertificationEquipement.objects.all()
    serializer_class = CertificationEquipementSerializer
    permission_classes = [IsLogistique]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_queryset(self):
        qs = CertificationEquipement.objects.select_related('equipement').all()

        equipement = self.request.query_params.get('equipement')
        statut = self.request.query_params.get('statut')
        type_c = self.request.query_params.get('type')
        expire = self.request.query_params.get('expire')
        alerte = self.request.query_params.get('alerte')

        if equipement:
            qs = qs.filter(equipement__id=equipement)
        if statut:
            qs = qs.filter(statut=statut.upper())
        if type_c:
            qs = qs.filter(type_certification=type_c.upper())
        if expire and expire.lower() == 'true':
            from datetime import date
            qs = qs.filter(date_expiration__lt=date.today())
        if alerte and alerte.lower() == 'true':
            from datetime import date, timedelta
            qs = qs.filter(
                date_expiration__gte=date.today(),
                date_expiration__lte=date.today() + timedelta(days=30)
            )

        return qs


# ========================================
# PLAN MAINTENANCE PRÉVENTIVE
# ========================================
class PlanMaintenancePreventiveViewSet(viewsets.ModelViewSet):
    queryset = PlanMaintenancePreventive.objects.all()
    serializer_class = PlanMaintenancePreventiveSerializer
    permission_classes = [IsLogistique]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_queryset(self):
        qs = PlanMaintenancePreventive.objects.select_related('equipement').all()
        equipement = self.request.query_params.get('equipement')
        actif = self.request.query_params.get('actif')

        if equipement:
            qs = qs.filter(equipement__id=equipement)
        if actif is not None:
            qs = qs.filter(est_actif=(actif.lower() == 'true'))

        return qs


# ========================================
# INTERVENTION MAINTENANCE
# ========================================
class InterventionMaintenanceViewSet(viewsets.ModelViewSet):
    queryset = InterventionMaintenance.objects.all()
    permission_classes = [IsLogistique]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_serializer_class(self):
        if self.action == 'list':
            return InterventionResumeSerializer
        return InterventionMaintenanceSerializer

    def get_queryset(self):
        qs = InterventionMaintenance.objects.select_related(
            'equipement', 'technicien', 'signale_par', 'plan_maintenance'
        ).all()

        equipement = self.request.query_params.get('equipement')
        statut = self.request.query_params.get('statut')
        type_i = self.request.query_params.get('type')
        priorite = self.request.query_params.get('priorite')
        iot = self.request.query_params.get('iot')

        if equipement:
            qs = qs.filter(equipement__id=equipement)
        if statut:
            qs = qs.filter(statut=statut.upper())
        if type_i:
            qs = qs.filter(type_intervention=type_i.upper())
        if priorite:
            qs = qs.filter(priorite=priorite.upper())
        if iot and iot.lower() == 'true':
            qs = qs.filter(declenchee_par_iot=True)

        return qs

    def perform_create(self, serializer):
        intervention = serializer.save(signale_par=self.request.user)

        if intervention.type_intervention in ['URGENCE', 'CORRECTIVE']:
            eq = intervention.equipement
            if eq.statut not in ['EN_REPARATION', 'EN_MAINTENANCE']:
                eq.statut = 'EN_REPARATION'
                eq.save()

    @action(detail=True, methods=['post'])
    def changer_statut(self, request, pk=None):
        intervention = self.get_object()
        nouveau_statut = request.data.get('statut')

        statuts_valides = [s[0] for s in InterventionMaintenance.STATUT_CHOICES]
        if nouveau_statut not in statuts_valides:
            return Response(
                {"erreur": f"Statut invalide. Valides : {statuts_valides}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        intervention.statut = nouveau_statut

        if nouveau_statut == 'EN_COURS':
            intervention.date_debut = timezone.now()
        elif nouveau_statut == 'TERMINEE':
            intervention.date_fin = timezone.now()
            eq = intervention.equipement
            eq.statut = 'DISPONIBLE'
            eq.derniere_maintenance = timezone.now().date()
            eq.heures_derniere_maintenance = eq.heures_moteur
            eq.save()

        intervention.save()

        return Response(
            InterventionMaintenanceSerializer(intervention, context={'request': request}).data
        )

    @action(detail=True, methods=['post'])
    def completer(self, request, pk=None):
        intervention = self.get_object()

        intervention.travaux_realises = request.data.get('travaux_realises', intervention.travaux_realises)
        intervention.pieces_utilisees = request.data.get('pieces_utilisees', intervention.pieces_utilisees)
        intervention.diagnostic = request.data.get('diagnostic', intervention.diagnostic)
        intervention.cout_pieces = request.data.get('cout_pieces', intervention.cout_pieces)
        intervention.cout_main_oeuvre = request.data.get('cout_main_oeuvre', intervention.cout_main_oeuvre)
        intervention.duree_reelle_heures = request.data.get('duree_reelle_heures', intervention.duree_reelle_heures)

        intervention.statut = 'TERMINEE'
        intervention.date_fin = timezone.now()
        intervention.save()

        eq = intervention.equipement
        eq.statut = 'DISPONIBLE'
        eq.derniere_maintenance = timezone.now().date()
        eq.heures_derniere_maintenance = eq.heures_moteur
        eq.save()

        return Response(
            InterventionMaintenanceSerializer(intervention, context={'request': request}).data
        )


# ========================================
# CONSOMMATION CARBURANT
# ========================================
class ConsommationCarburantViewSet(viewsets.ModelViewSet):
    queryset = ConsommationCarburant.objects.all()
    serializer_class = ConsommationCarburantSerializer
    permission_classes = [IsLogistique]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_queryset(self):
        qs = ConsommationCarburant.objects.select_related('equipement', 'enregistre_par').all()
        equipement = self.request.query_params.get('equipement')
        date_debut = self.request.query_params.get('date_debut')
        date_fin = self.request.query_params.get('date_fin')

        if equipement:
            qs = qs.filter(equipement__id=equipement)
        if date_debut:
            qs = qs.filter(date_plein__gte=date_debut)
        if date_fin:
            qs = qs.filter(date_plein__lte=date_fin)

        return qs

    def perform_create(self, serializer):
        consommation = serializer.save(enregistre_par=self.request.user)

        eq = consommation.equipement
        if consommation.heures_moteur_au_plein > eq.heures_moteur:
            eq.heures_moteur = consommation.heures_moteur_au_plein
        if consommation.km_au_plein > eq.kilometres:
            eq.kilometres = consommation.km_au_plein
        eq.save()


# ========================================
# MOUVEMENT ÉQUIPEMENT
# ========================================
class MouvementEquipementViewSet(viewsets.ModelViewSet):
    queryset = MouvementEquipement.objects.all()
    serializer_class = MouvementEquipementSerializer
    permission_classes = [IsLogistique]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_queryset(self):
        qs = MouvementEquipement.objects.select_related('equipement', 'effectue_par').all()
        equipement = self.request.query_params.get('equipement')
        type_m = self.request.query_params.get('type')

        if equipement:
            qs = qs.filter(equipement__id=equipement)
        if type_m:
            qs = qs.filter(type_mouvement=type_m.upper())

        return qs

    def perform_create(self, serializer):
        serializer.save(effectue_par=self.request.user)


# ========================================
# CYCLE DE VIE
# ========================================
class CycleVieEquipementViewSet(viewsets.ModelViewSet):
    queryset = CycleVieEquipement.objects.all()
    serializer_class = CycleVieEquipementSerializer
    permission_classes = [IsLogistique]
    parser_classes = [JSONParser, MultiPartParser, FormParser]


    def get_queryset(self):
        qs = CycleVieEquipement.objects.select_related('equipement', 'enregistre_par').all()
        equipement = self.request.query_params.get('equipement')
        evenement = self.request.query_params.get('evenement')

        if equipement:
            qs = qs.filter(equipement__id=equipement)
        if evenement:
            qs = qs.filter(evenement=evenement.upper())

        return qs

    def perform_create(self, serializer):
        cycle = serializer.save(enregistre_par=self.request.user)

        if cycle.evenement in ['VENTE', 'MISE_AU_REBUT', 'RETOUR_LEASING']:
            eq = cycle.equipement
            eq.statut = 'VENDU'
            eq.est_actif = False
            eq.save()


# ========================================
# DASHBOARD ÉQUIPEMENTS
# ========================================
@api_view(['GET'])
@permission_classes([IsLogistique])
def dashboard_equipements(request):
    from datetime import date, timedelta

    aujourdhui = date.today()

    total_equipements = Equipement.objects.filter(est_actif=True).count()

    par_statut = dict(
        Equipement.objects.filter(est_actif=True).values_list('statut').annotate(
            count=Count('id')
        ).order_by()
    )

    disponibles = par_statut.get('DISPONIBLE', 0)
    en_location = par_statut.get('EN_LOCATION', 0)
    en_maintenance = par_statut.get('EN_MAINTENANCE', 0) + par_statut.get('EN_REPARATION', 0)

    taux_utilisation = 0
    if total_equipements > 0:
        taux_utilisation = round((en_location / total_equipements) * 100, 1)

    maintenances_en_cours = InterventionMaintenance.objects.filter(
        statut__in=['PLANIFIEE', 'EN_COURS', 'EN_ATTENTE_PIECES']
    ).count()

    urgences_actives = InterventionMaintenance.objects.filter(
        type_intervention='URGENCE',
        statut__in=['PLANIFIEE', 'EN_COURS']
    ).count()

    cout_maintenance_annee = InterventionMaintenance.objects.filter(
        statut='TERMINEE',
        date_fin__year=aujourdhui.year
    ).aggregate(total=Sum('cout_total'))['total'] or 0

    certifications_expirees = CertificationEquipement.objects.filter(
        date_expiration__lt=aujourdhui
    ).count()

    certifications_bientot = CertificationEquipement.objects.filter(
        date_expiration__gte=aujourdhui,
        date_expiration__lte=aujourdhui + timedelta(days=30)
    ).count()

    cout_carburant_mois = ConsommationCarburant.objects.filter(
        date_plein__month=aujourdhui.month,
        date_plein__year=aujourdhui.year
    ).aggregate(total=Sum('cout_total'))['total'] or 0

    litres_mois = ConsommationCarburant.objects.filter(
        date_plein__month=aujourdhui.month,
        date_plein__year=aujourdhui.year
    ).aggregate(total=Sum('quantite_litres'))['total'] or 0

    valeur_flotte = Equipement.objects.filter(est_actif=True).aggregate(
        total_acquisition=Sum('prix_acquisition')
    )['total_acquisition'] or 0

    par_categorie = list(
        CategorieEquipement.objects.filter(est_active=True).annotate(
            nb_equipements=Count('equipements', filter=Q(equipements__est_actif=True))
        ).values('nom', 'nb_equipements')
    )

    equipements_maintenance_due = []
    for eq in Equipement.objects.filter(est_actif=True, statut='DISPONIBLE'):
        if eq.maintenance_requise:
            equipements_maintenance_due.append({
                'reference': eq.reference,
                'nom': eq.nom,
                'heures_moteur': float(eq.heures_moteur)
            })

    return Response({
        'flotte': {
            'total': total_equipements,
            'disponibles': disponibles,
            'en_location': en_location,
            'en_maintenance': en_maintenance,
            'taux_utilisation': taux_utilisation,
            'par_statut': par_statut,
            'par_categorie': par_categorie,
            'valeur_totale_acquisition': float(valeur_flotte),
        },
        'maintenance': {
            'interventions_en_cours': maintenances_en_cours,
            'urgences_actives': urgences_actives,
            'cout_annuel': float(cout_maintenance_annee),
            'equipements_maintenance_due': equipements_maintenance_due,
        },
        'certifications': {
            'expirees': certifications_expirees,
            'expirant_bientot': certifications_bientot,
        },
        'carburant': {
            'cout_ce_mois': float(cout_carburant_mois),
            'litres_ce_mois': float(litres_mois),
        },
    })

# ========================================
# ========================================
# ENDPOINTS RAPPORTS
# ========================================
@api_view(['GET'])
@permission_classes([IsAdminOrDirector])
def rapport_utilisation(request):
    """Rapport d'utilisation de la flotte."""
    from .reports import rapport_utilisation_flotte
    date_debut = request.query_params.get('date_debut')
    date_fin = request.query_params.get('date_fin')

    kwargs = {}
    if date_debut:
        from datetime import datetime
        kwargs['date_debut'] = datetime.strptime(date_debut, '%Y-%m-%d').date()
    if date_fin:
        from datetime import datetime
        kwargs['date_fin'] = datetime.strptime(date_fin, '%Y-%m-%d').date()

    return Response(rapport_utilisation_flotte(**kwargs))


@api_view(['GET'])
@permission_classes([IsAdminOrDirector])
def rapport_maintenance(request):
    """Rapport des coûts de maintenance."""
    from .reports import rapport_couts_maintenance
    annee = request.query_params.get('annee')
    return Response(rapport_couts_maintenance(int(annee) if annee else None))


@api_view(['GET'])
@permission_classes([IsAdminOrDirector])
def rapport_carburant(request):
    """Rapport de consommation carburant."""
    from .reports import rapport_consommation_carburant
    annee = request.query_params.get('annee')
    return Response(rapport_consommation_carburant(int(annee) if annee else None))


@api_view(['GET'])
@permission_classes([IsAdminOrDirector])
def rapport_rentabilite_view(request):
    """Rapport de rentabilité par équipement."""
    from .reports import rapport_rentabilite
    equipement_id = request.query_params.get('equipement')
    annee = request.query_params.get('annee')
    return Response(rapport_rentabilite(
        equipement_id=int(equipement_id) if equipement_id else None,
        annee=int(annee) if annee else None
    ))


# ========================================
# ENDPOINT AUTOMATISATIONS MANUELLES
# ========================================
@api_view(['POST'])
@permission_classes([IsAdminOrDirector])
def lancer_verifications(request):
    """Lance manuellement les vérifications automatiques."""
    from .automations import (
        verifier_certifications_expirees,
        verifier_maintenances_preventives,
        verifier_garanties
    )

    resultats = {
        'certifications': verifier_certifications_expirees(),
        'maintenances': verifier_maintenances_preventives(),
        'garanties': verifier_garanties(),
    }

    return Response({
        'message': 'Vérifications terminées',
        'resultats': resultats
    })


# ========================================
# VÉRIFICATION CERTIFICATIONS
# ========================================

from .models import CapteurIoT, DonneesTelemetrie, AlerteIoT, RegleAlerteIoT
from .serializers import (
    CapteurIoTSerializer,
    DonneesTelemetrieSerializer,
    ReceptionTelemetrieSerializer,
    AlerteIoTSerializer,
    RegleAlerteIoTSerializer
)


# ========================================
# CAPTEUR IoT
# ========================================
class CapteurIoTViewSet(viewsets.ModelViewSet):
    queryset = CapteurIoT.objects.all()
    serializer_class = CapteurIoTSerializer
    permission_classes = [IsLogistique]

    def get_queryset(self):
        qs = CapteurIoT.objects.select_related('equipement').all()
        equipement = self.request.query_params.get('equipement')
        type_c = self.request.query_params.get('type')
        statut = self.request.query_params.get('statut')

        if equipement:
            qs = qs.filter(equipement__id=equipement)
        if type_c:
            qs = qs.filter(type_capteur=type_c.upper())
        if statut:
            qs = qs.filter(statut=statut.upper())

        return qs


# ========================================
# ALERTE IoT
# ========================================
class AlerteIoTViewSet(viewsets.ModelViewSet):
    queryset = AlerteIoT.objects.all()
    serializer_class = AlerteIoTSerializer
    permission_classes = [IsLogistique]

    def get_queryset(self):
        qs = AlerteIoT.objects.select_related(
            'capteur', 'equipement', 'acquittee_par', 'intervention_creee'
        ).all()

        equipement = self.request.query_params.get('equipement')
        severite = self.request.query_params.get('severite')
        statut = self.request.query_params.get('statut')
        active = self.request.query_params.get('active')

        if equipement:
            qs = qs.filter(equipement__id=equipement)
        if severite:
            qs = qs.filter(severite=severite.upper())
        if statut:
            qs = qs.filter(statut=statut.upper())
        if active and active.lower() == 'true':
            qs = qs.filter(statut='ACTIVE')

        return qs

    @action(detail=True, methods=['post'])
    def acquitter(self, request, pk=None):
        alerte = self.get_object()
        commentaire = request.data.get('commentaire', '')

        alerte.statut = 'ACQUITTEE'
        alerte.acquittee_par = request.user
        alerte.date_acquittement = timezone.now()
        alerte.commentaire_resolution = commentaire
        alerte.save()

        return Response(
            AlerteIoTSerializer(alerte, context={'request': request}).data
        )

    @action(detail=True, methods=['post'])
    def resoudre(self, request, pk=None):
        alerte = self.get_object()
        commentaire = request.data.get('commentaire', '')

        alerte.statut = 'RESOLUE'
        alerte.acquittee_par = request.user
        alerte.date_acquittement = timezone.now()
        alerte.commentaire_resolution = commentaire
        alerte.save()

        return Response(
            AlerteIoTSerializer(alerte, context={'request': request}).data
        )


# ========================================
# RÈGLE D'ALERTE IoT
# ========================================
class RegleAlerteIoTViewSet(viewsets.ModelViewSet):
    queryset = RegleAlerteIoT.objects.all()
    serializer_class = RegleAlerteIoTSerializer
    permission_classes = [IsAdminOrDirector]


# ========================================
# ENDPOINT RÉCEPTION DONNÉES IoT
# ========================================
@api_view(['POST'])
@permission_classes([])  # Authentification par token capteur
def recevoir_telemetrie(request):
    """
    Endpoint pour recevoir les données des capteurs IoT.
    Peut recevoir une seule donnée ou un batch.
    
    Single: { "capteur_id": "...", "valeur": 42.5, "timestamp": "..." }
    Batch:  { "donnees": [ { ... }, { ... } ] }
    """
    donnees_list = request.data.get('donnees')

    if donnees_list is None:
        # Single data point
        donnees_list = [request.data]

    resultats = {'recues': 0, 'erreurs': 0, 'alertes': 0}

    from .iot_engine import traiter_donnee_telemetrie

    for data in donnees_list:
        serializer = ReceptionTelemetrieSerializer(data=data)
        if not serializer.is_valid():
            resultats['erreurs'] += 1
            continue

        capteur_id = serializer.validated_data['capteur_id']

        try:
            capteur = CapteurIoT.objects.select_related('equipement').get(
                identifiant=capteur_id, est_actif=True
            )
        except CapteurIoT.DoesNotExist:
            resultats['erreurs'] += 1
            continue

        traiter_donnee_telemetrie(
            capteur=capteur,
            valeur=serializer.validated_data['valeur'],
            timestamp=serializer.validated_data['timestamp'],
            latitude=serializer.validated_data.get('latitude'),
            longitude=serializer.validated_data.get('longitude'),
            metadata=serializer.validated_data.get('metadata')
        )

        resultats['recues'] += 1

    # Compter les nouvelles alertes
    from datetime import timedelta as td
    resultats['alertes'] = AlerteIoT.objects.filter(
        date_alerte__gte=timezone.now() - td(seconds=10)
    ).count()

    return Response(resultats)


# ========================================
# DASHBOARD IoT
# ========================================
@api_view(['GET'])
@permission_classes([IsLogistique])
def dashboard_iot(request):
    """Dashboard des capteurs et alertes IoT."""
    total_capteurs = CapteurIoT.objects.filter(est_actif=True).count()
    capteurs_actifs = CapteurIoT.objects.filter(statut='ACTIF', est_actif=True).count()
    capteurs_deconnectes = CapteurIoT.objects.filter(statut='DECONNECTE', est_actif=True).count()
    capteurs_defaillants = CapteurIoT.objects.filter(statut='DEFAILLANT', est_actif=True).count()

    alertes_actives = AlerteIoT.objects.filter(statut='ACTIVE').count()
    alertes_critiques = AlerteIoT.objects.filter(statut='ACTIVE', severite='CRITIQUE').count()

    alertes_recentes = AlerteIoTSerializer(
        AlerteIoT.objects.filter(statut='ACTIVE').order_by('-date_alerte')[:10],
        many=True,
        context={'request': request}
    ).data

    capteurs_par_type = list(
        CapteurIoT.objects.filter(est_actif=True).values('type_capteur').annotate(
            count=Count('id')
        ).order_by()
    )

    return Response({
        'capteurs': {
            'total': total_capteurs,
            'actifs': capteurs_actifs,
            'deconnectes': capteurs_deconnectes,
            'defaillants': capteurs_defaillants,
            'par_type': capteurs_par_type,
        },
        'alertes': {
            'actives': alertes_actives,
            'critiques': alertes_critiques,
            'recentes': alertes_recentes,
        },
    })