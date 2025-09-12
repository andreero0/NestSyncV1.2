/**
 * Rate Limiting User Feedback Utility
 * Handles user-friendly feedback during rate limiting scenarios
 * Provides context-aware messages for PIPEDA-compliant Canadian diaper planning app
 */

export interface RateLimitInfo {
  isRateLimited: boolean;
  retryAfter?: number; // seconds
  currentDelay: number; // milliseconds
  attempt: number;
  maxAttempts: number;
}

export class RateLimitFeedbackManager {
  private static instance: RateLimitFeedbackManager;
  private feedbackCallbacks: Array<(info: RateLimitInfo) => void> = [];
  private currentRateLimit: RateLimitInfo | null = null;

  static getInstance(): RateLimitFeedbackManager {
    if (!RateLimitFeedbackManager.instance) {
      RateLimitFeedbackManager.instance = new RateLimitFeedbackManager();
    }
    return RateLimitFeedbackManager.instance;
  }

  /**
   * Register a callback for rate limit feedback
   * Useful for showing toasts, notifications, or UI updates
   */
  onRateLimitFeedback(callback: (info: RateLimitInfo) => void): () => void {
    this.feedbackCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.feedbackCallbacks.indexOf(callback);
      if (index > -1) {
        this.feedbackCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Notify all registered callbacks about rate limiting state
   */
  private notifyCallbacks(info: RateLimitInfo): void {
    this.currentRateLimit = info;
    this.feedbackCallbacks.forEach(callback => {
      try {
        callback(info);
      } catch (error) {
        if (__DEV__) {
          console.error('Error in rate limit feedback callback:', error);
        }
      }
    });
  }

  /**
   * Set rate limiting active with retry information
   */
  setRateLimited(retryAfter: number, currentDelay: number, attempt: number, maxAttempts: number): void {
    if (__DEV__) {
      console.log(`Rate limited: retry after ${retryAfter}s, delay ${currentDelay}ms, attempt ${attempt}/${maxAttempts}`);
    }

    this.notifyCallbacks({
      isRateLimited: true,
      retryAfter,
      currentDelay,
      attempt,
      maxAttempts,
    });
  }

  /**
   * Clear rate limiting state
   */
  clearRateLimit(): void {
    if (this.currentRateLimit?.isRateLimited) {
      if (__DEV__) {
        console.log('Rate limiting cleared');
      }

      this.notifyCallbacks({
        isRateLimited: false,
        currentDelay: 0,
        attempt: 0,
        maxAttempts: 0,
      });
    }
  }

  /**
   * Get current rate limiting status
   */
  getCurrentStatus(): RateLimitInfo | null {
    return this.currentRateLimit;
  }

  /**
   * Generate user-friendly message for rate limiting
   * Context-aware for Canadian parents using diaper planning app
   */
  static getUserFriendlyMessage(info: RateLimitInfo): string {
    if (!info.isRateLimited) {
      return '';
    }

    const { retryAfter, attempt, maxAttempts } = info;
    
    // Base message with Canadian context
    let message = "We're experiencing high demand right now. ";
    
    if (retryAfter && retryAfter > 0) {
      if (retryAfter < 60) {
        message += `Please wait ${Math.ceil(retryAfter)} seconds before trying again.`;
      } else {
        const minutes = Math.ceil(retryAfter / 60);
        message += `Please wait ${minutes} minute${minutes > 1 ? 's' : ''} before trying again.`;
      }
    } else if (attempt < maxAttempts) {
      message += `Automatically retrying (attempt ${attempt}/${maxAttempts})...`;
    } else {
      message += "Please try again in a moment.";
    }

    // Add reassuring context for stressed parents
    if (retryAfter && retryAfter > 30) {
      message += " Your data is safely stored and waiting for you.";
    }

    return message;
  }

  /**
   * Generate short status message for UI components
   */
  static getShortStatusMessage(info: RateLimitInfo): string {
    if (!info.isRateLimited) {
      return '';
    }

    const { attempt, maxAttempts, retryAfter } = info;
    
    if (attempt < maxAttempts) {
      return `Retrying... (${attempt}/${maxAttempts})`;
    } else if (retryAfter && retryAfter > 0) {
      if (retryAfter < 60) {
        return `Wait ${Math.ceil(retryAfter)}s`;
      } else {
        return `Wait ${Math.ceil(retryAfter / 60)}m`;
      }
    }
    
    return 'Too many requests';
  }

  /**
   * Get recommended action for current rate limit state
   */
  static getRecommendedAction(info: RateLimitInfo): 'wait' | 'retry' | 'none' {
    if (!info.isRateLimited) {
      return 'none';
    }

    if (info.attempt < info.maxAttempts) {
      return 'retry';
    }

    return 'wait';
  }
}

/**
 * Hook-like function for React components to use rate limit feedback
 * Returns current status and helper functions
 */
export function useRateLimitFeedback() {
  const manager = RateLimitFeedbackManager.getInstance();
  
  return {
    getCurrentStatus: () => manager.getCurrentStatus(),
    getUserMessage: (info: RateLimitInfo) => RateLimitFeedbackManager.getUserFriendlyMessage(info),
    getShortStatus: (info: RateLimitInfo) => RateLimitFeedbackManager.getShortStatusMessage(info),
    getRecommendedAction: (info: RateLimitInfo) => RateLimitFeedbackManager.getRecommendedAction(info),
    onFeedback: (callback: (info: RateLimitInfo) => void) => manager.onRateLimitFeedback(callback),
  };
}

/**
 * Extract retry-after header value from response
 */
export function parseRetryAfter(retryAfterHeader: string | null): number {
  if (!retryAfterHeader) {
    return 0;
  }

  // Try to parse as seconds (most common)
  const seconds = parseInt(retryAfterHeader, 10);
  if (!isNaN(seconds)) {
    return Math.max(0, seconds);
  }

  // Try to parse as HTTP date
  try {
    const date = new Date(retryAfterHeader);
    if (!isNaN(date.getTime())) {
      const now = new Date();
      const diff = Math.max(0, (date.getTime() - now.getTime()) / 1000);
      return Math.ceil(diff);
    }
  } catch (error) {
    if (__DEV__) {
      console.warn('Failed to parse Retry-After header as date:', retryAfterHeader);
    }
  }

  // Default fallback
  return 60; // 1 minute default
}