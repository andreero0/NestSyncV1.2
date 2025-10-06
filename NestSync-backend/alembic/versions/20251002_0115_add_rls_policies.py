"""Add RLS policies for premium subscription tables

Revision ID: 20251002_0115
Revises: 20251002_0110
Create Date: 2025-10-02 01:15:00.000000

PIPEDA Compliance: Row Level Security policies for data isolation
- Users can only access their own subscription data
- Service role bypasses RLS for admin operations
- Public can view subscription plans
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20251002_0115'
down_revision = '20251002_0110'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Add RLS policies for premium subscription tables

    PIPEDA Compliance Notes:
    - RLS ensures users can only access their own data
    - Service role can bypass for admin operations
    - Audit trail maintained for all access
    """

    # =============================================================================
    # Enable RLS on Tables
    # =============================================================================
    op.execute("ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE billing_history ENABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE canadian_tax_rates ENABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE trial_progress ENABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE trial_usage_events ENABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE feature_access ENABLE ROW LEVEL SECURITY")

    # =============================================================================
    # Subscription Plans Policies (Public Read Access)
    # =============================================================================

    # Anyone can view active subscription plans
    op.execute("""
        CREATE POLICY "Anyone can view active subscription plans"
            ON subscription_plans FOR SELECT
            USING (is_active = true)
    """)

    # Service role can manage all plans
    op.execute("""
        CREATE POLICY "Service role can manage subscription plans"
            ON subscription_plans FOR ALL
            USING (auth.role() = 'service_role')
    """)

    # =============================================================================
    # Subscriptions Policies (User-Specific Access)
    # =============================================================================

    # Users can view their own subscription
    op.execute("""
        CREATE POLICY "Users can view own subscription"
            ON subscriptions FOR SELECT
            USING (auth.uid() = user_id)
    """)

    # Users can insert their own subscription (during trial activation)
    op.execute("""
        CREATE POLICY "Users can create own subscription"
            ON subscriptions FOR INSERT
            WITH CHECK (auth.uid() = user_id)
    """)

    # Users can update their own subscription
    op.execute("""
        CREATE POLICY "Users can update own subscription"
            ON subscriptions FOR UPDATE
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id)
    """)

    # Service role can manage all subscriptions
    op.execute("""
        CREATE POLICY "Service role can manage subscriptions"
            ON subscriptions FOR ALL
            USING (auth.role() = 'service_role')
    """)

    # =============================================================================
    # Payment Methods Policies (User-Specific Access)
    # =============================================================================

    # Users can view their own payment methods
    op.execute("""
        CREATE POLICY "Users can view own payment methods"
            ON payment_methods FOR SELECT
            USING (auth.uid() = user_id)
    """)

    # Users can insert their own payment methods
    op.execute("""
        CREATE POLICY "Users can create own payment methods"
            ON payment_methods FOR INSERT
            WITH CHECK (auth.uid() = user_id)
    """)

    # Users can update their own payment methods
    op.execute("""
        CREATE POLICY "Users can update own payment methods"
            ON payment_methods FOR UPDATE
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id)
    """)

    # Users can delete their own payment methods
    op.execute("""
        CREATE POLICY "Users can delete own payment methods"
            ON payment_methods FOR DELETE
            USING (auth.uid() = user_id)
    """)

    # Service role can manage all payment methods
    op.execute("""
        CREATE POLICY "Service role can manage payment methods"
            ON payment_methods FOR ALL
            USING (auth.role() = 'service_role')
    """)

    # =============================================================================
    # Billing History Policies (User-Specific Read-Only)
    # =============================================================================

    # Users can view their own billing history
    op.execute("""
        CREATE POLICY "Users can view own billing history"
            ON billing_history FOR SELECT
            USING (auth.uid() = user_id)
    """)

    # Service role can manage all billing history
    op.execute("""
        CREATE POLICY "Service role can manage billing history"
            ON billing_history FOR ALL
            USING (auth.role() = 'service_role')
    """)

    # =============================================================================
    # Canadian Tax Rates Policies (Public Read Access)
    # =============================================================================

    # Anyone can view active tax rates
    op.execute("""
        CREATE POLICY "Anyone can view active tax rates"
            ON canadian_tax_rates FOR SELECT
            USING (is_active = true)
    """)

    # Service role can manage tax rates
    op.execute("""
        CREATE POLICY "Service role can manage tax rates"
            ON canadian_tax_rates FOR ALL
            USING (auth.role() = 'service_role')
    """)

    # =============================================================================
    # Trial Progress Policies (User-Specific Access)
    # =============================================================================

    # Users can view their own trial progress
    op.execute("""
        CREATE POLICY "Users can view own trial progress"
            ON trial_progress FOR SELECT
            USING (auth.uid() = user_id)
    """)

    # Users can insert their own trial progress
    op.execute("""
        CREATE POLICY "Users can create own trial progress"
            ON trial_progress FOR INSERT
            WITH CHECK (auth.uid() = user_id)
    """)

    # Users can update their own trial progress
    op.execute("""
        CREATE POLICY "Users can update own trial progress"
            ON trial_progress FOR UPDATE
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id)
    """)

    # Service role can manage all trial progress
    op.execute("""
        CREATE POLICY "Service role can manage trial progress"
            ON trial_progress FOR ALL
            USING (auth.role() = 'service_role')
    """)

    # =============================================================================
    # Trial Usage Events Policies (User-Specific Read Access)
    # =============================================================================

    # Users can view their own trial usage events
    op.execute("""
        CREATE POLICY "Users can view own trial usage events"
            ON trial_usage_events FOR SELECT
            USING (auth.uid() = user_id)
    """)

    # Service role can manage all trial usage events
    op.execute("""
        CREATE POLICY "Service role can manage trial usage events"
            ON trial_usage_events FOR ALL
            USING (auth.role() = 'service_role')
    """)

    # =============================================================================
    # Feature Access Policies (User-Specific Access)
    # =============================================================================

    # Users can view their own feature access
    op.execute("""
        CREATE POLICY "Users can view own feature access"
            ON feature_access FOR SELECT
            USING (auth.uid() = user_id)
    """)

    # Users can insert their own feature access
    op.execute("""
        CREATE POLICY "Users can create own feature access"
            ON feature_access FOR INSERT
            WITH CHECK (auth.uid() = user_id)
    """)

    # Users can update their own feature access
    op.execute("""
        CREATE POLICY "Users can update own feature access"
            ON feature_access FOR UPDATE
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id)
    """)

    # Service role can manage all feature access
    op.execute("""
        CREATE POLICY "Service role can manage feature access"
            ON feature_access FOR ALL
            USING (auth.role() = 'service_role')
    """)


