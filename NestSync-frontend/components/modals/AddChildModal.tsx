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
import { CREATE_CHILD_MUTATION } from '@/lib/graphql/mutations';
import { MY_CHILDREN_QUERY } from '@/lib/graphql/queries';
import { ChildInfo, GENDER_OPTIONS } from '@/lib/types/onboarding';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface AddChildModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
}

export function AddChildModal({ visible, onClose, onSuccess }: AddChildModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  // Animation values
  const slideY = useSharedValue(screenHeight);
  const opacity = useSharedValue(0);

  // Form state
  const [childInfo, setChildInfo] = useState<ChildInfo>({
    name: '',
    birthDate: new Date(),
    gender: 'PREFER_NOT_TO_SAY',
    currentWeight: undefined,
    notes: '',
  });

  const [showDatePicker, setShowDatePicker] = useState(false);

  // GraphQL mutation
  const [createChild, { loading: createChildLoading, error: createChildError }] = useMutation(
    CREATE_CHILD_MUTATION,
    {
      refetchQueries: [{ query: MY_CHILDREN_QUERY, variables: { first: 10 } }],
      awaitRefetchQueries: true,
    }
  );

  // Animation handlers
  const showModal = useCallback(() => {
    slideY.value = withSpring(0, { damping: 20, stiffness: 300 });
    opacity.value = withTiming(1, { duration: 200 });
  }, [slideY, opacity]);

  const hideModal = useCallback(() => {
    const onComplete = () => {
      runOnJS(onClose)();
      // Reset form
      setChildInfo({
        name: '',
        birthDate: new Date(),
        gender: 'PREFER_NOT_TO_SAY',
        currentWeight: undefined,
        notes: '',
      });
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
      setChildInfo(prev => ({ ...prev, birthDate: date }));
    }
  };

  const handleCreateChild = async () => {
    if (!childInfo.name.trim()) {
      Alert.alert('Required Field', 'Please enter your child\'s name.');
      return;
    }

    try {
      const createChildInput = {
        name: childInfo.name.trim(),
        dateOfBirth: childInfo.birthDate.toISOString().split('T')[0],
        gender: childInfo.gender === 'PREFER_NOT_TO_SAY' ? null : childInfo.gender,
        currentDiaperSize: 'SIZE_1',
        currentWeightKg: childInfo.currentWeight ? childInfo.currentWeight / 1000 : null,
        dailyUsageCount: 8,
        hasSensitiveSkin: false,
        hasAllergies: false,
        allergiesNotes: childInfo.notes || null,
      };

      const { data } = await createChild({
        variables: {
          input: createChildInput
        }
      });

      if (!data?.createChild?.success) {
        throw new Error(data?.createChild?.error || 'Failed to create child profile');
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      if (onSuccess) {
        onSuccess(`${childInfo.name} has been added successfully!`);
      }
      
      hideModal();
      
    } catch (error) {
      console.error('Error creating child:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to add child. Please try again.';
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
  const isFormValid = childInfo.name.trim().length > 0;

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
            Add Child
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
              value={childInfo.name}
              onChangeText={(text) => setChildInfo(prev => ({ ...prev, name: text }))}
              placeholder="Enter your child's name"
              autoCapitalize="words"
              error={!childInfo.name.trim() && childInfo.name.length > 0 ? "Child's name is required" : undefined}
              containerStyle={styles.inputGroup}
            />

            {/* Birth Date */}
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.label, { color: colors.text }]}>
                Birth Date / Due Date
              </ThemedText>
              <TouchableOpacity
                style={[styles.dateButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
                onPress={() => setShowDatePicker(true)}
              >
                <IconSymbol name="calendar" size={20} color={colors.tint} />
                <ThemedText style={[styles.dateButtonText, { color: colors.text }]}>
                  {childInfo.birthDate.toLocaleDateString()}
                </ThemedText>
                <IconSymbol name="chevron.right" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <DateTimePicker
                mode="date"
                value={childInfo.birthDate}
                onChange={handleDateChange}
                maximumDate={(() => {
                  const maxDate = new Date();
                  maxDate.setDate(maxDate.getDate() + 270); // 9 months from today for expectant parents
                  return maxDate;
                })()}
                display={Platform.OS === 'ios' ? 'compact' : 'default'}
              />
            )}

            {/* Gender */}
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.label, { color: colors.text }]}>
                Gender (optional)
              </ThemedText>
              <View style={[styles.pickerContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <IconSymbol name="person" size={20} color={colors.tint} style={styles.pickerIcon} />
                <Dropdown
                  style={[styles.picker, { color: colors.text }]}
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

            {/* Current Weight */}
            <WeightInput
              label="Current Weight (optional)"
              value={childInfo.currentWeight}
              onValueChange={(grams) => setChildInfo(prev => ({ 
                ...prev, 
                currentWeight: grams > 0 ? grams : undefined 
              }))}
              containerStyle={styles.inputGroup}
            />

            {/* Notes */}
            <NestSyncInput
              label="Notes (optional)"
              value={childInfo.notes || ''}
              onChangeText={(text) => setChildInfo(prev => ({ ...prev, notes: text }))}
              placeholder="Any additional notes about your child"
              multiline={true}
              numberOfLines={3}
              containerStyle={styles.inputGroup}
            />
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: colors.border }]}
            onPress={hideModal}
            disabled={createChildLoading}
          >
            <ThemedText style={[styles.cancelButtonText, { color: colors.text }]}>
              Cancel
            </ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.createButton,
              {
                backgroundColor: isFormValid && !createChildLoading ? colors.tint : colors.textSecondary,
              },
            ]}
            onPress={handleCreateChild}
            disabled={!isFormValid || createChildLoading}
          >
            {createChildLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <IconSymbol name="plus.circle.fill" size={20} color="#FFFFFF" />
                <ThemedText style={styles.createButtonText}>
                  Add Child
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
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  dateButtonText: {
    flex: 1,
    fontSize: 16,
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
  createButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});