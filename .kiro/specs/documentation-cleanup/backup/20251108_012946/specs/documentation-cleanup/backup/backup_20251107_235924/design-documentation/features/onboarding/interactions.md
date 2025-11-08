# Onboarding Interactions Design Specification

Comprehensive interaction patterns, animations, and micro-interactions for the complete NestSync onboarding system, optimized for stressed Canadian parents and accessibility requirements.

---
title: Onboarding Interactions Design
description: Detailed interaction patterns and animations across all onboarding phases
feature: Onboarding
last-updated: 2025-01-21
version: 1.0.0
related-files: 
  - README.md
  - user-journey.md
  - authentication.md
  - consent-flow.md
  - splash-screen.md
dependencies:
  - React Native Reanimated v3
  - React Native Gesture Handler
  - NativeBase interactions
  - Haptic feedback system
status: approved
---

## Interaction Design Philosophy

### Stress-Aware Interaction Design

**Core Principles**:
1. **Predictable Responses**: Every user action produces immediate, expected feedback
2. **Forgiving Interfaces**: Easy error recovery with clear guidance
3. **Confident Progression**: User always knows where they are and what's next
4. **Minimal Cognitive Load**: Interactions feel natural and require minimal learning

**Stress Mitigation Through Interaction**:
- **Immediate Feedback**: All taps/touches respond within 16ms
- **Clear State Changes**: Visual feedback for every interaction
- **Undo Capabilities**: Easy correction of mistakes without starting over
- **Progress Preservation**: Never lose user progress due to interaction errors

### Animation & Motion Strategy

**Motion Psychology for New Parents**:
- **Calming Motion**: Gentle easing functions reduce anxiety
- **Purposeful Animation**: Every motion serves a functional purpose
- **Reduced Motion Support**: Respect accessibility preferences
- **Performance First**: 60fps minimum for trust building

## Phase 1: Splash Screen Interactions

### Loading Sequence Animations

**Timeline Animation System**:
```typescript
// Using React Native Reanimated v3
const useOnboardingSplashAnimation = () => {
  const appNameOpacity = useSharedValue(0);
  const appNameScale = useSharedValue(0.9);
  const mapleLeafScale = useSharedValue(0);
  const mapleLeafRotation = useSharedValue(-15);
  const taglineOpacity = useSharedValue(0);
  const trustIndicatorOpacity = useSharedValue(0);
  const progressValue = useSharedValue(0);

  const animateSequence = () => {
    // App name entrance (0-600ms)
    appNameOpacity.value = withTiming(1, { duration: 600 });
    appNameScale.value = withSpring(1, {
      tension: 100,
      friction: 8,
    });

    // Maple leaf entrance (400-1000ms)
    mapleLeafScale.value = withDelay(400, withSpring(1, {
      tension: 120,
      friction: 10,
    }));
    mapleLeafRotation.value = withDelay(400, withSpring(0, {
      tension: 80,
      friction: 12,
    }));

    // Tagline fade in (800-1400ms)
    taglineOpacity.value = withDelay(800, withTiming(1, { duration: 600 }));

    // Trust indicators (1200-1800ms)
    trustIndicatorOpacity.value = withDelay(1200, withTiming(1, { duration: 600 }));

    // Loading progress (1600-2400ms)
    progressValue.value = withDelay(1600, withTiming(100, { 
      duration: 800,
      easing: Easing.bezier(0.4, 0, 0.2, 1)
    }));
  };

  return {
    appNameStyle: useAnimatedStyle(() => ({
      opacity: appNameOpacity.value,
      transform: [{ scale: appNameScale.value }]
    })),
    mapleLeafStyle: useAnimatedStyle(() => ({
      transform: [
        { scale: mapleLeafScale.value },
        { rotate: `${mapleLeafRotation.value}deg` }
      ]
    })),
    taglineStyle: useAnimatedStyle(() => ({
      opacity: taglineOpacity.value
    })),
    trustIndicatorStyle: useAnimatedStyle(() => ({
      opacity: trustIndicatorOpacity.value
    })),
    progressStyle: useAnimatedStyle(() => ({
      width: `${progressValue.value}%`
    })),
    animateSequence
  };
};
```

