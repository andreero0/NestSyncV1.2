import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { MedicalInfo } from '../../lib/storage/EmergencyStorageService';

interface MedicalInfoCardProps {
  medicalInfo: MedicalInfo;
  childName: string;
  isEmergencyMode?: boolean;
  showAllSections?: boolean;
}

interface CollapsibleSectionProps {
  title: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  children: React.ReactNode;
  isImportant?: boolean;
  defaultExpanded?: boolean;
  isEmergencyMode?: boolean;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon,
  children,
  isImportant = false,
  defaultExpanded = false,
  isEmergencyMode = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded || isEmergencyMode);
  const [rotateAnimation] = useState(new Animated.Value(defaultExpanded ? 1 : 0));

  const toggleSection = async () => {
    const newState = !isExpanded;
    setIsExpanded(newState);

    // Light haptic feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Animate chevron rotation
    Animated.timing(rotateAnimation, {
      toValue: newState ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const chevronRotation = rotateAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  return (
    <View style={[
      styles.section,
      isImportant && styles.importantSection,
      isEmergencyMode && styles.emergencySection,
    ]}>
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={toggleSection}
        accessibilityLabel={`${title} section`}
        accessibilityHint={isExpanded ? 'Tap to collapse' : 'Tap to expand'}
        accessibilityRole="button"
      >
        <View style={styles.sectionTitleContainer}>
          <MaterialIcons
            name={icon}
            size={24}
            color={isImportant || isEmergencyMode ? '#FF3B30' : '#666666'}
            style={styles.sectionIcon}
          />
          <Text style={[
            styles.sectionTitle,
            isImportant && styles.importantTitle,
            isEmergencyMode && styles.emergencyTitle,
          ]}>
            {title}
          </Text>
          {isImportant && (
            <View style={styles.urgentBadge}>
              <Text style={styles.urgentText}>URGENT</Text>
            </View>
          )}
        </View>
        <Animated.View style={{ transform: [{ rotate: chevronRotation }] }}>
          <MaterialIcons
            name="chevron-right"
            size={24}
            color={isImportant || isEmergencyMode ? '#FF3B30' : '#999999'}
          />
        </Animated.View>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.sectionContent}>
          {children}
        </View>
      )}
    </View>
  );
};

