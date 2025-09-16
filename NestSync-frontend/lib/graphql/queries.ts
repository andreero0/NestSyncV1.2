/**
 * GraphQL Queries and Mutations for Authentication
 * Matches the backend GraphQL schema for NestSync
 */

import { gql } from '@apollo/client';
import {
  USER_PROFILE_FRAGMENT,
  USER_SESSION_FRAGMENT,
  USER_CONSENT_FRAGMENT,
  CHILD_PROFILE_FRAGMENT,
  USAGE_LOG_FRAGMENT,
  INVENTORY_ITEM_FRAGMENT,
  DASHBOARD_STATS_FRAGMENT,
  NOTIFICATION_PREFERENCES_FRAGMENT,
  NOTIFICATION_DELIVERY_LOG_FRAGMENT,
  USAGE_ANALYTICS_FRAGMENT,
  WEEKLY_TRENDS_FRAGMENT,
  DAILY_SUMMARY_FRAGMENT,
  USAGE_PATTERN_FRAGMENT,
  INVENTORY_INSIGHT_FRAGMENT,
  ANALYTICS_OVERVIEW_FRAGMENT
} from './fragments';

// =============================================================================
// QUERIES
// =============================================================================

export const ME_QUERY = gql`
  query Me {
    me {
      ...UserProfileFragment
    }
  }
  ${USER_PROFILE_FRAGMENT}
`;

export const MY_CONSENTS_QUERY = gql`
  query MyConsents($first: Int = 10, $after: String) {
    myConsents(first: $first, after: $after) {
      edges {
        node {
          ...UserConsentFragment
        }
        cursor
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        totalCount
      }
    }
  }
  ${USER_CONSENT_FRAGMENT}
`;

export const HEALTH_CHECK_QUERY = gql`
  query HealthCheck {
    healthCheck
  }
`;

export const API_INFO_QUERY = gql`
  query ApiInfo {
    apiInfo
  }
`;

export const MY_CHILDREN_QUERY = gql`
  query MyChildren($first: Int = 10, $after: String) {
    myChildren(first: $first, after: $after) {
      edges {
        node {
          id
          name
          dateOfBirth
          gender
          currentDiaperSize
          currentWeightKg
          currentHeightCm
          dailyUsageCount
          hasSensitiveSkin
          hasAllergies
          allergiesNotes
          onboardingCompleted
          province
          createdAt
          ageInDays
          ageInMonths
          weeklyUsage
          monthlyUsage
        }
        cursor
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
        totalCount
      }
    }
  }
`;

export const ONBOARDING_STATUS_QUERY = gql`
  query OnboardingStatus {
    onboardingStatus {
      userOnboardingCompleted
      currentStep
      completedSteps {
        stepName
        completed
        completedAt
        data
      }
      childrenCount
      requiredConsentsGiven
    }
  }
`;

// =============================================================================
// MUTATIONS
// =============================================================================

export const SIGN_UP_MUTATION = gql`
  mutation SignUp($input: SignUpInput!) {
    signUp(input: $input) {
      success
      message
      error
      user {
        ...UserProfileFragment
      }
      session {
        ...UserSessionFragment
      }
    }
  }
  ${USER_PROFILE_FRAGMENT}
  ${USER_SESSION_FRAGMENT}
`;

export const SIGN_IN_MUTATION = gql`
  mutation SignIn($input: SignInInput!) {
    signIn(input: $input) {
      success
      message
      error
      user {
        ...UserProfileFragment
      }
      session {
        ...UserSessionFragment
      }
    }
  }
  ${USER_PROFILE_FRAGMENT}
  ${USER_SESSION_FRAGMENT}
`;

export const SIGN_OUT_MUTATION = gql`
  mutation SignOut {
    signOut {
      success
      message
      error
    }
  }
`;

export const RESET_PASSWORD_MUTATION = gql`
  mutation ResetPassword($input: ResetPasswordInput!) {
    resetPassword(input: $input) {
      success
      message
      error
    }
  }
`;

export const CHANGE_PASSWORD_MUTATION = gql`
  mutation ChangePassword($input: ChangePasswordInput!) {
    changePassword(input: $input) {
      success
      message
      error
    }
  }
`;

export const UPDATE_PROFILE_MUTATION = gql`
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) {
      success
      message
      error
      user {
        ...UserProfileFragment
      }
    }
  }
  ${USER_PROFILE_FRAGMENT}
`;

export const UPDATE_CONSENT_MUTATION = gql`
  mutation UpdateConsent($input: ConsentUpdateInput!) {
    updateConsent(input: $input) {
      success
      message
      error
    }
  }
`;

export const REFRESH_TOKEN_MUTATION = gql`
  mutation RefreshToken($refreshToken: String!) {
    refreshToken(refreshToken: $refreshToken) {
      success
      message
      error
      session {
        ...UserSessionFragment
      }
    }
  }
  ${USER_SESSION_FRAGMENT}
`;

// =============================================================================
// CHILD AND ONBOARDING MUTATIONS
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
// TYPE DEFINITIONS FOR TYPESCRIPT
// =============================================================================

