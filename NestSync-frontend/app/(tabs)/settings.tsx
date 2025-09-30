import React, { useState, useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, View, Text, TouchableOpacity, Switch, Alert, TextInput, Modal, Pressable } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import NotificationPreferencesModal from '@/components/settings/NotificationPreferences';
import FamilyManagement from '@/components/collaboration/FamilyManagement';
import { useEmergencyProfiles } from '@/hooks/useEmergencyProfiles';
import { getEmergencyStorage } from '@/lib/storage/EmergencyStorageService';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAsyncStorage } from '@/hooks/useUniversalStorage';
import { useCurrentFamily, useCollaborationAvailable } from '@/lib/graphql/collaboration-hooks';
import { usePendingInvitationsCount } from '@/stores/collaborationStore';
import { useTrialOnboarding } from '@/hooks/useTrialOnboarding';

interface SettingItem {
  id: string;
  title: string;
  description?: string;
  icon: string;
  type: 'navigation' | 'toggle' | 'info';
  value?: boolean;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
}

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme as keyof typeof Colors ?? 'light'];
  const router = useRouter();
  
  // Privacy settings state
  const [dataSharing, setDataSharing] = useState(false);
  const [analyticsOptIn, setAnalyticsOptIn] = useState(false);
  const [marketingEmails, setMarketingEmails] = useState(false);

  // Notification preferences modal state
  const [showNotificationPreferences, setShowNotificationPreferences] = useState(false);

  // Collaboration state
  const { currentFamily, isCollaborationEnabled } = useCollaborationAvailable();
  const pendingInvitationsCount = usePendingInvitationsCount();
  const [showFamilyManagement, setShowFamilyManagement] = useState(false);

  // Trial onboarding tooltips for Canadian data privacy
  const {
    showCanadianDataTooltip,
    canShowTooltips,
    TooltipComponent
  } = useTrialOnboarding();

  // Refs for tooltip positioning
  const canadianNoticeRef = useRef(null);
  const dataExportRef = useRef(null);

  // Emergency system state
  const {
    emergencyProfiles,
    isEmergencyDataComplete,
    emergencySetupProgress
  } = useEmergencyProfiles();
  const [isEmergencyModeEnabled, setIsEmergencyModeEnabled] = useState(false);

  // Inventory preferences state
  const [inventoryPreferences, setInventoryPreferences] = useAsyncStorage('nestsync_inventory_preferences');
  const [lowStockThreshold, setLowStockThreshold] = useState(5);
  const [criticalStockThreshold, setCriticalStockThreshold] = useState(2);
  const [inventoryNotifications, setInventoryNotifications] = useState(true);
  const [autoReorderSuggestions, setAutoReorderSuggestions] = useState(true);
  const [showThresholdModal, setShowThresholdModal] = useState(false);
  const [editingThreshold, setEditingThreshold] = useState<'low' | 'critical' | null>(null);
  const [tempThresholdValue, setTempThresholdValue] = useState('');

  // Load inventory preferences on mount
  useEffect(() => {
    if (inventoryPreferences) {
      try {
        const prefs = JSON.parse(inventoryPreferences);
        setLowStockThreshold(prefs.lowStockThreshold || 5);
        setCriticalStockThreshold(prefs.criticalStockThreshold || 2);
        setInventoryNotifications(prefs.inventoryNotifications !== false);
        setAutoReorderSuggestions(prefs.autoReorderSuggestions !== false);
      } catch (error) {
        console.error('Failed to parse inventory preferences:', error);
      }
    }
  }, [inventoryPreferences]);

  // Load emergency mode state
  useEffect(() => {
    try {
      const emergencyStorage = getEmergencyStorage();
      const isActive = emergencyStorage.isEmergencyModeActive();
      setIsEmergencyModeEnabled(isActive);
    } catch (error) {
      console.error('Failed to load emergency mode state:', error);
    }
  }, []);

  // Show Canadian data privacy tooltip for trial users after screen loads
  useEffect(() => {
    if (canShowTooltips && canadianNoticeRef.current) {
      const timer = setTimeout(() => {
        showCanadianDataTooltip(canadianNoticeRef.current);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [canShowTooltips, showCanadianDataTooltip]);

  // Save inventory preferences
  const saveInventoryPreferences = async (newPrefs: Partial<{
    lowStockThreshold: number;
    criticalStockThreshold: number;
    inventoryNotifications: boolean;
    autoReorderSuggestions: boolean;
  }>) => {
    try {
      const currentPrefs = inventoryPreferences ? JSON.parse(inventoryPreferences) : {};
      const updatedPrefs = { ...currentPrefs, ...newPrefs };
      await setInventoryPreferences(JSON.stringify(updatedPrefs));
    } catch (error) {
      console.error('Failed to save inventory preferences:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: () => {
            // TODO: Implement logout logic with auth store
            console.log('Signing out...');
          }
        }
      ]
    );
  };

  const handleDataExport = () => {
    Alert.alert(
      'Data Export',
      'Your data export will be prepared and emailed to you within 24 hours.',
      [{ text: 'OK' }]
    );
  };

  const handleDataDeletion = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete Account', 
          style: 'destructive',
          onPress: () => {
            // TODO: Implement account deletion
            console.log('Account deletion requested...');
          }
        }
      ]
    );
  };

  // Threshold editing handlers
  const handleEditThreshold = (type: 'low' | 'critical') => {
    setEditingThreshold(type);
    setTempThresholdValue(String(type === 'low' ? lowStockThreshold : criticalStockThreshold));
    setShowThresholdModal(true);
  };

  const handleSaveThreshold = async () => {
    const value = parseInt(tempThresholdValue);
    if (isNaN(value) || value < 1) {
      Alert.alert('Invalid Value', 'Please enter a number greater than 0');
      return;
    }

    if (editingThreshold === 'low') {
      if (value <= criticalStockThreshold) {
        Alert.alert('Invalid Value', 'Low stock threshold must be greater than critical stock threshold');
        return;
      }
      setLowStockThreshold(value);
      await saveInventoryPreferences({ lowStockThreshold: value });
    } else if (editingThreshold === 'critical') {
      if (value >= lowStockThreshold) {
        Alert.alert('Invalid Value', 'Critical stock threshold must be less than low stock threshold');
        return;
      }
      setCriticalStockThreshold(value);
      await saveInventoryPreferences({ criticalStockThreshold: value });
    }

    setShowThresholdModal(false);
    setEditingThreshold(null);
  };

  const handleInventoryNotificationToggle = async (value: boolean) => {
    setInventoryNotifications(value);
    await saveInventoryPreferences({ inventoryNotifications: value });
  };

  const handleAutoReorderToggle = async (value: boolean) => {
    setAutoReorderSuggestions(value);
    await saveInventoryPreferences({ autoReorderSuggestions: value });
  };

  // Emergency system handlers
  const handleEmergencyModeToggle = async (value: boolean) => {
    try {
      const emergencyStorage = getEmergencyStorage();

      if (value && !isEmergencyDataComplete) {
        Alert.alert(
          'Emergency Setup Required',
          `Your emergency profiles are ${emergencySetupProgress}% complete. Please complete emergency contact and medical information setup before enabling emergency mode.`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Set Up Now',
              onPress: () => {
                console.log('Navigate to emergency setup');
                // TODO: Navigate to emergency setup screen
              }
            }
          ]
        );
        return;
      }

      emergencyStorage.setEmergencyMode(value);
      setIsEmergencyModeEnabled(value);

      if (value) {
        Alert.alert(
          'Emergency Mode Enabled',
          'Emergency mode is now active. You can quickly access emergency contacts and medical information.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Failed to toggle emergency mode:', error);
      Alert.alert(
        'Error',
        'Failed to toggle emergency mode. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleEmergencySetup = () => {
    console.log('Navigate to emergency test screen');
    // Navigate to emergency test screen for setup and testing
    try {
      // Use router.push to navigate to the emergency test screen
      router.push('/emergency-test');
    } catch (error) {
      console.error('Failed to navigate to emergency setup:', error);
      Alert.alert(
        'Navigation Error',
        'Unable to open emergency setup. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const accountSettings: SettingItem[] = [
    {
      id: 'profile',
      title: 'Profile Information',
      description: 'Update your personal details',
      icon: 'person.circle',
      type: 'navigation',
      onPress: () => router.push('/profile-settings')
    },
    {
      id: 'children',
      title: 'Children Profiles',
      description: 'Manage your children\'s information',
      icon: 'figure.2.and.child.holdinghands',
      type: 'navigation',
      onPress: () => router.push('/children-management')
    },
    {
      id: 'notifications',
      title: 'Notification Settings',
      description: 'Manage alerts, reminders, and delivery preferences',
      icon: 'bell.fill',
      type: 'navigation',
      onPress: () => setShowNotificationPreferences(true)
    }
  ];

  // Collaboration settings - only show if collaboration is enabled or if there are pending invitations
  const collaborationSettings: SettingItem[] = [];

  if (isCollaborationEnabled || pendingInvitationsCount > 0) {
    collaborationSettings.push({
      id: 'family-caregivers',
      title: 'Family & Caregivers',
      description: currentFamily
        ? `${currentFamily.name} • ${pendingInvitationsCount > 0 ? `${pendingInvitationsCount} pending` : 'Manage family'}`
        : 'Manage family collaboration',
      icon: 'person.3.fill',
      type: 'navigation',
      onPress: () => setShowFamilyManagement(true)
    });
  } else {
    // Show option to create family for collaboration
    collaborationSettings.push({
      id: 'create-family',
      title: 'Enable Family Sharing',
      description: 'Share care tracking with family and caregivers',
      icon: 'person.badge.plus',
      type: 'navigation',
      onPress: () => setShowFamilyManagement(true)
    });
  }

  const privacySettings: SettingItem[] = [
    {
      id: 'data-sharing',
      title: 'Anonymous Usage Data',
      description: 'Help improve NestSync (optional)',
      icon: 'chart.bar.xaxis',
      type: 'toggle',
      value: dataSharing,
      onToggle: setDataSharing
    },
    {
      id: 'analytics',
      title: 'Analytics & Performance',
      description: 'Improve app performance (optional)',
      icon: 'speedometer',
      type: 'toggle',
      value: analyticsOptIn,
      onToggle: setAnalyticsOptIn
    },
    {
      id: 'marketing',
      title: 'Marketing Communications',
      description: 'Receive product updates (optional)',
      icon: 'envelope.fill',
      type: 'toggle',
      value: marketingEmails,
      onToggle: setMarketingEmails
    }
  ];

  const inventorySettings: SettingItem[] = [
    {
      id: 'low-stock-threshold',
      title: 'Low Stock Alert',
      description: `Alert when ${lowStockThreshold} or fewer diapers remain`,
      icon: 'exclamationmark.triangle',
      type: 'navigation',
      onPress: () => handleEditThreshold('low')
    },
    {
      id: 'critical-stock-threshold',
      title: 'Critical Stock Alert',
      description: `Emergency alert at ${criticalStockThreshold} diapers`,
      icon: 'exclamationmark.octagon',
      type: 'navigation',
      onPress: () => handleEditThreshold('critical')
    },
    {
      id: 'inventory-notifications',
      title: 'Stock Notifications',
      description: 'Receive alerts when stock is running low',
      icon: 'bell.badge',
      type: 'toggle',
      value: inventoryNotifications,
      onToggle: handleInventoryNotificationToggle
    },
    {
      id: 'auto-reorder',
      title: 'Reorder Suggestions',
      description: 'Get smart suggestions for restocking',
      icon: 'cart.badge.plus',
      type: 'toggle',
      value: autoReorderSuggestions,
      onToggle: handleAutoReorderToggle
    }
  ];

  const emergencySettings: SettingItem[] = [
    {
      id: 'emergency-mode',
      title: 'Emergency Mode',
      description: isEmergencyDataComplete
        ? 'Quick access to emergency contacts and medical info'
        : `Setup ${emergencySetupProgress}% complete - complete setup to enable`,
      icon: 'cross.circle.fill',
      type: 'toggle',
      value: isEmergencyModeEnabled,
      onToggle: handleEmergencyModeToggle
    },
    {
      id: 'emergency-setup',
      title: 'Emergency Profiles Setup',
      description: `${emergencyProfiles.length} profiles configured • ${emergencySetupProgress}% complete`,
      icon: 'person.fill.badge.plus',
      type: 'navigation',
      onPress: handleEmergencySetup
    }
  ];

  const dataRightsSettings: SettingItem[] = [
    {
      id: 'export',
      title: 'Export My Data',
      description: 'Download all your data (PIPEDA Right)',
      icon: 'square.and.arrow.down',
      type: 'navigation',
      onPress: handleDataExport
    },
    {
      id: 'delete',
      title: 'Delete Account',
      description: 'Permanently delete all data',
      icon: 'trash.fill',
      type: 'navigation',
      onPress: handleDataDeletion
    }
  ];

  const renderSettingItem = (item: SettingItem) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={item.type === 'navigation' ? item.onPress : undefined}
      disabled={item.type === 'toggle'}
      accessibilityRole={item.type === 'navigation' ? 'button' : 'none'}
      accessibilityLabel={`${item.title}. ${item.description || ''}`}
    >
      <View style={styles.settingIcon}>
        <IconSymbol 
          name={item.icon} 
          size={24} 
          color={item.id === 'delete' ? colors.error : colors.tint} 
        />
      </View>
      <View style={styles.settingContent}>
        <ThemedText type="defaultSemiBold" style={[
          styles.settingTitle,
          item.id === 'delete' && { color: colors.error }
        ]}>
          {item.title}
        </ThemedText>
        {item.description && (
          <ThemedText style={[styles.settingDescription, { color: colors.textSecondary }]}>
            {item.description}
          </ThemedText>
        )}
      </View>
      <View style={styles.settingAction}>
        {item.type === 'toggle' ? (
          <Switch
            value={item.value}
            onValueChange={item.onToggle}
            trackColor={{ false: colors.border, true: colors.tint }}
            thumbColor={item.value ? '#FFFFFF' : colors.background}
            accessibilityLabel={`Toggle ${item.title}`}
          />
        ) : (
          <IconSymbol 
            name="chevron.right" 
            size={16} 
            color={colors.textSecondary} 
          />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        {/* Header */}
        <ThemedView style={styles.header}>
          <ThemedText type="title" style={styles.headerTitle}>Settings</ThemedText>
          <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
            Account management and privacy controls
          </ThemedText>
        </ThemedView>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Account Section */}
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Account
            </ThemedText>
            {accountSettings.map(renderSettingItem)}
          </ThemedView>

          {/* Collaboration Section */}
          {collaborationSettings.length > 0 && (
            <ThemedView style={styles.section}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Family Collaboration
              </ThemedText>
              <ThemedView style={[styles.collaborationNotice, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <IconSymbol name="checkmark.shield.fill" size={20} color={colors.info} />
                <ThemedText style={[styles.collaborationNoticeText, { color: colors.textSecondary }]}>
                  Securely share your child's care data with trusted family members and caregivers. All data remains in Canada.
                </ThemedText>
              </ThemedView>
              {collaborationSettings.map(renderSettingItem)}
            </ThemedView>
          )}

          {/* Inventory Section */}
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Inventory & Notifications
            </ThemedText>
            <ThemedView style={[styles.inventoryNotice, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <IconSymbol name="cube.box" size={20} color={colors.tint} />
              <ThemedText style={[styles.inventoryNoticeText, { color: colors.textSecondary }]}>
                Set up automatic alerts to help you stay ahead of running out of diapers.
              </ThemedText>
            </ThemedView>
            {inventorySettings.map(renderSettingItem)}
          </ThemedView>

          {/* Emergency Section */}
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Emergency & Safety
            </ThemedText>
            <ThemedView style={[styles.emergencyNotice, {
              backgroundColor: colors.surface,
              borderColor: isEmergencyDataComplete ? colors.info : colors.warning
            }]}>
              <IconSymbol
                name={isEmergencyDataComplete ? "checkmark.shield.fill" : "exclamationmark.triangle.fill"}
                size={20}
                color={isEmergencyDataComplete ? colors.info : colors.warning}
              />
              <ThemedText style={[styles.emergencyNoticeText, { color: colors.textSecondary }]}>
                {isEmergencyDataComplete
                  ? "Emergency system is ready. Quick access to contacts and medical info during emergencies."
                  : "Set up emergency contacts and medical information for your children to enable emergency mode."
                }
              </ThemedText>
            </ThemedView>
            {emergencySettings.map(renderSettingItem)}
          </ThemedView>

          {/* Privacy Section */}
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Privacy & Consent
            </ThemedText>
            <ThemedView style={[styles.privacyNotice, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <IconSymbol name="info.circle.fill" size={20} color={colors.info} />
              <ThemedText style={[styles.privacyNoticeText, { color: colors.textSecondary }]}>
                All settings below are optional. You can change these anytime to control how your data is used.
              </ThemedText>
            </ThemedView>
            {privacySettings.map(renderSettingItem)}
          </ThemedView>

          {/* Data Rights Section */}
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Your Data Rights
            </ThemedText>
            <ThemedView ref={canadianNoticeRef} style={[styles.canadianNotice, { backgroundColor: colors.surface, borderColor: colors.info }]}>
              <IconSymbol name="checkmark.shield.fill" size={24} color={colors.info} />
              <View style={styles.canadianNoticeContent}>
                <ThemedText type="defaultSemiBold" style={[styles.canadianTitle, { color: colors.info }]}>
                  Protected by Canadian Privacy Laws
                </ThemedText>
                <ThemedText style={[styles.canadianDescription, { color: colors.textSecondary }]}>
                  Your data is stored in Canada and protected under PIPEDA regulations.
                </ThemedText>
              </View>
            </ThemedView>
            {dataRightsSettings.map(renderSettingItem)}
          </ThemedView>

          {/* Support Section */}
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Support
            </ThemedText>
            <TouchableOpacity
              style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
              accessibilityRole="button"
              accessibilityLabel="Contact support"
            >
              <View style={styles.settingIcon}>
                <IconSymbol name="questionmark.circle" size={24} color={colors.tint} />
              </View>
              <View style={styles.settingContent}>
                <ThemedText type="defaultSemiBold" style={styles.settingTitle}>
                  Help & Support
                </ThemedText>
                <ThemedText style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  Get help or report issues
                </ThemedText>
              </View>
              <View style={styles.settingAction}>
                <IconSymbol name="chevron.right" size={16} color={colors.textSecondary} />
              </View>
            </TouchableOpacity>
          </ThemedView>

          {/* Logout Button */}
          <TouchableOpacity
            style={[styles.logoutButton, { backgroundColor: colors.error }]}
            onPress={handleLogout}
            accessibilityRole="button"
            accessibilityLabel="Sign out of your account"
          >
            <IconSymbol name="arrow.right.square" size={20} color="#FFFFFF" />
            <ThemedText style={styles.logoutText}>Sign Out</ThemedText>
          </TouchableOpacity>

          {/* App Version */}
          <ThemedView style={styles.versionInfo}>
            <ThemedText style={[styles.versionText, { color: colors.textSecondary }]}>
              NestSync v1.2.0
            </ThemedText>
            <ThemedText style={[styles.versionSubtext, { color: colors.textSecondary }]}>
              Made with care for Canadian families
            </ThemedText>
          </ThemedView>

          {/* Bottom spacing for tab bar */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Notification Preferences Modal */}
        <Modal
          visible={showNotificationPreferences}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowNotificationPreferences(false)}
        >
          <NotificationPreferencesModal onClose={() => setShowNotificationPreferences(false)} />
        </Modal>

        {/* Family Management Modal */}
        <Modal
          visible={showFamilyManagement}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={() => setShowFamilyManagement(false)}
        >
          <FamilyManagement onClose={() => setShowFamilyManagement(false)} />
        </Modal>

        {/* Threshold Editing Modal */}
        <Modal
          visible={showThresholdModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowThresholdModal(false)}
        >
          <Pressable 
            style={styles.modalOverlay}
            onPress={() => setShowThresholdModal(false)}
          >
            <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
              <Pressable onPress={(e) => e.stopPropagation()}>
                <View style={styles.modalHeader}>
                  <ThemedText type="subtitle" style={styles.modalTitle}>
                    {editingThreshold === 'low' ? 'Low Stock Alert' : 'Critical Stock Alert'}
                  </ThemedText>
                  <TouchableOpacity
                    onPress={() => setShowThresholdModal(false)}
                    style={[styles.modalCloseButton, { backgroundColor: colors.surface }]}
                  >
                    <IconSymbol name="xmark" size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <ThemedText style={[styles.modalDescription, { color: colors.textSecondary }]}>
                  {editingThreshold === 'low' 
                    ? 'Set the number of diapers remaining when you want to receive a low stock alert.'
                    : 'Set the critical threshold for emergency stock alerts. This should be less than your low stock alert.'}
                </ThemedText>

                <View style={styles.inputContainer}>
                  <ThemedText style={[styles.inputLabel, { color: colors.text }]}>
                    Number of diapers:
                  </ThemedText>
                  <TextInput
                    style={[
                      styles.thresholdInput,
                      { 
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                        color: colors.text
                      }
                    ]}
                    value={tempThresholdValue}
                    onChangeText={setTempThresholdValue}
                    keyboardType="numeric"
                    placeholder="Enter number"
                    placeholderTextColor={colors.textSecondary}
                    autoFocus
                    selectTextOnFocus
                  />
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.surface }]}
                    onPress={() => setShowThresholdModal(false)}
                  >
                    <ThemedText style={[styles.buttonText, { color: colors.text }]}>
                      Cancel
                    </ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.saveButton, { backgroundColor: colors.tint }]}
                    onPress={handleSaveThreshold}
                  >
                    <ThemedText style={[styles.buttonText, { color: '#FFFFFF' }]}>
                      Save
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </Pressable>
            </View>
          </Pressable>
        </Modal>

        {/* Trial Onboarding Tooltips */}
        {TooltipComponent}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
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
  settingAction: {
    marginLeft: 12,
  },
  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    gap: 12,
  },
  privacyNoticeText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
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
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginVertical: 20,
    gap: 8,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  versionInfo: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  versionText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  versionSubtext: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  // Inventory section styles
  inventoryNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    gap: 12,
  },
  inventoryNoticeText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  // Collaboration section styles
  collaborationNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    gap: 12,
  },
  collaborationNoticeText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  // Emergency section styles
  emergencyNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 16,
    gap: 12,
  },
  emergencyNoticeText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalCloseButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  thresholdInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    // Style handled by backgroundColor from colors
  },
  saveButton: {
    // Style handled by backgroundColor from colors
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});