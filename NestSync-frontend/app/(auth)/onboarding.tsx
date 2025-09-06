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
  ScrollView,
  Alert,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Dropdown } from 'react-native-element-dropdown';
import { useAuth, useUserPersona, useOnboarding } from '../../stores/authStore';
import { UserPersona } from '../../lib/types/auth';
import { NestSyncButton, NestSyncInput, NestSyncCard, WeightInput } from '@/components/ui';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import {
  ChildInfo,
  DiaperInventory,
  OnboardingData,
  GENDER_OPTIONS,
  DIAPER_SIZE_OPTIONS,
  DIAPER_TYPE_OPTIONS,
  ABSORBENCY_OPTIONS,
} from '../../lib/types/onboarding';

export default function OnboardingScreen() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
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
  
  // showDatePicker state removed - new DateTimePicker doesn't need it

  // Phase 3: Inventory State
  const [inventoryItem, setInventoryItem] = useState<DiaperInventory>({
    brandName: '',
    size: 'SIZE_1',
    quantity: 0,
    type: 'DISPOSABLE',
    absorbency: 'REGULAR',
  });

  // Notification preferences now use default values (removed from UI flow)

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
      // Save final onboarding data with essential information only
      const finalData = {
        ...onboardingData,
        childInfo,
        // Set default notification preferences for optimized flow
        notificationPreferences: {
          changeReminders: true,
          changeReminderInterval: 180, // 3 hours default
          lowInventoryAlerts: true,
          lowInventoryThreshold: 5,
          weeklyReports: true,
          monthlyReports: false, // Conservative defaults
          tipsSuggestions: true,
          marketingEmails: false, // Conservative default
        },
      };
      console.log('Onboarding completed with data:', finalData);
      await complete();
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      Alert.alert('Error', 'Failed to complete onboarding. Please try again.');
    }
  };

  const handleNextPhase = async () => {
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
      // Complete onboarding directly after inventory setup
      setOnboardingData(prev => ({ ...prev, inventory: onboardingData.inventory }));
      await handleCompleteOnboarding();
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

  const handleDateChange = (event: any, date?: Date) => {
    if (date) {
      setChildInfo(prev => ({ ...prev, birthDate: date }));
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
        <View style={styles.titleWithIcon}>
          <IconSymbol name="figure.child" size={24} color={colors.textEmphasis} />
          <Text style={[styles.title, { color: colors.textEmphasis }]}>Tell us about your little one</Text>
        </View>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          This helps us personalize your diaper tracking experience.
        </Text>
      </View>

      <View style={styles.formContainer}>
        <NestSyncInput
          label="Child's Name"
          required={true}
          value={childInfo.name}
          onChangeText={(text) => setChildInfo(prev => ({ ...prev, name: text }))}
          placeholder="Enter your child's name"
          autoCapitalize="words"
          error={!childInfo.name.trim() && childInfo.name.length > 0 ? "Child's name is required" : undefined}
          containerStyle={styles.inputGroup}
        />

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textEmphasis }]}>Date of Birth *</Text>
          <View style={[styles.datePickerContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {Platform.OS === 'web' ? (
              <View style={[styles.webDateInput, { borderColor: colors.border }]}>
                <input
                  type="date"
                  value={childInfo.birthDate.toISOString().split('T')[0]}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => handleDateChange(null, new Date(e.target.value))}
                  style={{
                    border: 'none',
                    outline: 'none',
                    backgroundColor: colors.surface,
                    color: colors.text,
                    fontSize: 16,
                    padding: 8,
                    width: '100%',
                  }}
                />
              </View>
            ) : (
              <DateTimePicker
                mode="date"
                value={childInfo.birthDate}
                onChange={handleDateChange}
                maximumDate={new Date()}
                display={Platform.OS === 'ios' ? 'compact' : 'default'}
                style={{ backgroundColor: colors.surface }}
                themeVariant={colorScheme === 'dark' ? 'dark' : 'light'}
              />
            )}
          </View>
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

        <WeightInput
          label="Current Weight (optional)"
          value={childInfo.currentWeight}
          onValueChange={(grams) => setChildInfo(prev => ({ 
            ...prev, 
            currentWeight: grams > 0 ? grams : undefined 
          }))}
          containerStyle={styles.inputGroup}
          helpText="This helps us personalize growth tracking"
          allowEmpty={true}
          validateRange={true}
        />

        <NestSyncInput
          label="Notes (optional)"
          value={childInfo.notes}
          onChangeText={(text) => setChildInfo(prev => ({ ...prev, notes: text }))}
          placeholder="Any additional notes about your child"
          multiline={true}
          numberOfLines={3}
          containerStyle={styles.inputGroup}
          inputStyle={{ height: 80, textAlignVertical: 'top' }}
        />
      </View>

      <View style={styles.navigationButtons}>
        <NestSyncButton
          title="Back"
          onPress={handlePreviousPhase}
          variant="ghost"
          style={styles.backButton}
        />
        <NestSyncButton
          title="Next"
          onPress={handleNextPhase}
          variant="primary"
          disabled={!childInfo.name.trim()}
          style={styles.nextButton}
        />
      </View>
    </View>
  );

  // Phase 3: Current Inventory Setup
  const renderInventorySetup = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleWithIcon}>
          <IconSymbol name="shippingbox.fill" size={24} color={colors.textEmphasis} />
          <Text style={[styles.title, { color: colors.textEmphasis }]}>Current Diaper Inventory</Text>
        </View>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Add your current diaper stock so we can track usage and send low-stock alerts.
        </Text>
      </View>

      <View style={styles.formContainer}>
        <Text style={[styles.sectionTitle, { color: colors.textEmphasis }]}>Add New Inventory Item</Text>
        
        <NestSyncInput
          label="Brand Name"
          required={true}
          value={inventoryItem.brandName}
          onChangeText={(text) => setInventoryItem(prev => ({ ...prev, brandName: text }))}
          placeholder="e.g., Pampers, Huggies"
          autoCapitalize="words"
          error={!inventoryItem.brandName.trim() && inventoryItem.brandName.length > 0 ? "Brand name is required" : undefined}
          containerStyle={styles.inputGroup}
        />

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

          <View style={styles.halfWidth}>
            <NestSyncInput
              label="Quantity"
              required={true}
              value={inventoryItem.quantity?.toString() || ''}
              onChangeText={(text) => setInventoryItem(prev => ({ 
                ...prev, 
                quantity: text ? parseInt(text, 10) : 0 
              }))}
              placeholder="0"
              keyboardType="numeric"
              error={inventoryItem.quantity <= 0 && inventoryItem.quantity !== undefined ? "Quantity must be greater than 0" : undefined}
              containerStyle={styles.inputGroup}
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

        <NestSyncButton
          title="Add Item"
          onPress={handleAddInventoryItem}
          variant="secondary"
          disabled={!inventoryItem.brandName.trim() || inventoryItem.quantity <= 0}
          style={styles.addButton}
        />

        {onboardingData.inventory.length > 0 && (
          <View style={styles.inventoryList}>
            <Text style={[styles.sectionTitle, { color: colors.textEmphasis }]}>Current Inventory ({onboardingData.inventory.length} items)</Text>
            {onboardingData.inventory.map((item, index) => (
              <View key={index} style={styles.inventoryItem}>
                <View style={styles.inventoryItemInfo}>
                  <Text style={[styles.inventoryItemTitle, { color: colors.textEmphasis }]}>{item.brandName} - Size {item.size.replace('SIZE_', '')}</Text>
                  <Text style={[styles.inventoryItemDetails, { color: colors.textSecondary }]}>
                    Quantity: {item.quantity} | Type: {item.type} | {item.absorbency}
                  </Text>
                </View>
                <NestSyncButton
                  title="Remove"
                  onPress={() => handleRemoveInventoryItem(index)}
                  variant="danger"
                  size="small"
                  style={styles.removeButton}
                />
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.navigationButtons}>
        <NestSyncButton
          title="Back"
          onPress={handlePreviousPhase}
          variant="ghost"
          style={styles.backButton}
        />
        <NestSyncButton
          title={onboardingData.inventory.length > 0 ? 'Complete Setup' : 'Complete Setup'}
          onPress={handleNextPhase}
          variant="primary"
          style={styles.nextButton}
        />
      </View>
    </View>
  );


  // Phase 1: Persona Selection
  const renderPersonaSelection = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleWithIcon}>
          <IconSymbol name="figure.child" size={24} color={colors.textEmphasis} />
          <Text style={[styles.title, { color: colors.textEmphasis }]}>Welcome to NestSync!</Text>
        </View>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Let's personalize your experience. Which describes you best?
        </Text>
      </View>

      <View style={styles.personaContainer}>
        {/* Sarah - Overwhelmed New Mom */}
        <NestSyncCard
          variant={selectedPersona === UserPersona.OVERWHELMED_NEW_MOM ? "outlined" : "elevated"}
          padding="large"
          style={[
            styles.personaCard,
            selectedPersona === UserPersona.OVERWHELMED_NEW_MOM && {
              borderColor: colors.tint,
              backgroundColor: colors.surface,
            }
          ]}
          onPress={() => handlePersonaSelection(UserPersona.OVERWHELMED_NEW_MOM)}
          testID="persona-overwhelmed-mom"
        >
          <IconSymbol name="moon.zzz" size={48} color={colors.textEmphasis} style={styles.personaIcon} />
          <Text style={[styles.personaTitle, { color: colors.textEmphasis }]}>New & Overwhelmed</Text>
          <Text style={[styles.personaDescription, { color: colors.textSecondary }]}>
            "I'm new to parenting and just want simple, helpful guidance without complexity."
          </Text>
          <View style={styles.personaFeatures}>
            <Text style={[styles.personaFeature, { color: colors.text }]}>• Quick 2-minute setup</Text>
            <Text style={[styles.personaFeature, { color: colors.text }]}>• Simple, clean interface</Text>
            <Text style={[styles.personaFeature, { color: colors.text }]}>• Essential notifications only</Text>
          </View>
        </NestSyncCard>

        {/* Mike - Efficiency Dad */}
        <NestSyncCard
          variant={selectedPersona === UserPersona.EFFICIENCY_DAD ? "outlined" : "elevated"}
          padding="large"
          style={[
            styles.personaCard,
            selectedPersona === UserPersona.EFFICIENCY_DAD && {
              borderColor: colors.tint,
              backgroundColor: colors.surface,
            }
          ]}
          onPress={() => handlePersonaSelection(UserPersona.EFFICIENCY_DAD)}
          testID="persona-efficiency-dad"
        >
          <IconSymbol name="bolt.fill" size={48} color={colors.textEmphasis} style={styles.personaIcon} />
          <Text style={[styles.personaTitle, { color: colors.textEmphasis }]}>Organized & Detailed</Text>
          <Text style={[styles.personaDescription, { color: colors.textSecondary }]}>
            "I love detailed data and want full control over settings and features."
          </Text>
          <View style={styles.personaFeatures}>
            <Text style={[styles.personaFeature, { color: colors.text }]}>• Comprehensive setup</Text>
            <Text style={[styles.personaFeature, { color: colors.text }]}>• Advanced features</Text>
            <Text style={[styles.personaFeature, { color: colors.text }]}>• Detailed analytics</Text>
          </View>
        </NestSyncCard>
      </View>

      <View style={styles.footer}>
        <NestSyncButton
          title="Skip for now"
          onPress={handleSkipOnboarding}
          variant="ghost"
          disabled={isLoading}
          style={styles.skipButton}
        />
      </View>
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
    default:
      currentPhaseRenderer = renderInventorySetup();
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
  personaIcon: {
    marginBottom: 12,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
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
  datePickerContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: Platform.OS === 'ios' ? 8 : Platform.OS === 'web' ? 0 : 16,
    marginTop: 8,
    alignItems: Platform.OS === 'ios' ? 'flex-start' : 'center',
    minHeight: Platform.OS === 'ios' ? 50 : Platform.OS === 'web' ? 50 : 200,
  },
  webDateInput: {
    borderRadius: 8,
    overflow: 'hidden',
    width: '100%',
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
});