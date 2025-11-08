---
title: Typography Hierarchy for Timeline
description: Mobile-optimized typography system for baby tracking timeline items focused on readability and scanning efficiency
feature: timeline-redesign
last-updated: 2025-09-11
version: 1.0
related-files: 
  - ./README.md
  - ./timeline-component-specs.md
  - ./activity-color-system.md
dependencies:
  - NestSync Design System
  - Platform Typography Guidelines
status: approved
---

# Typography Hierarchy for Timeline

## Overview

This typography system optimizes readability for sleep-deprived parents using baby tracking timeline at 3 AM. The hierarchy prioritizes quick scanning, clear information hierarchy, and accessibility compliance across all device sizes.

## Design Principles

### Mobile-First Readability
- **Thumb-Friendly Sizes**: Font sizes optimized for one-handed mobile usage
- **Quick Scanning**: Clear hierarchy allows rapid visual scanning of timeline
- **Night Reading**: High contrast ratios maintain readability in low light
- **Fatigue Resistance**: Font choices reduce cognitive load for tired parents

### Information Hierarchy Goals
1. **Primary**: Activity type (immediate recognition)
2. **Secondary**: Timestamp (quick temporal reference)
3. **Tertiary**: Additional details (optional context)

## Typography Scale

### Primary Text (Activity Type)
**Purpose**: Main activity identification for immediate recognition

**Specifications**:
- **Font Family**: System default (`-apple-system`, `BlinkMacSystemFont`, `Segoe UI`)
- **Font Size**: `16px` / `16sp`
- **Font Weight**: `500` (Medium)
- **Line Height**: `20px` (1.25 ratio)
- **Letter Spacing**: `0px` (default)
- **Color**: Theme-aware primary text color
- **Max Width**: Truncates with ellipsis after 1 line

**Rationale**:
- 16px ensures readability without appearing oversized in compact 48px items
- Medium weight (500) provides sufficient emphasis without being heavy
- System fonts ensure platform consistency and performance
- Single line truncation maintains clean layout regardless of content length

### Secondary Text (Details)
**Purpose**: Supplementary information (quantity, notes, specifics)

**Specifications**:
- **Font Family**: System default (matches primary for consistency)
- **Font Size**: `14px` / `14sp`
- **Font Weight**: `400` (Regular)
- **Line Height**: `16px` (1.14 ratio)
- **Letter Spacing**: `0px` (default)
- **Color**: Theme-aware secondary text color (60% opacity of primary)
- **Max Width**: Truncates with ellipsis after 1 line

**Rationale**:
- 14px provides clear readability while being visually subordinate to primary text
- Regular weight maintains hierarchy without disappearing
- Reduced opacity creates clear visual hierarchy
- Single line maintains compact item height

### Time Text (Timestamp)
**Purpose**: Temporal reference for quick chronological scanning

**Specifications**:
- **Font Family**: System default (consistent with other text)
- **Font Size**: `14px` / `14sp`
- **Font Weight**: `400` (Regular)
- **Line Height**: `16px` (1.14 ratio)
- **Letter Spacing**: `0px` (default)
- **Color**: Theme-aware secondary text color
- **Format**: "h:mm AM/PM" (Canadian 12-hour preference)
- **Alignment**: Right-aligned for scanning consistency

**Rationale**:
- Same size as secondary text but right-aligned for easy scanning
- 12-hour format matches Canadian user expectations
- Right alignment creates consistent time column for quick temporal reference
- Regular weight prevents time from competing with activity type

## Platform Adaptations

### iOS Specifications
```css
.timeline-primary-text {
  font-family: -apple-system, BlinkMacSystemFont;
  font-size: 16px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0px;
}

.timeline-secondary-text {
  font-family: -apple-system, BlinkMacSystemFont;
  font-size: 14px;
  font-weight: 400;
  line-height: 16px;
  letter-spacing: 0px;
}
```

### Android Specifications
```css
.timeline-primary-text {
  font-family: Roboto, sans-serif;
  font-size: 16sp;
  font-weight: 500;
  line-height: 20sp;
  letter-spacing: 0sp;
}

.timeline-secondary-text {
  font-family: Roboto, sans-serif;
  font-size: 14sp;
  font-weight: 400;
  line-height: 16sp;
  letter-spacing: 0sp;
}
```

### React Native Implementation
```typescript
const timelineTypography = {
  primary: {
    fontSize: 16,
    fontWeight: '500' as const,
    lineHeight: 20,
    letterSpacing: 0,
    fontFamily: Platform.select({
      ios: 'System',
      android: 'Roboto',
      web: '-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif'
    })
  },
  secondary: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 16,
    letterSpacing: 0,
    fontFamily: Platform.select({
      ios: 'System',
      android: 'Roboto',
      web: '-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif'
    })
  }
};
```

## Color Specifications

### Light Mode Colors
- **Primary Text**: `#111827` (Gray-900) - 4.8:1 contrast ratio
- **Secondary Text**: `#6B7280` (Gray-500) - 4.6:1 contrast ratio
- **Time Text**: `#6B7280` (Gray-500) - 4.6:1 contrast ratio

