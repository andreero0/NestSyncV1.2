/**
 * ReorderSuggestionsContainer Component
 * Main container for ML-powered reorder suggestions with premium gating
 * Canadian pricing, PIPEDA compliance, and psychology-driven UX
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';

import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import { IconSymbol } from '../ui/IconSymbol';
import { NestSyncButton } from '../ui/NestSyncButton';
import { PremiumFeatureGate } from './PremiumFeatureGate';
import { ReorderSuggestionCard } from './ReorderSuggestionCard';
import { EducationalEmptyState } from './EducationalEmptyState';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Colors, NestSyncColors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import {
  useReorderStore,
  useReorderSuggestions,
  usePremiumSubscription,
  type ReorderSuggestion,
} from '@/stores/reorderStore';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export interface ReorderSuggestionsContainerProps {
  childId: string;
  initialFilter?: 'all' | 'critical' | 'low' | 'pending';
  context?: 'home' | 'planner' | 'fab';
  onUpgradeRequired: () => void;
  compact?: boolean;
  limit?: number;
  showPagination?: boolean;
  footer?: React.ReactNode;
  onLogDiaperChange?: () => void;
  onLearnMore?: () => void;
}

type FilterType = 'all' | 'critical' | 'low' | 'pending';

interface FilterOption {
  key: FilterType;
  label: string;
  icon: string;
  color: string;
  description: string;
}

// =============================================================================
// FILTER CONFIGURATIONS
// =============================================================================

const FILTER_OPTIONS: FilterOption[] = [
  {
    key: 'all',
    label: 'All',
    icon: 'list.bullet',
    color: NestSyncColors.primary.blue,
    description: 'Show all suggestions',
  },
  {
    key: 'critical',
    label: 'Critical',
    icon: 'exclamationmark.triangle.fill',
    color: NestSyncColors.trafficLight.critical,
    description: 'Running out in 3 days or less',
  },
  {
    key: 'low',
    label: 'Low Stock',
    icon: 'clock',
    color: NestSyncColors.trafficLight.low,
    description: 'Running out in 7 days or less',
  },
  {
    key: 'pending',
    label: 'Planned',
    icon: 'calendar',
    color: NestSyncColors.trafficLight.stocked,
    description: 'Planned for future ordering',
  },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const getUrgencyLevel = (predictedRunOutDate: string): 'critical' | 'moderate' | 'low' => {
  try {
    const date = new Date(predictedRunOutDate);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 3) return 'critical';
    if (diffDays <= 7) return 'moderate';
    return 'low';
  } catch {
    return 'moderate';
  }
};

const filterSuggestionsByType = (
  suggestions: ReorderSuggestion[],
  filter: FilterType
): ReorderSuggestion[] => {
  switch (filter) {
    case 'critical':
      return suggestions.filter(s => getUrgencyLevel(s.predictedRunOutDate) === 'critical');
    case 'low':
      return suggestions.filter(s => {
        const urgency = getUrgencyLevel(s.predictedRunOutDate);
        return urgency === 'critical' || urgency === 'moderate';
      });
    case 'pending':
      return suggestions.filter(s => getUrgencyLevel(s.predictedRunOutDate) === 'low');
    case 'all':
    default:
      return suggestions;
  }
};

// =============================================================================
// SKELETON LOADING COMPONENT
// =============================================================================

const SuggestionCardSkeleton = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const shimmerValue = useSharedValue(0);

  useEffect(() => {
    shimmerValue.value = withSequence(
      withTiming(1, { duration: 1000 }),
      withTiming(0, { duration: 1000 })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.3 + (shimmerValue.value * 0.4),
  }));

  return (
    <Animated.View style={[styles.skeletonCard, { backgroundColor: colors.cardBackground }]}>
      <Animated.View style={[styles.skeletonBanner, animatedStyle]} />
      <View style={styles.skeletonContent}>
        <Animated.View style={[styles.skeletonTitle, animatedStyle]} />
        <Animated.View style={[styles.skeletonSubtitle, animatedStyle]} />
        <View style={styles.skeletonInsights}>
          <Animated.View style={[styles.skeletonInsight, animatedStyle]} />
          <Animated.View style={[styles.skeletonInsight, animatedStyle]} />
        </View>
        <Animated.View style={[styles.skeletonPrice, animatedStyle]} />
        <View style={styles.skeletonActions}>
          <Animated.View style={[styles.skeletonButton, animatedStyle]} />
          <Animated.View style={[styles.skeletonButtonSmall, animatedStyle]} />
        </View>
      </View>
    </Animated.View>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ReorderSuggestionsContainer({
  childId,
  initialFilter = 'all',
  context = 'home',
  onUpgradeRequired,
  compact = false,
  limit,
  showPagination = true,
  footer,
  onLogDiaperChange,
  onLearnMore,
}: ReorderSuggestionsContainerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // State
  const [activeFilter, setActiveFilter] = useState<FilterType>(initialFilter);
  const [refreshing, setRefreshing] = useState(false);

  // Store hooks
  const { suggestions, isLoading, error, loadSuggestions } = useReorderSuggestions();
  const { isPremium, loadStatus } = usePremiumSubscription();
  const store = useReorderStore();

  // Load suggestions on mount using store (with 8-second timeout protection)
  useEffect(() => {
    loadSuggestions(childId);
  }, [childId, loadSuggestions]);

  // Load subscription status on mount
  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  // Filter suggestions based on active filter
  const filteredSuggestions = useMemo(() => {
    return filterSuggestionsByType(suggestions, activeFilter);
  }, [suggestions, activeFilter]);

  // Premium gating logic
  const shouldShowPremiumGate = useMemo(() => {
    if (isPremium) return false;
    return suggestions.length > 3;
  }, [isPremium, suggestions]);

  const displayedSuggestions = useMemo(() => {
    if (compact && limit) {
      return filteredSuggestions.slice(0, limit);
    }
    if (isPremium) {
      return filteredSuggestions;
    }
    // Free users see maximum 3 suggestions
    return filteredSuggestions.slice(0, 3);
  }, [isPremium, filteredSuggestions, compact, limit]);

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadSuggestions(childId),
        loadStatus(),
      ]);
    } catch (error) {
      console.error('Failed to refresh suggestions:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
  };

  const handleSuggestionReorder = (suggestion: ReorderSuggestion) => {
    // Navigate to order confirmation screen
    // This would typically use navigation from parent component
    console.log('Reorder suggestion:', suggestion.id);
  };

  const handleSuggestionCompare = (suggestion: ReorderSuggestion) => {
    // Navigate to retailer comparison screen
    console.log('Compare prices for:', suggestion.id);
  };

  const handleSuggestionDismiss = (suggestionId: string) => {
    // Remove suggestion from list
    store.suggestions = suggestions.filter(s => s.id !== suggestionId);
  };

  const handleRetry = () => {
    store.clearError();
    handleRefresh();
  };

  // =============================================================================
  // LOADING STATE
  // =============================================================================

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <ThemedText type="subtitle" style={[styles.title, { color: colors.text }]}>
            Smart Reorder Suggestions
          </ThemedText>
          <View style={styles.mlBadge}>
            <IconSymbol name="brain.head.profile" size={16} color={NestSyncColors.accent.purple} />
            <ThemedText style={[styles.mlText, { color: NestSyncColors.accent.purple }]}>
              ML-Powered
            </ThemedText>
          </View>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
        >
          <SuggestionCardSkeleton />
          <SuggestionCardSkeleton />
          <SuggestionCardSkeleton />
        </ScrollView>
      </ThemedView>
    );
  }

  // =============================================================================
  // ERROR STATE
  // =============================================================================

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.errorContainer}>
          <IconSymbol
            name="exclamationmark.triangle"
            size={48}
            color={NestSyncColors.semantic.error}
          />
          <ThemedText type="defaultSemiBold" style={[styles.errorTitle, { color: colors.text }]}>
            Unable to Load Suggestions
          </ThemedText>
          <ThemedText style={[styles.errorMessage, { color: colors.textSecondary }]}>
            {error || 'Please check your connection and try again.'}
          </ThemedText>
          <NestSyncButton
            title="Try Again"
            onPress={handleRetry}
            variant="primary"
            size="medium"
            style={styles.retryButton}
          />
        </View>
      </ThemedView>
    );
  }

  // =============================================================================
  // EMPTY STATE - Enhanced Educational Experience
  // =============================================================================

  const allSuggestions = suggestions;

  if (allSuggestions.length === 0) {
    // Simulate progressive enhancement data (in real implementation, this would come from usage analytics)
    const daysOfData = 0; // Could be calculated from actual usage data
    const hasUsageData = false; // Could check if user has logged any diaper changes
    const confidenceLevel = 0; // Could be calculated from ML model confidence

    // Default handlers for educational actions
    const handleLogDiaperChange = onLogDiaperChange || (() => {
      console.log('Navigate to diaper logging screen');
      // In real implementation: router.push('/(tabs)/index') or similar
    });

    const handleLearnMore = onLearnMore || (() => {
      console.log('Show ML learning modal or help screen');
      // In real implementation: show modal with detailed explanation
    });

    const handleTryDemo = () => {
      console.log('Enable demo mode with interactive examples');
      // Demo mode is handled within EducationalEmptyState component
    };

    return (
      <ThemedView style={styles.container}>
        {/* Header - Keep for consistency when not in compact mode */}
        {!compact && (
          <View style={styles.header}>
            <ThemedText type="subtitle" style={[styles.title, { color: colors.text }]}>
              Smart Reorder Suggestions
            </ThemedText>
            <View style={styles.mlBadge}>
              <IconSymbol name="brain.head.profile" size={16} color={NestSyncColors.accent.purple} />
              <ThemedText style={[styles.mlText, { color: NestSyncColors.accent.purple }]}>
                ML-Powered
              </ThemedText>
            </View>
          </View>
        )}

        {/* Enhanced Educational Empty State */}
        <EducationalEmptyState
          childId={childId}
          daysOfData={daysOfData}
          hasUsageData={hasUsageData}
          confidenceLevel={confidenceLevel}
          onLogDiaperChange={handleLogDiaperChange}
          onLearnMore={handleLearnMore}
          onTryDemo={handleTryDemo}
          onRefresh={handleRefresh}
        />
      </ThemedView>
    );
  }

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  return (
    <ThemedView style={styles.container}>
      {/* Header - Hide in compact mode */}
      {!compact && (
        <View style={styles.header}>
          <View style={styles.headerTitleContainer}>
            <ThemedText type="subtitle" style={[styles.title, { color: colors.text }]}>
              Smart Reorder Suggestions
            </ThemedText>
            <View style={styles.mlBadge}>
              <IconSymbol name="brain.head.profile" size={16} color={NestSyncColors.accent.purple} />
              <ThemedText style={[styles.mlText, { color: NestSyncColors.accent.purple }]}>
                ML-Powered
              </ThemedText>
            </View>
          </View>

          {/* Suggestion Count */}
          <View style={styles.countBadge}>
            <ThemedText style={[styles.countText, { color: colors.textSecondary }]}>
              {displayedSuggestions.length} suggestion{displayedSuggestions.length !== 1 ? 's' : ''}
              {!isPremium && allSuggestions.length > 3 && (
                <ThemedText style={{ color: NestSyncColors.accent.purple }}>
                  {' '}• {allSuggestions.length - 3} more with Premium
                </ThemedText>
              )}
            </ThemedText>
          </View>
        </View>
      )}

      {/* Filter Tabs - Hide in compact mode */}
      {!compact && (
        <View style={styles.filterContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {FILTER_OPTIONS.map((filter) => {
              const isActive = activeFilter === filter.key;
              const filterCount = filterSuggestionsByType(allSuggestions, filter.key).length;

              return (
                <Animated.View
                  key={filter.key}
                  entering={FadeIn.delay(100)}
                >
                  <NestSyncButton
                    title={`${filter.label} (${filterCount})`}
                    onPress={() => handleFilterChange(filter.key)}
                    variant={isActive ? 'primary' : 'outline'}
                    size="small"
                    style={[
                      styles.filterButton,
                      isActive && { backgroundColor: filter.color },
                    ]}
                    textStyle={[
                      styles.filterButtonText,
                      isActive && { color: '#FFFFFF' },
                    ]}
                  />
                </Animated.View>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Suggestions List */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          !compact ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.tint}
              colors={[colors.tint]}
            />
          ) : undefined
        }
      >
        {/* Display suggestions */}
        {displayedSuggestions.map((suggestion, index) => (
          <Animated.View
            key={suggestion.id}
            entering={FadeIn.delay(index * 100)}
            exiting={FadeOut}
          >
            <ReorderSuggestionCard
              suggestion={suggestion}
              onPressReorder={handleSuggestionReorder}
              onPressCompare={handleSuggestionCompare}
              onDismiss={handleSuggestionDismiss}
              testID={`suggestion-card-${index}`}
            />
          </Animated.View>
        ))}

        {/* Premium Feature Gate */}
        {shouldShowPremiumGate && (
          <Animated.View entering={FadeIn.delay(displayedSuggestions.length * 100)}>
            <PremiumFeatureGate
              feature="reorder"
              onUpgrade={onUpgradeRequired}
            />
          </Animated.View>
        )}

        {/* Custom Footer or Canadian Compliance Footer */}
        {footer ? (
          footer
        ) : !compact && (
          <View style={[styles.complianceFooter, { borderTopColor: colors.border }]}>
            <IconSymbol name="shield.checkmark" size={14} color={NestSyncColors.canadian.trust} />
            <ThemedText style={[styles.complianceText, { color: colors.textSecondary }]}>
              🇨🇦 ML predictions use PIPEDA-compliant data processing •
              Data stored in Canada • Updated every 6 hours
            </ThemedText>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
  },
  mlBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: NestSyncColors.accent.purple + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  mlText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  countBadge: {
    paddingVertical: 4,
  },
  countText: {
    fontSize: 14,
    fontWeight: '500',
  },

  // Filter Tabs
  filterContainer: {
    marginBottom: 16,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterButton: {
    minWidth: 80,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Content
  content: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 90 : 16,
  },

  // Loading Skeletons
  skeletonCard: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.1)',
  },
  skeletonBanner: {
    height: 40,
    backgroundColor: '#E5E5E5',
  },
  skeletonContent: {
    padding: 16,
    gap: 12,
  },
  skeletonTitle: {
    height: 20,
    backgroundColor: '#E5E5E5',
    borderRadius: 4,
    width: '70%',
  },
  skeletonSubtitle: {
    height: 16,
    backgroundColor: '#E5E5E5',
    borderRadius: 4,
    width: '50%',
  },
  skeletonInsights: {
    gap: 8,
  },
  skeletonInsight: {
    height: 14,
    backgroundColor: '#E5E5E5',
    borderRadius: 4,
    width: '60%',
  },
  skeletonPrice: {
    height: 24,
    backgroundColor: '#E5E5E5',
    borderRadius: 4,
    width: '40%',
  },
  skeletonActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  skeletonButton: {
    flex: 2,
    height: 40,
    backgroundColor: '#E5E5E5',
    borderRadius: 8,
  },
  skeletonButtonSmall: {
    flex: 1,
    height: 40,
    backgroundColor: '#E5E5E5',
    borderRadius: 8,
  },

  // Error State
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    minWidth: 120,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
  refreshButton: {
    minWidth: 120,
  },

  // Compliance Footer
  complianceFooter: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 24,
    paddingBottom: 16,
    marginTop: 16,
    borderTopWidth: 1,
    gap: 8,
  },
  complianceText: {
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
  },
});

export default ReorderSuggestionsContainer;