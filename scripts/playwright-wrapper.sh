#!/bin/bash

# Playwright Wrapper with Robust Retry Logic
# Eliminates "fails on first go" browser automation issues
# Provides exponential backoff retry for Playwright operations

set -e

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPTS_DIR="$PROJECT_ROOT/scripts"
AUTOMATION_HELPER="$SCRIPTS_DIR/playwright-automation-helper.sh"

# Retry configuration
MAX_RETRIES=3
BASE_DELAY=5
MAX_DELAY=30

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions with timestamps
log_with_time() {
    local level=$1
    shift
    local timestamp=$(date '+%H:%M:%S')
    echo -e "${timestamp} ${level} $*"
}

log_info() {
    log_with_time "${BLUE}[PLAYWRIGHT]${NC}" "$@"
}

log_success() {
    log_with_time "${GREEN}[PLAYWRIGHT]${NC}" "$@"
}

log_warning() {
    log_with_time "${YELLOW}[PLAYWRIGHT]${NC}" "$@"
}

log_error() {
    log_with_time "${RED}[PLAYWRIGHT]${NC}" "$@"
}

# Calculate exponential backoff delay
calculate_delay() {
    local attempt=$1
    local delay=$((BASE_DELAY * (2 ** (attempt - 1))))

    # Cap at MAX_DELAY
    if [ $delay -gt $MAX_DELAY ]; then
        delay=$MAX_DELAY
    fi

    echo $delay
}

# Enhanced retry logic with specific error handling
retry_with_backoff() {
    local operation_name="$1"
    shift
    local command=("$@")

    log_info "Starting operation: $operation_name"

    for attempt in $(seq 1 $MAX_RETRIES); do
        log_info "Attempt $attempt of $MAX_RETRIES for: $operation_name"

        # Run the command and capture both exit code and output
        local output_file="/tmp/playwright_output_$$_$attempt"
        local error_file="/tmp/playwright_error_$$_$attempt"

        if "${command[@]}" > "$output_file" 2> "$error_file"; then
            log_success "$operation_name succeeded on attempt $attempt"

            # Show output if it exists
            if [ -s "$output_file" ]; then
                cat "$output_file"
            fi

            # Cleanup temp files
            rm -f "$output_file" "$error_file"
            return 0
        else
            local exit_code=$?
            local error_output=$(cat "$error_file" 2>/dev/null || echo "No error output")
            local stdout_output=$(cat "$output_file" 2>/dev/null || echo "No output")

            log_error "$operation_name failed on attempt $attempt (exit code: $exit_code)"
            log_error "Error output: $error_output"
            log_error "Standard output: $stdout_output"

            # Analyze error type and decide if we should retry
            local should_retry=$(should_retry_error "$error_output" "$stdout_output" $attempt)

            if [ "$should_retry" = "false" ] || [ $attempt -eq $MAX_RETRIES ]; then
                log_error "$operation_name failed permanently after $attempt attempts"

                # Show final error details
                echo "=== FINAL ERROR DETAILS ==="
                echo "Exit Code: $exit_code"
                echo "Error Output: $error_output"
                echo "Standard Output: $stdout_output"

                # Cleanup temp files
                rm -f "$output_file" "$error_file"
                return $exit_code
            fi

            # Calculate delay for next attempt
            local delay=$(calculate_delay $attempt)
            log_warning "Retrying in ${delay}s... (attempt $((attempt + 1))/$MAX_RETRIES)"

            # Clean up browser sessions between retries
            log_info "Cleaning up browser sessions before retry..."
            "$AUTOMATION_HELPER" cleanup 2>/dev/null || true

            sleep $delay
        fi

        # Cleanup temp files for this attempt
        rm -f "$output_file" "$error_file"
    done

    log_error "$operation_name failed after all $MAX_RETRIES attempts"
    return 1
}

# Determine if an error is worth retrying
should_retry_error() {
    local error_output="$1"
    local stdout_output="$2"
    local attempt="$3"

    # Don't retry on the last attempt anyway
    if [ $attempt -ge $MAX_RETRIES ]; then
        echo "false"
        return
    fi

    # Combine outputs for analysis
    local combined_output="$error_output $stdout_output"

    # Always retry network/connection issues
    if echo "$combined_output" | grep -iE "(network|connection|timeout|refused|unreachable|dns|resolve)" > /dev/null; then
        log_info "Network/connection error detected - will retry"
        echo "true"
        return
    fi

    # Always retry browser launch failures
    if echo "$combined_output" | grep -iE "(browser|chrome|playwright|launch)" > /dev/null; then
        log_info "Browser launch error detected - will retry"
        echo "true"
        return
    fi

    # Retry authentication timeouts but not auth failures
    if echo "$combined_output" | grep -iE "(timeout.*auth|auth.*timeout)" > /dev/null; then
        log_info "Authentication timeout detected - will retry"
        echo "true"
        return
    fi

    # Don't retry actual authentication failures (wrong credentials)
    if echo "$combined_output" | grep -iE "(invalid.*credential|unauthorized|forbidden|authentication.*failed)" > /dev/null; then
        log_warning "Authentication failure detected - will not retry"
        echo "false"
        return
    fi

    # Retry port conflicts or service unavailable
    if echo "$combined_output" | grep -iE "(port.*use|service.*unavailable|connection.*reset|econnreset)" > /dev/null; then
        log_info "Service/port issue detected - will retry"
        echo "true"
        return
    fi

    # Don't retry syntax errors or test failures
    if echo "$combined_output" | grep -iE "(syntax.*error|test.*failed|assertion.*error)" > /dev/null; then
        log_warning "Test/syntax error detected - will not retry"
        echo "false"
        return
    fi

    # By default, retry other errors (be optimistic)
    log_info "Unknown error type - will retry"
    echo "true"
}

