# Design System Validation

This directory contains design system audit reports, extracted design tokens, compliance checklists, and validation tools for the NestSync application.

---

## Directory Contents

### Audit Reports

- **[design-audit-report.md](./design-audit-report.md)** - Comprehensive audit of design system compliance across all screens
  - Executive summary with compliance scores
  - Screen-by-screen analysis with issues and recommendations
  - Priority-based issue categorization
  - Next steps and action items

### Design Tokens

- **[design-tokens-extracted.md](./design-tokens-extracted.md)** - Design tokens extracted from reference screens
  - Complete color palette with usage guidelines
  - Typography scale with font sizes and weights
  - Spacing system based on 4px base unit
  - Border radius, shadows, and touch target specifications
  - Component patterns and usage examples

### Compliance Tools

- **[design-compliance-checklist.md](./design-compliance-checklist.md)** - Comprehensive checklist for design system compliance
  - Color, typography, spacing, and touch target checklists
  - Component-specific validation checklists
  - Screen-specific checklists
  - Common violations and fixes
  - Testing and validation procedures

### Instructions

- **[design-audit-instructions.md](./design-audit-instructions.md)** - Step-by-step guide for conducting design audits
  - Screenshot capture instructions
  - Design token extraction methodology
  - Compliance scoring calculations
  - Report generation templates

### Configuration

- **[design-audit-config.json](./design-audit-config.json)** - Machine-readable audit configuration
  - Reference screen definitions
  - Inconsistent screen definitions
  - Design token specifications
  - Compliance metrics definitions

---

## Quick Start

### For Developers

1. **Before Starting a New Feature:**
   - Review [design-tokens-extracted.md](./design-tokens-extracted.md) for available design tokens
   - Check [design-compliance-checklist.md](./design-compliance-checklist.md) for requirements
   - Use reference screens (Dashboard Home, Settings) as visual guides

2. **During Development:**
   - Use `NestSyncColors` constants for all colors
   - Ensure all spacing is a multiple of 4px
   - Verify all touch targets are minimum 48px
   - Follow component patterns from design tokens document

3. **Before Committing:**
   - Run through relevant checklist sections
   - Compare visually with reference screens
   - Test on at least one physical device
   - Verify accessibility requirements

### For Designers

1. **Creating New Designs:**
   - Use design tokens from [design-tokens-extracted.md](./design-tokens-extracted.md)
   - Maintain consistency with reference screens
   - Ensure all touch targets are minimum 48px
   - Verify color contrast meets WCAG AA (4.5:1)

2. **Reviewing Implementations:**
   - Compare with design tokens document
   - Check [design-audit-report.md](./design-audit-report.md) for known issues
   - Use compliance checklist for validation

### For QA/Testers

1. **Testing New Features:**
   - Use [design-compliance-checklist.md](./design-compliance-checklist.md) for validation
   - Compare with reference screens for visual consistency
   - Test touch targets on physical devices
   - Verify accessibility with screen readers

2. **Reporting Issues:**
   - Reference specific checklist items
   - Include screenshots comparing with reference screens
   - Note which design tokens are violated

---

## Reference Screens

### Properly Implemented (Use as Reference)

1. **Dashboard Home** (`app/(tabs)/index.tsx`)
   - Demonstrates proper color usage
   - Shows correct spacing patterns
   - Exemplifies button styling
   - Illustrates card layouts

2. **Settings** (`app/profile-settings.tsx`)
   - Shows form element styling
   - Demonstrates list item patterns
   - Illustrates section headers
   - Exemplifies typography hierarchy

### Screens Requiring Updates

1. **Premium Upgrade Flow** (`app/(subscription)/subscription-management.tsx`)
   - Compliance: 67.5%
   - Priority: High
   - Main issues: Touch targets, hardcoded colors, spacing

2. **Reorder Flow** (`app/reorder-suggestions-simple.tsx`)
   - Compliance: 72.5%
   - Priority: Medium
   - Main issues: Card spacing, button text size, shadows

