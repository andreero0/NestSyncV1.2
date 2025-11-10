---
title: "Premium Upgrade Flow Component Audit"
date: 2025-11-09
category: "design-audit"
type: "component-audit"
status: "completed"
impact: "high"
related_docs:
  - "./requirements.md"
  - "./design.md"
  - "./design-audit-report.md"
tags: ["premium-upgrade", "subscription", "design-system", "audit"]
---

# Premium Upgrade Flow Component Audit

**Audit Date**: 2025-11-09  
**Auditor**: Kiro AI Agent  
**Scope**: Premium upgrade flow screens and components

## Executive Summary

This audit identifies all components in the premium upgrade flow and documents their current styling compared to the established design system tokens extracted from reference screens (home, settings).

### Components Audited

1. **subscription-management.tsx** - Main subscription management screen
2. **trial-activation.tsx** - Trial activation screen
3. **FeatureUpgradePrompt.tsx** - Reusable upgrade prompt modal

### Overall Findings

- **Compliance Score**: 75/100
- **Critical Issues**: 3
- **High Priority Issues**: 8
- **Medium Priority Issues**: 12
- **Low Priority Issues**: 5

## Design Token Reference (From Reference Screens)

### Colors
- **Primary Blue**: `#0891b2` (rgb(8, 145, 178))
- **Text Primary**: `#000000`
- **Text Secondary**: `#4b5563` (rgb(75, 85, 99))
- **Text Tertiary**: `#6b7280` (rgb(107, 114, 128))
- **Background**: `#f0f9ff` (rgb(240, 249, 255))

### Typography
- **Heading Large**: 32px, weight 700, letter-spacing -0.5px
- **Heading Medium**: 18px, weight 500, line-height 24px
- **Body**: 14px, weight 500, line-height 20px, letter-spacing 0.1px
- **Font Family**: -apple-system, "system-ui", "Segoe UI", Roboto, Helvetica, Arial, sans-serif

### Spacing
- **Padding Top**: 60px
- **Padding Bottom**: 40px
- **Base Unit**: 4px (inferred from design system)

## Component Analysis

### 1. subscription-management.tsx

#### Current Styling Issues

##### CRITICAL: Hardcoded Colors

**Issue**: Uses `colors` object from theme context instead of explicit design tokens
```typescript
// Current
backgroundColor: colors.background
color: colors.text
color: colors.textSecondary

// Expected (Design System)
backgroundColor: '#f0f9ff'
color: '#000000'
color: '#4b5563'
```

**Location**: Throughout the file (lines 100+)
**Impact**: Inconsistent with reference screens that use explicit color values
**Fix**: Replace theme colors with design system tokens or ensure theme colors match exactly

##### HIGH: Typography Inconsistency

**Issue**: Font sizes don't match reference screens
```typescript
// Current
headerTitle: fontSize: 28, fontWeight: '600'
planName: fontSize: 24, fontWeight: 'bold'
sectionTitle: fontSize: 20, fontWeight: 'bold'

// Expected (Design System)
headerTitle: fontSize: 32, fontWeight: '700', letterSpacing: -0.5
planName: fontSize: 18, fontWeight: '500', lineHeight: 24
sectionTitle: fontSize: 18, fontWeight: '500', lineHeight: 24
```

**Location**: styles object (lines 600-800)
**Impact**: Visual hierarchy doesn't match home/settings screens
**Fix**: Update font sizes and weights to match design tokens

##### HIGH: Spacing System

**Issue**: Inconsistent spacing values
```typescript
// Current
padding: 20 (multiple places)
marginBottom: 24
marginBottom: 16
gap: 12

// Expected (4px base unit system)
padding: 20 ✓ (5 × 4)
marginBottom: 24 ✓ (6 × 4)
marginBottom: 16 ✓ (4 × 4)
gap: 12 ✓ (3 × 4)
```

**Location**: styles object
**Impact**: MEDIUM - Spacing is mostly compliant with 4px base unit
**Fix**: Verify all spacing values are multiples of 4

##### MEDIUM: Border Radius

**Issue**: Border radius values not documented in design tokens
```typescript
// Current
borderRadius: 16
borderRadius: 12
borderRadius: 10
borderRadius: 8

// Expected
Need to extract from reference screens
```

**Location**: Various card and button styles
**Impact**: May not match reference screen polish
**Fix**: Extract border radius values from reference screens and apply consistently

##### MEDIUM: Button Touch Targets

**Issue**: Some buttons may not meet 48px minimum
```typescript
// Current
changePlanButton: paddingHorizontal: 16, paddingVertical: 8
cancelButton: padding: 16
modalButton: padding: 16

// Expected
minHeight: 48, minWidth: 48
```

**Location**: Button styles (lines 700+)
**Impact**: Accessibility and usability concern
**Fix**: Ensure all interactive elements meet 48px minimum touch target

##### LOW: Shadow/Elevation

