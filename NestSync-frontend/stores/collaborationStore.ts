/**
 * Collaboration Store - Zustand State Management
 * Manages family collaboration, caregiver presence, and real-time updates
 */

import { create } from 'zustand';
import { persist, devtools, createJSONStorage } from 'zustand/middleware';
import { useShallow } from 'zustand/shallow';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Family,
  FamilyMember,
  CaregiverInvitation,
  CaregiverPresence
} from '@/lib/graphql/queries';

// =============================================================================
// Types
// =============================================================================

interface CollaborationState {
  // Current collaboration context
  currentFamily: Family | null;
  currentFamilyId: string | null;

  // Family and member data
  myFamilies: Family[];
  familyMembers: FamilyMember[];
  familyMembersMap: Map<string, FamilyMember>; // userId -> FamilyMember

  // Invitations
  pendingInvitations: CaregiverInvitation[];

  // Real-time presence
  activeCaregivers: CaregiverPresence[];
  presenceMap: Map<string, CaregiverPresence>; // userId -> Presence

  // UI state
  isLoadingFamilies: boolean;
  isLoadingMembers: boolean;
  isLoadingPresence: boolean;
  lastPresenceUpdate: number;

  // Error handling
  error: string | null;
}

interface CollaborationActions {
  // Family management
  setCurrentFamily: (family: Family | null) => void;
  setCurrentFamilyId: (familyId: string | null) => void;
  setMyFamilies: (families: Family[]) => void;
  addFamily: (family: Family) => void;
  updateFamily: (familyId: string, updates: Partial<Family>) => void;

  // Member management
  setFamilyMembers: (members: FamilyMember[]) => void;
  addFamilyMember: (member: FamilyMember) => void;
  updateFamilyMember: (userId: string, updates: Partial<FamilyMember>) => void;
  removeFamilyMember: (userId: string) => void;

  // Invitation management
  setPendingInvitations: (invitations: CaregiverInvitation[]) => void;
  addInvitation: (invitation: CaregiverInvitation) => void;
  updateInvitation: (invitationId: string, updates: Partial<CaregiverInvitation>) => void;
  removeInvitation: (invitationId: string) => void;

  // Presence management
  setActiveCaregivers: (presence: CaregiverPresence[]) => void;
  updatePresence: (presence: CaregiverPresence) => void;
  removePresence: (userId: string) => void;
  setPresenceLoading: (loading: boolean) => void;

  // UI state management
  setLoading: (type: 'families' | 'members' | 'presence', loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  // Utility functions
  getMemberByUserId: (userId: string) => FamilyMember | undefined;
  getPresenceByUserId: (userId: string) => CaregiverPresence | undefined;
  isUserActiveCaregiverForChild: (userId: string, childId?: string) => boolean;
  getActiveCaregiverNames: () => string[];
  getCurrentUserRole: (currentUserId: string) => string | null;
  canCurrentUserInviteMembers: (currentUserId: string) => boolean;

  // Data synchronization
  syncFamilyData: () => Promise<void>;
  refreshPresence: () => Promise<void>;

  // Cleanup
  reset: () => void;
  clearFamily: () => void;
}

type CollaborationStore = CollaborationState & CollaborationActions;

// =============================================================================
// Initial State
// =============================================================================

const initialState: CollaborationState = {
  // Current collaboration context
  currentFamily: null,
  currentFamilyId: null,

  // Family and member data
  myFamilies: [],
  familyMembers: [],
  familyMembersMap: new Map(),

  // Invitations
  pendingInvitations: [],

  // Real-time presence
  activeCaregivers: [],
  presenceMap: new Map(),

  // UI state
  isLoadingFamilies: false,
  isLoadingMembers: false,
  isLoadingPresence: false,
  lastPresenceUpdate: 0,

  // Error handling
  error: null,
};

// =============================================================================
// Store Implementation
// =============================================================================

export const useCollaborationStore = create<CollaborationStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Family management
        setCurrentFamily: (family) => {
          set((state) => ({
            currentFamily: family,
            currentFamilyId: family?.id || null,
          }), false, 'setCurrentFamily');
        },

        setCurrentFamilyId: (familyId) => {
          set((state) => {
            const family = familyId ? state.myFamilies.find(f => f.id === familyId) : null;
            return {
              currentFamilyId: familyId,
              currentFamily: family || null,
            };
          }, false, 'setCurrentFamilyId');
        },

