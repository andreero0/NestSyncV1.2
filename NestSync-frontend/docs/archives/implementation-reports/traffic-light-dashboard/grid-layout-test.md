---
title: "Traffic Light Cards 2x2 Grid Layout Test Report"
date: 2025-11-04
category: "traffic-light-dashboard"
type: "test-report"
priority: "P1"
status: "partial-pass"
impact: "high"
platforms: ["web"]
related_docs:
  - "NestSync-frontend/docs/archives/implementation-reports/traffic-light-dashboard/design-compliance-validation.md"
  - "NestSync-frontend/docs/archives/implementation-reports/traffic-light-dashboard/final-validation.md"
tags: ["traffic-light", "grid-layout", "responsive-design", "react-native-web"]
---

# Traffic Light Cards 2x2 Grid Layout Test Report

**Test Date:** 2025-11-04
**Tester:** QA Test Automation Engineer (Claude Code)
**Test Environment:** Playwright MCP Server
**Component Under Test:** StatusOverviewGrid (Traffic Light Cards)
**Test Objective:** Verify 2x2 grid layout fix across all breakpoints

---

## Executive Summary

### Overall Status: PARTIAL SUCCESS

The traffic light cards 2x2 grid layout implementation is **working correctly at tablet and desktop breakpoints** but **failing at mobile breakpoints** (< 768px). The root cause has been identified as a React Native Web rendering issue where individual card wrapper Views are not properly inheriting the container's flex properties at smaller viewports.

---

## Test Results by Viewport

### 1. Mobile - iPhone 17 Pro (393x852px)
- **Status:** FAIL
- **Expected:** 2x2 grid layout with 156px cards
- **Actual:** Vertical stacking (single column)
- **Screenshot:** `traffic-light-mobile-393px.png`

**DOM Analysis:**
```
Grid Container (Parent):
  - flexDirection: "row" ✓
  - flexWrap: "wrap" ✓
  - maxWidth: "360px" ✓
  - width: "353px" ✓

Card Wrapper (Individual Cards):
  - flexDirection: "column" ✗ (should inherit from grid)
  - width: "156px" ✓
```

**Issue:** The card wrapper Views have `flexDirection: "column"` which forces vertical stacking despite the grid container having correct `row` and `wrap` properties.

---

### 2. Tablet (768x1024px)
- **Status:** PASS
- **Expected:** 2x2 grid layout with 180px cards
- **Actual:** 2x2 grid layout correctly displayed
- **Screenshot:** `traffic-light-tablet-768px.png`

**DOM Analysis:**
```
Grid Container:
  - flexDirection: "row" ✓
  - flexWrap: "wrap" ✓
  - maxWidth: "432px" ✓
  - width: "432px" ✓

Card Wrapper:
  - width: "180px" ✓
  - marginRight: "24px" ✓
```

**Observation:** At this breakpoint, the 432px container width accommodates exactly 2 cards (180px + 180px + 24px gap + margins = 432px), causing proper wrapping behavior.

---

### 3. Desktop (1280x800px)
- **Status:** PASS
- **Expected:** 2x2 grid layout with 200px cards
- **Actual:** 2x2 grid layout correctly displayed
- **Screenshot:** `traffic-light-desktop-1280px.png`

**DOM Analysis:**
```
Grid Container:
  - flexDirection: "row" ✓
  - flexWrap: "wrap" ✓
  - maxWidth: "488px" (calculated)
  - width: matches container

Card Wrapper:
  - width: "200px" ✓
  - Proper spacing maintained ✓
```

**Observation:** Desktop viewport correctly renders the 2x2 grid with larger cards and appropriate spacing.

---

## Root Cause Analysis

### Problem Identified

The issue occurs specifically at **mobile breakpoints (< 768px)** where:

1. The `StatusOverviewGrid` container has correct styles:
   - `flexDirection: 'row'` ✓
   - `flexWrap: 'wrap'` ✓
   - `maxWidth: dimensions.containerMaxWidth` ✓

2. BUT the individual card wrapper Views are being rendered with:
   - `flexDirection: 'column'` (incorrect)
   - Fixed width (156px) without proper flex properties

3. React Native Web is not properly applying flex layout at mobile viewports, causing cards to stack vertically despite the container having `flexWrap: 'wrap'`.

### Why Tablet/Desktop Work

At larger viewports (>=768px), the combination of:
- Larger container maxWidth (432px for tablet, 488px for desktop)
- Larger card widths (180px, 200px)
- Container width matching maxWidth exactly

...creates a scenario where the flex wrapping naturally occurs because the 3rd card cannot fit on the first row, forcing it to wrap.

At mobile viewports, the narrower container (360px) should also force wrapping, but the card wrappers are not inheriting the flex properties correctly.

---

## Code Review

### Files Analyzed

**1. StatusOverviewGrid.tsx** (Lines 14-39)
```typescript
<View style={[
  styles.container,
  {
    paddingHorizontal: dimensions.edgePadding,
    maxWidth: dimensions.containerMaxWidth, // ✓ Correctly applied
  }
]}>
  {cards.map((cardProps, index) => (
    <View
      key={cardProps.statusType}
      style={[
        {
          width: dimensions.cardWidth,
          height: dimensions.cardHeight,
          marginRight: dimensions.gap,
          marginBottom: dimensions.gap,
        },
        index % 2 === 1 && { marginRight: 0 },
      ]}
    >
      <StatusOverviewCard {...cardProps} dimensions={dimensions} />
    </View>
  ))}
</View>

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',     // ✓ Correct
    flexWrap: 'wrap',          // ✓ Correct
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    paddingVertical: 16,
    alignSelf: 'center',
    width: '100%',
  },
});
```

