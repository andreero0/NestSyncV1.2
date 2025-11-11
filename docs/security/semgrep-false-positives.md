# Semgrep False Positive Registry

## Overview

This document tracks all Semgrep findings that have been evaluated and determined to be false positives. Each entry includes detailed justification, security controls, validation tests, and review schedules to ensure ongoing security compliance.

**Purpose**: Maintain transparency and accountability for suppressed security findings while ensuring proper security controls remain in place.

**Last Updated**: 2025-11-10  
**Next Quarterly Review**: 2026-02-10

## Registry Statistics

- **Total False Positive Findings**: 9 unique findings
- **Total Suppressions in Code**: 10 (FP-009 covers 2 instances)
- **By Category**:
  - SQL Injection (False Positive): 3 suppressions
    - FP-001: 1 suppression (set_timezone function)
    - FP-009: 2 suppressions (async and sync event listeners)
  - WebSocket Security (False Positive): 7 suppressions
    - FP-002: 1 suppression (JSDoc comment line 56)
    - FP-003: 1 suppression (JSDoc comment line 60)
    - FP-004: 1 suppression (error message line 83)
    - FP-005: 1 suppression (dev log line 97)
    - FP-006: 1 suppression (connection params log line 178)
    - FP-007: 1 suppression (connected event log line 231)
    - FP-008: 1 suppression (error handler log line 257)
- **All Validated**: ✅ Yes
- **All Tested**: ✅ Yes

**Note**: The validation script counts 10 suppressions because FP-009 represents a single finding pattern that appears in two locations (async and sync database event listeners).

## False Positive Findings

---

### FP-001: SQL Injection in Timezone Setting (set_timezone function)

**File**: `NestSync-backend/app/config/database.py:63`  
**Rule**: `python.lang.security.audit.formatted-sql-query`  
**Severity**: ERROR  
**Date Identified**: 2025-11-10  
**Reviewed By**: Security Team  
**Status**: Suppressed

#### Finding Description

Semgrep flagged the timezone setting SQL query as a potential SQL injection vulnerability due to string formatting in the SQL statement:

```python
cursor.execute(f"SET timezone = '{timezone}'")
```

#### Why This is a False Positive

The timezone value is validated against a hardcoded `ALLOWED_TIMEZONES` allowlist before use. Only predefined Canadian timezone values are permitted. The validation function `set_timezone()` raises a `ValueError` if an invalid timezone is provided, preventing any SQL injection attempt.

**Key Security Controls**:
1. **Allowlist Validation**: Timezone must be in `ALLOWED_TIMEZONES` list (lines 27-40)
2. **Pre-execution Validation**: `set_timezone()` function validates before executing SQL (lines 43-63)
3. **Error Handling**: Invalid timezones raise `ValueError` with descriptive message
4. **No User Input**: Timezone is sourced from configuration, not user input

#### Security Controls

- **ALLOWED_TIMEZONES allowlist** (lines 27-40): Hardcoded list of 12 Canadian timezones plus UTC
- **set_timezone() validation function** (lines 43-63): Validates timezone against allowlist before SQL execution
- **ValueError exception**: Raised for any timezone not in allowlist
- **Configuration-only source**: Timezone comes from `settings.timezone`, not user input

#### Validation Tests

- `tests/security/test_sql_injection.py::test_valid_timezone_accepted` - Verifies valid timezones work
- `tests/security/test_sql_injection.py::test_invalid_timezone_rejected` - Verifies invalid timezones are rejected
- `tests/security/test_sql_injection.py::test_sql_injection_attempt_blocked` - Tests SQL injection patterns are blocked
- `tests/security/test_sql_injection.py::test_settings_timezone_in_allowlist` - Verifies configured timezone is safe

**Test Coverage**: 13 tests covering timezone validation, SQL injection prevention, and allowlist maintenance

#### Suppression Location

`NestSync-backend/app/config/database.py:62` (comment above line 63)

#### Next Review Date

**2026-02-10** (Quarterly review)

#### Related Documentation

- [SQL Injection Audit Report](./sql-injection-audit-2025-11-10.md)
- [Security Test Report](../NestSync-backend/docs/testing/security-test-report-2025-11-10.md)
- [TestSprite Issues Resolution Spec](../../.kiro/specs/testsprite-issues-resolution/)

