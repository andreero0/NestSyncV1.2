"""
GraphQL Types for Reorder System
PIPEDA-compliant Canadian diaper planning application

This module defines the GraphQL types for the automated reorder system,
including subscriptions, predictions, retailer configurations, and order tracking.
"""

import strawberry
import enum
from typing import Optional, List, Dict, Any
from datetime import datetime
from decimal import Decimal

from ..models.reorder import (
    SubscriptionTier, OrderStatus, RetailerType,
    PaymentMethodType, PredictionConfidence
)


# =============================================================================
# Enums for GraphQL
# =============================================================================

@strawberry.enum
class SubscriptionTierType(str, enum.Enum):
    """Premium subscription tiers for reorder system"""
    BASIC = "basic"
    PREMIUM = "premium"
    FAMILY = "family"


@strawberry.enum
class OrderStatusType(str, enum.Enum):
    """Order processing status"""
    PENDING = "pending"
    AUTHORIZED = "authorized"
    CONFIRMED = "confirmed"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    FAILED = "failed"
    REFUNDED = "refunded"


@strawberry.enum
class RetailerTypeEnum(str, enum.Enum):
    """Supported Canadian retailers"""
    AMAZON_CA = "amazon_ca"
    WALMART_CA = "walmart_ca"
    LOBLAWS = "loblaws"
    METRO = "metro"
    SOBEYS = "sobeys"
    COSTCO_CA = "costco_ca"


@strawberry.enum
class PaymentMethodTypeEnum(str, enum.Enum):
    """Payment method types"""
    STRIPE_CARD = "stripe_card"
    STRIPE_PAYMENT_METHOD = "stripe_payment_method"
    STRIPE_SETUP_INTENT = "stripe_setup_intent"


@strawberry.enum
class PredictionConfidenceEnum(str, enum.Enum):
    """ML prediction confidence levels"""
    VERY_LOW = "very_low"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    VERY_HIGH = "very_high"


# =============================================================================
# Core Types
# =============================================================================

@strawberry.type
class ReorderSubscription:
    """Premium subscription for automated reorder system"""
    id: str
    user_id: str

    # Subscription details
    tier: SubscriptionTierType
    is_active: bool

    # Stripe integration
    stripe_subscription_id: Optional[str]
    stripe_customer_id: Optional[str]
    stripe_price_id: Optional[str]

    # Billing details
    billing_amount_cad: Decimal
    billing_interval: str

    # Canadian tax handling
    gst_rate: Decimal
    pst_hst_rate: Decimal
    total_tax_rate: Decimal

    # Subscription lifecycle
    trial_end_date: Optional[datetime]
    current_period_start: Optional[datetime]
    current_period_end: Optional[datetime]
    cancel_at_period_end: bool
    cancelled_at: Optional[datetime]

    # Feature flags
    features: strawberry.scalars.JSON

    # Timestamps
    created_at: datetime
    updated_at: datetime


@strawberry.type
class ReorderPreferences:
    """User preferences for automated reorder system"""
    id: str
    subscription_id: str
    child_id: str

    # Automation settings
    auto_reorder_enabled: bool
    reorder_threshold_days: int
    max_order_amount_cad: Decimal

    # Retailer preferences
    preferred_retailers: List[RetailerTypeEnum]

    # Product preferences
    preferred_brands: List[str]
    size_preferences: strawberry.scalars.JSON

    # Delivery preferences
    preferred_delivery_days: List[int]
    delivery_instructions: Optional[str]
    emergency_contact_on_delivery: bool

    # Notification preferences
    notify_before_order: bool
    notify_order_placed: bool
    notify_delivery_updates: bool
    notification_advance_hours: int

    # ML settings
    use_growth_prediction: bool
    use_seasonal_adjustments: bool
    prediction_confidence_threshold: PredictionConfidenceEnum

    # Timestamps
    created_at: datetime
    updated_at: datetime


@strawberry.type
class ConsumptionPrediction:
    """ML-generated consumption predictions for each child"""
    id: str
    child_id: str

    # Prediction metadata
    model_version: str
    prediction_date: datetime
    prediction_horizon_days: int

    # Model performance
    confidence_level: PredictionConfidenceEnum
    mean_absolute_error: Optional[Decimal]
    r_squared_score: Optional[Decimal]

    # Prediction results
    current_consumption_rate: Decimal
    predicted_consumption_30d: int
    predicted_runout_date: datetime
    recommended_reorder_date: datetime

    # Size change predictions
    size_change_probability: Optional[Decimal]
    predicted_new_size: Optional[str]
    size_change_estimated_date: Optional[datetime]

    # Adjustments
    growth_adjustment_factor: Decimal
    seasonal_adjustment_factor: Decimal

    # Model interpretability
    feature_importance: strawberry.scalars.JSON

    # Input data summary
    training_data_points: int
    training_period_days: int
    last_usage_date: datetime

    # Timestamps
    created_at: datetime


