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
            response = self.client.auth.sign_in_with_password({
                "email": email,
                "password": password
            })
            
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
        Verify and decode JWT token
        """
        try:
            # Decode token without verification first to get header
            unverified_header = jwt.get_unverified_header(token)
            unverified_payload = jwt.decode(token, options={"verify_signature": False})
            
            # Verify token with Supabase JWT secret
            payload = jwt.decode(
                token,
                self.jwt_secret,
                algorithms=["HS256"],
                audience="authenticated"
            )
            
            # Check token expiration
            if payload.get("exp", 0) < datetime.now(timezone.utc).timestamp():
                logger.warning("JWT token has expired")
                return None
            
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
            
        except JWTError as e:
            logger.warning(f"Invalid JWT token: {e}")
            return None
        except Exception as e:
            logger.error(f"Error verifying JWT token: {e}")
            return None
    
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

__all__ = ["SupabaseAuth", "supabase_auth"]