"""
GraphQL Premium Subscription Resolvers
PIPEDA-compliant Canadian subscription management

Implements resolvers for T026-T034:
- Subscription plan queries
- Trial activation and tracking
- Payment method management
"""

import logging
import uuid
from typing import Optional, List
from datetime import datetime, timedelta, timezone
from decimal import Decimal

import strawberry
from strawberry.types import Info
from sqlalchemy import select, and_, or_, func, desc
from sqlalchemy.orm import selectinload

from app.config.database import get_async_session
from app.config.stripe import get_stripe_config
from app.services.tax_service import CanadianTaxService
from app.models.premium_subscription import (
    SubscriptionPlan as SubscriptionPlanModel,
    Subscription as SubscriptionModel,
    PaymentMethod as PaymentMethodModel,
    TrialProgress as TrialProgressModel,
    TrialUsageEvent as TrialUsageEventModel,
    FeatureAccess as FeatureAccessModel,
    BillingHistory as BillingHistoryModel,
    SubscriptionTier,
    SubscriptionStatus,
    FeatureAccessSource,
    TransactionType,
    TransactionStatus,
)
from app.graphql.subscription_types import (
    # Response types
    PremiumMutationResponse,
    AvailablePlansResponse,
    TrialStartResponse,
    PaymentMethodResponse,
    PremiumSubscriptionResponse,
    RefundResponse,
    CancellationPreview,
    BillingHistoryResponse,
    InvoiceDownloadResponse,
    FeatureAccessResponse,
    TaxCalculationResponse,
    CanadianTaxRateType,
    ComplianceReportResponse,
    SubscriptionComplianceData,
    PaymentMethodComplianceData,
    ConsentRecords,

    # Data types
    PremiumSubscriptionPlan,
    PremiumSubscription,
    PaymentMethod,
    TrialProgress,
    FeatureLimits,
    BillingRecord,
    PremiumTaxBreakdown,
    FeatureAccessRecord,

    # Input types
    StartTrialInput,
    AddPaymentMethodInput,
    TrackTrialEventInput,
    SubscribeInput,
    ChangeSubscriptionPlanInput,
    CancelSubscriptionInput,
    RequestRefundInput,

    # Enums
    SubscriptionTier as SubscriptionTierEnum,
    PremiumSubscriptionStatus as PremiumSubscriptionStatusEnum,
    BillingInterval,
    PaymentMethodType,
    CardBrand,
    CanadianProvince,
    TrialEventType,
    TransactionStatus,
    TaxType,
)

logger = logging.getLogger(__name__)


# =============================================================================
# Helper Functions
# =============================================================================

def safe_enum_lookup(enum_class, value, default, field_name="value"):
    """
    Safely convert a value to an enum member with fallback to default.

    Args:
        enum_class: The enum class to lookup in
        value: The value to convert (string or enum member)
        default: Default enum member to return if lookup fails
        field_name: Name of the field being converted (for logging)

    Returns:
        Enum member from enum_class
    """
    try:
        # If already an enum member, return it
        if isinstance(value, enum_class):
            return value

        # Try lookup by name (for string keys)
        if isinstance(value, str):
            # Try direct lookup first
            try:
                return enum_class[value.upper()]
            except KeyError:
                # Try by value
                return enum_class(value)

        # Try direct value conversion
        return enum_class(value)

    except (KeyError, ValueError) as e:
        logger.warning(
            f"Invalid {enum_class.__name__} {field_name}: '{value}' - "
            f"using default '{default.name}'. Error: {e}"
        )
        return default

def model_to_feature_limits(limits_json: dict) -> FeatureLimits:
    """Convert database JSON to FeatureLimits GraphQL type"""
    return FeatureLimits(
        family_members=limits_json.get("family_members", 0),
        reorder_suggestions=limits_json.get("reorder_suggestions", 0),
        price_alerts=limits_json.get("price_alerts", False),
        automation=limits_json.get("automation", False),
    )


def model_to_subscription_plan(plan: SubscriptionPlanModel) -> PremiumSubscriptionPlan:
    """Convert database model to GraphQL PremiumSubscriptionPlan type"""
    return PremiumSubscriptionPlan(
        id=plan.id,
        name=plan.name,
        display_name=plan.display_name,
        tier=safe_enum_lookup(SubscriptionTierEnum, plan.tier, SubscriptionTierEnum.STANDARD, "plan.tier"),
        price=float(plan.price),
        billing_interval=safe_enum_lookup(BillingInterval, plan.billing_interval, BillingInterval.MONTHLY, "plan.billing_interval"),
        features=plan.features,
        limits=model_to_feature_limits(plan.limits),
        description=plan.description,
        sort_order=plan.sort_order,
        is_active=plan.is_active,
        stripe_price_id=plan.stripe_price_id,
        stripe_product_id=plan.stripe_product_id,
        created_at=plan.created_at,
        updated_at=plan.updated_at,
    )


def model_to_subscription(sub: SubscriptionModel, plan: SubscriptionPlanModel) -> PremiumSubscription:
    """Convert database model to GraphQL PremiumSubscription type"""
    return PremiumSubscription(
        id=str(sub.id),
        user_id=str(sub.user_id),
        plan=model_to_subscription_plan(plan),
        tier=safe_enum_lookup(SubscriptionTierEnum, sub.tier, SubscriptionTierEnum.STANDARD, "subscription.tier"),
        status=safe_enum_lookup(PremiumSubscriptionStatusEnum, sub.status, PremiumSubscriptionStatusEnum.ACTIVE, "subscription.status"),
        billing_interval=safe_enum_lookup(BillingInterval, sub.billing_interval, BillingInterval.MONTHLY, "subscription.billing_interval"),
        amount=float(sub.amount),
        currency=sub.currency,
        province=safe_enum_lookup(CanadianProvince, sub.province, CanadianProvince.BC, "subscription.province"),
        stripe_customer_id=sub.stripe_customer_id,
        stripe_subscription_id=sub.stripe_subscription_id,
        trial_start=sub.trial_start,
        trial_end=sub.trial_end,
        cooling_off_end=sub.cooling_off_end,
        payment_consent_at=sub.payment_consent_at,
        is_on_trial=sub.is_on_trial(),
        is_in_cooling_off_period=sub.is_in_cooling_off_period(),
        created_at=sub.created_at,
        updated_at=sub.updated_at,
    )


def model_to_trial_progress(progress: TrialProgressModel) -> TrialProgress:
    """Convert database model to GraphQL TrialProgress type"""
    return TrialProgress(
        id=str(progress.id),
        user_id=str(progress.user_id),
        is_active=progress.is_active,
        trial_tier=safe_enum_lookup(SubscriptionTierEnum, progress.trial_tier, SubscriptionTierEnum.STANDARD, "trial_progress.trial_tier"),
        trial_started_at=progress.trial_started_at,
        trial_ends_at=progress.trial_ends_at,
        days_remaining=progress.days_remaining,
        converted_to_paid=progress.converted_to_paid,
        converted_at=progress.converted_at,
        canceled=progress.canceled,
        features_used_count=progress.features_used_count,
        usage_days=progress.usage_days,
        value_saved_estimate=float(progress.value_saved_estimate) if progress.value_saved_estimate else None,
        engagement_score=progress.engagement_score,
        created_at=progress.created_at,
        updated_at=progress.updated_at,
    )


def model_to_payment_method(pm: PaymentMethodModel) -> PaymentMethod:
    """Convert database model to GraphQL PaymentMethod type"""
    return PaymentMethod(
        id=str(pm.id),
        user_id=str(pm.user_id),
        type=PaymentMethodType[pm.type.upper()],
        card_brand=CardBrand[pm.card_brand.upper()] if pm.card_brand else None,
        card_last4=pm.card_last4,
        card_exp_month=pm.card_exp_month,
        card_exp_year=pm.card_exp_year,
        is_default=pm.is_default,
        is_active=pm.is_active,
        created_at=pm.created_at,
        updated_at=pm.updated_at,
    )


def model_to_billing_record(billing: BillingHistoryModel) -> BillingRecord:
    """Convert database model to GraphQL BillingRecord type"""
    # Create tax breakdown
    tax_breakdown = PremiumTaxBreakdown(
        gst=float(billing.gst_amount) if billing.gst_amount else None,
        pst=float(billing.pst_amount) if billing.pst_amount else None,
        hst=float(billing.hst_amount) if billing.hst_amount else None,
        qst=float(billing.qst_amount) if billing.qst_amount else None,
    )

    return BillingRecord(
        id=str(billing.id),
        user_id=str(billing.user_id),
        subscription_id=str(billing.subscription_id) if billing.subscription_id else None,
        transaction_type=TransactionType[billing.transaction_type.upper()],
        description=billing.description,
        subtotal=float(billing.subtotal),
        tax_amount=float(billing.tax_amount),
        total_amount=float(billing.total_amount),
        currency=billing.currency,
        province=CanadianProvince[billing.province] if billing.province else None,
        tax_breakdown=tax_breakdown,
        tax_rate=float(billing.tax_rate) if billing.tax_rate else None,
        status=TransactionStatus[billing.status.upper()],
        stripe_invoice_id=billing.stripe_invoice_id,
        refunded=billing.refunded,
        refund_amount=float(billing.refund_amount) if billing.refund_amount else None,
        refund_reason=billing.refund_reason,
        invoice_number=billing.invoice_number,
        invoice_pdf_url=billing.invoice_pdf_url,
        receipt_url=billing.receipt_url,
        created_at=billing.created_at,
    )


