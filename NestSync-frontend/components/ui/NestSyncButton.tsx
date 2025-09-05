/**
 * NestSync Button Component
 * Research-backed button design for Canadian parents
 * Optimized for accessibility and stressed user interactions
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { Colors, NestSyncColors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';

export type NestSyncButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type NestSyncButtonSize = 'small' | 'medium' | 'large';

export interface NestSyncButtonProps {
  title: string;
  onPress: () => void;
  variant?: NestSyncButtonVariant;
  size?: NestSyncButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
}

export function NestSyncButton({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
  testID,
}: NestSyncButtonProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const isDisabled = disabled || loading;

  const getButtonStyle = (): ViewStyle => {
    const baseStyle = [
      styles.button,
      styles[size],
      fullWidth && styles.fullWidth,
    ];

    switch (variant) {
      case 'primary':
        return [
          ...baseStyle,
          {
            backgroundColor: isDisabled 
              ? colors.placeholder 
              : colors.tint,
          },
          isDisabled && styles.disabled,
        ];

      case 'secondary':
        return [
          ...baseStyle,
          {
            backgroundColor: isDisabled
              ? colors.placeholder
              : NestSyncColors.secondary.green,
          },
          isDisabled && styles.disabled,
        ];

      case 'outline':
        return [
          ...baseStyle,
          {
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            borderColor: isDisabled 
              ? colors.placeholder 
              : colors.tint,
          },
          isDisabled && styles.disabled,
        ];

      case 'ghost':
        return [
          ...baseStyle,
          {
            backgroundColor: 'transparent',
            paddingHorizontal: 16,
          },
          isDisabled && styles.disabled,
        ];

      case 'danger':
        return [
          ...baseStyle,
          {
            backgroundColor: isDisabled
              ? colors.placeholder
              : colors.error,
          },
          isDisabled && styles.disabled,
        ];

      default:
        return baseStyle;
    }
  };

  const getTextStyle = (): TextStyle => {
    const baseTextStyle = [styles.text, styles[`text${size.charAt(0).toUpperCase() + size.slice(1)}`]];

    switch (variant) {
      case 'primary':
      case 'secondary':
      case 'danger':
        return [
          ...baseTextStyle,
          {
            color: isDisabled ? NestSyncColors.neutral[400] : '#FFFFFF',
            fontWeight: '600',
          },
        ];

      case 'outline':
        return [
          ...baseTextStyle,
          {
            color: isDisabled 
              ? colors.placeholder 
              : colors.tint,
            fontWeight: '600',
          },
        ];

      case 'ghost':
        return [
          ...baseTextStyle,
          {
            color: isDisabled 
              ? colors.placeholder 
              : colors.tint,
            fontWeight: '500',
          },
        ];

      default:
        return baseTextStyle;
    }
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={isDisabled}
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'outline' || variant === 'ghost' ? colors.tint : '#FFFFFF'} 
        />
      ) : (
        <Text style={[getTextStyle(), textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44, // Minimum touch target for accessibility
  },

  // Size variants
  small: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    minHeight: 36,
  },
  medium: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    minHeight: 48,
  },
  large: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    minHeight: 52,
  },

  // Text size variants
  textSmall: {
    fontSize: 14,
    lineHeight: 20,
  },
  textMedium: {
    fontSize: 16,
    lineHeight: 24,
  },
  textLarge: {
    fontSize: 18,
    lineHeight: 26,
  },

  text: {
    textAlign: 'center',
    fontWeight: '600',
  },

  fullWidth: {
    width: '100%',
  },

  disabled: {
    opacity: 0.6,
  },
});

export default NestSyncButton;