# Documentation Maintenance Guide

## Overview

This guide provides instructions for maintaining NestSync's documentation structure. Following these guidelines ensures documentation remains organized, discoverable, and valuable for all team members.

## Documentation Principles

### 1. Design Documentation is Authoritative
- **Location**: `/design-documentation/`
- **Purpose**: Source of truth for all feature designs and UX patterns
- **Rule**: Implementation reports should reference design docs, never override them
- **Maintenance**: Design documentation is never archived

### 2. Compliance Documentation is Always Active
- **Location**: `/docs/compliance/`
- **Purpose**: PIPEDA compliance, security policies, and audit trails
- **Rule**: Compliance documentation is NEVER archived
- **Maintenance**: Keep current, update as regulations change

### 3. Archives Preserve History
- **Location**: `/docs/archives/`
- **Purpose**: Historical context for past decisions and solutions
- **Rule**: Archives are organized by date and category with indexed navigation
- **Maintenance**: Add new archives with proper metadata and cross-references

### 4. Component Documentation Stays with Components
- **Backend**: `/NestSync-backend/docs/`
- **Frontend**: `/NestSync-frontend/docs/`
- **Rule**: Component-specific docs live with the component
- **Maintenance**: Update component docs when making changes

## Archive Process for Future Reports

### When to Archive a Document

Archive a document when:
- It's an implementation report for a completed feature
- It's a test report with a timestamp or version indicator
- It's a bug fix report for a resolved issue
- It's an audit report that's been completed
- It's no longer actively referenced in daily development

Do NOT archive:
- Active troubleshooting guides
- Current setup instructions
- Design documentation
- Compliance documentation
- Architecture documentation that's still relevant

### Step-by-Step Archive Process

#### Step 1: Determine Archive Category

Choose the appropriate category:
- **`/docs/archives/YYYY/MM-month/`** - For time-sensitive fixes and reports
- **`/docs/archives/implementation-reports/`** - For feature implementation docs
- **`/docs/archives/test-reports/`** - For test execution results
  - `/e2e/` - End-to-end test reports
  - `/integration/` - Integration test reports
  - `/visual/` - Visual regression test reports
  - `/compliance/` - Compliance test reports
- **`/docs/archives/fixes/`** - For bug fix documentation
  - `/authentication/` - Auth-related fixes
  - `/ui-ux/` - UI/UX fixes
  - `/notifications/` - Notification fixes
  - `/compliance/` - Compliance fixes
  - `/data-integrity/` - Data integrity fixes
- **`/docs/archives/audits/`** - For compliance and security audits

#### Step 2: Add Metadata Frontmatter

Add YAML frontmatter to the top of the document:

```yaml
---
title: "Token Validation Implementation"
date: 2025-01-04
category: "authentication"
priority: "P0"
status: "resolved"
impact: "critical"
platforms: ["ios", "android", "web"]
related_docs:
  - "design-documentation/features/authentication/"
  - "docs/troubleshooting/authentication-issues.md"
tags: ["authentication", "token", "mobile", "bug-fix"]
---
```

**Required Fields:**
- `title`: Clear, descriptive title
- `date`: Date of completion (YYYY-MM-DD)
- `category`: Primary category (authentication, ui-ux, payment, etc.)
- `status`: Current status (resolved, deprecated, superseded)

**Optional Fields:**
- `priority`: P0 (critical), P1 (high), P2 (medium), P3 (low)
- `impact`: critical, high, medium, low
- `platforms`: Affected platforms
- `related_docs`: Cross-references to related documentation
- `tags`: Searchable keywords

#### Step 3: Move File to Archive

```bash
# Example: Moving a fix report
mv NestSync-frontend/TOKEN_VALIDATION_FIX.md \
   docs/archives/2025/01-january/token-validation-fix.md

# Example: Moving a test report
mv NestSync-backend/PAYMENT_FLOW_TEST_REPORT.md \
   docs/archives/test-reports/e2e/payment-flow-test-20250104.md
```

**Naming Conventions:**
- Use kebab-case for filenames
- Include date suffix for test reports: `report-name-YYYYMMDD.md`
- Use descriptive names that indicate content
- Avoid version suffixes (V2, FINAL) - consolidate instead

#### Step 4: Update Archive Index

Add entry to the appropriate `README.md` in the archive directory:

```markdown
### Token Validation Implementation (2025-01-04)
**Status**: ✅ Resolved  
**Impact**: Critical - Fixed empty data on native platforms  
**Document**: [token-validation-fix.md](./token-validation-fix.md)

**Summary**: Implemented proactive token validation on app launch to prevent expired tokens from causing empty data displays.

**Related Documents**:
- [Design: Authentication Flow](../../../design-documentation/features/authentication/)
- [Troubleshooting: Token Issues](../../troubleshooting/authentication-issues.md)
```

**Index Entry Format:**
- Title with date
- Status indicator (✅ Resolved, 🚧 In Progress, ⚠️ Deprecated)
- Impact level
- Link to document
- Brief summary (2-3 sentences)
- Related documents with relative links

#### Step 5: Update Cross-References

