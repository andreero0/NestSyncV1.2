/**
 * GlassHeader Component
 * 
 * Navigation header component with glass UI styling built on GlassView.
 * Designed for use with React Navigation Stack.Screen headers.
 * 
 * Features:
 * - Glass UI navigation styling
 * - Back button support
 * - Custom action buttons
 * - Safe area handling
 * - Accessibility support
 * - Platform-specific styling
 * 
 * @example
 * ```tsx
 * // In Stack.Screen options
 * <Stack.Screen
 *   name="Details"
 *   options={{
 *     header: (props) => (
 *       <GlassHeader 
 *         title="Details"
 *         onBack={props.navigation.goBack}
 *       />
 *     )
 *   }}
 * />
 * ```
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassView } from './GlassView';
import { IconSymbol } from './IconSymbol';
import { GlassUITokens } from '@/constants/GlassUI';

/**
 * Header Action Button
 */
export interface HeaderAction {
  /** Icon name (SF Symbol on iOS) */
  icon: string;
  
  /** Press handler */
  onPress: () => void;
  
  /** Accessibility label */
  accessibilityLabel: string;
  
  /** Test ID */
  testID?: string;
}

/**
 * GlassHeader Props
 */
export interface GlassHeaderProps {
  /** Header title */
  title: string;
  
  /** Back button press handler */
  onBack?: () => void;
  
  /** Right side action buttons */
  actions?: HeaderAction[];
  
  /** Custom title component */
  titleComponent?: React.ReactNode;
  
  /** Whether to show back button */
  showBackButton?: boolean;
  
  /** Custom back button icon */
  backIcon?: string;
  
  /** Custom header style */
  style?: ViewStyle;
  
  /** Custom title style */
  titleStyle?: TextStyle;
  
  /** Accessibility label */
  accessibilityLabel?: string;
  
  /** Test ID for testing */
  testID?: string;
}

/**
 * GlassHeader Component
 * 
 * Renders a glass UI navigation header with back button and actions.
 * Automatically handles safe area insets and platform differences.
 */
