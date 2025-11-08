# Caregiver Collaboration Architecture
## Technical Design for Multi-Caregiver Diaper Tracking

**Document Status**: Implementation Ready
**Target Release**: Phase 3 Development Cycle
**Last Updated**: September 16, 2025
**Architecture Version**: 1.0

---

## Executive Summary

This document specifies the complete technical architecture for implementing caregiver collaboration in NestSync, transforming it from a single-user diaper tracking application to a comprehensive multi-caregiver family coordination platform. The design maintains backward compatibility while introducing sophisticated role-based permissions, real-time collaboration, and family management capabilities.

### Key Architectural Decisions

- **Family-Centric Model**: Transition from User -> Children to User -> Family <- Children structure
- **Four-Tier Permission System**: Family Core, Extended Family, Professional, and Institutional access levels
- **Real-Time Collaboration**: Leverage Supabase real-time capabilities for live updates
- **Seamless Migration**: Existing users automatically receive "personal families" with full privileges
- **PIPEDA Compliance**: Canadian data residency with comprehensive audit trails

### Technology Stack Summary

- **Backend**: FastAPI + Strawberry GraphQL + Supabase PostgreSQL (existing)
- **Frontend**: React Native + Expo + Apollo Client (existing)
- **Real-Time**: Supabase real-time subscriptions with custom conflict resolution
- **Security**: Row Level Security (RLS) policies with role-based access control
- **Migration**: Four-phase rollout with zero-downtime deployment

---

## Database Schema Extensions

### Core Tables Design

#### 1. families Table
```sql
CREATE TABLE families (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    family_type family_type_enum NOT NULL DEFAULT 'standard',
    description TEXT,
    created_by UUID REFERENCES users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    settings JSONB DEFAULT '{}',

    -- Indexes for performance
    INDEX idx_families_created_by (created_by),
    INDEX idx_families_type (family_type)
);

-- Family types enumeration
CREATE TYPE family_type_enum AS ENUM (
    'personal',      -- Single-user families (migration)
    'standard',      -- Multi-caregiver families
    'institutional'  -- Daycare/medical facilities
);
```

#### 2. family_members Table (Junction with Roles)
```sql
CREATE TABLE family_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    family_id UUID REFERENCES families(id) ON DELETE CASCADE,
    role member_role_enum NOT NULL,
    permissions JSONB DEFAULT '{}',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    access_expires_at TIMESTAMP WITH TIME ZONE,
    invited_by UUID REFERENCES users(id),
    status member_status_enum DEFAULT 'active',

    UNIQUE(user_id, family_id),
    INDEX idx_family_members_user (user_id),
    INDEX idx_family_members_family (family_id),
    INDEX idx_family_members_role (role)
);

-- Role hierarchy (highest to lowest privilege)
CREATE TYPE member_role_enum AS ENUM (
    'family_core',     -- Parents/guardians (full access)
    'extended_family', -- Grandparents, siblings (read + limited write)
    'professional',    -- Pediatricians, daycare (focused access)
    'institutional'    -- Temporary caregivers (minimal access)
);

CREATE TYPE member_status_enum AS ENUM (
    'active', 'inactive', 'suspended', 'expired'
);
```

#### 3. family_child_access Table
```sql
CREATE TABLE family_child_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID REFERENCES families(id) ON DELETE CASCADE,
    child_id UUID REFERENCES children(id) ON DELETE CASCADE,
    access_level access_level_enum DEFAULT 'full',
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    granted_by UUID REFERENCES users(id),

    UNIQUE(family_id, child_id),
    INDEX idx_family_child_family (family_id),
    INDEX idx_family_child_child (child_id)
);

CREATE TYPE access_level_enum AS ENUM (
    'full', 'limited', 'read_only', 'emergency_only'
);
```

#### 4. caregiver_invitations Table
```sql
CREATE TABLE caregiver_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID REFERENCES families(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role member_role_enum NOT NULL,
    invitation_token VARCHAR(255) UNIQUE NOT NULL,
    invited_by UUID REFERENCES users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    accepted_by UUID REFERENCES users(id),
    status invitation_status_enum DEFAULT 'pending',
    access_restrictions JSONB DEFAULT '{}',

    INDEX idx_invitations_token (invitation_token),
    INDEX idx_invitations_email (email),
    INDEX idx_invitations_family (family_id)
);

CREATE TYPE invitation_status_enum AS ENUM (
    'pending', 'accepted', 'expired', 'revoked'
);
```

#### 5. collaboration_logs Table (PIPEDA Audit Trail)
```sql
CREATE TABLE collaboration_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID REFERENCES families(id) ON DELETE CASCADE,
    actor_user_id UUID REFERENCES users(id),
    action_type log_action_enum NOT NULL,
    target_type VARCHAR(50),
    target_id UUID,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    INDEX idx_logs_family (family_id),
    INDEX idx_logs_actor (actor_user_id),
    INDEX idx_logs_created (created_at),
    INDEX idx_logs_action (action_type)
);

CREATE TYPE log_action_enum AS ENUM (
    'family_created', 'member_invited', 'member_joined', 'member_removed',
    'role_changed', 'child_added', 'child_removed', 'activity_logged',
    'profile_updated', 'settings_changed', 'data_accessed', 'data_exported'
);
```

#### 6. caregiver_presence Table (Real-Time Tracking)
```sql
CREATE TABLE caregiver_presence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    family_id UUID REFERENCES families(id) ON DELETE CASCADE,
    child_id UUID REFERENCES children(id),
    status presence_status_enum DEFAULT 'offline',
    current_activity VARCHAR(100),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_id VARCHAR(255),
    device_info JSONB DEFAULT '{}',

    UNIQUE(user_id, family_id),
    INDEX idx_presence_family (family_id),
    INDEX idx_presence_child (child_id),
    INDEX idx_presence_status (status)
);

CREATE TYPE presence_status_enum AS ENUM (
    'online', 'away', 'caring', 'offline'
);
```

### Schema Migration Strategy

#### Existing Tables Modifications

```sql
-- Add family relationship to children (nullable during migration)
ALTER TABLE children
ADD COLUMN family_id UUID REFERENCES families(id),
ADD COLUMN migrated_from_user UUID;

-- Add collaboration fields to activities
ALTER TABLE activities
ADD COLUMN logged_by_user_id UUID REFERENCES users(id),
ADD COLUMN family_context JSONB DEFAULT '{}',
ADD COLUMN collaboration_metadata JSONB DEFAULT '{}';

-- Preserve original user ownership during migration
ALTER TABLE children
ADD COLUMN original_user_id UUID;
```

---

## GraphQL Schema Extensions

### New Types and Enums

```graphql
# Core collaboration types
type Family {
  id: ID!
  name: String!
  familyType: FamilyType!
  description: String
  createdBy: UserProfile!
  createdAt: DateTime!
  settings: FamilySettings!
  members: FamilyMemberConnection!
  children: ChildConnection!
  activityStream: ActivityConnection!
}

type FamilyMember {
  id: ID!
  user: UserProfile!
  family: Family!
  role: MemberRole!
  permissions: MemberPermissions!
  joinedAt: DateTime!
  accessExpiresAt: DateTime
  invitedBy: UserProfile
  status: MemberStatus!
  isCurrentlyActive: Boolean!
}

type CaregiverInvitation {
  id: ID!
  family: Family!
  email: String!
  role: MemberRole!
  invitedBy: UserProfile!
  createdAt: DateTime!
  expiresAt: DateTime!
  status: InvitationStatus!
  accessRestrictions: InvitationRestrictions
}

type CaregiverPresence {
  user: UserProfile!
  family: Family!
  child: Child
  status: PresenceStatus!
  currentActivity: String
  lastSeen: DateTime!
  deviceInfo: DeviceInfo
}

# Enums
enum FamilyType {
  PERSONAL
  STANDARD
  INSTITUTIONAL
}

enum MemberRole {
  FAMILY_CORE
  EXTENDED_FAMILY
  PROFESSIONAL
  INSTITUTIONAL
}

enum PresenceStatus {
  ONLINE
  AWAY
  CARING
  OFFLINE
}

enum InvitationStatus {
  PENDING
  ACCEPTED
  EXPIRED
  REVOKED
}

# Settings and configuration types
type FamilySettings {
  timeZone: String!
  language: String!
  privacyLevel: PrivacyLevel!
  allowGuestAccess: Boolean!
  dataRetentionDays: Int!
  notificationSettings: FamilyNotificationSettings!
}

type MemberPermissions {
  canViewAllData: Boolean!
  canEditChildProfiles: Boolean!
  canInviteMembers: Boolean!
  canManageSettings: Boolean!
  canExportData: Boolean!
  canAccessHistoricalData: Boolean!
  allowedActivityTypes: [ActivityType!]!
  timeBasedRestrictions: TimeRestrictions
}
```

