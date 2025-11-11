/**
 * ChildSelector Component
 * Allows users to select between multiple children
 * Includes persistence via AsyncStorage and smooth animations
 */

import React, { useState, useEffect } from 'react';
import { 
  View, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions,
  Modal,
  FlatList,
  Pressable,
  ActivityIndicator
} from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAsyncStorage } from '@/hooks/useUniversalStorage';

const { width, height: screenHeight } = Dimensions.get('window');

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
  const colors = Colors[colorScheme as keyof typeof Colors ?? 'light'];
  
  const [modalVisible, setModalVisible] = useState(false);
  const [storedChildId, setStoredChildId] = useAsyncStorage(STORAGE_KEY);

  // Animation values
  const modalScale = useSharedValue(0.9);
  const modalOpacity = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);

  // Don't render if only one child or no children
  if (!children || children.length <= 1) {
    return null;
  }

  const selectedChild = children.find(child => child.id === selectedChildId);

  // Animate modal in
  useEffect(() => {
    if (modalVisible) {
      modalScale.value = withSpring(1, { damping: 20, stiffness: 300 });
      modalOpacity.value = withTiming(1, { duration: 200 });
      backdropOpacity.value = withTiming(1, { duration: 200 });
    } else {
      modalScale.value = withTiming(0.9, { duration: 150 });
      modalOpacity.value = withTiming(0, { duration: 150 });
      backdropOpacity.value = withTiming(0, { duration: 150 });
    }
  }, [modalVisible]);

  // Animated styles
  const animatedModalStyle = useAnimatedStyle(() => ({
    transform: [{ scale: modalScale.value }],
    opacity: modalOpacity.value,
  }));

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));
  
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

  const getChildIcon = (gender?: string): any => {
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
            numberOfLines={1}
            ellipsizeMode="tail"
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
        <ThemedText style={[styles.selectedChildName, { color: colors.textSecondary }]}>
          Loading children...
        </ThemedText>
      </View>
    );
  }

  return (
    <>
      {/* Main Selector Button - Compact Design */}
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
            size={14} 
            color={colors.tint} 
          />
        </View>
        
        <ThemedText 
          type="defaultSemiBold" 
          style={[styles.compactText, { color: colors.text }]}
        >
          {selectedChild ? `${selectedChild.name.substring(0, 4)}${selectedChild.name.length > 4 ? '...' : ''}` : 'Select'}
        </ThemedText>
        
        <ThemedText 
          style={[styles.compactAge, { color: colors.textSecondary }]}
        >
          {selectedChild ? formatAge(selectedChild) : ''}
        </ThemedText>
        
        <IconSymbol 
          name="chevron.down" 
          size={12} 
          color={colors.textSecondary} 
        />
      </TouchableOpacity>

      {/* Selection Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="none"
        onRequestClose={() => setModalVisible(false)}
        accessibilityViewIsModal
      >
        <Animated.View style={[styles.modalOverlay, animatedBackdropStyle]}>
          <Pressable 
            style={styles.modalOverlayPressable}
            onPress={() => setModalVisible(false)}
          >
            <BlurView intensity={20} style={StyleSheet.absoluteFill}>
              <View style={styles.modalCenteredContainer}>
                <Pressable onPress={(e) => e.stopPropagation()}>
                  <Animated.View style={[animatedModalStyle]}>
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
                      {children.length === 0 ? (
                        <View style={styles.emptyState}>
                          <ThemedText style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                            No children available
                          </ThemedText>
                        </View>
                      ) : (
                        <FlatList
                          data={children}
                          keyExtractor={(item) => item.id}
                          renderItem={renderChildItem}
                          style={styles.childrenList}
                          showsVerticalScrollIndicator={false}
                          contentContainerStyle={styles.childrenListContent}
                        />
                      )}

                      {/* Footer */}
                      <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
                        <ThemedText 
                          style={[styles.footerText, { color: colors.textSecondary }]}
                        >
                          Data and preferences are tracked separately for each child
                        </ThemedText>
                      </View>
                    </ThemedView>
                  </Animated.View>
                </Pressable>
              </View>
            </BlurView>
          </Pressable>
        </Animated.View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
    alignSelf: 'flex-start',
  },
  disabledButton: {
    opacity: 0.6,
  },
  selectedChildIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactText: {
    fontSize: 13,
    fontWeight: '600',
  },
  compactAge: {
    fontSize: 12,
  },
  selectedChildInfo: {
    flex: 1,
    minWidth: 120,
    maxWidth: 200,
  },
  selectedChildName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 1,
    flexShrink: 1,
  },
  selectedChildAge: {
    fontSize: 12,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalOverlayPressable: {
    flex: 1,
  },
  modalCenteredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    borderRadius: 20,
    paddingBottom: 20,
    width: width - 40,
    maxWidth: 400,
    maxHeight: screenHeight * 0.7,
    boxShadow: '0px 10px 20px rgba(0, 0, NaN, 0.3)',
    elevation: 10,
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
    maxHeight: screenHeight * 0.5,
  },
  childrenListContent: {
    paddingHorizontal: 20,
    paddingVertical: 8,
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
    minWidth: 120,
    maxWidth: 200,
  },
  childName: {
    fontSize: 16,
    marginBottom: 2,
    flexShrink: 1,
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
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default ChildSelector;