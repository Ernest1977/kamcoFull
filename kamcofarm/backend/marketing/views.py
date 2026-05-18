from django.db import models
from django.db.models import Sum, Count, Q
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from django.utils import timezone
from administration.mixins import TrackingMixin
from accounts.permissions import IsCommercial, IsAdminOrDirector
from drf_spectacular.utils import extend_schema, extend_schema_view

from .models import (
    SourceLead,
    Lead,
    InteractionLead,
    CampagneMarketing,
    AbonneNewsletter,
    Promotion,
    EvaluationSAV,
    ClientConverti
)

from .serializers import (
    SourceLeadSerializer,
    LeadSerializer,
    LeadResumeSerializer,
    InteractionLeadSerializer,
    CampagneMarketingSerializer,
    AbonneNewsletterSerializer,
    InscriptionNewsletterSerializer,
    PromotionSerializer,
    EvaluationSAVSerializer,
    ClientConvertiSerializer
)


# ========================================
# SOURCE LEAD
# ========================================
@extend_schema_view(
    list=extend_schema(tags=['Marketing'], summary='Liste des sources de leads'),
    retrieve=extend_schema(tags=['Marketing'], summary='Détail d\'une source de lead'),
    create=extend_schema(tags=['Marketing'], summary='Créer une source de lead'),
)
class SourceLeadViewSet(viewsets.ModelViewSet):
    """CRUD Sources de leads."""
    queryset = SourceLead.objects.all()
    serializer_class = SourceLeadSerializer
    permission_classes = [IsCommercial]


# ========================================
# LEAD
# ========================================

@extend_schema_view(
    list=extend_schema(tags=['Marketing'], summary='Liste des leads'),
    retrieve=extend_schema(tags=['Marketing'], summary='Détail d\'un lead'),
    create=extend_schema(tags=['Marketing'], summary='Créer un lead'),
)

