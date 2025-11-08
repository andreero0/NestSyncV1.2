#!/usr/bin/env python3
"""
Validate link integrity in documentation.
Checks:
- All markdown links resolve correctly
- Relative paths are correct
- Cross-references work
- No broken links
"""

import os
import re
from pathlib import Path
from typing import List, Dict, Tuple, Set
from urllib.parse import urlparse, unquote

class LinkValidator:
    def __init__(self, root_path: str = "."):
        self.root_path = Path(root_path)
        self.errors = []
        self.warnings = []
        self.info = []
        self.checked_links = 0
        self.broken_links = []
        self.external_links = []
        
    def validate_all(self) -> bool:
        """Run all validation checks."""
        print("=" * 80)
        print("LINK INTEGRITY VALIDATION")
        print("=" * 80)
        print()
        
        self.validate_markdown_links()
        
        self.print_results()
        return len(self.errors) == 0
    
    def validate_markdown_links(self):
        """Validate all markdown links in documentation."""
        print("Validating markdown links...")
        
        # Find all markdown files
        md_files = []
        for pattern in ["docs/**/*.md", "NestSync-backend/docs/**/*.md", "NestSync-frontend/docs/**/*.md"]:
            md_files.extend(self.root_path.glob(pattern))
        
        print(f"  Found {len(md_files)} markdown files to check")
        
        for md_file in md_files:
            self.check_file_links(md_file)
        
        self.info.append(f"Checked {self.checked_links} links in {len(md_files)} files")
        self.info.append(f"Found {len(self.broken_links)} broken links")
        self.info.append(f"Found {len(self.external_links)} external links (not validated)")
        print(f"  ✓ Validated {self.checked_links} links")
        print()
    
    def check_file_links(self, file_path: Path):
        """Check all links in a single markdown file."""
        try:
            content = file_path.read_text(encoding='utf-8')
        except Exception as e:
            self.warnings.append(f"Could not read {file_path}: {e}")
            return
        
        # Find all markdown links: [text](url)
        link_pattern = r'\[([^\]]+)\]\(([^\)]+)\)'
        links = re.findall(link_pattern, content)
        
        for link_text, link_url in links:
            self.checked_links += 1
            self.validate_link(file_path, link_text, link_url)
    
    def validate_link(self, source_file: Path, link_text: str, link_url: str):
        """Validate a single link."""
        # Skip anchors within same document
        if link_url.startswith('#'):
            return
        
        # Check if it's an external URL
        if link_url.startswith(('http://', 'https://', 'mailto:')):
            self.external_links.append((str(source_file.relative_to(self.root_path)), link_url))
            return
        
        # Remove anchor from URL
        url_without_anchor = link_url.split('#')[0]
        if not url_without_anchor:
            return  # Pure anchor link
        
        # Decode URL-encoded characters
        url_without_anchor = unquote(url_without_anchor)
        
        # Resolve relative path
        source_dir = source_file.parent
        target_path = (source_dir / url_without_anchor).resolve()
        
        # Check if target exists
        if not target_path.exists():
            # Try as directory (might be linking to directory with implicit index)
            if not target_path.is_dir():
                self.broken_links.append({
                    'source': str(source_file.relative_to(self.root_path)),
                    'link_text': link_text,
                    'link_url': link_url,
                    'target': str(target_path.relative_to(self.root_path)) if self.root_path in target_path.parents else str(target_path)
                })
                self.errors.append(
                    f"Broken link in {source_file.relative_to(self.root_path)}: "
                    f"[{link_text}]({link_url}) -> {target_path.relative_to(self.root_path) if self.root_path in target_path.parents else target_path}"
                )
    
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
        
        if self.external_links and len(self.external_links) <= 10:
            print("EXTERNAL LINKS (not validated):")
            for source, url in self.external_links[:10]:
                print(f"  🔗 {source} -> {url}")
            if len(self.external_links) > 10:
                print(f"  ... and {len(self.external_links) - 10} more")
            print()
        
        if self.warnings:
            print("WARNINGS:")
            for msg in self.warnings:
                print(f"  ⚠ {msg}")
            print()
        
        if self.broken_links:
            print("BROKEN LINKS:")
            # Group by source file
            by_source = {}
            for link in self.broken_links:
                source = link['source']
                if source not in by_source:
                    by_source[source] = []
                by_source[source].append(link)
            
            for source, links in sorted(by_source.items()):
                print(f"\n  📄 {source}:")
                for link in links:
                    print(f"     ✗ [{link['link_text']}]({link['link_url']})")
                    print(f"       Target not found: {link['target']}")
            print()
        
        if self.errors and not self.broken_links:
            print("ERRORS:")
            for msg in self.errors[:20]:  # Limit to first 20
                print(f"  ✗ {msg}")
            if len(self.errors) > 20:
                print(f"  ... and {len(self.errors) - 20} more errors")
            print()
        
        print("=" * 80)
        if self.errors:
            print(f"VALIDATION FAILED: {len(self.errors)} broken links")
        elif self.warnings:
            print(f"VALIDATION PASSED WITH WARNINGS: {len(self.warnings)} warnings")
        else:
            print("VALIDATION PASSED: All links are valid")
        print("=" * 80)

if __name__ == "__main__":
    validator = LinkValidator()
    success = validator.validate_all()
    exit(0 if success else 1)
