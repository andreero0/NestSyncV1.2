/**
 * Timeline Error Boundary Component
 *
 * Catches and handles timeline rendering errors, including "chain diapers"
 * and other data corruption issues that might crash the timeline display.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ColorSchemeName, Appearance } from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors, NestSyncColors } from '@/constants/Colors';

interface Props {
  children: ReactNode;
  onRetry?: () => void;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  colorScheme: ColorSchemeName;
}

export class TimelineErrorBoundary extends Component<Props, State> {
  private colorSchemeListener: any;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      colorScheme: Appearance.getColorScheme()
    };
  }

  componentDidMount() {
    // Listen for color scheme changes
    this.colorSchemeListener = Appearance.addChangeListener(({ colorScheme }) => {
      this.setState({ colorScheme });
    });
  }

  componentWillUnmount() {
    // Clean up listener
    if (this.colorSchemeListener) {
      this.colorSchemeListener.remove();
    }
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Timeline Error Boundary caught an error:', error, errorInfo);

    // Log specific chain diapers or data corruption errors
    if (error.message.includes('chain') || error.message.includes('concatenat')) {
      console.error('Potential "chain diapers" error detected:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      });
    }

    this.setState({
      error,
      errorInfo,
    });
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  public render() {
    if (this.state.hasError) {
      const isDevelopment = __DEV__;
      const colors = Colors[this.state.colorScheme ?? 'light'];

      return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={[
            styles.errorCard,
            { backgroundColor: colors.surface, borderColor: colors.border }
          ]}>
            <IconSymbol name="exclamationmark.triangle.fill" size={32} color={NestSyncColors.semantic.error} />

            <Text style={[styles.title, { color: colors.text }]}>
              Timeline Display Error
            </Text>

            <Text style={[styles.message, { color: colors.textSecondary }]}>
              {this.props.fallbackMessage ||
                'There was a problem displaying the activity timeline. This might be due to corrupted activity data.'}
            </Text>

            {isDevelopment && this.state.error && (
              <View style={[
                styles.debugInfo,
                { backgroundColor: `${NestSyncColors.semantic.error}10`, borderColor: `${NestSyncColors.semantic.error}40` }
              ]}>
                <Text style={[styles.debugTitle, { color: NestSyncColors.semantic.error }]}>Debug Info:</Text>
                <Text style={[styles.debugText, { color: NestSyncColors.semantic.error }]} numberOfLines={3}>
                  {this.state.error.message}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: NestSyncColors.primary.blue }]}
              onPress={this.handleRetry}
              accessibilityRole="button"
              accessibilityLabel="Retry loading timeline"
            >
              <IconSymbol name="arrow.clockwise" size={16} color={colors.background} />
              <Text style={[styles.retryText, { color: colors.background }]}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    // backgroundColor applied inline with theme awareness
  },
  errorCard: {
    // backgroundColor and borderColor applied inline with theme awareness
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    maxWidth: 320,
    borderWidth: 1,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    // color applied inline with theme awareness
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    // color applied inline with theme awareness
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  debugInfo: {
    // backgroundColor and borderColor applied inline with NestSyncColors
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    width: '100%',
    borderWidth: 1,
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: '600',
    // color applied inline with NestSyncColors
    marginBottom: 4,
  },
  debugText: {
    fontSize: 11,
    // color applied inline with NestSyncColors
    fontFamily: 'monospace',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor applied inline with NestSyncColors
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    gap: 8,
  },
  retryText: {
    // color applied inline with theme awareness
    fontSize: 14,
    fontWeight: '600',
  },
});