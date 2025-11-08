---
title: NestSync Spacing Design Tokens
description: Complete spacing and layout system with psychological methodology for stressed Canadian parents
feature: Spacing & Layout System
last-updated: 2025-01-21
version: 1.0.0
related-files: 
  - ../style-guide.md
  - colors.md
  - typography.md
dependencies:
  - 4px base unit system
  - NativeBase spacing integration
  - Touch target accessibility standards
status: approved
---

# NestSync Spacing Design Tokens

## Overview

This document defines the complete spacing and layout system for NestSync, designed with psychological methodology for stressed, sleep-deprived Canadian parents. Every spacing decision supports cognitive load reduction, accessibility enhancement, and intuitive navigation patterns.

## Table of Contents

1. [Spacing Philosophy](#spacing-philosophy)
2. [Base Unit System](#base-unit-system)
3. [Spacing Scale](#spacing-scale)
4. [Layout Grid System](#layout-grid-system)
5. [Container Specifications](#container-specifications)
6. [Safe Area Handling](#safe-area-handling)
7. [Touch Target Sizing](#touch-target-sizing)
8. [Psychological Spacing](#psychological-spacing)
9. [NativeBase Integration](#nativebase-integration)
10. [Implementation Guidelines](#implementation-guidelines)

## Spacing Philosophy

### Psychological Methodology

Our spacing system addresses the unique needs of stressed, sleep-deprived parents:

- **Breathing Room**: Generous whitespace reduces anxiety and cognitive load
- **Hierarchy Support**: Spacing creates clear information architecture
- **Touch Accessibility**: Enhanced target sizes accommodate reduced fine motor control
- **Cognitive Grouping**: Spacing relationships communicate content organization

### Design Principles

- **Systematic Progression**: Mathematical relationships create visual harmony
- **Mobile-First**: Optimized for small screens with finger-friendly targets
- **Accessibility Plus**: Exceeding WCAG standards for tired parents
- **Cognitive Load Reduction**: Spacing prevents information overload

## Base Unit System

### Foundation Unit

**Base Unit**: `4px` (0.25rem)
- **Rationale**: Aligns with iOS (8px) and Android (4dp) design systems
- **Scalability**: Works across all screen densities and pixel ratios
- **Typography Harmony**: Complements 16px base font size (4:1 ratio)
- **Flexibility**: Allows fine-tuned adjustments while maintaining consistency

**Mathematical Relationship**:
- All spacing values are multiples of the 4px base unit
- Creates predictable, harmonious visual rhythm
- Simplifies responsive design calculations
- Ensures pixel-perfect alignment across devices

```css
/* Base Unit Custom Property */
--spacing-base: 4px;
--spacing-unit: 0.25rem; /* rem equivalent */
```

## Spacing Scale

### Systematic Progression

Our spacing scale uses a thoughtful progression that serves both micro-adjustments and macro-layouts:

### Micro Spacing (Internal Elements)

**XS - 4px (1 unit)**:
- **Usage**: Internal component spacing, icon padding, fine adjustments
- **Psychology**: Subtle grouping without visual separation
- **Examples**: Icon margins, badge padding, list item dividers

```css
--spacing-xs: 4px;   /* 1 unit */
--spacing-xs-rem: 0.25rem;
```

**SM - 8px (2 units)**:
- **Usage**: Small gaps, form field spacing, related element separation
- **Psychology**: Clear but intimate relationship between elements
- **Examples**: Button text padding, input field internal spacing

```css
--spacing-sm: 8px;   /* 2 units */
--spacing-sm-rem: 0.5rem;
```

**MD - 16px (4 units)**:
- **Usage**: Standard element spacing, card padding, default component margins
- **Psychology**: Comfortable breathing room without feeling disconnected
- **Examples**: Card internal padding, form group spacing, list item padding

```css
--spacing-md: 16px;  /* 4 units */
--spacing-md-rem: 1rem;
```

### Macro Spacing (Layout Structure)

**LG - 24px (6 units)**:
- **Usage**: Section spacing, between-component margins, content groups
- **Psychology**: Clear separation indicating different content areas
- **Examples**: Section breaks, major component separation

```css
--spacing-lg: 24px;  /* 6 units */
--spacing-lg-rem: 1.5rem;
```

**XL - 32px (8 units)**:
- **Usage**: Major section separation, screen edge padding, hero spacing
- **Psychology**: Strong architectural separation, breathing space
- **Examples**: Screen margins, major content blocks, navigation padding

```css
--spacing-xl: 32px;  /* 8 units */
--spacing-xl-rem: 2rem;
```

**2XL - 48px (12 units)**:
- **Usage**: Screen section breaks, large component separation, hero elements
- **Psychology**: Dramatic separation, emphasis through whitespace
- **Examples**: Between major screen sections, hero content spacing

```css
--spacing-2xl: 48px; /* 12 units */
--spacing-2xl-rem: 3rem;
```

**3XL - 64px (16 units)**:
- **Usage**: Large screen adaptations, dramatic spacing, special emphasis
- **Psychology**: Luxury spacing, maximum emphasis and importance
- **Examples**: Desktop hero sections, large screen content separation

```css
--spacing-3xl: 64px; /* 16 units */
--spacing-3xl-rem: 4rem;
```

### Complete Spacing Scale

```css
/* Complete Spacing Scale */
:root {
  /* Base unit */
  --spacing-base: 4px;
  
  /* Micro spacing */
  --spacing-xs: 4px;   /* 1 unit  - Internal elements */
  --spacing-sm: 8px;   /* 2 units - Small gaps */
  --spacing-md: 16px;  /* 4 units - Standard spacing */
  
  /* Macro spacing */
  --spacing-lg: 24px;  /* 6 units - Section spacing */
  --spacing-xl: 32px;  /* 8 units - Major separation */
  --spacing-2xl: 48px; /* 12 units - Screen sections */
  --spacing-3xl: 64px; /* 16 units - Large screen only */
  
  /* Rem equivalents for scalable spacing */
  --spacing-xs-rem: 0.25rem;
  --spacing-sm-rem: 0.5rem;
  --spacing-md-rem: 1rem;
  --spacing-lg-rem: 1.5rem;
  --spacing-xl-rem: 2rem;
  --spacing-2xl-rem: 3rem;
  --spacing-3xl-rem: 4rem;
}
```

## Layout Grid System

### Mobile-First Grid

**Base Screen**: 375px (iPhone SE baseline)
- **Columns**: 4 (flexible content organization)
- **Gutters**: 16px (md spacing - comfortable finger separation)
- **Margins**: 16px (md spacing - screen edge safety)
- **Content Width**: 343px effective content area

```css
.mobile-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  padding: 0 16px;
  max-width: 375px;
}
```

### Tablet Grid

**Tablet Breakpoint**: 768px+
- **Columns**: 8 (enhanced content organization)
- **Gutters**: 24px (lg spacing - proportionally scaled)
- **Margins**: 24px (lg spacing - comfortable edge spacing)
- **Content Width**: 720px maximum

```css
.tablet-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 24px;
  padding: 0 24px;
  max-width: 768px;
}
```

### Desktop Grid (Large Screens)

**Desktop Breakpoint**: 1024px+
- **Columns**: 12 (maximum content flexibility)
- **Gutters**: 32px (xl spacing - generous desktop spacing)
- **Margins**: 32px (xl spacing - desktop comfort)
- **Content Width**: 1200px maximum

```css
.desktop-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 32px;
  padding: 0 32px;
  max-width: 1024px;
}
```

## Container Specifications

### Responsive Container System

**Mobile Container** (375px - 767px):
```css
.container-mobile {
  width: 100%;
  max-width: 375px;
  margin: 0 auto;
  padding: 0 16px; /* md spacing */
}
```

**Tablet Container** (768px - 1023px):
```css
.container-tablet {
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
  padding: 0 24px; /* lg spacing */
}
```

**Desktop Container** (1024px+):
```css
.container-desktop {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 32px; /* xl spacing */
}
```

**Fluid Container** (All breakpoints):
```css
.container-fluid {
  width: 100%;
  padding-left: var(--spacing-md);
  padding-right: var(--spacing-md);
}

@media (min-width: 768px) {
  .container-fluid {
    padding-left: var(--spacing-lg);
    padding-right: var(--spacing-lg);
  }
}

@media (min-width: 1024px) {
  .container-fluid {
    padding-left: var(--spacing-xl);
    padding-right: var(--spacing-xl);
  }
}
```

## Safe Area Handling

### iOS Safe Areas

**Dynamic Island Accommodation**:
- **Top Clearance**: 54px (13.5 spacing units)
- **Status Bar**: 47px standard height
- **Implementation**: Additional padding for critical UI elements

```css
/* iOS Safe Area Variables */
.ios-safe-areas {
  padding-top: max(54px, env(safe-area-inset-top));
  padding-bottom: max(34px, env(safe-area-inset-bottom));
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}
```

**Home Indicator**:
- **Bottom Clearance**: 34px (8.5 spacing units)
- **Psychology**: Prevents accidental navigation interruption
- **Critical Elements**: Extra margin for primary actions

### Android System Bars

**Status Bar Accommodation**:
- **Standard Height**: 24dp equivalent
- **Adaptive**: Responds to system theme changes
- **Implementation**: StatusBar component configuration

**Navigation Bar**:
- **Three-Button**: 48dp standard height
- **Gesture Navigation**: Variable height, adaptive spacing
- **Full-Screen**: Edge-to-edge with appropriate padding

```css
/* Android System Bar Accommodation */
.android-safe-areas {
  padding-top: 24px; /* Status bar equivalent */
  padding-bottom: 48px; /* Navigation bar maximum */
}
```

## Touch Target Sizing

### Enhanced Accessibility Standards

Our touch targets exceed WCAG minimums to accommodate sleep-deprived parents with reduced fine motor control:

### Minimum Touch Targets

**Primary Actions**: 48x48px (12 spacing units)
- **Usage**: Main buttons, primary CTAs, critical interactive elements
- **Psychology**: Confident interaction, reduces miss-tap anxiety
- **Rationale**: Exceeds WCAG minimum (44x44px) by 4px (1 spacing unit)

```css
.touch-primary {
  min-width: 48px;
  min-height: 48px;
  padding: 12px; /* Ensures minimum even with smaller content */
}
```

**Secondary Actions**: 44x44px (11 spacing units)
- **Usage**: Secondary buttons, list items, navigation elements
- **Psychology**: Accessible but less prominent than primary actions
- **Rationale**: Meets WCAG AA minimum exactly

```css
.touch-secondary {
  min-width: 44px;
  min-height: 44px;
  padding: 10px;
}
```

**Text Links**: 44x44px touch area (content size independent)
- **Usage**: In-line links, text-based navigation
- **Psychology**: Predictable interaction area regardless of text size
- **Implementation**: Touch area larger than visual text when necessary

```css
.touch-text-link {
  min-width: 44px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 12px;
}
```

**Form Elements**: 48px height minimum
- **Usage**: Input fields, dropdowns, checkboxes, radio buttons
- **Psychology**: Easy interaction reduces form completion stress
- **Implementation**: Consistent height across all form elements

```css
.touch-form-element {
  min-height: 48px;
  padding: 12px 16px;
}
```

### Touch Target Separation

**Adjacent Elements**: 8px minimum (2 spacing units)
- **Usage**: Between closely related interactive elements
- **Psychology**: Prevents accidental activation of wrong element
- **Examples**: Button groups, navigation items

```css
.touch-adjacent {
  margin: 4px; /* 4px on each side = 8px total separation */
}
```

**Related Groups**: 16px separation (4 spacing units)
- **Usage**: Between related but distinct interaction groups
- **Psychology**: Clear grouping while maintaining separation
- **Examples**: Form sections, action groups

```css
.touch-group-related {
  margin: 8px; /* 8px on each side = 16px total separation */
}
```

**Unrelated Groups**: 24px separation (6 spacing units)
- **Usage**: Between completely separate interaction areas
- **Psychology**: Clear boundaries prevent cognitive confusion
- **Examples**: Different feature areas, major UI sections

```css
.touch-group-unrelated {
  margin: 12px; /* 12px on each side = 24px total separation */
}
```

## Psychological Spacing

### Cognitive Load Management

**Breathing Room Strategy**:
- Extra whitespace around critical actions reduces decision anxiety
- Generous spacing allows visual rest between information processing
- Strategic emptiness draws attention to important elements

**Information Grouping**:
- Related elements closer together (4px-8px)
- Related groups moderately separated (16px-24px)
- Unrelated content clearly separated (32px+)

**Focus Area Creation**:
- Whitespace isolation for critical decision points
- Surrounding space emphasizes importance
- Reduces visual competition for attention

```css
/* Psychological Spacing Patterns */
.focus-area {
  padding: var(--spacing-xl); /* 32px breathing room */
  margin: var(--spacing-2xl) 0; /* 48px isolation */
}

.content-group {
  padding: var(--spacing-md); /* 16px internal cohesion */
  margin-bottom: var(--spacing-lg); /* 24px group separation */
}

.critical-action {
  padding: var(--spacing-lg); /* 24px for confidence */
  margin: var(--spacing-xl) 0; /* 32px for emphasis */
}
```

## NativeBase Integration

### Space Scale Configuration

```typescript
const theme = extendTheme({
  space: {
    // Base increments (4px base unit)
    '0': 0,
    'px': '1px',    // 1px for borders
    '0.5': 2,       // Half unit (2px)
    '1': 4,         // xs spacing (1 unit)
    '1.5': 6,       // 1.5 units
    '2': 8,         // sm spacing (2 units)
    '2.5': 10,      // 2.5 units
    '3': 12,        // 3 units
    '3.5': 14,      // 3.5 units
    '4': 16,        // md spacing (4 units) - PRIMARY
    '5': 20,        // 5 units
    '6': 24,        // lg spacing (6 units) - PRIMARY
    '7': 28,        // 7 units
    '8': 32,        // xl spacing (8 units) - PRIMARY
    '9': 36,        // 9 units
    '10': 40,       // 10 units
    '11': 44,       // Touch target minimum
    '12': 48,       // 2xl spacing (12 units) - PRIMARY
    '14': 56,       // 14 units
    '16': 64,       // 3xl spacing (16 units) - PRIMARY
    '20': 80,       // 20 units
    '24': 96,       // 24 units
    '32': 128,      // 32 units
  },
});
```

### Common NativeBase Spacing Patterns

```typescript
// Container spacing
<Box px={4} py={6}>  {/* 16px horizontal, 24px vertical */}
  Content
</Box>

// Stack spacing (between elements)
<VStack space={4}>   {/* 16px between children */}
  <Text>Item 1</Text>
  <Text>Item 2</Text>
</VStack>

// Button padding
<Button px={6} py={3}> {/* 24px horizontal, 12px vertical */}
  Action Button
</Button>

// Card layout
<Box bg="white" p={4} m={2} borderRadius="md"> {/* 16px padding, 8px margin */}
  Card Content
</Box>

// Form spacing
<VStack space={6}> {/* 24px between form groups */}
  <FormControl>
    <FormControl.Label mb={2}> {/* 8px label margin */}
      Field Label
    </FormControl.Label>
    <Input p={3} /> {/* 12px internal padding */}
  </FormControl>
</VStack>
```

## Implementation Guidelines

### React Native StyleSheet

```typescript
import { StyleSheet } from 'react-native';

export const spacing = StyleSheet.create({
  // Base spacing scale
  xs: 4,    // 1 unit
  sm: 8,    // 2 units
  md: 16,   // 4 units - Primary standard
  lg: 24,   // 6 units - Primary section
  xl: 32,   // 8 units - Primary major
  xxl: 48,  // 12 units - Screen sections
  xxxl: 64, // 16 units - Large screens
  
  // Touch targets
  touchPrimary: 48,   // Primary action minimum
  touchSecondary: 44, // Secondary action minimum
  
  // Common patterns
  screenPadding: 16,  // Standard screen margins
  cardPadding: 16,    // Standard card internal spacing
  sectionGap: 24,     // Between content sections
  
  // Safe areas
  iosSafeTop: 54,     // Dynamic Island clearance
  iosSafeBottom: 34,  // Home indicator clearance
  androidSafeTop: 24, // Status bar clearance
  androidSafeBottom: 48, // Navigation bar clearance
});

// Usage in styles
const styles = StyleSheet.create({
  container: {
    padding: spacing.screenPadding,
    gap: spacing.sectionGap,
  },
  
  card: {
    padding: spacing.cardPadding,
    margin: spacing.sm,
  },
  
  button: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 4, // 12px for 48px total height
    minWidth: spacing.touchPrimary,
    minHeight: spacing.touchPrimary,
  },
  
  formField: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    marginBottom: spacing.md,
    minHeight: spacing.touchPrimary,
  },
});
```

### CSS Utility Classes

```css
/* Spacing Utility Classes */

/* Padding utilities */
.p-xs { padding: 4px; }
.p-sm { padding: 8px; }
.p-md { padding: 16px; }
.p-lg { padding: 24px; }
.p-xl { padding: 32px; }
.p-2xl { padding: 48px; }

/* Margin utilities */
.m-xs { margin: 4px; }
.m-sm { margin: 8px; }
.m-md { margin: 16px; }
.m-lg { margin: 24px; }
.m-xl { margin: 32px; }
.m-2xl { margin: 48px; }

/* Directional spacing */
.px-md { padding-left: 16px; padding-right: 16px; }
.py-md { padding-top: 16px; padding-bottom: 16px; }
.mx-md { margin-left: 16px; margin-right: 16px; }
.my-md { margin-top: 16px; margin-bottom: 16px; }

/* Touch target utilities */
.touch-primary {
  min-width: 48px;
  min-height: 48px;
  padding: 12px;
}

.touch-secondary {
  min-width: 44px;
  min-height: 44px;
  padding: 10px;
}

/* Layout utilities */
.container {
  width: 100%;
  margin: 0 auto;
  padding: 0 16px;
}

.section {
  margin-bottom: 24px;
}

.content-group {
  padding: 16px;
  margin-bottom: 24px;
}

/* Gap utilities for flexbox/grid */
.gap-xs { gap: 4px; }
.gap-sm { gap: 8px; }
.gap-md { gap: 16px; }
.gap-lg { gap: 24px; }
.gap-xl { gap: 32px; }
```

### Responsive Spacing

```css
/* Responsive spacing adjustments */
.responsive-padding {
  padding: 16px; /* Mobile default */
}

@media (min-width: 768px) {
  .responsive-padding {
    padding: 24px; /* Tablet */
  }
}

@media (min-width: 1024px) {
  .responsive-padding {
    padding: 32px; /* Desktop */
  }
}

/* Responsive containers */
.responsive-container {
  width: 100%;
  max-width: 375px;
  margin: 0 auto;
  padding: 0 16px;
}

@media (min-width: 768px) {
  .responsive-container {
    max-width: 720px;
    padding: 0 24px;
  }
}

@media (min-width: 1024px) {
  .responsive-container {
    max-width: 1200px;
    padding: 0 32px;
  }
}
```

### Spacing Validation Checklist

**Design Review**:
- [ ] All interactive elements meet minimum touch target sizes
- [ ] Spacing follows the systematic 4px base unit progression
- [ ] Related content is appropriately grouped with consistent spacing
- [ ] Safe areas are properly accommodated on both iOS and Android
- [ ] Responsive breakpoints maintain appropriate spacing relationships

**Accessibility Verification**:
- [ ] Touch targets exceed WCAG minimums (48px for primary, 44px for secondary)
- [ ] Adjacent interactive elements have minimum 8px separation
- [ ] Form elements maintain 48px height minimum
- [ ] Spacing scales appropriately with Dynamic Type and font scaling
- [ ] High contrast mode maintains spacing relationships

**Performance Considerations**:
- [ ] Spacing values use efficient CSS properties (margin/padding over transforms)
- [ ] Responsive breakpoints minimize layout thrashing
- [ ] Touch target calculations don't impact scroll performance
- [ ] Grid systems use modern CSS Grid/Flexbox for optimal performance

---

This comprehensive spacing system ensures optimal usability and psychological comfort for stressed Canadian parents while maintaining technical excellence and seamless integration with NativeBase components.