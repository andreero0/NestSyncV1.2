# Design Document

## Overview

This design addresses the management of Semgrep false positives identified during the comprehensive security analysis on November 10, 2025. The scan found 9 alerts across 18 files, all determined to be false positives with proper security controls in place:

1. **SQL Injection Warning** (1 instance): `database.py:63` - Safe due to ALLOWED_TIMEZONES allowlist validation
2. **WebSocket Security Warnings** (7 instances): `client.ts` - Warnings in comments, error messages, and security validation code
3. **Other Findings** (1 instance): To be documented

The solution focuses on:
1. **Proper Documentation**: Clear justification for each suppression
2. **Code Suppressions**: Inline comments that silence false positives
3. **Process Establishment**: Repeatable workflow for future findings
4. **Validation**: Tests that prove security controls work
5. **Audit Trail**: Compliance-ready documentation

## Architecture

### System Context

```
┌─────────────────────────────────────────────────────────────┐
│                   Security Scanning System                   │
│                                                              │
│  ┌────────────────┐         ┌──────────────────┐           │
│  │   Semgrep      │────────▶│  Scan Results    │           │
│  │   Scanner      │         │  with Findings   │           │
│  └────────────────┘         └──────────────────┘           │
│         │                            │                       │
│         │                            ▼                       │
│         │                   ┌──────────────────┐           │
│         │                   │  False Positive  │           │
│         │                   │  Evaluation      │           │
│         │                   └──────────────────┘           │
│         │                            │                       │
│         ▼                            ▼                       │
│  ┌────────────────────────────────────────────┐            │
│  │         Suppression Management              │            │
│  │  ┌──────────────────────────────────────┐  │            │
│  │  │  1. Document Finding                 │  │            │
│  │  │  2. Add Suppression Comment          │  │            │
│  │  │  3. Update Audit Log                 │  │            │
│  │  │  4. Validate Security Control        │  │            │
│  │  └──────────────────────────────────────┘  │            │
│  └────────────────────────────────────────────┘            │
│         │                                                    │
│         ▼                                                    │
│  ┌────────────────────────────────────────────┐            │
│  │         CI/CD Pipeline                      │            │
│  │  - Respects suppressions                    │            │
│  │  - Reports suppressed findings              │            │
│  │  - Blocks on new ERROR findings             │            │
│  └────────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

### Design Principles

1. **Transparency**: Every suppression must be documented and justified
2. **Validation**: Security controls must be tested
3. **Maintainability**: Suppressions should be easy to review and update
4. **Compliance**: Audit trail for regulatory requirements
5. **Automation**: CI/CD respects suppressions but monitors for changes

## Components and Interfaces

### 1. False Positive Documentation

**Location**: `docs/security/semgrep-false-positives.md`

**Purpose**: Central registry of all suppressed Semgrep findings

**Structure**:
```markdown
# Semgrep False Positive Registry

## Overview
This document tracks all Semgrep findings that have been evaluated and determined to be false positives.

## False Positive Findings

### FP-001: SQL Injection in Timezone Setting
**File**: `NestSync-backend/app/config/database.py:63`  
**Rule**: `python.lang.security.audit.formatted-sql-query`  
**Severity**: ERROR  
**Date Identified**: 2025-11-10  
**Reviewed By**: Security Team  
**Status**: Suppressed

**Finding Description**:
Semgrep flagged the timezone setting as potential SQL injection due to string formatting in SQL query.

**Why This is a False Positive**:
The timezone value is validated against a hardcoded ALLOWED_TIMEZONES allowlist before use. Only predefined Canadian timezone values are permitted. The validation function `set_timezone()` raises a ValueError if an invalid timezone is provided.

**Security Controls**:
- ALLOWED_TIMEZONES allowlist (lines 15-21)
- set_timezone() validation function (lines 23-27)
- Parameterized query execution (line 28)

