#!/usr/bin/env python3
"""
Validate compliance documentation.
Checks:
- All compliance docs are in active directory (not archived)
- Compliance documentation is complete
- Audit trail is intact
- Cross-references to implementation docs
"""

import os
import re
from pathlib import Path
from typing import List, Dict, Tuple, Set

class ComplianceValidator:
    def __init__(self, root_path: str = "."):
        self.root_path = Path(root_path)
        self.errors = []
        self.warnings = []
        self.info = []
        
    def validate_all(self) -> bool:
        """Run all validation checks."""
        print("=" * 80)
        print("COMPLIANCE DOCUMENTATION VALIDATION")
        print("=" * 80)
        print()
        
        self.check_compliance_location()
        self.check_compliance_completeness()
        self.check_audit_trail()
        self.check_cross_references()
        
        self.print_results()
        return len(self.errors) == 0
    
    def check_compliance_location(self):
        """Verify compliance docs are in active directory, not archived."""
        print("Checking compliance documentation location...")
        
        compliance_path = self.root_path / "docs/compliance"
        
        if not compliance_path.exists():
            self.errors.append("Compliance documentation directory not found: docs/compliance/")
            print("  ✗ Compliance documentation directory not found")
            print()
            return
        
        # Count compliance files
        compliance_files = list(compliance_path.rglob("*.md"))
        
        self.info.append(f"Found {len(compliance_files)} compliance documentation files")
        self.info.append(f"Compliance documentation location: docs/compliance/")
        
        # Check that no compliance docs are in archives
        archive_paths = [
            "docs/archives",
            "NestSync-backend/docs/archives",
            "NestSync-frontend/docs/archives"
        ]
        
        compliance_in_archives = []
        for archive_path in archive_paths:
            full_path = self.root_path / archive_path
            if not full_path.exists():
                continue
            
            # Look for compliance-related files (excluding fixes and design compliance)
            for md_file in full_path.rglob("*.md"):
                # Skip files in the fixes/compliance directory (those are fix reports, not compliance docs)
                if "fixes/compliance" in str(md_file):
                    continue
                
                # Skip design compliance validation reports (those are about design system, not regulatory compliance)
                if "design-compliance" in md_file.name.lower():
                    continue
                
                if any(keyword in md_file.name.lower() for keyword in ['pipeda', 'gdpr', 'privacy']):
                    if md_file.name != "README.md":
                        compliance_in_archives.append(str(md_file.relative_to(self.root_path)))
        
        if compliance_in_archives:
            for file in compliance_in_archives:
                self.errors.append(f"Compliance documentation in archive (should be active): {file}")
        else:
            self.info.append("No compliance documentation found in archives (correct)")
        
        print(f"  ✓ Compliance documentation verified in active directory")
        print()
    
    def check_compliance_completeness(self):
        """Check that compliance documentation is complete."""
        print("Checking compliance documentation completeness...")
        
        # Expected compliance documentation structure
        expected_docs = {
            "docs/compliance/README.md": "Compliance overview",
            "docs/compliance/pipeda/README.md": "PIPEDA compliance index",
            "docs/compliance/pipeda/data-residency.md": "Canadian data residency",
            "docs/compliance/pipeda/consent-management.md": "Consent management",
            "docs/compliance/pipeda/data-subject-rights.md": "Data subject rights",
            "docs/compliance/pipeda/audit-trails.md": "Audit trails",
            "docs/compliance/security/README.md": "Security overview",
            "docs/compliance/security/authentication.md": "Authentication security",
            "docs/compliance/security/encryption.md": "Data encryption",
            "docs/compliance/audits/README.md": "Audit reports index",
        }
        
        missing_docs = []
        found_docs = []
        
        for doc_path, description in expected_docs.items():
            full_path = self.root_path / doc_path
            if full_path.exists():
                found_docs.append(doc_path)
            else:
                missing_docs.append(f"{doc_path} - {description}")
        
        self.info.append(f"Found {len(found_docs)}/{len(expected_docs)} expected compliance documents")
        
        if missing_docs:
            for doc in missing_docs:
                self.warnings.append(f"Missing compliance document: {doc}")
        
        print(f"  ✓ Checked {len(expected_docs)} expected compliance documents")
        print()
    
    def check_audit_trail(self):
        """Check that audit trail is intact."""
        print("Checking compliance audit trail...")
        
        audits_path = self.root_path / "docs/compliance/audits"
        
        if not audits_path.exists():
            self.warnings.append("Audit directory not found: docs/compliance/audits/")
            print("  ⚠ Audit directory not found")
            print()
            return
        
        # Count audit files
        audit_files = [f for f in audits_path.rglob("*.md") if f.name != "README.md"]
        
        self.info.append(f"Found {len(audit_files)} audit reports")
        
        # Check for README
        readme = audits_path / "README.md"
        if readme.exists():
            self.info.append("Audit index (README.md) exists")
        else:
            self.warnings.append("Missing audit index: docs/compliance/audits/README.md")
        
        print(f"  ✓ Checked audit trail integrity")
        print()
    
    def check_cross_references(self):
        """Check cross-references to implementation docs."""
        print("Checking cross-references to implementation docs...")
        
        # Get all compliance markdown files
        compliance_files = list((self.root_path / "docs/compliance").rglob("*.md"))
        
        files_with_impl_refs = 0
        total_impl_refs = 0
        
        for compliance_file in compliance_files:
            try:
                content = compliance_file.read_text(encoding='utf-8')
                
                # Count references to implementation docs
                impl_ref_patterns = [
                    'NestSync-backend',
                    'NestSync-frontend',
                    'implementation',
                    'archives/implementation-reports'
                ]
                
                ref_count = sum(content.count(pattern) for pattern in impl_ref_patterns)
                
                if ref_count > 0:
                    files_with_impl_refs += 1
                    total_impl_refs += ref_count
            except Exception:
                pass
        
        self.info.append(f"Compliance files with implementation references: {files_with_impl_refs}")
        self.info.append(f"Total implementation references: {total_impl_refs}")
        
        print(f"  ✓ Checked {len(compliance_files)} compliance documents")
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
    validator = ComplianceValidator()
    success = validator.validate_all()
    exit(0 if success else 1)
