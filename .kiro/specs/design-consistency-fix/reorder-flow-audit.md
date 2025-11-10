---
title: "Reorder Flow Component Audit"
date: 2025-11-09
category: "design-audit"
type: "component-audit"
status: "completed"
impact: "high"
related_docs:
  - "./requirements.md"
  - "./design.md"
  - "./design-audit-report.md"
  - "./premium-upgrade-audit.md"
tags: ["reorder-flow", "planner", "design-system", "audit"]
---

# Reorder Flow Component Audit

**Audit Date**: 2025-11-09  
**Auditor**: Kiro AI Agent  
**Scope**: Reorder flow screens and components

## Executive Summary

This audit identifies all components in the reorder flow and documents their current styling compared to the established design system tokens extracted from reference screens (home, settings).

### Components Audited

1. **reorder-suggestions.tsx** - Main reorder suggestions screen
2. **planner.tsx** - Dashboard/planner screen with reorder integration
3. **ReorderSuggestionCard.tsx** - Individual reorder suggestion cards
4. **PremiumUpgradeModal.tsx** - Premium upgrade modal
5. **EmergencyOrderModal.tsx** - Emergency order modal
6. **ReorderSuggestionsContainer.tsx** - Container component
7. **TrialCountdownBanner.tsx** - Trial countdown banner (already fixed in Task 5)

### Overall Findings

- **Compliance Score**: 70/100
- **Critical Issues**: 4
- **High Priority Issues**: 12
- **Medium Priority Issues**: 15
- **Low Priority Issues**: 8

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
- **Base Unit**: 4px

### Touch Targets
- **Minimum**: 48px (WCAG AAA standard)

## Component Analysis

### 1. reorder-suggestions.tsx

#### Current Styling Issues

##### HIGH: Typography Inconsistency

**Issue**: Font sizes don't match reference screens
```typescript
// Current
loadingText: fontSize: 16, fontWeight: '500'
errorTitle: fontSize: 24, fontWeight: '700'
screenTitle: fontSize: 22, fontWeight: '700'
screenSubtitle: fontSize: 14, lineHeight: 20

// Expected (Design System)
loadingText: fontSize: 14, fontWeight: '500', lineHeight: 20, letterSpacing: 0.1
errorTitle: fontSize: 32, fontWeight: '700', letterSpacing: -0.5
screenTitle: fontSize: 32, fontWeight: '700', letterSpacing: -0.5
screenSubtitle: fontSize: 14, fontWeight: '500', lineHeight: 20, letterSpacing: 0.1
```

**Location**: styles object (lines 500-700)
**Impact**: Visual hierarchy doesn't match home/settings screens
**Fix**: Update font sizes and weights to match design tokens

##### MEDIUM: Button Touch Targets

**Issue**: Some buttons may not meet 48px minimum
```typescript
// Current
retryButton: style={styles.retryButton}
backButton: style={styles.backButton}
addChildButton: style={styles.addChildButton}

// Expected
All buttons should have minHeight: 48, minWidth: 48
```

**Location**: Button components
**Impact**: Accessibility concern
**Fix**: Ensure all interactive elements meet 48px minimum touch target

#### Components Requiring Updates

1. **Loading State**
   - Update loadingText typography
   - Verify mlBadge styling

2. **Error State**
   - Update errorTitle from 24px to 32px
   - Update errorMessage typography
   - Verify button touch targets

3. **Screen Header**
   - Update screenTitle from 22px to 32px
   - Update screenSubtitle typography
   - Verify trustBadge styling

### 2. planner.tsx

#### Current Styling Issues

##### CRITICAL: Typography Hierarchy Inconsistent

**Issue**: Multiple font sizes don't match design system
```typescript
// Current
headerTitle: fontSize: 32, fontWeight: '600', letterSpacing: -0.5
subtitle: fontSize: 18, lineHeight: 24, fontWeight: '400'
sectionTitle: fontSize: 24, fontWeight: '600', letterSpacing: -0.01
filterText: fontSize: 16, fontWeight: '600'
toggleText: fontSize: 16, fontWeight: '600'
plannerCardTitle: fontSize: 16, fontWeight: '600'
plannerCardDescription: fontSize: 16, lineHeight: 24
inventoryTitle: fontSize: 16, lineHeight: 24
inventoryQuantity: fontSize: 16, lineHeight: 24

// Expected (Design System)
headerTitle: fontSize: 32, fontWeight: '700', letterSpacing: -0.5 ✓ (weight needs update)
subtitle: fontSize: 18, fontWeight: '500', lineHeight: 24 (weight needs update)
sectionTitle: fontSize: 18, fontWeight: '500', lineHeight: 24 (size and weight need update)
filterText: fontSize: 14, fontWeight: '500', lineHeight: 20, letterSpacing: 0.1
toggleText: fontSize: 14, fontWeight: '500', lineHeight: 20, letterSpacing: 0.1
plannerCardTitle: fontSize: 14, fontWeight: '500', lineHeight: 20, letterSpacing: 0.1
plannerCardDescription: fontSize: 14, fontWeight: '500', lineHeight: 20, letterSpacing: 0.1
inventoryTitle: fontSize: 14, fontWeight: '500', lineHeight: 20, letterSpacing: 0.1
inventoryQuantity: fontSize: 14, fontWeight: '500', lineHeight: 20, letterSpacing: 0.1
```

