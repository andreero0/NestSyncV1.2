/**
 * Platform Test Page
 * Simple test to verify platform detection works
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { isWeb, isNative, getPlatform, getChartConfig } from '@/utils/platform';

export default function PlatformTestPage() {
  const chartConfig = getChartConfig();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.header}>Platform Detection Test</Text>

        <View style={styles.section}>
          <Text style={styles.label}>Platform OS:</Text>
          <Text style={styles.value}>{getPlatform()}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Is Web:</Text>
          <Text style={styles.value}>{isWeb() ? 'Yes' : 'No'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Is Native:</Text>
          <Text style={styles.value}>{isNative() ? 'Yes' : 'No'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Chart Config:</Text>
          <Text style={styles.value}>
            Library: {chartConfig.preferredLibrary}{'\n'}
            Supports Skia: {chartConfig.supportsSkia ? 'Yes' : 'No'}{'\n'}
            Supports Victory Native: {chartConfig.supportsVictoryNative ? 'Yes' : 'No'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Expected Behavior:</Text>
          <Text style={styles.value}>
            {isWeb()
              ? 'On web: Should use Recharts, avoid Victory Native XL Skia errors'
              : 'On native: Should use Victory Native XL with Skia support'
            }
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  section: {
    marginBottom: 20,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  value: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});