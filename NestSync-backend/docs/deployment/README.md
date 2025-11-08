# Deployment Documentation

## Overview

NestSync backend is deployed on Railway with Supabase as the database provider. This documentation covers deployment procedures, environment configuration, and infrastructure management for PIPEDA-compliant Canadian deployment.

## Contents

- [Railway Deployment](./railway.md) - Railway platform deployment guide with step-by-step instructions
- [Supabase Integration](./supabase.md) - Database and authentication setup with CLI tools
- [Environment Configuration](./environment.md) - Complete environment variables reference and security best practices

## Quick Links

- **First Time Setup**: Start with [Railway Deployment](./railway.md) → [Supabase Integration](./supabase.md) → [Environment Configuration](./environment.md)
- **Environment Variables**: See [Environment Configuration](./environment.md) for complete reference
- **Database Setup**: See [Supabase Integration](./supabase.md) and [Database Documentation](../database/README.md)
- **Troubleshooting**: Check deployment guides for common issues and solutions

## Deployment Architecture

### Production Environment
- **Platform**: Railway
- **Database**: Supabase (PostgreSQL)
- **Region**: Canada (PIPEDA compliance)
- **CDN**: Railway edge network
- **Monitoring**: Railway metrics + custom logging

### Staging Environment
- **Platform**: Railway (separate project)
- **Database**: Supabase (separate instance)
- **Purpose**: Pre-production testing and validation

### Development Environment
- **Platform**: Local Docker or Railway preview
- **Database**: Local PostgreSQL or Supabase dev instance
- **Purpose**: Local development and testing

## Quick Start

### Initial Deployment

1. **Set up Railway project**
   ```bash
   railway login
   railway init
   railway link
   ```

2. **Configure environment variables**
   ```bash
   railway variables set DATABASE_URL=<supabase_url>
   railway variables set JWT_SECRET=<secret>
   # ... additional variables
   ```

3. **Deploy application**
   ```bash
   railway up
   ```

### Updating Deployment

```bash
# Deploy latest changes
git push origin main

# Railway automatically deploys on push to main branch
```

## Environment Variables

### Required Variables
- `DATABASE_URL` - Supabase connection string
- `JWT_SECRET` - JWT signing secret
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_KEY` - Supabase anon/service key
- `DATA_REGION` - Canadian data residency (canada-central)
- `TZ` - Timezone (America/Toronto)

### Optional Variables
- `LOG_LEVEL` - Logging verbosity (default: INFO)
- `CORS_ORIGINS` - Allowed CORS origins
- `RATE_LIMIT_ENABLED` - Enable rate limiting (default: true)
- `STRIPE_SECRET_KEY` - Stripe payment processing
- `SENTRY_DSN` - Error monitoring

See [Environment Configuration](./environment.md) for complete list with descriptions and examples.

## Database Migrations

### Production Migrations

```bash
# Connect to production database
railway run alembic upgrade head

# Rollback if needed
railway run alembic downgrade -1
```

### Migration Best Practices
1. Test migrations in staging first
2. Create rollback plan before applying
3. Backup database before major migrations
4. Monitor application during migration
5. Verify data integrity after migration

## Monitoring & Logging

### Application Logs
```bash
# View real-time logs
railway logs

# View logs for specific deployment
railway logs --deployment <deployment-id>
```

### Metrics
- Request rate and latency
- Error rates and types
- Database connection pool usage
- Memory and CPU utilization

### Alerts
- High error rate (>5%)
- Slow response time (>2s p95)
- Database connection issues
- Memory/CPU threshold exceeded

## Rollback Procedures

### Application Rollback
```bash
# Rollback to previous deployment
railway rollback
```

### Database Rollback
```bash
# Rollback database migration
railway run alembic downgrade -1
```

## Security

### Secrets Management
- All secrets stored in Railway environment variables
- Secrets never committed to repository
- Rotation schedule for sensitive credentials
- Audit log of secret access

### Network Security
- HTTPS only (TLS 1.3)
- CORS configured for known origins
- Rate limiting enabled
- DDoS protection via Railway

## Troubleshooting

### Common Issues

**Deployment Fails**
1. Check Railway logs for errors
2. Verify environment variables are set
3. Check database connectivity
4. Review recent code changes

**Database Connection Issues**
1. Verify DATABASE_URL is correct
2. Check Supabase project status
3. Review connection pool settings
4. Check network connectivity

**Performance Issues**
1. Review application metrics
2. Check database query performance
3. Analyze slow query logs
4. Review resource utilization

## PIPEDA Compliance

All deployment configurations maintain PIPEDA compliance for Canadian data residency:

- **Data Region**: All data stored in Canadian regions (canada-central)
- **Timezone**: Canadian timezone (America/Toronto) for accurate timestamps
- **Data Retention**: Configurable retention periods per PIPEDA requirements
- **User Rights**: Data portability, deletion, and consent withdrawal enabled

See [Compliance Documentation](../../../docs/compliance/README.md) for detailed compliance requirements.

## Related Documentation

- [API Documentation](../api/) - API implementation details
- [Database Documentation](../database/) - Database schema and migrations
- [Compliance Documentation](../../../docs/compliance/README.md) - PIPEDA compliance requirements
- [Root Setup Guide](../../../docs/setup/) - Initial project setup
- [Infrastructure Documentation](../../../docs/infrastructure/) - Infrastructure overview

---

[← Back to Backend Docs](../README.md)