        setMyFamilies: (families) => {
          if (__DEV__) {
            console.log('🏪 CollaborationStore: setMyFamilies called with:', {
              familiesCount: families.length,
              families: families.map(f => ({ id: f.id, name: f.name, type: f.familyType })),
              timestamp: Date.now()
            });
          }

          set((state) => {
            // Auto-select first family if no current family is set
            const shouldAutoSelectFirst = !state.currentFamilyId && families.length > 0;
            const newCurrentFamilyId = shouldAutoSelectFirst ? families[0].id : state.currentFamilyId;
            const newCurrentFamily = newCurrentFamilyId
              ? families.find(f => f.id === newCurrentFamilyId) || state.currentFamily
              : state.currentFamily;

            if (__DEV__) {
              console.log('🏪 CollaborationStore: setMyFamilies state update:', {
                previousState: {
                  myFamiliesCount: state.myFamilies.length,
                  currentFamilyId: state.currentFamilyId,
                  currentFamilyName: state.currentFamily?.name
                },
                newState: {
                  myFamiliesCount: families.length,
                  currentFamilyId: newCurrentFamilyId,
                  currentFamilyName: newCurrentFamily?.name,
                  shouldAutoSelectFirst
                }
              });
            }

            return {
              myFamilies: families,
              currentFamilyId: newCurrentFamilyId,
              currentFamily: newCurrentFamily,
            };
          }, false, 'setMyFamilies');
        },

        addFamily: (family) => {
          set((state) => ({
            myFamilies: [...state.myFamilies, family],
          }), false, 'addFamily');
        },

        updateFamily: (familyId, updates) => {
          set((state) => ({
            myFamilies: state.myFamilies.map(family =>
              family.id === familyId ? { ...family, ...updates } : family
            ),
            // Update current family if it's the one being updated
            currentFamily: state.currentFamily?.id === familyId
              ? { ...state.currentFamily, ...updates }
              : state.currentFamily,
          }), false, 'updateFamily');
        },

        // Member management
        setFamilyMembers: (members) => {
          const membersMap = new Map(members.map(member => [member.userId, member]));
          set(() => ({
            familyMembers: members,
            familyMembersMap: membersMap,
          }), false, 'setFamilyMembers');
        },

        addFamilyMember: (member) => {
          set((state) => {
            const newMembers = [...state.familyMembers, member];
            const newMembersMap = new Map(state.familyMembersMap);
            newMembersMap.set(member.userId, member);

            return {
              familyMembers: newMembers,
              familyMembersMap: newMembersMap,
            };
          }, false, 'addFamilyMember');
        },

        updateFamilyMember: (userId, updates) => {
          set((state) => {
            const newMembers = state.familyMembers.map(member =>
              member.userId === userId ? { ...member, ...updates } : member
            );
            const newMembersMap = new Map(state.familyMembersMap);
            const existingMember = newMembersMap.get(userId);
            if (existingMember) {
              newMembersMap.set(userId, { ...existingMember, ...updates });
            }

            return {
              familyMembers: newMembers,
              familyMembersMap: newMembersMap,
            };
          }, false, 'updateFamilyMember');
        },

        removeFamilyMember: (userId) => {
          set((state) => {
            const newMembers = state.familyMembers.filter(member => member.userId !== userId);
            const newMembersMap = new Map(state.familyMembersMap);
            newMembersMap.delete(userId);

            return {
              familyMembers: newMembers,
              familyMembersMap: newMembersMap,
            };
          }, false, 'removeFamilyMember');
        },

        // Invitation management
        setPendingInvitations: (invitations) => {
          set(() => ({
            pendingInvitations: invitations,
          }), false, 'setPendingInvitations');
        },

        addInvitation: (invitation) => {
          set((state) => ({
            pendingInvitations: [...state.pendingInvitations, invitation],
          }), false, 'addInvitation');
        },

        updateInvitation: (invitationId, updates) => {
          set((state) => ({
            pendingInvitations: state.pendingInvitations.map(invitation =>
              invitation.id === invitationId ? { ...invitation, ...updates } : invitation
            ),
          }), false, 'updateInvitation');
        },

        removeInvitation: (invitationId) => {
          set((state) => ({
            pendingInvitations: state.pendingInvitations.filter(inv => inv.id !== invitationId),
          }), false, 'removeInvitation');
        },

        // Presence management
        setActiveCaregivers: (presence) => {
          const presenceMap = new Map(presence.map(p => [p.userId, p]));
          set(() => ({
            activeCaregivers: presence,
            presenceMap,
            lastPresenceUpdate: Date.now(),
          }), false, 'setActiveCaregivers');
        },

        updatePresence: (presence) => {
          set((state) => {
            const newActiveCaregivers = state.activeCaregivers.map(p =>
              p.userId === presence.userId ? presence : p
            );

            // Add presence if it doesn't exist
            if (!state.presenceMap.has(presence.userId)) {
              newActiveCaregivers.push(presence);
            }

            const newPresenceMap = new Map(state.presenceMap);
            newPresenceMap.set(presence.userId, presence);

            return {
              activeCaregivers: newActiveCaregivers,
              presenceMap: newPresenceMap,
              lastPresenceUpdate: Date.now(),
            };
          }, false, 'updatePresence');
        },

