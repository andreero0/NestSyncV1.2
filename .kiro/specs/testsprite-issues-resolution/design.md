# Design Document

## Overview

This design addresses the legitimate issues identified in the TestSprite AI testing report and the critical security vulnerabilities discovered by Semgrep analysis. While 91.67% of TestSprite test failures were due to test environment configuration rather than code defects, the Semgrep scan revealed 23 security findings including 5 critical vulnerabilities that must be addressed before production deployment.

The solution focuses on:
1. **Critical Security Fixes**: JWT verification bypass, insecure WebSocket, SQL injection patterns
2. **Missing Features**: Password reset completion route
3. **Code Quality**: JSX structure issues, deprecated API usage
4. **Test Infrastructure**: Environment validation and reliability
5. **PIPEDA Compliance**: Log injection vulnerabilities affecting audit trails

The design follows a security-first approach: fix critical vulnerabilities immediately, then address code quality and test infrastructure improvements.

## Architecture

### System Context

```
┌─────────────────────────────────────────────────────────────┐
│                     Test Environment                         │
│  ┌────────────────┐         ┌──────────────────┐           │
│  │  Test Suite    │────────▶│  Pre-flight      │           │
│  │  (TestSprite)  │         │  Validation      │           │
│  └────────────────┘         └──────────────────┘           │
│         │                            │                       │
│         │                            ▼                       │
│         │                   ┌──────────────────┐           │
│         │                   │  Environment     │           │
│         │                   │  Health Check    │           │
│         │                   └──────────────────┘           │
│         │                            │                       │
│         ▼                            ▼                       │
│  ┌────────────────────────────────────────────┐            │
│  │         Frontend (Port 8082)                │            │
│  │  ┌──────────────────────────────────────┐  │            │
│  │  │  New: reset-password.tsx             │  │            │
│  │  │  Fixed: JSX Structure Issues         │  │            │
│  │  │  Updated: Deprecated API Usage       │  │            │
│  │  └──────────────────────────────────────┘  │            │
│  └────────────────────────────────────────────┘            │
│         │                                                    │
│         ▼                                                    │
│  ┌────────────────────────────────────────────┐            │
│  │         Backend (Port 8001)                 │            │
│  │  - Already running and healthy              │            │
│  │  - Supabase Auth configured                 │            │
│  │  - Database connected                       │            │
│  └────────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

### Design Principles

1. **Security First**: Address critical vulnerabilities before any other changes
2. **PIPEDA Compliance**: Ensure all fixes maintain Canadian privacy law compliance
3. **Fix Real Issues Only**: Focus on legitimate code problems, not test environment configuration
4. **Improve Testability**: Make it easier to distinguish environment issues from code defects
5. **Maintain Compatibility**: Update deprecated APIs without breaking existing functionality
6. **Document Thoroughly**: Provide clear setup instructions for test environments

## Components and Interfaces

### 1. JWT Verification Security Fix (CRITICAL)

**Location**: `NestSync-backend/app/auth/supabase.py:361`

**Current Vulnerability**:
```python
# INSECURE - Bypasses signature verification
unverified_payload = jwt.decode(token, options={"verify_signature": False})
```

**Security Fix**:
```python
# SECURE - Properly verify JWT signature
try:
    verified_payload = jwt.decode(
        token,
        settings.SUPABASE_JWT_SECRET,
        algorithms=["HS256"],
        options={"verify_signature": True}
    )
except jwt.ExpiredSignatureError:
    raise AuthenticationError("Token has expired")
except jwt.InvalidTokenError:
    raise AuthenticationError("Invalid token")
```

**Impact**: 
- **CWE-287**: Improper Authentication
- **OWASP A07:2021**: Identification and Authentication Failures
- **PIPEDA Violation**: Unauthorized data access possible

**Testing**:
- Attempt to forge JWT tokens with invalid signatures
- Verify expired tokens are rejected
- Test with tampered token payloads
- Validate proper error messages

### 2. Secure WebSocket Connection Fix (CRITICAL)

**Location**: `NestSync-frontend/lib/graphql/client.ts:54`

**Current Vulnerability**:
```typescript
// INSECURE - Uses unencrypted WebSocket
? process.env.EXPO_PUBLIC_GRAPHQL_URL.replace('http://', 'ws://').replace('/graphql', '/subscriptions')
```

**Security Fix**:
```typescript
// SECURE - Use encrypted WebSocket (wss://)
const getWebSocketUrl = (httpUrl: string): string => {
  // Convert http:// to ws:// for local development
  // Convert https:// to wss:// for production
  return httpUrl
    .replace('https://', 'wss://')
    .replace('http://', process.env.NODE_ENV === 'production' ? 'wss://' : 'ws://')
    .replace('/graphql', '/subscriptions');
};

