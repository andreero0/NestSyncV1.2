/**
 * RetailerComparisonSheet Component
 * Multi-retailer price comparison modal with Canadian pricing and PIPEDA compliance
 * Designed for psychology-driven UX patterns to help stressed parents make informed decisions
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  Platform,
  SafeAreaView,
  FlatList,
  Alert,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@apollo/client';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { PanGestureHandler, State } from 'react-native-gesture-handler';

import { ThemedText } from '../ThemedText';
import { IconSymbol } from '../ui/IconSymbol';
import { NestSyncButton } from '../ui/NestSyncButton';
import { NestSyncCard } from '../ui/NestSyncCard';
import { Colors, NestSyncColors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useReorderStore } from '@/stores/reorderStore';
import { GET_RETAILER_COMPARISON } from '@/lib/graphql/reorder-queries';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export interface RetailerComparisonData {
  productId: string;
  product: {
    id: string;
    name: string;
    brand: string;
    size: string;
    category: string;
    image: string;
    specifications?: string[];
  };
  retailers: {
    id: string;
    name: string;
    logo: string;
    trustScore: number;
    verificationStatus: string;
    price: {
      amount: number;
      currency: string;
      originalPrice?: number;
      discountPercentage?: number;
      bulkDiscounts?: {
        quantity: number;
        discountPercentage: number;
        savings: {
          amount: number;
          currency: string;
        };
      }[];
      taxes: {
        gst: number;
        pst: number;
        hst: number;
        total: number;
      };
      finalAmount: number;
    };
    availability: {
      inStock: boolean;
      quantity: number;
      estimatedRestockDate?: string;
      lastUpdated: string;
    };
    delivery: {
      estimatedDays: number;
      minDeliveryDays: number;
      maxDeliveryDays: number;
      freeShippingThreshold?: number;
      shippingCost: {
        amount: number;
        currency: string;
      };
      deliveryOptions: {
        type: string;
        estimatedDays: number;
        cost: {
          amount: number;
          currency: string;
        };
      }[];
    };
    customerReviews: {
      averageRating: number;
      totalReviews: number;
      recentReviews: {
        rating: number;
        comment: string;
        date: string;
        verified: boolean;
      }[];
    };
    affiliateInfo: {
      isAffiliate: boolean;
      disclosureText?: string;
      commissionRate?: number;
    };
    lastPriceUpdate: string;
  }[];
  priceComparison: {
    lowestPrice: {
      retailerId: string;
      amount: number;
      currency: string;
      savings: {
        amount: number;
        currency: string;
        percentage: number;
      };
    };
    averagePrice: {
      amount: number;
      currency: string;
    };
    priceSpread: {
      min: number;
      max: number;
      average: number;
    };
  };
  priceDataConsent: boolean;
  lastUpdated: string;
}

interface RetailerComparisonSheetProps {
  visible: boolean;
  productId?: string;
  quantity?: number;
  onClose: () => void;
  onSelectRetailer?: (retailerId: string, productId: string) => void;
  testID?: string;
}

type SortOption = 'price' | 'delivery' | 'rating' | 'trustScore';

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

const formatDeliveryTime = (days: number): string => {
  if (days === 1) return '1 day';
  if (days <= 2) return 'Express';
  if (days <= 7) return `${days} days`;
  return '1-2 weeks';
};

const getTrustBadgeColor = (trustScore: number): string => {
  if (trustScore >= 9) return NestSyncColors.semantic.success;
  if (trustScore >= 7) return NestSyncColors.accent.amber;
  return NestSyncColors.accent.orange;
};

const getRatingStars = (rating: number): string => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  return '★'.repeat(fullStars) + (hasHalfStar ? '½' : '') + '☆'.repeat(5 - Math.ceil(rating));
};

// =============================================================================
// RETAILER COMPARISON SHEET COMPONENT
// =============================================================================

export function RetailerComparisonSheet({
  visible,
  productId,
  quantity = 1,
  onClose,
  onSelectRetailer,
  testID,
}: RetailerComparisonSheetProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  // State management
  const [sortBy, setSortBy] = useState<SortOption>('price');
  const [selectedRetailerId, setSelectedRetailerId] = useState<string>('');
  const [showAffiliateDisclosure, setShowAffiliateDisclosure] = useState(false);

  // Animation values
  const translateY = useSharedValue(screenHeight);
  const backdropOpacity = useSharedValue(0);
  const dragGestureY = useSharedValue(0);

  // Psychology-driven spring configuration for stress reduction
  const springConfig = {
    damping: 20,
    stiffness: 300,
    mass: 1.2,
  };

  // GraphQL query for retailer comparison
  const { data, loading, error, refetch } = useQuery(GET_RETAILER_COMPARISON, {
    variables: { productId, quantity },
    skip: !visible || !productId,
    fetchPolicy: Platform.OS === 'web' ? 'cache-first' : 'cache-and-network',
    errorPolicy: 'all',
  });

  const comparisonData: RetailerComparisonData | null = data?.getRetailerComparison || null;

  // =============================================================================
  // SORTING & FILTERING LOGIC
  // =============================================================================

  const sortedRetailers = useMemo(() => {
    if (!comparisonData?.retailers) return [];

    const retailers = [...comparisonData.retailers];

    switch (sortBy) {
      case 'price':
        return retailers.sort((a, b) => a.price.finalAmount - b.price.finalAmount);
      case 'delivery':
        return retailers.sort((a, b) => a.delivery.estimatedDays - b.delivery.estimatedDays);
      case 'rating':
        return retailers.sort((a, b) => b.customerReviews.averageRating - a.customerReviews.averageRating);
      case 'trustScore':
        return retailers.sort((a, b) => b.trustScore - a.trustScore);
      default:
        return retailers;
    }
  }, [comparisonData?.retailers, sortBy]);

  // =============================================================================
  // ANIMATION HANDLERS
  // =============================================================================

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, springConfig);
      backdropOpacity.value = withTiming(1, { duration: 300 });
    } else {
      translateY.value = withTiming(screenHeight, { duration: 250 });
      backdropOpacity.value = withTiming(0, { duration: 250 });
    }
  }, [visible]);

  const handlePanGesture = (event: any) => {
    const { translationY, velocityY, state } = event.nativeEvent;

    if (state === State.ACTIVE) {
      if (translationY > 0) {
        dragGestureY.value = translationY;
        translateY.value = translationY;
      }
    } else if (state === State.END) {
      const shouldClose = translationY > 150 || velocityY > 500;

      if (shouldClose) {
        translateY.value = withTiming(screenHeight, { duration: 200 });
        backdropOpacity.value = withTiming(0, { duration: 200 });
        setTimeout(() => runOnJS(onClose)(), 200);
      } else {
        translateY.value = withSpring(0, springConfig);
      }

      dragGestureY.value = 0;
    }
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    translateY.value = withTiming(screenHeight, { duration: 250 });
    backdropOpacity.value = withTiming(0, { duration: 250 });
    setTimeout(() => {
      onClose();
      setSelectedRetailerId('');
      setSortBy('price');
    }, 250);
  };

  // =============================================================================
  // ACTION HANDLERS
  // =============================================================================

  const handleSelectRetailer = (retailerId: string) => {
    if (!comparisonData) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedRetailerId(retailerId);

    if (onSelectRetailer) {
      onSelectRetailer(retailerId, comparisonData.productId);
    }

    // Auto-close after selection
    setTimeout(() => handleClose(), 500);
  };

  const handleSortChange = (newSortBy: SortOption) => {
    if (newSortBy !== sortBy) {
      Haptics.selectionAsync();
      setSortBy(newSortBy);
    }
  };

  const handleShowAffiliateDisclosure = () => {
    setShowAffiliateDisclosure(true);
  };

  // =============================================================================
  // ANIMATED STYLES
  // =============================================================================

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // =============================================================================
  // RENDER RETAILER ITEM
  // =============================================================================

  const renderRetailerItem = ({ item: retailer, index }: { item: any; index: number }) => {
    const isLowestPrice = comparisonData?.priceComparison.lowestPrice.retailerId === retailer.id;
    const isFastestDelivery = retailer.delivery.estimatedDays === Math.min(...sortedRetailers.map(r => r.delivery.estimatedDays));
    const isSelected = selectedRetailerId === retailer.id;

    return (
      <TouchableOpacity
        style={[
          styles.retailerCard,
          {
            backgroundColor: isSelected ? colors.tint + '20' : colors.surface,
            borderColor: isSelected ? colors.tint : colors.border,
          }
        ]}
        onPress={() => handleSelectRetailer(retailer.id)}
        accessibilityRole="button"
        accessibilityLabel={`Select ${retailer.name}, ${formatCADPrice(retailer.price.finalAmount)}`}
      >
        {/* Badges */}
        <View style={styles.badgeContainer}>
          {isLowestPrice && (
            <View style={[styles.badge, { backgroundColor: NestSyncColors.semantic.success }]}>
              <IconSymbol name="crown.fill" size={12} color={colors.background} />
              <ThemedText style={[styles.badgeText, { color: colors.background }]}>Best Price</ThemedText>
            </View>
          )}
          {isFastestDelivery && (
            <View style={[styles.badge, { backgroundColor: NestSyncColors.accent.orange }]}>
              <IconSymbol name="bolt.fill" size={12} color={colors.background} />
              <ThemedText style={[styles.badgeText, { color: colors.background }]}>Fastest</ThemedText>
            </View>
          )}
        </View>

        {/* Retailer Header */}
        <View style={styles.retailerHeader}>
          <View style={styles.retailerInfo}>
            <ThemedText type="defaultSemiBold" style={[styles.retailerName, { color: colors.text }]}>
              {retailer.name}
            </ThemedText>
            <View style={styles.trustContainer}>
              <View style={[styles.trustBadge, { backgroundColor: getTrustBadgeColor(retailer.trustScore) + '20' }]}>
                <IconSymbol name="shield.checkmark" size={14} color={getTrustBadgeColor(retailer.trustScore)} />
                <ThemedText style={[styles.trustScore, { color: getTrustBadgeColor(retailer.trustScore) }]}>
                  {retailer.trustScore.toFixed(1)}
                </ThemedText>
              </View>
              <ThemedText style={[styles.verificationStatus, { color: colors.textSecondary }]}>
                {retailer.verificationStatus}
              </ThemedText>
            </View>
          </View>

          {/* Stock Status */}
          <View style={styles.stockContainer}>
            <IconSymbol
              name={retailer.availability.inStock ? "checkmark.circle.fill" : "exclamationmark.triangle.fill"}
              size={16}
              color={retailer.availability.inStock ? NestSyncColors.semantic.success : NestSyncColors.semantic.warning}
            />
            <ThemedText style={[styles.stockText, { color: colors.textSecondary }]}>
              {retailer.availability.inStock ? 'In Stock' : 'Out of Stock'}
            </ThemedText>
          </View>
        </View>

        {/* Pricing Section */}
        <View style={styles.pricingSection}>
          <View style={styles.priceContainer}>
            {retailer.price.originalPrice && retailer.price.originalPrice > retailer.price.amount && (
              <ThemedText style={[styles.originalPrice, { color: colors.textSecondary }]}>
                {formatCADPrice(retailer.price.originalPrice)}
              </ThemedText>
            )}
            <ThemedText type="title" style={[styles.finalPrice, { color: colors.text }]}>
              {formatCADPrice(retailer.price.finalAmount)}
            </ThemedText>
            {retailer.price.discountPercentage && retailer.price.discountPercentage > 0 && (
              <View style={[styles.discountBadge, { backgroundColor: NestSyncColors.semantic.success }]}>
                <ThemedText style={[styles.discountText, { color: colors.background }]}>
                  -{retailer.price.discountPercentage}%
                </ThemedText>
              </View>
            )}
          </View>

          {/* Canadian Tax Breakdown */}
          <View style={styles.taxContainer}>
            <ThemedText style={[styles.taxLabel, { color: colors.textSecondary }]}>
              Incl. {formatCADPrice(retailer.price.taxes.total)}
              {retailer.price.taxes.hst > 0 ? ' HST' :
               ` (${retailer.price.taxes.gst > 0 ? 'GST' : ''}${retailer.price.taxes.pst > 0 ? '+PST' : ''})`}
            </ThemedText>
          </View>
        </View>

        {/* Delivery & Reviews */}
        <View style={styles.detailsSection}>
          <View style={styles.deliveryContainer}>
            <IconSymbol name="truck.box" size={14} color={colors.textSecondary} />
            <ThemedText style={[styles.deliveryText, { color: colors.textSecondary }]}>
              {formatDeliveryTime(retailer.delivery.estimatedDays)}
              {retailer.delivery.shippingCost.amount === 0 ? ' • Free shipping' : ` • ${formatCADPrice(retailer.delivery.shippingCost.amount)} shipping`}
            </ThemedText>
          </View>

          <View style={styles.reviewsContainer}>
            <ThemedText style={[styles.ratingText, { color: colors.textSecondary }]}>
              {getRatingStars(retailer.customerReviews.averageRating)}
              ({retailer.customerReviews.totalReviews})
            </ThemedText>
          </View>
        </View>

        {/* Affiliate Disclosure */}
        {retailer.affiliateInfo.isAffiliate && (
          <TouchableOpacity
            style={styles.affiliateDisclosure}
            onPress={handleShowAffiliateDisclosure}
          >
            <IconSymbol name="info.circle" size={12} color={NestSyncColors.accent.amber} />
            <ThemedText style={[styles.affiliateText, { color: NestSyncColors.accent.amber }]}>
              Affiliate partner
            </ThemedText>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      statusBarTranslucent={true}
      onRequestClose={handleClose}
    >
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <BlurView intensity={20} style={StyleSheet.absoluteFill}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={handleClose}
          />
        </BlurView>

        <PanGestureHandler onGestureEvent={handlePanGesture}>
          <Animated.View style={[styles.sheetContainer, sheetStyle]}>
            <SafeAreaView style={[styles.sheet, { backgroundColor: colors.background }]}>
              {/* Handle */}
              <View style={[styles.handle, { backgroundColor: colors.border }]} />

              {/* Header */}
              <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <View style={styles.headerContent}>
                  <IconSymbol name="chart.bar.fill" size={24} color={colors.tint} />
                  <View style={styles.headerTextContainer}>
                    <ThemedText type="title" style={[styles.headerTitle, { color: colors.text }]}>
                      Price Comparison
                    </ThemedText>
                    {comparisonData?.product && (
                      <ThemedText style={[styles.productName, { color: colors.textSecondary }]}>
                        {comparisonData.product.brand} {comparisonData.product.name} • Size {comparisonData.product.size}
                      </ThemedText>
                    )}
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.closeButton, { backgroundColor: colors.surface }]}
                  onPress={handleClose}
                  accessibilityRole="button"
                  accessibilityLabel="Close comparison"
                >
                  <IconSymbol name="xmark" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Loading State */}
              {loading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.tint} />
                  <ThemedText style={[styles.loadingText, { color: colors.textSecondary }]}>
                    Comparing prices across retailers...
                  </ThemedText>
                </View>
              )}

              {/* Error State */}
              {error && (
                <View style={styles.errorContainer}>
                  <IconSymbol name="exclamationmark.triangle" size={24} color={colors.error} />
                  <ThemedText style={[styles.errorText, { color: colors.error }]}>
                    Unable to load price comparison
                  </ThemedText>
                  <NestSyncButton
                    title="Retry"
                    onPress={() => refetch()}
                    variant="outline"
                    size="small"
                  />
                </View>
              )}

              {/* Content */}
              {comparisonData && !loading && (
                <>
                  {/* Sort Options */}
                  <View style={[styles.sortContainer, { borderBottomColor: colors.border }]}>
                    <ThemedText style={[styles.sortLabel, { color: colors.textSecondary }]}>
                      Sort by:
                    </ThemedText>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortOptions}>
                      {[
                        { key: 'price', label: 'Price', icon: 'dollarsign.circle' },
                        { key: 'delivery', label: 'Delivery', icon: 'truck.box' },
                        { key: 'rating', label: 'Rating', icon: 'star.fill' },
                        { key: 'trustScore', label: 'Trust', icon: 'shield.checkmark' },
                      ].map((option) => (
                        <TouchableOpacity
                          key={option.key}
                          style={[
                            styles.sortOption,
                            {
                              backgroundColor: sortBy === option.key ? colors.tint : colors.surface,
                              borderColor: sortBy === option.key ? colors.tint : colors.border,
                            }
                          ]}
                          onPress={() => handleSortChange(option.key as SortOption)}
                        >
                          <IconSymbol
                            name={option.icon}
                            size={14}
                            color={sortBy === option.key ? colors.background : colors.textSecondary}
                          />
                          <ThemedText
                            style={[
                              styles.sortOptionText,
                              { color: sortBy === option.key ? colors.background : colors.text }
                            ]}
                          >
                            {option.label}
                          </ThemedText>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  {/* Price Summary */}
                  <View style={[styles.summaryContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.summaryRow}>
                      <ThemedText style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                        Lowest Price:
                      </ThemedText>
                      <ThemedText type="defaultSemiBold" style={[styles.summaryValue, { color: NestSyncColors.semantic.success }]}>
                        {formatCADPrice(comparisonData.priceComparison.lowestPrice.amount)}
                      </ThemedText>
                    </View>
                    <View style={styles.summaryRow}>
                      <ThemedText style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                        Average Price:
                      </ThemedText>
                      <ThemedText style={[styles.summaryValue, { color: colors.text }]}>
                        {formatCADPrice(comparisonData.priceComparison.averagePrice.amount)}
                      </ThemedText>
                    </View>
                    <View style={styles.summaryRow}>
                      <ThemedText style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                        Max Savings:
                      </ThemedText>
                      <ThemedText type="defaultSemiBold" style={[styles.summaryValue, { color: NestSyncColors.semantic.success }]}>
                        {formatCADPrice(comparisonData.priceComparison.lowestPrice.savings.amount)}
                        ({comparisonData.priceComparison.lowestPrice.savings.percentage.toFixed(0)}%)
                      </ThemedText>
                    </View>
                  </View>

                  {/* Retailers List */}
                  <FlatList
                    data={sortedRetailers}
                    renderItem={renderRetailerItem}
                    keyExtractor={(item) => item.id}
                    style={styles.retailersList}
                    contentContainerStyle={styles.retailersContent}
                    showsVerticalScrollIndicator={false}
                  />

                  {/* PIPEDA Compliance Footer */}
                  <View style={[styles.complianceFooter, { borderTopColor: colors.border }]}>
                    <IconSymbol name="shield.checkmark" size={12} color={NestSyncColors.canadian.trust} />
                    <ThemedText style={[styles.complianceText, { color: colors.textSecondary }]}>
                      Price data processed under PIPEDA compliance • Updated {new Date(comparisonData.lastUpdated).toLocaleDateString('en-CA')}
                    </ThemedText>
                  </View>
                </>
              )}
            </SafeAreaView>
          </Animated.View>
        </PanGestureHandler>
      </Animated.View>

      {/* Affiliate Disclosure Modal */}
      {showAffiliateDisclosure && (
        <Modal transparent={true} visible={showAffiliateDisclosure} animationType="fade">
          <View style={styles.overlayModal}>
            <View style={[styles.disclosureModal, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <ThemedText type="subtitle" style={[styles.disclosureTitle, { color: colors.text }]}>
                Affiliate Partnership
              </ThemedText>
              <ThemedText style={[styles.disclosureContent, { color: colors.textSecondary }]}>
                NestSync may earn a commission if you purchase through some retailer links. This doesn't affect the price you pay and helps support our free features.
              </ThemedText>
              <NestSyncButton
                title="Got it"
                onPress={() => setShowAffiliateDisclosure(false)}
                variant="primary"
                size="small"
                style={styles.disclosureButton}
              />
            </View>
          </View>
        </Modal>
      )}
    </Modal>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    height: screenHeight * 0.85,
    maxHeight: 700,
  },
  sheet: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        boxShadow: '0px -5px 20px rgba(0, 0, NaN, 0.15)',
      },
      android: {
        elevation: 20,
      },
    }),
  },

  // Handle
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 16,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  productName: {
    fontSize: 14,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Loading & Error States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },

  // Sort Controls
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 12,
  },
  sortOptions: {
    gap: 8,
    paddingRight: 20,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  sortOptionText: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Summary
  summaryContainer: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Retailers List
  retailersList: {
    flex: 1,
  },
  retailersContent: {
    padding: 20,
    paddingTop: 16,
  },

  // Retailer Card
  retailerCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    // color applied inline with theme awareness
  },

  retailerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  retailerInfo: {
    flex: 1,
  },
  retailerName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  trustContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  trustScore: {
    fontSize: 12,
    fontWeight: '600',
  },
  verificationStatus: {
    fontSize: 12,
  },

  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stockText: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Pricing
  pricingSection: {
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  originalPrice: {
    fontSize: 14,
    textDecorationLine: 'line-through',
  },
  finalPrice: {
    fontSize: 20,
    fontWeight: '700',
  },
  discountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  discountText: {
    fontSize: 12,
    fontWeight: '700',
    // color applied inline with theme awareness
  },

  taxContainer: {
    marginBottom: 8,
  },
  taxLabel: {
    fontSize: 12,
  },

  // Details
  detailsSection: {
    gap: 8,
  },
  deliveryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deliveryText: {
    fontSize: 12,
  },
  reviewsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
  },

  affiliateDisclosure: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  affiliateText: {
    fontSize: 10,
    fontStyle: 'italic',
  },

  // Compliance Footer
  complianceFooter: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 6,
  },
  complianceText: {
    fontSize: 10,
    lineHeight: 14,
    flex: 1,
  },

  // Affiliate Disclosure Modal
  overlayModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  disclosureModal: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    gap: 16,
  },
  disclosureTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  disclosureContent: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  disclosureButton: {
    alignSelf: 'center',
  },
});

export default RetailerComparisonSheet;