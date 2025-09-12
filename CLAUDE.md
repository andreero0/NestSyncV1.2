# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Frontend (React Native + Expo)
**Location**: `NestSync-frontend/`

```bash
# Start development server
cd NestSync-frontend
npm install
npx expo start

# Platform-specific development
npx expo start --ios          # iOS simulator
npx expo start --android      # Android emulator  
npx expo start --web          # Web browser

# Common development servers (found in bottlenecks.md)
npx expo start --port 8082    # Standardized development port
npx expo start --clear        # Clear Metro cache

# Linting
npm run lint                  # ESLint check
```

### Backend (FastAPI + GraphQL)
**Location**: `NestSync-backend/`

```bash
# Development server startup
cd NestSync-backend
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8001 --reload

# Database operations
alembic upgrade head          # Apply migrations
alembic revision --autogenerate -m "description"  # Create migration
python auto_fix_supabase.py   # Automated Supabase diagnostics

# GraphQL introspection
python -c "from app.graphql.schema import print_schema; print_schema()"
```

### Critical Development Setup
**Both servers must run simultaneously for the app to function:**
- Frontend: `http://localhost:8082` (Expo development server)  
- Backend: `http://localhost:8001` (FastAPI + GraphQL endpoint)

### Database Management
```bash
# Supabase CLI (with Docker)
cd NestSync-backend
supabase start                # Start local Supabase stack
supabase db reset             # Reset local database
supabase migration up         # Apply migrations

# Direct PostgreSQL access
psql postgresql://postgres:password@localhost:5432/nestsync
```

## Architecture Overview

### Full-Stack TypeScript Application
**NestSync** is a Canadian diaper planning mobile application with PIPEDA compliance and psychological UX design for stressed parents.

### Frontend Architecture (React Native + Expo)
- **Framework**: Expo SDK ~53 with TypeScript, file-based routing
- **State Management**: Zustand for global state, React Query for server state
- **GraphQL Client**: Apollo Client with authentication, retry logic, and PIPEDA compliance headers
- **UI Library**: Custom components with Expo design system integration
- **Theme System**: Context-based theme provider supporting light/dark/system modes with AsyncStorage persistence

#### Key Frontend Patterns
```typescript
// GraphQL client with authentication (lib/graphql/client.ts)
const httpLink = createHttpLink({
  uri: __DEV__ ? 'http://localhost:8001/graphql' : 'https://nestsync-api.railway.app/graphql'
});

// Theme context with system preference detection (contexts/ThemeContext.tsx)
export function ThemeProvider({ children, defaultTheme = 'system' })

// Async session management pattern - CRITICAL BUG RESOLUTION
// Always use: async for session in get_async_session():
// Never use: async with get_async_session() as session:
```

### Backend Architecture (FastAPI + GraphQL + Supabase)
- **Framework**: FastAPI with Strawberry GraphQL, Canadian timezone (America/Toronto)
- **Database**: Supabase PostgreSQL with Row Level Security (RLS) policies
- **Authentication**: Supabase Auth integration with custom user management
- **ORM**: SQLAlchemy 2.0 with async/await patterns and Alembic migrations

#### GraphQL Schema Structure
```python
# Main schema (app/graphql/schema.py)
@strawberry.type
class Query:
    me: Optional[UserProfile]                    # Current user profile
    my_children: ChildConnection                 # User's children with pagination
    onboarding_status: OnboardingStatusResponse # Onboarding completion tracking

@strawberry.type  
class Mutation:
    sign_up: AuthResponse                        # PIPEDA-compliant registration
    create_child: CreateChildResponse            # Child profile creation
    complete_onboarding_step: MutationResponse  # Wizard step completion
```

#### Critical Async Pattern (Resolved in bottlenecks.md)
```python
# CORRECT: AsyncGenerator pattern for database sessions
async for session in get_async_session():
    # Database operations
    await session.commit()

# INCORRECT: Context manager pattern (causes __aenter__ errors)
# async with get_async_session() as session:  # DON'T USE THIS
```

