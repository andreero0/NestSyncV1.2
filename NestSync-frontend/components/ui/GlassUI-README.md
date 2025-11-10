# Glass UI Design System

iOS 18-style glassmorphism design system for NestSync. This document provides comprehensive guidance on using the glass UI design tokens, context, and components.

## Overview

The Glass UI design system provides:
- **Design Tokens**: Standardized blur, opacity, tint, border, and shadow values
- **Context Provider**: Global glass UI state management with platform detection
- **Component Presets**: Pre-configured settings for common use cases
- **Platform Adaptation**: Automatic optimization for iOS, Android, and Web

## Quick Start

### 1. Install Dependencies

expo-blur is already installed in the project:
```json
"expo-blur": "~15.0.7"
```

### 2. Wrap Your App with GlassUIProvider

```tsx
// app/_layout.tsx
import { GlassUIProvider } from '@/contexts/GlassUIContext';

export default function RootLayout() {
  return (
    <GlassUIProvider>
      <Stack>
        {/* Your screens */}
      </Stack>
    </GlassUIProvider>
  );
}
```

### 3. Use Glass UI in Components

```tsx
import { useGlassUI } from '@/contexts/GlassUIContext';
import { GlassUIPresets } from '@/constants/GlassUI';
import { BlurView } from 'expo-blur';

function MyCard() {
  const { theme, isSupported } = useGlassUI();
  
  if (!isSupported || !theme.enabled) {
    return <StandardCard />;
  }
  
  return (
    <BlurView 
      intensity={GlassUIPresets.card.blur}
      tint="light"
      style={styles.card}
    >
      <Text>Glass UI Card</Text>
    </BlurView>
  );
}
```

## Design Tokens

### Blur Intensity

Controls the frosted glass effect strength:

```typescript
import { GlassUITokens } from '@/constants/GlassUI';

GlassUITokens.blur.light    // 10 - Subtle blur for cards
GlassUITokens.blur.medium   // 20 - Standard blur for navigation
GlassUITokens.blur.heavy    // 40 - Strong blur for modals
GlassUITokens.blur.intense  // 80 - Maximum blur for special effects
```

### Opacity Levels

Controls background transparency:

```typescript
GlassUITokens.opacity.subtle  // 0.7 - Maximum transparency
GlassUITokens.opacity.medium  // 0.8 - Balanced transparency
GlassUITokens.opacity.strong  // 0.9 - Minimal transparency
```

### Tint Colors

Subtle color overlays for depth:

```typescript
GlassUITokens.tint.light    // White tint for light backgrounds
GlassUITokens.tint.dark     // Black tint for dark backgrounds
GlassUITokens.tint.primary  // NestSync blue tint for emphasis
```

### Border Properties

Defines glass element edges:

```typescript
GlassUITokens.border.width           // 1
GlassUITokens.border.color.light     // rgba(255, 255, 255, 0.2)
GlassUITokens.border.color.dark      // rgba(255, 255, 255, 0.1)
```

### Shadow Properties

Adds depth and elevation:

```typescript
GlassUITokens.shadow.color      // rgba(0, 0, 0, 0.1)
GlassUITokens.shadow.offset     // { width: 0, height: 4 }
GlassUITokens.shadow.radius     // 12
GlassUITokens.shadow.elevation  // 4 (Android)
```

## Component Presets

Pre-configured combinations for common use cases:

### Navigation Preset

For headers, tab bars, and navigation elements:

```typescript
import { GlassUIPresets } from '@/constants/GlassUI';

GlassUIPresets.navigation
// {
//   blur: 20,
//   opacity: 0.9,
//   tint: 'rgba(255, 255, 255, 0.1)'
// }
```

**Use Cases:**
- Stack.Screen headers
- Tab navigator bars
- Navigation buttons
- Back buttons

### Card Preset

For content cards and containers:

```typescript
GlassUIPresets.card
// {
//   blur: 10,
//   opacity: 0.7,
//   tint: 'rgba(255, 255, 255, 0.1)'
// }
```

**Use Cases:**
- Dashboard cards
- Inventory items
- List items
- Content containers

### Modal Preset

For modals, overlays, and dialogs:

```typescript
GlassUIPresets.modal
// {
//   blur: 40,
//   opacity: 0.9,
//   tint: 'rgba(0, 0, 0, 0.1)'
// }
```

**Use Cases:**
- Modal dialogs
- Bottom sheets
- Confirmation dialogs
- Full-screen overlays

### Button Preset

For interactive buttons and CTAs:

```typescript
GlassUIPresets.button
// {
//   blur: 20,
//   opacity: 0.8,
//   tint: 'rgba(8, 145, 178, 0.1)'
// }
```

**Use Cases:**
- Primary buttons
- Secondary buttons
- Floating action buttons
- Interactive controls

## Context API

### GlassUIProvider

Wraps your app to provide glass UI configuration:

```tsx
<GlassUIProvider defaultTheme={{ intensity: 'medium' }}>
  <App />
</GlassUIProvider>
```

### useGlassUI Hook

Access full glass UI context:

```tsx
const { 
  theme,           // Current theme configuration
  updateTheme,     // Update theme settings
  isSupported,     // Platform blur support
  platform,        // Current platform
  isInitialized    // Initialization status
} = useGlassUI();
```

### useGlassUIEnabled Hook

Check if glass UI should be rendered:

```tsx
const glassEnabled = useGlassUIEnabled();

return glassEnabled ? <GlassView /> : <StandardView />;
```

### useGlassUIIntensity Hook

Get current intensity setting:

```tsx
const intensity = useGlassUIIntensity();
// Returns: 'light' | 'medium' | 'heavy'
```

### usePerformanceMode Hook

Get current performance mode:

```tsx
const performanceMode = usePerformanceMode();
// Returns: 'high' | 'balanced' | 'low'
```

## Platform Support

### iOS

- ✅ Full native blur support via BlurView
- ✅ All blur intensities supported
- ✅ Hardware-accelerated rendering
- ✅ iOS 18-style glass effects

```tsx
// iOS automatically uses native blur
<BlurView intensity={20} tint="light">
  <Content />
</BlurView>
```

### Android

- ⚠️ Limited native blur support
- ✅ Gradient overlay fallback
- ✅ Optimized for performance
- ✅ Material Design adaptation

```tsx
// Android uses gradient fallback
<View style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)' }}>
  <Content />
</View>
```

### Web

- ✅ CSS backdrop-filter support
- ✅ Modern browser compatibility
- ✅ Fallback for older browsers

```tsx
// Web uses CSS backdrop-filter
<div style={{ backdropFilter: 'blur(20px)' }}>
  <Content />
</div>
```

## Usage Examples

### Basic Glass Card

```tsx
import { BlurView } from 'expo-blur';
import { GlassUIPresets, GlassUITokens } from '@/constants/GlassUI';

function GlassCard({ children }) {
  return (
    <BlurView 
      intensity={GlassUIPresets.card.blur}
      tint="light"
      style={styles.card}
    >
      <View style={styles.cardContent}>
        {children}
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: GlassUITokens.border.width,
    borderColor: GlassUITokens.border.color.light,
    overflow: 'hidden',
    ...GlassUITokens.shadow,
  },
  cardContent: {
    padding: 16,
    backgroundColor: GlassUITokens.tint.light,
  },
});
```

### Glass Navigation Header

```tsx
function GlassHeader({ title, onBack }) {
  return (
    <BlurView 
      intensity={GlassUIPresets.navigation.blur}
      tint="light"
      style={styles.header}
    >
      <TouchableOpacity onPress={onBack}>
        <IconSymbol name="chevron.left" size={24} />
      </TouchableOpacity>
      <Text style={styles.title}>{title}</Text>
    </BlurView>
  );
}
```

### Glass Modal

```tsx
function GlassModal({ visible, onClose, children }) {
  return (
    <Modal visible={visible} transparent>
      <View style={styles.overlay}>
        <BlurView 
          intensity={GlassUIPresets.modal.blur}
          tint="dark"
          style={styles.modal}
        >
          {children}
        </BlurView>
      </View>
    </Modal>
  );
}
```

### Platform-Aware Glass Component

```tsx
import { Platform } from 'react-native';
import { isPlatformBlurSupported } from '@/constants/GlassUI';

function PlatformGlassCard({ children }) {
  const supportsBlur = isPlatformBlurSupported();
  
  if (Platform.OS === 'ios' && supportsBlur) {
    return (
      <BlurView intensity={20} tint="light" style={styles.card}>
        {children}
      </BlurView>
    );
  }
  
  // Fallback for Android and unsupported platforms
  return (
    <View style={[styles.card, styles.fallback]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
  },
  fallback: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
});
```

### Performance-Optimized Glass