---

### FP-002: WebSocket Security in Comment Block (Line 58)

**File**: `NestSync-frontend/lib/graphql/client.ts:58`  
**Rule**: `javascript.lang.security.audit.insecure-websocket`  
**Severity**: WARNING  
**Date Identified**: 2025-11-10  
**Reviewed By**: Security Team  
**Status**: Suppressed

#### Finding Description

Semgrep flagged a reference to `ws://` in a comment block that explains the WebSocket URL generation security pattern.

#### Why This is a False Positive

This is a comment explaining the security implementation, not actual code. The comment documents that:
- Production uses encrypted WebSocket (`wss://`)
- Development uses unencrypted WebSocket (`ws://`) for localhost only
- The actual implementation enforces these rules in the `getWebSocketUrl()` function

#### Security Controls

- **getWebSocketUrl() function** (lines 65-96): Enforces wss:// in production, ws:// only in development
- **Production environment check** (line 82): Throws error if attempting ws:// in production
- **Protocol validation**: Validates URL protocol before conversion
- **Environment-aware**: Uses `process.env.NODE_ENV` to determine protocol

#### Validation Tests

- `tests/security/test_websocket_encryption.spec.ts::test_uses_wss_in_production` - Verifies wss:// in production
- `tests/security/test_websocket_encryption.spec.ts::test_uses_ws_in_development` - Verifies ws:// only in dev
- `tests/security/test_websocket_encryption.spec.ts::test_rejects_ws_in_production` - Verifies production safety

#### Suppression Location

`NestSync-frontend/lib/graphql/client.ts:57` (comment above line 58)

#### Next Review Date

**2026-02-10** (Quarterly review)

---

### FP-003: WebSocket Security in Comment Block (Line 61)

**File**: `NestSync-frontend/lib/graphql/client.ts:61`  
**Rule**: `javascript.lang.security.audit.insecure-websocket`  
**Severity**: WARNING  
**Date Identified**: 2025-11-10  
**Reviewed By**: Security Team  
**Status**: Suppressed

#### Finding Description

Semgrep flagged a reference to `ws://` in a comment explaining the security rules for WebSocket connections.

#### Why This is a False Positive

This is documentation within a comment block explaining when `ws://` is permitted (development only). The actual code implementation enforces secure WebSocket connections in production.

#### Security Controls

Same as FP-002 - `getWebSocketUrl()` function enforces proper protocol selection based on environment.

#### Validation Tests

Same as FP-002 - WebSocket encryption tests validate production security.

#### Suppression Location

`NestSync-frontend/lib/graphql/client.ts:60` (comment above line 61)

#### Next Review Date

**2026-02-10** (Quarterly review)

---

### FP-004: WebSocket Security in Error Message (Line 82)

**File**: `NestSync-frontend/lib/graphql/client.ts:82`  
**Rule**: `javascript.lang.security.audit.insecure-websocket`  
**Severity**: WARNING  
**Date Identified**: 2025-11-10  
**Reviewed By**: Security Team  
**Status**: Suppressed

#### Finding Description

Semgrep flagged the error message string that mentions `ws://` when explaining why unencrypted WebSocket is not allowed in production.

#### Why This is a False Positive

This is an error message string, not executable code. The error is thrown specifically to PREVENT the use of unencrypted WebSocket in production. This is a security control, not a vulnerability.

**Error Message**:
```typescript
throw new Error('Cannot use unencrypted WebSocket (ws://) in production environment');
```

#### Security Controls

- **Production safety check** (lines 80-83): Explicitly prevents ws:// in production
- **Error throwing**: Fails fast if insecure configuration detected
- **Environment validation**: Checks `process.env.NODE_ENV === 'production'`

#### Validation Tests

- `tests/security/test_websocket_encryption.spec.ts::test_rejects_ws_in_production` - Verifies this error is thrown

#### Suppression Location

`NestSync-frontend/lib/graphql/client.ts:81` (comment above line 82)

#### Next Review Date

**2026-02-10** (Quarterly review)

---

### FP-005: WebSocket Security in Development Log (Line 91)

