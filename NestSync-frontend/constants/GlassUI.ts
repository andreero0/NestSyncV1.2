/**
 * NestSync Glass UI Design System
 * 
 * iOS 18-style glassmorphism design tokens and presets for creating
 * modern, premium glass UI effects across the NestSync app.
 * 
 * Features:
 * - Platform-specific blur implementations
 * - Performance-optimized presets
 * - Accessibility-compliant opacity levels
 * - Consistent visual hierarchy
 */

import { Platform } from 'react-native';

/**
 * Core Glass UI Design Tokens
 * 
 * These tokens define the fundamental properties of glass UI effects:
 * - Blur: Controls the frosted glass effect intensity
 * - Opacity: Controls background transparency
 * - Tint: Adds subtle color overlay for depth
 * - Border: Defines glass edge definition
 * - Shadow: Adds depth and elevation
 */
export const GlassUITokens = {
  /**
   * Blur Intensity Levels
   * 
   * Controls the backdrop blur radius for frosted glass effect.
   * Higher values create more pronounced blur but may impact performance.
   * 
   * Usage Guidelines:
   * - light: Subtle blur for cards and containers (10px)
   * - medium: Standard blur for navigation and buttons (20px)
   * - heavy: Strong blur for modals and overlays (40px)
   * - intense: Maximum blur for special effects (80px)
   */
  blur: {
    light: 10,
    medium: 20,
    heavy: 40,
    intense: 80,
  },

  /**
   * Background Opacity Levels
   * 
   * Controls the transparency of the glass background.
   * Lower values create more transparency, higher values more solidity.
   * 
   * Usage Guidelines:
   * - subtle: Maximum transparency for lightweight glass (0.7)
   * - medium: Balanced transparency for most use cases (0.8)
   * - strong: Minimal transparency for important elements (0.9)
   */
  opacity: {
    subtle: 0.7,
    medium: 0.8,
    strong: 0.9,
  },

  /**
   * Tint Colors
   * 
   * Subtle color overlays that add depth and visual interest to glass surfaces.
   * Uses RGBA for precise control over color and opacity.
   * 
   * Usage Guidelines:
   * - light: White tint for light backgrounds
   * - dark: Black tint for dark backgrounds or overlays
   * - primary: NestSync brand color tint for emphasis
   */
  tint: {
    light: 'rgba(255, 255, 255, 0.1)',
    dark: 'rgba(0, 0, 0, 0.1)',
    primary: 'rgba(8, 145, 178, 0.1)', // NestSync primary blue
  },

  /**
   * Border Properties
   * 
   * Defines the subtle borders that give glass elements definition.
   * Borders help separate glass elements from backgrounds.
   * 
   * Usage Guidelines:
   * - Use light borders on light backgrounds
   * - Use slightly darker borders on dark backgrounds
   * - Keep borders subtle to maintain glass aesthetic
   */
  border: {
    width: 1,
    color: {
      light: 'rgba(255, 255, 255, 0.2)',
      dark: 'rgba(255, 255, 255, 0.1)',
    },
  },

  /**
   * Shadow Properties
   * 
   * Adds depth and elevation to glass elements.
   * Shadows help establish visual hierarchy and layering.
   * 
   * Usage Guidelines:
   * - Use for cards and elevated elements
   * - Increase elevation for modals and overlays
   * - Keep shadows subtle to maintain glass aesthetic
   */
  shadow: {
    color: 'rgba(0, 0, 0, 0.1)',
    offset: { width: 0, height: 4 },
    radius: 12,
    elevation: 4, // Android elevation
  },
};

/**
 * Glass UI Component Presets
 * 
 * Pre-configured combinations of glass UI tokens for common use cases.
 * These presets ensure consistency across the app and simplify implementation.
 * 
 * Each preset includes:
 * - blur: Blur intensity from GlassUITokens.blur
 * - opacity: Background opacity from GlassUITokens.opacity
 * - tint: Color tint from GlassUITokens.tint
 */
export const GlassUIPresets = {
  /**
   * Navigation Preset
   * 
   * For headers, tab bars, and navigation elements.
   * Uses medium blur and strong opacity for clear visibility.
   * 
   * Use Cases:
   * - Stack.Screen headers
   * - Tab navigator bars
   * - Navigation buttons
   */
  navigation: {
    blur: GlassUITokens.blur.medium,
    opacity: GlassUITokens.opacity.strong,
    tint: GlassUITokens.tint.light,
  },

  /**
   * Card Preset
   * 
   * For content cards and containers.
   * Uses light blur and subtle opacity for elegant appearance.
   * 
   * Use Cases:
   * - Dashboard cards
   * - Inventory items
   * - List items
   * - Content containers
   */
  card: {
    blur: GlassUITokens.blur.light,
    opacity: GlassUITokens.opacity.subtle,
    tint: GlassUITokens.tint.light,
  },

  /**
   * Modal Preset
   * 
   * For modals, overlays, and dialogs.
   * Uses heavy blur and strong opacity for focus and prominence.
   * 
   * Use Cases:
   * - Modal dialogs
   * - Bottom sheets
   * - Confirmation dialogs
   * - Full-screen overlays
   */
  modal: {
    blur: GlassUITokens.blur.heavy,
    opacity: GlassUITokens.opacity.strong,
    tint: GlassUITokens.tint.dark,
  },

  /**
   * Button Preset
   * 
   * For interactive buttons and CTAs.
   * Uses medium blur and medium opacity for clear interactivity.
   * 
   * Use Cases:
   * - Primary buttons
   * - Secondary buttons
   * - Floating action buttons
   * - Interactive controls
   */
  button: {
    blur: GlassUITokens.blur.medium,
    opacity: GlassUITokens.opacity.medium,
    tint: GlassUITokens.tint.primary,
  },
};

