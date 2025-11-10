/**
 * Glass UI Components Test Screen
 * 
 * Test screen to verify all glass UI components render correctly.
 * Use this screen to visually test glass effects on different platforms.
 * 
 * Usage:
 * - Add to your navigation stack for testing
 * - Test on iOS for native blur
 * - Test on Android for gradient fallback
 * - Verify accessibility with screen readers
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { GlassView } from './GlassView';
import { GlassCard } from './GlassCard';
import { GlassButton } from './GlassButton';
import { GlassModal } from './GlassModal';
import { GlassHeader } from './GlassHeader';

export function GlassComponentsTest() {
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleButtonPress = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <View style={styles.container}>
      <GlassHeader
        title="Glass UI Test"
        onBack={() => console.log('Back pressed')}
        actions={[
          {
            icon: 'gear',
            onPress: () => console.log('Settings pressed'),
            accessibilityLabel: 'Settings',
          },
        ]}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* GlassView Test */}
        <Text style={styles.sectionTitle}>GlassView</Text>
        <GlassView preset="card" style={styles.testCard}>
          <Text style={styles.cardText}>Basic GlassView with card preset</Text>
        </GlassView>

        {/* GlassCard Test */}
        <Text style={styles.sectionTitle}>GlassCard</Text>
        <GlassCard>
          <Text style={styles.cardText}>Default GlassCard</Text>
        </GlassCard>

        <GlassCard variant="elevated">
          <Text style={styles.cardText}>Elevated GlassCard</Text>
        </GlassCard>

        <GlassCard variant="outlined">
          <Text style={styles.cardText}>Outlined GlassCard</Text>
        </GlassCard>

        <GlassCard onPress={() => console.log('Card pressed')}>
          <Text style={styles.cardText}>Interactive GlassCard (tap me)</Text>
        </GlassCard>

        {/* GlassButton Test */}
        <Text style={styles.sectionTitle}>GlassButton</Text>
        <GlassButton
          title="Primary Button"
          onPress={handleButtonPress}
          loading={loading}
        />

        <View style={styles.buttonRow}>
          <GlassButton
            title="Secondary"
            variant="secondary"
            onPress={() => console.log('Secondary pressed')}
            size="small"
          />
          <GlassButton
            title="Outline"
            variant="outline"
            onPress={() => console.log('Outline pressed')}
            size="small"
          />
        </View>

        <GlassButton
          title="With Icon"
          icon="plus"
          onPress={() => console.log('Icon button pressed')}
        />

        <GlassButton
          title="Disabled"
          disabled
          onPress={() => console.log('Should not fire')}
        />

        {/* GlassModal Test */}
        <Text style={styles.sectionTitle}>GlassModal</Text>
        <GlassButton
          title="Open Modal"
          onPress={() => setModalVisible(true)}
        />

        <GlassModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          title="Test Modal"
          size="medium"
        >
          <Text style={styles.modalText}>
            This is a glass modal with blur overlay.
          </Text>
          <GlassButton
            title="Close Modal"
            onPress={() => setModalVisible(false)}
          />
        </GlassModal>

        {/* Preset Comparison */}
        <Text style={styles.sectionTitle}>Preset Comparison</Text>
        <GlassView preset="navigation" style={styles.testCard}>
          <Text style={styles.cardText}>Navigation Preset</Text>
        </GlassView>

        <GlassView preset="card" style={styles.testCard}>
          <Text style={styles.cardText}>Card Preset</Text>
        </GlassView>

        <GlassView preset="modal" style={styles.testCard}>
          <Text style={styles.cardText}>Modal Preset</Text>
        </GlassView>

        <GlassView preset="button" style={styles.testCard}>
          <Text style={styles.cardText}>Button Preset</Text>
        </GlassView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 24,
    marginBottom: 12,
  },
  testCard: {
    padding: 16,
    marginBottom: 12,
  },
  cardText: {
    fontSize: 16,
    color: '#374151',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  modalText: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 20,
  },
});
