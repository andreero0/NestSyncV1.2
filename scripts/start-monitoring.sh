#!/bin/bash
# Authentication Monitoring Deployment Script
# Ensures authentication issues are detected within 5 minutes
# Prevents business-critical authentication failures

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_DIR="/tmp/nestsync-monitoring"
PID_FILE="$LOG_DIR/monitoring.pid"
BACKEND_URL="${BACKEND_URL:-http://localhost:8001}"
CHECK_INTERVAL="${CHECK_INTERVAL:-300}" # 5 minutes

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Create log directory
mkdir -p "$LOG_DIR"

# Function to check if monitoring is already running
check_monitoring_status() {
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if ps -p "$pid" > /dev/null 2>&1; then
            return 0  # Running
        else
            rm -f "$PID_FILE"
            return 1  # Not running
        fi
    else
        return 1  # Not running
    fi
}

# Function to start monitoring
start_monitoring() {
    log "Starting continuous authentication monitoring..."
    log "Backend URL: $BACKEND_URL"
    log "Check interval: ${CHECK_INTERVAL}s ($(($CHECK_INTERVAL / 60)) minutes)"
    log "Log directory: $LOG_DIR"

    # Check if backend is accessible
    if ! curl -s --max-time 10 "$BACKEND_URL/health" > /dev/null; then
        warning "Backend at $BACKEND_URL is not accessible"
        warning "Starting monitoring anyway - will wait for backend to come online"
    fi

    # Start Python monitoring script
    cd "$PROJECT_ROOT"
    nohup python3 scripts/monitoring-alerts.py \
        --backend-url "$BACKEND_URL" \
        --interval "$CHECK_INTERVAL" \
        > "$LOG_DIR/monitoring.log" 2>&1 &

    local monitoring_pid=$!
    echo "$monitoring_pid" > "$PID_FILE"

    success "Authentication monitoring started (PID: $monitoring_pid)"
    success "Logs: $LOG_DIR/monitoring.log"

    # Start basic smoke test as backup
    nohup bash scripts/auth-smoke-test.sh continuous "$CHECK_INTERVAL" \
        > "$LOG_DIR/smoke-test.log" 2>&1 &

    local smoke_pid=$!
    echo "$smoke_pid" > "$LOG_DIR/smoke-test.pid"

    success "Backup smoke testing started (PID: $smoke_pid)"
    success "Smoke logs: $LOG_DIR/smoke-test.log"

    log "Monitoring deployment complete!"
    echo ""
    log "Monitor status: ./scripts/start-monitoring.sh status"
    log "View logs: ./scripts/start-monitoring.sh logs"
    log "Stop monitoring: ./scripts/start-monitoring.sh stop"
}

# Function to stop monitoring
stop_monitoring() {
    log "Stopping authentication monitoring..."

    local stopped=0

    # Stop main monitoring
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if ps -p "$pid" > /dev/null 2>&1; then
            kill "$pid"
            success "Stopped main monitoring (PID: $pid)"
            stopped=1
        fi
        rm -f "$PID_FILE"
    fi

    # Stop smoke testing
    if [ -f "$LOG_DIR/smoke-test.pid" ]; then
        local smoke_pid=$(cat "$LOG_DIR/smoke-test.pid")
        if ps -p "$smoke_pid" > /dev/null 2>&1; then
            kill "$smoke_pid"
            success "Stopped smoke testing (PID: $smoke_pid)"
            stopped=1
        fi
        rm -f "$LOG_DIR/smoke-test.pid"
    fi

    if [ $stopped -eq 0 ]; then
        warning "No monitoring processes were running"
    else
        success "Authentication monitoring stopped"
    fi
}