### Extended Query Operations

```graphql
extend type Query {
  # Family management
  myFamilies: FamilyConnection!
  familyDetails(familyId: ID!): Family
  familyMembers(familyId: ID!): FamilyMemberConnection!
  familyChildren(familyId: ID!, filters: ChildFilters): ChildConnection!

  # Invitations
  pendingInvitations: InvitationConnection!
  sentInvitations(familyId: ID!): InvitationConnection!

  # Collaboration features
  familyActivityStream(
    familyId: ID!
    filters: ActivityFilters
    pagination: PaginationInput
  ): ActivityConnection!

  caregiverPresence(familyId: ID!): [CaregiverPresence!]!
  collaborationHistory(
    familyId: ID!
    filters: CollaborationFilters
  ): CollaborationLogConnection!

  # Permission checking
  myPermissions(familyId: ID!): MemberPermissions!
  canPerformAction(
    familyId: ID!
    action: CollaborationAction!
  ): PermissionCheck!
}
```

### Extended Mutation Operations

```graphql
extend type Mutation {
  # Family management
  createFamily(input: CreateFamilyInput!): CreateFamilyResponse!
  updateFamily(input: UpdateFamilyInput!): UpdateFamilyResponse!
  deleteFamily(familyId: ID!): DeleteFamilyResponse!

  # Member management
  inviteCaregiver(input: InviteCaregiverInput!): InviteCaregiverResponse!
  acceptInvitation(
    token: String!
    acceptTerms: Boolean!
  ): AcceptInvitationResponse!
  updateMemberRole(input: UpdateMemberRoleInput!): UpdateMemberRoleResponse!
  removeFamilyMember(input: RemoveMemberInput!): RemoveMemberResponse!
  suspendFamilyMember(input: SuspendMemberInput!): SuspendMemberResponse!

  # Child management in family context
  addChildToFamily(input: AddChildToFamilyInput!): AddChildToFamilyResponse!
  transferChildToFamily(input: TransferChildInput!): TransferChildResponse!
  updateChildFamilyAccess(
    input: UpdateChildAccessInput!
  ): UpdateChildAccessResponse!

  # Collaboration activities
  logFamilyActivity(input: FamilyActivityInput!): LogActivityResponse!
  updateCaregiverPresence(input: PresenceInput!): PresenceResponse!
  addCollaborationNote(input: CollaborationNoteInput!): CollaborationNoteResponse!

  # Settings and permissions
  updateFamilySettings(input: FamilySettingsInput!): FamilySettingsResponse!
  updateMemberPermissions(
    input: MemberPermissionsInput!
  ): MemberPermissionsResponse!

  # Data management
  exportFamilyData(
    familyId: ID!
    format: ExportFormat!
    dateRange: DateRange
  ): ExportFamilyDataResponse!
}
```

### Real-Time Subscriptions

```graphql
extend type Subscription {
  # Real-time family updates
  familyActivityUpdates(familyId: ID!): ActivityUpdate!
  familyMemberPresence(familyId: ID!): PresenceUpdate!
  familyMembershipChanges(familyId: ID!): MembershipUpdate!

  # Invitation updates
  invitationUpdates: InvitationUpdate!

  # Child-specific updates
  childUpdatesInFamily(
    familyId: ID!
    childId: ID
  ): ChildUpdate!

  # Emergency notifications
  emergencyAlerts(familyId: ID!): EmergencyAlert!
}
```

---

## Role-Based Permission System

### Permission Matrix by Role

#### Family Core (Parents/Guardians)
```json
{
  "data_access": {
    "view_all_children": true,
    "view_all_activities": true,
    "view_historical_data": true,
    "view_collaboration_logs": true,
    "export_data": true
  },
  "data_modification": {
    "create_children": true,
    "edit_child_profiles": true,
    "delete_activities": true,
    "bulk_operations": true
  },
  "family_management": {
    "invite_members": true,
    "remove_members": true,
    "change_member_roles": true,
    "modify_family_settings": true,
    "delete_family": true
  },
  "activity_logging": {
    "all_activity_types": true,
    "edit_own_activities": true,
    "edit_others_activities": true,
    "bulk_logging": true
  }
}
```

#### Extended Family (Grandparents, Siblings)
```json
{
  "data_access": {
    "view_all_children": true,
    "view_all_activities": true,
    "view_historical_data": true,
    "view_collaboration_logs": false,
    "export_data": false
  },
  "data_modification": {
    "create_children": false,
    "edit_child_profiles": false,
    "delete_activities": false,
    "bulk_operations": false
  },
  "family_management": {
    "invite_members": false,
    "remove_members": false,
    "change_member_roles": false,
    "modify_family_settings": false,
    "delete_family": false
  },
  "activity_logging": {
    "all_activity_types": true,
    "edit_own_activities": true,
    "edit_others_activities": false,
    "bulk_logging": false
  }
}
```

#### Professional (Pediatricians, Daycare)
```json
{
  "data_access": {
    "view_all_children": true,
    "view_all_activities": true,
    "view_historical_data": "relevant_only",
    "view_collaboration_logs": false,
    "export_data": "professional_reports_only"
  },
  "data_modification": {
    "create_children": false,
    "edit_child_profiles": "medical_fields_only",
    "delete_activities": false,
    "bulk_operations": false
  },
  "family_management": {
    "invite_members": false,
    "remove_members": false,
    "change_member_roles": false,
    "modify_family_settings": false,
    "delete_family": false
  },
  "activity_logging": {
    "all_activity_types": "professional_scope_only",
    "edit_own_activities": true,
    "edit_others_activities": false,
    "bulk_logging": "within_session_only"
  }
}
```

#### Institutional (Temporary Caregivers)
```json
{
  "data_access": {
    "view_all_children": "basic_info_only",
    "view_all_activities": "current_day_only",
    "view_historical_data": false,
    "view_collaboration_logs": false,
    "export_data": false
  },
  "data_modification": {
    "create_children": false,
    "edit_child_profiles": false,
    "delete_activities": false,
    "bulk_operations": false
  },
  "family_management": {
    "invite_members": false,
    "remove_members": false,
    "change_member_roles": false,
    "modify_family_settings": false,
    "delete_family": false
  },
  "activity_logging": {
    "all_activity_types": "basic_only",
    "edit_own_activities": "within_time_window",
    "edit_others_activities": false,
    "bulk_logging": false
  },
  "time_restrictions": {
    "session_duration_hours": 8,
    "auto_expire_days": 7,
    "activity_window_minutes": 30
  }
}
```

### Permission Validation Implementation

```python
# Backend permission service
class CollaborationPermissionService:

    @staticmethod
    async def check_family_access(user_id: str, family_id: str, action: str) -> bool:
        """Validate user can perform action on family"""
        async for session in get_async_session():
            # Get user's role in family
            result = await session.execute(
                select(FamilyMember)
                .where(
                    FamilyMember.user_id == user_id,
                    FamilyMember.family_id == family_id,
                    FamilyMember.status == 'active'
                )
            )
            member = result.scalar_one_or_none()

            if not member:
                return False

            # Check if access has expired
            if member.access_expires_at and member.access_expires_at < datetime.utcnow():
                return False

            # Validate action against role permissions
            return validate_action_for_role(member.role, action)

    @staticmethod
    async def get_accessible_children(user_id: str, family_id: str) -> List[str]:
        """Get list of child IDs user can access in family"""
        async for session in get_async_session():
            result = await session.execute(
                select(FamilyChildAccess.child_id)
                .join(FamilyMember)
                .where(
                    FamilyMember.user_id == user_id,
                    FamilyMember.family_id == family_id,
                    FamilyMember.status == 'active'
                )
            )
            return [row[0] for row in result.fetchall()]
```

---

## Real-Time Collaboration Architecture

### Supabase Real-Time Integration

