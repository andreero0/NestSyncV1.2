# Developer Implementation Guide

Comprehensive technical specifications for implementing NestSync's design system with NativeBase integration, React Native Reanimated animations, and psychological UX patterns.

---
title: Developer Implementation Guide
description: Technical specifications for implementing NestSync design system with exact measurements and code patterns
feature: Developer Handoff
last-updated: 2025-01-21
version: 1.0.0
related-files: 
  - ../design-system/style-guide.md
  - ../features/core-navigation/screen-states.md
  - component-integration.md
  - animation-implementation.md
dependencies:
  - React Native + Expo
  - NativeBase component library
  - React Native Reanimated 3.x
  - NativeWind for utility styling
status: approved
---

## Implementation Overview

This guide provides exact technical specifications for implementing NestSync's design system, ensuring pixel-perfect implementation while maintaining the psychological methodology for stressed Canadian parents.

### Tech Stack Integration

**Core Framework**:
- React Native 0.72+ via Expo SDK 49+
- TypeScript for type safety
- NativeBase 3.4+ for component library
- NativeWind for utility-first styling
- React Native Reanimated 3.x for animations

**State Management**:
- Zustand for app state
- React Query for server state
- React Hook Form for form state

## NativeBase Theme Configuration

### Custom Theme Setup