# Function to show monitoring status
show_status() {
    log "Authentication Monitoring Status"
    echo "================================"

    # Check main monitoring
    if check_monitoring_status; then
        local pid=$(cat "$PID_FILE")
        success "Main monitoring: RUNNING (PID: $pid)"
    else
        warning "Main monitoring: NOT RUNNING"
    fi

    # Check smoke testing
    if [ -f "$LOG_DIR/smoke-test.pid" ]; then
        local smoke_pid=$(cat "$LOG_DIR/smoke-test.pid")
        if ps -p "$smoke_pid" > /dev/null 2>&1; then
            success "Smoke testing: RUNNING (PID: $smoke_pid)"
        else
            warning "Smoke testing: NOT RUNNING"
            rm -f "$LOG_DIR/smoke-test.pid"
        fi
    else
        warning "Smoke testing: NOT RUNNING"
    fi

    echo ""

    # Check recent authentication status
    log "Recent Authentication Health:"
    if curl -s --max-time 5 "$BACKEND_URL/health/auth/simple" > /dev/null 2>&1; then
        local health_response
        health_response=$(curl -s --max-time 5 "$BACKEND_URL/health/auth/simple")
        local healthy=$(echo "$health_response" | jq -r '.healthy // false' 2>/dev/null || echo "false")

        if [ "$healthy" = "true" ]; then
            success "Authentication system: HEALTHY"
        else
            error "Authentication system: UNHEALTHY"
            local failures=$(echo "$health_response" | jq -r '.critical_failures[]' 2>/dev/null || echo "Unknown error")
            warning "Issues: $failures"
        fi
    else
        warning "Cannot reach backend health endpoint"
    fi

    echo ""

    # Show log files
    log "Log Files:"
    if [ -f "$LOG_DIR/monitoring.log" ]; then
        local log_size=$(du -h "$LOG_DIR/monitoring.log" | cut -f1)
        echo "  📄 Main monitoring: $LOG_DIR/monitoring.log ($log_size)"
    fi

    if [ -f "$LOG_DIR/smoke-test.log" ]; then
        local smoke_size=$(du -h "$LOG_DIR/smoke-test.log" | cut -f1)
        echo "  📄 Smoke testing: $LOG_DIR/smoke-test.log ($smoke_size)"
    fi
}

# Function to show logs
show_logs() {
    local log_type="${1:-monitoring}"

    case "$log_type" in
        "monitoring"|"main")
            if [ -f "$LOG_DIR/monitoring.log" ]; then
                log "Showing main monitoring logs (last 50 lines):"
                echo "================================================"
                tail -50 "$LOG_DIR/monitoring.log"
            else
                warning "No monitoring logs found"
            fi
            ;;
        "smoke"|"backup")
            if [ -f "$LOG_DIR/smoke-test.log" ]; then
                log "Showing smoke test logs (last 50 lines):"
                echo "============================================"
                tail -50 "$LOG_DIR/smoke-test.log"
            else
                warning "No smoke test logs found"
            fi
            ;;
        "all")
            show_logs monitoring
            echo ""
            show_logs smoke
            ;;
        *)
            warning "Unknown log type: $log_type"
            log "Available log types: monitoring, smoke, all"
            ;;
    esac
}

# Function to test authentication manually
test_auth() {
    log "Running manual authentication test..."
    echo "====================================="

    cd "$PROJECT_ROOT"
    python3 scripts/monitoring-alerts.py --single --backend-url "$BACKEND_URL"
}

# Main command handling
main() {
    case "${1:-start}" in
        "start")
            if check_monitoring_status; then
                warning "Monitoring is already running"
                show_status
            else
                start_monitoring
            fi
            ;;
        "stop")
            stop_monitoring
            ;;
        "restart")
            stop_monitoring
            sleep 2
            start_monitoring
            ;;
        "status")
            show_status
            ;;
        "logs")
            show_logs "${2:-monitoring}"
            ;;
        "test")
            test_auth
            ;;
        "help"|"-h"|"--help")
            echo "Authentication Monitoring Control Script"
            echo ""
            echo "Commands:"
            echo "  start              Start monitoring (default)"
            echo "  stop               Stop monitoring"
            echo "  restart            Restart monitoring"
            echo "  status             Show monitoring status"
            echo "  logs [type]        Show logs (monitoring|smoke|all)"
            echo "  test               Run manual authentication test"
            echo "  help               Show this help"
            echo ""
            echo "Environment Variables:"
            echo "  BACKEND_URL        Backend server URL (default: http://localhost:8001)"
            echo "  CHECK_INTERVAL     Check interval in seconds (default: 300)"
            ;;
        *)
            error "Unknown command: $1"
            log "Use '$0 help' for usage information"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"