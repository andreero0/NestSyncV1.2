/**
 * Enum Display Formatters for NestSync Application
 * 
 * Transforms raw backend enum values into user-friendly display text
 * following Canadian diaper sizing conventions and psychology-driven UX patterns
 */

// =============================================================================
// DIAPER SIZE FORMATTERS
// =============================================================================

/**
 * Maps backend diaper size enums to user-friendly display text
 * Following Canadian diaper sizing standards
 */
export const DIAPER_SIZE_DISPLAY_MAP: Record<string, string> = {
  'NEWBORN': 'Newborn',
  'SIZE_1': 'Size 1',
  'SIZE_2': 'Size 2',
  'SIZE_3': 'Size 3',
  'SIZE_4': 'Size 4',
  'SIZE_5': 'Size 5',
  'SIZE_6': 'Size 6',
  'SIZE_7': 'Size 7',
  // Handle potential backend variations
  'newborn': 'Newborn',
  'size_1': 'Size 1',
  'size_2': 'Size 2',
  'size_3': 'Size 3',
  'size_4': 'Size 4',
  'size_5': 'Size 5',
  'size_6': 'Size 6',
  'size_7': 'Size 7',
};

/**
 * Enhanced diaper size display with weight ranges (Canadian standards)
 * Helpful for parents to understand sizing context
 */
export const DIAPER_SIZE_WITH_WEIGHT_DISPLAY_MAP: Record<string, string> = {
  'NEWBORN': 'Newborn (up to 4.5 kg)',
  'SIZE_1': 'Size 1 (3.5-6 kg)',
  'SIZE_2': 'Size 2 (5-8 kg)',
  'SIZE_3': 'Size 3 (7-11 kg)',
  'SIZE_4': 'Size 4 (10-15 kg)',
  'SIZE_5': 'Size 5 (13-18 kg)',
  'SIZE_6': 'Size 6 (16+ kg)',
  'SIZE_7': 'Size 7 (17+ kg)',
  // Handle potential backend variations
  'newborn': 'Newborn (up to 4.5 kg)',
  'size_1': 'Size 1 (3.5-6 kg)',
  'size_2': 'Size 2 (5-8 kg)',
  'size_3': 'Size 3 (7-11 kg)',
  'size_4': 'Size 4 (10-15 kg)',
  'size_5': 'Size 5 (13-18 kg)',
  'size_6': 'Size 6 (16+ kg)',
  'size_7': 'Size 7 (17+ kg)',
};

/**
 * Formats diaper size enum to user-friendly display text
 * 
 * @param sizeEnum - Raw backend enum value (e.g., "SIZE_1", "NEWBORN")
 * @param includeWeightRange - Whether to include weight range in display
 * @returns User-friendly size text (e.g., "Size 1", "Newborn (up to 4.5 kg)")
 */
export function formatDiaperSize(
  sizeEnum: string | undefined | null, 
  includeWeightRange: boolean = false
): string {
  if (!sizeEnum) {
    return 'Unknown Size';
  }

  const displayMap = includeWeightRange 
    ? DIAPER_SIZE_WITH_WEIGHT_DISPLAY_MAP 
    : DIAPER_SIZE_DISPLAY_MAP;

  // Handle both uppercase and lowercase variations
  const normalizedSize = sizeEnum.toUpperCase();
  
  return displayMap[normalizedSize] || displayMap[sizeEnum] || sizeEnum;
}

// =============================================================================
// GENDER FORMATTERS
// =============================================================================

/**
 * Maps backend gender enums to user-friendly display text
 */
export const GENDER_DISPLAY_MAP: Record<string, string> = {
  'BOY': 'Boy',
  'GIRL': 'Girl',
  'OTHER': 'Other',
  'PREFER_NOT_TO_SAY': 'Prefer not to say',
  // Handle potential backend variations
  'boy': 'Boy',
  'girl': 'Girl',
  'other': 'Other',
  'prefer_not_to_say': 'Prefer not to say',
};

/**
 * Formats gender enum to user-friendly display text
 * 
 * @param genderEnum - Raw backend enum value
 * @returns User-friendly gender text
 */
export function formatGender(genderEnum: string | undefined | null): string {
  if (!genderEnum) {
    return 'Not specified';
  }

  const normalizedGender = genderEnum.toUpperCase();
  return GENDER_DISPLAY_MAP[normalizedGender] || GENDER_DISPLAY_MAP[genderEnum] || genderEnum;
}

// =============================================================================
// PRODUCT TYPE FORMATTERS
// =============================================================================

/**
 * Maps backend product type enums to user-friendly display text
 */
export const PRODUCT_TYPE_DISPLAY_MAP: Record<string, string> = {
  'DIAPER': 'Diapers',
  'WIPES': 'Wipes',
  'DIAPER_CREAM': 'Diaper Cream',
  'POWDER': 'Powder',
  'DIAPER_BAGS': 'Diaper Bags',
  'TRAINING_PANTS': 'Training Pants',
  'SWIMWEAR': 'Swim Diapers',
  // Handle potential backend variations
  'diaper': 'Diapers',
  'wipes': 'Wipes',
  'diaper_cream': 'Diaper Cream',
  'powder': 'Powder',
  'diaper_bags': 'Diaper Bags',
  'training_pants': 'Training Pants',
  'swimwear': 'Swim Diapers',
};

/**
 * Formats product type enum to user-friendly display text
 * 
 * @param productTypeEnum - Raw backend enum value
 * @returns User-friendly product type text
 */
export function formatProductType(productTypeEnum: string | undefined | null): string {
  if (!productTypeEnum) {
    return 'Unknown Product';
  }

  const normalizedType = productTypeEnum.toUpperCase();
  return PRODUCT_TYPE_DISPLAY_MAP[normalizedType] || PRODUCT_TYPE_DISPLAY_MAP[productTypeEnum] || productTypeEnum;
}

