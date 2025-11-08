# Environment Configuration

## Overview

This document provides a comprehensive reference for all environment variables used in the NestSync backend application. Environment variables are used to configure the application for different environments (development, staging, production) and to manage sensitive credentials securely.

## Environment Files

### `.env.example`
Template file with all available configuration options. Use this as a reference when setting up new environments.

### `.env.local`
Local development environment configuration. Used for local development with Docker or local Supabase instance.

### `.env`
Production/staging environment configuration. Never commit this file to version control.

### Railway Environment Variables
For Railway deployments, environment variables are managed through the Railway dashboard or CLI. See [Railway Deployment Guide](./railway.md) for details.

## Required Variables

### Application Configuration

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `APP_NAME` | Application name | `NestSync API` | Yes |
| `API_VERSION` | API version number | `1.0.0` | Yes |
| `ENVIRONMENT` | Environment name | `production`, `development`, `local` | Yes |
| `DEBUG` | Enable debug mode | `true`, `false` | Yes |
| `TZ` | Timezone (PIPEDA compliance) | `America/Toronto` | Yes |
| `DATA_REGION` | Data residency region | `canada-central` | Yes |

### Database Configuration

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql+asyncpg://user:pass@host:5432/db` | Yes |
| `DATABASE_POOL_SIZE` | Connection pool size | `20` | No (default: 20) |
| `DATABASE_MAX_OVERFLOW` | Max overflow connections | `30` | No (default: 30) |
| `DATABASE_POOL_TIMEOUT` | Pool timeout in seconds | `30` | No (default: 30) |

**Note**: For Supabase, the `DATABASE_URL` should use the connection pooler URL for production deployments.

### Supabase Configuration

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` | Yes |
| `SUPABASE_KEY` | Supabase anon key | `eyJhbGci...` | Yes |
| `SUPABASE_SERVICE_KEY` | Supabase service role key | `eyJhbGci...` | Yes |
| `SUPABASE_JWT_SECRET` | JWT signing secret | `your-jwt-secret` | Yes |

See [Supabase Integration Guide](./supabase.md) for detailed setup instructions.

### Security Configuration

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `SECRET_KEY` | Application secret key | `your-super-secret-key` | Yes |
| `JWT_ALGORITHM` | JWT signing algorithm | `HS256` | Yes |
| `ACCESS_TOKEN_EXPIRE_HOURS` | Access token expiry | `24` | No (default: 24) |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token expiry | `30` | No (default: 30) |

**Security Best Practices**:
- Generate strong random keys: `openssl rand -base64 32`
- Rotate keys regularly (every 90 days recommended)
- Never commit secrets to version control
- Use different keys for each environment

### Password Security

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `PASSWORD_MIN_LENGTH` | Minimum password length | `8` | No (default: 8) |
| `PASSWORD_REQUIRE_UPPERCASE` | Require uppercase letters | `true` | No (default: true) |
| `PASSWORD_REQUIRE_LOWERCASE` | Require lowercase letters | `true` | No (default: true) |
| `PASSWORD_REQUIRE_NUMBERS` | Require numbers | `true` | No (default: true) |
| `PASSWORD_REQUIRE_SYMBOLS` | Require symbols | `false` | No (default: false) |

### Rate Limiting

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `RATE_LIMIT_REQUESTS` | Max requests per window | `100` | No (default: 100) |
| `RATE_LIMIT_WINDOW` | Time window in seconds | `900` | No (default: 900) |

### CORS Configuration

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `CORS_ORIGINS` | Allowed CORS origins (comma-separated) | `http://localhost:3000,https://nestsync.ca` | Yes |

**Production CORS Setup**:
```bash
# Development
CORS_ORIGINS=http://localhost:3000,http://localhost:19006

# Production
CORS_ORIGINS=https://nestsync.ca,https://app.nestsync.ca
```

## Optional Variables

