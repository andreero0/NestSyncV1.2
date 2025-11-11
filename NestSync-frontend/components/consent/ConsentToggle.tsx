/**
 * ConsentToggle Component
 * Reusable PIPEDA-compliant consent toggle with accessibility support
 * Designed for NestSync's Canadian privacy requirements
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  AccessibilityInfo,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useColorScheme } from '../../hooks/useColorScheme';
import { Colors } from '../../constants/Colors';

interface ConsentToggleProps {
  title: string;
  description: string;
  isChecked: boolean;
  onToggle: (value: boolean) => void;
  isRequired?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const ConsentToggle: React.FC<ConsentToggleProps> = ({
  title,
  description,
  isChecked,
  onToggle,
  isRequired = false,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handleToggle = () => {
    if (disabled) {
      // Show feedback for required consents
      if (isRequired) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        AccessibilityInfo.announceForAccessibility('This permission is required for the app to function');
      }
      return;
    }

    const newValue = !isChecked;
    onToggle(newValue);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Announce state change to screen readers
    const announcement = `${title} ${newValue ? 'enabled' : 'disabled'}`;
    AccessibilityInfo.announceForAccessibility(announcement);
  };

  const dynamicStyles = {
    container: {
      backgroundColor: isRequired ? colors.backgroundSecondary : colors.background,
      borderColor: colors.border,
    },
    title: {
      color: colors.text,
    },
    description: {
      color: colors.textSecondary,
    },
    checkbox: {
      borderColor: isChecked ? colors.tint : colors.border,
      backgroundColor: isChecked ? colors.tint : 'transparent',
    },
    checkmark: {
      color: colors.background,
    },
    requiredBadge: {
      backgroundColor: colors.backgroundSecondary,
      borderColor: colors.border,
    },
    requiredText: {
      color: colors.textSecondary,
    },
  };

  return (
    <TouchableOpacity
      style={[styles.container, dynamicStyles.container]}
      onPress={handleToggle}
      disabled={disabled && isRequired}
      accessible={true}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: isChecked }}
      accessibilityLabel={accessibilityLabel || `${title} consent`}
      accessibilityHint={
        accessibilityHint ||
        (isRequired
          ? 'Required. This data is necessary for the app to function'
          : `Optional. ${description}`)
      }
      testID={`consent-toggle-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, dynamicStyles.title]}>{title}</Text>
            {isRequired && (
              <View style={[styles.requiredBadge, dynamicStyles.requiredBadge]}>
                <Text style={[styles.requiredText, dynamicStyles.requiredText]}>Required</Text>
              </View>
            )}
          </View>
          <Text style={[styles.description, dynamicStyles.description]}>{description}</Text>
        </View>

        <View style={[styles.checkbox, dynamicStyles.checkbox]}>
          {isChecked && <Text style={[styles.checkmark, dynamicStyles.checkmark]}>✓</Text>}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
    marginRight: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  requiredBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    marginLeft: 8,
  },
  requiredText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2, // Align with first line of text
  },
  checkmark: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 18,
  },
});

export default ConsentToggle;