```typescript
// theme/index.ts
import { extendTheme } from 'native-base';

export const nestsyncTheme = extendTheme({
  colors: {
    // Primary color palette
    primary: {
      50: '#E0F2FE',   // Light backgrounds, selected states
      100: '#BAE6FD',  // Subtle highlights
      200: '#7DD3FC',  // Disabled states
      300: '#38BDF8',  // Secondary elements
      400: '#0EA5E9',  // Interactive elements
      500: '#0891B2',  // Main brand color
      600: '#0E7490',  // Hover/active states
      700: '#0F5F72',  // Pressed states
      800: '#134E5E',  // High contrast text
      900: '#164E63',  // Maximum contrast
    },
    
    // Success/growth colors
    success: {
      50: '#F0FDF4',   // Success message backgrounds
      100: '#DCFCE7',  // Light success states
      500: '#059669',  // Success indicators
      600: '#047857',  // Success button hover
      700: '#065F46',  // Dark success text
    },
    
    // Warning/attention colors
    warning: {
      50: '#FFFBEB',   // Warning backgrounds
      100: '#FEF3C7',  // Light warning states
      500: '#D97706',  // Warning indicators
      600: '#B45309',  // Warning button hover
      700: '#92400E',  // Dark warning text
    },
    
    // Accent colors for urgency
    orange: {
      50: '#FFF7ED',   // Urgency backgrounds
      100: '#FFEDD5',  // Light urgency states
      500: '#EA580C',  // Urgency indicators
      600: '#DC2626',  // Critical urgency
      700: '#B91C1C',  // Maximum urgency
    },
    
    // Neutral grays (warm undertones)
    gray: {
      50: '#F9FAFB',   // Subtle backgrounds
      100: '#F3F4F6',  // Card backgrounds
      200: '#E5E7EB',  // Borders, dividers
      300: '#D1D5DB',  // Placeholders
      400: '#9CA3AF',  // Secondary text
      500: '#6B7280',  // Primary text
      600: '#4B5563',  // Headings
      700: '#374151',  // Emphasis
      800: '#1F2937',  // High contrast
      900: '#111827',  // Maximum contrast
    },
  },
  
  fontSizes: {
    '2xs': 10,
    'xs': 12,
    'sm': 14,
    'md': 16,      // Base font size (never smaller for interactive text)
    'lg': 18,      // Comfortable reading size
    'xl': 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,     // Large headings
    '5xl': 48,     // Hero text
  },
  
  fontWeights: {
    light: 300,
    normal: 400,
    medium: 500,   // Preferred for labels
    semibold: 600, // Preferred for headings
    bold: 700,     // Emphasis only
    extrabold: 800,
    black: 900,
  },
  
  space: {
    px: '1px',
    0.5: 2,        // 2px - micro spacing
    1: 4,          // 4px - base unit
    1.5: 6,        // 6px
    2: 8,          // 8px - small spacing
    2.5: 10,       // 10px
    3: 12,         // 12px
    3.5: 14,       // 14px
    4: 16,         // 16px - standard spacing
    5: 20,         // 20px
    6: 24,         // 24px - section spacing
    7: 28,         // 28px
    8: 32,         // 32px - large spacing
    9: 36,         // 36px
    10: 40,        // 40px
    12: 48,        // 48px - extra large spacing
    14: 56,        // 56px - FAB size
    16: 64,        // 64px - hero spacing
    20: 80,        // 80px - tab bar height
  },
  
  radii: {
    none: 0,
    sm: 4,         // Small elements
    md: 8,         // Standard border radius
    lg: 12,        // Cards, major elements
    xl: 16,        // Large containers
    '2xl': 24,     // Hero elements
    full: 9999,    // Circular elements
  },
  
  shadows: {
    // Elevation system for depth
    1: {
      shadowOffset: { width: 0, height: 1 },
      shadowRadius: 3,
      shadowColor: '#000',
      shadowOpacity: 0.1,
      elevation: 1,
    },
    2: {
      shadowOffset: { width: 0, height: 1 },
      shadowRadius: 4,
      shadowColor: '#000',
      shadowOpacity: 0.15,
      elevation: 2,
    },
    4: {
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 8,
      shadowColor: '#000',
      shadowOpacity: 0.15,
      elevation: 4,
    },
    8: {
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 16,
      shadowColor: '#000',
      shadowOpacity: 0.18,
      elevation: 8,
    },
  },
  
  components: {
    Button: {
      // Custom button variants
      variants: {
        solid: (props: any) => ({
          bg: `${props.colorScheme}.500`,
          _pressed: {
            bg: `${props.colorScheme}.600`,
            transform: [{ scale: 0.95 }],
          },
          _disabled: {
            bg: 'gray.300',
            opacity: 0.6,
          },
        }),
        
        timeChip: (props: any) => ({
          bg: props.isSelected ? 'primary.500' : 'gray.100',
          borderRadius: 'full',
          minWidth: '60px',
          height: '44px',
          _pressed: {
            transform: [{ scale: 1.05 }],
          },
          _text: {
            color: props.isSelected ? 'white' : 'gray.600',
            fontSize: 'sm',
            fontWeight: 'medium',
          },
        }),
      },
      
      // Default sizes
      sizes: {
        sm: {
          height: '32px',
          px: 3,
          py: 2,
          _text: { fontSize: 'sm' },
        },
        md: {
          height: '40px',
          px: 4,
          py: 2,
          _text: { fontSize: 'md' },
        },
        lg: {
          height: '48px',    // Minimum touch target
          px: 6,
          py: 3,
          _text: { fontSize: 'md', fontWeight: 'medium' },
        },
      },
    },
    
    Card: {
      baseStyle: {
        bg: 'white',
        borderRadius: 'lg',
        shadow: 2,
        p: 4,
        borderWidth: 1,
        borderColor: 'gray.200',
      },
      
      variants: {
        status: {
          borderLeftWidth: 4,
          borderLeftColor: 'primary.500',
          bg: 'primary.50',
        },
        
        warning: {
          borderLeftWidth: 4,
          borderLeftColor: 'orange.500',
          bg: 'orange.50',
        },
        
        critical: {
          borderLeftWidth: 4,
          borderLeftColor: 'red.500',
          bg: 'red.50',
        },
      },
    },
  },
});
```

### Application Setup

```typescript
// App.tsx
import React from 'react';
import { NativeBaseProvider } from 'native-base';
import { nestsyncTheme } from './theme';
import { NavigationContainer } from '@react-navigation/native';
import { MainNavigator } from './navigation/MainNavigator';

export default function App() {
  return (
    <NativeBaseProvider theme={nestsyncTheme}>
      <NavigationContainer>
        <MainNavigator />
      </NavigationContainer>
    </NativeBaseProvider>
  );
}
```

