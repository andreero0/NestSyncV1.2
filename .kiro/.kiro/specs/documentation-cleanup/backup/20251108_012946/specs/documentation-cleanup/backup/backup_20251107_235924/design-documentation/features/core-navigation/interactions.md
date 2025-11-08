# Core Navigation Interaction Specifications

Detailed interaction patterns, animations, and feedback systems for the three-screen + FAB navigation architecture, optimized for smooth 60fps performance and stress-reduced parent workflows.

---
title: Core Navigation Interaction Specifications
description: Comprehensive interaction patterns, animations, and feedback for navigation system
feature: Core Navigation
last-updated: 2025-01-21
version: 1.0.0
related-files: 
  - README.md
  - user-journey.md
  - screen-states.md
dependencies:
  - React Native Reanimated v3
  - Expo Haptics
  - React Navigation v6
  - NativeBase components
status: approved
---

## Interaction Design Philosophy

### Core Principles for Stressed Parent Interactions

**Immediate Responsiveness**:
- All touch interactions provide feedback within 16ms (1 frame at 60fps)
- Visual feedback precedes action completion to maintain perceived performance
- Haptic feedback used strategically to confirm actions without overwhelming

**Cognitive Load Reduction**:
- Consistent interaction patterns across all screens reduce learning overhead
- Familiar mobile platform conventions maintained (iOS/Android native behaviors)
- Error prevention prioritized over error handling through smart defaults

**Emotional Safety Through Predictability**:
- Animations convey system state and build user confidence
- Transitions maintain spatial relationships to prevent disorientation
- Feedback loops close quickly to reduce anxiety about action success

---

## Screen Transition Interactions

### Tab Navigation Transitions

#### Tab Switch Animation System
**Duration**: 300ms (balanced between responsiveness and perception)
**Easing**: `cubic-bezier(0.2, 0, 0.2, 1)` - Material Design standard
**Performance**: Hardware-accelerated transforms only

**React Native Reanimated Implementation**:
```typescript
import { useSharedValue, useAnimatedStyle, withTiming, runOnJS } from 'react-native-reanimated';

const TabTransition = ({ children, activeIndex, targetIndex }) => {
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  const switchTab = (newIndex: number) => {
    // Immediate haptic feedback
    runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
    
    // Subtle slide animation
    translateX.value = withTiming(newIndex > activeIndex ? -20 : 20, 
      { duration: 150 }, () => {
        translateX.value = withTiming(0, { duration: 150 });
      }
    );
    
    // Content fade for smooth transition
    opacity.value = withTiming(0.7, { duration: 100 }, () => {
      opacity.value = withTiming(1, { duration: 200 });
    });
  };

  return (
    <Animated.View style={animatedStyle}>
      {children}
    </Animated.View>
  );
};
```

#### Platform-Specific Transition Behaviors

**iOS Navigation Patterns**:
- **Swipe Back Gesture**: Enabled on all screens for intuitive navigation
- **Edge Swipe**: Right-edge swipe returns to previous screen
- **Transition Style**: Smooth slide with iOS-standard timing curves
- **Haptic Integration**: Light impact on swipe initiation, selection change

```typescript
// iOS-specific navigation options
const iosTabOptions = {
  tabBarButton: (props) => (
    <TouchableOpacity
      {...props}
      activeOpacity={0.7}
      onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
    />
  ),
  // Enable swipe gestures
  gestureEnabled: true,
  gestureDirection: 'horizontal',
  transitionSpec: {
    open: { animation: 'spring', config: { stiffness: 1000, damping: 500, mass: 3, overshootClamping: true } },
    close: { animation: 'spring', config: { stiffness: 1000, damping: 500, mass: 3, overshootClamping: true } }
  }
};
```

**Android Navigation Patterns**:
- **Material Transitions**: Shared element transitions where appropriate
- **Elevation Changes**: Tab bar elevation increases on interaction
- **Ripple Effects**: Material ripple feedback on tab touches
- **Back Button**: Hardware back button navigates between tabs logically

