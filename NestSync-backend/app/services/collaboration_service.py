"""
Collaboration Service for Family-Based Caregiver Management
Handles family creation, member management, and collaboration features
"""

import logging
import secrets
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from sqlalchemy import select, and_, or_, func
from sqlalchemy.orm import selectinload, joinedload

from app.config.database import get_async_session
from app.models import (
    Family, FamilyMember, FamilyChildAccess, CaregiverInvitation,
    CollaborationLog, CaregiverPresence, Child, User, Activity,
    FamilyType, MemberRole, MemberStatus, AccessLevel,
    InvitationStatus, PresenceStatus, LogAction
)
from .email_service import EmailService

logger = logging.getLogger(__name__)


class CollaborationService:
    """Service for managing family collaboration features"""

    @staticmethod
    async def create_family(
        creator_id: str,
        name: str,
        family_type: str = "standard",
        description: str = None
    ) -> Family:
        """Create a new family with creator as Family Core member"""
        async for session in get_async_session():
            try:
                # Create family
                family = Family(
                    name=name,
                    family_type=FamilyType(family_type),
                    description=description,
                    created_by=creator_id,
                    settings={
                        "timezone": "America/Toronto",
                        "language": "en-CA",
                        "privacy_level": "family_only",
                        "allow_guest_access": False,
                        "data_retention_days": 2555,  # 7 years for PIPEDA compliance
                        "notification_settings": {
                            "real_time_updates": True,
                            "activity_notifications": True,
                            "member_join_notifications": True
                        }
                    }
                )
                session.add(family)
                await session.flush()  # Get family ID

                # Add creator as Family Core member
                family_member = FamilyMember(
                    user_id=creator_id,
                    family_id=family.id,
                    role=MemberRole.FAMILY_CORE,
                    permissions=CollaborationService._generate_permissions_for_role(MemberRole.FAMILY_CORE),
                    joined_at=datetime.now(timezone.utc)
                )
                session.add(family_member)

                # Log family creation
                await CollaborationLogService.log_action(
                    session=session,
                    family_id=family.id,
                    actor_user_id=creator_id,
                    action_type=LogAction.FAMILY_CREATED,
                    details={'family_name': name, 'family_type': family_type}
                )

                await session.commit()
                logger.info(f"Created family {family.id} by user {creator_id}")
                return family

            except Exception as e:
                await session.rollback()
                logger.error(f"Failed to create family: {e}")
                raise

    @staticmethod
    async def invite_caregiver(
        family_id: str,
        inviter_id: str,
        email: str,
        role: str,
        access_restrictions: dict = None
    ) -> CaregiverInvitation:
        """Send invitation to join family as caregiver"""

        # Verify inviter has permission
        can_invite = await CollaborationPermissionService.check_family_access(
            inviter_id, family_id, 'invite_members'
        )
        if not can_invite:
            raise PermissionError("Cannot invite members to this family")

        async for session in get_async_session():
            try:
                # Check if any invitation already exists for this email/family combination
                existing = await session.execute(
                    select(CaregiverInvitation)
                    .where(
                        CaregiverInvitation.family_id == family_id,
                        CaregiverInvitation.email == email
                    )
                    .order_by(CaregiverInvitation.created_at.desc())
                )
                existing_invitation = existing.scalar_one_or_none()

                if existing_invitation:
                    if existing_invitation.status == InvitationStatus.PENDING:
                        # Return existing pending invitation instead of creating duplicate
                        logger.info(f"Returning existing pending invitation {existing_invitation.id} for {email} in family {family_id}")
                        return existing_invitation
                    elif existing_invitation.status in [InvitationStatus.EXPIRED, InvitationStatus.REVOKED]:
                        # Cancel the old invitation by updating its status before creating new one
                        existing_invitation.status = InvitationStatus.REVOKED
                        logger.info(f"Revoked old invitation {existing_invitation.id} before creating new one")

                # Generate secure invitation token
                invitation_token = secrets.token_urlsafe(32)
                expires_at = datetime.now(timezone.utc) + timedelta(days=7)

                invitation = CaregiverInvitation(
                    family_id=family_id,
                    email=email,
                    role=MemberRole(role),
                    invitation_token=invitation_token,
                    invited_by=inviter_id,
                    expires_at=expires_at,
                    access_restrictions=access_restrictions or {}
                )
                session.add(invitation)
                await session.flush()  # Get the ID

                # Log invitation
                await CollaborationLogService.log_action(
                    session=session,
                    family_id=family_id,
                    actor_user_id=inviter_id,
                    action_type=LogAction.MEMBER_INVITED,
                    details={
                        'invited_email': email,
                        'role': role,
                        'expires_at': expires_at.isoformat()
                    }
                )

                # Eager load all required relationships before commit to prevent detached object issues
                result = await session.execute(
                    select(CaregiverInvitation)
                    .options(
                        selectinload(CaregiverInvitation.family),
                        selectinload(CaregiverInvitation.inviter)
                    )
                    .where(CaregiverInvitation.id == invitation.id)
                )
                invitation = result.scalar_one()

                await session.commit()

                logger.info(f"Invitation {invitation.id} saved to database for {email} in family {family_id}")
                return invitation

            except Exception as e:
                await session.rollback()
                logger.error(f"Failed to create invitation: {e}")
                raise

    @staticmethod
    async def accept_invitation(
        invitation_token: str,
        accepter_id: str
    ) -> FamilyMember:
        """Accept caregiver invitation and join family"""
        async for session in get_async_session():
            try:
                # Get valid invitation
                result = await session.execute(
                    select(CaregiverInvitation)
                    .options(selectinload(CaregiverInvitation.family))
                    .where(
                        CaregiverInvitation.invitation_token == invitation_token,
                        CaregiverInvitation.status == InvitationStatus.PENDING,
                        CaregiverInvitation.expires_at > datetime.now(timezone.utc)
                    )
                )
                invitation = result.scalar_one_or_none()

                if not invitation:
                    raise ValueError("Invalid or expired invitation")

                # Get user and verify email matches
                user = await session.get(User, accepter_id)
                if user.email != invitation.email:
                    raise ValueError("Email mismatch")

                # Check if user is already a member
                existing_member = await session.execute(
                    select(FamilyMember)
                    .where(
                        FamilyMember.user_id == accepter_id,
                        FamilyMember.family_id == invitation.family_id,
                        FamilyMember.status == MemberStatus.ACTIVE
                    )
                )
                if existing_member.scalar_one_or_none():
                    raise ValueError("User is already a member of this family")

                # Create family membership
                family_member = FamilyMember(
                    user_id=accepter_id,
                    family_id=invitation.family_id,
                    role=invitation.role,
                    invited_by=invitation.invited_by,
                    permissions=CollaborationService._generate_permissions_for_role(invitation.role),
                    joined_at=datetime.now(timezone.utc)
                )
                session.add(family_member)
                await session.flush()  # Get the ID

                # Update invitation status
                invitation.status = InvitationStatus.ACCEPTED
                invitation.accepted_at = datetime.now(timezone.utc)
                invitation.accepted_by = accepter_id

                # Log membership
                await CollaborationLogService.log_action(
                    session=session,
                    family_id=invitation.family_id,
                    actor_user_id=accepter_id,
                    action_type=LogAction.MEMBER_JOINED,
                    details={
                        'role': invitation.role.value,
                        'invited_by': invitation.invited_by
                    }
                )

                # Eager load user relationship before commit to prevent detached object issues
                result = await session.execute(
                    select(FamilyMember)
                    .options(selectinload(FamilyMember.user))
                    .where(FamilyMember.id == family_member.id)
                )
                family_member = result.scalar_one()

                await session.commit()

                # Initialize presence tracking
                await CollaborationService.update_caregiver_presence(
                    user_id=accepter_id,
                    family_id=invitation.family_id,
                    status=PresenceStatus.ONLINE
                )

                logger.info(f"User {accepter_id} accepted invitation to family {invitation.family_id}")
                return family_member

            except Exception as e:
                await session.rollback()
                logger.error(f"Failed to accept invitation: {e}")
                raise

    @staticmethod
    async def add_child_to_family(
        family_id: str,
        child_id: str,
        access_level: str = "full",
        granted_by: str = None
    ) -> FamilyChildAccess:
        """Add child to family with specified access level"""
        async for session in get_async_session():
            try:
                # Verify child exists and is accessible
                child = await session.get(Child, child_id)
                if not child:
                    raise ValueError("Child not found")

                # Check if access already exists
                existing = await session.execute(
                    select(FamilyChildAccess)
                    .where(
                        FamilyChildAccess.family_id == family_id,
                        FamilyChildAccess.child_id == child_id
                    )
                )
                if existing.scalar_one_or_none():
                    raise ValueError("Child already has access to this family")

                # Create access record
                child_access = FamilyChildAccess(
                    family_id=family_id,
                    child_id=child_id,
                    access_level=AccessLevel(access_level),
                    granted_by=granted_by
                )
                session.add(child_access)

                # Update child's family reference
                child.family_id = family_id

                # Log child addition
                await CollaborationLogService.log_action(
                    session=session,
                    family_id=family_id,
                    actor_user_id=granted_by,
                    action_type=LogAction.CHILD_ADDED,
                    target_type="child",
                    target_id=child_id,
                    details={
                        'child_name': child.name,
                        'access_level': access_level
                    }
                )

                await session.commit()
                logger.info(f"Added child {child_id} to family {family_id}")
                return child_access

            except Exception as e:
                await session.rollback()
                logger.error(f"Failed to add child to family: {e}")
                raise

    @staticmethod
    async def update_caregiver_presence(
        user_id: str,
        family_id: str,
        status: PresenceStatus,
        current_activity: str = None,
        child_id: str = None,
        device_info: dict = None
    ):
        """Update and broadcast caregiver presence"""
        async for session in get_async_session():
            try:
                # Upsert presence record
                presence_data = {
                    'user_id': user_id,
                    'family_id': family_id,
                    'status': status,
                    'current_activity': current_activity,
                    'child_id': child_id,
                    'last_seen': datetime.now(timezone.utc),
                    'device_info': device_info or {}
                }

                # Check if presence record exists
                existing = await session.execute(
                    select(CaregiverPresence)
                    .where(
                        CaregiverPresence.user_id == user_id,
                        CaregiverPresence.family_id == family_id
                    )
                )
                presence = existing.scalar_one_or_none()

                if presence:
                    # Update existing record
                    for key, value in presence_data.items():
                        if key not in ['user_id', 'family_id']:
                            setattr(presence, key, value)
                else:
                    # Create new record
                    presence = CaregiverPresence(**presence_data)
                    session.add(presence)

                await session.commit()

                # Broadcast presence change would happen here
                # (Supabase real-time integration)

                logger.debug(f"Updated presence for user {user_id} in family {family_id}: {status}")

            except Exception as e:
                await session.rollback()
                logger.error(f"Failed to update presence: {e}")
                raise

    @staticmethod
    async def get_family_members(family_id: str) -> List[FamilyMember]:
        """Get all active members of a family"""
        async for session in get_async_session():
            result = await session.execute(
                select(FamilyMember)
                .options(selectinload(FamilyMember.user))
                .where(
                    FamilyMember.family_id == family_id,
                    FamilyMember.status == MemberStatus.ACTIVE
                )
                .order_by(FamilyMember.joined_at)
            )
            return result.scalars().all()

    @staticmethod
    async def get_family_children(family_id: str) -> List[Child]:
        """Get all children accessible to a family"""
        async for session in get_async_session():
            result = await session.execute(
                select(Child)
                .join(FamilyChildAccess)
                .where(FamilyChildAccess.family_id == family_id)
                .order_by(Child.created_at.desc())
            )
            return result.scalars().all()

    @staticmethod
    async def get_user_families(user_id: str) -> List[Family]:
        """Get all families a user is a member of"""
        async for session in get_async_session():
            result = await session.execute(
                select(Family)
                .join(FamilyMember)
                .where(
                    FamilyMember.user_id == user_id,
                    FamilyMember.status == MemberStatus.ACTIVE
                )
                .order_by(FamilyMember.joined_at.desc())
            )
            return result.scalars().all()

    @staticmethod
    def _generate_permissions_for_role(role: MemberRole) -> dict:
        """Generate permission dictionary for a given role"""
        base_permissions = {
            "can_view_all_data": False,
            "can_edit_child_profiles": False,
            "can_invite_members": False,
            "can_manage_settings": False,
            "can_export_data": False,
            "can_access_historical_data": False,
            "allowed_activity_types": [],
            "can_edit_own_activities": False,
            "can_edit_others_activities": False,
            "can_bulk_log": False
        }

        if role == MemberRole.FAMILY_CORE:
            base_permissions.update({
                "can_view_all_data": True,
                "can_edit_child_profiles": True,
                "can_invite_members": True,
                "can_manage_settings": True,
                "can_export_data": True,
                "can_access_historical_data": True,
                "allowed_activity_types": ["all"],
                "can_edit_own_activities": True,
                "can_edit_others_activities": True,
                "can_bulk_log": True
            })
        elif role == MemberRole.EXTENDED_FAMILY:
            base_permissions.update({
                "can_view_all_data": True,
                "can_access_historical_data": True,
                "allowed_activity_types": ["all"],
                "can_edit_own_activities": True
            })
        elif role == MemberRole.PROFESSIONAL:
            base_permissions.update({
                "can_view_all_data": True,
                "can_access_historical_data": "relevant_only",
                "can_export_data": "professional_reports_only",
                "allowed_activity_types": ["professional_scope"],
                "can_edit_own_activities": True
            })
        elif role == MemberRole.INSTITUTIONAL:
            base_permissions.update({
                "can_view_all_data": "basic_info_only",
                "can_access_historical_data": False,
                "allowed_activity_types": ["basic_only"],
                "can_edit_own_activities": "within_time_window",
                "time_restrictions": {
                    "session_duration_hours": 8,
                    "auto_expire_days": 7,
                    "activity_window_minutes": 30
                }
            })

        return base_permissions

    @staticmethod
    async def _get_family_name(family_id: str) -> str:
        """Get family name by ID"""
        async for session in get_async_session():
            result = await session.execute(
                select(Family.name).where(Family.id == family_id)
            )
            return result.scalar_one_or_none() or "Unknown Family"

    @staticmethod
    async def _get_user_name(user_id: str) -> str:
        """Get user display name by ID"""
        async for session in get_async_session():
            result = await session.execute(
                select(User.display_name, User.email).where(User.id == user_id)
            )
            user_data = result.first()
            if user_data:
                return user_data.display_name or user_data.email
            return "Unknown User"


