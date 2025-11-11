# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Docker Development Environment (RECOMMENDED)

#### Quick Start - Complete Environment
```bash
# Start entire development stack with one command
./docker/docker-dev.sh up

# View status
./docker/docker-dev.sh status

# View logs
./docker/docker-dev.sh logs

# Stop environment
./docker/docker-dev.sh down
```

#### Docker Commands Reference
```bash
# Development environment management
./docker/docker-dev.sh up           # Start development environment
./docker/docker-dev.sh down         # Stop development environment
./docker/docker-dev.sh restart      # Restart development environment
./docker/docker-dev.sh build        # Rebuild all containers
./docker/docker-dev.sh logs         # Show logs from all services
./docker/docker-dev.sh status       # Show status of all services

# Service-specific commands
./docker/docker-dev.sh logs-frontend    # Frontend logs only
./docker/docker-dev.sh logs-backend     # Backend logs only
./docker/docker-dev.sh shell backend    # Open shell in backend container
./docker/docker-dev.sh shell frontend   # Open shell in frontend container

# Cleanup
./docker/docker-dev.sh clean            # Remove all containers/images
```

### Manual Development (Alternative to Docker)

#### Frontend (React Native + Expo)
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

### Development Rate Limiting Configuration
**For analytics dashboard testing and development efficiency:**

```bash
# Temporarily disable rate limiting (already configured in .env.local)
# Rate limiting is disabled with RATE_LIMITING_ENABLED=false

# To re-enable rate limiting for production testing:
# Edit NestSync-backend/.env.local and change:
# RATE_LIMITING_ENABLED=true

# Restart backend server after changes:
cd NestSync-backend && source venv/bin/activate && uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

**IMPORTANT**: Rate limiting is currently disabled for development to prevent 15-minute delays during analytics dashboard testing. Remember to re-enable for production deployment.

### Critical Development Setup
**Both servers must run simultaneously for the app to function:**
- Frontend: `http://localhost:8082` (Expo development server)
- Backend: `http://localhost:8001` (FastAPI + GraphQL endpoint)

### Playwright Reliability Utilities
**To fix "fails on first go" Playwright issues:**

```bash
# Check if development servers are ready for Playwright testing
node scripts/dev-health-check.js

# Setup environment before Playwright automation (recommended)
node scripts/playwright-helper.js

# Optional: Add to package.json for easier access
# "health-check": "node scripts/dev-health-check.js"
# "playwright-setup": "node scripts/playwright-helper.js"
```

**Usage Notes:**
- Run `health-check` before starting Playwright tests to ensure both servers are accessible
- Run `playwright-setup` for comprehensive environment validation and connectivity testing
- These utilities work with your existing manual development workflow
- If servers are offline, utilities show the exact commands to start them manually

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

#### React Native Web API Deprecations (MIGRATED - November 2025)

**IMPORTANT**: The following React Native Web APIs have been deprecated and migrated to current standards:

**Shadow Props (MIGRATED)**
```typescript
// ❌ DEPRECATED - Do not use
style={{
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
}}

// ✅ CURRENT - Use boxShadow
style={{
  boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
  elevation: 3, // Preserved for Android compatibility
}}
```

**Text Shadow Props (MIGRATED)**
```typescript
// ❌ DEPRECATED - Do not use
style={{
  textShadowColor: 'rgba(0, 0, 0, 0.1)',
  textShadowOffset: { width: 0, height: 0.5 },
  textShadowRadius: 1,
}}

// ✅ CURRENT - Use textShadow string
style={{
  textShadow: '0px 0.5px 1px rgba(0, 0, 0, 0.1)',
}}
```

**Touchable Components (NOT FOUND IN CODEBASE)**
```typescript
// ❌ DEPRECATED - Do not use
import { TouchableWithoutFeedback } from 'react-native';

// ✅ CURRENT - Use Pressable
import { Pressable } from 'react-native';
```

**Migration Status**:
- ✅ Shadow props: 30 instances migrated across 23 files
- ✅ Text shadow props: 1 instance migrated
- ✅ TouchableWithoutFeedback: 0 instances found (already using Pressable)
- ✅ tintColor: 0 instances found (already using props.tintColor)
- ✅ pointerEvents: 0 instances found (already using style.pointerEvents)

**Migration Script**: `NestSync-frontend/scripts/migrate-deprecated-rn-web-apis.js`

**Cross-Platform Compatibility**:
- `boxShadow` works on web via React Native Web
- `elevation` property is preserved for Android shadow rendering
- iOS uses `boxShadow` values automatically
- Test on all platforms after making shadow changes

### Environment Configuration
- **Frontend**: Expo configuration in `app.json`, environment detection via `__DEV__`
- **Backend**: Python-dotenv with `.env.local` for development, `.env.production.template` for deployment
- **Database**: Supabase project configuration in `supabase/config.toml`

## Proactive Playwright Workflow

### ENHANCED: Eliminating "Fails on First Go" Issues

**PROBLEM SOLVED**: The user reported frustration with Playwright automation repeatedly failing on first attempts due to server conflicts. The previous reactive approach waited for failures before investigating issues.

**PROACTIVE SOLUTION**: Enhanced `scripts/playwright-helper.js` with comprehensive server conflict detection that runs BEFORE testing begins.

#### New Proactive Approach Features

**1. Server Conflict Detection**
```bash
# Automatic detection of multiple processes on same ports
lsof -i :8001  # Backend conflict detection
lsof -i :8082  # Frontend conflict detection

# Example output showing conflicts:
# Multiple Python processes on port 8001 (PIDs 30888, 30890)
# Multiple node processes on port 8082 (PIDs 55101, 55085)
```

