import React, { useEffect } from 'react';
import { StyleSheet, Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSegments } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { IconSymbol } from './IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface FABConfig {
  icon: string;
  accessibilityLabel: string;
  action: () => void;
}

interface FABContextMap {
  [key: string]: FABConfig;
}

export function ContextAwareFAB() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  
  // Animation values
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(1);
  
  // Get current route context
  const currentRoute = segments[1] || 'index'; // Get the tab route (index, planner, settings)
  
  // Context-aware FAB configurations
  const fabContexts: FABContextMap = {
    index: {
      icon: 'plus.circle.fill',
      accessibilityLabel: 'Log diaper change',
      action: () => {
        console.log('Opening quick log modal for diaper change');
        // TODO: Open quick logging modal with time chips
      },
    },
    planner: {
      icon: 'calendar.badge.plus',
      accessibilityLabel: 'Add to planner',
      action: () => {
        console.log('Opening planner modal for scheduling or inventory');
        // TODO: Open planning modal (schedule diaper changes or add inventory)
      },
    },
    settings: {
      icon: 'questionmark.circle.fill',
      accessibilityLabel: 'Get help and support',
      action: () => {
        console.log('Opening help and support resources');
        // TODO: Open help modal or hide FAB for clean interface
      },
    },
  };
  
  // Get current FAB configuration
  const currentFABConfig = fabContexts[currentRoute] || fabContexts.index;
  
  // Handle FAB press with psychology-driven animations
  const handlePress = () => {
    // Haptic feedback for reassurance
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Execute context-aware action
    currentFABConfig.action();
  };
  
  // Gesture handling with spring physics
  const tapGesture = Gesture.Tap()
    .onStart(() => {
      // Press animation: scale down + slight rotation for playful feedback
      scale.value = withSpring(0.9, {
        damping: 20,
        stiffness: 300,
      });
      rotation.value = withSpring(15, {
        damping: 15,
        stiffness: 200,
      });
    })
    .onEnd(() => {
      // Release animation: spring back with gentle physics
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 100,
      });
      rotation.value = withSpring(0, {
        damping: 15,
        stiffness: 100,
      });
      
      // Trigger haptic and action on UI thread
      runOnJS(handlePress)();
    });
  
  // Context change animation
  useEffect(() => {
    // Animate icon transition when context changes
    opacity.value = withSpring(0, {
      damping: 20,
      stiffness: 300,
    }, () => {
      // Once faded out, fade back in with new icon
      opacity.value = withSpring(1, {
        damping: 15,
        stiffness: 200,
      });
    });
  }, [currentRoute]);
  
  // Animated styles
  const fabAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { rotate: `${rotation.value}deg` },
      ],
      opacity: opacity.value,
    };
  });
  
  // Calculate positioning with safe area
  const bottomPosition = Platform.select({
    ios: insets.bottom + 24 + 80, // 24px margin + 80px tab bar height + safe area
    default: 24 + 80, // 24px margin + 80px tab bar height
  });
  
  const dynamicStyles = StyleSheet.create({
    fabContainer: {
      position: 'absolute',
      bottom: bottomPosition,
      right: 24,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.tint,
      justifyContent: 'center',
      alignItems: 'center',
      // iOS shadow
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      // Android shadow
      elevation: 8,
    },
  });
  
  return (
    <GestureDetector gesture={tapGesture}>
      <Animated.View 
        style={[dynamicStyles.fabContainer, fabAnimatedStyle]}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={currentFABConfig.accessibilityLabel}
        accessibilityHint="Double tap to activate"
      >
        <IconSymbol
          name={currentFABConfig.icon}
          size={24}
          color="#FFFFFF"
        />
      </Animated.View>
    </GestureDetector>
  );
}

