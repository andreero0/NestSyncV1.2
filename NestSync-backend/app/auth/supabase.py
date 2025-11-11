"""
Supabase Authentication Integration
Canadian PIPEDA-compliant user authentication
"""

import jwt
import logging
from typing import Optional, Dict, Any
from datetime import datetime, timezone
from supabase import create_client, Client
from gotrue.errors import AuthError
from jose import JWTError

from app.config.settings import settings

logger = logging.getLogger(__name__)


class AuthenticationError(Exception):
    """Custom exception for authentication failures"""
    pass


def _transform_identity_response(response_data: Any) -> Any:
    """
    Transform Supabase response to ensure compatibility with gotrue versions.
    Maps 'id' field to 'identity_id' in user.identities array to fix
    Pydantic validation errors in gotrue v2.9.1+
    """
    logger.info(f"=== TRANSFORMATION DEBUG START ===")
    logger.info(f"Response data type: {type(response_data)}")
    logger.info(f"Response data attributes: {dir(response_data) if hasattr(response_data, '__dict__') else 'No attributes'}")

    # Log the full response structure for debugging
    try:
        if hasattr(response_data, '__dict__'):
            logger.info(f"Response data dict: {response_data.__dict__}")
        else:
            logger.info(f"Response data value: {response_data}")
    except Exception as e:
        logger.error(f"Error logging response data: {e}")

    if not hasattr(response_data, 'user') or not response_data.user:
        logger.info("No user in response_data, returning unchanged")
        return response_data

    user = response_data.user
    logger.info(f"User object type: {type(user)}")
    logger.info(f"User attributes: {dir(user) if hasattr(user, '__dict__') else 'No attributes'}")

    # Log user properties
    try:
        if hasattr(user, '__dict__'):
            logger.info(f"User dict: {user.__dict__}")
        logger.info(f"User id: {getattr(user, 'id', 'NO ID')}")
        logger.info(f"User email: {getattr(user, 'email', 'NO EMAIL')}")
    except Exception as e:
        logger.error(f"Error logging user data: {e}")

    # Check if user has identities and they need transformation
    if hasattr(user, 'identities') and user.identities:
        logger.info(f"Found {len(user.identities)} identities to transform")
        logger.info(f"Identities type: {type(user.identities)}")

        # Log the raw identities structure
        try:
            logger.info(f"Raw identities: {user.identities}")
        except Exception as e:
            logger.error(f"Error logging identities: {e}")

        for i, identity in enumerate(user.identities):
            logger.info(f"=== IDENTITY {i} DEBUG ===")
            logger.info(f"Identity type: {type(identity)}")

            if isinstance(identity, dict):
                logger.info(f"Identity keys: {list(identity.keys())}")
                logger.info(f"Identity values: {identity}")

                if 'id' in identity and 'identity_id' not in identity:
                    logger.info(f"TRANSFORMING identity {i}: adding identity_id = {identity['id']}")
                    identity['identity_id'] = identity['id']
                    logger.info(f"Identity after transformation: {identity}")
                else:
                    logger.info(f"Identity {i} already has identity_id or missing id")
                    if 'identity_id' in identity:
                        logger.info(f"Existing identity_id: {identity['identity_id']}")
                    if 'id' not in identity:
                        logger.info(f"No 'id' field found in identity")

            # Handle object-like identities
            elif hasattr(identity, '__dict__'):
                logger.info(f"Identity attributes: {dir(identity)}")
                logger.info(f"Identity dict: {identity.__dict__}")

                if hasattr(identity, 'id') and not hasattr(identity, 'identity_id'):
                    id_value = getattr(identity, 'id', None)
                    logger.info(f"TRANSFORMING object identity {i}: adding identity_id = {id_value}")
                    setattr(identity, 'identity_id', id_value)
                    logger.info(f"Identity after transformation - dict: {identity.__dict__}")
                else:
                    logger.info(f"Object identity {i} doesn't need transformation")
                    if hasattr(identity, 'identity_id'):
                        logger.info(f"Existing identity_id: {getattr(identity, 'identity_id', 'ERROR')}")

            else:
                logger.info(f"Identity {i} is neither dict nor object: {identity}")

    else:
        logger.info("No identities found in user")
        if hasattr(user, 'identities'):
            logger.info(f"User has identities attribute but it's: {user.identities}")
        else:
            logger.info("User has no identities attribute")

    logger.info("=== TRANSFORMATION DEBUG END ===")
    return response_data


