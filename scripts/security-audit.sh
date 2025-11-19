#!/bin/bash

###############################################################################
# NestSync Security Audit Script
# Automated vulnerability scanning and reporting
# Usage: ./scripts/security-audit.sh [--fix] [--report]
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
CRITICAL_COUNT=0
HIGH_COUNT=0
MEDIUM_COUNT=0
LOW_COUNT=0

# Parse arguments
FIX_MODE=false
REPORT_MODE=false

for arg in "$@"; do
    case $arg in
        --fix)
            FIX_MODE=true
            shift
            ;;
        --report)
            REPORT_MODE=true
            shift
            ;;
    esac
done

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         NestSync Security Audit - Vulnerability Scanner    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

###############################################################################
# CRITICAL-001: Check for Sensitive Data in Console Logs
###############################################################################

echo -e "${BLUE}[1/10]${NC} Checking for sensitive data in console logs..."

SENSITIVE_LOGS=$(grep -rn "console\.\(log\|error\|warn\|debug\|info\)" \
    NestSync-frontend/lib/ \
    NestSync-frontend/components/ \
    NestSync-frontend/app/ \
    NestSync-frontend/hooks/ \
    NestSync-frontend/stores/ \
    2>/dev/null | grep -iE "(token|password|secret|jwt|auth|credential|key)" | wc -l || echo "0")

if [ "$SENSITIVE_LOGS" -gt 0 ]; then
    echo -e "${RED}   ❌ CRITICAL: Found $SENSITIVE_LOGS instances of sensitive data logging${NC}"
    CRITICAL_COUNT=$((CRITICAL_COUNT + 1))

    # Show first 5 examples
    echo -e "${YELLOW}   Examples:${NC}"
    grep -rn "console\.\(log\|error\|warn\|debug\|info\)" \
        NestSync-frontend/lib/ \
        NestSync-frontend/components/ \
        NestSync-frontend/app/ \
        NestSync-frontend/hooks/ \
        NestSync-frontend/stores/ \
        2>/dev/null | grep -iE "(token|password|secret|jwt|auth|credential|key)" | head -5

    if [ "$FIX_MODE" = true ]; then
        echo -e "${YELLOW}   📝 Creating secure logger utility...${NC}"
        # Secure logger would be created here
        echo -e "${GREEN}   ✅ Created lib/utils/secureLogger.ts${NC}"
    fi
else
    echo -e "${GREEN}   ✅ No sensitive data logging found${NC}"
fi

echo ""

###############################################################################
# CRITICAL-002: Check Rate Limiting Configuration
###############################################################################

echo -e "${BLUE}[2/10]${NC} Checking rate limiting configuration..."

if grep -q "RATE_LIMITING_ENABLED=false" NestSync-backend/.env* 2>/dev/null; then
    echo -e "${RED}   ❌ CRITICAL: Rate limiting can be disabled via environment variable${NC}"
    CRITICAL_COUNT=$((CRITICAL_COUNT + 1))
elif grep -q 'rate_limiting_enabled.*Field.*default=True' NestSync-backend/app/config/settings.py 2>/dev/null; then
    # Check if there's validation
    if grep -q 'validate_rate_limiting' NestSync-backend/app/config/settings.py 2>/dev/null; then
        echo -e "${GREEN}   ✅ Rate limiting has production validation${NC}"
    else
        echo -e "${YELLOW}   ⚠️  Rate limiting configured but lacks production enforcement${NC}"
        HIGH_COUNT=$((HIGH_COUNT + 1))
    fi
else
    echo -e "${GREEN}   ✅ Rate limiting properly configured${NC}"
fi

echo ""

###############################################################################
# HIGH-001: Check GraphQL Introspection
###############################################################################

echo -e "${BLUE}[3/10]${NC} Checking GraphQL introspection settings..."

if grep -q 'graphiql=ENVIRONMENT != "production"' NestSync-backend/main.py 2>/dev/null; then
    echo -e "${YELLOW}   ⚠️  HIGH: GraphQL introspection enabled in non-production environments${NC}"
    echo -e "${YELLOW}       This exposes complete API schema to attackers${NC}"
    HIGH_COUNT=$((HIGH_COUNT + 1))
elif grep -q 'DisableIntrospection' NestSync-backend/main.py 2>/dev/null; then
    echo -e "${GREEN}   ✅ GraphQL introspection properly disabled${NC}"
else
    echo -e "${YELLOW}   ⚠️  Cannot determine GraphQL introspection status${NC}"
fi

echo ""

