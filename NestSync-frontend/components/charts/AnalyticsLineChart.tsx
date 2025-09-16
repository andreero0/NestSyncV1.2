/**
 * AnalyticsLineChart Component
 * Platform-conditional line chart component that uses Victory Native XL for native platforms
 * and Recharts for web platform to avoid Skia/CanvasKit compatibility issues
 */

import React from 'react';
import { isWeb } from '@/utils/platform';
// import AnalyticsLineChartWeb from './web/AnalyticsLineChartWeb';

// Only import Victory Native components on native platforms
let VictoryNativeLineChart: React.ComponentType<any> | null = null;
if (!isWeb()) {
  const { View, Text, StyleSheet } = require('react-native');
  const { CartesianChart, Line, useChartPressState } = require('victory-native');
  const { Circle, useFont } = require('@shopify/react-native-skia');
  const { useColorScheme } = require('@/hooks/useColorScheme');
  const { Colors } = require('@/constants/Colors');
  const { SharedValue } = require('react-native-reanimated');

  function Tooltip({
    x,
    y,
    value,
    color,
  }: {
    x: SharedValue<number>;
    y: SharedValue<number>;
    value: SharedValue<number>;
    color: string;
  }) {
    return (
      <>
        <Circle cx={x} cy={y} r={6} color={color} />
        <Circle cx={x} cy={y} r={4} color="white" />
      </>
    );
  }

  VictoryNativeLineChart = function AnalyticsLineChartNative({
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
  }: AnalyticsLineChartProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    // Default theme-aware color
    const lineColor = color || colors.tint;

    // Press state for tooltip
    const { state, isActive } = useChartPressState({ x: 0, y: { value: 0 } });

    // Transform data for Victory Native XL format
    const chartData = data.map((point) => ({
      x: point.x,
      value: point.y,
    }));

    const axisOptions = {
      font: undefined, // Will be set when font is loaded
      formatXLabel: formatXLabel || ((value: any) => String(value)),
      formatYLabel: formatYLabel || ((value: any) => String(value)),
      lineColor: {
        grid: {
          x: colors.border,
          y: colors.border,
        },
        frame: colors.border,
      },
      lineWidth: {
        grid: {
          x: 0.5,
          y: 0.5,
        },
        frame: 1,
      },
      labelColor: colors.textSecondary,
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
          <CartesianChart
            data={chartData}
            xKey="x"
            yKeys={['value']}
            axisOptions={axisOptions}
            chartPressState={showTooltip ? state : undefined}
          >
            {({ points }) => (
              <>
                <Line
                  points={points.value}
                  color={lineColor}
                  strokeWidth={strokeWidth}
                  curveType={curveType}
                  animate={{ type: 'timing', duration: animationDuration }}
                />
                {showTooltip && isActive && (
                  <Tooltip
                    x={state.x.position}
                    y={state.y.value.position}
                    value={state.y.value.value}
                    color={lineColor}
                  />
                )}
              </>
            )}
          </CartesianChart>
        </View>
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
}

interface ChartDataPoint {
  x: number;
  y: number;
  label?: string;
}

interface AnalyticsLineChartProps {
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

export function AnalyticsLineChart(props: AnalyticsLineChartProps) {
  // Platform-conditional rendering
  if (isWeb()) {
    // Temporary simple implementation for web testing
    const React = require('react');
    const { View, Text } = require('react-native');

    return React.createElement(View, {
      style: { padding: 20, backgroundColor: '#e8f5e8', borderRadius: 8, margin: 10 }
    }, [
      React.createElement(Text, {
        key: 'title',
        style: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 }
      }, props.title || 'Line Chart'),
      React.createElement(Text, {
        key: 'status',
        style: { fontSize: 14, marginBottom: 5 }
      }, '✅ WEB PLATFORM - Line chart would render here (avoiding recharts dependency)'),
      React.createElement(Text, {
        key: 'data',
        style: { fontSize: 14 }
      }, `Data points: ${props.data.length}`)
    ]);
  } else {
    // Render Victory Native XL version for native platforms
    if (VictoryNativeLineChart) {
      return VictoryNativeLineChart(props);
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
        }, props.title || 'Line Chart'),
        React.createElement(Text, {
          key: 'fallback',
          style: { fontSize: 14 }
        }, 'Fallback: Simple implementation')
      ]);
    }
  }
}

export default AnalyticsLineChart;