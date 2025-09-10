import React, { useEffect, useState } from 'react';
import { StyleSheet, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSegments } from 'expo-router';
import { useQuery } from '@apollo/client';
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
import { QuickLogModal } from '../modals/QuickLogModal';
import { MY_CHILDREN_QUERY } from '@/lib/graphql/queries';
import { useAsyncStorage } from '@/hooks/useUniversalStorage';

interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
  errorTitle?: string;
}

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
  
  // Modal state
  const [quickLogModalVisible, setQuickLogModalVisible] = useState(false);
  
  // State for selected child with persistence
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [storedChildId] = useAsyncStorage('nestsync_selected_child_id');
  
  // GraphQL queries
  const { data: childrenData, loading: childrenLoading, error: childrenError } = useQuery(MY_CHILDREN_QUERY, {
    variables: { first: 10 },
  });
  
  // Sync selected child with stored value
  useEffect(() => {
    if (storedChildId) {
      setSelectedChildId(storedChildId);
    }
  }, [storedChildId]);
  
  // Animation values
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(1);
  
  // Get current route context
  const currentRoute = segments[1] || 'index'; // Get the tab route (index, planner, settings)
  
  // Context-specific error messages for supportive UX
  const getContextErrorMessages = (context: string): { title: string; actions: string[] } => {
    switch (context) {
      case 'index':
        return {
          title: 'Ready to log?',
          actions: [
            'Add a child profile to start tracking',
            'Select your child from the profile menu',
            'Check your internet connection'
          ]
        };
      case 'planner':
        return {
          title: 'Let\'s plan ahead',
          actions: [
            'Add a child profile to create schedules',
            'Select your child to plan activities',
            'Check your internet connection'
          ]
        };
      case 'settings':
        return {
          title: 'Child settings',
          actions: [
            'Add a child profile to customize settings',
            'Select your child to manage preferences',
            'Check your internet connection'
          ]
        };
      default:
        return {
          title: 'Getting ready',
          actions: [
            'Add a child profile to continue',
            'Select your child from the menu',
            'Check your internet connection'
          ]
        };
    }
  };

  // Comprehensive validation function
  const validateChildContext = (): ValidationResult => {
    // Check if async storage is still loading (race condition prevention)
    if (storedChildId === undefined) {
      return {
        isValid: false,
        errorTitle: 'Loading...',
        errorMessage: 'Setting up your profile data. This usually takes just a moment.'
      };
    }

    // Check if GraphQL query is loading
    if (childrenLoading) {
      return {
        isValid: false,
        errorTitle: 'Loading...',
        errorMessage: 'Getting your children\'s information. This usually takes just a moment.'
      };
    }

    // Check for GraphQL errors
    if (childrenError) {
      const contextMessages = getContextErrorMessages(currentRoute);
      return {
        isValid: false,
        errorTitle: 'Connection Issue',
        errorMessage: `We couldn't load your data right now. ${contextMessages.actions[2]}.`
      };
    }

    // Check if children data exists
    const children = childrenData?.myChildren?.edges || [];
    if (children.length === 0) {
      const contextMessages = getContextErrorMessages(currentRoute);
      return {
        isValid: false,
        errorTitle: contextMessages.title,
        errorMessage: contextMessages.actions[0]
      };
    }

    // Check if a child is selected
    if (!selectedChildId) {
      const contextMessages = getContextErrorMessages(currentRoute);
      return {
        isValid: false,
        errorTitle: contextMessages.title,
        errorMessage: contextMessages.actions[1]
      };
    }

    // Check if selected child actually exists in the data
    const selectedChildExists = children.some((edge: any) => edge.node.id === selectedChildId);
    if (!selectedChildExists) {
      const contextMessages = getContextErrorMessages(currentRoute);
      return {
        isValid: false,
        errorTitle: 'Child Not Found',
        errorMessage: contextMessages.actions[1]
      };
    }

    // All validation passed
    return { isValid: true };
  };
  
  // Helper function to handle validation errors with supportive messaging
  const handleValidationError = (validation: ValidationResult) => {
    Alert.alert(
      validation.errorTitle || 'Just a moment...',
      validation.errorMessage || 'Setting things up for you.',
      [{ text: 'OK', style: 'default' }],
      { 
        cancelable: true,
        userInterfaceStyle: colorScheme === 'dark' ? 'dark' : 'light'
      }
    );
  };

  // Context-aware FAB configurations with consistent validation
  const fabContexts: FABContextMap = {
    index: {
      icon: 'plus.circle.fill',
      accessibilityLabel: 'Log diaper change',
      action: () => {
        const validation = validateChildContext();
        if (!validation.isValid) {
          handleValidationError(validation);
          return;
        }
        setQuickLogModalVisible(true);
      },
    },
    planner: {
      icon: 'calendar.badge.plus',
      accessibilityLabel: 'Add to planner',
      action: () => {
        const validation = validateChildContext();
        if (!validation.isValid) {
          handleValidationError(validation);
          return;
        }
        console.log('Opening planner modal for scheduling or inventory');
        // TODO: Open planning modal (schedule diaper changes or add inventory)
      },
    },
    settings: {
      icon: 'questionmark.circle.fill',
      accessibilityLabel: 'Get help and support',
      action: () => {
        const validation = validateChildContext();
        if (!validation.isValid) {
          handleValidationError(validation);
          return;
        }
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
  }, [currentRoute, opacity]);
  
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
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
      // Android shadow
      elevation: 8,
    },
  });
  
  // Handle success callback from modal
  const handleModalSuccess = (message: string) => {
    console.log('Diaper change logged successfully:', message);
    // You could show a toast notification here
  };

  // Handle modal close
  const handleModalClose = () => {
    setQuickLogModalVisible(false);
  };

  return (
    <>
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
      
      {/* Quick Log Modal */}
      <QuickLogModal
        visible={quickLogModalVisible}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        childId={selectedChildId}
      />
    </>
  );
}

