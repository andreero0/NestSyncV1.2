---
title: Airline Timeline Component Specifications
description: Detailed component documentation for airline-inspired timeline interface
feature: airline-timeline
last-updated: 2025-09-11
version: 1.0.0
related-files: 
  - ../../design-system/style-guide.md
  - ./README.md
  - ./user-journey.md
  - ./interaction-design.md
dependencies:
  - NestSync Design System
  - React Native Reanimated
  - Gesture Handler
status: design
---

# Airline Timeline Component Specifications

## Overview

This document defines the complete component architecture for the airline-style timeline page, with detailed specifications for each component including variants, states, and integration patterns.

## Core Component Architecture

### 1. TimelineContainer
**Primary container managing the entire timeline experience**

#### Component Properties
```typescript
interface TimelineContainerProps {
  events: TimelineEvent[];
  currentTime: Date;
  timeRange: {
    start: Date;
    end: Date;
  };
  onEventPress?: (event: TimelineEvent) => void;
  onTimeRangeChange?: (range: { start: Date; end: Date }) => void;
  scrollToTime?: Date;
  refreshing?: boolean;
  onRefresh?: () => void;
}
```

#### Visual Specifications
- **Layout**: Full screen container with safe area handling
- **Background**: Neutral-50 (#F9FAFB) with subtle gradient to Neutral-100
- **Padding**: 0px (full edge-to-edge for immersive timeline experience)
- **Safe Area**: Automatic handling for iOS notches and Android navigation

#### Responsive Behavior
- **Mobile (320-767px)**: Single column with simplified time markers
- **Tablet (768-1023px)**: Enhanced spacing with larger touch targets
- **Desktop (1024px+)**: Maximum content width with centered timeline

### 2. TimelineAxis
**Central vertical line with time markers and current time indicator**

#### Component Properties
```typescript
interface TimelineAxisProps {
  timeRange: { start: Date; end: Date };
  currentTime: Date;
  scrollOffset: number;
  onTimeMarkerPress?: (time: Date) => void;
  showDetailedMarkers?: boolean;
}
```

#### Visual Specifications
**Axis Line**:
- **Width**: 4px (mobile: 3px, desktop: 5px)
- **Color**: Primary Blue (#0891B2)
- **Style**: Solid line with subtle gradient fade at top/bottom edges
- **Opacity**: 0.9 for depth perception

**Time Markers**:
- **Frequency**: Every 2 hours for detailed view, every 6 hours for overview
- **Style**: 8px horizontal lines extending from axis (4px each side)
- **Color**: Primary Blue (#0891B2) at 70% opacity
- **Typography**: Caption style (12px/16px, 400 weight)
- **Positioning**: Right-aligned labels with 8px gap from marker

**Current Time Indicator**:
- **Shape**: 16px circle with 2px white border
- **Background**: Primary Blue (#0891B2)
- **Animation**: Gentle pulse (scale 0.95-1.05) every 2 seconds
- **Z-Index**: Above all other elements for visibility
- **Shadow**: `0 2px 8px rgba(8, 145, 178, 0.3)` for prominence

#### States
1. **Default**: Standard axis with time markers
2. **Active Scrolling**: Brightened axis (opacity 1.0) with enhanced markers
3. **Time Focus**: Highlighted time marker with subtle glow effect
4. **Loading**: Skeleton animation for time markers

#### Accessibility
- **Role**: `role="timeline"`
- **ARIA Labels**: `aria-label="Activity timeline from {start} to {end}"`
- **Keyboard Navigation**: Tab stops at significant time markers
- **Screen Reader**: Announces current time position during scroll

### 3. TimelineEvent
**Individual event cards representing activities**

#### Component Properties
```typescript
interface TimelineEventProps {
  event: {
    id: string;
    type: 'diaper_change' | 'inventory_update' | 'size_change' | 'feeding';
    timestamp: Date;
    title: string;
    details: string;
    status?: 'success' | 'warning' | 'info';
    metadata?: Record<string, any>;
  };
  position: 'left' | 'right';
  onPress?: () => void;
  onLongPress?: () => void;
  expanded?: boolean;
}
```

#### Base Card Specifications
**Dimensions**:
- **Width**: 280px (mobile: 260px, tablet: 300px)
- **Height**: 88px (collapsed), 120px+ (expanded)
- **Corner Radius**: 12px (following NestSync standard)
- **Internal Padding**: 16px all sides

**Drop Shadow**:
- **Default**: `0 4px 12px rgba(0, 0, 0, 0.1)`
- **Hover/Press**: `0 6px 16px rgba(0, 0, 0, 0.15)`
- **Expanded**: `0 8px 24px rgba(0, 0, 0, 0.2)`

#### Event Type Variants

##### Diaper Change Events
**Visual Treatment**:
- **Background**: White with Success Green (#059669) left border (4px)
- **Icon**: Checkmark in 24×24px circle with Success Green background
- **Typography**: 
  - Title: Body style (16px/24px, 500 weight) in Neutral-700
  - Details: Body Small (14px/20px, 400 weight) in Neutral-500
  - Timestamp: Caption (12px/16px, 400 weight) in Neutral-400

**Content Structure**:
```
[✓] Diaper Changed
Size 3 • Clean • 2:30 PM
Notes: Normal consistency
```

##### Inventory Update Events
**Visual Treatment**:
- **Background**: White with Primary Blue (#0891B2) left border (4px)
- **Icon**: Cube/box icon in 24×24px circle with Primary Blue background
- **Content Focus**: Quantity changes and source information

**Content Structure**:
```
[📦] Inventory Updated
Added 12 Size 3 diapers • 11:45 AM
Source: Amazon delivery
```

##### Size Change Events
**Visual Treatment**:
- **Background**: White with Accent Orange (#EA580C) left border (4px)
- **Icon**: Growth arrow icon in 24×24px circle with Orange background
- **Emphasis**: Size transition prominently displayed

**Content Structure**:
```
[↗️] Size Changed
Size 2 → Size 3 • 9:15 AM
Predicted: Sept 8 • Actual: Sept 9
```

##### Feeding Events
**Visual Treatment**:
- **Background**: White with Secondary Green (#059669) left border (4px)
- **Icon**: Bottle icon in 24×24px circle with Secondary Green background
- **Tone**: Nurturing and supportive

**Content Structure**:
```
[🍼] Feeding Session
Bottle • 15 minutes • 7:30 AM
Notes: Good appetite
```

#### Card Positioning System
**Left Position Cards**:
- **Alignment**: Right edge aligns 8px before timeline axis
- **Connection**: 8px horizontal line from right edge to timeline
- **Animation**: Slide in from left with 200ms delay after timeline draws

**Right Position Cards**:
- **Alignment**: Left edge aligns 8px after timeline axis  
- **Connection**: 8px horizontal line from left edge to timeline
- **Animation**: Slide in from right with 200ms delay after timeline draws

#### Interactive States
1. **Default**: Standard card appearance with subtle hover indication
2. **Hover** (desktop): Gentle scale (1.02x) with enhanced shadow
3. **Pressed**: Scale (0.98x) with reduced shadow for tactile feedback
4. **Expanded**: Increased height with additional detail sections
5. **Loading**: Skeleton animation for content areas
6. **Error**: Red accent border with error icon overlay

### 4. TimePeriodHeader
**Sticky section headers organizing timeline into periods**

#### Component Properties
```typescript
interface TimePeriodHeaderProps {
  period: 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'older';
  eventCount: number;
  date?: Date;
  onCollapseToggle?: () => void;
  collapsed?: boolean;
}
```

#### Visual Specifications
**Background Treatment**:
- **Color**: Neutral-100 (#F3F4F6) with 95% opacity backdrop blur
- **Border**: 1px top border in Neutral-200 (#E5E7EB)
- **Height**: 48px fixed height for consistent rhythm
- **Sticky Behavior**: Remains visible during scroll with smooth transition

**Typography**:
- **Primary Label**: H5 style (18px/24px, 500 weight) in Neutral-700
- **Event Count**: Body Small (14px/20px, 400 weight) in Neutral-500
- **Date Range**: Caption (12px/16px, 400 weight) in Neutral-400

**Content Layout**:
```
Today                           4 activities
                               Sept 11, 2025
```

#### Period Definitions
- **Today**: Current calendar day
- **Yesterday**: Previous calendar day
- **This Week**: Current week (Monday-Sunday)
- **Last Week**: Previous calendar week
- **This Month**: Current calendar month
- **Older**: All events beyond current month

### 5. TimeNavigator
**Optional floating navigation control for quick time jumping**

#### Component Properties
```typescript
interface TimeNavigatorProps {
  visible: boolean;
  onTimeSelect: (time: Date) => void;
  onClose: () => void;
  quickJumps: Array<{ label: string; time: Date }>;
}
```

#### Visual Specifications
**Container**:
- **Position**: Floating overlay with backdrop blur
- **Background**: White with 90% opacity
- **Shadow**: `0 8px 32px rgba(0, 0, 0, 0.24)`
- **Corner Radius**: 16px
- **Padding**: 20px

**Quick Jump Buttons**:
- **Style**: Secondary button variant from design system
- **Spacing**: 8px between buttons in horizontal scroll
- **Labels**: "Now", "1 Hour Ago", "Today", "Yesterday", "This Week"

#### Animation
- **Entry**: Scale from 0.8 to 1.0 with fade-in over 300ms
- **Exit**: Scale to 0.8 with fade-out over 200ms
- **Button Press**: Gentle scale feedback (0.95x) with haptic response

### 6. ScrollProgress
**Subtle progress indicator showing timeline position**

#### Component Properties
```typescript
interface ScrollProgressProps {
  progress: number; // 0.0 to 1.0
  totalDuration: number; // milliseconds of timeline content
  currentPosition: Date;
  onSeek?: (progress: number) => void;
}
```

#### Visual Specifications
**Progress Bar**:
- **Position**: Fixed to top of screen, below safe area
- **Height**: 3px
- **Background**: Neutral-200 (#E5E7EB)
- **Progress Fill**: Primary Blue (#0891B2) with subtle gradient
- **Border Radius**: 1.5px

**Progress Thumb** (appears on interaction):
- **Size**: 20×20px circle
- **Color**: Primary Blue with white border
- **Shadow**: `0 2px 8px rgba(8, 145, 178, 0.4)`
- **Touch Target**: 44×44px for accessibility

## Component Integration Patterns

### State Management
**Timeline State**:
```typescript
interface TimelineState {
  events: TimelineEvent[];
  currentTime: Date;
  scrollPosition: number;
  selectedEvent?: string;
  timeRange: { start: Date; end: Date };
  loading: boolean;
  refreshing: boolean;
}
```

### Performance Optimizations
**Virtual Scrolling**:
- Render only visible events plus buffer
- Lazy load event details on scroll approach
- Optimize re-renders with React.memo and useMemo

**Animation Performance**:
- Use native driver for all scroll animations
- Pre-calculate layout positions
- Implement smart re-layout only when necessary

### Accessibility Integration
**Component Hierarchy**:
```
TimelineContainer (role="main")
├── ScrollProgress (role="slider")
├── TimeNavigator (role="dialog")
├── TimelineAxis (role="timeline")
├── TimePeriodHeader (role="heading")
└── TimelineEvent (role="article")
```

**Keyboard Navigation Flow**:
1. Timeline overview focus
2. Current time indicator
3. Time period headers
4. Individual events in chronological order
5. Quick navigation controls

### Error Handling
**Component Error States**:
- **Network Error**: Retry button with offline indicator
- **Data Error**: Partial timeline with error indicators
- **Loading Error**: Skeleton states with progress indication
- **Empty State**: Helpful guidance for first-time users

## Quality Assurance Checklist

### Design System Compliance
- [ ] All colors match NestSync palette with 7:1+ contrast ratios
- [ ] Typography follows established hierarchy (H5, Body, Caption styles)
- [ ] Spacing uses 8px systematic scale (16px padding, 24px margins)
- [ ] Border radius consistent with design system (12px cards)
- [ ] Icons from approved NestSync icon library

### Component Functionality
- [ ] Timeline scrolls smoothly with momentum physics
- [ ] Event cards position correctly (alternating left/right)
- [ ] Time markers align precisely with event timestamps
- [ ] Current time indicator tracks real-time accurately
- [ ] Period headers stick during scroll with backdrop blur

### Accessibility Excellence
- [ ] All components have proper ARIA roles and labels
- [ ] Keyboard navigation works logically through timeline
- [ ] Screen reader announces timeline structure clearly
- [ ] Touch targets meet 44×44px minimum requirement
- [ ] Focus indicators visible and consistent
- [ ] Reduced motion alternatives implemented

### Psychology & UX Validation
- [ ] Event categorization immediately recognizable
- [ ] Color coding follows traffic light psychology
- [ ] Animation timing feels calming (not rushed)
- [ ] Information density appropriate for tired parents
- [ ] Error states provide supportive guidance

## Implementation Notes

### React Native Integration
- Use `@react-native-async-storage/async-storage` for timeline preferences
- Integrate with `react-native-reanimated` for smooth animations
- Implement `react-native-gesture-handler` for touch interactions
- Use `react-native-safe-area-context` for proper screen boundaries

### Performance Considerations
- Implement FlatList with getItemLayout for large timelines
- Use InteractionManager for smooth animation completion
- Optimize image loading with expo-image caching
- Implement smart refresh strategies with pull-to-refresh

## Last Updated
2025-09-11 - Complete component specifications for airline timeline design