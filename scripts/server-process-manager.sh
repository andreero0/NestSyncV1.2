#!/bin/bash

# NestSync Server Process Manager
# Enforces single-instance servers with PID file management
# Resolves Playwright automation "fails on first go" issues

set -e

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PID_DIR="$PROJECT_ROOT/.pids"
SCRIPTS_DIR="$PROJECT_ROOT/scripts"

# PID files
FRONTEND_PID_FILE="$PID_DIR/frontend.pid"
BACKEND_PID_FILE="$PID_DIR/backend.pid"
DOCKER_PID_FILE="$PID_DIR/docker.pid"

# Ports
FRONTEND_PORT=8082
BACKEND_PORT=8001

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Create PID directory if it doesn't exist
init_pid_dir() {
    if [ ! -d "$PID_DIR" ]; then
        mkdir -p "$PID_DIR"
        log_info "Created PID directory: $PID_DIR"
    fi
}

# Check if a process is running by PID
is_process_running() {
    local pid=$1
    if [ -z "$pid" ]; then
        return 1
    fi

    # Check if process exists and is running
    if kill -0 "$pid" 2>/dev/null; then
        return 0
    else
        return 1
    fi
}

# Get PID from file if it exists and process is running
get_running_pid() {
    local pid_file=$1

    if [ ! -f "$pid_file" ]; then
        return 1
    fi

    local pid=$(cat "$pid_file" 2>/dev/null)
    if is_process_running "$pid"; then
        echo "$pid"
        return 0
    else
        # Clean up stale PID file
        rm -f "$pid_file"
        return 1
    fi
}

# Kill process by PID file
kill_process_by_pid_file() {
    local pid_file=$1
    local service_name=$2

    local pid=$(get_running_pid "$pid_file")
    if [ $? -eq 0 ]; then
        log_info "Stopping $service_name (PID: $pid)"
        kill -TERM "$pid" 2>/dev/null || true

        # Wait for graceful shutdown
        local attempts=10
        while [ $attempts -gt 0 ] && is_process_running "$pid"; do
            sleep 1
            ((attempts--))
        done

        # Force kill if still running
        if is_process_running "$pid"; then
            log_warning "Force killing $service_name (PID: $pid)"
            kill -KILL "$pid" 2>/dev/null || true
        fi

        rm -f "$pid_file"
        log_success "$service_name stopped"
        return 0
    else
        log_info "$service_name is not running"
        return 1
    fi
}

# Find and kill processes on specific ports
kill_processes_on_port() {
    local port=$1
    local service_name=$2

    log_info "Checking for processes on port $port..."

    # Find processes using the port
    local pids=$(lsof -ti ":$port" 2>/dev/null || true)

    if [ -n "$pids" ]; then
        log_info "Found processes on port $port: $pids"
        for pid in $pids; do
            if is_process_running "$pid"; then
                log_info "Killing process $pid on port $port"
                kill -TERM "$pid" 2>/dev/null || true
                sleep 1

                # Force kill if still running
                if is_process_running "$pid"; then
                    log_warning "Force killing process $pid on port $port"
                    kill -KILL "$pid" 2>/dev/null || true
                fi
            fi
        done
        log_success "Cleared port $port for $service_name"
        return 0
    else
        log_info "No processes found on port $port"
        return 1
    fi
}

# Kill all related processes (expo, uvicorn, etc.)
kill_all_development_processes() {
    log_info "Stopping all development processes..."

    # Kill by PID files first
    kill_process_by_pid_file "$FRONTEND_PID_FILE" "Frontend"
    kill_process_by_pid_file "$BACKEND_PID_FILE" "Backend"
    kill_process_by_pid_file "$DOCKER_PID_FILE" "Docker"

    # Kill by port
    kill_processes_on_port "$FRONTEND_PORT" "Frontend"
    kill_processes_on_port "$BACKEND_PORT" "Backend"

    # Kill by process name patterns
    log_info "Killing processes by name patterns..."
    pkill -f "expo start" 2>/dev/null || true
    pkill -f "uvicorn.*nestsync" 2>/dev/null || true
    pkill -f "uvicorn.*main:app" 2>/dev/null || true

    # Give processes time to die
    sleep 2

    log_success "All development processes stopped"
}

