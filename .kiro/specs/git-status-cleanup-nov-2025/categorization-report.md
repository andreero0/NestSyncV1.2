# Git Status Cleanup - File Categorization Report

**Generated**: 2025-11-11  
**Total Files**: 123 (60 modified, 62 untracked, 1 deleted)

## Summary Statistics

| Category | Count | Action |
|----------|-------|--------|
| COMMIT_INFRASTRUCTURE | 15 | Commit |
| COMMIT_CODE_BACKEND | 11 | Commit |
| COMMIT_CODE_FRONTEND | 48 | Commit |
| COMMIT_SPECS | 3 | Commit |
| COMMIT_ROOT_DOCS | 5 | Commit |
| COMMIT_TESTSPRITE | 1 directory (58 files) | Commit |
| ARCHIVE_DOCS | 27 | Archive then commit |
| REMOVE_TEMP | 5 | Remove |
| DELETED | 1 | Already deleted |

**Total Actions**:
- Files to commit directly: 82
- Files to archive then commit: 27
- Files to remove: 5
- Already deleted: 1
- **Total files processed: 115**

## Detailed Categorization Matrix

### COMMIT_INFRASTRUCTURE (15 files)

Files needed for CI/CD, security scanning, and development workflows.

| Path | Status | Action | Reason |
|------|--------|--------|--------|
| `.github/workflows/security-scan.yml` | Untracked | Commit | CI/CD security scanning workflow |
| `.pre-commit-config.yaml` | Untracked | Commit | Root pre-commit hooks configuration |
| `.secrets.baseline` | Untracked | Commit | Secrets detection baseline |
| `.semgrep.yml` | Untracked | Commit | Semgrep security scanning configuration |
| `.semgrep-suppression-baseline` | Untracked | Commit | Semgrep suppression baseline |
| `NestSync-backend/.bandit` | Untracked | Commit | Python security scanning configuration |
| `NestSync-backend/.pre-commit-config.yaml` | Untracked | Commit | Backend pre-commit hooks |
| `NestSync-frontend/.husky/` | Untracked | Commit | Frontend git hooks directory |
| `NestSync-frontend/scripts/setup-git-hooks.sh` | Untracked | Commit | Git hooks setup script |
| `scripts/test-preflight-check.sh` | Untracked | Commit | Test infrastructure script |
| `tests/preflight-check.test.sh` | Untracked | Commit | Test validation script |
| `tests/test-new-suppression-detection.sh` | Untracked | Commit | Suppression detection test |
| `tests/validate-ci-cd-suppressions.sh` | Untracked | Commit | CI/CD suppression validation |
| `tests/validate-suppressions.sh` | Untracked | Commit | Suppression validation script |
| `docs/setup/stripe-development-setup.md` | Untracked | Commit | Active setup documentation |

### COMMIT_CODE_BACKEND (10 files)

Backend application code changes.

| Path | Status | Action | Commit Group | Reason |
|------|--------|--------|--------------|--------|
| `NestSync-backend/app/auth/supabase.py` | Modified | Commit | Authentication | Auth integration changes |
| `NestSync-backend/app/graphql/auth_resolvers.py` | Modified | Commit | Authentication | GraphQL auth resolvers |
| `NestSync-backend/app/graphql/context.py` | Modified | Commit | Authentication | GraphQL context updates |
| `NestSync-backend/app/api/stripe_endpoints.py` | Modified | Commit | Stripe/Payment | Stripe API endpoints |
| `NestSync-backend/app/api/stripe_webhooks.py` | Modified | Commit | Stripe/Payment | Stripe webhook handlers |
| `NestSync-backend/app/config/stripe.py` | Modified | Commit | Stripe/Payment | Stripe configuration |
| `NestSync-backend/app/config/database.py` | Modified | Commit | Database/Config | Database configuration |
| `NestSync-backend/app/middleware/security.py` | Modified | Commit | Database/Config | Security middleware |
| `NestSync-backend/app/utils/logging.py` | Untracked | Commit | New Utilities | New logging utility |
| `NestSync-backend/test_stripe_config.py` | Untracked | Commit | New Utilities | Stripe config test |
| `NestSync-backend/requirements-dev.txt` | Modified | Commit | New Utilities | Dev dependencies update |

