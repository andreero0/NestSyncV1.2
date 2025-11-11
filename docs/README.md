# NestSync Documentation

## Overview

Welcome to the NestSync documentation hub. This directory contains comprehensive technical documentation, guides, and resources for developing, deploying, and maintaining the NestSync application.

---

## Quick Navigation

### Getting Started
- **[Setup Guides](./setup/README.md)** - Initial project setup and onboarding
- **[Troubleshooting](./troubleshooting/README.md)** - Common issues and solutions
- **[Development Bottlenecks](./troubleshooting/bottlenecks.md)** - Critical issues and prevention strategies

### Core Documentation
- **[Product Specification](./PRODUCT_SPECIFICATION.md)** - Complete product definition and strategy
- **[Architecture](./architecture/README.md)** - System architecture and design patterns
- **[Testing](./testing/README.md)** - Testing strategies and methodologies
- **[Infrastructure](./infrastructure/README.md)** - Deployment and infrastructure configuration
- **[Security](./security/README.md)** - Security scanning, vulnerability management, and suppressions
- **[Compliance](./compliance/README.md)** - PIPEDA and security compliance

### Component-Specific Documentation
- **[Backend Documentation](../NestSync-backend/docs/README.md)** - Backend API, database, and deployment
- **[Frontend Documentation](../NestSync-frontend/docs/README.md)** - Frontend components, screens, and state management
- **[Design Documentation](../design-documentation/README.md)** - UX design and design system

### Historical Documentation
- **[Documentation Archives](./archives/README.md)** - Historical implementation reports and test results

---

## Documentation Structure

```
docs/
├── README.md                          # This file - main navigation hub
│
├── setup/                             # Setup and onboarding guides
│   ├── README.md
│   └── [setup guides]
│
├── architecture/                      # System architecture
│   ├── README.md
│   └── [architecture docs]
│
├── troubleshooting/                   # Debugging and issue resolution
│   ├── README.md
│   ├── bottlenecks.md                # Critical development issues
│   ├── TROUBLESHOOTING-GUIDE.md      # General troubleshooting
│   └── [specific issue guides]
│
├── testing/                           # Testing documentation
│   ├── README.md
│   ├── emergency-flows-test-strategy.md
│   └── [test reports and guides]
│
├── infrastructure/                    # Infrastructure and deployment
│   ├── README.md
│   ├── docker.md                     # Docker configuration
│   ├── environment.md                # Environment variables
│   └── deployment.md                 # Deployment procedures
│
├── compliance/                        # PIPEDA and security
│   ├── README.md
│   ├── pipeda/                       # PIPEDA compliance
│   ├── security/                     # Security documentation
│   └── audits/                       # Compliance audits
│
├── archives/                          # Historical documentation
│   ├── README.md
│   ├── 2025/                         # Year-based organization
│   ├── implementation-reports/       # Feature implementations
│   ├── test-reports/                 # Test validation results
│   ├── fixes/                        # Bug fix documentation
│   └── audits/                       # Historical audits
│
├── business-continuity/              # Disaster recovery
├── incident-response/                # Incident management
└── audits/                           # System audits
```

---

## Documentation by Role

### For Developers

**Getting Started**:
1. [Setup Guides](./setup/README.md) - Environment setup
2. [Troubleshooting Guide](./troubleshooting/TROUBLESHOOTING-GUIDE.md) - Common issues
3. [Development Bottlenecks](./troubleshooting/bottlenecks.md) - Known issues and solutions

**Development Resources**:
- [Architecture Documentation](./architecture/README.md) - System design
- [Backend API Documentation](../NestSync-backend/docs/api/README.md) - API reference
- [Frontend Component Documentation](../NestSync-frontend/docs/components/README.md) - Component library
- [Testing Documentation](./testing/README.md) - Testing strategies

