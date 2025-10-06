"""
Stripe REST Endpoints for Premium Subscription System
PIPEDA-compliant Canadian payment processing

This module implements REST endpoints for Stripe payment intents:
- POST /api/stripe/setup-intent: Create SetupIntent for saving payment methods
- POST /api/stripe/payment-intent: Create PaymentIntent for immediate charges

Backend requirements for frontend CardField integration:
- Returns client secrets for Stripe SDK confirmation
- Handles Canadian tax calculations (GST/PST/HST)
- Integrates with existing StripeConfig helper methods
- PIPEDA-compliant metadata and audit logging
"""

import logging
import stripe
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel, Field
from decimal import Decimal

from app.auth.dependencies import get_current_user, get_request_context, RequestContext
from app.models import User
from app.config.stripe import get_stripe_config
from app.config.database import get_async_session
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/stripe", tags=["Stripe", "Payment"])


# =============================================================================
# REQUEST/RESPONSE MODELS
# =============================================================================

class SetupIntentResponse(BaseModel):
    """Response for SetupIntent creation"""
    clientSecret: str = Field(..., description="Stripe SetupIntent client secret")
    setupIntentId: str = Field(..., description="Stripe SetupIntent ID")


class PaymentIntentRequest(BaseModel):
    """Request for PaymentIntent creation"""
    amount: int = Field(..., description="Amount in cents (e.g., 2999 = $29.99 CAD)", gt=0)
    currency: str = Field(default="CAD", description="ISO currency code")
    paymentMethodId: Optional[str] = Field(None, description="Existing payment method ID")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional payment metadata")


class PaymentIntentResponse(BaseModel):
    """Response for PaymentIntent creation"""
    clientSecret: str = Field(..., description="Stripe PaymentIntent client secret")
    paymentIntentId: str = Field(..., description="Stripe PaymentIntent ID")
    amount: int = Field(..., description="Total amount including tax (cents)")
    currency: str = Field(..., description="Currency code")


class ErrorResponse(BaseModel):
    """Error response model"""
    error: str = Field(..., description="Human-readable error message")
    code: str = Field(..., description="Error code")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional error details")


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

async def get_or_create_stripe_customer(
    user: User,
    session: AsyncSession,
    stripe_config
) -> str:
    """
    Get existing Stripe customer ID or create new customer

    Args:
        user: Current authenticated user
        session: Database session
        stripe_config: StripeConfig instance

    Returns:
        Stripe Customer ID
    """
    # Check if user already has Stripe customer ID
    if user.stripe_customer_id:
        logger.info(f"Using existing Stripe customer for user {user.id}: {user.stripe_customer_id}")
        return user.stripe_customer_id

    # Create new Stripe customer
    try:
        customer = await stripe_config.create_customer(
            user_id=str(user.id),
            email=user.email,
            name=user.full_name,
            province=user.province,
            metadata={
                "nestsync_user_id": str(user.id),
                "environment": "production" if not user.email.endswith("@nestsync.com") else "development"
            }
        )

        # Update user with Stripe customer ID
        user.stripe_customer_id = customer.id
        await session.commit()

        logger.info(f"Created new Stripe customer for user {user.id}: {customer.id}")
        return customer.id

    except Exception as e:
        logger.error(f"Failed to create Stripe customer for user {user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to initialize payment customer"
        )


def calculate_canadian_tax(amount_cents: int, province: Optional[str]) -> int:
    """
    Calculate Canadian tax amount based on province

    Args:
        amount_cents: Base amount in cents
        province: Canadian province code (ON, BC, AB, etc.)

    Returns:
        Tax amount in cents
    """
    # Canadian tax rates by province
    TAX_RATES = {
        "AB": 0.05,  # 5% GST
        "BC": 0.12,  # 5% GST + 7% PST
        "MB": 0.12,  # 5% GST + 7% PST
        "NB": 0.15,  # 15% HST
        "NL": 0.15,  # 15% HST
        "NT": 0.05,  # 5% GST
        "NS": 0.15,  # 15% HST
        "NU": 0.05,  # 5% GST
        "ON": 0.13,  # 13% HST
        "PE": 0.15,  # 15% HST
        "QC": 0.14975,  # 5% GST + 9.975% QST
        "SK": 0.11,  # 5% GST + 6% PST
        "YT": 0.05,  # 5% GST
    }

    # Default to ON if province not specified
    tax_rate = TAX_RATES.get(province or "ON", 0.13)
    tax_amount = int(amount_cents * tax_rate)

    logger.debug(f"Calculated tax for {province or 'ON'}: ${amount_cents/100:.2f} × {tax_rate*100}% = ${tax_amount/100:.2f}")
    return tax_amount


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.post(
    "/setup-intent",
    response_model=SetupIntentResponse,
    responses={
        200: {"description": "SetupIntent created successfully"},
        400: {"model": ErrorResponse, "description": "Bad request"},
        401: {"description": "Unauthorized"},
        500: {"model": ErrorResponse, "description": "Internal server error"}
    },
    summary="Create Setup Intent",
    description="Create Stripe SetupIntent for saving payment methods without charging. Used by CardField for payment method collection."
)
async def create_setup_intent(
    request: Request,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session),
    request_context: RequestContext = Depends(get_request_context)
):
    """
    Create a Stripe Setup Intent for saving payment methods.

    This endpoint is called by the frontend CardField component to obtain
    a client secret for payment method collection without charging.

    Flow:
    1. Get or create Stripe customer for user
    2. Create SetupIntent with customer ID
    3. Return client secret for frontend confirmation

    **Frontend Usage:**
    ```typescript
    const result = await stripeService.createSetupIntent();
    const { clientSecret } = result;
    // Use clientSecret with CardField
    ```
    """
    try:
        stripe_config = get_stripe_config()

        # Get or create Stripe customer
        customer_id = await get_or_create_stripe_customer(current_user, session, stripe_config)

        # Create SetupIntent
        setup_intent = stripe.SetupIntent.create(
            customer=customer_id,
            payment_method_types=["card"],
            usage="off_session",  # For future charges
            metadata={
                "user_id": str(current_user.id),
                "nestsync_customer": "true",
                "ip_address": request_context.ip_address,
                "user_agent": request_context.user_agent,
            }
        )

        logger.info(
            f"Created SetupIntent {setup_intent.id} for user {current_user.id} "
            f"(customer {customer_id})"
        )

        return SetupIntentResponse(
            clientSecret=setup_intent.client_secret,
            setupIntentId=setup_intent.id
        )

    except stripe.error.StripeError as e:
        logger.error(f"Stripe error creating SetupIntent: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=ErrorResponse(
                error=str(e),
                code="SETUP_INTENT_CREATION_FAILED",
                details={
                    "stripeErrorType": type(e).__name__,
                    "stripeErrorCode": getattr(e, "code", None)
                }
            ).dict()
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error creating SetupIntent: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ErrorResponse(
                error="Failed to create payment setup intent",
                code="INTERNAL_ERROR"
            ).dict()
        )


