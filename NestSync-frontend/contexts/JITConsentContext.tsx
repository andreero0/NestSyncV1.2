/**
 * Just-in-Time Consent Context Provider
 * PIPEDA-compliant contextual consent management for NestSync
 * Replaces vulnerable upfront consent with purpose-driven consent requests
 */

import React, { createContext, useContext, useState, useRef, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ConsentType } from '../lib/types/auth';
import { useAuthStore } from '../stores/authStore';

export interface ConsentRequest {
  consentType: ConsentType;
  purpose: string;
  dataCategories: string[];
  feature: string; // Feature name for logging
}

interface JITConsentState {
  isVisible: boolean;
  consentType: ConsentType | null;
  purpose: string;
  dataCategories: string[];
  onGrant: (() => void) | null;
  onDecline: (() => void) | null;
}

interface JITConsentActions {
  requestConsent: (config: ConsentRequest) => Promise<boolean>;
  dismissConsent: () => void;
  hasConsent: (consentType: ConsentType) => boolean;
}

interface JITConsentContextType extends JITConsentState, JITConsentActions {}

const JITConsentContext = createContext<JITConsentContextType | undefined>(undefined);

const CONSENT_CACHE_KEY = '@NestSync:jit-consent-cache';
const CONSENT_VERSION = '1.0.0';

interface JITConsentProviderProps {
  children: ReactNode;
}

interface ConsentCache {
  [key: string]: {
    granted: boolean;
    timestamp: number;
    version: string;
  };
}

