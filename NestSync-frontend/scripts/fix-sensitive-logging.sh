#!/bin/bash

###############################################################################
# Fix Sensitive Data Logging - NestSync Frontend
# Identifies and helps remediate sensitive console.log statements
###############################################################################

set -e

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Sensitive Data Logging Remediation Tool                ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Directories to scan
SCAN_DIRS="lib components app hooks stores"

echo -e "${BLUE}[1/4]${NC} Scanning for sensitive data in console logs..."
echo ""

# Create temp file for findings
FINDINGS_FILE=$(mktemp)

# Find all console.log/error/warn statements with sensitive keywords
for dir in $SCAN_DIRS; do
    if [ -d "$dir" ]; then
        grep -rn "console\.\(log\|error\|warn\|debug\|info\)" "$dir" \
            | grep -iE "(token|password|secret|jwt|auth|credential|key|bearer|session)" \
            >> "$FINDINGS_FILE" 2>/dev/null || true
    fi
done

# Count findings
FINDING_COUNT=$(wc -l < "$FINDINGS_FILE" | tr -d ' ')

if [ "$FINDING_COUNT" -eq 0 ]; then
    echo -e "${GREEN}✅ No sensitive data logging found!${NC}"
    echo ""
    echo "Your codebase is clean. Great job!"
    rm "$FINDINGS_FILE"
    exit 0
fi

echo -e "${RED}❌ Found $FINDING_COUNT instances of potential sensitive data logging${NC}"
echo ""

# Group by file
echo -e "${YELLOW}Findings by file:${NC}"
echo "──────────────────────────────────────────────────────────"

# Get unique files
FILES=$(cut -d ':' -f 1 "$FINDINGS_FILE" | sort | uniq)

for file in $FILES; do
    file_count=$(grep -c "^$file:" "$FINDINGS_FILE")
    echo -e "${RED}  ⚠  $file${NC} (${file_count} issues)"
done

echo ""

# Show detailed findings
echo -e "${BLUE}[2/4]${NC} Detailed findings:"
echo "──────────────────────────────────────────────────────────"
echo ""

cat "$FINDINGS_FILE" | while IFS= read -r line; do
    # Parse file, line number, and content
    file=$(echo "$line" | cut -d ':' -f 1)
    line_num=$(echo "$line" | cut -d ':' -f 2)
    content=$(echo "$line" | cut -d ':' -f 3-)

    echo -e "${YELLOW}📍 $file:$line_num${NC}"
    echo -e "   ${RED}$content${NC}"
    echo ""
done

# Provide fix recommendations
echo -e "${BLUE}[3/4]${NC} Remediation recommendations:"
echo "──────────────────────────────────────────────────────────"
echo ""

echo -e "${GREEN}Step 1: Create secure logger utility${NC}"
echo ""
echo "Create file: lib/utils/secureLogger.ts"
echo ""
cat << 'EOF'
/**
 * Secure Logger - Prevents sensitive data exposure
 * Use instead of console.log for all logging
 */

const SENSITIVE_KEYWORDS = [
  'token', 'password', 'secret', 'jwt', 'authorization',
  'bearer', 'api_key', 'apikey', 'auth', 'credential',
  'session', 'cookie', 'key', 'private', 'refresh'
];

function sanitizeData(data: any): any {
  if (data === null || data === undefined) return data;
  if (typeof data !== 'object') return data;

  const sanitized: any = Array.isArray(data) ? [] : {};

  for (const [key, value] of Object.entries(data)) {
    // Redact sensitive keys
    if (SENSITIVE_KEYWORDS.some(k => key.toLowerCase().includes(k))) {
      sanitized[key] = '[REDACTED]';
      continue;
    }

    // Redact JWT patterns
    if (typeof value === 'string' && /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/.test(value)) {
      sanitized[key] = '[REDACTED_JWT]';
      continue;
    }

    sanitized[key] = typeof value === 'object' ? sanitizeData(value) : value;
  }

  return sanitized;
}

export const secureLog = {
  info: (message: string, data?: any) => {
    if (__DEV__) {
      console.info(`[INFO] ${message}`, data ? sanitizeData(data) : '');
    }
  },

  warn: (message: string, data?: any) => {
    if (__DEV__) {
      console.warn(`[WARN] ${message}`, data ? sanitizeData(data) : '');
    }
  },

  error: (message: string, error?: any) => {
    const sanitized = error instanceof Error
      ? { message: error.message, stack: error.stack }
      : sanitizeData(error);
    console.error(`[ERROR] ${message}`, sanitized);
  }
};

export default secureLog;
EOF

echo ""
echo -e "${GREEN}Step 2: Replace console.log with secureLog${NC}"
echo ""
echo "Example transformations:"
echo ""
echo -e "${RED}Before:${NC}"
echo "  console.log('Access token:', accessToken);"
echo ""
echo -e "${GREEN}After:${NC}"
echo "  import { secureLog } from '@/lib/utils/secureLogger';"
echo "  secureLog.info('Token validated', { hasToken: !!accessToken });"
echo ""

