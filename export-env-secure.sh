#!/bin/bash

# NestSync Environment Variable Export Script
# Securely extracts and formats environment variables for work computer transfer
# This script helps automate the setup process without manual copying

set -e  # Exit on any error

echo "🔒 NestSync Environment Variable Export Tool"
echo "============================================="
echo ""

# Check if we're in the correct directory
if [ ! -f "NestSync-backend/.env" ] && [ ! -f "NestSync-backend/.env.local" ]; then
    echo "❌ Error: No environment files found in NestSync-backend/"
    echo "   Please run this script from the NestSync project root directory"
    exit 1
fi

# Function to extract value from env file
get_env_value() {
    local key="$1"
    local file="$2"
    
    if [ -f "$file" ]; then
        grep "^${key}=" "$file" 2>/dev/null | cut -d'=' -f2- | sed 's/^["'\'']//' | sed 's/["'\'']$//'
    fi
}

# Determine which env file to use
ENV_FILE=""
if [ -f "NestSync-backend/.env.local" ]; then
    ENV_FILE="NestSync-backend/.env.local"
    echo "📄 Using .env.local file"
elif [ -f "NestSync-backend/.env" ]; then
    ENV_FILE="NestSync-backend/.env"
    echo "📄 Using .env file"
else
    echo "❌ No environment file found"
    exit 1
fi

echo "📍 Source: $ENV_FILE"
echo ""

# Extract critical environment variables
echo "🔍 Extracting environment variables..."
echo ""

# Critical Supabase variables
SUPABASE_URL=$(get_env_value "SUPABASE_URL" "$ENV_FILE")
SUPABASE_ANON_KEY=$(get_env_value "SUPABASE_ANON_KEY" "$ENV_FILE")
SUPABASE_SERVICE_ROLE_KEY=$(get_env_value "SUPABASE_SERVICE_ROLE_KEY" "$ENV_FILE")
SUPABASE_JWT_SECRET=$(get_env_value "SUPABASE_JWT_SECRET" "$ENV_FILE")

# Alternative key names
if [ -z "$SUPABASE_ANON_KEY" ]; then
    SUPABASE_ANON_KEY=$(get_env_value "SUPABASE_KEY" "$ENV_FILE")
fi
if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    SUPABASE_SERVICE_ROLE_KEY=$(get_env_value "SUPABASE_SERVICE_KEY" "$ENV_FILE")
fi

# Database and application variables
DATABASE_URL=$(get_env_value "DATABASE_URL" "$ENV_FILE")
SECRET_KEY=$(get_env_value "SECRET_KEY" "$ENV_FILE")
APP_NAME=$(get_env_value "APP_NAME" "$ENV_FILE")
ENVIRONMENT=$(get_env_value "ENVIRONMENT" "$ENV_FILE")

# Validation
missing_vars=()
if [ -z "$SUPABASE_URL" ]; then missing_vars+=("SUPABASE_URL"); fi
if [ -z "$SUPABASE_ANON_KEY" ]; then missing_vars+=("SUPABASE_ANON_KEY/SUPABASE_KEY"); fi
if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then missing_vars+=("SUPABASE_SERVICE_ROLE_KEY/SUPABASE_SERVICE_KEY"); fi
if [ -z "$SUPABASE_JWT_SECRET" ]; then missing_vars+=("SUPABASE_JWT_SECRET"); fi