#### Frontend Subscription Setup
```typescript
// hooks/useCollaborationUpdates.ts
export function useCollaborationUpdates(familyId: string) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [presence, setPresence] = useState<CaregiverPresence[]>([]);

  useEffect(() => {
    const channel = supabase
      .channel(`family_${familyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activities',
          filter: `family_id=eq.${familyId}`
        },
        handleActivityUpdate
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'caregiver_presence',
          filter: `family_id=eq.${familyId}`
        },
        handlePresenceUpdate
      )
      .on(
        'presence',
        { event: 'sync' },
        () => {
          const newState = channel.presenceState();
          updatePresenceFromState(newState);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [familyId]);

  return { activities, presence };
}
```

#### Backend Real-Time Event Broadcasting
```python
# services/collaboration_service.py
class CollaborationService:

    @staticmethod
    async def broadcast_activity_update(
        family_id: str,
        activity: Activity,
        action: str
    ):
        """Broadcast activity changes to all family members"""
        try:
            # Create real-time payload
            payload = {
                'type': 'activity_update',
                'action': action,
                'activity': {
                    'id': str(activity.id),
                    'child_id': str(activity.child_id),
                    'activity_type': activity.activity_type,
                    'logged_at': activity.logged_at.isoformat(),
                    'logged_by': activity.logged_by_user_id
                },
                'family_id': family_id,
                'timestamp': datetime.utcnow().isoformat()
            }

            # Broadcast via Supabase
            await supabase_admin.table('collaboration_events').insert(payload)

        except Exception as e:
            logger.error(f"Failed to broadcast activity update: {e}")

    @staticmethod
    async def update_caregiver_presence(
        user_id: str,
        family_id: str,
        status: str,
        current_activity: str = None,
        child_id: str = None
    ):
        """Update and broadcast caregiver presence"""
        async for session in get_async_session():
            # Upsert presence record
            presence_data = {
                'user_id': user_id,
                'family_id': family_id,
                'status': status,
                'current_activity': current_activity,
                'child_id': child_id,
                'last_seen': datetime.utcnow()
            }

            await session.execute(
                insert(CaregiverPresence)
                .values(presence_data)
                .on_conflict_do_update(
                    index_elements=['user_id', 'family_id'],
                    set_=presence_data
                )
            )
            await session.commit()

            # Broadcast presence change
            await broadcast_presence_update(family_id, presence_data)
```

### Conflict Resolution Strategy

#### Activity Logging Conflicts
```python
class ActivityConflictResolver:

    @staticmethod
    async def resolve_concurrent_activities(
        activity1: Activity,
        activity2: Activity
    ) -> Activity:
        """Resolve conflicts when multiple caregivers log activities simultaneously"""

        # Rule 1: Diaper changes within 5 minutes - merge into single event
        if (activity1.activity_type == 'diaper_change' and
            activity2.activity_type == 'diaper_change' and
            abs((activity1.logged_at - activity2.logged_at).total_seconds()) < 300):

            return merge_diaper_activities(activity1, activity2)

        # Rule 2: Feeding activities - last logged wins with note
        if (activity1.activity_type == 'feeding' and
            activity2.activity_type == 'feeding'):

            return resolve_feeding_conflict(activity1, activity2)

        # Rule 3: Different activity types - both preserved with timestamp order
        return preserve_both_activities(activity1, activity2)

    @staticmethod
    def merge_diaper_activities(activity1: Activity, activity2: Activity) -> Activity:
        """Merge concurrent diaper change activities"""
        earlier = activity1 if activity1.logged_at < activity2.logged_at else activity2
        later = activity2 if activity1.logged_at < activity2.logged_at else activity1

        merged_metadata = {
            **earlier.metadata,
            'merged_from_activities': [str(earlier.id), str(later.id)],
            'caregivers_involved': [earlier.logged_by_user_id, later.logged_by_user_id],
            'conflict_resolution': 'merged_concurrent_diaper_changes'
        }

        earlier.metadata = merged_metadata
        earlier.collaboration_metadata = {
            'conflict_resolved': True,
            'resolution_type': 'merge',
            'resolved_at': datetime.utcnow().isoformat()
        }

        return earlier
```

### Presence Tracking System

```typescript
// Frontend presence management
class PresenceManager {
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private currentPresence: CaregiverPresence | null = null;

  async startPresenceTracking(familyId: string, initialStatus: PresenceStatus) {
    // Initialize presence
    await this.updatePresence(familyId, initialStatus);

    // Start heartbeat every 30 seconds
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat(familyId);
    }, 30000);

    // Handle app state changes
    AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        this.updatePresence(familyId, 'online');
      } else if (nextAppState === 'background') {
        this.updatePresence(familyId, 'away');
      }
    });
  }

  async updatePresence(
    familyId: string,
    status: PresenceStatus,
    currentActivity?: string,
    childId?: string
  ) {
    try {
      const response = await apolloClient.mutate({
        mutation: UPDATE_CAREGIVER_PRESENCE,
        variables: {
          input: {
            familyId,
            status,
            currentActivity,
            childId,
            deviceInfo: {
              platform: Platform.OS,
              version: Platform.Version,
              model: await DeviceInfo.getModel()
            }
          }
        }
      });

      this.currentPresence = response.data.updateCaregiverPresence.presence;
    } catch (error) {
      console.error('Failed to update presence:', error);
    }
  }

  stopPresenceTracking() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Mark as offline
    if (this.currentPresence) {
      this.updatePresence(this.currentPresence.family.id, 'offline');
    }
  }
}
```

---

## Row Level Security (RLS) Policies

### Family-Based Access Policies

```sql
-- Policy 1: Family access based on membership
CREATE POLICY family_member_access ON families
FOR ALL TO authenticated
USING (
    id IN (
        SELECT family_id
        FROM family_members
        WHERE user_id = auth.uid()
        AND status = 'active'
        AND (access_expires_at IS NULL OR access_expires_at > NOW())
    )
);

-- Policy 2: Children access through family membership
CREATE POLICY family_children_access ON children
FOR SELECT TO authenticated
USING (
    family_id IN (
        SELECT family_id
        FROM family_members
        WHERE user_id = auth.uid()
        AND status = 'active'
    )
);

-- Policy 3: Role-based children modification
CREATE POLICY family_children_update ON children
FOR UPDATE TO authenticated
USING (
    family_id IN (
        SELECT fm.family_id
        FROM family_members fm
        WHERE fm.user_id = auth.uid()
        AND fm.status = 'active'
        AND fm.role IN ('family_core', 'extended_family')
    )
);

-- Policy 4: Activity logging permissions
CREATE POLICY family_activity_create ON activities
FOR INSERT TO authenticated
WITH CHECK (
    child_id IN (
        SELECT fca.child_id
        FROM family_child_access fca
        JOIN family_members fm ON fm.family_id = fca.family_id
        WHERE fm.user_id = auth.uid()
        AND fm.status = 'active'
    )
);

-- Policy 5: Activity viewing with role restrictions
CREATE POLICY family_activity_view ON activities
FOR SELECT TO authenticated
USING (
    CASE
        WHEN EXISTS (
            SELECT 1 FROM family_members fm
            JOIN family_child_access fca ON fm.family_id = fca.family_id
            WHERE fm.user_id = auth.uid()
            AND fm.role = 'institutional'
            AND fca.child_id = activities.child_id
        ) THEN
            -- Institutional users: only current day
            DATE(activities.logged_at) = CURRENT_DATE
        ELSE
            -- All other roles: full access
            child_id IN (
                SELECT fca.child_id
                FROM family_child_access fca
                JOIN family_members fm ON fm.family_id = fca.family_id
                WHERE fm.user_id = auth.uid()
                AND fm.status = 'active'
            )
    END
);

-- Policy 6: Invitation management (Family Core only)
CREATE POLICY family_core_invitations ON caregiver_invitations
FOR ALL TO authenticated
USING (
    family_id IN (
        SELECT family_id
        FROM family_members
        WHERE user_id = auth.uid()
        AND role = 'family_core'
        AND status = 'active'
    )
);

-- Policy 7: Member management restrictions
CREATE POLICY family_member_management ON family_members
FOR UPDATE TO authenticated
USING (
    -- Only Family Core can modify other members
    family_id IN (
        SELECT family_id
        FROM family_members
        WHERE user_id = auth.uid()
        AND role = 'family_core'
        AND status = 'active'
    )
    OR
    -- Users can update their own record (limited fields)
    user_id = auth.uid()
);

