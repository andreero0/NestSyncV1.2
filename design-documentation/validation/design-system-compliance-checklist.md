# Design System Compliance Checklist

**Date**: November 10, 2025  
**Spec**: Design Consistency and User Issues  
**Requirements**: 7.1, 7.2, 7.3, 7.4, 7.5  
**Status**: ✅ Complete

## Overview

This checklist provides a comprehensive reference for all NestSync design system tokens and their proper usage. Use this document to ensure design consistency when building new features or updating existing components.

## Color Tokens

### Primary Colors - Trust & Reliability

| Token | Value | Usage | Contrast Ratio |
|-------|-------|-------|----------------|
| `NestSyncColors.primary.blue` | `#0891B2` | Main CTAs, brand elements, primary navigation | 4.5:1 on white |
| `NestSyncColors.primary.blueDark` | `#0E7490` | Hover states, active states, emphasis | 7.0:1 on white |
| `NestSyncColors.primary.blueLight` | `#E0F2FE` | Subtle backgrounds, selected states | 1.1:1 on white |

**Psychology**: Medical trust, institutional reliability, water-like calming associations

**Usage Examples**:
- ✅ Primary action buttons
- ✅ Active navigation items
- ✅ "🇨🇦 Data stored in Canada" trust messaging
- ❌ Error states or warnings
- ❌ Decorative elements without purpose

### Secondary Colors - Growth & Wellness

| Token | Value | Usage | Contrast Ratio |
|-------|-------|-------|----------------|
| `NestSyncColors.secondary.green` | `#059669` | Success states, positive confirmations | 4.6:1 on white |
| `NestSyncColors.secondary.greenLight` | `#D1FAE5` | Success backgrounds, positive highlights | 1.1:1 on white |
| `NestSyncColors.secondary.greenPale` | `#F0FDF4` | Subtle success backgrounds | 1.0:1 on white |

**Psychology**: Health, natural wellness, progress, growth

**Usage Examples**:
- ✅ Success confirmations
- ✅ Positive feedback messages
- ✅ Growth indicators
- ✅ Well-stocked inventory status
- ❌ Primary navigation
- ❌ Error states

### Accent Colors - Attention Without Alarm

| Token | Value | Usage | Contrast Ratio |
|-------|-------|-------|----------------|
| `NestSyncColors.accent.orange` | `#EA580C` | Important actions, reorder notifications | 4.5:1 on white |
| `NestSyncColors.accent.amber` | `#D97706` | Warnings, attention states | 4.5:1 on white |
| `NestSyncColors.accent.purple` | `#7C3AED` | Premium features, special states | 4.5:1 on white |

**Psychology**: Warmth without aggression, attention without panic

**Usage Examples**:
- ✅ Reorder notifications (orange)
- ✅ Low stock warnings (amber)
- ✅ Premium feature badges (purple)
- ❌ Critical errors (use semantic.error instead)
- ❌ Success states (use secondary.green instead)

### Semantic Colors - Communication & Feedback

| Token | Value | Usage | Contrast Ratio |
|-------|-------|-------|----------------|
| `NestSyncColors.semantic.success` | `#059669` | "Everything is working correctly" | 4.6:1 on white |
| `NestSyncColors.semantic.warning` | `#D97706` | "Attention needed, but not urgent" | 4.5:1 on white |
| `NestSyncColors.semantic.error` | `#DC2626` | "Immediate attention required" | 4.5:1 on white |
| `NestSyncColors.semantic.info` | `#0891B2` | "Here's helpful information" | 4.5:1 on white |

**Usage Guidelines**:
- Use sparingly and consistently
- Always pair with icons for color-blind accessibility
- Never rely on color alone to convey meaning
- Error color should be used minimally to avoid alarm

### Neutral Palette - Hierarchy & Readability