### Loading Progress Interaction

**Progress Bar Animation**:
```typescript
// Smooth progress indication with micro-interactions
const LoadingProgress = () => {
  const progressWidth = useSharedValue(0);
  const pulseOpacity = useSharedValue(0.3);

  useEffect(() => {
    // Simulate realistic loading stages
    const loadingStages = [
      { progress: 20, message: "Initializing..." },
      { progress: 50, message: "Loading preferences..." },
      { progress: 80, message: "Preparing interface..." },
      { progress: 100, message: "Ready!" }
    ];

    loadingStages.forEach((stage, index) => {
      progressWidth.value = withDelay(
        index * 400,
        withTiming(stage.progress, { duration: 300 })
      );
    });

    // Subtle pulse animation for loading state
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 1000 }),
        withTiming(0.3, { duration: 1000 })
      ),
      -1
    );
  }, []);

  return (
    <Animated.View style={progressBarStyle}>
      <Animated.View 
        style={[
          progressFillStyle,
          useAnimatedStyle(() => ({
            width: `${progressWidth.value}%`,
            opacity: pulseOpacity.value
          }))
        ]} 
      />
    </Animated.View>
  );
};
```

### Transition to Consent Flow

**Exit Animation**:
```typescript
const useSplashExitAnimation = (onComplete: () => void) => {
  const fadeOpacity = useSharedValue(1);
  const scaleValue = useSharedValue(1);

  const triggerExit = () => {
    fadeOpacity.value = withTiming(0, { duration: 300 });
    scaleValue.value = withTiming(1.05, { 
      duration: 300,
      easing: Easing.bezier(0.4, 0, 1, 1)
    }, () => {
      runOnJS(onComplete)();
    });
  };

  return {
    exitStyle: useAnimatedStyle(() => ({
      opacity: fadeOpacity.value,
      transform: [{ scale: scaleValue.value }]
    })),
    triggerExit
  };
};
```

## Phase 2: Consent Flow Interactions

### Progressive Disclosure Animation

**Card Entrance Sequences**:
```typescript
const useConsentCardAnimations = () => {
  const benefitsCardY = useSharedValue(50);
  const benefitsCardOpacity = useSharedValue(0);
  const privacyCardY = useSharedValue(50);
  const privacyCardOpacity = useSharedValue(0);

  const animateCardsIn = () => {
    // Benefits card entrance
    benefitsCardY.value = withSpring(0, { tension: 100, friction: 8 });
    benefitsCardOpacity.value = withTiming(1, { duration: 400 });

    // Privacy card entrance (delayed)
    privacyCardY.value = withDelay(200, withSpring(0, { 
      tension: 100, 
      friction: 8 
    }));
    privacyCardOpacity.value = withDelay(200, withTiming(1, { 
      duration: 400 
    }));
  };

  return {
    benefitsCardStyle: useAnimatedStyle(() => ({
      opacity: benefitsCardOpacity.value,
      transform: [{ translateY: benefitsCardY.value }]
    })),
    privacyCardStyle: useAnimatedStyle(() => ({
      opacity: privacyCardOpacity.value,
      transform: [{ translateY: privacyCardY.value }]
    })),
    animateCardsIn
  };
};
```

### Consent Toggle Interactions