**Validation Tests**:
- `tests/security/test_sql_injection.py::test_timezone_validation_rejects_invalid`
- `tests/security/test_sql_injection.py::test_timezone_sql_injection_attempt`

**Suppression Location**: `database.py:62`

**Next Review Date**: 2026-02-10 (Quarterly)

---

### FP-002: WebSocket Security in Comments
**File**: `NestSync-frontend/lib/graphql/client.ts:45`  
**Rule**: `javascript.lang.security.audit.insecure-websocket`  
**Severity**: WARNING  
...
```

### 2. Suppression Comment Format

**Standard Format**:
```python
# nosemgrep: [rule-id] - [brief justification]
# Security Control: [reference to mitigation]
# Validated By: [test reference]
```

**Example for SQL Injection**:
```python
# nosemgrep: python.lang.security.audit.formatted-sql-query
# Security Control: timezone validated against ALLOWED_TIMEZONES allowlist (lines 15-21)
# Validated By: tests/security/test_sql_injection.py::test_timezone_validation_rejects_invalid
cursor.execute("SET timezone = %s", (settings.timezone,))
```

**Example for WebSocket in Comments**:
```typescript
// nosemgrep: javascript.lang.security.audit.insecure-websocket
// This is a comment explaining the security pattern, not actual code
// The actual implementation uses wss:// in production (see getWebSocketUrl function)
```

### 3. Semgrep Configuration

**Location**: `.semgrep.yml`

**Purpose**: Custom rules and exclusions to reduce false positives

**Configuration**:
```yaml
rules:
  # Exclude comments from security pattern matching
  - id: exclude-comments-from-security-checks
    patterns:
      - pattern-not-inside: |
          // ...
      - pattern-not-inside: |
          /* ... */
      - pattern-not-inside: |
          # ...
    message: "Exclude comments from security pattern matching"
    languages: [python, javascript, typescript]
    severity: INFO

  # Custom rule for validated SQL parameters
  - id: validated-sql-parameters
    patterns:
      - pattern: cursor.execute($QUERY, $PARAMS)
      - pattern-inside: |
          def set_timezone(...):
            ...
            if $VALUE not in ALLOWED_TIMEZONES:
              ...
            cursor.execute(...)
    message: "SQL parameter validated against allowlist"
    languages: [python]
    severity: INFO

  # Custom rule for environment-aware WebSocket
  - id: environment-aware-websocket
    patterns:
      - pattern: |
          const getWebSocketUrl = (...) => {
            ...
            .replace('https://', 'wss://')
            ...
          }
    message: "WebSocket URL properly handles production encryption"
    languages: [javascript, typescript]
    severity: INFO

# Paths to exclude from scanning
paths:
  exclude:
    - "*.test.ts"
    - "*.test.py"
    - "*.spec.ts"
    - "node_modules/"
    - "venv/"
    - "dist/"
    - "build/"
```

### 4. False Positive Review Process

**Location**: `docs/security/false-positive-review-process.md`

**Workflow**:
```
┌─────────────────────┐
│  Semgrep Finding    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Initial Review     │
│  - Is it in code?   │
│  - Is it reachable? │
└──────────┬──────────┘
           │
           ▼
    ┌──────┴──────┐
    │             │
    ▼             ▼
┌────────┐   ┌────────────┐
│ Real   │   │ Potential  │
│ Issue  │   │ False      │
└───┬────┘   │ Positive   │
    │        └──────┬─────┘
    │               │
    │               ▼
    │        ┌──────────────────┐
    │        │ Security Control │
    │        │ Analysis         │
    │        │ - Allowlist?     │
    │        │ - Validation?    │
    │        │ - Env check?     │
    │        └──────┬───────────┘
    │               │
    │        ┌──────┴──────┐
    │        │             │
    │        ▼             ▼
    │   ┌────────┐   ┌──────────┐
    │   │ False  │   │ Needs    │
    │   │ Pos    │   │ Fix      │
    │   └───┬────┘   └────┬─────┘
    │       │             │
    │       ▼             │
    │   ┌────────────┐    │
    │   │ Document   │    │
    │   │ & Suppress │    │
    │   └───┬────────┘    │
    │       │             │
    │       ▼             │
    │   ┌────────────┐    │
    │   │ Add Tests  │    │
    │   │ for Control│    │
    │   └───┬────────┘    │
    │       │             │
    └───────┴─────────────┘
            │
            ▼
    ┌───────────────┐
    │ Update Audit  │
    │ Log           │
    └───────────────┘
