import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
  Animated,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { EmergencyContact , emergencyStorage } from '../../lib/storage/EmergencyStorageService';

interface EmergencyContactCardProps {
  contact: EmergencyContact;
  childId: string;
  onContactUsed?: (contact: EmergencyContact) => void;
  size?: 'small' | 'medium' | 'large';
  showLastContacted?: boolean;
}

const EmergencyContactCard: React.FC<EmergencyContactCardProps> = ({
  contact,
  childId,
  onContactUsed,
  size = 'medium',
  showLastContacted = true,
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [scaleAnimation] = useState(new Animated.Value(1));

  // Size configurations for different use cases
  const sizeConfigs = {
    small: {
      containerHeight: 80,
      fontSize: 14,
      iconSize: 20,
      padding: 12,
    },
    medium: {
      containerHeight: 100,
      fontSize: 16,
      iconSize: 24,
      padding: 16,
    },
    large: {
      containerHeight: 120,
      fontSize: 18,
      iconSize: 28,
      padding: 20,
    },
  };

  const config = sizeConfigs[size];

  // Handle calling emergency contact
  const handleCall = async () => {
    try {
      // Haptic feedback for important action
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

      // Scale animation for feedback
      Animated.sequence([
        Animated.timing(scaleAnimation, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnimation, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      // Format phone number for calling
      const phoneUrl = `tel:${contact.phoneNumber.replace(/\D/g, '')}`;

      // Check if device can make calls
      const canCall = await Linking.canOpenURL(phoneUrl);

      if (canCall) {
        // Show confirmation dialog for emergency calls
        Alert.alert(
          'Emergency Call',
          `Call ${contact.name} at ${contact.phoneNumber}?`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Call Now',
              style: 'destructive',
              onPress: async () => {
                try {
                  await Linking.openURL(phoneUrl);

                  // Record emergency contact usage
                  emergencyStorage.recordEmergencyContactUsage(childId, contact.id);

                  // Notify parent component
                  onContactUsed?.(contact);

                } catch (error) {
                  console.error('Failed to make call:', error);
                  Alert.alert(
                    'Call Failed',
                    'Unable to make the call. Please try again or dial manually.',
                    [{ text: 'OK' }]
                  );
                }
              },
            },
          ],
          { cancelable: true }
        );
      } else {
        // Fallback for devices that can't make calls (web, some tablets)
        Alert.alert(
          'Call Not Available',
          `Phone calls are not available on this device. Please call ${contact.name} at ${contact.phoneNumber} using your phone.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Emergency call handling failed:', error);
      Alert.alert(
        'Error',
        'Unable to process emergency call. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  // Format last contacted time
  const formatLastContacted = (timestamp?: string): string => {
    if (!timestamp) return 'Never contacted';

    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      if (diffHours < 1) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return `${diffMinutes} min ago`;
      } else if (diffHours < 24) {
        return `${Math.floor(diffHours)} hr ago`;
      } else if (diffDays < 7) {
        return `${Math.floor(diffDays)} days ago`;
      } else {
        return date.toLocaleDateString();
      }
    } catch {
      return 'Recently';
    }
  };

  // Format phone number for display
  const formatPhoneNumber = (phone: string): string => {
    // Basic Canadian phone number formatting
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    return phone; // Return original if format is unclear
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          height: config.containerHeight,
          padding: config.padding,
          transform: [{ scale: scaleAnimation }],
          backgroundColor: contact.isPrimary ? '#FF3B30' : '#FFFFFF',
          borderColor: contact.isPrimary ? '#FF3B30' : '#E5E5E7',
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handleCall}
        onPressIn={() => setIsPressed(true)}
        onPressOut={() => setIsPressed(false)}
        style={[
          styles.touchableContent,
          { opacity: isPressed ? 0.8 : 1 },
        ]}
        accessibilityLabel={`Call ${contact.name} at ${contact.phoneNumber}`}
        accessibilityHint="Emergency contact for immediate assistance"
        accessibilityRole="button"
      >
        {/* Left side - Contact info */}
        <View style={styles.contactInfo}>
          <View style={styles.nameRow}>
            <Text
              style={[
                styles.contactName,
                {
                  fontSize: config.fontSize,
                  color: contact.isPrimary ? '#FFFFFF' : '#000000',
                },
              ]}
              numberOfLines={1}
            >
              {contact.name}
            </Text>
            {contact.isPrimary && (
              <View style={styles.primaryBadge}>
                <Text style={styles.primaryText}>PRIMARY</Text>
              </View>
            )}
          </View>

          <Text
            style={[
              styles.relationship,
              {
                fontSize: config.fontSize - 2,
                color: contact.isPrimary ? 'rgba(255, 255, 255, 0.8)' : '#666666',
              },
            ]}
            numberOfLines={1}
          >
            {contact.relationship}
          </Text>

          <Text
            style={[
              styles.phoneNumber,
              {
                fontSize: config.fontSize - 2,
                color: contact.isPrimary ? 'rgba(255, 255, 255, 0.9)' : '#333333',
              },
            ]}
            numberOfLines={1}
          >
            {formatPhoneNumber(contact.phoneNumber)}
          </Text>

          {showLastContacted && contact.lastContacted && (
            <Text
              style={[
                styles.lastContacted,
                {
                  fontSize: config.fontSize - 4,
                  color: contact.isPrimary ? 'rgba(255, 255, 255, 0.7)' : '#999999',
                },
              ]}
            >
              Last contacted: {formatLastContacted(contact.lastContacted)}
            </Text>
          )}
        </View>

        {/* Right side - Call button */}
        <View style={styles.callButtonContainer}>
          <View
            style={[
              styles.callButton,
              {
                backgroundColor: contact.isPrimary ? 'rgba(255, 255, 255, 0.2)' : '#FF3B30',
              },
            ]}
          >
            <MaterialIcons
              name="phone"
              size={config.iconSize}
              color={contact.isPrimary ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>
          <Text
            style={[
              styles.callLabel,
              {
                fontSize: config.fontSize - 4,
                color: contact.isPrimary ? 'rgba(255, 255, 255, 0.8)' : '#666666',
              },
            ]}
          >
            TAP TO CALL
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 2,
    marginVertical: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // Android shadow
  },
  touchableContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contactInfo: {
    flex: 1,
    marginRight: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  contactName: {
    fontWeight: 'bold',
    flex: 1,
  },
  primaryBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  relationship: {
    marginBottom: 2,
  },
  phoneNumber: {
    fontWeight: '500',
    marginBottom: 2,
  },
  lastContacted: {
    fontStyle: 'italic',
  },
  callButtonContainer: {
    alignItems: 'center',
    minWidth: 80,
  },
  callButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  callLabel: {
    textAlign: 'center',
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});

export default EmergencyContactCard;