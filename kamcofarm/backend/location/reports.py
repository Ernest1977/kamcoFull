from datetime import date, timedelta
from django.db.models import Sum, Count, Avg, Q, F
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
# RAPPORT D'ACTIVITÉ LOCATION
# ========================================
def rapport_activite_location(date_debut=None, date_fin=None):
    """
    Rapport détaillé de l'activité location sur une période.
    """
    if not date_debut:
        date_debut = date.today().replace(day=1)
    if not date_fin:
        date_fin = date.today()

    rapport = {
        'periode': {
            'debut': str(date_debut),
            'fin': str(date_fin)
        },
        'reservations': {},
        'contrats': {},
        'financier': {},
        'cautions': {},
        'services': {},
        'equipements_les_plus_loues': [],
        'clients_principaux': []
    }

    # ---- RÉSERVATIONS ----
    reservations = ReservationEquipement.objects.filter(
        date_creation__date__gte=date_debut,
        date_creation__date__lte=date_fin
    )

    rapport['reservations'] = {
        'total': reservations.count(),
        'confirmees': reservations.filter(statut='CONFIRMEE').count(),
        'en_attente': reservations.filter(statut='EN_ATTENTE').count(),
        'annulees': reservations.filter(statut='ANNULEE').count(),
        'refusees': reservations.filter(statut='REFUSEE').count(),
        'taux_confirmation': 0,
        'montant_total_estime': float(
            reservations.filter(
                statut__in=['CONFIRMEE', 'EN_COURS', 'TERMINEE']
            ).aggregate(total=Sum('montant_estime'))['total'] or 0
        )
    }

    total_res = rapport['reservations']['total']
    if total_res > 0:
        rapport['reservations']['taux_confirmation'] = round(
            (rapport['reservations']['confirmees'] / total_res) * 100, 1
        )

    # ---- CONTRATS ----
    contrats = ContratLocation.objects.filter(
        date_creation__date__gte=date_debut,
        date_creation__date__lte=date_fin
    )

    contrats_termines = contrats.filter(statut='TERMINE')
    contrats_avec_retard = 0
    total_jours_retard = 0
    total_penalites = Decimal('0')

    for contrat in contrats_termines:
        if contrat.jours_retard > 0:
            contrats_avec_retard += 1
            total_jours_retard += contrat.jours_retard
            total_penalites += contrat.montant_penalites

    contrats_actifs = ContratLocation.objects.filter(statut='ACTIF')
    contrats_actifs_en_retard = 0
    for contrat in contrats_actifs:
        if contrat.jours_retard > 0:
            contrats_actifs_en_retard += 1

    rapport['contrats'] = {
        'total_crees': contrats.count(),
        'actifs': contrats_actifs.count(),
        'actifs_en_retard': contrats_actifs_en_retard,
        'termines': contrats_termines.count(),
        'termines_avec_retard': contrats_avec_retard,
        'resilies': contrats.filter(statut='RESILIE').count(),
        'en_litige': contrats.filter(statut='LITIGE').count(),
        'total_jours_retard': total_jours_retard,
        'total_penalites': float(total_penalites),
        'options_achat_exercees': contrats.filter(option_achat_exercee=True).count(),
        'montant_total_ttc': float(
            contrats.aggregate(total=Sum('montant_total_ttc'))['total'] or 0
        )
    }

    # ---- FINANCIER ----
    factures = FacturationLocation.objects.filter(
        date_emission__gte=date_debut,
        date_emission__lte=date_fin
    )

    paiements = PaiementLocation.objects.filter(
        statut='CONFIRME',
        date_paiement__gte=date_debut,
        date_paiement__lte=date_fin
    )

    factures_impayees = FacturationLocation.objects.filter(
        statut__in=['ENVOYEE', 'PARTIELLEMENT_PAYEE', 'EN_RETARD']
    )

    rapport['financier'] = {
        'factures_emises': factures.count(),
        'factures_payees': factures.filter(statut='PAYEE').count(),
        'factures_en_retard': factures.filter(statut='EN_RETARD').count(),
        'chiffre_affaires_facture': float(
            factures.aggregate(total=Sum('montant_ttc'))['total'] or 0
        ),
        'montant_encaisse': float(
            paiements.aggregate(total=Sum('montant'))['total'] or 0
        ),
        'creances_totales': float(
            factures_impayees.aggregate(total=Sum('solde_restant'))['total'] or 0
        ),
        'montant_services': float(
            factures.aggregate(total=Sum('montant_ht'))['total'] or 0
        ),
        'tva_collectee': float(
            factures.aggregate(total=Sum('montant_tva'))['total'] or 0
        )
    }

    # Taux de recouvrement
    ca_facture = rapport['financier']['chiffre_affaires_facture']
    encaisse = rapport['financier']['montant_encaisse']
    rapport['financier']['taux_recouvrement'] = round(
        (encaisse / ca_facture * 100), 1
    ) if ca_facture > 0 else 0

    # ---- CAUTIONS ----
    cautions = CautionLocation.objects.filter(
        date_creation__date__gte=date_debut,
        date_creation__date__lte=date_fin
    )

    rapport['cautions'] = {
        'total': cautions.count(),
        'montant_total_verse': float(
            cautions.aggregate(total=Sum('montant_verse'))['total'] or 0
        ),
        'montant_total_retenu': float(
            cautions.aggregate(total=Sum('montant_retenu'))['total'] or 0
        ),
        'montant_total_restitue': float(
            cautions.aggregate(total=Sum('montant_restitue'))['total'] or 0
        ),
        'en_attente': cautions.filter(statut='EN_ATTENTE').count(),
        'versees': cautions.filter(statut='VERSEE').count(),
        'restituees': cautions.filter(statut__in=['RESTITUEE', 'PARTIELLEMENT_RESTITUEE']).count(),
        'retenues': cautions.filter(statut='RETENUE').count()
    }

    # ---- SERVICES ANNEXES ----
    services = ServiceAnnexe.objects.filter(
        date_creation__date__gte=date_debut,
        date_creation__date__lte=date_fin
    )

    rapport['services'] = {
        'total': services.count(),
        'montant_total': float(
            services.aggregate(total=Sum('montant_total'))['total'] or 0
        ),
        'par_type': list(
            services.values('type_service').annotate(
                count=Count('id'),
                montant=Sum('montant_total')
            ).order_by('-montant')
        )
    }

    # ---- ÉQUIPEMENTS LES PLUS LOUÉS ----
    top_equipements = list(
        ContratLocation.objects.filter(
            date_creation__date__gte=date_debut,
            date_creation__date__lte=date_fin
        ).values(
            'equipement__reference', 'equipement__nom',
            'equipement__categorie__nom'
        ).annotate(
            nb_contrats=Count('id'),
            ca_total=Sum('montant_total_ttc')
        ).order_by('-nb_contrats')[:10]
    )

    for eq in top_equipements:
        eq['ca_total'] = float(eq['ca_total'] or 0)

    rapport['equipements_les_plus_loues'] = top_equipements

    # ---- CLIENTS PRINCIPAUX ----
    top_clients = list(
        ContratLocation.objects.filter(
            date_creation__date__gte=date_debut,
            date_creation__date__lte=date_fin
        ).values(
            'client_nom', 'client_entreprise'
        ).annotate(
            nb_contrats=Count('id'),
            ca_total=Sum('montant_total_ttc')
        ).order_by('-ca_total')[:10]
    )

    for client in top_clients:
        client['ca_total'] = float(client['ca_total'] or 0)

    rapport['clients_principaux'] = top_clients

    return rapport


