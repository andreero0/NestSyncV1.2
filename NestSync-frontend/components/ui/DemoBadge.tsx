/**
 * DemoBadge Component
 * 
 * Badge component for marking demo, placeholder, or sample content.
 * Helps users distinguish between real data and demo content.
 * 
 * Features:
 * - Multiple variants (demo, sample, placeholder, test)
 * - Compact and inline display options
 * - Design system compliant styling
 * - Accessibility support
 * 
 * Usage:
 * ```tsx
 * <DemoBadge variant="demo" />
 * <DemoBadge variant="sample" text="Sample Data" />
 * <DemoBadge variant="placeholder" inline />
 * ```
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle, TouchableOpacity } from 'react-native';
import { IconSymbol } from './IconSymbol';
import { useNestSyncTheme } from '@/contexts/ThemeContext';
import { Colors, NestSyncColors } from '@/constants/Colors';

export interface DemoBadgeProps {
  /** Badge variant */
  variant?: 'demo' | 'sample' | 'placeholder' | 'test';
  /** Custom text (overrides default) */
  text?: string;
  /** Show icon */
  showIcon?: boolean;
  /** Inline display (smaller, more compact) */
  inline?: boolean;
  /** Custom style override */
  style?: ViewStyle;
  /** Custom text style override */
  textStyle?: TextStyle;
  /** Test ID for testing */
  testID?: string;
}

