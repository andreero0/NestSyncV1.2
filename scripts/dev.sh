#!/bin/bash

# NestSync Development Environment Manager
# Provides seamless switching between Docker and production-connected development modes

set -e

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}🇨🇦 NestSync Development Environment${NC}"
    echo -e "${BLUE}========================================${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_step() {
    echo -e "${BLUE}🔧 $1${NC}"
}

# Environment detection functions
detect_current_mode() {
    local env_file="$PROJECT_ROOT/.env"

    if [ -f "$env_file" ]; then
        if grep -q "DEVELOPMENT_MODE=docker" "$env_file" 2>/dev/null; then
            echo "docker"
        elif grep -q "DEVELOPMENT_MODE=production" "$env_file" 2>/dev/null; then
            echo "production"
        else
            echo "unknown"
        fi
    else
        echo "none"
    fi
}

# Environment switching functions
switch_to_docker() {
    log_step "Switching to Docker development mode..."

    # Copy Docker template to .env
    if [ -f "$SCRIPT_DIR/templates/.env.docker.template" ]; then
        cp "$SCRIPT_DIR/templates/.env.docker.template" "$PROJECT_ROOT/.env"
        log_success "Environment switched to Docker mode"
        log_info "Services will use local containerized infrastructure"
        echo ""
        echo -e "${BLUE}Next steps:${NC}"
        echo "  $PROJECT_ROOT/docker/docker-dev.sh up    # Start Docker stack"
        echo "  $0 status                                  # Check current mode"
    else
        log_error "Docker template not found at $SCRIPT_DIR/templates/.env.docker.template"
        exit 1
    fi
}

switch_to_production() {
    log_step "Switching to production-connected development mode..."

    # Copy production template to .env
    if [ -f "$SCRIPT_DIR/templates/.env.production.template" ]; then
        cp "$SCRIPT_DIR/templates/.env.production.template" "$PROJECT_ROOT/.env"
        log_success "Environment switched to production-connected mode"
        log_warning "⚠️  You are now connected to PRODUCTION services!"
        log_warning "   - All data changes affect the live system"
        log_warning "   - Use test credentials: parents@nestsync.com / Shazam11#"
        echo ""
        echo -e "${BLUE}Next steps:${NC}"
        echo "  cd $PROJECT_ROOT/NestSync-backend && source venv/bin/activate && uvicorn main:app --host 0.0.0.0 --port 8001 --reload"
        echo "  cd $PROJECT_ROOT/NestSync-frontend && npx expo start --port 8082"
        echo "  $0 status    # Check current mode"
    else
        log_error "Production template not found at $SCRIPT_DIR/templates/.env.production.template"
        exit 1
    fi
}

# Status and information functions
show_status() {
    local current_mode=$(detect_current_mode)

    log_info
    echo -e "${PURPLE}Current Development Mode: ${NC}"

    case $current_mode in
        docker)
            echo -e "  ${GREEN}🐳 Docker Development${NC}"
            echo -e "  ${GREEN}Local containerized services - safe for development${NC}"
            echo ""
            echo -e "${BLUE}Docker Services:${NC}"
            echo "  Frontend:    http://localhost:8082"
            echo "  Backend:     http://localhost:8001"
            echo "  Supabase:    http://localhost:54323"
            echo "  Database:    postgresql://postgres:password@localhost:54322/postgres"
            echo ""
            echo -e "${BLUE}Commands:${NC}"
            echo "  $PROJECT_ROOT/docker/docker-dev.sh up      # Start services"
            echo "  $PROJECT_ROOT/docker/docker-dev.sh logs    # View logs"
            echo "  $0 switch production                        # Switch to production mode"
            ;;
        production)
            echo -e "  ${RED}🌐 Production-Connected Development${NC}"
            echo -e "  ${RED}Connected to real production services - use with caution!${NC}"
            echo ""
            echo -e "${YELLOW}Test Credentials:${NC}"
            echo "  Email:    parents@nestsync.com"
            echo "  Password: Shazam11#"
            echo ""
            echo -e "${BLUE}Manual Startup Commands:${NC}"
            echo "  # Backend:"
            echo "  cd $PROJECT_ROOT/NestSync-backend && source venv/bin/activate && uvicorn main:app --host 0.0.0.0 --port 8001 --reload"
            echo "  # Frontend:"
            echo "  cd $PROJECT_ROOT/NestSync-frontend && npx expo start --port 8082"
            echo ""
            echo -e "${BLUE}Commands:${NC}"
            echo "  $0 switch docker                           # Switch to Docker mode"
            ;;
        unknown)
            echo -e "  ${YELLOW}❓ Unknown Configuration${NC}"
            echo -e "  ${YELLOW}Environment file exists but mode not clearly defined${NC}"
            ;;
        none)
            echo -e "  ${YELLOW}❓ No Environment File${NC}"
            echo -e "  ${YELLOW}No .env file found - please choose a development mode${NC}"
            ;;
    esac

    echo ""
    echo -e "${BLUE}Available Commands:${NC}"
    echo "  $0 switch docker        # Switch to Docker development"
    echo "  $0 switch production    # Switch to production-connected development"
    echo "  $0 status               # Show current mode and guidance"
    echo "  $0 help                 # Show detailed help"
}

