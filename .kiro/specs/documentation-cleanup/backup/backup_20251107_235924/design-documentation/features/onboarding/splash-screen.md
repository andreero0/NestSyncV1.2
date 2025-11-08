# Splash Screen Design Specification

## Overview
The splash screen is the first touchpoint with Canadian parents, setting the tone for a trustworthy, Canadian-made solution. It must communicate safety, reliability, and local context within 2-3 seconds.

## ASCII Wireframe

### State 1: Initial Load (0-1 second)
```ascii
┌─────────────────────────────────────────────┐
│                                             │
│                                             │
│                                             │
│                                             │
│                                             │
│                                             │
│                 NestSync                    │ ← App name (32px)
│                                             │
│                                             │
│                                             │
│                                             │
│                                             │
│                                             │
└─────────────────────────────────────────────┘
```

### State 2: Brand Reveal (1-2 seconds)
```ascii
┌─────────────────────────────────────────────┐
│                                             │
│                                             │
│                                             │
│                                             │
│                 NestSync                    │ ← App name (32px)
│                    🍁                       │ ← Maple leaf icon (48px)
│           Never run out again.              │ ← Tagline (18px)
│                                             │
│                                             │
│                                             │
│                                             │
│                                             │
│                                             │
└─────────────────────────────────────────────┘
```

### State 3: Loading Progress (2-3 seconds)
```ascii
┌─────────────────────────────────────────────┐
│                                             │
│                                             │
│                                             │
│                 NestSync                    │ ← App name (32px)
│                    🍁                       │ ← Maple leaf icon (48px)
│           Never run out again.              │ ← Tagline (18px)
│                                             │
│      Made in Canada • PIPEDA-ready          │ ← Trust indicators (14px)
│                                             │
│            [████████████░░ 80%]             │ ← Loading bar (4px height)
│                                             │
│                                             │
│                                             │
└─────────────────────────────────────────────┘
```

## Component Specifications

### Layout Structure
- **Screen**: Full screen, no status bar initially
- **Background**: Gradient from #F0F9FF (light blue) to #FFFFFF
- **Content Alignment**: Center vertical and horizontal
- **Safe Area**: Respect device safe areas for notches

### Typography
```typescript
// App Name
{
  fontFamily: 'System',
  fontSize: 32,
  fontWeight: '700',
  color: '#0891B2', // Primary blue
  letterSpacing: -0.5
}

// Tagline
{
  fontFamily: 'System',
  fontSize: 18,
  fontWeight: '400',
  color: '#374151', // Neutral-700
  marginTop: 8
}

// Trust Indicators
{
  fontFamily: 'System',
  fontSize: 14,
  fontWeight: '500',
  color: '#6B7280', // Neutral-500
  marginTop: 32
}
```

### Animation Specifications

#### Fade In Sequence
```typescript
// Using React Native Reanimated
const fadeInAnimation = {
  0: { opacity: 0, transform: [{scale: 0.95}] },
  1: { opacity: 1, transform: [{scale: 1}] },
  duration: 600,
  easing: Easing.bezier(0.4, 0, 0.2, 1)
}

// Animation timeline
const timeline = [
  { element: 'appName', startTime: 0, duration: 600 },
  { element: 'mapleLeaf', startTime: 400, duration: 600 },
  { element: 'tagline', startTime: 800, duration: 600 },
  { element: 'trustIndicators', startTime: 1200, duration: 600 },
  { element: 'loadingBar', startTime: 1600, duration: 400 }
]
```

### Loading Bar
```typescript
// NativeBase Progress component
<Progress
  value={progress}
  size="xs"
  colorScheme="primary"
  bg="gray.200"
  mx={12}
  _filledTrack={{
    bg: "primary.600"
  }}
/>
```

## Design Psychology

