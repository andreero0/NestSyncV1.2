// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  // Original mappings
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'chevron.left': 'chevron-left',

  // Professional emoji replacements for NestSync
  'figure.child': 'child-care',           // Baby/Child icon
  'shippingbox.fill': 'inventory',        // Package/Inventory icon
  'bell.fill': 'notifications',           // Notification bell icon
  'moon.zzz': 'bedtime',                  // Sleep/rest icon (overwhelmed persona)
  'bolt.fill': 'flash-on',                // Energy/efficiency icon
  'checkmark.circle.fill': 'check-circle', // Success/celebration icon
  'checkmark.circle': 'check-circle-outline', // Checkmark circle outline
  'shield.checkered': 'security',         // Privacy/security icon (alternative to 🇨🇦)
  'shield.checkmark': 'verified',         // Shield with checkmark icon
  'shield.checkmark.fill': 'verified',    // Verified/security icon
  'checkmark.shield.fill': 'verified-user', // Verified user icon
  'star.fill': 'star',                    // Star icon
  'xmark': 'close',                       // Close/X icon
  'clock.fill': 'schedule',               // Clock/schedule icon
  'exclamationmark.triangle': 'warning',  // Warning triangle icon
  'figure.2.and.child.holdinghands': 'family-restroom', // Family icon
  'brain.head.profile': 'psychology',     // AI/ML brain icon
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
