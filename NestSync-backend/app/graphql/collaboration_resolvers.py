"""
GraphQL Resolvers for Collaboration Features
Family management, caregiver invitations, and real-time collaboration
"""

import logging
from typing import Optional, List
import strawberry
from strawberry.types import Info
from sqlalchemy import select, and_, or_, func
from sqlalchemy.orm import selectinload, joinedload

from app.config.database import get_async_session
from app.models import (
    Family, FamilyMember, FamilyChildAccess, CaregiverInvitation,
    CollaborationLog, CaregiverPresence, Child, User, Activity,
    FamilyType as ModelFamilyType, MemberRole as ModelMemberRole,
    MemberStatus as ModelMemberStatus, InvitationStatus as ModelInvitationStatus,
    PresenceStatus as ModelPresenceStatus
)
from app.services.collaboration_service import (
    CollaborationService, CollaborationPermissionService,
    CollaborationLogService
)
from app.services.activity_service import ActivityCollaborationService
from app.auth.dependencies import get_user_id_from_context
from .collaboration_types import (
    Family as FamilyType, FamilyMember as FamilyMemberType,
    CaregiverInvitation as CaregiverInvitationType,
    CaregiverPresence as CaregiverPresenceType,
    FamilyConnection, FamilyMemberConnection, CaregiverInvitationConnection,
    CreateFamilyInput, CreateFamilyResponse,
    InviteCaregiverInput, InviteCaregiverResponse,
    AcceptInvitationResponse, UpdateFamilyInput, UpdateFamilyResponse,
    UpdateMemberRoleInput, UpdateMemberRoleResponse,
    AddChildToFamilyInput, AddChildToFamilyResponse,
    UpdatePresenceInput, PresenceResponse,
    FamilyActivityInput, LogFamilyActivityResponse
)

logger = logging.getLogger(__name__)


# =============================================================================
# Query Resolvers
# =============================================================================

@strawberry.type
class CollaborationQueries:
    """GraphQL queries for collaboration features"""

    @strawberry.field
    async def my_families(self, info: Info) -> FamilyConnection:
        """Get families where current user is a member"""
        try:
            user_id = await get_user_id_from_context(info)

            async for session in get_async_session():
                result = await session.execute(
                    select(Family)
                    .join(FamilyMember)
                    .where(
                        FamilyMember.user_id == user_id,
                        FamilyMember.status == ModelMemberStatus.ACTIVE
                    )
                    .order_by(FamilyMember.joined_at.desc())
                )
                families = result.scalars().all()

                return FamilyConnection(
                    nodes=[FamilyType.from_orm(family) for family in families],
                    total_count=len(families)
                )

        except Exception as e:
            logger.error(f"Error getting user families: {e}")
            return FamilyConnection(nodes=[], total_count=0)

    @strawberry.field
    async def family_details(self, family_id: strawberry.ID, info: Info) -> Optional[FamilyType]:
        """Get detailed information about a specific family"""
        try:
            user_id = await get_user_id_from_context(info)

            # Check user has access to family
            has_access = await CollaborationPermissionService.check_family_access(
                user_id, str(family_id), 'view_data'
            )
            if not has_access:
                return None

            async for session in get_async_session():
                result = await session.execute(
                    select(Family)
                    .where(Family.id == family_id)
                )
                family = result.scalar_one_or_none()

                if family:
                    return FamilyType.from_orm(family)
                return None

        except Exception as e:
            logger.error(f"Error getting family details: {e}")
            return None

    @strawberry.field
    async def family_members(self, family_id: strawberry.ID, info: Info) -> FamilyMemberConnection:
        """Get all members of a family"""
        try:
            user_id = await get_user_id_from_context(info)

            # Check user has access to family
            has_access = await CollaborationPermissionService.check_family_access(
                user_id, str(family_id), 'view_data'
            )
            if not has_access:
                return FamilyMemberConnection(nodes=[], total_count=0)

            async for session in get_async_session():
                result = await session.execute(
                    select(FamilyMember)
                    .options(selectinload(FamilyMember.user))
                    .where(
                        FamilyMember.family_id == family_id,
                        FamilyMember.status == ModelMemberStatus.ACTIVE
                    )
                    .order_by(FamilyMember.joined_at)
                )
                members = result.scalars().all()

                return FamilyMemberConnection(
                    nodes=[FamilyMemberType.from_orm(member) for member in members],
                    total_count=len(members)
                )

        except Exception as e:
            logger.error(f"Error getting family members: {e}")
            return FamilyMemberConnection(nodes=[], total_count=0)

    @strawberry.field
    async def pending_invitations(self, info: Info) -> CaregiverInvitationConnection:
        """Get pending invitations for current user"""
        try:
            user_id = await get_user_id_from_context(info)

            async for session in get_async_session():
                # Get user's email
                user_result = await session.execute(
                    select(User.email).where(User.id == user_id)
                )
                user_email = user_result.scalar_one_or_none()

                if not user_email:
                    return CaregiverInvitationConnection(nodes=[], total_count=0)

                # Get pending invitations
                result = await session.execute(
                    select(CaregiverInvitation)
                    .options(
                        selectinload(CaregiverInvitation.family),
                        selectinload(CaregiverInvitation.inviter)
                    )
                    .where(
                        CaregiverInvitation.email == user_email,
                        CaregiverInvitation.status == ModelInvitationStatus.PENDING
                    )
                    .order_by(CaregiverInvitation.created_at.desc())
                )
                invitations = result.scalars().all()

                return CaregiverInvitationConnection(
                    nodes=[CaregiverInvitationType.from_orm(inv) for inv in invitations],
                    total_count=len(invitations)
                )

        except Exception as e:
            logger.error(f"Error getting pending invitations: {e}")
            return CaregiverInvitationConnection(nodes=[], total_count=0)

    @strawberry.field
    async def family_presence(self, family_id: strawberry.ID, info: Info) -> List[CaregiverPresenceType]:
        """Get real-time presence of family members"""
        try:
            user_id = await get_user_id_from_context(info)

            # Check user has access to family
            has_access = await CollaborationPermissionService.check_family_access(
                user_id, str(family_id), 'view_data'
            )
            if not has_access:
                return []

            async for session in get_async_session():
                result = await session.execute(
                    select(CaregiverPresence)
                    .options(selectinload(CaregiverPresence.user))
                    .where(CaregiverPresence.family_id == family_id)
                    .order_by(CaregiverPresence.last_seen.desc())
                )
                presence_records = result.scalars().all()

                return [CaregiverPresenceType.from_orm(presence) for presence in presence_records]

        except Exception as e:
            logger.error(f"Error getting family presence: {e}")
            return []


