---
title: "Manual Device Testing Guide - Design Consistency & User Issues"
date: 2025-11-09
category: "testing"
type: "test-guide"
priority: "P0"
status: "active"
platforms: ["ios", "android"]
related_docs:
  - "../../../.kiro/specs/design-consistency-and-user-issues/requirements.md"
  - "../../../.kiro/specs/design-consistency-and-user-issues/design.md"
  - "./VISUAL_REGRESSION_TESTS.md"
  - "./ACCESSIBILITY_COMPLIANCE_TESTS.md"
tags: ["manual-testing", "device-testing", "regression-testing", "subscription", "child-selection"]
---

# Manual Device Testing Guide

## Overview

This guide provides a comprehensive checklist for manually testing the NestSync application on physical iOS and Android devices. The testing focuses on verifying all fixes and improvements from the design consistency and user issues specification.

**Testing Duration**: Approximately 2-3 hours per platform
**Required Devices**: 
- iOS device (iPhone running iOS 14+)
- Android device (running Android 10+)

## Pre-Testing Setup

### Environment Preparation

1. **Build the Application**
   ```bash
   cd NestSync-frontend
   
   # For iOS
   npx expo run:ios --device
   
   # For Android
   npx expo run:android --device
   ```

2. **Prepare Test Accounts**
   - Free trial user account (no subscription)
   - Subscribed trial user account (subscription in trialing status)
   - Active paid user account (active subscription)
   - Expired trial user account

3. **Test Data Setup**
   - Create multiple child profiles with varying name lengths
   - Add inventory items for testing
   - Set up different provincial addresses (ON, BC, AB, QC, etc.)

## Testing Checklist

### Phase 1: Critical User Issues (P0)

#### 1.1 Child Selection State Management

**Requirement**: 1.1 - Child selection persists across components and app restarts

**iOS Testing**:
- [ ] Open the application
- [ ] Navigate to Dashboard
- [ ] Select a child from the child selector
- [ ] Verify selected child name appears in selector
- [ ] Tap the FAB (Floating Action Button)
- [ ] **VERIFY**: Selected child appears in FAB modal (not "Please Select a Child")
- [ ] Log an activity for the selected child
- [ ] Close the app completely (swipe up from app switcher)
- [ ] Reopen the app
- [ ] **VERIFY**: Previously selected child is still selected
- [ ] Navigate to different screens (Inventory, Settings, etc.)
- [ ] Return to Dashboard
- [ ] **VERIFY**: Child selection persists

**Android Testing**:
- [ ] Repeat all iOS steps above
- [ ] Additionally test: Force stop app from Settings > Apps
- [ ] Reopen app
- [ ] **VERIFY**: Child selection persists after force stop

**Edge Cases**:
- [ ] Delete the currently selected child
- [ ] **VERIFY**: App automatically selects first available child
- [ ] Test with only one child profile
- [ ] Test with 5+ child profiles

**Pass Criteria**: ✅ Child selection persists across all components, navigation, and app restarts

---

#### 1.2 Subscription Cancellation Functionality

**Requirement**: 1.2 - Subscription cancellation works correctly with proper error handling

**iOS Testing** (with active subscription):
- [ ] Navigate to Settings > Subscription Management
- [ ] Tap "Cancel Subscription" button
- [ ] **VERIFY**: Confirmation dialog appears with clear messaging
- [ ] Tap "Keep Subscription"
- [ ] **VERIFY**: Dialog dismisses, subscription remains active
- [ ] Tap "Cancel Subscription" again
- [ ] Tap "Cancel Subscription" in dialog
- [ ] **VERIFY**: Loading indicator appears during cancellation
- [ ] **VERIFY**: Success message appears after cancellation
- [ ] **VERIFY**: Subscription status updates to show "Cancels at period end"
- [ ] **VERIFY**: Button changes to disabled state during loading

**Android Testing**:
- [ ] Repeat all iOS steps above

**Error Scenario Testing**:
- [ ] Turn off WiFi/cellular data
- [ ] Attempt to cancel subscription
- [ ] **VERIFY**: Network error message appears
- [ ] Turn on connectivity
- [ ] Try cancellation with expired auth token (if possible)
- [ ] **VERIFY**: Appropriate error message appears

**Pass Criteria**: ✅ Cancellation works with confirmation, loading states, and proper error handling

---

#### 1.3 Missing Back Buttons

**Requirement**: 1.3 - All screens have functional back navigation