def model_to_feature_access_record(feature: FeatureAccessModel) -> FeatureAccessRecord:
    """Convert database model to GraphQL FeatureAccessRecord type"""
    return FeatureAccessRecord(
        id=str(feature.id),
        feature_id=feature.feature_id,
        feature_name=feature.feature_name,
        tier_required=SubscriptionTierEnum[feature.tier_required.upper()],
        has_access=feature.has_access,
        access_source=FeatureAccessSource[feature.access_source.upper()],
        usage_count=feature.usage_count,
        usage_limit=feature.usage_limit,
    )


def model_to_canadian_tax_rate(tax_rate) -> CanadianTaxRateType:
    """Convert database CanadianTaxRate model to GraphQL CanadianTaxRateType"""
    return CanadianTaxRateType(
        province=tax_rate.province,
        province_name=tax_rate.province_name,
        tax_type=TaxType[tax_rate.tax_type.replace('+', '_').replace(' ', '_').upper()],
        gst_rate=float(tax_rate.gst_rate) if tax_rate.gst_rate else None,
        pst_rate=float(tax_rate.pst_rate) if tax_rate.pst_rate else None,
        hst_rate=float(tax_rate.hst_rate) if tax_rate.hst_rate else None,
        qst_rate=float(tax_rate.qst_rate) if tax_rate.qst_rate else None,
        combined_rate=float(tax_rate.combined_rate),
        effective_from=datetime.combine(tax_rate.effective_from, datetime.min.time()).replace(tzinfo=timezone.utc),
        effective_to=datetime.combine(tax_rate.effective_to, datetime.min.time()).replace(tzinfo=timezone.utc) if tax_rate.effective_to else None,
    )


# =============================================================================
# Query Resolvers (T026-T028)
# =============================================================================

