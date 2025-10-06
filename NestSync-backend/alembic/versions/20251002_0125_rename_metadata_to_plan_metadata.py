"""Rename metadata columns to match model field names

Revision ID: 20251002_0125
Revises: 20251002_0120
Create Date: 2025-10-02 01:25:00.000000

Fix schema mismatch between migrations and SQLAlchemy models.
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20251002_0125'
down_revision = '20251002_0120'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Rename metadata columns to match model field names."""

    # Rename subscription_plans.metadata to plan_metadata
    op.alter_column(
        'subscription_plans',
        'metadata',
        new_column_name='plan_metadata',
        existing_type=sa.dialects.postgresql.JSONB,
        existing_nullable=True,
        existing_comment='Additional plan metadata'
    )

    # Rename billing_history.metadata to billing_metadata
    op.alter_column(
        'billing_history',
        'metadata',
        new_column_name='billing_metadata',
        existing_type=sa.dialects.postgresql.JSONB,
        existing_nullable=True,
        existing_comment='Additional metadata'
    )

    # Rename trial_progress.metadata to trial_metadata
    op.alter_column(
        'trial_progress',
        'metadata',
        new_column_name='trial_metadata',
        existing_type=sa.dialects.postgresql.JSONB,
        existing_nullable=True,
        existing_comment='Additional metadata'
    )

    # Rename feature_access.metadata to feature_metadata
    op.alter_column(
        'feature_access',
        'metadata',
        new_column_name='feature_metadata',
        existing_type=sa.dialects.postgresql.JSONB,
        existing_nullable=True,
        existing_comment='Additional metadata'
    )


def downgrade() -> None:
    """Revert metadata column renames."""

    # Revert subscription_plans.plan_metadata to metadata
    op.alter_column(
        'subscription_plans',
        'plan_metadata',
        new_column_name='metadata',
        existing_type=sa.dialects.postgresql.JSONB,
        existing_nullable=True,
        existing_comment='Additional plan metadata'
    )

    # Revert billing_history.billing_metadata to metadata
    op.alter_column(
        'billing_history',
        'billing_metadata',
        new_column_name='metadata',
        existing_type=sa.dialects.postgresql.JSONB,
        existing_nullable=True,
        existing_comment='Additional metadata'
    )

    # Revert trial_progress.trial_metadata to metadata
    op.alter_column(
        'trial_progress',
        'trial_metadata',
        new_column_name='metadata',
        existing_type=sa.dialects.postgresql.JSONB,
        existing_nullable=True,
        existing_comment='Additional metadata'
    )

    # Revert feature_access.feature_metadata to metadata
    op.alter_column(
        'feature_access',
        'feature_metadata',
        new_column_name='metadata',
        existing_type=sa.dialects.postgresql.JSONB,
        existing_nullable=True,
        existing_comment='Additional metadata'
    )
