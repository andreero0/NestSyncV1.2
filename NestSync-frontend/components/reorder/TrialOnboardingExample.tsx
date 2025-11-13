/**
 * TrialOnboardingExample Component
 *
 * Example implementation showing how to integrate TrialOnboardingTooltips
 * throughout the NestSync app. This demonstrates various usage patterns
 * for different contexts and screens.
 *
 * This file serves as:
 * 1. Documentation for developers
 * 2. Testing component for tooltip functionality
 * 3. Reference implementation for integration patterns
 */

import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, NestSyncColors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import { useNestSyncTheme } from '../../contexts/ThemeContext';
import { useTrialOnboarding, useFeatureOnboarding, useScreenOnboarding } from '../../hooks/useTrialOnboarding';
import { useTrialDaysRemaining } from './TrialCountdownBanner';

/**
 * Example dashboard component with integrated tooltips
 */
export function TrialOnboardingExample() {
  const theme = useNestSyncTheme();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const {
    showWelcomeTooltip,
    showAnalyticsTooltip,
    showTimelineTooltip,
    showReorderTooltip,
    showFeatureUnlockTooltip,
    scheduleProgressTooltips,
    TooltipComponent
  } = useTrialOnboarding();

  const { startOnboardingSequence, TooltipComponent: ScreenTooltip } = useScreenOnboarding('dashboard');
  const { showFeatureTooltip, TooltipComponent: FeatureTooltip } = useFeatureOnboarding('Smart Analytics');

  const daysRemaining = useTrialDaysRemaining();

  // Refs for positioning tooltips
  const analyticsButtonRef = useRef(null);
  const timelineButtonRef = useRef(null);
  const reorderButtonRef = useRef(null);
  const premiumFeatureRef = useRef(null);

  // Show welcome tooltip on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      showWelcomeTooltip();
    }, 1000);

    return () => clearTimeout(timer);
  }, [showWelcomeTooltip]);

  // Schedule progress-based tooltips
  useEffect(() => {
    scheduleProgressTooltips(daysRemaining);
  }, [daysRemaining, scheduleProgressTooltips]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme === 'dark' ? NestSyncColors.neutral[900] : colors.background,
    },
    content: {
      padding: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: theme === 'dark' ? NestSyncColors.neutral[100] : NestSyncColors.neutral[800],
      marginBottom: 20,
      textAlign: 'center',
    },
    section: {
      marginBottom: 30,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme === 'dark' ? NestSyncColors.neutral[200] : NestSyncColors.neutral[700],
      marginBottom: 15,
    },
    button: {
      backgroundColor: theme === 'dark' ? NestSyncColors.neutral[800] : colors.background,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme === 'dark' ? NestSyncColors.neutral[700] : NestSyncColors.neutral[200],
      shadowColor: NestSyncColors.primary.blue,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    buttonIcon: {
      marginRight: 12,
      width: 24,
      alignItems: 'center',
    },
    buttonContent: {
      flex: 1,
    },
    buttonTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme === 'dark' ? NestSyncColors.neutral[100] : NestSyncColors.neutral[800],
      marginBottom: 2,
    },
    buttonDescription: {
      fontSize: 14,
      color: theme === 'dark' ? NestSyncColors.neutral[400] : NestSyncColors.neutral[600],
    },
    premiumBadge: {
      backgroundColor: NestSyncColors.accent.purple,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
      marginLeft: 8,
    },
    premiumBadgeText: {
      color: colors.background,
      fontSize: 10,
      fontWeight: '600',
    },
    demoSection: {
      backgroundColor: theme === 'dark'
        ? NestSyncColors.primary.blue + '20'
        : NestSyncColors.primary.blueLight,
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
    },
    demoTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: NestSyncColors.primary.blue,
      marginBottom: 12,
      textAlign: 'center',
    },
    demoButton: {
      backgroundColor: NestSyncColors.primary.blue,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 8,
      marginBottom: 8,
      alignItems: 'center',
    },
    demoButtonText: {
      color: colors.background,
      fontSize: 14,
      fontWeight: '600',
    },
    note: {
      fontSize: 12,
      color: theme === 'dark' ? NestSyncColors.neutral[400] : NestSyncColors.neutral[500],
      textAlign: 'center',
      fontStyle: 'italic',
      marginTop: 20,
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Trial Onboarding Demo</Text>

        {/* Demo Controls */}
        <View style={styles.demoSection}>
          <Text style={styles.demoTitle}>Tooltip Demo Controls</Text>

          <TouchableOpacity
            style={styles.demoButton}
            onPress={() => showAnalyticsTooltip(analyticsButtonRef.current)}
          >
            <Text style={styles.demoButtonText}>Show Analytics Tooltip</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.demoButton}
            onPress={() => showTimelineTooltip(timelineButtonRef.current)}
          >
            <Text style={styles.demoButtonText}>Show Timeline Tooltip</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.demoButton}
            onPress={() => showReorderTooltip(reorderButtonRef.current)}
          >
            <Text style={styles.demoButtonText}>Show Reorder Tooltip</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.demoButton}
            onPress={() => showFeatureUnlockTooltip('Advanced Timeline')}
          >
            <Text style={styles.demoButtonText}>Show Feature Unlock</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.demoButton}
            onPress={() => showFeatureTooltip(premiumFeatureRef.current)}
          >
            <Text style={styles.demoButtonText}>Show Feature Discovery</Text>
          </TouchableOpacity>
        </View>

        {/* Feature Buttons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Premium Features</Text>

          <TouchableOpacity
            ref={analyticsButtonRef}
            style={styles.button}
            onPress={() => {
              // Navigate to analytics screen
              console.log('Navigate to analytics');
            }}
          >
            <View style={styles.buttonIcon}>
              <Ionicons
                name="analytics-outline"
                size={24}
                color={NestSyncColors.primary.blue}
              />
            </View>
            <View style={styles.buttonContent}>
              <Text style={styles.buttonTitle}>Smart Analytics</Text>
              <Text style={styles.buttonDescription}>
                Track patterns and predict your baby's needs
              </Text>
            </View>
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumBadgeText}>PREMIUM</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            ref={timelineButtonRef}
            style={styles.button}
            onPress={() => {
              // Navigate to timeline screen
              console.log('Navigate to timeline');
            }}
          >
            <View style={styles.buttonIcon}>
              <Ionicons
                name="timer-outline"
                size={24}
                color={NestSyncColors.secondary.green}
              />
            </View>
            <View style={styles.buttonContent}>
              <Text style={styles.buttonTitle}>Advanced Timeline</Text>
              <Text style={styles.buttonDescription}>
                View detailed weekly and monthly history
              </Text>
            </View>
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumBadgeText}>PREMIUM</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            ref={reorderButtonRef}
            style={styles.button}
            onPress={() => {
              // Navigate to reorder screen
              console.log('Navigate to reorder');
            }}
          >
            <View style={styles.buttonIcon}>
              <Ionicons
                name="notifications-outline"
                size={24}
                color={NestSyncColors.accent.orange}
              />
            </View>
            <View style={styles.buttonContent}>
              <Text style={styles.buttonTitle}>Smart Reorder Alerts</Text>
              <Text style={styles.buttonDescription}>
                Never run out with predictive ordering
              </Text>
            </View>
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumBadgeText}>PREMIUM</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            ref={premiumFeatureRef}
            style={styles.button}
            onPress={() => {
              // Trigger feature tooltip
              showFeatureTooltip(premiumFeatureRef.current);
            }}
          >
            <View style={styles.buttonIcon}>
              <Ionicons
                name="sparkles-outline"
                size={24}
                color={NestSyncColors.accent.purple}
              />
            </View>
            <View style={styles.buttonContent}>
              <Text style={styles.buttonTitle}>Discover New Features</Text>
              <Text style={styles.buttonDescription}>
                Tap to see what's available in your trial
              </Text>
            </View>
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumBadgeText}>TRIAL</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.note}>
          This demo shows how tooltips integrate with real app features.
          In production, tooltips appear automatically based on user behavior and trial progress.
        </Text>
      </ScrollView>

      {/* Tooltip Components */}
      {TooltipComponent}
      {ScreenTooltip}
      {FeatureTooltip}
    </View>
  );
}

