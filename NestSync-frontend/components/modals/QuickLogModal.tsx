import React, { useState, useCallback } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useMutation, useQuery } from '@apollo/client';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '../ThemedText';
import { IconSymbol } from '../ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { LOG_DIAPER_CHANGE_MUTATION } from '@/lib/graphql/mutations';
import { GET_DASHBOARD_STATS_QUERY } from '@/lib/graphql/queries';
import { useChildren } from '@/hooks/useChildren';
import {
  GET_USAGE_ANALYTICS_QUERY,
  GET_WEEKLY_TRENDS_QUERY,
  GET_ANALYTICS_DASHBOARD_QUERY,
  GET_INVENTORY_INSIGHTS_QUERY,
  GET_DAILY_SUMMARY_QUERY,
} from '@/lib/graphql/analytics-queries';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface QuickLogModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
}

interface TimeOption {
  id: string;
  label: string;
  value: Date;
  isCustom?: boolean;
}

interface ChangeType {
  id: 'wet' | 'soiled' | 'both';
  label: string;
  icon: string;
  description: string;
}

const CHANGE_TYPES: ChangeType[] = [
  {
    id: 'wet',
    label: 'Wet Only',
    icon: 'drop.fill',
    description: 'Urine only',
  },
  {
    id: 'soiled',
    label: 'Soiled Only',
    icon: 'exclamationmark.triangle.fill',
    description: 'Bowel movement only',
  },
  {
    id: 'both',
    label: 'Wet + Soiled',
    icon: 'multiply.circle.fill',
    description: 'Both types',
  },
];