# Start frontend with PID tracking
start_frontend() {
    local existing_pid=$(get_running_pid "$FRONTEND_PID_FILE")
    if [ $? -eq 0 ]; then
        log_warning "Frontend already running (PID: $existing_pid)"
        return 0
    fi

    # Ensure port is free
    kill_processes_on_port "$FRONTEND_PORT" "Frontend"

    log_info "Starting frontend on port $FRONTEND_PORT..."

    cd "$PROJECT_ROOT/NestSync-frontend"

    # Start frontend in background and capture PID
    nohup npx expo start --port $FRONTEND_PORT --web --clear > "$PROJECT_ROOT/.logs/frontend.log" 2>&1 &
    local pid=$!

    # Save PID
    echo "$pid" > "$FRONTEND_PID_FILE"

    log_success "Frontend started (PID: $pid)"

    # Wait for frontend to be ready
    wait_for_service "http://localhost:$FRONTEND_PORT" "Frontend" 60
}

# Start backend with PID tracking
start_backend() {
    local existing_pid=$(get_running_pid "$BACKEND_PID_FILE")
    if [ $? -eq 0 ]; then
        log_warning "Backend already running (PID: $existing_pid)"
        return 0
    fi

    # Ensure port is free
    kill_processes_on_port "$BACKEND_PORT" "Backend"

    log_info "Starting backend on port $BACKEND_PORT..."

    cd "$PROJECT_ROOT/NestSync-backend"

    # Activate virtual environment and start backend
    nohup bash -c "source venv/bin/activate && uvicorn main:app --host 0.0.0.0 --port $BACKEND_PORT --reload" > "$PROJECT_ROOT/.logs/backend.log" 2>&1 &
    local pid=$!

    # Save PID
    echo "$pid" > "$BACKEND_PID_FILE"

    log_success "Backend started (PID: $pid)"

    # Wait for backend to be ready
    wait_for_service "http://localhost:$BACKEND_PORT/health" "Backend" 60
}

# Wait for service to be ready with exponential backoff
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_wait=${3:-60}

    log_info "Waiting for $service_name to be ready at $url..."

    local attempt=1
    local wait_time=1
    local total_time=0

    while [ $total_time -lt $max_wait ]; do
        if curl -f -s "$url" > /dev/null 2>&1; then
            log_success "$service_name is ready (after ${total_time}s)"
            return 0
        fi

        log_info "Attempt $attempt: $service_name not ready, waiting ${wait_time}s..."
        sleep $wait_time

        total_time=$((total_time + wait_time))
        attempt=$((attempt + 1))

        # Exponential backoff (cap at 8 seconds)
        if [ $wait_time -lt 8 ]; then
            wait_time=$((wait_time * 2))
        fi
    done

    log_error "$service_name failed to become ready within ${max_wait}s"
    return 1
}

# Comprehensive health check
health_check() {
    log_info "Running comprehensive health check..."

    local frontend_healthy=false
    local backend_healthy=false

    # Check frontend
    if curl -f -s "http://localhost:$FRONTEND_PORT" > /dev/null 2>&1; then
        log_success "Frontend is healthy (http://localhost:$FRONTEND_PORT)"
        frontend_healthy=true
    else
        log_error "Frontend is not responding (http://localhost:$FRONTEND_PORT)"
    fi

    # Check backend health endpoint
    if curl -f -s "http://localhost:$BACKEND_PORT/health" > /dev/null 2>&1; then
        log_success "Backend is healthy (http://localhost:$BACKEND_PORT/health)"
        backend_healthy=true
    else
        log_error "Backend is not responding (http://localhost:$BACKEND_PORT/health)"
    fi

    # Check GraphQL endpoint
    if curl -f -s -H "Content-Type: application/json" -d '{"query":"{ __schema { types { name } } }"}' "http://localhost:$BACKEND_PORT/graphql" > /dev/null 2>&1; then
        log_success "GraphQL endpoint is healthy (http://localhost:$BACKEND_PORT/graphql)"
    else
        log_error "GraphQL endpoint is not responding (http://localhost:$BACKEND_PORT/graphql)"
        backend_healthy=false
    fi

    if [ "$frontend_healthy" = true ] && [ "$backend_healthy" = true ]; then
        log_success "All services are healthy"
        return 0
    else
        log_error "Some services are unhealthy"
        return 1
    fi
}

