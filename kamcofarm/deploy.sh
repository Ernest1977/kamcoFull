#!/bin/bash

# ========================================
# 🚀 DEPLOYMENT SCRIPT - FOSS AGRO FARM
# Hostinger VPS - Ubuntu/Debian
# ========================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration variables
DOMAIN="kamcofarm.com"
WWW_DOMAIN="www.kamcofarm.com"
PROJECT_NAME="farm"
PROJECT_DIR="/var/www/$DOMAIN"
VENV_DIR="$PROJECT_DIR/venv"
USER="www-data"
GROUP="www-data"

# Database configuration
DB_NAME="foss_agro_db"
DB_USER="foss_user"
DB_PASSWORD="your-db-password-here"
DB_HOST="localhost"
DB_PORT="3306"

# Django settings
DJANGO_SECRET_KEY="your-production-secret-key-here"
DEBUG="False"

# Load environment variables from .env if available
if [ -f "$PROJECT_DIR/.env" ]; then
    echo -e "${GREEN}🔐 Loading environment from $PROJECT_DIR/.env${NC}"
    set -a
    . "$PROJECT_DIR/.env"
    set +a
fi

# Fallback defaults if not set
DB_PASSWORD="${DB_PASSWORD:-your-db-password-here}"
DJANGO_SECRET_KEY="${DJANGO_SECRET_KEY:-your-production-secret-key-here}"
ALLOWED_HOSTS="$DOMAIN,$WWW_DOMAIN,127.0.0.1,localhost"

echo -e "${BLUE}🚀 Starting deployment for $DOMAIN${NC}"

# ========================================
# 1. SYSTEM UPDATE & BASIC PACKAGES
# ========================================
echo -e "${YELLOW}📦 Updating system and installing basic packages...${NC}"

apt update && apt upgrade -y
apt install -y curl wget git unzip software-properties-common

# ========================================
# 2. PYTHON 3.11 INSTALLATION
# ========================================
echo -e "${YELLOW}🐍 Installing Python 3.11...${NC}"

add-apt-repository ppa:deadsnakes/ppa -y
apt update
apt install -y python3.11 python3.11-venv python3.11-dev python3.11-pip

# Set Python 3.11 as default
update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.11 1
update-alternatives --set python3 /usr/bin/python3.11

# ========================================
# 3. NODE.JS INSTALLATION
# ========================================
echo -e "${YELLOW}🟢 Installing Node.js...${NC}"

curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# ========================================
# 4. MYSQL SERVER INSTALLATION
# ========================================
echo -e "${YELLOW}🗄️ Installing MySQL Server...${NC}"

apt install -y mysql-server

# Secure MySQL installation
mysql_secure_installation <<EOF

y
2
$DB_PASSWORD
$DB_PASSWORD
y
y
y
y
EOF

# Create database and user
mysql -u root -p$DB_PASSWORD <<EOF
CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
EOF

# ========================================
# 4. NGINX INSTALLATION & CONFIGURATION
# ========================================
echo -e "${YELLOW}🌐 Installing and configuring Nginx...${NC}"

apt install -y nginx