class CollaborationLogService:
    """Service for managing collaboration audit logs"""

    @staticmethod
    async def log_action(
        session,
        family_id: str,
        actor_user_id: str,
        action_type: LogAction,
        target_type: str = None,
        target_id: str = None,
        details: dict = None,
        ip_address: str = None,
        user_agent: str = None
    ):
        """Log a collaboration action for PIPEDA compliance"""
        try:
            log_entry = CollaborationLog(
                family_id=family_id,
                actor_user_id=actor_user_id,
                action_type=action_type,
                target_type=target_type,
                target_id=target_id,
                details=details or {},
                ip_address=ip_address,
                user_agent=user_agent
            )
            session.add(log_entry)
            # Note: session.commit() is handled by the calling function

        except Exception as e:
            logger.error(f"Failed to log collaboration action: {e}")
            raise


class CollaborationPermissionService:
    """Service for checking collaboration permissions"""

    @staticmethod
    async def check_family_access(user_id: str, family_id: str, action: str) -> bool:
        """Validate user can perform action on family"""
        async for session in get_async_session():
            # Get user's role in family
            result = await session.execute(
                select(FamilyMember)
                .where(
                    FamilyMember.user_id == user_id,
                    FamilyMember.family_id == family_id,
                    FamilyMember.status == MemberStatus.ACTIVE
                )
            )
            member = result.scalar_one_or_none()

            if not member:
                return False

            # Check if access has expired
            if member.access_expires_at and member.access_expires_at < datetime.now(timezone.utc):
                return False

            # Validate action against role permissions
            permissions = member.permissions or {}
            return CollaborationPermissionService._validate_action_for_role(
                member.role, action, permissions
            )

    @staticmethod
    def _validate_action_for_role(role: MemberRole, action: str, permissions: dict) -> bool:
        """Validate if role can perform action"""
        action_permission_map = {
            'invite_members': 'can_invite_members',
            'edit_child_profiles': 'can_edit_child_profiles',
            'manage_settings': 'can_manage_settings',
            'export_data': 'can_export_data',
            'log_activity': 'allowed_activity_types',
            'view_data': 'can_view_all_data'
        }

        permission_key = action_permission_map.get(action)
        if not permission_key:
            return False

        permission_value = permissions.get(permission_key, False)

        # Handle boolean permissions
        if isinstance(permission_value, bool):
            return permission_value

        # Handle array permissions (like activity types)
        if isinstance(permission_value, list):
            return "all" in permission_value or action in permission_value

        # Handle string permissions (like restricted access)
        if isinstance(permission_value, str):
            return permission_value not in ["false", "none", "disabled"]

        return False

    @staticmethod
    async def get_accessible_children(user_id: str, family_id: str) -> List[str]:
        """Get list of child IDs user can access in family"""
        async for session in get_async_session():
            result = await session.execute(
                select(FamilyChildAccess.child_id)
                .join(FamilyMember)
                .where(
                    FamilyMember.user_id == user_id,
                    FamilyMember.family_id == family_id,
                    FamilyMember.status == MemberStatus.ACTIVE
                )
            )
            return [row[0] for row in result.fetchall()]


# =============================================================================
# Export Services
# =============================================================================

__all__ = [
    "CollaborationService",
    "CollaborationLogService",
    "CollaborationPermissionService"
]