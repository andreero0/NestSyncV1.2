/**
 * Reset Password Screen
 * Complete password reset flow with token validation
 */

import React, { useState, useEffect } from 'react';
import { secureLog } from '../../lib/utils/secureLogger';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { NestSyncButton, NestSyncInput } from '@/components/ui';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import { apolloClient } from '../../lib/graphql/client';
import { gql } from '@apollo/client';

// Password validation schema
const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// GraphQL mutation for completing password reset
const COMPLETE_PASSWORD_RESET_MUTATION = gql`
  mutation CompletePasswordReset($token: String!, $newPassword: String!) {
    completePasswordReset(token: $token, newPassword: $newPassword) {
      success
      message
      error
    }
  }
`;

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string; email?: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme as keyof typeof Colors ?? 'light'];
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onChange',
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  // Validate token on mount
  useEffect(() => {
    if (!params.token) {
      setError('Invalid or missing reset token. Please request a new password reset link.');
    }
  }, [params.token]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!params.token) {
      setError('Invalid reset token');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const { data: responseData } = await apolloClient.mutate({
        mutation: COMPLETE_PASSWORD_RESET_MUTATION,
        variables: {
          token: params.token,
          newPassword: data.password,
        },
      });

      const response = responseData?.completePasswordReset;

      if (response?.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setIsSuccess(true);
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.replace('/login');
        }, 2000);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        const errorMessage = response?.error || 'Failed to reset password';
        
        // Handle specific error cases
        if (errorMessage.toLowerCase().includes('expired')) {
          setError('This reset link has expired. Please request a new one.');
        } else if (errorMessage.toLowerCase().includes('invalid')) {
          setError('This reset link is invalid. Please request a new one.');
        } else if (errorMessage.toLowerCase().includes('used')) {
          setError('This reset link has already been used. Please request a new one.');
        } else {
          setError(errorMessage);
        }
      }
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      secureLog.error('Password reset error:', err);
      
      if (err.networkError) {
        setError('Unable to connect to the server. Please check your internet connection.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestNewLink = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/forgot-password');
  };

  const handleBackToLogin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/login');
  };

  // Success state
  if (isSuccess) {
    return (
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.contentContainer}>
        <StatusBar style="dark" />
        
        <View style={styles.header}>
          <Text style={styles.successEmoji}>✓</Text>
          <Text style={[styles.title, { color: colors.textEmphasis }]}>
            <Text>Password Reset Successful</Text>
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            <Text>Your password has been updated successfully. Redirecting to login...</Text>
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
        <Text style={[styles.title, { color: colors.textEmphasis }]}>
          <Text>Create New Password</Text>
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          <Text>Enter a new password for your account</Text>
          {params.email && (
            <Text>
              {'\n'}
              <Text style={[styles.emailText, { color: colors.textEmphasis }]}>{params.email}</Text>
            </Text>
          )}
        </Text>
      </View>

      {/* Reset Form */}
      <View style={styles.form}>
        {/* Password Input */}
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <NestSyncInput
              label="New Password"
              placeholder="Enter new password"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              secureTextEntry
              showPasswordToggle
              autoCapitalize="none"
              textContentType="newPassword"
              editable={!isLoading}
              error={errors.password?.message}
              containerStyle={styles.inputContainer}
              autoFocus
            />
          )}
        />

        {/* Confirm Password Input */}
        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <NestSyncInput
              label="Confirm Password"
              placeholder="Re-enter new password"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              secureTextEntry
              showPasswordToggle
              autoCapitalize="none"
              textContentType="newPassword"
              editable={!isLoading}
              error={errors.confirmPassword?.message}
              containerStyle={styles.inputContainer}
            />
          )}
        />

        {/* Password Requirements */}
        <View style={[styles.requirementsContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.requirementsTitle, { color: colors.textEmphasis }]}>
            <Text>Password Requirements:</Text>
          </Text>
          <Text style={[styles.requirementItem, { color: colors.text }]}>
            <Text>• At least 8 characters</Text>
          </Text>
          <Text style={[styles.requirementItem, { color: colors.text }]}>
            <Text>• One uppercase letter</Text>
          </Text>
          <Text style={[styles.requirementItem, { color: colors.text }]}>
            <Text>• One lowercase letter</Text>
          </Text>
          <Text style={[styles.requirementItem, { color: colors.text }]}>
            <Text>• One number</Text>
          </Text>
        </View>

        {/* Error Display */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: colors.error }]}>
              <Text>{error}</Text>
            </Text>
            {(error.includes('expired') || error.includes('invalid') || error.includes('used')) && (
              <TouchableOpacity
                style={[styles.requestNewButton, { borderColor: colors.tint }]}
                onPress={handleRequestNewLink}
                disabled={isLoading}
              >
                <Text style={[styles.requestNewButtonText, { color: colors.tint }]}>
                  <Text>Request New Reset Link</Text>
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Reset Button */}
        <NestSyncButton
          title={isLoading ? 'Resetting Password...' : 'Reset Password'}
          onPress={handleSubmit(onSubmit)}
          disabled={!isValid || isLoading || !params.token}
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
          <Text style={[styles.backButtonText, { color: colors.tint }]}>
            <Text>Back to Sign In</Text>
          </Text>
        </TouchableOpacity>
      </View>

      {/* Security Notice */}
      <View style={[styles.securityNotice, { borderTopColor: colors.border }]}>
        <Text style={[styles.securityText, { color: colors.textSecondary }]}>
          <Text>For your security, this reset link can only be used once</Text>
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
  requirementsContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  requirementItem: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 2,
  },
  errorContainer: {
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    marginBottom: 12,
  },
  requestNewButton: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  requestNewButtonText: {
    fontSize: 14,
    fontWeight: '500',
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
