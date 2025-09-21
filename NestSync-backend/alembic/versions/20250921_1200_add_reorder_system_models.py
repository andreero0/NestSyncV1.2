"""add_reorder_system_models

Revision ID: add_reorder_system_models
Revises: 466856927d7a
Create Date: 2024-12-21 12:00:00.000000

Adds comprehensive reorder system models for NestSync premium features:
- ReorderSubscription: Stripe integration for Canadian billing
- ReorderPreferences: Child-specific automation settings
- ConsumptionPrediction: ML-powered consumption forecasting
- RetailerConfiguration: OAuth API integrations
- ProductMapping: Cross-retailer product mapping
- ReorderTransaction: Complete order tracking
- OrderStatusUpdate: Real-time status updates

This migration enables the automated reorder flow with Canadian tax compliance,
ML predictions, and multi-retailer integrations.
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB


# revision identifiers, used by Alembic.
revision = 'add_reorder_system_models'
down_revision = '466856927d7a'
branch_labels = None
depends_on = None


def upgrade():
    """Add reorder system tables"""

    # ==========================================================================
    # ReorderSubscription - Premium subscription management
    # ==========================================================================
    op.create_table(
        'reorder_subscriptions',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),

        # Subscription details
        sa.Column('tier', sa.String(), nullable=False, default='basic'),
        sa.Column('is_active', sa.Boolean(), default=True, nullable=False),

        # Stripe integration
        sa.Column('stripe_subscription_id', sa.String(), unique=True, nullable=True),
        sa.Column('stripe_customer_id', sa.String(), nullable=True),
        sa.Column('stripe_price_id', sa.String(), nullable=True),

        # Billing details
        sa.Column('billing_amount_cad', sa.Numeric(10, 2), nullable=False),
        sa.Column('billing_interval', sa.String(), default='month', nullable=False),

        # Canadian tax handling
        sa.Column('gst_rate', sa.Numeric(5, 4), default=0.05),
        sa.Column('pst_hst_rate', sa.Numeric(5, 4), default=0.00),
        sa.Column('total_tax_rate', sa.Numeric(5, 4), nullable=False),

        # Subscription lifecycle
        sa.Column('trial_end_date', sa.DateTime(), nullable=True),
        sa.Column('current_period_start', sa.DateTime(), nullable=True),
        sa.Column('current_period_end', sa.DateTime(), nullable=True),
        sa.Column('cancel_at_period_end', sa.Boolean(), default=False),
        sa.Column('cancelled_at', sa.DateTime(), nullable=True),

        # Feature flags
        sa.Column('features', JSONB(), default={}),

        # Audit trail
        sa.Column('created_at', sa.DateTime(), nullable=False, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, default=sa.func.now(), onupdate=sa.func.now()),
    )

    # Indexes for ReorderSubscription
    op.create_index('idx_reorder_subscriptions_user_id', 'reorder_subscriptions', ['user_id'])
    op.create_index('idx_reorder_subscriptions_stripe_subscription', 'reorder_subscriptions', ['stripe_subscription_id'])
    op.create_index('idx_reorder_subscriptions_active', 'reorder_subscriptions', ['is_active'])

    # ==========================================================================
    # ReorderPreferences - Child-specific automation settings
    # ==========================================================================
    op.create_table(
        'reorder_preferences',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('subscription_id', UUID(as_uuid=True), sa.ForeignKey('reorder_subscriptions.id'), nullable=False),
        sa.Column('child_id', UUID(as_uuid=True), sa.ForeignKey('children.id'), nullable=False),

        # Automation settings
        sa.Column('auto_reorder_enabled', sa.Boolean(), default=False, nullable=False),
        sa.Column('reorder_threshold_days', sa.Integer(), default=7, nullable=False),
        sa.Column('max_order_amount_cad', sa.Numeric(10, 2), default=150.00),

        # Retailer preferences
        sa.Column('preferred_retailers', JSONB(), default=[]),
        sa.Column('retailer_credentials', JSONB(), default={}),

        # Product preferences
        sa.Column('preferred_brands', JSONB(), default=[]),
        sa.Column('size_preferences', JSONB(), default={}),

        # Delivery preferences
        sa.Column('preferred_delivery_days', JSONB(), default=[]),
        sa.Column('delivery_instructions', sa.Text(), nullable=True),
        sa.Column('emergency_contact_on_delivery', sa.Boolean(), default=False),

        # Notification preferences
        sa.Column('notify_before_order', sa.Boolean(), default=True),
        sa.Column('notify_order_placed', sa.Boolean(), default=True),
        sa.Column('notify_delivery_updates', sa.Boolean(), default=True),
        sa.Column('notification_advance_hours', sa.Integer(), default=24),

        # ML settings
        sa.Column('use_growth_prediction', sa.Boolean(), default=False),
        sa.Column('use_seasonal_adjustments', sa.Boolean(), default=False),
        sa.Column('prediction_confidence_threshold', sa.String(), default='medium'),

        # Audit trail
        sa.Column('created_at', sa.DateTime(), nullable=False, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, default=sa.func.now(), onupdate=sa.func.now()),
    )

    # Constraints and indexes for ReorderPreferences
    op.create_unique_constraint('uq_reorder_prefs_child', 'reorder_preferences', ['subscription_id', 'child_id'])
    op.create_index('idx_reorder_preferences_subscription', 'reorder_preferences', ['subscription_id'])
    op.create_index('idx_reorder_preferences_child', 'reorder_preferences', ['child_id'])
    op.create_index('idx_reorder_preferences_auto_enabled', 'reorder_preferences', ['auto_reorder_enabled'])

    # ==========================================================================
    # ConsumptionPrediction - ML consumption forecasting
    # ==========================================================================
    op.create_table(
        'consumption_predictions',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('child_id', UUID(as_uuid=True), sa.ForeignKey('children.id'), nullable=False),

        # Prediction metadata
        sa.Column('model_version', sa.String(), nullable=False),
        sa.Column('prediction_date', sa.DateTime(), nullable=False, default=sa.func.now()),
        sa.Column('prediction_horizon_days', sa.Integer(), default=30, nullable=False),

        # Model performance
        sa.Column('confidence_level', sa.String(), nullable=False),
        sa.Column('mean_absolute_error', sa.Numeric(8, 4), nullable=True),
        sa.Column('r_squared_score', sa.Numeric(6, 4), nullable=True),

        # Prediction results
        sa.Column('current_consumption_rate', sa.Numeric(8, 4), nullable=False),
        sa.Column('predicted_consumption_30d', sa.Integer(), nullable=False),
        sa.Column('predicted_runout_date', sa.DateTime(), nullable=False),
        sa.Column('recommended_reorder_date', sa.DateTime(), nullable=False),

        # Size change predictions
        sa.Column('size_change_probability', sa.Numeric(4, 3), nullable=True),
        sa.Column('predicted_new_size', sa.String(), nullable=True),
        sa.Column('size_change_estimated_date', sa.DateTime(), nullable=True),

        # Adjustments
        sa.Column('growth_adjustment_factor', sa.Numeric(6, 4), default=1.0),
        sa.Column('seasonal_adjustment_factor', sa.Numeric(6, 4), default=1.0),

        # Model interpretability
        sa.Column('feature_importance', JSONB(), default={}),

        # Input data summary
        sa.Column('training_data_points', sa.Integer(), nullable=False),
        sa.Column('training_period_days', sa.Integer(), nullable=False),
        sa.Column('last_usage_date', sa.DateTime(), nullable=False),

        # Audit trail
        sa.Column('created_at', sa.DateTime(), nullable=False, default=sa.func.now()),
    )

    # Indexes for ConsumptionPrediction
    op.create_index('idx_consumption_predictions_child', 'consumption_predictions', ['child_id'])
    op.create_index('idx_consumption_predictions_date', 'consumption_predictions', ['prediction_date'])
    op.create_index('idx_consumption_predictions_runout', 'consumption_predictions', ['predicted_runout_date'])
    op.create_index('idx_consumption_predictions_confidence', 'consumption_predictions', ['confidence_level'])

    # ==========================================================================
    # RetailerConfiguration - API integration settings
    # ==========================================================================
    op.create_table(
        'retailer_configurations',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),

        # Retailer details
        sa.Column('retailer_type', sa.String(), nullable=False),
        sa.Column('retailer_name', sa.String(), nullable=False),
        sa.Column('is_active', sa.Boolean(), default=True, nullable=False),

        # API configuration
        sa.Column('api_endpoint', sa.String(), nullable=False),
        sa.Column('api_version', sa.String(), nullable=True),
        sa.Column('rate_limit_per_hour', sa.Integer(), default=100, nullable=False),

        # OAuth credentials (encrypted)
        sa.Column('client_id', sa.String(), nullable=True),
        sa.Column('client_secret_encrypted', sa.Text(), nullable=True),
        sa.Column('access_token_encrypted', sa.Text(), nullable=True),
        sa.Column('refresh_token_encrypted', sa.Text(), nullable=True),
        sa.Column('token_expires_at', sa.DateTime(), nullable=True),

        # API-specific settings
        sa.Column('partner_tag', sa.String(), nullable=True),
        sa.Column('store_id', sa.String(), nullable=True),
        sa.Column('affiliate_id', sa.String(), nullable=True),

        # Performance tracking
        sa.Column('last_successful_request', sa.DateTime(), nullable=True),
        sa.Column('total_requests_made', sa.Integer(), default=0),
        sa.Column('total_successful_orders', sa.Integer(), default=0),
        sa.Column('average_response_time_ms', sa.Integer(), nullable=True),

        # Error tracking
        sa.Column('consecutive_failures', sa.Integer(), default=0),
        sa.Column('last_error_message', sa.Text(), nullable=True),
        sa.Column('last_error_date', sa.DateTime(), nullable=True),

        # Audit trail
        sa.Column('created_at', sa.DateTime(), nullable=False, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, default=sa.func.now(), onupdate=sa.func.now()),
    )

    # Constraints and indexes for RetailerConfiguration
    op.create_unique_constraint('uq_retailer_config_user', 'retailer_configurations', ['user_id', 'retailer_type'])
    op.create_index('idx_retailer_config_user', 'retailer_configurations', ['user_id'])
    op.create_index('idx_retailer_config_type', 'retailer_configurations', ['retailer_type'])
    op.create_index('idx_retailer_config_active', 'retailer_configurations', ['is_active'])

    # ==========================================================================
    # ProductMapping - Cross-retailer product mapping
    # ==========================================================================
    op.create_table(
        'product_mappings',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('retailer_config_id', UUID(as_uuid=True), sa.ForeignKey('retailer_configurations.id'), nullable=False),

        # Product identification
        sa.Column('retailer_product_id', sa.String(), nullable=False),
        sa.Column('retailer_sku', sa.String(), nullable=True),
        sa.Column('product_url', sa.Text(), nullable=True),

        # Product details
        sa.Column('brand', sa.String(), nullable=False),
        sa.Column('product_name', sa.String(), nullable=False),
        sa.Column('diaper_size', sa.String(), nullable=False),
        sa.Column('pack_count', sa.Integer(), nullable=False),

        # Pricing
        sa.Column('current_price_cad', sa.Numeric(10, 2), nullable=True),
        sa.Column('regular_price_cad', sa.Numeric(10, 2), nullable=True),
        sa.Column('price_per_diaper_cad', sa.Numeric(6, 4), nullable=True),

        # Availability
        sa.Column('is_available', sa.Boolean(), default=True, nullable=False),
        sa.Column('estimated_delivery_days', sa.Integer(), nullable=True),
        sa.Column('shipping_cost_cad', sa.Numeric(8, 2), nullable=True),
        sa.Column('free_shipping_threshold_cad', sa.Numeric(10, 2), nullable=True),

        # Product features
        sa.Column('features', JSONB(), default={}),
        sa.Column('ingredients', JSONB(), default=[]),
        sa.Column('certifications', JSONB(), default=[]),

        # Performance tracking
        sa.Column('last_price_update', sa.DateTime(), nullable=True),
        sa.Column('last_availability_check', sa.DateTime(), nullable=True),
        sa.Column('price_history', JSONB(), default=[]),

        # User feedback
        sa.Column('user_rating', sa.Numeric(3, 2), nullable=True),
        sa.Column('user_notes', sa.Text(), nullable=True),

        # Audit trail
        sa.Column('created_at', sa.DateTime(), nullable=False, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, default=sa.func.now(), onupdate=sa.func.now()),
    )

    # Constraints and indexes for ProductMapping
    op.create_unique_constraint('uq_product_mapping', 'product_mappings', ['retailer_config_id', 'retailer_product_id'])
    op.create_index('idx_product_mapping_retailer', 'product_mappings', ['retailer_config_id'])
    op.create_index('idx_product_mapping_brand_size', 'product_mappings', ['brand', 'diaper_size'])
    op.create_index('idx_product_mapping_price', 'product_mappings', ['current_price_cad'])
    op.create_index('idx_product_mapping_available', 'product_mappings', ['is_available'])

    # ==========================================================================
    # ReorderTransaction - Complete order tracking
    # ==========================================================================
    op.create_table(
        'reorder_transactions',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('subscription_id', UUID(as_uuid=True), sa.ForeignKey('reorder_subscriptions.id'), nullable=False),
        sa.Column('child_id', UUID(as_uuid=True), sa.ForeignKey('children.id'), nullable=False),

        # Order identification
        sa.Column('order_number', sa.String(), unique=True, nullable=False),
        sa.Column('retailer_order_id', sa.String(), nullable=True),
        sa.Column('retailer_type', sa.String(), nullable=False),

        # Order details
        sa.Column('status', sa.String(), default='pending', nullable=False),
        sa.Column('order_type', sa.String(), default='automatic', nullable=False),

        # Products
        sa.Column('products', JSONB(), nullable=False),
        sa.Column('total_items', sa.Integer(), nullable=False),

        # Pricing
        sa.Column('subtotal_cad', sa.Numeric(10, 2), nullable=False),
        sa.Column('shipping_cost_cad', sa.Numeric(8, 2), default=0.00),
        sa.Column('tax_amount_cad', sa.Numeric(8, 2), nullable=False),
        sa.Column('total_amount_cad', sa.Numeric(10, 2), nullable=False),

        # Payment
        sa.Column('stripe_payment_intent_id', sa.String(), nullable=True),
        sa.Column('payment_method_type', sa.String(), nullable=False),
        sa.Column('payment_authorized_at', sa.DateTime(), nullable=True),
        sa.Column('payment_captured_at', sa.DateTime(), nullable=True),

        # Delivery
        sa.Column('delivery_address', JSONB(), nullable=False),
        sa.Column('estimated_delivery_date', sa.DateTime(), nullable=True),
        sa.Column('actual_delivery_date', sa.DateTime(), nullable=True),
        sa.Column('tracking_number', sa.String(), nullable=True),
        sa.Column('tracking_url', sa.Text(), nullable=True),

        # ML prediction context
        sa.Column('prediction_id', UUID(as_uuid=True), sa.ForeignKey('consumption_predictions.id'), nullable=True),
        sa.Column('predicted_runout_date', sa.DateTime(), nullable=True),
        sa.Column('days_until_runout', sa.Integer(), nullable=True),

        # Error handling
        sa.Column('failure_reason', sa.Text(), nullable=True),
        sa.Column('retry_count', sa.Integer(), default=0),
        sa.Column('last_retry_at', sa.DateTime(), nullable=True),

        # Timestamps
        sa.Column('ordered_at', sa.DateTime(), nullable=False, default=sa.func.now()),
        sa.Column('confirmed_at', sa.DateTime(), nullable=True),
        sa.Column('shipped_at', sa.DateTime(), nullable=True),
        sa.Column('delivered_at', sa.DateTime(), nullable=True),
        sa.Column('cancelled_at', sa.DateTime(), nullable=True),

        # Audit trail
        sa.Column('created_at', sa.DateTime(), nullable=False, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, default=sa.func.now(), onupdate=sa.func.now()),
    )

    # Indexes for ReorderTransaction
    op.create_index('idx_reorder_transactions_subscription', 'reorder_transactions', ['subscription_id'])
    op.create_index('idx_reorder_transactions_child', 'reorder_transactions', ['child_id'])
    op.create_index('idx_reorder_transactions_status', 'reorder_transactions', ['status'])
    op.create_index('idx_reorder_transactions_ordered_date', 'reorder_transactions', ['ordered_at'])
    op.create_index('idx_reorder_transactions_order_number', 'reorder_transactions', ['order_number'])

    # ==========================================================================
    # OrderStatusUpdate - Real-time status tracking
    # ==========================================================================
    op.create_table(
        'order_status_updates',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('transaction_id', UUID(as_uuid=True), sa.ForeignKey('reorder_transactions.id'), nullable=False),

        # Status details
        sa.Column('previous_status', sa.String(), nullable=True),
        sa.Column('new_status', sa.String(), nullable=False),
        sa.Column('status_message', sa.Text(), nullable=True),

        # Update source
        sa.Column('update_source', sa.String(), nullable=False),
        sa.Column('external_reference', sa.String(), nullable=True),

        # Tracking details
        sa.Column('tracking_number', sa.String(), nullable=True),
        sa.Column('tracking_url', sa.Text(), nullable=True),
        sa.Column('estimated_delivery', sa.DateTime(), nullable=True),
        sa.Column('carrier_name', sa.String(), nullable=True),

        # Location
        sa.Column('current_location', sa.String(), nullable=True),
        sa.Column('delivery_notes', sa.Text(), nullable=True),

        # Notifications
        sa.Column('user_notified', sa.Boolean(), default=False),
        sa.Column('notification_sent_at', sa.DateTime(), nullable=True),

        # Audit trail
        sa.Column('created_at', sa.DateTime(), nullable=False, default=sa.func.now()),
    )

    # Indexes for OrderStatusUpdate
    op.create_index('idx_order_status_updates_transaction', 'order_status_updates', ['transaction_id'])
    op.create_index('idx_order_status_updates_created', 'order_status_updates', ['created_at'])
    op.create_index('idx_order_status_updates_status', 'order_status_updates', ['new_status'])


def downgrade():
    """Remove reorder system tables"""

    # Drop in reverse order due to foreign key constraints
    op.drop_table('order_status_updates')
    op.drop_table('reorder_transactions')
    op.drop_table('product_mappings')
    op.drop_table('retailer_configurations')
    op.drop_table('consumption_predictions')
    op.drop_table('reorder_preferences')
    op.drop_table('reorder_subscriptions')