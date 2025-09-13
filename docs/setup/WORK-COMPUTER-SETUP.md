# NestSync Work Computer Setup Guide

## Critical Environment Variables You Need

### Get These From Your Home Computer:
Before setting up on work computer, collect these values from your current setup:

**From NestSync-backend/.env.local:**
```bash
SUPABASE_URL=https://xxxxxxxxxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET=your-super-secret-jwt-key
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/nestsync
SECRET_KEY=your-super-secret-key-here
```

### How to Find Your Supabase Credentials:
1. Go to [supabase.com](https://supabase.com) and log into your project
2. Navigate to Settings → API
3. Copy the Project URL (SUPABASE_URL)
4. Copy the anon/public key (SUPABASE_KEY)
5. Copy the service_role key (SUPABASE_SERVICE_KEY)
6. Go to Settings → Auth → JWT Secret (SUPABASE_JWT_SECRET)

## Work Computer Network Configuration

### CORS Configuration for Work Environment
You may need to add your work computer's IP address to CORS origins:

**In NestSync-backend/.env.local:**
```bash
# Add your work computer's local IP
CORS_ORIGINS=http://localhost:3000,http://localhost:19006,http://localhost:8082,http://192.168.X.X:8082
```

### Common Work Network Issues:
1. **Corporate Firewall**: Ports 8001 and 8082 might be blocked
2. **Proxy Settings**: npm and pip might need proxy configuration
3. **VPN Issues**: Some VPNs block local development servers

## Quick Verification Steps

### 1. Backend Health Check
```bash
curl http://localhost:8001/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __schema { types { name } } }"}'

# Should return GraphQL schema information
```

### 2. Frontend Accessibility
```bash
curl -I http://localhost:8082
# Should return HTTP 200 OK
```

### 3. Authentication Test
- Navigate to http://localhost:8082
- Try logging in with: **parents@nestsync.com** / **Shazam11#**
- Should successfully authenticate and show dashboard

## Platform-Specific Instructions

### macOS Work Computer:
```bash
# Install Homebrew if needed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install dependencies
brew install node python@3.11 git

# Install Expo CLI
npm install -g @expo/cli
```

### Windows Work Computer:
```bash
# Install Chocolatey if needed
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install dependencies
choco install nodejs python git

# Install Expo CLI
npm install -g @expo/cli
```

### Linux Work Computer:
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nodejs npm python3.11 python3.11-pip git

# Install Expo CLI
npm install -g @expo/cli
```

## Step-by-Step Checklist

- [ ] Prerequisites installed (Node.js, Python, Git, Expo CLI)
- [ ] Repository cloned from GitHub
- [ ] Switched to feature/fixing-dashboard branch
- [ ] Python virtual environment created and activated
- [ ] Python dependencies installed (pip install -r requirements.txt)
- [ ] .env.local created with actual Supabase credentials
- [ ] Database migrations run (alembic upgrade head)
- [ ] Backend server tested (uvicorn command)
- [ ] Frontend dependencies installed (npm install)
- [ ] Frontend server tested (npx expo start)
- [ ] Both servers running simultaneously
- [ ] Authentication tested with test credentials
- [ ] GraphQL playground accessible at localhost:8001/graphql

## One-Command Startup

After completing setup, use the startup script:
```bash
./start-dev-servers-work.sh
```

This will:
- Clean up any existing processes on ports 8001/8082
- Start backend server (FastAPI + GraphQL)
- Start frontend server (Expo + React Native)
- Display connection URLs and test credentials
- Keep both servers running until Ctrl+C

## Test Credentials for Development

**Email:** parents@nestsync.com  
**Password:** Shazam11#

Use these credentials to test the complete authentication flow and verify that your work computer setup is working correctly.

## Current Project Status

You'll be continuing work on the **feature/fixing-dashboard** branch, which contains:
- Recent dashboard fixes and improvements
- Context-aware FAB implementation
- Enhanced inventory management
- PIPEDA compliance updates

The project uses:
- **Frontend**: React Native + Expo (Expo SDK ~53)
- **Backend**: FastAPI + GraphQL (Strawberry)
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth with JWT tokens