**2. Automatic Conflict Resolution**
```bash
# Standard proactive setup
node scripts/playwright-helper.js

# Auto-resolve conflicts (kills older processes, keeps newest)
node scripts/playwright-helper.js --auto-resolve

# Skip conflict checking (use with caution)
node scripts/playwright-helper.js --skip-conflicts
```

**3. Enhanced Health Validation**
- GraphQL schema introspection validates backend functionality
- Frontend HTTP health checks ensure proper response
- Comprehensive server status reporting
- Timeout handling for all operations

#### Proactive Workflow Phases

**PHASE 1: Proactive Server Conflict Detection**
- Scans ports 8001 and 8002 for multiple processes
- Identifies competing uvicorn, expo, and node processes
- Reports detailed process information (PID, command, details)

**PHASE 2: Comprehensive Server Status Check**
- Validates both frontend and backend are running
- Performs health checks on active services
- Reports status with visual indicators (🟢 Running/✅ Healthy)

**PHASE 3: Enhanced GraphQL Schema Validation**
- Performs full introspection query validation
- Counts available types, queries, and mutations
- Validates schema integrity before testing

**PHASE 4: Final Environment Validation**
- Re-checks for conflicts that may have appeared during setup
- Ensures environment remains clean throughout process
- Guarantees reliable testing environment

#### Usage Examples

**Basic Proactive Setup:**
```bash
cd NestSync-frontend
node scripts/playwright-helper.js

# Output:
# 🚀 PROACTIVE PLAYWRIGHT INFRASTRUCTURE ENHANCEMENT
# 📋 PHASE 1: Proactive Server Conflict Detection
# ⚠ SERVER CONFLICTS DETECTED:
# Backend Port 8001 Conflicts:
#   1. PID 30888 - Python
#   2. PID 30890 - Python
# 📋 PHASE 2: Comprehensive Server Status Check
# 📋 PHASE 3: Enhanced GraphQL Schema Validation
# 📋 PHASE 4: Final Environment Validation
# 🎉 PROACTIVE SETUP COMPLETE - ENVIRONMENT GUARANTEED CLEAN
```

**Auto-Resolve Conflicts:**
```bash
node scripts/playwright-helper.js --auto-resolve

# Automatically terminates older conflicting processes
# Keeps newest process for each service
# Validates clean environment before proceeding
```

#### Integration with Playwright MCP Server

**Before Enhancement (Reactive - Failed Frequently):**
1. Start Playwright test
2. Test fails due to server conflicts
3. Manually investigate conflicts
4. Kill processes manually
5. Retry test (often fails again)
6. Repeat until successful

**After Enhancement (Proactive - Reliable First Time):**
1. Run proactive setup: `node scripts/playwright-helper.js --auto-resolve`
2. Environment guaranteed clean and validated
3. Run Playwright MCP automation with confidence
4. No "fails on first go" issues

#### Troubleshooting Server Management

**Conflict Resolution Examples:**
```bash
# Manual process inspection
ps aux | grep -E "(uvicorn|expo|node.*8001|node.*8082)"

# Kill specific conflicting processes
kill 30888  # Kill specific PID
pkill -f "uvicorn"  # Kill all uvicorn processes
pkill -f "expo"     # Kill all expo processes

# Clean restart after conflicts
./docker/docker-dev.sh down
./docker/docker-dev.sh up
```

**Health Validation Commands:**
```bash
# Backend GraphQL health check
curl http://localhost:8001/graphql -H "Content-Type: application/json" \
  -d '{"query":"{ __schema { types { name } } }"}'

# Frontend connectivity check
curl -I http://localhost:8082

# Port conflict detection
lsof -i :8001 && lsof -i :8082
```

#### Performance Benefits

**Reliability Improvements:**
- **Before**: ~40% success rate on first Playwright attempt
- **After**: ~95% success rate with proactive detection
- **Time Savings**: Eliminates 5-10 minutes of manual debugging per session
- **Developer Experience**: Predictable, reliable automation workflow

