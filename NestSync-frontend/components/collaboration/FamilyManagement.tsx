/**
 * Family Management Component
 * Manages family members, invitations, and caregiver permissions
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { NestSyncButton } from '@/components/ui/NestSyncButton';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useCurrentFamily, useInviteCaregiver } from '@/lib/graphql/collaboration-hooks';
import { FamilyMember, MemberPermissions } from '@/lib/graphql/queries';

interface FamilyManagementProps {
  onClose: () => void;
}

interface InvitationFormData {
  email: string;
  role: 'FAMILY_CORE' | 'EXTENDED_FAMILY' | 'PROFESSIONAL' | 'INSTITUTIONAL';
  customPermissions: boolean;
  permissions: Partial<MemberPermissions>;
}

export default function FamilyManagement({ onClose }: FamilyManagementProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Collaboration hooks
  const { currentFamily, familyMembers, pendingInvitations, isLoading } = useCurrentFamily();
  const { inviteCaregiver, loading: inviteLoading } = useInviteCaregiver();

  // UI state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showMemberDetails, setShowMemberDetails] = useState<string | null>(null);
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
              {member.userDisplayName || 'Unknown'}
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
              {invitation.email}
            </ThemedText>
            <ThemedText style={[styles.memberEmail, { color: colors.textSecondary }]}>
              Pending invitation
            </ThemedText>
            <Text style={[styles.roleLabel, { color: roleDisplay.color }]}>
              {roleDisplay.label}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.resendButton, { backgroundColor: colors.tint }]}
          onPress={() => {
            // TODO: Implement resend invitation
            Alert.alert('Feature Coming Soon', 'Resend invitation functionality will be available soon');
          }}
        >
          <Text style={styles.resendButtonText}>Resend</Text>
        </TouchableOpacity>
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
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
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

        {/* Pending Invitations */}
        {pendingInvitations && pendingInvitations.length > 0 && (
          <View style={styles.section}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              Pending Invitations ({pendingInvitations.length})
            </ThemedText>
            {pendingInvitations.map(renderInvitationCard)}
          </View>
        )}

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

      {/* Invite Caregiver Modal */}
      <Modal
        visible={showInviteModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowInviteModal(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowInviteModal(false)}>
              <Text style={[styles.cancelButton, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
            <ThemedText type="subtitle">Invite Caregiver</ThemedText>
            <TouchableOpacity
              onPress={handleInviteCaregiver}
              disabled={!invitationForm.email.trim() || inviteLoading}
            >
              <Text
                style={[
                  styles.saveButton,
                  {
                    color: invitationForm.email.trim() ? colors.tint : colors.textSecondary,
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
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  cancelButton: {
    fontSize: 16,
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
});