// =============================================================================
// USAGE TYPE FORMATTERS
// =============================================================================

/**
 * Maps backend usage type enums to user-friendly display text
 */
export const USAGE_TYPE_DISPLAY_MAP: Record<string, string> = {
  'DIAPER_CHANGE': 'Diaper Change',
  'WIPE_USE': 'Wipe Use',
  'CREAM_APPLICATION': 'Cream Application',
  'ACCIDENT_CLEANUP': 'Accident Cleanup',
  'PREVENTIVE_CHANGE': 'Preventive Change',
  'OVERNIGHT_CHANGE': 'Overnight Change',
  // Handle potential backend variations
  'diaper_change': 'Diaper Change',
  'wipe_use': 'Wipe Use',
  'cream_application': 'Cream Application',
  'accident_cleanup': 'Accident Cleanup',
  'preventive_change': 'Preventive Change',
  'overnight_change': 'Overnight Change',
};

/**
 * Formats usage type enum to user-friendly display text
 * 
 * @param usageTypeEnum - Raw backend enum value
 * @returns User-friendly usage type text
 */
export function formatUsageType(usageTypeEnum: string | undefined | null): string {
  if (!usageTypeEnum) {
    return 'Unknown Activity';
  }

  const normalizedType = usageTypeEnum.toUpperCase();
  return USAGE_TYPE_DISPLAY_MAP[normalizedType] || USAGE_TYPE_DISPLAY_MAP[usageTypeEnum] || usageTypeEnum;
}

// =============================================================================
// CONTEXT FORMATTERS
// =============================================================================

/**
 * Maps backend context enums to user-friendly display text
 */
export const CONTEXT_DISPLAY_MAP: Record<string, string> = {
  'HOME': 'At Home',
  'DAYCARE': 'At Daycare',
  'OUTING': 'On an Outing',
  'TRAVEL': 'While Traveling',
  'GRANDPARENTS': "At Grandparents'",
  'OTHER': 'Other Location',
  // Handle potential backend variations
  'home': 'At Home',
  'daycare': 'At Daycare',
  'outing': 'On an Outing',
  'travel': 'While Traveling',
  'grandparents': "At Grandparents'",
  'other': 'Other Location',
};

/**
 * Formats context enum to user-friendly display text
 * 
 * @param contextEnum - Raw backend enum value
 * @returns User-friendly context text
 */
export function formatContext(contextEnum: string | undefined | null): string {
  if (!contextEnum) {
    return 'At Home'; // Default context
  }

  const normalizedContext = contextEnum.toUpperCase();
  return CONTEXT_DISPLAY_MAP[normalizedContext] || CONTEXT_DISPLAY_MAP[contextEnum] || contextEnum;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Generic enum formatter with custom display map
 * Use this for any custom enum transformations not covered by specific formatters
 * 
 * @param enumValue - Raw backend enum value
 * @param displayMap - Custom mapping of enum values to display text
 * @param fallback - Fallback text if enum value is not found
 * @returns Formatted display text
 */
export function formatEnum(
  enumValue: string | undefined | null,
  displayMap: Record<string, string>,
  fallback: string = 'Unknown'
): string {
  if (!enumValue) {
    return fallback;
  }

  // Try both original and uppercase versions
  return displayMap[enumValue] || displayMap[enumValue.toUpperCase()] || fallback;
}

/**
 * Capitalizes the first letter of a string and lowercases the rest
 * Useful for enum values that need basic formatting
 * 
 * @param str - String to capitalize
 * @returns Capitalized string
 */
export function capitalizeFirst(str: string | undefined | null): string {
  if (!str) {
    return '';
  }

  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Converts snake_case or SCREAMING_SNAKE_CASE to Title Case
 * Useful for enum values that follow naming conventions
 * 
 * @param str - Snake case string to format
 * @returns Title case string
 */
export function snakeToTitleCase(str: string | undefined | null): string {
  if (!str) {
    return '';
  }

  return str
    .toLowerCase()
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// =============================================================================
// PSYCHOLOGY-DRIVEN UX HELPERS
// =============================================================================

/**
 * Formats diaper size with encouraging parent-friendly language
 * Reduces stress by providing context and reassurance
 * 
 * @param sizeEnum - Raw backend enum value
 * @param childAge - Child age in months (optional)
 * @returns Encouraging size text with context
 */
export function formatDiaperSizeWithContext(
  sizeEnum: string | undefined | null,
  childAge?: number
): string {
  const basicSize = formatDiaperSize(sizeEnum);
  
  if (!childAge) {
    return basicSize;
  }

  // Add age-appropriate context for stress reduction
  if (sizeEnum === 'NEWBORN' && childAge > 3) {
    return `${basicSize} (growing fast!)`;
  } else if (sizeEnum === 'SIZE_1' && childAge > 6) {
    return `${basicSize} (right on track)`;
  } else if (childAge < 2) {
    return `${basicSize} (perfect for little ones)`;
  }
  
  return basicSize;
}

/**
 * Formats any field value with fallback for empty states
 * Provides reassuring language instead of technical "null" or "undefined"
 * 
 * @param value - Field value to format
 * @param fieldType - Type of field for context-appropriate fallback
 * @returns User-friendly display text
 */
export function formatFieldWithFallback(
  value: any,
  fieldType: 'size' | 'time' | 'count' | 'text' | 'status' = 'text'
): string {
  if (value === null || value === undefined || value === '') {
    switch (fieldType) {
      case 'size':
        return 'Size not set';
      case 'time':
        return 'Not tracked yet';
      case 'count':
        return '0';
      case 'status':
        return 'Getting started';
      default:
        return 'Not available';
    }
  }

  return String(value);
}