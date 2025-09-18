"""
Unit tests for EmergencyContact model
"""

import pytest
from datetime import datetime, timezone

from app.models.emergency_contact import EmergencyContact


class TestEmergencyContactModel:
    """Test EmergencyContact model functionality."""

    def test_format_phone_for_display_10_digit(self):
        """Test Canadian phone number formatting for 10-digit numbers."""
        contact = EmergencyContact()

        # Test 10-digit number
        formatted = contact.format_phone_for_display("4165551234")
        assert formatted == "(416) 555-1234"

        # Test with existing formatting
        formatted = contact.format_phone_for_display("(416) 555-1234")
        assert formatted == "(416) 555-1234"

        # Test with dashes and spaces
        formatted = contact.format_phone_for_display("416-555-1234")
        assert formatted == "(416) 555-1234"

        # Test with mixed formatting
        formatted = contact.format_phone_for_display("416.555.1234")
        assert formatted == "(416) 555-1234"

    def test_format_phone_for_display_11_digit(self):
        """Test phone number formatting for 11-digit numbers (with country code)."""
        contact = EmergencyContact()

        # Test 11-digit number (North American +1)
        formatted = contact.format_phone_for_display("14165551234")
        assert formatted == "+1 (416) 555-1234"

        # Test with plus sign
        formatted = contact.format_phone_for_display("+14165551234")
        assert formatted == "+1 (416) 555-1234"

        # Test with existing formatting
        formatted = contact.format_phone_for_display("+1 (416) 555-1234")
        assert formatted == "+1 (416) 555-1234"

    def test_format_phone_for_display_invalid_length(self):
        """Test phone number formatting for invalid lengths."""
        contact = EmergencyContact()

        # Test too short
        invalid_short = "555123"
        formatted = contact.format_phone_for_display(invalid_short)
        assert formatted == invalid_short

        # Test too long
        invalid_long = "141655512345678"
        formatted = contact.format_phone_for_display(invalid_long)
        assert formatted == invalid_long

        # Test empty string
        formatted = contact.format_phone_for_display("")
        assert formatted == ""

    def test_get_formatted_primary_phone(self):
        """Test primary phone number formatting."""
        contact = EmergencyContact(phone_primary="4165551234")
        formatted = contact.get_formatted_primary_phone()
        assert formatted == "(416) 555-1234"

    def test_get_formatted_secondary_phone(self):
        """Test secondary phone number formatting."""
        # Test with secondary phone
        contact = EmergencyContact(
            phone_primary="4165551234",
            phone_secondary="6475559876"
        )
        formatted = contact.get_formatted_secondary_phone()
        assert formatted == "(647) 555-9876"

        # Test without secondary phone
        contact = EmergencyContact(phone_primary="4165551234")
        formatted = contact.get_formatted_secondary_phone()
        assert formatted is None

    def test_verify_contact_info(self):
        """Test contact information verification."""
        contact = EmergencyContact()

        # Initially no verification date
        assert contact.last_verified_at is None

        # Verify contact info
        before_verification = datetime.now(timezone.utc)
        contact.verify_contact_info()
        after_verification = datetime.now(timezone.utc)

        # Should have verification timestamp
        assert contact.last_verified_at is not None
        assert before_verification <= contact.last_verified_at <= after_verification

    def test_to_emergency_dict(self):
        """Test emergency dictionary creation for API responses."""
        import uuid

        contact_id = uuid.uuid4()
        contact = EmergencyContact(
            id=contact_id,
            name="Grandmother Smith",
            relationship="Grandmother",
            phone_primary="+1-416-555-0001",
            phone_secondary="+1-647-555-0002",
            is_primary=True,
            priority_order=1,
            can_pickup=True,
            can_make_medical_decisions=True
        )

        emergency_dict = contact.to_emergency_dict()

        expected = {
            "id": str(contact_id),
            "name": "Grandmother Smith",
            "relationship": "Grandmother",
            "phone_primary": "+1-416-555-0001",
            "phone_secondary": "+1-647-555-0002",
            "is_primary": True,
            "priority_order": 1,
            "can_pickup": True,
            "can_make_medical_decisions": True
        }

        assert emergency_dict == expected

    def test_to_emergency_dict_minimal(self):
        """Test emergency dictionary with minimal data."""
        import uuid

        contact_id = uuid.uuid4()
        contact = EmergencyContact(
            id=contact_id,
            name="Uncle John",
            relationship="Uncle",
            phone_primary="416-555-0003",
            is_primary=False,
            priority_order=2,
            can_pickup=False,
            can_make_medical_decisions=False
        )

        emergency_dict = contact.to_emergency_dict()

        expected = {
            "id": str(contact_id),
            "name": "Uncle John",
            "relationship": "Uncle",
            "phone_primary": "416-555-0003",
            "phone_secondary": None,
            "is_primary": False,
            "priority_order": 2,
            "can_pickup": False,
            "can_make_medical_decisions": False
        }

        assert emergency_dict == expected

    def test_canadian_specific_fields(self):
        """Test Canadian-specific field handling."""
        contact = EmergencyContact(
            name="Test Contact",
            relationship="Aunt",
            phone_primary="416-555-0001",
            province="QC",
            speaks_french=True,
            speaks_english=True
        )

        # Test Quebec contact with bilingual support
        assert contact.province == "QC"
        assert contact.speaks_french is True
        assert contact.speaks_english is True

        # Test Ontario contact (English only typical)
        contact_on = EmergencyContact(
            name="Test Contact ON",
            relationship="Uncle",
            phone_primary="416-555-0002",
            province="ON",
            speaks_french=False,
            speaks_english=True
        )

        assert contact_on.province == "ON"
        assert contact_on.speaks_french is False
        assert contact_on.speaks_english is True

    def test_authorization_flags(self):
        """Test authorization and permission flags."""
        # Primary contact with full permissions
        primary_contact = EmergencyContact(
            name="Primary Parent",
            relationship="Father",
            phone_primary="416-555-0001",
            is_primary=True,
            can_pickup=True,
            can_make_medical_decisions=True,
            priority_order=1
        )

        assert primary_contact.is_primary is True
        assert primary_contact.can_pickup is True
        assert primary_contact.can_make_medical_decisions is True
        assert primary_contact.priority_order == 1

        # Secondary contact with limited permissions
        secondary_contact = EmergencyContact(
            name="Family Friend",
            relationship="Family Friend",
            phone_primary="416-555-0002",
            is_primary=False,
            can_pickup=True,
            can_make_medical_decisions=False,
            priority_order=3
        )

        assert secondary_contact.is_primary is False
        assert secondary_contact.can_pickup is True
        assert secondary_contact.can_make_medical_decisions is False
        assert secondary_contact.priority_order == 3

    def test_repr_method(self):
        """Test string representation of EmergencyContact."""
        import uuid

        contact_id = uuid.uuid4()
        child_id = uuid.uuid4()

        contact = EmergencyContact(
            id=contact_id,
            child_id=child_id,
            name="Test Contact",
            is_primary=True
        )

        repr_str = repr(contact)
        expected = f"<EmergencyContact(id={contact_id}, name=Test Contact, child_id={child_id}, is_primary=True)>"

        assert repr_str == expected

    @pytest.mark.asyncio
    async def test_performance_requirements(self, performance_timer):
        """Test that contact operations meet performance requirements."""
        contact = EmergencyContact(
            name="Test Contact",
            relationship="Grandmother",
            phone_primary="4165551234",
            phone_secondary="6475559876"
        )

        # Phone formatting should be fast
        timer = performance_timer.start()
        formatted = contact.get_formatted_primary_phone()
        timer.stop()
        timer.assert_under_ms(5, "Primary phone formatting")

        timer = performance_timer.start()
        formatted = contact.get_formatted_secondary_phone()
        timer.stop()
        timer.assert_under_ms(5, "Secondary phone formatting")

        # Emergency dict creation should be fast
        timer = performance_timer.start()
        emergency_dict = contact.to_emergency_dict()
        timer.stop()
        timer.assert_under_ms(10, "Emergency dict creation")

        # Verify results are correct
        assert formatted == "(647) 555-9876"
        assert emergency_dict["phone_primary"] == "4165551234"

    def test_edge_cases_phone_formatting(self):
        """Test edge cases in phone number formatting."""
        contact = EmergencyContact()

        # Test with letters and special characters
        messy_phone = "416-abc-1234-ext.567"
        formatted = contact.format_phone_for_display(messy_phone)
        # Should extract only digits: 4161234567 (10 digits)
        assert formatted == "(416) 123-4567"

        # Test with international format
        international = "+33 1 42 34 56 78"
        formatted = contact.format_phone_for_display(international)
        # Should remain unchanged due to non-standard length
        assert formatted == international

        # Test with only special characters
        special_only = "()-.+ "
        formatted = contact.format_phone_for_display(special_only)
        assert formatted == special_only

    def test_priority_ordering_logic(self):
        """Test priority ordering for contact selection."""
        contacts = [
            EmergencyContact(
                name="Contact 3",
                priority_order=3,
                is_primary=False
            ),
            EmergencyContact(
                name="Primary Contact",
                priority_order=1,
                is_primary=True
            ),
            EmergencyContact(
                name="Contact 2",
                priority_order=2,
                is_primary=False
            )
        ]

        # Sort by priority order
        sorted_contacts = sorted(contacts, key=lambda c: c.priority_order)

        assert sorted_contacts[0].name == "Primary Contact"
        assert sorted_contacts[0].priority_order == 1
        assert sorted_contacts[1].name == "Contact 2"
        assert sorted_contacts[1].priority_order == 2
        assert sorted_contacts[2].name == "Contact 3"
        assert sorted_contacts[2].priority_order == 3

        # Primary contact should always be priority 1 or first
        primary_contacts = [c for c in contacts if c.is_primary]
        assert len(primary_contacts) == 1
        assert primary_contacts[0].priority_order == 1