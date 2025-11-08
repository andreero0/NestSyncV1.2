#!/usr/bin/env python3
"""
Create clean inventory of actual project documentation
"""

import os
import hashlib
import json
import re
from pathlib import Path
from datetime import datetime

WORKSPACE_ROOT = Path(__file__).parent.parent.parent.parent
ANALYSIS_DIR = Path(__file__).parent.parent / "analysis"

# Path patterns to exclude
EXCLUDED_PATTERNS = [
    '/.git/',
    '/node_modules/',
    '/venv/',
    '/__pycache__/',
    '/.pytest_cache/',
    '/.expo/',
    '/test-results/',
    '/playwright-report/',
    '/traces/',
    '/backup/',
    '/analysis/',
    '/.temp/',
    '/cache/',
    'documentation-cleanup/backup',
    'documentation-cleanup/analysis'
]

def should_exclude(path_str):
    """Check if path should be excluded"""
    path_with_slashes = '/' + path_str.replace('\\', '/')
    return any(pattern in path_with_slashes for pattern in EXCLUDED_PATTERNS)

def calculate_file_hash(file_path):
    """Calculate SHA256 hash of file content"""
    return hashlib.sha256(file_path.read_bytes()).hexdigest()

def create_clean_inventory():
    """Create inventory of actual project documentation"""
    print("Creating clean inventory of project documentation...")
    
    inventory = []
    processed = 0
    excluded = 0
    
    # Walk directory tree manually to skip excluded dirs
    for root, dirs, files in os.walk(WORKSPACE_ROOT):
        # Get relative path for this directory
        rel_root = str(Path(root).relative_to(WORKSPACE_ROOT))
        
        # Remove excluded directories from dirs list (modifies in-place)
        original_dirs = dirs[:]
        dirs[:] = [d for d in dirs if not should_exclude(os.path.join(rel_root, d) if rel_root != '.' else d)]
        
        for file in files:
            if not file.endswith('.md'):
                continue
            
            md_file = Path(root) / file
            relative_path = str(md_file.relative_to(WORKSPACE_ROOT))
            
            # Double-check exclusion
            if should_exclude(relative_path):
                excluded += 1
                continue
        
            try:
                stat = md_file.stat()
                content = md_file.read_text(encoding='utf-8', errors='ignore')
                
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
                processed += 1
                
            except Exception as e:
                print(f"Warning: Could not process {relative_path}: {e}")
    
    # Save inventory
    ANALYSIS_DIR.mkdir(parents=True, exist_ok=True)
    inventory_file = ANALYSIS_DIR / "clean-inventory.json"
    inventory_file.write_text(json.dumps({
        "generated_at": datetime.now().isoformat(),
        "total_files": len(inventory),
        "excluded_files": excluded,
        "files": sorted(inventory, key=lambda x: x["path"])
    }, indent=2))
    
    print(f"✓ Clean inventory created: {inventory_file}")
    print(f"✓ Processed: {processed} files")
    print(f"✓ Excluded: {excluded} files")
    
    # Generate summary by directory
    by_dir = {}
    for file_info in inventory:
        top_dir = file_info["path"].split('/')[0] if '/' in file_info["path"] else "root"
        if top_dir not in by_dir:
            by_dir[top_dir] = []
        by_dir[top_dir].append(file_info)
    
    print(f"\nDistribution by directory:")
    for dir_name in sorted(by_dir.keys()):
        count = len(by_dir[dir_name])
        size = sum(f['size_bytes'] for f in by_dir[dir_name]) / 1024
        print(f"  {dir_name}: {count} files ({size:.1f} KB)")
    
    return inventory

if __name__ == "__main__":
    create_clean_inventory()