### Color Psychology
- **Light Blue Gradient**: Creates calm, trustworthy first impression
- **Primary Blue (#0891B2)**: Professional, reliable, medical association
- **Maple Leaf**: Immediate Canadian identity, national pride
- **White Space**: Reduces anxiety, creates breathing room

### Information Hierarchy
1. **Brand Name First**: Establishes identity
2. **Canadian Symbol**: Builds trust through national association
3. **Value Proposition**: Clear benefit statement
4. **Trust Indicators**: PIPEDA compliance for privacy-conscious parents
5. **Progress Feedback**: Reduces uncertainty during load

### Cognitive Load Management
- **Minimal Elements**: Only essential information
- **Progressive Disclosure**: Elements appear sequentially
- **Clear Messaging**: Grade 6 reading level
- **No User Action Required**: Passive experience reduces stress

## Accessibility Requirements

### Screen Reader Support
```typescript
// Accessibility labels
<View accessible={true} accessibilityRole="text">
  <Text accessibilityLabel="NestSync, Canadian diaper planning app">
    NestSync
  </Text>
  <Text accessibilityLabel="Tagline: Never run out again">
    Never run out again.
  </Text>
  <Text accessibilityLabel="Made in Canada, PIPEDA privacy compliant">
    Made in Canada • PIPEDA-ready
  </Text>
</View>

// Loading progress announcement
<Progress
  accessibilityLabel="Loading application"
  accessibilityValue={{
    min: 0,
    max: 100,
    now: progress,
    text: `${progress} percent loaded`
  }}
/>
```

### Visual Accessibility
- **Contrast Ratios**: All text maintains 4.5:1 minimum
- **Motion Sensitivity**: Respect reduced motion preferences
- **Font Scaling**: Support dynamic type sizing
- **Color Blind Safe**: Blue/white combination works for all types

## Platform Adaptations

### iOS Specific
```typescript
// iOS safe area handling
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const insets = useSafeAreaInsets();
const containerStyle = {
  paddingTop: insets.top,
  paddingBottom: insets.bottom
};
```

### Android Specific
```typescript
// Android status bar handling
import { StatusBar } from 'expo-status-bar';

<StatusBar 
  style="dark" 
  backgroundColor="#F0F9FF"
  translucent={true}
/>
```

## Performance Optimizations

### Asset Loading
```typescript
// Preload critical assets
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

const loadAssets = async () => {
  // Load fonts, images, initial data
  await Font.loadAsync({
    'brand-font': require('./assets/fonts/BrandFont.ttf')
  });
  
  // Minimum display time for brand visibility
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  SplashScreen.hideAsync();
};
```

### Memory Management
- **Lazy Loading**: Only load essential assets
- **Image Optimization**: Maple leaf as vector (SVG)
- **Gradient Performance**: Use native gradient implementation

## Error States

### Network Error During Load
```ascii
┌─────────────────────────────────────────────┐
│                                             │
│                                             │
│                 NestSync                    │
│                    🍁                       │
│           Never run out again.              │
│                                             │
│         Connection issue detected           │ ← Error message (14px)
│         App works offline too!             │ ← Reassurance (14px)
│                                             │
│            [████████████░░ 80%]             │
│                                             │
│              [Try Again]                    │ ← Retry button (48px height)
│                                             │
└─────────────────────────────────────────────┘
```

## Transition to Next Screen

### Animation Out
```typescript
const transitionOut = {
  opacity: { from: 1, to: 0, duration: 300 },
  scale: { from: 1, to: 1.05, duration: 300 },
  easing: Easing.bezier(0.4, 0, 1, 1)
};
```

### Next Screen Decision Logic
```typescript
const getNextScreen = (userState: UserState) => {
  if (!userState.hasSeenOnboarding) {
    return 'ConsentScreen';
  } else if (!userState.isAuthenticated) {
    return 'AuthenticationScreen';
  } else if (userState.children.length === 0) {
    return 'ChildProfileWizard';
  } else {
    return 'HomeScreen';
  }
};
```

## Implementation Notes

### NativeBase Theme Extension
```typescript
const splashTheme = extendTheme({
  components: {
    Text: {
      variants: {
        splash_brand: {
          fontSize: 32,
          fontWeight: 'bold',
          color: 'primary.600'
        },
        splash_tagline: {
          fontSize: 18,
          color: 'gray.700'
        }
      }
    }
  }
});
```

### Testing Considerations
1. **Load Time**: Ensure < 3 seconds on average devices
2. **Animation Performance**: 60fps on all supported devices
3. **Memory Usage**: < 50MB during splash
4. **Accessibility**: Screen reader testing required
5. **Offline Mode**: Verify offline functionality messaging

## Success Metrics
- **Time to Interactive**: < 3 seconds
- **Animation Frame Rate**: 60fps maintained
- **User Drop-off**: < 2% during splash
- **Accessibility Score**: 100% WCAG compliance
- **Error Rate**: < 0.1% failed loads

This splash screen design creates a professional, trustworthy first impression while establishing Canadian identity and PIPEDA compliance awareness from the very first interaction.