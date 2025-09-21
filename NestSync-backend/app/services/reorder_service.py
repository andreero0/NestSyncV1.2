"""
Reorder Service for NestSync
Premium subscription-based automated reorder system with ML prediction pipeline
"""

import logging
import uuid
import json
from typing import Optional, Dict, Any, List, Tuple
from datetime import datetime, timezone, timedelta, date
from decimal import Decimal, ROUND_HALF_UP
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc, func, or_
from sqlalchemy.orm import selectinload

import stripe
import numpy as np
import pandas as pd
from prophet import Prophet
import joblib
import asyncio
from pathlib import Path

from app.models import (
    User, Child, InventoryItem, UsageLog,
    ReorderSubscription, ReorderPreferences, ConsumptionPrediction,
    RetailerConfiguration, ProductMapping, ReorderTransaction, OrderStatusUpdate,
    SubscriptionTier, OrderStatus, RetailerType, PaymentMethodType, PredictionConfidence
)
from app.config.settings import settings

logger = logging.getLogger(__name__)


class ReorderService:
    """
    Service class for premium reorder system with ML prediction pipeline
    Handles subscription management, consumption prediction, and automated ordering
    """

    def __init__(self, session: AsyncSession):
        self.session = session
        self.stripe_client = stripe
        self.stripe_client.api_key = settings.stripe_secret_key

        # Canadian tax rates by province
        self.canadian_tax_rates = {
            'AB': {'gst': Decimal('0.05'), 'pst_hst': Decimal('0.00')},  # Alberta
            'BC': {'gst': Decimal('0.05'), 'pst_hst': Decimal('0.07')},  # British Columbia
            'MB': {'gst': Decimal('0.05'), 'pst_hst': Decimal('0.07')},  # Manitoba
            'NB': {'gst': Decimal('0.00'), 'pst_hst': Decimal('0.15')},  # New Brunswick (HST)
            'NL': {'gst': Decimal('0.00'), 'pst_hst': Decimal('0.15')},  # Newfoundland and Labrador (HST)
            'NT': {'gst': Decimal('0.05'), 'pst_hst': Decimal('0.00')},  # Northwest Territories
            'NS': {'gst': Decimal('0.00'), 'pst_hst': Decimal('0.15')},  # Nova Scotia (HST)
            'NU': {'gst': Decimal('0.05'), 'pst_hst': Decimal('0.00')},  # Nunavut
            'ON': {'gst': Decimal('0.00'), 'pst_hst': Decimal('0.13')},  # Ontario (HST)
            'PE': {'gst': Decimal('0.00'), 'pst_hst': Decimal('0.15')},  # Prince Edward Island (HST)
            'QC': {'gst': Decimal('0.05'), 'pst_hst': Decimal('0.09975')},  # Quebec
            'SK': {'gst': Decimal('0.05'), 'pst_hst': Decimal('0.06')},  # Saskatchewan
            'YT': {'gst': Decimal('0.05'), 'pst_hst': Decimal('0.00')},  # Yukon
        }

        # ML models cache
        self.prediction_models = {}
        self.model_last_loaded = {}

    # =============================================================================
    # Subscription Management
    # =============================================================================

    async def create_subscription(
        self,
        user: User,
        tier: SubscriptionTier,
        stripe_payment_method_id: str,
        billing_address: Dict[str, Any],
        province_code: str
    ) -> Tuple[ReorderSubscription, Optional[str]]:
        """
        Create a premium subscription with Stripe integration and Canadian tax calculation
        """
        try:
            # Validate province code
            if province_code not in self.canadian_tax_rates:
                raise ValueError(f"Invalid Canadian province code: {province_code}")

            # Check if user already has a subscription
            existing_sub = await self.session.execute(
                select(ReorderSubscription).where(
                    and_(
                        ReorderSubscription.user_id == user.id,
                        ReorderSubscription.is_active == True
                    )
                )
            )
            if existing_sub.scalar_one_or_none():
                raise ValueError("User already has an active subscription")

            # Calculate pricing based on tier
            pricing = self._get_tier_pricing(tier)

            # Calculate Canadian taxes
            tax_rates = self.canadian_tax_rates[province_code]
            gst_rate = tax_rates['gst']
            pst_hst_rate = tax_rates['pst_hst']
            total_tax_rate = gst_rate + pst_hst_rate

            # Create Stripe customer if doesn't exist
            stripe_customer = None
            if user.stripe_customer_id:
                try:
                    stripe_customer = await self._get_stripe_customer(user.stripe_customer_id)
                except stripe.error.InvalidRequestError:
                    stripe_customer = None

            if not stripe_customer:
                stripe_customer = await self._create_stripe_customer(user, billing_address)
                user.stripe_customer_id = stripe_customer.id
                await self.session.commit()

            # Attach payment method to customer
            await self._attach_payment_method(stripe_payment_method_id, stripe_customer.id)

            # Create Stripe subscription
            stripe_subscription = await self._create_stripe_subscription(
                stripe_customer.id,
                pricing['stripe_price_id'],
                stripe_payment_method_id,
                total_tax_rate
            )

            # Create local subscription record
            subscription = ReorderSubscription(
                id=str(uuid.uuid4()),
                user_id=user.id,
                tier=tier,
                is_active=True,
                stripe_subscription_id=stripe_subscription.id,
                stripe_customer_id=stripe_customer.id,
                stripe_price_id=pricing['stripe_price_id'],
                billing_amount_cad=pricing['base_amount'],
                billing_interval=pricing['interval'],
                gst_rate=gst_rate,
                pst_hst_rate=pst_hst_rate,
                total_tax_rate=total_tax_rate,
                trial_end_date=None,  # No trial for now
                current_period_start=datetime.fromtimestamp(stripe_subscription.current_period_start, tz=timezone.utc),
                current_period_end=datetime.fromtimestamp(stripe_subscription.current_period_end, tz=timezone.utc),
                cancel_at_period_end=False,
                features=self._get_tier_features(tier),
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )

            self.session.add(subscription)
            await self.session.commit()

            logger.info(f"Created subscription {subscription.id} for user {user.id}")

            # Return client secret for payment confirmation if needed
            client_secret = None
            if stripe_subscription.latest_invoice:
                invoice = await self._get_stripe_invoice(stripe_subscription.latest_invoice)
                if invoice.payment_intent:
                    payment_intent = await self._get_stripe_payment_intent(invoice.payment_intent)
                    client_secret = payment_intent.client_secret

            return subscription, client_secret

        except Exception as e:
            logger.error(f"Error creating subscription: {e}")
            await self.session.rollback()
            raise

    async def update_subscription(
        self,
        user: User,
        tier: Optional[SubscriptionTier] = None,
        auto_reorder_enabled: Optional[bool] = None,
        cancel_at_period_end: Optional[bool] = None
    ) -> ReorderSubscription:
        """
        Update existing subscription settings
        """
        try:
            # Get existing subscription
            result = await self.session.execute(
                select(ReorderSubscription).where(
                    and_(
                        ReorderSubscription.user_id == user.id,
                        ReorderSubscription.is_active == True
                    )
                )
            )
            subscription = result.scalar_one_or_none()
            if not subscription:
                raise ValueError("No active subscription found")

            # Update tier if provided
            if tier and tier != subscription.tier:
                pricing = self._get_tier_pricing(tier)

                # Update Stripe subscription
                await self._update_stripe_subscription(
                    subscription.stripe_subscription_id,
                    pricing['stripe_price_id']
                )

                subscription.tier = tier
                subscription.stripe_price_id = pricing['stripe_price_id']
                subscription.billing_amount_cad = pricing['base_amount']
                subscription.billing_interval = pricing['interval']
                subscription.features = self._get_tier_features(tier)

            # Update cancellation setting
            if cancel_at_period_end is not None:
                await self._update_stripe_subscription_cancellation(
                    subscription.stripe_subscription_id,
                    cancel_at_period_end
                )
                subscription.cancel_at_period_end = cancel_at_period_end
                if cancel_at_period_end:
                    subscription.cancelled_at = datetime.now(timezone.utc)

            subscription.updated_at = datetime.now(timezone.utc)
            await self.session.commit()

            logger.info(f"Updated subscription {subscription.id}")
            return subscription

        except Exception as e:
            logger.error(f"Error updating subscription: {e}")
            await self.session.rollback()
            raise

    async def cancel_subscription(self, user: User) -> ReorderSubscription:
        """
        Cancel subscription immediately
        """
        try:
            # Get existing subscription
            result = await self.session.execute(
                select(ReorderSubscription).where(
                    and_(
                        ReorderSubscription.user_id == user.id,
                        ReorderSubscription.is_active == True
                    )
                )
            )
            subscription = result.scalar_one_or_none()
            if not subscription:
                raise ValueError("No active subscription found")

            # Cancel in Stripe
            await self._cancel_stripe_subscription(subscription.stripe_subscription_id)

            # Update local record
            subscription.is_active = False
            subscription.cancelled_at = datetime.now(timezone.utc)
            subscription.updated_at = datetime.now(timezone.utc)

            await self.session.commit()

            logger.info(f"Cancelled subscription {subscription.id}")
            return subscription

        except Exception as e:
            logger.error(f"Error cancelling subscription: {e}")
            await self.session.rollback()
            raise

    # =============================================================================
    # ML Prediction Pipeline
    # =============================================================================

    async def generate_consumption_prediction(
        self,
        child: Child,
        horizon_days: int = 30
    ) -> ConsumptionPrediction:
        """
        Generate ML-powered consumption prediction using Prophet time series forecasting
        """
        try:
            # Get historical usage data
            usage_data = await self._get_usage_history(child.id, days=90)
            if len(usage_data) < 14:  # Need at least 2 weeks of data
                raise ValueError("Insufficient usage data for prediction (minimum 14 days required)")

            # Prepare data for Prophet
            df = pd.DataFrame(usage_data)
            df['ds'] = pd.to_datetime(df['date'])
            df['y'] = df['daily_usage']

            # Add growth factors for age progression
            df = await self._add_growth_factors(df, child)

            # Add seasonal factors (holiday periods, etc.)
            df = await self._add_seasonal_factors(df)

            # Train Prophet model
            model = Prophet(
                growth='linear',
                seasonality_mode='multiplicative',
                yearly_seasonality=True,
                weekly_seasonality=True,
                daily_seasonality=False,
                changepoint_prior_scale=0.1,
                seasonality_prior_scale=10.0
            )

            # Add custom regressors for growth and seasonal adjustments
            model.add_regressor('growth_factor')
            model.add_regressor('seasonal_factor')

            model.fit(df)

            # Generate future predictions
            future = model.make_future_dataframe(periods=horizon_days)
            future['growth_factor'] = await self._calculate_future_growth_factors(child, horizon_days)
            future['seasonal_factor'] = await self._calculate_future_seasonal_factors(horizon_days)

            forecast = model.predict(future)

            # Calculate prediction metrics
            current_rate = df['y'].tail(7).mean()  # Last week average
            predicted_30d = max(1, int(forecast['yhat'].tail(horizon_days).sum()))
            predicted_runout = await self._calculate_runout_date(child, current_rate)
            recommended_reorder = predicted_runout - timedelta(days=7)  # Reorder 1 week before runout

            # Calculate model performance metrics
            mae, r2 = await self._calculate_model_performance(model, df)

            # Determine confidence level
            confidence = await self._determine_confidence_level(mae, r2, len(usage_data))

            # Check for size change probability
            size_change_prob, predicted_size, size_change_date = await self._predict_size_change(child, current_rate)

            # Create prediction record
            prediction = ConsumptionPrediction(
                id=str(uuid.uuid4()),
                child_id=child.id,
                model_version="prophet_v1.0",
                prediction_date=datetime.now(timezone.utc),
                prediction_horizon_days=horizon_days,
                confidence_level=confidence,
                mean_absolute_error=Decimal(str(round(mae, 4))),
                r_squared_score=Decimal(str(round(r2, 4))),
                current_consumption_rate=Decimal(str(round(current_rate, 2))),
                predicted_consumption_30d=predicted_30d,
                predicted_runout_date=predicted_runout,
                recommended_reorder_date=recommended_reorder,
                size_change_probability=Decimal(str(round(size_change_prob, 4))) if size_change_prob else None,
                predicted_new_size=predicted_size,
                size_change_estimated_date=size_change_date,
                growth_adjustment_factor=Decimal('1.0'),  # Will be calculated based on age
                seasonal_adjustment_factor=Decimal('1.0'),  # Will be calculated based on time of year
                feature_importance=json.dumps({
                    'historical_usage': 0.6,
                    'growth_factor': 0.2,
                    'seasonal_factor': 0.1,
                    'day_of_week': 0.1
                }),
                training_data_points=len(usage_data),
                training_period_days=(df['ds'].max() - df['ds'].min()).days,
                last_usage_date=df['ds'].max().date(),
                created_at=datetime.now(timezone.utc)
            )

            self.session.add(prediction)
            await self.session.commit()

            # Cache the model for future use
            model_cache_key = f"child_{child.id}_prophet"
            self.prediction_models[model_cache_key] = model
            self.model_last_loaded[model_cache_key] = datetime.now(timezone.utc)

            logger.info(f"Generated prediction {prediction.id} for child {child.id}")
            return prediction

        except Exception as e:
            logger.error(f"Error generating prediction for child {child.id}: {e}")
            await self.session.rollback()
            raise

    async def update_predictions_for_user(self, user: User) -> List[ConsumptionPrediction]:
        """
        Update predictions for all children of a user
        """
        predictions = []

        # Get user's children
        result = await self.session.execute(
            select(Child).where(Child.parent_id == user.id)
        )
        children = result.scalars().all()

        for child in children:
            try:
                prediction = await self.generate_consumption_prediction(child)
                predictions.append(prediction)
            except Exception as e:
                logger.warning(f"Failed to update prediction for child {child.id}: {e}")
                continue

        return predictions

    # =============================================================================
    # Retailer Configuration Management
    # =============================================================================

    async def create_retailer_configuration(
        self,
        user: User,
        retailer_type: RetailerType,
        client_id: str,
        client_secret: str,
        partner_tag: Optional[str] = None,
        store_id: Optional[str] = None
    ) -> RetailerConfiguration:
        """
        Create retailer API configuration with OAuth credentials
        """
        try:
            # Validate retailer configuration doesn't already exist
            existing_config = await self.session.execute(
                select(RetailerConfiguration).where(
                    and_(
                        RetailerConfiguration.user_id == user.id,
                        RetailerConfiguration.retailer_type == retailer_type,
                        RetailerConfiguration.is_active == True
                    )
                )
            )
            if existing_config.scalar_one_or_none():
                raise ValueError(f"Active configuration for {retailer_type} already exists")

            # Get retailer settings
            retailer_settings = self._get_retailer_settings(retailer_type)

            # Test API connection
            is_valid = await self._test_retailer_connection(
                retailer_type, client_id, client_secret, retailer_settings
            )

            config = RetailerConfiguration(
                id=str(uuid.uuid4()),
                user_id=user.id,
                retailer_type=retailer_type,
                retailer_name=retailer_settings['name'],
                is_active=is_valid,
                api_endpoint=retailer_settings['api_endpoint'],
                api_version=retailer_settings.get('api_version'),
                rate_limit_per_hour=retailer_settings['rate_limit'],
                partner_tag=partner_tag,
                store_id=store_id,
                affiliate_id=retailer_settings.get('default_affiliate_id'),
                last_successful_request=datetime.now(timezone.utc) if is_valid else None,
                total_requests_made=0,
                total_successful_orders=0,
                average_response_time_ms=None,
                consecutive_failures=0 if is_valid else 1,
                last_error_message=None if is_valid else "Initial connection test failed",
                last_error_date=None if is_valid else datetime.now(timezone.utc),
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )

            self.session.add(config)
            await self.session.commit()

            logger.info(f"Created retailer configuration {config.id} for {retailer_type}")
            return config

        except Exception as e:
            logger.error(f"Error creating retailer configuration: {e}")
            await self.session.rollback()
            raise

    # =============================================================================
    # Order Management
    # =============================================================================

    async def create_manual_order(
        self,
        user: User,
        child_id: str,
        retailer_type: RetailerType,
        products: List[Dict[str, Any]],
        delivery_address: Dict[str, Any],
        payment_method_id: str
    ) -> ReorderTransaction:
        """
        Create a manual order through retailer API
        """
        try:
            # Validate child belongs to user
            child = await self._get_user_child(user.id, child_id)
            if not child:
                raise ValueError("Child not found or doesn't belong to user")

            # Get retailer configuration
            config = await self._get_retailer_config(user.id, retailer_type)
            if not config:
                raise ValueError(f"No retailer configuration found for {retailer_type}")

            # Calculate order totals
            subtotal = sum(Decimal(str(p['price'])) * p['quantity'] for p in products)
            shipping_cost = await self._calculate_shipping_cost(retailer_type, subtotal, delivery_address)
            tax_amount = await self._calculate_order_taxes(subtotal, delivery_address['province'])
            total_amount = subtotal + shipping_cost + tax_amount

            # Create order record
            order = ReorderTransaction(
                id=str(uuid.uuid4()),
                subscription_id=None,  # Manual order
                child_id=child_id,
                order_number=f"MANUAL-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}",
                retailer_order_id=None,  # Will be set after API call
                retailer_type=retailer_type,
                status=OrderStatus.PENDING,
                order_type="manual",
                products=json.dumps(products),
                total_items=sum(p['quantity'] for p in products),
                subtotal_cad=subtotal,
                shipping_cost_cad=shipping_cost,
                tax_amount_cad=tax_amount,
                total_amount_cad=total_amount,
                stripe_payment_intent_id=None,  # Will be set after payment
                payment_method_type=PaymentMethodType.STRIPE_PAYMENT_METHOD,
                payment_authorized_at=None,
                payment_captured_at=None,
                delivery_address=json.dumps(delivery_address),
                estimated_delivery_date=None,
                actual_delivery_date=None,
                tracking_number=None,
                tracking_url=None,
                prediction_id=None,
                predicted_runout_date=None,
                days_until_runout=None,
                failure_reason=None,
                retry_count=0,
                last_retry_at=None,
                ordered_at=datetime.now(timezone.utc),
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )

            self.session.add(order)
            await self.session.commit()

            # Process payment
            payment_intent = await self._process_payment(
                total_amount, payment_method_id, order.order_number
            )

            order.stripe_payment_intent_id = payment_intent.id
            order.payment_authorized_at = datetime.now(timezone.utc)

            # Submit order to retailer
            try:
                retailer_order = await self._submit_order_to_retailer(
                    config, products, delivery_address, order.order_number
                )

                order.retailer_order_id = retailer_order['order_id']
                order.status = OrderStatus.CONFIRMED
                order.confirmed_at = datetime.now(timezone.utc)
                order.estimated_delivery_date = retailer_order.get('estimated_delivery')
                order.tracking_number = retailer_order.get('tracking_number')
                order.tracking_url = retailer_order.get('tracking_url')

                # Capture payment
                await self._capture_payment(payment_intent.id)
                order.payment_captured_at = datetime.now(timezone.utc)

            except Exception as e:
                # Order failed, refund payment
                await self._refund_payment(payment_intent.id)
                order.status = OrderStatus.FAILED
                order.failure_reason = str(e)

            order.updated_at = datetime.now(timezone.utc)
            await self.session.commit()

            logger.info(f"Created manual order {order.id}")
            return order

        except Exception as e:
            logger.error(f"Error creating manual order: {e}")
            await self.session.rollback()
            raise

    # =============================================================================
    # Helper Methods
    # =============================================================================

    def _get_tier_pricing(self, tier: SubscriptionTier) -> Dict[str, Any]:
        """Get pricing configuration for subscription tier"""
        pricing_config = {
            SubscriptionTier.BASIC: {
                'base_amount': Decimal('19.99'),
                'stripe_price_id': settings.stripe_basic_price_id,
                'interval': 'month'
            },
            SubscriptionTier.PREMIUM: {
                'base_amount': Decimal('29.99'),
                'stripe_price_id': settings.stripe_premium_price_id,
                'interval': 'month'
            },
            SubscriptionTier.FAMILY: {
                'base_amount': Decimal('34.99'),
                'stripe_price_id': settings.stripe_family_price_id,
                'interval': 'month'
            }
        }
        return pricing_config[tier]

    def _get_tier_features(self, tier: SubscriptionTier) -> Dict[str, Any]:
        """Get feature configuration for subscription tier"""
        features = {
            SubscriptionTier.BASIC: {
                'auto_reorder': True,
                'max_children': 1,
                'ml_predictions': True,
                'price_comparison': False,
                'bulk_discounts': False,
                'priority_support': False
            },
            SubscriptionTier.PREMIUM: {
                'auto_reorder': True,
                'max_children': 3,
                'ml_predictions': True,
                'price_comparison': True,
                'bulk_discounts': True,
                'priority_support': False
            },
            SubscriptionTier.FAMILY: {
                'auto_reorder': True,
                'max_children': 10,
                'ml_predictions': True,
                'price_comparison': True,
                'bulk_discounts': True,
                'priority_support': True
            }
        }
        return features[tier]

    async def _get_usage_history(self, child_id: str, days: int = 90) -> List[Dict[str, Any]]:
        """Get usage history for ML training"""
        end_date = datetime.now(timezone.utc).date()
        start_date = end_date - timedelta(days=days)

        result = await self.session.execute(
            select(
                func.date(UsageLog.timestamp).label('date'),
                func.count(UsageLog.id).label('daily_usage')
            )
            .where(
                and_(
                    UsageLog.child_id == child_id,
                    func.date(UsageLog.timestamp) >= start_date,
                    func.date(UsageLog.timestamp) <= end_date
                )
            )
            .group_by(func.date(UsageLog.timestamp))
            .order_by(func.date(UsageLog.timestamp))
        )

        return [{'date': row.date, 'daily_usage': row.daily_usage} for row in result]

    async def _add_growth_factors(self, df: pd.DataFrame, child: Child) -> pd.DataFrame:
        """Add growth factors based on child's age progression"""
        # Calculate age in months for each data point
        birth_date = pd.to_datetime(child.date_of_birth)
        df['age_months'] = ((df['ds'] - birth_date).dt.days / 30.44).round(1)

        # Growth factor increases consumption slightly over time
        df['growth_factor'] = 1.0 + (df['age_months'] * 0.002)  # 0.2% increase per month

        return df

    async def _add_seasonal_factors(self, df: pd.DataFrame) -> pd.DataFrame:
        """Add seasonal adjustment factors"""
        # Higher usage during holiday periods and summer months
        df['month'] = df['ds'].dt.month
        seasonal_multipliers = {
            1: 1.1,   # January - New Year
            2: 1.0,   # February
            3: 1.0,   # March
            4: 1.0,   # April
            5: 1.0,   # May
            6: 1.05,  # June - Summer begins
            7: 1.1,   # July - Summer vacation
            8: 1.1,   # August - Summer vacation
            9: 1.0,   # September
            10: 1.0,  # October
            11: 1.05, # November - Thanksgiving
            12: 1.15  # December - Christmas/holidays
        }

        df['seasonal_factor'] = df['month'].map(seasonal_multipliers)
        return df

    async def _calculate_future_growth_factors(self, child: Child, horizon_days: int) -> List[float]:
        """Calculate growth factors for future predictions"""
        current_age_months = ((datetime.now().date() - child.date_of_birth).days / 30.44)

        factors = []
        for day in range(horizon_days):
            future_age_months = current_age_months + (day / 30.44)
            growth_factor = 1.0 + (future_age_months * 0.002)
            factors.append(growth_factor)

        return factors

    async def _calculate_future_seasonal_factors(self, horizon_days: int) -> List[float]:
        """Calculate seasonal factors for future predictions"""
        factors = []
        for day in range(horizon_days):
            future_date = datetime.now() + timedelta(days=day)
            month = future_date.month

            seasonal_multipliers = {
                1: 1.1, 2: 1.0, 3: 1.0, 4: 1.0, 5: 1.0, 6: 1.05,
                7: 1.1, 8: 1.1, 9: 1.0, 10: 1.0, 11: 1.05, 12: 1.15
            }

            factors.append(seasonal_multipliers[month])

        return factors

    async def _calculate_runout_date(self, child: Child, current_rate: float) -> datetime:
        """Calculate when current inventory will run out"""
        # Get current inventory
        result = await self.session.execute(
            select(InventoryItem.current_stock)
            .where(InventoryItem.child_id == child.id)
            .order_by(desc(InventoryItem.created_at))
            .limit(1)
        )

        current_stock = result.scalar_one_or_none() or 0
        days_remaining = max(1, int(current_stock / max(current_rate, 1)))

        return datetime.now(timezone.utc) + timedelta(days=days_remaining)

    async def _calculate_model_performance(self, model: Prophet, df: pd.DataFrame) -> Tuple[float, float]:
        """Calculate model performance metrics"""
        # Use cross-validation for more robust metrics
        if len(df) < 21:  # Need sufficient data for CV
            return 0.5, 0.5  # Conservative estimates

        # Simple train/test split for performance calculation
        train_size = int(len(df) * 0.8)
        train_df = df[:train_size]
        test_df = df[train_size:]

        # Retrain on training data
        model_test = Prophet(growth='linear', seasonality_mode='multiplicative')
        model_test.add_regressor('growth_factor')
        model_test.add_regressor('seasonal_factor')
        model_test.fit(train_df)

        # Predict on test data
        test_forecast = model_test.predict(test_df)

        # Calculate metrics
        mae = np.mean(np.abs(test_df['y'] - test_forecast['yhat']))
        r2 = 1 - (np.sum((test_df['y'] - test_forecast['yhat']) ** 2) /
                  np.sum((test_df['y'] - np.mean(test_df['y'])) ** 2))

        return float(mae), float(max(0, r2))

    async def _determine_confidence_level(self, mae: float, r2: float, data_points: int) -> PredictionConfidence:
        """Determine prediction confidence based on model performance"""
        if data_points < 14:
            return PredictionConfidence.VERY_LOW
        elif data_points < 30:
            if r2 > 0.7 and mae < 2:
                return PredictionConfidence.MEDIUM
            else:
                return PredictionConfidence.LOW
        else:
            if r2 > 0.8 and mae < 1.5:
                return PredictionConfidence.VERY_HIGH
            elif r2 > 0.7 and mae < 2:
                return PredictionConfidence.HIGH
            elif r2 > 0.5 and mae < 3:
                return PredictionConfidence.MEDIUM
            else:
                return PredictionConfidence.LOW

    async def _predict_size_change(self, child: Child, current_rate: float) -> Tuple[Optional[float], Optional[str], Optional[datetime]]:
        """Predict if child will need size change soon"""
        # Simple heuristic based on age and current usage rate
        age_months = ((datetime.now().date() - child.date_of_birth).days / 30.44)

        # Size change more likely for younger children
        if age_months < 6:
            probability = 0.3
            days_to_change = 30
        elif age_months < 12:
            probability = 0.2
            days_to_change = 45
        elif age_months < 24:
            probability = 0.1
            days_to_change = 60
        else:
            probability = 0.05
            days_to_change = 90

        # Increase probability if usage rate is very high (growth spurt)
        if current_rate > 8:  # More than 8 diapers per day
            probability *= 1.5
            days_to_change = int(days_to_change * 0.7)

        if probability > 0.1:  # Only return if probability is significant
            # Predict next size based on current size
            current_size = child.current_diaper_size
            next_size = self._get_next_diaper_size(current_size)
            change_date = datetime.now(timezone.utc) + timedelta(days=days_to_change)

            return probability, next_size, change_date

        return None, None, None

    def _get_next_diaper_size(self, current_size: str) -> str:
        """Get the next diaper size in progression"""
        size_progression = ['Newborn', 'Size 1', 'Size 2', 'Size 3', 'Size 4', 'Size 5', 'Size 6']

        try:
            current_index = size_progression.index(current_size)
            if current_index < len(size_progression) - 1:
                return size_progression[current_index + 1]
        except ValueError:
            pass

        return current_size  # Stay at current size if not found or at max

    # Stripe helper methods
    async def _create_stripe_customer(self, user: User, billing_address: Dict[str, Any]) -> stripe.Customer:
        """Create Stripe customer"""
        return await asyncio.get_event_loop().run_in_executor(
            None,
            stripe.Customer.create,
            {
                'email': user.email,
                'name': f"{user.first_name} {user.last_name}",
                'address': billing_address,
                'metadata': {
                    'nestsync_user_id': user.id,
                    'country': 'CA'
                }
            }
        )

    async def _get_stripe_customer(self, customer_id: str) -> stripe.Customer:
        """Get Stripe customer"""
        return await asyncio.get_event_loop().run_in_executor(
            None,
            stripe.Customer.retrieve,
            customer_id
        )

    async def _attach_payment_method(self, payment_method_id: str, customer_id: str):
        """Attach payment method to customer"""
        return await asyncio.get_event_loop().run_in_executor(
            None,
            stripe.PaymentMethod.attach,
            payment_method_id,
            {'customer': customer_id}
        )

    async def _create_stripe_subscription(
        self,
        customer_id: str,
        price_id: str,
        payment_method_id: str,
        tax_rate: Decimal
    ) -> stripe.Subscription:
        """Create Stripe subscription"""
        return await asyncio.get_event_loop().run_in_executor(
            None,
            stripe.Subscription.create,
            {
                'customer': customer_id,
                'items': [{'price': price_id}],
                'default_payment_method': payment_method_id,
                'default_tax_rates': [await self._get_or_create_tax_rate(tax_rate)],
                'expand': ['latest_invoice.payment_intent']
            }
        )

    async def _get_or_create_tax_rate(self, rate: Decimal) -> str:
        """Get or create Stripe tax rate for Canadian taxes"""
        rate_percentage = float(rate * 100)

        # Try to find existing rate
        tax_rates = await asyncio.get_event_loop().run_in_executor(
            None,
            stripe.TaxRate.list,
            {'limit': 100}
        )

        for tax_rate in tax_rates.data:
            if abs(tax_rate.percentage - rate_percentage) < 0.01:
                return tax_rate.id

        # Create new rate
        tax_rate = await asyncio.get_event_loop().run_in_executor(
            None,
            stripe.TaxRate.create,
            {
                'display_name': f'Canadian Tax ({rate_percentage}%)',
                'percentage': rate_percentage,
                'inclusive': False,
                'jurisdiction': 'CA'
            }
        )

        return tax_rate.id

    def _get_retailer_settings(self, retailer_type: RetailerType) -> Dict[str, Any]:
        """Get retailer API configuration"""
        settings_map = {
            RetailerType.AMAZON_CA: {
                'name': 'Amazon Canada',
                'api_endpoint': 'https://webservices.amazon.ca/paapi5/searchitems',
                'api_version': '5.0',
                'rate_limit': 1000,
                'default_affiliate_id': settings.amazon_ca_affiliate_id
            },
            RetailerType.WALMART_CA: {
                'name': 'Walmart Canada',
                'api_endpoint': 'https://api.walmart.ca/v1',
                'api_version': '1.0',
                'rate_limit': 5000
            },
            # Add other retailers as needed
        }

        return settings_map.get(retailer_type, {})

    async def _test_retailer_connection(
        self,
        retailer_type: RetailerType,
        client_id: str,
        client_secret: str,
        settings: Dict[str, Any]
    ) -> bool:
        """Test retailer API connection"""
        # Implement retailer-specific connection tests
        # For now, return True as placeholder
        return True

    async def _get_user_child(self, user_id: str, child_id: str) -> Optional[Child]:
        """Get child that belongs to user"""
        result = await self.session.execute(
            select(Child).where(
                and_(
                    Child.id == child_id,
                    Child.parent_id == user_id
                )
            )
        )
        return result.scalar_one_or_none()

    async def _get_retailer_config(self, user_id: str, retailer_type: RetailerType) -> Optional[RetailerConfiguration]:
        """Get active retailer configuration"""
        result = await self.session.execute(
            select(RetailerConfiguration).where(
                and_(
                    RetailerConfiguration.user_id == user_id,
                    RetailerConfiguration.retailer_type == retailer_type,
                    RetailerConfiguration.is_active == True
                )
            )
        )
        return result.scalar_one_or_none()

    async def _calculate_shipping_cost(
        self,
        retailer_type: RetailerType,
        subtotal: Decimal,
        delivery_address: Dict[str, Any]
    ) -> Decimal:
        """Calculate shipping cost based on retailer and order"""
        # Placeholder implementation
        if subtotal >= Decimal('35.00'):  # Free shipping threshold
            return Decimal('0.00')
        else:
            return Decimal('9.99')

    async def _calculate_order_taxes(self, subtotal: Decimal, province: str) -> Decimal:
        """Calculate Canadian taxes for order"""
        if province not in self.canadian_tax_rates:
            province = 'ON'  # Default to Ontario

        tax_rates = self.canadian_tax_rates[province]
        total_rate = tax_rates['gst'] + tax_rates['pst_hst']

        return (subtotal * total_rate).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

    async def _process_payment(self, amount: Decimal, payment_method_id: str, order_number: str) -> stripe.PaymentIntent:
        """Process payment through Stripe"""
        return await asyncio.get_event_loop().run_in_executor(
            None,
            stripe.PaymentIntent.create,
            {
                'amount': int(amount * 100),  # Convert to cents
                'currency': 'cad',
                'payment_method': payment_method_id,
                'confirmation_method': 'manual',
                'confirm': True,
                'metadata': {
                    'order_number': order_number,
                    'source': 'nestsync_reorder'
                }
            }
        )

    async def _capture_payment(self, payment_intent_id: str):
        """Capture payment intent"""
        return await asyncio.get_event_loop().run_in_executor(
            None,
            stripe.PaymentIntent.capture,
            payment_intent_id
        )

    async def _refund_payment(self, payment_intent_id: str):
        """Refund payment intent"""
        return await asyncio.get_event_loop().run_in_executor(
            None,
            stripe.Refund.create,
            {'payment_intent': payment_intent_id}
        )

    async def _submit_order_to_retailer(
        self,
        config: RetailerConfiguration,
        products: List[Dict[str, Any]],
        delivery_address: Dict[str, Any],
        order_number: str
    ) -> Dict[str, Any]:
        """Submit order to retailer API"""
        # Placeholder implementation - would integrate with actual retailer APIs
        return {
            'order_id': f"{config.retailer_type.value.upper()}-{order_number}",
            'estimated_delivery': datetime.now(timezone.utc) + timedelta(days=3),
            'tracking_number': f"TRK{order_number[-8:]}",
            'tracking_url': f"https://tracking.{config.retailer_type.value}.ca/track/{order_number}"
        }

    # Additional Stripe helper methods
    async def _update_stripe_subscription(self, subscription_id: str, new_price_id: str):
        """Update Stripe subscription price"""
        subscription = await asyncio.get_event_loop().run_in_executor(
            None,
            stripe.Subscription.retrieve,
            subscription_id
        )

        return await asyncio.get_event_loop().run_in_executor(
            None,
            stripe.Subscription.modify,
            subscription_id,
            {
                'items': [{
                    'id': subscription['items']['data'][0]['id'],
                    'price': new_price_id,
                }]
            }
        )

    async def _update_stripe_subscription_cancellation(self, subscription_id: str, cancel_at_period_end: bool):
        """Update subscription cancellation setting"""
        return await asyncio.get_event_loop().run_in_executor(
            None,
            stripe.Subscription.modify,
            subscription_id,
            {'cancel_at_period_end': cancel_at_period_end}
        )

    async def _cancel_stripe_subscription(self, subscription_id: str):
        """Cancel Stripe subscription immediately"""
        return await asyncio.get_event_loop().run_in_executor(
            None,
            stripe.Subscription.delete,
            subscription_id
        )

    async def _get_stripe_invoice(self, invoice_id: str) -> stripe.Invoice:
        """Get Stripe invoice"""
        return await asyncio.get_event_loop().run_in_executor(
            None,
            stripe.Invoice.retrieve,
            invoice_id
        )

    async def _get_stripe_payment_intent(self, payment_intent_id: str) -> stripe.PaymentIntent:
        """Get Stripe payment intent"""
        return await asyncio.get_event_loop().run_in_executor(
            None,
            stripe.PaymentIntent.retrieve,
            payment_intent_id
        )