# Setup Documentation

## Overview

This directory contains setup and configuration guides for NestSync development and deployment.

## Getting Started

### For New Developers
1. **[Work Computer Setup](./WORK-COMPUTER-SETUP.md)** - Complete workstation setup guide
2. **[Cross-Platform Setup](./cross-platform-setup.md)** - Development environment for all platforms
3. **[Stripe Development Setup](./stripe-development-setup.md)** - Payment integration configuration

### For Deployment
- **[Deployment Guide](./deployment-guide.md)** - Deployment procedures and references

## Setup Guides

### Development Environment

#### Work Computer Setup
**File**: [WORK-COMPUTER-SETUP.md](./WORK-COMPUTER-SETUP.md)

Complete guide for setting up a new development workstation including:
- Required tools and dependencies
- IDE configuration
- Git setup
- Docker installation
- Environment configuration

#### Cross-Platform Setup
**File**: [cross-platform-setup.md](./cross-platform-setup.md)

Platform-specific setup instructions for:
- macOS development
- Windows development
- Linux development
- Mobile development (iOS/Android)
- Web development

#### Stripe Development Setup
**File**: [stripe-development-setup.md](./stripe-development-setup.md)

Payment integration setup including:
- Stripe account configuration
- Test mode setup
- Webhook configuration
- Local testing procedures
- Environment variables

### Deployment

#### Deployment Guide
**File**: [deployment-guide.md](./deployment-guide.md)

Deployment procedures and references:
- Backend deployment (Railway + Supabase)
- Frontend deployment (Expo EAS)
- Production readiness checklist
- Environment-specific guides
- Rollback procedures

## Quick Reference

### First Time Setup
```bash
# 1. Clone repository
git clone https://github.com/YOUR_ORG/nestsync.git
cd nestsync

# 2. Follow work computer setup guide
# See WORK-COMPUTER-SETUP.md

# 3. Set up environment
cp .env.example .env
# Edit .env with your configuration

# 4. Start development environment
./docker-dev.sh up
```

### Development Workflow
```bash
# Start services
./docker-dev.sh up

# View logs
./docker-dev.sh logs

# Stop services
./docker-dev.sh down
```

### Deployment Workflow
```bash
# 1. Review production readiness
# See deployment-guide.md

# 2. Deploy backend
cd NestSync-backend
railway up

# 3. Deploy frontend
cd NestSync-frontend
eas build --platform all
```

## Environment Configuration

### Required Environment Variables

**Backend** (`.env` in `NestSync-backend/`):
- `DATABASE_URL` - Supabase connection string
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_KEY` - Supabase anon/service key
- `JWT_SECRET` - JWT signing secret
- `STRIPE_SECRET_KEY` - Stripe secret key
- `DATA_REGION` - Canadian data residency
- `TZ` - Timezone (America/Toronto)

**Frontend** (`.env` in `NestSync-frontend/`):
- `EXPO_PUBLIC_API_URL` - Backend API URL
- `EXPO_PUBLIC_SUPABASE_URL` - Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key

See individual setup guides for complete environment variable lists.

## Platform-Specific Notes

### macOS
- Use Homebrew for package management
- Xcode required for iOS development
- Docker Desktop recommended

### Windows
- WSL2 recommended for development
- Docker Desktop with WSL2 backend
- Visual Studio Code with Remote-WSL extension

### Linux
- Docker and Docker Compose required
- Node.js via nvm recommended
- Python via pyenv recommended

## Troubleshooting

### Common Setup Issues

**Docker Issues**
- Ensure Docker is running
- Check Docker resource limits
- Verify network connectivity
- See [Infrastructure Documentation](../infrastructure/README.md)

**Database Connection Issues**
- Verify Supabase credentials
- Check network connectivity
- Review connection string format
- See [Backend Deployment](../../NestSync-backend/docs/deployment/supabase.md)

**Environment Variable Issues**
- Verify .env file exists
- Check variable names (no typos)
- Ensure values are properly quoted
- See [Environment Configuration](../../NestSync-backend/docs/deployment/environment.md)

**Build Issues**
- Clear node_modules and reinstall
- Clear Docker build cache
- Check Node.js version compatibility
- See [Troubleshooting Guide](../troubleshooting/README.md)

## Related Documentation

### Development
- [CLAUDE.md](../../CLAUDE.md) - AI-assisted development guide
- [Architecture Documentation](../architecture/README.md) - System architecture
- [Testing Documentation](../testing/README.md) - Testing strategies

### Deployment
- [Backend Deployment](../../NestSync-backend/docs/deployment/README.md) - Backend deployment guide
- [Production Readiness](../deployment/production-readiness-checklist.md) - Pre-deployment checklist
- [Infrastructure](../infrastructure/README.md) - Infrastructure overview

### Compliance
- [PIPEDA Compliance](../compliance/pipeda/README.md) - Canadian privacy compliance
- [Security Documentation](../security/README.md) - Security best practices

### Support
- [Troubleshooting](../troubleshooting/README.md) - Common issues and solutions
- [Documentation Guide](../DOCUMENTATION_GUIDE.md) - Documentation standards

## Getting Help

### Internal Resources
1. Check this setup documentation
2. Review [Troubleshooting Guide](../troubleshooting/README.md)
3. Search [Documentation Archives](../archives/README.md)
4. Review [CLAUDE.md](../../CLAUDE.md) for AI assistance

### External Resources
- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [Railway Documentation](https://docs.railway.app/)

---

**Last Updated**: 2025-11-11  
**Maintained By**: Development Team  
**Review Cycle**: Monthly

[← Back to Documentation Hub](../README.md)
