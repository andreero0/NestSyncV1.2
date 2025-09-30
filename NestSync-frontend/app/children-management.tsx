/**
 * Children Management Screen
 *
 * Comprehensive interface for managing children profiles including:
 * - View all children in a list format
 * - Add new children via AddChildModal
 * - Edit existing children via EditChildModal
 * - Delete children with confirmation
 * - PIPEDA-compliant child data management
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useMutation } from '@apollo/client';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useChildren, Child } from '@/hooks/useChildren';
import { AddChildModal } from '@/components/modals/AddChildModal';
import { EditChildModal } from '@/components/modals/EditChildModal';
import { DELETE_CHILD_MUTATION } from '@/lib/graphql/mutations';
import { MY_CHILDREN_QUERY } from '@/lib/graphql/queries';

export default function ChildrenManagementScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  // State management
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Hooks
  const { children, loading, error, refetch } = useChildren();

  // Mutations
  const [deleteChild, { loading: deleting }] = useMutation(DELETE_CHILD_MUTATION, {
    refetchQueries: [{ query: MY_CHILDREN_QUERY, variables: { first: 10 } }],
    awaitRefetchQueries: true,
  });

  // Handlers
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const handleAddChild = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowAddChildModal(true);
  };

  const handleEditChild = (child: Child) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingChild(child);
  };

  const handleDeleteChild = (child: Child) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(
      'Delete Child Profile',
      `Are you sure you want to delete ${child.name}'s profile? This action cannot be undone and will remove all associated data including usage logs and inventory items.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { data } = await deleteChild({
                variables: {
                  childId: child.id,
                  input: {
                    deletionType: 'SOFT_DELETE',
                    confirmationText: `DELETE ${child.name}`,
                    reason: 'User requested deletion from settings',
                    retainAuditLogs: true
                  }
                }
              });

              if (!data?.deleteChild?.success) {
                throw new Error(data?.deleteChild?.error || 'Failed to delete child profile');
              }

              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Success', `${child.name}'s profile has been deleted.`);
            } catch (error) {
              console.error('Error deleting child:', error);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

              const errorMessage = error instanceof Error ? error.message : 'Failed to delete child profile. Please try again.';
              Alert.alert('Error', errorMessage);
            }
          },
        },
      ]
    );
  };

  const handleChildSuccess = (message: string) => {
    Alert.alert('Success', message);
  };

  const formatAge = (child: Child) => {
    if (child.ageInMonths < 12) {
      return `${child.ageInMonths} months old`;
    } else {
      const years = Math.floor(child.ageInMonths / 12);
      const months = child.ageInMonths % 12;
      return months > 0 ? `${years} years, ${months} months old` : `${years} years old`;
    }
  };

  const getChildIcon = (gender?: string) => {
    switch (gender) {
      case 'BOY':
        return 'person.fill';
      case 'GIRL':
        return 'person.fill';
      default:
        return 'person.fill';
    }
  };

  const renderChildCard = (child: Child) => (
    <ThemedView
      key={child.id}
      style={[styles.childCard, { borderColor: colors.border }]}
    >
      {/* Child Header */}
      <View style={styles.childHeader}>
        <View style={[styles.childAvatar, { backgroundColor: colors.tint }]}>
          <IconSymbol
            name={getChildIcon(child.gender)}
            size={24}
            color="#FFFFFF"
          />
        </View>

        <View style={styles.childInfo}>
          <ThemedText type="defaultSemiBold" style={styles.childName}>
            {child.name}
          </ThemedText>
          <ThemedText style={[styles.childAge, { color: colors.textSecondary }]}>
            {formatAge(child)}
          </ThemedText>
        </View>

        <View style={styles.childActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.surface }]}
            onPress={() => handleEditChild(child)}
            accessibilityLabel={`Edit ${child.name}'s profile`}
          >
            <IconSymbol name="pencil" size={16} color={colors.tint} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteChild(child)}
            disabled={deleting}
            accessibilityLabel={`Delete ${child.name}'s profile`}
          >
            {deleting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <IconSymbol name="trash" size={16} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Child Details */}
      <View style={styles.childDetails}>
        <View style={[styles.detailRow, { borderTopColor: colors.border }]}>
          <ThemedText style={[styles.detailLabel, { color: colors.textSecondary }]}>
            Current Size
          </ThemedText>
          <ThemedText style={styles.detailValue}>
            {child.currentDiaperSize?.replace('SIZE_', 'Size ') || 'Not set'}
          </ThemedText>
        </View>

        <View style={styles.detailRow}>
          <ThemedText style={[styles.detailLabel, { color: colors.textSecondary }]}>
            Daily Usage
          </ThemedText>
          <ThemedText style={styles.detailValue}>
            {child.dailyUsageCount} diapers/day
          </ThemedText>
        </View>

        {child.currentWeightKg && (
          <View style={styles.detailRow}>
            <ThemedText style={[styles.detailLabel, { color: colors.textSecondary }]}>
              Weight
            </ThemedText>
            <ThemedText style={styles.detailValue}>
              {(child.currentWeightKg * 1000).toFixed(0)}g
            </ThemedText>
          </View>
        )}

        {(child.hasSensitiveSkin || child.hasAllergies) && (
          <View style={styles.detailRow}>
            <ThemedText style={[styles.detailLabel, { color: colors.textSecondary }]}>
              Special Needs
            </ThemedText>
            <View style={styles.specialNeedsContainer}>
              {child.hasSensitiveSkin && (
                <View style={[styles.specialNeedTag, { backgroundColor: colors.surface }]}>
                  <ThemedText style={[styles.specialNeedText, { color: colors.tint }]}>
                    Sensitive Skin
                  </ThemedText>
                </View>
              )}
              {child.hasAllergies && (
                <View style={[styles.specialNeedTag, { backgroundColor: colors.surface }]}>
                  <ThemedText style={[styles.specialNeedText, { color: colors.tint }]}>
                    Allergies
                  </ThemedText>
                </View>
              )}
            </View>
          </View>
        )}
      </View>
    </ThemedView>
  );

  if (error) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen
          options={{
            headerShown: false, // Use custom header for consistent navigation
          }}
        />

        {/* Custom Header - matches profile-settings pattern */}
        <ThemedView style={[styles.header, { borderBottomColor: colors.border, paddingTop: insets.top + 16 }]}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <IconSymbol name="chevron.left" size={24} color={colors.tint} />
          </TouchableOpacity>

          <ThemedText type="title" style={styles.headerTitle}>
            Children Profiles
          </ThemedText>

          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleAddChild}
            accessibilityRole="button"
            accessibilityLabel="Add new child"
          >
            <IconSymbol name="plus" size={24} color={colors.tint} />
          </TouchableOpacity>
        </ThemedView>

        <View style={styles.centerContent}>
          <IconSymbol name="exclamationmark.triangle" size={48} color={colors.textSecondary} />
          <ThemedText type="title" style={[styles.errorTitle, { color: colors.text }]}>
            Unable to Load Children
          </ThemedText>
          <ThemedText style={[styles.errorMessage, { color: colors.textSecondary }]}>
            We couldn't load your children's profiles. Please check your connection and try again.
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
      <Stack.Screen
        options={{
          headerShown: false, // Use custom header for consistent navigation
        }}
      />

      {/* Custom Header - matches profile-settings pattern */}
      <ThemedView style={[styles.header, { borderBottomColor: colors.border, paddingTop: insets.top + 16 }]}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <IconSymbol name="chevron.left" size={24} color={colors.tint} />
        </TouchableOpacity>

        <ThemedText type="title" style={styles.headerTitle}>
          Children Profiles
        </ThemedText>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleAddChild}
          accessibilityRole="button"
          accessibilityLabel="Add new child"
        >
          <IconSymbol name="plus" size={24} color={colors.tint} />
        </TouchableOpacity>
      </ThemedView>

      {loading && children.length === 0 ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.tint} />
          <ThemedText style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading children profiles...
          </ThemedText>
        </View>
      ) : children.length === 0 ? (
        <View style={styles.centerContent}>
          <IconSymbol name="figure.2.and.child.holdinghands" size={64} color={colors.textSecondary} />
          <ThemedText type="title" style={[styles.emptyTitle, { color: colors.text }]}>
            No Children Yet
          </ThemedText>
          <ThemedText style={[styles.emptyMessage, { color: colors.textSecondary }]}>
            Add your first child to start tracking diaper usage and managing care routines.
          </ThemedText>
          <TouchableOpacity
            style={[styles.addFirstChildButton, { backgroundColor: colors.tint }]}
            onPress={handleAddChild}
          >
            <IconSymbol name="plus.circle.fill" size={20} color="#FFFFFF" />
            <ThemedText style={styles.addFirstChildText}>Add First Child</ThemedText>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {/* Header Info */}
          <View style={[styles.headerInfo, { backgroundColor: colors.surface }]}>
            <ThemedText style={[styles.headerInfoText, { color: colors.textSecondary }]}>
              {children.length} {children.length === 1 ? 'child' : 'children'}
            </ThemedText>
          </View>

          {/* Children List */}
          <View style={styles.childrenList}>
            {children.map(renderChildCard)}
          </View>

          {/* Add Another Child Button */}
          <TouchableOpacity
            style={[styles.addAnotherButton, { borderColor: colors.border }]}
            onPress={handleAddChild}
          >
            <IconSymbol name="plus.circle" size={20} color={colors.tint} />
            <ThemedText style={[styles.addAnotherText, { color: colors.tint }]}>
              Add Another Child
            </ThemedText>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Modals */}
      <AddChildModal
        visible={showAddChildModal}
        onClose={() => setShowAddChildModal(false)}
        onSuccess={handleChildSuccess}
      />

      {editingChild && (
        <EditChildModal
          visible={!!editingChild}
          child={editingChild}
          onClose={() => setEditingChild(null)}
          onSuccess={handleChildSuccess}
        />
      )}
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
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerButton: {
    padding: 8,
    minWidth: 60,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  addButton: {
    padding: 8,
    marginRight: -8,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  addFirstChildButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  addFirstChildText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  headerInfo: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 20,
  },
  headerInfoText: {
    fontSize: 14,
    textAlign: 'center',
  },
  childrenList: {
    gap: 16,
  },
  childCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  childHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  childAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 18,
    marginBottom: 4,
  },
  childAge: {
    fontSize: 14,
  },
  childActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: '#FF4444',
  },
  childDetails: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  detailLabel: {
    fontSize: 14,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  specialNeedsContainer: {
    flexDirection: 'row',
    gap: 6,
    flex: 1,
    justifyContent: 'flex-end',
  },
  specialNeedTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  specialNeedText: {
    fontSize: 12,
    fontWeight: '500',
  },
  addAnotherButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    marginTop: 20,
    gap: 8,
  },
  addAnotherText: {
    fontSize: 16,
    fontWeight: '600',
  },
});