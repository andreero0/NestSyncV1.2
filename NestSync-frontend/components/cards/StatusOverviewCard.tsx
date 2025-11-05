import React from 'react';
import { 
  View, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  ViewStyle
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors, NestSyncColors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

// Icon Props for consistent icon interface
export interface IconProps {
  size?: number;
  color?: string;
  accessibilityLabel?: string;
}

// Main component props interface following design specifications
export interface StatusOverviewCardProps {
  // Core data properties
  statusType: 'critical' | 'low' | 'stocked' | 'pending';
  title: string;
  count: number;
  description?: string;
  
  // Visual customization - using IconSymbol from existing pattern
  iconName: string; // SF Symbol name for IconSymbol component
  borderColor: string; // Traffic light border color
  
  // Interaction properties
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  
  // Accessibility properties
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
  
  // Layout properties
  style?: ViewStyle;
}

export function StatusOverviewCard({
  statusType,
  title,
  count,
  description,
  iconName,
  borderColor,
  onPress,
  disabled = false,
  loading = false,
  accessibilityLabel,
  accessibilityHint,
  testID,
  style,
}: StatusOverviewCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  // Get background color with 20% opacity based on status type
  const getBackgroundColor = (statusType: string) => {
    switch (statusType) {
      case 'critical':
        return colorScheme === 'dark' ? 'rgba(220, 38, 38, 0.1)' : 'rgba(220, 38, 38, 0.05)';
      case 'low':
        return colorScheme === 'dark' ? 'rgba(217, 119, 6, 0.1)' : 'rgba(217, 119, 6, 0.05)';
      case 'stocked':
        return colorScheme === 'dark' ? 'rgba(5, 150, 105, 0.1)' : 'rgba(5, 150, 105, 0.05)';
      case 'pending':
        return colorScheme === 'dark' ? 'rgba(8, 145, 178, 0.1)' : 'rgba(8, 145, 178, 0.05)';
      default:
        return colors.surface;
    }
  };
  
  const handlePress = () => {
    if (!disabled && !loading && onPress) {
      onPress();
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { 
          backgroundColor: getBackgroundColor(statusType),
          borderColor: disabled ? colors.border : borderColor,
          opacity: loading ? 0.6 : disabled ? 0.3 : 1,
        },
        style
      ]}
      onPress={handlePress}
      disabled={disabled || loading}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || `${title}: ${count} items. ${description || ''}`}
      accessibilityHint={accessibilityHint || "Tap to view detailed breakdown"}
      testID={testID || `status-card-${statusType}`}
      activeOpacity={0.8}
    >
      {/* Centered content container */}
      <View style={styles.contentContainer}>
        {/* Icon - 32x32px for consistency */}
        <View style={styles.iconContainer}>
          <IconSymbol
            name={iconName}
            size={32}
            color={disabled ? colors.placeholder : colors.text}
          />
        </View>
        
        {/* Count display - 36px bold number */}
        <ThemedText style={[
          styles.count,
          { color: disabled ? colors.placeholder : colors.textEmphasis }
        ]}>
          {loading ? '–' : count.toString()}
        </ThemedText>
        
        {/* Title - 14px label */}
        <ThemedText style={[
          styles.title,
          { color: disabled ? colors.placeholder : colors.textSecondary }
        ]}>
          {title}
        </ThemedText>
      </View>
      
      {/* Loading overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={colors.tint} />
        </View>
      )}
    </TouchableOpacity>
  );
}

// Responsive card styling with percentage-based dimensions
const styles = StyleSheet.create({
  card: {
    // Responsive dimensions - inherits width from wrapper
    width: '100%', // Inherits from wrapper (47% of container)
    aspectRatio: 4 / 3, // Maintains 4:3 proportions (same as 160:120)
    borderWidth: 3,
    borderRadius: 12,
    // Shadow for depth
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2, // Android shadow
    // Touch target requirements
    minWidth: 44, // Accessibility minimum
    minHeight: 44, // Accessibility minimum
  },
  
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  
  iconContainer: {
    marginBottom: 6,
    // 32x32px icon as specified
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  count: {
    fontSize: 36, // Prominent 36px number as specified
    lineHeight: 40,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.02,
    marginBottom: 2,
  },
  
  title: {
    fontSize: 14, // 14px label as specified
    lineHeight: 16,
    fontWeight: '500',
    textAlign: 'center',
    // Ensure text doesn't wrap in small space
    numberOfLines: 1,
  },
  
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// Export type definitions for use in parent components
export type StatusType = 'critical' | 'low' | 'stocked' | 'pending';