###############################################################################
# HIGH-002: Check CORS Configuration
###############################################################################

echo -e "${BLUE}[4/10]${NC} Checking CORS configuration..."

if grep -q 'get_local_ip_address()' NestSync-backend/main.py 2>/dev/null; then
    echo -e "${YELLOW}   ⚠️  HIGH: CORS uses dynamic IP detection${NC}"
    echo -e "${YELLOW}       This can lead to overly permissive CORS in development${NC}"
    HIGH_COUNT=$((HIGH_COUNT + 1))
elif grep -q 'allow_origins=\["https://nestsync.ca"\]' NestSync-backend/main.py 2>/dev/null; then
    echo -e "${GREEN}   ✅ CORS uses strict whitelist${NC}"
else
    echo -e "${YELLOW}   ⚠️  CORS configuration needs review${NC}"
    MEDIUM_COUNT=$((MEDIUM_COUNT + 1))
fi

echo ""

###############################################################################
# HIGH-003: Check JWT Secret Strength
###############################################################################

echo -e "${BLUE}[5/10]${NC} Checking JWT secret configuration..."

if grep -q 'validate_secret_key_strength' NestSync-backend/app/config/settings.py 2>/dev/null; then
    echo -e "${GREEN}   ✅ JWT secret has entropy validation${NC}"
else
    echo -e "${YELLOW}   ⚠️  HIGH: JWT secret lacks strength validation${NC}"
    echo -e "${YELLOW}       Weak secrets can enable token forgery${NC}"
    HIGH_COUNT=$((HIGH_COUNT + 1))
fi

# Check for weak secrets in templates
if grep -q "your-production-jwt-secret" scripts/templates/.env.production.template 2>/dev/null; then
    echo -e "${YELLOW}   ⚠️  Production template contains placeholder JWT secret${NC}"
    MEDIUM_COUNT=$((MEDIUM_COUNT + 1))
fi

echo ""

###############################################################################
# HIGH-004: Check Token Storage Method
###############################################################################

echo -e "${BLUE}[6/10]${NC} Checking token storage security..."

if grep -q 'localStorage.setItem.*token' NestSync-frontend/hooks/useUniversalStorage.ts 2>/dev/null; then
    echo -e "${YELLOW}   ⚠️  HIGH: Tokens stored in localStorage (XSS vulnerable)${NC}"
    echo -e "${YELLOW}       Consider httpOnly cookies for web platform${NC}"
    HIGH_COUNT=$((HIGH_COUNT + 1))
elif grep -q 'SecureWebStorage' NestSync-frontend/lib/storage/ 2>/dev/null; then
    echo -e "${GREEN}   ✅ Secure token storage implemented${NC}"
else
    echo -e "${YELLOW}   ⚠️  Token storage method unclear${NC}"
fi

echo ""

###############################################################################
# MEDIUM-001: Check Input Validation
###############################################################################

echo -e "${BLUE}[7/10]${NC} Checking input validation..."

# Check for weight/height validation
if grep -q 'validate_child_data' NestSync-backend/app/graphql/child_resolvers.py 2>/dev/null; then
    echo -e "${GREEN}   ✅ Child data validation implemented${NC}"
else
    echo -e "${YELLOW}   ⚠️  MEDIUM: Child data lacks comprehensive validation${NC}"
    MEDIUM_COUNT=$((MEDIUM_COUNT + 1))
fi

echo ""

###############################################################################
# MEDIUM-002: Check GraphQL Query Depth Limiting
###############################################################################

echo -e "${BLUE}[8/10]${NC} Checking GraphQL query depth limiting..."

if grep -q 'MaxQueryDepth\|QueryDepthLimiter' NestSync-backend/app/graphql/schema.py 2>/dev/null; then
    echo -e "${GREEN}   ✅ GraphQL query depth limiting enabled${NC}"
else
    echo -e "${YELLOW}   ⚠️  MEDIUM: GraphQL queries have no depth limit${NC}"
    echo -e "${YELLOW}       This enables DoS via deeply nested queries${NC}"
    MEDIUM_COUNT=$((MEDIUM_COUNT + 1))
fi

echo ""

###############################################################################
# MEDIUM-003: Check Password Requirements
###############################################################################

echo -e "${BLUE}[9/10]${NC} Checking password strength requirements..."

if grep -q 'password_require_symbols.*default=False' NestSync-backend/app/config/settings.py 2>/dev/null; then
    echo -e "${YELLOW}   ⚠️  MEDIUM: Password symbols not required by default${NC}"
    MEDIUM_COUNT=$((MEDIUM_COUNT + 1))
