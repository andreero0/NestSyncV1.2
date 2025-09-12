# StatusOverviewCard Component Specifications

## Component Overview

The StatusOverviewCard is the foundational component of the Dashboard Traffic Light System, providing consistent visual and interaction patterns across all four status types while maintaining psychology-driven UX principles.

## TypeScript Interface

```typescript
export interface StatusOverviewCardProps {
  // Core Data Properties
  title: string;                    // Card title (e.g., "Critical Items")
  count: number;                    // Primary metric display
  statusType: 'critical' | 'low' | 'stocked' | 'pending';
  description?: string;             // Optional supportive messaging
  
  // Visual Customization
  icon: React.ComponentType<IconProps>;  // Status icon component
  borderColor: string;              // Traffic light color indicator
  
  // Interaction Properties
  onPress?: () => void;             // Card tap handler
  disabled?: boolean;               // Disable interactions
  loading?: boolean;                // Loading state display
  
  // Accessibility Properties
  accessibilityLabel?: string;     // Screen reader description
  accessibilityHint?: string;      // Screen reader action hint
  testID?: string;                 // Testing identifier
  
  // Layout Properties
  style?: ViewStyle;               // Additional styling override
}

export interface IconProps {
  size?: number;                   // Icon dimensions (default: 24)
  color?: string;                  // Icon color (default: theme text)
  accessibilityLabel?: string;    // Screen reader icon description
}
```

## Visual Design Specifications

### Card Structure
```
┌─────────────────────────────────────┐ ← 3px solid border (traffic light color)
│  [Icon] [Title]              │ ← 16px top padding
│                               │
│  [Large Count Display]        │ ← Primary metric
│                               │
│  [Description Text]           │ ← Supportive messaging
│                               │ ← 16px bottom padding
└─────────────────────────────────────┘
```

### Dimensions & Spacing

#### Mobile (320-767px)
- **Card Size**: `156×120px`
- **Internal Padding**: `16px` all sides
- **Border Radius**: `12px`
- **Border Width**: `3px solid`

#### Tablet (768-1023px)  
- **Card Size**: `180×120px`
- **Internal Padding**: `20px` all sides
- **Border Radius**: `12px` 
- **Border Width**: `3px solid`

#### Desktop (1024px+)
- **Card Size**: `200×140px`
- **Internal Padding**: `20px` all sides
- **Border Radius**: `12px`
- **Border Width**: `3px solid`

### Typography Hierarchy

#### Card Title
- **Size**: `14px/20px` (mobile), `16px/24px` (tablet+)
- **Weight**: `500` (medium)
- **Color**: Theme text color (`#6B7280` light, `#F3F4F6` dark)
- **Letter Spacing**: `0em`

#### Count Display
- **Size**: `32px/36px` (mobile), `36px/40px` (tablet), `40px/44px` (desktop)
- **Weight**: `700` (bold)
- **Color**: Theme emphasis color (`#374151` light, `#E5E7EB` dark)
- **Letter Spacing**: `-0.02em`

#### Description Text
- **Size**: `12px/16px` (mobile), `14px/20px` (tablet+)
- **Weight**: `400` (regular)
- **Color**: Theme secondary color (`#9CA3AF` light, `#9CA3AF` dark)
- **Letter Spacing**: `0em`

### Icon Specifications
- **Size**: `20×20px` (mobile), `24×24px` (tablet+)
- **Position**: `8px` margin from title text
- **Color**: Matches title color for consistency
- **Accessibility**: Always includes descriptive label

## Traffic Light Color Specifications

### Critical Items Card
```typescript
{
  statusType: 'critical',
  borderColor: '#DC2626',           // Critical Red
  icon: AlertTriangleIcon,
  title: 'Critical Items',
  description: 'Items need attention soon',
  // Supportive messaging to reduce panic
}
```

### Low Stock Card  
```typescript
{
  statusType: 'low',
  borderColor: '#D97706',           // Low Stock Amber
  icon: ClockIcon,
  title: 'Low Stock',
  description: 'Plan to restock these items',
  // Proactive planning messaging
}
```

