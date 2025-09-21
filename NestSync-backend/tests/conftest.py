"""
Test Configuration and Fixtures for NestSync Backend
PIPEDA-compliant Canadian diaper planning application
"""

import pytest
import asyncio
from typing import AsyncGenerator, Generator
from unittest.mock import AsyncMock, MagicMock
from datetime import datetime, timezone, date
from decimal import Decimal

import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from httpx import AsyncClient
from fastapi.testclient import TestClient

from app.config.database import get_async_session, Base
from app.config.settings import Settings
from app.models import User, Child, ReorderSubscription, RetailerConfiguration
from app.services import ReorderService, RetailerAPIService, StripeWebhookService
from main import app


# =============================================================================
# Test Configuration
# =============================================================================

@pytest.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
def test_settings() -> Settings:
    """Test application settings"""
    return Settings(
        environment="testing",
        database_url="postgresql+asyncpg://postgres:test@localhost:5432/nestsync_test",
        secret_key="test-secret-key-for-testing-only",
        supabase_url="https://test.supabase.co",
        supabase_key="test-key",
        supabase_service_key="test-service-key",
        supabase_jwt_secret="test-jwt-secret",
        stripe_secret_key="sk_test_test_key",
        stripe_publishable_key="pk_test_test_key",
        stripe_webhook_secret="whsec_test_secret",
        stripe_basic_price_id="price_test_basic",
        stripe_premium_price_id="price_test_premium",
        stripe_family_price_id="price_test_family",
        redis_url="redis://localhost:6379/1",
        log_level="WARNING",
        debug=False
    )


# =============================================================================
# Database Fixtures
# =============================================================================

@pytest_asyncio.fixture(scope="session")
async def test_engine():
    """Create test database engine"""
    engine = create_async_engine(
        "postgresql+asyncpg://postgres:test@localhost:5432/nestsync_test",
        echo=False
    )

    # Create all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    # Drop all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()


@pytest_asyncio.fixture
async def test_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    """Create test database session"""
    async_session = sessionmaker(
        test_engine, class_=AsyncSession, expire_on_commit=False
    )

    async with async_session() as session:
        # Start transaction
        await session.begin()

        try:
            yield session
        finally:
            # Rollback transaction
            await session.rollback()


@pytest.fixture
def override_get_session(test_session):
    """Override get_async_session dependency for testing"""
    async def _override_get_session():
        yield test_session

    app.dependency_overrides[get_async_session] = _override_get_session
    yield
    app.dependency_overrides.clear()


# =============================================================================
# Model Fixtures
# =============================================================================

@pytest_asyncio.fixture
async def test_user(test_session: AsyncSession) -> User:
    """Create test user"""
    user = User(
        id="test-user-123",
        email="test@nestsync.com",
        first_name="Test",
        last_name="User",
        phone_number="+1234567890",
        date_of_birth=date(1990, 1, 1),
        province="ON",
        is_active=True,
        email_verified=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )

    test_session.add(user)
    await test_session.commit()
    await test_session.refresh(user)

    return user


@pytest_asyncio.fixture
async def test_child(test_session: AsyncSession, test_user: User) -> Child:
    """Create test child"""
    child = Child(
        id="test-child-123",
        parent_id=test_user.id,
        name="Test Baby",
        date_of_birth=date(2023, 6, 15),
        current_diaper_size="Size 2",
        gender="prefer_not_to_say",
        weight_kg=Decimal("8.5"),
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )

    test_session.add(child)
    await test_session.commit()
    await test_session.refresh(child)

    return child


# =============================================================================
# Service Fixtures
# =============================================================================

@pytest_asyncio.fixture
async def reorder_service(test_session: AsyncSession) -> ReorderService:
    """Create reorder service instance"""
    return ReorderService(test_session)


# =============================================================================
# Mock Fixtures
# =============================================================================

@pytest.fixture
def mock_stripe():
    """Mock Stripe client"""
    with pytest.mock.patch("stripe.Customer") as mock_customer, \
         pytest.mock.patch("stripe.Subscription") as mock_subscription:

        # Configure mock responses
        mock_customer.create.return_value = MagicMock(id="cus_test_123")
        mock_subscription.create.return_value = MagicMock(
            id="sub_test_123",
            current_period_start=1640995200,
            current_period_end=1643673600
        )

        yield {
            "customer": mock_customer,
            "subscription": mock_subscription
        }


@pytest.fixture
def canadian_test_data():
    """Canadian-specific test data for PIPEDA compliance testing"""
    return {
        "provinces": ["ON", "BC", "AB", "MB", "NB", "NL", "NS", "NT", "NU", "PE", "QC", "SK", "YT"],
        "tax_rates": {
            "ON": {"gst": 0.00, "hst": 0.13},
            "BC": {"gst": 0.05, "pst": 0.07},
            "AB": {"gst": 0.05, "pst": 0.00}
        }
    }