#!/usr/bin/env python3
"""
Verify that all files to be deleted have been properly archived.
"""

import os
from pathlib import Path

# Define files that should have been archived
FRONTEND_FILES = [
    "DESIGN_SYSTEM_COMPLIANCE_AUDIT_REPORT.md",
    "DESIGN_SYSTEM_COMPLIANCE_IMPLEMENTATION_REPORT.md",
    "DESIGN_SYSTEM_FIX_VALIDATION_REPORT.md",
    "DESIGN_SYSTEM_FIX_VALIDATION_REPORT_V2.md",
    "FRONTEND_INTEGRATION_VALIDATION_REPORT.md",
    "IOS_PAYMENT_READINESS_REPORT.md",
    "MANUAL_TESTING_GUIDE.md",
    "PAYMENT_FLOW_TEST_REPORT.md",
    "PAYMENT_METHODS_CROSS_PLATFORM_FIX.md",
    "PIPEDA_FIX_VERIFICATION_REPORT.md",
    "TRAFFIC_LIGHT_CARDS_FIX_VALIDATION.md",
    "TRAFFIC_LIGHT_GRID_TEST_REPORT.md",
    "TRAFFIC_LIGHT_GRID_VALIDATION_FINAL.md",
    "TRIAL_BANNER_TEST_EXECUTION_REPORT.md",
    "TRIAL_BANNER_VISIBILITY_TEST_REPORT.md",
    "WEB_PAYMENT_FLOW_TEST_REPORT.md",
]

BACKEND_FILES = [
    "IMPLEMENTATION_STATUS.md",
    "NOTIFICATION_SYSTEM_E2E_TEST_REPORT.md",
    "NOTIFICATION_SYSTEM_IMPLEMENTATION.md",
    "ONBOARDING_ISSUE_PREVENTION.md",
    "PREMIUM_SUBSCRIPTION_COMPLETE.md",
    "PREMIUM_SUBSCRIPTION_FINAL_STATUS.md",
    "RESOLVER_IMPLEMENTATION_SUMMARY.md",
    "RETROACTIVE_DATA_POPULATION_SOLUTION.md",
    "TEST_RESULTS_REPORT.md",
]