export function JITConsentProvider({ children }: JITConsentProviderProps) {
  const [state, setState] = useState<JITConsentState>({
    isVisible: false,
    consentType: null,
    purpose: '',
    dataCategories: [],
    onGrant: null,
    onDecline: null,
  });

  // Cache for granted consents to avoid repeated prompts
  const consentCacheRef = useRef<ConsentCache>({});
  
  // Promise resolver for consent requests
  const resolverRef = useRef<((granted: boolean) => void) | null>(null);

  // Load consent cache on initialization
  React.useEffect(() => {
    loadConsentCache();
  }, []);

  const loadConsentCache = async () => {
    try {
      const cached = await AsyncStorage.getItem(CONSENT_CACHE_KEY);
      if (cached) {
        const parsedCache: ConsentCache = JSON.parse(cached);
        // Filter out expired consents (older than 30 days for optional consents)
        const now = Date.now();
        const validCache: ConsentCache = {};
        
        Object.entries(parsedCache).forEach(([key, consent]) => {
          const isExpired = now - consent.timestamp > 30 * 24 * 60 * 60 * 1000; // 30 days
          const isOutdated = consent.version !== CONSENT_VERSION;
          
          if (!isExpired && !isOutdated) {
            validCache[key] = consent;
          }
        });
        
        consentCacheRef.current = validCache;
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Error loading consent cache:', error);
      }
      consentCacheRef.current = {};
    }
  };

  const saveConsentCache = async (cache: ConsentCache) => {
    try {
      await AsyncStorage.setItem(CONSENT_CACHE_KEY, JSON.stringify(cache));
      consentCacheRef.current = cache;
    } catch (error) {
      if (__DEV__) {
        console.error('Error saving consent cache:', error);
      }
    }
  };

  const hasConsent = (consentType: ConsentType): boolean => {
    // Required consents (Privacy Policy, Terms of Service) are always granted after signup
    if (consentType === ConsentType.PRIVACY_POLICY || consentType === ConsentType.TERMS_OF_SERVICE) {
      return true;
    }

    // Check cache for optional consents
    const cached = consentCacheRef.current[consentType];
    return cached?.granted === true;
  };

  const requestConsent = async (config: ConsentRequest): Promise<boolean> => {
    const { consentType, purpose, dataCategories, feature } = config;

    // Check if we already have this consent
    if (hasConsent(consentType)) {
      if (__DEV__) {
        console.log(`JIT Consent: ${consentType} already granted for ${feature}`);
      }
      return true;
    }

    // Required consents should never be requested via JIT (they're handled at signup)
    if (consentType === ConsentType.PRIVACY_POLICY || consentType === ConsentType.TERMS_OF_SERVICE) {
      if (__DEV__) {
        console.warn(`JIT Consent: Attempted to request required consent ${consentType} - this should be handled at signup`);
      }
      return true;
    }

    if (__DEV__) {
      console.log(`JIT Consent: Requesting ${consentType} for ${feature} - Purpose: ${purpose}`);
    }

    return new Promise((resolve) => {
      resolverRef.current = resolve;

      const handleGrant = async () => {
        try {
          // Submit consent to backend via AuthStore
          const authStore = useAuthStore.getState();
          const response = await authStore.updateConsent({
            consentType,
            granted: true,
            consentVersion: CONSENT_VERSION,
          });

          if (response.success) {
            // Cache the consent
            const newCache = {
              ...consentCacheRef.current,
              [consentType]: {
                granted: true,
                timestamp: Date.now(),
                version: CONSENT_VERSION,
              },
            };
            await saveConsentCache(newCache);

            if (__DEV__) {
              console.log(`JIT Consent: ${consentType} granted and cached for ${feature}`);
            }
            setState(prev => ({ ...prev, isVisible: false, consentType: null, purpose: '', dataCategories: [], onGrant: null, onDecline: null }));
            resolve(true);
          } else {
            // Critical consent error - should be logged in production
            console.error(`JIT Consent: Failed to save ${consentType}:`, response.error);
            setState(prev => ({ ...prev, isVisible: false, consentType: null, purpose: '', dataCategories: [], onGrant: null, onDecline: null }));
            resolve(false);
          }
        } catch (error) {
          // Critical consent error - should be logged in production
          console.error(`JIT Consent: Error granting ${consentType}:`, error);
          setState(prev => ({ ...prev, isVisible: false, consentType: null, purpose: '', dataCategories: [], onGrant: null, onDecline: null }));
          resolve(false);
        }
      };

      const handleDecline = async () => {
        try {
          // Submit declined consent to backend
          const authStore = useAuthStore.getState();
          const response = await authStore.updateConsent({
            consentType,
            granted: false,
            consentVersion: CONSENT_VERSION,
          });

          if (response.success) {
            // Cache the declined consent (so we don't ask again soon)
            const newCache = {
              ...consentCacheRef.current,
              [consentType]: {
                granted: false,
                timestamp: Date.now(),
                version: CONSENT_VERSION,
              },
            };
            await saveConsentCache(newCache);

            if (__DEV__) {
              console.log(`JIT Consent: ${consentType} declined and cached for ${feature}`);
            }
          }
        } catch (error) {
          // Critical consent error - should be logged in production
          console.error(`JIT Consent: Error declining ${consentType}:`, error);
        }

        setState(prev => ({ ...prev, isVisible: false, consentType: null, purpose: '', dataCategories: [], onGrant: null, onDecline: null }));
        resolve(false);
      };

      // Show the consent modal
      setState({
        isVisible: true,
        consentType,
        purpose,
        dataCategories,
        onGrant: handleGrant,
        onDecline: handleDecline,
      });
    });
  };

  const dismissConsent = () => {
    setState({
      isVisible: false,
      consentType: null,
      purpose: '',
      dataCategories: [],
      onGrant: null,
      onDecline: null,
    });
    
    // Resolve with false if dismissed
    if (resolverRef.current) {
      resolverRef.current(false);
      resolverRef.current = null;
    }
  };

  const contextValue: JITConsentContextType = {
    ...state,
    requestConsent,
    dismissConsent,
    hasConsent,
  };

  return (
    <JITConsentContext.Provider value={contextValue}>
      {children}
    </JITConsentContext.Provider>
  );
}

// Custom hook to use JIT consent context
export function useJITConsent() {
  const context = useContext(JITConsentContext);
  if (!context) {
    throw new Error('useJITConsent must be used within a JITConsentProvider');
  }
  return context;
}

// Convenience hook for requesting consent
export function useRequireConsent() {
  const { requestConsent, hasConsent } = useJITConsent();
  
  const requireConsent = async (config: ConsentRequest): Promise<boolean> => {
    return await requestConsent(config);
  };

  return {
    requireConsent,
    hasConsent,
  };
}