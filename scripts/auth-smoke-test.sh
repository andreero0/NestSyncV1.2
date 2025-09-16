#!/bin/bash
# Authentication Smoke Test
# Continuously validates authentication system health
# Designed to prevent business-critical authentication failures

set -e

# Configuration
BACKEND_URL="${BACKEND_URL:-http://localhost:8001}"
TEST_EMAIL="${TEST_EMAIL:-parents@nestsync.com}"
TEST_PASSWORD="${TEST_PASSWORD:-Shazam11#}"
MAX_RETRIES=3
TIMEOUT=30
LOG_FILE="/tmp/auth-smoke-test.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Success/failure tracking
success() {
    echo -e "${GREEN}✅ $1${NC}"
    log "SUCCESS: $1"
}

failure() {
    echo -e "${RED}❌ $1${NC}"
    log "FAILURE: $1"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    log "WARNING: $1"
}

info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
    log "INFO: $1"
}

# Test functions
test_backend_health() {
    info "Testing backend health endpoint..."

    local response
    response=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$BACKEND_URL/health" || echo "000")

    if [ "$response" = "200" ]; then
        success "Backend health check passed (HTTP $response)"
        return 0
    else
        failure "Backend health check failed (HTTP $response)"
        return 1
    fi
}

test_auth_health() {
    info "Testing authentication health endpoint..."

    local response
    response=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$BACKEND_URL/health/auth" || echo "000")

    if [ "$response" = "200" ]; then
        success "Authentication health check passed (HTTP $response)"
        return 0
    else
        failure "Authentication health check failed (HTTP $response)"

        # Get detailed error information
        local error_details
        error_details=$(curl -s --max-time $TIMEOUT "$BACKEND_URL/health/auth" | jq -r '.critical_failures[]' 2>/dev/null || echo "Unknown error")
        warning "Auth health errors: $error_details"
        return 1
    fi
}

test_graphql_endpoint() {
    info "Testing GraphQL endpoint accessibility..."

    local response
    response=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT \
        -X POST \
        -H "Content-Type: application/json" \
        -d '{"query": "{ __schema { types { name } } }"}' \
        "$BACKEND_URL/graphql" || echo "000")

    if [ "$response" = "200" ]; then
        success "GraphQL endpoint accessible (HTTP $response)"
        return 0
    else
        failure "GraphQL endpoint failed (HTTP $response)"
        return 1
    fi
}

test_authentication_flow() {
    info "Testing authentication flow with test credentials..."

    # GraphQL sign-in mutation
    local graphql_query='{
        "query": "mutation SignIn($input: SignInInput!) { signIn(input: $input) { success error user { id email } session { accessToken } } }",
        "variables": {
            "input": {
                "email": "'$TEST_EMAIL'",
                "password": "'$TEST_PASSWORD'"
            }
        }
    }'

    local response
    response=$(curl -s --max-time $TIMEOUT \
        -X POST \
        -H "Content-Type: application/json" \
        -d "$graphql_query" \
        "$BACKEND_URL/graphql")

    if [ $? -ne 0 ]; then
        failure "Authentication request failed (network error)"
        return 1
    fi

    # Check if response contains success
    local success_status
    success_status=$(echo "$response" | jq -r '.data.signIn.success' 2>/dev/null || echo "null")

    if [ "$success_status" = "true" ]; then
        success "Authentication flow test passed"

        # Log access token presence (but not the token itself)
        local has_token
        has_token=$(echo "$response" | jq -r '.data.signIn.session.accessToken != null' 2>/dev/null || echo "false")
        info "Access token received: $has_token"

        return 0
    else
        failure "Authentication flow test failed"

        # Extract and log error (safely)
        local error_message
        error_message=$(echo "$response" | jq -r '.data.signIn.error // .errors[0].message // "Unknown error"' 2>/dev/null || echo "Parse error")
        warning "Auth error: $error_message"

        # Check for critical Pydantic validation errors
        if echo "$error_message" | grep -q "identity_id"; then
            failure "CRITICAL: Pydantic validation error detected - gotrue version incompatibility!"
            return 2 # Special exit code for critical errors
        fi

        return 1
    fi
}

# Main test runner
run_smoke_tests() {
    info "Starting authentication smoke tests..."
    info "Backend URL: $BACKEND_URL"
    info "Test Email: $TEST_EMAIL"
    echo ""

    local failed_tests=0
    local critical_failure=false

    # Test 1: Backend Health
    if ! test_backend_health; then
        ((failed_tests++))
    fi

    echo ""

    # Test 2: Auth Health
    if ! test_auth_health; then
        ((failed_tests++))
    fi

    echo ""

    # Test 3: GraphQL Endpoint
    if ! test_graphql_endpoint; then
        ((failed_tests++))
    fi

    echo ""

    # Test 4: Authentication Flow
    local auth_result
    test_authentication_flow
    auth_result=$?

    if [ $auth_result -eq 2 ]; then
        critical_failure=true
        ((failed_tests++))
    elif [ $auth_result -eq 1 ]; then
        ((failed_tests++))
    fi

    echo ""
    echo "=================================="

    # Results summary
    if [ $critical_failure = true ]; then
        failure "CRITICAL FAILURE: Authentication system has critical issues!"
        failure "This will cause user login failures and business impact."
        failure "Immediate intervention required."
        return 2
    elif [ $failed_tests -eq 0 ]; then
        success "All authentication smoke tests passed!"
        success "Authentication system is healthy."
        return 0
    else
        warning "$failed_tests test(s) failed."
        warning "Authentication system may have issues."
        return 1
    fi
}

# Continuous monitoring mode
run_continuous_monitoring() {
    local interval=${1:-300} # Default 5 minutes
    info "Starting continuous authentication monitoring (interval: ${interval}s)"

    while true; do
        run_smoke_tests
        local result=$?

        if [ $result -eq 2 ]; then
            failure "Critical authentication failure detected!"
            # Could trigger alerts here
        fi

        info "Waiting ${interval} seconds before next check..."
        sleep $interval
    done
}

# Main execution
main() {
    case "${1:-single}" in
        "continuous")
            run_continuous_monitoring "${2:-300}"
            ;;
        "single")
            run_smoke_tests
            ;;
        "help"|"-h"|"--help")
            echo "Authentication Smoke Test"
            echo ""
            echo "Usage:"
            echo "  $0 single              Run tests once"
            echo "  $0 continuous [interval] Run tests continuously (default: 300s)"
            echo "  $0 help                Show this help"
            echo ""
            echo "Environment Variables:"
            echo "  BACKEND_URL           Backend server URL (default: http://localhost:8001)"
            echo "  TEST_EMAIL            Test account email (default: parents@nestsync.com)"
            echo "  TEST_PASSWORD         Test account password (default: Shazam11#)"
            ;;
        *)
            echo "Unknown command: $1"
            echo "Use '$0 help' for usage information."
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"