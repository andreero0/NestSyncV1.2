/**
 * NestSync Input Component
 * Accessible and user-friendly input fields for Canadian parents
 * Includes validation states and clear visual feedback
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors, NestSyncColors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';

export interface NestSyncInputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  required?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  showPasswordToggle?: boolean;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  errorStyle?: TextStyle;
  success?: boolean;
  helpText?: string;
}

export function NestSyncInput({
  label,
  error,
  required = false,
  leftIcon,
  rightIcon,
  showPasswordToggle = false,
  containerStyle,
  inputStyle,
  labelStyle,
  errorStyle,
  success = false,
  helpText,
  secureTextEntry,
  ...textInputProps
}: NestSyncInputProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const hasError = !!error;
  const isSecureEntry = showPasswordToggle ? !isPasswordVisible : secureTextEntry;

  const getBorderColor = (): string => {
    if (hasError) return colors.error;
    if (success) return colors.success;
    if (isFocused) return colors.tint;
    return colors.border;
  };

  const getIconColor = (): string => {
    if (hasError) return colors.error;
    if (success) return colors.success;
    if (isFocused) return colors.tint;
    return colors.icon;
  };

  const handlePasswordToggle = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Label */}
      {label && (
        <View style={styles.labelContainer}>
          <Text style={[styles.label, { color: colors.textEmphasis }, labelStyle]}>
            {label}
            {required && (
              <Text style={[styles.required, { color: colors.error }]}> *</Text>
            )}
          </Text>
        </View>
      )}

      {/* Input Container */}
      <View
        style={[
          styles.inputContainer,
          {
            borderColor: getBorderColor(),
            backgroundColor: colors.background,
          },
          isFocused && styles.focused,
          hasError && styles.errorContainer,
          success && styles.successContainer,
        ]}
      >
        {/* Left Icon */}
        {leftIcon && (
          <View style={[styles.iconContainer, styles.leftIconContainer]}>
            {leftIcon}
          </View>
        )}

        {/* Text Input */}
        <TextInput
          style={[
            styles.input,
            {
              color: colors.text,
            },
            leftIcon && styles.inputWithLeftIcon,
            (rightIcon || showPasswordToggle) && styles.inputWithRightIcon,
            inputStyle,
          ]}
          placeholderTextColor={colors.placeholder}
          secureTextEntry={isSecureEntry}
          onFocus={(e) => {
            setIsFocused(true);
            textInputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            textInputProps.onBlur?.(e);
          }}
          {...textInputProps}
        />

        {/* Right Icon or Password Toggle */}
        {(rightIcon || showPasswordToggle) && (
          <View style={[styles.iconContainer, styles.rightIconContainer]}>
            {showPasswordToggle ? (
              <TouchableOpacity
                onPress={handlePasswordToggle}
                style={styles.passwordToggle}
                accessibilityLabel={isPasswordVisible ? "Hide password" : "Show password"}
                accessibilityRole="button"
              >
                <Text style={[styles.passwordToggleText, { color: colors.tint }]}>
                  {isPasswordVisible ? 'Hide' : 'Show'}
                </Text>
              </TouchableOpacity>
            ) : (
              rightIcon
            )}
          </View>
        )}
      </View>

      {/* Help Text */}
      {helpText && !error && (
        <Text style={[styles.helpText, { color: colors.textSecondary }]}>
          {helpText}
        </Text>
      )}

      {/* Error Message */}
      {hasError && (
        <Text style={[styles.errorText, { color: colors.error }, errorStyle]}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 4,
  },

  labelContainer: {
    marginBottom: 6,
  },

  label: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
  },

  required: {
    fontSize: 16,
    fontWeight: '500',
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    minHeight: 52,
    paddingHorizontal: 16,
  },

  focused: {
    borderWidth: 2,
  },

  errorContainer: {
    borderColor: NestSyncColors.semantic.error,
  },

  successContainer: {
    borderColor: NestSyncColors.semantic.success,
  },

  input: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    paddingVertical: 15,
    paddingHorizontal: 0,
  },

  inputWithLeftIcon: {
    paddingLeft: 12,
  },

  inputWithRightIcon: {
    paddingRight: 12,
  },

  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  leftIconContainer: {
    paddingRight: 8,
  },

  rightIconContainer: {
    paddingLeft: 8,
  },

  passwordToggle: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    minWidth: 50,
    alignItems: 'center',
  },

  passwordToggleText: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },

  helpText: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },

  errorText: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    fontWeight: '500',
  },
});

export default NestSyncInput;