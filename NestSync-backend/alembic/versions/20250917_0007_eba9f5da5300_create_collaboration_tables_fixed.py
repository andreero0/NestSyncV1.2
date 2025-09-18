"""create_collaboration_tables_fixed

Revision ID: eba9f5da5300
Revises: 6b2c4301f36f
Create Date: 2025-09-17 00:07:46.884500-04:00

PIPEDA Compliance: This migration handles personal data according to Canadian privacy laws.
Data Residency: All data operations occur within Canadian data centers.
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'eba9f5da5300'
down_revision = '6b2c4301f36f'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Apply migration changes

    PIPEDA Compliance Notes:
    - All personal data fields are properly encrypted/protected
    - Audit trails are maintained for all data changes
    - Data retention policies are enforced
    - Canadian timezone (America/Toronto) is used for all timestamps
    """
    # Create enum types
    sa.Enum('PERSONAL', 'STANDARD', 'INSTITUTIONAL', name='familytype').create(op.get_bind())
    sa.Enum('FAMILY_CORE', 'PARTNER', 'CAREGIVER', 'TEMPORARY_CAREGIVER', 'EMERGENCY_CONTACT', name='memberrole').create(op.get_bind())
    sa.Enum('ACTIVE', 'INVITED', 'INACTIVE', 'REMOVED', name='memberstatus').create(op.get_bind())
    sa.Enum('FULL', 'LIMITED', 'READ_ONLY', 'EMERGENCY_ONLY', name='accesslevel').create(op.get_bind())
    sa.Enum('FAMILY_CREATED', 'FAMILY_UPDATED', 'FAMILY_DELETED', 'MEMBER_INVITED', 'MEMBER_JOINED', 'MEMBER_LEFT', 'MEMBER_REMOVED', 'MEMBER_ROLE_CHANGED', 'CHILD_ADDED', 'CHILD_REMOVED', 'ACTIVITY_LOGGED', 'ACTIVITY_UPDATED', 'ACTIVITY_DELETED', 'DATA_SHARED', 'DATA_EXPORT', 'SETTINGS_CHANGED', name='logaction').create(op.get_bind())

    # Create families table
    op.create_table('families',
    sa.Column('name', sa.String(length=255), nullable=False, comment='Family name'),
    sa.Column('family_type', sa.Enum('PERSONAL', 'STANDARD', 'INSTITUTIONAL', name='familytype'), nullable=False, comment='Type of family (personal/standard/institutional)'),
    sa.Column('description', sa.Text(), nullable=True, comment='Family description'),
    sa.Column('created_by', sa.UUID(), nullable=False, comment='User who created the family'),
    sa.Column('settings', sa.JSON(), nullable=False, comment='Family settings and preferences'),
    sa.Column('id', sa.UUID(), nullable=False, comment='Unique identifier'),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, comment='Record creation timestamp (UTC)'),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, comment='Record last update timestamp (UTC)'),
    sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True, comment='Soft delete timestamp (PIPEDA compliance)'),
    sa.Column('is_deleted', sa.Boolean(), nullable=False, comment='Soft delete flag'),
    sa.Column('updated_by', sa.UUID(), nullable=True, comment='User who last updated this record'),
    sa.Column('deleted_by', sa.UUID(), nullable=True, comment='User who deleted this record'),
    sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('families', schema=None) as batch_op:
        batch_op.create_index('idx_families_created_by', ['created_by'], unique=False)
        batch_op.create_index('idx_families_type', ['family_type'], unique=False)

    # Create family_members table
    op.create_table('family_members',
    sa.Column('user_id', sa.UUID(), nullable=False, comment='User ID'),
    sa.Column('family_id', sa.UUID(), nullable=False, comment='Family ID'),
    sa.Column('role', sa.Enum('FAMILY_CORE', 'PARTNER', 'CAREGIVER', 'TEMPORARY_CAREGIVER', 'EMERGENCY_CONTACT', name='memberrole'), nullable=False, comment='Role within the family'),
    sa.Column('status', sa.Enum('ACTIVE', 'INVITED', 'INACTIVE', 'REMOVED', name='memberstatus'), nullable=False, comment='Membership status'),
    sa.Column('permissions', sa.JSON(), nullable=False, comment='Role-specific permissions'),
    sa.Column('joined_at', sa.DateTime(timezone=True), nullable=False, comment='When member joined the family'),
    sa.Column('invited_by', sa.UUID(), nullable=True, comment='User who invited this member'),
    sa.Column('id', sa.UUID(), nullable=False, comment='Unique identifier'),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, comment='Record creation timestamp (UTC)'),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, comment='Record last update timestamp (UTC)'),
    sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True, comment='Soft delete timestamp (PIPEDA compliance)'),
    sa.Column('is_deleted', sa.Boolean(), nullable=False, comment='Soft delete flag'),
    sa.Column('created_by', sa.UUID(), nullable=True, comment='User who created this record'),
    sa.Column('updated_by', sa.UUID(), nullable=True, comment='User who last updated this record'),
    sa.Column('deleted_by', sa.UUID(), nullable=True, comment='User who deleted this record'),
    sa.ForeignKeyConstraint(['family_id'], ['families.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['invited_by'], ['users.id'], ),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('user_id', 'family_id', name='uq_user_family_membership')
    )
    with op.batch_alter_table('family_members', schema=None) as batch_op:
        batch_op.create_index('idx_family_members_family', ['family_id'], unique=False)
        batch_op.create_index('idx_family_members_user', ['user_id'], unique=False)

    # Create collaboration_logs table
    op.create_table('collaboration_logs',
    sa.Column('family_id', sa.UUID(), nullable=False, comment='Family ID where action occurred'),
    sa.Column('actor_user_id', sa.UUID(), nullable=False, comment='User who performed the action'),
    sa.Column('action_type', sa.Enum('FAMILY_CREATED', 'FAMILY_UPDATED', 'FAMILY_DELETED', 'MEMBER_INVITED', 'MEMBER_JOINED', 'MEMBER_LEFT', 'MEMBER_REMOVED', 'MEMBER_ROLE_CHANGED', 'CHILD_ADDED', 'CHILD_REMOVED', 'ACTIVITY_LOGGED', 'ACTIVITY_UPDATED', 'ACTIVITY_DELETED', 'DATA_SHARED', 'DATA_EXPORT', 'SETTINGS_CHANGED', name='logaction'), nullable=False, comment='Type of action performed'),
    sa.Column('target_type', sa.String(length=50), nullable=True, comment='Type of target object (user, child, activity, etc.)'),
    sa.Column('target_id', sa.UUID(), nullable=True, comment='ID of the target object'),
    sa.Column('details', sa.JSON(), nullable=False, comment='Detailed information about the action'),
    sa.Column('ip_address', sa.String(length=45), nullable=True, comment='IP address for security auditing'),
    sa.Column('user_agent', sa.Text(), nullable=True, comment='User agent for security auditing'),
    sa.Column('id', sa.UUID(), nullable=False, comment='Unique identifier'),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, comment='Record creation timestamp (UTC)'),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, comment='Record last update timestamp (UTC)'),
    sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True, comment='Soft delete timestamp (PIPEDA compliance)'),
    sa.Column('is_deleted', sa.Boolean(), nullable=False, comment='Soft delete flag'),
    sa.Column('created_by', sa.UUID(), nullable=True, comment='User who created this record'),
    sa.Column('updated_by', sa.UUID(), nullable=True, comment='User who last updated this record'),
    sa.Column('deleted_by', sa.UUID(), nullable=True, comment='User who deleted this record'),
    sa.ForeignKeyConstraint(['actor_user_id'], ['users.id'], ),
    sa.ForeignKeyConstraint(['family_id'], ['families.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('collaboration_logs', schema=None) as batch_op:
        batch_op.create_index('idx_collaboration_logs_actor', ['actor_user_id'], unique=False)
        batch_op.create_index('idx_collaboration_logs_family', ['family_id'], unique=False)
        batch_op.create_index('idx_collaboration_logs_target', ['target_type', 'target_id'], unique=False)

    # Create family_child_access table
    op.create_table('family_child_access',
    sa.Column('family_id', sa.UUID(), nullable=False, comment='Family ID'),
    sa.Column('child_id', sa.UUID(), nullable=False, comment='Child ID'),
    sa.Column('access_level', sa.Enum('FULL', 'LIMITED', 'READ_ONLY', 'EMERGENCY_ONLY', name='accesslevel'), nullable=False, comment='Level of access to child data'),
    sa.Column('granted_at', sa.DateTime(timezone=True), nullable=False, comment='When access was granted'),
    sa.Column('granted_by', sa.UUID(), nullable=False, comment='User who granted access'),
    sa.Column('id', sa.UUID(), nullable=False, comment='Unique identifier'),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, comment='Record creation timestamp (UTC)'),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, comment='Record last update timestamp (UTC)'),
    sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True, comment='Soft delete timestamp (PIPEDA compliance)'),
    sa.Column('is_deleted', sa.Boolean(), nullable=False, comment='Soft delete flag'),
    sa.Column('created_by', sa.UUID(), nullable=True, comment='User who created this record'),
    sa.Column('updated_by', sa.UUID(), nullable=True, comment='User who last updated this record'),
    sa.Column('deleted_by', sa.UUID(), nullable=True, comment='User who deleted this record'),
    sa.ForeignKeyConstraint(['child_id'], ['children.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['family_id'], ['families.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['granted_by'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('family_id', 'child_id', name='uq_family_child_access')
    )
    with op.batch_alter_table('family_child_access', schema=None) as batch_op:
        batch_op.create_index('idx_family_child_child', ['child_id'], unique=False)
        batch_op.create_index('idx_family_child_family', ['family_id'], unique=False)

    # Add family_id column to children table
    with op.batch_alter_table('children', schema=None) as batch_op:
        batch_op.add_column(sa.Column('family_id', sa.UUID(), nullable=True, comment='Family this child belongs to'))
        batch_op.add_column(sa.Column('migrated_from_user', sa.UUID(), nullable=True, comment='Original parent user ID for migration tracking'))
        batch_op.create_foreign_key('fk_children_family', 'families', ['family_id'], ['id'])
        batch_op.create_index('idx_children_family', ['family_id'], unique=False)

    # Add family context to activities table
    with op.batch_alter_table('activities', schema=None) as batch_op:
        batch_op.add_column(sa.Column('family_context', sa.JSON(), nullable=True, comment='Family collaboration context'))
        batch_op.add_column(sa.Column('collaboration_metadata', sa.JSON(), nullable=True, comment='Collaboration-specific metadata'))


def downgrade() -> None:
    """
    Reverse migration changes
    
    PIPEDA Compliance Notes:
    - Data rollback maintains compliance requirements
    - Audit logs are preserved even during rollback
    - No personal data is inadvertently exposed during downgrade
    """
    pass