/**
 * Integration Examples for Different Screen Types
 */

// Example: Dashboard Screen Integration
export function DashboardWithTooltips() {
  const { showWelcomeTooltip, TooltipComponent } = useTrialOnboarding();

  useEffect(() => {
    // Show welcome tooltip on first dashboard visit
    const timer = setTimeout(showWelcomeTooltip, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View>
      {/* Your dashboard content */}
      {TooltipComponent}
    </View>
  );
}

// Example: Feature Screen Integration
export function AnalyticsScreenWithTooltips() {
  const { startOnboardingSequence, TooltipComponent } = useScreenOnboarding('analytics');

  useEffect(() => {
    // Start analytics onboarding sequence
    startOnboardingSequence();
  }, []);

  return (
    <View>
      {/* Your analytics content */}
      {TooltipComponent}
    </View>
  );
}

// Example: Button Component Integration
export function PremiumFeatureButton({
  featureName,
  onPress
}: {
  featureName: string;
  onPress: () => void;
}) {
  const { showFeatureTooltip, TooltipComponent } = useFeatureOnboarding(featureName);
  const buttonRef = useRef(null);

  return (
    <View>
      <TouchableOpacity
        ref={buttonRef}
        onPress={onPress}
        onLongPress={() => showFeatureTooltip(buttonRef.current)}
      >
        <Text>{featureName}</Text>
      </TouchableOpacity>
      {TooltipComponent}
    </View>
  );
}

export default TrialOnboardingExample;