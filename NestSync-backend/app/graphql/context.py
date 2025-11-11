"""
GraphQL Context for NestSync
Custom context implementation with FastAPI, Supabase, and PIPEDA compliance
Follows Context7 patterns for proper Strawberry GraphQL authentication
"""

import logging
import asyncio
import uuid
from typing import Optional, Dict, Any
from fastapi import Request
from sqlalchemy import select
import strawberry
from strawberry.fastapi import BaseContext
from graphql import GraphQLError

from app.config.database import get_async_session
from app.config.settings import settings
from app.models import User
from app.auth.supabase import supabase_auth
from app.utils.logging import sanitize_log_data

logger = logging.getLogger(__name__)


class NestSyncGraphQLContext(BaseContext):
    """
    Custom GraphQL context for NestSync with PIPEDA compliance
    
    Follows Context7 patterns:
    - BaseContext extension with @cached_property for user authentication
    - Proper authorization header processing
    - Lazy user loading without FastAPI Depends
    
    This context provides access to:
    - FastAPI request object
    - Current user (lazy-loaded via @cached_property)
    - Canadian compliance information
    - User permissions based on authentication status
    """
    
    def __init__(self, request: Request):
        # Call BaseContext constructor
        super().__init__()
        
        # Core FastAPI request
        self.request = request
        
        # Canadian compliance context
        self.data_region = settings.data_region
        self.compliance_framework = "PIPEDA"
        self.timezone = settings.timezone
        
        # CRITICAL FIX: Per-request authentication caching to prevent double token validation
        self._cached_user: Optional[User] = None
        self._auth_attempted: bool = False
        self._auth_token_hash: Optional[str] = None
        
        logger.info(
            "Context created for request",
            extra={
                "method": request.method,
                "path": sanitize_log_data(str(request.url.path))
            }
        )
        
        # Log token information for debugging (without exposing sensitive data)
        auth_header = self.request.headers.get("Authorization", "")
        has_bearer = auth_header.startswith("Bearer ")
        token_length = len(auth_header[7:]) if has_bearer else 0
        logger.info(
            "Context initialization",
            extra={
                "has_bearer": has_bearer,
                "token_length": token_length
            }
        )

    async def get_user(self) -> Optional[User]:
        """
        Get current authenticated user with per-request caching to prevent double token validation
        
        CRITICAL FIX: Implements per-request authentication caching to solve token validation race condition
        - Caches authentication result within single request to prevent double validation
        - Handles token changes within request (refresh scenarios) 
        - Prevents "Authentication required" errors when same token is validated twice
        """
        request_id = id(self.request) if self.request else "no-request"
        logger.info(f"Context.get_user() called - request_id: {request_id}")
        
        if not self.request:
            logger.warning("Context: No request available for authentication")
            return None
            
        # Extract authorization header
        authorization = self.request.headers.get("Authorization", None)
        if not authorization:
            # Cache negative result to prevent repeated header checks
            if not self._auth_attempted:
                logger.info("Context: No Authorization header found")
                self._auth_attempted = True
                self._cached_user = None
            return None
            
        if not authorization.startswith("Bearer "):
            # Cache negative result
            if not self._auth_attempted:
                logger.info("Context: Authorization header does not start with 'Bearer '")
                self._auth_attempted = True
                self._cached_user = None
            return None
            
        token = authorization[7:]  # Remove 'Bearer ' prefix
        
        # Generate token hash to detect token changes within request
        import hashlib
        current_token_hash = hashlib.md5(token.encode()).hexdigest()
        
        # CRITICAL FIX: Return cached user if same token already validated in this request
        if (self._auth_attempted and 
            self._auth_token_hash == current_token_hash and 
            self._cached_user is not None):
            logger.info(f"Context: Returning cached authenticated user - user.id: {self._cached_user.id}")
            return self._cached_user
            
        # If different token or first attempt, validate fresh
        self._auth_attempted = True
        self._auth_token_hash = current_token_hash
        
        # Enhanced logging for token validation debugging
        token_preview = f"{token[:10]}...{token[-4:]}" if len(token) > 14 else "short-token"
        logger.info(f"Context: Validating Bearer token - preview: {token_preview}, length: {len(token)}")
        
        try:
            # Token verification (now only happens once per token per request)
            token_payload = supabase_auth.verify_jwt_token(token)
            if not token_payload:
                logger.warning("Context: Token verification failed - invalid or expired token")
                self._cached_user = None
                return None
                
            user_id = token_payload.get("user_id")
            if not user_id:
                logger.warning("Context: Token payload missing user_id")
                self._cached_user = None
                return None
                
            logger.info(f"Context: Token verified successfully - user_id: {user_id}")
            
            # Query user from database with enhanced error handling
            try:
                async for session in get_async_session():
                    result = await session.execute(
                        select(User).where(
                            User.supabase_user_id == uuid.UUID(user_id),
                            User.is_deleted == False
                        )
                    )
                    user = result.scalar_one_or_none()
                    
                    if not user:
                        logger.warning(f"Context: User not found in database - user_id: {user_id}")
                        self._cached_user = None
                        return None
                        
                    # Enhanced debugging for can_login property evaluation
                    can_login_status = user.can_login
                    logger.info(f"Context: User login status check - user_id: {user_id}")
                    logger.info(f"Context: - status: '{user.status}' (should be 'active')")
                    logger.info(f"Context: - email_verified: {user.email_verified} (should be True)")
                    logger.info(f"Context: - is_locked: {user.is_locked} (should be False)")
                    logger.info(f"Context: - is_deleted: {user.is_deleted} (should be False)")
                    logger.info(f"Context: - can_login result: {can_login_status}")
                    
                    if not can_login_status:
                        logger.error(f"Context: User cannot login - blocking access")
                        logger.error(f"Context: Authentication required - user lookup failed")
                        self._cached_user = None
                        return None
                    
                    logger.info(f"Context: User authenticated successfully - user.id: {user.id}, user.email: {user.email}")
                    
                    # Cache successful authentication result for this request
                    self._cached_user = user
                    return user
                    
            except Exception as db_error:
                logger.error(f"Context: Database error during user lookup: {db_error}")
                self._cached_user = None
                return None
                
        except Exception as e:
            logger.error(f"Context: Token validation error: {e}")
            self._cached_user = None
            return None
    
    @property
    def user(self) -> Optional[User]:
        """
        Synchronous property to access user (requires async get_user() call first)
        
        WARNING: This property cannot validate authentication synchronously.
        Use await context.get_user() or await context.require_authentication() instead.
        This property is kept for backward compatibility but may return None.
        """
        logger.warning("Context.user property accessed - use async get_user() instead")
        return None
    
    @property
    def current_user(self) -> Optional[User]:
        """
        Alias for user property (deprecated)
        Use await context.get_user() instead
        """
        logger.warning("Context.current_user property accessed - use async get_user() instead")
        return None
        
    async def is_authenticated(self) -> bool:
        """
        Check if user is authenticated (async)
        """
        user = await self.get_user()
        return user is not None
        
    async def get_user_permissions(self, user: Optional[User] = None) -> Dict[str, bool]:
        """
        Get user permissions based on user status (async)
        """
        if not user:
            user = await self.get_user()
            
        if not user:
            return {
                "can_read_profile": False,
                "can_update_profile": False,
                "can_manage_children": False,
                "can_access_onboarding": False,
                "can_manage_consents": False
            }
        
        # Basic permissions for authenticated users
        permissions = {
            "can_read_profile": True,
            "can_update_profile": True,
            "can_access_onboarding": True,
            "can_manage_consents": True
        }
        
        # Additional permissions based on user status
        if user.is_verified:
            permissions["can_manage_children"] = True
        
        return permissions
        
    @property
    def user_permissions(self) -> Dict[str, bool]:
        """
        Get user permissions (deprecated sync property)
        Use await context.get_user_permissions() instead
        """
        logger.warning("Context.user_permissions property accessed - use async get_user_permissions() instead")
        return {
            "can_read_profile": False,
            "can_update_profile": False,
            "can_manage_children": False,
            "can_access_onboarding": False,
            "can_manage_consents": False
        }
    
    async def get_user_id(self) -> Optional[str]:
        """Get current user ID as string (async)"""
        user = await self.get_user()
        return str(user.id) if user else None
    
    async def get_supabase_user_id(self) -> Optional[str]:
        """Get Supabase user ID (async)"""
        user = await self.get_user()
        return str(user.supabase_user_id) if user else None
    
    @property
    def user_id(self) -> Optional[str]:
        """Get current user ID (deprecated sync property)"""
        logger.warning("Context.user_id property accessed - use async get_user_id() instead")
        return None
    
    @property
    def supabase_user_id(self) -> Optional[str]:
        """Get Supabase user ID (deprecated sync property)"""
        logger.warning("Context.supabase_user_id property accessed - use async get_supabase_user_id() instead")
        return None
    
    async def require_authentication(self) -> User:
        """
        Require authentication and return current user
        Raises GraphQL error if not authenticated
        """
        user = await self.get_user()
        if not user:
            logger.error(
                "Context: Authentication required - user lookup failed",
                extra={"context": "require_authentication"}
            )
            raise GraphQLError(
                "Authentication required",
                extensions={"code": "UNAUTHENTICATED"}
            )
        
        logger.info(
            "Context: User authenticated successfully",
            extra={"user_id": sanitize_log_data(str(user.id))}
        )
        return user
    
    async def require_permission(self, permission: str) -> User:
        """
        Require specific permission and return current user (async)
        """
        user = await self.require_authentication()
        
        permissions = await self.get_user_permissions(user)
        if not permissions.get(permission, False):
            logger.warning(f"Context: Permission denied - {permission} for user {user.id}")
            raise GraphQLError(f"Permission required: {permission}")
        
        return user
    
    async def require_verified_user(self) -> User:
        """
        Require verified user (async)
        """
        user = await self.require_authentication()
        
        if not user.is_verified:
            logger.warning(f"Context: Email verification required for user {user.id}")
            raise GraphQLError("Email verification required")
        
        return user
        
    def get_request_context(self) -> Dict[str, Any]:
        """
        Get request context for audit trails
        """
        if not self.request:
            return {}
            
        # Get client IP address
        forwarded_for = self.request.headers.get("X-Forwarded-For")
        if forwarded_for:
            ip_address = forwarded_for.split(",")[0].strip()
        else:
            real_ip = self.request.headers.get("X-Real-IP")
            ip_address = real_ip.strip() if real_ip else (self.request.client.host if self.request.client else "unknown")
            
        return {
            "ip_address": ip_address,
            "user_agent": self.request.headers.get("User-Agent", "unknown"),
            "session_id": self.request.headers.get("X-Session-ID")
        }
    
    async def get_audit_context(self) -> Dict[str, Any]:
        """
        Get audit context for PIPEDA compliance (async)
        """
        request_context = self.get_request_context()
        user_id = await self.get_user_id()
        supabase_user_id = await self.get_supabase_user_id()
        
        return {
            "user_id": user_id,
            "supabase_user_id": supabase_user_id,
            "ip_address": request_context.get("ip_address"),
            "user_agent": request_context.get("user_agent"),
            "session_id": request_context.get("session_id"),
            "data_region": self.data_region,
            "compliance_framework": self.compliance_framework
        }
    
    async def log_access(self, operation: str, resource: str, success: bool = True):
        """
        Log access for audit trails (PIPEDA compliance) - async
        """
        audit_context = await self.get_audit_context()
        
        log_data = {
            "operation": operation,
            "resource": resource,
            "success": success,
            **audit_context
        }
        
        if success:
            logger.info(f"GraphQL access: {operation} on {resource}", extra=log_data)
        else:
            logger.warning(f"GraphQL access denied: {operation} on {resource}", extra=log_data)


