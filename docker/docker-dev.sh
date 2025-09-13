#!/bin/bash

# NestSync Docker Development Environment Manager
# Manages the complete NestSync development stack with Supabase, backend, and frontend

set -e

# Configuration
PROJECT_NAME="nestsync"
COMPOSE_FILE_BASE="docker-compose.yml"
COMPOSE_FILE_DEV="docker-compose.dev.yml"
NETWORK_NAME="${PROJECT_NAME}-network"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}🇨🇦 NestSync Docker Development Environment${NC}"
    echo -e "${BLUE}===============================================${NC}"
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

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker Desktop and try again."
        exit 1
    fi
}

# Check if docker-compose is available
check_compose() {
    if ! command -v docker-compose &> /dev/null; then
        if ! docker compose version &> /dev/null; then
            log_error "docker-compose is not available. Please install Docker Compose and try again."
            exit 1
        fi
        COMPOSE_CMD="docker compose"
    else
        COMPOSE_CMD="docker-compose"
    fi
}

# Get the directory of this script
get_script_dir() {
    SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
    cd "$SCRIPT_DIR"
}

# Function to start the development environment
up() {
    log_info
    log_step "Starting NestSync development environment..."

    check_docker
    check_compose
    get_script_dir

    # Create network if it doesn't exist
    if ! docker network ls | grep -q "$NETWORK_NAME"; then
        log_step "Creating Docker network: $NETWORK_NAME"
        docker network create "$NETWORK_NAME" || true
    fi

    # Start services with development overrides
    log_step "Starting all services..."
    $COMPOSE_CMD -f "$COMPOSE_FILE_BASE" -f "$COMPOSE_FILE_DEV" up -d --build

    # Wait for services to be healthy
    log_step "Waiting for services to be healthy..."
    sleep 5

    # Check service health
    check_health

    log_success "Development environment started successfully!"

    show_access_points
    show_useful_commands

    log_warning "⏳ Services are starting up... This may take a few minutes."
    log_warning "   Use '$0 status' to check service status."

    show_troubleshooting_tips
}

# Function to stop the development environment
down() {
    log_step "Stopping NestSync development environment..."

    check_compose
    get_script_dir

    $COMPOSE_CMD -f "$COMPOSE_FILE_BASE" -f "$COMPOSE_FILE_DEV" down

    log_success "Development environment stopped successfully!"
}

# Function to restart the development environment
restart() {
    log_step "Restarting NestSync development environment..."
    down
    sleep 2
    up
}

# Function to show logs
logs() {
    check_compose
    get_script_dir

    if [ -z "$1" ]; then
        log_step "Showing logs for all services..."
        $COMPOSE_CMD -f "$COMPOSE_FILE_BASE" -f "$COMPOSE_FILE_DEV" logs -f
    else
        log_step "Showing logs for service: $1"
        $COMPOSE_CMD -f "$COMPOSE_FILE_BASE" -f "$COMPOSE_FILE_DEV" logs -f "$1"
    fi
}

# Function to show status
status() {
    check_compose
    get_script_dir

    log_step "Service Status:"
    $COMPOSE_CMD -f "$COMPOSE_FILE_BASE" -f "$COMPOSE_FILE_DEV" ps

    echo ""
    log_step "Container Health Checks:"
    docker ps --filter "name=${PROJECT_NAME}" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
}

# Function to check health of critical services
check_health() {
    local max_attempts=30
    local attempt=1

    log_step "Checking service health..."

    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost:8001/health > /dev/null 2>&1; then
            log_success "Backend is healthy"
            break
        elif [ $attempt -eq $max_attempts ]; then
            log_warning "Backend health check failed after $max_attempts attempts"
            log_warning "The service may still be starting up. Check logs with '$0 logs backend'"
        else
            echo -n "."
            sleep 2
        fi
        ((attempt++))
    done
}