@strawberry.type
class RetailerConfiguration:
    """Configuration for retailer API integrations"""
    id: str
    user_id: str

    # Retailer details
    retailer_type: RetailerTypeEnum
    retailer_name: str
    is_active: bool

    # API configuration
    api_endpoint: str
    api_version: Optional[str]
    rate_limit_per_hour: int

    # API-specific settings (sensitive data excluded)
    partner_tag: Optional[str]
    store_id: Optional[str]
    affiliate_id: Optional[str]

    # Performance tracking
    last_successful_request: Optional[datetime]
    total_requests_made: int
    total_successful_orders: int
    average_response_time_ms: Optional[int]

    # Error tracking
    consecutive_failures: int
    last_error_message: Optional[str]
    last_error_date: Optional[datetime]

    # Timestamps
    created_at: datetime
    updated_at: datetime


@strawberry.type
class ProductMapping:
    """Maps diaper products across different retailers"""
    id: str
    retailer_config_id: str

    # Product identification
    retailer_product_id: str
    retailer_sku: Optional[str]
    product_url: Optional[str]

    # Product details
    brand: str
    product_name: str
    diaper_size: str
    pack_count: int

    # Pricing information
    current_price_cad: Optional[Decimal]
    regular_price_cad: Optional[Decimal]
    price_per_diaper_cad: Optional[Decimal]

    # Availability and shipping
    is_available: bool
    estimated_delivery_days: Optional[int]
    shipping_cost_cad: Optional[Decimal]
    free_shipping_threshold_cad: Optional[Decimal]

    # Product features
    features: strawberry.scalars.JSON
    ingredients: List[str]
    certifications: List[str]

    # Performance tracking
    last_price_update: Optional[datetime]
    last_availability_check: Optional[datetime]
    price_history: strawberry.scalars.JSON

    # User feedback
    user_rating: Optional[Decimal]
    user_notes: Optional[str]

    # Timestamps
    created_at: datetime
    updated_at: datetime


@strawberry.type
class ReorderTransaction:
    """Complete order transaction tracking"""
    id: str
    subscription_id: str
    child_id: str

    # Order identification
    order_number: str
    retailer_order_id: Optional[str]
    retailer_type: RetailerTypeEnum

    # Order details
    status: OrderStatusType
    order_type: str

    # Products ordered
    products: strawberry.scalars.JSON
    total_items: int

    # Pricing breakdown
    subtotal_cad: Decimal
    shipping_cost_cad: Decimal
    tax_amount_cad: Decimal
    total_amount_cad: Decimal

    # Payment information
    stripe_payment_intent_id: Optional[str]
    payment_method_type: PaymentMethodTypeEnum
    payment_authorized_at: Optional[datetime]
    payment_captured_at: Optional[datetime]

    # Delivery information
    delivery_address: strawberry.scalars.JSON
    estimated_delivery_date: Optional[datetime]
    actual_delivery_date: Optional[datetime]
    tracking_number: Optional[str]
    tracking_url: Optional[str]

    # ML prediction context
    prediction_id: Optional[str]
    predicted_runout_date: Optional[datetime]
    days_until_runout: Optional[int]

    # Error handling
    failure_reason: Optional[str]
    retry_count: int
    last_retry_at: Optional[datetime]

    # Timestamps
    ordered_at: datetime
    confirmed_at: Optional[datetime]
    shipped_at: Optional[datetime]
    delivered_at: Optional[datetime]
    cancelled_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime


@strawberry.type
class OrderStatusUpdate:
    """Real-time order status tracking"""
    id: str
    transaction_id: str

    # Status update details
    previous_status: Optional[OrderStatusType]
    new_status: OrderStatusType
    status_message: Optional[str]

    # Update source
    update_source: str
    external_reference: Optional[str]

    # Delivery tracking
    tracking_number: Optional[str]
    tracking_url: Optional[str]
    estimated_delivery: Optional[datetime]
    carrier_name: Optional[str]

    # Location information
    current_location: Optional[str]
    delivery_notes: Optional[str]

    # Notification flags
    user_notified: bool
    notification_sent_at: Optional[datetime]

    # Timestamps
    created_at: datetime


# =============================================================================
# Input Types
# =============================================================================

@strawberry.input
class CreateSubscriptionInput:
    """Input for creating a premium subscription"""
    tier: SubscriptionTierType
    stripe_payment_method_id: str
    billing_address: strawberry.scalars.JSON
    province_code: str  # For Canadian tax calculation


@strawberry.input
class UpdateSubscriptionInput:
    """Input for updating a premium subscription"""
    tier: Optional[SubscriptionTierType] = None
    auto_reorder_enabled: Optional[bool] = None
    cancel_at_period_end: Optional[bool] = None


@strawberry.input
class CreateReorderPreferencesInput:
    """Input for creating reorder preferences"""
    child_id: str
    auto_reorder_enabled: bool = False
    reorder_threshold_days: int = 7
    max_order_amount_cad: Decimal = Decimal('150.00')
    preferred_retailers: List[RetailerTypeEnum] = strawberry.field(default_factory=list)
    preferred_brands: List[str] = strawberry.field(default_factory=list)
    preferred_delivery_days: List[int] = strawberry.field(default_factory=list)
    delivery_instructions: Optional[str] = None
    notification_advance_hours: int = 24