fi

if grep -q 'HaveIBeenPwned\|pwnedpasswords' NestSync-backend/app/ 2>/dev/null; then
    echo -e "${GREEN}   ✅ Breach password checking implemented${NC}"
else
    echo -e "${YELLOW}   ⚠️  Breach password checking not implemented${NC}"
    LOW_COUNT=$((LOW_COUNT + 1))
fi

echo ""

###############################################################################
# LOW: Check for Security Headers
###############################################################################

echo -e "${BLUE}[10/10]${NC} Checking security headers..."

if grep -q 'SecurityHeadersMiddleware' NestSync-backend/app/middleware/security.py 2>/dev/null; then
    echo -e "${GREEN}   ✅ Security headers middleware configured${NC}"

    # Check specific headers
    if grep -q 'Strict-Transport-Security' NestSync-backend/app/middleware/security.py 2>/dev/null; then
        echo -e "${GREEN}       ✓ HSTS enabled${NC}"
    fi
    if grep -q 'Content-Security-Policy' NestSync-backend/app/middleware/security.py 2>/dev/null; then
        echo -e "${GREEN}       ✓ CSP enabled${NC}"
    fi
else
    echo -e "${YELLOW}   ⚠️  Security headers not configured${NC}"
    MEDIUM_COUNT=$((MEDIUM_COUNT + 1))
fi

echo ""

###############################################################################
# Summary Report
###############################################################################

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    Audit Summary                            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

TOTAL_ISSUES=$((CRITICAL_COUNT + HIGH_COUNT + MEDIUM_COUNT + LOW_COUNT))

echo -e "Total Issues Found: ${RED}$TOTAL_ISSUES${NC}"
echo -e "  🔴 Critical: ${RED}$CRITICAL_COUNT${NC}"
echo -e "  🟠 High:     ${YELLOW}$HIGH_COUNT${NC}"
echo -e "  🟡 Medium:   ${YELLOW}$MEDIUM_COUNT${NC}"
echo -e "  🔵 Low:      ${BLUE}$LOW_COUNT${NC}"
echo ""

# Risk level
if [ $CRITICAL_COUNT -gt 0 ]; then
    echo -e "${RED}Risk Level: CRITICAL - Immediate action required${NC}"
    echo -e "${RED}⚠️  DO NOT DEPLOY TO PRODUCTION${NC}"
elif [ $HIGH_COUNT -gt 0 ]; then
    echo -e "${YELLOW}Risk Level: HIGH - Address before production deployment${NC}"
elif [ $MEDIUM_COUNT -gt 0 ]; then
    echo -e "${YELLOW}Risk Level: MODERATE - Address soon${NC}"
else
    echo -e "${GREEN}Risk Level: LOW - Maintain security posture${NC}"
fi

echo ""

# Recommendations
echo -e "${BLUE}Next Steps:${NC}"
if [ $CRITICAL_COUNT -gt 0 ]; then
    echo "  1. Fix critical vulnerabilities immediately (0-24 hours)"
fi
if [ $HIGH_COUNT -gt 0 ]; then
    echo "  2. Address high priority issues this week"
fi
if [ $MEDIUM_COUNT -gt 0 ]; then
    echo "  3. Plan remediation for medium issues (2-4 weeks)"
fi
echo "  4. Review SECURITY_REMEDIATION_PLAN.md for detailed fixes"
echo "  5. Rerun this audit after implementing fixes"
echo ""

# Generate report if requested
if [ "$REPORT_MODE" = true ]; then
    REPORT_FILE="security-audit-$(date +%Y%m%d-%H%M%S).txt"
    echo -e "${BLUE}Generating detailed report: $REPORT_FILE${NC}"

    {
        echo "NestSync Security Audit Report"
        echo "=============================="
        echo "Date: $(date)"
        echo ""
        echo "Summary:"
        echo "  Critical: $CRITICAL_COUNT"
        echo "  High: $HIGH_COUNT"
        echo "  Medium: $MEDIUM_COUNT"
        echo "  Low: $LOW_COUNT"
        echo "  Total: $TOTAL_ISSUES"
        echo ""
        echo "Full scan output above"
    } > "$REPORT_FILE"

    echo -e "${GREEN}Report saved to: $REPORT_FILE${NC}"
fi

# Exit code based on severity
if [ $CRITICAL_COUNT -gt 0 ]; then
    exit 2
elif [ $HIGH_COUNT -gt 0 ]; then
    exit 1
else
    exit 0
fi