Update any documents that reference the archived document:

1. **Update active troubleshooting guides**:
   ```markdown
   For historical context, see [Token Validation Fix](../archives/2025/01-january/token-validation-fix.md)
   ```

2. **Update design documentation** (if applicable):
   ```markdown
   Implementation: [Token Validation](../../docs/archives/2025/01-january/token-validation-fix.md)
   ```

3. **Update component documentation**:
   ```markdown
   Historical fixes: [Authentication Fixes](../../docs/archives/fixes/authentication/)
   ```

#### Step 6: Verify Links

Run link validation to ensure all references work:

```bash
# Use the validation script
python .kiro/specs/documentation-cleanup/scripts/validate-link-integrity.py
```

Fix any broken links before committing.

## Consolidation Process for Duplicates

### Identifying Duplicates

Duplicates are documents with:
- >80% content similarity
- Same feature/fix with version suffixes (V2, FINAL, etc.)
- Multiple reports on the same topic from different dates

### Step-by-Step Consolidation

#### Step 1: Identify All Versions

List all documents related to the same feature/fix:

```bash
# Example: Finding design system reports
find . -name "*DESIGN_SYSTEM*" -type f
```

Output might show:
- `DESIGN_SYSTEM_FIX_VALIDATION_REPORT.md`
- `DESIGN_SYSTEM_FIX_VALIDATION_REPORT_V2.md`
- `DESIGN_SYSTEM_COMPLIANCE_AUDIT_REPORT.md`
- `DESIGN_SYSTEM_COMPLIANCE_IMPLEMENTATION_REPORT.md`

#### Step 2: Determine Most Comprehensive Version

Review each document and identify:
- Most recent version (usually has latest information)
- Most comprehensive version (has all details)
- Unique content in each version

#### Step 3: Create Consolidated Document

Create a new consolidated document that:
- Merges unique content from all versions
- Includes a version history section
- References archived versions
- Has clear metadata

**Template Structure:**

```markdown
---
title: "Design System Compliance Implementation"
date: 2025-01-05
category: "design-system"
status: "resolved"
versions:
  - v1: "Initial audit - 2025-01-03"
  - v2: "Implementation - 2025-01-04"
  - v3: "Final validation - 2025-01-05"
---

# Design System Compliance Implementation

## Overview
[Consolidated overview from all versions]

## Implementation Details
[Merged implementation details]

## Validation Results
[Consolidated validation results]

## Version History

### Version 3 (Final) - 2025-01-05
- **This is the authoritative version**
- Consolidated from V1 and V2
- Added final validation results
- Preserved all unique content

### Version 2 - 2025-01-04
- Archived: [design-system-implementation-v2.md](./archived/design-system-implementation-v2.md)
- Unique content: Enhanced validation section

### Version 1 - 2025-01-03
- Archived: [design-system-audit-v1.md](./archived/design-system-audit-v1.md)
- Unique content: Initial audit findings

## Related Documents
- [Design System Documentation](../../../design-documentation/design-system/)
- [Frontend Archives](../../../NestSync-frontend/docs/archives/)
```

#### Step 4: Archive Older Versions

Move older versions to an `archived/` subdirectory:

```bash
mkdir -p docs/archives/implementation-reports/design-system/archived/
mv DESIGN_SYSTEM_FIX_VALIDATION_REPORT.md \
   docs/archives/implementation-reports/design-system/archived/design-system-validation-v1.md
```

#### Step 5: Update References

Update all documents that reference the old versions to point to the consolidated document.

## Index Update Process

### When to Update Indexes

Update indexes when:
- Adding new archived documents
- Consolidating duplicate documents
- Reorganizing archive categories
- Adding new cross-references

### Index Structure

Each archive directory should have a `README.md` with:

1. **Overview Section**: Brief description of what's archived
2. **Navigation Section**: Links organized by date and topic
3. **Document Entries**: Detailed entries for each document
4. **Quick Reference**: Most referenced documents
5. **Priority-Based Navigation**: P0, P1, P2 categorization

### Example Index Template

```markdown
# [Category] Archive

## Overview
Brief description of what's archived here and why.

## Navigation

### By Date
- [January 2025](./2025/01-january/) - X documents
- [February 2025](./2025/02-february/) - X documents

### By Topic
- [Authentication Fixes](#authentication-fixes)
- [Payment System](#payment-system)
- [UI/UX Improvements](#uiux-improvements)

## Authentication Fixes

### Token Validation Implementation (2025-01-04)
**Status**: ✅ Resolved  
**Impact**: Critical - Fixed empty data on native platforms  
**Document**: [token-validation-fix.md](./2025/01-january/token-validation-fix.md)

**Summary**: Implemented proactive token validation on app launch.

**Related Documents**:
- [Design: Authentication Flow](../../design-documentation/features/authentication/)
- [Troubleshooting: Token Issues](../troubleshooting/authentication-issues.md)

---

## Quick Reference

### Most Referenced Documents
1. [Token Validation Fix](./2025/01-january/token-validation-fix.md) - Authentication
2. [Payment Blocker Fix](./2025/01-january/payment-blocker-fix.md) - Revenue Critical

### By Priority
- **P0 Critical**: [List of P0 fixes]
- **P1 High**: [List of P1 fixes]
- **P2 Medium**: [List of P2 fixes]
```

