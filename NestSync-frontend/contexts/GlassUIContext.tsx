/**
 * Glass UI Context Provider
 * 
 * Manages glass UI theme state and configuration across the NestSync application.
 * Provides platform-aware glass UI settings with performance optimization.
 * 
 * Features:
 * - Platform detection and capability checking
 * - Performance mode settings for low-end devices
 * - Glass UI intensity control
 * - Persistent user preferences
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isPlatformBlurSupported } from '../constants/GlassUI';

/**
 * Glass UI Intensity Levels
 * 
 * Controls the overall intensity of glass effects across the app.
 * - light: Minimal blur, maximum performance
 * - medium: Balanced blur and performance (default)
 * - heavy: Maximum blur, premium appearance
 */
export type GlassUIIntensity = 'light' | 'medium' | 'heavy';

/**
 * Performance Mode Settings
 * 
 * Adjusts glass UI rendering based on device capabilities.
 * - high: Full glass effects, best appearance
 * - balanced: Optimized glass effects (default)
 * - low: Minimal glass effects, maximum performance
 */
export type PerformanceMode = 'high' | 'balanced' | 'low';

/**
 * Glass UI Theme Configuration
 */
export interface GlassUITheme {
  /** Whether glass UI is enabled globally */
  enabled: boolean;
  
  /** Glass effect intensity level */
  intensity: GlassUIIntensity;
  
  /** Performance optimization mode */
  performanceMode: PerformanceMode;
}

/**
 * Glass UI Context Value
 */
interface GlassUIContextValue {
  /** Current glass UI theme configuration */
  theme: GlassUITheme;
  
  /** Update glass UI theme settings */
  updateTheme: (theme: Partial<GlassUITheme>) => Promise<void>;
  
  /** Whether the current platform supports blur effects */
  isSupported: boolean;
  
  /** Current platform name */
  platform: string;
  
  /** Whether glass UI is initialized and ready */
  isInitialized: boolean;
}

const GlassUIContext = createContext<GlassUIContextValue | undefined>(undefined);

const GLASS_UI_STORAGE_KEY = '@NestSync:glassUI';

interface GlassUIProviderProps {
  children: ReactNode;
  defaultTheme?: Partial<GlassUITheme>;
}

/**
 * Glass UI Provider Component
 * 
 * Wraps the app to provide glass UI configuration and state management.
 * Automatically detects platform capabilities and loads user preferences.
 * 
 * @example
 * ```tsx
 * <GlassUIProvider>
 *   <App />
 * </GlassUIProvider>
 * ```
 */
export function GlassUIProvider({ 
  children, 
  defaultTheme 
}: GlassUIProviderProps) {
  const [theme, setThemeState] = useState<GlassUITheme>({
    enabled: true,
    intensity: 'medium',
    performanceMode: 'balanced',
    ...defaultTheme,
  });
  
  const [isInitialized, setIsInitialized] = useState(false);

  // Detect platform blur support
  const isSupported = isPlatformBlurSupported();
  const platform = Platform.OS;

  // Load saved glass UI preferences on mount
  useEffect(() => {
    loadGlassUIPreferences();
  }, []);

  /**
   * Load Glass UI Preferences from Storage
   * 
   * Loads user's saved glass UI preferences from AsyncStorage.
   * Falls back to platform-appropriate defaults if no preferences exist.
   */
  const loadGlassUIPreferences = async () => {
    try {
      const savedPreferences = await AsyncStorage.getItem(GLASS_UI_STORAGE_KEY);
      
      if (savedPreferences) {
        const parsed = JSON.parse(savedPreferences) as Partial<GlassUITheme>;
        setThemeState(prev => ({ ...prev, ...parsed }));
      } else {
        // Set platform-appropriate defaults
        const platformDefaults = getPlatformDefaults();
        setThemeState(prev => ({ ...prev, ...platformDefaults }));
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Error loading glass UI preferences:', error);
      }
      // Use platform defaults on error
      const platformDefaults = getPlatformDefaults();
      setThemeState(prev => ({ ...prev, ...platformDefaults }));
    } finally {
      setIsInitialized(true);
    }
  };

  /**
   * Get Platform-Specific Defaults
   * 
   * Returns appropriate default settings based on platform capabilities.
   * iOS gets full glass UI, Android gets optimized settings.
   */
  const getPlatformDefaults = (): Partial<GlassUITheme> => {
    if (Platform.OS === 'ios') {
      return {
        enabled: true,
        intensity: 'medium',
        performanceMode: 'high',
      };
    } else if (Platform.OS === 'android') {
      return {
        enabled: true,
        intensity: 'light',
        performanceMode: 'balanced',
      };
    } else {
      // Web and other platforms
      return {
        enabled: true,
        intensity: 'medium',
        performanceMode: 'balanced',
      };
    }
  };

  /**
   * Update Glass UI Theme
   * 
   * Updates glass UI theme settings and persists to storage.
   * Validates settings and applies platform-specific constraints.
   * 
   * @param updates - Partial theme updates to apply
   */
  const updateTheme = async (updates: Partial<GlassUITheme>) => {
    try {
      const newTheme = { ...theme, ...updates };
      
      // Validate and constrain settings based on platform
      const validatedTheme = validateThemeSettings(newTheme);
      
      // Save to storage
      await AsyncStorage.setItem(
        GLASS_UI_STORAGE_KEY, 
        JSON.stringify(validatedTheme)
      );
      
      // Update state
      setThemeState(validatedTheme);
    } catch (error) {
      if (__DEV__) {
        console.error('Error saving glass UI preferences:', error);
      }
      // Still update state even if storage fails
      setThemeState(prev => ({ ...prev, ...updates }));
    }
  };

  /**
   * Validate Theme Settings
   * 
   * Ensures theme settings are appropriate for the current platform.
   * Applies constraints and fallbacks as needed.
   * 
   * @param theme - Theme settings to validate
   * @returns Validated theme settings
   */
  const validateThemeSettings = (theme: GlassUITheme): GlassUITheme => {
    const validated = { ...theme };

    // Disable glass UI on unsupported platforms
    if (!isSupported) {
      validated.enabled = false;
    }

    // Constrain intensity on Android for performance
    if (Platform.OS === 'android' && validated.intensity === 'heavy') {
      validated.intensity = 'medium';
    }

    // Adjust performance mode based on intensity
    if (validated.intensity === 'heavy' && validated.performanceMode === 'low') {
      validated.performanceMode = 'balanced';
    }

    return validated;
  };

  const contextValue: GlassUIContextValue = {
    theme,
    updateTheme,
    isSupported,
    platform,
    isInitialized,
  };

  return (
    <GlassUIContext.Provider value={contextValue}>
      {children}
    </GlassUIContext.Provider>
  );
}