const wsLink = new GraphQLWsLink(
  createClient({
    url: getWebSocketUrl(process.env.EXPO_PUBLIC_GRAPHQL_URL || ''),
    // Additional security options
    connectionParams: async () => ({
      authorization: await getAuthToken(),
    }),
  })
);
```

**Impact**:
- **CWE-319**: Cleartext Transmission of Sensitive Information
- **OWASP A02:2021**: Cryptographic Failures
- **PIPEDA Violation**: Personal data transmitted without encryption

**Environment Configuration**:
```bash
# Development
EXPO_PUBLIC_GRAPHQL_URL=http://localhost:8001/graphql

# Production
EXPO_PUBLIC_GRAPHQL_URL=https://api.nestsync.ca/graphql
```

### 3. SQL Injection Prevention (CRITICAL)

**Location**: `NestSync-backend/app/config/database.py:120, 132`

**Current Vulnerability**:
```python
# INSECURE - String formatting in SQL
cursor.execute(f"SET timezone = '{settings.timezone}'")
```

**Security Fix**:
```python
# SECURE - Parameterized query
cursor.execute("SET timezone = %s", (settings.timezone,))
```

**Additional Safeguards**:
```python
# Add input validation
ALLOWED_TIMEZONES = [
    'America/Toronto',
    'America/Vancouver',
    'America/Edmonton',
    'America/Halifax',
    'America/St_Johns',
]

def set_timezone(cursor, timezone: str):
    """Safely set database timezone with validation."""
    if timezone not in ALLOWED_TIMEZONES:
        raise ValueError(f"Invalid timezone: {timezone}")
    cursor.execute("SET timezone = %s", (timezone,))
```

**Impact**:
- **CWE-89**: SQL Injection
- **OWASP A03:2021**: Injection
- **Risk**: Database compromise if config becomes user-controlled

### 4. Structured Logging Implementation (HIGH PRIORITY)

**Purpose**: Fix log injection vulnerabilities across 17 instances

**Affected Files**:
- `app/graphql/context.py` (3 instances)
- `app/middleware/security.py` (5 instances)
- `app/api/stripe_endpoints.py` (2 instances)
- `app/api/stripe_webhooks.py` (1 instance)
- `lib/storage/EmergencyStorageService.ts` (3 instances)
- `lib/graphql/client.ts` (1 instance)

**Current Vulnerability**:
```python
# INSECURE - Log injection possible
logger.info(f"Context created for request: {request.method} {request.url.path}")
logger.error(f"Request failed: {log_data}")
logger.info(f"PIPEDA Audit: {audit_info}")
```

**Security Fix**:
```python
# SECURE - Structured logging
logger.info(
    "Context created for request",
    extra={
        "method": request.method,
        "path": request.url.path,
        "request_id": request_id
    }
)

logger.error(
    "Request failed",
    extra={"log_data": sanitize_log_data(log_data)}
)

logger.info(
    "PIPEDA Audit",
    extra={
        "event_type": audit_info.get("event_type"),
        "user_id": audit_info.get("user_id"),
        "timestamp": audit_info.get("timestamp")
    }
)
```

**Log Sanitization Utility**:
```python
# app/utils/logging.py
import re
from typing import Any, Dict

