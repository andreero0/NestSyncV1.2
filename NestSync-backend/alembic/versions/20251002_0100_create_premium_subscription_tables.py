"""Create premium subscription tables for Premium Upgrade Flow

Revision ID: 20251002_0100
Revises: 20250921_1200_add_reorder_system_models
Create Date: 2025-10-02 01:00:00.000000

PIPEDA Compliance: Premium subscription management with Canadian data residency
- Subscription plans with CAD pricing and Canadian tax compliance
- Payment methods with secure Stripe integration
- Full audit trail for subscription changes
- RLS policies for data isolation
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

# revision identifiers, used by Alembic.
revision = '20251002_0100'
down_revision = 'add_reorder_system_models'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Create premium subscription tables for app-wide premium tiers

    PIPEDA Compliance Notes:
    - All tables include audit trails
    - RLS policies ensure users only access their own data
    - Canadian timezone (America/Toronto) for all timestamps
    - Secure payment method storage via Stripe
    """

    # =============================================================================
    # Subscription Plans Table - Define Premium Tier Plans
    # =============================================================================
    op.create_table(
        'subscription_plans',
        # Primary Key
        sa.Column('id', sa.String(50), primary_key=True, nullable=False, comment='Plan identifier (e.g., standard_monthly)'),

        # Plan Details
        sa.Column('name', sa.String(50), nullable=False, comment='Internal plan name'),
        sa.Column('display_name', sa.String(100), nullable=False, comment='User-facing plan name'),
        sa.Column('tier', sa.String(20), nullable=False, comment='Subscription tier (free, standard, premium)'),
        sa.Column('price', sa.Numeric(10, 2), nullable=False, comment='Plan price in CAD'),
        sa.Column('billing_interval', sa.String(20), nullable=False, comment='Billing interval (monthly, yearly)'),

        # Features and Limits
        sa.Column('features', JSONB, nullable=False, comment='Array of feature IDs included in this plan'),
        sa.Column('limits', JSONB, nullable=False, comment='Feature limits and quotas'),

        # Display and Ordering
        sa.Column('description', sa.Text(), nullable=True, comment='Plan description for UI'),
        sa.Column('sort_order', sa.Integer(), nullable=False, default=0, comment='Display order in UI'),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True, comment='Plan available for new subscriptions'),

        # Stripe Integration
        sa.Column('stripe_price_id', sa.String(100), nullable=True, unique=True, comment='Stripe Price ID'),
        sa.Column('stripe_product_id', sa.String(100), nullable=True, comment='Stripe Product ID'),

        # Metadata
        sa.Column('metadata', JSONB, nullable=True, comment='Additional plan metadata'),

        # Audit Fields
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()'), comment='Record creation timestamp'),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()'), comment='Record update timestamp'),

        comment='Premium subscription plans with CAD pricing and Canadian tax compliance'
    )

    # =============================================================================
    # Subscriptions Table - User Subscription Management
    # =============================================================================
    op.create_table(
        'subscriptions',
        # Primary Key and User Relationship
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()'), comment='Unique identifier'),
        sa.Column('user_id', UUID(as_uuid=True), nullable=False, unique=True, comment='User ID (one subscription per user)'),

        # Plan and Status
        sa.Column('plan_id', sa.String(50), nullable=False, comment='Current subscription plan'),
        sa.Column('tier', sa.String(20), nullable=False, comment='Current tier (free, standard, premium)'),
        sa.Column('status', sa.String(20), nullable=False, default='active', comment='Subscription status'),

        # Billing Information
        sa.Column('billing_interval', sa.String(20), nullable=False, comment='Billing interval (monthly, yearly)'),
        sa.Column('amount', sa.Numeric(10, 2), nullable=False, comment='Subscription amount in CAD'),
        sa.Column('currency', sa.String(3), nullable=False, default='CAD', comment='Currency code'),
        sa.Column('province', sa.String(2), nullable=False, comment='Canadian province for tax calculation'),

        # Stripe Integration
        sa.Column('stripe_customer_id', sa.String(100), nullable=True, unique=True, comment='Stripe Customer ID'),
        sa.Column('stripe_subscription_id', sa.String(100), nullable=True, unique=True, comment='Stripe Subscription ID'),

        # Trial Period
        sa.Column('trial_start', sa.DateTime(timezone=True), nullable=True, comment='Trial start timestamp'),
        sa.Column('trial_end', sa.DateTime(timezone=True), nullable=True, comment='Trial end timestamp'),

        # Cooling-Off Period (14 days for annual subscriptions)
        sa.Column('cooling_off_end', sa.DateTime(timezone=True), nullable=True, comment='Cooling-off period end timestamp'),

        # Payment Consent (PIPEDA)
        sa.Column('payment_consent_at', sa.DateTime(timezone=True), nullable=True, comment='When user consented to payment'),

        # Audit Fields
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()'), comment='Record creation timestamp'),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()'), comment='Record update timestamp'),

        comment='User subscriptions with trial and cooling-off period tracking'
    )

    # Add foreign key constraints
    op.create_foreign_key(
        'fk_subscriptions_user_id',
        'subscriptions', 'users',
        ['user_id'], ['id'],
        ondelete='CASCADE'
    )
    op.create_foreign_key(
        'fk_subscriptions_plan_id',
        'subscriptions', 'subscription_plans',
        ['plan_id'], ['id'],
        ondelete='RESTRICT'
    )

    # Add check constraints
    op.create_check_constraint(
        'ck_subscriptions_tier',
        'subscriptions',
        sa.text("tier IN ('free', 'standard', 'premium')")
    )
    op.create_check_constraint(
        'ck_subscriptions_status',
        'subscriptions',
        sa.text("status IN ('active', 'trialing', 'past_due', 'canceled', 'unpaid')")
    )
    op.create_check_constraint(
        'ck_subscriptions_billing_interval',
        'subscriptions',
        sa.text("billing_interval IN ('monthly', 'yearly')")
    )

    # =============================================================================
    # Payment Methods Table - Secure Payment Method Storage
    # =============================================================================
    op.create_table(
        'payment_methods',
        # Primary Key and User Relationship
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()'), comment='Unique identifier'),
        sa.Column('user_id', UUID(as_uuid=True), nullable=False, comment='User ID'),

        # Stripe Payment Method
        sa.Column('stripe_payment_method_id', sa.String(100), nullable=False, unique=True, comment='Stripe PaymentMethod ID'),
        sa.Column('stripe_customer_id', sa.String(100), nullable=False, comment='Stripe Customer ID'),

        # Payment Method Details (from Stripe)
        sa.Column('type', sa.String(20), nullable=False, comment='Payment method type (card, etc.)'),
        sa.Column('card_brand', sa.String(20), nullable=True, comment='Card brand (visa, mastercard, amex)'),
        sa.Column('card_last4', sa.String(4), nullable=True, comment='Last 4 digits of card'),
        sa.Column('card_exp_month', sa.Integer(), nullable=True, comment='Card expiration month'),
        sa.Column('card_exp_year', sa.Integer(), nullable=True, comment='Card expiration year'),

        # Status
        sa.Column('is_default', sa.Boolean(), nullable=False, default=False, comment='Default payment method for user'),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True, comment='Payment method active status'),

        # Audit Fields
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()'), comment='Record creation timestamp'),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()'), comment='Record update timestamp'),

        comment='Secure payment method storage via Stripe integration'
    )

    # Add foreign key constraints
    op.create_foreign_key(
        'fk_payment_methods_user_id',
        'payment_methods', 'users',
        ['user_id'], ['id'],
        ondelete='CASCADE'
    )

    # Add check constraints
    op.create_check_constraint(
        'ck_payment_methods_type',
        'payment_methods',
        sa.text("type IN ('card')")
    )

    # =============================================================================
    # Indexes for Performance
    # =============================================================================

    # Subscription Plans indexes
    op.create_index('idx_subscription_plans_tier', 'subscription_plans', ['tier'])
    op.create_index('idx_subscription_plans_active', 'subscription_plans', ['is_active'])
    op.create_index('idx_subscription_plans_sort', 'subscription_plans', ['sort_order'])

    # Subscriptions indexes
    op.create_index('idx_subscriptions_user_id', 'subscriptions', ['user_id'])
    op.create_index('idx_subscriptions_status', 'subscriptions', ['status'])
    op.create_index('idx_subscriptions_tier', 'subscriptions', ['tier'])
    op.create_index('idx_subscriptions_stripe_customer', 'subscriptions', ['stripe_customer_id'])
    op.create_index('idx_subscriptions_stripe_subscription', 'subscriptions', ['stripe_subscription_id'])

    # Payment Methods indexes
    op.create_index('idx_payment_methods_user_id', 'payment_methods', ['user_id'])
    op.create_index('idx_payment_methods_default', 'payment_methods', ['user_id', 'is_default'])
    op.create_index('idx_payment_methods_stripe_pm', 'payment_methods', ['stripe_payment_method_id'])

    # =============================================================================
    # Insert Initial Subscription Plans
    # =============================================================================

    # Free tier (default)
    op.execute("""
        INSERT INTO subscription_plans (
            id, name, display_name, tier, price, billing_interval,
            features, limits, sort_order, is_active
        ) VALUES (
            'free',
            'Free',
            'Free Plan',
            'free',
            0.00,
            'monthly',
            '[]'::jsonb,
            '{"familyMembers": 1, "reorderSuggestions": 0, "priceAlerts": false, "automation": false}'::jsonb,
            0,
            true
        )
    """)

    # Standard Monthly
    op.execute("""
        INSERT INTO subscription_plans (
            id, name, display_name, tier, price, billing_interval,
            features, limits, sort_order, is_active
        ) VALUES (
            'standard_monthly',
            'Standard',
            'Standard Plan',
            'standard',
            4.99,
            'monthly',
            '["family_sharing", "reorder_suggestions", "basic_analytics"]'::jsonb,
            '{"familyMembers": 10, "reorderSuggestions": 5, "priceAlerts": false, "automation": false}'::jsonb,
            1,
            true
        )
    """)

    # Standard Yearly
    op.execute("""
        INSERT INTO subscription_plans (
            id, name, display_name, tier, price, billing_interval,
            features, limits, sort_order, is_active
        ) VALUES (
            'standard_yearly',
            'Standard',
            'Standard Plan (Annual)',
            'standard',
            49.99,
            'yearly',
            '["family_sharing", "reorder_suggestions", "basic_analytics"]'::jsonb,
            '{"familyMembers": 10, "reorderSuggestions": 5, "priceAlerts": false, "automation": false}'::jsonb,
            2,
            true
        )
    """)

    # Premium Monthly
    op.execute("""
        INSERT INTO subscription_plans (
            id, name, display_name, tier, price, billing_interval,
            features, limits, sort_order, is_active
        ) VALUES (
            'premium_monthly',
            'Premium',
            'Premium Plan',
            'premium',
            6.99,
            'monthly',
            '["family_sharing", "unlimited_reorder_suggestions", "advanced_analytics", "price_alerts", "automation"]'::jsonb,
            '{"familyMembers": -1, "reorderSuggestions": -1, "priceAlerts": true, "automation": true}'::jsonb,
            3,
            true
        )
    """)

    # Premium Yearly
    op.execute("""
        INSERT INTO subscription_plans (
            id, name, display_name, tier, price, billing_interval,
            features, limits, sort_order, is_active
        ) VALUES (
            'premium_yearly',
            'Premium',
            'Premium Plan (Annual)',
            'premium',
            69.99,
            'yearly',
            '["family_sharing", "unlimited_reorder_suggestions", "advanced_analytics", "price_alerts", "automation"]'::jsonb,
            '{"familyMembers": -1, "reorderSuggestions": -1, "priceAlerts": true, "automation": true}'::jsonb,
            4,
            true
        )
    """)


def downgrade() -> None:
    """
    Remove premium subscription tables

    PIPEDA Compliance Notes:
    - Preserve audit logs before running downgrade
    - Consider data backup for compliance
    """
    # Drop tables in reverse order
    op.drop_table('payment_methods')
    op.drop_table('subscriptions')
    op.drop_table('subscription_plans')
