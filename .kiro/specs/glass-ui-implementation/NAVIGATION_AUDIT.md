---
title: "Navigation Audit: Back Button & Header Consistency"
date: 2025-11-08
category: "audit"
type: "navigation-audit"
status: "in-progress"
impact: "high"
tags: ["navigation", "back-buttons", "consistency", "ux"]
---

# Navigation Audit: Back Button & Header Consistency

**Audit Date**: 2025-11-08  
**Auditor**: Kiro AI Agent  
**Scope**: All navigation screens in the app

## Issues Identified

### 1. Inconsistent Header Patterns

**Problem**: Different screens use different header patterns:
- Some have glass "Home" button + "?" + settings gear
- Some have standard back button
- Some have no navigation at all

**Expected**: Consistent pattern across all screens

### 2. FAB Not Context-Aware on Planner Views

**Problem**: FAB doesn't change when switching between Planner views (Analytics, Inventory)

**Expected**: FAB should adapt to current view context

## Screen-by-Screen Audit

### Tab Screens (Main Navigation)

#### ✅ Home (index.tsx)
- **Status**: OK
- **Navigation**: Tab bar navigation
- **FAB**: Context-aware
- **Notes**: Main dashboard, no back button needed

#### ✅ Planner (planner.tsx)
- **Status**: NEEDS REVIEW
- **Navigation**: Tab bar navigation
- **FAB**: Should change based on view (Analytics/Inventory/Planner)
- **Issues**: 
  - FAB doesn't adapt to view changes
  - Need to verify header consistency

#### ✅ Settings (settings.tsx)
- **Status**: NEEDS REVIEW
- **Navigation**: Tab bar navigation
- **Notes**: Need to verify navigation to sub-screens

### Modal/Stack Screens

#### 🔄 Reorder Suggestions (reorder-suggestions.tsx)
- **Status**: NEEDS AUDIT
- **Expected**: Back button to return to previous screen
- **Current**: Unknown - needs verification
- **Notes**: User mentioned glass "Home" + "?" + settings gear (inconsistent)

#### 🔄 Reorder Suggestions Simple (reorder-suggestions-simple.tsx)
- **Status**: NEEDS AUDIT
- **Expected**: Back button
- **Current**: Unknown

#### ✅ Add Inventory Item (add-inventory-item.tsx)
- **Status**: FIXED
- **Navigation**: Back button added
- **Notes**: Fixed in Task 3.1

#### ✅ Inventory List (inventory-list.tsx)
- **Status**: FIXED
- **Navigation**: Back button added
- **Notes**: Fixed in Task 3.2

#### ✅ Order History (order-history.tsx)
- **Status**: OK
- **Navigation**: Back button present
- **Notes**: Already configured correctly

#### 🔄 Timeline (timeline.tsx)
- **Status**: NEEDS AUDIT
- **Expected**: Back button
- **Current**: Unknown
- **Notes**: User mentioned missing back button

#### 🔄 Size Guide (size-guide.tsx)
- **Status**: NEEDS AUDIT
- **Expected**: Back button
- **Current**: Has glass "Back to Home" button (inconsistent)
- **Notes**: User mentioned different styling

#### 🔄 Children Management (children-management.tsx)
- **Status**: NEEDS AUDIT
- **Expected**: Back button
- **Current**: Unknown

#### 🔄 Profile Settings (profile-settings.tsx)
- **Status**: NEEDS AUDIT
- **Expected**: Back button
- **Current**: Unknown

#### 🔄 Emergency Dashboard (emergency-dashboard.tsx)
- **Status**: NEEDS AUDIT
- **Expected**: Back button
- **Current**: Unknown

### Subscription Screens

#### 🔄 Subscription Management (subscription-management.tsx)
- **Status**: NEEDS AUDIT
- **Expected**: Back button
- **Current**: Unknown
- **Notes**: User mentioned "My Subscription" has different nav

#### 🔄 Billing History (billing-history.tsx)
- **Status**: NEEDS AUDIT
- **Expected**: Back button
- **Current**: Unknown

#### 🔄 Payment Methods (payment-methods.tsx)
- **Status**: NEEDS AUDIT
- **Expected**: Back button
- **Current**: Unknown

#### 🔄 Trial Activation (trial-activation.tsx)
- **Status**: NEEDS AUDIT
- **Expected**: Back button
- **Current**: Unknown

## Required Actions

### Immediate (P0)
1. Audit all screens listed above
2. Standardize header pattern:
   - **Option A**: Standard back button for all modal/stack screens
   - **Option B**: Custom header with consistent styling
3. Fix FAB context awareness on Planner views
4. Remove inconsistent navigation elements (glass Home button, etc.)

### Pattern to Implement

**Standard Modal/Stack Screen Header**:
```typescript
<Stack.Screen
  options={{
    title: 'Screen Title',
    headerShown: true,
    headerBackTitle: 'Back',
    headerStyle: {
      backgroundColor: colors.background,
    },
    headerTintColor: colors.text,
  }}
/>
```

**Tab Screen (No Back Button)**:
```typescript
// No Stack.Screen needed - uses tab navigation
```

## Next Steps

1. Read and audit each screen file
2. Document current navigation pattern
3. Identify all inconsistencies
4. Create fix plan
5. Implement consistent navigation
6. Test navigation flow

---

**Status**: In Progress  
**Last Updated**: 2025-11-08
