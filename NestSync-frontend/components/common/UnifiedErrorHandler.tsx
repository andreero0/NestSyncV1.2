/**
 * Unified Error Handler Component
 * Single error display component that eliminates overlapping error states
 * Psychology-driven UX for stressed parents with PIPEDA compliance
 */

import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { ThemedText } from '../ThemedText';
import { IconSymbol } from '../ui/IconSymbol';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useActiveError, ErrorSeverity } from '@/stores/errorStore';

interface UnifiedErrorHandlerProps {
  /** Optional positioning style override */
  style?: any;
  /** Whether to show at top of screen (default) or bottom */
  position?: 'top' | 'bottom';
  /** Maximum width for the error message */
  maxWidth?: number;
  /** Whether to show PIPEDA compliance indicator */
  showComplianceIndicator?: boolean;
  /** Custom retry handler (optional) */
  onRetry?: () => Promise<void>;
  /** Custom dismiss handler (optional) */
  onDismiss?: () => void;
}

export const UnifiedErrorHandler: React.FC<UnifiedErrorHandlerProps> = ({
  style,
  position = 'top',
  maxWidth = 400,
  showComplianceIndicator = true,
  onRetry,
  onDismiss,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const {
    error,
    isVisible,
    isRetrying,
    displayConfig,
    canRetry,
    retryCount,
    maxRetries,
    message,
    dismiss,
    retry,
  } = useActiveError();

  // Animated values for smooth entry/exit
  const slideAnimation = React.useRef(new Animated.Value(0)).current;
  const opacityAnimation = React.useRef(new Animated.Value(0)).current;

  // Animate error visibility
  useEffect(() => {
    if (isVisible) {
      // Show error with slide and fade animation
      Animated.parallel([
        Animated.timing(slideAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Hide error with reverse animation
      Animated.parallel([
        Animated.timing(slideAnimation, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnimation, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible, slideAnimation, opacityAnimation]);

  // Don't render if no error or not visible
  if (!error || !isVisible) {
    return null;
  }

  // Handle retry action
  const handleRetry = async () => {
    if (onRetry) {
      await onRetry();
    } else if (canRetry) {
      await retry();
    }
  };

  // Handle dismiss action
  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss();
    } else if (displayConfig.canDismiss) {
      dismiss();
    }
  };

  // Calculate transform for slide animation
  const slideTransform = {
    translateY: slideAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: position === 'top' ? [-100, 0] : [100, 0],
    }),
  };

  // Determine container styles based on display configuration
  const containerStyle = [
    styles.container,
    {
      backgroundColor: displayConfig.backgroundColor,
      borderColor: displayConfig.borderColor,
      maxWidth,
      opacity: opacityAnimation,
      transform: [slideTransform],
    },
    position === 'bottom' ? styles.bottomPosition : styles.topPosition,
    style,
  ];

  // Show retry progress
  const showRetryProgress = isRetrying || (canRetry && retryCount > 0 && retryCount < maxRetries);

  return (
    <Animated.View style={containerStyle} pointerEvents="box-none">
      <View style={styles.errorContent}>
        {/* Error Icon */}
        {displayConfig.showIcon && (
          <View style={styles.iconContainer}>
            <IconSymbol 
              name={displayConfig.iconName as any} 
              size={24} 
              color={displayConfig.iconColor}
            />
          </View>
        )}

        {/* Error Message Content */}
        <View style={styles.messageContainer}>
          <ThemedText 
            style={[
              styles.errorMessage,
              { color: displayConfig.textColor }
            ]}
            accessibilityRole="alert"
          >
            {message}
          </ThemedText>

          {/* Retry Progress Indicator */}
          {showRetryProgress && (
            <View style={styles.retryProgress}>
              {isRetrying ? (
                <>
                  <ActivityIndicator 
                    size="small" 
                    color={displayConfig.iconColor} 
                    style={styles.retrySpinner}
                  />
                  <ThemedText style={[styles.retryText, { color: displayConfig.textColor }]}>
                    Working on it...
                  </ThemedText>
                </>
              ) : (
                <ThemedText style={[styles.retryText, { color: displayConfig.textColor }]}>
                  Trying again... (attempt {retryCount + 1})
                </ThemedText>
              )}
            </View>
          )}

          {/* Canadian Compliance Indicator */}
          {showComplianceIndicator && error.canadianCompliance && (
            <View style={styles.complianceIndicator}>
              <IconSymbol 
                name="checkmark.shield.fill" 
                size={14} 
                color={colors.success}
              />
              <ThemedText style={[styles.complianceText, { color: colors.textSecondary }]}>
                Data stored in Canada
              </ThemedText>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {/* Retry Button */}
          {canRetry && !isRetrying && retryCount < maxRetries && (
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.retryButton,
                { backgroundColor: displayConfig.iconColor }
              ]}
              onPress={handleRetry}
              accessibilityRole="button"
              accessibilityLabel="Try again"
              accessibilityHint="Retry the failed operation"
            >
              <IconSymbol name="arrow.clockwise" size={16} color="#FFFFFF" />
              <ThemedText style={styles.actionButtonText}>
                Try Again
              </ThemedText>
            </TouchableOpacity>
          )}

          {/* Dismiss Button */}
          {displayConfig.canDismiss && (
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.dismissButton,
                { borderColor: displayConfig.borderColor }
              ]}
              onPress={handleDismiss}
              accessibilityRole="button"
              accessibilityLabel="Dismiss error"
              accessibilityHint="Hide this error message"
            >
              <IconSymbol 
                name="xmark" as any
                size={14} 
                color={displayConfig.textColor}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Severity Indicator Bar (subtle visual cue) */}
      {error.severity >= ErrorSeverity.HIGH && (
        <View 
          style={[
            styles.severityBar,
            { backgroundColor: displayConfig.iconColor }
          ]}
        />
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 1000,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8, // Android shadow
  },
  topPosition: {
    top: Platform.OS === 'ios' ? 60 : 40, // Account for status bar
  },
  bottomPosition: {
    bottom: Platform.OS === 'ios' ? 100 : 80, // Account for tab bar
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    gap: 12,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2, // Slight offset to align with text
  },
  messageContainer: {
    flex: 1,
    gap: 8,
  },
  errorMessage: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  retryProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  retrySpinner: {
    marginRight: 4,
  },
  retryText: {
    fontSize: 13,
    fontStyle: 'italic',
    opacity: 0.8,
  },
  complianceIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  complianceText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: 'column',
    gap: 8,
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    minHeight: 36,
  },
  retryButton: {
    // Background color set dynamically
  },
  dismissButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  severityBar: {
    height: 3,
    width: '100%',
    marginTop: -1,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
});

export default UnifiedErrorHandler;