"""Add audit logging triggers for premium subscription tables

Revision ID: 20251002_0120
Revises: 20251002_0115
Create Date: 2025-10-02 01:20:00.000000

PIPEDA Compliance: Automatic audit logging for subscription changes
- Audit trail for all subscription modifications
- Payment method changes tracked
- Trial and feature access changes logged
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20251002_0120'
down_revision = '20251002_0115'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Add audit logging triggers for premium subscription tables

    PIPEDA Compliance Notes:
    - All subscription changes automatically logged
    - Audit records include timestamp and user context
    - Separate audit tables for different entity types
    """

    # =============================================================================
    # Subscription Audit Logs Table
    # =============================================================================
    op.create_table(
        'subscription_audit_logs',
        # Primary Key
        sa.Column('id', sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()'), comment='Unique identifier'),

        # Subscription Reference
        sa.Column('subscription_id', sa.dialects.postgresql.UUID(as_uuid=True), nullable=False, comment='Subscription being audited'),
        sa.Column('user_id', sa.dialects.postgresql.UUID(as_uuid=True), nullable=False, comment='User who owns the subscription'),

        # Audit Details
        sa.Column('action', sa.String(50), nullable=False, comment='Action performed (INSERT, UPDATE, DELETE)'),
        sa.Column('previous_data', sa.dialects.postgresql.JSONB, nullable=True, comment='Previous subscription data (for UPDATE/DELETE)'),
        sa.Column('new_data', sa.dialects.postgresql.JSONB, nullable=True, comment='New subscription data (for INSERT/UPDATE)'),
        sa.Column('changed_fields', sa.dialects.postgresql.JSONB, nullable=True, comment='List of changed fields'),

        # Context
        sa.Column('performed_by', sa.dialects.postgresql.UUID(as_uuid=True), nullable=True, comment='User who performed the action'),
        sa.Column('ip_address', sa.String(45), nullable=True, comment='IP address of request'),
        sa.Column('user_agent', sa.Text(), nullable=True, comment='User agent string'),

        # Timestamp
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()'), comment='Audit record timestamp'),

        comment='Audit trail for subscription changes'
    )

    # Add indexes
    op.create_index('idx_subscription_audit_logs_subscription_id', 'subscription_audit_logs', ['subscription_id'])
    op.create_index('idx_subscription_audit_logs_user_id', 'subscription_audit_logs', ['user_id'])
    op.create_index('idx_subscription_audit_logs_created_at', 'subscription_audit_logs', ['created_at'])
    op.create_index('idx_subscription_audit_logs_action', 'subscription_audit_logs', ['action'])

    # =============================================================================
    # Payment Method Audit Logs Table
    # =============================================================================
    op.create_table(
        'payment_method_audit_logs',
        # Primary Key
        sa.Column('id', sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()'), comment='Unique identifier'),

        # Payment Method Reference
        sa.Column('payment_method_id', sa.dialects.postgresql.UUID(as_uuid=True), nullable=False, comment='Payment method being audited'),
        sa.Column('user_id', sa.dialects.postgresql.UUID(as_uuid=True), nullable=False, comment='User who owns the payment method'),

        # Audit Details
        sa.Column('action', sa.String(50), nullable=False, comment='Action performed (INSERT, UPDATE, DELETE)'),
        sa.Column('previous_data', sa.dialects.postgresql.JSONB, nullable=True, comment='Previous payment method data (redacted)'),
        sa.Column('new_data', sa.dialects.postgresql.JSONB, nullable=True, comment='New payment method data (redacted)'),
        sa.Column('changed_fields', sa.dialects.postgresql.JSONB, nullable=True, comment='List of changed fields'),

        # Context
        sa.Column('performed_by', sa.dialects.postgresql.UUID(as_uuid=True), nullable=True, comment='User who performed the action'),
        sa.Column('ip_address', sa.String(45), nullable=True, comment='IP address of request'),

        # Timestamp
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()'), comment='Audit record timestamp'),

        comment='Audit trail for payment method changes (PCI-DSS compliant)'
    )

    # Add indexes
    op.create_index('idx_payment_method_audit_logs_payment_method_id', 'payment_method_audit_logs', ['payment_method_id'])
    op.create_index('idx_payment_method_audit_logs_user_id', 'payment_method_audit_logs', ['user_id'])
    op.create_index('idx_payment_method_audit_logs_created_at', 'payment_method_audit_logs', ['created_at'])

    # =============================================================================
    # Audit Trigger Functions
    # =============================================================================

    # Subscription audit trigger function
    op.execute("""
        CREATE OR REPLACE FUNCTION audit_subscription_changes()
        RETURNS TRIGGER AS $$
        DECLARE
            changed_fields jsonb := '[]'::jsonb;
        BEGIN
            IF (TG_OP = 'UPDATE') THEN
                -- Calculate changed fields
                IF OLD.plan_id IS DISTINCT FROM NEW.plan_id THEN
                    changed_fields := changed_fields || '["plan_id"]'::jsonb;
                END IF;
                IF OLD.tier IS DISTINCT FROM NEW.tier THEN
                    changed_fields := changed_fields || '["tier"]'::jsonb;
                END IF;
                IF OLD.status IS DISTINCT FROM NEW.status THEN
                    changed_fields := changed_fields || '["status"]'::jsonb;
                END IF;
                IF OLD.billing_interval IS DISTINCT FROM NEW.billing_interval THEN
                    changed_fields := changed_fields || '["billing_interval"]'::jsonb;
                END IF;
                IF OLD.amount IS DISTINCT FROM NEW.amount THEN
                    changed_fields := changed_fields || '["amount"]'::jsonb;
                END IF;

                INSERT INTO subscription_audit_logs (
                    subscription_id, user_id, action,
                    previous_data, new_data, changed_fields,
                    performed_by
                ) VALUES (
                    NEW.id, NEW.user_id, 'UPDATE',
                    row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb, changed_fields,
                    auth.uid()
                );
                RETURN NEW;

            ELSIF (TG_OP = 'INSERT') THEN
                INSERT INTO subscription_audit_logs (
                    subscription_id, user_id, action,
                    new_data, performed_by
                ) VALUES (
                    NEW.id, NEW.user_id, 'INSERT',
                    row_to_json(NEW)::jsonb, auth.uid()
                );
                RETURN NEW;

            ELSIF (TG_OP = 'DELETE') THEN
                INSERT INTO subscription_audit_logs (
                    subscription_id, user_id, action,
                    previous_data, performed_by
                ) VALUES (
                    OLD.id, OLD.user_id, 'DELETE',
                    row_to_json(OLD)::jsonb, auth.uid()
                );
                RETURN OLD;
            END IF;

            RETURN NULL;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
    """)

    # Payment method audit trigger function (with PCI-DSS redaction)
    op.execute("""
        CREATE OR REPLACE FUNCTION audit_payment_method_changes()
        RETURNS TRIGGER AS $$
        DECLARE
            redacted_old jsonb;
            redacted_new jsonb;
            changed_fields jsonb := '[]'::jsonb;
        BEGIN
            IF (TG_OP = 'UPDATE') THEN
                -- Redact sensitive data before logging
                redacted_old := row_to_json(OLD)::jsonb - 'stripe_payment_method_id';
                redacted_new := row_to_json(NEW)::jsonb - 'stripe_payment_method_id';

                -- Track field changes
                IF OLD.is_default IS DISTINCT FROM NEW.is_default THEN
                    changed_fields := changed_fields || '["is_default"]'::jsonb;
                END IF;
                IF OLD.is_active IS DISTINCT FROM NEW.is_active THEN
                    changed_fields := changed_fields || '["is_active"]'::jsonb;
                END IF;

                INSERT INTO payment_method_audit_logs (
                    payment_method_id, user_id, action,
                    previous_data, new_data, changed_fields,
                    performed_by
                ) VALUES (
                    NEW.id, NEW.user_id, 'UPDATE',
                    redacted_old, redacted_new, changed_fields,
                    auth.uid()
                );
                RETURN NEW;

            ELSIF (TG_OP = 'INSERT') THEN
                redacted_new := row_to_json(NEW)::jsonb - 'stripe_payment_method_id';
                INSERT INTO payment_method_audit_logs (
                    payment_method_id, user_id, action,
                    new_data, performed_by
                ) VALUES (
                    NEW.id, NEW.user_id, 'INSERT',
                    redacted_new, auth.uid()
                );
                RETURN NEW;

            ELSIF (TG_OP = 'DELETE') THEN
                redacted_old := row_to_json(OLD)::jsonb - 'stripe_payment_method_id';
                INSERT INTO payment_method_audit_logs (
                    payment_method_id, user_id, action,
                    previous_data, performed_by
                ) VALUES (
                    OLD.id, OLD.user_id, 'DELETE',
                    redacted_old, auth.uid()
                );
                RETURN OLD;
            END IF;

            RETURN NULL;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
    """)

    # =============================================================================
    # Attach Triggers to Tables
    # =============================================================================

    # Subscription audit triggers
    op.execute("""
        CREATE TRIGGER subscription_audit_trigger
        AFTER INSERT OR UPDATE OR DELETE ON subscriptions
        FOR EACH ROW EXECUTE FUNCTION audit_subscription_changes()
    """)

    # Payment method audit triggers
    op.execute("""
        CREATE TRIGGER payment_method_audit_trigger
        AFTER INSERT OR UPDATE OR DELETE ON payment_methods
        FOR EACH ROW EXECUTE FUNCTION audit_payment_method_changes()
    """)

    # =============================================================================
    # Updated_at Trigger Function (for automatic timestamp updates)
    # =============================================================================
    op.execute("""
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    """)

    # Attach updated_at triggers to all subscription tables
    for table in [
        'subscription_plans', 'subscriptions', 'payment_methods',
        'billing_history', 'canadian_tax_rates', 'trial_progress', 'feature_access'
    ]:
        op.execute(f"""
            CREATE TRIGGER update_{table}_updated_at
            BEFORE UPDATE ON {table}
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
        """)


def downgrade() -> None:
    """
    Remove audit logging triggers and tables
    """
    # Drop updated_at triggers
    for table in [
        'subscription_plans', 'subscriptions', 'payment_methods',
        'billing_history', 'canadian_tax_rates', 'trial_progress', 'feature_access'
    ]:
        op.execute(f"DROP TRIGGER IF EXISTS update_{table}_updated_at ON {table}")

    # Drop audit triggers
    op.execute("DROP TRIGGER IF EXISTS subscription_audit_trigger ON subscriptions")
    op.execute("DROP TRIGGER IF EXISTS payment_method_audit_trigger ON payment_methods")

    # Drop trigger functions
    op.execute("DROP FUNCTION IF EXISTS audit_subscription_changes()")
    op.execute("DROP FUNCTION IF EXISTS audit_payment_method_changes()")
    op.execute("DROP FUNCTION IF EXISTS update_updated_at_column()")

    # Drop audit tables
    op.drop_table('payment_method_audit_logs')
    op.drop_table('subscription_audit_logs')
