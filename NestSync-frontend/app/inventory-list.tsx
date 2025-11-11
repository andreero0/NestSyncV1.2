/**
 * Inventory List Screen - View All Items
 * Complete inventory overview with stock levels and predictions
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
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@apollo/client';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NestSyncColors } from '../constants/Colors';
import { useNestSyncTheme } from '../contexts/ThemeContext';
import { GET_INVENTORY_ITEMS_QUERY } from '../lib/graphql/queries';

export default function InventoryList() {
  const theme = useNestSyncTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const childId = params.childId as string;
  const [refreshing, setRefreshing] = useState(false);

  const { data, loading, error, refetch } = useQuery(GET_INVENTORY_ITEMS_QUERY, {
    variables: { childId, limit: 100 },
    skip: !childId,
    fetchPolicy: Platform.OS === 'web' ? 'cache-first' : 'cache-and-network',
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const getStockLevelColor = (quantity: number, threshold: number = 10) => {
    if (quantity === 0) return NestSyncColors.semantic.error;
    if (quantity <= threshold) return NestSyncColors.accent.orange;
    return NestSyncColors.secondary.green;
  };

  const getStockLevelIcon = (quantity: number, threshold: number = 10) => {
    if (quantity === 0) return 'alert-circle';
    if (quantity <= threshold) return 'warning';
    return 'checkmark-circle';
  };

  const items = data?.getInventoryItems?.edges?.map((edge: any) => edge.node) || [];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme === 'dark' ? '#1F2937' : '#F9FAFB',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
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
      marginBottom: 24,
    },
    addButton: {
      backgroundColor: NestSyncColors.primary.blue,
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: 12,
    },
    addButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    itemCard: {
      backgroundColor: theme === 'dark' ? '#374151' : '#FFFFFF',
      marginHorizontal: 16,
      marginTop: 12,
      borderRadius: 12,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      boxShadow: '0px 1px 2px rgba(0, 0, NaN, 0.05)',
      elevation: 1,
    },
    itemIcon: {
      width: 48,
      height: 48,
      borderRadius: 8,
      backgroundColor: theme === 'dark' ? '#4B5563' : '#E5E7EB',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    itemContent: {
      flex: 1,
    },
    itemName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme === 'dark' ? '#FFFFFF' : '#111827',
      marginBottom: 4,
    },
    itemDetails: {
      fontSize: 13,
      color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
      marginBottom: 2,
    },
    stockInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    stockText: {
      fontSize: 14,
      fontWeight: '600',
    },
  });

  if (loading && !data) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen
          options={{
            title: 'All Items',
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
        </View>
      </SafeAreaView>
    );
  }

  if (!items.length) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen
          options={{
            title: 'All Items',
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
            name="cube-outline"
            size={64}
            color="#D1D5DB"
            style={styles.emptyIcon}
          />
          <Text style={styles.emptyTitle}>No Inventory Items</Text>
          <Text style={styles.emptyMessage}>
            Add your first inventory item to start tracking stock levels.
          </Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/add-inventory-item')}
          >
            <Text style={styles.addButtonText}>Add First Item</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          title: 'All Items',
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={NestSyncColors.primary.blue}
          />
        }
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {items.map((item: any) => (
          <View key={item.id} style={styles.itemCard}>
            <View style={styles.itemIcon}>
              <Ionicons name="cube" size={24} color="#9CA3AF" />
            </View>
            <View style={styles.itemContent}>
              <Text style={styles.itemName}>{item.brandName || 'Diapers'}</Text>
              <Text style={styles.itemDetails}>
                Size {item.size} • {item.productType}
              </Text>
              <View style={styles.stockInfo}>
                <Ionicons
                  name={getStockLevelIcon(item.quantityRemaining) as any}
                  size={16}
                  color={getStockLevelColor(item.quantityRemaining)}
                />
                <Text
                  style={[
                    styles.stockText,
                    { color: getStockLevelColor(item.quantityRemaining) },
                  ]}
                >
                  {item.quantityRemaining} remaining
                </Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
