import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  SafeAreaView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  EmergencyContactCard,
  MedicalInfoCard,
  EmergencyShareModal,
  type EmergencyProfile,
  type EmergencyContact,
  type MedicalInfo,
} from '../components/emergency';
import { getEmergencyStorage } from '../lib/storage/EmergencyStorageService';

/**
 * Emergency Features Test Screen
 *
 * This screen provides a comprehensive test environment for all emergency
 * features during development. It includes sample data and interaction testing.
 *
 * Features tested:
 * - Emergency storage service functionality
 * - Component rendering and interactions
 * - QR code generation
 * - Phone call functionality (on device)
 * - MMKV storage performance
 */
export default function EmergencyTestScreen() {
  const router = useRouter();
  const [showShareModal, setShowShareModal] = useState(false);
  const [testProfile, setTestProfile] = useState<EmergencyProfile | null>(null);
  const [storageHealth, setStorageHealth] = useState({ isHealthy: true, lastAccessTime: 0 });

  // Sample test data
  const sampleEmergencyProfile: EmergencyProfile = {
    childId: 'test-child-1',
    childName: 'Emma Test',
    dateOfBirth: '2020-03-15',
    emergencyContacts: [
      {
        id: 'contact-1',
        name: 'Sarah Wilson',
        phoneNumber: '(416) 555-0123',
        relationship: 'Mother',
        isPrimary: true,
        lastContacted: '2024-01-15T10:30:00Z',
      },
      {
        id: 'contact-2',
        name: 'Dr. Michael Chen',
        phoneNumber: '(416) 555-0456',
        relationship: 'Pediatrician',
        isPrimary: false,
      },
      {
        id: 'contact-3',
        name: 'David Wilson',
        phoneNumber: '(416) 555-0789',
        relationship: 'Father',
        isPrimary: false,
      },
    ],
    medicalInfo: {
      id: 'medical-1',
      allergies: ['Peanuts', 'Tree nuts', 'Shellfish'],
      medications: ["Children's Tylenol (as needed)", 'EpiPen Jr (emergency use)'],
      medicalConditions: ['Severe food allergies', 'Asthma', 'Eczema'],
      bloodType: 'A+',
      emergencyMedicalInfo: 'SEVERE PEANUT ALLERGY - EpiPen in backpack. Call 911 immediately if exposed to nuts. History of anaphylaxis.',
      healthCardNumber: '1234567890',
      province: 'ON',
      lastUpdated: '2024-01-10T15:45:00Z',
    },
    lastSyncedAt: '2024-01-20T09:00:00Z',
  };

  // Test functions
  const testStoragePerformance = async () => {
    try {
      const storage = getEmergencyStorage();

      // Store test profile
      await storage.storeEmergencyProfile(sampleEmergencyProfile);

      // Measure retrieval performance
      const startTime = Date.now();
      const retrievedProfile = storage.getEmergencyProfile(sampleEmergencyProfile.childId);
      const accessTime = Date.now() - startTime;

      setStorageHealth({ isHealthy: accessTime < 100, lastAccessTime: accessTime });

      Alert.alert(
        'Storage Performance Test',
        `Profile retrieved in ${accessTime}ms\n${accessTime < 100 ? '✅ Performance target met' : '⚠️ Performance target missed'}\n\nTarget: <100ms for emergency access`,
        [{ text: 'OK' }]
      );

      if (retrievedProfile) {
        setTestProfile(retrievedProfile);
      }

    } catch (error) {
      Alert.alert('Test Failed', `Storage test failed: ${error}`, [{ text: 'OK' }]);
    }
  };

  const testQRCodeGeneration = () => {
    if (testProfile) {
      setShowShareModal(true);
    } else {
      Alert.alert(
        'No Test Data',
        'Please run storage performance test first to load test profile.',
        [{ text: 'OK' }]
      );
    }
  };

  const testEmergencyMode = () => {
    const storage = getEmergencyStorage();
    storage.setEmergencyMode(true);
    router.push('/emergency-dashboard');
  };

  const clearTestData = () => {
    Alert.alert(
      'Clear Test Data',
      'This will remove all emergency test data. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            const storage = getEmergencyStorage();
            storage.clearAllEmergencyData();
            setTestProfile(null);
            Alert.alert('Test Data Cleared', 'All emergency test data has been removed.', [{ text: 'OK' }]);
          },
        },
      ]
    );
  };

  const handleContactUsed = (contact: EmergencyContact) => {
    Alert.alert(
      'Emergency Contact Used',
      `Called ${contact.name} (${contact.relationship})\nThis usage has been recorded for analytics.`,
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emergency Features Test</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Test Controls */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Controls</Text>

          <TouchableOpacity style={styles.testButton} onPress={testStoragePerformance}>
            <MaterialIcons name="speed" size={24} color="#FFFFFF" />
            <Text style={styles.testButtonText}>Test Storage Performance</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.testButton} onPress={testQRCodeGeneration}>
            <MaterialIcons name="qr-code" size={24} color="#FFFFFF" />
            <Text style={styles.testButtonText}>Test QR Code Generation</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.testButton} onPress={testEmergencyMode}>
            <MaterialIcons name="emergency" size={24} color="#FFFFFF" />
            <Text style={styles.testButtonText}>Test Emergency Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.testButton, styles.dangerButton]} onPress={clearTestData}>
            <MaterialIcons name="delete" size={24} color="#FFFFFF" />
            <Text style={styles.testButtonText}>Clear Test Data</Text>
          </TouchableOpacity>
        </View>

        {/* Storage Health */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Storage Health</Text>
          <View style={styles.healthCard}>
            <MaterialIcons
              name={storageHealth.isHealthy ? 'check-circle' : 'warning'}
              size={24}
              color={storageHealth.isHealthy ? '#34C759' : '#FF6B00'}
            />
            <View style={styles.healthInfo}>
              <Text style={styles.healthText}>
                Performance: {storageHealth.isHealthy ? 'Healthy' : 'Warning'}
              </Text>
              <Text style={styles.healthSubtext}>
                Last access: {storageHealth.lastAccessTime}ms (target: &lt;100ms)
              </Text>
            </View>
          </View>
        </View>

        {/* Emergency Contacts Test */}
        {testProfile && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Emergency Contacts</Text>
            {testProfile.emergencyContacts.map((contact) => (
              <EmergencyContactCard
                key={contact.id}
                contact={contact}
                childId={testProfile.childId}
                onContactUsed={handleContactUsed}
                size="medium"
              />
            ))}
          </View>
        )}

        {/* Medical Information Test */}
        {testProfile && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Medical Information</Text>
            <MedicalInfoCard
              medicalInfo={testProfile.medicalInfo}
              childName={testProfile.childName}
              isEmergencyMode={false}
              showAllSections={true}
            />
          </View>
        )}

        {/* Test Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Instructions</Text>
          <View style={styles.instructionsCard}>
            <Text style={styles.instructionsText}>
              1. Tap "Test Storage Performance" to load sample data and measure MMKV speed{'\n'}
              2. Verify components render correctly with test data{'\n'}
              3. Test emergency contact calling (requires physical device){'\n'}
              4. Test QR code generation and sharing{'\n'}
              5. Test emergency dashboard navigation{'\n'}
              6. Verify offline functionality by disabling internet{'\n'}
              7. Check accessibility with screen reader enabled
            </Text>
          </View>
        </View>

        {/* Canadian Integration Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Canadian Integration</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              🇨🇦 Emergency Numbers:{'\n'}
              • 911 - Emergency Services{'\n'}
              • 1-800-268-5391 - Poison Control{'\n'}
              • 811 - Telehealth Ontario{'\n'}
              • 1-800-668-6868 - Kids Help Phone{'\n\n'}
              📋 Provincial Health Cards:{'\n'}
              • Ontario: 10 digits{'\n'}
              • Quebec: 12 digits{'\n'}
              • Alberta: 9 digits
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Emergency Share Modal */}
      {testProfile && (
        <EmergencyShareModal
          visible={showShareModal}
          onClose={() => setShowShareModal(false)}
          emergencyProfile={testProfile}
          isEmergencyMode={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  content: {
    flex: 1,
  },
  section: {
    margin: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 12,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  healthCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  healthInfo: {
    marginLeft: 12,
    flex: 1,
  },
  healthText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  healthSubtext: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  instructionsCard: {
    backgroundColor: '#F0F8FF',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  instructionsText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: '#FFF8F0',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B00',
  },
  infoText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
});