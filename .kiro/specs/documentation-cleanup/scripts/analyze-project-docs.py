#!/usr/bin/env python3
"""
Analyze actual project documentation (excluding backups and analysis files)
"""

import json
from pathlib import Path
from collections import defaultdict

WORKSPACE_ROOT = Path(__file__).parent.parent.parent.parent
ANALYSIS_DIR = Path(__file__).parent.parent / "analysis"

def load_inventory():
    """Load the inventory file"""
    inventory_file = ANALYSIS_DIR / "inventory.json"
    with open(inventory_file, 'r') as f:
        data = json.load(f)
    return data['files']

def filter_project_docs(inventory):
    """Filter to only actual project documentation"""
    excluded_patterns = [
        'backup/',
        'analysis/',
        'node_modules/',
        'venv/',
        '.git/',
        '__pycache__/',
        '.pytest_cache/',
        '.expo/',
        'test-results/',
        'playwright-report/',
        'traces/'
    ]
    
    project_docs = []
    for doc in inventory:
        path = doc['path']
        if not any(pattern in path for pattern in excluded_patterns):
            project_docs.append(doc)
    
    return project_docs

def analyze_by_location(docs):
    """Analyze documentation by location"""
    locations = {
        'root': [],
        'docs': [],
        'design-documentation': [],
        'project-documentation': [],
        'backend': [],
        'frontend': [],
        'specs': [],
        'other': []
    }
    
    for doc in docs:
        path = doc['path']
        if '/' not in path:
            locations['root'].append(doc)
        elif path.startswith('docs/'):
            locations['docs'].append(doc)
        elif path.startswith('design-documentation/'):
            locations['design-documentation'].append(doc)
        elif path.startswith('project-documentation/'):
            locations['project-documentation'].append(doc)
        elif path.startswith('NestSync-backend/'):
            locations['backend'].append(doc)
        elif path.startswith('NestSync-frontend/'):
            locations['frontend'].append(doc)
        elif path.startswith('specs/') or path.startswith('.kiro/specs/'):
            locations['specs'].append(doc)
        else:
            locations['other'].append(doc)
    
    return locations

def identify_migration_candidates(docs):
    """Identify files that should be migrated"""
    candidates = {
        'root_reports': [],
        'backend_reports': [],
        'frontend_reports': [],
        'test_reports': [],
        'fix_reports': [],
        'compliance_docs': []
    }
    
    for doc in docs:
        path = doc['path']
        filename = Path(path).name.upper()
        
        # Root-level implementation/fix reports
        if '/' not in path and any(kw in filename for kw in ['FIX', 'IMPLEMENTATION', 'REPORT', 'STATUS']):
            candidates['root_reports'].append(doc)
        
        # Backend reports
        elif path.startswith('NestSync-backend/') and not path.startswith('NestSync-backend/docs/'):
            if any(kw in filename for kw in ['IMPLEMENTATION', 'REPORT', 'STATUS', 'COMPLETE', 'GUIDE']):
                candidates['backend_reports'].append(doc)
        
        # Frontend reports
        elif path.startswith('NestSync-frontend/') and not path.startswith('NestSync-frontend/docs/'):
            if 'TEST' in filename and 'REPORT' in filename:
                candidates['test_reports'].append(doc)
            elif 'FIX' in filename:
                candidates['fix_reports'].append(doc)
            elif any(kw in filename for kw in ['IMPLEMENTATION', 'REPORT', 'STATUS', 'COMPLETE']):
                candidates['frontend_reports'].append(doc)
        
        # Compliance docs
        elif 'PIPEDA' in filename or 'COMPLIANCE' in filename:
            candidates['compliance_docs'].append(doc)
    
    return candidates