def downgrade() -> None:
    """
    Remove RLS policies from premium subscription tables
    """
    # Drop all policies
    op.execute("DROP POLICY IF EXISTS \"Anyone can view active subscription plans\" ON subscription_plans")
    op.execute("DROP POLICY IF EXISTS \"Service role can manage subscription plans\" ON subscription_plans")

    op.execute("DROP POLICY IF EXISTS \"Users can view own subscription\" ON subscriptions")
    op.execute("DROP POLICY IF EXISTS \"Users can create own subscription\" ON subscriptions")
    op.execute("DROP POLICY IF EXISTS \"Users can update own subscription\" ON subscriptions")
    op.execute("DROP POLICY IF EXISTS \"Service role can manage subscriptions\" ON subscriptions")

    op.execute("DROP POLICY IF EXISTS \"Users can view own payment methods\" ON payment_methods")
    op.execute("DROP POLICY IF EXISTS \"Users can create own payment methods\" ON payment_methods")
    op.execute("DROP POLICY IF EXISTS \"Users can update own payment methods\" ON payment_methods")
    op.execute("DROP POLICY IF EXISTS \"Users can delete own payment methods\" ON payment_methods")
    op.execute("DROP POLICY IF EXISTS \"Service role can manage payment methods\" ON payment_methods")

    op.execute("DROP POLICY IF EXISTS \"Users can view own billing history\" ON billing_history")
    op.execute("DROP POLICY IF EXISTS \"Service role can manage billing history\" ON billing_history")

    op.execute("DROP POLICY IF EXISTS \"Anyone can view active tax rates\" ON canadian_tax_rates")
    op.execute("DROP POLICY IF EXISTS \"Service role can manage tax rates\" ON canadian_tax_rates")

    op.execute("DROP POLICY IF EXISTS \"Users can view own trial progress\" ON trial_progress")
    op.execute("DROP POLICY IF EXISTS \"Users can create own trial progress\" ON trial_progress")
    op.execute("DROP POLICY IF EXISTS \"Users can update own trial progress\" ON trial_progress")
    op.execute("DROP POLICY IF EXISTS \"Service role can manage trial progress\" ON trial_progress")

    op.execute("DROP POLICY IF EXISTS \"Users can view own trial usage events\" ON trial_usage_events")
    op.execute("DROP POLICY IF EXISTS \"Service role can manage trial usage events\" ON trial_usage_events")

    op.execute("DROP POLICY IF EXISTS \"Users can view own feature access\" ON feature_access")
    op.execute("DROP POLICY IF EXISTS \"Users can create own feature access\" ON feature_access")
    op.execute("DROP POLICY IF EXISTS \"Users can update own feature access\" ON feature_access")
    op.execute("DROP POLICY IF EXISTS \"Service role can manage feature access\" ON feature_access")

    # Disable RLS
    op.execute("ALTER TABLE subscription_plans DISABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE payment_methods DISABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE billing_history DISABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE canadian_tax_rates DISABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE trial_progress DISABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE trial_usage_events DISABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE feature_access DISABLE ROW LEVEL SECURITY")
