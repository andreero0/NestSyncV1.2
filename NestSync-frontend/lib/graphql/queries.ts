/**
 * GraphQL Queries and Mutations for Authentication
 * Matches the backend GraphQL schema for NestSync
 */

import { gql } from '@apollo/client';

// =============================================================================
// FRAGMENTS
// =============================================================================

export const USER_PROFILE_FRAGMENT = gql`
  fragment UserProfileFragment on UserProfile {
    id
    email
    firstName
    lastName
    displayName
    timezone
    language
    currency
    province
    status
    emailVerified
    onboardingCompleted
    createdAt
  }
`;

export const USER_SESSION_FRAGMENT = gql`
  fragment UserSessionFragment on UserSession {
    accessToken
    refreshToken
    expiresIn
  }
`;

export const USER_CONSENT_FRAGMENT = gql`
  fragment UserConsentFragment on UserConsent {
    consentType
    status
    grantedAt
    withdrawnAt
    expiresAt
    consentVersion
  }
`;

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
      }
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

// Import fragments from mutations.ts to avoid duplication
import { USAGE_LOG_FRAGMENT, INVENTORY_ITEM_FRAGMENT } from './mutations';

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

// Query Variables Types for Dashboard
export interface GetUsageLogsVariables {
  childId: string;
  usageType?: 'DIAPER_CHANGE' | 'WIPE_USE' | 'CREAM_APPLICATION' | 'ACCIDENT_CLEANUP' | 'PREVENTIVE_CHANGE' | 'OVERNIGHT_CHANGE';
  daysBack?: number;
  limit?: number;
  offset?: number;
}