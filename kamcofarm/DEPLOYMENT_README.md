# 🚀 Guide de Déploiement - FOSS AGRO FARM

## Prérequis

- VPS Ubuntu/Debian sur Hostinger
- Domaine configuré (kamcofarm.com)
- Accès SSH root ou sudo

## 📋 Fichiers de déploiement

- `deploy.sh` - Script principal de déploiement
- `update.sh` - Script de mise à jour
- `monitor.sh` - Script de monitoring

## 🚀 Déploiement initial

### 1. Préparation du serveur

```bash
# Se connecter en SSH
ssh root@votre-ip-hostinger

# Créer un utilisateur non-root (recommandé)
adduser deploy
usermod -aG sudo deploy
su - deploy
```

### 2. Télécharger les fichiers

```bash
# Cloner ou uploader le projet
cd /var/www
git clone https://github.com/votre-repo/farm.git kamcofarm.com
cd kamcofarm.com

# Ou uploader via SCP/FTP
scp deploy.sh update.sh monitor.sh root@votre-ip:/var/www/kamcofarm.com/
```

### 3. Configuration pré-déploiement

```bash
# Rendre les scripts exécutables
chmod +x deploy.sh update.sh monitor.sh

# Éditer les variables dans deploy.sh si nécessaire
nano deploy.sh
# Modifier DOMAIN, DB_PASSWORD, DJANGO_SECRET_KEY, etc.
```

### 4. Lancement du déploiement

```bash
# Lancer le déploiement (peut prendre 15-30 minutes)
sudo ./deploy.sh
```

## 🔧 Configuration post-déploiement

### 1. Créer un superutilisateur Django

```bash
cd /var/www/kamcofarm.com/backend
source ../venv/bin/activate
python manage.py createsuperuser
```

### 2. Configurer l'email

```bash
nano /var/www/kamcofarm.com/.env
# Éditer EMAIL_HOST_USER et EMAIL_HOST_PASSWORD
```

### 3. Uploader les fichiers frontend

```bash
# Uploader votre frontend dans /var/www/kamcofarm.com/frontend/
# Via FTP ou SCP
```

## 🔄 Mises à jour

### Mise à jour automatique

```bash
cd /var/www/kamcofarm.com
sudo ./update.sh
```

### Mise à jour manuelle

```bash
# Sauvegarde
sudo ./backup.sh

# Mise à jour du code
cd /var/www/kamcofarm.com
git pull origin main

# Mise à jour des dépendances
source venv/bin/activate
pip install -r requirements.txt --upgrade

# Migrations et static
cd backend
python manage.py migrate
python manage.py collectstatic --noinput

# Redémarrage
sudo systemctl restart gunicorn_kamcofarm.com
sudo systemctl restart nginx
```

## 📊 Monitoring

### Vérification manuelle

```bash
sudo ./monitor.sh
```

### Monitoring automatique (cron)

```bash
# Ajouter au crontab pour vérifications toutes les heures
sudo crontab -e
# Ajouter: 0 * * * * /var/www/kamcofarm.com/monitor.sh
```

## 🔧 Commandes utiles

### Services
```bash
# Statut des services
sudo systemctl status nginx
sudo systemctl status gunicorn_kamcofarm.com
sudo systemctl status mysql

# Logs
sudo journalctl -u gunicorn_kamcofarm.com -f
sudo tail -f /var/log/nginx/kamcofarm.com.access.log
sudo tail -f /var/log/nginx/kamcofarm.com.error.log
```

### Base de données
```bash
# Connexion MySQL
mysql -u foss_user -p foss_agro_db

# Sauvegarde manuelle
mysqldump -u foss_user -p foss_agro_db > backup_$(date +%Y%m%d).sql
```

### SSL
```bash
# Renouveler certificat SSL
sudo certbot renew

# Tester certificat
openssl s_client -connect kamcofarm.com:443 -servername kamcofarm.com
```

## 🚨 Dépannage

### Application ne démarre pas
```bash
# Vérifier les logs Gunicorn
sudo journalctl -u gunicorn_kamcofarm.com -n 50

# Tester manuellement
cd /var/www/kamcofarm.com/backend
source ../venv/bin/activate
python manage.py check
python manage.py runserver 0.0.0.0:8000
```

### Erreur 502 Bad Gateway
```bash
# Vérifier si Gunicorn fonctionne
sudo systemctl status gunicorn_kamcofarm.com

# Vérifier le socket
ls -la /var/www/kamcofarm.com/gunicorn.sock

# Redémarrer les services
sudo systemctl restart gunicorn_kamcofarm.com
sudo systemctl restart nginx
```

### Problème de base de données
```bash
# Tester la connexion
mysql -u foss_user -p -e "SELECT 1;"

# Vérifier les migrations
cd /var/www/kamcofarm.com/backend
source ../venv/bin/activate
python manage.py showmigrations
```

## 🔒 Sécurité

### Mises à jour régulières
```bash
sudo apt update && sudo apt upgrade
sudo certbot renew
```

### Sauvegardes
- Automatiques quotidiennes configurées
- Vérifier régulièrement les sauvegardes
- Tester la restauration si possible

### Monitoring
- Logs Nginx et Gunicorn
- Monitoring système (disk, RAM, CPU)
- Alertes sur les erreurs

## 📞 Support

En cas de problème :
1. Vérifier les logs
2. Tester les services individuellement
3. Vérifier la configuration
4. Consulter la documentation Django/Nginx

## 📋 Checklist post-déploiement

- [ ] Application accessible sur https://kamcofarm.com
- [ ] Admin Django fonctionne
- [ ] API docs accessible
- [ ] SSL valide
- [ ] Base de données connectée
- [ ] Emails configurés
- [ ] Sauvegardes automatiques
- [ ] Monitoring actif
- [ ] Firewall configuré
- [ ] Superutilisateur créé