-- Policy 8: Collaboration logs access
CREATE POLICY collaboration_logs_access ON collaboration_logs
FOR SELECT TO authenticated
USING (
    family_id IN (
        SELECT fm.family_id
        FROM family_members fm
        WHERE fm.user_id = auth.uid()
        AND fm.status = 'active'
        AND fm.role IN ('family_core', 'extended_family')
    )
);
```

### Time-Based Access Controls

```sql
-- Function to check time-based restrictions for institutional users
CREATE OR REPLACE FUNCTION check_institutional_time_access(
    user_id UUID,
    family_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    member_record family_members%ROWTYPE;
    session_start TIMESTAMP;
    max_session_hours INTEGER := 8;
BEGIN
    -- Get member record
    SELECT * INTO member_record
    FROM family_members fm
    WHERE fm.user_id = user_id
    AND fm.family_id = family_id
    AND fm.role = 'institutional';

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Check if access has expired
    IF member_record.access_expires_at IS NOT NULL
       AND member_record.access_expires_at < NOW() THEN
        RETURN FALSE;
    END IF;

    -- Get latest session start from presence table
    SELECT MIN(last_seen) INTO session_start
    FROM caregiver_presence cp
    WHERE cp.user_id = user_id
    AND cp.family_id = family_id
    AND DATE(cp.last_seen) = CURRENT_DATE;

    -- Check session duration
    IF session_start IS NOT NULL
       AND EXTRACT(EPOCH FROM (NOW() - session_start)) / 3600 > max_session_hours THEN
        RETURN FALSE;
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Policy using time-based function
CREATE POLICY institutional_time_access ON activities
FOR ALL TO authenticated
USING (
    CASE
        WHEN EXISTS (
            SELECT 1 FROM family_members fm
            JOIN family_child_access fca ON fm.family_id = fca.family_id
            WHERE fm.user_id = auth.uid()
            AND fm.role = 'institutional'
            AND fca.child_id = activities.child_id
        ) THEN
            check_institutional_time_access(auth.uid(),
                (SELECT fm.family_id FROM family_members fm
                 JOIN family_child_access fca ON fm.family_id = fca.family_id
                 WHERE fm.user_id = auth.uid() AND fca.child_id = activities.child_id
                 LIMIT 1)
            )
        ELSE TRUE
    END
);
```

---

## Migration Strategy

### Four-Phase Implementation Plan

#### Phase 1: Schema Extension (Non-Breaking)
**Timeline**: Week 1-2
**Goal**: Add new tables without affecting existing functionality

```sql
-- Migration 001: Create collaboration tables
-- File: alembic/versions/20250916_1400_add_collaboration_tables.py

"""Add collaboration tables for family-based caregiving

Revision ID: 20250916_1400
Revises: previous_revision
Create Date: 2025-09-16 14:00:00.000000

"""

def upgrade():
    # Create all new tables
    op.execute('''
        CREATE TYPE family_type_enum AS ENUM ('personal', 'standard', 'institutional');
        CREATE TYPE member_role_enum AS ENUM ('family_core', 'extended_family', 'professional', 'institutional');
        -- ... (all new table creation SQL)
    ''')

    # Add nullable family columns to existing tables
    op.add_column('children', sa.Column('family_id', UUID, nullable=True))
    op.add_column('children', sa.Column('migrated_from_user', UUID, nullable=True))
    op.add_column('activities', sa.Column('logged_by_user_id', UUID, nullable=True))

    # Create indexes for performance
    op.create_index('idx_children_family', 'children', ['family_id'])
    op.create_index('idx_activities_logged_by', 'activities', ['logged_by_user_id'])

def downgrade():
    # Reverse all changes
    op.drop_column('children', 'family_id')
    # ... (complete rollback)
```

#### Phase 2: Data Migration (Background Process)
**Timeline**: Week 3
**Goal**: Create families for existing users and migrate data relationships

```python
# scripts/migrate_users_to_families.py

async def migrate_existing_users():
    """Create personal families for all existing users"""

    async for session in get_async_session():
        # Get all users who don't have families yet
        users_result = await session.execute(
            select(User).where(
                ~exists().where(
                    and_(
                        FamilyMember.user_id == User.id,
                        FamilyMember.role == 'family_core'
                    )
                )
            )
        )
        users = users_result.scalars().all()

        for user in users:
            try:
                # Create personal family
                family = Family(
                    name=f"{user.display_name or 'Personal'} Family",
                    family_type='personal',
                    created_by=user.id
                )
                session.add(family)
                await session.flush()  # Get family ID

                # Add user as Family Core member
                family_member = FamilyMember(
                    user_id=user.id,
                    family_id=family.id,
                    role='family_core',
                    joined_at=user.created_at or datetime.utcnow()
                )
                session.add(family_member)

                # Migrate children to family
                children_result = await session.execute(
                    select(Child).where(Child.user_id == user.id)
                )
                children = children_result.scalars().all()

                for child in children:
                    # Update child family relationship
                    child.family_id = family.id
                    child.migrated_from_user = user.id

                    # Create family-child access record
                    child_access = FamilyChildAccess(
                        family_id=family.id,
                        child_id=child.id,
                        access_level='full',
                        granted_by=user.id
                    )
                    session.add(child_access)

                # Update activities
                activities_result = await session.execute(
                    select(Activity).join(Child).where(Child.user_id == user.id)
                )
                activities = activities_result.scalars().all()

                for activity in activities:
                    activity.logged_by_user_id = user.id

                await session.commit()
                logger.info(f"Migrated user {user.id} to family {family.id}")

            except Exception as e:
                await session.rollback()
                logger.error(f"Failed to migrate user {user.id}: {e}")
                raise

async def validate_migration():
    """Validate that all users have been successfully migrated"""
    async for session in get_async_session():
        # Check for unmigrated users
        unmigrated = await session.execute(
            select(func.count(User.id)).where(
                ~exists().where(
                    FamilyMember.user_id == User.id
                )
            )
        )
        unmigrated_count = unmigrated.scalar()

        if unmigrated_count > 0:
            raise ValidationError(f"{unmigrated_count} users not migrated")

        # Check for orphaned children
        orphaned = await session.execute(
            select(func.count(Child.id)).where(Child.family_id.is_(None))
        )
        orphaned_count = orphaned.scalar()

        if orphaned_count > 0:
            raise ValidationError(f"{orphaned_count} children not migrated")

        logger.info("Migration validation successful")
```

#### Phase 3: Code Migration (Gradual)
**Timeline**: Week 4-5
**Goal**: Update GraphQL resolvers and add collaboration features

```python
# Updated resolvers with backward compatibility

@strawberry.field
async def my_children(self, info: Info) -> ChildConnection:
    """Get children accessible to current user (family-aware)"""
    user_id = get_user_id_from_context(info)

    async for session in get_async_session():
        # Get children through family memberships
        result = await session.execute(
            select(Child)
            .join(FamilyChildAccess, Child.id == FamilyChildAccess.child_id)
            .join(FamilyMember, FamilyChildAccess.family_id == FamilyMember.family_id)
            .where(
                FamilyMember.user_id == user_id,
                FamilyMember.status == 'active'
            )
            .order_by(Child.created_at.desc())
        )
        children = result.scalars().all()

        return ChildConnection(
            nodes=[ChildProfile.from_orm(child) for child in children],
            total_count=len(children)
        )

# New collaboration resolver
@strawberry.field
async def my_families(self, info: Info) -> FamilyConnection:
    """Get families where current user is a member"""
    user_id = get_user_id_from_context(info)

    async for session in get_async_session():
        result = await session.execute(
            select(Family)
            .join(FamilyMember)
            .where(
                FamilyMember.user_id == user_id,
                FamilyMember.status == 'active'
            )
            .order_by(FamilyMember.joined_at.desc())
        )
        families = result.scalars().all()

        return FamilyConnection(
            nodes=[FamilyProfile.from_orm(family) for family in families],
            total_count=len(families)
        )
```

#### Phase 4: Schema Cleanup (Breaking Changes)
**Timeline**: Week 6
**Goal**: Remove deprecated columns and finalize schema

```sql
-- Migration 002: Remove deprecated columns
-- File: alembic/versions/20250923_1400_cleanup_migration.py

def upgrade():
    # Verify all data is migrated
    connection = op.get_bind()

    # Check for unmigrated children
    result = connection.execute(
        "SELECT COUNT(*) FROM children WHERE family_id IS NULL"
    )
    unmigrated_count = result.fetchone()[0]

    if unmigrated_count > 0:
        raise Exception(f"Cannot proceed: {unmigrated_count} children not migrated")

    # Make family_id NOT NULL
    op.alter_column('children', 'family_id', nullable=False)

    # Remove deprecated user_id column
    op.drop_constraint('children_user_id_fkey', 'children')
    op.drop_column('children', 'user_id')

    # Clean up temporary migration columns
    op.drop_column('children', 'migrated_from_user')
```

---

## Backend Implementation Specifications

### FastAPI Integration Points

#### New Dependency Injection
```python
# app/auth/dependencies.py

from app.services.collaboration_service import CollaborationService

async def get_family_context(
    family_id: str = Header(None),
    current_user: User = Depends(get_current_user)
) -> FamilyContext:
    """Get family context for collaboration features"""
    if not family_id:
        raise HTTPException(status_code=400, detail="Family ID required")

    # Verify user has access to family
    has_access = await CollaborationService.check_family_access(
        current_user.id, family_id
    )

    if not has_access:
        raise HTTPException(status_code=403, detail="Access denied to family")

    # Get user's role and permissions
    role = await CollaborationService.get_user_role(current_user.id, family_id)
    permissions = await CollaborationService.get_user_permissions(
        current_user.id, family_id
    )

    return FamilyContext(
        family_id=family_id,
        user=current_user,
        role=role,
        permissions=permissions
    )

@dataclass
class FamilyContext:
    family_id: str
    user: User
    role: str
    permissions: dict
```

#### Collaboration Service Layer
```python
# app/services/collaboration_service.py

class CollaborationService:

    @staticmethod
    async def create_family(
        creator_id: str,
        name: str,
        family_type: str = 'standard',
        description: str = None
    ) -> Family:
        """Create a new family with creator as Family Core member"""
        async for session in get_async_session():
            try:
                # Create family
                family = Family(
                    name=name,
                    family_type=family_type,
                    description=description,
                    created_by=creator_id
                )
                session.add(family)
                await session.flush()

                # Add creator as Family Core member
                family_member = FamilyMember(
                    user_id=creator_id,
                    family_id=family.id,
                    role='family_core'
                )
                session.add(family_member)

                # Log family creation
                await CollaborationLogService.log_action(
                    family_id=family.id,
                    actor_user_id=creator_id,
                    action_type='family_created',
                    details={'family_name': name, 'family_type': family_type}
                )

                await session.commit()
                return family

            except Exception as e:
                await session.rollback()
                logger.error(f"Failed to create family: {e}")
                raise

    @staticmethod
    async def invite_caregiver(
        family_id: str,
        inviter_id: str,
        email: str,
        role: str,
        access_restrictions: dict = None
    ) -> CaregiverInvitation:
        """Send invitation to join family as caregiver"""

        # Verify inviter has permission
        can_invite = await CollaborationPermissionService.check_family_access(
            inviter_id, family_id, 'invite_members'
        )
        if not can_invite:
            raise PermissionError("Cannot invite members to this family")

        async for session in get_async_session():
            try:
                # Generate secure invitation token
                invitation_token = secrets.token_urlsafe(32)
                expires_at = datetime.utcnow() + timedelta(days=7)

                invitation = CaregiverInvitation(
                    family_id=family_id,
                    email=email,
                    role=role,
                    invitation_token=invitation_token,
                    invited_by=inviter_id,
                    expires_at=expires_at,
                    access_restrictions=access_restrictions or {}
                )
                session.add(invitation)

                # Log invitation
                await CollaborationLogService.log_action(
                    family_id=family_id,
                    actor_user_id=inviter_id,
                    action_type='member_invited',
                    details={
                        'invited_email': email,
                        'role': role,
                        'expires_at': expires_at.isoformat()
                    }
                )

                await session.commit()

                # Send invitation email
                await EmailService.send_caregiver_invitation(
                    email=email,
                    family_name=(await get_family_name(family_id)),
                    inviter_name=(await get_user_name(inviter_id)),
                    invitation_token=invitation_token,
                    role=role
                )

                return invitation

            except Exception as e:
                await session.rollback()
                logger.error(f"Failed to create invitation: {e}")
                raise

    @staticmethod
    async def accept_invitation(
        invitation_token: str,
        accepter_id: str
    ) -> FamilyMember:
        """Accept caregiver invitation and join family"""
        async for session in get_async_session():
            try:
                # Get valid invitation
                result = await session.execute(
                    select(CaregiverInvitation)
                    .where(
                        CaregiverInvitation.invitation_token == invitation_token,
                        CaregiverInvitation.status == 'pending',
                        CaregiverInvitation.expires_at > datetime.utcnow()
                    )
                )
                invitation = result.scalar_one_or_none()

                if not invitation:
                    raise ValueError("Invalid or expired invitation")

                # Check if user email matches invitation
                user = await session.get(User, accepter_id)
                if user.email != invitation.email:
                    raise ValueError("Email mismatch")

                # Create family membership
                family_member = FamilyMember(
                    user_id=accepter_id,
                    family_id=invitation.family_id,
                    role=invitation.role,
                    invited_by=invitation.invited_by,
                    permissions=generate_permissions_for_role(invitation.role)
                )
                session.add(family_member)

                # Update invitation status
                invitation.status = 'accepted'
                invitation.accepted_at = datetime.utcnow()
                invitation.accepted_by = accepter_id

                # Log membership
                await CollaborationLogService.log_action(
                    family_id=invitation.family_id,
                    actor_user_id=accepter_id,
                    action_type='member_joined',
                    details={
                        'role': invitation.role,
                        'invited_by': invitation.invited_by
                    }
                )

                await session.commit()

                # Broadcast membership change
                await broadcast_membership_update(
                    invitation.family_id, family_member, 'joined'
                )

                return family_member

            except Exception as e:
                await session.rollback()
                logger.error(f"Failed to accept invitation: {e}")
                raise
```

### GraphQL Resolver Implementation

```python
# app/graphql/resolvers/collaboration_resolvers.py

@strawberry.type
class CollaborationMutations:

    @strawberry.mutation
    async def create_family(
        self,
        input: CreateFamilyInput,
        info: Info
    ) -> CreateFamilyResponse:
        """Create a new family for collaboration"""
        try:
            user_id = get_user_id_from_context(info)

            family = await CollaborationService.create_family(
                creator_id=user_id,
                name=input.name,
                family_type=input.family_type or 'standard',
                description=input.description
            )

            return CreateFamilyResponse(
                success=True,
                family=FamilyProfile.from_orm(family),
                message="Family created successfully"
            )

        except Exception as e:
            logger.error(f"Error creating family: {e}")
            return CreateFamilyResponse(
                success=False,
                error=f"Failed to create family: {str(e)}"
            )

    @strawberry.mutation
    async def invite_caregiver(
        self,
        input: InviteCaregiverInput,
        info: Info
    ) -> InviteCaregiverResponse:
        """Invite a caregiver to join family"""
        try:
            user_id = get_user_id_from_context(info)

            invitation = await CollaborationService.invite_caregiver(
                family_id=input.family_id,
                inviter_id=user_id,
                email=input.email,
                role=input.role,
                access_restrictions=input.access_restrictions
            )

            return InviteCaregiverResponse(
                success=True,
                invitation=CaregiverInvitationProfile.from_orm(invitation),
                message=f"Invitation sent to {input.email}"
            )

        except PermissionError as e:
            return InviteCaregiverResponse(
                success=False,
                error="Permission denied: Cannot invite members"
            )
        except Exception as e:
            logger.error(f"Error inviting caregiver: {e}")
            return InviteCaregiverResponse(
                success=False,
                error=f"Failed to send invitation: {str(e)}"
            )

    @strawberry.mutation
    async def log_family_activity(
        self,
        input: FamilyActivityInput,
        info: Info
    ) -> LogActivityResponse:
        """Log activity in family context with collaboration features"""
        try:
            user_id = get_user_id_from_context(info)

            # Verify family access
            has_access = await CollaborationPermissionService.check_family_access(
                user_id, input.family_id, 'log_activity'
            )
            if not has_access:
                raise PermissionError("Cannot log activities for this family")

            # Check for concurrent activities and resolve conflicts
            concurrent_activities = await detect_concurrent_activities(
                input.child_id, input.activity_type, input.logged_at
            )

            if concurrent_activities:
                resolved_activity = await ActivityConflictResolver.resolve_concurrent_activities(
                    concurrent_activities, input
                )
                activity = resolved_activity
            else:
                # Create new activity
                activity = await ActivityService.create_activity(
                    child_id=input.child_id,
                    activity_type=input.activity_type,
                    logged_at=input.logged_at,
                    logged_by_user_id=user_id,
                    metadata=input.metadata,
                    collaboration_metadata={
                        'family_context': True,
                        'logged_via_collaboration': True
                    }
                )

            # Broadcast real-time update to family members
            await CollaborationService.broadcast_activity_update(
                input.family_id, activity, 'created'
            )

            # Log collaboration action
            await CollaborationLogService.log_action(
                family_id=input.family_id,
                actor_user_id=user_id,
                action_type='activity_logged',
                target_type='activity',
                target_id=activity.id,
                details={
                    'activity_type': input.activity_type,
                    'child_id': input.child_id
                }
            )

            return LogActivityResponse(
                success=True,
                activity=ActivityProfile.from_orm(activity),
                message="Activity logged successfully"
            )

        except PermissionError as e:
            return LogActivityResponse(
                success=False,
                error=f"Permission denied: {str(e)}"
            )
        except Exception as e:
            logger.error(f"Error logging family activity: {e}")
            return LogActivityResponse(
                success=False,
                error=f"Failed to log activity: {str(e)}"
            )
```

---

## Frontend Implementation Specifications

### State Management Extensions

#### Zustand Store for Collaboration
```typescript
// stores/collaborationStore.ts

interface CollaborationState {
  // Family data
  families: Family[];
  currentFamily: Family | null;
  familyMembers: Map<string, FamilyMember[]>;

  // Real-time collaboration
  activePresence: Map<string, CaregiverPresence[]>;
  realtimeConnections: Map<string, RealtimeChannel>;

  // Invitation management
  pendingInvitations: CaregiverInvitation[];
  sentInvitations: Map<string, CaregiverInvitation[]>;

  // Collaboration state
  conflictResolutions: ConflictResolution[];
  collaborationLogs: CollaborationLog[];

  // Actions
  setCurrentFamily: (family: Family) => void;
  addFamilyMember: (familyId: string, member: FamilyMember) => void;
  updatePresence: (familyId: string, presence: CaregiverPresence) => void;
  addPendingInvitation: (invitation: CaregiverInvitation) => void;
  acceptInvitation: (token: string) => Promise<void>;
  createFamily: (input: CreateFamilyInput) => Promise<Family>;
  inviteCaregiver: (input: InviteCaregiverInput) => Promise<void>;

  // Real-time management
  connectToFamily: (familyId: string) => void;
  disconnectFromFamily: (familyId: string) => void;
  updateMyPresence: (familyId: string, status: PresenceStatus) => void;
}

export const useCollaborationStore = create<CollaborationState>((set, get) => ({
  families: [],
  currentFamily: null,
  familyMembers: new Map(),
  activePresence: new Map(),
  realtimeConnections: new Map(),
  pendingInvitations: [],
  sentInvitations: new Map(),
  conflictResolutions: [],
  collaborationLogs: [],

  setCurrentFamily: (family) => {
    set({ currentFamily: family });

    // Connect to real-time updates for this family
    get().connectToFamily(family.id);
  },

  addFamilyMember: (familyId, member) => {
    const familyMembers = get().familyMembers;
    const existingMembers = familyMembers.get(familyId) || [];
    familyMembers.set(familyId, [...existingMembers, member]);
    set({ familyMembers: new Map(familyMembers) });
  },

  updatePresence: (familyId, presence) => {
    const activePresence = get().activePresence;
    const existingPresence = activePresence.get(familyId) || [];
    const updatedPresence = existingPresence.filter(p => p.user.id !== presence.user.id);
    updatedPresence.push(presence);
    activePresence.set(familyId, updatedPresence);
    set({ activePresence: new Map(activePresence) });
  },

  connectToFamily: (familyId) => {
    const connections = get().realtimeConnections;

    if (connections.has(familyId)) {
      return; // Already connected
    }

    const channel = supabase
      .channel(`family_${familyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activities',
          filter: `family_id=eq.${familyId}`
        },
        (payload) => {
          // Handle activity updates
          handleRealtimeActivityUpdate(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'caregiver_presence',
          filter: `family_id=eq.${familyId}`
        },
        (payload) => {
          // Handle presence updates
          handleRealtimePresenceUpdate(payload);
        }
      )
      .on(
        'presence',
        { event: 'sync' },
        () => {
          const presenceState = channel.presenceState();
          updatePresenceFromState(familyId, presenceState);
        }
      )
      .subscribe();

    connections.set(familyId, channel);
    set({ realtimeConnections: new Map(connections) });
  },

  disconnectFromFamily: (familyId) => {
    const connections = get().realtimeConnections;
    const channel = connections.get(familyId);

    if (channel) {
      supabase.removeChannel(channel);
      connections.delete(familyId);
      set({ realtimeConnections: new Map(connections) });
    }
  },

  createFamily: async (input) => {
    try {
      const response = await apolloClient.mutate({
        mutation: CREATE_FAMILY,
        variables: { input }
      });

      if (response.data.createFamily.success) {
        const newFamily = response.data.createFamily.family;
        set(state => ({
          families: [...state.families, newFamily]
        }));
        return newFamily;
      } else {
        throw new Error(response.data.createFamily.error);
      }
    } catch (error) {
      console.error('Failed to create family:', error);
      throw error;
    }
  },

  inviteCaregiver: async (input) => {
    try {
      const response = await apolloClient.mutate({
        mutation: INVITE_CAREGIVER,
        variables: { input }
      });

      if (response.data.inviteCaregiver.success) {
        const invitation = response.data.inviteCaregiver.invitation;

        // Add to sent invitations
        const sentInvitations = get().sentInvitations;
        const familyInvitations = sentInvitations.get(input.familyId) || [];
        familyInvitations.push(invitation);
        sentInvitations.set(input.familyId, familyInvitations);

        set({ sentInvitations: new Map(sentInvitations) });
      } else {
        throw new Error(response.data.inviteCaregiver.error);
      }
    } catch (error) {
      console.error('Failed to invite caregiver:', error);
      throw error;
    }
  }
}));
```

#### Apollo Client Cache Updates
```typescript
// lib/graphql/cache-updates.ts

export const updateCacheAfterFamilyActivity = (
  cache: ApolloCache<any>,
  familyId: string,
  newActivity: Activity
) => {
  // Update family activity stream
  const familyActivityQuery = {
    query: GET_FAMILY_ACTIVITY_STREAM,
    variables: { familyId }
  };

  try {
    const existingData = cache.readQuery(familyActivityQuery);

    if (existingData) {
      cache.writeQuery({
        ...familyActivityQuery,
        data: {
          familyActivityStream: {
            ...existingData.familyActivityStream,
            nodes: [newActivity, ...existingData.familyActivityStream.nodes],
            totalCount: existingData.familyActivityStream.totalCount + 1
          }
        }
      });
    }
  } catch (error) {
    console.warn('Could not update family activity cache:', error);
  }

  // Update child's activity list if cached
  try {
    const childActivityQuery = {
      query: GET_CHILD_ACTIVITIES,
      variables: { childId: newActivity.childId }
    };

    const childData = cache.readQuery(childActivityQuery);

    if (childData) {
      cache.writeQuery({
        ...childActivityQuery,
        data: {
          childActivities: {
            ...childData.childActivities,
            nodes: [newActivity, ...childData.childActivities.nodes]
          }
        }
      });
    }
  } catch (error) {
    console.warn('Could not update child activity cache:', error);
  }
};

export const updateCacheAfterMembershipChange = (
  cache: ApolloCache<any>,
  familyId: string,
  member: FamilyMember,
  action: 'added' | 'removed' | 'updated'
) => {
  const familyMembersQuery = {
    query: GET_FAMILY_MEMBERS,
    variables: { familyId }
  };

  try {
    const existingData = cache.readQuery(familyMembersQuery);

    if (existingData) {
      let updatedMembers;

      switch (action) {
        case 'added':
          updatedMembers = [...existingData.familyMembers.nodes, member];
          break;
        case 'removed':
          updatedMembers = existingData.familyMembers.nodes.filter(
            (m: FamilyMember) => m.id !== member.id
          );
          break;
        case 'updated':
          updatedMembers = existingData.familyMembers.nodes.map(
            (m: FamilyMember) => m.id === member.id ? member : m
          );
          break;
      }

      cache.writeQuery({
        ...familyMembersQuery,
        data: {
          familyMembers: {
            ...existingData.familyMembers,
            nodes: updatedMembers,
            totalCount: updatedMembers.length
          }
        }
      });
    }
  } catch (error) {
    console.warn('Could not update family members cache:', error);
  }
};
```

### UI Components for Collaboration

#### Family Selector Component
```typescript
// components/collaboration/FamilySelector.tsx

interface FamilySelectorProps {
  selectedFamilyId?: string;
  onFamilyChange: (family: Family) => void;
  showCreateOption?: boolean;
}

export function FamilySelector({
  selectedFamilyId,
  onFamilyChange,
  showCreateOption = true
}: FamilySelectorProps) {
  const { families, currentFamily } = useCollaborationStore();
  const { theme, colors } = useTheme();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data, loading, error } = useQuery(GET_MY_FAMILIES);

  useEffect(() => {
    if (data?.myFamilies?.nodes) {
      // Update local store
      useCollaborationStore.setState({ families: data.myFamilies.nodes });
    }
  }, [data]);

  const handleFamilySelect = (family: Family) => {
    onFamilyChange(family);
    useCollaborationStore.getState().setCurrentFamily(family);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Loading families...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={[styles.errorText, { color: colors.error }]}>
          Failed to load families
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text }]}>
        Active Family
      </Text>

      <TouchableOpacity
        style={[
          styles.selectorButton,
          {
            backgroundColor: colors.card,
            borderColor: colors.border
          }
        ]}
        onPress={() => {/* Open family picker */}}
      >
        <View style={styles.selectedFamily}>
          <Text style={[styles.familyName, { color: colors.text }]}>
            {currentFamily?.name || 'Select Family'}
          </Text>
          {currentFamily && (
            <View style={styles.familyInfo}>
              <Text style={[styles.memberCount, { color: colors.textSecondary }]}>
                {currentFamily.members?.totalCount || 0} members
              </Text>
              <Text style={[styles.familyType, { color: colors.textSecondary }]}>
                {currentFamily.familyType.toLowerCase()}
              </Text>
            </View>
          )}
        </View>

        <Icon
          name="chevron-down"
          size={20}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      {showCreateOption && (
        <TouchableOpacity
          style={[styles.createButton, { borderColor: colors.primary }]}
          onPress={() => setShowCreateModal(true)}
        >
          <Icon name="plus" size={16} color={colors.primary} />
          <Text style={[styles.createButtonText, { color: colors.primary }]}>
            Create New Family
          </Text>
        </TouchableOpacity>
      )}

      <CreateFamilyModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onFamilyCreated={handleFamilySelect}
      />
    </View>
  );
}
```

#### Real-Time Presence Indicator
```typescript
// components/collaboration/PresenceIndicator.tsx

interface PresenceIndicatorProps {
  familyId: string;
  childId?: string;
  showDetails?: boolean;
}

export function PresenceIndicator({
  familyId,
  childId,
  showDetails = false
}: PresenceIndicatorProps) {
  const { activePresence } = useCollaborationStore();
  const { colors } = useTheme();

  const presence = activePresence.get(familyId) || [];
  const activePresence = presence.filter(p =>
    p.status !== 'offline' && (!childId || p.child?.id === childId)
  );

  if (activePresence.length === 0) {
    return null;
  }

  return (
    <View style={styles.presenceContainer}>
      <View style={styles.indicatorRow}>
        {activePresence.slice(0, 3).map((p, index) => (
          <View
            key={p.user.id}
            style={[
              styles.presenceAvatar,
              {
                backgroundColor: getStatusColor(p.status),
                marginLeft: index > 0 ? -8 : 0,
                zIndex: activePresence.length - index
              }
            ]}
          >
            <Text style={styles.avatarText}>
              {p.user.displayName?.[0]?.toUpperCase() || 'U'}
            </Text>
          </View>
        ))}

        {activePresence.length > 3 && (
          <View style={[styles.moreIndicator, { backgroundColor: colors.card }]}>
            <Text style={[styles.moreText, { color: colors.text }]}>
              +{activePresence.length - 3}
            </Text>
          </View>
        )}
      </View>

      {showDetails && (
        <View style={styles.detailsContainer}>
          {activePresence.map(p => (
            <View key={p.user.id} style={styles.presenceDetail}>
              <View style={[
                styles.statusDot,
                { backgroundColor: getStatusColor(p.status) }
              ]} />
              <Text style={[styles.userName, { color: colors.text }]}>
                {p.user.displayName}
              </Text>
              {p.currentActivity && (
                <Text style={[styles.activity, { color: colors.textSecondary }]}>
                  {p.currentActivity}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function getStatusColor(status: PresenceStatus): string {
  switch (status) {
    case 'online': return '#10B981'; // green
    case 'away': return '#F59E0B';   // yellow
    case 'caring': return '#3B82F6'; // blue
    default: return '#6B7280';       // gray
  }
}
```

---

## Security and Compliance Implementation

### PIPEDA Compliance Extensions

#### Enhanced Audit Logging
```python
# app/services/pipeda_audit_service.py

class PIPEDAAuditService:

    @staticmethod
    async def log_data_access(
        user_id: str,
        family_id: str,
        data_type: str,
        access_purpose: str,
        data_elements: List[str],
        request_info: dict
    ):
        """Log data access for PIPEDA compliance"""
        async for session in get_async_session():
            audit_log = PIPEDAAuditLog(
                user_id=user_id,
                family_id=family_id,
                action_type='data_access',
                data_type=data_type,
                access_purpose=access_purpose,
                data_elements=data_elements,
                ip_address=request_info.get('ip_address'),
                user_agent=request_info.get('user_agent'),
                session_id=request_info.get('session_id'),
                compliance_metadata={
                    'pipeda_version': '2.0',
                    'consent_level': await get_user_consent_level(user_id, family_id),
                    'data_residency': 'canada',
                    'retention_policy': await get_retention_policy(family_id)
                }
            )
            session.add(audit_log)
            await session.commit()

    @staticmethod
    async def generate_family_data_report(
        family_id: str,
        requester_id: str,
        report_type: str = 'comprehensive'
    ) -> dict:
        """Generate comprehensive family data report for PIPEDA rights"""

        # Verify requester has permission
        has_permission = await CollaborationPermissionService.check_family_access(
            requester_id, family_id, 'export_data'
        )

        if not has_permission:
            raise PermissionError("Insufficient permissions for data export")

        async for session in get_async_session():
            # Collect all family data
            report_data = {
                'family_information': await collect_family_info(session, family_id),
                'member_information': await collect_member_info(session, family_id),
                'children_data': await collect_children_data(session, family_id),
                'activity_logs': await collect_activity_data(session, family_id),
                'collaboration_history': await collect_collaboration_data(session, family_id),
                'audit_trails': await collect_audit_data(session, family_id),
                'consent_records': await collect_consent_data(session, family_id),
                'data_sharing_history': await collect_sharing_data(session, family_id)
            }

            # Add metadata
            report_data['metadata'] = {
                'generated_at': datetime.utcnow().isoformat(),
                'generated_by': requester_id,
                'report_type': report_type,
                'data_residency': 'Canada',
                'pipeda_compliance_version': '2.0',
                'retention_policies': await get_all_retention_policies(family_id)
            }

            # Log data export
            await PIPEDAAuditService.log_data_access(
                user_id=requester_id,
                family_id=family_id,
                data_type='complete_family_export',
                access_purpose='pipeda_data_portability_request',
                data_elements=list(report_data.keys()),
                request_info={'export_type': report_type}
            )

            return report_data
```

#### Enhanced Consent Management
```python
# app/services/family_consent_service.py

class FamilyConsentService:

    @staticmethod
    async def request_data_sharing_consent(
        family_id: str,
        data_owner_id: str,
        requesting_member_id: str,
        data_types: List[str],
        purpose: str,
        duration_days: int = None
    ) -> ConsentRequest:
        """Request consent for data sharing between family members"""

        async for session in get_async_session():
            consent_request = ConsentRequest(
                family_id=family_id,
                data_owner_id=data_owner_id,
                requesting_member_id=requesting_member_id,
                data_types=data_types,
                purpose=purpose,
                duration_days=duration_days,
                status='pending',
                request_metadata={
                    'pipeda_compliance': True,
                    'can_withdraw': True,
                    'granular_control': True,
                    'purpose_limitation': True
                }
            )
            session.add(consent_request)
            await session.commit()

            # Send consent notification
            await NotificationService.send_consent_request(
                to_user_id=data_owner_id,
                from_user_id=requesting_member_id,
                family_id=family_id,
                consent_request=consent_request
            )

            return consent_request

    @staticmethod
    async def grant_consent(
        consent_request_id: str,
        data_owner_id: str,
        granted_permissions: dict,
        restrictions: dict = None
    ) -> ConsentRecord:
        """Grant consent with specific permissions and restrictions"""

        async for session in get_async_session():
            # Get consent request
            request = await session.get(ConsentRequest, consent_request_id)

            if request.data_owner_id != data_owner_id:
                raise PermissionError("Only data owner can grant consent")

            # Create consent record
            consent_record = ConsentRecord(
                consent_request_id=consent_request_id,
                family_id=request.family_id,
                data_owner_id=data_owner_id,
                data_accessor_id=request.requesting_member_id,
                granted_permissions=granted_permissions,
                restrictions=restrictions or {},
                granted_at=datetime.utcnow(),
                expires_at=datetime.utcnow() + timedelta(days=request.duration_days) if request.duration_days else None,
                pipeda_metadata={
                    'withdrawal_method': 'immediate',
                    'audit_frequency': 'monthly',
                    'data_minimization': True,
                    'purpose_binding': True
                }
            )
            session.add(consent_record)

            # Update request status
            request.status = 'granted'
            request.granted_at = datetime.utcnow()

            await session.commit()

            # Log consent grant
            await PIPEDAAuditService.log_data_access(
                user_id=data_owner_id,
                family_id=request.family_id,
                data_type='consent_granted',
                access_purpose='family_collaboration',
                data_elements=list(granted_permissions.keys()),
                request_info={'consent_id': str(consent_record.id)}
            )

            return consent_record
```

### Advanced Security Measures

#### Role-Based Data Encryption
```python
# app/security/collaboration_encryption.py

class CollaborationEncryption:

    @staticmethod
    async def encrypt_sensitive_data(
        data: dict,
        family_id: str,
        access_level: str
    ) -> dict:
        """Encrypt sensitive data based on access level"""

        encryption_key = await get_family_encryption_key(family_id, access_level)

        encrypted_data = {}
        for key, value in data.items():
            sensitivity_level = get_data_sensitivity_level(key)

            if should_encrypt_for_access_level(sensitivity_level, access_level):
                encrypted_data[key] = encrypt_with_key(value, encryption_key)
            else:
                encrypted_data[key] = value

        return encrypted_data

    @staticmethod
    async def generate_time_limited_access_token(
        user_id: str,
        family_id: str,
        permissions: dict,
        duration_hours: int = 8
    ) -> str:
        """Generate time-limited access token for institutional users"""

        payload = {
            'user_id': user_id,
            'family_id': family_id,
            'permissions': permissions,
            'issued_at': datetime.utcnow().timestamp(),
            'expires_at': (datetime.utcnow() + timedelta(hours=duration_hours)).timestamp(),
            'token_type': 'collaboration_access',
            'can_refresh': False
        }

        # Sign with family-specific secret
        family_secret = await get_family_signing_secret(family_id)
        token = jwt.encode(payload, family_secret, algorithm='HS256')

        # Store token for validation and revocation
        await store_active_token(token, family_id, user_id)

        return token

    @staticmethod
    async def validate_collaboration_token(
        token: str,
        required_permission: str,
        family_id: str
    ) -> bool:
        """Validate collaboration token and check permissions"""

        try:
            family_secret = await get_family_signing_secret(family_id)
            payload = jwt.decode(token, family_secret, algorithms=['HS256'])

            # Check expiration
            if payload['expires_at'] < datetime.utcnow().timestamp():
                await revoke_token(token)
                return False

            # Check if token is still active
            if not await is_token_active(token):
                return False

            # Check permission
            user_permissions = payload.get('permissions', {})
            return user_permissions.get(required_permission, False)

        except jwt.InvalidTokenError:
            return False
```

---

## Performance Optimization and Monitoring

### Database Performance Strategies

#### Optimized Queries for Family Data
```sql
-- Optimized query for family children with member permissions
CREATE OR REPLACE VIEW family_children_with_access AS
SELECT
    c.*,
    f.name as family_name,
    fm.role as user_role,
    fm.permissions as user_permissions,
    fca.access_level
FROM children c
JOIN family_child_access fca ON c.id = fca.child_id
JOIN families f ON fca.family_id = f.id
JOIN family_members fm ON f.id = fm.family_id
WHERE fm.status = 'active'
AND (fm.access_expires_at IS NULL OR fm.access_expires_at > NOW());

-- Index strategy for collaboration queries
CREATE INDEX CONCURRENTLY idx_family_members_user_family_active
ON family_members (user_id, family_id, status)
WHERE status = 'active';

CREATE INDEX CONCURRENTLY idx_activities_family_child_time
ON activities (family_id, child_id, logged_at DESC);

CREATE INDEX CONCURRENTLY idx_collaboration_logs_family_time
ON collaboration_logs (family_id, created_at DESC);

-- Materialized view for family activity summaries
CREATE MATERIALIZED VIEW family_activity_summaries AS
SELECT
    f.id as family_id,
    f.name as family_name,
    COUNT(DISTINCT fm.user_id) as member_count,
    COUNT(DISTINCT fca.child_id) as children_count,
    COUNT(DISTINCT a.id) as total_activities,
    COUNT(DISTINCT DATE(a.logged_at)) as active_days,
    MAX(a.logged_at) as last_activity,
    COALESCE(AVG(EXTRACT(EPOCH FROM (a.logged_at - LAG(a.logged_at) OVER (PARTITION BY a.child_id ORDER BY a.logged_at)))), 0) as avg_activity_interval
FROM families f
LEFT JOIN family_members fm ON f.id = fm.family_id AND fm.status = 'active'
LEFT JOIN family_child_access fca ON f.id = fca.family_id
LEFT JOIN activities a ON fca.child_id = a.child_id
GROUP BY f.id, f.name;

-- Refresh strategy
CREATE OR REPLACE FUNCTION refresh_family_summaries()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY family_activity_summaries;
END;
$$ LANGUAGE plpgsql;

-- Auto-refresh trigger
CREATE OR REPLACE FUNCTION trigger_refresh_family_summaries()
RETURNS trigger AS $$
BEGIN
    -- Refresh in background to avoid blocking
    PERFORM pg_notify('refresh_family_summaries', '');
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER family_activity_summary_refresh
    AFTER INSERT OR UPDATE OR DELETE ON activities
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_refresh_family_summaries();
```

#### Connection Pooling and Caching Strategy
```python
# app/config/database_optimization.py

class DatabaseOptimizationConfig:

    # Connection pool settings for collaboration load
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_size": 20,           # Increased for family queries
        "max_overflow": 40,        # Handle collaboration spikes
        "pool_pre_ping": True,     # Verify connections
        "pool_recycle": 3600,      # Recycle hourly
        "echo": False              # Disable in production
    }

    # Query caching for family data
    REDIS_CACHE_CONFIG = {
        "family_members": {"ttl": 300},      # 5 minutes
        "family_children": {"ttl": 300},     # 5 minutes
        "presence_data": {"ttl": 30},        # 30 seconds
        "collaboration_logs": {"ttl": 600},  # 10 minutes
        "permission_cache": {"ttl": 900}     # 15 minutes
    }

# Caching service for collaboration data
class CollaborationCacheService:

    @staticmethod
    async def get_family_members(family_id: str) -> List[FamilyMember]:
        """Get family members with Redis caching"""
        cache_key = f"family_members:{family_id}"

        # Try cache first
        cached_data = await redis_client.get(cache_key)
        if cached_data:
            return json.loads(cached_data)

        # Query database
        async for session in get_async_session():
            result = await session.execute(
                select(FamilyMember)
                .where(
                    FamilyMember.family_id == family_id,
                    FamilyMember.status == 'active'
                )
                .options(selectinload(FamilyMember.user))
            )
            members = result.scalars().all()

            # Cache results
            serialized_members = [member.to_dict() for member in members]
            await redis_client.setex(
                cache_key,
                300,  # 5 minutes
                json.dumps(serialized_members)
            )

            return serialized_members

    @staticmethod
    async def invalidate_family_cache(family_id: str):
        """Invalidate all cache entries for a family"""
        patterns = [
            f"family_members:{family_id}",
            f"family_children:{family_id}",
            f"family_permissions:{family_id}:*",
            f"family_activity_summary:{family_id}"
        ]

        for pattern in patterns:
            keys = await redis_client.keys(pattern)
            if keys:
                await redis_client.delete(*keys)
```

### Real-Time Performance Monitoring

```python
# app/monitoring/collaboration_metrics.py

class CollaborationMetrics:

    @staticmethod
    async def track_family_activity_rate(family_id: str):
        """Track activity logging rate per family"""
        metric_key = f"family_activity_rate:{family_id}"
        current_hour = datetime.utcnow().replace(minute=0, second=0, microsecond=0)

        await redis_client.hincrby(
            metric_key,
            current_hour.isoformat(),
            1
        )

        # Expire after 24 hours
        await redis_client.expire(metric_key, 86400)

    @staticmethod
    async def monitor_real_time_connections():
        """Monitor active real-time connections per family"""
        active_connections = {}

        # Query Supabase real-time analytics
        for family_id in await get_active_families():
            connection_count = await supabase_admin.rpc(
                'get_active_connections_for_family',
                {'family_id': family_id}
            )
            active_connections[family_id] = connection_count

        # Store metrics
        await redis_client.hmset(
            'realtime_connections',
            active_connections
        )

        return active_connections

    @staticmethod
    async def analyze_collaboration_patterns():
        """Analyze collaboration patterns for optimization"""
        metrics = {
            'peak_activity_hours': await get_peak_activity_hours(),
            'average_family_size': await get_average_family_size(),
            'conflict_resolution_rate': await get_conflict_resolution_rate(),
            'invitation_acceptance_rate': await get_invitation_acceptance_rate(),
            'presence_tracking_accuracy': await measure_presence_accuracy()
        }

        # Log to monitoring system
        await log_metrics_to_monitoring_system(metrics)

        return metrics
```

---

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"content": "Create comprehensive architecture document for caregiver collaboration", "status": "completed", "activeForm": "Creating comprehensive architecture document for caregiver collaboration"}, {"content": "Design database schema extensions for family-based model", "status": "completed", "activeForm": "Designing database schema extensions for family-based model"}, {"content": "Define GraphQL schema extensions for collaboration features", "status": "completed", "activeForm": "Defining GraphQL schema extensions for collaboration features"}, {"content": "Design role-based permission system with 4 tiers", "status": "completed", "activeForm": "Designing role-based permission system with 4 tiers"}, {"content": "Specify real-time architecture using Supabase capabilities", "status": "completed", "activeForm": "Specifying real-time architecture using Supabase capabilities"}, {"content": "Create migration strategy for existing single users", "status": "completed", "activeForm": "Creating migration strategy for existing single users"}, {"content": "Design RLS policies for multi-user family access", "status": "completed", "activeForm": "Designing RLS policies for multi-user family access"}]