## Component Implementation Specifications

### Primary Button Component

```typescript
// components/ui/PrimaryButton.tsx
import React from 'react';
import { Button, IButtonProps } from 'native-base';
import { HapticFeedbackTypes } from 'expo-haptics';
import * as Haptics from 'expo-haptics';

interface PrimaryButtonProps extends IButtonProps {
  /** Enable haptic feedback on press */
  enableHaptics?: boolean;
  /** Haptic feedback intensity */
  hapticStyle?: HapticFeedbackTypes;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  children,
  onPress,
  enableHaptics = true,
  hapticStyle = HapticFeedbackTypes.ImpactFeedbackStyleLight,
  ...props
}) => {
  const handlePress = (event: any) => {
    // Provide haptic feedback for stressed parents
    if (enableHaptics) {
      Haptics.impactAsync(hapticStyle);
    }
    
    // Call original onPress
    onPress?.(event);
  };

  return (
    <Button
      size="lg"
      colorScheme="primary"
      borderRadius="md"
      _pressed={{
        bg: 'primary.600',
        transform: [{ scale: 0.95 }],
      }}
      _disabled={{
        bg: 'gray.300',
        opacity: 0.6,
        _text: { color: 'gray.500' },
      }}
      _text={{
        fontWeight: 'medium',
        fontSize: 'md',
      }}
      onPress={handlePress}
      {...props}
    >
      {children}
    </Button>
  );
};

// Usage example:
<PrimaryButton 
  onPress={handleSave}
  isLoading={isSaving}
  enableHaptics={true}
>
  Save Change
</PrimaryButton>
```

### Time Chip Component

```typescript
// components/ui/TimeChip.tsx
import React from 'react';
import { Pressable, Text, HStack } from 'native-base';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface TimeChipProps {
  label: string;
  value: string;
  isSelected: boolean;
  onSelect: (value: string) => void;
  disabled?: boolean;
}

export const TimeChip: React.FC<TimeChipProps> = ({
  label,
  value,
  isSelected,
  onSelect,
  disabled = false,
}) => {
  const scale = useSharedValue(1);
  const backgroundColor = useSharedValue(isSelected ? 1 : 0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const backgroundStyle = useAnimatedStyle(() => ({
    backgroundColor: backgroundColor.value 
      ? '#0891B2'  // primary.500
      : '#F3F4F6', // gray.100
  }));

  React.useEffect(() => {
    backgroundColor.value = withTiming(isSelected ? 1 : 0, { duration: 200 });
  }, [isSelected]);

  const handlePress = () => {
    if (disabled) return;

    // Haptic feedback for selection
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Animation feedback
    scale.value = withSpring(1.05, {}, () => {
      scale.value = withSpring(1);
    });

    // Call selection handler
    onSelect(value);
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      style={[animatedStyle]}
      disabled={disabled}
      // Accessibility
      accessibilityRole="button"
      accessibilityLabel={`${label} time option`}
      accessibilityState={{ selected: isSelected }}
      accessibilityHint="Select when the diaper change occurred"
    >
      <Animated.View
        style={[
          backgroundStyle,
          {
            minWidth: 60,
            height: 44,
            borderRadius: 22,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 12,
          },
        ]}
      >
        <Text
          fontSize="sm"
          fontWeight="medium"
          color={isSelected ? 'white' : 'gray.600'}
        >
          {label}
        </Text>
      </Animated.View>
    </AnimatedPressable>
  );
};

// Usage in Quick Log Modal:
const timeOptions = [
  { label: 'Now', value: 'now' },
  { label: '1h', value: '1h' },
  { label: '2h', value: '2h' },
  { label: 'Custom', value: 'custom' },
];

<HStack space={2} justifyContent="center">
  {timeOptions.map(option => (
    <TimeChip
      key={option.value}
      label={option.label}
      value={option.value}
      isSelected={selectedTime === option.value}
      onSelect={setSelectedTime}
    />
  ))}
</HStack>
```

