#!/bin/bash

###############################################################################
# Admin User Setup Script
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

main() {
    DEFAULT_LOCALE=${1:-es-ES}
    
    print_info "Administrator User Configuration"
    echo ""
    
    # Load environment variables
    if [ -f .env ]; then
        export $(cat .env | grep -v '^#' | xargs)
    else
        print_error ".env file not found"
        exit 1
    fi
    
    # Get admin details
    echo "Please enter administrator details:"
    echo ""
    
    read -p "Username (default: admin): " ADMIN_USERNAME
    ADMIN_USERNAME=${ADMIN_USERNAME:-admin}
    
    read -sp "Password: " ADMIN_PASSWORD
    echo
    
    if [ -z "$ADMIN_PASSWORD" ]; then
        print_error "Password cannot be empty"
        exit 1
    fi
    
    read -sp "Confirm password: " ADMIN_PASSWORD_CONFIRM
    echo
    
    if [ "$ADMIN_PASSWORD" != "$ADMIN_PASSWORD_CONFIRM" ]; then
        print_error "Passwords do not match"
        exit 1
    fi
    
    # Create admin user using Node.js script
    print_info "Creating administrator user..."
    
    node -e "
const { neon } = require('@neondatabase/serverless');
const crypto = require('crypto');

async function createAdmin() {
    const sql = neon(process.env.DATABASE_URL);
    
    // Hash password
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync('$ADMIN_PASSWORD', salt, 64).toString('hex');
    const passwordHash = salt + ':' + hash;
    
    // Check if admin exists
    const existingUser = await sql\`
        SELECT id FROM admin_users WHERE username = \${process.env.ADMIN_USERNAME}
    \`;
    
    if (existingUser.length > 0) {
        console.log('Admin user already exists, updating password...');
        await sql\`
            UPDATE admin_users 
            SET password_hash = \${passwordHash}
            WHERE username = \${process.env.ADMIN_USERNAME}
        \`;
    } else {
        console.log('Creating new admin user...');
        await sql\`
            INSERT INTO admin_users (username, password_hash, role)
            VALUES (\${process.env.ADMIN_USERNAME}, \${passwordHash}, 'admin')
        \`;
    }
    
    console.log('Admin user configured successfully');
}

createAdmin().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
" ADMIN_USERNAME="$ADMIN_USERNAME"
    
    if [ $? -eq 0 ]; then
        print_success "Administrator user created successfully"
        echo ""
        print_info "Login credentials:"
        echo "  Username: $ADMIN_USERNAME"
        echo "  Password: [hidden]"
        echo ""
        print_warning "Please save these credentials in a secure location!"
    else
        print_error "Failed to create administrator user"
        exit 1
    fi
}

main "$@"
