/**
 * Weight Conversion Utilities
 * Handles conversion between metric (kg/g) and imperial (lbs/oz) units
 * Includes Canadian-specific preferences and newborn weight validation
 */

export type WeightUnit = 'metric' | 'imperial';
export type MetricUnit = 'kg' | 'g';
export type ImperialUnit = 'lbs' | 'oz';

// Conversion constants
export const GRAMS_PER_POUND = 453.592;
export const GRAMS_PER_OUNCE = 28.3495;
export const OUNCES_PER_POUND = 16;

// Canadian newborn weight ranges (typical range: 2.5kg - 4.5kg or 5.5lbs - 10lbs)
export const WEIGHT_RANGES = {
  NEWBORN_MIN_GRAMS: 1000,  // 1kg (very low but medically possible)
  NEWBORN_MAX_GRAMS: 6800,  // 6.8kg (high but medically possible)
  NEWBORN_MIN_POUNDS: 2.2,  // ~1kg
  NEWBORN_MAX_POUNDS: 15.0, // ~6.8kg
} as const;

export interface WeightValue {
  grams: number;
  pounds: number;
  ounces: number;
  kilograms: number;
}

export interface FormattedWeight {
  display: string;
  unit: WeightUnit;
  value: WeightValue;
}

/**
 * Convert grams to pounds and ounces
 */
export function gramsToPoundsOunces(grams: number): { pounds: number; ounces: number } {
  const totalPounds = grams / GRAMS_PER_POUND;
  const pounds = Math.floor(totalPounds);
  const remainingOunces = (totalPounds - pounds) * OUNCES_PER_POUND;
  const ounces = Math.round(remainingOunces * 10) / 10; // Round to 1 decimal place
  
  return { pounds, ounces };
}

/**
 * Convert pounds and ounces to grams
 */
export function poundsOuncesToGrams(pounds: number, ounces: number): number {
  const totalGrams = (pounds * GRAMS_PER_POUND) + (ounces * GRAMS_PER_OUNCE);
  return Math.round(totalGrams);
}

/**
 * Convert grams to kilograms
 */
export function gramsToKilograms(grams: number): number {
  return Math.round((grams / 1000) * 100) / 100; // Round to 2 decimal places
}

/**
 * Convert kilograms to grams
 */
export function kilogramsToGrams(kilograms: number): number {
  return Math.round(kilograms * 1000);
}

/**
 * Create a complete weight value object from grams
 */
export function createWeightValue(grams: number): WeightValue {
  const { pounds, ounces } = gramsToPoundsOunces(grams);
  const kilograms = gramsToKilograms(grams);
  
  return {
    grams,
    pounds,
    ounces,
    kilograms,
  };
}

/**
 * Format weight for display based on unit preference
 */
export function formatWeightDisplay(grams: number, unit: WeightUnit, compact: boolean = false): FormattedWeight {
  const weightValue = createWeightValue(grams);
  
  let display: string;
  
  if (unit === 'imperial') {
    if (weightValue.pounds === 0) {
      display = compact ? `${weightValue.ounces}oz` : `${weightValue.ounces} oz`;
    } else if (weightValue.ounces === 0) {
      display = compact ? `${weightValue.pounds}lbs` : `${weightValue.pounds} lbs`;
    } else {
      display = compact 
        ? `${weightValue.pounds}lbs ${weightValue.ounces}oz`
        : `${weightValue.pounds} lbs ${weightValue.ounces} oz`;
    }
  } else {
    // Metric - show in kg if >= 1kg, otherwise in grams
    if (weightValue.kilograms >= 1) {
      display = compact ? `${weightValue.kilograms}kg` : `${weightValue.kilograms} kg`;
    } else {
      display = compact ? `${weightValue.grams}g` : `${weightValue.grams} g`;
    }
  }
  
  return {
    display,
    unit,
    value: weightValue,
  };
}

/**
 * Validate weight is within newborn range
 */
export function validateNewbornWeight(grams: number): { isValid: boolean; message?: string } {
  if (grams < WEIGHT_RANGES.NEWBORN_MIN_GRAMS) {
    return {
      isValid: false,
      message: `Weight seems too low (minimum: ${formatWeightDisplay(WEIGHT_RANGES.NEWBORN_MIN_GRAMS, 'metric').display})`
    };
  }
  
  if (grams > WEIGHT_RANGES.NEWBORN_MAX_GRAMS) {
    return {
      isValid: false,
      message: `Weight seems too high (maximum: ${formatWeightDisplay(WEIGHT_RANGES.NEWBORN_MAX_GRAMS, 'metric').display})`
    };
  }
  
  return { isValid: true };
}

/**
 * Parse weight input string and convert to grams
 */
export function parseWeightInput(input: string, unit: WeightUnit): { grams: number; isValid: boolean; error?: string } {
  const trimmed = input.trim();
  
  if (!trimmed) {
    return { grams: 0, isValid: false, error: 'Please enter a weight' };
  }
  
  if (unit === 'metric') {
    const value = parseFloat(trimmed);
    if (isNaN(value) || value <= 0) {
      return { grams: 0, isValid: false, error: 'Please enter a valid weight' };
    }
    
    // Assume kg if value is small (< 50), otherwise grams
    const grams = value < 50 ? kilogramsToGrams(value) : value;
    const validation = validateNewbornWeight(grams);
    
    return {
      grams,
      isValid: validation.isValid,
      error: validation.message,
    };
  } else {
    // Imperial - expect decimal pounds or separate pounds/ounces
    const value = parseFloat(trimmed);
    if (isNaN(value) || value <= 0) {
      return { grams: 0, isValid: false, error: 'Please enter a valid weight' };
    }
    
    // Convert decimal pounds to grams
    const grams = Math.round(value * GRAMS_PER_POUND);
    const validation = validateNewbornWeight(grams);
    
    return {
      grams,
      isValid: validation.isValid,
      error: validation.message,
    };
  }
}

/**
 * Get weight conversion for display in the other unit system
 */
export function getAlternateUnitDisplay(grams: number, currentUnit: WeightUnit): string {
  const alternateUnit: WeightUnit = currentUnit === 'metric' ? 'imperial' : 'metric';
  return formatWeightDisplay(grams, alternateUnit, true).display;
}

/**
 * Canadian-specific unit preference detection
 * Canada officially uses metric but many people prefer imperial for body weight
 */
export function getCanadianWeightPreference(): WeightUnit {
  // Default to metric for Canada (official measurement system)
  // Users can override this preference
  return 'metric';
}

/**
 * Format weight for different contexts
 */
export function formatWeightForContext(grams: number, context: 'input' | 'display' | 'compact', unit: WeightUnit): string {
  switch (context) {
    case 'input':
      // For input fields, show the most natural format
      if (unit === 'metric') {
        const kg = gramsToKilograms(grams);
        return kg >= 1 ? kg.toString() : grams.toString();
      } else {
        const { pounds, ounces } = gramsToPoundsOunces(grams);
        return (pounds + (ounces / OUNCES_PER_POUND)).toString();
      }
    
    case 'compact':
      return formatWeightDisplay(grams, unit, true).display;
    
    case 'display':
    default:
      return formatWeightDisplay(grams, unit, false).display;
  }
}