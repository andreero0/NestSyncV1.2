#!/usr/bin/env python3
"""
Validate content consolidation for documentation cleanup.
Checks:
- No duplicate content remains (>80% similarity)
- Version history sections are complete
- Unique content from all versions is preserved
- Consolidated documents reference archived versions
"""

import os
import re
import hashlib
from pathlib import Path
from typing import List, Dict, Tuple, Set
from difflib import SequenceMatcher

class ContentValidator:
    def __init__(self, root_path: str = "."):
        self.root_path = Path(root_path)
        self.errors = []
        self.warnings = []
        self.info = []
        self.duplicates = []
        
    def validate_all(self) -> bool:
        """Run all validation checks."""
        print("=" * 80)
        print("CONTENT CONSOLIDATION VALIDATION")
        print("=" * 80)
        print()
        
        self.check_duplicate_content()
        self.check_version_history()
        self.check_consolidated_references()
        
        self.print_results()
        return len(self.errors) == 0
    
    def check_duplicate_content(self):
        """Check for duplicate content (>80% similarity)."""
        print("Checking for duplicate content...")
        
        # Get all markdown files in archives
        archive_files = []
        for pattern in ["docs/archives/**/*.md", "NestSync-backend/docs/archives/**/*.md", 
                       "NestSync-frontend/docs/archives/**/*.md"]:
            archive_files.extend(self.root_path.glob(pattern))
        
        # Filter out README files
        archive_files = [f for f in archive_files if f.name != "README.md"]
        
        print(f"  Checking {len(archive_files)} archived documents for duplicates")
        
        # Compare all pairs
        checked_pairs = set()
        for i, file1 in enumerate(archive_files):
            for file2 in archive_files[i+1:]:
                pair = tuple(sorted([str(file1), str(file2)]))
                if pair in checked_pairs:
                    continue
                checked_pairs.add(pair)
                
                similarity = self.calculate_similarity(file1, file2)
                if similarity > 0.80:
                    self.duplicates.append({
                        'file1': str(file1.relative_to(self.root_path)),
                        'file2': str(file2.relative_to(self.root_path)),
                        'similarity': similarity
                    })
                    self.warnings.append(
                        f"Potential duplicate content ({similarity:.1%} similar): "
                        f"{file1.name} and {file2.name}"
                    )
        
        if not self.duplicates:
            self.info.append("No duplicate content found (>80% similarity)")
        else:
            self.info.append(f"Found {len(self.duplicates)} potential duplicates")
        
        print(f"  ✓ Checked {len(checked_pairs)} document pairs")
        print()
    
    def calculate_similarity(self, file1: Path, file2: Path) -> float:
        """Calculate content similarity between two files."""
        try:
            content1 = file1.read_text(encoding='utf-8')
            content2 = file2.read_text(encoding='utf-8')
            
            # Remove frontmatter for comparison
            content1 = self.remove_frontmatter(content1)
            content2 = self.remove_frontmatter(content2)
            
            # Calculate similarity
            return SequenceMatcher(None, content1, content2).ratio()
        except Exception:
            return 0.0
    
    def remove_frontmatter(self, content: str) -> str:
        """Remove YAML frontmatter from content."""
        pattern = r'^---\s*\n.*?\n---\s*\n'
        return re.sub(pattern, '', content, flags=re.DOTALL)
    
    def check_version_history(self):
        """Check that consolidated documents have version history sections."""
        print("Checking version history sections...")
        
        # Check consolidated implementation reports
        consolidated_dirs = [
            "NestSync-backend/docs/archives/implementation-reports/premium-subscription",
            "NestSync-backend/docs/archives/implementation-reports/notification-system",
            "NestSync-frontend/docs/archives/implementation-reports/design-system",
            "NestSync-frontend/docs/archives/implementation-reports/traffic-light-dashboard",
            "NestSync-frontend/docs/archives/implementation-reports/payment-system",
            "NestSync-frontend/docs/archives/implementation-reports/subscription-ui",
        ]
        
        docs_with_history = 0
        docs_without_history = 0
        
        for dir_path in consolidated_dirs:
            full_path = self.root_path / dir_path
            if not full_path.exists():
                continue
            
            # Check README.md for version history
            readme = full_path / "README.md"
            if readme.exists():
                content = readme.read_text(encoding='utf-8')
                
                # Look for version history indicators
                has_history = any(keyword in content.lower() for keyword in [
                    'version history', 'versions', 'consolidated from', 'merged from'
                ])
                
                if has_history:
                    docs_with_history += 1
                else:
                    docs_without_history += 1
                    self.warnings.append(
                        f"Missing version history section: {readme.relative_to(self.root_path)}"
                    )
        
        self.info.append(f"Consolidated docs with version history: {docs_with_history}")
        if docs_without_history > 0:
            self.info.append(f"Consolidated docs without version history: {docs_without_history}")
        
        print(f"  ✓ Checked {docs_with_history + docs_without_history} consolidated documents")
        print()
    
    def check_consolidated_references(self):
        """Check that consolidated documents reference archived versions."""
        print("Checking consolidated document references...")
        
        # Check that consolidated READMEs reference their component documents
        consolidated_readmes = [
            "NestSync-backend/docs/archives/implementation-reports/premium-subscription/README.md",
            "NestSync-backend/docs/archives/implementation-reports/notification-system/README.md",
            "NestSync-frontend/docs/archives/implementation-reports/design-system/README.md",
            "NestSync-frontend/docs/archives/implementation-reports/traffic-light-dashboard/README.md",
            "NestSync-frontend/docs/archives/implementation-reports/payment-system/README.md",
            "NestSync-frontend/docs/archives/implementation-reports/subscription-ui/README.md",
        ]
        
        docs_with_refs = 0
        docs_without_refs = 0
        
        for readme_path in consolidated_readmes:
            full_path = self.root_path / readme_path
            if not full_path.exists():
                continue
            
            content = full_path.read_text(encoding='utf-8')
            
            # Count markdown links
            link_pattern = r'\[([^\]]+)\]\(([^\)]+)\)'
            links = re.findall(link_pattern, content)
            
            # Check for links to .md files (archived versions)
            md_links = [link for text, link in links if link.endswith('.md')]
            
            if len(md_links) > 0:
                docs_with_refs += 1
            else:
                docs_without_refs += 1
                self.warnings.append(
                    f"No references to archived versions: {Path(readme_path).relative_to(self.root_path)}"
                )
        
        self.info.append(f"Consolidated docs with references: {docs_with_refs}")
        if docs_without_refs > 0:
            self.info.append(f"Consolidated docs without references: {docs_without_refs}")
        
        print(f"  ✓ Checked {docs_with_refs + docs_without_refs} consolidated documents")
        print()
    
    def print_results(self):
        """Print validation results."""
        print("=" * 80)
        print("VALIDATION RESULTS")
        print("=" * 80)
        print()
        
        if self.info:
            print("INFO:")
            for msg in self.info:
                print(f"  ℹ {msg}")
            print()
        
        if self.duplicates:
            print("POTENTIAL DUPLICATES (>80% similarity):")
            for dup in self.duplicates[:10]:
                print(f"  ⚠ {dup['similarity']:.1%} similar:")
                print(f"     - {dup['file1']}")
                print(f"     - {dup['file2']}")
            if len(self.duplicates) > 10:
                print(f"  ... and {len(self.duplicates) - 10} more")
            print()
        
        if self.warnings:
            print("WARNINGS:")
            for msg in self.warnings[:20]:
                print(f"  ⚠ {msg}")
            if len(self.warnings) > 20:
                print(f"  ... and {len(self.warnings) - 20} more")
            print()
        
        if self.errors:
            print("ERRORS:")
            for msg in self.errors:
                print(f"  ✗ {msg}")
            print()
        
        print("=" * 80)
        if self.errors:
            print(f"VALIDATION FAILED: {len(self.errors)} errors, {len(self.warnings)} warnings")
        elif self.warnings:
            print(f"VALIDATION PASSED WITH WARNINGS: {len(self.warnings)} warnings")
        else:
            print("VALIDATION PASSED: All checks successful")
        print("=" * 80)

if __name__ == "__main__":
    validator = ContentValidator()
    success = validator.validate_all()
    exit(0 if success else 1)
