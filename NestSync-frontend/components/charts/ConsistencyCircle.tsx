import React from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import * as Progress from 'react-native-progress';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';

interface ConsistencyCircleProps {
  title: string;
  consistency: number; // 0 to 1
  encouragingMessage?: string;
  streakDays?: number;
}

export function ConsistencyCircle({
  title,
  consistency,
  encouragingMessage,
  streakDays
}: ConsistencyCircleProps) {
  const colorScheme = useColorScheme();

  // Color psychology for parent reassurance
  const getConsistencyColor = (consistency: number): string => {
    if (consistency >= 0.8) return '#10B981'; // Green for excellent
    if (consistency >= 0.6) return '#0891B2'; // Blue for good
    if (consistency >= 0.4) return '#F59E0B'; // Amber for building
    return '#6B7280'; // Gray for starting
  };

  const getEncouragementLevel = (consistency: number): string => {
    if (consistency >= 0.9) return "Outstanding routine!";
    if (consistency >= 0.8) return "Excellent consistency!";
    if (consistency >= 0.6) return "Great progress!";
    if (consistency >= 0.4) return "You're building habits!";
    return "Every day counts!";
  };

  const cardBackground = colorScheme === 'dark' ? '#1F2937' : '#FFFFFF';
  const textColor = colorScheme === 'dark' ? '#F3F4F6' : '#374151';
  const subtextColor = colorScheme === 'dark' ? '#D1D5DB' : '#6B7280';

  const consistencyColor = getConsistencyColor(consistency);
  const encouragement = encouragingMessage || getEncouragementLevel(consistency);
  const percentage = Math.round(consistency * 100);

  return (
    <ThemedView style={[styles.container, { backgroundColor: cardBackground }]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <IconSymbol
            name="target"
            size={20}
            color={consistencyColor}
            style={styles.icon}
          />
          <ThemedText style={[styles.title, { color: textColor }]}>
            {title}
          </ThemedText>
        </View>
      </View>

      <View style={styles.circleContainer}>
        <Progress.Circle
          size={100}
          progress={consistency}
          showsText={false}
          color={consistencyColor}
          unfilledColor={colorScheme === 'dark' ? '#374151' : '#E5E7EB'}
          borderWidth={0}
          thickness={8}
          strokeCap="round"
          direction="clockwise"
        />

        <View style={styles.circleContent}>
          <ThemedText style={[styles.percentageText, { color: consistencyColor }]}>
            {percentage}%
          </ThemedText>
          <ThemedText style={[styles.consistencyLabel, { color: subtextColor }]}>
            consistent
          </ThemedText>
        </View>
      </View>

      <View style={styles.messageContainer}>
        <ThemedText style={[styles.encouragement, { color: consistencyColor }]}>
          {encouragement}
        </ThemedText>

        {streakDays !== undefined && streakDays > 0 && (
          <View style={styles.streakContainer}>
            <IconSymbol
              name="flame.fill"
              size={16}
              color="#F59E0B"
              style={styles.streakIcon}
            />
            <ThemedText style={[styles.streakText, { color: textColor }]}>
              {streakDays} day{streakDays !== 1 ? 's' : ''} streak
            </ThemedText>
          </View>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 20,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  circleContainer: {
    position: 'relative',
    marginVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentageText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  consistencyLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  messageContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  encouragement: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  streakIcon: {
    marginRight: 6,
  },
  streakText: {
    fontSize: 14,
    fontWeight: '500',
  },
});