# ========================================
# RAPPORT RENTABILITÉ PAR ÉQUIPEMENT
# ========================================
def rapport_rentabilite_location(equipement_id=None, annee=None):
    """
    Calcule la rentabilité de location par équipement.
    """
    if not annee:
        annee = date.today().year

    from equipements.models import Equipement

    equipements = Equipement.objects.filter(est_actif=True)
    if equipement_id:
        equipements = equipements.filter(id=equipement_id)

    rapport = {
        'annee': annee,
        'equipements': []
    }

    for eq in equipements:
        contrats = ContratLocation.objects.filter(
            equipement=eq,
            date_creation__year=annee
        )

        nb_contrats = contrats.count()
        if nb_contrats == 0:
            continue

        # Revenus
        revenus_location = contrats.aggregate(
            total=Sum('montant_location_ht')
        )['total'] or Decimal('0')

        revenus_services = contrats.aggregate(
            total=Sum('montant_services_ht')
        )['total'] or Decimal('0')

        revenus_penalites = contrats.aggregate(
            total=Sum('montant_penalites')
        )['total'] or Decimal('0')

        revenus_total = revenus_location + revenus_services + revenus_penalites

        # Jours loués
        total_jours_loues = 0
        for contrat in contrats:
            total_jours_loues += contrat.jours_location

        # Taux d'occupation
        jours_annee = 365
        taux_occupation = round((total_jours_loues / jours_annee * 100), 1) if jours_annee > 0 else 0

        # Coûts maintenance
        try:
            from equipements.models import InterventionMaintenance
            cout_maintenance = InterventionMaintenance.objects.filter(
                equipement=eq,
                statut='TERMINEE',
                date_fin__year=annee
            ).aggregate(total=Sum('cout_total'))['total'] or Decimal('0')
        except Exception:
            cout_maintenance = Decimal('0')

        # Coûts carburant
        try:
            from equipements.models import ConsommationCarburant
            cout_carburant = ConsommationCarburant.objects.filter(
                equipement=eq,
                date_plein__year=annee
            ).aggregate(total=Sum('cout_total'))['total'] or Decimal('0')
        except Exception:
            cout_carburant = Decimal('0')

        # Amortissement annuel
        if eq.duree_amortissement_mois > 0:
            amortissement = (float(eq.prix_acquisition) - float(eq.valeur_residuelle)) / (eq.duree_amortissement_mois / 12)
        else:
            amortissement = 0

        cout_total = float(cout_maintenance) + float(cout_carburant) + amortissement

        # Marge
        marge = float(revenus_total) - cout_total
        taux_marge = round((marge / float(revenus_total) * 100), 1) if float(revenus_total) > 0 else 0

        # ROI
        roi = round((marge / float(eq.prix_acquisition) * 100), 1) if float(eq.prix_acquisition) > 0 else 0

        # Tarif moyen journalier effectif
        tarif_moyen_effectif = round(
            float(revenus_location) / total_jours_loues, 2
        ) if total_jours_loues > 0 else 0

        # Cautions
        cautions = CautionLocation.objects.filter(
            contrat__equipement=eq,
            contrat__date_creation__year=annee
        )
        total_cautions_retenues = float(
            cautions.aggregate(total=Sum('montant_retenu'))['total'] or 0
        )

        rapport['equipements'].append({
            'reference': eq.reference,
            'nom': eq.nom,
            'categorie': eq.categorie.nom if eq.categorie else 'N/A',
            'prix_acquisition': float(eq.prix_acquisition),
            'valeur_actuelle': eq.valeur_actuelle_estimee,
            'tarif_journalier_catalogue': float(eq.tarif_journalier),
            'tarif_moyen_effectif': tarif_moyen_effectif,
            'nb_contrats': nb_contrats,
            'jours_loues': total_jours_loues,
            'taux_occupation': taux_occupation,
            'revenus': {
                'location': float(revenus_location),
                'services': float(revenus_services),
                'penalites': float(revenus_penalites),
                'total': float(revenus_total)
            },
            'couts': {
                'maintenance': float(cout_maintenance),
                'carburant': float(cout_carburant),
                'amortissement': round(amortissement, 2),
                'total': round(cout_total, 2)
            },
            'marge': round(marge, 2),
            'taux_marge': taux_marge,
            'roi': roi,
            'cautions_retenues': total_cautions_retenues
        })

    # Trier par marge décroissante
    rapport['equipements'].sort(key=lambda x: x['marge'], reverse=True)

    # Totaux
    if rapport['equipements']:
        rapport['totaux'] = {
            'nb_equipements_loues': len(rapport['equipements']),
            'revenus_total': sum(e['revenus']['total'] for e in rapport['equipements']),
            'couts_total': sum(e['couts']['total'] for e in rapport['equipements']),
            'marge_totale': sum(e['marge'] for e in rapport['equipements']),
            'jours_loues_total': sum(e['jours_loues'] for e in rapport['equipements']),
            'taux_occupation_moyen': round(
                sum(e['taux_occupation'] for e in rapport['equipements']) / len(rapport['equipements']), 1
            )
        }
    else:
        rapport['totaux'] = {
            'nb_equipements_loues': 0,
            'revenus_total': 0,
            'couts_total': 0,
            'marge_totale': 0,
            'jours_loues_total': 0,
            'taux_occupation_moyen': 0
        }

    return rapport


