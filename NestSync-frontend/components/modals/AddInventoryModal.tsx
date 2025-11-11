import React, { useState, useCallback } from 'react';
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
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useMutation, useQuery } from '@apollo/client';
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
import { CREATE_INVENTORY_ITEM_MUTATION } from '@/lib/graphql/mutations';
import { GET_INVENTORY_ITEMS_QUERY, GET_DASHBOARD_STATS_QUERY } from '@/lib/graphql/queries';
import { useChildren } from '@/hooks/useChildren';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface AddInventoryModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
  childId?: string;
}

interface ProductType {
  id: 'DIAPER' | 'WIPES' | 'DIAPER_CREAM' | 'POWDER' | 'DIAPER_BAGS' | 'TRAINING_PANTS' | 'SWIMWEAR';
  label: string;
  icon: string;
  description: string;
}

interface SizeOption {
  id: string;
  label: string;
  value: string;
}

const PRODUCT_TYPES: ProductType[] = [
  {
    id: 'DIAPER',
    label: 'Diapers',
    icon: 'rectangle.stack.fill',
    description: 'Disposable or cloth diapers',
  },
  {
    id: 'WIPES',
    label: 'Wipes',
    icon: 'doc.plaintext.fill',
    description: 'Baby wipes for cleaning',
  },
  {
    id: 'DIAPER_CREAM',
    label: 'Diaper Cream',
    icon: 'drop.circle.fill',
    description: 'Rash prevention cream',
  },
  {
    id: 'POWDER',
    label: 'Baby Powder',
    icon: 'cloud.fill',
    description: 'Talc or cornstarch powder',
  },
  {
    id: 'DIAPER_BAGS',
    label: 'Diaper Bags',
    icon: 'bag.fill',
    description: 'Disposable diaper bags',
  },
  {
    id: 'TRAINING_PANTS',
    label: 'Training Pants',
    icon: 'oval.fill',
    description: 'Pull-up training pants',
  },
];

const DIAPER_SIZES: SizeOption[] = [
  { id: 'NEWBORN', label: 'Newborn', value: 'NEWBORN' },
  { id: 'SIZE_1', label: 'Size 1', value: 'SIZE_1' },
  { id: 'SIZE_2', label: 'Size 2', value: 'SIZE_2' },
  { id: 'SIZE_3', label: 'Size 3', value: 'SIZE_3' },
  { id: 'SIZE_4', label: 'Size 4', value: 'SIZE_4' },
  { id: 'SIZE_5', label: 'Size 5', value: 'SIZE_5' },
  { id: 'SIZE_6', label: 'Size 6', value: 'SIZE_6' },
  { id: 'SIZE_7', label: 'Size 7', value: 'SIZE_7' },
];

const GENERIC_SIZES: SizeOption[] = [
  { id: 'SMALL', label: 'Small', value: 'Small' },
  { id: 'MEDIUM', label: 'Medium', value: 'Medium' },
  { id: 'LARGE', label: 'Large', value: 'Large' },
  { id: 'EXTRA_LARGE', label: 'Extra Large', value: 'Extra Large' },
];

