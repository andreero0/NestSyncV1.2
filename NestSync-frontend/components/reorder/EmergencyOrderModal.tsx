/**
 * EmergencyOrderModal - Quick emergency ordering with category selection
 * Design spec compliant: 6-category grid, delivery options, accessibility
 */

import React, { useState } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Text,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NestSyncColors } from '../../constants/Colors';
import { useNestSyncTheme } from '../../contexts/ThemeContext';

interface EmergencyOrderModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (orderData: EmergencyOrderData) => void;
}

export interface EmergencyOrderData {
  category: string;
  productName: string;
  quantity: number;
  deliverySpeed: 'standard' | 'express' | 'sameday';
  retailer: string;
  notes?: string;
  affiliateLink?: string;
  affiliateDisclosure?: string;
}

type CategoryType = {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
};

// Categories match AddInventoryModal.tsx for consistency across the app
const CATEGORIES: CategoryType[] = [
  { id: 'DIAPER', name: 'Diapers', icon: 'water', color: '#0891B2' },
  { id: 'WIPES', name: 'Wipes', icon: 'sparkles', color: '#10B981' },
  { id: 'DIAPER_CREAM', name: 'Diaper Cream', icon: 'water-outline', color: '#8B5CF6' },
  { id: 'POWDER', name: 'Baby Powder', icon: 'cloud-outline', color: '#06B6D4' },
  { id: 'DIAPER_BAGS', name: 'Diaper Bags', icon: 'bag-handle', color: '#F59E0B' },
  { id: 'TRAINING_PANTS', name: 'Training Pants', icon: 'body', color: '#EC4899' },
];

const DELIVERY_OPTIONS = [
  { id: 'standard', label: 'Standard', subtitle: '5-7 days', price: 0 },
  { id: 'express', label: 'Express', subtitle: '2-3 days', price: 9.99 },
  { id: 'sameday', label: 'Same Day', subtitle: 'Today', price: 19.99 },
];

// Retailer options with affiliate links and PIPEDA-compliant disclosure
const RETAILERS = [
  {
    name: 'Walmart',
    affiliateLink: 'https://walmart.ca?affiliate_id=nestsync',
    affiliateDisclosure: 'NestSync earns a small commission when you shop through our Walmart link, at no extra cost to you. This helps us keep the app free.'
  },
  {
    name: 'Amazon.ca',
    affiliateLink: 'https://amazon.ca?tag=nestsync-20',
    affiliateDisclosure: 'NestSync is a participant in the Amazon Associates Program. We earn a small commission on qualifying purchases at no extra cost to you.'
  },
  {
    name: 'Costco',
    affiliateLink: null,
    affiliateDisclosure: null
  },
  {
    name: 'Shoppers Drug Mart',
    affiliateLink: null,
    affiliateDisclosure: null
  },
  {
    name: 'London Drugs',
    affiliateLink: null,
    affiliateDisclosure: null
  },
];

