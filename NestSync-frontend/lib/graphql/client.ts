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
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { ErrorLink } from '@apollo/client/link/error';
import { RetryLink } from '@apollo/client/link/retry';
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
const GRAPHQL_ENDPOINT = __DEV__
  ? 'http://localhost:8001/graphql'  // Development backend - using localhost for testing
  : 'https://nestsync-api.railway.app/graphql'; // Production endpoint

// Create HTTP link
const httpLink = createHttpLink({
  uri: GRAPHQL_ENDPOINT,
  credentials: 'include', // Include cookies for session management
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

// Global token refresh function with coordination
const performGlobalTokenRefresh = async (): Promise<string | null> => {
  // If a refresh is already in progress, wait for it
  if (globalTokenRefreshPromise) {
    if (__DEV__) {
      console.log('Token refresh already in progress, waiting...');
    }
    return await globalTokenRefreshPromise;
  }

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
        console.log('Performing global token refresh...');
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
        variables: { refreshToken }
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
    } catch (error) {
      if (__DEV__) {
        console.error('Global token refresh error:', error);
      }
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

// Error logging link - only handles logging, not retries (RetryLink handles retries)
const errorLoggingLink = new ErrorLink(({ error }) => {
  if (!error) {
    return;
  }
  
  // Handle GraphQL errors using Apollo Client 3.x patterns
  if (error.graphQLErrors && __DEV__) {
    error.graphQLErrors.forEach((graphQLError: any) => {
      const { message, locations, path, extensions } = graphQLError;
      console.error(
        `GraphQL error: Message: ${message}, Location: ${locations}, Path: ${path}`
      );
      
      // Handle specific error types (non-auth)
      if (extensions?.code === 'PIPEDA_COMPLIANCE_ERROR') {
        console.error('PIPEDA compliance error:', message);
      }
    });
  }

  // Handle network errors using Apollo Client 3.x patterns
  if (error.networkError && __DEV__) {
    console.error(`Network error: ${error.networkError.message}`);
    
    // Check if it's a server error with status code
    if ('statusCode' in error.networkError) {
      const statusCode = (error.networkError as any).statusCode;
      console.error(`Status: ${statusCode}`);
      
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
    console.error('Other Apollo Client error:', error.message);
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

// Create Apollo Client with optimized link order
export const apolloClient = new ApolloClient({
  link: from([
    // Error logging should come first to catch all errors
    errorLoggingLink,
    // Apollo Client's built-in RetryLink for rate limiting (prevents React re-render loops)
    rateLimitingRetryLink,
    // Token refresh must come before auth to handle expired tokens
    tokenRefreshLink,
    // Auth link adds tokens to requests
    authLink,
    // HTTP link executes the request
    httpLink,
  ]),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          myChildren: {
            // Proper cache merge for pagination
            keyArgs: false,
            merge(existing = { edges: [] }, incoming, { args }) {
              return {
                ...incoming,
                edges: [...existing.edges, ...incoming.edges],
              };
            },
          },
        },
      },
      User: {
        fields: {
          me: {
            merge(existing, incoming) {
              return { ...existing, ...incoming };
            },
          },
        },
      },
      ChildConnection: {
        fields: {
          edges: {
            merge(existing = [], incoming) {
              // Merge children edges without duplicates
              const existingIds = new Set(existing.map((edge: any) => edge.node.id));
              const newEdges = incoming.filter((edge: any) => !existingIds.has(edge.node.id));
              return [...existing, ...newEdges];
            },
          },
        },
      },
      ConsentConnection: {
        fields: {
          edges: {
            merge(existing, incoming) {
              return incoming; // Replace existing edges
            },
          },
        },
      },
    },
    resultCaching: true,
  }),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'none', // Fail fast on errors for better error detection
      notifyOnNetworkStatusChange: true,
      fetchPolicy: 'cache-first',
    },
    query: {
      errorPolicy: 'none', // Clean error handling
      fetchPolicy: 'cache-first', // Use cache when available
    },
    mutate: {
      errorPolicy: 'none', // Clean error handling for mutations - critical for onboarding
      fetchPolicy: 'no-cache', // Always execute mutations fresh
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

// Export rate limiting manager for component use
export const rateLimitingManager = RateLimitFeedbackManager.getInstance();

// Export client as default
export default apolloClient;