#!/usr/bin/env python3
"""
Remove files from original locations that have been verified as archived.
Only removes files that have been confirmed to exist in archive locations.
"""

import os
from pathlib import Path

# Files that have been verified as properly archived
VERIFIED_ARCHIVED_FILES = [
    "NestSync-frontend/DESIGN_SYSTEM_COMPLIANCE_AUDIT_REPORT.md",
    "NestSync-frontend/DESIGN_SYSTEM_COMPLIANCE_IMPLEMENTATION_REPORT.md",
    "NestSync-frontend/DESIGN_SYSTEM_FIX_VALIDATION_REPORT.md",
    "NestSync-frontend/DESIGN_SYSTEM_FIX_VALIDATION_REPORT_V2.md",
    "NestSync-frontend/TRAFFIC_LIGHT_CARDS_FIX_VALIDATION.md",
    "NestSync-frontend/TRAFFIC_LIGHT_GRID_TEST_REPORT.md",
    "NestSync-frontend/TRAFFIC_LIGHT_GRID_VALIDATION_FINAL.md",
    "NestSync-frontend/PAYMENT_FLOW_TEST_REPORT.md",
    "NestSync-frontend/PAYMENT_METHODS_CROSS_PLATFORM_FIX.md",
    "NestSync-frontend/WEB_PAYMENT_FLOW_TEST_REPORT.md",
    "NestSync-frontend/PIPEDA_FIX_VERIFICATION_REPORT.md",
    "NestSync-frontend/TRIAL_BANNER_VISIBILITY_TEST_REPORT.md",
    "NestSync-backend/PREMIUM_SUBSCRIPTION_COMPLETE.md",
    "NestSync-backend/NOTIFICATION_SYSTEM_IMPLEMENTATION.md",
    "NestSync-backend/NOTIFICATION_SYSTEM_E2E_TEST_REPORT.md",
]

def remove_archived_files(dry_run=True):
    """Remove files that have been verified as archived."""
    print("=" * 80)
    if dry_run:
        print("DRY RUN MODE - No files will be deleted")
    else:
        print("REMOVING ARCHIVED FILES")
    print("=" * 80)
    print()
    
    removed_count = 0
    skipped_count = 0
    
    for file_path in VERIFIED_ARCHIVED_FILES:
        path = Path(file_path)
        
        if path.exists():
            if dry_run:
                print(f"[DRY RUN] Would remove: {file_path}")
            else:
                try:
                    path.unlink()
                    print(f"✓ Removed: {file_path}")
                    removed_count += 1
                except Exception as e:
                    print(f"✗ Error removing {file_path}: {e}")
        else:
            print(f"⊘ Already removed: {file_path}")
            skipped_count += 1
    
    print()
    print("=" * 80)
    if dry_run:
        print(f"DRY RUN COMPLETE")
        print(f"Files that would be removed: {len(VERIFIED_ARCHIVED_FILES) - skipped_count}")
        print(f"Files already removed: {skipped_count}")
    else:
        print(f"REMOVAL COMPLETE")
        print(f"Files removed: {removed_count}")
        print(f"Files already removed: {skipped_count}")
        print(f"Total processed: {len(VERIFIED_ARCHIVED_FILES)}")
    print("=" * 80)
    
    return removed_count if not dry_run else 0

if __name__ == "__main__":
    import sys
    
    # Check for --execute flag
    execute = "--execute" in sys.argv
    
    if execute:
        print("\n⚠️  WARNING: This will permanently delete files!")
        print("Press Ctrl+C to cancel, or Enter to continue...")
        try:
            input()
        except KeyboardInterrupt:
            print("\nCancelled.")
            sys.exit(0)
    
    removed = remove_archived_files(dry_run=not execute)
    
    if not execute:
        print("\nTo actually remove files, run with --execute flag:")
        print("  python3 remove-archived-files.py --execute")
