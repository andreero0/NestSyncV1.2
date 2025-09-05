/**
 * Registration Screen
 * Canadian PIPEDA-compliant registration with persona detection
 * Optimized for both Sarah and Mike user personas
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dropdown } from 'react-native-element-dropdown';
import { useAuthStore } from '../../stores/authStore';
import { SignUpInput, CanadianProvince } from '../../lib/types/auth';
import { NestSyncButton, NestSyncInput } from '@/components/ui';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';

// Canadian provinces - formatted for dropdown
const CANADIAN_PROVINCES = [
  { value: 'AB', label: 'Alberta' },
  { value: 'BC', label: 'British Columbia' },
  { value: 'MB', label: 'Manitoba' },
  { value: 'NB', label: 'New Brunswick' },
  { value: 'NL', label: 'Newfoundland and Labrador' },
  { value: 'NS', label: 'Nova Scotia' },
  { value: 'NT', label: 'Northwest Territories' },
  { value: 'NU', label: 'Nunavut' },
  { value: 'ON', label: 'Ontario' },
  { value: 'PE', label: 'Prince Edward Island' },
  { value: 'QC', label: 'Quebec' },
  { value: 'SK', label: 'Saskatchewan' },
  { value: 'YT', label: 'Yukon' },
];

// Validation schema
const registerSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .min(1, 'Email is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name too long'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name too long'),
  province: z
    .string()
    .min(1, 'Please select your province'),
  acceptPrivacyPolicy: z
    .boolean()
    .refine(val => val === true, 'You must accept the Privacy Policy'),
  acceptTermsOfService: z
    .boolean()
    .refine(val => val === true, 'You must accept the Terms of Service'),
  marketingConsent: z.boolean().optional(),
  analyticsConsent: z.boolean().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp, isLoading, error, clearError } = useAuthStore();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      province: '',
      acceptPrivacyPolicy: false,
      acceptTermsOfService: false,
      marketingConsent: false,
      analyticsConsent: true, // Default to true for better user experience
    },
  });

  // Clear error when component mounts
  useEffect(() => {
    clearError();
  }, []);

  const onSubmit = async (data: RegisterFormData) => {
    try {
      clearError();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const signUpData: SignUpInput = {
        email: data.email.toLowerCase().trim(),
        password: data.password,
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        province: data.province as CanadianProvince,
        timezone: getTimezoneForProvince(data.province as CanadianProvince),
        language: 'en-CA', // Default to Canadian English
        acceptPrivacyPolicy: data.acceptPrivacyPolicy,
        acceptTermsOfService: data.acceptTermsOfService,
        marketingConsent: data.marketingConsent,
        analyticsConsent: data.analyticsConsent,
      };

      const response = await signUp(signUpData);

      if (response.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        Alert.alert(
          'Welcome to NestSync! 🎉',
          'Your account has been created successfully. Please check your email for verification.',
          [
            {
              text: 'Continue',
              onPress: () => router.replace('/(auth)/onboarding'),
            },
          ]
        );
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert(
          'Registration Failed',
          response.error || 'Something went wrong. Please try again.',
          [{ text: 'OK', style: 'default' }]
        );
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.error('Registration error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  const getTimezoneForProvince = (province: CanadianProvince): string => {
    const timezoneMap: Record<CanadianProvince, string> = {
      BC: 'America/Vancouver',
      YT: 'America/Vancouver',
      AB: 'America/Edmonton',
      NT: 'America/Edmonton',
      NU: 'America/Edmonton',
      SK: 'America/Regina',
      MB: 'America/Winnipeg',
      ON: 'America/Toronto',
      QC: 'America/Montreal',
      NB: 'America/Halifax',
      NS: 'America/Halifax',
      PE: 'America/Halifax',
      NL: 'America/St_Johns',
    };

    return timezoneMap[province] || 'America/Toronto';
  };

  const renderPrivacyModal = () => (
    <Modal
      visible={showPrivacyModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.textEmphasis }]}>Privacy Policy</Text>
          <TouchableOpacity
            onPress={() => setShowPrivacyModal(false)}
            style={styles.modalCloseButton}
          >
            <Text style={[styles.modalCloseText, { color: colors.tint }]}>Done</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.modalContent}>
          <Text style={[styles.modalText, { color: colors.text }]}>
            {/* Privacy Policy Content */}
            <Text style={[styles.modalSectionTitle, { color: colors.textEmphasis }]}>Data Protection Under PIPEDA{'\n\n'}</Text>
            NestSync is committed to protecting your privacy in compliance with Canada's Personal Information Protection and Electronic Documents Act (PIPEDA).
            {'\n\n'}
            <Text style={[styles.modalSectionTitle, { color: colors.textEmphasis }]}>Information We Collect:{'\n'}</Text>
            • Account information (name, email, province)
            {'\n'}• Child profile data (name, birth date, diaper size)
            {'\n'}• Usage patterns for diaper planning
            {'\n'}• App usage analytics (if consented)
            {'\n\n'}
            <Text style={[styles.modalSectionTitle, { color: colors.textEmphasis }]}>How We Use Your Information:{'\n'}</Text>
            • Provide diaper planning services
            {'\n'}• Send important notifications about your child's needs
            {'\n'}• Improve our service (with your consent)
            {'\n\n'}
            <Text style={[styles.modalSectionTitle, { color: colors.textEmphasis }]}>Your Rights:{'\n'}</Text>
            • Access your personal information
            {'\n'}• Request corrections or deletions
            {'\n'}• Withdraw consent at any time
            {'\n'}• Export your data
            {'\n\n'}
            <Text style={[styles.modalSectionTitle, { color: colors.textEmphasis }]}>Data Storage:{'\n'}</Text>
            All your data is stored in Canadian data centers and never leaves Canada.
          </Text>
        </ScrollView>
      </View>
    </Modal>
  );

  const renderTermsModal = () => (
    <Modal
      visible={showTermsModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.textEmphasis }]}>Terms of Service</Text>
          <TouchableOpacity
            onPress={() => setShowTermsModal(false)}
            style={styles.modalCloseButton}
          >
            <Text style={[styles.modalCloseText, { color: colors.tint }]}>Done</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.modalContent}>
          <Text style={[styles.modalText, { color: colors.text }]}>
            <Text style={[styles.modalSectionTitle, { color: colors.textEmphasis }]}>Terms of Service{'\n\n'}</Text>
            Welcome to NestSync, Canada's trusted diaper planning app.
            {'\n\n'}
            <Text style={[styles.modalSectionTitle, { color: colors.textEmphasis }]}>Acceptance of Terms:{'\n'}</Text>
            By creating an account, you agree to these terms and our commitment to Canadian privacy laws.
            {'\n\n'}
            <Text style={[styles.modalSectionTitle, { color: colors.textEmphasis }]}>Service Description:{'\n'}</Text>
            NestSync helps Canadian parents manage diaper planning through:
            {'\n'}• Usage tracking and predictions
            {'\n'}• Inventory management
            {'\n'}• Canadian retailer integration
            {'\n'}• Emergency alerts
            {'\n\n'}
            <Text style={[styles.modalSectionTitle, { color: colors.textEmphasis }]}>User Responsibilities:{'\n'}</Text>
            • Provide accurate information
            {'\n'}• Use the service responsibly
            {'\n'}• Keep your account secure
            {'\n\n'}
            <Text style={[styles.modalSectionTitle, { color: colors.textEmphasis }]}>Canadian Compliance:{'\n'}</Text>
            We operate under Canadian laws and maintain all data within Canada's borders.
          </Text>
        </ScrollView>
      </View>
    </Modal>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.contentContainer}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textEmphasis }]}>Join NestSync</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Canada's trusted diaper planning app for busy parents
        </Text>
      </View>

      {/* Registration Form */}
      <View style={styles.form}>
        {/* Name Inputs */}
        <View style={styles.nameRow}>
          <Controller
            control={control}
            name="firstName"
            render={({ field: { onChange, onBlur, value } }) => (
              <NestSyncInput
                label="First Name"
                placeholder="First name"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                autoCapitalize="words"
                textContentType="givenName"
                editable={!isLoading}
                error={errors.firstName?.message}
                containerStyle={[styles.inputContainer, styles.nameInput]}
              />
            )}
          />

          <Controller
            control={control}
            name="lastName"
            render={({ field: { onChange, onBlur, value } }) => (
              <NestSyncInput
                label="Last Name"
                placeholder="Last name"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                autoCapitalize="words"
                textContentType="familyName"
                editable={!isLoading}
                error={errors.lastName?.message}
                containerStyle={[styles.inputContainer, styles.nameInput]}
              />
            )}
          />
        </View>

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

        {/* Province Picker */}
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: colors.textEmphasis }]}>Province/Territory</Text>
          <Controller
            control={control}
            name="province"
            render={({ field: { onChange, value } }) => (
              <Dropdown
                style={[styles.dropdown, 
                  { 
                    borderColor: errors.province ? colors.error : colors.border,
                    backgroundColor: colors.background 
                  }
                ]}
                containerStyle={[styles.dropdownContainer, { 
                  backgroundColor: colors.surface,
                  borderColor: colors.border 
                }]}
                itemContainerStyle={{ 
                  backgroundColor: colors.surface 
                }}
                itemTextStyle={{ color: colors.text }}
                placeholderStyle={[styles.placeholderStyle, { color: colors.placeholder }]}
                selectedTextStyle={[styles.selectedTextStyle, { color: colors.text }]}
                data={CANADIAN_PROVINCES}
                maxHeight={300}
                labelField="label"
                valueField="value"
                placeholder="Select your province..."
                value={value}
                onChange={(item) => onChange(item.value)}
                disable={isLoading}
                accessibilityLabel="Province/Territory selection"
              />
            )}
          />
          {errors.province && (
            <Text style={[styles.errorText, { color: colors.error }]}>{errors.province.message}</Text>
          )}
        </View>

        {/* Password Input */}
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <NestSyncInput
              label="Password"
              placeholder="Create a strong password"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              showPasswordToggle
              textContentType="newPassword"
              editable={!isLoading}
              error={errors.password?.message}
              containerStyle={styles.inputContainer}
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
              placeholder="Confirm your password"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              showPasswordToggle
              textContentType="newPassword"
              editable={!isLoading}
              error={errors.confirmPassword?.message}
              containerStyle={styles.inputContainer}
            />
          )}
        />

        {/* Privacy Policy Consent */}
        <View style={styles.consentContainer}>
          <Controller
            control={control}
            name="acceptPrivacyPolicy"
            render={({ field: { onChange, value } }) => (
              <View style={styles.consentRow}>
                <TouchableOpacity
                  style={styles.consentCheckboxContainer}
                  onPress={() => onChange(!value)}
                  disabled={isLoading}
                >
                  <View style={[styles.consentCheckbox, { borderColor: value ? colors.tint : colors.border }, value && { backgroundColor: colors.tint, borderColor: colors.tint }]}>
                    {value && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                </TouchableOpacity>
                <View style={styles.consentTextContainer}>
                  <Text style={[styles.consentText, { color: colors.text }]}>
                    I accept the{' '}
                    <Text 
                      style={[styles.consentLink, { color: colors.tint }]}
                      onPress={!isLoading ? () => setShowPrivacyModal(true) : undefined}
                    >
                      Privacy Policy
                    </Text>
                    {' '}and understand my rights under PIPEDA
                  </Text>
                </View>
              </View>
            )}
          />
          {errors.acceptPrivacyPolicy && (
            <Text style={[styles.errorText, { color: colors.error }]}>{errors.acceptPrivacyPolicy.message}</Text>
          )}
        </View>

        {/* Terms of Service Consent */}
        <View style={styles.consentContainer}>
          <Controller
            control={control}
            name="acceptTermsOfService"
            render={({ field: { onChange, value } }) => (
              <View style={styles.consentRow}>
                <TouchableOpacity
                  style={styles.consentCheckboxContainer}
                  onPress={() => onChange(!value)}
                  disabled={isLoading}
                >
                  <View style={[styles.consentCheckbox, { borderColor: value ? colors.tint : colors.border }, value && { backgroundColor: colors.tint, borderColor: colors.tint }]}>
                    {value && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                </TouchableOpacity>
                <View style={styles.consentTextContainer}>
                  <Text style={[styles.consentText, { color: colors.text }]}>
                    I agree to the{' '}
                    <Text 
                      style={[styles.consentLink, { color: colors.tint }]}
                      onPress={!isLoading ? () => setShowTermsModal(true) : undefined}
                    >
                      Terms of Service
                    </Text>
                  </Text>
                </View>
              </View>
            )}
          />
          {errors.acceptTermsOfService && (
            <Text style={[styles.errorText, { color: colors.error }]}>{errors.acceptTermsOfService.message}</Text>
          )}
        </View>

        {/* Optional Consents */}
        <View style={styles.optionalConsentsSection}>
          <Text style={[styles.optionalConsentsTitle, { color: colors.textEmphasis }]}>Optional Permissions</Text>
          
          {/* Marketing Consent */}
          <View style={styles.consentContainer}>
            <Controller
              control={control}
              name="marketingConsent"
              render={({ field: { onChange, value } }) => (
                <View style={styles.consentRow}>
                  <TouchableOpacity
                    style={styles.consentCheckboxContainer}
                    onPress={() => onChange(!value)}
                    disabled={isLoading}
                  >
                    <View style={[styles.consentCheckbox, { borderColor: value ? colors.tint : colors.border }, value && { backgroundColor: colors.tint, borderColor: colors.tint }]}>
                      {value && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                  </TouchableOpacity>
                  <View style={styles.consentTextContainer}>
                    <Text style={[styles.consentText, { color: colors.text }]}>
                      Send me helpful parenting tips and product recommendations
                    </Text>
                  </View>
                </View>
              )}
            />
          </View>

          {/* Analytics Consent */}
          <View style={styles.consentContainer}>
            <Controller
              control={control}
              name="analyticsConsent"
              render={({ field: { onChange, value } }) => (
                <View style={styles.consentRow}>
                  <TouchableOpacity
                    style={styles.consentCheckboxContainer}
                    onPress={() => onChange(!value)}
                    disabled={isLoading}
                  >
                    <View style={[styles.consentCheckbox, { borderColor: value ? colors.tint : colors.border }, value && { backgroundColor: colors.tint, borderColor: colors.tint }]}>
                      {value && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                  </TouchableOpacity>
                  <View style={styles.consentTextContainer}>
                    <Text style={[styles.consentText, { color: colors.text }]}>
                      Help improve NestSync by sharing anonymous usage data
                    </Text>
                  </View>
                </View>
              )}
            />
          </View>
        </View>

        {/* Error Display */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          </View>
        )}

        {/* Sign Up Button */}
        <NestSyncButton
          title={isLoading ? 'Creating Account...' : 'Create Account'}
          onPress={handleSubmit(onSubmit)}
          disabled={!isValid || isLoading}
          loading={isLoading}
          fullWidth
          style={styles.signUpButton}
        />

        {/* Sign In Link */}
        <View style={styles.signInContainer}>
          <Text style={[styles.signInText, { color: colors.textSecondary }]}>Already have an account? </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity disabled={isLoading}>
              <Text style={[styles.signInLink, { color: colors.tint }]}>Sign In</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>

      {/* Privacy Notice */}
      <View style={[styles.privacyNotice, { borderTopColor: colors.border }]}>
        <Text style={[styles.privacyText, { color: colors.textSecondary }]}>
          🇨🇦 Your data stays in Canada and is protected under PIPEDA
        </Text>
      </View>

      {/* Modals */}
      {renderPrivacyModal()}
      {renderTermsModal()}
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
    marginBottom: 32,
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
  form: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nameInput: {
    flex: 1,
    marginRight: 8,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  dropdown: {
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  dropdownContainer: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  placeholderStyle: {
    fontSize: 16,
  },
  selectedTextStyle: {
    fontSize: 16,
  },
  consentContainer: {
    marginBottom: 16,
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  consentCheckboxContainer: {
    paddingTop: 2,
  },
  consentCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  consentTextContainer: {
    flex: 1,
  },
  consentText: {
    fontSize: 14,
    lineHeight: 20,
  },
  consentLink: {
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  optionalConsentsSection: {
    marginTop: 8,
    marginBottom: 24,
  },
  optionalConsentsTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  errorContainer: {
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    marginTop: 4,
  },
  signUpButton: {
    marginBottom: 24,
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInText: {
    fontSize: 16,
  },
  signInLink: {
    fontSize: 16,
    fontWeight: '500',
  },
  privacyNotice: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
  },
  privacyText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  modalText: {
    fontSize: 14,
    lineHeight: 20,
  },
  modalSectionTitle: {
    fontWeight: '600',
  },
});