### Updating Master Indexes

When adding new archives, update these master indexes:

1. **`/docs/archives/README.md`** - Master archive index
2. **`/docs/README.md`** - Main documentation index
3. **Component-specific indexes**:
   - `/NestSync-backend/docs/archives/README.md`
   - `/NestSync-frontend/docs/archives/README.md`

## Best Practices

### Documentation Writing

1. **Be Concise**: Get to the point quickly
2. **Use Clear Headings**: Make content scannable
3. **Include Examples**: Show, don't just tell
4. **Add Context**: Explain why, not just what
5. **Cross-Reference**: Link to related documents

### Link Management

1. **Use Relative Paths**: Never use absolute URLs for internal docs
2. **Test Links**: Validate before committing
3. **Update References**: When moving files, update all references
4. **Descriptive Text**: Use meaningful link text, not "click here"

### Metadata Management

1. **Always Add Frontmatter**: Required for archived documents
2. **Use Consistent Tags**: Maintain a tag vocabulary
3. **Update Status**: Keep status fields current
4. **Date Everything**: Include dates for temporal context

### Archive Organization

1. **Chronological First**: Use year/month for time-sensitive docs
2. **Category Second**: Use category folders for thematic grouping
3. **Index Everything**: Every directory needs a README.md
4. **Preserve Context**: Include related documents in cross-references

## Validation Checklist

Before committing documentation changes:

- [ ] All archived documents have metadata frontmatter
- [ ] Archive indexes are updated with new entries
- [ ] Cross-references use relative paths
- [ ] Links are validated and working
- [ ] Duplicate content is consolidated
- [ ] Version history is documented
- [ ] Related documents are cross-referenced
- [ ] Master indexes are updated
- [ ] Naming conventions are followed
- [ ] Files are in correct directories

## Tools and Scripts

### Validation Scripts

Located in `.kiro/specs/documentation-cleanup/scripts/`:

- **`validate-link-integrity.py`** - Check for broken links
- **`validate-archive-structure.py`** - Verify archive organization
- **`validate-content-consolidation.py`** - Find duplicates
- **`validate-design-authority.py`** - Ensure design docs are authoritative
- **`validate-compliance-docs.py`** - Verify compliance docs are active

### Running Validation

```bash
# Validate all documentation
cd .kiro/specs/documentation-cleanup/scripts/
python validate-link-integrity.py
python validate-archive-structure.py
python validate-content-consolidation.py

# View validation reports
cat ../validation-reports/validation-summary.md
```

## Common Scenarios

### Scenario 1: New Implementation Report

**Situation**: Just completed a feature implementation and have a report.

**Steps**:
1. Add metadata frontmatter to the report
2. Determine if it's time-sensitive or feature-specific
3. Move to appropriate archive directory
4. Update archive index with entry
5. Add cross-references to design docs
6. Validate links

### Scenario 2: Multiple Test Reports

**Situation**: Have several test reports from the same testing session.

**Steps**:
1. Consolidate if they cover the same functionality
2. Move to `/docs/archives/test-reports/[type]/`
3. Use date suffix in filename
4. Update test reports index
5. Link to related implementation reports

### Scenario 3: Duplicate Documentation

**Situation**: Found multiple documents describing the same feature.

**Steps**:
1. Identify all versions
2. Determine most comprehensive version
3. Create consolidated document with version history
4. Archive older versions in `archived/` subdirectory
5. Update all references to point to consolidated doc
6. Update indexes

### Scenario 4: Outdated Troubleshooting Guide

**Situation**: A troubleshooting guide is no longer relevant.

**Steps**:
1. Determine if it should be archived or deleted
2. If archived, add to `/docs/archives/troubleshooting/`
3. Update main troubleshooting index to remove entry
4. Add note in archive about why it's no longer relevant
5. Update cross-references

## Maintenance Schedule

### Weekly
- Review new documentation for proper organization
- Check for broken links in recently updated docs
- Update indexes for new archives

### Monthly
- Run full validation suite
- Review duplicate detection reports
- Consolidate similar documents
- Update master indexes

### Quarterly
- Review archive organization
- Identify documentation gaps
- Update documentation guide if needed
- Clean up orphaned documents

## Getting Help

### Questions About Documentation

- **Structure Questions**: Refer to this guide
- **Archive Decisions**: Check with team lead
- **Link Issues**: Run validation scripts
- **Consolidation Questions**: Review design document

### Reporting Issues

If you find documentation issues:
1. Check validation reports first
2. Create an issue with specific details
3. Tag with `documentation` label
4. Include links to affected documents

---

**Last Updated**: 2025-11-08  
**Maintained By**: Development Team  
**Related Documents**:
- [Main Documentation Index](./README.md)
- [Archive Index](./archives/README.md)
- [Design Documentation](../design-documentation/README.md)
