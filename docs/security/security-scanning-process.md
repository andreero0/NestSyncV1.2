---
title: "Security Scanning Process"
date: 2025-11-10
category: "security"
type: "process-documentation"
status: "active"
related_docs:
  - "../../.github/workflows/security-scan.yml"
  - "../../.pre-commit-config.yaml"
  - "../../NestSync-backend/.bandit"
tags: ["security", "ci-cd", "automation", "scanning"]
---

# Security Scanning Process

## Overview

NestSync implements a comprehensive security scanning strategy with multiple layers of protection:

1. **Pre-commit Hooks**: Catch issues before they're committed
2. **Pull Request Scans**: Automated security checks on every PR
3. **Weekly Comprehensive Scans**: Deep security audits every Monday
4. **Manual Scans**: On-demand security validation

## Scanning Tools

### 1. Semgrep

**Purpose**: Multi-language security vulnerability detection

**What It Detects**:
- SQL injection vulnerabilities
- Cross-site scripting (XSS)
- Authentication bypasses
- Hardcoded secrets
- OWASP Top 10 vulnerabilities
- Language-specific security issues

**Configuration**:
- Rulesets: `auto`, `p/security-audit`, `p/secrets`, `p/owasp-top-ten`
- Languages: Python, TypeScript, JavaScript, React
- Severity levels: ERROR, WARNING, INFO

**When It Runs**:
- ✅ Pre-commit hooks (on changed files)
- ✅ Pull requests (full scan)
- ✅ Weekly schedule (Monday 9 AM UTC)
- ✅ Manual trigger via GitHub Actions

### 2. Bandit

**Purpose**: Python-specific security linting

**What It Detects**:
- SQL injection via string formatting
- Hardcoded passwords and secrets
- Insecure SSL/TLS configurations
- Shell injection vulnerabilities
- Weak cryptographic practices
- Subprocess security issues

**Configuration**:
- Config file: `NestSync-backend/.bandit`
- Minimum severity: MEDIUM
- Minimum confidence: MEDIUM
- Excludes: tests, venv, alembic versions

**When It Runs**:
- ✅ Pre-commit hooks (on changed Python files)
- ✅ Pull requests (backend scan)
- ✅ Weekly schedule
- ✅ Manual: `bandit -c .bandit -r app/`

### 3. ESLint Security Plugin

**Purpose**: JavaScript/TypeScript security linting

**What It Detects**:
- Unsafe regular expressions (ReDoS)
- eval() usage and code injection
- Non-literal require() statements
- Path traversal vulnerabilities
- Child process security issues
- Buffer overflow patterns
- Timing attack vulnerabilities
- Bidi character attacks

**Configuration**:
- Config file: `NestSync-frontend/eslint.config.js`
- Plugin: `eslint-plugin-security`
- All security rules enabled

**When It Runs**:
- ✅ Pre-commit hooks (on changed JS/TS files)
- ✅ Pull requests (frontend scan)
- ✅ Weekly schedule
- ✅ Manual: `npm run lint`

### 4. Detect Secrets

**Purpose**: Prevent hardcoded credentials from being committed

**What It Detects**:
- API keys and tokens
- AWS credentials
- Private keys
- Database passwords
- OAuth tokens
- Stripe keys
- JWT secrets

**Configuration**:
- Baseline file: `.secrets.baseline`
- Runs on all file types
- Excludes: lock files, logs, test results

**When It Runs**:
- ✅ Pre-commit hooks (on all changed files)
- ✅ Pull requests
- ✅ Manual: `detect-secrets scan`

### 5. Hadolint

**Purpose**: Dockerfile security and best practices

**What It Detects**:
- Insecure base images
- Running as root
- Exposed secrets in layers
- Inefficient layer caching
- Missing health checks

**When It Runs**:
- ✅ Pre-commit hooks (on Dockerfile changes)
- ✅ Pull requests

## Automated Scanning Schedule

### Weekly Comprehensive Scan

**Schedule**: Every Monday at 9:00 AM UTC

**What Happens**:
1. Full Semgrep scan with all rulesets
2. Complete Bandit scan of backend
3. Full ESLint security check of frontend
4. Results uploaded as artifacts
5. Summary posted to GitHub Actions

**Workflow**: `.github/workflows/security-scan.yml`

**Trigger**:
```yaml
schedule:
  - cron: '0 9 * * 1'  # Monday 9 AM UTC
```

### Pull Request Scans

