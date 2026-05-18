from decimal import Decimal
from datetime import date, timedelta
import logging

logger = logging.getLogger(__name__)


def synchroniser_factures_location():
    """
    Génère automatiquement des FacturationLocation depuis les contrats
    terminés ou actifs qui n'ont pas encore de facturation.
    """
    from .models import (
        ContratLocation, FacturationLocation,
        LigneFacturationLocation
    )

    resultats = {'factures_creees': 0, 'erreurs': 0}

    contrats = ContratLocation.objects.filter(
        statut__in=['ACTIF', 'TERMINE']
    ).select_related('equipement')

    for contrat in contrats:
        # Vérifier si une facturation existe déjà
        facture_existe = FacturationLocation.objects.filter(
            contrat=contrat
        ).exists()

        if facture_existe:
            continue

        if not contrat.client_nom:
            continue

        montant_ht = contrat.montant_location_ht or Decimal('0')
        if montant_ht <= 0 and contrat.montant_total_ttc > 0:
            montant_ht = contrat.sous_total_ht or contrat.montant_total_ttc

        if montant_ht <= 0:
            continue

        try:
            facture = FacturationLocation.objects.create(
                contrat=contrat,
                client_nom=contrat.client_nom,
                client_entreprise=contrat.client_entreprise or '',
                client_email=contrat.client_email or '',
                client_adresse=contrat.client_adresse or '',
                montant_ht=montant_ht,
                taux_tva=contrat.taux_tva or Decimal('19.25'),
                devise=contrat.devise or 'FCFA',
                date_emission=date.today(),
                date_echeance=date.today() + timedelta(days=30),
                statut='EMISE',
                notes=f"Facture auto-générée depuis contrat {contrat.reference}"
            )

            # Ligne location principale
            eq_nom = contrat.equipement.nom if contrat.equipement else 'Équipement'
            LigneFacturationLocation.objects.create(
                facturation=facture,
                type_ligne='LOCATION',
                description=f"Location {eq_nom} — Contrat {contrat.reference} ({contrat.jours_location} jours)",
                quantite=contrat.jours_location or 1,
                unite='jour',
                prix_unitaire=contrat.tarif_base or montant_ht
            )

            # Lignes services annexes
            if hasattr(contrat, 'services_annexes'):
                for service in contrat.services_annexes.filter(est_facture=False):
                    LigneFacturationLocation.objects.create(
                        facturation=facture,
                        type_ligne='SERVICE',
                        description=f"{service.get_type_service_display()} — {service.description}",
                        quantite=service.quantite,
                        unite=service.unite,
                        prix_unitaire=service.prix_unitaire,
                        service_annexe=service
                    )
                    service.est_facture = True
                    service.save(update_fields=['est_facture'])

            # Ligne pénalités
            if contrat.montant_penalites and contrat.montant_penalites > 0:
                LigneFacturationLocation.objects.create(
                    facturation=facture,
                    type_ligne='PENALITE',
                    description=f"Pénalité retard ({contrat.jours_retard} jour(s))",
                    quantite=1,
                    unite='forfait',
                    prix_unitaire=contrat.montant_penalites
                )

            # Recalculer le montant HT
            total_lignes = sum(l.montant_total for l in facture.lignes.all())
            if total_lignes > 0:
                facture.montant_ht = total_lignes
                facture.save()

            resultats['factures_creees'] += 1

        except Exception as e:
            logger.warning(f"Erreur création facture location pour contrat {contrat.reference}: {e}")
            resultats['erreurs'] += 1

    return resultats