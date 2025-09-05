import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 * Updated to integrate with ThemeContext and default to system preference (2024 best practice)
 */
export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  // Try to use ThemeContext if available
  try {
    const { useNestSyncTheme } = require('../contexts/ThemeContext');
    const actualTheme = useNestSyncTheme();
    
    if (hasHydrated) {
      return actualTheme;
    }
    
    // Return light as default during hydration for consistency
    return 'light';
  } catch (error) {
    // Fallback to React Native's useColorScheme if ThemeContext is not available
    const colorScheme = useRNColorScheme();

    if (hasHydrated) {
      return colorScheme ?? 'light'; // Default to light if system preference is undefined
    }

    // Return light as default during hydration for consistency across platforms
    return 'light';
  }
}
