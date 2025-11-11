# NestSync - Canadian Diaper Planning App

[![Security Scan](https://github.com/YOUR_ORG/nestsync/actions/workflows/security-scan.yml/badge.svg)](https://github.com/YOUR_ORG/nestsync/actions/workflows/security-scan.yml)

**A comprehensive diaper planning and inventory management application designed for Canadian families with PIPEDA compliance and psychology-driven UX.**

## 🎯 Business Model Overview

NestSync is designed with a premium tier strategy focused on ML-powered predictions and automation:

- **Family Tier** ($19.99/month CAD): Enhanced organization, collaboration, safety tools
- **Professional Tier** ($34.99/month CAD): Advanced analytics, API access, automation
- **Premium Features**: Size change prediction, reorder automation, analytics dashboard, healthcare integration

## 🏗️ Architecture Overview

### Technology Stack
- **Frontend**: React Native + Expo SDK ~53 with TypeScript
- **Backend**: FastAPI + Strawberry GraphQL with Canadian timezone (America/Toronto)
- **Database**: Supabase PostgreSQL with Row Level Security (RLS) policies
- **Authentication**: Supabase Auth with PIPEDA compliance
- **Development**: Docker-based development environment with hot reload

### Premium Feature Dependencies

**Why we have ML/AI, Payment, and OCR dependencies:**

#### 🔮 Machine Learning & Predictions
- `numpy`, `pandas`, `scikit-learn`, `scipy`, `prophet`
- **Purpose**: Size-change prediction feature using Canadian pediatric standards
- **Business Value**: Core premium feature for automated reordering and growth analysis

#### 💳 Payment Processing
- `stripe`, `sendgrid`, `twilio`, `firebase-admin`
- **Purpose**: $19.99-$34.99 CAD monthly subscriptions with Canadian tax compliance
- **Business Value**: Revenue generation and premium user management

#### 📸 OCR & Image Processing
- `pytesseract`, `opencv-python`, `pdf2image`, `google-cloud-vision`
- **Purpose**: Receipt scanning, barcode automation, healthcare report processing
- **Business Value**: Premium automation features for inventory tracking

#### 🔄 Background Processing
- `celery`, `rq`, `aioredis`
- **Purpose**: Automated premium feature processing, ML model training
- **Business Value**: Real-time collaboration and automated workflows

> **Note**: These dependencies are strategic investments for documented premium features (Phase 2-4 roadmap). They are not "dead code" but forward-looking business infrastructure.

## 🚀 Quick Start

### Using Docker (Recommended)
```bash
# Start entire development stack
./docker-dev.sh up

# View all services
./docker-dev.sh status

# Access points:
# - Frontend: http://localhost:8082
# - Backend: http://localhost:8001
# - Supabase Studio: http://localhost:54323
```

### Manual Development
```bash
# Backend
cd NestSync-backend
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8001 --reload

# Frontend (separate terminal)
cd NestSync-frontend
npm install
npx expo start --port 8082
```

## 📁 Documentation Structure

NestSync uses a comprehensive documentation organization system designed for easy navigation and maintenance.

### 📚 Main Documentation Hub
- **[`/docs/`](./docs/)** - Central technical documentation
  - [`/docs/setup/`](./docs/setup/) - Setup and onboarding guides
  - [`/docs/architecture/`](./docs/architecture/) - System architecture
  - [`/docs/troubleshooting/`](./docs/troubleshooting/) - Debugging guides
  - [`/docs/testing/`](./docs/testing/) - Active testing guides
  - [`/docs/compliance/`](./docs/compliance/) - PIPEDA and security compliance
  - [`/docs/infrastructure/`](./docs/infrastructure/) - Deployment and DevOps
  - [`/docs/archives/`](./docs/archives/) - Historical documentation and fixes

### 🎨 Design Documentation (Authoritative)
- **[`/design-documentation/`](./design-documentation/)** - UX and design specifications
  - [`/features/`](./design-documentation/features/) - Feature-specific designs
  - [`/design-system/`](./design-documentation/design-system/) - Visual design system
  - [`/accessibility/`](./design-documentation/accessibility/) - Accessibility guidelines
  - **Note**: Design documentation is the authoritative source for all features

### 🏗️ Project Documentation
- **[`/project-documentation/`](./project-documentation/)** - Business strategy and architecture
  - High-level architecture documents
  - Business strategy and analytics
  - System analysis and planning

### 🔧 Component-Specific Documentation
- **[`/NestSync-backend/docs/`](./NestSync-backend/docs/)** - Backend documentation
  - [`/api/`](./NestSync-backend/docs/api/) - API and GraphQL documentation
  - [`/database/`](./NestSync-backend/docs/database/) - Database schemas and migrations
  - [`/deployment/`](./NestSync-backend/docs/deployment/) - Backend deployment guides
  - [`/archives/`](./NestSync-backend/docs/archives/) - Backend-specific archives

- **[`/NestSync-frontend/docs/`](./NestSync-frontend/docs/)** - Frontend documentation
  - [`/components/`](./NestSync-frontend/docs/components/) - Component documentation
  - [`/screens/`](./NestSync-frontend/docs/screens/) - Screen documentation
  - [`/state-management/`](./NestSync-frontend/docs/state-management/) - State patterns
  - [`/testing/`](./NestSync-frontend/docs/testing/) - Frontend testing guides
  - [`/archives/`](./NestSync-frontend/docs/archives/) - Frontend-specific archives

### 📦 Archives & Historical Documentation
- **[`/docs/archives/`](./docs/archives/)** - Organized historical documentation
  - [`/2025/`](./docs/archives/2025/) - Chronological archives by month
  - [`/implementation-reports/`](./docs/archives/implementation-reports/) - Feature implementations
  - [`/test-reports/`](./docs/archives/test-reports/) - Historical test results
  - [`/fixes/`](./docs/archives/fixes/) - Bug fix documentation
  - [`/audits/`](./docs/archives/audits/) - Compliance audits

### 🔍 Quick Links to Key Documentation
- [Product Specification](./docs/PRODUCT_SPECIFICATION.md) - Complete product definition and strategy (v1.1 - Authoritative)
- [Product Spec Summary](./docs/PRODUCT_SPEC_SUMMARY.md) - Quick reference guide
- [Setup Guide](./docs/setup/) - Get started with development
- [Architecture Overview](./docs/architecture/) - System design and patterns
- [Troubleshooting](./docs/troubleshooting/) - Common issues and solutions
- [PIPEDA Compliance](./docs/compliance/pipeda/) - Canadian privacy compliance
- [Testing Guide](./docs/testing/) - Testing strategies and tools
- [Deployment Guide](./NestSync-backend/docs/deployment/) - Production deployment
- [Archive Index](./docs/archives/) - Historical fixes and reports

## 🔧 Development Environment

### Docker Configuration
The project uses multiple Docker configurations for different purposes:
- **`docker-compose.yml`**: Base production-like setup
- **`docker-compose.dev.yml`**: Development with hot reload
- **`docker-compose.remote.yml`**: Remote deployment configuration

### Git Worktrees
Multiple worktrees are used for parallel feature development:
- Each worktree represents a separate branch with its own Docker configuration
- Allows testing different features in isolation
- Worktrees located in `/worktrees/` directory (git-ignored)

## 🧪 Testing & Development

### Test Credentials
**Email**: parents@nestsync.com
**Password**: Shazam11#

### Development Commands
```bash
# Frontend linting
cd NestSync-frontend && npm run lint

# Backend database migration
cd NestSync-backend && alembic upgrade head

# Docker environment management
./docker-dev.sh up|down|restart|logs
```

## 🍁 Canadian Compliance (PIPEDA)

- All user data stored in Canadian Supabase regions
- Granular consent management with audit trails
- RLS security policies ensuring data isolation
- Privacy-by-design architecture patterns
- Canadian timezone (America/Toronto) for all timestamps

## 🏢 For New Team Members

### Getting Started with Documentation
1. **Start Here**: Read [CLAUDE.md](./CLAUDE.md) for detailed development setup
2. **Understand the System**: Review [Architecture Overview](./docs/architecture/)
3. **Learn the Design**: Explore [Design Documentation](./design-documentation/) (authoritative source)
4. **Setup Environment**: Follow [Setup Guide](./docs/setup/)
5. **Find Solutions**: Check [Troubleshooting](./docs/troubleshooting/) and [Archives](./docs/archives/)

### Documentation Navigation Tips
- **Need to find something?** Start with the main [`/docs/README.md`](./docs/) index
- **Looking for a past fix?** Browse [`/docs/archives/`](./docs/archives/) by date or topic
- **Backend-specific?** Check [`/NestSync-backend/docs/`](./NestSync-backend/docs/)
- **Frontend-specific?** Check [`/NestSync-frontend/docs/`](./NestSync-frontend/docs/)
- **Design decisions?** Always refer to [`/design-documentation/`](./design-documentation/)
- **Compliance questions?** See [`/docs/compliance/`](./docs/compliance/)

### Understanding "Dockerfiles in Multiple Directories"
- **Root Dockerfiles**: Primary development and production configurations
- **Worktree Dockerfiles**: Branch-specific configurations for feature development
- **Why**: Each git worktree (branch) may need different dependencies or configurations

### Understanding Premium Dependencies
- **Not Dead Code**: All ML/AI, payment, OCR dependencies are for documented premium features
- **Business Strategy**: Essential for $19.99-$34.99 CAD monthly subscription model
- **Implementation Timeline**: Phase 2-4 of development roadmap
- **Revenue Critical**: These dependencies enable the core business model

### Understanding Documentation Archives
- **Location**: [`/docs/archives/`](./docs/archives/)
- **Purpose**: Historical fixes, implementation reports, and test results
- **Organization**: By date (year/month) and by category (fixes, tests, implementations)
- **When to Use**: Reference for similar issues, compliance audits, understanding past decisions
- **Navigation**: Each archive directory has a README.md with indexed navigation

## 📋 Development Workflow

### Making Changes
1. Create feature branch or use git worktree
2. Test changes locally with Docker environment
3. Run linting and validation
4. Ensure premium dependencies remain intact
5. Document any new premium feature implementations

### Premium Feature Development
1. Reference `/design-documentation/` for feature specifications
2. Use existing ML/AI dependencies for predictions
3. Integrate with Stripe for payment processing
4. Implement OCR features for automation
5. Test with Canadian timezone and PIPEDA compliance

## 🔗 Important Links

### Essential Documentation
- [CLAUDE.md](./CLAUDE.md) - Detailed development guide for AI-assisted development
- [Documentation Hub](./docs/) - Central technical documentation index
- [Design Documentation](./design-documentation/) - Authoritative UX patterns and feature specs
- [Project Documentation](./project-documentation/) - Business strategy and architecture

### Component Documentation
- [Backend Documentation](./NestSync-backend/docs/) - API, database, deployment guides
- [Frontend Documentation](./NestSync-frontend/docs/) - Components, screens, state management

### Compliance & Security
- [PIPEDA Compliance](./docs/compliance/pipeda/) - Canadian privacy compliance
- [Security Documentation](./docs/security/) - Security scanning, vulnerability management, best practices
- [Semgrep Best Practices](./docs/security/semgrep-best-practices.md) - Guide for working with security findings

### Archives & Historical Context
- [Documentation Archives](./docs/archives/) - Historical fixes and implementation reports
- [Backend Archives](./NestSync-backend/docs/archives/) - Backend-specific historical docs
- [Frontend Archives](./NestSync-frontend/docs/archives/) - Frontend-specific historical docs

### Troubleshooting & Testing
- [Troubleshooting Guide](./docs/troubleshooting/) - Common issues and solutions
- [Testing Documentation](./docs/testing/) - Testing strategies and guides
- [Infrastructure Guide](./docs/infrastructure/) - Docker, environment, deployment

---

**Quick Reference**: For feature implementation → [Design Docs](./design-documentation/) | For past fixes → [Archives](./docs/archives/) | For setup → [CLAUDE.md](./CLAUDE.md) | For compliance → [PIPEDA Docs](./docs/compliance/pipeda/)