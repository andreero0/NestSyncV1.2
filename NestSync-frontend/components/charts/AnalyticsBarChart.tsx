/**
 * AnalyticsBarChart Component
 * Platform-conditional bar chart component that uses Victory Native XL for native platforms
 * and Recharts for web platform to avoid Skia/CanvasKit compatibility issues
 */

import React from 'react';
import { isWeb } from '@/utils/platform';
import AnalyticsBarChartWebSimple from './web/AnalyticsBarChartWebSimple';

// Only import Victory Native components on native platforms
let VictoryNativeBarChart: React.ComponentType<any> | null = null;
if (!isWeb()) {
  const { View, Text, StyleSheet } = require('react-native');
  const { CartesianChart, Bar } = require('victory-native');
  const { LinearGradient, useFont, vec } = require('@shopify/react-native-skia');
  const { useColorScheme } = require('@/hooks/useColorScheme');
  const { Colors } = require('@/constants/Colors');

  VictoryNativeBarChart = function AnalyticsBarChartNative({
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
  }: AnalyticsBarChartProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    // Default theme-aware colors
    const defaultColor = color || colors.tint;
    const defaultGradientColors: [string, string] = gradientColors || [
      defaultColor,
      `${defaultColor}50`, // 50% opacity
    ];

    // Transform data for Victory Native XL format
    const chartData = data.map((point, index) => ({
      x: point.x,
      y: point.y,
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
          <CartesianChart
            data={chartData}
            xKey="x"
            yKeys={['y']}
            domainPadding={domainPadding}
            axisOptions={axisOptions}
          >
            {({ points, chartBounds }) => (
              <Bar
                points={points.y}
                chartBounds={chartBounds}
                color={showGradient ? undefined : defaultColor}
                roundedCorners={roundedCorners ? {
                  topLeft: 4,
                  topRight: 4,
                } : undefined}
                animate={{ type: 'timing', duration: animationDuration }}
              >
                {showGradient && (
                  <LinearGradient
                    start={vec(0, 0)}
                    end={vec(0, height)}
                    colors={defaultGradientColors}
                  />
                )}
              </Bar>
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
  x: number | string;
  y: number;
  label?: string;
}

interface AnalyticsBarChartProps {
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

export function AnalyticsBarChart(props: AnalyticsBarChartProps) {
  // Platform-conditional rendering
  if (isWeb()) {
    return <AnalyticsBarChartWebSimple {...props} />;
  } else {
    // Render Victory Native XL version for native platforms
    if (VictoryNativeBarChart) {
      return <VictoryNativeBarChart {...props} />;
    } else {
      // Fallback if Victory Native fails to load
      return <AnalyticsBarChartWebSimple {...props} />;
    }
  }
}

export default AnalyticsBarChart;