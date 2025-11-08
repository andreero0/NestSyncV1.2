# Core Navigation System - Feature Design Brief

Three-screen navigation architecture with context-aware FAB designed specifically for stressed Canadian parents managing diaper planning workflows.

---
title: Core Navigation System Design
description: Three-screen + FAB architecture optimized for stressed parent workflows
feature: Core Navigation
last-updated: 2025-01-21
version: 1.0.0
related-files: 
  - screen-states.md
  - user-journey.md
  - interactions.md
dependencies:
  - React Navigation v6
  - NativeBase bottom tab navigator
  - Context-aware FAB system
status: approved
---

## Feature Overview

### Navigation Philosophy

The core navigation system employs a **three-screen + FAB architecture** designed to minimize cognitive load while maximizing efficiency for stressed parents:

1. **Home Screen**: Current status dashboard for immediate situational awareness
2. **Planner Screen**: Future-focused timeline and recommendations
3. **Settings Screen**: Account management and privacy controls
4. **Context-Aware FAB**: Primary actions that change based on current context

### Psychological Design Rationale

**Cognitive Load Reduction**:
- Maximum 3 primary navigation options prevents decision paralysis
- FAB eliminates need to navigate for primary actions
- Consistent bottom navigation reduces spatial memory requirements

**Stress Mitigation**:
- Home screen provides immediate reassurance ("everything is okay")
- Clear visual hierarchy guides attention to most important information
- Progressive disclosure keeps advanced features available but not overwhelming

**Efficiency Optimization**:
- Primary actions (logging) accessible from any screen via FAB
- Context awareness means FAB always shows most relevant action
- Bottom navigation always visible for rapid screen switching

## User Journey Analysis

### Primary User Goal: Monitor Diaper Supply Status

**Sarah (Overwhelmed New Mom) Journey**:
1. **Entry**: Opens app to quick check diaper status
2. **Home Screen**: Immediately sees "3 days of cover remaining"
3. **Comfort**: Visual indicators show everything is manageable
4. **Action**: If needed, FAB provides instant logging access
5. **Exit**: Confident about current status, reduced anxiety

**Mike (Efficiency Dad) Journey**:
1. **Entry**: Opens app for comprehensive supply planning
2. **Home Screen**: Gets high-level status overview
3. **Planner Screen**: Switches to detailed timeline and predictions
4. **Data Analysis**: Reviews usage patterns and upcoming needs
5. **Action**: Uses recommendations to make purchase decisions

### Secondary Goal: Log Diaper Change Quickly

**Universal Quick Log Journey**:
1. **Any Screen**: Taps FAB (always visible)
2. **Quick Modal**: Time chips eliminate typing (Now/1h/2h)
3. **Type Selection**: Large touch targets for wet/soiled/both
4. **Confirmation**: Haptic feedback + status update
5. **Completion**: <10 seconds from tap to completion

## Information Architecture

### Screen Hierarchy & Purpose

```
NestSync App
├── Home (Tab 1) - Current Status
│   ├── Child Selector (Premium: multiple children)
│   ├── Days of Cover (Prominent display)
│   ├── Status Indicators (Visual health check)
│   ├── Recent Activity (Last 3-5 logs)
│   └── Quick Recommendations
│
├── Planner (Tab 2) - Future Planning
│   ├── Usage Timeline (Weekly/Monthly view)
│   ├── Predictions (Size changes, reorder points)
│   ├── Inventory Management (Current stock levels)
│   └── Purchase Recommendations
│
└── Settings (Tab 3) - Account & Privacy
    ├── Account Information
    ├── Child Management
    ├── Privacy Controls (🇨🇦 Canadian focus)
    ├── Notification Preferences
    └── Premium Features
```

### Context-Aware FAB Actions

**Home Screen FAB**: 📝 Log Change
- **Icon**: Pencil/edit icon
- **Action**: Opens quick logging modal
- **Psychology**: Primary action immediately available

**Planner Screen FAB**: 📦 Add Inventory
- **Icon**: Package/plus icon  
- **Action**: Add inventory or create manual reorder
- **Psychology**: Planning-focused action for planning screen

**Settings Screen FAB**: 👥 Add/Share
- **Icon**: Person/share icon
- **Action**: Add child (premium) or share access
- **Psychology**: Management action for management screen

## Screen Design Specifications

### Bottom Tab Navigation

**Visual Specifications**:
- **Height**: 80px (includes safe area)
- **Background**: White with 1px top border (Neutral-200)
- **Active State**: Primary blue icon + text
- **Inactive State**: Neutral-400 icon + text
- **Typography**: 12px, Medium weight
- **Safe Area**: Automatic iOS/Android handling

**Tab Specifications**:
```
Tab 1: Home
- Icon: House/home (24px)
- Label: "Home"
- Badge: Red dot for critical alerts

Tab 2: Planner  
- Icon: Calendar/timeline (24px)
- Label: "Planner"
- Badge: Orange dot for attention needed

Tab 3: Settings
- Icon: Gear/cog (24px)  
- Label: "Settings"
- Badge: None (no alerting function)
```

**NativeBase Implementation**:
```typescript
<Tab.Navigator
  screenOptions={{
    tabBarActiveTintColor: '#0891B2',
    tabBarInactiveTintColor: '#9CA3AF',
    tabBarStyle: {
      height: 80,
      paddingBottom: 8,
      paddingTop: 8,
    },
    tabBarLabelStyle: {
      fontSize: 12,
      fontWeight: '500',
    },
  }}
>
```

### Floating Action Button (FAB)