export const GlassHeader = React.memo<GlassHeaderProps>(({
  title,
  onBack,
  actions = [],
  titleComponent,
  showBackButton = true,
  backIcon = 'chevron.left',
  style,
  titleStyle,
  accessibilityLabel,
  testID,
}) => {
  const insets = useSafeAreaInsets();

  // Header height with safe area
  const headerHeight = React.useMemo(() => {
    const baseHeight = 56;
    const statusBarHeight = Platform.OS === 'android' 
      ? StatusBar.currentHeight || 0 
      : insets.top;
    return baseHeight + statusBarHeight;
  }, [insets.top]);

  // Header container style
  const headerContainerStyle = React.useMemo<ViewStyle>(() => ({
    height: headerHeight,
    paddingTop: Platform.OS === 'android' 
      ? StatusBar.currentHeight || 0 
      : insets.top,
  }), [headerHeight, insets.top]);

  // Render back button
  const renderBackButton = () => {
    if (!showBackButton || !onBack) return null;

    return (
      <TouchableOpacity
        onPress={onBack}
        style={styles.backButton}
        accessibilityLabel="Go back"
        accessibilityRole="button"
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        testID={`${testID}-back-button`}
      >
        <IconSymbol name={backIcon as any} size={24} color="#374151" />
      </TouchableOpacity>
    );
  };

  // Render title
  const renderTitle = () => {
    if (titleComponent) {
      return titleComponent;
    }

    return (
      <Text 
        style={[styles.title, titleStyle]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {title}
      </Text>
    );
  };

  // Render action buttons
  const renderActions = () => {
    if (actions.length === 0) return null;

    return (
      <View style={styles.actions}>
        {actions.map((action, index) => (
          <TouchableOpacity
            key={index}
            onPress={action.onPress}
            style={styles.actionButton}
            accessibilityLabel={action.accessibilityLabel}
            accessibilityRole="button"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            testID={action.testID}
          >
            <IconSymbol name={action.icon as any} size={24} color="#374151" />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <GlassView
      preset="navigation"
      borderRadius={0}
      withBorder={false}
      withShadow={true}
      style={[styles.header, headerContainerStyle, style] as unknown as ViewStyle}
      accessibilityLabel={accessibilityLabel || `${title} header`}
      accessibilityRole="header"
      testID={testID}
    >
      <View style={styles.content}>
        <View style={styles.leftSection}>
          {renderBackButton()}
        </View>
        
        <View style={styles.centerSection}>
          {renderTitle()}
        </View>
        
        <View style={styles.rightSection}>
          {renderActions()}
        </View>
      </View>
    </GlassView>
  );
});

GlassHeader.displayName = 'GlassHeader';

const styles = StyleSheet.create({
  header: {
    width: '100%',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  leftSection: {
    width: 48,
    justifyContent: 'center',
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  rightSection: {
    width: 48,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  backButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

/**
 * Usage Examples:
 * 
 * 1. Basic Header with Back Button:
 * ```tsx
 * <GlassHeader 
 *   title="Settings"
 *   onBack={() => navigation.goBack()}
 * />
 * ```
 * 
 * 2. Header with Actions:
 * ```tsx
 * <GlassHeader 
 *   title="Edit Profile"
 *   onBack={() => navigation.goBack()}
 *   actions={[
 *     {
 *       icon: 'checkmark',
 *       onPress: handleSave,
 *       accessibilityLabel: 'Save changes',
 *     },
 *   ]}
 * />
 * ```
 * 
 * 3. Header with Multiple Actions:
 * ```tsx
 * <GlassHeader 
 *   title="Messages"
 *   onBack={() => navigation.goBack()}
 *   actions={[
 *     {
 *       icon: 'magnifyingglass',
 *       onPress: handleSearch,
 *       accessibilityLabel: 'Search messages',
 *     },
 *     {
 *       icon: 'ellipsis',
 *       onPress: handleMore,
 *       accessibilityLabel: 'More options',
 *     },
 *   ]}
 * />
 * ```
 * 
 * 4. Header Without Back Button:
 * ```tsx
 * <GlassHeader 
 *   title="Dashboard"
 *   showBackButton={false}
 *   actions={[
 *     {
 *       icon: 'gear',
 *       onPress: handleSettings,
 *       accessibilityLabel: 'Settings',
 *     },
 *   ]}
 * />
 * ```
 * 
 * 5. Header with Custom Title Component:
 * ```tsx
 * <GlassHeader 
 *   title="Custom"
 *   onBack={() => navigation.goBack()}
 *   titleComponent={
 *     <View>
 *       <Text style={styles.customTitle}>Custom Title</Text>
 *       <Text style={styles.customSubtitle}>Subtitle</Text>
 *     </View>
 *   }
 * />
 * ```
 * 
 * 6. Use with React Navigation:
 * ```tsx
 * <Stack.Screen
 *   name="Details"
 *   options={{
 *     header: (props) => (
 *       <GlassHeader 
 *         title="Details"
 *         onBack={props.navigation.goBack}
 *         actions={[
 *           {
 *             icon: 'heart',
 *             onPress: handleFavorite,
 *             accessibilityLabel: 'Add to favorites',
 *           },
 *         ]}
 *       />
 *     ),
 *     headerShown: true,
 *   }}
 * />
 * ```
 * 
 * 7. Custom Styled Header:
 * ```tsx
 * <GlassHeader 
 *   title="Custom Style"
 *   onBack={() => navigation.goBack()}
 *   style={{ backgroundColor: 'rgba(8, 145, 178, 0.1)' }}
 *   titleStyle={{ color: '#0891B2', fontSize: 20 }}
 * />
 * ```
 * 
 * 8. Header with Custom Back Icon:
 * ```tsx
 * <GlassHeader 
 *   title="Back to Home"
 *   onBack={() => navigation.navigate('Home')}
 *   backIcon="house"
 * />
 * ```
 */
