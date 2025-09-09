/**
 * Authentication Service
 * Comprehensive authentication service for NestSync with GraphQL integration
 * Implements Canadian PIPEDA compliance and user persona optimization
 */

import { apolloClient, clearApolloCache } from '../graphql/client';
import { StorageHelpers, BiometricHelpers } from '../../hooks/useUniversalStorage';
import {
  SIGN_UP_MUTATION,
  SIGN_IN_MUTATION,
  SIGN_OUT_MUTATION,
  RESET_PASSWORD_MUTATION,
  CHANGE_PASSWORD_MUTATION,
  UPDATE_PROFILE_MUTATION,
  UPDATE_CONSENT_MUTATION,
  ME_QUERY,
  MY_CONSENTS_QUERY,
  SignUpMutationData,
  SignUpMutationVariables,
  SignInMutationData,
  SignInMutationVariables,
  SignOutMutationData,
  ResetPasswordMutationData,
  ResetPasswordMutationVariables,
  ChangePasswordMutationData,
  ChangePasswordMutationVariables,
  UpdateProfileMutationData,
  UpdateProfileMutationVariables,
  UpdateConsentMutationData,
  UpdateConsentMutationVariables,
  MeQueryData,
  MyConsentsQueryData,
  MyConsentsQueryVariables,
} from '../graphql/queries';
import {
  AuthResponse,
  UserProfile,
  UserSession,
  SignUpInput,
  SignInInput,
  ResetPasswordInput,
  ChangePasswordInput,
  UpdateProfileInput,
  ConsentUpdateInput,
  StoredSession,
  BiometricSettings,
  MutationResponse,
  UserProfileResponse,
  ConsentConnection,
  UserPersona,
  PersonaPreferences,
  CanadianProvince,
} from '../types/auth';

// Canadian provinces mapping
const CANADIAN_PROVINCES: Record<CanadianProvince, string> = {
  AB: 'Alberta',
  BC: 'British Columbia',
  MB: 'Manitoba',
  NB: 'New Brunswick',
  NL: 'Newfoundland and Labrador',
  NS: 'Nova Scotia',
  NT: 'Northwest Territories',
  NU: 'Nunavut',
  ON: 'Ontario',
  PE: 'Prince Edward Island',
  QC: 'Quebec',
  SK: 'Saskatchewan',
  YT: 'Yukon',
};

// Canadian timezone mapping
const CANADIAN_TIMEZONES = {
  'America/Vancouver': 'BC, YT',
  'America/Edmonton': 'AB, NT, NU (Mountain)',
  'America/Regina': 'SK',
  'America/Winnipeg': 'MB, NU (Central)',
  'America/Toronto': 'ON, NU (Eastern)',
  'America/Montreal': 'QC',
  'America/Halifax': 'NS, NB, PE',
  'America/St_Johns': 'NL',
};

