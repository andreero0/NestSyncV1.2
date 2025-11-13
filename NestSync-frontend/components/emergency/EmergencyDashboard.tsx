import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Dimensions,
  SafeAreaView,
  Linking,
  useColorScheme,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { emergencyStorage, EmergencyProfile } from '../../lib/storage/EmergencyStorageService';
import { Colors, NestSyncColors } from '../../constants/Colors';
import EmergencyContactCard from './EmergencyContactCard';
import MedicalInfoCard from './MedicalInfoCard';
import EmergencyShareModal from './EmergencyShareModal';

interface EmergencyDashboardProps {
  onExitEmergencyMode?: () => void;
}

interface QuickActionTileProps {
  title: string;
  subtitle: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
  onPress: () => void;
  isUrgent?: boolean;
  size?: 'small' | 'large';
}

const QuickActionTile: React.FC<QuickActionTileProps> = ({
  title,
  subtitle,
  icon,
  color,
  onPress,
  isUrgent = false,
  size = 'large',
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const handlePress = async () => {
    await Haptics.impactAsync(
      isUrgent ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Medium
    );
    onPress();
  };

  const tileSize = size === 'large' ? styles.largeTile : styles.smallTile;

  return (
    <TouchableOpacity
      style={[
        styles.actionTile,
        tileSize,
        { backgroundColor: color },
        isPressed && styles.actionTilePressed,
        isUrgent && styles.urgentTile,
      ]}
      onPress={handlePress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      activeOpacity={0.8}
      accessibilityLabel={`${title}: ${subtitle}`}
      accessibilityRole="button"
    >
      <View style={styles.tileContent}>
        <MaterialIcons
          name={icon}
          size={size === 'large' ? 36 : 28}
          color="#FFFFFF"
          style={styles.tileIcon}
        />
        <Text style={[
          styles.tileTitle,
          { fontSize: size === 'large' ? 16 : 14 },
        ]}>
          {title}
        </Text>
        <Text style={[
          styles.tileSubtitle,
          { fontSize: size === 'large' ? 12 : 10 },
        ]}>
          {subtitle}
        </Text>
        {isUrgent && (
          <View style={styles.urgentBadge}>
            <Text style={styles.urgentText}>URGENT</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const EmergencyDashboard: React.FC<EmergencyDashboardProps> = ({
  onExitEmergencyMode,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [emergencyProfiles, setEmergencyProfiles] = useState<EmergencyProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<EmergencyProfile | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [storageHealth, setStorageHealth] = useState({ isHealthy: true, lastAccessTime: 0 });

  const router = useRouter();
  const { width } = Dimensions.get('window');

  // Load emergency profiles on mount
  useEffect(() => {
    loadEmergencyProfiles();
    checkStorageHealth();
  }, []);

  // Auto-refresh emergency profiles every 30 seconds in emergency mode
  useEffect(() => {
    const interval = setInterval(() => {
      checkStorageHealth();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadEmergencyProfiles = () => {
    try {
      const profiles = emergencyStorage.getAllEmergencyProfiles();
      setEmergencyProfiles(profiles);

      if (profiles.length > 0) {
        setSelectedProfile(profiles[0]); // Default to first profile
      }
    } catch (error) {
      console.error('Failed to load emergency profiles:', error);
      Alert.alert(
        'Error',
        'Unable to load emergency information. Please check your data.',
        [{ text: 'OK' }]
      );
    }
  };

  const checkStorageHealth = () => {
    const health = emergencyStorage.getStorageHealth();
    setStorageHealth(health);

    if (!health.isHealthy) {
      console.warn('Emergency storage performance warning:', health);
    }
  };

  // Emergency actions
  const call911 = () => {
    Alert.alert(
      '🚨 Call 911 Emergency Services',
      'This will call emergency services. Are you sure you want to proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call 911',
          style: 'destructive',
          onPress: () => Linking.openURL('tel:911'),
        },
      ]
    );
  };

  const callPoisonControl = () => {
    Alert.alert(
      '☠️ Call Poison Control',
      'This will call the Canadian Poison Control Centre.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call Now',
          style: 'destructive',
          onPress: () => Linking.openURL('tel:18002685391'), // Canadian Poison Control
        },
      ]
    );
  };

  const callTelehealth = () => {
    Alert.alert(
      '🏥 Call Telehealth Ontario',
      'This will call Telehealth Ontario for medical advice.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call Now',
          onPress: () => Linking.openURL('tel:8664797'),
        },
      ]
    );
  };

  const shareEmergencyInfo = () => {
    if (selectedProfile) {
      setShowShareModal(true);
    } else {
      Alert.alert(
        'No Profile Selected',
        'Please select a child profile to share emergency information.',
        [{ text: 'OK' }]
      );
    }
  };

  const exitEmergencyMode = () => {
    Alert.alert(
      'Exit Emergency Mode',
      'Are you sure you want to exit emergency mode?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Exit',
          onPress: () => {
            emergencyStorage.setEmergencyMode(false);
            onExitEmergencyMode?.();
            router.back();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Emergency Header */}
      <View style={[styles.emergencyHeader, { backgroundColor: NestSyncColors.semantic.error }]}>
        <View style={styles.headerContent}>
          <MaterialIcons name="emergency" size={32} color={colors.background} />
          <View style={styles.headerText}>
            <Text style={[styles.emergencyTitle, { color: colors.background }]}>EMERGENCY MODE</Text>
            <Text style={[styles.emergencySubtitle, { color: `${colors.background}CC` }]}>
              Instant access to emergency features
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.exitButton}
          onPress={exitEmergencyMode}
          accessibilityLabel="Exit emergency mode"
        >
          <MaterialIcons name="close" size={24} color={colors.background} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Critical Emergency Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: NestSyncColors.semantic.error }]}>CRITICAL EMERGENCY</Text>
          <View style={styles.emergencyGrid}>
            <QuickActionTile
              title="911"
              subtitle="Emergency Services"
              icon="emergency"
              color={NestSyncColors.semantic.error}
              onPress={call911}
              isUrgent={true}
              size="large"
            />
            <QuickActionTile
              title="Poison Control"
              subtitle="1-800-268-5391"
              icon="warning"
              color={NestSyncColors.accent.orange}
              onPress={callPoisonControl}
              isUrgent={true}
              size="large"
            />
          </View>
        </View>

        {/* Medical Support */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: NestSyncColors.semantic.error }]}>MEDICAL SUPPORT</Text>
          <View style={styles.supportGrid}>
            <QuickActionTile
              title="Telehealth"
              subtitle="Ontario 811"
              icon="local-hospital"
              color={NestSyncColors.primary.blue}
              onPress={callTelehealth}
              size="small"
            />
            <QuickActionTile
              title="Share Info"
              subtitle="Medical QR Code"
              icon="qr-code"
              color={NestSyncColors.secondary.green}
              onPress={shareEmergencyInfo}
              size="small"
            />
          </View>
        </View>

        {/* Child Selection */}
        {emergencyProfiles.length > 1 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: NestSyncColors.semantic.error }]}>SELECT CHILD</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.profileSelector}
            >
              {emergencyProfiles.map((profile) => (
                <TouchableOpacity
                  key={profile.childId}
                  style={[
                    styles.profileTile,
                    { backgroundColor: colors.surface },
                    selectedProfile?.childId === profile.childId && [
                      styles.selectedProfileTile,
                      { backgroundColor: NestSyncColors.primary.blue },
                    ],
                  ]}
                  onPress={() => setSelectedProfile(profile)}
                >
                  <MaterialIcons
                    name="child-care"
                    size={24}
                    color={selectedProfile?.childId === profile.childId ? colors.background : colors.textSecondary}
                  />
                  <Text style={[
                    styles.profileName,
                    { color: colors.textSecondary },
                    selectedProfile?.childId === profile.childId && [
                      styles.selectedProfileName,
                      { color: colors.background },
                    ],
                  ]}>
                    {profile.childName}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Emergency Contacts */}
        {selectedProfile && selectedProfile.emergencyContacts.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: NestSyncColors.semantic.error }]}>EMERGENCY CONTACTS</Text>
            {selectedProfile.emergencyContacts
              .filter(contact => contact.isPrimary)
              .slice(0, 2) // Show max 2 contacts in emergency mode
              .map((contact) => (
                <EmergencyContactCard
                  key={contact.id}
                  contact={contact}
                  childId={selectedProfile.childId}
                  size="large"
                  showLastContacted={false}
                />
              ))}
          </View>
        )}

        {/* Medical Information */}
        {selectedProfile && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: NestSyncColors.semantic.error }]}>MEDICAL INFORMATION</Text>
            <MedicalInfoCard
              medicalInfo={selectedProfile.medicalInfo}
              childName={selectedProfile.childName}
              isEmergencyMode={true}
            />
          </View>
        )}

        {/* Storage Health Warning */}
        {!storageHealth.isHealthy && (
          <View style={[
            styles.warningSection,
            {
              backgroundColor: `${NestSyncColors.accent.orange}10`,
              borderLeftColor: NestSyncColors.accent.orange,
            },
          ]}>
            <MaterialIcons name="warning" size={24} color={NestSyncColors.accent.orange} />
            <Text style={[styles.warningText, { color: NestSyncColors.accent.orange }]}>
              Storage performance warning: {storageHealth.lastAccessTime}ms access time
            </Text>
          </View>
        )}

        {/* Emergency Instructions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: NestSyncColors.semantic.error }]}>EMERGENCY INSTRUCTIONS</Text>
          <View style={[
            styles.instructionsContainer,
            {
              backgroundColor: colors.surface,
              borderLeftColor: NestSyncColors.primary.blue,
            },
          ]}>
            <Text style={[styles.instructionsText, { color: colors.text }]}>
              1. Stay calm and assess the situation{'\n'}
              2. Call 911 for life-threatening emergencies{'\n'}
              3. Share medical information with first responders{'\n'}
              4. Contact emergency contacts if needed{'\n'}
              5. Follow first responder instructions
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Emergency Share Modal */}
      {selectedProfile && (
        <EmergencyShareModal
          visible={showShareModal}
          onClose={() => setShowShareModal(false)}
          emergencyProfile={selectedProfile}
          isEmergencyMode={true}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emergencyHeader: {
    padding: 20,
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
  },
  emergencyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  emergencySubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  exitButton: {
    padding: 8,
  },
  scrollContent: {
    flex: 1,
  },
  section: {
    margin: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  emergencyGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  supportGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionTile: {
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
    elevation: 4,
  },
  largeTile: {
    height: 120,
    flex: 0.48,
  },
  smallTile: {
    height: 80,
    flex: 0.48,
  },
  actionTilePressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  urgentTile: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  tileContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileIcon: {
    marginBottom: 8,
  },
  tileTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  tileSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  urgentBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  urgentText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  profileSelector: {
    marginBottom: 8,
  },
  profileTile: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 12,
    borderRadius: 12,
    minWidth: 80,
  },
  selectedProfileTile: {},
  profileName: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
  selectedProfileName: {},
  warningSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  warningText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  instructionsContainer: {
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  instructionsText: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default EmergencyDashboard;