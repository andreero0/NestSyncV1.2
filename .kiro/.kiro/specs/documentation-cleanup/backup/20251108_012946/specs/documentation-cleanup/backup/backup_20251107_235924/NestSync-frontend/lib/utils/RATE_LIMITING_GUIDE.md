# NestSync Rate Limiting Implementation Guide

This document explains the comprehensive rate limiting (429 error) handling system implemented for the NestSync Apollo Client GraphQL setup.

## Overview

The rate limiting system provides graceful handling of HTTP 429 (Too Many Requests) errors with:
- Exponential backoff with jitter
- User-friendly feedback messages
- React hooks for UI integration
- PIPEDA-compliant Canadian context
- Production-ready error handling

## Architecture

### Core Components

1. **Rate Limiting Apollo Link** (`lib/graphql/client.ts`)
   - Intercepts 429 errors from GraphQL requests
   - Implements exponential backoff with 25% jitter
   - Respects server `Retry-After` headers
   - Maximum 5 retry attempts with 30-second cap

2. **Feedback Management System** (`lib/utils/rateLimitFeedback.ts`)
   - Singleton pattern for coordinated state management
   - User-friendly message generation
   - Callback system for UI updates
   - Context-aware messages for Canadian parents

3. **React Hooks** (`hooks/useRateLimitFeedback.ts`)
   - Real-time rate limiting state updates
   - Multiple hook variants for different use cases
   - Automatic cleanup and subscription management

4. **UI Components** (`components/ui/RateLimitBanner.tsx`)
   - Pre-built rate limiting notification banner
   - Animated progress indicators
   - Canadian compliance indicators
   - Psychology-driven UX for stressed parents

## Implementation Details

### Exponential Backoff Algorithm

```javascript
// Base configuration
const baseDelay = 1000;        // 1 second initial delay
const maxDelay = 30000;        // 30 second maximum
const maxAttempts = 5;         // 5 total attempts

// Calculation
const exponentialDelay = Math.min(
  baseDelay * Math.pow(2, attempt - 1),
  maxDelay
);

// Add jitter (±25% variation) to prevent thundering herd
const jitter = exponentialDelay * (0.75 + Math.random() * 0.5);
const finalDelay = Math.round(jitter);
```

### Server Retry-After Header Support

The system automatically detects and respects server-provided `Retry-After` headers:
- Supports both seconds format (`120`) and HTTP date format
- Falls back to exponential backoff if header is missing or invalid
- Always uses server preference when available

### Error Detection Logic

Rate limiting errors are identified by:
```javascript
const isRateLimited = error.networkError && 
  'statusCode' in error.networkError && 
  (error.networkError as any).statusCode === 429;
```

### Non-Retryable Operations

The following operations are never retried to prevent issues:
- GraphQL mutations (data modification)
- Authentication errors (401, 403)
- Client errors (400, 404, 422)
- Operations with `skipTokenRefresh: true` context

## Usage Examples

### 1. Basic React Hook Usage

```tsx
import { useRateLimitFeedback } from '../hooks/useRateLimitFeedback';

function MyComponent() {
  const rateLimitState = useRateLimitFeedback();
  
  if (rateLimitState.isRateLimited) {
    return (
      <View style={styles.banner}>
        <Text>{rateLimitState.userMessage}</Text>
      </View>
    );
  }
  
  return <YourRegularContent />;
}
```

### 2. Simplified Status Hook

```tsx
import { useRateLimitStatusMessage } from '../hooks/useRateLimitFeedback';

function StatusBar() {
  const message = useRateLimitStatusMessage();
  
  return message ? (
    <Text style={styles.status}>{message}</Text>
  ) : null;
}
```

### 3. Pre-built Banner Component

```tsx
import { RateLimitBanner } from '../components/ui/RateLimitBanner';

function MyScreen() {
  return (
    <View>
      <RateLimitBanner 
        showProgressBar={true}
        showDetailedInfo={__DEV__}
      />
      {/* Your screen content */}
    </View>
  );
}
```

