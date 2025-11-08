---
title: Caregiver Collaboration Implementation Guide
description: Developer handoff documentation with React Native implementation specifications for collaboration features
feature: Caregiver Collaboration
last-updated: 2025-09-16
version: 1.0.0
related-files:
  - screen-states.md
  - user-journey.md
  - interactions.md
  - ../../design-system/style-guide.md
dependencies:
  - React Native + Expo SDK 53
  - NativeBase UI components
  - Apollo Client for GraphQL
  - Real-time subscriptions
  - Canadian PIPEDA compliance
status: implementation-ready
---

# Caregiver Collaboration Implementation Guide

## Implementation Overview

This guide provides comprehensive React Native implementation specifications for integrating caregiver collaboration features into the existing NestSync application while maintaining the established parent-focused design language and Canadian privacy compliance.

## Design System Extensions for Collaboration

### Collaboration Color Palette

Extend the existing NestSync color system with collaboration-specific colors:

```typescript
// Extend existing color system in constants/Colors.ts
export const CollaborationColors = {
  // Trust and Role Indicators (following existing Primary Blue patterns)
  familyBlue: '#0891B2',        // Existing Primary Blue for family members
  professionalPurple: '#7C3AED', // Soft Purple for professional caregivers
  emergencyOrange: '#EA580C',    // Existing Accent Orange for emergency contacts

  // Presence States (following existing Green patterns)
  activeGreen: '#059669',        // Existing Secondary Green for active presence
  recentAmber: '#D97706',        // Existing Accent Amber for recent activity
  offlineGray: '#6B7280',        // Existing neutral gray for offline status

  // Collaboration Context (subtle backgrounds)
  collaborationBg: 'rgba(8, 145, 178, 0.05)',  // 5% Primary Blue opacity
  familyBg: 'rgba(8, 145, 178, 0.1)',          // 10% Primary Blue opacity
  professionalBg: 'rgba(124, 58, 237, 0.1)',   // 10% Purple opacity

  // Conflict Resolution (calm, non-alarming)
  conflictAmber: '#D97706',      // Existing Accent Amber
  conflictBg: 'rgba(217, 119, 6, 0.1)', // 10% Amber opacity
  resolutionGreen: '#059669',    // Existing Secondary Green

  // Canadian Privacy (trust indicators)
  canadianRed: '#FF0000',        // Canadian flag red for trust/privacy indicators
  pipedaGreen: '#059669',        // Secondary Green for compliance status
};
```

### Typography Extensions

Extend existing typography system for collaboration-specific text:

```typescript
// Add to existing typography system
export const CollaborationTypography = {
  // Caregiver Names (prominence without overwhelming)
  caregiverName: {
    fontSize: 16,
    fontWeight: '600', // Semibold
    color: '#1F2937',
    lineHeight: 20,
  },

  // Role Labels (clear identification)
  roleLabel: {
    fontSize: 11,
    fontWeight: '500', // Medium
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    lineHeight: 14,
    // Color varies by role - see component implementations
  },

  // Activity Attribution (subtle but clear)
  activityAttribution: {
    fontSize: 13,
    fontWeight: '400', // Regular
    color: '#6B7280',
    lineHeight: 16,
  },

  // Presence Status (current activity description)
  presenceStatus: {
    fontSize: 12,
    fontWeight: '400', // Regular
    color: '#6B7280',
    lineHeight: 15,
  },

  // Coordination Messages (helpful, non-alarming)
  coordinationMessage: {
    fontSize: 14,
    fontWeight: '400', // Regular
    color: '#4B5563',
    lineHeight: 18,
  },

  // Emergency Text (urgent but not panic-inducing)
  emergencyText: {
    fontSize: 15,
    fontWeight: '600', // Semibold
    color: '#DC2626',
    lineHeight: 20,
  },
};
```

## Component Implementations

### 1. CaregiverPresenceCard Component

Integration with existing NestSync card patterns:

