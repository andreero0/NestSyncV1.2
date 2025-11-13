import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
  Platform,
  useColorScheme,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { MedicalInfo } from '../../lib/storage/EmergencyStorageService';
import { Colors, NestSyncColors } from '../../constants/Colors';

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
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
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
            color={isImportant || isEmergencyMode ? NestSyncColors.semantic.error : colors.textSecondary}
            style={styles.sectionIcon}
          />
          <Text style={[
            styles.sectionTitle,
            { color: colors.text },
            isImportant && styles.importantTitle,
            isEmergencyMode && styles.emergencyTitle,
          ]}>
            {title}
          </Text>
          {isImportant && (
            <View style={[styles.urgentBadge, { backgroundColor: NestSyncColors.semantic.error }]}>
              <Text style={styles.urgentText}>URGENT</Text>
            </View>
          )}
        </View>
        <Animated.View style={{ transform: [{ rotate: chevronRotation }] }}>
          <MaterialIcons
            name="chevron-right"
            size={24}
            color={isImportant || isEmergencyMode ? NestSyncColors.semantic.error : colors.textSecondary}
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
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

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
      { backgroundColor: colors.background, borderColor: colors.border },
      isEmergencyMode && [styles.emergencyContainer, { borderColor: NestSyncColors.semantic.error }],
    ]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerContent}>
          <MaterialIcons
            name="medical-services"
            size={32}
            color={isEmergencyMode ? NestSyncColors.semantic.error : NestSyncColors.primary.blue}
          />
          <View style={styles.headerText}>
            <Text style={[
              styles.title,
              { color: colors.text },
              isEmergencyMode && styles.emergencyTitle,
            ]}>
              Medical Information
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {childName}
            </Text>
            <Text style={[styles.lastUpdated, { color: colors.textSecondary }]}>
              {formatLastUpdated(medicalInfo.lastUpdated)}
            </Text>
          </View>
        </View>
        {hasCriticalInfo && (
          <View style={[styles.criticalBadge, { backgroundColor: NestSyncColors.semantic.error }]}>
            <MaterialIcons name="warning" size={16} color={colors.background} />
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
            <Text style={[
              styles.emergencyInfoText,
              {
                color: NestSyncColors.semantic.error,
                backgroundColor: `${NestSyncColors.semantic.error}10`,
                borderLeftColor: NestSyncColors.semantic.error,
              },
            ]}>
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
                  <MaterialIcons name="error" size={16} color={NestSyncColors.semantic.error} />
                  <Text style={[styles.allergyText, { color: NestSyncColors.semantic.error }]}>{allergy}</Text>
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
                  <MaterialIcons name="health-and-safety" size={16} color={NestSyncColors.accent.orange} />
                  <Text style={[styles.conditionText, { color: NestSyncColors.accent.orange }]}>{condition}</Text>
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
                  <MaterialIcons name="local-pharmacy" size={16} color={NestSyncColors.secondary.green} />
                  <Text style={[styles.medicationText, { color: NestSyncColors.secondary.green }]}>{medication}</Text>
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
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Blood Type:</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{medicalInfo.bloodType}</Text>
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
            <View style={[
              styles.healthCardContainer,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Province:</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{medicalInfo.province}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Health Card Number:</Text>
                <Text style={[styles.healthCardNumber, { color: colors.text }]}>
                  {medicalInfo.healthCardNumber}
                </Text>
              </View>
              <View style={styles.canadianFlag}>
                <Text style={[styles.flagText, { color: colors.textSecondary }]}>🇨🇦 Canadian Health Card</Text>
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
    borderRadius: 16,
    borderWidth: 1,
    marginVertical: 8,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  emergencyContainer: {
    borderWidth: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    borderBottomWidth: 1,
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
    marginBottom: 2,
  },
  emergencyTitle: {
    color: NestSyncColors.semantic.error,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 2,
  },
  lastUpdated: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  criticalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
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
    borderBottomColor: NestSyncColors.neutral[100],
  },
  importantSection: {
    backgroundColor: `${NestSyncColors.semantic.error}05`,
  },
  emergencySection: {
    backgroundColor: `${NestSyncColors.semantic.error}10`,
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
    flex: 1,
  },
  importantTitle: {
    color: NestSyncColors.semantic.error,
    fontWeight: 'bold',
  },
  urgentBadge: {
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
    fontWeight: '500',
    lineHeight: 24,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
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
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  conditionText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  medicationText: {
    fontSize: 14,
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
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  healthCardContainer: {
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  healthCardNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  canadianFlag: {
    marginTop: 8,
    alignItems: 'center',
  },
  flagText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default MedicalInfoCard;