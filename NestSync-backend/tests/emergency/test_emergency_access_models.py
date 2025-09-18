"""
Unit tests for EmergencyAccess model
"""

import pytest
import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import patch

from app.models.emergency_access import EmergencyAccess


class TestEmergencyAccessModel:
    """Test EmergencyAccess model functionality."""

    def test_generate_access_token(self):
        """Test secure access token generation."""
        token1 = EmergencyAccess.generate_access_token()
        token2 = EmergencyAccess.generate_access_token()

        # Tokens should be different
        assert token1 != token2

        # Token should be 64 characters (48 bytes base64url encoded)
        assert len(token1) == 64

        # Token should be URL-safe
        import string
        allowed_chars = string.ascii_letters + string.digits + '-_'
        assert all(c in allowed_chars for c in token1)

    def test_generate_access_code(self):
        """Test human-readable access code generation."""
        code1 = EmergencyAccess.generate_access_code()
        code2 = EmergencyAccess.generate_access_code()

        # Codes should be different
        assert code1 != code2

        # Code should be 8 characters
        assert len(code1) == 8

        # Code should not contain confusing characters
        confusing_chars = "IO10"
        assert not any(c in confusing_chars for c in code1)

        # Code should be uppercase alphanumeric
        import string
        allowed_chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
        assert all(c in allowed_chars for c in code1)

    def test_create_emergency_access_factory(self):
        """Test factory method for creating emergency access."""
        family_id = str(uuid.uuid4())
        child_id = str(uuid.uuid4())
        created_by = str(uuid.uuid4())

        access = EmergencyAccess.create_emergency_access(
            family_id=family_id,
            child_id=child_id,
            created_by=created_by,
            duration_hours=12,
            recipient_name="Test Babysitter",
            purpose="Emergency childcare"
        )

        # Verify basic properties
        assert access.family_id == uuid.UUID(family_id)
        assert access.child_id == uuid.UUID(child_id)
        assert access.created_by == uuid.UUID(created_by)
        assert access.recipient_name == "Test Babysitter"
        assert access.purpose == "Emergency childcare"

        # Verify tokens are generated
        assert access.access_token is not None
        assert access.access_code is not None
        assert len(access.access_token) == 64
        assert len(access.access_code) == 8

        # Verify expiry is set correctly
        expected_expiry = access.created_at + timedelta(hours=12)
        assert abs((access.expires_at - expected_expiry).total_seconds()) < 1

        # Verify default permissions
        assert access.can_view_medical is True
        assert access.can_view_contacts is True
        assert access.can_view_providers is True
        assert access.can_view_location is False  # Default is False

    def test_create_emergency_access_defaults(self):
        """Test factory method with default values."""
        family_id = str(uuid.uuid4())
        created_by = str(uuid.uuid4())

        access = EmergencyAccess.create_emergency_access(
            family_id=family_id,
            created_by=created_by
        )

        # Child ID should be None when not provided
        assert access.child_id is None

        # Default duration should be 24 hours
        expected_expiry = access.created_at + timedelta(hours=24)
        assert abs((access.expires_at - expected_expiry).total_seconds()) < 1

        # Default values should be set
        assert access.is_active is True
        assert access.use_count == 0
        assert access.max_uses is None

    def test_is_valid_method(self):
        """Test access token validation logic."""
        now = datetime.now(timezone.utc)

        # Create valid access token
        access = EmergencyAccess(
            id=uuid.uuid4(),
            family_id=uuid.uuid4(),
            created_by=uuid.uuid4(),
            access_token="test-token",
            access_code="TESTCODE",
            expires_at=now + timedelta(hours=1),
            is_active=True,
            use_count=0,
            max_uses=None,
            created_at=now,
            updated_at=now
        )

        assert access.is_valid() is True

        # Test expired token
        access.expires_at = now - timedelta(hours=1)
        assert access.is_valid() is False

        # Reset to valid state
        access.expires_at = now + timedelta(hours=1)
        assert access.is_valid() is True

        # Test revoked token
        access.revoked_at = now
        assert access.is_valid() is False

        # Reset revoked state
        access.revoked_at = None
        assert access.is_valid() is True

        # Test inactive token
        access.is_active = False
        assert access.is_valid() is False

        # Reset to active
        access.is_active = True
        assert access.is_valid() is True

        # Test max uses exceeded
        access.max_uses = 2
        access.use_count = 2
        assert access.is_valid() is False

        # Test max uses not exceeded
        access.use_count = 1
        assert access.is_valid() is True

    def test_record_access_successful(self):
        """Test recording successful access attempts."""
        now = datetime.now(timezone.utc)
        access = EmergencyAccess(
            id=uuid.uuid4(),
            family_id=uuid.uuid4(),
            created_by=uuid.uuid4(),
            access_token="test-token",
            access_code="TESTCODE",
            expires_at=now + timedelta(hours=1),
            is_active=True,
            use_count=0,
            access_log=[],
            created_at=now,
            updated_at=now
        )

        # Record access
        access.record_access(
            ip_address="192.168.1.100",
            user_agent="Test Browser",
            action="view_medical_info"
        )

        # Verify access was recorded
        assert len(access.access_log) == 1
        log_entry = access.access_log[0]

        assert log_entry["ip_address"] == "192.168.1.100"
        assert log_entry["user_agent"] == "Test Browser"
        assert log_entry["action"] == "view_medical_info"
        assert log_entry["success"] is True
        assert "accessed_at" in log_entry

        # Verify counters updated
        assert access.use_count == 1
        assert access.last_accessed_at is not None

    def test_record_access_invalid_token(self):
        """Test recording access attempts on invalid tokens."""
        now = datetime.now(timezone.utc)
        access = EmergencyAccess(
            id=uuid.uuid4(),
            family_id=uuid.uuid4(),
            created_by=uuid.uuid4(),
            access_token="test-token",
            access_code="TESTCODE",
            expires_at=now - timedelta(hours=1),  # Expired
            is_active=True,
            use_count=0,
            access_log=[],
            created_at=now,
            updated_at=now
        )

        # Record access attempt
        access.record_access(
            ip_address="192.168.1.100",
            user_agent="Test Browser",
            action="view_medical_info"
        )

        # Verify access was logged but marked as failed
        assert len(access.access_log) == 1
        log_entry = access.access_log[0]
        assert log_entry["success"] is False

        # Verify counters NOT updated for invalid access
        assert access.use_count == 0
        assert access.last_accessed_at is None

    def test_revoke_method(self):
        """Test token revocation."""
        now = datetime.now(timezone.utc)
        access = EmergencyAccess(
            id=uuid.uuid4(),
            family_id=uuid.uuid4(),
            created_by=uuid.uuid4(),
            access_token="test-token",
            access_code="TESTCODE",
            expires_at=now + timedelta(hours=1),
            is_active=True,
            created_at=now,
            updated_at=now
        )

        revoker_id = str(uuid.uuid4())

        # Token should be valid before revocation
        assert access.is_valid() is True

        # Revoke token
        access.revoke(revoker_id)

        # Verify revocation
        assert access.revoked_at is not None
        assert access.revoked_by == uuid.UUID(revoker_id)
        assert access.is_active is False
        assert access.is_valid() is False

    def test_extend_expiry(self):
        """Test extending token expiry."""
        now = datetime.now(timezone.utc)
        original_expiry = now + timedelta(hours=1)

        access = EmergencyAccess(
            id=uuid.uuid4(),
            family_id=uuid.uuid4(),
            created_by=uuid.uuid4(),
            access_token="test-token",
            access_code="TESTCODE",
            expires_at=original_expiry,
            is_active=True,
            created_at=now,
            updated_at=now
        )

        # Extend by 2 hours
        access.extend_expiry(2)

        # Verify extension
        expected_expiry = original_expiry + timedelta(hours=2)
        assert access.expires_at == expected_expiry

    def test_get_access_url(self):
        """Test access URL generation."""
        access = EmergencyAccess(
            id=uuid.uuid4(),
            family_id=uuid.uuid4(),
            created_by=uuid.uuid4(),
            access_token="test-token",
            access_code="TESTCODE",
            expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )

        base_url = "https://nestsync.ca"
        url = access.get_access_url(base_url)

        expected = f"{base_url}/emergency-access/TESTCODE"
        assert url == expected

    def test_get_qr_code_data(self):
        """Test QR code data generation."""
        child_id = uuid.uuid4()
        expires_at = datetime.now(timezone.utc) + timedelta(hours=1)

        access = EmergencyAccess(
            id=uuid.uuid4(),
            family_id=uuid.uuid4(),
            child_id=child_id,
            created_by=uuid.uuid4(),
            access_token="test-token",
            access_code="TESTCODE",
            expires_at=expires_at,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )

        base_url = "https://nestsync.ca"
        qr_data = access.get_qr_code_data(base_url)

        expected = {
            "url": f"{base_url}/emergency-access/TESTCODE",
            "code": "TESTCODE",
            "expires": expires_at.isoformat(),
            "child_id": str(child_id)
        }

        assert qr_data == expected

    def test_get_qr_code_data_no_child(self):
        """Test QR code data generation for family-wide access."""
        expires_at = datetime.now(timezone.utc) + timedelta(hours=1)

        access = EmergencyAccess(
            id=uuid.uuid4(),
            family_id=uuid.uuid4(),
            child_id=None,  # Family-wide access
            created_by=uuid.uuid4(),
            access_token="test-token",
            access_code="TESTCODE",
            expires_at=expires_at,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )

        base_url = "https://nestsync.ca"
        qr_data = access.get_qr_code_data(base_url)

        assert qr_data["child_id"] is None

    def test_to_share_dict(self):
        """Test sharing dictionary creation."""
        expires_at = datetime.now(timezone.utc) + timedelta(hours=1)

        access = EmergencyAccess(
            id=uuid.uuid4(),
            family_id=uuid.uuid4(),
            created_by=uuid.uuid4(),
            access_token="test-token",
            access_code="TESTCODE",
            expires_at=expires_at,
            recipient_name="Test Babysitter",
            purpose="Emergency care",
            notes="Call if any issues",
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )

        share_dict = access.to_share_dict()

        expected = {
            "access_code": "TESTCODE",
            "expires_at": expires_at.isoformat(),
            "recipient_name": "Test Babysitter",
            "purpose": "Emergency care",
            "notes": "Call if any issues"
        }

        assert share_dict == expected

    @pytest.mark.asyncio
    async def test_performance_requirements(self, performance_timer):
        """Test that model operations meet performance requirements."""
        # Token generation should be fast
        timer = performance_timer.start()
        token = EmergencyAccess.generate_access_token()
        timer.stop()
        timer.assert_under_ms(10, "Token generation")

        # Access code generation should be fast
        timer = performance_timer.start()
        code = EmergencyAccess.generate_access_code()
        timer.stop()
        timer.assert_under_ms(5, "Access code generation")

        # Validation should be very fast
        now = datetime.now(timezone.utc)
        access = EmergencyAccess(
            id=uuid.uuid4(),
            family_id=uuid.uuid4(),
            created_by=uuid.uuid4(),
            access_token=token,
            access_code=code,
            expires_at=now + timedelta(hours=1),
            is_active=True,
            use_count=0,
            created_at=now,
            updated_at=now
        )

        timer = performance_timer.start()
        is_valid = access.is_valid()
        timer.stop()
        timer.assert_under_ms(1, "Token validation")

        assert is_valid is True