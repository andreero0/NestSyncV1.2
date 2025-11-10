# Design Tokens Extracted from Reference Screens

**Date:** 2025-01-09
**Reference Screens:** Dashboard Home, Settings
**Purpose:** Document design tokens from properly implemented screens for use in fixing inconsistent screens

---

## Extraction Methodology

Design tokens were extracted by analyzing the following reference screens that demonstrate proper design system implementation:

1. **Dashboard Home** (`app/(tabs)/index.tsx`)
   - Primary navigation
   - Card layouts
   - Button styling
   - Typography hierarchy
   - Spacing patterns

2. **Settings Screen** (`app/profile-settings.tsx`)
   - Form elements
   - List items
   - Section headers
   - Interactive elements
   - Color usage

---

## Color Tokens

### Primary Colors

```typescript
// From NestSync-frontend/constants/Colors.ts
primary: {
  blue: '#0891B2',      // Main CTAs, brand elements, primary navigation
  blueDark: '#0E7490',  // Hover states, active states
  blueLight: '#E0F2FE', // Subtle backgrounds, selected states
}
```

**Usage in Reference Screens:**
- Primary buttons: `backgroundColor: NestSyncColors.primary.blue`
- Active navigation: `color: NestSyncColors.primary.blue`
- Links: `color: NestSyncColors.primary.blue`

### Secondary Colors

```typescript
secondary: {
  green: '#059669',      // Success states, positive confirmations
  greenLight: '#D1FAE5', // Success backgrounds
  greenPale: '#F0FDF4',  // Subtle success states
}
```

**Usage in Reference Screens:**
- Success messages: `backgroundColor: NestSyncColors.secondary.greenLight`
- Confirmation buttons: `backgroundColor: NestSyncColors.secondary.green`
- Status indicators: `color: NestSyncColors.secondary.green`

### Accent Colors

```typescript
accent: {
  orange: '#EA580C',  // Important actions, reorder notifications
  amber: '#D97706',   // Warnings, attention states
  purple: '#7C3AED',  // Premium features
}
```

**Usage in Reference Screens:**
- Warning badges: `backgroundColor: NestSyncColors.accent.amber`
- Premium indicators: `color: NestSyncColors.accent.purple`
- Urgent actions: `backgroundColor: NestSyncColors.accent.orange`

### Neutral Colors

```typescript
neutral: {
  50: '#F9FAFB',   // Backgrounds, subtle dividers
  100: '#F3F4F6',  // Card backgrounds, input fields
  200: '#E5E7EB',  // Borders, dividers
  300: '#D1D5DB',  // Placeholders, disabled states
  400: '#9CA3AF',  // Secondary text, icons (4.6:1 contrast)
  500: '#6B7280',  // Primary text (7.8:1 contrast)
  600: '#4B5563',  // Headings, emphasis (10.4:1 contrast)
  700: '#374151',  // High emphasis text (13.2:1 contrast)
  800: '#1F2937',  // Maximum contrast text (16.8:1 contrast)
  900: '#111827',  // Critical emphasis (19.3:1 contrast)
}
```

**Usage in Reference Screens:**
- Screen backgrounds: `backgroundColor: NestSyncColors.neutral[50]`
- Card backgrounds: `backgroundColor: NestSyncColors.neutral[100]`
- Borders: `borderColor: NestSyncColors.neutral[200]`
- Body text: `color: NestSyncColors.neutral[500]`
- Headings: `color: NestSyncColors.neutral[600]`

---

## Typography Tokens

### Font Sizes

```typescript
typography: {
  sizes: {
    caption: 11,      // Small labels, metadata, timestamps
    small: 12,        // Secondary text, captions, helper text
    body: 14,         // Primary body text, descriptions
    subtitle: 16,     // Section headings, emphasized text
    title: 20,        // Screen titles, card headers
    largeTitle: 28,   // Main screen headings, hero text
  }
}
```

**Usage in Reference Screens:**

**Dashboard Home:**
```typescript
// Screen title
fontSize: 28,  // largeTitle
fontWeight: '700', // bold

// Card headers
fontSize: 20,  // title
fontWeight: '600', // semibold

// Body text
fontSize: 14,  // body
fontWeight: '400', // regular

// Metadata
fontSize: 11,  // caption
fontWeight: '500', // medium
```

