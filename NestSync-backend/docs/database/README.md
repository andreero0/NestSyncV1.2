# Database Documentation

## Overview

NestSync uses PostgreSQL (via Supabase) as the primary database with Row Level Security (RLS) policies for data isolation and security.

## Contents

- [Schema](./schema.md) - Complete database schema and relationships
- [Migrations](./migrations.md) - Migration procedures and history
- [RLS Policies](./rls-policies.md) - Row Level Security implementation
- [Indexes](./indexes.md) - Database indexes and performance optimization
- [Constraints](./constraints.md) - Data integrity constraints

## Database Architecture

### Core Tables

#### Users & Families
- `users` - User accounts and authentication
- `families` - Family groups for data isolation
- `family_members` - User-family relationships

#### Children & Profiles
- `children` - Child profiles
- `emergency_profiles` - Emergency contact information

#### Inventory Management
- `inventory_items` - Clothing and supply inventory
- `usage_logs` - Item usage tracking
- `reorder_suggestions` - Automated reorder recommendations

#### Analytics
- `analytics_events` - User activity tracking
- `usage_analytics` - Aggregated usage statistics

#### Notifications
- `notification_preferences` - User notification settings
- `notification_logs` - Notification delivery history

#### Subscriptions
- `subscriptions` - Premium subscription records
- `payment_methods` - Stored payment information

## Data Isolation

### Family-Based RLS
All tables implement Row Level Security policies that enforce family-based data isolation:
- Users can only access data for their own family
- Shared family members can access family data based on permissions
- System administrators have override capabilities

### Security Principles
1. **Defense in Depth**: RLS at database level + application-level checks
2. **Least Privilege**: Users only access data they need
3. **Audit Trail**: All data modifications are logged
4. **Data Residency**: Canadian data stays in Canadian regions (PIPEDA compliance)

## Migrations

### Migration Strategy
- Alembic for schema migrations
- Backward-compatible changes when possible
- Data migrations separate from schema migrations
- Rollback procedures for all migrations

### Running Migrations
```bash
# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# View migration history
alembic history
```

## Performance

### Indexing Strategy
- Primary keys on all tables
- Foreign key indexes for relationships
- Composite indexes for common query patterns
- Partial indexes for filtered queries

### Query Optimization
- Use of database views for complex queries
- Materialized views for analytics
- Query result caching at application level
- Connection pooling for efficiency

## Backup & Recovery

### Backup Strategy
- Automated daily backups via Supabase
- Point-in-time recovery available
- Backup retention: 30 days
- Test restores performed monthly

### Disaster Recovery
- RTO (Recovery Time Objective): 4 hours
- RPO (Recovery Point Objective): 1 hour
- Documented recovery procedures
- Regular DR drills

## Related Documentation

- [API Documentation](../api/) - API layer using this database
- [Deployment](../deployment/) - Database deployment configuration
- [Compliance](../../../docs/compliance/) - PIPEDA and security compliance

---

[← Back to Backend Docs](../README.md)
