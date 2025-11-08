#!/usr/bin/env python3
"""
Fix absolute path links in markdown files.
Converts absolute paths like /docs/... to relative paths.
"""

import os
import re
from pathlib import Path
from typing import List, Tuple

class PathFixer:
    def __init__(self, root_path: str = "."):
        self.root_path = Path(root_path)
        self.fixes_made = []
        
    def fix_all(self, dry_run: bool = False):
        """Fix absolute paths in all markdown files."""
        print("=" * 80)
        print("FIXING ABSOLUTE PATH LINKS")
        print("=" * 80)
        print()
        
        if dry_run:
            print("DRY RUN MODE - No changes will be made")
            print()
        
        # Find all markdown files in docs directories
        md_files = []
        for pattern in ["docs/**/*.md", "NestSync-backend/docs/**/*.md", "NestSync-frontend/docs/**/*.md"]:
            md_files.extend(self.root_path.glob(pattern))
        
        print(f"Found {len(md_files)} markdown files to check")
        print()
        
        for md_file in md_files:
            self.fix_file(md_file, dry_run)
        
        self.print_summary()
        
    def fix_file(self, file_path: Path, dry_run: bool = False):
        """Fix absolute paths in a single file."""
        try:
            content = file_path.read_text(encoding='utf-8')
            original_content = content
        except Exception as e:
            print(f"⚠️  Could not read {file_path}: {e}")
            return
        
        # Find all markdown links with absolute paths
        # Pattern: [text](/absolute/path)
        pattern = r'\[([^\]]+)\]\((/[^\)]+)\)'
        
        def replace_link(match):
            link_text = match.group(1)
            absolute_path = match.group(2)
            
            # Calculate relative path
            relative_path = self.absolute_to_relative(file_path, absolute_path)
            
            if relative_path != absolute_path:
                self.fixes_made.append({
                    'file': str(file_path.relative_to(self.root_path)),
                    'original': absolute_path,
                    'fixed': relative_path
                })
                return f'[{link_text}]({relative_path})'
            
            return match.group(0)
        
        content = re.sub(pattern, replace_link, content)
        
        if content != original_content and not dry_run:
            file_path.write_text(content, encoding='utf-8')
    
    def absolute_to_relative(self, source_file: Path, absolute_path: str) -> str:
        """Convert absolute path to relative path."""
        # Remove leading slash
        if not absolute_path.startswith('/'):
            return absolute_path
        
        target_path_str = absolute_path[1:]  # Remove leading /
        
        # Get source directory
        source_dir = source_file.parent
        
        # Calculate relative path from source to target
        try:
            # Build full target path
            target_full = self.root_path / target_path_str
            
            # Calculate relative path
            relative = os.path.relpath(target_full, source_dir)
            
            return relative
        except Exception:
            # If calculation fails, return original
            return absolute_path
    
    def print_summary(self):
        """Print summary of fixes."""
        print("=" * 80)
        print("SUMMARY")
        print("=" * 80)
        print()
        
        if not self.fixes_made:
            print("✓ No absolute paths found")
            return
        
        print(f"Fixed {len(self.fixes_made)} absolute path links")
        print()
        
        # Group by file
        by_file = {}
        for fix in self.fixes_made:
            file = fix['file']
            if file not in by_file:
                by_file[file] = []
            by_file[file].append(fix)
        
        print(f"Files modified: {len(by_file)}")
        print()
        
        # Show first 10 fixes
        print("Sample fixes:")
        for i, fix in enumerate(self.fixes_made[:10]):
            print(f"  {i+1}. {fix['file']}")
            print(f"     {fix['original']} → {fix['fixed']}")
        
        if len(self.fixes_made) > 10:
            print(f"  ... and {len(self.fixes_made) - 10} more")
        
        print()
        print("=" * 80)

if __name__ == "__main__":
    import sys
    
    dry_run = '--dry-run' in sys.argv
    
    fixer = PathFixer()
    fixer.fix_all(dry_run=dry_run)
    
    if dry_run:
        print("\nRun without --dry-run to apply fixes")
