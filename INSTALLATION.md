# Installation Guide - Multi-Author Editorial Platform

This guide will help you install the Multi-Author Editorial Platform on an Ubuntu server.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Installation](#quick-installation)
3. [Manual Installation](#manual-installation)
4. [Post-Installation](#post-installation)
5. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements

- **Operating System**: Ubuntu 20.04 LTS or higher (other Linux distributions may work with modifications)
- **RAM**: Minimum 2GB (4GB recommended)
- **Disk Space**: Minimum 10GB free space
- **CPU**: 1 core minimum (2 cores recommended)
- **Network**: Internet connection for downloading dependencies

### Required Software

The installation script will automatically install:
- Node.js 20.x
- PostgreSQL 14+
- Nginx (optional, for reverse proxy)
- Certbot (optional, for SSL certificates)

### Access Requirements

- Root or sudo access to the server
- SSH access to the server
- Domain name (optional, for SSL/HTTPS)

---

## Quick Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/editorial-platform.git
cd editorial-platform
```

### 2. Run the Installation Script

```bash
sudo bash install.sh
```

The installation script will:
1. Ask you to select your preferred language
2. Install all system dependencies
3. Install and configure PostgreSQL
4. Create the application database
5. Set up environment variables
6. Initialize the database schema
7. Create an administrator user
8. Configure the firewall
9. Set up a systemd service
10. Optionally configure Nginx as reverse proxy
11. Optionally install SSL certificate

### 3. Follow the Prompts

The installer will ask you for:
- **Installation language** (7 options available)
- **Database name** (default: editorial_platform)
- **Database user** (default: editorial_user)
- **Database password** (auto-generated or manual)
- **Application user** (default: editorial)
- **Application port** (default: 5000)
- **PayPal credentials** (optional, can be configured later)
- **Object Storage** (optional, can be configured later)
- **Domain name** (optional, for Nginx)
- **Administrator username** (default: admin)
- **Administrator password**

### 4. Access Your Platform

After installation, you can access your platform at:
- **Without domain**: `http://your-server-ip:5000`
- **With domain**: `https://yourdomain.com`

Login with the administrator credentials you created during installation.

---

## Manual Installation

If you prefer to install manually or need more control:

### 1. Install System Dependencies

```bash
sudo apt-get update
sudo apt-get install -y curl wget git build-essential nginx postgresql postgresql-contrib
```

### 2. Install Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt-get install -y nodejs
```

### 3. Clone Repository

```bash
git clone https://github.com/yourusername/editorial-platform.git
cd editorial-platform
```

### 4. Install Dependencies

```bash
npm install --production
```

### 5. Configure PostgreSQL

```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL prompt:
CREATE DATABASE editorial_platform;
CREATE USER editorial_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE editorial_platform TO editorial_user;
\c editorial_platform
GRANT ALL ON SCHEMA public TO editorial_user;
\q
```

### 6. Configure Environment Variables

```bash
# Copy example file
cp .env.example .env

# Edit with your favorite editor
nano .env
```

Update the following required variables:
```env
DATABASE_URL=postgresql://editorial_user:your_secure_password@localhost:5432/editorial_platform
SESSION_SECRET=your_random_secret_here
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
```

### 7. Initialize Database

```bash
npm run db:push -- --force
```

### 8. Create Administrator User

You can create the admin user manually by running:

```bash
node -e "
const { neon } = require('@neondatabase/serverless');
const crypto = require('crypto');

async function createAdmin() {
    const sql = neon(process.env.DATABASE_URL);
    const username = 'admin';
    const password = 'your_secure_password';
    
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    const passwordHash = salt + ':' + hash;
    
    await sql\`
        INSERT INTO admin_users (username, password_hash, role)
        VALUES (\${username}, \${passwordHash}, 'admin')
        ON CONFLICT (username) DO UPDATE SET password_hash = \${passwordHash}
    \`;
    
    console.log('Admin user created');
}

createAdmin().catch(console.error);
"
```

### 9. Build Application

```bash
npm run build
```

### 10. Start Application

```bash
# For development
npm run dev

# For production
NODE_ENV=production npm start
```

---

## Post-Installation

### Setting Up as a Service

Create a systemd service file:

```bash
sudo nano /etc/systemd/system/editorial-platform.service
```

Add the following content:

```ini
[Unit]
Description=Multi-Author Editorial Platform
After=network.target postgresql.service

[Service]
Type=simple
User=editorial
WorkingDirectory=/home/editorial/editorial-platform
Environment="NODE_ENV=production"
EnvironmentFile=/home/editorial/editorial-platform/.env
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable editorial-platform
sudo systemctl start editorial-platform
```

### Configuring Nginx (Recommended)

Create Nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/editorial-platform
```

Add the following:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

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

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/editorial-platform /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Installing SSL Certificate

```bash
sudo certbot --nginx -d yourdomain.com
```

### Configuring Firewall

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

---

## Configuration

### PayPal Setup

1. Go to [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/)
2. Create a new app
3. Get your Client ID and Secret
4. Update your `.env` file:
   ```env
   PAYPAL_CLIENT_ID=your_client_id
   PAYPAL_CLIENT_SECRET=your_client_secret
   PAYPAL_MODE=sandbox  # or 'production' for live
   ```
5. Restart the application:
   ```bash
   sudo systemctl restart editorial-platform
   ```

### Object Storage (for File Uploads)

If you're using Google Cloud Storage or similar:

1. Create a storage bucket
2. Update your `.env` file:
   ```env
   DEFAULT_OBJECT_STORAGE_BUCKET_ID=your-bucket-id
   PUBLIC_OBJECT_SEARCH_PATHS=/your-bucket-id/public
   PRIVATE_OBJECT_DIR=/your-bucket-id/.private
   ```
3. Restart the application

### Email Configuration

Configure your email provider for sending order confirmations:

```env
EMAIL_API_KEY=your-api-key
EMAIL_PROVIDER=resend  # or sendgrid, mailgun, etc.
```

---

## Troubleshooting

### Application Won't Start

Check the logs:
```bash
sudo journalctl -u editorial-platform -n 50
```

Common issues:
- Database connection failed: Check `DATABASE_URL` in `.env`
- Port already in use: Change `PORT` in `.env`
- Permission errors: Check file ownership

### Database Connection Errors

Test PostgreSQL connection:
```bash
psql -U editorial_user -d editorial_platform -h localhost
```

If connection fails:
1. Check PostgreSQL is running: `sudo systemctl status postgresql`
2. Verify user and database exist
3. Check password in `.env` matches database

### PayPal Errors

If payments fail:
1. Verify credentials are correct in `.env`
2. Check `PAYPAL_MODE` is set correctly
3. For sandbox, use sandbox credentials
4. Check PayPal dashboard for errors

### Nginx Configuration Issues

Test Nginx configuration:
```bash
sudo nginx -t
```

View Nginx logs:
```bash
sudo tail -f /var/log/nginx/error.log
```

### Permission Issues

Fix file permissions:
```bash
sudo chown -R editorial:editorial /home/editorial/editorial-platform
chmod 600 /home/editorial/editorial-platform/.env
```

---

## Useful Commands

### Service Management

```bash
# Start service
sudo systemctl start editorial-platform

# Stop service
sudo systemctl stop editorial-platform

# Restart service
sudo systemctl restart editorial-platform

# View status
sudo systemctl status editorial-platform

# View logs
sudo journalctl -u editorial-platform -f
```

### Database Management

```bash
# Access database
psql -U editorial_user -d editorial_platform

# Backup database
pg_dump -U editorial_user editorial_platform > backup.sql

# Restore database
psql -U editorial_user editorial_platform < backup.sql
```

### Application Updates

```bash
# Pull latest changes
cd /home/editorial/editorial-platform
git pull origin main

# Install dependencies
npm install --production

# Run migrations
npm run db:push

# Restart service
sudo systemctl restart editorial-platform
```

---

## Support

For issues and questions:
- Check the [GitHub Issues](https://github.com/yourusername/editorial-platform/issues)
- Review the documentation
- Contact support

---

## Security Recommendations

1. **Use strong passwords** for database and admin accounts
2. **Keep `.env` file secure** (never commit to git)
3. **Update regularly** with security patches
4. **Use HTTPS** in production (install SSL certificate)
5. **Configure firewall** to limit access
6. **Regular backups** of database and files
7. **Monitor logs** for suspicious activity

---

## Next Steps

After installation:
1. Login to the admin panel
2. Configure site settings (name, logo, etc.)
3. Add authors and books
4. Configure PayPal for payments
5. Test the checkout flow
6. Add content translations if needed
7. Customize author landing pages

Enjoy your Multi-Author Editorial Platform! 🎉
