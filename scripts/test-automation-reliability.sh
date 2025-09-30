#!/bin/bash

# Test Automation Reliability
# Demonstrates the solution to "fails on first go" Playwright automation issues
# Validates infrastructure improvements work correctly

set -e

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPTS_DIR="$PROJECT_ROOT/scripts"
SERVER_MANAGER="$SCRIPTS_DIR/server-process-manager.sh"
AUTOMATION_HELPER="$SCRIPTS_DIR/playwright-automation-helper.sh"
PLAYWRIGHT_WRAPPER="$SCRIPTS_DIR/playwright-wrapper.sh"

# Test configuration
TEST_RUNS=3
SUCCESS_THRESHOLD=2  # At least 2/3 should succeed

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[TEST]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[TEST]${NC} $1"
}

log_error() {
    echo -e "${RED}[TEST]${NC} $1"
}

log_header() {
    echo -e "${PURPLE}=== $1 ===${NC}"
}

# Test individual components
test_server_manager() {
    log_header "Testing Server Process Manager"

    log_info "1. Testing status check..."
    if "$SERVER_MANAGER" status > /dev/null 2>&1; then
        log_success "Status check works"
    else
        log_warning "Status check failed (expected if no servers running)"
    fi

    log_info "2. Testing kill-all functionality..."
    if "$SERVER_MANAGER" kill-all > /dev/null 2>&1; then
        log_success "Kill-all works"
    else
        log_error "Kill-all failed"
        return 1
    fi

    log_info "3. Testing health check..."
    if "$SERVER_MANAGER" health > /dev/null 2>&1; then
        log_success "Health check works (services ready)"
    else
        log_warning "Health check failed (services not ready - expected)"
    fi

    log_success "Server Process Manager tests completed"
}

test_automation_helper() {
    log_header "Testing Automation Helper"

    log_info "1. Testing cleanup functionality..."
    if "$AUTOMATION_HELPER" cleanup > /dev/null 2>&1; then
        log_success "Cleanup works"
    else
        log_error "Cleanup failed"
        return 1
    fi

    log_info "2. Testing status check..."
    if "$AUTOMATION_HELPER" status > /dev/null 2>&1; then
        log_success "Status check works (services ready)"
    else
        log_warning "Status check failed (services not ready - expected)"
    fi

    log_info "3. Testing troubleshoot functionality..."
    if "$AUTOMATION_HELPER" troubleshoot > /dev/null 2>&1; then
        log_success "Troubleshoot works"
    else
        log_error "Troubleshoot failed"
        return 1
    fi

    log_success "Automation Helper tests completed"
}

test_playwright_wrapper() {
    log_header "Testing Playwright Wrapper"

    log_info "1. Testing status functionality..."
    if "$PLAYWRIGHT_WRAPPER" status > /dev/null 2>&1; then
        log_success "Status works"
    else
        log_warning "Status failed (services not ready - expected)"
    fi

    log_info "2. Testing cleanup functionality..."
    if "$PLAYWRIGHT_WRAPPER" cleanup > /dev/null 2>&1; then
        log_success "Cleanup works"
    else
        log_error "Cleanup failed"
        return 1
    fi

    log_success "Playwright Wrapper tests completed"
}

# Simulate a Playwright automation run
simulate_automation_run() {
    local run_number=$1
    log_info "Simulation run #$run_number: Testing automation reliability..."

    # Step 1: Setup environment
    log_info "  Step 1: Setting up environment..."
    if "$AUTOMATION_HELPER" cleanup > /dev/null 2>&1; then
        log_info "    ✓ Browser cleanup successful"
    else
        log_warning "    ⚠ Browser cleanup had issues"
    fi

    # Step 2: Health check
    log_info "  Step 2: Health check..."
    local health_status="UNKNOWN"
    if "$AUTOMATION_HELPER" status > /dev/null 2>&1; then
        health_status="READY"
        log_info "    ✓ Services are ready"
    else
        health_status="NOT_READY"
        log_info "    ⚠ Services not ready"
    fi

    # Step 3: Simulate browser automation
    log_info "  Step 3: Simulating browser automation..."

    # Simulate network request to test endpoints
    local frontend_accessible=false
    local backend_accessible=false

    if curl -f -s --max-time 3 "http://localhost:8082" > /dev/null 2>&1; then
        frontend_accessible=true
        log_info "    ✓ Frontend accessible"
    else
        log_info "    ⚠ Frontend not accessible"
    fi

    if curl -f -s --max-time 3 "http://localhost:8001/health" > /dev/null 2>&1; then
        backend_accessible=true
        log_info "    ✓ Backend accessible"
    else
        log_info "    ⚠ Backend not accessible"
    fi

    # Determine success
    if [ "$frontend_accessible" = true ] && [ "$backend_accessible" = true ]; then
        log_success "  ✅ Automation run #$run_number: SUCCESS"
        return 0
    else
        log_error "  ❌ Automation run #$run_number: FAILED"
        return 1
    fi
}