// Query Types
export interface MeQueryData {
  me: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    displayName?: string;
    timezone: string;
    language: string;
    currency: string;
    province?: string;
    status: string;
    emailVerified: boolean;
    onboardingCompleted: boolean;
    createdAt: string;
  } | null;
}

export interface MyConsentsQueryData {
  myConsents: {
    edges: Array<{
      node: {
        consentType: string;
        status: string;
        grantedAt?: string;
        withdrawnAt?: string;
        expiresAt?: string;
        consentVersion: string;
      };
      cursor: string;
    }>;
    pageInfo: {
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      totalCount: number;
    };
  };
}

export interface MyConsentsQueryVariables {
  first?: number;
  after?: string;
}

// Mutation Types
export interface SignUpMutationData {
  signUp: {
    success: boolean;
    message?: string;
    error?: string;
    user?: {
      id: string;
      email: string;
      firstName?: string;
      lastName?: string;
      displayName?: string;
      timezone: string;
      language: string;
      currency: string;
      province?: string;
      status: string;
      emailVerified: boolean;
      onboardingCompleted: boolean;
      createdAt: string;
    };
    session?: {
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
    };
  };
}

export interface SignUpMutationVariables {
  input: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    timezone: string;
    language: string;
    province?: string;
    acceptPrivacyPolicy: boolean;
    acceptTermsOfService: boolean;
    marketingConsent?: boolean;
    analyticsConsent?: boolean;
  };
}

export interface SignInMutationData {
  signIn: {
    success: boolean;
    message?: string;
    error?: string;
    user?: {
      id: string;
      email: string;
      firstName?: string;
      lastName?: string;
      displayName?: string;
      timezone: string;
      language: string;
      currency: string;
      province?: string;
      status: string;
      emailVerified: boolean;
      onboardingCompleted: boolean;
      createdAt: string;
    };
    session?: {
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
    };
  };
}

export interface SignInMutationVariables {
  input: {
    email: string;
    password: string;
  };
}

export interface SignOutMutationData {
  signOut: {
    success: boolean;
    message?: string;
    error?: string;
  };
}

export interface ResetPasswordMutationData {
  resetPassword: {
    success: boolean;
    message?: string;
    error?: string;
  };
}

export interface ResetPasswordMutationVariables {
  input: {
    email: string;
  };
}

export interface ChangePasswordMutationData {
  changePassword: {
    success: boolean;
    message?: string;
    error?: string;
  };
}

export interface ChangePasswordMutationVariables {
  input: {
    currentPassword: string;
    newPassword: string;
  };
}

export interface UpdateProfileMutationData {
  updateProfile: {
    success: boolean;
    message?: string;
    error?: string;
    user?: {
      id: string;
      email: string;
      firstName?: string;
      lastName?: string;
      displayName?: string;
      timezone: string;
      language: string;
      currency: string;
      province?: string;
      status: string;
      emailVerified: boolean;
      onboardingCompleted: boolean;
      createdAt: string;
    };
  };
}

export interface UpdateProfileMutationVariables {
  input: {
    firstName?: string;
    lastName?: string;
    displayName?: string;
    timezone?: string;
    language?: string;
    currency?: string;
    province?: string;
  };
}

export interface UpdateConsentMutationData {
  updateConsent: {
    success: boolean;
    message?: string;
    error?: string;
  };
}

export interface UpdateConsentMutationVariables {
  input: {
    consentType: string;
    granted: boolean;
    consentVersion: string;
  };
}

export interface RefreshTokenMutationData {
  refreshToken: {
    success: boolean;
    message?: string;
    error?: string;
    session?: {
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
    };
  };
}

export interface RefreshTokenMutationVariables {
  refreshToken: string;
}

// =============================================================================
// CHILD AND ONBOARDING MUTATION TYPES
// =============================================================================

export interface CreateChildMutationData {
  createChild: {
    success: boolean;
    message?: string;
    error?: string;
    child?: {
      id: string;
      name: string;
      dateOfBirth: string;
      gender: string;
      currentDiaperSize?: string;
      currentWeightKg?: number;
      currentHeightCm?: number;
      dailyUsageCount: number;
      hasSensitiveSkin: boolean;
      hasAllergies: boolean;
      allergiesNotes?: string;
      onboardingCompleted: boolean;
      province?: string;
      createdAt: string;
    };
  };
}

export interface CreateChildMutationVariables {
  input: {
    name: string;
    dateOfBirth: string;
    gender?: 'BOY' | 'GIRL' | null;
    currentDiaperSize: 'NEWBORN' | 'SIZE_1' | 'SIZE_2' | 'SIZE_3' | 'SIZE_4' | 'SIZE_5' | 'SIZE_6';
    currentWeightKg?: number;
    currentHeightCm?: number;
    dailyUsageCount?: number;
    hasSensitiveSkin?: boolean;
    hasAllergies?: boolean;
    allergiesNotes?: string;
    specialNeeds?: string;
    preferredBrands?: string[];
  };
}

export interface SetInitialInventoryMutationData {
  setInitialInventory: {
    success: boolean;
    message?: string;
    error?: string;
  };
}

