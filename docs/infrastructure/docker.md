# Docker Configuration Guide

## Overview

NestSync uses Docker Compose for local development to provide a consistent, reproducible environment across all development machines. This guide covers Docker setup, configuration, and troubleshooting.

---

## Docker Services

### Service Architecture

```
┌─────────────────────────────────────────┐
│         Docker Network                  │
│         (nestsync-network)              │
├─────────────────────────────────────────┤
│  PostgreSQL (nestsync-db)               │
│  - Port: 54320                          │
│  - Volume: postgres_data                │
├─────────────────────────────────────────┤
│  Supabase PostgreSQL (supabase-db)      │
│  - Port: 54322                          │
│  - Volume: supabase_data                │
├─────────────────────────────────────────┤
│  Kong Gateway (supabase-kong)           │
│  - Port: 8000                           │
│  - Config: kong/kong.yml                │
├─────────────────────────────────────────┤
│  GoTrue Auth (supabase-auth)            │
│  - Port: 9999                           │
│  - JWT authentication                   │
└─────────────────────────────────────────┘
```

---

## Quick Start

### Prerequisites

**Required**:
- Docker Desktop 4.0+ installed
- At least 4GB RAM allocated to Docker
- At least 10GB free disk space

**Verify Installation**:
```bash
docker --version
docker-compose --version
```

---

### Starting Services

**Using Helper Script** (Recommended):
```bash
cd docker
./docker-dev.sh up
```

**Manual Start**:
```bash
cd docker
docker-compose up -d
```

**Verify Services**:
```bash
# Check running containers
docker ps

# Check service health
docker-compose ps

# View logs
docker-compose logs -f
```

---

### Stopping Services

**Graceful Shutdown**:
```bash
cd docker
./docker-dev.sh down
```

**Force Stop**:
```bash
docker-compose down
```

**Stop and Remove Volumes** (⚠️ Deletes all data):
```bash
docker-compose down -v
```

---

## Service Configuration

### PostgreSQL (nestsync-db)

**Purpose**: Standalone PostgreSQL database for testing

**Configuration**:
```yaml
services:
  db:
    image: postgres:15-alpine
    container_name: nestsync-db
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: nestsync
    ports:
      - "54320:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
```

**Connection String**:
```bash
postgresql://postgres:password@localhost:54320/nestsync
```

**Access Database**:
```bash
# Using psql
psql postgresql://postgres:password@localhost:54320/nestsync

# Using Docker exec
docker exec -it nestsync-db psql -U postgres -d nestsync
```

---

### Supabase PostgreSQL (supabase-db)

**Purpose**: Supabase-compatible PostgreSQL with extensions

**Configuration**:
```yaml
services:
  supabase-db:
    image: supabase/postgres:15.1.0.117
    container_name: nestsync-supabase-db
    ports:
      - "54322:5432"
    environment:
      POSTGRES_PASSWORD: password
      POSTGRES_USER: postgres
      POSTGRES_DB: postgres
    volumes:
      - supabase_data:/var/lib/postgresql/data
```

**Connection String**:
```bash
postgresql://postgres:password@localhost:54322/postgres
```

**Supabase Extensions**:
- `uuid-ossp` - UUID generation
- `pgcrypto` - Cryptographic functions
- `pgjwt` - JWT token handling
- `pg_stat_statements` - Query statistics

**Access Database**:
```bash
# Using psql
psql postgresql://postgres:password@localhost:54322/postgres

# Using Docker exec
docker exec -it nestsync-supabase-db psql -U postgres
```

---

### Kong Gateway (supabase-kong)

**Purpose**: API gateway for routing and authentication

**Configuration**:
```yaml
services:
  supabase-kong:
    image: kong:2.8.1
    container_name: nestsync-supabase-kong
    depends_on:
      supabase-db:
        condition: service_healthy
    ports:
      - "8000:8000"
    environment:
      KONG_DATABASE: "off"
      KONG_DECLARATIVE_CONFIG: /var/lib/kong/kong.yml
    volumes:
      - ./kong/kong.yml:/var/lib/kong/kong.yml:ro
```

**Kong Configuration** (`docker/kong/kong.yml`):
- Routes for authentication endpoints
- CORS configuration
- Rate limiting rules
- Request/response transformations

**Access Kong Admin**:
```bash
# Health check
curl http://localhost:8000/

# Kong status
docker exec nestsync-supabase-kong kong health
```

---

### GoTrue Auth (supabase-auth)

**Purpose**: Authentication service (Supabase Auth)

**Configuration**:
```yaml
services:
  supabase-auth:
    image: supabase/gotrue:v2.99.0
    container_name: nestsync-supabase-auth
    depends_on:
      supabase-db:
        condition: service_healthy
    ports:
      - "9999:9999"
    environment:
      GOTRUE_API_HOST: 0.0.0.0
      GOTRUE_API_PORT: 9999
      API_EXTERNAL_URL: http://localhost:8000
      GOTRUE_DB_DRIVER: postgres
      GOTRUE_DB_DATABASE_URL: postgres://postgres:password@supabase-db:5432/postgres?search_path=auth
      GOTRUE_SITE_URL: http://localhost:8082
      GOTRUE_URI_ALLOW_LIST: http://localhost:8082,http://localhost:19006
      GOTRUE_JWT_SECRET: super-secret-jwt-token-with-at-least-32-characters-long
```