3. **Size Prediction** (`app/size-guide.tsx`)
   - Compliance: 62.5%
   - Priority: High
   - Main issues: Spacing, touch targets, color tokens, typography

---

## Design Token Quick Reference

### Colors

```typescript
// Primary
NestSyncColors.primary.blue      // #0891B2 - Main CTAs
NestSyncColors.primary.blueDark  // #0E7490 - Hover states
NestSyncColors.primary.blueLight // #E0F2FE - Selected states

// Neutral
NestSyncColors.neutral[50]   // #F9FAFB - Backgrounds
NestSyncColors.neutral[100]  // #F3F4F6 - Card backgrounds
NestSyncColors.neutral[200]  // #E5E7EB - Borders
NestSyncColors.neutral[500]  // #6B7280 - Body text
NestSyncColors.neutral[600]  // #4B5563 - Headings
```

### Typography

```typescript
fontSize: 28,  // Large Title
fontSize: 20,  // Title
fontSize: 16,  // Subtitle
fontSize: 14,  // Body (most common)
fontSize: 12,  // Small
fontSize: 11,  // Caption

fontWeight: '400',  // Regular (body text)
fontWeight: '500',  // Medium (labels)
fontWeight: '600',  // Semibold (headings, buttons)
fontWeight: '700',  // Bold (large titles)
```

### Spacing (4px base unit)

```typescript
padding: 4,   // XS (1 unit)
padding: 8,   // SM (2 units)
padding: 12,  // MD (3 units)
padding: 16,  // LG (4 units) - Most common
padding: 20,  // XL (5 units)
padding: 24,  // XXL (6 units)
```

### Other Tokens

```typescript
borderRadius: 12,  // Cards, buttons
borderRadius: 8,   // Input fields
borderRadius: 6,   // Badges

minHeight: 48,     // Touch target minimum (WCAG AA)
```

---

## Compliance Scoring

### Thresholds

- **Excellent:** 90-100% - Fully aligned with design system
- **Good:** 75-89% - Minor inconsistencies, low priority
- **Needs Improvement:** 60-74% - Moderate issues, should be addressed
- **Critical:** <60% - Significant issues, high priority

### Metrics

1. **Color Compliance** - Percentage of colors using design tokens
2. **Typography Compliance** - Percentage of text using correct sizes/weights
3. **Spacing Compliance** - Percentage of spacing using 4px base unit
4. **Touch Target Compliance** - Percentage of buttons meeting 48px minimum
5. **Overall Score** - Average of all four metrics

---

## Common Issues and Fixes

### Issue: Hardcoded Colors

**Problem:** Using `#3B82F6` instead of design token
**Fix:** Replace with `NestSyncColors.primary.blue`
**Impact:** Visual inconsistency, maintenance difficulty

### Issue: Non-Standard Spacing

**Problem:** Using `padding: 14` or `margin: 10`
**Fix:** Use multiples of 4px: `padding: 16` or `margin: 12`
**Impact:** Visual rhythm inconsistency

### Issue: Touch Targets Too Small

**Problem:** Button height is 40px
**Fix:** Add `minHeight: 48` and `paddingVertical: 12`
**Impact:** Accessibility violation (WCAG AA)

### Issue: Non-Standard Font Sizes

**Problem:** Using `fontSize: 15` or `fontSize: 13`
**Fix:** Use design system sizes: `fontSize: 16` or `fontSize: 12`
**Impact:** Typography hierarchy inconsistency

---

## Validation Tools

### Manual Tools

1. **Screenshot Comparison**
   - Capture screenshots of reference and target screens
   - Compare side-by-side for visual consistency
   - Use color picker to verify token usage

2. **Spacing Measurement**
   - Use browser dev tools to measure spacing
   - Verify all values are multiples of 4px
   - Check touch target sizes

