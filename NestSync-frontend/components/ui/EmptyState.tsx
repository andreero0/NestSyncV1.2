/**
 * EmptyState Component
 * 
 * Reusable empty state component for displaying when no data is available.
 * Provides consistent styling and messaging across the application.
 * 
 * Features:
 * - Customizable icon, title, and description
 * - Optional action button
 * - Design system compliant styling
 * - Accessibility support
 * 
 * Usage:
 * ```tsx
 * <EmptyState
 *   icon="cube.box"
 *   title="No Items"
 *   description="Add your first item to get started"
 *   actionLabel="Add Item"
 *   onAction={handleAddItem}
 * />
 * ```
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { IconSymbol } from './IconSymbol';
import { Button } from './Button';
import { useNestSyncTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';

export interface EmptyStateProps {
  /** Icon name from SF Symbols */
  icon: string;
  /** Icon size (default: 48) */
  iconSize?: number;
  /** Main title text */
  title: string;
  /** Description text */
  description: string;
  /** Optional action button label */
  actionLabel?: string;
  /** Optional action button handler */
  onAction?: () => void;
  /** Optional secondary action button label */
  secondaryActionLabel?: string;
  /** Optional secondary action button handler */
  onSecondaryAction?: () => void;
  /** Custom style override */
  style?: ViewStyle;
  /** Test ID for testing */
  testID?: string;
}

export function EmptyState({
  icon,
  iconSize = 48,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  style,
  testID,
}: EmptyStateProps) {
  const theme = useNestSyncTheme();
  const colors = Colors[theme];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        style,
      ]}
      testID={testID}
    >
      <IconSymbol
        name={icon as any}
        size={iconSize}
        color={colors.textSecondary}
        style={styles.icon}
      />

      <Text
        style={[
          styles.title,
          { color: colors.text },
        ]}
      >
        {title}
      </Text>

      <Text
        style={[
          styles.description,
          { color: colors.textSecondary },
        ]}
      >
        {description}
      </Text>

      {(actionLabel || secondaryActionLabel) && (
        <View style={styles.actions}>
          {actionLabel && onAction && (
            <Button
              title={actionLabel}
              onPress={onAction}
              variant="primary"
              size="medium"
              fullWidth={!secondaryActionLabel}
              style={secondaryActionLabel ? { flex: 1 } : undefined}
            />
          )}

          {secondaryActionLabel && onSecondaryAction && (
            <Button
              title={secondaryActionLabel}
              onPress={onSecondaryAction}
              variant="secondary"
              size="medium"
              fullWidth={!actionLabel}
              style={actionLabel ? { flex: 1 } : undefined}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32, // 8 × 4px base unit
    borderRadius: 16, // Design system standard
    borderWidth: 1,
    marginVertical: 20, // 5 × 4px base unit
    gap: 16, // 4 × 4px base unit
  },
  icon: {
    marginBottom: 8, // 2 × 4px base unit
  },
  title: {
    fontSize: 20, // Design system title size
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4, // 1 × 4px base unit
  },
  description: {
    fontSize: 16, // Design system body size
    textAlign: 'center',
    lineHeight: 24, // 1.5 line height
    maxWidth: 300,
    marginBottom: 8, // 2 × 4px base unit
  },
  actions: {
    flexDirection: 'row',
    gap: 12, // 3 × 4px base unit
    width: '100%',
    marginTop: 8, // 2 × 4px base unit
  },
});

/**
 * Preset empty states for common scenarios
 */

export function NoChildrenEmptyState({ onAddChild }: { onAddChild: () => void }) {
  return (
    <EmptyState
      icon="figure.2.and.child.holdinghands"
      title="No Children Added"
      description="Add a child to your account to start tracking diaper usage and get personalized recommendations."
      actionLabel="Add Child"
      onAction={onAddChild}
      testID="no-children-empty-state"
    />
  );
}

export function NoInventoryEmptyState({ onAddItem }: { onAddItem: () => void }) {
  return (
    <EmptyState
      icon="cube.box"
      title="No Inventory Items"
      description="Add your first inventory item to start tracking stock levels and get reorder suggestions."
      actionLabel="Add Item"
      onAction={onAddItem}
      testID="no-inventory-empty-state"
    />
  );
}

export function NoActivityEmptyState({ onLogChange }: { onLogChange: () => void }) {
  return (
    <EmptyState
      icon="clock"
      title="No Recent Activity"
      description="Start logging diaper changes to see activity here and get usage insights."
      actionLabel="Log Change"
      onAction={onLogChange}
      testID="no-activity-empty-state"
    />
  );
}

export function NoOrdersEmptyState({ onCreateOrder }: { onCreateOrder: () => void }) {
  return (
    <EmptyState
      icon="cube.box"
      title="No Upcoming Orders"
      description="Start tracking diaper changes to get AI-powered reorder suggestions based on your usage patterns."
      actionLabel="Emergency Order"
      onAction={onCreateOrder}
      testID="no-orders-empty-state"
    />
  );
}

export function NoDataEmptyState() {
  return (
    <EmptyState
      icon="chart.bar"
      title="No Data Available"
      description="Data will appear here once you start tracking diaper changes and inventory."
      testID="no-data-empty-state"
    />
  );
}
