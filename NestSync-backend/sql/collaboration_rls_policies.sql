-- =============================================================================
-- Row Level Security (RLS) Policies for Collaboration Features
-- PIPEDA-compliant access control for family-based collaboration
-- =============================================================================

-- Enable RLS on collaboration tables
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_child_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE caregiver_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE caregiver_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- Family Access Policies
-- =============================================================================

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

-- Policy 2: Family creation (any authenticated user can create)
CREATE POLICY family_creation ON families
FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid());

-- =============================================================================
-- Family Member Policies
-- =============================================================================

-- Policy 3: Members can view family membership
CREATE POLICY family_members_view ON family_members
FOR SELECT TO authenticated
USING (
    family_id IN (
        SELECT family_id
        FROM family_members
        WHERE user_id = auth.uid()
        AND status = 'active'
    )
);

-- Policy 4: Only Family Core can modify other members
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

-- Policy 5: Family Core can add new members (via invitation acceptance)
CREATE POLICY family_member_creation ON family_members
FOR INSERT TO authenticated
WITH CHECK (
    -- User joining their own accepted invitation
    user_id = auth.uid()
    AND EXISTS (
        SELECT 1 FROM caregiver_invitations
        WHERE family_id = family_members.family_id
        AND email = (SELECT email FROM users WHERE id = auth.uid())
        AND status = 'accepted'
    )
    OR
    -- Family Core adding members
    family_id IN (
        SELECT family_id
        FROM family_members
        WHERE user_id = auth.uid()
        AND role = 'family_core'
        AND status = 'active'
    )
);

-- =============================================================================
-- Children Access Policies
-- =============================================================================

-- Policy 6: Children access through family membership
CREATE POLICY family_children_access ON children
FOR SELECT TO authenticated
USING (
    family_id IN (
        SELECT family_id
        FROM family_members
        WHERE user_id = auth.uid()
        AND status = 'active'
    )
    OR
    -- Backward compatibility: direct parent access
    parent_id = auth.uid()
);

-- Policy 7: Role-based children modification
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
    OR
    -- Backward compatibility: direct parent access
    parent_id = auth.uid()
);

-- Policy 8: Children creation (Family Core only or direct parent)
CREATE POLICY family_children_create ON children
FOR INSERT TO authenticated
WITH CHECK (
    family_id IN (
        SELECT family_id
        FROM family_members
        WHERE user_id = auth.uid()
        AND role = 'family_core'
        AND status = 'active'
    )
    OR
    -- Backward compatibility: direct parent creation
    parent_id = auth.uid()
);

-- =============================================================================
-- Family Child Access Policies
-- =============================================================================

-- Policy 9: Family child access visibility
CREATE POLICY family_child_access_view ON family_child_access
FOR SELECT TO authenticated
USING (
    family_id IN (
        SELECT family_id
        FROM family_members
        WHERE user_id = auth.uid()
        AND status = 'active'
    )
);

-- Policy 10: Family Core can manage child access
CREATE POLICY family_child_access_manage ON family_child_access
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

-- =============================================================================
-- Activity Policies with Role-Based Restrictions
-- =============================================================================

-- Policy 11: Activity viewing with role restrictions
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
            -- All other roles: full access through family
            child_id IN (
                SELECT fca.child_id
                FROM family_child_access fca
                JOIN family_members fm ON fm.family_id = fca.family_id
                WHERE fm.user_id = auth.uid()
                AND fm.status = 'active'
            )
            OR
            -- Backward compatibility: direct parent access
            child_id IN (
                SELECT id FROM children WHERE parent_id = auth.uid()
            )
    END
);

-- Policy 12: Activity logging permissions
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
    OR
    -- Backward compatibility: direct parent access
    child_id IN (
        SELECT id FROM children WHERE parent_id = auth.uid()
    )
);

-- Policy 13: Activity modification (own activities + role-based)
CREATE POLICY family_activity_update ON activities
FOR UPDATE TO authenticated
USING (
    -- User can edit their own activities
    logged_by_user_id = auth.uid()
    OR
    -- Family Core can edit any activities
    child_id IN (
        SELECT fca.child_id
        FROM family_child_access fca
        JOIN family_members fm ON fm.family_id = fca.family_id
        WHERE fm.user_id = auth.uid()
        AND fm.role = 'family_core'
        AND fm.status = 'active'
    )
    OR
    -- Backward compatibility: parent can edit all child activities
    child_id IN (
        SELECT id FROM children WHERE parent_id = auth.uid()
    )
);

-- =============================================================================
-- Invitation Policies
-- =============================================================================

