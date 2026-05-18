from datetime import timedelta
from django.utils import timezone
from decimal import Decimal
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


def traiter_donnee_telemetrie(capteur, valeur, timestamp, latitude=None, longitude=None, metadata=None):
    """
    Traite une donnée de télémétrie reçue d'un capteur IoT.
    
    1. Enregistre la donnée
    2. Met à jour le capteur
    3. Met à jour l'équipement (GPS, compteurs)
    4. Vérifie les règles d'alerte
    5. Crée des alertes si nécessaire
    6. Déclenche des interventions si critique
    """
    from .models import (
        DonneesTelemetrie, AlerteIoT, RegleAlerteIoT,
        InterventionMaintenance
    )

    equipement = capteur.equipement
    valeur_decimal = Decimal(str(valeur))

    # ---- 1. Enregistrer la donnée ----
    est_anomalie = False

    if capteur.seuil_max and valeur_decimal > capteur.seuil_max:
        est_anomalie = True
    if capteur.seuil_min and valeur_decimal < capteur.seuil_min:
        est_anomalie = True

    donnee = DonneesTelemetrie.objects.create(
        capteur=capteur,
        valeur=valeur_decimal,
        unite=capteur.unite_mesure,
        latitude=latitude,
        longitude=longitude,
        metadata=metadata,
        est_anomalie=est_anomalie,
        timestamp=timestamp
    )

    # ---- 2. Mettre à jour le capteur ----
    capteur.derniere_valeur = valeur_decimal
    capteur.derniere_lecture = timestamp
    capteur.statut = 'ACTIF'
    capteur.save(update_fields=['derniere_valeur', 'derniere_lecture', 'statut'])

    # ---- 3. Mettre à jour l'équipement ----
    if latitude and longitude:
        equipement.latitude = latitude
        equipement.longitude = longitude
        equipement.save(update_fields=['latitude', 'longitude'])

    if capteur.type_capteur == 'HEURES_MOTEUR' and valeur_decimal > equipement.heures_moteur:
        equipement.heures_moteur = valeur_decimal
        equipement.save(update_fields=['heures_moteur'])

    if capteur.type_capteur == 'GPS' and metadata:
        vitesse = metadata.get('vitesse_kmh')
        if vitesse is not None:
            pass  # Peut être utilisé pour d'autres traitements

    # ---- 4. Vérifier les règles d'alerte ----
    regles = RegleAlerteIoT.objects.filter(
        type_capteur=capteur.type_capteur,
        est_active=True
    )

    for regle in regles:
        alerte_declenchee = False
        message_alerte = ""

        if regle.condition == 'SUP' and valeur_decimal > regle.valeur_seuil:
            alerte_declenchee = True
            message_alerte = f"Valeur {valeur_decimal}{capteur.unite_mesure or ''} dépasse le seuil de {regle.valeur_seuil}"

        elif regle.condition == 'INF' and valeur_decimal < regle.valeur_seuil:
            alerte_declenchee = True
            message_alerte = f"Valeur {valeur_decimal}{capteur.unite_mesure or ''} en dessous du seuil de {regle.valeur_seuil}"

        elif regle.condition == 'ENTRE' and regle.valeur_seuil_max:
            if not (regle.valeur_seuil <= valeur_decimal <= regle.valeur_seuil_max):
                alerte_declenchee = True
                message_alerte = f"Valeur {valeur_decimal} hors plage [{regle.valeur_seuil} - {regle.valeur_seuil_max}]"

        elif regle.condition == 'HORS' and regle.valeur_seuil_max:
            if regle.valeur_seuil <= valeur_decimal <= regle.valeur_seuil_max:
                pass
            else:
                alerte_declenchee = True
                message_alerte = f"Valeur {valeur_decimal} hors plage attendue"

        elif regle.condition == 'VARIATION' and regle.pourcentage_variation:
            # Comparer avec la lecture précédente
            precedente = DonneesTelemetrie.objects.filter(
                capteur=capteur
            ).exclude(id=donnee.id).order_by('-timestamp').first()

            if precedente and precedente.valeur > 0:
                variation = abs(float(valeur_decimal - precedente.valeur) / float(precedente.valeur) * 100)
                if variation >= float(regle.pourcentage_variation):
                    alerte_declenchee = True
                    message_alerte = f"Variation brusque de {variation:.1f}% détectée (seuil: {regle.pourcentage_variation}%)"

        if not alerte_declenchee:
            continue

        # ---- 5. Vérifier le cooldown ----
        derniere_alerte = AlerteIoT.objects.filter(
            capteur=capteur,
            date_alerte__gte=timezone.now() - timedelta(minutes=regle.cooldown_minutes)
        ).exists()

        if derniere_alerte:
            continue

        # ---- 6. Déterminer la sévérité ----
        severite = regle.severite

        if capteur.seuil_critique_max and valeur_decimal >= capteur.seuil_critique_max:
            severite = 'CRITIQUE'
        elif capteur.seuil_critique_min and valeur_decimal <= capteur.seuil_critique_min:
            severite = 'CRITIQUE'

        # ---- 7. Créer l'alerte ----
        alerte = AlerteIoT.objects.create(
            capteur=capteur,
            equipement=equipement,
            severite=severite,
            titre=f"[IoT] {regle.nom} - {equipement.nom}",
            message=(
                f"Capteur : {capteur.nom} ({capteur.identifiant})\n"
                f"Équipement : {equipement.reference} - {equipement.nom}\n"
                f"{message_alerte}"
            ),
            valeur_declenchement=valeur_decimal,
            seuil_depasse=regle.valeur_seuil,
            donnee_telemetrie=donnee
        )

        # ---- 8. Actions selon la règle ----
        # Notification
        type_notif = 'WARNING'
        if severite == 'CRITIQUE':
            type_notif = 'ERROR'
        elif severite == 'DANGER':
            type_notif = 'ERROR'

        notifier_logisticiens(
            titre=f"🔔 Alerte IoT [{severite}] : {equipement.nom}",
            message=alerte.message,
            type_notification=type_notif,
            priorite='URGENTE' if severite in ['CRITIQUE', 'DANGER'] else 'HAUTE'
        )

        # Créer intervention automatique si nécessaire
        if regle.action in ['INTERVENTION', 'ARRET']:
            intervention = InterventionMaintenance.objects.create(
                equipement=equipement,
                type_intervention='URGENCE',
                priorite='CRITIQUE' if severite == 'CRITIQUE' else 'URGENTE',
                statut='PLANIFIEE',
                description_probleme=(
                    f"Intervention déclenchée automatiquement par alerte IoT.\n"
                    f"Capteur : {capteur.nom}\n"
                    f"{message_alerte}"
                ),
                heures_moteur_debut=equipement.heures_moteur,
                km_debut=equipement.kilometres,
                declenchee_par_iot=True,
                alerte_iot_data={
                    'capteur_id': capteur.identifiant,
                    'valeur': float(valeur_decimal),
                    'seuil': float(regle.valeur_seuil),
                    'severite': severite,
                    'timestamp': str(timestamp)
                }
            )

            alerte.intervention_creee = intervention
            alerte.save(update_fields=['intervention_creee'])

            # Mettre l'équipement en réparation si critique
            if severite == 'CRITIQUE':
                equipement.statut = 'EN_REPARATION'
                equipement.save(update_fields=['statut'])

        # Email si configuré
        if regle.action in ['EMAIL', 'ARRET']:
            try:
                from administration.email_service import envoyer_email_notification
                from .models import Equipement as EqModel
                # On crée une notification temporaire pour l'email
                pass  # L'email est envoyé via la notification ci-dessus
            except Exception:
                pass

    return donnee


