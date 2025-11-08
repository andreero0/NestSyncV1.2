---
title: Developer Implementation Guide
description: Complete technical specifications for implementing psychology-driven traffic light inventory system
feature: inventory-traffic-light-system
last-updated: 2025-01-22
version: 1.0.0
related-files:
  - README.md
  - psychology-messaging.md
  - screen-states.md
  - accessibility.md
dependencies:
  - useInventoryTrafficLight hook
  - StatusOverviewCard component
  - React Native Reanimated
  - Theme system integration
status: draft
---

# Developer Implementation Guide

## Overview

This document provides complete technical specifications for implementing the psychology-driven traffic light inventory system transformation, including enhanced calculations, visual hierarchy changes, and comprehensive accessibility features.

## Table of Contents

1. [Implementation Overview](#implementation-overview)
2. [Data Structure Enhancements](#data-structure-enhancements)
3. [Hook Modifications](#hook-modifications)
4. [Component Updates](#component-updates)
5. [Psychology-Driven Calculations](#psychology-driven-calculations)
6. [Accessibility Implementation](#accessibility-implementation)
7. [Testing Requirements](#testing-requirements)
8. [Performance Considerations](#performance-considerations)

## Implementation Overview

### Transformation Summary
```
CURRENT SYSTEM → ENHANCED SYSTEM
Raw Quantities → Days Remaining + Context
Warehouse Focus → Parent Planning Focus
Basic Messages → Psychology-Driven Support
Standard Accessibility → Stressed Parent Optimization
```

### Key Files to Modify
1. `/hooks/useInventoryTrafficLight.ts` - Enhanced data processing
2. `/components/cards/StatusOverviewCard.tsx` - Visual hierarchy update
3. TypeScript interfaces - Extended data structures
4. Accessibility integration - Screen reader enhancements

### Implementation Phases
1. **Phase 1**: Data structure and calculation enhancements
2. **Phase 2**: Visual hierarchy and component updates
3. **Phase 3**: Psychology-driven messaging integration
4. **Phase 4**: Accessibility and testing validation

## Data Structure Enhancements

### Enhanced TrafficLightData Interface
```typescript
// Extended interface with days remaining calculations
export interface EnhancedTrafficLightData {
  critical: {
    count: number;
    daysRemaining: number | null;
    earliestExpiryDays: number | null;
    psychologyMessage: string;
    quantityContext: string;
  };
  low: {
    count: number;
    daysRemaining: number | null;
    earliestExpiryDays: number | null;
    psychologyMessage: string;
    quantityContext: string;
  };
  wellStocked: {
    count: number;
    daysRemaining: number | null;
    averageExpiryDays: number | null;
    psychologyMessage: string;
    quantityContext: string;
  };
  pending: {
    count: number;
    estimatedDeliveryDays: number | null;
    psychologyMessage: string;
    quantityContext: string;
  };
}
```

### Enhanced StatusOverviewCard Props
```typescript
export interface EnhancedStatusOverviewCardProps {
  // Existing props (maintained for compatibility)
  statusType: 'critical' | 'low' | 'stocked' | 'pending';
  title: string;
  count: number;
  description?: string;
  iconName: string;
  borderColor: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
  style?: ViewStyle;

  // New psychology-driven props
  daysRemaining?: number | null;
  primaryDisplayText: string; // "3 days left" or "Help coming"
  psychologyMessage: string; // "Time to restock soon"
  quantityContext: string; // "(24 diapers remaining)"

  // Enhanced accessibility
  detailedAccessibilityLabel: string;
  contextualAccessibilityHint: string;
  psychologyAccessibilityContent: string;
}
```

### Daily Usage Estimation Interface
```typescript
interface UsageEstimation {
  childId: string;
  estimatedDailyUsage: number;
  confidenceLevel: 'low' | 'medium' | 'high';
  lastUpdated: Date;
  basedOnActualData: boolean;
}

interface UsageCalculationParams {
  childAge: number; // in months
  childWeight?: number; // in kg
  actualUsageHistory?: DailyUsageRecord[];
  fallbackToAgeEstimate: boolean;
}
```

## Hook Modifications

### Enhanced useInventoryTrafficLight Implementation

#### New Helper Functions
```typescript
/**
 * Calculate days remaining based on consumption patterns and expiry dates
 */
function calculateDaysRemaining(
  items: InventoryItem[],
  dailyUsage: number
): number | null {
  if (items.length === 0) return null;

  // Method 1: Use earliest expiry if available
  const itemsWithExpiry = items.filter(item =>
    item.daysUntilExpiry !== null &&
    item.daysUntilExpiry !== undefined &&
    item.quantityRemaining > 0
  );

  if (itemsWithExpiry.length > 0) {
    return Math.min(...itemsWithExpiry.map(item => item.daysUntilExpiry!));
  }

  // Method 2: Calculate based on consumption rate
  const totalQuantity = items.reduce((sum, item) => sum + (item.quantityRemaining || 0), 0);

  if (totalQuantity === 0 || dailyUsage === 0) return null;

  return Math.floor(totalQuantity / dailyUsage);
}

/**
 * Estimate daily usage based on child characteristics
 */
function estimateDailyUsage(params: UsageCalculationParams): number {
  // If we have actual usage data, use it
  if (params.actualUsageHistory && params.actualUsageHistory.length > 0) {
    const recent = params.actualUsageHistory.slice(-7); // Last 7 days
    const average = recent.reduce((sum, day) => sum + day.count, 0) / recent.length;
    return Math.max(1, Math.round(average)); // Minimum 1 diaper per day
  }

  // Age-based estimation (fallback)
  const { childAge } = params;

  if (childAge < 1) return 10; // Newborn: ~10 diapers/day
  if (childAge < 6) return 8;  // 1-6 months: ~8 diapers/day
  if (childAge < 12) return 6; // 6-12 months: ~6 diapers/day
  if (childAge < 24) return 5; // 1-2 years: ~5 diapers/day
  return 3; // 2+ years: ~3 diapers/day (potty training)
}

/**
 * Generate psychology-driven messages based on status and context
 */
function generatePsychologyMessage(
  statusType: string,
  daysRemaining: number | null,
  isWeekend: boolean = false
): string {
  switch (statusType) {
    case 'critical':
      if (daysRemaining === null || daysRemaining === 0) return 'Time to restock now';
      if (daysRemaining === 1) return 'Quick trip needed';
      if (daysRemaining <= 3) return 'Time to restock soon';
      return 'Add to shopping list';

    case 'low':
      if (isWeekend) return 'Perfect for weekend shop';
      if (daysRemaining && daysRemaining <= 5) return 'Great time to plan ahead';
      return 'Plan your next trip';

    case 'stocked':
      if (daysRemaining && daysRemaining > 14) return 'Beautifully prepared!';
      return "You're all set!";

    case 'pending':
      return 'Order on the way';

    default:
      return 'Status unknown';
  }
}

/**
 * Generate quantity context text
 */
function generateQuantityContext(count: number, statusType: string): string {
  if (count === 0) return '(0 diapers remaining)';
  if (count === 1) return '(1 diaper remaining)';

  // For pending orders, different context
  if (statusType === 'pending') {
    return count > 1 ? `(${count} orders incoming)` : '(1 order incoming)';
  }

  return `(${count} diapers remaining)`;
}

/**
 * Generate primary display text
 */
function generatePrimaryDisplayText(
  statusType: string,
  daysRemaining: number | null,
  count: number
): string {
  if (statusType === 'pending') {
    return 'Help coming';
  }

  if (daysRemaining === null) {
    return count === 0 ? 'Out of diapers' : 'Status updating';
  }

  if (daysRemaining === 0) {
    return 'Out today';
  }

  if (daysRemaining === 1) {
    return '1 day left';
  }

  if (daysRemaining > 14) {
    return '2+ weeks left';
  }

  return `${daysRemaining} days left`;
}
```

#### Enhanced Hook Implementation
```typescript
export function useInventoryTrafficLight(childId: string): UseInventoryTrafficLightResult {
  const router = useRouter();

  // Get child information for usage estimation
  const { data: childData } = useQuery(GET_CHILD_DETAILS, {
    variables: { childId },
    skip: !childId
  });

  // Existing GraphQL query (unchanged)
  const {
    data: inventoryData,
    loading,
    error,
    startPolling,
    stopPolling
  } = useQuery(GET_INVENTORY_ITEMS_QUERY, {
    variables: {
      childId,
      productType: 'DIAPER',
      limit: 500
    },
    skip: !childId,
    pollInterval: 60000,
    errorPolicy: 'none',
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'cache-first',
  });

  // Calculate daily usage estimation
  const dailyUsageEstimate = useMemo(() => {
    if (!childData?.child) return 6; // Default fallback

    return estimateDailyUsage({
      childAge: childData.child.ageInMonths || 6,
      childWeight: childData.child.weight,
      actualUsageHistory: childData.child.recentUsageHistory,
      fallbackToAgeEstimate: true
    });
  }, [childData]);

  // Enhanced traffic light data processing
  const enhancedTrafficLightData = useMemo((): EnhancedTrafficLightData => {
    if (!inventoryData?.getInventoryItems?.edges) {
      return {
        critical: { count: 0, daysRemaining: null, earliestExpiryDays: null, psychologyMessage: 'Checking status', quantityContext: '(Loading...)' },
        low: { count: 0, daysRemaining: null, earliestExpiryDays: null, psychologyMessage: 'Checking status', quantityContext: '(Loading...)' },
        wellStocked: { count: 0, daysRemaining: null, averageExpiryDays: null, psychologyMessage: 'Checking status', quantityContext: '(Loading...)' },
        pending: { count: 0, estimatedDeliveryDays: null, psychologyMessage: 'Checking orders', quantityContext: '(Loading...)' }
      };
    }

    const items: InventoryItem[] = inventoryData.getInventoryItems.edges.map((edge: any) => edge.node);
    const isWeekend = [0, 6].includes(new Date().getDay()); // Sunday = 0, Saturday = 6

    const processed = items.reduce(
      (acc, item) => {
        const quantity = item.quantityRemaining || 0;

        // Critical items: 0 quantity OR ≤3 days remaining OR expired
        if (item.quantityRemaining === 0 || item.isExpired ||
           (item.daysUntilExpiry !== null && item.daysUntilExpiry !== undefined && item.daysUntilExpiry <= 3)) {
          acc.critical.items.push(item);
          acc.critical.count += quantity;
        }
        // Low stock items: 4-7 days remaining (only if quantity > 0)
        else if (item.quantityRemaining > 0 && item.daysUntilExpiry !== null &&
                item.daysUntilExpiry !== undefined && item.daysUntilExpiry >= 4 && item.daysUntilExpiry <= 7) {
          acc.low.items.push(item);
          acc.low.count += quantity;
        }
        // Well stocked items: >7 days remaining (only if quantity > 0)
        else if (item.quantityRemaining > 0 &&
                ((item.daysUntilExpiry !== null && item.daysUntilExpiry !== undefined && item.daysUntilExpiry > 7) ||
                 (item.daysUntilExpiry === null || item.daysUntilExpiry === undefined))) {
          acc.wellStocked.items.push(item);
          acc.wellStocked.count += quantity;
        }

        return acc;
      },
      {
        critical: { items: [] as InventoryItem[], count: 0 },
        low: { items: [] as InventoryItem[], count: 0 },
        wellStocked: { items: [] as InventoryItem[], count: 0 }
      }
    );

    // Calculate days remaining for each category
    const criticalDays = calculateDaysRemaining(processed.critical.items, dailyUsageEstimate);
    const lowDays = calculateDaysRemaining(processed.low.items, dailyUsageEstimate);
    const stockedDays = calculateDaysRemaining(processed.wellStocked.items, dailyUsageEstimate);

    return {
      critical: {
        count: processed.critical.count,
        daysRemaining: criticalDays,
        earliestExpiryDays: processed.critical.items.length > 0 ?
          Math.min(...processed.critical.items.map(item => item.daysUntilExpiry || 0)) : null,
        psychologyMessage: generatePsychologyMessage('critical', criticalDays, isWeekend),
        quantityContext: generateQuantityContext(processed.critical.count, 'critical')
      },
      low: {
        count: processed.low.count,
        daysRemaining: lowDays,
        earliestExpiryDays: processed.low.items.length > 0 ?
          Math.min(...processed.low.items.map(item => item.daysUntilExpiry || 0)) : null,
        psychologyMessage: generatePsychologyMessage('low', lowDays, isWeekend),
        quantityContext: generateQuantityContext(processed.low.count, 'low')
      },
      wellStocked: {
        count: processed.wellStocked.count,
        daysRemaining: stockedDays,
        averageExpiryDays: processed.wellStocked.items.length > 0 ?
          Math.round(processed.wellStocked.items.reduce((sum, item) => sum + (item.daysUntilExpiry || 0), 0) / processed.wellStocked.items.length) : null,
        psychologyMessage: generatePsychologyMessage('stocked', stockedDays, isWeekend),
        quantityContext: generateQuantityContext(processed.wellStocked.count, 'stocked')
      },
      pending: {
        count: 0, // TODO: Implement pending orders tracking
        estimatedDeliveryDays: null,
        psychologyMessage: generatePsychologyMessage('pending', null, isWeekend),
        quantityContext: generateQuantityContext(0, 'pending')
      }
    };
  }, [inventoryData, dailyUsageEstimate]);

  // Generate enhanced card data
  const enhancedCardData = useMemo((): EnhancedStatusOverviewCardProps[] => {
    return [
      {
        // Existing props
        statusType: 'critical',
        title: 'Critical Items',
        count: enhancedTrafficLightData.critical.count,
        description: enhancedTrafficLightData.critical.psychologyMessage,
        iconName: 'exclamationmark.triangle.fill',
        borderColor: NestSyncColors.trafficLight.critical,
        onPress: () => {
          router.push({
            pathname: '/(tabs)/planner',
            params: { filter: 'critical', childId: childId }
          });
        },
        testID: 'critical-items-card',

        // Enhanced props
        daysRemaining: enhancedTrafficLightData.critical.daysRemaining,
        primaryDisplayText: generatePrimaryDisplayText(
          'critical',
          enhancedTrafficLightData.critical.daysRemaining,
          enhancedTrafficLightData.critical.count
        ),
        psychologyMessage: enhancedTrafficLightData.critical.psychologyMessage,
        quantityContext: enhancedTrafficLightData.critical.quantityContext,

        // Enhanced accessibility
        detailedAccessibilityLabel: `Critical diaper inventory. ${generatePrimaryDisplayText('critical', enhancedTrafficLightData.critical.daysRemaining, enhancedTrafficLightData.critical.count)}. ${enhancedTrafficLightData.critical.psychologyMessage}. ${enhancedTrafficLightData.critical.quantityContext}.`,
        contextualAccessibilityHint: 'Tap to view diapers that need restocking soon and get shopping guidance',
        psychologyAccessibilityContent: 'This is a gentle reminder to plan your next shopping trip. You\'re handling this well.'
      },

      // Similar structure for low, stocked, and pending...
      {
        statusType: 'low',
        title: 'Low Stock',
        count: enhancedTrafficLightData.low.count,
        description: enhancedTrafficLightData.low.psychologyMessage,
        iconName: 'clock.fill',
        borderColor: NestSyncColors.trafficLight.low,
        onPress: () => {
          router.push({
            pathname: '/(tabs)/planner',
            params: { filter: 'low', childId: childId }
          });
        },
        testID: 'low-stock-card',
        daysRemaining: enhancedTrafficLightData.low.daysRemaining,
        primaryDisplayText: generatePrimaryDisplayText(
          'low',
          enhancedTrafficLightData.low.daysRemaining,
          enhancedTrafficLightData.low.count
        ),
        psychologyMessage: enhancedTrafficLightData.low.psychologyMessage,
        quantityContext: enhancedTrafficLightData.low.quantityContext,
        detailedAccessibilityLabel: `Low diaper stock. ${generatePrimaryDisplayText('low', enhancedTrafficLightData.low.daysRemaining, enhancedTrafficLightData.low.count)}. ${enhancedTrafficLightData.low.psychologyMessage}. ${enhancedTrafficLightData.low.quantityContext}.`,
        contextualAccessibilityHint: 'Tap to view diapers for planning your next shopping trip',
        psychologyAccessibilityContent: 'Perfect timing to plan ahead when it\'s convenient for you.'
      },

      {
        statusType: 'stocked',
        title: 'Well Stocked',
        count: enhancedTrafficLightData.wellStocked.count,
        description: enhancedTrafficLightData.wellStocked.psychologyMessage,
        iconName: 'checkmark.circle.fill',
        borderColor: NestSyncColors.trafficLight.stocked,
        onPress: () => {
          router.push({
            pathname: '/(tabs)/planner',
            params: { filter: 'stocked', childId: childId }
          });
        },
        testID: 'well-stocked-card',
        daysRemaining: enhancedTrafficLightData.wellStocked.daysRemaining,
        primaryDisplayText: generatePrimaryDisplayText(
          'stocked',
          enhancedTrafficLightData.wellStocked.daysRemaining,
          enhancedTrafficLightData.wellStocked.count
        ),
        psychologyMessage: enhancedTrafficLightData.wellStocked.psychologyMessage,
        quantityContext: enhancedTrafficLightData.wellStocked.quantityContext,
        detailedAccessibilityLabel: `Well stocked diapers. ${generatePrimaryDisplayText('stocked', enhancedTrafficLightData.wellStocked.daysRemaining, enhancedTrafficLightData.wellStocked.count)}. ${enhancedTrafficLightData.wellStocked.psychologyMessage}. ${enhancedTrafficLightData.wellStocked.quantityContext}.`,
        contextualAccessibilityHint: 'Tap to view your well-prepared diaper inventory',
        psychologyAccessibilityContent: 'You\'re beautifully prepared and can relax knowing your family\'s needs are taken care of.'
      },

      {
        statusType: 'pending',
        title: 'Pending Orders',
        count: enhancedTrafficLightData.pending.count,
        description: enhancedTrafficLightData.pending.psychologyMessage,
        iconName: 'shippingbox.fill',
        borderColor: NestSyncColors.trafficLight.pending,
        onPress: () => {
          router.push({
            pathname: '/(tabs)/planner',
            params: { filter: 'pending', childId: childId }
          });
        },
        testID: 'pending-orders-card',
        daysRemaining: null,
        primaryDisplayText: 'Help coming',
        psychologyMessage: enhancedTrafficLightData.pending.psychologyMessage,
        quantityContext: enhancedTrafficLightData.pending.quantityContext,
        detailedAccessibilityLabel: `Pending diaper orders. Help coming. ${enhancedTrafficLightData.pending.psychologyMessage}. ${enhancedTrafficLightData.pending.quantityContext}.`,
        contextualAccessibilityHint: 'Tap to track your incoming diaper orders',
        psychologyAccessibilityContent: 'Help is on the way! Your order will arrive soon.'
      }
    ];
  }, [enhancedTrafficLightData, childId, router]);

  return {
    cardData: enhancedCardData.map(card => ({
      ...card,
      loading,
      disabled: loading || (!!error && !inventoryData?.getInventoryItems),
    })),
    trafficLightData: enhancedTrafficLightData,
    loading,
    error: error && !inventoryData?.getInventoryItems ? error : null,
  };
}
```

## Component Updates

### Enhanced StatusOverviewCard Component

#### Updated Layout Structure
```typescript
export function StatusOverviewCard({
  // Existing props
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

  // New psychology-driven props
  daysRemaining,
  primaryDisplayText,
  psychologyMessage,
  quantityContext,
  detailedAccessibilityLabel,
  contextualAccessibilityHint,
  psychologyAccessibilityContent
}: EnhancedStatusOverviewCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Existing background color logic (unchanged)
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

  // Enhanced message color for psychology-driven messaging
  const getMessageColor = (statusType: string) => {
    if (disabled) return colors.placeholder;

    switch (statusType) {
      case 'critical': return '#DC2626';
      case 'low': return '#D97706';
      case 'stocked': return '#059669';
      case 'pending': return '#0891B2';
      default: return colors.textSecondary;
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
      accessibilityLabel={detailedAccessibilityLabel || accessibilityLabel || `${title}: ${primaryDisplayText}. ${psychologyMessage}`}
      accessibilityHint={contextualAccessibilityHint || accessibilityHint || "Tap to view detailed breakdown and planning guidance"}
      testID={testID || `status-card-${statusType}`}
      activeOpacity={0.8}
    >
      {/* Enhanced content container with new hierarchy */}
      <View style={styles.contentContainer}>
        {/* Icon - 32x32px for consistency */}
        <View style={styles.iconContainer}>
          <IconSymbol
            name={iconName}
            size={32}
            color={disabled ? colors.placeholder : colors.text}
          />
        </View>

        {/* PRIMARY: Days remaining display - 30px bold */}
        <ThemedText style={[
          styles.primaryDisplay,
          { color: disabled ? colors.placeholder : colors.textEmphasis }
        ]}>
          {loading ? '–' : primaryDisplayText}
        </ThemedText>

        {/* SECONDARY: Psychology-driven message - 13px supportive color */}
        <ThemedText style={[
          styles.psychologyMessage,
          { color: getMessageColor(statusType) }
        ]}>
          {loading ? 'Checking...' : psychologyMessage}
        </ThemedText>

        {/* TERTIARY: Quantity context - 11px muted */}
        <ThemedText style={[
          styles.quantityContext,
          { color: disabled ? colors.placeholder : colors.textMuted }
        ]}>
          {loading ? '(Loading...)' : quantityContext}
        </ThemedText>
      </View>

      {/* Loading overlay (unchanged) */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={colors.tint} />
        </View>
      )}
    </TouchableOpacity>
  );
}
```

#### Enhanced Styles
```typescript
const styles = StyleSheet.create({
  card: {
    // Existing card styles (unchanged)
    width: 160,
    height: 120,
    borderWidth: 3,
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    minWidth: 44,
    minHeight: 44,
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
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // NEW: Primary display for days remaining
  primaryDisplay: {
    fontSize: 30, // Reduced from 36px to accommodate more content
    lineHeight: 32,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.02,
    marginBottom: 2,
  },

  // NEW: Psychology-driven message
  psychologyMessage: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 1,
    paddingHorizontal: 4, // Ensure text doesn't touch edges
  },

  // NEW: Quantity context
  quantityContext: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '400',
    textAlign: 'center',
    opacity: 0.8,
    letterSpacing: 0.01,
  },

  // Existing styles
  title: {
    fontSize: 14,
    lineHeight: 16,
    fontWeight: '500',
    textAlign: 'center',
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
```

## Psychology-Driven Calculations

### Usage Pattern Detection
```typescript
/**
 * Advanced usage calculation with historical learning
 */
class UsagePatternDetector {
  static analyzeUsageHistory(history: DailyUsageRecord[]): UsageAnalysis {
    if (history.length < 3) {
      return { confidence: 'low', pattern: 'insufficient-data' };
    }

    const recentWeek = history.slice(-7);
    const weekdayUsage = recentWeek.filter(day => ![0, 6].includes(day.dayOfWeek));
    const weekendUsage = recentWeek.filter(day => [0, 6].includes(day.dayOfWeek));

    const weekdayAverage = weekdayUsage.reduce((sum, day) => sum + day.count, 0) / weekdayUsage.length;
    const weekendAverage = weekendUsage.reduce((sum, day) => sum + day.count, 0) / weekendUsage.length;

    return {
      confidence: history.length >= 14 ? 'high' : 'medium',
      weekdayAverage,
      weekendAverage,
      trend: this.detectTrend(history),
      pattern: this.detectPattern(history)
    };
  }

  static detectTrend(history: DailyUsageRecord[]): 'increasing' | 'decreasing' | 'stable' {
    if (history.length < 7) return 'stable';

    const firstHalf = history.slice(0, Math.floor(history.length / 2));
    const secondHalf = history.slice(Math.floor(history.length / 2));

    const firstAverage = firstHalf.reduce((sum, day) => sum + day.count, 0) / firstHalf.length;
    const secondAverage = secondHalf.reduce((sum, day) => sum + day.count, 0) / secondHalf.length;

    const difference = secondAverage - firstAverage;

    if (Math.abs(difference) < 0.5) return 'stable';
    return difference > 0 ? 'increasing' : 'decreasing';
  }
}
```

### Predictive Restocking Algorithm
```typescript
/**
 * Predict optimal restocking timing based on usage patterns and psychology
 */
function calculateOptimalRestockingGuidance(
  currentInventory: InventoryItem[],
  usagePattern: UsageAnalysis,
  parentPreferences: ParentPreferences
): RestockingGuidance {
  const totalDays = calculateDaysRemaining(currentInventory, usagePattern.averageDailyUsage);

  if (totalDays === null) {
    return {
      urgency: 'unknown',
      recommendedAction: 'Check inventory',
      timeframe: 'now',
      psychologyMessage: 'Let\'s check your current status'
    };
  }

  // Psychology-driven recommendations
  if (totalDays <= 1) {
    return {
      urgency: 'immediate',
      recommendedAction: 'Quick store trip',
      timeframe: 'today',
      psychologyMessage: 'Quick trip needed - you\'ve got this!'
    };
  }

  if (totalDays <= 3) {
    return {
      urgency: 'soon',
      recommendedAction: 'Add to shopping list',
      timeframe: 'this week',
      psychologyMessage: 'Time to restock soon'
    };
  }

  if (totalDays <= 7) {
    const isWeekend = [0, 6].includes(new Date().getDay());
    return {
      urgency: 'planned',
      recommendedAction: isWeekend ? 'Perfect for weekend shop' : 'Plan your next trip',
      timeframe: 'when convenient',
      psychologyMessage: isWeekend ? 'Perfect for weekend shop' : 'Plan your next trip'
    };
  }

  return {
    urgency: 'none',
    recommendedAction: 'Relax',
    timeframe: 'well prepared',
    psychologyMessage: totalDays > 14 ? 'Beautifully prepared!' : 'You\'re all set!'
  };
}
```

## Accessibility Implementation

### Screen Reader Content Generation
```typescript
/**
 * Generate comprehensive accessibility content for stressed parents
 */
function generateAccessibilityContent(
  statusType: string,
  daysRemaining: number | null,
  count: number,
  psychologyMessage: string,
  isDetailedMode: boolean = false
): AccessibilityContent {
  const baseStatus = {
    'critical': 'Critical diaper inventory',
    'low': 'Low diaper stock',
    'stocked': 'Well stocked diapers',
    'pending': 'Diaper orders pending'
  }[statusType] || 'Diaper status unknown';

  const timeContext = daysRemaining === null ? 'Status updating' :
                     daysRemaining === 0 ? 'Out today' :
                     daysRemaining === 1 ? '1 day remaining' :
                     `${daysRemaining} days remaining`;

  const quantityContext = count === 0 ? 'No diapers in stock' :
                         count === 1 ? '1 diaper in stock' :
                         `${count} diapers in stock`;

  if (isDetailedMode) {
    const supportiveContext = {
      'critical': 'This is a gentle reminder to plan your next shopping trip. You\'re handling this well.',
      'low': 'Perfect timing to plan ahead when it\'s convenient for you.',
      'stocked': 'You\'re beautifully prepared and can relax knowing your family\'s needs are taken care of.',
      'pending': 'Help is on the way! Your order will arrive soon.'
    }[statusType] || '';

    return {
      label: `${baseStatus}. ${timeContext}. ${quantityContext}. ${psychologyMessage}. ${supportiveContext}`,
      hint: `Tap to view detailed ${statusType === 'pending' ? 'order tracking' : 'inventory breakdown'} and ${statusType === 'stocked' ? 'management options' : 'shopping guidance'}`,
      announcement: `Diaper status updated: ${baseStatus}. ${timeContext}. ${psychologyMessage}.`
    };
  }

  return {
    label: `${baseStatus}. ${timeContext}. ${psychologyMessage}. ${quantityContext}.`,
    hint: `Tap for details and guidance`,
    announcement: `${baseStatus}: ${psychologyMessage}`
  };
}
```

### Voice Interface Integration
```typescript
/**
 * Voice command handling for hands-free operation
 */
class VoiceInterfaceHandler {
  static handleStatusQuery(trafficLightData: EnhancedTrafficLightData): string {
    const statusPriority = this.determineOverallStatus(trafficLightData);

    switch (statusPriority) {
      case 'critical':
        const criticalDays = trafficLightData.critical.daysRemaining;
        return `Your diaper status needs attention. You have ${criticalDays ? `${criticalDays} days` : 'limited time'} remaining. ${trafficLightData.critical.psychologyMessage}. Would you like me to add diapers to your shopping list?`;

      case 'low':
        const lowDays = trafficLightData.low.daysRemaining;
        return `Your diaper stock is getting low. You have ${lowDays ? `${lowDays} days` : 'several days'} remaining. ${trafficLightData.low.psychologyMessage}. Perfect time to plan your next shopping trip.`;

      case 'stocked':
        const stockedDays = trafficLightData.wellStocked.daysRemaining;
        return `Great news! You're well stocked with ${stockedDays ? `${stockedDays} days` : 'plenty'} of diapers remaining. ${trafficLightData.wellStocked.psychologyMessage}.`;

      case 'pending':
        return `You have diaper orders on the way. ${trafficLightData.pending.psychologyMessage}. Help is coming!`;

      default:
        return 'I\'m checking your diaper status. Please give me a moment to get the latest information.';
    }
  }

  static handleShoppingListIntegration(item: string): string {
    return `I've added ${item} to your shopping list. You're being proactive about your family's needs - that's great planning!`;
  }

  static handleAnxietyQuery(): string {
    return `Let me check your current diaper situation... Based on your inventory, you're doing well. Take a deep breath - you've got this handled. Would you like me to go through your current status?`;
  }
}
```

## Testing Requirements

### Unit Testing
```typescript
describe('Psychology-Driven Traffic Light System', () => {
  describe('Days Remaining Calculation', () => {
    it('should calculate days based on expiry when available', () => {
      const items = [
        { quantityRemaining: 20, daysUntilExpiry: 5 },
        { quantityRemaining: 30, daysUntilExpiry: 8 }
      ];
      const result = calculateDaysRemaining(items, 6);
      expect(result).toBe(5); // Should use earliest expiry
    });

    it('should calculate days based on consumption when no expiry', () => {
      const items = [
        { quantityRemaining: 30, daysUntilExpiry: null }
      ];
      const result = calculateDaysRemaining(items, 6);
      expect(result).toBe(5); // 30 diapers / 6 per day = 5 days
    });

    it('should handle zero quantities appropriately', () => {
      const items = [
        { quantityRemaining: 0, daysUntilExpiry: 5 }
      ];
      const result = calculateDaysRemaining(items, 6);
      expect(result).toBeNull();
    });
  });

  describe('Psychology Message Generation', () => {
    it('should generate supportive critical messages', () => {
      const message = generatePsychologyMessage('critical', 2, false);
      expect(message).toBe('Time to restock soon');
      expect(message).not.toContain('URGENT');
      expect(message).not.toContain('EMERGENCY');
    });

    it('should adapt messages for weekend context', () => {
      const weekendMessage = generatePsychologyMessage('low', 6, true);
      expect(weekendMessage).toBe('Perfect for weekend shop');
    });

    it('should build confidence for well-stocked status', () => {
      const message = generatePsychologyMessage('stocked', 15, false);
      expect(message).toBe('Beautifully prepared!');
    });
  });

  describe('Accessibility Content', () => {
    it('should generate comprehensive screen reader content', () => {
      const content = generateAccessibilityContent('critical', 3, 24, 'Time to restock soon', true);
      expect(content.label).toContain('Critical diaper inventory');
      expect(content.label).toContain('3 days remaining');
      expect(content.label).toContain('24 diapers in stock');
      expect(content.label).toContain('gentle reminder');
    });

    it('should provide supportive context for stressed parents', () => {
      const content = generateAccessibilityContent('critical', 1, 8, 'Quick trip needed', true);
      expect(content.label).toContain('You\'re handling this well');
    });
  });
});
```

### Integration Testing
```typescript
describe('Enhanced useInventoryTrafficLight Hook', () => {
  it('should process inventory data into psychology-driven format', async () => {
    const mockInventoryData = {
      getInventoryItems: {
        edges: [
          {
            node: {
              id: '1',
              quantityRemaining: 24,
              daysUntilExpiry: 3,
              isExpired: false,
              productType: 'DIAPER'
            }
          }
        ]
      }
    };

    const { result } = renderHook(() => useInventoryTrafficLight('child-123'), {
      wrapper: createApolloWrapper(mockInventoryData)
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const criticalCard = result.current.cardData.find(card => card.statusType === 'critical');
    expect(criticalCard?.primaryDisplayText).toBe('3 days left');
    expect(criticalCard?.psychologyMessage).toBe('Time to restock soon');
    expect(criticalCard?.quantityContext).toBe('(24 diapers remaining)');
  });
});
```

### Accessibility Testing
```typescript
describe('Accessibility Compliance', () => {
  it('should meet WCAG AAA contrast requirements', () => {
    const { getByTestId } = render(<StatusOverviewCard {...mockCriticalProps} />);
    const card = getByTestId('critical-items-card');

    // Test contrast ratios
    expect(getContrastRatio(card, 'background', 'border')).toBeGreaterThanOrEqual(7);
    expect(getContrastRatio(card, 'primaryText', 'background')).toBeGreaterThanOrEqual(7);
  });

  it('should provide comprehensive screen reader content', () => {
    const { getByLabelText } = render(<StatusOverviewCard {...mockCriticalProps} />);
    const card = getByLabelText(/Critical diaper inventory/);

    expect(card.accessibilityLabel).toContain('3 days remaining');
    expect(card.accessibilityLabel).toContain('Time to restock soon');
    expect(card.accessibilityLabel).toContain('handling this well');
  });
});
```

## Performance Considerations

### Optimization Strategies
```typescript
/**
 * Memoization for expensive calculations
 */
const memoizedCalculations = useMemo(() => {
  return {
    dailyUsage: estimateDailyUsage(usageParams),
    daysRemaining: calculateDaysRemaining(inventoryItems, dailyUsage),
    psychologyMessages: generateAllPsychologyMessages(status, context)
  };
}, [inventoryItems, childAge, usageHistory, isWeekend]);

/**
 * Debounced updates for real-time data
 */
const debouncedInventoryUpdate = useCallback(
  debounce((newData) => {
    updateTrafficLightData(newData);
  }, 300),
  []
);

/**
 * Lazy loading for accessibility content
 */
const accessibilityContent = useMemo(() => {
  if (!isScreenReaderEnabled) return null;
  return generateDetailedAccessibilityContent(trafficLightData);
}, [trafficLightData, isScreenReaderEnabled]);
```

### Bundle Size Considerations
- Lazy load psychology message variations
- Code split accessibility features
- Optimize calculation algorithms
- Cache usage patterns locally

## Implementation Timeline

### Phase 1: Core Data Structure (Week 1)
- [ ] Extend TrafficLightData interface
- [ ] Implement days remaining calculations
- [ ] Add usage estimation logic
- [ ] Unit test all calculation functions

### Phase 2: Visual Hierarchy (Week 2)
- [ ] Update StatusOverviewCard component
- [ ] Implement new typography hierarchy
- [ ] Add psychology-driven styling
- [ ] Test responsive behavior

### Phase 3: Psychology Integration (Week 3)
- [ ] Implement message generation system
- [ ] Add Canadian cultural context
- [ ] Integrate supportive language patterns
- [ ] Test stress-reduction effectiveness

### Phase 4: Accessibility & Polish (Week 4)
- [ ] Implement enhanced screen reader content
- [ ] Add voice interface integration
- [ ] Complete accessibility testing
- [ ] Performance optimization and final testing

## Quality Assurance

### Code Review Checklist
- [ ] Psychology-driven calculations are accurate and meaningful
- [ ] Visual hierarchy prioritizes days over quantities
- [ ] Accessibility content is comprehensive and supportive
- [ ] Canadian cultural context is respectful and appropriate
- [ ] Performance impact is minimal and acceptable
- [ ] Error handling covers all edge cases
- [ ] Testing coverage is comprehensive

### User Experience Validation
- [ ] Parents understand their status within 2 seconds
- [ ] Messaging reduces stress rather than creates anxiety
- [ ] Action guidance is clear and helpful
- [ ] Accessibility features support stressed parent scenarios
- [ ] Cross-platform behavior is consistent

## Last Updated

2025-01-22 - Complete developer implementation guide with enhanced calculations, visual hierarchy updates, and comprehensive accessibility features for psychology-driven traffic light inventory system