export function EmergencyOrderModal({
  visible,
  onClose,
  onSubmit,
}: EmergencyOrderModalProps) {
  const theme = useNestSyncTheme();

  // Form state
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [deliverySpeed, setDeliverySpeed] = useState<'standard' | 'express' | 'sameday'>('express');
  const [selectedRetailer, setSelectedRetailer] = useState('Walmart');
  const [notes, setNotes] = useState('');
  const [showRetailerPicker, setShowRetailerPicker] = useState(false);

  // Get affiliate info for selected retailer
  const selectedRetailerInfo = RETAILERS.find(r => r.name === selectedRetailer);

  const handleSubmit = () => {
    if (!selectedCategory || !productName.trim()) {
      return;
    }

    const orderData: EmergencyOrderData = {
      category: selectedCategory,
      productName: productName.trim(),
      quantity: parseInt(quantity) || 1,
      deliverySpeed,
      retailer: selectedRetailer,
      notes: notes.trim() || undefined,
      affiliateLink: selectedRetailerInfo?.affiliateLink || undefined,
      affiliateDisclosure: selectedRetailerInfo?.affiliateDisclosure || undefined,
    };

    onSubmit(orderData);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setSelectedCategory(null);
    setProductName('');
    setQuantity('1');
    setDeliverySpeed('express');
    setSelectedRetailer('Walmart');
    setNotes('');
    setShowRetailerPicker(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const estimatedTotal = () => {
    const deliveryFee = DELIVERY_OPTIONS.find(opt => opt.id === deliverySpeed)?.price || 0;
    const basePrice = 35.00; // Placeholder - would come from product lookup
    return basePrice + deliveryFee;
  };

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      maxHeight: '90%',
      backgroundColor: theme === 'dark' ? NestSyncColors.neutral[800] : NestSyncColors.neutral[100],
      borderTopLeftRadius: 24, // xxl radius (6 * 4px)
      borderTopRightRadius: 24,
      paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20, // xl spacing
      borderBottomWidth: 1,
      borderBottomColor: theme === 'dark' ? NestSyncColors.neutral[700] : NestSyncColors.neutral[200],
    },
    headerTitle: {
      fontSize: 20, // title from design system
      fontWeight: '700', // bold
      color: theme === 'dark' ? NestSyncColors.neutral[100] : NestSyncColors.neutral[700],
    },
    headerSubtitle: {
      fontSize: 12, // small from design system
      color: theme === 'dark' ? NestSyncColors.neutral[400] : NestSyncColors.neutral[500],
      marginTop: 4, // xs spacing
    },
    closeButton: {
      padding: 8, // sm spacing
      minWidth: 48, // WCAG AA minimum
      minHeight: 48, // WCAG AA minimum
      alignItems: 'center',
      justifyContent: 'center',
    },
    scrollContent: {
      padding: 20,
    },

    // Category Selection
    sectionTitle: {
      fontSize: 16, // subtitle from design system
      fontWeight: '600', // semibold
      color: theme === 'dark' ? NestSyncColors.neutral[100] : NestSyncColors.neutral[700],
      marginBottom: 12, // md spacing
    },
    categoryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12, // md spacing
      marginBottom: 24, // xxl spacing
    },
    categoryCard: {
      width: '30%',
      minWidth: 100,
      minHeight: 80,
      backgroundColor: theme === 'dark' ? NestSyncColors.neutral[700] : NestSyncColors.neutral[50],
      borderRadius: 12, // lg radius
      padding: 12, // md spacing
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
    },
    categoryCardSelected: {
      borderColor: NestSyncColors.primary.blue,
      backgroundColor: theme === 'dark' ? NestSyncColors.primary.blueDark + '40' : NestSyncColors.primary.blueLight,
    },
    categoryIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    categoryName: {
      fontSize: 12, // small from design system
      fontWeight: '600', // semibold
      color: theme === 'dark' ? NestSyncColors.neutral[300] : NestSyncColors.neutral[600],
      textAlign: 'center',
    },
    categoryNameSelected: {
      color: NestSyncColors.primary.blue,
    },

    // Product Details
    label: {
      fontSize: 14, // body from design system
      fontWeight: '600', // semibold
      color: theme === 'dark' ? NestSyncColors.neutral[300] : NestSyncColors.neutral[600],
      marginBottom: 8, // sm spacing
    },
    input: {
      backgroundColor: theme === 'dark' ? NestSyncColors.neutral[700] : NestSyncColors.neutral[50],
      borderWidth: 1,
      borderColor: theme === 'dark' ? NestSyncColors.neutral[600] : NestSyncColors.neutral[300],
      borderRadius: 8, // md radius
      padding: 14,
      fontSize: 16, // subtitle from design system
      color: theme === 'dark' ? NestSyncColors.neutral[100] : NestSyncColors.neutral[700],
      marginBottom: 16, // lg spacing
      minHeight: 48, // WCAG AA minimum
    },
    inputMultiline: {
      minHeight: 80,
      textAlignVertical: 'top',
    },

    // Quantity Selector
    quantityContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 20,
    },
    quantityButton: {
      width: 48,
      height: 48,
      borderRadius: 8,
      backgroundColor: NestSyncColors.primary.blue,
      alignItems: 'center',
      justifyContent: 'center',
    },
    quantityInput: {
      flex: 1,
      backgroundColor: theme === 'dark' ? '#374151' : '#F9FAFB',
      borderWidth: 1,
      borderColor: theme === 'dark' ? '#4B5563' : '#D1D5DB',
      borderRadius: 8,
      padding: 14,
      fontSize: 18,
      fontWeight: '600',
      color: theme === 'dark' ? '#FFFFFF' : '#111827',
      textAlign: 'center',
      minHeight: 48,
    },

    // Delivery Options
    deliveryOptions: {
      gap: 8, // sm spacing
      marginBottom: 20, // xl spacing
    },
    deliveryOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme === 'dark' ? NestSyncColors.neutral[700] : NestSyncColors.neutral[50],
      borderWidth: 2,
      borderColor: 'transparent',
      borderRadius: 12, // lg radius
      padding: 16, // lg spacing
      minHeight: 64, // Comfortable touch target
    },
    deliveryOptionSelected: {
      borderColor: NestSyncColors.primary.blue,
      backgroundColor: theme === 'dark' ? NestSyncColors.primary.blueDark + '40' : NestSyncColors.primary.blueLight,
    },
    deliveryLeft: {
      flex: 1,
    },
    deliveryLabel: {
      fontSize: 16, // subtitle from design system
      fontWeight: '600', // semibold
      color: theme === 'dark' ? NestSyncColors.neutral[100] : NestSyncColors.neutral[700],
      marginBottom: 4, // xs spacing
    },
    deliverySubtitle: {
      fontSize: 12, // small from design system
      color: theme === 'dark' ? NestSyncColors.neutral[400] : NestSyncColors.neutral[500],
    },
    deliveryPrice: {
      fontSize: 16, // subtitle from design system
      fontWeight: '700', // bold
      color: theme === 'dark' ? NestSyncColors.neutral[100] : NestSyncColors.neutral[700],
    },

    // Retailer Picker
    retailerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme === 'dark' ? '#374151' : '#F9FAFB',
      borderWidth: 1,
      borderColor: theme === 'dark' ? '#4B5563' : '#D1D5DB',
      borderRadius: 8,
      padding: 14,
      marginBottom: 16,
      minHeight: 48,
    },
    retailerButtonText: {
      fontSize: 16,
      color: theme === 'dark' ? '#FFFFFF' : '#111827',
    },
    retailerList: {
      backgroundColor: theme === 'dark' ? '#374151' : '#FFFFFF',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme === 'dark' ? '#4B5563' : '#D1D5DB',
      marginBottom: 16,
      overflow: 'hidden',
    },
    retailerOption: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme === 'dark' ? '#4B5563' : '#E5E7EB',
      minHeight: 48,
      justifyContent: 'center',
    },
    retailerOptionLast: {
      borderBottomWidth: 0,
    },
    retailerOptionSelected: {
      backgroundColor: theme === 'dark' ? '#1E3A8A' : '#DBEAFE',
    },
    retailerOptionText: {
      fontSize: 16,
      color: theme === 'dark' ? '#FFFFFF' : '#111827',
    },

    // Estimated Total
    estimatedContainer: {
      backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6',
      padding: 16,
      borderRadius: 12,
      marginBottom: 20,
    },
    estimatedRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    estimatedLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: theme === 'dark' ? '#D1D5DB' : '#6B7280',
    },
    estimatedValue: {
      fontSize: 20,
      fontWeight: '700',
      color: NestSyncColors.primary.blue,
    },

    // Action Buttons
    buttonContainer: {
      flexDirection: 'row',
      gap: 12, // md spacing
      marginTop: 8, // sm spacing
    },
    button: {
      flex: 1,
      paddingVertical: 16,
      borderRadius: 12, // lg radius
      alignItems: 'center',
      minHeight: 56, // Extra comfortable touch target for primary actions
      justifyContent: 'center',
    },
    cancelButton: {
      backgroundColor: theme === 'dark' ? NestSyncColors.neutral[700] : NestSyncColors.neutral[200],
    },
    submitButton: {
      backgroundColor: NestSyncColors.semantic.error,
    },
    submitButtonDisabled: {
      backgroundColor: theme === 'dark' ? NestSyncColors.neutral[600] : NestSyncColors.neutral[300],
    },
    buttonText: {
      fontSize: 16, // subtitle from design system
      fontWeight: '700', // bold
    },
    cancelText: {
      color: theme === 'dark' ? NestSyncColors.neutral[100] : NestSyncColors.neutral[700],
    },
    submitText: {
      color: '#FFFFFF',
    },

    // Affiliate Disclosure Styles - PIPEDA Compliant
    affiliateDisclosure: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: theme === 'dark' ? '#1E3A8A' : '#EFF6FF',
      padding: 12,
      borderRadius: 8,
      marginTop: 12,
      borderLeftWidth: 3,
      borderLeftColor: NestSyncColors.primary.blue,
    },
    affiliateDisclosureText: {
      flex: 1,
      fontSize: 12,
      lineHeight: 16,
      color: theme === 'dark' ? '#BFDBFE' : '#1E40AF',
    },
    affiliateBadge: {
      fontSize: 11,
      color: NestSyncColors.primary.blue,
      fontWeight: '600',
      marginTop: 2,
    },
  });

  const isFormValid = selectedCategory && productName.trim();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
      accessibilityViewIsModal={true}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Emergency Order</Text>
              <Text style={styles.headerSubtitle}>Quick order for urgent needs</Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              accessibilityLabel="Close emergency order"
              accessibilityRole="button"
            >
              <Ionicons
                name="close"
                size={24}
                color={theme === 'dark' ? '#FFFFFF' : '#111827'}
              />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Category Selection */}
            <Text style={styles.sectionTitle}>What do you need?</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryCard,
                    selectedCategory === category.id && styles.categoryCardSelected,
                  ]}
                  onPress={() => setSelectedCategory(category.id)}
                  accessibilityLabel={`${category.name} category`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: selectedCategory === category.id }}
                >
                  <View
                    style={[
                      styles.categoryIconContainer,
                      { backgroundColor: `${category.color}20` },
                    ]}
                  >
                    <Ionicons
                      name={category.icon}
                      size={20}
                      color={category.color}
                    />
                  </View>
                  <Text
                    style={[
                      styles.categoryName,
                      selectedCategory === category.id && styles.categoryNameSelected,
                    ]}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Product Details */}
            {selectedCategory && (
              <>
                <Text style={styles.label}>Product Name</Text>
                <TextInput
                  style={styles.input}
                  value={productName}
                  onChangeText={setProductName}
                  placeholder="e.g., Pampers Size 4"
                  placeholderTextColor={theme === 'dark' ? '#6B7280' : '#9CA3AF'}
                  accessibilityLabel="Product name"
                  accessibilityHint="Enter the product you need to order"
                />

                {/* Quantity Selector */}
                <Text style={styles.label}>Quantity</Text>
                <View style={styles.quantityContainer}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => setQuantity(String(Math.max(1, parseInt(quantity || '1') - 1)))}
                    accessibilityLabel="Decrease quantity"
                    accessibilityRole="button"
                  >
                    <Ionicons name="remove" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                  <TextInput
                    style={styles.quantityInput}
                    value={quantity}
                    onChangeText={setQuantity}
                    keyboardType="numeric"
                    accessibilityLabel="Order quantity"
                  />
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => setQuantity(String(parseInt(quantity || '1') + 1))}
                    accessibilityLabel="Increase quantity"
                    accessibilityRole="button"
                  >
                    <Ionicons name="add" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                {/* Delivery Speed */}
                <Text style={styles.sectionTitle}>Delivery Speed</Text>
                <View style={styles.deliveryOptions}>
                  {DELIVERY_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.deliveryOption,
                        deliverySpeed === option.id && styles.deliveryOptionSelected,
                      ]}
                      onPress={() => setDeliverySpeed(option.id as any)}
                      accessibilityLabel={`${option.label} delivery, ${option.subtitle}`}
                      accessibilityRole="button"
                      accessibilityState={{ selected: deliverySpeed === option.id }}
                    >
                      <View style={styles.deliveryLeft}>
                        <Text style={styles.deliveryLabel}>{option.label}</Text>
                        <Text style={styles.deliverySubtitle}>{option.subtitle}</Text>
                      </View>
                      <Text style={styles.deliveryPrice}>
                        {option.price === 0 ? 'Free' : `$${option.price.toFixed(2)}`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Retailer Selection */}
                <Text style={styles.label}>Retailer</Text>
                {!showRetailerPicker ? (
                  <TouchableOpacity
                    style={styles.retailerButton}
                    onPress={() => setShowRetailerPicker(true)}
                    accessibilityLabel={`Selected retailer: ${selectedRetailer}`}
                    accessibilityRole="button"
                  >
                    <Text style={styles.retailerButtonText}>{selectedRetailer}</Text>
                    <Ionicons
                      name="chevron-down"
                      size={20}
                      color={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
                    />
                  </TouchableOpacity>
                ) : (
                  <View style={styles.retailerList}>
                    {RETAILERS.map((retailer, index) => (
                      <TouchableOpacity
                        key={retailer.name}
                        style={[
                          styles.retailerOption,
                          index === RETAILERS.length - 1 && styles.retailerOptionLast,
                          selectedRetailer === retailer.name && styles.retailerOptionSelected,
                        ]}
                        onPress={() => {
                          setSelectedRetailer(retailer.name);
                          setShowRetailerPicker(false);
                        }}
                        accessibilityLabel={retailer.name}
                        accessibilityRole="button"
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.retailerOptionText}>{retailer.name}</Text>
                          {retailer.affiliateLink && (
                            <Text style={styles.affiliateBadge}>Partner Link</Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Notes */}
                <Text style={styles.label}>Notes (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.inputMultiline]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Any special instructions..."
                  placeholderTextColor={theme === 'dark' ? '#6B7280' : '#9CA3AF'}
                  multiline
                  numberOfLines={3}
                  accessibilityLabel="Order notes"
                  accessibilityHint="Add any special instructions for this order"
                />

                {/* Estimated Total */}
                <View style={styles.estimatedContainer}>
                  <View style={styles.estimatedRow}>
                    <Text style={styles.estimatedLabel}>Estimated Total (CAD)</Text>
                    <Text style={styles.estimatedValue}>
                      ${estimatedTotal().toFixed(2)}
                    </Text>
                  </View>
                </View>

                {/* Affiliate Disclosure - PIPEDA Compliant */}
                {selectedRetailerInfo?.affiliateDisclosure && (
                  <View style={styles.affiliateDisclosure}>
                    <Ionicons
                      name="information-circle-outline"
                      size={16}
                      color={NestSyncColors.primary.blue}
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.affiliateDisclosureText}>
                      {selectedRetailerInfo.affiliateDisclosure}
                    </Text>
                  </View>
                )}
              </>
            )}

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleClose}
                accessibilityLabel="Cancel emergency order"
                accessibilityRole="button"
              >
                <Text style={[styles.buttonText, styles.cancelText]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.submitButton,
                  !isFormValid && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={!isFormValid}
                accessibilityLabel="Place emergency order"
                accessibilityRole="button"
                accessibilityState={{ disabled: !isFormValid }}
              >
                <Text style={[styles.buttonText, styles.submitText]}>Place Order</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
