---
title: "Test Environment Setup Guide"
date: 2025-11-10
category: "testing"
type: "setup-guide"
status: "active"
related_docs:
  - "../../scripts/test-preflight-check.sh"
  - "../troubleshooting/test-environment-issues.md"
tags: ["testing", "environment", "setup", "automation"]
---

# Test Environment Setup Guide

This guide provides comprehensive instructions for setting up and validating the NestSync test environment for automated testing.

## Overview

The NestSync test environment consists of:
- **Backend Service**: FastAPI/GraphQL backend on port 8001
- **Frontend Application**: React Native Web/Expo frontend on port 8082
- **Database**: PostgreSQL database (via Supabase)
- **Test Data**: Pre-seeded test users, children, and inventory

## Prerequisites

### Required Software

1. **Node.js** (v18 or higher)
   ```bash
   node --version  # Should be v18.x or higher
   ```

2. **Python** (v3.9 or higher)
   ```bash
   python --version  # Should be 3.9.x or higher
   ```

3. **npm** or **yarn**
   ```bash
   npm --version
   # or
   yarn --version
   ```

4. **curl** (for health checks)
   ```bash
   curl --version
   ```

5. **bc** (for calculations in pre-flight script)
   ```bash
   bc --version
   ```

### Environment Files

Both backend and frontend require environment configuration files:

#### Backend Environment (.env)

Create `NestSync-backend/.env` with:

```bash
# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/nestsync
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key
SUPABASE_JWT_SECRET=your-jwt-secret

# Application Settings
ENVIRONMENT=development
DEBUG=true
LOG_LEVEL=INFO

# Timezone
TIMEZONE=America/Toronto

# Security
SECRET_KEY=your-secret-key-here

# Stripe (for payment tests)
STRIPE_SECRET_KEY=sk_test_your_test_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_test_key
```

#### Frontend Environment (.env or .env.local)

Create `NestSync-frontend/.env.local` with:

```bash
# Backend API
EXPO_PUBLIC_GRAPHQL_URL=http://localhost:8001/graphql

# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Stripe
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_test_key

# Environment
NODE_ENV=development
```

## Service Startup

### 1. Start Backend Service

```bash
cd NestSync-backend

# Install dependencies (first time only)
pip install -r requirements.txt

# Run database migrations (first time only)
alembic upgrade head

# Start the backend
python main.py
```

The backend should start on `http://localhost:8001`

**Verify backend is running:**
```bash
curl http://localhost:8001/health
# Expected: {"status":"healthy","timestamp":"...","service":"NestSync API","version":"1.0.0"}
```

### 2. Start Frontend Application

```bash
cd NestSync-frontend

# Install dependencies (first time only)
npm install

# Start the frontend
npm start
```

The frontend should start on `http://localhost:8082`

**Verify frontend is running:**
```bash
curl http://localhost:8082
# Expected: HTML content with React app
```

## Test Data Seeding

### Create Test User

The test suite expects a test user with known credentials. Create one using the GraphQL API:

```bash
curl -X POST http://localhost:8001/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { signUp(email: \"test@example.com\", password: \"TestPassword123\") { user { id email } } }"
  }'
```

### Seed Test Data (Optional)

If you have a test data seeding script:

```bash
cd NestSync-backend
python scripts/seed_test_data.py
```

This should create:
- Test user accounts
- Test child profiles
- Test inventory items
- Test family collaboration setup

## Pre-flight Validation

Before running automated tests, always run the pre-flight check script:

```bash
./scripts/test-preflight-check.sh
```

### Expected Output

