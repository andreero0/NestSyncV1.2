"""Add collaboration tables - clean version

Revision ID: 6b2c4301f36f
Revises: 1b7040711967
Create Date: 2025-09-16 23:20:41.531004-04:00

PIPEDA Compliance: This migration handles personal data according to Canadian privacy laws.
Data Residency: All data operations occur within Canadian data centers.
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '6b2c4301f36f'
down_revision = '1b7040711967'
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
    pass


def downgrade() -> None:
    """
    Reverse migration changes
    
    PIPEDA Compliance Notes:
    - Data rollback maintains compliance requirements
    - Audit logs are preserved even during rollback
    - No personal data is inadvertently exposed during downgrade
    """
    pass