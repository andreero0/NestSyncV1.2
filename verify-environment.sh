#!/bin/bash

# NestSync Environment Verification Script
# Comprehensive health check for development environment

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_header() {
    echo -e "${CYAN}=== $1 ===${NC}"
}

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Initialize counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNING_CHECKS=0

# Function to run check and track results
run_check() {
    local check_name="$1"
    local check_command="$2"
    local success_message="$3"
    local error_message="$4"
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if eval "$check_command" >/dev/null 2>&1; then
        print_success "$success_message"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        print_error "$error_message"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        return 1
    fi
}

# Function to run warning check
run_warning_check() {
    local check_name="$1"
    local check_command="$2"
    local success_message="$3"
    local warning_message="$4"
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if eval "$check_command" >/dev/null 2>&1; then
        print_success "$success_message"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        print_warning "$warning_message"
        WARNING_CHECKS=$((WARNING_CHECKS + 1))
        return 1
    fi
}

echo -e "${CYAN}"
echo "🔍 NestSync Environment Health Check"
echo "===================================="
echo -e "${NC}"

# Check if we're in the correct directory
if [ ! -f "CLAUDE-HANDOFF.md" ] || [ ! -d "NestSync-backend" ] || [ ! -d "NestSync-frontend" ]; then
    print_error "Not in NestSync project root directory"
    print_error "Expected files: CLAUDE-HANDOFF.md, NestSync-backend/, NestSync-frontend/"
    exit 1
fi

print_success "✓ Correct project directory detected"
echo ""

# 1. System Prerequisites Check
print_header "System Prerequisites"

run_check "node" "command -v node" "Node.js is installed ($(node --version))" "Node.js not found"
run_check "python" "command -v python3 || command -v python" "Python is installed" "Python not found"
run_check "git" "command -v git" "Git is installed ($(git --version | cut -d' ' -f3))" "Git not found"
run_check "expo" "command -v expo" "Expo CLI is installed ($(expo --version))" "Expo CLI not found"

echo ""

# 2. Project Structure Check
print_header "Project Structure"

run_check "backend_dir" "[ -d 'NestSync-backend' ]" "✓ Backend directory exists" "✗ NestSync-backend directory missing"
run_check "frontend_dir" "[ -d 'NestSync-frontend' ]" "✓ Frontend directory exists" "✗ NestSync-frontend directory missing"
run_check "backend_main" "[ -f 'NestSync-backend/main.py' ]" "✓ Backend main.py exists" "✗ Backend main.py missing"
run_check "frontend_package" "[ -f 'NestSync-frontend/package.json' ]" "✓ Frontend package.json exists" "✗ Frontend package.json missing"

echo ""

# 3. Environment Configuration Check
print_header "Environment Configuration"

ENV_FILE=""
if [ -f "NestSync-backend/.env.local" ]; then
    ENV_FILE="NestSync-backend/.env.local"
    print_success "✓ Using .env.local file"
elif [ -f "NestSync-backend/.env" ]; then
    ENV_FILE="NestSync-backend/.env"
    print_success "✓ Using .env file"
else
    print_error "✗ No environment file found (.env or .env.local)"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
fi

if [ -n "$ENV_FILE" ]; then
    # Check critical environment variables
    run_check "supabase_url" "grep -q 'SUPABASE_URL=' '$ENV_FILE'" "✓ SUPABASE_URL configured" "✗ SUPABASE_URL missing"
    
    # Check for SUPABASE_KEY or SUPABASE_ANON_KEY
    if grep -q 'SUPABASE_ANON_KEY=' "$ENV_FILE" || grep -q 'SUPABASE_KEY=' "$ENV_FILE"; then
        print_success "✓ Supabase API key configured"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        print_error "✗ Supabase API key missing (SUPABASE_ANON_KEY or SUPABASE_KEY)"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    run_check "supabase_service_key" "grep -q 'SUPABASE_SERVICE' '$ENV_FILE'" "✓ Supabase service key configured" "✗ Supabase service key missing"
    run_check "jwt_secret" "grep -q 'JWT_SECRET=' '$ENV_FILE'" "✓ JWT secret configured" "✗ JWT secret missing"
fi

echo ""

# 4. Backend Environment Check
print_header "Backend Environment"

cd NestSync-backend

run_check "venv_exists" "[ -d 'venv' ]" "✓ Python virtual environment exists" "✗ Python virtual environment missing"

if [ -d "venv" ]; then
    # Activate virtual environment and check dependencies
    source venv/bin/activate
    
    run_check "fastapi_installed" "python -c 'import fastapi'" "✓ FastAPI installed" "✗ FastAPI not installed"
    run_check "strawberry_installed" "python -c 'import strawberry'" "✓ Strawberry GraphQL installed" "✗ Strawberry GraphQL not installed"
    run_check "sqlalchemy_installed" "python -c 'import sqlalchemy'" "✓ SQLAlchemy installed" "✗ SQLAlchemy not installed"
    run_check "alembic_installed" "python -c 'import alembic'" "✓ Alembic installed" "✗ Alembic not installed"
    
    # Test schema loading
    run_warning_check "schema_loads" "python -c 'from app.graphql.schema import schema'" "✓ GraphQL schema loads successfully" "⚠ GraphQL schema has import issues"
    
    # Check Alembic configuration
    run_check "alembic_config" "[ -f 'alembic.ini' ]" "✓ Alembic configuration exists" "✗ Alembic configuration missing"
    run_check "alembic_versions" "[ -d 'alembic/versions' ]" "✓ Alembic versions directory exists" "✗ Alembic versions directory missing"
