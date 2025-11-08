---
title: NestSync Component Library Overview
description: Complete component specifications with psychological methodology for stressed Canadian parents
feature: Component System
last-updated: 2025-01-21
version: 1.0.0
related-files: 
  - ../style-guide.md
  - ../tokens/colors.md
  - ../tokens/typography.md
  - ../tokens/spacing.md
dependencies:
  - NativeBase component library
  - React Native Reanimated animations
  - Expo Haptics feedback system
status: approved
---

# NestSync Component Library

## Overview

This document serves as the central hub for NestSync's component library, designed with psychological methodology specifically for stressed, sleep-deprived Canadian parents. Each component is optimized for cognitive load reduction, accessibility enhancement, and trust building through consistent, reliable interactions.

## Table of Contents

1. [Component Philosophy](#component-philosophy)
2. [Component Architecture](#component-architecture)
3. [Primary Components](#primary-components)
4. [Secondary Components](#secondary-components)
5. [Specialized Components](#specialized-components)
6. [Form Components](#form-components)
7. [Navigation Components](#navigation-components)
8. [Feedback Components](#feedback-components)
9. [Animation Standards](#animation-standards)
10. [Accessibility Standards](#accessibility-standards)
11. [Implementation Guidelines](#implementation-guidelines)

## Component Philosophy

### Psychological Design Principles

Our component library addresses the unique needs of our target user base:

- **Predictable Interactions**: Consistent behavior reduces cognitive load for tired parents
- **Forgiving Design**: Enhanced touch targets and clear error recovery patterns
- **Trust Building**: Reliable visual feedback and transparent state communication
- **Anxiety Reduction**: Calming animations and reassuring confirmation patterns
- **Efficiency Focus**: Streamlined interactions for <10 second task completion

### Design System Integration

Every component seamlessly integrates with our foundational design tokens:
- **Color System**: Primary Blue (#0891B2) for trust, Secondary Green (#059669) for wellness
- **Typography**: System font stack with enhanced accessibility sizing
- **Spacing**: 4px base unit system with psychological spacing methodology
- **Animation**: React Native Reanimated with gentle, organic motion

## Component Architecture

### NativeBase Foundation

Our components extend NativeBase functionality with:
- Enhanced accessibility features
- Psychological color applications
- Consistent animation patterns
- Canadian parent-focused microcopy

### Component Hierarchy

**Atomic Level**: Basic building blocks (Button, Input, Text)
**Molecular Level**: Combined atoms (Form Field, Card Header, Navigation Item)
**Organism Level**: Complex structures (Card, Modal, Navigation Bar)
**Template Level**: Page layouts and major structural elements

## Primary Components

### Primary Button

**Purpose**: Main call-to-action element for critical user interactions
**Psychology**: Builds confidence through reliable feedback and prominent visual presence

#### Visual Specifications
- **Height**: 48px (12 spacing units) - exceeds accessibility minimums
- **Padding**: 16px horizontal, 12px vertical for comfortable touch area
- **Border Radius**: 8px (rounded-lg in NativeWind) for modern, friendly appearance
- **Typography**: Medium weight (500), 16px for clear readability
- **Minimum Width**: 120px ensures adequate touch target
- **Background**: Primary Blue (#0891B2) for trustworthy authority

#### State Specifications
- **Default**: Primary blue background, white text, subtle shadow for elevation
- **Hover**: Primary dark blue (#0E7490), increased elevation (2dp)
- **Active**: Primary dark blue, scale 0.95 with haptic feedback for physical response
- **Focus**: 4px primary blue outline ring for accessibility compliance
- **Disabled**: Neutral-300 background, Neutral-500 text, 0.6 opacity
- **Loading**: Spinner overlay with disabled interaction, progress indication

#### Psychological Rationale
- Large size reduces miss-tap anxiety for tired parents
- Blue color builds medical/institutional trust
- Consistent feedback patterns build confidence over time
- Clear disabled states prevent frustration

```typescript
// NativeBase Implementation
<Button 
  colorScheme="primary" 
  size="lg"
  _pressed={{
    bg: "primary.600",
    transform: [{ scale: 0.95 }]
  }}
  _disabled={{
    bg: "gray.300",
    opacity: 0.6,
    _text: { color: "gray.500" }
  }}
  _focus={{
    _web: {
      boxShadow: "0 0 0 4px rgba(8, 145, 178, 0.3)"
    }
  }}
>
  Primary Action
</Button>
```

### Secondary Button

**Purpose**: Supporting actions that complement primary interactions
**Psychology**: Clear hierarchy without visual competition

#### Visual Specifications
- **Height**: 48px (matching primary for consistency)
- **Border**: 1px solid primary blue for clear definition
- **Background**: Transparent to reduce visual weight
- **Typography**: Medium weight (500), 16px, primary blue text
- **Padding**: 16px horizontal, 12px vertical

#### State Specifications
- **Default**: Transparent background, primary blue border and text
- **Hover**: Neutral-50 background, maintains blue border/text
- **Active**: Neutral-100 background, scale 0.98, haptic feedback
- **Focus**: 4px primary blue outline ring
- **Disabled**: Neutral-200 border, Neutral-400 text, 0.6 opacity

#### Psychological Rationale
- Lower visual weight maintains focus on primary actions
- Consistent sizing prevents hierarchy confusion
- Blue text maintains brand trust association
- Clear secondary priority for stressed decision-makers

```typescript
<Button 
  variant="outline"
  colorScheme="primary"
  size="lg"
  _pressed={{
    bg: "gray.100",
    transform: [{ scale: 0.98 }]
  }}
>
  Secondary Action
</Button>
```

### Time Chip Component (Custom)

**Purpose**: Eliminates typing for 90% of time selection use cases
**Psychology**: Reduces cognitive load through preset options with immediate visual feedback

#### Visual Specifications
- **Height**: 44px minimum touch target compliance
- **Width**: Auto-sizing with 60px minimum for comfortable interaction
- **Padding**: 12px horizontal, 10px vertical for balanced proportion
- **Border Radius**: 22px (fully rounded pill shape) for playful, friendly feel
- **Typography**: Medium weight (500), 14px for clear option identification

#### State Variations
- **Unselected**: Neutral-100 background, Neutral-600 text for clear availability
- **Selected**: Primary blue background, white text for definitive confirmation
- **Hover**: Neutral-200 background (unselected state) for interaction preview
- **Active**: Scale 1.05 then 1.0 with haptic feedback for satisfying response

#### Animation Specifications
- **Transition**: Spring animation (tension: 300, friction: 20) for organic feel
- **Duration**: 200ms for immediate but smooth feedback
- **Easing**: Natural spring physics, not mechanical linear transitions

#### Usage Psychology
- Preset options eliminate decision paralysis
- Visual selection state provides immediate confirmation
- Reduces typing errors and input validation needs
- Familiar pattern from iOS/Android time pickers

```typescript
// Custom Badge Implementation
<Badge 
  colorScheme={selected ? "primary" : "gray"} 
  variant={selected ? "solid" : "outline"}
  rounded="full"
  px={3}
  py={2}
  onPress={handleSelection}
>
  Now
</Badge>
```

## Secondary Components

### Floating Action Button (FAB)

**Purpose**: Always-accessible primary action button for critical tasks
**Psychology**: Reduces navigation depth for essential parent functions

#### Visual Specifications
- **Size**: 56px diameter (14 spacing units) for comfortable thumb reach
- **Position**: 24px from bottom and right edges for thumb accessibility
- **Background**: Primary blue gradient for visual prominence
- **Shadow**: 8dp elevation equivalent for clear separation from content
- **Icon Size**: 24px white icon for clear recognition
- **Border Radius**: 28px (perfect circle) for geometric harmony

#### Context-Aware Behavior
- **Home Screen**: Logging icon (pencil/edit) for quick diaper logging
- **Planner Screen**: Add/package icon for inventory management
- **Settings Screen**: Person/add user icon for family management
- **Modal States**: Transform to X/close icon for clear exit option

#### Animation Specifications
- **Entrance**: Scale from 0 to 1 over 300ms spring for confident appearance
- **Press**: Scale 0.9, rotate 15° with haptic medium for physical feedback
- **Release**: Spring back to 1.0, counter-rotate for satisfying completion
- **Context Switch**: Icon morphs over 250ms for smooth transition

#### Psychological Impact
- Always visible for reduced navigation anxiety
- Context-aware icons reduce cognitive load
- Prominent position matches importance for tired parents
- Haptic feedback provides physical confirmation

```typescript
<Fab
  renderInPortal={false}
  shadow={2}
  size="lg"
  bg="primary.500"
  onPress={handleFabPress}
  icon={<Icon as={Ionicons} name="add" size="6" />}
  _pressed={{
    transform: [{ scale: 0.9 }, { rotate: "15deg" }]
  }}
/>
```

### Card Component

**Purpose**: Content organization and information hierarchy
**Psychology**: Familiar mental model for information grouping

#### Visual Specifications
- **Padding**: 16px (4 spacing units) for comfortable content spacing
- **Border Radius**: 12px (rounded-xl) for modern, friendly appearance
- **Background**: White or Neutral-50 for content clarity
- **Shadow**: 2dp equivalent for subtle elevation
- **Border**: 1px solid Neutral-200 for clear definition

#### Content Structure Pattern
```
┌─────────────────────────────┐
│ [Icon] Title        [Action]│  ← 16px padding
│                             │
│ Content area with proper    │
│ spacing and typography      │
│                             │
│ [Secondary Action]          │  ← 16px padding
└─────────────────────────────┘
```

#### Interaction States
- **Default**: Clean appearance with subtle shadow
- **Hover**: Subtle shadow increase (2→4dp) for desktop
- **Press**: Scale 0.98, immediate haptic feedback for mobile
- **Focus**: 2px primary blue outline for accessibility

#### Psychological Benefits
- Familiar card metaphor reduces learning curve
- Clear boundaries prevent information blending
- Consistent internal spacing creates predictable information hierarchy

```typescript
<Box
  bg="white"
  p={4}
  borderRadius="xl"
  shadow={1}
  borderWidth={1}
  borderColor="gray.200"
  _pressed={{ transform: [{ scale: 0.98 }] }}
>
  <HStack justifyContent="space-between" alignItems="center" mb={3}>
    <HStack space={2} alignItems="center">
      <Icon as={Ionicons} name="time" size="md" color="primary.500" />
      <Heading size="sm">Card Title</Heading>
    </HStack>
    <IconButton
      icon={<Icon as={Ionicons} name="chevron-forward" />}
      size="sm"
      variant="ghost"
    />
  </HStack>
  
  <Text fontSize="md" color="gray.600">
    Card content with proper spacing and typography hierarchy.
  </Text>
</Box>
```

## Form Components

### Form Input Component

**Purpose**: User data collection with accessibility and error prevention
**Psychology**: Reduces form completion anxiety through clear feedback

#### Visual Specifications
- **Height**: 48px matching button height for visual consistency
- **Padding**: 12px horizontal for comfortable text entry
- **Border**: 1px solid Neutral-300 for clear definition
- **Border Radius**: 8px matching button radius
- **Typography**: Regular weight (400), 16px for optimal readability
- **Background**: White for content clarity

#### State Specifications
- **Default**: Neutral border, white background, clear placeholder
- **Focus**: Primary blue border, primary light background tint
- **Error**: Error red border, error light background, clear error message
- **Success**: Success green border, success light background
- **Disabled**: Neutral-100 background, Neutral-400 text, clear unavailability

#### Label Integration Strategy
- **Position**: Above input with 8px margin for clear association
- **Typography**: Medium weight (500), 14px, Neutral-700 for hierarchy
- **Required Indicator**: Red asterisk plus "required" text, never color-only
- **Error Message**: Below input, error red, clear guidance for resolution

#### Accessibility Enhancements
- ARIA labels for screen readers
- Error state announcements
- Focus management for form navigation
- High contrast mode compatibility

```typescript
<FormControl isInvalid={hasError} isRequired>
  <FormControl.Label>
    <Text fontSize="sm" fontWeight="500" color="gray.700">
      Child's Name
    </Text>
  </FormControl.Label>
  
  <Input
    size="lg"
    fontSize="md"
    borderColor="gray.300"
    _focus={{
      borderColor: "primary.500",
      bg: "primary.50"
    }}
    _invalid={{
      borderColor: "error.500",
      bg: "error.50"
    }}
    placeholder="Enter child's name"
  />
  
  <FormControl.ErrorMessage>
    <Text fontSize="sm" color="error.500">
      This field is required for personalized tracking
    </Text>
  </FormControl.ErrorMessage>
</FormControl>
```

## Navigation Components

### Tab Bar Navigation

**Purpose**: Primary app navigation with platform-appropriate patterns
**Psychology**: Familiar navigation reduces cognitive overhead

#### Design Specifications
- **Height**: 84px total (50px content + 34px safe area) for iOS
- **Item Size**: 44x44px minimum touch targets
- **Active Color**: Primary blue for clear current state
- **Inactive Color**: Neutral-400 for clear hierarchy
- **Background**: White with subtle shadow for definition

#### Platform Adaptations
- **iOS**: Tab bar at bottom with safe area handling
- **Android**: Bottom navigation with Material Design principles
- **Icons**: Platform-appropriate symbol sets (SF Symbols vs Material Icons)

### Navigation Bar

**Purpose**: Screen-level navigation with context and actions
**Psychology**: Clear orientation and available actions

#### Visual Specifications
- **Height**: Platform-specific safe heights
- **Title**: H2 typography (28px, Semibold)
- **Back Button**: Accessible target with platform-appropriate styling
- **Action Buttons**: 44x44px minimum with clear iconography

## Feedback Components

### Loading States

**Purpose**: Progress communication during data operations
**Psychology**: Reduces abandonment anxiety through clear progress indication

#### Loading Patterns
- **Skeleton Screens**: Content shape preview for predictable loading
- **Spinners**: Indeterminate progress for quick operations
- **Progress Bars**: Determinate progress for longer operations
- **Shimmer Effects**: Subtle animation suggesting active loading

```typescript
<VStack space={4}>
  <Skeleton.Text lines={3} />
  <Skeleton height="40px" rounded="md" />
  <HStack space={4}>
    <Skeleton size="12" rounded="full" />
    <Skeleton.Text flex={1} lines={2} />
  </HStack>
</VStack>
```

### Toast Messages

**Purpose**: Non-intrusive feedback for user actions
**Psychology**: Confirmation without interrupting user flow

#### Message Types
- **Success**: Green accent, checkmark icon, positive confirmation
- **Error**: Red accent, warning icon, clear guidance for resolution
- **Info**: Blue accent, info icon, helpful context
- **Warning**: Amber accent, caution icon, attention without panic

## Animation Standards

### React Native Reanimated Integration

**Spring Configuration**:
```typescript
const springConfig = {
  tension: 300,
  friction: 20,
  useNativeDriver: true
};

const gentleSpring = {
  tension: 200,
  friction: 25,
  useNativeDriver: true
};
```

### Duration Standards
- **Micro (100-150ms)**: State changes, hover effects
- **Short (200-300ms)**: Component interactions, local transitions
- **Medium (350-500ms)**: Screen transitions, major state changes
- **Long (600-800ms)**: Onboarding flows, ceremonial moments

### Reduced Motion Support
```typescript
import { AccessibilityInfo } from 'react-native';

const [reduceMotion, setReduceMotion] = useState(false);

useEffect(() => {
  AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
}, []);

const animationDuration = reduceMotion ? 0 : 300;
```

## Accessibility Standards

### Enhanced WCAG Compliance

**Target**: WCAG 2.1 AAA where possible, AA minimum
**Special Considerations**: Sleep-deprived parents with reduced fine motor control

### Universal Design Principles
- **Touch Targets**: 48x48px for primary, 44x44px for secondary
- **Color Independence**: Never rely on color alone for meaning
- **Screen Reader**: Comprehensive ARIA labeling and semantic structure
- **Keyboard Navigation**: Complete keyboard accessibility with logical tab order
- **Dynamic Type**: Support for 200% font scaling
- **High Contrast**: Compatibility with system accessibility settings

### Implementation Checklist
- [ ] All interactive elements have accessible labels
- [ ] Color contrast ratios meet enhanced standards (7:1 for critical elements)
- [ ] Touch targets exceed minimum requirements
- [ ] Screen reader navigation is logical and complete
- [ ] Keyboard navigation reaches all functionality
- [ ] Error states provide clear recovery guidance

## Implementation Guidelines

### Component Development Standards

**File Structure**:
```
components/
├── Button/
│   ├── Button.tsx
│   ├── Button.stories.tsx
│   ├── Button.test.tsx
│   └── index.ts
```

**TypeScript Interface Pattern**:
```typescript
interface ButtonProps extends PressableProps {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactElement;
  rightIcon?: React.ReactElement;
  children: React.ReactNode;
}
```

**Testing Requirements**:
- Unit tests for all component logic
- Accessibility testing with react-native-testing-library
- Visual regression testing for design consistency
- Performance testing for animation smoothness

### Design Token Integration

**Color Usage**:
```typescript
import { useTheme } from 'native-base';

const theme = useTheme();
const primaryColor = theme.colors.primary[500]; // #0891B2
```

**Spacing Application**:
```typescript
<Box p={4} m={2}> {/* 16px padding, 8px margin */}
  Content
</Box>
```

**Typography Integration**:
```typescript
<Text fontSize="lg" fontWeight="500">
  Component Text
</Text>
```

---

This component library serves as the foundation for all user interface elements in NestSync, ensuring psychological appropriateness for stressed Canadian parents while maintaining technical excellence and accessibility standards that exceed industry requirements. Each component contributes to building trust, reducing cognitive load, and supporting efficient task completion in critical childcare scenarios.