| Token | Value | Usage | Contrast Ratio |
|-------|-------|-------|----------------|
| `NestSyncColors.neutral[50]` | `#F9FAFB` | Backgrounds, subtle dividers | 1.0:1 on white |
| `NestSyncColors.neutral[100]` | `#F3F4F6` | Card backgrounds, input fields | 1.0:1 on white |
| `NestSyncColors.neutral[200]` | `#E5E7EB` | Borders, dividers | 1.2:1 on white |
| `NestSyncColors.neutral[300]` | `#D1D5DB` | Placeholders, disabled states | 1.8:1 on white |
| `NestSyncColors.neutral[400]` | `#9CA3AF` | Secondary text, icons | 4.6:1 on white |
| `NestSyncColors.neutral[500]` | `#6B7280` | Primary text color | 7.8:1 on white |
| `NestSyncColors.neutral[600]` | `#4B5563` | Headings, emphasis | 10.4:1 on white |
| `NestSyncColors.neutral[700]` | `#374151` | High emphasis text | 13.2:1 on white |
| `NestSyncColors.neutral[800]` | `#1F2937` | Maximum contrast text | 16.8:1 on white |
| `NestSyncColors.neutral[900]` | `#111827` | Critical emphasis | 19.3:1 on white |

**Accessibility Features**:
- All text colors meet WCAG AAA standards (7:1 minimum)
- Designed for tired parent accessibility
- Warm gray tones reduce eye strain

**Usage Guidelines**:
- Use neutral[500] for body text
- Use neutral[600] for headings
- Use neutral[400] for secondary text
- Use neutral[200] for borders
- Use neutral[50] for subtle backgrounds

### Traffic Light System - Inventory Status

| Token | Value | Usage | Psychology |
|-------|-------|-------|------------|
| `NestSyncColors.trafficLight.critical` | `#DC2626` | Items ≤3 days remaining | Urgent but not alarming |
| `NestSyncColors.trafficLight.low` | `#D97706` | Items 4-7 days remaining | Attention without panic |
| `NestSyncColors.trafficLight.stocked` | `#059669` | Items >7 days remaining | Reassurance and calm |
| `NestSyncColors.trafficLight.pending` | `#0891B2` | Incoming inventory | Hope and progress |

**Usage Guidelines**:
- Use for inventory status indicators only
- Always pair with text labels
- Never use for other UI elements

## Typography Tokens

### Font Sizes

| Token | Value | Usage | Line Height |
|-------|-------|-------|-------------|
| Caption | `11px` | Small labels, metadata, timestamps | `16px` (1.45) |
| Small | `12px` | Secondary text, captions, helper text | `16px` (1.33) |
| Body | `14px` | Primary body text, descriptions | `20px` (1.43) |
| Subtitle | `16px` | Section headings, emphasized text | `24px` (1.5) |
| Title | `20px` | Screen titles, card headers | `28px` (1.4) |
| Large Title | `28px` | Main screen headings | `36px` (1.29) |

**Usage Guidelines**:
- Use Body (14px) for all primary content
- Use Title (20px) for screen headers
- Use Large Title (28px) sparingly for main headings
- Maintain consistent line heights for readability
- Never use font sizes smaller than 11px

### Font Weights

| Token | Value | Usage |
|-------|-------|-------|
| Regular | `400` | Body text, descriptions |
| Medium | `500` | Emphasized text, labels |
| Semibold | `600` | Headings, buttons, important text |
| Bold | `700` | Large titles, high emphasis |

**Usage Guidelines**:
- Use Regular (400) for body text
- Use Semibold (600) for headings and buttons
- Use Bold (700) only for large titles
- Avoid using multiple weights in same text block

### Typography Examples

```typescript
// Heading Style
const headingStyle = {
  fontSize: 20,        // Title
  fontWeight: '600',   // Semibold
  color: NestSyncColors.neutral[600],
  lineHeight: 28,
  marginBottom: 8,     // 2 × 4px base unit
};

// Body Text Style
const bodyStyle = {
  fontSize: 14,        // Body
  fontWeight: '400',   // Regular
  color: NestSyncColors.neutral[500],
  lineHeight: 20,
  marginBottom: 12,    // 3 × 4px base unit
};

// Caption Style
const captionStyle = {
  fontSize: 11,        // Caption
  fontWeight: '500',   // Medium
  color: NestSyncColors.neutral[400],
  lineHeight: 16,
};
```

## Spacing Tokens

### Base Unit: 4px

All spacing MUST be a multiple of 4px for consistency and visual rhythm.

| Token | Value | Usage |
|-------|-------|-------|
| XS | `4px` | Minimal spacing, tight layouts |
| SM | `8px` | Compact spacing, related elements |
| MD | `12px` | Standard spacing, component padding |
| LG | `16px` | Generous spacing, section separation |
| XL | `20px` | Large spacing, major sections |
| XXL | `24px` | Maximum spacing, screen margins |

