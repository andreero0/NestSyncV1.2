#!/usr/bin/env python3
"""
Detect duplicate markdown files based on content similarity.
"""

import os
import hashlib
from pathlib import Path
from difflib import SequenceMatcher

def get_file_hash(filepath):
    """Get MD5 hash of file content."""
    try:
        with open(filepath, 'rb') as f:
            return hashlib.md5(f.read()).hexdigest()
    except:
        return None

def get_content_similarity(file1, file2):
    """Calculate similarity ratio between two files."""
    try:
        with open(file1, 'r', encoding='utf-8') as f1:
            content1 = f1.read()
        with open(file2, 'r', encoding='utf-8') as f2:
            content2 = f2.read()
        
        return SequenceMatcher(None, content1, content2).ratio()
    except:
        return 0.0

def find_markdown_files():
    """Find all markdown files in the project."""
    markdown_files = []
    
    # Search in key directories
    search_dirs = [
        'docs',
        'NestSync-frontend',
        'NestSync-backend',
        'design-documentation',
        'project-documentation'
    ]
    
    for search_dir in search_dirs:
        if os.path.exists(search_dir):
            for root, dirs, files in os.walk(search_dir):
                # Skip node_modules and other irrelevant directories
                dirs[:] = [d for d in dirs if d not in ['node_modules', '.git', 'venv', '__pycache__']]
                
                for file in files:
                    if file.endswith('.md'):
                        filepath = os.path.join(root, file)
                        markdown_files.append(filepath)
    
    return markdown_files

def detect_duplicates(threshold=0.8):
    """Detect duplicate markdown files."""
    print("=" * 80)
    print("DUPLICATE DETECTION")
    print("=" * 80)
    print()
    
    markdown_files = find_markdown_files()
    print(f"Scanning {len(markdown_files)} markdown files...")
    print()
    
    # Group by hash for exact duplicates
    hash_groups = {}
    for filepath in markdown_files:
        file_hash = get_file_hash(filepath)
        if file_hash:
            if file_hash not in hash_groups:
                hash_groups[file_hash] = []
            hash_groups[file_hash].append(filepath)
    
    # Find exact duplicates
    exact_duplicates = {h: files for h, files in hash_groups.items() if len(files) > 1}
    
    print(f"Exact duplicates (100% match): {len(exact_duplicates)} groups")
    if exact_duplicates:
        for i, (hash_val, files) in enumerate(exact_duplicates.items(), 1):
            print(f"\n  Group {i}:")
            for file in files:
                print(f"    - {file}")
    else:
        print("  ✓ No exact duplicates found")
    
    print()
    print("=" * 80)
    print(f"Checking for similar content (>{int(threshold*100)}% similarity)...")
    print("=" * 80)
    print()
    
    # Check for similar content (this is slow, so we'll sample)
    similar_pairs = []
    checked = 0
    max_checks = 1000  # Limit checks to avoid long runtime
    
    for i, file1 in enumerate(markdown_files):
        for file2 in markdown_files[i+1:]:
            if checked >= max_checks:
                break
            
            # Skip if same hash (already found as exact duplicate)
            hash1 = get_file_hash(file1)
            hash2 = get_file_hash(file2)
            if hash1 == hash2:
                continue
            
            similarity = get_content_similarity(file1, file2)
            if similarity >= threshold:
                similar_pairs.append((file1, file2, similarity))
            
            checked += 1
        
        if checked >= max_checks:
            break
    
    if similar_pairs:
        print(f"Found {len(similar_pairs)} similar file pairs:")
        for file1, file2, similarity in similar_pairs:
            print(f"\n  Similarity: {similarity:.1%}")
            print(f"    - {file1}")
            print(f"    - {file2}")
    else:
        print(f"  ✓ No similar content found (checked {checked} pairs)")
    
    print()
    print("=" * 80)
    if exact_duplicates or similar_pairs:
        print(f"VALIDATION FAILED: Found {len(exact_duplicates)} exact duplicates and {len(similar_pairs)} similar pairs")
    else:
        print("VALIDATION PASSED: No duplicates found")
    print("=" * 80)
    
    return len(exact_duplicates) == 0 and len(similar_pairs) == 0

if __name__ == "__main__":
    success = detect_duplicates()
    exit(0 if success else 1)
