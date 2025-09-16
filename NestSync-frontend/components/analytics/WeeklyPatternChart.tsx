/**
 * Weekly Pattern Chart Component
 * Visualizes daily diaper change patterns with dot visualization (●●●●●●●○)
 * Following wireframe specification exactly
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '../ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { NestSyncColors } from '@/constants/Colors';

// =============================================================================
// TYPES
// =============================================================================

interface WeeklyPatternChartProps {
  dailyCounts: number[];
  daysOfWeek: string[];
  weeklyAverage: number;
}

// =============================================================================
// WEEKLY PATTERN CHART COMPONENT
// =============================================================================

export function WeeklyPatternChart({
  dailyCounts,
  daysOfWeek,
  weeklyAverage,
}: WeeklyPatternChartProps) {
  const colors = {
    text: useThemeColor({}, 'text'),
    textSecondary: useThemeColor({}, 'textSecondary'),
    primary: NestSyncColors.primary.blue,
    surface: useThemeColor({}, 'surface'),
  };

  // Determine which days are outliers (significantly below average)
  const getPatternDot = (count: number) => {
    const isOutlier = count < weeklyAverage * 0.8; // 20% below average
    return isOutlier ? '○' : '●';
  };

  return (
    <View style={styles.container}>
      {/* Pattern Visualization */}
      <View style={styles.patternRow}>
        <ThemedText style={[styles.patternLabel, { color: colors.textSecondary }]}>
          Pattern Chart (Last 7 Days)
        </ThemedText>
        <View style={styles.dotsContainer}>
          {dailyCounts.map((count, index) => (
            <ThemedText
              key={index}
              style={[
                styles.patternDot,
                { color: getPatternDot(count) === '●' ? colors.primary : colors.textSecondary }
              ]}
            >
              {getPatternDot(count)}
            </ThemedText>
          ))}
        </View>
      </View>

      {/* Day Labels */}
      <View style={styles.labelsContainer}>
        {daysOfWeek.map((day, index) => (
          <View key={index} style={styles.dayColumn}>
            <ThemedText style={[styles.dayLabel, { color: colors.textSecondary }]}>
              {day}
            </ThemedText>
          </View>
        ))}
      </View>

      {/* Daily Counts */}
      <View style={styles.countsContainer}>
        {dailyCounts.map((count, index) => (
          <View key={index} style={styles.countColumn}>
            <ThemedText style={[styles.countValue, { color: colors.text }]}>
              {count}
            </ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },

  patternRow: {
    marginBottom: 12,
  },

  patternLabel: {
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'left',
  },

  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },

  patternDot: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },

  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },

  dayColumn: {
    flex: 1,
    alignItems: 'center',
  },

  dayLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },

  countsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  countColumn: {
    flex: 1,
    alignItems: 'center',
  },

  countValue: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});