/**
 * Real-time Collaboration Updates
 * Provides real-time synchronization for collaboration features using polling
 */

import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useQuery } from '@apollo/client';

import {
  FAMILY_PRESENCE_QUERY,
  FAMILY_MEMBERS_QUERY,
  PENDING_INVITATIONS_QUERY,
  FamilyPresenceQueryData,
  FamilyPresenceQueryVariables,
  FamilyMembersQueryData,
  FamilyMembersQueryVariables,
  PendingInvitationsQueryData,
} from './queries';
import { useCollaborationStore } from '@/stores/collaborationStore';

// =============================================================================
// Configuration
// =============================================================================

const REALTIME_CONFIG = {
  // Polling intervals (in milliseconds)
  PRESENCE_POLL_INTERVAL: 15000,     // 15 seconds for presence
  MEMBERS_POLL_INTERVAL: 60000,      // 1 minute for members
  INVITATIONS_POLL_INTERVAL: 30000,  // 30 seconds for invitations

  // Background/foreground intervals
  BACKGROUND_MULTIPLIER: 4,           // 4x slower when in background
  FOREGROUND_MULTIPLIER: 1,           // Normal speed when in foreground

  // Maximum retries for failed polls
  MAX_RETRIES: 3,
};

// =============================================================================
// Real-time Presence Hook
// =============================================================================

export function useRealTimePresence(familyId: string | null) {
  const appState = useRef(AppState.currentState);
  const { setActiveCaregivers, setPresenceLoading, setError } = useCollaborationStore();

  // Calculate dynamic poll interval based on app state
  const getPollInterval = useCallback(() => {
    const baseInterval = REALTIME_CONFIG.PRESENCE_POLL_INTERVAL;
    const multiplier = appState.current === 'active'
      ? REALTIME_CONFIG.FOREGROUND_MULTIPLIER
      : REALTIME_CONFIG.BACKGROUND_MULTIPLIER;

    return baseInterval * multiplier;
  }, []);

  // Query for family presence with dynamic polling
  const { data, loading, error, startPolling, stopPolling } = useQuery<
    FamilyPresenceQueryData,
    FamilyPresenceQueryVariables
  >(
    FAMILY_PRESENCE_QUERY,
    {
      variables: { familyId: familyId! },
      skip: !familyId,
      errorPolicy: 'all',
      fetchPolicy: 'cache-and-network',
      pollInterval: getPollInterval(),
      notifyOnNetworkStatusChange: true,
    }
  );

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appState.current !== nextAppState) {
        appState.current = nextAppState;

        if (familyId) {
          if (nextAppState === 'active') {
            // App came to foreground - increase polling frequency
            startPolling(REALTIME_CONFIG.PRESENCE_POLL_INTERVAL);
          } else {
            // App went to background - decrease polling frequency
            startPolling(REALTIME_CONFIG.PRESENCE_POLL_INTERVAL * REALTIME_CONFIG.BACKGROUND_MULTIPLIER);
          }
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
      stopPolling();
    };
  }, [familyId, startPolling, stopPolling]);

  // Sync data with store
  useEffect(() => {
    setPresenceLoading(loading);

    if (error) {
      setError(error.message);
    } else {
      setError(null);
    }

    if (data?.familyPresence) {
      setActiveCaregivers(data.familyPresence);
    }
  }, [data, loading, error, setActiveCaregivers, setPresenceLoading, setError]);

  return {
    presence: data?.familyPresence || [],
    loading,
    error,
    startPolling,
    stopPolling,
  };
}

// =============================================================================
// Real-time Family Members Hook
// =============================================================================

export function useRealTimeFamilyMembers(familyId: string | null) {
  const appState = useRef(AppState.currentState);
  const { setFamilyMembers, setLoading, setError } = useCollaborationStore();

  // Calculate dynamic poll interval
  const getPollInterval = useCallback(() => {
    const baseInterval = REALTIME_CONFIG.MEMBERS_POLL_INTERVAL;
    const multiplier = appState.current === 'active'
      ? REALTIME_CONFIG.FOREGROUND_MULTIPLIER
      : REALTIME_CONFIG.BACKGROUND_MULTIPLIER;

    return baseInterval * multiplier;
  }, []);

  // Query for family members with dynamic polling
  const { data, loading, error, startPolling, stopPolling } = useQuery<
    FamilyMembersQueryData,
    FamilyMembersQueryVariables
  >(
    FAMILY_MEMBERS_QUERY,
    {
      variables: { familyId: familyId! },
      skip: !familyId,
      errorPolicy: 'all',
      fetchPolicy: 'cache-and-network',
      pollInterval: getPollInterval(),
      notifyOnNetworkStatusChange: true,
    }
  );

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appState.current !== nextAppState) {
        appState.current = nextAppState;

        if (familyId) {
          if (nextAppState === 'active') {
            startPolling(REALTIME_CONFIG.MEMBERS_POLL_INTERVAL);
          } else {
            startPolling(REALTIME_CONFIG.MEMBERS_POLL_INTERVAL * REALTIME_CONFIG.BACKGROUND_MULTIPLIER);
          }
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
      stopPolling();
    };
  }, [familyId, startPolling, stopPolling]);

  // Sync data with store
  useEffect(() => {
    setLoading('members', loading);

    if (error) {
      setError(error.message);
    } else {
      setError(null);
    }

    if (data?.familyMembers) {
      setFamilyMembers(data.familyMembers.nodes);
    }
  }, [data, loading, error, setFamilyMembers, setLoading, setError]);

  return {
    members: data?.familyMembers.nodes || [],
    loading,
    error,
    startPolling,
    stopPolling,
  };
}