class LeadViewSet(TrackingMixin, viewsets.ModelViewSet):
    """
    CRUD Leads / Prospects.
    Accessible par : ADMIN, DIR, COMM
    """
    queryset = Lead.objects.all()
    permission_classes = [IsCommercial]

    def get_serializer_class(self):
        if self.action == 'list':
            return LeadResumeSerializer
        return LeadSerializer

    def get_queryset(self):
        qs = Lead.objects.select_related('source', 'assigne_a', 'cree_par').all()

        statut = self.request.query_params.get('statut')
        priorite = self.request.query_params.get('priorite')
        source = self.request.query_params.get('source')
        assigne = self.request.query_params.get('assigne_a')
        pays = self.request.query_params.get('pays')
        recherche = self.request.query_params.get('q')

        if statut:
            qs = qs.filter(statut=statut.upper())
        if priorite:
            qs = qs.filter(priorite=priorite.upper())
        if source:
            qs = qs.filter(source__id=source)
        if assigne:
            qs = qs.filter(assigne_a__id=assigne)
        if pays:
            qs = qs.filter(pays__icontains=pays)
        if recherche:
            qs = qs.filter(
                models.Q(nom__icontains=recherche) |
                models.Q(entreprise__icontains=recherche) |
                models.Q(email__icontains=recherche)
            )

        return qs

    def perform_create(self, serializer):
        serializer.save(cree_par=self.request.user)

    @action(detail=True, methods=['post'])
    def changer_statut(self, request, pk=None):
        lead = self.get_object()
        nouveau_statut = request.data.get('statut')

        statuts_valides = [s[0] for s in Lead.STATUT_CHOICES]
        if nouveau_statut not in statuts_valides:
            return Response(
                {"erreur": f"Statut invalide. Valides : {statuts_valides}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        lead.statut = nouveau_statut

        if nouveau_statut == 'CONVERTI':
            lead.date_conversion = timezone.now()
        elif nouveau_statut == 'PERDU':
            lead.raison_perte = request.data.get('raison', '')

        lead.save()

        return Response(
            LeadSerializer(lead, context={'request': request}).data
        )

    @action(detail=True, methods=['post'])
    def ajouter_interaction(self, request, pk=None):
        lead = self.get_object()
        data = request.data.copy()
        data['lead'] = lead.id

        serializer = InteractionLeadSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            serializer.save(effectuee_par=request.user)

            # Mettre à jour la date du dernier contact
            lead.date_dernier_contact = timezone.now()
            lead.save()

            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def interactions(self, request, pk=None):
        lead = self.get_object()
        interactions = lead.interactions.all()
        serializer = InteractionLeadSerializer(
            interactions, many=True, context={'request': request}
        )
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def assigner(self, request, pk=None):
        lead = self.get_object()
        user_id = request.data.get('user_id')

        if not user_id:
            return Response(
                {"erreur": "user_id requis."},
                status=status.HTTP_400_BAD_REQUEST
            )

        from django.contrib.auth import get_user_model
        User = get_user_model()

        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response(
                {"erreur": "Utilisateur introuvable."},
                status=status.HTTP_404_NOT_FOUND
            )

        lead.assigne_a = user
        lead.save()

        return Response(
            LeadSerializer(lead, context={'request': request}).data
        )


# ========================================
# INTERACTION LEAD
# ========================================
class InteractionLeadViewSet(viewsets.ModelViewSet):
    """CRUD Interactions de suivi des leads."""
    queryset = InteractionLead.objects.all()
    serializer_class = InteractionLeadSerializer
    permission_classes = [IsCommercial]

    def get_queryset(self):
        qs = InteractionLead.objects.select_related('lead', 'effectuee_par').all()
        lead_id = self.request.query_params.get('lead')
        type_i = self.request.query_params.get('type')

        if lead_id:
            qs = qs.filter(lead__id=lead_id)
        if type_i:
            qs = qs.filter(type_interaction=type_i.upper())

        return qs

    def perform_create(self, serializer):
        serializer.save(effectuee_par=self.request.user)


# ========================================
# CAMPAGNE MARKETING
# ========================================
class CampagneMarketingViewSet(viewsets.ModelViewSet):
    """
    CRUD Campagnes marketing.
    Accessible par : ADMIN, DIR, COMM
    """
    queryset = CampagneMarketing.objects.all()
    serializer_class = CampagneMarketingSerializer
    permission_classes = [IsCommercial]

    def get_queryset(self):
        qs = CampagneMarketing.objects.all()
        statut = self.request.query_params.get('statut')
        type_c = self.request.query_params.get('type')

        if statut:
            qs = qs.filter(statut=statut.upper())
        if type_c:
            qs = qs.filter(type_campagne=type_c.upper())

        return qs

    @action(detail=True, methods=['post'])
    def changer_statut(self, request, pk=None):
        campagne = self.get_object()
        nouveau_statut = request.data.get('statut')

        statuts_valides = [s[0] for s in CampagneMarketing.STATUT_CHOICES]
        if nouveau_statut not in statuts_valides:
            return Response(
                {"erreur": f"Statut invalide. Valides : {statuts_valides}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        campagne.statut = nouveau_statut
        campagne.save()

        return Response(
            CampagneMarketingSerializer(campagne, context={'request': request}).data
        )

    @action(detail=True, methods=['post'])
    def mettre_a_jour_kpis(self, request, pk=None):
        campagne = self.get_object()

        campagne.leads_generes = request.data.get('leads_generes', campagne.leads_generes)
        campagne.conversions = request.data.get('conversions', campagne.conversions)
        campagne.impressions = request.data.get('impressions', campagne.impressions)
        campagne.clics = request.data.get('clics', campagne.clics)
        campagne.budget_depense = request.data.get('budget_depense', campagne.budget_depense)

        campagne.save()

        return Response(
            CampagneMarketingSerializer(campagne, context={'request': request}).data
        )


# ========================================
# ABONNÉ NEWSLETTER
# ========================================
class AbonneNewsletterViewSet(viewsets.ModelViewSet):
    """
    CRUD Abonnés newsletter.
    Gestion : ADMIN, DIR, COMM
    """
    queryset = AbonneNewsletter.objects.all()
    serializer_class = AbonneNewsletterSerializer
    permission_classes = [IsCommercial]

    def get_queryset(self):
        qs = AbonneNewsletter.objects.all()
        actif = self.request.query_params.get('actif')
        langue = self.request.query_params.get('langue')

        if actif is not None:
            qs = qs.filter(est_actif=(actif.lower() == 'true'))
        if langue:
            qs = qs.filter(langue=langue.lower())

        return qs


@api_view(['POST'])
@permission_classes([AllowAny])
def inscription_newsletter(request):
    """Endpoint public pour s'inscrire à la newsletter."""
    serializer = InscriptionNewsletterSerializer(data=request.data)

    if serializer.is_valid():
        email = serializer.validated_data['email']

        existing = AbonneNewsletter.objects.filter(email=email).first()
        if existing:
            if existing.est_actif:
                return Response(
                    {"message": "Vous êtes déjà inscrit à notre newsletter !"},
                    status=status.HTTP_200_OK
                )
            else:
                existing.est_actif = True
                existing.date_desinscription = None
                existing.save()

                from administration.email_service import envoyer_email_bienvenue_newsletter
                envoyer_email_bienvenue_newsletter(existing)

                return Response(
                    {"message": "Votre inscription a été réactivée avec succès !"},
                    status=status.HTTP_200_OK
                )

        abonne = serializer.save(source=request.data.get('source', 'site_web'))

        # Email de bienvenue
        from administration.email_service import envoyer_email_bienvenue_newsletter
        envoyer_email_bienvenue_newsletter(abonne)

        return Response(
            {"message": "Inscription à la newsletter réussie !"},
            status=status.HTTP_201_CREATED
        )

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def desinscription_newsletter(request):
    """
    Endpoint public pour se désinscrire via token.
    """
    token = request.data.get('token')
    if not token:
        return Response(
            {"erreur": "Token de désinscription requis."},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        abonne = AbonneNewsletter.objects.get(token_desinscription=token)
        abonne.est_actif = False
        abonne.date_desinscription = timezone.now()
        abonne.save()
        return Response({"message": "Désinscription effectuée avec succès."})
    except AbonneNewsletter.DoesNotExist:
        return Response(
            {"erreur": "Token invalide."},
            status=status.HTTP_404_NOT_FOUND
        )
    
@api_view(['POST'])
@permission_classes([IsCommercial])
def envoyer_campagne_newsletter(request):
    """
    Envoie une newsletter à tous les abonnés actifs.
    Payload: { "sujet": "...", "contenu": "<html>..." }
    """
    sujet = request.data.get('sujet')
    contenu = request.data.get('contenu')
    langue = request.data.get('langue')

    if not sujet or not contenu:
        return Response(
            {"erreur": "Les champs 'sujet' et 'contenu' sont requis."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Filtrer par langue si spécifié
    abonnes = AbonneNewsletter.objects.filter(est_actif=True)
    if langue:
        abonnes = abonnes.filter(langue=langue.lower())

    from administration.email_service import envoyer_newsletter
    resultats = envoyer_newsletter(sujet, contenu, abonnes)

    # Logger l'envoi
    from administration.views import creer_log
    creer_log(
        utilisateur=request.user,
        action='CREATION',
        module='MARKETING',
        description=f"Newsletter envoyée : '{sujet}' - {resultats['envoyes']}/{resultats['total']} envoyés",
        request=request
    )

    return Response({
        "message": "Newsletter envoyée avec succès !",
        "statistiques": resultats
    })


# ========================================
# PROMOTION
# ========================================
class PromotionViewSet(viewsets.ModelViewSet):
    """
    CRUD Promotions.
    - Lecture publique : promotions actives et valides
    - Écriture : ADMIN, DIR, COMM
    """
    queryset = Promotion.objects.all()
    serializer_class = PromotionSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsCommercial()]

    def get_queryset(self):
        qs = Promotion.objects.prefetch_related('produits').all()

        if not self.request.user.is_authenticated:
            qs = qs.filter(
                est_active=True,
                date_debut__lte=timezone.now(),
                date_fin__gte=timezone.now()
            )

        active = self.request.query_params.get('active')
        type_p = self.request.query_params.get('type')

        if active is not None:
            qs = qs.filter(est_active=(active.lower() == 'true'))
        if type_p:
            qs = qs.filter(type_promotion=type_p.upper())

        return qs

    def perform_create(self, serializer):
        serializer.save(creee_par=self.request.user)

    @action(detail=True, methods=['post'])
    def verifier_code(self, request, pk=None):
        """Vérifie si un code promo est valide."""
        code = request.data.get('code')
        if not code:
            return Response(
                {"erreur": "Code promo requis."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            promo = Promotion.objects.get(code_promo=code)
        except Promotion.DoesNotExist:
            return Response(
                {"valide": False, "message": "Code promo invalide."},
                status=status.HTTP_404_NOT_FOUND
            )

        now = timezone.now()
        if not promo.est_active:
            return Response({"valide": False, "message": "Cette promotion n'est plus active."})
        if now < promo.date_debut or now > promo.date_fin:
            return Response({"valide": False, "message": "Cette promotion a expiré."})
        if promo.usage_maximum > 0 and promo.usage_actuel >= promo.usage_maximum:
            return Response({"valide": False, "message": "Cette promotion a atteint son nombre maximum d'utilisations."})

        return Response({
            "valide": True,
            "message": "Code promo valide !",
            "promotion": PromotionSerializer(promo, context={'request': request}).data
        })


# ========================================
# DASHBOARD MARKETING
# ========================================
@api_view(['GET'])
@permission_classes([IsCommercial])
def dashboard_marketing(request):
    """
    Vue d'ensemble marketing.
    """

    # Leads
    total_leads = Lead.objects.count()
    leads_nouveaux = Lead.objects.filter(statut='NOUVEAU').count()
    leads_qualifies = Lead.objects.filter(statut='QUALIFIE').count()
    leads_convertis = Lead.objects.filter(statut='CONVERTI').count()
    leads_perdus = Lead.objects.filter(statut='PERDU').count()

    taux_conversion_global = 0
    if total_leads > 0:
        taux_conversion_global = round((leads_convertis / total_leads) * 100, 1)

    leads_par_source = list(
        Lead.objects.values('source__nom').annotate(
            count=Count('id')
        ).order_by('-count')[:10]
    )

    leads_par_statut = dict(
        Lead.objects.values_list('statut').annotate(
            count=Count('id')
        ).order_by()
    )

    # Campagnes
    campagnes_en_cours = CampagneMarketing.objects.filter(statut='EN_COURS').count()
    budget_campagnes = CampagneMarketing.objects.filter(
        statut__in=['EN_COURS', 'TERMINEE']
    ).aggregate(
        prevu=Sum('budget_prevu'),
        depense=Sum('budget_depense')
    )

    # Newsletter
    total_abonnes = AbonneNewsletter.objects.filter(est_actif=True).count()
    abonnes_ce_mois = AbonneNewsletter.objects.filter(
        est_actif=True,
        date_inscription__month=timezone.now().month,
        date_inscription__year=timezone.now().year
    ).count()

    # Promotions
    promotions_actives = Promotion.objects.filter(
        est_active=True,
        date_debut__lte=timezone.now(),
        date_fin__gte=timezone.now()
    ).count()

    return Response({
        'leads': {
            'total': total_leads,
            'nouveaux': leads_nouveaux,
            'qualifies': leads_qualifies,
            'convertis': leads_convertis,
            'perdus': leads_perdus,
            'taux_conversion': taux_conversion_global,
            'par_source': leads_par_source,
            'par_statut': leads_par_statut,
        },
        'campagnes': {
            'en_cours': campagnes_en_cours,
            'budget_prevu': float(budget_campagnes['prevu'] or 0),
            'budget_depense': float(budget_campagnes['depense'] or 0),
        },
        'newsletter': {
            'total_abonnes': total_abonnes,
            'nouveaux_ce_mois': abonnes_ce_mois,
        },
        'promotions_actives': promotions_actives,
    })



class EvaluationSAVViewSet(viewsets.ModelViewSet):
    queryset = EvaluationSAV.objects.all()
    serializer_class = EvaluationSAVSerializer
    permission_classes = [IsCommercial]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_queryset(self):
        qs = EvaluationSAV.objects.all()
        client = self.request.query_params.get('client')
        if client:
            qs = qs.filter(client_nom__icontains=client)
        return qs

    def perform_create(self, serializer):
        serializer.save(enregistre_par=self.request.user)




class ClientConvertiViewSet(viewsets.ModelViewSet):
    queryset = ClientConverti.objects.all()
    serializer_class = ClientConvertiSerializer
    permission_classes = [IsCommercial]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_queryset(self):
        qs = ClientConverti.objects.all()
        eligible = self.request.query_params.get('eligible')
        if eligible and eligible.lower() == 'true':
            qs = qs.filter(eligible_promotion=True)
        return qs

@api_view(['POST'])
@permission_classes([IsCommercial])
def synchroniser_sav(request):
    """Lance la synchronisation manuelle des clients convertis."""
    from .sav_service import synchroniser_clients_convertis
    resultats = synchroniser_clients_convertis()
    return Response({
        'message': 'Synchronisation terminée',
        'resultats': resultats
    })