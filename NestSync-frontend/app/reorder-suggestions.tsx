/**
 * Reorder Suggestions Screen
 * ML-powered diaper reorder suggestions for NestSync
 *
 * Features:
 * - AI-powered reorder predictions based on usage patterns
 * - Canadian pricing with GST/PST/HST calculations
 * - Premium feature gating for enhanced suggestions
 * - Psychology-driven UX for stressed parents
 * - PIPEDA-compliant data processing
 * - Offline-capable with graceful degradation
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';
import { IconSymbol } from '../components/ui/IconSymbol';
import { NestSyncButton } from '../components/ui/NestSyncButton';
import { ReorderSuggestionsContainer } from '../components/reorder/ReorderSuggestionsContainer';
import { FeatureUpgradePrompt } from '../components/subscription/FeatureUpgradePrompt';
import { Colors, NestSyncColors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';
import { useAsyncStorage } from '../hooks/useUniversalStorage';
import { useChildren } from '../hooks/useChildren';
import { useFeatureGate } from '../lib/hooks/useSubscription';

interface ReorderSuggestionsScreenProps {}

export default function ReorderSuggestionsScreen({}: ReorderSuggestionsScreenProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const params = useLocalSearchParams();

  // State for selected child with persistence from home screen
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [storedChildId] = useAsyncStorage('nestsync_selected_child_id');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  // Get children data to validate selection
  const { children, loading: childrenLoading, error: childrenError } = useChildren({
    first: 10,
    // No polling on this screen to preserve battery
  });

  // Feature gating for smart reorder suggestions (Premium/Family only)
  const { hasAccess, loading: featureLoading, upgradeRequired, recommendedPlan, error: featureError } = useFeatureGate('smart_reorder_suggestions');

  // DEVELOPMENT BYPASS: Allow access in development mode for testing
  const isDevelopment = __DEV__;
  const effectiveHasAccess = isDevelopment || hasAccess;
  const effectiveUpgradeRequired = isDevelopment ? false : upgradeRequired;

  // Timeout state for feature gate check (prevents infinite loading on iOS)
  const [featureCheckTimedOut, setFeatureCheckTimedOut] = useState(false);

  // Add timeout to feature gate check to prevent iOS loading issue
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (featureLoading) {
        console.warn('[Reorder] Feature gate check timed out after 3 seconds');
        setFeatureCheckTimedOut(true);
      }
    }, 3000); // 3 second timeout

    return () => clearTimeout(timeout);
  }, [featureLoading]);

  // Log feature gate errors for debugging
  useEffect(() => {
    if (featureError) {
      console.warn('[Reorder] Feature gate check failed:', featureError.message);
      console.log('[Reorder] Falling back to basic access for development');
    }
    if (isDevelopment) {
      console.log('[Reorder] Development mode: Feature gate bypassed, allowing access');
    }
  }, [featureError, isDevelopment]);

  // Initialize child selection from URL params or storage
  useEffect(() => {
    const initializeChildSelection = async () => {
      try {
        setIsLoading(true);

        // Priority 1: URL parameter (direct navigation)
        if (params.childId && typeof params.childId === 'string') {
          setSelectedChildId(params.childId);
          return;
        }

        // Priority 2: Stored selection from home screen
        if (storedChildId && children.length > 0) {
          const childExists = children.find(child => child.id === storedChildId);
          if (childExists) {
            setSelectedChildId(storedChildId);
            return;
          }
        }

        // Priority 3: First available child (fallback)
        if (children.length > 0) {
          setSelectedChildId(children[0].id);
          return;
        }

        // No children available - will show empty state
        setError('No children found. Please add a child first.');

      } catch (err) {
        console.error('Error initializing child selection:', err);
        setError('Unable to load child information.');
      } finally {
        setIsLoading(false);
      }
    };

    // Wait for children data before initializing
    if (!childrenLoading) {
      initializeChildSelection();
    }
  }, [params.childId, storedChildId, children, childrenLoading]);

  // Handle navigation back to home
  const handleGoBack = () => {
    router.back();
  };

  // Handle upgrade to premium - Shows the new FeatureUpgradePrompt
  const handleUpgradeRequired = () => {
    setShowUpgradePrompt(true);
  };

  // Handle navigation to diaper logging (main app functionality)
  const handleLogDiaperChange = () => {
    router.push('/(tabs)/');
  };

  // Handle ML learning explanation
  const handleLearnMore = () => {
    Alert.alert(
      'How Smart Reordering Works',
      'Our AI analyzes your baby\'s diaper usage patterns to predict when you\'ll run out of supplies. The more you log, the more accurate our predictions become.\n\n• Tracks daily usage patterns\n• Predicts run-out dates\n• Finds best Canadian prices\n• Suggests optimal ordering times\n\nAll data is processed in Canada and PIPEDA compliant.',
      [{ text: 'Got It', style: 'default' }]
    );
  };

  // Handle child switch (if needed in future)
  const handleChildSwitch = (childId: string) => {
    setSelectedChildId(childId);
  };

  // Handle connection error retry
  const handleRetryConnection = () => {
    setError(null);
    setIsLoading(true);
    // Reset state to trigger re-fetch
    setSelectedChildId('');
  };

  // =============================================================================
  // LOADING STATE
  // =============================================================================

  // If feature check fails/times out, don't block the screen - let it render
  // Skip feature loading check entirely in development mode
  const effectiveLoading = featureLoading && !featureError && !featureCheckTimedOut && !isDevelopment;

  if (isLoading || childrenLoading || effectiveLoading) {
    return (
      <SafeAreaProvider>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
          <Stack.Screen
            options={{
              title: 'Smart Reorder',
              headerShown: true,
              headerStyle: { backgroundColor: colors.background },
              headerTintColor: colors.text,
              headerTitleStyle: { fontWeight: '600' },
            }}
          />

          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.tint} />
            <ThemedText style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading reorder suggestions...
            </ThemedText>
            <View style={styles.mlBadge}>
              <IconSymbol name="brain.head.profile" size={16} color={NestSyncColors.accent.purple} />
              <ThemedText style={[styles.mlText, { color: NestSyncColors.accent.purple }]}>
                ML-Powered
              </ThemedText>
            </View>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  // =============================================================================
  // ERROR STATE
  // =============================================================================

  if (error || childrenError) {
    return (
      <SafeAreaProvider>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
          <Stack.Screen
            options={{
              title: 'Smart Reorder',
              headerShown: true,
              headerStyle: { backgroundColor: colors.background },
              headerTintColor: colors.text,
              headerTitleStyle: { fontWeight: '600' },
            }}
          />

          <View style={styles.errorContainer}>
            <IconSymbol
              name="exclamationmark.triangle"
              size={64}
              color={colors.error}
            />
            <ThemedText type="title" style={[styles.errorTitle, { color: colors.text }]}>
              Unable to Load
            </ThemedText>
            <ThemedText style={[styles.errorMessage, { color: colors.textSecondary }]}>
              {error || childrenError?.message || 'Please check your connection and try again.'}
            </ThemedText>

            <View style={styles.errorActions}>
              <NestSyncButton
                title="Try Again"
                onPress={handleRetryConnection}
                variant="primary"
                size="medium"
                style={styles.retryButton}
              />
              <NestSyncButton
                title="Go Back"
                onPress={handleGoBack}
                variant="outline"
                size="medium"
                style={styles.backButton}
              />
            </View>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  // =============================================================================
  // NO CHILDREN STATE
  // =============================================================================

  if (children.length === 0) {
    return (
      <SafeAreaProvider>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
          <Stack.Screen
            options={{
              title: 'Smart Reorder',
              headerShown: true,
              headerStyle: { backgroundColor: colors.background },
              headerTintColor: colors.text,
              headerTitleStyle: { fontWeight: '600' },
            }}
          />

          <View style={styles.noChildrenContainer}>
            <IconSymbol
              name="figure.2.and.child.holdinghands"
              size={64}
              color={colors.textSecondary}
            />
            <ThemedText type="title" style={[styles.noChildrenTitle, { color: colors.text }]}>
              No Children Added
            </ThemedText>
            <ThemedText style={[styles.noChildrenMessage, { color: colors.textSecondary }]}>
              Add a child to your account to get personalized ML-powered reorder suggestions based on their usage patterns.
            </ThemedText>

            <View style={styles.noChildrenActions}>
              <NestSyncButton
                title="Add Child"
                onPress={() => {
                  router.push('/(tabs)/settings');
                }}
                variant="primary"
                size="medium"
                style={styles.addChildButton}
              />
              <NestSyncButton
                title="Go Back"
                onPress={handleGoBack}
                variant="outline"
                size="medium"
                style={styles.backButton}
              />
            </View>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  // =============================================================================
  // FEATURE ACCESS GATING
  // =============================================================================

  // Show blocking upgrade prompt if user doesn't have access
  // Don't show during loading to avoid flash
  // DEVELOPMENT BYPASS: Skip upgrade prompt in development mode
  if (!featureLoading && effectiveUpgradeRequired && !effectiveHasAccess) {
    return (
      <SafeAreaProvider>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
          <Stack.Screen
            options={{
              title: 'Smart Reorder',
              headerShown: true,
              headerStyle: { backgroundColor: colors.background },
              headerTintColor: colors.text,
              headerTitleStyle: { fontWeight: '600' },
            }}
          />

          <FeatureUpgradePrompt
            featureId="smart_reorder_suggestions"
            title="Unlock Smart Reordering"
            description="Get AI-powered reorder predictions based on your baby's usage patterns, Canadian price comparisons, and automated scheduling with NestSync Premium."
            requiredTier={recommendedPlan?.tier || 'PREMIUM'}
            mode="blocking"
            visible={true}
          />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  // =============================================================================
  // MAIN SCREEN RENDER (for users with access)
  // =============================================================================

  const selectedChild = children.find(child => child.id === selectedChildId);
  const childName = selectedChild?.name || 'your little one';

  return (
    <SafeAreaProvider>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <Stack.Screen
          options={{
            title: 'Smart Reorder',
            headerShown: true,
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerTitleStyle: { fontWeight: '600' },
            headerBackTitle: 'Home',
          }}
        />

        {/* Screen Header */}
        <ThemedView style={styles.screenHeader}>
          <View style={styles.headerContent}>
            <ThemedText type="title" style={[styles.screenTitle, { color: colors.text }]}>
              Smart Reorder for {childName}
            </ThemedText>
            <ThemedText style={[styles.screenSubtitle, { color: colors.textSecondary }]}>
              AI-powered suggestions based on usage patterns and Canadian pricing
            </ThemedText>
          </View>

          {/* Canadian Trust Indicator */}
          <View style={[styles.trustBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <IconSymbol name="checkmark.shield.fill" size={14} color={NestSyncColors.canadian.trust} />
            <ThemedText style={[styles.trustText, { color: colors.textSecondary }]}>
              🇨🇦 Data stored in Canada
            </ThemedText>
          </View>
        </ThemedView>

        {/* Main Content - Reorder Suggestions Container */}
        <ReorderSuggestionsContainer
          childId={selectedChildId}
          initialFilter="all"
          context="home"
          onUpgradeRequired={handleUpgradeRequired}
          onLogDiaperChange={handleLogDiaperChange}
          onLearnMore={handleLearnMore}
        />

        {/* Feature Upgrade Prompt - Dismissible Mode Example */}
        <FeatureUpgradePrompt
          featureId="smart_reorder_suggestions"
          title="Unlock Smart Reordering"
          description="Get AI-powered reorder predictions, Canadian price comparisons, and automated scheduling with NestSync Premium."
          requiredTier="PREMIUM"
          mode="dismissible"
          visible={showUpgradePrompt}
          onDismiss={() => setShowUpgradePrompt(false)}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  mlBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: NestSyncColors.accent.purple + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  mlText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },

  // Error State
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 32,
    maxWidth: 300,
  },
  errorActions: {
    gap: 12,
    width: '100%',
    maxWidth: 200,
  },
  retryButton: {
    width: '100%',
  },
  backButton: {
    width: '100%',
  },

  // No Children State
  noChildrenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  noChildrenTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  noChildrenMessage: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 32,
    maxWidth: 300,
  },
  noChildrenActions: {
    gap: 12,
    width: '100%',
    maxWidth: 200,
  },
  addChildButton: {
    width: '100%',
  },

  // Screen Header
  screenHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    marginBottom: 12,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  screenSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  trustText: {
    fontSize: 11,
    fontWeight: '500',
  },
});