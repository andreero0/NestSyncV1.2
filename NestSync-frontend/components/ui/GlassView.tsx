/**
 * GlassView Component
 * 
 * Base glass UI component with platform-specific blur implementations.
 * Provides iOS 18-style glassmorphism with automatic platform adaptation.
 * 
 * Features:
 * - Native blur on iOS via expo-blur
 * - Gradient fallback on Android
 * - CSS backdrop-filter on Web
 * - Preset support for common use cases
 * - Performance optimization
 * - Accessibility compliance
 * 
 * @example
 * ```tsx
 * // Using preset
 * <GlassView preset="card">
 *   <Text>Content</Text>
 * </GlassView>
 * 
 * // Custom configuration
 * <GlassView intensity={20} tint="light">
 *   <Text>Content</Text>
 * </GlassView>
 * ```
 */

import React from 'react';
import { View, StyleSheet, Platform, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { 
  GlassUITokens, 
  GlassUIPresets, 
  GlassUIPresetName,
  getPlatformBlurIntensity,
  isPlatformBlurSupported 
} from '@/constants/GlassUI';
import { useGlassUI } from '@/contexts/GlassUIContext';

/**
 * Blur Tint Types
 * 
 * Controls the color tint of the blur effect.
 * - light: White tint for light backgrounds
 * - dark: Black tint for dark backgrounds
 * - default: System default tint
 */
export type BlurTint = 'light' | 'dark' | 'default';

/**
 * GlassView Props
 */
export interface GlassViewProps {
  /** Child components to render inside glass view */
  children: React.ReactNode;
  
  /** Blur intensity (0-100). Higher values create stronger blur. */
  intensity?: number;
  
  /** Blur tint color */
  tint?: BlurTint;
  
  /** Custom styles to apply to the glass view */
  style?: ViewStyle;
  
  /** Preset configuration (overrides intensity and tint) */
  preset?: GlassUIPresetName;
  
  /** Whether to apply border styling */
  withBorder?: boolean;
  
  /** Whether to apply shadow styling */
  withShadow?: boolean;
  
  /** Border radius (default: 16) */
  borderRadius?: number;
  
  /** Accessibility label */
  accessibilityLabel?: string;
  
  /** Accessibility role */
  accessibilityRole?: string;
  
  /** Test ID for testing */
  testID?: string;
}

/**
 * GlassView Component
 * 
 * Renders a glass UI container with platform-appropriate blur effects.
 * Automatically adapts to platform capabilities and user preferences.
 */
export function GlassView({
  children,
  intensity = 20,
  tint = 'light',
  style,
  preset,
  withBorder = true,
  withShadow = true,
  borderRadius = 16,
  accessibilityLabel,
  accessibilityRole,
  testID,
}: GlassViewProps) {
  const { theme, isSupported, isInitialized } = useGlassUI();

  // Apply preset if provided
  const presetConfig = preset ? GlassUIPresets[preset] : null;
  const finalIntensity = presetConfig?.blur ?? intensity;
  const finalTint = tint;

  // Adjust intensity based on platform and performance mode
  const platformIntensity = getPlatformBlurIntensity(finalIntensity);
  
  // Further adjust based on performance mode
  const performanceAdjustedIntensity = React.useMemo(() => {
    if (!isInitialized) return platformIntensity;
    
    switch (theme.performanceMode) {
      case 'low':
        return Math.min(platformIntensity, GlassUITokens.blur.light);
      case 'balanced':
        return Math.min(platformIntensity, GlassUITokens.blur.medium);
      case 'high':
      default:
        return platformIntensity;
    }
  }, [platformIntensity, theme.performanceMode, isInitialized]);

  // Container styles
  const containerStyle = React.useMemo(() => [
    styles.glassContainer,
    {
      borderRadius,
      borderWidth: withBorder ? GlassUITokens.border.width : 0,
      borderColor: withBorder ? GlassUITokens.border.color.light : 'transparent',
    },
    withShadow && styles.glassShadow,
    style,
  ], [borderRadius, withBorder, withShadow, style]);

  // Overlay tint style
  const overlayStyle = React.useMemo(() => [
    styles.glassOverlay,
    {
      backgroundColor: presetConfig?.tint ?? GlassUITokens.tint.light,
    },
  ], [presetConfig]);

  // If glass UI is disabled or not supported, render fallback
  if (!isInitialized || !isSupported || !theme.enabled) {
    return (
      <View 
        style={[containerStyle, styles.fallbackContainer]}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole={accessibilityRole}
        testID={testID}
      >
        {children}
      </View>
    );
  }

  // iOS: Use native BlurView
  if (Platform.OS === 'ios') {
    return (
      <BlurView
        intensity={performanceAdjustedIntensity}
        tint={finalTint}
        style={containerStyle}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole={accessibilityRole}
        testID={testID}
      >
        <View style={overlayStyle}>
          {children}
        </View>
      </BlurView>
    );
  }

  // Android: Use gradient fallback
  if (Platform.OS === 'android') {
    return (
      <View 
        style={[containerStyle, styles.androidGlass]}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole={accessibilityRole}
        testID={testID}
      >
        {children}
      </View>
    );
  }

  // Web: Use CSS backdrop-filter (handled via style)
  if (Platform.OS === 'web') {
    return (
      <View 
        style={[containerStyle, styles.webGlass]}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole={accessibilityRole}
        testID={testID}
      >
        {children}
      </View>
    );
  }

  // Fallback for other platforms
  return (
    <View 
      style={[containerStyle, styles.fallbackContainer]}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      testID={testID}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  glassContainer: {
    overflow: 'hidden',
  },
  glassOverlay: {
    flex: 1,
  },
  glassShadow: {
    shadowColor: GlassUITokens.shadow.color,
    shadowOffset: GlassUITokens.shadow.offset,
    shadowOpacity: 1,
    shadowRadius: GlassUITokens.shadow.radius,
    elevation: GlassUITokens.shadow.elevation,
  },
  androidGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  webGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    // @ts-ignore - Web-specific style
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
  },
  fallbackContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
});

/**
 * Usage Examples:
 * 
 * 1. Basic Glass Card:
 * ```tsx
 * <GlassView preset="card">
 *   <Text>Card Content</Text>
 * </GlassView>
 * ```
 * 
 * 2. Glass Navigation Header:
 * ```tsx
 * <GlassView preset="navigation" borderRadius={0}>
 *   <Text>Header</Text>
 * </GlassView>
 * ```
 * 
 * 3. Custom Glass Effect:
 * ```tsx
 * <GlassView 
 *   intensity={40} 
 *   tint="dark"
 *   withBorder={false}
 * >
 *   <Text>Custom Glass</Text>
 * </GlassView>
 * ```
 * 
 * 4. Glass Modal:
 * ```tsx
 * <GlassView 
 *   preset="modal"
 *   style={{ padding: 24 }}
 * >
 *   <Text>Modal Content</Text>
 * </GlassView>
 * ```
 */
