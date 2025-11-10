# Component Usage Guidelines

**Date**: November 10, 2025  
**Spec**: Design Consistency and User Issues  
**Requirements**: 7.2  
**Status**: ✅ Complete

## Overview

This document provides practical guidelines and code examples for implementing design system compliant components in the NestSync application. Use these patterns to ensure consistency and maintainability.

## Button Components

### Primary Button

**Usage**: Main call-to-action buttons for primary user actions.

**Design Tokens**:
- Background: `NestSyncColors.primary.blue`
- Text: `#FFFFFF`
- Border Radius: `12px` (Large)
- Touch Target: `48px` minimum height
- Shadow: Medium preset

**Code Example**:

```typescript
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { NestSyncColors } from '@/constants/Colors';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export function PrimaryButton({ title, onPress, disabled, loading }: PrimaryButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || loading }}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text style={styles.buttonText}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: NestSyncColors.primary.blue,
    paddingHorizontal: 16,      // 4 × 4px base unit
    paddingVertical: 12,         // 3 × 4px base unit
    borderRadius: 12,            // Large
    minHeight: 48,               // WCAG AA minimum
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonDisabled: {
    backgroundColor: NestSyncColors.neutral[300],
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 14,                // Body
    fontWeight: '600',           // Semibold
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
```

### Secondary Button

**Usage**: Secondary actions, cancel buttons, alternative options.

**Design Tokens**:
- Background: Transparent
- Border: `1px` solid `NestSyncColors.primary.blue`
- Text: `NestSyncColors.primary.blue`
- Border Radius: `12px` (Large)
- Touch Target: `48px` minimum height

**Code Example**:

```typescript
export function SecondaryButton({ title, onPress, disabled }: ButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.secondaryButton, disabled && styles.secondaryButtonDisabled]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <Text style={[styles.secondaryButtonText, disabled && styles.secondaryButtonTextDisabled]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: NestSyncColors.primary.blue,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonDisabled: {
    borderColor: NestSyncColors.neutral[300],
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: NestSyncColors.primary.blue,
    textAlign: 'center',
  },
  secondaryButtonTextDisabled: {
    color: NestSyncColors.neutral[300],
  },
});
```

### Icon Button

**Usage**: Toolbar actions, navigation controls, compact interactions.

**Design Tokens**:
- Size: `48px × 48px` (WCAG AA minimum)
- Icon Color: `NestSyncColors.neutral[500]`
- Active Color: `NestSyncColors.primary.blue`
- Border Radius: `12px` (Large)

**Code Example**:

```typescript
import { Ionicons } from '@expo/vector-icons';

interface IconButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  accessibilityLabel: string;
  active?: boolean;
}

export function IconButton({ icon, onPress, accessibilityLabel, active }: IconButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.iconButton, active && styles.iconButtonActive]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Ionicons
        name={icon}
        size={24}
        color={active ? NestSyncColors.primary.blue : NestSyncColors.neutral[500]}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    width: 48,                   // WCAG AA minimum
    height: 48,                  // WCAG AA minimum
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  iconButtonActive: {
    backgroundColor: NestSyncColors.primary.blueLight,
  },
});
```

## Card Components

### Standard Card

**Usage**: Content containers, list items, dashboard widgets.

**Design Tokens**:
- Background: `NestSyncColors.neutral[50]`
- Border: `1px` solid `NestSyncColors.neutral[200]`
- Border Radius: `12px` (Large)
- Padding: `16px` (LG)
- Shadow: Small preset

**Code Example**:

```typescript
interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
}

export function Card({ children, onPress, style }: CardProps) {
  const Component = onPress ? TouchableOpacity : View;
  
  return (
    <Component
      style={[styles.card, style]}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
    >
      {children}
    </Component>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: NestSyncColors.neutral[50],
    padding: 16,                 // LG - 4 × 4px
    borderRadius: 12,            // Large
    borderWidth: 1,
    borderColor: NestSyncColors.neutral[200],
    marginBottom: 16,            // LG - 4 × 4px
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
});
```

### Glass Card

**Usage**: Premium features, overlays, modern aesthetic elements.

**Design Tokens**:
- Blur: Light (10px)
- Opacity: Subtle (0.7)
- Tint: Light
- Border Radius: `12px` (Large)

**Code Example**:

```typescript
import { BlurView } from 'expo-blur';
import { GlassUIPresets } from '@/constants/GlassUI';

export function GlassCard({ children, style }: CardProps) {
  return (
    <BlurView
      intensity={GlassUIPresets.card.blur}
      tint="light"
      style={[styles.glassCard, style]}
    >
      <View style={styles.glassCardContent}>
        {children}
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  glassCard: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 16,
  },
  glassCardContent: {
    padding: 16,
    backgroundColor: `rgba(255, 255, 255, ${GlassUIPresets.card.opacity})`,
  },
});
```

