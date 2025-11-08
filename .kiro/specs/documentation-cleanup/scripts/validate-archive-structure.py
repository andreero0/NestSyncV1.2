#!/usr/bin/env python3
"""
Validate archive structure for documentation cleanup.
Checks:
- All archive directories have README.md files
- All archived documents have metadata frontmatter
- Chronological ordering in indexes
- Category groupings are correct
"""

import os
import re
from pathlib import Path
from typing import List, Dict, Tuple

class ArchiveValidator:
    def __init__(self, root_path: str = "."):
        self.root_path = Path(root_path)
        self.errors = []
        self.warnings = []
        self.info = []
        
    def validate_all(self) -> bool:
        """Run all validation checks."""
        print("=" * 80)
        print("ARCHIVE STRUCTURE VALIDATION")
        print("=" * 80)
        print()
        
        self.check_archive_readme_files()
        self.check_archived_documents_metadata()
        self.check_chronological_ordering()
        self.check_category_groupings()
        
        self.print_results()
        return len(self.errors) == 0
    
    def check_archive_readme_files(self):
        """Verify all archive directories have README.md files."""
        print("Checking archive directories for README.md files...")
        
        archive_dirs = [
            "docs/archives",
            "docs/archives/2025",
            "docs/archives/2025/01-january",
            "docs/archives/2025/02-february",
            "docs/archives/2025/05-may",
            "docs/archives/2025/09-september",
            "docs/archives/2025/11-november",
            "docs/archives/implementation-reports",
            "docs/archives/test-reports",
            "docs/archives/test-reports/e2e",
            "docs/archives/test-reports/integration",
            "docs/archives/test-reports/visual",
            "docs/archives/fixes",
            "docs/archives/fixes/authentication",
            "docs/archives/fixes/ui-ux",
            "docs/archives/fixes/notifications",
            "docs/archives/fixes/compliance",
            "docs/archives/audits",
            "NestSync-backend/docs/archives",
            "NestSync-backend/docs/archives/implementation-reports",
            "NestSync-backend/docs/archives/implementation-reports/premium-subscription",
            "NestSync-backend/docs/archives/implementation-reports/notification-system",
            "NestSync-frontend/docs/archives",
            "NestSync-frontend/docs/archives/implementation-reports",
            "NestSync-frontend/docs/archives/implementation-reports/design-system",
            "NestSync-frontend/docs/archives/implementation-reports/traffic-light-dashboard",
            "NestSync-frontend/docs/archives/implementation-reports/payment-system",
            "NestSync-frontend/docs/archives/implementation-reports/subscription-ui",
        ]
        
        missing_readmes = []
        found_readmes = []
        
        for dir_path in archive_dirs:
            full_path = self.root_path / dir_path
            readme_path = full_path / "README.md"
            
            if full_path.exists():
                if readme_path.exists():
                    found_readmes.append(dir_path)
                else:
                    missing_readmes.append(dir_path)
            else:
                self.warnings.append(f"Archive directory does not exist: {dir_path}")
        
        if missing_readmes:
            for dir_path in missing_readmes:
                self.errors.append(f"Missing README.md in: {dir_path}")
        
        self.info.append(f"Found {len(found_readmes)} archive directories with README.md")
        if missing_readmes:
            self.info.append(f"Missing README.md in {len(missing_readmes)} directories")
        print(f"  ✓ Checked {len(archive_dirs)} archive directories")
        print()
    
    def check_archived_documents_metadata(self):
        """Verify all archived documents have metadata frontmatter."""
        print("Checking archived documents for metadata frontmatter...")
        
        archive_paths = [
            "docs/archives",
            "NestSync-backend/docs/archives",
            "NestSync-frontend/docs/archives",
        ]
        
        docs_without_metadata = []
        docs_with_metadata = []
        total_docs = 0
        
        for archive_path in archive_paths:
            full_path = self.root_path / archive_path
            if not full_path.exists():
                continue
            
            for md_file in full_path.rglob("*.md"):
                # Skip README.md files
                if md_file.name == "README.md":
                    continue
                
                total_docs += 1
                
                try:
                    content = md_file.read_text(encoding='utf-8')
                    if self.has_frontmatter(content):
                        docs_with_metadata.append(str(md_file.relative_to(self.root_path)))
                    else:
                        docs_without_metadata.append(str(md_file.relative_to(self.root_path)))
                except Exception as e:
                    self.warnings.append(f"Could not read {md_file}: {e}")
        
        if docs_without_metadata:
            for doc in docs_without_metadata:
                self.warnings.append(f"Missing metadata frontmatter: {doc}")
        
        self.info.append(f"Checked {total_docs} archived documents")
        self.info.append(f"Documents with metadata: {len(docs_with_metadata)}")
        self.info.append(f"Documents without metadata: {len(docs_without_metadata)}")
        print(f"  ✓ Checked {total_docs} archived documents")
        print()
    
    def has_frontmatter(self, content: str) -> bool:
        """Check if content has YAML frontmatter."""
        # Check for YAML frontmatter (--- at start and end)
        pattern = r'^---\s*\n.*?\n---\s*\n'
        return bool(re.match(pattern, content, re.DOTALL))
    
    def check_chronological_ordering(self):
        """Verify chronological ordering in indexes."""
        print("Checking chronological ordering in indexes...")
        
        # Check main archive README
        main_archive_readme = self.root_path / "docs/archives/README.md"
        if main_archive_readme.exists():
            content = main_archive_readme.read_text(encoding='utf-8')
            
            # Extract month references
            month_pattern = r'\[([A-Za-z]+\s+\d{4})\]'
            months = re.findall(month_pattern, content)
            
            if months:
                self.info.append(f"Found {len(months)} month references in main archive index")
            else:
                self.warnings.append("No month references found in main archive index")
        else:
            self.errors.append("Main archive README.md not found: docs/archives/README.md")
        
        # Check monthly README files for chronological ordering
        monthly_readmes = list((self.root_path / "docs/archives/2025").rglob("*/README.md"))
        
        for readme in monthly_readmes:
            if readme.parent.name in ["01-january", "02-february", "05-may", "09-september", "11-november"]:
                content = readme.read_text(encoding='utf-8')
                
                # Look for date patterns (YYYY-MM-DD)
                date_pattern = r'\b(\d{4}-\d{2}-\d{2})\b'
                dates = re.findall(date_pattern, content)
                
                if dates:
                    # Check if dates are in descending order (newest first)
                    sorted_dates = sorted(dates, reverse=True)
                    if dates != sorted_dates:
                        self.warnings.append(f"Dates may not be in chronological order in {readme.relative_to(self.root_path)}")
        
        self.info.append(f"Checked {len(monthly_readmes)} monthly README files for chronological ordering")
        print(f"  ✓ Checked chronological ordering in {len(monthly_readmes) + 1} index files")
        print()
    
    def check_category_groupings(self):
        """Verify category groupings are correct."""
        print("Checking category groupings...")
        
        expected_categories = {
            "docs/archives/fixes": ["authentication", "ui-ux", "notifications", "compliance"],
            "docs/archives/test-reports": ["e2e", "integration", "visual"],
        }
        
        for parent_dir, expected_subdirs in expected_categories.items():
            parent_path = self.root_path / parent_dir
            
            if not parent_path.exists():
                self.warnings.append(f"Category directory does not exist: {parent_dir}")
                continue
            
            actual_subdirs = [d.name for d in parent_path.iterdir() if d.is_dir()]
            
            missing = set(expected_subdirs) - set(actual_subdirs)
            extra = set(actual_subdirs) - set(expected_subdirs)
            
            if missing:
                for subdir in missing:
                    self.warnings.append(f"Expected category subdirectory not found: {parent_dir}/{subdir}")
            
            if extra:
                for subdir in extra:
                    self.info.append(f"Additional category subdirectory found: {parent_dir}/{subdir}")
        
        self.info.append(f"Checked {len(expected_categories)} category groupings")
        print(f"  ✓ Checked {len(expected_categories)} category groupings")
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
        
        if self.warnings:
            print("WARNINGS:")
            for msg in self.warnings:
                print(f"  ⚠ {msg}")
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
    validator = ArchiveValidator()
    success = validator.validate_all()
    exit(0 if success else 1)
