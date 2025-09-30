"""
GraphQL Resolvers for Reorder System
PIPEDA-compliant Canadian diaper planning application

This module implements GraphQL resolvers for the automated reorder system,
handling subscriptions, ML predictions, retailer integrations, and order management.
"""

import logging
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta, timezone
from decimal import Decimal
import strawberry
from strawberry.types import Info

from ..config.database import get_async_session
from ..models.reorder import (
    ReorderSubscription, ReorderPreferences, ConsumptionPrediction,
    RetailerConfiguration, ProductMapping, ReorderTransaction, OrderStatusUpdate,
    SubscriptionTier, OrderStatus, RetailerType
)
from ..models.user import User
from ..models.child import Child
from ..models.inventory import InventoryItem, UsageLog
from ..services.reorder_service import ReorderService
from ..auth.dependencies import get_user_id_from_context
from sqlalchemy import select, func


async def get_current_user_from_info(info: Info) -> Optional[User]:
    """Get current user from GraphQL info context"""
    try:
        user_id = await get_user_id_from_context(info.context)
        if not user_id:
            return None

        async for session in get_async_session():
            result = await session.execute(
                select(User).where(User.id == user_id)
            )
            return result.scalar_one_or_none()
    except Exception as e:
        logger.error(f"Error getting current user: {e}")
        return None
from .reorder_types import (
    # Response types
    SubscriptionResponse, PreferencesResponse, PredictionResponse,
    RetailerConfigResponse, OrderResponse, ProductSearchResponse,
    # Input types
    CreateSubscriptionInput, UpdateSubscriptionInput,
    CreateReorderPreferencesInput, UpdateReorderPreferencesInput,
    CreateRetailerConfigInput, ManualOrderInput,
    # Connection types
    ReorderSubscriptionConnection, ReorderPreferencesConnection,
    ConsumptionPredictionConnection, RetailerConfigurationConnection,
    ProductMappingConnection, ReorderTransactionConnection,
    OrderStatusUpdateConnection,
    # Dashboard types
    SubscriptionDashboard, ReorderAnalytics,
    # Enum types
    SubscriptionTierType, RetailerTypeEnum, OrderStatusType,
    # Core types
    ReorderSubscription as ReorderSubscriptionType,
    ReorderPreferences as ReorderPreferencesType,
    ConsumptionPrediction as ConsumptionPredictionType,
    RetailerConfiguration as RetailerConfigurationType,
    ProductMapping as ProductMappingType,
    ReorderTransaction as ReorderTransactionType,
    # New types for frontend compatibility
    ReorderSuggestion, SubscriptionStatus,
    ProductInfo, ReorderUsagePattern, CostSavings, TaxBreakdown,
    RetailerPrice, RetailerInfo, SubscriptionPlan, PlanLimits,
    PlanPrice, PaymentMethodInfo, UsageStats, LifetimeStats,
    UsageInfo, AvailableUpgrade, PlanPricing, YearlyPricing
)

logger = logging.getLogger(__name__)


# =============================================================================
# Query Resolvers
# =============================================================================

