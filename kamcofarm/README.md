# 🌱 FOSS AGRO FARM (KamcoFarm)

## SaaS de Gestion Agricole Intégrée

Leader dans la culture, vente et négoce de produits agricoles frais et secs.

### 🏗️ Architecture

- **Backend** : Django REST Framework + MySQL
- **Frontend** : HTML5, CSS3, JavaScript (Vanilla)
- **Dashboard** : SPA modulaire avec CRUD complet
- **Auth** : JWT (JSON Web Tokens)
- **PDF** : ReportLab
- **Graphiques** : Chart.js
- **PWA** : Service Worker + Manifest

### 📦 Modules

| Module | Description |
|--------|-------------|
| Produits | Catalogue agricole |
| Finance | Devis, factures, paiements |
| Supply Chain | Commandes, stocks, fournisseurs |
| RH | Employés, congés, paie |
| Équipements | Flotte, maintenance, IoT |
| Location | Contrats, cautions, états des lieux |
| Marketing | Newsletter, leads, SAV |
| Content | Pages CMS, FAQ, SEO |
| Administration | Paramètres, notifications |

### 🚀 Installation

1. Cloner le repository
2. Copier `.env.example` vers `.env`
3. Remplir les variables
4. Installer les dépendances
5. Lancer les migrations
6. Démarrer le serveur

Voir la documentation complète dans `/docs/`

### 📧 Contact

- Email : admin@kamco-scoop.com
- Tél : +237 694 57 20 50





######
## pour info personnel
######

Apps RH - LES ENDPOINTS EXPOSÉS SONT :

## Routes custom

/dashboard/
/mon-profil/
/mes-conges/
/demander-conge/
/mes-fiches-paie/
/fiches-paie/<id>/pdf/classique/
/fiches-paie/<id>/pdf/moderne/

## Routes API via router

/departements/
/departements/<id>/
/employes/
/employes/<id>/
/contrats/
/contrats/<id>/
/conges/
/conges/<id>/
/presences/
/presences/<id>/
/fiches-paie/
/fiches-paie/<id>/




Apps EQUIPEMENTS - LES ENDPOINTS EXPOSÉS SONT :

## Routes custom

/dashboard/
/dashboard/iot/
/rapports/utilisation/
/rapports/maintenance/
/rapports/carburant/
/rapports/rentabilite/
/verifications/
/iot/telemetrie/

## Routes API via router

/mouvements/
/cycle-vie/
/capteurs/
/alertes-iot/
/regles-alertes/





Apps FINANCES - LES ENDPOINTS EXPOSÉS SONT :

## Routes explicites (## Routes custom)

test/
creer-demande-devis/
factures/<int:pk>/pdf/
factures/<int:pk>/pdf/apercu/
dashboard/
synchroniser-factures/

## Routes du router (Routes API via router)

devis/
factures/
paiements/
categories-depenses/
depenses/
budgets/
À vérifier





