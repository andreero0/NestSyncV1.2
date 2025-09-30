/**
 * Skeleton Loading Components
 * Provides skeleton placeholders instead of infinite spinners
 * for better user experience and perceived performance
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

// Base skeleton component with shimmer animation
export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style
}) => {
  const { colors } = useTheme();
  const shimmerAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmer = () => {
      Animated.sequence([
        Animated.timing(shimmerAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnimation, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => shimmer());
    };

    shimmer();
  }, [shimmerAnimation]);

  const shimmerOpacity = shimmerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.border,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: colors.background,
            opacity: shimmerOpacity,
          },
        ]}
      />
    </View>
  );
};

// Skeleton for subscription options loading
export const SubscriptionOptionsSkeleton: React.FC = () => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Skeleton width="60%" height={24} borderRadius={6} />
        <Skeleton width="40%" height={16} style={{ marginTop: 8 }} />
      </View>

      {/* Plan cards skeleton */}
      {[1, 2, 3].map((index) => (
        <View
          key={index}
          style={[
            styles.planCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.planHeader}>
            <Skeleton width="50%" height={20} />
            <Skeleton width="30%" height={28} borderRadius={14} />
          </View>
          <Skeleton width="80%" height={14} style={{ marginTop: 8 }} />
          <Skeleton width="60%" height={14} style={{ marginTop: 4 }} />

          {/* Features list skeleton */}
          <View style={styles.featuresList}>
            {[1, 2, 3].map((featureIndex) => (
              <View key={featureIndex} style={styles.featureItem}>
                <Skeleton width={12} height={12} borderRadius={6} />
                <Skeleton width="70%" height={14} style={{ marginLeft: 8 }} />
              </View>
            ))}
          </View>

          <Skeleton width="100%" height={44} borderRadius={8} style={{ marginTop: 16 }} />
        </View>
      ))}
    </View>
  );
};

// Skeleton for reorder suggestions loading
export const ReorderSuggestionsSkeleton: React.FC = () => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Skeleton width="70%" height={24} borderRadius={6} />
        <Skeleton width="50%" height={16} style={{ marginTop: 8 }} />
      </View>

      {/* Suggestion cards skeleton */}
      {[1, 2, 3].map((index) => (
        <View
          key={index}
          style={[
            styles.suggestionCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.suggestionHeader}>
            <Skeleton width={60} height={60} borderRadius={8} />
            <View style={styles.suggestionInfo}>
              <Skeleton width="80%" height={18} />
              <Skeleton width="60%" height={14} style={{ marginTop: 4 }} />
              <Skeleton width="40%" height={12} style={{ marginTop: 4 }} />
            </View>
          </View>

          <View style={styles.suggestionDetails}>
            <View style={styles.detailRow}>
              <Skeleton width="30%" height={14} />
              <Skeleton width="20%" height={14} />
            </View>
            <View style={styles.detailRow}>
              <Skeleton width="40%" height={14} />
              <Skeleton width="25%" height={14} />
            </View>
          </View>

          <View style={styles.suggestionActions}>
            <Skeleton width="45%" height={36} borderRadius={6} />
            <Skeleton width="45%" height={36} borderRadius={6} />
          </View>
        </View>
      ))}
    </View>
  );
};

// Skeleton for inventory traffic light cards
export const InventoryCardsSkeleton: React.FC = () => {
  const { colors } = useTheme();

  return (
    <View style={styles.cardsGrid}>
      {[1, 2, 3, 4].map((index) => (
        <View
          key={index}
          style={[
            styles.inventoryCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <Skeleton width={32} height={32} borderRadius={16} />
          <Skeleton width="60%" height={16} style={{ marginTop: 8 }} />
          <Skeleton width="40%" height={24} style={{ marginTop: 4 }} />
          <Skeleton width="80%" height={12} style={{ marginTop: 4 }} />
        </View>
      ))}
    </View>
  );
};

// Generic list skeleton
interface ListSkeletonProps {
  itemCount?: number;
  itemHeight?: number;
}

export const ListSkeleton: React.FC<ListSkeletonProps> = ({
  itemCount = 5,
  itemHeight = 60,
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {Array.from({ length: itemCount }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.listItem,
            {
              height: itemHeight,
              backgroundColor: colors.card,
              borderColor: colors.border,
              marginBottom: 8,
            },
          ]}
        >
          <Skeleton width={40} height={40} borderRadius={20} />
          <View style={styles.listItemContent}>
            <Skeleton width="70%" height={16} />
            <Skeleton width="50%" height={12} style={{ marginTop: 4 }} />
          </View>
          <Skeleton width={20} height={20} borderRadius={10} />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  planCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featuresList: {
    marginTop: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  suggestionCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  suggestionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  suggestionDetails: {
    marginTop: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  suggestionActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 16,
  },
  inventoryCard: {
    width: '48%',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  listItemContent: {
    flex: 1,
    marginLeft: 12,
  },
});

export default {
  Skeleton,
  SubscriptionOptionsSkeleton,
  ReorderSuggestionsSkeleton,
  InventoryCardsSkeleton,
  ListSkeleton,
};