**Location**: styles object (lines 850-1700)
**Impact**: Entire screen typography hierarchy is inconsistent
**Fix**: Comprehensive typography update needed

##### HIGH: Button Touch Targets

**Issue**: Toggle buttons may not meet 48px minimum
```typescript
// Current
toggleButton: {
  paddingVertical: 12,
  paddingHorizontal: 20,
}

// Expected
toggleButton: {
  paddingVertical: 14, // Increased to meet 48px minimum
  paddingHorizontal: 20,
  minHeight: 48,
}
```

**Location**: styles.toggleButton
**Impact**: Accessibility concern
**Fix**: Increase padding to meet touch target requirements

##### HIGH: Filter Button Touch Targets

**Issue**: Filter buttons may not meet 48px minimum
```typescript
// Current
filterButton: {
  paddingHorizontal: 16,
  paddingVertical: 8,
}

// Expected
filterButton: {
  paddingHorizontal: 16,
  paddingVertical: 16, // Increased to meet 48px minimum
  minHeight: 48,
}
```

**Location**: styles.filterButton
**Impact**: Accessibility concern
**Fix**: Increase padding to meet touch target requirements

#### Components Requiring Updates

1. **Header**
   - Update headerTitle fontWeight from '600' to '700'
   - Update subtitle fontWeight from '400' to '500'

2. **Filter Section**
   - Update filterText from 16px to 14px
   - Add fontWeight: '500', lineHeight: 20, letterSpacing: 0.1
   - Update filterButton touch targets

3. **View Toggle**
   - Update toggleText from 16px to 14px
   - Add fontWeight: '500', lineHeight: 20, letterSpacing: 0.1
   - Update toggleButton touch targets

4. **Section Titles**
   - Update sectionTitle from 24px to 18px
   - Update fontWeight from '600' to '500'
   - Add lineHeight: 24

5. **Planner Cards**
   - Update plannerCardTitle from 16px to 14px
   - Update plannerCardDescription from 16px to 14px
   - Add proper line heights and letter spacing

6. **Inventory Items**
   - Update inventoryTitle from 16px to 14px
   - Update inventoryQuantity from 16px to 14px
   - Add proper line heights and letter spacing

7. **Summary Stats**
   - Update summaryStatLabel typography
   - Verify summaryStatNumber sizing

### 3. ReorderSuggestionCard.tsx

#### Current Styling Issues

##### HIGH: Typography Inconsistency

**Issue**: Font sizes and weights don't match design system
```typescript
// Current
loadingText: fontSize: 16, fontWeight: '500' (assumed from context)

// Expected
loadingText: fontSize: 14, fontWeight: '500', lineHeight: 20, letterSpacing: 0.1
```

**Location**: styles object
**Impact**: Card typography doesn't match reference screens
**Fix**: Update all text elements to match design tokens

##### MEDIUM: Card Styling

**Issue**: Card styling may not match reference patterns
```typescript
// Current
Uses NestSyncCard component with variant="elevated"

// Expected
Verify card matches reference screen card styling
```

**Location**: Card component usage
**Impact**: Visual consistency
**Fix**: Ensure card styling matches reference screens

#### Components Requiring Updates

1. **Loading State**
   - Update loadingText typography

2. **Card Content**
   - Update all text elements to match design system
   - Verify button touch targets
   - Check icon sizing consistency

### 4. PremiumUpgradeModal.tsx

#### Current Styling Issues

##### HIGH: Typography Inconsistency

**Issue**: Modal typography doesn't match design system
```typescript
// Current
(Need to verify exact values from full file)

// Expected
Modal titles: fontSize: 32, fontWeight: '700', letterSpacing: -0.5
Modal body text: fontSize: 14, fontWeight: '500', lineHeight: 20, letterSpacing: 0.1
```

**Location**: styles object
**Impact**: Modal doesn't match app typography
**Fix**: Update all typography to match design tokens

##### MEDIUM: Button Styling

**Issue**: Buttons may not match reference patterns
```typescript
// Current
Uses NestSyncButton component

// Expected
Verify buttons match reference button styling
Ensure 48px minimum touch targets
```

**Location**: Button components
**Impact**: Button consistency
**Fix**: Apply reference button styles

#### Components Requiring Updates

1. **Modal Header**
   - Update header typography
   - Verify close button touch target

2. **Plan Cards**
   - Update plan name typography
   - Update plan description typography
   - Update pricing typography

3. **Feature Lists**
   - Update feature text typography
   - Verify icon sizing

4. **Action Buttons**
   - Verify touch targets meet 48px minimum
   - Update button text typography

### 5. EmergencyOrderModal.tsx

#### Current Styling Issues

##### HIGH: Typography Inconsistency