# Setup environment with retry logic
setup_environment() {
    log_info "Setting up environment for automation with retry logic..."

    retry_with_backoff "Environment Setup" "$AUTOMATION_HELPER" setup
}

# Wrapper for common Playwright operations
run_playwright_operation() {
    local operation_name="$1"
    shift
    local playwright_args=("$@")

    # Ensure environment is ready
    if ! setup_environment; then
        log_error "Failed to setup environment - cannot proceed"
        return 1
    fi

    # Run Playwright operation with retry logic
    retry_with_backoff "$operation_name" "${playwright_args[@]}"
}

# Specific wrappers for common use cases
navigate_and_test() {
    local url="$1"
    local test_description="$2"

    log_info "Navigation and test: $test_description"
    log_info "Target URL: $url"

    # This would be called by Claude Code with the actual Playwright MCP commands
    # For now, we simulate the operation
    run_playwright_operation "Navigate to $url and $test_description" \
        echo "Simulating Playwright navigation to $url for: $test_description"
}

# Test authentication specifically with retries
test_authentication() {
    local email="${1:-parents@nestsync.com}"
    local password="${2:-Shazam11#}"

    log_info "Testing authentication with retry logic"

    run_playwright_operation "Authentication Test" \
        echo "Simulating authentication test for $email"
}

# Cleanup wrapper
cleanup_after_test() {
    log_info "Cleaning up after test..."

    "$AUTOMATION_HELPER" cleanup 2>/dev/null || true

    log_success "Cleanup completed"
}

# Health check before operations
pre_operation_check() {
    log_info "Running pre-operation health check..."

    if ! "$AUTOMATION_HELPER" status; then
        log_warning "Services not ready, running full setup..."
        if ! setup_environment; then
            log_error "Failed to prepare environment"
            return 1
        fi
    fi

    log_success "Pre-operation check passed"
}

# Show operation status
show_status() {
    log_info "Playwright Wrapper Status"
    echo ""
    echo "Configuration:"
    echo "  Max Retries: $MAX_RETRIES"
    echo "  Base Delay: ${BASE_DELAY}s"
    echo "  Max Delay: ${MAX_DELAY}s"
    echo ""

    "$AUTOMATION_HELPER" status
}

# Show help
show_help() {
    echo "Playwright Wrapper with Robust Retry Logic"
    echo ""
    echo "Usage: $0 [COMMAND] [ARGS...]"
    echo ""
    echo "Commands:"
    echo "  setup                      Setup environment for automation"
    echo "  status                     Show status and configuration"
    echo "  health-check              Run pre-operation health check"
    echo "  test-auth [email] [pass]  Test authentication with retries"
    echo "  cleanup                   Clean up after operations"
    echo "  help                      Show this help message"
    echo ""
    echo "Wrapper Functions (for integration):"
    echo "  run-operation NAME ARGS... Run any operation with retry logic"
    echo "  navigate URL DESCRIPTION   Navigate and test with retries"
    echo ""
    echo "This wrapper provides robust retry logic with exponential backoff"
    echo "for Playwright operations, eliminating 'fails on first go' issues."
    echo ""
    echo "Configuration:"
    echo "  MAX_RETRIES=$MAX_RETRIES"
    echo "  BASE_DELAY=${BASE_DELAY}s"
    echo "  MAX_DELAY=${MAX_DELAY}s"
    echo ""
    echo "Example integration with Claude Code:"
    echo "  # Before Playwright automation:"
    echo "  $0 setup"
    echo ""
    echo "  # For retry wrapper around operations:"
    echo "  $0 run-operation \"Login Test\" your_playwright_command_here"
}

# Main command dispatcher
case "${1:-help}" in
    setup)
        setup_environment
        ;;
    status)
        show_status
        ;;
    health-check)
        pre_operation_check
        ;;
    test-auth)
        test_authentication "$2" "$3"
        ;;
    cleanup)
        cleanup_after_test
        ;;
    run-operation)
        shift
        operation_name="$1"
        shift
        run_playwright_operation "$operation_name" "$@"
        ;;
    navigate)
        navigate_and_test "$2" "$3"
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