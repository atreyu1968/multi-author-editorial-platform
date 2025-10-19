#!/bin/bash

###############################################################################
# PostgreSQL Database Setup Script
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

# Generate random password
generate_password() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-25
}

# Main configuration
main() {
    print_info "PostgreSQL Database Configuration"
    echo ""
    
    # Get database details
    read -p "Enter database name (default: editorial_platform): " DB_NAME
    DB_NAME=${DB_NAME:-editorial_platform}
    
    read -p "Enter database user (default: editorial_user): " DB_USER
    DB_USER=${DB_USER:-editorial_user}
    
    read -p "Generate random password? (Y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Nn]$ ]]; then
        read -sp "Enter database password: " DB_PASSWORD
        echo
    else
        DB_PASSWORD=$(generate_password)
        print_info "Generated password: $DB_PASSWORD"
    fi
    
    # Create database and user
    print_info "Creating database and user..."
    
    sudo -u postgres psql <<EOF
-- Create user if not exists
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_user WHERE usename = '$DB_USER') THEN
        CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
    END IF;
END
\$\$;

-- Create database if not exists
SELECT 'CREATE DATABASE $DB_NAME OWNER $DB_USER'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME')\gexec

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;

-- Connect to database and grant schema privileges
\c $DB_NAME
GRANT ALL ON SCHEMA public TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;
EOF

    if [ $? -eq 0 ]; then
        print_success "Database and user created successfully"
    else
        print_error "Failed to create database and user"
        exit 1
    fi
    
    # Save credentials to file (will be used by setup-environment.sh)
    cat > /tmp/db-credentials.txt <<EOF
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_HOST=localhost
DB_PORT=5432
EOF
    
    chmod 600 /tmp/db-credentials.txt
    
    # Display connection string
    echo ""
    print_success "Database configuration completed"
    print_info "Connection details saved to /tmp/db-credentials.txt"
    echo ""
    print_info "Connection string:"
    echo "  DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME"
    echo ""
}

main