```typescript
// Android-specific navigation configuration
const androidTabOptions = {
  tabBarButton: (props) => (
    <Pressable
      {...props}
      android_ripple={{
        color: 'rgba(8, 145, 178, 0.2)',
        borderless: false,
        radius: 28
      }}
      onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
    />
  ),
  // Material elevation
  tabBarStyle: {
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  }
};
```

---

## Context-Aware FAB Interactions

### FAB Core Interaction System

#### Touch State Management
**States**: Default → Pressed → Loading → Success → Default
**Duration**: Complete cycle optimized for <10-second user journeys

**Touch Feedback Sequence**:
```typescript
const FABInteraction = ({ currentScreen, onPress }) => {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const shadowElevation = useSharedValue(8);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` }
    ],
    shadowOpacity: shadowElevation.value / 16,
  }));

  const handlePressIn = () => {
    // Immediate visual feedback
    scale.value = withTiming(0.9, { duration: 100 });
    shadowElevation.value = withTiming(12, { duration: 100 });
    
    // Haptic feedback
    runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handlePressOut = () => {
    // Spring back with personality
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 350,
    });
    
    // Add playful rotation
    rotation.value = withSequence(
      withTiming(15, { duration: 100 }),
      withSpring(0, { damping: 12, stiffness: 400 })
    );
    
    shadowElevation.value = withTiming(8, { duration: 200 });
  };

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
      >
        {getFABContent(currentScreen)}
      </Pressable>
    </Animated.View>
  );
};
```

#### Context-Aware Icon Morphing

**Transition Logic**: Smooth icon changes based on active screen
**Duration**: 250ms morph animation
**Performance**: Vector-based icons with transform animations

```typescript
const FABIconMorph = ({ currentScreen }) => {
  const iconScale = useSharedValue(1);
  const iconRotation = useSharedValue(0);
  
  useEffect(() => {
    // Morphing animation sequence
    iconScale.value = withSequence(
      withTiming(0.5, { duration: 125 }), // Shrink
      withTiming(1, { duration: 125 })    // Grow with new icon
    );
    
    iconRotation.value = withTiming(360, { duration: 250 }, () => {
      iconRotation.value = 0; // Reset for next transition
    });
  }, [currentScreen]);

  const getIconComponent = () => {
    switch(currentScreen) {
      case 'home': return <EditIcon size="24" color="white" />;
      case 'planner': return <PackageIcon size="24" color="white" />;
      case 'settings': return <ShareIcon size="24" color="white" />;
    }
  };

  return (
    <Animated.View style={useAnimatedStyle(() => ({
      transform: [
        { scale: iconScale.value },
        { rotate: `${iconRotation.value}deg` }
      ]
    }))}>
      {getIconComponent()}
    </Animated.View>
  );
};
```

---

## Quick Logging Modal Interactions

### Modal Presentation Animation

#### Entry Animation Sequence
**Psychological Goal**: Confidence and focus, not disruption
**Duration**: 300ms total entry, 200ms exit
**Physics**: Spring-based for natural feel

```typescript
const QuickLogModal = ({ visible, onClose, onSave }) => {
  const modalScale = useSharedValue(0.9);
  const modalOpacity = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);
  
  useEffect(() => {
    if (visible) {
      // Entry sequence
      backdropOpacity.value = withTiming(0.5, { duration: 200 });
      modalScale.value = withSpring(1, {
        damping: 20,
        stiffness: 300,
      });
      modalOpacity.value = withTiming(1, { duration: 200 });
    } else {
      // Exit sequence  
      backdropOpacity.value = withTiming(0, { duration: 150 });
      modalScale.value = withTiming(0.95, { duration: 150 });
      modalOpacity.value = withTiming(0, { duration: 150 });
    }
  }, [visible]);

  const animatedModalStyle = useAnimatedStyle(() => ({
    transform: [{ scale: modalScale.value }],
    opacity: modalOpacity.value,
  }));
  
  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  return (
    <Modal transparent visible={visible}>
      <Animated.View style={[styles.backdrop, animatedBackdropStyle]}>
        <Pressable style={styles.backdropPress} onPress={onClose} />
        <Animated.View style={[styles.modal, animatedModalStyle]}>
          <QuickLogContent onSave={onSave} onClose={onClose} />
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};
```

### Time Selection Chip Interactions

#### Chip Selection Behavior
**Goal**: Eliminate typing for 90% of logging scenarios
**Feedback**: Immediate visual + haptic confirmation

```typescript
const TimeChip = ({ label, value, isSelected, onSelect }) => {
  const chipScale = useSharedValue(1);
  const chipColor = useSharedValue(isSelected ? 1 : 0);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: chipScale.value }],
    backgroundColor: interpolateColor(
      chipColor.value,
      [0, 1],
      ['#F3F4F6', '#0891B2'] // Neutral-100 to Primary blue
    )
  }));

  const handlePress = () => {
    // Immediate feedback
    chipScale.value = withSequence(
      withTiming(1.05, { duration: 50 }),
      withSpring(1, { damping: 15, stiffness: 400 })
    );
    
    // Color transition
    chipColor.value = withTiming(1, { duration: 150 });
    
    // Haptic feedback
    runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
    
    // Selection callback
    runOnJS(onSelect)(value);
  };

  useEffect(() => {
    chipColor.value = withTiming(isSelected ? 1 : 0, { duration: 150 });
  }, [isSelected]);

  return (
    <Pressable onPress={handlePress}>
      <Animated.View style={[styles.chip, animatedStyle]}>
        <Text style={styles.chipText}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
};
```

### Type Selection Interface

#### Visual Icon + Touch Interaction
**Design Principle**: Reduce cognitive load through visual recognition
**Touch Targets**: Generous sizing for stress/fatigue scenarios

```typescript
const TypeSelectionChips = ({ selectedType, onTypeSelect }) => {
  const chipTypes = [
    { id: 'wet', icon: '💧', label: 'Wet', color: '#3B82F6' },
    { id: 'soiled', icon: '💩', label: 'Soiled', color: '#F59E0B' },
    { id: 'both', icon: '💧💩', label: 'Both', color: '#EF4444' }
  ];

  return (
    <View style={styles.typeContainer}>
      {chipTypes.map((type) => (
        <TypeChip
          key={type.id}
          type={type}
          isSelected={selectedType === type.id}
          onSelect={onTypeSelect}
        />
      ))}
    </View>
  );
};

