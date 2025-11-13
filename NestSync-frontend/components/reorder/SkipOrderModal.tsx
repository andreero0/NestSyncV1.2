/**
 * SkipOrderModal - Temporarily skip an upcoming reorder
 * Allows users to pause orders for set durations with optional notes
 */

import React, { useState } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Text,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, NestSyncColors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import { useNestSyncTheme } from '../../contexts/ThemeContext';

interface SkipOrderModalProps {
  visible: boolean;
  onClose: () => void;
  order: {
    id: string;
    productName: string;
    predictedDays?: number;
  };
  onSkip: (orderId: string, skipData: SkipOrderData) => void;
}

export interface SkipOrderData {
  duration: 'week' | 'twoweeks' | 'month' | 'custom';
  customDays?: number;
  reason?: string;
}

type SkipOption = {
  id: 'week' | 'twoweeks' | 'month' | 'custom';
  label: string;
  days: number | null;
  subtitle: string;
};

const SKIP_OPTIONS: SkipOption[] = [
  { id: 'week', label: '1 Week', days: 7, subtitle: 'Resume in 7 days' },
  { id: 'twoweeks', label: '2 Weeks', days: 14, subtitle: 'Resume in 14 days' },
  { id: 'month', label: '1 Month', days: 30, subtitle: 'Resume in 30 days' },
  { id: 'custom', label: 'Custom', days: null, subtitle: 'Set your own duration' },
];

