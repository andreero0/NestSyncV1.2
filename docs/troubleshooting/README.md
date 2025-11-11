# NestSync Troubleshooting Guide

## Overview

This directory contains active troubleshooting guides and debugging resources for NestSync development. For historical fixes and resolved issues, see the [Documentation Archives](../archives/README.md).

---

## Quick Navigation

### Active Troubleshooting Guides
- **[Development Bottlenecks](./bottlenecks.md)** - Critical issues encountered during development with solutions
- **[General Troubleshooting Guide](./TROUBLESHOOTING-GUIDE.md)** - Common setup and environment issues
- **[Test Environment Issues](./test-environment-issues.md)** - Test environment setup and common testing problems
- **[Diaper Size Mismatch](./DIAPER_SIZE_MISMATCH.md)** - Child ID selection bug in QuickLogModal

### Specific Issue Guides
- **[GraphQL Schema Mismatch](./GRAPHQL_SCHEMA_MISMATCH_FIX_REPORT.md)** - Field naming convention issues
- **[Subscription System](./SUBSCRIPTION_SYSTEM_COMPLETE_FIX_REPORT.md)** - Subscription debugging and fixes
- **[Subscription Debug Session](./SUBSCRIPTION_DEBUG_SESSION_SUMMARY.md)** - Detailed debugging session notes
- **[Trial Activation](./TRIAL_ACTIVATION_FIX_REPORT.md)** - Trial activation flow issues

---

## Common Issues by Category

### Authentication & Token Management

**Active Issues:**
- JWT token expiration and refresh flows
- Mobile token storage and SecureStore issues
- Cross-platform authentication compatibility

**Resolved Issues (Archived):**
- [Token Validation Implementation](../archives/2025/01-january/token-validation-fix.md) - Fixed empty data on native platforms
- [JWT Token Expiration Fix](../archives/fixes/authentication/jwt-token-expiration-fix.md) - Token refresh implementation
- [Mobile Token Storage Fix](../archives/fixes/authentication/mobile-token-storage-fix.md) - SecureStore integration

**See Also:**
- [Authentication Documentation](../../NestSync-backend/docs/api/authentication.md)
- [Authentication Fixes Archive](../archives/fixes/authentication/README.md)

---

### Payment & Subscription System

**Active Issues:**
- Stripe integration and payment method handling
- Subscription state management
- Trial activation and conversion flows

**Resolved Issues (Archived):**
- [Payment Method Blocker Fix](../archives/2025/01-january/payment-blocker-fix.md) - Unblocked web payment methods
- [Subscription System Complete Fix](./SUBSCRIPTION_SYSTEM_COMPLETE_FIX_REPORT.md) - Comprehensive subscription fixes

**See Also:**
- [Premium Subscription Backend](../../NestSync-backend/docs/archives/implementation-reports/premium-subscription/README.md)
- [Payment System Frontend](../../NestSync-frontend/docs/archives/implementation-reports/payment-system/README.md)

---

### GraphQL Schema & API Issues

**Active Issues:**
- snake_case vs camelCase field naming mismatches
- Query operation name mismatches
- Response structure inconsistencies

**Common Patterns:**
```graphql
# Backend returns snake_case
type NotificationPreferences {
  notifications_enabled: Boolean
  stock_alert_enabled: Boolean
}

# Frontend expects camelCase
query GetPreferences {
  notificationPreferences {
    notificationsEnabled
    stockAlertEnabled
  }
}
```

**Solutions:**
- Use field aliases in Strawberry GraphQL types
- Implement GraphQL code generation for type safety
- Add schema validation to CI/CD pipeline

**Resolved Issues (Archived):**
- [GraphQL Schema Mismatch Fix](./GRAPHQL_SCHEMA_MISMATCH_FIX_REPORT.md) - Field naming convention resolution