def generate_project_summary():
    """Generate summary of actual project documentation"""
    print("Analyzing project documentation (excluding backups)...")
    
    # Load and filter inventory
    all_docs = load_inventory()
    project_docs = filter_project_docs(all_docs)
    
    print(f"Total files in inventory: {len(all_docs)}")
    print(f"Project documentation files: {len(project_docs)}")
    
    # Analyze by location
    locations = analyze_by_location(project_docs)
    
    # Identify migration candidates
    candidates = identify_migration_candidates(project_docs)
    
    # Generate report
    report = f"""# Project Documentation Analysis

**Analysis Date**: 2025-11-08
**Total Project Documentation Files**: {len(project_docs)}
**Files Excluded** (backups, analysis, node_modules, etc.): {len(all_docs) - len(project_docs)}

## Documentation Distribution

| Location | Count | Total Size |
|----------|-------|------------|
| Root Level | {len(locations['root'])} | {sum(d['size_bytes'] for d in locations['root']) / 1024:.1f} KB |
| /docs/ | {len(locations['docs'])} | {sum(d['size_bytes'] for d in locations['docs']) / 1024:.1f} KB |
| /design-documentation/ | {len(locations['design-documentation'])} | {sum(d['size_bytes'] for d in locations['design-documentation']) / 1024:.1f} KB |
| /project-documentation/ | {len(locations['project-documentation'])} | {sum(d['size_bytes'] for d in locations['project-documentation']) / 1024:.1f} KB |
| NestSync-backend/ | {len(locations['backend'])} | {sum(d['size_bytes'] for d in locations['backend']) / 1024:.1f} KB |
| NestSync-frontend/ | {len(locations['frontend'])} | {sum(d['size_bytes'] for d in locations['frontend']) / 1024:.1f} KB |
| /specs/ | {len(locations['specs'])} | {sum(d['size_bytes'] for d in locations['specs']) / 1024:.1f} KB |
| Other | {len(locations['other'])} | {sum(d['size_bytes'] for d in locations['other']) / 1024:.1f} KB |

## Migration Candidates

### Root-Level Reports ({len(candidates['root_reports'])} files)
These should be moved to `docs/archives/2025/01-january/`:

"""
    
    for doc in candidates['root_reports']:
        report += f"- `{doc['path']}` ({doc['size_bytes'] / 1024:.1f} KB)\n"
    
    report += f"""
### Backend Reports ({len(candidates['backend_reports'])} files)
These should be moved to `NestSync-backend/docs/archives/`:

"""
    
    for doc in candidates['backend_reports'][:10]:
        report += f"- `{doc['path']}` ({doc['size_bytes'] / 1024:.1f} KB)\n"
    
    if len(candidates['backend_reports']) > 10:
        report += f"... and {len(candidates['backend_reports']) - 10} more\n"
    
    report += f"""
### Frontend Reports ({len(candidates['frontend_reports'])} files)
These should be moved to `NestSync-frontend/docs/archives/`:

"""
    
    for doc in candidates['frontend_reports'][:10]:
        report += f"- `{doc['path']}` ({doc['size_bytes'] / 1024:.1f} KB)\n"
    
    if len(candidates['frontend_reports']) > 10:
        report += f"... and {len(candidates['frontend_reports']) - 10} more\n"
    
    report += f"""
### Test Reports ({len(candidates['test_reports'])} files)
These should be moved to `docs/archives/test-reports/`:

"""
    
    for doc in candidates['test_reports'][:10]:
        report += f"- `{doc['path']}` ({doc['size_bytes'] / 1024:.1f} KB)\n"
    
    if len(candidates['test_reports']) > 10:
        report += f"... and {len(candidates['test_reports']) - 10} more\n"
    
    report += f"""
### Fix Reports ({len(candidates['fix_reports'])} files)
These should be moved to `docs/archives/fixes/`:

"""
    
    for doc in candidates['fix_reports'][:10]:
        report += f"- `{doc['path']}` ({doc['size_bytes'] / 1024:.1f} KB)\n"
    
    if len(candidates['fix_reports']) > 10:
        report += f"... and {len(candidates['fix_reports']) - 10} more\n"
    
    report += f"""
### Compliance Documentation ({len(candidates['compliance_docs'])} files)
These should be moved to `docs/compliance/`:

"""
    
    for doc in candidates['compliance_docs']:
        report += f"- `{doc['path']}` ({doc['size_bytes'] / 1024:.1f} KB)\n"
    
    report += f"""
## Root-Level Files

Current root-level markdown files:

"""
    
    for doc in sorted(locations['root'], key=lambda x: x['path']):
        report += f"- `{doc['path']}` ({doc['size_bytes'] / 1024:.1f} KB, {doc['line_count']} lines)\n"
    
    report += """
## Recommendations

1. **Immediate Actions**:
   - Move {root_count} root-level reports to archives
   - Create archive directory structure
   - Begin with high-priority migrations

2. **Backend Cleanup**:
   - Consolidate {backend_count} backend reports
   - Create `NestSync-backend/docs/` structure
   - Move deployment guides to proper location

3. **Frontend Cleanup**:
   - Consolidate {frontend_count} frontend reports
   - Merge duplicate design system reports
   - Organize test reports by type

4. **Compliance Organization**:
   - Create `docs/compliance/` directory
   - Move {compliance_count} compliance documents
   - Ensure audit trail is preserved

## Next Steps

1. Review this analysis
2. Create archive directory structure (Task 2)
3. Begin root-level migrations (Task 3)
4. Proceed with component-specific migrations (Tasks 4-5)

""".format(
        root_count=len(candidates['root_reports']),
        backend_count=len(candidates['backend_reports']),
        frontend_count=len(candidates['frontend_reports']),
        compliance_count=len(candidates['compliance_docs'])
    )
    
    # Save report
    output_file = ANALYSIS_DIR / "PROJECT_ANALYSIS.md"
    output_file.write_text(report)
    
    print(f"\n✓ Project analysis saved: {output_file}")
    print(f"\nKey Findings:")
    print(f"  - Root-level reports to migrate: {len(candidates['root_reports'])}")
    print(f"  - Backend reports to organize: {len(candidates['backend_reports'])}")
    print(f"  - Frontend reports to organize: {len(candidates['frontend_reports'])}")
    print(f"  - Test reports to archive: {len(candidates['test_reports'])}")
    print(f"  - Fix reports to archive: {len(candidates['fix_reports'])}")
    print(f"  - Compliance docs to organize: {len(candidates['compliance_docs'])}")
    
    return report

if __name__ == "__main__":
    generate_project_summary()
