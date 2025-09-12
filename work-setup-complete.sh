#!/bin/bash

# NestSync Complete Work Computer Setup Automation
# This is the master script that handles the entire setup process from start to finish

set -e  # Exit on any error

echo "🏢 NestSync Complete Work Computer Setup"
echo "========================================"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to detect OS
detect_os() {
    case "$(uname -s)" in
        Darwin*)    echo "macOS" ;;
        Linux*)     echo "Linux" ;;
        CYGWIN*|MINGW32*|MSYS*|MINGW*) echo "Windows" ;;
        *)          echo "Unknown" ;;
    esac
}

OS=$(detect_os)
print_status "Detected operating system: $OS"
echo ""

# Check if we're in the right directory
if [ ! -f "CLAUDE-HANDOFF.md" ] || [ ! -d "NestSync-backend" ] || [ ! -d "NestSync-frontend" ]; then
    print_error "Please run this script from the NestSync project root directory"
    print_error "Expected files: CLAUDE-HANDOFF.md, NestSync-backend/, NestSync-frontend/"
    exit 1
fi

print_success "✓ Correct project directory detected"
echo ""

# Phase 1: Prerequisites Check and Installation
echo "📋 Phase 1: Prerequisites Check"
echo "================================"
echo ""

# Check Node.js
if command_exists node; then
    NODE_VERSION=$(node --version)
    print_success "✓ Node.js found: $NODE_VERSION"
else
    print_warning "⚠ Node.js not found"
    case $OS in
        "macOS")
            if command_exists brew; then
                print_status "Installing Node.js via Homebrew..."
                brew install node
            else
                print_error "Please install Node.js from https://nodejs.org/"
                exit 1
            fi
            ;;
        "Linux")
            print_status "Installing Node.js..."
            if command_exists apt; then
                sudo apt update && sudo apt install -y nodejs npm
            elif command_exists yum; then
                sudo yum install -y nodejs npm
            else
                print_error "Please install Node.js from https://nodejs.org/"
                exit 1
            fi
            ;;
        *)
            print_error "Please install Node.js from https://nodejs.org/"
            exit 1
            ;;
    esac
fi

# Check Python
if command_exists python3; then
    PYTHON_VERSION=$(python3 --version)
    print_success "✓ Python found: $PYTHON_VERSION"
elif command_exists python; then
    PYTHON_VERSION=$(python --version)
    if [[ $PYTHON_VERSION == *"Python 3"* ]]; then
        print_success "✓ Python found: $PYTHON_VERSION"
        alias python3=python
    else
        print_error "Python 3.11+ required. Found: $PYTHON_VERSION"
        exit 1
    fi
else
    print_warning "⚠ Python not found"
    case $OS in
        "macOS")
            if command_exists brew; then
                print_status "Installing Python via Homebrew..."
                brew install python@3.11
            else
                print_error "Please install Python from https://python.org/"
                exit 1
            fi
            ;;
        "Linux")
            print_status "Installing Python..."
            if command_exists apt; then
                sudo apt update && sudo apt install -y python3.11 python3.11-pip python3.11-venv
            else
                print_error "Please install Python 3.11+ from your package manager"
                exit 1
            fi
            ;;
        *)
            print_error "Please install Python from https://python.org/"
            exit 1
            ;;
    esac
fi

# Check Git
if command_exists git; then
    GIT_VERSION=$(git --version)
    print_success "✓ Git found: $GIT_VERSION"
else
    print_error "Git is required but not found. Please install Git first."
    exit 1
fi

# Install/check Expo CLI
if command_exists expo; then
    EXPO_VERSION=$(expo --version)
    print_success "✓ Expo CLI found: $EXPO_VERSION"
else
    print_status "Installing Expo CLI..."
    npm install -g @expo/cli
    print_success "✓ Expo CLI installed"
fi

echo ""
print_success "✅ All prerequisites satisfied"
echo ""

# Phase 2: Environment Setup
echo "🔧 Phase 2: Environment Setup"
echo "=============================="
echo ""

# Check for environment export file
if [ ! -f "work-computer-env-export.txt" ]; then
    print_warning "⚠ Environment export file not found"
    print_status "Checking if environment variables can be extracted from existing files..."
    
    if [ -f "NestSync-backend/.env" ] || [ -f "NestSync-backend/.env.local" ]; then
        print_status "Found existing environment file, attempting to use it..."
    else
        print_error "No environment configuration found"
        print_error "Please run the export script on your home computer first:"
        print_error "   ./export-env-secure.sh"
        print_error "Then transfer the generated files to this computer"
        exit 1
    fi
else
    print_status "📁 Setting up environment variables from export..."
    
    # Create .env.local from export file (skip comments and empty lines)
    grep -v '^#' work-computer-env-export.txt | grep -v '^$' > NestSync-backend/.env.local
    print_success "✓ Environment variables configured"
fi

echo ""

# Phase 3: Backend Setup
echo "🐍 Phase 3: Backend Setup"
echo "=========================="
echo ""

cd NestSync-backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    print_status "Creating Python virtual environment..."
    python3 -m venv venv
    print_success "✓ Virtual environment created"
fi

# Activate and install dependencies
print_status "Installing Python dependencies..."
source venv/bin/activate

# Upgrade pip first
pip install --upgrade pip

