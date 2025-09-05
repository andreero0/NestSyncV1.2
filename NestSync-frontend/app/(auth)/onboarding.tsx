/**
 * Onboarding Screen
 * Persona-optimized onboarding for NestSync users
 * Supports quick flow for Sarah and comprehensive flow for Mike
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Dropdown } from 'react-native-element-dropdown';
import { useAuthStore, useUserPersona, useOnboarding } from '../../stores/authStore';
import { UserPersona } from '../../lib/types/auth';
import { NestSyncButton, NestSyncInput } from '@/components/ui';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import {
  ChildInfo,
  DiaperInventory,
  NotificationPreferences,
  OnboardingData,
  GENDER_OPTIONS,
  DIAPER_SIZE_OPTIONS,
  DIAPER_TYPE_OPTIONS,
  ABSORBENCY_OPTIONS,
} from '../../lib/types/onboarding';

export default function OnboardingScreen() {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();
  const { persona, preferences, updatePreferences } = useUserPersona();
  const { step, setStep, complete } = useOnboarding();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [selectedPersona, setSelectedPersona] = useState<UserPersona | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    childInfo: null,
    inventory: [],
    notificationPreferences: null,
    currentPhase: 0,
  });

  // Phase 2: Child Information State
  const [childInfo, setChildInfo] = useState<ChildInfo>({
    name: '',
    birthDate: new Date(),
    gender: 'PREFER_NOT_TO_SAY',
    currentWeight: undefined,
    notes: '',
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Phase 3: Inventory State
  const [inventoryItem, setInventoryItem] = useState<DiaperInventory>({
    brandName: '',
    size: 'SIZE_1',
    quantity: 0,
    type: 'DISPOSABLE',
    absorbency: 'REGULAR',
  });

  // Phase 4: Notification Preferences State
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
    changeReminders: true,
    changeReminderInterval: 180, // 3 hours
    lowInventoryAlerts: true,
    lowInventoryThreshold: 5,
    weeklyReports: true,
    monthlyReports: true,
    tipsSuggestions: true,
    marketingEmails: false,
  });

  useEffect(() => {
    // If user already completed onboarding, redirect to main app
    if (user?.onboardingCompleted) {
      router.replace('/(tabs)');
    }
  }, [user]);

  const handlePersonaSelection = async (personaType: UserPersona) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSelectedPersona(personaType);
      
      // Update persona preferences
      if (personaType === UserPersona.OVERWHELMED_NEW_MOM) {
        await updatePreferences({
          persona: personaType,
          onboardingFlow: 'QUICK',
          uiComplexity: 'SIMPLE',
          notificationFrequency: 'MINIMAL',
        });
      } else {
        await updatePreferences({
          persona: personaType,
          onboardingFlow: 'COMPREHENSIVE',
          uiComplexity: 'DETAILED',
          notificationFrequency: 'DETAILED',
        });
      }

      // Move to next step (Phase 2: Child Information)
      setCurrentStep(1);
      setStep(1);
      setOnboardingData(prev => ({ ...prev, currentPhase: 1 }));
    } catch (error) {
      console.error('Error updating persona preferences:', error);
      Alert.alert('Error', 'Failed to save preferences. Please try again.');
    }
  };

  const handleCompleteOnboarding = async () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Save final onboarding data
      const finalData = {
        ...onboardingData,
        childInfo,
        notificationPreferences: notificationPrefs,
      };
      console.log('Onboarding completed with data:', finalData);
      await complete();
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      Alert.alert('Error', 'Failed to complete onboarding. Please try again.');
    }
  };

  const handleNextPhase = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (currentStep === 1) {
      // Validate child information
      if (!childInfo.name.trim()) {
        Alert.alert('Required Field', 'Please enter your child\'s name.');
        return;
      }
      setOnboardingData(prev => ({ ...prev, childInfo }));
      setCurrentStep(2);
      setStep(2);
    } else if (currentStep === 2) {
      // Move to notification preferences
      setOnboardingData(prev => ({ ...prev, inventory: onboardingData.inventory }));
      setCurrentStep(3);
      setStep(3);
    } else if (currentStep === 3) {
      // Move to final completion screen
      setOnboardingData(prev => ({ ...prev, notificationPreferences: notificationPrefs }));
      setCurrentStep(4);
      setStep(4);
    }
  };

  const handlePreviousPhase = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setStep(currentStep - 1);
    }
  };

  const handleAddInventoryItem = () => {
    if (!inventoryItem.brandName.trim() || inventoryItem.quantity <= 0) {
      Alert.alert('Required Fields', 'Please enter brand name and quantity.');
      return;
    }

    const newItem = { ...inventoryItem };
    setOnboardingData(prev => ({
      ...prev,
      inventory: [...prev.inventory, newItem],
    }));

    // Reset form
    setInventoryItem({
      brandName: '',
      size: 'SIZE_1',
      quantity: 0,
      type: 'DISPOSABLE',
      absorbency: 'REGULAR',
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleRemoveInventoryItem = (index: number) => {
    setOnboardingData(prev => ({
      ...prev,
      inventory: prev.inventory.filter((_, i) => i !== index),
    }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setChildInfo(prev => ({ ...prev, birthDate: selectedDate }));
    }
  };

  const handleSkipOnboarding = () => {
    Alert.alert(
      'Skip Onboarding?',
      'You can always customize your experience later in Settings.',
      [
        { text: 'Continue Setup', style: 'cancel' },
        { 
          text: 'Skip', 
          style: 'destructive', 
          onPress: handleCompleteOnboarding 
        },
      ]
    );
  };

  // Phase 2: Child Information Setup
  const renderChildInformationSetup = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tell us about your little one 👶</Text>
        <Text style={styles.subtitle}>
          This helps us personalize your diaper tracking experience.
        </Text>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Child's Name *</Text>
          <TextInput
            style={[styles.textInput, !childInfo.name.trim() && styles.inputError]}
            value={childInfo.name}
            onChangeText={(text) => setChildInfo(prev => ({ ...prev, name: text }))}
            placeholder="Enter your child's name"
            autoCapitalize="words"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Date of Birth *</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateButtonText}>
              {childInfo.birthDate.toLocaleDateString()}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={childInfo.birthDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Gender</Text>
          <Dropdown
            style={styles.dropdown}
            placeholderStyle={styles.placeholderStyle}
            selectedTextStyle={styles.selectedTextStyle}
            data={GENDER_OPTIONS}
            maxHeight={300}
            labelField="label"
            valueField="value"
            placeholder="Select gender"
            value={childInfo.gender}
            onChange={(item) => setChildInfo(prev => ({ ...prev, gender: item.value as any }))}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Current Weight (optional)</Text>
          <TextInput
            style={styles.textInput}
            value={childInfo.currentWeight?.toString() || ''}
            onChangeText={(text) => setChildInfo(prev => ({ 
              ...prev, 
              currentWeight: text ? parseInt(text, 10) : undefined 
            }))}
            placeholder="Weight in grams"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Notes (optional)</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={childInfo.notes}
            onChangeText={(text) => setChildInfo(prev => ({ ...prev, notes: text }))}
            placeholder="Any additional notes about your child"
            multiline
            numberOfLines={3}
          />
        </View>
      </View>

      <View style={styles.navigationButtons}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handlePreviousPhase}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.nextButton, !childInfo.name.trim() && styles.buttonDisabled]}
          onPress={handleNextPhase}
          disabled={!childInfo.name.trim()}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Phase 3: Current Inventory Setup
  const renderInventorySetup = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Current Diaper Inventory 📦</Text>
        <Text style={styles.subtitle}>
          Add your current diaper stock so we can track usage and send low-stock alerts.
        </Text>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.sectionTitle}>Add New Inventory Item</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Brand Name *</Text>
          <TextInput
            style={styles.textInput}
            value={inventoryItem.brandName}
            onChangeText={(text) => setInventoryItem(prev => ({ ...prev, brandName: text }))}
            placeholder="e.g., Pampers, Huggies"
            autoCapitalize="words"
          />
        </View>

        <View style={styles.rowContainer}>
          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.label}>Size</Text>
            <Dropdown
              style={styles.dropdown}
              placeholderStyle={styles.placeholderStyle}
              selectedTextStyle={styles.selectedTextStyle}
              data={DIAPER_SIZE_OPTIONS}
              maxHeight={300}
              labelField="label"
              valueField="value"
              value={inventoryItem.size}
              onChange={(item) => setInventoryItem(prev => ({ ...prev, size: item.value as any }))}
            />
          </View>

          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.label}>Quantity *</Text>
            <TextInput
              style={styles.textInput}
              value={inventoryItem.quantity?.toString() || ''}
              onChangeText={(text) => setInventoryItem(prev => ({ 
                ...prev, 
                quantity: text ? parseInt(text, 10) : 0 
              }))}
              placeholder="0"
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.rowContainer}>
          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.label}>Type</Text>
            <Dropdown
              style={styles.dropdown}
              placeholderStyle={styles.placeholderStyle}
              selectedTextStyle={styles.selectedTextStyle}
              data={DIAPER_TYPE_OPTIONS}
              maxHeight={300}
              labelField="label"
              valueField="value"
              value={inventoryItem.type}
              onChange={(item) => setInventoryItem(prev => ({ ...prev, type: item.value as any }))}
            />
          </View>

          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.label}>Absorbency</Text>
            <Dropdown
              style={styles.dropdown}
              placeholderStyle={styles.placeholderStyle}
              selectedTextStyle={styles.selectedTextStyle}
              data={ABSORBENCY_OPTIONS}
              maxHeight={300}
              labelField="label"
              valueField="value"
              value={inventoryItem.absorbency}
              onChange={(item) => setInventoryItem(prev => ({ ...prev, absorbency: item.value as any }))}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.addButton, (!inventoryItem.brandName.trim() || inventoryItem.quantity <= 0) && styles.buttonDisabled]}
          onPress={handleAddInventoryItem}
          disabled={!inventoryItem.brandName.trim() || inventoryItem.quantity <= 0}
        >
          <Text style={styles.addButtonText}>Add Item</Text>
        </TouchableOpacity>

        {onboardingData.inventory.length > 0 && (
          <View style={styles.inventoryList}>
            <Text style={styles.sectionTitle}>Current Inventory ({onboardingData.inventory.length} items)</Text>
            {onboardingData.inventory.map((item, index) => (
              <View key={index} style={styles.inventoryItem}>
                <View style={styles.inventoryItemInfo}>
                  <Text style={styles.inventoryItemTitle}>{item.brandName} - Size {item.size.replace('SIZE_', '')}</Text>
                  <Text style={styles.inventoryItemDetails}>
                    Quantity: {item.quantity} | Type: {item.type} | {item.absorbency}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveInventoryItem(index)}
                >
                  <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.navigationButtons}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handlePreviousPhase}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNextPhase}
        >
          <Text style={styles.nextButtonText}>
            {onboardingData.inventory.length > 0 ? 'Next' : 'Skip for now'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Phase 4: Notification Preferences
  const renderNotificationPreferences = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notification Preferences 🔔</Text>
        <Text style={styles.subtitle}>
          Customize how and when you'd like to receive notifications.
        </Text>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.preferenceSection}>
          <Text style={styles.sectionTitle}>Diaper Change Reminders</Text>
          
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Enable change reminders</Text>
            <Switch
              value={notificationPrefs.changeReminders}
              onValueChange={(value) => setNotificationPrefs(prev => ({ ...prev, changeReminders: value }))}
              trackColor={{ false: '#E5E7EB', true: '#6366F1' }}
              thumbColor={notificationPrefs.changeReminders ? '#FFFFFF' : '#9CA3AF'}
            />
          </View>

          {notificationPrefs.changeReminders && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Reminder Interval (minutes)</Text>
              <TextInput
                style={styles.textInput}
                value={notificationPrefs.changeReminderInterval.toString()}
                onChangeText={(text) => setNotificationPrefs(prev => ({ 
                  ...prev, 
                  changeReminderInterval: parseInt(text, 10) || 180 
                }))}
                keyboardType="numeric"
                placeholder="180"
              />
            </View>
          )}
        </View>

        <View style={styles.preferenceSection}>
          <Text style={styles.sectionTitle}>Inventory Alerts</Text>
          
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Low inventory alerts</Text>
            <Switch
              value={notificationPrefs.lowInventoryAlerts}
              onValueChange={(value) => setNotificationPrefs(prev => ({ ...prev, lowInventoryAlerts: value }))}
              trackColor={{ false: '#E5E7EB', true: '#6366F1' }}
              thumbColor={notificationPrefs.lowInventoryAlerts ? '#FFFFFF' : '#9CA3AF'}
            />
          </View>

          {notificationPrefs.lowInventoryAlerts && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Alert when quantity below</Text>
              <TextInput
                style={styles.textInput}
                value={notificationPrefs.lowInventoryThreshold.toString()}
                onChangeText={(text) => setNotificationPrefs(prev => ({ 
                  ...prev, 
                  lowInventoryThreshold: parseInt(text, 10) || 5 
                }))}
                keyboardType="numeric"
                placeholder="5"
              />
            </View>
          )}
        </View>

        <View style={styles.preferenceSection}>
          <Text style={styles.sectionTitle}>Reports & Insights</Text>
          
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Weekly summary reports</Text>
            <Switch
              value={notificationPrefs.weeklyReports}
              onValueChange={(value) => setNotificationPrefs(prev => ({ ...prev, weeklyReports: value }))}
              trackColor={{ false: '#E5E7EB', true: '#6366F1' }}
              thumbColor={notificationPrefs.weeklyReports ? '#FFFFFF' : '#9CA3AF'}
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Monthly analytics reports</Text>
            <Switch
              value={notificationPrefs.monthlyReports}
              onValueChange={(value) => setNotificationPrefs(prev => ({ ...prev, monthlyReports: value }))}
              trackColor={{ false: '#E5E7EB', true: '#6366F1' }}
              thumbColor={notificationPrefs.monthlyReports ? '#FFFFFF' : '#9CA3AF'}
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Tips and suggestions</Text>
            <Switch
              value={notificationPrefs.tipsSuggestions}
              onValueChange={(value) => setNotificationPrefs(prev => ({ ...prev, tipsSuggestions: value }))}
              trackColor={{ false: '#E5E7EB', true: '#6366F1' }}
              thumbColor={notificationPrefs.tipsSuggestions ? '#FFFFFF' : '#9CA3AF'}
            />
          </View>
        </View>

        <View style={styles.preferenceSection}>
          <Text style={styles.sectionTitle}>Marketing & Promotions</Text>
          
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Marketing emails and offers</Text>
            <Switch
              value={notificationPrefs.marketingEmails}
              onValueChange={(value) => setNotificationPrefs(prev => ({ ...prev, marketingEmails: value }))}
              trackColor={{ false: '#E5E7EB', true: '#6366F1' }}
              thumbColor={notificationPrefs.marketingEmails ? '#FFFFFF' : '#9CA3AF'}
            />
          </View>
        </View>
      </View>

      <View style={styles.navigationButtons}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handlePreviousPhase}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNextPhase}
        >
          <Text style={styles.nextButtonText}>Finish Setup</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Phase 1: Persona Selection
  const renderPersonaSelection = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome to NestSync! 👶</Text>
        <Text style={styles.subtitle}>
          Let's personalize your experience. Which describes you best?
        </Text>
      </View>

      <View style={styles.personaContainer}>
        {/* Sarah - Overwhelmed New Mom */}
        <TouchableOpacity
          style={[
            styles.personaCard,
            selectedPersona === UserPersona.OVERWHELMED_NEW_MOM && styles.personaCardSelected
          ]}
          onPress={() => handlePersonaSelection(UserPersona.OVERWHELMED_NEW_MOM)}
          disabled={isLoading}
        >
          <Text style={styles.personaEmoji}>😴</Text>
          <Text style={styles.personaTitle}>New & Overwhelmed</Text>
          <Text style={styles.personaDescription}>
            "I'm new to parenting and just want simple, helpful guidance without complexity."
          </Text>
          <View style={styles.personaFeatures}>
            <Text style={styles.personaFeature}>• Quick 2-minute setup</Text>
            <Text style={styles.personaFeature}>• Simple, clean interface</Text>
            <Text style={styles.personaFeature}>• Essential notifications only</Text>
          </View>
        </TouchableOpacity>

        {/* Mike - Efficiency Dad */}
        <TouchableOpacity
          style={[
            styles.personaCard,
            selectedPersona === UserPersona.EFFICIENCY_DAD && styles.personaCardSelected
          ]}
          onPress={() => handlePersonaSelection(UserPersona.EFFICIENCY_DAD)}
          disabled={isLoading}
        >
          <Text style={styles.personaEmoji}>⚡</Text>
          <Text style={styles.personaTitle}>Organized & Detailed</Text>
          <Text style={styles.personaDescription}>
            "I love detailed data and want full control over settings and features."
          </Text>
          <View style={styles.personaFeatures}>
            <Text style={styles.personaFeature}>• Comprehensive setup</Text>
            <Text style={styles.personaFeature}>• Advanced features</Text>
            <Text style={styles.personaFeature}>• Detailed analytics</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkipOnboarding}
          disabled={isLoading}
        >
          <Text style={styles.skipButtonText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderWelcomeComplete = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>You're all set! 🎉</Text>
        <Text style={styles.subtitle}>
          {selectedPersona === UserPersona.OVERWHELMED_NEW_MOM
            ? "We've optimized NestSync for a simple, stress-free experience."
            : "You'll have access to all the detailed features and analytics you love."}
        </Text>
      </View>

      <View style={styles.welcomeContent}>
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeCardTitle}>What's Next:</Text>
          <Text style={styles.welcomeCardItem}>• Add your child's information</Text>
          <Text style={styles.welcomeCardItem}>• Set up your current diaper inventory</Text>
          <Text style={styles.welcomeCardItem}>• Start logging diaper changes</Text>
          {selectedPersona === UserPersona.EFFICIENCY_DAD && (
            <>
              <Text style={styles.welcomeCardItem}>• Explore advanced analytics</Text>
              <Text style={styles.welcomeCardItem}>• Configure detailed notifications</Text>
            </>
          )}
        </View>

        <View style={styles.privacyCard}>
          <Text style={styles.privacyTitle}>🇨🇦 Your Privacy is Protected</Text>
          <Text style={styles.privacyText}>
            All your data stays in Canada and is protected under PIPEDA. 
            You can update your privacy preferences anytime in Settings.
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.continueButton}
        onPress={handleCompleteOnboarding}
        disabled={isLoading}
      >
        <Text style={styles.continueButtonText}>
          {isLoading ? 'Setting up...' : 'Start Using NestSync'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  let currentPhaseRenderer;
  
  switch (currentStep) {
    case 0:
      currentPhaseRenderer = renderPersonaSelection();
      break;
    case 1:
      currentPhaseRenderer = renderChildInformationSetup();
      break;
    case 2:
      currentPhaseRenderer = renderInventorySetup();
      break;
    case 3:
      currentPhaseRenderer = renderNotificationPreferences();
      break;
    case 4:
    default:
      currentPhaseRenderer = renderWelcomeComplete();
      break;
  }

  return (
    <ScrollView style={[styles.scrollContainer, { backgroundColor: colors.background }]} contentContainerStyle={styles.scrollContent}>
      <StatusBar style="dark" />
      {currentPhaseRenderer}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
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
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  personaContainer: {
    flex: 1,
    gap: 20,
  },
  personaCard: {
    borderWidth: 2,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  personaCardSelected: {
    // Will be overridden with dynamic colors
  },
  personaEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  personaTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  personaDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  personaFeatures: {
    alignItems: 'flex-start',
  },
  personaFeature: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  footer: {
    marginTop: 32,
  },
  skipButton: {
    padding: 16,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  welcomeContent: {
    flex: 1,
    gap: 24,
  },
  welcomeCard: {
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
  },
  welcomeCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  welcomeCardItem: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  privacyCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  privacyText: {
    fontSize: 14,
    lineHeight: 20,
  },
  continueButton: {
    marginTop: 24,
  },
  formContainer: {
    flex: 1,
    paddingBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  inputError: {
    // Will be overridden with dynamic colors
  },
  dateButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dateButtonText: {
    fontSize: 16,
  },
  dropdown: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  placeholderStyle: {
    fontSize: 16,
  },
  selectedTextStyle: {
    fontSize: 16,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
    gap: 16,
  },
  backButton: {
    flex: 1,
  },
  nextButton: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  rowContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  halfWidth: {
    flex: 1,
  },
  addButton: {
    marginTop: 8,
  },
  inventoryList: {
    marginTop: 24,
  },
  inventoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  inventoryItemInfo: {
    flex: 1,
  },
  inventoryItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  inventoryItemDetails: {
    fontSize: 14,
  },
  removeButton: {
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  removeButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  preferenceSection: {
    marginBottom: 32,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  switchLabel: {
    fontSize: 16,
    flex: 1,
  },
});