**iOS Testing**:
- [ ] Navigate to Dashboard
- [ ] Tap "Add Order" (or navigate to add-order screen)
- [ ] **VERIFY**: Back button appears in header
- [ ] Tap back button
- [ ] **VERIFY**: Returns to previous screen
- [ ] Navigate to "View All Items" screen
- [ ] **VERIFY**: Back button appears in header
- [ ] Tap back button
- [ ] **VERIFY**: Returns to previous screen
- [ ] Navigate to "Setup New Item" screen
- [ ] **VERIFY**: Back button appears in header
- [ ] Tap back button
- [ ] **VERIFY**: Returns to previous screen
- [ ] **VERIFY**: Header styling is consistent across all screens

**Android Testing**:
- [ ] Repeat all iOS steps above
- [ ] Additionally test hardware back button on each screen
- [ ] **VERIFY**: Hardware back button works correctly

**Pass Criteria**: ✅ All screens have visible, functional back buttons with consistent styling

---

#### 1.4 Placeholder Reorder Card

**Requirement**: 1.4 - No confusing placeholder content on dashboard

**iOS Testing**:
- [ ] Navigate to Dashboard
- [ ] **VERIFY**: Smart Order Suggestions placeholder card is removed
- [ ] **VERIFY**: Dashboard layout looks clean without the card
- [ ] Tap Quick Actions "Reorder" button
- [ ] **VERIFY**: Reorder functionality is accessible
- [ ] **VERIFY**: No broken UI or spacing issues

**Android Testing**:
- [ ] Repeat all iOS steps above

**Pass Criteria**: ✅ Placeholder card removed, reorder accessible via Quick Actions

---

### Phase 2: User Experience Improvements (P1)

#### 2.1 Child Name Text Display

**Requirement**: 2.1 - Child names display without inappropriate line breaks

**iOS Testing**:
- [ ] Create child profiles with various name lengths:
  - Short: "Max" (3 chars)
  - Medium: "Emma" (4 chars)
  - Long: "Damilare" (8 chars)
  - Very Long: "Christopher" (11 chars)
  - Extra Long: "Alexander James" (15 chars)
- [ ] Navigate to Dashboard
- [ ] Select each child one by one
- [ ] **VERIFY**: No line breaks within names (e.g., "Damil are")
- [ ] **VERIFY**: Long names show ellipsis if needed
- [ ] **VERIFY**: Names are fully readable
- [ ] Test in portrait and landscape orientations

**Android Testing**:
- [ ] Repeat all iOS steps above
- [ ] Test on different screen sizes if possible

**Pass Criteria**: ✅ All names display correctly without inappropriate breaks

---

#### 2.2 Button Styling Consistency

**Requirement**: 2.2 - Consistent button styling across application

**iOS Testing**:
- [ ] Navigate through all major screens:
  - Dashboard
  - Inventory List
  - Add Inventory Item
  - Settings
  - Profile Settings
  - Subscription Management
  - Reorder Suggestions
  - Size Guide
- [ ] For each screen, verify buttons have:
  - [ ] Consistent colors (using NestSyncColors tokens)
  - [ ] Consistent border radius (12px for primary buttons)
  - [ ] Minimum 48px touch target height
  - [ ] Consistent padding and spacing
  - [ ] Consistent typography
- [ ] Test button states:
  - [ ] Normal state
  - [ ] Pressed state
  - [ ] Disabled state
  - [ ] Loading state

**Android Testing**:
- [ ] Repeat all iOS steps above

**Pass Criteria**: ✅ All buttons follow consistent design system styling

---

#### 2.3 Demo Content Indicators

**Requirement**: 2.3 - Clear distinction between demo and real content

**iOS Testing**:
- [ ] Navigate through application
- [ ] Identify any placeholder/demo content
- [ ] **VERIFY**: Demo badges or indicators are present
- [ ] **VERIFY**: Empty states are clear and informative
- [ ] **VERIFY**: Users can distinguish demo from real data

**Android Testing**:
- [ ] Repeat all iOS steps above

**Pass Criteria**: ✅ Demo content clearly marked, empty states informative

---

### Phase 3: Trial Banner Logic and Components

#### 3.1 Free Trial User Banner

**Requirement**: 5.2 - Free trial users see upgrade messaging

**iOS Testing** (with free trial account):
- [ ] Login with free trial user account
- [ ] Navigate to screens with trial banners
- [ ] **VERIFY**: Trial countdown banner appears
- [ ] **VERIFY**: Shows days remaining in trial
- [ ] **VERIFY**: Shows "Upgrade" button with 48px minimum height
- [ ] **VERIFY**: No contradictory "Already subscribed" messaging
- [ ] **VERIFY**: Tax-inclusive pricing displayed
- [ ] Tap "Upgrade" button
- [ ] **VERIFY**: Navigates to subscription upgrade flow
- [ ] Tap dismiss button (if present)
- [ ] **VERIFY**: Banner dismisses correctly

