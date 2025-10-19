#!/bin/bash

###############################################################################
# Environment Variables Setup Script
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Generate random secret
generate_secret() {
    openssl rand -hex 32
}

# Main configuration
main() {
    DEFAULT_LOCALE=${1:-es-ES}
    
    print_info "Environment Variables Configuration"
    echo ""
    
    # Load database credentials
    if [ -f /tmp/db-credentials.txt ]; then
        source /tmp/db-credentials.txt
    else
        print_error "Database credentials not found. Run setup-database.sh first."
        exit 1
    fi
    
    # Get application directory
    if [ -z "$APP_DIR" ]; then
        APP_DIR=$(pwd)
    fi
    
    ENV_FILE="$APP_DIR/.env"
    
    print_info "Creating .env file at $ENV_FILE"
    
    # Generate secrets
    SESSION_SECRET=$(generate_secret)
    
    # Get application port
    read -p "Enter application port (default: 5000): " APP_PORT
    APP_PORT=${APP_PORT:-5000}
    
    # Ask about PayPal configuration
    read -p "Configure PayPal now? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter PayPal Client ID: " PAYPAL_CLIENT_ID
        read -p "Enter PayPal Client Secret: " PAYPAL_CLIENT_SECRET
        read -p "Use PayPal Sandbox? (Y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Nn]$ ]]; then
            PAYPAL_MODE="production"
        else
            PAYPAL_MODE="sandbox"
        fi
    else
        PAYPAL_CLIENT_ID="your-paypal-client-id"
        PAYPAL_CLIENT_SECRET="your-paypal-client-secret"
        PAYPAL_MODE="sandbox"
        print_warning "PayPal credentials not configured. You can add them later to the .env file."
    fi
    
    # Ask about Object Storage (optional)
    print_info "Object Storage configuration (optional - for file uploads)"
    read -p "Configure Object Storage now? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter Object Storage Bucket ID: " BUCKET_ID
        PUBLIC_SEARCH_PATH="/$BUCKET_ID/public"
        PRIVATE_DIR="/$BUCKET_ID/.private"
    else
        BUCKET_ID=""
        PUBLIC_SEARCH_PATH=""
        PRIVATE_DIR=""
        print_warning "Object Storage not configured. File uploads will not work until configured."
    fi
    
    # Create .env file
    cat > "$ENV_FILE" <<EOF
# Application Configuration
NODE_ENV=production
PORT=$APP_PORT

# Database Configuration
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME
PGHOST=$DB_HOST
PGPORT=$DB_PORT
PGUSER=$DB_USER
PGPASSWORD=$DB_PASSWORD
PGDATABASE=$DB_NAME

# Session Configuration
SESSION_SECRET=$SESSION_SECRET

# PayPal Configuration
PAYPAL_CLIENT_ID=$PAYPAL_CLIENT_ID
PAYPAL_CLIENT_SECRET=$PAYPAL_CLIENT_SECRET
PAYPAL_MODE=$PAYPAL_MODE

# Object Storage Configuration (Optional)
DEFAULT_OBJECT_STORAGE_BUCKET_ID=$BUCKET_ID
PUBLIC_OBJECT_SEARCH_PATHS=$PUBLIC_SEARCH_PATH
PRIVATE_OBJECT_DIR=$PRIVATE_DIR

# Default Locale
DEFAULT_LOCALE=$DEFAULT_LOCALE

# Email Configuration (Optional - configure later if needed)
# EMAIL_API_KEY=your-email-api-key
# EMAIL_PROVIDER=resend
EOF

    # Set proper permissions
    chmod 600 "$ENV_FILE"
    
    # Clean up temporary credentials file
    rm -f /tmp/db-credentials.txt
    
    print_success "Environment file created at $ENV_FILE"
    print_warning "Keep this file secure and never commit it to version control!"
    
    echo ""
    print_info "Review and update the .env file as needed:"
    echo "  - Add email configuration if you want to send emails"
    echo "  - Add PayPal credentials when ready for payments"
    echo "  - Configure Object Storage for file uploads"
}

main "$@"