**Toggle Animation System**:
```typescript
const useConsentToggleAnimation = (isEnabled: boolean) => {
  const scaleValue = useSharedValue(1);
  const colorProgress = useSharedValue(isEnabled ? 1 : 0);
  const checkmarkScale = useSharedValue(isEnabled ? 1 : 0);

  const animateToggle = (newState: boolean) => {
    // Press feedback
    scaleValue.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withSpring(1, { tension: 300, friction: 10 })
    );

    // Color transition
    colorProgress.value = withTiming(newState ? 1 : 0, { duration: 200 });

    // Checkmark animation
    checkmarkScale.value = newState 
      ? withSpring(1, { tension: 200, friction: 10 })
      : withTiming(0, { duration: 150 });

    // Haptic feedback
    if (newState) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
    }
  };

  return {
    toggleStyle: useAnimatedStyle(() => ({
      transform: [{ scale: scaleValue.value }],
      backgroundColor: interpolateColor(
        colorProgress.value,
        [0, 1],
        ['#E5E7EB', '#0891B2']
      )
    })),
    checkmarkStyle: useAnimatedStyle(() => ({
      transform: [{ scale: checkmarkScale.value }]
    })),
    animateToggle
  };
};
```

### Required vs Optional Toggle Behavior

**Disabled State Interaction**:
```typescript
const RequiredConsentToggle = ({ label, description, isRequired = false }) => {
  const shakeAnimation = useSharedValue(0);

  const handlePress = () => {
    if (isRequired) {
      // Gentle shake to indicate cannot be disabled
      shakeAnimation.value = withSequence(
        withTiming(-3, { duration: 50 }),
        withTiming(3, { duration: 50 }),
        withTiming(-2, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );

      // Show explanatory toast
      showToast({
        title: "Required for app to function",
        description: "This data is essential for diaper tracking",
        status: "info",
        duration: 2000
      });

      // Gentle haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeAnimation.value }]
  }));

  return (
    <Animated.View style={animatedStyle}>
      <ConsentToggle 
        label={label}
        description={description}
        isChecked={true}
        isDisabled={isRequired}
        onPress={handlePress}
      />
    </Animated.View>
  );
};
```

### Page Transition Animations

**Screen Transition Within Consent Flow**:
```typescript
const useConsentScreenTransitions = () => {
  const currentScreenOpacity = useSharedValue(1);
  const currentScreenX = useSharedValue(0);
  const nextScreenX = useSharedValue(300); // Off-screen right
  const nextScreenOpacity = useSharedValue(0);

  const transitionToNext = (onComplete: () => void) => {
    // Current screen slides left and fades
    currentScreenX.value = withTiming(-300, { duration: 300 });
    currentScreenOpacity.value = withTiming(0, { duration: 300 });

    // Next screen slides in from right
    nextScreenX.value = withTiming(0, { duration: 300 });
    nextScreenOpacity.value = withTiming(1, { 
      duration: 300 
    }, () => {
      runOnJS(onComplete)();
    });
  };

  const transitionToPrevious = (onComplete: () => void) => {
    // Reverse animation for back navigation
    currentScreenX.value = withTiming(300, { duration: 300 });
    currentScreenOpacity.value = withTiming(0, { duration: 300 });

    nextScreenX.value = withTiming(0, { duration: 300 });
    nextScreenOpacity.value = withTiming(1, { 
      duration: 300 
    }, () => {
      runOnJS(onComplete)();
    });
  };

  return {
    currentScreenStyle: useAnimatedStyle(() => ({
      opacity: currentScreenOpacity.value,
      transform: [{ translateX: currentScreenX.value }]
    })),
    nextScreenStyle: useAnimatedStyle(() => ({
      opacity: nextScreenOpacity.value,
      transform: [{ translateX: nextScreenX.value }]
    })),
    transitionToNext,
    transitionToPrevious
  };
};
```

## Phase 3: Authentication Interactions

### Input Field Interactions