**See Also:**
- [GraphQL Schema Documentation](../../NestSync-backend/docs/api/graphql-schema.md)
- [Development Bottlenecks - Schema Issues](./bottlenecks.md#critical-schema-naming-convention-issues)

---

### Database & Migration Issues

**Active Issues:**
- Migration state corruption
- SQLAlchemy metadata caching
- Row Level Security (RLS) policy conflicts

**Common Commands:**
```bash
# Check migration status
cd NestSync-backend
alembic current

# Verify table existence
psql $DATABASE_URL -c "\dt table_name"

# Refresh SQLAlchemy metadata
python -c "from app.config.database import refresh_database_metadata; refresh_database_metadata()"

# Reset migrations (if needed)
alembic downgrade base
alembic upgrade head
```

**Resolved Issues (Archived):**
- Database migration state corruption (see [Development Bottlenecks](./bottlenecks.md#1-database-migration-state-corruption-p0---critical))
- SQLAlchemy metadata caching (see [Development Bottlenecks](./bottlenecks.md#2-sqlalchemy-metadata-caching-issue-p0---critical))

**See Also:**
- [Database Schema Documentation](../../NestSync-backend/docs/database/schema.md)
- [Migration Guide](../../NestSync-backend/docs/database/migrations.md)

---

### UI/UX & Frontend Issues

**Active Issues:**
- Cross-platform rendering differences
- Safe area and layout issues
- Design system compliance

**Resolved Issues (Archived):**
- [Family Modal Safe Area Fix](../archives/fixes/ui-ux/family-modal-safe-area-fix.md) - iOS safe area handling
- [Nested Text Fix](../archives/fixes/ui-ux/nested-text-fix.md) - React Native Text nesting
- [Trial Banner Fix](../archives/fixes/ui-ux/trial-banner-fix.md) - Banner visibility and positioning
- [Traffic Light Dashboard](../../NestSync-frontend/docs/archives/implementation-reports/traffic-light-dashboard/README.md) - Grid layout fixes

**See Also:**
- [Design System Documentation](../../design-documentation/design-system/README.md)
- [UI/UX Fixes Archive](../archives/fixes/ui-ux/README.md)

---

### Notification System

**Active Issues:**
- Push notification delivery
- Notification preferences synchronization
- Cross-platform notification handling

**Resolved Issues (Archived):**
- [Expo Notifications Fix](../archives/fixes/notifications/expo-notifications-fix.md) - Push notification setup
- [Notification System Implementation](../../NestSync-backend/docs/archives/implementation-reports/notification-system/README.md) - Complete system implementation

**See Also:**
- [Notification System Architecture](../../project-documentation/notification-system-architecture.md)
- [Notification Test Reports](../archives/test-reports/e2e/notification-system-e2e-test.md)

---

### Compliance & Security

**Active Issues:**
- PIPEDA data residency requirements
- RLS policy implementation
- Consent management flows

**Resolved Issues (Archived):**
- [PIPEDA Cache Isolation Fix](../archives/fixes/compliance/pipeda-cache-isolation-fix.md) - User data isolation

**See Also:**
- [PIPEDA Compliance Documentation](../compliance/pipeda/README.md)
- [Security Documentation](../compliance/security/README.md)
- [Compliance Audits](../compliance/audits/README.md)

---

## Development Environment Setup

### Prerequisites Checklist
- [ ] Node.js 18+ installed
- [ ] Python 3.11+ installed
- [ ] PostgreSQL client tools installed
- [ ] Expo CLI installed globally
- [ ] Docker Desktop installed (optional)

### Quick Start Commands
```bash
# Backend setup
cd NestSync-backend
python -m venv venv
source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
alembic upgrade head
uvicorn main:app --host 0.0.0.0 --port 8001 --reload

# Frontend setup
cd NestSync-frontend
npm install
npx expo start --clear --port 8082
```

### Environment Variables
Ensure these files exist with correct values:
- `NestSync-backend/.env.local` - Backend configuration
- `NestSync-frontend/.env.local` - Frontend configuration

**See Also:**
- [General Troubleshooting Guide](./TROUBLESHOOTING-GUIDE.md) - Detailed setup instructions
- [Environment Configuration](../infrastructure/environment.md)

---

## Testing & Validation

### Test Credentials
For consistent testing across environments:
- **Email**: `parents@nestsync.com`
- **Password**: `Shazam11#`

### Health Check Commands
```bash
# Backend health check
curl http://localhost:8001/health

# Frontend health check
curl -I http://localhost:8082

# Database connection test
psql $DATABASE_URL -c "SELECT 1"

# GraphQL introspection
curl -X POST http://localhost:8001/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ __schema { queryType { name } } }"}'
```

### Debugging Tools
- **Playwright MCP** - Browser automation and testing
- **Apollo Client DevTools** - GraphQL query inspection
- **React Native Debugger** - Mobile debugging
- **Supabase Studio** - Database inspection

**See Also:**
- [Testing Documentation](../testing/README.md)
- [Test Reports Archive](../archives/test-reports/README.md)

---

## Emergency Procedures

### Complete System Reset
If everything breaks and you need to start fresh:

```bash
# 1. Stop all processes
pkill -f "uvicorn"
pkill -f "expo"

# 2. Clean all dependencies
cd NestSync-backend && rm -rf venv
cd ../NestSync-frontend && rm -rf node_modules .expo

# 3. Recreate environment
cd ../NestSync-backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

cd ../NestSync-frontend
npm install
npx expo install --fix

# 4. Run migrations and start servers
cd ../NestSync-backend
alembic upgrade head
cd ..
./scripts/start-dev-servers.sh
```

### Rollback Procedures
- **Database**: Use `alembic downgrade` to specific revision
- **Code**: Use `git revert` or `git reset` as appropriate
- **Dependencies**: Restore from `package-lock.json` or `requirements.txt`

**See Also:**
- [General Troubleshooting Guide](./TROUBLESHOOTING-GUIDE.md#emergency-reset-procedure)

---

## Historical Context & Archives

For detailed documentation of resolved issues and implementation history:

### By Date
- [January 2025](../archives/2025/01-january/README.md) - Critical authentication and payment fixes
- [May 2025](../archives/2025/05-may/README.md) - Recent fixes and improvements

### By Category
- [Implementation Reports](../archives/implementation-reports/README.md) - Feature implementation history
- [Test Reports](../archives/test-reports/README.md) - Testing validation history
- [Fixes Archive](../archives/fixes/README.md) - Bug fix documentation
- [Compliance Audits](../compliance/audits/README.md) - Compliance audit history

### Most Referenced Archives
1. [Token Validation Fix](../archives/2025/01-january/token-validation-fix.md) - Authentication (P0)
2. [Payment Blocker Fix](../archives/2025/01-january/payment-blocker-fix.md) - Revenue Critical (P0)
3. [My Families Error Fix](../archives/2025/01-january/my-families-error-fix.md) - GraphQL (P0)

---

## Getting Help

### Documentation Resources
1. **[Main README](../../README.md)** - Project overview and getting started
2. **[CLAUDE.md](../../CLAUDE.md)** - Development patterns and guidelines
3. **[Architecture Documentation](../architecture/README.md)** - System architecture
4. **[API Documentation](../../NestSync-backend/docs/api/README.md)** - Backend API reference

### Debugging Workflow
1. **Check the logs** - Both servers output detailed error messages
2. **Verify prerequisites** - Ensure all required software is installed
3. **Test incrementally** - Start backend first, then frontend
4. **Search archives** - Check if issue was previously resolved
5. **Use test credentials** - Consistent testing with known-good data

### Common Debugging Commands
```bash
# View backend logs
cd NestSync-backend
tail -f backend.log

# View frontend logs
cd NestSync-frontend
npx expo start --clear  # Logs appear in terminal

# Check running processes
lsof -i :8001  # Backend
lsof -i :8082  # Frontend

# Database query logs
psql $DATABASE_URL -c "SELECT * FROM pg_stat_activity"
```

---

## Prevention Strategies

### Before Database Migrations
- [ ] Review migration SQL for completeness
- [ ] Test migration in development environment
- [ ] Plan rollback strategy
- [ ] Prepare table verification commands

### After Database Migrations
- [ ] Verify tables exist: `\dt table_name`
- [ ] Refresh SQLAlchemy metadata
- [ ] Test ORM model access
- [ ] Run basic CRUD operations

### GraphQL Resolver Development
- [ ] Add comprehensive error handling
- [ ] Implement default data creation logic
- [ ] Add type validation for parameters
- [ ] Test with null/missing data scenarios

### Feature Implementation
- [ ] Use direct Playwright MCP testing
- [ ] Test with real user credentials
- [ ] Collect evidence (screenshots, logs)
- [ ] Verify end-to-end functionality
- [ ] Document testing results

**See Also:**
- [Development Bottlenecks - Prevention Checklist](./bottlenecks.md#prevention-checklist)

---

---

**Last Updated**: 2025-11-11  
**Maintained By**: Development Team  
**Review Cycle**: As needed

*For historical troubleshooting documentation, see [Documentation Archives](../archives/README.md)*

[← Back to Documentation Hub](../README.md)
