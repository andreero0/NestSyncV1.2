import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
// import { emergencyStorage } from '../../lib/storage/EmergencyStorageService'; // Temporarily commented for web compatibility

interface EmergencyModeButtonProps {
  // Optional props for customization
  size?: number;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  hideOnScreens?: string[]; // Array of screen names where button should be hidden
}

const EmergencyModeButton: React.FC<EmergencyModeButtonProps> = ({
  size = 72,
  position = 'bottom-right',
  hideOnScreens = [],
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const [pulseAnimation] = useState(new Animated.Value(1));
  const [scaleAnimation] = useState(new Animated.Value(1));

  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width, height } = Dimensions.get('window');

  // Check if emergency mode is active on mount
  useEffect(() => {
    const checkEmergencyMode = () => {
      const isActive = false; // emergencyStorage.isEmergencyModeActive(); // Temporarily commented for web compatibility
      setIsEmergencyMode(isActive);
    };

    checkEmergencyMode();

    // Set up pulse animation for emergency mode
    if (isEmergencyMode) {
      startPulseAnimation();
    }
  }, [isEmergencyMode]);

  // Pulse animation for emergency mode
  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  // Handle emergency button press
  const handleEmergencyPress = async () => {
    try {
      // Haptic feedback for urgency
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      // Toggle emergency mode
      const newEmergencyMode = !isEmergencyMode;
      setIsEmergencyMode(newEmergencyMode);
      // emergencyStorage.setEmergencyMode(newEmergencyMode); // Temporarily commented for web compatibility

      if (newEmergencyMode) {
        // Navigate to emergency dashboard
        router.push('/emergency-dashboard');
        startPulseAnimation();
      } else {
        // Exit emergency mode
        pulseAnimation.stopAnimation();
        pulseAnimation.setValue(1);
      }

      // Scale animation for feedback
      Animated.sequence([
        Animated.timing(scaleAnimation, {
          toValue: 0.9,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnimation, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

    } catch (error) {
      console.error('Emergency mode toggle failed:', error);
    }
  };

  // Calculate position based on props
  const getPositionStyles = () => {
    const margin = 20;
    const safeMargin = {
      top: Math.max(insets.top, margin),
      bottom: Math.max(insets.bottom, margin),
      left: margin,
      right: margin,
    };

    switch (position) {
      case 'bottom-right':
        return {
          position: 'absolute' as const,
          bottom: safeMargin.bottom,
          right: safeMargin.right,
        };
      case 'bottom-left':
        return {
          position: 'absolute' as const,
          bottom: safeMargin.bottom,
          left: safeMargin.left,
        };
      case 'top-right':
        return {
          position: 'absolute' as const,
          top: safeMargin.top,
          right: safeMargin.right,
        };
      case 'top-left':
        return {
          position: 'absolute' as const,
          top: safeMargin.top,
          left: safeMargin.left,
        };
      default:
        return {
          position: 'absolute' as const,
          bottom: safeMargin.bottom,
          right: safeMargin.right,
        };
    }
  };

  // Emergency mode colors
  const emergencyColors = {
    background: '#FF3B30', // High contrast emergency red
    backgroundActive: '#D70015',
    text: '#FFFFFF',
    shadow: 'rgba(255, 59, 48, 0.4)',
  };

  const normalColors = {
    background: '#FF6B6B', // Softer red for normal state
    backgroundActive: '#FF3B30',
    text: '#FFFFFF',
    shadow: 'rgba(255, 107, 107, 0.3)',
  };

  const colors = isEmergencyMode ? emergencyColors : normalColors;

  return (
    <Animated.View
      style={[
        getPositionStyles(),
        {
          transform: [
            { scale: scaleAnimation },
            { scale: pulseAnimation },
          ],
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handleEmergencyPress}
        onPressIn={() => setIsPressed(true)}
        onPressOut={() => setIsPressed(false)}
        style={[
          styles.button,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: isPressed ? colors.backgroundActive : colors.background,
            shadowColor: colors.shadow,
          },
        ]}
        accessibilityLabel={
          isEmergencyMode ? 'Exit Emergency Mode' : 'Activate Emergency Mode'
        }
        accessibilityHint="Toggles emergency assistance features"
        accessibilityRole="button"
      >
        <View style={styles.buttonContent}>
          <MaterialIcons
            name={isEmergencyMode ? 'emergency' : 'emergency-share'}
            size={size * 0.4}
            color={colors.text}
          />
          {isEmergencyMode && (
            <Text style={[styles.emergencyText, { fontSize: size * 0.12 }]}>
              EMERGENCY
            </Text>
          )}
        </View>
      </TouchableOpacity>

      {/* Emergency mode indicator ring */}
      {isEmergencyMode && (
        <Animated.View
          style={[
            styles.emergencyRing,
            {
              width: size + 20,
              height: size + 20,
              borderRadius: (size + 20) / 2,
              transform: [{ scale: pulseAnimation }],
            },
          ]}
        />
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8, // Android shadow
    shadowOffset: { width: 0, height: 4 }, // iOS shadow
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 1000, // Ensure button appears above other content
  },
  buttonContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emergencyText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  emergencyRing: {
    position: 'absolute',
    top: -10,
    left: -10,
    borderWidth: 3,
    borderColor: 'rgba(255, 59, 48, 0.3)',
    zIndex: -1,
  },
});

export default EmergencyModeButton;