**Infrastructure**:
- [Docker Configuration](./infrastructure/docker.md) - Local development
- [Environment Configuration](./infrastructure/environment.md) - Environment variables
- [Deployment Guide](./infrastructure/deployment.md) - Production deployment

---

### For QA Engineers

**Testing Resources**:
- [Testing Overview](./testing/README.md) - Testing methodology
- [Emergency Flows Test Strategy](./testing/emergency-flows-test-strategy.md) - Critical feature testing
- [Test Reports Archive](./archives/test-reports/README.md) - Historical test results

**Test Credentials**:
- Email: `parents@nestsync.com`
- Password: `Shazam11#`

**Testing Tools**:
- Playwright for E2E testing
- Jest for unit testing
- pytest for backend testing

---

### For DevOps Engineers

**Infrastructure**:
- [Infrastructure Overview](./infrastructure/README.md) - Complete infrastructure guide
- [Docker Configuration](./infrastructure/docker.md) - Container orchestration
- [Environment Configuration](./infrastructure/environment.md) - Environment variables
- [Railway Deployment](../NestSync-backend/docs/deployment/railway.md) - Cloud deployment
- [Supabase Integration](../NestSync-backend/docs/deployment/supabase.md) - Database setup

**Monitoring & Operations**:
- [Business Continuity](./business-continuity/README.md) - Disaster recovery
- [Incident Response](./incident-response/README.md) - Incident management
- [Troubleshooting](./troubleshooting/README.md) - Operational issues

---

### For Compliance Officers

**Compliance Documentation**:
- [PIPEDA Compliance](./compliance/pipeda/README.md) - Canadian data privacy
- [Security Documentation](./compliance/security/README.md) - Security measures
- [Compliance Audits](./compliance/audits/README.md) - Audit history

**Key Compliance Features**:
- Canadian data residency (all data in Canada)
- Row Level Security (RLS) policies
- Consent management and tracking
- Data portability and deletion
- Audit trails

---

### For Product Managers

**Product Documentation**:
- [Product Specification](./PRODUCT_SPECIFICATION.md) - Complete product definition (START HERE)
- [Design Documentation](../design-documentation/README.md) - UX and design system
- [Feature Architecture](./architecture/README.md) - System capabilities
- [Implementation Reports](./archives/implementation-reports/README.md) - Feature history

**Business Resources**:
- [Main README](../README.md) - Business model overview
- [Project Documentation](../project-documentation/README.md) - Business strategy

---

### For System Architects

**Architecture Resources**:
- [Architecture Documentation](./architecture/README.md) - System architecture
- [Backend Architecture](../NestSync-backend/docs/README.md) - Backend design
- [Frontend Architecture](../NestSync-frontend/docs/README.md) - Frontend design
- [Infrastructure Architecture](./infrastructure/README.md) - Infrastructure design

**Design Patterns**:
- GraphQL API design
- Row Level Security (RLS)
- Family-based data isolation
- PIPEDA-compliant architecture

---

## Key Documentation Areas

### Setup & Onboarding

**New Developer Setup**:
1. Clone repository
2. Install prerequisites (Docker, Node.js, Python)
3. Start Docker services: `cd docker && ./docker-dev.sh up`
4. Setup backend: `cd NestSync-backend && pip install -r requirements.txt`
5. Setup frontend: `cd NestSync-frontend && npm install`
6. Run migrations: `cd NestSync-backend && alembic upgrade head`
7. Start development servers

**See**: [Setup Documentation](./setup/README.md)

---

### Architecture

**System Components**:
- **Frontend**: React Native (Expo SDK 52), TypeScript
- **Backend**: FastAPI, Strawberry GraphQL, Python 3.11
- **Database**: PostgreSQL 15 (Supabase)
- **Authentication**: Supabase Auth (GoTrue)
- **Infrastructure**: Docker, Railway, Supabase

**Architecture Patterns**:
- GraphQL API with Strawberry
- Row Level Security (RLS) for data isolation
- Family-based multi-tenancy
- PIPEDA-compliant data handling