```typescript
import React from 'react';
import { Box, HStack, VStack, Text, Avatar, Badge } from 'native-base';
import { CollaborationColors, CollaborationTypography } from '../../../constants/Colors';

interface CaregiverPresenceCardProps {
  caregiver: {
    id: string;
    name: string;
    role: 'parent' | 'family' | 'professional' | 'emergency';
    status: 'active' | 'recent' | 'offline';
    currentActivity?: string;
    avatar?: string;
  };
  onPress?: () => void;
}

export const CaregiverPresenceCard: React.FC<CaregiverPresenceCardProps> = ({
  caregiver,
  onPress,
}) => {
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'parent':
        return CollaborationColors.familyBlue;
      case 'family':
        return CollaborationColors.familyBlue;
      case 'professional':
        return CollaborationColors.professionalPurple;
      case 'emergency':
        return CollaborationColors.emergencyOrange;
      default:
        return CollaborationColors.offlineGray;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return CollaborationColors.activeGreen;
      case 'recent':
        return CollaborationColors.recentAmber;
      case 'offline':
        return CollaborationColors.offlineGray;
      default:
        return CollaborationColors.offlineGray;
    }
  };

  return (
    <Box
      bg="white"
      borderRadius="12"
      borderWidth="1"
      borderColor="#E5E7EB"
      p="4"
      shadow="1"
      _pressed={{ opacity: 0.8 }}
      onTouchEnd={onPress}
      accessible={true}
      accessibilityLabel={`${caregiver.name}, ${caregiver.role}, currently ${caregiver.status}`}
      accessibilityRole="button"
    >
      <HStack space="3" alignItems="center">
        <Box position="relative">
          <Avatar
            size="md"
            source={caregiver.avatar ? { uri: caregiver.avatar } : undefined}
            bg={getRoleColor(caregiver.role)}
          >
            {caregiver.name.split(' ').map(n => n[0]).join('').toUpperCase()}
          </Avatar>
          <Badge
            position="absolute"
            top="-1"
            right="-1"
            w="3"
            h="3"
            bg={getStatusColor(caregiver.status)}
            borderRadius="full"
            borderWidth="2"
            borderColor="white"
          />
        </Box>

        <VStack flex="1" space="1">
          <Text style={CollaborationTypography.caregiverName}>
            {caregiver.name}
          </Text>
          <Text
            style={{
              ...CollaborationTypography.roleLabel,
              color: getRoleColor(caregiver.role),
            }}
          >
            {caregiver.role}
          </Text>
          {caregiver.currentActivity && (
            <Text style={CollaborationTypography.presenceStatus}>
              {caregiver.currentActivity}
            </Text>
          )}
        </VStack>
      </HStack>
    </Box>
  );
};
```

### 2. Enhanced Activity Feed Item

Building on existing activity components:

```typescript
import React from 'react';
import { Box, HStack, VStack, Text, Avatar, Pressable } from 'native-base';
import { Activity } from '../../../types/collaboration';

interface CollaborativeActivityItemProps {
  activity: Activity & {
    caregiver: {
      id: string;
      name: string;
      role: string;
    };
    collaboration?: {
      isCoordinated: boolean;
      hasConflict: boolean;
      reactions: Array<{ userId: string; type: string; }>;
    };
  };
  onPress?: () => void;
  onCaregiverPress?: (caregiverId: string) => void;
}

export const CollaborativeActivityItem: React.FC<CollaborativeActivityItemProps> = ({
  activity,
  onPress,
  onCaregiverPress,
}) => {
  const getBorderAccent = () => {
    if (activity.collaboration?.hasConflict) {
      return CollaborationColors.conflictAmber;
    }
    if (activity.collaboration?.isCoordinated) {
      return CollaborationColors.activeGreen;
    }
    return 'transparent';
  };

  const getBackgroundTint = () => {
    if (activity.collaboration?.isCoordinated) {
      return CollaborationColors.collaborationBg;
    }
    return 'transparent';
  };

  return (
    <Pressable onPress={onPress} _pressed={{ opacity: 0.8 }}>
      <Box
        bg={getBackgroundTint()}
        borderLeftWidth="3"
        borderLeftColor={getBorderAccent()}
        p="4"
        borderBottomWidth="1"
        borderBottomColor="#F3F4F6"
      >
        <HStack space="3" alignItems="flex-start">
          {/* Activity Type Icon - preserve existing design */}
          <Box
            w="10"
            h="10"
            borderRadius="full"
            bg="#E0F2FE" // Primary Blue Light
            alignItems="center"
            justifyContent="center"
          >
            {/* Activity icon component - use existing */}
          </Box>

          <VStack flex="1" space="1">
            {/* Activity Description - enhanced with caregiver attribution */}
            <Text style={CollaborationTypography.activityAttribution}>
              {activity.activity_type.replace('_', ' ')} by{' '}
              <Text
                style={{
                  ...CollaborationTypography.activityAttribution,
                  color: CollaborationColors.familyBlue,
                  fontWeight: '500',
                }}
                onPress={() => onCaregiverPress?.(activity.caregiver.id)}
              >
                {activity.caregiver.name}
              </Text>
            </Text>

            {/* Activity Details - preserve existing format */}
            <Text fontSize="16" color="#1F2937">
              {activity.details || 'Activity completed'}
            </Text>

            {/* Timestamp - preserve existing styling */}
            <Text fontSize="12" color="#6B7280">
              {formatTimeAgo(activity.logged_at)}
            </Text>

            {/* Collaboration Indicators */}
            {activity.collaboration?.reactions.length > 0 && (
              <HStack space="2" mt="2">
                {activity.collaboration.reactions.map((reaction, index) => (
                  <Text key={index} fontSize="16">
                    {reaction.type === 'thumbs_up' ? '👍' :
                     reaction.type === 'heart' ? '❤️' : '✅'}
                  </Text>
                ))}
              </HStack>
            )}

            {/* Conflict Indicator */}
            {activity.collaboration?.hasConflict && (
              <Box
                mt="2"
                p="2"
                bg={CollaborationColors.conflictBg}
                borderRadius="6"
              >
                <Text style={CollaborationTypography.coordinationMessage}>
                  Let's make sure we're coordinated on this activity
                </Text>
              </Box>
            )}
          </VStack>

          {/* Caregiver Avatar */}
          <Pressable onPress={() => onCaregiverPress?.(activity.caregiver.id)}>
            <Avatar
              size="sm"
              bg={CollaborationColors.familyBlue}
              source={activity.caregiver.avatar ? { uri: activity.caregiver.avatar } : undefined}
            >
              {activity.caregiver.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </Avatar>
          </Pressable>
        </HStack>
      </Box>
    </Pressable>
  );
};
```

