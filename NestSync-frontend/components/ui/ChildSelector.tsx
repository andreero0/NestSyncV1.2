/**
 * ChildSelector Component
 * Allows users to select between multiple children
 * Includes persistence via AsyncStorage and smooth animations
 */

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions,
  Modal,
  FlatList,
  Pressable,
  ActivityIndicator
} from 'react-native';
import { BlurView } from 'expo-blur';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAsyncStorage } from '@/hooks/useUniversalStorage';

const { width } = Dimensions.get('window');

// Child data interface matching GraphQL schema
interface Child {
  id: string;
  name: string;
  dateOfBirth: string;
  gender?: 'BOY' | 'GIRL' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  currentDiaperSize: string;
  ageInMonths: number;
  ageInDays: number;
}

interface ChildSelectorProps {
  children: Child[];
  selectedChildId: string | null;
  onChildSelect: (childId: string) => void;
  loading?: boolean;
  disabled?: boolean;
}

const STORAGE_KEY = 'nestsync_selected_child_id';

export function ChildSelector({ 
  children, 
  selectedChildId, 
  onChildSelect, 
  loading = false,
  disabled = false 
}: ChildSelectorProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [modalVisible, setModalVisible] = useState(false);
  const [storedChildId, setStoredChildId] = useAsyncStorage(STORAGE_KEY);

  // Don't render if only one child or no children
  if (!children || children.length <= 1) {
    return null;
  }

  const selectedChild = children.find(child => child.id === selectedChildId);
  
  const handleChildSelect = async (childId: string) => {
    onChildSelect(childId);
    await setStoredChildId(childId);
    setModalVisible(false);
  };

  const formatAge = (child: Child) => {
    if (child.ageInMonths < 12) {
      return `${child.ageInMonths}mo`;
    } else {
      const years = Math.floor(child.ageInMonths / 12);
      const months = child.ageInMonths % 12;
      return months > 0 ? `${years}y ${months}mo` : `${years}y`;
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

  const renderChildItem = ({ item: child }: { item: Child }) => {
    const isSelected = child.id === selectedChildId;
    
    return (
      <TouchableOpacity
        key={child.id}
        style={[
          styles.childItem,
          { 
            backgroundColor: colors.surface,
            borderColor: isSelected ? colors.tint : colors.border
          },
          isSelected && styles.childItemSelected
        ]}
        onPress={() => handleChildSelect(child.id)}
        accessibilityRole="button"
        accessibilityLabel={`Select ${child.name}, ${formatAge(child)}, currently using ${child.currentDiaperSize}`}
      >
        <View style={[styles.childIcon, { backgroundColor: colors.background }]}>
          <IconSymbol 
            name={getChildIcon(child.gender)} 
            size={20} 
            color={isSelected ? colors.tint : colors.textSecondary} 
          />
        </View>
        
        <View style={styles.childInfo}>
          <ThemedText 
            type="defaultSemiBold" 
            style={[
              styles.childName,
              { color: isSelected ? colors.tint : colors.text }
            ]}
          >
            {child.name}
          </ThemedText>
          <ThemedText 
            style={[
              styles.childDetails,
              { color: colors.textSecondary }
            ]}
          >
            {formatAge(child)} • {child.currentDiaperSize}
          </ThemedText>
        </View>
        
        {isSelected && (
          <IconSymbol 
            name="checkmark.circle.fill" 
            size={20} 
            color={colors.tint} 
          />
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.selectorButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <ActivityIndicator size="small" color={colors.tint} />
        <ThemedText style={[styles.selectorText, { color: colors.textSecondary }]}>
          Loading children...
        </ThemedText>
      </View>
    );
  }

  return (
    <>
      {/* Main Selector Button */}
      <TouchableOpacity
        style={[
          styles.selectorButton,
          { 
            backgroundColor: colors.surface,
            borderColor: colors.border
          },
          disabled && styles.disabledButton
        ]}
        onPress={() => setModalVisible(true)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={`Currently viewing ${selectedChild?.name || 'unknown child'}. Tap to switch children.`}
        accessibilityHint="Opens a list to select a different child"
      >
        <View style={[styles.selectedChildIcon, { backgroundColor: colors.background }]}>
          <IconSymbol 
            name={getChildIcon(selectedChild?.gender)} 
            size={16} 
            color={colors.tint} 
          />
        </View>
        
        <View style={styles.selectedChildInfo}>
          <ThemedText 
            type="defaultSemiBold" 
            style={[styles.selectedChildName, { color: colors.text }]}
          >
            {selectedChild?.name || 'Select Child'}
          </ThemedText>
          {selectedChild && (
            <ThemedText 
              style={[styles.selectedChildAge, { color: colors.textSecondary }]}
            >
              {formatAge(selectedChild)}
            </ThemedText>
          )}
        </View>
        
        <IconSymbol 
          name="chevron.down" 
          size={14} 
          color={colors.textSecondary} 
        />
      </TouchableOpacity>

      {/* Selection Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
        accessibilityViewIsModal
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <BlurView intensity={20} style={styles.modalOverlay}>
            <Pressable onPress={(e) => e.stopPropagation()}>
              <ThemedView style={[styles.modalContent, { backgroundColor: colors.background }]}>
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <ThemedText type="title" style={styles.modalTitle}>
                    Select Child
                  </ThemedText>
                  <TouchableOpacity
                    onPress={() => setModalVisible(false)}
                    style={[styles.closeButton, { backgroundColor: colors.surface }]}
                    accessibilityRole="button"
                    accessibilityLabel="Close child selection"
                  >
                    <IconSymbol name="xmark" size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {/* Children List */}
                <FlatList
                  data={children}
                  keyExtractor={(item) => item.id}
                  renderItem={renderChildItem}
                  style={styles.childrenList}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.childrenListContent}
                />

                {/* Footer */}
                <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
                  <ThemedText 
                    style={[styles.footerText, { color: colors.textSecondary }]}
                  >
                    Data and preferences are tracked separately for each child
                  </ThemedText>
                </View>
              </ThemedView>
            </Pressable>
          </BlurView>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 44,
    gap: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  selectedChildIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedChildInfo: {
    flex: 1,
    minWidth: 0,
  },
  selectedChildName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 1,
  },
  selectedChildAge: {
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    maxHeight: '60%',
    minHeight: 300,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  childrenList: {
    flex: 1,
  },
  childrenListContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  childItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 12,
  },
  childItemSelected: {
    borderWidth: 2,
  },
  childIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  childInfo: {
    flex: 1,
    minWidth: 0,
  },
  childName: {
    fontSize: 16,
    marginBottom: 2,
  },
  childDetails: {
    fontSize: 14,
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingTop: 16,
    marginTop: 16,
    borderTopWidth: 1,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default ChildSelector;