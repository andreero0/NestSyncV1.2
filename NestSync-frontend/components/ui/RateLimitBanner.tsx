/**
 * Rate Limit Banner Component
 * Displays user-friendly feedback during GraphQL rate limiting scenarios
 * Example component showing how to integrate rate limiting feedback in NestSync
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRateLimitFeedback } from '../../hooks/useRateLimitFeedback';

export interface RateLimitBannerProps {
  style?: any;
  showProgressBar?: boolean;
  showDetailedInfo?: boolean;
}

export function RateLimitBanner({ 
  style, 
  showProgressBar = true, 
  showDetailedInfo = false 
}: RateLimitBannerProps) {
  const rateLimitState = useRateLimitFeedback();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [progressAnim] = useState(new Animated.Value(0));

  // Animate banner appearance/disappearance
  useEffect(() => {
    if (rateLimitState.isRateLimited) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [rateLimitState.isRateLimited, fadeAnim]);

  // Animate progress bar for retry attempts
  useEffect(() => {
    if (rateLimitState.isRateLimited && showProgressBar) {
      const progress = rateLimitState.maxAttempts > 0 
        ? rateLimitState.attempt / rateLimitState.maxAttempts 
        : 0;
      
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  }, [rateLimitState.attempt, rateLimitState.maxAttempts, showProgressBar, progressAnim]);

  if (!rateLimitState.isRateLimited) {
    return null; // Don't render anything when not rate limited
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }, style]}>
      <View style={styles.content}>
        {/* Main message */}
        <Text style={styles.message}>
          {rateLimitState.userMessage}
        </Text>
        
        {/* Short status for compact display */}
        {rateLimitState.shortStatus && (
          <Text style={styles.status}>
            {rateLimitState.shortStatus}
          </Text>
        )}
        
        {/* Progress bar for retry attempts */}
        {showProgressBar && rateLimitState.maxAttempts > 0 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <Animated.View 
                style={[
                  styles.progressBar,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              Attempt {rateLimitState.attempt} of {rateLimitState.maxAttempts}
            </Text>
          </View>
        )}
        
        {/* Detailed information for debugging */}
        {showDetailedInfo && __DEV__ && (
          <View style={styles.debugInfo}>
            <Text style={styles.debugText}>
              Retry After: {rateLimitState.retryAfter}s
            </Text>
            <Text style={styles.debugText}>
              Current Delay: {Math.round(rateLimitState.currentDelay / 1000)}s
            </Text>
            <Text style={styles.debugText}>
              Action: {rateLimitState.recommendedAction}
            </Text>
          </View>
        )}
      </View>
      
      {/* Canadian compliance indicator */}
      <View style={styles.complianceIndicator}>
        <Text style={styles.complianceText}>
          Data stored safely in Canada
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FEF3C7', // Warm yellow background
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B', // Amber accent
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  content: {
    padding: 16,
  },
  message: {
    fontSize: 16,
    fontWeight: '500',
    color: '#92400E', // Dark amber text
    marginBottom: 8,
    lineHeight: 22,
  },
  status: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D97706', // Medium amber
    marginBottom: 12,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#FDE68A', // Light amber
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#F59E0B', // Amber progress
  },
  progressText: {
    fontSize: 12,
    color: '#92400E',
    marginTop: 4,
    textAlign: 'center',
  },
  debugInfo: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  debugText: {
    fontSize: 11,
    color: '#78350F',
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  complianceIndicator: {
    backgroundColor: '#065F46', // Canadian green
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  complianceText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '500',
    textAlign: 'center',
  },
});

// Example usage in a screen or component
export function ExampleWithRateLimiting() {
  return (
    <View>
      {/* Your existing component content */}
      
      {/* Rate limiting banner - automatically shows/hides */}
      <RateLimitBanner 
        showProgressBar={true}
        showDetailedInfo={__DEV__} // Only show debug info in development
      />
      
      {/* More component content */}
    </View>
  );
}