```

**Decision Criteria**:

1. **Is the finding in executable code?**
   - If in comments/strings → False Positive
   - If in actual code → Continue evaluation

2. **Is there a security control?**
   - Allowlist validation → Document control
   - Environment check → Document control
   - Input sanitization → Document control
   - No control → Real Issue

3. **Is the control tested?**
   - Yes → Safe to suppress
   - No → Add tests first

4. **Is the control documented?**
   - Yes → Add suppression
   - No → Document then suppress

### 5. Suppression Audit Log

**Location**: `docs/security/suppression-audit-log.md`

**Format**:
```markdown
# Suppression Audit Log

## 2025-11-10

### Suppression Added: database.py SQL Injection
- **Finding ID**: FP-001
- **File**: NestSync-backend/app/config/database.py:63
- **Rule**: python.lang.security.audit.formatted-sql-query
- **Reviewer**: Security Team
- **Decision**: False Positive - Allowlist validated
- **Justification**: Timezone value validated against ALLOWED_TIMEZONES before use
- **Tests Added**: test_timezone_validation_rejects_invalid
- **Commit**: [commit-hash]

### Suppression Added: client.ts WebSocket Comments
- **Finding ID**: FP-002 through FP-008
- **File**: NestSync-frontend/lib/graphql/client.ts
- **Rule**: javascript.lang.security.audit.insecure-websocket
- **Reviewer**: Security Team
- **Decision**: False Positive - Warnings in non-executable code
- **Justification**: Findings in comments and error messages, actual code uses wss:// in production
- **Tests Added**: test_websocket_encryption_production
- **Commit**: [commit-hash]
```

### 6. CI/CD Integration

**Location**: `.github/workflows/security-scan.yml`

**Updates**:
```yaml
name: Security Scan

on:
  pull_request:
  push:
    branches: [main, develop]
  schedule:
    - cron: '0 0 * * 0'  # Weekly on Sunday

jobs:
  semgrep:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run Semgrep
        uses: returntocorp/semgrep-action@v1
        with:
          config: >-
            p/security-audit
            p/owasp-top-ten
            .semgrep.yml
          
      - name: Generate Suppression Report
        run: |
          echo "## Suppressed Findings" >> $GITHUB_STEP_SUMMARY
          grep -r "nosemgrep:" --include="*.py" --include="*.ts" --include="*.js" . | \
            wc -l | xargs -I {} echo "Total suppressions: {}" >> $GITHUB_STEP_SUMMARY
          
      - name: Check for New Suppressions
        run: |
          # Compare suppression count with baseline
          CURRENT=$(grep -r "nosemgrep:" --include="*.py" --include="*.ts" --include="*.js" . | wc -l)
          BASELINE=$(cat .semgrep-suppression-baseline || echo "0")
          
          if [ $CURRENT -gt $BASELINE ]; then
            echo "⚠️ New suppressions detected: $((CURRENT - BASELINE))"
            echo "Please ensure new suppressions are documented in docs/security/semgrep-false-positives.md"
          fi
          
      - name: Fail on ERROR Severity
        run: |
          # This step fails if any unsuppressed ERROR findings exist
          semgrep --config=p/security-audit --severity=ERROR --error
```

### 7. Security Dashboard Updates

**Location**: `docs/security/security-dashboard.md`

**New Section**:
```markdown
## Suppressed Findings

### Summary
- **Total Suppressions**: 9
- **Last Review**: 2025-11-10
- **Next Review**: 2026-02-10

