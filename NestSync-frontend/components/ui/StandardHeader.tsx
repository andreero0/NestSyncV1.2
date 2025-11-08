/**
 * StandardHeader Component
 * Design system compliant header component for consistent UI across NestSync
 *
 * Features:
 * - H1 typography (32px/600 weight) as per design system
 * - View mode (back + title) and edit mode (back + title + action button)
 * - Theme-aware colors via useThemeColor hook
 * - 44x44px touch targets for accessibility compliance
 * - Border option for visual separation
 */

import React from 'react';
import { View, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { ThemedView } from '../ThemedView';
import { ThemedText } from '../ThemedText';
import { IconSymbol } from './IconSymbol';
import { useThemeColor } from '@/hooks/useThemeColor';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

/**
 * Action button configuration for edit mode headers
 */
export interface StandardHeaderActionButton {
  /** Button label text */
  label: string;
  /** Press handler callback */
  onPress: () => void;
  /** Disable button interaction */
  disabled?: boolean;
  /** Show loading spinner instead of text */
  loading?: boolean;
}

/**
 * StandardHeader component props
 */
export interface StandardHeaderProps {
  /** Header title text (H1 typography) */
  title: string;
  /** Back button press handler */
  onBack: () => void;
  /** Optional action button for edit mode */
  actionButton?: StandardHeaderActionButton;
  /** Show bottom border separator */
  showBorder?: boolean;
  /** Custom test ID for testing */
  testID?: string;
}

// =============================================================================
// STANDARD HEADER COMPONENT
// =============================================================================

/**
 * StandardHeader - Design system compliant header component
 *
 * @example View Mode (back + title)
 * ```tsx
 * <StandardHeader
 *   title="My Subscription"
 *   onBack={() => router.back()}
 * />
 * ```
 *
 * @example Edit Mode (back + title + action)
 * ```tsx
 * <StandardHeader
 *   title="Profile Settings"
 *   onBack={handleCancel}
 *   actionButton={{
 *     label: "Save",
 *     onPress: handleSave,
 *     disabled: !hasUnsavedChanges
 *   }}
 *   showBorder={true}
 * />
 * ```
 */
export function StandardHeader({
  title,
  onBack,
  actionButton,
  showBorder = false,
  testID = 'standard-header',
}: StandardHeaderProps) {
  // Theme colors
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  const borderColor = useThemeColor({}, 'border');

  return (
    <ThemedView
      style={[
        styles.container,
        showBorder && { borderBottomWidth: 1, borderBottomColor: borderColor },
      ]}
      testID={testID}
    >
      {/* Back Button - 44x44px touch target */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        accessibilityHint="Navigate to previous screen"
        testID={`${testID}-back-button`}
      >
        <IconSymbol name="chevron.left" size={24} color={tintColor} />
      </TouchableOpacity>

      {/* Title - H1 Typography (32px/600) */}
      <ThemedText
        type="title"
        style={[styles.title, { color: textColor }]}
        numberOfLines={1}
        ellipsizeMode="tail"
        testID={`${testID}-title`}
      >
        {title}
      </ThemedText>

      {/* Action Button or Spacer */}
      {actionButton ? (
        <TouchableOpacity
          style={[
            styles.actionButton,
            (actionButton.disabled || actionButton.loading) && styles.actionButtonDisabled,
          ]}
          onPress={actionButton.onPress}
          disabled={actionButton.disabled || actionButton.loading}
          accessibilityRole="button"
          accessibilityLabel={actionButton.label}
          accessibilityState={{ disabled: actionButton.disabled || actionButton.loading }}
          testID={`${testID}-action-button`}
        >
          {actionButton.loading ? (
            <ActivityIndicator size="small" color={tintColor} />
          ) : (
            <ThemedText
              style={[
                styles.actionButtonText,
                {
                  color:
                    actionButton.disabled || actionButton.loading
                      ? textSecondaryColor
                      : tintColor,
                },
              ]}
            >
              {actionButton.label}
            </ThemedText>
          )}
        </TouchableOpacity>
      ) : (
        // Spacer to maintain layout balance when no action button
        <View style={styles.actionButtonSpacer} />
      )}
    </ThemedView>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 64, // Sufficient height for 44x44 touch targets + padding
  },

  // Back Button - 44x44px touch target (accessibility requirement)
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },

  // Title - H1 Typography (design system: 32px/600)
  title: {
    flex: 1,
    fontSize: 32,
    fontWeight: '600', // Design system standard (not '800')
    lineHeight: 38,
    textAlign: 'left',
  },

  // Action Button - 44x44px touch target (accessibility requirement)
  actionButton: {
    minWidth: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginLeft: 8,
  },

  actionButtonDisabled: {
    opacity: 0.5,
  },

  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },

  // Spacer to maintain layout balance
  actionButtonSpacer: {
    width: 44,
    height: 44,
  },
});