-- Policy 14: Invitation management (Family Core only)
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
    OR
    -- Users can view invitations sent to them
    (email = (SELECT email FROM users WHERE id = auth.uid()) AND status = 'pending')
);

-- =============================================================================
-- Collaboration Logs Policies
-- =============================================================================

-- Policy 15: Collaboration logs access (Family Core and Extended Family only)
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

-- Policy 16: System can create collaboration logs
CREATE POLICY collaboration_logs_create ON collaboration_logs
FOR INSERT TO authenticated
WITH CHECK (
    -- System service can create logs for families user has access to
    family_id IN (
        SELECT family_id
        FROM family_members
        WHERE user_id = auth.uid()
        AND status = 'active'
    )
);

-- =============================================================================
-- Presence Tracking Policies
-- =============================================================================

-- Policy 17: Presence visibility (family members only)
CREATE POLICY caregiver_presence_view ON caregiver_presence
FOR SELECT TO authenticated
USING (
    family_id IN (
        SELECT family_id
        FROM family_members
        WHERE user_id = auth.uid()
        AND status = 'active'
    )
);

-- Policy 18: Users can update their own presence
CREATE POLICY caregiver_presence_update ON caregiver_presence
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- =============================================================================
-- Time-Based Access Control Functions
-- =============================================================================

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
    WHERE fm.user_id = check_institutional_time_access.user_id
    AND fm.family_id = check_institutional_time_access.family_id
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
    WHERE cp.user_id = check_institutional_time_access.user_id
    AND cp.family_id = check_institutional_time_access.family_id
    AND DATE(cp.last_seen) = CURRENT_DATE;

    -- Check session duration (8 hour limit for institutional users)
    IF session_start IS NOT NULL
       AND EXTRACT(EPOCH FROM (NOW() - session_start)) / 3600 > max_session_hours THEN
        RETURN FALSE;
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policy using time-based function for institutional users
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

-- =============================================================================
-- Helper Functions for RLS
-- =============================================================================

-- Function to get user's highest role in a family
CREATE OR REPLACE FUNCTION get_user_family_role(
    user_id UUID,
    family_id UUID
) RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT role::TEXT
        FROM family_members
        WHERE family_members.user_id = get_user_family_role.user_id
        AND family_members.family_id = get_user_family_role.family_id
        AND status = 'active'
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has specific permission
CREATE OR REPLACE FUNCTION user_has_permission(
    user_id UUID,
    family_id UUID,
    permission_key TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    permissions JSONB;
BEGIN
    SELECT fm.permissions INTO permissions
    FROM family_members fm
    WHERE fm.user_id = user_has_permission.user_id
    AND fm.family_id = user_has_permission.family_id
    AND fm.status = 'active';

    IF permissions IS NULL THEN
        RETURN FALSE;
    END IF;

    RETURN COALESCE((permissions->>permission_key)::BOOLEAN, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- PIPEDA Compliance Functions
-- =============================================================================

-- Function to log data access for PIPEDA compliance
CREATE OR REPLACE FUNCTION log_data_access(
    user_id UUID,
    family_id UUID,
    data_type TEXT,
    access_purpose TEXT
) RETURNS VOID AS $$
BEGIN
    INSERT INTO collaboration_logs (
        family_id,
        actor_user_id,
        action_type,
        target_type,
        details
    ) VALUES (
        log_data_access.family_id,
        log_data_access.user_id,
        'data_accessed',
        log_data_access.data_type,
        jsonb_build_object(
            'access_purpose', log_data_access.access_purpose,
            'access_time', NOW(),
            'compliance_version', 'PIPEDA_2.0'
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- Grant Permissions
-- =============================================================================

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION check_institutional_time_access(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_family_role(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION user_has_permission(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION log_data_access(UUID, UUID, TEXT, TEXT) TO authenticated;

-- =============================================================================
-- Comments for Documentation
-- =============================================================================

COMMENT ON POLICY family_member_access ON families IS
'PIPEDA Compliant: Users can only access families they are active members of';

COMMENT ON POLICY family_children_access ON children IS
'Multi-tier access: Family-based with backward compatibility for direct parent access';

COMMENT ON POLICY family_activity_view ON activities IS
'Role-based activity access with time restrictions for institutional users';

COMMENT ON FUNCTION check_institutional_time_access(UUID, UUID) IS
'Enforces 8-hour session limits and 7-day access expiration for institutional caregivers';

COMMENT ON FUNCTION log_data_access(UUID, UUID, TEXT, TEXT) IS
'PIPEDA compliance function for logging all data access with purpose and user context';