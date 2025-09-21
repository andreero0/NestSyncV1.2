import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ApolloProvider } from '@apollo/client';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { ThemeProvider as NestSyncThemeProvider, useNestSyncTheme } from '../contexts/ThemeContext';
import { JITConsentProvider } from '../contexts/JITConsentContext';
import { UnitPreferenceProvider } from '../contexts/UnitPreferenceContext';
import { Colors } from '../constants/Colors';
import apolloClient from '../lib/graphql/client';
import { useAuthStore } from '../stores/authStore';
import { JITConsentModal } from '../components/consent/JITConsentModal';
import NestSyncSplashScreen from '../components/splash/SplashScreen';
import { EmergencyModeButton } from '../components/emergency';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitialized, user, initialize } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();
  const [appIsReady, setAppIsReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [splashCompleted, setSplashCompleted] = useState(false);

  // Get theme colors for loading screen
  let loadingColors;
  try {
    const actualTheme = useNestSyncTheme();
    loadingColors = Colors[actualTheme];
  } catch {
    // Fallback to light theme if ThemeContext is not yet available
    loadingColors = Colors.light;
  }

  useEffect(() => {
    // Initialize authentication state
    const initializeAuth = async () => {
      try {
        if (__DEV__) {
          console.log('AuthGuard: Starting authentication initialization...');
        }
        await initialize();
        if (__DEV__) {
          console.log('AuthGuard: Authentication initialization completed');
        }
      } catch (error) {
        // Critical auth error - should be logged in production
        console.error('AuthGuard: Error during auth initialization:', error);
      }
    };

    initializeAuth();
  }, []);

  // Handle splash screen completion
  const handleSplashComplete = () => {
    setSplashCompleted(true);
    setShowSplash(false);
    
    if (__DEV__) {
      console.log('AuthGuard: Splash screen completed, hiding native splash');
    }
    
    // Hide the native splash screen
    SplashScreen.hideAsync().catch((error) => {
      console.error('Failed to hide native splash screen:', error);
    });
  };

  useEffect(() => {
    if (!isInitialized || !splashCompleted) return; // Wait for both auth and splash to complete

    if (__DEV__) {
      console.log('AuthGuard: Auth initialized and splash completed, handling navigation...', {
        isAuthenticated,
        segments,
        userOnboardingCompleted: user?.onboardingCompleted
      });
    }

    const inAuthGroup = segments[0] === '(auth)';
    const isOnboardingRoute = segments.includes('onboarding');

    // Development bypass: Allow direct access to onboarding if URL contains 'dev-bypass' query param
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const isDevelopmentBypass = __DEV__ && urlParams?.has('dev-bypass');

    if (!isAuthenticated && !inAuthGroup) {
      // User is not authenticated, redirect to login
      if (__DEV__) {
        console.log('AuthGuard: Redirecting to login - user not authenticated');
      }
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // User is authenticated but in auth group
      if (user?.onboardingCompleted && !isDevelopmentBypass) {
        // Redirect to main app if onboarding is complete (unless dev bypass)
        if (__DEV__) {
          console.log('AuthGuard: Redirecting to main app - onboarding completed');
        }
        router.replace('/(tabs)');
      } else {
        // Redirect to onboarding if not complete or if dev bypass is active
        if (__DEV__ && isDevelopmentBypass) {
          console.log('AuthGuard: Development bypass active - allowing onboarding access');
        }
        if (!isOnboardingRoute) {
          if (__DEV__) {
            console.log('AuthGuard: Redirecting to onboarding - not completed or dev bypass');
          }
          router.replace('/(auth)/onboarding');
        }
      }
    }
  }, [isAuthenticated, isInitialized, user?.onboardingCompleted, segments, splashCompleted]);

  // Separate effect to set app ready state (prevents infinite render loop)
  useEffect(() => {
    if (isInitialized && splashCompleted && !appIsReady) {
      if (__DEV__) {
        console.log('AuthGuard: App is ready for navigation');
      }
      setAppIsReady(true);
    }
  }, [isInitialized, splashCompleted, appIsReady]);

  // Show splash screen first, then loading screen while initializing
  if (showSplash) {
    return <NestSyncSplashScreen onComplete={handleSplashComplete} />;
  }
  
  // Show loading screen while initializing auth (after splash)
  if (!isInitialized) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: loadingColors.background }]}>
        <ActivityIndicator size="large" color={loadingColors.tint} />
        <Text style={[styles.loadingText, { color: loadingColors.textSecondary }]}>
          Initializing NestSync...
        </Text>
      </View>
    );
  }

  return <>{children}</>;
}

// Theme-aware navigation wrapper
function ThemedNavigationWrapper() {
  const actualTheme = useNestSyncTheme();
  
  // Create custom navigation themes based on NestSync color system
  const nestSyncDarkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: Colors.dark.background,
      primary: Colors.dark.tint,
      text: Colors.dark.text,
      card: Colors.dark.surface,
      border: Colors.dark.border,
    },
  };

  const nestSyncLightTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: Colors.light.background,
      primary: Colors.light.tint,
      text: Colors.light.text,
      card: Colors.light.surface,
      border: Colors.light.border,
    },
  };

  return (
    <ThemeProvider value={actualTheme === 'dark' ? nestSyncDarkTheme : nestSyncLightTheme}>
      <AuthGuard>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="emergency-dashboard"
            options={{
              headerShown: false,
              presentation: 'fullScreenModal',
              gestureEnabled: false, // Prevent accidental dismissal in emergency
            }}
          />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style={actualTheme === 'dark' ? 'light' : 'dark'} />
        <JITConsentModal />
        <EmergencyModeButton />
      </AuthGuard>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) {
      // Critical font loading error - should be logged in production
      console.error('Font loading error:', error);
      // Hide splash screen even if fonts fail to load to prevent infinite loading
      SplashScreen.hideAsync().catch((error) => {
        // Critical error - should be logged in production
        console.error('Failed to hide splash screen after font error:', error);
      });
    }
  }, [error]);

  // Don't render anything until fonts are loaded (or failed to load)
  if (!loaded && !error) {
    return null; // The splash screen will continue to be shown
  }

  return (
    <ApolloProvider client={apolloClient}>
      <NestSyncThemeProvider defaultTheme="system">
        <UnitPreferenceProvider>
          <JITConsentProvider>
            <ThemedNavigationWrapper />
          </JITConsentProvider>
        </UnitPreferenceProvider>
      </NestSyncThemeProvider>
    </ApolloProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
});