def verifier_capteurs_inactifs():
    """
    Vérifie les capteurs qui n'ont pas envoyé de données depuis trop longtemps.
    À exécuter toutes les 15 minutes.
    """
    from .models import CapteurIoT, RegleAlerteIoT

    regles_inactivite = RegleAlerteIoT.objects.filter(
        condition='INACTIVITE',
        est_active=True
    )

    alertes_creees = 0

    for regle in regles_inactivite:
        if not regle.duree_inactivite_minutes:
            continue

        seuil_temps = timezone.now() - timedelta(minutes=regle.duree_inactivite_minutes)

        capteurs_inactifs = CapteurIoT.objects.filter(
            type_capteur=regle.type_capteur,
            est_actif=True,
            statut='ACTIF',
            derniere_lecture__lt=seuil_temps
        )

        for capteur in capteurs_inactifs:
            capteur.statut = 'DECONNECTE'
            capteur.save(update_fields=['statut'])

            notifier_logisticiens(
                titre=f"📡 Capteur déconnecté : {capteur.nom}",
                message=(
                    f"Le capteur {capteur.identifiant} sur {capteur.equipement.nom} "
                    f"n'a pas envoyé de données depuis plus de {regle.duree_inactivite_minutes} minutes."
                ),
                type_notification='WARNING',
                priorite='HAUTE'
            )

            alertes_creees += 1

    return {'capteurs_deconnectes': alertes_creees}