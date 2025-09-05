#!/bin/bash

# NestSync Railway Deployment Script
# PIPEDA-compliant Canadian diaper planning application

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    log "Checking deployment prerequisites..."
    
    # Check Railway CLI
    if ! command -v railway &> /dev/null; then
        error "Railway CLI not found. Install with: npm install -g @railway/cli"
    fi
    
    # Check git
    if ! command -v git &> /dev/null; then
        error "Git not found. Please install git."
    fi
    
    # Check if in git repository
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        error "Not in a git repository. Run 'git init' first."
    fi
    
    log "Prerequisites check passed ✓"
}

# Test local application health
test_local_health() {
    log "Testing local application health..."
    
    # Check if application is running on port 8001
    if curl -s -f http://localhost:8001/health > /dev/null; then
        log "Local application health check passed ✓"
    else
        warn "Local application not responding on port 8001"
        info "You may need to start the application locally first"
    fi
}

# Railway authentication check
check_railway_auth() {
    log "Checking Railway authentication..."
    
    if railway whoami &> /dev/null; then
        local user=$(railway whoami)
        log "Authenticated as: $user ✓"
        return 0
    else
        warn "Not authenticated with Railway"
        info "Please run: railway login"
        return 1
    fi
}

# Environment variables setup guide
show_env_setup() {
    echo ""
    info "REQUIRED: Configure these environment variables in Railway:"
    echo ""
    echo "1. Core Application:"
    echo "   railway variables set ENVIRONMENT=production"
    echo "   railway variables set TZ=America/Toronto"
    echo "   railway variables set PIPEDA_COMPLIANCE=true"
    echo ""
    echo "2. Security (Generate new keys):"
    echo "   railway variables set SECRET_KEY=\"\$(openssl rand -base64 32)\""
    echo "   railway variables set JWT_SECRET=\"\$(openssl rand -base64 32)\""
    echo "   railway variables set ENCRYPTION_KEY=\"\$(openssl rand -base64 32)\""
    echo ""
    echo "3. Supabase (FROM YOUR SUPABASE PROJECT):"
    echo "   railway variables set SUPABASE_URL=\"https://your-project.supabase.co\""
    echo "   railway variables set SUPABASE_ANON_KEY=\"eyJ...\""
    echo "   railway variables set SUPABASE_SERVICE_KEY=\"eyJ...\""
    echo ""
    echo "4. CORS (YOUR FRONTEND DOMAIN):"
    echo "   railway variables set CORS_ORIGINS=\"https://your-domain.com\""
    echo ""
}

# Main deployment function
deploy_to_railway() {
    log "Starting Railway deployment..."
    
    # Check if project exists
    if ! railway status &> /dev/null; then
        warn "No Railway project found in current directory"
        info "Initialize with: railway init"
        return 1
    fi
    
    # Show current status
    info "Current Railway project status:"
    railway status
    
    # Commit any pending changes
    if [[ -n $(git status --porcelain) ]]; then
        warn "You have uncommitted changes"
        read -p "Commit changes before deployment? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git add .
            git commit -m "Pre-deployment commit: $(date +'%Y-%m-%d %H:%M:%S')"
        fi
    fi
    
    # Deploy
    log "Deploying to Railway..."
    railway up
    
    # Get deployment URL
    local url=$(railway status --json 2>/dev/null | grep -o '"url":"[^"]*"' | cut -d'"' -f4 || echo "")
    
    if [[ -n "$url" ]]; then
        log "Deployment successful! 🚀"
        info "Application URL: $url"
        
        # Test deployment
        sleep 5  # Give deployment a moment to start
        test_deployment "$url"
    else
        warn "Deployment completed but URL not detected"
        info "Check Railway dashboard for deployment status"
    fi
}

# Test deployment health
test_deployment() {
    local url=$1
    log "Testing deployment health..."
    
    # Test health endpoint
    local health_url="$url/health"
    if curl -s -f "$health_url" > /dev/null; then
        log "Deployment health check passed ✓"
        info "Health endpoint: $health_url"
        info "API docs: $url/docs"
        info "GraphQL: $url/graphql"
    else
        warn "Deployment health check failed"
        info "Check Railway logs: railway logs"
    fi
}

# Show post-deployment checklist
show_post_deployment() {
    echo ""
    info "POST-DEPLOYMENT CHECKLIST:"
    echo ""
    echo "✓ Verify health endpoint returns 'healthy' status"
    echo "✓ Test GraphQL endpoint functionality"
    echo "✓ Check API documentation accessibility"
    echo "✓ Verify Supabase integration working"
    echo "✓ Confirm Canadian timezone (America/Toronto)"
    echo "✓ Test CORS with your frontend domain"
    echo "✓ Configure custom domain (if needed)"
    echo "✓ Set up monitoring alerts"
    echo ""
    echo "Useful commands:"
    echo "- railway logs        # View application logs"
    echo "- railway status      # Check deployment status"
    echo "- railway domain add  # Add custom domain"
    echo "- railway variables   # List environment variables"
    echo ""
}

# Main script execution
main() {
    echo ""
    log "NestSync Railway Deployment Script"
    log "PIPEDA-compliant FastAPI backend deployment"
    echo ""
    
    # Run checks
    check_prerequisites
    test_local_health
    
    # Check authentication
    if ! check_railway_auth; then
        error "Please authenticate with Railway first: railway login"
    fi
    
    # Show environment setup if needed
    show_env_setup
    
    # Confirm deployment
    echo ""
    read -p "Ready to deploy to Railway? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        deploy_to_railway
        show_post_deployment
    else
        info "Deployment cancelled"
        info "When ready, run this script again or use: railway up"
    fi
    
    log "Deployment script completed"
}

# Run main function
main "$@"