### Redis Configuration

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` | No |
| `REDIS_DB` | Redis database number | `0` | No (default: 0) |
| `REDIS_PASSWORD` | Redis password | `your-password` | No |
| `REDIS_SSL` | Enable SSL for Redis | `true`, `false` | No (default: false) |

### Email Notifications

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `SENDGRID_API_KEY` | SendGrid API key | `SG.xxx` | No |

### SMS Notifications

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `TWILIO_ACCOUNT_SID` | Twilio account SID | `ACxxx` | No |
| `TWILIO_AUTH_TOKEN` | Twilio auth token | `xxx` | No |
| `TWILIO_PHONE_NUMBER` | Twilio phone number | `+1234567890` | No |

### OCR Services

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `GOOGLE_VISION_CREDENTIALS` | Path to Google Vision credentials | `/path/to/credentials.json` | No |
| `AWS_ACCESS_KEY_ID` | AWS access key | `AKIAxxx` | No |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | `xxx` | No |
| `AWS_REGION` | AWS region | `ca-central-1` | No |

### Maps API

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `GOOGLE_MAPS_API_KEY` | Google Maps API key | `AIzaxxx` | No |

### Payment Processing (Stripe)

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | `pk_test_xxx` or `pk_live_xxx` | No |
| `STRIPE_SECRET_KEY` | Stripe secret key | `sk_test_xxx` or `sk_live_xxx` | No |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | `whsec_xxx` | No |
| `STRIPE_BASIC_PRICE_ID` | Basic tier price ID | `price_xxx` | No |
| `STRIPE_PREMIUM_PRICE_ID` | Premium tier price ID | `price_xxx` | No |
| `STRIPE_FAMILY_PRICE_ID` | Family tier price ID | `price_xxx` | No |

**Stripe Environment Setup**:
- Development: Use test keys (`pk_test_`, `sk_test_`)
- Production: Use live keys (`pk_live_`, `sk_live_`)
- Create price IDs in Stripe Dashboard for each subscription tier

### Canadian Retailer Affiliates

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `AMAZON_CA_AFFILIATE_ID` | Amazon.ca affiliate ID | `xxx-20` | No |
| `WALMART_CA_PARTNER_ID` | Walmart.ca partner ID | `xxx` | No |

### Monitoring and Logging

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `SENTRY_DSN` | Sentry error tracking DSN | `https://xxx@sentry.io/xxx` | No |
| `LOG_LEVEL` | Logging level | `INFO`, `DEBUG`, `WARNING`, `ERROR` | No (default: INFO) |
| `LOG_FORMAT` | Log message format | `%(asctime)s - %(name)s - %(levelname)s - %(message)s` | No |

## PIPEDA Compliance Variables

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `DATA_RETENTION_DAYS` | Data retention period | `2555` (7 years) | Yes |
| `CONSENT_VERSION` | Consent form version | `1.0` | Yes |
| `PRIVACY_POLICY_URL` | Privacy policy URL | `https://nestsync.ca/privacy` | Yes |
| `TERMS_OF_SERVICE_URL` | Terms of service URL | `https://nestsync.ca/terms` | Yes |
| `DATA_PORTABILITY_ENABLED` | Enable data export | `true` | Yes |
| `DATA_DELETION_ENABLED` | Enable data deletion | `true` | Yes |
| `CONSENT_WITHDRAWAL_ENABLED` | Enable consent withdrawal | `true` | Yes |

**PIPEDA Requirements**:
- All user data must be stored in Canadian regions
- Data retention must comply with Canadian regulations
- Users must be able to access, export, and delete their data
- Consent must be tracked and withdrawable

See [Compliance Documentation](../../../docs/compliance/README.md) for more details.

## Feature Flags

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `ENABLE_BIOMETRIC_AUTH` | Enable biometric authentication | `true`, `false` | No (default: true) |
| `ENABLE_ANALYTICS_CONSENT` | Enable analytics consent | `true`, `false` | No (default: true) |
| `ENABLE_MARKETING_CONSENT` | Enable marketing consent | `true`, `false` | No (default: true) |

