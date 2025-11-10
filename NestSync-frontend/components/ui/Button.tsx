/**
 * Standardized Button Component
 * 
 * Design-compliant button component that follows NestSync design system.
 * All buttons in the application should use this component for consistency.
 * 
 * Features:
 * - Multiple variants (primary, secondary, danger, success)
 * - Multiple sizes (small, medium, large)
 * - Loading states
 * - Icon support
 * - Accessibility compliant (48px minimum touch target)
 * - Design token based styling
 * 
 * Usage:
 * ```tsx
 * <Button
 *   title="Save Changes"
 *   onPress={handleSave}
 *   variant="primary"
 *   size="medium"
 *   loading={isSaving}
 * />
 * ```
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { NestSyncColors } from '@/constants/Colors';
import { useNestSyncTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';

export interface ButtonProps {
  /** Button text */
  title: string;
  /** Press handler */
  onPress: () => void;
  /** Visual variant */
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
  /** Button size */
  size?: 'small' | 'medium' | 'large';
  /** Disabled state */
  disabled?: boolean;
  /** Loading state (shows spinner) */
  loading?: boolean;
  /** Optional icon (React element) */
  icon?: React.ReactNode;
  /** Icon position */
  iconPosition?: 'left' | 'right';
  /** Full width button */
  fullWidth?: boolean;
  /** Custom style override */
  style?: ViewStyle;
  /** Custom text style override */
  textStyle?: TextStyle;
  /** Test ID for testing */
  testID?: string;
  /** Accessibility label */
  accessibilityLabel?: string;
  /** Accessibility hint */
  accessibilityHint?: string;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
  textStyle,
  testID,
  accessibilityLabel,
  accessibilityHint,
}: ButtonProps) {
  const theme = useNestSyncTheme();
  const colors = Colors[theme];

  const getVariantStyles = (): {
    backgroundColor: string;
    borderColor: string;
    textColor: string;
  } => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: NestSyncColors.primary.blue,
          borderColor: NestSyncColors.primary.blue,
          textColor: '#FFFFFF',
        };
      case 'secondary':
        return {
          backgroundColor: 'transparent',
          borderColor: colors.border,
          textColor: colors.text,
        };
      case 'danger':
        return {
          backgroundColor: 'transparent',
          borderColor: colors.error,
          textColor: colors.error,
        };
      case 'success':
        return {
          backgroundColor: NestSyncColors.secondary.green,
          borderColor: NestSyncColors.secondary.green,
          textColor: '#FFFFFF',
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          textColor: NestSyncColors.primary.blue,
        };
      default:
        return {
          backgroundColor: NestSyncColors.primary.blue,
          borderColor: NestSyncColors.primary.blue,
          textColor: '#FFFFFF',
        };
    }
  };

  const getSizeStyles = (): {
    paddingVertical: number;
    paddingHorizontal: number;
    fontSize: number;
    minHeight: number;
  } => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: 8,
          paddingHorizontal: 16,
          fontSize: 14,
          minHeight: 40, // Slightly below 48px for compact UIs
        };
      case 'medium':
        return {
          paddingVertical: 12,
          paddingHorizontal: 20,
          fontSize: 16,
          minHeight: 48, // WCAG AA minimum
        };
      case 'large':
        return {
          paddingVertical: 16,
          paddingHorizontal: 24,
          fontSize: 16,
          minHeight: 56, // Extra large for emphasis
        };
      default:
        return {
          paddingVertical: 12,
          paddingHorizontal: 20,
          fontSize: 16,
          minHeight: 48,
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  const renderContent = () => {
    if (loading) {
      return <ActivityIndicator color={variantStyles.textColor} size="small" />;
    }

    const textElement = (
      <Text
        style={[
          styles.buttonText,
          {
            color: variantStyles.textColor,
            fontSize: sizeStyles.fontSize,
          },
          textStyle,
        ]}
      >
        {title}
      </Text>
    );

    if (!icon) {
      return textElement;
    }

    return (
      <View style={styles.contentContainer}>
        {iconPosition === 'left' && icon}
        {textElement}
        {iconPosition === 'right' && icon}
      </View>
    );
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        {
          backgroundColor: variantStyles.backgroundColor,
          borderColor: variantStyles.borderColor,
          paddingVertical: sizeStyles.paddingVertical,
          paddingHorizontal: sizeStyles.paddingHorizontal,
          minHeight: sizeStyles.minHeight,
          opacity: disabled ? 0.5 : 1,
          width: fullWidth ? '100%' : 'auto',
        },
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: disabled || loading }}
      testID={testID}
    >
      {renderContent()}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12, // Design system standard
    borderWidth: 1,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8, // 2 × 4px base unit
  },
  buttonText: {
    fontWeight: '600', // Design system standard
    textAlign: 'center',
  },
});

/**
 * Button Group Component
 * For displaying multiple buttons in a row with consistent spacing
 */
interface ButtonGroupProps {
  children: React.ReactNode;
  direction?: 'row' | 'column';
  gap?: number;
  style?: ViewStyle;
}

export function ButtonGroup({
  children,
  direction = 'row',
  gap = 12,
  style,
}: ButtonGroupProps) {
  return (
    <View
      style={[
        {
          flexDirection: direction,
          gap: gap,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
