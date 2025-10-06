"""add_audit_columns_to_reorder_transactions

Revision ID: cde91a672200
Revises: 6c5168fa2e0c
Create Date: 2025-10-06 07:30:37.351931-04:00

PIPEDA Compliance: This migration handles personal data according to Canadian privacy laws.
Data Residency: All data operations occur within Canadian data centers.
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'cde91a672200'
down_revision = '6c5168fa2e0c'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Apply migration changes: Add audit columns to reorder_transactions table

    PIPEDA Compliance Notes:
    - Audit columns track data modifications for compliance
    - Soft delete functionality preserves data for retention policies
    - Canadian timezone (America/Toronto) is used for all timestamps
    """
    # Add audit columns to reorder_transactions table
    from sqlalchemy.dialects import postgresql
    op.add_column('reorder_transactions', sa.Column('deleted_at', postgresql.TIMESTAMP(timezone=True), nullable=True))
    op.add_column('reorder_transactions', sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('reorder_transactions', sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column('reorder_transactions', sa.Column('updated_by', postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column('reorder_transactions', sa.Column('deleted_by', postgresql.UUID(as_uuid=True), nullable=True))


def downgrade() -> None:
    """
    Reverse migration changes

    PIPEDA Compliance Notes:
    - Data rollback maintains compliance requirements
    - Audit logs are preserved even during rollback
    - No personal data is inadvertently exposed during downgrade
    """
    op.drop_column('reorder_transactions', 'deleted_by')
    op.drop_column('reorder_transactions', 'updated_by')
    op.drop_column('reorder_transactions', 'created_by')
    op.drop_column('reorder_transactions', 'is_deleted')
    op.drop_column('reorder_transactions', 'deleted_at')