## Typography Components

### Heading

**Usage**: Screen titles, section headers, card titles.

**Design Tokens**:
- Font Size: `20px` (Title)
- Font Weight: `600` (Semibold)
- Color: `NestSyncColors.neutral[600]`
- Line Height: `28px`

**Code Example**:

```typescript
interface HeadingProps {
  children: React.ReactNode;
  level?: 1 | 2 | 3;
  style?: TextStyle;
}

export function Heading({ children, level = 1, style }: HeadingProps) {
  const headingStyle = level === 1 ? styles.h1 : level === 2 ? styles.h2 : styles.h3;
  
  return (
    <Text
      style={[headingStyle, style]}
      accessibilityRole="header"
      accessibilityLevel={level}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  h1: {
    fontSize: 28,                // Large Title
    fontWeight: '700',           // Bold
    color: NestSyncColors.neutral[600],
    lineHeight: 36,
    marginBottom: 12,            // MD - 3 × 4px
  },
  h2: {
    fontSize: 20,                // Title
    fontWeight: '600',           // Semibold
    color: NestSyncColors.neutral[600],
    lineHeight: 28,
    marginBottom: 8,             // SM - 2 × 4px
  },
  h3: {
    fontSize: 16,                // Subtitle
    fontWeight: '600',           // Semibold
    color: NestSyncColors.neutral[600],
    lineHeight: 24,
    marginBottom: 8,             // SM - 2 × 4px
  },
});
```

### Body Text

**Usage**: Paragraphs, descriptions, content text.

**Design Tokens**:
- Font Size: `14px` (Body)
- Font Weight: `400` (Regular)
- Color: `NestSyncColors.neutral[500]`
- Line Height: `20px`

**Code Example**:

```typescript
interface BodyTextProps {
  children: React.ReactNode;
  secondary?: boolean;
  style?: TextStyle;
}

export function BodyText({ children, secondary, style }: BodyTextProps) {
  return (
    <Text style={[styles.body, secondary && styles.bodySecondary, style]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  body: {
    fontSize: 14,                // Body
    fontWeight: '400',           // Regular
    color: NestSyncColors.neutral[500],
    lineHeight: 20,
    marginBottom: 12,            // MD - 3 × 4px
  },
  bodySecondary: {
    color: NestSyncColors.neutral[400],
  },
});
```

### Caption

**Usage**: Metadata, timestamps, helper text.

**Design Tokens**:
- Font Size: `11px` (Caption)
- Font Weight: `500` (Medium)
- Color: `NestSyncColors.neutral[400]`
- Line Height: `16px`

**Code Example**:

```typescript
export function Caption({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  return (
    <Text style={[styles.caption, style]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  caption: {
    fontSize: 11,                // Caption
    fontWeight: '500',           // Medium
    color: NestSyncColors.neutral[400],
    lineHeight: 16,
  },
});
```

## Input Components

### Text Input

**Usage**: Form fields, search bars, user input.

**Design Tokens**:
- Background: `NestSyncColors.neutral[100]`
- Border: `1px` solid `NestSyncColors.neutral[200]`
- Border Radius: `8px` (Medium)
- Padding: `12px` (MD)
- Min Height: `48px` (WCAG AA)

**Code Example**:

```typescript
interface TextInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
}

export function TextInput({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  required,
}: TextInputProps) {
  return (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <TextInput
        style={[styles.input, error && styles.inputError]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={NestSyncColors.neutral[300]}
        accessibilityLabel={label}
        accessibilityRequired={required}
      />
      {error && (
        <Text style={styles.errorText} accessibilityRole="alert">
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    marginBottom: 16,            // LG - 4 × 4px
  },
  label: {
    fontSize: 14,                // Body
    fontWeight: '500',           // Medium
    color: NestSyncColors.neutral[600],
    marginBottom: 8,             // SM - 2 × 4px
  },
  required: {
    color: NestSyncColors.semantic.error,
  },
  input: {
    backgroundColor: NestSyncColors.neutral[100],
    borderWidth: 1,
    borderColor: NestSyncColors.neutral[200],
    borderRadius: 8,             // Medium
    padding: 12,                 // MD - 3 × 4px
    minHeight: 48,               // WCAG AA minimum
    fontSize: 14,                // Body
    color: NestSyncColors.neutral[500],
  },
  inputError: {
    borderColor: NestSyncColors.semantic.error,
  },
  errorText: {
    fontSize: 12,                // Small
    color: NestSyncColors.semantic.error,
    marginTop: 4,                // XS - 1 × 4px
  },
});
```

