/**
 * GraphQL Apollo Client Configuration
 * Configures Apollo Client with authentication and error handling
 * for NestSync Canadian diaper planning application
 */

import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  from,
  ApolloLink,
  Observable,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// GraphQL endpoint configuration
const GRAPHQL_ENDPOINT = __DEV__
  ? 'http://localhost:8001/graphql'  // Development backend
  : 'https://nestsync-api.railway.app/graphql'; // Production endpoint

// Create HTTP link
const httpLink = createHttpLink({
  uri: GRAPHQL_ENDPOINT,
  credentials: 'include', // Include cookies for session management
});

// Universal token retrieval for cross-platform compatibility
const getAccessToken = async (): Promise<string | null> => {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem('nestsync_access_token');
    } else {
      return await SecureStore.getItemAsync('nestsync_access_token');
    }
  } catch (error) {
    console.error('Failed to get access token:', error);
    return null;
  }
};

const getRefreshToken = async (): Promise<string | null> => {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem('nestsync_refresh_token');
    } else {
      return await SecureStore.getItemAsync('nestsync_refresh_token');
    }
  } catch (error) {
    console.error('Failed to get refresh token:', error);
    return null;
  }
};

const clearTokens = async (): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem('nestsync_access_token');
      localStorage.removeItem('nestsync_refresh_token');
      localStorage.removeItem('nestsync_user_session');
    } else {
      await Promise.all([
        SecureStore.deleteItemAsync('nestsync_access_token'),
        SecureStore.deleteItemAsync('nestsync_refresh_token'),
        SecureStore.deleteItemAsync('nestsync_user_session'),
      ]);
    }
  } catch (error) {
    console.error('Failed to clear tokens:', error);
  }
};

// Authentication link - adds authorization header
const authLink = setContext(async (_, { headers }) => {
  try {
    const accessToken = await getAccessToken();
    
    return {
      headers: {
        ...headers,
        ...(accessToken && {
          authorization: `Bearer ${accessToken}`,
        }),
        'x-client-name': 'NestSync-Mobile',
        'x-client-version': '1.0.0',
        'x-canadian-compliance': 'PIPEDA',
      },
    };
  } catch (error) {
    console.error('Failed to get access token for GraphQL request:', error);
    return { headers };
  }
});

// Token refresh link - handles token refresh on 401 errors
const tokenRefreshLink = new ApolloLink((operation, forward) => {
  return new Observable((observer) => {
    forward(operation).subscribe({
      next: (result) => {
        observer.next(result);
      },
      error: async (error) => {
        if (
          error.networkError &&
          'statusCode' in error.networkError &&
          error.networkError.statusCode === 401
        ) {
          try {
            // Attempt token refresh
            const refreshToken = await getRefreshToken();
            
            if (refreshToken) {
              // Here you would call a refresh token mutation
              // For now, we'll clear the session and let the user re-authenticate
              await clearTokens();
              
              // Optionally notify the auth store to update UI state
              // This would be handled by the auth service
            }
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
          }
        }
        observer.error(error);
      },
      complete: () => {
        observer.complete();
      },
    });
  });
});

// Error link - handles GraphQL and network errors
const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  // Handle GraphQL errors
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path, extensions }) => {
      console.error(
        `GraphQL error: Message: ${message}, Location: ${locations}, Path: ${path}`
      );
      
      // Handle specific error types
      if (extensions?.code === 'UNAUTHENTICATED') {
        // Clear stored session
        clearTokens().catch(console.error);
      }
      
      if (extensions?.code === 'PIPEDA_COMPLIANCE_ERROR') {
        // Handle Canadian privacy compliance errors
        console.error('PIPEDA compliance error:', message);
      }
    });
  }

  // Handle network errors
  if (networkError) {
    console.error(`Network error: ${networkError.message}`);
    
    // Handle offline scenarios
    if ('statusCode' in networkError) {
      switch (networkError.statusCode) {
        case 401:
          // Unauthorized - clear session
          clearTokens().catch(console.error);
          break;
        case 403:
          // Forbidden - user doesn't have permission
          console.error('Access forbidden');
          break;
        case 429:
          // Rate limited
          console.error('Rate limit exceeded');
          break;
        case 500:
        case 502:
        case 503:
          // Server errors
          console.error('Server error - will retry');
          break;
      }
    }
  }
});

// Simple retry logic without external dependency
const createRetryLink = () => {
  return new ApolloLink((operation, forward) => {
    return new Observable((observer) => {
      let attempt = 0;
      const maxAttempts = 3;
      const initialDelay = 300;

      const tryRequest = () => {
        forward(operation).subscribe({
          next: (result) => {
            observer.next(result);
          },
          error: (error) => {
            if (
              attempt < maxAttempts &&
              error.networkError &&
              !error.result
            ) {
              attempt++;
              const delay = initialDelay * Math.pow(2, attempt - 1);
              setTimeout(tryRequest, delay);
            } else {
              observer.error(error);
            }
          },
          complete: () => {
            observer.complete();
          },
        });
      };

      tryRequest();
    });
  });
};

// Create Apollo Client
export const apolloClient = new ApolloClient({
  link: from([
    errorLink,
    createRetryLink(),
    tokenRefreshLink,
    authLink,
    httpLink,
  ]),
  cache: new InMemoryCache({
    typePolicies: {
      User: {
        fields: {
          // Cache user data for 5 minutes
          me: {
            merge: true,
          },
        },
      },
      ConsentConnection: {
        fields: {
          edges: {
            merge: false, // Replace existing edges
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all', // Return both data and errors
      notifyOnNetworkStatusChange: true,
    },
    query: {
      errorPolicy: 'all',
      fetchPolicy: 'cache-first', // Use cache when available
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
  devtools: {
    enabled: __DEV__, // Enable Apollo DevTools in development
  },
});

// Clear Apollo cache (useful for logout)
export const clearApolloCache = async (): Promise<void> => {
  try {
    await apolloClient.clearStore();
    console.log('Apollo cache cleared successfully');
  } catch (error) {
    console.error('Failed to clear Apollo cache:', error);
  }
};

// Reset Apollo cache (useful for user switching)
export const resetApolloCache = async (): Promise<void> => {
  try {
    await apolloClient.resetStore();
    console.log('Apollo cache reset successfully');
  } catch (error) {
    console.error('Failed to reset Apollo cache:', error);
  }
};

// Export client as default
export default apolloClient;