### Database Architecture
- **Primary**: Supabase PostgreSQL with Canadian data residency
- **Tables**: users, children, consent_records, onboarding_wizard_data
- **Security**: RLS policies ensuring users only access their own data
- **Migrations**: Alembic with timestamp-based naming (`YYYYMMDD_HHMM_rev_slug`)

### Authentication & Compliance (PIPEDA)
- **Provider**: Supabase Auth with email confirmation
- **Storage**: Expo SecureStore for tokens, AsyncStorage for preferences  
- **Compliance**: Granular consent management, audit trails, Canadian data residency
- **Session Management**: JWT tokens with automatic refresh logic

## Development Workflow Patterns

### GraphQL Resolver Development
All resolvers follow this pattern for database access:

```python
@strawberry.mutation
async def resolver_name(self, input: InputType, info: Info) -> ResponseType:
    try:
        # ALWAYS use async for pattern for database sessions
        async for session in get_async_session():
            # Database operations
            result = await session.execute(query)
            await session.commit()
            return SuccessResponse(...)
    except Exception as e:
        logger.error(f"Error in resolver: {e}")
        return ErrorResponse(...)
```

### React Native Component Development
```typescript
// Use theme context for consistent styling
export function ComponentName() {
  const { theme, colors } = useTheme();
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.text, { color: colors.text }]}>
        Content
      </Text>
    </View>
  );
}
```

### Environment Configuration
- **Frontend**: Expo configuration in `app.json`, environment detection via `__DEV__`
- **Backend**: Python-dotenv with `.env.local` for development, `.env.production.template` for deployment
- **Database**: Supabase project configuration in `supabase/config.toml`

## Common Troubleshooting (From bottlenecks.md)

### Network Connectivity Issues
**Problem**: "ApolloError: Network request failed" during authentication
**Root Cause**: Backend server not running or not accessible on localhost:8001
**Solution**: 
1. **Quick Start**: Use the development startup script: `./start-dev-servers.sh`
2. **Manual Start**: 
   - Backend: `cd NestSync-backend && source venv/bin/activate && uvicorn main:app --host 0.0.0.0 --port 8001 --reload`
   - Frontend: `cd NestSync-frontend && npx expo start --port 8082`
3. **Verify Connectivity**: 
   - Backend health: `curl http://localhost:8001/graphql -H "Content-Type: application/json" -d '{"query":"{ __schema { types { name } } }"}'`
   - Frontend access: `curl -I http://localhost:8082`
4. **Enhanced Error Handling**: AuthService now includes automatic server connectivity validation with user-friendly error messages

### GraphQL Authentication Errors  
**Problem**: "Error during sign in: __aenter__"
**Root Cause**: Incorrect async context manager usage with AsyncGenerator
**Solution**: Use `async for session in get_async_session():` pattern

### Email Verification Issues
**Problem**: Users can register but cannot sign in
**Root Cause**: Supabase email confirmation required but not completed
**Solution**: Check email for confirmation links, or disable email confirmation in development

### iOS UI Alignment Issues
**Problem**: Privacy Policy/Terms text misalignment on iOS
**Root Cause**: React Native nested TouchableOpacity inside Text rendering issues
**Solution**: Use `<Text onPress={handler}>` instead of `<TouchableOpacity><Text></TouchableOpacity>`

### Cross-Platform Storage Compatibility Issues
**Problem**: Web authentication fails with `TypeError: _ExpoSecureStore.default.getValueWithKeyAsync is not a function`
**Root Cause**: Expo SecureStore API not available in web browsers (platform security limitation)
**Solution**: Use universal storage hooks from `hooks/useUniversalStorage.ts` with platform detection
**Pattern**: 
```typescript
// CORRECT: Use universal storage hooks
import { useAccessToken } from '../hooks/useUniversalStorage';
const [accessToken, setAccessToken] = useAccessToken();

// INCORRECT: Direct SecureStore imports
import SecureStorage from '../lib/storage/SecureStorage';  // Will fail on web
```

## Design System Integration

### Theme System
- **Default**: System preference detection (light/dark based on device)
- **Colors**: Custom NestSync palette with primary blue #0891B2
- **Typography**: Accessible font sizes with WCAG AA compliance
- **Components**: NativeBase integration with custom styling