### Floating Action Button (FAB)

```typescript
// components/ui/FloatingActionButton.tsx
import React from 'react';
import { Pressable, Icon } from 'native-base';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface FloatingActionButtonProps {
  icon: React.ComponentType<any>;
  onPress: () => void;
  /** Context-aware accessibility label */
  accessibilityLabel: string;
  accessibilityHint: string;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  icon,
  onPress,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const insets = useSafeAreaInsets();
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const handlePress = () => {
    // Complex animation for satisfying interaction
    scale.value = withSequence(
      withSpring(0.9, { duration: 100 }),
      withSpring(1, { duration: 200 })
    );
    
    rotation.value = withSequence(
      withSpring(15, { duration: 100 }),
      withSpring(0, { duration: 200 })
    );

    // Medium haptic for important action
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Execute action
    onPress();
  };

  return (
    <AnimatedPressable
      position="absolute"
      bottom={insets.bottom + 80 + 24} // Above tab bar + margin
      right={6}
      style={[
        animatedStyle,
        {
          width: 56,
          height: 56,
          borderRadius: 28,
          elevation: 8,
          shadowOffset: { width: 0, height: 4 },
          shadowRadius: 16,
          shadowColor: '#000',
          shadowOpacity: 0.18,
        },
      ]}
      onPress={handlePress}
      // Accessibility
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
    >
      <LinearGradient
        colors={['#0891B2', '#0E7490']} // primary.500 to primary.600
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Icon as={icon} size="6" color="white" />
      </LinearGradient>
    </AnimatedPressable>
  );
};

// Context-aware FAB usage:
import { useRoute } from '@react-navigation/native';
import { EditIcon, AddIcon, ShareIcon } from 'native-base';

const getFABConfig = (routeName: string) => {
  switch (routeName) {
    case 'Home':
      return {
        icon: EditIcon,
        accessibilityLabel: 'Log diaper change',
        accessibilityHint: 'Opens quick logging form',
        action: 'log',
      };
    case 'Planner':
      return {
        icon: AddIcon,
        accessibilityLabel: 'Add inventory',
        accessibilityHint: 'Add diapers to inventory or create reorder',
        action: 'add',
      };
    case 'Settings':
      return {
        icon: ShareIcon,
        accessibilityLabel: 'Add or share',
        accessibilityHint: 'Add child or share access with caregiver',
        action: 'share',
      };
    default:
      return null;
  }
};

// In main navigator:
const route = useRoute();
const fabConfig = getFABConfig(route.name);

{fabConfig && (
  <FloatingActionButton
    icon={fabConfig.icon}
    accessibilityLabel={fabConfig.accessibilityLabel}
    accessibilityHint={fabConfig.accessibilityHint}
    onPress={() => handleFABAction(fabConfig.action)}
  />
)}
```

### Status Card Component

