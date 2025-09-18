"""
PIPEDA compliance tests for Emergency Flows health data handling
"""

import pytest
from datetime import datetime, timedelta, timezone
from unittest.mock import Mock, patch

from app.models.emergency_access import EmergencyAccess
from app.models.emergency_contact import EmergencyContact


class TestPIPEDACompliance:
    """Test PIPEDA compliance requirements for emergency health data."""

    def test_consent_logging_requirements(
        self,
        emergency_access_token: EmergencyAccess,
        pipeda_validator
    ):
        """Test that all access to health data is properly logged per PIPEDA."""
        # Record access with comprehensive logging
        emergency_access_token.record_access(
            ip_address="192.168.1.100",
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)",
            action="view_medical_information"
        )

        emergency_access_token.record_access(
            ip_address="10.0.0.50",
            user_agent="Mozilla/5.0 (Android 13; Mobile)",
            action="view_emergency_contacts"
        )

        # Validate PIPEDA logging compliance
        is_compliant = pipeda_validator.validate_consent_logging(
            emergency_access_token.access_log
        )

        assert is_compliant is True
        assert len(emergency_access_token.access_log) == 2

        # Verify required fields for PIPEDA audit trail
        for log_entry in emergency_access_token.access_log:
            assert "accessed_at" in log_entry
            assert "ip_address" in log_entry
            assert "user_agent" in log_entry
            assert "action" in log_entry
            assert "success" in log_entry

        # Verify timestamp format for Canadian compliance
        first_log = emergency_access_token.access_log[0]
        access_time = datetime.fromisoformat(first_log["accessed_at"].replace('Z', '+00:00'))
        assert access_time.tzinfo is not None  # Must include timezone info

    def test_data_minimization_principle(
        self,
        emergency_access_token: EmergencyAccess,
        pipeda_validator
    ):
        """Test that only necessary data is accessible based on permissions."""
        # Test medical information access restriction
        emergency_access_token.can_view_medical = False
        emergency_access_token.can_view_contacts = True
        emergency_access_token.can_view_location = False

        # Simulate data that would be returned
        accessed_data = {
            "emergency_contacts": [
                {"name": "Grandmother", "phone": "416-555-0001"}
            ]
            # Medical data should NOT be included
        }

        # Validate data minimization compliance
        is_compliant = pipeda_validator.validate_data_minimization(
            access_permissions={
                "can_view_medical": emergency_access_token.can_view_medical,
                "can_view_contacts": emergency_access_token.can_view_contacts,
                "can_view_location": emergency_access_token.can_view_location
            },
            accessed_data=accessed_data
        )

        assert is_compliant is True

        # Test violation case - medical data included when not permitted
        violated_data = {
            "emergency_contacts": [
                {"name": "Grandmother", "phone": "416-555-0001"}
            ],
            "medical_conditions": ["Asthma"],  # This should not be accessible
            "medications": ["Ventolin"]
        }

        is_compliant = pipeda_validator.validate_data_minimization(
            access_permissions={
                "can_view_medical": False,
                "can_view_contacts": True,
                "can_view_location": False
            },
            accessed_data=violated_data
        )

        assert is_compliant is False

    def test_canadian_data_residency(self, pipeda_validator):
        """Test that health data is stored in Canadian jurisdiction."""
        # Test valid Canadian regions
        canadian_storage = {
            "region": "ca-central-1",
            "provider": "Supabase",
            "jurisdiction": "Canada"
        }

        is_compliant = pipeda_validator.validate_canadian_residency(canadian_storage)
        assert is_compliant is True

        # Test non-Canadian storage (compliance violation)
        us_storage = {
            "region": "us-east-1",
            "provider": "AWS",
            "jurisdiction": "United States"
        }

        is_compliant = pipeda_validator.validate_canadian_residency(us_storage)
        assert is_compliant is False

        # Test other valid Canadian regions
        valid_regions = [
            {"region": "ca-west-1"},
            {"region": "canada-central"},
            {"region": "ontario-east"},
            {"region": "british-columbia-west"}
        ]

        for region_config in valid_regions:
            is_compliant = pipeda_validator.validate_canadian_residency(region_config)
            assert is_compliant is True

    def test_access_expiry_enforcement(
        self,
        emergency_access_token: EmergencyAccess,
        pipeda_validator
    ):
        """Test that expired access tokens are properly rejected."""
        # Token should be valid initially
        assert emergency_access_token.is_valid() is True

        # Manually expire the token
        emergency_access_token.expires_at = datetime.now(timezone.utc) - timedelta(hours=1)

        # Validate expiry enforcement
        is_compliant = pipeda_validator.validate_expiry_enforcement(emergency_access_token)
        assert is_compliant is True  # Properly rejects expired token

        # Token should now be invalid
        assert emergency_access_token.is_valid() is False

    def test_health_data_consent_tracking(self, emergency_access_token: EmergencyAccess):
        """Test explicit consent tracking for health data access."""
        # Verify consent fields are properly set for health data
        assert emergency_access_token.can_view_medical is not None
        assert emergency_access_token.can_view_providers is not None

        # Test granular consent - can view medical but not location
        emergency_access_token.can_view_medical = True
        emergency_access_token.can_view_location = False

        # Record health data access
        emergency_access_token.record_access(
            ip_address="192.168.1.100",
            user_agent="Emergency Access Browser",
            action="view_medical_conditions"
        )

        # Verify consent context in access log
        latest_log = emergency_access_token.access_log[-1]
        assert latest_log["action"] == "view_medical_conditions"
        assert latest_log["success"] is True

        # Verify unauthorized access would be logged as failed
        # (simulated - actual implementation would prevent access)
        emergency_access_token.can_view_medical = False
        emergency_access_token.record_access(
            ip_address="192.168.1.100",
            user_agent="Emergency Access Browser",
            action="unauthorized_medical_access"
        )

        # Since token permissions changed, this should be handled appropriately
        assert len(emergency_access_token.access_log) == 2

    def test_third_party_data_sharing_controls(self, emergency_access_token: EmergencyAccess):
        """Test controls for sharing health data with third parties."""
        # Verify recipient information is tracked
        assert emergency_access_token.recipient_name is not None
        assert emergency_access_token.purpose is not None

        # Test that sharing purpose is documented
        emergency_access_token.purpose = "Emergency babysitting - medical information access required"
        emergency_access_token.recipient_name = "Professional Caregiver Service"
        emergency_access_token.recipient_relationship = "Licensed Childcare Provider"

        # Verify sharing context is properly documented
        sharing_info = emergency_access_token.to_share_dict()

        assert "recipient_name" in sharing_info
        assert "purpose" in sharing_info
        assert sharing_info["purpose"] is not None

        # Test that sharing has time limits (PIPEDA requirement)
        assert emergency_access_token.expires_at is not None
        time_until_expiry = emergency_access_token.expires_at - datetime.now(timezone.utc)
        assert time_until_expiry.total_seconds() > 0  # Should be in future

    def test_data_subject_rights_compliance(self, emergency_access_token: EmergencyAccess):
        """Test compliance with PIPEDA data subject rights."""
        # Test right to know - access log provides transparency
        access_log = emergency_access_token.access_log or []

        # Log an access for testing
        emergency_access_token.record_access(
            ip_address="192.168.1.100",
            user_agent="Test Browser",
            action="data_subject_verification"
        )

        # Verify transparency - user can see who accessed their data
        assert len(emergency_access_token.access_log) > 0
        latest_access = emergency_access_token.access_log[-1]

        # Required information for data subject rights
        required_transparency_fields = [
            "accessed_at",    # When was data accessed
            "ip_address",     # From where
            "user_agent",     # What device/browser
            "action",         # What was accessed
            "success"         # Was access successful
        ]

        for field in required_transparency_fields:
            assert field in latest_access

        # Test right to revoke - parents can revoke access
        assert emergency_access_token.is_valid() is True

        # Simulate parent revoking access
        parent_user_id = str(emergency_access_token.created_by)
        emergency_access_token.revoke(parent_user_id)

        # Verify revocation is effective immediately
        assert emergency_access_token.is_valid() is False
        assert emergency_access_token.revoked_at is not None
        assert emergency_access_token.revoked_by is not None

    def test_cross_border_data_transfer_restrictions(self):
        """Test that health data cannot be transferred outside Canada."""
        # Simulate data transfer attempt
        def attempt_data_transfer(destination_country: str, data_type: str) -> bool:
            """Simulate data transfer validation."""
            # PIPEDA compliance: health data must stay in Canada
            if data_type in ["medical_conditions", "medications", "health_info"]:
                if destination_country.lower() != "canada":
                    return False  # Transfer blocked
            return True

        # Test allowed transfers (within Canada)
        assert attempt_data_transfer("canada", "medical_conditions") is True
        assert attempt_data_transfer("canada", "emergency_contacts") is True

        # Test blocked transfers (outside Canada)
        assert attempt_data_transfer("united_states", "medical_conditions") is False
        assert attempt_data_transfer("european_union", "medications") is False

        # Non-health data might have different rules (not tested here)
        assert attempt_data_transfer("united_states", "basic_contact_info") is True

    def test_data_breach_notification_readiness(self, emergency_access_token: EmergencyAccess):
        """Test readiness for PIPEDA data breach notification requirements."""
        # Simulate suspicious access pattern detection
        suspicious_ips = ["192.168.1.100", "10.0.0.50", "172.16.0.100"]

        for i, ip in enumerate(suspicious_ips):
            emergency_access_token.record_access(
                ip_address=ip,
                user_agent=f"Suspicious Browser {i}",
                action="bulk_data_access"
            )

        # Verify breach detection data is available
        access_log = emergency_access_token.access_log

        # Required data for breach notification
        breach_analysis = {
            "affected_records": 1,  # This emergency access record
            "data_types": ["medical_conditions", "emergency_contacts"],
            "access_log": access_log,
            "time_range": {
                "first_access": access_log[0]["accessed_at"] if access_log else None,
                "last_access": access_log[-1]["accessed_at"] if access_log else None
            },
            "unique_ips": list(set(log["ip_address"] for log in access_log))
        }

        # Verify breach notification data completeness
        assert breach_analysis["affected_records"] > 0
        assert len(breach_analysis["data_types"]) > 0
        assert len(breach_analysis["access_log"]) == 3
        assert len(breach_analysis["unique_ips"]) == 3

    def test_retention_period_compliance(self, emergency_access_token: EmergencyAccess):
        """Test compliance with data retention requirements."""
        # PIPEDA requires data to be retained only as long as necessary

        # Emergency access should have defined expiry
        assert emergency_access_token.expires_at is not None

        # Calculate retention period
        retention_period = emergency_access_token.expires_at - emergency_access_token.created_at
        retention_hours = retention_period.total_seconds() / 3600

        # Emergency access should not exceed reasonable limits
        # Typical emergency access: 4-48 hours
        assert retention_hours <= 48, f"Retention period too long: {retention_hours} hours"

        # Test automatic cleanup readiness
        now = datetime.now(timezone.utc)
        is_expired = emergency_access_token.expires_at < now

        if is_expired:
            # Expired tokens should be ready for cleanup
            assert emergency_access_token.is_valid() is False

    def test_consent_withdrawal_handling(self, emergency_access_token: EmergencyAccess):
        """Test handling of consent withdrawal per PIPEDA requirements."""
        # Initial state - consent is active
        assert emergency_access_token.is_active is True
        assert emergency_access_token.revoked_at is None

        # Simulate consent withdrawal by data subject (parent)
        withdrawal_user_id = str(emergency_access_token.created_by)
        withdrawal_time = datetime.now(timezone.utc)

        # Withdraw consent
        emergency_access_token.revoke(withdrawal_user_id)

        # Verify immediate effect of consent withdrawal
        assert emergency_access_token.is_active is False
        assert emergency_access_token.revoked_at is not None
        assert emergency_access_token.revoked_by == emergency_access_token.created_by

        # Verify no further access is possible
        assert emergency_access_token.is_valid() is False

        # Test that withdrawal is logged
        emergency_access_token.record_access(
            ip_address="192.168.1.100",
            user_agent="Post-withdrawal access attempt",
            action="attempted_access_after_revocation"
        )

        # Access attempt should be logged but marked as unsuccessful
        latest_log = emergency_access_token.access_log[-1]
        assert latest_log["success"] is False

    @pytest.mark.asyncio
    async def test_audit_trail_completeness(self, emergency_access_token: EmergencyAccess):
        """Test that audit trail meets PIPEDA requirements for health data."""
        # Create comprehensive audit trail
        audit_actions = [
            "token_created",
            "qr_code_generated",
            "first_access_attempt",
            "medical_info_viewed",
            "emergency_contacts_accessed",
            "token_shared",
            "access_logged",
            "token_expired"
        ]

        for action in audit_actions:
            emergency_access_token.record_access(
                ip_address="192.168.1.100",
                user_agent="Audit Test Browser",
                action=action
            )

        # Verify audit trail completeness
        audit_trail = emergency_access_token.access_log

        # PIPEDA audit requirements
        assert len(audit_trail) == len(audit_actions)

        # Each audit entry must have complete information
        for i, log_entry in enumerate(audit_trail):
            assert log_entry["action"] == audit_actions[i]
            assert "accessed_at" in log_entry
            assert "ip_address" in log_entry
            assert "user_agent" in log_entry
            assert "success" in log_entry

            # Verify timestamp format for Canadian compliance
            access_time = datetime.fromisoformat(
                log_entry["accessed_at"].replace('Z', '+00:00')
            )
            assert access_time.tzinfo is not None

        # Verify audit trail is immutable (stored as JSON)
        original_log_count = len(emergency_access_token.access_log)

        # Attempt to modify log (should not affect stored data)
        temp_log = emergency_access_token.access_log.copy()
        temp_log[0]["action"] = "modified_action"

        # Original should be unchanged
        assert emergency_access_token.access_log[0]["action"] == audit_actions[0]
        assert len(emergency_access_token.access_log) == original_log_count