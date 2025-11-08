# NestSync - Canadian Diaper Planning App

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

## 📁 Directory Structure Explained

### Design Documentation
- **`/design-documentation/`**: General app features and UX patterns
- **`/NestSync-frontend/design-documentation/`**: Frontend-specific implementation guides
- **Purpose**: Separate concerns - general design vs. implementation-specific guidance

### Project Documentation
- **`/project-documentation/`**: Business strategy, architecture, analytics
- **`/NestSync-frontend/project-documentation/`**: Frontend architecture specifics
- **`/NestSync-backend/project-documentation/`**: Backend-focused project docs

### Emergency Scripts Archive
- **`/NestSync-backend/scripts/archive/`**: Archived emergency and debug scripts
- **Purpose**: Historical emergency fixes preserved with documentation for future reference
- **Contents**: Data privacy fixes, authentication debugging, inventory repairs

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

### Understanding "Dockerfiles in Multiple Directories"
- **Root Dockerfiles**: Primary development and production configurations
- **Worktree Dockerfiles**: Branch-specific configurations for feature development
- **Why**: Each git worktree (branch) may need different dependencies or configurations

### Understanding Premium Dependencies
- **Not Dead Code**: All ML/AI, payment, OCR dependencies are for documented premium features
- **Business Strategy**: Essential for $19.99-$34.99 CAD monthly subscription model
- **Implementation Timeline**: Phase 2-4 of development roadmap
- **Revenue Critical**: These dependencies enable the core business model

### Emergency Scripts Archive
- **Location**: `/NestSync-backend/scripts/archive/`
- **Purpose**: Historical emergency fixes for data privacy, authentication, inventory
- **When to Use**: Reference for similar issues, compliance audits, data recovery
- **Documentation**: Comprehensive README in archive folder

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

- [CLAUDE.md](./CLAUDE.md) - Detailed development guide for Claude Code
- [Design Documentation](./design-documentation/) - UX patterns and feature specs
- [Project Documentation](./project-documentation/) - Business strategy and architecture
- [Emergency Scripts Archive](./NestSync-backend/scripts/archive/) - Historical fixes and tools

---

**For questions about premium feature implementation, consult the design documentation. For emergency script usage, see the archive README. For development setup, see CLAUDE.md.**