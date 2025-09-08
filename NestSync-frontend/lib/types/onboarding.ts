/**
 * Onboarding Types
 * Type definitions for the NestSync onboarding flow
 */

export interface ChildInfo {
  name: string;
  birthDate: Date;
  gender: 'BOY' | 'GIRL' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  currentWeight?: number; // in grams
  notes?: string;
}

export interface DiaperInventory {
  brandName: string;
  size: 'NEWBORN' | 'SIZE_1' | 'SIZE_2' | 'SIZE_3' | 'SIZE_4' | 'SIZE_5' | 'SIZE_6';
  quantity: number;
  type: 'DISPOSABLE' | 'CLOTH';
  absorbency?: 'REGULAR' | 'EXTRA' | 'OVERNIGHT';
}

export interface NotificationPreferences {
  changeReminders: boolean;
  changeReminderInterval: number; // minutes
  lowInventoryAlerts: boolean;
  lowInventoryThreshold: number; // quantity
  weeklyReports: boolean;
  monthlyReports: boolean;
  tipsSuggestions: boolean;
  marketingEmails: boolean;
}

export interface OnboardingData {
  childInfo: ChildInfo | null;
  inventory: DiaperInventory[];
  notificationPreferences: NotificationPreferences | null;
  currentPhase: number;
}

// Gender options for forms (matching backend GraphQL GenderType enum)
export const GENDER_OPTIONS = [
  { value: 'BOY', label: 'Boy' },
  { value: 'GIRL', label: 'Girl' },
  { value: 'OTHER', label: 'Other' },
  { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' },
];

// Diaper size options
export const DIAPER_SIZE_OPTIONS = [
  { value: 'NEWBORN', label: 'Newborn' },
  { value: 'SIZE_1', label: 'Size 1' },
  { value: 'SIZE_2', label: 'Size 2' },
  { value: 'SIZE_3', label: 'Size 3' },
  { value: 'SIZE_4', label: 'Size 4' },
  { value: 'SIZE_5', label: 'Size 5' },
  { value: 'SIZE_6', label: 'Size 6' },
];

// Diaper type options
export const DIAPER_TYPE_OPTIONS = [
  { value: 'DISPOSABLE', label: 'Disposable' },
  { value: 'CLOTH', label: 'Cloth' },
];

// Absorbency options
export const ABSORBENCY_OPTIONS = [
  { value: 'REGULAR', label: 'Regular' },
  { value: 'EXTRA', label: 'Extra' },
  { value: 'OVERNIGHT', label: 'Overnight' },
];