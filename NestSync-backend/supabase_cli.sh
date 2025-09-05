#!/bin/bash
# NestSync Supabase CLI Management Script
# Comprehensive tooling for local development and deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="huhkefkuamkeoxekzkuf"
REMOTE_URL="https://huhkefkuamkeoxekzkuf.supabase.co"

# Helper functions
print_status() {
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

# Check if Supabase CLI is installed
check_cli() {
    if ! command -v supabase &> /dev/null; then
        print_error "Supabase CLI is not installed. Please install it first:"
        echo "brew install supabase/tap/supabase"
        exit 1
    fi
    print_success "Supabase CLI is installed: $(supabase --version)"
}

# Start local development environment
start_local() {
    print_status "Starting local Supabase services..."
    supabase start
    
    print_success "Local Supabase services started!"
    echo ""
    echo "Available services:"
    echo "  - API Gateway: http://127.0.0.1:54321"
    echo "  - Database: postgresql://postgres:postgres@127.0.0.1:54322/postgres"
    echo "  - Studio: http://127.0.0.1:54323"
    echo "  - Inbucket (Email testing): http://127.0.0.1:54324"
    echo ""
    echo "Copy the ANON_KEY and SERVICE_ROLE_KEY to your .env.local file"
}

# Stop local development environment
stop_local() {
    print_status "Stopping local Supabase services..."
    supabase stop
    print_success "Local Supabase services stopped!"
}

# Check status of local services
status_local() {
    print_status "Checking local Supabase services status..."
    supabase status
}

# Reset local database
reset_local() {
    print_warning "This will reset your local database and apply all migrations and seeds."
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Resetting local database..."
        supabase db reset
        print_success "Database reset complete!"
    else
        print_status "Database reset cancelled."
    fi
}

# Generate TypeScript types
generate_types() {
    print_status "Generating TypeScript types for database schema..."
    
    # Create types directory if it doesn't exist
    mkdir -p types/database
    
    # Generate types from local database if running, otherwise from remote
    if supabase status | grep -q "Started"; then
        supabase gen types typescript --local > types/database/supabase.ts
        print_success "Types generated from local database and saved to types/database/supabase.ts"
    else
        print_warning "Local services not running. You'll need to authenticate to generate from remote."
        print_status "Run 'supabase login' first, then try again."
    fi
}

# Create a new migration
create_migration() {
    if [ -z "$1" ]; then
        print_error "Migration name is required"
        echo "Usage: $0 migration <migration_name>"
        exit 1
    fi
    
    print_status "Creating new migration: $1"
    supabase migration new "$1"
    print_success "Migration created in supabase/migrations/"
}

# Apply migrations to local database
migrate_local() {
    print_status "Applying migrations to local database..."
    supabase db push
    print_success "Migrations applied to local database!"
}

# Seed local database
seed_local() {
    print_status "Seeding local database..."
    supabase seed run
    print_success "Database seeded successfully!"
}

# Link to remote project (requires authentication)
link_project() {
    print_status "Linking to remote Supabase project: $PROJECT_ID"
    print_warning "This requires authentication with Supabase CLI"
    
    # Check if already logged in
    if ! supabase projects list &> /dev/null; then
        print_status "Please log in to Supabase first:"
        supabase login
    fi
    
    supabase link --project-ref $PROJECT_ID
    print_success "Project linked successfully!"
}

# Pull schema from remote database
pull_schema() {
    print_status "Pulling schema from remote database..."
    supabase db pull
    print_success "Schema pulled and saved to supabase/migrations/"
}

# Deploy to remote (requires authentication)
deploy_remote() {
    print_warning "This will deploy local changes to the remote database."
    print_warning "Make sure you've tested everything locally first!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Deploying to remote database..."
        supabase db push --remote
        print_success "Deployment complete!"
    else
        print_status "Deployment cancelled."
    fi
}

# Show help
show_help() {
    echo "NestSync Supabase CLI Management Script"
    echo ""
    echo "Usage: $0 <command> [arguments]"
    echo ""
    echo "Local Development Commands:"
    echo "  start           Start local Supabase services"
    echo "  stop            Stop local Supabase services"
    echo "  status          Check status of local services"
    echo "  reset           Reset local database (applies migrations and seeds)"
    echo "  seed            Run seed files on local database"
    echo ""
    echo "Development Tools:"
    echo "  types           Generate TypeScript types for database schema"
    echo "  migration <name> Create a new migration file"
    echo "  migrate         Apply migrations to local database"
    echo ""
    echo "Remote Operations (requires authentication):"
    echo "  login           Authenticate with Supabase"
    echo "  link            Link to remote project"
    echo "  pull            Pull schema from remote database"
    echo "  deploy          Deploy local changes to remote"
    echo ""
    echo "Other:"
    echo "  help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start                    # Start local development"
    echo "  $0 migration add_user_table # Create a new migration"
    echo "  $0 types                    # Generate TypeScript types"
    echo "  $0 deploy                   # Deploy to remote (with confirmation)"
}

# Main command dispatcher
case "$1" in
    "start")
        check_cli
        start_local
        ;;
    "stop")
        check_cli
        stop_local
        ;;
    "status")
        check_cli
        status_local
        ;;
    "reset")
        check_cli
        reset_local
        ;;
    "seed")
        check_cli
        seed_local
        ;;
    "types")
        check_cli
        generate_types
        ;;
    "migration")
        check_cli
        create_migration "$2"
        ;;
    "migrate")
        check_cli
        migrate_local
        ;;
    "login")
        check_cli
        supabase login
        ;;
    "link")
        check_cli
        link_project
        ;;
    "pull")
        check_cli
        pull_schema
        ;;
    "deploy")
        check_cli
        deploy_remote
        ;;
    "help"|"--help"|"-h"|"")
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac