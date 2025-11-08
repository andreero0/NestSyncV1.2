# NestSync Infrastructure Documentation

## Overview

This directory contains infrastructure configuration, deployment guides, and operational documentation for NestSync. The infrastructure is designed for Canadian data residency (PIPEDA compliance) with support for both local development and cloud deployment.

---

## Quick Navigation

### Infrastructure Guides
- **[Docker Configuration](./docker.md)** - Local development with Docker Compose
- **[Environment Configuration](./environment.md)** - Environment variables and configuration management
- **[Deployment Guide](./deployment.md)** - Production deployment procedures

### Backend-Specific Documentation
- **[Railway Deployment](../../NestSync-backend/docs/deployment/railway.md)** - Railway platform deployment
- **[Supabase Integration](../../NestSync-backend/docs/deployment/supabase.md)** - Supabase setup and configuration

### Related Documentation
- **[Setup Guides](../setup/README.md)** - Initial project setup
- **[Troubleshooting](../troubleshooting/README.md)** - Infrastructure troubleshooting
- **[Architecture](../architecture/README.md)** - System architecture overview

---

## Infrastructure Stack

### Development Environment

**Local Development Stack**:
```
┌─────────────────────────────────────────┐
│         Development Machine             │
├─────────────────────────────────────────┤
│  Frontend (Expo)                        │
│  - React Native                         │
│  - Port: 8082                           │
│  - Hot reload enabled                   │
├─────────────────────────────────────────┤
│  Backend (FastAPI)                      │
│  - Python 3.11+                         │
│  - Port: 8001                           │
│  - Auto-reload enabled                  │
├─────────────────────────────────────────┤
│  Docker Services                        │
│  - PostgreSQL (port 54320)              │
│  - Supabase (port 54322)                │
│  - Kong Gateway (port 8000)             │
│  - GoTrue Auth (port 9999)              │
└─────────────────────────────────────────┘
```

**Technology Stack**:
- **Frontend**: React Native (Expo SDK 52), TypeScript
- **Backend**: FastAPI (Python 3.11), Strawberry GraphQL
- **Database**: PostgreSQL 15 (via Supabase)
- **Authentication**: Supabase Auth (GoTrue)
- **API Gateway**: Kong
- **Caching**: Redis (optional)
- **Container Orchestration**: Docker Compose

---

### Production Environment

**Cloud Infrastructure**:
```
┌─────────────────────────────────────────┐
│         Production Stack                │
├─────────────────────────────────────────┤
│  Frontend                               │
│  - Expo Hosted / Vercel                 │
│  - CDN: CloudFlare                      │
│  - SSL/TLS: Automatic                   │
├─────────────────────────────────────────┤
│  Backend                                │
│  - Railway (Canada region)              │
│  - Auto-scaling enabled                 │
│  - Health checks configured             │
├─────────────────────────────────────────┤
│  Database                               │
│  - Supabase (Canada region)             │
│  - Connection pooling                   │
│  - Automated backups                    │
├─────────────────────────────────────────┤
│  Services                               │
│  - Stripe (Payment processing)          │
│  - SendGrid (Email)                     │
│  - Sentry (Error tracking)              │
└─────────────────────────────────────────┘
```

**Deployment Platforms**:
- **Backend Hosting**: Railway (Canada Central region)
- **Database**: Supabase (Canada region for PIPEDA compliance)
- **Frontend Hosting**: Expo Hosted / Vercel
- **CDN**: CloudFlare
- **Monitoring**: Sentry, Railway Metrics

---

## Data Residency & Compliance

### PIPEDA Compliance

**Canadian Data Residency Requirements**:
- All user data stored in Canadian data centers
- Supabase configured for Canada region
- Railway deployment in Canada Central
- Timezone: America/Toronto

**Configuration**:
```bash
# Environment variables for PIPEDA compliance
DATA_REGION=canada-central
TZ=America/Toronto
PIPEDA_COMPLIANCE=true
DATA_RETENTION_MONTHS=24
```

**See Also**:
- [PIPEDA Compliance Documentation](../compliance/pipeda/README.md)
- [Data Residency Guide](../compliance/pipeda/data-residency.md)

---

## Local Development Setup

### Prerequisites

**Required Software**:
- Docker Desktop 4.0+
- Node.js 18+
- Python 3.11+
- Git

**Optional Tools**:
- PostgreSQL client (psql)
- Redis CLI
- Postman/Insomnia (API testing)

### Quick Start

**1. Clone Repository**:
```bash
git clone https://github.com/your-org/nestsync.git
cd nestsync
```

**2. Start Docker Services**:
```bash
cd docker
./docker-dev.sh up
```

**3. Setup Backend**:
```bash
cd NestSync-backend
python -m venv venv
source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
alembic upgrade head
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

**4. Setup Frontend**:
```bash
cd NestSync-frontend
npm install
npx expo start --clear --port 8082
```

**5. Verify Setup**:
```bash
# Backend health check
curl http://localhost:8001/health

# Frontend health check
curl -I http://localhost:8082

# Database connection
psql postgresql://postgres:password@localhost:54322/postgres -c "SELECT 1"
```

**See Also**:
- [Docker Configuration Guide](./docker.md)
- [Environment Configuration](./environment.md)
- [Setup Documentation](../setup/README.md)

---

## Production Deployment

### Deployment Workflow

**1. Pre-Deployment Checklist**:
- [ ] All tests passing (unit, integration, E2E)
- [ ] Code reviewed and approved
- [ ] Environment variables configured
- [ ] Database migrations prepared
- [ ] Rollback plan documented

**2. Backend Deployment**:
```bash
cd NestSync-backend

# Deploy to Railway
railway login
railway up

# Verify deployment
railway logs
curl https://your-app.up.railway.app/health
```

**3. Frontend Deployment**:
```bash
cd NestSync-frontend

# Build for production
eas build --platform all

# Submit to app stores
eas submit --platform ios
eas submit --platform android
```

**4. Post-Deployment Verification**:
- [ ] Health checks passing
- [ ] Authentication working
- [ ] Database connections stable
- [ ] API endpoints responding
- [ ] Monitoring alerts configured

**See Also**:
- [Deployment Guide](./deployment.md)
- [Railway Deployment](../../NestSync-backend/docs/deployment/railway.md)

---

## Infrastructure Components

### Database (PostgreSQL + Supabase)

**Local Development**:
- PostgreSQL 15 via Docker
- Supabase local instance
- Port: 54322 (Supabase), 54320 (standalone)

**Production**:
- Supabase managed PostgreSQL
- Canada region deployment
- Connection pooling enabled
- Automated backups (daily)

**Connection Strings**:
```bash
# Local development
DATABASE_URL=postgresql://postgres:password@localhost:54322/postgres

# Production (Supabase)
DATABASE_URL=postgresql://postgres:[password]@db.[project-id].supabase.co:5432/postgres
```

**See Also**:
- [Supabase Integration Guide](../../NestSync-backend/docs/deployment/supabase.md)
- [Database Schema Documentation](../../NestSync-backend/docs/database/schema.md)

---

### Authentication (Supabase Auth)

**Components**:
- GoTrue authentication server
- JWT token management
- OAuth providers (Google, Apple)
- Email/password authentication

**Configuration**:
```bash
# Local development
SUPABASE_URL=http://localhost:8000
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...

# Production
SUPABASE_URL=https://[project-id].supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...
```

**Token Management**:
- Access tokens: 24 hour expiry
- Refresh tokens: 30 day expiry
- Automatic token refresh on frontend
- Secure token storage (SecureStore on mobile)

---

### API Gateway (Kong)

**Purpose**:
- Request routing
- Rate limiting
- Authentication middleware
- CORS handling

**Local Configuration**:
- Port: 8000
- Configuration: `docker/kong/kong.yml`
- Declarative configuration mode

**Production**:
- Managed by Railway/Supabase
- Automatic SSL/TLS
- DDoS protection
- Rate limiting: 100 requests/15 minutes

---

### Caching (Redis - Optional)

**Use Cases**:
- Session storage
- API response caching
- Rate limiting counters
- Real-time features

**Configuration**:
```bash
# Local development
REDIS_URL=redis://localhost:6379

# Production (Railway Redis addon)
REDIS_URL=redis://default:[password]@[host]:6379
```

**Cache Strategy**:
- TTL: 15 minutes for API responses
- Session TTL: 24 hours
- Invalidation on data mutations

---

## Monitoring & Observability

### Health Checks

**Backend Health Endpoint**:
```bash
GET /health

Response:
{
  "status": "healthy",
  "version": "1.0.0",
  "database": "connected",
  "timestamp": "2025-11-08T12:00:00Z"
}
```

**Monitoring Checks**:
- Database connectivity
- Redis connectivity (if enabled)
- Supabase API availability
- Disk space and memory usage

---

### Logging

**Log Levels**:
- **DEBUG**: Detailed diagnostic information
- **INFO**: General informational messages
- **WARNING**: Warning messages for potential issues
- **ERROR**: Error messages for failures
- **CRITICAL**: Critical failures requiring immediate attention

**Log Destinations**:
- **Development**: Console output
- **Production**: Railway logs, Sentry

**Log Format**:
```json
{
  "timestamp": "2025-11-08T12:00:00Z",
  "level": "INFO",
  "message": "User authenticated successfully",
  "user_id": "uuid",
  "request_id": "uuid"
}
```

---

### Error Tracking

**Sentry Integration**:
```bash
# Environment variable
SENTRY_DSN=https://[key]@sentry.io/[project-id]
```

**Error Capture**:
- Unhandled exceptions
- GraphQL errors
- Database errors
- Authentication failures

**Error Context**:
- User ID (if authenticated)
- Request ID
- Environment (production/staging)
- Stack trace

---

## Performance Optimization

### Backend Optimization

**Database**:
- Connection pooling (20 connections)
- Query optimization with indexes
- Eager loading for relationships
- Database query caching

**API**:
- GraphQL query batching
- DataLoader for N+1 prevention
- Response compression (gzip)
- CDN for static assets

---

### Frontend Optimization

**Bundle Size**:
- Code splitting
- Tree shaking
- Lazy loading for routes
- Image optimization

**Caching**:
- Apollo Client cache
- MMKV for persistent storage
- Service worker for offline support

**Performance Targets**:
- Time to Interactive (TTI): <3 seconds
- First Contentful Paint (FCP): <1.5 seconds
- API response time: <200ms (p95)

---

## Security

### Network Security

**HTTPS/TLS**:
- Automatic SSL certificates (Let's Encrypt)
- TLS 1.3 minimum
- HSTS headers enabled

**CORS Configuration**:
```bash
# Development
CORS_ORIGINS=http://localhost:3000,http://localhost:8082

