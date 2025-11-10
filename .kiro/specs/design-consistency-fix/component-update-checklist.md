# Premium Upgrade Flow - Component Update Checklist

**Created**: 2025-11-09  
**Status**: Ready for Implementation  
**Related**: [Premium Upgrade Audit](./premium-upgrade-audit.md)

## Overview

This checklist provides a detailed breakdown of all components in the premium upgrade flow that require updates to align with the design system. Each component is listed with specific styling changes needed.

## Design System Reference

### Colors (From Reference Screens)
```typescript
const DesignSystemColors = {
  primary: '#0891b2',        // rgb(8, 145, 178)
  textPrimary: '#000000',
  textSecondary: '#4b5563',  // rgb(75, 85, 99)
  textTertiary: '#6b7280',   // rgb(107, 114, 128)
  background: '#f0f9ff',     // rgb(240, 249, 255)
};
```

### Typography (From Reference Screens)
```typescript
const DesignSystemTypography = {
  headingLarge: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 'normal',
  },
  headingMedium: {
    fontSize: 18,
    fontWeight: '500',
    lineHeight: 24,
  },
  body: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  fontFamily: '-apple-system, "system-ui", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};
```

### Spacing (4px Base Unit System)
```typescript
const DesignSystemSpacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  massive: 60,
};
```

### Touch Targets
```typescript
const DesignSystemTouchTargets = {
  minimum: 48, // WCAG AAA standard
};
```

## Component Update Checklist

### File: subscription-management.tsx

#### 1. Header Title
- [ ] Update `headerTitle` fontSize from 28 to 32
- [ ] Update fontWeight from '600' to '700'
- [ ] Add letterSpacing: -0.5
- [ ] Verify color matches `#000000`

**Current**:
```typescript
headerTitle: {
  fontSize: 28,
  fontWeight: '600',
  lineHeight: 36,
  letterSpacing: -0.01,
}
```

**Updated**:
```typescript
headerTitle: {
  fontSize: 32,
  fontWeight: '700',
  lineHeight: 'normal',
  letterSpacing: -0.5,
}
```

#### 2. Plan Name
- [ ] Update `planName` fontSize from 24 to 18
- [ ] Update fontWeight from 'bold' to '500'
- [ ] Add lineHeight: 24
- [ ] Verify color matches `#000000`

**Current**:
```typescript
planName: {
  fontSize: 24,
  fontWeight: 'bold',
}
```

**Updated**:
```typescript
planName: {
  fontSize: 18,
  fontWeight: '500',
  lineHeight: 24,
}
```

#### 3. Section Title
- [ ] Update `sectionTitle` fontSize from 20 to 18
- [ ] Update fontWeight from 'bold' to '500'
- [ ] Add lineHeight: 24
- [ ] Verify color matches `#000000`

**Current**:
```typescript
sectionTitle: {
  fontSize: 20,
  fontWeight: 'bold',
  marginBottom: 16,
}
```

**Updated**:
```typescript
sectionTitle: {
  fontSize: 18,
  fontWeight: '500',
  lineHeight: 24,
  marginBottom: 16,
}
```

#### 4. Tier Name
- [ ] Update `tierName` fontSize from 22 to 18
- [ ] Update fontWeight from 'bold' to '500'
- [ ] Add lineHeight: 24
- [ ] Verify color matches `#000000`

**Current**:
```typescript
tierName: {
  fontSize: 22,
  fontWeight: 'bold',
}
```

**Updated**:
```typescript
tierName: {
  fontSize: 18,
  fontWeight: '500',
  lineHeight: 24,
}
```

#### 5. Tier Price
- [ ] Update `tierPrice` fontSize from 28 to 32
- [ ] Update fontWeight from 'bold' to '700'
- [ ] Add letterSpacing: -0.5
- [ ] Verify color matches `#000000`

**Current**:
```typescript
tierPrice: {
  fontSize: 28,
  fontWeight: 'bold',
}
```

**Updated**:
```typescript
tierPrice: {
  fontSize: 32,
  fontWeight: '700',
  letterSpacing: -0.5,
}
```

#### 6. Feature Text
- [ ] Update `featureText` fontSize to 14 (if not already)
- [ ] Update fontWeight to '500'
- [ ] Update lineHeight to 20
- [ ] Add letterSpacing: 0.1
- [ ] Verify color matches `#6b7280`

