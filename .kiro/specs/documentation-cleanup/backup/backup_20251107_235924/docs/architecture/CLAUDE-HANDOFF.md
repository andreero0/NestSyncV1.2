# Claude Code Work Computer Handoff Documentation

## Welcome, Work Computer Claude Instance! 

This document contains everything you need to seamlessly continue development on the NestSync project. Read this carefully as it contains critical context for effective collaboration.

## Current Development Context

### You Are Taking Over From:
- **Home Computer Claude Instance** 
- **Date**: September 12, 2025
- **Current Branch**: `feature/fixing-dashboard`
- **Primary Focus**: Dashboard fixes, inventory management, and work computer setup automation

### Recent Development History:
1. **Dashboard Enhancement**: Fixed timeline components, child selector, and activity display
2. **Context-Aware FAB**: Implemented multi-modal floating action button with screen-specific functionality  
3. **Inventory Management**: Complete CRUD system with traffic light status indicators
4. **Work Computer Setup**: Just completed comprehensive automation package for seamless cross-computer development

## Project Architecture (Critical Understanding)

### Full-Stack Application:
- **Frontend**: React Native + Expo SDK ~53, TypeScript, Apollo Client GraphQL
- **Backend**: FastAPI + Strawberry GraphQL, Python 3.11+
- **Database**: Supabase PostgreSQL with Canadian data residency (PIPEDA compliance)
- **Authentication**: Supabase Auth with JWT tokens and universal storage patterns

### Key Technical Patterns:
```typescript
// CRITICAL: Always use universal storage hooks, never direct SecureStore
import { useAsyncStorage } from '@/hooks/useUniversalStorage';
const [token, setToken] = useAsyncStorage('key');

// CRITICAL: Backend database session pattern
async for session in get_async_session():
    # Database operations
    await session.commit()
    # NEVER use: async with get_async_session() as session:
```

## Current Feature Branch State

### What's Been Implemented:
- **Dashboard Improvements**: Enhanced child selector, activity timeline, traffic light inventory system
- **Context-Aware FAB**: Screen-specific actions (Log Change/Add Inventory/Help) with psychology-driven animations
- **Inventory Management**: Complete CRUD with EditInventoryModal, traffic light status, filtering
- **Universal Storage**: Cross-platform compatibility (web/native) with proper fallbacks
- **Work Setup Automation**: Complete package for work computer development setup

### Files Recently Modified:
- `NestSync-frontend/app/(tabs)/index.tsx` - Dashboard with traffic light cards
- `NestSync-frontend/app/(tabs)/planner.tsx` - Inventory filtering and management
- `NestSync-frontend/components/ui/ContextAwareFAB.tsx` - Multi-screen FAB functionality
- `NestSync-frontend/components/modals/AddChildModal.tsx` - Child creation modal
- `NestSync-frontend/components/consent/JITConsentModal.tsx` - PIPEDA compliance UI

## Critical Development Standards

### MANDATORY Patterns:
1. **No Emojis Policy**: Never use emojis in code, commits, or documentation
2. **Professional Commit Messages**: Use conventional format without Claude attribution
3. **Universal Storage**: Always use hooks from `@/hooks/useUniversalStorage`
4. **GraphQL Error Handling**: Comprehensive try/catch in all resolvers
5. **Canadian Context**: PIPEDA compliance headers and trust indicators

### Testing Requirements:
- **Test Credentials**: parents@nestsync.com / Shazam11#
- **Both Servers Required**: Backend (8001) + Frontend (8082) must run simultaneously
- **Cross-Platform Testing**: Verify on web before mobile platforms

## Work Computer Setup Instructions

### If You Need to Help User Set Up:
1. **Reference**: Use `WORK-COMPUTER-SETUP.md` for step-by-step instructions
2. **Troubleshooting**: Use `TROUBLESHOOTING-GUIDE.md` for common issues
3. **Quick Start**: Use `./start-dev-servers-work.sh` for automated server launch
4. **Environment**: Help user extract `.env` variables from Supabase dashboard

### Critical Setup Points:
- **Supabase Credentials**: User must copy from their project dashboard
- **Port Configuration**: Backend 8001, Frontend 8082 (standardized)
- **Branch Sync**: Ensure user is on `feature/fixing-dashboard` branch
- **Dependencies**: Python venv + requirements.txt, npm install

## Current Technical Challenges

### Recently Resolved:
- **✅ Git Artifacts**: Fixed accidental commit of worktrees/, baseline-screenshots/, node_modules/
- **✅ Universal Storage**: Resolved web platform SecureStore compatibility issues
- **✅ Context-Aware FAB**: Implemented screen-specific functionality with proper state management
- **✅ Dashboard Performance**: Optimized activity rendering with React.memo and limited queries

### Active Focus Areas:
- **P1**: Work computer setup automation and environment variable transfer
- **P2**: Enhanced inventory management UX (edit/delete functionality)
- **P2**: Child creation workflow integration with onboarding
- **P3**: Advanced planner functionality and predictive scheduling

