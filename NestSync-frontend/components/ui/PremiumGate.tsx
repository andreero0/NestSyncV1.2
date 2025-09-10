/**
 * PremiumGate Component
 * Wraps premium content with blur effects and upgrade prompts
 * Psychology-driven UX with Canadian context messaging
 * Cross-platform compatible blur implementation
 */

import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '../ThemedText';
import { IconSymbol } from './IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import {
  usePremiumStore,
  isPremiumProduct,
  getPremiumMessaging,
  PremiumProductType,
  PremiumFeature,
  ProductType,
} from '@/stores/premiumStore';

interface PremiumGateProps {
  children: React.ReactNode;
  productType?: ProductType;
  feature?: PremiumFeature;
  style?: any;
  showPreview?: boolean; // Show a preview of the content
  customMessage?: {
    title?: string;
    subtitle?: string;
    ctaText?: string;
  };
}

export const PremiumGate: React.FC<PremiumGateProps> = ({
  children,
  productType,
  feature = PremiumFeature.NON_DIAPER_PRODUCTS,
  style,
  showPreview = true,
  customMessage,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const {
    hasAccessToProduct,
    hasAccessToFeature,
    setShowPremiumModal,
    setLastPromptedFeature,
    trackFeatureDiscovery,
  } = usePremiumStore();
  
  // Animation values
  const scaleValue = useSharedValue(1);
  const opacityValue = useSharedValue(1);
  
  // Check access based on product type or feature
  const hasAccess = React.useMemo(() => {
    if (productType) {
      return hasAccessToProduct(productType);
    }
    return hasAccessToFeature(feature);
  }, [productType, feature, hasAccessToProduct, hasAccessToFeature]);
  
  // Get appropriate messaging
  const messaging = React.useMemo(() => {
    const premiumProductType = productType && isPremiumProduct(productType) ? productType as PremiumProductType : undefined;
    const baseMessaging = getPremiumMessaging(premiumProductType);
    
    return customMessage ? { ...baseMessaging, ...customMessage } : baseMessaging;
  }, [productType, customMessage]);
  
  // Handle premium gate tap
  const handlePremiumTap = React.useCallback(() => {
    // Haptic feedback
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    // Animation feedback
    scaleValue.value = withSpring(0.95, {}, () => {
      scaleValue.value = withSpring(1);
    });
    
    // Track feature discovery
    trackFeatureDiscovery(feature);
    
    // Set last prompted feature for smart hint showing
    setLastPromptedFeature(feature);
    
    // Show premium modal
    setShowPremiumModal(true);
  }, [feature, scaleValue, trackFeatureDiscovery, setLastPromptedFeature, setShowPremiumModal]);
  
  // Animated styles
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
    opacity: opacityValue.value,
  }));
  
  // If user has access, render children normally
  if (hasAccess) {
    return <View style={style}>{children}</View>;
  }
  
  // Premium gate UI
  return (
    <Animated.View style={[styles.container, style, animatedStyle]}>
      {/* Background content (blurred if showPreview is true) */}
      {showPreview && (
        <View style={styles.backgroundContent} pointerEvents="none">
          {children}
        </View>
      )}
      
      {/* Blur overlay */}
      <BlurView
        intensity={80}
        style={styles.blurOverlay}
        tint={colorScheme === 'dark' ? 'dark' : 'light'}
      >
        <TouchableOpacity
          style={styles.premiumContent}
          onPress={handlePremiumTap}
          activeOpacity={0.8}
        >
          {/* Premium badge */}
          <View style={[styles.premiumBadge, { backgroundColor: colors.tint }]}>
            <IconSymbol 
              name="crown.fill" 
              size={16} 
              color="white"
              style={styles.crownIcon}
            />
            <ThemedText style={styles.premiumBadgeText}>
              Premium
            </ThemedText>
          </View>
          
          {/* Main message */}
          <ThemedText style={[styles.title, { color: colors.text }]}>
            {messaging.title}
          </ThemedText>
          
          {messaging.subtitle && (
            <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
              {messaging.subtitle}
            </ThemedText>
          )}
          
          {/* CTA Button */}
          <View style={[styles.ctaButton, { backgroundColor: colors.tint }]}>
            <ThemedText style={styles.ctaButtonText}>
              {messaging.ctaText}
            </ThemedText>
            <IconSymbol 
              name="arrow.right.circle.fill" 
              size={18} 
              color="white"
              style={styles.arrowIcon}
            />
          </View>
          
          {/* Trust indicator */}
          <ThemedText style={[styles.trustIndicator, { color: colors.textSecondary }]}>
            {messaging.trustIndicator}
          </ThemedText>
        </TouchableOpacity>
      </BlurView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  
  backgroundContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  
  blurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  premiumContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    minHeight: 200,
  },
  
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  
  crownIcon: {
    marginRight: 6,
  },
  
  premiumBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  ctaButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  
  arrowIcon: {
    marginLeft: 4,
  },
  
  trustIndicator: {
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.8,
    letterSpacing: 0.2,
  },
});

// Convenience component for specific product type gating
export const PremiumProductGate: React.FC<
  Omit<PremiumGateProps, 'feature'> & { productType: ProductType }
> = (props) => {
  return (
    <PremiumGate
      {...props}
      feature={PremiumFeature.NON_DIAPER_PRODUCTS}
    />
  );
};