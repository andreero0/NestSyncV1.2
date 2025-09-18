import React, { useEffect, useState } from 'react';
import { StyleSheet, Platform, View, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSegments, useLocalSearchParams } from 'expo-router';
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
import { AddInventoryModal } from '../modals/AddInventoryModal';
import { LegalModal } from '../consent/LegalModals';
import { useChildren } from '@/hooks/useChildren';
import { useAsyncStorage } from '@/hooks/useUniversalStorage';

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
  
  // Modal states
  const [quickLogModalVisible, setQuickLogModalVisible] = useState(false);
  const [addInventoryModalVisible, setAddInventoryModalVisible] = useState(false);
  const [legalModalVisible, setLegalModalVisible] = useState(false);
  const [legalModalType, setLegalModalType] = useState<'privacy' | 'terms' | 'affiliate'>('privacy');
  
  // State for selected child with persistence
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [storedChildId, setStoredChildId] = useAsyncStorage('nestsync_selected_child_id');
  
  // GraphQL queries - using centralized hook
  const { children, loading: childrenLoading } = useChildren({ first: 10 });

  // Enhanced state management for better UX
  const hasChildren = children.length > 0;
  const isLoading = childrenLoading;
  const showAddFirstChild = !hasChildren && !isLoading;
  
  // Only disable actions during loading, not when no children exist
  const actionsDisabled = isLoading;
  
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
  
  // Get current route context and view state
  const currentRoute = segments[1] || 'index'; // Get the tab route (index, planner, settings)
  const params = useLocalSearchParams<{ view?: string }>();
  const currentView = params.view;

  // Hide FAB when in analytics view - analytics should be passive viewing only
  const shouldHideFAB = currentRoute === 'planner' && currentView === 'analytics';
  
  // Context-aware FAB configurations with enhanced logic for new users
  const fabContexts: FABContextMap = {
    index: {
      icon: showAddFirstChild ? 'person.badge.plus' : 'plus.circle.fill',
      accessibilityLabel: showAddFirstChild ? 'Add your first child' : 'Log diaper change',
      action: () => {
        if (actionsDisabled) {
          Alert.alert(
            'Loading...',
            'Please wait while we load your data',
            [{ text: 'OK' }]
          );
          return;
        }
        
        if (showAddFirstChild) {
          // Navigate to child creation - using console for now, TODO: implement navigation
          console.log('Navigate to add first child onboarding');
          Alert.alert(
            'Welcome to NestSync!',
            'Let\'s add your first child to get started with diaper tracking.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Add Child', onPress: () => console.log('Navigate to child creation') }
            ]
          );
          return;
        }
        
        if (!selectedChildId) {
          Alert.alert(
            'Please Select a Child',
            'Choose which child you\'d like to log a diaper change for.',
            [{ text: 'OK' }]
          );
          return;
        }
        
        setQuickLogModalVisible(true);
      },
    },
    planner: {
      icon: showAddFirstChild ? 'person.badge.plus' : 'calendar.badge.plus',
      accessibilityLabel: showAddFirstChild ? 'Add your first child' : 'Add to planner',
      action: () => {
        if (actionsDisabled) {
          Alert.alert(
            'Loading...',
            'Please wait while we load your data',
            [{ text: 'OK' }]
          );
          return;
        }
        
        if (showAddFirstChild) {
          Alert.alert(
            'Welcome to NestSync!',
            'Add your first child to start planning and tracking.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Add Child', onPress: () => console.log('Navigate to child creation') }
            ]
          );
          return;
        }
        
        if (!selectedChildId) {
          Alert.alert(
            'Please Select a Child',
            'Choose which child you\'d like to add inventory for.',
            [{ text: 'OK' }]
          );
          return;
        }
        
        setAddInventoryModalVisible(true);
      },
    },
    settings: {
      icon: 'questionmark.circle.fill',
      accessibilityLabel: 'Get help and support',
      action: () => {
        if (actionsDisabled) {
          Alert.alert(
            'Loading...',
            'Please wait while we load your data',
            [{ text: 'OK' }]
          );
          return;
        }
        
        // Show privacy policy as primary help/legal resource
        setLegalModalType('privacy');
        setLegalModalVisible(true);
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
  
  // Handle success callbacks from modals
  const handleQuickLogSuccess = (message: string) => {
    console.log('Diaper change logged successfully:', message);
    // You could show a toast notification here
  };
  
  const handleAddInventorySuccess = (message: string) => {
    console.log('Inventory added successfully:', message);
    // You could show a toast notification here
  };

  // Handle modal close functions
  const handleQuickLogModalClose = () => {
    setQuickLogModalVisible(false);
  };
  
  const handleAddInventoryModalClose = () => {
    setAddInventoryModalVisible(false);
  };
  
  const handleLegalModalClose = () => {
    setLegalModalVisible(false);
  };

  // Don't render FAB in analytics view
  if (shouldHideFAB) {
    return (
      <>
        {/* Modals still available for other contexts */}
        <QuickLogModal
          visible={quickLogModalVisible}
          onClose={handleQuickLogModalClose}
          onSuccess={handleQuickLogSuccess}
          childId={selectedChildId}
        />

        <AddInventoryModal
          visible={addInventoryModalVisible}
          onClose={handleAddInventoryModalClose}
          onSuccess={handleAddInventorySuccess}
          childId={selectedChildId}
        />

        <LegalModal
          isVisible={legalModalVisible}
          onClose={handleLegalModalClose}
          type={legalModalType}
        />
      </>
    );
  }

  return (
    <>
      <GestureDetector gesture={tapGesture}>
        <Animated.View 
          style={[
            dynamicStyles.fabContainer, 
            fabAnimatedStyle,
            isLoading && { backgroundColor: colors.tabIconDefault }
          ]}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={isLoading ? 'Loading...' : currentFABConfig.accessibilityLabel}
          accessibilityHint={isLoading ? 'Please wait' : 'Double tap to activate'}
        >
          {isLoading ? (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <IconSymbol
                name="arrow.2.circlepath"
                size={20}
                color="#FFFFFF"
              />
            </View>
          ) : (
            <IconSymbol
              name={currentFABConfig.icon}
              size={24}
              color="#FFFFFF"
            />
          )}
        </Animated.View>
      </GestureDetector>
      
      {/* Quick Log Modal */}
      <QuickLogModal
        visible={quickLogModalVisible}
        onClose={handleQuickLogModalClose}
        onSuccess={handleQuickLogSuccess}
        childId={selectedChildId}
      />
      
      {/* Add Inventory Modal */}
      <AddInventoryModal
        visible={addInventoryModalVisible}
        onClose={handleAddInventoryModalClose}
        onSuccess={handleAddInventorySuccess}
        childId={selectedChildId}
      />
      
      {/* Legal Modal */}
      <LegalModal
        isVisible={legalModalVisible}
        onClose={handleLegalModalClose}
        type={legalModalType}
      />
    </>
  );
}

