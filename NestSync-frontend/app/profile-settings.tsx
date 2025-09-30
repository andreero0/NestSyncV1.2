import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery, useMutation } from '@apollo/client';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuthStore } from '@/stores/authStore';

import {
  ME_QUERY,
  UPDATE_PROFILE_MUTATION,
  MeQueryData,
  UpdateProfileMutationData,
  UpdateProfileMutationVariables,
} from '@/lib/graphql/queries';

const CANADIAN_PROVINCES = [
  { value: 'AB', label: 'Alberta' },
  { value: 'BC', label: 'British Columbia' },
  { value: 'MB', label: 'Manitoba' },
  { value: 'NB', label: 'New Brunswick' },
  { value: 'NL', label: 'Newfoundland and Labrador' },
  { value: 'NS', label: 'Nova Scotia' },
  { value: 'ON', label: 'Ontario' },
  { value: 'PE', label: 'Prince Edward Island' },
  { value: 'QC', label: 'Quebec' },
  { value: 'SK', label: 'Saskatchewan' },
  { value: 'NT', label: 'Northwest Territories' },
  { value: 'NU', label: 'Nunavut' },
  { value: 'YT', label: 'Yukon' },
];

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
];

const TIMEZONES = [
  { value: 'America/Toronto', label: 'Eastern Time' },
  { value: 'America/Winnipeg', label: 'Central Time' },
  { value: 'America/Edmonton', label: 'Mountain Time' },
  { value: 'America/Vancouver', label: 'Pacific Time' },
  { value: 'America/Halifax', label: 'Atlantic Time' },
  { value: 'America/St_Johns', label: 'Newfoundland Time' },
];

interface FormData {
  firstName: string;
  lastName: string;
  displayName: string;
  timezone: string;
  language: string;
  province: string;
}

