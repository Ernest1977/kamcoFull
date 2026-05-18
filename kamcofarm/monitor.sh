#!/bin/bash

# ========================================
# 📊 MONITORING SCRIPT - FOSS AGRO FARM
# Check system and application health
# ========================================

DOMAIN="kamcofarm.com"
PROJECT_DIR="/var/www/$DOMAIN"
LOG_FILE="$PROJECT_DIR/logs/monitoring_$(date +%Y%m%d).log"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "$(date): Starting monitoring check" >> $LOG_FILE

# Check disk usage
echo -e "${BLUE}💾 Checking disk usage...${NC}"
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 90 ]; then
    echo -e "${RED}❌ Disk usage is ${DISK_USAGE}% - CRITICAL${NC}"
    echo "$(date): CRITICAL - Disk usage ${DISK_USAGE}%" >> $LOG_FILE
elif [ "$DISK_USAGE" -gt 75 ]; then
    echo -e "${YELLOW}⚠️ Disk usage is ${DISK_USAGE}% - WARNING${NC}"
    echo "$(date): WARNING - Disk usage ${DISK_USAGE}%" >> $LOG_FILE
else
    echo -e "${GREEN}✅ Disk usage: ${DISK_USAGE}%${NC}"
fi

# Check memory usage
echo -e "${BLUE}🧠 Checking memory usage...${NC}"
MEM_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
if [ "$MEM_USAGE" -gt 90 ]; then
    echo -e "${RED}❌ Memory usage is ${MEM_USAGE}% - CRITICAL${NC}"
    echo "$(date): CRITICAL - Memory usage ${MEM_USAGE}%" >> $LOG_FILE
elif [ "$MEM_USAGE" -gt 75 ]; then
    echo -e "${YELLOW}⚠️ Memory usage is ${MEM_USAGE}% - WARNING${NC}"
    echo "$(date): WARNING - Memory usage ${MEM_USAGE}%" >> $LOG_FILE
else
    echo -e "${GREEN}✅ Memory usage: ${MEM_USAGE}%${NC}"
fi

# Check services
echo -e "${BLUE}🔧 Checking services...${NC}"

# Nginx
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✅ Nginx is running${NC}"
else
    echo -e "${RED}❌ Nginx is not running${NC}"
    echo "$(date): ERROR - Nginx is not running" >> $LOG_FILE
fi

# Gunicorn
if systemctl is-active --quiet gunicorn_$DOMAIN; then
    echo -e "${GREEN}✅ Gunicorn is running${NC}"
else
    echo -e "${RED}❌ Gunicorn is not running${NC}"
    echo "$(date): ERROR - Gunicorn is not running" >> $LOG_FILE
fi

# MySQL
if systemctl is-active --quiet mysql; then
    echo -e "${GREEN}✅ MySQL is running${NC}"
else
    echo -e "${RED}❌ MySQL is not running${NC}"
    echo "$(date): ERROR - MySQL is not running" >> $LOG_FILE
fi

# Check application health
echo -e "${BLUE}🌐 Checking application health...${NC}"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/api/docs/)
if [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Application is responding (HTTP $HTTP_STATUS)${NC}"
else
    echo -e "${RED}❌ Application is not responding (HTTP $HTTP_STATUS)${NC}"
    echo "$(date): ERROR - Application not responding (HTTP $HTTP_STATUS)" >> $LOG_FILE
fi

# Check SSL certificate
echo -e "${BLUE}🔒 Checking SSL certificate...${NC}"
SSL_EXPIRY=$(openssl s_client -connect $DOMAIN:443 -servername $DOMAIN < /dev/null 2>/dev/null | openssl x509 -noout -dates 2>/dev/null | grep notAfter | cut -d'=' -f2)
if [ ! -z "$SSL_EXPIRY" ]; then
    SSL_DAYS_LEFT=$(( ($(date -d "$SSL_EXPIRY" +%s) - $(date +%s)) / 86400 ))
    if [ "$SSL_DAYS_LEFT" -lt 30 ]; then
        echo -e "${RED}❌ SSL certificate expires in $SSL_DAYS_LEFT days${NC}"
        echo "$(date): WARNING - SSL expires in $SSL_DAYS_LEFT days" >> $LOG_FILE
    else
        echo -e "${GREEN}✅ SSL certificate expires in $SSL_DAYS_LEFT days${NC}"
    fi
else
    echo -e "${RED}❌ Could not check SSL certificate${NC}"
fi

# Check recent errors in logs
echo -e "${BLUE}📝 Checking recent errors...${NC}"
ERROR_COUNT=$(journalctl -u gunicorn_$DOMAIN --since "1 hour ago" -p err | wc -l)
if [ "$ERROR_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}⚠️ Found $ERROR_COUNT errors in the last hour${NC}"
    echo "$(date): WARNING - $ERROR_COUNT errors in last hour" >> $LOG_FILE
else
    echo -e "${GREEN}✅ No errors in the last hour${NC}"
fi

echo -e "${GREEN}📊 Monitoring check completed${NC}"
echo "$(date): Monitoring check completed" >> $LOG_FILE
echo "" >> $LOG_FILE