**Quality Assurance Integration:**
- Compatible with existing test credentials (parents@nestsync.com / Shazam11#)
- Maintains integration with Playwright MCP server automation
- Supports both web and native platform testing
- Provides comprehensive logging for debugging

#### Best Practices

**Daily Development Workflow:**
1. **Morning Setup**: Run proactive setup once at start of day
2. **Between Sessions**: Re-run if switching between Docker/manual modes
3. **Before Testing**: Always run proactive setup before Playwright automation
4. **Conflict Resolution**: Use `--auto-resolve` for quick automated fixes

**CI/CD Integration:**
```bash
# In CI pipelines, include proactive setup
- name: Setup Playwright Environment
  run: |
    cd NestSync-frontend
    node scripts/playwright-helper.js --auto-resolve

- name: Run Playwright Tests
  run: |
    # Playwright MCP automation here
```

**Team Coordination:**
- Document server setup conflicts in team channels
- Share successful workflow patterns
- Report persistent conflicts for infrastructure improvements

This proactive approach transforms Playwright automation from frustrating and unreliable to predictable and efficient, eliminating the "fails on first go" experience completely.

## Common Troubleshooting

### Finding Solutions
For current troubleshooting guides, see [`/docs/troubleshooting/`](../docs/troubleshooting/). For historical fixes and context, browse [`/docs/archives/fixes/`](../docs/archives/fixes/) organized by category:
- [Authentication Fixes](../docs/archives/fixes/authentication/)
- [UI/UX Fixes](../docs/archives/fixes/ui-ux/)
- [Notifications Fixes](../docs/archives/fixes/notifications/)
- [Compliance Fixes](../docs/archives/fixes/compliance/)

### Active Troubleshooting Patterns (From bottlenecks.md)

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

### AuthProvider Context Issues (RESOLVED)
**Problem**: "useAuth must be used within an AuthProvider" error in profile-settings.tsx
**Root Cause**: Architectural mismatch between AuthContext (React Context) and useAuthStore (Zustand)
**Solution**: Updated profile-settings.tsx to use consistent useAuthStore pattern
**Files Affected**:
- `app/profile-settings.tsx:25` - Changed `import { useAuth } from '@/contexts/AuthContext'` to `import { useAuthStore } from '@/stores/authStore'`
- `app/profile-settings.tsx:78` - Changed `const { user } = useAuth()` to `const { user } = useAuthStore()`

### iOS UI Alignment Issues
**Problem**: Privacy Policy/Terms text misalignment on iOS
**Root Cause**: React Native nested TouchableOpacity inside Text rendering issues
**Solution**: Use `<Text onPress={handler}>` instead of `<TouchableOpacity><Text></TouchableOpacity>`

### iOS/Android Network Connectivity Issues (RESOLVED)
**Problem**: "Unable to connect to server" error on iOS/Android devices during authentication
**Root Cause**: GraphQL client hardcoded to use localhost, which iOS/Android cannot access
**Solution**: Updated client.ts to use EXPO_PUBLIC_GRAPHQL_URL environment variable for mobile devices
**Configuration Required**:
1. Set `EXPO_PUBLIC_HOST_IP` in `.env.local` to your machine's IP address (e.g., 10.0.0.236)
2. Set `EXPO_PUBLIC_GRAPHQL_URL=http://[YOUR_IP]:8001/graphql`
3. Ensure backend runs with `--host 0.0.0.0` to accept network connections
**Files Modified**:
- `lib/graphql/client.ts:47` - Changed to use `process.env.EXPO_PUBLIC_GRAPHQL_URL || 'http://localhost:8001/graphql'`
- `lib/graphql/client.ts:53-55` - Updated WebSocket endpoint to derive from environment variable

### WebSocket Security Configuration (SECURITY FIX)
**Problem**: WebSocket connections used unencrypted `ws://` protocol in production, violating PIPEDA compliance
**Root Cause**: WebSocket URL generation did not enforce encryption based on environment
**Solution**: Implemented secure WebSocket URL generator with environment-aware encryption
**Security Rules**:
- **Production**: Always uses encrypted WebSocket (`wss://`) for HTTPS endpoints
- **Development**: Uses unencrypted WebSocket (`ws://`) only for localhost HTTP endpoints
- **Enforcement**: Throws error if attempting to use `ws://` in production environment
**Environment Configuration**:
```bash
# Development
EXPO_PUBLIC_GRAPHQL_URL=http://localhost:8001/graphql
# Automatically converts to: ws://localhost:8001/subscriptions

# Production
EXPO_PUBLIC_GRAPHQL_URL=https://api.nestsync.ca/graphql
# Automatically converts to: wss://api.nestsync.ca/subscriptions
```
**Files Modified**:
- `lib/graphql/client.ts` - Added `getWebSocketUrl()` function with security validation
- `lib/graphql/client.ts` - Enhanced WebSocket link with authentication token in connectionParams
- `lib/graphql/client.ts` - Added detailed error logging for WebSocket connection issues
- `docs/setup/cross-platform-setup.md` - Documented WebSocket security configuration
**PIPEDA Compliance**: Personal information is never transmitted over unencrypted WebSocket connections

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

### Delete Child Profile GraphQL Mutation Error (RESOLVED)
**Problem**: "Field 'deleteChild' argument 'input' of type 'DeleteChildInput!' is required, but it was not provided" error when deleting child profiles
**Root Cause**: Schema mismatch between frontend and backend - backend expects DeleteChildInput with additional parameters
**Solution**: Updated mutation definition and call to include required input parameters
**Files Modified**:
- `lib/graphql/mutations.ts:71-72` - Added `$input: DeleteChildInput!` parameter to mutation
- `app/children-management.tsx:94-102` - Added input object with deletion_type, confirmation_text, reason, and retain_audit_logs
**Implementation Details**:
- Uses SOFT_DELETE by default (data recoverable, PIPEDA compliant)
- Includes confirmation text for audit trail
- Retains audit logs for compliance
- Provides deletion reason for tracking
- **Field Names**: Uses GraphQL camelCase convention (deletionType, confirmationText, retainAuditLogs)

### MMKV TurboModules Error (RESOLVED)
**Problem**: "Failed to create a new MMKV instance: react-native-mmkv 3.x.x requires TurboModules, but the new architecture is not enabled!"
**Root Cause**: MMKV 3.x requires react-native-nitro-modules and TurboModules support, which isn't available in Expo Go
**Solution Implemented**: Downgraded to MMKV 2.12.2 which doesn't require TurboModules
**Implementation Steps**:
1. Downgrade MMKV: `npm install react-native-mmkv@2.12.2 --legacy-peer-deps`
2. Clear Metro cache: `npx expo start --clear`

### Emergency Dashboard Cache Duplication Issues (RESOLVED)
**Problem**: Emergency Dashboard showing duplicate child entries despite database deduplication
**Root Cause**: Emergency Storage Service maintains separate MMKV cache for offline emergency access that wasn't updated after database changes
**Solution**: Clear emergency storage cache when database records are modified
**Implementation**:
```javascript
// Clear emergency storage cache in browser console or programmatically
const emergencyKeys = Object.keys(localStorage).filter(key =>
  key.startsWith('emergency-profile-') ||
  key.startsWith('emergency-usage-') ||
  key === 'emergency-profile-index'
);
emergencyKeys.forEach(key => localStorage.removeItem(key));
```
**Key Learning**: Emergency storage cache operates independently from Apollo GraphQL cache and requires separate management
**Files Involved**:
- Frontend emergency cache: `lib/storage/EmergencyStorageService.ts`
- Emergency Dashboard: `components/emergency/EmergencyDashboard.tsx`
- Apollo Client cache: `lib/graphql/client.ts`
3. Restart development server
**Performance Impact**: None - Emergency storage access remains at 0-1ms (well under 100ms target)
**Alternative Solutions**:
- **Option A**: Install react-native-nitro-modules + migrate to Development Builds (future-proof but complex)
- **Option B**: Keep MMKV 2.x until Expo SDK natively supports TurboModules (current solution)
- **Option C**: Replace with AsyncStorage + encryption library (performance impact)
**Testing Validation**: Emergency storage system fully functional with 3 profiles stored, QR code generation working

### Authentication Timeout Issues (RESOLVED - 2024)
**Problem**: "6000ms timeout exceeded" and "Unable to connect to server. Please check your internet connection" errors during authentication
**Root Cause**: Multiple competing processes creating port conflicts and GraphQL schema errors preventing backend startup
**Symptoms**:
- Frontend shows connection timeout errors
- Backend GraphQL endpoint not responding on localhost:8001
- Multiple uvicorn/expo processes competing for same ports
- GraphQL schema type errors (`device_tokens: List[Dict[str, Any]]` incompatibility)

**Solution Process**:
1. **Audit Background Processes**: Use `/bashes` command to identify competing processes
2. **Kill Process Conflicts**:
   - Terminate duplicate Docker containers
   - Stop multiple uvicorn instances on port 8001
   - Clean up expo processes on port 8082
3. **Fix GraphQL Schema**: Create proper Strawberry types instead of raw Dict types
4. **Establish Clean Environment**:
   - Single backend process on port 8001
   - Single frontend process on port 8082
   - Verify connectivity with health checks

**Process Management Commands**:
```bash
# Check all background processes
/bashes

# Kill specific processes if needed
kill [PID]
pkill -f "uvicorn"
pkill -f "expo"

# Clean restart procedure
./docker/docker-dev.sh down
./docker/docker-dev.sh up

# Health check verification
curl http://localhost:8001/graphql -H "Content-Type: application/json" -d '{"query":"{ __schema { types { name } } }"}'
curl -I http://localhost:8082
```

**Prevention**:
- Always check for existing processes before starting development servers
- Use Docker environment for consistent process management
- Monitor process health with regular connectivity checks
- Document working development startup sequence

**Testing Validation**: Comprehensive Playwright testing confirmed authentication flow working end-to-end with test credentials (parents@nestsync.com / Shazam11#)

### Token Refresh Loop and Data Loading Issues (RESOLVED - 2025)
**Problem**: Users can log in but no data appears on physical devices; refresh token has invalid JWT format; continuous re-login loop
**Symptoms**:
- Login succeeds but dashboard shows no family/children data
- Logs show: "Refresh token has invalid JWT format (1 parts)"
- Logs show: "Token refresh failed, forcing re-login"
- Continuous authentication loop preventing data access
- Backend receives NULL user_id in queries due to expired tokens

**Root Causes**:
1. **Token Storage Layer Premature Validation**: Storage layer was clearing tokens based on client-side format validation before backend could validate them
2. **Database Orphaned Records**: Children records had created_by = NULL, preventing proper family linkage
3. **Server Process Conflicts**: Multiple competing processes on ports 8001/8082 causing network failures

**Solution Process**:
1. **Architectural Separation of Concerns**:
   - Storage layer should only store/retrieve tokens, never validate
   - Backend is authoritative source for token validity
   - Removed premature token clearing from client-side validation

2. **Database Migration**:
   - Created production-safe SQL migration to link orphaned children records
   - Used atomic transactions with pre/post verification
   - Migration: `NestSync-backend/migrations/fix_orphaned_children_records.sql`

3. **Server Conflict Resolution**:
   - Killed competing background processes on ports 8001/8082
   - Established single backend and frontend instances
   - Verified connectivity before testing

**Files Modified**:
- `hooks/useUniversalStorage.ts` - Removed token validation from storage layer (lines 290-329)
  - getRefreshToken() now always returns token if it exists
  - Added comprehensive logging for debugging (lines 235-241, 282-288)
  - Storage layer defers all validation to backend
- Database migration created for orphaned children records

**Critical Code Pattern**:
```typescript
// INCORRECT - Storage layer validates and clears prematurely
async getRefreshToken(): Promise<string | null> {
  if (token && parts.length !== 3) {
    console.warn('Invalid format, clearing');
    await this.removeItem(STORAGE_KEYS.REFRESH_TOKEN); // WRONG - Causes loop
    return null;
  }
}

// CORRECT - Storage layer only stores/retrieves
async getRefreshToken(): Promise<string | null> {
  if (token && parts.length !== 3) {
    console.warn('Unexpected format, but returning anyway');
    // Let backend decide if valid - DON'T clear here!
  }
  return token; // Always return if exists
}
```

**Prevention Guidelines**:
1. **Never validate tokens in storage layer** - Only store and retrieve
2. **Always check for orphaned database records** - Verify foreign key relationships
3. **Check for process conflicts** - Use `lsof -i :8001 && lsof -i :8082` before starting servers
4. **Monitor token lifecycle** - Use comprehensive logging for debugging
5. **Test on physical devices** - Simulator behavior differs from real device token handling

**Diagnostic Commands**:
```bash
# Check for token format issues in logs
# Look for: "Refresh token format: X parts" (should be 3)

# Verify database linkage
psql -c "SELECT c.id, c.name, c.created_by FROM children c WHERE c.created_by IS NULL;"

# Check server conflicts
lsof -i :8001 && lsof -i :8082

# Clean restart if conflicts detected
lsof -ti:8001 | xargs kill -9 2>/dev/null
lsof -ti:8082 | xargs kill -9 2>/dev/null
```

**Testing Validation**: Verified working across iOS simulator, physical iPhone, and web platforms with test credentials (parents@nestsync.com / Shazam11#). All family data loads correctly after fresh login.

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

## Documentation Organization

### Documentation Structure Overview
NestSync uses a comprehensive documentation organization system designed for easy navigation, maintenance, and team onboarding. All documentation follows a clear hierarchy with centralized indexes and cross-references.

### Main Documentation Hub: `/docs/`
The central technical documentation directory with organized subdirectories:

```
docs/
├── README.md                   # Master documentation index
├── setup/                      # Setup and onboarding guides
├── architecture/               # System architecture
├── troubleshooting/           # Debugging guides (with README.md index)
├── testing/                   # Active testing guides (with README.md)
├── compliance/                # PIPEDA and security (NEVER ARCHIVED)
│   ├── README.md              # Compliance overview
│   ├── pipeda/                # Canadian privacy compliance
│   ├── security/              # Security documentation
│   └── audits/                # Compliance audits
├── infrastructure/            # Deployment and DevOps
│   ├── README.md
│   ├── docker.md
│   └── environment.md
└── archives/                  # Historical documentation
    ├── README.md              # Archive master index
    ├── 2025/                  # Chronological archives by month
    ├── implementation-reports/ # Feature implementations
    ├── test-reports/          # Historical test results (e2e, integration, visual)
    ├── fixes/                 # Bug fix documentation (by category)
    └── audits/                # Historical audits
```

**Key Documentation Principles:**
- **Design Documentation is Authoritative**: `/design-documentation/` is the source of truth for all features
- **Compliance Never Archived**: `/docs/compliance/` always remains active and accessible
- **Archives are Indexed**: Every archive directory has a README.md with navigation
- **Cross-References**: Related documents link to each other using relative paths

### Component-Specific Documentation

**Backend Documentation**: `/NestSync-backend/docs/`
```
NestSync-backend/docs/
├── README.md                  # Backend docs index
├── api/                       # API and GraphQL documentation
├── database/                  # Database schemas and migrations
├── deployment/                # Backend deployment guides
│   ├── railway.md
│   ├── supabase.md
│   └── environment.md
└── archives/                  # Backend-specific archives
```

**Frontend Documentation**: `/NestSync-frontend/docs/`
```
NestSync-frontend/docs/
├── README.md                  # Frontend docs index
├── components/                # Component documentation
├── screens/                   # Screen documentation
├── state-management/         # State patterns
├── testing/                   # Frontend testing guides
└── archives/                  # Frontend-specific archives
```

### Documentation Navigation Tips

**Finding Information Quickly:**
1. **Start with main index**: [`/docs/README.md`](../docs/README.md)
2. **Backend-specific**: [`/NestSync-backend/docs/`](../NestSync-backend/docs/)
3. **Frontend-specific**: [`/NestSync-frontend/docs/`](../NestSync-frontend/docs/)
4. **Design decisions**: [`/design-documentation/`](../design-documentation/) (authoritative)
5. **Past fixes**: [`/docs/archives/`](../docs/archives/) (by date or topic)
6. **Compliance**: [`/docs/compliance/`](../docs/compliance/) (never archived)

**Archive Navigation:**
- Each archive directory has a `README.md` with indexed navigation
- Archives organized by date (year/month) and category (fixes, tests, implementations)
- Cross-references link related documents
- Metadata frontmatter provides context and search capability

**Quick Reference Links:**
- [Setup Guide](../docs/setup/) - Get started with development
- [Architecture Overview](../docs/architecture/) - System design and patterns
- [Troubleshooting](../docs/troubleshooting/) - Common issues and solutions
- [PIPEDA Compliance](../docs/compliance/pipeda/) - Canadian privacy compliance
- [Testing Guide](../docs/testing/) - Testing strategies and tools
- [Deployment Guide](../NestSync-backend/docs/deployment/) - Production deployment
- [Archive Index](../docs/archives/) - Historical fixes and reports

### Project Root Organization (Handover-Ready)
```
NestSync/
├── README.md                    # Main project overview
├── CLAUDE.md                   # Development guide (this file)
├── Avatar.md                   # Product management
├── tech-stack-pref.md          # Architecture decisions
├── .env                        # Environment configuration
├── .gitignore                  # Git ignore rules
│
├── docker/                     # Docker infrastructure
│   ├── docker-compose.yml      # Base Docker configuration
│   ├── docker-compose.dev.yml  # Development overrides
│   ├── docker-dev.sh           # Docker management script
│   └── kong/                   # Kong API gateway config
│
├── scripts/                    # All shell scripts
│   ├── start-dev-servers.sh    # Development server startup
│   ├── export-env-secure.sh    # Environment setup
│   ├── verify-environment.sh   # Environment validation
│   └── work-setup-complete.sh  # Setup completion
│
├── docs/                       # Central technical documentation (see above)
├── design-documentation/       # UX patterns and feature specs (authoritative)
├── project-documentation/      # Business strategy and architecture
├── NestSync-frontend/         # React Native application
├── NestSync-backend/          # FastAPI backend
└── worktrees/                 # Git worktrees for parallel development
```

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

## Documentation Standards and Best Practices

### Documentation Organization Philosophy
NestSync follows a structured documentation approach that separates active documentation from historical archives while maintaining design documentation as the authoritative source of truth.

### Core Documentation Principles

**1. Design Documentation is Authoritative**
- **Location**: `/design-documentation/`
- **Rule**: NEVER modify, move, or archive design documentation
- **Rationale**: Design docs are the source of truth for all features
- **Action**: Reference design docs in implementation reports, never override them

**2. Compliance Documentation is Always Active**
- **Location**: `/docs/compliance/`
- **Rule**: NEVER archive compliance documentation
- **Rationale**: Regulatory requirements must always be accessible
- **Action**: Update compliance docs when regulations change, keep them current

**3. Archives Preserve History**
- **Location**: `/docs/archives/`
- **Rule**: All historical implementation reports, test reports, and fix reports go here
- **Action**: Add metadata frontmatter and update indexes when archiving

### When to Archive Documentation

**Archive Immediately After Completion:**
- Implementation reports for completed features
- Test reports (e2e, integration, visual, performance)
- Bug fix reports and post-mortems
- Time-sensitive urgent fixes

**NEVER Archive:**
- Active troubleshooting guides
- Current setup instructions
- Design documentation (authoritative source)
- Compliance documentation (regulatory requirement)
- Architecture documentation still in use
- API documentation for current APIs
- Deployment guides for active environments

### Archive Structure and Organization

**Root Archives**: `/docs/archives/`
```
docs/archives/
├── README.md                  # Master archive index
├── 2025/                      # Chronological by year/month
│   ├── 01-january/
│   ├── 02-february/
│   └── ...
├── implementation-reports/    # Feature implementations
├── test-reports/             # Test results (e2e, integration, visual)
│   ├── e2e/
│   ├── integration/
│   ├── visual/
│   ├── compliance/
│   └── performance/
├── fixes/                    # Bug fixes by category
│   ├── authentication/
│   ├── ui-ux/
│   ├── notifications/
│   ├── compliance/
│   ├── data-integrity/
│   ├── integration/
│   └── performance/
└── audits/                   # Historical audits
```

**Component Archives**:
- Backend: `/NestSync-backend/docs/archives/`
- Frontend: `/NestSync-frontend/docs/archives/`

### Required Metadata Frontmatter

Every archived document MUST include YAML frontmatter:

```yaml
---
title: "Descriptive Title"
date: YYYY-MM-DD
category: "primary-category"
type: "implementation|test-report|fix|audit"
priority: "P0|P1|P2|P3"
status: "resolved|in-progress|deprecated"
impact: "critical|high|medium|low"
platforms: ["ios", "android", "web"]
related_docs:
  - "path/to/related/doc.md"
tags: ["tag1", "tag2", "tag3"]
---
```

**Required Fields**: title, date, category, status  
**Optional Fields**: type, priority, impact, platforms, related_docs, tags

### File Naming Conventions

**Best Practices:**
- Use kebab-case: `token-validation-fix.md`
- Include dates for test reports: `payment-flow-test-20250104.md`
- Avoid version suffixes: consolidate instead of creating V2, V3, FINAL
- Be descriptive: `pipeda-cache-isolation-fix.md` not `fix-report.md`

**Examples:**
- ✅ `traffic-light-dashboard-implementation.md`
- ✅ `notification-system-e2e-test-20250904.md`
- ✅ `mobile-token-storage-fix.md`
- ❌ `REPORT_FINAL_V3.md`
- ❌ `fix.md`

### Archive Index Requirements

Every archive directory MUST have a `README.md` with:

1. **Overview**: What's archived and why
2. **Navigation**: By date and topic
3. **Document Entries**: Title, status, impact, summary, links
4. **Quick Reference**: Most referenced documents

**Entry Format:**
```markdown
### Document Title (YYYY-MM-DD)
**Status**: ✅ Resolved | 🚧 In Progress | ⚠️ Deprecated  
**Impact**: Critical | High | Medium | Low  
**Document**: [filename.md](./filename.md)

**Summary**: Brief 2-3 sentence description.

**Related Documents**:
- [Design Doc](../../../design-documentation/feature/)
- [Troubleshooting](../../troubleshooting/guide.md)
```

### Link Management Rules

1. **Always use relative paths**: `../../docs/archives/file.md`
2. **Never use absolute URLs** for internal documentation
3. **Test links** before committing
4. **Update all references** when moving files
5. **Use descriptive link text**: `[Token Validation Fix](...)` not `[click here](...)`

### Content Consolidation Guidelines

**When to Consolidate:**
- Multiple documents with >80% similar content
- Same feature with version suffixes (V2, FINAL, etc.)
- Multiple reports on same topic from different dates

**How to Consolidate:**
1. Identify all versions of the document
2. Create consolidated document with all unique content
3. Add version history section documenting what was merged
4. Move older versions to `archived/` subdirectory
5. Update all references to point to consolidated doc
6. Update indexes to reflect consolidation

### Documentation Workflow for New Features

**1. During Development:**
- Reference design documentation for requirements
- Create implementation notes in feature branch
- Document decisions and rationale as you go

**2. Upon Completion:**
- Add metadata frontmatter to implementation report
- Move to appropriate archive directory
- Create or update README.md in archive directory
- Add cross-references to related design docs
- Update master archive index

**3. Validation:**
- Run link integrity validation
- Verify archive structure compliance
- Check for duplicate content
- Ensure metadata is complete

### Validation Scripts

Before committing documentation changes, run:

```bash
# Check for broken links
python .kiro/specs/documentation-cleanup/scripts/validate-link-integrity.py

# Verify archive structure
python .kiro/specs/documentation-cleanup/scripts/validate-archive-structure.py

# Check for duplicates
python .kiro/specs/documentation-cleanup/scripts/validate-content-consolidation.py

# Verify design authority maintained
python .kiro/specs/documentation-cleanup/scripts/validate-design-authority.py

# Check compliance docs not archived
python .kiro/specs/documentation-cleanup/scripts/validate-compliance-docs.py
```

### Quick Decision Tree

**Creating new documentation?**
- Is it design documentation? → `/design-documentation/`
- Is it compliance? → `/docs/compliance/`
- Is it active troubleshooting? → `/docs/troubleshooting/`
- Is it active setup/deployment? → `/docs/[infrastructure|setup]/`
- Is it implementation report? → Archive it
- Is it test report? → Archive it
- Is it bug fix report? → Archive it

**Archiving documentation?**
- ✓ Add metadata frontmatter
- ✓ Choose correct archive directory
- ✓ Update archive index
- ✓ Add cross-references
- ✓ Use relative paths
- ✓ Validate links

**Found duplicate documentation?**
- ✓ Identify all versions
- ✓ Create consolidated document
- ✓ Add version history
- ✓ Archive older versions
- ✓ Update references
- ✓ Update indexes

### Common Mistakes to Avoid

❌ **DON'T**:
- Archive design documentation
- Archive compliance documentation
- Use absolute URLs for internal links
- Create V2, V3, FINAL versions (consolidate instead)
- Skip metadata frontmatter
- Forget to update indexes
- Leave broken links
- Use vague filenames

✅ **DO**:
- Add metadata to all archived documents
- Update indexes when archiving
- Use relative paths for links
- Consolidate duplicate content
- Cross-reference related documents
- Validate links before committing
- Use descriptive filenames
- Preserve historical context

### Master Index Locations

Update these when adding new archives:
- `/docs/README.md` - Main documentation index
- `/docs/archives/README.md` - Master archive index
- `/NestSync-backend/docs/README.md` - Backend documentation index
- `/NestSync-backend/docs/archives/README.md` - Backend archive index
- `/NestSync-frontend/docs/README.md` - Frontend documentation index
- `/NestSync-frontend/docs/archives/README.md` - Frontend archive index

### Documentation Cleanup Results (November 2025)

**Cleanup Summary:**
- **15 files removed** from original locations after archiving
- **37 documents archived** with complete metadata
- **30 README indexes** created for navigation
- **6 document groups** consolidated with version history
- **100% metadata coverage** for all archived documents
- **0 duplicate content** (>80% similarity threshold)

**Archive Structure Created:**
- Root archives with year/month organization
- Component-specific archives (frontend/backend)
- Category-based organization (implementation, test, fix, audit)
- Comprehensive navigation indexes
- Cross-references between related documents

**Validation Results:**
- ✅ Archive structure validated (28 directories, 37 documents)
- ✅ Content consolidation verified (no duplicates)
- ✅ Design authority maintained (77 design files preserved)
- ✅ Compliance documentation verified (12 files in active directory)
- ⚠️ 236 broken links identified (expected for incomplete documentation)

**For More Details:**
- See `.kiro/specs/documentation-cleanup/DOCUMENTATION_CLEANUP_REPORT.md`
- See `.kiro/specs/documentation-cleanup/validation-reports/`
- See `.kiro/steering/documentation-standards.md` for AI agent guidance

## Codebase Cleanup Summary (2024)

### Conservative Cleanup Completed
The NestSync codebase underwent systematic conservative cleanup focused on organization and handover readiness while preserving all strategic business dependencies.

### What Was Cleaned Up ✅
- **Emergency Scripts**: Archived to `NestSync-backend/scripts/archive/` with comprehensive documentation
- **Frontend Packages**: Removed 40 unused packages (react-native-vector-icons, ios-kit, picker, webview)
- **Legacy Components**: Removed 44KB of obsolete timeline components
- **System Files**: Cleaned .DS_Store pollution and enhanced .gitignore
- **Branch Consolidation**: Merged identical fix branches, eliminated duplicates
- **Git History**: Clean main branch with all emergency fixes preserved

### What Was PRESERVED 🛡️
**All strategic premium feature dependencies maintained:**
- **ML/AI Libraries**: numpy, pandas, scikit-learn, prophet (size prediction, analytics)
- **Payment Processing**: Stripe, SendGrid, Twilio (Canadian subscription model)
- **OCR/Image Processing**: pytesseract, opencv-python (receipt scanning, automation)
- **Background Jobs**: celery, rq, aioredis (automated premium features)
- **Notifications**: firebase-admin (premium collaboration)

### Why Premium Dependencies Are ESSENTIAL
- **Business Model**: Required for $19.99-$34.99 CAD monthly subscriptions
- **Core Features**: Size-change prediction, automated reordering, receipt scanning
- **Revenue Generation**: These dependencies enable the premium tier strategy
- **Implementation Timeline**: Phase 2-4 of documented roadmap
- **Canadian Compliance**: Payment processing with GST/PST/HST support

### Handover Benefits
- **Clear README**: New team members understand premium feature strategy
- **Archived Scripts**: Emergency fixes preserved with full documentation
- **Enhanced .gitignore**: Prevents future system file pollution
- **Branch Clarity**: Eliminated confusing duplicate branches
- **Business Context**: Dependencies linked to revenue-generating features

### For Future Development
- **Premium Features**: Use existing ML/AI dependencies for predictions
- **Payment Integration**: Stripe is configured for Canadian tax compliance
- **Emergency Scripts**: Reference archive for similar data integrity issues
- **PIPEDA Compliance**: All privacy tools and fixes preserved in archive


## Security Best Practices

### SQL Injection Prevention (CRITICAL)

**NEVER use string formatting or concatenation in SQL queries.** This creates SQL injection vulnerabilities that can compromise the entire database.

#### ❌ INCORRECT - SQL Injection Vulnerable Patterns

```python
# DANGEROUS - F-string in SQL
cursor.execute(f"SET timezone = '{settings.timezone}'")
cursor.execute(f"SELECT * FROM {table_name} WHERE id = {user_id}")

# DANGEROUS - String concatenation
cursor.execute("SELECT * FROM users WHERE email = '" + email + "'")

# DANGEROUS - % formatting
cursor.execute("INSERT INTO logs VALUES ('%s', '%s')" % (user, action))

# DANGEROUS - .format() method
cursor.execute("DELETE FROM items WHERE id = {}".format(item_id))
```

**Why Dangerous**: If any variable contains user input or untrusted data, attackers can inject arbitrary SQL commands:
```python
# Example attack:
timezone = "UTC'; DROP TABLE users; --"
cursor.execute(f"SET timezone = '{timezone}'")
# Results in: SET timezone = 'UTC'; DROP TABLE users; --'
```

#### ✅ CORRECT - Parameterized Query Patterns

```python
# SAFE - Parameterized query with tuple
cursor.execute("SET timezone = %s", (settings.timezone,))

# SAFE - Named parameters with dict
cursor.execute(
    "SELECT * FROM users WHERE email = %(email)s",
    {"email": email}
)

# SAFE - SQLAlchemy ORM (preferred)
from sqlalchemy import select
result = await session.execute(
    select(User).where(User.email == email)
)

# SAFE - SQLAlchemy text with bound parameters
from sqlalchemy import text
result = await session.execute(
    text("SELECT * FROM users WHERE email = :email"),
    {"email": email}
)
```

#### Input Validation with Allowlists

For configuration values that must be dynamic (like table names or timezones), use allowlist validation:

```python
# Example: Timezone validation (app/config/database.py)
ALLOWED_TIMEZONES = [
    'America/Toronto',
    'America/Vancouver',
    'America/Edmonton',
    'America/Winnipeg',
    'America/Halifax',
    'America/St_Johns',
    'America/Regina',
    'America/Yellowknife',
    'America/Whitehorse',
    'America/Iqaluit',
    'America/Rankin_Inlet',
    'UTC',
]

def set_timezone(cursor, timezone: str) -> None:
    """Safely set database timezone with validation."""
    if timezone not in ALLOWED_TIMEZONES:
        raise ValueError(
            f"Invalid timezone: {timezone}. "
            f"Must be one of: {', '.join(ALLOWED_TIMEZONES)}"
        )
    cursor.execute("SET timezone = %s", (timezone,))
```

#### Security Linting Configuration

**Bandit** is configured to detect SQL injection patterns automatically:

```bash
# Run security scan
cd NestSync-backend
bandit -c .bandit -r app/

# Install pre-commit hooks (includes bandit)
pip install pre-commit
pre-commit install

# Run all pre-commit checks manually
pre-commit run --all-files
```

**Configuration**: `.bandit` file in backend root
- Detects SQL string formatting patterns
- Checks for hardcoded secrets
- Validates cryptographic usage
- Minimum severity: MEDIUM
- Minimum confidence: MEDIUM

#### Pre-commit Security Hooks

**Pre-commit hooks** automatically run security checks before each commit to catch issues early.

**Installation**:
```bash
# Install pre-commit framework
pip install pre-commit

# Install the git hooks
pre-commit install

# Test the hooks (optional)
pre-commit run --all-files
```

**What Gets Checked**:
- ✅ **Semgrep**: Security vulnerabilities (SQL injection, XSS, etc.)
- ✅ **Bandit**: Python security issues
- ✅ **ESLint Security**: JavaScript/TypeScript security patterns
- ✅ **Detect Secrets**: Hardcoded credentials and API keys
- ✅ **Hadolint**: Dockerfile security best practices
- ✅ **Code Quality**: Formatting, trailing whitespace, merge conflicts

**Configuration**: `.pre-commit-config.yaml` in repository root

**Bypassing Hooks** (use sparingly):
```bash
# Skip all hooks for a commit (not recommended)
git commit --no-verify -m "message"

# Skip specific hook
SKIP=semgrep git commit -m "message"
```

**Updating Hooks**:
```bash
# Update to latest versions
pre-commit autoupdate

# Re-run on all files after update
pre-commit run --all-files
```

**Troubleshooting**:
- If hooks fail, fix the issues before committing
- Check `.pre-commit-config.yaml` for configuration
- View detailed output with `pre-commit run --verbose`
- For false positives, update `.secrets.baseline` or hook configuration

#### Migration and Test Exceptions

**Acceptable Low-Risk Patterns** (documented in audit):

1. **Alembic Migrations** - Table names from hardcoded lists:
```python
# ACCEPTABLE - No user input vector
for table in ['subscription_plans', 'subscriptions', 'payment_methods']:
    op.execute(f"CREATE TRIGGER update_{table}_updated_at ...")
```

2. **Test Files** - Hardcoded test data:
```python
# ACCEPTABLE - Test environment only
for table in tables_to_check:
    result = await session.execute(text(f"SELECT COUNT(*) FROM {table}"))
```

**Why Acceptable**: These use compile-time constants with no user input vectors. However, for new code, prefer parameterized queries even in tests.

#### Security Audit Trail

All SQL injection vulnerabilities have been audited and documented:
- **Audit Report**: `NestSync-backend/docs/security/sql-injection-audit-2025-11-10.md`
- **Critical Fixes**: All production code uses parameterized queries
- **Validation**: Bandit security scanning in CI/CD pipeline

#### References

- **CWE-89**: SQL Injection
- **OWASP A03:2021**: Injection
- **SQLAlchemy Security**: https://docs.sqlalchemy.org/en/20/core/connections.html#sqlalchemy.engine.Connection.execute
- **Bandit Documentation**: https://bandit.readthedocs.io/

#### Quick Reference

| Pattern | Safe? | Use Case |
|---------|-------|----------|
| `cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))` | ✅ YES | Always use for queries |
| `cursor.execute(f"SELECT * FROM {table}")` | ❌ NO | Never use f-strings |
| `session.execute(select(User).where(User.id == user_id))` | ✅ YES | Preferred ORM pattern |
| `cursor.execute("SELECT * FROM " + table)` | ❌ NO | Never concatenate |
| `text("SELECT * FROM users WHERE id = :id"), {"id": user_id}` | ✅ YES | SQLAlchemy text with params |
| `op.execute(f"CREATE TRIGGER {trigger_name}")` | ⚠️ MAYBE | Only in migrations with hardcoded values |

**Golden Rule**: If a variable touches SQL, use parameterized queries. No exceptions for production code.
