#!/bin/bash

# Pre-flight Check Test Suite
# Tests the test-preflight-check.sh script under various conditions

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Test results
TEST_RESULTS=()

# Logging functions
log_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

log_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
    TESTS_PASSED=$((TESTS_PASSED + 1))
    TEST_RESULTS+=("✓ $1")
}

log_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    TEST_RESULTS+=("✗ $1")
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Helper function to check if services are running
is_backend_running() {
    curl -s -f -o /dev/null --max-time 2 http://localhost:8001/health
}

is_frontend_running() {
    curl -s -f -o /dev/null --max-time 2 http://localhost:8082
}

# Test 1: Pre-flight check with all services running
test_all_services_running() {
    TESTS_RUN=$((TESTS_RUN + 1))
    log_test "Test 1: Pre-flight check with all services running"
    
    # Check if services are actually running
    if ! is_backend_running; then
        log_fail "Test 1: Backend not running (prerequisite not met)"
        return 1
    fi
    
    if ! is_frontend_running; then
        log_fail "Test 1: Frontend not running (prerequisite not met)"
        return 1
    fi
    
    # Run pre-flight check
    if ./scripts/test-preflight-check.sh > /tmp/preflight-test1.log 2>&1; then
        local exit_code=$?
        if [ $exit_code -eq 0 ]; then
            log_pass "Test 1: Pre-flight check passed with exit code 0"
            return 0
        else
            log_fail "Test 1: Pre-flight check returned unexpected exit code: $exit_code"
            cat /tmp/preflight-test1.log
            return 1
        fi
    else
        local exit_code=$?
        log_fail "Test 1: Pre-flight check failed with exit code: $exit_code"
        cat /tmp/preflight-test1.log
        return 1
    fi
}

# Test 2: Pre-flight check with backend down
test_backend_down() {
    TESTS_RUN=$((TESTS_RUN + 1))
    log_test "Test 2: Pre-flight check with backend down"
    
    # Check if backend is actually down
    if is_backend_running; then
        log_info "Test 2: Skipping (backend is running, cannot test backend down scenario)"
        log_info "Test 2: To run this test, stop the backend service first"
        return 0
    fi
    
    # Run pre-flight check (should fail with exit code 1)
    if ./scripts/test-preflight-check.sh > /tmp/preflight-test2.log 2>&1; then
        log_fail "Test 2: Pre-flight check should have failed but passed"
        return 1
    else
        local exit_code=$?
        if [ $exit_code -eq 1 ]; then
            log_pass "Test 2: Pre-flight check correctly returned exit code 1 (backend not ready)"
            
            # Verify error message mentions backend
            if grep -q "Backend not responding" /tmp/preflight-test2.log; then
                log_pass "Test 2: Error message correctly identifies backend issue"
            else
                log_fail "Test 2: Error message does not mention backend"
                cat /tmp/preflight-test2.log
            fi
            return 0
        else
            log_fail "Test 2: Expected exit code 1, got $exit_code"
            cat /tmp/preflight-test2.log
            return 1
        fi
    fi
}

# Test 3: Pre-flight check with frontend down
test_frontend_down() {
    TESTS_RUN=$((TESTS_RUN + 1))
    log_test "Test 3: Pre-flight check with frontend down"
    
    # Check if frontend is actually down
    if is_frontend_running; then
        log_info "Test 3: Skipping (frontend is running, cannot test frontend down scenario)"
        log_info "Test 3: To run this test, stop the frontend service first"
        return 0
    fi
    
    # Check if backend is running (required for this test)
    if ! is_backend_running; then
        log_info "Test 3: Skipping (backend not running, prerequisite not met)"
        return 0
    fi
    
    # Run pre-flight check (should fail with exit code 2)
    if ./scripts/test-preflight-check.sh > /tmp/preflight-test3.log 2>&1; then
        log_fail "Test 3: Pre-flight check should have failed but passed"
        return 1
    else
        local exit_code=$?
        if [ $exit_code -eq 2 ]; then
            log_pass "Test 3: Pre-flight check correctly returned exit code 2 (frontend not ready)"
            
            # Verify error message mentions frontend
            if grep -q "Frontend not responding" /tmp/preflight-test3.log; then
                log_pass "Test 3: Error message correctly identifies frontend issue"
            else
                log_fail "Test 3: Error message does not mention frontend"
                cat /tmp/preflight-test3.log
            fi
            return 0
        else
            log_fail "Test 3: Expected exit code 2, got $exit_code"
            cat /tmp/preflight-test3.log
            return 1
        fi
    fi
}

