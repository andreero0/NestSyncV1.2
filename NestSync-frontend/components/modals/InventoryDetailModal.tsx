import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Alert,
  RefreshControl,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useQuery, useMutation } from '@apollo/client';
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
  GET_INVENTORY_ITEMS_QUERY, 
  GET_DASHBOARD_STATS_QUERY,
  UPDATE_INVENTORY_ITEM_MUTATION,
  DELETE_INVENTORY_ITEM_MUTATION,
  INVENTORY_ITEM_FRAGMENT,
  type UpdateInventoryItemInput
} from '@/lib/graphql/mutations';
import { formatDiaperSize, formatFieldWithFallback } from '@/lib/utils/enumDisplayFormatters';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface InventoryDetailModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
  onAddMore?: () => void;
  childId: string;
}

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

interface GroupedInventory {
  [key: string]: InventoryItem[];
}

export function InventoryDetailModal({ visible, onClose, onSuccess, onAddMore, childId }: InventoryDetailModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  // Animation values
  const modalScale = useSharedValue(0.9);
  const modalOpacity = useSharedValue(0);
  const slideY = useSharedValue(screenHeight);

  // State
  const [sortBy, setSortBy] = useState<'brand' | 'size' | 'quantity' | 'expiry'>('brand');
  const [filterBy, setFilterBy] = useState<'all' | 'open' | 'low-stock' | 'expiring'>('all');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [editRating, setEditRating] = useState<number>(0);

  // GraphQL queries and mutations
  const { 
    data: inventoryData, 
    loading: inventoryLoading, 
    error: inventoryError,
    refetch: refetchInventory 
  } = useQuery(GET_INVENTORY_ITEMS_QUERY, {
    variables: { 
      childId: childId,
      productType: 'DIAPER', // Focus on diapers for this version
      limit: 100 
    },
    skip: !visible || !childId,
    fetchPolicy: 'cache-and-network',
  });

  const [updateInventoryItem, { loading: updateLoading }] = useMutation(UPDATE_INVENTORY_ITEM_MUTATION, {
    refetchQueries: [
      {
        query: GET_INVENTORY_ITEMS_QUERY,
        variables: { childId: childId, productType: 'DIAPER', limit: 100 },
      },
      {
        query: GET_DASHBOARD_STATS_QUERY,
        variables: { childId: childId },
      },
    ],
  });

  const [deleteInventoryItem, { loading: deleteLoading }] = useMutation(DELETE_INVENTORY_ITEM_MUTATION, {
    refetchQueries: [
      {
        query: GET_INVENTORY_ITEMS_QUERY,
        variables: { childId: childId, productType: 'DIAPER', limit: 100 },
      },
      {
        query: GET_DASHBOARD_STATS_QUERY,
        variables: { childId: childId },
      },
    ],
  });

  // Animation effects
  React.useEffect(() => {
    if (visible) {
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
      modalOpacity.value = withTiming(0, { duration: 200 });
      modalScale.value = withTiming(0.9, { duration: 200 });
      slideY.value = withTiming(screenHeight, { duration: 200 });
    }
  }, [visible]);

  // Process and group inventory data
  const inventoryItems: InventoryItem[] = useMemo(() => {
    if (!inventoryData?.getInventoryItems?.edges) return [];
    return inventoryData.getInventoryItems.edges.map((edge: any) => edge.node);
  }, [inventoryData]);

  // Calculate summary statistics
  const inventorySummary = useMemo(() => {
    const totalDiapers = inventoryItems.reduce((sum, item) => sum + item.quantityRemaining, 0);
    const totalPackages = inventoryItems.length;
    const openPackages = inventoryItems.filter(item => item.isOpened).length;
    const expiringPackages = inventoryItems.filter(item => 
      item.daysUntilExpiry !== null && item.daysUntilExpiry !== undefined && item.daysUntilExpiry <= 30
    ).length;
    const lowStockPackages = inventoryItems.filter(item => 
      item.usagePercentage >= 80
    ).length;

    return {
      totalDiapers,
      totalPackages,
      openPackages,
      expiringPackages,
      lowStockPackages,
    };
  }, [inventoryItems]);

  // Filter inventory items
  const filteredItems = useMemo(() => {
    let filtered = [...inventoryItems];

    switch (filterBy) {
      case 'open':
        filtered = filtered.filter(item => item.isOpened);
        break;
      case 'low-stock':
        filtered = filtered.filter(item => item.usagePercentage >= 80);
        break;
      case 'expiring':
        filtered = filtered.filter(item => 
          item.daysUntilExpiry !== null && item.daysUntilExpiry !== undefined && item.daysUntilExpiry <= 30
        );
        break;
    }

    return filtered;
  }, [inventoryItems, filterBy]);

  // Group inventory items
  const groupedInventory: GroupedInventory = useMemo(() => {
    const grouped: GroupedInventory = {};

    filteredItems.forEach(item => {
      let groupKey: string;
      
      switch (sortBy) {
        case 'brand':
          groupKey = item.brand;
          break;
        case 'size':
          groupKey = formatDiaperSize(item.size);
          break;
        case 'quantity':
          if (item.quantityRemaining === 0) groupKey = 'Empty';
          else if (item.quantityRemaining <= 5) groupKey = 'Low Stock (1-5)';
          else if (item.quantityRemaining <= 20) groupKey = 'Medium Stock (6-20)';
          else groupKey = 'High Stock (20+)';
          break;
        case 'expiry':
          if (item.daysUntilExpiry === null || item.daysUntilExpiry === undefined) {
            groupKey = 'No Expiry Date';
          } else if (item.daysUntilExpiry <= 0) {
            groupKey = 'Expired';
          } else if (item.daysUntilExpiry <= 7) {
            groupKey = 'Expiring This Week';
          } else if (item.daysUntilExpiry <= 30) {
            groupKey = 'Expiring This Month';
          } else {
            groupKey = 'Good Until Later';
          }
          break;
        default:
          groupKey = 'Other';
      }

      if (!grouped[groupKey]) {
        grouped[groupKey] = [];
      }
      grouped[groupKey].push(item);
    });

    // Sort items within each group
    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a, b) => {
        switch (sortBy) {
          case 'quantity':
            return b.quantityRemaining - a.quantityRemaining;
          case 'expiry':
            if (a.daysUntilExpiry === null || a.daysUntilExpiry === undefined) return 1;
            if (b.daysUntilExpiry === null || b.daysUntilExpiry === undefined) return -1;
            return a.daysUntilExpiry - b.daysUntilExpiry;
          default:
            return a.brand.localeCompare(b.brand);
        }
      });
    });

    return grouped;
  }, [filteredItems, sortBy]);

  // Handle modal close with animation
  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingItemId(null);
    setExpandedGroups(new Set());
    onClose();
  };

  // Handle group expansion
  const toggleGroupExpansion = (groupKey: string) => {
    Haptics.selectionAsync();
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey);
    } else {
      newExpanded.add(groupKey);
    }
    setExpandedGroups(newExpanded);
  };

  // Handle item editing
  const startEditing = (item: InventoryItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setEditingItemId(item.id);
    setEditQuantity(item.quantityRemaining.toString());
    setEditNotes(item.notes || '');
    setEditRating(item.qualityRating || 0);
  };

  const cancelEditing = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingItemId(null);
    setEditQuantity('');
    setEditNotes('');
    setEditRating(0);
  };

  const saveEdit = async (itemId: string) => {
    if (!editQuantity.trim()) return;

    const quantity = parseInt(editQuantity, 10);
    if (isNaN(quantity) || quantity < 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid quantity (0 or greater).');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const input: UpdateInventoryItemInput = {
        quantityRemaining: quantity,
        notes: editNotes.trim() || undefined,
        qualityRating: editRating > 0 ? editRating : undefined,
      };

      const result = await updateInventoryItem({
        variables: { inventoryItemId: itemId, input },
      });

      if (result.data?.updateInventoryItem?.success) {
        onSuccess?.('Inventory updated successfully!');
        setEditingItemId(null);
      } else {
        Alert.alert('Update Failed', result.data?.updateInventoryItem?.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error updating inventory item:', error);
      Alert.alert('Update Failed', 'Could not update inventory item. Please try again.');
    }
  };

  const handleDeleteItem = (itemId: string, itemDescription: string) => {
    Alert.alert(
      'Delete Inventory Item',
      `Are you sure you want to delete "${itemDescription}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            
            try {
              const result = await deleteInventoryItem({
                variables: { inventoryItemId: itemId },
              });

              if (result.data?.deleteInventoryItem?.success) {
                onSuccess?.('Inventory item deleted successfully.');
              } else {
                Alert.alert('Delete Failed', result.data?.deleteInventoryItem?.error || 'Unknown error');
              }
            } catch (error) {
              console.error('Error deleting inventory item:', error);
              Alert.alert('Delete Failed', 'Could not delete inventory item. Please try again.');
            }
          }
        }
      ]
    );
  };

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    try {
      await refetchInventory();
      onSuccess?.('Inventory refreshed successfully!');
    } catch (error) {
      Alert.alert('Refresh Failed', 'Could not refresh inventory data. Please try again.');
    }
  }, [refetchInventory, onSuccess]);

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

  const renderInventoryItem = (item: InventoryItem) => {
    const isEditing = editingItemId === item.id;
    const isExpiring = item.daysUntilExpiry !== null && item.daysUntilExpiry !== undefined && item.daysUntilExpiry <= 30;
    const isLowStock = item.usagePercentage >= 80;
    
    return (
      <View 
        key={item.id} 
        style={[
          styles.inventoryItem, 
          { 
            backgroundColor: colors.surface, 
            borderColor: isExpiring ? colors.warning : colors.border 
          }
        ]}
      >
        {/* Item Header */}
        <View style={styles.itemHeader}>
          <View style={styles.itemInfo}>
            <ThemedText type="defaultSemiBold" style={styles.itemBrand}>
              {item.brand} {item.productName && `- ${item.productName}`}
            </ThemedText>
            <ThemedText style={[styles.itemSize, { color: colors.textSecondary }]}>
              {formatDiaperSize(item.size)} • {item.quantityRemaining} remaining
            </ThemedText>
          </View>
          
          {/* Status Indicators */}
          <View style={styles.statusIndicators}>
            {item.isOpened && (
              <View style={[styles.statusBadge, { backgroundColor: colors.accent }]}>
                <ThemedText style={styles.statusBadgeText}>Open</ThemedText>
              </View>
            )}
            {isLowStock && (
              <View style={[styles.statusBadge, { backgroundColor: colors.warning }]}>
                <ThemedText style={styles.statusBadgeText}>Low</ThemedText>
              </View>
            )}
            {isExpiring && (
              <View style={[styles.statusBadge, { backgroundColor: colors.error }]}>
                <ThemedText style={styles.statusBadgeText}>Expiring</ThemedText>
              </View>
            )}
          </View>
        </View>

        {/* Usage Progress Bar */}
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View 
            style={[
              styles.progressFill, 
              { 
                backgroundColor: isLowStock ? colors.warning : colors.success,
                width: `${item.usagePercentage}%` 
              }
            ]} 
          />
        </View>
        <ThemedText style={[styles.usageText, { color: colors.textSecondary }]}>
          {item.usagePercentage}% used ({item.quantityTotal - item.quantityRemaining} of {item.quantityTotal})
        </ThemedText>

        {/* Item Details */}
        <View style={styles.itemDetails}>
          <View style={styles.detailRow}>
            <IconSymbol name="calendar" size={14} color={colors.textSecondary} />
            <ThemedText style={[styles.detailText, { color: colors.textSecondary }]}>
              Purchased: {formatFieldWithFallback(item.purchaseDate, 'date')}
            </ThemedText>
          </View>
          
          {item.expiryDate && (
            <View style={styles.detailRow}>
              <IconSymbol name="clock" size={14} color={isExpiring ? colors.error : colors.textSecondary} />
              <ThemedText style={[styles.detailText, { color: isExpiring ? colors.error : colors.textSecondary }]}>
                Expires: {formatFieldWithFallback(item.expiryDate, 'date')}
                {item.daysUntilExpiry !== null && item.daysUntilExpiry !== undefined && 
                  ` (${item.daysUntilExpiry} days)`
                }
              </ThemedText>
            </View>
          )}
          
          {item.costCad && (
            <View style={styles.detailRow}>
              <IconSymbol name="dollarsign.circle" size={14} color={colors.textSecondary} />
              <ThemedText style={[styles.detailText, { color: colors.textSecondary }]}>
                Cost: ${item.costCad.toFixed(2)} CAD
              </ThemedText>
            </View>
          )}
        </View>

        {/* Editing Mode */}
        {isEditing ? (
          <View style={styles.editingContainer}>
            <View style={styles.editRow}>
              <ThemedText style={styles.editLabel}>Quantity Remaining:</ThemedText>
              <View style={[styles.editInput, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <ThemedText
                  style={[styles.editInputText, { color: colors.text }]}
                  onPress={() => {
                    // For now, use a simple prompt since TextInput in this context might be complex
                    Alert.prompt(
                      'Update Quantity',
                      'Enter new quantity remaining:',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { 
                          text: 'Update', 
                          onPress: (text) => {
                            if (text) setEditQuantity(text);
                          }
                        }
                      ],
                      'plain-text',
                      editQuantity
                    );
                  }}
                >
                  {editQuantity}
                </ThemedText>
              </View>
            </View>
            
            <View style={styles.editActions}>
              <TouchableOpacity
                style={[styles.editButton, styles.cancelButton, { borderColor: colors.border }]}
                onPress={cancelEditing}
              >
                <ThemedText style={[styles.editButtonText, { color: colors.textSecondary }]}>
                  Cancel
                </ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.editButton, styles.saveButton, { backgroundColor: colors.success }]}
                onPress={() => saveEdit(item.id)}
                disabled={updateLoading}
              >
                {updateLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <ThemedText style={styles.saveButtonText}>Save</ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* Action Buttons */
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, { borderColor: colors.border }]}
              onPress={() => startEditing(item)}
            >
              <IconSymbol name="pencil" size={16} color={colors.tint} />
              <ThemedText style={[styles.actionButtonText, { color: colors.tint }]}>Edit</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, { borderColor: colors.border }]}
              onPress={() => handleDeleteItem(item.id, `${item.brand} ${formatDiaperSize(item.size)}`)}
            >
              <IconSymbol name="trash" size={16} color={colors.error} />
              <ThemedText style={[styles.actionButtonText, { color: colors.error }]}>Delete</ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

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
                  <IconSymbol name="cube.box.fill" size={24} color={colors.tint} />
                  <ThemedText type="title" style={styles.headerTitle}>
                    Diaper Inventory
                  </ThemedText>
                </View>
                <View style={styles.headerActions}>
                  {onAddMore && (
                    <TouchableOpacity
                      style={[styles.addButton, { backgroundColor: colors.success }]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        onAddMore();
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="Add more stock"
                    >
                      <IconSymbol name="plus" size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  )}
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

              {/* Summary Stats */}
              <View style={[styles.summaryContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.summaryGrid}>
                  <View style={styles.summaryItem}>
                    <ThemedText type="title" style={[styles.summaryNumber, { color: colors.tint }]}>
                      {inventorySummary.totalDiapers}
                    </ThemedText>
                    <ThemedText style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                      Total Diapers
                    </ThemedText>
                  </View>
                  <View style={styles.summaryItem}>
                    <ThemedText type="title" style={[styles.summaryNumber, { color: colors.success }]}>
                      {inventorySummary.totalPackages}
                    </ThemedText>
                    <ThemedText style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                      Packages
                    </ThemedText>
                  </View>
                  <View style={styles.summaryItem}>
                    <ThemedText type="title" style={[styles.summaryNumber, { color: colors.accent }]}>
                      {inventorySummary.openPackages}
                    </ThemedText>
                    <ThemedText style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                      Open
                    </ThemedText>
                  </View>
                  {inventorySummary.expiringPackages > 0 && (
                    <View style={styles.summaryItem}>
                      <ThemedText type="title" style={[styles.summaryNumber, { color: colors.warning }]}>
                        {inventorySummary.expiringPackages}
                      </ThemedText>
                      <ThemedText style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                        Expiring
                      </ThemedText>
                    </View>
                  )}
                </View>
              </View>

              {/* Filter and Sort Controls */}
              <View style={styles.controlsContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
                  {(['all', 'open', 'low-stock', 'expiring'] as const).map(filter => (
                    <TouchableOpacity
                      key={filter}
                      style={[
                        styles.filterChip,
                        {
                          backgroundColor: filterBy === filter ? colors.tint : colors.surface,
                          borderColor: filterBy === filter ? colors.tint : colors.border,
                        }
                      ]}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setFilterBy(filter);
                      }}
                    >
                      <ThemedText
                        style={[
                          styles.filterChipText,
                          { color: filterBy === filter ? '#FFFFFF' : colors.text }
                        ]}
                      >
                        {filter === 'all' ? 'All' : 
                         filter === 'open' ? 'Open' :
                         filter === 'low-stock' ? 'Low Stock' : 'Expiring'}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortContainer}>
                  {(['brand', 'size', 'quantity', 'expiry'] as const).map(sort => (
                    <TouchableOpacity
                      key={sort}
                      style={[
                        styles.sortChip,
                        {
                          backgroundColor: sortBy === sort ? colors.success : colors.surface,
                          borderColor: sortBy === sort ? colors.success : colors.border,
                        }
                      ]}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setSortBy(sort);
                      }}
                    >
                      <ThemedText
                        style={[
                          styles.sortChipText,
                          { color: sortBy === sort ? '#FFFFFF' : colors.text }
                        ]}
                      >
                        {sort === 'brand' ? 'Brand' :
                         sort === 'size' ? 'Size' :
                         sort === 'quantity' ? 'Quantity' : 'Expiry'}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <ScrollView 
                style={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl
                    refreshing={inventoryLoading}
                    onRefresh={handleRefresh}
                    tintColor={colors.tint}
                  />
                }
              >
                {/* Loading State */}
                {inventoryLoading && (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.tint} />
                    <ThemedText style={[styles.loadingText, { color: colors.textSecondary }]}>
                      Loading inventory details...
                    </ThemedText>
                  </View>
                )}

                {/* Error State */}
                {inventoryError && (
                  <View style={[styles.errorContainer, { backgroundColor: colors.surface, borderColor: colors.error }]}>
                    <IconSymbol name="exclamationmark.triangle" size={24} color={colors.error} />
                    <ThemedText style={[styles.errorText, { color: colors.error }]}>
                      Failed to load inventory data. Pull to refresh.
                    </ThemedText>
                  </View>
                )}

                {/* Empty State */}
                {!inventoryLoading && !inventoryError && filteredItems.length === 0 && (
                  <View style={[styles.emptyContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <IconSymbol name="cube.box" size={48} color={colors.textSecondary} />
                    <ThemedText type="title" style={[styles.emptyTitle, { color: colors.text }]}>
                      {filterBy === 'all' ? 'No Inventory Items' : 'No Items Match Filter'}
                    </ThemedText>
                    <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
                      {filterBy === 'all' 
                        ? 'Add some diapers to your inventory to get started.'
                        : 'Try a different filter to see more items.'
                      }
                    </ThemedText>
                  </View>
                )}

                {/* Grouped Inventory Items */}
                {Object.keys(groupedInventory).map(groupKey => {
                  const groupItems = groupedInventory[groupKey];
                  const isExpanded = expandedGroups.has(groupKey);
                  const totalQuantity = groupItems.reduce((sum, item) => sum + item.quantityRemaining, 0);

                  return (
                    <View key={groupKey} style={styles.inventoryGroup}>
                      <TouchableOpacity
                        style={[styles.groupHeader, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        onPress={() => toggleGroupExpansion(groupKey)}
                      >
                        <View style={styles.groupHeaderContent}>
                          <ThemedText type="defaultSemiBold" style={styles.groupTitle}>
                            {groupKey}
                          </ThemedText>
                          <ThemedText style={[styles.groupSubtitle, { color: colors.textSecondary }]}>
                            {groupItems.length} package{groupItems.length !== 1 ? 's' : ''} • {totalQuantity} diapers
                          </ThemedText>
                        </View>
                        <IconSymbol 
                          name={isExpanded ? "chevron.up" : "chevron.down"} 
                          size={16} 
                          color={colors.textSecondary} 
                        />
                      </TouchableOpacity>

                      {isExpanded && (
                        <View style={styles.groupContent}>
                          {groupItems.map(item => renderInventoryItem(item))}
                        </View>
                      )}
                    </View>
                  );
                })}

                {/* Bottom spacing */}
                <View style={{ height: 20 }} />
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
    alignItems: 'center',
    gap: 8,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryContainer: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: '700',
  },
  summaryLabel: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 2,
  },
  controlsContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  filterContainer: {
    marginBottom: 12,
  },
  sortContainer: {},
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  sortChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  sortChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    gap: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  inventoryGroup: {
    marginBottom: 16,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  groupHeaderContent: {
    flex: 1,
  },
  groupTitle: {
    fontSize: 16,
    marginBottom: 2,
  },
  groupSubtitle: {
    fontSize: 12,
  },
  groupContent: {
    marginTop: 8,
    gap: 12,
  },
  inventoryItem: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemBrand: {
    fontSize: 16,
    marginBottom: 4,
  },
  itemSize: {
    fontSize: 14,
  },
  statusIndicators: {
    flexDirection: 'row',
    gap: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  usageText: {
    fontSize: 12,
    marginBottom: 12,
  },
  itemDetails: {
    gap: 6,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 12,
  },
  editingContainer: {
    gap: 12,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  editLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  editInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 80,
  },
  editInputText: {
    fontSize: 14,
    textAlign: 'center',
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  saveButton: {},
  editButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});