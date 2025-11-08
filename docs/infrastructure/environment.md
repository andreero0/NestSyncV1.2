# Environment Configuration

## Overview

This document provides a comprehensive reference for environment configuration across the NestSync application stack (backend, frontend, and infrastructure). Environment variables are used to configure the application for different environments and manage sensitive credentials securely.

---

## Environment Files

### Backend Environment Files

**`.env.example`** - Template with all available options
- Location: `NestSync-backend/.env.example`
- Purpose: Reference for setting up new environments
- Committed to version control

**`.env.local`** - Local development configuration
- Location: `NestSync-backend/.env.local`
- Purpose: Local development with Docker/Supabase
- **Never commit to version control**

**`.env`** - Production/staging configuration
- Location: `NestSync-backend/.env`
- Purpose: Production environment variables
- **Never commit to version control**

### Frontend Environment Files

**`.env`** - Frontend configuration
- Location: `NestSync-frontend/.env`
- Purpose: Frontend API endpoints and keys
- **Never commit to version control**

**`.env.local`** - Local frontend configuration
- Location: `NestSync-frontend/.env.local`
- Purpose: Local development overrides
- **Never commit to version control**

### Cloud Platform Configuration

**Railway** - Managed via Railway dashboard or CLI
- Set via: `railway variables set KEY=value`
- See: [Railway Deployment Guide](../../NestSync-backend/docs/deployment/railway.md)

**Supabase** - Managed via Supabase dashboard
- Project settings → API → Project API keys
- See: [Supabase Integration Guide](../../NestSync-backend/docs/deployment/supabase.md)

---

## Backend Environment Variables

### Application Configuration

| Variable | Description | Example | Required | Default |
|----------|-------------|---------|----------|---------|
| `APP_NAME` | Application name | `NestSync API` | Yes | - |
| `API_VERSION` | API version number | `1.0.0` | Yes | - |
| `ENVIRONMENT` | Environment name | `production`, `development`, `local` | Yes | - |
| `DEBUG` | Enable debug mode | `true`, `false` | Yes | `false` |
| `TZ` | Timezone (PIPEDA) | `America/Toronto` | Yes | `America/Toronto` |
| `DATA_REGION` | Data residency | `canada-central` | Yes | `canada-central` |

**Example**:
```bash
APP_NAME="NestSync API"
API_VERSION="1.0.0"
ENVIRONMENT=production
DEBUG=false
TZ=America/Toronto
DATA_REGION=canada-central
```

---

### Database Configuration

| Variable | Description | Example | Required | Default |
|----------|-------------|---------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection | `postgresql+asyncpg://user:pass@host:5432/db` | Yes | - |
| `DATABASE_POOL_SIZE` | Connection pool size | `20` | No | `20` |
| `DATABASE_MAX_OVERFLOW` | Max overflow connections | `30` | No | `30` |
| `DATABASE_POOL_TIMEOUT` | Pool timeout (seconds) | `30` | No | `30` |

**Local Development**:
```bash
DATABASE_URL=postgresql://postgres:password@localhost:54322/postgres
```

**Production (Supabase)**:
```bash
DATABASE_URL=postgresql://postgres:[password]@db.[project-id].supabase.co:5432/postgres
```

**Note**: Use Supabase connection pooler URL for production deployments.

---

### Supabase Configuration

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` | Yes |
| `SUPABASE_KEY` | Supabase anon key | `eyJhbGci...` | Yes |
| `SUPABASE_SERVICE_KEY` | Service role key | `eyJhbGci...` | Yes |
| `SUPABASE_JWT_SECRET` | JWT signing secret | `your-jwt-secret` | Yes |

**Finding Supabase Credentials**:
1. Go to Supabase Dashboard
2. Select your project
3. Settings → API
4. Copy URL and keys

**Example**:
```bash
SUPABASE_URL=https://abcdefghijklmnop.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET=your-super-secret-jwt-token-with-at-least-32-characters
```

---

### Security Configuration

| Variable | Description | Example | Required | Default |
|----------|-------------|---------|----------|---------|
| `SECRET_KEY` | Application secret | `your-secret-key` | Yes | - |
| `JWT_ALGORITHM` | JWT algorithm | `HS256` | Yes | `HS256` |
| `ACCESS_TOKEN_EXPIRE_HOURS` | Token expiry | `24` | No | `24` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh expiry | `30` | No | `30` |

**Generate Secure Keys**:
```bash
# Generate random secret key
openssl rand -base64 32

