import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusOverviewGrid } from './StatusOverviewGrid';
import { StatusOverviewCardProps } from './StatusOverviewCard';
import { NestSyncColors } from '@/constants/Colors';

// Mock data for testing the fixed-size grid
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
    count: 7,
    description: 'Plan to restock these items',
    iconName: 'clock.fill',
    borderColor: NestSyncColors.trafficLight.low,
    testID: 'low-stock-card',
  },
  {
    statusType: 'stocked',
    title: 'Well Stocked',
    count: 24,
    description: "You're prepared!",
    iconName: 'checkmark.circle.fill',
    borderColor: NestSyncColors.trafficLight.stocked,
    testID: 'well-stocked-card',
  },
  {
    statusType: 'pending',
    title: 'Pending Orders',
    count: 2,
    description: 'Help is on the way',
    iconName: 'shippingbox.fill',
    borderColor: NestSyncColors.trafficLight.pending,
    testID: 'pending-orders-card',
  },
];

/**
 * Test component to demonstrate the fixed-size traffic light grid
 * This shows how all cards maintain consistent 160x120px dimensions
 * regardless of content length or device size
 */
export function StatusOverviewGridTest() {
  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.headerText}><Text>Fixed-Size Traffic Light Grid Test</Text></View>
          <View style={styles.headerSubtext}><Text>
            All cards are exactly 160×120px with consistent spacing
          </Text></View>
        </View>
        
        <StatusOverviewGrid cards={mockTrafficLightCards} />
        
        <View style={styles.specs}>
          <View style={styles.specItem}>
            <View style={styles.specLabel}><Text>Card Size:</Text></View>
            <View style={styles.specValue}><Text>160×120px (4:3 aspect ratio)</Text></View>
          </View>
          <View style={styles.specItem}>
            <View style={styles.specLabel}><Text>Grid Gap:</Text></View>
            <View style={styles.specValue}><Text>16px between cards</Text></View>
          </View>
          <View style={styles.specItem}>
            <View style={styles.specLabel}><Text>Container Padding:</Text></View>
            <View style={styles.specValue}><Text>20px edge padding</Text></View>
          </View>
          <View style={styles.specItem}>
            <View style={styles.specLabel}><Text>Layout:</Text></View>
            <View style={styles.specValue}><Text>2×2 grid on all screen sizes</Text></View>
          </View>
        </View>
        
        <View style={styles.note}>
          <View style={styles.noteText}><Text>
            Note: Cards maintain fixed dimensions and do not dynamically resize 
            based on content length or screen size. This ensures consistent 
            visual hierarchy and scannable layout for stressed parents.
          </Text></View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 20,
  },
  
  section: {
    marginBottom: 24,
  },
  
  sectionHeader: {
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  
  headerText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  
  headerSubtext: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  
  specs: {
    marginTop: 20,
    paddingHorizontal: 20,
    backgroundColor: '#F9FAFB',
    paddingVertical: 16,
    borderRadius: 12,
    marginHorizontal: 20,
  },
  
  specItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  
  specLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  
  specValue: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  
  note: {
    marginTop: 16,
    paddingHorizontal: 20,
  },
  
  noteText: {
    fontSize: 12,
    color: '#9CA3AF',
    lineHeight: 18,
    fontStyle: 'italic',
  },
});