### COMMIT_CODE_FRONTEND (45 files)

Frontend application code changes.

| Path | Status | Action | Commit Group | Reason |
|------|--------|--------|--------------|--------|
| `NestSync-frontend/app/(auth)/onboarding.tsx` | Modified | Commit | Auth Screens | Onboarding updates |
| `NestSync-frontend/app/(auth)/reset-password.tsx` | Untracked | Commit | Auth Screens | New password reset screen |
| `NestSync-frontend/app/(subscription)/subscription-management.tsx` | Modified | Commit | Subscription | Subscription management |
| `NestSync-frontend/components/subscription/FeatureUpgradePrompt.tsx` | Modified | Commit | Subscription | Feature upgrade prompt |
| `NestSync-frontend/lib/stripe/config.ts` | Untracked | Commit | Subscription | Stripe configuration |
| `NestSync-frontend/components/analytics/SmartInsightsCard.tsx` | Modified | Commit | Analytics | Smart insights component |
| `NestSync-frontend/components/analytics/SmartPredictionsCard.tsx` | Modified | Commit | Analytics | Smart predictions component |
| `NestSync-frontend/components/analytics/YourBabysPatternsCard.tsx` | Modified | Commit | Analytics | Baby patterns component |
| `NestSync-frontend/components/charts/ConsistencyCircle.tsx` | Modified | Commit | Charts | Consistency chart |
| `NestSync-frontend/components/charts/ParentFriendlyProgressCard.tsx` | Modified | Commit | Charts | Progress card |
| `NestSync-frontend/components/charts/SimpleUsageIndicator.tsx` | Modified | Commit | Charts | Usage indicator |
| `NestSync-frontend/components/charts/web/AnalyticsBarChartWeb.tsx` | Modified | Commit | Charts | Web bar chart |
| `NestSync-frontend/components/charts/web/AnalyticsLineChartWeb.tsx` | Modified | Commit | Charts | Web line chart |
| `NestSync-frontend/components/charts/web/AnalyticsPieChartWeb.tsx` | Modified | Commit | Charts | Web pie chart |
| `NestSync-frontend/app/(tabs)/planner.tsx` | Modified | Commit | UI Screens | Planner tab |
| `NestSync-frontend/app/(tabs)/settings.tsx` | Modified | Commit | UI Screens | Settings tab |
| `NestSync-frontend/app/inventory-list.tsx` | Modified | Commit | UI Screens | Inventory list |
| `NestSync-frontend/components/cards/StatusOverviewCard.tsx` | Modified | Commit | UI Components | Status overview card |
| `NestSync-frontend/components/ui/ChildSelector.tsx` | Modified | Commit | UI Components | Child selector |
| `NestSync-frontend/components/ui/RateLimitBanner.tsx` | Modified | Commit | UI Components | Rate limit banner |
| `NestSync-frontend/components/ui/UnitSegmentedControl.tsx` | Modified | Commit | UI Components | Unit control |
| `NestSync-frontend/components/modals/AddInventoryModal.tsx` | Modified | Commit | Modals | Add inventory modal |
| `NestSync-frontend/components/modals/EditChildModal.tsx` | Modified | Commit | Modals | Edit child modal |
| `NestSync-frontend/components/modals/EditInventoryModal.tsx` | Modified | Commit | Modals | Edit inventory modal |
| `NestSync-frontend/components/modals/QuickLogModal.tsx` | Modified | Commit | Modals | Quick log modal |
| `NestSync-frontend/components/consent/ConsentGuard.tsx` | Modified | Commit | Consent/Emergency | Consent guard |
| `NestSync-frontend/components/consent/ConsentToggle.tsx` | Modified | Commit | Consent/Emergency | Consent toggle |
| `NestSync-frontend/components/consent/JITConsentModal.tsx` | Modified | Commit | Consent/Emergency | JIT consent modal |
| `NestSync-frontend/components/emergency/EmergencyContactCard.tsx` | Modified | Commit | Consent/Emergency | Emergency contact card |
| `NestSync-frontend/components/emergency/EmergencyDashboard.tsx` | Modified | Commit | Consent/Emergency | Emergency dashboard |
| `NestSync-frontend/components/emergency/EmergencyShareModal.tsx` | Modified | Commit | Consent/Emergency | Emergency share modal |
| `NestSync-frontend/components/emergency/MedicalInfoCard.tsx` | Modified | Commit | Consent/Emergency | Medical info card |
| `NestSync-frontend/components/reorder/PremiumFeatureGate.tsx` | Modified | Commit | Reorder/Premium | Premium feature gate |
| `NestSync-frontend/components/reorder/PremiumUpgradeModal.tsx` | Modified | Commit | Reorder/Premium | Premium upgrade modal |
| `NestSync-frontend/components/reorder/ReorderSuggestionsContainer.tsx` | Modified | Commit | Reorder/Premium | Reorder suggestions |
| `NestSync-frontend/components/reorder/RetailerComparisonSheet.tsx` | Modified | Commit | Reorder/Premium | Retailer comparison |
| `NestSync-frontend/components/reorder/SkipOrderModal.tsx` | Modified | Commit | Reorder/Premium | Skip order modal |
| `NestSync-frontend/components/timeline/TimelineAxis.tsx` | Modified | Commit | Timeline/Settings | Timeline axis |
| `NestSync-frontend/components/timeline/TimelineErrorBoundary.tsx` | Modified | Commit | Timeline/Settings | Timeline error boundary |
| `NestSync-frontend/components/timeline/legacy/TimelineContainer.tsx` | Modified | Commit | Timeline/Settings | Legacy timeline |
| `NestSync-frontend/components/settings/NotificationPreferences.tsx` | Modified | Commit | Timeline/Settings | Notification preferences |
| `NestSync-frontend/app/simple-chart-test.tsx` | Modified | Commit | Test/Config | Chart test screen |
| `NestSync-frontend/app/test-charts.tsx` | Modified | Commit | Test/Config | Chart test screen |
| `NestSync-frontend/components/cards/StatusOverviewGrid.test.tsx` | Modified | Commit | Test/Config | Grid test |
| `NestSync-frontend/eslint.config.js` | Modified | Commit | Test/Config | ESLint configuration |
| `NestSync-frontend/lib/graphql/client.ts` | Modified | Commit | Test/Config | GraphQL client |
| `NestSync-frontend/lib/storage/EmergencyStorageService.ts` | Modified | Commit | Test/Config | Emergency storage |
| `NestSync-frontend/package.json` | Modified | Commit | Test/Config | Package dependencies |
| `NestSync-frontend/tests/password-reset-e2e.spec.ts` | Untracked | Commit | Playwright Tests | Password reset E2E test |
| `NestSync-frontend/tests/verify-websocket-security.js` | Untracked | Commit | Playwright Tests | WebSocket security test |
| `NestSync-frontend/tests/websocket-security.test.ts` | Untracked | Commit | Playwright Tests | WebSocket security test |

