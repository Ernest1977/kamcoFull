from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone
from datetime import date, timedelta
import logging

from .models import (
    Equipement,
    CertificationEquipement,
    InterventionMaintenance,
    ConsommationCarburant,
    MouvementEquipement,
    CycleVieEquipement
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


def notifier_logisticiens(titre, message, type_notification='WARNING', priorite='HAUTE'):
    """Envoie une notification à tous les logisticiens, directeurs et admins."""
    try:
        from django.contrib.auth import get_user_model
        User = get_user_model()
        users = User.objects.filter(role__in=['ADMIN', 'DIR', 'LOG'], is_active=True)
        for user in users:
            safe_notification(
                destinataire=user,
                titre=titre,
                message=message,
                type_notification=type_notification,
                priorite=priorite
            )
    except Exception as e:
        logger.warning(f"Notification logisticiens impossible: {e}")


# ========================================
# SIGNAL : ÉQUIPEMENT MODIFIÉ
# ========================================
@receiver(pre_save, sender=Equipement)
def equipement_pre_save(sender, instance, **kwargs):
    """Détecte les changements de statut et de compteurs avant sauvegarde."""
    if not instance.pk:
        return

    try:
        ancien = Equipement.objects.get(pk=instance.pk)
        instance._ancien_statut = ancien.statut
        instance._anciennes_heures = ancien.heures_moteur
        instance._anciens_km = ancien.kilometres
    except Equipement.DoesNotExist:
        instance._ancien_statut = None
        instance._anciennes_heures = 0
        instance._anciens_km = 0


@receiver(post_save, sender=Equipement)
def equipement_post_save(sender, instance, created, **kwargs):
    """Actions après la sauvegarde d'un équipement."""

    if created:
        # Log création
        safe_log(
            utilisateur=None,
            action='CREATION',
            module='SUPPLYCHAIN',
            description=f"Nouvel équipement créé : {instance.reference} - {instance.nom}",
            objet_type='Equipement',
            objet_id=instance.id,
            objet_representation=str(instance)
        )

        # Créer automatiquement un événement cycle de vie
        CycleVieEquipement.objects.create(
            equipement=instance,
            evenement='ACQUISITION',
            date_evenement=instance.date_acquisition,
            description=f"Acquisition {instance.get_type_acquisition_display()} - {instance.nom}",
            montant=instance.prix_acquisition
        )
        return

    # Détecter changement de statut
    ancien_statut = getattr(instance, '_ancien_statut', None)
    if ancien_statut and ancien_statut != instance.statut:
        safe_log(
            utilisateur=None,
            action='MODIFICATION',
            module='SUPPLYCHAIN',
            description=f"Équipement {instance.reference} : statut {ancien_statut} → {instance.statut}",
            objet_type='Equipement',
            objet_id=instance.id
        )

        # Notification si hors service
        if instance.statut == 'HORS_SERVICE':
            notifier_logisticiens(
                titre=f"⚠️ Équipement hors service : {instance.nom}",
                message=f"L'équipement {instance.reference} ({instance.nom}) a été mis hors service.",
                type_notification='ERROR',
                priorite='URGENTE'
            )

    # Vérifier seuil de maintenance après mise à jour des compteurs
    anciennes_heures = getattr(instance, '_anciennes_heures', 0)
    if float(instance.heures_moteur) > float(anciennes_heures):
        if instance.maintenance_requise:
            notifier_logisticiens(
                titre=f"🔧 Maintenance préventive requise : {instance.nom}",
                message=(
                    f"L'équipement {instance.reference} a atteint {instance.heures_moteur}h. "
                    f"Seuil de maintenance : {instance.seuil_maintenance_heures}h depuis la dernière révision."
                ),
                type_notification='WARNING',
                priorite='HAUTE'
            )


# ========================================
# SIGNAL : CERTIFICATION SAUVEGARDÉE
# ========================================
@receiver(post_save, sender=CertificationEquipement)
def certification_post_save(sender, instance, created, **kwargs):
    """Vérifie l'expiration des certifications."""

    if created:
        safe_log(
            utilisateur=None,
            action='CREATION',
            module='SUPPLYCHAIN',
            description=f"Certification ajoutée : {instance.nom} pour {instance.equipement.nom}",
            objet_type='CertificationEquipement',
            objet_id=instance.id
        )

    # Vérifier si la certification est expirée
    if instance.est_expire and instance.statut != 'EXPIRE':
        instance.statut = 'EXPIRE'
        CertificationEquipement.objects.filter(pk=instance.pk).update(statut='EXPIRE')

        notifier_logisticiens(
            titre=f"🚨 Certification expirée : {instance.nom}",
            message=(
                f"La certification '{instance.nom}' de l'équipement {instance.equipement.nom} "
                f"({instance.equipement.reference}) a expiré le {instance.date_expiration.strftime('%d/%m/%Y')}."
            ),
            type_notification='ERROR',
            priorite='URGENTE'
        )

    # Alerter si expiration proche
    elif instance.alerte_active:
        notifier_logisticiens(
            titre=f"⏰ Certification bientôt expirée : {instance.nom}",
            message=(
                f"La certification '{instance.nom}' de l'équipement {instance.equipement.nom} "
                f"expire dans {instance.jours_restants} jours ({instance.date_expiration.strftime('%d/%m/%Y')})."
            ),
            type_notification='WARNING',
            priorite='HAUTE'
        )


# ========================================
# SIGNAL : INTERVENTION MAINTENANCE
# ========================================
@receiver(pre_save, sender=InterventionMaintenance)
def intervention_pre_save(sender, instance, **kwargs):
    """Capture l'ancien statut de l'intervention."""
    if instance.pk:
        try:
            ancien = InterventionMaintenance.objects.get(pk=instance.pk)
            instance._ancien_statut = ancien.statut
        except InterventionMaintenance.DoesNotExist:
            instance._ancien_statut = None
    else:
        instance._ancien_statut = None


@receiver(post_save, sender=InterventionMaintenance)
def intervention_post_save(sender, instance, created, **kwargs):
    """Actions après création ou modification d'une intervention."""

    if created:
        safe_log(
            utilisateur=instance.signale_par,
            action='CREATION',
            module='SUPPLYCHAIN',
            description=(
                f"Intervention {instance.reference} créée : "
                f"{instance.get_type_intervention_display()} sur {instance.equipement.nom}"
            ),
            objet_type='InterventionMaintenance',
            objet_id=instance.id
        )

        # Notification si urgence
        if instance.priorite in ['URGENTE', 'CRITIQUE']:
            iot_mention = " (détectée par IoT)" if instance.declenchee_par_iot else ""
            notifier_logisticiens(
                titre=f"🚨 Intervention urgente{iot_mention} : {instance.equipement.nom}",
                message=(
                    f"Intervention {instance.reference} - {instance.get_type_intervention_display()}\n"
                    f"Équipement : {instance.equipement.reference} - {instance.equipement.nom}\n"
                    f"Problème : {instance.description_probleme[:200]}"
                ),
                type_notification='ERROR',
                priorite='URGENTE'
            )

        # Notifier le technicien assigné
        if instance.technicien:
            safe_notification(
                destinataire=instance.technicien,
                titre=f"Intervention assignée : {instance.equipement.nom}",
                message=(
                    f"L'intervention {instance.reference} ({instance.get_type_intervention_display()}) "
                    f"vous a été assignée sur l'équipement {instance.equipement.nom}."
                ),
                type_notification='TACHE',
                priorite=instance.priorite
            )

        return

    # Changement de statut
    ancien_statut = getattr(instance, '_ancien_statut', None)
    if ancien_statut and ancien_statut != instance.statut:
        safe_log(
            utilisateur=instance.technicien,
            action='MODIFICATION',
            module='SUPPLYCHAIN',
            description=(
                f"Intervention {instance.reference} : {ancien_statut} → {instance.statut}"
            ),
            objet_type='InterventionMaintenance',
            objet_id=instance.id
        )

        # Si terminée, mettre à jour l'équipement et son plan maintenance
        if instance.statut == 'TERMINEE':
            eq = instance.equipement

            # Mettre à jour le plan de maintenance si applicable
            if instance.plan_maintenance:
                plan = instance.plan_maintenance
                plan.derniere_execution = timezone.now().date()

                # Calculer prochaine exécution
                if plan.periodicite == 'HEBDOMADAIRE':
                    plan.prochaine_execution = plan.derniere_execution + timedelta(weeks=1)
                elif plan.periodicite == 'MENSUEL':
                    plan.prochaine_execution = plan.derniere_execution + timedelta(days=30)
                elif plan.periodicite == 'TRIMESTRIEL':
                    plan.prochaine_execution = plan.derniere_execution + timedelta(days=90)
                elif plan.periodicite == 'SEMESTRIEL':
                    plan.prochaine_execution = plan.derniere_execution + timedelta(days=180)
                elif plan.periodicite == 'ANNUEL':
                    plan.prochaine_execution = plan.derniere_execution + timedelta(days=365)

                plan.save()

            notifier_logisticiens(
                titre=f"✅ Intervention terminée : {eq.nom}",
                message=(
                    f"L'intervention {instance.reference} sur {eq.reference} est terminée.\n"
                    f"Coût total : {instance.cout_total} FCFA\n"
                    f"Durée : {instance.duree_reelle_heures}h"
                ),
                type_notification='SUCCESS',
                priorite='NORMALE'
            )


# ========================================
# SIGNAL : CONSOMMATION CARBURANT
# ========================================
@receiver(post_save, sender=ConsommationCarburant)
def consommation_post_save(sender, instance, created, **kwargs):
    """Détecte les anomalies de consommation."""
    if not created:
        return

    eq = instance.equipement

    # Vérifier si la consommation est anormale (> 2x la moyenne)
    if eq.consommation_moyenne and eq.consommation_moyenne > 0:
        # Calculer la consommation réelle
        derniers_pleins = ConsommationCarburant.objects.filter(
            equipement=eq
        ).order_by('-date_plein')[:5]

        if derniers_pleins.count() >= 2:
            from django.db.models import Avg
            moyenne_recente = derniers_pleins.aggregate(
                avg=Avg('quantite_litres')
            )['avg'] or 0

            if instance.quantite_litres > moyenne_recente * 2 and moyenne_recente > 0:
                notifier_logisticiens(
                    titre=f"⛽ Consommation anormale : {eq.nom}",
                    message=(
                        f"Le plein de {instance.quantite_litres}L est anormalement élevé "
                        f"par rapport à la moyenne récente de {moyenne_recente:.1f}L.\n"
                        f"Vérifier l'équipement {eq.reference}."
                    ),
                    type_notification='WARNING',
                    priorite='HAUTE'
                )

    safe_log(
        utilisateur=instance.enregistre_par,
        action='CREATION',
        module='SUPPLYCHAIN',
        description=(
            f"Plein carburant : {instance.quantite_litres}L pour {eq.nom} "
            f"({instance.cout_total} FCFA)"
        ),
        objet_type='ConsommationCarburant',
        objet_id=instance.id
    )


# ========================================
# SIGNAL : MOUVEMENT ÉQUIPEMENT
# ========================================
@receiver(post_save, sender=MouvementEquipement)
def mouvement_post_save(sender, instance, created, **kwargs):
    """Log et notification après mouvement d'équipement."""
    if not created:
        return

    safe_log(
        utilisateur=instance.effectue_par,
        action='MODIFICATION',
        module='SUPPLYCHAIN',
        description=(
            f"Mouvement {instance.get_type_mouvement_display()} : "
            f"{instance.equipement.nom} de {instance.lieu_depart} → {instance.lieu_arrivee}"
        ),
        objet_type='MouvementEquipement',
        objet_id=instance.id
    )


# ========================================
# SIGNAL : CYCLE DE VIE
# ========================================
@receiver(post_save, sender=CycleVieEquipement)
def cycle_vie_post_save(sender, instance, created, **kwargs):
    """Notification pour événements majeurs du cycle de vie."""
    if not created:
        return

    evenements_importants = ['VENTE', 'MISE_AU_REBUT', 'OPTION_ACHAT', 'RENOVATION']

    if instance.evenement in evenements_importants:
        notifier_logisticiens(
            titre=f"📋 Cycle de vie : {instance.equipement.nom}",
            message=(
                f"Événement : {instance.get_evenement_display()}\n"
                f"Équipement : {instance.equipement.reference}\n"
                f"Date : {instance.date_evenement.strftime('%d/%m/%Y')}\n"
                f"Montant : {instance.montant} FCFA\n"
                f"Description : {instance.description[:200]}"
            ),
            type_notification='INFO',
            priorite='HAUTE'
        )

    safe_log(
        utilisateur=instance.enregistre_par,
        action='CREATION',
        module='SUPPLYCHAIN',
        description=(
            f"Cycle de vie {instance.get_evenement_display()} : "
            f"{instance.equipement.nom} - {instance.montant} FCFA"
        ),
        objet_type='CycleVieEquipement',
        objet_id=instance.id
    )