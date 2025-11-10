/**
 * Order History Screen
 * Display past reorder transactions with full details
 * Canadian pricing, PIPEDA compliance, and supportive UX for stressed parents
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useQuery } from '@apollo/client';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NestSyncColors } from '../constants/Colors';
import { useNestSyncTheme } from '../contexts/ThemeContext';
import { GET_ORDER_HISTORY } from '../lib/graphql/reorder-queries';

interface OrderHistoryProps {}

export default function OrderHistory({}: OrderHistoryProps) {
  const theme = useNestSyncTheme();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  // GraphQL query for order history
  const { data, loading, error, refetch } = useQuery(GET_ORDER_HISTORY, {
    variables: {
      limit: 20,
    },
    fetchPolicy: Platform.OS === 'web' ? 'cache-first' : 'cache-and-network',
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (err) {
      console.error('Failed to refresh order history:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleReorder = (orderId: string) => {
    console.log('Reorder:', orderId);
    // TODO: Implement reorder functionality
  };

  const handleTrackOrder = (orderId: string) => {
    console.log('Track order:', orderId);
    // TODO: Implement order tracking
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'DELIVERED':
        return NestSyncColors.secondary.green; // Success state
      case 'SHIPPED':
      case 'IN_TRANSIT':
        return NestSyncColors.primary.blue; // Active state
      case 'PENDING':
      case 'PROCESSING':
        return NestSyncColors.accent.amber; // Warning/attention state (design system)
      case 'CANCELLED':
      case 'FAILED':
        return NestSyncColors.semantic.error; // Error state
      default:
        return NestSyncColors.neutral[500]; // Neutral state
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case 'DELIVERED':
        return 'checkmark-circle';
      case 'SHIPPED':
      case 'IN_TRANSIT':
        return 'cube';
      case 'PENDING':
      case 'PROCESSING':
        return 'time';
      case 'CANCELLED':
        return 'close-circle';
      case 'FAILED':
        return 'alert-circle';
      default:
        return 'ellipse';
    }
  };

  const orders = data?.getOrderHistory || [];
  const hasOrders = orders.length > 0;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme === 'dark' ? '#1F2937' : '#F9FAFB',
    },
    scrollContent: {
      paddingBottom: 32,
    },
    // Loading State
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 14,
      color: theme === 'dark' ? '#D1D5DB' : '#6B7280',
    },
    // Error State
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    errorIcon: {
      marginBottom: 16,
    },
    errorTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme === 'dark' ? '#FFFFFF' : '#111827',
      marginBottom: 8,
      textAlign: 'center',
    },
    errorMessage: {
      fontSize: 14,
      color: theme === 'dark' ? '#D1D5DB' : '#6B7280',
      textAlign: 'center',
      marginBottom: 24,
    },
    retryButton: {
      backgroundColor: NestSyncColors.primary.blue,
      paddingVertical: 12, // md spacing (design system)
      paddingHorizontal: 24, // xxl spacing (design system)
      borderRadius: 12, // lg radius for buttons (design system)
      minHeight: 48, // Touch target minimum (design system)
    },
    retryButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    // Empty State
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
      paddingVertical: 64,
    },
    emptyIcon: {
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme === 'dark' ? '#FFFFFF' : '#111827',
      marginBottom: 8,
      textAlign: 'center',
    },
    emptyMessage: {
      fontSize: 14,
      color: theme === 'dark' ? '#D1D5DB' : '#6B7280',
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 24,
    },
    startShoppingButton: {
      backgroundColor: NestSyncColors.primary.blue,
      paddingVertical: 12, // md spacing (design system)
      paddingHorizontal: 24, // xxl spacing (design system)
      borderRadius: 12, // lg radius for buttons (design system)
      minHeight: 48, // Touch target minimum (design system)
    },
    startShoppingButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    // Order Card
    orderCard: {
      backgroundColor: theme === 'dark' ? '#374151' : '#FFFFFF',
      marginHorizontal: 16,
      marginTop: 16,
      borderRadius: 12, // lg radius for cards (design system)
      padding: 16, // lg spacing (design system)
      borderWidth: 1,
      borderColor: theme === 'dark' ? '#4B5563' : NestSyncColors.neutral[200],
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 }, // sm shadow (design system)
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    orderHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme === 'dark' ? '#4B5563' : '#E5E7EB',
    },
    orderNumber: {
      fontSize: 14,
      fontWeight: '600',
      color: theme === 'dark' ? '#FFFFFF' : '#111827',
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6, // sm radius for badges (design system)
      gap: 4,
    },
    statusText: {
      fontSize: 11, // caption size for badges (design system)
      fontWeight: '600',
      color: '#FFFFFF',
    },
    orderDetails: {
      marginBottom: 12,
    },
    retailerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    retailerText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme === 'dark' ? '#D1D5DB' : '#6B7280',
      marginLeft: 8,
    },
    dateText: {
      fontSize: 13,
      color: theme === 'dark' ? '#9CA3AF' : '#9CA3AF',
      marginBottom: 8,
    },
    itemsList: {
      marginBottom: 12,
    },
    itemRow: {
      fontSize: 13,
      color: theme === 'dark' ? '#D1D5DB' : '#374151',
      marginBottom: 4,
    },
    priceRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme === 'dark' ? '#4B5563' : '#E5E7EB',
    },
    totalLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: theme === 'dark' ? '#FFFFFF' : '#111827',
    },
    totalAmount: {
      fontSize: 16,
      fontWeight: '700',
      color: NestSyncColors.primary.blue,
    },
    orderActions: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 12,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12, // md spacing (design system)
      paddingHorizontal: 16, // lg spacing (design system)
      borderRadius: 12, // lg radius for buttons (design system)
      minHeight: 48, // Touch target minimum (design system)
      gap: 6,
    },
    primaryActionButton: {
      backgroundColor: NestSyncColors.primary.blue,
    },
    secondaryActionButton: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: theme === 'dark' ? NestSyncColors.neutral[600] : NestSyncColors.neutral[300],
    },
    actionButtonText: {
      fontSize: 14,
      fontWeight: '600',
    },
    primaryActionButtonText: {
      color: '#FFFFFF',
    },
    secondaryActionButtonText: {
      color: theme === 'dark' ? '#D1D5DB' : '#374151',
    },
    trackingInfo: {
      backgroundColor: theme === 'dark'
        ? 'rgba(8, 145, 178, 0.1)'
        : 'rgba(224, 242, 254, 0.5)',
      padding: 12,
      borderRadius: 8,
      marginTop: 12,
    },
    trackingText: {
      fontSize: 12,
      color: NestSyncColors.primary.blue,
      fontWeight: '500',
    },
  });

  // Loading State
  if (loading && !data) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen
          options={{
            title: 'Order History',
            headerShown: true,
            headerBackTitle: 'Back',
            headerStyle: {
              backgroundColor: theme === 'dark' ? NestSyncColors.neutral[900] : '#FFFFFF',
            },
            headerTintColor: theme === 'dark' ? NestSyncColors.neutral[100] : NestSyncColors.neutral[800],
            headerTitleStyle: {
              fontWeight: '600',
            },
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={NestSyncColors.primary.blue} />
          <Text style={styles.loadingText}>Loading order history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error State
  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen
          options={{
            title: 'Order History',
            headerShown: true,
            headerBackTitle: 'Back',
            headerStyle: {
              backgroundColor: theme === 'dark' ? NestSyncColors.neutral[900] : '#FFFFFF',
            },
            headerTintColor: theme === 'dark' ? NestSyncColors.neutral[100] : NestSyncColors.neutral[800],
            headerTitleStyle: {
              fontWeight: '600',
            },
          }}
        />
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={64}
            color={NestSyncColors.semantic.error}
            style={styles.errorIcon}
          />
          <Text style={styles.errorTitle}>Unable to Load Orders</Text>
          <Text style={styles.errorMessage}>
            {error.message || 'Please check your connection and try again.'}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Empty State
  if (!hasOrders) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen
          options={{
            title: 'Order History',
            headerShown: true,
            headerBackTitle: 'Back',
            headerStyle: {
              backgroundColor: theme === 'dark' ? NestSyncColors.neutral[900] : '#FFFFFF',
            },
            headerTintColor: theme === 'dark' ? NestSyncColors.neutral[100] : NestSyncColors.neutral[800],
            headerTitleStyle: {
              fontWeight: '600',
            },
          }}
        />
        <View style={styles.emptyContainer}>
          <Ionicons
            name="receipt-outline"
            size={64}
            color={theme === 'dark' ? '#6B7280' : '#D1D5DB'}
            style={styles.emptyIcon}
          />
          <Text style={styles.emptyTitle}>No Orders Yet</Text>
          <Text style={styles.emptyMessage}>
            Your order history will appear here once you place your first order through NestSync.
          </Text>
          <TouchableOpacity
            style={styles.startShoppingButton}
            onPress={() => router.back()}
          >
            <Text style={styles.startShoppingButtonText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Main Content - Order List
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          title: 'Order History',
          headerShown: true,
          headerBackTitle: 'Back',
          headerStyle: {
            backgroundColor: theme === 'dark' ? NestSyncColors.neutral[900] : '#FFFFFF',
          },
          headerTintColor: theme === 'dark' ? NestSyncColors.neutral[100] : NestSyncColors.neutral[800],
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={NestSyncColors.primary.blue}
            colors={[NestSyncColors.primary.blue]}
          />
        }
      >
        {orders.map((order: any) => (
          <View key={order.id} style={styles.orderCard}>
            {/* Order Header */}
            <View style={styles.orderHeader}>
              <Text style={styles.orderNumber}>Order #{order.orderNumber}</Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(order.status) },
                ]}
              >
                <Ionicons
                  name={getStatusIcon(order.status) as any}
                  size={12}
                  color="#FFFFFF"
                />
                <Text style={styles.statusText}>{order.status}</Text>
              </View>
            </View>

            {/* Order Details */}
            <View style={styles.orderDetails}>
              {/* Retailer */}
              <View style={styles.retailerRow}>
                <Ionicons
                  name="storefront-outline"
                  size={16}
                  color={theme === 'dark' ? '#D1D5DB' : '#6B7280'}
                />
                <Text style={styles.retailerText}>{order.retailerType || 'Online Store'}</Text>
              </View>

              {/* Order Date */}
              <Text style={styles.dateText}>
                Ordered: {formatDate(order.orderedAt)}
                {order.actualDeliveryDate && ` • Delivered: ${formatDate(order.actualDeliveryDate)}`}
              </Text>

              {/* Items */}
              <View style={styles.itemsList}>
                <Text style={styles.itemRow}>
                  • {order.totalItems} item{order.totalItems !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>

            {/* Total Price */}
            <View style={styles.priceRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalAmount}>
                ${parseFloat(order.totalAmountCad).toFixed(2)} CAD
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.orderActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.primaryActionButton]}
                onPress={() => handleReorder(order.id)}
              >
                <Ionicons name="repeat" size={16} color="#FFFFFF" />
                <Text style={[styles.actionButtonText, styles.primaryActionButtonText]}>
                  Reorder
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