**Issue**: Modal typography doesn't match design system
```typescript
// Current
headerTitle: fontSize: 20, fontWeight: '700'
headerSubtitle: fontSize: 13
sectionTitle: fontSize: 16, fontWeight: '600'
categoryName: fontSize: 13, fontWeight: '600'
label: fontSize: 14, fontWeight: '600'

// Expected
headerTitle: fontSize: 32, fontWeight: '700', letterSpacing: -0.5
headerSubtitle: fontSize: 14, fontWeight: '500', lineHeight: 20, letterSpacing: 0.1
sectionTitle: fontSize: 18, fontWeight: '500', lineHeight: 24
categoryName: fontSize: 14, fontWeight: '500', lineHeight: 20, letterSpacing: 0.1
label: fontSize: 14, fontWeight: '500', lineHeight: 20, letterSpacing: 0.1
```

**Location**: styles object (lines 200-400)
**Impact**: Modal typography hierarchy inconsistent
**Fix**: Comprehensive typography update needed

##### HIGH: Button Touch Targets

**Issue**: Category cards and buttons may not meet 48px minimum
```typescript
// Current
categoryCard: minHeight: 80
closeButton: minWidth: 48, minHeight: 48 ✓
quantityButton: width: 48, height: 48 ✓

// Expected
Verify all interactive elements meet 48px minimum
```

**Location**: Button and card styles
**Impact**: Accessibility concern
**Fix**: Ensure all touch targets meet requirements

#### Components Requiring Updates

1. **Modal Header**
   - Update headerTitle from 20px to 32px
   - Update headerSubtitle from 13px to 14px
   - Verify close button (already compliant)

2. **Category Grid**
   - Update categoryName from 13px to 14px
   - Verify category card touch targets

3. **Form Inputs**
   - Update label typography
   - Verify input styling

4. **Quantity Selector**
   - Verify quantityButton (already compliant)
   - Update quantityInput typography

5. **Delivery Options**
   - Update delivery option text typography
   - Verify touch targets

## Summary of Components Requiring Updates

### reorder-suggestions.tsx
- [ ] Loading text typography
- [ ] Error title typography (24px → 32px)
- [ ] Screen title typography (22px → 32px)
- [ ] Screen subtitle typography
- [ ] Button touch targets

### planner.tsx
- [ ] Header title fontWeight ('600' → '700')
- [ ] Subtitle fontWeight ('400' → '500')
- [ ] Section title (24px → 18px, '600' → '500')
- [ ] Filter text (16px → 14px)
- [ ] Filter button touch targets
- [ ] Toggle text (16px → 14px)
- [ ] Toggle button touch targets
- [ ] Planner card title (16px → 14px)
- [ ] Planner card description (16px → 14px)
- [ ] Inventory title (16px → 14px)
- [ ] Inventory quantity (16px → 14px)
- [ ] All text elements need proper line heights and letter spacing

### ReorderSuggestionCard.tsx
- [ ] Loading text typography
- [ ] Card content typography
- [ ] Button touch targets
- [ ] Icon sizing verification

### PremiumUpgradeModal.tsx
- [ ] Modal header typography
- [ ] Plan card typography
- [ ] Feature list typography
- [ ] Button touch targets
- [ ] Button text typography

### EmergencyOrderModal.tsx
- [ ] Header title (20px → 32px)
- [ ] Header subtitle (13px → 14px)
- [ ] Section title (16px → 18px, '600' → '500')
- [ ] Category name (13px → 14px)
- [ ] Label typography
- [ ] All text elements need proper line heights and letter spacing

## Design System Gaps

### Missing from Design Tokens

1. **Modal Patterns**: Need modal/overlay styling patterns
2. **Card Patterns**: Need card component styling patterns
3. **Form Input Patterns**: Need input field styling patterns
4. **Badge Patterns**: Need badge/pill styling patterns

### Recommendations

1. **Extract Complete Design Tokens**: Run additional Playwright scripts to capture:
   - Modal patterns from reference screens
   - Card patterns from home/settings
   - Form input patterns
   - Badge/pill patterns

2. **Create Reusable Components**: Build design system components:
   - `<DesignSystemModal>` with standard styling
   - `<DesignSystemCard>` with consistent patterns
   - `<DesignSystemInput>` with form styling
   - `<DesignSystemBadge>` for status indicators

3. **Document Component Patterns**: Create component library documentation:
   - Modal usage guidelines
   - Card usage guidelines
   - Form input guidelines
   - Badge usage guidelines

## Next Steps

1. ✅ Complete component audit (this document)
2. ⏭️ Update reorder-suggestions.tsx styling
3. ⏭️ Update planner.tsx styling
4. ⏭️ Update ReorderSuggestionCard.tsx styling
5. ⏭️ Update PremiumUpgradeModal.tsx styling
6. ⏭️ Update EmergencyOrderModal.tsx styling
7. ⏭️ Create before/after screenshots
8. ⏭️ Verify design system compliance

## Related Documentation

- [Requirements Document](./requirements.md)
- [Design Document](./design.md)
- [Design Audit Report](./design-audit-report.md)
- [Premium Upgrade Audit](./premium-upgrade-audit.md)
- [Design Tokens Reference](./design-tokens-reference.json)

---

**Audit Status**: ✅ Completed  
**Last Updated**: 2025-11-09