# ========================================
# RAPPORT RETARDS ET PÉNALITÉS
# ========================================
def rapport_retards_penalites(date_debut=None, date_fin=None):
    """
    Rapport détaillé des retards de restitution et pénalités.
    """
    if not date_debut:
        date_debut = date.today().replace(month=1, day=1)
    if not date_fin:
        date_fin = date.today()

    rapport = {
        'periode': {
            'debut': str(date_debut),
            'fin': str(date_fin)
        },
        'resume': {},
        'contrats_en_retard_actifs': [],
        'historique_retards': [],
        'par_client': []
    }

    # Contrats terminés avec retard
    contrats_termines = ContratLocation.objects.filter(
        statut='TERMINE',
        date_fin_effective__gte=date_debut,
        date_fin_effective__lte=date_fin
    )

    total_termines = contrats_termines.count()
    avec_retard = 0
    total_jours_retard = 0
    total_penalites = Decimal('0')

    for contrat in contrats_termines:
        retard = contrat.jours_retard
        if retard > 0:
            avec_retard += 1
            total_jours_retard += retard
            total_penalites += contrat.montant_penalites

            rapport['historique_retards'].append({
                'reference': contrat.reference,
                'equipement': contrat.equipement.nom,
                'client': contrat.client_nom,
                'client_entreprise': contrat.client_entreprise or '',
                'date_fin_prevue': str(contrat.date_fin_prevue),
                'date_fin_effective': str(contrat.date_fin_effective),
                'jours_retard': retard,
                'penalite_jour': float(contrat.penalite_retard_par_jour),
                'penalite_totale': float(contrat.montant_penalites)
            })

    # Contrats actifs en retard actuellement
    contrats_actifs_retard = ContratLocation.objects.filter(
        statut='ACTIF',
        date_fin_prevue__lt=date.today(),
        date_fin_effective__isnull=True
    ).select_related('equipement')

    for contrat in contrats_actifs_retard:
        rapport['contrats_en_retard_actifs'].append({
            'reference': contrat.reference,
            'equipement': contrat.equipement.nom,
            'equipement_reference': contrat.equipement.reference,
            'client': contrat.client_nom,
            'client_entreprise': contrat.client_entreprise or '',
            'client_telephone': contrat.client_telephone,
            'date_fin_prevue': str(contrat.date_fin_prevue),
            'jours_retard': contrat.jours_retard,
            'penalite_jour': float(contrat.penalite_retard_par_jour),
            'penalite_estimee': float(contrat.penalite_retard_par_jour * contrat.jours_retard)
        })

    # Résumé
    rapport['resume'] = {
        'total_contrats_termines': total_termines,
        'contrats_avec_retard': avec_retard,
        'taux_retard': round((avec_retard / total_termines * 100), 1) if total_termines > 0 else 0,
        'total_jours_retard': total_jours_retard,
        'moyenne_jours_retard': round(total_jours_retard / avec_retard, 1) if avec_retard > 0 else 0,
        'total_penalites_facturees': float(total_penalites),
        'contrats_actifs_en_retard': len(rapport['contrats_en_retard_actifs'])
    }

    # Par client
    clients_retard = {}
    for item in rapport['historique_retards']:
        cle = item['client']
        if cle not in clients_retard:
            clients_retard[cle] = {
                'client': cle,
                'entreprise': item['client_entreprise'],
                'nb_retards': 0,
                'total_jours': 0,
                'total_penalites': 0
            }
        clients_retard[cle]['nb_retards'] += 1
        clients_retard[cle]['total_jours'] += item['jours_retard']
        clients_retard[cle]['total_penalites'] += item['penalite_totale']

    rapport['par_client'] = sorted(
        clients_retard.values(),
        key=lambda x: x['total_penalites'],
        reverse=True
    )

    return rapport