# Docker integration functions
docker_start() {
    log_step "Starting Docker development environment..."

    # Ensure we're in Docker mode
    local current_mode=$(detect_current_mode)
    if [ "$current_mode" != "docker" ]; then
        log_warning "Not in Docker mode. Switching automatically..."
        switch_to_docker
    fi

    # Check if Docker is running
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker daemon is not running or accessible!"
        echo ""
        echo -e "${YELLOW}Common Solutions:${NC}"
        echo ""
        echo -e "${BLUE}macOS with Docker Desktop:${NC}"
        echo "  1. Open Docker Desktop application"
        echo "  2. Wait for 'Docker Desktop is running' status in menu bar"
        echo "  3. If stuck, try: Docker Desktop > Troubleshoot > Reset to Factory Defaults"
        echo ""
        echo -e "${BLUE}Check Docker Installation:${NC}"
        echo "  docker --version                    # Verify Docker is installed"
        echo "  docker info                         # Check daemon connection"
        echo "  docker ps                           # Test basic functionality"
        echo ""
        echo -e "${BLUE}Alternative Development Mode:${NC}"
        echo "  $0 switch production                # Use production-connected development instead"
        echo ""
        echo -e "${RED}Error Details:${NC}"
        docker info 2>&1 | head -10 || echo "  Docker command not found - please install Docker Desktop"
        exit 1
    fi

    # Start Docker services
    cd "$PROJECT_ROOT"
    if [ -x "./docker/docker-dev.sh" ]; then
        ./docker/docker-dev.sh up
    else
        log_error "Docker development script not found at $PROJECT_ROOT/docker/docker-dev.sh"
        log_error "Please ensure the Docker development environment is properly set up."
        exit 1
    fi
}

# Help function
show_help() {
    log_info
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo -e "${BLUE}Environment Management:${NC}"
    echo "  switch docker         Switch to Docker development mode (local containers)"
    echo "  switch production     Switch to production-connected development mode"
    echo "  status                Show current environment mode and guidance"
    echo ""
    echo -e "${BLUE}Docker Integration:${NC}"
    echo "  docker start          Switch to Docker mode and start all services"
    echo "  docker stop           Stop Docker services"
    echo "  docker logs           Show Docker service logs"
    echo "  docker status         Show Docker service status"
    echo ""
    echo -e "${BLUE}General:${NC}"
    echo "  help                  Show this help message"
    echo ""
    echo -e "${BLUE}Examples:${NC}"
    echo "  $0 switch docker                    # Switch to Docker development"
    echo "  $0 docker start                     # Auto-switch to Docker and start services"
    echo "  $0 status                           # Check current mode"
    echo "  $0 switch production                # Switch to production-connected mode"
    echo ""
    echo -e "${BLUE}Quick Start Workflows:${NC}"
    echo ""
    echo -e "${GREEN}New Developer Setup (Docker - Recommended):${NC}"
    echo "  1. $0 docker start                  # Auto-configure and start everything"
    echo "  2. Open http://localhost:8082       # Access the app"
    echo ""
    echo -e "${YELLOW}Experienced Developer (Production-Connected):${NC}"
    echo "  1. $0 switch production             # Switch to production mode"
    echo "  2. Start backend and frontend manually (see status command for details)"
    echo "  3. Use test credentials: parents@nestsync.com / Shazam11#"
    echo ""
}

# Main command dispatcher
case "${1:-help}" in
    switch)
        case "$2" in
            docker)
                switch_to_docker
                ;;
            production)
                switch_to_production
                ;;
            *)
                log_error "Please specify: docker or production"
                echo "Usage: $0 switch [docker|production]"
                exit 1
                ;;
        esac
        ;;
    docker)
        case "$2" in
            start)
                docker_start
                ;;
            stop)
                cd "$PROJECT_ROOT" && ./docker/docker-dev.sh down
                ;;
            logs)
                cd "$PROJECT_ROOT" && ./docker/docker-dev.sh logs
                ;;
            status)
                cd "$PROJECT_ROOT" && ./docker/docker-dev.sh status
                ;;
            *)
                log_error "Unknown docker command: $2"
                echo "Available: start, stop, logs, status"
                exit 1
                ;;
        esac
        ;;
    status)
        show_status
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        log_error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac