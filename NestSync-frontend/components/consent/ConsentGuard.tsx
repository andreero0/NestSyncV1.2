/**
 * ConsentGuard HOC Component
 * Higher-Order Component for protecting features requiring specific consent
 * Automatically triggers JIT consent requests when needed
 */

import React, { useState, useEffect, ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useRequireConsent } from '../../contexts/JITConsentContext';
import { useNestSyncTheme } from '../../contexts/ThemeContext';
import { Colors, NestSyncColors } from '../../constants/Colors';
import { NestSyncButton } from '../ui/NestSyncButton';
import { ConsentType } from '../../lib/types/auth';

export interface ConsentGuardProps {
  children: ReactNode;
  consentType: ConsentType;
  purpose: string;
  dataCategories: string[];
  feature: string;
  fallback?: ReactNode;
  // Optional customization
  title?: string;
  description?: string;
  icon?: string;
  showRetry?: boolean;
}

interface ConsentGuardState {
  isLoading: boolean;
  hasConsent: boolean;
  isRequesting: boolean;
  lastRequestFailed: boolean;
}

export function ConsentGuard({
  children,
  consentType,
  purpose,
  dataCategories,
  feature,
  fallback,
  title,
  description,
  icon,
  showRetry = true,
}: ConsentGuardProps) {
  const { requireConsent, hasConsent } = useRequireConsent();
  const actualTheme = useNestSyncTheme();
  const colors = Colors[actualTheme];

  const [state, setState] = useState<ConsentGuardState>({
    isLoading: true,
    hasConsent: false,
    isRequesting: false,
    lastRequestFailed: false,
  });

  // Check consent status on mount and when consent type changes
  useEffect(() => {
    checkConsentStatus();
  }, [consentType]);

  const checkConsentStatus = () => {
    const granted = hasConsent(consentType);
    setState({
      isLoading: false,
      hasConsent: granted,
      isRequesting: false,
      lastRequestFailed: false,
    });
  };

  const requestConsent = async () => {
    setState(prev => ({ ...prev, isRequesting: true, lastRequestFailed: false }));

    try {
      const granted = await requireConsent({
        consentType,
        purpose,
        dataCategories,
        feature,
      });

      setState(prev => ({
        ...prev,
        hasConsent: granted,
        isRequesting: false,
        lastRequestFailed: !granted,
      }));
    } catch (error) {
      console.error(`ConsentGuard: Error requesting ${consentType} for ${feature}:`, error);
      setState(prev => ({
        ...prev,
        isRequesting: false,
        lastRequestFailed: true,
      }));
    }
  };

  // Show loading state
  if (state.isLoading) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return (
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Checking permissions...
        </Text>
      </View>
    );
  }

  // Show children if consent is granted
  if (state.hasConsent) {
    return <>{children}</>;
  }

  // Show consent request UI
  const getDefaultContent = () => {
    const config = getDefaultConsentConfig(consentType);
    return {
      title: title || config.title,
      description: description || config.description,
      icon: icon || config.icon,
    };
  };

  const content = getDefaultContent();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* Icon */}
      <View style={[styles.iconContainer, { backgroundColor: colors.background }]}>
        <Text style={styles.icon}>{content.icon}</Text>
      </View>

      {/* Title */}
      <Text style={[styles.title, { color: colors.textEmphasis }]}>
        {content.title}
      </Text>

      {/* Description */}
      <Text style={[styles.description, { color: colors.text }]}>
        {content.description}
      </Text>

      {/* Action buttons */}
      <View style={styles.actions}>
        <NestSyncButton
          title={state.isRequesting ? "Requesting..." : "Grant Permission"}
          onPress={requestConsent}
          variant="primary"
          size="medium"
          loading={state.isRequesting}
          disabled={state.isRequesting}
          testID={`consent-guard-${consentType}-grant`}
        />

        {/* Retry button for failed requests */}
        {state.lastRequestFailed && showRetry && (
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={requestConsent}
            testID={`consent-guard-${consentType}-retry`}
          >
            <Text style={[styles.retryText, { color: colors.tint }]}>
              Try Again
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Canadian compliance note */}
      <View style={[styles.complianceNote, { backgroundColor: colors.background }]}>
        <Text style={[styles.complianceText, { color: colors.textSecondary }]}>
          🇨🇦 Your privacy is protected under Canadian PIPEDA standards
        </Text>
      </View>
    </View>
  );
}

// Default configuration for different consent types
function getDefaultConsentConfig(consentType: ConsentType) {
  switch (consentType) {
    case ConsentType.ANALYTICS:
      return {
        title: 'Help Us Improve',
        description: 'We need permission to collect anonymous usage data to improve your NestSync experience.',
        icon: 'chart',
      };
    case ConsentType.MARKETING:
      return {
        title: 'Stay Updated',
        description: 'We need permission to send you helpful parenting tips and product updates.',
        icon: 'mail',
      };
    case ConsentType.DATA_SHARING:
      return {
        title: 'Personalized Experience',
        description: 'We need permission to analyze your usage patterns for personalized recommendations.',
        icon: 'target',
      };
    default:
      return {
        title: 'Permission Required',
        description: 'This feature requires additional permissions to function properly.',
        icon: 'lock',
      };
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    minHeight: 200,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  icon: {
    fontSize: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 28,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  actions: {
    width: '100%',
    alignItems: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  retryText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  complianceNote: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: NestSyncColors.canadian.trust,
  },
  complianceText: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 16,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
});

// Convenience wrapper function for creating consent-protected components
export function withConsentGuard<T extends object>(
  Component: React.ComponentType<T>,
  consentConfig: {
    consentType: ConsentType;
    purpose: string;
    dataCategories: string[];
    feature: string;
  }
) {
  return function ConsentGuardedComponent(props: T) {
    return (
      <ConsentGuard {...consentConfig}>
        <Component {...props} />
      </ConsentGuard>
    );
  };
}

export default ConsentGuard;