```tsx
function PerformanceGlassCard({ children }) {
  const performanceMode = usePerformanceMode();
  const intensity = useGlassUIIntensity();
  
  // Reduce blur on low performance mode
  const blurIntensity = performanceMode === 'low' 
    ? GlassUITokens.blur.light 
    : GlassUIPresets.card.blur;
  
  return (
    <BlurView intensity={blurIntensity} tint="light">
      {children}
    </BlurView>
  );
}
```

## Accessibility Guidelines

### Contrast Requirements

All text on glass backgrounds must meet WCAG AA standards (4.5:1 minimum):

```tsx
// ✅ Good: Sufficient contrast
<BlurView intensity={10} tint="light">
  <Text style={{ color: '#374151' }}>Readable Text</Text>
</BlurView>

// ❌ Bad: Insufficient contrast
<BlurView intensity={10} tint="light">
  <Text style={{ color: '#D1D5DB' }}>Hard to Read</Text>
</BlurView>
```

### Touch Targets

All interactive glass elements must maintain 48px minimum touch targets:

```tsx
const styles = StyleSheet.create({
  glassButton: {
    minHeight: 48,
    minWidth: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
```

### Screen Reader Support

Ensure glass UI elements have proper accessibility labels:

```tsx
<BlurView 
  intensity={20}
  accessible={true}
  accessibilityLabel="Navigation header"
  accessibilityRole="header"
>
  <Text>Dashboard</Text>
</BlurView>
```

## Performance Optimization

### Reduce Blur on Scroll

```tsx
const [scrolling, setScrolling] = useState(false);

<ScrollView
  onScrollBeginDrag={() => setScrolling(true)}
  onScrollEndDrag={() => setScrolling(false)}
>
  <BlurView intensity={scrolling ? 10 : 20}>
    <Content />
  </BlurView>
</ScrollView>
```

### Memoize Glass Components

```tsx
const GlassCard = React.memo(({ children }) => (
  <BlurView intensity={20} tint="light">
    {children}
  </BlurView>
));
```

### Limit Glass Elements

```tsx
// ✅ Good: Limited glass elements
<View>
  <GlassCard>Content 1</GlassCard>
  <GlassCard>Content 2</GlassCard>
</View>

// ❌ Bad: Too many glass elements
<View>
  {items.map(item => (
    <GlassCard key={item.id}>{item.content}</GlassCard>
  ))}
</View>
```

## Testing

### Test Component

Use the GlassBlurTest component to verify blur rendering:

```tsx
import { GlassBlurTest } from '@/components/ui/GlassBlurTest';

// In your test screen
<GlassBlurTest />
```

### Visual Testing

1. Test on iOS simulator/device for native blur
2. Test on Android device for gradient fallback
3. Test on web browser for CSS backdrop-filter
4. Verify contrast ratios with accessibility tools
5. Test performance on low-end devices

## Troubleshooting

### Blur Not Rendering on iOS

1. Verify expo-blur is installed: `npm list expo-blur`
2. Check BlurView import: `import { BlurView } from 'expo-blur'`
3. Ensure overflow is set to 'hidden' on parent
4. Test on physical device, not just simulator

### Performance Issues

1. Reduce blur intensity: Use `light` instead of `heavy`
2. Limit number of glass elements on screen
3. Enable performance mode: `updateTheme({ performanceMode: 'low' })`
4. Use memoization for static glass components

### Android Gradient Fallback

Android uses gradient overlay instead of blur:

```tsx
// Automatically handled by platform detection
const supportsBlur = isPlatformBlurSupported();

if (!supportsBlur) {
  // Use gradient fallback
  return <View style={styles.gradientFallback} />;
}
```

## Best Practices

1. **Use Presets**: Start with component presets before customizing
2. **Test on Devices**: Always test on physical devices, not just simulators
3. **Check Accessibility**: Verify contrast ratios and touch targets
4. **Optimize Performance**: Limit glass elements and use appropriate blur intensity
5. **Platform Awareness**: Handle platform differences gracefully
6. **Consistent Styling**: Use design tokens for consistency
7. **Document Usage**: Add comments explaining glass UI choices

## Resources

- [expo-blur Documentation](https://docs.expo.dev/versions/latest/sdk/blur-view/)
- [iOS 18 Design Guidelines](https://developer.apple.com/design/)
- [Material Design Glass](https://m3.material.io/)
- [WCAG Accessibility Standards](https://www.w3.org/WAI/WCAG21/quickref/)

## Support

For questions or issues with the Glass UI design system:
1. Check this README for usage examples
2. Review the design tokens in `constants/GlassUI.ts`
3. Test with `GlassBlurTest` component
4. Consult the design document at `.kiro/specs/glass-ui-implementation/design.md`
