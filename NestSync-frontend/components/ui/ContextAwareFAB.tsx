import React, { useEffect, useState } from 'react';
import { StyleSheet, Platform, View, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSegments, useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@apollo/client';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
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
import { GET_REORDER_SUGGESTIONS } from '@/lib/graphql/reorder-queries';

interface FABConfig {
  icon: string;
  accessibilityLabel: string;
  action: () => void;
  backgroundColor?: string;
  pulseAnimation?: boolean;
}

interface FABContextMap {
  [key: string]: FABConfig;
}

interface ReorderState {
  hasCriticalReorders: boolean;
  hasModerateReorders: boolean;
  totalSuggestions: number;
  topSuggestion?: any;
  loading: boolean;
}

/**
 * Custom hook for intelligent reorder detection
 * Analyzes ML-powered reorder suggestions to determine FAB context priority
 */
function useReorderDetection(childId: string): ReorderState {
  // Query reorder suggestions with optimized polling
  const { data: reorderData, loading } = useQuery(GET_REORDER_SUGGESTIONS, {
    variables: { childId, limit: 5 },
    skip: !childId,
    pollInterval: 60000, // Check every minute for fresh suggestions
    fetchPolicy: Platform.OS === 'web' ? 'cache-first' : 'cache-and-network',
    errorPolicy: 'ignore', // Don't break FAB for reorder errors
  });

  // Analyze suggestions for intelligent priority classification
  const suggestions = reorderData?.getReorderSuggestions || [];

  // Critical: High confidence + High priority + Low inventory
  const criticalSuggestions = suggestions.filter((s: any) =>
    s.confidence > 0.8 &&
    s.priority === 'HIGH' &&
    s.currentInventoryLevel < 3 // Less than 3 days of inventory
  );

  // Moderate: Good confidence + Medium priority OR moderate inventory
  const moderateSuggestions = suggestions.filter((s: any) =>
    (s.confidence > 0.6 && s.priority === 'MEDIUM') ||
    (s.confidence > 0.7 && s.currentInventoryLevel < 7) // Less than a week
  );

  return {
    hasCriticalReorders: criticalSuggestions.length > 0,
    hasModerateReorders: moderateSuggestions.length > 0,
    totalSuggestions: suggestions.length,
    topSuggestion: suggestions[0],
    loading,
  };
}

export function ContextAwareFAB() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const router = useRouter();
  
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
  const reorderPulse = useSharedValue(1);

  // Intelligent reorder detection for selected child
  const reorderState = useReorderDetection(selectedChildId);
  
  // Enhanced route context detection with view state
  const currentRoute = segments[1] || 'index'; // Get the tab route (index, planner, settings)
  const params = useLocalSearchParams<{ view?: string }>();
  const currentView = params.view;

  // Create combined context key for more granular FAB behavior
  const getContextKey = () => {
    if (currentRoute === 'planner' && currentView) {
      return `${currentRoute}-${currentView}`; // e.g., 'planner-analytics', 'planner-inventory'
    }
    return currentRoute; // Default to main route for other cases
  };

  const contextKey = getContextKey();

  // Only hide FAB in specific contexts where no action is appropriate
  const shouldHideFAB = false; // We now provide context-specific actions instead of hiding
  
  // Enhanced context-aware FAB configurations with granular view support
  const fabContexts: FABContextMap = {
    index: {
      icon: showAddFirstChild ? 'person.badge.plus' : 'plus.circle.fill',
      accessibilityLabel: showAddFirstChild ? 'Add your first child' : 'Quick log diaper change',
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
    'planner-analytics': {
      icon: 'chart.bar.doc.horizontal',
      accessibilityLabel: 'View analytics insights',
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
            'Add your first child to start tracking and get insights.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Add Child', onPress: () => console.log('Navigate to child creation') }
            ]
          );
          return;
        }

        Alert.alert(
          'Analytics Insights',
          'View detailed patterns and export your data for deeper analysis.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Export Data',
              onPress: () => {
                console.log('Export analytics data');
                // TODO: Implement data export functionality
                Alert.alert('Export', 'Data export functionality coming soon!');
              }
            }
          ]
        );
      },
      backgroundColor: '#6366F1', // Indigo for analytics
    },
    'planner-inventory': {
      icon: 'cube.box.fill',
      accessibilityLabel: 'Add inventory item',
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
            'Add your first child to start tracking inventory.',
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
      backgroundColor: '#10B981', // Green for inventory
    },
    'planner-planner': {
      // Intelligent reorder-aware icon selection
      icon: showAddFirstChild ? 'person.badge.plus' :
            reorderState.hasCriticalReorders ? 'brain.head.profile' :
            reorderState.hasModerateReorders ? 'lightbulb.fill' :
            'wand.and.stars',
      // Context-aware accessibility labels for stress-reduction UX
      accessibilityLabel: showAddFirstChild ? 'Add your first child' :
                         reorderState.hasCriticalReorders ? 'Critical reorder suggestions available' :
                         reorderState.hasModerateReorders ? 'Reorder suggestions available' :
                         'Smart planning suggestions',
      // Intelligent action prioritization with reorder detection
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
            'Choose which child you\'d like to create planning suggestions for.',
            [{ text: 'OK' }]
          );
          return;
        }

        // Priority 1: Critical reorder suggestions (immediate navigation)
        if (reorderState.hasCriticalReorders) {
          Alert.alert(
            'Critical Reorder Suggestions',
            'You have critical reorder suggestions that need immediate attention.',
            [
              { text: 'Later', style: 'cancel' },
              {
                text: 'View Now',
                onPress: () => {
                  router.push('/reorder-suggestions?priority=critical');
                }
              }
            ]
          );
          return;
        }

        // Priority 2: Moderate reorder suggestions (optional navigation)
        if (reorderState.hasModerateReorders) {
          Alert.alert(
            'Smart Suggestions Available',
            `We have ${reorderState.totalSuggestions} smart suggestion${reorderState.totalSuggestions > 1 ? 's' : ''} to help you stay prepared.`,
            [
              { text: 'Later', style: 'cancel' },
              {
                text: 'View Suggestions',
                onPress: () => {
                  router.push('/reorder-suggestions?priority=moderate');
                }
              }
            ]
          );
          return;
        }

        // Priority 3: Default to reorder suggestions page for planning
        router.push('/reorder-suggestions');
      },
      // Enhanced styling for reorder states
      backgroundColor: reorderState.hasCriticalReorders ? colors.error :
                      reorderState.hasModerateReorders ? '#0891B2' : // NestSync premium blue
                      '#8B5CF6', // Purple for planning
      pulseAnimation: reorderState.hasCriticalReorders,
    },
    planner: {
      // Fallback for planner route without specific view (should rarely be used)
      icon: 'calendar.badge.plus',
      accessibilityLabel: 'Open planner',
      action: () => {
        router.push('/planner?view=planner');
      },
    },
    inventory: {
      // Dedicated inventory tab FAB
      icon: 'cube.box.fill',
      accessibilityLabel: 'Add inventory item',
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
            'Add your first child to start tracking inventory.',
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
      backgroundColor: '#10B981', // Green for inventory
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
  
  // Get current FAB configuration using the enhanced context key
  const currentFABConfig = fabContexts[contextKey] || fabContexts[currentRoute] || fabContexts.index;
  
  // Enhanced FAB press handler with context-aware haptic feedback
  const handlePress = () => {
    // Context-aware haptic feedback based on urgency and context
    if (reorderState.hasCriticalReorders && contextKey.includes('planner')) {
      // Medium haptic for critical reorders (not heavy - avoid stress)
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else if (reorderState.hasModerateReorders && contextKey.includes('planner')) {
      // Light haptic for moderate reorders
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else if (contextKey === 'planner-analytics') {
      // Gentle haptic for analytics actions
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else if (contextKey === 'planner-inventory') {
      // Medium haptic for inventory actions
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      // Default medium haptic for regular actions
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

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
  
  // Enhanced context change animation with view state awareness
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
  }, [contextKey, reorderState.hasCriticalReorders, reorderState.hasModerateReorders]);

  // Intelligent reorder pulse animation for critical states
  useEffect(() => {
    if (reorderState.hasCriticalReorders && contextKey.includes('planner')) {
      // Gentle pulsing for critical reorders (stress-reduction UX)
      reorderPulse.value = withRepeat(
        withSpring(1.05, { damping: 15, stiffness: 100 }),
        -1,
        true
      );
    } else {
      // Return to normal state
      reorderPulse.value = withSpring(1, { damping: 15, stiffness: 100 });
    }
  }, [reorderState.hasCriticalReorders, contextKey]);
  
  // Enhanced animated styles with reorder pulse integration
  const fabAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value * reorderPulse.value }, // Combine user interaction + reorder pulse
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
  
  // Dynamic styles with reorder-aware background colors
  const fabBackgroundColor = isLoading ? colors.tabIconDefault :
                           currentFABConfig.backgroundColor || colors.tint;

  const dynamicStyles = StyleSheet.create({
    fabContainer: {
      position: 'absolute',
      bottom: bottomPosition,
      right: 24,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: fabBackgroundColor,
      justifyContent: 'center',
      alignItems: 'center',
      // Enhanced shadow for reorder states
      shadowColor: reorderState.hasCriticalReorders ? colors.error : '#000',
      shadowOffset: {
        width: 0,
        height: reorderState.hasCriticalReorders ? 6 : 4,
      },
      shadowOpacity: reorderState.hasCriticalReorders ? 0.4 : 0.3,
      shadowRadius: reorderState.hasCriticalReorders ? 10 : 8,
      // Enhanced Android shadow for reorder states
      elevation: reorderState.hasCriticalReorders ? 12 : 8,
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
            fabAnimatedStyle
          ]}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={
            isLoading ? 'Loading...' :
            reorderState.loading ? 'Checking for reorder suggestions...' :
            currentFABConfig.accessibilityLabel
          }
          accessibilityHint={
            isLoading ? 'Please wait' :
            reorderState.hasCriticalReorders ? 'Critical reorder suggestions available, double tap to review' :
            reorderState.hasModerateReorders ? 'Reorder suggestions available, double tap to review' :
            'Double tap to activate'
          }
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