**Enhanced Input Field Animation**:
```typescript
const useAuthInputAnimation = (hasError: boolean, isFocused: boolean) => {
  const borderColor = useSharedValue('#D1D5DB'); // Neutral-300
  const borderWidth = useSharedValue(1);
  const backgroundColor = useSharedValue('#FFFFFF');
  const labelScale = useSharedValue(1);
  const labelY = useSharedValue(0);
  const shakeX = useSharedValue(0);

  useEffect(() => {
    if (hasError) {
      // Error state animation
      borderColor.value = withTiming('#EF4444', { duration: 200 });
      backgroundColor.value = withTiming('#FEF2F2', { duration: 200 });
      
      // Shake animation for error
      shakeX.value = withSequence(
        withTiming(-4, { duration: 50 }),
        withTiming(4, { duration: 50 }),
        withTiming(-3, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else if (isFocused) {
      // Focus state animation
      borderColor.value = withTiming('#0891B2', { duration: 200 });
      borderWidth.value = withTiming(2, { duration: 200 });
      backgroundColor.value = withTiming('#FFFFFF', { duration: 200 });
    } else {
      // Default state
      borderColor.value = withTiming('#D1D5DB', { duration: 200 });
      borderWidth.value = withTiming(1, { duration: 200 });
      backgroundColor.value = withTiming('#FFFFFF', { duration: 200 });
    }
  }, [hasError, isFocused]);

  return {
    inputStyle: useAnimatedStyle(() => ({
      borderColor: borderColor.value,
      borderWidth: borderWidth.value,
      backgroundColor: backgroundColor.value,
      transform: [{ translateX: shakeX.value }]
    }))
  };
};
```

### Password Visibility Toggle

**Eye Icon Animation**:
```typescript
const PasswordVisibilityToggle = ({ isVisible, onToggle }) => {
  const rotateValue = useSharedValue(0);
  const scaleValue = useSharedValue(1);

  const handleToggle = () => {
    // Rotation animation
    rotateValue.value = withSequence(
      withTiming(90, { duration: 150 }),
      withTiming(0, { duration: 150 })
    );

    // Scale animation for press feedback
    scaleValue.value = withSequence(
      withTiming(0.9, { duration: 100 }),
      withSpring(1, { tension: 300, friction: 10 })
    );

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotateY: `${rotateValue.value}deg` },
      { scale: scaleValue.value }
    ]
  }));

  return (
    <Pressable onPress={handleToggle} hitSlop={8}>
      <Animated.View style={animatedStyle}>
        <Icon 
          name={isVisible ? 'eye-slash' : 'eye'} 
          size={20} 
          color="#6B7280" 
        />
      </Animated.View>
    </Pressable>
  );
};
```

### Social Authentication Button Interactions

**Social Button Press Animations**:
```typescript
const useSocialAuthAnimation = (provider: 'apple' | 'google' | 'facebook') => {
  const scaleValue = useSharedValue(1);
  const shadowOpacity = useSharedValue(0.1);
  const isLoading = useSharedValue(false);
  const spinValue = useSharedValue(0);

  const animatePress = () => {
    scaleValue.value = withSequence(
      withTiming(0.96, { duration: 100 }),
      withSpring(1, { tension: 300, friction: 10 })
    );

    shadowOpacity.value = withSequence(
      withTiming(0.2, { duration: 100 }),
      withTiming(0.1, { duration: 200 })
    );
  };

  const animateLoading = () => {
    isLoading.value = true;
    spinValue.value = withRepeat(
      withTiming(360, { duration: 1000, easing: Easing.linear }),
      -1
    );
  };

  const stopLoading = () => {
    isLoading.value = false;
    spinValue.value = withTiming(0, { duration: 200 });
  };

  return {
    buttonStyle: useAnimatedStyle(() => ({
      transform: [{ scale: scaleValue.value }],
      shadowOpacity: shadowOpacity.value,
      elevation: shadowOpacity.value * 50 // Android shadow
    })),
    iconStyle: useAnimatedStyle(() => ({
      transform: [{ rotate: `${spinValue.value}deg` }],
      opacity: isLoading.value ? 0 : 1
    })),
    loadingStyle: useAnimatedStyle(() => ({
      opacity: isLoading.value ? 1 : 0,
      transform: [{ rotate: `${spinValue.value}deg` }]
    })),
    animatePress,
    animateLoading,
    stopLoading
  };
};
```

