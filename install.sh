#!/bin/bash

###############################################################################
# Multi-Author Editorial Platform - Ubuntu Installation Script
# This script automates the installation and configuration process
###############################################################################

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored messages
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if running as root
check_root() {
    if [ "$EUID" -ne 0 ]; then 
        print_error "Please run this script as root or with sudo"
        exit 1
    fi
}

# Function to check Ubuntu version
check_ubuntu() {
    if [ ! -f /etc/os-release ]; then
        print_error "Cannot detect OS version"
        exit 1
    fi
    
    . /etc/os-release
    if [ "$ID" != "ubuntu" ]; then
        print_warning "This script is designed for Ubuntu. Your OS: $ID"
        read -p "Do you want to continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# Function to select installation language
select_language() {
    print_info "Select installation language / Seleccione el idioma de instalación:"
    echo "1) Español (es-ES)"
    echo "2) English (en-US)"
    echo "3) Català (ca-ES)"
    echo "4) Français (fr-FR)"
    echo "5) Italiano (it-IT)"
    echo "6) Deutsch (de-DE)"
    echo "7) Português (pt-PT)"
    
    read -p "Choose language [1-7] (default: 1): " lang_choice
    lang_choice=${lang_choice:-1}
    
    case $lang_choice in
        1) DEFAULT_LOCALE="es-ES" ;;
        2) DEFAULT_LOCALE="en-US" ;;
        3) DEFAULT_LOCALE="ca-ES" ;;
        4) DEFAULT_LOCALE="fr-FR" ;;
        5) DEFAULT_LOCALE="it-IT" ;;
        6) DEFAULT_LOCALE="de-DE" ;;
        7) DEFAULT_LOCALE="pt-PT" ;;
        *) DEFAULT_LOCALE="es-ES" ;;
    esac
    
    print_success "Selected language: $DEFAULT_LOCALE"
}

# Function to install system dependencies
install_system_dependencies() {
    print_info "Installing system dependencies..."
    
    apt-get update
    apt-get install -y \
        curl \
        wget \
        git \
        build-essential \
        sudo \
        ufw \
        nginx \
        certbot \
        python3-certbot-nginx
    
    print_success "System dependencies installed"
}

# Function to install Node.js
install_nodejs() {
    print_info "Installing Node.js 20..."
    
    # Check if Node.js is already installed
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v)
        print_warning "Node.js $NODE_VERSION is already installed"
        read -p "Do you want to reinstall? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            return
        fi
    fi
    
    # Install Node.js 20 from NodeSource
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    
    # Install npm globally
    npm install -g npm@latest
    
    print_success "Node.js $(node -v) and npm $(npm -v) installed"
}

# Function to install PostgreSQL
install_postgresql() {
    print_info "Installing PostgreSQL..."
    
    # Check if PostgreSQL is already installed
    if command -v psql &> /dev/null; then
        print_warning "PostgreSQL is already installed"
        read -p "Do you want to skip PostgreSQL installation? (Y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]] || [[ -z $REPLY ]]; then
            return
        fi
    fi
    
    apt-get install -y postgresql postgresql-contrib
    
    # Start PostgreSQL service
    systemctl start postgresql
    systemctl enable postgresql
    
    print_success "PostgreSQL installed and started"
}

# Function to configure PostgreSQL database
configure_database() {
    print_info "Configuring PostgreSQL database..."
    
    # Run the database setup script
    bash scripts/setup-database.sh
    
    print_success "Database configured"
}

# Function to create application user
create_app_user() {
    print_info "Creating application user..."
    
    read -p "Enter username for application user (default: editorial): " APP_USER
    APP_USER=${APP_USER:-editorial}
    
    # Create user if doesn't exist
    if id "$APP_USER" &>/dev/null; then
        print_warning "User $APP_USER already exists"
    else
        useradd -m -s /bin/bash "$APP_USER"
        print_success "User $APP_USER created"
    fi
    
    export APP_USER
}

# Function to setup application directory
setup_app_directory() {
    print_info "Setting up application directory..."
    
    APP_DIR="/home/$APP_USER/editorial-platform"
    
    # Copy application files
    if [ ! -d "$APP_DIR" ]; then
        mkdir -p "$APP_DIR"
    fi
    
    # Copy all files except node_modules and .git
    rsync -av --exclude='node_modules' --exclude='.git' --exclude='dist' . "$APP_DIR/"
    
    # Set ownership
    chown -R "$APP_USER:$APP_USER" "$APP_DIR"
    
    export APP_DIR
    print_success "Application directory setup at $APP_DIR"
}

# Function to install application dependencies
install_app_dependencies() {
    print_info "Installing application dependencies..."
    
    cd "$APP_DIR"
    sudo -u "$APP_USER" npm install --production
    
    print_success "Application dependencies installed"
}

# Function to configure environment variables
configure_environment() {
    print_info "Configuring environment variables..."
    
    bash scripts/setup-environment.sh "$DEFAULT_LOCALE"
    
    print_success "Environment configured"
}

