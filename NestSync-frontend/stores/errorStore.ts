/**
 * Unified Error Store (Zustand)
 * Single source of truth for all error states in NestSync
 * Eliminates overlapping error displays with priority-based management
 * Psychology-driven messaging for stressed parents
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// Error severity levels (priority-based)
export enum ErrorSeverity {
  LOW = 1,        // Info/minor issues that don't block functionality
  MEDIUM = 2,     // Warnings that may affect some functionality
  HIGH = 3,       // Errors that significantly impact functionality
  CRITICAL = 4,   // Errors that block core functionality
}

// Error categories for context-aware messaging
export enum ErrorCategory {
  NETWORK = 'network',
  AUTHENTICATION = 'authentication', 
  DATA = 'data',
  PERMISSION = 'permission',
  SERVER = 'server',
  VALIDATION = 'validation',
  UNKNOWN = 'unknown',
}

// Error source tracking for debugging
export enum ErrorSource {
  APOLLO_CLIENT = 'apollo_client',
  MANUAL_RETRY = 'manual_retry',
  DASHBOARD = 'dashboard',
  AUTHENTICATION = 'authentication',
  NAVIGATION = 'navigation',
  BACKGROUND_TASK = 'background_task',
}

// Individual error interface
export interface ErrorState {
  id: string;
  message: string;
  supportiveMessage?: string; // Psychology-driven alternative message
  severity: ErrorSeverity;
  category: ErrorCategory;
  source: ErrorSource;
  canRetry: boolean;
  retryCount: number;
  maxRetries: number;
  timestamp: number;
  context?: Record<string, any>; // Additional context for debugging
  canadianCompliance?: boolean; // PIPEDA-specific error context
}

// Error display configuration
export interface ErrorDisplayConfig {
  showIcon: boolean;
  iconName: string;
  iconColor: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  canDismiss: boolean;
  autoDismiss: boolean;
  autoDismissDelay: number; // milliseconds
}

// Unified error store interface
interface UnifiedErrorState {
  // Core state
  errors: ErrorState[];
  activeError: ErrorState | null;
  isRetrying: boolean;
  isVisible: boolean;
  
  // Display configuration
  displayConfig: ErrorDisplayConfig;
  
  // Psychology-driven UX settings
  stressReductionMode: boolean;
  parentFriendlyMessaging: boolean;
  
  // Actions
  addError: (error: Omit<ErrorState, 'id' | 'timestamp'>) => void;
  updateError: (id: string, updates: Partial<ErrorState>) => void;
  removeError: (id: string) => void;
  clearError: (id: string) => void;
  clearAllErrors: () => void;
  retryError: (id: string) => Promise<void>;
  dismissActiveError: () => void;
  setStressReductionMode: (enabled: boolean) => void;
  setParentFriendlyMessaging: (enabled: boolean) => void;
  
  // Internal methods
  _selectActiveError: () => void;
  _generateErrorId: () => string;
  _getDisplayConfig: (error: ErrorState) => ErrorDisplayConfig;
  _getParentFriendlyMessage: (error: ErrorState) => string;
}

// Psychology-driven error messages for stressed parents
const PARENT_FRIENDLY_MESSAGES: Record<ErrorCategory, Record<ErrorSeverity, string[]>> = {
  [ErrorCategory.NETWORK]: {
    [ErrorSeverity.LOW]: [
      "We're checking the connection. Your data is safe and waiting.",
      "Just a moment while we reconnect. Everything you've logged is secure."
    ],
    [ErrorSeverity.MEDIUM]: [
      "We're having trouble connecting right now. Your information is safe, and we'll keep trying.",
      "The connection is a bit slow today. Don't worry - we've saved your progress."
    ],
    [ErrorSeverity.HIGH]: [
      "We can't reach our servers right now. Your data is safe, and we'll sync when connected.",
      "Offline for now, but everything you've done is saved. We'll catch up when the connection returns."
    ],
    [ErrorSeverity.CRITICAL]: [
      "We're working to restore the connection. Your diaper logs are safely stored on your device.",
      "Connection lost, but don't worry - we've saved everything locally and will sync when ready."
    ]
  },
  [ErrorCategory.AUTHENTICATION]: {
    [ErrorSeverity.LOW]: [
      "Just refreshing your session. This will only take a moment.",
    ],
    [ErrorSeverity.MEDIUM]: [
      "Let's get you signed back in. Your information is secure and waiting for you.",
    ],
    [ErrorSeverity.HIGH]: [
      "We need to verify your identity again. Your data is safe and we'll restore everything.",
    ],
    [ErrorSeverity.CRITICAL]: [
      "Please sign in again to protect your family's information. Everything is securely stored.",
    ]
  },
  [ErrorCategory.DATA]: {
    [ErrorSeverity.LOW]: [
      "Getting your latest information ready. Almost there!",
    ],
    [ErrorSeverity.MEDIUM]: [
      "We're working on loading your data. Your information is safe.",
    ],
    [ErrorSeverity.HIGH]: [
      "Having trouble loading some information. We're working on it and your data is secure.",
    ],
    [ErrorSeverity.CRITICAL]: [
      "We can't load your data right now, but everything is safely stored. Please try refreshing.",
    ]
  },
  [ErrorCategory.SERVER]: {
    [ErrorSeverity.LOW]: [
      "Our servers are running a quick check. Back in just a moment.",
    ],
    [ErrorSeverity.MEDIUM]: [
      "Our servers are taking a short break. We're working on it and your data is safe.",
    ],
    [ErrorSeverity.HIGH]: [
      "Our servers need a moment to catch up. Your information is secure and we're working on it.",
    ],
    [ErrorSeverity.CRITICAL]: [
      "Our servers are taking an unexpected break. Everything is safe, and we're working to restore service.",
    ]
  },
  [ErrorCategory.PERMISSION]: {
    [ErrorSeverity.LOW]: [
      "We need permission to help you track diaper changes.",
    ],
    [ErrorSeverity.MEDIUM]: [
      "Some features need permission to work their best for you.",
    ],
    [ErrorSeverity.HIGH]: [
      "We need a few permissions to give you the full NestSync experience.",
    ],
    [ErrorSeverity.CRITICAL]: [
      "Essential permissions are needed to keep your data safe and accessible.",
    ]
  },
  [ErrorCategory.VALIDATION]: {
    [ErrorSeverity.LOW]: [
      "Just double-checking some information. Almost ready!",
    ],
    [ErrorSeverity.MEDIUM]: [
      "Let's fix a small detail to keep everything accurate.",
    ],
    [ErrorSeverity.HIGH]: [
      "We need to correct some information to keep your records accurate.",
    ],
    [ErrorSeverity.CRITICAL]: [
      "Something doesn't look right. Let's fix this to keep your data accurate and safe.",
    ]
  },
  [ErrorCategory.UNKNOWN]: {
    [ErrorSeverity.LOW]: [
      "Just a moment while we figure things out.",
    ],
    [ErrorSeverity.MEDIUM]: [
      "Something unexpected happened. We're looking into it and your data is safe.",
    ],
    [ErrorSeverity.HIGH]: [
      "We encountered something unexpected. Your information is secure while we investigate.",
    ],
    [ErrorSeverity.CRITICAL]: [
      "Something went wrong, but your data is safe. We're working on a fix.",
    ]
  }
};

// Display configurations for different error severities
const DISPLAY_CONFIGS: Record<ErrorSeverity, ErrorDisplayConfig> = {
  [ErrorSeverity.LOW]: {
    showIcon: true,
    iconName: 'info.circle.fill',
    iconColor: '#4FC3F7', // Light blue - calming
    backgroundColor: '#E3F2FD', // Very light blue
    borderColor: '#81D4FA',
    textColor: '#1565C0',
    canDismiss: true,
    autoDismiss: true,
    autoDismissDelay: 4000,
  },
  [ErrorSeverity.MEDIUM]: {
    showIcon: true,
    iconName: 'exclamationmark.circle.fill',
    iconColor: '#FF9800', // Orange - attention without alarm
    backgroundColor: '#FFF3E0',
    borderColor: '#FFB74D',
    textColor: '#E65100',
    canDismiss: true,
    autoDismiss: false,
    autoDismissDelay: 0,
  },
  [ErrorSeverity.HIGH]: {
    showIcon: true,
    iconName: 'heart.circle.fill', // Heart icon for supportive feel
    iconColor: '#F44336', // Red but with heart icon for less stress
    backgroundColor: '#FFEBEE',
    borderColor: '#EF5350',
    textColor: '#C62828',
    canDismiss: true,
    autoDismiss: false,
    autoDismissDelay: 0,
  },
  [ErrorSeverity.CRITICAL]: {
    showIcon: true,
    iconName: 'heart.circle.fill',
    iconColor: '#9C27B0', // Purple - serious but not alarming
    backgroundColor: '#F3E5F5',
    borderColor: '#BA68C8',
    textColor: '#6A1B9A',
    canDismiss: false, // Critical errors must be addressed
    autoDismiss: false,
    autoDismissDelay: 0,
  },
};

// Create the unified error store
export const useErrorStore = create<UnifiedErrorState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    errors: [],
    activeError: null,
    isRetrying: false,
    isVisible: false,
    displayConfig: DISPLAY_CONFIGS[ErrorSeverity.MEDIUM],
    stressReductionMode: true, // Default enabled for parent app
    parentFriendlyMessaging: true, // Default enabled

    // Add new error to the store
    addError: (errorData) => {
      const state = get();
      const id = state._generateErrorId();
      const timestamp = Date.now();
      
      const newError: ErrorState = {
        ...errorData,
        id,
        timestamp,
        retryCount: 0,
        maxRetries: errorData.maxRetries || 3,
      };

      // Remove any existing errors from the same source to prevent duplicates
      const filteredErrors = state.errors.filter(e => 
        !(e.source === newError.source && e.category === newError.category)
      );

      const updatedErrors = [...filteredErrors, newError];
      
      set({ 
        errors: updatedErrors,
      });

      // Select the highest priority error to display
      state._selectActiveError();
      
      if (__DEV__) {
        console.log(`[ErrorStore] Added error: ${newError.message} (${newError.severity}, ${newError.source})`);
      }
    },

    // Update existing error
    updateError: (id, updates) => {
      const state = get();
      const updatedErrors = state.errors.map(error =>
        error.id === id ? { ...error, ...updates } : error
      );
      
      set({ errors: updatedErrors });
      
      // Reselect active error in case priority changed
      state._selectActiveError();
    },

    // Remove error from store
    removeError: (id) => {
      const state = get();
      const updatedErrors = state.errors.filter(error => error.id !== id);
      
      set({ errors: updatedErrors });
      
      // Reselect active error
      state._selectActiveError();
      
      if (__DEV__) {
        console.log(`[ErrorStore] Removed error: ${id}`);
      }
    },

    // Clear specific error (alias for removeError for API consistency)
    clearError: (id) => {
      get().removeError(id);
    },

    // Clear all errors
    clearAllErrors: () => {
      set({ 
        errors: [],
        activeError: null,
        isVisible: false,
        isRetrying: false,
      });
      
      if (__DEV__) {
        console.log('[ErrorStore] Cleared all errors');
      }
    },

    // Retry error with exponential backoff
    retryError: async (id) => {
      const state = get();
      const error = state.errors.find(e => e.id === id);
      
      if (!error || !error.canRetry || error.retryCount >= error.maxRetries) {
        return;
      }

      set({ isRetrying: true });

      try {
        // Update retry count
        state.updateError(id, { 
          retryCount: error.retryCount + 1 
        });

        // Calculate exponential backoff delay
        const delay = Math.min(1000 * Math.pow(2, error.retryCount), 10000);
        
        if (__DEV__) {
          console.log(`[ErrorStore] Retrying error ${id} (attempt ${error.retryCount + 1}/${error.maxRetries}) after ${delay}ms`);
        }

        await new Promise(resolve => setTimeout(resolve, delay));

        // For now, we'll just remove the error after retry
        // In a real implementation, this would trigger the original action
        state.removeError(id);

      } catch (retryError) {
        if (__DEV__) {
          console.error(`[ErrorStore] Retry failed for error ${id}:`, retryError);
        }
        
        // Update error with retry failure info
        state.updateError(id, {
          message: 'Retry failed. Please try again manually.',
          supportiveMessage: 'We tried a few times but couldn\'t fix this. When you\'re ready, tap Try Again.',
        });
      } finally {
        set({ isRetrying: false });
      }
    },

    // Dismiss currently active error
    dismissActiveError: () => {
      const state = get();
      if (state.activeError && state.displayConfig.canDismiss) {
        state.removeError(state.activeError.id);
      }
    },

    // Enable/disable stress reduction mode
    setStressReductionMode: (enabled) => {
      set({ stressReductionMode: enabled });
      
      // Reselect active error to update display
      get()._selectActiveError();
    },

    // Enable/disable parent-friendly messaging
    setParentFriendlyMessaging: (enabled) => {
      set({ parentFriendlyMessaging: enabled });
      
      // Reselect active error to update display
      get()._selectActiveError();
    },

    // Internal: Select the highest priority error to display
    _selectActiveError: () => {
      const state = get();
      
      if (state.errors.length === 0) {
        set({ 
          activeError: null, 
          isVisible: false,
          displayConfig: DISPLAY_CONFIGS[ErrorSeverity.MEDIUM],
        });
        return;
      }

      // Sort errors by severity (highest first), then by timestamp (newest first)
      const sortedErrors = [...state.errors].sort((a, b) => {
        if (a.severity !== b.severity) {
          return b.severity - a.severity; // Higher severity first
        }
        return b.timestamp - a.timestamp; // Newer first
      });

      const highestPriorityError = sortedErrors[0];
      const displayConfig = state._getDisplayConfig(highestPriorityError);

      set({ 
        activeError: highestPriorityError,
        isVisible: true,
        displayConfig,
      });

      // Auto-dismiss if configured
      if (displayConfig.autoDismiss && displayConfig.autoDismissDelay > 0) {
        setTimeout(() => {
          const currentState = get();
          if (currentState.activeError?.id === highestPriorityError.id) {
            currentState.removeError(highestPriorityError.id);
          }
        }, displayConfig.autoDismissDelay);
      }
    },

    // Internal: Generate unique error ID
    _generateErrorId: () => {
      return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },

    // Internal: Get display configuration for error
    _getDisplayConfig: (error) => {
      const baseConfig = DISPLAY_CONFIGS[error.severity];
      const state = get();
      
      if (state.stressReductionMode) {
        // Modify colors for stress reduction in parent app
        return {
          ...baseConfig,
          // Use heart icon for high/critical errors to reduce stress
          iconName: error.severity >= ErrorSeverity.HIGH ? 'heart.circle.fill' : baseConfig.iconName,
          // Soften colors slightly
          iconColor: error.severity >= ErrorSeverity.HIGH ? '#4FC3F7' : baseConfig.iconColor,
        };
      }
      
      return baseConfig;
    },

    // Internal: Get parent-friendly message
    _getParentFriendlyMessage: (error) => {
      const state = get();
      
      if (!state.parentFriendlyMessaging) {
        return error.supportiveMessage || error.message;
      }

      // Use supportive message if provided
      if (error.supportiveMessage) {
        return error.supportiveMessage;
      }

      // Generate parent-friendly message
      const messages = PARENT_FRIENDLY_MESSAGES[error.category]?.[error.severity];
      if (messages && messages.length > 0) {
        // Use modulo to cycle through messages for variety
        const index = Math.abs(error.message.length + error.timestamp) % messages.length;
        return messages[index];
      }

      // Fallback to original message
      return error.message;
    },
  }))
);

// Convenience selectors
export const useActiveError = () => {
  const store = useErrorStore();
  return {
    error: store.activeError,
    isVisible: store.isVisible,
    isRetrying: store.isRetrying,
    displayConfig: store.displayConfig,
    canRetry: store.activeError?.canRetry ?? false,
    retryCount: store.activeError?.retryCount ?? 0,
    maxRetries: store.activeError?.maxRetries ?? 0,
    message: store.activeError ? store._getParentFriendlyMessage(store.activeError) : '',
    dismiss: store.dismissActiveError,
    retry: () => store.activeError && store.retryError(store.activeError.id),
  };
};

export const useErrorSettings = () => {
  const store = useErrorStore();
  return {
    stressReductionMode: store.stressReductionMode,
    parentFriendlyMessaging: store.parentFriendlyMessaging,
    setStressReductionMode: store.setStressReductionMode,
    setParentFriendlyMessaging: store.setParentFriendlyMessaging,
  };
};

// Helper functions for common error patterns
export const createNetworkError = (
  message: string,
  severity: ErrorSeverity = ErrorSeverity.MEDIUM,
  source: ErrorSource = ErrorSource.APOLLO_CLIENT
): Omit<ErrorState, 'id' | 'timestamp'> => ({
  message,
  severity,
  category: ErrorCategory.NETWORK,
  source,
  canRetry: true,
  retryCount: 0,
  maxRetries: 3,
  canadianCompliance: true,
});

export const createAuthError = (
  message: string,
  severity: ErrorSeverity = ErrorSeverity.HIGH,
  source: ErrorSource = ErrorSource.AUTHENTICATION
): Omit<ErrorState, 'id' | 'timestamp'> => ({
  message,
  severity,
  category: ErrorCategory.AUTHENTICATION,
  source,
  canRetry: false, // Auth errors usually require user action
  retryCount: 0,
  maxRetries: 0,
  canadianCompliance: true,
});

export const createDataError = (
  message: string,
  severity: ErrorSeverity = ErrorSeverity.MEDIUM,
  source: ErrorSource = ErrorSource.DASHBOARD
): Omit<ErrorState, 'id' | 'timestamp'> => ({
  message,
  severity,
  category: ErrorCategory.DATA,
  source,
  canRetry: true,
  retryCount: 0,
  maxRetries: 3,
  canadianCompliance: true,
});

export default useErrorStore;