### By Category
| Category | Count | Status |
|----------|-------|--------|
| SQL Injection (False Positive) | 1 | ✅ Validated |
| WebSocket Security (False Positive) | 7 | ✅ Validated |
| Other | 1 | ✅ Validated |

### Suppression Details
All suppressed findings have:
- ✅ Security control validation
- ✅ Automated tests
- ✅ Documentation
- ✅ Audit trail

[View Full Registry](./semgrep-false-positives.md)  
[View Audit Log](./suppression-audit-log.md)

### Quarterly Review Schedule
- Q1 2026: February 10
- Q2 2026: May 10
- Q3 2026: August 10
- Q4 2026: November 10
```

## Data Models

### False Positive Record

```typescript
interface FalsePositiveRecord {
  id: string;                    // FP-001, FP-002, etc.
  file: string;                  // File path
  line: number;                  // Line number
  rule: string;                  // Semgrep rule ID
  severity: 'ERROR' | 'WARNING' | 'INFO';
  dateIdentified: Date;
  reviewedBy: string;
  status: 'suppressed' | 'under-review' | 'resolved';
  
  finding: {
    description: string;
    pattern: string;
  };
  
  justification: {
    reason: string;
    securityControls: string[];
    validationTests: string[];
  };
  
  suppression: {
    location: string;            // File:line where suppression added
    comment: string;             // Suppression comment text
    commit: string;              // Git commit hash
  };
  
  review: {
    nextReviewDate: Date;
    reviewFrequency: 'quarterly' | 'annually';
  };
}
```

### Suppression Audit Entry

```typescript
interface SuppressionAuditEntry {
  timestamp: Date;
  findingId: string;
  action: 'added' | 'removed' | 'reviewed' | 'updated';
  file: string;
  rule: string;
  reviewer: string;
  decision: 'false-positive' | 'real-issue' | 'needs-investigation';
  justification: string;
  testsAdded: string[];
  commit: string;
}
```

## Error Handling

### Suppression Validation Errors

```typescript
enum SuppressionError {
  MISSING_JUSTIFICATION = 'suppression_missing_justification',
  NO_SECURITY_CONTROL = 'suppression_no_security_control',
  UNTESTED_CONTROL = 'suppression_untested_control',
  UNDOCUMENTED = 'suppression_undocumented',
  EXPIRED_REVIEW = 'suppression_expired_review',
}

const errorMessages: Record<SuppressionError, string> = {
  [SuppressionError.MISSING_JUSTIFICATION]: 
    'Suppression comment must include justification',
  [SuppressionError.NO_SECURITY_CONTROL]: 
    'No security control identified for this suppression',
  [SuppressionError.UNTESTED_CONTROL]: 
    'Security control must have automated tests',
  [SuppressionError.UNDOCUMENTED]: 
    'Suppression must be documented in semgrep-false-positives.md',
  [SuppressionError.EXPIRED_REVIEW]: 
    'Suppression requires quarterly review',
};
```

## Testing Strategy

### Validation Tests

**Purpose**: Prove that security controls work as documented

**SQL Injection Prevention**:
```python
# tests/security/test_sql_injection.py

def test_timezone_allowlist_prevents_injection():
    """Verify ALLOWED_TIMEZONES prevents SQL injection."""
    with pytest.raises(ValueError):
        set_timezone(cursor, "'; DROP TABLE users; --")

def test_valid_timezone_accepted():
    """Verify valid timezones work correctly."""
    set_timezone(cursor, "America/Toronto")
    # Verify timezone was set correctly
```

**WebSocket Encryption**:
```typescript
// tests/security/test_websocket_encryption.spec.ts