async def create_graphql_context(request: Request) -> NestSyncGraphQLContext:
    """
    Create GraphQL context with authentication (Context7 pattern)
    
    This function is used as the context_getter for the GraphQL router
    Authentication is lazy-loaded via @cached_property in the context class
    Following Context7 guidance: NO FastAPI Depends, simple context creation
    """
    try:
        logger.info(f"Creating GraphQL context for: {request.method} {request.url.path}")
        
        # Simple context creation - authentication is handled by @cached_property
        context = NestSyncGraphQLContext(request=request)
        
        logger.info("GraphQL context created successfully")
        return context
        
    except Exception as e:
        logger.error(f"Failed to create GraphQL context: {e}")
        # Return minimal context on error
        return NestSyncGraphQLContext(request=request)


# =============================================================================
# Context Dependencies for Strawberry Field Resolvers
# =============================================================================

async def get_context_user(info) -> Optional[User]:
    """Get current user from GraphQL context (async)"""
    logger.info("Getting context user")
    try:
        user = await info.context.get_user()
        logger.info(f"Context user retrieved: {bool(user)}")
        return user
    except Exception as e:
        logger.error(f"Error getting context user: {e}")
        return None


async def require_context_user(info) -> User:
    """Require authenticated user from GraphQL context"""
    logger.info("Requiring context user authentication")
    try:
        user = await info.context.get_user()
        if not user:
            logger.error("Context: Authentication required - user lookup failed")
            raise GraphQLError(
                "Authentication required to create child profile",
                extensions={"code": "UNAUTHENTICATED"}
            )
        logger.info(f"Context: User authenticated successfully: {user.id}")
        return user
    except GraphQLError:
        # Re-raise GraphQL errors as-is
        raise
    except Exception as e:
        logger.error(f"Context: Error during authentication: {e}")
        raise GraphQLError(
            "Authentication required to create child profile", 
            extensions={"code": "UNAUTHENTICATED"}
        )


def require_context_permission(permission: str):
    """Create a dependency that requires specific permission (async)"""
    async def _require_permission(info) -> User:
        return await info.context.require_permission(permission)
    return _require_permission


# =============================================================================
# Export Context Components
# =============================================================================

__all__ = [
    "NestSyncGraphQLContext",
    "create_graphql_context", 
    "get_context_user",
    "require_context_user",
    "require_context_permission"
]