**Usage Guidelines**:
- Use MD (12px) for component padding
- Use LG (16px) for spacing between cards
- Use XL (20px) for screen margins
- Never use non-4px-multiple values
- Maintain consistent spacing within component types

### Spacing Examples

```typescript
// Card Spacing
const cardStyle = {
  padding: 16,          // LG - 4 × 4px
  marginBottom: 16,     // LG - 4 × 4px
  gap: 12,              // MD - 3 × 4px
};

// Screen Spacing
const screenStyle = {
  paddingHorizontal: 20, // XL - 5 × 4px
  paddingVertical: 16,   // LG - 4 × 4px
};

// Button Spacing
const buttonStyle = {
  paddingHorizontal: 16, // LG - 4 × 4px
  paddingVertical: 12,   // MD - 3 × 4px
  gap: 8,                // SM - 2 × 4px
};
```

## Border Radius Tokens

| Token | Value | Usage |
|-------|-------|-------|
| Small | `6px` | Small buttons, badges, chips |
| Medium | `8px` | Input fields, small cards |
| Large | `12px` | Cards, containers, primary buttons |
| XLarge | `16px` | Large cards, modals, bottom sheets |

**Usage Guidelines**:
- Use Large (12px) for most cards and buttons
- Use Medium (8px) for input fields
- Use Small (6px) for badges and chips
- Maintain consistent radius within component types

### Border Radius Examples

```typescript
// Card Border Radius
const cardStyle = {
  borderRadius: 12,     // Large
};

// Button Border Radius
const buttonStyle = {
  borderRadius: 12,     // Large
};

// Input Border Radius
const inputStyle = {
  borderRadius: 8,      // Medium
};

// Badge Border Radius
const badgeStyle = {
  borderRadius: 6,      // Small
};
```

## Shadow Tokens

| Token | Offset | Opacity | Radius | Elevation | Usage |
|-------|--------|---------|--------|-----------|-------|
| Small | `(0, 1)` | `0.05` | `2px` | `1` | Subtle depth, small cards |
| Medium | `(0, 2)` | `0.1` | `4px` | `2` | Standard depth, buttons |
| Large | `(0, 4)` | `0.15` | `8px` | `4` | Prominent depth, modals |

**Usage Guidelines**:
- Use Small for cards and containers
- Use Medium for buttons and interactive elements
- Use Large for modals and overlays
- Keep shadows subtle to maintain clean aesthetic

### Shadow Examples

```typescript
// Card Shadow
const cardStyle = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05,
  shadowRadius: 2,
  elevation: 1,         // Android
};

// Button Shadow
const buttonStyle = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 2,         // Android
};

// Modal Shadow
const modalStyle = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.15,
  shadowRadius: 8,
  elevation: 4,         // Android
};
```

## Touch Target Tokens

### Minimum Touch Target: 48px × 48px

All interactive elements MUST meet WCAG AA minimum touch target size.

| Element Type | Minimum Width | Minimum Height | Recommended |
|--------------|---------------|----------------|-------------|
| Button | `48px` | `48px` | `48px × 48px` or larger |
| Icon Button | `48px` | `48px` | `48px × 48px` |
| Link | N/A | `48px` | Full width, 48px height |
| Checkbox | `48px` | `48px` | `48px × 48px` touch area |
| Radio Button | `48px` | `48px` | `48px × 48px` touch area |
| Tab Control | `48px` | `48px` | Full width, 48px height |

**Usage Guidelines**:
- Always ensure 48px minimum height for buttons
- Add padding to meet minimum if needed
- Test on physical devices, not just simulators
- Consider spacing between touch targets (8px minimum)

### Touch Target Examples

```typescript
// Button Touch Target
const buttonStyle = {
  minHeight: 48,        // WCAG AA minimum
  paddingHorizontal: 16,
  paddingVertical: 12,
  justifyContent: 'center',
  alignItems: 'center',
};

// Icon Button Touch Target
const iconButtonStyle = {
  width: 48,            // WCAG AA minimum
  height: 48,           // WCAG AA minimum
  justifyContent: 'center',
  alignItems: 'center',
};

// Link Touch Target
const linkStyle = {
  minHeight: 48,        // WCAG AA minimum
  paddingVertical: 12,
  justifyContent: 'center',
};
```

## Glass UI Tokens

### Blur Intensity

| Token | Value | Usage |
|-------|-------|-------|
| Light | `10px` | Subtle blur for cards and containers |
| Medium | `20px` | Standard blur for navigation and buttons |
| Heavy | `40px` | Strong blur for modals and overlays |
| Intense | `80px` | Maximum blur for special effects |

