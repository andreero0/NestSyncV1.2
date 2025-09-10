/**
 * Supply Breakdown Card Component
 * Individual product inventory cards for progressive disclosure
 * Shows detailed breakdown of diapers, wipes, etc.
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { ThemedText } from '../ThemedText';
import { IconSymbol } from './IconSymbol';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';

const { width } = Dimensions.get('window');

export type SupplyType = 'diapers' | 'wipes' | 'cream' | 'powder';

export interface SupplyBreakdownCardProps {
  type: SupplyType;
  quantity: number;
  label?: string;
  onPress?: () => void;
  loading?: boolean;
  style?: any;
}

const SUPPLY_CONFIG = {
  diapers: {
    icon: 'square.3.layers.3d',
    defaultLabel: 'Diapers',
    color: '#0891B2', // Primary blue for main supply
  },
  wipes: {
    icon: 'rectangle.3.group',
    defaultLabel: 'Wipes',
    color: '#059669', // Green for secondary supplies
  },
  cream: {
    icon: 'drop.circle',
    defaultLabel: 'Cream',
    color: '#EA580C', // Orange for care products
  },
  powder: {
    icon: 'sparkles',
    defaultLabel: 'Powder',
    color: '#7C3AED', // Purple for specialty items
  },
};

export function SupplyBreakdownCard({
  type,
  quantity,
  label,
  onPress,
  loading = false,
  style,
}: SupplyBreakdownCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const config = SUPPLY_CONFIG[type];
  const displayLabel = label || config.defaultLabel;

  const CardComponent = onPress ? TouchableOpacity : View;

  return (
    <CardComponent
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        style,
      ]}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${quantity} ${displayLabel} available${onPress ? '. Tap for details' : ''}`}
      accessibilityHint={onPress ? 'Shows detailed inventory information' : undefined}
    >
      {loading ? (
        <View style={styles.loadingContainer}>
          <View style={[styles.loadingSkeleton, styles.loadingIcon, { backgroundColor: colors.border }]} />
          <View style={styles.loadingContent}>
            <View style={[styles.loadingSkeleton, styles.loadingNumber, { backgroundColor: colors.border }]} />
            <View style={[styles.loadingSkeleton, styles.loadingLabel, { backgroundColor: colors.border }]} />
          </View>
        </View>
      ) : (
        <>
          <View style={[styles.iconContainer, { backgroundColor: `${config.color}15` }]}>
            <IconSymbol 
              name={config.icon} 
              size={24} 
              color={config.color} 
            />
          </View>
          
          <View style={styles.content}>
            <ThemedText type="title" style={[styles.quantity, { color: config.color }]}>
              {quantity}
            </ThemedText>
            <ThemedText style={[styles.label, { color: colors.textSecondary }]}>
              {displayLabel}
            </ThemedText>
            <ThemedText style={[styles.sublabel, { color: colors.textSecondary }]}>
              Available
            </ThemedText>
          </View>

          {onPress && (
            <View style={styles.chevronContainer}>
              <IconSymbol 
                name="chevron.right" 
                size={16} 
                color={colors.textSecondary} 
              />
            </View>
          )}
        </>
      )}
    </CardComponent>
  );
}

// Convenience component for common supply types
export function DiapersCard({ quantity, onPress, loading }: { quantity: number; onPress?: () => void; loading?: boolean }) {
  return (
    <SupplyBreakdownCard
      type="diapers"
      quantity={quantity}
      onPress={onPress}
      loading={loading}
    />
  );
}

export function WipesCard({ quantity, onPress, loading }: { quantity: number; onPress?: () => void; loading?: boolean }) {
  return (
    <SupplyBreakdownCard
      type="wipes"
      quantity={quantity}
      onPress={onPress}
      loading={loading}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    width: (width - 52) / 2, // Responsive width for two-column layout
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    minHeight: 120,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  content: {
    alignItems: 'center',
    flex: 1,
  },
  quantity: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 2,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
  },
  sublabel: {
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.8,
  },
  chevronContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  loadingContainer: {
    width: '100%',
    alignItems: 'center',
  },
  loadingSkeleton: {
    borderRadius: 8,
  },
  loadingIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 12,
  },
  loadingContent: {
    width: '100%',
    alignItems: 'center',
  },
  loadingNumber: {
    height: 28,
    width: '50%',
    marginBottom: 4,
  },
  loadingLabel: {
    height: 14,
    width: '70%',
    marginBottom: 2,
  },
});

export default SupplyBreakdownCard;