        removePresence: (userId) => {
          set((state) => {
            const newActiveCaregivers = state.activeCaregivers.filter(p => p.userId !== userId);
            const newPresenceMap = new Map(state.presenceMap);
            newPresenceMap.delete(userId);

            return {
              activeCaregivers: newActiveCaregivers,
              presenceMap: newPresenceMap,
              lastPresenceUpdate: Date.now(),
            };
          }, false, 'removePresence');
        },

        setPresenceLoading: (loading) => {
          set(() => ({
            isLoadingPresence: loading,
          }), false, 'setPresenceLoading');
        },

        // UI state management
        setLoading: (type, loading) => {
          set((state) => {
            switch (type) {
              case 'families':
                return { isLoadingFamilies: loading };
              case 'members':
                return { isLoadingMembers: loading };
              case 'presence':
                return { isLoadingPresence: loading };
              default:
                return state;
            }
          }, false, `setLoading_${type}`);
        },

        setError: (error) => {
          set(() => ({ error }), false, 'setError');
        },

        clearError: () => {
          set(() => ({ error: null }), false, 'clearError');
        },

        // Utility functions
        getMemberByUserId: (userId) => {
          return get().familyMembersMap.get(userId);
        },

        getPresenceByUserId: (userId) => {
          return get().presenceMap.get(userId);
        },

        isUserActiveCaregiverForChild: (userId, childId) => {
          const presence = get().presenceMap.get(userId);
          if (!presence) return false;

          return presence.status === 'CARING' &&
                 (childId ? presence.childId === childId : true);
        },

        getActiveCaregiverNames: () => {
          const { activeCaregivers } = get();
          return activeCaregivers
            .filter(p => p.status === 'CARING' || p.status === 'ONLINE')
            .map(p => p.userDisplayName || 'Unknown Caregiver')
            .filter(Boolean);
        },

        getCurrentUserRole: (currentUserId) => {
          const member = get().getMemberByUserId(currentUserId);
          return member?.role || null;
        },

        canCurrentUserInviteMembers: (currentUserId) => {
          const member = get().getMemberByUserId(currentUserId);
          return member?.permissions.canInviteMembers || false;
        },

        // Data synchronization (to be implemented with GraphQL hooks)
        syncFamilyData: async () => {
          // This will be implemented with GraphQL queries
          console.log('syncFamilyData - to be implemented with GraphQL hooks');
        },

        refreshPresence: async () => {
          // This will be implemented with GraphQL queries
          console.log('refreshPresence - to be implemented with GraphQL hooks');
        },

        // Cleanup
        reset: () => {
          set(() => initialState, false, 'reset');
        },

        clearFamily: () => {
          set(() => ({
            currentFamily: null,
            currentFamilyId: null,
            familyMembers: [],
            familyMembersMap: new Map(),
            activeCaregivers: [],
            presenceMap: new Map(),
          }), false, 'clearFamily');
        },
      }),
      {
        name: 'nestsync-collaboration-store',
        storage: createJSONStorage(() => AsyncStorage),
        partialize: (state) => ({
          // Only persist essential data, not UI state
          currentFamilyId: state.currentFamilyId,
          myFamilies: state.myFamilies,
          familyMembers: state.familyMembers,
          // Don't persist presence data as it needs to be fresh
        }),
        version: 1,
      }
    ),
    {
      name: 'collaboration-store',
    }
  )
);

// =============================================================================
// Utility Hooks and Selectors
// =============================================================================

// Hook to get current family with members
export const useCurrentFamilyWithMembers = () => {
  return useCollaborationStore(
    useShallow((state) => ({
      family: state.currentFamily,
      members: state.familyMembers,
      isLoading: state.isLoadingMembers,
    }))
  );
};

// Hook to get active caregivers with real-time status
export const useActiveCaregivers = () => {
  return useCollaborationStore(
    useShallow((state) => ({
      caregivers: state.activeCaregivers,
      isLoading: state.isLoadingPresence,
      lastUpdate: state.lastPresenceUpdate,
      // Return the raw data and let components calculate derived values to ensure stability
    }))
  );
};

// Hook to check if user can perform specific actions
export const useCollaborationPermissions = (currentUserId: string) => {
  return useCollaborationStore(
    useShallow((state) => {
      const member = state.getMemberByUserId(currentUserId);
      return {
        canInviteMembers: member?.permissions.canInviteMembers || false,
        canManageSettings: member?.permissions.canManageSettings || false,
        canViewAllData: member?.permissions.canViewAllData || false,
        canEditChildProfiles: member?.permissions.canEditChildProfiles || false,
        role: member?.role || null,
      };
    })
  );
};

// Hook to get pending invitations count
export const usePendingInvitationsCount = () => {
  return useCollaborationStore((state) => state.pendingInvitations.length);
};

export default useCollaborationStore;