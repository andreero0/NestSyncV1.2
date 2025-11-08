---
inclusion: always
priority: high
---

# Documentation Standards for AI Agents

## Core Principles

### 1. Design Documentation is Authoritative
- **Location**: `/design-documentation/`
- **Rule**: NEVER modify or archive design documentation
- **Action**: Reference design docs in implementation reports, never override them

### 2. Compliance Documentation is Always Active
- **Location**: `/docs/compliance/`
- **Rule**: NEVER archive compliance documentation
- **Action**: Update compliance docs when regulations change, keep them current

### 3. Archives Preserve History
- **Location**: `/docs/archives/`
- **Rule**: All historical implementation reports, test reports, and fix reports go here
- **Action**: Add metadata frontmatter and update indexes when archiving

## When Creating New Documentation

### Implementation Reports
**Location**: Archive immediately after completion
- `/docs/archives/implementation-reports/[feature-name]/`
- Component-specific: `/NestSync-[backend|frontend]/docs/archives/implementation-reports/`

**Required Actions**:
1. Add YAML frontmatter with title, date, category, status
2. Create or update README.md in the archive directory
3. Add cross-references to related design docs
4. Use relative paths for all internal links

### Test Reports
**Location**: `/docs/archives/test-reports/[type]/`
- Types: `e2e/`, `integration/`, `visual/`, `compliance/`, `performance/`

**Required Actions**:
1. Add date suffix to filename: `report-name-YYYYMMDD.md`
2. Include metadata frontmatter
3. Update test reports index
4. Link to related implementation reports

### Bug Fix Reports
**Location**: `/docs/archives/fixes/[category]/`
- Categories: `authentication/`, `ui-ux/`, `notifications/`, `compliance/`, `data-integrity/`, `integration/`, `performance/`

**Required Actions**:
1. Add metadata with priority (P0-P3) and status
2. Update fixes index
3. Cross-reference to troubleshooting guides
4. Include platforms affected

### Time-Sensitive Reports
**Location**: `/docs/archives/YYYY/MM-month/`
- Use for urgent fixes and time-critical reports

**Required Actions**:
1. Create monthly directory if it doesn't exist
2. Update monthly README.md
3. Add to master archive index
4. Include date in metadata

## Required Metadata Frontmatter

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

## File Naming Conventions

- Use kebab-case: `token-validation-fix.md`
- Include dates for test reports: `payment-flow-test-20250104.md`
- Avoid version suffixes: consolidate instead of creating V2, V3, FINAL
- Be descriptive: `pipeda-cache-isolation-fix.md` not `fix-report.md`

## Archive Index Updates

Every archive directory MUST have a `README.md` with:

1. **Overview**: What's archived and why
2. **Navigation**: By date and topic
3. **Document Entries**: Title, status, impact, summary, links
4. **Quick Reference**: Most referenced documents

**Entry Format**:
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

## Link Management Rules

1. **Always use relative paths**: `../../docs/archives/file.md`
2. **Never use absolute URLs** for internal documentation
3. **Test links** before committing
4. **Update all references** when moving files
5. **Use descriptive link text**: `[Token Validation Fix](...)` not `[click here](...)`

## Consolidation Rules

### When to Consolidate

Consolidate when you find:
- Multiple documents with >80% similar content
- Same feature with version suffixes (V2, FINAL, etc.)
- Multiple reports on same topic from different dates

### How to Consolidate

1. **Identify all versions** of the document
2. **Create consolidated document** with all unique content
3. **Add version history section** documenting what was merged
4. **Move older versions** to `archived/` subdirectory
5. **Update all references** to point to consolidated doc
6. **Update indexes** to reflect consolidation

## What NOT to Archive

- Active troubleshooting guides
- Current setup instructions
- Design documentation (NEVER)
- Compliance documentation (NEVER)
- Architecture documentation still in use
- API documentation for current APIs
- Deployment guides for active environments

## Validation Before Committing

Run these checks:
```bash
# Check for broken links
python .kiro/specs/documentation-cleanup/scripts/validate-link-integrity.py

# Verify archive structure
python .kiro/specs/documentation-cleanup/scripts/validate-archive-structure.py

# Check for duplicates
python .kiro/specs/documentation-cleanup/scripts/validate-content-consolidation.py
```

## Quick Decision Tree

**Creating new documentation?**
- Is it design documentation? → `/design-documentation/`
- Is it compliance? → `/docs/compliance/`
- Is it active troubleshooting? → `/docs/troubleshooting/`
- Is it active setup/deployment? → `/docs/[infrastructure|setup]/`
- Is it implementation report? → Archive it
- Is it test report? → Archive it
- Is it bug fix report? → Archive it

**Archiving documentation?**
- Add metadata frontmatter ✓
- Choose correct archive directory ✓
- Update archive index ✓
- Add cross-references ✓
- Use relative paths ✓
- Validate links ✓

**Found duplicate documentation?**
- Identify all versions ✓
- Create consolidated document ✓
- Add version history ✓
- Archive older versions ✓
- Update references ✓
- Update indexes ✓

## Common Mistakes to Avoid

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

## Master Index Locations

Update these when adding new archives:
- `/docs/README.md` - Main documentation index
- `/docs/archives/README.md` - Master archive index
- `/NestSync-backend/docs/README.md` - Backend documentation index
- `/NestSync-backend/docs/archives/README.md` - Backend archive index
- `/NestSync-frontend/docs/README.md` - Frontend documentation index
- `/NestSync-frontend/docs/archives/README.md` - Frontend archive index

## Example Workflow

### Archiving an Implementation Report

```bash
# 1. Add metadata frontmatter to the document
# 2. Move to archive
mv NestSync-frontend/FEATURE_IMPLEMENTATION.md \
   NestSync-frontend/docs/archives/implementation-reports/feature-name/implementation.md

# 3. Update archive README
# Add entry to NestSync-frontend/docs/archives/implementation-reports/feature-name/README.md

# 4. Update master indexes
# Add reference in NestSync-frontend/docs/archives/README.md

# 5. Validate
python .kiro/specs/documentation-cleanup/scripts/validate-link-integrity.py
```

### Consolidating Duplicate Reports

```bash
# 1. Identify all versions
find . -name "*FEATURE*REPORT*"

# 2. Create consolidated document with version history
# 3. Move older versions to archived/ subdirectory
mkdir -p docs/archives/implementation-reports/feature/archived/
mv OLD_VERSION.md docs/archives/implementation-reports/feature/archived/

# 4. Update all references to point to consolidated doc
# 5. Update indexes
# 6. Validate
python .kiro/specs/documentation-cleanup/scripts/validate-content-consolidation.py
```

## Reference Documents

For detailed guidance, see:
- [Documentation Guide](../../docs/DOCUMENTATION_GUIDE.md) - Comprehensive guide
- [Archive Index](../../docs/archives/README.md) - Master archive index
- [Design Documentation](../../design-documentation/README.md) - Design authority

---

**Last Updated**: 2025-11-08  
**Purpose**: Guide AI agents on documentation standards  
**Scope**: All documentation creation, archiving, and maintenance