**File**: `NestSync-frontend/lib/graphql/client.ts:91`  
**Rule**: `javascript.lang.security.audit.insecure-websocket`  
**Severity**: WARNING  
**Date Identified**: 2025-11-10  
**Reviewed By**: Security Team  
**Status**: Suppressed

#### Finding Description

Semgrep flagged a console.log statement that outputs the generated WebSocket URL for debugging purposes in development mode.

#### Why This is a False Positive

This is a development-only logging statement (guarded by `if (__DEV__)`) that helps developers verify the correct WebSocket URL is being generated. The log statement itself doesn't create a security vulnerability - it's reporting the result of the secure URL generation logic.

#### Security Controls

- **Development-only logging**: Guarded by `__DEV__` constant (line 90)
- **Informational output**: Shows result of secure URL generation
- **getWebSocketUrl() enforcement**: URL has already been validated by this point

#### Validation Tests

Same as FP-002 - WebSocket encryption tests validate the URL generation logic.

#### Suppression Location

`NestSync-frontend/lib/graphql/client.ts:90` (comment above line 91)

#### Next Review Date

**2026-02-10** (Quarterly review)

---

### FP-006: WebSocket Security in Connection Params Log (Line 171)

**File**: `NestSync-frontend/lib/graphql/client.ts:171`  
**Rule**: `javascript.lang.security.audit.insecure-websocket`  
**Severity**: WARNING  
**Date Identified**: 2025-11-10  
**Reviewed By**: Security Team  
**Status**: Suppressed

#### Finding Description

Semgrep flagged a console.log statement that logs WebSocket connection parameters, including the protocol type (encrypted vs unencrypted).

#### Why This is a False Positive

This is a development-only logging statement that reports the protocol being used. The log shows whether the connection is encrypted (`wss://`) or unencrypted (`ws://`), which is useful for debugging. The actual protocol selection is handled securely by `getWebSocketUrl()`.

#### Security Controls

- **Development-only logging**: Guarded by `if (__DEV__)` (line 168)
- **Protocol reporting**: Shows result of secure URL generation
- **Informational only**: Doesn't affect actual WebSocket connection security

#### Validation Tests

Same as FP-002 - WebSocket encryption tests validate protocol selection.

#### Suppression Location

`NestSync-frontend/lib/graphql/client.ts:167` (comment above line 168)

#### Next Review Date

**2026-02-10** (Quarterly review)

---

### FP-007: WebSocket Security in Connected Event Log (Line 223)

**File**: `NestSync-frontend/lib/graphql/client.ts:223`  
**Rule**: `javascript.lang.security.audit.insecure-websocket`  
**Severity**: WARNING  
**Date Identified**: 2025-11-10  
**Reviewed By**: Security Team  
**Status**: Suppressed

#### Finding Description

Semgrep flagged a console.log statement in the WebSocket `connected` event handler that reports the protocol being used.

#### Why This is a False Positive

This is a development-only logging statement that confirms the WebSocket connection was established and reports whether it's using encrypted or unencrypted protocol. This is informational logging for debugging, not a security vulnerability.

#### Security Controls

- **Development-only logging**: Guarded by `if (__DEV__)` (line 222)
- **Connection confirmation**: Reports successful connection with protocol type
- **Post-connection logging**: Connection already established securely

#### Validation Tests

Same as FP-002 - WebSocket encryption tests validate connection security.

#### Suppression Location

`NestSync-frontend/lib/graphql/client.ts:221` (comment above line 222)

#### Next Review Date

**2026-02-10** (Quarterly review)

---

### FP-008: WebSocket Security in Error Handler Log (Line 243)

**File**: `NestSync-frontend/lib/graphql/client.ts:243`  
**Rule**: `javascript.lang.security.audit.insecure-websocket`  
**Severity**: WARNING  
**Date Identified**: 2025-11-10  
**Reviewed By**: Security Team  
**Status**: Suppressed

#### Finding Description

Semgrep flagged a console.error statement in the WebSocket error handler that includes a security warning about unencrypted WebSocket in production.

#### Why This is a False Positive

This is an error logging statement that DETECTS and WARNS about the security issue of using unencrypted WebSocket in production. This is a security control that alerts developers if the configuration is insecure. The error message itself is not a vulnerability.

