# 🚀 Odyssey - Production Deployment Guide

**Version:** 1.0.0  
**Last Updated:** October 2025  
**Support:** support@odysseyjournal.com

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Configuration](#database-configuration)
4. [Backend Deployment](#backend-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [Production Checklist](#production-checklist)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Prerequisites

### Required Software
- **Java 17+** (OpenJDK or Oracle JDK)
- **Node.js 18+** (LTS recommended)
- **MySQL 8.0+**
- **Maven 3.6+** (or use included wrapper)
- **Git** for version control

### Required Services
- **Geoapify API Key** ([Get free key](https://www.geoapify.com/))
- **Domain Name** (for production deployment)
- **SSL Certificate** (Let's Encrypt recommended)
- **Cloud Server** (AWS EC2, DigitalOcean, Azure, etc.)

### Recommended Server Specs
```
Minimum (100-500 users):
- 2 vCPUs
- 4 GB RAM
- 50 GB SSD Storage

Recommended (2K-5K users):
- 4 vCPUs
- 8 GB RAM
- 100 GB SSD Storage
- Load balancer for high availability
```

---

## 🔧 Environment Setup

### 1. Clone the Repository
```bash
git clone https://github.com/Usersaketh/odyssey.git
cd odyssey
```

### 2. Server Preparation

#### Ubuntu/Debian
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Java 17
sudo apt install openjdk-17-jdk -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs -y

# Install MySQL
sudo apt install mysql-server -y
sudo mysql_secure_installation

# Install Nginx (for reverse proxy)
sudo apt install nginx -y

# Install Certbot (for SSL)
sudo apt install certbot python3-certbot-nginx -y
```

#### CentOS/RHEL
```bash
# Update system
sudo yum update -y

# Install Java 17
sudo yum install java-17-openjdk-devel -y

# Install Node.js 18
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install nodejs -y

# Install MySQL
sudo yum install mysql-server -y
sudo systemctl start mysqld
sudo mysql_secure_installation

# Install Nginx
sudo yum install nginx -y

# Install Certbot
sudo yum install certbot python3-certbot-nginx -y
```

---

## 💾 Database Configuration

### 1. Create Production Database
```sql
# Login to MySQL
sudo mysql -u root -p

# Create database
CREATE DATABASE odyssey_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Create dedicated user
CREATE USER 'odyssey_user'@'localhost' IDENTIFIED BY 'STRONG_PASSWORD_HERE';

# Grant privileges
GRANT ALL PRIVILEGES ON odyssey_prod.* TO 'odyssey_user'@'localhost';
FLUSH PRIVILEGES;

# Exit MySQL
EXIT;
```

### 2. Apply Database Indexes
```bash
# Navigate to project root
cd /path/to/odyssey

# Apply optimizations
mysql -u odyssey_user -p odyssey_prod < database_indexes.sql
```

### 3. Verify Database Connection
```bash
mysql -u odyssey_user -p odyssey_prod -e "SHOW TABLES;"
```

---

## 🔨 Backend Deployment

### 1. Configure Production Properties

Create `odyssey-backend/src/main/resources/application-production.properties`:

```properties
# Server Configuration
server.port=9090
server.servlet.context-path=/

# Production Database
spring.datasource.url=jdbc:mysql://localhost:3306/odyssey_prod?useSSL=true&requireSSL=true
spring.datasource.username=odyssey_user
spring.datasource.password=${DB_PASSWORD}
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

# JPA Configuration
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.format_sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQL8Dialect

# JWT Configuration
app.jwt.secret=${JWT_SECRET}
app.jwt.expiration=86400000

# File Upload Configuration
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=50MB
spring.servlet.multipart.location=/var/odyssey/uploads

# Logging Configuration
logging.level.org.springframework.security=WARN
logging.level.com.odyssey=INFO
logging.file.name=/var/log/odyssey/application.log
logging.file.max-size=10MB
logging.file.max-history=30

# Performance Tuning
spring.datasource.hikari.maximum-pool-size=20
spring.datasource.hikari.minimum-idle=10
spring.datasource.hikari.connection-timeout=30000
spring.datasource.hikari.idle-timeout=600000
spring.datasource.hikari.max-lifetime=1800000
spring.datasource.hikari.leak-detection-threshold=60000

# CORS Configuration (update with your domain)
cors.allowed.origins=https://yourdomain.com,https://www.yourdomain.com
```

### 2. Create Environment Variables

```bash
# Create environment file
sudo nano /etc/environment

# Add these variables
export DB_PASSWORD="your_database_password"
export JWT_SECRET="your_jwt_secret_key_min_256_bits"
export UPLOAD_DIR="/var/odyssey/uploads"
```

### 3. Build Production JAR

```bash
cd odyssey-backend

# Clean and build
mvn clean package -DskipTests -Dspring.profiles.active=production

# Verify JAR creation
ls -lh target/odyssey-backend-0.0.1-SNAPSHOT.jar
```

### 4. Create Upload Directory

```bash
sudo mkdir -p /var/odyssey/uploads
sudo chown -R $USER:$USER /var/odyssey
sudo chmod -R 755 /var/odyssey
```

### 5. Create Systemd Service

```bash
sudo nano /etc/systemd/system/odyssey-backend.service
```

Add the following content:

```ini
[Unit]
Description=Odyssey Backend Service
After=network.target mysql.service

[Service]
Type=simple
User=odyssey
WorkingDirectory=/opt/odyssey/backend
ExecStart=/usr/bin/java -Xmx2g -Xms1g -XX:+UseG1GC \
  -Dspring.profiles.active=production \
  -jar /opt/odyssey/backend/odyssey-backend-0.0.1-SNAPSHOT.jar
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=odyssey-backend

Environment="DB_PASSWORD=your_database_password"
Environment="JWT_SECRET=your_jwt_secret_key"

[Install]
WantedBy=multi-user.target
```

### 6. Deploy and Start Backend

```bash
# Create deployment directory
sudo mkdir -p /opt/odyssey/backend

# Copy JAR file
sudo cp target/odyssey-backend-0.0.1-SNAPSHOT.jar /opt/odyssey/backend/

# Create odyssey user
sudo useradd -r -s /bin/false odyssey
sudo chown -R odyssey:odyssey /opt/odyssey

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable odyssey-backend
sudo systemctl start odyssey-backend

# Check status
sudo systemctl status odyssey-backend

# View logs
sudo journalctl -u odyssey-backend -f
```

---

## 🎨 Frontend Deployment

### 1. Configure Environment Variables

Create `odyssey-frontend/.env.production`:

```bash
# API Configuration
VITE_API_BASE_URL=https://api.yourdomain.com/api
VITE_APP_NAME=Odyssey

# Geoapify API
VITE_GEOAPIFY_API_KEY=your_geoapify_api_key_here

# Feature Flags
VITE_ENABLE_DARK_MODE=true
VITE_ENABLE_PWA=true
VITE_ENABLE_ANALYTICS=false

# Production
VITE_NODE_ENV=production
```

### 2. Build for Production

```bash
cd odyssey-frontend

# Install dependencies
npm ci --production

# Build
npm run build

# Verify build
ls -lh dist/
```

### 3. Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/odyssey
```

Add this configuration:

```nginx
# Backend API Server
upstream odyssey_backend {
    server localhost:9090;
    keepalive 32;
}

# Main website
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration (managed by Certbot)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Root directory
    root /var/www/odyssey;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;

    # Frontend files
    location / {
        try_files $uri $uri/ /index.html;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API Proxy
    location /api/ {
        proxy_pass http://odyssey_backend/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 90;
        
        # CORS headers (if needed)
        add_header 'Access-Control-Allow-Origin' '$http_origin' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Authorization,Content-Type,Accept,Origin' always;
    }

    # Uploaded images
    location /uploads/ {
        alias /var/odyssey/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Disable access to hidden files
    location ~ /\. {
        deny all;
    }
}
```

### 4. Deploy Frontend

```bash
# Create web directory
sudo mkdir -p /var/www/odyssey

# Copy built files
sudo cp -r dist/* /var/www/odyssey/

# Set permissions
sudo chown -R www-data:www-data /var/www/odyssey
sudo chmod -R 755 /var/www/odyssey

# Enable site
sudo ln -s /etc/nginx/sites-available/odyssey /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### 5. Setup SSL Certificate

```bash
# Get SSL certificate from Let's Encrypt
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

---

## ✅ Production Checklist

### Security
- [ ] Change all default passwords
- [ ] Generate strong JWT secret (min 256 bits)
- [ ] Enable HTTPS/SSL
- [ ] Configure firewall (UFW/firewalld)
- [ ] Set up fail2ban for SSH protection
- [ ] Review and update CORS origins
- [ ] Enable security headers in Nginx
- [ ] Regular security updates scheduled

### Performance
- [ ] Database indexes applied
- [ ] Connection pool configured (HikariCP)
- [ ] Gzip compression enabled
- [ ] CDN configured (optional)
- [ ] Image optimization enabled
- [ ] Browser caching configured
- [ ] Health check endpoints tested

### Monitoring
- [ ] Application logging configured
- [ ] Error tracking setup (Sentry/Rollbar)
- [ ] Uptime monitoring (UptimeRobot/Pingdom)
- [ ] Database backup automated
- [ ] Disk space monitoring
- [ ] CPU/Memory alerts configured

### Backup
- [ ] Database backup script created
- [ ] Uploaded files backup configured
- [ ] Backup restoration tested
- [ ] Off-site backup storage setup

### Documentation
- [ ] API documentation available
- [ ] Deployment procedures documented
- [ ] Rollback procedures documented
- [ ] Emergency contacts listed

---

## 📊 Monitoring & Maintenance

### Application Health Check

```bash
# Check backend service
sudo systemctl status odyssey-backend

# View recent logs
sudo journalctl -u odyssey-backend -n 100

# Monitor in real-time
sudo journalctl -u odyssey-backend -f

# Check Nginx status
sudo systemctl status nginx

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Check application logs
sudo tail -f /var/log/odyssey/application.log
```

### Database Backup Script

Create `/opt/odyssey/backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/odyssey"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="odyssey_prod"
DB_USER="odyssey_user"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
mysqldump -u $DB_USER -p$DB_PASSWORD $DB_NAME | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# Backup uploaded files
tar -czf $BACKUP_DIR/uploads_backup_$DATE.tar.gz /var/odyssey/uploads/

# Delete backups older than 30 days
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "Backup completed: $DATE"
```

### Automate Backups

```bash
# Make script executable
chmod +x /opt/odyssey/backup.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add this line:
0 2 * * * /opt/odyssey/backup.sh >> /var/log/odyssey/backup.log 2>&1
```

### Performance Monitoring

```bash
# Monitor Java process
ps aux | grep java

# Check memory usage
free -h

# Check disk space
df -h

# Monitor database connections
mysql -u odyssey_user -p -e "SHOW PROCESSLIST;"

# Check active connections
netstat -an | grep :9090 | wc -l
```

---

## 🔧 Troubleshooting

### Backend Won't Start

```bash
# Check service status
sudo systemctl status odyssey-backend

# View detailed logs
sudo journalctl -u odyssey-backend -n 200

# Common issues:
# 1. Port already in use
sudo lsof -i :9090

# 2. Database connection failed
mysql -u odyssey_user -p odyssey_prod -e "SELECT 1;"

# 3. Permission issues
ls -la /opt/odyssey/backend/
sudo chown -R odyssey:odyssey /opt/odyssey
```

### Frontend 502 Bad Gateway

```bash
# Check Nginx configuration
sudo nginx -t

# Check backend is running
curl http://localhost:9090/api/auth/login

# Restart services
sudo systemctl restart odyssey-backend
sudo systemctl restart nginx

# Check firewall
sudo ufw status
```

### High Memory Usage

```bash
# Check Java heap usage
jstat -gc <pid>

# Adjust JVM settings in systemd service:
-Xmx2g  # Maximum heap size
-Xms1g  # Initial heap size
-XX:+UseG1GC  # Use G1 garbage collector
```

### Database Connection Pool Exhausted

Edit `application-production.properties`:
```properties
spring.datasource.hikari.maximum-pool-size=30
spring.datasource.hikari.connection-timeout=60000
```

### Slow Response Times

```bash
# Check database slow queries
mysql -u odyssey_user -p -e "
  SET GLOBAL slow_query_log = 'ON';
  SET GLOBAL long_query_time = 2;
  SHOW VARIABLES LIKE 'slow_query_log%';
"

# Monitor slow query log
sudo tail -f /var/log/mysql/mysql-slow.log

# Check if indexes are being used
mysql -u odyssey_user -p odyssey_prod -e "
  EXPLAIN SELECT * FROM journals WHERE user_id = 'some-id';
"
```

---

## 🚀 Scaling for High Traffic

### Horizontal Scaling

**Load Balancer Configuration (Nginx):**

```nginx
upstream odyssey_backend_cluster {
    least_conn;
    server backend1.internal:9090;
    server backend2.internal:9090;
    server backend3.internal:9090;
}
```

### Database Replication

**Master-Slave Setup:**
```properties
# Master
spring.datasource.url=jdbc:mysql://master-db:3306/odyssey_prod

# Read Replicas
spring.datasource.read.url=jdbc:mysql://slave-db:3306/odyssey_prod
```

### CDN Integration

Serve static assets through CloudFlare/CloudFront for global performance.

---

### Emergency Contacts
```
Technical Lead: sakethdussa1234@gmail.com
```

---

## 📜 License & Legal

- Review and update `PrivacyPolicy.tsx`
- Review and update `TermsOfService.tsx`
- Ensure GDPR compliance if serving EU users
- Set up data retention policies
- Configure user data export functionality

---

**Deployment Guide Version:** 1.0.0  
**Last Updated:** October 25, 2025  

**Need help?** Contact: sakethdussa1234@gmail.com
