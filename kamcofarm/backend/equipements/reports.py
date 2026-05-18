from datetime import date, timedelta
from django.db.models import Sum, Count, Avg, Q, F
from decimal import Decimal
import logging

from .models import (
    Equipement,
    CategorieEquipement,
    CertificationEquipement,
    InterventionMaintenance,
    ConsommationCarburant,
    MouvementEquipement
)

logger = logging.getLogger(__name__)


# ========================================
# RAPPORT UTILISATION FLOTTE
# ========================================
def rapport_utilisation_flotte(date_debut=None, date_fin=None):
    """
    Rapport détaillé sur l'utilisation de la flotte.
    """
    if not date_debut:
        date_debut = date.today().replace(day=1)
    if not date_fin:
        date_fin = date.today()

    equipements = Equipement.objects.filter(est_actif=True).select_related('categorie')

    rapport = {
        'periode': {
            'debut': str(date_debut),
            'fin': str(date_fin)
        },
        'resume': {},
        'par_equipement': [],
        'par_categorie': []
    }

    total = equipements.count()
    disponibles = equipements.filter(statut='DISPONIBLE').count()
    en_location = equipements.filter(statut='EN_LOCATION').count()
    en_maintenance = equipements.filter(statut__in=['EN_MAINTENANCE', 'EN_REPARATION']).count()

    rapport['resume'] = {
        'total_equipements': total,
        'disponibles': disponibles,
        'en_location': en_location,
        'en_maintenance': en_maintenance,
        'taux_utilisation': round((en_location / total * 100), 1) if total > 0 else 0,
        'taux_disponibilite': round((disponibles / total * 100), 1) if total > 0 else 0,
        'taux_maintenance': round((en_maintenance / total * 100), 1) if total > 0 else 0,
    }

    # Par équipement
    for eq in equipements:
        interventions = eq.interventions.filter(
            date_creation__date__gte=date_debut,
            date_creation__date__lte=date_fin
        )

        cout_maintenance = interventions.filter(
            statut='TERMINEE'
        ).aggregate(total=Sum('cout_total'))['total'] or 0

        consommation = eq.consommations_carburant.filter(
            date_plein__date__gte=date_debut,
            date_plein__date__lte=date_fin
        )

        cout_carburant = consommation.aggregate(total=Sum('cout_total'))['total'] or 0
        litres = consommation.aggregate(total=Sum('quantite_litres'))['total'] or 0

        mouvements = eq.mouvements.filter(
            date_mouvement__date__gte=date_debut,
            date_mouvement__date__lte=date_fin
        ).count()

        rapport['par_equipement'].append({
            'reference': eq.reference,
            'nom': eq.nom,
            'categorie': eq.categorie.nom if eq.categorie else 'N/A',
            'statut': eq.get_statut_display(),
            'heures_moteur': float(eq.heures_moteur),
            'kilometres': float(eq.kilometres),
            'interventions': interventions.count(),
            'cout_maintenance': float(cout_maintenance),
            'litres_carburant': float(litres),
            'cout_carburant': float(cout_carburant),
            'cout_total_exploitation': float(cout_maintenance) + float(cout_carburant),
            'mouvements': mouvements,
            'valeur_actuelle': eq.valeur_actuelle_estimee,
            'maintenance_requise': eq.maintenance_requise,
        })

    # Par catégorie
    categories = CategorieEquipement.objects.filter(est_active=True)
    for cat in categories:
        eqs = equipements.filter(categorie=cat)
        nb = eqs.count()
        if nb == 0:
            continue

        en_loc = eqs.filter(statut='EN_LOCATION').count()

        cout_maint = InterventionMaintenance.objects.filter(
            equipement__categorie=cat,
            statut='TERMINEE',
            date_fin__date__gte=date_debut,
            date_fin__date__lte=date_fin
        ).aggregate(total=Sum('cout_total'))['total'] or 0

        cout_carb = ConsommationCarburant.objects.filter(
            equipement__categorie=cat,
            date_plein__date__gte=date_debut,
            date_plein__date__lte=date_fin
        ).aggregate(total=Sum('cout_total'))['total'] or 0

        rapport['par_categorie'].append({
            'categorie': cat.nom,
            'nombre_equipements': nb,
            'en_location': en_loc,
            'taux_utilisation': round((en_loc / nb * 100), 1) if nb > 0 else 0,
            'cout_maintenance': float(cout_maint),
            'cout_carburant': float(cout_carb),
            'cout_total': float(cout_maint) + float(cout_carb),
        })

    return rapport