### Email Verification Code Input

**6-Digit Code Input Animation**:
```typescript
const VerificationCodeInput = ({ onComplete }) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);
  const focusAnimations = code.map(() => useSharedValue(0));
  const shakeAnimations = code.map(() => useSharedValue(0));

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only single digits

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-advance to next field
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
      
      // Focus animation for next field
      focusAnimations[index + 1].value = withSpring(1, {
        tension: 200,
        friction: 10
      });
    }

    // Check if complete
    if (newCode.every(digit => digit !== '')) {
      onComplete(newCode.join(''));
    }
  };

  const handleInvalidCode = () => {
    // Shake all inputs
    shakeAnimations.forEach(shakeAnim => {
      shakeAnim.value = withSequence(
        withTiming(-3, { duration: 50 }),
        withTiming(3, { duration: 50 }),
        withTiming(-2, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

    // Clear inputs and focus first
    setCode(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();
  };

  return (
    <HStack space={3} justifyContent="center">
      {code.map((digit, index) => (
        <Animated.View
          key={index}
          style={useAnimatedStyle(() => ({
            transform: [
              { scale: 1 + focusAnimations[index].value * 0.05 },
              { translateX: shakeAnimations[index].value }
            ],
            borderColor: interpolateColor(
              focusAnimations[index].value,
              [0, 1],
              ['#D1D5DB', '#0891B2']
            )
          }))}
        >
          <Input
            ref={(ref) => inputRefs.current[index] = ref}
            value={digit}
            onChangeText={(value) => handleCodeChange(index, value)}
            keyboardType="numeric"
            maxLength={1}
            textAlign="center"
            width={12}
            height={12}
            fontSize="lg"
            onFocus={() => {
              focusAnimations[index].value = withSpring(1);
            }}
            onBlur={() => {
              focusAnimations[index].value = withSpring(0);
            }}
          />
        </Animated.View>
      ))}
    </HStack>
  );
};
```

## Phase 4: Initial Setup Interactions

### Child Profile Form Interactions

**Form Field Focus Flow**:
```typescript
const useChildProfileFormAnimation = () => {
  const currentFieldIndex = useSharedValue(-1);
  const fieldAnimations = Array.from({ length: 4 }, () => ({
    scale: useSharedValue(1),
    borderColor: useSharedValue('#D1D5DB'),
    backgroundColor: useSharedValue('#FFFFFF')
  }));

  const focusField = (index: number) => {
    // Update current field
    currentFieldIndex.value = index;

    // Animate all fields
    fieldAnimations.forEach((anim, i) => {
      if (i === index) {
        // Focus state
        anim.scale.value = withSpring(1.02, { tension: 200, friction: 10 });
        anim.borderColor.value = withTiming('#0891B2', { duration: 200 });
        anim.backgroundColor.value = withTiming('#F0F9FF', { duration: 200 });
      } else {
        // Unfocus state
        anim.scale.value = withSpring(1, { tension: 200, friction: 10 });
        anim.borderColor.value = withTiming('#D1D5DB', { duration: 200 });
        anim.backgroundColor.value = withTiming('#FFFFFF', { duration: 200 });
      }
    });
  };

  const getFieldStyle = (index: number) => useAnimatedStyle(() => ({
    transform: [{ scale: fieldAnimations[index].scale.value }],
    borderColor: fieldAnimations[index].borderColor.value,
    backgroundColor: fieldAnimations[index].backgroundColor.value
  }));

  return {
    focusField,
    getFieldStyle
  };
};
```

### Date Picker Interactions