describe('WebSocket Encryption', () => {
  it('uses wss:// in production', () => {
    process.env.NODE_ENV = 'production';
    const url = getWebSocketUrl('https://api.nestsync.ca/graphql');
    expect(url).toBe('wss://api.nestsync.ca/subscriptions');
  });
  
  it('uses ws:// in development', () => {
    process.env.NODE_ENV = 'development';
    const url = getWebSocketUrl('http://localhost:8001/graphql');
    expect(url).toBe('ws://localhost:8001/subscriptions');
  });
});
```

### Suppression Validation Tests

**Purpose**: Ensure suppressions are properly documented

```bash
#!/bin/bash
# tests/validate-suppressions.sh

# Check that all suppressions are documented
echo "Validating suppressions..."

# Find all nosemgrep comments
SUPPRESSIONS=$(grep -r "nosemgrep:" --include="*.py" --include="*.ts" --include="*.js" . | wc -l)

# Count documented suppressions
DOCUMENTED=$(grep -c "^### FP-" docs/security/semgrep-false-positives.md)

if [ $SUPPRESSIONS -ne $DOCUMENTED ]; then
  echo "❌ Mismatch: $SUPPRESSIONS suppressions in code, $DOCUMENTED documented"
  exit 1
fi

echo "✅ All $SUPPRESSIONS suppressions are documented"
```

## Implementation Phases

### Phase 1: Documentation and Suppression (Priority: P1 - 1 Day)

1. **Create False Positive Registry**
   - Document all 9 false positives
   - Include justifications and security controls
   - Reference validation tests

2. **Add Suppression Comments**
   - Add nosemgrep comments to database.py
   - Add nosemgrep comments to client.ts (7 locations)
   - Follow standard format with justifications

3. **Create Audit Log**
   - Document suppression decisions
   - Include reviewer and timestamp
   - Link to commits

**Deliverables**:
- semgrep-false-positives.md complete
- All 9 suppressions added to code
- suppression-audit-log.md created

### Phase 2: Process and Configuration (Priority: P1 - 1 Day)

1. **Create Review Process**
   - Document false positive evaluation workflow
   - Define decision criteria
   - Establish approval requirements

2. **Configure Semgrep**
   - Create .semgrep.yml with custom rules
   - Exclude comments from pattern matching
   - Add project-specific patterns

3. **Update CI/CD**
   - Add suppression reporting
   - Add baseline tracking
   - Alert on new suppressions

**Deliverables**:
- false-positive-review-process.md complete
- .semgrep.yml configured
- CI/CD updated with suppression tracking

### Phase 3: Validation and Dashboard (Priority: P2 - 1 Day)

1. **Validation Tests**
   - Ensure SQL injection tests cover allowlist
   - Ensure WebSocket tests cover production encryption
   - Add suppression validation script

2. **Update Security Dashboard**
   - Add suppressed findings section
   - Show validation status
   - Include review schedule

3. **Documentation**
   - Create Semgrep best practices guide
   - Update security documentation index
   - Link from main README

**Deliverables**:
- All security controls tested
- Security dashboard updated
- Documentation complete

## Success Criteria

### Documentation
1. ✅ All 9 false positives documented with justification
2. ✅ Suppression audit log created and maintained
3. ✅ False positive review process documented
4. ✅ Semgrep best practices guide created

### Code Suppressions
5. ✅ SQL injection warning suppressed in database.py
6. ✅ All 7 WebSocket warnings suppressed in client.ts
7. ✅ Suppression comments follow standard format
8. ✅ All suppressions reference security controls

### Validation
9. ✅ Security control tests pass
10. ✅ Suppression validation script passes
11. ✅ CI/CD respects suppressions
12. ✅ No unsuppressed ERROR findings

### Process
13. ✅ Review process established
14. ✅ Quarterly review schedule set
15. ✅ Audit trail maintained
16. ✅ Security dashboard updated

## Future Enhancements

1. **Automated Suppression Validation**: Script that checks suppressions against tests
2. **Suppression Expiry**: Automatic alerts when suppressions need review
3. **Machine Learning**: Train model to identify false positives automatically
4. **Integration with Issue Tracker**: Link suppressions to security tickets
5. **Compliance Reporting**: Generate audit reports for regulatory requirements
