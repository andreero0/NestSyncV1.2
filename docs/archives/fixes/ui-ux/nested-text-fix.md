---
title: "Nested Text Components Fix"
date: 2025-11-05
category: "ui-ux"
priority: "P1"
status: "partial"
impact: "medium"
platforms: ["web"]
related_docs:
  - "components/reorder/ReorderSuggestionCard.tsx"
  - "components/ui/ChildSelector.tsx"
  - "app/size-guide.tsx"
tags: ["nested-text", "react-native-web", "rendering", "console-errors"]
original_location: "NestSync-frontend/NESTED_TEXT_FIX_REPORT.md"
---

# Nested Text Components Fix Report

## Executive Summary
Fixed 6 instances of nested `<Text>` and `<ThemedText>` components that were causing React Native Web rendering errors. Reduced console errors from 81 to approximately 18 errors.

## Fixes Implemented

### 1. ReorderSuggestionCard.tsx
**File**: `/NestSync-frontend/components/reorder/ReorderSuggestionCard.tsx`

#### Fix #1: Product Size Display (Line 337-341)
**Before:**
```typescript
<ThemedText style={[styles.productSize, { color: colors.textSecondary }]}>
  <ThemedText>Size {suggestion.product.size}</ThemedText>
  <ThemedText> • </ThemedText>
  <ThemedText>{suggestion.suggestedQuantity} pack</ThemedText>
</ThemedText>
```

**After:**
```typescript
<ThemedText style={[styles.productSize, { color: colors.textSecondary }]}>
  Size {suggestion.product.size} • {suggestion.suggestedQuantity} pack
</ThemedText>
```

#### Fix #2: Delivery Information (Line 421-427)
**Before:**
```typescript
<ThemedText style={[styles.deliveryText, { color: colors.textSecondary }]}>
  <ThemedText>{bestRetailer.deliveryTime <= 2 ? 'Express delivery' : `${bestRetailer.deliveryTime} days delivery`}</ThemedText>
  {bestRetailer.freeShipping && (
    <>
      <ThemedText> • </ThemedText>
      <ThemedText>Free shipping</ThemedText>
    </>
  )}
</ThemedText>
```

**After:**
```typescript
<ThemedText style={[styles.deliveryText, { color: colors.textSecondary }]}>
  {bestRetailer.deliveryTime <= 2 ? 'Express delivery' : `${bestRetailer.deliveryTime} days delivery`}
  {bestRetailer.freeShipping && ' • Free shipping'}
</ThemedText>
```

### 2. ChildSelector.tsx
**File**: `/NestSync-frontend/components/ui/ChildSelector.tsx`

**Fix**: Child Details Display (Line 134-143)
**Before:**
```typescript
<ThemedText style={[styles.childDetails, { color: colors.textSecondary }]}>
  <ThemedText>{formatAge(child)}</ThemedText>
  <ThemedText> • </ThemedText>
  <ThemedText>{child.currentDiaperSize}</ThemedText>
</ThemedText>
```

**After:**
```typescript
<ThemedText style={[styles.childDetails, { color: colors.textSecondary }]}>
  {formatAge(child)} • {child.currentDiaperSize}
</ThemedText>
```

### 3. size-guide.tsx
**File**: `/NestSync-frontend/app/size-guide.tsx`

**Fix**: Calculator Subtext (Line 546-548)
**Before:**
```typescript
<ThemedText style={[styles.calculatorSubtext, { color: colors.textSecondary }]}>
  <ThemedText>{selectedChild.ageInMonths} months old</ThemedText>
  <ThemedText> • </ThemedText>
  <ThemedText>Current: {selectedChild.currentDiaperSize}</ThemedText>
</ThemedText>
```

**After:**
```typescript
<ThemedText style={[styles.calculatorSubtext, { color: colors.textSecondary }]}>
  {selectedChild.ageInMonths} months old • Current: {selectedChild.currentDiaperSize}
</ThemedText>
```

### 4. inventory-list.tsx
**File**: `/NestSync-frontend/app/inventory-list.tsx`

**Fix**: Item Details Display (Line 224-226)
**Before:**
```typescript
<Text style={styles.itemDetails}>
  <Text>Size {item.size}</Text>
  <Text> • </Text>
  <Text>{item.productType}</Text>
</Text>
```

**After:**
```typescript
<Text style={styles.itemDetails}>
  Size {item.size} • {item.productType}
</Text>
```

### 5. index.tsx (Home Screen)
**File**: `/NestSync-frontend/app/(tabs)/index.tsx`

