/**
 * AnalyticsBarChart Web Implementation (Simple)
 * Temporary simple implementation without Recharts to test platform detection
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

interface ChartDataPoint {
  x: number | string;
  y: number;
  label?: string;
}

interface AnalyticsBarChartWebSimpleProps {
  data: ChartDataPoint[];
  title?: string;
  height?: number;
  color?: string;
  gradientColors?: [string, string];
  showGradient?: boolean;
  formatXLabel?: (value: any) => string;
  formatYLabel?: (value: any) => string;
  domainPadding?: { left?: number; right?: number; top?: number; bottom?: number };
  roundedCorners?: boolean;
  animationDuration?: number;
}

export function AnalyticsBarChartWebSimple({
  data,
  title,
  height = 200,
  color,
}: AnalyticsBarChartWebSimpleProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Default theme-aware colors
  const defaultColor = color || colors.tint;

  if (data.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        {title && (
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        )}
        <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No data available
          </Text>
        </View>
      </View>
    );
  }

  // Calculate max value for scaling
  const maxValue = Math.max(...data.map(d => d.y));

  return (
    <View style={[styles.container, { height: height + (title ? 40 : 0) }]}>
      {title && (
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      )}

      <View style={[styles.chartContainer, { height }]}>
        <View style={styles.webIndicator}>
          <Text style={[styles.webText, { color: colors.text }]}>
            ✅ WEB PLATFORM - Using React Native components (no Skia/Victory Native)
          </Text>
        </View>

        <View style={styles.simpleChart}>
          {data.map((point, index) => (
            <View key={index} style={styles.barContainer}>
              <View
                style={[
                  styles.bar,
                  {
                    backgroundColor: defaultColor,
                    height: (point.y / maxValue) * (height - 80),
                  }
                ]}
              />
              <Text style={[styles.barLabel, { color: colors.text }]}>
                {String(point.x)}
              </Text>
              <Text style={[styles.barValue, { color: colors.textSecondary }]}>
                {point.y}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  chartContainer: {
    flex: 1,
    padding: 10,
  },
  webIndicator: {
    backgroundColor: '#e8f5e8',
    padding: 8,
    borderRadius: 4,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#4ade80',
  },
  webText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  simpleChart: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingBottom: 20,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 2,
  },
  bar: {
    width: '80%',
    minHeight: 10,
    borderRadius: 2,
    marginBottom: 5,
  },
  barLabel: {
    fontSize: 10,
    marginBottom: 2,
  },
  barValue: {
    fontSize: 9,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
});

export default AnalyticsBarChartWebSimple;