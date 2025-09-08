/**
 * Authentication Store (Zustand)
 * Global state management for authentication in NestSync
 * Integrates with AuthService and provides reactive state updates
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import AuthService from '../lib/auth/AuthService';
import {
  UserProfile,
  UserSession,
  AuthResponse,
  MutationResponse,
  SignUpInput,
  SignInInput,
  ResetPasswordInput,
  ChangePasswordInput,
  UpdateProfileInput,
  ConsentUpdateInput,
  UserPersona,
  PersonaPreferences,
  BiometricSettings,
} from '../lib/types/auth';
import { StorageHelpers, BiometricHelpers } from '../hooks/useUniversalStorage';

// Authentication state interface
interface AuthState {
  // Core state
  user: UserProfile | null;
  session: UserSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // User persona and preferences
  userPersona: UserPersona | null;
  personaPreferences: PersonaPreferences | null;

  // Biometric state
  biometricsAvailable: boolean;
  biometricsEnabled: boolean;

  // Canadian compliance
  consentVersion: string | null;
  needsConsentUpdate: boolean;

  // Onboarding state
  onboardingCompleted: boolean;
  onboardingStep: number;

  // Actions
  initialize: () => Promise<void>;
  signUp: (input: SignUpInput) => Promise<AuthResponse>;
  signIn: (input: SignInInput) => Promise<AuthResponse>;
  signInWithBiometrics: () => Promise<AuthResponse>;
  signOut: () => Promise<void>;
  resetPassword: (input: ResetPasswordInput) => Promise<MutationResponse>;
  changePassword: (input: ChangePasswordInput) => Promise<MutationResponse>;
  updateProfile: (input: UpdateProfileInput) => Promise<MutationResponse>;
  updateConsent: (input: ConsentUpdateInput) => Promise<MutationResponse>;
  setupBiometrics: () => Promise<MutationResponse>;
  disableBiometrics: () => Promise<MutationResponse>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
  setOnboardingStep: (step: number) => void;
  completeOnboarding: () => Promise<void>;
  updatePersonaPreferences: (preferences: Partial<PersonaPreferences>) => Promise<void>;
  
  // Development-only methods
  resetOnboardingForDev: () => Promise<MutationResponse>;
}

// Create the authentication store
export const useAuthStore = create<AuthState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    user: null,
    session: null,
    isAuthenticated: false,
    isLoading: false,
    isInitialized: false,
    error: null,
    userPersona: null,
    personaPreferences: null,
    biometricsAvailable: false,
    biometricsEnabled: false,
    consentVersion: null,
    needsConsentUpdate: false,
    onboardingCompleted: false,
    onboardingStep: 0,

    // Initialize authentication state
    initialize: async () => {
      set({ isLoading: true, error: null });

      try {
        if (__DEV__) {
          console.log('Starting auth initialization...');
        }
        
        // Create a timeout wrapper for the auth service initialization
        const initializeWithTimeout = async (): Promise<boolean> => {
          return new Promise(async (resolve, reject) => {
            // Set 10-second timeout
            const timeoutId = setTimeout(() => {
              if (__DEV__) {
                console.log('Auth service initialization timed out');
              }
              reject(new Error('Authentication initialization timed out'));
            }, 10000);

            try {
              // Initialize auth service
              const isAuthenticated = await AuthService.initialize();
              clearTimeout(timeoutId);
              resolve(isAuthenticated);
            } catch (error) {
              clearTimeout(timeoutId);
              reject(error);
            }
          });
        };

        let isAuthenticated = false;
        let initError: Error | null = null;

        try {
          isAuthenticated = await initializeWithTimeout();
          if (__DEV__) {
            console.log('Auth service initialized successfully, isAuthenticated:', isAuthenticated);
          }
        } catch (error) {
          if (__DEV__) {
            console.log('Auth service initialization failed, falling back to offline mode:', error);
          }
          initError = error as Error;
          // Continue with fallback logic even if initialization fails
        }

        if (isAuthenticated && !initError) {
          try {
            const user = await AuthService.getCurrentUser();
            const session = AuthService.getCurrentSession();

            if (user && session) {
              // Determine user persona
              const persona = AuthService.determineUserPersona(user);
              const preferences = AuthService.getPersonaPreferences(persona);

              // Check biometric availability (with fallback)
              let biometricsAvailable = false;
              let biometricSettings = null;
              try {
                biometricsAvailable = await BiometricHelpers.isBiometricAvailable();
                biometricSettings = await StorageHelpers.getBiometricSettings();
              } catch (bioError) {
                if (__DEV__) {
                  console.log('Biometric check failed, defaulting to unavailable:', bioError);
                }
              }

              // Get stored consent version (with fallback)
              let consentVersion = null;
              try {
                consentVersion = await StorageHelpers.getConsentVersion();
              } catch (consentError) {
                if (__DEV__) {
                  console.log('Consent version check failed:', consentError);
                }
              }

              if (__DEV__) {
                console.log('Setting authenticated state with user data');
              }
              set({
                user,
                session,
                isAuthenticated: true,
                userPersona: persona,
                personaPreferences: preferences,
                biometricsAvailable,
                biometricsEnabled: biometricSettings?.enabled ?? false,
                consentVersion,
                onboardingCompleted: user.onboardingCompleted,
                isInitialized: true,
                isLoading: false,
              });
            } else {
              if (__DEV__) {
                console.log('No valid user/session found, setting unauthenticated state');
              }
              set({
                isAuthenticated: false,
                isInitialized: true,
                isLoading: false,
              });
            }
          } catch (userError) {
            if (__DEV__) {
              console.log('Failed to get current user, proceeding as unauthenticated:', userError);
            }
            set({
              isAuthenticated: false,
              isInitialized: true,
              isLoading: false,
            });
          }
        } else {
          // Not authenticated or initialization failed - fallback mode
          if (__DEV__) {
            console.log('Initializing in fallback mode (offline/unauthenticated)');
          }
          
          // Check biometric availability for non-authenticated users (with fallback)
          let biometricsAvailable = false;
          try {
            biometricsAvailable = await BiometricHelpers.isBiometricAvailable();
          } catch (bioError) {
            if (__DEV__) {
              console.log('Biometric check failed in fallback mode:', bioError);
            }
          }

          set({
            isAuthenticated: false,
            biometricsAvailable,
            isInitialized: true,
            isLoading: false,
            error: initError ? `Backend unavailable: ${initError.message}` : null,
          });
        }
      } catch (error) {
        // Critical auth error - should be logged in production
        console.error('Critical auth initialization error:', error);
        
        // Always ensure initialization completes to prevent infinite loading
        set({
          error: `Failed to initialize authentication: ${(error as Error).message}`,
          isAuthenticated: false,
          isInitialized: true,
          isLoading: false,
        });
      }
      
      if (__DEV__) {
        console.log('Auth initialization completed');
      }
    },

    // Sign up new user
    signUp: async (input: SignUpInput) => {
      set({ isLoading: true, error: null });

      try {
        const response = await AuthService.signUp(input);

        if (response.success && response.user && response.session) {
          // Determine user persona
          const persona = AuthService.determineUserPersona(response.user);
          const preferences = AuthService.getPersonaPreferences(persona);

          set({
            user: response.user,
            session: response.session,
            isAuthenticated: true,
            userPersona: persona,
            personaPreferences: preferences,
            onboardingCompleted: response.user.onboardingCompleted,
            isLoading: false,
          });
        } else {
          set({
            error: response.error || 'Sign up failed',
            isLoading: false,
          });
        }

        return response;
      } catch (error) {
        set({
          error: 'Sign up failed. Please try again.',
          isLoading: false,
        });
        return {
          success: false,
          error: 'Sign up failed. Please try again.',
        };
      }
    },

    // Sign in user
    signIn: async (input: SignInInput) => {
      set({ isLoading: true, error: null });

      try {
        const response = await AuthService.signIn(input);

        if (response.success && response.user && response.session) {
          // Determine user persona
          const persona = AuthService.determineUserPersona(response.user);
          const preferences = AuthService.getPersonaPreferences(persona);

          set({
            user: response.user,
            session: response.session,
            isAuthenticated: true,
            userPersona: persona,
            personaPreferences: preferences,
            onboardingCompleted: response.user.onboardingCompleted,
            isLoading: false,
          });
        } else {
          set({
            error: response.error || 'Sign in failed',
            isLoading: false,
          });
        }

        return response;
      } catch (error) {
        set({
          error: 'Sign in failed. Please try again.',
          isLoading: false,
        });
        return {
          success: false,
          error: 'Sign in failed. Please try again.',
        };
      }
    },

    // Sign in with biometrics
    signInWithBiometrics: async () => {
      set({ isLoading: true, error: null });

      try {
        const response = await AuthService.signInWithBiometrics();

        if (response.success && response.user && response.session) {
          // Determine user persona
          const persona = AuthService.determineUserPersona(response.user);
          const preferences = AuthService.getPersonaPreferences(persona);

          set({
            user: response.user,
            session: response.session,
            isAuthenticated: true,
            userPersona: persona,
            personaPreferences: preferences,
            onboardingCompleted: response.user.onboardingCompleted,
            isLoading: false,
          });
        } else {
          set({
            error: response.error || 'Biometric sign in failed',
            isLoading: false,
          });
        }

        return response;
      } catch (error) {
        set({
          error: 'Biometric sign in failed. Please try again.',
          isLoading: false,
        });
        return {
          success: false,
          error: 'Biometric sign in failed. Please try again.',
        };
      }
    },

    // Sign out user
    signOut: async () => {
      set({ isLoading: true });

      try {
        await AuthService.signOut();
        
        // Clear all authentication state
        set({
          user: null,
          session: null,
          isAuthenticated: false,
          userPersona: null,
          personaPreferences: null,
          biometricsEnabled: false,
          consentVersion: null,
          onboardingCompleted: false,
          onboardingStep: 0,
          error: null,
          isLoading: false,
        });
      } catch (error) {
        // Critical auth error - should be logged in production
        console.error('Sign out error:', error);
        // Clear local state even if server call fails
        set({
          user: null,
          session: null,
          isAuthenticated: false,
          userPersona: null,
          personaPreferences: null,
          biometricsEnabled: false,
          consentVersion: null,
          onboardingCompleted: false,
          onboardingStep: 0,
          error: null,
          isLoading: false,
        });
      }
    },

    // Reset password
    resetPassword: async (input: ResetPasswordInput) => {
      set({ isLoading: true, error: null });

      try {
        const response = await AuthService.resetPassword(input);
        
        if (!response.success) {
          set({ error: response.error || 'Password reset failed' });
        }

        set({ isLoading: false });
        return response;
      } catch (error) {
        set({
          error: 'Password reset failed. Please try again.',
          isLoading: false,
        });
        return {
          success: false,
          error: 'Password reset failed. Please try again.',
        };
      }
    },

    // Change password
    changePassword: async (input: ChangePasswordInput) => {
      set({ isLoading: true, error: null });

      try {
        const response = await AuthService.changePassword(input);
        
        if (!response.success) {
          set({ error: response.error || 'Password change failed' });
        }

        set({ isLoading: false });
        return response;
      } catch (error) {
        set({
          error: 'Password change failed. Please try again.',
          isLoading: false,
        });
        return {
          success: false,
          error: 'Password change failed. Please try again.',
        };
      }
    },

    // Update user profile
    updateProfile: async (input: UpdateProfileInput) => {
      set({ isLoading: true, error: null });

      try {
        const response = await AuthService.updateProfile(input);
        
        if (response.success && response.user) {
          set({ user: response.user });
        } else {
          set({ error: response.error || 'Profile update failed' });
        }

        set({ isLoading: false });
        return response;
      } catch (error) {
        set({
          error: 'Profile update failed. Please try again.',
          isLoading: false,
        });
        return {
          success: false,
          error: 'Profile update failed. Please try again.',
        };
      }
    },

    // Update consent (PIPEDA compliance)
    updateConsent: async (input: ConsentUpdateInput) => {
      set({ isLoading: true, error: null });

      try {
        const response = await AuthService.updateConsent(input);
        
        if (response.success) {
          set({ 
            consentVersion: input.consentVersion,
            needsConsentUpdate: false,
          });
        } else {
          set({ error: response.error || 'Consent update failed' });
        }

        set({ isLoading: false });
        return response;
      } catch (error) {
        set({
          error: 'Consent update failed. Please try again.',
          isLoading: false,
        });
        return {
          success: false,
          error: 'Consent update failed. Please try again.',
        };
      }
    },

    // Setup biometric authentication
    setupBiometrics: async () => {
      set({ isLoading: true, error: null });

      try {
        const response = await AuthService.setupBiometrics();
        
        if (response.success) {
          set({ biometricsEnabled: true });
        } else {
          set({ error: response.error || 'Biometric setup failed' });
        }

        set({ isLoading: false });
        return response;
      } catch (error) {
        set({
          error: 'Biometric setup failed. Please try again.',
          isLoading: false,
        });
        return {
          success: false,
          error: 'Biometric setup failed. Please try again.',
        };
      }
    },

    // Disable biometric authentication
    disableBiometrics: async () => {
      set({ isLoading: true, error: null });

      try {
        const response = await AuthService.disableBiometrics();
        
        if (response.success) {
          set({ biometricsEnabled: false });
        } else {
          set({ error: response.error || 'Failed to disable biometrics' });
        }

        set({ isLoading: false });
        return response;
      } catch (error) {
        set({
          error: 'Failed to disable biometrics. Please try again.',
          isLoading: false,
        });
        return {
          success: false,
          error: 'Failed to disable biometrics. Please try again.',
        };
      }
    },

    // Refresh current user data
    refreshUser: async () => {
      if (!get().isAuthenticated) return;

      set({ isLoading: true });

      try {
        const user = await AuthService.getCurrentUser();
        
        if (user) {
          // Update persona if needed
          const persona = AuthService.determineUserPersona(user);
          const preferences = AuthService.getPersonaPreferences(persona);

          set({
            user,
            userPersona: persona,
            personaPreferences: preferences,
            onboardingCompleted: user.onboardingCompleted,
          });
        }

        set({ isLoading: false });
      } catch (error) {
        // Critical auth error - should be logged in production
        console.error('Refresh user error:', error);
        set({ 
          error: 'Failed to refresh user data',
          isLoading: false,
        });
      }
    },

    // Clear error state
    clearError: () => {
      set({ error: null });
    },

    // Set onboarding step
    setOnboardingStep: (step: number) => {
      set({ onboardingStep: step });
      // Save to local storage for persistence
      StorageHelpers.setOnboardingState({ step, timestamp: Date.now() });
    },

    // Complete onboarding
    completeOnboarding: async () => {
      set({ onboardingCompleted: true, onboardingStep: 0 });
      // Clear onboarding state from storage
      await StorageHelpers.clearOnboardingState();
    },

    // Update persona preferences
    updatePersonaPreferences: async (preferences: Partial<PersonaPreferences>) => {
      const current = get().personaPreferences;
      if (current) {
        const updated = { ...current, ...preferences };
        set({ personaPreferences: updated });
        await StorageHelpers.setUserPreferences(updated);
      }
    },

    // Development-only method to reset onboarding status
    resetOnboardingForDev: async () => {
      // Only allow in development mode
      if (!__DEV__) {
        if (__DEV__) {
          console.warn('resetOnboardingForDev is only available in development mode');
        }
        return {
          success: false,
          error: 'This function is only available in development mode',
        };
      }

      const currentUser = get().user;
      if (!currentUser) {
        return {
          success: false,
          error: 'No authenticated user found',
        };
      }

      set({ isLoading: true, error: null });

      try {
        // For development, we'll reset local state only
        // This will force the user to go through onboarding again
        // The backend will still have onboardingCompleted = true, but locally we'll treat it as false
        
        // Update local state to mark onboarding as incomplete
        const updatedUser = { ...currentUser, onboardingCompleted: false };
        
        set({
          user: updatedUser,
          onboardingCompleted: false,
          onboardingStep: 0,
          isLoading: false,
        });

        // Clear onboarding state from storage
        await StorageHelpers.clearOnboardingState();

        if (__DEV__) {
          console.log('[DEV] Onboarding status reset successfully (local state only)');
        }
        if (__DEV__) {
          console.log('[DEV] Note: Backend still shows onboarding as completed, but app will show onboarding flow');
        }
        
        return {
          success: true,
          message: 'Onboarding status reset successfully! The app will now show the onboarding flow.',
        };
      } catch (error) {
        if (__DEV__) {
          console.error('[DEV] Error resetting onboarding status:', error);
        }
        set({
          error: 'Failed to reset onboarding status. Please try again.',
          isLoading: false,
        });
        return {
          success: false,
          error: 'Failed to reset onboarding status. Please try again.',
        };
      }
    },
  }))
);

// Selectors for common state combinations
export const useAuth = () => {
  const store = useAuthStore();
  return {
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    isInitialized: store.isInitialized,
    error: store.error,
  };
};

export const useUserPersona = () => {
  const store = useAuthStore();
  return {
    persona: store.userPersona,
    preferences: store.personaPreferences,
    updatePreferences: store.updatePersonaPreferences,
  };
};

export const useBiometrics = () => {
  const store = useAuthStore();
  return {
    available: store.biometricsAvailable,
    enabled: store.biometricsEnabled,
    setup: store.setupBiometrics,
    disable: store.disableBiometrics,
    signIn: store.signInWithBiometrics,
  };
};

export const useOnboarding = () => {
  const store = useAuthStore();
  return {
    completed: store.onboardingCompleted,
    step: store.onboardingStep,
    setStep: store.setOnboardingStep,
    complete: store.completeOnboarding,
  };
};

export default useAuthStore;