### 3. Conflict Resolution Modal

Calm, helpful conflict resolution interface:

```typescript
import React, { useState } from 'react';
import {
  Modal,
  VStack,
  HStack,
  Text,
  Button,
  Box,
  Divider,
  Radio,
} from 'native-base';
import { ActivityConflict } from '../../../types/collaboration';

interface ConflictResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  conflict: ActivityConflict;
  onResolve: (resolution: string, keepActivity?: string) => void;
}

export const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = ({
  isOpen,
  onClose,
  conflict,
  onResolve,
}) => {
  const [selectedResolution, setSelectedResolution] = useState('merge');
  const [selectedActivity, setSelectedActivity] = useState('');

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <Modal.Content>
        <Modal.Header>
          <Text fontSize="18" fontWeight="600" color="#1F2937">
            Let's coordinate this activity
          </Text>
        </Modal.Header>

        <Modal.Body>
          <VStack space="4">
            {/* Calm explanation */}
            <Box
              bg={CollaborationColors.collaborationBg}
              p="3"
              borderRadius="8"
            >
              <Text style={CollaborationTypography.coordinationMessage}>
                It looks like this activity was logged by multiple caregivers.
                This happens sometimes - let's make sure we have the right information.
              </Text>
            </Box>

            {/* Show conflicted activities */}
            <VStack space="2">
              <Text fontSize="14" fontWeight="500" color="#4B5563">
                Activities that might be the same:
              </Text>
              {conflict.activities.map((activity, index) => (
                <Box
                  key={activity.id}
                  p="3"
                  bg="#F9FAFB"
                  borderRadius="6"
                  borderWidth="1"
                  borderColor="#E5E7EB"
                >
                  <Text fontSize="14" color="#1F2937">
                    {activity.description} by {activity.caregiver.name}
                  </Text>
                  <Text fontSize="12" color="#6B7280">
                    {formatTime(activity.logged_at)}
                  </Text>
                </Box>
              ))}
            </VStack>

            {/* Resolution options */}
            <VStack space="3">
              <Text fontSize="14" fontWeight="500" color="#4B5563">
                How would you like to handle this?
              </Text>

              <Radio.Group
                value={selectedResolution}
                onChange={setSelectedResolution}
                name="resolution"
              >
                <VStack space="2">
                  <Radio value="merge" colorScheme="primary">
                    <Text ml="2" fontSize="14" color="#1F2937">
                      Combine these into one activity (recommended)
                    </Text>
                  </Radio>
                  <Radio value="keep_both" colorScheme="primary">
                    <Text ml="2" fontSize="14" color="#1F2937">
                      Keep both - they're different activities
                    </Text>
                  </Radio>
                  <Radio value="choose_one" colorScheme="primary">
                    <Text ml="2" fontSize="14" color="#1F2937">
                      Pick the most accurate one
                    </Text>
                  </Radio>
                </VStack>
              </Radio.Group>
            </VStack>

            {/* If choosing one, show selection */}
            {selectedResolution === 'choose_one' && (
              <Radio.Group
                value={selectedActivity}
                onChange={setSelectedActivity}
                name="activity_selection"
              >
                <VStack space="2">
                  {conflict.activities.map((activity) => (
                    <Radio key={activity.id} value={activity.id} colorScheme="primary">
                      <Text ml="2" fontSize="13" color="#4B5563">
                        {activity.description} by {activity.caregiver.name}
                      </Text>
                    </Radio>
                  ))}
                </VStack>
              </Radio.Group>
            )}
          </VStack>
        </Modal.Body>

        <Modal.Footer>
          <HStack space="3" flex="1" justifyContent="flex-end">
            <Button
              variant="ghost"
              onPress={onClose}
              _text={{ color: '#6B7280' }}
            >
              Cancel
            </Button>
            <Button
              bg={CollaborationColors.activeGreen}
              onPress={() => {
                onResolve(selectedResolution, selectedActivity);
                onClose();
              }}
              _pressed={{ bg: '#047857' }}
            >
              Resolve
            </Button>
          </HStack>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  );
};
```