# ========================================
# RAPPORT CAUTIONS
# ========================================
def rapport_cautions(date_debut=None, date_fin=None):
    """
    Rapport détaillé des cautions.
    """
    if not date_debut:
        date_debut = date.today().replace(month=1, day=1)
    if not date_fin:
        date_fin = date.today()

    rapport = {
        'periode': {
            'debut': str(date_debut),
            'fin': str(date_fin)
        },
        'resume': {},
        'cautions_en_attente': [],
        'cautions_retenues': [],
        'par_mode_paiement': []
    }

    cautions = CautionLocation.objects.filter(
        date_creation__date__gte=date_debut,
        date_creation__date__lte=date_fin
    ).select_related('contrat', 'contrat__equipement')

    # Résumé
    rapport['resume'] = {
        'total': cautions.count(),
        'montant_total_requis': float(
            cautions.aggregate(total=Sum('montant_requis'))['total'] or 0
        ),
        'montant_total_verse': float(
            cautions.aggregate(total=Sum('montant_verse'))['total'] or 0
        ),
        'montant_total_retenu': float(
            cautions.aggregate(total=Sum('montant_retenu'))['total'] or 0
        ),
        'montant_total_restitue': float(
            cautions.aggregate(total=Sum('montant_restitue'))['total'] or 0
        ),
        'en_attente': cautions.filter(statut='EN_ATTENTE').count(),
        'versees': cautions.filter(statut='VERSEE').count(),
        'restituees': cautions.filter(
            statut__in=['RESTITUEE', 'PARTIELLEMENT_RESTITUEE']
        ).count(),
        'retenues': cautions.filter(statut='RETENUE').count()
    }

    # Solde cautions en cours (versées mais pas encore restituées)
    cautions_en_cours = CautionLocation.objects.filter(statut='VERSEE')
    rapport['resume']['solde_cautions_en_cours'] = float(
        cautions_en_cours.aggregate(total=Sum('montant_verse'))['total'] or 0
    )

    # Cautions en attente
    for caution in cautions.filter(statut='EN_ATTENTE').select_related('contrat'):
        rapport['cautions_en_attente'].append({
            'reference': caution.reference,
            'contrat': caution.contrat.reference,
            'client': caution.contrat.client_nom,
            'montant_requis': float(caution.montant_requis),
            'devise': caution.devise,
            'date_creation': str(caution.date_creation.date())
        })

    # Cautions retenues (détails)
    for caution in cautions.filter(statut='RETENUE'):
        rapport['cautions_retenues'].append({
            'reference': caution.reference,
            'contrat': caution.contrat.reference,
            'client': caution.contrat.client_nom,
            'equipement': caution.contrat.equipement.nom,
            'montant_verse': float(caution.montant_verse),
            'montant_retenu': float(caution.montant_retenu),
            'motif': caution.motif_retenue or 'Non précisé',
            'devise': caution.devise
        })

    # Par mode de paiement
    rapport['par_mode_paiement'] = list(
        cautions.filter(statut__in=['VERSEE', 'RESTITUEE', 'RETENUE']).values(
            'mode_paiement'
        ).annotate(
            count=Count('id'),
            total_verse=Sum('montant_verse')
        ).order_by('-total_verse')
    )

    for item in rapport['par_mode_paiement']:
        item['total_verse'] = float(item['total_verse'] or 0)

    return rapport