### Dark Mode Colors
- **Primary Text**: `#F9FAFB` (Gray-50) - 5.2:1 contrast ratio
- **Secondary Text**: `#9CA3AF` (Gray-400) - 4.7:1 contrast ratio
- **Time Text**: `#9CA3AF` (Gray-400) - 4.7:1 contrast ratio

### Theme-Aware Implementation
```typescript
export function useTimelineTypography() {
  const { theme, colors } = useTheme();
  
  return {
    primary: {
      ...timelineTypography.primary,
      color: colors.text
    },
    secondary: {
      ...timelineTypography.secondary,
      color: colors.textSecondary
    },
    time: {
      ...timelineTypography.secondary,
      color: colors.textSecondary,
      textAlign: 'right' as const
    }
  };
}
```

## Accessibility Specifications

### WCAG Compliance
- **Contrast Ratios**: All text meets WCAG AA standards (4.5:1 minimum)
- **Font Size**: 16px primary text exceeds 14px WCAG recommendation
- **Line Height**: 1.25 ratio meets WCAG spacing requirements
- **Color Independence**: Text hierarchy works without color dependency

### Dynamic Type Support
```typescript
// iOS Dynamic Type scaling
const getScaledFontSize = (baseSize: number) => {
  const fontScale = PixelRatio.getFontScale();
  return Math.round(baseSize * fontScale);
};

// Android font scale adaptation
const adaptiveTypography = {
  primary: {
    fontSize: getScaledFontSize(16),
    lineHeight: getScaledFontSize(20)
  },
  secondary: {
    fontSize: getScaledFontSize(14),
    lineHeight: getScaledFontSize(16)
  }
};
```

### Screen Reader Support
- **Semantic Structure**: Text hierarchy reflected in accessibility tree
- **Reading Order**: Activity type → details → timestamp logical flow
- **Abbreviation Handling**: "AM/PM" expanded to "morning/evening" for screen readers
- **Localization**: Time format adapts to user's locale preferences

## Responsive Behavior

### Small Devices (320-375px width)
- Font sizes remain at specified values (16px/14px)
- Text truncation more aggressive to prevent wrapping
- Time area width may reduce to 70px if needed

### Large Devices (414px+ width)
- Font sizes remain consistent for timeline scanning
- More generous spacing allows slightly less aggressive truncation
- Time area maintains 80px width for consistency

### Tablet Adaptations
- Typography scales remain mobile-optimized for thumb scanning
- Multi-column layouts maintain same text hierarchy
- Touch targets preserved regardless of layout changes

## Content Guidelines

### Activity Type Text
- **Max Length**: 20-25 characters before truncation
- **Capitalization**: Sentence case ("Diaper change" not "DIAPER CHANGE")
- **Consistency**: Use standard terminology across all activities
- **Localization**: Support for Canadian English spelling and terms

### Details Text
- **Max Length**: 30-35 characters before truncation
- **Format**: Brief, descriptive phrases ("Wet diaper", "5 oz formula")
- **Units**: Canadian measurements where applicable (mL, grams, Celsius)
- **Abbreviations**: Common parent-friendly abbreviations acceptable

### Time Text
- **Format**: "h:mm AM/PM" (Canadian 12-hour standard)
- **Examples**: "2:34 PM", "11:05 AM", "12:00 AM"
- **Consistency**: Always show AM/PM for clarity
- **Real-time**: Updates automatically as time passes

## Performance Considerations

### Font Loading
- **System Fonts Only**: No custom font loading delays
- **Platform Optimization**: Native font rendering for best performance
- **Memory Efficiency**: Minimal font stack reduces memory usage
- **Render Performance**: Fast text measurement and layout

### Text Measurement
- **Cached Calculations**: Text width calculations cached for performance
- **Truncation Logic**: Efficient ellipsis calculation for long text
- **Layout Stability**: Consistent line heights prevent layout jumping
- **Scroll Performance**: Text rendering optimized for smooth scrolling

## Testing Guidelines

### Readability Testing
- **Distance Testing**: Readable at arm's length (typical phone usage)
- **Lighting Testing**: Verification in low-light conditions
- **Fatigue Testing**: Readability when user is tired or stressed
- **Speed Testing**: Quick scanning and comprehension verification

### Accessibility Testing
- **Screen Reader**: Complete VoiceOver/TalkBack testing
- **Dynamic Type**: Testing with increased system font sizes
- **High Contrast**: Verification with system high contrast modes
- **Color Blindness**: Testing with color vision deficiency simulations

### Cross-Platform Testing
- **iOS Devices**: iPhone SE to iPhone Pro Max testing
- **Android Devices**: Small to large Android phone testing
- **Rendering**: Font rendering consistency across platforms
- **Performance**: Text performance on older devices

---

*This typography system prioritizes the real-world needs of tired parents, ensuring critical baby activity information is instantly readable and scannable regardless of time of day or user fatigue level.*