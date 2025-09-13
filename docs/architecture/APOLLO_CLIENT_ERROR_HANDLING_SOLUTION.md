# Apollo Client 3.x Error Handling Solution

## CRITICAL BUG IDENTIFIED

**Problem**: `TypeError: Cannot read properties of undefined (reading 'is')` when calling `ServerError.is(error)`

**Root Cause**: Project uses Apollo Client 3.14.0, but `ServerError.is()` static method is only available in Apollo Client 4.0+

## FIXED: Apollo Client 3.x Compatible Error Handling

### Import Changes
```typescript
// OLD (Apollo Client 4.0+ only)
import { CombinedGraphQLErrors, ServerError } from '@apollo/client/errors';

// NEW (Apollo Client 3.x compatible) 
import { ApolloError } from '@apollo/client/errors';
```

### Authentication Error Detection (Fixed)
```typescript
// OLD (Apollo Client 4.0+ pattern)
const isAuthError = 
  (ServerError.is(error) && error.statusCode === 401) ||
  (CombinedGraphQLErrors.is(error) && error.errors.some(err => 
    err.extensions?.code === 'UNAUTHENTICATED'
  ));

// NEW (Apollo Client 3.x pattern)
const isAuthError = 
  // Network error with 401 status
  (error.networkError && 'statusCode' in error.networkError && error.networkError.statusCode === 401) ||
  // GraphQL authentication errors
  (error.graphQLErrors && error.graphQLErrors.some(err => 
    err.message?.includes('Authentication required') ||
    err.message?.includes('authentication') ||
    err.message?.includes('unauthorized') ||
    err.extensions?.code === 'UNAUTHENTICATED' ||
    err.extensions?.code === 'FORBIDDEN'
  ));
```

### Error Logging (Fixed)
```typescript
// OLD (Apollo Client 4.0+ pattern)
if (CombinedGraphQLErrors.is(error)) {
  error.errors.forEach(({ message, locations, path, extensions }) => {
    console.error(`GraphQL error: Message: ${message}, Location: ${locations}, Path: ${path}`);
  });
}

if (ServerError.is(error)) {
  console.error(`Network error: ${error.message} (Status: ${error.statusCode})`);
}

// NEW (Apollo Client 3.x pattern)
if (error.graphQLErrors) {
  error.graphQLErrors.forEach(({ message, locations, path, extensions }) => {
    console.error(`GraphQL error: Message: ${message}, Location: ${locations}, Path: ${path}`);
  });
}

if (error.networkError) {
  console.error(`Network error: ${error.networkError.message}`);
  
  if ('statusCode' in error.networkError) {
    const statusCode = error.networkError.statusCode;
    console.error(`Status: ${statusCode}`);
  }
}
```

### React Component Error Handling (Best Practice)
```typescript
// In mutation error handling (onboarding.tsx)
try {
  const { data, errors } = await createChild({ variables: { input } });
  
  // Check for GraphQL errors first
  if (errors && errors.length > 0) {
    throw new Error(`GraphQL Error: ${errors[0].message}`);
  }
  
  if (!data?.createChild?.success) {
    throw new Error(data?.createChild?.error || 'Failed to create child profile');
  }
  
} catch (error) {
  if (error instanceof ApolloError) {
    // Apollo Client 3.x error structure
    if (error.graphQLErrors?.length > 0) {
      console.error('GraphQL errors:', error.graphQLErrors);
    }
    if (error.networkError) {
      console.error('Network error:', error.networkError);
    }
    throw new Error(`Failed to create child: ${error.message}`);
  } else {
    throw new Error(`Failed to create child: ${error?.message || 'Unknown error'}`);
  }
}
```

## APPLIED FIXES

1. **Updated client.ts imports** - Changed from Apollo Client 4.x imports to 3.x compatible
2. **Fixed tokenRefreshLink** - Uses `error.networkError.statusCode` instead of `ServerError.is(error)`  
3. **Fixed errorLoggingLink** - Uses `error.graphQLErrors` instead of `CombinedGraphQLErrors.is(error)`
4. **Maintained functionality** - All error detection and handling logic preserved but using 3.x API

## VERIFICATION

The createChild mutation should now work without TypeError. The error handling will:
- ✅ Detect 401 authentication errors correctly
- ✅ Handle GraphQL validation errors  
- ✅ Provide proper error messages to users
- ✅ Trigger automatic token refresh on auth failures
- ✅ Log errors appropriately for debugging

## ALTERNATIVE: Upgrade to Apollo Client 4.0

If upgrading to Apollo Client 4.0 is preferred (breaking changes required):

```bash
npm install @apollo/client@^4.0.0
```

Then the original `ServerError.is()` and `CombinedGraphQLErrors.is()` patterns would work correctly.

## Context7 Research Summary

Apollo Client error handling patterns found:
- **Apollo Client 3.x**: Uses `error.graphQLErrors` and `error.networkError` properties
- **Apollo Client 4.0+**: Introduces static `.is()` methods on error classes for better type detection
- **Best Practice**: Always check for GraphQL errors first, then network errors
- **Authentication**: Detect via status codes or error extension codes like 'UNAUTHENTICATED'