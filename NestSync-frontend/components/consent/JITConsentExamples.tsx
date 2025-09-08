/**
 * JIT Consent System Usage Examples
 * Demonstrates how to integrate the JIT consent system into NestSync components
 * These examples show the four key JIT consent triggers from the architecture plan
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRequireConsent } from '../../contexts/JITConsentContext';
import { ConsentGuard } from './ConsentGuard';
import { useNestSyncTheme } from '../../contexts/ThemeContext';
import { Colors, NestSyncColors } from '../../constants/Colors';
import { NestSyncButton } from '../ui/NestSyncButton';
import { ConsentType } from '../../lib/types/auth';

// Example 1: Analytics Consent - Using ConsentGuard HOC
export function AnalyticsInsightsComponent() {
  const actualTheme = useNestSyncTheme();
  const colors = Colors[actualTheme];

  return (
    <ConsentGuard
      consentType={ConsentType.ANALYTICS}
      purpose="We analyze your diaper usage patterns to provide helpful insights about your child's needs and development milestones."
      dataCategories={[
        'Diaper change frequency and timing',
        'Usage patterns and trends',
        'App interaction data (anonymous)'
      ]}
      feature="Analytics Dashboard"
      title="Unlock Usage Insights"
      description="See how your diaper usage compares to other Canadian families and get personalized tips."
      icon="chart"
    >
      <View style={[styles.protectedContent, { backgroundColor: colors.surface }]}>
        <Text style={[styles.contentTitle, { color: colors.textEmphasis }]}>
          Your Analytics Dashboard
        </Text>
        <Text style={[styles.contentText, { color: colors.text }]}>
          • Average 8.2 changes per day (above Canadian average)
          • Peak times: 7AM, 11AM, 3PM, 7PM
          • 23% reduction in overnight changes since week 4
          • Recommended next size transition: in 2-3 weeks
        </Text>
      </View>
    </ConsentGuard>
  );
}

// Example 2: Marketing Consent - Using useRequireConsent hook
export function NewsletterSignupComponent() {
  const { requireConsent } = useRequireConsent();
  const actualTheme = useNestSyncTheme();
  const colors = Colors[actualTheme];

  const handleSignup = async () => {
    const granted = await requireConsent({
      consentType: ConsentType.MARKETING,
      purpose: 'Receive helpful Canadian parenting tips, product updates, and special offers via email. Unsubscribe anytime.',
      dataCategories: [
        'Email address for communication',
        'General app preferences',
        'Canadian region for localized content'
      ],
      feature: 'Newsletter Signup',
    });

    if (granted) {
      // Proceed with newsletter signup
      console.log('User granted marketing consent - proceeding with newsletter signup');
      // Here you would typically call an API to subscribe the user
    } else {
      console.log('User declined marketing consent - showing alternative options');
      // Show alternative ways to stay informed without marketing consent
    }
  };

  return (
    <View style={[styles.component, { backgroundColor: colors.surface }]}>
      <Text style={[styles.componentTitle, { color: colors.textEmphasis }]}>
        Stay Connected
      </Text>
      <Text style={[styles.componentText, { color: colors.text }]}>
        Get weekly tips from Canadian parenting experts and early access to new features.
      </Text>
      <NestSyncButton
        title="Subscribe to Newsletter"
        onPress={handleSignup}
        variant="secondary"
        size="medium"
        style={styles.button}
      />
    </View>
  );
}

// Example 3: Data Sharing Consent - Using ConsentGuard for recommendations
export function PersonalizedRecommendationsComponent() {
  return (
    <ConsentGuard
      consentType={ConsentType.DATA_SHARING}
      purpose="Analyze your child's growth patterns and diaper usage to provide personalized size transition predictions and reorder recommendations."
      dataCategories={[
        'Child age and development milestones',
        'Diaper size and brand preferences',
        'Usage frequency and timing patterns',
        'Previous size transition history'
      ]}
      feature="Smart Recommendations"
      title="Get Personalized Recommendations"
      description="Let us analyze your usage patterns to predict the perfect time for size changes and reorders."
      icon="target"
    >
      <PersonalizedContent />
    </ConsentGuard>
  );
}

function PersonalizedContent() {
  const actualTheme = useNestSyncTheme();
  const colors = Colors[actualTheme];

  return (
    <View style={[styles.protectedContent, { backgroundColor: colors.surface }]}>
      <Text style={[styles.contentTitle, { color: colors.textEmphasis }]}>
        Your Personalized Recommendations
      </Text>
      <View style={styles.recommendationCard}>
        <Text style={[styles.recommendationTitle, { color: colors.textEmphasis }]}>
          Size Transition Alert
        </Text>
        <Text style={[styles.recommendationText, { color: colors.text }]}>
          Based on Emma's growth pattern, we recommend transitioning to Size 3 in the next 5-7 days.
          Current fit score: 85% → Predicted fit score: 95%
        </Text>
      </View>
      <View style={styles.recommendationCard}>
        <Text style={[styles.recommendationTitle, { color: colors.textEmphasis }]}>
          Smart Reorder Suggestion
        </Text>
        <Text style={[styles.recommendationText, { color: colors.text }]}>
          You typically run low on Size 2 every 12 days. Order now to avoid running out this weekend.
        </Text>
      </View>
    </View>
  );
}

// Example 4: Child Data Consent - Triggered when creating first child profile
export function CreateChildProfileExample() {
  const { requireConsent } = useRequireConsent();
  const actualTheme = useNestSyncTheme();
  const colors = Colors[actualTheme];

  const handleCreateProfile = async () => {
    // Note: In real app, child data consent would be handled differently
    // as it's required for core functionality, but this shows the pattern
    const granted = await requireConsent({
      consentType: ConsentType.DATA_SHARING, // Using data sharing as proxy for child data
      purpose: 'Store and process your child\'s information to provide personalized diaper tracking and development insights.',
      dataCategories: [
        'Child name and birth date',
        'Growth and development milestones',
        'Diaper usage patterns and preferences',
        'Photos and notes (optional)'
      ],
      feature: 'Child Profile Creation',
    });

    if (granted) {
      console.log('User granted child data consent - proceeding with profile creation');
      // Proceed with child profile creation
    } else {
      console.log('User declined child data consent - cannot proceed');
      // Show explanation that this is required for core functionality
    }
  };

  return (
    <View style={[styles.component, { backgroundColor: colors.surface }]}>
      <Text style={[styles.componentTitle, { color: colors.textEmphasis }]}>
        Create Child Profile
      </Text>
      <Text style={[styles.componentText, { color: colors.text }]}>
        Set up your child's profile to start tracking diapers and get personalized insights.
      </Text>
      <NestSyncButton
        title="Create Profile"
        onPress={handleCreateProfile}
        variant="primary"
        size="medium"
        style={styles.button}
      />
    </View>
  );
}

// Demo component that showcases all examples
export function JITConsentExamples() {
  const actualTheme = useNestSyncTheme();
  const colors = Colors[actualTheme];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.textEmphasis }]}>
        JIT Consent System Examples
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Demonstrating contextual consent requests for different features
      </Text>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textEmphasis }]}>
          1. Analytics Consent (ConsentGuard)
        </Text>
        <AnalyticsInsightsComponent />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textEmphasis }]}>
          2. Marketing Consent (Hook)
        </Text>
        <NewsletterSignupComponent />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textEmphasis }]}>
          3. Data Sharing Consent (Recommendations)
        </Text>
        <PersonalizedRecommendationsComponent />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textEmphasis }]}>
          4. Child Data Pattern (Hook)
        </Text>
        <CreateChildProfileExample />
      </View>

      <View style={[styles.complianceFooter, { backgroundColor: colors.surface }]}>
        <Text style={[styles.complianceText, { color: colors.textSecondary }]}>
          🇨🇦 All consent requests are PIPEDA-compliant and stored securely in Canada.
          Users can withdraw consent anytime in Settings.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  component: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  componentTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  componentText: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  protectedContent: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  contentTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  contentText: {
    fontSize: 16,
    lineHeight: 22,
  },
  recommendationCard: {
    padding: 16,
    backgroundColor: NestSyncColors.neutral[50],
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: NestSyncColors.secondary.green,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 15,
    lineHeight: 21,
  },
  complianceFooter: {
    padding: 20,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 40,
    borderLeftWidth: 4,
    borderLeftColor: NestSyncColors.canadian.trust,
  },
  complianceText: {
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default JITConsentExamples;