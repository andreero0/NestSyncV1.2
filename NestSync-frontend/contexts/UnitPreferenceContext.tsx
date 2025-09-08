/**
 * Unit Preference Context
 * Manages measurement unit preferences with Canadian localization
 * Supports intelligent preference detection and AsyncStorage persistence
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { WeightUnit, getCanadianWeightPreference } from '../lib/utils/weightConversion';

export type MeasurementSystem = 'metric' | 'imperial' | 'mixed';

export interface UnitPreferences {
  weight: WeightUnit;
  measurementSystem: MeasurementSystem;
  autoDetect: boolean;
  locale: string;
  region: string;
}

interface UnitPreferenceContextType {
  preferences: UnitPreferences;
  isLoading: boolean;
  updateWeightUnit: (unit: WeightUnit) => Promise<void>;
  updateMeasurementSystem: (system: MeasurementSystem) => Promise<void>;
  toggleAutoDetect: () => Promise<void>;
  resetToSystemDefaults: () => Promise<void>;
}

const STORAGE_KEY = 'nestsync_unit_preferences';

// Default preferences
const DEFAULT_PREFERENCES: UnitPreferences = {
  weight: 'metric',
  measurementSystem: 'metric',
  autoDetect: true,
  locale: 'en-CA',
  region: 'CA',
};

const UnitPreferenceContext = createContext<UnitPreferenceContextType | undefined>(undefined);

/**
 * Detect system preferences based on locale and region
 */
function detectSystemPreferences(): UnitPreferences {
  const locales = Localization.getLocales();
  const primaryLocale = locales[0];
  
  // Extract country code from locale
  const region = primaryLocale?.regionCode || 'CA';
  const locale = primaryLocale?.languageTag || 'en-CA';
  
  // Canadian-specific logic
  if (region === 'CA') {
    return {
      weight: getCanadianWeightPreference(),
      measurementSystem: 'mixed', // Canada uses mixed system in practice
      autoDetect: true,
      locale,
      region,
    };
  }
  
  // US preferences
  if (region === 'US') {
    return {
      weight: 'imperial',
      measurementSystem: 'imperial',
      autoDetect: true,
      locale,
      region,
    };
  }
  
  // Rest of world defaults to metric
  return {
    weight: 'metric',
    measurementSystem: 'metric',
    autoDetect: true,
    locale,
    region,
  };
}

export function UnitPreferenceProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<UnitPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);

  // Load preferences from storage on mount
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setIsLoading(true);
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      
      if (stored) {
        const parsedPreferences = JSON.parse(stored) as UnitPreferences;
        setPreferences(parsedPreferences);
      } else {
        // No stored preferences, detect from system
        const systemPreferences = detectSystemPreferences();
        setPreferences(systemPreferences);
        await savePreferences(systemPreferences);
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to load unit preferences:', error);
      }
      // Fall back to system detection
      const systemPreferences = detectSystemPreferences();
      setPreferences(systemPreferences);
    } finally {
      setIsLoading(false);
    }
  };

  const savePreferences = async (newPreferences: UnitPreferences) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newPreferences));
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to save unit preferences:', error);
      }
    }
  };

  const updateWeightUnit = async (unit: WeightUnit) => {
    const newPreferences = {
      ...preferences,
      weight: unit,
      autoDetect: false, // User made explicit choice
    };
    setPreferences(newPreferences);
    await savePreferences(newPreferences);
  };

  const updateMeasurementSystem = async (system: MeasurementSystem) => {
    // Update weight unit based on measurement system
    let weightUnit: WeightUnit = preferences.weight;
    
    if (system === 'metric') {
      weightUnit = 'metric';
    } else if (system === 'imperial') {
      weightUnit = 'imperial';
    }
    // For 'mixed', keep current weight unit preference
    
    const newPreferences = {
      ...preferences,
      measurementSystem: system,
      weight: weightUnit,
      autoDetect: false,
    };
    setPreferences(newPreferences);
    await savePreferences(newPreferences);
  };

  const toggleAutoDetect = async () => {
    if (!preferences.autoDetect) {
      // Turning auto-detect on - update to system preferences
      const systemPreferences = detectSystemPreferences();
      const newPreferences = {
        ...systemPreferences,
        autoDetect: true,
      };
      setPreferences(newPreferences);
      await savePreferences(newPreferences);
    } else {
      // Turning auto-detect off - keep current preferences
      const newPreferences = {
        ...preferences,
        autoDetect: false,
      };
      setPreferences(newPreferences);
      await savePreferences(newPreferences);
    }
  };

  const resetToSystemDefaults = async () => {
    const systemPreferences = detectSystemPreferences();
    setPreferences(systemPreferences);
    await savePreferences(systemPreferences);
  };

  const value: UnitPreferenceContextType = {
    preferences,
    isLoading,
    updateWeightUnit,
    updateMeasurementSystem,
    toggleAutoDetect,
    resetToSystemDefaults,
  };

  return (
    <UnitPreferenceContext.Provider value={value}>
      {children}
    </UnitPreferenceContext.Provider>
  );
}

/**
 * Hook to access unit preferences
 */
export function useUnitPreferences() {
  const context = useContext(UnitPreferenceContext);
  if (context === undefined) {
    throw new Error('useUnitPreferences must be used within a UnitPreferenceProvider');
  }
  return context;
}

/**
 * Hook to access only weight unit preference (most common use case)
 */
export function useWeightUnit() {
  const { preferences, updateWeightUnit } = useUnitPreferences();
  return {
    weightUnit: preferences.weight,
    updateWeightUnit,
    isCanadian: preferences.region === 'CA',
  };
}

/**
 * Hook to get display preferences for different measurement types
 */
export function useMeasurementDisplay() {
  const { preferences } = useUnitPreferences();
  
  return {
    weight: preferences.weight,
    temperature: preferences.measurementSystem === 'imperial' ? 'fahrenheit' : 'celsius',
    distance: preferences.measurementSystem === 'imperial' ? 'miles' : 'kilometers',
    height: preferences.region === 'CA' && preferences.measurementSystem === 'mixed' ? 'feet' : 
           preferences.measurementSystem === 'imperial' ? 'feet' : 'centimeters',
  };
}