### Well Stocked Card
```typescript
{
  statusType: 'stocked',
  borderColor: '#059669',           // Well Stocked Green
  icon: CheckCircleIcon,
  title: 'Well Stocked',
  description: 'You\'re prepared!',
  // Confidence building messaging
}
```

### Pending Orders Card
```typescript
{
  statusType: 'pending',
  borderColor: '#0891B2',           // Pending Orders Blue
  icon: PackageIcon,
  title: 'Pending Orders', 
  description: 'Help is on the way',
  // Reassuring support messaging
}
```

## State Specifications

### Default State
- **Background**: Theme surface color (`#FFFFFF` light, `#1F2937` dark)
- **Border**: 3px solid traffic light color
- **Shadow**: `0px 1px 3px rgba(0, 0, 0, 0.1)` (subtle elevation)
- **Opacity**: `1.0`

### Pressed State (Touch/Click)
- **Background**: Slightly darker theme surface
- **Border**: Same traffic light color
- **Shadow**: `0px 1px 2px rgba(0, 0, 0, 0.05)` (reduced elevation)
- **Opacity**: `0.95`
- **Transform**: `scale(0.98)` (subtle feedback)
- **Duration**: `100ms ease-out`

### Hover State (Desktop/Tablet)
- **Background**: `5%` darker theme surface
- **Border**: Same traffic light color  
- **Shadow**: `0px 4px 8px rgba(0, 0, 0, 0.12)` (enhanced elevation)
- **Opacity**: `1.0`
- **Transform**: `translateY(-2px)` (lift effect)
- **Duration**: `200ms ease-out`

### Focus State (Keyboard Navigation)
- **Background**: Same as default
- **Border**: 3px solid traffic light color
- **Outline**: `2px solid #0891B2` (primary blue focus ring)
- **Outline Offset**: `2px`
- **Shadow**: Enhanced hover shadow
- **Duration**: `150ms ease-out`

### Loading State
- **Background**: Theme surface with `0.6` opacity
- **Border**: Traffic light color with `0.4` opacity
- **Content**: Skeleton animation on count display
- **Icon**: Spinning loading indicator
- **Interaction**: Disabled (not clickable)

### Disabled State
- **Background**: Theme surface with `0.3` opacity
- **Border**: Neutral gray `#D1D5DB` instead of traffic light color
- **Text**: All text colors with `0.4` opacity
- **Icon**: Icon color with `0.4` opacity
- **Interaction**: Not clickable, no hover/focus states

## Responsive Layout System

### Mobile Grid (2×2 Layout)
```typescript
const mobileCardStyles = {
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 16,
    gap: 16,
  },
  card: {
    width: '47%',  // Allows for 2 cards per row with gap
    aspectRatio: 1.3,  // 156×120px approximate ratio
  }
};
```

### Tablet/Desktop Grid (4×1 Layout)
```typescript
const tabletCardStyles = {
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between', 
    paddingHorizontal: 32,
    gap: 24,
  },
  card: {
    flex: 1,  // Equal width distribution
    maxWidth: 200,  // Maximum card width
    minWidth: 160,  // Minimum card width
  }
};
```

## Accessibility Implementation

### Screen Reader Support
```typescript
// Comprehensive accessibility props example
<StatusOverviewCard
  accessibilityLabel={`${title}: ${count} items. ${description}`}
  accessibilityHint="Tap to view detailed breakdown"
  accessibilityRole="button"
  accessible={true}
  // Icon accessibility
  icon={(props) => (
    <AlertTriangleIcon 
      {...props} 
      accessibilityLabel="Warning indicator"
    />
  )}
/>
```

### Keyboard Navigation
- **Tab Order**: Cards follow logical reading order (left-to-right, top-to-bottom)
- **Enter/Space**: Activates card press action
- **Focus Indicators**: Clear blue outline with 2px offset
- **Skip Links**: Available for users to bypass card grid

### Color Independence
All status information communicated through multiple channels:
1. **Border Color**: Traffic light visual indicator
2. **Icon**: Semantic status symbol  
3. **Text**: Descriptive title and messaging
4. **Screen Reader**: Comprehensive audio description