# Function to clean up everything
clean() {
    log_warning "This will remove all containers, networks, and volumes for NestSync."
    read -p "Are you sure you want to continue? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_step "Cleaning up NestSync environment..."

        check_compose
        get_script_dir

        # Stop and remove everything
        $COMPOSE_CMD -f "$COMPOSE_FILE_BASE" -f "$COMPOSE_FILE_DEV" down -v --remove-orphans

        # Remove networks
        docker network rm "$NETWORK_NAME" 2>/dev/null || true

        # Remove dangling volumes
        docker volume prune -f

        # Remove dangling images
        docker image prune -f

        log_success "Cleanup completed!"
    else
        log_step "Cleanup cancelled."
    fi
}

# Function to rebuild containers
build() {
    log_step "Rebuilding containers..."

    check_compose
    get_script_dir

    $COMPOSE_CMD -f "$COMPOSE_FILE_BASE" -f "$COMPOSE_FILE_DEV" build --no-cache

    log_success "Containers rebuilt successfully!"
}

# Function to show access points
show_access_points() {
    echo ""
    echo -e "${BLUE}📱 Access Points:${NC}"
    echo "  Frontend (Web):     http://localhost:8082"
    echo "  Backend (API):      http://localhost:8001"
    echo "  GraphQL Playground: http://localhost:8001/graphql"
    echo "  Supabase Studio:    http://localhost:54323"
    echo "  Database:           postgresql://postgres:password@localhost:54322/postgres"
    echo "  Email Testing:      http://localhost:54324"
    echo ""
    echo -e "${PURPLE}🔑 Test Credentials:${NC}"
    echo "  Email:    parents@nestsync.com"
    echo "  Password: Shazam11#"
    echo ""
}

# Function to show useful commands
show_useful_commands() {
    echo -e "${YELLOW}📋 Useful Commands:${NC}"
    echo "  $0 logs           # View all logs"
    echo "  $0 logs-frontend  # Frontend logs only"
    echo "  $0 logs-backend   # Backend logs only"
    echo "  $0 down           # Stop environment"
    echo ""
}

# Function to show troubleshooting tips
show_troubleshooting_tips() {
    echo -e "${BLUE}🔧 Troubleshooting Tips:${NC}"
    echo "  - If you see 'read-only file system' errors, try: $0 clean && $0 up"
    echo "  - For database connection issues, check: $0 logs supabase-db"
    echo "  - For permission errors, ensure Docker has access to your project directory"
}

# Function to open shell in container
shell() {
    local service="$1"
    if [ -z "$service" ]; then
        log_error "Please specify a service name (backend, frontend, supabase-db, etc.)"
        exit 1
    fi

    log_step "Opening shell in $service container..."

    check_compose
    get_script_dir

    $COMPOSE_CMD -f "$COMPOSE_FILE_BASE" -f "$COMPOSE_FILE_DEV" exec "$service" /bin/sh
}

# Function to show help
show_help() {
    echo -e "${BLUE}NestSync Docker Development Environment Manager${NC}"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  up              Start the development environment"
    echo "  down            Stop the development environment"
    echo "  restart         Restart the development environment"
    echo "  status          Show service status"
    echo "  logs [SERVICE]  Show logs (for all services or specific service)"
    echo "  logs-frontend   Show frontend logs only"
    echo "  logs-backend    Show backend logs only"
    echo "  logs-db         Show database logs only"
    echo "  shell SERVICE   Open shell in specified service container"
    echo "  build           Rebuild containers"
    echo "  clean           Clean up all containers, networks, and volumes"
    echo "  health          Check service health"
    echo "  help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 up                    # Start development environment"
    echo "  $0 logs backend          # Show backend logs"
    echo "  $0 shell backend         # Open shell in backend container"
    echo "  $0 clean                 # Clean up everything"
}

# Service-specific log functions
logs-frontend() {
    logs "frontend"
}

logs-backend() {
    logs "backend"
}

logs-db() {
    logs "supabase-db"
}

# Health check function
health() {
    check_health
}

# Main command dispatcher
case "${1:-up}" in
    up)
        up
        ;;
    down)
        down
        ;;
    restart)
        restart
        ;;
    logs)
        logs "$2"
        ;;
    logs-frontend)
        logs-frontend
        ;;
    logs-backend)
        logs-backend
        ;;
    logs-db)
        logs-db
        ;;
    status)
        status
        ;;
    clean)
        clean
        ;;
    build)
        build
        ;;
    shell)
        shell "$2"
        ;;
    health)
        health
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