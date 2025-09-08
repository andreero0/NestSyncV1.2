/**
 * Just-in-Time Consent Modal Component
 * PIPEDA-compliant contextual consent modal for NestSync
 * Psychology-driven design for stressed Canadian parents
 */

import React, { useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableWithoutFeedback,
  Platform,
  StatusBar,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { useJITConsent } from '../../contexts/JITConsentContext';
import { useNestSyncTheme } from '../../contexts/ThemeContext';
import { Colors, NestSyncColors } from '../../constants/Colors';
import { NestSyncButton } from '../ui/NestSyncButton';
import { ConsentType } from '../../lib/types/auth';

interface ConsentContentConfig {
  title: string;
  description: string;
  benefits: string[];
  dataUsed: string[];
  icon: string;
  primaryColor: string;
}

const CONSENT_CONTENT: Record<ConsentType, ConsentContentConfig> = {
  [ConsentType.ANALYTICS]: {
    title: 'Help Improve NestSync',
    description: 'We would like to collect anonymous usage data to improve your diaper tracking experience. This helps us understand which features are most valuable to Canadian parents.',
    benefits: [
      'Better app performance and reliability',
      'Features designed around real parent needs',
      'Improved user experience based on usage patterns',
    ],
    dataUsed: [
      'Screen views and feature usage (anonymous)',
      'App performance metrics',
      'General usage patterns (no personal data)',
    ],
    icon: 'chart',
    primaryColor: NestSyncColors.primary.blue,
  },
  [ConsentType.MARKETING]: {
    title: 'Stay Connected',
    description: 'Receive helpful tips, product updates, and Canadian parenting resources. We will only send you relevant information and you can unsubscribe anytime.',
    benefits: [
      'Helpful parenting tips from Canadian experts',
      'Early access to new features',
      'Relevant product updates and improvements',
    ],
    dataUsed: [
      'Email address for communication',
      'General app usage preferences',
      'Feature interest indicators',
    ],
    icon: 'mail',
    primaryColor: NestSyncColors.accent.purple,
  },
  [ConsentType.DATA_SHARING]: {
    title: 'Personalized Recommendations',
    description: 'Allow us to analyze your diaper usage patterns to provide personalized size predictions and reorder suggestions tailored to your child\'s needs.',
    benefits: [
      'Smart diaper size transition predictions',
      'Personalized reorder timing recommendations',
      'Usage insights tailored to your child',
    ],
    dataUsed: [
      'Diaper usage patterns and timing',
      'Child growth and development data',
      'Brand and size preferences',
    ],
    icon: 'target',
    primaryColor: NestSyncColors.secondary.green,
  },
  [ConsentType.PRIVACY_POLICY]: {
    title: 'Privacy Policy',
    description: 'This consent should not appear in JIT context - handled at signup',
    benefits: [],
    dataUsed: [],
    icon: 'lock',
    primaryColor: NestSyncColors.neutral[500],
  },
  [ConsentType.TERMS_OF_SERVICE]: {
    title: 'Terms of Service',
    description: 'This consent should not appear in JIT context - handled at signup',
    benefits: [],
    dataUsed: [],
    icon: 'document',
    primaryColor: NestSyncColors.neutral[500],
  },
};

export function JITConsentModal() {
  const { isVisible, consentType, purpose, dataCategories, onGrant, onDecline, dismissConsent } = useJITConsent();
  const actualTheme = useNestSyncTheme();
  const colors = Colors[actualTheme];

  // Trigger haptic feedback when modal opens
  useEffect(() => {
    if (isVisible && Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [isVisible]);

  if (!isVisible || !consentType) {
    return null;
  }

  const config = CONSENT_CONTENT[consentType];

  const handleGrant = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    onGrant?.();
  };

  const handleDecline = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onDecline?.();
  };

  const handleBackdropPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    dismissConsent();
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={dismissConsent}
    >
      {/* Status bar handling for cross-platform */}
      {Platform.OS === 'ios' && (
        <StatusBar barStyle={actualTheme === 'dark' ? 'light-content' : 'dark-content'} />
      )}
      
      {/* Backdrop with blur effect */}
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <View style={styles.backdrop}>
          {Platform.OS === 'ios' ? (
            <BlurView intensity={20} style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.androidBlur]} />
          )}
        </View>
      </TouchableWithoutFeedback>

      {/* Modal Content */}
      <View style={styles.modalContainer}>
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          {/* Header with icon and title */}
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: `${config.primaryColor}15` }]}>
              <Text style={styles.icon}>{config.icon}</Text>
            </View>
            <Text style={[styles.title, { color: colors.textEmphasis }]}>
              {config.title}
            </Text>
          </View>

          {/* Scrollable content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Purpose description */}
            <Text style={[styles.description, { color: colors.text }]}>
              {purpose || config.description}
            </Text>

            {/* Benefits section */}
            {config.benefits.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textEmphasis }]}>
                  What this enables:
                </Text>
                {config.benefits.map((benefit, index) => (
                  <View key={index} style={styles.listItem}>
                    <Text style={[styles.bullet, { color: config.primaryColor }]}>•</Text>
                    <Text style={[styles.listText, { color: colors.text }]}>{benefit}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Data categories */}
            {(dataCategories.length > 0 || config.dataUsed.length > 0) && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textEmphasis }]}>
                  Data involved:
                </Text>
                {(dataCategories.length > 0 ? dataCategories : config.dataUsed).map((data, index) => (
                  <View key={index} style={styles.listItem}>
                    <Text style={[styles.bullet, { color: colors.textSecondary }]}>•</Text>
                    <Text style={[styles.listText, { color: colors.text }]}>{data}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Canadian compliance note */}
            <View style={[styles.complianceNote, { backgroundColor: colors.surface }]}>
              <Text style={[styles.complianceText, { color: colors.textSecondary }]}>
                🇨🇦 All data is stored in Canada and processed according to PIPEDA privacy standards. 
                You can withdraw this consent anytime in Settings.
              </Text>
            </View>
          </ScrollView>

          {/* Action buttons */}
          <View style={styles.actions}>
            <NestSyncButton
              title="Allow"
              onPress={handleGrant}
              variant="primary"
              size="large"
              style={[styles.primaryButton, { backgroundColor: config.primaryColor }]}
              testID="jit-consent-grant"
            />
            <NestSyncButton
              title="Not Now"
              onPress={handleDecline}
              variant="ghost"
              size="medium"
              style={styles.secondaryButton}
              testID="jit-consent-decline"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  androidBlur: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '85%',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },
  header: {
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: NestSyncColors.neutral[100],
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 28,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 28,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'left',
    marginVertical: 16,
  },
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bullet: {
    fontSize: 16,
    marginRight: 12,
    marginTop: 2,
    fontWeight: '600',
  },
  listText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  complianceNote: {
    padding: 16,
    borderRadius: 12,
    marginVertical: 16,
    borderLeftWidth: 4,
    borderLeftColor: NestSyncColors.canadian.trust,
  },
  complianceText: {
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  actions: {
    padding: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: NestSyncColors.neutral[100],
  },
  primaryButton: {
    marginBottom: 12,
  },
  secondaryButton: {
    marginTop: 4,
  },
});

export default JITConsentModal;