**Android Testing**:
- [ ] Repeat all iOS steps above

**Pass Criteria**: ✅ Free trial banner displays correctly with upgrade messaging

---

#### 3.2 Subscribed Trial User Banner

**Requirement**: 4.1-4.7 - Subscribed trial users see success-themed activation banner

**iOS Testing** (with subscribed trial account):
- [ ] Login with subscribed trial user account
- [ ] Navigate to screens with trial banners
- [ ] **VERIFY**: SubscribedTrialBanner appears (not free trial banner)
- [ ] **VERIFY**: Green gradient background (success theme)
- [ ] **VERIFY**: Checkmark icon in white
- [ ] **VERIFY**: "Subscription Active" or similar success message
- [ ] **VERIFY**: Shows days until plan activates
- [ ] **VERIFY**: Shows plan name (e.g., "Premium")
- [ ] **VERIFY**: Shows tax-inclusive pricing
- [ ] **VERIFY**: Shows provincial tax breakdown (GST/PST/HST)
- [ ] **VERIFY**: "Manage" button has 48px minimum touch target
- [ ] Tap "Manage" button
- [ ] **VERIFY**: Navigates to subscription management
- [ ] Test accessibility:
  - [ ] Enable VoiceOver (iOS)
  - [ ] **VERIFY**: Banner has proper accessibility labels
  - [ ] **VERIFY**: Describes subscription status clearly

**Android Testing**:
- [ ] Repeat all iOS steps above
- [ ] Use TalkBack for accessibility testing

**Pass Criteria**: ✅ Subscribed trial banner displays with success theme and correct information

---

#### 3.3 Active Paid User (No Banner)

**Requirement**: 5.4 - Active paid users see no trial banner

**iOS Testing** (with active paid account):
- [ ] Login with active paid user account
- [ ] Navigate through all screens
- [ ] **VERIFY**: No trial banner appears anywhere
- [ ] **VERIFY**: No upgrade prompts
- [ ] **VERIFY**: Full access to all features

**Android Testing**:
- [ ] Repeat all iOS steps above

**Pass Criteria**: ✅ No trial banners for active paid users

---

#### 3.4 Expired Trial User

**Requirement**: Trial banner logic handles expired trials

**iOS Testing** (with expired trial account):
- [ ] Login with expired trial account
- [ ] Navigate to screens
- [ ] **VERIFY**: Appropriate messaging for expired trial
- [ ] **VERIFY**: Upgrade prompts appear
- [ ] **VERIFY**: Limited feature access enforced

**Android Testing**:
- [ ] Repeat all iOS steps above

**Pass Criteria**: ✅ Expired trial state handled correctly

---

### Phase 4: Canadian Tax Calculations

#### 4.1 Provincial Tax Display

**Requirement**: 10.1-10.5 - Tax-inclusive pricing with provincial breakdown

**Test Provinces**:

**Ontario (HST 13%)**:
- [ ] Set user profile to Ontario address
- [ ] View subscription pricing
- [ ] **VERIFY**: Shows "$4.99 CAD/month (includes 13% HST)"
- [ ] **VERIFY**: Tax calculation is correct

**British Columbia (GST 5% + PST 7% = 12%)**:
- [ ] Set user profile to BC address
- [ ] View subscription pricing
- [ ] **VERIFY**: Shows "$4.99 CAD/month (includes 12% GST + PST)"
- [ ] **VERIFY**: Tax calculation is correct

**Alberta (GST 5%)**:
- [ ] Set user profile to Alberta address
- [ ] View subscription pricing
- [ ] **VERIFY**: Shows "$4.99 CAD/month (includes 5% GST)"
- [ ] **VERIFY**: Tax calculation is correct

**Quebec (GST 5% + QST 9.975% = 14.975%)**:
- [ ] Set user profile to Quebec address
- [ ] View subscription pricing
- [ ] **VERIFY**: Shows "$4.99 CAD/month (includes 14.98% GST + QST)"
- [ ] **VERIFY**: Tax calculation is correct

**Unknown Province Fallback**:
- [ ] Set user profile to invalid/unknown province
- [ ] View subscription pricing
- [ ] **VERIFY**: Shows fallback message "includes applicable taxes"

**Pass Criteria**: ✅ Tax calculations correct for all provinces with proper display

