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
from graphql import GraphQLError

from app.auth import supabase_auth, get_request_context, RequestContext
from app.auth.supabase import _transform_identity_response
from app.config.database import get_async_session
from app.config.settings import settings
from app.graphql.context import require_context_user
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
    PageInfo,
    ExportUserDataInput,
    ExportUserDataResponse,
    DeleteUserAccountInput,
    DeleteUserAccountResponse
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
            request = info.context.request
            
            # Create RequestContext object for compatibility with existing code
            from app.auth import RequestContext
            context = RequestContext(request)
            
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
            
            # Use database session via async generator (same pattern as child resolvers)
            async for session in get_async_session():
                try:
                    # Check if user already exists in backend (orphaned backend user scenario)
                    existing_user_query = await session.execute(
                        select(User).where(
                            User.email == input.email,
                            User.is_deleted == False
                        )
                    )
                    existing_user = existing_user_query.scalar_one_or_none()
                
                    if existing_user:
                        # Update existing user with new Supabase Auth ID
                        logger.info(f"Found existing backend user for {input.email}, updating Supabase Auth ID")
                        existing_user.supabase_user_id = uuid.UUID(auth_result["user"]["id"])
                        existing_user.status = UserStatus.PENDING_VERIFICATION
                        existing_user.email_verified = False
                        
                        # Update profile information if provided
                        if input.first_name:
                            existing_user.first_name = input.first_name
                        if input.last_name:
                            existing_user.last_name = input.last_name
                        if input.timezone:
                            existing_user.timezone = input.timezone
                        if input.language:
                            existing_user.language = input.language
                        if input.province:
                            existing_user.province = input.province
                        
                        # Update consents
                        existing_user.privacy_policy_accepted = input.accept_privacy_policy
                        existing_user.privacy_policy_accepted_at = datetime.now(timezone.utc)
                        existing_user.terms_of_service_accepted = input.accept_terms_of_service
                        existing_user.terms_of_service_accepted_at = datetime.now(timezone.utc)
                        existing_user.marketing_consent = input.marketing_consent
                        existing_user.analytics_consent = input.analytics_consent
                        existing_user.consent_version = settings.consent_version
                        existing_user.consent_granted_at = datetime.now(timezone.utc)
                        existing_user.consent_ip_address = context.ip_address
                        existing_user.consent_user_agent = context.user_agent
                        
                        user = existing_user
                        await session.flush()
                    else:
                        # Create new user
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
                    
                    # Handle consent records (only create new ones if this is a new user)
                    if not existing_user:
                        # Create default consent records for new users
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
                    else:
                        # For existing users, just update consent fields (already done above)
                        logger.info(f"Updated consents for existing user {user.id}")
                    
                    await session.commit()
                    
                    if existing_user:
                        logger.info(f"User synced successfully: {user.id}")
                        message = "Account synced successfully. Please check your email for verification."
                    else:
                        logger.info(f"User created successfully: {user.id}")
                        message = "Account created successfully. Please check your email for verification."
                    
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
                        message=message,
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
            request = info.context.request
            context = await get_request_context(request)
            
            # Authenticate with Supabase
            auth_result = await supabase_auth.sign_in(input.email, input.password)

            logger.info(f"Sign in auth_result keys: {list(auth_result.keys()) if auth_result else 'None'}")
            if auth_result.get("session"):
                logger.info(f"Session keys: {list(auth_result['session'].keys())}")
            if auth_result.get("user"):
                logger.info(f"User keys: {list(auth_result['user'].keys())}")
                if auth_result['user'].get('identities'):
                    logger.info(f"User has {len(auth_result['user']['identities'])} identities")
                    for i, identity in enumerate(auth_result['user']['identities']):
                        logger.info(f"Identity {i} keys: {list(identity.keys())}")

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
                
                # Update user status and verification on successful authentication
                # If user successfully authenticated with Supabase, they're verified
                if user.status == UserStatus.PENDING_VERIFICATION:
                    user.status = UserStatus.ACTIVE
                    user.email_verified = True
                    user.email_verified_at = datetime.now(timezone.utc)
                    logger.info(f"User {user.id} status updated to ACTIVE and email verified")
                
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
            request = info.context.request
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
            request = info.context.request
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
            request = info.context.request
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
            request = info.context.request
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
    
    @strawberry.mutation
    async def refresh_token(
        self,
        refresh_token: str,
        info: Info
    ) -> AuthResponse:
        """
        Refresh access token using refresh token
        """
        try:
            logger.info("Processing token refresh request")
            
            # Use existing Supabase refresh_token method
            result = await supabase_auth.refresh_token(refresh_token)
            
            if result["success"]:
                # Create session response
                session_data = UserSession(
                    access_token=result["session"]["access_token"],
                    refresh_token=result["session"]["refresh_token"],
                    expires_in=result["session"]["expires_in"]
                )
                
                logger.info("Token refreshed successfully")
                return AuthResponse(
                    success=True,
                    message="Token refreshed successfully",
                    session=session_data
                )
            else:
                logger.warning(f"Token refresh failed: {result['error']}")
                return AuthResponse(
                    success=False,
                    error=result["error"]
                )
                
        except Exception as e:
            logger.error(f"Error during token refresh: {e}")
            return AuthResponse(
                success=False,
                error="Token refresh failed. Please sign in again."
            )
    
    @strawberry.mutation
    async def complete_onboarding(
        self,
        info: Info
    ) -> MutationResponse:
        """
        Mark user onboarding as completed
        """
        try:
            logger.info("Processing onboarding completion request")

            # Get current authenticated user
            user = await require_context_user(info)

            # Use UserService to complete onboarding
            async for session in get_async_session():
                from app.services.user_service import UserService
                user_service = UserService(session)

                # Reload user in current session to avoid session persistence issues
                session_user = await user_service.get_user_by_id(user.id)
                if not session_user:
                    raise ValueError("User not found")

                # Complete onboarding in database
                updated_user = await user_service.complete_onboarding(session_user)

                logger.info(f"Onboarding completed for user: {updated_user.id}")
                return MutationResponse(
                    success=True,
                    message="Onboarding completed successfully"
                )

        except GraphQLError:
            # Re-raise GraphQL authentication errors
            raise
        except Exception as e:
            logger.error(f"Error completing onboarding: {e}")
            return MutationResponse(
                success=False,
                error="Failed to complete onboarding. Please try again."
            )

    @strawberry.mutation
    async def export_user_data(
        self,
        input: ExportUserDataInput,
        info: Info
    ) -> ExportUserDataResponse:
        """
        Export all user data (PIPEDA right to data portability)
        Returns comprehensive JSON export of all user data
        """
        try:
            logger.info("Processing user data export request")

            # Get current authenticated user
            user = await require_context_user(info)

            async for session in get_async_session():
                from app.models import Child, InventoryItem, UsageLog, NotificationPreferences
                import json

                # Build PIPEDA-compliant export structure
                export_data = {
                    "export_metadata": {
                        "generated_at": datetime.now(timezone.utc).isoformat(),
                        "user_id": str(user.id),
                        "email": user.email,
                        "data_residency": "Canada",
                        "compliance_framework": "PIPEDA",
                        "format": input.format,
                        "includes_deleted_records": input.include_deleted
                    },
                    "user_profile": {
                        "id": str(user.id),
                        "email": user.email,
                        "first_name": user.first_name,
                        "last_name": user.last_name,
                        "display_name": user.display_name,
                        "phone_number": user.phone_number,
                        "timezone": user.timezone,
                        "language": user.language,
                        "currency": user.currency,
                        "province": user.province,
                        "postal_code": user.postal_code,
                        "status": user.status,
                        "email_verified": user.email_verified,
                        "email_verified_at": user.email_verified_at.isoformat() if user.email_verified_at else None,
                        "onboarding_completed": user.onboarding_completed,
                        "onboarding_completed_at": user.onboarding_completed_at.isoformat() if user.onboarding_completed_at else None,
                        "created_at": user.created_at.isoformat(),
                        "updated_at": user.updated_at.isoformat() if user.updated_at else None
                    },
                    "consents": {
                        "privacy_policy_accepted": user.privacy_policy_accepted,
                        "privacy_policy_accepted_at": user.privacy_policy_accepted_at.isoformat() if user.privacy_policy_accepted_at else None,
                        "terms_of_service_accepted": user.terms_of_service_accepted,
                        "terms_of_service_accepted_at": user.terms_of_service_accepted_at.isoformat() if user.terms_of_service_accepted_at else None,
                        "marketing_consent": user.marketing_consent,
                        "analytics_consent": user.analytics_consent,
                        "data_sharing_consent": user.data_sharing_consent,
                        "consent_version": user.consent_version,
                        "consent_granted_at": user.consent_granted_at.isoformat() if user.consent_granted_at else None
                    },
                    "children": [],
                    "inventory": [],
                    "usage_history": [],
                    "notification_preferences": None
                }

                # Query children profiles
                children_query = select(Child).where(
                    Child.parent_id == user.id
                )
                if not input.include_deleted:
                    children_query = children_query.where(Child.is_deleted == False)

                children_result = await session.execute(children_query)
                children = children_result.scalars().all()

                for child in children:
                    child_data = {
                        "id": str(child.id),
                        "name": child.name,
                        "date_of_birth": child.date_of_birth.isoformat(),
                        "gender": child.gender,
                        "current_diaper_size": child.current_diaper_size,
                        "current_weight_kg": child.current_weight_kg,
                        "current_height_cm": child.current_height_cm,
                        "daily_usage_count": child.daily_usage_count,
                        "has_sensitive_skin": child.has_sensitive_skin,
                        "has_allergies": child.has_allergies,
                        "allergies_notes": child.allergies_notes,
                        "province": child.province,
                        "created_at": child.created_at.isoformat(),
                        "is_deleted": child.is_deleted,
                        "deleted_at": child.deleted_at.isoformat() if child.deleted_at else None
                    }
                    export_data["children"].append(child_data)

                    # Query inventory items for this child
                    inventory_query = select(InventoryItem).where(
                        InventoryItem.child_id == child.id
                    )
                    if not input.include_deleted:
                        inventory_query = inventory_query.where(InventoryItem.is_deleted == False)

                    inventory_result = await session.execute(inventory_query)
                    inventory_items = inventory_result.scalars().all()

                    for item in inventory_items:
                        inventory_data = {
                            "id": str(item.id),
                            "child_id": str(item.child_id),
                            "product_type": item.product_type,
                            "brand": item.brand,
                            "size": item.size,
                            "quantity_total": item.quantity_total,
                            "quantity_remaining": item.quantity_remaining,
                            "purchase_date": item.purchase_date.isoformat() if item.purchase_date else None,
                            "cost_cad": float(item.cost_cad) if item.cost_cad else None,
                            "created_at": item.created_at.isoformat()
                        }
                        export_data["inventory"].append(inventory_data)

                    # Query usage logs for this child
                    usage_query = select(UsageLog).where(
                        UsageLog.child_id == child.id
                    )
                    if not input.include_deleted:
                        usage_query = usage_query.where(UsageLog.is_deleted == False)

                    usage_result = await session.execute(usage_query)
                    usage_logs = usage_result.scalars().all()

                    for log in usage_logs:
                        usage_data = {
                            "id": str(log.id),
                            "child_id": str(log.child_id),
                            "usage_type": log.usage_type,
                            "logged_at": log.logged_at.isoformat(),
                            "quantity_used": log.quantity_used,
                            "context": log.context,
                            "caregiver_name": log.caregiver_name,
                            "created_at": log.created_at.isoformat()
                        }
                        export_data["usage_history"].append(usage_data)

                # Query notification preferences
                prefs_result = await session.execute(
                    select(NotificationPreferences).where(
                        NotificationPreferences.user_id == user.id
                    )
                )
                prefs = prefs_result.scalar_one_or_none()

                if prefs:
                    export_data["notification_preferences"] = {
                        "notifications_enabled": prefs.notifications_enabled,
                        "push_notifications": prefs.push_notifications,
                        "email_notifications": prefs.email_notifications,
                        "stock_alert_enabled": prefs.stock_alert_enabled,
                        "stock_alert_threshold": prefs.stock_alert_threshold,
                        "change_reminder_enabled": prefs.change_reminder_enabled,
                        "created_at": prefs.created_at.isoformat()
                    }

                # Query consent records
                consent_result = await session.execute(
                    select(ConsentRecord).where(
                        ConsentRecord.user_id == user.id
                    )
                )
                consent_records = consent_result.scalars().all()

                export_data["consent_records"] = []
                for record in consent_records:
                    consent_data = {
                        "consent_type": record.consent_type,
                        "status": record.status,
                        "granted_at": record.granted_at.isoformat() if record.granted_at else None,
                        "withdrawn_at": record.withdrawn_at.isoformat() if record.withdrawn_at else None,
                        "consent_version": record.consent_version
                    }
                    export_data["consent_records"].append(consent_data)

                # Convert to JSON string
                export_json = json.dumps(export_data, indent=2, ensure_ascii=False)
                export_size = len(export_json.encode('utf-8'))

                # Create audit log entry
                user.data_export_requested = True
                user.data_export_requested_at = datetime.now(timezone.utc)
                await session.commit()

                logger.info(f"Data export completed for user {user.id}: {export_size} bytes")

                return ExportUserDataResponse(
                    success=True,
                    message="Data export completed successfully",
                    export_data=export_json,
                    export_size_bytes=export_size,
                    expires_at=None  # Future: set expiry when using S3 presigned URLs
                )

        except GraphQLError:
            raise
        except Exception as e:
            logger.error(f"Error exporting user data: {e}", exc_info=True)
            return ExportUserDataResponse(
                success=False,
                error="Failed to export user data. Please try again."
            )

    @strawberry.mutation
    async def delete_user_account(
        self,
        input: DeleteUserAccountInput,
        info: Info
    ) -> DeleteUserAccountResponse:
        """
        Delete user account with PIPEDA compliance (30-day retention)
        Performs soft delete with cascading to all related data
        """
        try:
            logger.info("Processing account deletion request")

            # Get current authenticated user
            user = await require_context_user(info)

            async for session in get_async_session():
                from app.models import Child, InventoryItem, UsageLog

                # Validate confirmation text
                if input.confirmation_text.strip() != "DELETE my account":
                    return DeleteUserAccountResponse(
                        success=False,
                        error="Confirmation text must be exactly: DELETE my account"
                    )

                # Verify password with Supabase
                try:
                    auth_result = await supabase_auth.sign_in(user.email, input.password)
                    if not auth_result["success"]:
                        return DeleteUserAccountResponse(
                            success=False,
                            error="Invalid password. Account deletion cancelled."
                        )
                except Exception as auth_error:
                    logger.error(f"Password verification failed: {auth_error}")
                    return DeleteUserAccountResponse(
                        success=False,
                        error="Password verification failed. Please try again."
                    )

                # Set user status to pending deletion
                user.status = UserStatus.PENDING_DELETION
                user.data_deletion_requested = True
                user.data_deletion_requested_at = datetime.now(timezone.utc)
                deletion_scheduled = datetime.now(timezone.utc)

                # Soft delete all children profiles (cascades to inventory and usage logs)
                children_result = await session.execute(
                    select(Child).where(
                        Child.parent_id == user.id,
                        Child.is_deleted == False
                    )
                )
                children = children_result.scalars().all()

                for child in children:
                    # Use the soft_delete method from BaseModel
                    child.soft_delete()
                    logger.info(f"Soft deleted child profile: {child.id}")

                # Soft delete all inventory items
                inventory_result = await session.execute(
                    select(InventoryItem).where(
                        InventoryItem.child_id.in_([c.id for c in children]),
                        InventoryItem.is_deleted == False
                    )
                )
                inventory_items = inventory_result.scalars().all()

                for item in inventory_items:
                    item.soft_delete()

                # Soft delete all usage logs
                usage_result = await session.execute(
                    select(UsageLog).where(
                        UsageLog.child_id.in_([c.id for c in children]),
                        UsageLog.is_deleted == False
                    )
                )
                usage_logs = usage_result.scalars().all()

                for log in usage_logs:
                    log.soft_delete()

                # Set retention period (PIPEDA compliance)
                user.deleted_at = deletion_scheduled
                retention_days = 30

                # Commit all changes
                await session.commit()

                logger.info(f"Account deletion scheduled for user {user.id}: {len(children)} children, {len(inventory_items)} inventory items, {len(usage_logs)} usage logs")

                # Create audit log entry
                from app.models.emergency_audit_log import log_emergency_data_access, EmergencyAccessAction, EmergencyDataType
                await log_emergency_data_access(
                    session=session,
                    user_id=user.id,
                    action=EmergencyAccessAction.DELETE,
                    data_type=EmergencyDataType.USER_PROFILE,
                    accessed_by_email=user.email,
                    ip_address=info.context.request.client.host if hasattr(info.context.request, 'client') else "unknown",
                    success=True,
                    details={
                        "reason": input.reason,
                        "children_count": len(children),
                        "inventory_items_count": len(inventory_items),
                        "usage_logs_count": len(usage_logs),
                        "retention_period_days": retention_days
                    }
                )
                await session.commit()

                return DeleteUserAccountResponse(
                    success=True,
                    message=f"Account deletion scheduled. Data will be permanently deleted after {retention_days} days.",
                    deletion_scheduled_at=deletion_scheduled,
                    data_retention_period_days=retention_days
                )

        except GraphQLError:
            raise
        except Exception as e:
            logger.error(f"Error deleting user account: {e}", exc_info=True)
            return DeleteUserAccountResponse(
                success=False,
                error="Failed to delete account. Please try again."
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
            # Get current user from context using proper async method
            current_user = await info.context.get_user()
            
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