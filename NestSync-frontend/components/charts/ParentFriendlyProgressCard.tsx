import React from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import * as Progress from 'react-native-progress';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';

interface ParentFriendlyProgressCardProps {
  title: string;
  progress: number; // 0 to 1
  supportiveMessage: string;
  icon?: string;
  color?: string;
}

export function ParentFriendlyProgressCard({
  title,
  progress,
  supportiveMessage,
  icon = 'heart.fill',
  color
}: ParentFriendlyProgressCardProps) {
  const colorScheme = useColorScheme();

  // Calming colors for stressed parents
  const progressColor = color || '#0891B2'; // NestSync calming blue
  const backgroundColor = colorScheme === 'dark' ? '#1F2937' : '#FFFFFF';
  const textColor = colorScheme === 'dark' ? '#F3F4F6' : '#374151';

  // Supportive messaging based on progress
  const getEncouragementLevel = (progress: number): string => {
    if (progress >= 0.9) return "You're doing wonderfully!";
    if (progress >= 0.7) return "Great progress!";
    if (progress >= 0.5) return "You're on the right track!";
    return "Every step counts!";
  };

  const encouragement = getEncouragementLevel(progress);

  return (
    <ThemedView style={[styles.card, { backgroundColor }]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <IconSymbol
            name={icon}
            size={20}
            color={progressColor}
            style={styles.icon}
          />
          <ThemedText style={[styles.title, { color: textColor }]}>
            {title}
          </ThemedText>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <Progress.Circle
          size={80}
          progress={progress}
          showsText={true}
          formatText={(progress) => `${Math.round(progress * 100)}%`}
          color={progressColor}
          unfilledColor={colorScheme === 'dark' ? '#374151' : '#E5E7EB'}
          borderWidth={0}
          thickness={6}
          textStyle={[styles.progressText, { color: textColor }]}
          allowFontScaling={true}
        />
      </View>

      <View style={styles.messageContainer}>
        <ThemedText style={[styles.encouragement, { color: progressColor }]}>
          {encouragement}
        </ThemedText>
        <ThemedText style={[styles.supportiveMessage, { color: textColor }]}>
          {supportiveMessage}
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
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
    flex: 1,
  },
  progressContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '500',
  },
  messageContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  encouragement: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  supportiveMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    opacity: 0.8,
  },
});