# Production
CORS_ORIGINS=https://nestsync.ca,https://app.nestsync.ca
```

---

### Application Security

**Authentication**:
- JWT tokens with secure signing
- Token rotation on refresh
- Secure token storage
- Session management

**Authorization**:
- Row Level Security (RLS) policies
- Role-based access control (RBAC)
- Family-based data isolation
- API rate limiting

**Data Protection**:
- Encryption at rest (database)
- Encryption in transit (TLS)
- Sensitive data masking in logs
- PIPEDA-compliant data handling

**See Also**:
- [Security Documentation](../compliance/security/README.md)
- [RLS Policies](../compliance/security/rls-policies.md)

---

## Backup & Recovery

### Database Backups

**Automated Backups**:
- Daily automated backups (Supabase)
- 7-day retention for daily backups
- 4-week retention for weekly backups
- Point-in-time recovery (PITR) available

**Manual Backups**:
```bash
# Create backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore backup
psql $DATABASE_URL < backup_20251108.sql
```

---

### Disaster Recovery

**Recovery Time Objective (RTO)**: 4 hours
**Recovery Point Objective (RPO)**: 24 hours

**Recovery Procedures**:
1. Identify failure scope
2. Restore from latest backup
3. Replay transaction logs (if available)
4. Verify data integrity
5. Resume operations

**See Also**:
- [Business Continuity Documentation](../business-continuity/README.md)
- [Incident Response Guide](../incident-response/README.md)

---

## Scaling Strategy

### Horizontal Scaling

**Backend**:
- Railway auto-scaling (2-10 instances)
- Load balancing across instances
- Stateless application design
- Session storage in Redis

**Database**:
- Supabase connection pooling
- Read replicas for read-heavy operations
- Query optimization and indexing

---

### Vertical Scaling

**Resource Limits**:
- Backend: 2 CPU, 4GB RAM (baseline)
- Database: 4 CPU, 8GB RAM (baseline)
- Redis: 1 CPU, 2GB RAM (baseline)

**Scaling Triggers**:
- CPU usage >70% for 5 minutes
- Memory usage >80% for 5 minutes
- Response time >500ms (p95)

---

## Cost Optimization

### Resource Management

**Development**:
- Use Docker for local services (free)
- Supabase free tier for development
- Railway free tier for testing

**Production**:
- Railway: ~$20-50/month (backend)
- Supabase: ~$25/month (database)
- Stripe: 2.9% + $0.30 per transaction
- SendGrid: Free tier (100 emails/day)

**Cost Monitoring**:
- Track Railway usage metrics
- Monitor Supabase database size
- Review Stripe transaction fees
- Optimize API call patterns

---

## Troubleshooting

### Common Issues

**Database Connection Failures**:
```bash
# Check database status
psql $DATABASE_URL -c "SELECT 1"

# Verify connection pooling
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity"

# Restart database (Docker)
docker restart nestsync-supabase-db
```

**Authentication Issues**:
```bash
# Verify Supabase configuration
curl $SUPABASE_URL/auth/v1/health

# Check JWT secret
echo $SUPABASE_JWT_SECRET | base64 -d

# Test authentication
curl -X POST $SUPABASE_URL/auth/v1/token \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

**Deployment Failures**:
```bash
# Check Railway logs
railway logs

# Verify environment variables
railway variables

# Test health endpoint
curl https://your-app.up.railway.app/health
```

**See Also**:
- [Troubleshooting Guide](../troubleshooting/README.md)
- [Development Bottlenecks](../troubleshooting/bottlenecks.md)

---

## Related Documentation

### Infrastructure Resources
- [Docker Configuration](./docker.md) - Container orchestration
- [Environment Configuration](./environment.md) - Environment variables
- [Deployment Guide](./deployment.md) - Production deployment

### Backend Documentation
- [Railway Deployment](../../NestSync-backend/docs/deployment/railway.md)
- [Supabase Integration](../../NestSync-backend/docs/deployment/supabase.md)
- [Backend API Documentation](../../NestSync-backend/docs/api/README.md)

### Operations
- [Setup Guides](../setup/README.md)
- [Troubleshooting](../troubleshooting/README.md)
- [Testing Documentation](../testing/README.md)

---

*Last Updated: 2025-11-08*
*For deployment procedures, see [Deployment Guide](./deployment.md)*