@strawberry.input
class UpdateReorderPreferencesInput:
    """Input for updating reorder preferences"""
    auto_reorder_enabled: Optional[bool] = None
    reorder_threshold_days: Optional[int] = None
    max_order_amount_cad: Optional[Decimal] = None
    preferred_retailers: Optional[List[RetailerTypeEnum]] = None
    preferred_brands: Optional[List[str]] = None
    preferred_delivery_days: Optional[List[int]] = None
    delivery_instructions: Optional[str] = None
    notification_advance_hours: Optional[int] = None


@strawberry.input
class CreateRetailerConfigInput:
    """Input for creating retailer configuration"""
    retailer_type: RetailerTypeEnum
    client_id: str
    client_secret: str
    partner_tag: Optional[str] = None
    store_id: Optional[str] = None


@strawberry.input
class ManualOrderInput:
    """Input for creating a manual order"""
    child_id: str
    retailer_type: RetailerTypeEnum
    products: strawberry.scalars.JSON
    delivery_address: strawberry.scalars.JSON
    payment_method_id: str


# =============================================================================
# Response Types
# =============================================================================

@strawberry.type
class SubscriptionResponse:
    """Response for subscription operations"""
    success: bool
    subscription: Optional[ReorderSubscription]
    message: Optional[str]
    client_secret: Optional[str]  # For Stripe payment confirmation


@strawberry.type
class PreferencesResponse:
    """Response for preferences operations"""
    success: bool
    preferences: Optional[ReorderPreferences]
    message: Optional[str]


@strawberry.type
class PredictionResponse:
    """Response for ML prediction operations"""
    success: bool
    prediction: Optional[ConsumptionPrediction]
    message: Optional[str]
    recommendations: Optional[List[str]]


@strawberry.type
class RetailerConfigResponse:
    """Response for retailer configuration operations"""
    success: bool
    config: Optional[RetailerConfiguration]
    message: Optional[str]
    authorization_url: Optional[str]  # For OAuth flow


@strawberry.type
class OrderResponse:
    """Response for order operations"""
    success: bool
    transaction: Optional[ReorderTransaction]
    message: Optional[str]
    tracking_info: Optional[strawberry.scalars.JSON]


@strawberry.type
class ProductSearchResponse:
    """Response for product search operations"""
    success: bool
    products: List[ProductMapping]
    total_count: int
    message: Optional[str]


# =============================================================================
# Connection Types for Pagination
# =============================================================================

@strawberry.type
class ReorderSubscriptionConnection:
    """Paginated subscription results"""
    items: List[ReorderSubscription]
    total_count: int
    has_next_page: bool
    has_previous_page: bool


@strawberry.type
class ReorderPreferencesConnection:
    """Paginated preferences results"""
    items: List[ReorderPreferences]
    total_count: int
    has_next_page: bool
    has_previous_page: bool


@strawberry.type
class ConsumptionPredictionConnection:
    """Paginated prediction results"""
    items: List[ConsumptionPrediction]
    total_count: int
    has_next_page: bool
    has_previous_page: bool


@strawberry.type
class RetailerConfigurationConnection:
    """Paginated retailer config results"""
    items: List[RetailerConfiguration]
    total_count: int
    has_next_page: bool
    has_previous_page: bool


@strawberry.type
class ProductMappingConnection:
    """Paginated product mapping results"""
    items: List[ProductMapping]
    total_count: int
    has_next_page: bool
    has_previous_page: bool


@strawberry.type
class ReorderTransactionConnection:
    """Paginated transaction results"""
    items: List[ReorderTransaction]
    total_count: int
    has_next_page: bool
    has_previous_page: bool


@strawberry.type
class OrderStatusUpdateConnection:
    """Paginated status update results"""
    items: List[OrderStatusUpdate]
    total_count: int
    has_next_page: bool
    has_previous_page: bool


# =============================================================================
# Dashboard and Analytics Types
# =============================================================================

@strawberry.type
class ReorderAnalytics:
    """Analytics for reorder system"""
    total_orders: int
    total_amount_cad: Decimal
    average_order_value_cad: Decimal
    successful_orders: int
    failed_orders: int
    average_delivery_days: Optional[Decimal]
    top_retailers: List[str]
    monthly_savings_cad: Optional[Decimal]
    prediction_accuracy: Optional[Decimal]


@strawberry.type
class SubscriptionDashboard:
    """Dashboard data for subscription management"""
    current_subscription: Optional[ReorderSubscription]
    active_preferences: List[ReorderPreferences]
    recent_predictions: List[ConsumptionPrediction]
    recent_orders: List[ReorderTransaction]
    analytics: ReorderAnalytics
    next_billing_date: Optional[datetime]
    usage_this_period: strawberry.scalars.JSON


# =============================================================================
# WebSocket Subscription Types
# =============================================================================

@strawberry.type
class OrderStatusSubscription:
    """Real-time order status updates via WebSocket"""
    order_id: str
    status_update: OrderStatusUpdate
    notification_message: str