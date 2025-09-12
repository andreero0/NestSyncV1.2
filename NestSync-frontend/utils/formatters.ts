/**
 * Formatters and Utilities for NestSync
 * Includes field name mapping, date formatting, and display utilities
 */

// Global __DEV__ check for development mode
declare const __DEV__: boolean;

// =============================================================================
// FIELD NAME MAPPING UTILITIES
// =============================================================================

/**
 * Maps internal field names to human-readable display names
 * Addresses the issue where "size_1" shows instead of "Size 1"
 */
export const FIELD_NAME_MAPPINGS: Record<string, string> = {
  // Diaper sizes
  'NEWBORN': 'Newborn',
  'SIZE_1': 'Size 1',
  'SIZE_2': 'Size 2', 
  'SIZE_3': 'Size 3',
  'SIZE_4': 'Size 4',
  'SIZE_5': 'Size 5',
  'SIZE_6': 'Size 6',
  'SIZE_7': 'Size 7',
  
  // Product types
  'DIAPER': 'Diapers',
  'WIPES': 'Wipes',
  'DIAPER_CREAM': 'Diaper Cream',
  'POWDER': 'Baby Powder',
  'DIAPER_BAGS': 'Diaper Bags',
  'TRAINING_PANTS': 'Training Pants',
  'SWIMWEAR': 'Swim Diapers',
  
  // Usage contexts
  'HOME': 'Home',
  'DAYCARE': 'Daycare',
  'OUTING': 'Out & About',
  'TRAVEL': 'Travel',
  'GRANDPARENTS': 'Grandparents',
  'OTHER': 'Other',
  
  // Usage types
  'DIAPER_CHANGE': 'Diaper Change',
  'WIPE_USE': 'Wipe Use',
  'CREAM_APPLICATION': 'Cream Application',
  'ACCIDENT_CLEANUP': 'Accident Cleanup',
  'PREVENTIVE_CHANGE': 'Preventive Change',
  'OVERNIGHT_CHANGE': 'Overnight Change',
  
  // Gender options
  'BOY': 'Boy',
  'GIRL': 'Girl', 
  'OTHER': 'Other',
  'PREFER_NOT_TO_SAY': 'Prefer not to say',
  
  // Storage locations
  'NURSERY': 'Nursery',
  'BATHROOM': 'Bathroom',
  'KITCHEN': 'Kitchen',
  'BASEMENT': 'Basement',
  'GARAGE': 'Garage',
  'CAR': 'Car',
  'DIAPER_BAG': 'Diaper Bag',
  'PANTRY': 'Pantry',
};

/**
 * Converts internal field names to human-readable display names
 * @param fieldName - The internal field name (e.g., "size_1", "SIZE_1")
 * @returns Human-readable display name (e.g., "Size 1")
 */
