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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Dropdown } from 'react-native-element-dropdown';
import { useMutation, ApolloError } from '@apollo/client';
import { ensureValidToken } from '../../lib/graphql/client';
import { useAuth, useUserPersona, useOnboarding } from '../../stores/authStore';
import { UserPersona } from '../../lib/types/auth';
import { NestSyncButton, NestSyncInput, NestSyncCard, WeightInput } from '@/components/ui';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import { CREATE_CHILD_MUTATION, SET_INITIAL_INVENTORY_MUTATION, COMPLETE_ONBOARDING_MUTATION } from '../../lib/graphql/mutations';
import { MY_CHILDREN_QUERY } from '../../lib/graphql/queries';
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
  const searchParams = useLocalSearchParams();
  const { user, isLoading } = useAuth();
  const { persona, preferences, updatePreferences } = useUserPersona();
  const { step, setStep, complete } = useOnboarding();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme as keyof typeof Colors ?? 'light'];

  // GraphQL mutations with cache updates
  const [createChild, { loading: createChildLoading, error: createChildError }] = useMutation(CREATE_CHILD_MUTATION, {
    // CRITICAL: Update MY_CHILDREN_QUERY cache when child is created
    update(cache, { data }) {
      if (data?.createChild?.success && data.createChild.child) {
        try {
          // Read the current MY_CHILDREN_QUERY from cache
          const existingData = cache.readQuery<any>({
            query: MY_CHILDREN_QUERY,
            variables: { first: 10 }
          });

          if (existingData?.myChildren) {
            // Add the new child to the existing children list
            cache.writeQuery({
              query: MY_CHILDREN_QUERY,
              variables: { first: 10 },
              data: {
                myChildren: {
                  ...existingData.myChildren,
                  edges: [...existingData.myChildren.edges, {
                    node: data.createChild.child,
                    cursor: data.createChild.child.id,
                    __typename: 'ChildEdge'
                  }],
                  pageInfo: {
                    ...existingData.myChildren.pageInfo,
                    totalCount: (existingData.myChildren.pageInfo?.totalCount || 0) + 1
                  }
                }
              }
            });
            if (__DEV__) {
              console.log('Successfully updated MY_CHILDREN_QUERY cache');
            }
          }
        } catch (cacheError) {
          if (__DEV__) {
            console.log('MY_CHILDREN_QUERY not in cache yet, will be fetched on dashboard load');
          }
        }
      }
    },
    // Force refetch of MY_CHILDREN_QUERY after successful mutation
    refetchQueries: [
      {
        query: MY_CHILDREN_QUERY,
        variables: { first: 10 }
      }
    ],
    awaitRefetchQueries: true
  });
  const [setInitialInventory, { loading: setInventoryLoading, error: setInventoryError }] = useMutation(SET_INITIAL_INVENTORY_MUTATION);
  const [completeOnboarding, { loading: completeOnboardingLoading, error: completeOnboardingError }] = useMutation(COMPLETE_ONBOARDING_MUTATION);

  const [selectedPersona, setSelectedPersona] = useState<UserPersona | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
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

  // Check for development bypass parameter
  const isDevelopmentBypass = searchParams['dev-bypass'] === 'true' && __DEV__;

  useEffect(() => {
    // If user already completed onboarding, redirect to main app
    // UNLESS we're in development bypass mode
    if (user?.onboardingCompleted && !isDevelopmentBypass) {
      router.replace('/(tabs)');
    }
  }, [user, isDevelopmentBypass]);

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
      if (__DEV__) {
        console.error('Error updating persona preferences:', error);
      }
      Alert.alert('Error', 'Failed to save preferences. Please try again.');
    }
  };

  // Validation functions
  const validateChildInfo = (): string[] => {
    const errors: string[] = [];
    
    if (!childInfo.name?.trim()) {
      errors.push("Child's name is required");
    }
    
    if (childInfo.name?.trim().length > 50) {
      errors.push("Child's name must be 50 characters or less");
    }
    
    return errors;
  };

  const validateInventory = (): string[] => {
    const errors: string[] = [];
    
    for (const item of onboardingData.inventory) {
      if (!item.brandName?.trim()) {
        errors.push("Brand name is required for all inventory items");
        break;
      }
      
      if (item.quantity <= 0) {
        errors.push("Quantity must be greater than 0 for all inventory items");
        break;
      }
    }
    
    return errors;
  };

  const handleCompleteOnboarding = async () => {
    if (isCompleting || createChildLoading || setInventoryLoading || completeOnboardingLoading) {
      return; // Prevent multiple submissions while any mutation is loading
    }
    
    // Client-side validation before starting mutations
    const childErrors = validateChildInfo();
    const inventoryErrors = validateInventory();
    const allErrors = [...childErrors, ...inventoryErrors];
    
    if (allErrors.length > 0) {
      Alert.alert(
        'Please Fix the Following Issues',
        allErrors.join('\n• '),
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }
    
    setIsCompleting(true);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      if (__DEV__) {
        console.log('Starting onboarding completion');
      }

      // CRITICAL: Ensure we have a valid token before starting sequential mutations
      const validToken = await ensureValidToken(15); // 15-minute buffer for long operations
      
      if (!validToken) {
        throw new Error('Authentication session expired. Please sign in again to complete onboarding.');
      }

      // Step 1: Create child profile using proper Apollo Client async/await pattern
      try {
        const createChildInput = {
          name: childInfo.name,
          dateOfBirth: childInfo.birthDate.toISOString().split('T')[0],
          gender: childInfo.gender === 'PREFER_NOT_TO_SAY' ? null : childInfo.gender,
          currentDiaperSize: 'SIZE_1',
          currentWeightKg: childInfo.currentWeight ? childInfo.currentWeight / 1000 : null,
          dailyUsageCount: 8,
          hasSensitiveSkin: false,
          hasAllergies: false,
          allergiesNotes: childInfo.notes || null,
        };
        
        const { data, errors } = await createChild({
          variables: {
            input: createChildInput
          }
        });

        // CRITICAL FIX: Check for GraphQL errors first, then response success
        if (errors && errors.length > 0) {
          if (__DEV__) {
            console.error('GraphQL errors during child creation:', errors);
          }
          throw new Error(`GraphQL Error: ${errors[0].message}`);
        }

        if (!data?.createChild?.success) {
          throw new Error(data?.createChild?.error || 'Failed to create child profile');
        }

        const createdChild = data.createChild.child;
        if (__DEV__) {
          console.log('Child created successfully');
        }

        // Step 2: Set initial inventory if any items were added
        if (onboardingData.inventory.length > 0) {
          if (__DEV__) {
            console.log('Setting initial inventory...');
          }
          
          // Validate token again before second mutation (extra safety)
          const inventoryToken = await ensureValidToken(10);
          if (!inventoryToken) {
            throw new Error('Authentication token expired during onboarding. Please try again.');
          }
          
          const inventoryItems = onboardingData.inventory.map(item => ({
            diaperSize: item.size,
            brand: item.brandName,
            quantity: item.quantity,
            purchaseDate: new Date().toISOString().split('T')[0],
          }));
          

          try {
            const { data: inventoryData, errors: inventoryErrors } = await setInitialInventory({
              variables: {
                childId: createdChild.id,
                inventoryItems: inventoryItems
              }
            });

            // Check for GraphQL errors first
            if (inventoryErrors && inventoryErrors.length > 0) {
              if (__DEV__) {
                console.error('GraphQL errors during inventory setup:', inventoryErrors);
              }
              throw new Error(`GraphQL Error: ${inventoryErrors[0].message}`);
            }

            if (!inventoryData?.setInitialInventory?.success) {
              throw new Error(inventoryData?.setInitialInventory?.error || 'Failed to set initial inventory');
            }
            
            if (__DEV__) {
              console.log('Initial inventory set successfully');
            }
          } catch (inventoryError) {
            if (__DEV__) {
              console.error('Inventory creation error:', inventoryError);
              if (inventoryError instanceof ApolloError) {
                console.error('GraphQL errors:', inventoryError.graphQLErrors);
                console.error('Network error:', inventoryError.networkError);
              }
            }
            if (inventoryError instanceof ApolloError) {
              throw new Error(`Failed to set initial inventory: ${inventoryError.message}`);
            } else {
              const errorMessage = inventoryError instanceof Error ? inventoryError.message : 'Unknown error';
              throw new Error(`Failed to set initial inventory: ${errorMessage}`);
            }
          }
        }

        // Step 3: Complete onboarding in backend  
        if (__DEV__) {
          console.log('Completing onboarding in backend...');
        }
        
        // Final token validation before completing onboarding
        const completionToken = await ensureValidToken(5);
        if (!completionToken) {
          throw new Error('Authentication token expired before completion. Please try again.');
        }
        
        const { data: completionData, errors: completionErrors } = await completeOnboarding();
        
        // Check for GraphQL errors first
        if (completionErrors && completionErrors.length > 0) {
          if (__DEV__) {
            console.error('GraphQL errors during onboarding completion:', completionErrors);
          }
          throw new Error(`GraphQL Error: ${completionErrors[0].message}`);
        }
        
        if (!completionData?.completeOnboarding?.success) {
          throw new Error(completionData?.completeOnboarding?.error || 'Failed to complete onboarding in backend');
        }
        
        // Step 4: Update local auth state
        await complete();
        
        if (__DEV__) {
          console.log('Onboarding completed successfully!');
        }
        router.replace('/(tabs)');
        
      } catch (childError) {
        if (__DEV__) {
          console.error('Child creation error:', childError);
          if (childError instanceof ApolloError) {
            console.error('GraphQL errors:', childError.graphQLErrors);
            console.error('Network error:', childError.networkError);
          }
        }
        if (childError instanceof ApolloError) {
          throw new Error(`Failed to create child profile: ${childError.message}`);
        } else {
          const errorMessage = childError instanceof Error ? childError.message : 'Unknown error';
          throw new Error(`Failed to create child profile: ${errorMessage}`);
        }
      }
      
    } catch (error) {
      if (__DEV__) {
        console.error('Error completing onboarding:', error);
      }

      // Enhanced error handling with specific messaging for token issues
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      const isTokenError = errorMsg.includes('Authentication') || errorMsg.includes('token');
      const errorTitle = isTokenError ? 'Session Expired' : 'Onboarding Error';
      const errorMessage = isTokenError
        ? 'Your session has expired. Please sign in again to complete your setup.'
        : `Failed to save your information: ${errorMsg}. Please try again or contact support if the problem persists.`;

      const buttons = isTokenError
        ? [
            { text: 'Sign In Again', style: 'default' as const, onPress: () => {
              router.replace('/(auth)' as any);
            }},
            { text: 'Skip for Now', style: 'destructive' as const, onPress: async () => {
              await complete();
              router.replace('/(tabs)');
            }}
          ]
        : [
            { text: 'Try Again', style: 'default' as const },
            { text: 'Skip for Now', style: 'destructive' as const, onPress: async () => {
              await complete();
              router.replace('/(tabs)');
            }}
          ];

      Alert.alert(errorTitle, errorMessage, buttons);
    } finally {
      setIsCompleting(false);
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
                  } as React.CSSProperties}
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
          <Text style={[styles.label, { color: colors.textEmphasis }]}>Gender</Text>
          <View style={[styles.pickerContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Dropdown
              style={styles.picker}
              placeholderStyle={{ color: colors.placeholder }}
              selectedTextStyle={{ color: colors.text }}
              itemTextStyle={{ color: colors.text }}
              data={GENDER_OPTIONS}
              maxHeight={300}
              labelField="label"
              valueField="value"
              placeholder="Select gender"
              value={childInfo.gender}
              onChange={(item) => setChildInfo(prev => ({ ...prev, gender: item.value as any }))}
              dropdownPosition="auto"
              containerStyle={{ backgroundColor: colors.background, borderColor: colors.border }}
              itemContainerStyle={{ backgroundColor: colors.background }}
            />
          </View>
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
            <Text style={[styles.label, { color: colors.textEmphasis }]}>Size</Text>
            <View style={[styles.pickerContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Dropdown
                style={styles.picker}
                placeholderStyle={{ color: colors.placeholder }}
                selectedTextStyle={{ color: colors.text }}
                itemTextStyle={{ color: colors.text }}
                data={DIAPER_SIZE_OPTIONS}
                maxHeight={300}
                labelField="label"
                valueField="value"
                placeholder="Select size"
                value={inventoryItem.size}
                onChange={(item) => setInventoryItem(prev => ({ ...prev, size: item.value as any }))}
                dropdownPosition="auto"
                containerStyle={{ backgroundColor: colors.background, borderColor: colors.border }}
                itemContainerStyle={{ backgroundColor: colors.background }}
              />
            </View>
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
            <Text style={[styles.label, { color: colors.textEmphasis }]}>Type</Text>
            <View style={[styles.pickerContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Dropdown
                style={styles.picker}
                placeholderStyle={{ color: colors.placeholder }}
                selectedTextStyle={{ color: colors.text }}
                itemTextStyle={{ color: colors.text }}
                data={DIAPER_TYPE_OPTIONS}
                maxHeight={300}
                labelField="label"
                valueField="value"
                placeholder="Select type"
                value={inventoryItem.type}
                onChange={(item) => setInventoryItem(prev => ({ ...prev, type: item.value as any }))}
                dropdownPosition="auto"
                containerStyle={{ backgroundColor: colors.background, borderColor: colors.border }}
                itemContainerStyle={{ backgroundColor: colors.background }}
              />
            </View>
          </View>

          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={[styles.label, { color: colors.textEmphasis }]}>Absorbency</Text>
            <View style={[styles.pickerContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Dropdown
                style={styles.picker}
                placeholderStyle={{ color: colors.placeholder }}
                selectedTextStyle={{ color: colors.text }}
                itemTextStyle={{ color: colors.text }}
                data={ABSORBENCY_OPTIONS}
                maxHeight={300}
                labelField="label"
                valueField="value"
                placeholder="Select absorbency"
                value={inventoryItem.absorbency}
                onChange={(item) => setInventoryItem(prev => ({ ...prev, absorbency: item.value as any }))}
                dropdownPosition="auto"
                containerStyle={{ backgroundColor: colors.background, borderColor: colors.border }}
                itemContainerStyle={{ backgroundColor: colors.background }}
              />
            </View>
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
              <View key={`${item.brandName}-${item.size}-${item.type}-${index}`} style={styles.inventoryItem}>
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
          title={
            isCompleting || createChildLoading || setInventoryLoading || completeOnboardingLoading
              ? 'Saving...' 
              : 'Complete Setup'
          }
          onPress={handleNextPhase}
          variant="primary"
          disabled={isCompleting || isLoading || createChildLoading || setInventoryLoading || completeOnboardingLoading}
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
          style={StyleSheet.flatten([
            styles.personaCard,
            selectedPersona === UserPersona.OVERWHELMED_NEW_MOM ? {
              borderColor: colors.tint,
              backgroundColor: colors.surface,
            } : undefined
          ])}
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
          style={StyleSheet.flatten([
            styles.personaCard,
            selectedPersona === UserPersona.EFFICIENCY_DAD ? {
              borderColor: colors.tint,
              backgroundColor: colors.surface,
            } : undefined
          ])}
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
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
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