# Create Nginx configuration
cat > /etc/nginx/sites-available/$DOMAIN <<EOF
server {
    listen 80;
    server_name $DOMAIN $WWW_DOMAIN;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss;

    # Static files (Django)
    location /static/ {
        alias $PROJECT_DIR/backend/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Media files
    location /media/ {
        alias $PROJECT_DIR/backend/media/;
        expires 30d;
        add_header Cache-Control "public";
    }

    # API and Django admin backend
    location /api/ {
        include proxy_params;
        proxy_pass http://unix:$PROJECT_DIR/gunicorn.sock;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;

        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location /admin/ {
        include proxy_params;
        proxy_pass http://unix:$PROJECT_DIR/gunicorn.sock;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;

        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Built frontend files
    root $PROJECT_DIR/frontend/dist;
    index index.html;

    location /dashboard/ {
        try_files $uri $uri/ /dashboard/index.html;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}

# Redirect www to non-www
server {
    listen 80;
    server_name $WWW_DOMAIN;
    return 301 http://$DOMAIN\$request_uri;
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t

# ========================================
# 5. FIREWALL CONFIGURATION
# ========================================
echo -e "${YELLOW}🔥 Configuring UFW firewall...${NC}"

ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# ========================================
# 6. PROJECT DEPLOYMENT
# ========================================
echo -e "${YELLOW}📁 Setting up project directory...${NC}"

# Create project directory
mkdir -p $PROJECT_DIR
chown -R $USER:$GROUP $PROJECT_DIR

# Clone or copy project files (assuming you have the code ready)
# cd $PROJECT_DIR
# git clone https://github.com/your-repo/farm.git .  # Or copy files manually

# For this script, we'll assume the project is already in place
# If not, uncomment and modify the git clone line above

# ========================================
# 7. PYTHON ENVIRONMENT SETUP
# ========================================
echo -e "${YELLOW}🐍 Setting up Python virtual environment...${NC}"

cd $PROJECT_DIR
python3 -m venv $VENV_DIR
source $VENV_DIR/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install Python dependencies
pip install -r requirements.txt

# Install and build frontend assets
cd $PROJECT_DIR/frontend
npm install
npm run build

# ========================================
# 8. DJANGO CONFIGURATION
# ========================================
echo -e "${YELLOW}⚙️ Configuring Django application...${NC}"

# Create .env file only if it does not already exist
if [ ! -f "$PROJECT_DIR/.env" ]; then
  cat > $PROJECT_DIR/.env <<EOF
# Django Configuration
DJANGO_SECRET_KEY=$DJANGO_SECRET_KEY
DEBUG=$DEBUG
ALLOWED_HOSTS=$ALLOWED_HOSTS

# Database Configuration
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT

# CORS Configuration
CORS_ORIGINS=https://$DOMAIN,https://$WWW_DOMAIN

# URLs
FRONTEND_URL=https://$DOMAIN
BACKEND_URL=https://$DOMAIN

# Email Configuration (configure as needed)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
EOF

  # Set proper permissions
  chmod 600 $PROJECT_DIR/.env
  chown $USER:$GROUP $PROJECT_DIR/.env
else
  echo -e "${GREEN}🔐 .env already exists, leaving it in place.${NC}"
  chmod 600 $PROJECT_DIR/.env
  chown $USER:$GROUP $PROJECT_DIR/.env
fi

# ========================================
# 9. DJANGO APPLICATION SETUP
# ========================================
echo -e "${YELLOW}🚀 Setting up Django application...${NC}"

cd $PROJECT_DIR/backend

# Run migrations
source $VENV_DIR/bin/activate
python manage.py collectstatic --noinput --clear
python manage.py migrate

# Create superuser (optional - you can do this manually later)
# echo "from accounts.models import User; User.objects.create_superuser('admin', 'admin@$DOMAIN', 'your-admin-password')" | python manage.py shell

# ========================================
# 10. GUNICORN CONFIGURATION
# ========================================
echo -e "${YELLOW}🐴 Configuring Gunicorn...${NC}"

# Create Gunicorn service
cat > /etc/systemd/system/gunicorn_$DOMAIN.service <<EOF
[Unit]
Description=Gunicorn daemon for $DOMAIN
After=network.target

[Service]
User=$USER
Group=$GROUP
WorkingDirectory=$PROJECT_DIR/backend
Environment="PATH=$VENV_DIR/bin"
Environment="DJANGO_SETTINGS_MODULE=config.settings"
ExecStart=$VENV_DIR/bin/gunicorn --access-logfile - --workers 3 --bind unix:$PROJECT_DIR/gunicorn.sock config.wsgi:application
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Start and enable Gunicorn service
systemctl daemon-reload
systemctl start gunicorn_$DOMAIN
systemctl enable gunicorn_$DOMAIN

# ========================================
# 11. SSL CERTIFICATE (Let's Encrypt)
# ========================================
echo -e "${YELLOW}🔒 Installing SSL certificate...${NC}"

apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
certbot --nginx -d $DOMAIN -d $WWW_DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN

# ========================================
# 12. LOG ROTATION
# ========================================
echo -e "${YELLOW}📝 Setting up log rotation...${NC}"

cat > /etc/logrotate.d/$DOMAIN <<EOF
$PROJECT_DIR/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 $USER $GROUP
    postrotate
        systemctl reload gunicorn_$DOMAIN
    endscript
}
EOF

# ========================================
# 13. MONITORING & BACKUP
# ========================================
echo -e "${YELLOW}📊 Setting up monitoring and backup...${NC}"

# Install monitoring tools
apt install -y htop iotop ncdu

# Create backup script
cat > $PROJECT_DIR/backup.sh <<EOF
#!/bin/bash
BACKUP_DIR="/var/backups/$DOMAIN"
DATE=\$(date +%Y%m%d_%H%M%S)

mkdir -p \$BACKUP_DIR

# Database backup
mysqldump -u $DB_USER -p$DB_PASSWORD $DB_NAME > \$BACKUP_DIR/db_backup_\$DATE.sql

# Files backup
tar -czf \$BACKUP_DIR/files_backup_\$DATE.tar.gz -C $PROJECT_DIR .

# Keep only last 7 backups
find \$BACKUP_DIR -name "*.sql" -mtime +7 -delete
find \$BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: \$DATE"
EOF

chmod +x $PROJECT_DIR/backup.sh
chown $USER:$GROUP $PROJECT_DIR/backup.sh

# Add backup to cron (daily at 2 AM)
(crontab -l ; echo "0 2 * * * $PROJECT_DIR/backup.sh") | crontab -

# ========================================
# 14. FINAL CHECKS & SERVICES RESTART
# ========================================
echo -e "${YELLOW}🔍 Running final checks...${NC}"

# Restart services
systemctl restart gunicorn_$DOMAIN
systemctl restart nginx

# Check service status
systemctl status gunicorn_$DOMAIN --no-pager
systemctl status nginx --no-pager

# Test Django application
curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/api/docs/ || echo "API check failed"

# ========================================
# 15. DEPLOYMENT SUMMARY
# ========================================
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}📋 Deployment Summary:${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "🌐 Domain: https://$DOMAIN"
echo -e "🔧 Admin: https://$DOMAIN/admin/"
echo -e "📚 API Docs: https://$DOMAIN/api/docs/"
echo -e "🗄️ Database: $DB_NAME"
echo -e "👤 DB User: $DB_USER"
echo -e ""
echo -e "${YELLOW}📝 Next steps:${NC}"
echo -e "1. Create a Django superuser: cd $PROJECT_DIR/backend && source $VENV_DIR/bin/activate && python manage.py createsuperuser"
echo -e "2. Configure email settings in .env file"
echo -e "3. Upload your frontend files to $PROJECT_DIR/frontend/"
echo -e "4. Test all endpoints"
echo -e "5. Monitor logs: tail -f /var/log/nginx/$DOMAIN.access.log"
echo -e ""
echo -e "${RED}🔐 Security reminders:${NC}"
echo -e "- Change default passwords"
echo -e "- Keep system updated: apt update && apt upgrade"
echo -e "- Monitor logs regularly"
echo -e "- Configure firewall rules as needed"
echo -e ""
echo -e "${GREEN}✅ Deployment script finished!${NC}"