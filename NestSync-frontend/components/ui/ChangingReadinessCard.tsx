/**
 * Changing Readiness Card Component
 * Primary readiness display that transforms from inventory-focused to readiness-focused interface
 * Psychology-driven design to build confidence for Canadian parents
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import { IconSymbol } from './IconSymbol';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import { InventoryStatusIndicator, getReadinessStatus, InventoryStatus } from './InventoryStatusIndicator';

const { width } = Dimensions.get('window');

export interface ChangingReadinessCardProps {
  changesReady: number;
  onPress?: () => void;
  loading?: boolean;
  style?: any;
}

export function ChangingReadinessCard({
  changesReady,
  onPress,
  loading = false,
  style,
}: ChangingReadinessCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const status = getReadinessStatus(changesReady);

  // Psychology-driven messaging based on readiness level
  const getReadinessMessage = (changes: number, status: InventoryStatus): string => {
    if (changes >= 20) {
      return "You're well prepared";
    } else if (changes >= 10) {
      return "Good supply remaining";
    } else if (changes >= 5) {
      return "Time to plan a restock";
    } else {
      return "Let's get you restocked";
    }
  };

  const getStatusIcon = (status: InventoryStatus): string => {
    switch (status) {
      case 'ready':
        return 'checkmark.circle.fill';
      case 'warning':
        return 'exclamationmark.triangle.fill';
      case 'critical':
        return 'arrow.clockwise.circle.fill';
      default:
        return 'circle.fill';
    }
  };

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
      accessibilityLabel={`${changesReady} changes ready. ${getReadinessMessage(changesReady, status)}. ${onPress ? 'Tap for details' : ''}`}
      accessibilityHint={onPress ? 'Shows supply breakdown' : undefined}
    >
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <IconSymbol 
            name="arrow.clockwise" 
            size={32} 
            color={status === 'ready' ? '#00C853' : status === 'warning' ? '#FFB300' : '#D32F2F'} 
          />
        </View>
        <View style={styles.headerContent}>
          <ThemedText type="defaultSemiBold" style={styles.headerLabel}>
            Changes Ready
          </ThemedText>
          <InventoryStatusIndicator status={status} size="small" />
        </View>
        {onPress && (
          <IconSymbol 
            name="chevron.right" 
            size={20} 
            color={colors.textSecondary} 
          />
        )}
      </View>

      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <View style={[styles.loadingSkeleton, styles.loadingNumber, { backgroundColor: colors.border }]} />
            <View style={[styles.loadingSkeleton, styles.loadingText, { backgroundColor: colors.border }]} />
          </View>
        ) : (
          <>
            <ThemedText type="title" style={[styles.readinessNumber, { 
              color: status === 'ready' ? '#00C853' : status === 'warning' ? '#FFB300' : '#D32F2F' 
            }]}>
              {changesReady}
            </ThemedText>
            <ThemedText style={[styles.readinessSubtext, { color: colors.textSecondary }]}>
              {getReadinessMessage(changesReady, status)}
            </ThemedText>
          </>
        )}
      </View>

      {/* Canadian trust indicator for readiness */}
      <View style={styles.trustBadge}>
        <IconSymbol name="leaf.fill" size={12} color="#00C853" />
        <ThemedText style={[styles.trustText, { color: colors.textSecondary }]}>
          Based on current supplies
        </ThemedText>
      </View>
    </CardComponent>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  iconContainer: {
    // Icon container styling applied dynamically
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLabel: {
    fontSize: 16,
    letterSpacing: 0.5,
  },
  content: {
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  readinessNumber: {
    fontSize: 48,
    fontWeight: '800',
    lineHeight: 56,
    marginBottom: 4,
  },
  readinessSubtext: {
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
  },
  trustText: {
    fontSize: 13,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  loadingContainer: {
    width: '100%',
  },
  loadingSkeleton: {
    borderRadius: 8,
    marginBottom: 8,
  },
  loadingNumber: {
    height: 56,
    width: '40%',
  },
  loadingText: {
    height: 20,
    width: '70%',
  },
});

export default ChangingReadinessCard;