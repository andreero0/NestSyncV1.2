---
title: Timeline Component Technical Specifications
description: Detailed component specifications for the compact baby tracking timeline items
feature: timeline-redesign
last-updated: 2025-09-11
version: 1.0
related-files: 
  - ./README.md
  - ./activity-color-system.md
  - ./interaction-patterns.md
dependencies:
  - React Native Components
  - NestSync Design System
status: approved
---

# Timeline Component Technical Specifications

## Component Overview

The TimelineItem component replaces oversized 280×88px cards with compact 48px items optimized for mobile scanning and one-handed usage by tired parents.

## Component Structure

### TimelineItem Component

```typescript
interface TimelineItemProps {
  id: string;
  activityType: ActivityType;
  timestamp: Date;
  details?: string;
  onPress?: () => void;
  onLongPress?: () => void;
  testID?: string;
}

enum ActivityType {
  DIAPER = 'diaper',
  WIPES = 'wipes', 
  CREAM = 'cream',
  FEEDING = 'feeding',
  SLEEP = 'sleep',
  PLAY = 'play',
  MEDICAL = 'medical',
  NOTE = 'note'
}
```

## Layout Specifications

### Container Dimensions
- **Height**: `48px` (fixed, optimal for thumb navigation)
- **Width**: `100%` (responsive to parent container)
- **Horizontal Padding**: `16px` (comfortable touch zones)
- **Vertical Margin**: `0px` (no gaps between items for continuous scanning)

### Content Layout Grid
```
|<-16px->|<-32px->|<-8px->|<-flexible->|<-8px->|<-80px->|<-16px->|
|  pad   | icon  | gap  |   content   | gap  |  time  |  pad   |
```

### Icon Area Specifications
- **Container**: `32×32px` (minimum 44×44px touch target met by full item height)
- **Icon Size**: `16×16px` (centered within container)
- **Background**: Circular background with activity-specific color
- **Corner Radius**: `16px` (perfect circle)

### Content Area Specifications
- **Primary Text Area**: Full available width minus time area
- **Text Truncation**: Ellipsis after 1 line for primary text
- **Line Height**: `20px` for primary text, `16px` for secondary
- **Vertical Alignment**: Center-aligned within 48px container

### Time Area Specifications
- **Width**: `80px` (fixed width for scanning consistency)
- **Alignment**: Right-aligned
- **Format**: 12-hour format with AM/PM (Canadian preference)
- **Examples**: "2:34 PM", "11:05 AM", "12:00 AM"

## Typography Specifications

### Primary Text (Activity Type)
- **Font Family**: System default (`-apple-system`, `BlinkMacSystemFont`)
- **Font Size**: `16px` (iOS), `16sp` (Android)
- **Font Weight**: `500` (Medium)
- **Line Height**: `20px`
- **Color**: `colors.text` (theme-aware)
- **Max Lines**: `1` with ellipsis truncation

### Secondary Text (Details)
- **Font Family**: System default
- **Font Size**: `14px` (iOS), `14sp` (Android)
- **Font Weight**: `400` (Regular)
- **Line Height**: `16px`
- **Color**: `colors.textSecondary` (60% opacity of primary text)
- **Max Lines**: `1` with ellipsis truncation

### Time Text
- **Font Family**: System default
- **Font Size**: `14px` (iOS), `14sp` (Android)
- **Font Weight**: `400` (Regular)
- **Line Height**: `16px`
- **Color**: `colors.textSecondary`
- **Format**: "h:mm AM/PM" (Canadian 12-hour preference)

## Visual States

### Default State
- **Background**: `transparent`
- **Border**: None
- **Shadow**: None (maintains clean list appearance)
- **Icon**: Full color with subtle background
- **Text**: Full opacity

### Pressed State
- **Background**: `colors.surfacePressed` (subtle highlight)
- **Transition**: `150ms ease-out`
- **Icon**: Slightly darker background (10% darker)
- **Text**: No change (maintains readability)