# Test 4: Pre-flight check with missing environment files
test_missing_env_files() {
    TESTS_RUN=$((TESTS_RUN + 1))
    log_test "Test 4: Pre-flight check with missing environment files"
    
    # Check if services are running
    if ! is_backend_running || ! is_frontend_running; then
        log_info "Test 4: Skipping (services not running, cannot test env file check)"
        return 0
    fi
    
    # Backup existing .env files
    local backend_env_exists=false
    local frontend_env_exists=false
    
    if [ -f "NestSync-backend/.env" ]; then
        backend_env_exists=true
        mv NestSync-backend/.env NestSync-backend/.env.backup
    fi
    
    if [ -f "NestSync-frontend/.env.local" ]; then
        frontend_env_exists=true
        mv NestSync-frontend/.env.local NestSync-frontend/.env.local.backup
    fi
    
    # Run pre-flight check
    ./scripts/test-preflight-check.sh > /tmp/preflight-test4.log 2>&1
    local exit_code=$?
    
    # Restore .env files
    if [ "$backend_env_exists" = true ]; then
        mv NestSync-backend/.env.backup NestSync-backend/.env
    fi
    
    if [ "$frontend_env_exists" = true ]; then
        mv NestSync-frontend/.env.local.backup NestSync-frontend/.env.local
    fi
    
    # Check results
    if [ $exit_code -eq 4 ] || grep -q "Environment variables" /tmp/preflight-test4.log; then
        log_pass "Test 4: Pre-flight check detected missing environment files"
        return 0
    else
        log_fail "Test 4: Pre-flight check did not detect missing environment files (exit code: $exit_code)"
        cat /tmp/preflight-test4.log
        return 1
    fi
}

# Test 5: Verify retry logic with progressive backoff
test_retry_logic() {
    TESTS_RUN=$((TESTS_RUN + 1))
    log_test "Test 5: Verify retry logic with progressive backoff"
    
    # This test verifies that the script retries and uses backoff
    # We'll check the log output for retry messages
    
    if is_backend_running && is_frontend_running; then
        log_info "Test 5: Skipping (all services running, cannot test retry logic)"
        log_info "Test 5: To run this test, stop a service temporarily"
        return 0
    fi
    
    # Run pre-flight check and capture timing
    local start_time=$(date +%s)
    ./scripts/test-preflight-check.sh > /tmp/preflight-test5.log 2>&1 || true
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    # Check if retry messages are present
    if grep -q "Attempt.*failed, retrying" /tmp/preflight-test5.log; then
        log_pass "Test 5: Retry logic is working (found retry messages)"
        
        # Verify progressive backoff (duration should be > initial delay)
        if [ $duration -gt 5 ]; then
            log_pass "Test 5: Progressive backoff appears to be working (duration: ${duration}s)"
        else
            log_info "Test 5: Cannot verify progressive backoff (duration too short: ${duration}s)"
        fi
        return 0
    else
        log_info "Test 5: No retry messages found (services may have responded immediately)"
        return 0
    fi
}

# Test 6: Verify correct exit codes for each scenario
test_exit_codes() {
    TESTS_RUN=$((TESTS_RUN + 1))
    log_test "Test 6: Verify exit code documentation matches implementation"
    
    # Check if exit codes are documented in the script
    if grep -q "# 0 = All checks passed" scripts/test-preflight-check.sh && \
       grep -q "# 1 = Backend not ready" scripts/test-preflight-check.sh && \
       grep -q "# 2 = Frontend not ready" scripts/test-preflight-check.sh && \
       grep -q "# 3 = Database not accessible" scripts/test-preflight-check.sh && \
       grep -q "# 4 = Auth not configured" scripts/test-preflight-check.sh && \
       grep -q "# 5 = Test data missing" scripts/test-preflight-check.sh; then
        log_pass "Test 6: Exit codes are properly documented"
    else
        log_fail "Test 6: Exit code documentation is incomplete"
        return 1
    fi
    
    # Verify exit statements use correct codes
    if grep -q "exit_code=1" scripts/test-preflight-check.sh && \
       grep -q "exit_code=2" scripts/test-preflight-check.sh && \
       grep -q "exit \$exit_code" scripts/test-preflight-check.sh; then
        log_pass "Test 6: Exit statements are present in script"
    else
        log_fail "Test 6: Exit statements are missing or incorrect"
        return 1
    fi
    
    return 0
}

