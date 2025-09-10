/**
 * PremiumModal Component
 * Premium upgrade flow with psychology-driven UX for Canadian parents
 * PIPEDA-compliant subscription management
 * Follows existing modal patterns from AddInventoryModal
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

import { ThemedText } from '../ThemedText';
import { IconSymbol } from '../ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import {
  usePremiumStore,
  getPremiumMessaging,
  SubscriptionTier,
  SubscriptionStatus,
  PremiumFeature,
} from '@/stores/premiumStore';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface PremiumFeatureItem {
  icon: string;
  title: string;
  description: string;
  available: boolean;
}

const PREMIUM_FEATURES: PremiumFeatureItem[] = [
  {
    icon: 'doc.text.fill',
    title: 'Track All Baby Essentials',
    description: 'Wipes, creams, powder, bags, and training pants',
    available: true,
  },
  {
    icon: 'bell.fill',
    title: 'Smart Low-Stock Alerts',
    description: 'Never run out of what you need most',
    available: true,
  },
  {
    icon: 'chart.bar.fill',
    title: 'Advanced Usage Insights',
    description: 'Understand your family\'s patterns better',
    available: false, // Future feature
  },
  {
    icon: 'square.and.arrow.up.fill',
    title: 'Export Your Data',
    description: 'Share reports with healthcare providers',
    available: false, // Future feature
  },
];

export const PremiumModal: React.FC = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  
  const {
    showPremiumModal,
    setShowPremiumModal,
    lastPromptedFeature,
    setSubscriptionTier,
    setSubscriptionStatus,
  } = usePremiumStore();
  
  // Animation values
  const translateY = useSharedValue(screenHeight);
  const backdropOpacity = useSharedValue(0);
  const contentScale = useSharedValue(0.9);
  
  // State
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  
  // Get contextual messaging
  const messaging = getPremiumMessaging();
  
  // Animation effects
  useEffect(() => {
    if (showPremiumModal) {
      // Entrance animation
      backdropOpacity.value = withTiming(1, { duration: 300 });
      translateY.value = withSpring(0, {
        damping: 20,
        stiffness: 300,
      });
      contentScale.value = withSpring(1, {
        damping: 20,
        stiffness: 300,
      });
    } else {
      // Exit animation
      backdropOpacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(screenHeight, { duration: 300 });
      contentScale.value = withTiming(0.9, { duration: 200 });
    }
  }, [showPremiumModal]);
  
  // Handle close
  const handleClose = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowPremiumModal(false);
  }, [setShowPremiumModal]);
  
  // Handle start trial (mock implementation)
  const handleStartTrial = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Haptic feedback
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      // Mock trial activation (replace with actual subscription logic)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Set trial state
      setSubscriptionTier(SubscriptionTier.PREMIUM);
      setSubscriptionStatus(SubscriptionStatus.TRIAL);
      
      // Show success
      Alert.alert(
        'Welcome to Premium!',
        'Your 7-day free trial has started. Track all your baby essentials worry-free!',
        [{ text: 'Get Started', style: 'default' }]
      );
      
      handleClose();
    } catch (error) {
      Alert.alert(
        'Oops!',
        'Something went wrong. Please try again in a moment.',
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setIsLoading(false);
    }
  }, [setSubscriptionTier, setSubscriptionStatus, handleClose]);
  
  // Handle subscription (mock implementation)
  const handleSubscribe = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Mock subscription flow (replace with actual payment processing)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      Alert.alert(
        'Coming Soon!',
        'Premium subscriptions will be available soon. For now, enjoy your free trial!',
        [
          { 
            text: 'Start Free Trial', 
            style: 'default',
            onPress: handleStartTrial 
          }
        ]
      );
    } catch (error) {
      Alert.alert(
        'Oops!',
        'Something went wrong. Please try again in a moment.',
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setIsLoading(false);
    }
  }, [handleStartTrial]);
  
  // Animated styles
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));
  
  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: contentScale.value },
    ],
  }));
  
  return (
    <Modal
      visible={showPremiumModal}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <TouchableOpacity
          style={styles.backdropTouchable}
          activeOpacity={1}
          onPress={handleClose}
        />
        
        <Animated.View style={[styles.container, containerStyle]}>
          <BlurView
            intensity={95}
            style={[
              styles.content,
              {
                paddingTop: Math.max(insets.top, 20),
                paddingBottom: Math.max(insets.bottom, 20),
              },
            ]}
            tint={colorScheme === 'dark' ? 'dark' : 'light'}
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: colors.backgroundSecondary }]}
                onPress={handleClose}
              >
                <IconSymbol name="xmark" size={16} color={colors.text} />
              </TouchableOpacity>
              
              <View style={[styles.premiumBadge, { backgroundColor: colors.tint }]}>
                <IconSymbol name="crown.fill" size={16} color="white" />
                <ThemedText style={styles.premiumBadgeText}>Premium</ThemedText>
              </View>
            </View>
            
            <ScrollView
              style={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContainer}
            >
              {/* Main title and description */}
              <View style={styles.heroSection}>
                <ThemedText style={[styles.title, { color: colors.text }]}>
                  {messaging.title}
                </ThemedText>
                
                <ThemedText style={[styles.description, { color: colors.textSecondary }]}>
                  {messaging.description}
                </ThemedText>
                
                <ThemedText style={[styles.supportiveNote, { color: colors.textSecondary }]}>
                  {messaging.supportiveNote}
                </ThemedText>
              </View>
              
              {/* Features list */}
              <View style={styles.featuresSection}>
                <ThemedText style={[styles.featuresTitle, { color: colors.text }]}>
                  What you'll get:
                </ThemedText>
                
                {PREMIUM_FEATURES.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <View style={[
                      styles.featureIcon,
                      {
                        backgroundColor: feature.available 
                          ? `${colors.tint}20`
                          : `${colors.textSecondary}20`
                      }
                    ]}>
                      <IconSymbol
                        name={feature.icon}
                        size={20}
                        color={feature.available ? colors.tint : colors.textSecondary}
                      />
                    </View>
                    
                    <View style={styles.featureContent}>
                      <View style={styles.featureHeader}>
                        <ThemedText style={[
                          styles.featureTitle,
                          { 
                            color: feature.available ? colors.text : colors.textSecondary,
                            opacity: feature.available ? 1 : 0.7,
                          }
                        ]}>
                          {feature.title}
                        </ThemedText>
                        
                        {!feature.available && (
                          <View style={[styles.comingSoonBadge, { backgroundColor: colors.textSecondary }]}>
                            <ThemedText style={styles.comingSoonText}>Soon</ThemedText>
                          </View>
                        )}
                      </View>
                      
                      <ThemedText style={[
                        styles.featureDescription,
                        { 
                          color: colors.textSecondary,
                          opacity: feature.available ? 1 : 0.7,
                        }
                      ]}>
                        {feature.description}
                      </ThemedText>
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
            
            {/* Footer with CTA */}
            <View style={[styles.footer, { backgroundColor: colors.background }]}>
              {/* Trust indicator */}
              <ThemedText style={[styles.trustIndicator, { color: colors.textSecondary }]}>
                {messaging.trustIndicator}
              </ThemedText>
              
              {/* CTA Buttons */}
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: colors.tint }]}
                onPress={handleStartTrial}
                disabled={isLoading}
              >
                {isLoading ? (
                  <View style={styles.buttonContent}>
                    <ThemedText style={styles.primaryButtonText}>Starting trial...</ThemedText>
                  </View>
                ) : (
                  <View style={styles.buttonContent}>
                    <ThemedText style={styles.primaryButtonText}>
                      Start 7-Day Free Trial
                    </ThemedText>
                    <IconSymbol name="arrow.right.circle.fill" size={18} color="white" />
                  </View>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: colors.border }]}
                onPress={handleClose}
                disabled={isLoading}
              >
                <ThemedText style={[styles.secondaryButtonText, { color: colors.textSecondary }]}>
                  Maybe later
                </ThemedText>
              </TouchableOpacity>
            </View>
          </BlurView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  
  backdropTouchable: {
    flex: 1,
  },
  
  container: {
    maxHeight: screenHeight * 0.9,
  },
  
  content: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  
  premiumBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  
  scrollContent: {
    flex: 1,
  },
  
  scrollContainer: {
    paddingHorizontal: 20,
  },
  
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  
  supportiveNote: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  
  featuresSection: {
    marginBottom: 24,
  },
  
  featuresTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  
  featureContent: {
    flex: 1,
  },
  
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  
  comingSoonBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  
  comingSoonText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  
  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  
  footer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  
  trustIndicator: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
    opacity: 0.8,
  },
  
  primaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 28,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
    textAlign: 'center',
  },
  
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
  },
  
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});