**Issue:** The card wrapper View (lines 23-32) does not explicitly set `flex` properties, relying on implicit inheritance which fails at mobile breakpoints in React Native Web.

**2. useResponsiveCardDimensions.ts** (Lines 1-117)
```typescript
// Mobile: 360-767px
if (width < 768) {
  return {
    cardWidth: 156,
    cardHeight: 120,
    padding: 16,
    edgePadding: 16,
    gap: 16,
    containerMaxWidth: 360, // ✓ Correctly calculated
    // ...
  };
}
```

**Analysis:** The hook correctly calculates `containerMaxWidth: 360px` which should accommodate 2 cards of 156px + 16px gap + 32px edge padding = 360px. The calculations are correct.

---

## Recommendations

### Priority 1: Fix Mobile Card Wrapper Flex Properties

**Problem:** Card wrapper Views not inheriting flex behavior at mobile breakpoints.

**Solution:** Add explicit flex properties to card wrapper Views:

```typescript
// In StatusOverviewGrid.tsx, lines 23-32
<View
  key={cardProps.statusType}
  style={[
    {
      width: dimensions.cardWidth,
      height: dimensions.cardHeight,
      marginRight: dimensions.gap,
      marginBottom: dimensions.gap,
      flexShrink: 0,  // ADD: Prevent shrinking
      flexGrow: 0,    // ADD: Prevent growing
    },
    index % 2 === 1 && { marginRight: 0 },
  ]}
>
```

**Rationale:** React Native Web's flexbox implementation sometimes requires explicit `flexShrink` and `flexGrow` properties to prevent unexpected behavior, especially at smaller viewports.

---

### Priority 2: Alternative Layout Approach

If Priority 1 doesn't resolve the issue, consider restructuring to use percentage-based widths:

```typescript
// Alternative: Calculate card width as percentage
const cardFlexBasis = '48%'; // Allows 2 cards per row with 4% gap

<View
  style={[
    {
      flexBasis: cardFlexBasis,
      minWidth: dimensions.cardWidth,
      maxWidth: dimensions.cardWidth,
      height: dimensions.cardHeight,
      marginRight: index % 2 === 0 ? dimensions.gap : 0,
      marginBottom: dimensions.gap,
    },
  ]}
>
```

---

### Priority 3: Container Width Adjustment

Ensure container width doesn't exceed viewport width at mobile breakpoints:

```typescript
// In StatusOverviewGrid.tsx
<View style={[
  styles.container,
  {
    paddingHorizontal: dimensions.edgePadding,
    maxWidth: Math.min(dimensions.containerMaxWidth, '100%'),
    width: '100%',
  }
]}>
```

---

### Priority 4: Add React Native Web Platform Detection

Consider platform-specific styles for web:

```typescript
import { Platform } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    ...(Platform.OS === 'web' && {
      display: 'flex',  // Explicit for web
      boxSizing: 'border-box',
    }),
  },
});
```

---

## Testing Validation Checklist

- [x] Test iPhone 17 Pro viewport (393x852) - FAILED
- [x] Test Tablet viewport (768x1024) - PASSED
- [x] Test Desktop viewport (1280x800) - PASSED
- [x] Analyze DOM structure and computed styles
- [x] Review component source code
- [x] Identify root cause
- [x] Provide actionable recommendations

---

## Next Steps

1. Implement Priority 1 fix (add flexShrink and flexGrow)
2. Clear Metro bundler cache: `npx expo start --clear`
3. Re-run Playwright tests on mobile viewports
4. If issue persists, implement Priority 2 alternative approach
5. Validate fix across all breakpoints (320px, 375px, 393px, 768px, 1280px)

---

## Technical Details

### Environment
- Frontend: Expo SDK ~53, React Native Web
- Test Server: http://localhost:8082
- GraphQL Backend: http://localhost:8001
- Test Credentials: parents@nestsync.com / Shazam11#

### Files Modified (Previous Attempt)
- `hooks/useResponsiveCardDimensions.ts` - Added containerMaxWidth calculation ✓
- `components/cards/StatusOverviewGrid.tsx` - Applied maxWidth to container ✓

### Issue Status
- Code changes are correct and working at tablet/desktop
- React Native Web rendering issue at mobile breakpoints
- Requires additional flex property specifications for mobile

---

## Screenshots

### Mobile (393px) - FAILED
![Mobile View](../.playwright-mcp/traffic-light-mobile-393px.png)
Shows vertical stacking instead of 2x2 grid.

### Tablet (768px) - PASSED
![Tablet View](../.playwright-mcp/traffic-light-tablet-768px.png)
Correctly displays 2x2 grid layout.

### Desktop (1280px) - PASSED
![Desktop View](../.playwright-mcp/traffic-light-desktop-1280px.png)
Correctly displays 2x2 grid layout with larger cards.

---

## Conclusion

The `containerMaxWidth` fix successfully enables 2x2 grid layout at tablet and desktop breakpoints. However, an additional fix is required for mobile viewports (< 768px) where React Native Web's flex rendering is not properly wrapping the cards. The recommended solution is to add explicit `flexShrink: 0` and `flexGrow: 0` properties to the card wrapper Views to ensure predictable flexbox behavior across all viewport sizes.

**Estimated Fix Time:** 5-10 minutes
**Re-test Required:** Yes, focus on mobile viewports
**Risk Level:** Low (isolated change to card wrapper styles)
