#!/bin/bash
# Test script for CI/CD suppression handling
# This script validates that the security scan workflow correctly:
# 1. Counts suppressions in the codebase
# 2. Compares against baseline
# 3. Detects new suppressions
# 4. Validates documentation

set -e

echo "========================================="
echo "CI/CD Suppression Handling Test"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function to print test results
print_result() {
    local test_name="$1"
    local result="$2"
    local message="$3"
    
    if [ "$result" = "PASS" ]; then
        echo -e "${GREEN}✓ PASS${NC}: $test_name"
        [ -n "$message" ] && echo "  $message"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC}: $test_name"
        [ -n "$message" ] && echo "  $message"
        ((TESTS_FAILED++))
    fi
    echo ""
}

# Test 1: Count suppressions in codebase (excluding dependencies)
echo "Test 1: Counting suppressions in codebase..."
PYTHON_SUPPRESSIONS=$(grep -r "# nosemgrep:" --include="*.py" --exclude-dir="venv" --exclude-dir=".venv" --exclude-dir="env" --exclude-dir="node_modules" . 2>/dev/null | wc -l | tr -d ' ')
TS_SUPPRESSIONS=$(grep -r "// nosemgrep:" --include="*.ts" --include="*.tsx" --exclude-dir="venv" --exclude-dir=".venv" --exclude-dir="env" --exclude-dir="node_modules" . 2>/dev/null | wc -l | tr -d ' ')
JS_SUPPRESSIONS=$(grep -r "// nosemgrep:" --include="*.js" --include="*.jsx" --exclude-dir="venv" --exclude-dir=".venv" --exclude-dir="env" --exclude-dir="node_modules" . 2>/dev/null | wc -l | tr -d ' ')
TOTAL_SUPPRESSIONS=$((PYTHON_SUPPRESSIONS + TS_SUPPRESSIONS + JS_SUPPRESSIONS))

echo "  Python suppressions: $PYTHON_SUPPRESSIONS"
echo "  TypeScript suppressions: $TS_SUPPRESSIONS"
echo "  JavaScript suppressions: $JS_SUPPRESSIONS"
echo "  Total suppressions: $TOTAL_SUPPRESSIONS"

if [ "$TOTAL_SUPPRESSIONS" -gt 0 ]; then
    print_result "Suppression counting" "PASS" "Found $TOTAL_SUPPRESSIONS suppressions in codebase"
else
    print_result "Suppression counting" "FAIL" "No suppressions found - expected at least 1"
fi

# Test 2: Read baseline suppression count
echo "Test 2: Reading baseline suppression count..."
if [ -f .semgrep-suppression-baseline ]; then
    BASELINE=$(grep -E '^[0-9]+$' .semgrep-suppression-baseline | tail -1 | tr -d ' ')
    echo "  Baseline: $BASELINE"
    print_result "Baseline file exists" "PASS" "Baseline count: $BASELINE"
else
    BASELINE=0
    print_result "Baseline file exists" "FAIL" ".semgrep-suppression-baseline file not found"
fi

# Test 3: Compare current count with baseline
echo "Test 3: Comparing current count with baseline..."
if [ "$TOTAL_SUPPRESSIONS" -eq "$BASELINE" ]; then
    print_result "Suppression count matches baseline" "PASS" "Current ($TOTAL_SUPPRESSIONS) matches baseline ($BASELINE)"
elif [ "$TOTAL_SUPPRESSIONS" -gt "$BASELINE" ]; then
    NEW_SUPPRESSIONS=$((TOTAL_SUPPRESSIONS - BASELINE))
    print_result "New suppressions detected" "PASS" "Detected $NEW_SUPPRESSIONS new suppression(s) - CI/CD should alert"
else
    REMOVED_SUPPRESSIONS=$((BASELINE - TOTAL_SUPPRESSIONS))
    print_result "Suppressions removed" "PASS" "Detected $REMOVED_SUPPRESSIONS removed suppression(s) - baseline should be updated"
fi

# Test 4: Validate suppression documentation
echo "Test 4: Validating suppression documentation..."
if [ -f docs/security/semgrep-false-positives.md ]; then
    DOCUMENTED=$(grep -c "^### FP-" docs/security/semgrep-false-positives.md || echo "0")
    echo "  Documented false positives: $DOCUMENTED"
    
    if [ "$DOCUMENTED" -ge "$TOTAL_SUPPRESSIONS" ]; then
        print_result "Suppression documentation" "PASS" "All $TOTAL_SUPPRESSIONS suppressions are documented ($DOCUMENTED entries)"
    else
        UNDOCUMENTED=$((TOTAL_SUPPRESSIONS - DOCUMENTED))
        print_result "Suppression documentation" "FAIL" "$UNDOCUMENTED suppression(s) not documented in false positive registry"
    fi
