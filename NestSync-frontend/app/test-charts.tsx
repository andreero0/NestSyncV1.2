/**
 * Test Charts Page
 * Simple test page to verify chart functionality works on web platform
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AnalyticsBarChart from '@/components/charts/AnalyticsBarChart';
import AnalyticsLineChart from '@/components/charts/AnalyticsLineChart';
import AnalyticsPieChart from '@/components/charts/AnalyticsPieChart';

// Sample data for testing
const barData = [
  { x: 'Mon', y: 20, label: 'Monday' },
  { x: 'Tue', y: 35, label: 'Tuesday' },
  { x: 'Wed', y: 25, label: 'Wednesday' },
  { x: 'Thu', y: 45, label: 'Thursday' },
  { x: 'Fri', y: 30, label: 'Friday' },
];

const lineData = [
  { x: 1, y: 10 },
  { x: 2, y: 25 },
  { x: 3, y: 15 },
  { x: 4, y: 35 },
  { x: 5, y: 30 },
  { x: 6, y: 40 },
];

const pieData = [
  { label: 'Diapers', value: 45, color: '#0891B2' },
  { label: 'Food', value: 30, color: '#06B6D4' },
  { label: 'Sleep', value: 15, color: '#3B82F6' },
  { label: 'Play', value: 10, color: '#8B5CF6' },
];

export default function TestChartsPage() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.header}>Chart Platform Test</Text>
        <Text style={styles.subheader}>Testing Victory Native XL / Recharts platform compatibility</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bar Chart Test</Text>
          <AnalyticsBarChart
            data={barData}
            title="Weekly Activity"
            height={200}
            showGradient={true}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Line Chart Test</Text>
          <AnalyticsLineChart
            data={lineData}
            title="Trend Analysis"
            height={200}
            showTooltip={true}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pie Chart Test</Text>
          <AnalyticsPieChart
            data={pieData}
            title="Distribution"
            height={200}
            showLabels={true}
          />
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
    marginBottom: 30,
    color: '#666',
  },
  section: {
    marginBottom: 40,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.1)',
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
});