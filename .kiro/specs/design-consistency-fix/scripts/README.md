# Design System Audit Scripts

This directory contains automated scripts for conducting a comprehensive design system audit of the NestSync application.

## Overview

The audit process compares recently implemented features against the established design system used in core screens (home, settings, onboarding, navigation) to identify visual inconsistencies.

## Prerequisites

1. **Node.js and npm** installed
2. **Playwright** installed in the project
3. **Development server running** at the configured URL
4. **Test user account** with credentials in the test data

## Installation

If Playwright is not already installed:

```bash
cd NestSync-frontend
npm install playwright
```

## Scripts

### 1. `run-full-audit.js` (Recommended)

Runs the complete audit process in sequence.

```bash
node run-full-audit.js
```

**What it does:**
- Captures reference screen screenshots
- Captures inconsistent screen screenshots
- Extracts design tokens from reference screens
- Generates comprehensive audit report

**Output:**
- `audit-screenshots/reference/` - Reference screen screenshots
- `audit-screenshots/inconsistent/` - Inconsistent screen screenshots
- `design-tokens-reference.json` - Extracted design tokens
- `design-audit-report.md` - Comprehensive audit report

### 2. `capture-reference-screens.js`

Captures screenshots of screens that exemplify the established design system.

```bash
node capture-reference-screens.js
```

**Screens captured:**
- Home screen (full page and viewport)
- Settings screen (full page and viewport)
- Navigation elements
- Onboarding flow (if accessible)
- Component details (buttons, cards)

**Output:** `audit-screenshots/reference/`

### 3. `capture-inconsistent-screens.js`

Captures screenshots of screens that may have design inconsistencies.

```bash
node capture-inconsistent-screens.js
```

**Screens captured:**
- Premium upgrade flow
- Reorder flow
- Size change prediction interface
- Payment-related screens
- Trial banner

**Output:** `audit-screenshots/inconsistent/`

### 4. `extract-design-tokens.js`

Extracts computed styles from reference screens to document design tokens.

```bash
node extract-design-tokens.js
```

**Tokens extracted:**
- Colors (text, background, border)
- Typography (sizes, weights, line heights, families)
- Spacing (padding, margin, gap)
- Borders (radius, width)
- Shadows
- Dimensions

**Output:** `design-tokens-reference.json`

### 5. `generate-audit-report.js`

Generates a comprehensive audit report with compliance scores.

```bash
node generate-audit-report.js
```

**Report includes:**
- Design token reference
- Identified issues by screen
- Compliance scores
- Screenshots comparison
- Recommendations
- Design system compliance checklist

**Output:** `design-audit-report.md`

## Configuration

### Environment Variables

Set these in `NestSync-frontend/.env.local`:

```bash
EXPO_PUBLIC_BACKEND_URL=http://localhost:19006
```

### Test Credentials

Update in each script if needed:

```javascript
const TEST_USER = {
  email: 'test@nestsync.ca',
  password: 'TestPassword123!'
};
```

### Viewport Settings

Default viewport (iPhone X):

```javascript
const VIEWPORT = { width: 375, height: 812 };
```

## Running Individual Steps

You can run scripts individually if needed:

```bash
# Step 1: Capture reference screens
node capture-reference-screens.js

# Step 2: Capture inconsistent screens
node capture-inconsistent-screens.js

# Step 3: Extract design tokens
node extract-design-tokens.js

# Step 4: Generate report
node generate-audit-report.js
```

## Troubleshooting

### "Cannot find module 'playwright'"

Install Playwright:

```bash
cd NestSync-frontend
npm install playwright
```

### "Navigation timeout"

Increase timeout in scripts or ensure the development server is running:

```bash
cd NestSync-frontend
npm start
```

### "Login failed"

Verify test credentials exist in the database or update credentials in scripts.

### Screenshots are blank

- Ensure the app is fully loaded before screenshots
- Check that elements are visible
- Try increasing `waitForTimeout` values

### "ENOENT: no such file or directory"

Scripts automatically create directories. If this persists, manually create:

```bash
mkdir -p audit-screenshots/reference
mkdir -p audit-screenshots/inconsistent
```

## Output Structure

```
.kiro/specs/design-consistency-fix/
├── scripts/
│   ├── README.md (this file)
│   ├── run-full-audit.js
│   ├── capture-reference-screens.js
│   ├── capture-inconsistent-screens.js
│   ├── extract-design-tokens.js
│   └── generate-audit-report.js
├── audit-screenshots/
│   ├── reference/
│   │   ├── 01-home-screen-full.png
│   │   ├── 02-settings-screen-full.png
│   │   └── ...
│   └── inconsistent/
│       ├── 01-premium-upgrade-main.png
│       ├── 02-reorder-flow-main.png
│       └── ...
├── design-tokens-reference.json
└── design-audit-report.md
```

## Next Steps After Audit

1. **Review the audit report** (`design-audit-report.md`)
2. **Examine screenshots** for visual comparison
3. **Prioritize fixes** based on severity (critical > high > medium > low)
4. **Update components** to use design system tokens
5. **Re-run audit** after fixes to verify compliance
6. **Archive report** in `docs/archives/audits/`

## Related Documentation

- [Requirements Document](../requirements.md)
- [Design Document](../design.md)
- [Tasks Document](../tasks.md)
- [Design Validation Framework](../../../design-documentation/design-validation-framework.md)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the main design document
3. Consult the design validation framework

---

**Last Updated**: 2025-11-08  
**Purpose**: Automated design system audit  
**Scope**: Visual consistency validation
