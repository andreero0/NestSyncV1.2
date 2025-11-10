# Design System Audit Instructions

**Generated:** 11/9/2025, 5:52:37 PM

## Overview

This document provides instructions for conducting a comprehensive design system audit of the NestSync application. The audit compares inconsistent screens against reference screens to identify design token violations and accessibility issues.

## Reference Screens (Good Design)

These screens demonstrate proper design system implementation:

### Dashboard Home Screen
- **Path:** `/`
- **Screenshot:** `reference-home.png`

### Settings Screen
- **Path:** `/profile-settings`
- **Screenshot:** `reference-settings.png`

## Screens to Audit (Inconsistent Design)

These screens need to be aligned with the design system:

### Premium Upgrade Flow
- **Path:** `/subscription-management`
- **Screenshot:** `audit-subscription-management.png`

### Reorder Flow
- **Path:** `/reorder-suggestions-simple`
- **Screenshot:** `audit-reorder-suggestions.png`

### Size Prediction Interface
- **Path:** `/size-guide`
- **Screenshot:** `audit-size-guide.png`

## Design Token Reference

### Colors

**Primary Colors:**
- blue: `#0891B2`
- blueDark: `#0E7490`
- blueLight: `#E0F2FE`

**Secondary Colors:**
- green: `#059669`
- greenLight: `#D1FAE5`
- greenPale: `#F0FDF4`

**Accent Colors:**
- orange: `#EA580C`
- amber: `#D97706`
- purple: `#7C3AED`

### Typography

**Font Sizes:**
- caption: 11px
- small: 12px
- body: 14px
- subtitle: 16px
- title: 20px
- largeTitle: 28px

**Font Weights:**
- regular: 400
- medium: 500
- semibold: 600
- bold: 700

### Spacing

**Base Unit:** 4px

All spacing must be a multiple of 4px:
- xs: 4px (1 units)
- sm: 8px (2 units)
- md: 12px (3 units)
- lg: 16px (4 units)
- xl: 20px (5 units)
- xxl: 24px (6 units)

### Border Radius

- sm: 6px
- md: 8px
- lg: 12px
- xl: 16px

### Touch Targets

- **Minimum:** 48px × 48px (WCAG AA)

## Audit Process

### Step 1: Capture Screenshots

Use Playwright MCP or manual browser screenshots to capture:

1. **Reference Screens:**
   - Navigate to `/`
   - Save screenshot as `reference-home.png`
   - Navigate to `/profile-settings`
   - Save screenshot as `reference-settings.png`

2. **Inconsistent Screens:**
   - Navigate to `/subscription-management`
   - Save screenshot as `audit-subscription-management.png`
   - Navigate to `/reorder-suggestions-simple`
   - Save screenshot as `audit-reorder-suggestions.png`
   - Navigate to `/size-guide`
   - Save screenshot as `audit-size-guide.png`

### Step 2: Extract Design Tokens

From reference screens, document:
- Primary button colors, typography, spacing
- Card styling (background, border, shadow, radius)
- Text hierarchy (sizes, weights, colors)
- Spacing patterns (margins, padding)
- Touch target sizes

### Step 3: Analyze Inconsistent Screens

For each inconsistent screen, compare against design tokens:

**Color Compliance:**
- Count elements using design token colors vs hardcoded colors
- Calculate percentage: (compliant / total) × 100

**Typography Compliance:**
- Count text elements using design system sizes/weights
- Calculate percentage: (compliant / total) × 100

**Spacing Compliance:**
- Count spacing values that are multiples of 4px
- Calculate percentage: (compliant / total) × 100

**Touch Target Compliance:**
- Count buttons/interactive elements ≥ 48px height
- Calculate percentage: (compliant / total) × 100

**Overall Score:**
- Average of all four compliance metrics

### Step 4: Document Issues

For each screen, document:
- Specific elements not using design tokens
- Hardcoded values that should use tokens
- Touch targets below 48px minimum
- Spacing not using 4px base unit

### Step 5: Generate Recommendations

For each issue, provide:
- Specific fix (e.g., "Replace #3B82F6 with NestSyncColors.primary.blue")
- Priority (Critical, High, Medium, Low)
- Estimated effort

## Report Template

Use this template for the final audit report:

```markdown
# Design System Audit Report

## Executive Summary
- Average Compliance: X%
- Total Issues: X
- Critical Issues: X

## [Screen Name]
**Compliance Scores:**
- Color: X%
- Typography: X%
- Spacing: X%
- Touch Targets: X%
- Overall: X%

**Issues:**
1. [Issue description]

**Recommendations:**
1. [Fix description]
```

## Compliance Thresholds

- **Excellent:** 90-100% compliance
- **Good:** 75-89% compliance
- **Needs Improvement:** 60-74% compliance
- **Critical:** <60% compliance

## Next Steps

1. Complete screenshot capture for all screens
2. Analyze each screen against design tokens
3. Calculate compliance scores
4. Document issues and recommendations
5. Generate final audit report
6. Prioritize fixes based on compliance scores