### Psychology-Driven UX Patterns
- **Time Chips**: Eliminate typing for 90% of logging use cases (Now/1h/2h/Custom)
- **Context-Aware FAB**: Primary action button changes based on current screen
- **Stress-Reduction**: Calming colors (blues/greens), gentle animations, supportive microcopy
- **Canadian Context**: "🇨🇦 Data stored in Canada" trust indicators, PIPEDA compliance UI

## File Structure Patterns

### Frontend Organization
```
NestSync-frontend/
├── app/                    # Expo Router file-based routing
│   ├── (auth)/            # Authentication screens
│   ├── (tabs)/            # Main app navigation
│   └── _layout.tsx        # Root layout with providers
├── contexts/              # React contexts (theme, auth)
├── lib/                   # Utilities and services
│   ├── graphql/           # Apollo Client configuration
│   └── storage/           # SecureStore and AsyncStorage wrappers
└── constants/             # Colors, typography, styling
```

### Backend Organization  
```
NestSync-backend/
├── app/
│   ├── auth/              # Supabase authentication integration
│   ├── config/            # Database, settings, environment
│   ├── graphql/           # Strawberry GraphQL resolvers and types
│   ├── models/            # SQLAlchemy ORM models
│   └── services/          # Business logic services
├── alembic/               # Database migrations
├── sql/                   # SQL scripts and RLS policies
└── main.py               # FastAPI application entry point
```

## Testing Approach

### Frontend Testing
Currently using Expo's built-in linting (`npm run lint`). No comprehensive testing framework configured yet.

### Backend Testing  
Testing infrastructure outlined in `requirements.txt` but commented out for production deployment:
```python
# pytest>=7.4.3,<8.0.0
# pytest-asyncio>=0.21.1,<1.0.0  
# pytest-cov>=4.1.0,<5.0.0
```

## Deployment & Production

### Frontend Deployment
- **Platform**: Expo Application Services (EAS) for app store deployment
- **Web**: Expo web export for browser deployment
- **Environment**: Production GraphQL endpoint at `https://nestsync-api.railway.app/graphql`

### Backend Deployment
- **Platform**: Railway (Canadian region for PIPEDA compliance)
- **Database**: Supabase production instance with Canadian data residency
- **Environment**: Production environment variables in `.env.production.template`

## Security & Compliance

### PIPEDA Compliance
- All user data stored in Canadian Supabase regions
- Granular consent management with audit trails
- RLS security policies ensuring data isolation
- Privacy-by-design architecture patterns

### Authentication Security
- JWT tokens with secure storage (Expo SecureStore)
- Automatic token refresh with fallback to re-authentication
- Session management with proper cleanup on logout
- Rate limiting and security headers via FastAPI middleware

### Cross-Platform Storage Architecture
- **Universal Storage Pattern**: Uses `useStorageState` from expo-router for cross-platform compatibility
- **Native Platforms**: Direct access to SecureStore for secure token storage
- **Web Platform**: Falls back to localStorage with same API surface
- **Implementation**: `hooks/useUniversalStorage.ts` with platform detection and adaptive storage

## Development Notes

### Critical Patterns to Remember
1. **Database Sessions**: Always use `async for session in get_async_session():` 
2. **Theme Consistency**: Import colors from theme context, not direct constants
3. **Error Handling**: All GraphQL resolvers must have comprehensive try/catch blocks
4. **Canadian Context**: Include PIPEDA compliance headers in all API requests
5. **Development Setup**: Both frontend and backend servers must run simultaneously
6. **Cross-Platform Storage**: Use universal storage hooks, never direct SecureStore imports
7. **Platform Testing**: Test authentication on both web and native platforms before committing

### Performance Considerations
- Apollo Client configured with `cache-first` policy for optimal performance
- Expo image optimization with `expo-image` for faster loading
- Supabase RLS policies optimized to minimize database queries
- React Native Reanimated for smooth, performant animations

This architecture supports a comprehensive Canadian diaper planning application with psychological UX design, PIPEDA compliance, and production-ready development patterns.

## Test Credentials

### Development Testing Account
For consistent development and testing access across the team:

**Email**: parents@nestsync.com  
**Password**: Shazam11#