**See**: [Architecture Documentation](./architecture/README.md)

---

### Troubleshooting

**Common Issues**:
- Authentication and token management
- Database connection and migrations
- GraphQL schema mismatches
- Cross-platform compatibility
- Docker and environment setup

**Quick Fixes**:
```bash
# Backend health check
curl http://localhost:8001/health

# Database connection test
psql postgresql://postgres:password@localhost:54322/postgres -c "SELECT 1"

# Clear frontend cache
cd NestSync-frontend && npx expo start --clear

# Restart Docker services
cd docker && ./docker-dev.sh restart
```

**See**: [Troubleshooting Guide](./troubleshooting/README.md)

---

### Testing

**Test Categories**:
- **Unit Tests**: Component and function testing
- **Integration Tests**: API and database testing
- **E2E Tests**: Full user journey testing (Playwright)
- **Visual Tests**: UI consistency testing
- **Compliance Tests**: PIPEDA validation

**Running Tests**:
```bash
# Backend tests
cd NestSync-backend && pytest

# Frontend tests
cd NestSync-frontend && npm test

# E2E tests
cd tests && npx playwright test
```

**See**: [Testing Documentation](./testing/README.md)

---

### Infrastructure

**Local Development**:
- Docker Compose for services
- PostgreSQL + Supabase
- Kong Gateway
- GoTrue Auth

**Production Deployment**:
- Railway (backend hosting)
- Supabase (database)
- Expo Hosted (frontend)
- CloudFlare (CDN)

**Key Configuration**:
- Environment variables
- Database connection strings
- API endpoints
- CORS settings

**See**: [Infrastructure Documentation](./infrastructure/README.md)

---

### Compliance

**PIPEDA Requirements**:
- Canadian data residency
- User consent management
- Data portability
- Right to deletion
- Audit trails

**Security Measures**:
- Row Level Security (RLS)
- JWT authentication
- Encryption at rest and in transit
- Rate limiting
- CORS protection

**See**: [Compliance Documentation](./compliance/README.md)

---

## Historical Documentation

### Archives

The archives contain historical documentation that may be referenced but is not actively maintained:

**By Date**:
- [January 2025](./archives/2025/01-january/README.md) - Critical authentication and payment fixes
- [May 2025](./archives/2025/05-may/README.md) - Recent improvements

**By Category**:
- [Implementation Reports](./archives/implementation-reports/README.md) - Feature implementation history
- [Test Reports](./archives/test-reports/README.md) - Testing validation results
- [Fixes](./archives/fixes/README.md) - Bug fix documentation
- [Audits](./archives/audits/README.md) - Historical compliance audits

**Most Referenced Archives**:
1. [Token Validation Fix](./archives/2025/01-january/token-validation-fix.md) - Authentication (P0)
2. [Payment Blocker Fix](./archives/2025/01-january/payment-blocker-fix.md) - Revenue Critical (P0)
3. [My Families Error Fix](./archives/2025/01-january/my-families-error-fix.md) - GraphQL (P0)

**See**: [Documentation Archives](./archives/README.md)

---

## Quick Reference

### Essential Commands

**Development**:
```bash
# Start all services
cd docker && ./docker-dev.sh up

# Backend server
cd NestSync-backend && uvicorn main:app --reload --port 8001

# Frontend server
cd NestSync-frontend && npx expo start --port 8082

# Database migrations
cd NestSync-backend && alembic upgrade head
```

**Testing**:
```bash
# Backend tests
cd NestSync-backend && pytest

# Frontend tests
cd NestSync-frontend && npm test

# E2E tests
cd tests && npx playwright test
```

**Health Checks**:
```bash
# Backend
curl http://localhost:8001/health

# Database
psql postgresql://postgres:password@localhost:54322/postgres -c "SELECT 1"

# Frontend
curl -I http://localhost:8082
```

---

