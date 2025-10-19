#!/bin/bash

###############################################################################
# Database Schema Initialization Script
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
    print_info "Initializing database schema..."
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
    
    print_info "Running database migrations with Drizzle..."
    
    # Push schema to database
    npm run db:push -- --force
    
    if [ $? -eq 0 ]; then
        print_success "Database schema initialized successfully"
    else
        print_error "Failed to initialize database schema"
        exit 1
    fi
    
    echo ""
    print_info "Database is ready for use"
}

main
