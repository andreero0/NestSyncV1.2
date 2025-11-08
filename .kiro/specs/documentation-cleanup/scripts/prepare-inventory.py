#!/usr/bin/env python3
"""
Documentation Inventory and Analysis Script
Generates comprehensive inventory of all markdown files with metadata,
duplicate detection, and cross-reference mapping.
"""

import os
import hashlib
import json
import re
from pathlib import Path
from datetime import datetime
from collections import defaultdict
from difflib import SequenceMatcher

# Configuration
WORKSPACE_ROOT = Path(__file__).parent.parent.parent.parent
BACKUP_DIR = WORKSPACE_ROOT / ".kiro/specs/documentation-cleanup/backup"
ANALYSIS_DIR = WORKSPACE_ROOT / ".kiro/specs/documentation-cleanup/analysis"
SIMILARITY_THRESHOLD = 0.80

def create_backup():
    """Create complete backup of documentation structure"""
    print("Creating backup of documentation structure...")
    backup_timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = BACKUP_DIR / backup_timestamp
    backup_path.mkdir(parents=True, exist_ok=True)
    
    # Find all markdown files
    md_files = list(WORKSPACE_ROOT.rglob("*.md"))
    
    backup_manifest = []
    for md_file in md_files:
        if ".git" in str(md_file) or "node_modules" in str(md_file) or "venv" in str(md_file):
            continue
            
        relative_path = md_file.relative_to(WORKSPACE_ROOT)
        backup_file = backup_path / relative_path
        backup_file.parent.mkdir(parents=True, exist_ok=True)
        
        # Copy file
        backup_file.write_bytes(md_file.read_bytes())
        backup_manifest.append(str(relative_path))
    
    # Save manifest
    manifest_file = backup_path / "MANIFEST.json"
    manifest_file.write_text(json.dumps({
        "timestamp": backup_timestamp,
        "total_files": len(backup_manifest),
        "files": sorted(backup_manifest)
    }, indent=2))
    
    print(f"✓ Backup created: {backup_path}")
    print(f"✓ Backed up {len(backup_manifest)} markdown files")
    return backup_path

def calculate_file_hash(file_path):
    """Calculate SHA256 hash of file content"""
    return hashlib.sha256(file_path.read_bytes()).hexdigest()

def extract_content_for_comparison(content):
    """Extract meaningful content for similarity comparison"""
    # Remove frontmatter
    content = re.sub(r'^---\n.*?\n---\n', '', content, flags=re.DOTALL)
    # Remove code blocks
    content = re.sub(r'```.*?```', '', content, flags=re.DOTALL)
    # Remove links but keep text
    content = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', content)
    # Remove images
    content = re.sub(r'!\[.*?\]\(.*?\)', '', content)
    # Normalize whitespace
    content = ' '.join(content.split())
    return content.lower()

def calculate_similarity(content1, content2):
    """Calculate similarity ratio between two text contents"""
    text1 = extract_content_for_comparison(content1)
    text2 = extract_content_for_comparison(content2)
    return SequenceMatcher(None, text1, text2).ratio()