```
[INFO] Starting test environment pre-flight check...

[INFO] Waiting for Backend at http://localhost:8001/health...
[SUCCESS] Backend is responding
[SUCCESS] Backend health check passed
[SUCCESS] Detailed health check available
[INFO] Overall health: 100.0%
[SUCCESS] System health is good (100.0%)
[SUCCESS] Supabase connection verified
[SUCCESS] Database connection verified

[INFO] Checking frontend readiness...
[INFO] Waiting for Frontend at http://localhost:8082...
[SUCCESS] Frontend is responding
[SUCCESS] Frontend React app initialized
[INFO] Frontend readiness check passed

[INFO] Checking required environment variables...
[SUCCESS] Backend .env file found
[SUCCESS] Frontend .env file found

[INFO] Checking test data...
[WARNING] Test data verification requires authentication
[INFO] Skipping test data checks (will be verified during test execution)

=========================================
Pre-flight Check Summary
=========================================

Checks Passed (10):
  ✓ Backend health
  ✓ Detailed health check available
  ✓ System health
  ✓ Supabase connection
  ✓ Database connection
  ✓ Frontend initialization
  ✓ Frontend ready
  ✓ Backend .env
  ✓ Frontend .env
  ✓ Test data check skipped

=========================================

[SUCCESS] All pre-flight checks passed! Environment is ready for testing.
```

### Exit Codes

The pre-flight script uses specific exit codes to indicate failure types:

| Exit Code | Meaning | Remediation |
|-----------|---------|-------------|
| 0 | All checks passed | Proceed with testing |
| 1 | Backend not ready | Start backend service |
| 2 | Frontend not ready | Start frontend service |
| 3 | Database not accessible | Check database connection |
| 4 | Auth not configured | Set up environment variables |
| 5 | Test data missing | Seed test data |

## Running Tests

### TestSprite Test Suite

Once the pre-flight check passes, run the TestSprite test suite:

```bash
cd testsprite_tests

# Run all tests
python -m pytest

# Run specific test
python -m pytest TC001_User_Sign_Up_With_Valid_Credentials.py
```

### Playwright Tests

For E2E tests using Playwright:

```bash
cd NestSync-frontend

# Run Playwright tests
npx playwright test

# Run with UI
npx playwright test --ui

# Run specific test
npx playwright test tests/password-reset-e2e.spec.ts
```

## Troubleshooting

### Backend Not Starting

**Symptoms:**
- Pre-flight check fails with exit code 1
- Backend health endpoint not responding

**Solutions:**

1. **Check if port 8001 is already in use:**
   ```bash
   lsof -i :8001
   # Kill the process if needed
   kill -9 <PID>
   ```

2. **Check backend logs:**
   ```bash
   cd NestSync-backend
   tail -f backend.log
   ```

3. **Verify database connection:**
   ```bash
   # Test database connection
   psql $DATABASE_URL
   ```

4. **Check Supabase credentials:**
   - Verify `SUPABASE_URL` and `SUPABASE_KEY` in `.env`
   - Test Supabase connection in browser

### Frontend Not Starting

**Symptoms:**
- Pre-flight check fails with exit code 2
- Frontend not serving content on port 8082

**Solutions:**

1. **Check if port 8082 is already in use:**
   ```bash
   lsof -i :8082
   # Kill the process if needed
   kill -9 <PID>
   ```

2. **Clear Expo cache:**
   ```bash
   cd NestSync-frontend
   npm start -- --clear
   ```

3. **Reinstall dependencies:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **Check for build errors:**
   ```bash
   npm run build
   ```

### Database Connection Issues

**Symptoms:**
- Pre-flight check fails with exit code 3
- Backend starts but health check shows database disconnected

**Solutions:**

1. **Verify DATABASE_URL:**
   ```bash
   echo $DATABASE_URL
   # Should be: postgresql://user:password@host:port/database
   ```

2. **Test database connectivity:**
   ```bash
   psql $DATABASE_URL -c "SELECT 1;"
   ```

3. **Check Supabase project status:**
   - Log in to Supabase dashboard
   - Verify project is active
   - Check for any service disruptions

4. **Run database migrations:**
   ```bash
   cd NestSync-backend
   alembic upgrade head
   ```

### Authentication Not Configured

**Symptoms:**
- Pre-flight check fails with exit code 4
- Missing environment files

**Solutions:**

1. **Copy example environment files:**
   ```bash
   cp NestSync-backend/.env.example NestSync-backend/.env
   cp NestSync-frontend/.env.example NestSync-frontend/.env.local
   ```

2. **Set Supabase credentials:**
   - Get credentials from Supabase dashboard
   - Update `SUPABASE_URL` and `SUPABASE_KEY`
   - Update `SUPABASE_JWT_SECRET`

