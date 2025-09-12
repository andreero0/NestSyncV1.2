/**
 * EditInventoryModal Component
 * 
 * Allows users to edit existing inventory items from the planner view.
 * 
 * Features:
 * - Edit quantity remaining, storage location, notes, quality rating, and rebuy preference
 * - Delete functionality with safety confirmation
 * - Pre-populates form with existing item data
 * - Shows read-only item information (brand, size, type, dates)
 * - Updates inventory cache after successful operations
 * 
 * Usage Example:
 * ```tsx
 * const [editModalVisible, setEditModalVisible] = useState(false);
 * const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
 * 
 * const handleEditItem = (item: InventoryItem) => {
 *   setSelectedItem(item);
 *   setEditModalVisible(true);
 * };
 * 
 * return (
 *   <>
 *     {selectedItem && (
 *       <EditInventoryModal
 *         visible={editModalVisible}
 *         onClose={() => setEditModalVisible(false)}
 *         onSuccess={(message) => {
 *           console.log(message);
 *           // Optionally show toast notification
 *         }}
 *         inventoryItem={selectedItem}
 *       />
 *     )}
 *   </>
 * );
 * ```
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useMutation } from '@apollo/client';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '../ThemedText';
import { IconSymbol } from '../ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { 
  UPDATE_INVENTORY_ITEM_MUTATION, 
  DELETE_INVENTORY_ITEM_MUTATION,
  GET_DASHBOARD_STATS_QUERY,
  GET_INVENTORY_ITEMS_QUERY,
  UpdateInventoryItemInput,
  DeleteInventoryItemInput
} from '@/lib/graphql/mutations';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface InventoryItem {
  id: string;
  childId: string;
  productType: string;
  brand: string;
  productName?: string;
  size: string;
  quantityTotal: number;
  quantityRemaining: number;
  quantityReserved: number;
  purchaseDate: string;
  costCad?: number;
  expiryDate?: string;
  storageLocation?: string;
  isOpened: boolean;
  openedDate?: string;
  notes?: string;
  qualityRating?: number;
  wouldRebuy?: boolean;
  createdAt: string;
  quantityAvailable: number;
  usagePercentage: number;
  isExpired: boolean;
  daysUntilExpiry?: number;
}

interface EditInventoryModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
  inventoryItem: InventoryItem;
}

export function EditInventoryModal({ visible, onClose, onSuccess, inventoryItem }: EditInventoryModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  // Animation values
  const modalScale = useSharedValue(0.9);
  const modalOpacity = useSharedValue(0);
  const slideY = useSharedValue(screenHeight);

  // Form state - initialize with existing item data
  const [quantityRemaining, setQuantityRemaining] = useState<string>('');
  const [storageLocation, setStorageLocation] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [qualityRating, setQualityRating] = useState<number>(0);
  const [wouldRebuy, setWouldRebuy] = useState<boolean>(false);
  
  // Confirmation state for delete
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<boolean>(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState<string>('');

  // GraphQL mutations
  const [updateInventoryItem, { loading: updateLoading }] = useMutation(UPDATE_INVENTORY_ITEM_MUTATION, {
    refetchQueries: [
      {
        query: GET_DASHBOARD_STATS_QUERY,
        variables: { childId: inventoryItem.childId },
      },
      {
        query: GET_INVENTORY_ITEMS_QUERY,
        variables: { childId: inventoryItem.childId, productType: inventoryItem.productType },
      },
    ],
  });

  const [deleteInventoryItem, { loading: deleteLoading }] = useMutation(DELETE_INVENTORY_ITEM_MUTATION, {
    refetchQueries: [
      {
        query: GET_DASHBOARD_STATS_QUERY,
        variables: { childId: inventoryItem.childId },
      },
      {
        query: GET_INVENTORY_ITEMS_QUERY,
        variables: { childId: inventoryItem.childId, productType: inventoryItem.productType },
      },
    ],
  });

  // Initialize form with existing item data
  useEffect(() => {
    if (inventoryItem && visible) {
      setQuantityRemaining(inventoryItem.quantityRemaining.toString());
      setStorageLocation(inventoryItem.storageLocation || '');
      setNotes(inventoryItem.notes || '');
      setQualityRating(inventoryItem.qualityRating || 0);
      setWouldRebuy(inventoryItem.wouldRebuy || false);
      setDeleteConfirmationText('');
      setShowDeleteConfirmation(false);
    }
  }, [inventoryItem, visible]);

  // Animation effects
  useEffect(() => {
    if (visible) {
      // Show animation
      modalOpacity.value = withTiming(1, { duration: 300 });
      modalScale.value = withSpring(1, {
        damping: 20,
        stiffness: 300,
      });
      slideY.value = withSpring(0, {
        damping: 25,
        stiffness: 400,
      });
    } else {
      // Hide animation
      modalOpacity.value = withTiming(0, { duration: 200 });
      modalScale.value = withTiming(0.9, { duration: 200 });
      slideY.value = withTiming(screenHeight, { duration: 200 });
    }
  }, [visible, modalOpacity, modalScale, slideY]);

  // Format dates for display
  const formatDateForDisplay = (isoDate?: string): string => {
    if (!isoDate) return 'Not set';
    try {
      const date = new Date(isoDate);
      return date.toLocaleDateString('en-CA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'America/Toronto'
      });
    } catch {
      return 'Invalid date';
    }
  };

  // Form validation helper
  const isFormValid = () => {
    if (updateLoading || deleteLoading) return false;
    const quantityNumber = parseInt(quantityRemaining, 10);
    return !isNaN(quantityNumber) && quantityNumber >= 0;
  };

  // Handle update submission
  const handleUpdate = async () => {
    const quantityNumber = parseInt(quantityRemaining, 10);
    if (isNaN(quantityNumber) || quantityNumber < 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid quantity (0 or greater).');
      return;
    }

    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const input: UpdateInventoryItemInput = {
        quantityRemaining: quantityNumber,
        storageLocation: storageLocation.trim() || undefined,
        notes: notes.trim() || undefined,
        qualityRating: qualityRating > 0 ? qualityRating : undefined,
        wouldRebuy: wouldRebuy,
      };

      const result = await updateInventoryItem({
        variables: { 
          inventoryItemId: inventoryItem.id,
          input 
        },
      });

      if (result.data?.updateInventoryItem?.success) {
        onSuccess?.('Inventory item updated successfully!');
        handleClose();
      } else {
        Alert.alert('Update Failed', result.data?.updateInventoryItem?.error || 'Failed to update inventory item');
      }
    } catch (updateError) {
      console.error('Error updating inventory item:', updateError);
      Alert.alert('Update Failed', 'An unexpected error occurred while updating the item.');
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirmation = () => {
    setShowDeleteConfirmation(true);
  };

  // Handle delete submission
  const handleDelete = async () => {
    const expectedText = `DELETE ${inventoryItem.brand} ${inventoryItem.size}`;
    
    if (deleteConfirmationText.trim() !== expectedText) {
      Alert.alert(
        'Confirmation Required', 
        `Please type exactly: "${expectedText}" to confirm deletion.`
      );
      return;
    }

    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      const input: DeleteInventoryItemInput = {
        confirmationText: deleteConfirmationText.trim(),
        reason: 'User requested deletion via mobile app',
      };

      const result = await deleteInventoryItem({
        variables: { 
          inventoryItemId: inventoryItem.id,
          input 
        },
      });

      if (result.data?.deleteInventoryItem?.success) {
        onSuccess?.('Inventory item deleted successfully!');
        handleClose();
      } else {
        Alert.alert('Delete Failed', result.data?.deleteInventoryItem?.error || 'Failed to delete inventory item');
      }
    } catch (deleteError) {
      console.error('Error deleting inventory item:', deleteError);
      Alert.alert('Delete Failed', 'An unexpected error occurred while deleting the item.');
    }
  };

  // Handle modal close with animation
  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowDeleteConfirmation(false);
    onClose();
    
    // Reset form state after animation
    setTimeout(() => {
      setQuantityRemaining('');
      setStorageLocation('');
      setNotes('');
      setQualityRating(0);
      setWouldRebuy(false);
      setDeleteConfirmationText('');
      setShowDeleteConfirmation(false);
    }, 300);
  };

  // Animated styles
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
  }));

  const modalStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: modalScale.value },
      { translateY: slideY.value },
    ],
    opacity: modalOpacity.value,
  }));

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      statusBarTranslucent={true}
      onRequestClose={handleClose}
    >
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <BlurView intensity={20} style={StyleSheet.absoluteFill}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={handleClose}
          />
        </BlurView>
        
        <Animated.View style={[styles.modalContainer, modalStyle]}>
          <KeyboardAvoidingView 
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            <View style={[
              styles.modal,
              { 
                backgroundColor: colors.background,
                borderColor: colors.border,
                paddingTop: Math.max(insets.top, 20),
                paddingBottom: Math.max(insets.bottom, 20),
              }
            ]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.headerContent}>
                <IconSymbol name="pencil" size={24} color={colors.tint} />
                <ThemedText type="title" style={styles.headerTitle}>
                  Edit Stock
                </ThemedText>
              </View>
              <View style={styles.headerActions}>
                <TouchableOpacity
                  style={[styles.deleteButton, { backgroundColor: colors.errorSurface || '#ffebee' }]}
                  onPress={handleDeleteConfirmation}
                  accessibilityRole="button"
                  accessibilityLabel="Delete item"
                >
                  <IconSymbol name="trash" size={18} color={colors.error} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.closeButton, { backgroundColor: colors.surface }]}
                  onPress={handleClose}
                  accessibilityRole="button"
                  accessibilityLabel="Close modal"
                >
                  <IconSymbol name="xmark" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView 
              style={styles.content}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[styles.contentContainer, { paddingBottom: 20 }]}
              keyboardShouldPersistTaps="handled"
            >
              {/* Item Information - Read Only */}
              <View style={[styles.infoSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <ThemedText type="defaultSemiBold" style={[styles.sectionTitle, { color: colors.text }]}>
                  Item Information
                </ThemedText>
                <View style={styles.infoRow}>
                  <ThemedText style={[styles.infoLabel, { color: colors.textSecondary }]}>Brand:</ThemedText>
                  <ThemedText style={[styles.infoValue, { color: colors.text }]}>{inventoryItem.brand}</ThemedText>
                </View>
                {inventoryItem.productName && (
                  <View style={styles.infoRow}>
                    <ThemedText style={[styles.infoLabel, { color: colors.textSecondary }]}>Product:</ThemedText>
                    <ThemedText style={[styles.infoValue, { color: colors.text }]}>{inventoryItem.productName}</ThemedText>
                  </View>
                )}
                <View style={styles.infoRow}>
                  <ThemedText style={[styles.infoLabel, { color: colors.textSecondary }]}>Size:</ThemedText>
                  <ThemedText style={[styles.infoValue, { color: colors.text }]}>{inventoryItem.size}</ThemedText>
                </View>
                <View style={styles.infoRow}>
                  <ThemedText style={[styles.infoLabel, { color: colors.textSecondary }]}>Type:</ThemedText>
                  <ThemedText style={[styles.infoValue, { color: colors.text }]}>{inventoryItem.productType}</ThemedText>
                </View>
                <View style={styles.infoRow}>
                  <ThemedText style={[styles.infoLabel, { color: colors.textSecondary }]}>Purchased:</ThemedText>
                  <ThemedText style={[styles.infoValue, { color: colors.text }]}>{formatDateForDisplay(inventoryItem.purchaseDate)}</ThemedText>
                </View>
                {inventoryItem.expiryDate && (
                  <View style={styles.infoRow}>
                    <ThemedText style={[styles.infoLabel, { color: colors.textSecondary }]}>Expires:</ThemedText>
                    <ThemedText style={[styles.infoValue, { color: colors.text }]}>{formatDateForDisplay(inventoryItem.expiryDate)}</ThemedText>
                  </View>
                )}
                <View style={styles.infoRow}>
                  <ThemedText style={[styles.infoLabel, { color: colors.textSecondary }]}>Total Quantity:</ThemedText>
                  <ThemedText style={[styles.infoValue, { color: colors.text }]}>{inventoryItem.quantityTotal}</ThemedText>
                </View>
              </View>

              {/* Editable Fields */}
              <View style={styles.section}>
                <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                  Quantity Remaining *
                </ThemedText>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  placeholder="0"
                  placeholderTextColor={colors.placeholder}
                  value={quantityRemaining}
                  onChangeText={setQuantityRemaining}
                  keyboardType="numeric"
                  maxLength={4}
                />
              </View>

              <View style={styles.section}>
                <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                  Storage Location
                </ThemedText>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  placeholder="e.g., Closet, Pantry, Nursery"
                  placeholderTextColor={colors.placeholder}
                  value={storageLocation}
                  onChangeText={setStorageLocation}
                  maxLength={30}
                />
              </View>

              <View style={styles.section}>
                <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                  Notes
                </ThemedText>
                <TextInput
                  style={[
                    styles.notesInput,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  placeholder="Additional notes about this item..."
                  placeholderTextColor={colors.placeholder}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={3}
                  maxLength={200}
                  textAlignVertical="top"
                />
                <ThemedText style={[styles.characterCount, { color: colors.textSecondary }]}>
                  {notes.length}/200 characters
                </ThemedText>
              </View>

              {/* Quality Rating */}
              <View style={styles.section}>
                <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                  Quality Rating
                </ThemedText>
                <View style={styles.starRating}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      style={styles.starButton}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setQualityRating(star);
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`Rate ${star} stars`}
                    >
                      <IconSymbol
                        name={star <= qualityRating ? "star.fill" : "star"}
                        size={24}
                        color={star <= qualityRating ? "#FFD700" : colors.textSecondary}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Would Rebuy Toggle */}
              <View style={styles.section}>
                <View style={styles.toggleRow}>
                  <View style={styles.toggleContent}>
                    <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                      Would Buy Again
                    </ThemedText>
                    <ThemedText style={[styles.toggleDescription, { color: colors.textSecondary }]}>
                      Would you purchase this product again?
                    </ThemedText>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.toggle,
                      {
                        backgroundColor: wouldRebuy ? colors.success : colors.surface,
                        borderColor: wouldRebuy ? colors.success : colors.border,
                      },
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setWouldRebuy(!wouldRebuy);
                    }}
                    accessibilityRole="switch"
                    accessibilityState={{ checked: wouldRebuy }}
                  >
                    {wouldRebuy && (
                      <IconSymbol name="checkmark" size={16} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Delete Confirmation Section */}
              {showDeleteConfirmation && (
                <View style={[styles.deleteSection, { backgroundColor: colors.errorSurface || '#ffebee', borderColor: colors.error }]}>
                  <ThemedText type="defaultSemiBold" style={[styles.deleteSectionTitle, { color: colors.error }]}>
                    Delete Confirmation
                  </ThemedText>
                  <ThemedText style={[styles.deleteWarning, { color: colors.error }]}>
                    This action cannot be undone. Type exactly the following to confirm:
                  </ThemedText>
                  <ThemedText type="defaultSemiBold" style={[styles.deleteConfirmationRequired, { color: colors.error }]}>
                    DELETE {inventoryItem.brand} {inventoryItem.size}
                  </ThemedText>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.error,
                        color: colors.text,
                        marginTop: 12,
                      },
                    ]}
                    placeholder={`DELETE ${inventoryItem.brand} ${inventoryItem.size}`}
                    placeholderTextColor={colors.placeholder}
                    value={deleteConfirmationText}
                    onChangeText={setDeleteConfirmationText}
                    maxLength={100}
                  />
                </View>
              )}

              {/* Action Buttons */}
              <View style={[styles.actions, { borderTopColor: colors.border }]}>
                <TouchableOpacity
                  style={[styles.secondaryButton, { borderColor: colors.border }]}
                  onPress={handleClose}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel"
                >
                  <ThemedText style={[styles.secondaryButtonText, { color: colors.textSecondary }]}>
                    Cancel
                  </ThemedText>
                </TouchableOpacity>
                
                {showDeleteConfirmation ? (
                  <TouchableOpacity
                    style={[
                      styles.primaryButton,
                      { 
                        backgroundColor: colors.error,
                        opacity: deleteConfirmationText.trim() === `DELETE ${inventoryItem.brand} ${inventoryItem.size}` ? 1 : 0.6,
                      },
                    ]}
                    onPress={handleDelete}
                    disabled={deleteConfirmationText.trim() !== `DELETE ${inventoryItem.brand} ${inventoryItem.size}` || deleteLoading}
                    accessibilityRole="button"
                    accessibilityLabel="Delete inventory item"
                  >
                    {deleteLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <IconSymbol name="trash" size={18} color="#FFFFFF" />
                        <ThemedText style={styles.primaryButtonText}>
                          Delete Item
                        </ThemedText>
                      </>
                    )}
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.primaryButton,
                      { 
                        backgroundColor: colors.tint,
                        opacity: isFormValid() ? 1 : 0.6,
                      },
                    ]}
                    onPress={handleUpdate}
                    disabled={!isFormValid()}
                    accessibilityRole="button"
                    accessibilityLabel="Update inventory item"
                  >
                    {updateLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <IconSymbol name="checkmark" size={18} color="#FFFFFF" />
                        <ThemedText style={styles.primaryButtonText}>
                          Update Item
                        </ThemedText>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: screenWidth - 40,
    maxHeight: screenHeight * 0.9,
    flex: 1,
    maxWidth: 500,
  },
  modal: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    flexGrow: 1,
  },
  infoSection: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  infoLabel: {
    fontSize: 14,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 12,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 48,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  starRating: {
    flexDirection: 'row',
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleContent: {
    flex: 1,
  },
  toggleDescription: {
    fontSize: 14,
    marginTop: 2,
  },
  toggle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteSection: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 24,
  },
  deleteSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  deleteWarning: {
    fontSize: 14,
    marginBottom: 8,
  },
  deleteConfirmationRequired: {
    fontSize: 14,
    fontFamily: 'monospace',
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    marginTop: 8,
    borderTopWidth: 1,
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  primaryButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});