---
title: NestSync Typography Design Tokens
description: Complete typography system optimized for stressed Canadian parents with mobile-first approach
feature: Typography System
last-updated: 2025-01-21
version: 1.0.0
related-files: 
  - ../style-guide.md
  - colors.md
  - spacing.md
dependencies:
  - System font stack for optimal performance
  - NativeBase typography integration
  - Dynamic Type and accessibility scaling
status: approved
---

# NestSync Typography Design Tokens

## Overview

This document defines the complete typography system for NestSync, designed for optimal readability by stressed, sleep-deprived Canadian parents. Every typography choice is optimized for mobile-first usage, cognitive load reduction, and accessibility that exceeds standard requirements.

## Table of Contents

1. [Typography Philosophy](#typography-philosophy)
2. [Font Stack](#font-stack)
3. [Font Weights](#font-weights)
4. [Type Scale](#type-scale)
5. [Heading Hierarchy](#heading-hierarchy)
6. [Body Text Hierarchy](#body-text-hierarchy)
7. [Specialized Text Styles](#specialized-text-styles)
8. [Responsive Typography](#responsive-typography)
9. [Content Strategy](#content-strategy)
10. [NativeBase Integration](#nativebase-integration)
11. [Implementation Guidelines](#implementation-guidelines)

## Typography Philosophy

### Psychological Methodology

Our typography system addresses the specific needs of stressed, sleep-deprived parents:

- **Cognitive Load Reduction**: Clear hierarchy and generous sizing reduce mental effort
- **Fatigue Accommodation**: Larger minimum sizes and high contrast support tired eyes
- **Anxiety Reduction**: Familiar system fonts provide comfort and reliability
- **Efficiency Support**: Scannable structure enables quick information processing

### Design Principles

- **Readability First**: Never compromise legibility for aesthetic appeal
- **Mobile Optimized**: 16px absolute minimum for interactive text
- **Accessibility Plus**: Exceeding WCAG standards for tired parents
- **Performance Conscious**: System fonts for zero loading overhead
- **Cultural Sensitivity**: Grade 8 reading level for Canadian accessibility

## Font Stack

### Primary Font Family

**System Font Stack**: Optimized for performance and familiarity
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
```

**Rationale**:
- **Zero Load Time**: System fonts provide instant rendering
- **Familiar Feel**: Users recognize their device's native typography
- **Optimal Rendering**: Platform-specific font optimization
- **Accessibility**: Built-in support for Dynamic Type and accessibility features

**Platform Breakdown**:
- **iOS**: `-apple-system` (San Francisco family)
- **Android**: `Roboto` (Material Design standard)
- **Windows**: `Segoe UI` (Windows system font)
- **Linux**: `Ubuntu` or `Oxygen` (distribution-specific)
- **Fallback**: Generic `sans-serif`

### Monospace Font Family

**Technical Display Font**: For data, codes, and technical information
```css
font-family: 'JetBrains Mono', 'SF Mono', 'Monaco', 'Consolas', monospace;
```

**Usage**:
- API keys and technical identifiers
- Data display and measurements
- Code snippets in documentation
- Technical support information

## Font Weights

### Weight Scale & Psychology

**Light (300)**:
- **Usage**: Reserved for large display text only (32px+)
- **Psychology**: Elegant but not weak, used sparingly
- **Warning**: Never use for body text or interactive elements

**Regular (400)**:
- **Usage**: Body text, comfortable reading, standard UI text
- **Psychology**: Natural, familiar weight for sustained reading
- **Primary Use**: All body content and non-emphasized text

**Medium (500)**:
- **Usage**: Subtle emphasis, secondary headings, important labels
- **Psychology**: Gentle authority without aggression
- **Balance**: Strong enough to create hierarchy, gentle enough to avoid stress

**Semibold (600)**:
- **Usage**: Primary headings, important labels, key interface elements
- **Psychology**: Confident authority, trustworthy leadership
- **Primary Heading Weight**: Optimal balance of presence and approachability

**Bold (700)**:
- **Usage**: Critical emphasis, warnings, call-to-action buttons
- **Psychology**: Urgent importance, demands attention
- **Selective Use**: Reserved for truly critical information to maintain impact

```css
/* Font Weight Custom Properties */
--font-weight-light: 300;
--font-weight-regular: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
```

## Type Scale

### Mathematical Progression

**Base Size**: 16px (1rem)
**Scale Factor**: 1.125 (Major Third) for harmonious proportions
**Mobile Optimization**: All sizes tested on 375px baseline

**Type Scale Values**:
- **12px** (0.75rem): Caption text, legal notices
- **14px** (0.875rem): Small body text, form labels
- **16px** (1rem): Base body text, standard UI
- **18px** (1.125rem): Large body text, comfortable reading
- **20px** (1.25rem): Minor headings, component titles
- **24px** (1.5rem): Subsection headers
- **28px** (1.75rem): Section headers
- **32px** (2rem): Page titles, major headings

## Heading Hierarchy

### H1 - Page Titles

**Specifications**: `32px/40px, Semibold (600), -0.02em`
- **Line Height**: 40px (1.25 ratio)
- **Letter Spacing**: -0.02em (tighter for large text)
- **Usage**: Main screen titles, onboarding steps, major section identifiers
- **NativeBase**: `<Heading size="xl">`
- **Psychology**: Confidence and authority without intimidation
- **Responsive**: Scales to 28px on screens smaller than 375px

```css
.heading-1 {
  font-size: 32px;
  font-weight: 600;
  line-height: 40px;
  letter-spacing: -0.02em;
}
```

```typescript
// React Native StyleSheet
h1: {
  fontSize: 32,
  fontWeight: '600',
  lineHeight: 40,
  letterSpacing: -0.32,
}
```

### H2 - Section Headers

**Specifications**: `28px/36px, Semibold (600), -0.01em`
- **Line Height**: 36px (1.29 ratio)
- **Letter Spacing**: -0.01em
- **Usage**: Major sections, card titles, feature group headers
- **NativeBase**: `<Heading size="lg">`
- **Responsive**: Scales to 24px on screens smaller than 414px

```css
.heading-2 {
  font-size: 28px;
  font-weight: 600;
  line-height: 36px;
  letter-spacing: -0.01em;
}
```

### H3 - Subsection Headers

**Specifications**: `24px/32px, Medium (500), 0em`
- **Line Height**: 32px (1.33 ratio)
- **Letter Spacing**: 0em (neutral)
- **Usage**: Subsections, feature group titles, card section headers
- **NativeBase**: `<Heading size="md">`

```css
.heading-3 {
  font-size: 24px;
  font-weight: 500;
  line-height: 32px;
  letter-spacing: 0;
}
```

### H4 - Component Titles

**Specifications**: `20px/28px, Medium (500), 0em`
- **Line Height**: 28px (1.4 ratio)
- **Letter Spacing**: 0em
- **Usage**: Card titles, form section headers, component identifiers
- **NativeBase**: `<Heading size="sm">`

```css
.heading-4 {
  font-size: 20px;
  font-weight: 500;
  line-height: 28px;
  letter-spacing: 0;
}
```

### H5 - Minor Headers

**Specifications**: `18px/24px, Medium (500), 0em`
- **Line Height**: 24px (1.33 ratio)
- **Letter Spacing**: 0em
- **Usage**: List headers, small component titles, form group headers
- **NativeBase**: `<Heading size="xs">`

```css
.heading-5 {
  font-size: 18px;
  font-weight: 500;
  line-height: 24px;
  letter-spacing: 0;
}
```

## Body Text Hierarchy

### Body Large - Primary Reading

**Specifications**: `18px/28px, Regular (400)`
- **Line Height**: 28px (1.56 ratio - optimal for reading)
- **Usage**: Primary reading content, important descriptions, introductory text
- **NativeBase**: `<Text fontSize="lg">`
- **Psychology**: Comfortable for tired eyes, reduces strain
- **Accessibility**: Exceeds WCAG minimum for enhanced readability

```css
.body-large {
  font-size: 18px;
  font-weight: 400;
  line-height: 28px;
}
```

### Body Regular - Standard UI

**Specifications**: `16px/24px, Regular (400)`
- **Line Height**: 24px (1.5 ratio - WCAG recommended minimum)
- **Usage**: Standard UI text, form labels, general content
- **NativeBase**: `<Text fontSize="md">`
- **Minimum Size**: Never below 16px for tired parent accessibility
- **Primary Use**: Default text size for most interface elements

```css
.body-regular {
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
}
```

### Body Small - Secondary Information

**Specifications**: `14px/20px, Regular (400)`
- **Line Height**: 20px (1.43 ratio)
- **Usage**: Secondary information, metadata, supporting details
- **NativeBase**: `<Text fontSize="sm">`
- **Limited Use**: Only for non-critical information
- **Color**: Typically paired with Neutral-400 for reduced prominence

```css
.body-small {
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  color: var(--neutral-400);
}
```

### Caption - Minimal Information

**Specifications**: `12px/16px, Medium (500)`
- **Line Height**: 16px (1.33 ratio)
- **Usage**: Timestamps, legal text, very secondary information
- **NativeBase**: `<Text fontSize="xs">`
- **Color**: Neutral-400 for reduced prominence
- **Weight**: Medium (500) for improved legibility at small size

```css
.caption {
  font-size: 12px;
  font-weight: 500;
  line-height: 16px;
  color: var(--neutral-400);
}
```

## Specialized Text Styles

### Label Text - Form Elements

**Specifications**: `14px/20px, Medium (500), uppercase, 0.1em`
- **Line Height**: 20px
- **Weight**: Medium (500) for clarity
- **Transform**: Uppercase for identification
- **Letter Spacing**: 0.1em for improved readability
- **Usage**: Form labels, section identifiers, categorization
- **Psychology**: Clear instruction without shouting

```css
.label {
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
```

### Code/Technical - Data Display

**Specifications**: `14px/20px, Monospace, Regular (400)`
- **Font Family**: Monospace stack
- **Line Height**: 20px
- **Usage**: API keys, technical identifiers, data display, measurements
- **Background**: Neutral-100 for differentiation
- **Border Radius**: 4px for subtle container effect

```css
.code {
  font-family: 'JetBrains Mono', 'SF Mono', 'Monaco', 'Consolas', monospace;
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  background-color: var(--neutral-100);
  padding: 2px 6px;
  border-radius: 4px;
}
```

### Button Text - Interactive Elements

**Specifications**: `16px/24px, Medium (500), 0em`
- **Size**: 16px minimum for touch accessibility
- **Weight**: Medium (500) for clear interaction cues
- **Letter Spacing**: 0em (neutral for optimal readability)
- **Usage**: All button text, primary interactive elements
- **Accessibility**: Meets 44px touch target when combined with padding

```css
.button-text {
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
  letter-spacing: 0;
}
```

## Responsive Typography

### Mobile-First Approach

**Base Breakpoint**: 375px (iPhone SE baseline)
**Scaling Method**: Linear progression with breakpoint adjustments

### Breakpoint Adaptations

**Small (375px - Base)**:
```css
/* Base scale - no modifications */
```

**Medium (414px - iPhone Plus)**:
```css
.heading-1 { font-size: 34px; }
.heading-2 { font-size: 30px; }
/* Body text remains unchanged */
```

**Large (768px - Tablet)**:
```css
.heading-1 { 
  font-size: 36px; 
  line-height: 44px; 
}
.heading-2 { 
  font-size: 32px; 
  line-height: 40px; 
}
.body-large { 
  font-size: 19px; 
  line-height: 30px; 
}
```

**Extra Large (1024px+ - Desktop)**:
```css
.heading-1 { 
  font-size: 40px; 
  line-height: 48px; 
}
.heading-2 { 
  font-size: 36px; 
  line-height: 44px; 
}
.body-large { 
  font-size: 20px; 
  line-height: 32px; 
}
```

### Dynamic Type Support

**iOS Integration**:
```typescript
// React Native - iOS Dynamic Type
import { PixelRatio } from 'react-native';

const fontScale = PixelRatio.getFontScale();
const scaledSize = Math.round(16 * fontScale);

// Clamp scaling for optimal experience
const clampedSize = Math.max(14, Math.min(scaledSize, 24));
```

**Android Integration**:
```typescript
// React Native - Android font scaling
import { Dimensions } from 'react-native';

const { fontScale } = Dimensions.get('window');
const responsiveSize = 16 * fontScale;
```

**Scaling Limits**:
- **Maximum Scale**: 200% for accessibility
- **Minimum Scale**: 85% for content density
- **Critical Interactive Text**: Never below 16px regardless of scaling

## Content Strategy

### Readability Standards

**Reading Level**: Grade 8 maximum for Canadian accessibility
**Sentence Length**: 20 words maximum per sentence
**Paragraph Length**: 3-4 sentences maximum per paragraph
**Scannable Structure**: Clear headings and bullet points throughout

### Tone & Voice Guidelines

**Tone**: Supportive, empathetic, never condescending
**Voice**: Helpful friend, not corporate entity
**Canadian Context**: Appropriate terminology and cultural references
**Stress-Aware**: Language that reduces rather than increases anxiety

### Microcopy Examples

**Loading States**:
- Use: "Checking your supplies..."
- Not: "Loading..."

**Error Messages**:
- Use: "Let's try that again"
- Not: "Error occurred"

**Success Confirmations**:
- Use: "Got it! Your inventory is updated"
- Not: "Success"

**Empty States**:
- Use: "Ready to start tracking?"
- Not: "No data"

## NativeBase Integration

### Font Size Mapping

```typescript
const theme = extendTheme({
  fontSizes: {
    '2xs': 10,      // Not used in NestSync
    'xs': 12,       // Caption text
    'sm': 14,       // Small body, labels
    'md': 16,       // Base body text
    'lg': 18,       // Large body text
    'xl': 20,       // H4 headings
    '2xl': 24,      // H3 headings
    '3xl': 28,      // H2 headings
    '4xl': 32,      // H1 headings
    '5xl': 36,      // Large screen H1
    '6xl': 40,      // Desktop H1
  },
  
  fontWeights: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  
  lineHeights: {
    xs: 16,         // 12px text
    sm: 20,         // 14px text
    md: 24,         // 16px text
    lg: 28,         // 18px text
    xl: 28,         // 20px text
    '2xl': 32,      // 24px text
    '3xl': 36,      // 28px text
    '4xl': 40,      // 32px text
  },
});
```

### Component Typography Usage

```typescript
// Headings
<Heading size="xl" fontWeight="semibold">Page Title</Heading>
<Heading size="lg" fontWeight="semibold">Section Header</Heading>
<Heading size="md" fontWeight="medium">Subsection</Heading>

// Body Text
<Text fontSize="lg">Primary reading content</Text>
<Text fontSize="md">Standard UI text</Text>
<Text fontSize="sm" color="gray.400">Secondary information</Text>

// Specialized
<Text fontSize="sm" fontWeight="medium" textTransform="uppercase" letterSpacing={1}>
  Form Label
</Text>

<Text fontFamily="mono" fontSize="sm" bg="gray.100" px={2} borderRadius={1}>
  Technical Data
</Text>
```

## Implementation Guidelines

### React Native StyleSheet

```typescript
import { StyleSheet, Platform } from 'react-native';

export const typography = StyleSheet.create({
  // Headings
  h1: {
    fontSize: 32,
    fontWeight: '600',
    lineHeight: 40,
    letterSpacing: -0.32,
    fontFamily: Platform.select({
      ios: '-apple-system',
      android: 'Roboto',
      default: 'sans-serif',
    }),
  },
  
  h2: {
    fontSize: 28,
    fontWeight: '600',
    lineHeight: 36,
    letterSpacing: -0.28,
  },
  
  h3: {
    fontSize: 24,
    fontWeight: '500',
    lineHeight: 32,
    letterSpacing: 0,
  },
  
  h4: {
    fontSize: 20,
    fontWeight: '500',
    lineHeight: 28,
    letterSpacing: 0,
  },
  
  h5: {
    fontSize: 18,
    fontWeight: '500',
    lineHeight: 24,
    letterSpacing: 0,
  },
  
  // Body Text
  bodyLarge: {
    fontSize: 18,
    fontWeight: '400',
    lineHeight: 28,
  },
  
  bodyRegular: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  
  bodySmall: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  
  caption: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  
  // Specialized
  label: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  
  code: {
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  
  button: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
    letterSpacing: 0,
  },
});
```

### CSS Implementation

```css
/* Typography System */
.text-h1 {
  font-size: 2rem;        /* 32px */
  font-weight: 600;
  line-height: 2.5rem;    /* 40px */
  letter-spacing: -0.02em;
}

.text-h2 {
  font-size: 1.75rem;     /* 28px */
  font-weight: 600;
  line-height: 2.25rem;   /* 36px */
  letter-spacing: -0.01em;
}

.text-h3 {
  font-size: 1.5rem;      /* 24px */
  font-weight: 500;
  line-height: 2rem;      /* 32px */
}

.text-h4 {
  font-size: 1.25rem;     /* 20px */
  font-weight: 500;
  line-height: 1.75rem;   /* 28px */
}

.text-h5 {
  font-size: 1.125rem;    /* 18px */
  font-weight: 500;
  line-height: 1.5rem;    /* 24px */
}

.text-body-lg {
  font-size: 1.125rem;    /* 18px */
  font-weight: 400;
  line-height: 1.75rem;   /* 28px */
}

.text-body {
  font-size: 1rem;        /* 16px */
  font-weight: 400;
  line-height: 1.5rem;    /* 24px */
}

.text-body-sm {
  font-size: 0.875rem;    /* 14px */
  font-weight: 400;
  line-height: 1.25rem;   /* 20px */
}

.text-caption {
  font-size: 0.75rem;     /* 12px */
  font-weight: 500;
  line-height: 1rem;      /* 16px */
}

.text-label {
  font-size: 0.875rem;    /* 14px */
  font-weight: 500;
  line-height: 1.25rem;   /* 20px */
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.text-code {
  font-family: 'JetBrains Mono', 'SF Mono', 'Monaco', 'Consolas', monospace;
  font-size: 0.875rem;    /* 14px */
  font-weight: 400;
  line-height: 1.25rem;   /* 20px */
  background-color: var(--neutral-100);
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
}

.text-button {
  font-size: 1rem;        /* 16px */
  font-weight: 500;
  line-height: 1.5rem;    /* 24px */
}
```

### Accessibility Guidelines

**Implementation Checklist**:
- [ ] All interactive text meets 16px minimum
- [ ] Line heights meet or exceed 1.5 ratio
- [ ] Dynamic Type scaling implemented and tested
- [ ] High contrast mode compatibility verified
- [ ] Reading level verified at Grade 8 or below
- [ ] Screen reader optimization with semantic markup

**Testing Requirements**:
- Test with iOS Dynamic Type at all scaling levels
- Verify Android font scaling compatibility
- Validate with color contrast tools
- Screen reader testing with VoiceOver and TalkBack
- Cognitive load testing with target user group

---

This comprehensive typography system ensures optimal readability and accessibility for stressed Canadian parents while maintaining technical excellence and seamless integration with NativeBase components.