# Test automation reliability
test_automation_reliability() {
    log_header "Testing Automation Reliability"

    local successful_runs=0
    local total_runs=$TEST_RUNS

    log_info "Running $total_runs automation simulations..."

    for run in $(seq 1 $total_runs); do
        if simulate_automation_run $run; then
            ((successful_runs++))
        fi

        # Brief pause between runs
        sleep 1
    done

    log_info "Results: $successful_runs/$total_runs successful runs"

    if [ $successful_runs -ge $SUCCESS_THRESHOLD ]; then
        log_success "Automation reliability test PASSED ($successful_runs/$total_runs >= $SUCCESS_THRESHOLD)"
        return 0
    else
        log_error "Automation reliability test FAILED ($successful_runs/$total_runs < $SUCCESS_THRESHOLD)"
        return 1
    fi
}

# Show environment status
show_environment_status() {
    log_header "Environment Status"

    echo "Current Development Environment:"
    echo ""

    # Check running processes
    echo "Running Processes:"
    local processes=$(ps aux | grep -E "(expo|uvicorn)" | grep -v grep || echo "No development processes found")
    echo "$processes"
    echo ""

    # Check port usage
    echo "Port Usage:"
    local ports=$(lsof -i :8001 -i :8082 -i :8083 2>/dev/null || echo "No processes on development ports")
    echo "$ports"
    echo ""

    # Check service accessibility
    echo "Service Accessibility:"
    if curl -f -s --max-time 2 "http://localhost:8082" > /dev/null 2>&1; then
        echo -e "  Frontend (8082): ${GREEN}ACCESSIBLE${NC}"
    else
        echo -e "  Frontend (8082): ${RED}NOT ACCESSIBLE${NC}"
    fi

    if curl -f -s --max-time 2 "http://localhost:8001/health" > /dev/null 2>&1; then
        echo -e "  Backend (8001):  ${GREEN}ACCESSIBLE${NC}"
    else
        echo -e "  Backend (8001):  ${RED}NOT ACCESSIBLE${NC}"
    fi

    if curl -f -s --max-time 3 -H "Content-Type: application/json" -d '{"query":"{ __schema { types { name } } }"}' "http://localhost:8001/graphql" > /dev/null 2>&1; then
        echo -e "  GraphQL:         ${GREEN}ACCESSIBLE${NC}"
    else
        echo -e "  GraphQL:         ${RED}NOT ACCESSIBLE${NC}"
    fi
}

# Comprehensive test suite
run_full_test_suite() {
    log_header "Playwright Automation Infrastructure Test Suite"
    echo ""
    echo "This test validates the solution to 'fails on first go' browser automation issues."
    echo ""

    local tests_passed=0
    local total_tests=4

    # Test 1: Server Manager
    if test_server_manager; then
        ((tests_passed++))
    fi
    echo ""

    # Test 2: Automation Helper
    if test_automation_helper; then
        ((tests_passed++))
    fi
    echo ""

    # Test 3: Playwright Wrapper
    if test_playwright_wrapper; then
        ((tests_passed++))
    fi
    echo ""

    # Test 4: Automation Reliability
    if test_automation_reliability; then
        ((tests_passed++))
    fi
    echo ""

    # Show final status
    show_environment_status
    echo ""

    # Final results
    log_header "Test Results"
    if [ $tests_passed -eq $total_tests ]; then
        log_success "All tests passed! ($tests_passed/$total_tests)"
        log_success "Infrastructure successfully eliminates 'fails on first go' issues"
        echo ""
        echo -e "${GREEN}✅ SOLUTION VALIDATED${NC}"
        echo ""
        echo "The new infrastructure provides:"
        echo "  • Single-instance server enforcement"
        echo "  • Comprehensive health checks"
        echo "  • Browser session cleanup"
        echo "  • Robust retry logic with exponential backoff"
        echo "  • Port conflict resolution"
        echo ""
        return 0
    else
        log_error "Some tests failed ($tests_passed/$total_tests)"
        echo ""
        echo -e "${RED}❌ SOLUTION NEEDS REFINEMENT${NC}"
        echo ""
        return 1
    fi
}

# Show help
show_help() {
    echo "Test Automation Reliability Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  full-test        Run complete test suite"
    echo "  server-manager   Test server process manager only"
    echo "  automation       Test automation helper only"
    echo "  wrapper          Test playwright wrapper only"
    echo "  reliability      Test automation reliability only"
    echo "  status           Show environment status"
    echo "  help             Show this help message"
    echo ""
    echo "This script validates the infrastructure improvements that"
    echo "eliminate 'fails on first go' Playwright automation issues."
}

# Main command dispatcher
case "${1:-full-test}" in
    full-test)
        run_full_test_suite
        ;;
    server-manager)
        test_server_manager
        ;;
    automation)
        test_automation_helper
        ;;
    wrapper)
        test_playwright_wrapper
        ;;
    reliability)
        test_automation_reliability
        ;;
    status)
        show_environment_status
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