# Generate JWT secret
openssl rand -hex 32
```

**Security Best Practices**:
- Use different keys for each environment
- Rotate keys every 90 days
- Never commit secrets to version control
- Use strong random keys (32+ characters)

---

### CORS Configuration

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `CORS_ORIGINS` | Allowed origins (comma-separated) | `http://localhost:3000,https://nestsync.ca` | Yes |

**Development**:
```bash
CORS_ORIGINS=http://localhost:3000,http://localhost:8082,http://localhost:19006
```

**Production**:
```bash
CORS_ORIGINS=https://nestsync.ca,https://app.nestsync.ca
```

---

### Rate Limiting

| Variable | Description | Example | Required | Default |
|----------|-------------|---------|----------|---------|
| `RATE_LIMIT_REQUESTS` | Max requests per window | `100` | No | `100` |
| `RATE_LIMIT_WINDOW` | Window (seconds) | `900` | No | `900` |

**Example**:
```bash
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=900  # 15 minutes
```

---

### Optional Services

#### Redis (Caching)

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` | No |
| `REDIS_DB` | Database number | `0` | No |
| `REDIS_PASSWORD` | Redis password | `your-password` | No |
| `REDIS_SSL` | Enable SSL | `true`, `false` | No |

#### Email (SendGrid)

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `SENDGRID_API_KEY` | SendGrid API key | `SG.xxx` | No |

#### SMS (Twilio)

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `TWILIO_ACCOUNT_SID` | Account SID | `ACxxx` | No |
| `TWILIO_AUTH_TOKEN` | Auth token | `xxx` | No |
| `TWILIO_PHONE_NUMBER` | Phone number | `+1234567890` | No |

#### Payment (Stripe)

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `STRIPE_PUBLISHABLE_KEY` | Publishable key | `pk_test_xxx` or `pk_live_xxx` | No |
| `STRIPE_SECRET_KEY` | Secret key | `sk_test_xxx` or `sk_live_xxx` | No |
| `STRIPE_WEBHOOK_SECRET` | Webhook secret | `whsec_xxx` | No |
| `STRIPE_BASIC_PRICE_ID` | Basic tier price | `price_xxx` | No |
| `STRIPE_PREMIUM_PRICE_ID` | Premium tier price | `price_xxx` | No |

**Stripe Setup**:
- Development: Use test keys (`pk_test_`, `sk_test_`)
- Production: Use live keys (`pk_live_`, `sk_live_`)
- Create price IDs in Stripe Dashboard

#### Monitoring (Sentry)

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `SENTRY_DSN` | Sentry DSN | `https://xxx@sentry.io/xxx` | No |
| `LOG_LEVEL` | Logging level | `INFO`, `DEBUG`, `WARNING`, `ERROR` | No |

---

## Frontend Environment Variables

### API Configuration

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `EXPO_PUBLIC_API_URL` | Backend API URL | `http://localhost:8001` | Yes |
| `EXPO_PUBLIC_GRAPHQL_URL` | GraphQL endpoint | `http://localhost:8001/graphql` | Yes |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase URL | `https://xxx.supabase.co` | Yes |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | `eyJhbGci...` | Yes |

**Local Development**:
```bash
EXPO_PUBLIC_API_URL=http://localhost:8001
EXPO_PUBLIC_GRAPHQL_URL=http://localhost:8001/graphql
EXPO_PUBLIC_SUPABASE_URL=http://localhost:8000
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

**Production**:
```bash
EXPO_PUBLIC_API_URL=https://api.nestsync.ca
EXPO_PUBLIC_GRAPHQL_URL=https://api.nestsync.ca/graphql
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

---

### Stripe Configuration

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe key | `pk_test_xxx` or `pk_live_xxx` | Yes |

**Example**:
```bash
# Development
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51234567890abcdef

# Production
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51234567890abcdef
```

