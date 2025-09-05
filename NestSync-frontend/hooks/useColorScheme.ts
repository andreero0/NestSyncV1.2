/**
 * NestSync Color Scheme Hook
 * Integrates with ThemeContext for consistent theme management across platforms
 * Falls back to React Native's useColorScheme if ThemeContext is not available
 */

import { useColorScheme as useRNColorScheme } from 'react-native';

export function useColorScheme() {
  // Try to use ThemeContext if available
  try {
    const { useNestSyncTheme } = require('../contexts/ThemeContext');
    return useNestSyncTheme();
  } catch (error) {
    // Fallback to React Native's useColorScheme if ThemeContext is not available
    const systemColorScheme = useRNColorScheme();
    // Default to light if system preference is undefined (fallback only)
    return systemColorScheme ?? 'light';
  }
}