### 4. Settings Integration

Enhance existing settings with collaboration section:

```typescript
import React from 'react';
import { VStack, Text, Pressable, HStack, Switch, Divider } from 'native-base';
import { ChevronRightIcon } from 'native-base';

interface CollaborationSettingsSectionProps {
  collaborationEnabled: boolean;
  onToggleCollaboration: (enabled: boolean) => void;
  onManageCaregivers: () => void;
  onPrivacySettings: () => void;
  onProfessionalSettings?: () => void;
  isProfessional?: boolean;
}

export const CollaborationSettingsSection: React.FC<CollaborationSettingsSectionProps> = ({
  collaborationEnabled,
  onToggleCollaboration,
  onManageCaregivers,
  onPrivacySettings,
  onProfessionalSettings,
  isProfessional = false,
}) => {
  return (
    <VStack space="4" mt="6">
      {/* Section Header */}
      <VStack space="2">
        <Text fontSize="20" fontWeight="600" color="#1F2937">
          Family & Caregivers
        </Text>
        <Text fontSize="14" color="#6B7280">
          Manage who helps care for your little one
        </Text>
      </VStack>

      {/* Main collaboration toggle */}
      <HStack
        justifyContent="space-between"
        alignItems="center"
        p="4"
        bg="white"
        borderRadius="12"
        borderWidth="1"
        borderColor="#E5E7EB"
      >
        <VStack flex="1">
          <Text fontSize="16" fontWeight="500" color="#1F2937">
            Family Collaboration
          </Text>
          <Text fontSize="14" color="#6B7280">
            Share activities with family members and caregivers
          </Text>
        </VStack>
        <Switch
          value={collaborationEnabled}
          onValueChange={onToggleCollaboration}
          colorScheme="primary"
        />
      </HStack>

      {collaborationEnabled && (
        <VStack space="3">
          {/* Manage Caregivers */}
          <Pressable onPress={onManageCaregivers} _pressed={{ opacity: 0.8 }}>
            <HStack
              justifyContent="space-between"
              alignItems="center"
              p="4"
              bg="white"
              borderRadius="12"
              borderWidth="1"
              borderColor="#E5E7EB"
            >
              <VStack flex="1">
                <Text fontSize="16" fontWeight="500" color="#1F2937">
                  Manage Caregivers
                </Text>
                <Text fontSize="14" color="#6B7280">
                  Add family members and professional caregivers
                </Text>
              </VStack>
              <ChevronRightIcon size="5" color="#6B7280" />
            </HStack>
          </Pressable>

          {/* Privacy Settings */}
          <Pressable onPress={onPrivacySettings} _pressed={{ opacity: 0.8 }}>
            <HStack
              justifyContent="space-between"
              alignItems="center"
              p="4"
              bg="white"
              borderRadius="12"
              borderWidth="1"
              borderColor="#E5E7EB"
            >
              <HStack alignItems="center" flex="1" space="3">
                {/* Canadian flag indicator */}
                <Text fontSize="16">🇨🇦</Text>
                <VStack flex="1">
                  <Text fontSize="16" fontWeight="500" color="#1F2937">
                    Privacy & Data Sharing
                  </Text>
                  <Text fontSize="14" color="#6B7280">
                    Control what information is shared (PIPEDA compliant)
                  </Text>
                </VStack>
              </HStack>
              <ChevronRightIcon size="5" color="#6B7280" />
            </HStack>
          </Pressable>

          {/* Professional Settings (if applicable) */}
          {isProfessional && onProfessionalSettings && (
            <Pressable onPress={onProfessionalSettings} _pressed={{ opacity: 0.8 }}>
              <HStack
                justifyContent="space-between"
                alignItems="center"
                p="4"
                bg="white"
                borderRadius="12"
                borderWidth="1"
                borderColor="#E5E7EB"
              >
                <VStack flex="1">
                  <Text fontSize="16" fontWeight="500" color={CollaborationColors.professionalPurple}>
                    Professional Caregiver Settings
                  </Text>
                  <Text fontSize="14" color="#6B7280">
                    Manage your professional profile and client families
                  </Text>
                </VStack>
                <ChevronRightIcon size="5" color="#6B7280" />
              </HStack>
            </Pressable>
          )}
        </VStack>
      )}
    </VStack>
  );
};
```