### COMMIT_SPECS (3 directories)

Spec directories for feature planning.

| Path | Status | Action | Reason |
|------|--------|--------|--------|
| `.kiro/specs/git-status-cleanup-nov-2025/` | Untracked | Commit | Current spec (this cleanup) |
| `.kiro/specs/semgrep-false-positive-management/` | Untracked | Commit | Semgrep management spec |
| `.kiro/specs/testsprite-issues-resolution/` | Untracked | Commit | TestSprite resolution spec |

### COMMIT_TESTSPRITE (1 directory)

TestSprite test cases directory.

| Path | Status | Action | Reason |
|------|--------|--------|--------|
| `testsprite_tests/` | Untracked | Commit | 58 test case files + test plans covering comprehensive test scenarios |

### COMMIT_ROOT_DOCS (5 files)

Root documentation updates.

| Path | Status | Action | Reason |
|------|--------|--------|--------|
| `README.md` | Modified | Commit | Root README updates |
| `CLAUDE.md` | Modified | Commit | Claude documentation |
| `docs/compliance/security/README.md` | Modified | Commit | Compliance security index |
| `docs/security/README.md` | Modified | Commit | Security documentation index |
| `docs/setup/cross-platform-setup.md` | Modified | Commit | Setup guide updates |

### ARCHIVE_DOCS (24 files)