**Birthdate Picker Animation**:
```typescript
const BirthdatePicker = ({ value, onChange }) => {
  const [isVisible, setIsVisible] = useState(false);
  const slideY = useSharedValue(300);
  const backdropOpacity = useSharedValue(0);

  const showPicker = () => {
    setIsVisible(true);
    slideY.value = withSpring(0, { tension: 100, friction: 8 });
    backdropOpacity.value = withTiming(0.5, { duration: 200 });
  };

  const hidePicker = () => {
    slideY.value = withTiming(300, { duration: 250 });
    backdropOpacity.value = withTiming(0, { duration: 200 }, () => {
      runOnJS(setIsVisible)(false);
    });
  };

  const pickerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideY.value }]
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value
  }));

  return (
    <>
      <Pressable onPress={showPicker}>
        <Input
          value={value ? formatDate(value) : ''}
          placeholder="Select birthdate"
          isReadOnly
          rightElement={
            <Icon name="calendar" size={20} color="#6B7280" mr={3} />
          }
        />
      </Pressable>

      {isVisible && (
        <Animated.View style={[modalBackdrop, backdropStyle]}>
          <Pressable flex={1} onPress={hidePicker} />
          <Animated.View style={[pickerContainer, pickerStyle]}>
            <DateTimePicker
              value={value || new Date()}
              mode="date"
              display="spinner"
              onChange={(event, selectedDate) => {
                if (selectedDate) {
                  onChange(selectedDate);
                  hidePicker();
                }
              }}
              maximumDate={new Date()}
              minimumDate={new Date(Date.now() - 3 * 365 * 24 * 60 * 60 * 1000)}
            />
          </Animated.View>
        </Animated.View>
      )}
    </>
  );
};
```

### Diaper Size Selection

**Size Selector Animation**:
```typescript
const DiaperSizeSelector = ({ selectedSize, onSizeSelect }) => {
  const sizes = ['Newborn', 'Size 1', 'Size 2', 'Size 3', 'Size 4', 'Size 5'];
  const sizeAnimations = sizes.map(() => ({
    scale: useSharedValue(1),
    backgroundColor: useSharedValue('#FFFFFF'),
    borderColor: useSharedValue('#D1D5DB')
  }));

  const handleSizeSelect = (size: string, index: number) => {
    onSizeSelect(size);

    // Animate all size options
    sizeAnimations.forEach((anim, i) => {
      if (i === index) {
        // Selected state
        anim.scale.value = withSequence(
          withTiming(1.05, { duration: 100 }),
          withSpring(1, { tension: 300, friction: 10 })
        );
        anim.backgroundColor.value = withTiming('#0891B2', { duration: 200 });
        anim.borderColor.value = withTiming('#0891B2', { duration: 200 });
      } else {
        // Unselected state
        anim.scale.value = withSpring(1, { tension: 200, friction: 10 });
        anim.backgroundColor.value = withTiming('#FFFFFF', { duration: 200 });
        anim.borderColor.value = withTiming('#D1D5DB', { duration: 200 });
      }
    });

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <VStack space={3}>
      <Text fontSize="md" fontWeight="medium">Current diaper size</Text>
      <HStack flexWrap="wrap" space={2}>
        {sizes.map((size, index) => {
          const isSelected = size === selectedSize;
          
          return (
            <Animated.View
              key={size}
              style={useAnimatedStyle(() => ({
                transform: [{ scale: sizeAnimations[index].scale.value }]
              }))}
            >
              <Pressable
                onPress={() => handleSizeSelect(size, index)}
                style={useAnimatedStyle(() => ({
                  backgroundColor: sizeAnimations[index].backgroundColor.value,
                  borderColor: sizeAnimations[index].borderColor.value,
                  borderWidth: 2,
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  minWidth: 80
                }))}
              >
                <Text
                  textAlign="center"
                  color={isSelected ? 'white' : 'gray.700'}
                  fontSize="sm"
                  fontWeight="medium"
                >
                  {size}
                </Text>
              </Pressable>
            </Animated.View>
          );
        })}
      </HStack>
    </VStack>
  );
};
```

## Cross-Phase Interaction Patterns

### Progress Indicator Interactions