const TypeChip = ({ type, isSelected, onSelect }) => {
  const pressScale = useSharedValue(1);
  const borderWidth = useSharedValue(isSelected ? 2 : 1);
  const borderColor = useSharedValue(isSelected ? 1 : 0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
    borderWidth: borderWidth.value,
    borderColor: interpolateColor(
      borderColor.value,
      [0, 1],
      ['#E5E7EB', type.color] // Neutral-200 to type color
    )
  }));

  const handlePressIn = () => {
    pressScale.value = withTiming(0.95, { duration: 100 });
  };

  const handlePressOut = () => {
    pressScale.value = withSpring(1, { damping: 12, stiffness: 400 });
  };

  const handlePress = () => {
    borderWidth.value = withTiming(2, { duration: 150 });
    borderColor.value = withTiming(1, { duration: 150 });
    
    runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
    runOnJS(onSelect)(type.id);
  };

  useEffect(() => {
    borderWidth.value = withTiming(isSelected ? 2 : 1, { duration: 150 });
    borderColor.value = withTiming(isSelected ? 1 : 0, { duration: 150 });
  }, [isSelected]);

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      style={styles.chipWrapper}
    >
      <Animated.View style={[styles.typeChip, animatedStyle]}>
        <Text style={styles.typeIcon}>{type.icon}</Text>
        <Text style={styles.typeLabel}>{type.label}</Text>
      </Animated.View>
    </Pressable>
  );
};
```

---

## Loading States & Feedback Patterns

### Progressive Loading Experience

#### Home Screen Data Loading
**Strategy**: Skeleton screens + progressive enhancement
**Goal**: Perceived performance over actual performance

```typescript
const HomeScreenLoader = ({ isLoading, data }) => {
  const skeletonOpacity = useSharedValue(1);
  const contentOpacity = useSharedValue(0);
  
  useEffect(() => {
    if (!isLoading && data) {
      // Smooth transition from skeleton to content
      skeletonOpacity.value = withTiming(0, { duration: 200 });
      contentOpacity.value = withTiming(1, { duration: 300, delay: 100 });
    }
  }, [isLoading, data]);

  const skeletonStyle = useAnimatedStyle(() => ({
    opacity: skeletonOpacity.value,
    position: skeletonOpacity.value > 0 ? 'relative' : 'absolute',
  }));
  
  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={skeletonStyle}>
        <StatusCardSkeleton />
        <ActivityListSkeleton />
        <RecommendationSkeleton />
      </Animated.View>
      
      <Animated.View style={contentStyle}>
        <StatusCard data={data?.status} />
        <ActivityList data={data?.recentActivity} />
        <Recommendations data={data?.recommendations} />
      </Animated.View>
    </View>
  );
};
```

#### Save Action Feedback Sequence
**Goal**: Clear confirmation without interrupting flow
**Duration**: <2 seconds total including confirmation

```typescript
const SaveButton = ({ onSave, isLoading }) => {
  const buttonScale = useSharedValue(1);
  const iconRotation = useSharedValue(0);
  const successScale = useSharedValue(0);
  
  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }]
  }));
  
  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${iconRotation.value}deg` }]
  }));
  
  const animatedSuccessStyle = useAnimatedStyle(() => ({
    transform: [{ scale: successScale.value }],
    opacity: successScale.value,
  }));

  const handleSave = async () => {
    // Press feedback
    buttonScale.value = withTiming(0.95, { duration: 100 });
    
    // Loading state
    iconRotation.value = withRepeat(
      withTiming(360, { duration: 1000 }),
      -1 // Infinite until success
    );
    
    try {
      await onSave();
      
      // Success sequence
      iconRotation.value = withTiming(0, { duration: 200 });
      buttonScale.value = withTiming(1, { duration: 200 });
      
      // Success indicator
      successScale.value = withSequence(
        withTiming(1.2, { duration: 300 }),
        withTiming(0, { duration: 500, delay: 1000 })
      );
      
      // Success haptic
      runOnJS(Haptics.notificationAsync)(
        Haptics.NotificationFeedbackType.Success
      );
      
    } catch (error) {
      // Error handling
      buttonScale.value = withSequence(
        withTiming(1.1, { duration: 100 }),
        withTiming(1, { duration: 100 })
      );
      
      runOnJS(Haptics.notificationAsync)(
        Haptics.NotificationFeedbackType.Error
      );
    }
  };

  return (
    <View style={styles.saveContainer}>
      <Animated.View style={animatedButtonStyle}>
        <Pressable onPress={handleSave} disabled={isLoading}>
          <View style={styles.saveButton}>
            <Animated.View style={animatedIconStyle}>
              {isLoading ? <SpinnerIcon /> : <SaveIcon />}
            </Animated.View>
            <Text style={styles.saveText}>Save</Text>
          </View>
        </Pressable>
      </Animated.View>
      
      <Animated.View style={[styles.successIndicator, animatedSuccessStyle]}>
        <CheckmarkIcon color="green" />
      </Animated.View>
    </View>
  );
};
```