export interface SetInitialInventoryMutationVariables {
  childId: string;
  inventoryItems: Array<{
    diaperSize: 'NEWBORN' | 'SIZE_1' | 'SIZE_2' | 'SIZE_3' | 'SIZE_4' | 'SIZE_5' | 'SIZE_6';
    brand: string;
    quantity: number;
    purchaseDate?: string;
    expiryDate?: string;
  }>;
}

// =============================================================================
// DASHBOARD AND ACTIVITY QUERIES
// =============================================================================

export const GET_USAGE_LOGS_QUERY = gql`
  query GetUsageLogs(
    $childId: ID!
    $usageType: UsageTypeEnum
    $daysBack: Int! = 7
    $limit: Int! = 50
    $offset: Int! = 0
  ) {
    getUsageLogs(
      childId: $childId
      usageType: $usageType
      daysBack: $daysBack
      limit: $limit
      offset: $offset
    ) {
      edges {
        node {
          ...UsageLogFragment
        }
        cursor
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
        totalCount
      }
    }
  }
  ${USAGE_LOG_FRAGMENT}
`;

export const GET_INVENTORY_ITEMS_QUERY = gql`
  query GetInventoryItems(
    $childId: ID!
    $productType: ProductTypeEnum
    $limit: Int! = 500
    $offset: Int! = 0
  ) {
    getInventoryItems(
      childId: $childId
      productType: $productType
      limit: $limit
      offset: $offset
    ) {
      edges {
        node {
          ...InventoryItemFragment
        }
        cursor
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
        totalCount
      }
    }
  }
  ${INVENTORY_ITEM_FRAGMENT}
`;

export const GET_DASHBOARD_STATS_QUERY = gql`
  query GetDashboardStats($childId: ID!) {
    getDashboardStats(childId: $childId) {
      ...DashboardStatsFragment
    }
  }
  ${DASHBOARD_STATS_FRAGMENT}
`;

// Query Variables Types for Dashboard
export interface GetUsageLogsVariables {
  childId: string;
  usageType?: 'DIAPER_CHANGE' | 'WIPE_USE' | 'CREAM_APPLICATION' | 'ACCIDENT_CLEANUP' | 'PREVENTIVE_CHANGE' | 'OVERNIGHT_CHANGE';
  daysBack?: number;
  limit?: number;
  offset?: number;
}

export interface GetDashboardStatsVariables {
  childId: string;
}

export interface DashboardStats {
  daysRemaining?: number;
  diapersLeft: number;
  lastChange?: string;
  todayChanges: number;
  currentSize?: string;
}

export interface GetDashboardStatsQueryData {
  getDashboardStats: DashboardStats;
}

// =============================================================================
// NOTIFICATION QUERIES
// =============================================================================

export const GET_NOTIFICATION_PREFERENCES_QUERY = gql`
  query GetNotificationPreferences {
    getNotificationPreferences {
      ...NotificationPreferencesFragment
    }
  }
  ${NOTIFICATION_PREFERENCES_FRAGMENT}
`;

export const GET_NOTIFICATION_HISTORY_QUERY = gql`
  query GetNotificationHistory(
    $notificationType: NotificationTypeEnum
    $daysBack: Int! = 30
    $limit: Int! = 50
    $offset: Int! = 0
  ) {
    getNotificationHistory(
      notificationType: $notificationType
      daysBack: $daysBack
      limit: $limit
      offset: $offset
    ) {
      edges {
        node {
          ...NotificationDeliveryLogFragment
        }
        cursor
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
        totalCount
      }
    }
  }
  ${NOTIFICATION_DELIVERY_LOG_FRAGMENT}
`;

// =============================================================================
// NOTIFICATION QUERY TYPES
// =============================================================================

export interface NotificationPreferences {
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
  quietHoursStart?: string; // HH:MM format
  quietHoursEnd?: string; // HH:MM format
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
}

export interface GetNotificationPreferencesQueryData {
  getNotificationPreferences?: NotificationPreferences;
}

export interface GetNotificationHistoryQueryData {
  getNotificationHistory: {
    edges: Array<{
      node: {
        id: string;
        userId: string;
        queueItemId?: string;
        preferencesId?: string;
        notificationType: string;
        priority: string;
        channel: string;
        title: string;
        message: string;
        deliveryStatus: string;
        sentAt?: string;
        deliveredAt?: string;
        externalId?: string;
        externalResponse?: string;
        errorCode?: string;
        errorMessage?: string;
        processingTimeMs?: number;
        dataRetentionDate?: string;
        openedAt?: string;
        clickedAt?: string;
        dismissedAt?: string;
        createdAt: string;
      };
      cursor: string;
    }>;
    pageInfo: {
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      startCursor?: string;
      endCursor?: string;
      totalCount: number;
    };
  };
}

export interface GetNotificationHistoryQueryVariables {
  notificationType?: 'STOCK_ALERT' | 'CHANGE_REMINDER' | 'EXPIRY_WARNING' | 'HEALTH_TIP' | 'MARKETING' | 'SYSTEM_UPDATE';
  daysBack?: number;
  limit?: number;
  offset?: number;
}