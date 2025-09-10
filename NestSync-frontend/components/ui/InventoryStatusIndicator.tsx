/**
 * Inventory Status Indicator Component
 * Color-coded status system based on psychology-driven design for stressed Canadian parents
 * Uses calming colors to provide reassurance rather than alarm
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { ThemedText } from '../ThemedText';

export type InventoryStatus = 'ready' | 'warning' | 'critical';

export interface InventoryStatusIndicatorProps {
  status: InventoryStatus;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  style?: ViewStyle;
}

// Psychology-driven color system for parent confidence
const STATUS_COLORS = {
  ready: {
    primary: '#00C853',    // Confidence green - "You're prepared"
    background: '#E8F5E8', // Calming green background
    text: '#1B5E20',       // Readable green text
  },
  warning: {
    primary: '#FFB300',    // Gentle amber - "Worth noting, not alarming"
    background: '#FFF8E1', // Warm yellow background
    text: '#E65100',       // Readable amber text
  },
  critical: {
    primary: '#D32F2F',    // Urgent but supportive - "We'll help you through this"
    background: '#FFEBEE', // Soft red background
    text: '#B71C1C',       // Readable red text
  },
};

const STATUS_LABELS = {
  ready: 'Ready',
  warning: 'Low',
  critical: 'Critical',
};

const SIZE_CONFIG = {
  small: { dot: 8, text: 12 },
  medium: { dot: 12, text: 14 },
  large: { dot: 16, text: 16 },
};

export function InventoryStatusIndicator({
  status,
  size = 'medium',
  showLabel = false,
  style,
}: InventoryStatusIndicatorProps) {
  const colors = STATUS_COLORS[status];
  const sizeConfig = SIZE_CONFIG[size];

  return (
    <View style={[styles.container, style]} accessibilityLabel={`Status: ${STATUS_LABELS[status]}`}>
      <View
        style={[
          styles.dot,
          {
            width: sizeConfig.dot,
            height: sizeConfig.dot,
            borderRadius: sizeConfig.dot / 2,
            backgroundColor: colors.primary,
          },
        ]}
      />
      {showLabel && (
        <ThemedText
          style={[
            styles.label,
            {
              fontSize: sizeConfig.text,
              color: colors.text,
            },
          ]}
        >
          {STATUS_LABELS[status]}
        </ThemedText>
      )}
    </View>
  );
}

// Helper function to determine status from changes ready count
export function getReadinessStatus(changesReady: number): InventoryStatus {
  if (changesReady >= 20) return 'ready';   // Green - "You're well prepared"
  if (changesReady >= 5) return 'warning';  // Amber - "Getting low, but you have time"
  return 'critical';                        // Red - "Time to restock soon"
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    // Dot styles applied dynamically
  },
  label: {
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

export default InventoryStatusIndicator;