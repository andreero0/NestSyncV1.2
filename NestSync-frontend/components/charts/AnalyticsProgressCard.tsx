/**
 * AnalyticsProgressCard Component
 * Progress indicator card for key metrics and KPIs
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

interface AnalyticsProgressCardProps {
  title: string;
  value: string | number;
  progress: number; // 0-1
  target?: string | number;
  trend?: number; // Positive/negative trend
  trendDirection?: 'up' | 'down' | 'stable';
  icon?: string;
  color?: string;
  showTrend?: boolean;
  subtitle?: string;
  formatValue?: (value: any) => string;
}

export function AnalyticsProgressCard({
  title,
  value,
  progress,
  target,
  trend,
  trendDirection,
  icon,
  color,
  showTrend = true,
  subtitle,
  formatValue,
}: AnalyticsProgressCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const progressColor = color || colors.tint;
  const formattedValue = formatValue ? formatValue(value) : String(value);

  const getTrendIcon = () => {
    if (trendDirection === 'up') return 'arrow.up.right';
    if (trendDirection === 'down') return 'arrow.down.right';
    return 'minus';
  };

  const getTrendColor = () => {
    if (trendDirection === 'up') return '#10B981'; // Green
    if (trendDirection === 'down') return '#EF4444'; // Red
    return colors.textSecondary; // Gray
  };

  // Safe progress calculation with NaN protection
  const safeProgress = (typeof progress === 'number' && !isNaN(progress)) ? progress : 0;
  const progressWidth = Math.max(0, Math.min(1, safeProgress)) * 100;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Header */}
      <View style={styles.header}>
        {icon && (
          <View style={[styles.iconContainer, { backgroundColor: `${progressColor}15` }]}>
            <IconSymbol name={icon as any} size={20} color={progressColor} />
          </View>
        )}
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {subtitle}
            </Text>
          )}
        </View>
        {showTrend && trend !== undefined && (
          <View style={styles.trendContainer}>
            <IconSymbol
              name={getTrendIcon() as any}
              size={16}
              color={getTrendColor()}
            />
            <Text style={[styles.trendText, { color: getTrendColor() }]}>
              {Math.abs(trend)}%
            </Text>
          </View>
        )}
      </View>

      {/* Value */}
      <View style={styles.valueContainer}>
        <Text style={[styles.value, { color: colors.text }]}>
          {formattedValue}
        </Text>
        {target && (
          <Text style={[styles.target, { color: colors.textSecondary }]}>
            / {target}
          </Text>
        )}
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: progressColor,
                width: `${progressWidth}%`,
              },
            ]}
          />
        </View>
        <Text style={[styles.progressText, { color: colors.textSecondary }]}>
          {(typeof progressWidth === 'number' && !isNaN(progressWidth))
            ? Math.round(progressWidth)
            : 0}%
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 6,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    opacity: 0.8,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
  },
  target: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 35,
    textAlign: 'right',
  },
});

export default AnalyticsProgressCard;