**Fix**: Status Text Display (Line 676-678)
**Before:**
```typescript
<ThemedText style={[styles.statusText, { color: colors.textSecondary }]}>
  <ThemedText>Using {formatDiaperSize(dashboardStats.currentSize)}</ThemedText>
  <ThemedText> • </ThemedText>
  <ThemedText>Last change {safeFormatTimeAgo(dashboardStats.lastChange, 'status-card')}</ThemedText>
  <ThemedText> • </ThemedText>
  <ThemedText>On track with schedule</ThemedText>
</ThemedText>
```

**After:**
```typescript
<ThemedText style={[styles.statusText, { color: colors.textSecondary }]}>
  Using {formatDiaperSize(dashboardStats.currentSize)} • Last change {safeFormatTimeAgo(dashboardStats.lastChange, 'status-card')} • On track with schedule
</ThemedText>
```

### 6. subscription-management.tsx
**File**: `/NestSync-frontend/app/(subscription)/subscription-management.tsx`

**Fix**: Duplicate Header (Line 183-187)
**Before:**
```typescript
<Stack.Screen
  options={{
    headerShown: true,
    headerTitle: "Subscription",
    headerBackTitle: "Settings"
  }}
/>
```

**After:**
```typescript
<Stack.Screen
  options={{
    headerShown: false
  }}
/>
```

**Reason**: Component already uses `StandardHeader`, causing duplicate headers.

## Remaining Issues

### Persistent Error: "Unexpected text node: ."
**Status**: UNRESOLVED
**Count**: ~18 occurrences after fixes
**Location**: Appears to be triggered after `[getTimeBasedGreeting]` log
**Error Message**:
```
[ERROR] Unexpected text node: . A text node cannot be a child of a <View>.
@ http://localhost:8082/node_modules/expo-router/entry.bundle
```

### Investigation Findings
1. **Not Related to Greeting Function**: The `getTimeBasedGreeting()` function properly returns strings with exclamation marks, all wrapped in ThemedText
2. **Unicode Character Issue**: The bullet character `•` (U+2022) may be interpreted as period `.` by React Native Web
3. **Potential Sources**:
   - Line 484 in `settings.tsx`: `` `${currentFamily.name}${pendingInvitationsCount > 0 ? ` • ${pendingInvitationsCount} pending` : ' • Manage family'}` ``
   - Line 584 in `settings.tsx`: `` `${emergencyProfiles.length} profiles configured  •  ${emergencySetupProgress}% complete` ``
   - However, both are properly rendered inside `<ThemedText>` components

4. **Timing Pattern**: Error appears during component re-renders, suggesting it's a React component lifecycle issue

### Recommended Next Steps
1. **Add React Error Boundary**: Wrap the home screen in error boundary to capture exact component stack trace
2. **Inspect Bundle**: Check the compiled bundle at line 1120 to identify the exact component
3. **Test Without Bullet Characters**: Temporarily replace all `•` with `-` to confirm if Unicode is the issue
4. **Check Third-Party Components**: Verify if `LinearGradient`, `BlurView`, or other native components are causing the issue

## Testing Validation
- ✅ Cleared Metro cache and restarted dev server
- ✅ Verified all 6 fixes are applied correctly
- ✅ Confirmed no nested Text components in modified files
- ✅ Checked that all text is properly wrapped in Text/ThemedText components
- ❌ Console still shows 18 "Unexpected text node: ." errors

## Performance Impact
- **Before**: 81 console errors per page load
- **After**: 18 console errors per page load
- **Improvement**: 78% reduction in errors
- **Status**: Partial success - further investigation needed

## Files Modified
1. `/NestSync-frontend/components/reorder/ReorderSuggestionCard.tsx`
2. `/NestSync-frontend/components/ui/ChildSelector.tsx`
3. `/NestSync-frontend/app/size-guide.tsx`
4. `/NestSync-frontend/app/inventory-list.tsx`
5. `/NestSync-frontend/app/(tabs)/index.tsx`
6. `/NestSync-frontend/app/(subscription)/subscription-management.tsx`

## Conclusion
Successfully eliminated all identifiable nested Text component issues, achieving a 78% reduction in console errors. The remaining 18 errors appear to be related to a more subtle issue, possibly involving Unicode character rendering, component lifecycle, or third-party library integration. Further debugging with React DevTools and bundle inspection is recommended.

---
**Date**: 2025-11-05
**Author**: Claude Code (Anthropic)
**Status**: Partial Resolution - Further Investigation Required
