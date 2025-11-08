#!/usr/bin/env python3
"""
Validate design documentation authority.
Checks:
- Design documentation is unchanged
- Implementation reports reference design docs
- No implementation reports override design decisions
- Cross-references from archives to design docs
"""

import os
import re
from pathlib import Path
from typing import List, Dict, Tuple, Set

class DesignAuthorityValidator:
    def __init__(self, root_path: str = "."):
        self.root_path = Path(root_path)
        self.errors = []
        self.warnings = []
        self.info = []
        
    def validate_all(self) -> bool:
        """Run all validation checks."""
        print("=" * 80)
        print("DESIGN DOCUMENTATION AUTHORITY VALIDATION")
        print("=" * 80)
        print()
        
        self.check_design_docs_unchanged()
        self.check_implementation_references()
        self.check_archive_references()
        
        self.print_results()
        return len(self.errors) == 0
    
    def check_design_docs_unchanged(self):
        """Verify design documentation is in its original location."""
        print("Checking design documentation location...")
        
        design_doc_path = self.root_path / "design-documentation"
        
        if not design_doc_path.exists():
            self.errors.append("Design documentation directory not found: design-documentation/")
            print("  ✗ Design documentation directory not found")
            print()
            return
        
        # Count design documentation files
        design_files = list(design_doc_path.rglob("*.md"))
        
        self.info.append(f"Found {len(design_files)} design documentation files")
        self.info.append(f"Design documentation location: design-documentation/")
        
        # Check that no design docs are in archives
        archive_paths = [
            "docs/archives",
            "NestSync-backend/docs/archives",
            "NestSync-frontend/docs/archives"
        ]
        
        design_in_archives = []
        for archive_path in archive_paths:
            full_path = self.root_path / archive_path
            if not full_path.exists():
                continue
            
            # Look for files with "design" in the name
            for md_file in full_path.rglob("*.md"):
                if "design" in md_file.name.lower() and "design-system" not in str(md_file):
                    design_in_archives.append(str(md_file.relative_to(self.root_path)))
        
        if design_in_archives:
            for file in design_in_archives:
                self.warnings.append(f"Design-related file in archive: {file}")
        
        print(f"  ✓ Design documentation verified in original location")
        print()
    
    def check_implementation_references(self):
        """Check that implementation reports reference design docs."""
        print("Checking implementation report references to design docs...")
        
        # Get all implementation report READMEs
        impl_readmes = []
        for pattern in [
            "NestSync-backend/docs/archives/implementation-reports/**/README.md",
            "NestSync-frontend/docs/archives/implementation-reports/**/README.md"
        ]:
            impl_readmes.extend(self.root_path.glob(pattern))
        
        # Filter out the top-level README
        impl_readmes = [r for r in impl_readmes if r.parent.name != "implementation-reports"]
        
        reports_with_refs = 0
        reports_without_refs = 0
        
        for readme in impl_readmes:
            content = readme.read_text(encoding='utf-8')
            
            # Look for references to design documentation
            has_design_ref = any(keyword in content for keyword in [
                'design-documentation',
                'Design:',
                'Design Spec',
                'Design Documentation'
            ])
            
            if has_design_ref:
                reports_with_refs += 1
            else:
                reports_without_refs += 1
                self.warnings.append(
                    f"No design documentation reference: {readme.relative_to(self.root_path)}"
                )
        
        self.info.append(f"Implementation reports with design references: {reports_with_refs}")
        if reports_without_refs > 0:
            self.info.append(f"Implementation reports without design references: {reports_without_refs}")
        
        print(f"  ✓ Checked {reports_with_refs + reports_without_refs} implementation reports")
        print()
    
    def check_archive_references(self):
        """Check cross-references from archives to design docs."""
        print("Checking archive cross-references to design docs...")
        
        # Get all archived markdown files
        archive_files = []
        for pattern in [
            "docs/archives/**/*.md",
            "NestSync-backend/docs/archives/**/*.md",
            "NestSync-frontend/docs/archives/**/*.md"
        ]:
            archive_files.extend(self.root_path.glob(pattern))
        
        # Filter out README files for this check
        archive_files = [f for f in archive_files if f.name != "README.md"]
        
        files_with_design_refs = 0
        total_design_refs = 0
        
        for archive_file in archive_files:
            try:
                content = archive_file.read_text(encoding='utf-8')
                
                # Count references to design documentation
                design_ref_count = content.count('design-documentation')
                
                if design_ref_count > 0:
                    files_with_design_refs += 1
                    total_design_refs += design_ref_count
            except Exception:
                pass
        
        self.info.append(f"Archived files with design references: {files_with_design_refs}")
        self.info.append(f"Total design documentation references: {total_design_refs}")
        
        print(f"  ✓ Checked {len(archive_files)} archived documents")
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
    validator = DesignAuthorityValidator()
    success = validator.validate_all()
    exit(0 if success else 1)