# ========================================
# RAPPORT COÛTS MAINTENANCE
# ========================================
def rapport_couts_maintenance(annee=None):
    """
    Rapport des coûts de maintenance par mois et par type.
    """
    if not annee:
        annee = date.today().year

    rapport = {
        'annee': annee,
        'par_mois': [],
        'par_type': [],
        'par_equipement': [],
        'totaux': {}
    }

    # Par mois
    for mois in range(1, 13):
        interventions = InterventionMaintenance.objects.filter(
            statut='TERMINEE',
            date_fin__year=annee,
            date_fin__month=mois
        )

        cout = interventions.aggregate(total=Sum('cout_total'))['total'] or 0
        nombre = interventions.count()
        duree = interventions.aggregate(total=Sum('duree_reelle_heures'))['total'] or 0

        rapport['par_mois'].append({
            'mois': mois,
            'nombre_interventions': nombre,
            'cout_total': float(cout),
            'heures_totales': float(duree),
        })

    # Par type d'intervention
    types = InterventionMaintenance.objects.filter(
        statut='TERMINEE',
        date_fin__year=annee
    ).values('type_intervention').annotate(
        count=Count('id'),
        cout=Sum('cout_total'),
        duree=Sum('duree_reelle_heures')
    ).order_by('-cout')

    for t in types:
        rapport['par_type'].append({
            'type': t['type_intervention'],
            'nombre': t['count'],
            'cout_total': float(t['cout'] or 0),
            'heures_totales': float(t['duree'] or 0),
        })

    # Par équipement (top 10 les plus coûteux)
    top_equipements = InterventionMaintenance.objects.filter(
        statut='TERMINEE',
        date_fin__year=annee
    ).values(
        'equipement__reference', 'equipement__nom'
    ).annotate(
        count=Count('id'),
        cout=Sum('cout_total')
    ).order_by('-cout')[:10]

    for eq in top_equipements:
        rapport['par_equipement'].append({
            'reference': eq['equipement__reference'],
            'nom': eq['equipement__nom'],
            'nombre_interventions': eq['count'],
            'cout_total': float(eq['cout'] or 0),
        })

    # Totaux annuels
    total_annuel = InterventionMaintenance.objects.filter(
        statut='TERMINEE',
        date_fin__year=annee
    ).aggregate(
        cout_total=Sum('cout_total'),
        cout_pieces=Sum('cout_pieces'),
        cout_mo=Sum('cout_main_oeuvre'),
        nombre=Count('id'),
        heures=Sum('duree_reelle_heures')
    )

    rapport['totaux'] = {
        'cout_total': float(total_annuel['cout_total'] or 0),
        'cout_pieces': float(total_annuel['cout_pieces'] or 0),
        'cout_main_oeuvre': float(total_annuel['cout_mo'] or 0),
        'nombre_interventions': total_annuel['nombre'] or 0,
        'heures_totales': float(total_annuel['heures'] or 0),
    }

    return rapport


