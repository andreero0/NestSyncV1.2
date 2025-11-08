# Environment Templates

This directory contains environment configuration templates for different development modes.

## Available Templates

### `.env.docker.template`
- **Purpose**: Docker development environment with local containerized services
- **Usage**: Automatically copied to `.env` when switching to Docker mode
- **Services**: Local Supabase, PostgreSQL, Redis via Docker containers
- **Safety**: Safe for development - no production data access

### `.env.production.template`
- **Purpose**: Production-connected development environment
- **Usage**: Automatically copied to `.env` when switching to production mode
- **Services**: Real production Supabase and backend services
- **Safety**: ⚠️ **CAUTION** - Connects to live production data

## Usage

These templates are automatically managed by the environment toggle system:

```bash
# Switch to Docker development (uses .env.docker.template)
./scripts/dev.sh switch docker

# Switch to production-connected development (uses .env.production.template)
./scripts/dev.sh switch production

# Check current mode
./scripts/dev.sh status
```

## Customization

To customize environment configurations:

1. Edit the appropriate template file
2. Switch environment modes to apply changes
3. Changes will be reflected in the `.env` file

## Security Note

Never commit actual production credentials to these templates. The production template contains placeholder values that must be replaced with real credentials when used.