def generate_inventory():
    """Generate file inventory with metadata"""
    print("\nGenerating file inventory...")
    ANALYSIS_DIR.mkdir(parents=True, exist_ok=True)
    
    inventory = []
    md_files = list(WORKSPACE_ROOT.rglob("*.md"))
    
    for md_file in md_files:
        if ".git" in str(md_file) or "node_modules" in str(md_file) or "venv" in str(md_file):
            continue
        
        try:
            relative_path = str(md_file.relative_to(WORKSPACE_ROOT))
            stat = md_file.stat()
            content = md_file.read_text(encoding='utf-8', errors='ignore')
            
            # Extract metadata
            file_info = {
                "path": relative_path,
                "size_bytes": stat.st_size,
                "modified_date": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                "content_hash": calculate_file_hash(md_file),
                "line_count": len(content.splitlines()),
                "word_count": len(content.split()),
                "has_frontmatter": content.startswith("---\n"),
                "heading_count": len(re.findall(r'^#+\s', content, re.MULTILINE)),
                "link_count": len(re.findall(r'\[([^\]]+)\]\(([^\)]+)\)', content)),
                "code_block_count": len(re.findall(r'```', content)) // 2,
            }
            
            inventory.append(file_info)
        except Exception as e:
            print(f"Warning: Could not process {md_file}: {e}")
    
    # Save inventory
    inventory_file = ANALYSIS_DIR / "inventory.json"
    inventory_file.write_text(json.dumps({
        "generated_at": datetime.now().isoformat(),
        "total_files": len(inventory),
        "files": sorted(inventory, key=lambda x: x["path"])
    }, indent=2))
    
    print(f"✓ Inventory generated: {inventory_file}")
    print(f"✓ Catalogued {len(inventory)} markdown files")
    return inventory

def detect_duplicates(inventory):
    """Detect duplicate and similar documents"""
    print("\nDetecting duplicate content...")
    
    # Group by content hash for exact duplicates
    hash_groups = defaultdict(list)
    for file_info in inventory:
        hash_groups[file_info["content_hash"]].append(file_info["path"])
    
    exact_duplicates = {hash_val: paths for hash_val, paths in hash_groups.items() if len(paths) > 1}
    
    # Check for similar content (>80% similarity)
    similar_groups = []
    processed_pairs = set()
    
    files_to_compare = [f for f in inventory if f["size_bytes"] > 1000]  # Only compare substantial files
    
    for i, file1 in enumerate(files_to_compare):
        if i % 50 == 0:
            print(f"  Comparing file {i+1}/{len(files_to_compare)}...")
        
        try:
            content1 = (WORKSPACE_ROOT / file1["path"]).read_text(encoding='utf-8', errors='ignore')
        except:
            continue
            
        for file2 in files_to_compare[i+1:]:
            pair_key = tuple(sorted([file1["path"], file2["path"]]))
            if pair_key in processed_pairs:
                continue
            
            # Skip if files are very different in size
            size_ratio = min(file1["size_bytes"], file2["size_bytes"]) / max(file1["size_bytes"], file2["size_bytes"])
            if size_ratio < 0.5:
                continue
            
            try:
                content2 = (WORKSPACE_ROOT / file2["path"]).read_text(encoding='utf-8', errors='ignore')
                similarity = calculate_similarity(content1, content2)
                
                if similarity >= SIMILARITY_THRESHOLD:
                    similar_groups.append({
                        "files": [file1["path"], file2["path"]],
                        "similarity": round(similarity, 3),
                        "sizes": [file1["size_bytes"], file2["size_bytes"]]
                    })
                    processed_pairs.add(pair_key)
            except:
                continue
    
    # Save duplicate analysis
    duplicates_file = ANALYSIS_DIR / "duplicates.json"
    duplicates_file.write_text(json.dumps({
        "generated_at": datetime.now().isoformat(),
        "exact_duplicates": [{"hash": h, "files": f} for h, f in exact_duplicates.items()],
        "similar_documents": sorted(similar_groups, key=lambda x: x["similarity"], reverse=True),
        "summary": {
            "exact_duplicate_groups": len(exact_duplicates),
            "similar_document_pairs": len(similar_groups),
            "total_duplicate_files": sum(len(f) for f in exact_duplicates.values())
        }
    }, indent=2))
    
    print(f"✓ Duplicate analysis saved: {duplicates_file}")
    print(f"✓ Found {len(exact_duplicates)} exact duplicate groups")
    print(f"✓ Found {len(similar_groups)} similar document pairs (>{SIMILARITY_THRESHOLD*100}% similar)")
    return exact_duplicates, similar_groups

