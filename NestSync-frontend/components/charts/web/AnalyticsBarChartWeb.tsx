/**
 * AnalyticsBarChart Web Implementation
 * Web-compatible bar chart using Recharts instead of Victory Native XL
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

interface ChartDataPoint {
  x: number | string;
  y: number;
  label?: string;
}

interface AnalyticsBarChartWebProps {
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

export function AnalyticsBarChartWeb({
  data,
  title,
  height = 200,
  color,
  gradientColors,
  showGradient = true,
  formatXLabel,
  formatYLabel,
  domainPadding = { left: 20, right: 20, top: 20 },
  roundedCorners = true,
  animationDuration = 300,
}: AnalyticsBarChartWebProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Default theme-aware colors
  const defaultColor = color || colors.tint;

  // Transform data for Recharts format
  const chartData = data.map((point, index) => ({
    name: formatXLabel ? formatXLabel(point.x) : String(point.x),
    value: point.y,
    x: point.x,
  }));

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <View style={[styles.tooltip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.tooltipLabel, { color: colors.text }]}>
            {label}
          </Text>
          <Text style={[styles.tooltipValue, { color: defaultColor }]}>
            {formatYLabel ? formatYLabel(payload[0].value) : payload[0].value}
          </Text>
        </View>
      );
    }
    return null;
  };

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

  return (
    <View style={[styles.container, { height: height + (title ? 40 : 0) }]}>
      {title && (
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      )}

      <View style={[styles.chartContainer, { height }]}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={domainPadding}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={colors.border}
              opacity={0.3}
            />
            <XAxis
              dataKey="name"
              stroke={colors.textSecondary}
              fontSize={12}
              tickFormatter={formatXLabel}
            />
            <YAxis
              stroke={colors.textSecondary}
              fontSize={12}
              tickFormatter={formatYLabel}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="value"
              fill={defaultColor}
              radius={roundedCorners ? [4, 4, 0, 0] : [0, 0, 0, 0]}
              animationDuration={animationDuration}
            />
          </BarChart>
        </ResponsiveContainer>
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
  tooltip: {
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    backgroundColor: 'white',
    boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)',
    elevation: 5,
  },
  tooltipLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  tooltipValue: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default AnalyticsBarChartWeb;