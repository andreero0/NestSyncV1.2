/**
 * GraphQL Mutations for NestSync Application
 * Includes diaper logging, inventory management, and child management
 */

import { gql } from '@apollo/client';
import {
  CHILD_PROFILE_FRAGMENT,
  USAGE_LOG_FRAGMENT,
  INVENTORY_ITEM_FRAGMENT,
  DASHBOARD_STATS_FRAGMENT,
  NOTIFICATION_PREFERENCES_FRAGMENT,
  NOTIFICATION_DELIVERY_LOG_FRAGMENT
} from './fragments';

// =============================================================================
// DIAPER LOGGING MUTATIONS
// =============================================================================

export const LOG_DIAPER_CHANGE_MUTATION = gql`
  mutation LogDiaperChange($input: LogDiaperChangeInput!) {
    logDiaperChange(input: $input) {
      success
      message
      error
      usageLog {
        ...UsageLogFragment
      }
      updatedInventoryItems {
        ...InventoryItemFragment
      }
    }
  }
  ${USAGE_LOG_FRAGMENT}
  ${INVENTORY_ITEM_FRAGMENT}
`;

// =============================================================================
// CHILD MANAGEMENT MUTATIONS
// =============================================================================

export const CREATE_CHILD_MUTATION = gql`
  mutation CreateChild($input: CreateChildInput!) {
    createChild(input: $input) {
      success
      message
      error
      child {
        ...ChildProfileFragment
      }
    }
  }
  ${CHILD_PROFILE_FRAGMENT}
`;

export const UPDATE_CHILD_MUTATION = gql`
  mutation UpdateChild($childId: ID!, $input: UpdateChildInput!) {
    updateChild(childId: $childId, input: $input) {
      success
      message
      error
      child {
        ...ChildProfileFragment
      }
    }
  }
  ${CHILD_PROFILE_FRAGMENT}
`;

export const DELETE_CHILD_MUTATION = gql`
  mutation DeleteChild($childId: ID!) {
    deleteChild(childId: $childId) {
      success
      message
      error
    }
  }
`;

// =============================================================================
// INVENTORY MANAGEMENT MUTATIONS
// =============================================================================

export const CREATE_INVENTORY_ITEM_MUTATION = gql`
  mutation CreateInventoryItem($input: CreateInventoryItemInput!) {
    createInventoryItem(input: $input) {
      success
      message
      error
      inventoryItem {
        ...InventoryItemFragment
      }
    }
  }
  ${INVENTORY_ITEM_FRAGMENT}
`;

export const UPDATE_INVENTORY_ITEM_MUTATION = gql`
  mutation UpdateInventoryItem($inventoryItemId: ID!, $input: UpdateInventoryItemInput!) {
    updateInventoryItem(inventoryItemId: $inventoryItemId, input: $input) {
      success
      message
      error
      inventoryItem {
        ...InventoryItemFragment
      }
    }
  }
  ${INVENTORY_ITEM_FRAGMENT}
`;

export const DELETE_INVENTORY_ITEM_MUTATION = gql`
  mutation DeleteInventoryItem($inventoryItemId: ID!, $input: DeleteInventoryItemInput!) {
    deleteInventoryItem(inventoryItemId: $inventoryItemId, input: $input) {
      success
      message
      error
    }
  }
`;

export const SET_INITIAL_INVENTORY_MUTATION = gql`
  mutation SetInitialInventory($childId: ID!, $inventoryItems: [InitialInventoryInput!]!) {
    setInitialInventory(childId: $childId, inventoryItems: $inventoryItems) {
      success
      message
      error
    }
  }
`;

// =============================================================================
// ONBOARDING MUTATIONS
// =============================================================================

export const COMPLETE_ONBOARDING_STEP_MUTATION = gql`
  mutation CompleteOnboardingStep($childId: ID!, $input: OnboardingWizardStepInput!) {
    completeOnboardingStep(childId: $childId, input: $input) {
      success
      message
      error
    }
  }
`;