def map_cross_references(inventory):
    """Map cross-references between markdown files"""
    print("\nMapping cross-references...")
    
    cross_refs = {}
    link_pattern = re.compile(r'\[([^\]]+)\]\(([^\)]+)\)')
    
    for file_info in inventory:
        file_path = WORKSPACE_ROOT / file_info["path"]
        try:
            content = file_path.read_text(encoding='utf-8', errors='ignore')
            links = link_pattern.findall(content)
            
            internal_links = []
            external_links = []
            
            for link_text, link_url in links:
                # Skip external URLs
                if link_url.startswith(('http://', 'https://', 'mailto:', '#')):
                    external_links.append({"text": link_text, "url": link_url})
                    continue
                
                # Resolve relative path
                try:
                    if link_url.startswith('/'):
                        target_path = WORKSPACE_ROOT / link_url.lstrip('/')
                    else:
                        target_path = (file_path.parent / link_url).resolve()
                    
                    if target_path.exists() and target_path.suffix == '.md':
                        relative_target = str(target_path.relative_to(WORKSPACE_ROOT))
                        internal_links.append({
                            "text": link_text,
                            "target": relative_target,
                            "exists": True
                        })
                    else:
                        internal_links.append({
                            "text": link_text,
                            "target": link_url,
                            "exists": False
                        })
                except:
                    internal_links.append({
                        "text": link_text,
                        "target": link_url,
                        "exists": False
                    })
            
            cross_refs[file_info["path"]] = {
                "internal_links": internal_links,
                "external_links": external_links,
                "total_internal": len(internal_links),
                "total_external": len(external_links),
                "broken_links": sum(1 for link in internal_links if not link["exists"])
            }
        except Exception as e:
            print(f"Warning: Could not process links in {file_info['path']}: {e}")
    
    # Save cross-reference map
    cross_refs_file = ANALYSIS_DIR / "cross-references.json"
    cross_refs_file.write_text(json.dumps({
        "generated_at": datetime.now().isoformat(),
        "files": cross_refs,
        "summary": {
            "total_files": len(cross_refs),
            "total_internal_links": sum(f["total_internal"] for f in cross_refs.values()),
            "total_external_links": sum(f["total_external"] for f in cross_refs.values()),
            "total_broken_links": sum(f["broken_links"] for f in cross_refs.values())
        }
    }, indent=2))
    
    print(f"✓ Cross-reference map saved: {cross_refs_file}")
    print(f"✓ Mapped {sum(f['total_internal'] for f in cross_refs.values())} internal links")
    print(f"✓ Found {sum(f['broken_links'] for f in cross_refs.values())} broken links")
    return cross_refs

