/**
 * Simplified Reorder Suggestions Page
 *
 * Design-compliant implementation that renders immediately without blocking on async operations.
 * Follows design spec from design-documentation/features/reorder-flow/screen-states.md
 *
 * Key improvements:
 * - Renders static UI immediately (no loading screen death on iOS)
 * - Progressive data loading in background
 * - Follows psychology-driven UX principles
 * - Canadian context maintained
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@apollo/client';
import { NestSyncColors } from '../constants/Colors';
import { useNestSyncTheme } from '../contexts/ThemeContext';
import { Button } from '../components/ui/Button';
import { NoOrdersEmptyState } from '../components/ui/EmptyState';
import { TrialCountdownBanner } from '../components/reorder/TrialCountdownBanner';
import { ModifyOrderModal } from '../components/reorder/ModifyOrderModal';
import { SkipOrderModal, SkipOrderData } from '../components/reorder/SkipOrderModal';
import { EmergencyOrderModal, EmergencyOrderData } from '../components/reorder/EmergencyOrderModal';
import { useReorderStore } from '../stores/reorderStore';
import { CREATE_MANUAL_ORDER, type ManualOrderInput } from '../lib/graphql/reorder-queries';

/**
 * Main Reorder Dashboard Component
 * Renders immediately with static content, loads data progressively
 */
