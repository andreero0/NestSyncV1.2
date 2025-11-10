/**
 * Canadian Tax Calculation Utility
 * 
 * Provides tax calculation and formatting utilities for Canadian provincial taxes.
 * Supports GST, PST, and HST across all Canadian provinces and territories.
 */

/**
 * Interface defining provincial tax configuration
 */
export interface ProvincialTax {
  /** Two-letter province/territory code */
  province: 'ON' | 'BC' | 'AB' | 'SK' | 'MB' | 'QC' | 'NB' | 'NS' | 'PE' | 'NL' | 'YT' | 'NT' | 'NU';
  /** Federal Goods and Services Tax percentage (0 if HST is used) */
  gst: number;
  /** Provincial Sales Tax percentage (0 if not applicable) */
  pst: number;
  /** Harmonized Sales Tax percentage (0 if GST+PST is used) */
  hst: number;
  /** Human-readable tax name for display (e.g., "GST + PST", "HST", "GST") */
  displayName: string;
  /** Combined total tax rate percentage */
  totalRate: number;
  /** Full province/territory name */
  fullName: string;
}

/**
 * Canadian provincial and territorial tax rates
 * Updated as of 2025
 */
export const CANADIAN_TAX_RATES: Record<string, ProvincialTax> = {
  // Harmonized Sales Tax (HST) Provinces
  ON: {
    province: 'ON',
    gst: 0,
    pst: 0,
    hst: 13,
    displayName: 'HST',
    totalRate: 13,
    fullName: 'Ontario'
  },
  NB: {
    province: 'NB',
    gst: 0,
    pst: 0,
    hst: 15,
    displayName: 'HST',
    totalRate: 15,
    fullName: 'New Brunswick'
  },
  NS: {
    province: 'NS',
    gst: 0,
    pst: 0,
    hst: 15,
    displayName: 'HST',
    totalRate: 15,
    fullName: 'Nova Scotia'
  },
  PE: {
    province: 'PE',
    gst: 0,
    pst: 0,
    hst: 15,
    displayName: 'HST',
    totalRate: 15,
    fullName: 'Prince Edward Island'
  },
  NL: {
    province: 'NL',
    gst: 0,
    pst: 0,
    hst: 15,
    displayName: 'HST',
    totalRate: 15,
    fullName: 'Newfoundland and Labrador'
  },
  
  // GST + PST Provinces
  BC: {
    province: 'BC',
    gst: 5,
    pst: 7,
    hst: 0,
    displayName: 'GST + PST',
    totalRate: 12,
    fullName: 'British Columbia'
  },
  SK: {
    province: 'SK',
    gst: 5,
    pst: 6,
    hst: 0,
    displayName: 'GST + PST',
    totalRate: 11,
    fullName: 'Saskatchewan'
  },
  MB: {
    province: 'MB',
    gst: 5,
    pst: 7,
    hst: 0,
    displayName: 'GST + PST',
    totalRate: 12,
    fullName: 'Manitoba'
  },
  QC: {
    province: 'QC',
    gst: 5,
    pst: 9.975,
    hst: 0,
    displayName: 'GST + QST',
    totalRate: 14.975,
    fullName: 'Quebec'
  },
  
  // GST Only (No Provincial Tax)
  AB: {
    province: 'AB',
    gst: 5,
    pst: 0,
    hst: 0,
    displayName: 'GST',
    totalRate: 5,
    fullName: 'Alberta'
  },
  YT: {
    province: 'YT',
    gst: 5,
    pst: 0,
    hst: 0,
    displayName: 'GST',
    totalRate: 5,
    fullName: 'Yukon'
  },
  NT: {
    province: 'NT',
    gst: 5,
    pst: 0,
    hst: 0,
    displayName: 'GST',
    totalRate: 5,
    fullName: 'Northwest Territories'
  },
  NU: {
    province: 'NU',
    gst: 5,
    pst: 0,
    hst: 0,
    displayName: 'GST',
    totalRate: 5,
    fullName: 'Nunavut'
  }
};

/**
 * Default fallback tax configuration for unknown provinces
 */
const DEFAULT_TAX: ProvincialTax = {
  province: 'ON',
  gst: 0,
  pst: 0,
  hst: 13,
  displayName: 'HST',
  totalRate: 13,
  fullName: 'Unknown'
};

/**
 * Get provincial tax configuration for a given province code
 * 
 * @param provinceCode - Two-letter province/territory code (e.g., 'ON', 'BC')
 * @returns Provincial tax configuration
 * 
 * @example
 * ```typescript
 * const ontarioTax = getProvincialTax('ON');
 * console.log(ontarioTax.totalRate); // 13
 * ```
 */
export function getProvincialTax(provinceCode: string | null | undefined): ProvincialTax {
  if (!provinceCode) {
    return DEFAULT_TAX;
  }
  
  const normalizedCode = provinceCode.toUpperCase().trim();
  return CANADIAN_TAX_RATES[normalizedCode] || DEFAULT_TAX;
}

/**
 * Calculate tax amount for a given price and province
 * 
 * @param price - Base price before tax (in dollars)
 * @param provinceCode - Two-letter province/territory code
 * @returns Object containing tax breakdown and total
 * 
 * @example
 * ```typescript
 * const result = calculateTaxAmount(4.99, 'ON');
 * // Returns: { basePrice: 4.99, taxAmount: 0.65, totalPrice: 5.64, taxRate: 13 }
 * ```
 */