def create_migration_plan(inventory, duplicates, similar_docs, cross_refs):
    """Create migration plan with source → destination mappings"""
    print("\nCreating migration plan...")
    
    migration_plan = []
    
    # Identify root-level implementation reports
    root_reports = [
        f for f in inventory 
        if not '/' in f["path"] and any(keyword in f["path"].upper() for keyword in 
            ["FIX", "IMPLEMENTATION", "REPORT", "STATUS", "COMPLETE"])
    ]
    
    for report in root_reports:
        # Suggest archive location based on filename
        filename = Path(report["path"]).stem
        suggested_dest = f"docs/archives/2025/01-january/{filename.lower().replace('_', '-')}.md"
        
        migration_plan.append({
            "source": report["path"],
            "destination": suggested_dest,
            "reason": "Root-level implementation report",
            "priority": "high",
            "action": "move"
        })
    
    # Identify backend reports
    backend_reports = [
        f for f in inventory 
        if f["path"].startswith("NestSync-backend/") and 
        any(keyword in f["path"].upper() for keyword in 
            ["IMPLEMENTATION", "REPORT", "STATUS", "COMPLETE", "GUIDE"])
        and not f["path"].startswith("NestSync-backend/docs/")
    ]
    
    for report in backend_reports:
        filename = Path(report["path"]).name
        suggested_dest = f"NestSync-backend/docs/archives/implementation-reports/{filename}"
        
        migration_plan.append({
            "source": report["path"],
            "destination": suggested_dest,
            "reason": "Backend implementation report",
            "priority": "medium",
            "action": "move"
        })
    
    # Identify frontend reports
    frontend_reports = [
        f for f in inventory 
        if f["path"].startswith("NestSync-frontend/") and 
        any(keyword in f["path"].upper() for keyword in 
            ["IMPLEMENTATION", "REPORT", "STATUS", "COMPLETE", "FIX", "TEST"])
        and not f["path"].startswith("NestSync-frontend/docs/")
    ]
    
    for report in frontend_reports:
        filename = Path(report["path"]).name
        
        # Categorize by type
        if "TEST" in filename.upper():
            suggested_dest = f"docs/archives/test-reports/integration/{filename}"
        elif "FIX" in filename.upper():
            suggested_dest = f"docs/archives/fixes/ui-ux/{filename}"
        else:
            suggested_dest = f"NestSync-frontend/docs/archives/implementation-reports/{filename}"
        
        migration_plan.append({
            "source": report["path"],
            "destination": suggested_dest,
            "reason": "Frontend implementation/test/fix report",
            "priority": "medium",
            "action": "move"
        })
    
    # Handle similar documents (consolidation candidates)
    for similar_pair in similar_docs[:20]:  # Top 20 most similar
        migration_plan.append({
            "source": similar_pair["files"],
            "destination": "TBD - requires manual review",
            "reason": f"Similar documents ({similar_pair['similarity']*100:.1f}% similar) - consolidation candidate",
            "priority": "review",
            "action": "consolidate"
        })
    
    # Save migration plan
    migration_file = ANALYSIS_DIR / "migration-plan.json"
    migration_file.write_text(json.dumps({
        "generated_at": datetime.now().isoformat(),
        "migrations": migration_plan,
        "summary": {
            "total_migrations": len(migration_plan),
            "high_priority": sum(1 for m in migration_plan if m.get("priority") == "high"),
            "medium_priority": sum(1 for m in migration_plan if m.get("priority") == "medium"),
            "needs_review": sum(1 for m in migration_plan if m.get("priority") == "review")
        }
    }, indent=2))
    
    print(f"✓ Migration plan saved: {migration_file}")
    print(f"✓ Planned {len(migration_plan)} migrations")
    return migration_plan