/**
 * Platform-Specific Configuration
 * 
 * Adjusts glass UI properties based on platform capabilities and conventions.
 * Ensures optimal performance and native feel on each platform.
 */
export const GlassUIPlatform = {
  /**
   * iOS Configuration
   * 
   * Uses native BlurView for authentic iOS 18 glass effect.
   * Full blur support with all intensity levels.
   */
  ios: {
    supportsBlur: true,
    blurType: 'native', // Uses expo-blur BlurView
    maxBlurRadius: GlassUITokens.blur.intense,
  },

  /**
   * Android Configuration
   * 
   * Uses gradient overlay fallback for glass effect.
   * Reduced blur intensity for better performance.
   */
  android: {
    supportsBlur: false, // Limited native blur support
    blurType: 'gradient', // Uses gradient overlay
    maxBlurRadius: GlassUITokens.blur.light, // Reduced for performance
  },

  /**
   * Web Configuration
   * 
   * Uses CSS backdrop-filter for glass effect.
   * Full blur support in modern browsers.
   */
  web: {
    supportsBlur: true,
    blurType: 'css', // Uses backdrop-filter CSS
    maxBlurRadius: GlassUITokens.blur.heavy,
  },
};

/**
 * Get Platform-Specific Blur Intensity
 * 
 * Adjusts blur intensity based on platform capabilities.
 * Ensures optimal performance on all platforms.
 * 
 * @param intensity - Desired blur intensity
 * @returns Platform-adjusted blur intensity
 */
export function getPlatformBlurIntensity(intensity: number): number {
  const platform = Platform.OS;
  const config = GlassUIPlatform[platform as keyof typeof GlassUIPlatform];

  if (!config) {
    return intensity;
  }

  // Reduce blur on platforms with limited support
  if (!config.supportsBlur) {
    return Math.min(intensity, config.maxBlurRadius);
  }

  return intensity;
}

/**
 * Check if Platform Supports Blur
 * 
 * Determines if the current platform supports native blur effects.
 * Used to conditionally render blur or fallback to gradient.
 * 
 * @returns True if platform supports blur, false otherwise
 */
export function isPlatformBlurSupported(): boolean {
  const platform = Platform.OS;
  const config = GlassUIPlatform[platform as keyof typeof GlassUIPlatform];
  return config?.supportsBlur ?? false;
}

/**
 * Glass UI Usage Guidelines
 * 
 * ACCESSIBILITY:
 * - All glass UI elements maintain WCAG AA contrast ratios (4.5:1 minimum)
 * - Text on glass backgrounds uses sufficient opacity for readability
 * - Interactive elements maintain 48px minimum touch targets
 * - Glass effects never reduce clarity of critical information
 * 
 * PERFORMANCE:
 * - Use lighter blur intensities for better performance
 * - Limit number of glass elements on screen simultaneously
 * - Consider performance mode for low-end devices
 * - Test on physical devices, not just simulators
 * 
 * VISUAL HIERARCHY:
 * - Use heavier blur for more important/elevated elements
 * - Use lighter blur for background/supporting elements
 * - Maintain consistent blur intensity within component types
 * - Use tint colors to differentiate element types
 * 
 * PLATFORM CONSISTENCY:
 * - iOS: Full glass UI with native blur
 * - Android: Gradient fallback with reduced blur
 * - Web: CSS backdrop-filter for modern browsers
 * - Always test on target platforms
 * 
 * COMMON PATTERNS:
 * 
 * Navigation:
 * - Headers: navigation preset (medium blur, strong opacity)
 * - Tab bars: navigation preset with light tint
 * - Back buttons: button preset with primary tint
 * 
 * Content:
 * - Cards: card preset (light blur, subtle opacity)
 * - Lists: card preset with consistent spacing
 * - Containers: card preset with appropriate padding
 * 
 * Overlays:
 * - Modals: modal preset (heavy blur, strong opacity)
 * - Dialogs: modal preset with dark tint
 * - Bottom sheets: modal preset with reduced blur
 * 
 * Interactive:
 * - Buttons: button preset (medium blur, medium opacity)
 * - FABs: button preset with primary tint
 * - Controls: button preset with appropriate sizing
 */

/**
 * TypeScript Type Definitions
 */

export interface GlassUIConfig {
  blur: number;
  opacity: number;
  tint: string;
}

export type GlassUIPresetName = 'navigation' | 'card' | 'modal' | 'button';

export interface GlassUIPlatformConfig {
  supportsBlur: boolean;
  blurType: 'native' | 'gradient' | 'css';
  maxBlurRadius: number;
}

/**
 * Export all glass UI tokens and utilities
 */
export default {
  tokens: GlassUITokens,
  presets: GlassUIPresets,
  platform: GlassUIPlatform,
  getPlatformBlurIntensity,
  isPlatformBlurSupported,
};