export const COMPLETE_ONBOARDING_MUTATION = gql`
  mutation CompleteOnboarding {
    completeOnboarding {
      success
      message
      error
    }
  }
`;


// =============================================================================
// TYPE DEFINITIONS FOR TYPESCRIPT
// =============================================================================

// Diaper Change Input Types
export interface LogDiaperChangeInput {
  childId: string;
  usageType?: 'DIAPER_CHANGE' | 'WIPE_USE' | 'CREAM_APPLICATION' | 'ACCIDENT_CLEANUP' | 'PREVENTIVE_CHANGE' | 'OVERNIGHT_CHANGE';
  context?: 'HOME' | 'DAYCARE' | 'OUTING' | 'TRAVEL' | 'GRANDPARENTS' | 'OTHER';
  caregiverName?: string;
  wasWet?: boolean;
  wasSoiled?: boolean;
  diaperCondition?: string;
  hadLeakage?: boolean;
  notes?: string;
  loggedAt?: string; // ISO string
}

export interface LogDiaperChangeResponse {
  success: boolean;
  message?: string;
  error?: string;
  usageLog?: {
    id: string;
    childId: string;
    inventoryItemId?: string;
    usageType: string;
    loggedAt: string;
    quantityUsed: number;
    context?: string;
    caregiverName?: string;
    wasWet?: boolean;
    wasSoiled?: boolean;
    diaperCondition?: string;
    hadLeakage?: boolean;
    productRating?: number;
    timeSinceLastChange?: number;
    changeDuration?: number;
    notes?: string;
    healthNotes?: string;
    createdAt: string;
  };
  updatedInventoryItems?: Array<{
    id: string;
    childId: string;
    productType: string;
    brand: string;
    productName?: string;
    size: string;
    quantityTotal: number;
    quantityRemaining: number;
    quantityReserved: number;
    purchaseDate: string;
    costCad?: number;
    expiryDate?: string;
    storageLocation?: string;
    isOpened: boolean;
    openedDate?: string;
    notes?: string;
    qualityRating?: number;
    wouldRebuy?: boolean;
    createdAt: string;
    quantityAvailable: number;
    usagePercentage: number;
    isExpired: boolean;
    daysUntilExpiry?: number;
  }>;
}

// Child Management Input Types
export interface CreateChildInput {
  name: string;
  dateOfBirth: string; // Date in ISO format
  gender?: 'BOY' | 'GIRL' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  currentDiaperSize: 'NEWBORN' | 'SIZE_1' | 'SIZE_2' | 'SIZE_3' | 'SIZE_4' | 'SIZE_5' | 'SIZE_6' | 'SIZE_7';
  currentWeightKg?: number;
  currentHeightCm?: number;
  dailyUsageCount?: number;
  hasSensitiveSkin?: boolean;
  hasAllergies?: boolean;
  allergiesNotes?: string;
  preferredBrands?: string[];
  specialNeeds?: string;
}

export interface UpdateChildInput {
  name?: string;
  currentDiaperSize?: 'NEWBORN' | 'SIZE_1' | 'SIZE_2' | 'SIZE_3' | 'SIZE_4' | 'SIZE_5' | 'SIZE_6' | 'SIZE_7';
  currentWeightKg?: number;
  currentHeightCm?: number;
  dailyUsageCount?: number;
  hasSensitiveSkin?: boolean;
  hasAllergies?: boolean;
  allergiesNotes?: string;
  preferredBrands?: string[];
  specialNeeds?: string;
}

// Inventory Input Types
export interface CreateInventoryItemInput {
  childId: string;
  productType: 'DIAPER' | 'WIPES' | 'DIAPER_CREAM' | 'POWDER' | 'DIAPER_BAGS' | 'TRAINING_PANTS' | 'SWIMWEAR';
  brand: string;
  productName?: string;
  size: string;
  quantityTotal: number;
  costCad?: number;
  expiryDate?: string; // ISO string
  storageLocation?: string;
  notes?: string;
}