def generate_summary_report(inventory, duplicates, similar_docs, cross_refs, migration_plan):
    """Generate human-readable summary report"""
    print("\nGenerating summary report...")
    
    report = f"""# Documentation Inventory Analysis Report

Generated: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}

## Executive Summary

- **Total Markdown Files**: {len(inventory)}
- **Total Size**: {sum(f['size_bytes'] for f in inventory) / 1024 / 1024:.2f} MB
- **Exact Duplicate Groups**: {len(duplicates)}
- **Similar Document Pairs**: {len(similar_docs)} (>{SIMILARITY_THRESHOLD*100}% similar)
- **Total Internal Links**: {sum(f['total_internal'] for f in cross_refs.values())}
- **Broken Links**: {sum(f['broken_links'] for f in cross_refs.values())}
- **Planned Migrations**: {len(migration_plan)}

## File Distribution

### By Directory
"""
    
    # Count files by top-level directory
    dir_counts = defaultdict(int)
    for file_info in inventory:
        top_dir = file_info["path"].split('/')[0] if '/' in file_info["path"] else "root"
        dir_counts[top_dir] += 1
    
    for dir_name, count in sorted(dir_counts.items(), key=lambda x: x[1], reverse=True):
        report += f"- **{dir_name}**: {count} files\n"
    
    report += f"""
## Duplicate Analysis

### Exact Duplicates
Found {len(duplicates)} groups of files with identical content.

"""
    
    for i, (hash_val, files) in enumerate(list(duplicates.items())[:10], 1):
        report += f"{i}. {len(files)} identical files:\n"
        for file_path in files:
            report += f"   - `{file_path}`\n"
        report += "\n"
    
    if len(duplicates) > 10:
        report += f"... and {len(duplicates) - 10} more duplicate groups\n\n"
    
    report += f"""### Similar Documents (Top 20)
Found {len(similar_docs)} pairs of documents with >{SIMILARITY_THRESHOLD*100}% content similarity.

"""
    
    for i, similar in enumerate(similar_docs[:20], 1):
        report += f"{i}. **{similar['similarity']*100:.1f}% similar**\n"
        report += f"   - `{similar['files'][0]}`\n"
        report += f"   - `{similar['files'][1]}`\n\n"
    
    report += f"""
## Cross-Reference Analysis

- **Total Internal Links**: {sum(f['total_internal'] for f in cross_refs.values())}
- **Total External Links**: {sum(f['total_external'] for f in cross_refs.values())}
- **Broken Links**: {sum(f['broken_links'] for f in cross_refs.values())}

### Files with Most Broken Links
"""
    
    files_with_broken = [(path, data['broken_links']) for path, data in cross_refs.items() if data['broken_links'] > 0]
    files_with_broken.sort(key=lambda x: x[1], reverse=True)
    
    for file_path, broken_count in files_with_broken[:10]:
        report += f"- `{file_path}`: {broken_count} broken links\n"
    
    report += f"""
## Migration Plan Summary

- **High Priority Migrations**: {sum(1 for m in migration_plan if m.get('priority') == 'high')}
- **Medium Priority Migrations**: {sum(1 for m in migration_plan if m.get('priority') == 'medium')}
- **Needs Manual Review**: {sum(1 for m in migration_plan if m.get('priority') == 'review')}

### High Priority Migrations (Root-level reports)
"""
    
    high_priority = [m for m in migration_plan if m.get('priority') == 'high']
    for migration in high_priority:
        report += f"- `{migration['source']}` → `{migration['destination']}`\n"
    
    report += """
## Next Steps

1. Review migration plan in `migration-plan.json`
2. Validate suggested destinations for accuracy
3. Begin with high-priority migrations (root-level reports)
4. Address duplicate and similar documents
5. Fix broken links during migration
6. Create archive indexes as files are moved

## Data Files Generated

- `backup/[timestamp]/` - Complete backup of all markdown files
- `analysis/inventory.json` - Complete file inventory with metadata
- `analysis/duplicates.json` - Duplicate and similar document analysis
- `analysis/cross-references.json` - Cross-reference and link mapping
- `analysis/migration-plan.json` - Suggested migration mappings
- `analysis/SUMMARY.md` - This report

"""
    
    summary_file = ANALYSIS_DIR / "SUMMARY.md"
    summary_file.write_text(report)
    
    print(f"✓ Summary report saved: {summary_file}")
    return report

def main():
    """Main execution function"""
    print("=" * 70)
    print("Documentation Inventory and Analysis")
    print("=" * 70)
    
    # Step 1: Create backup
    backup_path = create_backup()
    
    # Step 2: Generate inventory
    inventory = generate_inventory()
    
    # Step 3: Detect duplicates
    exact_duplicates, similar_docs = detect_duplicates(inventory)
    
    # Step 4: Map cross-references
    cross_refs = map_cross_references(inventory)
    
    # Step 5: Create migration plan
    migration_plan = create_migration_plan(inventory, exact_duplicates, similar_docs, cross_refs)
    
    # Step 6: Generate summary report
    summary = generate_summary_report(inventory, exact_duplicates, similar_docs, cross_refs, migration_plan)
    
    print("\n" + "=" * 70)
    print("Analysis Complete!")
    print("=" * 70)
    print(f"\nBackup location: {backup_path}")
    print(f"Analysis files: {ANALYSIS_DIR}")
    print(f"\nReview the SUMMARY.md file for detailed findings.")

if __name__ == "__main__":
    main()