## Badge Components

### Status Badge

**Usage**: Status indicators, labels, tags.

**Design Tokens**:
- Border Radius: `6px` (Small)
- Padding: `4px 8px` (XS, SM)
- Font Size: `11px` (Caption)
- Font Weight: `500` (Medium)

**Code Example**:

```typescript
type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

interface BadgeProps {
  label: string;
  variant: BadgeVariant;
}

export function Badge({ label, variant }: BadgeProps) {
  return (
    <View style={[styles.badge, styles[`badge${variant}`]]}>
      <Text style={[styles.badgeText, styles[`badgeText${variant}`]]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,        // SM - 2 × 4px
    paddingVertical: 4,          // XS - 1 × 4px
    borderRadius: 6,             // Small
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 11,                // Caption
    fontWeight: '500',           // Medium
  },
  badgeSuccess: {
    backgroundColor: NestSyncColors.secondary.greenLight,
  },
  badgeTextSuccess: {
    color: NestSyncColors.secondary.green,
  },
  badgeWarning: {
    backgroundColor: '#FEF3C7',
  },
  badgeTextWarning: {
    color: NestSyncColors.accent.amber,
  },
  badgeError: {
    backgroundColor: '#FEE2E2',
  },
  badgeTextError: {
    color: NestSyncColors.semantic.error,
  },
  badgeInfo: {
    backgroundColor: NestSyncColors.primary.blueLight,
  },
  badgeTextInfo: {
    color: NestSyncColors.primary.blue,
  },
  badgeNeutral: {
    backgroundColor: NestSyncColors.neutral[100],
  },
  badgeTextNeutral: {
    color: NestSyncColors.neutral[500],
  },
});
```

## Alert Components

### Alert Banner

**Usage**: Success messages, warnings, errors, informational messages.

**Design Tokens**:
- Border Radius: `12px` (Large)
- Padding: `12px` (MD)
- Icon Size: `24px`
- Min Height: `48px` (WCAG AA)

**Code Example**:

```typescript
import { Ionicons } from '@expo/vector-icons';

type AlertVariant = 'success' | 'warning' | 'error' | 'info';

interface AlertProps {
  variant: AlertVariant;
  title: string;
  message?: string;
  onDismiss?: () => void;
}

const alertConfig = {
  success: {
    icon: 'checkmark-circle' as const,
    backgroundColor: NestSyncColors.secondary.greenPale,
    iconColor: NestSyncColors.secondary.green,
    textColor: NestSyncColors.neutral[700],
  },
  warning: {
    icon: 'warning' as const,
    backgroundColor: '#FEF3C7',
    iconColor: NestSyncColors.accent.amber,
    textColor: NestSyncColors.neutral[700],
  },
  error: {
    icon: 'alert-circle' as const,
    backgroundColor: '#FEE2E2',
    iconColor: NestSyncColors.semantic.error,
    textColor: NestSyncColors.neutral[700],
  },
  info: {
    icon: 'information-circle' as const,
    backgroundColor: NestSyncColors.primary.blueLight,
    iconColor: NestSyncColors.primary.blue,
    textColor: NestSyncColors.neutral[700],
  },
};

export function Alert({ variant, title, message, onDismiss }: AlertProps) {
  const config = alertConfig[variant];
  
  return (
    <View
      style={[styles.alert, { backgroundColor: config.backgroundColor }]}
      accessibilityRole="alert"
    >
      <Ionicons name={config.icon} size={24} color={config.iconColor} />
      <View style={styles.alertContent}>
        <Text style={[styles.alertTitle, { color: config.textColor }]}>
          {title}
        </Text>
        {message && (
          <Text style={[styles.alertMessage, { color: config.textColor }]}>
            {message}
          </Text>
        )}
      </View>
      {onDismiss && (
        <TouchableOpacity
          onPress={onDismiss}
          style={styles.dismissButton}
          accessibilityLabel="Dismiss alert"
          accessibilityRole="button"
        >
          <Ionicons name="close" size={20} color={config.textColor} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,                 // MD - 3 × 4px
    borderRadius: 12,            // Large
    marginBottom: 16,            // LG - 4 × 4px
    minHeight: 48,               // WCAG AA minimum
    gap: 12,                     // MD - 3 × 4px
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,                // Body
    fontWeight: '600',           // Semibold
    marginBottom: 4,             // XS - 1 × 4px
  },
  alertMessage: {
    fontSize: 12,                // Small
    fontWeight: '400',           // Regular
  },
  dismissButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
```

