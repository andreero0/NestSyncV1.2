# Suppression Audit Log

## Purpose

This document maintains a comprehensive audit trail of all Semgrep suppression decisions made in the NestSync codebase. Each entry documents the security analysis performed, the justification for suppression, and references to validation tests that prove the security controls are effective.

## Structure

Each audit entry includes:
- **Date**: When the suppression decision was made
- **Finding ID**: Unique identifier (e.g., FP-001)
- **File**: Path to the file containing the suppression
- **Rule**: Semgrep rule ID that was suppressed
- **Reviewer**: Person or team who reviewed and approved the suppression
- **Decision**: Classification (False Positive, Real Issue, Needs Investigation)
- **Justification**: Detailed explanation of why the finding was suppressed
- **Tests**: References to automated tests that validate the security control
- **Commit**: Git commit hash where the suppression was added

## Audit Entries

---

### 2025-11-10: SQL Injection False Positive in Database Configuration

**Finding ID**: FP-001  
**File**: `NestSync-backend/app/config/database.py` (lines 63, 169, 189)  
**Rule**: `python.lang.security.audit.formatted-sql-query`  
**Severity**: ERROR  
**Reviewer**: Security Team  
**Decision**: False Positive

#### Security Analysis

Semgrep flagged three instances of timezone setting operations as potential SQL injection vulnerabilities due to string formatting in SQL queries. Upon detailed analysis, all three instances were determined to be false positives with robust security controls in place.

**Flagged Code Locations**:
1. Line 63: `set_timezone()` function - Direct timezone setting with f-string
2. Line 169: Async engine connection event - Calls `set_timezone()` with validated input
3. Line 189: Sync engine connection event - Calls `set_timezone()` with validated input

#### Why This is a False Positive

The timezone value is validated against a hardcoded `ALLOWED_TIMEZONES` allowlist (lines 27-40) before any SQL execution occurs. The allowlist contains only predefined Canadian timezone identifiers that cannot be manipulated for SQL injection:

```python
ALLOWED_TIMEZONES = [
    'America/Toronto', 'America/Vancouver', 'America/Edmonton',
    'America/Winnipeg', 'America/Halifax', 'America/St_Johns',
    'America/Regina', 'America/Yellowknife', 'America/Whitehorse',
    'America/Iqaluit', 'America/Rankin_Inlet', 'UTC'
]
```

The `set_timezone()` function (lines 43-63) enforces this validation:
- Raises `ValueError` if timezone is not in the allowlist
- Only executes SQL after successful validation
- Uses raw DBAPI cursor (required for connection-level settings)

#### Security Controls

1. **Allowlist Validation**: All timezone values must be in `ALLOWED_TIMEZONES`
2. **Input Validation Function**: `set_timezone()` validates before execution
3. **Exception Handling**: Invalid timezones raise `ValueError` and prevent SQL execution
4. **Parameterized Alternative**: Where possible, parameterized queries are used (line 28 shows example)

#### Validation Tests

The following automated tests validate the security controls:

- `tests/security/test_sql_injection.py::test_timezone_validation_rejects_invalid`
  - Verifies that invalid timezone values are rejected
  - Tests SQL injection attempts are blocked
  
- `tests/security/test_sql_injection.py::test_settings_timezone_in_allowlist`
  - Ensures application timezone configuration is in the allowlist
  - Validates production configuration safety

#### Justification for Suppression

1. **No Attack Vector**: Timezone value comes from application configuration, not user input
2. **Validated Input**: All values validated against hardcoded allowlist
3. **Tested Control**: Automated tests verify the validation works
4. **Required Pattern**: Raw SQL needed for connection-level timezone setting (PostgreSQL requirement)

#### Suppression Comments Added

```python
# nosemgrep: python.lang.security.audit.formatted-sql-query
# Security Control: timezone validated against ALLOWED_TIMEZONES allowlist (lines 27-40)
# Validated By: tests/security/test_sql_injection.py::test_timezone_validation_rejects_invalid
```

**Commit**: e86cead (2025-11-10)  
**Next Review Date**: 2026-02-10 (Quarterly)

---

### 2025-11-10: WebSocket Security False Positives in GraphQL Client

**Finding IDs**: FP-002 through FP-008  
**File**: `NestSync-frontend/lib/graphql/client.ts`  
**Rule**: `javascript.lang.security.audit.insecure-websocket`  
**Severity**: WARNING  
**Reviewer**: Security Team  
**Decision**: False Positive (7 instances)

#### Security Analysis

Semgrep flagged 7 instances of WebSocket-related code as potential security vulnerabilities due to references to `ws://` (unencrypted WebSocket protocol). Upon detailed analysis, all instances were determined to be false positives occurring in non-executable code (comments, error messages, and logging statements) or security validation code.

**Flagged Code Locations**:

1. **Line 56-57**: Comment block explaining security pattern
   - Location: JSDoc comment describing WebSocket security rules
   - Context: Documentation explaining that production uses `wss://`
   - Not executable code

