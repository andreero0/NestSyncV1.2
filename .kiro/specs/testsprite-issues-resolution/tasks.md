# Implementation Plan

## Phase 1: Critical Security Fixes (P0 - BLOCKER)

- [x] 1. Fix JWT Signature Verification Vulnerability
  - Enable JWT signature verification in authentication flow
  - Add proper error handling for invalid and expired tokens
  - Test token forgery prevention
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 1.1 Update JWT decode in supabase.py
  - Modify `NestSync-backend/app/auth/supabase.py:361` to enable signature verification
  - Change `options={"verify_signature": False}` to `options={"verify_signature": True}`
  - Add `settings.SUPABASE_JWT_SECRET` as the verification key
  - Specify `algorithms=["HS256"]` for JWT decoding
  - _Requirements: 1.1, 1.4_

- [x] 1.2 Add JWT error handling
  - Wrap JWT decode in try-except block
  - Catch `jwt.ExpiredSignatureError` and raise `AuthenticationError("Token has expired")`
  - Catch `jwt.InvalidTokenError` and raise `AuthenticationError("Invalid token")`
  - Add security logging for failed authentication attempts
  - _Requirements: 1.2, 1.3, 1.5_

- [x] 1.3 Write JWT security tests
  - Create test that attempts to forge JWT with invalid signature
  - Create test that uses expired JWT token
  - Create test that tampers with JWT payload
  - Verify all malicious tokens are rejected
  - _Requirements: 11.1_

- [x] 2. Fix Insecure WebSocket Connection
  - Update WebSocket URL generation to use wss:// in production
  - Add environment-aware connection logic
  - Test WebSocket encryption
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 2.1 Create secure WebSocket URL generator
  - Add `getWebSocketUrl` function in `NestSync-frontend/lib/graphql/client.ts`
  - Convert `https://` to `wss://` for production
  - Convert `http://` to `ws://` only in development (NODE_ENV !== 'production')
  - Replace `/graphql` with `/subscriptions` in URL
  - _Requirements: 2.1, 2.2_

- [x] 2.2 Update GraphQL WebSocket link configuration
  - Replace direct URL replacement with `getWebSocketUrl()` function call
  - Add authentication token to WebSocket `connectionParams`
  - Add error handling for WebSocket connection failures
  - _Requirements: 2.3, 2.4_

