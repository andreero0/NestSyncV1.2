/**
 * NestSync Card Component
 * Consistent card design for content containers
 * Provides proper visual hierarchy and spacing
 */

import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  Platform,
} from 'react-native';
import { Colors, NestSyncColors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';

export type NestSyncCardVariant = 'default' | 'elevated' | 'outlined' | 'filled';
export type NestSyncCardPadding = 'none' | 'small' | 'medium' | 'large';

export interface NestSyncCardProps {
  children: React.ReactNode;
  variant?: NestSyncCardVariant;
  padding?: NestSyncCardPadding;
  style?: ViewStyle;
  testID?: string;
  onPress?: () => void;
}

export function NestSyncCard({
  children,
  variant = 'default',
  padding = 'medium',
  style,
  testID,
  onPress,
}: NestSyncCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const getCardStyle = (): ViewStyle[] => {
    const baseStyle = [
      styles.card,
      styles[padding],
      { backgroundColor: colors.surface },
    ];

    switch (variant) {
      case 'default':
        return [
          ...baseStyle,
          {
            borderWidth: 1,
            borderColor: colors.border,
          },
        ];

      case 'elevated':
        return [
          ...baseStyle,
          styles.elevated,
          Platform.OS === 'ios' && styles.iosShadow,
        ];

      case 'outlined':
        return [
          ...baseStyle,
          {
            borderWidth: 1.5,
            borderColor: colors.tint,
            backgroundColor: 'transparent',
          },
        ];

      case 'filled':
        return [
          ...baseStyle,
          {
            backgroundColor: colors.tint,
            borderWidth: 0,
          },
        ];

      default:
        return baseStyle;
    }
  };

  const CardComponent = onPress ? 
    require('react-native').TouchableOpacity : 
    View;

  return (
    <CardComponent
      style={[getCardStyle(), style]}
      onPress={onPress}
      testID={testID}
      accessibilityRole={onPress ? "button" : undefined}
      activeOpacity={onPress ? 0.8 : 1}
    >
      {children}
    </CardComponent>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
  },

  // Padding variants
  none: {
    padding: 0,
  },
  small: {
    padding: 12,
  },
  medium: {
    padding: 16,
  },
  large: {
    padding: 24,
  },

  // Elevation for Android and shadow for iOS
  elevated: {
    ...Platform.select({
      android: {
        elevation: 4,
      },
      ios: {
        // iOS shadow applied separately to avoid conflicts
      },
    }),
  },

  // iOS specific shadow
  iosShadow: {
    boxShadow: `0 2px 8px ${NestSyncColors.neutral[900]}1A`,
  },
});

export default NestSyncCard;