---

### Feature Flags

| Variable | Description | Example | Required | Default |
|----------|-------------|---------|----------|---------|
| `EXPO_PUBLIC_ENABLE_ANALYTICS` | Enable analytics | `true`, `false` | No | `true` |
| `EXPO_PUBLIC_ENABLE_SENTRY` | Enable Sentry | `true`, `false` | No | `true` |
| `EXPO_PUBLIC_ENABLE_BIOMETRICS` | Enable biometric auth | `true`, `false` | No | `true` |

---

## PIPEDA Compliance Variables

### Data Residency

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `DATA_REGION` | Data storage region | `canada-central` | Yes |
| `TZ` | Timezone | `America/Toronto` | Yes |
| `PIPEDA_COMPLIANCE` | Enable PIPEDA mode | `true` | Yes |

### Data Retention

| Variable | Description | Example | Required | Default |
|----------|-------------|---------|----------|---------|
| `DATA_RETENTION_DAYS` | Retention period | `2555` (7 years) | Yes | `2555` |
| `DATA_RETENTION_MONTHS` | Retention (months) | `24` | No | `24` |

### User Rights

| Variable | Description | Example | Required | Default |
|----------|-------------|---------|----------|---------|
| `DATA_PORTABILITY_ENABLED` | Enable data export | `true` | Yes | `true` |
| `DATA_DELETION_ENABLED` | Enable data deletion | `true` | Yes | `true` |
| `CONSENT_WITHDRAWAL_ENABLED` | Enable consent withdrawal | `true` | Yes | `true` |

### Compliance URLs

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `PRIVACY_POLICY_URL` | Privacy policy URL | `https://nestsync.ca/privacy` | Yes |
| `TERMS_OF_SERVICE_URL` | Terms URL | `https://nestsync.ca/terms` | Yes |
| `CONSENT_VERSION` | Consent form version | `1.0` | Yes |

**See Also**: [PIPEDA Compliance Documentation](../compliance/pipeda/README.md)

---

## Environment Setup Examples

### Local Development

**Backend** (`.env.local`):
```bash
# Application
ENVIRONMENT=local
DEBUG=true
APP_NAME="NestSync API"
API_VERSION="1.0.0"

# Database
DATABASE_URL=postgresql://postgres:password@localhost:54322/postgres

# Supabase
SUPABASE_URL=http://localhost:8000
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET=super-secret-jwt-token-with-at-least-32-characters-long

# Security
SECRET_KEY=dev-secret-key-change-in-production
JWT_ALGORITHM=HS256

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:8082,http://localhost:19006

# PIPEDA
DATA_REGION=canada-central
TZ=America/Toronto
PIPEDA_COMPLIANCE=true
```

**Frontend** (`.env.local`):
```bash
# API
EXPO_PUBLIC_API_URL=http://localhost:8001
EXPO_PUBLIC_GRAPHQL_URL=http://localhost:8001/graphql

# Supabase
EXPO_PUBLIC_SUPABASE_URL=http://localhost:8000
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stripe (test mode)
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51234567890abcdef

# Feature flags
EXPO_PUBLIC_ENABLE_ANALYTICS=false
EXPO_PUBLIC_ENABLE_SENTRY=false
```

---

### Production (Railway)

**Set via Railway CLI**:
```bash
# Application
railway variables set ENVIRONMENT=production
railway variables set DEBUG=false
railway variables set APP_NAME="NestSync API"
railway variables set API_VERSION="1.0.0"

# Database (from Supabase)
railway variables set DATABASE_URL="postgresql://postgres:[password]@db.[project-id].supabase.co:5432/postgres"

# Supabase
railway variables set SUPABASE_URL="https://[project-id].supabase.co"
railway variables set SUPABASE_KEY="eyJhbGci..."
railway variables set SUPABASE_SERVICE_KEY="eyJhbGci..."
railway variables set SUPABASE_JWT_SECRET="$(openssl rand -base64 32)"

# Security (generate new keys)
railway variables set SECRET_KEY="$(openssl rand -base64 32)"
railway variables set JWT_ALGORITHM="HS256"

# CORS
railway variables set CORS_ORIGINS="https://nestsync.ca,https://app.nestsync.ca"

# PIPEDA
railway variables set DATA_REGION="canada-central"
railway variables set TZ="America/Toronto"
railway variables set PIPEDA_COMPLIANCE="true"
railway variables set DATA_RETENTION_DAYS="2555"

# Stripe (live mode)
railway variables set STRIPE_SECRET_KEY="sk_live_..."
railway variables set STRIPE_PUBLISHABLE_KEY="pk_live_..."
railway variables set STRIPE_WEBHOOK_SECRET="whsec_..."

# Monitoring
railway variables set SENTRY_DSN="https://[key]@sentry.io/[project-id]"
railway variables set LOG_LEVEL="INFO"
```

