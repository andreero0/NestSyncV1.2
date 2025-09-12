import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { StatusOverviewGrid } from '@/components/cards/StatusOverviewGrid';
import { StatusOverviewCardProps } from '@/components/cards/StatusOverviewCard';
import { Colors, NestSyncColors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

// Mock data to test the fixed-size grid system
const mockTrafficLightCards: StatusOverviewCardProps[] = [
  {
    statusType: 'critical',
    title: 'Critical Items',
    count: 3,
    description: 'Items need attention soon',
    iconName: 'exclamationmark.triangle.fill',
    borderColor: NestSyncColors.trafficLight.critical,
    testID: 'critical-items-card',
  },
  {
    statusType: 'low', 
    title: 'Low Stock',
    count: 12,
    description: 'Plan to restock these items',
    iconName: 'clock.fill',
    borderColor: NestSyncColors.trafficLight.low,
    testID: 'low-stock-card',
  },
  {
    statusType: 'stocked',
    title: 'Well Stocked', 
    count: 48,
    description: "You're prepared!",
    iconName: 'checkmark.circle.fill',
    borderColor: NestSyncColors.trafficLight.stocked,
    testID: 'well-stocked-card',
  },
  {
    statusType: 'pending',
    title: 'Pending Orders',
    count: 5,
    description: 'Help is on the way',
    iconName: 'shippingbox.fill',
    borderColor: NestSyncColors.trafficLight.pending,
    testID: 'pending-orders-card',
  },
];

// Cards with varying content to test fixed sizing
const mockVaryingContentCards: StatusOverviewCardProps[] = [
  {
    statusType: 'critical',
    title: 'Critical',
    count: 999,
    description: 'Very long description text that would normally cause dynamic sizing issues',
    iconName: 'exclamationmark.triangle.fill',
    borderColor: NestSyncColors.trafficLight.critical,
    testID: 'critical-varying',
  },
  {
    statusType: 'low',
    title: 'Low',
    count: 1,
    description: 'Short',
    iconName: 'clock.fill', 
    borderColor: NestSyncColors.trafficLight.low,
    testID: 'low-varying',
  },
  {
    statusType: 'stocked',
    title: 'Really Long Title That Tests Truncation',
    count: 12345,
    description: 'Medium length description',
    iconName: 'checkmark.circle.fill',
    borderColor: NestSyncColors.trafficLight.stocked,
    testID: 'stocked-varying',
  },
  {
    statusType: 'pending',
    title: 'Orders',
    count: 0,
    description: '',
    iconName: 'shippingbox.fill',
    borderColor: NestSyncColors.trafficLight.pending,
    testID: 'pending-varying',
  },
];

export default function CardTestScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <ThemedView style={styles.header}>
            <ThemedText type="title" style={styles.headerTitle}>
              Fixed Card Sizing Test
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
              Testing consistent 160×120px card dimensions
            </ThemedText>
          </ThemedView>

          {/* Standard Content Test */}
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Standard Content
            </ThemedText>
            <ThemedText style={[styles.sectionDescription, { color: colors.textSecondary }]}>
              Normal card content with consistent values
            </ThemedText>
            <StatusOverviewGrid cards={mockTrafficLightCards} />
          </ThemedView>

          {/* Varying Content Test */}
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Varying Content Test
            </ThemedText>
            <ThemedText style={[styles.sectionDescription, { color: colors.textSecondary }]}>
              Cards with different content lengths - all should remain the same size
            </ThemedText>
            <StatusOverviewGrid cards={mockVaryingContentCards} />
          </ThemedView>

          {/* Specifications */}
          <ThemedView style={[styles.specsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <ThemedText type="defaultSemiBold" style={styles.specsTitle}>
              Fixed Grid Specifications
            </ThemedText>
            
            <View style={styles.specRow}>
              <ThemedText style={[styles.specLabel, { color: colors.textSecondary }]}>
                Card Size:
              </ThemedText>
              <ThemedText style={styles.specValue}>
                160×120px (4:3 aspect ratio)
              </ThemedText>
            </View>
            
            <View style={styles.specRow}>
              <ThemedText style={[styles.specLabel, { color: colors.textSecondary }]}>
                Grid Layout:
              </ThemedText>
              <ThemedText style={styles.specValue}>
                2×2 grid with flexWrap
              </ThemedText>
            </View>
            
            <View style={styles.specRow}>
              <ThemedText style={[styles.specLabel, { color: colors.textSecondary }]}>
                Spacing:
              </ThemedText>
              <ThemedText style={styles.specValue}>
                16px gaps, 20px container padding
              </ThemedText>
            </View>
            
            <View style={styles.specRow}>
              <ThemedText style={[styles.specLabel, { color: colors.textSecondary }]}>
                Visual Hierarchy:
              </ThemedText>
              <ThemedText style={styles.specValue}>
                32px icons, 36px numbers, 14px labels
              </ThemedText>
            </View>
            
            <View style={styles.specRow}>
              <ThemedText style={[styles.specLabel, { color: colors.textSecondary }]}>
                Background Colors:
              </ThemedText>
              <ThemedText style={styles.specValue}>
                Traffic light tints (5-10% opacity)
              </ThemedText>
            </View>
          </ThemedView>

          {/* Bottom spacing */}
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
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
    paddingHorizontal: 20,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  specsCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  specsTitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  specLabel: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  specValue: {
    fontSize: 14,
    fontWeight: '400',
    flex: 1.5,
    textAlign: 'right',
  },
});