export function formatFieldName(fieldName: string): string {
  if (!fieldName) return '';
  
  // Handle lowercase with underscores (e.g., "size_1" -> "SIZE_1")
  const normalizedFieldName = fieldName.toUpperCase();
  
  // Check direct mapping first
  if (FIELD_NAME_MAPPINGS[normalizedFieldName]) {
    return FIELD_NAME_MAPPINGS[normalizedFieldName];
  }
  
  // Handle special cases for lowercase field names
  if (FIELD_NAME_MAPPINGS[fieldName.toUpperCase()]) {
    return FIELD_NAME_MAPPINGS[fieldName.toUpperCase()];
  }
  
  // Fallback: Convert snake_case to Title Case
  return fieldName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Formats diaper size specifically
 * Handles both "SIZE_1" and "size_1" formats
 */
export function formatDiaperSize(size: string): string {
  if (!size) return '';
  
  const normalizedSize = size.toUpperCase();
  
  // Direct mapping for standard sizes
  if (FIELD_NAME_MAPPINGS[normalizedSize]) {
    return FIELD_NAME_MAPPINGS[normalizedSize];
  }
  
  // Handle numeric-only sizes (e.g., "1" -> "Size 1")
  if (/^\d+$/.test(size)) {
    return `Size ${size}`;
  }
  
  // Fallback
  return formatFieldName(size);
}

// =============================================================================
// DATE FORMATTING UTILITIES  
// =============================================================================

/**
 * Canadian-compliant date formatting
 * Uses Canadian timezone (America/Toronto) and formats
 */
const CANADIAN_TIMEZONE = 'America/Toronto';
const CANADIAN_LOCALE = 'en-CA';

/**
 * Formats relative time (e.g., "2 hours ago")
 * Fixes the "NaN day ago" issue and provides user-friendly fallbacks
 */
export function formatTimeAgo(date: string | Date | null | undefined): string {
  // Handle null/undefined cases with user-friendly fallback
  if (!date) {
    console.warn('[formatTimeAgo] No date provided, using fallback');
    return 'Just now';
  }
  
  // Check if the date is already a pre-formatted string from backend
  if (typeof date === 'string') {
    // Common pre-formatted patterns from backend
    const preFormattedPatterns = [
      /^\d+\s+(second|minute|hour|day|week|month|year)s?\s+ago$/i,
      /^Just now$/i,
      /^Recently$/i,
      /^Today$/i,
      /^Yesterday$/i
    ];
    
    if (preFormattedPatterns.some(pattern => pattern.test(date))) {
      // It's already formatted, return as-is
      return date;
    }
  }
  
  try {
    const targetDate = typeof date === 'string' ? new Date(date) : date;
    
    // Check for invalid date
    if (isNaN(targetDate.getTime())) {
      // If it's a string that's not a valid date and not pre-formatted,
      // it might still be a backend-formatted string we didn't catch
      if (typeof date === 'string') {
        // Return the string as-is if it looks like a time description
        if (date.toLowerCase().includes('ago') || 
            date.toLowerCase() === 'just now' || 
            date.toLowerCase() === 'recently') {
          return date;
        }
      }
      console.warn('[formatTimeAgo] Invalid date provided:', date);
      return 'Just now'; // User-friendly fallback instead of "Invalid date"
    }
    
    const now = new Date();
    const diffInMs = now.getTime() - targetDate.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    // Handle future dates (with more reasonable fallback)
    if (diffInMs < 0) {
      const futureDiffMinutes = Math.floor(Math.abs(diffInMs) / (1000 * 60));
      if (futureDiffMinutes < 5) {
        return 'Just now'; // Treat small future differences as "now" (timezone/sync issues)
      }
      return 'Recently'; // More user-friendly than "In the future"
    }
    
    // Less than 1 minute
    if (diffInMinutes < 1) {
      return 'Just now';
    }
    
    // Less than 1 hour
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
    }
    
    // Less than 24 hours
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
    }
    
    // Days ago
    if (diffInDays < 30) {
      return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
    }
    
    // For longer periods, show formatted date
    return targetDate.toLocaleDateString(CANADIAN_LOCALE, {
      timeZone: CANADIAN_TIMEZONE,
      year: 'numeric',
      month: 'short', 
      day: 'numeric'
    });
    
  } catch (error) {
    console.error('[formatTimeAgo] Error formatting date:', error, 'Original date:', date);
    return 'Just now'; // User-friendly fallback instead of "Format error"
  }
}

/**
 * Safe wrapper for formatTimeAgo with additional error handling
 * Use this for GraphQL timestamp fields that might be inconsistent
 * Handles both ISO timestamps and pre-formatted strings from backend
 */
export function safeFormatTimeAgo(
  timestamp: string | Date | null | undefined,
  context: string = 'activity'
): string {
  // Early return for clearly invalid data
  if (timestamp === null || timestamp === undefined) {
    // Don't warn for null/undefined - this is expected sometimes
    return 'Just now';
  }
  
  // Handle empty strings
  if (typeof timestamp === 'string' && timestamp.trim() === '') {
    return 'Just now';
  }
  
  // Handle common problematic values
  if (typeof timestamp === 'string' && (
    timestamp === 'null' || 
    timestamp === 'undefined' || 
    timestamp === '0' ||
    timestamp === 'Invalid Date'
  )) {
    // These are actual problems, but don't log warnings as they're handled gracefully
    return 'Just now';
  }
  
  try {
    return formatTimeAgo(timestamp);
  } catch (error) {
    // Only log actual unexpected errors, not handled cases
    if (__DEV__) {
      console.error(`[safeFormatTimeAgo] Unexpected error in ${context}:`, error, 'Timestamp:', timestamp);
    }
    return 'Just now';
  }
}