## GraphQL Integration

### Real-time Subscription Patterns

```typescript
// Subscription for real-time collaboration updates
const COLLABORATION_UPDATES_SUBSCRIPTION = gql`
  subscription CollaborationUpdates($familyId: String!) {
    collaborationUpdates(familyId: $familyId) {
      type
      data {
        ... on ActivityUpdate {
          activity {
            id
            activity_type
            logged_at
            logged_by_user_id
            details
            caregiver {
              id
              name
              role
            }
          }
        }
        ... on PresenceUpdate {
          presence {
            user_id
            status
            current_activity
            last_seen
          }
        }
        ... on ConflictAlert {
          conflict {
            id
            type
            activities {
              id
              description
              logged_at
              caregiver {
                id
                name
              }
            }
            suggested_resolution
          }
        }
      }
    }
  }
`;

// Usage in React component
const useCollaborationUpdates = (familyId: string) => {
  const { data, loading, error } = useSubscription(COLLABORATION_UPDATES_SUBSCRIPTION, {
    variables: { familyId },
    skip: !familyId,
  });

  return {
    updates: data?.collaborationUpdates,
    loading,
    error,
  };
};
```

### Permission-based Query Patterns

```typescript
// Query activities with collaboration context
const GET_FAMILY_ACTIVITIES = gql`
  query GetFamilyActivities(
    $familyId: String!
    $limit: Int = 50
    $includeCollaboration: Boolean = true
  ) {
    familyActivities(familyId: $familyId, limit: $limit) {
      id
      activity_type
      logged_at
      logged_by_user_id
      details
      caregiver {
        id
        name
        role
      }
      collaboration @include(if: $includeCollaboration) {
        is_coordinated
        has_conflict
        reactions {
          user_id
          type
          created_at
        }
        conflict_info {
          id
          type
          resolution_status
        }
      }
    }
  }
`;
```

## State Management Integration

### Collaboration State in Zustand

```typescript
import { create } from 'zustand';
import { Activity, CaregiverPresence, ConflictAlert } from '../types/collaboration';

interface CollaborationState {
  // Presence tracking
  activeCaregivers: CaregiverPresence[];

  // Activity coordination
  activities: Activity[];
  conflicts: ConflictAlert[];

  // User permissions
  currentUserRole: string;
  permissions: string[];

  // Actions
  updatePresence: (presence: CaregiverPresence) => void;
  addActivity: (activity: Activity) => void;
  resolveConflict: (conflictId: string, resolution: string) => void;

  // Real-time handlers
  handleCollaborationUpdate: (update: any) => void;
}

export const useCollaborationStore = create<CollaborationState>((set, get) => ({
  activeCaregivers: [],
  activities: [],
  conflicts: [],
  currentUserRole: 'parent',
  permissions: [],

  updatePresence: (presence) => {
    set((state) => ({
      activeCaregivers: state.activeCaregivers.map((p) =>
        p.user_id === presence.user_id ? presence : p
      ).concat(
        state.activeCaregivers.find(p => p.user_id === presence.user_id)
          ? []
          : [presence]
      ),
    }));
  },

  addActivity: (activity) => {
    set((state) => ({
      activities: [activity, ...state.activities].slice(0, 100), // Keep last 100
    }));
  },

  resolveConflict: (conflictId, resolution) => {
    set((state) => ({
      conflicts: state.conflicts.filter(c => c.id !== conflictId),
    }));
  },

  handleCollaborationUpdate: (update) => {
    const { type, data } = update;

    switch (type) {
      case 'ACTIVITY_UPDATE':
        get().addActivity(data.activity);
        break;
      case 'PRESENCE_UPDATE':
        get().updatePresence(data.presence);
        break;
      case 'CONFLICT_ALERT':
        set((state) => ({
          conflicts: [...state.conflicts, data.conflict],
        }));
        break;
    }
  },
}));
```