export function calculateTaxAmount(
  price: number,
  provinceCode: string | null | undefined
): {
  basePrice: number;
  taxAmount: number;
  totalPrice: number;
  taxRate: number;
  provincialTax: ProvincialTax;
} {
  const provincialTax = getProvincialTax(provinceCode);
  const taxAmount = (price * provincialTax.totalRate) / 100;
  const totalPrice = price + taxAmount;
  
  return {
    basePrice: price,
    taxAmount: parseFloat(taxAmount.toFixed(2)),
    totalPrice: parseFloat(totalPrice.toFixed(2)),
    taxRate: provincialTax.totalRate,
    provincialTax
  };
}

/**
 * Format tax display string for user-facing UI
 * 
 * @param price - Base price before tax (in dollars)
 * @param provinceCode - Two-letter province/territory code
 * @param options - Formatting options
 * @returns Formatted tax display string
 * 
 * @example
 * ```typescript
 * formatTaxDisplay(4.99, 'ON');
 * // Returns: "$5.64 CAD/month (includes 13% HST)"
 * 
 * formatTaxDisplay(4.99, 'BC', { showBreakdown: true });
 * // Returns: "$5.64 CAD/month (includes 5% GST + 7% PST)"
 * 
 * formatTaxDisplay(4.99, 'ON', { interval: 'year' });
 * // Returns: "$5.64 CAD/year (includes 13% HST)"
 * ```
 */
export function formatTaxDisplay(
  price: number,
  provinceCode: string | null | undefined,
  options: {
    interval?: 'month' | 'year';
    showBreakdown?: boolean;
    showCurrency?: boolean;
  } = {}
): string {
  const {
    interval = 'month',
    showBreakdown = false,
    showCurrency = true
  } = options;
  
  const { totalPrice, provincialTax } = calculateTaxAmount(price, provinceCode);
  
  // Format price
  const priceStr = totalPrice.toFixed(2);
  const currencyStr = showCurrency ? ' CAD' : '';
  const intervalStr = `/${interval}`;
  
  // Format tax breakdown
  let taxStr: string;
  
  if (showBreakdown && provincialTax.gst > 0 && provincialTax.pst > 0) {
    // Show GST + PST breakdown
    taxStr = `${provincialTax.gst}% GST + ${provincialTax.pst}% ${provincialTax.province === 'QC' ? 'QST' : 'PST'}`;
  } else if (provincialTax.hst > 0) {
    // Show HST
    taxStr = `${provincialTax.hst}% HST`;
  } else if (provincialTax.gst > 0) {
    // Show GST only
    taxStr = `${provincialTax.gst}% GST`;
  } else {
    // Fallback
    taxStr = 'applicable taxes';
  }
  
  return `$${priceStr}${currencyStr}${intervalStr} (includes ${taxStr})`;
}

/**
 * Format short tax display for compact UI elements
 * 
 * @param provinceCode - Two-letter province/territory code
 * @returns Short tax display string (e.g., "13% HST", "5% GST + 7% PST")
 * 
 * @example
 * ```typescript
 * formatShortTaxDisplay('ON'); // Returns: "13% HST"
 * formatShortTaxDisplay('BC'); // Returns: "12% GST + PST"
 * formatShortTaxDisplay('AB'); // Returns: "5% GST"
 * ```
 */
export function formatShortTaxDisplay(provinceCode: string | null | undefined): string {
  const provincialTax = getProvincialTax(provinceCode);
  
  if (provincialTax.hst > 0) {
    return `${provincialTax.hst}% HST`;
  } else if (provincialTax.gst > 0 && provincialTax.pst > 0) {
    return `${provincialTax.totalRate}% ${provincialTax.displayName}`;
  } else if (provincialTax.gst > 0) {
    return `${provincialTax.gst}% GST`;
  }
  
  return 'Tax included';
}

/**
 * Check if a province code is valid
 * 
 * @param provinceCode - Two-letter province/territory code
 * @returns True if the province code is valid
 * 
 * @example
 * ```typescript
 * isValidProvinceCode('ON'); // Returns: true
 * isValidProvinceCode('XX'); // Returns: false
 * ```
 */
export function isValidProvinceCode(provinceCode: string | null | undefined): boolean {
  if (!provinceCode) {
    return false;
  }
  
  const normalizedCode = provinceCode.toUpperCase().trim();
  return normalizedCode in CANADIAN_TAX_RATES;
}

/**
 * Get all available province codes
 * 
 * @returns Array of all valid province/territory codes
 * 
 * @example
 * ```typescript
 * const provinces = getAllProvinceCodes();
 * // Returns: ['ON', 'BC', 'AB', 'SK', 'MB', 'QC', 'NB', 'NS', 'PE', 'NL', 'YT', 'NT', 'NU']
 * ```
 */
export function getAllProvinceCodes(): string[] {
  return Object.keys(CANADIAN_TAX_RATES);
}

/**
 * Get all provincial tax configurations
 * 
 * @returns Array of all provincial tax configurations
 * 
 * @example
 * ```typescript
 * const allTaxes = getAllProvincialTaxes();
 * allTaxes.forEach(tax => {
 *   console.log(`${tax.fullName}: ${tax.totalRate}%`);
 * });
 * ```
 */
export function getAllProvincialTaxes(): ProvincialTax[] {
  return Object.values(CANADIAN_TAX_RATES);
}
