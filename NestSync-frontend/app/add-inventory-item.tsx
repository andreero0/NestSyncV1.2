/**
 * Add Inventory Item Screen
 * Simple form to add new inventory items
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useMutation } from '@apollo/client';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NestSyncColors } from '../constants/Colors';
import { useNestSyncTheme } from '../contexts/ThemeContext';
import { CREATE_INVENTORY_ITEM_MUTATION } from '../lib/graphql/mutations';

export default function AddInventoryItem() {
  const theme = useNestSyncTheme();
  const router = useRouter();
  const [brandName, setBrandName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [size, setSize] = useState('');

  const [createItem, { loading }] = useMutation(CREATE_INVENTORY_ITEM_MUTATION);

  const handleSubmit = async () => {
    if (!brandName || !quantity || !size) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      await createItem({
        variables: {
          input: {
            brandName,
            quantityInitial: parseInt(quantity),
            quantityRemaining: parseInt(quantity),
            size,
            productType: 'DIAPER',
          },
        },
      });
      Alert.alert('Success', 'Item added successfully');
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add item');
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme === 'dark' ? '#1F2937' : '#F9FAFB',
    },
    form: {
      padding: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: theme === 'dark' ? '#D1D5DB' : '#374151',
      marginBottom: 8,
      marginTop: 16,
    },
    input: {
      backgroundColor: theme === 'dark' ? '#374151' : '#FFFFFF',
      borderWidth: 1,
      borderColor: theme === 'dark' ? '#4B5563' : '#D1D5DB',
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: theme === 'dark' ? '#FFFFFF' : '#111827',
    },
    submitButton: {
      backgroundColor: NestSyncColors.primary.blue,
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 32,
    },
    submitButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          title: 'Add Item',
          headerShown: true,
          headerBackTitle: 'Back',
          headerStyle: {
            backgroundColor: theme === 'dark' ? NestSyncColors.neutral[900] : '#FFFFFF',
          },
          headerTintColor: theme === 'dark' ? NestSyncColors.neutral[100] : NestSyncColors.neutral[800],
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      />
      <ScrollView>
        <View style={styles.form}>
          <Text style={styles.label}>Brand Name</Text>
          <TextInput
            style={styles.input}
            value={brandName}
            onChangeText={setBrandName}
            placeholder="e.g., Pampers, Huggies"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.label}>Size</Text>
          <TextInput
            style={styles.input}
            value={size}
            onChangeText={setSize}
            placeholder="e.g., Newborn, Size 1"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.label}>Quantity</Text>
          <TextInput
            style={styles.input}
            value={quantity}
            onChangeText={setQuantity}
            placeholder="e.g., 100"
            keyboardType="number-pad"
            placeholderTextColor="#9CA3AF"
          />

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Adding...' : 'Add Item'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
