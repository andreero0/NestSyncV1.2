/**
 * Theme Context Provider
 * Manages theme state across the entire NestSync application
 * Provides consistent theme experience on web and mobile platforms
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  themeMode: ThemeMode;
  actualTheme: 'light' | 'dark';
  setThemeMode: (mode: ThemeMode) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@NestSync:theme';

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: ThemeMode;
}

export function ThemeProvider({ children, defaultTheme = 'system' }: ThemeProviderProps) {
  const systemColorScheme = useSystemColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>(defaultTheme);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load saved theme preference on mount
  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
        setThemeModeState(savedTheme as ThemeMode);
      } else {
        // Default to system preference (2024 best practice)
        setThemeModeState('system');
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
      // Fallback to system preference
      setThemeModeState('system');
    } finally {
      setIsInitialized(true);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      setThemeModeState(mode);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  // Determine the actual theme to use
  const actualTheme: 'light' | 'dark' = (() => {
    if (!isInitialized) {
      // During initialization, default to light for preferred experience
      return 'light';
    }
    
    if (themeMode === 'system') {
      // Use system preference, but default to light if undefined
      return systemColorScheme ?? 'light';
    }
    
    return themeMode === 'light' ? 'light' : 'dark';
  })();

  const contextValue: ThemeContextType = {
    themeMode,
    actualTheme,
    setThemeMode,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

// Custom hook to use the theme context
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Helper hook to get the current color scheme
export function useNestSyncTheme() {
  const { actualTheme } = useTheme();
  return actualTheme;
}