/**
 * Login Screen
 * Persona-optimized login interface for NestSync
 * Supports both Sarah (Overwhelmed New Mom) and Mike (Efficiency Dad) personas
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore, useBiometrics } from '../../stores/authStore';
import { SignInInput } from '../../lib/types/auth';
import { NestSyncButton, NestSyncInput } from '@/components/ui';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';

// Validation schema
const loginSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .min(1, 'Email is required'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, isLoading, error, clearError } = useAuthStore();
  const { available: biometricsAvailable, enabled: biometricsEnabled, signIn: signInWithBiometrics } = useBiometrics();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [showPassword, setShowPassword] = useState(false);
  const [biometricAttempted, setBiometricAttempted] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Clear error when component mounts
  useEffect(() => {
    clearError();
    
    // Attempt biometric authentication if enabled and not attempted
    if (biometricsAvailable && biometricsEnabled && !biometricAttempted) {
      setBiometricAttempted(true);
      handleBiometricLogin();
    }
  }, [biometricsAvailable, biometricsEnabled, biometricAttempted]);

  const handleBiometricLogin = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const response = await signInWithBiometrics();
      
      if (response.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace('/(tabs)');
      } else if (response.error && !response.error.includes('cancelled')) {
        // Only show error if it's not user cancellation
        Alert.alert('Biometric Sign In Failed', response.error);
      }
    } catch (error) {
      console.error('Biometric login error:', error);
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    try {
      clearError();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const signInData: SignInInput = {
        email: data.email.toLowerCase().trim(),
        password: data.password,
      };

      const response = await signIn(signInData);

      if (response.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // Navigate to main app or onboarding based on user state
        if (response.user?.onboardingCompleted) {
          router.replace('/(tabs)');
        } else {
          router.replace('/(auth)/onboarding');
        }
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert(
          'Sign In Failed',
          response.error || 'Please check your email and password and try again.',
          [{ text: 'OK', style: 'default' }]
        );
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.error('Login error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  const handleForgotPassword = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(auth)/forgot-password');
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.contentContainer}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textEmphasis }]}>Welcome Back</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Sign in to continue managing your little one's needs
        </Text>
      </View>

      {/* Biometric Login Button */}
      {biometricsAvailable && biometricsEnabled && (
        <NestSyncButton
          title={Platform.OS === 'ios' ? '🔐 Use Face ID / Touch ID' : '🔐 Use Fingerprint'}
          onPress={handleBiometricLogin}
          variant="outline"
          disabled={isLoading}
          style={styles.biometricButton}
        />
      )}

      {/* Login Form */}
      <View style={styles.form}>
        {/* Email Input */}
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <NestSyncInput
              label="Email Address"
              placeholder="Enter your email address"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              editable={!isLoading}
              error={errors.email?.message}
              containerStyle={styles.inputContainer}
            />
          )}
        />

        {/* Password Input */}
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <NestSyncInput
              label="Password"
              placeholder="Enter your password"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              showPasswordToggle
              autoComplete="password"
              textContentType="password"
              editable={!isLoading}
              error={errors.password?.message}
              containerStyle={styles.inputContainer}
            />
          )}
        />

        {/* Forgot Password */}
        <View style={styles.forgotPasswordContainer}>
          <TouchableOpacity onPress={handleForgotPassword} disabled={isLoading}>
            <Text style={[styles.forgotPasswordText, { color: colors.tint }]}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        {/* Error Display */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          </View>
        )}

        {/* Sign In Button */}
        <NestSyncButton
          title={isLoading ? 'Signing In...' : 'Sign In'}
          onPress={handleSubmit(onSubmit)}
          disabled={!isValid || isLoading}
          loading={isLoading}
          fullWidth
          style={styles.signInButton}
        />

        {/* Sign Up Link */}
        <View style={styles.signUpContainer}>
          <Text style={[styles.signUpText, { color: colors.textSecondary }]}>Don't have an account? </Text>
          <Link href="/(auth)/register" asChild>
            <TouchableOpacity disabled={isLoading}>
              <Text style={[styles.signUpLink, { color: colors.tint }]}>Sign Up</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>

      {/* Privacy Notice */}
      <View style={[styles.privacyNotice, { borderTopColor: colors.border }]}>
        <Text style={[styles.privacyText, { color: colors.textSecondary }]}>
          Your data is securely stored in Canada and protected under PIPEDA
        </Text>
        <Text style={[styles.privacySubText, { color: colors.textSecondary }]}>
          Trusted by Canadian families nationwide
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  biometricButton: {
    marginBottom: 24,
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 24,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 32,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '500',
  },
  errorContainer: {
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    marginTop: 4,
  },
  signInButton: {
    marginBottom: 24,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpText: {
    fontSize: 16,
  },
  signUpLink: {
    fontSize: 16,
    fontWeight: '500',
  },
  privacyNotice: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  privacyText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 4,
  },
  privacySubText: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 14,
    fontWeight: '500',
  },
});