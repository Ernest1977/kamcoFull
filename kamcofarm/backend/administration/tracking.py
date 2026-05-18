import json
import logging
from django.forms.models import model_to_dict

logger = logging.getLogger(__name__)


def tracker_creation(instance, utilisateur=None, request=None):
    """Enregistre la création d'un objet."""
    try:
        from .models import HistoriqueModification

        ip = None
        user_agent = None
        if request:
            ip = request.META.get('REMOTE_ADDR')
            user_agent = request.META.get('HTTP_USER_AGENT', '')[:500]

        HistoriqueModification.objects.create(
            utilisateur=utilisateur,
            action='CREATION',
            module=instance._meta.app_label,
            objet_type=instance._meta.model_name,
            objet_id=instance.pk,
            objet_representation=str(instance)[:500],
            resume=f"Création de {instance._meta.verbose_name} : {instance}",
            ip_address=ip,
            user_agent=user_agent
        )
    except Exception as e:
        logger.warning(f"Erreur tracking création: {e}")


def tracker_modification(instance, anciens_champs, utilisateur=None, request=None):
    """
    Enregistre la modification d'un objet.
    anciens_champs : dict des valeurs AVANT modification
    """
    try:
        from .models import HistoriqueModification

        # Comparer les champs
        modifications = []
        nouveaux_champs = model_to_dict_safe(instance)

        for champ, ancienne_valeur in anciens_champs.items():
            nouvelle_valeur = nouveaux_champs.get(champ)

            # Convertir en string pour comparaison
            ancien_str = str(ancienne_valeur) if ancienne_valeur is not None else ''
            nouveau_str = str(nouvelle_valeur) if nouvelle_valeur is not None else ''

            if ancien_str != nouveau_str:
                modifications.append({
                    'champ': champ,
                    'ancien': ancien_str[:200],
                    'nouveau': nouveau_str[:200]
                })

        if not modifications:
            return  # Pas de changement réel

        # Résumé lisible
        resume_parts = []
        for mod in modifications[:5]:
            resume_parts.append(f'{mod["champ"]}: "{mod["ancien"]}" → "{mod["nouveau"]}"')
        resume = f'Modification de {instance._meta.verbose_name} : ' + ' | '.join(resume_parts)

        ip = None
        user_agent = None
        if request:
            ip = request.META.get('REMOTE_ADDR')
            user_agent = request.META.get('HTTP_USER_AGENT', '')[:500]

        HistoriqueModification.objects.create(
            utilisateur=utilisateur,
            action='MODIFICATION',
            module=instance._meta.app_label,
            objet_type=instance._meta.model_name,
            objet_id=instance.pk,
            objet_representation=str(instance)[:500],
            champs_modifies=modifications,
            resume=resume[:1000],
            ip_address=ip,
            user_agent=user_agent
        )
    except Exception as e:
        logger.warning(f"Erreur tracking modification: {e}")


def tracker_suppression(instance, utilisateur=None, request=None):
    """Enregistre la suppression d'un objet."""
    try:
        from .models import HistoriqueModification

        ip = None
        user_agent = None
        if request:
            ip = request.META.get('REMOTE_ADDR')
            user_agent = request.META.get('HTTP_USER_AGENT', '')[:500]

        HistoriqueModification.objects.create(
            utilisateur=utilisateur,
            action='SUPPRESSION',
            module=instance._meta.app_label,
            objet_type=instance._meta.model_name,
            objet_id=instance.pk,
            objet_representation=str(instance)[:500],
            resume=f"Suppression de {instance._meta.verbose_name} : {instance}",
            ip_address=ip,
            user_agent=user_agent
        )
    except Exception as e:
        logger.warning(f"Erreur tracking suppression: {e}")


def capturer_etat_avant(instance):
    """Capture l'état d'un objet avant modification."""
    try:
        return model_to_dict_safe(instance)
    except Exception:
        return {}


def model_to_dict_safe(instance):
    """Convertit un modèle en dict de manière sécurisée."""
    try:
        data = {}
        for field in instance._meta.fields:
            try:
                value = getattr(instance, field.name)
                if hasattr(value, 'pk'):
                    data[field.name] = str(value)
                elif hasattr(value, 'isoformat'):
                    data[field.name] = value.isoformat()
                else:
                    data[field.name] = str(value) if value is not None else ''
            except Exception:
                data[field.name] = ''
        return data
    except Exception:
        return {}