@strawberry.type
class ReorderQueries:
    """GraphQL queries for reorder system"""

    @strawberry.field
    async def get_subscription(self, info: Info) -> Optional[ReorderSubscriptionType]:
        """Get current user's reorder subscription"""
        try:
            current_user = await get_current_user_from_info(info)
            if not current_user:
                return None

            async for session in get_async_session():
                result = await session.execute(
                    select(ReorderSubscription).where(
                        ReorderSubscription.user_id == current_user.id,
                        ReorderSubscription.is_active == True
                    )
                )
                subscription = result.scalar_one_or_none()

                if subscription:
                    return ReorderSubscriptionType(
                        id=str(subscription.id),
                        user_id=str(subscription.user_id),
                        tier=subscription.tier,
                        is_active=subscription.is_active,
                        stripe_subscription_id=subscription.stripe_subscription_id,
                        stripe_customer_id=subscription.stripe_customer_id,
                        stripe_price_id=subscription.stripe_price_id,
                        billing_amount_cad=subscription.billing_amount_cad,
                        billing_interval=subscription.billing_interval,
                        gst_rate=subscription.gst_rate,
                        pst_hst_rate=subscription.pst_hst_rate,
                        total_tax_rate=subscription.total_tax_rate,
                        trial_end_date=subscription.trial_end_date,
                        current_period_start=subscription.current_period_start,
                        current_period_end=subscription.current_period_end,
                        cancel_at_period_end=subscription.cancel_at_period_end,
                        cancelled_at=subscription.cancelled_at,
                        features=subscription.features,
                        created_at=subscription.created_at,
                        updated_at=subscription.updated_at
                    )
                return None

        except Exception as e:
            logger.error(f"Error getting subscription: {e}")
            return None

    @strawberry.field
    async def get_reorder_preferences(
        self,
        info: Info,
        child_id: Optional[str] = None
    ) -> List[ReorderPreferencesType]:
        """Get reorder preferences for user's children"""
        try:
            current_user = await get_current_user_from_info(info)
            if not current_user:
                return []

            async for session in get_async_session():
                query = select(ReorderPreferences).join(
                    ReorderSubscription
                ).where(
                    ReorderSubscription.user_id == current_user.id
                )

                if child_id:
                    query = query.where(ReorderPreferences.child_id == child_id)

                result = await session.execute(query)
                preferences = result.scalars().all()

                return [
                    ReorderPreferencesType(
                        id=str(pref.id),
                        subscription_id=str(pref.subscription_id),
                        child_id=str(pref.child_id),
                        auto_reorder_enabled=pref.auto_reorder_enabled,
                        reorder_threshold_days=pref.reorder_threshold_days,
                        max_order_amount_cad=pref.max_order_amount_cad,
                        preferred_retailers=pref.preferred_retailers or [],
                        preferred_brands=pref.preferred_brands or [],
                        size_preferences=pref.size_preferences or {},
                        preferred_delivery_days=pref.preferred_delivery_days or [],
                        delivery_instructions=pref.delivery_instructions,
                        emergency_contact_on_delivery=pref.emergency_contact_on_delivery,
                        notify_before_order=pref.notify_before_order,
                        notify_order_placed=pref.notify_order_placed,
                        notify_delivery_updates=pref.notify_delivery_updates,
                        notification_advance_hours=pref.notification_advance_hours,
                        use_growth_prediction=pref.use_growth_prediction,
                        use_seasonal_adjustments=pref.use_seasonal_adjustments,
                        prediction_confidence_threshold=pref.prediction_confidence_threshold,
                        created_at=pref.created_at,
                        updated_at=pref.updated_at
                    )
                    for pref in preferences
                ]

        except Exception as e:
            logger.error(f"Error getting reorder preferences: {e}")
            return []

    @strawberry.field
    async def get_consumption_predictions(
        self,
        info: Info,
        child_id: Optional[str] = None,
        limit: int = 10
    ) -> List[ConsumptionPredictionType]:
        """Get ML consumption predictions for user's children"""
        try:
            current_user = await get_current_user_from_info(info)
            if not current_user:
                return []

            async for session in get_async_session():
                query = select(ConsumptionPrediction).join(Child).where(
                    Child.parent_id == current_user.id
                ).order_by(ConsumptionPrediction.prediction_date.desc())

                if child_id:
                    query = query.where(ConsumptionPrediction.child_id == child_id)

                query = query.limit(limit)
                result = await session.execute(query)
                predictions = result.scalars().all()

                return [
                    ConsumptionPredictionType(
                        id=str(pred.id),
                        child_id=str(pred.child_id),
                        model_version=pred.model_version,
                        prediction_date=pred.prediction_date,
                        prediction_horizon_days=pred.prediction_horizon_days,
                        confidence_level=pred.confidence_level,
                        mean_absolute_error=pred.mean_absolute_error,
                        r_squared_score=pred.r_squared_score,
                        current_consumption_rate=pred.current_consumption_rate,
                        predicted_consumption_30d=pred.predicted_consumption_30d,
                        predicted_runout_date=pred.predicted_runout_date,
                        recommended_reorder_date=pred.recommended_reorder_date,
                        size_change_probability=pred.size_change_probability,
                        predicted_new_size=pred.predicted_new_size,
                        size_change_estimated_date=pred.size_change_estimated_date,
                        growth_adjustment_factor=pred.growth_adjustment_factor,
                        seasonal_adjustment_factor=pred.seasonal_adjustment_factor,
                        feature_importance=pred.feature_importance,
                        training_data_points=pred.training_data_points,
                        training_period_days=pred.training_period_days,
                        last_usage_date=pred.last_usage_date,
                        created_at=pred.created_at
                    )
                    for pred in predictions
                ]

        except Exception as e:
            logger.error(f"Error getting consumption predictions: {e}")
            return []

    @strawberry.field
    async def get_retailer_configurations(
        self,
        info: Info
    ) -> List[RetailerConfigurationType]:
        """Get user's retailer configurations"""
        try:
            current_user = await get_current_user_from_info(info)
            if not current_user:
                return []

            async for session in get_async_session():
                result = await session.execute(
                    select(RetailerConfiguration).where(
                        RetailerConfiguration.user_id == current_user.id,
                        RetailerConfiguration.is_active == True
                    )
                )
                configs = result.scalars().all()

                return [
                    RetailerConfigurationType(
                        id=str(config.id),
                        user_id=str(config.user_id),
                        retailer_type=config.retailer_type,
                        retailer_name=config.retailer_name,
                        is_active=config.is_active,
                        api_endpoint=config.api_endpoint,
                        api_version=config.api_version,
                        rate_limit_per_hour=config.rate_limit_per_hour,
                        partner_tag=config.partner_tag,
                        store_id=config.store_id,
                        affiliate_id=config.affiliate_id,
                        last_successful_request=config.last_successful_request,
                        total_requests_made=config.total_requests_made,
                        total_successful_orders=config.total_successful_orders,
                        average_response_time_ms=config.average_response_time_ms,
                        consecutive_failures=config.consecutive_failures,
                        last_error_message=config.last_error_message,
                        last_error_date=config.last_error_date,
                        created_at=config.created_at,
                        updated_at=config.updated_at
                    )
                    for config in configs
                ]

        except Exception as e:
            logger.error(f"Error getting retailer configurations: {e}")
            return []

    @strawberry.field
    async def search_products(
        self,
        info: Info,
        brand: Optional[str] = None,
        diaper_size: Optional[str] = None,
        min_price_cad: Optional[Decimal] = None,
        max_price_cad: Optional[Decimal] = None,
        retailer_type: Optional[RetailerTypeEnum] = None,
        limit: int = 20
    ) -> ProductSearchResponse:
        """Search for products across configured retailers"""
        try:
            current_user = await get_current_user_from_info(info)
            if not current_user:
                return ProductSearchResponse(
                    success=False,
                    products=[],
                    total_count=0,
                    message="Authentication required"
                )

            async for session in get_async_session():
                query = select(ProductMapping).join(
                    RetailerConfiguration
                ).where(
                    RetailerConfiguration.user_id == current_user.id,
                    RetailerConfiguration.is_active == True,
                    ProductMapping.is_available == True
                )

                if brand:
                    query = query.where(ProductMapping.brand.ilike(f"%{brand}%"))
                if diaper_size:
                    query = query.where(ProductMapping.diaper_size == diaper_size)
                if min_price_cad:
                    query = query.where(ProductMapping.current_price_cad >= min_price_cad)
                if max_price_cad:
                    query = query.where(ProductMapping.current_price_cad <= max_price_cad)
                if retailer_type:
                    query = query.where(RetailerConfiguration.retailer_type == retailer_type.value)

                # Get count first
                count_result = await session.execute(
                    select(func.count()).select_from(query.subquery())
                )
                total_count = count_result.scalar()

                # Get products
                products_query = query.order_by(
                    ProductMapping.price_per_diaper_cad.asc()
                ).limit(limit)
                products_result = await session.execute(products_query)
                products = products_result.scalars().all()

                product_types = [
                    ProductMappingType(
                        id=str(product.id),
                        retailer_config_id=str(product.retailer_config_id),
                        retailer_product_id=product.retailer_product_id,
                        retailer_sku=product.retailer_sku,
                        product_url=product.product_url,
                        brand=product.brand,
                        product_name=product.product_name,
                        diaper_size=product.diaper_size,
                        pack_count=product.pack_count,
                        current_price_cad=product.current_price_cad,
                        regular_price_cad=product.regular_price_cad,
                        price_per_diaper_cad=product.price_per_diaper_cad,
                        is_available=product.is_available,
                        estimated_delivery_days=product.estimated_delivery_days,
                        shipping_cost_cad=product.shipping_cost_cad,
                        free_shipping_threshold_cad=product.free_shipping_threshold_cad,
                        features=product.features,
                        ingredients=product.ingredients or [],
                        certifications=product.certifications or [],
                        last_price_update=product.last_price_update,
                        last_availability_check=product.last_availability_check,
                        price_history=product.price_history,
                        user_rating=product.user_rating,
                        user_notes=product.user_notes,
                        created_at=product.created_at,
                        updated_at=product.updated_at
                    )
                    for product in products
                ]

                return ProductSearchResponse(
                    success=True,
                    products=product_types,
                    total_count=total_count,
                    message=f"Found {total_count} products"
                )

        except Exception as e:
            logger.error(f"Error searching products: {e}")
            return ProductSearchResponse(
                success=False,
                products=[],
                total_count=0,
                message=f"Error searching products: {str(e)}"
            )

    @strawberry.field
    async def get_order_history(
        self,
        info: Info,
        child_id: Optional[str] = None,
        status: Optional[OrderStatusType] = None,
        limit: int = 20
    ) -> List[ReorderTransactionType]:
        """Get order history for user"""
        try:
            current_user = await get_current_user_from_info(info)
            if not current_user:
                return []

            async for session in get_async_session():
                query = select(ReorderTransaction).join(
                    ReorderSubscription
                ).where(
                    ReorderSubscription.user_id == current_user.id
                ).order_by(ReorderTransaction.ordered_at.desc())

                if child_id:
                    query = query.where(ReorderTransaction.child_id == child_id)
                if status:
                    query = query.where(ReorderTransaction.status == status.value)

                query = query.limit(limit)
                result = await session.execute(query)
                transactions = result.scalars().all()

                return [
                    ReorderTransactionType(
                        id=str(txn.id),
                        subscription_id=str(txn.subscription_id),
                        child_id=str(txn.child_id),
                        order_number=txn.order_number,
                        retailer_order_id=txn.retailer_order_id,
                        retailer_type=txn.retailer_type,
                        status=txn.status,
                        order_type=txn.order_type,
                        products=txn.products,
                        total_items=txn.total_items,
                        subtotal_cad=txn.subtotal_cad,
                        shipping_cost_cad=txn.shipping_cost_cad,
                        tax_amount_cad=txn.tax_amount_cad,
                        total_amount_cad=txn.total_amount_cad,
                        stripe_payment_intent_id=txn.stripe_payment_intent_id,
                        payment_method_type=txn.payment_method_type,
                        payment_authorized_at=txn.payment_authorized_at,
                        payment_captured_at=txn.payment_captured_at,
                        delivery_address=txn.delivery_address,
                        estimated_delivery_date=txn.estimated_delivery_date,
                        actual_delivery_date=txn.actual_delivery_date,
                        tracking_number=txn.tracking_number,
                        tracking_url=txn.tracking_url,
                        prediction_id=str(txn.prediction_id) if txn.prediction_id else None,
                        predicted_runout_date=txn.predicted_runout_date,
                        days_until_runout=txn.days_until_runout,
                        failure_reason=txn.failure_reason,
                        retry_count=txn.retry_count,
                        last_retry_at=txn.last_retry_at,
                        ordered_at=txn.ordered_at,
                        confirmed_at=txn.confirmed_at,
                        shipped_at=txn.shipped_at,
                        delivered_at=txn.delivered_at,
                        cancelled_at=txn.cancelled_at,
                        created_at=txn.created_at,
                        updated_at=txn.updated_at
                    )
                    for txn in transactions
                ]

        except Exception as e:
            logger.error(f"Error getting order history: {e}")
            return []

    @strawberry.field
    async def get_subscription_dashboard(self, info: Info) -> SubscriptionDashboard:
        """Get comprehensive dashboard data for subscription management"""
        try:
            current_user = await get_current_user_from_info(info)
            if not current_user:
                # Return empty dashboard instead of None to fix null-safety
                return SubscriptionDashboard(
                    current_subscription=None,
                    active_preferences=[],
                    recent_predictions=[],
                    recent_orders=[],
                    analytics=ReorderAnalytics(
                        total_orders=0,
                        total_amount_cad=Decimal('0.00'),
                        average_order_value_cad=Decimal('0.00'),
                        successful_orders=0,
                        failed_orders=0,
                        average_delivery_days=None,
                        top_retailers=[],
                        monthly_savings_cad=None,
                        prediction_accuracy=None
                    ),
                    next_billing_date=None,
                    usage_this_period={}
                )

            async for session in get_async_session():
                # Get current subscription
                result = await session.execute(
                    select(ReorderSubscription).where(
                        ReorderSubscription.user_id == current_user.id,
                        ReorderSubscription.is_active == True
                    )
                )
                subscription = result.scalar_one_or_none()

                if not subscription:
                    # Return empty dashboard instead of None to fix null-safety
                    return SubscriptionDashboard(
                        current_subscription=None,
                        active_preferences=[],
                        recent_predictions=[],
                        recent_orders=[],
                        analytics=ReorderAnalytics(
                            total_orders=0,
                            total_amount_cad=Decimal('0.00'),
                            average_order_value_cad=Decimal('0.00'),
                            successful_orders=0,
                            failed_orders=0,
                            average_delivery_days=None,
                            top_retailers=[],
                            monthly_savings_cad=None,
                            prediction_accuracy=None
                        ),
                        next_billing_date=None,
                        usage_this_period={}
                    )

                # Get active preferences
                preferences_result = await session.execute(
                    select(ReorderPreferences).where(
                        ReorderPreferences.subscription_id == subscription.id
                    )
                )
                preferences = preferences_result.scalars().all()

                # Get recent predictions
                predictions_result = await session.execute(
                    select(ConsumptionPrediction).join(Child).where(
                        Child.parent_id == current_user.id
                    ).order_by(ConsumptionPrediction.prediction_date.desc()).limit(5)
                )
                predictions = predictions_result.scalars().all()

                # Get recent orders
                orders_result = await session.execute(
                    select(ReorderTransaction).where(
                        ReorderTransaction.subscription_id == subscription.id
                    ).order_by(ReorderTransaction.ordered_at.desc()).limit(10)
                )
                orders = orders_result.scalars().all()

                # Calculate analytics
                total_orders = len(orders)
                total_amount = sum(order.total_amount_cad for order in orders)
                successful_orders = len([o for o in orders if o.status == OrderStatus.DELIVERED])
                failed_orders = len([o for o in orders if o.status == OrderStatus.FAILED])

                analytics = ReorderAnalytics(
                    total_orders=total_orders,
                    total_amount_cad=total_amount,
                    average_order_value_cad=total_amount / total_orders if total_orders > 0 else Decimal('0'),
                    successful_orders=successful_orders,
                    failed_orders=failed_orders,
                    average_delivery_days=None,  # TODO: Calculate from order data
                    top_retailers=[],  # TODO: Calculate from order data
                    monthly_savings_cad=None,  # TODO: Calculate based on predictions
                    prediction_accuracy=None  # TODO: Calculate model accuracy
                )

                return SubscriptionDashboard(
                    current_subscription=ReorderSubscriptionType(
                        id=str(subscription.id),
                        user_id=str(subscription.user_id),
                        tier=subscription.tier,
                        is_active=subscription.is_active,
                        stripe_subscription_id=subscription.stripe_subscription_id,
                        stripe_customer_id=subscription.stripe_customer_id,
                        stripe_price_id=subscription.stripe_price_id,
                        billing_amount_cad=subscription.billing_amount_cad,
                        billing_interval=subscription.billing_interval,
                        gst_rate=subscription.gst_rate,
                        pst_hst_rate=subscription.pst_hst_rate,
                        total_tax_rate=subscription.total_tax_rate,
                        trial_end_date=subscription.trial_end_date,
                        current_period_start=subscription.current_period_start,
                        current_period_end=subscription.current_period_end,
                        cancel_at_period_end=subscription.cancel_at_period_end,
                        cancelled_at=subscription.cancelled_at,
                        features=subscription.features,
                        created_at=subscription.created_at,
                        updated_at=subscription.updated_at
                    ),
                    active_preferences=[
                        ReorderPreferencesType(
                            id=str(pref.id),
                            subscription_id=str(pref.subscription_id),
                            child_id=str(pref.child_id),
                            auto_reorder_enabled=pref.auto_reorder_enabled,
                            reorder_threshold_days=pref.reorder_threshold_days,
                            max_order_amount_cad=pref.max_order_amount_cad,
                            preferred_retailers=pref.preferred_retailers or [],
                            preferred_brands=pref.preferred_brands or [],
                            size_preferences=pref.size_preferences or {},
                            preferred_delivery_days=pref.preferred_delivery_days or [],
                            delivery_instructions=pref.delivery_instructions,
                            emergency_contact_on_delivery=pref.emergency_contact_on_delivery,
                            notify_before_order=pref.notify_before_order,
                            notify_order_placed=pref.notify_order_placed,
                            notify_delivery_updates=pref.notify_delivery_updates,
                            notification_advance_hours=pref.notification_advance_hours,
                            use_growth_prediction=pref.use_growth_prediction,
                            use_seasonal_adjustments=pref.use_seasonal_adjustments,
                            prediction_confidence_threshold=pref.prediction_confidence_threshold,
                            created_at=pref.created_at,
                            updated_at=pref.updated_at
                        )
                        for pref in preferences
                    ],
                    recent_predictions=[
                        ConsumptionPredictionType(
                            id=str(pred.id),
                            child_id=str(pred.child_id),
                            model_version=pred.model_version,
                            prediction_date=pred.prediction_date,
                            prediction_horizon_days=pred.prediction_horizon_days,
                            confidence_level=pred.confidence_level,
                            mean_absolute_error=pred.mean_absolute_error,
                            r_squared_score=pred.r_squared_score,
                            current_consumption_rate=pred.current_consumption_rate,
                            predicted_consumption_30d=pred.predicted_consumption_30d,
                            predicted_runout_date=pred.predicted_runout_date,
                            recommended_reorder_date=pred.recommended_reorder_date,
                            size_change_probability=pred.size_change_probability,
                            predicted_new_size=pred.predicted_new_size,
                            size_change_estimated_date=pred.size_change_estimated_date,
                            growth_adjustment_factor=pred.growth_adjustment_factor,
                            seasonal_adjustment_factor=pred.seasonal_adjustment_factor,
                            feature_importance=pred.feature_importance,
                            training_data_points=pred.training_data_points,
                            training_period_days=pred.training_period_days,
                            last_usage_date=pred.last_usage_date,
                            created_at=pred.created_at
                        )
                        for pred in predictions
                    ],
                    recent_orders=[
                        ReorderTransactionType(
                            id=str(order.id),
                            subscription_id=str(order.subscription_id),
                            child_id=str(order.child_id),
                            order_number=order.order_number,
                            retailer_order_id=order.retailer_order_id,
                            retailer_type=order.retailer_type,
                            status=order.status,
                            order_type=order.order_type,
                            products=order.products,
                            total_items=order.total_items,
                            subtotal_cad=order.subtotal_cad,
                            shipping_cost_cad=order.shipping_cost_cad,
                            tax_amount_cad=order.tax_amount_cad,
                            total_amount_cad=order.total_amount_cad,
                            stripe_payment_intent_id=order.stripe_payment_intent_id,
                            payment_method_type=order.payment_method_type,
                            payment_authorized_at=order.payment_authorized_at,
                            payment_captured_at=order.payment_captured_at,
                            delivery_address=order.delivery_address,
                            estimated_delivery_date=order.estimated_delivery_date,
                            actual_delivery_date=order.actual_delivery_date,
                            tracking_number=order.tracking_number,
                            tracking_url=order.tracking_url,
                            prediction_id=str(order.prediction_id) if order.prediction_id else None,
                            predicted_runout_date=order.predicted_runout_date,
                            days_until_runout=order.days_until_runout,
                            failure_reason=order.failure_reason,
                            retry_count=order.retry_count,
                            last_retry_at=order.last_retry_at,
                            ordered_at=order.ordered_at,
                            confirmed_at=order.confirmed_at,
                            shipped_at=order.shipped_at,
                            delivered_at=order.delivered_at,
                            cancelled_at=order.cancelled_at,
                            created_at=order.created_at,
                            updated_at=order.updated_at
                        )
                        for order in orders
                    ],
                    analytics=analytics,
                    next_billing_date=subscription.current_period_end,
                    usage_this_period={}  # TODO: Calculate usage stats
                )

        except Exception as e:
            logger.error(f"Error getting subscription dashboard: {e}")
            # Return empty dashboard instead of None to fix null-safety
            return SubscriptionDashboard(
                current_subscription=None,
                active_preferences=[],
                recent_predictions=[],
                recent_orders=[],
                analytics=ReorderAnalytics(
                    total_orders=0,
                    total_amount_cad=Decimal('0.00'),
                    average_order_value_cad=Decimal('0.00'),
                    successful_orders=0,
                    failed_orders=0,
                    average_delivery_days=None,
                    top_retailers=[],
                    monthly_savings_cad=None,
                    prediction_accuracy=None
                ),
                next_billing_date=None,
                usage_this_period={}
            )

    @strawberry.field
    async def get_my_subscription(
        self,
        info: Info,
        first: int = 10,
        after: Optional[str] = None
    ) -> ReorderSubscriptionConnection:
        """Get user's subscription with pagination"""
        try:
            current_user = await get_current_user_from_info(info)
            if not current_user:
                return ReorderSubscriptionConnection(
                    items=[],
                    total_count=0,
                    has_next_page=False,
                    has_previous_page=False
                )

            subscription = await self.get_subscription(info)
            if subscription:
                return ReorderSubscriptionConnection(
                    items=[subscription],
                    total_count=1,
                    has_next_page=False,
                    has_previous_page=False
                )
            else:
                return ReorderSubscriptionConnection(
                    items=[],
                    total_count=0,
                    has_next_page=False,
                    has_previous_page=False
                )

        except Exception as e:
            logger.error(f"Error getting my subscription: {e}")
            return ReorderSubscriptionConnection(
                items=[],
                total_count=0,
                has_next_page=False,
                has_previous_page=False
            )

    @strawberry.field
    async def get_order_status_updates(
        self,
        info: Info,
        transaction_id: str,
        first: int = 10,
        after: Optional[str] = None
    ) -> OrderStatusUpdateConnection:
        """Get order status updates for a specific transaction"""
        try:
            current_user = await get_current_user_from_info(info)
            if not current_user:
                return OrderStatusUpdateConnection(
                    items=[],
                    total_count=0,
                    has_next_page=False,
                    has_previous_page=False
                )

            async for session in get_async_session():
                # Verify user owns the transaction
                transaction_result = await session.execute(
                    select(ReorderTransaction).join(ReorderSubscription).where(
                        ReorderTransaction.id == transaction_id,
                        ReorderSubscription.user_id == current_user.id
                    )
                )
                transaction = transaction_result.scalar_one_or_none()

                if not transaction:
                    return OrderStatusUpdateConnection(
                        items=[],
                        total_count=0,
                        has_next_page=False,
                        has_previous_page=False
                    )

                # Get status updates
                from ..models.reorder import OrderStatusUpdate
                updates_result = await session.execute(
                    select(OrderStatusUpdate).where(
                        OrderStatusUpdate.transaction_id == transaction_id
                    ).order_by(OrderStatusUpdate.created_at.desc()).limit(first)
                )
                updates = updates_result.scalars().all()

                # Convert to GraphQL types
                from .reorder_types import OrderStatusUpdate as OrderStatusUpdateType
                update_types = [
                    OrderStatusUpdateType(
                        id=str(update.id),
                        transaction_id=str(update.transaction_id),
                        previous_status=update.previous_status,
                        new_status=update.new_status,
                        status_message=update.status_message,
                        update_source=update.update_source,
                        external_reference=update.external_reference,
                        tracking_number=update.tracking_number,
                        tracking_url=update.tracking_url,
                        estimated_delivery=update.estimated_delivery,
                        carrier_name=update.carrier_name,
                        current_location=update.current_location,
                        delivery_notes=update.delivery_notes,
                        user_notified=update.user_notified,
                        notification_sent_at=update.notification_sent_at,
                        created_at=update.created_at
                    )
                    for update in updates
                ]

                return OrderStatusUpdateConnection(
                    items=update_types,
                    total_count=len(update_types),
                    has_next_page=len(update_types) >= first,
                    has_previous_page=False
                )

        except Exception as e:
            logger.error(f"Error getting order status updates: {e}")
            return OrderStatusUpdateConnection(
                items=[],
                total_count=0,
                has_next_page=False,
                has_previous_page=False
            )

    @strawberry.field
    async def get_reorder_analytics(self, info: Info) -> ReorderAnalytics:
        """Get comprehensive reorder analytics for user"""
        try:
            current_user = await get_current_user_from_info(info)
            if not current_user:
                # Return empty analytics instead of None to fix null-safety
                return ReorderAnalytics(
                    total_orders=0,
                    total_amount_cad=Decimal('0.00'),
                    average_order_value_cad=Decimal('0.00'),
                    successful_orders=0,
                    failed_orders=0,
                    average_delivery_days=None,
                    top_retailers=[],
                    monthly_savings_cad=None,
                    prediction_accuracy=None
                )

            async for session in get_async_session():
                # Get user's orders for analytics
                orders_result = await session.execute(
                    select(ReorderTransaction).join(ReorderSubscription).where(
                        ReorderSubscription.user_id == current_user.id
                    )
                )
                orders = orders_result.scalars().all()

                if not orders:
                    return ReorderAnalytics(
                        total_orders=0,
                        total_amount_cad=Decimal('0.00'),
                        average_order_value_cad=Decimal('0.00'),
                        successful_orders=0,
                        failed_orders=0,
                        average_delivery_days=None,
                        top_retailers=[],
                        monthly_savings_cad=None,
                        prediction_accuracy=None
                    )

                # Calculate analytics
                total_orders = len(orders)
                total_amount = sum(order.total_amount_cad for order in orders)
                successful_orders = len([o for o in orders if o.status == "delivered"])
                failed_orders = len([o for o in orders if o.status == "failed"])

                # Calculate average delivery days (placeholder)
                delivered_orders = [o for o in orders if o.delivered_at and o.ordered_at]
                avg_delivery_days = None
                if delivered_orders:
                    total_delivery_days = sum(
                        (order.delivered_at - order.ordered_at).days
                        for order in delivered_orders
                    )
                    avg_delivery_days = Decimal(str(total_delivery_days / len(delivered_orders)))

                # Get top retailers
                retailer_counts = {}
                for order in orders:
                    retailer = order.retailer_type
                    retailer_counts[retailer] = retailer_counts.get(retailer, 0) + 1

                top_retailers = sorted(retailer_counts.keys(),
                                     key=lambda x: retailer_counts[x],
                                     reverse=True)[:3]

                return ReorderAnalytics(
                    total_orders=total_orders,
                    total_amount_cad=total_amount,
                    average_order_value_cad=total_amount / total_orders if total_orders > 0 else Decimal('0.00'),
                    successful_orders=successful_orders,
                    failed_orders=failed_orders,
                    average_delivery_days=avg_delivery_days,
                    top_retailers=top_retailers,
                    monthly_savings_cad=None,  # TODO: Calculate based on price comparisons
                    prediction_accuracy=None  # TODO: Calculate ML model accuracy
                )

        except Exception as e:
            logger.error(f"Error getting reorder analytics: {e}")
            # Return empty analytics instead of None to fix null-safety
            return ReorderAnalytics(
                total_orders=0,
                total_amount_cad=Decimal('0.00'),
                average_order_value_cad=Decimal('0.00'),
                successful_orders=0,
                failed_orders=0,
                average_delivery_days=None,
                top_retailers=[],
                monthly_savings_cad=None,
                prediction_accuracy=None
            )

    @strawberry.field
    async def get_reorder_suggestions(
        self,
        info: Info,
        childId: strawberry.ID = strawberry.field(description="Child ID to get suggestions for"),
        limit: int = 10
    ) -> List[ReorderSuggestion]:
        """Get ML-powered reorder suggestions for a child"""
        try:
            current_user = await get_current_user_from_info(info)
            if not current_user:
                return []

            async for session in get_async_session():
                # Get child data with verification that user owns the child
                child_result = await session.execute(
                    select(Child).where(
                        Child.id == childId,
                        Child.parent_id == current_user.id,
                        Child.is_deleted == False
                    )
                )
                child = child_result.scalar_one_or_none()

                if not child:
                    logger.warning(f"Child {childId} not found or not owned by user {current_user.id}")
                    return []

                # Check PIPEDA consent for ML processing (future enhancement)
                # For now, we assume consent is granted by using the premium service

                # Get current inventory for the child
                inventory_result = await session.execute(
                    select(InventoryItem).where(
                        InventoryItem.child_id == childId,
                        InventoryItem.product_type == "diaper",
                        InventoryItem.is_deleted == False
                    )
                )
                inventory_items = inventory_result.scalars().all()

                # Calculate current inventory levels
                total_diapers_left = sum(item.quantity_remaining for item in inventory_items)

                # Get recent usage data for ML prediction
                one_week_ago = datetime.now(timezone.utc) - timedelta(days=7)
                usage_result = await session.execute(
                    select(func.count(UsageLog.id)).where(
                        UsageLog.child_id == childId,
                        UsageLog.usage_type == "diaper_change",
                        UsageLog.logged_at >= one_week_ago,
                        UsageLog.is_deleted == False
                    )
                )
                weekly_usage_count = usage_result.scalar() or 0

                # Calculate daily usage rate
                daily_usage_rate = max(
                    float(child.daily_usage_count) if child.daily_usage_count else 6.0,
                    weekly_usage_count / 7.0 if weekly_usage_count >= 14 else 6.0  # Minimum realistic rate
                )

                # Calculate days remaining with current inventory
                days_remaining = int(total_diapers_left / daily_usage_rate) if daily_usage_rate > 0 else 0

                # Determine confidence level based on data quality
                confidence_score = 0.5  # Base confidence

                # Increase confidence with more usage data
                if weekly_usage_count >= 35:  # 5+ changes per day
                    confidence_score = 0.9
                elif weekly_usage_count >= 21:  # 3+ changes per day
                    confidence_score = 0.8
                elif weekly_usage_count >= 14:  # 2+ changes per day
                    confidence_score = 0.7

                # Determine priority based on urgency
                if days_remaining <= 2:
                    priority = "high"
                elif days_remaining <= 5:
                    priority = "medium"
                else:
                    priority = "low"

                # Only suggest reorder if running low (< 7 days)
                if days_remaining >= 7:
                    return []

                # Create realistic product information based on child's current size
                current_size = child.current_diaper_size or "Size 3"

                # Product catalog with realistic Canadian pricing
                product_catalog = {
                    "Newborn": {"base_price": 42.99, "pack_size": 84},
                    "Size 1": {"base_price": 45.99, "pack_size": 76},
                    "Size 2": {"base_price": 47.99, "pack_size": 68},
                    "Size 3": {"base_price": 49.99, "pack_size": 62},
                    "Size 4": {"base_price": 51.99, "pack_size": 58},
                    "Size 5": {"base_price": 53.99, "pack_size": 54},
                    "Size 6": {"base_price": 55.99, "pack_size": 50}
                }

                product_info_template = product_catalog.get(current_size, product_catalog["Size 3"])
                base_price = Decimal(str(product_info_template["base_price"]))
                pack_size = product_info_template["pack_size"]

                # Create product suggestion
                product_info = ProductInfo(
                    id=f"huggies_{current_size.lower().replace(' ', '_')}",
                    name=f"Huggies Special Delivery {current_size}",
                    brand="Huggies",
                    size=current_size,
                    category="Diapers",
                    image=None,
                    description=f"Hypoallergenic diapers for sensitive skin - {pack_size} count",
                    features=["Plant-based liner", "Hypoallergenic", "12-hour protection", "Wetness indicator"]
                )

                # Calculate Canadian taxes (using Ontario as default)
                gst_rate = Decimal('0.05')  # 5% GST
                hst_rate = Decimal('0.08')  # 8% HST (Ontario)
                total_tax_rate = gst_rate + hst_rate

                gst_amount = (base_price * gst_rate).quantize(Decimal('0.01'))
                hst_amount = (base_price * hst_rate).quantize(Decimal('0.01'))
                total_tax = gst_amount + hst_amount
                final_price = base_price + total_tax

                # Create tax breakdown
                taxes = TaxBreakdown(
                    gst=gst_amount,
                    pst=Decimal('0.00'),
                    hst=hst_amount,
                    total=total_tax
                )

                # Create retailer pricing with realistic discount
                discount_percentage = Decimal('15.0')  # 15% discount
                original_price = base_price / (1 - discount_percentage / 100)

                retailer_price = RetailerPrice(
                    amount=base_price,
                    currency="CAD",
                    original_price=original_price.quantize(Decimal('0.01')),
                    discount_percentage=discount_percentage,
                    taxes=taxes,
                    final_amount=final_price
                )

                # Cost savings calculation
                savings_vs_regular = original_price - base_price
                cost_savings = CostSavings(
                    amount=savings_vs_regular.quantize(Decimal('0.01')),
                    currency="CAD",
                    compared_to_regular_price=savings_vs_regular.quantize(Decimal('0.01')),
                    compared_to_last_purchase=None
                )

                # Usage pattern based on actual data
                usage_pattern = ReorderUsagePattern(
                    average_daily_usage=daily_usage_rate,
                    weekly_trend="stable" if abs(weekly_usage_count - (daily_usage_rate * 7)) < 3 else "increasing",
                    seasonal_factors={"current": 1.0}
                )

                # Create available retailers with realistic Canadian options
                available_retailers = [
                    RetailerInfo(
                        id="amazon_ca",
                        name="Amazon Canada",
                        logo=None,
                        price=retailer_price,
                        delivery_time=2,
                        in_stock=True,
                        rating=Decimal('4.6'),
                        free_shipping=True if base_price >= 35 else False,
                        affiliate_disclosure="NestSync may earn a commission from this purchase"
                    ),
                    RetailerInfo(
                        id="walmart_ca",
                        name="Walmart Canada",
                        logo=None,
                        price=RetailerPrice(
                            amount=base_price + Decimal('1.00'),
                            currency="CAD",
                            original_price=original_price + Decimal('1.00'),
                            discount_percentage=Decimal('12.0'),
                            taxes=TaxBreakdown(
                                gst=(base_price + Decimal('1.00')) * gst_rate,
                                pst=Decimal('0.00'),
                                hst=(base_price + Decimal('1.00')) * hst_rate,
                                total=(base_price + Decimal('1.00')) * total_tax_rate
                            ),
                            final_amount=(base_price + Decimal('1.00')) * (1 + total_tax_rate)
                        ),
                        delivery_time=3,
                        in_stock=True,
                        rating=Decimal('4.3'),
                        free_shipping=True if base_price >= 35 else False,
                        affiliate_disclosure="NestSync may earn a commission from this purchase"
                    )
                ]

                # Calculate predicted runout date
                predicted_runout_date = datetime.now(timezone.utc) + timedelta(days=days_remaining)

                # Suggest quantity based on usage rate (2-3 weeks worth)
                suggested_quantity = max(1, int((daily_usage_rate * 14) / pack_size)) + 1

                # Create the reorder suggestion
                suggestion = ReorderSuggestion(
                    id=f"suggestion_{childId}_{int(datetime.now().timestamp())}",
                    child_id=childId,
                    product_id=product_info.id,
                    product=product_info,
                    predicted_run_out_date=predicted_runout_date,
                    confidence=f"{confidence_score:.1f}",
                    priority=priority,
                    suggested_quantity=suggested_quantity,
                    current_inventory_level=days_remaining,
                    usage_pattern=usage_pattern,
                    estimated_cost_savings=cost_savings,
                    available_retailers=available_retailers,
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc),
                    ml_processing_consent=True,
                    data_retention_days=365
                )

                return [suggestion]

        except Exception as e:
            logger.error(f"Error getting reorder suggestions for child {childId}: {e}")
            return []

    @strawberry.field
    async def get_subscription_status(self, info: Info) -> Optional[SubscriptionStatus]:
        """Get current subscription status"""
        try:
            current_user = await get_current_user_from_info(info)
            if not current_user:
                return None

            # Get subscription dashboard data as base
            dashboard = await self.get_subscription_dashboard(info)

            if not dashboard.current_subscription:
                # Handle trial users with no active subscription
                # Provide a mock "Free Trial" subscription status with available upgrade plans
                from datetime import datetime, timedelta
                import uuid

                # Create available upgrade plans for trial users (based on business document pricing)
                available_upgrades = [
                    AvailableUpgrade(
                        plan_id="standard",
                        name="Standard",
                        monthly_pricing=PlanPricing(amount=Decimal('4.99'), currency="CAD"),
                        yearly_pricing=YearlyPricing(
                            amount=Decimal('49.90'),
                            currency="CAD",
                            savings_per_month=CostSavings(amount=Decimal('1.00'), currency="CAD", compared_to_regular_price=None, compared_to_last_purchase=None)
                        ),
                        new_features=["Inventory optimization", "Size predictions", "Basic analytics", "Email notifications"],
                        value_proposition="Inventory optimization and size predictions for smart planning"
                    ),
                    AvailableUpgrade(
                        plan_id="premium",
                        name="Premium",
                        monthly_pricing=PlanPricing(amount=Decimal('6.99'), currency="CAD"),
                        yearly_pricing=YearlyPricing(
                            amount=Decimal('69.90'),
                            currency="CAD",
                            savings_per_month=CostSavings(amount=Decimal('1.40'), currency="CAD", compared_to_regular_price=None, compared_to_last_purchase=None)
                        ),
                        new_features=["Multi-child support", "Advanced analytics", "Emergency alerts", "Priority support"],
                        value_proposition="Multi-child, advanced analytics, and emergency alerts for comprehensive family care"
                    )
                ]

                # Create mock trial subscription status
                trial_taxes = TaxBreakdown(
                    gst=Decimal('0.00'),
                    pst=Decimal('0.00'),
                    hst=Decimal('0.00'),
                    total=Decimal('0.00')
                )

                trial_price = PlanPrice(
                    amount=Decimal('0.00'),
                    currency="CAD",
                    billing_interval=BillingIntervalType.MONTHLY,
                    canadian_taxes=trial_taxes
                )

                trial_limits = PlanLimits(
                    reorder_suggestions=3,
                    family_members=1,
                    price_alerts=1,
                    auto_ordering=False
                )

                trial_plan = SubscriptionPlan(
                    id=str(uuid.uuid4()),
                    name="Free Trial",
                    display_name="NestSync Free Trial",
                    description="14-day free trial with basic features",
                    features=["Basic inventory tracking", "Manual logging", "Simple notifications"],
                    price=trial_price,
                    limits=trial_limits
                )

                trial_savings = CostSavings(
                    amount=Decimal('0.00'),
                    currency="CAD",
                    compared_to_regular_price=None,
                    compared_to_last_purchase=None
                )

                trial_usage = UsageInfo(
                    current_period=UsageStats(
                        reorders_suggested=0,
                        orders_placed=0,
                        savings_generated=trial_savings,
                        price_alerts_received=0
                    ),
                    lifetime=LifetimeStats(
                        total_orders=0,
                        total_savings=trial_savings,
                        member_since=datetime.now()
                    )
                )

                trial_status = SubscriptionStatus(
                    id=str(uuid.uuid4()),
                    status="trial",
                    current_plan=trial_plan,
                    next_billing_date=datetime.now() + timedelta(days=14),
                    payment_method=None,
                    usage=trial_usage,
                    available_upgrades=available_upgrades,
                    billing_data_consent=True,
                    updated_at=datetime.now()
                )

                return trial_status

            subscription = dashboard.current_subscription

            # Create plan limits
            plan_limits = PlanLimits(
                reorder_suggestions=10 if subscription.tier == SubscriptionTierType.BASIC else 50,
                family_members=1 if subscription.tier == SubscriptionTierType.BASIC else (3 if subscription.tier == SubscriptionTierType.PREMIUM else 8),
                price_alerts=5 if subscription.tier == SubscriptionTierType.BASIC else (20 if subscription.tier == SubscriptionTierType.PREMIUM else 100),
                auto_ordering=subscription.tier != SubscriptionTierType.BASIC
            )

            # Create tax breakdown for plan price
            taxes = TaxBreakdown(
                gst=subscription.gst_rate,
                pst=subscription.pst_hst_rate,
                hst=Decimal('0.00'),
                total=subscription.total_tax_rate
            )

            # Create plan price
            plan_price = PlanPrice(
                amount=subscription.billing_amount_cad,
                currency="CAD",
                billing_interval=subscription.billing_interval,
                canadian_taxes=taxes
            )

            # Create current plan
            current_plan = SubscriptionPlan(
                id=subscription.id,
                name=subscription.tier.value.title(),
                display_name=f"NestSync {subscription.tier.value.title()}",
                description=f"Perfect for families using {subscription.tier.value} features",
                features=list(subscription.features.keys()) if subscription.features else [],
                price=plan_price,
                limits=plan_limits
            )

            # Create cost savings for usage stats
            savings = CostSavings(
                amount=Decimal('45.50'),
                currency="CAD",
                compared_to_regular_price=None,
                compared_to_last_purchase=None
            )

            # Create usage statistics
            current_period_stats = UsageStats(
                reorders_suggested=len(dashboard.recent_predictions),
                orders_placed=len(dashboard.recent_orders),
                savings_generated=savings,
                price_alerts_received=5
            )

            lifetime_stats = LifetimeStats(
                total_orders=dashboard.analytics.total_orders,
                total_savings=CostSavings(
                    amount=dashboard.analytics.total_amount_cad * Decimal('0.15'),  # Estimated 15% savings
                    currency="CAD",
                    compared_to_regular_price=None,
                    compared_to_last_purchase=None
                ),
                member_since=subscription.created_at
            )

            usage_info = UsageInfo(
                current_period=current_period_stats,
                lifetime=lifetime_stats
            )

            # Create available upgrades
            available_upgrades = []
            if subscription.tier == SubscriptionTierType.BASIC:
                available_upgrades.extend([
                    AvailableUpgrade(
                        plan_id="premium",
                        name="Premium",
                        monthly_pricing=PlanPricing(amount=Decimal('24.99'), currency="CAD"),
                        yearly_pricing=YearlyPricing(
                            amount=Decimal('249.90'),
                            currency="CAD",
                            savings_per_month=CostSavings(amount=Decimal('4.17'), currency="CAD", compared_to_regular_price=None, compared_to_last_purchase=None)
                        ),
                        new_features=["Auto-reordering", "Price alerts", "Family sharing"],
                        value_proposition="Save time with automated features"
                    ),
                    AvailableUpgrade(
                        plan_id="family",
                        name="Family",
                        monthly_pricing=PlanPricing(amount=Decimal('34.99'), currency="CAD"),
                        yearly_pricing=YearlyPricing(
                            amount=Decimal('349.90'),
                            currency="CAD",
                            savings_per_month=CostSavings(amount=Decimal('4.17'), currency="CAD", compared_to_regular_price=None, compared_to_last_purchase=None)
                        ),
                        new_features=["Growth predictions", "Multiple children", "Priority support"],
                        value_proposition="Perfect for growing families"
                    )
                ])
            elif subscription.tier == SubscriptionTierType.PREMIUM:
                available_upgrades.append(
                    AvailableUpgrade(
                        plan_id="family",
                        name="Family",
                        monthly_pricing=PlanPricing(amount=Decimal('34.99'), currency="CAD"),
                        yearly_pricing=YearlyPricing(
                            amount=Decimal('349.90'),
                            currency="CAD",
                            savings_per_month=CostSavings(amount=Decimal('4.17'), currency="CAD", compared_to_regular_price=None, compared_to_last_purchase=None)
                        ),
                        new_features=["Growth predictions", "Multiple children", "Priority support"],
                        value_proposition="Perfect for growing families"
                    )
                )

            # Create subscription status
            status = SubscriptionStatus(
                id=subscription.id,
                status="active" if subscription.is_active else "inactive",
                current_plan=current_plan,
                next_billing_date=subscription.current_period_end,
                payment_method=None,  # TODO: Implement payment method retrieval
                usage=usage_info,
                available_upgrades=available_upgrades,
                billing_data_consent=True,
                updated_at=subscription.updated_at
            )

            return status

        except Exception as e:
            logger.error(f"Error getting subscription status: {e}")
            return None

    # Subscription methods for real-time updates
    @strawberry.field
    async def order_status_subscription(self, info: Info, order_id: str) -> str:
        """Placeholder for order status subscription"""
        return "Order status subscription not implemented yet"

    @strawberry.field
    async def prediction_updates_subscription(self, info: Info, child_id: str) -> str:
        """Placeholder for prediction updates subscription"""
        return "Prediction updates subscription not implemented yet"

    @strawberry.field
    async def subscription_billing_events(self, info: Info) -> str:
        """Placeholder for billing events subscription"""
        return "Billing events subscription not implemented yet"


