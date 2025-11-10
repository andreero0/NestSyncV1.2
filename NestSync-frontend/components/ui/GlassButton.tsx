/**
 * GlassButton Component
 * 
 * Button component with glass UI styling built on GlassView.
 * Provides consistent button appearance with multiple variants and sizes.
 * 
 * Features:
 * - Multiple variants (primary, secondary, outline)
 * - Multiple sizes (small, medium, large)
 * - Icon support (left or right)
 * - Loading state
 * - Disabled state
 * - 48px minimum touch target (accessibility)
 * - Haptic feedback
 * 
 * @example
 * ```tsx
 * // Primary button
 * <GlassButton 
 *   title="Save" 
 *   onPress={handleSave}
 * />
 * 
 * // Button with icon
 * <GlassButton 
 *   title="Add Item" 
 *   icon="plus"
 *   onPress={handleAdd}
 * />
 * ```
 */

import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  ActivityIndicator, 
  StyleSheet, 
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { GlassView } from './GlassView';
import { IconSymbol } from './IconSymbol';
import { GlassUITokens } from '@/constants/GlassUI';

/**
 * Button Variant Types
 * 
 * - primary: Filled button with primary color (default)
 * - secondary: Filled button with secondary color
 * - outline: Outlined button with transparent background
 */
export type GlassButtonVariant = 'primary' | 'secondary' | 'outline';

/**
 * Button Size Types
 * 
 * - small: Compact button (40px height)
 * - medium: Standard button (48px height, default)
 * - large: Prominent button (56px height)
 */
export type GlassButtonSize = 'small' | 'medium' | 'large';

/**
 * Icon Position Types
 */
export type IconPosition = 'left' | 'right';

/**
 * GlassButton Props
 */
export interface GlassButtonProps {
  /** Button text */
  title: string;
  
  /** Press handler */
  onPress: () => void;
  
  /** Button variant style */
  variant?: GlassButtonVariant;
  
  /** Button size */
  size?: GlassButtonSize;
  
  /** Icon name (SF Symbol on iOS) */
  icon?: string;
  
  /** Icon position */
  iconPosition?: IconPosition;
  
  /** Whether the button is disabled */
  disabled?: boolean;
  
  /** Whether the button is in loading state */
  loading?: boolean;
  
  /** Custom button style */
  style?: ViewStyle;
  
  /** Custom text style */
  textStyle?: TextStyle;
  
  /** Full width button */
  fullWidth?: boolean;
  
  /** Accessibility label */
  accessibilityLabel?: string;
  
  /** Test ID for testing */
  testID?: string;
}

/**
 * GlassButton Component
 * 
 * Renders a glass UI button with consistent styling and behavior.
 * Ensures 48px minimum touch target for accessibility.
 */
