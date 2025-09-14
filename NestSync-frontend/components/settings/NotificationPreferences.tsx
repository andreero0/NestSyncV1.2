/**
 * Notification Preferences Component for Settings Screen
 * Comprehensive notification control with PIPEDA compliance
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  Modal,
  Pressable,
  TextInput,
  ActivityIndicator,
  StyleSheet
} from 'react-native';
import { useQuery, useMutation } from '@apollo/client';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

// GraphQL imports
import {
  GET_NOTIFICATION_PREFERENCES_QUERY,
  NotificationPreferences,
  GetNotificationPreferencesQueryData
} from '@/lib/graphql/queries';
import {
  UPDATE_NOTIFICATION_PREFERENCES_MUTATION,
  REGISTER_DEVICE_TOKEN_MUTATION,
  TEST_NOTIFICATION_MUTATION,
  UpdateNotificationPreferencesInput,
  UpdateNotificationPreferencesMutationData,
  UpdateNotificationPreferencesMutationVariables,
  RegisterDeviceTokenMutationData,
  RegisterDeviceTokenMutationVariables,
  TestNotificationMutationData,
  TestNotificationMutationVariables
} from '@/lib/graphql/mutations';

interface NotificationPreferencesProps {
  onClose?: () => void;
}

interface TimePickerState {
  visible: boolean;
  type: 'start' | 'end';
  value: Date;
}

export default function NotificationPreferencesModal({ onClose }: NotificationPreferencesProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // State management
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [timePicker, setTimePicker] = useState<TimePickerState>({
    visible: false,
    type: 'start',
    value: new Date()
  });
  const [testMessage, setTestMessage] = useState('');
  const [showTestModal, setShowTestModal] = useState(false);
  const [deviceToken, setDeviceToken] = useState<string | null>(null);

  // GraphQL hooks
  const { data, loading, error, refetch } = useQuery<GetNotificationPreferencesQueryData>(
    GET_NOTIFICATION_PREFERENCES_QUERY,
    {
      errorPolicy: 'all',
      fetchPolicy: 'cache-and-network'
    }
  );

  const [updatePreferences, { loading: updating }] = useMutation<
    UpdateNotificationPreferencesMutationData,
    UpdateNotificationPreferencesMutationVariables
  >(UPDATE_NOTIFICATION_PREFERENCES_MUTATION);

  const [registerDeviceToken, { loading: registeringDevice }] = useMutation<
    RegisterDeviceTokenMutationData,
    RegisterDeviceTokenMutationVariables
  >(REGISTER_DEVICE_TOKEN_MUTATION);

  const [testNotification, { loading: testingNotification }] = useMutation<
    TestNotificationMutationData,
    TestNotificationMutationVariables
  >(TEST_NOTIFICATION_MUTATION);

  // Initialize preferences from query data
  useEffect(() => {
    if (data?.getNotificationPreferences) {
      setPreferences(data.getNotificationPreferences);
      setHasChanges(false);
    }
  }, [data]);

  // Register for push notifications on mount
  useEffect(() => {
    registerForPushNotifications();
  }, []);

  const registerForPushNotifications = async () => {
    if (!Device.isDevice) {
      Alert.alert('Push Notifications', 'Push notifications only work on physical devices');
      return;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        Alert.alert(
          'Push Notifications',
          'Permission required for push notifications. You can enable this in Settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => Notifications.openSettingsAsync() }
          ]
        );
        return;
      }

      // Get push token
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId,
      });

      setDeviceToken(token.data);

      // Register token with backend
      if (token.data) {
        await registerDeviceToken({
          variables: {
            input: {
              deviceToken: token.data,
              platform: Device.osName?.toLowerCase() === 'ios' ? 'ios' : 'android'
            }
          }
        });
      }
    } catch (error) {
      console.error('Error registering for push notifications:', error);
    }
  };

  const updatePreference = async (updates: UpdateNotificationPreferencesInput) => {
    if (!preferences) return;

    try {
      const result = await updatePreferences({
        variables: { input: updates }
      });

      if (result.data?.updateNotificationPreferences.success) {
        if (result.data.updateNotificationPreferences.preferences) {
          setPreferences(result.data.updateNotificationPreferences.preferences);
        }
        setHasChanges(false);

        // Show success feedback
        if (result.data.updateNotificationPreferences.message) {
          Alert.alert('Settings Updated', result.data.updateNotificationPreferences.message);
        }
      } else {
        Alert.alert(
          'Update Failed',
          result.data?.updateNotificationPreferences.error || 'Failed to update preferences'
        );
      }
    } catch (err) {
      console.error('Error updating preferences:', err);
      Alert.alert('Error', 'Failed to update notification preferences');
    }
  };

  const handleToggle = (field: keyof UpdateNotificationPreferencesInput, value: boolean) => {
    if (!preferences) return;

    setPreferences(prev => prev ? { ...prev, [field]: value } : prev);
    setHasChanges(true);

    // Immediate update for better UX
    updatePreference({ [field]: value });
  };

  const handleTimeChange = (field: 'quietHoursStart' | 'quietHoursEnd', date: Date) => {
    if (!preferences) return;

    const timeString = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

    setPreferences(prev => prev ? { ...prev, [field]: timeString } : prev);
    setHasChanges(true);

    updatePreference({ [field]: timeString });
  };

  const handleNumberChange = (field: keyof UpdateNotificationPreferencesInput, value: number) => {
    if (!preferences) return;

    setPreferences(prev => prev ? { ...prev, [field]: value } : prev);
    setHasChanges(true);

    updatePreference({ [field]: value });
  };

  const handleTestNotification = async () => {
    if (!testMessage.trim()) {
      Alert.alert('Error', 'Please enter a test message');
      return;
    }

    try {
      const result = await testNotification({
        variables: { message: testMessage.trim() }
      });

      if (result.data?.testNotification.success) {
        Alert.alert(
          'Test Sent',
          result.data.testNotification.message || 'Test notification sent successfully'
        );
        setTestMessage('');
        setShowTestModal(false);
      } else {
        Alert.alert(
          'Test Failed',
          result.data?.testNotification.error || 'Failed to send test notification'
        );
      }
    } catch (err) {
      console.error('Error sending test notification:', err);
      Alert.alert('Error', 'Failed to send test notification');
    }
  };

  const parseTime = (timeString: string): Date => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedText type="title" style={styles.headerTitle}>
            Notification Settings
          </ThemedText>
          {onClose && (
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <IconSymbol name="xmark" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </ThemedView>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <ThemedText style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading notification preferences...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (error || !preferences) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedText type="title" style={styles.headerTitle}>
            Notification Settings
          </ThemedText>
          {onClose && (
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <IconSymbol name="xmark" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </ThemedView>
        <View style={styles.errorContainer}>
          <IconSymbol name="exclamationmark.triangle" size={48} color={colors.error} />
          <ThemedText type="subtitle" style={[styles.errorTitle, { color: colors.error }]}>
            Unable to Load Preferences
          </ThemedText>
          <ThemedText style={[styles.errorMessage, { color: colors.textSecondary }]}>
            {error?.message || 'Failed to load notification preferences'}
          </ThemedText>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.tint }]}
            onPress={() => refetch()}
          >
            <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>
          Notification Settings
        </ThemedText>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <IconSymbol name="xmark" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </ThemedView>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Global Controls Section */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Global Controls
          </ThemedText>

          {/* Master Toggle */}
          <View style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.settingIcon}>
              <IconSymbol
                name={preferences.notificationsEnabled ? "bell.fill" : "bell.slash"}
                size={24}
                color={preferences.notificationsEnabled ? colors.tint : colors.textSecondary}
              />
            </View>
            <View style={styles.settingContent}>
              <ThemedText type="defaultSemiBold" style={styles.settingTitle}>
                Enable Notifications
              </ThemedText>
              <ThemedText style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Master switch for all notifications
              </ThemedText>
            </View>
            <Switch
              value={preferences.notificationsEnabled}
              onValueChange={(value) => handleToggle('notificationsEnabled', value)}
              trackColor={{ false: colors.border, true: colors.tint }}
              thumbColor={preferences.notificationsEnabled ? '#FFFFFF' : colors.background}
              disabled={updating}
            />
          </View>

          {/* Quiet Hours */}
          <View style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.settingIcon}>
              <IconSymbol
                name={preferences.quietHoursEnabled ? "moon.fill" : "moon"}
                size={24}
                color={preferences.quietHoursEnabled ? colors.tint : colors.textSecondary}
              />
            </View>
            <View style={styles.settingContent}>
              <ThemedText type="defaultSemiBold" style={styles.settingTitle}>
                Quiet Hours
              </ThemedText>
              <ThemedText style={[styles.settingDescription, { color: colors.textSecondary }]}>
                {preferences.quietHoursEnabled && preferences.quietHoursStart && preferences.quietHoursEnd
                  ? `Silent from ${preferences.quietHoursStart} to ${preferences.quietHoursEnd}`
                  : 'No quiet hours set'
                }
              </ThemedText>
            </View>
            <Switch
              value={preferences.quietHoursEnabled}
              onValueChange={(value) => handleToggle('quietHoursEnabled', value)}
              trackColor={{ false: colors.border, true: colors.tint }}
              thumbColor={preferences.quietHoursEnabled ? '#FFFFFF' : colors.background}
              disabled={updating}
            />
          </View>

          {/* Quiet Hours Time Settings */}
          {preferences.quietHoursEnabled && (
            <View style={[styles.timeContainer, { backgroundColor: colors.surface }]}>
              <TouchableOpacity
                style={[styles.timeButton, { borderColor: colors.border }]}
                onPress={() => setTimePicker({
                  visible: true,
                  type: 'start',
                  value: preferences.quietHoursStart ? parseTime(preferences.quietHoursStart) : new Date()
                })}
              >
                <ThemedText style={styles.timeLabel}>Start Time</ThemedText>
                <ThemedText type="defaultSemiBold" style={[styles.timeValue, { color: colors.tint }]}>
                  {preferences.quietHoursStart || '22:00'}
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.timeButton, { borderColor: colors.border }]}
                onPress={() => setTimePicker({
                  visible: true,
                  type: 'end',
                  value: preferences.quietHoursEnd ? parseTime(preferences.quietHoursEnd) : new Date()
                })}
              >
                <ThemedText style={styles.timeLabel}>End Time</ThemedText>
                <ThemedText type="defaultSemiBold" style={[styles.timeValue, { color: colors.tint }]}>
                  {preferences.quietHoursEnd || '08:00'}
                </ThemedText>
              </TouchableOpacity>
            </View>
          )}
        </ThemedView>

        {/* Notification Types Section */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Notification Types
          </ThemedText>

          <View style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.settingIcon}>
              <IconSymbol name="exclamationmark.octagon.fill" size={24} color={colors.error} />
            </View>
            <View style={styles.settingContent}>
              <ThemedText type="defaultSemiBold" style={styles.settingTitle}>
                Critical Alerts
              </ThemedText>
              <ThemedText style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Emergency notifications that bypass quiet hours
              </ThemedText>
            </View>
            <Switch
              value={preferences.criticalNotifications}
              onValueChange={(value) => handleToggle('criticalNotifications', value)}
              trackColor={{ false: colors.border, true: colors.tint }}
              thumbColor={preferences.criticalNotifications ? '#FFFFFF' : colors.background}
              disabled={updating || !preferences.notificationsEnabled}
            />
          </View>

          <View style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.settingIcon}>
              <IconSymbol name="exclamationmark.triangle.fill" size={24} color={colors.warning || colors.tint} />
            </View>
            <View style={styles.settingContent}>
              <ThemedText type="defaultSemiBold" style={styles.settingTitle}>
                Important Notifications
              </ThemedText>
              <ThemedText style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Stock alerts and important reminders
              </ThemedText>
            </View>
            <Switch
              value={preferences.importantNotifications}
              onValueChange={(value) => handleToggle('importantNotifications', value)}
              trackColor={{ false: colors.border, true: colors.tint }}
              thumbColor={preferences.importantNotifications ? '#FFFFFF' : colors.background}
              disabled={updating || !preferences.notificationsEnabled}
            />
          </View>

          <View style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.settingIcon}>
              <IconSymbol name="info.circle.fill" size={24} color={colors.info || colors.tint} />
            </View>
            <View style={styles.settingContent}>
              <ThemedText type="defaultSemiBold" style={styles.settingTitle}>
                Optional Notifications
              </ThemedText>
              <ThemedText style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Tips, suggestions, and non-essential updates
              </ThemedText>
            </View>
            <Switch
              value={preferences.optionalNotifications}
              onValueChange={(value) => handleToggle('optionalNotifications', value)}
              trackColor={{ false: colors.border, true: colors.tint }}
              thumbColor={preferences.optionalNotifications ? '#FFFFFF' : colors.background}
              disabled={updating || !preferences.notificationsEnabled}
            />
          </View>
        </ThemedView>

        {/* Delivery Channels Section */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Delivery Channels
          </ThemedText>

          <View style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.settingIcon}>
              <IconSymbol name="iphone" size={24} color={colors.tint} />
            </View>
            <View style={styles.settingContent}>
              <ThemedText type="defaultSemiBold" style={styles.settingTitle}>
                Push Notifications
              </ThemedText>
              <ThemedText style={[styles.settingDescription, { color: colors.textSecondary }]}>
                {deviceToken ? 'Device registered for push notifications' : 'Device not registered'}
              </ThemedText>
            </View>
            <Switch
              value={preferences.pushNotifications}
              onValueChange={(value) => handleToggle('pushNotifications', value)}
              trackColor={{ false: colors.border, true: colors.tint }}
              thumbColor={preferences.pushNotifications ? '#FFFFFF' : colors.background}
              disabled={updating || !preferences.notificationsEnabled}
            />
          </View>

          <View style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.settingIcon}>
              <IconSymbol name="envelope.fill" size={24} color={colors.tint} />
            </View>
            <View style={styles.settingContent}>
              <ThemedText type="defaultSemiBold" style={styles.settingTitle}>
                Email Notifications
              </ThemedText>
              <ThemedText style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Receive notifications via email
              </ThemedText>
            </View>
            <Switch
              value={preferences.emailNotifications}
              onValueChange={(value) => handleToggle('emailNotifications', value)}
              trackColor={{ false: colors.border, true: colors.tint }}
              thumbColor={preferences.emailNotifications ? '#FFFFFF' : colors.background}
              disabled={updating || !preferences.notificationsEnabled}
            />
          </View>
        </ThemedView>

        {/* Specific Notifications Section */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Specific Notifications
          </ThemedText>

          <View style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.settingIcon}>
              <IconSymbol name="cube.box.fill" size={24} color={colors.warning || colors.tint} />
            </View>
            <View style={styles.settingContent}>
              <ThemedText type="defaultSemiBold" style={styles.settingTitle}>
                Stock Alerts
              </ThemedText>
              <ThemedText style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Alert when {preferences.stockAlertThreshold} or fewer diapers remain
              </ThemedText>
            </View>
            <Switch
              value={preferences.stockAlertEnabled}
              onValueChange={(value) => handleToggle('stockAlertEnabled', value)}
              trackColor={{ false: colors.border, true: colors.tint }}
              thumbColor={preferences.stockAlertEnabled ? '#FFFFFF' : colors.background}
              disabled={updating || !preferences.notificationsEnabled}
            />
          </View>

          <View style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.settingIcon}>
              <IconSymbol name="clock.fill" size={24} color={colors.info || colors.tint} />
            </View>
            <View style={styles.settingContent}>
              <ThemedText type="defaultSemiBold" style={styles.settingTitle}>
                Change Reminders
              </ThemedText>
              <ThemedText style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Remind to check diaper every {preferences.changeReminderIntervalHours} hours
              </ThemedText>
            </View>
            <Switch
              value={preferences.changeReminderEnabled}
              onValueChange={(value) => handleToggle('changeReminderEnabled', value)}
              trackColor={{ false: colors.border, true: colors.tint }}
              thumbColor={preferences.changeReminderEnabled ? '#FFFFFF' : colors.background}
              disabled={updating || !preferences.notificationsEnabled}
            />
          </View>

          <View style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.settingIcon}>
              <IconSymbol name="calendar.badge.exclamationmark" size={24} color={colors.error} />
            </View>
            <View style={styles.settingContent}>
              <ThemedText type="defaultSemiBold" style={styles.settingTitle}>
                Expiry Warnings
              </ThemedText>
              <ThemedText style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Warn {preferences.expiryWarningDays} days before products expire
              </ThemedText>
            </View>
            <Switch
              value={preferences.expiryWarningEnabled}
              onValueChange={(value) => handleToggle('expiryWarningEnabled', value)}
              trackColor={{ false: colors.border, true: colors.tint }}
              thumbColor={preferences.expiryWarningEnabled ? '#FFFFFF' : colors.background}
              disabled={updating || !preferences.notificationsEnabled}
            />
          </View>

          <View style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.settingIcon}>
              <IconSymbol name="heart.text.square.fill" size={24} color={colors.success || colors.tint} />
            </View>
            <View style={styles.settingContent}>
              <ThemedText type="defaultSemiBold" style={styles.settingTitle}>
                Health Tips
              </ThemedText>
              <ThemedText style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Receive helpful parenting and health tips
              </ThemedText>
            </View>
            <Switch
              value={preferences.healthTipsEnabled}
              onValueChange={(value) => handleToggle('healthTipsEnabled', value)}
              trackColor={{ false: colors.border, true: colors.tint }}
              thumbColor={preferences.healthTipsEnabled ? '#FFFFFF' : colors.background}
              disabled={updating || !preferences.notificationsEnabled}
            />
          </View>
        </ThemedView>

        {/* PIPEDA Consent Section */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Privacy & Consent
          </ThemedText>

          {/* Canadian Privacy Notice */}
          <View style={[styles.canadianNotice, { backgroundColor: colors.surface, borderColor: colors.info }]}>
            <IconSymbol name="checkmark.shield.fill" size={24} color={colors.info} />
            <View style={styles.canadianNoticeContent}>
              <ThemedText type="defaultSemiBold" style={[styles.canadianTitle, { color: colors.info }]}>
                Protected by Canadian Privacy Laws
              </ThemedText>
              <ThemedText style={[styles.canadianDescription, { color: colors.textSecondary }]}>
                Your notification preferences are stored in Canada and protected under PIPEDA regulations.
              </ThemedText>
            </View>
          </View>

          <View style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.settingIcon}>
              <IconSymbol name="checkmark.circle.fill" size={24} color={preferences.notificationConsentGranted ? colors.success || colors.tint : colors.textSecondary} />
            </View>
            <View style={styles.settingContent}>
              <ThemedText type="defaultSemiBold" style={styles.settingTitle}>
                Notification Consent
              </ThemedText>
              <ThemedText style={[styles.settingDescription, { color: colors.textSecondary }]}>
                I consent to receiving notifications as configured above
                {preferences.notificationConsentDate && (
                  <Text style={styles.consentDate}>
                    {'\n'}Granted: {new Date(preferences.notificationConsentDate).toLocaleDateString()}
                  </Text>
                )}
              </ThemedText>
            </View>
            <Switch
              value={preferences.notificationConsentGranted}
              onValueChange={(value) => handleToggle('notificationConsentGranted', value)}
              trackColor={{ false: colors.border, true: colors.tint }}
              thumbColor={preferences.notificationConsentGranted ? '#FFFFFF' : colors.background}
              disabled={updating}
            />
          </View>

          <View style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.settingIcon}>
              <IconSymbol name="envelope.badge.fill" size={24} color={preferences.marketingConsentGranted ? colors.success || colors.tint : colors.textSecondary} />
            </View>
            <View style={styles.settingContent}>
              <ThemedText type="defaultSemiBold" style={styles.settingTitle}>
                Marketing Communications
              </ThemedText>
              <ThemedText style={[styles.settingDescription, { color: colors.textSecondary }]}>
                I consent to receiving promotional content and product updates (optional)
                {preferences.marketingConsentDate && (
                  <Text style={styles.consentDate}>
                    {'\n'}Granted: {new Date(preferences.marketingConsentDate).toLocaleDateString()}
                  </Text>
                )}
              </ThemedText>
            </View>
            <Switch
              value={preferences.marketingConsentGranted && preferences.marketingEnabled}
              onValueChange={(value) => {
                handleToggle('marketingConsentGranted', value);
                if (value) {
                  handleToggle('marketingEnabled', value);
                }
              }}
              trackColor={{ false: colors.border, true: colors.tint }}
              thumbColor={preferences.marketingConsentGranted ? '#FFFFFF' : colors.background}
              disabled={updating}
            />
          </View>
        </ThemedView>

        {/* Development Section (only in dev mode) */}
        {__DEV__ && (
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Development Tools
            </ThemedText>

            <TouchableOpacity
              style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => setShowTestModal(true)}
            >
              <View style={styles.settingIcon}>
                <IconSymbol name="testtube.2" size={24} color={colors.tint} />
              </View>
              <View style={styles.settingContent}>
                <ThemedText type="defaultSemiBold" style={styles.settingTitle}>
                  Test Notification
                </ThemedText>
                <ThemedText style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  Send a test notification to verify setup
                </ThemedText>
              </View>
              <IconSymbol name="chevron.right" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </ThemedView>
        )}

        {/* Bottom spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Time Picker Modal */}
      {timePicker.visible && (
        <Modal transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.timePickerContainer, { backgroundColor: colors.background }]}>
              <View style={styles.timePickerHeader}>
                <TouchableOpacity onPress={() => setTimePicker(prev => ({ ...prev, visible: false }))}>
                  <ThemedText style={[styles.timePickerButton, { color: colors.textSecondary }]}>
                    Cancel
                  </ThemedText>
                </TouchableOpacity>
                <ThemedText type="defaultSemiBold">
                  {timePicker.type === 'start' ? 'Quiet Hours Start' : 'Quiet Hours End'}
                </ThemedText>
                <TouchableOpacity
                  onPress={() => {
                    handleTimeChange(
                      timePicker.type === 'start' ? 'quietHoursStart' : 'quietHoursEnd',
                      timePicker.value
                    );
                    setTimePicker(prev => ({ ...prev, visible: false }));
                  }}
                >
                  <ThemedText style={[styles.timePickerButton, { color: colors.tint }]}>
                    Done
                  </ThemedText>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={timePicker.value}
                mode="time"
                display="spinner"
                onChange={(event, selectedDate) => {
                  if (selectedDate) {
                    setTimePicker(prev => ({ ...prev, value: selectedDate }));
                  }
                }}
                style={styles.timePicker}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Test Notification Modal */}
      <Modal
        visible={showTestModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTestModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowTestModal(false)}>
          <View style={[styles.testModalContainer, { backgroundColor: colors.background }]}>
            <Pressable onPress={(e) => e.stopPropagation()}>
              <ThemedText type="subtitle" style={styles.testModalTitle}>
                Test Notification
              </ThemedText>

              <TextInput
                style={[
                  styles.testInput,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.text
                  }
                ]}
                value={testMessage}
                onChangeText={setTestMessage}
                placeholder="Enter test message..."
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={3}
              />

              <View style={styles.testModalButtons}>
                <TouchableOpacity
                  style={[styles.testButton, styles.testCancelButton, { backgroundColor: colors.surface }]}
                  onPress={() => setShowTestModal(false)}
                >
                  <ThemedText style={[styles.testButtonText, { color: colors.text }]}>
                    Cancel
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.testButton, styles.testSendButton, { backgroundColor: colors.tint }]}
                  onPress={handleTestNotification}
                  disabled={testingNotification}
                >
                  {testingNotification ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <ThemedText style={[styles.testButtonText, { color: '#FFFFFF' }]}>
                      Send Test
                    </ThemedText>
                  )}
                </TouchableOpacity>
              </View>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </ThemedView>
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
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  settingIcon: {
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  timeContainer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  timeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 16,
  },
  canadianNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 16,
    gap: 12,
  },
  canadianNoticeContent: {
    flex: 1,
  },
  canadianTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  canadianDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  consentDate: {
    fontSize: 12,
    fontStyle: 'italic',
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
    paddingHorizontal: 32,
    gap: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  timePickerContainer: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 32,
  },
  timePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  timePickerButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  timePicker: {
    height: 200,
  },
  testModalContainer: {
    margin: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  testModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  testInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    marginBottom: 20,
    minHeight: 80,
  },
  testModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  testButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  testCancelButton: {},
  testSendButton: {},
  testButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});