"""Initial schema for NestSync authentication and onboarding

Revision ID: 001
Revises: 
Create Date: 2024-01-01 12:00:00.000000

PIPEDA Compliance: This migration creates the foundation for PIPEDA-compliant user data management.
Data Residency: All tables are created in Canadian data centers with proper timezone handling.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSON

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Create initial schema for authentication and onboarding
    
    PIPEDA Compliance Notes:
    - All personal data fields include proper audit trails
    - Soft delete functionality for data retention compliance
    - Granular consent tracking for Canadian privacy law
    - Canadian timezone (America/Toronto) for all timestamps
    """
    
    # =============================================================================
    # Users Table - PIPEDA Compliant User Management
    # =============================================================================
    op.create_table('users',
        # Primary Key and Audit Fields
        sa.Column('id', UUID(as_uuid=True), primary_key=True, nullable=False, comment='Unique identifier'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, comment='Record creation timestamp (UTC)'),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, comment='Record last update timestamp (UTC)'),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True, comment='Soft delete timestamp (PIPEDA compliance)'),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, default=False, comment='Soft delete flag'),
        sa.Column('created_by', UUID(as_uuid=True), nullable=True, comment='User who created this record'),
        sa.Column('updated_by', UUID(as_uuid=True), nullable=True, comment='User who last updated this record'),
        sa.Column('deleted_by', UUID(as_uuid=True), nullable=True, comment='User who deleted this record'),
        
        # Authentication Fields
        sa.Column('email', sa.String(255), nullable=False, unique=True, index=True, comment='User email address (encrypted for PIPEDA)'),
        sa.Column('password_hash', sa.String(255), nullable=True, comment='Hashed password'),
        sa.Column('supabase_user_id', UUID(as_uuid=True), nullable=True, unique=True, index=True, comment='Supabase Auth user ID'),
        
        # Profile Information
        sa.Column('first_name', sa.String(100), nullable=True, comment='User first name'),
        sa.Column('last_name', sa.String(100), nullable=True, comment='User last name'),
        sa.Column('display_name', sa.String(100), nullable=True, comment='User display name'),
        sa.Column('phone_number', sa.String(20), nullable=True, comment='Phone number (Canadian format)'),
        
        # Account Status and Verification
        sa.Column('status', sa.String(50), nullable=False, default='pending_verification', comment='User account status'),
        sa.Column('email_verified', sa.Boolean(), nullable=False, default=False, comment='Email verification status'),
        sa.Column('email_verified_at', sa.DateTime(timezone=True), nullable=True, comment='Email verification timestamp'),
        sa.Column('phone_verified', sa.Boolean(), nullable=False, default=False, comment='Phone verification status'),
        sa.Column('phone_verified_at', sa.DateTime(timezone=True), nullable=True, comment='Phone verification timestamp'),
        
        # Security and Authentication
        sa.Column('last_login_at', sa.DateTime(timezone=True), nullable=True, comment='Last successful login'),
        sa.Column('last_login_ip', sa.String(45), nullable=True, comment='Last login IP address'),
        sa.Column('failed_login_attempts', sa.Integer(), nullable=False, default=0, comment='Count of failed login attempts'),
        sa.Column('locked_until', sa.DateTime(timezone=True), nullable=True, comment='Account locked until timestamp'),
        sa.Column('biometric_enabled', sa.Boolean(), nullable=False, default=False, comment='Biometric authentication enabled'),
        sa.Column('biometric_token', sa.Text(), nullable=True, comment='Encrypted biometric token'),
        
        # PIPEDA Consent Management
        sa.Column('privacy_policy_accepted', sa.Boolean(), nullable=False, default=False, comment='Privacy policy acceptance'),
        sa.Column('privacy_policy_accepted_at', sa.DateTime(timezone=True), nullable=True, comment='Privacy policy acceptance timestamp'),
        sa.Column('terms_of_service_accepted', sa.Boolean(), nullable=False, default=False, comment='Terms of service acceptance'),
        sa.Column('terms_of_service_accepted_at', sa.DateTime(timezone=True), nullable=True, comment='Terms of service acceptance timestamp'),
        sa.Column('marketing_consent', sa.Boolean(), nullable=False, default=False, comment='Marketing communications consent'),
        sa.Column('analytics_consent', sa.Boolean(), nullable=False, default=False, comment='Analytics and tracking consent'),
        sa.Column('data_sharing_consent', sa.Boolean(), nullable=False, default=False, comment='Third-party data sharing consent'),
        
        # Consent Tracking Fields
        sa.Column('consent_version', sa.String(50), nullable=True, comment='Version of consent agreement'),
        sa.Column('consent_granted_at', sa.DateTime(timezone=True), nullable=True, comment='When consent was granted'),
        sa.Column('consent_withdrawn_at', sa.DateTime(timezone=True), nullable=True, comment='When consent was withdrawn'),
        sa.Column('consent_ip_address', sa.String(45), nullable=True, comment='IP address when consent was given'),
        sa.Column('consent_user_agent', sa.Text(), nullable=True, comment='User agent when consent was given'),
        
        # User Preferences and Settings
        sa.Column('timezone', sa.String(50), nullable=False, default='America/Toronto', comment='User timezone preference'),
        sa.Column('language', sa.String(10), nullable=False, default='en', comment='User language preference'),
        sa.Column('currency', sa.String(3), nullable=False, default='CAD', comment='User currency preference'),
        sa.Column('notification_preferences', JSON, nullable=True, comment='User notification preferences'),
        
        # Onboarding Progress
        sa.Column('onboarding_completed', sa.Boolean(), nullable=False, default=False, comment='Onboarding flow completion status'),
        sa.Column('onboarding_completed_at', sa.DateTime(timezone=True), nullable=True, comment='Onboarding completion timestamp'),
        sa.Column('onboarding_step', sa.String(50), nullable=True, comment='Current onboarding step'),
        
        # Canadian Compliance Fields
        sa.Column('province', sa.String(2), nullable=True, comment='Canadian province'),
        sa.Column('postal_code', sa.String(7), nullable=True, comment='Canadian postal code'),
        
        # Data Subject Rights (PIPEDA)
        sa.Column('data_export_requested', sa.Boolean(), nullable=False, default=False, comment='Data export requested flag'),
        sa.Column('data_export_requested_at', sa.DateTime(timezone=True), nullable=True, comment='Data export request timestamp'),
        sa.Column('data_deletion_requested', sa.Boolean(), nullable=False, default=False, comment='Data deletion requested flag'),
        sa.Column('data_deletion_requested_at', sa.DateTime(timezone=True), nullable=True, comment='Data deletion request timestamp'),
        
        # Data Retention (PIPEDA)
        sa.Column('retention_date', sa.DateTime(timezone=True), nullable=True, comment='Date when this data should be purged for compliance'),
        sa.Column('retention_reason', sa.String(255), nullable=True, comment='Reason for extended data retention'),
        
        comment='PIPEDA-compliant user accounts with Canadian data sovereignty'
    )
    
    # =============================================================================
    # Children Table - Child Profiles for Diaper Planning
    # =============================================================================
    op.create_table('children',
        # Primary Key and Audit Fields
        sa.Column('id', UUID(as_uuid=True), primary_key=True, nullable=False, comment='Unique identifier'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, comment='Record creation timestamp (UTC)'),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, comment='Record last update timestamp (UTC)'),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True, comment='Soft delete timestamp (PIPEDA compliance)'),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, default=False, comment='Soft delete flag'),
        sa.Column('created_by', UUID(as_uuid=True), nullable=True, comment='User who created this record'),
        sa.Column('updated_by', UUID(as_uuid=True), nullable=True, comment='User who last updated this record'),
        sa.Column('deleted_by', UUID(as_uuid=True), nullable=True, comment='User who deleted this record'),
        
        # Parent Relationship
        sa.Column('parent_id', UUID(as_uuid=True), nullable=False, index=True, comment='Parent user ID'),
        
        # Basic Information
        sa.Column('name', sa.String(100), nullable=False, comment="Child's name"),
        sa.Column('date_of_birth', sa.Date(), nullable=False, comment="Child's date of birth"),
        sa.Column('gender', sa.String(20), nullable=True, comment="Child's gender"),
        
        # Physical Characteristics for Diaper Sizing
        sa.Column('current_weight_kg', sa.Float(), nullable=True, comment='Current weight in kilograms'),
        sa.Column('current_height_cm', sa.Float(), nullable=True, comment='Current height in centimeters'),
        sa.Column('weight_history', JSON, nullable=True, comment='Historical weight measurements for growth tracking'),
        sa.Column('height_history', JSON, nullable=True, comment='Historical height measurements for growth tracking'),
        
        # Diaper Information
        sa.Column('current_diaper_size', sa.String(20), nullable=False, comment='Current diaper size'),
        sa.Column('size_history', JSON, nullable=True, comment='Historical diaper size changes with dates'),
        sa.Column('preferred_brands', JSON, nullable=True, comment='List of preferred diaper brands'),
        sa.Column('diaper_preferences', JSON, nullable=True, comment='Specific diaper type preferences and requirements'),
        
        # Usage Patterns for Predictions
        sa.Column('daily_usage_count', sa.Integer(), nullable=False, default=8, comment='Average daily diaper changes'),
        sa.Column('usage_pattern', JSON, nullable=True, comment='Hourly usage patterns for optimization'),
        
        # Special Needs and Considerations
        sa.Column('special_needs', sa.Text(), nullable=True, comment='Special needs or medical considerations'),
        sa.Column('has_sensitive_skin', sa.Boolean(), nullable=False, default=False, comment='Child has sensitive skin requiring special products'),
        sa.Column('has_allergies', sa.Boolean(), nullable=False, default=False, comment='Child has known allergies'),
        sa.Column('allergies_notes', sa.Text(), nullable=True, comment='Details about allergies or sensitivities'),
        
        # Onboarding Wizard Progress
        sa.Column('onboarding_completed', sa.Boolean(), nullable=False, default=False, comment='Child onboarding wizard completion status'),
        sa.Column('onboarding_step', sa.String(50), nullable=True, comment='Current onboarding step for this child'),
        sa.Column('wizard_data', JSON, nullable=True, comment='Temporary data during onboarding wizard'),
        
        # Initial Inventory Setup (from onboarding)
        sa.Column('initial_inventory', JSON, nullable=True, comment='Initial diaper inventory from onboarding'),
        sa.Column('initial_inventory_date', sa.Date(), nullable=True, comment='Date of initial inventory setup'),
        
        # Growth and Development Tracking
        sa.Column('estimated_next_size_date', sa.Date(), nullable=True, comment='ML-predicted date for next size up'),
        sa.Column('growth_rate_percentile', sa.Integer(), nullable=True, comment='Growth rate percentile for predictions'),
        sa.Column('milestones', JSON, nullable=True, comment='Development milestones affecting diaper needs'),
        
        # Canadian Compliance
        sa.Column('province', sa.String(2), nullable=True, comment='Province for local recommendations'),
        sa.Column('data_sharing_consent', sa.Boolean(), nullable=False, default=False, comment='Consent for sharing anonymized child development data'),
        
        comment='Child profiles for diaper planning with Canadian privacy compliance'
    )
    
    # =============================================================================
    # Consent Records Table - PIPEDA Compliance
    # =============================================================================
    op.create_table('consent_records',
        # Primary Key and Audit Fields
        sa.Column('id', UUID(as_uuid=True), primary_key=True, nullable=False, comment='Unique identifier'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, comment='Record creation timestamp (UTC)'),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, comment='Record last update timestamp (UTC)'),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True, comment='Soft delete timestamp (PIPEDA compliance)'),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, default=False, comment='Soft delete flag'),
        sa.Column('created_by', UUID(as_uuid=True), nullable=True, comment='User who created this record'),
        sa.Column('updated_by', UUID(as_uuid=True), nullable=True, comment='User who last updated this record'),
        sa.Column('deleted_by', UUID(as_uuid=True), nullable=True, comment='User who deleted this record'),
        
        # User Relationship
        sa.Column('user_id', UUID(as_uuid=True), nullable=False, index=True, comment='User who gave/withdrew consent'),
        
        # Consent Details
        sa.Column('consent_type', sa.String(50), nullable=False, index=True, comment='Type of consent'),
        sa.Column('status', sa.String(20), nullable=False, default='pending', comment='Current consent status'),
        sa.Column('consent_version', sa.String(50), nullable=False, comment='Version of the consent document'),
        
        # Consent Metadata for PIPEDA Compliance
        sa.Column('granted_at', sa.DateTime(timezone=True), nullable=True, comment='When consent was granted'),
        sa.Column('withdrawn_at', sa.DateTime(timezone=True), nullable=True, comment='When consent was withdrawn'),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True, comment='When consent expires (if applicable)'),
        
        # Technical Details for Audit Trail
        sa.Column('ip_address', sa.String(45), nullable=True, comment='IP address when consent was given/withdrawn'),
        sa.Column('user_agent', sa.Text(), nullable=True, comment='User agent when consent was given/withdrawn'),
        
        # Legal and Compliance Information
        sa.Column('legal_basis', sa.String(100), nullable=True, comment='Legal basis for processing under PIPEDA'),
        sa.Column('purpose', sa.Text(), nullable=False, comment='Purpose for which data will be used'),
        sa.Column('data_categories', JSON, nullable=True, comment='Categories of personal data covered by this consent'),
        sa.Column('processing_activities', JSON, nullable=True, comment='Specific processing activities covered'),
        sa.Column('third_parties', JSON, nullable=True, comment='Third parties with whom data may be shared'),
        
        # Geographic and Jurisdictional Information
        sa.Column('jurisdiction', sa.String(50), nullable=False, default='Canada', comment='Legal jurisdiction for this consent'),
        sa.Column('province', sa.String(2), nullable=True, comment='Canadian province where consent was given'),
        
        # Consent Method and Context
        sa.Column('consent_method', sa.String(50), nullable=False, comment='How consent was obtained (web, mobile, email, etc.)'),
        sa.Column('consent_context', sa.String(100), nullable=True, comment='Context in which consent was requested'),
        sa.Column('consent_evidence', JSON, nullable=True, comment='Evidence and artifacts of consent process'),
        
        # Renewal and Review
        sa.Column('requires_renewal', sa.Boolean(), nullable=False, default=False, comment='Whether this consent requires periodic renewal'),
        sa.Column('renewal_period_months', sa.Integer(), nullable=True, comment='How often consent should be renewed (in months)'),
        sa.Column('last_reviewed_at', sa.DateTime(timezone=True), nullable=True, comment='When consent was last reviewed by user'),
        sa.Column('review_reminder_sent_at', sa.DateTime(timezone=True), nullable=True, comment='When review reminder was last sent'),
        
        comment='PIPEDA-compliant consent records with full audit trail'
    )
    
    # =============================================================================
    # Consent Audit Logs Table - Complete Audit Trail
    # =============================================================================
    op.create_table('consent_audit_logs',
        # Primary Key and Audit Fields
        sa.Column('id', UUID(as_uuid=True), primary_key=True, nullable=False, comment='Unique identifier'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, comment='Record creation timestamp (UTC)'),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, comment='Record last update timestamp (UTC)'),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True, comment='Soft delete timestamp (PIPEDA compliance)'),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, default=False, comment='Soft delete flag'),
        sa.Column('created_by', UUID(as_uuid=True), nullable=True, comment='User who created this record'),
        sa.Column('updated_by', UUID(as_uuid=True), nullable=True, comment='User who last updated this record'),
        sa.Column('deleted_by', UUID(as_uuid=True), nullable=True, comment='User who deleted this record'),
        
        # Consent Record Reference
        sa.Column('consent_record_id', UUID(as_uuid=True), nullable=False, index=True, comment='Related consent record'),
        sa.Column('user_id', UUID(as_uuid=True), nullable=False, index=True, comment='User who performed the action'),
        
        # Audit Details
        sa.Column('action', sa.String(50), nullable=False, comment='Action performed (grant, withdraw, expire, review, etc.)'),
        sa.Column('previous_status', sa.String(20), nullable=True, comment='Previous consent status'),
        sa.Column('new_status', sa.String(20), nullable=False, comment='New consent status'),
        
        # Technical Metadata
        sa.Column('ip_address', sa.String(45), nullable=True, comment='IP address of the user'),
        sa.Column('user_agent', sa.Text(), nullable=True, comment='User agent string'),
        sa.Column('session_id', sa.String(100), nullable=True, comment='Session identifier'),
        
        # Additional Context
        sa.Column('reason', sa.Text(), nullable=True, comment='Reason for the action'),
        sa.Column('metadata', JSON, nullable=True, comment='Additional metadata about the action'),
        
        # PIPEDA Compliance Fields
        sa.Column('retention_until', sa.DateTime(timezone=True), nullable=True, comment='When this audit record should be purged'),
        
        comment='Comprehensive audit log for all consent-related activities'
    )
    
    # =============================================================================
    # Foreign Key Constraints
    # =============================================================================
    op.create_foreign_key('fk_children_parent_id', 'children', 'users', ['parent_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key('fk_consent_records_user_id', 'consent_records', 'users', ['user_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key('fk_consent_audit_logs_consent_record_id', 'consent_audit_logs', 'consent_records', ['consent_record_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key('fk_consent_audit_logs_user_id', 'consent_audit_logs', 'users', ['user_id'], ['id'], ondelete='CASCADE')
    
    # =============================================================================
    # Indexes for Performance and Compliance
    # =============================================================================
    # User indexes
    op.create_index('idx_users_email_active', 'users', ['email'], unique=True, postgresql_where=sa.text('is_deleted = false'))
    op.create_index('idx_users_supabase_id_active', 'users', ['supabase_user_id'], unique=True, postgresql_where=sa.text('is_deleted = false'))
    op.create_index('idx_users_status', 'users', ['status'])
    op.create_index('idx_users_created_at', 'users', ['created_at'])
    op.create_index('idx_users_province', 'users', ['province'])
    
    # Children indexes
    op.create_index('idx_children_parent_id_active', 'children', ['parent_id'], postgresql_where=sa.text('is_deleted = false'))
    op.create_index('idx_children_date_of_birth', 'children', ['date_of_birth'])
    op.create_index('idx_children_current_size', 'children', ['current_diaper_size'])
    op.create_index('idx_children_onboarding', 'children', ['onboarding_completed'])
    
    # Consent records indexes
    op.create_index('idx_consent_records_user_type', 'consent_records', ['user_id', 'consent_type'])
    op.create_index('idx_consent_records_status', 'consent_records', ['status'])
    op.create_index('idx_consent_records_granted_at', 'consent_records', ['granted_at'])
    op.create_index('idx_consent_records_expires_at', 'consent_records', ['expires_at'])
    
    # Audit logs indexes
    op.create_index('idx_consent_audit_logs_user_id_created', 'consent_audit_logs', ['user_id', 'created_at'])
    op.create_index('idx_consent_audit_logs_consent_record', 'consent_audit_logs', ['consent_record_id'])
    op.create_index('idx_consent_audit_logs_action', 'consent_audit_logs', ['action'])


def downgrade() -> None:
    """
    Remove all tables created in upgrade
    
    PIPEDA Compliance Notes:
    - This downgrade removes all tables but preserves audit requirements
    - In production, consider data backup before running downgrade
    - Audit logs should be archived separately for compliance
    """
    # Drop foreign key constraints first
    op.drop_constraint('fk_consent_audit_logs_user_id', 'consent_audit_logs', type_='foreignkey')
    op.drop_constraint('fk_consent_audit_logs_consent_record_id', 'consent_audit_logs', type_='foreignkey')
    op.drop_constraint('fk_consent_records_user_id', 'consent_records', type_='foreignkey')
    op.drop_constraint('fk_children_parent_id', 'children', type_='foreignkey')
    
    # Drop tables in reverse order
    op.drop_table('consent_audit_logs')
    op.drop_table('consent_records')
    op.drop_table('children')
    op.drop_table('users')