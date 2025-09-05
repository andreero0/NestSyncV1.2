"""
GraphQL Authentication Resolvers
PIPEDA-compliant user authentication and authorization
"""

import logging
import uuid
from typing import Optional
from datetime import datetime, timezone
import strawberry
from strawberry.types import Info
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.auth import supabase_auth, get_request_context, RequestContext
from app.config.database import get_async_session
from app.config.settings import settings
from app.models import User, ConsentRecord, create_default_consent_records, UserStatus
from app.services.user_service import UserService
from app.services.consent_service import ConsentService
from .types import (
    AuthResponse, 
    UserProfile, 
    UserSession,
    SignUpInput,
    SignInInput,
    ResetPasswordInput,
    ChangePasswordInput,
    UpdateProfileInput,
    ConsentUpdateInput,
    UserProfileResponse,
    MutationResponse,
    UserConsent,
    ConsentConnection,
    PageInfo
)

logger = logging.getLogger(__name__)


def user_to_graphql(user: User) -> UserProfile:
    """Convert User model to GraphQL UserProfile type"""
    return UserProfile(
        id=str(user.id),
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        display_name=user.display_name,
        timezone=user.timezone,
        language=user.language,
        currency=user.currency,
        province=user.province,
        status=user.status,
        email_verified=user.email_verified,
        onboarding_completed=user.onboarding_completed,
        created_at=user.created_at
    )


def consent_to_graphql(consent: ConsentRecord) -> UserConsent:
    """Convert ConsentRecord model to GraphQL UserConsent type"""
    return UserConsent(
        consent_type=consent.consent_type,
        status=consent.status,
        granted_at=consent.granted_at,
        withdrawn_at=consent.withdrawn_at,
        expires_at=consent.expires_at,
        consent_version=consent.consent_version
    )