**Trigger**: Every pull request to `main` or `develop`

**What Happens**:
1. Semgrep scan (blocks merge on ERROR)
2. Bandit scan (reports issues)
3. ESLint security check (reports issues)
4. Results commented on PR
5. Artifacts uploaded for review

**Merge Blocking**:
- ❌ **BLOCKED**: Semgrep ERROR severity findings
- ⚠️ **WARNING**: Bandit HIGH severity findings
- ⚠️ **WARNING**: ESLint security issues

### Manual Scans

**Trigger**: Via GitHub Actions UI or workflow dispatch

**How to Run**:
1. Go to Actions tab in GitHub
2. Select "Security Scan" workflow
3. Click "Run workflow"
4. Select branch
5. Click "Run workflow" button

## Security Scan Results

### Viewing Results

**GitHub Actions Summary**:
- Navigate to Actions → Security Scan
- View job summaries for quick overview
- Check individual job logs for details

**Artifacts**:
- `semgrep-results.json`: Machine-readable Semgrep findings
- `semgrep-report.txt`: Human-readable Semgrep report
- `bandit-results.json`: Bandit findings
- `eslint-results.json`: ESLint security issues

**Retention**: 30 days

### Understanding Severity Levels

#### Semgrep Severity

| Level | Description | Action Required |
|-------|-------------|-----------------|
| ERROR | Critical security vulnerability | **MUST FIX** - Blocks merge |
| WARNING | Potential security issue | Should fix before merge |
| INFO | Security best practice | Consider fixing |

#### Bandit Severity

| Level | Description | Action Required |
|-------|-------------|-----------------|
| HIGH | Serious security issue | **SHOULD FIX** - Review carefully |
| MEDIUM | Moderate security concern | Review and fix if applicable |
| LOW | Minor security consideration | Fix if time permits |

#### ESLint Security

| Type | Description | Action Required |
|------|-------------|-----------------|
| error | Security vulnerability | **MUST FIX** |
| warn | Potential security issue | Should fix |

## Security Dashboard

### Metrics Tracked

1. **Total Findings**: Count by severity
2. **Trend Analysis**: Findings over time
3. **Mean Time to Remediation**: How quickly issues are fixed
4. **False Positive Rate**: Accuracy of scans
5. **Coverage**: Percentage of code scanned

### Accessing the Dashboard

**GitHub Actions**:
- View workflow run history
- Check success/failure trends
- Review artifact downloads

**Future Enhancement**:
- Dedicated security dashboard UI
- Integration with security information and event management (SIEM)
- Automated reporting to stakeholders

## Notification Configuration

### Current Notifications

**GitHub Actions**:
- ✅ Workflow run status (success/failure)
- ✅ PR comments with findings
- ✅ Job summaries in Actions tab

**Email Notifications**:
- Configure in GitHub Settings → Notifications
- Receive alerts on workflow failures

### Setting Up Notifications

**For Repository Admins**:
1. Go to repository Settings
2. Navigate to Notifications
3. Configure email preferences
4. Set up Slack/Discord webhooks (optional)

**For Team Members**:
1. Watch the repository
2. Configure notification preferences
3. Subscribe to Actions workflow runs

### Slack Integration (Optional)

```yaml
# Add to .github/workflows/security-scan.yml
- name: Notify Slack
  if: failure()
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
    payload: |
      {
        "text": "Security scan failed on ${{ github.ref }}"
      }
```

## Handling Security Findings

### Workflow for Addressing Issues

1. **Review Finding**:
   - Read the description
   - Check the affected code
   - Understand the vulnerability

2. **Assess Severity**:
   - Is it a true positive?
   - What's the actual risk?
   - Is it exploitable?

3. **Fix or Suppress**:
   - **Fix**: Update code to address vulnerability
   - **Suppress**: Add to baseline if false positive

4. **Verify Fix**:
   - Run security scan locally
   - Ensure issue is resolved
   - Commit and push

5. **Document**:
   - Add comments explaining fix
   - Update security documentation
   - Track in security audit log

### Suppressing False Positives

#### Semgrep

```python
# nosemgrep: rule-id
vulnerable_looking_code()
```

#### Bandit

```python
# nosec B608
cursor.execute(f"CREATE TRIGGER {trigger_name}")
```

#### ESLint

```javascript
// eslint-disable-next-line security/detect-object-injection
const value = obj[key];
```

#### Detect Secrets

