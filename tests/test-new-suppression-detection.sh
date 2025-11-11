#!/bin/bash
# Test script to simulate new suppression detection
# This creates a temporary suppression and verifies CI/CD would detect it

set -e

echo "========================================="
echo "New Suppression Detection Test"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create a temporary test file with a suppression
TEST_FILE="test-suppression-temp.py"
echo "Creating temporary test file with suppression..."
cat > "$TEST_FILE" << 'EOF'
# Test file to simulate new suppression
def test_function():
    # nosemgrep: python.lang.security.test-rule
    # This is a test suppression
    pass
EOF

echo "Test file created: $TEST_FILE"
echo ""

# Count suppressions (simulating CI/CD step)
echo "Counting suppressions..."
PYTHON_SUPPRESSIONS=$(grep -r "# nosemgrep:" --include="*.py" --exclude-dir="venv" --exclude-dir=".venv" --exclude-dir="env" --exclude-dir="node_modules" . 2>/dev/null | wc -l | tr -d ' ')
TS_SUPPRESSIONS=$(grep -r "// nosemgrep:" --include="*.ts" --include="*.tsx" --exclude-dir="venv" --exclude-dir=".venv" --exclude-dir="env" --exclude-dir="node_modules" . 2>/dev/null | wc -l | tr -d ' ')
JS_SUPPRESSIONS=$(grep -r "// nosemgrep:" --include="*.js" --include="*.jsx" --exclude-dir="venv" --exclude-dir=".venv" --exclude-dir="env" --exclude-dir="node_modules" . 2>/dev/null | wc -l | tr -d ' ')
TOTAL_SUPPRESSIONS=$((PYTHON_SUPPRESSIONS + TS_SUPPRESSIONS + JS_SUPPRESSIONS))

echo "  Total suppressions found: $TOTAL_SUPPRESSIONS"

# Read baseline
BASELINE=$(grep -E '^[0-9]+$' .semgrep-suppression-baseline | tail -1 | tr -d ' ')
echo "  Baseline: $BASELINE"
echo ""

# Check if new suppression was detected
if [ "$TOTAL_SUPPRESSIONS" -gt "$BASELINE" ]; then
    NEW_SUPPRESSIONS=$((TOTAL_SUPPRESSIONS - BASELINE))
    echo -e "${GREEN}✓ SUCCESS${NC}: New suppression detected!"
    echo "  New suppressions: $NEW_SUPPRESSIONS"
    echo ""
    echo "CI/CD would:"
    echo "  1. Alert with warning message"
    echo "  2. Require documentation in docs/security/semgrep-false-positives.md"
    echo "  3. Require audit log entry in docs/security/suppression-audit-log.md"
    echo "  4. Require baseline update in .semgrep-suppression-baseline"
    echo ""
    RESULT=0
else
    echo -e "${RED}✗ FAILURE${NC}: New suppression not detected"
    echo "  Expected count > $BASELINE, got $TOTAL_SUPPRESSIONS"
    RESULT=1
fi

# Cleanup
echo "Cleaning up test file..."
rm -f "$TEST_FILE"
echo "Test file removed"
echo ""

if [ $RESULT -eq 0 ]; then
    echo -e "${GREEN}✓ Test passed: CI/CD would correctly detect new suppressions${NC}"
else
    echo -e "${RED}✗ Test failed: CI/CD would not detect new suppressions${NC}"
fi

exit $RESULT