---

## Haptic Feedback Integration

### Haptic Hierarchy & Usage Patterns

#### Feedback Intensity Mapping
**Light Impact**: Selection changes, chip toggles, minor interactions
**Medium Impact**: Primary actions, FAB presses, important confirmations  
**Heavy Impact**: Reserved for critical alerts only
**Success/Error Notifications**: System-level feedback for action outcomes

```typescript
const HapticFeedbackManager = {
  // Selection and navigation
  selection: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  
  // Primary actions
  action: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  
  // Success confirmations
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  
  // Error states
  error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
  
  // Warning alerts
  warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
  
  // Custom patterns for specific interactions
  fabPress: () => {
    // Medium impact followed by light tap
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 100);
  }
};
```

#### Context-Aware Haptic Usage

```typescript
const InteractionWithHaptics = ({ type, onInteraction }) => {
  const handleInteraction = (interactionType) => {
    switch(interactionType) {
      case 'tab-switch':
        HapticFeedbackManager.selection();
        break;
      case 'fab-press':
        HapticFeedbackManager.fabPress();
        break;
      case 'quick-log-save':
        HapticFeedbackManager.action();
        // Followed by success after save completion
        break;
      case 'critical-alert':
        HapticFeedbackManager.warning();
        break;
    }
    
    onInteraction(interactionType);
  };
  
  return null; // Implementation depends on specific component
};
```