# Function to initialize database schema
initialize_database() {
    print_info "Initializing database schema..."
    
    cd "$APP_DIR"
    sudo -u "$APP_USER" bash scripts/init-database.sh
    
    print_success "Database schema initialized"
}

# Function to setup admin user
setup_admin_user() {
    print_info "Setting up administrator user..."
    
    cd "$APP_DIR"
    sudo -u "$APP_USER" bash scripts/setup-admin.sh "$DEFAULT_LOCALE"
    
    print_success "Administrator user configured"
}

# Function to configure firewall
configure_firewall() {
    print_info "Configuring firewall..."
    
    # Enable UFW
    ufw --force enable
    
    # Allow SSH
    ufw allow 22/tcp
    
    # Allow HTTP and HTTPS
    ufw allow 80/tcp
    ufw allow 443/tcp
    
    # Allow application port (if different)
    read -p "Enter application port (default: 5000): " APP_PORT
    APP_PORT=${APP_PORT:-5000}
    
    if [ "$APP_PORT" != "80" ] && [ "$APP_PORT" != "443" ]; then
        ufw allow "$APP_PORT/tcp"
    fi
    
    export APP_PORT
    
    print_success "Firewall configured"
}

# Function to setup systemd service
setup_systemd_service() {
    print_info "Setting up systemd service..."
    
    cat > /etc/systemd/system/editorial-platform.service <<EOF
[Unit]
Description=Multi-Author Editorial Platform
After=network.target postgresql.service

[Service]
Type=simple
User=$APP_USER
WorkingDirectory=$APP_DIR
Environment="NODE_ENV=production"
Environment="PORT=$APP_PORT"
EnvironmentFile=$APP_DIR/.env
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

    # Reload systemd and enable service
    systemctl daemon-reload
    systemctl enable editorial-platform.service
    
    print_success "Systemd service configured"
}

# Function to configure Nginx (optional)
configure_nginx() {
    read -p "Do you want to configure Nginx as reverse proxy? (Y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Nn]$ ]]; then
        return
    fi
    
    print_info "Configuring Nginx..."
    
    read -p "Enter your domain name (e.g., example.com): " DOMAIN_NAME
    
    if [ -z "$DOMAIN_NAME" ]; then
        print_warning "No domain name provided, skipping Nginx configuration"
        return
    fi
    
    cat > /etc/nginx/sites-available/editorial-platform <<EOF
server {
    listen 80;
    server_name $DOMAIN_NAME;

    location / {
        proxy_pass http://localhost:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

    # Enable site
    ln -sf /etc/nginx/sites-available/editorial-platform /etc/nginx/sites-enabled/
    
    # Test Nginx configuration
    nginx -t
    
    # Reload Nginx
    systemctl reload nginx
    
    print_success "Nginx configured for $DOMAIN_NAME"
    
    # Ask about SSL
    read -p "Do you want to configure SSL with Let's Encrypt? (Y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        certbot --nginx -d "$DOMAIN_NAME"
        print_success "SSL certificate installed"
    fi
}

# Function to start the application
start_application() {
    print_info "Starting the application..."
    
    systemctl start editorial-platform.service
    
    # Wait a few seconds
    sleep 3
    
    # Check status
    if systemctl is-active --quiet editorial-platform.service; then
        print_success "Application started successfully"
    else
        print_error "Failed to start application. Check logs with: journalctl -u editorial-platform -n 50"
        exit 1
    fi
}

# Function to display final information
display_final_info() {
    echo ""
    echo "======================================================================"
    print_success "Installation completed successfully!"
    echo "======================================================================"
    echo ""
    print_info "Application details:"
    echo "  - Installation directory: $APP_DIR"
    echo "  - Application user: $APP_USER"
    echo "  - Default language: $DEFAULT_LOCALE"
    echo "  - Port: $APP_PORT"
    echo ""
    print_info "Useful commands:"
    echo "  - Start service:   sudo systemctl start editorial-platform"
    echo "  - Stop service:    sudo systemctl stop editorial-platform"
    echo "  - Restart service: sudo systemctl restart editorial-platform"
    echo "  - View logs:       sudo journalctl -u editorial-platform -f"
    echo "  - Check status:    sudo systemctl status editorial-platform"
    echo ""
    if [ -n "$DOMAIN_NAME" ]; then
        print_info "Access your platform at: https://$DOMAIN_NAME"
    else
        print_info "Access your platform at: http://your-server-ip:$APP_PORT"
    fi
    echo ""
    print_warning "Important: Make sure to backup your .env file and database regularly!"
    echo "======================================================================"
}

# Main installation flow
main() {
    clear
    echo "======================================================================"
    echo "   Multi-Author Editorial Platform - Installation Script"
    echo "======================================================================"
    echo ""
    
    check_root
    check_ubuntu
    select_language
    
    print_info "Starting installation..."
    echo ""
    
    install_system_dependencies
    install_nodejs
    install_postgresql
    create_app_user
    setup_app_directory
    configure_database
    install_app_dependencies
    configure_environment
    initialize_database
    setup_admin_user
    configure_firewall
    setup_systemd_service
    configure_nginx
    start_application
    display_final_info
}

# Run main function
main
