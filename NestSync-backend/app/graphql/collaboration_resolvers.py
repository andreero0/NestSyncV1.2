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
        import traceback
        from sqlalchemy.exc import SQLAlchemyError

        try:
            user_id = await get_user_id_from_context(info)
            logger.info(f"my_families: Fetching families for user_id={user_id}")

            async for session in get_async_session():
                try:
                    # Execute query with detailed logging and eager loading
                    logger.info(f"my_families: Executing SQL query for user_id={user_id}")
                    result = await session.execute(
                        select(Family)
                        .join(FamilyMember)
                        .options(
                            selectinload(Family.members),
                            selectinload(Family.children)
                        )
                        .where(
                            FamilyMember.user_id == user_id,
                            FamilyMember.status == ModelMemberStatus.ACTIVE
                        )
                        .order_by(FamilyMember.joined_at.desc())
                    )
                    families = result.scalars().all()
                    logger.info(f"my_families: SQL query returned {len(families)} families")

                    # Try ORM conversion with detailed error tracking
                    converted_families = []
                    for idx, family in enumerate(families):
                        try:
                            logger.debug(f"my_families: Converting family {idx+1}/{len(families)} (id={family.id}, name={family.name})")
                            converted_family = FamilyType.from_orm(family)
                            converted_families.append(converted_family)
                        except AttributeError as attr_error:
                            logger.error(
                                f"my_families: AttributeError converting family {family.id}: {attr_error}\n"
                                f"Family attributes: {dir(family)}\n"
                                f"Traceback: {traceback.format_exc()}"
                            )
                            raise
                        except Exception as conv_error:
                            logger.error(
                                f"my_families: Conversion error for family {family.id}: {conv_error}\n"
                                f"Traceback: {traceback.format_exc()}"
                            )
                            raise

                    logger.info(f"my_families: Successfully converted {len(converted_families)} families")
                    return FamilyConnection(
                        nodes=converted_families,
                        total_count=len(converted_families)
                    )

                except SQLAlchemyError as db_error:
                    logger.error(
                        f"my_families: Database error during query execution: {db_error}\n"
                        f"User ID: {user_id}\n"
                        f"Error type: {type(db_error).__name__}\n"
                        f"Traceback: {traceback.format_exc()}"
                    )
                    raise
                except Exception as inner_error:
                    logger.error(
                        f"my_families: Unexpected error in session context: {inner_error}\n"
                        f"Error type: {type(inner_error).__name__}\n"
                        f"Traceback: {traceback.format_exc()}"
                    )
                    raise

        except Exception as e:
            logger.error(
                f"my_families: Critical error getting families for user: {e}\n"
                f"Error type: {type(e).__name__}\n"
                f"Full traceback:\n{traceback.format_exc()}"
            )
            # Re-raise the exception so GraphQL returns proper error to client
            raise

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
        """Get pending invitations for current user with deduplication safeguard"""
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

                # Get pending invitations with deduplication at query level
                # Use DISTINCT ON to ensure only one invitation per family
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
                    .order_by(
                        CaregiverInvitation.family_id,
                        CaregiverInvitation.created_at.desc()
                    )
                    .distinct(CaregiverInvitation.family_id)
                )
                invitations = result.scalars().all()

                # Additional safeguard: Remove duplicates in memory if any slip through
                seen_families = set()
                unique_invitations = []
                for invitation in invitations:
                    if invitation.family_id not in seen_families:
                        seen_families.add(invitation.family_id)
                        unique_invitations.append(invitation)
                    else:
                        logger.warning(f"Filtered duplicate invitation {invitation.id} for family {invitation.family_id}")

                # Sort by creation date descending for consistent UI ordering
                unique_invitations.sort(key=lambda x: x.created_at, reverse=True)

                return CaregiverInvitationConnection(
                    nodes=[CaregiverInvitationType.from_orm(inv) for inv in unique_invitations],
                    total_count=len(unique_invitations)
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

            # Create the invitation in the database
            invitation = await CollaborationService.invite_caregiver(
                family_id=str(input.family_id),
                inviter_id=user_id,
                email=input.email,
                role=input.role.value,
                access_restrictions=input.access_restrictions
            )

            # Send invitation email in separate async context to avoid greenlet issues
            try:
                from app.services.email_service import EmailService

                # Get family and inviter names for email
                family_name = await CollaborationService._get_family_name(str(input.family_id))
                inviter_name = await CollaborationService._get_user_name(user_id)

                email_sent = await EmailService.send_caregiver_invitation(
                    email=input.email,
                    family_name=family_name,
                    inviter_name=inviter_name,
                    invitation_token=invitation.invitation_token,
                    role=input.role.value
                )

                if email_sent:
                    logger.info(f"✅ Invitation email sent successfully to {input.email}")
                else:
                    logger.warning(f"⚠️ Invitation created but email failed for {input.email}")

            except Exception as email_error:
                # Don't fail the entire invitation if email fails
                logger.error(f"📧 Email sending failed for invitation {invitation.id}: {email_error}")

            return InviteCaregiverResponse(
                success=True,
                invitation=CaregiverInvitationType.from_orm(invitation),
                message=f"Invitation sent to {input.email}"
            )

        except PermissionError as e:
            logger.warning(f"Permission denied for caregiver invitation: {e}")
            return InviteCaregiverResponse(
                success=False,
                error="Permission denied: Cannot invite members"
            )
        except ValueError as e:
            logger.warning(f"Invalid input for caregiver invitation: {e}")
            return InviteCaregiverResponse(
                success=False,
                error=str(e)
            )
        except Exception as e:
            logger.error(f"❌ Critical error inviting caregiver: {e}")
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