// =============================================================================
// Real-time Invitations Hook
// =============================================================================

export function useRealTimeInvitations() {
  const appState = useRef(AppState.currentState);
  const { setPendingInvitations, setError } = useCollaborationStore();

  // Calculate dynamic poll interval
  const getPollInterval = useCallback(() => {
    const baseInterval = REALTIME_CONFIG.INVITATIONS_POLL_INTERVAL;
    const multiplier = appState.current === 'active'
      ? REALTIME_CONFIG.FOREGROUND_MULTIPLIER
      : REALTIME_CONFIG.BACKGROUND_MULTIPLIER;

    return baseInterval * multiplier;
  }, []);

  // Query for pending invitations with dynamic polling
  const { data, loading, error, startPolling, stopPolling } = useQuery<PendingInvitationsQueryData>(
    PENDING_INVITATIONS_QUERY,
    {
      errorPolicy: 'all',
      fetchPolicy: 'cache-and-network',
      pollInterval: getPollInterval(),
      notifyOnNetworkStatusChange: true,
    }
  );

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appState.current !== nextAppState) {
        appState.current = nextAppState;

        if (nextAppState === 'active') {
          startPolling(REALTIME_CONFIG.INVITATIONS_POLL_INTERVAL);
        } else {
          startPolling(REALTIME_CONFIG.INVITATIONS_POLL_INTERVAL * REALTIME_CONFIG.BACKGROUND_MULTIPLIER);
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
      stopPolling();
    };
  }, [startPolling, stopPolling]);

  // Sync data with store
  useEffect(() => {
    if (error) {
      setError(error.message);
    } else {
      setError(null);
    }

    if (data?.pendingInvitations) {
      setPendingInvitations(data.pendingInvitations.nodes);
    }
  }, [data, error, setPendingInvitations, setError]);

  return {
    invitations: data?.pendingInvitations.nodes || [],
    loading,
    error,
    startPolling,
    stopPolling,
  };
}

// =============================================================================
// Master Real-time Collaboration Hook
// =============================================================================

export function useRealTimeCollaboration(familyId: string | null) {
  // Start all real-time subscriptions
  const presence = useRealTimePresence(familyId);
  const members = useRealTimeFamilyMembers(familyId);
  const invitations = useRealTimeInvitations();

  // Master controls
  const startAllPolling = useCallback(() => {
    presence.startPolling(REALTIME_CONFIG.PRESENCE_POLL_INTERVAL);
    members.startPolling(REALTIME_CONFIG.MEMBERS_POLL_INTERVAL);
    invitations.startPolling(REALTIME_CONFIG.INVITATIONS_POLL_INTERVAL);
  }, [presence.startPolling, members.startPolling, invitations.startPolling]);

  const stopAllPolling = useCallback(() => {
    presence.stopPolling();
    members.stopPolling();
    invitations.stopPolling();
  }, [presence.stopPolling, members.stopPolling, invitations.stopPolling]);

  const isLoading = presence.loading || members.loading || invitations.loading;
  const hasError = presence.error || members.error || invitations.error;

  return {
    // Data
    presence: presence.presence,
    members: members.members,
    invitations: invitations.invitations,

    // States
    loading: isLoading,
    error: hasError,

    // Controls
    startPolling: startAllPolling,
    stopPolling: stopAllPolling,

    // Individual controls for fine-grained management
    presenceControls: {
      startPolling: presence.startPolling,
      stopPolling: presence.stopPolling,
    },
    membersControls: {
      startPolling: members.startPolling,
      stopPolling: members.stopPolling,
    },
    invitationsControls: {
      startPolling: invitations.startPolling,
      stopPolling: invitations.stopPolling,
    },
  };
}

// =============================================================================
// Activity Real-time Updates Hook
// =============================================================================

export function useRealTimeActivityUpdates(childId: string | null) {
  const { setError } = useCollaborationStore();

  // This would be implemented when activity feeds include collaboration context
  // For now, existing usage log polling in the dashboard provides activity updates

  return {
    // Placeholder for future activity subscription implementation
    newActivities: [],
    conflicts: [],
    loading: false,
    error: null,
  };
}

export default {
  useRealTimePresence,
  useRealTimeFamilyMembers,
  useRealTimeInvitations,
  useRealTimeCollaboration,
  useRealTimeActivityUpdates,
};