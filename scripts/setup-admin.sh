#!/bin/bash

###############################################################################
# Admin User Setup Script
# Creates the initial administrator user for the platform
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
    
    # Check if DATABASE_URL is set
    if [ -z "$DATABASE_URL" ]; then
        print_error "DATABASE_URL not set in .env file"
        exit 1
    fi
    
    # Get admin details
    echo "Please enter administrator details:"
    echo ""
    
    read -p "Username (default: admin): " ADMIN_USERNAME
    ADMIN_USERNAME=${ADMIN_USERNAME:-admin}
    
    # Password input (no echo)
    while true; do
        read -sp "Password: " ADMIN_PASSWORD
        echo
        
        if [ -z "$ADMIN_PASSWORD" ]; then
            print_error "Password cannot be empty"
            continue
        fi
        
        read -sp "Confirm password: " ADMIN_PASSWORD_CONFIRM
        echo
        
        if [ "$ADMIN_PASSWORD" != "$ADMIN_PASSWORD_CONFIRM" ]; then
            print_error "Passwords do not match"
            continue
        fi
        
        break
    done
    
    # Create admin user using Node.js with pg client
    print_info "Creating administrator user..."
    
    # Create a temporary Node.js script
    cat > /tmp/create-admin.js <<'EOFJS'
const crypto = require('crypto');

async function createAdmin() {
    const username = process.env.ADMIN_USERNAME;
    const password = process.env.ADMIN_PASSWORD;
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!username || !password || !databaseUrl) {
        console.error('Missing required environment variables');
        process.exit(1);
    }
    
    // Hash password using scrypt (same method as the app)
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    const passwordHash = `${salt}:${hash}`;
    
    // Parse DATABASE_URL to get connection details
    const url = new URL(databaseUrl);
    const dbConfig = {
        host: url.hostname,
        port: url.port || 5432,
        user: url.username,
        password: url.password,
        database: url.pathname.slice(1), // Remove leading slash
    };
    
    // Import pg module
    let pg;
    try {
        pg = require('pg');
    } catch (err) {
        console.error('pg module not found. Installing...');
        require('child_process').execSync('npm install --no-save pg', { stdio: 'inherit' });
        pg = require('pg');
    }
    
    const { Client } = pg;
    const client = new Client(dbConfig);
    
    try {
        await client.connect();
        
        // Check if admin user already exists
        const checkResult = await client.query(
            'SELECT id FROM admin_users WHERE username = $1',
            [username]
        );
        
        if (checkResult.rows.length > 0) {
            console.log('Admin user already exists, updating password...');
            await client.query(
                'UPDATE admin_users SET password_hash = $1 WHERE username = $2',
                [passwordHash, username]
            );
        } else {
            console.log('Creating new admin user...');
            await client.query(
                'INSERT INTO admin_users (username, password_hash, role) VALUES ($1, $2, $3)',
                [username, passwordHash, 'admin']
            );
        }
        
        console.log('Admin user configured successfully');
        
    } catch (err) {
        console.error('Database error:', err.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

createAdmin().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
EOFJS

    # Run the script with environment variables (not interpolated in shell)
    export ADMIN_USERNAME="$ADMIN_USERNAME"
    export ADMIN_PASSWORD="$ADMIN_PASSWORD"
    
    if node /tmp/create-admin.js; then
        # Clean up
        rm -f /tmp/create-admin.js
        unset ADMIN_PASSWORD
        
        print_success "Administrator user created successfully"
        echo ""
        print_info "Login credentials:"
        echo "  Username: $ADMIN_USERNAME"
        echo "  Password: [hidden for security]"
        echo ""
        print_warning "Please save these credentials in a secure location!"
    else
        print_error "Failed to create administrator user"
        rm -f /tmp/create-admin.js
        unset ADMIN_PASSWORD
        exit 1
    fi
}

main "$@"
