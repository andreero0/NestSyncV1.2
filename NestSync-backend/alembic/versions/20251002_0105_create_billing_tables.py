"""Create billing tables for Premium Upgrade Flow

Revision ID: 20251002_0105
Revises: 20251002_0100
Create Date: 2025-10-02 01:05:00.000000

PIPEDA Compliance: Billing history and Canadian tax rate management
- Complete billing transaction history with audit trail
- Canadian provincial tax rates (GST/PST/HST/QST)
- Tax calculation compliance for all provinces
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

# revision identifiers, used by Alembic.
revision = '20251002_0105'
down_revision = '20251002_0100'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Create billing history and Canadian tax rate tables

    PIPEDA Compliance Notes:
    - Billing records retained for tax compliance (7 years)
    - All transactions include Canadian tax calculations
    - Province-specific tax rates for GST/PST/HST/QST
    """

    # =============================================================================
    # Billing History Table - Complete Transaction History
    # =============================================================================
    op.create_table(
        'billing_history',
        # Primary Key and User Relationship
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()'), comment='Unique identifier'),
        sa.Column('user_id', UUID(as_uuid=True), nullable=False, comment='User ID'),
        sa.Column('subscription_id', UUID(as_uuid=True), nullable=True, comment='Related subscription ID'),

        # Transaction Details
        sa.Column('transaction_type', sa.String(50), nullable=False, comment='Transaction type'),
        sa.Column('description', sa.Text(), nullable=False, comment='Human-readable transaction description'),

        # Amounts (CAD)
        sa.Column('subtotal', sa.Numeric(10, 2), nullable=False, comment='Subtotal before tax'),
        sa.Column('tax_amount', sa.Numeric(10, 2), nullable=False, default=0, comment='Total tax amount'),
        sa.Column('total_amount', sa.Numeric(10, 2), nullable=False, comment='Total charged amount'),
        sa.Column('currency', sa.String(3), nullable=False, default='CAD', comment='Currency code'),

        # Tax Breakdown (Canadian Compliance)
        sa.Column('province', sa.String(2), nullable=True, comment='Province for tax calculation'),
        sa.Column('gst_amount', sa.Numeric(10, 2), nullable=True, comment='GST amount'),
        sa.Column('pst_amount', sa.Numeric(10, 2), nullable=True, comment='PST amount'),
        sa.Column('hst_amount', sa.Numeric(10, 2), nullable=True, comment='HST amount'),
        sa.Column('qst_amount', sa.Numeric(10, 2), nullable=True, comment='QST amount (Quebec)'),
        sa.Column('tax_rate', sa.Numeric(5, 4), nullable=True, comment='Combined tax rate applied'),

        # Payment Method and Status
        sa.Column('payment_method_id', UUID(as_uuid=True), nullable=True, comment='Payment method used'),
        sa.Column('status', sa.String(20), nullable=False, comment='Transaction status'),

        # Stripe Integration
        sa.Column('stripe_invoice_id', sa.String(100), nullable=True, unique=True, comment='Stripe Invoice ID'),
        sa.Column('stripe_charge_id', sa.String(100), nullable=True, comment='Stripe Charge ID'),
        sa.Column('stripe_payment_intent_id', sa.String(100), nullable=True, comment='Stripe PaymentIntent ID'),

        # Billing Period
        sa.Column('period_start', sa.DateTime(timezone=True), nullable=True, comment='Billing period start'),
        sa.Column('period_end', sa.DateTime(timezone=True), nullable=True, comment='Billing period end'),

        # Refund Information
        sa.Column('refunded', sa.Boolean(), nullable=False, default=False, comment='Whether this transaction was refunded'),
        sa.Column('refund_amount', sa.Numeric(10, 2), nullable=True, comment='Refund amount if refunded'),
        sa.Column('refund_reason', sa.Text(), nullable=True, comment='Reason for refund'),
        sa.Column('refunded_at', sa.DateTime(timezone=True), nullable=True, comment='Refund timestamp'),

        # Invoice and Receipt
        sa.Column('invoice_number', sa.String(50), nullable=True, unique=True, comment='Invoice number for accounting'),
        sa.Column('invoice_pdf_url', sa.Text(), nullable=True, comment='URL to invoice PDF'),
        sa.Column('receipt_url', sa.Text(), nullable=True, comment='URL to receipt'),

        # Additional Metadata
        sa.Column('metadata', JSONB, nullable=True, comment='Additional transaction metadata'),

        # Audit Fields
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()'), comment='Transaction timestamp'),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()'), comment='Record update timestamp'),

        comment='Complete billing transaction history with Canadian tax compliance'
    )

    # Add foreign key constraints
    op.create_foreign_key(
        'fk_billing_history_user_id',
        'billing_history', 'users',
        ['user_id'], ['id'],
        ondelete='CASCADE'
    )
    op.create_foreign_key(
        'fk_billing_history_subscription_id',
        'billing_history', 'subscriptions',
        ['subscription_id'], ['id'],
        ondelete='SET NULL'
    )
    op.create_foreign_key(
        'fk_billing_history_payment_method_id',
        'billing_history', 'payment_methods',
        ['payment_method_id'], ['id'],
        ondelete='SET NULL'
    )

    # Add check constraints
    op.create_check_constraint(
        'ck_billing_history_transaction_type',
        'billing_history',
        sa.text("transaction_type IN ('subscription_charge', 'upgrade', 'downgrade', 'refund', 'trial_conversion', 'renewal', 'cancellation_fee')")
    )
    op.create_check_constraint(
        'ck_billing_history_status',
        'billing_history',
        sa.text("status IN ('pending', 'succeeded', 'failed', 'refunded', 'canceled')")
    )

    # =============================================================================
    # Canadian Tax Rates Table - Province-Specific Tax Rates
    # =============================================================================
    op.create_table(
        'canadian_tax_rates',
        # Primary Key
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()'), comment='Unique identifier'),

        # Province Information
        sa.Column('province', sa.String(2), nullable=False, unique=True, comment='Province code (ON, QC, BC, etc.)'),
        sa.Column('province_name', sa.String(100), nullable=False, comment='Full province name'),

        # Tax Rates (stored as decimals, e.g., 0.05 for 5%)
        sa.Column('gst_rate', sa.Numeric(5, 4), nullable=True, comment='GST rate (federal)'),
        sa.Column('pst_rate', sa.Numeric(5, 4), nullable=True, comment='PST rate (provincial)'),
        sa.Column('hst_rate', sa.Numeric(5, 4), nullable=True, comment='HST rate (harmonized)'),
        sa.Column('qst_rate', sa.Numeric(5, 4), nullable=True, comment='QST rate (Quebec)'),
        sa.Column('combined_rate', sa.Numeric(5, 4), nullable=False, comment='Total combined tax rate'),

        # Tax Type
        sa.Column('tax_type', sa.String(20), nullable=False, comment='Tax type (GST+PST, HST, GST+QST)'),

        # Effective Dates
        sa.Column('effective_from', sa.Date(), nullable=False, comment='Rate effective start date'),
        sa.Column('effective_to', sa.Date(), nullable=True, comment='Rate effective end date'),

        # Metadata
        sa.Column('notes', sa.Text(), nullable=True, comment='Additional notes about tax rates'),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True, comment='Whether this rate is currently active'),

        # Audit Fields
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()'), comment='Record creation timestamp'),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()'), comment='Record update timestamp'),

        comment='Canadian provincial tax rates for billing calculations'
    )

    # Add check constraints
    op.create_check_constraint(
        'ck_canadian_tax_rates_tax_type',
        'canadian_tax_rates',
        sa.text("tax_type IN ('GST+PST', 'HST', 'GST+QST', 'GST')")
    )

    # =============================================================================
    # Indexes for Performance
    # =============================================================================

    # Billing History indexes
    op.create_index('idx_billing_history_user_id', 'billing_history', ['user_id'])
    op.create_index('idx_billing_history_subscription_id', 'billing_history', ['subscription_id'])
    op.create_index('idx_billing_history_created_at', 'billing_history', ['created_at'])
    op.create_index('idx_billing_history_status', 'billing_history', ['status'])
    op.create_index('idx_billing_history_stripe_invoice', 'billing_history', ['stripe_invoice_id'])
    op.create_index('idx_billing_history_invoice_number', 'billing_history', ['invoice_number'])

    # Canadian Tax Rates indexes
    op.create_index('idx_canadian_tax_rates_province', 'canadian_tax_rates', ['province'])
    op.create_index('idx_canadian_tax_rates_active', 'canadian_tax_rates', ['is_active'])
    op.create_index('idx_canadian_tax_rates_effective', 'canadian_tax_rates', ['effective_from', 'effective_to'])

    # =============================================================================
    # Insert Current Canadian Tax Rates (as of 2025)
    # =============================================================================

    # Ontario - HST
    op.execute("""
        INSERT INTO canadian_tax_rates (
            province, province_name, hst_rate, combined_rate, tax_type, effective_from, is_active
        ) VALUES (
            'ON', 'Ontario', 0.13, 0.13, 'HST', '2010-07-01', true
        )
    """)

    # Quebec - GST + QST
    op.execute("""
        INSERT INTO canadian_tax_rates (
            province, province_name, gst_rate, qst_rate, combined_rate, tax_type, effective_from, is_active
        ) VALUES (
            'QC', 'Quebec', 0.05, 0.09975, 0.14975, 'GST+QST', '2013-01-01', true
        )
    """)

    # British Columbia - GST + PST
    op.execute("""
        INSERT INTO canadian_tax_rates (
            province, province_name, gst_rate, pst_rate, combined_rate, tax_type, effective_from, is_active
        ) VALUES (
            'BC', 'British Columbia', 0.05, 0.07, 0.12, 'GST+PST', '2013-04-01', true
        )
    """)

    # Alberta - GST only
    op.execute("""
        INSERT INTO canadian_tax_rates (
            province, province_name, gst_rate, combined_rate, tax_type, effective_from, is_active
        ) VALUES (
            'AB', 'Alberta', 0.05, 0.05, 'GST', '1991-01-01', true
        )
    """)

    # Saskatchewan - GST + PST
    op.execute("""
        INSERT INTO canadian_tax_rates (
            province, province_name, gst_rate, pst_rate, combined_rate, tax_type, effective_from, is_active
        ) VALUES (
            'SK', 'Saskatchewan', 0.05, 0.06, 0.11, 'GST+PST', '2017-03-23', true
        )
    """)

    # Manitoba - GST + PST
    op.execute("""
        INSERT INTO canadian_tax_rates (
            province, province_name, gst_rate, pst_rate, combined_rate, tax_type, effective_from, is_active
        ) VALUES (
            'MB', 'Manitoba', 0.05, 0.07, 0.12, 'GST+PST', '2013-07-01', true
        )
    """)

    # Nova Scotia - HST
    op.execute("""
        INSERT INTO canadian_tax_rates (
            province, province_name, hst_rate, combined_rate, tax_type, effective_from, is_active
        ) VALUES (
            'NS', 'Nova Scotia', 0.15, 0.15, 'HST', '2010-07-01', true
        )
    """)

    # New Brunswick - HST
    op.execute("""
        INSERT INTO canadian_tax_rates (
            province, province_name, hst_rate, combined_rate, tax_type, effective_from, is_active
        ) VALUES (
            'NB', 'New Brunswick', 0.15, 0.15, 'HST', '2016-07-01', true
        )
    """)

    # Prince Edward Island - HST
    op.execute("""
        INSERT INTO canadian_tax_rates (
            province, province_name, hst_rate, combined_rate, tax_type, effective_from, is_active
        ) VALUES (
            'PE', 'Prince Edward Island', 0.15, 0.15, 'HST', '2016-10-01', true
        )
    """)

    # Newfoundland and Labrador - HST
    op.execute("""
        INSERT INTO canadian_tax_rates (
            province, province_name, hst_rate, combined_rate, tax_type, effective_from, is_active
        ) VALUES (
            'NL', 'Newfoundland and Labrador', 0.15, 0.15, 'HST', '2016-07-01', true
        )
    """)

    # Northwest Territories - GST only
    op.execute("""
        INSERT INTO canadian_tax_rates (
            province, province_name, gst_rate, combined_rate, tax_type, effective_from, is_active
        ) VALUES (
            'NT', 'Northwest Territories', 0.05, 0.05, 'GST', '1991-01-01', true
        )
    """)

    # Yukon - GST only
    op.execute("""
        INSERT INTO canadian_tax_rates (
            province, province_name, gst_rate, combined_rate, tax_type, effective_from, is_active
        ) VALUES (
            'YT', 'Yukon', 0.05, 0.05, 'GST', '1991-01-01', true
        )
    """)

    # Nunavut - GST only
    op.execute("""
        INSERT INTO canadian_tax_rates (
            province, province_name, gst_rate, combined_rate, tax_type, effective_from, is_active
        ) VALUES (
            'NU', 'Nunavut', 0.05, 0.05, 'GST', '1999-04-01', true
        )
    """)


def downgrade() -> None:
    """
    Remove billing tables

    PIPEDA Compliance Notes:
    - Archive billing records before downgrade (7-year retention)
    - Preserve tax records for compliance audits
    """
    # Drop tables in reverse order
    op.drop_table('canadian_tax_rates')
    op.drop_table('billing_history')