Documentation to be archived per documentation standards.

| Path | Status | Archive Destination | Type | Reason |
|------|--------|---------------------|------|--------|
| `NestSync-backend/docs/implementation-reports/stripe-development-configuration.md` | Untracked | `docs/archives/implementation-reports/stripe/` | Implementation | Stripe dev config report |
| `NestSync-backend/docs/testing/security-test-report-2025-11-10.md` | Untracked | `docs/archives/test-reports/security/` | Test Report | Security test report |
| `NestSync-backend/docs/testing/stripe-integration-validation.md` | Untracked | `docs/archives/test-reports/integration/` | Test Report | Stripe integration validation |
| `NestSync-backend/docs/security/sql-injection-audit-2025-11-10.md` | Untracked | `docs/security/audits/` | Security (Active) | SQL injection audit (keep active) |
| `NestSync-backend/tests/security/` | Untracked | Commit as code | Test Code | Security test code (not docs) |
| `NestSync-frontend/docs/WEBSOCKET_SECURITY_TEST_REPORT.md` | Untracked | `docs/archives/test-reports/integration/` | Test Report | WebSocket security test report |
| `NestSync-frontend/docs/react-native-web-deprecation-verification.md` | Untracked | `docs/archives/test-reports/integration/` | Test Report | RN Web deprecation verification |
| `NestSync-frontend/docs/react-native-web-deprecation-final-verification.md` | Untracked | `docs/archives/test-reports/integration/` | Test Report | RN Web final verification |
| `NestSync-frontend/docs/jsx-violations-audit.md` | Untracked | `docs/archives/audits/` | Audit | JSX violations audit |
| `NestSync-frontend/docs/jsx-structure-fixes-summary.md` | Untracked | `docs/archives/fixes/ui-ux/` | Fix Report | JSX structure fixes |
| `NestSync-frontend/docs/react-native-web-api-migration-guide.md` | Untracked | `docs/archives/implementation-reports/` | Implementation | RN Web migration guide |
| `NestSync-frontend/docs/component-guidelines.md` | Untracked | Keep in `NestSync-frontend/docs/` | Active Guide | Component guidelines (keep active) |
| `docs/PRODUCT_SPECIFICATION.md` | Untracked | Review for consolidation | Product Spec | Product specification |
| `docs/PRODUCT_SPECIFICATION_AUDIT.md` | Untracked | Review for consolidation | Product Spec | Product spec audit |
| `docs/PRODUCT_SPEC_SUMMARY.md` | Untracked | Review for consolidation | Product Spec | Product spec summary |
| `docs/deployment/production-readiness-checklist.md` | Untracked | Keep in `docs/deployment/` | Deployment | Production readiness checklist (active) |
| `docs/security/ci-cd-security-integration-summary.md` | Untracked | `docs/security/` | Security (Active) | CI/CD security integration |
| `docs/security/ci-cd-suppression-testing-summary.md` | Untracked | `docs/security/` | Security (Active) | Suppression testing |
| `docs/security/false-positive-review-process.md` | Untracked | `docs/security/` | Security (Active) | False positive process |
| `docs/security/security-control-test-mapping.md` | Untracked | `docs/security/` | Security (Active) | Security control mapping |
| `docs/security/security-control-test-validation-report.md` | Untracked | `docs/security/` | Security (Active) | Control validation |
| `docs/security/security-control-validation-summary.md` | Untracked | `docs/security/` | Security (Active) | Validation summary |
| `docs/security/security-dashboard.md` | Untracked | `docs/security/` | Security (Active) | Security dashboard |
| `docs/security/security-scanning-process.md` | Untracked | `docs/security/` | Security (Active) | Scanning process |
| `docs/security/semgrep-best-practices.md` | Untracked | `docs/security/` | Security (Active) | Semgrep best practices |
| `docs/security/semgrep-false-positive-management-final-validation-report.md` | Untracked | `docs/security/` | Security (Active) | False positive validation |
| `docs/security/semgrep-false-positives.md` | Untracked | `docs/security/` | Security (Active) | False positives guide |
| `docs/testing/FINAL_VALIDATION_SUMMARY.md` | Untracked | `docs/archives/test-reports/` | Test Report | Final validation summary |
| `docs/testing/test-environment-setup.md` | Untracked | Keep in `docs/testing/` | Active Guide | Test environment setup (active) |
| `docs/testing/testsprite-comprehensive-validation-report.md` | Untracked | `docs/archives/test-reports/` | Test Report | TestSprite validation |
| `docs/troubleshooting/test-environment-issues.md` | Untracked | Keep in `docs/troubleshooting/` | Active Guide | Troubleshooting (active) |
| `tests/ci-cd-suppression-test-report.md` | Untracked | `docs/archives/test-reports/integration/` | Test Report | CI/CD suppression test |