---

## Security Best Practices

### Secret Management

**1. Never Commit Secrets**
```bash
# Add to .gitignore
.env
.env.local
.env.production
*.env
```

**2. Generate Strong Keys**
```bash
# Generate 32-byte random key
openssl rand -base64 32

# Generate hex key
openssl rand -hex 32

# Generate UUID
uuidgen
```

**3. Rotate Secrets Regularly**
- JWT secrets: Every 90 days
- Database passwords: Every 180 days
- API keys: As recommended by provider
- Stripe keys: When compromised

**4. Use Different Secrets Per Environment**
- Development: Test/development keys
- Staging: Staging-specific keys
- Production: Production keys only

**5. Secure Storage**
- Use environment variables (not config files)
- Use secret management services (Railway, AWS Secrets Manager)
- Never log secrets
- Mask secrets in error messages

---

## Validation & Testing

### Validate Configuration

**Backend**:
```bash
cd NestSync-backend

# Test configuration loading
python -c "from app.config.settings import settings; print(settings.dict())"

# Test database connection
python -c "from app.config.database import test_connection; test_connection()"

# Test Supabase connection
python -c "from app.config.supabase import test_supabase; test_supabase()"
```

**Frontend**:
```bash
cd NestSync-frontend

# Check environment variables
npx expo config --type public

# Test API connection
curl $EXPO_PUBLIC_API_URL/health
```

---

### Health Checks

**Backend Health**:
```bash
curl http://localhost:8001/health

# Expected response:
{
  "status": "healthy",
  "version": "1.0.0",
  "database": "connected",
  "timestamp": "2025-11-08T12:00:00Z"
}
```

**Database Connection**:
```bash
psql $DATABASE_URL -c "SELECT 1"
```

**Supabase Connection**:
```bash
curl $SUPABASE_URL/auth/v1/health
```

---

## Troubleshooting

### Common Issues

**Missing Required Variables**:
```
Error: SUPABASE_URL environment variable is required
```
**Solution**: Set the missing variable in your `.env` file or Railway dashboard.

**Invalid Database URL**:
```
Error: Could not connect to database
```
**Solution**: Verify `DATABASE_URL` format and credentials. Check network connectivity.

**CORS Errors**:
```
Error: CORS policy blocked request from origin 'http://localhost:3000'
```
**Solution**: Add your frontend URL to `CORS_ORIGINS` variable.

**JWT Validation Errors**:
```
Error: Invalid JWT signature
```
**Solution**: Verify `SUPABASE_JWT_SECRET` matches your Supabase project settings.

**Stripe Errors**:
```
Error: Invalid API key provided
```
**Solution**: Verify you're using the correct key for your environment (test vs live).

---

## Related Documentation

### Backend Configuration
- [Railway Deployment](../../NestSync-backend/docs/deployment/railway.md)
- [Supabase Integration](../../NestSync-backend/docs/deployment/supabase.md)
- [Backend Environment Details](../../NestSync-backend/docs/deployment/environment.md)

### Infrastructure
- [Infrastructure Overview](./README.md)
- [Docker Configuration](./docker.md)
- [Deployment Guide](./deployment.md)

### Compliance
- [PIPEDA Compliance](../compliance/pipeda/README.md)
- [Security Documentation](../compliance/security/README.md)
- [Data Residency Guide](../compliance/pipeda/data-residency.md)

---

*Last Updated: 2025-11-08*
*For deployment procedures, see [Deployment Guide](./deployment.md)*