```typescript
// components/ui/StatusCard.tsx
import React from 'react';
import { Box, VStack, Text, HStack, Icon } from 'native-base';
import { LinearGradient } from 'expo-linear-gradient';
import { PackageIcon, AlertTriangleIcon, CheckCircleIcon } from 'lucide-react-native';

interface StatusCardProps {
  daysOfCover: number;
  status: 'good' | 'attention' | 'critical';
  child: {
    name: string;
    age: string;
  };
}

const getStatusConfig = (status: string, days: number) => {
  switch (status) {
    case 'critical':
      return {
        icon: AlertTriangleIcon,
        gradient: ['#FEF3C7', '#FDE68A'], // warning.100 to warning.200
        textColor: 'orange.800',
        message: 'Order today',
        urgency: 'Critical',
        borderColor: 'orange.400',
      };
    case 'attention':
      return {
        icon: PackageIcon,
        gradient: ['#DBEAFE', '#BFDBFE'], // blue.100 to blue.200
        textColor: 'primary.800',
        message: 'Reorder soon',
        urgency: 'Attention needed',
        borderColor: 'primary.300',
      };
    case 'good':
      return {
        icon: CheckCircleIcon,
        gradient: ['#DCFCE7', '#BBF7D0'], // green.100 to green.200
        textColor: 'success.800',
        message: 'All good',
        urgency: 'Well stocked',
        borderColor: 'success.300',
      };
    default:
      return getStatusConfig('attention', days);
  }
};

export const StatusCard: React.FC<StatusCardProps> = ({
  daysOfCover,
  status,
  child,
}) => {
  const config = getStatusConfig(status, daysOfCover);

  return (
    <Box
      borderRadius="lg"
      borderWidth={2}
      borderColor={config.borderColor}
      overflow="hidden"
      shadow={2}
    >
      <LinearGradient
        colors={config.gradient}
        style={{
          padding: 20,
          minHeight: 120,
        }}
      >
        <VStack space={3} alignItems="center">
          {/* Status Icon */}
          <Icon 
            as={config.icon} 
            size="xl" 
            color={config.textColor} 
          />
          
          {/* Days of Cover - Most Important Information */}
          <VStack alignItems="center" space={1}>
            <Text 
              fontSize="4xl" 
              fontWeight="bold" 
              color={config.textColor}
              accessibilityLabel={`${daysOfCover} days of diapers remaining`}
            >
              {daysOfCover} day{daysOfCover !== 1 ? 's' : ''}
            </Text>
            <Text 
              fontSize="md" 
              color={config.textColor}
              opacity={0.8}
            >
              of cover remaining
            </Text>
          </VStack>
          
          {/* Status Message */}
          <HStack alignItems="center" space={2}>
            <Text 
              fontSize="sm" 
              fontWeight="medium" 
              color={config.textColor}
            >
              {config.urgency}: {config.message}
            </Text>
          </HStack>
        </VStack>
      </LinearGradient>
    </Box>
  );
};

// Usage with psychological considerations:
<StatusCard
  daysOfCover={calculateDaysOfCover(inventory, child.dailyUsage)}
  status={getDaysOfCoverStatus(daysOfCover)}
  child={{
    name: child.name,
    age: formatChildAge(child.birthDate),
  }}
/>
```

## Animation Implementation Patterns

### Page Transitions

```typescript
// navigation/transitions.ts
import { CardStyleInterpolators, StackNavigationOptions } from '@react-navigation/stack';

// Gentle slide transition for reduced anxiety
export const gentleSlideTransition: StackNavigationOptions = {
  cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
  transitionSpec: {
    open: {
      animation: 'spring',
      config: {
        stiffness: 300,
        damping: 25,
        mass: 0.8,
      },
    },
    close: {
      animation: 'spring',
      config: {
        stiffness: 300,
        damping: 25,
        mass: 0.8,
      },
    },
  },
};

// Modal presentation for temporary tasks
export const modalTransition: StackNavigationOptions = {
  presentation: 'modal',
  cardStyleInterpolator: ({ current, layouts }) => ({
    cardStyle: {
      transform: [
        {
          translateY: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [layouts.screen.height, 0],
          }),
        },
      ],
    },
    overlayStyle: {
      opacity: current.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0.5],
      }),
    },
  }),
  transitionSpec: {
    open: {
      animation: 'spring',
      config: {
        stiffness: 200,
        damping: 20,
      },
    },
    close: {
      animation: 'spring',
      config: {
        stiffness: 300,
        damping: 25,
      },
    },
  },
};
```

### Loading States

