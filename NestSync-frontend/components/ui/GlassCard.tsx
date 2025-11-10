/**
 * GlassCard Component
 * 
 * Card component with glass UI styling built on GlassView.
 * Provides consistent card appearance with optional press handling.
 * 
 * Features:
 * - Multiple variants (default, elevated, outlined)
 * - Press handling with visual feedback
 * - Consistent padding and spacing
 * - Accessibility support
 * - Performance optimization
 * 
 * @example
 * ```tsx
 * // Basic card
 * <GlassCard>
 *   <Text>Card Content</Text>
 * </GlassCard>
 * 
 * // Interactive card
 * <GlassCard onPress={() => console.log('Pressed')} variant="elevated">
 *   <Text>Tap Me</Text>
 * </GlassCard>
 * ```
 */

import React from 'react';
import { TouchableOpacity, View, StyleSheet, ViewStyle } from 'react-native';
import { GlassView, GlassViewProps } from './GlassView';
import { GlassUITokens } from '@/constants/GlassUI';

/**
 * Card Variant Types
 * 
 * - default: Standard glass card with subtle elevation
 * - elevated: Enhanced shadow for more prominence
 * - outlined: Emphasized border with reduced shadow
 */
export type GlassCardVariant = 'default' | 'elevated' | 'outlined';

/**
 * GlassCard Props
 */
export interface GlassCardProps extends Omit<GlassViewProps, 'preset'> {
  /** Card variant style */
  variant?: GlassCardVariant;
  
  /** Press handler (makes card interactive) */
  onPress?: () => void;
  
  /** Long press handler */
  onLongPress?: () => void;
  
  /** Whether the card is disabled */
  disabled?: boolean;
  
  /** Active opacity when pressed (default: 0.8) */
  activeOpacity?: number;
  
  /** Custom padding (default: 16) */
  padding?: number;
  
  /** Custom margin bottom (default: 12) */
  marginBottom?: number;
}

/**
 * GlassCard Component
 * 
 * Renders a glass UI card with optional press handling.
 * Automatically applies card preset and variant-specific styling.
 */
export const GlassCard = React.memo<GlassCardProps>(({
  children,
  variant = 'default',
  onPress,
  onLongPress,
  disabled = false,
  activeOpacity = 0.8,
  padding = 16,
  marginBottom = 12,
  style,
  intensity,
  tint,
  withBorder = true,
  withShadow = true,
  borderRadius = 16,
  accessibilityLabel,
  accessibilityRole = 'button',
  testID,
  ...glassViewProps
}) => {
  // Determine if card is interactive
  const isInteractive = !disabled && (onPress || onLongPress);

  // Card container styles
  const cardStyle = React.useMemo<ViewStyle>(() => ({
    padding,
    marginBottom,
  }), [padding, marginBottom]);

  // Variant-specific styles
  const variantStyle = React.useMemo(() => {
    switch (variant) {
      case 'elevated':
        return styles.elevated;
      case 'outlined':
        return styles.outlined;
      case 'default':
      default:
        return styles.default;
    }
  }, [variant]);

  // Combined styles
  const combinedStyle = React.useMemo(() => [
    cardStyle,
    variantStyle,
    style,
  ], [cardStyle, variantStyle, style]);

  // Glass view configuration
  const glassConfig = React.useMemo(() => ({
    preset: 'card' as const,
    intensity,
    tint,
    withBorder: variant === 'outlined' ? true : withBorder,
    withShadow: variant === 'outlined' ? false : withShadow,
    borderRadius,
    ...glassViewProps,
  }), [variant, intensity, tint, withBorder, withShadow, borderRadius, glassViewProps]);

  // Render interactive card
  if (isInteractive) {
    return (
      <TouchableOpacity
        onPress={onPress}
        onLongPress={onLongPress}
        disabled={disabled}
        activeOpacity={activeOpacity}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole={accessibilityRole}
        accessibilityState={{ disabled }}
        testID={testID}
      >
        <GlassView {...glassConfig} style={combinedStyle}>
          {children}
        </GlassView>
      </TouchableOpacity>
    );
  }

  // Render static card
  return (
    <GlassView 
      {...glassConfig} 
      style={combinedStyle}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole || 'none'}
      testID={testID}
    >
      {children}
    </GlassView>
  );
});

GlassCard.displayName = 'GlassCard';

const styles = StyleSheet.create({
  default: {
    // Standard card styling (applied via GlassView preset)
  },
  elevated: {
    // Enhanced shadow for elevated variant
    shadowColor: GlassUITokens.shadow.color,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  },
  outlined: {
    // Emphasized border for outlined variant
    borderWidth: 2,
    borderColor: GlassUITokens.border.color.light,
  },
});

/**
 * Usage Examples:
 * 
 * 1. Basic Card:
 * ```tsx
 * <GlassCard>
 *   <Text style={styles.title}>Dashboard</Text>
 *   <Text style={styles.subtitle}>Welcome back!</Text>
 * </GlassCard>
 * ```
 * 
 * 2. Interactive Card:
 * ```tsx
 * <GlassCard 
 *   onPress={() => navigation.navigate('Details')}
 *   variant="elevated"
 * >
 *   <Text>Tap to view details</Text>
 * </GlassCard>
 * ```
 * 
 * 3. Outlined Card:
 * ```tsx
 * <GlassCard variant="outlined" padding={20}>
 *   <Text>Important Information</Text>
 * </GlassCard>
 * ```
 * 
 * 4. Custom Styled Card:
 * ```tsx
 * <GlassCard 
 *   style={{ marginBottom: 24 }}
 *   padding={24}
 *   borderRadius={20}
 * >
 *   <Text>Custom Card</Text>
 * </GlassCard>
 * ```
 * 
 * 5. Disabled Interactive Card:
 * ```tsx
 * <GlassCard 
 *   onPress={() => {}}
 *   disabled={true}
 * >
 *   <Text style={{ opacity: 0.5 }}>Disabled</Text>
 * </GlassCard>
 * ```
 * 
 * 6. Card with Long Press:
 * ```tsx
 * <GlassCard 
 *   onPress={() => console.log('Pressed')}
 *   onLongPress={() => console.log('Long pressed')}
 * >
 *   <Text>Press or hold</Text>
 * </GlassCard>
 * ```
 */
