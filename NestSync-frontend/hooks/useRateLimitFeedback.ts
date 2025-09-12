/**
 * React Hook for Rate Limiting Feedback
 * Provides real-time rate limiting status and user-friendly messages
 * Integrates with the NestSync Apollo Client rate limiting system
 */

import { useState, useEffect, useCallback } from 'react';
import { rateLimitingManager } from '../lib/graphql/client';
import { RateLimitInfo, RateLimitFeedbackManager } from '../lib/utils/rateLimitFeedback';

export interface RateLimitState {
  isRateLimited: boolean;
  userMessage: string;
  shortStatus: string;
  recommendedAction: 'wait' | 'retry' | 'none';
  retryAfter: number;
  currentDelay: number;
  attempt: number;
  maxAttempts: number;
}

const initialState: RateLimitState = {
  isRateLimited: false,
  userMessage: '',
  shortStatus: '',
  recommendedAction: 'none',
  retryAfter: 0,
  currentDelay: 0,
  attempt: 0,
  maxAttempts: 0,
};

/**
 * Hook to track and display rate limiting feedback
 * Returns current rate limiting state and helper functions
 */
export function useRateLimitFeedback() {
  const [rateLimitState, setRateLimitState] = useState<RateLimitState>(initialState);

  // Update state from rate limiting info
  const updateFromInfo = useCallback((info: RateLimitInfo) => {
    const newState: RateLimitState = {
      isRateLimited: info.isRateLimited,
      userMessage: RateLimitFeedbackManager.getUserFriendlyMessage(info),
      shortStatus: RateLimitFeedbackManager.getShortStatusMessage(info),
      recommendedAction: RateLimitFeedbackManager.getRecommendedAction(info),
      retryAfter: info.retryAfter || 0,
      currentDelay: info.currentDelay,
      attempt: info.attempt,
      maxAttempts: info.maxAttempts,
    };
    
    setRateLimitState(newState);
  }, []);

  // Subscribe to rate limiting feedback
  useEffect(() => {
    // Get initial state
    const currentStatus = rateLimitingManager.getCurrentStatus();
    if (currentStatus) {
      updateFromInfo(currentStatus);
    }

    // Subscribe to updates
    const unsubscribe = rateLimitingManager.onRateLimitFeedback(updateFromInfo);

    return unsubscribe;
  }, [updateFromInfo]);

  // Helper function to clear rate limiting state manually
  const clearRateLimit = useCallback(() => {
    rateLimitingManager.clearRateLimit();
  }, []);

  // Helper function to get current manager instance
  const getManager = useCallback(() => {
    return rateLimitingManager;
  }, []);

  return {
    ...rateLimitState,
    clearRateLimit,
    getManager,
  };
}

/**
 * Simplified hook for components that only need to know if rate limiting is active
 */
export function useIsRateLimited(): boolean {
  const { isRateLimited } = useRateLimitFeedback();
  return isRateLimited;
}

/**
 * Hook for components that need to show a simple status message
 */
export function useRateLimitStatusMessage(): string {
  const { userMessage, isRateLimited } = useRateLimitFeedback();
  return isRateLimited ? userMessage : '';
}

/**
 * Hook for components that need to show a compact status indicator
 */
export function useRateLimitShortStatus(): string {
  const { shortStatus, isRateLimited } = useRateLimitFeedback();
  return isRateLimited ? shortStatus : '';
}