## Performance Optimization

### Real-time Update Throttling

```typescript
import { throttle } from 'lodash';
import { useCallback } from 'react';

// Throttle real-time updates to prevent UI flooding
const useThrottledCollaborationUpdates = () => {
  const collaborationStore = useCollaborationStore();

  const throttledUpdate = useCallback(
    throttle((update) => {
      collaborationStore.handleCollaborationUpdate(update);
    }, 1000), // Max 1 update per second
    [collaborationStore]
  );

  return { handleUpdate: throttledUpdate };
};
```

### Presence Tracking Optimization

```typescript
// Efficient presence tracking with automatic cleanup
const usePresenceTracking = (familyId: string) => {
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    let presenceInterval: NodeJS.Timeout;

    if (isTracking && familyId) {
      // Update presence every 30 seconds
      presenceInterval = setInterval(() => {
        updateUserPresence({
          family_id: familyId,
          status: 'active',
          last_seen: new Date(),
        });
      }, 30000);
    }

    return () => {
      if (presenceInterval) {
        clearInterval(presenceInterval);
      }
      // Clean up presence on unmount
      updateUserPresence({
        family_id: familyId,
        status: 'offline',
        last_seen: new Date(),
      });
    };
  }, [isTracking, familyId]);

  return { startTracking: () => setIsTracking(true) };
};
```

## Accessibility Implementation

### Screen Reader Support

```typescript
// Enhanced accessibility for collaboration elements
const getCollaborationAccessibilityProps = (element: any) => {
  switch (element.type) {
    case 'caregiver_presence':
      return {
        accessible: true,
        accessibilityRole: 'button',
        accessibilityLabel: `${element.name} is currently ${element.status}${
          element.activity ? `, ${element.activity}` : ''
        }`,
        accessibilityHint: 'Tap for more details about this caregiver',
      };

    case 'activity_with_collaboration':
      return {
        accessible: true,
        accessibilityRole: 'button',
        accessibilityLabel: `${element.activity_type} by ${element.caregiver.name}, ${
          formatTimeAgo(element.logged_at)
        }${element.has_conflict ? ', requires coordination' : ''}`,
        accessibilityHint: 'Tap for activity details and coordination options',
      };

    case 'conflict_resolution':
      return {
        accessible: true,
        accessibilityRole: 'alert',
        accessibilityLabel: `Coordination needed: ${element.description}`,
        accessibilityHint: 'Tap to resolve this coordination issue',
      };

    default:
      return {};
  }
};
```

## Testing Strategies

### Collaboration Component Testing

```typescript
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { MockedProvider } from '@apollo/client/testing';
import { CaregiverPresenceCard } from '../CaregiverPresenceCard';

describe('CaregiverPresenceCard', () => {
  const mockCaregiver = {
    id: '1',
    name: 'Sarah Johnson',
    role: 'family',
    status: 'active',
    currentActivity: 'Feeding Emma',
  };

  it('displays caregiver information correctly', () => {
    const { getByText } = render(
      <CaregiverPresenceCard caregiver={mockCaregiver} />
    );

    expect(getByText('Sarah Johnson')).toBeTruthy();
    expect(getByText('family')).toBeTruthy();
    expect(getByText('Feeding Emma')).toBeTruthy();
  });

  it('handles accessibility correctly', () => {
    const { getByLabelText } = render(
      <CaregiverPresenceCard caregiver={mockCaregiver} />
    );

    expect(getByLabelText(/Sarah Johnson.*family.*currently active/)).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByRole } = render(
      <CaregiverPresenceCard caregiver={mockCaregiver} onPress={onPress} />
    );

    fireEvent.press(getByRole('button'));
    expect(onPress).toHaveBeenCalled();
  });
});
```

This implementation guide provides comprehensive specifications for integrating caregiver collaboration features into the existing NestSync application while maintaining the established parent-focused design philosophy, Canadian privacy compliance, and accessibility standards.