/**
 * Use Glass UI Hook
 * 
 * Custom hook to access glass UI context.
 * Must be used within a GlassUIProvider.
 * 
 * @returns Glass UI context value
 * @throws Error if used outside GlassUIProvider
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { theme, updateTheme, isSupported } = useGlassUI();
 *   
 *   if (!isSupported) {
 *     return <FallbackComponent />;
 *   }
 *   
 *   return <GlassView intensity={theme.intensity} />;
 * }
 * ```
 */
export function useGlassUI() {
  const context = useContext(GlassUIContext);
  if (!context) {
    throw new Error('useGlassUI must be used within a GlassUIProvider');
  }
  return context;
}

/**
 * Use Glass UI Enabled Hook
 * 
 * Convenience hook to check if glass UI is enabled and supported.
 * Returns false during initialization for safe rendering.
 * 
 * @returns Whether glass UI should be rendered
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const glassEnabled = useGlassUIEnabled();
 *   
 *   return glassEnabled ? <GlassView /> : <StandardView />;
 * }
 * ```
 */
export function useGlassUIEnabled(): boolean {
  const { theme, isSupported, isInitialized } = useGlassUI();
  return isInitialized && isSupported && theme.enabled;
}

/**
 * Use Glass UI Intensity Hook
 * 
 * Convenience hook to get the current glass UI intensity setting.
 * Returns 'light' during initialization for safe rendering.
 * 
 * @returns Current glass UI intensity level
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const intensity = useGlassUIIntensity();
 *   
 *   return <GlassView intensity={intensity} />;
 * }
 * ```
 */
export function useGlassUIIntensity(): GlassUIIntensity {
  const { theme, isInitialized } = useGlassUI();
  return isInitialized ? theme.intensity : 'light';
}

/**
 * Use Performance Mode Hook
 * 
 * Convenience hook to get the current performance mode setting.
 * Useful for conditionally rendering expensive glass effects.
 * 
 * @returns Current performance mode
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const performanceMode = usePerformanceMode();
 *   
 *   const shouldRenderExpensiveEffect = performanceMode === 'high';
 *   
 *   return (
 *     <GlassView>
 *       {shouldRenderExpensiveEffect && <ExpensiveEffect />}
 *     </GlassView>
 *   );
 * }
 * ```
 */
export function usePerformanceMode(): PerformanceMode {
  const { theme, isInitialized } = useGlassUI();
  return isInitialized ? theme.performanceMode : 'balanced';
}

/**
 * Glass UI Context Utilities
 * 
 * USAGE GUIDELINES:
 * 
 * 1. Provider Setup:
 *    - Wrap your app root with GlassUIProvider
 *    - Provider automatically detects platform capabilities
 *    - User preferences are loaded from AsyncStorage
 * 
 * 2. Accessing Glass UI State:
 *    - Use useGlassUI() for full context access
 *    - Use useGlassUIEnabled() to check if glass UI should render
 *    - Use useGlassUIIntensity() to get current intensity
 *    - Use usePerformanceMode() to check performance settings
 * 
 * 3. Updating Settings:
 *    - Call updateTheme() with partial updates
 *    - Settings are automatically validated and persisted
 *    - Platform constraints are applied automatically
 * 
 * 4. Platform Handling:
 *    - iOS: Full glass UI support with native blur
 *    - Android: Optimized glass UI with gradient fallback
 *    - Web: CSS backdrop-filter support
 *    - Unsupported platforms: Glass UI automatically disabled
 * 
 * 5. Performance Optimization:
 *    - Use performanceMode to adjust rendering quality
 *    - Check isInitialized before rendering glass effects
 *    - Consider device capabilities when setting intensity
 * 
 * EXAMPLES:
 * 
 * Basic Usage:
 * ```tsx
 * const { theme, updateTheme } = useGlassUI();
 * 
 * // Toggle glass UI
 * await updateTheme({ enabled: !theme.enabled });
 * 
 * // Change intensity
 * await updateTheme({ intensity: 'heavy' });
 * ```
 * 
 * Conditional Rendering:
 * ```tsx
 * const glassEnabled = useGlassUIEnabled();
 * 
 * return glassEnabled ? (
 *   <GlassView preset="card">
 *     <Content />
 *   </GlassView>
 * ) : (
 *   <View style={styles.standardCard}>
 *     <Content />
 *   </View>
 * );
 * ```
 * 
 * Performance-Aware Rendering:
 * ```tsx
 * const performanceMode = usePerformanceMode();
 * const intensity = useGlassUIIntensity();
 * 
 * const blurIntensity = performanceMode === 'low' 
 *   ? 'light' 
 *   : intensity;
 * 
 * return <GlassView intensity={blurIntensity} />;
 * ```
 */
