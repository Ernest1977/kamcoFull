# 📦 Intégration manuelle des modifications — KamcoFarm

Ce dossier contient **tous les fichiers modifiés** depuis le dernier état de ton dépôt
(commit `18c4c22`). Tu as **3 méthodes** au choix pour les intégrer. La **Méthode 1** est la plus simple.

---

## 📋 Liste des fichiers (11)

| Fichier | Statut | Ce qui change |
|---------|--------|---------------|
| `.gitignore` | 🆕 nouveau | Ignore `.cache`, `__pycache__`, `.env`, `node_modules`… |
| `kamcofarm/backend/accounts/migrations/0003_user_signature.py` | 🆕 nouveau | Migration manquante (champ `signature`) |
| `kamcofarm/backend/supplychain/migrations/0003_devis_commandeclient_devis_origine_lignedevis.py` | 🆕 nouveau | Migration manquante (Devis, LigneDevis, devis_origine) |
| `kamcofarm/backend/supplychain/pdf_generator.py` | ✏️ modifié | Frais en lignes séparées, bug `formatMoney` corrigé, email `infoclients@` |
| `kamcofarm/backend/supplychain/serializers.py` | ✏️ modifié | Champ `token` exposé, calcul frais centralisé, méthode `update()` |
| `kamcofarm/backend/supplychain/views.py` | ✏️ modifié | PDF accessible par token UUID (fin du 401) |
| `kamcofarm/frontend/dashboard/dashboard.js` | ✏️ modifié | Fonctions `showSuccess`/`showToast` (toasts) |
| `kamcofarm/frontend/dashboard/modules/supplychain.js` | ✏️ modifié | **CRUD complet restauré** + Devis (multi-lignes, frais, PDF) |
| `kamcofarm/frontend/view-quote.html` | ✏️ modifié | Logo KamcoFarm + email `infoclients@` |
| `kamcofarm/frontend/index.html` | ✏️ modifié | **Hero : image des fruits centrée en haut (40% largeur)** |
| `kamcofarm/frontend/style.css` | ✏️ modifié | **Hero : disposition verticale, `.hero-image` centrée 40% (75% sur mobile)** |

---

## ✅ Méthode 1 — Remplacer les fichiers (la plus simple)

1. Décompresse `kamcofarm_fichiers_modifies.zip`.
2. Copie son contenu **par-dessus** ton dépôt local, en conservant l'arborescence
   (le `.gitignore` va à la racine du dépôt, à côté du dossier `kamcofarm/`).
   - Sur Windows : copier/coller et « Remplacer les fichiers dans la destination ».
   - En ligne de commande (depuis la racine du dépôt) :
     ```bash
     cp -r /chemin/vers/extraction/. .
     ```
3. Vérifie, commit et pousse :
   ```bash
   git add .
   git status          # contrôle que les 9 fichiers apparaissent
   git commit -m "fix(supplychain+devis): CRUD complet, frais logistique, PDF, portail, toasts"
   git push origin main
   ```

---

## ✅ Méthode 2 — Appliquer le patch git

Depuis la **racine** de ton dépôt local (là où se trouve le dossier `kamcofarm/`) :

```bash
git apply --check kamcofarm_modifications.patch   # test à blanc (ne modifie rien)
git apply kamcofarm_modifications.patch           # applique réellement
git add .
git commit -m "fix(supplychain+devis): CRUD complet, frais logistique, PDF, portail, toasts"
git push origin main
```

> Si `git apply --check` renvoie une erreur, c'est que ton dépôt n'est pas exactement sur
> le commit `18c4c22`. Utilise alors la **Méthode 1** (remplacement de fichiers).

---

## ✅ Méthode 3 — Copier chaque fichier à la main

Ouvre chaque fichier de ce dossier et recopie son contenu dans le fichier correspondant
de ton dépôt (même chemin). Puis `git add . && git commit && git push`.

---

## ⚠️ Après le déploiement (IMPORTANT)

Les 2 fichiers de **migration** sont indispensables. Ton `entrypoint.sh` Docker exécute
déjà `python manage.py migrate` au démarrage, donc elles s'appliqueront automatiquement.
Sinon, applique-les manuellement :

```bash
# en local
cd kamcofarm/backend && python manage.py migrate

# ou via Docker
docker compose exec backend python manage.py migrate
```