# ========================================
# RAPPORT CONSOMMATION CARBURANT
# ========================================
def rapport_consommation_carburant(annee=None):
    """
    Rapport de consommation de carburant par mois et par équipement.
    """
    if not annee:
        annee = date.today().year

    rapport = {
        'annee': annee,
        'par_mois': [],
        'par_equipement': [],
        'totaux': {}
    }

    # Par mois
    for mois in range(1, 13):
        consos = ConsommationCarburant.objects.filter(
            date_plein__year=annee,
            date_plein__month=mois
        )

        litres = consos.aggregate(total=Sum('quantite_litres'))['total'] or 0
        cout = consos.aggregate(total=Sum('cout_total'))['total'] or 0
        nombre = consos.count()

        rapport['par_mois'].append({
            'mois': mois,
            'nombre_pleins': nombre,
            'litres': float(litres),
            'cout_total': float(cout),
            'prix_moyen_litre': round(float(cout) / float(litres), 1) if litres > 0 else 0,
        })

    # Par équipement (top consommateurs)
    top_consos = ConsommationCarburant.objects.filter(
        date_plein__year=annee
    ).values(
        'equipement__reference', 'equipement__nom'
    ).annotate(
        litres=Sum('quantite_litres'),
        cout=Sum('cout_total'),
        nombre=Count('id')
    ).order_by('-cout')[:10]

    for c in top_consos:
        rapport['par_equipement'].append({
            'reference': c['equipement__reference'],
            'nom': c['equipement__nom'],
            'litres': float(c['litres'] or 0),
            'cout_total': float(c['cout'] or 0),
            'nombre_pleins': c['nombre'],
        })

    # Totaux
    totaux = ConsommationCarburant.objects.filter(
        date_plein__year=annee
    ).aggregate(
        litres=Sum('quantite_litres'),
        cout=Sum('cout_total'),
        nombre=Count('id')
    )

    rapport['totaux'] = {
        'litres': float(totaux['litres'] or 0),
        'cout_total': float(totaux['cout'] or 0),
        'nombre_pleins': totaux['nombre'] or 0,
    }

    return rapport


# ========================================
# RAPPORT RENTABILITÉ PAR ÉQUIPEMENT
# ========================================
def rapport_rentabilite(equipement_id=None, annee=None):
    """
    Calcule la rentabilité par équipement.
    """
    if not annee:
        annee = date.today().year

    equipements = Equipement.objects.filter(est_actif=True)
    if equipement_id:
        equipements = equipements.filter(id=equipement_id)

    rapport = {
        'annee': annee,
        'equipements': []
    }

    for eq in equipements:
        # Coûts
        cout_maintenance = InterventionMaintenance.objects.filter(
            equipement=eq,
            statut='TERMINEE',
            date_fin__year=annee
        ).aggregate(total=Sum('cout_total'))['total'] or 0

        cout_carburant = ConsommationCarburant.objects.filter(
            equipement=eq,
            date_plein__year=annee
        ).aggregate(total=Sum('cout_total'))['total'] or 0

        # Amortissement annuel
        if eq.duree_amortissement_mois > 0:
            amortissement_annuel = (float(eq.prix_acquisition) - float(eq.valeur_residuelle)) / (eq.duree_amortissement_mois / 12)
        else:
            amortissement_annuel = 0

        cout_total = float(cout_maintenance) + float(cout_carburant) + amortissement_annuel

        # Revenus estimés (basé sur le tarif journalier × jours d'utilisation estimés)
        # On estime le revenu à partir du statut EN_LOCATION
        jours_annee = 365
        taux_utilisation_estime = 0.6  # 60% par défaut
        revenu_estime = float(eq.tarif_journalier) * jours_annee * taux_utilisation_estime

        marge = revenu_estime - cout_total
        roi = round((marge / float(eq.prix_acquisition) * 100), 1) if eq.prix_acquisition > 0 else 0

        rapport['equipements'].append({
            'reference': eq.reference,
            'nom': eq.nom,
            'categorie': eq.categorie.nom if eq.categorie else 'N/A',
            'prix_acquisition': float(eq.prix_acquisition),
            'valeur_actuelle': eq.valeur_actuelle_estimee,
            'cout_maintenance': float(cout_maintenance),
            'cout_carburant': float(cout_carburant),
            'amortissement_annuel': round(amortissement_annuel, 2),
            'cout_total_exploitation': round(cout_total, 2),
            'tarif_journalier': float(eq.tarif_journalier),
            'revenu_estime_annuel': round(revenu_estime, 2),
            'marge_estimee': round(marge, 2),
            'roi_pourcentage': roi,
        })

    return rapport