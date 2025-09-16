/**
 * Platform utilities for detecting the current platform
 * Used for conditional rendering based on platform capabilities
 */

import { Platform } from 'react-native';

/**
 * Check if the current platform is web
 * @returns {boolean} True if running on web platform
 */
export const isWeb = (): boolean => {
  return Platform.OS === 'web';
};

/**
 * Check if the current platform is native (iOS or Android)
 * @returns {boolean} True if running on native platform
 */
export const isNative = (): boolean => {
  return Platform.OS === 'ios' || Platform.OS === 'android';
};

/**
 * Get the current platform OS
 * @returns {string} The current platform OS
 */
export const getPlatform = (): string => {
  return Platform.OS;
};

/**
 * Platform-specific configuration for charts
 */
export const chartConfig = {
  web: {
    // Web charts should use React Native components (no Skia)
    supportsSkia: false,
    supportsVictoryNative: false,
    preferredLibrary: 'react-native-components',
  },
  native: {
    // Native platforms support Skia and Victory Native XL
    supportsSkia: true,
    supportsVictoryNative: true,
    preferredLibrary: 'victory-native',
  },
};

/**
 * Get platform-specific chart configuration
 * @returns {object} Configuration for the current platform
 */
export const getChartConfig = () => {
  return isWeb() ? chartConfig.web : chartConfig.native;
};