export class AuthService {
  private static instance: AuthService;
  private currentUser: UserProfile | null = null;
  private currentSession: UserSession | null = null;
  private isInitialized = false;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Initialize authentication service
   * Restores session from secure storage if available
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return !!this.currentUser;
    }

    try {
      // Check for stored session
      const storedSession = await StorageHelpers.getUserSession();
      
      if (storedSession) {
        // Verify session is still valid by querying current user
        try {
          const { data } = await apolloClient.query<MeQueryData>({
            query: ME_QUERY,
            fetchPolicy: 'network-only', // Always check with server
          });

          if (data?.me) {
            this.currentUser = data.me as UserProfile;
            this.currentSession = {
              accessToken: storedSession.accessToken,
              refreshToken: storedSession.refreshToken,
              expiresIn: Math.floor((storedSession.expiresAt - Date.now()) / 1000),
            };
            this.isInitialized = true;
            return true;
          }
        } catch (error) {
          console.log('Stored session is invalid, clearing...', error);
          await this.clearSession();
        }
      }

      this.isInitialized = true;
      return false;
    } catch (error) {
      console.error('Failed to initialize auth service:', error);
      this.isInitialized = true;
      return false;
    }
  }

  /**
   * Sign up new user with Canadian compliance
   */
  async signUp(input: SignUpInput): Promise<AuthResponse> {
    try {
      // Validate Canadian specific requirements
      if (input.province && !(input.province in CANADIAN_PROVINCES)) {
        return {
          success: false,
          error: 'Invalid Canadian province',
        };
      }

      // First check server connectivity
      const connectivityCheck = await this.checkServerConnectivity();
      if (!connectivityCheck.connected) {
        return {
          success: false,
          error: connectivityCheck.error || 'Server is not available. Please try again later.',
        };
      }

      // Set default Canadian timezone if not provided
      if (!input.timezone && input.province) {
        input.timezone = this.getDefaultTimezoneForProvince(input.province as CanadianProvince);
      }

      // Default to Toronto timezone for Canadian users
      if (!input.timezone) {
        input.timezone = 'America/Toronto';
      }

      // Default to English for Canadian users
      if (!input.language) {
        input.language = 'en-CA';
      }

      const { data } = await apolloClient.mutate<SignUpMutationData, SignUpMutationVariables>({
        mutation: SIGN_UP_MUTATION,
        variables: { input },
      });

      const response = data?.signUp;
      if (!response) {
        return {
          success: false,
          error: 'No response from server',
        };
      }

      if (response.success && response.user && response.session) {
        // Store session securely
        await this.storeSession(response.user as UserProfile, response.session);
        
        // Set current user and session
        this.currentUser = response.user as UserProfile;
        this.currentSession = response.session;

        return {
          success: true,
          message: response.message,
          user: response.user as UserProfile,
          session: response.session,
        };
      }

      return {
        success: false,
        error: response.error || 'Sign up failed',
      };
    } catch (error: any) {
      console.error('Sign up error:', error);
      
      // Provide more specific error messages
      if (error.networkError) {
        return {
          success: false,
          error: 'Network connection failed. Please check your internet connection and try again.',
        };
      }
      
      if (error.graphQLErrors && error.graphQLErrors.length > 0) {
        return {
          success: false,
          error: error.graphQLErrors[0].message || 'Registration failed. Please try again.',
        };
      }
      
      return {
        success: false,
        error: 'Sign up failed. Please try again.',
      };
    }
  }

  /**
   * Check server connectivity
   */
  async checkServerConnectivity(): Promise<{ connected: boolean; error?: string }> {
    try {
      const { data } = await apolloClient.query({
        query: ME_QUERY,
        fetchPolicy: 'network-only',
        errorPolicy: 'all',
      });
      return { connected: true };
    } catch (error: any) {
      console.log('Server connectivity check failed:', error);
      
      // Check if it's a network error
      if (error.networkError) {
        return { 
          connected: false, 
          error: 'Unable to connect to server. Please check your internet connection.' 
        };
      }
      
      // If we get GraphQL errors but no network error, server is reachable
      return { connected: true };
    }
  }

  /**
   * Sign in user
   */
  async signIn(input: SignInInput): Promise<AuthResponse> {
    try {
      // First check server connectivity
      const connectivityCheck = await this.checkServerConnectivity();
      if (!connectivityCheck.connected) {
        return {
          success: false,
          error: connectivityCheck.error || 'Server is not available. Please try again later.',
        };
      }

      const { data } = await apolloClient.mutate<SignInMutationData, SignInMutationVariables>({
        mutation: SIGN_IN_MUTATION,
        variables: { input },
      });

      const response = data?.signIn;
      if (!response) {
        return {
          success: false,
          error: 'No response from server',
        };
      }

      if (response.success && response.user && response.session) {
        // Store session securely
        await this.storeSession(response.user as UserProfile, response.session);
        
        // Set current user and session
        this.currentUser = response.user as UserProfile;
        this.currentSession = response.session;

        return {
          success: true,
          message: response.message,
          user: response.user as UserProfile,
          session: response.session,
        };
      }

      return {
        success: false,
        error: response.error || 'Sign in failed',
      };
    } catch (error: any) {
      console.error('Sign in error:', error);
      
      // Provide more specific error messages
      if (error.networkError) {
        return {
          success: false,
          error: 'Network connection failed. Please check your internet connection and try again.',
        };
      }
      
      if (error.graphQLErrors && error.graphQLErrors.length > 0) {
        return {
          success: false,
          error: error.graphQLErrors[0].message || 'Authentication failed. Please check your credentials.',
        };
      }
      
      return {
        success: false,
        error: 'Sign in failed. Please try again.',
      };
    }
  }

  /**
   * Sign in with biometric authentication
   */
  async signInWithBiometrics(): Promise<AuthResponse> {
    try {
      // Check if biometrics is available and enabled
      const biometricSettings = await StorageHelpers.getBiometricSettings();
      if (!biometricSettings?.enabled) {
        return {
          success: false,
          error: 'Biometric authentication not enabled',
        };
      }

      // Authenticate with biometrics
      const biometricResult = await BiometricHelpers.authenticateWithBiometrics();
      if (!biometricResult) {
        return {
          success: false,
          error: 'Biometric authentication failed',
        };
      }

      // Get stored session
      const storedSession = await StorageHelpers.getUserSession();
      if (!storedSession) {
        return {
          success: false,
          error: 'No stored session for biometric authentication',
        };
      }

      // Verify session with server
      try {
        const { data } = await apolloClient.query<MeQueryData>({
          query: ME_QUERY,
          fetchPolicy: 'network-only',
        });

        if (data?.me) {
          this.currentUser = data.me as UserProfile;
          this.currentSession = {
            accessToken: storedSession.accessToken,
            refreshToken: storedSession.refreshToken,
            expiresIn: Math.floor((storedSession.expiresAt - Date.now()) / 1000),
          };

          return {
            success: true,
            message: 'Biometric authentication successful',
            user: this.currentUser,
            session: this.currentSession,
          };
        }
      } catch (error) {
        console.log('Session expired, clearing biometric session');
        await this.clearSession();
      }

      return {
        success: false,
        error: 'Session expired, please sign in again',
      };
    } catch (error) {
      console.error('Biometric sign in error:', error);
      return {
        success: false,
        error: 'Biometric sign in failed',
      };
    }
  }

  /**
   * Sign out user
   */
  async signOut(): Promise<MutationResponse> {
    try {
      // Call server sign out
      const { data } = await apolloClient.mutate<SignOutMutationData>({
        mutation: SIGN_OUT_MUTATION,
      });

      // Clear local session regardless of server response
      await this.clearSession();

      const response = data?.signOut;
      return {
        success: response?.success ?? true,
        message: response?.message || 'Signed out successfully',
        error: response?.error,
      };
    } catch (error) {
      console.error('Sign out error:', error);
      // Still clear local session on error
      await this.clearSession();
      
      return {
        success: true, // Consider successful if we cleared local session
        message: 'Signed out locally',
      };
    }
  }

  /**
   * Reset password
   */
  async resetPassword(input: ResetPasswordInput): Promise<MutationResponse> {
    try {
      const { data } = await apolloClient.mutate<ResetPasswordMutationData, ResetPasswordMutationVariables>({
        mutation: RESET_PASSWORD_MUTATION,
        variables: { input },
      });

      const response = data?.resetPassword;
      return {
        success: response?.success ?? false,
        message: response?.message,
        error: response?.error,
      };
    } catch (error) {
      console.error('Reset password error:', error);
      return {
        success: false,
        error: 'Password reset failed. Please try again.',
      };
    }
  }

  /**
   * Change password
   */
  async changePassword(input: ChangePasswordInput): Promise<MutationResponse> {
    try {
      const { data } = await apolloClient.mutate<ChangePasswordMutationData, ChangePasswordMutationVariables>({
        mutation: CHANGE_PASSWORD_MUTATION,
        variables: { input },
      });

      const response = data?.changePassword;
      return {
        success: response?.success ?? false,
        message: response?.message,
        error: response?.error,
      };
    } catch (error) {
      console.error('Change password error:', error);
      return {
        success: false,
        error: 'Password change failed. Please try again.',
      };
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(input: UpdateProfileInput): Promise<UserProfileResponse> {
    try {
      const { data } = await apolloClient.mutate<UpdateProfileMutationData, UpdateProfileMutationVariables>({
        mutation: UPDATE_PROFILE_MUTATION,
        variables: { input },
      });

      const response = data?.updateProfile;
      if (response?.success && response.user) {
        // Update current user
        this.currentUser = response.user as UserProfile;
        
        // Update stored session with new user data
        if (this.currentSession) {
          await this.storeSession(this.currentUser, this.currentSession);
        }
      }

      return {
        success: response?.success ?? false,
        message: response?.message,
        error: response?.error,
        user: response?.user as UserProfile,
      };
    } catch (error) {
      console.error('Update profile error:', error);
      return {
        success: false,
        error: 'Profile update failed. Please try again.',
      };
    }
  }

  /**
   * Update consent (PIPEDA compliance)
   */
  async updateConsent(input: ConsentUpdateInput): Promise<MutationResponse> {
    try {
      const { data } = await apolloClient.mutate<UpdateConsentMutationData, UpdateConsentMutationVariables>({
        mutation: UPDATE_CONSENT_MUTATION,
        variables: { input },
      });

      const response = data?.updateConsent;
      
      // Update stored consent version
      if (response?.success) {
        await StorageHelpers.setConsentVersion(input.consentVersion);
      }

      return {
        success: response?.success ?? false,
        message: response?.message,
        error: response?.error,
      };
    } catch (error) {
      console.error('Update consent error:', error);
      return {
        success: false,
        error: 'Consent update failed. Please try again.',
      };
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<UserProfile | null> {
    if (this.currentUser) {
      return this.currentUser;
    }

    try {
      const { data } = await apolloClient.query<MeQueryData>({
        query: ME_QUERY,
        fetchPolicy: 'cache-first',
      });

      if (data?.me) {
        this.currentUser = data.me as UserProfile;
        return this.currentUser;
      }
    } catch (error) {
      console.error('Get current user error:', error);
    }

    return null;
  }

  /**
   * Get user consents
   */
  async getUserConsents(variables?: MyConsentsQueryVariables): Promise<ConsentConnection | null> {
    try {
      const { data } = await apolloClient.query<MyConsentsQueryData, MyConsentsQueryVariables>({
        query: MY_CONSENTS_QUERY,
        variables,
        fetchPolicy: 'cache-first',
      });

      return data?.myConsents || null;
    } catch (error) {
      console.error('Get user consents error:', error);
      return null;
    }
  }

  /**
   * Setup biometric authentication
   */
  async setupBiometrics(): Promise<MutationResponse> {
    try {
      const isAvailable = await BiometricHelpers.isBiometricAvailable();
      if (!isAvailable) {
        return {
          success: false,
          error: 'Biometric authentication not available on this device',
        };
      }

      // Test biometric authentication
      const authResult = await BiometricHelpers.authenticateWithBiometrics();
      if (!authResult) {
        return {
          success: false,
          error: 'Biometric authentication failed',
        };
      }

      // Store biometric settings
      const settings: BiometricSettings = {
        enabled: true,
        enrollmentTimestamp: Date.now(),
      };

      await StorageHelpers.setBiometricSettings(settings);

      return {
        success: true,
        message: 'Biometric authentication enabled successfully',
      };
    } catch (error) {
      console.error('Setup biometrics error:', error);
      return {
        success: false,
        error: 'Failed to setup biometric authentication',
      };
    }
  }

  /**
   * Disable biometric authentication
   */
  async disableBiometrics(): Promise<MutationResponse> {
    try {
      const settings: BiometricSettings = {
        enabled: false,
      };

      await StorageHelpers.setBiometricSettings(settings);

      return {
        success: true,
        message: 'Biometric authentication disabled',
      };
    } catch (error) {
      console.error('Disable biometrics error:', error);
      return {
        success: false,
        error: 'Failed to disable biometric authentication',
      };
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.currentUser && !!this.currentSession;
  }

  /**
   * Get current session
   */
  getCurrentSession(): UserSession | null {
    return this.currentSession;
  }

  /**
   * Determine user persona based on profile and behavior
   */
  determineUserPersona(user: UserProfile): UserPersona {
    // This is a simplified persona determination
    // In a full implementation, this would analyze user behavior patterns
    
    // Default to overwhelmed new mom (60% of users)
    return UserPersona.OVERWHELMED_NEW_MOM;
  }

  /**
   * Get persona-optimized preferences
   */
  getPersonaPreferences(persona: UserPersona): PersonaPreferences {
    switch (persona) {
      case UserPersona.OVERWHELMED_NEW_MOM:
        return {
          persona,
          onboardingFlow: 'QUICK',
          uiComplexity: 'SIMPLE',
          notificationFrequency: 'MINIMAL',
        };
      case UserPersona.EFFICIENCY_DAD:
        return {
          persona,
          onboardingFlow: 'COMPREHENSIVE',
          uiComplexity: 'DETAILED',
          notificationFrequency: 'DETAILED',
        };
      default:
        return {
          persona: UserPersona.OVERWHELMED_NEW_MOM,
          onboardingFlow: 'QUICK',
          uiComplexity: 'SIMPLE',
          notificationFrequency: 'MINIMAL',
        };
    }
  }

  // Private helper methods

  private async storeSession(user: UserProfile, session: UserSession): Promise<void> {
    const expiresAt = Date.now() + (session.expiresIn * 1000);
    
    const storedSession: StoredSession = {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      expiresAt,
      user,
    };

    await StorageHelpers.setUserSession(storedSession);
  }

  private async clearSession(): Promise<void> {
    this.currentUser = null;
    this.currentSession = null;
    
    await StorageHelpers.clearUserSession();
    await clearApolloCache();
  }

  private getDefaultTimezoneForProvince(province: CanadianProvince): string {
    const timezoneMap: Record<CanadianProvince, string> = {
      BC: 'America/Vancouver',
      YT: 'America/Vancouver',
      AB: 'America/Edmonton',
      NT: 'America/Edmonton',
      NU: 'America/Edmonton', // Simplified - Nunavut has multiple zones
      SK: 'America/Regina',
      MB: 'America/Winnipeg',
      ON: 'America/Toronto',
      QC: 'America/Montreal',
      NB: 'America/Halifax',
      NS: 'America/Halifax',
      PE: 'America/Halifax',
      NL: 'America/St_Johns',
    };

    return timezoneMap[province] || 'America/Toronto';
  }
}

// Export singleton instance
export default AuthService.getInstance();