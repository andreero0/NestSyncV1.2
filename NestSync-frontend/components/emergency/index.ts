/**
 * Emergency Components Index
 *
 * This module exports all emergency-related components for the NestSync
 * Emergency Flows feature. These components provide offline-first emergency
 * assistance with Canadian healthcare integration and PIPEDA compliance.
 *
 * Features:
 * - MMKV encrypted storage for <100ms emergency data access
 * - Psychology-driven UX for stress reduction during emergencies
 * - High contrast design with large touch targets (60x60dp minimum)
 * - One-tap calling to Canadian emergency services
 * - QR code generation for first responder information sharing
 * - Provincial health card integration
 *
 * Usage:
 * ```typescript
 * import {
 *   EmergencyModeButton,
 *   EmergencyDashboard,
 *   EmergencyContactCard,
 *   MedicalInfoCard,
 *   EmergencyShareModal
 * } from '../components/emergency';
 * ```
 */

// Core emergency components
export { default as EmergencyModeButton } from './EmergencyModeButton';
export { default as EmergencyDashboard } from './EmergencyDashboard';
export { default as EmergencyContactCard } from './EmergencyContactCard';
export { default as MedicalInfoCard } from './MedicalInfoCard';
export { default as EmergencyShareModal } from './EmergencyShareModal';

// Emergency storage service and types
export {
  // emergencyStorage, // Temporarily commented for web compatibility
  type EmergencyContact,
  type MedicalInfo,
  type EmergencyProfile,
} from '../../lib/storage/EmergencyStorageService';

// Emergency utility functions
export const EmergencyUtils = {
  /**
   * Format Canadian phone numbers for emergency contacts
   */
  formatCanadianPhone: (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  },

  /**
   * Validate Canadian health card number format by province
   */
  validateHealthCard: (healthCard: string, province: string): boolean => {
    const cleaned = healthCard.replace(/\D/g, '');

    switch (province.toUpperCase()) {
      case 'ON': // Ontario
        return cleaned.length === 10;
      case 'BC': // British Columbia
        return cleaned.length === 10;
      case 'AB': // Alberta
        return cleaned.length === 9;
      case 'QC': // Quebec
        return cleaned.length === 12;
      case 'MB': // Manitoba
        return cleaned.length === 9;
      case 'SK': // Saskatchewan
        return cleaned.length === 9;
      case 'NS': // Nova Scotia
        return cleaned.length === 10;
      case 'NB': // New Brunswick
        return cleaned.length === 9;
      case 'NL': // Newfoundland and Labrador
        return cleaned.length === 12;
      case 'PE': // Prince Edward Island
        return cleaned.length === 9;
      case 'NT': // Northwest Territories
        return cleaned.length === 9;
      case 'YT': // Yukon
        return cleaned.length === 10;
      case 'NU': // Nunavut
        return cleaned.length === 9;
      default:
        return cleaned.length >= 9 && cleaned.length <= 12;
    }
  },

  /**
   * Get Canadian emergency numbers by province/territory
   */
  getEmergencyNumbers: (province?: string) => ({
    emergency: '911',
    poisonControl: '18002685391', // National Poison Control
    telehealth: province === 'ON' ? '8664797' : '811', // Telehealth Ontario or national 811
    kidsHelpPhone: '18006686868',
  }),

  /**
   * Generate emergency contact priority sorting
   */
  sortEmergencyContacts: (contacts: any[]) => {
    return contacts.sort((a, b) => {
      // Primary contacts first
      if (a.isPrimary && !b.isPrimary) return -1;
      if (!a.isPrimary && b.isPrimary) return 1;

      // Then by relationship priority
      const relationshipPriority: { [key: string]: number } = {
        'parent': 1,
        'guardian': 2,
        'spouse': 3,
        'family': 4,
        'friend': 5,
        'other': 6,
      };

      const aPriority = relationshipPriority[a.relationship.toLowerCase()] || 6;
      const bPriority = relationshipPriority[b.relationship.toLowerCase()] || 6;

      return aPriority - bPriority;
    });
  },
};

/**
 * Emergency component configuration constants
 */
export const EmergencyConfig = {
  // Storage performance thresholds
  STORAGE_PERFORMANCE_THRESHOLD_MS: 100,

  // Touch target minimums (Android accessibility guidelines)
  MIN_TOUCH_TARGET_SIZE: 60,

  // Emergency theme colors
  COLORS: {
    EMERGENCY_RED: '#FF3B30',
    EMERGENCY_RED_DARK: '#D70015',
    WARNING_ORANGE: '#FF6B00',
    MEDICAL_BLUE: '#007AFF',
    SUCCESS_GREEN: '#34C759',
    BACKGROUND_WHITE: '#FFFFFF',
    TEXT_PRIMARY: '#000000',
    TEXT_SECONDARY: '#666666',
    BORDER_LIGHT: '#E5E5E7',
  },

  // Canadian province codes
  PROVINCES: [
    { code: 'AB', name: 'Alberta' },
    { code: 'BC', name: 'British Columbia' },
    { code: 'MB', name: 'Manitoba' },
    { code: 'NB', name: 'New Brunswick' },
    { code: 'NL', name: 'Newfoundland and Labrador' },
    { code: 'NS', name: 'Nova Scotia' },
    { code: 'NT', name: 'Northwest Territories' },
    { code: 'NU', name: 'Nunavut' },
    { code: 'ON', name: 'Ontario' },
    { code: 'PE', name: 'Prince Edward Island' },
    { code: 'QC', name: 'Quebec' },
    { code: 'SK', name: 'Saskatchewan' },
    { code: 'YT', name: 'Yukon' },
  ],

  // Emergency action types for analytics
  EMERGENCY_ACTIONS: {
    CALL_911: 'call_911',
    CALL_POISON_CONTROL: 'call_poison_control',
    CALL_TELEHEALTH: 'call_telehealth',
    CALL_EMERGENCY_CONTACT: 'call_emergency_contact',
    SHARE_MEDICAL_INFO: 'share_medical_info',
    ENTER_EMERGENCY_MODE: 'enter_emergency_mode',
    EXIT_EMERGENCY_MODE: 'exit_emergency_mode',
  },
} as const;