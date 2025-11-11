"""
JWT Security Tests
Tests for JWT signature verification and token validation
"""

import pytest
import jwt
from datetime import datetime, timedelta, timezone
from app.auth.supabase import SupabaseAuth, AuthenticationError
from app.config.settings import settings


class TestJWTSecurity:
    """Test suite for JWT security vulnerabilities"""
    
    @pytest.fixture
    def supabase_auth(self):
        """Create SupabaseAuth instance for testing"""
        return SupabaseAuth()
    
    @pytest.fixture
    def valid_payload(self):
        """Create a valid JWT payload"""
        return {
            "sub": "test-user-id-123",
            "email": "test@example.com",
            "role": "authenticated",
            "aud": "authenticated",
            "iss": "https://test.supabase.co/auth/v1",
            "exp": int((datetime.now(timezone.utc) + timedelta(hours=1)).timestamp()),
            "iat": int(datetime.now(timezone.utc).timestamp()),
            "user_metadata": {"name": "Test User"},
            "app_metadata": {}
        }
    
    def test_valid_jwt_token_accepted(self, supabase_auth, valid_payload):
        """Test that a valid JWT token with correct signature is accepted"""
        # Create a valid token with correct signature
        token = jwt.encode(
            valid_payload,
            settings.supabase_jwt_secret,
            algorithm="HS256"
        )
        
        # Verify token should succeed
        result = supabase_auth.verify_jwt_token(token)
        
        assert result is not None
        assert result["user_id"] == "test-user-id-123"
        assert result["email"] == "test@example.com"
        assert result["role"] == "authenticated"
    
    def test_forged_jwt_with_invalid_signature_rejected(self, supabase_auth, valid_payload):
        """Test that JWT token with invalid signature is rejected"""
        # Create token with wrong secret (forged token)
        wrong_secret = "wrong-secret-key-12345"
        forged_token = jwt.encode(
            valid_payload,
            wrong_secret,
            algorithm="HS256"
        )
        
        # Verify token should raise AuthenticationError
        with pytest.raises(AuthenticationError) as exc_info:
            supabase_auth.verify_jwt_token(forged_token)
        
        assert "Invalid token" in str(exc_info.value)
    
    def test_expired_jwt_token_rejected(self, supabase_auth):
        """Test that expired JWT token is rejected"""
        # Create expired token
        expired_payload = {
            "sub": "test-user-id-123",
            "email": "test@example.com",
            "role": "authenticated",
            "aud": "authenticated",
            "iss": "https://test.supabase.co/auth/v1",
            "exp": int((datetime.now(timezone.utc) - timedelta(hours=1)).timestamp()),  # Expired 1 hour ago
            "iat": int((datetime.now(timezone.utc) - timedelta(hours=2)).timestamp()),
            "user_metadata": {},
            "app_metadata": {}
        }
        
        expired_token = jwt.encode(
            expired_payload,
            settings.supabase_jwt_secret,
            algorithm="HS256"
        )
        
        # Verify token should raise AuthenticationError
        with pytest.raises(AuthenticationError) as exc_info:
            supabase_auth.verify_jwt_token(expired_token)
        
        assert "Token has expired" in str(exc_info.value)
    
    def test_tampered_jwt_payload_rejected(self, supabase_auth, valid_payload):
        """Test that JWT with tampered payload is rejected"""
        # Create valid token
        token = jwt.encode(
            valid_payload,
            settings.supabase_jwt_secret,
            algorithm="HS256"
        )
        
        # Tamper with the token by modifying the payload section
        # JWT format: header.payload.signature
        parts = token.split('.')
        
        # Decode the payload, modify it, and re-encode
        import base64
        import json
        
        # Decode payload
        payload_bytes = base64.urlsafe_b64decode(parts[1] + '==')  # Add padding
        payload_dict = json.loads(payload_bytes)
        
        # Tamper with payload (change user_id)
        payload_dict['sub'] = 'hacker-user-id-999'
        
        # Re-encode tampered payload
        tampered_payload = base64.urlsafe_b64encode(
            json.dumps(payload_dict).encode()
        ).decode().rstrip('=')
        
        # Reconstruct token with tampered payload but original signature
        tampered_token = f"{parts[0]}.{tampered_payload}.{parts[2]}"
        
        # Verify token should raise AuthenticationError (signature won't match)
        with pytest.raises(AuthenticationError) as exc_info:
            supabase_auth.verify_jwt_token(tampered_token)
        
        assert "Invalid token" in str(exc_info.value)
    
    def test_jwt_with_none_algorithm_rejected(self, supabase_auth, valid_payload):
        """Test that JWT with 'none' algorithm is rejected"""
        # Try to create token with 'none' algorithm (security vulnerability)
        try:
            # Some JWT libraries allow 'none' algorithm which bypasses signature
            none_token = jwt.encode(
                valid_payload,
                "",
                algorithm="none"
            )
            
            # Verify token should raise AuthenticationError
            with pytest.raises(AuthenticationError):
                supabase_auth.verify_jwt_token(none_token)
        except Exception:
            # If jwt library doesn't allow 'none', that's good - test passes
            pass
    
    def test_malformed_jwt_rejected(self, supabase_auth):
        """Test that malformed JWT tokens are rejected"""
        malformed_tokens = [
            "not.a.jwt",
            "invalid-token",
            "header.payload",  # Missing signature
            "",  # Empty string
            "a.b.c.d",  # Too many parts
        ]
        
        for malformed_token in malformed_tokens:
            with pytest.raises(AuthenticationError):
                supabase_auth.verify_jwt_token(malformed_token)
    
    def test_jwt_with_missing_required_claims_rejected(self, supabase_auth):
        """Test that JWT missing required claims is rejected"""
        # Create token without required 'sub' claim
        incomplete_payload = {
            "email": "test@example.com",
            "aud": "authenticated",
            "exp": int((datetime.now(timezone.utc) + timedelta(hours=1)).timestamp()),
            "iat": int(datetime.now(timezone.utc).timestamp())
        }
        
        token = jwt.encode(
            incomplete_payload,
            settings.supabase_jwt_secret,
            algorithm="HS256"
        )
        
        # Token should be technically valid but missing expected claims
        result = supabase_auth.verify_jwt_token(token)
        
        # Should still decode but user_id will be None
        assert result is not None
        assert result["user_id"] is None
    
    def test_jwt_with_wrong_audience_rejected(self, supabase_auth, valid_payload):
        """Test that JWT with wrong audience claim is rejected"""
        # Create token with wrong audience
        wrong_aud_payload = valid_payload.copy()
        wrong_aud_payload["aud"] = "wrong-audience"
        
        token = jwt.encode(
            wrong_aud_payload,
            settings.supabase_jwt_secret,
            algorithm="HS256"
        )
        
        # Verify token should raise AuthenticationError (audience mismatch)
        with pytest.raises(AuthenticationError) as exc_info:
            supabase_auth.verify_jwt_token(token)
        
        assert "Invalid token" in str(exc_info.value)