**Current**:
```typescript
featureText: {
  flex: 1,
  fontSize: 16,
  lineHeight: 24,
}
```

**Updated**:
```typescript
featureText: {
  flex: 1,
  fontSize: 14,
  fontWeight: '500',
  lineHeight: 20,
  letterSpacing: 0.1,
}
```

#### 7. Change Plan Button
- [ ] Add minHeight: 48
- [ ] Add minWidth: 48
- [ ] Verify paddingHorizontal + paddingVertical meet 48px minimum
- [ ] Update backgroundColor to `#0891b2`
- [ ] Verify text color is white

**Current**:
```typescript
changePlanButton: {
  paddingHorizontal: 16,
  paddingVertical: 8,
  borderRadius: 8,
}
```

**Updated**:
```typescript
changePlanButton: {
  paddingHorizontal: 16,
  paddingVertical: 16, // Increased to meet 48px minimum
  borderRadius: 8,
  minHeight: 48,
  minWidth: 48,
}
```

#### 8. Cancel Button
- [ ] Add minHeight: 48
- [ ] Verify padding meets touch target
- [ ] Verify border color matches error color

**Current**:
```typescript
cancelButton: {
  padding: 16,
  borderRadius: 12,
  alignItems: 'center',
}
```

**Updated**:
```typescript
cancelButton: {
  padding: 16,
  borderRadius: 12,
  alignItems: 'center',
  minHeight: 48,
}
```

#### 9. Modal Button
- [ ] Add minHeight: 48
- [ ] Verify padding meets touch target
- [ ] Update primary button backgroundColor to `#0891b2`

**Current**:
```typescript
modalButton: {
  flex: 1,
  padding: 16,
  borderRadius: 12,
  alignItems: 'center',
}
```

**Updated**:
```typescript
modalButton: {
  flex: 1,
  padding: 16,
  borderRadius: 12,
  alignItems: 'center',
  minHeight: 48,
}
```

#### 10. Billing Toggle Button
- [ ] Add minHeight: 48
- [ ] Verify touch target compliance
- [ ] Update active backgroundColor to `#0891b2`

**Current**:
```typescript
billingToggleButton: {
  flex: 1,
  paddingVertical: 10,
  paddingHorizontal: 16,
  borderRadius: 8,
  alignItems: 'center',
}
```

**Updated**:
```typescript
billingToggleButton: {
  flex: 1,
  paddingVertical: 14, // Increased to meet 48px minimum
  paddingHorizontal: 16,
  borderRadius: 8,
  alignItems: 'center',
  minHeight: 48,
}
```

### File: trial-activation.tsx

#### 11. Header Title
- [ ] Update `headerTitle` fontSize from 24 to 32
- [ ] Update fontWeight from 'bold' to '700'
- [ ] Add letterSpacing: -0.5
- [ ] Verify color matches `#000000`

**Current**:
```typescript
headerTitle: {
  fontSize: 24,
  fontWeight: 'bold',
}
```

**Updated**:
```typescript
headerTitle: {
  fontSize: 32,
  fontWeight: '700',
  letterSpacing: -0.5,
}
```

#### 12. Hero Title
- [ ] Verify fontSize is 32 ✓
- [ ] Update fontWeight from 'bold' to '700'
- [ ] Add letterSpacing: -0.5
- [ ] Verify color matches `#000000`

**Current**:
```typescript
heroTitle: {
  fontSize: 32,
  fontWeight: 'bold',
  marginTop: 16,
}
```

**Updated**:
```typescript
heroTitle: {
  fontSize: 32,
  fontWeight: '700',
  letterSpacing: -0.5,
  marginTop: 16,
}
```

#### 13. Section Title
- [ ] Update `sectionTitle` fontSize from 20 to 18
- [ ] Update fontWeight from 'bold' to '500'
- [ ] Add lineHeight: 24
- [ ] Verify color matches `#000000`

**Current**:
```typescript
sectionTitle: {
  fontSize: 20,
  fontWeight: 'bold',
  marginBottom: 16,
}
```

**Updated**:
```typescript
sectionTitle: {
  fontSize: 18,
  fontWeight: '500',
  lineHeight: 24,
  marginBottom: 16,
}
```