export function SkipOrderModal({
  visible,
  onClose,
  order,
  onSkip,
}: SkipOrderModalProps) {
  const theme = useNestSyncTheme();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [selectedDuration, setSelectedDuration] = useState<'week' | 'twoweeks' | 'month' | 'custom'>('week');
  const [customDays, setCustomDays] = useState('');
  const [reason, setReason] = useState('');

  const handleSkip = () => {
    const skipData: SkipOrderData = {
      duration: selectedDuration,
      customDays: selectedDuration === 'custom' ? parseInt(customDays) : undefined,
      reason: reason.trim() || undefined,
    };

    onSkip(order.id, skipData);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setSelectedDuration('week');
    setCustomDays('');
    setReason('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const isFormValid = selectedDuration !== 'custom' || (customDays && parseInt(customDays) > 0);

  const getResumeDate = () => {
    const days = selectedDuration === 'custom'
      ? parseInt(customDays) || 0
      : SKIP_OPTIONS.find(opt => opt.id === selectedDuration)?.days || 0;

    const resumeDate = new Date();
    resumeDate.setDate(resumeDate.getDate() + days);

    return resumeDate.toLocaleDateString('en-CA', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      width: '90%',
      maxWidth: 400,
      backgroundColor: theme === 'dark' ? '#374151' : colors.background,
      borderRadius: 16,
      padding: 24,
      maxHeight: '80%',
      boxShadow: '0px 4px 8px rgba(0, 0, NaN, 0.25)',
      elevation: 5,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    headerLeft: {
      flex: 1,
    },
    title: {
      fontSize: 20,
      fontWeight: '600',
      color: theme === 'dark' ? colors.background : colors.text,
      marginBottom: 4,
    },
    productName: {
      fontSize: 14,
      color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
    },
    closeButton: {
      padding: 4,
      minWidth: 48,
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
    },

    // Skip Duration Options
    skipOptions: {
      gap: 8,
      marginBottom: 20,
    },
    skipOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme === 'dark' ? '#4B5563' : '#F9FAFB',
      borderWidth: 2,
      borderColor: 'transparent',
      borderRadius: 12,
      padding: 16,
      minHeight: 60,
    },
    skipOptionSelected: {
      borderColor: NestSyncColors.primary.blue,
      backgroundColor: theme === 'dark' ? '#1E3A8A' : '#DBEAFE',
    },
    skipOptionLeft: {
      flex: 1,
    },
    skipOptionLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: theme === 'dark' ? colors.background : colors.text,
      marginBottom: 2,
    },
    skipOptionSubtitle: {
      fontSize: 13,
      color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
    },
    radioOuter: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: theme === 'dark' ? '#6B7280' : '#D1D5DB',
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioOuterSelected: {
      borderColor: NestSyncColors.primary.blue,
    },
    radioInner: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: NestSyncColors.primary.blue,
    },

    // Custom Days Input
    customDaysContainer: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
      color: theme === 'dark' ? '#D1D5DB' : '#374151',
      marginBottom: 8,
    },
    input: {
      backgroundColor: theme === 'dark' ? '#4B5563' : '#F9FAFB',
      borderWidth: 1,
      borderColor: theme === 'dark' ? '#6B7280' : '#D1D5DB',
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: theme === 'dark' ? colors.background : colors.text,
      minHeight: 48,
    },
    inputMultiline: {
      minHeight: 80,
      textAlignVertical: 'top',
    },

    // Resume Info
    resumeInfo: {
      backgroundColor: theme === 'dark' ? '#1E3A8A' : '#EFF6FF',
      padding: 12,
      borderRadius: 8,
      marginBottom: 20,
    },
    resumeInfoText: {
      fontSize: 13,
      color: theme === 'dark' ? '#BFDBFE' : '#1E40AF',
      textAlign: 'center',
    },

    // Action Buttons
    buttonContainer: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 8,
    },
    button: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
      minHeight: 48,
      justifyContent: 'center',
    },
    cancelButton: {
      backgroundColor: theme === 'dark' ? '#4B5563' : '#E5E7EB',
    },
    skipButton: {
      backgroundColor: NestSyncColors.primary.blue,
    },
    skipButtonDisabled: {
      backgroundColor: theme === 'dark' ? '#4B5563' : '#D1D5DB',
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    cancelText: {
      color: theme === 'dark' ? colors.background : '#374151',
    },
    skipText: {
      color: colors.background,
    },
  });

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
      accessibilityViewIsModal={true}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.title}>Skip Order</Text>
              <Text style={styles.productName}>{order.productName}</Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              accessibilityLabel="Close modal"
              accessibilityRole="button"
            >
              <Ionicons
                name="close"
                size={24}
                color={theme === 'dark' ? colors.background : colors.text}
              />
            </TouchableOpacity>
          </View>

          {/* Skip Duration Options */}
          <View style={styles.skipOptions}>
            {SKIP_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.skipOption,
                  selectedDuration === option.id && styles.skipOptionSelected,
                ]}
                onPress={() => setSelectedDuration(option.id)}
                accessibilityLabel={`Skip for ${option.label}`}
                accessibilityRole="radio"
                accessibilityState={{ selected: selectedDuration === option.id }}
              >
                <View style={styles.skipOptionLeft}>
                  <Text style={styles.skipOptionLabel}>{option.label}</Text>
                  <Text style={styles.skipOptionSubtitle}>{option.subtitle}</Text>
                </View>
                <View
                  style={[
                    styles.radioOuter,
                    selectedDuration === option.id && styles.radioOuterSelected,
                  ]}
                >
                  {selectedDuration === option.id && (
                    <View style={styles.radioInner} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom Days Input */}
          {selectedDuration === 'custom' && (
            <View style={styles.customDaysContainer}>
              <Text style={styles.label}>Number of Days</Text>
              <TextInput
                style={styles.input}
                value={customDays}
                onChangeText={setCustomDays}
                keyboardType="numeric"
                placeholder="e.g., 45"
                placeholderTextColor={theme === 'dark' ? '#6B7280' : '#9CA3AF'}
                accessibilityLabel="Custom skip duration in days"
                accessibilityHint="Enter the number of days to skip this order"
              />
            </View>
          )}

          {/* Resume Date Info */}
          {isFormValid && (
            <View style={styles.resumeInfo}>
              <Text style={styles.resumeInfoText}>
                Order will resume on {getResumeDate()}
              </Text>
            </View>
          )}

          {/* Optional Reason */}
          <Text style={styles.label}>Reason (Optional)</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            value={reason}
            onChangeText={setReason}
            placeholder="Why are you skipping this order?"
            placeholderTextColor={theme === 'dark' ? '#6B7280' : '#9CA3AF'}
            multiline
            numberOfLines={3}
            accessibilityLabel="Skip reason"
            accessibilityHint="Optionally explain why you're skipping this order"
          />

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
              accessibilityLabel="Cancel skip"
              accessibilityRole="button"
            >
              <Text style={[styles.buttonText, styles.cancelText]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.skipButton,
                !isFormValid && styles.skipButtonDisabled,
              ]}
              onPress={handleSkip}
              disabled={!isFormValid}
              accessibilityLabel="Confirm skip order"
              accessibilityRole="button"
              accessibilityState={{ disabled: !isFormValid }}
            >
              <Text style={[styles.buttonText, styles.skipText]}>Skip Order</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
