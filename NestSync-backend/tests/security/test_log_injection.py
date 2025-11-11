"""
Security tests for log injection prevention.

These tests verify that the log sanitization utility properly prevents
log injection attacks and maintains PIPEDA audit trail integrity.
"""

import pytest
from app.utils.logging import sanitize_log_data, create_structured_log_extra


class TestLogSanitization:
    """Test log data sanitization to prevent injection attacks."""
    
    def test_sanitize_removes_newlines(self):
        """Test that newline characters are removed from log data."""
        malicious_input = "User logged in\nADMIN: Unauthorized access granted"
        sanitized = sanitize_log_data(malicious_input)
        
        assert "\n" not in sanitized
        assert sanitized == "User logged inADMIN: Unauthorized access granted"
    
    def test_sanitize_removes_carriage_returns(self):
        """Test that carriage return characters are removed from log data."""
        malicious_input = "Normal log\rFAKE LOG: System compromised"
        sanitized = sanitize_log_data(malicious_input)
        
        assert "\r" not in sanitized
        assert sanitized == "Normal logFAKE LOG: System compromised"
    
    def test_sanitize_removes_ansi_escape_sequences(self):
        """Test that ANSI escape sequences are removed from log data."""
        # ANSI escape sequence for red text
        malicious_input = "Normal text\x1b[31mRed text\x1b[0m"
        sanitized = sanitize_log_data(malicious_input)
        
        assert "\x1b" not in sanitized
        assert "[31m" not in sanitized
        assert "[0m" not in sanitized
        # The text content should remain
        assert "Normal text" in sanitized
        assert "Red text" in sanitized
    
    def test_sanitize_removes_control_characters(self):
        """Test that control characters (0x00-0x1f, 0x7f-0x9f) are removed."""
        # Test various control characters
        malicious_input = "Text\x00with\x01control\x1fchars\x7f\x9f"
        sanitized = sanitize_log_data(malicious_input)
        
        # Control characters should be removed
        assert "\x00" not in sanitized
        assert "\x01" not in sanitized
        assert "\x1f" not in sanitized
        assert "\x7f" not in sanitized
        assert "\x9f" not in sanitized
        # Text should remain
        assert "Text" in sanitized
        assert "with" in sanitized
        assert "control" in sanitized
        assert "chars" in sanitized
    
    def test_sanitize_handles_dict_recursively(self):
        """Test that dictionaries are sanitized recursively."""
        malicious_dict = {
            "user": "test\nuser",
            "action": "login\rattempt",
            "metadata": {
                "ip": "192.168.1.1\x1b[31m",
                "agent": "Mozilla\x00"
            }
        }
        
        sanitized = sanitize_log_data(malicious_dict)
        
        assert "\n" not in sanitized["user"]
        assert "\r" not in sanitized["action"]
        assert "\x1b" not in sanitized["metadata"]["ip"]
        assert "\x00" not in sanitized["metadata"]["agent"]
        
        # Verify structure is preserved
        assert sanitized["user"] == "testuser"
        assert sanitized["action"] == "loginattempt"
        assert "192.168.1.1" in sanitized["metadata"]["ip"]
        assert "Mozilla" in sanitized["metadata"]["agent"]
    
    def test_sanitize_handles_list_recursively(self):
        """Test that lists are sanitized recursively."""
        malicious_list = [
            "item1\n",
            "item2\r",
            "item3\x1b[31m",
            {"nested": "value\nwith\nnewlines"}
        ]
        
        sanitized = sanitize_log_data(malicious_list)
        
        assert "\n" not in sanitized[0]
        assert "\r" not in sanitized[1]
        assert "\x1b" not in sanitized[2]
        assert "\n" not in sanitized[3]["nested"]
        
        # Verify content is preserved
        assert sanitized[0] == "item1"
        assert sanitized[1] == "item2"
        assert "item3" in sanitized[2]
        assert sanitized[3]["nested"] == "valuewithnewlines"
    
    def test_sanitize_handles_tuple(self):
        """Test that tuples are sanitized and returned as tuples."""
        malicious_tuple = ("item1\n", "item2\r", "item3\x00")
        sanitized = sanitize_log_data(malicious_tuple)
        
        assert isinstance(sanitized, tuple)
        assert "\n" not in sanitized[0]
        assert "\r" not in sanitized[1]
        assert "\x00" not in sanitized[2]
    
    def test_sanitize_preserves_non_string_types(self):
        """Test that non-string types are returned unchanged."""
        assert sanitize_log_data(123) == 123
        assert sanitize_log_data(45.67) == 45.67
        assert sanitize_log_data(True) is True
        assert sanitize_log_data(False) is False
        assert sanitize_log_data(None) is None
    
    def test_sanitize_handles_empty_string(self):
        """Test that empty strings are handled correctly."""
        assert sanitize_log_data("") == ""
    
    def test_sanitize_handles_clean_data(self):
        """Test that clean data passes through unchanged."""
        clean_data = "This is clean log data with no injection attempts"
        assert sanitize_log_data(clean_data) == clean_data