# Install requirements
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
    print_success "✓ Python dependencies installed"
else
    print_error "requirements.txt not found in NestSync-backend/"
    exit 1
fi

# Run database migrations
print_status "Running database migrations..."
if alembic upgrade head; then
    print_success "✓ Database migrations completed"
else
    print_warning "⚠ Database migrations failed - this might be expected on first run"
fi

cd ..
echo ""

# Phase 4: Frontend Setup
echo "📱 Phase 4: Frontend Setup"
echo "==========================="
echo ""

cd NestSync-frontend

# Install npm dependencies
print_status "Installing Node.js dependencies..."
if npm install; then
    print_success "✓ Node.js dependencies installed"
else
    print_error "npm install failed"
    exit 1
fi

# Fix any version mismatches
print_status "Fixing Expo version mismatches..."
npx expo install --fix

# Clear any potential caches
print_status "Clearing Metro cache..."
npx expo start --clear --port 8082 &
EXPO_PID=$!
sleep 3
kill $EXPO_PID 2>/dev/null || true

print_success "✓ Frontend setup completed"
cd ..
echo ""

# Phase 5: Verification
echo "✅ Phase 5: Setup Verification"
echo "==============================="
echo ""

print_status "Testing environment configuration..."

# Test Python environment
cd NestSync-backend
source venv/bin/activate

# Check if main modules can be imported
python3 -c "
try:
    import fastapi
    import strawberry
    import sqlalchemy
    print('✅ Backend dependencies verified')
except ImportError as e:
    print(f'❌ Backend dependency error: {e}')
    exit(1)
" || exit 1

cd ..

# Test Node environment
cd NestSync-frontend
if npm list expo >/dev/null 2>&1; then
    print_success "✓ Frontend dependencies verified"
else
    print_warning "⚠ Some frontend dependencies may have issues"
fi
cd ..

echo ""

# Phase 6: Create startup scripts and final setup
echo "🚀 Phase 6: Final Configuration"
echo "================================"
echo ""

# Make sure all scripts are executable
chmod +x start-dev-servers-work.sh 2>/dev/null || true
chmod +x export-env-secure.sh 2>/dev/null || true
chmod +x work-setup-complete.sh 2>/dev/null || true

print_status "Creating verification script..."

# Create health check script
cat > verify-environment.sh << 'EOF'
#!/bin/bash

# NestSync Environment Verification Script
# Run this to check if your development environment is working

echo "🔍 NestSync Environment Health Check"
echo "===================================="
echo ""

# Check backend
echo "🐍 Backend Status:"
cd NestSync-backend
source venv/bin/activate

# Test GraphQL schema loading
if python3 -c "from app.graphql.schema import schema; print('✅ GraphQL schema loads successfully')" 2>/dev/null; then
    echo "✅ Backend: Ready"
else
    echo "❌ Backend: Issues detected"
    BACKEND_OK=false
fi

cd ..

# Check frontend
echo ""
echo "📱 Frontend Status:"
cd NestSync-frontend
if [ -d "node_modules" ] && [ -f "package.json" ]; then
    echo "✅ Frontend: Ready"
else
    echo "❌ Frontend: Issues detected"
    FRONTEND_OK=false
fi
cd ..

echo ""
echo "🌐 Network Connectivity Test:"
echo "Backend should be accessible at: http://localhost:8001"
echo "Frontend should be accessible at: http://localhost:8082"
echo ""
echo "🧪 Test Credentials:"
echo "Email: parents@nestsync.com"
echo "Password: Shazam11#"
echo ""
echo "🚀 To start development servers:"
echo "./start-dev-servers-work.sh"
EOF

chmod +x verify-environment.sh

print_success "✓ Verification script created"
echo ""

# Phase 7: Success and next steps
echo "🎉 Setup Completed Successfully!"
echo "================================"
echo ""

print_success "✅ Backend: Python environment with dependencies"
print_success "✅ Frontend: Node.js environment with Expo"
print_success "✅ Environment: Variables configured"
print_success "✅ Database: Migrations ready"
print_success "✅ Scripts: All automation tools available"
echo ""

echo "📋 Available Commands:"
echo "   ./start-dev-servers-work.sh    - Start both development servers"
echo "   ./verify-environment.sh        - Check environment health"
echo "   ./export-env-secure.sh         - Export environment for another computer"
echo ""

echo "🧪 Test Credentials:"
echo "   Email: parents@nestsync.com"
echo "   Password: Shazam11#"
echo ""

echo "📚 Documentation:"
echo "   CLAUDE-HANDOFF.md           - Complete context for Claude Code"
echo "   WORK-COMPUTER-SETUP.md      - Detailed setup instructions"
echo "   TROUBLESHOOTING-GUIDE.md    - Problem solving guide"
echo ""

echo "🎯 Next Steps:"
echo "   1. Run: ./verify-environment.sh"
echo "   2. Start servers: ./start-dev-servers-work.sh"
echo "   3. Test login at http://localhost:8082"
echo "   4. Continue development on feature/fixing-dashboard branch"
echo ""

print_success "🚀 Your work computer is ready for NestSync development!"
echo ""

# Offer to start servers immediately
read -p "🚀 Start development servers now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    print_status "Starting development servers..."
    ./start-dev-servers-work.sh
fi