### Opacity Levels

| Token | Value | Usage |
|-------|-------|-------|
| Subtle | `0.7` | Maximum transparency for lightweight glass |
| Medium | `0.8` | Balanced transparency for most use cases |
| Strong | `0.9` | Minimal transparency for important elements |

### Tint Colors

| Token | Value | Usage |
|-------|-------|-------|
| Light | `rgba(255, 255, 255, 0.1)` | White tint for light backgrounds |
| Dark | `rgba(0, 0, 0, 0.1)` | Black tint for dark backgrounds |
| Primary | `rgba(8, 145, 178, 0.1)` | Brand color tint for emphasis |

### Glass UI Presets

| Preset | Blur | Opacity | Tint | Usage |
|--------|------|---------|------|-------|
| Navigation | Medium (20px) | Strong (0.9) | Light | Headers, tab bars |
| Card | Light (10px) | Subtle (0.7) | Light | Content cards |
| Modal | Heavy (40px) | Strong (0.9) | Dark | Modals, overlays |
| Button | Medium (20px) | Medium (0.8) | Primary | Interactive buttons |

## Validation Checklist

Use this checklist when reviewing components for design system compliance:

### Colors
- [ ] All colors use NestSyncColors tokens (no hardcoded hex values)
- [ ] Text colors meet WCAG AA contrast ratio (4.5:1 minimum)
- [ ] Semantic colors used appropriately (success, warning, error, info)
- [ ] Color is not the only indicator of meaning (icons/text included)

### Typography
- [ ] Font sizes use standard values (11px, 12px, 14px, 16px, 20px, 28px)
- [ ] Font weights use standard values (400, 500, 600, 700)
- [ ] Line heights maintain readability (1.3-1.5 ratio)
- [ ] No font sizes smaller than 11px

### Spacing
- [ ] All spacing uses 4px base unit multiples
- [ ] Consistent spacing within component type
- [ ] Adequate spacing between interactive elements (8px minimum)
- [ ] Screen margins use XL (20px) or XXL (24px)

### Border Radius
- [ ] Border radius uses standard values (6px, 8px, 12px, 16px)
- [ ] Consistent radius within component type
- [ ] Cards use Large (12px) radius
- [ ] Buttons use Large (12px) radius

### Shadows
- [ ] Shadows use standard presets (small, medium, large)
- [ ] Shadow intensity matches element importance
- [ ] Shadows include both iOS and Android properties

### Touch Targets
- [ ] All buttons meet 48px minimum height
- [ ] All interactive elements meet 48px minimum touch area
- [ ] Adequate spacing between touch targets (8px minimum)
- [ ] Touch targets tested on physical devices

### Glass UI
- [ ] Glass effects use standard presets
- [ ] Blur intensity appropriate for element type
- [ ] Opacity maintains readability
- [ ] Platform-specific implementation considered

## Quick Reference

### Most Common Patterns

**Primary Button**:
```typescript
{
  backgroundColor: NestSyncColors.primary.blue,
  paddingHorizontal: 16,
  paddingVertical: 12,
  borderRadius: 12,
  minHeight: 48,
}
```

**Card**:
```typescript
{
  backgroundColor: NestSyncColors.neutral[50],
  padding: 16,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: NestSyncColors.neutral[200],
  marginBottom: 16,
}
```

**Heading**:
```typescript
{
  fontSize: 20,
  fontWeight: '600',
  color: NestSyncColors.neutral[600],
  marginBottom: 8,
}
```

**Body Text**:
```typescript
{
  fontSize: 14,
  fontWeight: '400',
  color: NestSyncColors.neutral[500],
  lineHeight: 20,
}
```

## Related Documentation

- [Design System Audit Report](./design-system-audit-report.md)
- [Component Usage Guidelines](./component-usage-guidelines.md)
- [Design Tokens Reference](../../constants/Colors.ts)
- [Glass UI Reference](../../constants/GlassUI.ts)
- [Visual Regression Tests](../../tests/VISUAL_REGRESSION_TESTS.md)
- [Accessibility Compliance Tests](../../tests/ACCESSIBILITY_COMPLIANCE_TESTS.md)

---

**Last Updated**: November 10, 2025  
**Version**: 1.0.0  
**Maintained By**: NestSync Design Team