### 4. Custom Callback Integration

```tsx
import { rateLimitingManager } from '../lib/graphql/client';

function MyComponent() {
  useEffect(() => {
    const unsubscribe = rateLimitingManager.onRateLimitFeedback((info) => {
      if (info.isRateLimited) {
        // Show toast notification
        showToast(info.userMessage);
      }
    });
    
    return unsubscribe;
  }, []);
  
  return <YourContent />;
}
```

## User Experience Features

### Context-Aware Messages

Messages are tailored for Canadian parents using a diaper planning app:

```javascript
// Standard message
"We're experiencing high demand right now. Please wait 30 seconds before trying again."

// Extended wait with reassurance
"We're experiencing high demand right now. Please wait 2 minutes before trying again. Your data is safely stored and waiting for you."

// Automatic retry in progress
"We're experiencing high demand right now. Automatically retrying (attempt 2/5)..."
```

### Visual Feedback States

1. **Retry Progress**: Animated progress bar showing current attempt
2. **Wait Timer**: Countdown showing remaining wait time
3. **Canadian Compliance**: "Data stored safely in Canada" indicator
4. **Calming Colors**: Psychology-driven warm yellows and greens

## Configuration Options

### Apollo Client Link Order

The rate limiting link is positioned strategically:
```javascript
from([
  errorLoggingLink,        // First: catch all errors
  createRateLimitingLink(), // Second: handle rate limiting
  tokenRefreshLink,        // Third: handle auth refresh
  authLink,               // Fourth: add authentication
  httpLink,               // Last: execute request
])
```

### Customizable Parameters

All key parameters can be adjusted:

```javascript
// In createRateLimitingLink()
const maxAttempts = 5;      // Number of retry attempts
const baseDelay = 1000;     // Initial delay (milliseconds)
const maxDelay = 30000;     // Maximum delay (milliseconds)
const jitterRange = 0.5;    // Jitter variation (±25%)
```

## Production Considerations

### Performance Impact

- Minimal overhead when not rate limited
- Efficient singleton pattern for state management
- Automatic cleanup prevents memory leaks
- Jitter prevents server overload during recovery

### Monitoring and Logging

Development logging includes:
```javascript
console.log(`Rate limited (429). Retry attempt ${attempt}/${maxAttempts} after ${finalDelay}ms`);
console.error('Rate limit retry exhausted. Final attempt failed.');
```

Production logging is automatically disabled but errors are still tracked.

### PIPEDA Compliance

- All user feedback includes Canadian context
- Data residency messaging reassures users
- No sensitive information logged in production
- Transparent communication about processing delays

## Error Handling Chain

1. **GraphQL Request** → Apollo Client
2. **429 Response** → Rate Limiting Link detects error
3. **Delay Calculation** → Exponential backoff with jitter
4. **User Feedback** → Feedback manager updates UI
5. **Retry Attempt** → Automatic retry after delay
6. **Success/Failure** → Clear feedback or final error

## Testing Scenarios

To test the rate limiting system:

1. **Backend Rate Limiting**: Configure server to return 429 responses
2. **Network Simulation**: Use browser dev tools to throttle requests
3. **Manual Testing**: Rapidly trigger GraphQL operations
4. **Edge Cases**: Test with malformed Retry-After headers

## Integration Checklist

- ✅ Apollo Client configured with rate limiting link
- ✅ Feedback management system initialized
- ✅ React hooks available for components
- ✅ UI components ready for integration
- ✅ Canadian compliance messaging included
- ✅ Production error handling configured
- ✅ Development logging enabled

## Future Enhancements

Potential improvements:
- Circuit breaker pattern for persistent failures
- User preference for retry behavior
- Analytics integration for rate limiting metrics
- A/B testing for different message strategies
- Integration with push notifications for long delays

---

*This implementation provides a production-ready solution for graceful rate limiting handling in the NestSync Canadian diaper planning application, with psychology-driven UX design and PIPEDA compliance.*