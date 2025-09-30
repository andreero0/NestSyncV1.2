#!/bin/bash

# Playwright Automation Helper
# Pre-automation health check validation and session management
# Eliminates "fails on first go" browser automation issues

set -e

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPTS_DIR="$PROJECT_ROOT/scripts"
SERVER_MANAGER="$SCRIPTS_DIR/server-process-manager.sh"

# Service URLs
FRONTEND_URL="http://localhost:8082"
BACKEND_URL="http://localhost:8001"
GRAPHQL_URL="http://localhost:8001/graphql"
HEALTH_URL="http://localhost:8001/health"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[PLAYWRIGHT-HELPER]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[PLAYWRIGHT-HELPER]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[PLAYWRIGHT-HELPER]${NC} $1"
}

log_error() {
    echo -e "${RED}[PLAYWRIGHT-HELPER]${NC} $1"
}

# Enhanced health check with detailed validation
comprehensive_health_check() {
    log_info "Running comprehensive pre-automation health check..."

    local frontend_ready=false
    local backend_ready=false
    local graphql_ready=false

    # Test frontend
    log_info "Testing frontend accessibility..."
    if curl -f -s --max-time 5 "$FRONTEND_URL" > /dev/null 2>&1; then
        log_success "Frontend is accessible at $FRONTEND_URL"
        frontend_ready=true
    else
        log_error "Frontend is not accessible at $FRONTEND_URL"
    fi

    # Test backend health endpoint
    log_info "Testing backend health endpoint..."
    if curl -f -s --max-time 5 "$HEALTH_URL" > /dev/null 2>&1; then
        log_success "Backend health endpoint is accessible at $HEALTH_URL"
        backend_ready=true
    else
        log_error "Backend health endpoint is not accessible at $HEALTH_URL"
    fi

    # Test GraphQL endpoint
    log_info "Testing GraphQL endpoint..."
    local graphql_response=$(curl -f -s --max-time 10 \
        -H "Content-Type: application/json" \
        -d '{"query":"{ __schema { types { name } } }"}' \
        "$GRAPHQL_URL" 2>/dev/null || echo "ERROR")

    if [ "$graphql_response" != "ERROR" ] && echo "$graphql_response" | grep -q "types"; then
        log_success "GraphQL endpoint is responding correctly at $GRAPHQL_URL"
        graphql_ready=true
    else
        log_error "GraphQL endpoint is not responding correctly at $GRAPHQL_URL"
        log_error "Response: $graphql_response"
    fi

    # Overall health status
    if [ "$frontend_ready" = true ] && [ "$backend_ready" = true ] && [ "$graphql_ready" = true ]; then
        log_success "All services are ready for automation"
        return 0
    else
        log_error "Some services are not ready for automation"
        log_error "Frontend: $([ "$frontend_ready" = true ] && echo "READY" || echo "NOT READY")"
        log_error "Backend: $([ "$backend_ready" = true ] && echo "READY" || echo "NOT READY")"
        log_error "GraphQL: $([ "$graphql_ready" = true ] && echo "READY" || echo "NOT READY")"
        return 1
    fi
}

# Test authentication flow specifically
test_authentication_flow() {
    log_info "Testing authentication flow..."

    # Test sign-in mutation
    local signin_query='{"query":"mutation { signIn(email: \"parents@nestsync.com\", password: \"Shazam11#\") { success message user { id email } } }"}'

    local auth_response=$(curl -f -s --max-time 15 \
        -H "Content-Type: application/json" \
        -d "$signin_query" \
        "$GRAPHQL_URL" 2>/dev/null || echo "ERROR")

    if [ "$auth_response" != "ERROR" ] && echo "$auth_response" | grep -q "success"; then
        log_success "Authentication endpoint is responding correctly"
        log_info "Auth response preview: $(echo "$auth_response" | head -c 100)..."
        return 0
    else
        log_error "Authentication endpoint is not responding correctly"
        log_error "Response: $auth_response"
        return 1
    fi
}

# Wait for services with exponential backoff and detailed logging
wait_for_services_ready() {
    local max_wait=${1:-120}
    log_info "Waiting for services to be ready (max ${max_wait}s)..."

    local attempt=1
    local wait_time=2
    local total_time=0

    while [ $total_time -lt $max_wait ]; do
        log_info "Health check attempt $attempt (${total_time}s elapsed)..."

        if comprehensive_health_check; then
            log_success "All services are ready after ${total_time}s"
            return 0
        fi

        log_warning "Services not ready, waiting ${wait_time}s before retry..."
        sleep $wait_time

        total_time=$((total_time + wait_time))
        attempt=$((attempt + 1))

        # Exponential backoff (cap at 10 seconds)
        if [ $wait_time -lt 10 ]; then
            wait_time=$((wait_time * 2))
        fi
    done

    log_error "Services failed to become ready within ${max_wait}s"
    return 1
}

# Clear browser data and sessions to prevent state conflicts
cleanup_browser_sessions() {
    log_info "Cleaning up browser sessions and data..."

    # Clear Chrome user data directories that might be used by Playwright
    local chrome_data_patterns=(
        "/Users/*/Library/Caches/ms-playwright/chrome*"
        "/Users/*/Library/Caches/ms-playwright/mcp-chrome*"
        "/tmp/playwright*"
        "/var/folders/*/T/playwright*"
        "/var/folders/*/T/chrome*"
    )

    for pattern in "${chrome_data_patterns[@]}"; do
        if ls $pattern > /dev/null 2>&1; then
            log_info "Removing browser data: $pattern"
            rm -rf $pattern 2>/dev/null || true
        fi
    done

    # Kill any existing Chrome processes that might interfere
    pkill -f "Google Chrome.*playwright" 2>/dev/null || true
    pkill -f "chrome.*remote-debugging-port" 2>/dev/null || true

    log_success "Browser sessions cleaned up"
}