@router.post(
    "/payment-intent",
    response_model=PaymentIntentResponse,
    responses={
        200: {"description": "PaymentIntent created successfully"},
        400: {"model": ErrorResponse, "description": "Bad request"},
        401: {"description": "Unauthorized"},
        500: {"model": ErrorResponse, "description": "Internal server error"}
    },
    summary="Create Payment Intent",
    description="Create Stripe PaymentIntent for immediate charges (e.g., trial conversion). Includes Canadian tax calculation."
)
async def create_payment_intent(
    payment_request: PaymentIntentRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session),
    request_context: RequestContext = Depends(get_request_context)
):
    """
    Create a Stripe Payment Intent for immediate charges.

    This endpoint is called when processing immediate payments, such as:
    - Trial to paid subscription conversion
    - One-time purchases
    - Subscription plan changes

    Flow:
    1. Get or create Stripe customer for user
    2. Calculate Canadian tax based on user's province
    3. Create PaymentIntent with total amount (base + tax)
    4. Return client secret for frontend confirmation

    **Canadian Tax Compliance:**
    - Automatically calculates GST/PST/HST based on province
    - Includes tax breakdown in metadata for audit trails
    - PIPEDA-compliant metadata tracking

    **Frontend Usage:**
    ```typescript
    const result = await stripeService.createPaymentIntent(2999, 'CAD');
    const { clientSecret } = result;
    // Use clientSecret with confirmPayment
    ```
    """
    try:
        stripe_config = get_stripe_config()

        # Get or create Stripe customer
        customer_id = await get_or_create_stripe_customer(current_user, session, stripe_config)

        # Calculate Canadian tax
        base_amount = payment_request.amount
        tax_amount = calculate_canadian_tax(base_amount, current_user.province)
        total_amount = base_amount + tax_amount

        # Prepare metadata
        metadata = {
            "user_id": str(current_user.id),
            "base_amount": base_amount,
            "tax_amount": tax_amount,
            "province": current_user.province or "ON",
            "ip_address": request_context.ip_address,
            "user_agent": request_context.user_agent,
            **(payment_request.metadata or {})
        }

        # Create PaymentIntent
        payment_intent_params = {
            "customer": customer_id,
            "amount": total_amount,
            "currency": payment_request.currency.lower(),
            "confirmation_method": "manual",  # Confirm on frontend
            "metadata": metadata
        }

        # Include existing payment method if provided
        if payment_request.paymentMethodId:
            payment_intent_params["payment_method"] = payment_request.paymentMethodId

        payment_intent = stripe.PaymentIntent.create(**payment_intent_params)

        logger.info(
            f"Created PaymentIntent {payment_intent.id} for user {current_user.id} "
            f"(customer {customer_id}): ${total_amount/100:.2f} {payment_request.currency} "
            f"(base: ${base_amount/100:.2f}, tax: ${tax_amount/100:.2f})"
        )

        return PaymentIntentResponse(
            clientSecret=payment_intent.client_secret,
            paymentIntentId=payment_intent.id,
            amount=total_amount,
            currency=payment_request.currency
        )

    except stripe.error.StripeError as e:
        logger.error(f"Stripe error creating PaymentIntent: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=ErrorResponse(
                error=str(e),
                code="PAYMENT_INTENT_CREATION_FAILED",
                details={
                    "stripeErrorType": type(e).__name__,
                    "stripeErrorCode": getattr(e, "code", None),
                    "declineCode": getattr(e, "decline_code", None)
                }
            ).dict()
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error creating PaymentIntent: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ErrorResponse(
                error="Failed to create payment intent",
                code="INTERNAL_ERROR"
            ).dict()
        )


# =============================================================================
# HEALTH CHECK ENDPOINT
# =============================================================================

@router.get(
    "/health",
    tags=["Health"],
    summary="Stripe Service Health Check",
    description="Check Stripe API connectivity and configuration"
)
async def stripe_health_check():
    """
    Health check for Stripe integration

    Verifies:
    - Stripe API key is configured
    - Stripe SDK is initialized
    - Basic API connectivity
    """
    try:
        stripe_config = get_stripe_config()

        # Simple API call to verify connectivity
        stripe.Balance.retrieve()

        return {
            "status": "healthy",
            "service": "stripe",
            "currency": stripe_config.default_currency,
            "country": stripe_config.default_country
        }
    except Exception as e:
        logger.error(f"Stripe health check failed: {e}")
        return {
            "status": "unhealthy",
            "service": "stripe",
            "error": str(e)
        }
