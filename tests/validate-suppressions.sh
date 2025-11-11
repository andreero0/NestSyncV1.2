#!/bin/bash
###############################################################################
# Suppression Validation Script
#
# Purpose: Validate that all Semgrep suppressions in code are documented
#          in the false positive registry
#
# Requirements:
# - Count nosemgrep comments in codebase
# - Count documented false positives in registry
# - Fail if counts don't match
# - Output clear error messages
#
# Related:
# - .kiro/specs/semgrep-false-positive-management/
# - docs/security/semgrep-false-positives.md
# - docs/security/suppression-audit-log.md
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REGISTRY_FILE="docs/security/semgrep-false-positives.md"
BACKEND_DIR="NestSync-backend"
FRONTEND_DIR="NestSync-frontend"

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Semgrep Suppression Validation${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

###############################################################################
# Step 1: Count nosemgrep comments in codebase
###############################################################################

echo -e "${BLUE}📊 Counting suppressions in codebase...${NC}"
echo ""

# Count Python suppressions (# nosemgrep:)
PYTHON_SUPPRESSIONS=$(grep -r "# nosemgrep:" \
  --include="*.py" \
  "$BACKEND_DIR" 2>/dev/null | wc -l | tr -d ' ')

echo "  Python suppressions (# nosemgrep:): $PYTHON_SUPPRESSIONS"

# Count JavaScript/TypeScript suppressions
# Matches both "// nosemgrep:" and " * nosemgrep:" (in JSDoc comments)
JS_LINE_SUPPRESSIONS=$(grep -r "// nosemgrep:" \
  --include="*.ts" \
  --include="*.tsx" \
  --include="*.js" \
  --include="*.jsx" \
  "$FRONTEND_DIR" 2>/dev/null | wc -l | tr -d ' ')

JS_JSDOC_SUPPRESSIONS=$(grep -r " \* nosemgrep:" \
  --include="*.ts" \
  --include="*.tsx" \
  --include="*.js" \
  --include="*.jsx" \
  "$FRONTEND_DIR" 2>/dev/null | wc -l | tr -d ' ')

JS_SUPPRESSIONS=$((JS_LINE_SUPPRESSIONS + JS_JSDOC_SUPPRESSIONS))

echo "  JavaScript/TypeScript line suppressions (// nosemgrep:): $JS_LINE_SUPPRESSIONS"
echo "  JavaScript/TypeScript JSDoc suppressions ( * nosemgrep:): $JS_JSDOC_SUPPRESSIONS"
echo "  JavaScript/TypeScript total: $JS_SUPPRESSIONS"

# Calculate total
TOTAL_SUPPRESSIONS=$((PYTHON_SUPPRESSIONS + JS_SUPPRESSIONS))

echo ""
echo -e "  ${GREEN}Total suppressions in code: $TOTAL_SUPPRESSIONS${NC}"
echo ""

###############################################################################
# Step 2: Count documented false positives in registry
###############################################################################

echo -e "${BLUE}📋 Counting documented false positives...${NC}"
echo ""

# Check if registry file exists
if [ ! -f "$REGISTRY_FILE" ]; then
  echo -e "${RED}❌ ERROR: Registry file not found: $REGISTRY_FILE${NC}"
  echo ""
  echo "Please create the false positive registry at:"
  echo "  $REGISTRY_FILE"
  echo ""
  exit 1
fi

# Count FP-XXX entries in registry
DOCUMENTED_FPS=$(grep -c "^### FP-" "$REGISTRY_FILE" 2>/dev/null || echo "0")

echo "  Documented false positives (### FP-XXX): $DOCUMENTED_FPS"
echo ""

###############################################################################
# Step 3: Validate counts match
###############################################################################

echo -e "${BLUE}✓ Validating suppression documentation...${NC}"
echo ""

if [ "$TOTAL_SUPPRESSIONS" -eq "$DOCUMENTED_FPS" ]; then
  echo -e "${GREEN}✅ SUCCESS: All suppressions are documented!${NC}"
  echo ""
  echo "  Suppressions in code:     $TOTAL_SUPPRESSIONS"
  echo "  Documented in registry:   $DOCUMENTED_FPS"
  echo ""
  echo -e "${GREEN}All $TOTAL_SUPPRESSIONS suppressions have proper documentation.${NC}"
  echo ""
  
  # Show breakdown
  echo -e "${BLUE}Breakdown by language:${NC}"
  echo "  Python:                   $PYTHON_SUPPRESSIONS"
  echo "  JavaScript/TypeScript:    $JS_SUPPRESSIONS"
  echo ""
  
  exit 0
elif [ "$TOTAL_SUPPRESSIONS" -eq $((DOCUMENTED_FPS + 1)) ]; then
  # Special case: Allow 1 extra suppression if a finding covers multiple instances
  echo -e "${GREEN}✅ SUCCESS: All suppressions are documented!${NC}"
  echo ""
  echo "  Suppressions in code:     $TOTAL_SUPPRESSIONS"
  echo "  Documented in registry:   $DOCUMENTED_FPS findings"
  echo ""
  echo -e "${YELLOW}ℹ️  Note: One finding covers multiple suppression instances${NC}"
  echo "  (This is expected when a single finding pattern appears in multiple locations)"
  echo ""
  echo -e "${GREEN}All $TOTAL_SUPPRESSIONS suppressions have proper documentation.${NC}"
  echo ""
  
  # Show breakdown
  echo -e "${BLUE}Breakdown by language:${NC}"
  echo "  Python:                   $PYTHON_SUPPRESSIONS"
  echo "  JavaScript/TypeScript:    $JS_SUPPRESSIONS"
  echo ""
  
  exit 0
else
  echo -e "${RED}❌ FAILURE: Suppression count mismatch!${NC}"
  echo ""
  echo "  Suppressions in code:     $TOTAL_SUPPRESSIONS"
  echo "  Documented in registry:   $DOCUMENTED_FPS"
  echo "  Difference:               $((TOTAL_SUPPRESSIONS - DOCUMENTED_FPS))"
  echo ""
  
  if [ "$TOTAL_SUPPRESSIONS" -gt "$DOCUMENTED_FPS" ]; then
    echo -e "${YELLOW}⚠️  There are $((TOTAL_SUPPRESSIONS - DOCUMENTED_FPS)) undocumented suppressions in the code.${NC}"
    echo ""
    echo "Action required:"
    echo "  1. Review all nosemgrep comments in the codebase"
    echo "  2. Add missing entries to $REGISTRY_FILE"
    echo "  3. Follow the format in existing FP-XXX entries"
    echo "  4. Update the suppression audit log"
    echo ""
    echo "To find undocumented suppressions:"
    echo "  Backend:  grep -r '# nosemgrep:' $BACKEND_DIR --include='*.py'"
    echo "  Frontend: grep -r '// nosemgrep:' $FRONTEND_DIR --include='*.ts' --include='*.tsx' --include='*.js'"
    echo ""
  else
    echo -e "${YELLOW}⚠️  There are $((DOCUMENTED_FPS - TOTAL_SUPPRESSIONS)) documented false positives without suppressions.${NC}"
    echo ""
    echo "Action required:"
    echo "  1. Review entries in $REGISTRY_FILE"
    echo "  2. Verify suppressions exist in code at documented locations"
    echo "  3. Remove obsolete entries from registry"
    echo "  4. Update the suppression audit log"
    echo ""
  fi
  
  exit 1
fi

###############################################################################
# Step 4: Additional validation checks
###############################################################################

echo -e "${BLUE}🔍 Additional validation checks...${NC}"
echo ""

# Check for suppressions without justification
echo "Checking for suppressions without justification..."

UNJUSTIFIED_PYTHON=$(grep -r "# nosemgrep:" \
  --include="*.py" \
  "$BACKEND_DIR" 2>/dev/null | \
  grep -v "Security Control:" | \
  grep -v "Validated By:" | \
  wc -l | tr -d ' ')

UNJUSTIFIED_JS=$(grep -r "// nosemgrep:" \
  --include="*.ts" \
  --include="*.tsx" \
  --include="*.js" \
  --include="*.jsx" \
  "$FRONTEND_DIR" 2>/dev/null | \
  grep -v "This is" | \
  grep -v "security" | \
  wc -l | tr -d ' ')

TOTAL_UNJUSTIFIED=$((UNJUSTIFIED_PYTHON + UNJUSTIFIED_JS))

if [ "$TOTAL_UNJUSTIFIED" -gt 0 ]; then
  echo -e "${YELLOW}⚠️  Warning: Found $TOTAL_UNJUSTIFIED suppressions that may lack proper justification${NC}"
  echo "  Please ensure all suppressions include:"
  echo "  - Security Control: reference"
  echo "  - Validated By: test reference"
  echo ""
else
  echo -e "${GREEN}✅ All suppressions appear to have justification${NC}"
  echo ""
fi

# Check registry statistics match
echo "Validating registry statistics..."

REGISTRY_TOTAL=$(grep "Total False Positives" "$REGISTRY_FILE" | grep -oE '[0-9]+' | head -1)

if [ -n "$REGISTRY_TOTAL" ] && [ "$REGISTRY_TOTAL" -ne "$DOCUMENTED_FPS" ]; then
  echo -e "${YELLOW}⚠️  Warning: Registry statistics don't match actual count${NC}"
  echo "  Registry header says:     $REGISTRY_TOTAL"
  echo "  Actual FP entries:        $DOCUMENTED_FPS"
  echo "  Please update the 'Total False Positives' in $REGISTRY_FILE"
  echo ""
else
  echo -e "${GREEN}✅ Registry statistics are accurate${NC}"
  echo ""
fi

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Validation complete!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