```typescript
// components/ui/LoadingStates.tsx
import React from 'react';
import { VStack, HStack, Box, Text } from 'native-base';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  useEffect,
} from 'react-native-reanimated';

// Skeleton loading for cards
export const SkeletonCard: React.FC = () => {
  const opacity = useSharedValue(0.3);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  React.useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 1000 }),
        withTiming(0.3, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  return (
    <Box bg="white" p={4} borderRadius="lg" shadow={1}>
      <VStack space={3}>
        <HStack alignItems="center" space={3}>
          <Animated.View style={[animatedStyle]}>
            <Box w={10} h={10} bg="gray.200" borderRadius="full" />
          </Animated.View>
          <VStack flex={1} space={2}>
            <Animated.View style={[animatedStyle]}>
              <Box h={4} bg="gray.200" borderRadius="sm" />
            </Animated.View>
            <Animated.View style={[animatedStyle]}>
              <Box h={3} bg="gray.200" borderRadius="sm" w="60%" />
            </Animated.View>
          </VStack>
        </HStack>
      </VStack>
    </Box>
  );
};

// Gentle loading spinner
export const LoadingSpinner: React.FC<{ message?: string }> = ({ message }) => {
  const rotation = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  React.useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1000 }),
      -1,
      false
    );
  }, []);

  return (
    <VStack alignItems="center" space={4} p={8}>
      <Animated.View style={[animatedStyle]}>
        <Box
          w={8}
          h={8}
          borderWidth={2}
          borderColor="primary.200"
          borderTopColor="primary.500"
          borderRadius="full"
        />
      </Animated.View>
      {message && (
        <Text fontSize="md" color="gray.600" textAlign="center">
          {message}
        </Text>
      )}
    </VStack>
  );
};
```

## Form Implementation

### Quick Log Modal

```typescript
// components/modals/QuickLogModal.tsx
import React, { useState } from 'react';
import {
  Modal,
  VStack,
  HStack,
  Text,
  Button,
  TextArea,
  Heading,
} from 'native-base';
import { TimeChip } from '../ui/TimeChip';
import { ChangeTypeChip } from '../ui/ChangeTypeChip';
import { PrimaryButton } from '../ui/PrimaryButton';
import * as Haptics from 'expo-haptics';

interface QuickLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (logData: LogData) => Promise<void>;
  child: Child;
}

interface LogData {
  time: string;
  changeType: 'wet' | 'soiled' | 'both';
  notes?: string;
  timestamp: Date;
}

export const QuickLogModal: React.FC<QuickLogModalProps> = ({
  isOpen,
  onClose,
  onSave,
  child,
}) => {
  const [selectedTime, setSelectedTime] = useState('now');
  const [changeType, setChangeType] = useState<'wet' | 'soiled' | 'both'>('wet');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const timeOptions = [
    { label: 'Now', value: 'now' },
    { label: '1h ago', value: '1h' },
    { label: '2h ago', value: '2h' },
    { label: 'Custom', value: 'custom' },
  ];

  const changeTypes = [
    { label: 'Wet', value: 'wet', icon: '💧' },
    { label: 'Soiled', value: 'soiled', icon: '💩' },
    { label: 'Both', value: 'both', icon: '💧💩' },
  ];

  const handleSave = async () => {
    setIsLoading(true);

    try {
      const timestamp = calculateTimestamp(selectedTime);
      
      await onSave({
        time: selectedTime,
        changeType,
        notes: notes.trim(),
        timestamp,
      });

      // Success haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Reset form
      setSelectedTime('now');
      setChangeType('wet');
      setNotes('');
      
      // Close modal after brief delay for feedback
      setTimeout(onClose, 300);
      
    } catch (error) {
      // Error handling with gentle message
      console.error('Failed to save log:', error);
      // Show error toast (implementation depends on toast library)
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTimestamp = (timeValue: string): Date => {
    const now = new Date();
    switch (timeValue) {
      case '1h':
        return new Date(now.getTime() - 60 * 60 * 1000);
      case '2h':
        return new Date(now.getTime() - 2 * 60 * 60 * 1000);
      case 'custom':
        // Handle custom time picker
        return now; // Simplified for example
      default:
        return now;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <Modal.Content>
        <Modal.CloseButton />
        <Modal.Header>
          <Heading size="md">Log Change for {child.name}</Heading>
        </Modal.Header>
        
        <Modal.Body>
          <VStack space={6}>
            {/* Time Selection */}
            <VStack space={3}>
              <Text fontSize="md" fontWeight="medium" color="gray.700">
                When did this happen?
              </Text>
              <HStack space={2} justifyContent="center" flexWrap="wrap">
                {timeOptions.map(option => (
                  <TimeChip
                    key={option.value}
                    label={option.label}
                    value={option.value}
                    isSelected={selectedTime === option.value}
                    onSelect={setSelectedTime}
                  />
                ))}
              </HStack>
            </VStack>

            {/* Change Type Selection */}
            <VStack space={3}>
              <Text fontSize="md" fontWeight="medium" color="gray.700">
                What type of change?
              </Text>
              <HStack space={2} justifyContent="center">
                {changeTypes.map(type => (
                  <ChangeTypeChip
                    key={type.value}
                    label={type.label}
                    value={type.value}
                    icon={type.icon}
                    isSelected={changeType === type.value}
                    onSelect={(value) => setChangeType(value as typeof changeType)}
                  />
                ))}
              </HStack>
            </VStack>

            {/* Optional Notes */}
            <VStack space={3}>
              <Text fontSize="md" fontWeight="medium" color="gray.700">
                Notes (optional)
              </Text>
              <TextArea
                value={notes}
                onChangeText={setNotes}
                placeholder="Any additional notes about this change..."
                placeholderTextColor="gray.400"
                size="md"
                minH={20}
                maxH={32}
                autoCompleteType="off"
                returnKeyType="done"
                blurOnSubmit
              />
            </VStack>
          </VStack>
        </Modal.Body>

        <Modal.Footer>
          <HStack space={3} width="100%">
            <Button
              variant="ghost"
              flex={1}
              onPress={onClose}
              _text={{ color: 'gray.600' }}
            >
              Cancel
            </Button>
            <PrimaryButton
              flex={1}
              onPress={handleSave}
              isLoading={isLoading}
              enableHaptics={true}
              hapticStyle={Haptics.ImpactFeedbackStyle.Medium}
            >
              Save ✓
            </PrimaryButton>
          </HStack>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  );
};
```

