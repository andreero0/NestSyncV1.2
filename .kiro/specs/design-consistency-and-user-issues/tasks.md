# Implementation Plan

## Phase 1: Critical User Issues (P0)

- [x] 1. Fix child selection state management
  - Create ChildSelectionContext with persistent storage integration
  - Implement useChildSelection hook with loading and error states
  - Update app/_layout.tsx to wrap application with ChildSelectionProvider
  - Refactor dashboard (app/(tabs)/index.tsx) to use context instead of local state
  - Update FAB modal (QuickLogModal) to consume context for selected child
  - Add validation to reset selection if child no longer exists
  - _Requirements: 1.1_

- [x] 2. Fix subscription cancellation functionality
  - Investigate GraphQL CANCEL_SUBSCRIPTION_MUTATION and backend endpoint
  - Add confirmation Alert dialog before cancellation with clear messaging
  - Implement loading state with ActivityIndicator during cancellation
  - Add comprehensive error handling for network, API, and business logic errors
  - Add success message and refetch subscription data after cancellation
  - Update button styling to show disabled state during loading
  - Test cancellation flow end-to-end with various error scenarios
  - _Requirements: 1.2_

- [x] 3. Add missing back buttons to screens
  - Add Stack.Screen configuration to app/add-order.tsx with headerShown: true
  - Add Stack.Screen configuration to app/view-all-items.tsx with headerShown: true
  - Add Stack.Screen configuration to app/setup-new-item.tsx with headerShown: true
  - Apply consistent header styling using design system colors
  - Test back navigation on iOS and Android platforms
  - _Requirements: 1.3_

- [x] 4. Remove placeholder reorder card from dashboard
  - Remove Smart Order Suggestions card component from dashboard
  - Verify reorder functionality accessible via Quick Actions "Reorder" button
  - Test dashboard layout and spacing without placeholder card
  - _Requirements: 1.4_

## Phase 2: User Experience Improvements (P1)

- [x] 5. Fix child name text display
  - Update ChildSelector component to add numberOfLines={1} and ellipsizeMode="tail"
  - Adjust container width constraints (minWidth: 120, maxWidth: 200)
  - Add flexShrink: 1 to text style for proper text wrapping
  - Test with various name lengths (short, medium, long names like "Damilare", "Christopher")
  - Verify no inappropriate line breaks within names
  - _Requirements: 2.1_

- [x] 6. Standardize button styling across application
  - Audit all button implementations across screens
  - Document current button variations and inconsistencies
  - Update all buttons to use NestSyncColors design tokens
  - Ensure all buttons have minimum 48px touch target height
  - Apply consistent border radius (12px for primary buttons)
  - Test button consistency across all screens
  - _Requirements: 2.2_

- [x] 7. Add demo content indicators and empty states
  - Add demo badges to any remaining placeholder content
  - Create empty state components for features without data
  - Test clarity of demo vs real content distinction
  - _Requirements: 2.3_

## Phase 3: Trial Banner Logic and Components

- [x] 8. Create Trial Banner Logic module
  - Create NestSync-frontend/components/subscription/TrialBannerLogic.ts
  - Define TypeScript interfaces for SubscriptionState and TrialProgress
  - Implement isFreeTrialUser type guard function
  - Implement isSubscribedTrialUser type guard function
  - Implement isActivePaidUser type guard function
  - Implement determineBannerType function with all state checks
  - Add comprehensive JSDoc documentation for all exports
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 8.1 Write unit tests for Trial Banner Logic
  - Test isFreeTrialUser with various subscription states
  - Test isSubscribedTrialUser with trialing and active states
  - Test isActivePaidUser with different subscription statuses
  - Test determineBannerType returns correct banner type for each state
  - Test edge cases (null values, missing properties)
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 9. Create SubscribedTrialBanner component
  - Create NestSync-frontend/components/subscription/SubscribedTrialBanner.tsx
  - Implement success-themed styling with green gradient background
  - Add checkmark circle icon in white color
  - Display activation countdown messaging with days until plan activates
  - Show plan name and tax-inclusive pricing information
  - Display provincial tax breakdown (GST/PST/HST) based on user province
  - Add "Manage" button with 48px minimum touch target
  - Add accessibility labels (accessibilityRole, accessibilityLabel, accessibilityHint)
  - Apply 4px base unit spacing system throughout component
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

- [x] 10. Refactor TrialCountdownBanner component
  - Import TrialBannerLogic module functions
  - Update visibility logic to use determineBannerType function
  - Add conditional rendering for SubscribedTrialBanner when bannerType is 'subscribed-trial'
  - Remove contradictory "Already subscribed" messaging from free trial banner
  - Update upgrade button to have minimum 48px touch target height
  - Update dismiss button to have minimum 48px touch target
  - Add tax-inclusive pricing display with Canadian provincial tax calculation
  - Show provincial tax name (GST/PST/HST) and percentage
  - Add accessibility attributes to all interactive elements
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 11. Create Canadian tax calculation utility
  - Create NestSync-frontend/lib/utils/canadianTax.ts
  - Define ProvincialTax interface with all tax properties
  - Implement CANADIAN_TAX_RATES constant with all provinces
  - Create calculateTaxAmount function for price calculations
  - Create formatTaxDisplay function for user-facing tax strings
  - Add fallback for unknown provinces
  - _Requirements: 4.5, 5.5, 10.1, 10.2, 10.3, 10.4, 10.5_

## Phase 4: Design System Compliance

