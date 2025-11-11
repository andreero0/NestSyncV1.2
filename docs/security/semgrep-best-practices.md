# Semgrep Best Practices Guide

## Overview

This guide provides best practices for working with Semgrep security scanning in the NestSync project. It covers how to evaluate findings, when to suppress vs fix, and how to properly document security decisions.

**Audience**: Developers, security engineers, DevOps engineers

**Related Documentation**:
- [False Positive Registry](./semgrep-false-positives.md)
- [False Positive Review Process](./false-positive-review-process.md)
- [Suppression Audit Log](./suppression-audit-log.md)
- [Security Dashboard](./security-dashboard.md)

## Table of Contents

1. [Understanding Semgrep Findings](#understanding-semgrep-findings)
2. [Evaluating Findings](#evaluating-findings)
3. [When to Fix vs When to Suppress](#when-to-fix-vs-when-to-suppress)
4. [Suppression Comment Format](#suppression-comment-format)
5. [False Positive Validation](#false-positive-validation)
6. [Approval Process](#approval-process)
7. [Common Patterns and Examples](#common-patterns-and-examples)
8. [Troubleshooting](#troubleshooting)

---

## Understanding Semgrep Findings

### Severity Levels

Semgrep reports findings at different severity levels:

- **ERROR**: Critical security vulnerabilities that must be addressed
- **WARNING**: Potential security issues that should be reviewed
- **INFO**: Informational findings or code quality suggestions

### Finding Components

Each Semgrep finding includes:

1. **Rule ID**: Unique identifier for the security pattern (e.g., `python.lang.security.audit.formatted-sql-query`)
2. **File and Line**: Location of the flagged code
3. **Message**: Description of the potential issue
4. **Severity**: Impact level (ERROR, WARNING, INFO)
5. **Pattern**: The code pattern that triggered the alert

### Reading Semgrep Output

```
NestSync-backend/app/config/database.py
  severity:error rule:python.lang.security.audit.formatted-sql-query
    Detected formatted SQL query. This could lead to SQL injection.
    
    63: cursor.execute("SET timezone = %s", (settings.timezone,))
```

**What to look for**:
- Is this in production code or test code?
- Is the flagged pattern actually executed?
- Are there security controls in place?
- Is this a known safe pattern?

---

## Evaluating Findings

### Step 1: Verify the Finding is Real

Ask yourself:

1. **Is this in executable code?**
   - ✅ Yes → Continue evaluation
   - ❌ No (comment, string, documentation) → Likely false positive

2. **Is this code path reachable?**
   - ✅ Yes → Continue evaluation
   - ❌ No (dead code, unreachable branch) → Consider removing code

3. **Does this pattern actually create a vulnerability?**
   - ✅ Yes → Real issue, needs fixing
   - ❌ No → Continue to security control analysis

### Step 2: Analyze Security Controls

Check for existing protections:

**Input Validation**:
- Allowlist validation (predefined safe values)
- Blocklist validation (reject known bad values)
- Type checking and sanitization
- Length and format restrictions

**Environment Checks**:
- Production vs development behavior
- Feature flags and configuration
- Runtime environment detection

**Parameterization**:
- Prepared statements
- Parameterized queries
- Safe API usage

**Example - SQL Injection with Allowlist**:
```python
# Semgrep flags this as SQL injection
ALLOWED_TIMEZONES = ['America/Toronto', 'America/Vancouver', ...]

def set_timezone(cursor, timezone):
    if timezone not in ALLOWED_TIMEZONES:
        raise ValueError("Invalid timezone")
    cursor.execute("SET timezone = %s", (timezone,))
```

**Analysis**: This is safe because:
- Input is validated against a hardcoded allowlist
- Only predefined values can be used
- Attacker cannot inject arbitrary SQL

### Step 3: Check for Tests

Security controls must be tested:

```python
def test_timezone_validation_rejects_invalid():
    """Verify SQL injection attempts are blocked."""
    with pytest.raises(ValueError):
        set_timezone(cursor, "'; DROP TABLE users; --")

def test_timezone_validation_accepts_valid():
    """Verify valid timezones work correctly."""
    set_timezone(cursor, "America/Toronto")
    # Verify timezone was set
```

**If tests don't exist**: Add them before suppressing

---

## When to Fix vs When to Suppress

### Fix the Code When:

1. **No security control exists**
   - The vulnerability is real
   - Input is not validated
   - No protection mechanism in place

2. **Security control is insufficient**
   - Validation can be bypassed
   - Blocklist instead of allowlist
   - Incomplete sanitization

3. **Better alternative exists**
   - Safer API available
   - More secure pattern possible
   - Industry best practice differs

4. **Code is unclear or confusing**
   - Pattern looks dangerous even if safe
   - Future developers might misuse it
   - Refactoring would improve clarity

### Suppress When:

1. **Finding is in non-executable code**
   - Comments explaining security patterns
   - Documentation strings
   - Error messages to users

2. **Strong security control exists**
   - Allowlist validation
   - Environment-based behavior
   - Parameterized queries with validation

3. **Security control is tested**
   - Automated tests verify protection
   - Tests cover attack scenarios
   - CI/CD validates controls

4. **Pattern is intentionally safe**
   - Security validation code
   - Test fixtures
   - Development-only code paths

### Decision Tree

```
Is the finding in executable code?
├─ No → SUPPRESS (document as false positive)
└─ Yes → Is there a security control?
    ├─ No → FIX (implement protection)
    └─ Yes → Is the control tested?
        ├─ No → ADD TESTS, then suppress
        └─ Yes → Is the control sufficient?
            ├─ No → FIX (strengthen control)
            └─ Yes → SUPPRESS (document control)
```

---

## Suppression Comment Format

### Standard Format

Every suppression must include:
1. **nosemgrep directive** with rule ID
2. **Justification** explaining why it's safe
3. **Security control reference** (if applicable)
4. **Test reference** (if applicable)

### Python Suppression Format

```python
# nosemgrep: [rule-id]
# Security Control: [description and location]
# Validated By: [test reference]
[flagged code]
```

### TypeScript/JavaScript Suppression Format

```typescript
// nosemgrep: [rule-id]
// Security Control: [description and location]
// Validated By: [test reference]
[flagged code]
```

### Examples

#### Good Example - SQL Injection with Allowlist

```python
# nosemgrep: python.lang.security.audit.formatted-sql-query
# Security Control: timezone validated against ALLOWED_TIMEZONES allowlist (lines 15-21)
# Validated By: tests/security/test_sql_injection.py::test_timezone_validation_rejects_invalid
cursor.execute("SET timezone = %s", (settings.timezone,))
```

**Why this is good**:
- ✅ Includes rule ID
- ✅ Explains the security control
- ✅ References control location
- ✅ Links to validation test
- ✅ Clear and maintainable

#### Good Example - WebSocket in Comment

```typescript
// nosemgrep: javascript.lang.security.audit.insecure-websocket
// This is a comment explaining security patterns, not actual code
// Production implementation uses wss:// (see getWebSocketUrl function)
// Example: ws://localhost:8001 (development only)
```

**Why this is good**:
- ✅ Explains it's documentation
- ✅ References actual implementation
- ✅ Clarifies development vs production

#### Bad Example - Missing Justification

```python
# nosemgrep: python.lang.security.audit.formatted-sql-query
cursor.execute("SET timezone = %s", (settings.timezone,))
```

**Why this is bad**:
- ❌ No explanation of why it's safe
- ❌ No security control reference
- ❌ No test reference
- ❌ Future developers won't understand

#### Bad Example - Vague Justification

```typescript
// nosemgrep: javascript.lang.security.audit.insecure-websocket
// This is safe, trust me
const url = getWebSocketUrl(apiUrl);
```

**Why this is bad**:
- ❌ No specific security control mentioned
- ❌ No test reference
- ❌ "Trust me" is not a justification
- ❌ Doesn't explain why it's safe

---

## False Positive Validation

### How to Determine if a Finding is a False Positive

Use this checklist:

#### 1. Code Context Check

- [ ] Is the flagged code in a comment?
- [ ] Is the flagged code in a string literal (error message, documentation)?
- [ ] Is the flagged code in test fixtures or mock data?
- [ ] Is the flagged code in dead/unreachable code?

**If yes to any**: Likely false positive

#### 2. Security Control Check

- [ ] Is there input validation (allowlist, type checking)?
- [ ] Is there environment-based behavior (production vs development)?
- [ ] Is there parameterization or safe API usage?
- [ ] Is there sanitization or encoding?

**If yes to any**: Potentially false positive, verify control is sufficient

#### 3. Test Coverage Check

- [ ] Are there tests for the security control?
- [ ] Do tests cover attack scenarios?
- [ ] Do tests verify the control works?
- [ ] Would removing the control cause tests to fail?

**If yes to all**: Strong evidence of false positive

#### 4. Pattern Analysis Check

- [ ] Is this a known safe pattern in the codebase?
- [ ] Is this following security best practices?
- [ ] Is this documented in security guidelines?
- [ ] Would security experts agree this is safe?

**If yes to all**: Likely false positive

### Common False Positive Patterns

#### Pattern 1: Security Validation Code

```typescript
// Code that validates security patterns
function getWebSocketUrl(httpUrl: string): string {
  if (process.env.NODE_ENV === 'production') {
    return httpUrl.replace('https://', 'wss://');
  }
  return httpUrl.replace('http://', 'ws://');
}
```

**Why flagged**: Contains `ws://` pattern
**Why safe**: Production uses `wss://`, `ws://` only in development
**Action**: Suppress with environment check explanation

#### Pattern 2: Allowlist-Validated Input

```python
ALLOWED_VALUES = ['option1', 'option2', 'option3']

def process_input(value):
    if value not in ALLOWED_VALUES:
        raise ValueError("Invalid value")
    # Use value in query
```

**Why flagged**: Dynamic value in query
**Why safe**: Value validated against hardcoded allowlist
**Action**: Suppress with allowlist reference

#### Pattern 3: Comments and Documentation

```typescript
/**
 * WebSocket connection example:
 * ws://localhost:8001/subscriptions (development)
 * wss://api.nestsync.ca/subscriptions (production)
 */
```

**Why flagged**: Contains `ws://` pattern
**Why safe**: This is documentation, not executable code
**Action**: Suppress with comment explanation

### When to Escalate to Security Team

Escalate when:

1. **Uncertain about security control**
   - Control seems weak or bypassable
   - Not sure if validation is sufficient
   - Complex security logic

2. **High severity finding**
   - ERROR level findings
   - Affects authentication or authorization
   - Involves sensitive data

3. **No clear security control**
   - Can't identify protection mechanism
   - Pattern looks genuinely dangerous
   - Would fail security review

4. **Compliance implications**
   - Affects PIPEDA compliance
   - Involves payment data (PCI-DSS)
   - Regulatory requirements unclear

**How to escalate**:
- Create security review ticket
- Tag security team in PR
- Document analysis performed
- Include code context and concerns

---

## Approval Process

### Who Can Approve Suppressions

**Level 1: Developer** (self-approval allowed for):
- Comments and documentation
- Test code and fixtures
- Clear false positives with strong controls

**Level 2: Senior Developer** (required for):
- Production code suppressions
- Security control validation
- Complex patterns

**Level 3: Security Team** (required for):
- ERROR severity suppressions
- Authentication/authorization code
- Payment processing code
- Compliance-sensitive code

### Required Reviews

Before suppressing a finding:

1. **Self-Review**
   - Verify it's truly a false positive
   - Check for security controls
   - Ensure tests exist

2. **Code Review**
   - At least one other developer
   - Security team for sensitive code
   - Document in PR description

3. **Documentation Review**
   - Add to false positive registry
   - Update suppression audit log
   - Follow standard format

### Timeline Expectations

- **Simple suppressions** (comments, docs): Same day
- **Standard suppressions** (with controls): 1-2 days
- **Complex suppressions** (security review): 3-5 days
- **Compliance-sensitive**: 1-2 weeks

### Approval Workflow

```
Developer identifies finding
         ↓
Evaluate using checklist
         ↓
    ┌────┴────┐
    ↓         ↓
Real Issue   False Positive
    ↓         ↓
  Fix      Document control
    ↓         ↓
  Test     Add/verify tests
    ↓         ↓
           Add suppression
             ↓
        Code review
             ↓
    ┌────────┴────────┐
    ↓                 ↓
Simple          Complex/Sensitive
    ↓                 ↓
Approve         Security review
    ↓                 ↓
    └────────┬────────┘
             ↓
    Update documentation
             ↓
    Merge to main
```

**See also**: [False Positive Review Process](./false-positive-review-process.md)

---

## Common Patterns and Examples

### SQL Injection Patterns

#### Safe: Parameterized Query with Allowlist

```python
ALLOWED_TIMEZONES = [
    'America/Toronto',
    'America/Vancouver',
    'America/Edmonton',
    'America/Winnipeg',
    'America/Halifax',
    'America/St_Johns'
]

def set_timezone(cursor, timezone: str):
    """Set database timezone to Canadian timezone."""
    if timezone not in ALLOWED_TIMEZONES:
        raise ValueError(f"Invalid timezone: {timezone}")
    
    # nosemgrep: python.lang.security.audit.formatted-sql-query
    # Security Control: timezone validated against ALLOWED_TIMEZONES allowlist (lines 1-8)
    # Validated By: tests/security/test_sql_injection.py::test_timezone_validation_rejects_invalid
    cursor.execute("SET timezone = %s", (timezone,))
```

#### Unsafe: No Validation

```python
def set_timezone(cursor, timezone: str):
    # ❌ VULNERABLE: No validation
    cursor.execute(f"SET timezone = '{timezone}'")
```

### WebSocket Security Patterns

#### Safe: Environment-Aware URL Generation

```typescript
export function getWebSocketUrl(httpUrl: string): string {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    // Production: Always use wss://
    return httpUrl.replace('https://', 'wss://');
  }
  
  // nosemgrep: javascript.lang.security.audit.insecure-websocket
  // Security Control: Development-only, production uses wss:// (line 5)
  // Validated By: tests/security/test_websocket_encryption.spec.ts
  return httpUrl.replace('http://', 'ws://');
}
```

#### Unsafe: Hardcoded Insecure URL

```typescript
// ❌ VULNERABLE: Hardcoded ws:// in production
const wsUrl = 'ws://api.nestsync.ca/subscriptions';
```

### Path Traversal Patterns

#### Safe: Allowlist Validation

```python
ALLOWED_PATHS = ['uploads', 'documents', 'images']

def get_file_path(base_dir: str, user_path: str) -> str:
    """Get file path with directory traversal protection."""
    # Validate against allowlist
    if user_path not in ALLOWED_PATHS:
        raise ValueError("Invalid path")
    
    # nosemgrep: python.lang.security.audit.path-traversal
    # Security Control: path validated against ALLOWED_PATHS allowlist
    # Validated By: tests/security/test_path_traversal.py
    return os.path.join(base_dir, user_path)
```

#### Unsafe: No Validation

```python
def get_file_path(base_dir: str, user_path: str) -> str:
    # ❌ VULNERABLE: User can use ../../../etc/passwd
    return os.path.join(base_dir, user_path)
```

---

## Troubleshooting

### Issue: Suppression Not Working

**Symptoms**: Semgrep still reports the finding after adding suppression comment

**Solutions**:

1. **Check rule ID format**
   ```python
   # ❌ Wrong
   # nosemgrep python.lang.security.audit.formatted-sql-query
   
   # ✅ Correct
   # nosemgrep: python.lang.security.audit.formatted-sql-query
   ```

2. **Check comment placement**
   ```python
   # ❌ Wrong - comment after code
   cursor.execute("SET timezone = %s", (tz,))
   # nosemgrep: python.lang.security.audit.formatted-sql-query
   
   # ✅ Correct - comment before code
   # nosemgrep: python.lang.security.audit.formatted-sql-query
   cursor.execute("SET timezone = %s", (tz,))
   ```

3. **Check for typos in rule ID**
   - Copy rule ID exactly from Semgrep output
   - Rule IDs are case-sensitive

### Issue: CI/CD Failing on Suppressions

**Symptoms**: Build fails even with suppressions in place

**Solutions**:

1. **Check baseline file**
   ```bash
   # Update baseline if suppressions are documented
   grep -r "nosemgrep:" --include="*.py" --include="*.ts" --include="*.js" . | \
     wc -l > .semgrep-suppression-baseline
   ```

2. **Verify documentation**
   - All suppressions must be in `docs/security/semgrep-false-positives.md`
   - Run validation: `./tests/validate-suppressions.sh`

3. **Check audit log**
   - All suppressions must be in `docs/security/suppression-audit-log.md`
   - Include timestamp and reviewer

### Issue: Unsure if Finding is False Positive

**Symptoms**: Can't determine if security control is sufficient

**Solutions**:

1. **Use the checklist** in [False Positive Validation](#false-positive-validation)

2. **Ask for help**
   - Post in #security channel
   - Tag security team in PR
   - Create security review ticket

3. **When in doubt, don't suppress**
   - Better to have false positives than miss real issues
   - Get security team review first

### Issue: Tests Don't Cover Security Control

**Symptoms**: Security control exists but no tests validate it

**Solutions**:

1. **Add security tests first**
   ```python
   def test_security_control_blocks_attack():
       """Verify security control prevents exploitation."""
       with pytest.raises(SecurityError):
           vulnerable_function("malicious_input")
   ```

2. **Don't suppress until tests exist**
   - Tests prove the control works
   - Tests catch if control is removed
   - Required for compliance

3. **Reference tests in suppression**
   ```python
   # Validated By: tests/security/test_[feature].py::test_[control]
   ```

---

## Quick Reference

### Suppression Checklist

Before adding a suppression:

- [ ] Verified finding is false positive using checklist
- [ ] Identified security control (if applicable)
- [ ] Verified tests exist for security control
- [ ] Added suppression comment with proper format
- [ ] Documented in `docs/security/semgrep-false-positives.md`
- [ ] Added entry to `docs/security/suppression-audit-log.md`
- [ ] Updated `.semgrep-suppression-baseline` if needed
- [ ] Got appropriate approval (developer/senior/security)
- [ ] Linked to PR and commit hash

### Standard Suppression Template

```python
# nosemgrep: [rule-id]
# Security Control: [description and location]
# Validated By: [test reference]
[flagged code]
```

### Key Documentation Files

- **False Positive Registry**: `docs/security/semgrep-false-positives.md`
- **Audit Log**: `docs/security/suppression-audit-log.md`
- **Review Process**: `docs/security/false-positive-review-process.md`
- **This Guide**: `docs/security/semgrep-best-practices.md`
- **Security Dashboard**: `docs/security/security-dashboard.md`

### Getting Help

- **Security questions**: #security channel or security@nestsync.ca
- **Process questions**: See [False Positive Review Process](./false-positive-review-process.md)
- **Technical issues**: DevOps team or #infrastructure channel

---

**Last Updated**: 2025-11-11  
**Version**: 1.0  
**Maintained By**: Security Team  
**Review Schedule**: Quarterly (Feb, May, Aug, Nov)
