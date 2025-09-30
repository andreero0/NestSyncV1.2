/**
 * Timeout Loader Component
 * Automatically handles loading states with timeouts and fallbacks
 * Prevents infinite loading by showing skeleton states and error recovery
 */

import React, { useState, useEffect, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import {
  SubscriptionOptionsSkeleton,
  ReorderSuggestionsSkeleton,
  InventoryCardsSkeleton,
  ListSkeleton,
  Skeleton
} from './SkeletonLoading';

export type SkeletonType =
  | 'subscription-options'
  | 'reorder-suggestions'
  | 'inventory-cards'
  | 'list'
  | 'custom';

interface TimeoutLoaderProps {
  loading: boolean;
  error?: Error | null;
  data?: any;
  timeout?: number; // milliseconds
  skeletonType?: SkeletonType;
  customSkeleton?: ReactNode;
  onRetry?: () => void;
  onTimeout?: () => void;
  children: ReactNode;
  emptyState?: ReactNode;
  loadingText?: string;
}

export const TimeoutLoader: React.FC<TimeoutLoaderProps> = ({
  loading,
  error,
  data,
  timeout = 8000, // 8 second default timeout
  skeletonType = 'list',
  customSkeleton,
  onRetry,
  onTimeout,
  children,
  emptyState,
  loadingText = 'Loading...'
}) => {
  const { colors } = useTheme();
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(false);

  useEffect(() => {
    if (!loading) {
      setHasTimedOut(false);
      setShowSkeleton(false);
      return;
    }

    // Show skeleton after 500ms to prevent flash
    const skeletonTimer = setTimeout(() => {
      if (loading) {
        setShowSkeleton(true);
      }
    }, 500);

    // Set timeout after specified duration
    const timeoutTimer = setTimeout(() => {
      if (loading) {
        setHasTimedOut(true);
        onTimeout?.();
      }
    }, timeout);

    return () => {
      clearTimeout(skeletonTimer);
      clearTimeout(timeoutTimer);
    };
  }, [loading, timeout, onTimeout]);

  const handleRetry = () => {
    setHasTimedOut(false);
    setShowSkeleton(false);
    onRetry?.();
  };

  // Show error state
  if (error && !loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorTitle, { color: colors.text }]}>
          Something went wrong
        </Text>
        <Text style={[styles.errorMessage, { color: colors.textSecondary }]}>
          {error.message || 'An unexpected error occurred'}
        </Text>
        {onRetry && (
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={handleRetry}
          >
            <Text style={[styles.retryButtonText, { color: colors.background }]}>
              Try Again
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Show timeout state
  if (hasTimedOut && loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.timeoutTitle, { color: colors.text }]}>
          Taking longer than expected
        </Text>
        <Text style={[styles.timeoutMessage, { color: colors.textSecondary }]}>
          This is taking longer than usual. Check your connection or try again.
        </Text>
        {onRetry && (
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={handleRetry}
          >
            <Text style={[styles.retryButtonText, { color: colors.background }]}>
              Try Again
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Show skeleton loading state
  if (loading && showSkeleton) {
    if (customSkeleton) {
      return <>{customSkeleton}</>;
    }

    switch (skeletonType) {
      case 'subscription-options':
        return <SubscriptionOptionsSkeleton />;
      case 'reorder-suggestions':
        return <ReorderSuggestionsSkeleton />;
      case 'inventory-cards':
        return <InventoryCardsSkeleton />;
      case 'list':
        return <ListSkeleton />;
      case 'custom':
        return (
          <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
            <Skeleton width="80%" height={20} style={{ marginBottom: 12 }} />
            <Skeleton width="60%" height={16} style={{ marginBottom: 8 }} />
            <Skeleton width="40%" height={14} />
          </View>
        );
      default:
        return <ListSkeleton />;
    }
  }

  // Show initial loading (before skeleton appears)
  if (loading && !showSkeleton) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          {loadingText}
        </Text>
      </View>
    );
  }

  // Show empty state if no data
  if (!loading && !error && (!data || (Array.isArray(data) && data.length === 0))) {
    if (emptyState) {
      return <>{emptyState}</>;
    }

    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          No data available
        </Text>
        <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>
          There's nothing to show right now.
        </Text>
      </View>
    );
  }

  // Show content
  return <>{children}</>;
};

// Hook for managing timeout loading state
export const useTimeoutLoader = (
  loading: boolean,
  timeout: number = 8000,
  onTimeout?: () => void
) => {
  const [hasTimedOut, setHasTimedOut] = useState(false);

  useEffect(() => {
    if (!loading) {
      setHasTimedOut(false);
      return;
    }

    const timer = setTimeout(() => {
      if (loading) {
        setHasTimedOut(true);
        onTimeout?.();
      }
    }, timeout);

    return () => clearTimeout(timer);
  }, [loading, timeout, onTimeout]);

  return {
    hasTimedOut,
    reset: () => setHasTimedOut(false)
  };
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  timeoutTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  timeoutMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    fontSize: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default TimeoutLoader;