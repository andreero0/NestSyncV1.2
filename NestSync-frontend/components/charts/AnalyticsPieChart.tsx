/**
 * AnalyticsPieChart Component
 * Platform-conditional pie chart component that uses Victory Native XL for native platforms
 * and Recharts for web platform to avoid Skia/CanvasKit compatibility issues
 */

import React from 'react';
import { isWeb } from '@/utils/platform';
// import AnalyticsPieChartWeb from './web/AnalyticsPieChartWeb';

// Only import Victory Native components on native platforms
let VictoryNativePieChart: React.ComponentType<any> | null = null;
if (!isWeb()) {
  const { View, Text, StyleSheet } = require('react-native');
  const { PolarChart, Pie } = require('victory-native');
  const { LinearGradient, useFont, vec } = require('@shopify/react-native-skia');
  const { useColorScheme } = require('@/hooks/useColorScheme');
  const { Colors } = require('@/constants/Colors');

  VictoryNativePieChart = function AnalyticsPieChartNative({
    data,
    title,
    height = 200,
    showLabels = true,
    showGradients = true,
    innerRadius = 0,
    animationDuration = 300,
  }: AnalyticsPieChartProps) {
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

    // Transform data for Victory Native XL format
    const chartData = data.map((point, index) => ({
      label: point.label,
      value: point.value,
      color: point.color || defaultColors[index % defaultColors.length],
    }));

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
          <PolarChart
            data={chartData}
            labelKey="label"
            valueKey="value"
            colorKey="color"
          >
            <Pie.Chart innerRadius={innerRadius}>
              {({ slice }) => (
                <>
                  <Pie.Slice />
                  {showGradients && (
                    <LinearGradient
                      start={vec(0, 0)}
                      end={vec(0, height)}
                      colors={[slice.color, `${slice.color}80`]}
                    />
                  )}
                </>
              )}
            </Pie.Chart>
          </PolarChart>
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
                  {item.label}
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
  };

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
  });
}

interface PieDataPoint {
  label: string;
  value: number;
  color?: string;
}

interface AnalyticsPieChartProps {
  data: PieDataPoint[];
  title?: string;
  height?: number;
  showLabels?: boolean;
  showGradients?: boolean;
  innerRadius?: number;
  animationDuration?: number;
}

export function AnalyticsPieChart(props: AnalyticsPieChartProps) {
  // Platform-conditional rendering
  if (isWeb()) {
    // Temporary simple implementation for web testing
    const React = require('react');
    const { View, Text } = require('react-native');

    return React.createElement(View, {
      style: { padding: 20, backgroundColor: '#f0f0f0', borderRadius: 8, margin: 10 }
    }, [
      React.createElement(Text, {
        key: 'title',
        style: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 }
      }, props.title || 'Pie Chart'),
      React.createElement(Text, {
        key: 'status',
        style: { fontSize: 14, marginBottom: 5 }
      }, '✅ WEB PLATFORM - Pie chart would render here (avoiding recharts dependency)'),
      React.createElement(Text, {
        key: 'data',
        style: { fontSize: 14 }
      }, `Data points: ${props.data.length}`)
    ]);
  } else {
    // Render Victory Native XL version for native platforms
    if (VictoryNativePieChart) {
      return VictoryNativePieChart(props);
    } else {
      // Fallback if Victory Native fails to load
      const React = require('react');
      const { View, Text } = require('react-native');

      return React.createElement(View, {
        style: { padding: 20, backgroundColor: '#f0f0f0', borderRadius: 8, margin: 10 }
      }, [
        React.createElement(Text, {
          key: 'title',
          style: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 }
        }, props.title || 'Pie Chart'),
        React.createElement(Text, {
          key: 'fallback',
          style: { fontSize: 14 }
        }, 'Fallback: Simple implementation')
      ]);
    }
  }
}

export default AnalyticsPieChart;