class TestStructuredLogExtra:
    """Test the create_structured_log_extra convenience function."""
    
    def test_create_structured_log_extra_sanitizes_values(self):
        """Test that create_structured_log_extra sanitizes all values."""
        extra = create_structured_log_extra(
            user_id="123",
            action="login\nattempt",
            ip="192.168.1.1\r",
            metadata={"key": "value\x1b[31m"}
        )
        
        assert "\n" not in extra["action"]
        assert "\r" not in extra["ip"]
        assert "\x1b" not in extra["metadata"]["key"]
        
        # Verify structure
        assert extra["user_id"] == "123"
        assert extra["action"] == "loginattempt"
        assert extra["ip"] == "192.168.1.1"
        assert extra["metadata"]["key"] == "value"


class TestPIPEDAAuditLogIntegrity:
    """Test that PIPEDA audit logs cannot be manipulated."""
    
    def test_audit_log_injection_attempt(self):
        """Test that audit log injection attempts are prevented."""
        # Simulate an attacker trying to inject fake audit entries
        malicious_user_input = (
            "normal_action\n"
            "PIPEDA_AUDIT: user_id=admin action=grant_all_permissions "
            "timestamp=2025-01-01 status=approved"
        )
        
        # When sanitized, the newline is removed, preventing log injection
        sanitized = sanitize_log_data(malicious_user_input)
        
        # The injection attempt should be neutralized
        assert "\n" not in sanitized
        # The malicious content is still there but can't create a new log line
        assert "PIPEDA_AUDIT" in sanitized
        # This would appear as part of the original field, not a separate log entry
    
    def test_audit_log_field_manipulation(self):
        """Test that audit log fields cannot be manipulated via user input."""
        # Simulate structured audit logging with user-provided data
        audit_data = {
            "event_type": "data_access",
            "user_id": "user123",
            "resource": "child_profile\nuser_id=admin",  # Injection attempt
            "action": "read\rstatus=approved",  # Another injection attempt
            "timestamp": "2025-11-10T12:00:00Z",
            "ip_address": "192.168.1.1\x1b[31mFAKE_IP=10.0.0.1"
        }
        
        sanitized_audit = sanitize_log_data(audit_data)
        
        # All injection attempts should be neutralized
        assert "\n" not in sanitized_audit["resource"]
        assert "\r" not in sanitized_audit["action"]
        assert "\x1b" not in sanitized_audit["ip_address"]
        
        # Fields should be clean but preserve legitimate content
        assert "child_profile" in sanitized_audit["resource"]
        assert "user_id=admin" in sanitized_audit["resource"]  # Content preserved
        assert "read" in sanitized_audit["action"]
        assert "192.168.1.1" in sanitized_audit["ip_address"]
    
    def test_complex_injection_attempt(self):
        """Test a complex multi-vector injection attempt."""
        # Attacker tries multiple injection techniques
        malicious_input = (
            "legitimate_data\n"
            "\r\n"
            "FAKE_LOG_ENTRY: severity=CRITICAL\n"
            "\x1b[31mERROR: System compromised\x1b[0m\n"
            "\x00\x01\x02HIDDEN_DATA"
        )
        
        sanitized = sanitize_log_data(malicious_input)
        
        # All control characters and escape sequences should be removed
        assert "\n" not in sanitized
        assert "\r" not in sanitized
        assert "\x1b" not in sanitized
        assert "\x00" not in sanitized
        assert "\x01" not in sanitized
        assert "\x02" not in sanitized
        
        # Legitimate content should remain
        assert "legitimate_data" in sanitized
        # Malicious content is preserved but can't create new log entries
        assert "FAKE_LOG_ENTRY" in sanitized
        assert "severity=CRITICAL" in sanitized


class TestLogInjectionScenarios:
    """Test real-world log injection scenarios."""
    
    def test_user_agent_injection(self):
        """Test that malicious user agents are sanitized."""
        malicious_user_agent = (
            "Mozilla/5.0\n"
            "ADMIN_ACCESS: granted\n"
            "USER: root"
        )
        
        sanitized = sanitize_log_data(malicious_user_agent)
        assert "\n" not in sanitized
        assert "Mozilla/5.0" in sanitized
    
    def test_username_injection(self):
        """Test that malicious usernames are sanitized."""
        malicious_username = "user\nadmin\rroot\x00superuser"
        sanitized = sanitize_log_data(malicious_username)
        
        assert "\n" not in sanitized
        assert "\r" not in sanitized
        assert "\x00" not in sanitized
        assert "user" in sanitized
    
    def test_error_message_injection(self):
        """Test that error messages with injection attempts are sanitized."""
        malicious_error = (
            "Database connection failed\n"
            "SUCCESS: Authentication bypassed\n"
            "User: admin logged in"
        )
        
        sanitized = sanitize_log_data(malicious_error)
        assert "\n" not in sanitized
        # All content is preserved but can't create separate log lines
        assert "Database connection failed" in sanitized
        assert "SUCCESS" in sanitized
    
    def test_json_payload_injection(self):
        """Test that JSON payloads with injection attempts are sanitized."""
        malicious_payload = {
            "username": "test\nADMIN_LOGIN: success",
            "password": "hidden",  # This would be hashed, but testing the structure
            "metadata": {
                "device": "iPhone\rROOT_ACCESS: granted",
                "version": "1.0\x1b[31mDEBUG_MODE: enabled"
            }
        }
        
        sanitized = sanitize_log_data(malicious_payload)
        
        assert "\n" not in sanitized["username"]
        assert "\r" not in sanitized["metadata"]["device"]
        assert "\x1b" not in sanitized["metadata"]["version"]
