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
import { Colors, NestSyncColors } from '../../constants/Colors';
import { useNestSyncTheme } from '../../contexts/ThemeContext';
import { useColorScheme } from '../../hooks/useColorScheme';

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
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
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
      backgroundColor: theme === 'dark' ? NestSyncColors.neutral[700] : NestSyncColors.neutral[100],
      borderRadius: 16, // xl radius
      padding: 24, // xxl spacing
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 }, // lg shadow
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    title: {
      fontSize: 20, // title from design system
      fontWeight: '600', // semibold
      color: theme === 'dark' ? NestSyncColors.neutral[100] : NestSyncColors.neutral[700],
    },
    closeButton: {
      padding: 8, // sm spacing
      minWidth: 48, // WCAG AA minimum
      minHeight: 48, // WCAG AA minimum
      alignItems: 'center',
      justifyContent: 'center',
    },
    productName: {
      fontSize: 14, // body from design system
      color: theme === 'dark' ? NestSyncColors.neutral[300] : NestSyncColors.neutral[500],
      marginBottom: 20, // xl spacing
    },
    label: {
      fontSize: 14, // body from design system
      fontWeight: '500', // medium
      color: theme === 'dark' ? NestSyncColors.neutral[300] : NestSyncColors.neutral[600],
      marginBottom: 8, // sm spacing
    },
    input: {
      backgroundColor: theme === 'dark' ? NestSyncColors.neutral[600] : NestSyncColors.neutral[50],
      borderWidth: 1,
      borderColor: theme === 'dark' ? NestSyncColors.neutral[500] : NestSyncColors.neutral[300],
      borderRadius: 8, // md radius
      padding: 12, // md spacing
      fontSize: 16, // subtitle from design system
      color: theme === 'dark' ? NestSyncColors.neutral[100] : NestSyncColors.neutral[700],
      marginBottom: 16, // lg spacing
      minHeight: 48, // WCAG AA minimum
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: 12, // md spacing
      marginTop: 8, // sm spacing
    },
    button: {
      flex: 1,
      paddingVertical: 14, // Increased for better touch target
      borderRadius: 12, // lg radius
      alignItems: 'center',
      minHeight: 48, // WCAG AA minimum
      justifyContent: 'center',
    },
    cancelButton: {
      backgroundColor: theme === 'dark' ? NestSyncColors.neutral[600] : NestSyncColors.neutral[200],
    },
    saveButton: {
      backgroundColor: NestSyncColors.primary.blue,
    },
    buttonText: {
      fontSize: 16, // subtitle from design system
      fontWeight: '600', // semibold
    },
    cancelText: {
      color: theme === 'dark' ? NestSyncColors.neutral[100] : NestSyncColors.neutral[700],
    },
    saveText: {
      color: colors.background,
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
                color={colors.text}
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
