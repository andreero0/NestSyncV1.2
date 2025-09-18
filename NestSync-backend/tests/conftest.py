"""
Pytest configuration and fixtures for Emergency Flows testing
"""

import asyncio
import pytest
import uuid
from datetime import datetime, timedelta, timezone
from typing import AsyncGenerator, Dict, Any
from unittest.mock import AsyncMock, MagicMock

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.pool import StaticPool

from app.config.database import get_async_session, Base
from app.models.user import User
from app.models.family import Family
from app.models.child import Child
from app.models.emergency_contact import EmergencyContact
from app.models.emergency_access import EmergencyAccess


# =============================================================================
# Event Loop and Database Configuration
# =============================================================================

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
async def test_engine():
    """Create test database engine with in-memory SQLite."""
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        poolclass=StaticPool,
        connect_args={"check_same_thread": False},
        echo=False,
    )

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield engine
    await engine.dispose()


@pytest.fixture
async def test_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    """Create test database session."""
    async with AsyncSession(test_engine) as session:
        yield session
        await session.rollback()


# =============================================================================
# Emergency Test Data Fixtures
# =============================================================================

@pytest.fixture
def emergency_test_data() -> Dict[str, Any]:
    """Standard test data for emergency scenarios."""
    return {
        "families": {
            "test_family": {
                "id": uuid.UUID("11111111-1111-1111-1111-111111111111"),
                "name": "Emergency Test Family",
                "province": "ON",
                "created_at": datetime.now(timezone.utc)
            }
        },
        "users": {
            "test_parent": {
                "id": uuid.UUID("22222222-2222-2222-2222-222222222222"),
                "email": "emergency.parent@test.com",
                "first_name": "Emergency",
                "last_name": "Parent",
                "is_verified": True,
                "created_at": datetime.now(timezone.utc)
            }
        },
        "children": {
            "test_child": {
                "id": uuid.UUID("33333333-3333-3333-3333-333333333333"),
                "family_id": uuid.UUID("11111111-1111-1111-1111-111111111111"),
                "name": "Emergency Test Child",
                "birthdate": datetime(2020, 1, 15),
                "medical_conditions": ["Asthma", "Peanut Allergy"],
                "medications": ["Ventolin Inhaler", "EpiPen"],
                "created_at": datetime.now(timezone.utc)
            }
        },
        "emergency_contacts": [
            {
                "id": uuid.UUID("44444444-4444-4444-4444-444444444444"),
                "child_id": uuid.UUID("33333333-3333-3333-3333-333333333333"),
                "family_id": uuid.UUID("11111111-1111-1111-1111-111111111111"),
                "name": "Grandmother Smith",
                "relationship": "Grandmother",
                "phone_primary": "+1-416-555-0001",
                "is_primary": True,
                "priority_order": 1,
                "can_make_medical_decisions": True,
                "can_pickup": True,
                "province": "ON",
                "speaks_english": True,
                "speaks_french": False
            },
            {
                "id": uuid.UUID("55555555-5555-5555-5555-555555555555"),
                "child_id": uuid.UUID("33333333-3333-3333-3333-333333333333"),
                "family_id": uuid.UUID("11111111-1111-1111-1111-111111111111"),
                "name": "Uncle John",
                "relationship": "Uncle",
                "phone_primary": "+1-416-555-0002",
                "is_primary": False,
                "priority_order": 2,
                "can_make_medical_decisions": False,
                "can_pickup": True,
                "province": "ON",
                "speaks_english": True,
                "speaks_french": True
            }
        ]
    }


@pytest.fixture
async def emergency_family(test_session: AsyncSession, emergency_test_data: Dict[str, Any]) -> Family:
    """Create test family for emergency scenarios."""
    family_data = emergency_test_data["families"]["test_family"]
    family = Family(**family_data)

    test_session.add(family)
    await test_session.commit()
    await test_session.refresh(family)

    return family


@pytest.fixture
async def emergency_user(test_session: AsyncSession, emergency_test_data: Dict[str, Any]) -> User:
    """Create test user for emergency scenarios."""
    user_data = emergency_test_data["users"]["test_parent"]
    user = User(**user_data)

    test_session.add(user)
    await test_session.commit()
    await test_session.refresh(user)

    return user


@pytest.fixture
async def emergency_child(
    test_session: AsyncSession,
    emergency_family: Family,
    emergency_test_data: Dict[str, Any]
) -> Child:
    """Create test child for emergency scenarios."""
    child_data = emergency_test_data["children"]["test_child"]
    child = Child(**child_data)

    test_session.add(child)
    await test_session.commit()
    await test_session.refresh(child)

    return child