export function DemoBadge({
  variant = 'demo',
  text,
  showIcon = true,
  inline = false,
  style,
  textStyle,
  testID,
}: DemoBadgeProps) {
  const theme = useNestSyncTheme();
  const colors = Colors[theme];

  const getVariantConfig = () => {
    switch (variant) {
      case 'demo':
        return {
          text: text || 'DEMO',
          icon: 'eye' as const,
          backgroundColor: NestSyncColors.accent.amber + '20',
          textColor: NestSyncColors.accent.amber,
          borderColor: NestSyncColors.accent.amber,
        };
      case 'sample':
        return {
          text: text || 'SAMPLE',
          icon: 'doc.text' as const,
          backgroundColor: NestSyncColors.primary.blue + '20',
          textColor: NestSyncColors.primary.blue,
          borderColor: NestSyncColors.primary.blue,
        };
      case 'placeholder':
        return {
          text: text || 'PLACEHOLDER',
          icon: 'square.dashed' as const,
          backgroundColor: colors.textSecondary + '20',
          textColor: colors.textSecondary,
          borderColor: colors.textSecondary,
        };
      case 'test':
        return {
          text: text || 'TEST',
          icon: 'wrench.and.screwdriver' as const,
          backgroundColor: NestSyncColors.accent.purple + '20',
          textColor: NestSyncColors.accent.purple,
          borderColor: NestSyncColors.accent.purple,
        };
      default:
        return {
          text: text || 'DEMO',
          icon: 'eye' as const,
          backgroundColor: NestSyncColors.accent.amber + '20',
          textColor: NestSyncColors.accent.amber,
          borderColor: NestSyncColors.accent.amber,
        };
    }
  };

  const config = getVariantConfig();

  return (
    <View
      style={[
        styles.badge,
        inline ? styles.badgeInline : styles.badgeDefault,
        {
          backgroundColor: config.backgroundColor,
          borderColor: config.borderColor,
        },
        style,
      ]}
      accessibilityRole="text"
      accessibilityLabel={`${config.text} content`}
      testID={testID}
    >
      {showIcon && (
        <IconSymbol
          name={config.icon}
          size={inline ? 12 : 14}
          color={config.textColor}
        />
      )}

      <Text
        style={[
          styles.text,
          inline ? styles.textInline : styles.textDefault,
          { color: config.textColor },
          textStyle,
        ]}
      >
        {config.text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeDefault: {
    paddingHorizontal: 10, // 2.5 × 4px base unit
    paddingVertical: 4, // 1 × 4px base unit
    borderRadius: 6, // Small border radius
    gap: 6, // 1.5 × 4px base unit
  },
  badgeInline: {
    paddingHorizontal: 6, // 1.5 × 4px base unit
    paddingVertical: 2, // 0.5 × 4px base unit
    borderRadius: 4, // Extra small border radius
    gap: 4, // 1 × 4px base unit
  },
  text: {
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  textDefault: {
    fontSize: 11, // Caption size
  },
  textInline: {
    fontSize: 10, // Extra small
  },
});

/**
 * Preset demo badges for common scenarios
 */

export function DemoContentBadge() {
  return <DemoBadge variant="demo" testID="demo-content-badge" />;
}

export function SampleDataBadge() {
  return <DemoBadge variant="sample" testID="sample-data-badge" />;
}

export function PlaceholderBadge() {
  return <DemoBadge variant="placeholder" testID="placeholder-badge" />;
}

export function TestDataBadge() {
  return <DemoBadge variant="test" testID="test-data-badge" />;
}

/**
 * DemoBanner Component
 * 
 * Full-width banner for marking entire sections as demo content.
 * More prominent than a badge, suitable for page-level indicators.
 */

export interface DemoBannerProps {
  /** Banner variant */
  variant?: 'demo' | 'sample' | 'placeholder' | 'test';
  /** Custom message */
  message?: string;
  /** Show dismiss button */
  dismissible?: boolean;
  /** Dismiss handler */
  onDismiss?: () => void;
  /** Custom style override */
  style?: ViewStyle;
  /** Test ID for testing */
  testID?: string;
}

export function DemoBanner({
  variant = 'demo',
  message,
  dismissible = false,
  onDismiss,
  style,
  testID,
}: DemoBannerProps) {
  const theme = useNestSyncTheme();
  const colors = Colors[theme];

  const getVariantConfig = () => {
    switch (variant) {
      case 'demo':
        return {
          message: message || 'This is demo content for preview purposes',
          backgroundColor: NestSyncColors.accent.amber + '20',
          textColor: NestSyncColors.accent.amber,
          borderColor: NestSyncColors.accent.amber,
        };
      case 'sample':
        return {
          message: message || 'This is sample data to demonstrate features',
          backgroundColor: NestSyncColors.primary.blue + '20',
          textColor: NestSyncColors.primary.blue,
          borderColor: NestSyncColors.primary.blue,
        };
      case 'placeholder':
        return {
          message: message || 'This is placeholder content',
          backgroundColor: colors.textSecondary + '20',
          textColor: colors.textSecondary,
          borderColor: colors.textSecondary,
        };
      case 'test':
        return {
          message: message || 'This is test data for development',
          backgroundColor: NestSyncColors.accent.purple + '20',
          textColor: NestSyncColors.accent.purple,
          borderColor: NestSyncColors.accent.purple,
        };
      default:
        return {
          message: message || 'This is demo content',
          backgroundColor: NestSyncColors.accent.amber + '20',
          textColor: NestSyncColors.accent.amber,
          borderColor: NestSyncColors.accent.amber,
        };
    }
  };

  const config = getVariantConfig();

  return (
    <View
      style={[
        bannerStyles.banner,
        {
          backgroundColor: config.backgroundColor,
          borderColor: config.borderColor,
        },
        style,
      ]}
      accessibilityRole="alert"
      accessibilityLabel={config.message}
      testID={testID}
    >
      <View style={bannerStyles.content}>
        <IconSymbol
          name="info.circle.fill"
          size={20}
          color={config.textColor}
        />

        <Text
          style={[
            bannerStyles.message,
            { color: config.textColor },
          ]}
        >
          {config.message}
        </Text>
      </View>

      {dismissible && onDismiss && (
        <TouchableOpacity
          onPress={onDismiss}
          style={bannerStyles.dismissButton}
          accessibilityRole="button"
          accessibilityLabel="Dismiss banner"
        >
          <IconSymbol
            name="xmark.circle.fill"
            size={20}
            color={config.textColor}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const bannerStyles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12, // 3 × 4px base unit
    borderRadius: 8, // Medium border radius
    borderWidth: 1,
    marginVertical: 8, // 2 × 4px base unit
    gap: 12, // 3 × 4px base unit
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12, // 3 × 4px base unit
  },
  message: {
    fontSize: 14, // Body size
    fontWeight: '500',
    flex: 1,
    lineHeight: 20,
  },
  dismissButton: {
    padding: 4, // 1 × 4px base unit
  },
});
