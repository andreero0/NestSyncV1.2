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
} from 'react-native';
import { useAuthStore } from '../../stores/authStore';
import { Colors } from '../../constants/Colors';

export default function DevOnboardingReset() {
  // Only render in development mode
  if (!__DEV__) {
    return null;
  }

  const { user, onboardingCompleted, resetOnboardingForDev, isLoading } = useAuthStore();
  const [isResetting, setIsResetting] = useState(false);

  const handleResetOnboarding = async () => {
    if (!user) {
      Alert.alert('Error', 'No authenticated user found');
      return;
    }

    Alert.alert(
      'Reset Onboarding',
      `This will reset your onboarding status and redirect you to the onboarding flow.\n\nCurrent status: ${
        onboardingCompleted ? 'Completed' : 'Not Completed'
      }\n\nContinue?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            setIsResetting(true);
            try {
              const result = await resetOnboardingForDev();
              if (result.success) {
                Alert.alert('Success', 'Onboarding status reset successfully!');
              } else {
                Alert.alert('Error', result.error || 'Failed to reset onboarding status');
              }
            } catch (error) {
              Alert.alert('Error', 'An unexpected error occurred');
            } finally {
              setIsResetting(false);
            }
          },
        },
      ]
    );
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