## Environment Variables Critical List

### Backend (.env or .env.local):
```bash
# CRITICAL: User must obtain these from their Supabase project
SUPABASE_URL=https://xxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET=your-super-secret-jwt-key
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/nestsync
SECRET_KEY=your-super-secret-key-here

# Standard settings
APP_NAME=NestSync API
ENVIRONMENT=development
DEBUG=true
DATA_REGION=canada-central
TZ=America/Toronto
```

### How to Help User Get These:
1. **Supabase Dashboard**: Guide user to supabase.com → Project → Settings → API
2. **Project URL**: Copy from "Project URL" section
3. **API Keys**: Copy anon/public and service_role keys
4. **JWT Secret**: Settings → Auth → JWT Secret

## Git Repository Status

### Remote Repository: 
- **GitHub**: https://github.com/andreero0/NestSyncV1.2.git
- **Current Remote Branches**: `origin/main`, `origin/fix/dashboard-issues-comprehensive`
- **Local Branch to Push**: `feature/fixing-dashboard` (NOT yet on remote)

### Branch Strategy:
- **Main Branch**: Stable checkpoint (user's safe state)
- **Feature Branch**: Current development work (ready to push to remote)
- **Push Strategy**: `git push origin feature/fixing-dashboard` creates remote branch WITHOUT merging to main

## Development Workflow for You

### When User Asks for Features:
1. **Check Current State**: Use Read tool to understand existing implementation
2. **Follow Architecture**: Use established patterns (universal storage, GraphQL resolvers, etc.)
3. **Test Thoroughly**: Use test credentials, verify both platforms
4. **Update Documentation**: Add patterns to CLAUDE.md if new discoveries made
5. **Professional Standards**: No emojis, proper commit messages, comprehensive error handling

### When User Needs Help:
- **Setup Issues**: Reference troubleshooting guides created
- **Environment Problems**: Help extract Supabase credentials
- **Development Blocks**: Use the established technical patterns
- **Git Questions**: Explain branch strategy and push/merge differences

## Communication Context

### User Expectations:
- **Concise Responses**: Keep explanations brief and direct
- **Technical Accuracy**: User prefers correct technical guidance over lengthy explanations
- **Proactive Problem Solving**: Anticipate setup issues and provide solutions
- **Professional Approach**: No unnecessary preambles or excessive explanations

### User's Technical Level:
- **Experienced Developer**: Understands git, development environments, full-stack concepts
- **Time-Conscious**: Prefers efficient solutions over detailed explanations
- **Quality-Focused**: Values working solutions over quick fixes

## Specialized Tools and Agents

### When to Use Task Tool:
- **Complex Implementation**: Multi-step features requiring systematic approach
- **Code Research**: When searching through large codebase for patterns
- **Architecture Planning**: When designing new feature integrations

### Available Specialized Agents:
- **senior-frontend-engineer**: React Native/Expo implementation
- **senior-backend-engineer**: FastAPI/GraphQL resolver development  
- **qa-test-automation-engineer**: Testing and verification
- **system-architect**: Architecture design and integration planning

## Quick Reference Commands

### Development Server Startup:
```bash
# Automated (recommended):
./start-dev-servers-work.sh

# Manual:
# Backend: cd NestSync-backend && source venv/bin/activate && uvicorn main:app --host 0.0.0.0 --port 8001 --reload
# Frontend: cd NestSync-frontend && npx expo start --port 8082 --web
```

### Health Checks:
```bash
# Backend GraphQL:
curl http://localhost:8001/graphql -H "Content-Type: application/json" -d '{"query":"{ __schema { types { name } } }"}'

# Frontend:
curl -I http://localhost:8082
```

### Database Operations:
```bash
cd NestSync-backend
source venv/bin/activate
alembic upgrade head  # Apply migrations
python -c "from app.graphql.schema import print_schema; print_schema()"  # Schema inspection
```

## Success Criteria

### Your job is successful when:
1. **User can develop seamlessly** on work computer with same functionality as home
2. **All environment variables** are properly configured and working
3. **Both development servers** run without errors
4. **Authentication flow** works with test credentials
5. **Feature development** can continue on `feature/fixing-dashboard` branch
6. **Git workflow** is properly synchronized between computers

## Emergency Contacts

### If You're Completely Stuck:
- **Reference**: All troubleshooting scenarios covered in `TROUBLESHOOTING-GUIDE.md`
- **Environment Issues**: Help user access Supabase dashboard for credentials
- **Port Conflicts**: Use port cleanup commands in troubleshooting guide
- **Git Problems**: Explain branch strategy - feature branch does NOT affect main branch

Remember: You are continuing the work of a sophisticated development environment. The user expects you to understand the full context and continue seamlessly where the home computer instance left off.

**You've got this!** All the tools and documentation have been prepared for your success. 🚀