export default function ProfileSettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { user } = useAuthStore();

  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    displayName: '',
    timezone: 'America/Toronto',
    language: 'en',
    province: '',
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Picker modal states
  const [showProvincePicker, setShowProvincePicker] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [showTimezonePicker, setShowTimezonePicker] = useState(false);

  // Fetch current user profile
  const { data, loading, error, refetch } = useQuery<MeQueryData>(ME_QUERY, {
    fetchPolicy: 'cache-first',
  });

  // Update profile mutation
  const [updateProfile] = useMutation<UpdateProfileMutationData, UpdateProfileMutationVariables>(
    UPDATE_PROFILE_MUTATION,
    {
      onCompleted: (data) => {
        if (data.updateProfile.success) {
          setHasChanges(false);
          Alert.alert(
            'Profile Updated',
            'Your profile information has been saved successfully.',
            [{ text: 'OK' }]
          );
          // Refetch user data to update UI
          refetch();
        } else {
          Alert.alert(
            'Update Failed',
            data.updateProfile.error || 'Failed to update profile. Please try again.',
            [{ text: 'OK' }]
          );
        }
      },
      onError: (error) => {
        console.error('Profile update error:', error);
        Alert.alert(
          'Error',
          'An error occurred while updating your profile. Please try again.',
          [{ text: 'OK' }]
        );
      },
    }
  );

  // Initialize form data when user data loads
  useEffect(() => {
    if (data?.me) {
      const profile = data.me;
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        displayName: profile.displayName || '',
        timezone: profile.timezone || 'America/Toronto',
        language: profile.language || 'en',
        province: profile.province || '',
      });
    }
  }, [data]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!hasChanges) {
      router.back();
      return;
    }

    setIsSubmitting(true);

    try {
      await updateProfile({
        variables: {
          input: {
            firstName: formData.firstName.trim() || undefined,
            lastName: formData.lastName.trim() || undefined,
            displayName: formData.displayName.trim() || undefined,
            timezone: formData.timezone,
            language: formData.language,
            province: formData.province || undefined,
          },
        },
      });
    } catch (error) {
      console.error('Save profile error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      Alert.alert(
        'Discard Changes',
        'You have unsaved changes. Are you sure you want to go back?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => router.back()
          }
        ]
      );
    } else {
      router.back();
    }
  };

  const getProvinceLabel = (value: string) => {
    return CANADIAN_PROVINCES.find(p => p.value === value)?.label || value;
  };

  const getLanguageLabel = (value: string) => {
    return LANGUAGES.find(l => l.value === value)?.label || value;
  };

  const getTimezoneLabel = (value: string) => {
    return TIMEZONES.find(t => t.value === value)?.label || value;
  };

  if (loading) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.tint} />
            <ThemedText style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading profile...
            </ThemedText>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  if (error) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
          <View style={styles.errorContainer}>
            <IconSymbol name="exclamationmark.triangle" size={48} color={colors.error} />
            <ThemedText style={[styles.errorTitle, { color: colors.error }]}>
              Failed to Load Profile
            </ThemedText>
            <ThemedText style={[styles.errorMessage, { color: colors.textSecondary }]}>
              {error.message}
            </ThemedText>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: colors.tint }]}
              onPress={() => refetch()}
            >
              <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        {/* Header */}
        <ThemedView style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleCancel}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <IconSymbol name="chevron.left" size={24} color={colors.tint} />
          </TouchableOpacity>

          <ThemedText type="title" style={styles.headerTitle}>
            Profile Settings
          </ThemedText>

          <TouchableOpacity
            style={[
              styles.headerButton,
              !hasChanges && styles.headerButtonDisabled,
              isSubmitting && styles.headerButtonDisabled
            ]}
            onPress={handleSave}
            disabled={!hasChanges || isSubmitting}
            accessibilityRole="button"
            accessibilityLabel="Save changes"
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={colors.tint} />
            ) : (
              <ThemedText style={[
                styles.saveButtonText,
                { color: hasChanges ? colors.tint : colors.textSecondary }
              ]}>
                Save
              </ThemedText>
            )}
          </TouchableOpacity>
        </ThemedView>

        <KeyboardAvoidingView
          style={styles.content}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Account Information */}
            <ThemedView style={styles.section}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Account Information
              </ThemedText>

              <ThemedView style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.infoRow}>
                  <IconSymbol name="envelope.fill" size={20} color={colors.textSecondary} />
                  <View style={styles.infoContent}>
                    <ThemedText style={[styles.infoLabel, { color: colors.textSecondary }]}>
                      Email Address
                    </ThemedText>
                    <ThemedText style={styles.infoValue}>
                      {data?.me?.email}
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <IconSymbol name="checkmark.shield.fill" size={20} color={colors.info} />
                  <View style={styles.infoContent}>
                    <ThemedText style={[styles.infoLabel, { color: colors.textSecondary }]}>
                      Account Status
                    </ThemedText>
                    <ThemedText style={[styles.infoValue, { color: colors.info }]}>
                      {data?.me?.emailVerified ? 'Verified' : 'Pending Verification'}
                    </ThemedText>
                  </View>
                </View>
              </ThemedView>
            </ThemedView>

            {/* Personal Information */}
            <ThemedView style={styles.section}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Personal Information
              </ThemedText>

              {/* First Name */}
              <View style={styles.inputGroup}>
                <ThemedText style={[styles.inputLabel, { color: colors.text }]}>
                  First Name
                </ThemedText>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      color: colors.text
                    }
                  ]}
                  value={formData.firstName}
                  onChangeText={(value) => handleInputChange('firstName', value)}
                  placeholder="Enter your first name"
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>

              {/* Last Name */}
              <View style={styles.inputGroup}>
                <ThemedText style={[styles.inputLabel, { color: colors.text }]}>
                  Last Name
                </ThemedText>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      color: colors.text
                    }
                  ]}
                  value={formData.lastName}
                  onChangeText={(value) => handleInputChange('lastName', value)}
                  placeholder="Enter your last name"
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>

              {/* Display Name */}
              <View style={styles.inputGroup}>
                <ThemedText style={[styles.inputLabel, { color: colors.text }]}>
                  Display Name
                </ThemedText>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      color: colors.text
                    }
                  ]}
                  value={formData.displayName}
                  onChangeText={(value) => handleInputChange('displayName', value)}
                  placeholder="How others see your name"
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
                <ThemedText style={[styles.inputHint, { color: colors.textSecondary }]}>
                  This is how your name will appear to family members you share data with.
                </ThemedText>
              </View>
            </ThemedView>

            {/* Location & Language */}
            <ThemedView style={styles.section}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Location & Language
              </ThemedText>

              {/* Province */}
              <View style={styles.inputGroup}>
                <ThemedText style={[styles.inputLabel, { color: colors.text }]}>
                  Province/Territory
                </ThemedText>
                <TouchableOpacity
                  style={[styles.pickerContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => setShowProvincePicker(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Select Province/Territory"
                >
                  <ThemedText style={[styles.pickerValue, { color: formData.province ? colors.text : colors.textSecondary }]}>
                    {formData.province ? getProvinceLabel(formData.province) : 'Select Province/Territory'}
                  </ThemedText>
                  <IconSymbol name="chevron.down" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
                <ThemedText style={[styles.inputHint, { color: colors.textSecondary }]}>
                  Required for Canadian tax compliance and regional features.
                </ThemedText>
              </View>

              {/* Language */}
              <View style={styles.inputGroup}>
                <ThemedText style={[styles.inputLabel, { color: colors.text }]}>
                  Language
                </ThemedText>
                <TouchableOpacity
                  style={[styles.pickerContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => setShowLanguagePicker(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Select Language"
                >
                  <ThemedText style={[styles.pickerValue, { color: colors.text }]}>
                    {getLanguageLabel(formData.language)}
                  </ThemedText>
                  <IconSymbol name="chevron.down" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Timezone */}
              <View style={styles.inputGroup}>
                <ThemedText style={[styles.inputLabel, { color: colors.text }]}>
                  Time Zone
                </ThemedText>
                <TouchableOpacity
                  style={[styles.pickerContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => setShowTimezonePicker(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Select Time Zone"
                >
                  <ThemedText style={[styles.pickerValue, { color: colors.text }]}>
                    {getTimezoneLabel(formData.timezone)}
                  </ThemedText>
                  <IconSymbol name="chevron.down" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
                <ThemedText style={[styles.inputHint, { color: colors.textSecondary }]}>
                  Used for scheduling notifications and displaying times correctly.
                </ThemedText>
              </View>
            </ThemedView>

            {/* Privacy Notice */}
            <ThemedView style={[styles.privacyNotice, { backgroundColor: colors.surface, borderColor: colors.info }]}>
              <IconSymbol name="checkmark.shield.fill" size={24} color={colors.info} />
              <View style={styles.privacyContent}>
                <ThemedText type="defaultSemiBold" style={[styles.privacyTitle, { color: colors.info }]}>
                  Canadian Privacy Protection
                </ThemedText>
                <ThemedText style={[styles.privacyDescription, { color: colors.textSecondary }]}>
                  Your personal information is stored securely in Canada and protected under PIPEDA regulations.
                  You can update, export, or delete your data at any time from Settings.
                </ThemedText>
              </View>
            </ThemedView>

            {/* Bottom spacing for keyboard */}
            <View style={{ height: 60 }} />
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Province Picker Modal */}
        <Modal
          visible={showProvincePicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowProvincePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.pickerModal, { backgroundColor: colors.background }]}>
              <View style={styles.pickerHeader}>
                <TouchableOpacity onPress={() => setShowProvincePicker(false)}>
                  <ThemedText style={[styles.pickerHeaderButton, { color: colors.textSecondary }]}>
                    Cancel
                  </ThemedText>
                </TouchableOpacity>
                <ThemedText style={[styles.pickerHeaderTitle, { color: colors.text }]}>
                  Select Province/Territory
                </ThemedText>
                <TouchableOpacity onPress={() => setShowProvincePicker(false)}>
                  <ThemedText style={[styles.pickerHeaderButton, { color: colors.tint }]}>
                    Done
                  </ThemedText>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.pickerOptions}>
                {CANADIAN_PROVINCES.map((province) => (
                  <TouchableOpacity
                    key={province.value}
                    style={[
                      styles.pickerOption,
                      { backgroundColor: colors.surface, borderColor: colors.border }
                    ]}
                    onPress={() => {
                      handleInputChange('province', province.value);
                      setShowProvincePicker(false);
                    }}
                  >
                    <ThemedText style={[
                      styles.pickerOptionText,
                      { color: formData.province === province.value ? colors.tint : colors.text }
                    ]}>
                      {province.label}
                    </ThemedText>
                    {formData.province === province.value && (
                      <IconSymbol name="checkmark" size={20} color={colors.tint} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Language Picker Modal */}
        <Modal
          visible={showLanguagePicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowLanguagePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.pickerModal, { backgroundColor: colors.background }]}>
              <View style={styles.pickerHeader}>
                <TouchableOpacity onPress={() => setShowLanguagePicker(false)}>
                  <ThemedText style={[styles.pickerHeaderButton, { color: colors.textSecondary }]}>
                    Cancel
                  </ThemedText>
                </TouchableOpacity>
                <ThemedText style={[styles.pickerHeaderTitle, { color: colors.text }]}>
                  Select Language
                </ThemedText>
                <TouchableOpacity onPress={() => setShowLanguagePicker(false)}>
                  <ThemedText style={[styles.pickerHeaderButton, { color: colors.tint }]}>
                    Done
                  </ThemedText>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.pickerOptions}>
                {LANGUAGES.map((language) => (
                  <TouchableOpacity
                    key={language.value}
                    style={[
                      styles.pickerOption,
                      { backgroundColor: colors.surface, borderColor: colors.border }
                    ]}
                    onPress={() => {
                      handleInputChange('language', language.value);
                      setShowLanguagePicker(false);
                    }}
                  >
                    <ThemedText style={[
                      styles.pickerOptionText,
                      { color: formData.language === language.value ? colors.tint : colors.text }
                    ]}>
                      {language.label}
                    </ThemedText>
                    {formData.language === language.value && (
                      <IconSymbol name="checkmark" size={20} color={colors.tint} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Timezone Picker Modal */}
        <Modal
          visible={showTimezonePicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowTimezonePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.pickerModal, { backgroundColor: colors.background }]}>
              <View style={styles.pickerHeader}>
                <TouchableOpacity onPress={() => setShowTimezonePicker(false)}>
                  <ThemedText style={[styles.pickerHeaderButton, { color: colors.textSecondary }]}>
                    Cancel
                  </ThemedText>
                </TouchableOpacity>
                <ThemedText style={[styles.pickerHeaderTitle, { color: colors.text }]}>
                  Select Time Zone
                </ThemedText>
                <TouchableOpacity onPress={() => setShowTimezonePicker(false)}>
                  <ThemedText style={[styles.pickerHeaderButton, { color: colors.tint }]}>
                    Done
                  </ThemedText>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.pickerOptions}>
                {TIMEZONES.map((timezone) => (
                  <TouchableOpacity
                    key={timezone.value}
                    style={[
                      styles.pickerOption,
                      { backgroundColor: colors.surface, borderColor: colors.border }
                    ]}
                    onPress={() => {
                      handleInputChange('timezone', timezone.value);
                      setShowTimezonePicker(false);
                    }}
                  >
                    <ThemedText style={[
                      styles.pickerOptionText,
                      { color: formData.timezone === timezone.value ? colors.tint : colors.text }
                    ]}>
                      {timezone.label}
                    </ThemedText>
                    {formData.timezone === timezone.value && (
                      <IconSymbol name="checkmark" size={20} color={colors.tint} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerButton: {
    padding: 8,
    minWidth: 60,
  },
  headerButtonDisabled: {
    opacity: 0.5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  infoCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  inputHint: {
    fontSize: 14,
    marginTop: 6,
    lineHeight: 18,
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pickerValue: {
    fontSize: 16,
    flex: 1,
  },
  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 20,
    gap: 12,
  },
  privacyContent: {
    flex: 1,
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  privacyDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Picker modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerModal: {
    maxHeight: '60%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 40,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  pickerHeaderButton: {
    fontSize: 16,
    fontWeight: '500',
    minWidth: 60,
  },
  pickerHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  pickerOptions: {
    maxHeight: 300,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  pickerOptionText: {
    fontSize: 16,
    flex: 1,
  },
});