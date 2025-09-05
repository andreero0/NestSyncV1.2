"""
User Service for NestSync
PIPEDA-compliant user management and authentication business logic
"""

import logging
import uuid
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_

from app.models import User, UserStatus, ConsentRecord
from app.config.settings import settings
from app.auth import RequestContext, supabase_auth

logger = logging.getLogger(__name__)


class UserService:
    """
    Service class for user-related business logic
    """
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def create_user(
        self,
        email: str,
        supabase_user_id: uuid.UUID,
        context: RequestContext,
        **user_data
    ) -> User:
        """
        Create a new user with PIPEDA compliance tracking
        """
        user = User(
            email=email.lower().strip(),
            supabase_user_id=supabase_user_id,
            status=UserStatus.PENDING_VERIFICATION,
            consent_version=settings.consent_version,
            consent_granted_at=datetime.now(timezone.utc),
            consent_ip_address=context.ip_address,
            consent_user_agent=context.user_agent,
            **user_data
        )
        
        self.session.add(user)
        await self.session.flush()
        
        logger.info(f"User created: {user.id}")
        return user
    
    async def get_user_by_id(self, user_id: uuid.UUID) -> Optional[User]:
        """
        Get user by ID
        """
        result = await self.session.execute(
            select(User).where(
                and_(
                    User.id == user_id,
                    User.is_deleted == False
                )
            )
        )
        return result.scalar_one_or_none()
    
    async def get_user_by_email(self, email: str) -> Optional[User]:
        """
        Get user by email address
        """
        result = await self.session.execute(
            select(User).where(
                and_(
                    User.email == email.lower().strip(),
                    User.is_deleted == False
                )
            )
        )
        return result.scalar_one_or_none()
    
    async def get_user_by_supabase_id(self, supabase_user_id: uuid.UUID) -> Optional[User]:
        """
        Get user by Supabase user ID
        """
        result = await self.session.execute(
            select(User).where(
                and_(
                    User.supabase_user_id == supabase_user_id,
                    User.is_deleted == False
                )
            )
        )
        return result.scalar_one_or_none()
    
    async def update_user(
        self,
        user: User,
        context: RequestContext,
        **update_data
    ) -> User:
        """
        Update user information with audit trail
        """
        # Track who made the update
        user.updated_by = user.id  # Self-update
        
        # Update fields
        for field, value in update_data.items():
            if hasattr(user, field) and value is not None:
                setattr(user, field, value)
        
        await self.session.commit()
        await self.session.refresh(user)
        
        logger.info(f"User updated: {user.id}")
        return user
    
    async def verify_email(
        self,
        user: User,
        context: RequestContext
    ) -> User:
        """
        Mark user email as verified
        """
        user.email_verified = True
        user.email_verified_at = datetime.now(timezone.utc)
        
        # Activate account if all requirements are met
        if user.has_required_consents:
            user.status = UserStatus.ACTIVE
        
        await self.session.commit()
        await self.session.refresh(user)
        
        logger.info(f"User email verified: {user.id}")
        return user
    
    async def record_login(
        self,
        user: User,
        context: RequestContext,
        success: bool = True
    ) -> User:
        """
        Record login attempt for security tracking
        """
        user.record_login_attempt(success, context.ip_address)
        
        await self.session.commit()
        
        if success:
            logger.info(f"Successful login recorded: {user.id}")
        else:
            logger.warning(f"Failed login recorded: {user.id}")
        
        return user
    
    async def lock_user_account(
        self,
        user: User,
        duration_minutes: int = 30,
        reason: str = "Security lockout"
    ) -> User:
        """
        Lock user account for security reasons
        """
        user.lock_account(duration_minutes)
        
        await self.session.commit()
        
        logger.warning(f"User account locked: {user.id} - {reason}")
        return user
    
    async def unlock_user_account(self, user: User) -> User:
        """
        Unlock user account
        """
        user.unlock_account()
        
        await self.session.commit()
        
        logger.info(f"User account unlocked: {user.id}")
        return user
    
    async def suspend_user_account(
        self,
        user: User,
        reason: str,
        admin_user_id: Optional[uuid.UUID] = None
    ) -> User:
        """
        Suspend user account (admin action)
        """
        user.status = UserStatus.SUSPENDED
        user.updated_by = admin_user_id
        
        await self.session.commit()
        
        logger.warning(f"User account suspended: {user.id} - {reason}")
        return user
    
    async def request_data_export(self, user: User) -> Dict[str, Any]:
        """
        Request data export for PIPEDA compliance
        """
        user.request_data_export()
        await self.session.commit()
        
        # In a full implementation, this would trigger a background job
        # to compile all user data for export
        
        logger.info(f"Data export requested: {user.id}")
        return {
            "success": True,
            "message": "Data export request recorded. You will receive your data within 30 days.",
            "request_id": str(uuid.uuid4()),
            "estimated_completion": "30 days"
        }
    
    async def request_account_deletion(self, user: User, context: RequestContext) -> Dict[str, Any]:
        """
        Request account deletion for PIPEDA compliance
        """
        user.request_data_deletion()
        user.updated_by = user.id
        
        await self.session.commit()
        
        # In a full implementation, this would:
        # 1. Start a grace period (e.g., 30 days)
        # 2. Send confirmation email
        # 3. Schedule background job for actual deletion
        
        logger.info(f"Account deletion requested: {user.id}")
        return {
            "success": True,
            "message": "Account deletion requested. You have 30 days to cancel this request.",
            "grace_period_days": 30,
            "cancellation_deadline": datetime.now(timezone.utc).replace(day=datetime.now(timezone.utc).day + 30)
        }
    
    async def cancel_account_deletion(self, user: User) -> Dict[str, Any]:
        """
        Cancel account deletion request
        """
        user.data_deletion_requested = False
        user.data_deletion_requested_at = None
        user.status = UserStatus.ACTIVE
        
        await self.session.commit()
        
        logger.info(f"Account deletion cancelled: {user.id}")
        return {
            "success": True,
            "message": "Account deletion request cancelled successfully."
        }
    
    async def complete_onboarding(self, user: User) -> User:
        """
        Mark user onboarding as completed
        """
        user.onboarding_completed = True
        user.onboarding_completed_at = datetime.now(timezone.utc)
        
        # Ensure user is activated if all requirements are met
        if user.email_verified and user.has_required_consents:
            user.status = UserStatus.ACTIVE
        
        await self.session.commit()
        await self.session.refresh(user)
        
        logger.info(f"User onboarding completed: {user.id}")
        return user
    
    async def update_onboarding_step(self, user: User, step: str) -> User:
        """
        Update current onboarding step
        """
        user.onboarding_step = step
        
        await self.session.commit()
        
        logger.debug(f"Onboarding step updated: {user.id} - {step}")
        return user
    
    async def get_user_statistics(self, user: User) -> Dict[str, Any]:
        """
        Get user statistics for dashboard
        """
        # In full implementation, this would aggregate data from related models
        stats = {
            "account_age_days": (datetime.now(timezone.utc) - user.created_at).days,
            "children_count": 0,  # Would query Child model
            "onboarding_completed": user.onboarding_completed,
            "email_verified": user.email_verified,
            "last_login": user.last_login_at,
            "consent_status": {
                "privacy_policy": user.privacy_policy_accepted,
                "terms_of_service": user.terms_of_service_accepted,
                "marketing": user.marketing_consent,
                "analytics": user.analytics_consent
            }
        }
        
        return stats
    
    async def search_users(
        self,
        query: str,
        limit: int = 50,
        admin_user_id: Optional[uuid.UUID] = None
    ) -> List[User]:
        """
        Search users (admin function)
        """
        if not admin_user_id:
            raise ValueError("Admin access required for user search")
        
        result = await self.session.execute(
            select(User).where(
                and_(
                    User.is_deleted == False,
                    or_(
                        User.email.ilike(f"%{query}%"),
                        User.first_name.ilike(f"%{query}%"),
                        User.last_name.ilike(f"%{query}%"),
                        User.display_name.ilike(f"%{query}%")
                    )
                )
            ).limit(limit)
        )
        
        return result.scalars().all()


# =============================================================================
# Export Service
# =============================================================================

__all__ = ["UserService"]