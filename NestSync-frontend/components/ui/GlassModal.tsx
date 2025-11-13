/**
 * GlassModal Component
 * 
 * Modal component with glass UI styling built on GlassView.
 * Provides consistent modal appearance with blur overlay and animations.
 * 
 * Features:
 * - Glass UI modal content with heavy blur
 * - Blurred overlay background
 * - Header with title and close button
 * - Smooth fade animations
 * - Keyboard handling
 * - Accessibility support
 * - Safe area handling
 * 
 * @example
 * ```tsx
 * <GlassModal 
 *   visible={isVisible}
 *   onClose={handleClose}
 *   title="Settings"
 * >
 *   <Text>Modal Content</Text>
 * </GlassModal>
 * ```
 */

import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import { GlassView } from './GlassView';
import { IconSymbol } from './IconSymbol';
import { GlassUITokens } from '@/constants/GlassUI';
import { BlurView } from 'expo-blur';
import { useGlassUI } from '@/contexts/GlassUIContext';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

/**
 * Modal Size Types
 * 
 * - small: Compact modal (max 400px width)
 * - medium: Standard modal (max 500px width, default)
 * - large: Wide modal (max 700px width)
 * - full: Full screen modal
 */
export type GlassModalSize = 'small' | 'medium' | 'large' | 'full';

/**
 * GlassModal Props
 */
export interface GlassModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  
  /** Close handler */
  onClose: () => void;
  
  /** Modal title */
  title?: string;
  
  /** Modal content */
  children: React.ReactNode;
  
  /** Modal size */
  size?: GlassModalSize;
  
  /** Whether to show close button */
  showCloseButton?: boolean;
  
  /** Whether modal can be dismissed by tapping overlay */
  dismissOnOverlayPress?: boolean;
  
  /** Whether to enable scrolling */
  scrollable?: boolean;
  
  /** Custom modal content style */
  contentStyle?: ViewStyle;
  
  /** Custom header style */
  headerStyle?: ViewStyle;
  
  /** Custom title style */
  titleStyle?: TextStyle;
  
  /** Accessibility label */
  accessibilityLabel?: string;
  
  /** Test ID for testing */
  testID?: string;
}

/**
 * GlassModal Component
 * 
 * Renders a glass UI modal with blur overlay and smooth animations.
 * Handles keyboard, safe areas, and accessibility automatically.
 */
export const GlassModal = React.memo<GlassModalProps>(({
  visible,
  onClose,
  title,
  children,
  size = 'medium',
  showCloseButton = true,
  dismissOnOverlayPress = true,
  scrollable = false,
  contentStyle,
  headerStyle,
  titleStyle,
  accessibilityLabel,
  testID,
}) => {
  const { isSupported, theme } = useGlassUI();
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Size configuration
  const sizeConfig = React.useMemo(() => {
    switch (size) {
      case 'small':
        return {
          maxWidth: 400,
          padding: 20,
        };
      case 'large':
        return {
          maxWidth: 700,
          padding: 32,
        };
      case 'full':
        return {
          maxWidth: screenWidth,
          padding: 24,
          fullScreen: true,
        };
      case 'medium':
      default:
        return {
          maxWidth: 500,
          padding: 24,
        };
    }
  }, [size, screenWidth]);

  // Modal content style
  const modalContentStyle = React.useMemo<ViewStyle>(() => ({
    width: size === 'full' ? screenWidth : '90%',
    maxWidth: sizeConfig.maxWidth,
    maxHeight: size === 'full' ? screenHeight : screenHeight * 0.85,
    padding: sizeConfig.padding,
  }), [size, sizeConfig, screenWidth, screenHeight]);

  // Handle overlay press
  const handleOverlayPress = () => {
    if (dismissOnOverlayPress) {
      onClose();
    }
  };

  // Render header
  const renderHeader = () => {
    if (!title && !showCloseButton) return null;

    return (
      <View style={[styles.header, headerStyle]}>
        {title && (
          <Text style={[styles.title, { color: colors.text }, titleStyle]}>
            {title}
          </Text>
        )}
        {showCloseButton && (
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            accessibilityLabel="Close modal"
            accessibilityRole="button"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <IconSymbol name="xmark" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Render content
  const renderContent = () => {
    if (scrollable) {
      return (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
          bounces={true}
        >
          {children}
        </ScrollView>
      );
    }

    return <View style={styles.content}>{children}</View>;
  };

  // Render overlay
  const renderOverlay = () => {
    if (isSupported && theme.enabled && Platform.OS === 'ios') {
      return (
        <BlurView
          intensity={30}
          tint="dark"
          style={styles.overlay}
        >
          <TouchableOpacity
            style={styles.overlayTouchable}
            onPress={handleOverlayPress}
            activeOpacity={1}
          />
        </BlurView>
      );
    }

    return (
      <TouchableOpacity
        style={[styles.overlay, styles.overlayFallback]}
        onPress={handleOverlayPress}
        activeOpacity={1}
      />
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {renderOverlay()}
        
        <View style={styles.modalContainer}>
          <GlassView
            preset="modal"
            style={[styles.modalContent, modalContentStyle, contentStyle] as unknown as ViewStyle}
          >
            {renderHeader()}
            {renderContent()}
          </GlassView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
});

GlassModal.displayName = 'GlassModal';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayTouchable: {
    flex: 1,
  },
  overlayFallback: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    // Styles applied via modalContentStyle
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    flex: 1,
  },
  closeButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});

/**
 * Usage Examples:
 * 
 * 1. Basic Modal:
 * ```tsx
 * <GlassModal 
 *   visible={isVisible}
 *   onClose={() => setIsVisible(false)}
 *   title="Confirmation"
 * >
 *   <Text>Are you sure?</Text>
 *   <GlassButton title="Confirm" onPress={handleConfirm} />
 * </GlassModal>
 * ```
 * 
 * 2. Scrollable Modal:
 * ```tsx
 * <GlassModal 
 *   visible={isVisible}
 *   onClose={handleClose}
 *   title="Terms of Service"
 *   scrollable
 * >
 *   <Text>{longContent}</Text>
 * </GlassModal>
 * ```
 * 
 * 3. Full Screen Modal:
 * ```tsx
 * <GlassModal 
 *   visible={isVisible}
 *   onClose={handleClose}
 *   size="full"
 *   title="Settings"
 * >
 *   <SettingsContent />
 * </GlassModal>
 * ```
 * 
 * 4. Modal Without Close Button:
 * ```tsx
 * <GlassModal 
 *   visible={isVisible}
 *   onClose={handleClose}
 *   showCloseButton={false}
 *   dismissOnOverlayPress={false}
 * >
 *   <Text>Processing...</Text>
 * </GlassModal>
 * ```
 * 
 * 5. Small Modal:
 * ```tsx
 * <GlassModal 
 *   visible={isVisible}
 *   onClose={handleClose}
 *   size="small"
 *   title="Quick Action"
 * >
 *   <GlassButton title="Delete" onPress={handleDelete} />
 * </GlassModal>
 * ```
 * 
 * 6. Large Modal:
 * ```tsx
 * <GlassModal 
 *   visible={isVisible}
 *   onClose={handleClose}
 *   size="large"
 *   title="Detailed View"
 * >
 *   <DetailedContent />
 * </GlassModal>
 * ```
 * 
 * 7. Custom Styled Modal:
 * ```tsx
 * <GlassModal 
 *   visible={isVisible}
 *   onClose={handleClose}
 *   title="Custom Modal"
 *   contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
 *   titleStyle={{ color: '#0891B2' }}
 * >
 *   <Text>Custom content</Text>
 * </GlassModal>
 * ```
 */