---

## Touch Gesture Patterns

### Gesture Recognition & Response

#### Pull-to-Refresh Implementation
**Screens**: Home and Planner screens
**Goal**: Immediate data freshness for status-checking behavior

```typescript
const PullToRefreshWrapper = ({ children, onRefresh }) => {
  const translateY = useSharedValue(0);
  const refreshThreshold = 80;
  const isRefreshing = useSharedValue(false);
  
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0 && !isRefreshing.value) {
        translateY.value = Math.min(event.translationY * 0.5, refreshThreshold);
      }
    })
    .onEnd((event) => {
      if (translateY.value >= refreshThreshold && !isRefreshing.value) {
        isRefreshing.value = true;
        
        // Trigger refresh
        runOnJS(onRefresh)(() => {
          isRefreshing.value = false;
          translateY.value = withSpring(0);
        });
        
        // Haptic feedback
        runOnJS(HapticFeedbackManager.action)();
      } else {
        translateY.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }]
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={animatedStyle}>
        {children}
        <RefreshIndicator 
          progress={translateY.value / refreshThreshold}
          isRefreshing={isRefreshing.value}
        />
      </Animated.View>
    </GestureDetector>
  );
};
```

#### Long Press Actions
**Context**: Quick actions on list items, bulk operations
**Feedback**: Haptic + visual confirmation

```typescript
const LongPressListItem = ({ item, onLongPress, onPress }) => {
  const scale = useSharedValue(1);
  const longPressGesture = Gesture.LongPress()
    .minDuration(500)
    .onStart(() => {
      scale.value = withTiming(0.98, { duration: 500 });
      runOnJS(HapticFeedbackManager.action)();
    })
    .onEnd(() => {
      scale.value = withSpring(1);
      runOnJS(onLongPress)(item);
    });
    
  const tapGesture = Gesture.Tap()
    .onEnd(() => {
      runOnJS(onPress)(item);
    });
    
  const composedGesture = Gesture.Exclusive(longPressGesture, tapGesture);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={animatedStyle}>
        {/* Item content */}
      </Animated.View>
    </GestureDetector>
  );
};
```

---

## Accessibility Interaction Requirements

### Screen Reader Integration

#### Accessible Navigation Announcements
```typescript
const AccessibleTabNavigation = ({ currentTab, onTabChange }) => {
  const announceTabChange = (tabName) => {
    AccessibilityInfo.announceForAccessibility(
      `Switched to ${tabName} screen`
    );
  };
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarAccessibilityLabel: getAccessibilityLabel(route.name),
        tabBarAccessibilityHint: getAccessibilityHint(route.name),
        tabBarAccessibilityRole: 'tab',
      })}
      screenListeners={{
        tabPress: (e) => {
          const tabName = e.target.split('-')[0];
          announceTabChange(tabName);
        }
      }}
    >
      {/* Tab screens */}
    </Tab.Navigator>
  );
};

const getAccessibilityLabel = (routeName) => {
  switch(routeName) {
    case 'Home': return 'Home tab, current status view';
    case 'Planner': return 'Planner tab, future planning tools';
    case 'Settings': return 'Settings tab, account and privacy controls';
  }
};

const getAccessibilityHint = (routeName) => {
  switch(routeName) {
    case 'Home': return 'View current diaper supply status and recent activity';
    case 'Planner': return 'Access planning tools and usage analytics';  
    case 'Settings': return 'Manage account, children, and privacy settings';
  }
};
```