export interface UpdateInventoryItemInput {
  quantityRemaining?: number;
  storageLocation?: string;
  notes?: string;
  qualityRating?: number;
  wouldRebuy?: boolean;
}

export interface DeleteInventoryItemInput {
  confirmationText: string;
  reason?: string;
}

export interface UpdateInventoryItemResponse {
  success: boolean;
  message?: string;
  error?: string;
  inventoryItem?: {
    id: string;
    childId: string;
    productType: string;
    brand: string;
    productName?: string;
    size: string;
    quantityTotal: number;
    quantityRemaining: number;
    quantityReserved: number;
    purchaseDate: string;
    costCad?: number;
    expiryDate?: string;
    storageLocation?: string;
    isOpened: boolean;
    openedDate?: string;
    notes?: string;
    qualityRating?: number;
    wouldRebuy?: boolean;
    createdAt: string;
    quantityAvailable: number;
    usagePercentage: number;
    isExpired: boolean;
    daysUntilExpiry?: number;
  };
}

export interface DeleteInventoryItemResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface InitialInventoryInput {
  diaperSize: 'NEWBORN' | 'SIZE_1' | 'SIZE_2' | 'SIZE_3' | 'SIZE_4' | 'SIZE_5' | 'SIZE_6' | 'SIZE_7';
  brand: string;
  quantity: number;
  purchaseDate?: string; // Date in ISO format
  expiryDate?: string; // Date in ISO format
}

// Onboarding Input Types
export interface OnboardingWizardStepInput {
  stepName: string;
  data?: string;
}


export interface GetUsageLogsVariables {
  childId: string;
  usageType?: 'DIAPER_CHANGE' | 'WIPE_USE' | 'CREAM_APPLICATION' | 'ACCIDENT_CLEANUP' | 'PREVENTIVE_CHANGE' | 'OVERNIGHT_CHANGE';
  daysBack?: number;
  limit?: number;
  offset?: number;
}

export interface GetInventoryItemsVariables {
  childId: string;
  productType?: 'DIAPER' | 'WIPES' | 'DIAPER_CREAM' | 'POWDER' | 'DIAPER_BAGS' | 'TRAINING_PANTS' | 'SWIMWEAR';
  limit?: number;
  offset?: number;
}

// =============================================================================
// NOTIFICATION MUTATIONS
// =============================================================================

export const UPDATE_NOTIFICATION_PREFERENCES_MUTATION = gql`
  mutation UpdateNotificationPreferences($input: UpdateNotificationPreferencesInput!) {
    updateNotificationPreferences(input: $input) {
      success
      message
      error
      preferences {
        ...NotificationPreferencesFragment
      }
    }
  }
  ${NOTIFICATION_PREFERENCES_FRAGMENT}
`;

export const REGISTER_DEVICE_TOKEN_MUTATION = gql`
  mutation RegisterDeviceToken($input: RegisterDeviceTokenInput!) {
    registerDeviceToken(input: $input) {
      success
      message
      error
      preferences {
        ...NotificationPreferencesFragment
      }
    }
  }
  ${NOTIFICATION_PREFERENCES_FRAGMENT}
`;

export const TEST_NOTIFICATION_MUTATION = gql`
  mutation TestNotification($message: String!) {
    testNotification(message: $message) {
      success
      message
      error
      testSent
      deliveryLog {
        ...NotificationDeliveryLogFragment
      }
    }
  }
  ${NOTIFICATION_DELIVERY_LOG_FRAGMENT}
`;

export const MARK_NOTIFICATION_READ_MUTATION = gql`
  mutation MarkNotificationRead($notificationId: ID!, $action: String!) {
    markNotificationRead(notificationId: $notificationId, action: $action) {
      success
      message
      error
    }
  }
`;

