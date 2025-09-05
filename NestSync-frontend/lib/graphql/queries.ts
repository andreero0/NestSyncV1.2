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
    grant: boolean;
    consentVersion: string;
  };
}