# =============================================================================
# Mutation Resolvers
# =============================================================================

@strawberry.type
class CollaborationMutations:
    """GraphQL mutations for collaboration features"""

    @strawberry.mutation
    async def create_family(
        self,
        input: CreateFamilyInput,
        info: Info
    ) -> CreateFamilyResponse:
        """Create a new family for collaboration"""
        try:
            user_id = await get_user_id_from_context(info)

            family = await CollaborationService.create_family(
                creator_id=user_id,
                name=input.name,
                family_type=input.family_type.value if input.family_type else "standard",
                description=input.description
            )

            return CreateFamilyResponse(
                success=True,
                family=FamilyType.from_orm(family),
                message="Family created successfully"
            )

        except Exception as e:
            logger.error(f"Error creating family: {e}")
            return CreateFamilyResponse(
                success=False,
                error=f"Failed to create family: {str(e)}"
            )

    @strawberry.mutation
    async def invite_caregiver(
        self,
        input: InviteCaregiverInput,
        info: Info
    ) -> InviteCaregiverResponse:
        """Invite a caregiver to join family"""
        try:
            user_id = await get_user_id_from_context(info)

            invitation = await CollaborationService.invite_caregiver(
                family_id=str(input.family_id),
                inviter_id=user_id,
                email=input.email,
                role=input.role.value,
                access_restrictions=input.access_restrictions
            )

            return InviteCaregiverResponse(
                success=True,
                invitation=CaregiverInvitationType.from_orm(invitation),
                message=f"Invitation sent to {input.email}"
            )

        except PermissionError as e:
            return InviteCaregiverResponse(
                success=False,
                error="Permission denied: Cannot invite members"
            )
        except ValueError as e:
            return InviteCaregiverResponse(
                success=False,
                error=str(e)
            )
        except Exception as e:
            logger.error(f"Error inviting caregiver: {e}")
            return InviteCaregiverResponse(
                success=False,
                error=f"Failed to send invitation: {str(e)}"
            )

    @strawberry.mutation
    async def accept_invitation(
        self,
        token: str,
        info: Info
    ) -> AcceptInvitationResponse:
        """Accept caregiver invitation and join family"""
        try:
            user_id = await get_user_id_from_context(info)

            family_member = await CollaborationService.accept_invitation(
                invitation_token=token,
                accepter_id=user_id
            )

            # Get family details
            async for session in get_async_session():
                family = await session.get(Family, family_member.family_id)

            return AcceptInvitationResponse(
                success=True,
                family_member=FamilyMemberType.from_orm(family_member),
                family=FamilyType.from_orm(family) if family else None,
                message="Successfully joined family"
            )

        except ValueError as e:
            return AcceptInvitationResponse(
                success=False,
                error=str(e)
            )
        except Exception as e:
            logger.error(f"Error accepting invitation: {e}")
            return AcceptInvitationResponse(
                success=False,
                error=f"Failed to accept invitation: {str(e)}"
            )

    @strawberry.mutation
    async def add_child_to_family(
        self,
        input: AddChildToFamilyInput,
        info: Info
    ) -> AddChildToFamilyResponse:
        """Add child to family with specified access level"""
        try:
            user_id = await get_user_id_from_context(info)

            # Check permission to add children
            has_permission = await CollaborationPermissionService.check_family_access(
                user_id, str(input.family_id), 'edit_child_profiles'
            )
            if not has_permission:
                return AddChildToFamilyResponse(
                    success=False,
                    error="Permission denied: Cannot add children to this family"
                )

            child_access = await CollaborationService.add_child_to_family(
                family_id=str(input.family_id),
                child_id=str(input.child_id),
                access_level=input.access_level.value if input.access_level else "full",
                granted_by=user_id
            )

            return AddChildToFamilyResponse(
                success=True,
                child_id=input.child_id,
                family_id=input.family_id,
                message="Child added to family successfully"
            )

        except Exception as e:
            logger.error(f"Error adding child to family: {e}")
            return AddChildToFamilyResponse(
                success=False,
                error=f"Failed to add child to family: {str(e)}"
            )

    @strawberry.mutation
    async def update_presence(
        self,
        input: UpdatePresenceInput,
        info: Info
    ) -> PresenceResponse:
        """Update caregiver presence status"""
        try:
            user_id = await get_user_id_from_context(info)

            await CollaborationService.update_caregiver_presence(
                user_id=user_id,
                family_id=str(input.family_id),
                status=ModelPresenceStatus(input.status.value),
                current_activity=input.current_activity,
                child_id=str(input.child_id) if input.child_id else None,
                device_info=input.device_info
            )

            # Get updated presence
            async for session in get_async_session():
                result = await session.execute(
                    select(CaregiverPresence)
                    .options(selectinload(CaregiverPresence.user))
                    .where(
                        CaregiverPresence.user_id == user_id,
                        CaregiverPresence.family_id == input.family_id
                    )
                )
                presence = result.scalar_one_or_none()

            return PresenceResponse(
                success=True,
                presence=CaregiverPresenceType.from_orm(presence) if presence else None,
                message="Presence updated successfully"
            )

        except Exception as e:
            logger.error(f"Error updating presence: {e}")
            return PresenceResponse(
                success=False,
                error=f"Failed to update presence: {str(e)}"
            )

    @strawberry.mutation
    async def log_family_activity(
        self,
        input: FamilyActivityInput,
        info: Info
    ) -> LogFamilyActivityResponse:
        """Log activity in family context with collaboration features"""
        try:
            user_id = await get_user_id_from_context(info)

            # Verify family access
            has_access = await CollaborationPermissionService.check_family_access(
                user_id, str(input.family_id), 'log_activity'
            )
            if not has_access:
                return LogFamilyActivityResponse(
                    success=False,
                    error="Permission denied: Cannot log activities for this family"
                )

            # Create activity with collaboration context
            async for session in get_async_session():
                activity = Activity(
                    child_id=input.child_id,
                    activity_type=input.activity_type,
                    logged_at=input.logged_at,
                    logged_by_user_id=user_id,
                    notes=input.notes,
                    activity_metadata=input.activity_metadata or {},
                    family_context={
                        'family_id': str(input.family_id),
                        'family_context': True,
                        'logged_via_collaboration': True
                    },
                    collaboration_metadata={}
                )
                session.add(activity)
                await session.flush()

                # Log collaboration action
                await CollaborationLogService.log_action(
                    session=session,
                    family_id=str(input.family_id),
                    actor_user_id=user_id,
                    action_type="activity_logged",
                    target_type="activity",
                    target_id=str(activity.id),
                    details={
                        'activity_type': input.activity_type,
                        'child_id': str(input.child_id)
                    }
                )

                await session.commit()

                return LogFamilyActivityResponse(
                    success=True,
                    activity_id=strawberry.ID(str(activity.id)),
                    message="Activity logged successfully"
                )

        except PermissionError as e:
            return LogFamilyActivityResponse(
                success=False,
                error=f"Permission denied: {str(e)}"
            )
        except Exception as e:
            logger.error(f"Error logging family activity: {e}")
            return LogFamilyActivityResponse(
                success=False,
                error=f"Failed to log activity: {str(e)}"
            )


# =============================================================================
# Export Resolvers
# =============================================================================

__all__ = ["CollaborationQueries", "CollaborationMutations"]