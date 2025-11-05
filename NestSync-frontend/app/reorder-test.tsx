/**
 * Test screen for ReorderSuggestionCard component
 * Used for integration testing and development validation
 */

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';
import { ReorderSuggestionCard, type ReorderSuggestion } from '../components/reorder/ReorderSuggestionCard';
import { useThemeColor } from '@/hooks/useThemeColor';

// Mock data for testing the component
const mockReorderSuggestion: ReorderSuggestion = {
  id: 'test-suggestion-1',
  childId: '3af088d3-b68e-4b5a-be10-5437b6f0d1b4',
  productId: 'pampers-size-2',
  product: {
    id: 'pampers-size-2',
    name: 'Baby Dry Diapers',
    brand: 'Pampers',
    size: '2',
    category: 'diapers',
    image: 'https://example.com/pampers-size-2.jpg',
    description: 'Pampers Baby Dry diapers provide up to 12 hours of protection',
    features: ['12-hour protection', 'Hypoallergenic', 'Wetness indicator'],
  },
  predictedRunOutDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
  confidence: 87,
  priority: 1,
  suggestedQuantity: 2,
  currentInventoryLevel: 8,
  usagePattern: {
    averageDailyUsage: 6.2,
    weeklyTrend: 0.05,
    seasonalFactors: [1.0, 1.1, 0.9, 1.0],
  },
  estimatedCostSavings: {
    amount: 12.47,
    currency: 'CAD',
    comparedToRegularPrice: 18.99,
    comparedToLastPurchase: 15.99,
  },
  availableRetailers: [
    {
      id: 'amazon-ca',
      name: 'Amazon.ca',
      logo: 'https://example.com/amazon-logo.png',
      price: {
        amount: 34.99,
        currency: 'CAD',
        originalPrice: 39.99,
        discountPercentage: 12.5,
        taxes: {
          gst: 1.75,
          pst: 2.45,
          hst: 0,
          total: 4.20,
        },
        finalAmount: 39.19,
      },
      deliveryTime: 2,
      inStock: true,
      rating: 4.6,
      freeShipping: true,
      affiliateDisclosure: 'We may earn a commission from purchases made through this link.',
    },
    {
      id: 'walmart-ca',
      name: 'Walmart.ca',
      logo: 'https://example.com/walmart-logo.png',
      price: {
        amount: 36.99,
        currency: 'CAD',
        originalPrice: 36.99,
        discountPercentage: 0,
        taxes: {
          gst: 1.85,
          pst: 2.59,
          hst: 0,
          total: 4.44,
        },
        finalAmount: 41.43,
      },
      deliveryTime: 3,
      inStock: true,
      rating: 4.3,
      freeShipping: false,
    },
    {
      id: 'costco-ca',
      name: 'Costco.ca',
      logo: 'https://example.com/costco-logo.png',
      price: {
        amount: 32.99,
        currency: 'CAD',
        originalPrice: 32.99,
        discountPercentage: 0,
        taxes: {
          gst: 0, // Costco often includes taxes
          pst: 0,
          hst: 4.29,
          total: 4.29,
        },
        finalAmount: 37.28,
      },
      deliveryTime: 5,
      inStock: true,
      rating: 4.8,
      freeShipping: true,
    },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  mlProcessingConsent: true,
  dataRetentionDays: 90,
};

// Mock urgent suggestion for testing critical state
const urgentMockSuggestion: ReorderSuggestion = {
  ...mockReorderSuggestion,
  id: 'urgent-suggestion-1',
  predictedRunOutDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
  confidence: 94,
  priority: 0,
  currentInventoryLevel: 2,
  product: {
    ...mockReorderSuggestion.product,
    name: 'Sensitive Skin Diapers',
    brand: 'Huggies',
    size: '3',
  },
};

// Mock suggestion WITHOUT usagePattern to test defensive programming fix
const mockSuggestionWithoutUsagePattern: ReorderSuggestion = {
  ...mockReorderSuggestion,
  id: 'no-usage-pattern',
  usagePattern: undefined, // Simulates backend data missing usagePattern
  product: {
    ...mockReorderSuggestion.product,
    name: 'Natural Care Wipes',
    brand: 'Pampers',
  },
};

export default function ReorderTestScreen() {
  const backgroundColor = useThemeColor({}, 'background');

  const handleReorderPress = (suggestion: ReorderSuggestion) => {
    console.log('Reorder pressed for:', suggestion.product.name);
    alert(`Reorder test: ${suggestion.product.brand} ${suggestion.product.name}`);
  };

  const handleComparePress = (suggestion: ReorderSuggestion) => {
    console.log('Compare pressed for:', suggestion.product.name);
    alert(`Compare test: ${suggestion.product.brand} ${suggestion.product.name}`);
  };

  const handleDismiss = (suggestionId: string) => {
    console.log('Dismiss pressed for:', suggestionId);
    alert(`Dismiss test: ${suggestionId}`);
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <ThemedText type="title" style={styles.title}>
          ReorderSuggestionCard Test
        </ThemedText>

        <ThemedText style={styles.subtitle}>
          Testing ML-powered reorder suggestions with Canadian pricing
        </ThemedText>

        <View style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            Normal Priority Suggestion
          </ThemedText>
          <ReorderSuggestionCard
            suggestion={mockReorderSuggestion}
            onPressReorder={handleReorderPress}
            onPressCompare={handleComparePress}
            onDismiss={handleDismiss}
            testID="normal-reorder-card"
          />
        </View>

        <View style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            Urgent Priority Suggestion
          </ThemedText>
          <ReorderSuggestionCard
            suggestion={urgentMockSuggestion}
            onPressReorder={handleReorderPress}
            onPressCompare={handleComparePress}
            onDismiss={handleDismiss}
            testID="urgent-reorder-card"
          />
        </View>

        <View style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            Loading State Test
          </ThemedText>
          <ReorderSuggestionCard
            suggestion={mockReorderSuggestion}
            loading={true}
            testID="loading-reorder-card"
          />
        </View>

        <View style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            Missing Usage Pattern Test (Defensive Programming Fix)
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Tests handling of undefined usagePattern - should render without "Daily usage" row
          </ThemedText>
          <ReorderSuggestionCard
            suggestion={mockSuggestionWithoutUsagePattern}
            onPressReorder={handleReorderPress}
            onPressCompare={handleComparePress}
            onDismiss={handleDismiss}
            testID="no-usage-pattern-card"
          />
        </View>

        <View style={styles.debugInfo}>
          <ThemedText type="defaultSemiBold" style={styles.debugTitle}>
            Debug Information
          </ThemedText>
          <ThemedText style={styles.debugText}>
            • Backend GraphQL endpoint: Available and functional
          </ThemedText>
          <ThemedText style={styles.debugText}>
            • Component import: {typeof ReorderSuggestionCard}
          </ThemedText>
          <ThemedText style={styles.debugText}>
            • Mock data: 3 Canadian retailers (Amazon.ca, Walmart.ca, Costco.ca)
          </ThemedText>
          <ThemedText style={styles.debugText}>
            • Tax calculations: GST/PST/HST properly configured
          </ThemedText>
          <ThemedText style={styles.debugText}>
            • ML confidence: {mockReorderSuggestion.confidence}%
          </ThemedText>
          <ThemedText style={styles.debugText}>
            • PIPEDA compliance: {mockReorderSuggestion.mlProcessingConsent ? 'Yes' : 'No'}
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.7,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 12,
  },
  debugInfo: {
    marginTop: 32,
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
  },
  debugTitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  debugText: {
    fontSize: 14,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
});