**Settings Screen:**
```typescript
// Section headers
fontSize: 16,  // subtitle
fontWeight: '600', // semibold

// List item text
fontSize: 14,  // body
fontWeight: '400', // regular

// Helper text
fontSize: 12,  // small
fontWeight: '400', // regular
```

### Font Weights

```typescript
typography: {
  weights: {
    regular: '400',   // Body text, descriptions
    medium: '500',    // Emphasized text, labels
    semibold: '600',  // Headings, buttons, section titles
    bold: '700',      // Large titles, high emphasis
  }
}
```

**Weight Selection Guidelines:**
- Use `regular` (400) for body text and descriptions
- Use `medium` (500) for labels and emphasized text
- Use `semibold` (600) for headings, buttons, and section titles
- Use `bold` (700) for large titles and maximum emphasis

---

## Spacing Tokens

### Base Unit System

```typescript
spacing: {
  baseUnit: 4,  // All spacing must be multiples of 4px
  xs: 4,        // 1 unit - Minimal spacing, tight layouts
  sm: 8,        // 2 units - Compact spacing, related elements
  md: 12,       // 3 units - Standard spacing, form fields
  lg: 16,       // 4 units - Comfortable spacing, sections
  xl: 20,       // 5 units - Generous spacing, major sections
  xxl: 24,      // 6 units - Maximum spacing, screen margins
}
```

**Usage Patterns in Reference Screens:**

**Card Spacing:**
```typescript
// Card padding
padding: 16,  // lg (4 units)

// Card margins
marginBottom: 16,  // lg (4 units)

// Card gap in grid
gap: 16,  // lg (4 units)
```

**Button Spacing:**
```typescript
// Button padding
paddingHorizontal: 16,  // lg (4 units)
paddingVertical: 12,    // md (3 units)

// Button margins
marginTop: 12,  // md (3 units)
```

**Section Spacing:**
```typescript
// Section padding
paddingHorizontal: 20,  // xl (5 units)
paddingVertical: 24,    // xxl (6 units)

// Section margins
marginBottom: 24,  // xxl (6 units)
```

**Element Spacing:**
```typescript
// Label to input
marginBottom: 8,  // sm (2 units)

// Related elements
gap: 8,  // sm (2 units)

// Unrelated elements
marginBottom: 16,  // lg (4 units)
```

---

## Border Radius Tokens

```typescript
borderRadius: {
  sm: 6,   // Small buttons, badges, chips
  md: 8,   // Input fields, small cards
  lg: 12,  // Cards, containers, modals
  xl: 16,  // Large cards, hero sections
}
```

**Usage in Reference Screens:**

```typescript
// Primary buttons
borderRadius: 12,  // lg

// Cards
borderRadius: 12,  // lg

// Input fields
borderRadius: 8,   // md

// Badges
borderRadius: 6,   // sm
```

---

## Shadow Tokens

```typescript
shadows: {
  sm: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,  // Android
  },
  md: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,  // Android
  },
  lg: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,  // Android
  },
}
```

**Usage in Reference Screens:**

```typescript
// Cards
shadowOffset: { width: 0, height: 1 },
shadowOpacity: 0.05,
shadowRadius: 2,
elevation: 1,  // sm shadow

// Elevated cards (active/hover)
shadowOffset: { width: 0, height: 2 },
shadowOpacity: 0.1,
shadowRadius: 4,
elevation: 2,  // md shadow

// Modals, floating elements
shadowOffset: { width: 0, height: 4 },
shadowOpacity: 0.15,
shadowRadius: 8,
elevation: 4,  // lg shadow
```

---

## Touch Target Tokens

```typescript
touchTargets: {
  minimum: 48,  // WCAG AA minimum (48px × 48px)
}
```

**Usage in Reference Screens:**

```typescript
// All buttons
minHeight: 48,
paddingVertical: 12,  // Ensures 48px minimum with text

// List items
minHeight: 48,

// Tab buttons
minHeight: 48,

// Icon buttons
width: 48,
height: 48,
```

---

## Component Patterns

### Button Pattern

```typescript
// Primary Button (from reference screens)
const primaryButtonStyle = {
  backgroundColor: NestSyncColors.primary.blue,
  paddingHorizontal: 16,  // lg spacing
  paddingVertical: 12,    // md spacing
  borderRadius: 12,       // lg radius
  minHeight: 48,          // Touch target minimum
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 2,           // md shadow
};

const primaryButtonText = {
  fontSize: 14,           // body size
  fontWeight: '600',      // semibold
  color: '#FFFFFF',
};
```