# ========================================
# RAPPORT ÉVOLUTION MENSUELLE
# ========================================
def rapport_evolution_mensuelle(annee=None):
    """
    Évolution mensuelle de l'activité location.
    """
    if not annee:
        annee = date.today().year

    rapport = {
        'annee': annee,
        'mois': []
    }

    for mois in range(1, 13):
        # Contrats créés
        contrats = ContratLocation.objects.filter(
            date_creation__year=annee,
            date_creation__month=mois
        )

        # Revenus
        factures = FacturationLocation.objects.filter(
            date_emission__year=annee,
            date_emission__month=mois
        )

        ca_facture = float(
            factures.aggregate(total=Sum('montant_ttc'))['total'] or 0
        )

        # Encaissements
        encaisse = float(
            PaiementLocation.objects.filter(
                statut='CONFIRME',
                date_paiement__year=annee,
                date_paiement__month=mois
            ).aggregate(total=Sum('montant'))['total'] or 0
        )

        # Réservations
        reservations = ReservationEquipement.objects.filter(
            date_creation__year=annee,
            date_creation__month=mois
        )

        # Services annexes
        services = float(
            ServiceAnnexe.objects.filter(
                date_creation__year=annee,
                date_creation__month=mois
            ).aggregate(total=Sum('montant_total'))['total'] or 0
        )

        # Pénalités
        penalites = float(
            contrats.filter(
                statut='TERMINE'
            ).aggregate(total=Sum('montant_penalites'))['total'] or 0
        )

        rapport['mois'].append({
            'mois': mois,
            'reservations': reservations.count(),
            'contrats_crees': contrats.count(),
            'ca_facture': ca_facture,
            'encaisse': encaisse,
            'services': services,
            'penalites': penalites
        })

    # Totaux annuels
    rapport['totaux'] = {
        'reservations': sum(m['reservations'] for m in rapport['mois']),
        'contrats': sum(m['contrats_crees'] for m in rapport['mois']),
        'ca_facture': sum(m['ca_facture'] for m in rapport['mois']),
        'encaisse': sum(m['encaisse'] for m in rapport['mois']),
        'services': sum(m['services'] for m in rapport['mois']),
        'penalites': sum(m['penalites'] for m in rapport['mois'])
    }

    return rapport


