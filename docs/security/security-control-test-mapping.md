# Security Control to Test Mapping

## Overview

This document maps security controls referenced in Semgrep suppressions to their validation tests. This ensures that if a security control is removed or modified, the corresponding tests will fail, alerting developers to re-evaluate the suppression.

**Purpose**: Maintain the integrity of suppressed findings by ensuring security controls remain in place and tested.

**Last Updated**: 2025-11-10

## Mapping Table

| Finding ID | Security Control | Location | Validation Test | Test File |
|------------|------------------|----------|-----------------|-----------|
| FP-001 | ALLOWED_TIMEZONES allowlist | `database.py:27-40` | `test_valid_timezone_accepted` | `test_sql_injection.py` |
| FP-001 | ALLOWED_TIMEZONES allowlist | `database.py:27-40` | `test_invalid_timezone_rejected` | `test_sql_injection.py` |
| FP-001 | ALLOWED_TIMEZONES allowlist | `database.py:27-40` | `test_sql_injection_attempt_blocked` | `test_sql_injection.py` |
| FP-001 | set_timezone() validation | `database.py:43-63` | `test_parameterized_query_format` | `test_sql_injection.py` |
| FP-002 | getWebSocketUrl() function | `client.ts:65-96` | `test_uses_wss_in_production` | `websocket-security.test.ts` |
| FP-002 | Production environment check | `client.ts:82` | `test_rejects_ws_in_production` | `websocket-security.test.ts` |
| FP-003 | getWebSocketUrl() function | `client.ts:65-96` | `test_uses_wss_in_production` | `websocket-security.test.ts` |
| FP-003 | Production environment check | `client.ts:82` | `test_rejects_ws_in_production` | `websocket-security.test.ts` |
| FP-004 | Production safety check | `client.ts:80-83` | `test_rejects_ws_in_production` | `websocket-security.test.ts` |
| FP-004 | Error throwing | `client.ts:83` | `test_rejects_ws_in_production` | `websocket-security.test.ts` |
| FP-005 | getWebSocketUrl() validation | `client.ts:65-96` | `test_uses_wss_in_production` | `websocket-security.test.ts` |
| FP-005 | Development-only logging | `client.ts:90` | N/A (logging only) | N/A |
| FP-006 | getWebSocketUrl() validation | `client.ts:65-96` | `test_uses_wss_in_production` | `websocket-security.test.ts` |
| FP-006 | Protocol reporting | `client.ts:168-178` | N/A (logging only) | N/A |
| FP-007 | getWebSocketUrl() validation | `client.ts:65-96` | `test_uses_wss_in_production` | `websocket-security.test.ts` |
| FP-007 | Connection confirmation | `client.ts:222-231` | N/A (logging only) | N/A |
| FP-008 | Security error detection | `client.ts:242` | `test_rejects_ws_in_production` | `websocket-security.test.ts` |
| FP-008 | Alert mechanism | `client.ts:243` | N/A (logging only) | N/A |
| FP-009 | set_timezone() validation | `database.py:43-63` | `test_settings_timezone_in_allowlist` | `test_sql_injection.py` |
| FP-009 | ALLOWED_TIMEZONES allowlist | `database.py:27-40` | `test_settings_timezone_in_allowlist` | `test_sql_injection.py` |

## Security Control Details

### SQL Injection Prevention (FP-001, FP-009)

**Control**: ALLOWED_TIMEZONES allowlist validation

**Implementation**:
```python
ALLOWED_TIMEZONES = [
    'America/Toronto',
    'America/Vancouver',
    # ... other Canadian timezones
]

def set_timezone(cursor, timezone: str) -> None:
    if timezone not in ALLOWED_TIMEZONES:
        raise ValueError(f"Invalid timezone: {timezone}")
    cursor.execute(f"SET timezone = '{timezone}'")
```