3. **Color Contrast Checker**
   - Verify text meets WCAG AA (4.5:1 minimum)
   - Check interactive elements (3:1 minimum)
   - Test with different color schemes

### Automated Tools

1. **Playwright Visual Regression**
   - Run: `npm run test:design-audit` (when configured)
   - Captures screenshots automatically
   - Compares against baselines

2. **Accessibility Testing**
   - Run: `npm run test:a11y` (when configured)
   - Uses axe-core for automated checks
   - Verifies WCAG compliance

3. **ESLint Design Rules**
   - Catches hardcoded values in code
   - Enforces design token usage
   - Prevents common violations

---

## Audit Process

### Step 1: Capture Screenshots

Use Playwright MCP or manual browser screenshots:

1. Navigate to reference screens (Dashboard Home, Settings)
2. Capture full-page screenshots
3. Navigate to screens being audited
4. Capture full-page screenshots
5. Save to `screenshots/` directory

### Step 2: Extract Design Tokens

From reference screens, document:

1. Colors used (backgrounds, text, borders)
2. Typography (sizes, weights, line heights)
3. Spacing patterns (padding, margins, gaps)
4. Border radius values
5. Shadow specifications
6. Touch target sizes

### Step 3: Analyze Screens

For each screen being audited:

1. Compare colors against design tokens
2. Verify typography matches design system
3. Check spacing uses 4px base unit
4. Measure touch target sizes
5. Calculate compliance scores

### Step 4: Document Findings

Create audit report with:

1. Compliance scores for each metric
2. Specific issues found
3. Recommended fixes with code examples
4. Priority levels (Critical, High, Medium, Low)
5. Estimated effort for fixes

### Step 5: Implement Fixes

1. Start with critical issues (touch targets, accessibility)
2. Fix one screen at a time
3. Test thoroughly after each fix
4. Re-audit to verify improvements

---

## Screenshots Directory

The `screenshots/` subdirectory contains:

- **Reference Screenshots:** `reference-{screen-name}.png`
  - `reference-home.png` - Dashboard Home
  - `reference-settings.png` - Settings Screen

- **Audit Screenshots:** `audit-{screen-name}.png`
  - `audit-subscription-management.png` - Premium Upgrade Flow
  - `audit-reorder-suggestions.png` - Reorder Flow
  - `audit-size-guide.png` - Size Prediction Interface

- **Before/After Screenshots:** For tracking improvements
  - `before-{screen-name}.png`
  - `after-{screen-name}.png`

---

## Maintenance

### Regular Audits

- **Weekly:** Spot-check new features for compliance
- **Monthly:** Full audit of all screens
- **Quarterly:** Update design tokens and documentation

### Continuous Improvement

- Document new patterns as they emerge
- Update checklists based on common violations
- Add automated checks for frequent issues
- Share learnings with team

### Documentation Updates

- Keep design tokens synchronized with code
- Update audit reports after fixes
- Maintain compliance checklist
- Archive historical audit reports

---

## Resources

### Internal Documentation

- [Design System Overview](../design-system/README.md)
- [Component Usage Guidelines](../components/README.md)
- [Accessibility Guidelines](../accessibility/README.md)

### External Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Material Design Touch Targets](https://material.io/design/usability/accessibility.html#layout-and-typography)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)

### Tools

- [Playwright](https://playwright.dev/) - Browser automation and testing
- [axe-core](https://github.com/dequelabs/axe-core) - Accessibility testing
- [Color Contrast Checker](https://webaim.org/resources/contrastchecker/)

---

## Support

### Questions or Issues?

- **Design System Team:** For design token questions
- **Accessibility Team:** For WCAG compliance questions
- **Frontend Team:** For implementation questions

### Contributing

To improve this documentation:

1. Submit issues for unclear or missing information
2. Propose updates via pull requests
3. Share feedback on audit process
4. Suggest new validation tools or checks

---

**Last Updated:** 2025-01-09
**Status:** Active
**Next Audit:** After design system fixes (estimated 2-3 weeks)
