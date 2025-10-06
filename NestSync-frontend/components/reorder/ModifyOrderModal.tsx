/**
 * ModifyOrderModal - Edit reorder details
 * Simplified implementation following existing modal patterns
 */

import React, { useState } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Text,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NestSyncColors } from '../../constants/Colors';
import { useNestSyncTheme } from '../../contexts/ThemeContext';

interface ModifyOrderModalProps {
  visible: boolean;
  onClose: () => void;
  order: {
    id: string;
    productName: string;
    quantity?: number;
    retailer?: string;
  };
  onModify: (orderId: string, data: any) => void;
}

export function ModifyOrderModal({
  visible,
  onClose,
  order,
  onModify,
}: ModifyOrderModalProps) {
  const theme = useNestSyncTheme();
  const [quantity, setQuantity] = useState((order.quantity || 1).toString());
  const [retailer, setRetailer] = useState(order.retailer || 'Walmart');

  const handleSave = () => {
    onModify(order.id, {
      quantity: parseInt(quantity) || 1,
      retailer,
    });
    onClose();
  };

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      width: '90%',
      maxWidth: 400,
      backgroundColor: theme === 'dark' ? '#374151' : '#FFFFFF',
      borderRadius: 16,
      padding: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 5,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    title: {
      fontSize: 20,
      fontWeight: '600',
      color: theme === 'dark' ? '#FFFFFF' : '#111827',
    },
    closeButton: {
      padding: 4,
    },
    productName: {
      fontSize: 14,
      color: theme === 'dark' ? '#D1D5DB' : '#6B7280',
      marginBottom: 20,
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
      color: theme === 'dark' ? '#D1D5DB' : '#374151',
      marginBottom: 8,
    },
    input: {
      backgroundColor: theme === 'dark' ? '#4B5563' : '#F9FAFB',
      borderWidth: 1,
      borderColor: theme === 'dark' ? '#6B7280' : '#D1D5DB',
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: theme === 'dark' ? '#FFFFFF' : '#111827',
      marginBottom: 16,
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 8,
    },
    button: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    cancelButton: {
      backgroundColor: theme === 'dark' ? '#4B5563' : '#E5E7EB',
    },
    saveButton: {
      backgroundColor: NestSyncColors.primary.blue,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    cancelText: {
      color: theme === 'dark' ? '#FFFFFF' : '#374151',
    },
    saveText: {
      color: '#FFFFFF',
    },
  });

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
      accessibilityViewIsModal={true}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Modify Order</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              accessibilityLabel="Close modal"
              accessibilityRole="button"
            >
              <Ionicons
                name="close"
                size={24}
                color={theme === 'dark' ? '#FFFFFF' : '#111827'}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.productName}>{order.productName}</Text>

          <Text style={styles.label}>Quantity</Text>
          <TextInput
            style={styles.input}
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
            accessibilityLabel="Order quantity"
            accessibilityHint="Enter the number of items to order"
          />

          <Text style={styles.label}>Retailer</Text>
          <TextInput
            style={styles.input}
            value={retailer}
            onChangeText={setRetailer}
            accessibilityLabel="Retailer name"
            accessibilityHint="Enter the retailer for this order"
          />

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              accessibilityLabel="Cancel modification"
              accessibilityRole="button"
            >
              <Text style={[styles.buttonText, styles.cancelText]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
              accessibilityLabel="Save order modifications"
              accessibilityRole="button"
            >
              <Text style={[styles.buttonText, styles.saveText]}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