**Error Message**:
```typescript
console.error('SECURITY ERROR: Unencrypted WebSocket (ws://) detected in production!');
```

#### Security Controls

- **Security error detection**: Checks if ws:// is being used in production (line 242)
- **Development-only logging**: Guarded by `if (__DEV__)` (line 238)
- **Alert mechanism**: Warns developers of insecure configuration

#### Validation Tests

Same as FP-002 - WebSocket encryption tests validate production security.

#### Suppression Location

`NestSync-frontend/lib/graphql/client.ts:237` (comment above line 238)

#### Next Review Date

**2026-02-10** (Quarterly review)

---

### FP-009: SQL Injection in Database Event Listeners (set_timezone calls)

**Files**: 
- `NestSync-backend/app/config/database.py:167` (async event listener)
- `NestSync-backend/app/config/database.py:185` (sync event listener)

**Rule**: `python.lang.security.audit.formatted-sql-query`  
**Severity**: ERROR  
**Date Identified**: 2025-11-10  
**Reviewed By**: Security Team  
**Status**: Suppressed (2 instances)

#### Finding Description

Semgrep flagged the calls to `set_timezone()` within both database connection event listeners (async and sync) as potential SQL injection vulnerabilities.

#### Why This is a False Positive

Both calls use the `set_timezone()` validation function (FP-001) which enforces allowlist validation. The timezone value comes from `settings.timezone`, which is:
1. Sourced from configuration, not user input
2. Validated against `ALLOWED_TIMEZONES` allowlist
3. Tested to ensure it's in the allowlist (test_settings_timezone_in_allowlist)

Both event listeners use identical security patterns:
- Async event listener (`receive_connect`): Sets timezone on async engine connections
- Sync event listener (`receive_sync_connect`): Sets timezone on sync engine connections

#### Security Controls

- **set_timezone() validation**: Uses the same allowlist-validated function as FP-001
- **Configuration source**: Timezone from `settings.timezone`, not user input
- **Allowlist enforcement**: ALLOWED_TIMEZONES validation prevents injection
- **Test coverage**: Verified by test_settings_timezone_in_allowlist
- **Identical implementation**: Both event listeners use the same secure pattern

#### Validation Tests

Same as FP-001 - All SQL injection prevention tests cover this usage.

#### Suppression Locations

- `NestSync-backend/app/config/database.py:166` (comment above line 167 - async listener)
- `NestSync-backend/app/config/database.py:184` (comment above line 185 - sync listener)

#### Next Review Date

**2026-02-10** (Quarterly review)

#### Related Documentation

Same as FP-001 - SQL Injection Audit Report and Security Test Report

---

## Review Process

### Quarterly Review Schedule

All suppressed findings are reviewed quarterly to ensure:
1. Security controls remain in place
2. Validation tests continue to pass
3. No new attack vectors have emerged
4. Documentation remains accurate

**Review Dates**:
- Q1 2026: February 10, 2026
- Q2 2026: May 10, 2026
- Q3 2026: August 10, 2026
- Q4 2026: November 10, 2026

### Review Checklist

For each false positive:
- [ ] Security control still exists in code
- [ ] Validation tests still pass
- [ ] No new user input vectors introduced
- [ ] Documentation is accurate
- [ ] Suppression comment is clear
- [ ] No similar issues in new code

### Escalation Criteria

Remove suppression and re-evaluate if:
- Security control is removed or modified
- Validation tests fail
- New user input vector is introduced
- Code refactoring changes the pattern
- Security researcher identifies actual vulnerability

## Related Documentation

- [False Positive Review Process](./false-positive-review-process.md)
- [Suppression Audit Log](./suppression-audit-log.md)
- [Semgrep Best Practices](./semgrep-best-practices.md)
- [Security Dashboard](./security-dashboard.md)
- [SQL Injection Audit](./sql-injection-audit-2025-11-10.md)
- [Security Test Report](../NestSync-backend/docs/testing/security-test-report-2025-11-10.md)

## Maintenance

This document is maintained as part of the security documentation and must be updated whenever:
- New false positives are identified
- Suppressions are added or removed
- Security controls are modified
- Quarterly reviews are completed
- Related code is refactored

**Document Owner**: Security Team  
**Last Review**: 2025-11-10  
**Next Review**: 2026-02-10
