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
  split,
  ApolloLink,
  Observable,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { ErrorLink } from '@apollo/client/link/error';
import { RetryLink } from '@apollo/client/link/retry';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';
// Apollo Client 3.x compatible imports
import { ApolloError } from '@apollo/client/errors';
import { StorageHelpers } from '../../hooks/useUniversalStorage';
import { RateLimitFeedbackManager, parseRetryAfter } from '../utils/rateLimitFeedback';

// Suppress specific Apollo Client warnings in development
if (__DEV__) {
  const originalWarn = console.warn;
  console.warn = (...args) => {
    // Suppress canonizeResults deprecation warning from Apollo Client internals
    if (args[0]?.includes?.('canonizeResults') || 
        (typeof args[0] === 'string' && args[0].includes('cache.diff'))) {
      return; // Suppress this specific warning
    }
    // Suppress Apollo error URL warnings (they're handled by error links)
    if (args[0]?.includes?.('go.apollo.dev/c/err')) {
      return; // Suppress Apollo error URL warnings
    }
    originalWarn.apply(console, args);
  };
}

// GraphQL endpoint configuration
// In development, use environment variable for mobile devices, fallback to localhost for web
const GRAPHQL_ENDPOINT = __DEV__
  ? (process.env.EXPO_PUBLIC_GRAPHQL_URL || 'http://localhost:8001/graphql')  // Development backend - env var for iOS/Android, localhost for web
  : 'https://nestsync-api.railway.app/graphql'; // Production endpoint

/**
 * Secure WebSocket URL Generator
 * Converts HTTP/HTTPS GraphQL URLs to WebSocket URLs with proper encryption
 * 
 * Security Rules:
 * - Production (https://): Always use encrypted WebSocket (wss://)
 * nosemgrep: javascript.lang.security.audit.insecure-websocket
 * This is a comment explaining security pattern, not actual code
 * The actual implementation uses wss:// in production (see getWebSocketUrl function)
 * - Development (http://): Use unencrypted WebSocket (ws://) for localhost only
 * nosemgrep: javascript.lang.security.audit.insecure-websocket
 * This is a comment explaining security pattern, not actual code
 * The actual implementation enforces wss:// in production via environment checks
 * - Replaces /graphql endpoint with /subscriptions
 * 
 * @param httpUrl - The HTTP/HTTPS GraphQL endpoint URL
 * @returns WebSocket URL with appropriate protocol (ws:// or wss://)
 */
const getWebSocketUrl = (httpUrl: string): string => {
  if (!httpUrl) {
    throw new Error('GraphQL URL is required for WebSocket connection');
  }

  let wsUrl = httpUrl;

  // Convert HTTPS to WSS (encrypted WebSocket for production)
  if (httpUrl.startsWith('https://')) {
    wsUrl = httpUrl.replace('https://', 'wss://');
  }
  // Convert HTTP to WS (unencrypted WebSocket for development only)
  else if (httpUrl.startsWith('http://')) {
    // In production, never use unencrypted WebSocket
    if (process.env.NODE_ENV === 'production') {
      // nosemgrep: javascript.lang.security.audit.insecure-websocket
      // This is an error message that PREVENTS insecure WebSocket usage in production
      // The error is thrown to enforce security, not create a vulnerability
      throw new Error('Cannot use unencrypted WebSocket (ws://) in production environment');
    }
    wsUrl = httpUrl.replace('http://', 'ws://');
  }
  else {
    throw new Error(`Invalid GraphQL URL protocol: ${httpUrl}`);
  }

  // Replace /graphql endpoint with /subscriptions
  wsUrl = wsUrl.replace('/graphql', '/subscriptions');

  // nosemgrep: javascript.lang.security.audit.insecure-websocket
  // Development-only logging that reports the result of secure URL generation
  // The URL has already been validated by getWebSocketUrl() function above
  if (__DEV__) {
    console.log(`WebSocket URL generated: ${wsUrl} (from ${httpUrl})`);
  }

  return wsUrl;
};