## Animation & Micro-Interactions

### Entry Animation
```typescript
const cardEntryAnimation = {
  from: {
    opacity: 0,
    transform: [{ translateY: 20 }, { scale: 0.95 }],
  },
  to: {
    opacity: 1,
    transform: [{ translateY: 0 }, { scale: 1 }],
  },
  duration: 300,
  easing: 'ease-out',
  delay: (index: number) => index * 50, // Stagger effect
};
```

### Status Change Animation
```typescript
const statusChangeAnimation = {
  borderColor: {
    duration: 400,
    easing: 'ease-in-out',
  },
  count: {
    from: { scale: 1.2 },
    to: { scale: 1 },
    duration: 200,
    easing: 'ease-out',
  }
};
```

### Loading Animation
```typescript
const loadingAnimation = {
  skeleton: {
    from: { opacity: 0.3 },
    to: { opacity: 0.7 },
    duration: 1000,
    repeat: true,
    direction: 'alternate',
  },
  spinner: {
    from: { rotate: '0deg' },
    to: { rotate: '360deg' },
    duration: 1000,
    repeat: true,
  }
};
```

## Implementation Examples

### Basic Usage
```typescript
import { StatusOverviewCard } from '@/components/cards/StatusOverviewCard';
import { AlertTriangleIcon } from '@/components/icons';

function DashboardTrafficLight() {
  return (
    <View style={styles.cardGrid}>
      <StatusOverviewCard
        statusType="critical"
        title="Critical Items"
        count={3}
        description="Items need attention soon"
        icon={AlertTriangleIcon}
        borderColor="#DC2626"
        onPress={() => navigateToCriticalItems()}
        accessibilityLabel="Critical items: 3 items need attention soon"
        accessibilityHint="Tap to view detailed breakdown of critical items"
      />
      {/* Additional cards... */}
    </View>
  );
}
```

### With Loading State
```typescript
<StatusOverviewCard
  statusType="critical" 
  title="Critical Items"
  count={0}
  loading={true}
  icon={AlertTriangleIcon}
  borderColor="#DC2626"
  accessibilityLabel="Loading critical items count"
/>
```

### Custom Styling
```typescript
<StatusOverviewCard
  statusType="stocked"
  title="Well Stocked"
  count={15}
  description="You're prepared!"
  icon={CheckCircleIcon}
  borderColor="#059669"
  style={{
    backgroundColor: '#F0FDF4', // Custom light green background
    shadowColor: '#059669',     // Green shadow tint
  }}
/>
```

## Testing Specifications

### Unit Tests Required
- [ ] Renders correctly with all props
- [ ] Handles loading state appropriately
- [ ] Disabled state prevents interactions
- [ ] Accessibility props are properly applied
- [ ] Color specifications match design system

### Integration Tests Required
- [ ] Responsive layout functions across breakpoints
- [ ] Keyboard navigation works correctly
- [ ] Screen reader announcements are comprehensive
- [ ] Touch interactions provide proper feedback
- [ ] Animation states transition smoothly

### Visual Regression Tests
- [ ] Default state matches design specifications
- [ ] All interactive states (hover, pressed, focus) render correctly
- [ ] Loading and disabled states display appropriately
- [ ] Color contrast ratios meet WCAG AAA standards
- [ ] Typography hierarchy is consistent across themes

## Performance Considerations

### Optimization Strategies
- **Memoization**: Component memoized to prevent unnecessary re-renders
- **Animation Performance**: Hardware-accelerated transforms only
- **Bundle Size**: Tree-shakeable icon imports
- **Memory Management**: Event listeners properly cleaned up

### Benchmarks
- **Render Time**: <16ms per card (60fps compliance)
- **Memory Usage**: <50KB per card instance
- **Animation FPS**: Consistent 60fps for all transitions
- **Bundle Impact**: <5KB per card component (gzipped)

## Last Updated
2025-09-10 - Complete StatusOverviewCard component specifications established