### Loading State
- **Background**: Skeleton shimmer animation
- **Duration**: Subtle pulse, 1.5s cycle
- **Icon**: Gray circle placeholder
- **Text**: Gray rectangle placeholders

### Error State
- **Background**: `colors.errorBackground` (very subtle red tint)
- **Border**: `1px solid colors.error` (left border only)
- **Icon**: Error icon in red
- **Text**: Error message in red

## Accessibility Specifications

### Touch Targets
- **Minimum Size**: Full 48px height meets 44×44px requirement
- **Touch Area**: Entire item is tappable
- **Feedback**: Immediate visual response (<16ms)

### Screen Reader Support
- **Accessibility Label**: "{activityType} at {time}, {details}"
- **Accessibility Hint**: "Double tap to edit this activity"
- **Accessibility Role**: "button"
- **Group**: Timeline items grouped under "Baby activities timeline"

### Keyboard Navigation
- **Focus Indicator**: 2px blue outline with 2px offset
- **Tab Order**: Sequential through timeline items
- **Actions**: Enter/Space to activate, long press via context menu key

### High Contrast Support
- **Text Contrast**: Minimum 4.5:1 ratio (WCAG AA)
- **Icon Contrast**: Minimum 3:1 ratio for graphical elements
- **Focus Contrast**: Minimum 3:1 ratio for focus indicators
- **Color Independence**: Icons and text provide information without color dependency

## Performance Specifications

### Rendering Optimization
- **Virtual Scrolling**: Render only visible + buffer items
- **Memory Management**: Recycle components for 1000+ items
- **Image Optimization**: Vector icons only, no bitmap images
- **Animation Performance**: Hardware-accelerated transforms only

### Interaction Response
- **Touch Response**: <16ms visual feedback
- **Scroll Performance**: 60fps maintenance
- **Layout Calculation**: Cached measurements for consistent height
- **Memory Usage**: <2MB for 1000 timeline items

## Implementation Examples

### Basic Usage
```typescript
<TimelineItem
  id="activity-123"
  activityType={ActivityType.DIAPER}
  timestamp={new Date('2025-09-11T15:30:00')}
  details="Wet diaper changed"
  onPress={() => editActivity('activity-123')}
  testID="timeline-item-diaper-123"
/>
```

### With Custom Styling
```typescript
<TimelineItem
  id="activity-124"
  activityType={ActivityType.FEEDING}
  timestamp={new Date('2025-09-11T16:00:00')}
  style={[styles.timelineItem, customStyles]}
  onLongPress={() => showContextMenu('activity-124')}
/>
```

## Component Variants

### CompactTimelineItem
For even denser information display when needed:
- **Height**: `40px`
- **Icon Size**: `14×14px`
- **Font Size**: `14px` primary, `12px` secondary
- **Use Case**: Historical view, summary screens

### ExpandedTimelineItem
For detailed editing context:
- **Height**: `64px`
- **Icon Size**: `20×20px`
- **Secondary Details**: Multi-line support
- **Use Case**: Edit mode, detailed view

## Quality Assurance Checklist

### Visual Testing
- [ ] 48px height maintained across all device sizes
- [ ] Icon centering perfect in all states
- [ ] Text truncation works properly with long content
- [ ] Time formatting consistent across all locales
- [ ] Color contrast meets WCAG AA standards

### Interaction Testing
- [ ] Touch feedback responsive (<16ms)
- [ ] Long press context menu functional
- [ ] Keyboard navigation complete
- [ ] Screen reader announcements clear
- [ ] Focus indicators visible and appropriate

### Performance Testing
- [ ] Smooth scrolling with 100+ items
- [ ] Memory usage stable during extended scrolling
- [ ] No dropped frames during interaction
- [ ] Fast list updates when new items added
- [ ] Efficient re-rendering on theme changes

---

*These specifications ensure the timeline component meets the needs of sleep-deprived parents while maintaining technical excellence and accessibility standards.*