@pytest.fixture
async def emergency_contacts(
    test_session: AsyncSession,
    emergency_child: Child,
    emergency_test_data: Dict[str, Any]
) -> list[EmergencyContact]:
    """Create emergency contacts for test child."""
    contacts = []

    for contact_data in emergency_test_data["emergency_contacts"]:
        contact = EmergencyContact(**contact_data)
        test_session.add(contact)
        contacts.append(contact)

    await test_session.commit()

    for contact in contacts:
        await test_session.refresh(contact)

    return contacts


@pytest.fixture
async def emergency_access_token(
    test_session: AsyncSession,
    emergency_family: Family,
    emergency_child: Child,
    emergency_user: User
) -> EmergencyAccess:
    """Create emergency access token for testing."""
    access_token = EmergencyAccess.create_emergency_access(
        family_id=str(emergency_family.id),
        child_id=str(emergency_child.id),
        created_by=str(emergency_user.id),
        duration_hours=24,
        recipient_name="Test Caregiver",
        purpose="Babysitting emergency access"
    )

    test_session.add(access_token)
    await test_session.commit()
    await test_session.refresh(access_token)

    return access_token


# =============================================================================
# Performance Testing Utilities
# =============================================================================

@pytest.fixture
def performance_timer():
    """Utility for measuring performance in tests."""
    import time

    class PerformanceTimer:
        def __init__(self):
            self.start_time = None
            self.end_time = None

        def start(self):
            self.start_time = time.perf_counter()
            return self

        def stop(self):
            self.end_time = time.perf_counter()
            return self

        def elapsed_ms(self) -> float:
            if self.start_time is None or self.end_time is None:
                raise ValueError("Timer not properly started/stopped")
            return (self.end_time - self.start_time) * 1000

        def assert_under_ms(self, max_ms: float, message: str = ""):
            elapsed = self.elapsed_ms()
            assert elapsed < max_ms, f"{message} - Expected < {max_ms}ms, got {elapsed:.2f}ms"

    return PerformanceTimer()


# =============================================================================
# Network and Offline Simulation
# =============================================================================

@pytest.fixture
def offline_simulator():
    """Simulate offline conditions for testing."""
    class OfflineSimulator:
        def __init__(self):
            self.is_offline = False
            self.original_http_methods = {}

        def enable_offline(self):
            """Enable offline mode - mock network failures."""
            self.is_offline = True
            # Mock network methods to raise connection errors
            import httpx
            import aiohttp

            async def mock_http_error(*args, **kwargs):
                raise ConnectionError("Simulated offline condition")

            # Store original methods for restoration
            self.original_http_methods['httpx_get'] = httpx.AsyncClient.get
            self.original_http_methods['aiohttp_get'] = aiohttp.ClientSession.get

            # Replace with error-raising versions
            httpx.AsyncClient.get = mock_http_error
            aiohttp.ClientSession.get = mock_http_error

        def disable_offline(self):
            """Restore normal network conditions."""
            self.is_offline = False
            # Restore original methods
            if self.original_http_methods:
                import httpx
                import aiohttp

                httpx.AsyncClient.get = self.original_http_methods.get('httpx_get')
                aiohttp.ClientSession.get = self.original_http_methods.get('aiohttp_get')

                self.original_http_methods.clear()

        def __enter__(self):
            self.enable_offline()
            return self

        def __exit__(self, exc_type, exc_val, exc_tb):
            self.disable_offline()

    return OfflineSimulator()


# =============================================================================
# PIPEDA Compliance Testing
# =============================================================================

@pytest.fixture
def pipeda_validator():
    """Validator for PIPEDA compliance requirements."""
    class PIPEDAValidator:

        def validate_consent_logging(self, access_log: list) -> bool:
            """Validate that access is properly logged for PIPEDA compliance."""
            required_fields = ["accessed_at", "ip_address", "user_agent", "action", "success"]

            for log_entry in access_log:
                for field in required_fields:
                    if field not in log_entry:
                        return False

            return True

        def validate_data_minimization(self, access_permissions: dict, accessed_data: dict) -> bool:
            """Validate that only permitted data is accessible."""
            if not access_permissions.get("can_view_medical", False):
                if "medical_conditions" in accessed_data or "medications" in accessed_data:
                    return False

            if not access_permissions.get("can_view_contacts", False):
                if "emergency_contacts" in accessed_data:
                    return False

            if not access_permissions.get("can_view_location", False):
                if "location" in accessed_data or "gps_coords" in accessed_data:
                    return False

            return True

        def validate_canadian_residency(self, data_storage_info: dict) -> bool:
            """Validate that data is stored in Canadian jurisdiction."""
            allowed_regions = ["ca-central-1", "ca-west-1", "canada", "ontario", "british-columbia"]
            storage_region = data_storage_info.get("region", "").lower()

            return any(region in storage_region for region in allowed_regions)

        def validate_expiry_enforcement(self, access_token: EmergencyAccess) -> bool:
            """Validate that expired tokens are properly rejected."""
            return not access_token.is_valid() if access_token.expires_at < datetime.now(timezone.utc) else True

    return PIPEDAValidator()


