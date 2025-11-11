import React from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import * as Progress from 'react-native-progress';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';

interface UsageDataItem {
  label: string;
  value: number;
  percentage: number;
}

interface SimpleUsageIndicatorProps {
  title: string;
  data: UsageDataItem[];
  insightMessage?: string;
  maxItems?: number;
}

export function SimpleUsageIndicator({
  title,
  data,
  insightMessage,
  maxItems = 3 // 7±2 cognitive load principle - limit to 3 items
}: SimpleUsageIndicatorProps) {
  const colorScheme = useColorScheme();

  // NestSync design system colors for consistency
  const colors = {
    primary: '#0891B2', // NestSync blue
    secondary: '#0891B2', // Consistent NestSync blue
    tertiary: '#0891B2', // Consistent NestSync blue
  };

  const cardBackground = colorScheme === 'dark' ? '#1F2937' : '#FFFFFF';
  const textColor = colorScheme === 'dark' ? '#F3F4F6' : '#374151';
  const labelColor = colorScheme === 'dark' ? '#D1D5DB' : '#6B7280';

  // Limit data to prevent cognitive overload
  const limitedData = data.slice(0, maxItems);

  const getBarColor = (index: number): string => {
    const colorKeys = Object.keys(colors) as (keyof typeof colors)[];
    return colors[colorKeys[index % colorKeys.length]];
  };

  const getEncouragingInsight = (data: UsageDataItem[]): string => {
    if (insightMessage) return insightMessage;

    const topItem = data.reduce((prev, current) =>
      (current.percentage > prev.percentage) ? current : prev
    );

    return `Most active during ${topItem.label.toLowerCase()}`;
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: cardBackground }]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <IconSymbol
            name="chart.bar.fill"
            size={20}
            color={colors.primary}
            style={styles.icon}
          />
          <ThemedText style={[styles.title, { color: textColor }]}>
            {title}
          </ThemedText>
        </View>
      </View>

      <View style={styles.barsContainer}>
        {limitedData.map((item, index) => (
          <View key={item.label} style={styles.barRow}>
            <View style={styles.labelContainer}>
              <ThemedText style={[styles.label, { color: textColor }]}>
                {item.label}
              </ThemedText>
              <ThemedText style={[styles.percentage, { color: labelColor }]}>
                {item.percentage}%
              </ThemedText>
            </View>

            <View style={styles.progressBarContainer}>
              <Progress.Bar
                progress={item.percentage / 100}
                width={120}
                height={8}
                color={getBarColor(index)}
                unfilledColor={colorScheme === 'dark' ? '#374151' : '#E5E7EB'}
                borderWidth={0}
                borderRadius={4}
                animationType="timing"
                animationConfig={{ duration: 800 }}
              />
            </View>
          </View>
        ))}
      </View>

      {(insightMessage || limitedData.length > 0) && (
        <View style={styles.insightContainer}>
          <IconSymbol
            name="lightbulb.fill"
            size={16}
            color={colors.secondary}
            style={styles.insightIcon}
          />
          <ThemedText style={[styles.insight, { color: colors.primary }]}>
            {getEncouragingInsight(limitedData)}
          </ThemedText>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 20,
    marginVertical: 8,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  header: {
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  barsContainer: {
    marginBottom: 16,
  },
  barRow: {
    marginBottom: 12,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  percentage: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },
  progressBarContainer: {
    alignItems: 'flex-start',
  },
  insightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(156, 163, 175, 0.3)',
  },
  insightIcon: {
    marginRight: 8,
  },
  insight: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
});