### Test Credentials

**Primary Test Account**:
- Email: `parents@nestsync.com`
- Password: `Shazam11#`

---

### Important URLs

**Local Development**:
- Frontend: http://localhost:8082
- Backend: http://localhost:8001
- GraphQL Playground: http://localhost:8001/graphql
- Supabase: http://localhost:8000
- Database: postgresql://postgres:password@localhost:54322/postgres

**Production**:
- Frontend: https://nestsync.ca
- Backend: https://api.nestsync.ca
- GraphQL: https://api.nestsync.ca/graphql

---

## Contributing to Documentation

### Documentation Standards

**File Naming**:
- Use kebab-case for file names: `my-document.md`
- Use descriptive names: `authentication-troubleshooting.md`
- Include dates for reports: `test-report-20251108.md`

**Document Structure**:
- Start with overview/introduction
- Use clear section headers
- Include code examples where relevant
- Add cross-references to related docs
- Include "See Also" section at end

**Markdown Guidelines**:
- Use relative links for internal references
- Include alt text for images
- Use code blocks with language specification
- Use tables for structured data
- Use lists for sequential steps

---

### Adding New Documentation

**1. Determine Category**:
- Setup, Architecture, Troubleshooting, Testing, Infrastructure, or Compliance?
- Active documentation or historical archive?

**2. Create Document**:
- Follow naming conventions
- Use appropriate template
- Include metadata (date, author, status)

**3. Update Indexes**:
- Add entry to relevant README.md
- Update this main README if needed
- Add cross-references to related docs

**4. Review**:
- Check for broken links
- Verify code examples work
- Ensure clarity and completeness

---

## Documentation Maintenance

### Regular Updates

**Monthly**:
- Review and update troubleshooting guides
- Archive completed implementation reports
- Update test documentation with new strategies

**Quarterly**:
- Review architecture documentation for accuracy
- Update compliance documentation
- Audit and clean up outdated documentation

**Annually**:
- Major documentation restructuring if needed
- Archive old year's documentation
- Update all "Last Updated" timestamps

---

### Documentation Health

**Quality Metrics**:
- All links resolve correctly
- Code examples are tested and working
- Documentation is up-to-date (< 3 months old)
- Cross-references are accurate
- No duplicate content

**Validation**:
```bash
# Check for broken links
find docs -name "*.md" -exec grep -H "\[.*\](.*)" {} \;

# Find outdated docs (not updated in 6 months)
find docs -name "*.md" -mtime +180

# Check for duplicate content
# (manual review recommended)
```

---

## Getting Help

### Documentation Questions

**For Technical Issues**:
1. Check [Troubleshooting Guide](./troubleshooting/README.md)
2. Search [Documentation Archives](./archives/README.md)
3. Review [Development Bottlenecks](./troubleshooting/bottlenecks.md)

**For Setup Issues**:
1. Follow [Setup Guides](./setup/README.md)
2. Check [Infrastructure Documentation](./infrastructure/README.md)
3. Review [Environment Configuration](./infrastructure/environment.md)

**For Compliance Questions**:
1. Review [PIPEDA Documentation](./compliance/pipeda/README.md)
2. Check [Security Documentation](./compliance/security/README.md)
3. Review [Compliance Audits](./compliance/audits/README.md)

---

## Related Resources

### External Documentation
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Strawberry GraphQL](https://strawberry.rocks/)
- [React Native](https://reactnative.dev/)
- [Expo Documentation](https://docs.expo.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [Railway Documentation](https://docs.railway.app/)

### Project Resources
- [Main README](../README.md) - Project overview
- [CLAUDE.md](../CLAUDE.md) - Development guide
- [Design Documentation](../design-documentation/README.md) - UX and design
- [Project Documentation](../project-documentation/README.md) - Business strategy

---

*Last Updated: 2025-11-08*
*For questions or suggestions about documentation, please create an issue or pull request.*
