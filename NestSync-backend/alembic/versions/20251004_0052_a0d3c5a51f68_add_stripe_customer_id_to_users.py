"""add stripe_customer_id to users

Revision ID: a0d3c5a51f68
Revises: 20251002_0125
Create Date: 2025-10-04 00:52:23.157900-04:00

PIPEDA Compliance: This migration handles personal data according to Canadian privacy laws.
Data Residency: All data operations occur within Canadian data centers.
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a0d3c5a51f68'
down_revision = '20251002_0125'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Apply migration changes: Add stripe_customer_id to users table

    PIPEDA Compliance Notes:
    - Stripe Customer ID is payment metadata, not sensitive personal data
    - Enables Canadian subscription billing with Stripe
    - Audit trails maintained for billing operations
    """
    # Add stripe_customer_id column to users table
    op.add_column('users', sa.Column(
        'stripe_customer_id',
        sa.String(length=255),
        nullable=True,
        comment='Stripe Customer ID for subscription billing'
    ))

    # Create unique index for stripe_customer_id
    op.create_index(
        'ix_users_stripe_customer_id',
        'users',
        ['stripe_customer_id'],
        unique=True
    )


def downgrade() -> None:
    """
    Reverse migration changes: Remove stripe_customer_id from users table

    PIPEDA Compliance Notes:
    - Data rollback maintains compliance requirements
    - Subscription references preserved in Stripe system
    """
    # Drop index first
    op.drop_index('ix_users_stripe_customer_id', table_name='users')

    # Drop column
    op.drop_column('users', 'stripe_customer_id')