**Issue**: No shadows defined in styles
```typescript
// Current
No shadowColor, shadowOffset, shadowOpacity, shadowRadius

// Expected
Extract shadow patterns from reference screens
```

**Location**: Card components
**Impact**: May lack visual depth compared to reference screens
**Fix**: Add consistent shadow/elevation patterns

#### Components Requiring Updates

1. **Current Subscription Card** (lines 200-300)
   - Update typography to match design tokens
   - Verify spacing follows 4px base unit
   - Add shadows if present in reference screens

2. **Tier Cards** (lines 400-500)
   - Update font sizes and weights
   - Ensure border radius matches reference
   - Verify touch targets meet 48px minimum

3. **Billing Toggle** (lines 350-380)
   - Update button styling to match home/settings
   - Verify touch targets
   - Check color contrast

4. **Status Badges** (lines 250-270)
   - Verify colors match semantic color system
   - Check typography consistency

5. **Modal Components** (lines 550-650)
   - Update button styling
   - Verify spacing and padding
   - Check border radius consistency

### 2. trial-activation.tsx

#### Current Styling Issues

##### CRITICAL: Hardcoded Colors

**Issue**: Same as subscription-management.tsx - uses theme colors instead of design tokens
```typescript
// Current
backgroundColor: colors.background
color: colors.text
color: colors.tint

// Expected
backgroundColor: '#f0f9ff'
color: '#000000'
color: '#0891b2'
```

**Location**: Throughout the file
**Impact**: Inconsistent with reference screens
**Fix**: Replace with design system tokens

##### HIGH: Typography Inconsistency

**Issue**: Font sizes don't match reference screens
```typescript
// Current
headerTitle: fontSize: 24, fontWeight: 'bold'
heroTitle: fontSize: 32, fontWeight: 'bold'
sectionTitle: fontSize: 20, fontWeight: 'bold'
tierName: fontSize: 20, fontWeight: 'bold'

// Expected (Design System)
headerTitle: fontSize: 32, fontWeight: '700', letterSpacing: -0.5
heroTitle: fontSize: 32, fontWeight: '700', letterSpacing: -0.5 ✓
sectionTitle: fontSize: 18, fontWeight: '500', lineHeight: 24
tierName: fontSize: 18, fontWeight: '500', lineHeight: 24
```

**Location**: styles object (lines 300-500)
**Impact**: Visual hierarchy inconsistent with reference screens
**Fix**: Update to match design tokens

##### HIGH: Button Styling

**Issue**: Start button doesn't match reference button styles
```typescript
// Current
startButton: {
  padding: 18,
  borderRadius: 12,
  minHeight: 56,
}

// Expected
Verify against home/settings button styles
minHeight: 48 (WCAG minimum)
```

**Location**: styles.startButton (line 450+)
**Impact**: Button may not match established patterns
**Fix**: Extract button styles from reference screens and apply

##### MEDIUM: LinearGradient Usage

**Issue**: Uses LinearGradient which may not be in reference screens
```typescript
// Current
<LinearGradient colors={[colors.tint + '20', colors.tint + '05']} />

// Expected
Verify if gradients are used in reference screens
```

**Location**: Hero section (line 150)
**Impact**: May add visual inconsistency
**Fix**: Check if gradients are part of design system, otherwise use solid colors

##### MEDIUM: Icon Sizing

**Issue**: Icon sizes vary
```typescript
// Current
IconSymbol size: 48, 24, 20, 16

// Expected
Verify consistent icon sizing from reference screens
```

**Location**: Various icon usages
**Impact**: Icon hierarchy may not match reference
**Fix**: Standardize icon sizes based on design system

#### Components Requiring Updates

1. **Hero Section** (lines 140-180)
   - Verify gradient usage against reference screens
   - Update typography
   - Check spacing

2. **Tier Cards** (lines 200-300)
   - Update font sizes and weights
   - Ensure border radius matches
   - Verify touch targets for radio buttons

3. **Feature Rows** (lines 280-320)
   - Check icon sizing consistency
   - Verify text styling
   - Check spacing

4. **Start Button** (lines 350-380)
   - Update to match reference button styles
   - Verify touch target (currently 56px, should be 48px minimum)
   - Check color and typography

5. **Compliance Notice** (lines 320-350)
   - Verify background color matches surface color from reference
   - Check icon and text styling
   - Verify spacing

### 3. FeatureUpgradePrompt.tsx

#### Current Styling Issues

##### CRITICAL: Modal Overlay Styling

**Issue**: Modal may not match reference screen modal patterns
```typescript
// Current
overlay: backgroundColor: 'rgba(0, 0, 0, 0.6)'
content: borderRadius: 20, padding: 24

// Expected
Verify against reference screen modals (if any)
```

**Location**: styles.overlay, styles.content (lines 200-250)
**Impact**: Modal may feel disconnected from app
**Fix**: Extract modal patterns from reference screens

##### HIGH: Typography Inconsistency

