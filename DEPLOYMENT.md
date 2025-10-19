# Deployment Guide - GitHub to Production

This guide explains how to deploy the Multi-Author Editorial Platform from GitHub to a production Ubuntu server.

## Prerequisites

- Ubuntu 20.04 LTS or higher server
- Root or sudo access
- Git installed on the server
- GitHub repository with the code

## Step 1: Prepare GitHub Repository

### 1.1 Create GitHub Repository

1. Go to [GitHub](https://github.com) and create a new repository
2. Name it something like `editorial-platform` or your preferred name
3. Set it to public or private as needed
4. Don't initialize with README (we already have one)

### 1.2 Push Code to GitHub

From your local development environment or Replit:

```bash
# Initialize git if not already done
git init

# Add all files (respecting .gitignore)
git add .

# Commit
git commit -m "Initial commit - Multi-Author Editorial Platform"

# Add remote (replace with your GitHub URL)
git remote add origin https://github.com/yourusername/editorial-platform.git

# Push to GitHub
git push -u origin main
```

### 1.3 Verify `.gitignore`

Make sure your `.gitignore` file is properly configured to exclude:
- `.env` file (sensitive data)
- `node_modules/`
- `dist/` build directory
- Database files
- Log files
- Temporary files

**Never commit:**
- API keys or secrets
- Database credentials
- `.env` file
- Private keys or certificates

## Step 2: Server Preparation

### 2.1 Connect to Your Server

```bash
ssh root@your-server-ip
```

Or with a specific user:
```bash
ssh username@your-server-ip
```

### 2.2 Update System

```bash
apt-get update
apt-get upgrade -y
```

### 2.3 Install Git (if not installed)

```bash
apt-get install git -y
```

## Step 3: Clone and Install

### 3.1 Clone Repository

```bash
# Navigate to home directory or preferred location
cd /opt

# Clone your repository
git clone https://github.com/yourusername/editorial-platform.git

# Enter directory
cd editorial-platform
```

### 3.2 Run Installation Script

```bash
# Make installation script executable (if not already)
chmod +x install.sh

# Run the installer as root
sudo bash install.sh
```

The installer will:
1. Ask for installation language
2. Install Node.js, PostgreSQL, and system dependencies
3. Create database and user
4. Configure environment variables
5. Initialize database schema
6. Create admin user
7. Configure firewall
8. Set up systemd service
9. Optionally configure Nginx and SSL

Follow all prompts and save the credentials provided.

## Step 4: Post-Installation Configuration

### 4.1 Configure Environment Variables

The installer creates a `.env` file, but you may need to update it:

```bash
nano /home/editorial/editorial-platform/.env
```

Update the following if needed:
- PayPal credentials (for production)
- Email service API keys
- Object storage credentials
- Any other service integrations

### 4.2 Verify Service Status

```bash
# Check if service is running
sudo systemctl status editorial-platform

# View logs
sudo journalctl -u editorial-platform -n 50

# Follow logs in real-time
sudo journalctl -u editorial-platform -f
```

### 4.3 Test the Application

Open your browser and navigate to:
- Without domain: `http://your-server-ip:5000`
- With Nginx: `https://yourdomain.com`

Try logging in with your admin credentials.

## Step 5: Domain and SSL Setup

### 5.1 Configure DNS

Point your domain to your server IP:
1. Go to your domain registrar
2. Add an A record: `@` → `your-server-ip`
3. Optional: Add www subdomain: `www` → `your-server-ip`
4. Wait for DNS propagation (can take up to 24 hours)

### 5.2 Configure Nginx (if not done during installation)

```bash
# Create Nginx config
sudo nano /etc/nginx/sites-available/editorial-platform
```

Add:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable and test:
```bash
sudo ln -s /etc/nginx/sites-available/editorial-platform /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5.3 Install SSL Certificate

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx -y

# Get certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow the prompts
# Certbot will automatically configure Nginx for HTTPS
```

Certbot will auto-renew. To test renewal:
```bash
sudo certbot renew --dry-run
```

## Step 6: Security Hardening

### 6.1 Configure Firewall

```bash
# Enable UFW
sudo ufw enable

# Allow SSH (important - don't lock yourself out!)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# If you need the app port directly (usually not needed with Nginx)
sudo ufw allow 5000/tcp

# Check status
sudo ufw status
```

### 6.2 Secure SSH (Optional but Recommended)

```bash
# Edit SSH config
sudo nano /etc/ssh/sshd_config
```

Recommended changes:
```
PermitRootLogin no
PasswordAuthentication no  # Only if you have SSH keys set up
Port 2222  # Change default SSH port (optional)
```

Restart SSH:
```bash
sudo systemctl restart sshd
```

### 6.3 Set Up Fail2Ban (Optional)

```bash
# Install
sudo apt-get install fail2ban -y

# Enable
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

## Step 7: Monitoring and Maintenance

### 7.1 Set Up Log Rotation

Create log rotation config:
```bash
sudo nano /etc/logrotate.d/editorial-platform
```

Add:
```
/var/log/editorial-platform/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
}
```

### 7.2 Database Backups

Create backup script:
```bash
sudo nano /usr/local/bin/backup-editorial-db.sh
```

Add:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/editorial-platform"
mkdir -p $BACKUP_DIR
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
pg_dump -U editorial_user editorial_platform | gzip > $BACKUP_DIR/backup_$TIMESTAMP.sql.gz
# Keep only last 30 days of backups
find $BACKUP_DIR -type f -mtime +30 -delete
```

