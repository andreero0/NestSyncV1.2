/**
 * Simple Chart Test Page
 * Test platform-conditional chart rendering without Recharts
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { isWeb, getPlatform } from '@/utils/platform';
import AnalyticsBarChart from '@/components/charts/AnalyticsBarChart';

// Sample data for testing
const barData = [
  { x: 'Mon', y: 20, label: 'Monday' },
  { x: 'Tue', y: 35, label: 'Tuesday' },
  { x: 'Wed', y: 25, label: 'Wednesday' },
  { x: 'Thu', y: 45, label: 'Thursday' },
  { x: 'Fri', y: 30, label: 'Friday' },
];

export default function SimpleChartTestPage() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.header}>Victory Native XL / Web Chart Test</Text>
        <Text style={styles.subheader}>Platform: {getPlatform()}</Text>
        <Text style={styles.subheader}>Web Platform: {isWeb() ? 'Yes' : 'No'}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Platform-Conditional Bar Chart</Text>
          <Text style={styles.description}>
            {isWeb()
              ? 'This should render using React Native components on web (no Skia/Victory Native XL)'
              : 'This should render using Victory Native XL with Skia on native platforms'
            }
          </Text>

          <AnalyticsBarChart
            data={barData}
            title="Weekly Activity Test"
            height={200}
            showGradient={true}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Results</Text>
          <Text style={styles.description}>
            ✅ If you can see this page without XYWHRect errors, the platform detection is working!{'\n\n'}
            ✅ The chart above should show different implementations based on platform{'\n\n'}
            ✅ On web: Simple React Native components{'\n'}
            ✅ On native: Victory Native XL with Skia support
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  subheader: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
    color: '#666',
  },
  section: {
    marginBottom: 30,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 15,
  },
});