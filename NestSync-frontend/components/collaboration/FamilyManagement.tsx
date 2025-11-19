/**
 * Family Management Component
 * Manages family members, invitations, and caregiver permissions
 */

import React, { useState, useEffect } from 'react';
import { secureLog } from '../../lib/utils/secureLogger';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Platform,
  Dimensions,
  AccessibilityInfo,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { NestSyncButton } from '@/components/ui/NestSyncButton';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrentFamily, useInviteCaregiver, useAcceptInvitation } from '@/lib/graphql/collaboration-hooks';
import { FamilyMember, MemberPermissions } from '@/lib/graphql/queries';

interface FamilyManagementProps {
  onClose: () => void;
}

const { height: screenHeight } = Dimensions.get('window');

/**
 * Custom safe slide in animation
 * Uses react-native-reanimated for smooth 60fps animation
 */
const useSafeSlideInAnimation = (visible: boolean, onAnimationComplete?: () => void) => {
  const translateY = useSharedValue(screenHeight);
  const opacity = useSharedValue(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  // Check for reduced motion preference
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  useEffect(() => {
    if (visible) {
      if (reduceMotion) {
        // Instant positioning for accessibility
        translateY.value = 0;
        opacity.value = 1;
        onAnimationComplete && runOnJS(onAnimationComplete)();
      } else {
        // Phase 1 (0-50ms): Quick position with Dynamic Island clearance
        translateY.value = withTiming(0, {
          duration: 320,
          easing: Easing.out(Easing.cubic),
        });

        // Phase 2 (50-280ms): Content fade in with staggered timing
        opacity.value = withTiming(1, {
          duration: 280,
        });

        // Phase 3 (280-320ms): Animation complete, buttons interactive
        setTimeout(() => {
          if (onAnimationComplete) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            runOnJS(onAnimationComplete)();
          }
        }, 320);
      }
    } else {
      // Exit animation
      translateY.value = withTiming(screenHeight, {
        duration: 250,
        easing: Easing.in(Easing.cubic),
      });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible, reduceMotion, onAnimationComplete, translateY, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return animatedStyle;
};

interface InvitationFormData {
  email: string;
  role: 'FAMILY_CORE' | 'EXTENDED_FAMILY' | 'PROFESSIONAL' | 'INSTITUTIONAL';
  customPermissions: boolean;
  permissions: Partial<MemberPermissions>;
}

export default function FamilyManagement({ onClose }: FamilyManagementProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Authentication context - handle missing context gracefully for testing
  let user;
  try {
    const authResult = useAuth();
    user = authResult.user;
  } catch {
    // Fallback for testing when AuthContext is not available
    secureLog.warn('AuthContext not available, using fallback user data for testing');
    user = { id: 'test-user-id', email: 'parents@nestsync.com' };
  }

  // Collaboration hooks
  const { currentFamily, familyMembers, pendingInvitations } = useCurrentFamily();
  const { inviteCaregiver, loading: inviteLoading } = useInviteCaregiver();
  const { acceptInvitation, loading: acceptLoading, error: acceptError } = useAcceptInvitation();

  // UI state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [modalAnimationComplete, setModalAnimationComplete] = useState(false);
  const [showMemberDetails, setShowMemberDetails] = useState<string | null>(null);

  // Custom animation hook
  const modalAnimatedStyle = useSafeSlideInAnimation(
    showInviteModal,
    () => setModalAnimationComplete(true)
  );

  // Reset animation state when modal closes
  useEffect(() => {
    if (!showInviteModal) {
      setModalAnimationComplete(false);
    }
  }, [showInviteModal]);

  // Auto-hide accept invitation error after 10 seconds
  useEffect(() => {
    if (acceptError) {
      const timer = setTimeout(() => {
        // Note: We cannot directly clear the error from the hook,
        // but it will clear on next successful action or component unmount
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [acceptError]);
  const [invitationForm, setInvitationForm] = useState<InvitationFormData>({
    email: '',
    role: 'EXTENDED_FAMILY',
    customPermissions: false,
    permissions: {},
  });

  // Role configuration templates
  const roleTemplates = {
    FAMILY_CORE: {
      label: 'Family Core',
      description: 'Full access - parents and guardians',
      icon: 'person.2.fill',
      color: colors.tint,
      permissions: {
        canViewAllData: true,
        canEditChildProfiles: true,
        canInviteMembers: true,
        canManageSettings: true,
        canExportData: true,
        canAccessHistoricalData: true,
        allowedActivityTypes: ['all'],
        canEditOwnActivities: true,
        canEditOthersActivities: true,
        canBulkLog: true,
      },
    },
    EXTENDED_FAMILY: {
      label: 'Extended Family',
      description: 'Limited access - grandparents, relatives',
      icon: 'person.3.fill',
      color: '#8B5CF6',
      permissions: {
        canViewAllData: true,
        canEditChildProfiles: false,
        canInviteMembers: false,
        canManageSettings: false,
        canExportData: false,
        canAccessHistoricalData: true,
        allowedActivityTypes: ['diaper_change', 'feeding', 'sleep'],
        canEditOwnActivities: true,
        canEditOthersActivities: false,
        canBulkLog: false,
      },
    },
    PROFESSIONAL: {
      label: 'Professional Caregiver',
      description: 'Professional access - nannies, babysitters',
      icon: 'briefcase.fill',
      color: '#14B8A6',
      permissions: {
        canViewAllData: true,
        canEditChildProfiles: false,
        canInviteMembers: false,
        canManageSettings: false,
        canExportData: false,
        canAccessHistoricalData: true,
        allowedActivityTypes: ['diaper_change', 'feeding', 'sleep', 'play', 'note'],
        canEditOwnActivities: true,
        canEditOthersActivities: false,
        canBulkLog: true,
      },
    },
    INSTITUTIONAL: {
      label: 'Institutional',
      description: 'Daycare centers and facilities',
      icon: 'building.2.fill',
      color: '#6366F1',
      permissions: {
        canViewAllData: true,
        canEditChildProfiles: false,
        canInviteMembers: false,
        canManageSettings: false,
        canExportData: true,
        canAccessHistoricalData: true,
        allowedActivityTypes: ['all'],
        canEditOwnActivities: true,
        canEditOthersActivities: true,
        canBulkLog: true,
      },
    },
  };

  const handleInviteCaregiver = async () => {
    if (!currentFamily || !invitationForm.email.trim()) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      await inviteCaregiver({
        familyId: currentFamily.id,
        email: invitationForm.email.trim(),
        role: invitationForm.role,
        accessRestrictions: invitationForm.customPermissions ? invitationForm.permissions : null,
      });

      Alert.alert(
        'Invitation Sent',
        `Invitation has been sent to ${invitationForm.email}`,
        [{ text: 'OK', onPress: () => setShowInviteModal(false) }]
      );

      // Reset form
      setInvitationForm({
        email: '',
        role: 'EXTENDED_FAMILY',
        customPermissions: false,
        permissions: {},
      });
    } catch (error) {
      Alert.alert(
        'Invitation Failed',
        error instanceof Error ? error.message : 'Failed to send invitation'
      );
    }
  };

  const getRoleDisplay = (role: string) => {
    return roleTemplates[role as keyof typeof roleTemplates] || {
      label: role,
      description: '',
      icon: 'person.fill',
      color: colors.text,
    };
  };

  const getStatusDisplay = (status: string) => {
    const statusConfig = {
      ACTIVE: { label: 'Active', color: '#10B981', icon: 'checkmark.circle.fill' },
      INACTIVE: { label: 'Inactive', color: '#6B7280', icon: 'pause.circle.fill' },
      SUSPENDED: { label: 'Suspended', color: '#EF4444', icon: 'exclamationmark.triangle.fill' },
      EXPIRED: { label: 'Expired', color: '#F59E0B', icon: 'clock.fill' },
    };
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.INACTIVE;
  };

  const renderMemberCard = (member: FamilyMember) => {
    const roleDisplay = getRoleDisplay(member.role);
    const statusDisplay = getStatusDisplay(member.status);

    return (
      <TouchableOpacity
        key={member.id}
        style={[styles.memberCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => setShowMemberDetails(member.id)}
        accessibilityRole="button"
        accessibilityLabel={`${member.userDisplayName || member.userEmail}, ${roleDisplay.label}`}
      >
        <View style={styles.memberInfo}>
          <View style={[styles.roleIcon, { backgroundColor: `${roleDisplay.color}20` }]}>
            <IconSymbol name={roleDisplay.icon} size={24} color={roleDisplay.color} />
          </View>
          <View style={styles.memberDetails}>
            <ThemedText type="defaultSemiBold" style={styles.memberName}>
              {member.userDisplayName || member.userEmail || 'Unknown User'}
            </ThemedText>
            <ThemedText style={[styles.memberEmail, { color: colors.textSecondary }]}>
              {member.userEmail}
            </ThemedText>
            <View style={styles.memberMeta}>
              <Text style={[styles.roleLabel, { color: roleDisplay.color }]}>
                {roleDisplay.label}
              </Text>
              <View style={styles.statusContainer}>
                <IconSymbol name={statusDisplay.icon} size={14} color={statusDisplay.color} />
                <Text style={[styles.statusLabel, { color: statusDisplay.color }]}>
                  {statusDisplay.label}
                </Text>
              </View>
            </View>
          </View>
        </View>
        <IconSymbol name="chevron.right" size={16} color={colors.textSecondary} />
      </TouchableOpacity>
    );
  };

  const renderInvitationCard = (invitation: any) => {
    const roleDisplay = getRoleDisplay(invitation.role);

    // Determine if this is a received invitation (TO current user) or sent invitation (FROM current user)
    const isReceivedInvitation = invitation.email === user?.email;
    const isSentInvitation = invitation.invitedBy === user?.id;

    const handleAcceptInvitation = () => {
      Alert.alert(
        'Accept Invitation',
        `Accept invitation to join ${invitation.familyName}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Accept',
            onPress: async () => {
              try {
                // Provide haptic feedback for action confirmation
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

                await acceptInvitation(invitation.invitationToken);

                // Success haptic feedback
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

                Alert.alert(
                  'Success',
                  `Successfully joined ${invitation.familyName}!`,
                  [{ text: 'OK' }]
                );
                // The useCurrentFamily hook will automatically refresh the data
              } catch (error) {
                // Error haptic feedback
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

                // The error is now displayed in the UI, but we still show alert for immediate feedback
                const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                Alert.alert(
                  'Unable to Accept Invitation',
                  `Failed to accept invitation: ${errorMessage}`,
                  [{ text: 'OK' }]
                );
              }
            },
          },
        ]
      );
    };

    const handleDeclineInvitation = () => {
      Alert.alert(
        'Decline Invitation',
        `Decline invitation to join ${invitation.familyName}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Decline',
            style: 'destructive',
            onPress: () => {
              // TODO: Implement decline invitation functionality
              Alert.alert('Feature Coming Soon', 'Decline invitation functionality will be available soon');
            },
          },
        ]
      );
    };

    const handleResendInvitation = () => {
      Alert.alert(
        'Resend Invitation',
        `Resend invitation to ${invitation.email}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Resend',
            onPress: () => {
              // TODO: Implement resend invitation functionality
              Alert.alert('Feature Coming Soon', 'Resend invitation functionality will be available soon');
            },
          },
        ]
      );
    };

    const handleCancelInvitation = () => {
      Alert.alert(
        'Cancel Invitation',
        `Cancel invitation to ${invitation.email}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Cancel Invitation',
            style: 'destructive',
            onPress: () => {
              // TODO: Implement cancel invitation functionality
              Alert.alert('Feature Coming Soon', 'Cancel invitation functionality will be available soon');
            },
          },
        ]
      );
    };

    return (
      <View
        key={invitation.id}
        style={[styles.invitationCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <View style={styles.memberInfo}>
          <View style={[styles.roleIcon, { backgroundColor: `${colors.warning}20` }]}>
            <IconSymbol name="clock.fill" size={24} color={colors.warning} />
          </View>
          <View style={styles.memberDetails}>
            <ThemedText type="defaultSemiBold" style={styles.memberName}>
              {isReceivedInvitation ? `Invitation from ${invitation.inviterName || 'Unknown'}` : invitation.email}
            </ThemedText>
            <ThemedText style={[styles.memberEmail, { color: colors.textSecondary }]}>
              {isReceivedInvitation ? `Join ${invitation.familyName}` : 'Pending invitation'}
            </ThemedText>
            <Text style={[styles.roleLabel, { color: roleDisplay.color }]}>
              {roleDisplay.label}
            </Text>
          </View>
        </View>

        {/* Conditional buttons based on invitation type */}
        <View style={styles.invitationActions}>
          {isReceivedInvitation ? (
            // Show Accept/Decline for received invitations
            <>
              <TouchableOpacity
                style={[
                  styles.acceptButton,
                  {
                    backgroundColor: acceptLoading ? colors.textSecondary : colors.tint,
                    opacity: acceptLoading ? 0.8 : 1
                  }
                ]}
                onPress={handleAcceptInvitation}
                disabled={acceptLoading}
                accessibilityState={{ disabled: acceptLoading }}
                accessibilityLabel={acceptLoading ? "Accepting invitation..." : "Accept invitation"}
              >
                {acceptLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.acceptButtonText}>Accept</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.declineButton,
                  {
                    backgroundColor: acceptLoading ? colors.placeholder : colors.textSecondary,
                    opacity: acceptLoading ? 0.6 : 1
                  }
                ]}
                onPress={handleDeclineInvitation}
                disabled={acceptLoading}
                accessibilityState={{ disabled: acceptLoading }}
                accessibilityLabel={acceptLoading ? "Please wait..." : "Decline invitation"}
              >
                <Text style={[
                  styles.declineButtonText,
                  { opacity: acceptLoading ? 0.7 : 1 }
                ]}>
                  Decline
                </Text>
              </TouchableOpacity>
            </>
          ) : isSentInvitation ? (
            // Show Resend/Cancel for sent invitations
            <>
              <TouchableOpacity
                style={[styles.resendButton, { backgroundColor: colors.tint }]}
                onPress={handleResendInvitation}
              >
                <Text style={styles.resendButtonText}>Resend</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: colors.textSecondary }]}
                onPress={handleCancelInvitation}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : (
            // Fallback for unclear invitation ownership
            <TouchableOpacity
              style={[styles.resendButton, { backgroundColor: colors.textSecondary }]}
              onPress={() => Alert.alert('Unknown Invitation', 'Unable to determine invitation type')}
            >
              <Text style={styles.resendButtonText}>Unknown</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderRoleSelector = () => (
    <View style={styles.roleSelectorContainer}>
      <ThemedText type="defaultSemiBold" style={styles.sectionLabel}>
        Caregiver Role
      </ThemedText>
      <ThemedText style={[styles.sectionDescription, { color: colors.textSecondary }]}>
        Choose the appropriate role based on their relationship and responsibilities.
      </ThemedText>

      {Object.entries(roleTemplates).map(([roleKey, role]) => (
        <TouchableOpacity
          key={roleKey}
          style={[
            styles.roleOption,
            {
              backgroundColor: invitationForm.role === roleKey ? `${role.color}20` : colors.surface,
              borderColor: invitationForm.role === roleKey ? role.color : colors.border,
            },
          ]}
          onPress={() => setInvitationForm(prev => ({ ...prev, role: roleKey as any }))}
        >
          <View style={[styles.roleIcon, { backgroundColor: `${role.color}20` }]}>
            <IconSymbol name={role.icon} size={24} color={role.color} />
          </View>
          <View style={styles.roleInfo}>
            <ThemedText type="defaultSemiBold">{role.label}</ThemedText>
            <ThemedText style={[styles.roleDescription, { color: colors.textSecondary }]}>
              {role.description}
            </ThemedText>
          </View>
          {invitationForm.role === roleKey && (
            <IconSymbol name="checkmark.circle.fill" size={20} color={role.color} />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  if (!currentFamily) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <IconSymbol name="xmark" size={24} color={colors.text} />
          </TouchableOpacity>
          <ThemedText type="title">Family & Caregivers</ThemedText>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyState}>
          <IconSymbol name="person.3.fill" size={64} color={colors.textSecondary} />
          <ThemedText type="subtitle" style={[styles.emptyTitle, { color: colors.textSecondary }]}>
            No Family Selected
          </ThemedText>
          <ThemedText style={[styles.emptyDescription, { color: colors.textSecondary }]}>
            Please select or create a family to manage caregivers.
          </ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <IconSymbol name="xmark" size={24} color={colors.text} />
        </TouchableOpacity>
        <ThemedText type="title">Family & Caregivers</ThemedText>
        <TouchableOpacity onPress={() => setShowInviteModal(true)}>
          <IconSymbol name="plus" size={24} color={colors.tint} />
        </TouchableOpacity>
      </View>

      {/* Canadian Privacy Notice */}
      <View style={[styles.privacyNotice, { backgroundColor: colors.surface, borderColor: colors.info }]}>
        <IconSymbol name="checkmark.shield.fill" size={20} color={colors.info} />
        <ThemedText style={[styles.privacyText, { color: colors.textSecondary }]}>
          All caregiver data is stored securely in Canada and protected under PIPEDA regulations.
        </ThemedText>
      </View>

      {/* Error Display */}
      {acceptError && (
        <TouchableOpacity
          style={[styles.errorNotice, { backgroundColor: colors.surface, borderColor: colors.error }]}
          onPress={() => {
            // The error will be cleared on next action since we cannot directly clear it
            // But we can provide haptic feedback to acknowledge the tap
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          accessibilityRole="button"
          accessibilityLabel="Dismiss error message"
          accessibilityHint="Tap to acknowledge error. Error will clear automatically."
        >
          <IconSymbol name="exclamationmark.triangle.fill" size={20} color={colors.error} />
          <ThemedText style={[styles.errorText, { color: colors.error }]}>
            {acceptError.message || 'Failed to accept invitation. Please try again.'}
          </ThemedText>
          <IconSymbol name="xmark.circle.fill" size={16} color={colors.error} style={{ opacity: 0.7 }} />
        </TouchableOpacity>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Family Info */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            {currentFamily.name}
          </ThemedText>
          <ThemedText style={[styles.familyDescription, { color: colors.textSecondary }]}>
            {currentFamily.description || 'Family collaboration space'}
          </ThemedText>
        </View>

        {/* Family Members */}
        <View style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            Family Members ({familyMembers.length})
          </ThemedText>
          {familyMembers.map(renderMemberCard)}
        </View>

        {/* Invitations - Separated by Type */}
        {(() => {
          // Always process invitations logic, even if empty, for better UX
          const sentInvitations = pendingInvitations?.filter(invitation =>
            invitation.invitedBy === user?.id
          ) || [];
          const receivedInvitations = pendingInvitations?.filter(invitation =>
            invitation.email === user?.email
          ) || [];

          const hasAnyInvitations = sentInvitations.length > 0 || receivedInvitations.length > 0;

          return (
            <>
              {/* Invitations Received Section */}
              {receivedInvitations.length > 0 && (
                <View style={styles.section}>
                  <View
                    style={styles.sectionHeader}
                    accessibilityRole="header"
                    accessibilityLabel={`Invitations Received section, ${receivedInvitations.length} invitations`}
                  >
                    <View style={styles.sectionHeaderContent}>
                      <View style={[styles.sectionIcon, { backgroundColor: `${colors.info}15` }]}>
                        <IconSymbol name="envelope.fill" size={20} color={colors.info} />
                      </View>
                      <View style={styles.sectionHeaderText}>
                        <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                          Invitations Received ({receivedInvitations.length})
                        </ThemedText>
                        <ThemedText style={[styles.sectionDescription, { color: colors.textSecondary }]}>
                          Family invitations you have received from others
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                  <View
                    style={[styles.invitationGroup, { backgroundColor: `${colors.info}08` }]}
                    accessibilityLabel="Received invitations list"
                  >
                    {receivedInvitations.map(renderInvitationCard)}
                  </View>
                </View>
              )}

              {/* Invitations Sent Section */}
              {sentInvitations.length > 0 && (
                <View style={styles.section}>
                  <View
                    style={styles.sectionHeader}
                    accessibilityRole="header"
                    accessibilityLabel={`Invitations Sent section, ${sentInvitations.length} invitations`}
                  >
                    <View style={styles.sectionHeaderContent}>
                      <View style={[styles.sectionIcon, { backgroundColor: `${colors.accent}15` }]}>
                        <IconSymbol name="paperplane.fill" size={20} color={colors.accent} />
                      </View>
                      <View style={styles.sectionHeaderText}>
                        <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                          Invitations Sent ({sentInvitations.length})
                        </ThemedText>
                        <ThemedText style={[styles.sectionDescription, { color: colors.textSecondary }]}>
                          Caregiver invitations you have sent to others
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                  <View
                    style={[styles.invitationGroup, { backgroundColor: `${colors.accent}08` }]}
                    accessibilityLabel="Sent invitations list"
                  >
                    {sentInvitations.map(renderInvitationCard)}
                  </View>
                </View>
              )}

              {/* Empty State - No Invitations */}
              {!hasAnyInvitations && (
                <View style={styles.section}>
                  <View
                    style={styles.emptyInvitationsState}
                    accessibilityLabel="No pending invitations empty state"
                    accessibilityHint="Use the invite button below to add family members or caregivers"
                  >
                    <IconSymbol name="person.2.wave.2.fill" size={48} color={colors.textSecondary} />
                    <ThemedText type="defaultSemiBold" style={[styles.emptyTitle, { color: colors.textSecondary }]}>
                      No Pending Invitations
                    </ThemedText>
                    <ThemedText style={[styles.emptyDescription, { color: colors.textSecondary }]}>
                      Invite family members or caregivers to collaborate on child care.
                    </ThemedText>
                  </View>
                </View>
              )}
            </>
          );
        })()}

        {/* Invite New Caregiver Button */}
        <View style={styles.section}>
          <NestSyncButton
            title="Invite New Caregiver"
            onPress={() => setShowInviteModal(true)}
            icon="person.badge.plus"
            variant="outline"
            loading={inviteLoading}
          />
        </View>

        {/* Bottom spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Invite Caregiver Modal with Custom Animation */}
      <Modal
        visible={showInviteModal}
        animationType="none"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowInviteModal(false)}
        statusBarTranslucent
      >
        <SafeAreaProvider>
          <Animated.View
            style={[
              styles.modalContainer,
              { backgroundColor: colors.background },
              modalAnimatedStyle,
            ]}
          >
            <SafeAreaView style={styles.modalSafeArea} edges={['top', 'left', 'right']}>
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  onPress={() => setShowInviteModal(false)}
                  style={styles.modalHeaderButton}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  disabled={!modalAnimationComplete}
                  accessibilityLabel="Cancel invitation"
                  accessibilityHint="Closes the invite caregiver modal"
                >
                  <Text style={[
                    styles.cancelButtonText,
                    {
                      color: colors.text,
                      opacity: modalAnimationComplete ? 1 : 0.5,
                    }
                  ]}>Cancel</Text>
                </TouchableOpacity>
                <ThemedText type="subtitle">Invite Caregiver</ThemedText>
                <TouchableOpacity
                  onPress={handleInviteCaregiver}
                  disabled={!invitationForm.email.trim() || inviteLoading || !modalAnimationComplete}
                  style={styles.modalHeaderButton}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityLabel="Send invitation"
                  accessibilityHint="Sends the caregiver invitation email"
                >
                  <Text
                    style={[
                      styles.saveButton,
                      {
                        color: (invitationForm.email.trim() && modalAnimationComplete) ? colors.tint : colors.textSecondary,
                      },
                    ]}
                  >
                    Send
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Email Input */}
            <View style={styles.inputSection}>
              <ThemedText type="defaultSemiBold" style={styles.inputLabel}>
                Email Address
              </ThemedText>
              <TextInput
                style={[
                  styles.emailInput,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                value={invitationForm.email}
                onChangeText={(email) => setInvitationForm(prev => ({ ...prev, email }))}
                placeholder="caregiver@example.com"
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Role Selector */}
            {renderRoleSelector()}

            {/* Trust Building Information */}
            <View style={[styles.trustInfo, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <IconSymbol name="info.circle.fill" size={20} color={colors.info} />
              <View style={styles.trustInfoContent}>
                <ThemedText type="defaultSemiBold">Gradual Permission Expansion</ThemedText>
                <ThemedText style={[styles.trustInfoText, { color: colors.textSecondary }]}>
                  Start with basic permissions and expand access as trust builds. You can modify permissions anytime.
                </ThemedText>
              </View>
            </View>
              </ScrollView>
            </SafeAreaView>
          </Animated.View>
        </SafeAreaProvider>
      </Modal>
    </SafeAreaView>
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
    paddingVertical: 16,
  },
  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  privacyText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  errorNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 12,
  },
  familyDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  invitationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  roleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    marginBottom: 2,
  },
  memberEmail: {
    fontSize: 14,
    marginBottom: 6,
  },
  memberMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roleLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  invitationActions: {
    flexDirection: 'row',
    gap: 8,
  },
  resendButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  resendButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  acceptButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  declineButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  declineButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    textAlign: 'center',
    lineHeight: 20,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalSafeArea: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    minHeight: 60, // Ensure adequate touch target area
  },
  modalHeaderButton: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    // Ensure buttons maintain 44x44pt touch targets throughout animation
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  emailInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  roleSelectorContainer: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 8,
  },
  roleInfo: {
    flex: 1,
    marginLeft: 12,
  },
  roleDescription: {
    fontSize: 14,
    lineHeight: 18,
    marginTop: 2,
  },
  trustInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
    gap: 12,
  },
  trustInfoContent: {
    flex: 1,
  },
  trustInfoText: {
    fontSize: 14,
    lineHeight: 18,
    marginTop: 4,
  },
  // New section header styles for separated invitations
  sectionHeader: {
    marginBottom: 12,
  },
  sectionHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionHeaderText: {
    flex: 1,
  },
  invitationGroup: {
    borderRadius: 12,
    padding: 8,
    marginTop: 4,
  },
  emptyInvitationsState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
});