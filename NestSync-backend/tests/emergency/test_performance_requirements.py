"""
Performance tests for Emergency Flows - verifying <100ms access requirements
"""

import pytest
import asyncio
from datetime import datetime, timezone
from unittest.mock import AsyncMock, patch

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.emergency_contact import EmergencyContact
from app.models.emergency_access import EmergencyAccess
from app.models.child import Child


class TestEmergencyPerformanceRequirements:
    """Test emergency access performance requirements (<100ms)."""

    @pytest.mark.asyncio
    async def test_emergency_contact_retrieval_speed(
        self,
        test_session: AsyncSession,
        emergency_child: Child,
        emergency_contacts: list[EmergencyContact],
        performance_timer
    ):
        """Test that emergency contact retrieval meets <100ms requirement."""
        # Simulate real database query
        timer = performance_timer.start()

        stmt = select(EmergencyContact).where(
            EmergencyContact.child_id == emergency_child.id
        ).order_by(EmergencyContact.priority_order)

        result = await test_session.execute(stmt)
        contacts = result.scalars().all()

        timer.stop()

        # Assert performance requirement
        timer.assert_under_ms(100, "Emergency contact retrieval")

        # Verify data integrity
        assert len(contacts) == 2
        assert contacts[0].is_primary is True

    @pytest.mark.asyncio
    async def test_emergency_access_validation_speed(
        self,
        emergency_access_token: EmergencyAccess,
        performance_timer
    ):
        """Test that access token validation meets <50ms requirement."""
        timer = performance_timer.start()

        is_valid = emergency_access_token.is_valid()

        timer.stop()

        # Assert stricter performance requirement for validation
        timer.assert_under_ms(50, "Emergency access validation")

        # Verify result
        assert is_valid is True

    @pytest.mark.asyncio
    async def test_qr_code_generation_speed(
        self,
        emergency_access_token: EmergencyAccess,
        performance_timer
    ):
        """Test that QR code data generation meets <200ms requirement."""
        base_url = "https://nestsync.ca"

        timer = performance_timer.start()

        qr_data = emergency_access_token.get_qr_code_data(base_url)

        timer.stop()

        # QR code generation has slightly higher tolerance
        timer.assert_under_ms(200, "QR code data generation")

        # Verify data structure
        assert "url" in qr_data
        assert "code" in qr_data
        assert "expires" in qr_data

    @pytest.mark.asyncio
    async def test_medical_info_access_speed(
        self,
        test_session: AsyncSession,
        emergency_child: Child,
        performance_timer
    ):
        """Test medical information access speed for emergency scenarios."""
        timer = performance_timer.start()

        # Simulate medical info retrieval query
        stmt = select(Child).where(Child.id == emergency_child.id)
        result = await test_session.execute(stmt)
        child = result.scalar_one()

        # Access medical fields
        medical_conditions = child.medical_conditions
        medications = child.medications

        timer.stop()

        # Critical medical info must be fastest
        timer.assert_under_ms(50, "Medical information access")

        # Verify medical data
        assert "Asthma" in medical_conditions
        assert "EpiPen" in medications

    @pytest.mark.asyncio
    async def test_concurrent_emergency_access(
        self,
        test_session: AsyncSession,
        emergency_child: Child,
        emergency_access_token: EmergencyAccess,
        performance_timer
    ):
        """Test performance under concurrent emergency access load."""

        async def emergency_access_simulation():
            """Simulate single emergency access."""
            # Validate token
            is_valid = emergency_access_token.is_valid()

            # Get emergency contacts
            stmt = select(EmergencyContact).where(
                EmergencyContact.child_id == emergency_child.id
            )
            result = await test_session.execute(stmt)
            contacts = result.scalars().all()

            # Get medical info
            stmt = select(Child).where(Child.id == emergency_child.id)
            result = await test_session.execute(stmt)
            child = result.scalar_one()

            return {
                "valid": is_valid,
                "contacts": len(contacts),
                "medical": len(child.medical_conditions or [])
            }

        # Run 10 concurrent access attempts
        timer = performance_timer.start()

        tasks = [emergency_access_simulation() for _ in range(10)]
        results = await asyncio.gather(*tasks)

        timer.stop()

        # Even with 10 concurrent accesses, should complete within reasonable time
        timer.assert_under_ms(500, "10 concurrent emergency accesses")

        # Verify all accesses succeeded
        assert len(results) == 10
        for result in results:
            assert result["valid"] is True
            assert result["contacts"] > 0
            assert result["medical"] > 0

    @pytest.mark.asyncio
    async def test_offline_cache_access_speed(
        self,
        emergency_contacts: list[EmergencyContact],
        performance_timer
    ):
        """Test cached emergency data access speed for offline scenarios."""
        # Simulate cached emergency data
        cached_data = {
            "contacts": [contact.to_emergency_dict() for contact in emergency_contacts],
            "child_medical": {
                "conditions": ["Asthma", "Peanut Allergy"],
                "medications": ["Ventolin Inhaler", "EpiPen"],
                "allergies": ["Peanuts", "Tree Nuts"]
            },
            "last_updated": datetime.now(timezone.utc).isoformat()
        }

        timer = performance_timer.start()

        # Simulate cache retrieval and processing
        contacts = cached_data["contacts"]
        medical_info = cached_data["child_medical"]

        # Sort contacts by priority (emergency UI requirement)
        sorted_contacts = sorted(contacts, key=lambda c: c["priority_order"])
        primary_contact = next((c for c in contacts if c["is_primary"]), None)

        timer.stop()

        # Offline cache access must be very fast
        timer.assert_under_ms(10, "Offline cached data access")

        # Verify data integrity
        assert len(sorted_contacts) == 2
        assert primary_contact is not None
        assert "Asthma" in medical_info["conditions"]

    @pytest.mark.asyncio
    async def test_emergency_contact_calling_preparation(
        self,
        emergency_contacts: list[EmergencyContact],
        performance_timer
    ):
        """Test speed of preparing contact information for one-touch calling."""
        timer = performance_timer.start()

        # Get primary contact for immediate calling
        primary_contact = next((c for c in emergency_contacts if c.is_primary), None)

        # Format phone number for calling
        if primary_contact:
            formatted_phone = primary_contact.get_formatted_primary_phone()
            call_data = {
                "name": primary_contact.name,
                "phone": formatted_phone,
                "relationship": primary_contact.relationship,
                "can_make_medical_decisions": primary_contact.can_make_medical_decisions
            }

        timer.stop()

        # Call preparation must be instant
        timer.assert_under_ms(5, "Emergency call preparation")

        # Verify call data
        assert call_data["name"] == "Grandmother Smith"
        assert call_data["phone"] == "(416) 555-0001"
        assert call_data["can_make_medical_decisions"] is True

    @pytest.mark.asyncio
    async def test_token_generation_performance(self, performance_timer):
        """Test emergency access token generation speed."""
        timer = performance_timer.start()

        # Generate multiple tokens (batch creation scenario)
        tokens = []
        for i in range(5):
            access_token = EmergencyAccess.generate_access_token()
            access_code = EmergencyAccess.generate_access_code()
            tokens.append((access_token, access_code))

        timer.stop()

        # Token generation should be fast even in batches
        timer.assert_under_ms(50, "5 token generation batch")

        # Verify uniqueness
        assert len(set(token[0] for token in tokens)) == 5  # All tokens unique
        assert len(set(token[1] for token in tokens)) == 5  # All codes unique

    @pytest.mark.asyncio
    async def test_access_logging_performance(
        self,
        emergency_access_token: EmergencyAccess,
        performance_timer
    ):
        """Test access logging performance to ensure it doesn't slow down access."""
        timer = performance_timer.start()

        # Record multiple access attempts (rapid successive access)
        for i in range(10):
            emergency_access_token.record_access(
                ip_address=f"192.168.1.{i + 100}",
                user_agent="Emergency Test Browser",
                action=f"view_action_{i}"
            )

        timer.stop()

        # Logging must not significantly impact access speed
        timer.assert_under_ms(50, "10 access log entries")

        # Verify logging worked
        assert len(emergency_access_token.access_log) == 10
        assert emergency_access_token.use_count == 10

    @pytest.mark.asyncio
    async def test_real_world_emergency_scenario_timing(
        self,
        test_session: AsyncSession,
        emergency_child: Child,
        emergency_contacts: list[EmergencyContact],
        emergency_access_token: EmergencyAccess,
        performance_timer
    ):
        """Test complete emergency scenario timing (parent panic scenario)."""
        timer = performance_timer.start()

        # Complete emergency access workflow:
        # 1. Validate access (caregiver scans QR code)
        is_valid = emergency_access_token.is_valid()

        # 2. Get child medical info
        stmt = select(Child).where(Child.id == emergency_child.id)
        result = await test_session.execute(stmt)
        child = result.scalar_one()

        # 3. Get emergency contacts sorted by priority
        stmt = select(EmergencyContact).where(
            EmergencyContact.child_id == emergency_child.id
        ).order_by(EmergencyContact.priority_order)
        result = await test_session.execute(stmt)
        contacts = result.scalars().all()

        # 4. Prepare primary contact for calling
        primary_contact = contacts[0] if contacts else None
        call_ready_data = None
        if primary_contact:
            call_ready_data = {
                "name": primary_contact.name,
                "phone": primary_contact.get_formatted_primary_phone(),
                "can_make_decisions": primary_contact.can_make_medical_decisions
            }

        # 5. Log the access
        emergency_access_token.record_access(
            ip_address="192.168.1.200",
            user_agent="Emergency Mobile Browser",
            action="complete_emergency_access"
        )

        timer.stop()

        # Complete emergency scenario must be under 100ms
        timer.assert_under_ms(100, "Complete emergency access scenario")

        # Verify scenario completed successfully
        assert is_valid is True
        assert child.medical_conditions is not None
        assert len(contacts) == 2
        assert call_ready_data is not None
        assert call_ready_data["phone"] == "(416) 555-0001"

    @pytest.mark.asyncio
    async def test_memory_efficiency_during_emergency_access(
        self,
        emergency_contacts: list[EmergencyContact],
        emergency_access_token: EmergencyAccess
    ):
        """Test memory usage during emergency access operations."""
        import sys

        # Get baseline memory usage
        initial_size = sys.getsizeof(emergency_contacts) + sys.getsizeof(emergency_access_token)

        # Perform emergency operations
        emergency_data = {
            "contacts": [contact.to_emergency_dict() for contact in emergency_contacts],
            "access_token": emergency_access_token.to_share_dict(),
            "qr_data": emergency_access_token.get_qr_code_data("https://nestsync.ca")
        }

        # Measure data structure size
        emergency_data_size = sys.getsizeof(emergency_data)

        # Emergency data should be compact for mobile/low-memory scenarios
        # Approximate limit: 1KB for basic emergency data structure
        assert emergency_data_size < 1024, f"Emergency data too large: {emergency_data_size} bytes"

        # Verify data completeness despite size constraints
        assert len(emergency_data["contacts"]) == 2
        assert "access_code" in emergency_data["access_token"]
        assert "url" in emergency_data["qr_data"]