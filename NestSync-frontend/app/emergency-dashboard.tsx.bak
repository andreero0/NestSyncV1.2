import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  BackHandler,
  StatusBar,
  Platform,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import EmergencyDashboard from '../components/emergency/EmergencyDashboard';
import { emergencyStorage } from '../lib/storage/EmergencyStorageService';

/**
 * Emergency Dashboard Screen
 *
 * This screen provides critical emergency features with offline-first capability:
 * - Instant access to emergency contacts (<100ms MMKV storage)
 * - Medical information display with collapsible sections
 * - QR code generation for first responders
 * - Direct dialing to Canadian emergency services (911, Poison Control, Telehealth)
 * - Psychology-driven UX for stress reduction
 *
 * Design Features:
 * - High contrast emergency colors (#FF3B30 red theme)
 * - Large touch targets (minimum 60x60dp for stressed users)
 * - Instant offline data access using MMKV encryption
 * - Canadian healthcare integration (provincial health cards)
 * - PIPEDA-compliant emergency data sharing
 */
export default function EmergencyDashboardScreen() {
  const router = useRouter();
  const [isEmergencyMode, setIsEmergencyMode] = useState(true);

  // Verify emergency mode status on screen focus
  useFocusEffect(
    React.useCallback(() => {
      const checkEmergencyMode = () => {
        const isActive = emergencyStorage.isEmergencyModeActive();
        if (!isActive) {
          // Emergency mode was disabled elsewhere, exit screen
          router.back();
          return;
        }
        setIsEmergencyMode(isActive);
      };

      checkEmergencyMode();

      // Set up status bar for emergency mode
      if (Platform.OS === 'ios') {
        StatusBar.setBarStyle('light-content', true);
      }

      return () => {
        // Reset status bar when leaving emergency mode
        if (Platform.OS === 'ios') {
          StatusBar.setBarStyle('dark-content', true);
        }
      };
    }, [router])
  );

  // Handle Android back button in emergency mode
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        handleExitEmergencyMode();
        return true; // Prevent default back action
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [])
  );

  // Handle emergency mode exit
  const handleExitEmergencyMode = () => {
    Alert.alert(
      'Exit Emergency Mode',
      'Are you sure you want to exit emergency mode? You can re-enter by tapping the emergency button.',
      [
        {
          text: 'Stay in Emergency Mode',
          style: 'cancel',
        },
        {
          text: 'Exit Emergency Mode',
          style: 'destructive',
          onPress: () => {
            // Disable emergency mode
            emergencyStorage.setEmergencyMode(false);
            setIsEmergencyMode(false);

            // Navigate back to previous screen
            router.back();
          },
        },
      ],
      { cancelable: true }
    );
  };

  // Verify emergency data availability
  useEffect(() => {
    const verifyEmergencyData = () => {
      try {
        const profiles = emergencyStorage.getAllEmergencyProfiles();

        if (profiles.length === 0) {
          Alert.alert(
            'No Emergency Data',
            'No emergency profiles found. Please set up emergency information in settings first.',
            [
              {
                text: 'Go to Settings',
                onPress: () => {
                  emergencyStorage.setEmergencyMode(false);
                  router.replace('/(tabs)/settings');
                },
              },
              {
                text: 'Continue Anyway',
                style: 'cancel',
              },
            ]
          );
        }

        // Check storage health for emergency performance
        const storageHealth = emergencyStorage.getStorageHealth();
        if (!storageHealth.isHealthy) {
          console.warn('Emergency storage performance warning:', storageHealth);
        }

      } catch (error) {
        console.error('Emergency data verification failed:', error);
        Alert.alert(
          'Emergency Data Error',
          'Unable to access emergency information. Please check your device storage.',
          [
            {
              text: 'Retry',
              onPress: verifyEmergencyData,
            },
            {
              text: 'Exit Emergency Mode',
              style: 'destructive',
              onPress: handleExitEmergencyMode,
            },
          ]
        );
      }
    };

    verifyEmergencyData();
  }, []);

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        {/* Emergency status bar configuration */}
        <StatusBar
          barStyle="light-content"
          backgroundColor="#FF3B30"
          translucent={false}
        />

        {/* Emergency Dashboard Component */}
        <EmergencyDashboard
          onExitEmergencyMode={handleExitEmergencyMode}
        />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FF3B30', // Emergency theme color
  },
});