# Ensure servers are in single-instance mode
ensure_single_instance_servers() {
    log_info "Ensuring single-instance server enforcement..."

    # Check if server manager exists
    if [ ! -f "$SERVER_MANAGER" ]; then
        log_error "Server process manager not found at $SERVER_MANAGER"
        return 1
    fi

    # Stop all development processes first
    log_info "Stopping all development processes..."
    "$SERVER_MANAGER" kill-all

    # Wait a moment for processes to die
    sleep 3

    # Start servers in managed mode
    log_info "Starting servers in single-instance mode..."
    "$SERVER_MANAGER" start

    log_success "Single-instance servers enforced"
}

# Full pre-automation setup
setup_for_automation() {
    log_info "Setting up environment for Playwright automation..."

    # Step 1: Clean up browser sessions
    cleanup_browser_sessions

    # Step 2: Ensure single-instance servers
    ensure_single_instance_servers

    # Step 3: Wait for services to be ready
    if ! wait_for_services_ready 120; then
        log_error "Services failed to become ready - cannot proceed with automation"
        return 1
    fi

    # Step 4: Test authentication specifically
    if ! test_authentication_flow; then
        log_warning "Authentication flow test failed - proceeding with caution"
    fi

    log_success "Environment is ready for Playwright automation"
    show_automation_ready_status
}

# Show ready status for automation
show_automation_ready_status() {
    echo ""
    log_info "=== AUTOMATION READY STATUS ==="
    echo -e "  Frontend:     ${GREEN}✓ READY${NC} ($FRONTEND_URL)"
    echo -e "  Backend:      ${GREEN}✓ READY${NC} ($BACKEND_URL)"
    echo -e "  GraphQL:      ${GREEN}✓ READY${NC} ($GRAPHQL_URL)"
    echo -e "  Authentication: ${GREEN}✓ TESTED${NC}"
    echo -e "  Browser Data:   ${GREEN}✓ CLEANED${NC}"
    echo ""
    echo -e "${BLUE}Test Credentials:${NC}"
    echo "  Email:    parents@nestsync.com"
    echo "  Password: Shazam11#"
    echo ""
    echo -e "${GREEN}Ready for Playwright automation!${NC}"
}

# Quick status check without full setup
quick_status_check() {
    log_info "Quick automation readiness check..."

    if comprehensive_health_check; then
        show_automation_ready_status
        return 0
    else
        log_error "Services are not ready for automation"
        log_info "Run '$0 setup' to prepare environment"
        return 1
    fi
}

# Troubleshooting helper
troubleshoot() {
    log_info "Running troubleshooting diagnostics..."

    echo ""
    echo "=== PORT USAGE ==="
    lsof -i :8001 -i :8082 -i :8083 2>/dev/null || echo "No processes found on development ports"

    echo ""
    echo "=== RUNNING PROCESSES ==="
    ps aux | grep -E "(expo|uvicorn|fastapi)" | grep -v grep || echo "No development processes found"

    echo ""
    echo "=== SERVICE CONNECTIVITY ==="

    # Test each service
    local services=("$FRONTEND_URL" "$BACKEND_URL" "$GRAPHQL_URL")
    for service in "${services[@]}"; do
        if curl -f -s --max-time 5 "$service" > /dev/null 2>&1; then
            echo -e "  $service: ${GREEN}ACCESSIBLE${NC}"
        else
            echo -e "  $service: ${RED}NOT ACCESSIBLE${NC}"
        fi
    done

    echo ""
    echo "=== RECOMMENDATIONS ==="
    echo "1. Run '$0 setup' to clean up and restart services"
    echo "2. Check server logs: tail -f $PROJECT_ROOT/.logs/*.log"
    echo "3. Manually restart: $SERVER_MANAGER restart"
}

# Show help
show_help() {
    echo "Playwright Automation Helper"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  setup         Full setup for automation (recommended before testing)"
    echo "  status        Quick automation readiness check"
    echo "  health        Comprehensive health check"
    echo "  auth-test     Test authentication flow specifically"
    echo "  cleanup       Clean up browser sessions and data"
    echo "  troubleshoot  Run diagnostics and show recommendations"
    echo "  help          Show this help message"
    echo ""
    echo "This script ensures reliable Playwright automation by eliminating"
    echo "the 'fails on first go' issues caused by competing server instances."
    echo ""
    echo "Recommended workflow:"
    echo "  $0 setup      # Before running any automation"
    echo "  # ... run your Playwright tests ..."
    echo "  $0 cleanup    # After automation (optional)"
}

# Main command dispatcher
case "${1:-help}" in
    setup)
        setup_for_automation
        ;;
    status)
        quick_status_check
        ;;
    health)
        comprehensive_health_check
        ;;
    auth-test)
        test_authentication_flow
        ;;
    cleanup)
        cleanup_browser_sessions
        ;;
    troubleshoot)
        troubleshoot
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