**Tests That Would Fail If Control Removed**:
1. `test_invalid_timezone_rejected` - Would pass invalid timezones
2. `test_sql_injection_attempt_blocked` - Would allow SQL injection
3. `test_settings_timezone_in_allowlist` - Would fail if configured timezone not validated

**Impact of Removal**: SQL injection vulnerability would be introduced

---

### WebSocket Encryption (FP-002 through FP-008)

**Control**: getWebSocketUrl() function with production environment check

**Implementation**:
```typescript
const getWebSocketUrl = (httpUrl: string): string => {
  if (httpUrl.startsWith('https://')) {
    wsUrl = httpUrl.replace('https://', 'wss://');
  } else if (httpUrl.startsWith('http://')) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot use unencrypted WebSocket (ws://) in production environment');
    }
    wsUrl = httpUrl.replace('http://', 'ws://');
  }
  return wsUrl.replace('/graphql', '/subscriptions');
};
```

**Tests That Would Fail If Control Removed**:
1. `test_uses_wss_in_production` - Would not enforce wss:// in production
2. `test_rejects_ws_in_production` - Would not throw error for ws:// in production
3. `test_uses_ws_in_development` - Would not handle development correctly

**Impact of Removal**: Unencrypted WebSocket connections in production (PIPEDA violation)

---

## Verification Process

### Manual Verification

To verify that removing a security control triggers test failures:

1. **Identify the control** from the mapping table
2. **Temporarily comment out** the security control code
3. **Run the associated tests**
4. **Verify tests fail** with clear error messages
5. **Restore the security control**
6. **Verify tests pass** again

### Example: Testing ALLOWED_TIMEZONES Removal

```bash
# 1. Comment out the allowlist validation in database.py
# (lines 50-55 in set_timezone function)

# 2. Run SQL injection tests
cd NestSync-backend
pytest tests/security/test_sql_injection.py -v

# Expected result: Tests should FAIL
# - test_invalid_timezone_rejected: FAIL (no validation)
# - test_sql_injection_attempt_blocked: FAIL (injection possible)

# 3. Restore the validation code

# 4. Run tests again
pytest tests/security/test_sql_injection.py -v

# Expected result: Tests should PASS
```

### Example: Testing WebSocket Production Check Removal

```bash
# 1. Comment out the production check in client.ts
# (lines 80-83 in getWebSocketUrl function)

# 2. Run WebSocket security tests
cd NestSync-frontend
npm test -- websocket-security.test.ts

# Expected result: Tests should FAIL
# - test_rejects_ws_in_production: FAIL (no error thrown)

# 3. Restore the production check

# 4. Run tests again
npm test -- websocket-security.test.ts

# Expected result: Tests should PASS
```

## CI/CD Integration

The CI/CD pipeline ensures security controls remain in place by:

1. **Running all security tests** on every commit
2. **Failing the build** if any security test fails
3. **Blocking merge** if tests don't pass
4. **Validating suppressions** are still documented

If a security control is removed:
- Associated tests will fail
- CI/CD build will fail
- Developer will be alerted to re-evaluate the suppression
- Merge will be blocked until issue is resolved

## Quarterly Review Checklist

During quarterly reviews (Feb, May, Aug, Nov), verify:

- [ ] All security controls listed in this document still exist in code
- [ ] All validation tests still pass
- [ ] No new suppressions added without documentation
- [ ] No security controls removed without removing suppressions
- [ ] Test coverage remains adequate
- [ ] No new attack vectors identified

## Related Documentation

- [Semgrep False Positive Registry](./semgrep-false-positives.md)
- [Suppression Audit Log](./suppression-audit-log.md)
- [False Positive Review Process](./false-positive-review-process.md)
- [Security Test Report](../NestSync-backend/docs/testing/security-test-report-2025-11-10.md)

## Maintenance

This document must be updated whenever:
- New suppressions are added
- Security controls are modified
- New validation tests are created
- Suppressions are removed
- Code is refactored

**Document Owner**: Security Team  
**Last Review**: 2025-11-10  
**Next Review**: 2026-02-10
