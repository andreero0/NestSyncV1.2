# NestSync Supabase CLI Integration Guide

## Overview

This guide provides comprehensive instructions for integrating the NestSync FastAPI backend with Supabase using the CLI tools for local development and production deployment.

## Project Structure

```
NestSync-backend/
├── supabase/
│   ├── config.toml          # Supabase configuration
│   ├── seed.sql             # Database seed data
│   ├── migrations/          # Database migrations
│   └── .gitignore          # Supabase-specific gitignore
├── types/
│   └── database/
│       └── supabase.ts     # TypeScript types (auto-generated)
├── .env                    # Production/staging environment
├── .env.local              # Local development environment
├── supabase_cli.sh         # Management script
└── app/                    # FastAPI application
```

## Quick Start

### 1. Local Development Setup

```bash
# Start local Supabase services
./supabase_cli.sh start

# This will provide you with:
# - API Gateway: http://127.0.0.1:54321
# - Database: postgresql://postgres:postgres@127.0.0.1:54322/postgres
# - Studio: http://127.0.0.1:54323
# - Inbucket (Email): http://127.0.0.1:54324

# Update your .env.local with the generated keys
# Copy ANON_KEY and SERVICE_ROLE_KEY from the start command output
```

### 2. Environment Configuration

Update `.env.local` with the keys from `supabase start`:

```bash
# From supabase start output
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Local database connection
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

### 3. FastAPI Integration

Update your FastAPI application to use local Supabase:

```python
# In your FastAPI app
import os
from supabase import create_client, Client

# Use local environment for development
if os.getenv("ENVIRONMENT") == "local":
    url = os.getenv("SUPABASE_URL", "http://127.0.0.1:54321")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
else:
    # Production configuration
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY")

supabase: Client = create_client(url, key)
```

## Development Workflow

### Database Management

```bash
# Create a new migration
./supabase_cli.sh migration create_user_profiles

# Apply migrations to local database
./supabase_cli.sh migrate

# Reset local database (applies all migrations and seeds)
./supabase_cli.sh reset

# Seed the database with test data
./supabase_cli.sh seed
```

### TypeScript Types Generation

```bash
# Generate types from local database
./supabase_cli.sh types

# Types will be saved to: types/database/supabase.ts
```

### Database Schema Synchronization

```bash
# Pull schema from remote database to local migrations
./supabase_cli.sh pull

# This creates migration files from your remote database
```

## Remote Project Integration

### Authentication Setup

```bash
# Login to Supabase (required for remote operations)
./supabase_cli.sh login

# Link to your remote project
./supabase_cli.sh link
```

### Deployment Workflow

```bash
# 1. Test locally first
./supabase_cli.sh start
./supabase_cli.sh reset

# 2. Run your FastAPI tests
python -m pytest

# 3. Deploy to remote (with confirmation prompt)
./supabase_cli.sh deploy
```

## Configuration Details

### Supabase Config (`supabase/config.toml`)

Key configurations for NestSync:

- **Project ID**: `huhkefkuamkeoxekzkuf`
- **Auth URLs**: Configured for localhost:3000 (frontend) and localhost:8001 (API)
- **Password Requirements**: 8+ chars with mixed case and numbers
- **Storage Buckets**: 
  - `profile_photos`: Private, 5MB limit
  - `product_images`: Public, 10MB limit

### Authentication Configuration

```toml
[auth]
site_url = "http://localhost:3000"
additional_redirect_urls = [
  "http://localhost:3000",
  "http://localhost:19006",
  "https://nestsync.ca",
  "http://localhost:8000",
  "http://localhost:8001"
]
minimum_password_length = 8
password_requirements = "lower_upper_letters_digits"
```

### Storage Configuration

```toml
[storage.buckets.profile_photos]
public = false
file_size_limit = "5MiB"
allowed_mime_types = ["image/png", "image/jpeg", "image/webp"]

[storage.buckets.product_images]
public = true
file_size_limit = "10MiB"
allowed_mime_types = ["image/png", "image/jpeg", "image/webp"]
```

## Environment Management

### Development (.env.local)
- Local Supabase services
- Development database
- Hot reloading enabled
- Debug mode on

### Production (.env)
- Remote Supabase project
- Production database
- Optimized settings
- Security hardened

## Common Commands

```bash
# Start local development
./supabase_cli.sh start

# Check service status
./supabase_cli.sh status

# Stop local services
./supabase_cli.sh stop

# View help
./supabase_cli.sh help
```

## Troubleshooting

### Connection Issues

1. **Local services not starting**: Check Docker is running
2. **Port conflicts**: Ensure ports 54321-54327 are available
3. **Database connection failed**: Verify DATABASE_URL in .env.local

### Authentication Issues

1. **JWT errors**: Check SUPABASE_JWT_SECRET matches your project
2. **Unauthorized access**: Verify service role key is correct
3. **CORS errors**: Check auth.additional_redirect_urls includes your frontend

### Migration Issues

1. **Migration failed**: Check SQL syntax in migration files
2. **Schema out of sync**: Run `./supabase_cli.sh pull` to sync from remote
3. **Seed data errors**: Verify foreign key constraints in seed.sql

## PIPEDA Compliance

All configurations maintain PIPEDA compliance:

- **Data Residency**: Canada-central region specified
- **Consent Management**: Proper consent tracking in auth flow
- **Data Retention**: Configured retention periods
- **Privacy Controls**: User data access and deletion capabilities

## Integration with FastAPI

### Supabase Client Setup

```python
from supabase import create_client
import os

def get_supabase_client():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    return create_client(url, key)
```

### Authentication Middleware

```python
from fastapi import Request, HTTPException
import jwt

async def verify_supabase_token(request: Request):
    token = request.headers.get("Authorization")
    if not token:
        raise HTTPException(401, "Missing authorization")
    
    # Verify JWT with Supabase
    # Implementation depends on your auth flow
```

## Next Steps

1. **Start Local Development**: Run `./supabase_cli.sh start`
2. **Update Environment**: Configure .env.local with generated keys
3. **Test Integration**: Run FastAPI with local Supabase
4. **Generate Types**: Run `./supabase_cli.sh types` for TypeScript support
5. **Create Migrations**: Use `./supabase_cli.sh migration <name>` for schema changes

## Support

- **Supabase Docs**: https://supabase.com/docs
- **CLI Reference**: https://supabase.com/docs/reference/cli
- **FastAPI Integration**: https://supabase.com/docs/guides/integrations/fastapi

## Security Notes

- Never commit `.env.local` or production secrets
- Use service role keys only in backend applications
- Implement proper JWT validation in production
- Regular security audits for PIPEDA compliance