fi

cd ..
echo ""

# 5. Frontend Environment Check
print_header "Frontend Environment"

cd NestSync-frontend

run_check "node_modules" "[ -d 'node_modules' ]" "✓ Node modules installed" "✗ Node modules not installed (run npm install)"
run_check "expo_config" "[ -f 'app.json' ] || [ -f 'expo.json' ]" "✓ Expo configuration exists" "✗ Expo configuration missing"

# Check key dependencies
if [ -d "node_modules" ]; then
    run_check "expo_package" "[ -d 'node_modules/expo' ]" "✓ Expo package installed" "✗ Expo package missing"
    run_check "react_native" "[ -d 'node_modules/react-native' ]" "✓ React Native installed" "✗ React Native missing"
    run_check "apollo_client" "[ -d 'node_modules/@apollo/client' ]" "✓ Apollo Client installed" "✗ Apollo Client missing"
    run_check "expo_router" "[ -d 'node_modules/expo-router' ]" "✓ Expo Router installed" "✗ Expo Router missing"
fi

cd ..
echo ""

# 6. Network Connectivity Check
print_header "Network Connectivity"

print_status "Testing network connectivity..."

# Check if ports are available
if command -v lsof >/dev/null 2>&1; then
    if lsof -i :8001 >/dev/null 2>&1; then
        print_warning "⚠ Port 8001 is in use (backend might be running)"
    else
        print_success "✓ Port 8001 is available for backend"
    fi
    
    if lsof -i :8082 >/dev/null 2>&1; then
        print_warning "⚠ Port 8082 is in use (frontend might be running)"
    else
        print_success "✓ Port 8082 is available for frontend"
    fi
else
    print_warning "⚠ Cannot check port availability (lsof not available)"
fi

echo ""

# 7. Git Repository Status
print_header "Git Repository Status"

run_check "git_repo" "[ -d '.git' ]" "✓ Git repository initialized" "✗ Not a git repository"

if [ -d ".git" ]; then
    CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
    print_status "Current branch: $CURRENT_BRANCH"
    
    # Check if we're on the expected branch
    if [ "$CURRENT_BRANCH" = "feature/fixing-dashboard" ]; then
        print_success "✓ On feature branch (feature/fixing-dashboard)"
    else
        print_warning "⚠ Not on expected branch (feature/fixing-dashboard)"
    fi
    
    # Check git status
    if [ -z "$(git status --porcelain)" ]; then
        print_success "✓ Working directory clean"
    else
        print_warning "⚠ Working directory has uncommitted changes"
    fi
fi

echo ""

# 8. Available Scripts Check
print_header "Available Scripts"

SCRIPTS=(
    "start-dev-servers-work.sh:Start development servers"
    "export-env-secure.sh:Export environment variables"
    "work-setup-complete.sh:Complete work computer setup"
    "verify-environment.sh:Environment verification (this script)"
)

for script_info in "${SCRIPTS[@]}"; do
    script_name=$(echo "$script_info" | cut -d':' -f1)
    script_desc=$(echo "$script_info" | cut -d':' -f2)
    
    if [ -f "$script_name" ] && [ -x "$script_name" ]; then
        print_success "✓ $script_name ($script_desc)"
    elif [ -f "$script_name" ]; then
        print_warning "⚠ $script_name exists but not executable"
        chmod +x "$script_name" 2>/dev/null || true
    else
        print_error "✗ $script_name missing"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    fi
done

echo ""

# 9. Summary Report
print_header "Verification Summary"

echo ""
echo "📊 Results:"
echo "   Total Checks: $TOTAL_CHECKS"
print_success "   Passed: $PASSED_CHECKS"
if [ $WARNING_CHECKS -gt 0 ]; then
    print_warning "   Warnings: $WARNING_CHECKS"
fi
if [ $FAILED_CHECKS -gt 0 ]; then
    print_error "   Failed: $FAILED_CHECKS"
fi

echo ""

# Overall status
if [ $FAILED_CHECKS -eq 0 ]; then
    if [ $WARNING_CHECKS -eq 0 ]; then
        print_success "🎉 Environment is fully ready for development!"
    else
        print_warning "🔧 Environment is mostly ready (some warnings to address)"
    fi
    
    echo ""
    echo "🚀 Next Steps:"
    echo "   1. Start servers: ./start-dev-servers-work.sh"
    echo "   2. Open browser: http://localhost:8082"
    echo "   3. Test login with: parents@nestsync.com / Shazam11#"
    echo "   4. Verify backend: http://localhost:8001/graphql"
    
else
    print_error "❌ Environment has critical issues that need to be resolved"
    echo ""
    echo "🔧 Troubleshooting:"
    echo "   • Check TROUBLESHOOTING-GUIDE.md for common solutions"
    echo "   • Run ./work-setup-complete.sh to fix setup issues"
    echo "   • Ensure all prerequisites are installed"
fi

echo ""
echo "📚 Documentation:"
echo "   • CLAUDE-HANDOFF.md           - Context for Claude Code"
echo "   • WORK-COMPUTER-SETUP.md      - Setup instructions"
echo "   • TROUBLESHOOTING-GUIDE.md    - Problem solving"
echo ""

# Exit with appropriate code
if [ $FAILED_CHECKS -eq 0 ]; then
    exit 0
else
    exit 1
fi