3. **Verify API keys are valid:**
   ```bash
   curl https://your-project.supabase.co/rest/v1/ \
     -H "apikey: your-anon-key"
   ```

### Test Data Missing

**Symptoms:**
- Pre-flight check fails with exit code 5
- Tests fail with "user not found" errors

**Solutions:**

1. **Create test user manually:**
   ```bash
   curl -X POST http://localhost:8001/graphql \
     -H "Content-Type: application/json" \
     -d '{
       "query": "mutation { signUp(email: \"test@example.com\", password: \"TestPassword123\") { user { id email } } }"
     }'
   ```

2. **Run test data seeding script:**
   ```bash
   cd NestSync-backend
   python scripts/seed_test_data.py
   ```

3. **Verify test user exists:**
   ```bash
   # Login as test user
   curl -X POST http://localhost:8001/graphql \
     -H "Content-Type: application/json" \
     -d '{
       "query": "mutation { signIn(email: \"test@example.com\", password: \"TestPassword123\") { token user { id email } } }"
     }'
   ```

## Common Issues

### Port Conflicts

If services fail to start due to port conflicts:

```bash
# Find process using port
lsof -i :8001  # Backend
lsof -i :8082  # Frontend

# Kill process
kill -9 <PID>
```

### Environment Variable Issues

If environment variables are not being read:

```bash
# Verify .env files exist
ls -la NestSync-backend/.env
ls -la NestSync-frontend/.env.local

# Check file permissions
chmod 600 NestSync-backend/.env
chmod 600 NestSync-frontend/.env.local

# Restart services after changing .env
```

### Network Issues

If services can't communicate:

```bash
# Test backend from frontend
curl http://localhost:8001/health

# Test GraphQL endpoint
curl -X POST http://localhost:8001/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __schema { types { name } } }"}'
```

## Best Practices

### Before Running Tests

1. **Always run pre-flight check:**
   ```bash
   ./scripts/test-preflight-check.sh
   ```

2. **Check service logs for errors:**
   ```bash
   # Backend logs
   tail -f NestSync-backend/backend.log
   
   # Frontend logs (in terminal where npm start is running)
   ```

3. **Verify test data is fresh:**
   - Reset test database if needed
   - Re-seed test data

### During Test Development

1. **Use test-specific credentials:**
   - Never use production credentials
   - Use `test@example.com` for test user

2. **Clean up test data:**
   - Delete test data after tests
   - Or use database transactions that rollback

3. **Monitor service health:**
   - Check `/health/detailed` endpoint
   - Watch for degraded performance

### After Tests

1. **Review test results:**
   - Check for environment vs code failures
   - Document any new issues found

2. **Clean up resources:**
   - Stop services if not needed
   - Clear test data

3. **Update documentation:**
   - Document new test scenarios
   - Update troubleshooting guide

## Continuous Integration

### GitHub Actions Setup

For CI/CD pipelines, use the pre-flight check in your workflow:

```yaml
name: Run Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.9'
      
      - name: Set up Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd NestSync-backend && pip install -r requirements.txt
          cd ../NestSync-frontend && npm install
      
      - name: Start services
        run: |
          cd NestSync-backend && python main.py &
          cd NestSync-frontend && npm start &
      
      - name: Run pre-flight check
        run: ./scripts/test-preflight-check.sh
      
      - name: Run tests
        run: |
          cd testsprite_tests
          python -m pytest
```

## Additional Resources

- [TestSprite Test Report](../../testsprite_tests/testsprite-mcp-test-report.md)
- [Backend API Documentation](../../NestSync-backend/docs/README.md)
- [Frontend Documentation](../../NestSync-frontend/docs/README.md)
- [Troubleshooting Guide](../troubleshooting/test-environment-issues.md)

## Support

If you encounter issues not covered in this guide:

1. Check the [Troubleshooting Guide](../troubleshooting/test-environment-issues.md)
2. Review service logs for error messages
3. Run pre-flight check with verbose output
4. Contact the development team with:
   - Pre-flight check output
   - Service logs
   - Steps to reproduce the issue

---

**Last Updated**: 2025-11-10  
**Maintained By**: QA Team  
**Related Scripts**: `scripts/test-preflight-check.sh`
