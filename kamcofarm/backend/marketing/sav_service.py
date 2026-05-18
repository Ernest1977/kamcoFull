from django.db.models import Sum, Count, Avg
from decimal import Decimal
from datetime import date
import logging

logger = logging.getLogger(__name__)


def synchroniser_clients_convertis():
    """
    Synchronise automatiquement les clients convertis depuis :
    - Leads convertis
    - Commandes clients livrées/confirmées
    - Contrats de location terminés/actifs
    """
    from .models import ClientConverti, Lead, EvaluationSAV

    resultats = {'crees': 0, 'mis_a_jour': 0, 'promos_detectees': 0}

    # ========================================
    # 1. Depuis les leads convertis
    # ========================================
    try:
        leads_convertis = Lead.objects.filter(statut='CONVERTI')
        for lead in leads_convertis:
            if not lead.nom:
                continue

            client = ClientConverti.objects.filter(nom__iexact=lead.nom).first()

            if not client:
                client = ClientConverti(
                    nom=lead.nom,
                    entreprise=lead.entreprise or '',
                    email=lead.email or None,
                    telephone=lead.telephone or '',
                    pays=lead.pays or 'Cameroun',
                    ville=lead.ville or '',
                    origine='LEAD',
                    lead_source=lead,
                )

                if lead.date_conversion:
                    try:
                        client.date_premiere_operation = lead.date_conversion.date() if hasattr(lead.date_conversion, 'date') else lead.date_conversion
                    except Exception:
                        client.date_premiere_operation = date.today()
                else:
                    client.date_premiere_operation = date.today()

                client.save()
                resultats['crees'] += 1
            else:
                # Mettre à jour les infos si vides
                if not client.email and lead.email:
                    client.email = lead.email
                if not client.telephone and lead.telephone:
                    client.telephone = lead.telephone
                if not client.entreprise and lead.entreprise:
                    client.entreprise = lead.entreprise
                client.save()

    except Exception as e:
        logger.warning(f"Erreur sync leads: {e}")

    # ========================================
    # 2. Depuis les commandes clients
    # ========================================
    try:
        from supplychain.models import CommandeClient

        commandes = CommandeClient.objects.filter(
            statut__in=['CONFIRMEE', 'EN_PREPARATION', 'EXPEDIEE', 'LIVREE']
        )

        # Grouper par nom client
        clients_commandes = {}
        for cmd in commandes:
            if not cmd.client_nom:
                continue
            key = cmd.client_nom.strip()
            if key not in clients_commandes:
                clients_commandes[key] = {
                    'nom': cmd.client_nom,
                    'entreprise': cmd.client_entreprise or '',
                    'email': cmd.client_email or '',
                    'telephone': cmd.client_telephone or '',
                    'nb': 0,
                    'total': Decimal('0'),
                    'premiere_date': None,
                    'derniere_date': None
                }

            montant = cmd.montant_total or Decimal('0')
            clients_commandes[key]['nb'] += 1
            clients_commandes[key]['total'] += montant

            cmd_date = cmd.date_commande
            if hasattr(cmd_date, 'date'):
                cmd_date = cmd_date.date()

            if not clients_commandes[key]['premiere_date'] or cmd_date < clients_commandes[key]['premiere_date']:
                clients_commandes[key]['premiere_date'] = cmd_date
            if not clients_commandes[key]['derniere_date'] or cmd_date > clients_commandes[key]['derniere_date']:
                clients_commandes[key]['derniere_date'] = cmd_date

        for key, data in clients_commandes.items():
            client = ClientConverti.objects.filter(nom__iexact=data['nom']).first()

            if not client:
                client = ClientConverti(
                    nom=data['nom'],
                    entreprise=data['entreprise'],
                    origine='COMMANDE',
                    date_premiere_operation=data['premiere_date'] or date.today()
                )
                if data['email']:
                    client.email = data['email']
                if data['telephone']:
                    client.telephone = data['telephone']
                client.save()
                resultats['crees'] += 1

            # Mettre à jour les compteurs achats
            client.nb_achats = data['nb']
            client.total_achats = data['total']

            if data['derniere_date']:
                if not client.date_derniere_operation or data['derniere_date'] > client.date_derniere_operation:
                    client.date_derniere_operation = data['derniere_date']

            # Mettre à jour les infos contact si vides
            if not client.email and data['email']:
                client.email = data['email']
            if not client.telephone and data['telephone']:
                client.telephone = data['telephone']
            if not client.entreprise and data['entreprise']:
                client.entreprise = data['entreprise']

            client.save()

    except ImportError:
        logger.info("App supplychain non disponible")
    except Exception as e:
        logger.warning(f"Erreur sync commandes: {e}")

    # ========================================
    # 3. Depuis les contrats de location
    # ========================================
    try:
        from location.models import ContratLocation

        contrats = ContratLocation.objects.filter(
            statut__in=['ACTIF', 'TERMINE']
        )

        clients_location = {}
        for contrat in contrats:
            if not contrat.client_nom:
                continue
            key = contrat.client_nom.strip()
            if key not in clients_location:
                clients_location[key] = {
                    'nom': contrat.client_nom,
                    'entreprise': contrat.client_entreprise or '',
                    'email': contrat.client_email or '',
                    'telephone': contrat.client_telephone or '',
                    'nb': 0,
                    'total': Decimal('0'),
                    'premiere_date': None,
                    'derniere_date': None
                }

            montant = contrat.montant_total_ttc or Decimal('0')
            clients_location[key]['nb'] += 1
            clients_location[key]['total'] += montant

            if contrat.date_debut:
                if not clients_location[key]['premiere_date'] or contrat.date_debut < clients_location[key]['premiere_date']:
                    clients_location[key]['premiere_date'] = contrat.date_debut
                if not clients_location[key]['derniere_date'] or contrat.date_debut > clients_location[key]['derniere_date']:
                    clients_location[key]['derniere_date'] = contrat.date_debut

        for key, data in clients_location.items():
            client = ClientConverti.objects.filter(nom__iexact=data['nom']).first()

            if not client:
                client = ClientConverti(
                    nom=data['nom'],
                    entreprise=data['entreprise'],
                    origine='LOCATION',
                    date_premiere_operation=data['premiere_date'] or date.today()
                )
                if data['email']:
                    client.email = data['email']
                if data['telephone']:
                    client.telephone = data['telephone']
                client.save()
                resultats['crees'] += 1

            client.nb_locations = data['nb']
            client.total_locations = data['total']

            if data['derniere_date']:
                if not client.date_derniere_operation or data['derniere_date'] > client.date_derniere_operation:
                    client.date_derniere_operation = data['derniere_date']

            if not client.email and data['email']:
                client.email = data['email']
            if not client.telephone and data['telephone']:
                client.telephone = data['telephone']
            if not client.entreprise and data['entreprise']:
                client.entreprise = data['entreprise']

            client.save()

    except ImportError:
        logger.info("App location non disponible")
    except Exception as e:
        logger.warning(f"Erreur sync locations: {e}")

    # ========================================
    # 4. Mettre à jour totaux, éligibilité et évaluations
    # ========================================
    for client in ClientConverti.objects.all():
        # Totaux
        client.nb_operations_total = (client.nb_achats or 0) + (client.nb_locations or 0)
        client.montant_total = (client.total_achats or Decimal('0')) + (client.total_locations or Decimal('0'))

        # Éligibilité promotion
        client.verifier_eligibilite_promotion()

        # Évaluations SAV
        try:
            evals = EvaluationSAV.objects.filter(client_nom__iexact=client.nom)
            nb_evals = evals.count()

            if nb_evals > 0:
                client.nb_evaluations = nb_evals

                avg_globale = evals.aggregate(avg=Avg('satisfaction_globale'))['avg']
                if avg_globale:
                    client.moyenne_satisfaction = Decimal(str(round(float(avg_globale), 1)))

                derniere = evals.order_by('-date_evaluation').first()
                if derniere:
                    client.derniere_note_satisfaction = derniere.satisfaction_globale
                    # Si pas de notes SAV, prendre celles de la dernière évaluation
                    if not client.notes_sav and derniere.notes:
                        client.notes_sav = derniere.notes
            else:
                client.nb_evaluations = 0
                client.moyenne_satisfaction = Decimal('0')
                client.derniere_note_satisfaction = None

        except Exception as e:
            logger.warning(f"Erreur sync eval SAV {client.nom}: {e}")

        client.save()
        resultats['mis_a_jour'] += 1

        if client.eligible_promotion:
            resultats['promos_detectees'] += 1

    return resultats