if [ ${#missing_vars[@]} -ne 0 ]; then
    echo "⚠️  Warning: Missing critical environment variables:"
    for var in "${missing_vars[@]}"; do
        echo "   - $var"
    done
    echo ""
    echo "💡 If these are missing, you can obtain them from:"
    echo "   1. Go to https://supabase.com"
    echo "   2. Select your NestSync project"
    echo "   3. Settings → API"
    echo "   4. Copy the values to your .env file"
    echo ""
fi

# Create export file for work computer
EXPORT_FILE="work-computer-env-export.txt"
echo "💾 Creating export file: $EXPORT_FILE"

cat > "$EXPORT_FILE" << EOF
# NestSync Environment Variables Export
# Generated on: $(date)
# Source: $ENV_FILE
# 
# INSTRUCTIONS FOR WORK COMPUTER:
# 1. Copy this entire content
# 2. Create NestSync-backend/.env.local on work computer
# 3. Paste this content into that file
# 4. Remove these instruction comments
# 5. Save the file

# =============================================================================
# Application Configuration
# =============================================================================
APP_NAME=${APP_NAME:-"NestSync API"}
API_VERSION=1.0.0
ENVIRONMENT=${ENVIRONMENT:-"development"}
DEBUG=true

# Data residency compliance (REQUIRED for PIPEDA)
DATA_REGION=canada-central
TZ=America/Toronto

# =============================================================================
# Database Configuration (Supabase PostgreSQL)
# =============================================================================
DATABASE_URL=${DATABASE_URL:-"postgresql+asyncpg://postgres:password@localhost:5432/nestsync"}
DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=30
DATABASE_POOL_TIMEOUT=30

# =============================================================================
# Supabase Configuration (REQUIRED)
# =============================================================================
SUPABASE_URL=$SUPABASE_URL
SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY
SUPABASE_JWT_SECRET=$SUPABASE_JWT_SECRET

# =============================================================================
# Security Configuration (REQUIRED)
# =============================================================================
SECRET_KEY=${SECRET_KEY:-"your-super-secret-key-here-change-in-production"}
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_HOURS=24
REFRESH_TOKEN_EXPIRE_DAYS=30

# Password security requirements
PASSWORD_MIN_LENGTH=8
PASSWORD_REQUIRE_UPPERCASE=true
PASSWORD_REQUIRE_LOWERCASE=true
PASSWORD_REQUIRE_NUMBERS=true
PASSWORD_REQUIRE_SYMBOLS=false

# Rate limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=900

# =============================================================================
# CORS Configuration
# =============================================================================
CORS_ORIGINS=http://localhost:3000,http://localhost:19006,http://localhost:8082,https://nestsync.ca

# =============================================================================
# PIPEDA Compliance Configuration
# =============================================================================
DATA_RETENTION_DAYS=2555
CONSENT_VERSION=1.0
PRIVACY_POLICY_URL=https://nestsync.ca/privacy
TERMS_OF_SERVICE_URL=https://nestsync.ca/terms

# Data subject rights
DATA_PORTABILITY_ENABLED=true
DATA_DELETION_ENABLED=true
CONSENT_WITHDRAWAL_ENABLED=true

# =============================================================================
# Feature Flags
# =============================================================================
ENABLE_BIOMETRIC_AUTH=true
ENABLE_ANALYTICS_CONSENT=true
ENABLE_MARKETING_CONSENT=true

# Onboarding configuration
MAX_CHILDREN_PER_USER=10
DEFAULT_DIAPER_BRANDS=Huggies,Pampers,Honest,Kirkland,Parent's Choice
EOF

echo ""
echo "✅ Environment export completed!"
echo ""
echo "📋 Summary:"
echo "   • Export file: $EXPORT_FILE"
echo "   • Contains: $(wc -l < "$EXPORT_FILE") lines"
echo "   • Critical vars: $([ ${#missing_vars[@]} -eq 0 ] && echo "All present" || echo "${#missing_vars[@]} missing")"
echo ""

if [ ${#missing_vars[@]} -eq 0 ]; then
    echo "🎉 Ready for work computer setup!"
    echo ""
    echo "📤 Next steps:"
    echo "   1. Transfer '$EXPORT_FILE' to your work computer"
    echo "   2. Follow WORK-COMPUTER-SETUP.md instructions"
    echo "   3. Use ./start-dev-servers-work.sh to launch servers"
    echo ""
else
    echo "⚠️  Please resolve missing variables before work computer setup"
    echo ""
fi

# Create quick setup script for work computer
SETUP_SCRIPT="work-computer-quick-setup.sh"
echo "🚀 Creating quick setup script: $SETUP_SCRIPT"

cat > "$SETUP_SCRIPT" << 'EOF'
#!/bin/bash

# NestSync Work Computer Quick Setup Script
# Run this script on your work computer after cloning the repository

set -e

echo "🏢 NestSync Work Computer Setup"
echo "==============================="
echo ""

# Check if we're in the correct directory
if [ ! -d "NestSync-backend" ] || [ ! -d "NestSync-frontend" ]; then
    echo "❌ Error: Please run this script from the NestSync project root directory"
    echo "   Make sure you've cloned: https://github.com/andreero0/NestSyncV1.2.git"
    exit 1
fi

# Check if environment export file exists
if [ ! -f "work-computer-env-export.txt" ]; then
    echo "❌ Error: work-computer-env-export.txt not found"
    echo "   Please transfer this file from your home computer first"
    exit 1
fi

echo "📁 Setting up environment variables..."

# Extract environment variables from export file (skip comments and empty lines)
grep -v '^#' work-computer-env-export.txt | grep -v '^$' > NestSync-backend/.env.local

echo "✅ Environment variables configured"
echo ""

echo "🐍 Setting up Python backend..."
cd NestSync-backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "   Creating Python virtual environment..."
    python -m venv venv
fi

# Activate and install dependencies
echo "   Installing Python dependencies..."
source venv/bin/activate
pip install -r requirements.txt

echo "🗄️  Running database migrations..."
alembic upgrade head

cd ..

echo "📱 Setting up React Native frontend..."
cd NestSync-frontend

echo "   Installing Node.js dependencies..."
npm install

# Fix any version mismatches
npx expo install --fix

cd ..

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "🚀 To start development servers:"
echo "   ./start-dev-servers-work.sh"
echo ""
echo "🧪 Test with credentials:"
echo "   Email: parents@nestsync.com"
echo "   Password: Shazam11#"
echo ""
EOF

chmod +x "$SETUP_SCRIPT"

echo "✅ Quick setup script created: $SETUP_SCRIPT"
echo ""
echo "📋 Files created for work computer transfer:"
echo "   • $EXPORT_FILE (environment variables)"
echo "   • $SETUP_SCRIPT (automated setup)"
echo "   • WORK-COMPUTER-SETUP.md (detailed instructions)"
echo "   • TROUBLESHOOTING-GUIDE.md (problem solving)"
echo "   • start-dev-servers-work.sh (server startup)"
echo ""
echo "🏢 Your work computer setup is ready!"
echo ""

# Offer to open the export file for easy copying
if command -v open &> /dev/null; then
    read -p "📖 Open export file for viewing? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        open "$EXPORT_FILE"
    fi
fi

echo "Happy coding! 🚀"