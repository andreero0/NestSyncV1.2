"""
GraphQL Context for NestSync
Custom context implementation with FastAPI, Supabase, and PIPEDA compliance
"""

import logging
from typing import Optional, Dict, Any
from dataclasses import dataclass
from fastapi import Request, Depends
from sqlalchemy.ext.asyncio import AsyncSession
import strawberry
from strawberry.types.info import RootValueType

from app.config.database import get_async_session
from app.config.settings import settings
from app.models import User
from app.auth.dependencies import get_current_user_optional, RequestContext, get_request_context
from app.auth.supabase import supabase_auth

logger = logging.getLogger(__name__)


class NestSyncGraphQLContext:
    """
    Custom GraphQL context for NestSync with PIPEDA compliance
    
    This context provides access to:
    - FastAPI request object
    - Database session
    - Current user (if authenticated)
    - Request context for audit trails
    - Supabase client
    - Canadian compliance information
    """
    
    def __init__(
        self,
        request: Request,
        session: AsyncSession,
        current_user: Optional[User] = None,
        request_context: Optional[RequestContext] = None
    ):
        # Core FastAPI and database
        self.request = request
        self.session = session
        
        # Authentication and user context
        self.current_user = current_user
        self.request_context = request_context
        
        # Canadian compliance context
        self.data_region = settings.data_region
        self.compliance_framework = "PIPEDA"
        self.timezone = settings.timezone
        
        # GraphQL specific
        self.is_authenticated = self.current_user is not None
        self.user_permissions = self._get_user_permissions()
    
    def _get_user_permissions(self) -> Dict[str, bool]:
        """
        Get user permissions based on current user status
        """
        if not self.current_user:
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
        if self.current_user.is_verified:
            permissions["can_manage_children"] = True
        
        return permissions
    
    @property
    def user_id(self) -> Optional[str]:
        """Get current user ID as string"""
        return str(self.current_user.id) if self.current_user else None
    
    @property
    def supabase_user_id(self) -> Optional[str]:
        """Get Supabase user ID"""
        return str(self.current_user.supabase_user_id) if self.current_user else None
    
    def require_authentication(self) -> User:
        """
        Require authentication and return current user
        Raises GraphQL error if not authenticated
        """
        if not self.is_authenticated or not self.current_user:
            from strawberry import GraphQLError
            raise GraphQLError("Authentication required")
        
        return self.current_user
    
    def require_permission(self, permission: str) -> User:
        """
        Require specific permission and return current user
        """
        user = self.require_authentication()
        
        if not self.user_permissions.get(permission, False):
            from strawberry import GraphQLError
            raise GraphQLError(f"Permission required: {permission}")
        
        return user
    
    def require_verified_user(self) -> User:
        """
        Require verified user
        """
        user = self.require_authentication()
        
        if not user.is_verified:
            from strawberry import GraphQLError
            raise GraphQLError("Email verification required")
        
        return user
    
    def get_audit_context(self) -> Dict[str, Any]:
        """
        Get audit context for PIPEDA compliance
        """
        return {
            "user_id": self.user_id,
            "supabase_user_id": self.supabase_user_id,
            "ip_address": self.request_context.ip_address if self.request_context else None,
            "user_agent": self.request_context.user_agent if self.request_context else None,
            "session_id": self.request_context.session_id if self.request_context else None,
            "data_region": self.data_region,
            "compliance_framework": self.compliance_framework
        }
    
    def log_access(self, operation: str, resource: str, success: bool = True):
        """
        Log access for audit trails (PIPEDA compliance)
        """
        audit_context = self.get_audit_context()
        
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


async def create_graphql_context(
    request: Request,
    session: AsyncSession = Depends(get_async_session)
) -> Dict[str, Any]:
    """
    Create GraphQL context with authentication and database session
    
    This function is used as the context_getter for the GraphQL router
    Uses FastAPI dependency injection for proper session management
    Returns a dictionary for simpler Strawberry compatibility
    """
    try:
        # Get request context for audit trails  
        request_context = await get_request_context(request)
        
        # Try to get current user (optional - no error if not authenticated)
        current_user = None
        
        try:
            # Extract token from request headers for authentication
            auth_header = request.headers.get("Authorization")
            if auth_header and auth_header.startswith("Bearer "):
                token = auth_header[7:]
                
                # Verify token with Supabase
                token_payload = supabase_auth.verify_jwt_token(token)
                
                if token_payload:
                    # Get user from database using dependency-injected session
                    user_id = token_payload.get("user_id")
                    if user_id:
                        from sqlalchemy import select
                        import uuid
                        result = await session.execute(
                            select(User).where(
                                User.supabase_user_id == uuid.UUID(user_id),
                                User.is_deleted == False
                            )
                        )
                        user = result.scalar_one_or_none()
                        
                        # Check if user can access the system
                        if user and user.can_login:
                            current_user = user
                            
        except Exception as e:
            # Log but don't fail - just proceed without authentication
            logger.debug(f"Could not authenticate GraphQL user: {e}")
        
        # Create context dictionary
        context = {
            "request": request,
            "session": session,
            "current_user": current_user,
            "request_context": request_context,
            "data_region": settings.data_region,
            "compliance_framework": "PIPEDA",
            "timezone": settings.timezone,
            "is_authenticated": current_user is not None
        }
        
        return context
        
    except Exception as e:
        logger.error(f"Failed to create GraphQL context: {e}")
        # Return minimal context on error - session should still be valid from DI
        return {
            "request": request,
            "session": session,  # Use the dependency-injected session
            "current_user": None,
            "request_context": None,
            "is_authenticated": False,
            "data_region": settings.data_region,
            "compliance_framework": "PIPEDA",
            "timezone": settings.timezone
        }


# =============================================================================
# Context Dependencies for Strawberry Field Resolvers
# =============================================================================

def get_context_session(info) -> AsyncSession:
    """Get database session from GraphQL context"""
    return info.context.session


def get_context_user(info) -> Optional[User]:
    """Get current user from GraphQL context"""
    return info.context.current_user


def require_context_user(info) -> User:
    """Require authenticated user from GraphQL context"""
    return info.context.require_authentication()


def require_context_permission(permission: str):
    """Create a dependency that requires specific permission"""
    def _require_permission(info) -> User:
        return info.context.require_permission(permission)
    return _require_permission


# =============================================================================
# Export Context Components
# =============================================================================

__all__ = [
    "NestSyncGraphQLContext",
    "create_graphql_context", 
    "get_context_session",
    "get_context_user",
    "require_context_user",
    "require_context_permission"
]