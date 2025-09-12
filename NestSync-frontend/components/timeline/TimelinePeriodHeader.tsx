/**
 * Timeline Period Header Component
 * 
 * Minimal period separator for grouping timeline activities.
 * Simple text header with consistent spacing and accessibility support.
 */

import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import type { TimePeriod } from '@/types/timeline';

export interface TimelinePeriodHeaderProps {
  period: TimePeriod;
  testID?: string;
}

export function TimelinePeriodHeader({
  period,
  testID,
}: TimelinePeriodHeaderProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Format period subtitle with activity count
  const subtitle = `${period.events.length} ${period.events.length === 1 ? 'activity' : 'activities'}`;

  return (
    <View
      style={[styles.container, { backgroundColor: colors.surface }]}
      accessible={true}
      accessibilityRole="header"
      accessibilityLabel={`${period.label} section with ${subtitle}`}
      testID={testID}
    >
      <View style={styles.content}>
        <Text
          style={[styles.title, { color: colors.textEmphasis }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {period.label}
        </Text>
        <Text
          style={[styles.subtitle, { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
    flex: 1,
    ...Platform.select({
      ios: {
        fontFamily: '-apple-system',
      },
      android: {
        fontFamily: 'sans-serif-medium',
      },
    }),
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 16,
    marginLeft: 12,
    ...Platform.select({
      ios: {
        fontFamily: '-apple-system',
      },
      android: {
        fontFamily: 'sans-serif',
      },
    }),
  },
});