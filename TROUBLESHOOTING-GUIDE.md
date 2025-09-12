# NestSync Work Computer Troubleshooting Guide

## Common Setup Issues and Solutions

### 1. "Network Request Failed" During Authentication

**Symptoms:**
- Frontend loads but authentication fails
- Error: "ApolloError: Network request failed"
- Login attempts timeout or show network errors

**Root Cause:** Backend server not running or not accessible

**Solutions:**
```bash
# Check if backend is running
curl http://localhost:8001/health
# Should return JSON response

# If no response, start backend:
cd NestSync-backend
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8001 --reload

# Check for port conflicts:
lsof -i :8001
# Kill conflicting processes if needed
```

### 2. Python Virtual Environment Issues

**Symptoms:**
- "No module named 'fastapi'" or similar import errors
- pip install fails
- uvicorn command not found

**Solutions:**
```bash
# Recreate virtual environment
cd NestSync-backend
rm -rf venv  # Remove existing broken venv
python -m venv venv
source venv/bin/activate  # macOS/Linux
# OR: venv\Scripts\activate  # Windows

# Upgrade pip and install dependencies
pip install --upgrade pip
pip install -r requirements.txt
```

### 3. Supabase Connection Errors

**Symptoms:**
- "Invalid JWT token" errors
- Database connection failures
- Authentication works but data doesn't load

**Solutions:**
```bash
# Verify your .env.local has correct values:
cat NestSync-backend/.env.local

# Test Supabase connection:
python -c "
import os
from dotenv import load_dotenv
load_dotenv('.env.local')
print('SUPABASE_URL:', os.getenv('SUPABASE_URL'))
print('SUPABASE_KEY:', os.getenv('SUPABASE_KEY')[:20] + '...')
"

# Common fixes:
# 1. Copy credentials from your home computer
# 2. Ensure no spaces in environment variable values
# 3. Check that Supabase project is still active
```

### 4. Expo/Frontend Issues

**Symptoms:**
- "Metro bundler failed to start"
- "Unable to resolve module" errors
- Blank screen or loading indefinitely

**Solutions:**
```bash
# Clear all caches:
cd NestSync-frontend
rm -rf node_modules
rm -rf .expo
npm install
npx expo install --fix
npx expo start --clear --port 8082

# For persistent issues:
npx expo doctor  # Check for environment issues
```

### 5. Corporate Network Issues

**Symptoms:**
- npm install fails with timeout
- Expo dev server unreachable from mobile device
- CORS errors in browser console

**Solutions:**
```bash
# Configure npm proxy (if needed):
npm config set proxy http://proxy.company.com:port
npm config set https-proxy https://proxy.company.com:port

# Add corporate certificates (if needed):
npm config set cafile /path/to/corporate-ca.crt

# For CORS issues, update backend .env.local:
CORS_ORIGINS=http://localhost:3000,http://localhost:19006,http://localhost:8082,http://YOUR-WORK-IP:8082

# Find your work IP:
ifconfig | grep inet  # macOS/Linux
ipconfig  # Windows
```

### 6. Port Already in Use Errors

**Symptoms:**
- "Error: listen EADDRINUSE :::8001"
- "Port 8082 is already in use"

**Solutions:**
```bash
# Find and kill processes on ports:
# Port 8001 (backend):
lsof -ti:8001 | xargs kill -9

# Port 8082 (frontend):
lsof -ti:8082 | xargs kill -9

# Use the startup script (automatically handles this):
./start-dev-servers-work.sh
```

### 7. Database Migration Issues

**Symptoms:**
- "relation does not exist" errors
- "No migration files found"
- Alembic command not found

**Solutions:**
```bash
cd NestSync-backend
source venv/bin/activate

# Check current migration status:
alembic current

# Run migrations:
alembic upgrade head

# If migrations fail, check database URL:
echo $DATABASE_URL
# Should point to your local Supabase instance

# Reset migrations (if needed):
alembic downgrade base
alembic upgrade head
```

### 8. Authentication Flow Issues

**Symptoms:**
- Test credentials don't work (parents@nestsync.com)
- "User not found" or "Invalid credentials"
- Successful login but immediate logout

**Solutions:**
```bash
# 1. Check if test user exists in your Supabase database
# 2. Verify JWT secret matches between .env.local and Supabase
# 3. Check token expiration settings

# Test authentication manually:
curl -X POST http://localhost:8001/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { signIn(email: \"parents@nestsync.com\", password: \"Shazam11#\") { success user { email } token } }"
  }'
```

### 9. Cross-Platform Compatibility Issues

**Symptoms:**
- Works on web but not mobile
- SecureStore errors on web
- Different behavior across platforms

**Solutions:**
- Use universal storage hooks from `hooks/useUniversalStorage.ts`
- Never import SecureStore directly in components
- Test authentication on web platform first
- Check for platform-specific code paths

### 10. Development Environment Mismatch

**Symptoms:**
- Different behavior than home computer
- Missing features or broken functionality
- Inconsistent data or state

**Solutions:**
```bash
# Ensure you're on the correct branch:
git status
git checkout feature/fixing-dashboard

# Verify you have latest changes:
git pull origin feature/fixing-dashboard

# Check environment consistency:
cd NestSync-frontend && npm list expo
cd ../NestSync-backend && pip list | grep fastapi
```

## Quick Diagnostic Commands

### Health Check Script:
```bash
#!/bin/bash
echo "🔍 NestSync Environment Diagnostic"
echo "================================="

echo "Node.js: $(node --version)"
echo "Python: $(python --version)"
echo "Expo CLI: $(expo --version)"

echo "Backend Status:"
curl -s http://localhost:8001/health || echo "❌ Backend not running"

echo "Frontend Status:" 
curl -s -I http://localhost:8082 || echo "❌ Frontend not running"

echo "Git Branch: $(git branch --show-current)"
echo "Environment: $(ls NestSync-backend/.env* 2>/dev/null)"
```

## Emergency Reset Procedure

If everything breaks and you need to start fresh:

```bash
# 1. Stop all processes
pkill -f "uvicorn"
pkill -f "expo"

# 2. Clean all dependencies
cd NestSync-backend
rm -rf venv
cd ../NestSync-frontend  
rm -rf node_modules .expo

# 3. Recreate environment
cd ../NestSync-backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

cd ../NestSync-frontend
npm install
npx expo install --fix

# 4. Copy environment variables from home computer
cp .env.example .env.local  # Then edit with actual values

# 5. Run migrations and start servers
cd ../NestSync-backend
alembic upgrade head
cd ..
./start-dev-servers-work.sh
```

## Getting Help

1. **Check the logs** - Both servers output detailed error messages
2. **Verify prerequisites** - Ensure all required software is installed
3. **Test incrementally** - Start backend first, then frontend
4. **Compare with home setup** - Check environment variables and versions
5. **Use the test credentials** - parents@nestsync.com / Shazam11#

Remember: Both servers must run simultaneously for the app to function correctly!