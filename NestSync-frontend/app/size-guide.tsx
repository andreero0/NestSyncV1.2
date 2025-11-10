/**
 * Size Guide Screen
 * Comprehensive diaper sizing guide for Canadian parents
 *
 * Features:
 * - Interactive sizing calculator with child profile integration
 * - Canadian brand comparisons and sizing charts
 * - Visual fit indicators and troubleshooting guide
 * - Psychology-driven UX for stressed parents
 * - Weight in kg/lbs with Canadian health system references
 * - Stress-reduction through clear, non-judgmental guidance
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';
import { IconSymbol } from '../components/ui/IconSymbol';
import { NestSyncButton } from '../components/ui/NestSyncButton';
import { Colors, NestSyncColors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';
import { useAsyncStorage } from '../hooks/useUniversalStorage';
import { useChildren, type Child } from '../hooks/useChildren';

// Size Guide Data Types
interface DiaperSize {
  size: string;
  label: string;
  weightKgMin: number;
  weightKgMax: number;
  weightLbMin: number;
  weightLbMax: number;
  ageMinMonths: number;
  ageMaxMonths?: number;
  description: string;
}

interface BrandSizing {
  brand: string;
  available: boolean;
  notes?: string;
  sizeVariations?: string;
}

interface FitIndicator {
  type: 'proper' | 'too-tight' | 'too-loose';
  title: string;
  description: string;
  icon: string;
  color: string;
}

// Canadian Diaper Sizing Standards
const DIAPER_SIZES: DiaperSize[] = [
  {
    size: 'NB',
    label: 'Newborn',
    weightKgMin: 0,
    weightKgMax: 4.5,
    weightLbMin: 0,
    weightLbMax: 10,
    ageMinMonths: 0,
    ageMaxMonths: 2,
    description: 'Perfect for newborns and premature babies',
  },
  {
    size: '1',
    label: 'Size 1',
    weightKgMin: 3.6,
    weightKgMax: 6.8,
    weightLbMin: 8,
    weightLbMax: 15,
    ageMinMonths: 0,
    ageMaxMonths: 4,
    description: 'Most common first size for healthy newborns',
  },
  {
    size: '2',
    label: 'Size 2',
    weightKgMin: 5.4,
    weightKgMax: 8.6,
    weightLbMin: 12,
    weightLbMax: 19,
    ageMinMonths: 2,
    ageMaxMonths: 8,
    description: 'Popular size for growing babies',
  },
  {
    size: '3',
    label: 'Size 3',
    weightKgMin: 7.3,
    weightKgMax: 12.7,
    weightLbMin: 16,
    weightLbMax: 28,
    ageMinMonths: 6,
    ageMaxMonths: 18,
    description: 'Most used size - active crawlers and walkers',
  },
  {
    size: '4',
    label: 'Size 4',
    weightKgMin: 10.9,
    weightKgMax: 17.2,
    weightLbMin: 24,
    weightLbMax: 38,
    ageMinMonths: 18,
    ageMaxMonths: 36,
    description: 'Toddler size with extra absorption',
  },
  {
    size: '5',
    label: 'Size 5',
    weightKgMin: 15.9,
    weightKgMax: 99,
    weightLbMin: 35,
    weightLbMax: 999,
    ageMinMonths: 36,
    description: 'For larger toddlers and preschoolers',
  },
  {
    size: '6',
    label: 'Size 6',
    weightKgMin: 18.1,
    weightKgMax: 99,
    weightLbMin: 40,
    weightLbMax: 999,
    ageMinMonths: 48,
    description: 'Largest size for older children',
  },
];

// Canadian Brand Information
const CANADIAN_BRANDS: BrandSizing[] = [
  {
    brand: 'Pampers',
    available: true,
    notes: 'Most popular in Canada',
    sizeVariations: 'Runs slightly small',
  },
  {
    brand: 'Huggies',
    available: true,
    notes: 'Good for sensitive skin',
    sizeVariations: 'True to size',
  },
  {
    brand: 'Seventh Generation',
    available: true,
    notes: 'Eco-friendly option',
    sizeVariations: 'Runs slightly large',
  },
  {
    brand: "President's Choice",
    available: true,
    notes: 'Loblaws store brand',
    sizeVariations: 'Budget-friendly, true to size',
  },
  {
    brand: "Parent's Choice",
    available: true,
    notes: 'Walmart brand',
    sizeVariations: 'Good value, runs small',
  },
  {
    brand: 'Kirkland',
    available: true,
    notes: 'Costco brand',
    sizeVariations: 'Bulk sizing, true to size',
  },
];

// Fit Indicators
const FIT_INDICATORS: FitIndicator[] = [
  {
    type: 'proper',
    title: 'Perfect Fit',
    description: 'Snug around waist and legs, no red marks, easy to fasten',
    icon: 'checkmark.circle.fill',
    color: NestSyncColors.semantic.success,
  },
  {
    type: 'too-tight',
    title: 'Too Tight',
    description: 'Red marks, difficult to fasten, bulging at sides',
    icon: 'exclamationmark.triangle.fill',
    color: NestSyncColors.semantic.warning,
  },
  {
    type: 'too-loose',
    title: 'Too Loose',
    description: 'Gaps at waist/legs, frequent leaks, slipping down',
    icon: 'arrow.up.circle.fill',
    color: NestSyncColors.semantic.info,
  },
];

interface SizeGuideScreenProps {}

export default function SizeGuideScreen({}: SizeGuideScreenProps) {
  const colorScheme = useColorScheme();
  const theme = (colorScheme === 'dark' ? 'dark' : 'light') as 'light' | 'dark';
  const colors = Colors[theme];
  const router = useRouter();
  const params = useLocalSearchParams();

  // State for selected child with persistence from home screen
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [storedChildId] = useAsyncStorage('nestsync_selected_child_id');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<'calculator' | 'chart' | 'brands' | 'fit'>('calculator');

  // Get children data to validate selection
  const { children, loading: childrenLoading, error: childrenError } = useChildren({
    first: 10,
    // No polling on this screen to preserve battery
  });

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

  // Handle connection error retry
  const handleRetryConnection = () => {
    setError(null);
    setIsLoading(true);
    // Reset state to trigger re-fetch
    setSelectedChildId('');
  };

  // Calculate recommended size based on child data
  const getRecommendedSize = (child: Child): DiaperSize => {
    const weightKg = child.currentWeightKg || 0;
    const ageMonths = child.ageInMonths || 0;

    // Find size based on weight (primary factor)
    let recommendedSize = DIAPER_SIZES.find(size =>
      weightKg >= size.weightKgMin && weightKg <= size.weightKgMax
    );

    // If no weight-based match, use age as backup
    if (!recommendedSize) {
      recommendedSize = DIAPER_SIZES.find(size =>
        ageMonths >= size.ageMinMonths &&
        (size.ageMaxMonths ? ageMonths <= size.ageMaxMonths : true)
      );
    }

    // Default to Size 1 if no match found
    return recommendedSize || DIAPER_SIZES[1];
  };

  // =============================================================================
  // LOADING STATE
  // =============================================================================

  if (isLoading || childrenLoading) {
    return (
      <SafeAreaProvider>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
          <Stack.Screen
            options={{
              title: 'Size Guide',
              headerShown: true,
              headerBackTitle: 'Back',
              headerStyle: { backgroundColor: colors.background },
              headerTintColor: colors.text,
              headerTitleStyle: { fontWeight: '600' },
            }}
          />

          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.tint} />
            <ThemedText style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading sizing guide...
            </ThemedText>
            <View style={[styles.premiumBadge, { backgroundColor: colors.premium + '20' }]}>
              <IconSymbol name="ruler.fill" size={16} color={colors.premium} />
              <ThemedText style={[styles.premiumText, { color: colors.premium }]}>
                Educational Content
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
              title: 'Size Guide',
              headerShown: true,
              headerBackTitle: 'Back',
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
              title: 'Size Guide',
              headerShown: true,
              headerBackTitle: 'Back',
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
              Add a child to your account to get personalized size recommendations based on their age and weight.
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
  // MAIN SCREEN RENDER
  // =============================================================================

  const selectedChild = children.find(child => child.id === selectedChildId);
  const childName = selectedChild?.name || 'your little one';
  const recommendedSize = selectedChild ? getRecommendedSize(selectedChild) : DIAPER_SIZES[1];

  return (
    <SafeAreaProvider>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <Stack.Screen
          options={{
            title: 'Size Guide',
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
              Size Guide for {childName}
            </ThemedText>
            <ThemedText style={[styles.screenSubtitle, { color: colors.textSecondary }]}>
              Educational sizing guide with Canadian health standards
            </ThemedText>
          </View>

          {/* Canadian Trust Indicator */}
          <View style={[styles.trustBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <IconSymbol name="checkmark.shield.fill" size={14} color={NestSyncColors.canadian.trust} />
            <ThemedText style={[styles.trustText, { color: colors.textSecondary }]}>
              🇨🇦 Health Canada guidelines
            </ThemedText>
          </View>
        </ThemedView>

        {/* Navigation Tabs */}
        <View style={[styles.tabContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={true}
            persistentScrollbar={true}
            contentContainerStyle={styles.tabScrollContent}
            indicatorStyle={colorScheme === 'dark' ? 'white' : 'black'}
          >
            {[
              { key: 'calculator', label: 'Calculator' },
              { key: 'chart', label: 'Size Chart' },
              { key: 'fit', label: 'Fit Guide' },
              { key: 'brands', label: 'Brands' },
            ].map((tab) => (
              <NestSyncButton
                key={tab.key}
                title={tab.label}
                onPress={() => setSelectedSection(tab.key as any)}
                variant={selectedSection === tab.key ? 'primary' : 'outline'}
                size="small"
                style={styles.tabButton}
              />
            ))}
          </ScrollView>
        </View>

        {/* Main Content */}
        <ScrollView
          style={styles.contentContainer}
          contentContainerStyle={styles.contentScrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Personalized Calculator Section */}
          {selectedSection === 'calculator' && selectedChild && (
            <View style={styles.section}>
              <ThemedText type="subtitle" style={[styles.sectionTitle, { color: colors.text }]}>
                Personalized Recommendation
              </ThemedText>

              <View style={[styles.calculatorCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.calculatorHeader}>
                  <IconSymbol name="person.fill" size={24} color={colors.tint} />
                  <View style={styles.calculatorHeaderText}>
                    <ThemedText type="defaultSemiBold" style={{ color: colors.text }}>
                      {childName}'s Current Info
                    </ThemedText>
                    <ThemedText style={[styles.calculatorSubtext, { color: colors.textSecondary }]}>
                      {selectedChild.ageInMonths} months old • Current: {selectedChild.currentDiaperSize}
                    </ThemedText>
                  </View>
                </View>

                {selectedChild.currentWeightKg && (
                  <View style={styles.weightDisplay}>
                    <ThemedText style={[styles.weightLabel, { color: colors.textSecondary }]}>
                      Current Weight
                    </ThemedText>
                    <ThemedText type="title" style={[styles.weightValue, { color: colors.text }]}>
                      {selectedChild.currentWeightKg.toFixed(1)} kg ({(selectedChild.currentWeightKg * 2.20462).toFixed(1)} lbs)
                    </ThemedText>
                  </View>
                )}

                <View style={[styles.recommendationCard, { backgroundColor: colors.successBackground }]}>
                  <IconSymbol name="checkmark.circle.fill" size={20} color={colors.success} />
                  <View style={styles.recommendationText}>
                    <ThemedText type="defaultSemiBold" style={{ color: colors.text }}>
                      Recommended: {recommendedSize.label}
                    </ThemedText>
                    <ThemedText style={[styles.recommendationDescription, { color: colors.textSecondary }]}>
                      {recommendedSize.description}
                    </ThemedText>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Size Chart Section */}
          {selectedSection === 'chart' && (
            <View style={styles.section}>
              <ThemedText type="subtitle" style={[styles.sectionTitle, { color: colors.text }]}>
                Complete Size Chart
              </ThemedText>

              {DIAPER_SIZES.map((size, index) => (
                <View
                  key={size.size}
                  style={[
                    styles.sizeRow,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      ...(selectedChild && recommendedSize.size === size.size && {
                        backgroundColor: colors.successBackground,
                        borderColor: colors.success,
                      })
                    }
                  ]}
                >
                  <View style={styles.sizeNumber}>
                    <ThemedText type="title" style={[styles.sizeText, { color: colors.text }]}>
                      {size.size}
                    </ThemedText>
                  </View>

                  <View style={styles.sizeDetails}>
                    <ThemedText type="defaultSemiBold" style={{ color: colors.text }}>
                      {size.label}
                    </ThemedText>
                    <ThemedText style={[styles.sizeWeight, { color: colors.textSecondary }]}>
                      {size.weightKgMin}-{size.weightKgMax === 99 ? '35+' : size.weightKgMax} kg
                      ({size.weightLbMin}-{size.weightLbMax === 999 ? '77+' : size.weightLbMax} lbs)
                    </ThemedText>
                    <ThemedText style={[styles.sizeAge, { color: colors.textSecondary }]}>
                      {size.ageMinMonths}-{size.ageMaxMonths || '48+'} months
                    </ThemedText>
                    <ThemedText style={[styles.sizeDescription, { color: colors.textSecondary }]}>
                      {size.description}
                    </ThemedText>
                  </View>

                  {selectedChild && recommendedSize.size === size.size && (
                    <IconSymbol name="checkmark.circle.fill" size={20} color={colors.success} />
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Fit Guide Section */}
          {selectedSection === 'fit' && (
            <View style={styles.section}>
              <ThemedText type="subtitle" style={[styles.sectionTitle, { color: colors.text }]}>
                How to Check Fit
              </ThemedText>

              {FIT_INDICATORS.map((indicator, index) => (
                <View
                  key={indicator.type}
                  style={[styles.fitCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <View style={styles.fitHeader}>
                    <IconSymbol name={indicator.icon as any} size={24} color={indicator.color} />
                    <ThemedText type="defaultSemiBold" style={[styles.fitTitle, { color: colors.text }]}>
                      {indicator.title}
                    </ThemedText>
                  </View>
                  <ThemedText style={[styles.fitDescription, { color: colors.textSecondary }]}>
                    {indicator.description}
                  </ThemedText>
                </View>
              ))}

              <View style={[styles.tipCard, { backgroundColor: colors.warningBackground, borderColor: colors.warning }]}>
                <IconSymbol name="lightbulb.fill" size={20} color={colors.warning} />
                <View style={styles.tipContent}>
                  <ThemedText type="defaultSemiBold" style={{ color: colors.text }}>
                    Pro Tip for Canadian Parents
                  </ThemedText>
                  <ThemedText style={[styles.tipText, { color: colors.textSecondary }]}>
                    Health Canada recommends checking diaper fit twice daily. Consider sizing up if you see red marks after wearing for 2+ hours.
                  </ThemedText>
                </View>
              </View>
            </View>
          )}

          {/* Brand Comparison Section */}
          {selectedSection === 'brands' && (
            <View style={styles.section}>
              <ThemedText type="subtitle" style={[styles.sectionTitle, { color: colors.text }]}>
                Canadian Brand Guide
              </ThemedText>

              {CANADIAN_BRANDS.map((brand, index) => (
                <View
                  key={brand.brand}
                  style={[styles.brandCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <View style={styles.brandHeader}>
                    <IconSymbol name="tag.fill" size={20} color={colors.tint} />
                    <ThemedText type="defaultSemiBold" style={[styles.brandName, { color: colors.text }]}>
                      {brand.brand}
                    </ThemedText>
                  </View>

                  <ThemedText style={[styles.brandNotes, { color: colors.textSecondary }]}>
                    {brand.notes}
                  </ThemedText>

                  {brand.sizeVariations && (
                    <View style={styles.brandVariation}>
                      <IconSymbol name="info.circle" size={14} color={colors.info} />
                      <ThemedText style={[styles.brandVariationText, { color: colors.info }]}>
                        {brand.sizeVariations}
                      </ThemedText>
                    </View>
                  )}
                </View>
              ))}

              <View style={[styles.tipCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <IconSymbol name="cart.fill" size={20} color={colors.tint} />
                <View style={styles.tipContent}>
                  <ThemedText type="defaultSemiBold" style={{ color: colors.text }}>
                    Shopping in Canada
                  </ThemedText>
                  <ThemedText style={[styles.tipText, { color: colors.textSecondary }]}>
                    Available at major retailers: Walmart, Loblaws, Metro, Costco, Amazon.ca, and most pharmacies.
                  </ThemedText>
                </View>
              </View>
            </View>
          )}

          {/* Bottom spacing */}
          <View style={{ height: 100 }} />
        </ScrollView>
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
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  premiumText: {
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
    borderBottomColor: NestSyncColors.neutral[200],
  },
  headerContent: {
    marginBottom: 12,
  },
  screenTitle: {
    fontSize: 20,
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

  // Navigation Tabs
  tabContainer: {
    borderBottomWidth: 1,
    paddingVertical: 12,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabScrollContent: {
    paddingHorizontal: 20,
    gap: 8,
    paddingVertical: 4,
  },
  tabButton: {
    minWidth: 100,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  // Content
  contentContainer: {
    flex: 1,
  },
  contentScrollContainer: {
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },

  // Calculator
  calculatorCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  calculatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  calculatorHeaderText: {
    flex: 1,
  },
  calculatorSubtext: {
    fontSize: 14,
    marginTop: 2,
  },
  weightDisplay: {
    marginBottom: 16,
  },
  weightLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  weightValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  recommendationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  recommendationText: {
    flex: 1,
  },
  recommendationDescription: {
    fontSize: 14,
    marginTop: 2,
  },

  // Size Chart
  sizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 16,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sizeNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: NestSyncColors.primary.blueLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sizeText: {
    fontSize: 16,
    fontWeight: '700',
    color: NestSyncColors.primary.blue,
  },
  sizeDetails: {
    flex: 1,
  },
  sizeWeight: {
    fontSize: 14,
    marginTop: 2,
  },
  sizeAge: {
    fontSize: 12,
    marginTop: 1,
  },
  sizeDescription: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },

  // Fit Guide
  fitCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  fitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  fitTitle: {
    fontSize: 16,
  },
  fitDescription: {
    fontSize: 14,
    lineHeight: 20,
  },

  // Brand Guide
  brandCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  brandName: {
    fontSize: 16,
  },
  brandNotes: {
    fontSize: 14,
    marginBottom: 8,
  },
  brandVariation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  brandVariationText: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Tips and Info
  tipCard: {
    flexDirection: 'row',
    padding: 16,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tipContent: {
    flex: 1,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
});