class SupabaseAuth:
    """
    Supabase authentication service with Canadian compliance
    """
    
    def __init__(self):
        self.client: Client = create_client(settings.supabase_url, settings.supabase_key)
        self.service_client: Client = create_client(
            settings.supabase_url, 
            settings.supabase_service_key
        )
        self.jwt_secret = settings.supabase_jwt_secret
    
    async def sign_up(
        self, 
        email: str, 
        password: str, 
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Register new user with Supabase Auth
        """
        try:
            # Prepare user metadata with Canadian compliance fields
            user_metadata = {
                "data_region": settings.data_region,
                "timezone": settings.timezone,
                "consent_version": settings.consent_version,
                "registration_ip": metadata.get("ip_address") if metadata else None,
                "registration_user_agent": metadata.get("user_agent") if metadata else None,
                **(metadata or {})
            }
            
            # Create user in Supabase Auth
            response = self.client.auth.sign_up({
                "email": email,
                "password": password,
                "options": {
                    "data": user_metadata
                }
            })

            # Transform response for gotrue compatibility
            response = _transform_identity_response(response)
            
            if response.user:
                logger.info(f"User created successfully: {response.user.id}")
                return {
                    "success": True,
                    "user": {
                        "id": response.user.id,
                        "email": response.user.email,
                        "email_confirmed_at": response.user.email_confirmed_at,
                        "created_at": response.user.created_at,
                        "user_metadata": response.user.user_metadata
                    },
                    "session": {
                        "access_token": response.session.access_token if response.session else None,
                        "refresh_token": response.session.refresh_token if response.session else None,
                        "expires_in": response.session.expires_in if response.session else None
                    } if response.session else None
                }
            else:
                return {"success": False, "error": "Failed to create user"}
                
        except AuthError as e:
            logger.error(f"Supabase auth error during sign up: {e}")
            return {"success": False, "error": str(e)}
        except Exception as e:
            logger.error(f"Unexpected error during sign up: {e}")
            return {"success": False, "error": "Internal server error"}
    
    async def sign_in(self, email: str, password: str) -> Dict[str, Any]:
        """
        Authenticate user with Supabase Auth
        """
        try:
            logger.info("=== SIGN_IN DEBUG START ===")
            logger.info(f"Attempting sign in for email: {email}")

            response = self.client.auth.sign_in_with_password({
                "email": email,
                "password": password
            })

            logger.info(f"Supabase auth response received, type: {type(response)}")
            logger.info("About to call _transform_identity_response")

            # Transform response for gotrue compatibility
            response = _transform_identity_response(response)

            logger.info("_transform_identity_response completed")
            logger.info("=== SIGN_IN DEBUG END ===")
            
            if response.user and response.session:
                logger.info(f"User signed in successfully: {response.user.id}")
                return {
                    "success": True,
                    "user": {
                        "id": response.user.id,
                        "email": response.user.email,
                        "email_confirmed_at": response.user.email_confirmed_at,
                        "last_sign_in_at": response.user.last_sign_in_at,
                        "user_metadata": response.user.user_metadata
                    },
                    "session": {
                        "access_token": response.session.access_token,
                        "refresh_token": response.session.refresh_token,
                        "expires_in": response.session.expires_in,
                        "token_type": response.session.token_type
                    }
                }
            else:
                return {"success": False, "error": "Invalid credentials"}
                
        except AuthError as e:
            logger.error(f"Supabase auth error during sign in: {e}")
            return {"success": False, "error": str(e)}
        except Exception as e:
            logger.error(f"Unexpected error during sign in: {e}")
            return {"success": False, "error": "Internal server error"}
    
    async def sign_out(self, access_token: str) -> Dict[str, Any]:
        """
        Sign out user and invalidate session
        """
        try:
            # Set the session for the client
            self.client.auth.set_session(access_token, None)
            
            response = self.client.auth.sign_out()
            
            return {"success": True, "message": "User signed out successfully"}
            
        except AuthError as e:
            logger.error(f"Supabase auth error during sign out: {e}")
            return {"success": False, "error": str(e)}
        except Exception as e:
            logger.error(f"Unexpected error during sign out: {e}")
            return {"success": False, "error": "Internal server error"}
    
    async def refresh_token(self, refresh_token: str) -> Dict[str, Any]:
        """
        Refresh access token using refresh token
        """
        try:
            response = self.client.auth.refresh_session(refresh_token)

            # Transform response for gotrue compatibility
            response = _transform_identity_response(response)
            
            if response.session:
                return {
                    "success": True,
                    "session": {
                        "access_token": response.session.access_token,
                        "refresh_token": response.session.refresh_token,
                        "expires_in": response.session.expires_in,
                        "token_type": response.session.token_type
                    }
                }
            else:
                return {"success": False, "error": "Failed to refresh token"}
                
        except AuthError as e:
            logger.error(f"Supabase auth error during token refresh: {e}")
            return {"success": False, "error": str(e)}
        except Exception as e:
            logger.error(f"Unexpected error during token refresh: {e}")
            return {"success": False, "error": "Internal server error"}
    
    async def reset_password(self, email: str) -> Dict[str, Any]:
        """
        Send password reset email
        """
        try:
            response = self.client.auth.reset_password_email(email)
            
            return {"success": True, "message": "Password reset email sent"}
            
        except AuthError as e:
            logger.error(f"Supabase auth error during password reset: {e}")
            return {"success": False, "error": str(e)}
        except Exception as e:
            logger.error(f"Unexpected error during password reset: {e}")
            return {"success": False, "error": "Internal server error"}
    
    async def update_password(self, access_token: str, new_password: str) -> Dict[str, Any]:
        """
        Update user password
        """
        try:
            # Set the session for the client
            self.client.auth.set_session(access_token, None)
            
            response = self.client.auth.update_user({
                "password": new_password
            })
            
            if response.user:
                return {"success": True, "message": "Password updated successfully"}
            else:
                return {"success": False, "error": "Failed to update password"}
                
        except AuthError as e:
            logger.error(f"Supabase auth error during password update: {e}")
            return {"success": False, "error": str(e)}
        except Exception as e:
            logger.error(f"Unexpected error during password update: {e}")
            return {"success": False, "error": "Internal server error"}
    
    async def complete_password_reset(self, token: str, new_password: str) -> Dict[str, Any]:
        """
        Complete password reset using token from email
        """
        try:
            # Verify the OTP token and get session
            response = self.client.auth.verify_otp({
                "token_hash": token,
                "type": "recovery"
            })
            
            if not response.session:
                return {"success": False, "error": "Invalid or expired reset token"}
            
            # Use the session to update the password
            self.client.auth.set_session(response.session.access_token, response.session.refresh_token)
            
            update_response = self.client.auth.update_user({
                "password": new_password
            })
            
            if update_response.user:
                return {"success": True, "message": "Password reset successfully"}
            else:
                return {"success": False, "error": "Failed to reset password"}
                
        except AuthError as e:
            error_msg = str(e)
            logger.error(f"Supabase auth error during password reset completion: {error_msg}")
            
            # Provide user-friendly error messages
            if "expired" in error_msg.lower():
                return {"success": False, "error": "This reset link has expired. Please request a new one."}
            elif "invalid" in error_msg.lower() or "not found" in error_msg.lower():
                return {"success": False, "error": "This reset link is invalid. Please request a new one."}
            elif "already" in error_msg.lower() and "used" in error_msg.lower():
                return {"success": False, "error": "This reset link has already been used. Please request a new one."}
            else:
                return {"success": False, "error": "Failed to reset password. Please try again."}
                
        except Exception as e:
            logger.error(f"Unexpected error during password reset completion: {e}")
            return {"success": False, "error": "Internal server error"}
    
    async def verify_email(self, token: str, type: str = "signup") -> Dict[str, Any]:
        """
        Verify email with token
        """
        try:
            response = self.client.auth.verify_otp({
                "token": token,
                "type": type
            })
            
            if response.user:
                return {
                    "success": True,
                    "user": {
                        "id": response.user.id,
                        "email": response.user.email,
                        "email_confirmed_at": response.user.email_confirmed_at
                    }
                }
            else:
                return {"success": False, "error": "Invalid verification token"}
                
        except AuthError as e:
            logger.error(f"Supabase auth error during email verification: {e}")
            return {"success": False, "error": str(e)}
        except Exception as e:
            logger.error(f"Unexpected error during email verification: {e}")
            return {"success": False, "error": "Internal server error"}
    
    def verify_jwt_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Verify and decode JWT token with signature verification enabled
        
        Raises:
            AuthenticationError: If token is expired or invalid
        """
        try:
            # Verify token with Supabase JWT secret and signature verification
            payload = jwt.decode(
                token,
                self.jwt_secret,
                algorithms=["HS256"],
                audience="authenticated",
                options={"verify_signature": True}
            )
            
            return {
                "user_id": payload.get("sub"),
                "email": payload.get("email"),
                "role": payload.get("role", "authenticated"),
                "aud": payload.get("aud"),
                "iss": payload.get("iss"),
                "exp": payload.get("exp"),
                "iat": payload.get("iat"),
                "user_metadata": payload.get("user_metadata", {}),
                "app_metadata": payload.get("app_metadata", {})
            }
            
        except jwt.ExpiredSignatureError as e:
            # Log security event for expired token
            logger.warning(
                "Authentication failed: Token has expired",
                extra={
                    "error_type": "expired_token",
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
            )
            raise AuthenticationError("Token has expired")
            
        except jwt.InvalidTokenError as e:
            # Log security event for invalid token (includes signature verification failures)
            logger.warning(
                "Authentication failed: Invalid token",
                extra={
                    "error_type": "invalid_token",
                    "error_detail": str(e),
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
            )
            raise AuthenticationError("Invalid token")
            
        except Exception as e:
            # Log unexpected errors
            logger.error(
                "Unexpected error during JWT verification",
                extra={
                    "error_type": "jwt_verification_error",
                    "error_detail": str(e),
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
            )
            raise AuthenticationError("Invalid token")
    
    async def get_user_by_token(self, access_token: str) -> Optional[Dict[str, Any]]:
        """
        Get user information from access token
        """
        try:
            # Set the session for the client
            self.client.auth.set_session(access_token, None)
            
            response = self.client.auth.get_user()
            
            if response.user:
                return {
                    "id": response.user.id,
                    "email": response.user.email,
                    "email_confirmed_at": response.user.email_confirmed_at,
                    "created_at": response.user.created_at,
                    "updated_at": response.user.updated_at,
                    "last_sign_in_at": response.user.last_sign_in_at,
                    "user_metadata": response.user.user_metadata,
                    "app_metadata": response.user.app_metadata
                }
            else:
                return None
                
        except AuthError as e:
            logger.error(f"Supabase auth error getting user: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error getting user: {e}")
            return None
    
    async def admin_get_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get user information using service role (admin)
        """
        try:
            response = self.service_client.auth.admin.get_user_by_id(user_id)
            
            if response.user:
                return {
                    "id": response.user.id,
                    "email": response.user.email,
                    "email_confirmed_at": response.user.email_confirmed_at,
                    "created_at": response.user.created_at,
                    "updated_at": response.user.updated_at,
                    "last_sign_in_at": response.user.last_sign_in_at,
                    "user_metadata": response.user.user_metadata,
                    "app_metadata": response.user.app_metadata
                }
            else:
                return None
                
        except AuthError as e:
            logger.error(f"Supabase admin auth error: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected admin error: {e}")
            return None
    
    async def admin_update_user_metadata(
        self, 
        user_id: str, 
        user_metadata: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Update user metadata using service role (admin)
        """
        try:
            response = self.service_client.auth.admin.update_user_by_id(
                user_id,
                {
                    "user_metadata": user_metadata
                }
            )
            
            if response.user:
                return {"success": True, "user": response.user}
            else:
                return {"success": False, "error": "Failed to update user metadata"}
                
        except AuthError as e:
            logger.error(f"Supabase admin auth error updating metadata: {e}")
            return {"success": False, "error": str(e)}
        except Exception as e:
            logger.error(f"Unexpected admin error updating metadata: {e}")
            return {"success": False, "error": "Internal server error"}


# =============================================================================
# Global Supabase Auth Instance
# =============================================================================

supabase_auth = SupabaseAuth()

# =============================================================================
# Export
# =============================================================================

__all__ = ["SupabaseAuth", "supabase_auth", "AuthenticationError"]