#### 14. Tier Name
- [ ] Update `tierName` fontSize from 20 to 18
- [ ] Update fontWeight from 'bold' to '500'
- [ ] Add lineHeight: 24
- [ ] Verify color matches `#000000`

**Current**:
```typescript
tierName: {
  fontSize: 20,
  fontWeight: 'bold',
}
```

**Updated**:
```typescript
tierName: {
  fontSize: 18,
  fontWeight: '500',
  lineHeight: 24,
}
```

#### 15. Feature Text
- [ ] Verify fontSize is 14 ✓
- [ ] Add fontWeight: '500'
- [ ] Verify lineHeight is 20 ✓
- [ ] Add letterSpacing: 0.1
- [ ] Verify color matches `#6b7280`

**Current**:
```typescript
featureText: {
  flex: 1,
  fontSize: 14,
  lineHeight: 20,
}
```

**Updated**:
```typescript
featureText: {
  flex: 1,
  fontSize: 14,
  fontWeight: '500',
  lineHeight: 20,
  letterSpacing: 0.1,
}
```

#### 16. Start Button
- [ ] Update minHeight from 56 to 48 (WCAG standard)
- [ ] Verify backgroundColor matches `#0891b2`
- [ ] Verify text color is white
- [ ] Update text fontSize to 18 (if not already)
- [ ] Update text fontWeight from 'bold' to '700'

**Current**:
```typescript
startButton: {
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
  padding: 18,
  borderRadius: 12,
  marginBottom: 16,
  gap: 8,
  minHeight: 56,
}
startButtonText: {
  color: '#FFFFFF',
  fontSize: 18,
  fontWeight: 'bold',
}
```

**Updated**:
```typescript
startButton: {
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
  padding: 18,
  borderRadius: 12,
  marginBottom: 16,
  gap: 8,
  minHeight: 48, // Updated to WCAG standard
}
startButtonText: {
  color: '#FFFFFF',
  fontSize: 18,
  fontWeight: '700', // Updated to match design system
}
```

#### 17. Radio Button
- [ ] Verify width and height are at least 28px ✓
- [ ] Update borderColor to `#0891b2` when selected
- [ ] Update backgroundColor to `#0891b2` when selected

**Current**:
```typescript
radioButton: {
  width: 28,
  height: 28,
  borderRadius: 14,
  borderWidth: 2,
  justifyContent: 'center',
  alignItems: 'center',
}
```

**Updated**: (No changes needed - already compliant)

### File: FeatureUpgradePrompt.tsx

#### 18. Title
- [ ] Update `title` fontSize from 24 to 32
- [ ] Update fontWeight from 'bold' to '700'
- [ ] Add letterSpacing: -0.5
- [ ] Verify color matches `#000000`

**Current**:
```typescript
title: {
  fontSize: 24,
  fontWeight: 'bold',
  textAlign: 'center',
  marginBottom: 12,
}
```

**Updated**:
```typescript
title: {
  fontSize: 32,
  fontWeight: '700',
  letterSpacing: -0.5,
  textAlign: 'center',
  marginBottom: 12,
}
```

#### 19. Description
- [ ] Update `description` fontSize from 16 to 14
- [ ] Add fontWeight: '500'
- [ ] Update lineHeight from 24 to 20
- [ ] Add letterSpacing: 0.1
- [ ] Verify color matches `#6b7280`

**Current**:
```typescript
description: {
  fontSize: 16,
  textAlign: 'center',
  lineHeight: 24,
  marginBottom: 20,
}
```

**Updated**:
```typescript
description: {
  fontSize: 14,
  fontWeight: '500',
  textAlign: 'center',
  lineHeight: 20,
  letterSpacing: 0.1,
  marginBottom: 20,
}
```

#### 20. Pricing Text
- [ ] Verify fontSize is 18 ✓
- [ ] Update fontWeight from 'bold' to '500'
- [ ] Add lineHeight: 24
- [ ] Verify color matches `#0891b2`

**Current**:
```typescript
pricingText: {
  fontSize: 18,
  fontWeight: 'bold',
}
```

**Updated**:
```typescript
pricingText: {
  fontSize: 18,
  fontWeight: '500',
  lineHeight: 24,
}
```