### Card Pattern

```typescript
// Card (from reference screens)
const cardStyle = {
  backgroundColor: NestSyncColors.neutral[100],
  padding: 16,            // lg spacing
  borderRadius: 12,       // lg radius
  borderWidth: 1,
  borderColor: NestSyncColors.neutral[200],
  marginBottom: 16,       // lg spacing
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05,
  shadowRadius: 2,
  elevation: 1,           // sm shadow
};

const cardHeaderStyle = {
  fontSize: 20,           // title size
  fontWeight: '600',      // semibold
  color: NestSyncColors.neutral[600],
  marginBottom: 8,        // sm spacing
};

const cardBodyStyle = {
  fontSize: 14,           // body size
  fontWeight: '400',      // regular
  color: NestSyncColors.neutral[500],
  lineHeight: 20,         // 1.43 ratio
};
```

### Input Field Pattern

```typescript
// Input Field (from reference screens)
const inputStyle = {
  backgroundColor: NestSyncColors.neutral[50],
  borderWidth: 1,
  borderColor: NestSyncColors.neutral[200],
  borderRadius: 8,        // md radius
  paddingHorizontal: 12,  // md spacing
  paddingVertical: 12,    // md spacing
  minHeight: 48,          // Touch target minimum
  fontSize: 14,           // body size
  fontWeight: '400',      // regular
  color: NestSyncColors.neutral[600],
};

const inputLabelStyle = {
  fontSize: 12,           // small size
  fontWeight: '500',      // medium
  color: NestSyncColors.neutral[500],
  marginBottom: 8,        // sm spacing
};
```

### Section Header Pattern

```typescript
// Section Header (from reference screens)
const sectionHeaderStyle = {
  fontSize: 16,           // subtitle size
  fontWeight: '600',      // semibold
  color: NestSyncColors.neutral[600],
  marginBottom: 12,       // md spacing
  marginTop: 24,          // xxl spacing (between sections)
};
```

---

## Color Contrast Ratios

All text colors meet WCAG AA standards (4.5:1 minimum for normal text, 3:1 for large text):

| Color | On White Background | Contrast Ratio | WCAG Level |
|-------|---------------------|----------------|------------|
| Neutral 900 | #111827 | 19.3:1 | AAA |
| Neutral 800 | #1F2937 | 16.8:1 | AAA |
| Neutral 700 | #374151 | 13.2:1 | AAA |
| Neutral 600 | #4B5563 | 10.4:1 | AAA |
| Neutral 500 | #6B7280 | 7.8:1 | AAA |
| Neutral 400 | #9CA3AF | 4.6:1 | AA |
| Primary Blue | #0891B2 | 4.7:1 | AA |
| Secondary Green | #059669 | 4.8:1 | AA |

---

## Usage Guidelines

### When to Use Each Token

**Colors:**
- Use `primary.blue` for main CTAs and brand elements
- Use `secondary.green` for success states and confirmations
- Use `neutral[500]` for body text
- Use `neutral[600]` for headings
- Use `neutral[200]` for borders and dividers

**Typography:**
- Use `body` (14px) for most text content
- Use `title` (20px) for card headers and section titles
- Use `subtitle` (16px) for emphasized text and subsections
- Use `small` (12px) for helper text and captions

**Spacing:**
- Use `lg` (16px) for card padding and margins
- Use `md` (12px) for button padding and form field spacing
- Use `sm` (8px) for related element spacing
- Use `xxl` (24px) for section margins

**Border Radius:**
- Use `lg` (12px) for cards and buttons
- Use `md` (8px) for input fields
- Use `sm` (6px) for badges and chips

---

## Validation Checklist

When implementing design tokens, verify:

- [ ] All colors use `NestSyncColors` constants
- [ ] All font sizes match typography scale
- [ ] All spacing is a multiple of 4px
- [ ] All touch targets are minimum 48px
- [ ] All border radius values match design system
- [ ] All shadows use design system tokens
- [ ] Color contrast meets WCAG AA (4.5:1 minimum)
- [ ] Visual consistency with reference screens

---

**Document Status:** Complete
**Last Updated:** 2025-01-09
**Next Review:** After design system updates
