/**
 * GraphQL Hooks for Collaboration Features
 * Apollo Client hooks for family management, caregiver invitations, and real-time collaboration
 */

import { useQuery, useMutation, useSubscription } from '@apollo/client';
import { useEffect } from 'react';
import { useRealTimeCollaboration } from './collaboration-realtime';
import {
  MY_FAMILIES_QUERY,
  FAMILY_DETAILS_QUERY,
  FAMILY_MEMBERS_QUERY,
  PENDING_INVITATIONS_QUERY,
  FAMILY_PRESENCE_QUERY,
  CREATE_FAMILY_MUTATION,
  INVITE_CAREGIVER_MUTATION,
  ACCEPT_INVITATION_MUTATION,
  UPDATE_PRESENCE_MUTATION,
  ADD_CHILD_TO_FAMILY_MUTATION,
  // Type imports
  MyFamiliesQueryData,
  FamilyDetailsQueryData,
  FamilyDetailsQueryVariables,
  FamilyMembersQueryData,
  FamilyMembersQueryVariables,
  PendingInvitationsQueryData,
  FamilyPresenceQueryData,
  FamilyPresenceQueryVariables,
  CreateFamilyMutationData,
  CreateFamilyMutationVariables,
  InviteCaregiverMutationData,
  InviteCaregiverMutationVariables,
  AcceptInvitationMutationData,
  AcceptInvitationMutationVariables,
  UpdatePresenceMutationData,
  UpdatePresenceMutationVariables,
  AddChildToFamilyMutationData,
  AddChildToFamilyMutationVariables,
} from './queries';
import { useCollaborationStore } from '@/stores/collaborationStore';

// =============================================================================
// Query Hooks
// =============================================================================

/**
 * Hook to fetch user's families and sync with store
 */
export const useMyFamilies = () => {
  const { setMyFamilies, setLoading, setError } = useCollaborationStore();

  const { data, loading, error, refetch } = useQuery<MyFamiliesQueryData>(
    MY_FAMILIES_QUERY,
    {
      errorPolicy: 'all',
      fetchPolicy: 'cache-and-network',
    }
  );

  // Sync data with store with enhanced debugging
  useEffect(() => {
    if (__DEV__) {
      console.log('🔍 useMyFamilies: GraphQL query state change:', {
        loading,
        hasError: !!error,
        errorMessage: error?.message,
        dataReceived: !!data,
        familiesCount: data?.myFamilies?.nodes?.length || 0,
        totalCount: data?.myFamilies?.totalCount || 0,
        queryTimestamp: Date.now()
      });

      if (error) {
        console.error('🚨 useMyFamilies: GraphQL error details:', {
          message: error.message,
          graphQLErrors: error.graphQLErrors?.map(e => ({
            message: e.message,
            locations: e.locations,
            path: e.path
          })),
          networkError: error.networkError?.message,
          extraInfo: error.extraInfo
        });
      }

      if (data?.myFamilies) {
        console.log('✅ useMyFamilies: Successfully received family data:', {
          families: data.myFamilies.nodes.map(f => ({
            id: f.id,
            name: f.name,
            type: f.familyType,
            memberCount: f.memberCount
          })),
          syncingToStore: true
        });
      }
    }

    setLoading('families', loading);

    if (error) {
      setError(error.message);
    } else {
      setError(null);
    }

    if (data?.myFamilies) {
      if (__DEV__) {
        console.log('📝 useMyFamilies: Calling setMyFamilies with', data.myFamilies.nodes.length, 'families');
      }
      setMyFamilies(data.myFamilies.nodes);
    }
  }, [data, loading, error, setMyFamilies, setLoading, setError]);

  return {
    families: data?.myFamilies.nodes || [],
    totalCount: data?.myFamilies.totalCount || 0,
    loading,
    error,
    refetch,
  };
};

/**
 * Hook to fetch specific family details
 */
export const useFamilyDetails = (familyId: string | null) => {
  const { updateFamily, setError } = useCollaborationStore();

  const { data, loading, error, refetch } = useQuery<
    FamilyDetailsQueryData,
    FamilyDetailsQueryVariables
  >(
    FAMILY_DETAILS_QUERY,
    {
      variables: { familyId: familyId! },
      skip: !familyId,
      errorPolicy: 'all',
      fetchPolicy: 'cache-and-network',
    }
  );

  // Sync data with store
  useEffect(() => {
    if (error) {
      setError(error.message);
    } else {
      setError(null);
    }

    if (data?.familyDetails && familyId) {
      updateFamily(familyId, data.familyDetails);
    }
  }, [data, error, familyId, updateFamily, setError]);

  return {
    family: data?.familyDetails || null,
    loading,
    error,
    refetch,
  };
};

/**
 * Hook to fetch family members and sync with store
 */