#### 21. Upgrade Button
- [ ] Add minHeight: 48
- [ ] Verify paddingVertical meets touch target
- [ ] Update backgroundColor to `#0891b2`
- [ ] Update text fontWeight from 'bold' to '700'

**Current**:
```typescript
upgradeButton: {
  width: '100%',
  paddingVertical: 16,
  borderRadius: 12,
  alignItems: 'center',
}
upgradeButtonText: {
  color: '#FFFFFF',
  fontSize: 18,
  fontWeight: 'bold',
}
```

**Updated**:
```typescript
upgradeButton: {
  width: '100%',
  paddingVertical: 16,
  borderRadius: 12,
  alignItems: 'center',
  minHeight: 48,
}
upgradeButtonText: {
  color: '#FFFFFF',
  fontSize: 18,
  fontWeight: '700',
}
```

#### 22. Later Button
- [ ] Add minHeight: 48
- [ ] Verify paddingVertical meets touch target
- [ ] Verify text color matches `#6b7280`

**Current**:
```typescript
laterButton: {
  width: '100%',
  paddingVertical: 12,
  alignItems: 'center',
}
```

**Updated**:
```typescript
laterButton: {
  width: '100%',
  paddingVertical: 18, // Increased to meet 48px minimum
  alignItems: 'center',
  minHeight: 48,
}
```

## Icon Styling Updates

### Consistent Icon Sizes
- [ ] Verify all icons use consistent sizing
- [ ] Large icons: 48px (hero/feature icons)
- [ ] Medium icons: 24px (navigation/headers)
- [ ] Small icons: 20px (inline/feature lists)
- [ ] Tiny icons: 16px (badges/indicators)

### Icon Colors
- [ ] Primary actions: `#0891b2`
- [ ] Success indicators: Use theme success color
- [ ] Error indicators: Use theme error color
- [ ] Secondary/inactive: `#6b7280`

## Spacing Verification

### Verify 4px Base Unit System
- [ ] All padding values are multiples of 4
- [ ] All margin values are multiples of 4
- [ ] All gap values are multiples of 4
- [ ] Container padding: 20px (5 × 4) ✓
- [ ] Section margins: 24px (6 × 4) ✓
- [ ] Element gaps: 12px (3 × 4) ✓

## Border Radius Consistency

### Extract from Reference Screens
- [ ] Capture border radius values from home/settings
- [ ] Apply consistently across all cards
- [ ] Apply consistently across all buttons
- [ ] Apply consistently across all modals

## Shadow/Elevation Patterns

### Extract from Reference Screens
- [ ] Capture shadow values from home/settings cards
- [ ] Apply to subscription cards
- [ ] Apply to tier cards
- [ ] Apply to modal overlays

## Accessibility Compliance

### Touch Targets
- [ ] All buttons meet 48px minimum height
- [ ] All buttons meet 48px minimum width
- [ ] All interactive elements have adequate spacing

### Color Contrast
- [ ] Verify text on background meets WCAG AA (4.5:1)
- [ ] Verify button text on button background meets WCAG AA
- [ ] Verify disabled states have adequate contrast

### Screen Reader Support
- [ ] All buttons have accessibilityLabel
- [ ] All buttons have accessibilityRole
- [ ] All interactive elements have accessibilityHint where appropriate

## Testing Checklist

### Visual Regression
- [ ] Capture before screenshots
- [ ] Apply all styling updates
- [ ] Capture after screenshots
- [ ] Compare side-by-side

### Manual Testing
- [ ] Test on iOS device
- [ ] Test on Android device
- [ ] Verify touch targets work correctly
- [ ] Verify text is readable
- [ ] Verify colors match reference screens

### Automated Testing
- [ ] Run Playwright visual regression tests
- [ ] Verify design token compliance
- [ ] Check accessibility compliance

## Summary

**Total Components**: 22  
**Files to Update**: 3  
**Estimated Time**: 4-6 hours  

### Priority Order
1. Typography updates (highest visual impact)
2. Touch target compliance (accessibility critical)
3. Color consistency (brand alignment)
4. Spacing verification (polish)
5. Border radius and shadows (final polish)

---

**Status**: Ready for Implementation  
**Last Updated**: 2025-11-09