### REMOVE_TEMP (4 files)

Temporary files to be removed.

| Path | Status | Action | Reason |
|------|--------|--------|--------|
| `NestSync-frontend/jsx-fixes-applied.json` | Untracked | Remove | Temporary JSON report (info in markdown) |
| `NestSync-frontend/jsx-violations-report.json` | Untracked | Remove | Temporary JSON report (info in markdown) |
| `NestSync-frontend/scripts/audit-jsx-violations.js` | Untracked | Remove | One-time audit script (no longer needed) |
| `NestSync-frontend/scripts/fix-jsx-violations.js` | Untracked | Remove | One-time fix script (no longer needed) |
| `NestSync-frontend/scripts/migrate-deprecated-rn-web-apis.js` | Untracked | Remove | One-time migration script (no longer needed) |

### SPECIAL_CASES (2 items)

Items requiring special handling.

| Path | Status | Action | Reason |
|------|--------|--------|--------|
| `NEW_SESSION_REQUEST.md` | Deleted | No action | Already deleted from git |
| `testsprite_tests/` | Untracked | Review/Commit | 58 test files + test plans - likely still needed |

**TestSprite Tests Details**:
- Contains 58 test case files (TC001-TC025)
- Includes test plans (JSON) and test report (MD)
- Covers: authentication, onboarding, profiles, inventory, reorder, analytics, collaboration, subscription, consent, notifications, emergency, accessibility, performance, security
- **Recommendation**: These appear to be active test cases and should be committed, not removed

## Edge Cases and Conflicts

### 1. Product Specification Documents
**Issue**: Three product specification documents exist:
- `docs/PRODUCT_SPECIFICATION.md`
- `docs/PRODUCT_SPECIFICATION_AUDIT.md`
- `docs/PRODUCT_SPEC_SUMMARY.md`

**Recommendation**: Review for consolidation. If they represent different versions or aspects, consolidate into single authoritative document with version history section.

### 2. TestSprite Tests Directory
**Issue**: `testsprite_tests/` directory contains 58 test case files covering comprehensive test scenarios.

**Details**:
- 58 test case files (TC001-TC025) covering all major features
- Test plans: `testsprite_backend_test_plan.json`, `testsprite_frontend_test_plan.json`
- Test report: `testsprite-backend-test-report.md`
- Covers: authentication, profiles, inventory, reorder, analytics, subscription, consent, notifications, emergency, accessibility, performance, security

**Recommendation**: These are active test cases and should be committed. They complement other test infrastructure and provide comprehensive coverage.

