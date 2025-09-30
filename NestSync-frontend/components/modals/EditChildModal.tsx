/**
 * EditChildModal Component
 *
 * Modal for editing existing child profiles with:
 * - Pre-populated form fields from existing child data
 * - Validation and error handling
 * - Integration with UPDATE_CHILD_MUTATION
 * - Psychology-driven UX for stressed parents
 * - PIPEDA-compliant data handling
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useMutation } from '@apollo/client';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Dropdown } from 'react-native-element-dropdown';

import { ThemedText } from '../ThemedText';
import { IconSymbol } from '../ui/IconSymbol';
import { NestSyncInput } from '../ui/NestSyncInput';
import { WeightInput } from '../ui/WeightInput';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { UPDATE_CHILD_MUTATION } from '@/lib/graphql/mutations';
import { MY_CHILDREN_QUERY } from '@/lib/graphql/queries';
import { Child } from '@/hooks/useChildren';
import { GENDER_OPTIONS } from '@/lib/types/onboarding';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Diaper size options
const DIAPER_SIZE_OPTIONS = [
  { label: 'Newborn', value: 'NEWBORN' },
  { label: 'Size 1', value: 'SIZE_1' },
  { label: 'Size 2', value: 'SIZE_2' },
  { label: 'Size 3', value: 'SIZE_3' },
  { label: 'Size 4', value: 'SIZE_4' },
  { label: 'Size 5', value: 'SIZE_5' },
  { label: 'Size 6', value: 'SIZE_6' },
  { label: 'Size 7', value: 'SIZE_7' },
];

interface EditChildModalProps {
  visible: boolean;
  child: Child;
  onClose: () => void;
  onSuccess?: (message: string) => void;
}

interface EditChildFormData {
  name: string;
  dateOfBirth: Date;
  gender: 'BOY' | 'GIRL' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  currentDiaperSize: string;
  currentWeight?: number; // in grams
  dailyUsageCount: number;
  hasSensitiveSkin: boolean;
  hasAllergies: boolean;
  allergiesNotes: string;
}

export function EditChildModal({ visible, child, onClose, onSuccess }: EditChildModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  // Animation values
  const slideY = useSharedValue(screenHeight);
  const opacity = useSharedValue(0);

  // Form state - Initialize with child data
  const [formData, setFormData] = useState<EditChildFormData>({
    name: child.name,
    dateOfBirth: new Date(child.dateOfBirth),
    gender: (child.gender as any) || 'PREFER_NOT_TO_SAY',
    currentDiaperSize: child.currentDiaperSize || 'SIZE_1',
    currentWeight: child.currentWeightKg ? Math.round(child.currentWeightKg * 1000) : undefined,
    dailyUsageCount: child.dailyUsageCount || 8,
    hasSensitiveSkin: child.hasSensitiveSkin || false,
    hasAllergies: child.hasAllergies || false,
    allergiesNotes: child.allergiesNotes || '',
  });

  const [showDatePicker, setShowDatePicker] = useState(false);

  // GraphQL mutation
  const [updateChild, { loading: updateChildLoading, error: updateChildError }] = useMutation(
    UPDATE_CHILD_MUTATION,
    {
      refetchQueries: [{ query: MY_CHILDREN_QUERY, variables: { first: 10 } }],
      awaitRefetchQueries: true,
    }
  );

  // Reset form data when child changes
  useEffect(() => {
    if (child) {
      setFormData({
        name: child.name,
        dateOfBirth: new Date(child.dateOfBirth),
        gender: (child.gender as any) || 'PREFER_NOT_TO_SAY',
        currentDiaperSize: child.currentDiaperSize || 'SIZE_1',
        currentWeight: child.currentWeightKg ? Math.round(child.currentWeightKg * 1000) : undefined,
        dailyUsageCount: child.dailyUsageCount || 8,
        hasSensitiveSkin: child.hasSensitiveSkin || false,
        hasAllergies: child.hasAllergies || false,
        allergiesNotes: child.allergiesNotes || '',
      });
    }
  }, [child]);

  // Animation handlers
  const showModal = useCallback(() => {
    slideY.value = withSpring(0, { damping: 20, stiffness: 300 });
    opacity.value = withTiming(1, { duration: 200 });
  }, [slideY, opacity]);

  const hideModal = useCallback(() => {
    const onComplete = () => {
      runOnJS(onClose)();
    };

    slideY.value = withSpring(screenHeight, { damping: 20, stiffness: 300 });
    opacity.value = withTiming(0, { duration: 200 }, () => {
      runOnJS(onComplete)();
    });
  }, [slideY, opacity, onClose]);

  // Handle modal visibility
  useEffect(() => {
    if (visible) {
      showModal();
    } else {
      slideY.value = screenHeight;
      opacity.value = 0;
    }
  }, [visible, showModal, slideY, opacity]);

  // Form handlers
  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setFormData(prev => ({ ...prev, dateOfBirth: date }));
    }
  };

  const handleRequestCorrection = (field: 'dateOfBirth' | 'gender', currentValue: string) => {
    const fieldLabel = field === 'dateOfBirth' ? 'birth date' : 'gender';

    Alert.alert(
      'Support Request',
      `We understand mistakes happen during setup! Our support team is here to help with ${child.name}'s ${fieldLabel} correction.\n\nCurrent ${fieldLabel}: ${currentValue}`,
      [
        { text: 'Not Now', style: 'cancel' },
        {
          text: 'Get Help',
          onPress: () => {
            Alert.alert(
              'Quick Correction Support',
              `Email: support@nestsync.ca\n\nPlease include:\n• Child's name: ${child.name}\n• Current ${fieldLabel}: ${currentValue}\n• Correct ${fieldLabel}\n\nResponse time: Within 2 hours\n\nOur team understands parenting is challenging enough without setup worries!`,
              [
                { text: 'Got it!' }
              ]
            );
          }
        }
      ]
    );
  };

  const handleUpdateChild = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Required Field', 'Please enter your child\'s name.');
      return;
    }

    try {
      const updateChildInput: any = {
        name: formData.name.trim(),
        currentDiaperSize: formData.currentDiaperSize,
        currentWeightKg: formData.currentWeight ? formData.currentWeight / 1000 : null,
        dailyUsageCount: formData.dailyUsageCount,
        hasSensitiveSkin: formData.hasSensitiveSkin,
        hasAllergies: formData.hasAllergies,
        allergiesNotes: formData.hasAllergies ? formData.allergiesNotes : null,
      };

      const { data } = await updateChild({
        variables: {
          childId: child.id,
          input: updateChildInput
        }
      });

      if (!data?.updateChild?.success) {
        throw new Error(data?.updateChild?.error || 'Failed to update child profile');
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (onSuccess) {
        onSuccess(`${formData.name}'s profile has been updated successfully!`);
      }

      hideModal();

    } catch (error) {
      console.error('Error updating child:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      const errorMessage = error instanceof Error ? error.message : 'Failed to update child profile. Please try again.';
      Alert.alert('Error', errorMessage);
    }
  };

  // Animated styles
  const modalAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideY.value }],
  }));

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  // Validation
  const isFormValid = formData.name.trim().length > 0;

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={hideModal}
    >
      <Animated.View style={[styles.overlay, overlayAnimatedStyle]}>
        <BlurView
          intensity={20}
          tint={colorScheme === 'dark' ? 'dark' : 'light'}
          style={StyleSheet.absoluteFillObject}
        />
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={hideModal}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.modalContainer,
          {
            backgroundColor: colors.background,
            paddingTop: insets.top + 20,
            paddingBottom: Math.max(insets.bottom, 20),
          },
          modalAnimatedStyle,
        ]}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            onPress={hideModal}
            style={styles.closeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <IconSymbol name="xmark" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.headerTitle}>
            Edit {child.name}
          </ThemedText>
          <View style={styles.headerSpacer} />
        </View>

        {/* Content */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.form}>
            {/* Child's Name */}
            <NestSyncInput
              label="Child's Name"
              required={true}
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              placeholder="Enter your child's name"
              autoCapitalize="words"
              error={!formData.name.trim() && formData.name.length > 0 ? "Child's name is required" : undefined}
              containerStyle={styles.inputGroup}
            />

            {/* Birth Date - Read Only with Request Correction */}
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.label, { color: colors.text }]}>
                Birth Date
              </ThemedText>
              <View style={[styles.readOnlyField, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <IconSymbol name="calendar" size={20} color={colors.textSecondary} />
                <ThemedText style={[styles.readOnlyText, { color: colors.textSecondary }]}>
                  {formData.dateOfBirth.toLocaleDateString()}
                </ThemedText>
              </View>
              <TouchableOpacity
                style={[styles.supportCard, {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                }]}
                onPress={() => handleRequestCorrection('dateOfBirth', formData.dateOfBirth.toLocaleDateString())}
                activeOpacity={0.7}
              >
                <View style={styles.supportCardContent}>
                  <View style={[styles.supportIconContainer, { backgroundColor: colors.info + '15' }]}>
                    <IconSymbol name="questionmark.circle.fill" size={20} color={colors.info} />
                  </View>
                  <View style={styles.supportTextContainer}>
                    <ThemedText style={[styles.supportCardTitle, { color: colors.text }]}>
                      Need to update birth date?
                    </ThemedText>
                    <ThemedText style={[styles.supportCardSubtitle, { color: colors.textSecondary }]}>
                      Support team • 2-hour response
                    </ThemedText>
                  </View>
                  <IconSymbol name="chevron.right" size={16} color={colors.textSecondary} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Gender - Read Only with Request Correction */}
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.label, { color: colors.text }]}>
                Gender
              </ThemedText>
              <View style={[styles.readOnlyField, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <IconSymbol name="person" size={20} color={colors.textSecondary} />
                <ThemedText style={[styles.readOnlyText, { color: colors.textSecondary }]}>
                  {GENDER_OPTIONS.find(option => option.value === formData.gender)?.label || 'Prefer not to say'}
                </ThemedText>
              </View>
              <TouchableOpacity
                style={[styles.supportCard, {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                }]}
                onPress={() => handleRequestCorrection('gender', GENDER_OPTIONS.find(option => option.value === formData.gender)?.label || 'Prefer not to say')}
                activeOpacity={0.7}
              >
                <View style={styles.supportCardContent}>
                  <View style={[styles.supportIconContainer, { backgroundColor: colors.info + '15' }]}>
                    <IconSymbol name="questionmark.circle.fill" size={20} color={colors.info} />
                  </View>
                  <View style={styles.supportTextContainer}>
                    <ThemedText style={[styles.supportCardTitle, { color: colors.text }]}>
                      Need to update gender?
                    </ThemedText>
                    <ThemedText style={[styles.supportCardSubtitle, { color: colors.textSecondary }]}>
                      Support team • 2-hour response
                    </ThemedText>
                  </View>
                  <IconSymbol name="chevron.right" size={16} color={colors.textSecondary} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Current Diaper Size */}
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.label, { color: colors.text }]}>
                Current Diaper Size
              </ThemedText>
              <View style={[styles.pickerContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <IconSymbol name="circle.grid.hex" size={20} color={colors.tint} style={styles.pickerIcon} />
                <Dropdown
                  style={[styles.picker, { color: colors.text }]}
                  placeholderStyle={{ color: colors.placeholder }}
                  selectedTextStyle={{ color: colors.text }}
                  itemTextStyle={{ color: colors.text }}
                  data={DIAPER_SIZE_OPTIONS}
                  maxHeight={300}
                  labelField="label"
                  valueField="value"
                  placeholder="Select size"
                  value={formData.currentDiaperSize}
                  onChange={(item) => setFormData(prev => ({ ...prev, currentDiaperSize: item.value }))}
                  dropdownPosition="auto"
                  containerStyle={{ backgroundColor: colors.background, borderColor: colors.border }}
                  itemContainerStyle={{ backgroundColor: colors.background }}
                />
              </View>
            </View>

            {/* Current Weight */}
            <WeightInput
              label="Current Weight (optional)"
              value={formData.currentWeight}
              onValueChange={(grams) => setFormData(prev => ({
                ...prev,
                currentWeight: grams > 0 ? grams : undefined
              }))}
              containerStyle={styles.inputGroup}
            />

            {/* Daily Usage Count */}
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.label, { color: colors.text }]}>
                Daily Usage Count
              </ThemedText>
              <View style={styles.usageCountContainer}>
                <TouchableOpacity
                  style={[styles.usageButton, { backgroundColor: colors.surface }]}
                  onPress={() => setFormData(prev => ({
                    ...prev,
                    dailyUsageCount: Math.max(1, prev.dailyUsageCount - 1)
                  }))}
                  disabled={formData.dailyUsageCount <= 1}
                >
                  <IconSymbol name="minus" size={16} color={formData.dailyUsageCount <= 1 ? colors.textSecondary : colors.tint} />
                </TouchableOpacity>

                <View style={[styles.usageDisplay, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <ThemedText style={[styles.usageText, { color: colors.text }]}>
                    {formData.dailyUsageCount} diapers/day
                  </ThemedText>
                </View>

                <TouchableOpacity
                  style={[styles.usageButton, { backgroundColor: colors.surface }]}
                  onPress={() => setFormData(prev => ({
                    ...prev,
                    dailyUsageCount: Math.min(20, prev.dailyUsageCount + 1)
                  }))}
                  disabled={formData.dailyUsageCount >= 20}
                >
                  <IconSymbol name="plus" size={16} color={formData.dailyUsageCount >= 20 ? colors.textSecondary : colors.tint} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Special Needs Toggles */}
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.label, { color: colors.text }]}>
                Special Needs
              </ThemedText>

              {/* Sensitive Skin Toggle */}
              <TouchableOpacity
                style={[styles.toggleRow, { backgroundColor: colors.surface }]}
                onPress={() => setFormData(prev => ({ ...prev, hasSensitiveSkin: !prev.hasSensitiveSkin }))}
              >
                <View style={styles.toggleInfo}>
                  <ThemedText style={[styles.toggleLabel, { color: colors.text }]}>
                    Sensitive Skin
                  </ThemedText>
                  <ThemedText style={[styles.toggleDescription, { color: colors.textSecondary }]}>
                    Requires gentle, hypoallergenic products
                  </ThemedText>
                </View>
                <View style={[
                  styles.toggle,
                  { backgroundColor: formData.hasSensitiveSkin ? colors.tint : colors.border }
                ]}>
                  <View style={[
                    styles.toggleThumb,
                    {
                      backgroundColor: '#FFFFFF',
                      transform: [{ translateX: formData.hasSensitiveSkin ? 20 : 2 }]
                    }
                  ]} />
                </View>
              </TouchableOpacity>

              {/* Allergies Toggle */}
              <TouchableOpacity
                style={[styles.toggleRow, { backgroundColor: colors.surface }]}
                onPress={() => setFormData(prev => ({ ...prev, hasAllergies: !prev.hasAllergies }))}
              >
                <View style={styles.toggleInfo}>
                  <ThemedText style={[styles.toggleLabel, { color: colors.text }]}>
                    Has Allergies
                  </ThemedText>
                  <ThemedText style={[styles.toggleDescription, { color: colors.textSecondary }]}>
                    Specific allergies or sensitivities
                  </ThemedText>
                </View>
                <View style={[
                  styles.toggle,
                  { backgroundColor: formData.hasAllergies ? colors.tint : colors.border }
                ]}>
                  <View style={[
                    styles.toggleThumb,
                    {
                      backgroundColor: '#FFFFFF',
                      transform: [{ translateX: formData.hasAllergies ? 20 : 2 }]
                    }
                  ]} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Allergies Notes - Only show if has allergies */}
            {formData.hasAllergies && (
              <NestSyncInput
                label="Allergy Details"
                value={formData.allergiesNotes}
                onChangeText={(text) => setFormData(prev => ({ ...prev, allergiesNotes: text }))}
                placeholder="Describe specific allergies or reactions to avoid"
                multiline={true}
                numberOfLines={3}
                containerStyle={styles.inputGroup}
              />
            )}
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: colors.border }]}
            onPress={hideModal}
            disabled={updateChildLoading}
          >
            <ThemedText style={[styles.cancelButtonText, { color: colors.text }]}>
              Cancel
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.updateButton,
              {
                backgroundColor: isFormValid && !updateChildLoading ? colors.tint : colors.textSecondary,
              },
            ]}
            onPress={handleUpdateChild}
            disabled={!isFormValid || updateChildLoading}
          >
            {updateChildLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <IconSymbol name="checkmark.circle.fill" size={20} color="#FFFFFF" />
                <ThemedText style={styles.updateButtonText}>
                  Update Profile
                </ThemedText>
              </>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: screenHeight * 0.9,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  readOnlyField: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  readOnlyText: {
    fontSize: 16,
    fontStyle: 'italic',
    flex: 1,
  },
  supportCard: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  supportCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  supportIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportTextContainer: {
    flex: 1,
    gap: 2,
  },
  supportCardTitle: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
  },
  supportCardSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 48,
    paddingLeft: 16,
  },
  picker: {
    flex: 1,
    height: 48,
  },
  pickerIcon: {
    marginRight: 8,
  },
  usageCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  usageButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  usageDisplay: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  usageText: {
    fontSize: 16,
    fontWeight: '500',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  toggleInfo: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  toggleDescription: {
    fontSize: 14,
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    position: 'relative',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    position: 'absolute',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  updateButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  updateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});