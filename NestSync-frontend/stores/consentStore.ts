/**
 * Consent Store
 * PIPEDA-compliant consent management for NestSync
 * Handles granular consent preferences and state persistence
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from './authStore';
import { ConsentType } from '../lib/types/auth';

export interface ConsentState {
  // Required consents (always true)
  required_child_data: boolean;
  required_account: boolean;
  
  // Optional consents (user choice)
  optional_analytics: boolean;
  optional_marketing: boolean;
  optional_recommendations: boolean;
  
  // Consent flow state
  hasSeenConsentFlow: boolean;
  hasCompletedConsentFlow: boolean;
  currentConsentScreen: 0 | 1 | 2 | 3; // 0=not started, 1=intro, 2=permissions, 3=confirmation
  
  // Compliance tracking
  consentVersion: string;
  consentTimestamp: Date | null;
  
  // UI state
  isLoading: boolean;
  error: string | null;
}

interface ConsentActions {
  // Navigation
  setCurrentScreen: (screen: 0 | 1 | 2 | 3) => void;
  goToNextScreen: () => void;
  goToPreviousScreen: () => void;
  
  // Consent management
  updateOptionalConsent: (consentType: 'analytics' | 'marketing' | 'recommendations', value: boolean) => void;
  resetConsents: () => void;
  
  // Flow completion
  completeConsentFlow: () => Promise<boolean>;
  
  // Utility
  canProceed: () => boolean;
  getConsentSummary: () => {
    required: Array<{type: string; granted: boolean}>;
    optional: Array<{type: string; granted: boolean}>;
  };
}

type ConsentStore = ConsentState & ConsentActions;

const initialState: ConsentState = {
  // Required consents are always true
  required_child_data: true,
  required_account: true,
  
  // Optional consents default to false (user must explicitly opt-in)
  optional_analytics: false,
  optional_marketing: false,
  optional_recommendations: false,
  
  // Flow state
  hasSeenConsentFlow: false,
  hasCompletedConsentFlow: false,
  currentConsentScreen: 0,
  
  // Compliance
  consentVersion: '1.0.0',
  consentTimestamp: null,
  
  // UI state
  isLoading: false,
  error: null,
};

export const useConsentStore = create<ConsentStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // Navigation actions
      setCurrentScreen: (screen: 0 | 1 | 2 | 3) => {
        set({ currentConsentScreen: screen, error: null });
      },
      
      goToNextScreen: () => {
        const current = get().currentConsentScreen;
        if (current < 3) {
          set({ currentConsentScreen: (current + 1) as 1 | 2 | 3 });
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      },
      
      goToPreviousScreen: () => {
        const current = get().currentConsentScreen;
        if (current > 1) {
          set({ currentConsentScreen: (current - 1) as 1 | 2 | 3 });
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      },
      
      // Consent management
      updateOptionalConsent: (consentType: 'analytics' | 'marketing' | 'recommendations', value: boolean) => {
        const key = `optional_${consentType}` as keyof ConsentState;
        set({ [key]: value, error: null });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        console.log(`Consent updated: ${consentType} = ${value}`);
      },
      
      resetConsents: () => {
        set({
          ...initialState,
          hasSeenConsentFlow: false,
          hasCompletedConsentFlow: false,
          currentConsentScreen: 0,
        });
        console.log('Consent preferences reset to defaults');
      },
      
      // Flow completion
      completeConsentFlow: async () => {
        const state = get();
        
        // Validate required consents
        if (!state.canProceed()) {
          set({ error: 'Required consents must be accepted to continue' });
          return false;
        }
        
        set({ isLoading: true, error: null });
        
        try {
          const authStore = useAuthStore.getState();
          
          // Submit individual consent preferences to backend
          const consentUpdates = [
            // Marketing consent (optional)
            {
              consentType: ConsentType.MARKETING,
              granted: state.optional_marketing,
              consentVersion: state.consentVersion,
            },
            // Analytics consent (optional)
            {
              consentType: ConsentType.ANALYTICS,
              granted: state.optional_analytics,
              consentVersion: state.consentVersion,
            },
            // Data sharing consent for recommendations (optional)
            {
              consentType: ConsentType.DATA_SHARING,
              granted: state.optional_recommendations,
              consentVersion: state.consentVersion,
            },
          ];
          
          // Submit all consent updates
          for (const consentUpdate of consentUpdates) {
            const response = await authStore.updateConsent(consentUpdate);
            if (!response.success) {
              set({ 
                error: response.error || `Failed to save ${consentUpdate.consentType.toLowerCase()} consent`,
                isLoading: false 
              });
              return false;
            }
          }
          
          // All consents successfully saved
          set({
            hasSeenConsentFlow: true,
            hasCompletedConsentFlow: true,
            consentTimestamp: new Date(),
            currentConsentScreen: 3,
            isLoading: false,
          });
          
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          console.log('Consent flow completed successfully');
          return true;
          
        } catch (error) {
          console.error('Error completing consent flow:', error);
          set({ 
            error: 'Network error. Please check your connection and try again.',
            isLoading: false 
          });
          return false;
        }
      },
      
      // Utility functions
      canProceed: () => {
        const state = get();
        // All required consents must be true (they always are by design)
        return state.required_child_data && state.required_account;
      },
      
      getConsentSummary: () => {
        const state = get();
        return {
          required: [
            { type: 'Child & Diaper Data', granted: state.required_child_data },
            { type: 'Basic Account Info', granted: state.required_account },
          ],
          optional: [
            { type: 'Anonymous Analytics', granted: state.optional_analytics },
            { type: 'Marketing Communications', granted: state.optional_marketing },
            { type: 'Product Recommendations', granted: state.optional_recommendations },
          ],
        };
      },
    }),
    {
      name: 'nestsync-consent-store',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      // Only persist consent preferences, not transient UI state
      partialize: (state) => ({
        required_child_data: state.required_child_data,
        required_account: state.required_account,
        optional_analytics: state.optional_analytics,
        optional_marketing: state.optional_marketing,
        optional_recommendations: state.optional_recommendations,
        hasSeenConsentFlow: state.hasSeenConsentFlow,
        hasCompletedConsentFlow: state.hasCompletedConsentFlow,
        consentVersion: state.consentVersion,
        consentTimestamp: state.consentTimestamp,
      }),
      onRehydrateStorage: () => (state) => {
        console.log('Consent store rehydrated:', state?.hasCompletedConsentFlow ? 'completed' : 'pending');
      },
    }
  )
);

// Convenience hooks for specific consent types
export const useAnalyticsConsent = () => {
  const store = useConsentStore();
  return [store.optional_analytics, (value: boolean) => store.updateOptionalConsent('analytics', value)] as const;
};

export const useMarketingConsent = () => {
  const store = useConsentStore();
  return [store.optional_marketing, (value: boolean) => store.updateOptionalConsent('marketing', value)] as const;
};

export const useRecommendationsConsent = () => {
  const store = useConsentStore();
  return [store.optional_recommendations, (value: boolean) => store.updateOptionalConsent('recommendations', value)] as const;
};

// Consent flow navigation hook
export const useConsentNavigation = () => {
  const store = useConsentStore();
  return {
    currentScreen: store.currentConsentScreen,
    setCurrentScreen: store.setCurrentScreen,
    goToNextScreen: store.goToNextScreen,
    goToPreviousScreen: store.goToPreviousScreen,
    canProceed: store.canProceed(),
    isLoading: store.isLoading,
    error: store.error,
  };
};