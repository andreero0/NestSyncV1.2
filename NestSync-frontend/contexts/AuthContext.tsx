/**
 * Authentication Context with Universal Storage
 * React Context-based authentication that works across web and native platforms
 * Uses universal storage hooks to resolve SecureStore web compatibility issues
 */

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { apolloClient, clearApolloCache } from '../lib/graphql/client';
import {
  useAccessToken,
  useRefreshToken,
  useUserSession,
  useConsentVersion,
  useOnboardingState,
  useUserPreferences,
} from '../hooks/useUniversalStorage';
import {
  SIGN_IN_MUTATION,
  SIGN_OUT_MUTATION,
  ME_QUERY,
  SignInMutationData,
  SignInMutationVariables,
  SignOutMutationData,
  MeQueryData,
} from '../lib/graphql/queries';
import {
  AuthResponse,
  UserProfile,
  UserSession,
  SignInInput,
  StoredSession,
} from '../lib/types/auth';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  signIn: (input: SignInInput) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [accessToken, setAccessToken] = useAccessToken();
  const [refreshToken, setRefreshToken] = useRefreshToken();
  const [userSession, setUserSession] = useUserSession();
  const [consentVersion, setConsentVersion] = useConsentVersion();
  const [onboardingState, setOnboardingState] = useOnboardingState();
  const [userPreferences, setUserPreferences] = useUserPreferences();

  const [state, setState] = React.useState<{
    user: UserProfile | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isInitialized: boolean;
    error: string | null;
  }>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    isInitialized: false,
    error: null,
  });

  // Initialize authentication state
  useEffect(() => {
    const initialize = async () => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        console.log('Initializing authentication context...');

        // Check for stored session
        if (userSession) {
          try {
            const storedSession = JSON.parse(userSession) as StoredSession;
            
            // Check if session has expired
            if (storedSession.expiresAt && Date.now() > storedSession.expiresAt) {
              console.log('Stored session has expired, clearing...');
              await clearSession();
              return;
            }

            // Verify session is still valid by querying current user
            const { data } = await apolloClient.query<MeQueryData>({
              query: ME_QUERY,
              fetchPolicy: 'network-only',
            });

            if (data?.me) {
              console.log('Session valid, setting authenticated state');
              setState(prev => ({
                ...prev,
                user: data.me as UserProfile,
                isAuthenticated: true,
                isLoading: false,
                isInitialized: true,
              }));
              return;
            }
          } catch (error) {
            console.log('Stored session is invalid, clearing...', error);
            await clearSession();
          }
        }

        // No valid session found
        setState(prev => ({
          ...prev,
          isAuthenticated: false,
          isLoading: false,
          isInitialized: true,
        }));
      } catch (error) {
        console.error('Failed to initialize auth context:', error);
        setState(prev => ({
          ...prev,
          error: `Failed to initialize authentication: ${(error as Error).message}`,
          isAuthenticated: false,
          isLoading: false,
          isInitialized: true,
        }));
      }
    };

    initialize();
  }, [userSession]);

  const signIn = async (input: SignInInput): Promise<AuthResponse> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { data } = await apolloClient.mutate<SignInMutationData, SignInMutationVariables>({
        mutation: SIGN_IN_MUTATION,
        variables: { input },
      });

      const response = data?.signIn;
      if (!response) {
        setState(prev => ({ ...prev, isLoading: false }));
        return {
          success: false,
          error: 'No response from server',
        };
      }

      if (response.success && response.user && response.session) {
        // Store session data using universal storage hooks
        const expiresAt = Date.now() + (response.session.expiresIn * 1000);
        const storedSession: StoredSession = {
          accessToken: response.session.accessToken,
          refreshToken: response.session.refreshToken,
          expiresAt,
          user: response.user as UserProfile,
        };

        await Promise.all([
          setAccessToken(response.session.accessToken),
          setRefreshToken(response.session.refreshToken),
          setUserSession(JSON.stringify(storedSession)),
        ]);

        setState(prev => ({
          ...prev,
          user: response.user as UserProfile,
          isAuthenticated: true,
          isLoading: false,
        }));

        return {
          success: true,
          message: response.message,
          user: response.user as UserProfile,
          session: response.session,
        };
      }

      setState(prev => ({
        ...prev,
        error: response.error || 'Sign in failed',
        isLoading: false,
      }));

      return {
        success: false,
        error: response.error || 'Sign in failed',
      };
    } catch (error) {
      console.error('Sign in error:', error);
      setState(prev => ({
        ...prev,
        error: 'Sign in failed. Please try again.',
        isLoading: false,
      }));
      return {
        success: false,
        error: 'Sign in failed. Please try again.',
      };
    }
  };

  const signOut = async (): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // Call server sign out
      await apolloClient.mutate<SignOutMutationData>({
        mutation: SIGN_OUT_MUTATION,
      });
    } catch (error) {
      console.error('Server sign out error:', error);
      // Continue with local cleanup even if server call fails
    }

    // Clear local session
    await clearSession();
  };

  const clearSession = async (): Promise<void> => {
    try {
      await Promise.all([
        setAccessToken(null),
        setRefreshToken(null),
        setUserSession(null),
      ]);

      await clearApolloCache();

      setState(prev => ({
        ...prev,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  };

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  const contextValue: AuthContextType = {
    ...state,
    signIn,
    signOut,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}