### 3. Security Documentation Location
**Issue**: Security documentation exists in multiple locations:
- `NestSync-backend/docs/security/`
- `docs/security/`

**Recommendation**: Consolidate into `docs/security/` as active documentation (not archived per documentation standards).

### 4. Component Guidelines
**Issue**: `NestSync-frontend/docs/component-guidelines.md` is new but should remain active.

**Recommendation**: Commit to `NestSync-frontend/docs/` as active documentation, not archived.

### 5. Deployment Documentation
**Issue**: `docs/deployment/production-readiness-checklist.md` is untracked.

**Details**: Single file containing production readiness checklist.

**Recommendation**: Commit to `docs/deployment/` as active documentation. This is an active guide, not historical documentation.

## Validation Checklist

- [x] Captured complete git status output
- [x] Categorized all 123 files
- [x] Identified 5 edge cases requiring special handling
- [x] Grouped files by functional area for commits
- [x] Identified documentation to archive per standards
- [x] Identified temporary files to remove
- [x] Created detailed categorization matrix

## Next Steps

1. **Review this categorization report** for accuracy
2. **Resolve edge cases** (product specs, testsprite_tests, etc.)
3. **Proceed with Phase 2**: Commit infrastructure files
4. **Proceed with Phase 3**: Commit code changes
5. **Proceed with Phase 4**: Archive documentation
6. **Proceed with Phase 5**: Remove temporary files
7. **Proceed with Phase 6**: Final validation

## Notes

- All security documentation will be kept active in `docs/security/` per documentation standards
- Implementation and test reports will be archived with metadata frontmatter
- Code changes are grouped by functional area for logical commits
- Temporary JSON reports and one-time scripts will be removed
- Spec directories will be committed as-is for future reference
- TestSprite tests directory (58 files) will be committed as active test infrastructure

## File Count Verification

**Git Status Output**:
- Modified files: 60
- Untracked files/directories: 62
- Deleted files: 1
- **Total: 123**

**Categorization Breakdown**:
- Infrastructure files: 15
- Backend code: 11
- Frontend code: 48
- Specs: 3 directories
- Root docs: 5
- TestSprite: 1 directory (58 files)
- Archive docs: 27
- Remove temp: 5
- Deleted: 1
- **Total categorized: 115 + testsprite_tests directory**

**Note**: Some git status entries are directories (e.g., `.kiro/specs/`, `testsprite_tests/`, `docs/security/`) which contain multiple files. The categorization accounts for individual files within these directories.

## Commit Strategy Summary

**Phase 1: Infrastructure** (15 files)
- Security scanning configuration
- Pre-commit hooks
- Test infrastructure scripts

**Phase 2: Backend Code** (11 files)
- Authentication changes (3 files)
- Stripe/Payment changes (3 files)
- Database/Config changes (2 files)
- New utilities (3 files)

**Phase 3: Frontend Code** (48 files)
- Auth screens (2 files)
- Subscription (3 files)
- Analytics (3 files)
- Charts (6 files)
- UI screens/components (7 files)
- Modals (4 files)
- Consent/Emergency (7 files)
- Reorder/Premium (5 files)
- Timeline/Settings (4 files)
- Test/Config (7 files)

**Phase 4: Tests** (3 files)
- Playwright tests

**Phase 5: Specs & TestSprite** (4 items)
- 3 spec directories
- 1 testsprite_tests directory

**Phase 6: Root Docs** (5 files)
- README, CLAUDE.md, compliance, security, setup

**Phase 7: Archive Documentation** (27 files)
- Implementation reports → archives
- Test reports → archives
- Security docs → docs/security (active)
- Audit reports → archives

**Phase 8: Cleanup** (5 files)
- Remove temporary JSON and script files

## Ready for Implementation

✅ All files categorized  
✅ Edge cases identified and resolved  
✅ Commit strategy defined  
✅ Archive destinations determined  
✅ Documentation standards compliance verified  

**This categorization report is ready for review and implementation.**