# ========================================
# RAPPORT DOMMAGES ET DÉGRADATIONS
# ========================================
def rapport_dommages(date_debut=None, date_fin=None):
    """
    Rapport des dommages constatés lors des états des lieux de retour.
    """
    if not date_debut:
        date_debut = date.today().replace(month=1, day=1)
    if not date_fin:
        date_fin = date.today()

    rapport = {
        'periode': {
            'debut': str(date_debut),
            'fin': str(date_fin)
        },
        'resume': {},
        'dommages_details': [],
        'par_composant': {},
        'par_equipement': []
    }

    edl_retours = EtatDesLieux.objects.filter(
        type_etat='RETOUR',
        date_realisation__date__gte=date_debut,
        date_realisation__date__lte=date_fin
    ).select_related('contrat', 'contrat__equipement')

    total_retours = edl_retours.count()
    avec_dommages = 0

    composants = {
        'etat_general': {'label': 'État général', 'degradations': 0},
        'etat_carrosserie': {'label': 'Carrosserie', 'degradations': 0},
        'etat_moteur': {'label': 'Moteur', 'degradations': 0},
        'etat_pneus': {'label': 'Pneus', 'degradations': 0},
        'etat_hydraulique': {'label': 'Hydraulique', 'degradations': 0},
        'etat_electrique': {'label': 'Électrique', 'degradations': 0},
        'etat_accessoires': {'label': 'Accessoires', 'degradations': 0},
    }

    for edl in edl_retours:
        if edl.etat_general in ['ENDOMMAGE', 'HORS_SERVICE']:
            avec_dommages += 1

            rapport['dommages_details'].append({
                'contrat': edl.contrat.reference,
                'equipement': edl.contrat.equipement.nom,
                'equipement_reference': edl.contrat.equipement.reference,
                'client': edl.contrat.client_nom,
                'etat_general': edl.get_etat_general_display(),
                'dommages': edl.dommages_constates or 'Non détaillés',
                'date': str(edl.date_realisation.date())
            })

        # Comparer avec l'EDL de sortie
        edl_sortie = EtatDesLieux.objects.filter(
            contrat=edl.contrat,
            type_etat='SORTIE'
        ).first()

        if edl_sortie:
            etat_ordre = ['NEUF', 'EXCELLENT', 'BON', 'ACCEPTABLE', 'ENDOMMAGE', 'HORS_SERVICE']
            for champ in composants.keys():
                val_sortie = getattr(edl_sortie, champ)
                val_retour = getattr(edl, champ)
                if val_sortie in etat_ordre and val_retour in etat_ordre:
                    if etat_ordre.index(val_retour) > etat_ordre.index(val_sortie):
                        composants[champ]['degradations'] += 1

    rapport['resume'] = {
        'total_retours': total_retours,
        'avec_dommages': avec_dommages,
        'taux_dommages': round(
            (avec_dommages / total_retours * 100), 1
        ) if total_retours > 0 else 0
    }

    rapport['par_composant'] = {
        v['label']: v['degradations'] for k, v in composants.items()
    }

    # Par équipement
    equipements_dommages = {}
    for item in rapport['dommages_details']:
        ref = item['equipement_reference']
        if ref not in equipements_dommages:
            equipements_dommages[ref] = {
                'reference': ref,
                'nom': item['equipement'],
                'nb_dommages': 0
            }
        equipements_dommages[ref]['nb_dommages'] += 1

    rapport['par_equipement'] = sorted(
        equipements_dommages.values(),
        key=lambda x: x['nb_dommages'],
        reverse=True
    )

    return rapport