# NestSync Backend Documentation

## Overview

This directory contains technical documentation for the NestSync backend system, including API specifications, database schemas, deployment guides, and implementation details. The backend is built with FastAPI + Strawberry GraphQL, PostgreSQL with Supabase, and deployed on Railway with full PIPEDA compliance.

## Quick Links

### Most Referenced Documents
- [Premium Subscription API](./PREMIUM_SUBSCRIPTION_API.md) - Complete subscription system API reference
- [Notification System](./NOTIFICATION_SYSTEM_IMPLEMENTATION.md) - PIPEDA-compliant notification preferences
- [Reorder System](./REORDER_SYSTEM_DOCUMENTATION.md) - ML-powered automated reordering
- [GraphQL Schema](./schema.graphql) - Complete GraphQL schema definition
- [Railway Deployment](./deployment/railway.md) - Production deployment guide
- [Supabase Integration](./deployment/supabase.md) - Database and auth setup
- [Environment Configuration](./deployment/environment.md) - Environment variables reference

### By Category
- [API Documentation](#api-documentation) - GraphQL API, resolvers, and mutations
- [Database Documentation](#database-documentation) - Schema, migrations, and RLS policies
- [Deployment Documentation](#deployment-documentation) - Deployment guides and environment setup
- [Archives](#archives) - Historical implementation reports and fixes

## Documentation Structure

### API Documentation

**Location**: `./api/`

Complete GraphQL API documentation including:
- **Schema definitions** - Type system, queries, mutations, subscriptions
- **Resolver implementations** - Business logic and data fetching patterns
- **Mutation patterns** - Data modification best practices
- **Query optimization** - Performance and caching strategies
- **Error handling** - Standardized error responses

**Key API Documents**:
- [Premium Subscription API](./PREMIUM_SUBSCRIPTION_API.md) - Subscription management, trials, billing
- [Notification System API](./NOTIFICATION_SYSTEM_IMPLEMENTATION.md) - User preferences, delivery tracking
- [Reorder System API](./REORDER_SYSTEM_DOCUMENTATION.md) - ML predictions, retailer integration
- [GraphQL Schema](./schema.graphql) - Complete schema reference

**See**: [API Documentation README](./api/README.md)

### Database Documentation

**Location**: `./database/`

Database architecture and management:
- **Schema design** - Entity relationships and data models
- **Migration procedures** - Alembic migrations and version control
- **Row Level Security (RLS)** - PIPEDA-compliant access policies
- **Data integrity** - Constraints, triggers, and validation
- **Performance optimization** - Indexes, query optimization, caching

**Key Database Topics**:
- User and family data models
- Inventory and child tracking
- Subscription and billing tables
- Notification preferences and queue
- Analytics and usage logs

**See**: [Database Documentation README](./database/README.md)

### Deployment Documentation

**Location**: `./deployment/`

Deployment and infrastructure guides:
- **Railway deployment** - Production environment setup
- **Supabase integration** - Database and authentication configuration
- **Environment configuration** - Required environment variables
- **CI/CD pipelines** - Automated deployment workflows
- **Monitoring and logging** - Observability and debugging

**Key Deployment Guides**:
- [Railway Deployment Guide](./deployment/railway.md) - Production deployment steps
- [Supabase Integration Guide](./deployment/supabase.md) - Database and auth setup
- [Environment Configuration](./deployment/environment.md) - Complete env var reference

**See**: [Deployment Documentation README](./deployment/README.md)

### Archives

**Location**: `./archives/`

Historical documentation for reference:
- **Implementation reports** - Feature implementation details and decisions
- **Test reports** - Historical test results and validation
- **Bug fixes** - Resolved issues and solutions
- **Performance optimizations** - Historical performance improvements

**Archived Features**:
- [Premium Subscription Implementation](./archives/implementation-reports/premium-subscription/) - Subscription system development
- [Notification System Implementation](./archives/implementation-reports/notification-system/) - Notification feature development

**See**: [Archives README](./archives/README.md)

## Getting Started

### For New Backend Developers

1. **Understand the API**
   - Review [GraphQL Schema](./schema.graphql) for complete type system
   - Study [Premium Subscription API](./PREMIUM_SUBSCRIPTION_API.md) for API patterns
   - Check [API Documentation](./api/README.md) for resolver patterns

2. **Learn the Database**
   - Study [Database Schema](./database/README.md) for data relationships
   - Review RLS policies for PIPEDA compliance
   - Understand migration procedures

3. **Set Up Development Environment**
   - Follow [Environment Configuration](./deployment/environment.md) for local setup
   - Review [Root Setup Documentation](../../docs/setup/) for complete environment
   - Check [Supabase Integration](./deployment/supabase.md) for database setup

4. **Explore Key Features**
   - [Notification System](./NOTIFICATION_SYSTEM_IMPLEMENTATION.md) - User preferences
   - [Reorder System](./REORDER_SYSTEM_DOCUMENTATION.md) - ML predictions
   - [Premium Subscription](./PREMIUM_SUBSCRIPTION_API.md) - Billing and trials

### For API Consumers

1. **Start with the Schema**
   - Review [GraphQL Schema](./schema.graphql) for available operations
   - Check [Premium Subscription API](./PREMIUM_SUBSCRIPTION_API.md) for subscription queries
   - Study error response formats

2. **Understand Authentication**
   - Review Supabase Auth integration
   - Check JWT token handling
   - Understand RLS policy enforcement

3. **Explore Feature APIs**
   - [Subscription Management](./PREMIUM_SUBSCRIPTION_API.md) - Plans, trials, billing
   - [Notification Preferences](./NOTIFICATION_SYSTEM_IMPLEMENTATION.md) - User settings
   - [Reorder Automation](./REORDER_SYSTEM_DOCUMENTATION.md) - ML predictions

### For DevOps Engineers

1. **Deployment Setup**
   - Review [Railway Deployment Guide](./deployment/railway.md)
   - Check [Environment Configuration](./deployment/environment.md)
   - Study [Supabase Integration](./deployment/supabase.md)

2. **Infrastructure Management**
   - Review [Root Infrastructure Docs](../../docs/setup/)
   - Check monitoring and logging setup
   - Understand backup and recovery procedures

3. **Troubleshooting**
   - Check [Root Troubleshooting Guides](../../docs/troubleshooting/)
   - Review [Incident Response Docs](../../docs/incident-response/)
   - Study historical fixes in [Archives](./archives/)

## Cross-References to Root Documentation

### Setup and Configuration
- [Root Setup Documentation](../../docs/setup/) - Complete environment setup
- [Infrastructure Documentation](../../docs/setup/) - Docker, networking, services
- [Stripe Setup](../../docs/STRIPE_SETUP.md) - Payment processing configuration

### Architecture and Design
- [Architecture Documentation](../../docs/architecture/) - System architecture
- [Design Documentation](../../design-documentation/) - UX and design specifications
- [Project Documentation](../../project-documentation/) - Business strategy and architecture

### Compliance and Security
- [Compliance Documentation](../../docs/compliance/) - PIPEDA compliance requirements
- [Security Documentation](../../docs/compliance/security/) - Security policies and RLS
- [Audit Documentation](../../docs/audits/) - Compliance audits and reports

### Testing and Quality
- [Testing Documentation](../../docs/testing/) - Testing strategies and guides
- [Test Archives](../../docs/archives/test-reports/) - Historical test results
- [Troubleshooting Guides](../../docs/troubleshooting/) - Common issues and solutions

### Historical Context
- [Root Archives](../../docs/archives/) - Project-wide historical documentation
- [Implementation Reports](../../docs/archives/implementation-reports/) - Feature implementations
- [Fix Reports](../../docs/archives/fixes/) - Bug fixes and solutions

## Related Component Documentation

### Frontend Documentation
- [Frontend Documentation](../../NestSync-frontend/docs/) - Frontend implementation details
- [Frontend Components](../../NestSync-frontend/docs/components/) - UI component library
- [Frontend State Management](../../NestSync-frontend/docs/state-management/) - Apollo Client, Zustand

### Design System
- [Design Documentation](../../design-documentation/) - UX and design specifications
- [Design System](../../design-documentation/design-system/) - Visual design system
- [Feature Designs](../../design-documentation/features/) - Feature-specific designs

### Project Strategy
- [Project Documentation](../../project-documentation/) - Architecture and business strategy
- [Business Continuity](../../docs/business-continuity/) - Disaster recovery and continuity

## Contributing

### Adding New Documentation

**API Documentation**:
- Place in `api/` directory
- Update [API README](./api/README.md)
- Add cross-references to related docs
- Include code examples and error handling

**Database Documentation**:
- Place in `database/` directory
- Update [Database README](./database/README.md)
- Document schema changes and migrations
- Include RLS policy documentation

**Deployment Documentation**:
- Place in `deployment/` directory
- Update [Deployment README](./deployment/README.md)
- Include environment variables
- Document deployment procedures

**Archiving Documentation**:
- Move completed implementation reports to `archives/implementation-reports/`
- Move historical test reports to root `docs/archives/test-reports/`
- Update [Archives README](./archives/README.md)
- Add metadata frontmatter with date, category, and related docs

### Documentation Standards

- Use clear, descriptive headings
- Include code examples where applicable
- Add cross-references to related documentation
- Keep active docs current, archive historical content
- Follow markdown best practices
- Include table of contents for long documents

## Maintenance

This documentation is actively maintained by the backend development team. 

**Update Frequency**:
- API docs: Updated with each schema change
- Database docs: Updated with each migration
- Deployment docs: Updated with infrastructure changes
- Archives: Updated when features are completed

**For Questions or Updates**:
- Review this README for navigation
- Check [Root Documentation](../../docs/) for project-wide information
- Refer to [Troubleshooting Guides](../../docs/troubleshooting/) for common issues
- Contact the backend development team for clarifications

---

**Last Updated**: 2025-11-08  
**Maintained By**: Backend Development Team  
**Backend Stack**: FastAPI + Strawberry GraphQL + PostgreSQL (Supabase) + Railway
