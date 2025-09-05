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
**Problem**: "ApolloError: Network request failed"
**Solution**: Ensure both frontend (port 8082) and backend (port 8001) servers are running

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

## Development Notes

### Critical Patterns to Remember
1. **Database Sessions**: Always use `async for session in get_async_session():` 
2. **Theme Consistency**: Import colors from theme context, not direct constants
3. **Error Handling**: All GraphQL resolvers must have comprehensive try/catch blocks
4. **Canadian Context**: Include PIPEDA compliance headers in all API requests
5. **Development Setup**: Both frontend and backend servers must run simultaneously

### Performance Considerations
- Apollo Client configured with `cache-first` policy for optimal performance
- Expo image optimization with `expo-image` for faster loading
- Supabase RLS policies optimized to minimize database queries
- React Native Reanimated for smooth, performant animations

This architecture supports a comprehensive Canadian diaper planning application with psychological UX design, PIPEDA compliance, and production-ready development patterns.

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