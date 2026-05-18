from datetime import date, timedelta
from django.db.models import Sum, Count, Avg, Q
import logging

logger = logging.getLogger(__name__)


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
        users = User.objects.filter(role__in=['ADMIN', 'DIR', 'LOG'], is_active=True)
        for user in users:
            safe_notification(destinataire=user, titre=titre, message=message, **kwargs)
    except Exception as e:
        logger.warning(f"Notification logisticiens impossible: {e}")


# ========================================
# VÉRIFICATION QUOTIDIENNE DES CERTIFICATIONS
# ========================================
def verifier_certifications_expirees():
    """
    À exécuter quotidiennement.
    Vérifie les certifications expirées et bientôt expirées.
    """
    from .models import CertificationEquipement

    aujourdhui = date.today()
    resultats = {'expirees': 0, 'alertes': 0}

    # Marquer les certifications expirées
    certifs_expirees = CertificationEquipement.objects.filter(
        date_expiration__lt=aujourdhui,
        statut='VALIDE'
    )

    for certif in certifs_expirees:
        certif.statut = 'EXPIRE'
        certif.save(update_fields=['statut'])
        resultats['expirees'] += 1

    if resultats['expirees'] > 0:
        notifier_logisticiens(
            titre=f"🚨 {resultats['expirees']} certification(s) expirée(s)",
            message=f"{resultats['expirees']} certification(s) viennent d'expirer. Veuillez les renouveler.",
            type_notification='ERROR',
            priorite='URGENTE'
        )

    # Alerter pour les certifications bientôt expirées
    certifs_bientot = CertificationEquipement.objects.filter(
        statut='VALIDE',
        date_expiration__gte=aujourdhui,
        date_expiration__lte=aujourdhui + timedelta(days=30)
    )

    for certif in certifs_bientot:
        jours = (certif.date_expiration - aujourdhui).days
        if jours in [30, 15, 7, 3, 1]:
            notifier_logisticiens(
                titre=f"⏰ Certification expire dans {jours} jour(s)",
                message=(
                    f"'{certif.nom}' pour {certif.equipement.nom} "
                    f"({certif.equipement.reference}) expire le {certif.date_expiration.strftime('%d/%m/%Y')}."
                ),
                type_notification='WARNING',
                priorite='HAUTE'
            )
            resultats['alertes'] += 1

    logger.info(f"Vérification certifications : {resultats['expirees']} expirées, {resultats['alertes']} alertes")
    return resultats


# ========================================
# VÉRIFICATION MAINTENANCE PRÉVENTIVE
# ========================================
def verifier_maintenances_preventives():
    """
    À exécuter quotidiennement.
    Vérifie les plans de maintenance et crée des interventions automatiques si nécessaire.
    """
    from .models import Equipement, PlanMaintenancePreventive, InterventionMaintenance

    aujourdhui = date.today()
    resultats = {'interventions_creees': 0}

    # Vérifier par heures moteur
    plans_heures = PlanMaintenancePreventive.objects.filter(
        est_actif=True,
        type_frequence='HEURES'
    ).select_related('equipement')

    for plan in plans_heures:
        eq = plan.equipement
        if not eq.est_actif or eq.statut in ['EN_MAINTENANCE', 'EN_REPARATION', 'HORS_SERVICE', 'VENDU']:
            continue

        heures_depuis = float(eq.heures_moteur) - float(eq.heures_derniere_maintenance)
        if heures_depuis >= float(plan.seuil_heures):
            # Vérifier qu'une intervention n'est pas déjà planifiée
            existe = InterventionMaintenance.objects.filter(
                equipement=eq,
                plan_maintenance=plan,
                statut__in=['PLANIFIEE', 'EN_COURS']
            ).exists()

            if not existe:
                InterventionMaintenance.objects.create(
                    equipement=eq,
                    plan_maintenance=plan,
                    type_intervention='PREVENTIVE',
                    priorite='NORMALE',
                    statut='PLANIFIEE',
                    description_probleme=(
                        f"Maintenance préventive automatique : {plan.nom}\n"
                        f"Seuil : {plan.seuil_heures}h atteint ({eq.heures_moteur}h actuelles)"
                    ),
                    heures_moteur_debut=eq.heures_moteur,
                    km_debut=eq.kilometres,
                    date_planifiee=aujourdhui + timedelta(days=3),
                    cout_pieces=plan.cout_estime
                )
                resultats['interventions_creees'] += 1

    # Vérifier par calendrier
    plans_calendaires = PlanMaintenancePreventive.objects.filter(
        est_actif=True,
        type_frequence='CALENDAIRE',
        prochaine_execution__lte=aujourdhui
    ).select_related('equipement')

    for plan in plans_calendaires:
        eq = plan.equipement
        if not eq.est_actif or eq.statut in ['EN_MAINTENANCE', 'EN_REPARATION', 'HORS_SERVICE', 'VENDU']:
            continue

        existe = InterventionMaintenance.objects.filter(
            equipement=eq,
            plan_maintenance=plan,
            statut__in=['PLANIFIEE', 'EN_COURS']
        ).exists()

        if not existe:
            InterventionMaintenance.objects.create(
                equipement=eq,
                plan_maintenance=plan,
                type_intervention='PREVENTIVE',
                priorite='NORMALE',
                statut='PLANIFIEE',
                description_probleme=(
                    f"Maintenance préventive calendaire : {plan.nom}\n"
                    f"Date prévue : {plan.prochaine_execution.strftime('%d/%m/%Y')}"
                ),
                heures_moteur_debut=eq.heures_moteur,
                km_debut=eq.kilometres,
                date_planifiee=aujourdhui + timedelta(days=3),
                cout_pieces=plan.cout_estime
            )
            resultats['interventions_creees'] += 1

    if resultats['interventions_creees'] > 0:
        notifier_logisticiens(
            titre=f"🔧 {resultats['interventions_creees']} maintenance(s) préventive(s) planifiée(s)",
            message=f"{resultats['interventions_creees']} intervention(s) de maintenance préventive ont été créées automatiquement.",
            type_notification='INFO',
            priorite='NORMALE'
        )

    logger.info(f"Vérification maintenance : {resultats['interventions_creees']} interventions créées")
    return resultats


# ========================================
# VÉRIFICATION GARANTIES EXPIRÉES
# ========================================
def verifier_garanties():
    """
    À exécuter hebdomadairement.
    Vérifie les garanties qui expirent bientôt.
    """
    from .models import Equipement

    aujourdhui = date.today()
    dans_30j = aujourdhui + timedelta(days=30)

    equipements = Equipement.objects.filter(
        est_actif=True,
        date_fin_garantie__isnull=False,
        date_fin_garantie__gte=aujourdhui,
        date_fin_garantie__lte=dans_30j
    )

    for eq in equipements:
        jours = (eq.date_fin_garantie - aujourdhui).days
        notifier_logisticiens(
            titre=f"📋 Garantie expire dans {jours} jour(s) : {eq.nom}",
            message=(
                f"La garantie de l'équipement {eq.reference} - {eq.nom} "
                f"expire le {eq.date_fin_garantie.strftime('%d/%m/%Y')}."
            ),
            type_notification='WARNING',
            priorite='NORMALE'
        )

    return {'alertes': equipements.count()}