@strawberry.type
class SubscriptionQueries:
    """Premium subscription query resolvers"""

    @strawberry.field
    async def available_plans(
        self,
        info: Info,
    ) -> AvailablePlansResponse:
        """
        T026: Get available subscription plans with recommendations

        Returns all active plans sorted by sort_order, with current user's tier
        and personalized plan recommendation based on usage patterns.
        """
        try:
            # Get current user from context
            user = await info.context.get_user()

            async for session in get_async_session():
                # Get all active plans
                plans_query = select(SubscriptionPlanModel).where(
                    SubscriptionPlanModel.is_active == True
                ).order_by(SubscriptionPlanModel.sort_order.asc())

                result = await session.execute(plans_query)
                plan_models = result.scalars().all()

                # Convert to GraphQL types
                plans = [model_to_subscription_plan(p) for p in plan_models]

                # Default tier for non-authenticated users
                current_tier = SubscriptionTierEnum.FREE
                recommended_plan = None

                if user:
                    # Get user's current subscription
                    sub_query = select(SubscriptionModel).where(
                        SubscriptionModel.user_id == user.id
                    )
                    sub_result = await session.execute(sub_query)
                    subscription = sub_result.scalar_one_or_none()

                    if subscription:
                        current_tier = SubscriptionTierEnum[subscription.tier.upper()]

                    # Recommend upgrade based on tier
                    if current_tier == SubscriptionTierEnum.FREE:
                        # Recommend Standard tier for free users
                        recommended_plan = next(
                            (p for p in plans if p.tier == SubscriptionTierEnum.STANDARD),
                            None
                        )
                    elif current_tier == SubscriptionTierEnum.STANDARD:
                        # Recommend Premium tier for standard users
                        recommended_plan = next(
                            (p for p in plans if p.tier == SubscriptionTierEnum.PREMIUM),
                            None
                        )

                return AvailablePlansResponse(
                    plans=plans,
                    current_tier=current_tier,
                    recommended_plan=recommended_plan,
                )

        except Exception as e:
            logger.error(f"Error fetching available plans: {e}")
            return AvailablePlansResponse(
                plans=[],
                current_tier=SubscriptionTierEnum.FREE,
                recommended_plan=None,
            )

    @strawberry.field
    async def subscription_plan(
        self,
        plan_id: str,
        info: Info,
    ) -> Optional[PremiumSubscriptionPlan]:
        """
        T027: Get specific subscription plan by ID

        Args:
            plan_id: Subscription plan identifier

        Returns:
            PremiumSubscriptionPlan or None if not found
        """
        try:
            async for session in get_async_session():
                query = select(SubscriptionPlanModel).where(
                    SubscriptionPlanModel.id == plan_id,
                    SubscriptionPlanModel.is_active == True
                )

                result = await session.execute(query)
                plan = result.scalar_one_or_none()

                if not plan:
                    logger.warning(f"Plan not found: {plan_id}")
                    return None

                return model_to_subscription_plan(plan)

        except Exception as e:
            logger.error(f"Error fetching plan {plan_id}: {e}")
            return None

    @strawberry.field
    async def my_trial_progress(
        self,
        info: Info,
    ) -> Optional[TrialProgress]:
        """
        T030: Get current user's trial progress and metrics

        Returns trial status, feature usage, value demonstration,
        and conversion metrics.

        Requires authentication.
        """
        try:
            # Get current user from context
            user = await info.context.get_user()

            if not user:
                logger.warning("Unauthenticated request to myTrialProgress")
                return None

            async for session in get_async_session():
                # Get user's trial progress
                query = select(TrialProgressModel).where(
                    TrialProgressModel.user_id == user.id
                )

                result = await session.execute(query)
                progress = result.scalar_one_or_none()

                if not progress:
                    logger.info(f"No trial progress found for user {user.id}")
                    return None

                return model_to_trial_progress(progress)

        except Exception as e:
            logger.error(f"Error fetching trial progress: {e}")
            return None

    @strawberry.field
    async def my_payment_methods(
        self,
        info: Info,
    ) -> List[PaymentMethod]:
        """
        T033: Get current user's saved payment methods

        Returns list of active payment methods with masked card details.
        Default payment method appears first.

        Requires authentication.
        """
        try:
            # Get current user from context
            user = await info.context.get_user()

            if not user:
                logger.warning("Unauthenticated request to myPaymentMethods")
                return []

            async for session in get_async_session():
                # Get user's payment methods, ordered by default first
                query = select(PaymentMethodModel).where(
                    PaymentMethodModel.user_id == user.id,
                    PaymentMethodModel.is_active == True
                ).order_by(
                    PaymentMethodModel.is_default.desc(),
                    PaymentMethodModel.created_at.desc()
                )

                result = await session.execute(query)
                payment_methods = result.scalars().all()

                return [model_to_payment_method(pm) for pm in payment_methods]

        except Exception as e:
            logger.error(f"Error fetching payment methods: {e}")
            return []

    @strawberry.field
    async def my_subscription(
        self,
        info: Info,
    ) -> Optional[PremiumSubscription]:
        """
        T036: Get current user's subscription details

        Returns current subscription with plan information,
        trial status, and cooling-off period status.

        Requires authentication.
        """
        try:
            # Get current user from context
            logger.info("=== mySubscription resolver called ===")
            user = await info.context.get_user()

            if not user:
                logger.warning("Unauthenticated request to mySubscription")
                return None

            logger.info(f"User ID: {user.id}")

            async for session in get_async_session():
                # Get user's subscription with plan join
                query = select(SubscriptionModel).where(
                    SubscriptionModel.user_id == user.id
                ).options(selectinload(SubscriptionModel.plan))

                logger.info(f"Executing subscription query for user {user.id}")
                result = await session.execute(query)
                subscription = result.scalar_one_or_none()

                if not subscription:
                    logger.warning(f"❌ No subscription found for user {user.id}")
                    return None

                logger.info(f"✅ Subscription found: ID={subscription.id}, Status={subscription.status}, Tier={subscription.tier}")
                logger.info(f"   Trial Start: {subscription.trial_start}, Trial End: {subscription.trial_end}")
                logger.info(f"   Plan: {subscription.plan.display_name if subscription.plan else 'NO PLAN'}")

                # Convert to GraphQL type
                logger.info("Converting subscription model to GraphQL type...")
                graphql_subscription = model_to_subscription(subscription, subscription.plan)
                logger.info(f"✅ Conversion successful, returning subscription")
                return graphql_subscription

        except Exception as e:
            logger.error(f"❌ Error fetching subscription: {e}")
            logger.exception(e)
            return None

    @strawberry.field
    async def cancellation_preview(
        self,
        info: Info,
    ) -> Optional[CancellationPreview]:
        """
        T040: Preview cancellation impact

        Returns refund eligibility, refund amount, access end date,
        and features that will be lost on cancellation.

        Requires authentication.
        """
        try:
            # Get current user from context
            user = await info.context.get_user()

            if not user:
                logger.warning("Unauthenticated request to cancellationPreview")
                return None

            async for session in get_async_session():
                # Get user's subscription
                query = select(SubscriptionModel).where(
                    SubscriptionModel.user_id == user.id
                ).options(selectinload(SubscriptionModel.plan))

                result = await session.execute(query)
                subscription = result.scalar_one_or_none()

                if not subscription:
                    logger.warning(f"No subscription for cancellation preview: user {user.id}")
                    return CancellationPreview(
                        is_refund_eligible=False,
                        refund_amount=None,
                        access_ends_at=None,
                        features_lost=[]
                    )

                # Check cooling-off period eligibility
                now = datetime.now(timezone.utc)
                is_refund_eligible = subscription.is_in_cooling_off_period()

                # Calculate refund amount if eligible
                refund_amount = None
                if is_refund_eligible:
                    # Get latest billing record
                    billing_query = select(BillingHistoryModel).where(
                        BillingHistoryModel.subscription_id == subscription.id,
                        BillingHistoryModel.status == "succeeded",
                        BillingHistoryModel.refunded == False
                    ).order_by(desc(BillingHistoryModel.created_at))

                    billing_result = await session.execute(billing_query)
                    latest_billing = billing_result.scalar_one_or_none()

                    if latest_billing:
                        refund_amount = float(latest_billing.total_amount)

                # Calculate access end date
                access_ends_at = now if is_refund_eligible else subscription.trial_end

                # Get features that will be lost
                features_query = select(FeatureAccessModel).where(
                    FeatureAccessModel.user_id == user.id,
                    FeatureAccessModel.has_access == True
                )
                features_result = await session.execute(features_query)
                feature_access_records = features_result.scalars().all()

                features_lost = [fa.feature_name for fa in feature_access_records]

                return CancellationPreview(
                    is_refund_eligible=is_refund_eligible,
                    refund_amount=refund_amount,
                    access_ends_at=access_ends_at,
                    features_lost=features_lost
                )

        except Exception as e:
            logger.error(f"Error generating cancellation preview: {e}")
            return CancellationPreview(
                is_refund_eligible=False,
                refund_amount=None,
                access_ends_at=None,
                features_lost=[]
            )

    @strawberry.field
    async def my_billing_history(
        self,
        info: Info,
        limit: Optional[int] = 10,
        offset: Optional[int] = 0,
    ) -> BillingHistoryResponse:
        """
        T041: Get paginated billing transaction history

        Returns billing records with Canadian tax breakdown,
        ordered by most recent first.

        Requires authentication.
        """
        try:
            # Get current user from context
            user = await info.context.get_user()

            if not user:
                logger.warning("Unauthenticated request to myBillingHistory")
                return BillingHistoryResponse(
                    records=[],
                    total_count=0,
                    has_more=False
                )

            async for session in get_async_session():
                # Get total count
                count_query = select(func.count(BillingHistoryModel.id)).where(
                    BillingHistoryModel.user_id == user.id
                )
                count_result = await session.execute(count_query)
                total_count = count_result.scalar() or 0

                # Get paginated records
                query = select(BillingHistoryModel).where(
                    BillingHistoryModel.user_id == user.id
                ).order_by(
                    desc(BillingHistoryModel.created_at)
                ).limit(limit).offset(offset)

                result = await session.execute(query)
                billing_records = result.scalars().all()

                # Convert to GraphQL types
                records = [model_to_billing_record(b) for b in billing_records]

                # Calculate if there are more records
                has_more = (offset + limit) < total_count

                return BillingHistoryResponse(
                    records=records,
                    total_count=total_count,
                    has_more=has_more
                )

        except Exception as e:
            logger.error(f"Error fetching billing history: {e}")
            return BillingHistoryResponse(
                records=[],
                total_count=0,
                has_more=False
            )

    @strawberry.field
    async def billing_record(
        self,
        info: Info,
        record_id: strawberry.ID,
    ) -> Optional[BillingRecord]:
        """
        T042: Get specific billing transaction details

        Returns complete billing record with tax breakdown,
        invoice details, and refund information.

        Requires authentication.
        """
        try:
            # Get current user from context
            user = await info.context.get_user()

            if not user:
                logger.warning("Unauthenticated request to billingRecord")
                return None

            async for session in get_async_session():
                # Get billing record
                query = select(BillingHistoryModel).where(
                    BillingHistoryModel.id == uuid.UUID(record_id),
                    BillingHistoryModel.user_id == user.id
                )

                result = await session.execute(query)
                billing = result.scalar_one_or_none()

                if not billing:
                    logger.warning(f"Billing record not found or unauthorized: {record_id}")
                    return None

                return model_to_billing_record(billing)

        except Exception as e:
            logger.error(f"Error fetching billing record {record_id}: {e}")
            return None

    @strawberry.field
    async def download_invoice(
        self,
        info: Info,
        record_id: strawberry.ID,
    ) -> InvoiceDownloadResponse:
        """
        T043: Generate invoice PDF download URL

        Verifies billing record ownership and generates temporary
        signed URL for invoice PDF download.

        Requires authentication.
        """
        try:
            # Get current user from context
            user = await info.context.get_user()

            if not user:
                return InvoiceDownloadResponse(
                    success=False,
                    error="Authentication required to download invoice"
                )

            async for session in get_async_session():
                # Get billing record
                query = select(BillingHistoryModel).where(
                    BillingHistoryModel.id == uuid.UUID(record_id),
                    BillingHistoryModel.user_id == user.id
                )

                result = await session.execute(query)
                billing = result.scalar_one_or_none()

                if not billing:
                    return InvoiceDownloadResponse(
                        success=False,
                        error="Billing record not found"
                    )

                # For MVP: Return placeholder response
                # TODO: Implement actual invoice PDF generation and signed URL
                logger.info(f"Invoice download requested for record {record_id}")

                return InvoiceDownloadResponse(
                    success=True,
                    download_url=None,
                    expires_at=None,
                    error="Invoice generation not yet implemented"
                )

        except Exception as e:
            logger.error(f"Error generating invoice download: {e}")
            return InvoiceDownloadResponse(
                success=False,
                error="Failed to generate invoice download URL"
            )

    @strawberry.field
    async def check_feature_access(
        self,
        info: Info,
        feature_id: str,
    ) -> FeatureAccessResponse:
        """
        T044: Check if user has access to specific feature

        Returns access status, usage statistics, and upgrade
        recommendation if feature requires higher tier.

        Requires authentication.
        """
        try:
            # Get current user from context
            user = await info.context.get_user()

            if not user:
                return FeatureAccessResponse(
                    has_access=False,
                    feature_id=feature_id,
                    upgrade_recommendation="Authentication required to access premium features"
                )

            async for session in get_async_session():
                # Get feature access record
                query = select(FeatureAccessModel).where(
                    FeatureAccessModel.user_id == user.id,
                    FeatureAccessModel.feature_id == feature_id
                )

                result = await session.execute(query)
                feature_access = result.scalar_one_or_none()

                if not feature_access:
                    # No access record exists - feature not accessible
                    return FeatureAccessResponse(
                        has_access=False,
                        feature_id=feature_id,
                        tier_required=SubscriptionTierEnum.STANDARD,
                        usage_count=None,
                        usage_limit=None,
                        upgrade_recommendation=f"Upgrade to access {feature_id.replace('_', ' ').title()}"
                    )

                # Check if access is still valid
                now = datetime.now(timezone.utc)
                has_access = feature_access.has_access

                if feature_access.access_expires_at and feature_access.access_expires_at < now:
                    has_access = False

                # Generate upgrade recommendation if no access
                upgrade_recommendation = None
                if not has_access:
                    tier_name = feature_access.tier_required.title() if hasattr(feature_access.tier_required, 'title') else str(feature_access.tier_required)
                    upgrade_recommendation = f"Upgrade to {tier_name} plan to access this feature"

                return FeatureAccessResponse(
                    has_access=has_access,
                    feature_id=feature_id,
                    tier_required=SubscriptionTierEnum[feature_access.tier_required.upper()],
                    usage_count=feature_access.usage_count,
                    usage_limit=feature_access.usage_limit,
                    upgrade_recommendation=upgrade_recommendation
                )

        except Exception as e:
            logger.error(f"Error checking feature access for {feature_id}: {e}")
            return FeatureAccessResponse(
                has_access=False,
                feature_id=feature_id,
                upgrade_recommendation="Error checking feature access"
            )

    @strawberry.field
    async def my_feature_access(
        self,
        info: Info,
    ) -> List[FeatureAccessRecord]:
        """
        T045: Get all feature access records for current user

        Returns complete list of features with access status,
        tier requirements, and usage statistics.

        Requires authentication.
        """
        try:
            # Get current user from context
            user = await info.context.get_user()

            if not user:
                logger.warning("Unauthenticated request to myFeatureAccess")
                return []

            async for session in get_async_session():
                # Get all feature access records
                query = select(FeatureAccessModel).where(
                    FeatureAccessModel.user_id == user.id
                ).order_by(FeatureAccessModel.feature_name.asc())

                result = await session.execute(query)
                feature_records = result.scalars().all()

                # Convert to GraphQL types
                return [model_to_feature_access_record(f) for f in feature_records]

        except Exception as e:
            logger.error(f"Error fetching feature access: {e}")
            return []

    @strawberry.field
    async def calculate_tax(
        self,
        info: Info,
        amount: float,
        province: CanadianProvince,
    ) -> TaxCalculationResponse:
        """
        T047: Calculate Canadian tax for preview

        Calculates tax breakdown for given amount and province.
        No authentication required (public preview).

        Args:
            amount: Amount to calculate tax for
            province: Canadian province

        Returns:
            TaxCalculationResponse with complete tax breakdown
        """
        try:
            async for session in get_async_session():
                # Use CanadianTaxService to calculate tax
                tax_service = CanadianTaxService(session)

                # Convert float to Decimal for precision
                subtotal = Decimal(str(amount))

                # Calculate tax
                tax_calc = await tax_service.calculate_tax(
                    subtotal=subtotal,
                    province=province
                )

                if not tax_calc:
                    logger.error(f"Tax calculation failed for province {province.value}")
                    # Return zero tax as fallback
                    return TaxCalculationResponse(
                        subtotal=amount,
                        province=province,
                        tax_breakdown=PremiumTaxBreakdown(gst=0.0, pst=0.0, hst=0.0, qst=0.0),
                        tax_type=TaxType.GST,
                        combined_rate=0.0,
                        total_tax=0.0,
                        total_amount=amount,
                        currency="CAD"
                    )

                # Convert tax rate enum to GraphQL TaxType
                tax_type_str = tax_calc.tax_rate_data.tax_type.replace('+', '_').replace(' ', '_').upper()
                tax_type = TaxType[tax_type_str]

                # Create tax breakdown
                tax_breakdown = PremiumTaxBreakdown(
                    gst=float(tax_calc.gst_amount) if tax_calc.gst_amount else None,
                    pst=float(tax_calc.pst_amount) if tax_calc.pst_amount else None,
                    hst=float(tax_calc.hst_amount) if tax_calc.hst_amount else None,
                    qst=float(tax_calc.qst_amount) if tax_calc.qst_amount else None,
                )

                return TaxCalculationResponse(
                    subtotal=float(tax_calc.subtotal),
                    province=province,
                    tax_breakdown=tax_breakdown,
                    tax_type=tax_type,
                    combined_rate=float(tax_calc.tax_rate_data.combined_rate),
                    total_tax=float(tax_calc.total_tax),
                    total_amount=float(tax_calc.total_amount),
                    currency="CAD"
                )

        except Exception as e:
            logger.error(f"Error calculating tax: {e}")
            # Return zero tax as fallback
            return TaxCalculationResponse(
                subtotal=amount,
                province=province,
                tax_breakdown=PremiumTaxBreakdown(gst=0.0, pst=0.0, hst=0.0, qst=0.0),
                tax_type=TaxType.GST,
                combined_rate=0.0,
                total_tax=0.0,
                total_amount=amount,
                currency="CAD"
            )

    @strawberry.field
    async def tax_rates(
        self,
        info: Info,
    ) -> List[CanadianTaxRateType]:
        """
        T048: Get all provincial tax rates

        Returns tax rates for all 13 Canadian provinces/territories.
        No authentication required (public information).

        Returns:
            List of CanadianTaxRateType with rate details
        """
        try:
            async for session in get_async_session():
                # Use CanadianTaxService to get all tax rates
                tax_service = CanadianTaxService(session)
                tax_rates_dict = await tax_service.get_all_tax_rates()

                # Convert to list of GraphQL types
                tax_rates = []
                for province_code, tax_rate in tax_rates_dict.items():
                    tax_rates.append(model_to_canadian_tax_rate(tax_rate))

                # Sort by province code
                tax_rates.sort(key=lambda x: x.province)

                logger.info(f"Retrieved {len(tax_rates)} tax rates")
                return tax_rates

        except Exception as e:
            logger.error(f"Error fetching tax rates: {e}")
            return []

    @strawberry.field
    async def compliance_report(
        self,
        info: Info,
    ) -> ComplianceReportResponse:
        """
        T050: Generate PIPEDA compliance report for user

        Returns comprehensive compliance report with subscription data,
        payment methods, billing history, and consent records.

        Requires authentication.
        """
        try:
            # Get current user from context
            user = await info.context.get_user()

            if not user:
                logger.warning("Unauthenticated request to complianceReport")
                # Return empty report for unauthenticated users
                return ComplianceReportResponse(
                    user_id="",
                    report_generated_at=datetime.now(timezone.utc),
                    subscription_data=None,
                    payment_methods=[],
                    billing_records=[],
                    consent_records=ConsentRecords(
                        payment_consent_at=None,
                        privacy_consent_at=None
                    ),
                    data_retention_policy="Data retained for 7 years per Canadian tax law. Contact support for deletion requests."
                )

            async for session in get_async_session():
                now = datetime.now(timezone.utc)

                # Get subscription data
                subscription_data = None
                sub_query = select(SubscriptionModel).where(
                    SubscriptionModel.user_id == user.id
                ).options(selectinload(SubscriptionModel.plan))

                sub_result = await session.execute(sub_query)
                subscription = sub_result.scalar_one_or_none()

                if subscription:
                    subscription_data = SubscriptionComplianceData(
                        plan_name=subscription.plan.display_name,
                        tier=SubscriptionTierEnum[subscription.tier.upper()],
                        status=SubscriptionStatus[subscription.status.upper()],
                        billing_interval=BillingInterval[subscription.billing_interval.upper()],
                        province=subscription.province,
                        created_at=subscription.created_at
                    )

                # Get payment methods (PCI-DSS compliant - no full card numbers)
                pm_query = select(PaymentMethodModel).where(
                    PaymentMethodModel.user_id == user.id,
                    PaymentMethodModel.is_active == True
                ).order_by(PaymentMethodModel.is_default.desc())

                pm_result = await session.execute(pm_query)
                payment_methods_models = pm_result.scalars().all()

                payment_methods = []
                for pm in payment_methods_models:
                    payment_methods.append(PaymentMethodComplianceData(
                        card_brand=pm.card_brand or "unknown",
                        card_last4=pm.card_last4 or "****",
                        is_default=pm.is_default,
                        created_at=pm.created_at
                    ))

                # Get billing records (last 12 months)
                twelve_months_ago = now - timedelta(days=365)
                billing_query = select(BillingHistoryModel).where(
                    BillingHistoryModel.user_id == user.id,
                    BillingHistoryModel.created_at >= twelve_months_ago
                ).order_by(desc(BillingHistoryModel.created_at))

                billing_result = await session.execute(billing_query)
                billing_records_models = billing_result.scalars().all()

                billing_records = [model_to_billing_record(b) for b in billing_records_models]

                # Get consent records
                consent_records = ConsentRecords(
                    payment_consent_at=subscription.payment_consent_at if subscription else None,
                    privacy_consent_at=None  # Would come from user profile if available
                )

                # Data retention policy
                data_retention_policy = (
                    "NestSync retains subscription and billing data for 7 years to comply with "
                    "Canadian tax law (CRA requirements). Payment card details are stored securely "
                    "via Stripe and are never stored directly in our database. You may request "
                    "data deletion by contacting support@nestsync.ca, subject to legal retention "
                    "requirements under PIPEDA and tax law."
                )

                logger.info(f"Generated compliance report for user {user.id}")

                return ComplianceReportResponse(
                    user_id=str(user.id),
                    report_generated_at=now,
                    subscription_data=subscription_data,
                    payment_methods=payment_methods,
                    billing_records=billing_records,
                    consent_records=consent_records,
                    data_retention_policy=data_retention_policy
                )

        except Exception as e:
            logger.error(f"Error generating compliance report: {e}")
            # Return minimal report on error
            return ComplianceReportResponse(
                user_id=str(user.id) if user else "",
                report_generated_at=datetime.now(timezone.utc),
                subscription_data=None,
                payment_methods=[],
                billing_records=[],
                consent_records=ConsentRecords(
                    payment_consent_at=None,
                    privacy_consent_at=None
                ),
                data_retention_policy="Error generating compliance report. Please contact support."
            )