export const useFamilyMembers = (familyId: string | null) => {
  const { setFamilyMembers, setLoading, setError } = useCollaborationStore();

  const { data, loading, error, refetch } = useQuery<
    FamilyMembersQueryData,
    FamilyMembersQueryVariables
  >(
    FAMILY_MEMBERS_QUERY,
    {
      variables: { familyId: familyId! },
      skip: !familyId,
      errorPolicy: 'all',
      fetchPolicy: 'cache-and-network',
    }
  );

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
    totalCount: data?.familyMembers.totalCount || 0,
    loading,
    error,
    refetch,
  };
};

/**
 * Hook to fetch pending invitations
 */
export const usePendingInvitations = () => {
  const { setPendingInvitations, setError } = useCollaborationStore();

  const { data, loading, error, refetch } = useQuery<PendingInvitationsQueryData>(
    PENDING_INVITATIONS_QUERY,
    {
      errorPolicy: 'all',
      fetchPolicy: 'cache-and-network',
    }
  );

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
    totalCount: data?.pendingInvitations.totalCount || 0,
    loading,
    error,
    refetch,
  };
};

/**
 * Hook to fetch family presence (real-time caregiver status)
 */
export const useFamilyPresence = (familyId: string | null) => {
  const { setActiveCaregivers, setPresenceLoading, setError } = useCollaborationStore();

  const { data, loading, error, refetch } = useQuery<
    FamilyPresenceQueryData,
    FamilyPresenceQueryVariables
  >(
    FAMILY_PRESENCE_QUERY,
    {
      variables: { familyId: familyId! },
      skip: !familyId,
      errorPolicy: 'all',
      fetchPolicy: 'cache-and-network',
      pollInterval: 30000, // Poll every 30 seconds for real-time updates
    }
  );

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
    refetch,
  };
};

// =============================================================================
// Mutation Hooks
// =============================================================================

/**
 * Hook to create a new family
 */