export function QuickLogModal({ visible, onClose, onSuccess }: QuickLogModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  // Animation values
  const modalScale = useSharedValue(0.9);
  const modalOpacity = useSharedValue(0);
  const slideY = useSharedValue(screenHeight);

  // Form state
  const [selectedTime, setSelectedTime] = useState<string>('now');
  const [customTime, setCustomTime] = useState<Date>(new Date());
  const [selectedChangeType, setSelectedChangeType] = useState<string>('wet');
  const [notes, setNotes] = useState<string>('');
  const [showCustomTime, setShowCustomTime] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState<string>('');

  // GraphQL queries and mutations - using centralized hook
  const { children, loading: childrenLoading } = useChildren({
    first: 10,
    skip: !visible
  });

  const [logDiaperChange, { loading: submitLoading }] = useMutation(LOG_DIAPER_CHANGE_MUTATION, {
    refetchQueries: [
      {
        query: GET_DASHBOARD_STATS_QUERY,
        variables: { childId: selectedChildId },
      },
      {
        query: GET_ANALYTICS_DASHBOARD_QUERY,
        variables: { childId: selectedChildId },
      },
      {
        query: GET_USAGE_ANALYTICS_QUERY,
        variables: {
          filters: {
            childId: selectedChildId,
            dateRange: null,
            period: "DAILY",
            includePredictions: false
          }
        },
      },
      {
        query: GET_WEEKLY_TRENDS_QUERY,
        variables: { childId: selectedChildId, weeksBack: 8 },
      },
      {
        query: GET_INVENTORY_INSIGHTS_QUERY,
        variables: { childId: selectedChildId, includePredictions: true },
      },
      {
        query: GET_DAILY_SUMMARY_QUERY,
        variables: { childId: selectedChildId, targetDate: new Date().toISOString().split('T')[0] },
      },
    ],
  });

  // Generate time options (Now, 1h ago, 2h ago, Custom)
  const getTimeOptions = useCallback((): TimeOption[] => {
    const now = new Date();
    return [
      {
        id: 'now',
        label: 'Now',
        value: now,
      },
      {
        id: '1h',
        label: '1h ago',
        value: new Date(now.getTime() - 60 * 60 * 1000),
      },
      {
        id: '2h',
        label: '2h ago',
        value: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      },
      {
        id: 'custom',
        label: 'Custom',
        value: customTime,
        isCustom: true,
      },
    ];
  }, [customTime]);

  // Get the first child as default (in a real app, this would be user-selected or stored)
  React.useEffect(() => {
    if (children.length > 0 && !selectedChildId) {
      setSelectedChildId(children[0].id);
    }
  }, [children, selectedChildId]);

  // Animation effects
  React.useEffect(() => {
    if (visible) {
      // Show animation
      modalOpacity.value = withTiming(1, { duration: 300 });
      modalScale.value = withSpring(1, {
        damping: 20,
        stiffness: 300,
      });
      slideY.value = withSpring(0, {
        damping: 25,
        stiffness: 400,
      });
    } else {
      // Hide animation
      modalOpacity.value = withTiming(0, { duration: 200 });
      modalScale.value = withTiming(0.9, { duration: 200 });
      slideY.value = withTiming(screenHeight, { duration: 200 });
    }
  }, [visible]);

  // Handle form submission
  const handleSubmit = async () => {
    if (!selectedChildId) {
      console.error('No child selected');
      return;
    }

    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const timeOptions = getTimeOptions();
      const selectedTimeOption = timeOptions.find(option => option.id === selectedTime);
      const loggedAt = selectedTimeOption?.value || new Date();

      const changeType = CHANGE_TYPES.find(type => type.id === selectedChangeType);
      
      const input = {
        childId: selectedChildId,
        wasWet: changeType?.id === 'wet' || changeType?.id === 'both',
        wasSoiled: changeType?.id === 'soiled' || changeType?.id === 'both',
        loggedAt: loggedAt.toISOString(),
        notes: notes.trim() || null,
        usageType: 'DIAPER_CHANGE' as const,
      };

      const result = await logDiaperChange({
        variables: { input },
      });

      if (result.data?.logDiaperChange?.success) {
        onSuccess?.('Diaper change logged successfully!');
        handleClose();
      } else {
        console.error('Failed to log diaper change:', result.data?.logDiaperChange?.error);
      }
    } catch (error) {
      console.error('Error logging diaper change:', error);
    }
  };

  // Handle custom time change
  const handleCustomTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowCustomTime(false);
    }
    
    if (selectedDate) {
      setCustomTime(selectedDate);
      Haptics.selectionAsync();
    }
  };

  // Handle modal close with animation
  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    
    // Reset form state after animation
    setTimeout(() => {
      setSelectedTime('now');
      setSelectedChangeType('wet');
      setNotes('');
      setShowCustomTime(false);
    }, 300);
  };

  // Animated styles
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
  }));

  const modalStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: modalScale.value },
      { translateY: slideY.value },
    ],
    opacity: modalOpacity.value,
  }));

  const timeOptions = getTimeOptions();

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      statusBarTranslucent={true}
      onRequestClose={handleClose}
    >
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <BlurView intensity={20} style={StyleSheet.absoluteFill}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={handleClose}
          />
        </BlurView>
        
        <Animated.View style={[styles.modalContainer, modalStyle]}>
          <KeyboardAvoidingView 
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            <View style={[
              styles.modal,
              { 
                backgroundColor: colors.background,
                borderColor: colors.border,
                paddingTop: Math.max(insets.top, 20),
                paddingBottom: Math.max(insets.bottom, 20),
              }
            ]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.headerContent}>
                <IconSymbol name="plus.circle.fill" size={24} color={colors.tint} />
                <ThemedText type="title" style={styles.headerTitle}>
                  Log Diaper Change
                </ThemedText>
              </View>
              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: colors.surface }]}
                onPress={handleClose}
                accessibilityRole="button"
                accessibilityLabel="Close modal"
              >
                <IconSymbol name="xmark" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.content}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[styles.contentContainer, { paddingBottom: 20 }]}
              keyboardShouldPersistTaps="handled"
            >
              {/* Loading State */}
              {childrenLoading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={colors.tint} />
                  <ThemedText style={[styles.loadingText, { color: colors.textSecondary }]}>
                    Loading child information...
                  </ThemedText>
                </View>
              )}

              {/* Time Selection */}
              <View style={styles.section}>
                <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                  When did this happen?
                </ThemedText>
                <View style={styles.timeChips}>
                  {timeOptions.map((option) => (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.timeChip,
                        {
                          backgroundColor: selectedTime === option.id ? colors.tint : colors.surface,
                          borderColor: selectedTime === option.id ? colors.tint : colors.border,
                        },
                      ]}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setSelectedTime(option.id);
                        if (option.isCustom) {
                          setShowCustomTime(true);
                        } else {
                          setShowCustomTime(false);
                        }
                      }}
                      accessibilityRole="button"
                      accessibilityState={{ selected: selectedTime === option.id }}
                    >
                      <ThemedText
                        style={[
                          styles.timeChipText,
                          {
                            color: selectedTime === option.id ? '#FFFFFF' : colors.text,
                          },
                        ]}
                      >
                        {option.label}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
                
                {/* Custom Time Picker */}
                {showCustomTime && (
                  <View style={[styles.customTimeContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.customTimeHeader}>
                      <ThemedText type="defaultSemiBold" style={[styles.customTimeTitle, { color: colors.text }]}>
                        Select Custom Time
                      </ThemedText>
                      {Platform.OS === 'ios' && (
                        <TouchableOpacity
                          style={[styles.customTimeDone, { backgroundColor: colors.tint }]}
                          onPress={() => setShowCustomTime(false)}
                          accessibilityRole="button"
                          accessibilityLabel="Done selecting time"
                        >
                          <ThemedText style={styles.customTimeDoneText}>Done</ThemedText>
                        </TouchableOpacity>
                      )}
                    </View>
                    
                    <View style={styles.dateTimePickerContainer}>
                      {Platform.OS === 'web' ? (
                        <TextInput
                          style={[
                            styles.webDateInput,
                            {
                              backgroundColor: colors.background,
                              borderColor: colors.border,
                              color: colors.text,
                            },
                          ]}
                          value={customTime.toISOString().slice(0, 16)}
                          onChangeText={(value) => {
                            const newDate = new Date(value);
                            if (!isNaN(newDate.getTime())) {
                              setCustomTime(newDate);
                            }
                          }}
                          placeholder="YYYY-MM-DDTHH:MM"
                          placeholderTextColor={colors.placeholder}
                        />
                      ) : (
                        <DateTimePicker
                          value={customTime}
                          mode="datetime"
                          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                          onChange={handleCustomTimeChange}
                          maximumDate={new Date()}
                          minimumDate={new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)} // 7 days ago
                          textColor={colors.text}
                          accentColor={colors.tint}
                          style={styles.dateTimePicker}
                        />
                      )}
                    </View>
                    
                    <ThemedText style={[styles.selectedTimeText, { color: colors.textSecondary }]}>
                      Selected: {customTime.toLocaleString()}
                    </ThemedText>
                  </View>
                )}
              </View>

              {/* Change Type Selection */}
              <View style={styles.section}>
                <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                  What type of change?
                </ThemedText>
                <View style={styles.changeTypes}>
                  {CHANGE_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type.id}
                      style={[
                        styles.changeTypeButton,
                        {
                          backgroundColor: selectedChangeType === type.id ? colors.success : colors.surface,
                          borderColor: selectedChangeType === type.id ? colors.success : colors.border,
                        },
                      ]}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setSelectedChangeType(type.id);
                      }}
                      accessibilityRole="button"
                      accessibilityState={{ selected: selectedChangeType === type.id }}
                    >
                      <IconSymbol
                        name={type.icon}
                        size={24}
                        color={selectedChangeType === type.id ? '#FFFFFF' : colors.textSecondary}
                      />
                      <ThemedText
                        type="defaultSemiBold"
                        style={[
                          styles.changeTypeLabel,
                          {
                            color: selectedChangeType === type.id ? '#FFFFFF' : colors.text,
                          },
                        ]}
                      >
                        {type.label}
                      </ThemedText>
                      <ThemedText
                        style={[
                          styles.changeTypeDescription,
                          {
                            color: selectedChangeType === type.id ? '#FFFFFF' : colors.textSecondary,
                          },
                        ]}
                      >
                        {type.description}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Notes Section */}
              <View style={styles.section}>
                <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                  Notes (optional)
                </ThemedText>
                <TextInput
                  style={[
                    styles.notesInput,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  placeholder="Add any additional notes..."
                  placeholderTextColor={colors.placeholder}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={3}
                  maxLength={200}
                  textAlignVertical="top"
                />
                <ThemedText style={[styles.characterCount, { color: colors.textSecondary }]}>
                  {notes.length}/200 characters
                </ThemedText>
              </View>

              {/* Action Buttons */}
              <View style={[styles.actions, { borderTopColor: colors.border }]}>
                <TouchableOpacity
                  style={[styles.secondaryButton, { borderColor: colors.border }]}
                  onPress={handleClose}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel"
                >
                  <ThemedText style={[styles.secondaryButtonText, { color: colors.textSecondary }]}>
                    Cancel
                  </ThemedText>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    { 
                      backgroundColor: colors.tint,
                      opacity: (!selectedChildId || !selectedChangeType || submitLoading) ? 0.6 : 1,
                    },
                  ]}
                  onPress={handleSubmit}
                  disabled={!selectedChildId || !selectedChangeType || submitLoading}
                  accessibilityRole="button"
                  accessibilityLabel="Log diaper change"
                >
                  {submitLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <IconSymbol name="checkmark" size={18} color="#FFFFFF" />
                      <ThemedText style={styles.primaryButtonText}>
                        Log Change
                      </ThemedText>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: screenWidth - 40,
    maxHeight: screenHeight * 0.9,
    flex: 1,
    maxWidth: 500,
  },
  modal: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    // Elevation for Android
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    flexGrow: 1,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 12,
  },
  timeChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeChip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 2,
    minWidth: 80,
    alignItems: 'center',
  },
  timeChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  changeTypes: {
    gap: 12,
  },
  changeTypeButton: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    gap: 8,
  },
  changeTypeLabel: {
    fontSize: 16,
  },
  changeTypeDescription: {
    fontSize: 12,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    marginTop: 8,
    borderTopWidth: 1,
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  primaryButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  customTimeContainer: {
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  customTimeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  customTimeTitle: {
    fontSize: 16,
  },
  customTimeDone: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  customTimeDoneText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  dateTimePickerContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  dateTimePicker: {
    width: '100%',
    height: Platform.OS === 'ios' ? 200 : 40,
  },
  selectedTimeText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  webDateInput: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    textAlign: 'center',
  },
});