export default function ReorderSuggestionsSimple() {
  const theme = useNestSyncTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const childId = params.childId as string;

  // Connect to Zustand store for real data
  const {
    suggestions,
    isLoading: isLoadingData,
    loadReorderSuggestions,
  } = useReorderStore();

  // GraphQL mutation for creating manual orders
  const [createManualOrder, { loading: creatingOrder }] = useMutation(CREATE_MANUAL_ORDER);

  // Modal state
  const [modifyModalVisible, setModifyModalVisible] = useState(false);
  const [skipModalVisible, setSkipModalVisible] = useState(false);
  const [emergencyModalVisible, setEmergencyModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // Background data loading (non-blocking) - NOW USING REAL DATA
  useEffect(() => {
    const loadDataInBackground = async () => {
      try {
        if (childId) {
          // Load real reorder suggestions from GraphQL via Zustand store
          await loadReorderSuggestions(childId);
        }
      } catch (error) {
        console.warn('[Reorder Simple] Failed to load suggestions:', error);
        // Silently fail - UI already rendered with empty state
      }
    };

    loadDataInBackground();
  }, [childId, loadReorderSuggestions]);

  // Calculate stats from real suggestions data
  const stats = {
    nextOrders: suggestions.length,
    monthlySavings: suggestions.reduce(
      (total, suggestion) => total + (suggestion.estimatedCostSavings?.amount || 0),
      0
    ),
    automationActive: true, // TODO: Connect to subscription status
  };

  const handleEmergencyOrder = () => {
    setEmergencyModalVisible(true);
  };

  const handleSetupNewItem = () => {
    router.push('/add-inventory-item');
  };

  const handleViewAllItems = () => {
    router.push(`/inventory-list?childId=${childId}`);
  };

  const handleOrderHistory = () => {
    router.push('/order-history');
  };

  const handleModifyOrder = (orderId: string) => {
    const order = suggestions.find(s => s.id === orderId);
    if (order) {
      setSelectedOrder({
        id: order.id,
        productName: order.product.name,
        quantity: order.suggestedQuantity,
        retailer: order.availableRetailers[0]?.name || 'Walmart',
      });
      setModifyModalVisible(true);
    }
  };

  const handleSkipOrder = (orderId: string) => {
    const order = suggestions.find(s => s.id === orderId);
    if (order) {
      setSelectedOrder({
        id: order.id,
        productName: order.product.name,
        predictedDays: Math.ceil(
          (new Date(order.predictedRunOutDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        ),
      });
      setSkipModalVisible(true);
    }
  };

  const handleUpgradePress = () => {
    router.push('/subscription-management');
  };

  // Modal callbacks - REAL DATA OPERATIONS
  const handleModifySubmit = async (orderId: string, data: any) => {
    console.log('[Reorder Simple] Order modified:', orderId, data);
    // TODO: Call GraphQL mutation to update suggestion preferences
    // For now, log the action (will wire up GraphQL in next phase)
  };

  const handleSkipSubmit = async (orderId: string, skipData: SkipOrderData) => {
    console.log('[Reorder Simple] Order skipped:', orderId, skipData);
    // TODO: Call GraphQL mutation to skip/postpone order
    // For now, log the action (will wire up GraphQL in next phase)
  };

  const handleEmergencySubmit = async (orderData: EmergencyOrderData) => {
    console.log('[Reorder Simple] Emergency order placed:', orderData);

    try {
      // Map retailer name to RetailerTypeEnum
      const retailerTypeMap: Record<string, 'AMAZON_CA' | 'WALMART_CA'> = {
        'Amazon': 'AMAZON_CA',
        'Walmart': 'WALMART_CA',
      };

      const retailerType = retailerTypeMap[orderData.retailer] || 'WALMART_CA';

      // Create ManualOrderInput matching backend schema
      const input: ManualOrderInput = {
        childId: childId,
        retailerType: retailerType,
        products: {
          name: orderData.productName,
          category: orderData.category,
          quantity: orderData.quantity,
          notes: orderData.notes || '',
        },
        deliveryAddress: {
          // TODO: Get actual address from user profile
          type: 'default',
          instructions: `Delivery speed: ${orderData.deliverySpeed}`,
        },
        paymentMethodId: 'default', // TODO: Get from user profile or payment settings
      };

      // Call CREATE_MANUAL_ORDER mutation
      const result = await createManualOrder({
        variables: { input },
        refetchQueries: ['GetOrderHistory'], // Refresh order history
      });

      if (result.data?.createManualOrder?.success) {
        alert(`Order placed successfully!\n${orderData.productName}\nDelivery: ${orderData.deliverySpeed}`);
        setEmergencyModalVisible(false);
        // Navigate to order history to show the new order
        router.push('/order-history');
      } else {
        const errorMsg = result.data?.createManualOrder?.message || 'Failed to place order';
        alert(`Error: ${errorMsg}`);
      }
    } catch (error: any) {
      console.error('[Reorder Simple] Error placing order:', error);
      alert(`Error placing order: ${error.message || 'Please try again'}`);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme === 'dark' ? '#1F2937' : '#F9FAFB',
    },
    scrollContent: {
      paddingBottom: 32,
    },
    // Quick Stats Card - Design Spec Compliant
    statsCard: {
      backgroundColor: theme === 'dark' ? NestSyncColors.neutral[700] : NestSyncColors.neutral[100],
      marginHorizontal: 16,
      marginTop: 16,
      marginBottom: 12,
      padding: 16, // lg spacing
      borderRadius: 12, // lg radius
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 }, // sm shadow
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    statsLabel: {
      fontSize: 14, // body from design system
      fontWeight: '500', // medium
      color: theme === 'dark' ? NestSyncColors.neutral[300] : NestSyncColors.neutral[500],
    },
    statsValue: {
      fontSize: 16, // subtitle from design system
      fontWeight: '600', // semibold
      color: theme === 'dark' ? NestSyncColors.neutral[100] : NestSyncColors.neutral[700],
    },
    statsValueHighlight: {
      color: NestSyncColors.primary.blue,
      fontWeight: '700',
    },
    automationStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8, // sm spacing (4px base unit)
    },
    activeIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: NestSyncColors.secondary.green,
    },
    // Section Header
    sectionHeader: {
      fontSize: 20, // title from design system
      fontWeight: '600',
      color: theme === 'dark' ? NestSyncColors.neutral[100] : NestSyncColors.neutral[600],
      marginHorizontal: 16,
      marginTop: 24,
      marginBottom: 12,
    },
    // Order Card - Design Spec Compliant (72px height)
    orderCard: {
      backgroundColor: theme === 'dark' ? NestSyncColors.neutral[700] : NestSyncColors.neutral[100],
      marginHorizontal: 16,
      marginBottom: 12, // md spacing
      padding: 16, // lg spacing
      borderRadius: 12, // lg radius
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 72,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 }, // sm shadow
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    orderImagePlaceholder: {
      width: 48,
      height: 48,
      borderRadius: 8, // md radius
      backgroundColor: theme === 'dark' ? NestSyncColors.neutral[600] : NestSyncColors.neutral[200],
      marginRight: 12, // md spacing
      alignItems: 'center',
      justifyContent: 'center',
    },
    orderContent: {
      flex: 1,
    },
    orderName: {
      fontSize: 16, // subtitle from design system
      fontWeight: '600', // semibold
      color: theme === 'dark' ? NestSyncColors.neutral[100] : NestSyncColors.neutral[700],
      marginBottom: 4, // xs spacing
    },
    orderMeta: {
      fontSize: 14, // body from design system
      color: theme === 'dark' ? NestSyncColors.neutral[300] : NestSyncColors.neutral[500],
      marginBottom: 4, // xs spacing
    },
    orderRetailer: {
      fontSize: 12, // small from design system
      color: NestSyncColors.neutral[400],
    },
    orderActions: {
      flexDirection: 'row',
      gap: 8,
    },
    modifyButton: {
      paddingHorizontal: 12, // md spacing
      paddingVertical: 8, // sm spacing (increased for better touch target)
      borderRadius: 8, // md radius
      borderWidth: 1,
      borderColor: NestSyncColors.primary.blue,
      minHeight: 36, // Comfortable touch target for small buttons
    },
    modifyButtonText: {
      fontSize: 12, // small from design system
      fontWeight: '600', // semibold
      color: NestSyncColors.primary.blue,
    },
    skipButton: {
      paddingHorizontal: 12, // md spacing
      paddingVertical: 8, // sm spacing
      borderRadius: 8, // md radius
      borderWidth: 1,
      borderColor: theme === 'dark' ? NestSyncColors.neutral[500] : NestSyncColors.neutral[300],
      minHeight: 36, // Comfortable touch target for small buttons
    },
    skipButtonText: {
      fontSize: 12, // small from design system
      fontWeight: '600', // semibold
      color: theme === 'dark' ? NestSyncColors.neutral[300] : NestSyncColors.neutral[500],
    },
    // Action Buttons Section
    actionsContainer: {
      marginHorizontal: 16,
      marginTop: 24, // xxl spacing
      gap: 12, // md spacing
    },
    actionButton: {
      backgroundColor: NestSyncColors.primary.blue,
      paddingVertical: 14,
      paddingHorizontal: 16, // lg spacing
      borderRadius: 12, // lg radius
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8, // sm spacing
      minHeight: 48, // WCAG AA minimum
    },
    actionButtonSecondary: {
      backgroundColor: theme === 'dark' ? NestSyncColors.neutral[700] : NestSyncColors.neutral[100],
      borderWidth: 1,
      borderColor: theme === 'dark' ? NestSyncColors.neutral[600] : NestSyncColors.neutral[200],
    },
    actionButtonEmergency: {
      backgroundColor: NestSyncColors.semantic.error,
    },
    actionButtonText: {
      fontSize: 16, // subtitle from design system
      fontWeight: '600', // semibold
      color: '#FFFFFF',
    },
    actionButtonTextSecondary: {
      color: theme === 'dark' ? NestSyncColors.neutral[100] : NestSyncColors.neutral[700],
    },
    // Empty State
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 48,
      paddingHorizontal: 24, // xxl spacing
    },
    emptyStateIcon: {
      marginBottom: 16, // lg spacing
    },
    emptyStateTitle: {
      fontSize: 20, // title from design system
      fontWeight: '600', // semibold
      color: theme === 'dark' ? NestSyncColors.neutral[100] : NestSyncColors.neutral[700],
      marginBottom: 8, // sm spacing
      textAlign: 'center',
    },
    emptyStateDescription: {
      fontSize: 14, // body from design system
      color: theme === 'dark' ? NestSyncColors.neutral[300] : NestSyncColors.neutral[500],
      textAlign: 'center',
      lineHeight: 20,
    },
    // Loading Indicator (subtle, non-blocking)
    loadingIndicator: {
      marginTop: 16,
      alignItems: 'center',
    },
    canadianTrustBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 24,
      marginBottom: 8,
      gap: 6,
    },
    canadianTrustText: {
      fontSize: 12,
      color: NestSyncColors.canadian.trust,
      fontWeight: '500',
    },
  });

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Reorder Dashboard',
          headerShown: true,
          headerBackTitle: 'Home',
          headerStyle: {
            backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
          },
          headerTintColor: theme === 'dark' ? '#FFFFFF' : '#111827',
          headerRight: () => (
            <View style={{ flexDirection: 'row', gap: 16, marginRight: 8 }}>
              <TouchableOpacity
                onPress={() => {
                  Alert.alert(
                    'Reorder Help',
                    'This dashboard shows AI-powered reorder suggestions based on your usage patterns.\n\n• Modify: Adjust quantity or delivery date\n• Skip: Postpone this order\n• Emergency Order: Place an urgent order\n\nAll predictions are based on your tracking data.',
                    [{ text: 'Got it', style: 'default' }]
                  );
                }}
                accessibilityLabel="Help"
                accessibilityHint="Shows help information about reorder suggestions"
              >
                <Ionicons
                  name="help-circle-outline"
                  size={24}
                  color={theme === 'dark' ? '#FFFFFF' : '#111827'}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  router.push('/settings');
                }}
                accessibilityLabel="Settings"
                accessibilityHint="Opens app settings"
              >
                <Ionicons
                  name="settings-outline"
                  size={24}
                  color={theme === 'dark' ? '#FFFFFF' : '#111827'}
                />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      {/* Trial Banner */}
      <TrialCountdownBanner
        onUpgradePress={handleUpgradePress}
        showDismiss={true}
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Quick Stats Card - Renders Immediately */}
        <View style={styles.statsCard}>
          <View style={styles.statsRow}>
            <Text style={styles.statsLabel}>Next Orders:</Text>
            <Text style={styles.statsValue}>
              {stats.nextOrders} items in 2 days
            </Text>
          </View>

          <View style={styles.statsRow}>
            <Text style={styles.statsLabel}>Monthly Savings:</Text>
            <Text style={[styles.statsValue, styles.statsValueHighlight]}>
              ${stats.monthlySavings.toFixed(2)} CAD
            </Text>
          </View>

          <View style={styles.statsRow}>
            <Text style={styles.statsLabel}>Automation Status:</Text>
            <View style={styles.automationStatus}>
              <View style={styles.activeIndicator} />
              <Text style={[styles.statsValue, { color: NestSyncColors.secondary.green }]}>
                {stats.automationActive ? 'ACTIVE' : 'PAUSED'}
              </Text>
            </View>
          </View>
        </View>

        {/* Upcoming Orders Section */}
        <Text style={styles.sectionHeader}>Upcoming Orders</Text>

        {isLoadingData && suggestions.length === 0 && (
          <View style={styles.loadingIndicator}>
            <ActivityIndicator size="small" color={NestSyncColors.primary.blue} />
            <Text style={{ marginTop: 8, fontSize: 12, color: '#9CA3AF' }}>
              Loading predictions...
            </Text>
          </View>
        )}

        {!isLoadingData && suggestions.length === 0 && (
          <NoOrdersEmptyState onCreateOrder={handleEmergencyOrder} />
        )}

        {suggestions.map((suggestion) => {
          const daysUntilRunOut = Math.ceil(
            (new Date(suggestion.predictedRunOutDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );
          const bestRetailer = suggestion.availableRetailers?.[0];

          return (
            <View key={suggestion.id} style={styles.orderCard}>
              <View style={styles.orderImagePlaceholder}>
                <Ionicons name="cube" size={24} color="#9CA3AF" />
              </View>

              <View style={styles.orderContent}>
                <Text style={styles.orderName}>{suggestion.product.name}</Text>
                <Text style={styles.orderMeta}>
                  Predicted: {daysUntilRunOut} days • {(suggestion.confidence * 100).toFixed(0)}% confidence
                </Text>
                {bestRetailer && (
                  <Text style={styles.orderRetailer}>
                    {bestRetailer.name} • ${bestRetailer.price.finalAmount.toFixed(2)}
                  </Text>
                )}
              </View>

              <View style={styles.orderActions}>
                <Button
                  title="Modify"
                  onPress={() => handleModifyOrder(suggestion.id)}
                  variant="secondary"
                  size="small"
                  style={{ borderColor: NestSyncColors.primary.blue }}
                  textStyle={{ color: NestSyncColors.primary.blue }}
                />

                <Button
                  title="Skip"
                  onPress={() => handleSkipOrder(suggestion.id)}
                  variant="secondary"
                  size="small"
                />
              </View>
            </View>
          );
        })}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <Button
            title="Emergency Order"
            onPress={handleEmergencyOrder}
            variant="danger"
            size="medium"
            fullWidth
            icon={<Ionicons name="flash" size={20} color="#FFFFFF" />}
            iconPosition="left"
            style={{ backgroundColor: '#DC2626', borderColor: '#DC2626' }}
            textStyle={{ color: '#FFFFFF' }}
          />

          <Button
            title="View All Items"
            onPress={handleViewAllItems}
            variant="secondary"
            size="medium"
            fullWidth
            icon={<Ionicons name="list" size={20} color={theme === 'dark' ? '#FFFFFF' : '#374151'} />}
            iconPosition="left"
          />

          <Button
            title="Setup New Item"
            onPress={handleSetupNewItem}
            variant="secondary"
            size="medium"
            fullWidth
            icon={<Ionicons name="add-circle-outline" size={20} color={theme === 'dark' ? '#FFFFFF' : '#374151'} />}
            iconPosition="left"
          />

          <Button
            title="Order History"
            onPress={handleOrderHistory}
            variant="secondary"
            size="medium"
            fullWidth
            icon={<Ionicons name="time-outline" size={20} color={theme === 'dark' ? '#FFFFFF' : '#374151'} />}
            iconPosition="left"
          />
        </View>

        {/* Canadian Trust Badge */}
        <View style={styles.canadianTrustBadge}>
          <Text style={styles.canadianTrustText}>Data stored in Canada</Text>
        </View>
      </ScrollView>

      {/* Modals */}
      {selectedOrder && (
        <>
          <ModifyOrderModal
            visible={modifyModalVisible}
            onClose={() => setModifyModalVisible(false)}
            order={selectedOrder}
            onModify={handleModifySubmit}
          />

          <SkipOrderModal
            visible={skipModalVisible}
            onClose={() => setSkipModalVisible(false)}
            order={selectedOrder}
            onSkip={handleSkipSubmit}
          />
        </>
      )}

      <EmergencyOrderModal
        visible={emergencyModalVisible}
        onClose={() => setEmergencyModalVisible(false)}
        onSubmit={handleEmergencySubmit}
      />
    </View>
  );
}