def sanitize_log_data(data: Any) -> Any:
    """Remove newlines and control characters from log data."""
    if isinstance(data, str):
        # Remove newlines, carriage returns, and ANSI escape sequences
        return re.sub(r'[\n\r\x1b\x00-\x1f\x7f-\x9f]', '', data)
    elif isinstance(data, dict):
        return {k: sanitize_log_data(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [sanitize_log_data(item) for item in data]
    return data
```

**Frontend Logging Fix**:
```typescript
// SECURE - Separate arguments
console.warn('Failed to get string for key:', key, error);
console.error('Network error during token refresh, attempt:', retryCount + 1, error.message || error);
```

**Impact**:
- **CWE-117**: Improper Output Neutralization for Logs
- **OWASP A09:2021**: Security Logging and Monitoring Failures
- **PIPEDA Concern**: Audit trail manipulation possible

### 5. Password Reset Completion Component

**Location**: `NestSync-frontend/app/(auth)/reset-password.tsx`

**Purpose**: Complete the password reset flow initiated by `forgot-password.tsx`

**Interface**:
```typescript
// URL Parameters
interface ResetPasswordParams {
  token: string;  // JWT token from email link
  email?: string; // Optional email for display
}

// Component Props
interface ResetPasswordScreenProps {
  navigation: NavigationProp;
  route: RouteProp<{ params: ResetPasswordParams }>;
}

// Form State
interface ResetPasswordForm {
  password: string;
  confirmPassword: string;
}

// API Integration
interface ResetPasswordMutation {
  resetPassword(token: string, newPassword: string): Promise<{
    success: boolean;
    error?: string;
  }>;
}
```

**Design Decisions**:
- Use existing `NestSyncInput` component for consistency
- Leverage Supabase Auth's `updateUser` method with token validation
- Provide clear error messages for expired/invalid tokens
- Auto-redirect to login on success with success message
- Match design system from `forgot-password.tsx`

### 2. JSX Structure Validator

**Purpose**: Identify and fix components where text nodes are direct children of View components

**Approach**:
- Use ESLint rule `react-native/no-raw-text` to detect violations
- Create automated fix script to wrap text in `<Text>` components
- Add pre-commit hook to prevent future violations

**Common Patterns to Fix**:
```typescript
// ❌ WRONG
<View>
  Some text here
</View>

// ✅ CORRECT
<View>
  <Text>Some text here</Text>
</View>

// ❌ WRONG
<View>
  {someVariable}
</View>

// ✅ CORRECT
<View>
  <Text>{someVariable}</Text>
</View>
```

### 3. Test Environment Pre-flight Validator

**Location**: `scripts/test-preflight-check.sh`

**Purpose**: Validate environment readiness before running automated tests

**Checks**:
1. Backend service health (port 8001)
2. Frontend service availability (port 8082)
3. Database connectivity
4. Supabase Auth configuration
5. Test user credentials exist
6. Required environment variables set

**Interface**:
```bash
#!/bin/bash
# Exit codes:
# 0 = All checks passed
# 1 = Backend not ready
# 2 = Frontend not ready
# 3 = Database not accessible
# 4 = Auth not configured
# 5 = Test data missing

check_backend_health() {
  # Verify backend responds to /health endpoint
  # Check for "healthy" status
  # Validate Supabase connection
}

check_frontend_ready() {
  # Verify frontend serves content
  # Check for React app initialization
}

check_test_data() {
  # Verify test user exists
  # Check test child profiles
  # Validate test inventory data
}

wait_for_services() {
  # Retry logic with timeout
  # Progressive backoff
}
```

### 4. React Native Web Deprecation Migration

**Purpose**: Update deprecated API usage to current standards

**Migration Map**:

| Deprecated API | Current API | Component Impact |
|---------------|-------------|------------------|
| `textShadow*` props | `textShadow` string | Text components with shadows |
| `shadow*` props | `boxShadow` string | View components with shadows |
| `TouchableWithoutFeedback` | `Pressable` | Interactive components |
| `style.tintColor` | `props.tintColor` | Image components |
| `props.pointerEvents` | `style.pointerEvents` | Event handling |

**Implementation Strategy**:
1. Create codemod script to automate simple replacements
2. Manually review complex cases (e.g., shadow calculations)
3. Test each component after migration
4. Update component documentation

### 5. Stripe Development Configuration

**Purpose**: Properly configure Stripe for local development

**Configuration**:
```typescript
// lib/stripe/config.ts
export const stripeConfig = {
  publishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  merchantIdentifier: 'merchant.ca.nestsync',
  urlScheme: 'nestsync',
  setUrlSchemeOnAndroid: true,
  
  // Development-specific settings
  ...(process.env.NODE_ENV === 'development' && {
    // Suppress non-critical warnings in dev
    suppressWarnings: true,
    // Use test mode
    testMode: true,
  }),
};
```

**Backend Configuration**:
```python
# app/config/stripe.py
import stripe
from app.config.settings import settings

stripe.api_key = settings.STRIPE_SECRET_KEY

# Set API version
stripe.api_version = "2023-10-16"

# Development mode configuration
if settings.ENVIRONMENT == "development":
    # Use test mode keys
    stripe.api_key = settings.STRIPE_TEST_SECRET_KEY
    
    # Enable request logging
    stripe.log = "debug"
```

## Data Models

### Password Reset Token Validation

```typescript
interface PasswordResetToken {
  token: string;
  email: string;
  expiresAt: Date;
  used: boolean;
}

interface TokenValidationResult {
  valid: boolean;
  expired: boolean;
  email?: string;
  error?: string;
}
```

### Test Environment Status

```typescript
interface EnvironmentHealth {
  backend: {
    status: 'healthy' | 'degraded' | 'down';
    url: string;
    responseTime: number;
    checks: {
      database: boolean;
      redis: boolean;
      supabase: boolean;
    };
  };
  frontend: {
    status: 'ready' | 'loading' | 'error';
    url: string;
  };
  testData: {
    usersCreated: boolean;
    childrenCreated: boolean;
    inventorySeeded: boolean;
  };
}
```

## Error Handling

### Password Reset Errors

```typescript
enum ResetPasswordError {
  TOKEN_EXPIRED = 'reset_token_expired',
  TOKEN_INVALID = 'reset_token_invalid',
  TOKEN_USED = 'reset_token_already_used',
  PASSWORD_WEAK = 'password_does_not_meet_requirements',
  NETWORK_ERROR = 'network_error',
  UNKNOWN_ERROR = 'unknown_error',
}

const errorMessages: Record<ResetPasswordError, string> = {
  [ResetPasswordError.TOKEN_EXPIRED]: 
    'This password reset link has expired. Please request a new one.',
  [ResetPasswordError.TOKEN_INVALID]: 
    'This password reset link is invalid. Please request a new one.',
  [ResetPasswordError.TOKEN_USED]: 
    'This password reset link has already been used. Please request a new one.',
  [ResetPasswordError.PASSWORD_WEAK]: 
    'Password must be at least 8 characters with uppercase, lowercase, and numbers.',
  [ResetPasswordError.NETWORK_ERROR]: 
    'Unable to connect to the server. Please check your internet connection.',
  [ResetPasswordError.UNKNOWN_ERROR]: 
    'An unexpected error occurred. Please try again.',
};
```

### Test Environment Errors

```typescript
enum TestEnvironmentError {
  BACKEND_NOT_READY = 'backend_not_ready',
  FRONTEND_NOT_READY = 'frontend_not_ready',
  DATABASE_UNREACHABLE = 'database_unreachable',
  AUTH_NOT_CONFIGURED = 'auth_not_configured',
  TEST_DATA_MISSING = 'test_data_missing',
}

interface TestEnvironmentErrorReport {
  error: TestEnvironmentError;
  message: string;
  remediation: string;
  checksPassed: string[];
  checksFailed: string[];
}
```

## Testing Strategy

### Unit Tests

**Password Reset Component**:
- Token parsing from URL
- Form validation
- Password strength validation
- Error message display
- Success state handling

**JSX Structure Validator**:
- Detection of text nodes in View components
- Automated fix generation
- Verification of fixes

### Integration Tests

**Password Reset Flow**:
1. User requests password reset
2. Email sent with token
3. User clicks link
4. Reset page loads with token
5. User enters new password
6. Password updated in Supabase
7. User redirected to login
8. User logs in with new password

**Test Environment Validation**:
1. Pre-flight check runs
2. All services verified healthy
3. Test data confirmed present
4. Tests execute successfully
5. Results accurately reflect code quality

### E2E Tests

**Complete Password Reset Journey**:
```typescript
test('User can reset forgotten password', async ({ page }) => {
  // 1. Navigate to login
  await page.goto('/login');
  
  // 2. Click "Forgot Password"
  await page.click('text=Forgot Password?');
  
  // 3. Enter email
  await page.fill('input[type="email"]', 'test@example.com');
  await page.click('button:has-text("Send Reset Link")');
  
  // 4. Verify email sent message
  await expect(page.locator('text=Check your email')).toBeVisible();
  
  // 5. Get reset token from test email service
  const resetToken = await getTestEmailToken('test@example.com');
  
  // 6. Navigate to reset page with token
  await page.goto(`/reset-password?token=${resetToken}`);
  
  // 7. Enter new password
  await page.fill('input[placeholder="New Password"]', 'NewPassword123');
  await page.fill('input[placeholder="Confirm Password"]', 'NewPassword123');
  await page.click('button:has-text("Reset Password")');
  
  // 8. Verify redirect to login with success message
  await expect(page).toHaveURL('/login');
  await expect(page.locator('text=Password reset successful')).toBeVisible();
  
  // 9. Login with new password
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'NewPassword123');
  await page.click('button:has-text("Sign In")');
  
  // 10. Verify successful login
  await expect(page).toHaveURL('/dashboard');
});
```

### Test Environment Validation Tests

```bash
# Test the pre-flight check itself
test_preflight_check() {
  # Start services
  docker-compose up -d
  
  # Run pre-flight check
  ./scripts/test-preflight-check.sh
  
  # Verify exit code 0
  assert_equals $? 0
  
  # Stop backend
  docker-compose stop backend
  
  # Run pre-flight check again
  ./scripts/test-preflight-check.sh
  
  # Verify exit code 1 (backend not ready)
  assert_equals $? 1
}
```

## Implementation Phases

### Phase 1: Critical Security Fixes (Priority: P0 - 24 Hours)
**BLOCKER FOR PRODUCTION**

1. **JWT Verification Fix**
   - Enable signature verification in `supabase.py:361`
   - Add proper error handling for expired/invalid tokens
   - Test authentication flow end-to-end
   - Verify token forgery is prevented

2. **Secure WebSocket Connection**
   - Update `client.ts:54` to use `wss://` in production
   - Add environment-aware WebSocket URL generation
   - Test WebSocket encryption with network sniffer
   - Update environment configuration documentation

3. **SQL Injection Prevention**
   - Convert timezone setting to parameterized query
   - Add timezone validation whitelist
   - Audit codebase for similar f-string SQL patterns
   - Add linting rule to prevent future SQL string formatting

**Deliverables**:
- All 3 critical vulnerabilities fixed
- Security tests passing
- Code review completed
- Documentation updated

### Phase 2: High Priority Security & Features (Priority: P1 - Week 1)

1. **Structured Logging Implementation**
   - Create log sanitization utility
   - Update all 17 log injection instances
   - Implement structured logging in security middleware
   - Fix PIPEDA audit trail logging

2. **Password Reset Completion Route**
   - Implement `reset-password.tsx`
   - Add token validation
   - Test complete password reset flow
   - Update authentication documentation

3. **JSX Structure Fixes**
   - Audit components for text-in-View violations
   - Create automated fix script
   - Add ESLint rule to prevent future violations
   - Test all fixed components

**Deliverables**:
- Log injection vulnerabilities resolved
- Password reset flow complete
- No JSX structure warnings
- PIPEDA compliance maintained

### Phase 3: Code Quality & Test Infrastructure (Priority: P2 - Week 2)

1. **React Native Web Deprecation Migration**
   - Create codemod script for automated replacements
   - Migrate shadow props to current API
   - Replace TouchableWithoutFeedback with Pressable
   - Update component documentation

2. **Test Environment Pre-flight Check**
   - Create pre-flight validation script
   - Add service health checks
   - Implement test data verification
   - Document test environment setup

3. **Stripe Development Configuration**
   - Configure Stripe test mode
   - Add development-specific settings
   - Document webhook setup
   - Test payment flow in development

**Deliverables**:
- No deprecation warnings
- Test environment reliable
- Stripe working in development
- Updated developer documentation

### Phase 4: Security Hardening & Validation (Priority: P2 - Week 3)

1. **Security Testing Suite**
   - Add JWT forgery tests
   - Test WebSocket encryption
   - Validate SQL injection prevention
   - Test log injection attempts

2. **CI/CD Security Integration**
   - Add Semgrep to CI/CD pipeline
   - Configure security linting (bandit, eslint-plugin-security)
   - Add pre-commit security hooks
   - Set up automated security scanning

3. **Comprehensive Testing**
   - Re-run TestSprite test suite
   - Verify 95%+ pass rate with proper environment
   - Run security penetration tests
   - Create production readiness checklist

**Deliverables**:
- Security test suite passing
- CI/CD security checks active
- TestSprite tests passing
- Production deployment approved

## Security Considerations

### Password Reset Security

1. **Token Expiration**: Reset tokens expire after 1 hour
2. **Single Use**: Tokens can only be used once
3. **Rate Limiting**: Limit reset requests to 3 per hour per email
4. **Token Entropy**: Use cryptographically secure random tokens
5. **HTTPS Only**: Reset links only work over HTTPS in production

### Test Environment Security

1. **Isolated Test Data**: Test users separate from production
2. **Test Credentials**: Never use production credentials in tests
3. **Environment Separation**: Clear distinction between test and production
4. **Secrets Management**: Test secrets stored securely, not in code

## Performance Considerations

### Password Reset Flow

- Token validation: < 100ms
- Password update: < 200ms
- Total flow: < 500ms end-to-end

### Test Environment Startup

- Pre-flight check: < 10 seconds
- Service health verification: < 5 seconds
- Test data seeding: < 30 seconds
- Total environment ready: < 45 seconds

## Monitoring and Observability

### Password Reset Metrics

```typescript
// Track password reset funnel
metrics.track('password_reset_requested', { email });
metrics.track('password_reset_link_clicked', { email, token });
metrics.track('password_reset_completed', { email });
metrics.track('password_reset_failed', { email, error });

// Alert on high failure rates
if (failureRate > 0.1) {
  alert('High password reset failure rate');
}
```

### Test Environment Health

```typescript
// Log environment checks
logger.info('Pre-flight check started');
logger.info('Backend health', { status, responseTime });
logger.info('Frontend ready', { status });
logger.info('Test data verified', { users, children, inventory });

// Alert on environment issues
if (!allChecksPass) {
  alert('Test environment not ready', { failedChecks });
}
```

## Documentation Requirements

### Developer Documentation

1. **Password Reset Implementation Guide**
   - How the flow works
   - Token generation and validation
   - Error handling
   - Testing the flow

2. **Test Environment Setup Guide**
   - Prerequisites
   - Service startup
   - Test data seeding
   - Running pre-flight checks
   - Troubleshooting common issues

3. **React Native Web Migration Guide**
   - Deprecated API reference
   - Migration examples
   - Testing migrated components

### User Documentation

1. **Password Reset Help Article**
   - How to request a reset
   - What to expect in the email
   - Troubleshooting (expired links, etc.)
   - Security information

## Success Criteria

### Security (MUST PASS for Production)
1. ✅ JWT signature verification enabled and tested
2. ✅ WebSocket connections use wss:// in production
3. ✅ No SQL injection vulnerabilities (Semgrep clean)
4. ✅ All log injection instances fixed with structured logging
5. ✅ Security test suite passing (JWT forgery, SQL injection, log injection)
6. ✅ Semgrep scan shows 0 ERROR severity findings
7. ✅ PIPEDA audit trail cannot be manipulated

### Functionality
8. ✅ Password reset flow works end-to-end
9. ✅ No JSX structure console warnings
10. ✅ Test suite achieves 95%+ pass rate with proper environment
11. ✅ No React Native Web deprecation warnings
12. ✅ Pre-flight check catches environment issues before tests run
13. ✅ Stripe works in development without console errors

### Documentation & Process
14. ✅ Security fixes documented in CLAUDE.md
15. ✅ Test environment setup guide complete
16. ✅ CI/CD security checks active
17. ✅ Production deployment checklist updated

## Future Enhancements

1. **Enhanced Test Reporting**: Automatic categorization of failures
2. **Test Data Management**: UI for managing test data
3. **Environment Snapshots**: Save/restore test environment states
4. **Performance Testing**: Add load testing to test suite
5. **Visual Regression**: Screenshot comparison for UI changes