## Accessibility Implementation

### Screen Reader Support

```typescript
// utils/accessibility.ts

/**
 * Formats content for screen readers with natural language
 */
export const formatForScreenReader = {
  daysOfCover: (days: number) => {
    if (days === 0) return "Out of diapers, order immediately";
    if (days === 1) return "Only one day of diapers remaining";
    return `${days} days of diapers remaining`;
  },
  
  logEntry: (log: DiaryLog) => {
    const time = new Date(log.timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    const type = log.changeType === 'both' ? 'wet and soiled' : log.changeType;
    return `${time}, ${type} diaper change for ${log.childName}`;
  },
  
  priceComparison: (option: PriceOption) => {
    return `${option.brand} diapers, $${option.price} Canadian dollars, available at ${option.retailer}`;
  },
};

/**
 * Enhanced focus management for modals and navigation
 */
export class FocusManager {
  private static focusStack: string[] = [];
  
  static pushFocus(elementId: string) {
    this.focusStack.push(elementId);
  }
  
  static popFocus(): string | undefined {
    return this.focusStack.pop();
  }
  
  static returnFocus() {
    const previousFocus = this.popFocus();
    if (previousFocus) {
      // Implementation depends on specific navigation library
      // but would restore focus to the element that triggered the modal
    }
  }
}
```

### Keyboard Navigation

```typescript
// hooks/useKeyboardNavigation.ts
import { useEffect } from 'react';
import { Keyboard, Platform } from 'react-native';

export const useKeyboardNavigation = (onKeyPress?: (key: string) => void) => {
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          // Close modals, go back
          onKeyPress?.('escape');
          break;
        case 'Enter':
        case ' ':
          // Activate focused element
          onKeyPress?.('activate');
          break;
        case 'Tab':
          // Handle tab navigation (browser handles this naturally)
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onKeyPress]);
};

// Usage in components:
const QuickLogModal = () => {
  useKeyboardNavigation((key) => {
    if (key === 'escape') {
      onClose();
    }
  });
  
  // Rest of component...
};
```

