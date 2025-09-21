"""
Stripe Webhooks API Endpoints for NestSync
Canadian subscription billing webhook handling
"""

import logging
from fastapi import APIRouter, Request, Response, HTTPException, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.database import get_async_session
from app.services.stripe_webhook_service import StripeWebhookService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks/stripe", tags=["Stripe Webhooks"])


@router.post("/subscription-events")
async def handle_stripe_webhooks(
    request: Request,
    session: AsyncSession = Depends(get_async_session)
):
    """
    Handle incoming Stripe webhook events for subscription management
    """
    try:
        # Get raw request body and signature
        body = await request.body()
        signature = request.headers.get("stripe-signature")

        if not signature:
            logger.error("Missing Stripe signature header")
            raise HTTPException(status_code=400, detail="Missing Stripe signature")

        # Initialize webhook service
        webhook_service = StripeWebhookService(session)

        # Process the webhook event
        result = await webhook_service.handle_webhook_event(body, signature)

        logger.info(f"Webhook processed successfully: {result}")

        return JSONResponse(
            content={
                "status": "success",
                "result": result
            },
            status_code=200
        )

    except ValueError as e:
        # Signature verification failed
        logger.error(f"Webhook signature verification failed: {e}")
        raise HTTPException(status_code=400, detail=str(e))

    except Exception as e:
        # Other processing errors
        logger.error(f"Error processing webhook: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/health")
async def webhook_health_check():
    """
    Health check endpoint for Stripe webhook endpoint
    """
    return JSONResponse(
        content={
            "status": "healthy",
            "service": "stripe_webhooks",
            "endpoints": {
                "subscription_events": "/webhooks/stripe/subscription-events"
            }
        },
        status_code=200
    )