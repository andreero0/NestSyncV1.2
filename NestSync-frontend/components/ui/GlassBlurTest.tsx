/**
 * Glass Blur Test Component
 * 
 * Simple test component to verify expo-blur is working correctly.
 * This component can be used during development to test blur rendering.
 * 
 * Usage:
 * ```tsx
 * import { GlassBlurTest } from '@/components/ui/GlassBlurTest';
 * 
 * // In your screen
 * <GlassBlurTest />
 * ```
 */

import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { GlassUITokens } from '@/constants/GlassUI';

export function GlassBlurTest() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Glass Blur Test</Text>
      <Text style={styles.subtitle}>Platform: {Platform.OS}</Text>
      
      {/* Test light blur */}
      <View style={styles.testSection}>
        <Text style={styles.label}>Light Blur (10)</Text>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={GlassUITokens.blur.light} style={styles.blurBox}>
            <Text style={styles.blurText}>iOS Native Blur</Text>
          </BlurView>
        ) : (
          <View style={[styles.blurBox, styles.androidFallback]}>
            <Text style={styles.blurText}>Android Gradient</Text>
          </View>
        )}
      </View>

      {/* Test medium blur */}
      <View style={styles.testSection}>
        <Text style={styles.label}>Medium Blur (20)</Text>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={GlassUITokens.blur.medium} style={styles.blurBox}>
            <Text style={styles.blurText}>iOS Native Blur</Text>
          </BlurView>
        ) : (
          <View style={[styles.blurBox, styles.androidFallback]}>
            <Text style={styles.blurText}>Android Gradient</Text>
          </View>
        )}
      </View>

      {/* Test heavy blur */}
      <View style={styles.testSection}>
        <Text style={styles.label}>Heavy Blur (40)</Text>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={GlassUITokens.blur.heavy} style={styles.blurBox}>
            <Text style={styles.blurText}>iOS Native Blur</Text>
          </BlurView>
        ) : (
          <View style={[styles.blurBox, styles.androidFallback]}>
            <Text style={styles.blurText}>Android Gradient</Text>
          </View>
        )}
      </View>

      <Text style={styles.status}>
        {Platform.OS === 'ios' 
          ? '✅ Native blur supported' 
          : '⚠️ Using gradient fallback'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#E0F2FE',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0891B2',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
  },
  testSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  blurBox: {
    height: 100,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  androidFallback: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  blurText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0891B2',
  },
  status: {
    fontSize: 14,
    color: '#059669',
    marginTop: 20,
    textAlign: 'center',
  },
});