// =============================================================================
// NOTIFICATION MUTATION TYPES
// =============================================================================

export interface UpdateNotificationPreferencesInput {
  notificationsEnabled?: boolean;
  criticalNotifications?: boolean;
  importantNotifications?: boolean;
  optionalNotifications?: boolean;
  pushNotifications?: boolean;
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  quietHoursEnabled?: boolean;
  quietHoursStart?: string; // HH:MM format
  quietHoursEnd?: string; // HH:MM format
  stockAlertEnabled?: boolean;
  stockAlertThreshold?: number; // 1-30 days
  changeReminderEnabled?: boolean;
  changeReminderIntervalHours?: number; // 1-12 hours
  expiryWarningEnabled?: boolean;
  expiryWarningDays?: number; // 1-90 days
  healthTipsEnabled?: boolean;
  marketingEnabled?: boolean;
  userTimezone?: string;
  dailyNotificationLimit?: number; // 1-50
  notificationConsentGranted?: boolean;
  marketingConsentGranted?: boolean;
}

export interface UpdateNotificationPreferencesResponse {
  success: boolean;
  message?: string;
  error?: string;
  preferences?: {
    id: string;
    userId: string;
    notificationsEnabled: boolean;
    criticalNotifications: boolean;
    importantNotifications: boolean;
    optionalNotifications: boolean;
    pushNotifications: boolean;
    emailNotifications: boolean;
    smsNotifications: boolean;
    quietHoursEnabled: boolean;
    quietHoursStart?: string;
    quietHoursEnd?: string;
    stockAlertEnabled: boolean;
    stockAlertThreshold: number;
    changeReminderEnabled: boolean;
    changeReminderIntervalHours: number;
    expiryWarningEnabled: boolean;
    expiryWarningDays: number;
    healthTipsEnabled: boolean;
    marketingEnabled: boolean;
    deviceTokens: Array<{
      token: string;
      platform: string;
      registered_at: string;
    }>;
    userTimezone: string;
    dailyNotificationLimit: number;
    notificationConsentGranted: boolean;
    notificationConsentDate?: string;
    marketingConsentGranted: boolean;
    marketingConsentDate?: string;
    createdAt: string;
    updatedAt: string;
  };
}

export interface UpdateNotificationPreferencesMutationData {
  updateNotificationPreferences: UpdateNotificationPreferencesResponse;
}

export interface UpdateNotificationPreferencesMutationVariables {
  input: UpdateNotificationPreferencesInput;
}

export interface RegisterDeviceTokenInput {
  deviceToken: string;
  platform: 'ios' | 'android' | 'web';
}

export interface RegisterDeviceTokenResponse {
  success: boolean;
  message?: string;
  error?: string;
  preferences?: {
    id: string;
    userId: string;
    deviceTokens: Array<{
      token: string;
      platform: string;
      registered_at: string;
    }>;
  };
}

export interface RegisterDeviceTokenMutationData {
  registerDeviceToken: RegisterDeviceTokenResponse;
}

export interface RegisterDeviceTokenMutationVariables {
  input: RegisterDeviceTokenInput;
}

export interface TestNotificationResponse {
  success: boolean;
  message?: string;
  error?: string;
  testSent: boolean;
  deliveryLog?: {
    id: string;
    userId: string;
    notificationType: string;
    priority: string;
    channel: string;
    title: string;
    message: string;
    deliveryStatus: string;
    sentAt?: string;
    processingTimeMs?: number;
    createdAt: string;
  };
}

export interface TestNotificationMutationData {
  testNotification: TestNotificationResponse;
}

export interface TestNotificationMutationVariables {
  message: string;
}

export interface MarkNotificationReadResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface MarkNotificationReadMutationData {
  markNotificationRead: MarkNotificationReadResponse;
}

export interface MarkNotificationReadMutationVariables {
  notificationId: string;
  action: 'opened' | 'clicked' | 'dismissed';
}