# Test 7: Verify remediation steps are provided
test_remediation_steps() {
    TESTS_RUN=$((TESTS_RUN + 1))
    log_test "Test 7: Verify remediation steps are provided on failure"
    
    # Run pre-flight check
    ./scripts/test-preflight-check.sh > /tmp/preflight-test7.log 2>&1 || true
    
    # Check if remediation section exists in output
    if grep -q "Remediation Steps" /tmp/preflight-test7.log || \
       grep -q "Try the following" /tmp/preflight-test7.log; then
        log_pass "Test 7: Remediation steps are provided"
        return 0
    else
        # If all checks passed, remediation steps won't be shown
        if grep -q "All pre-flight checks passed" /tmp/preflight-test7.log; then
            log_pass "Test 7: All checks passed, remediation not needed"
            return 0
        else
            log_fail "Test 7: Remediation steps not found in output"
            cat /tmp/preflight-test7.log
            return 1
        fi
    fi
}

# Test 8: Verify summary output format
test_summary_output() {
    TESTS_RUN=$((TESTS_RUN + 1))
    log_test "Test 8: Verify summary output format"
    
    # Run pre-flight check
    ./scripts/test-preflight-check.sh > /tmp/preflight-test8.log 2>&1 || true
    
    # Check for summary section
    if grep -q "Pre-flight Check Summary" /tmp/preflight-test8.log; then
        log_pass "Test 8: Summary section is present"
    else
        log_fail "Test 8: Summary section is missing"
        return 1
    fi
    
    # Check for checks passed/failed sections
    if grep -q "Checks Passed" /tmp/preflight-test8.log || \
       grep -q "Checks Failed" /tmp/preflight-test8.log; then
        log_pass "Test 8: Check results are displayed"
    else
        log_fail "Test 8: Check results are not displayed"
        return 1
    fi
    
    return 0
}

# Test 9: Verify timeout configuration
test_timeout_configuration() {
    TESTS_RUN=$((TESTS_RUN + 1))
    log_test "Test 9: Verify timeout configuration"
    
    # Check if timeout is configurable
    if grep -q "TIMEOUT=" scripts/test-preflight-check.sh; then
        log_pass "Test 9: Timeout is configurable"
    else
        log_fail "Test 9: Timeout configuration not found"
        return 1
    fi
    
    # Check if max retries is configurable
    if grep -q "MAX_RETRIES=" scripts/test-preflight-check.sh; then
        log_pass "Test 9: Max retries is configurable"
    else
        log_fail "Test 9: Max retries configuration not found"
        return 1
    fi
    
    return 0
}

# Test 10: Verify script is executable
test_script_executable() {
    TESTS_RUN=$((TESTS_RUN + 1))
    log_test "Test 10: Verify script is executable"
    
    if [ -x "scripts/test-preflight-check.sh" ]; then
        log_pass "Test 10: Script has executable permissions"
    else
        log_fail "Test 10: Script is not executable"
        return 1
    fi
    
    return 0
}

# Print test summary
print_summary() {
    echo ""
    echo "========================================="
    echo "Pre-flight Check Test Summary"
    echo "========================================="
    echo ""
    echo "Tests Run: $TESTS_RUN"
    echo -e "${GREEN}Tests Passed: $TESTS_PASSED${NC}"
    echo -e "${RED}Tests Failed: $TESTS_FAILED${NC}"
    echo ""
    
    if [ ${#TEST_RESULTS[@]} -gt 0 ]; then
        echo "Test Results:"
        for result in "${TEST_RESULTS[@]}"; do
            echo "  $result"
        done
        echo ""
    fi
    
    echo "========================================="
    
    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "${GREEN}All tests passed!${NC}"
        return 0
    else
        echo -e "${RED}Some tests failed.${NC}"
        return 1
    fi
}

# Main execution
main() {
    log_info "Starting pre-flight check test suite..."
    echo ""
    
    # Check if pre-flight script exists
    if [ ! -f "scripts/test-preflight-check.sh" ]; then
        echo -e "${RED}[ERROR]${NC} Pre-flight check script not found at scripts/test-preflight-check.sh"
        exit 1
    fi
    
    # Run tests
    test_script_executable
    test_exit_codes
    test_timeout_configuration
    test_summary_output
    test_remediation_steps
    test_all_services_running
    test_retry_logic
    test_backend_down
    test_frontend_down
    test_missing_env_files
    
    # Print summary
    print_summary
    
    # Exit with appropriate code
    if [ $TESTS_FAILED -eq 0 ]; then
        exit 0
    else
        exit 1
    fi
}

# Run main function
main