- [x] 2.3 Update environment configuration documentation
  - Document `EXPO_PUBLIC_GRAPHQL_URL` for development (http://localhost:8001/graphql)
  - Document `EXPO_PUBLIC_GRAPHQL_URL` for production (https://api.nestsync.ca/graphql)
  - Add security note about WebSocket encryption in production
  - _Requirements: 2.1, 2.2_

- [x] 2.4 Test WebSocket encryption
  - Verify wss:// is used in production build
  - Verify ws:// is used in development
  - Test WebSocket connection with authentication
  - Use network sniffer to verify encryption in production mode
  - _Requirements: 11.2_

- [x] 3. Fix SQL Injection Vulnerability
  - Convert SQL string formatting to parameterized queries
  - Add input validation for database configuration
  - Audit codebase for similar patterns
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 3.1 Convert timezone setting to parameterized query
  - Update `NestSync-backend/app/config/database.py:120` to use parameterized query
  - Change `cursor.execute(f"SET timezone = '{settings.timezone}'")` to `cursor.execute("SET timezone = %s", (settings.timezone,))`
  - Update line 132 with same parameterized approach
  - _Requirements: 3.1, 3.2_

- [x] 3.2 Add timezone validation whitelist
  - Create `ALLOWED_TIMEZONES` list with Canadian timezones
  - Add validation function `set_timezone(cursor, timezone: str)`
  - Raise `ValueError` if timezone not in allowlist
  - Update all timezone setting calls to use validation function
  - _Requirements: 3.3, 3.4, 3.5_

- [x] 3.3 Audit codebase for SQL injection patterns
  - Search for f-string usage in SQL queries across backend
  - Search for string concatenation in SQL queries
  - Document any additional instances found
  - Create issues for any new findings
  - _Requirements: 3.1, 3.2_

- [x] 3.4 Add SQL injection prevention linting rule
  - Configure bandit to detect SQL string formatting
  - Add pre-commit hook for security checks
  - Document secure SQLAlchemy patterns in CLAUDE.md
  - _Requirements: 12.3_

- [x] 3.5 Write SQL injection prevention tests
  - Create test attempting SQL injection via timezone parameter
  - Verify parameterized queries prevent injection
  - Test timezone validation rejects invalid values
  - _Requirements: 11.3_

## Phase 2: High Priority Security & Features (P1)

- [x] 4. Implement Structured Logging
  - Create log sanitization utility
  - Update all log injection instances to use structured logging
  - Fix PIPEDA audit trail logging
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 4.1 Create log sanitization utility
  - Create `NestSync-backend/app/utils/logging.py`
  - Implement `sanitize_log_data(data: Any)` function
  - Remove newlines, carriage returns, ANSI escape sequences
  - Handle strings, dicts, and lists recursively
  - _Requirements: 4.2, 4.3_

- [x] 4.2 Update backend structured logging (context.py)
  - Fix 3 instances in `app/graphql/context.py:58, 64, 387`
  - Convert f-string logging to structured logging with `extra` parameter
  - Use `sanitize_log_data()` for user-provided data
  - _Requirements: 4.1, 4.4_

- [x] 4.3 Update backend structured logging (security.py)
  - Fix 5 instances in `app/middleware/security.py:229, 231, 233, 286, 299`
  - Convert PIPEDA audit logging to structured format
  - Ensure audit trail fields cannot be manipulated
  - _Requirements: 4.1, 4.4_

- [x] 4.4 Update backend structured logging (Stripe endpoints)
  - Fix 2 instances in `app/api/stripe_endpoints.py:216-217, 334-336`
  - Fix 1 instance in `app/api/stripe_webhooks.py:42`
  - Convert to structured logging with separate fields
  - _Requirements: 4.1, 4.4_

- [x] 4.5 Update frontend console logging
  - Fix 3 instances in `lib/storage/EmergencyStorageService.ts:109, 128, 147`
  - Fix 1 instance in `lib/graphql/client.ts:275`
  - Use separate console.log arguments instead of string interpolation
  - _Requirements: 4.5_

- [x] 4.6 Write log injection prevention tests
  - Create test attempting log injection with newline characters
  - Verify sanitization removes control characters
  - Test PIPEDA audit logs cannot be manipulated
  - _Requirements: 11.4_

- [x] 5. Implement Password Reset Completion Route
  - Create reset-password.tsx screen
  - Add token validation logic
  - Integrate with Supabase Auth
  - Test complete password reset flow
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 5.1 Create password reset screen component
  - Create `NestSync-frontend/app/(auth)/reset-password.tsx`
  - Add route parameters interface for token and email
  - Create form state for password and confirmPassword
  - Use existing `NestSyncInput` components for consistency
  - Match design system from `forgot-password.tsx`
  - _Requirements: 5.1, 5.2_

- [x] 5.2 Implement token validation and password update
  - Parse token from URL query parameters
  - Call Supabase Auth `updateUser` method with token
  - Validate password meets security requirements (8+ chars, uppercase, lowercase, numbers)
  - Handle token expired, invalid, and already used errors
  - _Requirements: 5.2, 5.3, 5.4_

- [x] 5.3 Add error handling and user feedback
  - Display clear error messages for expired/invalid tokens
  - Provide "Request new reset link" button on error
  - Show success message on password update
  - Auto-redirect to login screen on success
  - _Requirements: 5.4, 5.5_

- [x] 5.4 Write password reset E2E test
  - Test complete flow from forgot-password to reset-password
  - Verify token validation works correctly
  - Test password strength validation
  - Test login with new password after reset
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 6. Fix JSX Component Structure Violations
  - Audit components for text-in-View issues
  - Create automated fix script
  - Add ESLint rule to prevent future violations
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 6.1 Audit frontend components for JSX violations
  - Search for View components with direct text children
  - Search for View components with variable children (not wrapped in Text)
  - Document all instances found
  - Prioritize by component usage frequency
  - _Requirements: 6.1, 6.4_

- [x] 6.2 Create automated JSX fix script
  - Create script to detect text nodes in View components
  - Generate fixes that wrap text in `<Text>` components
  - Handle both string literals and variables
  - Test script on sample components
  - _Requirements: 6.2_

- [x] 6.3 Apply JSX structure fixes
  - Run automated fix script on all components
  - Manually review and fix complex cases
  - Test each fixed component for visual regressions
  - Verify no console warnings remain
  - _Requirements: 6.1, 6.2, 6.4_

- [x] 6.4 Add ESLint rule for JSX structure
  - Enable `react-native/no-raw-text` ESLint rule
  - Configure rule to error on violations
  - Add pre-commit hook to check JSX structure
  - Document JSX best practices in component guidelines
  - _Requirements: 6.3_

## Phase 3: Code Quality & Test Infrastructure (P2)

- [x] 7. Migrate React Native Web Deprecated APIs
  - Create codemod script for automated replacements
  - Migrate shadow props to current API
  - Replace TouchableWithoutFeedback with Pressable
  - Update component documentation
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [x] 7.1 Create deprecation migration codemod
  - Create script to find and replace deprecated API usage
  - Map `textShadow*` props to `textShadow` string
  - Map `shadow*` props to `boxShadow` string
  - Map `TouchableWithoutFeedback` to `Pressable`
  - Map `style.tintColor` to `props.tintColor`
  - Map `props.pointerEvents` to `style.pointerEvents`
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 7.2 Apply automated migrations
  - Run codemod on all frontend components
  - Review generated changes for correctness
  - Handle complex shadow calculations manually
  - Test components after migration
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 7.3 Update component documentation
  - Document current React Native Web API usage
  - Add migration guide for deprecated APIs
  - Update component examples with current APIs
  - Add deprecation warnings to CLAUDE.md
  - _Requirements: 8.6_

- [x] 7.4 Verify no deprecation warnings
  - Build application and check console
  - Run linter to catch remaining deprecations
  - Test all migrated components
  - Document any remaining warnings with justification
  - _Requirements: 8.6_

- [x] 8. Create Test Environment Pre-flight Check
  - Implement service health checks
  - Add test data verification
  - Create pre-flight validation script
  - Document test environment setup
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 8.1 Create pre-flight check script
  - Create `scripts/test-preflight-check.sh`
  - Define exit codes for different failure types
  - Implement retry logic with progressive backoff
  - Add timeout configuration
  - _Requirements: 7.3, 7.4_

- [x] 8.2 Implement backend health check
  - Check backend responds to `/health` endpoint
  - Verify "healthy" status in response
  - Validate Supabase connection status
  - Check database connectivity
  - _Requirements: 7.1_

- [x] 8.3 Implement frontend readiness check
  - Verify frontend serves content on port 8082
  - Check for React app initialization
  - Validate GraphQL client configuration
  - _Requirements: 7.2_

- [x] 8.4 Implement test data verification
  - Check test user exists in database
  - Verify test child profiles are present
  - Validate test inventory data is seeded
  - Check test family collaboration setup
  - _Requirements: 7.5_

- [x] 8.5 Create test environment documentation
  - Document prerequisites for running tests
  - Provide service startup instructions
  - Document test data seeding process
  - Add troubleshooting guide for common issues
  - _Requirements: 9.4_

- [x] 8.6 Write pre-flight check tests
  - Test pre-flight check with all services running
  - Test pre-flight check with backend down
  - Test pre-flight check with missing test data
  - Verify correct exit codes for each scenario
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 9. Configure Stripe for Development
  - Set up Stripe test mode configuration
  - Add development-specific settings
  - Document webhook setup for local development
  - Test payment flow in development
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [x] 9.1 Create Stripe configuration module
  - Create `NestSync-frontend/lib/stripe/config.ts`
  - Add publishableKey from environment variable
  - Configure merchant identifier and URL scheme
  - Add development-specific settings (suppressWarnings, testMode)
  - _Requirements: 10.1, 10.2_

- [x] 9.2 Update backend Stripe configuration
  - Create `NestSync-backend/app/config/stripe.py`
  - Set Stripe API key from settings
  - Configure API version
  - Add development mode configuration with test keys
  - Enable debug logging in development
  - _Requirements: 10.1, 10.2_

- [x] 9.3 Document Stripe webhook setup
  - Document ngrok or similar tunneling for webhooks
  - Provide Stripe CLI installation instructions
  - Document webhook endpoint configuration
  - Add troubleshooting for common webhook issues
  - _Requirements: 10.4_

- [x] 9.4 Test Stripe integration in development
  - Test payment method addition
  - Test subscription creation
  - Test webhook delivery
  - Verify no console errors in development
  - _Requirements: 10.1, 10.2, 10.3_

## Phase 4: Security Hardening & Validation (P2)

- [x] 10. Create Security Test Suite
  - Write JWT forgery tests
  - Write WebSocket encryption tests
  - Write SQL injection prevention tests
  - Write log injection prevention tests
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 10.1 Create security test directory structure
  - Create `NestSync-backend/tests/security/` directory
  - Create `test_jwt_security.py` for JWT tests
  - Create `test_sql_injection.py` for SQL tests
  - Create `test_log_injection.py` for log tests
  - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [x] 10.2 Write JWT security tests
  - Test JWT with invalid signature is rejected
  - Test expired JWT is rejected
  - Test tampered JWT payload is rejected
  - Test valid JWT is accepted
  - Verify proper error messages for each case
  - _Requirements: 11.1_

- [x] 10.3 Write SQL injection prevention tests
  - Test timezone setting with SQL injection attempt
  - Verify parameterized queries prevent injection
  - Test timezone validation rejects invalid values
  - Test valid timezones are accepted
  - _Requirements: 11.3_

- [x] 10.4 Write log injection prevention tests
  - Test logging with newline characters
  - Test logging with ANSI escape sequences
  - Verify sanitization removes control characters
  - Test PIPEDA audit logs maintain integrity
  - _Requirements: 11.4_

- [x] 10.5 Generate security test report
  - Run all security tests
  - Generate report showing vulnerabilities resolved
  - Document test coverage for each vulnerability
  - Add security test results to CI/CD
  - _Requirements: 11.5_

- [x] 11. Integrate Security Scanning into CI/CD
  - Add Semgrep to CI/CD pipeline
  - Configure security linting tools
  - Add pre-commit security hooks
  - Set up automated security scanning schedule
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 11.1 Add Semgrep to CI/CD pipeline
  - Create `.github/workflows/security-scan.yml`
  - Configure Semgrep to run on pull requests
  - Set up Semgrep to block merges on ERROR severity
  - Add Semgrep badge to README
  - _Requirements: 12.1, 12.2_

- [x] 11.2 Configure backend security linting
  - Add bandit to `requirements-dev.txt`
  - Create `.bandit` configuration file
  - Configure bandit to detect SQL injection, hardcoded secrets
  - Add bandit to CI/CD pipeline
  - _Requirements: 12.3_

- [x] 11.3 Configure frontend security linting
  - Add `eslint-plugin-security` to package.json
  - Configure ESLint to use security plugin
  - Add security rules to `.eslintrc.js`
  - Add ESLint security check to CI/CD
  - _Requirements: 12.3_

- [x] 11.4 Add pre-commit security hooks
  - Install pre-commit framework
  - Create `.pre-commit-config.yaml`
  - Add Semgrep, bandit, and ESLint security checks
  - Document pre-commit setup in developer guide
  - _Requirements: 12.3_

- [x] 11.5 Set up automated security scanning schedule
  - Configure weekly comprehensive Semgrep scans
  - Set up security scan result notifications
  - Create security dashboard for tracking findings
  - Document security scanning process
  - _Requirements: 12.4, 12.5_

- [x] 12. Run Comprehensive Testing and Validation
  - Re-run TestSprite test suite
  - Run security penetration tests
  - Verify all success criteria met
  - Create production readiness checklist
  - _Requirements: 9.1, 9.2, 9.3, 9.5_

- [x] 12.1 Re-run TestSprite test suite
  - Ensure test environment is properly configured
  - Run pre-flight check before tests
  - Execute all 24 TestSprite tests
  - Verify 95%+ pass rate
  - Document any remaining failures with root cause
  - _Requirements: 9.2, 9.3_

- [x] 12.2 Run security penetration tests
  - Attempt JWT token forgery
  - Test WebSocket encryption
  - Attempt SQL injection attacks
  - Attempt log injection attacks
  - Verify all attacks are prevented
  - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [x] 12.3 Verify all success criteria
  - Check JWT signature verification enabled
  - Check WebSocket uses wss:// in production
  - Run Semgrep and verify 0 ERROR findings
  - Check no JSX structure warnings
  - Check no React Native Web deprecation warnings
  - Verify test suite pass rate ≥ 95%
  - Check all documentation updated
  - _Requirements: All_

- [x] 12.4 Create production readiness checklist
  - Document all security fixes applied
  - List all tests passing
  - Verify PIPEDA compliance maintained
  - Check environment configuration for production
  - Document deployment prerequisites
  - Create rollback plan
  - _Requirements: 9.5_

- [x] 12.5 Generate final validation report
  - Summarize all issues identified
  - Document all fixes applied
  - Show before/after security scan results
  - Include test pass rate improvement
  - Provide production deployment recommendation
  - _Requirements: 9.1, 9.5_