// WebSocket endpoint configuration for subscriptions
// Use secure URL generator to ensure proper encryption in production
const GRAPHQL_WS_ENDPOINT = getWebSocketUrl(
  __DEV__
    ? (process.env.EXPO_PUBLIC_GRAPHQL_URL || 'http://localhost:8001/graphql')
    : 'https://nestsync-api.railway.app/graphql'
);

// React Native polyfills for text streaming (required for subscriptions)
// TEMPORARILY DISABLED: Polyfill dependency issue with web-streams-polyfill
/*
if (typeof global !== 'undefined') {
  // Polyfill fetch for text streaming support in React Native
  if (!global.ReadableStream) {
    try {
      const { polyfill } = require('react-native-polyfill-globals/src/readable-stream');
      polyfill();
    } catch (error) {
      if (__DEV__) {
        console.warn('ReadableStream polyfill not available:', error);
      }
    }
  }

  if (!global.TextEncoder) {
    try {
      const { polyfill } = require('react-native-polyfill-globals/src/encoding');
      polyfill();
    } catch (error) {
      if (__DEV__) {
        console.warn('TextEncoder polyfill not available:', error);
      }
    }
  }
}
*/

// Create HTTP link with text streaming support
const httpLink = createHttpLink({
  uri: GRAPHQL_ENDPOINT,
  credentials: 'include', // Include cookies for session management
  fetchOptions: {
    // Enable text streaming for @defer support
    reactNative: { textStreaming: true },
  },
});

// Global token refresh coordination to prevent race conditions
let globalTokenRefreshPromise: Promise<string | null> | null = null;

// Token access functions using centralized StorageHelpers
const getAccessToken = async (): Promise<string | null> => {
  return await StorageHelpers.getAccessToken();
};

const getRefreshToken = async (): Promise<string | null> => {
  return await StorageHelpers.getRefreshToken();
};

const clearTokens = async (): Promise<void> => {
  await StorageHelpers.clearUserSession();
};

// Create WebSocket link for subscriptions with enhanced security and error handling
const wsLink = new GraphQLWsLink(
  createClient({
    url: GRAPHQL_WS_ENDPOINT,
    connectionParams: async () => {
      try {
        const accessToken = await getAccessToken();
        
        // nosemgrep: javascript.lang.security.audit.insecure-websocket
        // Development-only logging that reports connection protocol type
        // The protocol selection is handled securely by getWebSocketUrl() function
        if (__DEV__) {
          console.log('WebSocket connection params:', {
            hasToken: !!accessToken,
            endpoint: GRAPHQL_WS_ENDPOINT,
            protocol: GRAPHQL_WS_ENDPOINT.startsWith('wss://') ? 'encrypted' : 'unencrypted',
          });
        }
        
        return {
          authorization: accessToken ? `Bearer ${accessToken}` : undefined,
          'x-client-name': 'NestSync-Mobile',
          'x-client-version': '1.0.0',
          'x-canadian-compliance': 'PIPEDA',
          'X-Data-Residency': 'Canada',
          'X-Compliance-Framework': 'PIPEDA',
        };
      } catch (error) {
        if (__DEV__) {
          console.error('Failed to get access token for WebSocket connection:', error);
        }
        // Return empty params on error to allow connection without auth
        // (server will handle unauthorized access appropriately)
        return {};
      }
    },
    shouldRetry: (closeEvent) => {
      // Retry WebSocket connection for network issues but not auth failures
      const shouldRetry = closeEvent.code !== 4401; // Don't retry on authentication failure
      
      if (__DEV__) {
        console.log('WebSocket close event:', {
          code: closeEvent.code,
          reason: closeEvent.reason,
          willRetry: shouldRetry,
        });
      }
      
      return shouldRetry;
    },
    retryAttempts: 5,
    retryWait: async (attempt) => {
      // Exponential backoff: 1s, 2s, 4s, 8s, 16s
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 16000);
      if (__DEV__) {
        console.log(`WebSocket retry attempt ${attempt}, waiting ${delay}ms`);
      }
      return new Promise(resolve => setTimeout(resolve, delay));
    },
    on: {
      connected: () => {
        // nosemgrep: javascript.lang.security.audit.insecure-websocket
        // Development-only logging that confirms connection and reports protocol type
        // Connection is already established securely via getWebSocketUrl() validation
        if (__DEV__) {
          const protocol = GRAPHQL_WS_ENDPOINT.startsWith('wss://') ? 'encrypted (wss://)' : 'unencrypted (ws://)';
          console.log(`WebSocket connected for GraphQL subscriptions using ${protocol}`);
        }
      },
      closed: (event) => {
        if (__DEV__) {
          console.log('WebSocket connection closed:', {
            code: event.code,
            reason: event.reason || 'No reason provided',
            wasClean: event.wasClean,
          });
        }
      },
      error: (error) => {
        // Enhanced error handling with actionable information
        if (__DEV__) {
          console.error('WebSocket error occurred:', {
            error: error,
            endpoint: GRAPHQL_WS_ENDPOINT,
            message: error instanceof Error ? error.message : 'Unknown error',
          });
          
          // nosemgrep: javascript.lang.security.audit.insecure-websocket
          // This error message DETECTS and WARNS about insecure WebSocket configuration
          // This is a security control that alerts developers, not a vulnerability
          // Provide troubleshooting hints
          if (GRAPHQL_WS_ENDPOINT.startsWith('ws://') && process.env.NODE_ENV === 'production') {
            console.error('SECURITY ERROR: Unencrypted WebSocket (ws://) detected in production!');
          }
        }
      },
    },
  })
);

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
        'X-Data-Residency': 'Canada',
        'X-Compliance-Framework': 'PIPEDA',
      },
    };
  } catch (error) {
    if (__DEV__) {
      console.error('Failed to get access token for GraphQL request:', error);
    }
    return { headers };
  }
});

