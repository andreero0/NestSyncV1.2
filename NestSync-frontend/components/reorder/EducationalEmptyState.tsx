/**
 * Educational Empty State Component for Smart Reordering
 * Psychology-driven UX with Canadian dummy data and progressive enhancement
 * Reduces stress for parents while teaching them about ML capabilities
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  FadeIn,
  FadeInUp,
} from 'react-native-reanimated';

import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import { IconSymbol } from '../ui/IconSymbol';
import { NestSyncButton } from '../ui/NestSyncButton';
import { ReorderSuggestionCard } from './ReorderSuggestionCard';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Colors, NestSyncColors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import {
  CANADIAN_DUMMY_SUGGESTIONS,
  EMPTY_STATE_MESSAGING,
  getEmptyStateConfig,
  type EmptyStateMode,
} from './CanadianDummyData';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export interface EducationalEmptyStateProps {
  childId: string;
  daysOfData?: number;
  hasUsageData?: boolean;
  confidenceLevel?: number;
  onLogDiaperChange?: () => void;
  onLearnMore?: () => void;
  onRefresh?: () => void;
}

// =============================================================================
// ML PREDICTION DISPLAY COMPONENT
// =============================================================================

// =============================================================================
// CONFIDENCE PROGRESS COMPONENT
// =============================================================================

const ConfidenceProgress: React.FC<{ level: number; mode: EmptyStateMode }> = ({ level, mode }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    progressWidth.value = withTiming(level / 100, { duration: 1500 });
  }, [level]);

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%`,
  }));

  const getProgressColor = () => {
    if (level < 50) return NestSyncColors.semantic.warning;
    if (level < 80) return NestSyncColors.accent.amber;
    return NestSyncColors.semantic.success;
  };

  const getProgressMessage = () => {
    switch (mode) {
      case 'educational':
        return 'Ready to start learning your patterns';
      case 'learning':
        return `Building confidence: ${level}%`;
      case 'ready':
        return 'ML system ready for personalized suggestions!';
      default:
        return 'Initializing...';
    }
  };

  return (
    <Animated.View
      entering={FadeIn.delay(300)}
      style={[styles.progressContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <View style={styles.progressHeader}>
        <IconSymbol name="brain.head.profile" size={16} color={NestSyncColors.accent.purple} />
        <ThemedText style={[styles.progressLabel, { color: colors.text }]}>
          ML Learning Progress
        </ThemedText>
        <ThemedText style={[styles.progressPercentage, { color: getProgressColor() }]}>
          {level}%
        </ThemedText>
      </View>

      <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
        <Animated.View
          style={[
            styles.progressFill,
            { backgroundColor: getProgressColor() },
            animatedProgressStyle,
          ]}
        />
      </View>

      <ThemedText style={[styles.progressMessage, { color: colors.textSecondary }]}>
        {getProgressMessage()}
      </ThemedText>
    </Animated.View>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function EducationalEmptyState({
  childId,
  daysOfData = 0,
  hasUsageData = false,
  confidenceLevel = 0,
  onLogDiaperChange,
  onLearnMore,
  onRefresh,
}: EducationalEmptyStateProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Get configuration based on current state
  const config = getEmptyStateConfig(daysOfData, hasUsageData, confidenceLevel);

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Header Section */}
      <Animated.View entering={FadeIn} style={styles.headerSection}>
        <View style={styles.headerIcon}>
          <IconSymbol name="sparkles" size={48} color={NestSyncColors.accent.purple} />
        </View>

        <ThemedText type="title" style={[styles.title, { color: colors.text }]}>
          {EMPTY_STATE_MESSAGING.title}
        </ThemedText>

        <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
          {EMPTY_STATE_MESSAGING.subtitle}
        </ThemedText>

        <ThemedText style={[styles.description, { color: colors.textSecondary }]}>
          {config.message}
        </ThemedText>
      </Animated.View>

      {/* ML Progress Indicator */}
      {config.mode !== 'educational' && (
        <ConfidenceProgress level={confidenceLevel} mode={config.mode} />
      )}

      {/* ML Prediction Examples */}
      {config.showDummyData && (
        <Animated.View entering={FadeIn.delay(200)} style={styles.predictionsSection}>
          <ThemedText type="defaultSemiBold" style={[styles.predictionsTitle, { color: colors.text }]}>
            ML-Powered Reorder Predictions
          </ThemedText>

          <View style={styles.predictionDisclaimer}>
            <IconSymbol name="info.circle" size={16} color={NestSyncColors.semantic.info} />
            <ThemedText style={[styles.disclaimerText, { color: colors.textSecondary }]}>
              These examples show what you'll see once the AI learns your patterns.
            </ThemedText>
          </View>

          {/* ML Prediction Cards */}
          {CANADIAN_DUMMY_SUGGESTIONS.slice(0, 2).map((suggestion, index) => (
            <Animated.View
              key={suggestion.id}
              entering={FadeInUp.delay(300 + (index * 100))}
            >
              <ReorderSuggestionCard
                suggestion={suggestion}
                testID={`ml-prediction-${index}`}
              />
            </Animated.View>
          ))}
        </Animated.View>
      )}

      {/* Action Buttons */}
      <Animated.View entering={FadeIn.delay(600)} style={styles.actionsSection}>
        <View style={styles.primaryActions}>
          <NestSyncButton
            title={EMPTY_STATE_MESSAGING.callToAction.primary}
            onPress={onLogDiaperChange}
            variant="primary"
            size="large"
            style={styles.primaryButton}
          />
        </View>

        <View style={styles.secondaryActions}>
          <NestSyncButton
            title={EMPTY_STATE_MESSAGING.callToAction.secondary}
            onPress={onLearnMore}
            variant="ghost"
            size="medium"
            style={styles.secondaryButton}
          />
        </View>
      </Animated.View>

      {/* Canadian Trust Footer */}
      <Animated.View
        entering={FadeIn.delay(800)}
        style={[styles.trustFooter, { borderTopColor: colors.border }]}
      >
        <IconSymbol name="shield.checkmark" size={16} color={NestSyncColors.canadian.trust} />
        <ThemedText style={[styles.trustText, { color: colors.textSecondary }]}>
          {EMPTY_STATE_MESSAGING.stressReduction.canadian}
        </ThemedText>
      </Animated.View>
    </ScrollView>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },

  // Header Section
  headerSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  headerIcon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: width - 64,
  },

  // Progress Section
  progressContainer: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '700',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressMessage: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Predictions Section
  predictionsSection: {
    marginBottom: 24,
  },
  predictionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  predictionDisclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 8,
  },
  disclaimerText: {
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },

  // Actions Section
  actionsSection: {
    marginBottom: 24,
  },
  primaryActions: {
    marginBottom: 16,
  },
  primaryButton: {
    width: '100%',
  },
  secondaryActions: {
    gap: 12,
  },
  secondaryButton: {
    width: '100%',
  },

  // Trust Footer
  trustFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    gap: 8,
  },
  trustText: {
    fontSize: 12,
    textAlign: 'center',
  },
});

export default EducationalEmptyState;