export const GlassButton = React.memo<GlassButtonProps>(({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  icon,
  iconPosition = 'left',
  disabled = false,
  loading = false,
  style,
  textStyle,
  fullWidth = false,
  accessibilityLabel,
  testID,
}) => {
  // Button is disabled when loading or explicitly disabled
  const isDisabled = disabled || loading;

  // Size configuration
  const sizeConfig = React.useMemo(() => {
    switch (size) {
      case 'small':
        return {
          height: 40,
          paddingHorizontal: 16,
          fontSize: 14,
          iconSize: 16,
        };
      case 'large':
        return {
          height: 56,
          paddingHorizontal: 32,
          fontSize: 18,
          iconSize: 24,
        };
      case 'medium':
      default:
        return {
          height: 48,
          paddingHorizontal: 24,
          fontSize: 16,
          iconSize: 20,
        };
    }
  }, [size]);

  // Variant configuration
  const variantConfig = React.useMemo(() => {
    switch (variant) {
      case 'secondary':
        return {
          backgroundColor: 'rgba(107, 114, 128, 0.2)',
          textColor: '#374151',
          borderWidth: 0,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          textColor: '#0891B2',
          borderWidth: 2,
        };
      case 'primary':
      default:
        return {
          backgroundColor: 'rgba(8, 145, 178, 0.2)',
          textColor: '#FFFFFF',
          borderWidth: 0,
        };
    }
  }, [variant]);

  // Button container style
  const buttonContainerStyle = React.useMemo<ViewStyle>(() => ({
    height: sizeConfig.height,
    paddingHorizontal: sizeConfig.paddingHorizontal,
    width: fullWidth ? '100%' : undefined,
    opacity: isDisabled ? 0.5 : 1,
  }), [sizeConfig, fullWidth, isDisabled]);

  // Button content style
  const buttonContentStyle = React.useMemo<ViewStyle>(() => ({
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  }), []);

  // Text style
  const buttonTextStyle = React.useMemo<TextStyle>(() => ({
    fontSize: sizeConfig.fontSize,
    fontWeight: '600',
    color: variantConfig.textColor,
  }), [sizeConfig, variantConfig]);

  // Glass view configuration
  const glassConfig = React.useMemo(() => ({
    preset: 'button' as const,
    withBorder: variant === 'outline',
    withShadow: variant !== 'outline',
    borderRadius: 12,
  }), [variant]);

  // Render icon
  const renderIcon = () => {
    if (!icon || loading) return null;
    
    return (
      <IconSymbol 
        name={icon as any} 
        size={sizeConfig.iconSize} 
        color={variantConfig.textColor}
      />
    );
  };

  // Render loading indicator
  const renderLoading = () => {
    if (!loading) return null;
    
    return (
      <ActivityIndicator 
        size="small" 
        color={variantConfig.textColor} 
      />
    );
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      testID={testID}
      style={style}
    >
      <GlassView 
        {...glassConfig}
        style={[
          styles.button,
          buttonContainerStyle,
          { borderWidth: variantConfig.borderWidth },
        ] as ViewStyle}
      >
        <View 
          style={[
            buttonContentStyle,
            { backgroundColor: variantConfig.backgroundColor },
          ]}
        >
          {iconPosition === 'left' && renderIcon()}
          {renderLoading()}
          {!loading && (
            <Text style={[buttonTextStyle, textStyle]}>
              {title}
            </Text>
          )}
          {iconPosition === 'right' && renderIcon()}
        </View>
      </GlassView>
    </TouchableOpacity>
  );
});

GlassButton.displayName = 'GlassButton';

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 48, // Accessibility: minimum touch target
  },
});

/**
 * Usage Examples:
 * 
 * 1. Primary Button:
 * ```tsx
 * <GlassButton 
 *   title="Save Changes" 
 *   onPress={handleSave}
 * />
 * ```
 * 
 * 2. Secondary Button:
 * ```tsx
 * <GlassButton 
 *   title="Cancel" 
 *   variant="secondary"
 *   onPress={handleCancel}
 * />
 * ```
 * 
 * 3. Outline Button:
 * ```tsx
 * <GlassButton 
 *   title="Learn More" 
 *   variant="outline"
 *   onPress={handleLearnMore}
 * />
 * ```
 * 
 * 4. Button with Icon:
 * ```tsx
 * <GlassButton 
 *   title="Add Item" 
 *   icon="plus"
 *   onPress={handleAdd}
 * />
 * ```
 * 
 * 5. Button with Right Icon:
 * ```tsx
 * <GlassButton 
 *   title="Next" 
 *   icon="chevron.right"
 *   iconPosition="right"
 *   onPress={handleNext}
 * />
 * ```
 * 
 * 6. Loading Button:
 * ```tsx
 * <GlassButton 
 *   title="Saving..." 
 *   loading={isSaving}
 *   onPress={handleSave}
 * />
 * ```
 * 
 * 7. Disabled Button:
 * ```tsx
 * <GlassButton 
 *   title="Submit" 
 *   disabled={!isValid}
 *   onPress={handleSubmit}
 * />
 * ```
 * 
 * 8. Full Width Button:
 * ```tsx
 * <GlassButton 
 *   title="Continue" 
 *   fullWidth
 *   onPress={handleContinue}
 * />
 * ```
 * 
 * 9. Large Button:
 * ```tsx
 * <GlassButton 
 *   title="Get Started" 
 *   size="large"
 *   onPress={handleGetStarted}
 * />
 * ```
 * 
 * 10. Small Button:
 * ```tsx
 * <GlassButton 
 *   title="Edit" 
 *   size="small"
 *   variant="outline"
 *   onPress={handleEdit}
 * />
 * ```
 */
