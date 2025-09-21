/**
 * Development-only Onboarding Reset Component
 * Provides easy access to reset onboarding status during development
 * Only renders in __DEV__ mode
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { Colors } from '../../constants/Colors';

export default function DevOnboardingReset() {
  // Only render in development mode
  if (!__DEV__) {
    return null;
  }

  const { user, onboardingCompleted, resetOnboardingForDev, isLoading } = useAuthStore();
  const [isResetting, setIsResetting] = useState(false);
  const router = useRouter();

  // Web-compatible confirmation function
  const showConfirmation = (message: string, onConfirm: () => void) => {
    if (Platform.OS === 'web') {
      if (window.confirm(message)) {
        onConfirm();
      }
    } else {
      Alert.alert(
        'Reset Onboarding',
        message,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Reset', style: 'destructive', onPress: onConfirm },
        ]
      );
    }
  };

  const handleResetOnboarding = async () => {
    if (!user) {
      const errorMessage = 'No authenticated user found';
      if (Platform.OS === 'web') {
        window.alert(errorMessage);
      } else {
        Alert.alert('Error', errorMessage);
      }
      return;
    }

    const confirmMessage = `This will reset your onboarding status and redirect you to the onboarding flow.\n\nCurrent status: ${
      onboardingCompleted ? 'Completed' : 'Not Completed'
    }\n\nContinue?`;

    showConfirmation(confirmMessage, async () => {
      setIsResetting(true);
      try {
        const result = await resetOnboardingForDev();
        if (result.success) {
          const successMessage = 'Onboarding status reset successfully! Redirecting to onboarding...';
          if (Platform.OS === 'web') {
            window.alert(successMessage);
          } else {
            Alert.alert('Success', successMessage);
          }

          // Navigate to onboarding with development bypass
          setTimeout(() => {
            router.push('/(auth)/onboarding?dev-bypass=true');
          }, 500);
        } else {
          const errorMessage = result.error || 'Failed to reset onboarding status';
          if (Platform.OS === 'web') {
            window.alert(`Error: ${errorMessage}`);
          } else {
            Alert.alert('Error', errorMessage);
          }
        }
      } catch (error) {
        const errorMessage = 'An unexpected error occurred';
        if (Platform.OS === 'web') {
          window.alert(`Error: ${errorMessage}`);
        } else {
          Alert.alert('Error', errorMessage);
        }
      } finally {
        setIsResetting(false);
      }
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dev Tools</Text>
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          User: {user?.email || 'Not logged in'}
        </Text>
        <Text style={styles.infoText}>
          Onboarding: {onboardingCompleted ? 'Completed' : 'Not Completed'}
        </Text>
      </View>
      
      <TouchableOpacity
        style={[
          styles.resetButton,
          (isLoading || isResetting || !user) && styles.disabledButton
        ]}
        onPress={handleResetOnboarding}
        disabled={isLoading || isResetting || !user}
      >
        {isResetting ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.resetButtonText}>Reset Onboarding</Text>
        )}
      </TouchableOpacity>
      
      <Text style={styles.disclaimer}>
        This button only appears in development mode
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f0f0f0',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ff6b6b',
    borderStyle: 'dashed',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff6b6b',
    marginBottom: 8,
    textAlign: 'center',
  },
  infoContainer: {
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  resetButton: {
    backgroundColor: '#ff6b6b',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 8,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});