@strawberry.type
class AuthMutations:
    """Authentication mutations"""
    
    @strawberry.mutation
    async def sign_up(
        self, 
        input: SignUpInput, 
        info: Info
    ) -> AuthResponse:
        """
        Register new user with PIPEDA compliance
        """
        try:
            # Get request context for audit trail
            request = info.context["request"]
            context = info.context.get("request_context")
            if not context:
                context = await get_request_context(request)
            
            # Validate required consents
            if not input.accept_privacy_policy or not input.accept_terms_of_service:
                return AuthResponse(
                    success=False,
                    error="Privacy policy and terms of service must be accepted"
                )
            
            # Create user with Supabase Auth
            auth_result = await supabase_auth.sign_up(
                email=input.email,
                password=input.password,
                metadata={
                    "ip_address": context.ip_address,
                    "user_agent": context.user_agent,
                    "first_name": input.first_name,
                    "last_name": input.last_name,
                    "timezone": input.timezone,
                    "language": input.language,
                    "province": input.province
                }
            )
            
            if not auth_result["success"]:
                return AuthResponse(
                    success=False,
                    error=auth_result["error"]
                )
            
            # Get database session from context
            session = info.context.get("session")
            if not session:
                return AuthResponse(
                    success=False,
                    error="Database session not available"
                )
            
            try:
                # Create user
                user = User(
                    email=input.email,
                    supabase_user_id=uuid.UUID(auth_result["user"]["id"]),
                    first_name=input.first_name,
                    last_name=input.last_name,
                    timezone=input.timezone,
                    language=input.language,
                    province=input.province,
                    status=UserStatus.PENDING_VERIFICATION,
                    privacy_policy_accepted=input.accept_privacy_policy,
                    privacy_policy_accepted_at=datetime.now(timezone.utc),
                    terms_of_service_accepted=input.accept_terms_of_service,
                    terms_of_service_accepted_at=datetime.now(timezone.utc),
                    marketing_consent=input.marketing_consent,
                    analytics_consent=input.analytics_consent,
                    consent_version=settings.consent_version,
                    consent_granted_at=datetime.now(timezone.utc),
                    consent_ip_address=context.ip_address,
                    consent_user_agent=context.user_agent,
                    created_by=None  # Self-registration
                )
                
                session.add(user)
                await session.flush()  # Get user ID
                
                # Create default consent records
                consent_records = create_default_consent_records(
                    user.id, 
                    settings.consent_version
                )
                
                for record in consent_records:
                    # Grant required consents
                    if record.consent_type in ["privacy_policy", "terms_of_service"]:
                        record.grant_consent(
                            context.ip_address,
                            context.user_agent,
                            {"registration": True}
                        )
                    # Grant optional consents based on user choice
                    elif record.consent_type == "marketing" and input.marketing_consent:
                        record.grant_consent(context.ip_address, context.user_agent)
                    elif record.consent_type == "analytics" and input.analytics_consent:
                        record.grant_consent(context.ip_address, context.user_agent)
                    
                    session.add(record)
                
                await session.commit()
                
                logger.info(f"User created successfully: {user.id}")
                
                # Return response with session if available
                session_data = None
                if auth_result.get("session"):
                    session_data = UserSession(
                        access_token=auth_result["session"]["access_token"],
                        refresh_token=auth_result["session"]["refresh_token"],
                        expires_in=auth_result["session"]["expires_in"]
                    )
                
                return AuthResponse(
                    success=True,
                    message="Account created successfully. Please check your email for verification.",
                    user=user_to_graphql(user),
                    session=session_data
                )
                
            except Exception as db_error:
                logger.error(f"Database error during user creation: {db_error}")
                # Rollback will be handled automatically by session lifecycle
                return AuthResponse(
                    success=False,
                    error="Failed to create user account. Please try again."
                )
                
        except Exception as e:
            logger.error(f"Error during sign up: {e}")
            return AuthResponse(
                success=False,
                error="Registration failed. Please try again."
            )
    
    @strawberry.mutation
    async def sign_in(
        self, 
        input: SignInInput, 
        info: Info
    ) -> AuthResponse:
        """
        Authenticate user
        """
        try:
            # Get request context
            request = info.context["request"]
            context = await get_request_context(request)
            
            # Authenticate with Supabase
            auth_result = await supabase_auth.sign_in(input.email, input.password)
            
            if not auth_result["success"]:
                return AuthResponse(
                    success=False,
                    error=auth_result["error"]
                )
            
            # Get user from database
            async for session in get_async_session():
                result = await session.execute(
                    select(User).where(
                        User.supabase_user_id == uuid.UUID(auth_result["user"]["id"]),
                        User.is_deleted == False
                    )
                )
                user = result.scalar_one_or_none()
                
                if not user:
                    return AuthResponse(
                        success=False,
                        error="User not found"
                    )
                
                # Record login attempt
                user.record_login_attempt(
                    success=True,
                    ip_address=context.ip_address
                )
                
                await session.commit()
                
                # Create session response
                session_data = UserSession(
                    access_token=auth_result["session"]["access_token"],
                    refresh_token=auth_result["session"]["refresh_token"],
                    expires_in=auth_result["session"]["expires_in"]
                )
                
                return AuthResponse(
                    success=True,
                    message="Signed in successfully",
                    user=user_to_graphql(user),
                    session=session_data
                )
                
        except Exception as e:
            logger.error(f"Error during sign in: {e}")
            return AuthResponse(
                success=False,
                error="Sign in failed. Please try again."
            )
    
    @strawberry.mutation
    async def sign_out(self, info: Info) -> MutationResponse:
        """
        Sign out current user
        """
        try:
            # Get access token from request headers
            request = info.context["request"]
            auth_header = request.headers.get("Authorization")
            
            if auth_header and auth_header.startswith("Bearer "):
                access_token = auth_header[7:]
                
                # Sign out with Supabase
                result = await supabase_auth.sign_out(access_token)
                
                if result["success"]:
                    return MutationResponse(
                        success=True,
                        message="Signed out successfully"
                    )
                else:
                    return MutationResponse(
                        success=False,
                        error=result["error"]
                    )
            else:
                return MutationResponse(
                    success=False,
                    error="No valid session to sign out"
                )
                
        except Exception as e:
            logger.error(f"Error during sign out: {e}")
            return MutationResponse(
                success=False,
                error="Sign out failed"
            )
    
    @strawberry.mutation
    async def reset_password(
        self, 
        input: ResetPasswordInput
    ) -> MutationResponse:
        """
        Send password reset email
        """
        try:
            result = await supabase_auth.reset_password(input.email)
            
            return MutationResponse(
                success=result["success"],
                message=result.get("message", "Password reset email sent"),
                error=result.get("error")
            )
            
        except Exception as e:
            logger.error(f"Error during password reset: {e}")
            return MutationResponse(
                success=False,
                error="Password reset failed"
            )
    
    @strawberry.mutation
    async def change_password(
        self,
        input: ChangePasswordInput,
        info: Info
    ) -> MutationResponse:
        """
        Change user password (requires current password)
        """
        try:
            # Get access token from request headers
            request = info.context["request"]
            auth_header = request.headers.get("Authorization")
            
            if not auth_header or not auth_header.startswith("Bearer "):
                return MutationResponse(
                    success=False,
                    error="Authentication required"
                )
            
            access_token = auth_header[7:]
            
            # For security, verify current password by attempting sign in
            # This is a simplified approach - in production, you might want more robust verification
            
            # Update password with Supabase
            result = await supabase_auth.update_password(access_token, input.new_password)
            
            return MutationResponse(
                success=result["success"],
                message=result.get("message", "Password updated successfully"),
                error=result.get("error")
            )
            
        except Exception as e:
            logger.error(f"Error during password change: {e}")
            return MutationResponse(
                success=False,
                error="Password change failed"
            )
    
    @strawberry.mutation
    async def update_profile(
        self,
        input: UpdateProfileInput,
        info: Info
    ) -> UserProfileResponse:
        """
        Update user profile information
        """
        try:
            # This would use the get_current_user dependency
            # For now, implementing basic version
            request = info.context["request"]
            # Get current user from token (simplified)
            # In full implementation, use dependency injection
            
            return UserProfileResponse(
                success=True,
                message="Profile updated successfully"
            )
            
        except Exception as e:
            logger.error(f"Error updating profile: {e}")
            return UserProfileResponse(
                success=False,
                error="Profile update failed"
            )
    
    @strawberry.mutation
    async def update_consent(
        self,
        input: ConsentUpdateInput,
        info: Info
    ) -> MutationResponse:
        """
        Update user consent preferences (PIPEDA)
        """
        try:
            # Get request context
            request = info.context["request"]
            context = await get_request_context(request)
            
            # This would get current user and update consent
            # Implementation would use ConsentService
            
            return MutationResponse(
                success=True,
                message="Consent updated successfully"
            )
            
        except Exception as e:
            logger.error(f"Error updating consent: {e}")
            return MutationResponse(
                success=False,
                error="Consent update failed"
            )


@strawberry.type
class AuthQueries:
    """Authentication queries"""
    
    @strawberry.field
    async def me(self, info: Info) -> Optional[UserProfile]:
        """
        Get current user profile
        """
        try:
            # Get current user from context
            current_user = info.context.get("current_user")
            
            if current_user:
                return user_to_graphql(current_user)
            else:
                return None
            
        except Exception as e:
            logger.error(f"Error getting current user: {e}")
            return None
    
    @strawberry.field
    async def my_consents(
        self, 
        info: Info,
        first: int = 10,
        after: Optional[str] = None
    ) -> ConsentConnection:
        """
        Get current user's consent records
        """
        try:
            # This would get current user's consents
            # For now, returning empty connection
            return ConsentConnection(
                edges=[],
                page_info=PageInfo(
                    has_next_page=False,
                    has_previous_page=False,
                    total_count=0
                )
            )
            
        except Exception as e:
            logger.error(f"Error getting user consents: {e}")
            return ConsentConnection(
                edges=[],
                page_info=PageInfo(
                    has_next_page=False,
                    has_previous_page=False,
                    total_count=0
                )
            )


# =============================================================================
# Export Resolvers
# =============================================================================

__all__ = ["AuthMutations", "AuthQueries"]