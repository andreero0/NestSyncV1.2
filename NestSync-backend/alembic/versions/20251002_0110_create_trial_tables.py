"""Create trial tables for Premium Upgrade Flow

Revision ID: 20251002_0110
Revises: 20251002_0105
Create Date: 2025-10-02 01:10:00.000000

PIPEDA Compliance: Trial progress tracking and feature access management
- Trial progress tracking with value demonstration
- Feature access control for premium tiers
- Trial usage event logging for analytics
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

# revision identifiers, used by Alembic.
revision = '20251002_0110'
down_revision = '20251002_0105'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Create trial progress and feature access tables

    PIPEDA Compliance Notes:
    - Trial usage tracked for value demonstration
    - Feature access enforced at database level
    - Analytics consent required for detailed tracking
    """

    # =============================================================================
    # Trial Progress Table - Track Trial Value Demonstration
    # =============================================================================
    op.create_table(
        'trial_progress',
        # Primary Key and User Relationship
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()'), comment='Unique identifier'),
        sa.Column('user_id', UUID(as_uuid=True), nullable=False, unique=True, comment='User ID (one trial record per user)'),
        sa.Column('subscription_id', UUID(as_uuid=True), nullable=True, comment='Related subscription ID'),

        # Trial Status
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True, comment='Trial currently active'),
        sa.Column('trial_tier', sa.String(20), nullable=False, comment='Trial tier (standard, premium)'),

        # Trial Period
        sa.Column('trial_started_at', sa.DateTime(timezone=True), nullable=False, comment='Trial start timestamp'),
        sa.Column('trial_ends_at', sa.DateTime(timezone=True), nullable=False, comment='Trial end timestamp'),
        sa.Column('days_remaining', sa.Integer(), nullable=False, comment='Calculated days remaining in trial'),

        # Trial Conversion
        sa.Column('converted_to_paid', sa.Boolean(), nullable=False, default=False, comment='Whether trial converted to paid'),
        sa.Column('converted_at', sa.DateTime(timezone=True), nullable=True, comment='Conversion timestamp'),
        sa.Column('conversion_plan_id', sa.String(50), nullable=True, comment='Plan user converted to'),

        # Trial Cancellation
        sa.Column('canceled', sa.Boolean(), nullable=False, default=False, comment='Whether trial was canceled early'),
        sa.Column('canceled_at', sa.DateTime(timezone=True), nullable=True, comment='Cancellation timestamp'),
        sa.Column('cancellation_reason', sa.Text(), nullable=True, comment='User-provided cancellation reason'),

        # Value Demonstration Metrics
        sa.Column('features_used_count', sa.Integer(), nullable=False, default=0, comment='Number of unique premium features used'),
        sa.Column('usage_days', sa.Integer(), nullable=False, default=0, comment='Number of days user actively used trial'),
        sa.Column('value_saved_estimate', sa.Numeric(10, 2), nullable=True, comment='Estimated CAD value saved during trial'),

        # Feature Usage Tracking
        sa.Column('family_sharing_used', sa.Boolean(), nullable=False, default=False, comment='Used family sharing feature'),
        sa.Column('reorder_suggestions_used', sa.Boolean(), nullable=False, default=False, comment='Used reorder suggestions'),
        sa.Column('analytics_viewed', sa.Boolean(), nullable=False, default=False, comment='Viewed analytics dashboard'),
        sa.Column('price_alerts_used', sa.Boolean(), nullable=False, default=False, comment='Used price alerts (premium only)'),
        sa.Column('automation_used', sa.Boolean(), nullable=False, default=False, comment='Used automation features (premium only)'),

        # Engagement Metrics
        sa.Column('last_activity_at', sa.DateTime(timezone=True), nullable=True, comment='Last trial activity timestamp'),
        sa.Column('engagement_score', sa.Integer(), nullable=True, comment='Calculated engagement score (0-100)'),

        # Conversion Nudges
        sa.Column('soft_prompts_shown', sa.Integer(), nullable=False, default=0, comment='Number of soft conversion prompts shown'),
        sa.Column('last_prompt_shown_at', sa.DateTime(timezone=True), nullable=True, comment='Last prompt timestamp'),
        sa.Column('upgrade_prompt_clicked', sa.Boolean(), nullable=False, default=False, comment='Whether user clicked upgrade prompt'),

        # Additional Metadata
        sa.Column('metadata', JSONB, nullable=True, comment='Additional trial metadata and tracking'),

        # Audit Fields
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()'), comment='Record creation timestamp'),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()'), comment='Record update timestamp'),

        comment='Trial progress tracking with value demonstration and conversion metrics'
    )

    # Add foreign key constraints
    op.create_foreign_key(
        'fk_trial_progress_user_id',
        'trial_progress', 'users',
        ['user_id'], ['id'],
        ondelete='CASCADE'
    )
    op.create_foreign_key(
        'fk_trial_progress_subscription_id',
        'trial_progress', 'subscriptions',
        ['subscription_id'], ['id'],
        ondelete='SET NULL'
    )

    # Add check constraints
    op.create_check_constraint(
        'ck_trial_progress_tier',
        'trial_progress',
        sa.text("trial_tier IN ('standard', 'premium')")
    )

    # =============================================================================
    # Trial Usage Events Table - Detailed Feature Usage Tracking
    # =============================================================================
    op.create_table(
        'trial_usage_events',
        # Primary Key and User Relationship
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()'), comment='Unique identifier'),
        sa.Column('trial_progress_id', UUID(as_uuid=True), nullable=False, comment='Trial progress record ID'),
        sa.Column('user_id', UUID(as_uuid=True), nullable=False, comment='User ID'),

        # Event Details
        sa.Column('event_type', sa.String(50), nullable=False, comment='Type of trial event'),
        sa.Column('feature_used', sa.String(100), nullable=True, comment='Specific feature used'),
        sa.Column('event_description', sa.Text(), nullable=True, comment='Human-readable event description'),

        # Value Metrics
        sa.Column('value_saved', sa.Numeric(10, 2), nullable=True, comment='Estimated value saved from this event'),
        sa.Column('time_saved_minutes', sa.Integer(), nullable=True, comment='Estimated time saved in minutes'),

        # Context
        sa.Column('screen', sa.String(100), nullable=True, comment='Screen where event occurred'),
        sa.Column('context', JSONB, nullable=True, comment='Additional event context'),

        # Timestamp
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()'), comment='Event timestamp'),

        comment='Detailed trial usage event tracking for analytics and value demonstration'
    )

    # Add foreign key constraints
    op.create_foreign_key(
        'fk_trial_usage_events_trial_progress_id',
        'trial_usage_events', 'trial_progress',
        ['trial_progress_id'], ['id'],
        ondelete='CASCADE'
    )
    op.create_foreign_key(
        'fk_trial_usage_events_user_id',
        'trial_usage_events', 'users',
        ['user_id'], ['id'],
        ondelete='CASCADE'
    )

    # Add check constraints
    op.create_check_constraint(
        'ck_trial_usage_events_event_type',
        'trial_usage_events',
        sa.text("event_type IN ('feature_used', 'value_saved', 'prompt_shown', 'prompt_clicked', 'trial_started', 'trial_ended', 'trial_converted', 'trial_canceled')")
    )

    # =============================================================================
    # Feature Access Table - Premium Feature Access Control
    # =============================================================================
    op.create_table(
        'feature_access',
        # Primary Key and User Relationship
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()'), comment='Unique identifier'),
        sa.Column('user_id', UUID(as_uuid=True), nullable=False, comment='User ID'),
        sa.Column('subscription_id', UUID(as_uuid=True), nullable=True, comment='Related subscription ID'),

        # Feature Details
        sa.Column('feature_id', sa.String(100), nullable=False, comment='Feature identifier'),
        sa.Column('feature_name', sa.String(100), nullable=False, comment='Human-readable feature name'),
        sa.Column('tier_required', sa.String(20), nullable=False, comment='Minimum tier required (free, standard, premium)'),

        # Access Status
        sa.Column('has_access', sa.Boolean(), nullable=False, default=False, comment='Whether user currently has access'),
        sa.Column('access_source', sa.String(50), nullable=False, comment='Source of access (subscription, trial, promo)'),

        # Usage Limits
        sa.Column('usage_limit', sa.Integer(), nullable=True, comment='Usage limit for this feature (null = unlimited)'),
        sa.Column('usage_count', sa.Integer(), nullable=False, default=0, comment='Current usage count'),
        sa.Column('limit_reset_at', sa.DateTime(timezone=True), nullable=True, comment='When usage limit resets'),

        # Access Period
        sa.Column('access_granted_at', sa.DateTime(timezone=True), nullable=False, comment='When access was granted'),
        sa.Column('access_expires_at', sa.DateTime(timezone=True), nullable=True, comment='When access expires (null = no expiration)'),

        # Additional Metadata
        sa.Column('metadata', JSONB, nullable=True, comment='Additional feature access metadata'),

        # Audit Fields
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()'), comment='Record creation timestamp'),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()'), comment='Record update timestamp'),

        comment='Premium feature access control and usage tracking'
    )

    # Add foreign key constraints
    op.create_foreign_key(
        'fk_feature_access_user_id',
        'feature_access', 'users',
        ['user_id'], ['id'],
        ondelete='CASCADE'
    )
    op.create_foreign_key(
        'fk_feature_access_subscription_id',
        'feature_access', 'subscriptions',
        ['subscription_id'], ['id'],
        ondelete='SET NULL'
    )

    # Add check constraints
    op.create_check_constraint(
        'ck_feature_access_tier_required',
        'feature_access',
        sa.text("tier_required IN ('free', 'standard', 'premium')")
    )
    op.create_check_constraint(
        'ck_feature_access_access_source',
        'feature_access',
        sa.text("access_source IN ('subscription', 'trial', 'promo', 'lifetime', 'admin_grant')")
    )

    # Add unique constraint (one access record per user per feature)
    op.create_unique_constraint(
        'uq_feature_access_user_feature',
        'feature_access',
        ['user_id', 'feature_id']
    )

    # =============================================================================
    # Indexes for Performance
    # =============================================================================

    # Trial Progress indexes
    op.create_index('idx_trial_progress_user_id', 'trial_progress', ['user_id'])
    op.create_index('idx_trial_progress_active', 'trial_progress', ['is_active'])
    op.create_index('idx_trial_progress_ends_at', 'trial_progress', ['trial_ends_at'])
    op.create_index('idx_trial_progress_converted', 'trial_progress', ['converted_to_paid'])

    # Trial Usage Events indexes
    op.create_index('idx_trial_usage_events_trial_progress', 'trial_usage_events', ['trial_progress_id'])
    op.create_index('idx_trial_usage_events_user_id', 'trial_usage_events', ['user_id'])
    op.create_index('idx_trial_usage_events_created_at', 'trial_usage_events', ['created_at'])
    op.create_index('idx_trial_usage_events_event_type', 'trial_usage_events', ['event_type'])

    # Feature Access indexes
    op.create_index('idx_feature_access_user_id', 'feature_access', ['user_id'])
    op.create_index('idx_feature_access_feature_id', 'feature_access', ['feature_id'])
    op.create_index('idx_feature_access_has_access', 'feature_access', ['user_id', 'has_access'])
    op.create_index('idx_feature_access_expires_at', 'feature_access', ['access_expires_at'])


def downgrade() -> None:
    """
    Remove trial tables

    PIPEDA Compliance Notes:
    - Archive trial data before downgrade
    - Preserve analytics consent-based tracking
    """
    # Drop tables in reverse order
    op.drop_table('feature_access')
    op.drop_table('trial_usage_events')
    op.drop_table('trial_progress')