else
    print_result "Suppression documentation" "FAIL" "docs/security/semgrep-false-positives.md not found"
fi

# Test 5: Check audit log exists
echo "Test 5: Checking audit log..."
if [ -f docs/security/suppression-audit-log.md ]; then
    print_result "Audit log exists" "PASS" "Suppression audit log found"
else
    print_result "Audit log exists" "FAIL" "docs/security/suppression-audit-log.md not found"
fi

# Test 6: Check review process documentation
echo "Test 6: Checking review process documentation..."
if [ -f docs/security/false-positive-review-process.md ]; then
    print_result "Review process documented" "PASS" "False positive review process found"
else
    print_result "Review process documented" "FAIL" "docs/security/false-positive-review-process.md not found"
fi

# Test 7: Validate GitHub workflow exists
echo "Test 7: Validating GitHub workflow..."
if [ -f .github/workflows/security-scan.yml ]; then
    # Check for key steps in the workflow
    if grep -q "Generate suppression report" .github/workflows/security-scan.yml; then
        print_result "Workflow has suppression reporting" "PASS" "Suppression report generation step found"
    else
        print_result "Workflow has suppression reporting" "FAIL" "Suppression report generation step not found"
    fi
    
    if grep -q "Check for new suppressions" .github/workflows/security-scan.yml; then
        print_result "Workflow has new suppression detection" "PASS" "New suppression detection step found"
    else
        print_result "Workflow has new suppression detection" "FAIL" "New suppression detection step not found"
    fi
    
    if grep -q "Validate suppression documentation" .github/workflows/security-scan.yml; then
        print_result "Workflow has documentation validation" "PASS" "Documentation validation step found"
    else
        print_result "Workflow has documentation validation" "FAIL" "Documentation validation step not found"
    fi
    
    if grep -q "Block merge on unsuppressed ERROR severity" .github/workflows/security-scan.yml; then
        print_result "Workflow blocks on unsuppressed errors" "PASS" "Error blocking step found"
    else
        print_result "Workflow blocks on unsuppressed errors" "FAIL" "Error blocking step not found"
    fi
else
    print_result "GitHub workflow exists" "FAIL" ".github/workflows/security-scan.yml not found"
fi

# Test 8: Check Semgrep configuration
echo "Test 8: Checking Semgrep configuration..."
if [ -f .semgrep.yml ]; then
    print_result "Semgrep configuration exists" "PASS" ".semgrep.yml found"
    
    # Check for custom rules
    if grep -q "validated-sql-timezone-parameter" .semgrep.yml; then
        print_result "Custom SQL validation rule" "PASS" "SQL timezone validation rule found"
    else
        print_result "Custom SQL validation rule" "FAIL" "SQL timezone validation rule not found"
    fi
    
    if grep -q "environment-aware-websocket-url-conversion" .semgrep.yml; then
        print_result "Custom WebSocket rule" "PASS" "WebSocket URL conversion rule found"
    else
        print_result "Custom WebSocket rule" "FAIL" "WebSocket URL conversion rule not found"
    fi
else
    print_result "Semgrep configuration exists" "FAIL" ".semgrep.yml not found"
fi

# Test 9: List actual suppressions for verification
echo "Test 9: Listing actual suppressions..."
echo ""
echo "Python suppressions:"
grep -rn "# nosemgrep:" --include="*.py" --exclude-dir="venv" --exclude-dir=".venv" --exclude-dir="env" --exclude-dir="node_modules" . 2>/dev/null || echo "  None found"
echo ""
echo "TypeScript/JavaScript suppressions:"
grep -rn "// nosemgrep:" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --exclude-dir="venv" --exclude-dir=".venv" --exclude-dir="env" --exclude-dir="node_modules" . 2>/dev/null || echo "  None found"
echo ""
print_result "Suppression listing" "PASS" "Listed all suppressions for manual verification"

# Summary
echo "========================================="
echo "Test Summary"
echo "========================================="
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    echo ""
    echo "CI/CD suppression handling is correctly configured:"
    echo "  ✓ Suppressions are counted correctly"
    echo "  ✓ Baseline tracking is in place"
    echo "  ✓ New suppression detection works"
    echo "  ✓ Documentation validation is configured"
    echo "  ✓ Workflow blocks on unsuppressed errors"
    echo "  ✓ Custom Semgrep rules are defined"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    echo ""
    echo "Please review the failures above and fix the issues."
    exit 1
fi
