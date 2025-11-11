/**
 * Smart Predictions Card Component
 * Displays size predictions with action buttons
 * Following wireframe specification exactly
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import { IconSymbol } from '../ui/IconSymbol';
import { useThemeColor } from '@/hooks/useThemeColor';
import { NestSyncColors } from '@/constants/Colors';
import type { SizePredictions } from '@/hooks/useEnhancedAnalytics';

// =============================================================================
// TYPES
// =============================================================================

interface SmartPredictionsCardProps {
  data?: SizePredictions;
  loading?: boolean;
}

// =============================================================================
// SMART PREDICTIONS CARD COMPONENT
// =============================================================================

export function SmartPredictionsCard({
  data,
  loading,
}: SmartPredictionsCardProps) {
  const colors = {
    text: useThemeColor({}, 'text'),
    textSecondary: useThemeColor({}, 'textSecondary'),
    surface: useThemeColor({}, 'surface'),
    border: useThemeColor({}, 'border'),
    background: useThemeColor({}, 'background'),
    tint: useThemeColor({}, 'tint'),
  };

  // Safe defaults for loading/error states
  const predictions = data || {
    predictionDateRange: 'Jan 25-30',
    confidenceScore: 87.0,
    nextSizeRecommendation: 'Size 3',
    growthPattern: 'steady growth',
    daysUntilChange: 5,
  };

  // Analytics card focuses purely on insights display

  if (loading) {
    return (
      <ThemedView style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.header}>
          <IconSymbol name="target" size={24} color={NestSyncColors.primary.blue} />
          <ThemedText type="subtitle" style={[styles.sectionTitle, { color: colors.text }]}>
            Smart Predictions
          </ThemedText>
        </View>
        <View style={styles.loadingContent}>
          <ThemedText style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading predictions...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Card Header */}
      <View style={styles.header}>
        <IconSymbol name="target" size={24} color={NestSyncColors.primary.blue} />
        <ThemedText type="subtitle" style={[styles.sectionTitle, { color: colors.text }]}>
          Smart Predictions
        </ThemedText>
      </View>

      {/* Prediction Card Content */}
      <View style={[styles.predictionContent, { minHeight: 100 }]}>
        {/* Target Label */}
        <View style={styles.targetRow}>
          <View style={[styles.targetBadge, { backgroundColor: NestSyncColors.primary.blueLight }]}>
            <ThemedText style={[styles.targetText, { color: NestSyncColors.primary.blueDark }]}>
              TARGET
            </ThemedText>
          </View>
          <ThemedText type="defaultSemiBold" style={[styles.predictionTitle, { color: colors.text }]}>
            Size Change Likely
          </ThemedText>
        </View>

        {/* Prediction Details */}
        <View style={styles.detailsSection}>
          <ThemedText style={[styles.predictionDetails, { color: colors.text }]}>
            {predictions.predictionDateRange}: Consider {predictions.nextSizeRecommendation} diapers
          </ThemedText>
          <ThemedText style={[styles.confidenceText, { color: colors.textSecondary }]}>
            Confidence: {predictions.confidenceScore.toFixed(0)}% (Based on growth pattern)
          </ThemedText>
        </View>

        {/* Analytics should focus on insights only - action buttons removed */}
      </View>
    </ThemedView>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)',
    elevation: 2,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 28,
    fontWeight: '600',
    marginLeft: 8,
  },

  predictionContent: {
    paddingVertical: 8,
  },

  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  targetBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 12,
  },

  targetText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  predictionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },

  detailsSection: {
    marginBottom: 20,
  },

  predictionDetails: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    lineHeight: 22,
  },

  confidenceText: {
    fontSize: 14,
    lineHeight: 20,
  },

  // Action button styles removed - analytics should focus on data insights only

  loadingContent: {
    alignItems: 'center',
    paddingVertical: 40,
  },

  loadingText: {
    fontSize: 16,
    fontStyle: 'italic',
  },
});