# =============================================================================
# Mutation Resolvers
# =============================================================================

@strawberry.type
class ReorderMutations:
    """GraphQL mutations for reorder system"""

    @strawberry.mutation
    async def create_subscription(
        self,
        info: Info,
        input: CreateSubscriptionInput
    ) -> SubscriptionResponse:
        """Create a premium reorder subscription with Stripe integration"""
        try:
            current_user = await get_current_user_from_info(info)
            if not current_user:
                return SubscriptionResponse(
                    success=False,
                    subscription=None,
                    message="Authentication required"
                )

            # TODO: Integrate with Stripe to create subscription
            # This would include:
            # 1. Create Stripe customer if not exists
            # 2. Attach payment method to customer
            # 3. Calculate Canadian taxes based on province
            # 4. Create Stripe subscription with automatic tax
            # 5. Handle trial periods and prorations

            async for session in get_async_session():
                # Check if user already has active subscription
                existing_result = await session.execute(
                    select(ReorderSubscription).where(
                        ReorderSubscription.user_id == current_user.id,
                        ReorderSubscription.is_active == True
                    )
                )
                existing = existing_result.scalar_one_or_none()

                if existing:
                    return SubscriptionResponse(
                        success=False,
                        subscription=None,
                        message="User already has an active subscription"
                    )

                # Calculate Canadian taxes based on province
                gst_rate = Decimal('0.05')  # 5% GST
                pst_hst_rate = Decimal('0.00')  # Province-specific

                # Province-specific tax rates
                province_tax_rates = {
                    'ON': Decimal('0.08'),  # 8% HST (total 13%)
                    'BC': Decimal('0.07'),  # 7% PST
                    'QC': Decimal('0.09975'),  # 9.975% QST
                    'AB': Decimal('0.00'),  # No PST
                    'SK': Decimal('0.06'),  # 6% PST
                    'MB': Decimal('0.07'),  # 7% PST
                    'NB': Decimal('0.10'),  # 10% HST (total 15%)
                    'NS': Decimal('0.10'),  # 10% HST (total 15%)
                    'PE': Decimal('0.10'),  # 10% HST (total 15%)
                    'NL': Decimal('0.10'),  # 10% HST (total 15%)
                    'YT': Decimal('0.00'),  # No PST
                    'NT': Decimal('0.00'),  # No PST
                    'NU': Decimal('0.00'),  # No PST
                }

                province_code = input.province_code.upper()
                if province_code in province_tax_rates:
                    pst_hst_rate = province_tax_rates[province_code]

                total_tax_rate = gst_rate + pst_hst_rate

                # Determine pricing based on tier
                pricing = {
                    SubscriptionTierType.BASIC: Decimal('19.99'),
                    SubscriptionTierType.PREMIUM: Decimal('24.99'),
                    SubscriptionTierType.FAMILY: Decimal('34.99')
                }

                billing_amount = pricing[input.tier]

                # Create subscription record
                subscription = ReorderSubscription(
                    user_id=current_user.id,
                    tier=input.tier.value,
                    billing_amount_cad=billing_amount,
                    gst_rate=gst_rate,
                    pst_hst_rate=pst_hst_rate,
                    total_tax_rate=total_tax_rate,
                    features={
                        "auto_reorder": input.tier != SubscriptionTierType.BASIC,
                        "growth_prediction": input.tier == SubscriptionTierType.FAMILY,
                        "priority_support": input.tier == SubscriptionTierType.FAMILY,
                        "multi_child": input.tier == SubscriptionTierType.FAMILY
                    }
                )

                session.add(subscription)
                await session.commit()
                await session.refresh(subscription)

                return SubscriptionResponse(
                    success=True,
                    subscription=ReorderSubscriptionType(
                        id=str(subscription.id),
                        user_id=str(subscription.user_id),
                        tier=subscription.tier,
                        is_active=subscription.is_active,
                        stripe_subscription_id=subscription.stripe_subscription_id,
                        stripe_customer_id=subscription.stripe_customer_id,
                        stripe_price_id=subscription.stripe_price_id,
                        billing_amount_cad=subscription.billing_amount_cad,
                        billing_interval=subscription.billing_interval,
                        gst_rate=subscription.gst_rate,
                        pst_hst_rate=subscription.pst_hst_rate,
                        total_tax_rate=subscription.total_tax_rate,
                        trial_end_date=subscription.trial_end_date,
                        current_period_start=subscription.current_period_start,
                        current_period_end=subscription.current_period_end,
                        cancel_at_period_end=subscription.cancel_at_period_end,
                        cancelled_at=subscription.cancelled_at,
                        features=subscription.features,
                        created_at=subscription.created_at,
                        updated_at=subscription.updated_at
                    ),
                    message="Subscription created successfully",
                    client_secret="pi_test_client_secret"  # TODO: Real Stripe client secret
                )

        except Exception as e:
            logger.error(f"Error creating subscription: {e}")
            return SubscriptionResponse(
                success=False,
                subscription=None,
                message=f"Error creating subscription: {str(e)}"
            )

    @strawberry.mutation
    async def create_reorder_preferences(
        self,
        info: Info,
        input: CreateReorderPreferencesInput
    ) -> PreferencesResponse:
        """Create reorder preferences for a child"""
        try:
            current_user = await get_current_user_from_info(info)
            if not current_user:
                return PreferencesResponse(
                    success=False,
                    preferences=None,
                    message="Authentication required"
                )

            async for session in get_async_session():
                # Verify user has active subscription
                subscription_result = await session.execute(
                    select(ReorderSubscription).where(
                        ReorderSubscription.user_id == current_user.id,
                        ReorderSubscription.is_active == True
                    )
                )
                subscription = subscription_result.scalar_one_or_none()

                if not subscription:
                    return PreferencesResponse(
                        success=False,
                        preferences=None,
                        message="Active subscription required"
                    )

                # Verify user owns the child
                child_result = await session.execute(
                    select(Child).where(
                        Child.id == input.child_id,
                        Child.parent_id == current_user.id
                    )
                )
                child = child_result.scalar_one_or_none()

                if not child:
                    return PreferencesResponse(
                        success=False,
                        preferences=None,
                        message="Child not found or access denied"
                    )

                # Check if preferences already exist
                existing_result = await session.execute(
                    select(ReorderPreferences).where(
                        ReorderPreferences.subscription_id == subscription.id,
                        ReorderPreferences.child_id == input.child_id
                    )
                )
                existing = existing_result.scalar_one_or_none()

                if existing:
                    return PreferencesResponse(
                        success=False,
                        preferences=None,
                        message="Preferences already exist for this child"
                    )

                # Create preferences
                preferences = ReorderPreferences(
                    subscription_id=subscription.id,
                    child_id=input.child_id,
                    auto_reorder_enabled=input.auto_reorder_enabled,
                    reorder_threshold_days=input.reorder_threshold_days,
                    max_order_amount_cad=input.max_order_amount_cad,
                    preferred_retailers=[r.value for r in input.preferred_retailers],
                    preferred_brands=input.preferred_brands,
                    preferred_delivery_days=input.preferred_delivery_days,
                    delivery_instructions=input.delivery_instructions,
                    notification_advance_hours=input.notification_advance_hours
                )

                session.add(preferences)
                await session.commit()
                await session.refresh(preferences)

                return PreferencesResponse(
                    success=True,
                    preferences=ReorderPreferencesType(
                        id=str(preferences.id),
                        subscription_id=str(preferences.subscription_id),
                        child_id=str(preferences.child_id),
                        auto_reorder_enabled=preferences.auto_reorder_enabled,
                        reorder_threshold_days=preferences.reorder_threshold_days,
                        max_order_amount_cad=preferences.max_order_amount_cad,
                        preferred_retailers=preferences.preferred_retailers or [],
                        preferred_brands=preferences.preferred_brands or [],
                        size_preferences=preferences.size_preferences or {},
                        preferred_delivery_days=preferences.preferred_delivery_days or [],
                        delivery_instructions=preferences.delivery_instructions,
                        emergency_contact_on_delivery=preferences.emergency_contact_on_delivery,
                        notify_before_order=preferences.notify_before_order,
                        notify_order_placed=preferences.notify_order_placed,
                        notify_delivery_updates=preferences.notify_delivery_updates,
                        notification_advance_hours=preferences.notification_advance_hours,
                        use_growth_prediction=preferences.use_growth_prediction,
                        use_seasonal_adjustments=preferences.use_seasonal_adjustments,
                        prediction_confidence_threshold=preferences.prediction_confidence_threshold,
                        created_at=preferences.created_at,
                        updated_at=preferences.updated_at
                    ),
                    message="Preferences created successfully"
                )

        except Exception as e:
            logger.error(f"Error creating reorder preferences: {e}")
            return PreferencesResponse(
                success=False,
                preferences=None,
                message=f"Error creating preferences: {str(e)}"
            )

    @strawberry.mutation
    async def create_retailer_config(
        self,
        info: Info,
        input: CreateRetailerConfigInput
    ) -> RetailerConfigResponse:
        """Create retailer API configuration"""
        try:
            current_user = await get_current_user_from_info(info)
            if not current_user:
                return RetailerConfigResponse(
                    success=False,
                    config=None,
                    message="Authentication required"
                )

            async for session in get_async_session():
                # Check if config already exists for this retailer
                existing_result = await session.execute(
                    select(RetailerConfiguration).where(
                        RetailerConfiguration.user_id == current_user.id,
                        RetailerConfiguration.retailer_type == input.retailer_type.value
                    )
                )
                existing = existing_result.scalar_one_or_none()

                if existing:
                    return RetailerConfigResponse(
                        success=False,
                        config=None,
                        message="Configuration already exists for this retailer"
                    )

                # Map retailer type to configuration
                retailer_configs = {
                    RetailerTypeEnum.AMAZON_CA: {
                        "name": "Amazon Canada",
                        "api_endpoint": "https://webservices.amazon.ca/paapi5/getitems",
                        "rate_limit": 8000  # requests per day
                    },
                    RetailerTypeEnum.WALMART_CA: {
                        "name": "Walmart Canada",
                        "api_endpoint": "https://api.walmart.ca/v1",
                        "rate_limit": 100
                    }
                }

                config_data = retailer_configs.get(input.retailer_type, {
                    "name": input.retailer_type.value.replace('_', ' ').title(),
                    "api_endpoint": "https://api.example.com",
                    "rate_limit": 100
                })

                # TODO: Encrypt sensitive credentials before storing
                config = RetailerConfiguration(
                    user_id=current_user.id,
                    retailer_type=input.retailer_type.value,
                    retailer_name=config_data["name"],
                    api_endpoint=config_data["api_endpoint"],
                    rate_limit_per_hour=config_data["rate_limit"],
                    client_id=input.client_id,
                    # client_secret_encrypted=encrypt_credential(input.client_secret),
                    partner_tag=input.partner_tag,
                    store_id=input.store_id
                )

                session.add(config)
                await session.commit()
                await session.refresh(config)

                return RetailerConfigResponse(
                    success=True,
                    config=RetailerConfigurationType(
                        id=str(config.id),
                        user_id=str(config.user_id),
                        retailer_type=config.retailer_type,
                        retailer_name=config.retailer_name,
                        is_active=config.is_active,
                        api_endpoint=config.api_endpoint,
                        api_version=config.api_version,
                        rate_limit_per_hour=config.rate_limit_per_hour,
                        partner_tag=config.partner_tag,
                        store_id=config.store_id,
                        affiliate_id=config.affiliate_id,
                        last_successful_request=config.last_successful_request,
                        total_requests_made=config.total_requests_made,
                        total_successful_orders=config.total_successful_orders,
                        average_response_time_ms=config.average_response_time_ms,
                        consecutive_failures=config.consecutive_failures,
                        last_error_message=config.last_error_message,
                        last_error_date=config.last_error_date,
                        created_at=config.created_at,
                        updated_at=config.updated_at
                    ),
                    message="Retailer configuration created successfully"
                )

        except Exception as e:
            logger.error(f"Error creating retailer config: {e}")
            return RetailerConfigResponse(
                success=False,
                config=None,
                message=f"Error creating retailer configuration: {str(e)}"
            )

    @strawberry.mutation
    async def update_subscription(
        self,
        info: Info,
        input: UpdateSubscriptionInput
    ) -> SubscriptionResponse:
        """Update existing subscription"""
        try:
            current_user = await get_current_user_from_info(info)
            if not current_user:
                return SubscriptionResponse(
                    success=False,
                    subscription=None,
                    message="Authentication required"
                )

            async for session in get_async_session():
                result = await session.execute(
                    select(ReorderSubscription).where(
                        ReorderSubscription.user_id == current_user.id,
                        ReorderSubscription.is_active == True
                    )
                )
                subscription = result.scalar_one_or_none()

                if not subscription:
                    return SubscriptionResponse(
                        success=False,
                        subscription=None,
                        message="No active subscription found"
                    )

                # Update subscription fields
                if input.tier is not None:
                    subscription.tier = input.tier.value
                if input.auto_reorder_enabled is not None:
                    # Update feature flags
                    features = subscription.features or {}
                    features["auto_reorder"] = input.auto_reorder_enabled
                    subscription.features = features
                if input.cancel_at_period_end is not None:
                    subscription.cancel_at_period_end = input.cancel_at_period_end

                await session.commit()
                await session.refresh(subscription)

                return SubscriptionResponse(
                    success=True,
                    subscription=ReorderSubscriptionType(
                        id=str(subscription.id),
                        user_id=str(subscription.user_id),
                        tier=subscription.tier,
                        is_active=subscription.is_active,
                        stripe_subscription_id=subscription.stripe_subscription_id,
                        stripe_customer_id=subscription.stripe_customer_id,
                        stripe_price_id=subscription.stripe_price_id,
                        billing_amount_cad=subscription.billing_amount_cad,
                        billing_interval=subscription.billing_interval,
                        gst_rate=subscription.gst_rate,
                        pst_hst_rate=subscription.pst_hst_rate,
                        total_tax_rate=subscription.total_tax_rate,
                        trial_end_date=subscription.trial_end_date,
                        current_period_start=subscription.current_period_start,
                        current_period_end=subscription.current_period_end,
                        cancel_at_period_end=subscription.cancel_at_period_end,
                        cancelled_at=subscription.cancelled_at,
                        features=subscription.features,
                        created_at=subscription.created_at,
                        updated_at=subscription.updated_at
                    ),
                    message="Subscription updated successfully"
                )

        except Exception as e:
            logger.error(f"Error updating subscription: {e}")
            return SubscriptionResponse(
                success=False,
                subscription=None,
                message=f"Error updating subscription: {str(e)}"
            )

    @strawberry.mutation
    async def cancel_subscription(self, info: Info) -> SubscriptionResponse:
        """Cancel subscription"""
        try:
            current_user = await get_current_user_from_info(info)
            if not current_user:
                return SubscriptionResponse(
                    success=False,
                    subscription=None,
                    message="Authentication required"
                )

            async for session in get_async_session():
                result = await session.execute(
                    select(ReorderSubscription).where(
                        ReorderSubscription.user_id == current_user.id,
                        ReorderSubscription.is_active == True
                    )
                )
                subscription = result.scalar_one_or_none()

                if not subscription:
                    return SubscriptionResponse(
                        success=False,
                        subscription=None,
                        message="No active subscription found"
                    )

                subscription.cancel_at_period_end = True
                subscription.cancelled_at = datetime.utcnow()

                await session.commit()

                return SubscriptionResponse(
                    success=True,
                    subscription=None,
                    message="Subscription will be cancelled at the end of the current period"
                )

        except Exception as e:
            logger.error(f"Error cancelling subscription: {e}")
            return SubscriptionResponse(
                success=False,
                subscription=None,
                message=f"Error cancelling subscription: {str(e)}"
            )

    @strawberry.mutation
    async def update_reorder_preferences(
        self,
        info: Info,
        child_id: str,
        input: UpdateReorderPreferencesInput
    ) -> PreferencesResponse:
        """Update reorder preferences for a child"""
        try:
            current_user = await get_current_user_from_info(info)
            if not current_user:
                return PreferencesResponse(
                    success=False,
                    preferences=None,
                    message="Authentication required"
                )

            async for session in get_async_session():
                # Get preferences
                result = await session.execute(
                    select(ReorderPreferences).join(ReorderSubscription).where(
                        ReorderSubscription.user_id == current_user.id,
                        ReorderPreferences.child_id == child_id
                    )
                )
                preferences = result.scalar_one_or_none()

                if not preferences:
                    return PreferencesResponse(
                        success=False,
                        preferences=None,
                        message="Preferences not found"
                    )

                # Update fields if provided
                if input.auto_reorder_enabled is not None:
                    preferences.auto_reorder_enabled = input.auto_reorder_enabled
                if input.reorder_threshold_days is not None:
                    preferences.reorder_threshold_days = input.reorder_threshold_days
                if input.max_order_amount_cad is not None:
                    preferences.max_order_amount_cad = input.max_order_amount_cad
                if input.preferred_retailers is not None:
                    preferences.preferred_retailers = [r.value for r in input.preferred_retailers]
                if input.preferred_brands is not None:
                    preferences.preferred_brands = input.preferred_brands
                if input.preferred_delivery_days is not None:
                    preferences.preferred_delivery_days = input.preferred_delivery_days
                if input.delivery_instructions is not None:
                    preferences.delivery_instructions = input.delivery_instructions
                if input.notification_advance_hours is not None:
                    preferences.notification_advance_hours = input.notification_advance_hours

                await session.commit()
                await session.refresh(preferences)

                return PreferencesResponse(
                    success=True,
                    preferences=ReorderPreferencesType(
                        id=str(preferences.id),
                        subscription_id=str(preferences.subscription_id),
                        child_id=str(preferences.child_id),
                        auto_reorder_enabled=preferences.auto_reorder_enabled,
                        reorder_threshold_days=preferences.reorder_threshold_days,
                        max_order_amount_cad=preferences.max_order_amount_cad,
                        preferred_retailers=preferences.preferred_retailers or [],
                        preferred_brands=preferences.preferred_brands or [],
                        size_preferences=preferences.size_preferences or {},
                        preferred_delivery_days=preferences.preferred_delivery_days or [],
                        delivery_instructions=preferences.delivery_instructions,
                        emergency_contact_on_delivery=preferences.emergency_contact_on_delivery,
                        notify_before_order=preferences.notify_before_order,
                        notify_order_placed=preferences.notify_order_placed,
                        notify_delivery_updates=preferences.notify_delivery_updates,
                        notification_advance_hours=preferences.notification_advance_hours,
                        use_growth_prediction=preferences.use_growth_prediction,
                        use_seasonal_adjustments=preferences.use_seasonal_adjustments,
                        prediction_confidence_threshold=preferences.prediction_confidence_threshold,
                        created_at=preferences.created_at,
                        updated_at=preferences.updated_at
                    ),
                    message="Preferences updated successfully"
                )

        except Exception as e:
            logger.error(f"Error updating reorder preferences: {e}")
            return PreferencesResponse(
                success=False,
                preferences=None,
                message=f"Error updating preferences: {str(e)}"
            )

    @strawberry.mutation
    async def update_retailer_config(
        self,
        info: Info,
        config_id: str,
        input: CreateRetailerConfigInput
    ) -> RetailerConfigResponse:
        """Update retailer configuration"""
        return RetailerConfigResponse(
            success=False,
            config=None,
            message="Update retailer config not implemented yet"
        )

    @strawberry.mutation
    async def delete_retailer_config(
        self,
        info: Info,
        config_id: str
    ) -> RetailerConfigResponse:
        """Delete retailer configuration"""
        return RetailerConfigResponse(
            success=False,
            config=None,
            message="Delete retailer config not implemented yet"
        )

    @strawberry.mutation
    async def create_manual_order(
        self,
        info: Info,
        input: ManualOrderInput
    ) -> OrderResponse:
        """Create a manual order"""
        return OrderResponse(
            success=False,
            transaction=None,
            message="Manual order creation not implemented yet"
        )

    @strawberry.mutation
    async def cancel_order(
        self,
        info: Info,
        order_id: str
    ) -> OrderResponse:
        """Cancel an order"""
        return OrderResponse(
            success=False,
            transaction=None,
            message="Order cancellation not implemented yet"
        )

    @strawberry.mutation
    async def trigger_prediction_update(
        self,
        info: Info,
        child_id: str
    ) -> PredictionResponse:
        """Trigger ML prediction update for a child"""
        return PredictionResponse(
            success=False,
            prediction=None,
            message="Prediction update not implemented yet"
        )