**Animated Progress Tracking**:
```typescript
const OnboardingProgressIndicator = ({ currentStep, totalSteps }) => {
  const progressWidth = useSharedValue(0);
  const stepAnimations = Array.from({ length: totalSteps }, () => ({
    scale: useSharedValue(1),
    backgroundColor: useSharedValue('#E5E7EB'),
    checkmarkScale: useSharedValue(0)
  }));

  useEffect(() => {
    const progressPercentage = (currentStep / totalSteps) * 100;
    progressWidth.value = withTiming(progressPercentage, { duration: 400 });

    // Animate step indicators
    stepAnimations.forEach((anim, index) => {
      if (index < currentStep) {
        // Completed step
        anim.backgroundColor.value = withTiming('#10B981', { duration: 300 });
        anim.checkmarkScale.value = withSpring(1, { 
          tension: 200, 
          friction: 10,
          delay: index * 50
        });
      } else if (index === currentStep) {
        // Current step
        anim.scale.value = withSpring(1.2, { tension: 150, friction: 8 });
        anim.backgroundColor.value = withTiming('#0891B2', { duration: 300 });
      } else {
        // Future step
        anim.scale.value = withSpring(1, { tension: 150, friction: 8 });
        anim.backgroundColor.value = withTiming('#E5E7EB', { duration: 300 });
        anim.checkmarkScale.value = withTiming(0, { duration: 200 });
      }
    });
  }, [currentStep]);

  return (
    <VStack space={4} px={6} py={4}>
      {/* Progress bar */}
      <Box bg="gray.200" height={2} borderRadius={2}>
        <Animated.View
          style={[
            { height: '100%', backgroundColor: '#0891B2', borderRadius: 2 },
            useAnimatedStyle(() => ({
              width: `${progressWidth.value}%`
            }))
          ]}
        />
      </Box>

      {/* Step indicators */}
      <HStack justifyContent="space-between" alignItems="center">
        {stepAnimations.map((anim, index) => (
          <Animated.View
            key={index}
            style={useAnimatedStyle(() => ({
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: anim.backgroundColor.value,
              transform: [{ scale: anim.scale.value }],
              justifyContent: 'center',
              alignItems: 'center'
            }))}
          >
            <Animated.View
              style={useAnimatedStyle(() => ({
                transform: [{ scale: anim.checkmarkScale.value }]
              }))}
            >
              <Icon name="check" size={12} color="white" />
            </Animated.View>
          </Animated.View>
        ))}
      </HStack>
    </VStack>
  );
};
```

### Navigation Button Interactions

**Back Button with Gesture Support**:
```typescript
const OnboardingBackButton = ({ onPress, disabled = false }) => {
  const scaleValue = useSharedValue(1);
  const opacity = useSharedValue(disabled ? 0.5 : 1);

  const handlePress = () => {
    if (disabled) {
      // Disabled state feedback
      scaleValue.value = withSequence(
        withTiming(0.98, { duration: 100 }),
        withSpring(1, { tension: 300, friction: 10 })
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    // Normal press animation
    scaleValue.value = withSequence(
      withTiming(0.9, { duration: 100 }),
      withSpring(1, { tension: 300, friction: 10 })
    );

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  useEffect(() => {
    opacity.value = withTiming(disabled ? 0.5 : 1, { duration: 200 });
  }, [disabled]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
    opacity: opacity.value
  }));

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={8}
      disabled={disabled}
    >
      <Animated.View style={[backButtonContainer, animatedStyle]}>
        <Icon name="chevron-left" size={24} color="#6B7280" />
      </Animated.View>
    </Pressable>
  );
};
```

### Error State Animations