const MedicalInfoCard: React.FC<MedicalInfoCardProps> = ({
  medicalInfo,
  childName,
  isEmergencyMode = false,
  showAllSections = false,
}) => {
  // Format last updated time
  const formatLastUpdated = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      if (diffDays < 1) {
        return 'Updated today';
      } else if (diffDays < 7) {
        return `Updated ${Math.floor(diffDays)} days ago`;
      } else {
        return `Updated ${date.toLocaleDateString()}`;
      }
    } catch {
      return 'Recently updated';
    }
  };

  // Check if any critical medical information exists
  const hasCriticalInfo = medicalInfo.allergies.length > 0 ||
    medicalInfo.medicalConditions.length > 0 ||
    medicalInfo.emergencyMedicalInfo.trim().length > 0;

  const hasAllergies = medicalInfo.allergies.length > 0;
  const hasMedications = medicalInfo.medications.length > 0;
  const hasConditions = medicalInfo.medicalConditions.length > 0;
  const hasEmergencyInfo = medicalInfo.emergencyMedicalInfo.trim().length > 0;
  const hasHealthCard = medicalInfo.healthCardNumber && medicalInfo.province;

  return (
    <View style={[
      styles.container,
      isEmergencyMode && styles.emergencyContainer,
    ]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <MaterialIcons
            name="medical-services"
            size={32}
            color={isEmergencyMode ? '#FF3B30' : '#007AFF'}
          />
          <View style={styles.headerText}>
            <Text style={[
              styles.title,
              isEmergencyMode && styles.emergencyTitle,
            ]}>
              Medical Information
            </Text>
            <Text style={styles.subtitle}>
              {childName}
            </Text>
            <Text style={styles.lastUpdated}>
              {formatLastUpdated(medicalInfo.lastUpdated)}
            </Text>
          </View>
        </View>
        {hasCriticalInfo && (
          <View style={styles.criticalBadge}>
            <MaterialIcons name="warning" size={16} color="#FFFFFF" />
            <Text style={styles.criticalText}>CRITICAL</Text>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        {/* Emergency Medical Information - Always expanded in emergency mode */}
        {hasEmergencyInfo && (
          <CollapsibleSection
            title="Emergency Medical Information"
            icon="emergency"
            isImportant={true}
            defaultExpanded={true}
            isEmergencyMode={isEmergencyMode}
          >
            <Text style={styles.emergencyInfoText}>
              {medicalInfo.emergencyMedicalInfo}
            </Text>
          </CollapsibleSection>
        )}

        {/* Allergies - Critical information */}
        {hasAllergies && (
          <CollapsibleSection
            title="Allergies"
            icon="warning"
            isImportant={true}
            defaultExpanded={isEmergencyMode}
            isEmergencyMode={isEmergencyMode}
          >
            <View style={styles.listContainer}>
              {medicalInfo.allergies.map((allergy, index) => (
                <View key={index} style={styles.listItem}>
                  <MaterialIcons name="error" size={16} color="#FF3B30" />
                  <Text style={styles.allergyText}>{allergy}</Text>
                </View>
              ))}
            </View>
          </CollapsibleSection>
        )}

        {/* Medical Conditions */}
        {hasConditions && (
          <CollapsibleSection
            title="Medical Conditions"
            icon="medical-information"
            isImportant={true}
            defaultExpanded={isEmergencyMode}
            isEmergencyMode={isEmergencyMode}
          >
            <View style={styles.listContainer}>
              {medicalInfo.medicalConditions.map((condition, index) => (
                <View key={index} style={styles.listItem}>
                  <MaterialIcons name="health-and-safety" size={16} color="#FF6B00" />
                  <Text style={styles.conditionText}>{condition}</Text>
                </View>
              ))}
            </View>
          </CollapsibleSection>
        )}

        {/* Current Medications */}
        {hasMedications && (
          <CollapsibleSection
            title="Current Medications"
            icon="medication"
            defaultExpanded={showAllSections || isEmergencyMode}
            isEmergencyMode={isEmergencyMode}
          >
            <View style={styles.listContainer}>
              {medicalInfo.medications.map((medication, index) => (
                <View key={index} style={styles.listItem}>
                  <MaterialIcons name="local-pharmacy" size={16} color="#34C759" />
                  <Text style={styles.medicationText}>{medication}</Text>
                </View>
              ))}
            </View>
          </CollapsibleSection>
        )}

        {/* Basic Medical Info */}
        <CollapsibleSection
          title="Basic Medical Information"
          icon="person"
          defaultExpanded={showAllSections}
          isEmergencyMode={isEmergencyMode}
        >
          <View style={styles.basicInfoContainer}>
            {medicalInfo.bloodType && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Blood Type:</Text>
                <Text style={styles.infoValue}>{medicalInfo.bloodType}</Text>
              </View>
            )}
          </View>
        </CollapsibleSection>

        {/* Canadian Health Card */}
        {hasHealthCard && (
          <CollapsibleSection
            title="Health Card Information"
            icon="card-membership"
            defaultExpanded={showAllSections}
            isEmergencyMode={isEmergencyMode}
          >
            <View style={styles.healthCardContainer}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Province:</Text>
                <Text style={styles.infoValue}>{medicalInfo.province}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Health Card Number:</Text>
                <Text style={styles.healthCardNumber}>
                  {medicalInfo.healthCardNumber}
                </Text>
              </View>
              <View style={styles.canadianFlag}>
                <Text style={styles.flagText}>🇨🇦 Canadian Health Card</Text>
              </View>
            </View>
          </CollapsibleSection>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E5E7',
    marginVertical: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emergencyContainer: {
    borderColor: '#FF3B30',
    borderWidth: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
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
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 2,
  },
  emergencyTitle: {
    color: '#FF3B30',
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 2,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#999999',
    fontStyle: 'italic',
  },
  criticalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  criticalText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  scrollContent: {
    maxHeight: 400, // Limit height for better UX
  },
  section: {
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  importantSection: {
    backgroundColor: '#FFF9F9',
  },
  emergencySection: {
    backgroundColor: '#FFEBEB',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    minHeight: 60, // Large touch target
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionIcon: {
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
  },
  importantTitle: {
    color: '#FF3B30',
    fontWeight: 'bold',
  },
  urgentBadge: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  urgentText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  sectionContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  emergencyInfoText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '500',
    lineHeight: 24,
    backgroundColor: '#FFF0F0',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  listContainer: {
    marginTop: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingVertical: 4,
  },
  allergyText: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  conditionText: {
    fontSize: 14,
    color: '#FF6B00',
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  medicationText: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  basicInfoContainer: {
    marginTop: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '600',
  },
  healthCardContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  healthCardNumber: {
    fontSize: 14,
    color: '#000000',
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  canadianFlag: {
    marginTop: 8,
    alignItems: 'center',
  },
  flagText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
});

export default MedicalInfoCard;