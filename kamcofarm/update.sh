#!/bin/bash

# ========================================
# 🔄 UPDATE SCRIPT - FOSS AGRO FARM
# For existing deployments
# ========================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

DOMAIN="kamcofarm.com"
PROJECT_DIR="/var/www/$DOMAIN"
VENV_DIR="$PROJECT_DIR/venv"
BACKUP_DIR="/var/backups/$DOMAIN"

echo -e "${BLUE}🔄 Starting update for $DOMAIN${NC}"

# Create backup before update
echo -e "${YELLOW}💾 Creating backup before update...${NC}"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Database backup
mysqldump -u foss_user -pIsai1234 foss_agro_db > $BACKUP_DIR/pre_update_db_$DATE.sql

# Files backup
tar -czf $BACKUP_DIR/pre_update_files_$DATE.tar.gz -C $PROJECT_DIR .

# Pull latest changes (if using git)
cd $PROJECT_DIR
if [ -d ".git" ]; then
    echo -e "${YELLOW}📥 Pulling latest changes from git...${NC}"
    git pull origin main
else
    echo -e "${YELLOW}⚠️ No git repository found. Please update files manually.${NC}"
fi

# Activate virtual environment
source $VENV_DIR/bin/activate

# Install/update Python dependencies
echo -e "${YELLOW}📦 Updating Python dependencies...${NC}"
pip install -r requirements.txt --upgrade

# Run Django migrations
echo -e "${YELLOW}🗄️ Running Django migrations...${NC}"
cd $PROJECT_DIR/backend
python manage.py migrate

# Collect static files
echo -e "${YELLOW}📁 Collecting static files...${NC}"
python manage.py collectstatic --noinput --clear

# Restart services
echo -e "${YELLOW}🔄 Restarting services...${NC}"
systemctl restart gunicorn_$DOMAIN
systemctl restart nginx

# Test application
echo -e "${YELLOW}🧪 Testing application...${NC}"
sleep 5
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/api/docs/)
if [ "$RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ Update successful! Application is running.${NC}"
else
    echo -e "${RED}❌ Update failed! Check logs.${NC}"
    echo -e "${YELLOW}📋 Recent logs:${NC}"
    journalctl -u gunicorn_$DOMAIN -n 20 --no-pager
fi

echo -e "${GREEN}🔄 Update completed!${NC}"