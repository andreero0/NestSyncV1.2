---
title: "Test Environment Troubleshooting Guide"
date: 2025-11-10
category: "troubleshooting"
type: "guide"
status: "active"
related_docs:
  - "../testing/test-environment-setup.md"
  - "../../scripts/test-preflight-check.sh"
tags: ["troubleshooting", "testing", "environment", "debugging"]
---

# Test Environment Troubleshooting Guide

This guide provides solutions to common issues encountered when setting up and running the NestSync test environment.

## Quick Diagnosis

Run the pre-flight check to identify issues:

```bash
./scripts/test-preflight-check.sh
```

The exit code will indicate the problem area:
- **Exit 0**: All checks passed
- **Exit 1**: Backend issues
- **Exit 2**: Frontend issues
- **Exit 3**: Database issues
- **Exit 4**: Authentication/configuration issues
- **Exit 5**: Test data issues

## Backend Issues (Exit Code 1)

### Backend Not Responding

**Symptoms:**
```
[ERROR] Backend not responding after 30 attempts
```

**Diagnosis:**
```bash
# Check if backend process is running
ps aux | grep "python main.py"

# Check if port 8001 is in use
lsof -i :8001

# Try to access health endpoint
curl http://localhost:8001/health
```

**Solutions:**

1. **Start the backend:**
   ```bash
   cd NestSync-backend
   python main.py
   ```

2. **Kill conflicting process:**
   ```bash
   lsof -i :8001
   kill -9 <PID>
   ```

3. **Check for errors in logs:**
   ```bash
   tail -f NestSync-backend/backend.log
   ```

4. **Verify Python dependencies:**
   ```bash
   cd NestSync-backend
   pip install -r requirements.txt
   ```

### Backend Health Check Failed

**Symptoms:**
```
[ERROR] Backend health check failed: {"status":"unhealthy",...}
```

**Diagnosis:**
```bash
# Get detailed health status
curl http://localhost:8001/health/detailed

# Check backend logs
tail -n 50 NestSync-backend/backend.log
```

**Solutions:**

1. **Check database connection:**
   ```bash
   # Verify DATABASE_URL in .env
   cat NestSync-backend/.env | grep DATABASE_URL
   
   # Test database connection
   psql $DATABASE_URL -c "SELECT 1;"
   ```

2. **Check Supabase connection:**
   ```bash
   # Verify Supabase credentials
   cat NestSync-backend/.env | grep SUPABASE
   
   # Test Supabase API
   curl https://your-project.supabase.co/rest/v1/ \
     -H "apikey: your-anon-key"
   ```

3. **Run database migrations:**
   ```bash
   cd NestSync-backend
   alembic upgrade head
   ```

4. **Restart backend with debug logging:**
   ```bash
   cd NestSync-backend
   LOG_LEVEL=DEBUG python main.py
   ```

### Import Errors

**Symptoms:**
```
ModuleNotFoundError: No module named 'app'
ImportError: cannot import name 'X' from 'Y'
```

**Solutions:**

1. **Reinstall dependencies:**
   ```bash
   cd NestSync-backend
   pip install -r requirements.txt --force-reinstall
   ```

2. **Check Python version:**
   ```bash
   python --version  # Should be 3.9 or higher
   ```

3. **Verify PYTHONPATH:**
   ```bash
   export PYTHONPATH="${PYTHONPATH}:$(pwd)/NestSync-backend"
   ```

4. **Check for circular imports:**
   ```bash
   python -c "import app"
   ```

## Frontend Issues (Exit Code 2)

### Frontend Not Responding

**Symptoms:**
```
[ERROR] Frontend not responding after 30 attempts
```

**Diagnosis:**
```bash
# Check if frontend process is running
ps aux | grep "expo start"

# Check if port 8082 is in use
lsof -i :8082

# Try to access frontend
curl http://localhost:8082
```

**Solutions:**

1. **Start the frontend:**
   ```bash
   cd NestSync-frontend
   npm start
   ```

