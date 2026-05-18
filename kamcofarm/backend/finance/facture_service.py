from decimal import Decimal
from datetime import date, timedelta
import logging

logger = logging.getLogger(__name__)


def synchroniser_factures():
    """
    Génère automatiquement des factures depuis :
    - Commandes clients confirmées/livrées sans facture
    - Contrats de location terminés/actifs sans facture
    """
    from .models import Facture, LigneFacture

    resultats = {'factures_achats': 0, 'factures_locations': 0, 'erreurs': 0}

    # ========================================
    # 1. Factures depuis les commandes clients
    # ========================================
    try:
        from supplychain.models import CommandeClient

        commandes = CommandeClient.objects.filter(
            statut__in=['CONFIRMEE', 'EN_PREPARATION', 'EXPEDIEE', 'LIVREE']
        )

        for cmd in commandes:
            # Vérifier si une facture existe déjà pour cette commande
            facture_existe = Facture.objects.filter(
                commande_source=cmd
            ).exists()

            # Aussi vérifier via le champ commande si il existe
            if not facture_existe:
                try:
                    facture_existe = Facture.objects.filter(
                        commande=cmd
                    ).exists()
                except Exception:
                    pass

            if facture_existe:
                continue

            if not cmd.client_nom or not cmd.montant_total or cmd.montant_total <= 0:
                continue

            try:
                # Créer la facture
                facture = Facture(
                    type_operation='ACHAT',
                    commande_source=cmd,
                    client_nom=cmd.client_nom,
                    client_entreprise=cmd.client_entreprise or '',
                    client_email=cmd.client_email or '',
                    client_telephone=cmd.client_telephone or '',
                    montant_ht=cmd.montant_total,
                    tva_pourcentage=Decimal('19.25'),
                    devise=cmd.devise or 'FCFA',
                    date_emission=date.today(),
                    date_echeance=date.today() + timedelta(days=30),
                    statut='BROUILLON',
                    est_auto_generee=True,
                    notes=f"Facture auto-générée depuis commande {cmd.reference}"
                )
                facture.save()

                # Créer les lignes depuis les lignes de commande
                if hasattr(cmd, 'lignes'):
                    for ligne in cmd.lignes.all():
                        LigneFacture.objects.create(
                            facture=facture,
                            categorie_ligne=ligne.categorie_ligne or 'PRODUIT_AGRICOLE',
                            description=ligne.description or (ligne.produit.nom if ligne.produit else 'Produit'),
                            produit=ligne.produit,
                            equipement=getattr(ligne, 'equipement', None),
                            quantite=ligne.quantite_kg,
                            unite='kg',
                            prix_unitaire=ligne.prix_unitaire
                        )

                resultats['factures_achats'] += 1

            except Exception as e:
                logger.warning(f"Erreur création facture pour commande {cmd.reference}: {e}")
                resultats['erreurs'] += 1

    except ImportError:
        logger.info("App supplychain non disponible")
    except Exception as e:
        logger.warning(f"Erreur sync factures achats: {e}")

    # ========================================
    # 2. Factures depuis les contrats de location
    # ========================================
    try:
        from location.models import ContratLocation

        contrats = ContratLocation.objects.filter(
            statut__in=['ACTIF', 'TERMINE']
        )

        for contrat in contrats:
            facture_existe = Facture.objects.filter(
                contrat_location_source=contrat
            ).exists()

            if facture_existe:
                continue

            if not contrat.client_nom or not contrat.montant_total_ttc or contrat.montant_total_ttc <= 0:
                continue

            try:
                facture = Facture(
                    type_operation='LOCATION',
                    contrat_location_source=contrat,
                    client_nom=contrat.client_nom,
                    client_entreprise=contrat.client_entreprise or '',
                    client_email=contrat.client_email or '',
                    client_telephone=contrat.client_telephone or '',
                    montant_ht=contrat.sous_total_ht or contrat.montant_location_ht or Decimal('0'),
                    tva_pourcentage=contrat.taux_tva or Decimal('19.25'),
                    devise=contrat.devise or 'FCFA',
                    date_emission=date.today(),
                    date_echeance=date.today() + timedelta(days=30),
                    statut='BROUILLON',
                    est_auto_generee=True,
                    notes=f"Facture auto-générée depuis contrat location {contrat.reference}"
                )
                facture.save()

                # Ligne principale location
                                # Ligne principale location
                LigneFacture.objects.create(
                    facture=facture,
                    categorie_ligne='LOCATION',
                    description=f"Location {contrat.equipement.nom if contrat.equipement else 'Équipement'} — Contrat {contrat.reference}",
                    equipement=contrat.equipement,
                    quantite=Decimal('1'),
                    unite='forfait',
                    prix_unitaire=contrat.montant_location_ht or contrat.sous_total_ht or Decimal('0')
                )

                # Lignes services annexes
                if hasattr(contrat, 'services_annexes'):
                    for service in contrat.services_annexes.all():
                        LigneFacture.objects.create(
                            facture=facture,
                            description=f"Service : {service.get_type_service_display()} — {service.description}",
                            quantite=service.quantite,
                            unite=service.unite,
                            prix_unitaire=service.prix_unitaire
                        )

                # Ligne pénalités
                if contrat.montant_penalites and contrat.montant_penalites > 0:
                    LigneFacture.objects.create(
                        facture=facture,
                        description=f"Pénalité retard ({contrat.jours_retard} jours)",
                        quantite=Decimal('1'),
                        unite='forfait',
                        prix_unitaire=contrat.montant_penalites
                    )

                # Recalculer
                total_lignes = sum(l.sous_total for l in facture.lignes.all())
                if total_lignes > 0:
                    facture.montant_ht = total_lignes
                    facture.save()

                resultats['factures_locations'] += 1

            except Exception as e:
                logger.warning(f"Erreur création facture pour contrat {contrat.reference}: {e}")
                resultats['erreurs'] += 1

    except ImportError:
        logger.info("App location non disponible")
    except Exception as e:
        logger.warning(f"Erreur sync factures locations: {e}")

    return resultats