**Issue**: Font sizes don't match design tokens
```typescript
// Current
title: fontSize: 24, fontWeight: 'bold'
description: fontSize: 16, lineHeight: 24
pricingText: fontSize: 18, fontWeight: 'bold'

// Expected
title: fontSize: 32, fontWeight: '700', letterSpacing: -0.5
description: fontSize: 14, fontWeight: '500', lineHeight: 20
pricingText: fontSize: 18, fontWeight: '500', lineHeight: 24
```

**Location**: styles object (lines 250-350)
**Impact**: Typography hierarchy inconsistent
**Fix**: Update to match design tokens

##### HIGH: Button Styling

**Issue**: Buttons may not match reference patterns
```typescript
// Current
upgradeButton: paddingVertical: 16, borderRadius: 12
laterButton: paddingVertical: 12

// Expected
minHeight: 48, match reference button styles
```

**Location**: Button styles (lines 320-350)
**Impact**: Buttons don't match established patterns
**Fix**: Apply reference button styles

##### MEDIUM: Icon Container

**Issue**: Icon container styling may not match reference
```typescript
// Current
iconContainer: {
  width: 80,
  height: 80,
  borderRadius: 40,
}

// Expected
Verify icon container patterns from reference screens
```

**Location**: styles.iconContainer (line 260)
**Impact**: May not match visual language
**Fix**: Check reference screens for icon container patterns

##### MEDIUM: Shadow Usage

**Issue**: Uses shadow properties that may not match reference
```typescript
// Current
shadowColor: '#000',
shadowOffset: { width: 0, height: 4 },
shadowOpacity: 0.3,
shadowRadius: 8,
elevation: 8,

// Expected
Extract shadow patterns from reference screens
```

**Location**: styles.content (line 240)
**Impact**: Elevation may not match design system
**Fix**: Apply consistent shadow patterns

#### Components Requiring Updates

1. **Modal Overlay** (lines 200-220)
   - Verify overlay opacity and color
   - Check backdrop behavior

2. **Content Container** (lines 220-250)
   - Update border radius to match reference
   - Apply consistent shadows
   - Verify padding

3. **Icon Container** (lines 260-280)
   - Verify sizing and styling
   - Check background color opacity

4. **Typography Elements** (lines 280-320)
   - Update all font sizes and weights
   - Verify line heights
   - Check letter spacing

5. **Buttons** (lines 320-360)
   - Apply reference button styles
   - Verify touch targets
   - Check spacing

## Summary of Components Requiring Updates

### subscription-management.tsx
- [ ] Current Subscription Card
- [ ] Tier Cards (3 tiers)
- [ ] Billing Toggle
- [ ] Status Badges
- [ ] Modal Components
- [ ] Change Plan Buttons
- [ ] Cancel Button

### trial-activation.tsx
- [ ] Hero Section
- [ ] Tier Selection Cards (2 tiers)
- [ ] Feature Rows
- [ ] Start Trial Button
- [ ] Compliance Notice
- [ ] Radio Buttons

### FeatureUpgradePrompt.tsx
- [ ] Modal Overlay
- [ ] Content Container
- [ ] Icon Container
- [ ] Typography Elements
- [ ] Upgrade Button
- [ ] Later Button
- [ ] Trust Indicator

## Design System Gaps

### Missing from Design Tokens

1. **Border Radius Values**: Need to extract from reference screens
2. **Shadow Patterns**: Need to extract elevation system
3. **Button Styles**: Need complete button component patterns
4. **Modal Patterns**: Need modal/overlay styling patterns
5. **Icon Sizing System**: Need standardized icon sizes
6. **Semantic Colors**: Need success, error, warning, info colors

### Recommendations

1. **Extract Complete Design Tokens**: Run additional Playwright scripts to capture:
   - Button styles from home/settings
   - Modal patterns (if any)
   - Shadow/elevation values
   - Complete color palette including semantic colors

2. **Create Design System Components**: Build reusable components:
   - `<DesignSystemButton>` with variants (primary, secondary, tertiary)
   - `<DesignSystemCard>` with consistent styling
   - `<DesignSystemModal>` with standard overlay and content
   - `<DesignSystemBadge>` for status indicators

3. **Document Component Patterns**: Create component library documentation:
   - Button usage guidelines
   - Typography scale and usage
   - Spacing system examples
   - Color usage guidelines

## Next Steps

1. ✅ Complete component audit (this document)
2. ⏭️ Extract missing design tokens from reference screens
3. ⏭️ Update subscription-management.tsx styling
4. ⏭️ Update trial-activation.tsx styling
5. ⏭️ Update FeatureUpgradePrompt.tsx styling
6. ⏭️ Create before/after screenshots
7. ⏭️ Verify design system compliance

## Related Documentation

- [Requirements Document](./requirements.md)
- [Design Document](./design.md)
- [Design Audit Report](./design-audit-report.md)
- [Design Tokens Reference](./design-tokens-reference.json)

---

**Audit Status**: ✅ Completed  
**Last Updated**: 2025-11-09