2. **Kill conflicting process:**
   ```bash
   lsof -i :8082
   kill -9 <PID>
   ```

3. **Clear Expo cache:**
   ```bash
   cd NestSync-frontend
   npm start -- --clear
   ```

4. **Reinstall dependencies:**
   ```bash
   cd NestSync-frontend
   rm -rf node_modules package-lock.json
   npm install
   ```

### Frontend Build Errors

**Symptoms:**
```
Error: Unable to resolve module
SyntaxError: Unexpected token
```

**Solutions:**

1. **Clear Metro bundler cache:**
   ```bash
   cd NestSync-frontend
   npx expo start --clear
   ```

2. **Check Node.js version:**
   ```bash
   node --version  # Should be v18 or higher
   ```

3. **Verify TypeScript compilation:**
   ```bash
   cd NestSync-frontend
   npx tsc --noEmit
   ```

4. **Check for missing dependencies:**
   ```bash
   npm install
   ```

### React App Not Initializing

**Symptoms:**
```
[ERROR] Frontend does not appear to be a React app
```

**Solutions:**

1. **Wait longer for app to initialize:**
   - Frontend may take 30-60 seconds to start
   - Check terminal for "Metro waiting on exp://..."

2. **Check for JavaScript errors:**
   - Open browser console at http://localhost:8082
   - Look for error messages

3. **Verify environment variables:**
   ```bash
   cat NestSync-frontend/.env.local | grep EXPO_PUBLIC
   ```

4. **Try web build:**
   ```bash
   cd NestSync-frontend
   npx expo start --web
   ```

## Database Issues (Exit Code 3)

### Database Not Accessible

**Symptoms:**
```
[ERROR] Database connection status unclear
```

**Diagnosis:**
```bash
# Test database connection
psql $DATABASE_URL -c "SELECT 1;"

# Check Supabase project status
curl https://your-project.supabase.co/rest/v1/ \
  -H "apikey: your-anon-key"
```

**Solutions:**

1. **Verify DATABASE_URL format:**
   ```bash
   # Should be: postgresql://user:password@host:port/database
   echo $DATABASE_URL
   ```

2. **Check Supabase project:**
   - Log in to Supabase dashboard
   - Verify project is active
   - Check for paused projects

3. **Test connection with psql:**
   ```bash
   psql $DATABASE_URL
   ```

4. **Check network connectivity:**
   ```bash
   ping your-project.supabase.co
   ```

### Migration Errors

**Symptoms:**
```
alembic.util.exc.CommandError: Can't locate revision
sqlalchemy.exc.ProgrammingError: relation does not exist
```

**Solutions:**

1. **Check migration status:**
   ```bash
   cd NestSync-backend
   alembic current
   alembic history
   ```

2. **Run pending migrations:**
   ```bash
   alembic upgrade head
   ```

3. **Reset migrations (CAUTION - destroys data):**
   ```bash
   alembic downgrade base
   alembic upgrade head
   ```

4. **Check migration files:**
   ```bash
   ls -la NestSync-backend/alembic/versions/
   ```

## Authentication Issues (Exit Code 4)

### Environment Variables Not Set

**Symptoms:**
```
[WARNING] Backend .env file not found
[WARNING] Frontend .env file not found
```

**Solutions:**

1. **Create .env files from examples:**
   ```bash
   cp NestSync-backend/.env.example NestSync-backend/.env
   cp NestSync-frontend/.env.example NestSync-frontend/.env.local
   ```

2. **Set required variables:**
   ```bash
   # Backend .env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your-anon-key
   SUPABASE_JWT_SECRET=your-jwt-secret
   DATABASE_URL=postgresql://...
   
   # Frontend .env.local
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   EXPO_PUBLIC_GRAPHQL_URL=http://localhost:8001/graphql
   ```

3. **Verify file permissions:**
   ```bash
   chmod 600 NestSync-backend/.env
   chmod 600 NestSync-frontend/.env.local
   ```