---

### Phase 5: Design System Compliance

#### 5.1 Premium Upgrade Flow

**Requirement**: 6.1 - Premium upgrade uses design system tokens

**iOS Testing**:
- [ ] Navigate to subscription upgrade flow
- [ ] **VERIFY**: Colors match design system (NestSyncColors)
- [ ] **VERIFY**: Typography matches reference screens
- [ ] **VERIFY**: Spacing uses 4px base unit system
- [ ] **VERIFY**: Shadows match design system
- [ ] **VERIFY**: Border radius is 12px for cards
- [ ] **VERIFY**: All buttons have 48px minimum height
- [ ] **VERIFY**: Icons are consistent size and color
- [ ] Compare visually to reference screens (home, settings, onboarding)

**Android Testing**:
- [ ] Repeat all iOS steps above

**Pass Criteria**: ✅ Premium upgrade flow matches design system

---

#### 5.2 Reorder Flow

**Requirement**: 6.2 - Reorder flow uses design system tokens

**iOS Testing**:
- [ ] Navigate to reorder suggestions
- [ ] **VERIFY**: Colors match design system
- [ ] **VERIFY**: Typography hierarchy matches reference screens
- [ ] **VERIFY**: Spacing uses 4px base unit system
- [ ] **VERIFY**: Shadows and borders match design tokens
- [ ] **VERIFY**: Buttons have 48px touch targets
- [ ] **VERIFY**: Interaction patterns match onboarding screens

**Android Testing**:
- [ ] Repeat all iOS steps above

**Pass Criteria**: ✅ Reorder flow matches design system

---

#### 5.3 Size Prediction Interface

**Requirement**: 6.3 - Size prediction uses design system tokens

**iOS Testing**:
- [ ] Navigate to size guide/prediction
- [ ] **VERIFY**: Colors match design system
- [ ] **VERIFY**: Typography matches design system
- [ ] **VERIFY**: Spacing uses 4px base unit
- [ ] **VERIFY**: Iconography matches core navigation
- [ ] **VERIFY**: Card styling is consistent
- [ ] **VERIFY**: Buttons have 48px touch targets

**Android Testing**:
- [ ] Repeat all iOS steps above

**Pass Criteria**: ✅ Size prediction matches design system

---

#### 5.4 Payment Screens

**Requirement**: 6.4 - Payment screens match design system

**iOS Testing**:
- [ ] Navigate to payment/checkout screens
- [ ] **VERIFY**: No "vanilla HTML" generic styles
- [ ] **VERIFY**: Visual polish matches reference screens
- [ ] **VERIFY**: Form styling uses design tokens
- [ ] **VERIFY**: Buttons have 48px touch targets
- [ ] **VERIFY**: Spacing uses 4px base unit

**Android Testing**:
- [ ] Repeat all iOS steps above

**Pass Criteria**: ✅ Payment screens match design system

---

### Phase 6: Accessibility Compliance

#### 6.1 Touch Target Sizes

**Requirement**: 9.3 - All interactive elements have 48px minimum touch targets

**iOS Testing**:
- [ ] Navigate through all screens
- [ ] Test tapping all buttons, especially:
  - [ ] Small icon buttons
  - [ ] Close/dismiss buttons
  - [ ] Navigation buttons
  - [ ] FAB button
  - [ ] Tab bar items
- [ ] **VERIFY**: All buttons are easily tappable
- [ ] **VERIFY**: No accidental taps on adjacent elements

**Android Testing**:
- [ ] Repeat all iOS steps above

**Pass Criteria**: ✅ All interactive elements easily tappable

---

#### 6.2 Screen Reader Support

**Requirement**: 9.1-9.2 - Accessibility labels and hints for screen readers

**iOS Testing** (with VoiceOver):
- [ ] Enable VoiceOver: Settings > Accessibility > VoiceOver
- [ ] Navigate through application
- [ ] **VERIFY**: All interactive elements have labels
- [ ] **VERIFY**: Labels describe element purpose
- [ ] **VERIFY**: Hints describe interaction results
- [ ] Test specific elements:
  - [ ] Trial banners
  - [ ] Buttons
  - [ ] Form inputs
  - [ ] Navigation elements
  - [ ] Child selector

**Android Testing** (with TalkBack):
- [ ] Enable TalkBack: Settings > Accessibility > TalkBack
- [ ] Repeat all iOS steps above

**Pass Criteria**: ✅ All elements accessible via screen readers

---

#### 6.3 Keyboard Navigation (Web)

