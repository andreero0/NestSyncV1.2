"""Remove subscription tables and grant all feature access

Revision ID: remove_subscriptions
Revises:
Create Date: 2025-11-19

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'remove_subscriptions'
down_revision: Union[str, None] = None  # Update with actual previous revision
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Remove subscription-related tables and grant all feature access."""

    # Drop payment-related tables
    op.execute("DROP TABLE IF EXISTS billing_history CASCADE;")
    op.execute("DROP TABLE IF EXISTS payment_methods CASCADE;")
    op.execute("DROP TABLE IF EXISTS trial_progress CASCADE;")
    op.execute("DROP TABLE IF EXISTS canadian_tax_rates CASCADE;")

    # Archive subscriptions table instead of dropping (for historical data)
    try:
        op.add_column('subscriptions', sa.Column('archived_at', sa.TIMESTAMP(timezone=True), nullable=True))
        op.execute("UPDATE subscriptions SET archived_at = NOW();")
        print("✓ Archived subscription records")
    except:
        print("⚠ Subscriptions table may not exist or already archived")
        pass

    # Grant all users full feature access
    try:
        op.execute("""
            UPDATE feature_access
            SET has_analytics = true,
                has_automation = true,
                has_collaboration = true,
                updated_at = NOW();
        """)
        print("✓ Granted all users full feature access")
    except:
        print("⚠ Feature access table may not exist")
        pass


def downgrade() -> None:
    """Rollback not supported - use git tag 'pre-payment-removal' instead."""
    raise NotImplementedError("Downgrade not supported. Use git rollback instead.")
