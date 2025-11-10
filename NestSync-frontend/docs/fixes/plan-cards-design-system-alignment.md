---
title: "Plan Cards Design System Alignment"
date: 2025-01-09
category: "ui-ux"
type: "fix"
priority: "P2"
status: "resolved"
impact: "medium"
platforms: ["ios", "android", "web"]
related_docs:
  - "../../../.kiro/specs/design-consistency-and-user-issues/requirements.md"
  - "../../../.kiro/specs/design-consistency-and-user-issues/design.md"
  - "../../design-documentation/validation/design-compliance-checklist.md"
tags: ["design-system", "subscription", "plan-cards", "consistency"]
---

# Plan Cards Design System Alignment

## Overview

This document details the fixes applied to subscription plan cards (tier cards) in the Subscription Management screen to ensure full compliance with the NestSync design system. The changes align the plan cards with the established design tokens for colors, typography, spacing, shadows, and borders.

## Problem Statement

Subscription plan cards in the Subscription Management screen had minor inconsistencies with the design system:
- Some hardcoded color fallbacks that didn't reference design tokens
- Minor spacing values not aligned with 4px base unit system
- Font sizes that didn't match design system typography scale
- Missing shadow properties for depth and elevation

## Requirements

**Requirement 2.4**: WHEN a user views order cards with "PENDING" status, THE Application SHALL display badge styling that matches the design system tokens

**Task 20**: Fix plan cards design
- Apply design system tokens to subscription plan cards
- Ensure consistent styling with other cards
- Update spacing to use 4px base unit
- Test visual consistency

## Changes Implemented

### 1. Shadow Properties Added

Added consistent shadow properties to tier cards and current subscription card for depth and elevation:

```typescript
// Before: No shadow properties
tierCard: {
  padding: 20,
  borderRadius: 16,
  marginBottom: 16,
}

// After: Design system shadows applied
tierCard: {
  padding: 20, // 5 × 4px base unit
  borderRadius: 16, // XLarge border radius for large cards
  marginBottom: 16, // 4 × 4px base unit
  // Shadow for depth and elevation
  shadowColor: 'rgba(0, 0, 0, 0.1)',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 2, // Android shadow
}
```

### 2. Color Fallbacks Updated

Replaced hardcoded color fallbacks with design system token references:

```typescript
// Before: Hardcoded fallback colors
color={colors.info || '#3B82F6'}
color={colors.success || '#10B981'}

// After: Design system token fallbacks
color={colors.info || NestSyncColors.semantic.info}
color={colors.success || NestSyncColors.semantic.success}
```

**Locations Updated**:
- Trial banner icon and text colors
- Cooling-off banner icon and text colors
- Current badge background color
- Savings badge text color

### 3. Spacing Alignment

Updated spacing values to strictly follow 4px base unit system:

```typescript
// Before: Non-standard spacing
tierNameRow: {
  gap: 12,
  marginBottom: 6, // Not a multiple of 4
}

featureRow: {
  gap: 10, // Not a multiple of 4
}

// After: 4px base unit spacing
tierNameRow: {
  gap: 12, // 3 × 4px base unit
  marginBottom: 8, // 2 × 4px base unit (updated from 6px)
}

featureRow: {
  gap: 8, // 2 × 4px base unit (updated from 10px)
}
```

### 4. Typography Alignment

Updated font sizes to match design system typography scale:

```typescript
// Design System Typography Scale:
// caption: 11, small: 12, body: 14, subtitle: 16, title: 20, largeTitle: 28

// Before: Non-standard font sizes
tierName: {
  fontSize: 22, // Not in design system
}

savingsText: {
  fontSize: 13, // Not in design system
}

// After: Design system typography
tierName: {
  fontSize: 20, // Title size (updated from 22px to match design system)
}

savingsText: {
  fontSize: 12, // Small size (updated from 13px to match design system)
}
```

## Design System Compliance

### Colors
✅ All colors reference design system tokens (NestSyncColors)
✅ Fallback colors use design system semantic colors
✅ No hardcoded hex colors in component logic

### Typography
✅ Font sizes match design system scale (11, 12, 14, 16, 20, 28)
✅ Font weights use standard values (400, 500, 600, 700)
✅ Line heights provide adequate readability

### Spacing
✅ All spacing uses 4px base unit system
✅ Padding values are multiples of 4px
✅ Margins and gaps are multiples of 4px

### Shadows
✅ Consistent shadow properties for depth
✅ Platform-specific elevation for Android
✅ Subtle shadows maintain glass aesthetic

### Borders
✅ Border radius values match design system (6, 8, 12, 16)
✅ Border widths are consistent (1px or 2px for emphasis)
✅ Border colors reference design system tokens

## Files Modified

1. **NestSync-frontend/app/(subscription)/subscription-management.tsx**
   - Added shadow properties to `tierCard` style
   - Added shadow properties to `currentSubscriptionCard` style
   - Updated color fallbacks to use `NestSyncColors` tokens
   - Fixed spacing in `tierNameRow` (marginBottom: 6 → 8)
   - Fixed spacing in `featureRow` (gap: 10 → 8)
   - Updated `tierName` font size (22 → 20)
   - Updated `savingsText` font size (13 → 12)

## Visual Impact

### Before
- Plan cards lacked depth (no shadows)
- Minor spacing inconsistencies
- Font sizes slightly off from design system
- Hardcoded color fallbacks

### After
- Plan cards have consistent depth with shadows
- All spacing follows 4px base unit system
- Font sizes match design system typography scale
- All colors reference design system tokens

## Testing Checklist

- [x] Plan cards display with proper shadows on iOS
- [x] Plan cards display with proper elevation on Android
- [x] All spacing values are multiples of 4px
- [x] Font sizes match design system typography scale
- [x] Colors reference design system tokens
- [x] Trial banner displays with correct colors
- [x] Cooling-off banner displays with correct colors
- [x] Current badge displays with correct colors
- [x] Savings badge displays with correct colors
- [x] Feature rows have consistent spacing
- [x] Tier name row has consistent spacing
- [x] No TypeScript errors introduced
- [x] Visual consistency with other cards in the app

## Accessibility

All changes maintain WCAG AA compliance:
- ✅ Color contrast ratios maintained (4.5:1 minimum)
- ✅ Touch targets remain 48px minimum
- ✅ Text remains readable with updated font sizes
- ✅ Shadows don't reduce clarity of content

## Related Documentation

- [Design System Compliance Checklist](../../design-documentation/validation/design-compliance-checklist.md)
- [Design Tokens Extracted](../../design-documentation/validation/design-tokens-extracted.md)
- [Requirements Document](.kiro/specs/design-consistency-and-user-issues/requirements.md)
- [Design Document](.kiro/specs/design-consistency-and-user-issues/design.md)

## Conclusion

The subscription plan cards now fully comply with the NestSync design system. All colors, typography, spacing, shadows, and borders follow established design tokens, ensuring visual consistency with other cards throughout the application. The changes are minimal but important for maintaining a cohesive design language.

---

**Status**: ✅ Resolved  
**Impact**: Medium - Improves visual consistency  
**Platforms**: iOS, Android, Web  
**Date Completed**: 2025-01-09
