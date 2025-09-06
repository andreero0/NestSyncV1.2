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

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitialized, user, initialize } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();
  const [appIsReady, setAppIsReady] = useState(false);
  const [hasSeenSplash, setHasSeenSplash] = useState(false);

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
        console.log('AuthGuard: Starting authentication initialization...');
        await initialize();
        console.log('AuthGuard: Authentication initialization completed');
      } catch (error) {
        console.error('AuthGuard: Error during auth initialization:', error);
      }
    };

    initializeAuth();
  }, []);

  useEffect(() => {
    if (!isInitialized) return; // Wait for auth to initialize

    console.log('AuthGuard: Auth initialized, handling navigation...', {
      isAuthenticated,
      segments,
      userOnboardingCompleted: user?.onboardingCompleted
    });

    const inAuthGroup = segments[0] === '(auth)';
    const inSplashScreen = segments[0] === 'splash';

    // Check if user should see splash screen first (first time app launch)
    if (!hasSeenSplash && !inSplashScreen) {
      console.log('AuthGuard: Showing splash screen for first time user');
      setHasSeenSplash(true);
      router.replace('/splash');
      return; // Exit early to show splash
    }


    if (!isAuthenticated && !inAuthGroup && !inSplashScreen) {
      // User is not authenticated and not in protected screens, redirect to login
      console.log('AuthGuard: Redirecting to login - user not authenticated');
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // User is authenticated but in auth group
      if (user?.onboardingCompleted) {
        // Redirect to main app if onboarding is complete
        console.log('AuthGuard: Redirecting to main app - onboarding completed');
        router.replace('/(tabs)');
      } else {
        // Redirect to onboarding if not complete
        console.log('AuthGuard: Redirecting to onboarding - not completed');
        router.replace('/(auth)/onboarding');
      }
    }

    // Mark app as ready once navigation is determined
    if (!appIsReady) {
      console.log('AuthGuard: App is ready, hiding splash screen');
      setAppIsReady(true);
      SplashScreen.hideAsync().catch(console.error);
    }
  }, [isAuthenticated, isInitialized, user?.onboardingCompleted, segments, appIsReady]);

  // Show loading screen while initializing
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
          <Stack.Screen name="splash" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style={actualTheme === 'dark' ? 'light' : 'dark'} />
        <JITConsentModal />
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
      console.error('Font loading error:', error);
      // Hide splash screen even if fonts fail to load to prevent infinite loading
      SplashScreen.hideAsync().catch(console.error);
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