**Usage Notes**:
- Use these credentials for authentication testing across all platforms (web, iOS, Android)
- This account should have completed onboarding for testing post-login flows
- Available for automated testing scenarios and manual QA validation
- Stored here for team reference and CI/CD pipeline usage

## AI Agent Orchestration Framework

### Agent Assignment Strategy
Claude Code should act as an orchestrator, assigning specialized agents for complex tasks rather than doing all work directly. This improves quality and leverages domain expertise.

**Primary Orchestration Pattern:**
1. **Analyze Task Complexity** - Use sequential thinking for multi-step problems
2. **Assign Specialized Agents** - Delegate to domain experts
3. **Coordinate Research** - Use Context7 for up-to-date documentation
4. **Validate Results** - Use Playwright MCP server for testing

### When to Use Sequential Thinking
- Complex problem breakdown requiring multiple steps
- Debugging issues with unknown root causes
- Planning multi-phase implementations
- Analyzing design specification compliance
- Any task requiring systematic analysis

**Usage Pattern:**
```
Use mcp__sequential-thinking__sequentialthinking for:
- Breaking down complex requirements
- Debugging multi-component interactions
- Planning implementation strategies
- Analyzing failures and root causes
```

### Specialized Agent Assignments

**QA Test Automation Engineer** - Use for:
- Playwright MCP server testing and validation
- Cross-platform functionality verification
- User interface behavior testing
- Integration testing between frontend/backend
- Automated testing strategy development

**Senior Frontend Engineer** - Use for:
- React Native/Expo implementation issues
- State management debugging (Zustand, Apollo Client)
- Animation and UI component development
- Cross-platform compatibility fixes
- Performance optimization

**Senior Backend Engineer** - Use for:
- FastAPI/GraphQL resolver implementation
- Database schema and migration issues
- Supabase integration and RLS policies
- Authentication and PIPEDA compliance
- API design and optimization

**System Architect** - Use for:
- Architecture design and planning
- Technology stack decisions
- Integration pattern design
- Scalability and performance planning
- Cross-component communication design

**UX-UI Designer** - Use for:
- Design system implementation
- Psychology-driven UX pattern implementation
- Accessibility compliance validation
- Canadian context and PIPEDA UI design
- User experience optimization

**General Purpose** - Use for:
- Context7 documentation research
- Multi-domain knowledge synthesis
- Initial problem investigation
- Task coordination and planning

### Context7 Documentation Research

**Always use Context7 for:**
- React Native and Expo best practices
- GraphQL and Apollo Client patterns
- Supabase integration techniques
- Animation library documentation (Lottie, Reanimated)
- Cross-platform development patterns

**Context7 Usage Pattern:**
```
1. Use mcp__context7__resolve-library-id to find library
2. Use mcp__context7__get-library-docs with specific topics
3. Apply documented best practices to implementation
4. Validate against current project patterns
```

### Playwright MCP Server Integration

**Mandatory Playwright Testing for:**
- User interface functionality validation
- Multi-step user flow testing
- Cross-platform behavior verification
- Performance and timing validation
- Integration testing between components

**Testing Workflow:**
1. **Navigate** - Use browser_navigate to reach test target
2. **Snapshot** - Use browser_snapshot for accessibility analysis
3. **Interact** - Use click, type, wait_for for user simulation
4. **Validate** - Check expected behavior and timing
5. **Document** - Record findings for agent assignment

### Task Orchestration Examples

**Complex Debugging (Splash Screen Issue):**
1. **Sequential Thinking** - Analyze problem systematically
2. **QA Test Automation Engineer** - Use Playwright to identify failure points
3. **General Purpose Agent** - Research React Native animation best practices with Context7
4. **Senior Frontend Engineer** - Implement fixes based on findings
5. **QA Test Automation Engineer** - Validate complete functionality

**New Feature Implementation:**
1. **System Architect** - Design technical architecture
2. **UX-UI Designer** - Create design specifications
3. **Senior Frontend/Backend Engineers** - Implement components
4. **QA Test Automation Engineer** - Comprehensive testing validation

### Quality Assurance Standards

