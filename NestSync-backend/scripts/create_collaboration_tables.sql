-- Create collaboration tables for NestSync family system
-- PIPEDA Compliance: All tables include audit fields and soft delete capabilities

-- Families table
CREATE TABLE families (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    family_type familytype NOT NULL DEFAULT 'PERSONAL',
    description TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    settings JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    updated_by UUID REFERENCES users(id),
    deleted_by UUID REFERENCES users(id)
);

CREATE INDEX idx_families_created_by ON families(created_by);
CREATE INDEX idx_families_type ON families(family_type);
CREATE INDEX idx_families_active ON families(id) WHERE is_deleted = FALSE;

-- Family members table
CREATE TABLE family_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    role memberrole NOT NULL DEFAULT 'FAMILY_CORE',
    status memberstatus NOT NULL DEFAULT 'ACTIVE',
    permissions JSONB NOT NULL DEFAULT '{}',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    invited_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    deleted_by UUID REFERENCES users(id),
    CONSTRAINT uq_user_family_membership UNIQUE(user_id, family_id)
);

CREATE INDEX idx_family_members_user ON family_members(user_id);
CREATE INDEX idx_family_members_family ON family_members(family_id);
CREATE INDEX idx_family_members_role ON family_members(role);

-- Collaboration logs table
CREATE TABLE collaboration_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    actor_user_id UUID NOT NULL REFERENCES users(id),
    action_type logaction NOT NULL,
    target_type VARCHAR(50),
    target_id UUID,
    details JSONB NOT NULL DEFAULT '{}',
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    deleted_by UUID REFERENCES users(id)
);

CREATE INDEX idx_collaboration_logs_family ON collaboration_logs(family_id);
CREATE INDEX idx_collaboration_logs_actor ON collaboration_logs(actor_user_id);
CREATE INDEX idx_collaboration_logs_action ON collaboration_logs(action_type);
CREATE INDEX idx_collaboration_logs_target ON collaboration_logs(target_type, target_id);
CREATE INDEX idx_collaboration_logs_created ON collaboration_logs(created_at);

-- Family child access table
CREATE TABLE family_child_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    access_level accesslevel NOT NULL DEFAULT 'FULL',
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    granted_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    deleted_by UUID REFERENCES users(id),
    CONSTRAINT uq_family_child_access UNIQUE(family_id, child_id)
);

CREATE INDEX idx_family_child_family ON family_child_access(family_id);
CREATE INDEX idx_family_child_child ON family_child_access(child_id);

-- Add family columns to children table
ALTER TABLE children
ADD COLUMN family_id UUID REFERENCES families(id),
ADD COLUMN migrated_from_user UUID REFERENCES users(id);

CREATE INDEX idx_children_family ON children(family_id);

-- Add family context to activities table
ALTER TABLE activities
ADD COLUMN family_context JSONB,
ADD COLUMN collaboration_metadata JSONB;

-- Update timestamps function for PIPEDA compliance
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add timestamp triggers
CREATE TRIGGER update_families_updated_at BEFORE UPDATE ON families
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_family_members_updated_at BEFORE UPDATE ON family_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collaboration_logs_updated_at BEFORE UPDATE ON collaboration_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_family_child_access_updated_at BEFORE UPDATE ON family_child_access
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();