2. **Line 60-61**: Comment block explaining development behavior
   - Location: JSDoc comment describing development WebSocket usage
   - Context: Documentation explaining localhost development pattern
   - Not executable code

3. **Line 83-87**: Error message preventing insecure WebSocket
   - Location: Inside production environment check
   - Context: Error thrown to PREVENT `ws://` usage in production
   - This is a security control, not a vulnerability

4. **Line 97-101**: Development logging statement
   - Location: Inside `getWebSocketUrl()` function
   - Context: Logging the result of secure URL generation
   - URL already validated by function logic above

5. **Line 178-182**: WebSocket connection parameter logging
   - Location: Inside `connectionParams` async function
   - Context: Development-only logging of connection protocol type
   - Protocol selection handled securely by `getWebSocketUrl()`

6. **Line 231-235**: WebSocket connection success logging
   - Location: Inside `on.connected` event handler
   - Context: Development-only logging confirming secure connection
   - Connection already established securely

7. **Line 257-261**: Security error detection and warning
   - Location: Inside `on.error` event handler
   - Context: Error message that DETECTS insecure WebSocket configuration
   - This is a security control that alerts developers

#### Why These are False Positives

All 7 instances fall into three categories:

**Category 1: Documentation Comments (FP-002, FP-003)**
- Lines 56-57 and 60-61 are JSDoc comments explaining the security pattern
- These comments describe what the code does, they are not executable
- The actual implementation enforces `wss://` in production

**Category 2: Security Controls (FP-004, FP-007)**
- Line 83-87: Throws error to PREVENT `ws://` in production
- Line 257-261: Detects and warns about insecure configuration
- These are protective measures, not vulnerabilities

**Category 3: Development Logging (FP-005, FP-006, FP-008)**
- Lines 97-101, 178-182, 231-235: Development-only logging
- These log statements report the protocol type after secure URL generation
- The URL has already been validated by `getWebSocketUrl()` function
- Logging is wrapped in `__DEV__` checks (production-safe)

#### Security Controls

The actual WebSocket security is enforced by the `getWebSocketUrl()` function (lines 67-103):

1. **Production Enforcement**: Converts `https://` to `wss://` (encrypted)
2. **Development Safety**: Only allows `ws://` for localhost in development
3. **Production Guard**: Throws error if `ws://` attempted in production
4. **Environment Check**: Uses `process.env.NODE_ENV` to determine environment

```typescript
const getWebSocketUrl = (httpUrl: string): string => {
  // Convert HTTPS to WSS (encrypted WebSocket for production)
  if (httpUrl.startsWith('https://')) {
    wsUrl = httpUrl.replace('https://', 'wss://');
  }
  // Convert HTTP to WS (unencrypted WebSocket for development only)
  else if (httpUrl.startsWith('http://')) {
    // In production, never use unencrypted WebSocket
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot use unencrypted WebSocket (ws://) in production environment');
    }
    wsUrl = httpUrl.replace('http://', 'ws://');
  }
  // ...
};
```

#### Validation Tests

The following automated tests validate the WebSocket security controls:

- `tests/security/test_websocket_encryption.spec.ts::test_production_uses_wss`
  - Verifies production environment uses `wss://` protocol
  - Tests that `getWebSocketUrl()` converts `https://` to `wss://`

- `tests/security/test_websocket_encryption.spec.ts::test_development_uses_ws`
  - Verifies development environment allows `ws://` for localhost
  - Tests that production guard prevents `ws://` in production

- `tests/security/test_websocket_encryption.spec.ts::test_production_guard`
  - Verifies error is thrown when attempting `ws://` in production
  - Tests the security control that prevents insecure connections

#### Justification for Suppression

1. **No Executable Vulnerability**: Findings in comments and logging, not actual WebSocket connections
2. **Security Controls Present**: `getWebSocketUrl()` enforces `wss://` in production
3. **Environment-Aware**: Production guard prevents insecure connections
4. **Tested Controls**: Automated tests verify the security pattern works
5. **Development Safety**: `__DEV__` checks ensure logging only in development

#### Suppression Comments Added

**For Documentation Comments**:
```typescript
// nosemgrep: javascript.lang.security.audit.insecure-websocket
// This is a comment explaining security pattern, not actual code
// The actual implementation uses wss:// in production (see getWebSocketUrl function)
```

**For Security Controls**:
```typescript
// nosemgrep: javascript.lang.security.audit.insecure-websocket
// This is an error message that PREVENTS insecure WebSocket usage in production
// The error is thrown to enforce security, not create a vulnerability
```

**For Development Logging**:
```typescript
// nosemgrep: javascript.lang.security.audit.insecure-websocket
// Development-only logging that reports the result of secure URL generation
// The URL has already been validated by getWebSocketUrl() function above
```

**Commit**: e86cead (2025-11-10)  
**Next Review Date**: 2026-02-10 (Quarterly)

---

