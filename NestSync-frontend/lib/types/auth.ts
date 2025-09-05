/**
 * Authentication Types
 * Type definitions for the NestSync authentication system
 * These types match the backend GraphQL schema
 */

export enum UserStatus {
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  DEACTIVATED = 'DEACTIVATED'
}

export enum ConsentType {
  PRIVACY_POLICY = 'PRIVACY_POLICY',
  TERMS_OF_SERVICE = 'TERMS_OF_SERVICE',
  MARKETING = 'MARKETING',
  ANALYTICS = 'ANALYTICS',
  DATA_SHARING = 'DATA_SHARING'
}

export enum ConsentStatus {
  PENDING = 'PENDING',
  GRANTED = 'GRANTED',
  WITHDRAWN = 'WITHDRAWN',
  EXPIRED = 'EXPIRED'
}

// User Profile Types
export interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  timezone: string;
  language: string;
  currency: string;
  province?: string;
  status: UserStatus;
  emailVerified: boolean;
  onboardingCompleted: boolean;
  createdAt: string;
}

// Session Types
export interface UserSession {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// Consent Types
export interface UserConsent {
  consentType: ConsentType;
  status: ConsentStatus;
  grantedAt?: string;
  withdrawnAt?: string;
  expiresAt?: string;
  consentVersion: string;
}

// Authentication Input Types
export interface SignUpInput {
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
}

export interface SignInInput {
  email: string;
  password: string;
}

export interface ResetPasswordInput {
  email: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  timezone?: string;
  language?: string;
  currency?: string;
  province?: string;
}

export interface ConsentUpdateInput {
  consentType: ConsentType;
  grant: boolean;
  consentVersion: string;
}

// Response Types
export interface AuthResponse {
  success: boolean;
  message?: string;
  error?: string;
  user?: UserProfile;
  session?: UserSession;
}

export interface MutationResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface UserProfileResponse extends MutationResponse {
  user?: UserProfile;
}

// Connection Types (for pagination)
export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  totalCount: number;
}

export interface ConsentEdge {
  node: UserConsent;
  cursor: string;
}

export interface ConsentConnection {
  edges: ConsentEdge[];
  pageInfo: PageInfo;
}

// Local Storage Types
export interface StoredSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: UserProfile;
}

export interface BiometricSettings {
  enabled: boolean;
  enrollmentTimestamp?: number;
  lastUsed?: number;
}

// Canadian-specific types
export type CanadianProvince = 
  | 'AB' | 'BC' | 'MB' | 'NB' | 'NL' | 'NS' | 'NT' | 'NU' | 'ON' | 'PE' | 'QC' | 'SK' | 'YT';

export interface CanadianCompliance {
  dataResidency: 'CANADA_CENTRAL';
  consentVersion: string;
  privacyPolicyVersion: string;
  termsVersion: string;
  pipedaCompliant: boolean;
}

// Error Types
export interface AuthError {
  code: string;
  message: string;
  field?: string;
}

// User Persona Types for optimized UX
export enum UserPersona {
  OVERWHELMED_NEW_MOM = 'OVERWHELMED_NEW_MOM', // Sarah - 60% of users
  EFFICIENCY_DAD = 'EFFICIENCY_DAD'             // Mike - 30% of users
}

export interface PersonaPreferences {
  persona: UserPersona;
  onboardingFlow: 'QUICK' | 'COMPREHENSIVE';
  uiComplexity: 'SIMPLE' | 'DETAILED';
  notificationFrequency: 'MINIMAL' | 'REGULAR' | 'DETAILED';
}