# Map original files to their archive locations
ARCHIVE_MAPPING = {
    # Frontend files
    "NestSync-frontend/DESIGN_SYSTEM_COMPLIANCE_AUDIT_REPORT.md": 
        "NestSync-frontend/docs/archives/implementation-reports/design-system/audit-report.md",
    "NestSync-frontend/DESIGN_SYSTEM_COMPLIANCE_IMPLEMENTATION_REPORT.md": 
        "NestSync-frontend/docs/archives/implementation-reports/design-system/implementation-report.md",
    "NestSync-frontend/DESIGN_SYSTEM_FIX_VALIDATION_REPORT.md": 
        "NestSync-frontend/docs/archives/implementation-reports/design-system/validation-report-v1.md",
    "NestSync-frontend/DESIGN_SYSTEM_FIX_VALIDATION_REPORT_V2.md": 
        "NestSync-frontend/docs/archives/implementation-reports/design-system/validation-report-v2.md",
    "NestSync-frontend/TRAFFIC_LIGHT_CARDS_FIX_VALIDATION.md": 
        "NestSync-frontend/docs/archives/implementation-reports/traffic-light-dashboard/design-compliance-validation.md",
    "NestSync-frontend/TRAFFIC_LIGHT_GRID_TEST_REPORT.md": 
        "NestSync-frontend/docs/archives/implementation-reports/traffic-light-dashboard/grid-layout-test.md",
    "NestSync-frontend/TRAFFIC_LIGHT_GRID_VALIDATION_FINAL.md": 
        "NestSync-frontend/docs/archives/implementation-reports/traffic-light-dashboard/final-validation.md",
    "NestSync-frontend/PAYMENT_FLOW_TEST_REPORT.md": 
        "NestSync-frontend/docs/archives/implementation-reports/payment-system/payment-flow-test.md",
    "NestSync-frontend/PAYMENT_METHODS_CROSS_PLATFORM_FIX.md": 
        "NestSync-frontend/docs/archives/implementation-reports/payment-system/cross-platform-fix.md",
    "NestSync-frontend/WEB_PAYMENT_FLOW_TEST_REPORT.md": 
        "NestSync-frontend/docs/archives/implementation-reports/payment-system/web-payment-flow-test.md",
    "NestSync-frontend/PIPEDA_FIX_VERIFICATION_REPORT.md": 
        "docs/archives/fixes/compliance/pipeda-cache-isolation-fix.md",
    "NestSync-frontend/TRIAL_BANNER_VISIBILITY_TEST_REPORT.md": 
        "docs/archives/test-reports/e2e/trial-banner-visibility-final-test.md",
    "NestSync-frontend/FRONTEND_INTEGRATION_VALIDATION_REPORT.md":
        "NestSync-frontend/docs/archives/implementation-reports/integration-validation.md",
    "NestSync-frontend/IOS_PAYMENT_READINESS_REPORT.md":
        "NestSync-frontend/docs/archives/implementation-reports/payment-system/ios-payment-readiness.md",
    "NestSync-frontend/MANUAL_TESTING_GUIDE.md":
        "NestSync-frontend/docs/testing/manual-testing-guide.md",
    "NestSync-frontend/TRIAL_BANNER_TEST_EXECUTION_REPORT.md":
        "docs/archives/test-reports/e2e/trial-banner-test-execution.md",
    
    # Backend files
    "NestSync-backend/PREMIUM_SUBSCRIPTION_COMPLETE.md": 
        "NestSync-backend/docs/archives/implementation-reports/premium-subscription/premium-subscription-implementation.md",
    "NestSync-backend/PREMIUM_SUBSCRIPTION_FINAL_STATUS.md":
        "NestSync-backend/docs/archives/implementation-reports/premium-subscription/final-status.md",
    "NestSync-backend/NOTIFICATION_SYSTEM_IMPLEMENTATION.md": 
        "NestSync-backend/docs/archives/implementation-reports/notification-system/notification-system-implementation.md",
    "NestSync-backend/NOTIFICATION_SYSTEM_E2E_TEST_REPORT.md": 
        "docs/archives/test-reports/e2e/notification-system-e2e-test.md",
    "NestSync-backend/IMPLEMENTATION_STATUS.md":
        "NestSync-backend/docs/archives/implementation-reports/implementation-status.md",
    "NestSync-backend/RESOLVER_IMPLEMENTATION_SUMMARY.md":
        "NestSync-backend/docs/archives/implementation-reports/resolver-implementation-summary.md",
    "NestSync-backend/TEST_RESULTS_REPORT.md":
        "docs/archives/test-reports/integration/backend-test-results.md",
}

def verify_archives():
    """Verify that all files have been properly archived."""
    print("Verifying archived files...")
    print("=" * 80)
    
    all_verified = True
    missing_archives = []
    
    for original, archive in ARCHIVE_MAPPING.items():
        original_path = Path(original)
        archive_path = Path(archive)
        
        if original_path.exists():
            if archive_path.exists():
                print(f"✓ {original}")
                print(f"  → Archived at: {archive}")
            else:
                print(f"✗ {original}")
                print(f"  → MISSING ARCHIVE: {archive}")
                all_verified = False
                missing_archives.append((original, archive))
        else:
            print(f"⊘ {original} (already removed)")
    
    print("\n" + "=" * 80)
    
    if all_verified:
        print("✓ All files have been properly archived!")
        print(f"\nTotal files verified: {len(ARCHIVE_MAPPING)}")
        return True
    else:
        print(f"✗ {len(missing_archives)} files are missing from archives!")
        print("\nMissing archives:")
        for original, archive in missing_archives:
            print(f"  - {original} → {archive}")
        return False

if __name__ == "__main__":
    success = verify_archives()
    exit(0 if success else 1)