#### FAB Accessibility Implementation
```typescript
const AccessibleFAB = ({ currentScreen, onPress }) => {
  const getFABAccessibilityProps = (screen) => {
    switch(screen) {
      case 'home':
        return {
          accessibilityLabel: 'Log diaper change',
          accessibilityHint: 'Opens quick logging form for Emma',
          accessibilityRole: 'button'
        };
      case 'planner': 
        return {
          accessibilityLabel: 'Add inventory',
          accessibilityHint: 'Add new diaper inventory or create reorder',
          accessibilityRole: 'button'
        };
      case 'settings':
        return {
          accessibilityLabel: 'Add or share',  
          accessibilityHint: 'Add new child or share access with caregiver',
          accessibilityRole: 'button'
        };
    }
  };
  
  return (
    <Pressable 
      {...getFABAccessibilityProps(currentScreen)}
      onPress={onPress}
      style={styles.fab}
    >
      <FABIcon currentScreen={currentScreen} />
    </Pressable>
  );
};
```

### Keyboard Navigation Support

#### Focus Management System
```typescript
const KeyboardNavigationManager = ({ children }) => {
  const focusableElements = useRef([]);
  const currentFocusIndex = useRef(0);
  
  useEffect(() => {
    const keyboardListener = (event) => {
      switch(event.key) {
        case 'Tab':
          event.preventDefault();
          moveFocus(event.shiftKey ? -1 : 1);
          break;
        case 'Enter':
        case ' ':
          event.preventDefault();
          activateCurrentElement();
          break;
        case 'Escape':
          event.preventDefault();
          handleEscape();
          break;
      }
    };
    
    // Add keyboard event listeners
    return () => {
      // Cleanup listeners
    };
  }, []);
  
  const moveFocus = (direction) => {
    const nextIndex = currentFocusIndex.current + direction;
    if (nextIndex >= 0 && nextIndex < focusableElements.current.length) {
      currentFocusIndex.current = nextIndex;
      focusableElements.current[nextIndex].focus();
    }
  };
  
  return (
    <View onKeyDown={keyboardListener}>
      {children}
    </View>
  );
};
```

---

## Performance Optimization

### Animation Performance Targets

#### 60fps Maintenance Strategy
```typescript
const PerformanceOptimizedAnimation = () => {
  // Use native driver for all transforms and opacity changes
  const animationConfig = {
    useNativeDriver: true,
    // Avoid animating layout properties
    properties: ['transform', 'opacity'],
    // Batch animations where possible
    enableBatching: true
  };
  
  // Optimize expensive operations
  const optimizedTransform = useDerivedValue(() => {
    return {
      transform: [
        { translateX: sharedValue.value },
        { scale: scaleValue.value }
      ]
    };
  });
  
  return null;
};
```

#### Memory Management for Smooth Navigation
```typescript
const NavigationPerformanceManager = {
  // Lazy load non-critical screens
  lazyScreens: ['Settings', 'Analytics'],
  
  // Pre-load critical paths
  preloadCriticalScreens: () => {
    // Home screen always ready
    // Planner screen pre-loaded for efficiency users
  },
  
  // Clean up resources when screens unmount
  cleanup: (screenName) => {
    // Cancel running animations
    // Clear cached data if appropriate
    // Remove event listeners
  },
  
  // Optimize image loading
  imageOptimization: {
    lazy: true,
    placeholder: SkeletonComponent,
    cachePolicy: 'memory-disk'
  }
};
```

This comprehensive interaction specification ensures that every touch, gesture, and animation serves the psychological and practical needs of stressed parents while maintaining technical excellence through React Native Reanimated, Expo Haptics, and accessibility best practices.