**MANDATORY END-TO-END VERIFICATION WORKFLOW:**
Every feature implementation MUST follow this verification process:

1. **Pre-Implementation State Check**
   - Use Playwright to test current functionality before making changes
   - Document existing behavior and any issues found
   - Take snapshots of current state for comparison

2. **Implementation with Progressive Testing**
   - Test functionality incrementally during development
   - Use sequential thinking for complex debugging when issues arise
   - Never claim completion without actual functional verification

3. **Post-Implementation Verification**
   - Use Playwright to test ALL affected functionality end-to-end
   - Verify that claimed fixes actually work in real browser environment
   - Test both primary functionality and edge cases
   - Document before/after states with evidence

4. **Proactive Problem Resolution**
   - If verification reveals issues, immediately use sequential thinking to analyze
   - Research solutions using Context7 when needed
   - Fix problems completely before moving to next task
   - Never leave broken functionality or incomplete fixes

**Before Task Completion:**
- All code must pass Playwright testing validation with real browser verification
- Context7 research must inform implementation decisions
- Agent specialization must be properly utilized
- Sequential thinking must be used for complex problems
- End-to-end verification must prove functionality works as claimed

**Verification Evidence Requirements:**
- Screenshot or snapshot evidence of before/after states
- Console logs showing no critical errors
- Functional testing demonstrating claimed features work
- Real user credential testing (parents@nestsync.com / Shazam11#) when applicable

**Documentation Requirements:**
- Update CLAUDE.md with new patterns or discoveries
- Record agent assignment decisions and outcomes  
- Document Context7 research findings
- Maintain testing validation records with verification evidence

## Professional Development Standards

### Code Quality and Style Guidelines

**NO EMOJIS POLICY**
- Never use emojis in any code, commit messages, documentation, or user-facing content
- Emojis are considered unprofessional and inconsistent with the design system
- Use design system icons and components instead of emojis
- This applies to:
  - All source code files
  - Documentation files (README, comments, etc.)
  - Commit messages
  - User interface text
  - API responses and error messages

**Commit Message Standards**
- Write clear, professional commit messages without emoji or special characters
- Never include Claude Code attribution text or co-authorship
- Use conventional commit format: `type: description`
- Focus on what the change accomplishes, not how it was created

**Design System Compliance**  
- Use only approved icons from the NestSync design system
- Reference design-documentation/ for approved visual elements
- Follow the psychology-driven UX patterns outlined in design documentation
- Maintain consistency with Canadian context and PIPEDA compliance requirements

## Feature Integration Workflow - "Maybe" Keyword Automation

### Trigger: "Maybe" Keyword Usage
When user says "maybe" in context of merging/integrating completed features:

**Auto-execute enhanced squash merge workflow:**
1. Stage all changes with `git add .`
2. Switch to main branch with `git checkout main` 
3. Perform squash merge with `git merge --squash [feature-branch]`
4. Generate comprehensive commit message including:
   - Implementation summary with key features
   - Development journey: bugs discovered, solutions applied, learning points
   - Architecture decisions made and rationale
   - Critical issues identified with severity levels
   - Quality assurance results and validation status
   - Files added/modified with descriptions
   - References to bottlenecks.md and other documentation
   - Next actions required for production readiness
5. Push to remote and clean up feature branch

### Enhanced Commit Message Template
Use comprehensive format that preserves learning context:
- ## Implementation Summary: Core features delivered
- ## Development Journey & Learning Points: Bugs, fixes, discoveries
- ## Architecture Decisions Made: Technical choices and rationale  
- ## Critical Issues Identified & Documented: P0/P1/P2 classification
- ## Quality Assurance Results: Test results and validation status
- ## References & Documentation: Links to analysis and roadmaps

### Benefits of This Approach
- **Clean History**: Single commit per feature on main branch
- **Preserved Learning**: Complete development story captured in commit message
- **Searchable Context**: Git log contains both summary and detailed journey
- **Cross-Referenced**: Links to bottlenecks.md for deeper technical analysis
- **Automated Workflow**: "Maybe" keyword streamlines integration process
- **Knowledge Transfer**: Future developers understand decision-making process

This workflow balances clean main branch history with comprehensive learning context preservation.