Make executable and add to cron:
```bash
sudo chmod +x /usr/local/bin/backup-editorial-db.sh
sudo crontab -e
```

Add daily backup at 2 AM:
```
0 2 * * * /usr/local/bin/backup-editorial-db.sh
```

### 7.3 Monitoring

Set up monitoring with:
- **PM2** (alternative to systemd) with monitoring dashboard
- **Uptime Robot** for uptime monitoring
- **Sentry** for error tracking
- **Google Analytics** for visitor tracking

## Step 8: Updates and Maintenance

### 8.1 Update Application

```bash
# Navigate to application directory
cd /home/editorial/editorial-platform

# Stop service
sudo systemctl stop editorial-platform

# Pull latest changes
sudo -u editorial git pull origin main

# Install new dependencies (if any)
sudo -u editorial npm install --production

# Run migrations (if any)
sudo -u editorial npm run db:push

# Build (if needed)
sudo -u editorial npm run build

# Start service
sudo systemctl start editorial-platform

# Check logs
sudo journalctl -u editorial-platform -f
```

### 8.2 Rollback if Needed

```bash
# View commit history
git log --oneline

# Rollback to specific commit
git reset --hard <commit-hash>

# Reinstall dependencies
npm install --production

# Restart service
sudo systemctl restart editorial-platform
```

## Troubleshooting

### Service Won't Start

```bash
# Check service status
sudo systemctl status editorial-platform

# View detailed logs
sudo journalctl -u editorial-platform -n 100 --no-pager

# Check if port is in use
sudo netstat -tulpn | grep 5000

# Check .env file exists and is readable
ls -la /home/editorial/editorial-platform/.env
```

### Database Connection Issues

```bash
# Test database connection
sudo -u editorial psql -d editorial_platform

# Check PostgreSQL is running
sudo systemctl status postgresql

# View PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-*-main.log
```

### SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Renew certificate manually
sudo certbot renew

# Check Nginx configuration
sudo nginx -t
```

## Performance Optimization

### Enable Gzip Compression in Nginx

```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
gzip_comp_level 6;
```

### Add Caching Headers

```nginx
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### Database Optimization

```sql
-- As postgres user
CREATE INDEX IF NOT EXISTS idx_books_author_id ON books(author_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
VACUUM ANALYZE;
```

## Checklist

Before going live:

- [ ] Repository pushed to GitHub
- [ ] Server provisioned and accessible
- [ ] Application installed successfully
- [ ] Admin user created and tested
- [ ] Database configured and running
- [ ] Environment variables configured (including production PayPal)
- [ ] Domain DNS configured
- [ ] SSL certificate installed
- [ ] Firewall configured
- [ ] Backups configured
- [ ] Monitoring set up
- [ ] Security hardening completed
- [ ] Application tested end-to-end
- [ ] Payment flow tested
- [ ] Error pages configured
- [ ] Terms of Service and Privacy Policy added

---

## Support

If you encounter issues:
1. Check the logs: `sudo journalctl -u editorial-platform -f`
2. Review [INSTALLATION.md](INSTALLATION.md)
3. Open an issue on GitHub
4. Contact support

Good luck with your deployment! 🚀
