"""
Authentication Dependencies for FastAPI
PIPEDA-compliant JWT authentication and authorization
"""

import logging
from typing import Optional, Dict, Any
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.database import get_async_session
from app.models import User, UserStatus
from app.auth.supabase import supabase_auth

logger = logging.getLogger(__name__)

# HTTP Bearer token security scheme
security = HTTPBearer(auto_error=False)


class AuthenticationError(HTTPException):
    """Custom authentication error"""
    def __init__(self, detail: str = "Authentication failed"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"}
        )


class AuthorizationError(HTTPException):
    """Custom authorization error"""
    def __init__(self, detail: str = "Insufficient permissions"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail
        )


async def get_current_user_token(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[Dict[str, Any]]:
    """
    Extract and verify JWT token from Authorization header
    Returns None if no token or invalid token (for optional authentication)
    """
    if not credentials:
        return None
    
    token = credentials.credentials
    if not token:
        return None
    
    # Verify JWT token with Supabase
    payload = supabase_auth.verify_jwt_token(token)
    if not payload:
        return None
    
    return payload


async def get_current_user_token_required(
    token_payload: Optional[Dict[str, Any]] = Depends(get_current_user_token)
) -> Dict[str, Any]:
    """
    Extract and verify JWT token from Authorization header (required)
    Raises AuthenticationError if token is missing or invalid
    """
    if not token_payload:
        raise AuthenticationError("Valid authentication token required")
    
    return token_payload


async def get_current_user(
    token_payload: Dict[str, Any] = Depends(get_current_user_token_required),
    session: AsyncSession = Depends(get_async_session)
) -> User:
    """
    Get current authenticated user from database
    """
    try:
        # Get user ID from JWT 'sub' field (standard JWT claim)
        user_id = token_payload.get("sub") or token_payload.get("user_id")
        if not user_id:
            raise AuthenticationError("Invalid token: missing user ID")
        
        # Query user from database
        from sqlalchemy import select
        result = await session.execute(
            select(User).where(
                User.supabase_user_id == user_id,
                User.is_deleted == False
            )
        )
        user = result.scalar_one_or_none()
        
        if not user:
            raise AuthenticationError("User not found")
        
        # Check if user account is active
        if not user.can_login:
            if user.status == UserStatus.SUSPENDED:
                raise AuthenticationError("Account suspended")
            elif user.status == UserStatus.PENDING_VERIFICATION:
                raise AuthenticationError("Email verification required")
            elif user.is_locked:
                raise AuthenticationError("Account temporarily locked")
            else:
                raise AuthenticationError("Account not active")
        
        return user
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting current user: {e}")
        raise AuthenticationError("Authentication failed")


async def get_current_user_optional(
    token_payload: Optional[Dict[str, Any]] = Depends(get_current_user_token),
    session: AsyncSession = Depends(get_async_session)
) -> Optional[User]:
    """
    Get current authenticated user (optional)
    Returns None if not authenticated or invalid token
    """
    if not token_payload:
        return None
    
    try:
        # Get user ID from JWT 'sub' field (standard JWT claim)
        user_id = token_payload.get("sub") or token_payload.get("user_id")
        if not user_id:
            return None
        
        # Query user from database
        from sqlalchemy import select
        result = await session.execute(
            select(User).where(
                User.supabase_user_id == user_id,
                User.is_deleted == False
            )
        )
        user = result.scalar_one_or_none()
        
        # Check if user can login
        if user and not user.can_login:
            return None
        
        return user
        
    except Exception as e:
        logger.warning(f"Error getting optional current user: {e}")
        return None


async def require_verified_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Require that the current user is verified
    """
    if not current_user.is_verified:
        raise AuthenticationError("Email verification required")
    
    return current_user


async def require_onboarded_user(
    current_user: User = Depends(require_verified_user)
) -> User:
    """
    Require that the current user has completed onboarding
    """
    if not current_user.onboarding_completed:
        raise AuthorizationError("Onboarding completion required")
    
    return current_user


async def require_consents(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Require that the user has given all required consents (PIPEDA)
    """
    if not current_user.has_required_consents:
        raise AuthorizationError("Required consent agreements must be accepted")
    
    return current_user


# =============================================================================
# Request Context Utilities
# =============================================================================

def get_client_ip(request: Request) -> str:
    """
    Get client IP address for audit trail
    """
    # Check for X-Forwarded-For header (proxy/load balancer)
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    
    # Check for X-Real-IP header
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip.strip()
    
    # Fall back to direct connection IP
    return request.client.host if request.client else "unknown"


def get_user_agent(request: Request) -> str:
    """
    Get user agent for audit trail
    """
    return request.headers.get("User-Agent", "unknown")


class RequestContext:
    """
    Request context for audit trails and PIPEDA compliance
    """
    
    def __init__(self, request: Request):
        self.ip_address = get_client_ip(request)
        self.user_agent = get_user_agent(request)
        self.timestamp = None  # Will be set by the service
        self.session_id = request.headers.get("X-Session-ID")
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "ip_address": self.ip_address,
            "user_agent": self.user_agent,
            "session_id": self.session_id
        }


async def get_request_context(request: Request) -> RequestContext:
    """
    Get request context for audit trails
    """
    return RequestContext(request)


# =============================================================================
# Rate Limiting Dependencies
# =============================================================================

async def check_rate_limit(
    request: Request,
    max_requests: int = 100,
    window_seconds: int = 900  # 15 minutes
) -> None:
    """
    Basic rate limiting check (can be enhanced with Redis)
    """
    # For now, this is a placeholder
    # In production, implement with Redis or similar
    pass


# =============================================================================
# Admin and Special Role Dependencies
# =============================================================================

async def require_admin_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Require admin user (future implementation)
    """
    # For now, just require verified user
    # Can be extended with role-based access control
    if not current_user.is_verified:
        raise AuthorizationError("Admin access required")
    
    return current_user


# =============================================================================
# GraphQL Context Utilities
# =============================================================================

async def get_user_id_from_context(info) -> Optional[str]:
    """
    Extract user ID from GraphQL context
    Used by collaboration resolvers for user identification
    """
    try:
        return await info.context.get_user_id()
    except Exception as e:
        logger.warning(f"Could not get user ID from context: {e}")
        return None


# =============================================================================
# Export Dependencies
# =============================================================================

__all__ = [
    "get_current_user_token",
    "get_current_user_token_required",
    "get_current_user",
    "get_current_user_optional",
    "require_verified_user",
    "require_onboarded_user",
    "require_consents",
    "get_request_context",
    "RequestContext",
    "check_rate_limit",
    "require_admin_user",
    "get_user_id_from_context",
    "AuthenticationError",
    "AuthorizationError"
]