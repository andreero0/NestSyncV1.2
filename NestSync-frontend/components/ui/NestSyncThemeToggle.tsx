/**
 * NestSync Theme Toggle Component
 * Provides intuitive theme switching with sun/moon icons
 * Supports light/dark/system modes with smooth animations
 */

import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useTheme, ThemeMode } from '../../contexts/ThemeContext';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';

export interface NestSyncThemeToggleProps {
  style?: ViewStyle;
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
}

interface ThemeOption {
  mode: ThemeMode;
  label: string;
  icon: string;
  description: string;
}

const THEME_OPTIONS: ThemeOption[] = [
  {
    mode: 'light',
    label: 'Light',
    icon: '☀️',
    description: 'Always use light theme'
  },
  {
    mode: 'dark',
    label: 'Dark',
    icon: '🌙',
    description: 'Always use dark theme'
  },
  {
    mode: 'system',
    label: 'Auto',
    icon: '⚙️',
    description: 'Follow system preference'
  },
];

export function NestSyncThemeToggle({ 
  style, 
  showLabel = false,
  size = 'medium'
}: NestSyncThemeToggleProps) {
  const { themeMode, setThemeMode } = useTheme();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handleThemeChange = async (mode: ThemeMode) => {
    await setThemeMode(mode);
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: styles.containerSmall,
          button: styles.buttonSmall,
          icon: styles.iconSmall,
          label: styles.labelSmall,
        };
      case 'large':
        return {
          container: styles.containerLarge,
          button: styles.buttonLarge,
          icon: styles.iconLarge,
          label: styles.labelLarge,
        };
      default:
        return {
          container: styles.containerMedium,
          button: styles.buttonMedium,
          icon: styles.iconMedium,
          label: styles.labelMedium,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <View style={[styles.container, sizeStyles.container, style]}>
      {THEME_OPTIONS.map((option) => {
        const isActive = themeMode === option.mode;
        
        return (
          <TouchableOpacity
            key={option.mode}
            style={[
              styles.button,
              sizeStyles.button,
              {
                backgroundColor: isActive ? colors.tint : colors.surface,
                borderColor: isActive ? colors.tint : colors.border,
              }
            ]}
            onPress={() => handleThemeChange(option.mode)}
            accessibilityRole="button"
            accessibilityLabel={`Switch to ${option.label} theme: ${option.description}`}
            accessibilityState={{ selected: isActive }}
            activeOpacity={0.7}
          >
            <Text 
              style={[
                styles.icon, 
                sizeStyles.icon,
                { opacity: isActive ? 1 : 0.6 }
              ]}
            >
              {option.icon}
            </Text>
            {showLabel && (
              <Text
                style={[
                  styles.label,
                  sizeStyles.label,
                  {
                    color: isActive ? (colorScheme === 'dark' ? colors.background : '#FFFFFF') : colors.text,
                    fontWeight: isActive ? '600' : '500',
                  }
                ]}
              >
                {option.label}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    backgroundColor: 'transparent',
  },

  // Size variants for container
  containerSmall: {
    borderRadius: 8,
    padding: 2,
  },
  containerMedium: {
    borderRadius: 12,
    padding: 4,
  },
  containerLarge: {
    borderRadius: 16,
    padding: 6,
  },

  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    marginHorizontal: 2,
    minHeight: 44, // Accessibility minimum touch target
  },

  // Size variants for buttons
  buttonSmall: {
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    minHeight: 36,
  },
  buttonMedium: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minHeight: 44,
  },
  buttonLarge: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 52,
  },

  icon: {
    textAlign: 'center',
  },

  // Size variants for icons
  iconSmall: {
    fontSize: 16,
    lineHeight: 20,
  },
  iconMedium: {
    fontSize: 20,
    lineHeight: 24,
  },
  iconLarge: {
    fontSize: 24,
    lineHeight: 28,
  },

  label: {
    textAlign: 'center',
    marginTop: 4,
  },

  // Size variants for labels
  labelSmall: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  labelMedium: {
    fontSize: 14,
    lineHeight: 18,
    marginTop: 4,
  },
  labelLarge: {
    fontSize: 16,
    lineHeight: 20,
    marginTop: 6,
  },
});

export default NestSyncThemeToggle;