- [x] 12. Conduct design system audit with Playwright
  - Set up Playwright MCP for screenshot capture
  - Capture reference screen screenshots (home, settings, onboarding)
  - Capture inconsistent screen screenshots (premium upgrade, reorder, size prediction, payments)
  - Extract design tokens from reference screens (colors, typography, spacing, shadows, borders)
  - Generate design audit report comparing screens against reference tokens
  - Calculate compliance scores for each screen
  - Document specific visual gaps and inconsistencies
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 13. Align premium upgrade flow with design system
  - Audit all premium upgrade flow components for design inconsistencies
  - Replace hardcoded colors with NestSyncColors design tokens
  - Update typography to match reference screens (sizes and weights)
  - Fix spacing to use 4px base unit system throughout
  - Apply consistent shadows using design system shadow tokens
  - Update border radius to match design system (12px for cards)
  - Ensure all buttons have 48px minimum touch target height
  - Fix icon styling and consistency (size, colors)
  - _Requirements: 6.1, 6.5, 6.6, 6.7_

- [x] 14. Align reorder flow with design system
  - Audit all reorder flow components for design inconsistencies
  - Replace hardcoded styles with design system tokens
  - Update typography hierarchy to match reference screens
  - Fix spacing and layout to use 4px base unit system
  - Apply proper shadows and borders using design tokens
  - Update buttons to match design system with 48px touch targets
  - Match interaction patterns from onboarding screens
  - _Requirements: 6.2, 6.5, 6.6, 6.7_

- [x] 15. Align size prediction interface with design system
  - Audit size prediction components for design inconsistencies
  - Apply design system tokens for colors, typography, and spacing
  - Update iconography to match core navigation patterns
  - Ensure consistent card styling with design system
  - Update buttons to have 48px minimum touch targets
  - _Requirements: 6.3, 6.5, 6.6, 6.7_

- [x] 16. Align payment screens with design system
  - Audit all payment-related screens for design inconsistencies
  - Replace generic "vanilla HTML" styles with design system tokens
  - Match visual polish of reference screens (home, settings, onboarding)
  - Ensure consistent form styling using design tokens
  - Update buttons to have 48px minimum touch targets
  - Apply consistent spacing using 4px base unit system
  - _Requirements: 6.4, 6.5, 6.6, 6.7_

## Phase 5: P2 Issues and Polish

- [x] 17. Fix order card design inconsistencies
  - Review order card badge styling against design system tokens
  - Update PENDING status badge to match design system
  - Ensure consistent card styling across order history
  - Test visual consistency with reference screens
  - _Requirements: 2.4_

- [x] 18. Fix recommendation card design
  - Apply consistent card styling to recommendation cards
  - Match design patterns from reference screens
  - Ensure proper spacing using 4px base unit
  - Test visual consistency
  - _Requirements: 2.4_

- [x] 19. Fix tab navigation rendering
  - Ensure scroll indicators visible on Size Guide tabs
  - Review tab styling against design system
  - Test tab navigation on iOS and Android
  - Verify clear visual feedback for active tab
  - _Requirements: 2.5_

- [x] 20. Fix plan cards design
  - Apply design system tokens to subscription plan cards
  - Ensure consistent styling with other cards
  - Update spacing to use 4px base unit
  - Test visual consistency
  - _Requirements: 2.4_

## Phase 6: Testing and Documentation

- [x] 21. Create Playwright visual regression tests
  - Create test for free trial banner state with screenshot baseline
  - Create test for subscribed trial banner state with screenshot baseline
  - Create test for active paid user (no banner) with screenshot baseline
  - Create test for expired trial state with screenshot baseline
  - Create tests for premium upgrade flow screens with baselines
  - Create tests for reorder flow screens with baselines
  - Create tests for size prediction screens with baselines
  - Create tests for payment screens with baselines
  - _Requirements: 8.1, 8.2_

- [x] 22. Create design system compliance validation tests
  - Create test to validate color usage against design tokens
  - Create test to validate typography against design system specifications
  - Create test to validate spacing against 4px base unit system
  - Create test to validate touch target sizes meet 48px minimum
  - Create test for Canadian tax calculations for all provinces
  - _Requirements: 8.3, 8.4, 8.5, 8.6, 8.7_

- [x] 23. Create accessibility compliance tests
  - Test accessibility labels for all interactive elements
  - Test accessibility hints describe interaction results
  - Validate all touch targets meet 48px minimum size
  - Test keyboard navigation on web platform
  - Verify WCAG AA color contrast compliance (4.5:1 minimum)
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 24. Perform manual device testing
  - Test on iOS physical device for all user flows
  - Test on Android physical device for all user flows
  - Test all subscription states (free trial, subscribed trial, active paid, expired)
  - Test Canadian tax calculations for multiple provinces
  - Verify no regressions in existing functionality
  - Test child selection persistence across app restarts
  - Test subscription cancellation flow end-to-end
  - _Requirements: All requirements_

- [x] 25. Create design system compliance documentation
  - Generate design system compliance checklist with all token values
  - Create component usage guidelines with code examples
  - Archive before and after screenshots to design-documentation/validation/
  - Create comprehensive design audit report with compliance scores
  - Document lessons learned for maintaining design consistency
  - Update design system documentation with new patterns
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

## Phase 7: Final Validation and Merge

- [x] 26. Final validation and merge preparation
  - Run full test suite (unit tests, integration tests, Playwright tests)
  - Perform final manual smoke testing on iOS and Android
  - Verify all acceptance criteria met for all requirements
  - Check for any regressions in existing functionality
  - Review all code changes for quality and consistency
  - Update documentation with any final changes
  - Create pull request with comprehensive description
  - Address code review feedback
  - Merge to main branch
  - _Requirements: All requirements_