**Authentication Endpoints**:
- Sign up: `POST http://localhost:9999/signup`
- Sign in: `POST http://localhost:9999/token?grant_type=password`
- Refresh: `POST http://localhost:9999/token?grant_type=refresh_token`
- User info: `GET http://localhost:9999/user`

**Test Authentication**:
```bash
# Sign up
curl -X POST http://localhost:9999/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Sign in
curl -X POST "http://localhost:9999/token?grant_type=password" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

---

## Docker Compose Files

### docker-compose.yml

**Purpose**: Main production-like configuration

**Location**: `docker/docker-compose.yml`

**Services**:
- PostgreSQL (standalone)
- Supabase PostgreSQL
- Kong Gateway
- GoTrue Auth

**Usage**:
```bash
cd docker
docker-compose up -d
```

---

### docker-compose.dev.yml

**Purpose**: Development-specific overrides

**Location**: `docker/docker-compose.dev.yml`

**Features**:
- Additional development tools
- Volume mounts for live reloading
- Debug ports exposed
- Development-specific environment variables

**Usage**:
```bash
cd docker
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

---

## Helper Scripts

### docker-dev.sh

**Purpose**: Simplified Docker management

**Location**: `docker/docker-dev.sh`

**Commands**:
```bash
# Start services
./docker-dev.sh up

# Stop services
./docker-dev.sh down

# Restart services
./docker-dev.sh restart

# View logs
./docker-dev.sh logs

# Clean up (removes volumes)
./docker-dev.sh clean
```

**Script Features**:
- Automatic health checks
- Service dependency management
- Colored output for readability
- Error handling and validation

---

## Data Persistence

### Docker Volumes

**Defined Volumes**:
```yaml
volumes:
  postgres_data:
    driver: local
  supabase_data:
    driver: local
```

**Volume Locations**:
- macOS: `~/Library/Containers/com.docker.docker/Data/vms/0/`
- Linux: `/var/lib/docker/volumes/`
- Windows: `C:\ProgramData\Docker\volumes\`

**Inspect Volumes**:
```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect docker_postgres_data
docker volume inspect docker_supabase_data

# View volume size
docker system df -v
```

---

### Backup and Restore

**Backup Database**:
```bash
# Backup PostgreSQL
docker exec nestsync-db pg_dump -U postgres nestsync > backup_$(date +%Y%m%d).sql

# Backup Supabase
docker exec nestsync-supabase-db pg_dump -U postgres postgres > supabase_backup_$(date +%Y%m%d).sql
```

**Restore Database**:
```bash
# Restore PostgreSQL
cat backup_20251108.sql | docker exec -i nestsync-db psql -U postgres -d nestsync

# Restore Supabase
cat supabase_backup_20251108.sql | docker exec -i nestsync-supabase-db psql -U postgres -d postgres
```

**Backup Volumes**:
```bash
# Create volume backup
docker run --rm \
  -v docker_postgres_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/postgres_data_backup.tar.gz -C /data .

# Restore volume backup
docker run --rm \
  -v docker_postgres_data:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/postgres_data_backup.tar.gz -C /data
```

---

## Networking

### Docker Network

**Network Name**: `nestsync-network`

**Network Type**: Bridge

**Configuration**:
```yaml
networks:
  nestsync-network:
    driver: bridge
```

**Inspect Network**:
```bash
# List networks
docker network ls

# Inspect network
docker network inspect docker_nestsync-network

# View connected containers
docker network inspect docker_nestsync-network --format '{{range .Containers}}{{.Name}} {{end}}'
```

---

### Service Communication

**Internal Communication**:
- Services communicate using container names
- Example: `supabase-db:5432` (not `localhost:54322`)

**External Access**:
- Services exposed via port mapping
- Example: `localhost:54322` maps to `supabase-db:5432`

**Connection Examples**:
```bash
# From host machine
psql postgresql://postgres:password@localhost:54322/postgres

# From another container
psql postgresql://postgres:password@supabase-db:5432/postgres

# From backend application
DATABASE_URL=postgresql://postgres:password@supabase-db:5432/postgres
```

---

## Health Checks

### Service Health

**Health Check Configuration**:
```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U postgres"]
  interval: 10s
  timeout: 5s
  retries: 5
```

**Check Service Health**:
```bash
# View health status
docker-compose ps

# Check specific service
docker inspect --format='{{.State.Health.Status}}' nestsync-supabase-db

# View health check logs
docker inspect --format='{{range .State.Health.Log}}{{.Output}}{{end}}' nestsync-supabase-db
```

---

### Manual Health Checks

**PostgreSQL**:
```bash
docker exec nestsync-db pg_isready -U postgres
docker exec nestsync-supabase-db pg_isready -U postgres
```

**Kong**:
```bash
docker exec nestsync-supabase-kong kong health
curl http://localhost:8000/
```

**GoTrue**:
```bash
curl http://localhost:9999/health
```

---

## Troubleshooting

### Common Issues

#### Port Already in Use

**Symptoms**:
```
Error: bind: address already in use
```

**Solution**:
```bash
# Find process using port
lsof -i :54322
lsof -i :8000