4. **Restart services after changes:**
   ```bash
   # Kill and restart both services
   ```

### Invalid Supabase Credentials

**Symptoms:**
```
AuthenticationError: Invalid API key
supabase.exceptions.APIError: Invalid JWT
```

**Solutions:**

1. **Get fresh credentials from Supabase:**
   - Go to Supabase dashboard
   - Project Settings → API
   - Copy URL and anon key

2. **Verify JWT secret:**
   - Project Settings → API → JWT Settings
   - Copy JWT Secret

3. **Test credentials:**
   ```bash
   curl https://your-project.supabase.co/rest/v1/ \
     -H "apikey: your-anon-key" \
     -H "Authorization: Bearer your-anon-key"
   ```

4. **Check for expired keys:**
   - Regenerate API keys if needed
   - Update all .env files

## Test Data Issues (Exit Code 5)

### Test User Not Found

**Symptoms:**
```
[WARNING] Test data verification requires authentication
Tests fail with "User not found" errors
```

**Solutions:**

1. **Create test user:**
   ```bash
   curl -X POST http://localhost:8001/graphql \
     -H "Content-Type: application/json" \
     -d '{
       "query": "mutation { signUp(email: \"test@example.com\", password: \"TestPassword123\") { user { id email } } }"
     }'
   ```

2. **Verify test user exists:**
   ```bash
   curl -X POST http://localhost:8001/graphql \
     -H "Content-Type: application/json" \
     -d '{
       "query": "mutation { signIn(email: \"test@example.com\", password: \"TestPassword123\") { token user { id email } } }"
     }'
   ```

3. **Run test data seeding script:**
   ```bash
   cd NestSync-backend
   python scripts/seed_test_data.py
   ```

4. **Check database for test data:**
   ```bash
   psql $DATABASE_URL -c "SELECT email FROM users WHERE email LIKE 'test%';"
   ```

### Missing Test Child Profiles

**Symptoms:**
```
Tests fail with "No children found" errors
```

**Solutions:**

1. **Create test child profile:**
   ```bash
   # First, get auth token for test user
   TOKEN=$(curl -s -X POST http://localhost:8001/graphql \
     -H "Content-Type: application/json" \
     -d '{"query":"mutation { signIn(email: \"test@example.com\", password: \"TestPassword123\") { token } }"}' \
     | jq -r '.data.signIn.token')
   
   # Create child profile
   curl -X POST http://localhost:8001/graphql \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $TOKEN" \
     -d '{
       "query": "mutation { createChild(name: \"Test Child\", birthDate: \"2020-01-01\") { id name } }"
     }'
   ```

2. **Verify child profiles exist:**
   ```bash
   curl -X POST http://localhost:8001/graphql \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $TOKEN" \
     -d '{"query":"{ myChildren { id name } }"}'
   ```

## Performance Issues

### Slow Service Startup

**Symptoms:**
- Services take >60 seconds to start
- Pre-flight check times out

**Solutions:**

1. **Increase timeout in pre-flight script:**
   ```bash
   # Edit scripts/test-preflight-check.sh
   TIMEOUT=600  # Increase from 300 to 600
   ```

2. **Check system resources:**
   ```bash
   # CPU usage
   top
   
   # Memory usage
   free -h
   
   # Disk I/O
   iostat
   ```

3. **Optimize database:**
   ```bash
   # Vacuum database
   psql $DATABASE_URL -c "VACUUM ANALYZE;"
   ```

4. **Clear caches:**
   ```bash
   # Backend
   rm -rf NestSync-backend/__pycache__
   
   # Frontend
   rm -rf NestSync-frontend/.expo
   rm -rf NestSync-frontend/node_modules/.cache
   ```

### High Memory Usage

**Symptoms:**
- System becomes unresponsive
- Out of memory errors

**Solutions:**

1. **Limit Node.js memory:**
   ```bash
   export NODE_OPTIONS="--max-old-space-size=4096"
   ```

