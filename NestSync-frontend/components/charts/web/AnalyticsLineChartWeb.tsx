/**
 * AnalyticsLineChart Web Implementation
 * Web-compatible line chart using Recharts instead of Victory Native XL
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Dot
} from 'recharts';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

interface ChartDataPoint {
  x: number;
  y: number;
  label?: string;
}

interface AnalyticsLineChartWebProps {
  data: ChartDataPoint[];
  title?: string;
  height?: number;
  color?: string;
  strokeWidth?: number;
  showPoints?: boolean;
  showTooltip?: boolean;
  formatXLabel?: (value: any) => string;
  formatYLabel?: (value: any) => string;
  curveType?: 'linear' | 'natural' | 'step';
  animationDuration?: number;
}

export function AnalyticsLineChartWeb({
  data,
  title,
  height = 200,
  color,
  strokeWidth = 3,
  showPoints = true,
  showTooltip = true,
  formatXLabel,
  formatYLabel,
  curveType = 'natural',
  animationDuration = 300,
}: AnalyticsLineChartWebProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Default theme-aware color
  const lineColor = color || colors.tint;

  // Transform data for Recharts format
  const chartData = data.map((point) => ({
    name: formatXLabel ? formatXLabel(point.x) : String(point.x),
    value: point.y,
    x: point.x,
  }));

  // Map curve types to Recharts types
  const curveTypeMap = {
    linear: 'linear',
    natural: 'monotone',
    step: 'step',
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <View style={[styles.tooltip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.tooltipLabel, { color: colors.text }]}>
            {label}
          </Text>
          <Text style={[styles.tooltipValue, { color: lineColor }]}>
            {formatYLabel ? formatYLabel(payload[0].value) : payload[0].value}
          </Text>
        </View>
      );
    }
    return null;
  };

  // Custom dot component for line points
  const CustomDot = (props: any) => {
    if (!showPoints) return null;

    const { cx, cy } = props;
    return (
      <Dot
        cx={cx}
        cy={cy}
        r={4}
        fill={lineColor}
        stroke="white"
        strokeWidth={2}
      />
    );
  };

  if (data.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        {title && (
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        )}
        <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No trend data available
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
          <LineChart
            data={chartData}
            margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
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
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            <Line
              type={curveTypeMap[curveType]}
              dataKey="value"
              stroke={lineColor}
              strokeWidth={strokeWidth}
              dot={showPoints ? <CustomDot /> : false}
              activeDot={{ r: 6, fill: lineColor }}
              animationDuration={animationDuration}
            />
          </LineChart>
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
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
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

export default AnalyticsLineChartWeb;