# Kill process
kill -9 <PID>

# Or change port in docker-compose.yml
ports:
  - "54323:5432"  # Use different host port
```

---

#### Container Won't Start

**Symptoms**:
```
Container exited with code 1
```

**Diagnosis**:
```bash
# View container logs
docker logs nestsync-supabase-db

# View last 50 lines
docker logs --tail 50 nestsync-supabase-db

# Follow logs in real-time
docker logs -f nestsync-supabase-db
```

**Common Causes**:
- Insufficient memory allocated to Docker
- Port conflicts
- Volume permission issues
- Corrupted volume data

---

#### Database Connection Refused

**Symptoms**:
```
psql: error: connection to server at "localhost" (::1), port 54322 failed: Connection refused
```

**Solution**:
```bash
# Check if container is running
docker ps | grep supabase-db

# Check container health
docker inspect --format='{{.State.Health.Status}}' nestsync-supabase-db

# Restart container
docker restart nestsync-supabase-db

# Check logs for errors
docker logs nestsync-supabase-db
```

---

#### Volume Permission Issues

**Symptoms**:
```
Permission denied: '/var/lib/postgresql/data'
```

**Solution**:
```bash
# Remove and recreate volume
docker-compose down -v
docker-compose up -d

# Or fix permissions
docker exec -it nestsync-supabase-db chown -R postgres:postgres /var/lib/postgresql/data
```

---

### Performance Issues

#### Slow Database Queries

**Diagnosis**:
```bash
# Check active connections
docker exec nestsync-supabase-db psql -U postgres -c "SELECT count(*) FROM pg_stat_activity"

# View slow queries
docker exec nestsync-supabase-db psql -U postgres -c "SELECT query, calls, total_time FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10"
```

**Solutions**:
- Increase Docker memory allocation
- Add database indexes
- Optimize queries
- Enable connection pooling

---

#### High Memory Usage

**Diagnosis**:
```bash
# Check Docker resource usage
docker stats

# Check specific container
docker stats nestsync-supabase-db
```

**Solutions**:
```bash
# Increase Docker memory limit (Docker Desktop settings)
# Or limit container memory in docker-compose.yml
services:
  supabase-db:
    mem_limit: 2g
    memswap_limit: 2g
```

---

## Maintenance

### Cleaning Up

**Remove Stopped Containers**:
```bash
docker container prune
```

**Remove Unused Images**:
```bash
docker image prune -a
```

**Remove Unused Volumes**:
```bash
docker volume prune
```

**Complete Cleanup**:
```bash
docker system prune -a --volumes
```

---

### Updating Services

**Update Docker Images**:
```bash
cd docker

# Pull latest images
docker-compose pull

# Recreate containers with new images
docker-compose up -d --force-recreate
```

**Update Specific Service**:
```bash
# Pull specific image
docker pull supabase/postgres:15.1.0.117

# Recreate service
docker-compose up -d --force-recreate supabase-db
```

---

## Development Workflow

### Daily Workflow

**Morning Startup**:
```bash
cd docker
./docker-dev.sh up
```

**During Development**:
```bash
# View logs
docker-compose logs -f supabase-db

# Access database
psql postgresql://postgres:password@localhost:54322/postgres

# Restart service if needed
docker restart nestsync-supabase-db
```

**End of Day**:
```bash
cd docker
./docker-dev.sh down
```

---

### Testing Workflow

**Setup Test Environment**:
```bash
# Start services
./docker-dev.sh up

# Run migrations
cd ../NestSync-backend
alembic upgrade head

# Seed test data
python scripts/seed_test_data.py
```

**Run Tests**:
```bash
# Backend tests
cd NestSync-backend
pytest

# Frontend tests
cd NestSync-frontend
npm test
```

**Cleanup**:
```bash
# Reset database
cd docker
docker-compose down -v
docker-compose up -d
```

---

## Advanced Configuration

### Custom Environment Variables

**Override Environment Variables**:
```bash
# Create .env file in docker directory
cd docker
cat > .env << EOF
POSTGRES_PASSWORD=custom_password
GOTRUE_JWT_SECRET=custom_jwt_secret
EOF

# Docker Compose will automatically load .env file
docker-compose up -d
```

---

### Multiple Environments

**Development Environment**:
```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

**Testing Environment**:
```bash
docker-compose -f docker-compose.yml -f docker-compose.test.yml up -d
```

**Production-like Environment**:
```bash
docker-compose -f docker-compose.yml up -d
```

---

## Related Documentation

- [Infrastructure Overview](./README.md)
- [Environment Configuration](./environment.md)
- [Deployment Guide](./deployment.md)
- [Supabase Integration](../../NestSync-backend/docs/deployment/supabase.md)
- [Troubleshooting Guide](../troubleshooting/README.md)

---

*Last Updated: 2025-11-08*
*For production deployment, see [Deployment Guide](./deployment.md)*