export function AddInventoryModal({ visible, onClose, onSuccess, childId }: AddInventoryModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  // Animation values
  const modalScale = useSharedValue(0.9);
  const modalOpacity = useSharedValue(0);
  const slideY = useSharedValue(screenHeight);

  // Form state
  const [selectedProductType, setSelectedProductType] = useState<string>('DIAPER');
  const [selectedSize, setSelectedSize] = useState<string>('SIZE_2');
  const [brand, setBrand] = useState<string>('');
  const [productName, setProductName] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [cost, setCost] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [storageLocation, setStorageLocation] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [expiryValidation, setExpiryValidation] = useState<{type: 'warning' | 'error' | 'success' | null, message: string}>({type: null, message: ''});

  // GraphQL queries and mutations - using centralized hook
  const { children, loading: childrenLoading } = useChildren({
    first: 10,
    skip: !visible
  });

  const [createInventoryItem, { loading: submitLoading }] = useMutation(CREATE_INVENTORY_ITEM_MUTATION, {
    refetchQueries: [
      {
        query: GET_DASHBOARD_STATS_QUERY,
        variables: { childId: selectedChildId },
      },
      {
        query: GET_INVENTORY_ITEMS_QUERY,
        variables: { childId: selectedChildId, productType: selectedProductType },
      },
    ],
  });

  // Get size options based on product type
  const getSizeOptions = useCallback((): SizeOption[] => {
    return selectedProductType === 'DIAPER' || selectedProductType === 'TRAINING_PANTS'
      ? DIAPER_SIZES
      : GENERIC_SIZES;
  }, [selectedProductType]);

  // Smart default expiry date suggestions based on product type
  const getDefaultExpiryDate = useCallback((productType: string): Date => {
    const today = new Date();

    // Get timezone-aware date components for Canada/Toronto
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Toronto',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });

    const parts = formatter.formatToParts(today);
    const year = parseInt(parts.find(p => p.type === 'year')!.value);
    const month = parseInt(parts.find(p => p.type === 'month')!.value) - 1; // Month is 0-indexed
    const day = parseInt(parts.find(p => p.type === 'day')!.value);

    const currentDate = new Date(year, month, day);

    const monthsToAdd = {
      'DIAPER': 24,        // 2 years
      'WIPES': 24,         // 2 years
      'DIAPER_CREAM': 36,  // 3 years
      'POWDER': 36,        // 3 years
      'DIAPER_BAGS': 120,  // 10 years (durable goods)
      'TRAINING_PANTS': 24, // 2 years
      'SWIMWEAR': 24       // 2 years
    } as const;

    const months = monthsToAdd[productType as keyof typeof monthsToAdd] || 24;
    currentDate.setMonth(currentDate.getMonth() + months);
    return currentDate;
  }, []);

  // Format date to YYYY-MM-DD for input field
  const formatDateForInput = useCallback((date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Validate expiry date
  const validateExpiryDate = useCallback((expiryDateStr: string, productType: string) => {
    if (!expiryDateStr.trim()) {
      setExpiryValidation({type: null, message: ''});
      return {valid: true};
    }

    try {
      const expiryDate = new Date(expiryDateStr);
      if (isNaN(expiryDate.getTime())) {
        setExpiryValidation({type: 'error', message: 'Please enter a valid date (YYYY-MM-DD)'});
        return {valid: false, error: 'Invalid date format'};
      }

      const today = new Date();
      const monthsFromNow = (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
      
      if (monthsFromNow < 0) {
        setExpiryValidation({type: 'error', message: 'Expiry date cannot be in the past'});
        return {valid: false, error: 'Date in past'};
      }
      
      if (monthsFromNow < 1) {
        setExpiryValidation({type: 'warning', message: 'This expiry date is very soon. Is this correct?'});
        return {valid: true, warning: 'Very soon expiry'};
      }
      
      if (monthsFromNow > 120) { // 10 years
        setExpiryValidation({type: 'warning', message: 'This expiry date is quite far in the future. Please verify.'});
        return {valid: true, warning: 'Far future date'};
      }

      // Show success feedback with calculated status
      const years = Math.floor(monthsFromNow / 12);
      const remainingMonths = Math.floor(monthsFromNow % 12);
      let timeMessage = '';
      
      if (years > 0) {
        timeMessage = years === 1 ? '1 year' : `${years} years`;
        if (remainingMonths > 0) {
          timeMessage += remainingMonths === 1 ? ' 1 month' : ` ${remainingMonths} months`;
        }
      } else {
        timeMessage = remainingMonths === 1 ? '1 month' : `${Math.floor(monthsFromNow)} months`;
      }

      setExpiryValidation({
        type: 'success', 
        message: `Great! You'll get alerts before this expires (expires in ${timeMessage})`
      });
      return {valid: true, success: `Expires in ${timeMessage}`};
      
    } catch {
      setExpiryValidation({type: 'error', message: 'Please enter a valid date'});
      return {valid: false, error: 'Invalid date'};
    }
  }, []);

  // Handle expiry date change with validation
  const handleExpiryDateChange = useCallback((value: string) => {
    setExpiryDate(value);
    validateExpiryDate(value, selectedProductType);
  }, [selectedProductType, validateExpiryDate]);

  // Auto-suggest expiry date when product type changes
  React.useEffect(() => {
    if (!expiryDate) {
      const suggested = getDefaultExpiryDate(selectedProductType);
      const formattedSuggestion = formatDateForInput(suggested);
      setExpiryDate(formattedSuggestion);
      validateExpiryDate(formattedSuggestion, selectedProductType);
    }
  }, [selectedProductType, expiryDate, getDefaultExpiryDate, formatDateForInput, validateExpiryDate]);

  // Use provided childId or get the first child as fallback
  React.useEffect(() => {
    if (childId) {
      // Use the childId prop passed from the dashboard
      setSelectedChildId(childId);
    } else if (children.length > 0 && !selectedChildId) {
      // Fallback to first child only if no childId prop is provided
      setSelectedChildId(children[0].id);
    }
  }, [childId, children, selectedChildId]);

  // Animation effects
  React.useEffect(() => {
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

  // Date format conversion helper
  const formatDateToISO = (dateStr: string): string => {
    // Handle both YYYY/MM/DD and YYYY-MM-DD formats
    const normalized = dateStr.replace(/\//g, '-');
    
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
      throw new Error('Invalid date format. Please use YYYY-MM-DD');
    }
    
    // Create date and return ISO string
    const date = new Date(normalized + 'T00:00:00');
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date');
    }
    
    return date.toISOString();
  };

  // Form validation helper
  const isFormValid = () => {
    if (!selectedChildId || !brand.trim() || !quantity.trim() || submitLoading) {
      return false;
    }
    const quantityNumber = parseInt(quantity, 10);
    if (isNaN(quantityNumber) || quantityNumber <= 0) {
      return false;
    }
    
    // Check if expiry validation is in error state
    if (expiryValidation.type === 'error') {
      return false;
    }
    
    return true;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!selectedChildId) {
      console.error('No child selected');
      return;
    }

    if (!brand.trim() || !quantity.trim()) {
      console.error('Brand and quantity are required');
      return;
    }

    const quantityNumber = parseInt(quantity, 10);
    if (isNaN(quantityNumber) || quantityNumber <= 0) {
      console.error('Quantity must be a positive number');
      return;
    }

    // Validate expiry date format if provided
    if (expiryDate.trim()) {
      try {
        formatDateToISO(expiryDate.trim());
      } catch (error) {
        console.error('Invalid expiry date format:', error.message);
        return;
      }
    }

    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const input = {
        childId: selectedChildId,
        productType: selectedProductType as any,
        brand: brand.trim(),
        productName: productName.trim() || undefined,
        size: selectedSize,
        quantityTotal: quantityNumber,
        costCad: cost.trim() ? parseFloat(cost) : undefined,
        expiryDate: expiryDate.trim() ? formatDateToISO(expiryDate.trim()) : undefined,
        storageLocation: storageLocation.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      const result = await createInventoryItem({
        variables: { input },
      });

      if (result.data?.createInventoryItem?.success) {
        onSuccess?.('Inventory item added successfully!');
        handleClose();
      } else {
        console.error('Failed to add inventory item:', result.data?.createInventoryItem?.error);
      }
    } catch (error) {
      console.error('Error adding inventory item:', error);
    }
  };

  // Handle modal close with animation
  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    
    // Reset form state after animation
    setTimeout(() => {
      setSelectedProductType('DIAPER');
      setSelectedSize('SIZE_2');
      setBrand('');
      setProductName('');
      setQuantity('');
      setCost('');
      setExpiryDate('');
      setStorageLocation('');
      setNotes('');
      setExpiryValidation({type: null, message: ''});
      // Reset selectedChildId to empty so it gets repopulated on next open
      setSelectedChildId('');
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

  const sizeOptions = getSizeOptions();

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
                <IconSymbol name="cube.box.fill" size={24} color={colors.success} />
                <ThemedText type="title" style={styles.headerTitle}>
                  Add Stock
                </ThemedText>
              </View>
              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: colors.surface }]}
                onPress={handleClose}
                accessibilityRole="button"
                accessibilityLabel="Close modal"
              >
                <IconSymbol name="xmark" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.content}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[styles.contentContainer, { paddingBottom: 20 }]}
              keyboardShouldPersistTaps="handled"
            >
              {/* Loading State */}
              {childrenLoading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={colors.tint} />
                  <ThemedText style={[styles.loadingText, { color: colors.textSecondary }]}>
                    Loading child information...
                  </ThemedText>
                </View>
              )}

              {/* Child Indicator */}
              {selectedChildId && children.length > 0 && (
                <View style={[styles.childIndicator, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <IconSymbol name="person.circle.fill" size={20} color={colors.tint} />
                  <ThemedText type="defaultSemiBold" style={[styles.childIndicatorText, { color: colors.text }]}>
                    Adding stock for: {children.find(child => child.id === selectedChildId)?.name || 'Selected Child'}
                  </ThemedText>
                </View>
              )}

              {/* Product Type Selection */}
              <View style={styles.section}>
                <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                  What are you adding?
                </ThemedText>
                <View style={styles.productTypes}>
                  {PRODUCT_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type.id}
                      style={[
                        styles.productTypeButton,
                        {
                          backgroundColor: selectedProductType === type.id ? colors.success : colors.surface,
                          borderColor: selectedProductType === type.id ? colors.success : colors.border,
                        },
                      ]}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setSelectedProductType(type.id);
                        // Reset size when changing product type
                        if (type.id === 'DIAPER' || type.id === 'TRAINING_PANTS') {
                          setSelectedSize('SIZE_2');
                        } else {
                          setSelectedSize('MEDIUM');
                        }
                      }}
                      accessibilityRole="button"
                      accessibilityState={{ selected: selectedProductType === type.id }}
                    >
                      <IconSymbol
                        name={type.icon}
                        size={20}
                        color={selectedProductType === type.id ? '#FFFFFF' : colors.textSecondary}
                      />
                      <View style={styles.productTypeContent}>
                        <ThemedText
                          type="defaultSemiBold"
                          style={[
                            styles.productTypeLabel,
                            {
                              color: selectedProductType === type.id ? '#FFFFFF' : colors.text,
                            },
                          ]}
                        >
                          {type.label}
                        </ThemedText>
                        <ThemedText
                          style={[
                            styles.productTypeDescription,
                            {
                              color: selectedProductType === type.id ? '#FFFFFF' : colors.textSecondary,
                            },
                          ]}
                        >
                          {type.description}
                        </ThemedText>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Brand Input */}
              <View style={styles.section}>
                <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                  Brand *
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
                  placeholder="e.g., Pampers, Huggies, Kirkland"
                  placeholderTextColor={colors.placeholder}
                  value={brand}
                  onChangeText={setBrand}
                  maxLength={50}
                />
              </View>

              {/* Product Name Input */}
              <View style={styles.section}>
                <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                  Product Name (optional)
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
                  placeholder="e.g., Baby Dry, Overnites, Pure Protection"
                  placeholderTextColor={colors.placeholder}
                  value={productName}
                  onChangeText={setProductName}
                  maxLength={50}
                />
              </View>

              {/* Size Selection */}
              <View style={styles.section}>
                <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                  Size
                </ThemedText>
                <View style={styles.sizeChips}>
                  {sizeOptions.map((option) => (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.sizeChip,
                        {
                          backgroundColor: selectedSize === option.value ? colors.tint : colors.surface,
                          borderColor: selectedSize === option.value ? colors.tint : colors.border,
                        },
                      ]}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setSelectedSize(option.value);
                      }}
                      accessibilityRole="button"
                      accessibilityState={{ selected: selectedSize === option.value }}
                    >
                      <ThemedText
                        style={[
                          styles.sizeChipText,
                          {
                            color: selectedSize === option.value ? '#FFFFFF' : colors.text,
                          },
                        ]}
                      >
                        {option.label}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Quantity and Cost */}
              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                    Quantity *
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
                    value={quantity}
                    onChangeText={setQuantity}
                    keyboardType="numeric"
                    maxLength={4}
                  />
                </View>
                <View style={styles.halfWidth}>
                  <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                    Cost (CAD)
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
                    placeholder="0.00"
                    placeholderTextColor={colors.placeholder}
                    value={cost}
                    onChangeText={setCost}
                    keyboardType="decimal-pad"
                    maxLength={8}
                  />
                </View>
              </View>

              {/* Enhanced Expiry Date Section */}
              <View style={styles.section}>
                <View style={styles.expiryHeader}>
                  <View style={styles.expiryHeaderLeft}>
                    <IconSymbol name="clock.circle.fill" size={20} color={colors.success} />
                    <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                      Expiry Date
                    </ThemedText>
                  </View>
                  <ThemedText style={[styles.expiryBenefit, { color: colors.textSecondary }]}>
                    Track freshness & get alerts
                  </ThemedText>
                </View>
                
                <View style={styles.expiryInputContainer}>
                  <TextInput
                    style={[
                      styles.textInput,
                      styles.expiryInput,
                      {
                        backgroundColor: colors.surface,
                        borderColor: expiryValidation.type === 'error' ? colors.error : 
                                   expiryValidation.type === 'success' ? colors.success : colors.border,
                        color: colors.text,
                      },
                    ]}
                    placeholder="YYYY-MM-DD (auto-suggested based on product)"
                    placeholderTextColor={colors.placeholder}
                    value={expiryDate}
                    onChangeText={handleExpiryDateChange}
                    maxLength={10}
                    keyboardType="numeric"
                  />
                  
                  {expiryValidation.type && (
                    <View style={[
                      styles.validationContainer,
                      {
                        backgroundColor: expiryValidation.type === 'error' ? colors.errorBackground :
                                       expiryValidation.type === 'warning' ? colors.warningBackground :
                                       colors.successBackground,
                      }
                    ]}>
                      <IconSymbol 
                        name={expiryValidation.type === 'error' ? 'exclamationmark.triangle.fill' :
                              expiryValidation.type === 'warning' ? 'exclamationmark.circle.fill' :
                              'checkmark.circle.fill'} 
                        size={16} 
                        color={expiryValidation.type === 'error' ? colors.error :
                               expiryValidation.type === 'warning' ? colors.warning :
                               colors.success} 
                      />
                      <ThemedText style={[
                        styles.validationText,
                        {
                          color: expiryValidation.type === 'error' ? colors.error :
                                 expiryValidation.type === 'warning' ? colors.warning :
                                 colors.success,
                        }
                      ]}>
                        {expiryValidation.message}
                      </ThemedText>
                    </View>
                  )}
                </View>
              </View>

              {/* Storage Location */}
              <View style={styles.section}>
                <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                  Storage Location (optional)
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
                  placeholder="e.g., Nursery closet, Pantry, Diaper bag"
                  placeholderTextColor={colors.placeholder}
                  value={storageLocation}
                  onChangeText={setStorageLocation}
                  maxLength={50}
                />
              </View>

              {/* Notes Section */}
              <View style={styles.section}>
                <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                  Notes (optional)
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
                  placeholder="Any additional notes about this purchase..."
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
                
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    { 
                      backgroundColor: colors.success,
                      opacity: isFormValid() ? 1 : 0.6,
                    },
                  ]}
                  onPress={handleSubmit}
                  disabled={!isFormValid()}
                  accessibilityRole="button"
                  accessibilityLabel="Add inventory item"
                >
                  {submitLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <IconSymbol name="plus" size={18} color="#FFFFFF" />
                      <ThemedText style={styles.primaryButtonText}>
                        Add Stock
                      </ThemedText>
                    </>
                  )}
                </TouchableOpacity>
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
    boxShadow: '0px 10px 20px rgba(0, 0, 0, 0.25)',
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
  closeButton: {
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
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  childIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
    gap: 10,
  },
  childIndicatorText: {
    fontSize: 15,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 12,
  },
  productTypes: {
    gap: 12,
  },
  productTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 12,
  },
  productTypeContent: {
    flex: 1,
  },
  productTypeLabel: {
    fontSize: 16,
    marginBottom: 2,
  },
  productTypeDescription: {
    fontSize: 12,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 48,
  },
  sizeChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sizeChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    minWidth: 70,
    alignItems: 'center',
  },
  sizeChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  halfWidth: {
    flex: 1,
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
  // Enhanced expiry date styles
  expiryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  expiryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  expiryBenefit: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  expiryInputContainer: {
    gap: 8,
  },
  expiryInput: {
    borderWidth: 2, // Slightly thicker border to make it more prominent
  },
  validationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  validationText: {
    fontSize: 13,
    flex: 1,
    fontWeight: '500',
  },
});