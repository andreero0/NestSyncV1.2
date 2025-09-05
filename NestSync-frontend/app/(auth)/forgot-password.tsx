/**
 * Forgot Password Screen
 * Simple password reset interface for NestSync users
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../../stores/authStore';
import { NestSyncButton, NestSyncInput } from '@/components/ui';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';

// Validation schema
const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .min(1, 'Email is required'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { resetPassword, isLoading, error, clearError } = useAuthStore();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [isEmailSent, setIsEmailSent] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
    },
  });

  const watchedEmail = watch('email');

  // Clear error when component mounts
  useEffect(() => {
    clearError();
  }, []);

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      clearError();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const response = await resetPassword({
        email: data.email.toLowerCase().trim(),
      });

      if (response.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setIsEmailSent(true);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert(
          'Reset Failed',
          response.error || 'Failed to send reset email. Please try again.',
          [{ text: 'OK', style: 'default' }]
        );
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.error('Password reset error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  const handleBackToLogin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleResendEmail = async () => {
    if (watchedEmail) {
      await onSubmit({ email: watchedEmail });
    }
  };

  if (isEmailSent) {
    return (
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.contentContainer}>
        <StatusBar style="dark" />
        
        {/* Success Header */}
        <View style={styles.header}>
          <Text style={styles.successEmoji}>📧</Text>
          <Text style={[styles.title, { color: colors.textEmphasis }]}>Check Your Email</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            We've sent password reset instructions to{'\n'}
            <Text style={[styles.emailText, { color: colors.textEmphasis }]}>{watchedEmail}</Text>
          </Text>
        </View>

        {/* Instructions */}
        <View style={[styles.instructionsContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.instructionsTitle, { color: colors.textEmphasis }]}>Next Steps:</Text>
          <Text style={[styles.instructionItem, { color: colors.text }]}>1. Check your email inbox</Text>
          <Text style={[styles.instructionItem, { color: colors.text }]}>2. Click the reset link in the email</Text>
          <Text style={[styles.instructionItem, { color: colors.text }]}>3. Create your new password</Text>
          <Text style={[styles.instructionItem, { color: colors.text }]}>4. Sign in with your new password</Text>
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <NestSyncButton
            title={isLoading ? 'Sending...' : 'Resend Email'}
            onPress={handleResendEmail}
            disabled={isLoading}
            loading={isLoading}
            variant="outline"
            fullWidth
            style={styles.resendButton}
          />

          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackToLogin}
            disabled={isLoading}
          >
            <Text style={[styles.backButtonText, { color: colors.tint }]}>Back to Sign In</Text>
          </TouchableOpacity>
        </View>

        {/* Help Text */}
        <View style={[styles.helpContainer, { backgroundColor: colors.success + '20', borderColor: colors.success + '40' }]}>
          <Text style={[styles.helpText, { color: colors.success }]}>
            Didn't receive the email? Check your spam folder or try a different email address.
          </Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.contentContainer}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textEmphasis }]}>Reset Password</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Enter your email address and we'll send you instructions to reset your password.
        </Text>
      </View>

      {/* Reset Form */}
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
              autoFocus
            />
          )}
        />

        {/* Error Display */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          </View>
        )}

        {/* Reset Button */}
        <NestSyncButton
          title={isLoading ? 'Sending...' : 'Send Reset Instructions'}
          onPress={handleSubmit(onSubmit)}
          disabled={!isValid || isLoading}
          loading={isLoading}
          fullWidth
          style={styles.resetButton}
        />

        {/* Back to Login */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackToLogin}
          disabled={isLoading}
        >
          <Text style={[styles.backButtonText, { color: colors.tint }]}>Back to Sign In</Text>
        </TouchableOpacity>
      </View>

      {/* Security Notice */}
      <View style={[styles.securityNotice, { borderTopColor: colors.border }]}>
        <Text style={[styles.securityText, { color: colors.textSecondary }]}>
          🔒 For your security, the reset link will expire in 24 hours
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
  successEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emailText: {
    fontWeight: '600',
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 24,
  },
  errorContainer: {
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    marginTop: 4,
  },
  resetButton: {
    marginBottom: 24,
  },
  backButton: {
    padding: 16,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  resendButton: {
    marginBottom: 16,
  },
  instructionsContainer: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  instructionItem: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  actionsContainer: {
    marginBottom: 32,
  },
  helpContainer: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  helpText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  securityNotice: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
  },
  securityText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
});