## Performance Optimization

### Component Optimization

```typescript
// components/optimized/OptimizedList.tsx
import React, { memo } from 'react';
import { FlatList, VStack } from 'native-base';
import { ListRenderItem } from 'react-native';

interface OptimizedListProps<T> {
  data: T[];
  renderItem: ListRenderItem<T>;
  keyExtractor: (item: T, index: number) => string;
  estimatedItemSize?: number;
}

export const OptimizedList = memo(<T,>({
  data,
  renderItem,
  keyExtractor,
  estimatedItemSize = 80,
}: OptimizedListProps<T>) => {
  // Memoized item layout for performance
  const getItemLayout = React.useCallback(
    (data: any, index: number) => ({
      length: estimatedItemSize,
      offset: estimatedItemSize * index,
      index,
    }),
    [estimatedItemSize]
  );

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      getItemLayout={getItemLayout}
      // Performance optimizations
      maxToRenderPerBatch={10}
      windowSize={10}
      removeClippedSubviews={true}
      updateCellsBatchingPeriod={16}
      // Prevent unnecessary re-renders
      extraData={data.length}
    />
  );
});

// Memoized list item component
export const LogListItem = memo<{ log: DiaryLog }>(({ log }) => (
  <Box p={3} bg="white" borderRadius="md" mb={2}>
    <HStack justifyContent="space-between" alignItems="center">
      <VStack>
        <Text fontSize="md" fontWeight="medium">
          {formatLogType(log.changeType)}
        </Text>
        <Text fontSize="sm" color="gray.600">
          {formatLogTime(log.timestamp)}
        </Text>
      </VStack>
      <Text fontSize="sm" color="gray.500">
        {log.childName}
      </Text>
    </HStack>
  </Box>
));
```

### State Management Integration

```typescript
// stores/appStore.ts
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface AppState {
  // Navigation state
  currentScreen: 'home' | 'planner' | 'settings';
  fabAction: 'log' | 'add' | 'share';
  
  // User data
  children: Child[];
  selectedChildId: string | null;
  
  // UI state
  isQuickLogOpen: boolean;
  isLoading: boolean;
  
  // Actions
  setCurrentScreen: (screen: string) => void;
  setFABAction: (action: string) => void;
  openQuickLog: () => void;
  closeQuickLog: () => void;
  addChild: (child: Child) => void;
  selectChild: (id: string) => void;
}

export const useAppStore = create<AppState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    currentScreen: 'home',
    fabAction: 'log',
    children: [],
    selectedChildId: null,
    isQuickLogOpen: false,
    isLoading: false,
    
    // Actions
    setCurrentScreen: (screen) => {
      set({ currentScreen: screen as any });
      
      // Update FAB action based on screen
      const fabAction = screen === 'home' ? 'log' 
        : screen === 'planner' ? 'add' 
        : 'share';
      set({ fabAction: fabAction as any });
    },
    
    setFABAction: (action) => set({ fabAction: action as any }),
    
    openQuickLog: () => set({ isQuickLogOpen: true }),
    closeQuickLog: () => set({ isQuickLogOpen: false }),
    
    addChild: (child) => {
      set((state) => ({
        children: [...state.children, child],
        selectedChildId: child.id,
      }));
    },
    
    selectChild: (id) => set({ selectedChildId: id }),
  }))
);

// Usage in components
const HomeScreen = () => {
  const { 
    selectedChildId, 
    children, 
    openQuickLog,
    setCurrentScreen 
  } = useAppStore();
  
  const selectedChild = children.find(c => c.id === selectedChildId);
  
  useEffect(() => {
    setCurrentScreen('home');
  }, [setCurrentScreen]);
  
  // Component implementation...
};
```

This comprehensive implementation guide provides exact technical specifications for building NestSync with pixel-perfect accuracy while maintaining the psychological methodology designed specifically for stressed Canadian parents. Every code example includes accessibility considerations, performance optimizations, and the calming interaction patterns essential for the target user base.