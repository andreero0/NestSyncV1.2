/**
 * AnalyticsPieChart Web Implementation
 * Web-compatible pie chart using Recharts instead of Victory Native XL
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip
} from 'recharts';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

interface PieDataPoint {
  label: string;
  value: number;
  color?: string;
}

interface AnalyticsPieChartWebProps {
  data: PieDataPoint[];
  title?: string;
  height?: number;
  showLabels?: boolean;
  showGradients?: boolean;
  innerRadius?: number;
  animationDuration?: number;
}

export function AnalyticsPieChartWeb({
  data,
  title,
  height = 200,
  showLabels = true,
  showGradients = true,
  innerRadius = 0,
  animationDuration = 300,
}: AnalyticsPieChartWebProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Default colors for pie slices
  const defaultColors = [
    '#0891B2', // Primary blue
    '#06B6D4', // Cyan
    '#3B82F6', // Blue
    '#8B5CF6', // Purple
    '#EF4444', // Red
    '#F59E0B', // Amber
    '#10B981', // Emerald
    '#F97316', // Orange
  ];

  // Transform data for Recharts format
  const chartData = data.map((point, index) => ({
    name: point.label,
    value: point.value,
    color: point.color || defaultColors[index % defaultColors.length],
  }));

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <View style={[styles.tooltip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.tooltipLabel, { color: colors.text }]}>
            {data.name}
          </Text>
          <Text style={[styles.tooltipValue, { color: data.payload.color }]}>
            {data.value}
          </Text>
        </View>
      );
    }
    return null;
  };

  // Custom label component
  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null; // Don't show labels for slices smaller than 5%

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill={colors.text}
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={12}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
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
            No distribution data available
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height: height + (title ? 40 : 0) + (showLabels ? 100 : 0) }]}>
      {title && (
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      )}

      <View style={[styles.chartContainer, { height }]}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={showLabels ? <CustomLabel /> : false}
              outerRadius={Math.min(height * 0.4, 80)}
              innerRadius={innerRadius}
              fill="#8884d8"
              dataKey="value"
              animationDuration={animationDuration}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </View>

      {showLabels && (
        <View style={styles.legend}>
          {chartData.map((item, index) => (
            <View key={index} style={styles.legendItem}>
              <View
                style={[
                  styles.legendColor,
                  { backgroundColor: item.color },
                ]}
              />
              <Text style={[styles.legendLabel, { color: colors.text }]}>
                {item.name}
              </Text>
              <Text style={[styles.legendValue, { color: colors.textSecondary }]}>
                {item.value}
              </Text>
            </View>
          ))}
        </View>
      )}
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
    alignItems: 'center',
    justifyContent: 'center',
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
  legend: {
    marginTop: 16,
    paddingHorizontal: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  legendValue: {
    fontSize: 14,
    fontWeight: '600',
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

export default AnalyticsPieChartWeb;