/**
 * Formats a date for Canadian display
 * Uses Canadian timezone and locale preferences
 */
export function formatCanadianDate(
  date: string | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = {}
): string {
  if (!date) return 'No date';
  
  try {
    const targetDate = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(targetDate.getTime())) {
      return 'Invalid date';
    }
    
    const defaultOptions: Intl.DateTimeFormatOptions = {
      timeZone: CANADIAN_TIMEZONE,
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options,
    };
    
    return targetDate.toLocaleDateString(CANADIAN_LOCALE, defaultOptions);
  } catch (error) {
    console.error('[formatCanadianDate] Error formatting date:', error);
    return 'Format error';
  }
}

/**
 * Formats a date and time for Canadian display
 */
export function formatCanadianDateTime(
  date: string | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = {}
): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    ...options,
  };
  
  return formatCanadianDate(date, defaultOptions);
}

// =============================================================================
// QUANTITY AND MEASUREMENT FORMATTERS
// =============================================================================

/**
 * Formats quantity with proper pluralization
 */
export function formatQuantity(
  quantity: number | null | undefined, 
  singular: string = 'item', 
  plural?: string
): string {
  if (quantity === null || quantity === undefined) {
    return `0 ${plural || `${singular}s`}`;
  }
  
  if (quantity === 1) {
    return `1 ${singular}`;
  }
  
  return `${quantity} ${plural || `${singular}s`}`;
}

/**
 * Formats weight in Canadian metric system (kg)
 */
export function formatWeight(weightKg: number | null | undefined): string {
  if (!weightKg) return 'Not specified';
  
  // For babies, show grams if under 1kg
  if (weightKg < 1) {
    return `${Math.round(weightKg * 1000)}g`;
  }
  
  return `${weightKg.toFixed(1)}kg`;
}

/**
 * Formats height in Canadian metric system (cm)
 */
export function formatHeight(heightCm: number | null | undefined): string {
  if (!heightCm) return 'Not specified';
  
  return `${heightCm}cm`;
}

/**
 * Formats Canadian currency (CAD)
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) {
    return 'Not specified';
  }
  
  return new Intl.NumberFormat(CANADIAN_LOCALE, {
    style: 'currency',
    currency: 'CAD',
  }).format(amount);
}

/**
 * Gets a time-based greeting based on current local time
 * Uses Canadian timezone for consistency
 */
export function getTimeBasedGreeting(): string {
  try {
    // Get current time in Canadian timezone
    const now = new Date();
    const canadianTime = new Date(now.toLocaleString("en-US", {timeZone: CANADIAN_TIMEZONE}));
    const hour = canadianTime.getHours();
    
    // Determine greeting based on hour ranges
    if (hour >= 5 && hour < 12) {
      return "Good morning!";
    } else if (hour >= 12 && hour < 18) {
      return "Good afternoon!";
    } else if (hour >= 18 && hour < 23) {
      return "Good evening!";
    } else {
      return "Good night!";
    }
  } catch (error) {
    console.error('[getTimeBasedGreeting] Error getting time-based greeting:', error);
    return "Hello!"; // Fallback greeting
  }
}

// =============================================================================
// VALIDATION UTILITIES
// =============================================================================

/**
 * Validates if a string represents a valid date
 */
export function isValidDate(dateString: string | null | undefined): boolean {
  if (!dateString) return false;
  
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * Validates if a field name has a mapping available
 */
export function hasFieldMapping(fieldName: string): boolean {
  if (!fieldName) return false;
  
  const normalizedFieldName = fieldName.toUpperCase();
  return normalizedFieldName in FIELD_NAME_MAPPINGS;
}