## List Components

### List Item

**Usage**: Settings options, navigation items, selectable items.

**Design Tokens**:
- Min Height: `48px` (WCAG AA)
- Padding: `12px 16px` (MD, LG)
- Border: `1px` solid `NestSyncColors.neutral[200]`

**Code Example**:

```typescript
interface ListItemProps {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  rightElement?: React.ReactNode;
}

export function ListItem({ title, subtitle, icon, onPress, rightElement }: ListItemProps) {
  const Component = onPress ? TouchableOpacity : View;
  
  return (
    <Component
      style={styles.listItem}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={24}
          color={NestSyncColors.neutral[500]}
          style={styles.listItemIcon}
        />
      )}
      <View style={styles.listItemContent}>
        <Text style={styles.listItemTitle}>{title}</Text>
        {subtitle && (
          <Text style={styles.listItemSubtitle}>{subtitle}</Text>
        )}
      </View>
      {rightElement}
      {onPress && (
        <Ionicons
          name="chevron-forward"
          size={20}
          color={NestSyncColors.neutral[400]}
        />
      )}
    </Component>
  );
}

const styles = StyleSheet.create({
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,               // WCAG AA minimum
    paddingVertical: 12,         // MD - 3 × 4px
    paddingHorizontal: 16,       // LG - 4 × 4px
    borderBottomWidth: 1,
    borderBottomColor: NestSyncColors.neutral[200],
    gap: 12,                     // MD - 3 × 4px
  },
  listItemIcon: {
    marginRight: 4,              // XS - 1 × 4px
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 14,                // Body
    fontWeight: '400',           // Regular
    color: NestSyncColors.neutral[500],
  },
  listItemSubtitle: {
    fontSize: 12,                // Small
    fontWeight: '400',           // Regular
    color: NestSyncColors.neutral[400],
    marginTop: 4,                // XS - 1 × 4px
  },
});
```

## Best Practices

### Do's ✅

1. **Always use design tokens** instead of hardcoded values
2. **Maintain 48px minimum touch targets** for all interactive elements
3. **Use consistent spacing** with 4px base unit multiples
4. **Include accessibility attributes** (accessibilityRole, accessibilityLabel)
5. **Test on physical devices** to verify touch targets and readability
6. **Use semantic colors appropriately** (success, warning, error, info)
7. **Provide loading and disabled states** for all interactive components
8. **Include error handling** and validation feedback

### Don'ts ❌

1. **Don't hardcode colors** - always use NestSyncColors tokens
2. **Don't use non-standard font sizes** - stick to design system values
3. **Don't use non-4px-multiple spacing** - maintain visual rhythm
4. **Don't create touch targets smaller than 48px** - accessibility requirement
5. **Don't rely on color alone** - always pair with icons or text
6. **Don't skip accessibility attributes** - screen reader support is essential
7. **Don't use multiple font weights in same text** - maintain hierarchy
8. **Don't create custom shadows** - use standard presets

## Testing Your Components

### Visual Testing Checklist

- [ ] Component matches design system tokens
- [ ] Spacing uses 4px base unit multiples
- [ ] Touch targets meet 48px minimum
- [ ] Colors have sufficient contrast (4.5:1 minimum)
- [ ] Typography uses standard sizes and weights
- [ ] Shadows use standard presets
- [ ] Border radius uses standard values

### Accessibility Testing Checklist

- [ ] All interactive elements have accessibilityRole
- [ ] All interactive elements have accessibilityLabel
- [ ] Touch targets meet 48px minimum
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] Screen reader announces all content correctly
- [ ] Keyboard navigation works (web platform)
- [ ] Focus indicators are visible

### Responsive Testing Checklist

- [ ] Component works on mobile (375px width)
- [ ] Component works on tablet (768px width)
- [ ] Component works on desktop (1280px width)
- [ ] Text doesn't overflow containers
- [ ] Touch targets remain adequate on all sizes
- [ ] Spacing scales appropriately

## Related Documentation

- [Design System Compliance Checklist](./design-system-compliance-checklist.md)
- [Design System Audit Report](./design-system-audit-report.md)
- [Visual Regression Tests](../../tests/VISUAL_REGRESSION_TESTS.md)
- [Accessibility Compliance Tests](../../tests/ACCESSIBILITY_COMPLIANCE_TESTS.md)

---

**Last Updated**: November 10, 2025  
**Version**: 1.0.0  
**Maintained By**: NestSync Design Team