# =============================================================================
# Emergency Scenario Simulators
# =============================================================================

@pytest.fixture
def emergency_scenario_simulator():
    """Simulate various emergency scenarios."""
    class EmergencyScenarioSimulator:

        def simulate_parent_panic(self) -> dict:
            """Simulate a panicked parent needing quick access."""
            return {
                "scenario": "parent_panic",
                "urgency": "high",
                "user_state": "stressed",
                "required_actions": ["quick_contact_access", "medical_info_display"],
                "max_interaction_time": 3000,  # 3 seconds max
                "max_load_time": 100  # 100ms max
            }

        def simulate_caregiver_emergency(self, access_code: str) -> dict:
            """Simulate caregiver using emergency access."""
            return {
                "scenario": "caregiver_emergency",
                "access_code": access_code,
                "urgency": "medium",
                "user_state": "concerned",
                "required_actions": ["validate_access", "view_medical_info", "contact_parents"],
                "max_load_time": 200  # 200ms max for validation
            }

        def simulate_healthcare_provider(self, professional_access: str) -> dict:
            """Simulate healthcare provider accessing medical data."""
            return {
                "scenario": "healthcare_provider",
                "access_code": professional_access,
                "urgency": "critical",
                "user_state": "professional",
                "required_actions": ["comprehensive_medical_view", "provider_contacts", "export_summary"],
                "max_load_time": 500  # 500ms for comprehensive data
            }

        def simulate_911_operator(self, qr_code_data: dict) -> dict:
            """Simulate 911 operator accessing via QR code."""
            return {
                "scenario": "911_operator",
                "qr_data": qr_code_data,
                "urgency": "critical",
                "user_state": "emergency_responder",
                "required_actions": ["immediate_info_access", "contact_display", "medical_alerts"],
                "max_load_time": 50  # 50ms for life-critical information
            }

    return EmergencyScenarioSimulator()


# =============================================================================
# Mock Services
# =============================================================================

@pytest.fixture
def mock_supabase():
    """Mock Supabase client for testing."""
    mock = MagicMock()
    mock.auth.get_user.return_value = {"user": {"id": "test-user-id"}}
    mock.table.return_value.select.return_value.execute.return_value = {"data": []}
    return mock


@pytest.fixture
def mock_redis():
    """Mock Redis client for testing."""
    mock = AsyncMock()
    mock.get.return_value = None
    mock.set.return_value = True
    mock.exists.return_value = False
    return mock


# =============================================================================
# Test Environment Configuration
# =============================================================================

@pytest.fixture(autouse=True)
def test_environment(monkeypatch):
    """Set up test environment variables."""
    monkeypatch.setenv("ENVIRONMENT", "test")
    monkeypatch.setenv("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
    monkeypatch.setenv("REDIS_URL", "redis://localhost:6379/15")  # Test database
    monkeypatch.setenv("SUPABASE_URL", "https://test.supabase.co")
    monkeypatch.setenv("SUPABASE_ANON_KEY", "test-anon-key")
    monkeypatch.setenv("JWT_SECRET_KEY", "test-secret-key-for-emergency-flows")
    monkeypatch.setenv("RATE_LIMITING_ENABLED", "false")


# =============================================================================
# GraphQL Testing Utilities
# =============================================================================

@pytest.fixture
def graphql_test_client():
    """GraphQL test client for emergency flow testing."""
    from fastapi.testclient import TestClient
    from app.main import app

    class GraphQLTestClient:
        def __init__(self):
            self.client = TestClient(app)

        async def execute_query(self, query: str, variables: dict = None, headers: dict = None):
            """Execute GraphQL query."""
            response = self.client.post(
                "/graphql",
                json={"query": query, "variables": variables or {}},
                headers=headers or {}
            )
            return response.json()

        async def create_emergency_access(self, family_id: str, child_id: str = None, **kwargs):
            """Helper to create emergency access via GraphQL."""
            mutation = """
                mutation CreateEmergencyAccess($input: CreateEmergencyAccessInput!) {
                    createEmergencyAccess(input: $input) {
                        success
                        emergencyAccess {
                            id
                            accessCode
                            accessToken
                            expiresAt
                        }
                        errors
                    }
                }
            """
            variables = {
                "input": {
                    "familyId": family_id,
                    "childId": child_id,
                    **kwargs
                }
            }
            return await self.execute_query(mutation, variables)

    return GraphQLTestClient()