Update `.secrets.baseline`:
```bash
detect-secrets scan --baseline .secrets.baseline
```

### When to Suppress

✅ **Acceptable Reasons**:
- Confirmed false positive
- Test code with no production impact
- Migration scripts with hardcoded values
- Code that will be removed soon

❌ **Unacceptable Reasons**:
- "It's too hard to fix"
- "We'll fix it later"
- "It's not exploitable" (without proof)
- "It's been there forever"

## Security Scanning Best Practices

### For Developers

1. **Run Pre-commit Hooks**: Let them catch issues early
2. **Fix Issues Promptly**: Don't let security debt accumulate
3. **Understand Findings**: Learn from each vulnerability
4. **Ask Questions**: If unsure, consult security team
5. **Document Suppressions**: Always explain why

### For Reviewers

1. **Check Security Scan Results**: Before approving PR
2. **Verify Fixes**: Ensure vulnerabilities are properly addressed
3. **Question Suppressions**: Challenge false positive claims
4. **Educate Team**: Share security knowledge
5. **Escalate Concerns**: Flag serious issues immediately

### For Security Team

1. **Monitor Trends**: Track security metrics over time
2. **Update Rulesets**: Keep scanning tools current
3. **Tune False Positives**: Improve signal-to-noise ratio
4. **Provide Training**: Help developers write secure code
5. **Audit Suppressions**: Review suppressed findings periodically

## Troubleshooting

### Pre-commit Hooks Failing

**Issue**: Hooks fail on every commit

**Solutions**:
```bash
# Update hooks to latest version
pre-commit autoupdate

# Clear cache and reinstall
pre-commit clean
pre-commit install --install-hooks

# Run manually to see detailed errors
pre-commit run --all-files --verbose
```

### Semgrep Timeout

**Issue**: Semgrep scan times out on large files

**Solutions**:
- Add file to `.semgrepignore`
- Increase timeout in workflow
- Split large files into smaller modules

### Bandit False Positives

**Issue**: Bandit flags safe code

**Solutions**:
- Add `# nosec` comment with justification
- Update `.bandit` configuration
- Use parameterized queries instead of string formatting

### ESLint Security Errors

**Issue**: ESLint security plugin reports false positives

**Solutions**:
- Add `// eslint-disable-next-line` with rule ID
- Update `eslint.config.js` to adjust rule severity
- Refactor code to avoid pattern

## Compliance and Audit

### PIPEDA Compliance

Security scanning supports PIPEDA compliance by:
- Detecting potential data leaks
- Identifying authentication issues
- Validating encryption usage
- Ensuring audit trail integrity

### Security Audit Trail

All security scans are logged and retained:
- **Workflow Runs**: 90 days in GitHub Actions
- **Artifacts**: 30 days
- **Git History**: Permanent record of fixes

### Reporting

**Monthly Security Report**:
- Total findings by severity
- Remediation metrics
- Trend analysis
- Recommendations

**Quarterly Security Review**:
- Comprehensive audit
- Tool effectiveness evaluation
- Process improvements
- Training needs assessment

## References

### Documentation

- [Semgrep Documentation](https://semgrep.dev/docs/)
- [Bandit Documentation](https://bandit.readthedocs.io/)
- [ESLint Security Plugin](https://github.com/eslint-community/eslint-plugin-security)
- [Detect Secrets](https://github.com/Yelp/detect-secrets)
- [Pre-commit Framework](https://pre-commit.com/)

### Internal Documentation

- [Security Scan Workflow](../../.github/workflows/security-scan.yml)
- [Pre-commit Configuration](../../.pre-commit-config.yaml)
- [Bandit Configuration](../../NestSync-backend/.bandit)
- [ESLint Configuration](../../NestSync-frontend/eslint.config.js)
- [SQL Injection Audit](../../NestSync-backend/docs/security/sql-injection-audit-2025-11-10.md)

### Security Standards

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [PIPEDA Compliance](../compliance/pipeda/)

## Support

### Getting Help

**For Security Issues**:
- Email: security@nestsync.ca
- Slack: #security-team
- GitHub: Create security advisory

**For Tool Issues**:
- Check tool documentation
- Search GitHub issues
- Ask in #dev-tools Slack channel

**For Process Questions**:
- Review this documentation
- Ask in #security-questions
- Schedule security office hours

---

**Last Updated**: 2025-11-10  
**Owner**: Security Team  
**Review Cycle**: Quarterly