**Visual Specifications**:
- **Size**: 56px diameter
- **Position**: 24px from bottom-right (above tab bar)
- **Background**: Linear gradient (Primary blue to Primary blue dark)
- **Shadow**: 8dp elevation equivalent
- **Icon**: 24px white icon, context-dependent
- **Border Radius**: 28px (perfect circle)

**Animation Specifications**:
- **Entrance**: Scale from 0 to 1, 300ms spring
- **Context Change**: Icon morph animation, 250ms
- **Press**: Scale 0.9 + 15° rotation, haptic medium
- **Release**: Spring back with counter-rotation

**React Native Reanimated Implementation**:
```typescript
const fabScale = useSharedValue(1);
const fabRotation = useSharedValue(0);

const animatedStyle = useAnimatedStyle(() => ({
  transform: [
    { scale: fabScale.value },
    { rotate: `${fabRotation.value}deg` }
  ]
}));

const handlePress = () => {
  fabScale.value = withSpring(0.9);
  fabRotation.value = withSpring(15, {}, () => {
    fabScale.value = withSpring(1);
    fabRotation.value = withSpring(0);
  });
  
  // Haptic feedback
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
};
```

## Responsive Design Adaptations

### Mobile Portrait (375px - 414px)

**Standard Layout**:
- Full-width screens with 16px margins
- Bottom tab navigation prominent
- FAB positioned for thumb accessibility
- Single-column content organization

### Mobile Landscape (667px - 812px width)

**Adapted Layout**:
- Maintained bottom navigation (familiar pattern)
- FAB repositioned for landscape thumb reach
- Content flows horizontally where appropriate
- Reduced vertical spacing to maximize content

### Tablet (768px+)

**Enhanced Layout**:
- Consider master-detail view for Planner screen
- FAB positioned for tablet interaction patterns
- Expanded content area with improved spacing
- Side navigation consideration for larger screens

## Accessibility Specifications

### Navigation Accessibility

**Screen Reader Support**:
```typescript
// Tab navigation accessibility
<Tab.Screen 
  name="Home"
  options={{
    tabBarAccessibilityLabel: "Home tab, current status",
    tabBarAccessibilityHint: "View current diaper supply status"
  }}
/>

// FAB accessibility
<Pressable
  accessibilityRole="button"
  accessibilityLabel={getFABLabel(currentScreen)}
  accessibilityHint={getFABHint(currentScreen)}
  accessibilityState={{ disabled: isLoading }}
>
```

**Keyboard Navigation**:
- Tab key moves between navigation elements
- Arrow keys navigate between tabs
- Enter/Space activates selected element
- Focus indicators clearly visible

**Voice Control Support**:
- "Go to Home" - Navigate to home screen
- "Open Planner" - Navigate to planner screen
- "Open Settings" - Navigate to settings screen
- "Add log entry" - Activate FAB from any screen

### Enhanced Touch Targets

**Minimum Sizes**:
- Tab areas: 48x80px (exceeds 44x44px minimum)
- FAB: 56px diameter (exceeds minimum requirements)
- All interactive elements: 44px minimum dimension

**Spacing Requirements**:
- 8px minimum between interactive elements
- FAB positioned with 24px clearance from tab bar
- Tab elements have built-in separation

## Performance Considerations

### Navigation Performance

**Lazy Loading**:
```typescript
// Lazy load non-critical screens
const PlannerScreen = lazy(() => import('./screens/PlannerScreen'));
const SettingsScreen = lazy(() => import('./screens/SettingsScreen'));

// Home screen loads immediately (critical path)
import HomeScreen from './screens/HomeScreen';
```

**State Preservation**:
- Tab navigation preserves screen state
- Form data maintained during tab switches
- Scroll positions remembered across navigation
- Background data refresh for non-active screens

**Animation Performance**:
- Hardware acceleration for all FAB animations
- 60fps minimum for navigation transitions
- Optimized icon morphing for context changes
- Gesture handler integration for smooth interactions

## Error Handling & Edge Cases

### Network Connectivity

**Offline State Indicators**:
- Subtle offline indicator in navigation bar
- FAB functionality maintained (offline logging)
- Clear sync status communication
- Graceful degradation of network-dependent features

**Error Recovery**:
- Navigation remains functional during errors
- Clear error boundaries for each screen
- Fallback content for failed data loads
- Retry mechanisms integrated into navigation

### Empty States

**First-Time User**:
- Home screen shows onboarding prompts
- Planner screen explains future functionality
- Settings screen guides through setup
- FAB provides access to initial actions

**No Data States**:
- Encouraging messaging with clear next steps
- Action-oriented empty state designs
- FAB remains primary path to add content
- Contextual help for each screen's purpose

## Integration Points

### State Management

**Navigation State**:
```typescript
interface NavigationState {
  currentScreen: 'home' | 'planner' | 'settings';
  fabAction: 'log' | 'add' | 'share';
  tabBadges: {
    home: 'critical' | 'warning' | 'none';
    planner: 'attention' | 'none';
  };
}
```

**Context Awareness**:
- FAB action determined by current screen + user state
- Badge visibility based on data conditions
- Navigation hints based on user progress
- Deep linking support for external notifications

### API Integration

**Real-Time Updates**:
- Tab badges update based on server data
- Navigation state synced across devices
- Notification integration with navigation
- Background refresh triggers navigation updates

This core navigation system provides the foundation for all user interactions in NestSync, optimized specifically for the cognitive and emotional needs of stressed Canadian parents while maintaining technical excellence and accessibility standards.