# Show process status
show_status() {
    log_info "Development Server Status:"
    echo ""

    # Frontend status
    local frontend_pid=$(get_running_pid "$FRONTEND_PID_FILE")
    if [ $? -eq 0 ]; then
        echo -e "  Frontend: ${GREEN}RUNNING${NC} (PID: $frontend_pid, Port: $FRONTEND_PORT)"
    else
        echo -e "  Frontend: ${RED}STOPPED${NC} (Port: $FRONTEND_PORT)"
    fi

    # Backend status
    local backend_pid=$(get_running_pid "$BACKEND_PID_FILE")
    if [ $? -eq 0 ]; then
        echo -e "  Backend:  ${GREEN}RUNNING${NC} (PID: $backend_pid, Port: $BACKEND_PORT)"
    else
        echo -e "  Backend:  ${RED}STOPPED${NC} (Port: $BACKEND_PORT)"
    fi

    echo ""

    # Port status
    log_info "Port Usage:"
    lsof -i ":$FRONTEND_PORT" -i ":$BACKEND_PORT" 2>/dev/null || echo "  No processes found on development ports"
}

# Start all services in correct order
start_all() {
    log_info "Starting NestSync development environment with process management..."

    init_pid_dir

    # Create logs directory
    mkdir -p "$PROJECT_ROOT/.logs"

    # Stop any existing processes
    kill_all_development_processes

    # Start backend first (frontend depends on it)
    start_backend

    # Start frontend
    start_frontend

    # Final health check
    log_info "Performing final health check..."
    if health_check; then
        log_success "Development environment started successfully!"
        show_status
        echo ""
        echo -e "${BLUE}Access Points:${NC}"
        echo "  Frontend: http://localhost:$FRONTEND_PORT"
        echo "  Backend:  http://localhost:$BACKEND_PORT"
        echo "  GraphQL:  http://localhost:$BACKEND_PORT/graphql"
        echo ""
        echo -e "${BLUE}Test Credentials:${NC}"
        echo "  Email:    parents@nestsync.com"
        echo "  Password: Shazam11#"
    else
        log_error "Development environment startup failed"
        show_status
        exit 1
    fi
}

# Stop all services
stop_all() {
    log_info "Stopping NestSync development environment..."
    init_pid_dir
    kill_all_development_processes
}

# Restart all services
restart_all() {
    log_info "Restarting NestSync development environment..."
    stop_all
    sleep 3
    start_all
}

# Clean up everything (processes, PID files, logs)
clean_all() {
    log_info "Cleaning up development environment..."

    stop_all

    # Remove PID directory
    if [ -d "$PID_DIR" ]; then
        rm -rf "$PID_DIR"
        log_info "Removed PID directory"
    fi

    # Clean up logs
    if [ -d "$PROJECT_ROOT/.logs" ]; then
        rm -rf "$PROJECT_ROOT/.logs"
        log_info "Removed log directory"
    fi

    log_success "Development environment cleaned"
}

# Show help
show_help() {
    echo "NestSync Server Process Manager"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start         Start all development services"
    echo "  stop          Stop all development services"
    echo "  restart       Restart all development services"
    echo "  status        Show service status"
    echo "  health        Run health check"
    echo "  kill-all      Force kill all development processes"
    echo "  clean         Clean up processes, PID files, and logs"
    echo "  help          Show this help message"
    echo ""
    echo "Service Management:"
    echo "  start-frontend    Start frontend only"
    echo "  start-backend     Start backend only"
    echo "  stop-frontend     Stop frontend only"
    echo "  stop-backend      Stop backend only"
    echo ""
    echo "This script enforces single-instance servers and prevents"
    echo "the 'fails on first go' Playwright automation issues."
}

# Main command dispatcher
case "${1:-help}" in
    start)
        start_all
        ;;
    stop)
        stop_all
        ;;
    restart)
        restart_all
        ;;
    status)
        show_status
        ;;
    health)
        health_check
        ;;
    kill-all)
        kill_all_development_processes
        ;;
    clean)
        clean_all
        ;;
    start-frontend)
        init_pid_dir
        mkdir -p "$PROJECT_ROOT/.logs"
        start_frontend
        ;;
    start-backend)
        init_pid_dir
        mkdir -p "$PROJECT_ROOT/.logs"
        start_backend
        ;;
    stop-frontend)
        init_pid_dir
        kill_process_by_pid_file "$FRONTEND_PID_FILE" "Frontend"
        ;;
    stop-backend)
        init_pid_dir
        kill_process_by_pid_file "$BACKEND_PID_FILE" "Backend"
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