**Form Error Handling**:
```typescript
const useFormErrorAnimation = () => {
  const errorOpacity = useSharedValue(0);
  const errorY = useSharedValue(-10);
  const fieldShake = useSharedValue(0);

  const showError = (message: string) => {
    // Error message slide in
    errorOpacity.value = withTiming(1, { duration: 200 });
    errorY.value = withSpring(0, { tension: 200, friction: 10 });

    // Field shake animation
    fieldShake.value = withSequence(
      withTiming(-4, { duration: 50 }),
      withTiming(4, { duration: 50 }),
      withTiming(-3, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );

    // Error haptic
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

    // Auto-hide after 3 seconds
    setTimeout(() => hideError(), 3000);
  };

  const hideError = () => {
    errorOpacity.value = withTiming(0, { duration: 200 });
    errorY.value = withTiming(-10, { duration: 200 });
  };

  return {
    errorStyle: useAnimatedStyle(() => ({
      opacity: errorOpacity.value,
      transform: [{ translateY: errorY.value }]
    })),
    fieldStyle: useAnimatedStyle(() => ({
      transform: [{ translateX: fieldShake.value }]
    })),
    showError,
    hideError
  };
};
```

## Accessibility Interaction Enhancements

### Screen Reader Interaction Patterns

**Focus Management System**:
```typescript
const useOnboardingAccessibility = () => {
  const currentFocusRef = useRef<any>(null);

  const manageFocus = (elementRef: any, announcement?: string) => {
    if (Platform.OS === 'ios') {
      // iOS focus management
      setTimeout(() => {
        elementRef.current?.focus();
        if (announcement) {
          AccessibilityInfo.announceForAccessibility(announcement);
        }
      }, 100);
    } else {
      // Android focus management
      elementRef.current?.setAccessibilityFocus?.();
      if (announcement) {
        AccessibilityInfo.announceForAccessibility(announcement);
      }
    }
    
    currentFocusRef.current = elementRef;
  };

  const announceStepChange = (stepName: string, stepNumber: number, totalSteps: number) => {
    const message = `${stepName}. Step ${stepNumber} of ${totalSteps}. Swipe right to continue or left to go back.`;
    AccessibilityInfo.announceForAccessibility(message);
  };

  return {
    manageFocus,
    announceStepChange
  };
};
```

### Voice Control Integration

**Voice Command Handling**:
```typescript
const useVoiceControlSupport = () => {
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    // Register voice commands
    const commands = {
      'next': () => navigateToNext(),
      'back': () => navigateToPrevious(),
      'skip': () => skipCurrentStep(),
      'help': () => showContextualHelp()
    };

    // Voice control availability check
    AccessibilityInfo.isScreenReaderEnabled().then(enabled => {
      if (enabled) {
        setIsListening(true);
      }
    });

    return () => {
      // Cleanup voice command listeners
      setIsListening(false);
    };
  }, []);

  return { isListening };
};
```

## Performance Optimization

### Animation Performance

**Hardware Acceleration Configuration**:
```typescript
// Ensure all animations use hardware acceleration
const optimizedAnimationConfig = {
  useNativeDriver: true,
  renderToHardwareTextureAndroid: true,
  shouldRasterizeIOS: true
};

// Monitor animation performance
const useAnimationPerformance = () => {
  useEffect(() => {
    if (__DEV__) {
      // Performance monitoring in development
      const performanceObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.duration > 16.67) { // 60fps threshold
            console.warn(`Animation performance issue: ${entry.name} took ${entry.duration}ms`);
          }
        });
      });
      
      performanceObserver.observe({ entryTypes: ['measure'] });
      
      return () => performanceObserver.disconnect();
    }
  }, []);
};
```

### Memory Management

**Animation Cleanup System**:
```typescript
const useAnimationCleanup = () => {
  const animationRefs = useRef([]);

  const registerAnimation = (animation: any) => {
    animationRefs.current.push(animation);
  };

  const cleanupAnimations = () => {
    animationRefs.current.forEach(animation => {
      animation?.stop?.();
      animation?.reset?.();
    });
    animationRefs.current = [];
  };

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      cleanupAnimations();
    };
  }, []);

  return { registerAnimation, cleanupAnimations };
};
```

This comprehensive interaction specification ensures that every user touch, gesture, and animation in the NestSync onboarding flow is optimized for the emotional and cognitive needs of stressed Canadian parents while maintaining high performance and accessibility standards.