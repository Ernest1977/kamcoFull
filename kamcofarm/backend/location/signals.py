from django.db.models.signals import post_save, pre_save
from django.db.models import Sum
from django.dispatch import receiver
from django.utils import timezone
from datetime import date, timedelta
from decimal import Decimal
import logging

from .models import (
    ReservationEquipement,
    ContratLocation,
    EtatDesLieux,
    CautionLocation,
    ServiceAnnexe,
    FacturationLocation,
    PaiementLocation
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


def notifier_equipe_location(titre, message, type_notification='INFO', priorite='NORMALE'):
    """Notifie les logisticiens, commerciaux, directeurs et admins."""
    try:
        from django.contrib.auth import get_user_model
        User = get_user_model()
        users = User.objects.filter(
            role__in=['ADMIN', 'DIR', 'LOG', 'COMM'],
            is_active=True
        )
        for user in users:
            safe_notification(
                destinataire=user,
                titre=titre,
                message=message,
                type_notification=type_notification,
                priorite=priorite
            )
    except Exception as e:
        logger.warning(f"Notification équipe location impossible: {e}")


def envoyer_email_client(email, sujet, contenu):
    """Envoie un email au client de manière sécurisée."""
    try:
        from administration.email_service import envoyer_email, get_base_template
        html = get_base_template(sujet, contenu)
        envoyer_email(email, f"[KAMCO FARM] {sujet}", html)
    except Exception as e:
        logger.warning(f"Email client impossible: {e}")


# ========================================
# SIGNAL : RÉSERVATION
# ========================================
@receiver(pre_save, sender=ReservationEquipement)
def reservation_pre_save(sender, instance, **kwargs):
    """Capture l'ancien statut avant modification."""
    if instance.pk:
        try:
            ancien = ReservationEquipement.objects.get(pk=instance.pk)
            instance._ancien_statut = ancien.statut
        except ReservationEquipement.DoesNotExist:
            instance._ancien_statut = None
    else:
        instance._ancien_statut = None


@receiver(post_save, sender=ReservationEquipement)
def reservation_post_save(sender, instance, created, **kwargs):
    """Actions après création ou modification d'une réservation."""

    if created:
        safe_log(
            utilisateur=instance.creee_par,
            action='CREATION',
            module='SUPPLYCHAIN',
            description=(
                f"Réservation {instance.reference} créée : "
                f"{instance.equipement.nom} pour {instance.client_nom} "
                f"du {instance.date_debut_prevue} au {instance.date_fin_prevue}"
            ),
            objet_type='ReservationEquipement',
            objet_id=instance.id,
            objet_representation=str(instance)
        )

        # Email de confirmation au client
        if instance.client_email:
            envoyer_email_client(
                email=instance.client_email,
                sujet="Confirmation de votre demande de réservation",
                contenu=f"""
                <p style="color:#333; font-size:15px; line-height:1.8;">
                    Cher(e) <strong>{instance.client_nom}</strong>,
                </p>
                <p style="color:#333; font-size:15px; line-height:1.8;">
                    Nous avons bien reçu votre demande de réservation et nous l'étudions.
                </p>
                <table style="width:100%; background:#f9f9f9; border-radius:10px; margin:20px 0;">
                    <tr><td style="padding:15px;">
                        <p><strong>Référence :</strong> {instance.reference}</p>
                        <p><strong>Équipement :</strong> {instance.equipement.nom}</p>
                        <p><strong>Période :</strong> {instance.date_debut_prevue} → {instance.date_fin_prevue}</p>
                        <p><strong>Montant estimé :</strong> {instance.montant_estime} {instance.devise}</p>
                        <p><strong>Caution requise :</strong> {instance.caution_requise} {instance.devise}</p>
                    </td></tr>
                </table>
                <p style="color:#333; font-size:15px;">
                    Vous recevrez une confirmation sous 24h.
                </p>
                """
            )

        return

    # Changement de statut
    ancien_statut = getattr(instance, '_ancien_statut', None)
    if ancien_statut and ancien_statut != instance.statut:
        safe_log(
            utilisateur=None,
            action='MODIFICATION',
            module='SUPPLYCHAIN',
            description=f"Réservation {instance.reference} : {ancien_statut} → {instance.statut}",
            objet_type='ReservationEquipement',
            objet_id=instance.id
        )

        # Notification client par email selon le statut
        if instance.client_email:
            if instance.statut == 'CONFIRMEE':
                envoyer_email_client(
                    email=instance.client_email,
                    sujet="Réservation confirmée",
                    contenu=f"""
                    <p style="color:#333; font-size:15px; line-height:1.8;">
                        Cher(e) <strong>{instance.client_nom}</strong>,
                    </p>
                    <table style="width:100%; background:#f0f7f0; border-left:4px solid #4CAF50; border-radius:10px; margin:20px 0;">
                        <tr><td style="padding:20px;">
                            <p style="font-size:16px;">✅ <strong>Votre réservation a été confirmée !</strong></p>
                            <p><strong>Référence :</strong> {instance.reference}</p>
                            <p><strong>Équipement :</strong> {instance.equipement.nom}</p>
                            <p><strong>Période :</strong> {instance.date_debut_prevue} → {instance.date_fin_prevue}</p>
                            <p><strong>Montant :</strong> {instance.montant_estime} {instance.devise}</p>
                            <p><strong>Caution à verser :</strong> {instance.caution_requise} {instance.devise}</p>
                        </td></tr>
                    </table>
                    <p style="color:#333; font-size:15px;">
                        Veuillez vous présenter avec votre pièce d'identité et le montant de la caution.
                    </p>
                    """
                )

            elif instance.statut == 'ANNULEE':
                envoyer_email_client(
                    email=instance.client_email,
                    sujet="Réservation annulée",
                    contenu=f"""
                    <p style="color:#333; font-size:15px; line-height:1.8;">
                        Cher(e) <strong>{instance.client_nom}</strong>,
                    </p>
                    <table style="width:100%; background:#fff3e0; border-left:4px solid #FF9800; border-radius:10px; margin:20px 0;">
                        <tr><td style="padding:20px;">
                            <p style="font-size:16px;">❌ <strong>Votre réservation a été annulée</strong></p>
                            <p><strong>Référence :</strong> {instance.reference}</p>
                            <p><strong>Motif :</strong> {instance.motif_annulation or 'Non précisé'}</p>
                        </td></tr>
                    </table>
                    <p style="color:#333; font-size:15px;">
                        N'hésitez pas à nous contacter pour toute question.
                    </p>
                    """
                )

            elif instance.statut == 'REFUSEE':
                envoyer_email_client(
                    email=instance.client_email,
                    sujet="Réservation refusée",
                    contenu=f"""
                    <p style="color:#333; font-size:15px; line-height:1.8;">
                        Cher(e) <strong>{instance.client_nom}</strong>,
                    </p>
                    <table style="width:100%; background:#ffebee; border-left:4px solid #F44336; border-radius:10px; margin:20px 0;">
                        <tr><td style="padding:20px;">
                            <p style="font-size:16px;">⚠️ <strong>Votre réservation n'a pas pu être acceptée</strong></p>
                            <p><strong>Référence :</strong> {instance.reference}</p>
                            <p><strong>Motif :</strong> {instance.motif_annulation or 'Équipement non disponible'}</p>
                        </td></tr>
                    </table>
                    <p style="color:#333; font-size:15px;">
                        Nous vous invitons à consulter nos autres équipements disponibles.
                    </p>
                    """
                )


# ========================================
# SIGNAL : CONTRAT DE LOCATION
# ========================================
@receiver(pre_save, sender=ContratLocation)
def contrat_pre_save(sender, instance, **kwargs):
    """Capture l'ancien statut du contrat."""
    if instance.pk:
        try:
            ancien = ContratLocation.objects.get(pk=instance.pk)
            instance._ancien_statut = ancien.statut
        except ContratLocation.DoesNotExist:
            instance._ancien_statut = None
    else:
        instance._ancien_statut = None


@receiver(post_save, sender=ContratLocation)
def contrat_post_save(sender, instance, created, **kwargs):
    """Actions après création ou modification d'un contrat."""

    if created:
        safe_log(
            utilisateur=instance.creee_par,
            action='CREATION',
            module='SUPPLYCHAIN',
            description=(
                f"Contrat {instance.reference} créé : "
                f"{instance.equipement.nom} pour {instance.client_nom} "
                f"du {instance.date_debut} au {instance.date_fin_prevue} "
                f"({instance.montant_total_ttc} {instance.devise})"
            ),
            objet_type='ContratLocation',
            objet_id=instance.id,
            objet_representation=str(instance)
        )

        notifier_equipe_location(
            titre=f"📝 Nouveau contrat : {instance.reference}",
            message=(
                f"Contrat {instance.reference}\n"
                f"Équipement : {instance.equipement.reference} - {instance.equipement.nom}\n"
                f"Client : {instance.client_nom}\n"
                f"Période : {instance.date_debut} → {instance.date_fin_prevue}\n"
                f"Montant TTC : {instance.montant_total_ttc} {instance.devise}"
            ),
            type_notification='INFO',
            priorite='NORMALE'
        )
        return

    # Changement de statut
    ancien_statut = getattr(instance, '_ancien_statut', None)
    if ancien_statut and ancien_statut != instance.statut:
        safe_log(
            utilisateur=None,
            action='MODIFICATION',
            module='SUPPLYCHAIN',
            description=f"Contrat {instance.reference} : {ancien_statut} → {instance.statut}",
            objet_type='ContratLocation',
            objet_id=instance.id
        )

        # Contrat activé
        if instance.statut == 'ACTIF':
            notifier_equipe_location(
                titre=f"✅ Contrat activé : {instance.reference}",
                message=(
                    f"Le contrat {instance.reference} est maintenant actif.\n"
                    f"Équipement {instance.equipement.nom} en location chez {instance.client_nom}."
                ),
                type_notification='SUCCESS',
                priorite='NORMALE'
            )

            if instance.client_email:
                envoyer_email_client(
                    email=instance.client_email,
                    sujet=f"Contrat de location activé - {instance.reference}",
                    contenu=f"""
                    <p style="color:#333; font-size:15px; line-height:1.8;">
                        Cher(e) <strong>{instance.client_nom}</strong>,
                    </p>
                    <table style="width:100%; background:#f0f7f0; border-left:4px solid #4CAF50; border-radius:10px; margin:20px 0;">
                        <tr><td style="padding:20px;">
                            <p style="font-size:16px;">✅ <strong>Votre contrat de location est actif</strong></p>
                            <p><strong>Référence :</strong> {instance.reference}</p>
                            <p><strong>Équipement :</strong> {instance.equipement.nom}</p>
                            <p><strong>Période :</strong> {instance.date_debut} → {instance.date_fin_prevue}</p>
                            <p><strong>Montant TTC :</strong> {instance.montant_total_ttc} {instance.devise}</p>
                        </td></tr>
                    </table>
                    """
                )

        # Contrat terminé
        elif instance.statut == 'TERMINE':
            notifier_equipe_location(
                titre=f"🏁 Contrat terminé : {instance.reference}",
                message=(
                    f"Le contrat {instance.reference} est terminé.\n"
                    f"Équipement {instance.equipement.nom} retourné.\n"
                    f"Retard : {instance.jours_retard} jour(s)\n"
                    f"Pénalités : {instance.montant_penalites} {instance.devise}"
                ),
                type_notification='INFO',
                priorite='NORMALE' if instance.jours_retard == 0 else 'HAUTE'
            )

            if instance.client_email:
                retard_html = ""
                if instance.jours_retard > 0:
                    retard_html = f"""
                    <table style="width:100%; background:#fff3e0; border-left:4px solid #FF9800; border-radius:10px; margin:15px 0;">
                        <tr><td style="padding:15px;">
                            <p>⚠️ <strong>Retard constaté :</strong> {instance.jours_retard} jour(s)</p>
                            <p><strong>Pénalités :</strong> {instance.montant_penalites} {instance.devise}</p>
                        </td></tr>
                    </table>
                    """

                envoyer_email_client(
                    email=instance.client_email,
                    sujet=f"Fin de contrat de location - {instance.reference}",
                    contenu=f"""
                    <p style="color:#333; font-size:15px; line-height:1.8;">
                        Cher(e) <strong>{instance.client_nom}</strong>,
                    </p>
                    <p style="color:#333; font-size:15px;">
                        Votre contrat de location est terminé. Merci de votre confiance !
                    </p>
                    <table style="width:100%; background:#f9f9f9; border-radius:10px; margin:20px 0;">
                        <tr><td style="padding:15px;">
                            <p><strong>Référence :</strong> {instance.reference}</p>
                            <p><strong>Équipement :</strong> {instance.equipement.nom}</p>
                            <p><strong>Durée effective :</strong> {instance.jours_location} jour(s)</p>
                            <p><strong>Heures utilisées :</strong> {instance.heures_utilisees}h</p>
                            <p><strong>Km parcourus :</strong> {instance.km_parcourus} km</p>
                        </td></tr>
                    </table>
                    {retard_html}
                    <p style="color:#333; font-size:15px;">
                        La facture finale vous sera envoyée prochainement.
                    </p>
                    """
                )

        # Contrat résilié
        elif instance.statut == 'RESILIE':
            notifier_equipe_location(
                titre=f"❌ Contrat résilié : {instance.reference}",
                message=f"Le contrat {instance.reference} a été résilié. Équipement {instance.equipement.nom} libéré.",
                type_notification='WARNING',
                priorite='HAUTE'
            )

        # Option d'achat exercée
        elif instance.option_achat_exercee:
            notifier_equipe_location(
                titre=f"🏷️ Option d'achat exercée : {instance.equipement.nom}",
                message=(
                    f"Le client {instance.client_nom} a exercé son option d'achat.\n"
                    f"Contrat : {instance.reference}\n"
                    f"Équipement : {instance.equipement.reference}\n"
                    f"Prix : {instance.prix_option_achat} {instance.devise}"
                ),
                type_notification='SUCCESS',
                priorite='HAUTE'
            )

        # Litige
        elif instance.statut == 'LITIGE':
            notifier_equipe_location(
                titre=f"⚖️ Litige sur contrat : {instance.reference}",
                message=f"Le contrat {instance.reference} est en litige avec {instance.client_nom}.",
                type_notification='ERROR',
                priorite='URGENTE'
            )


# ========================================
# SIGNAL : ÉTAT DES LIEUX
# ========================================
@receiver(post_save, sender=EtatDesLieux)
def etat_des_lieux_post_save(sender, instance, created, **kwargs):
    """Actions après création d'un état des lieux."""
    if not created:
        return

    contrat = instance.contrat

    safe_log(
        utilisateur=instance.realise_par,
        action='CREATION',
        module='SUPPLYCHAIN',
        description=(
            f"État des lieux {instance.get_type_etat_display()} réalisé "
            f"pour contrat {contrat.reference} - État : {instance.get_etat_general_display()}"
        ),
        objet_type='EtatDesLieux',
        objet_id=instance.id
    )

    # Alerte si dommages constatés au retour
    if instance.type_etat == 'RETOUR' and instance.etat_general in ['ENDOMMAGE', 'HORS_SERVICE']:
        notifier_equipe_location(
            titre=f"🚨 Dommages constatés au retour : {contrat.equipement.nom}",
            message=(
                f"Contrat : {contrat.reference}\n"
                f"Client : {contrat.client_nom}\n"
                f"État général : {instance.get_etat_general_display()}\n"
                f"Carrosserie : {instance.get_etat_carrosserie_display()}\n"
                f"Moteur : {instance.get_etat_moteur_display()}\n"
                f"Pneus : {instance.get_etat_pneus_display()}\n"
                f"Hydraulique : {instance.get_etat_hydraulique_display()}\n"
                f"Électrique : {instance.get_etat_electrique_display()}\n\n"
                f"Dommages : {instance.dommages_constates or 'Non détaillés'}"
            ),
            type_notification='ERROR',
            priorite='URGENTE'
        )

        # Créer automatiquement une intervention maintenance si hors service
        if instance.etat_general == 'HORS_SERVICE':
            try:
                from equipements.models import InterventionMaintenance
                InterventionMaintenance.objects.create(
                    equipement=contrat.equipement,
                    type_intervention='CORRECTIVE',
                    priorite='URGENTE',
                    statut='PLANIFIEE',
                    description_probleme=(
                        f"Dommages constatés lors du retour de location.\n"
                        f"Contrat : {contrat.reference}\n"
                        f"Client : {contrat.client_nom}\n"
                        f"Dommages : {instance.dommages_constates or 'Voir état des lieux'}"
                    ),
                    heures_moteur_debut=instance.heures_moteur,
                    km_debut=instance.kilometres,
                    signale_par=instance.realise_par
                )

                # Mettre l'équipement en réparation
                contrat.equipement.statut = 'EN_REPARATION'
                contrat.equipement.save(update_fields=['statut'])

            except Exception as e:
                logger.warning(f"Création intervention auto impossible: {e}")

    # Comparer sortie vs retour si c'est un retour
    if instance.type_etat == 'RETOUR':
        edl_sortie = EtatDesLieux.objects.filter(
            contrat=contrat,
            type_etat='SORTIE'
        ).first()

        if edl_sortie:
            differences = []
            champs_etat = [
                ('etat_general', 'État général'),
                ('etat_carrosserie', 'Carrosserie'),
                ('etat_moteur', 'Moteur'),
                ('etat_pneus', 'Pneus'),
                ('etat_hydraulique', 'Hydraulique'),
                ('etat_electrique', 'Électrique'),
                ('etat_accessoires', 'Accessoires'),
            ]

            etat_ordre = ['NEUF', 'EXCELLENT', 'BON', 'ACCEPTABLE', 'ENDOMMAGE', 'HORS_SERVICE']

            for champ, label in champs_etat:
                val_sortie = getattr(edl_sortie, champ)
                val_retour = getattr(instance, champ)

                if val_sortie != val_retour:
                    idx_sortie = etat_ordre.index(val_sortie) if val_sortie in etat_ordre else 0
                    idx_retour = etat_ordre.index(val_retour) if val_retour in etat_ordre else 0

                    if idx_retour > idx_sortie:
                        differences.append(f"• {label} : {val_sortie} → {val_retour} ⬇️")

            if differences:
                diff_text = "\n".join(differences)
                notifier_equipe_location(
                    titre=f"📊 Dégradations constatées : {contrat.equipement.nom}",
                    message=(
                        f"Comparaison EDL sortie vs retour - Contrat {contrat.reference}\n"
                        f"Client : {contrat.client_nom}\n\n"
                        f"Dégradations :\n{diff_text}"
                    ),
                    type_notification='WARNING',
                    priorite='HAUTE'
                )

            # Différence carburant
            diff_carburant = edl_sortie.niveau_carburant_pourcentage - instance.niveau_carburant_pourcentage
            if diff_carburant > 20:
                notifier_equipe_location(
                    titre=f"⛽ Carburant non restitué : {contrat.equipement.nom}",
                    message=(
                        f"Contrat {contrat.reference}\n"
                        f"Carburant sortie : {edl_sortie.niveau_carburant_pourcentage}%\n"
                        f"Carburant retour : {instance.niveau_carburant_pourcentage}%\n"
                        f"Différence : {diff_carburant}%\n"
                        f"Un supplément carburant pourrait être facturé."
                    ),
                    type_notification='WARNING',
                    priorite='NORMALE'
                )


# ========================================
# SIGNAL : CAUTION
# ========================================
@receiver(pre_save, sender=CautionLocation)
def caution_pre_save(sender, instance, **kwargs):
    """Capture l'ancien statut."""
    if instance.pk:
        try:
            ancien = CautionLocation.objects.get(pk=instance.pk)
            instance._ancien_statut = ancien.statut
        except CautionLocation.DoesNotExist:
            instance._ancien_statut = None
    else:
        instance._ancien_statut = None


@receiver(post_save, sender=CautionLocation)
def caution_post_save(sender, instance, created, **kwargs):
    """Actions après modification d'une caution."""

    if created:
        safe_log(
            utilisateur=instance.enregistree_par,
            action='CREATION',
            module='FINANCE',
            description=(
                f"Caution {instance.reference} créée pour contrat {instance.contrat.reference} : "
                f"{instance.montant_requis} {instance.devise}"
            ),
            objet_type='CautionLocation',
            objet_id=instance.id
        )
        return

    ancien_statut = getattr(instance, '_ancien_statut', None)
    if ancien_statut and ancien_statut != instance.statut:
        safe_log(
            utilisateur=None,
            action='MODIFICATION',
            module='FINANCE',
            description=f"Caution {instance.reference} : {ancien_statut} → {instance.statut}",
            objet_type='CautionLocation',
            objet_id=instance.id
        )

        # Caution versée
        if instance.statut == 'VERSEE':
            notifier_equipe_location(
                titre=f"💰 Caution versée : {instance.reference}",
                message=(
                    f"Caution versée pour contrat {instance.contrat.reference}\n"
                    f"Montant : {instance.montant_verse} {instance.devise}\n"
                    f"Mode : {instance.get_mode_paiement_display()}"
                ),
                type_notification='SUCCESS',
                priorite='NORMALE'
            )

        # Caution retenue
        elif instance.statut == 'RETENUE':
            notifier_equipe_location(
                titre=f"⚠️ Caution retenue : {instance.reference}",
                message=(
                    f"Caution retenue pour contrat {instance.contrat.reference}\n"
                    f"Montant retenu : {instance.montant_retenu} {instance.devise}\n"
                    f"Motif : {instance.motif_retenue or 'Non précisé'}"
                ),
                type_notification='WARNING',
                priorite='HAUTE'
            )

            # Email client
            contrat = instance.contrat
            if contrat.client_email:
                envoyer_email_client(
                    email=contrat.client_email,
                    sujet=f"Information sur votre caution - {instance.reference}",
                    contenu=f"""
                    <p style="color:#333; font-size:15px; line-height:1.8;">
                        Cher(e) <strong>{contrat.client_nom}</strong>,
                    </p>
                    <table style="width:100%; background:#fff3e0; border-left:4px solid #FF9800; border-radius:10px; margin:20px 0;">
                        <tr><td style="padding:20px;">
                            <p><strong>Caution :</strong> {instance.reference}</p>
                            <p><strong>Montant versé :</strong> {instance.montant_verse} {instance.devise}</p>
                            <p><strong>Montant retenu :</strong> {instance.montant_retenu} {instance.devise}</p>
                            <p><strong>Motif :</strong> {instance.motif_retenue or 'Dommages constatés'}</p>
                            <p><strong>Montant restitué :</strong> {instance.montant_restitue} {instance.devise}</p>
                        </td></tr>
                    </table>
                    <p style="color:#333; font-size:15px;">
                        Pour toute contestation, veuillez nous contacter dans les 48h.
                    </p>
                    """
                )

        # Caution restituée
        elif instance.statut in ['RESTITUEE', 'PARTIELLEMENT_RESTITUEE']:
            contrat = instance.contrat
            if contrat.client_email:
                envoyer_email_client(
                    email=contrat.client_email,
                    sujet=f"Restitution de votre caution - {instance.reference}",
                    contenu=f"""
                    <p style="color:#333; font-size:15px; line-height:1.8;">
                        Cher(e) <strong>{contrat.client_nom}</strong>,
                    </p>
                    <table style="width:100%; background:#f0f7f0; border-left:4px solid #4CAF50; border-radius:10px; margin:20px 0;">
                        <tr><td style="padding:20px;">
                            <p>✅ <strong>Votre caution a été restituée</strong></p>
                            <p><strong>Montant restitué :</strong> {instance.montant_restitue} {instance.devise}</p>
                            <p><strong>Montant retenu :</strong> {instance.montant_retenu} {instance.devise}</p>
                        </td></tr>
                    </table>
                    """
                )


# ========================================
# SIGNAL : FACTURATION
# ========================================
@receiver(pre_save, sender=FacturationLocation)
def facturation_pre_save(sender, instance, **kwargs):
    """Capture l'ancien statut."""
    if instance.pk:
        try:
            ancien = FacturationLocation.objects.get(pk=instance.pk)
            instance._ancien_statut = ancien.statut
        except FacturationLocation.DoesNotExist:
            instance._ancien_statut = None
    else:
        instance._ancien_statut = None


@receiver(post_save, sender=FacturationLocation)
def facturation_post_save(sender, instance, created, **kwargs):
    """Actions après création ou modification d'une facturation."""

    if created:
        safe_log(
            utilisateur=instance.emise_par,
            action='CREATION',
            module='FINANCE',
            description=(
                f"Facture location {instance.reference} créée : "
                f"{instance.montant_ttc} {instance.devise} pour {instance.client_nom}"
            ),
            objet_type='FacturationLocation',
            objet_id=instance.id
        )
        return

    ancien_statut = getattr(instance, '_ancien_statut', None)
    if ancien_statut and ancien_statut != instance.statut:
        safe_log(
            utilisateur=None,
            action='MODIFICATION',
            module='FINANCE',
            description=f"Facture location {instance.reference} : {ancien_statut} → {instance.statut}",
            objet_type='FacturationLocation',
            objet_id=instance.id
        )

        # Facture payée
        if instance.statut == 'PAYEE':
            notifier_equipe_location(
                titre=f"💰 Facture location payée : {instance.reference}",
                message=(
                    f"Facture {instance.reference} entièrement payée.\n"
                    f"Montant : {instance.montant_ttc} {instance.devise}\n"
                    f"Client : {instance.client_nom}"
                ),
                type_notification='SUCCESS',
                priorite='NORMALE'
            )

        # Facture en retard
        elif instance.statut == 'EN_RETARD':
            notifier_equipe_location(
                titre=f"🔴 Facture en retard : {instance.reference}",
                message=(
                    f"La facture {instance.reference} est en retard de paiement.\n"
                    f"Montant dû : {instance.solde_restant} {instance.devise}\n"
                    f"Client : {instance.client_nom}\n"
                    f"Échéance : {instance.date_echeance}"
                ),
                type_notification='ERROR',
                priorite='URGENTE'
            )


# ========================================
# SIGNAL : PAIEMENT
# ========================================
@receiver(post_save, sender=PaiementLocation)
def paiement_post_save(sender, instance, created, **kwargs):
    """Actions après un paiement."""

    if created:
        safe_log(
            utilisateur=None,
            action='CREATION',
            module='FINANCE',
            description=(
                f"Paiement {instance.reference} enregistré : "
                f"{instance.montant} {instance.facturation.devise} "
                f"sur facture {instance.facturation.reference}"
            ),
            objet_type='PaiementLocation',
            objet_id=instance.id
        )

    # Si confirmé, mettre à jour la facture
    if instance.statut == 'CONFIRME':
        facture = instance.facturation
        total_paye = facture.paiements.filter(
            statut='CONFIRME'
        ).aggregate(total=Sum('montant'))['total'] or Decimal('0')

        facture.montant_paye = total_paye
        facture.save()

        safe_log(
            utilisateur=instance.confirme_par,
            action='MODIFICATION',
            module='FINANCE',
            description=(
                f"Paiement {instance.reference} confirmé. "
                f"Facture {facture.reference} : payé {total_paye}/{facture.montant_ttc} {facture.devise}"
            ),
            objet_type='PaiementLocation',
            objet_id=instance.id
        )


# ========================================
# SIGNAL : SERVICE ANNEXE
# ========================================
@receiver(post_save, sender=ServiceAnnexe)
def service_annexe_post_save(sender, instance, created, **kwargs):
    """Met à jour le montant services du contrat après ajout d'un service."""

    if created:
        contrat = instance.contrat
        total_services = contrat.services_annexes.aggregate(
            total=Sum('montant_total')
        )['total'] or Decimal('0')

        contrat.montant_services_ht = total_services
        contrat.save()

        safe_log(
            utilisateur=None,
            action='CREATION',
            module='SUPPLYCHAIN',
            description=(
                f"Service annexe ajouté au contrat {contrat.reference} : "
                f"{instance.get_type_service_display()} - {instance.montant_total} FCFA"
            ),
            objet_type='ServiceAnnexe',
            objet_id=instance.id
        )