echo -e "${GREEN}Step 3: Add ESLint rule to prevent future issues${NC}"
echo ""
echo "Add to .eslintrc.js:"
echo ""
cat << 'EOF'
{
  "rules": {
    "no-console": ["warn", { "allow": ["error"] }],
    "no-restricted-syntax": [
      "error",
      {
        "selector": "CallExpression[callee.object.name='console'] > Literal[value=/(token|password|secret)/i]",
        "message": "Do not log sensitive data. Use secureLog utility."
      }
    ]
  }
}
EOF

echo ""

# Generate fix script
echo -e "${BLUE}[4/4]${NC} Generating automated fix script..."
echo ""

FIX_SCRIPT=$(mktemp)

cat > "$FIX_SCRIPT" << 'SCRIPT_END'
#!/bin/bash

# Auto-fix sensitive logging (with manual review required)

echo "This script will help you fix sensitive logging issues."
echo "Each file will be opened for manual review and fixing."
echo ""

FILES_TO_FIX="FILES_PLACEHOLDER"

for file in $FILES_TO_FIX; do
    echo "Opening: $file"
    echo "Look for lines marked with TODO_FIX_LOGGING"
    echo ""
    read -p "Press Enter to open in editor..."

    # Open in default editor
    ${EDITOR:-nano} "$file"

    read -p "Fixed? (y/n) " fixed
    if [ "$fixed" = "y" ]; then
        echo "✓ Marked as fixed"
    fi
    echo ""
done

echo "All files reviewed!"
SCRIPT_END

# Replace placeholder with actual files
FILES_LIST=$(echo "$FILES" | tr '\n' ' ')
sed -i "s|FILES_PLACEHOLDER|$FILES_LIST|g" "$FIX_SCRIPT"

chmod +x "$FIX_SCRIPT"

echo -e "${GREEN}Created automated fix script: $FIX_SCRIPT${NC}"
echo ""

# Summary and next steps
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    Next Steps                               ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo "1. Create the secureLogger utility:"
echo "   mkdir -p lib/utils"
echo "   # Copy the code above to lib/utils/secureLogger.ts"
echo ""

echo "2. Review each affected file and update logging:"
echo "   Files to fix:"
for file in $FILES; do
    echo "     - $file"
done
echo ""

echo "3. Common fixes:"
echo "   • Replace: console.log('Token:', token)"
echo "     With:    secureLog.info('Token check', { hasToken: !!token })"
echo ""
echo "   • Replace: console.log('Auth:', { token, user })"
echo "     With:    secureLog.info('Auth state', { hasToken: !!token, userId: user?.id })"
echo ""

echo "4. Add ESLint rule to prevent regressions"
echo ""

echo "5. Test your changes:"
echo "   npm run lint"
echo "   npm test"
echo ""

echo "6. Rerun this script to verify all issues are fixed:"
echo "   ./scripts/fix-sensitive-logging.sh"
echo ""

# Offer to create PR checklist
echo -e "${YELLOW}Would you like to create a PR checklist? (y/n)${NC}"
read -r create_checklist

if [ "$create_checklist" = "y" ]; then
    CHECKLIST_FILE="SECURITY_FIX_CHECKLIST.md"

    cat > "$CHECKLIST_FILE" << EOF
# Security Fix: Remove Sensitive Data Logging

## Issue
$FINDING_COUNT instances of sensitive data being logged to console.

## Files Affected
$(for file in $FILES; do echo "- [ ] $file"; done)

## Checklist

### Implementation
- [ ] Created \`lib/utils/secureLogger.ts\`
- [ ] Replaced all console.log with secureLog in affected files
- [ ] Added ESLint rule to prevent future issues
- [ ] All files reviewed and updated

### Testing
- [ ] Ran \`npm run lint\` - no warnings
- [ ] Tested in development mode - no sensitive data in console
- [ ] Tested in production build - logging disabled
- [ ] Verified authentication flows still work

### Code Review
- [ ] No raw tokens in logs
- [ ] No passwords in logs
- [ ] No API keys in logs
- [ ] Only metadata logged (hasToken, length, etc.)

### Documentation
- [ ] Updated CLAUDE.md if needed
- [ ] Added comments explaining secure logging pattern
- [ ] Team notified of new logging utility

### Verification
- [ ] Reran \`./scripts/fix-sensitive-logging.sh\` - 0 issues
- [ ] Security audit passes
- [ ] PIPEDA compliance verified

## Notes
Original findings: $FINDING_COUNT instances
Files affected: $(echo "$FILES" | wc -l)

Relates to: CRIT-001 in PENETRATION_TEST_REPORT.md
EOF

    echo -e "${GREEN}✅ Created $CHECKLIST_FILE${NC}"
    echo "   Use this for tracking your fixes and PR review"
fi

echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: These fixes are required before production deployment${NC}"
echo -e "${YELLOW}    This is a CRITICAL security vulnerability (CRIT-001)${NC}"
echo ""

# Cleanup
rm "$FINDINGS_FILE"

exit 1  # Exit with error code since issues were found