### Onboarding Configuration

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `MAX_CHILDREN_PER_USER` | Maximum children per user | `10` | No (default: 10) |
| `DEFAULT_DIAPER_BRANDS` | Default diaper brands (comma-separated) | `Huggies,Pampers,Honest` | No |

## Railway-Specific Variables

These variables are automatically set by Railway but can be overridden:

| Variable | Description | Example | Auto-Set |
|----------|-------------|---------|----------|
| `PORT` | Application port | `8000` | Yes |
| `RAILWAY_STATIC_URL` | Railway static URL | `xxx.railway.app` | Yes |
| `RAILWAY_ENVIRONMENT` | Railway environment | `production` | Yes |

## Environment Setup Examples

### Local Development

```bash
# .env.local
ENVIRONMENT=local
DEBUG=true
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nestsync
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_KEY=eyJhbGci... # From supabase start
SUPABASE_SERVICE_KEY=eyJhbGci... # From supabase start
CORS_ORIGINS=http://localhost:3000,http://localhost:19006
```

### Railway Production

```bash
# Set via Railway CLI or Dashboard
railway variables set ENVIRONMENT=production
railway variables set DEBUG=false
railway variables set DATABASE_URL=postgresql://... # From Supabase
railway variables set SUPABASE_URL=https://xxx.supabase.co
railway variables set SUPABASE_KEY=eyJhbGci...
railway variables set SUPABASE_SERVICE_KEY=eyJhbGci...
railway variables set JWT_SECRET=$(openssl rand -base64 32)
railway variables set CORS_ORIGINS=https://nestsync.ca
```

See [Railway Deployment Guide](./railway.md) for complete deployment instructions.

## Security Best Practices

### Secret Management

1. **Never commit secrets to version control**
   - Add `.env` and `.env.local` to `.gitignore`
   - Use `.env.example` as a template only

2. **Use strong random keys**
   ```bash
   # Generate secure random keys
   openssl rand -base64 32
   ```

3. **Rotate secrets regularly**
   - JWT secrets: Every 90 days
   - Database passwords: Every 180 days
   - API keys: As recommended by provider

4. **Use different secrets per environment**
   - Development, staging, and production should have unique secrets
   - Never reuse production secrets in development

### Environment-Specific Configuration

1. **Development**: Enable debug mode, verbose logging
2. **Staging**: Production-like settings, test data
3. **Production**: Optimized settings, minimal logging, strict security

## Validation

### Required Variables Check

The application validates required environment variables on startup. Missing variables will cause the application to fail with a clear error message.

### Environment Variable Testing

```bash
# Test environment configuration
python -c "from app.config.settings import settings; print(settings.dict())"

# Validate database connection
python -c "from app.config.database import test_connection; test_connection()"

# Validate Supabase connection
python -c "from app.config.supabase import test_supabase; test_supabase()"
```

## Troubleshooting

### Common Issues

**Missing Required Variables**
```
Error: SUPABASE_URL environment variable is required
```
Solution: Set the missing variable in your environment file or Railway dashboard.

**Invalid Database URL**
```
Error: Could not connect to database
```
Solution: Verify DATABASE_URL format and credentials. Check network connectivity.

**CORS Errors**
```
Error: CORS policy blocked request
```
Solution: Add your frontend URL to CORS_ORIGINS variable.

**JWT Validation Errors**
```
Error: Invalid JWT signature
```
Solution: Verify SUPABASE_JWT_SECRET matches your Supabase project settings.

## Related Documentation

- [Railway Deployment](./railway.md) - Railway platform deployment guide
- [Supabase Integration](./supabase.md) - Supabase setup and configuration
- [Database Documentation](../database/README.md) - Database schema and migrations
- [Compliance Documentation](../../../docs/compliance/README.md) - PIPEDA compliance requirements
- [Deployment Overview](./README.md) - General deployment documentation

---

[← Back to Deployment Docs](./README.md) | [← Back to Backend Docs](../README.md)
