/**
 * ReorderSuggestionCard Component
 * ML-powered reorder suggestion display with Canadian pricing and PIPEDA compliance
 * Designed for psychology-driven UX patterns to reduce stress for tired parents
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  AccessibilityInfo,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import { IconSymbol } from '../ui/IconSymbol';
import { NestSyncButton } from '../ui/NestSyncButton';
import { NestSyncCard } from '../ui/NestSyncCard';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Colors, NestSyncColors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useReorderStore } from '@/stores/reorderStore';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export interface ReorderSuggestion {
  id: string;
  childId: string;
  productId: string;
  product: {
    id: string;
    name: string;
    brand: string;
    size: string;
    category: string;
    image: string;
    description?: string;
    features?: string[];
  };
  predictedRunOutDate: string;
  confidence: number;
  priority: number;
  suggestedQuantity: number;
  currentInventoryLevel: number;
  usagePattern: {
    averageDailyUsage: number;
    weeklyTrend: number;
    seasonalFactors: number[];
  };
  estimatedCostSavings: {
    amount: number;
    currency: string;
    comparedToRegularPrice: number;
    comparedToLastPurchase: number;
  };
  availableRetailers: Array<{
    id: string;
    name: string;
    logo: string;
    price: {
      amount: number;
      currency: string;
      originalPrice?: number;
      discountPercentage?: number;
      taxes: {
        gst: number;
        pst: number;
        hst: number;
        total: number;
      };
      finalAmount: number;
    };
    deliveryTime: number;
    inStock: boolean;
    rating: number;
    freeShipping: boolean;
    affiliateDisclosure?: string;
  }>;
  createdAt: string;
  updatedAt: string;
  mlProcessingConsent: boolean;
  dataRetentionDays: number;
}

interface ReorderSuggestionCardProps {
  suggestion: ReorderSuggestion;
  onPressReorder?: (suggestion: ReorderSuggestion) => void;
  onPressCompare?: (suggestion: ReorderSuggestion) => void;
  onDismiss?: (suggestionId: string) => void;
  loading?: boolean;
  testID?: string;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const formatCADPrice = (amount: number, currency: string = 'CAD'): string => {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

const formatRunOutDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return 'Now';
    } else if (diffDays === 1) {
      return 'Tomorrow';
    } else if (diffDays <= 7) {
      return `${diffDays} days`;
    } else {
      return date.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
    }
  } catch {
    return 'Soon';
  }
};

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

const getConfidenceColor = (confidence: number): string => {
  if (confidence >= 85) return NestSyncColors.semantic.success;
  if (confidence >= 70) return NestSyncColors.semantic.warning;
  return NestSyncColors.accent.amber;
};

// =============================================================================
// REORDER SUGGESTION CARD COMPONENT
// =============================================================================

export function ReorderSuggestionCard({
  suggestion,
  onPressReorder,
  onPressCompare,
  onDismiss,
  loading = false,
  testID,
}: ReorderSuggestionCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const store = useReorderStore();
  // Mock isPreorderingItem function for testing (can be replaced with actual implementation)
  const isPreorderingItem = (id: string) => store.isCreatingOrder;

  // Animation states
  const scale = useSharedValue(1);
  const dismissX = useSharedValue(0);
  const [isDismissed, setIsDismissed] = useState(false);

  // Psychology-driven spring configuration for stress reduction
  const springConfig = {
    damping: 15,
    stiffness: 120,
    mass: 1,
  };

  // Calculate urgency and styling
  const urgencyLevel = getUrgencyLevel(suggestion.predictedRunOutDate);
  const bestRetailer = suggestion.availableRetailers?.reduce((best, current) =>
    current.price.finalAmount < best.price.finalAmount ? current : best
  );

  const urgencyColors = {
    critical: {
      background: NestSyncColors.trafficLight.critical,
      text: '#FFFFFF',
      border: NestSyncColors.trafficLight.critical,
    },
    moderate: {
      background: NestSyncColors.trafficLight.low,
      text: '#FFFFFF',
      border: NestSyncColors.trafficLight.low,
    },
    low: {
      background: NestSyncColors.trafficLight.stocked,
      text: '#FFFFFF',
      border: NestSyncColors.trafficLight.stocked,
    },
  };

  // =============================================================================
  // ANIMATION HANDLERS
  // =============================================================================

  const handlePressIn = () => {
    scale.value = withSpring(0.98, springConfig);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springConfig);
  };

  const handleDismiss = () => {
    if (isDismissed || loading) return;

    dismissX.value = withSequence(
      withSpring(-20, springConfig),
      withSpring(350, springConfig, () => {
        runOnJS(setIsDismissed)(true);
        if (onDismiss) {
          runOnJS(onDismiss)(suggestion.id);
        }
      })
    );
  };

  const handleReorder = () => {
    if (loading || !onPressReorder) return;

    // Haptic feedback for action confirmation
    scale.value = withSequence(
      withSpring(0.96, springConfig),
      withSpring(1.02, springConfig),
      withSpring(1, springConfig)
    );

    onPressReorder(suggestion);
  };

  const handleCompare = () => {
    if (!onPressCompare) return;
    onPressCompare(suggestion);
  };

  // =============================================================================
  // ANIMATED STYLES
  // =============================================================================

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: dismissX.value },
    ],
  }));

  const animatedOpacity = useAnimatedStyle(() => ({
    opacity: isDismissed ? 0 : 1,
  }));

  // =============================================================================
  // LOADING STATE
  // =============================================================================

  if (loading) {
    return (
      <NestSyncCard variant="elevated" style={styles.card} testID={testID}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <ThemedText style={[styles.loadingText, { color: colors.textSecondary }]}>
            Analyzing usage patterns...
          </ThemedText>
        </View>
      </NestSyncCard>
    );
  }

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  if (isDismissed) {
    return null;
  }

  return (
    <Animated.View style={[animatedCardStyle, animatedOpacity]}>
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={`Reorder suggestion for ${suggestion.product.name}, ${suggestion.product.size}`}
        accessibilityHint="Double tap to view reorder options"
      >
        <NestSyncCard variant="elevated" style={styles.card}>
          {/* Urgency Banner */}
          <View style={[styles.urgencyBanner, { backgroundColor: urgencyColors[urgencyLevel].background }]}>
            <IconSymbol
              name={urgencyLevel === 'critical' ? 'clock.fill' : urgencyLevel === 'moderate' ? 'clock' : 'checkmark.circle'}
              size={16}
              color={urgencyColors[urgencyLevel].text}
            />
            <ThemedText style={[styles.urgencyText, { color: urgencyColors[urgencyLevel].text }]}>
              {urgencyLevel === 'critical' ? 'LOW STOCK' : urgencyLevel === 'moderate' ? 'RUNNING LOW' : 'WELL STOCKED'}
            </ThemedText>
            <TouchableOpacity
              onPress={handleDismiss}
              style={styles.dismissButton}
              accessibilityRole="button"
              accessibilityLabel="Dismiss suggestion"
            >
              <IconSymbol name="xmark" size={16} color={urgencyColors[urgencyLevel].text} />
            </TouchableOpacity>
          </View>

          {/* Product Information */}
          <View style={styles.productSection}>
            <View style={styles.productHeader}>
              <View style={styles.productInfo}>
                <ThemedText type="defaultSemiBold" style={[styles.productName, { color: colors.text }]}>
                  {suggestion.product.brand} {suggestion.product.name}
                </ThemedText>
                <ThemedText style={[styles.productSize, { color: colors.textSecondary }]}>
                  Size {suggestion.product.size} • {suggestion.suggestedQuantity} pack
                </ThemedText>
              </View>

              <View style={styles.predictionBadge}>
                <IconSymbol name="brain.head.profile" size={16} color={NestSyncColors.accent.purple} />
                <ThemedText style={[styles.predictionText, { color: NestSyncColors.accent.purple }]}>
                  ML
                </ThemedText>
              </View>
            </View>

            {/* Usage Pattern Insights */}
            <View style={styles.insightsSection}>
              <View style={styles.insightRow}>
                <IconSymbol name="calendar" size={14} color={colors.textSecondary} />
                <ThemedText style={[styles.insightText, { color: colors.textSecondary }]}>
                  Predicted run-out: {formatRunOutDate(suggestion.predictedRunOutDate)}
                </ThemedText>
              </View>

              <View style={styles.insightRow}>
                <IconSymbol name="chart.line.uptrend.xyaxis" size={14} color={getConfidenceColor(suggestion.confidence)} />
                <ThemedText style={[styles.insightText, { color: colors.textSecondary }]}>
                  Confidence: {Math.round(suggestion.confidence)}%
                </ThemedText>
              </View>

              <View style={styles.insightRow}>
                <IconSymbol name="leaf" size={14} color={colors.textSecondary} />
                <ThemedText style={[styles.insightText, { color: colors.textSecondary }]}>
                  Daily usage: {suggestion.usagePattern.averageDailyUsage.toFixed(1)} diapers
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Canadian Pricing Section */}
          {bestRetailer && (
            <View style={[styles.pricingSection, { borderTopColor: colors.border }]}>
              <View style={styles.pricingHeader}>
                <ThemedText type="defaultSemiBold" style={[styles.pricingTitle, { color: colors.text }]}>
                  Best Canadian Price
                </ThemedText>
                <View style={styles.canadianBadge}>
                  <ThemedText style={[styles.canadianText, { color: NestSyncColors.canadian.trust }]}>
                    🇨🇦
                  </ThemedText>
                </View>
              </View>

              <View style={styles.priceDetails}>
                <View style={styles.priceRow}>
                  <ThemedText style={[styles.retailerName, { color: colors.textSecondary }]}>
                    {bestRetailer.name}
                  </ThemedText>
                  <View style={styles.priceGroup}>
                    {bestRetailer.price.originalPrice && bestRetailer.price.originalPrice > bestRetailer.price.amount && (
                      <ThemedText style={[styles.originalPrice, { color: colors.textSecondary }]}>
                        {formatCADPrice(bestRetailer.price.originalPrice)}
                      </ThemedText>
                    )}
                    <ThemedText type="defaultSemiBold" style={[styles.finalPrice, { color: colors.text }]}>
                      {formatCADPrice(bestRetailer.price.finalAmount)}
                    </ThemedText>
                  </View>
                </View>

                {/* Canadian Tax Breakdown */}
                <View style={styles.taxBreakdown}>
                  <ThemedText style={[styles.taxLabel, { color: colors.textSecondary }]}>
                    Incl. taxes:
                  </ThemedText>
                  <ThemedText style={[styles.taxAmount, { color: colors.textSecondary }]}>
                    {formatCADPrice(bestRetailer.price.taxes.total)}
                    {bestRetailer.price.taxes.hst > 0 ? ' HST' :
                     ` (${bestRetailer.price.taxes.gst > 0 ? 'GST' : ''}${bestRetailer.price.taxes.pst > 0 ? '+PST' : ''})`}
                  </ThemedText>
                </View>

                {/* Delivery Information */}
                <View style={styles.deliveryRow}>
                  <IconSymbol name="truck.box" size={14} color={NestSyncColors.semantic.success} />
                  <ThemedText style={[styles.deliveryText, { color: colors.textSecondary }]}>
                    {bestRetailer.deliveryTime <= 2 ? 'Express delivery' : `${bestRetailer.deliveryTime} days delivery`}
                    {bestRetailer.freeShipping && ' • Free shipping'}
                  </ThemedText>
                </View>
              </View>

              {/* Cost Savings Highlight */}
              {suggestion.estimatedCostSavings.amount > 0 && (
                <View style={[styles.savingsHighlight, { backgroundColor: NestSyncColors.secondary.greenPale }]}>
                  <IconSymbol name="dollarsign.circle.fill" size={16} color={NestSyncColors.semantic.success} />
                  <ThemedText style={[styles.savingsText, { color: NestSyncColors.semantic.success }]}>
                    Save {formatCADPrice(suggestion.estimatedCostSavings.amount)} vs regular price
                  </ThemedText>
                </View>
              )}
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionSection}>
            <NestSyncButton
              title={isPreorderingItem(suggestion.id) ? "Adding..." : "Reorder Now"}
              onPress={handleReorder}
              variant="primary"
              size="medium"
              loading={isPreorderingItem(suggestion.id)}
              disabled={loading}
              style={styles.reorderButton}
              testID={`${testID}-reorder`}
            />

            <NestSyncButton
              title="Compare Prices"
              onPress={handleCompare}
              variant="outline"
              size="medium"
              disabled={loading}
              style={styles.compareButton}
              testID={`${testID}-compare`}
            />
          </View>

          {/* PIPEDA Compliance Footer */}
          <View style={[styles.complianceFooter, { borderTopColor: colors.border }]}>
            <IconSymbol name="shield.checkmark" size={12} color={NestSyncColors.canadian.trust} />
            <ThemedText style={[styles.complianceText, { color: colors.textSecondary }]}>
              ML predictions use PIPEDA-compliant data processing • Data retained for {suggestion.dataRetentionDays} days
            </ThemedText>
          </View>
        </NestSyncCard>
      </TouchableOpacity>
    </Animated.View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    overflow: 'hidden',
  },

  // Loading State
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontStyle: 'italic',
  },

  // Urgency Banner
  urgencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 16,
  },
  urgencyText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginLeft: 6,
    flex: 1,
  },
  dismissButton: {
    padding: 4,
  },

  // Product Section
  productSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  productSize: {
    fontSize: 14,
    lineHeight: 20,
  },
  predictionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: NestSyncColors.accent.purple + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 12,
  },
  predictionText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },

  // Insights Section
  insightsSection: {
    gap: 8,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  insightText: {
    fontSize: 14,
    marginLeft: 8,
    lineHeight: 20,
  },

  // Pricing Section
  pricingSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    marginBottom: 16,
    borderTopWidth: 1,
  },
  pricingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  pricingTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  canadianBadge: {
    backgroundColor: NestSyncColors.canadian.trust + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  canadianText: {
    fontSize: 12,
    fontWeight: '600',
  },

  priceDetails: {
    gap: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  retailerName: {
    fontSize: 14,
    fontWeight: '500',
  },
  priceGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  originalPrice: {
    fontSize: 14,
    textDecorationLine: 'line-through',
  },
  finalPrice: {
    fontSize: 18,
    fontWeight: '700',
  },

  taxBreakdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  taxLabel: {
    fontSize: 12,
  },
  taxAmount: {
    fontSize: 12,
    fontWeight: '500',
  },

  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliveryText: {
    fontSize: 12,
    marginLeft: 6,
  },

  savingsHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
  },
  savingsText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },

  // Action Section
  actionSection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  reorderButton: {
    flex: 2,
  },
  compareButton: {
    flex: 1,
  },

  // Compliance Footer
  complianceFooter: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 6,
  },
  complianceText: {
    fontSize: 10,
    lineHeight: 14,
    flex: 1,
  },
});

export default ReorderSuggestionCard;