2. **Restart services periodically:**
   ```bash
   # Add to test script
   pkill -f "python main.py"
   pkill -f "expo start"
   sleep 5
   # Restart services
   ```

3. **Monitor memory usage:**
   ```bash
   watch -n 1 'ps aux | grep -E "(python|node)" | grep -v grep'
   ```

## Network Issues

### Services Can't Communicate

**Symptoms:**
```
Network error: Failed to fetch
ECONNREFUSED
```

**Solutions:**

1. **Verify services are on correct ports:**
   ```bash
   lsof -i :8001  # Backend
   lsof -i :8082  # Frontend
   ```

2. **Check firewall settings:**
   ```bash
   # macOS
   sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate
   
   # Linux
   sudo ufw status
   ```

3. **Test connectivity:**
   ```bash
   # From frontend to backend
   curl http://localhost:8001/health
   
   # Test GraphQL
   curl -X POST http://localhost:8001/graphql \
     -H "Content-Type: application/json" \
     -d '{"query":"{ __schema { types { name } } }"}'
   ```

4. **Check CORS settings:**
   - Verify backend allows requests from frontend origin
   - Check CORS headers in response

### DNS Resolution Issues

**Symptoms:**
```
getaddrinfo ENOTFOUND
Could not resolve host
```

**Solutions:**

1. **Use localhost instead of 127.0.0.1:**
   ```bash
   # In .env files
   EXPO_PUBLIC_GRAPHQL_URL=http://localhost:8001/graphql
   ```

2. **Check /etc/hosts:**
   ```bash
   cat /etc/hosts | grep localhost
   # Should have: 127.0.0.1 localhost
   ```

3. **Flush DNS cache:**
   ```bash
   # macOS
   sudo dscacheutil -flushcache
   
   # Linux
   sudo systemd-resolve --flush-caches
   ```

## CI/CD Issues

### Tests Pass Locally But Fail in CI

**Symptoms:**
- Pre-flight check passes locally
- Same check fails in GitHub Actions

**Solutions:**

1. **Check CI environment variables:**
   ```yaml
   # In .github/workflows/test.yml
   env:
     DATABASE_URL: ${{ secrets.DATABASE_URL }}
     SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
   ```

2. **Increase timeouts in CI:**
   ```yaml
   - name: Run pre-flight check
     run: ./scripts/test-preflight-check.sh
     timeout-minutes: 10
   ```

3. **Add service health checks:**
   ```yaml
   - name: Wait for services
     run: |
       timeout 300 bash -c 'until curl -f http://localhost:8001/health; do sleep 5; done'
   ```

4. **Use Docker for consistency:**
   ```yaml
   services:
     postgres:
       image: postgres:14
       env:
         POSTGRES_PASSWORD: postgres
   ```

## Getting Help

If you've tried the solutions above and still have issues:

1. **Collect diagnostic information:**
   ```bash
   # Run pre-flight check with verbose output
   bash -x ./scripts/test-preflight-check.sh > preflight-debug.log 2>&1
   
   # Collect service logs
   tail -n 100 NestSync-backend/backend.log > backend-debug.log
   
   # Get system information
   uname -a > system-info.txt
   python --version >> system-info.txt
   node --version >> system-info.txt
   ```

2. **Create an issue with:**
   - Pre-flight check output
   - Service logs
   - System information
   - Steps to reproduce

3. **Check existing issues:**
   - Search GitHub issues for similar problems
   - Check TestSprite test report for known issues

## Additional Resources

- [Test Environment Setup Guide](../testing/test-environment-setup.md)
- [Pre-flight Check Script](../../scripts/test-preflight-check.sh)
- [Backend Documentation](../../NestSync-backend/docs/README.md)
- [Frontend Documentation](../../NestSync-frontend/docs/README.md)

---

**Last Updated**: 2025-11-10  
**Maintained By**: QA Team  
**Related**: Test Environment Setup, Pre-flight Check