# =============================================================================
# Mutation Resolvers (T029, T031, T032, T034)
# =============================================================================

@strawberry.type
class SubscriptionMutations:
    """Premium subscription mutation resolvers"""

    @strawberry.mutation
    async def start_trial(
        self,
        input: StartTrialInput,
        info: Info,
    ) -> TrialStartResponse:
        """
        T029: Start 14-day trial without credit card

        Creates trial subscription and trial progress tracking.
        Grants feature access for trial tier.

        Args:
            input: Trial tier and province

        Returns:
            TrialStartResponse with subscription and progress
        """
        try:
            # Get current user from context
            user = await info.context.get_user()

            if not user:
                return TrialStartResponse(
                    success=False,
                    error="Authentication required to start trial"
                )

            async for session in get_async_session():
                # Check if user already has a subscription
                existing_sub_query = select(SubscriptionModel).where(
                    SubscriptionModel.user_id == user.id
                )
                existing_sub_result = await session.execute(existing_sub_query)
                existing_sub = existing_sub_result.scalar_one_or_none()

                if existing_sub:
                    return TrialStartResponse(
                        success=False,
                        error="You already have an active subscription"
                    )

                # Check if user already had a trial
                existing_trial_query = select(TrialProgressModel).where(
                    TrialProgressModel.user_id == user.id
                )
                existing_trial_result = await session.execute(existing_trial_query)
                existing_trial = existing_trial_result.scalar_one_or_none()

                if existing_trial:
                    return TrialStartResponse(
                        success=False,
                        error="Trial already used. Please subscribe to continue."
                    )

                # Get the trial plan
                plan_query = select(SubscriptionPlanModel).where(
                    SubscriptionPlanModel.tier == input.tier.value,
                    SubscriptionPlanModel.billing_interval == "monthly",
                    SubscriptionPlanModel.is_active == True
                )
                plan_result = await session.execute(plan_query)
                plan = plan_result.scalar_one_or_none()

                if not plan:
                    return TrialStartResponse(
                        success=False,
                        error=f"No active plan found for tier {input.tier.value}"
                    )

                # Calculate trial period (14 days)
                now = datetime.now(timezone.utc)
                trial_end = now + timedelta(days=14)

                # Create subscription record
                subscription = SubscriptionModel(
                    user_id=user.id,
                    plan_id=plan.id,
                    tier=input.tier.value,
                    status="trialing",
                    billing_interval="monthly",
                    amount=plan.price,
                    currency="CAD",
                    province=input.province.value,
                    trial_start=now,
                    trial_end=trial_end,
                )
                session.add(subscription)
                await session.flush()  # Get subscription ID

                # Create trial progress record
                trial_progress = TrialProgressModel(
                    user_id=user.id,
                    subscription_id=subscription.id,
                    is_active=True,
                    trial_tier=input.tier.value,
                    trial_started_at=now,
                    trial_ends_at=trial_end,
                    days_remaining=14,
                )
                session.add(trial_progress)
                await session.flush()

                # Create feature access records for trial tier
                trial_features = plan.features
                for feature_id in trial_features:
                    feature_access = FeatureAccessModel(
                        user_id=user.id,
                        subscription_id=subscription.id,
                        feature_id=feature_id,
                        feature_name=feature_id.replace("_", " ").title(),
                        tier_required=input.tier.value,
                        has_access=True,
                        access_source="trial",
                        access_granted_at=now,
                        access_expires_at=trial_end,
                    )
                    session.add(feature_access)

                # Create trial started event
                trial_event = TrialUsageEventModel(
                    trial_progress_id=trial_progress.id,
                    user_id=user.id,
                    event_type="trial_started",
                    event_description=f"Started {input.tier.value} trial",
                )
                session.add(trial_event)

                await session.commit()

                logger.info(f"Trial started for user {user.id}: {input.tier.value}")

                return TrialStartResponse(
                    success=True,
                    trial_progress=model_to_trial_progress(trial_progress),
                    subscription=model_to_subscription(subscription, plan),
                )

        except Exception as e:
            logger.exception(f"Error starting trial for user {user.id if user else 'unknown'}: {type(e).__name__}: {e}")
            return TrialStartResponse(
                success=False,
                error=f"Failed to start trial: {str(e)}"
            )

    @strawberry.mutation
    async def track_trial_event(
        self,
        input: TrackTrialEventInput,
        info: Info,
    ) -> bool:
        """
        T031: Track trial feature usage events

        Records feature usage, value saved, and engagement metrics
        during trial period for conversion optimization.

        Args:
            input: Event type, feature used, value metrics

        Returns:
            True if event recorded successfully
        """
        try:
            # Get current user from context
            user = await info.context.get_user()

            if not user:
                logger.warning("Unauthenticated request to trackTrialEvent")
                return False

            async for session in get_async_session():
                # Get user's active trial progress
                trial_query = select(TrialProgressModel).where(
                    TrialProgressModel.user_id == user.id,
                    TrialProgressModel.is_active == True
                )
                trial_result = await session.execute(trial_query)
                trial_progress = trial_result.scalar_one_or_none()

                if not trial_progress:
                    logger.warning(f"No active trial for user {user.id}")
                    return False

                # Create trial usage event
                event = TrialUsageEventModel(
                    trial_progress_id=trial_progress.id,
                    user_id=user.id,
                    event_type=input.event_type.value,
                    feature_used=input.feature_used,
                    event_description=f"Used {input.feature_used or 'feature'}" if input.feature_used else None,
                    value_saved=Decimal(str(input.value_saved)) if input.value_saved else None,
                    time_saved_minutes=input.time_saved_minutes,
                    screen=input.screen,
                )
                session.add(event)

                # Update trial progress metrics
                if input.event_type == TrialEventType.FEATURE_USED:
                    trial_progress.features_used_count += 1

                    # Update specific feature flags
                    if input.feature_used:
                        if "family_sharing" in input.feature_used.lower():
                            trial_progress.family_sharing_used = True
                        elif "reorder" in input.feature_used.lower():
                            trial_progress.reorder_suggestions_used = True
                        elif "analytics" in input.feature_used.lower():
                            trial_progress.analytics_viewed = True
                        elif "price_alert" in input.feature_used.lower():
                            trial_progress.price_alerts_used = True
                        elif "automation" in input.feature_used.lower():
                            trial_progress.automation_used = True

                if input.value_saved:
                    # Add to cumulative value saved
                    current_value = trial_progress.value_saved_estimate or Decimal("0")
                    trial_progress.value_saved_estimate = current_value + Decimal(str(input.value_saved))

                # Update last activity
                trial_progress.last_activity_at = datetime.now(timezone.utc)

                # Calculate engagement score (0-100)
                engagement_factors = [
                    trial_progress.family_sharing_used,
                    trial_progress.reorder_suggestions_used,
                    trial_progress.analytics_viewed,
                    trial_progress.price_alerts_used,
                    trial_progress.automation_used,
                ]
                trial_progress.engagement_score = int(
                    (sum(engagement_factors) / len(engagement_factors)) * 100
                )

                await session.commit()

                logger.info(
                    f"Trial event tracked for user {user.id}: "
                    f"{input.event_type.value} - {input.feature_used}"
                )

                return True

        except Exception as e:
            logger.error(f"Error tracking trial event: {e}")
            return False

    @strawberry.mutation
    async def add_payment_method(
        self,
        input: AddPaymentMethodInput,
        info: Info,
    ) -> PaymentMethodResponse:
        """
        T032: Add payment method via Stripe

        Attaches Stripe PaymentMethod to customer and stores
        masked details in database for display.

        Args:
            input: Stripe PaymentMethod ID and default flag

        Returns:
            PaymentMethodResponse with created payment method
        """
        try:
            # Get current user from context
            user = await info.context.get_user()

            if not user:
                return PaymentMethodResponse(
                    success=False,
                    error="Authentication required to add payment method"
                )

            # Get Stripe configuration
            stripe_config = get_stripe_config()

            async for session in get_async_session():
                # Get or create Stripe customer
                subscription_query = select(SubscriptionModel).where(
                    SubscriptionModel.user_id == user.id
                )
                subscription_result = await session.execute(subscription_query)
                subscription = subscription_result.scalar_one_or_none()

                stripe_customer_id = None

                if subscription and subscription.stripe_customer_id:
                    stripe_customer_id = subscription.stripe_customer_id
                else:
                    # Create Stripe customer
                    customer = await stripe_config.create_customer(
                        user_id=str(user.id),
                        email=user.email,
                        name=f"{user.first_name} {user.last_name}" if user.first_name else None,
                        province=user.province if hasattr(user, 'province') else None,
                    )
                    stripe_customer_id = customer.id

                    # Update subscription with customer ID
                    if subscription:
                        subscription.stripe_customer_id = stripe_customer_id

                # Attach payment method to Stripe customer
                payment_method = await stripe_config.attach_payment_method(
                    input.stripe_payment_method_id,
                    stripe_customer_id
                )

                # Set as default if requested
                if input.set_as_default:
                    # Unset existing default
                    await session.execute(
                        select(PaymentMethodModel).where(
                            PaymentMethodModel.user_id == user.id,
                            PaymentMethodModel.is_default == True
                        )
                    )
                    existing_defaults = (await session.execute(
                        select(PaymentMethodModel).where(
                            PaymentMethodModel.user_id == user.id,
                            PaymentMethodModel.is_default == True
                        )
                    )).scalars().all()

                    for existing in existing_defaults:
                        existing.is_default = False

                    # Set as default in Stripe
                    await stripe_config.set_default_payment_method(
                        stripe_customer_id,
                        payment_method.id
                    )

                # Create payment method record
                card = payment_method.card
                pm_record = PaymentMethodModel(
                    user_id=user.id,
                    stripe_payment_method_id=payment_method.id,
                    stripe_customer_id=stripe_customer_id,
                    type="card",
                    card_brand=card.brand if card else None,
                    card_last4=card.last4 if card else None,
                    card_exp_month=card.exp_month if card else None,
                    card_exp_year=card.exp_year if card else None,
                    is_default=input.set_as_default or False,
                    is_active=True,
                )
                session.add(pm_record)
                await session.commit()

                logger.info(
                    f"Payment method added for user {user.id}: "
                    f"{pm_record.card_brand} ending in {pm_record.card_last4}"
                )

                return PaymentMethodResponse(
                    success=True,
                    payment_method=model_to_payment_method(pm_record),
                )

        except Exception as e:
            logger.error(f"Error adding payment method: {e}")
            return PaymentMethodResponse(
                success=False,
                error="Failed to add payment method. Please try again."
            )

    @strawberry.mutation
    async def remove_payment_method(
        self,
        payment_method_id: str,
        info: Info,
    ) -> PaymentMethodResponse:
        """
        T034: Remove payment method

        Detaches payment method from Stripe and marks as inactive.

        Args:
            payment_method_id: Payment method UUID

        Returns:
            PaymentMethodResponse with success status
        """
        try:
            # Get current user from context
            user = await info.context.get_user()

            if not user:
                return PaymentMethodResponse(
                    success=False,
                    error="Authentication required to remove payment method"
                )

            # Get Stripe configuration
            stripe_config = get_stripe_config()

            async for session in get_async_session():
                # Get payment method
                pm_query = select(PaymentMethodModel).where(
                    PaymentMethodModel.id == uuid.UUID(payment_method_id),
                    PaymentMethodModel.user_id == user.id,
                    PaymentMethodModel.is_active == True
                )
                pm_result = await session.execute(pm_query)
                payment_method = pm_result.scalar_one_or_none()

                if not payment_method:
                    return PaymentMethodResponse(
                        success=False,
                        error="Payment method not found"
                    )

                # Check if this is the only payment method
                count_query = select(func.count(PaymentMethodModel.id)).where(
                    PaymentMethodModel.user_id == user.id,
                    PaymentMethodModel.is_active == True
                )
                count_result = await session.execute(count_query)
                active_count = count_result.scalar()

                # Detach from Stripe
                try:
                    await stripe_config.detach_payment_method(
                        payment_method.stripe_payment_method_id
                    )
                except Exception as stripe_error:
                    logger.warning(f"Stripe detach failed: {stripe_error}")
                    # Continue with database removal even if Stripe fails

                # Mark as inactive in database
                payment_method.is_active = False
                payment_method.is_default = False

                await session.commit()

                logger.info(
                    f"Payment method removed for user {user.id}: "
                    f"{payment_method.card_brand} ending in {payment_method.card_last4}"
                )

                return PaymentMethodResponse(
                    success=True,
                    payment_method=model_to_payment_method(payment_method),
                )

        except Exception as e:
            logger.error(f"Error removing payment method: {e}")
            return PaymentMethodResponse(
                success=False,
                error="Failed to remove payment method. Please try again."
            )

    @strawberry.mutation
    async def subscribe(
        self,
        input: SubscribeInput,
        info: Info,
    ) -> PremiumSubscriptionResponse:
        """
        T035: Convert trial or free tier to paid subscription

        Creates Stripe subscription, calculates Canadian taxes,
        records payment consent, and syncs feature access.

        Args:
            input: Plan ID, payment method ID, province

        Returns:
            PremiumSubscriptionResponse with subscription data
        """
        try:
            # Get current user from context
            user = await info.context.get_user()

            if not user:
                return PremiumSubscriptionResponse(
                    success=False,
                    error="Authentication required to subscribe"
                )

            # Get Stripe configuration
            stripe_config = get_stripe_config()

            async for session in get_async_session():
                # Verify payment method belongs to user
                pm_query = select(PaymentMethodModel).where(
                    PaymentMethodModel.id == uuid.UUID(input.payment_method_id),
                    PaymentMethodModel.user_id == user.id,
                    PaymentMethodModel.is_active == True
                )
                pm_result = await session.execute(pm_query)
                payment_method = pm_result.scalar_one_or_none()

                if not payment_method:
                    return PremiumSubscriptionResponse(
                        success=False,
                        error="Payment method not found"
                    )

                # Get subscription plan
                plan_query = select(SubscriptionPlanModel).where(
                    SubscriptionPlanModel.id == input.plan_id,
                    SubscriptionPlanModel.is_active == True
                )
                plan_result = await session.execute(plan_query)
                plan = plan_result.scalar_one_or_none()

                if not plan:
                    return PremiumSubscriptionResponse(
                        success=False,
                        error="Subscription plan not found"
                    )

                # Calculate tax for province
                tax_service = CanadianTaxService(session)
                tax_calc = await tax_service.calculate_tax(
                    subtotal=Decimal(str(plan.price)),
                    province=input.province.value
                )

                # Get or create Stripe customer
                existing_sub_query = select(SubscriptionModel).where(
                    SubscriptionModel.user_id == user.id
                )
                existing_sub_result = await session.execute(existing_sub_query)
                existing_sub = existing_sub_result.scalar_one_or_none()

                stripe_customer_id = None

                if existing_sub and existing_sub.stripe_customer_id:
                    stripe_customer_id = existing_sub.stripe_customer_id
                else:
                    # Create Stripe customer
                    customer = await stripe_config.create_customer(
                        user_id=str(user.id),
                        email=user.email,
                        name=f"{user.first_name} {user.last_name}" if user.first_name else None,
                        province=input.province.value,
                    )
                    stripe_customer_id = customer.id

                # Create Stripe subscription
                stripe_subscription = await stripe_config.create_subscription(
                    customer_id=stripe_customer_id,
                    price_id=plan.stripe_price_id,
                    metadata={
                        "user_id": str(user.id),
                        "plan_id": plan.id,
                        "province": input.province.value
                    }
                )

                # Calculate cooling-off period for annual plans
                now = datetime.now(timezone.utc)
                cooling_off_end = None
                if plan.billing_interval == "yearly":
                    cooling_off_end = now + timedelta(days=14)

                # Create or update subscription record
                if existing_sub:
                    # Update existing subscription
                    existing_sub.plan_id = plan.id
                    existing_sub.tier = plan.tier
                    existing_sub.status = "active"
                    existing_sub.billing_interval = plan.billing_interval
                    existing_sub.amount = plan.price
                    existing_sub.province = input.province.value
                    existing_sub.stripe_customer_id = stripe_customer_id
                    existing_sub.stripe_subscription_id = stripe_subscription.id
                    existing_sub.payment_consent_at = now
                    existing_sub.cooling_off_end = cooling_off_end
                    existing_sub.trial_start = None
                    existing_sub.trial_end = None
                    subscription = existing_sub
                else:
                    # Create new subscription
                    subscription = SubscriptionModel(
                        user_id=user.id,
                        plan_id=plan.id,
                        tier=plan.tier,
                        status="active",
                        billing_interval=plan.billing_interval,
                        amount=plan.price,
                        currency="CAD",
                        province=input.province.value,
                        stripe_customer_id=stripe_customer_id,
                        stripe_subscription_id=stripe_subscription.id,
                        payment_consent_at=now,
                        cooling_off_end=cooling_off_end,
                    )
                    session.add(subscription)

                await session.flush()

                # If converting from trial, mark trial as converted
                trial_query = select(TrialProgressModel).where(
                    TrialProgressModel.user_id == user.id,
                    TrialProgressModel.is_active == True
                )
                trial_result = await session.execute(trial_query)
                trial_progress = trial_result.scalar_one_or_none()

                if trial_progress:
                    trial_progress.converted_to_paid = True
                    trial_progress.converted_at = now
                    trial_progress.is_active = False

                # Sync feature access records
                # Delete existing feature access
                delete_query = select(FeatureAccessModel).where(
                    FeatureAccessModel.user_id == user.id
                )
                delete_result = await session.execute(delete_query)
                existing_features = delete_result.scalars().all()
                for feature in existing_features:
                    await session.delete(feature)

                # Create new feature access for subscription
                for feature_id in plan.features:
                    feature_access = FeatureAccessModel(
                        user_id=user.id,
                        subscription_id=subscription.id,
                        feature_id=feature_id,
                        feature_name=feature_id.replace("_", " ").title(),
                        tier_required=plan.tier,
                        has_access=True,
                        access_source="subscription",
                        access_granted_at=now,
                    )
                    session.add(feature_access)

                # Create initial billing history record
                billing_record = BillingHistoryModel(
                    user_id=user.id,
                    subscription_id=subscription.id,
                    transaction_type="trial_conversion" if trial_progress else "subscription_charge",
                    description=f"Subscription to {plan.display_name}",
                    subtotal=plan.price,
                    tax_amount=tax_calc.total_tax,
                    total_amount=tax_calc.total_amount,
                    currency="CAD",
                    province=input.province.value,
                    gst_amount=tax_calc.tax_breakdown.gst if hasattr(tax_calc.tax_breakdown, 'gst') else None,
                    pst_amount=tax_calc.tax_breakdown.pst if hasattr(tax_calc.tax_breakdown, 'pst') else None,
                    hst_amount=tax_calc.tax_breakdown.hst if hasattr(tax_calc.tax_breakdown, 'hst') else None,
                    qst_amount=tax_calc.tax_breakdown.qst if hasattr(tax_calc.tax_breakdown, 'qst') else None,
                    tax_rate=Decimal(str(tax_calc.combined_rate)),
                    payment_method_id=payment_method.id,
                    status="succeeded",
                    stripe_invoice_id=stripe_subscription.latest_invoice if hasattr(stripe_subscription, 'latest_invoice') else None,
                )
                session.add(billing_record)

                await session.commit()

                logger.info(
                    f"Subscription created for user {user.id}: "
                    f"{plan.display_name} ({plan.billing_interval})"
                )

                return PremiumSubscriptionResponse(
                    success=True,
                    subscription=model_to_subscription(subscription, plan)
                )

        except Exception as e:
            logger.error(f"Error creating subscription: {e}")
            return PremiumSubscriptionResponse(
                success=False,
                error="Failed to create subscription. Please try again."
            )

    @strawberry.mutation
    async def change_subscription_plan(
        self,
        input: ChangeSubscriptionPlanInput,
        info: Info,
    ) -> PremiumSubscriptionResponse:
        """
        T037: Upgrade or downgrade subscription plan

        Updates Stripe subscription with new price, calculates proration,
        syncs feature access, and creates audit log.

        Args:
            input: New plan ID

        Returns:
            PremiumSubscriptionResponse with updated subscription
        """
        try:
            # Get current user from context
            user = await info.context.get_user()

            if not user:
                return PremiumSubscriptionResponse(
                    success=False,
                    error="Authentication required to change plan"
                )

            # Get Stripe configuration
            stripe_config = get_stripe_config()

            async for session in get_async_session():
                # Get current subscription
                sub_query = select(SubscriptionModel).where(
                    SubscriptionModel.user_id == user.id
                ).options(selectinload(SubscriptionModel.plan))

                sub_result = await session.execute(sub_query)
                subscription = sub_result.scalar_one_or_none()

                if not subscription:
                    return PremiumSubscriptionResponse(
                        success=False,
                        error="No active subscription found"
                    )

                # Get new plan
                new_plan_query = select(SubscriptionPlanModel).where(
                    SubscriptionPlanModel.id == input.new_plan_id,
                    SubscriptionPlanModel.is_active == True
                )
                new_plan_result = await session.execute(new_plan_query)
                new_plan = new_plan_result.scalar_one_or_none()

                if not new_plan:
                    return PremiumSubscriptionResponse(
                        success=False,
                        error="New plan not found"
                    )

                # Validate new plan is different
                if new_plan.id == subscription.plan_id:
                    return PremiumSubscriptionResponse(
                        success=False,
                        error="New plan is the same as current plan"
                    )

                # Update Stripe subscription with new price
                try:
                    stripe_subscription = await stripe_config.update_subscription(
                        subscription_id=subscription.stripe_subscription_id,
                        price_id=new_plan.stripe_price_id,
                        proration_behavior="create_prorations"
                    )
                except Exception as stripe_error:
                    logger.error(f"Stripe update failed: {stripe_error}")
                    return PremiumSubscriptionResponse(
                        success=False,
                        error="Failed to update subscription with Stripe"
                    )

                # Determine transaction type
                old_tier_order = {"free": 0, "standard": 1, "premium": 2}
                new_tier_order = old_tier_order.get(new_plan.tier, 1)
                current_tier_order = old_tier_order.get(subscription.tier, 0)

                transaction_type = "upgrade" if new_tier_order > current_tier_order else "downgrade"

                # Update subscription record
                subscription.plan_id = new_plan.id
                subscription.tier = new_plan.tier
                subscription.billing_interval = new_plan.billing_interval
                subscription.amount = new_plan.price

                await session.flush()

                # Sync feature access records
                # Delete existing feature access
                delete_query = select(FeatureAccessModel).where(
                    FeatureAccessModel.user_id == user.id
                )
                delete_result = await session.execute(delete_query)
                existing_features = delete_result.scalars().all()
                for feature in existing_features:
                    await session.delete(feature)

                # Create new feature access
                now = datetime.now(timezone.utc)
                for feature_id in new_plan.features:
                    feature_access = FeatureAccessModel(
                        user_id=user.id,
                        subscription_id=subscription.id,
                        feature_id=feature_id,
                        feature_name=feature_id.replace("_", " ").title(),
                        tier_required=new_plan.tier,
                        has_access=True,
                        access_source="subscription",
                        access_granted_at=now,
                    )
                    session.add(feature_access)

                # Calculate tax for billing record
                tax_service = CanadianTaxService(session)
                tax_calc = await tax_service.calculate_tax(
                    subtotal=Decimal(str(new_plan.price)),
                    province=subscription.province
                )

                # Create billing history record
                billing_record = BillingHistoryModel(
                    user_id=user.id,
                    subscription_id=subscription.id,
                    transaction_type=transaction_type,
                    description=f"Plan change: {subscription.plan.display_name} → {new_plan.display_name}",
                    subtotal=new_plan.price,
                    tax_amount=tax_calc.total_tax,
                    total_amount=tax_calc.total_amount,
                    currency="CAD",
                    province=subscription.province,
                    gst_amount=tax_calc.tax_breakdown.gst if hasattr(tax_calc.tax_breakdown, 'gst') else None,
                    pst_amount=tax_calc.tax_breakdown.pst if hasattr(tax_calc.tax_breakdown, 'pst') else None,
                    hst_amount=tax_calc.tax_breakdown.hst if hasattr(tax_calc.tax_breakdown, 'hst') else None,
                    qst_amount=tax_calc.tax_breakdown.qst if hasattr(tax_calc.tax_breakdown, 'qst') else None,
                    tax_rate=Decimal(str(tax_calc.combined_rate)),
                    status="succeeded",
                )
                session.add(billing_record)

                await session.commit()

                logger.info(
                    f"Plan changed for user {user.id}: "
                    f"{subscription.plan.display_name} → {new_plan.display_name}"
                )

                return PremiumSubscriptionResponse(
                    success=True,
                    subscription=model_to_subscription(subscription, new_plan)
                )

        except Exception as e:
            logger.error(f"Error changing plan: {e}")
            return PremiumSubscriptionResponse(
                success=False,
                error="Failed to change subscription plan. Please try again."
            )

    @strawberry.mutation
    async def cancel_subscription(
        self,
        input: CancelSubscriptionInput,
        info: Info,
    ) -> PremiumSubscriptionResponse:
        """
        T038: Cancel subscription with optional cooling-off period refund

        Cancels Stripe subscription, processes refunds if eligible,
        revokes feature access, and creates audit log.

        Args:
            input: Cancellation reason, feedback, refund request

        Returns:
            PremiumSubscriptionResponse with updated subscription
        """
        try:
            # Get current user from context
            user = await info.context.get_user()

            if not user:
                return PremiumSubscriptionResponse(
                    success=False,
                    error="Authentication required to cancel subscription"
                )

            # Get Stripe configuration
            stripe_config = get_stripe_config()

            async for session in get_async_session():
                # Get current subscription
                sub_query = select(SubscriptionModel).where(
                    SubscriptionModel.user_id == user.id
                ).options(selectinload(SubscriptionModel.plan))

                sub_result = await session.execute(sub_query)
                subscription = sub_result.scalar_one_or_none()

                if not subscription:
                    return PremiumSubscriptionResponse(
                        success=False,
                        error="No active subscription found"
                    )

                now = datetime.now(timezone.utc)
                in_cooling_off = subscription.is_in_cooling_off_period()

                # Handle refund if requested and eligible
                if input.request_refund and in_cooling_off:
                    # Get latest billing record
                    billing_query = select(BillingHistoryModel).where(
                        BillingHistoryModel.subscription_id == subscription.id,
                        BillingHistoryModel.status == "succeeded",
                        BillingHistoryModel.refunded == False
                    ).order_by(desc(BillingHistoryModel.created_at))

                    billing_result = await session.execute(billing_query)
                    latest_billing = billing_result.scalar_one_or_none()

                    if latest_billing and latest_billing.stripe_charge_id:
                        try:
                            # Create Stripe refund
                            refund = await stripe_config.create_refund(
                                charge_id=latest_billing.stripe_charge_id,
                                reason=input.reason or "requested_by_customer"
                            )

                            # Update billing record
                            latest_billing.refunded = True
                            latest_billing.refund_amount = latest_billing.total_amount
                            latest_billing.refund_reason = input.reason or "Cooling-off period cancellation"
                            latest_billing.refunded_at = now
                            latest_billing.status = "refunded"

                        except Exception as refund_error:
                            logger.error(f"Refund failed: {refund_error}")
                            # Continue with cancellation even if refund fails

                    # Cancel immediately
                    subscription.status = "canceled"
                    subscription.cooling_off_end = None

                    # Cancel Stripe subscription immediately
                    try:
                        await stripe_config.cancel_subscription(
                            subscription_id=subscription.stripe_subscription_id,
                            prorate=False,
                            invoice_now=False
                        )
                    except Exception as stripe_error:
                        logger.error(f"Stripe cancellation failed: {stripe_error}")

                else:
                    # Cancel at period end
                    subscription.status = "canceled"

                    # Cancel Stripe subscription
                    try:
                        await stripe_config.cancel_subscription(
                            subscription_id=subscription.stripe_subscription_id,
                            prorate=True,
                            invoice_now=True
                        )
                    except Exception as stripe_error:
                        logger.error(f"Stripe cancellation failed: {stripe_error}")

                # Update trial progress if exists
                trial_query = select(TrialProgressModel).where(
                    TrialProgressModel.user_id == user.id
                )
                trial_result = await session.execute(trial_query)
                trial_progress = trial_result.scalar_one_or_none()

                if trial_progress:
                    trial_progress.canceled = True
                    trial_progress.is_active = False

                # Revoke feature access
                feature_query = select(FeatureAccessModel).where(
                    FeatureAccessModel.user_id == user.id
                )
                feature_result = await session.execute(feature_query)
                features = feature_result.scalars().all()

                for feature in features:
                    feature.has_access = False
                    feature.access_expires_at = now

                # Create cancellation billing record
                billing_record = BillingHistoryModel(
                    user_id=user.id,
                    subscription_id=subscription.id,
                    transaction_type="refund" if (input.request_refund and in_cooling_off) else "subscription_charge",
                    description=f"Subscription canceled: {input.reason or 'No reason provided'}",
                    subtotal=Decimal("0"),
                    tax_amount=Decimal("0"),
                    total_amount=Decimal("0"),
                    currency="CAD",
                    province=subscription.province,
                    status="succeeded",
                )
                session.add(billing_record)

                await session.commit()

                logger.info(
                    f"Subscription canceled for user {user.id}: "
                    f"Reason: {input.reason or 'Not provided'}"
                )

                return PremiumSubscriptionResponse(
                    success=True,
                    subscription=model_to_subscription(subscription, subscription.plan)
                )

        except Exception as e:
            logger.error(f"Error canceling subscription: {e}")
            return PremiumSubscriptionResponse(
                success=False,
                error="Failed to cancel subscription. Please try again."
            )

    @strawberry.mutation
    async def request_refund(
        self,
        input: RequestRefundInput,
        info: Info,
    ) -> RefundResponse:
        """
        T039: Request refund during cooling-off period

        Validates cooling-off eligibility, creates Stripe refund,
        updates billing history, and cancels subscription.

        Args:
            input: Refund reason

        Returns:
            RefundResponse with refund details
        """
        try:
            # Get current user from context
            user = await info.context.get_user()

            if not user:
                return RefundResponse(
                    success=False,
                    error="Authentication required to request refund"
                )

            # Get Stripe configuration
            stripe_config = get_stripe_config()

            async for session in get_async_session():
                # Get current subscription
                sub_query = select(SubscriptionModel).where(
                    SubscriptionModel.user_id == user.id
                )
                sub_result = await session.execute(sub_query)
                subscription = sub_result.scalar_one_or_none()

                if not subscription:
                    return RefundResponse(
                        success=False,
                        error="No active subscription found"
                    )

                # Verify cooling-off period
                now = datetime.now(timezone.utc)
                if not subscription.is_in_cooling_off_period():
                    return RefundResponse(
                        success=False,
                        error="Cooling-off period has expired. Refund not available."
                    )

                # Get latest billing record
                billing_query = select(BillingHistoryModel).where(
                    BillingHistoryModel.subscription_id == subscription.id,
                    BillingHistoryModel.status == "succeeded",
                    BillingHistoryModel.refunded == False
                ).order_by(desc(BillingHistoryModel.created_at))

                billing_result = await session.execute(billing_query)
                latest_billing = billing_result.scalar_one_or_none()

                if not latest_billing:
                    return RefundResponse(
                        success=False,
                        error="No billing record found for refund"
                    )

                if latest_billing.refunded:
                    return RefundResponse(
                        success=False,
                        error="This charge has already been refunded"
                    )

                # Create Stripe refund
                try:
                    refund = await stripe_config.create_refund(
                        charge_id=latest_billing.stripe_charge_id,
                        reason=input.reason
                    )
                except Exception as stripe_error:
                    logger.error(f"Stripe refund failed: {stripe_error}")
                    return RefundResponse(
                        success=False,
                        error="Failed to process refund with Stripe"
                    )

                # Update billing history
                latest_billing.refunded = True
                latest_billing.refund_amount = latest_billing.total_amount
                latest_billing.refund_reason = input.reason
                latest_billing.refunded_at = now
                latest_billing.status = "refunded"

                # Cancel Stripe subscription immediately
                try:
                    await stripe_config.cancel_subscription(
                        subscription_id=subscription.stripe_subscription_id,
                        prorate=False,
                        invoice_now=False
                    )
                except Exception as stripe_error:
                    logger.error(f"Stripe cancellation failed: {stripe_error}")

                # Update subscription status
                subscription.status = "canceled"
                subscription.cooling_off_end = None

                await session.commit()

                logger.info(
                    f"Refund processed for user {user.id}: "
                    f"Amount: ${latest_billing.total_amount} CAD"
                )

                return RefundResponse(
                    success=True,
                    refund_amount=float(latest_billing.total_amount),
                    refund_id=refund.id if hasattr(refund, 'id') else None
                )

        except Exception as e:
            logger.error(f"Error processing refund: {e}")
            return RefundResponse(
                success=False,
                error="Failed to process refund. Please try again."
            )

    @strawberry.mutation
    async def sync_feature_access(
        self,
        info: Info,
    ) -> PremiumMutationResponse:
        """
        T046: Sync feature access based on current subscription

        Rebuilds feature access records from user's current subscription plan.
        Deletes existing records and creates new ones based on plan features.

        Requires authentication.
        """
        try:
            # Get current user from context
            user = await info.context.get_user()

            if not user:
                return PremiumMutationResponse(
                    success=False,
                    error="Authentication required to sync feature access"
                )

            async for session in get_async_session():
                # Get user's current subscription with plan
                sub_query = select(SubscriptionModel).where(
                    SubscriptionModel.user_id == user.id
                ).options(selectinload(SubscriptionModel.plan))

                sub_result = await session.execute(sub_query)
                subscription = sub_result.scalar_one_or_none()

                if not subscription:
                    return PremiumMutationResponse(
                        success=False,
                        error="No active subscription found"
                    )

                # Delete all existing feature access records for user
                delete_query = select(FeatureAccessModel).where(
                    FeatureAccessModel.user_id == user.id
                )
                delete_result = await session.execute(delete_query)
                existing_features = delete_result.scalars().all()

                for feature in existing_features:
                    await session.delete(feature)

                await session.flush()

                # Get features from subscription plan
                plan = subscription.plan
                features = plan.features if isinstance(plan.features, list) else []

                # Determine access source
                now = datetime.now(timezone.utc)
                is_trial = subscription.is_on_trial()
                access_source = "trial" if is_trial else "subscription"
                access_expires_at = subscription.trial_end if is_trial else None

                # Create new feature access records
                created_count = 0
                for feature_id in features:
                    feature_access = FeatureAccessModel(
                        user_id=user.id,
                        subscription_id=subscription.id,
                        feature_id=feature_id,
                        feature_name=feature_id.replace("_", " ").title(),
                        tier_required=plan.tier,
                        has_access=True,
                        access_source=access_source,
                        access_granted_at=now,
                        access_expires_at=access_expires_at,
                    )
                    session.add(feature_access)
                    created_count += 1

                await session.commit()

                logger.info(
                    f"Feature access synced for user {user.id}: "
                    f"{created_count} features from {plan.tier} plan"
                )

                return PremiumMutationResponse(
                    success=True,
                    message=f"Successfully synced {created_count} features from {plan.display_name}"
                )

        except Exception as e:
            logger.error(f"Error syncing feature access: {e}")
            return PremiumMutationResponse(
                success=False,
                error="Failed to sync feature access. Please try again."
            )

    @strawberry.mutation
    async def update_billing_province(
        self,
        info: Info,
        province: CanadianProvince,
    ) -> PremiumSubscriptionResponse:
        """
        T049: Update user's billing province for tax calculations

        Changes the province used for Canadian tax calculations.
        Updates subscription record and creates audit log.

        Requires authentication.

        Args:
            province: New Canadian province for billing

        Returns:
            PremiumSubscriptionResponse with updated subscription
        """
        try:
            # Get current user from context
            user = await info.context.get_user()

            if not user:
                return PremiumSubscriptionResponse(
                    success=False,
                    error="Authentication required to update billing province"
                )

            async for session in get_async_session():
                # Get user's subscription
                sub_query = select(SubscriptionModel).where(
                    SubscriptionModel.user_id == user.id
                ).options(selectinload(SubscriptionModel.plan))

                sub_result = await session.execute(sub_query)
                subscription = sub_result.scalar_one_or_none()

                if not subscription:
                    return PremiumSubscriptionResponse(
                        success=False,
                        error="No active subscription found"
                    )

                # Store old province for audit log
                old_province = subscription.province

                # Validate province is different
                if old_province == province.value:
                    return PremiumSubscriptionResponse(
                        success=False,
                        error=f"Province is already set to {province.value}"
                    )

                # Update subscription province
                subscription.province = province.value

                # Create audit log entry
                now = datetime.now(timezone.utc)
                billing_record = BillingHistoryModel(
                    user_id=user.id,
                    subscription_id=subscription.id,
                    transaction_type="subscription_charge",
                    description=f"Billing province changed: {old_province} → {province.value}",
                    subtotal=Decimal("0.00"),
                    tax_amount=Decimal("0.00"),
                    total_amount=Decimal("0.00"),
                    currency="CAD",
                    province=province.value,
                    status="succeeded",
                )
                session.add(billing_record)

                await session.commit()

                logger.info(
                    f"Billing province updated for user {user.id}: "
                    f"{old_province} → {province.value}"
                )

                return PremiumSubscriptionResponse(
                    success=True,
                    subscription=model_to_subscription(subscription, subscription.plan)
                )

        except Exception as e:
            logger.error(f"Error updating billing province: {e}")
            return PremiumSubscriptionResponse(
                success=False,
                error="Failed to update billing province. Please try again."
            )


# =============================================================================
# Export Resolvers
# =============================================================================

__all__ = [
    "SubscriptionQueries",
    "SubscriptionMutations",
]