**Requirement**: 9.4 - Keyboard navigation support on web

**Web Testing** (if applicable):
- [ ] Open application in web browser
- [ ] Use Tab key to navigate
- [ ] **VERIFY**: Focus indicator visible
- [ ] **VERIFY**: Logical tab order
- [ ] **VERIFY**: All interactive elements reachable
- [ ] Use Enter/Space to activate buttons
- [ ] **VERIFY**: Keyboard shortcuts work

**Pass Criteria**: ✅ Full keyboard navigation support

---

### Phase 7: Regression Testing

#### 7.1 Existing Functionality

**iOS Testing**:
- [ ] **Inventory Management**:
  - [ ] Add new inventory item
  - [ ] Edit existing item
  - [ ] Delete item
  - [ ] View item details
  - [ ] Filter/search items
- [ ] **Child Profiles**:
  - [ ] Add new child
  - [ ] Edit child profile
  - [ ] Delete child
  - [ ] View child details
- [ ] **Activity Logging**:
  - [ ] Log activity via FAB
  - [ ] View activity history
  - [ ] Edit activity
  - [ ] Delete activity
- [ ] **Settings**:
  - [ ] Update profile
  - [ ] Change preferences
  - [ ] Manage notifications
  - [ ] Privacy settings
- [ ] **Authentication**:
  - [ ] Login
  - [ ] Logout
  - [ ] Password reset (if applicable)

**Android Testing**:
- [ ] Repeat all iOS steps above

**Pass Criteria**: ✅ No regressions in existing functionality

---

#### 7.2 Performance Testing

**iOS Testing**:
- [ ] Navigate between screens rapidly
- [ ] **VERIFY**: No lag or stuttering
- [ ] **VERIFY**: Smooth animations
- [ ] **VERIFY**: Quick load times
- [ ] Test with poor network:
  - [ ] Enable airplane mode
  - [ ] **VERIFY**: Appropriate offline handling
  - [ ] Re-enable network
  - [ ] **VERIFY**: Smooth reconnection

**Android Testing**:
- [ ] Repeat all iOS steps above

**Pass Criteria**: ✅ Application performs smoothly

---

## Test Results Documentation

### Recording Test Results

For each test section, record:
- ✅ **PASS**: Feature works as expected
- ❌ **FAIL**: Feature does not work, describe issue
- ⚠️ **PARTIAL**: Feature partially works, describe limitations
- 🔄 **BLOCKED**: Cannot test due to dependency

### Issue Reporting Template

When you find an issue:

```markdown
**Issue**: [Brief description]
**Severity**: P0 | P1 | P2 | P3
**Platform**: iOS | Android | Both
**Steps to Reproduce**:
1. Step one
2. Step two
3. Step three

**Expected Behavior**: [What should happen]
**Actual Behavior**: [What actually happens]
**Screenshots**: [Attach if applicable]
**Device Info**: [Model, OS version]
```

### Test Summary Template

After completing all tests:

```markdown
# Manual Device Testing Summary

**Date**: YYYY-MM-DD
**Tester**: [Your name]
**Build Version**: [Version number]

## iOS Testing Results
- **Device**: [iPhone model, iOS version]
- **Tests Passed**: X/Y
- **Critical Issues**: X
- **Minor Issues**: X

## Android Testing Results
- **Device**: [Android model, OS version]
- **Tests Passed**: X/Y
- **Critical Issues**: X
- **Minor Issues**: X

## Overall Assessment
- [ ] Ready for production
- [ ] Needs fixes before release
- [ ] Major issues found

## Critical Issues Found
1. [Issue description]
2. [Issue description]

## Recommendations
[Your recommendations for next steps]
```

## Next Steps

After completing manual testing:

1. **Document all findings** using the templates above
2. **Create issues** for any bugs found
3. **Update task status** in tasks.md
4. **Share results** with the team
5. **Plan fixes** for any critical issues

## Reference Documents

- [Requirements Document](../../../.kiro/specs/design-consistency-and-user-issues/requirements.md)
- [Design Document](../../../.kiro/specs/design-consistency-and-user-issues/design.md)
- [Visual Regression Tests](./VISUAL_REGRESSION_TESTS.md)
- [Accessibility Compliance Tests](./ACCESSIBILITY_COMPLIANCE_TESTS.md)
- [Design Compliance Tests](./DESIGN_COMPLIANCE_TESTS_SUMMARY.md)

---

**Testing Checklist Progress**: 0/100+ items completed
**Estimated Time**: 2-3 hours per platform
**Last Updated**: 2025-11-09