export const useCreateFamily = () => {
  const { addFamily, setError } = useCollaborationStore();

  const [createFamilyMutation, { loading, error }] = useMutation<
    CreateFamilyMutationData,
    CreateFamilyMutationVariables
  >(CREATE_FAMILY_MUTATION);

  const createFamily = async (input: CreateFamilyMutationVariables['input']) => {
    try {
      setError(null);
      const result = await createFamilyMutation({
        variables: { input },
      });

      if (result.data?.createFamily.success && result.data.createFamily.family) {
        addFamily(result.data.createFamily.family);
        return result.data.createFamily;
      } else {
        const errorMessage = result.data?.createFamily.error || 'Failed to create family';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create family';
      setError(errorMessage);
      throw err;
    }
  };

  return {
    createFamily,
    loading,
    error,
  };
};

/**
 * Hook to invite a caregiver to join family
 */
export const useInviteCaregiver = () => {
  const { addInvitation, setError } = useCollaborationStore();

  const [inviteCaregiverMutation, { loading, error }] = useMutation<
    InviteCaregiverMutationData,
    InviteCaregiverMutationVariables
  >(INVITE_CAREGIVER_MUTATION);

  const inviteCaregiver = async (input: InviteCaregiverMutationVariables['input']) => {
    try {
      setError(null);
      const result = await inviteCaregiverMutation({
        variables: { input },
      });

      if (result.data?.inviteCaregiver.success && result.data.inviteCaregiver.invitation) {
        addInvitation(result.data.inviteCaregiver.invitation);
        return result.data.inviteCaregiver;
      } else {
        const errorMessage = result.data?.inviteCaregiver.error || 'Failed to send invitation';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send invitation';
      setError(errorMessage);
      throw err;
    }
  };

  return {
    inviteCaregiver,
    loading,
    error,
  };
};

/**
 * Hook to accept a caregiver invitation
 */
export const useAcceptInvitation = () => {
  const { addFamilyMember, addFamily, removeInvitation, setError } = useCollaborationStore();

  const [acceptInvitationMutation, { loading, error }] = useMutation<
    AcceptInvitationMutationData,
    AcceptInvitationMutationVariables
  >(ACCEPT_INVITATION_MUTATION);

  const acceptInvitation = async (token: string) => {
    try {
      setError(null);
      const result = await acceptInvitationMutation({
        variables: { token },
      });

      if (result.data?.acceptInvitation.success) {
        const { familyMember, family } = result.data.acceptInvitation;

        if (familyMember) {
          addFamilyMember(familyMember);
        }

        if (family) {
          addFamily(family);
        }

        // Remove the invitation from pending list
        // Note: We'd need the invitation ID to remove it properly
        // This might require additional backend logic

        return result.data.acceptInvitation;
      } else {
        const errorMessage = result.data?.acceptInvitation.error || 'Failed to accept invitation';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to accept invitation';
      setError(errorMessage);
      throw err;
    }
  };

  return {
    acceptInvitation,
    loading,
    error,
  };
};

/**
 * Hook to update caregiver presence status
 */
export const useUpdatePresence = () => {
  const { updatePresence, setError } = useCollaborationStore();

  const [updatePresenceMutation, { loading, error }] = useMutation<
    UpdatePresenceMutationData,
    UpdatePresenceMutationVariables
  >(UPDATE_PRESENCE_MUTATION);

  const updatePresenceStatus = async (input: UpdatePresenceMutationVariables['input']) => {
    try {
      setError(null);
      const result = await updatePresenceMutation({
        variables: { input },
      });

      if (result.data?.updatePresence.success && result.data.updatePresence.presence) {
        updatePresence(result.data.updatePresence.presence);
        return result.data.updatePresence;
      } else {
        const errorMessage = result.data?.updatePresence.error || 'Failed to update presence';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update presence';
      setError(errorMessage);
      throw err;
    }
  };

  return {
    updatePresence: updatePresenceStatus,
    loading,
    error,
  };
};

/**
 * Hook to add child to family
 */
export const useAddChildToFamily = () => {
  const { setError } = useCollaborationStore();

  const [addChildToFamilyMutation, { loading, error }] = useMutation<
    AddChildToFamilyMutationData,
    AddChildToFamilyMutationVariables
  >(ADD_CHILD_TO_FAMILY_MUTATION);

  const addChildToFamily = async (input: AddChildToFamilyMutationVariables['input']) => {
    try {
      setError(null);
      const result = await addChildToFamilyMutation({
        variables: { input },
      });

      if (result.data?.addChildToFamily.success) {
        return result.data.addChildToFamily;
      } else {
        const errorMessage = result.data?.addChildToFamily.error || 'Failed to add child to family';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add child to family';
      setError(errorMessage);
      throw err;
    }
  };

  return {
    addChildToFamily,
    loading,
    error,
  };
};

// =============================================================================
// Utility Hooks
// =============================================================================

/**
 * Hook to automatically sync collaboration data when family changes
 */
export const useCollaborationSync = (familyId: string | null) => {
  // Query all family-related data when family changes
  const families = useMyFamilies();
  const familyDetails = useFamilyDetails(familyId);
  const familyMembers = useFamilyMembers(familyId);
  const familyPresence = useFamilyPresence(familyId);
  const pendingInvitations = usePendingInvitations();

  const isLoading = families.loading || familyDetails.loading ||
                   familyMembers.loading || familyPresence.loading ||
                   pendingInvitations.loading;

  const hasError = families.error || familyDetails.error ||
                  familyMembers.error || familyPresence.error ||
                  pendingInvitations.error;

  const refetchAll = async () => {
    await Promise.all([
      families.refetch(),
      familyDetails.refetch(),
      familyMembers.refetch(),
      familyPresence.refetch(),
      pendingInvitations.refetch(),
    ]);
  };

  return {
    isLoading,
    hasError,
    refetchAll,
    families: families.families,
    familyDetails: familyDetails.family,
    familyMembers: familyMembers.members,
    familyPresence: familyPresence.presence,
    pendingInvitations: pendingInvitations.invitations,
  };
};

/**
 * Hook to manage current family context with real-time updates
 */
export const useCurrentFamily = () => {
  const {
    currentFamily,
    currentFamilyId,
    setCurrentFamily,
    setCurrentFamilyId
  } = useCollaborationStore();

  // Sync collaboration data for current family
  const sync = useCollaborationSync(currentFamilyId);

  // Real-time collaboration updates
  const realtime = useRealTimeCollaboration(currentFamilyId);

  const switchFamily = (familyId: string | null) => {
    setCurrentFamilyId(familyId);
  };

  return {
    currentFamily,
    currentFamilyId,
    switchFamily,
    setCurrentFamily,

    // Sync data (manual fetch)
    ...sync,

    // Real-time data and controls
    realTimePresence: realtime.presence,
    realTimeMembers: realtime.members,
    realTimeInvitations: realtime.invitations,
    realTimeLoading: realtime.loading,
    realTimeError: realtime.error,

    // Real-time controls
    startRealTimeUpdates: realtime.startPolling,
    stopRealTimeUpdates: realtime.stopPolling,
  };
};

/**
 * Hook to check if collaboration features are available
 */
export const useCollaborationAvailable = () => {
  const { myFamilies, currentFamily } = useCollaborationStore();

  const hasMultipleFamilies = myFamilies.length > 1;
  const hasActiveFamily = !!currentFamily;
  const isCollaborationEnabled = hasActiveFamily && currentFamily?.familyType !== 'PERSONAL';

  return {
    hasMultipleFamilies,
    hasActiveFamily,
    isCollaborationEnabled,
    currentFamilyType: currentFamily?.familyType || 'PERSONAL',
  };
};

export default {
  useMyFamilies,
  useFamilyDetails,
  useFamilyMembers,
  usePendingInvitations,
  useFamilyPresence,
  useCreateFamily,
  useInviteCaregiver,
  useAcceptInvitation,
  useUpdatePresence,
  useAddChildToFamily,
  useCollaborationSync,
  useCurrentFamily,
  useCollaborationAvailable,
};