// JWT token expiry checker with configurable buffer
const isTokenExpiringSoon = (token: string, bufferMinutes: number = 5): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiryTime = payload.exp * 1000; // Convert to milliseconds
    const bufferTime = bufferMinutes * 60 * 1000;
    return Date.now() > (expiryTime - bufferTime);
  } catch {
    return true; // If we can't parse, assume it's expired
  }
};

// Global token refresh function with coordination and retry logic
const performGlobalTokenRefresh = async (retryCount: number = 0): Promise<string | null> => {
  // If a refresh is already in progress, wait for it
  if (globalTokenRefreshPromise) {
    if (__DEV__) {
      console.log('Token refresh already in progress, waiting...');
    }
    return await globalTokenRefreshPromise;
  }

  const MAX_RETRIES = 2;
  const RETRY_DELAY_MS = [1000, 3000]; // Exponential backoff: 1s, 3s

  // Start a new refresh
  globalTokenRefreshPromise = (async () => {
    try {
      const refreshToken = await getRefreshToken();

      if (!refreshToken) {
        if (__DEV__) {
          console.warn('No refresh token available for global refresh');
        }
        await clearTokens();
        return null;
      }

      if (__DEV__) {
        console.log(`Performing global token refresh... (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);
      }

      // Import the mutation here to avoid circular imports
      const { REFRESH_TOKEN_MUTATION } = await import('./queries');

      // Create a temporary client for the refresh mutation to avoid circular dependency
      const refreshClient = new ApolloClient({
        link: httpLink,
        cache: new InMemoryCache({
          // Remove deprecated addTypename option - Apollo Client 3.x sets this to true by default
        }),
      });

      const { data } = await refreshClient.mutate({
        mutation: REFRESH_TOKEN_MUTATION,
        variables: { refreshToken },
        context: { timeout: 10000 }, // 10 second timeout for refresh
      });

      if (data?.refreshToken?.success && data.refreshToken.session) {
        // Update tokens in storage
        await StorageHelpers.setAccessToken(data.refreshToken.session.accessToken);
        await StorageHelpers.setRefreshToken(data.refreshToken.session.refreshToken);

        if (__DEV__) {
          console.log('Global token refresh successful');
        }
        return data.refreshToken.session.accessToken;
      } else {
        throw new Error((data?.refreshToken as any)?.error || 'Token refresh failed');
      }
    } catch (error: any) {
      // Enhanced error detection and handling
      const isNetworkError =
        error?.networkError ||
        error?.message?.includes('Network request failed') ||
        error?.message?.includes('Failed to fetch') ||
        error?.message?.includes('timeout');

      if (__DEV__) {
        if (isNetworkError) {
          console.error('Network error during token refresh, attempt:', retryCount + 1, error.message || error);
          console.error('Backend may be unreachable. Check if server is running on:', GRAPHQL_ENDPOINT);
        } else {
          console.error('Global token refresh error:', error);
        }
      }

      // Retry logic for network errors
      if (isNetworkError && retryCount < MAX_RETRIES) {
        const delay = RETRY_DELAY_MS[retryCount];
        if (__DEV__) {
          console.log(`Retrying token refresh in ${delay}ms...`);
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));

        // Clear the promise and retry
        globalTokenRefreshPromise = null;
        return await performGlobalTokenRefresh(retryCount + 1);
      }

      // Clear tokens only after all retries exhausted
      await clearTokens();
      return null;
    } finally {
      // Clear the global promise so future refreshes can proceed
      globalTokenRefreshPromise = null;
    }
  })();

  return await globalTokenRefreshPromise;
};

// Proactive token validation and refresh
export const ensureValidToken = async (bufferMinutes: number = 10): Promise<string | null> => {
  try {
    const accessToken = await getAccessToken();
    
    if (!accessToken) {
      if (__DEV__) {
        console.log('No access token available');
      }
      return null;
    }
    
    if (isTokenExpiringSoon(accessToken, bufferMinutes)) {
      if (__DEV__) {
        console.log(`Token expiring within ${bufferMinutes} minutes, refreshing...`);
      }
      const newToken = await performGlobalTokenRefresh();
      return newToken;
    }
    
    return accessToken;
  } catch (error) {
    if (__DEV__) {
      console.error('Error ensuring valid token:', error);
    }
    return null;
  }
};

// Enhanced token refresh link using Apollo Client 3.x compatible error handling
const tokenRefreshLink = new ErrorLink(({ error, operation, forward }) => {
  if (!error || !operation || !forward) {
    return;
  }
  
  // Check for authentication errors using Apollo Client 3.x patterns
  const isAuthError = 
    // Network error with 401 status
    (error.networkError && 'statusCode' in error.networkError && (error.networkError as any).statusCode === 401) ||
    // GraphQL authentication errors
    (error.graphQLErrors && error.graphQLErrors.some((err: any) => 
      err.message?.includes('Authentication required') ||
      err.message?.includes('authentication') ||
      err.message?.includes('unauthorized') ||
      err.extensions?.code === 'UNAUTHENTICATED' ||
      err.extensions?.code === 'FORBIDDEN'
    ));

  // Don't attempt token refresh on rate limiting errors (handled by RetryLink)
  const isRateLimited = error.networkError && 'statusCode' in error.networkError && (error.networkError as any).statusCode === 429;

  if (isAuthError && !operation.getContext().skipTokenRefresh && !isRateLimited) {
    if (__DEV__) {
      console.log('Authentication error detected, attempting token refresh...');
    }
    
    return new Observable((observer) => {
      (async () => {
        try {
          const newAccessToken = await performGlobalTokenRefresh();
          
          if (newAccessToken) {
            if (__DEV__) {
              console.log('Token refresh successful, retrying operation...');
            }
            
            // Update the operation context with the new token
            const retryOperation = operation.setContext(({ headers = {} }) => ({
              headers: {
                ...headers,
                authorization: `Bearer ${newAccessToken}`,
              },
              skipTokenRefresh: true // Prevent infinite retry loop
            }));
            
            // Retry the operation
            const retryObservable = forward(retryOperation) as Observable<any>;
            if (retryObservable) {
              retryObservable.subscribe({
                next: (result) => observer.next(result),
                error: (retryError) => {
                  if (__DEV__) {
                    console.error('Retry operation failed after token refresh:', retryError);
                  }
                  observer.error(retryError);
                },
                complete: () => observer.complete(),
              });
            } else {
              observer.error(error);
            }
          } else {
            if (__DEV__) {
              console.warn('Token refresh failed, forwarding original error');
            }
            observer.error(error);
          }
        } catch (refreshError) {
          if (__DEV__) {
            console.error('Error during token refresh:', refreshError);
          }
          observer.error(error);
        }
      })();
    });
  }

  // If not an auth error or retry is disabled, return nothing to let error bubble up
  return;
});

// Transform authentication response data to handle Supabase identity validation issues
const transformResponseData = (data: any): any => {
  if (!data) return data;

  // Handle sign-in response
  if (data.signIn && data.signIn.user) {
    const user = { ...data.signIn.user };

    // Ensure user identities have proper identity_id field
    if (user.identities && Array.isArray(user.identities)) {
      user.identities = user.identities.map((identity: any) => {
        if (identity.id && !identity.identity_id) {
          return { ...identity, identity_id: identity.id };
        }
        return identity;
      });
    }

    data.signIn.user = user;
  }

  // Handle sign-up response
  if (data.signUp && data.signUp.user) {
    const user = { ...data.signUp.user };

    // Ensure user identities have proper identity_id field
    if (user.identities && Array.isArray(user.identities)) {
      user.identities = user.identities.map((identity: any) => {
        if (identity.id && !identity.identity_id) {
          return { ...identity, identity_id: identity.id };
        }
        return identity;
      });
    }

    data.signUp.user = user;
  }

  return data;
};

// Error handling and response transformation link
const errorLoggingLink = new ErrorLink(({ error, operation, forward }) => {
  if (!error) {
    return;
  }

  // Handle specific validation errors
  if (error.message && error.message.includes('validation error for Session')) {
    console.warn('Supabase session validation error detected, attempting to transform response');

    // Try to extract the response data and transform it
    if (error.networkError && 'result' in error.networkError) {
      const networkError = error.networkError as any;
      if (networkError.result && networkError.result.data) {
        try {
          const transformedData = transformResponseData(networkError.result.data);
          networkError.result.data = transformedData;
          console.log('Response data transformed to handle validation error');
        } catch (transformError) {
          console.error('Failed to transform response data:', transformError);
        }
      }
    }
  }

  // Handle GraphQL errors using Apollo Client 3.x patterns
  if (error.graphQLErrors && __DEV__) {
    error.graphQLErrors.forEach((graphQLError: any) => {
      const { message, locations, path, extensions } = graphQLError;

      // Don't log validation errors as errors since we're handling them
      if (!message.includes('validation error for Session')) {
        console.error(
          `GraphQL error: Message: ${message}, Location: ${locations}, Path: ${path}`
        );
      }

      // Handle specific error types (non-auth)
      if (extensions?.code === 'PIPEDA_COMPLIANCE_ERROR') {
        console.error('PIPEDA compliance error:', message);
      }
    });
  }

  // Handle network errors using Apollo Client 3.x patterns
  if (error.networkError && __DEV__) {
    // Don't log validation errors as network errors
    if (!error.networkError.message.includes('validation error for Session')) {
      console.error('Network error:', error.networkError.message);
    }

    // Check if it's a server error with status code
    if ('statusCode' in error.networkError) {
      const statusCode = (error.networkError as any).statusCode;
      console.error('Status:', statusCode);

      switch (statusCode) {
        case 403:
          console.error('Access forbidden - insufficient permissions');
          break;
        case 429:
          console.error('Rate limit exceeded (429) - handled by RetryLink');
          break;
        case 500:
        case 502:
        case 503:
          console.error('Server error - handled by RetryLink if retryable');
          break;
      }
    }
  }

  // Log other error types
  if (error && !error.graphQLErrors && !error.networkError && __DEV__) {
    // Don't log validation errors
    if (!error.message.includes('validation error for Session')) {
      console.error('Other Apollo Client error:', error.message);
    }
  }
});

// Rate limiting link using Apollo Client's built-in RetryLink
// This prevents React re-render loops and follows Apollo Client best practices
const rateLimitingRetryLink = new RetryLink({
  attempts: (attempt, operation, error) => {
    const rateLimitManager = RateLimitFeedbackManager.getInstance();
    
    // Don't retry mutations to prevent data corruption
    const isMutation = operation.query.definitions.some((def: any) => 
      def.kind === 'OperationDefinition' && def.operation === 'mutation'
    );
    
    if (isMutation) {
      if (__DEV__) {
        console.log('Not retrying mutation operation');
      }
      return false;
    }
    
    // Don't retry authentication errors
    const isAuthError = error?.networkError && 
      'statusCode' in error.networkError && 
      [(error.networkError as any).statusCode].includes(401);
    
    const hasAuthGraphQLError = error?.graphQLErrors?.some((err: any) => 
      err.extensions?.code === 'UNAUTHENTICATED' ||
      err.extensions?.code === 'FORBIDDEN'
    );
    
    if (isAuthError || hasAuthGraphQLError) {
      if (__DEV__) {
        console.log('Not retrying authentication error');
      }
      return false;
    }
    
    // Handle rate limiting (429) and network connectivity errors
    const isRateLimited = error?.networkError && 
      'statusCode' in error.networkError && 
      (error.networkError as any).statusCode === 429;
    
    const isNetworkError = error?.networkError?.message?.includes('Failed to fetch');
    
    // Reduce retries for rate limiting to prevent amplification, keep low for other network issues
    const maxAttempts = isRateLimited ? 2 : 2;
    
    if (attempt <= maxAttempts && (isRateLimited || isNetworkError)) {
      if (__DEV__) {
        const errorType = isRateLimited ? 'Rate limit' : 'Network';
        console.log(`${errorType} error - retry attempt ${attempt}/${maxAttempts}`);
      }
      
      // Update rate limit feedback for UI
      if (isRateLimited) {
        rateLimitManager.setRateLimited(0, 0, attempt, maxAttempts);
      }
      
      return true;
    }
    
    // Clear rate limiting feedback after all retries exhausted or on success
    if (attempt > 1) {
      rateLimitManager.clearRateLimit();
    }
    
    return false;
  },
  
  delay: (attempt, operation, error) => {
    // Extract Retry-After header from 429 responses
    let retryAfter = 0;
    if (error?.networkError && 'response' in error.networkError) {
      const response = (error.networkError as any).response;
      if (response?.headers) {
        const retryAfterHeader = response.headers.get ? 
          response.headers.get('retry-after') : 
          response.headers['retry-after'];
        retryAfter = parseRetryAfter(retryAfterHeader);
      }
    }
    
    // Check if this is a rate limiting error
    const isRateLimited = error?.networkError && 
      'statusCode' in error.networkError && 
      (error.networkError as any).statusCode === 429;
    
    if (isRateLimited) {
      // Use server's retry-after if provided, otherwise exponential backoff
      if (retryAfter > 0) {
        const serverDelay = retryAfter * 1000; // Convert to milliseconds
        // Add jitter to prevent thundering herd (±25% variation)
        const jitter = serverDelay * (0.75 + Math.random() * 0.5);
        const finalDelay = Math.round(jitter);
        
        if (__DEV__) {
          console.log(`Rate limit retry delay: ${finalDelay}ms (server: ${retryAfter}s)`);
        }
        
        // Update feedback manager with actual delay
        const rateLimitManager = RateLimitFeedbackManager.getInstance();
        rateLimitManager.setRateLimited(retryAfter, finalDelay, attempt, 2);
        
        return finalDelay;
      } else {
        // Enhanced exponential backoff for rate limiting: 2s, 5s (reduced retries to prevent amplification)
        const exponentialDelay = Math.min(2000 * Math.pow(2.5, attempt - 1), 30000);
        // Add jitter to prevent thundering herd
        const jitter = exponentialDelay * (0.75 + Math.random() * 0.5);
        const finalDelay = Math.round(jitter);
        
        if (__DEV__) {
          console.log(`Rate limit exponential backoff: ${finalDelay}ms (attempt ${attempt})`);
        }
        
        // Update feedback manager
        const rateLimitManager = RateLimitFeedbackManager.getInstance();
        rateLimitManager.setRateLimited(Math.ceil(finalDelay / 1000), finalDelay, attempt, 2);
        
        return finalDelay;
      }
    } else {
      // For other network errors, use simple linear backoff
      const networkDelay = 1000 * attempt; // 1s, 2s
      
      if (__DEV__) {
        console.log(`Network error retry delay: ${networkDelay}ms`);
      }
      
      return networkDelay;
    }
  },
});

// Split link to route operations: subscriptions to WebSocket, queries/mutations to HTTP
const splitLink = split(
  ({ operationType }) => {
    return operationType === 'subscription';
  },
  wsLink, // Use WebSocket for subscriptions
  from([
    // HTTP link chain for queries and mutations
    rateLimitingRetryLink,
    tokenRefreshLink,
    authLink,
    httpLink,
  ])
);

// Create timeout link for global query timeout handling
const timeoutLink = new ApolloLink((operation, forward) => {
  // Default timeout of 8 seconds for all operations
  const timeout = operation.getContext().timeout || 8000;

  return new Observable(observer => {
    let handle: NodeJS.Timeout;
    let cancelled = false;

    const timeoutHandler = () => {
      if (!cancelled) {
        cancelled = true;
        observer.error(new Error(
          `Query timeout: ${operation.operationName || 'Unknown'} took longer than ${timeout}ms`
        ));
      }
    };

    handle = setTimeout(timeoutHandler, timeout);

    const subscription = forward(operation).subscribe({
      next: (result) => {
        if (!cancelled) {
          clearTimeout(handle);
          observer.next(result);
        }
      },
      error: (error) => {
        if (!cancelled) {
          clearTimeout(handle);
          observer.error(error);
        }
      },
      complete: () => {
        if (!cancelled) {
          clearTimeout(handle);
          observer.complete();
        }
      }
    });

    return () => {
      cancelled = true;
      clearTimeout(handle);
      subscription.unsubscribe();
    };
  });
});

// Create Apollo Client with split link for HTTP and WebSocket support
export const apolloClient = new ApolloClient({
  link: from([
    // Error logging should come first to catch all errors
    errorLoggingLink,
    // Global timeout handling
    timeoutLink,
    // Split link routes operations appropriately
    splitLink,
  ]),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          myChildren: {
            // Use cache-and-network for real-time updates, prevent pagination conflicts
            keyArgs: false,
            merge(existing, incoming, { args, readField }) {
              // CRITICAL FIX: Always return incoming data to prevent cache normalization issues
              console.log('Apollo Cache: myChildren merge called', {
                existing,
                incoming,
                args,
                incomingEdgesLength: incoming?.edges?.length || 0,
                existingEdgesLength: existing?.edges?.length || 0
              });

              // Always use incoming data for fresh queries (no pagination cursor)
              if (!args?.after) {
                console.log('Apollo Cache: Fresh query, returning incoming data:', incoming);
                // Ensure we're not returning null/undefined
                return incoming || { edges: [], pageInfo: { hasNextPage: false, hasPreviousPage: false } };
              }

              // For pagination, append new edges to existing ones
              if (existing && incoming) {
                const mergedResult = {
                  ...incoming,
                  edges: [...(existing.edges || []), ...(incoming.edges || [])],
                };
                console.log('Apollo Cache: Pagination merge result:', mergedResult);
                return mergedResult;
              }

              // Fallback to incoming data
              console.log('Apollo Cache: Fallback to incoming data:', incoming);
              return incoming || { edges: [], pageInfo: { hasNextPage: false, hasPreviousPage: false } };
            },
          },
        },
      },
      // Add Child type policy for proper cache normalization
      Child: {
        keyFields: ["id"],
        fields: {
          // Ensure child fields merge properly
          name: {
            merge(existing, incoming) {
              return incoming; // Always use latest name
            },
          },
          currentDiaperSize: {
            merge(existing, incoming) {
              return incoming; // Always use latest size
            },
          },
        },
      },
      User: {
        keyFields: ["id"],
        fields: {
          me: {
            merge(existing, incoming) {
              return { ...existing, ...incoming };
            },
          },
        },
      },
      ChildConnection: {
        keyFields: false, // ChildConnection doesn't need its own identity
        fields: {
          edges: {
            merge(existing = [], incoming = [], { readField }) {
              // CRITICAL FIX: For fresh queries (no pagination), always use incoming data
              // This prevents cache normalization from causing empty edges arrays
              if (existing.length === 0 || !incoming.length) {
                console.log('ChildConnection edges: Using incoming data for fresh query:', incoming);
                return incoming;
              }

              // For pagination, ensure proper deduplication
              const existingIds = new Set(
                existing.map((edge: any) => readField('id', edge.node)).filter(Boolean)
              );

              const uniqueIncoming = incoming.filter(
                (edge: any) => {
                  const nodeId = readField('id', edge.node);
                  return nodeId && !existingIds.has(nodeId);
                }
              );

              const result = [...existing, ...uniqueIncoming];
              console.log('ChildConnection edges: Merged result:', result);
              return result;
            },
          },
          pageInfo: {
            merge(existing, incoming) {
              return incoming; // Always use latest pageInfo
            },
          },
        },
      },
      ConsentConnection: {
        fields: {
          edges: {
            merge(existing, incoming) {
              return incoming; // Replace existing edges for consents
            },
          },
        },
      },
    },
    resultCaching: true,
    // Enable detailed cache inspection in development
    addTypename: true,
  }),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all', // Allow partial data and handle errors gracefully
      notifyOnNetworkStatusChange: true,
      fetchPolicy: 'cache-first', // Prioritize cache for better performance
      context: { timeout: 8000 }, // 8 second timeout for watch queries
    },
    query: {
      errorPolicy: 'all', // Handle GraphQL errors gracefully, allow partial data
      fetchPolicy: 'cache-first', // Use cache when available for better performance
      context: { timeout: 8000 }, // 8 second timeout for queries
    },
    mutate: {
      errorPolicy: 'none', // Keep strict error handling for mutations - critical for onboarding
      fetchPolicy: 'no-cache', // Always execute mutations fresh
      context: { timeout: 10000 }, // 10 second timeout for mutations
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
    if (__DEV__) {
      console.log('Apollo cache cleared successfully');
    }
  } catch (error) {
    if (__DEV__) {
      console.error('Failed to clear Apollo cache:', error);
    }
  }
};

// Reset Apollo cache (useful for user switching)
export const resetApolloCache = async (): Promise<void> => {
  try {
    await apolloClient.resetStore();
    if (__DEV__) {
      console.log('Apollo cache reset successfully');
    }
  } catch (error) {
    if (__DEV__) {
      console.error('Failed to reset Apollo cache:', error);
    }
  }
};

// Connection health check function
export const checkGraphQLConnection = async (): Promise<boolean> => {
  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: '{ __typename }', // Simple introspection query
      }),
    });

    return response.ok;
  } catch (error) {
    if (__DEV__) {
      console.warn('GraphQL connection health check failed:', error);
    }
    return false;
  }
};

// Enhanced connection validator with timeout
export const validateConnection = async (timeoutMs: number = 5000): Promise<boolean> => {
  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => resolve(false), timeoutMs);

    checkGraphQLConnection()
      .then((isHealthy) => {
        clearTimeout(timeoutId);
        resolve(isHealthy);
      })
      .catch(() => {
        clearTimeout(timeoutId);
        resolve(false);
      });
  });
};

// Connection-aware query wrapper
export const safeQuery = async (query: any, variables?: any): Promise<any> => {
  // Check connection health before executing query
  const isConnected = await validateConnection(3000);

  if (!isConnected) {
    if (__DEV__) {
      console.warn('GraphQL server is not available. Skipping query.');
    }
    throw new Error('Network unavailable - GraphQL server not responding');
  }

  try {
    const result = await apolloClient.query({
      query,
      variables,
      errorPolicy: 'all',
      fetchPolicy: 'network-only', // Always check server when connection is verified
    });

    return result;
  } catch (error) {
    if (__DEV__) {
      console.error('GraphQL query failed after connection check:', error);
    }
    throw error;
  }
};

// Export token validation and refresh functions for authStore
export { isTokenExpiringSoon, performGlobalTokenRefresh };

// Export rate limiting manager for component use
export const rateLimitingManager = RateLimitFeedbackManager.getInstance();

// Export client as default
export default apolloClient;