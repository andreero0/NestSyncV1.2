"""
GraphQL Types for Collaboration Features
Family management, caregiver invitations, and real-time collaboration
"""

import strawberry
from typing import Optional, List
from datetime import datetime
from enum import Enum

from app.models.collaboration import (
    FamilyType as ModelFamilyType,
    MemberRole as ModelMemberRole,
    MemberStatus as ModelMemberStatus,
    AccessLevel as ModelAccessLevel,
    InvitationStatus as ModelInvitationStatus,
    PresenceStatus as ModelPresenceStatus
)


# =============================================================================
# Enums
# =============================================================================

@strawberry.enum
class FamilyType(Enum):
    PERSONAL = "personal"
    STANDARD = "standard"
    INSTITUTIONAL = "institutional"


@strawberry.enum
class MemberRole(Enum):
    FAMILY_CORE = "family_core"
    EXTENDED_FAMILY = "extended_family"
    PROFESSIONAL = "professional"
    INSTITUTIONAL = "institutional"


@strawberry.enum
class MemberStatus(Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    EXPIRED = "expired"


@strawberry.enum
class AccessLevel(Enum):
    FULL = "full"
    LIMITED = "limited"
    READ_ONLY = "read_only"
    EMERGENCY_ONLY = "emergency_only"


@strawberry.enum
class InvitationStatus(Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    EXPIRED = "expired"
    REVOKED = "revoked"


@strawberry.enum
class PresenceStatus(Enum):
    ONLINE = "online"
    AWAY = "away"
    CARING = "caring"
    OFFLINE = "offline"


# =============================================================================
# Core Types
# =============================================================================

@strawberry.type
class FamilySettings:
    time_zone: str
    language: str
    privacy_level: str
    allow_guest_access: bool
    data_retention_days: int
    notification_settings: strawberry.scalars.JSON


@strawberry.type
class MemberPermissions:
    can_view_all_data: bool
    can_edit_child_profiles: bool
    can_invite_members: bool
    can_manage_settings: bool
    can_export_data: bool
    can_access_historical_data: bool
    allowed_activity_types: List[str]
    can_edit_own_activities: bool
    can_edit_others_activities: bool
    can_bulk_log: bool


@strawberry.type
class DeviceInfo:
    platform: Optional[str] = None
    version: Optional[str] = None
    model: Optional[str] = None


@strawberry.type
class Family:
    id: strawberry.ID
    name: str
    family_type: FamilyType
    description: Optional[str]
    created_by: strawberry.ID
    created_at: datetime
    settings: FamilySettings
    member_count: Optional[int] = None
    children_count: Optional[int] = None

    @classmethod
    def from_orm(cls, family_orm) -> "Family":
        """Convert ORM model to GraphQL type"""
        # Ensure settings is a dictionary (handle None case)
        settings_dict = family_orm.settings if family_orm.settings is not None else {}

        return cls(
            id=strawberry.ID(str(family_orm.id)),
            name=family_orm.name,
            family_type=FamilyType(family_orm.family_type.value),
            description=family_orm.description,
            created_by=strawberry.ID(str(family_orm.created_by)),
            created_at=family_orm.created_at,
            settings=FamilySettings(
                time_zone=settings_dict.get("timezone", "America/Toronto"),
                language=settings_dict.get("language", "en-CA"),
                privacy_level=settings_dict.get("privacy_level", "family_only"),
                allow_guest_access=settings_dict.get("allow_guest_access", False),
                data_retention_days=settings_dict.get("data_retention_days", 2555),
                notification_settings=settings_dict.get("notification_settings", {})
            )
        )


@strawberry.type
class FamilyMember:
    id: strawberry.ID
    user_id: strawberry.ID
    family_id: strawberry.ID
    role: MemberRole
    permissions: MemberPermissions
    joined_at: datetime
    access_expires_at: Optional[datetime]
    status: MemberStatus
    user_display_name: Optional[str] = None
    user_email: Optional[str] = None

    @classmethod
    def from_orm(cls, member_orm) -> "FamilyMember":
        """Convert ORM model to GraphQL type"""
        permissions = member_orm.permissions or {}

        return cls(
            id=strawberry.ID(str(member_orm.id)),
            user_id=strawberry.ID(str(member_orm.user_id)),
            family_id=strawberry.ID(str(member_orm.family_id)),
            role=MemberRole(member_orm.role.value),
            permissions=MemberPermissions(
                can_view_all_data=permissions.get("can_view_all_data", False),
                can_edit_child_profiles=permissions.get("can_edit_child_profiles", False),
                can_invite_members=permissions.get("can_invite_members", False),
                can_manage_settings=permissions.get("can_manage_settings", False),
                can_export_data=permissions.get("can_export_data", False),
                can_access_historical_data=permissions.get("can_access_historical_data", False),
                allowed_activity_types=permissions.get("allowed_activity_types", []),
                can_edit_own_activities=permissions.get("can_edit_own_activities", False),
                can_edit_others_activities=permissions.get("can_edit_others_activities", False),
                can_bulk_log=permissions.get("can_bulk_log", False)
            ),
            joined_at=member_orm.joined_at,
            access_expires_at=member_orm.access_expires_at,
            status=MemberStatus(member_orm.status.value),
            user_display_name=member_orm.user.display_name if member_orm.user else None,
            user_email=member_orm.user.email if member_orm.user else None
        )


@strawberry.type
class CaregiverInvitation:
    id: strawberry.ID
    family_id: strawberry.ID
    email: str
    role: MemberRole
    invited_by: strawberry.ID
    created_at: datetime
    expires_at: datetime
    status: InvitationStatus
    invitation_token: str
    family_name: Optional[str] = None
    inviter_name: Optional[str] = None

    @classmethod
    def from_orm(cls, invitation_orm) -> "CaregiverInvitation":
        """Convert ORM model to GraphQL type"""
        return cls(
            id=strawberry.ID(str(invitation_orm.id)),
            family_id=strawberry.ID(str(invitation_orm.family_id)),
            email=invitation_orm.email,
            role=MemberRole(invitation_orm.role.value),
            invited_by=strawberry.ID(str(invitation_orm.invited_by)),
            created_at=invitation_orm.created_at,
            expires_at=invitation_orm.expires_at,
            status=InvitationStatus(invitation_orm.status.value),
            invitation_token=invitation_orm.invitation_token,
            family_name=invitation_orm.family.name if invitation_orm.family else None,
            inviter_name=invitation_orm.inviter.display_name if invitation_orm.inviter else None
        )


@strawberry.type
class CaregiverPresence:
    user_id: strawberry.ID
    family_id: strawberry.ID
    child_id: Optional[strawberry.ID]
    status: PresenceStatus
    current_activity: Optional[str]
    last_seen: datetime
    device_info: Optional[DeviceInfo]
    user_display_name: Optional[str] = None

    @classmethod
    def from_orm(cls, presence_orm) -> "CaregiverPresence":
        """Convert ORM model to GraphQL type"""
        device_info = None
        if presence_orm.device_info:
            device_info = DeviceInfo(
                platform=presence_orm.device_info.get("platform"),
                version=presence_orm.device_info.get("version"),
                model=presence_orm.device_info.get("model")
            )

        return cls(
            user_id=strawberry.ID(str(presence_orm.user_id)),
            family_id=strawberry.ID(str(presence_orm.family_id)),
            child_id=strawberry.ID(str(presence_orm.child_id)) if presence_orm.child_id else None,
            status=PresenceStatus(presence_orm.status.value),
            current_activity=presence_orm.current_activity,
            last_seen=presence_orm.last_seen,
            device_info=device_info,
            user_display_name=presence_orm.user.display_name if presence_orm.user else None
        )


# =============================================================================
# Connection Types
# =============================================================================

@strawberry.type
class FamilyConnection:
    nodes: List[Family]
    total_count: int
    has_next_page: bool = False
    has_previous_page: bool = False


@strawberry.type
class FamilyMemberConnection:
    nodes: List[FamilyMember]
    total_count: int
    has_next_page: bool = False
    has_previous_page: bool = False


@strawberry.type
class CaregiverInvitationConnection:
    nodes: List[CaregiverInvitation]
    total_count: int
    has_next_page: bool = False
    has_previous_page: bool = False


# =============================================================================
# Input Types
# =============================================================================

@strawberry.input
class CreateFamilyInput:
    name: str
    family_type: Optional[FamilyType] = FamilyType.STANDARD
    description: Optional[str] = None


@strawberry.input
class UpdateFamilyInput:
    family_id: strawberry.ID
    name: Optional[str] = None
    description: Optional[str] = None
    settings: Optional[strawberry.scalars.JSON] = None


@strawberry.input
class InviteCaregiverInput:
    family_id: strawberry.ID
    email: str
    role: MemberRole
    access_restrictions: Optional[strawberry.scalars.JSON] = None


@strawberry.input
class UpdateMemberRoleInput:
    family_id: strawberry.ID
    user_id: strawberry.ID
    new_role: MemberRole


@strawberry.input
class AddChildToFamilyInput:
    family_id: strawberry.ID
    child_id: strawberry.ID
    access_level: Optional[AccessLevel] = AccessLevel.FULL


@strawberry.input
class UpdatePresenceInput:
    family_id: strawberry.ID
    status: PresenceStatus
    current_activity: Optional[str] = None
    child_id: Optional[strawberry.ID] = None
    device_info: Optional[strawberry.scalars.JSON] = None


@strawberry.input
class FamilyActivityInput:
    family_id: strawberry.ID
    child_id: strawberry.ID
    activity_type: str
    logged_at: Optional[datetime] = None
    notes: Optional[str] = None
    activity_metadata: Optional[strawberry.scalars.JSON] = None


# =============================================================================
# Response Types
# =============================================================================

@strawberry.type
class CreateFamilyResponse:
    success: bool
    family: Optional[Family] = None
    error: Optional[str] = None
    message: Optional[str] = None


@strawberry.type
class InviteCaregiverResponse:
    success: bool
    invitation: Optional[CaregiverInvitation] = None
    error: Optional[str] = None
    message: Optional[str] = None


@strawberry.type
class AcceptInvitationResponse:
    success: bool
    family_member: Optional[FamilyMember] = None
    family: Optional[Family] = None
    error: Optional[str] = None
    message: Optional[str] = None


@strawberry.type
class UpdateFamilyResponse:
    success: bool
    family: Optional[Family] = None
    error: Optional[str] = None
    message: Optional[str] = None


@strawberry.type
class UpdateMemberRoleResponse:
    success: bool
    family_member: Optional[FamilyMember] = None
    error: Optional[str] = None
    message: Optional[str] = None


@strawberry.type
class AddChildToFamilyResponse:
    success: bool
    child_id: Optional[strawberry.ID] = None
    family_id: Optional[strawberry.ID] = None
    error: Optional[str] = None
    message: Optional[str] = None


@strawberry.type
class PresenceResponse:
    success: bool
    presence: Optional[CaregiverPresence] = None
    error: Optional[str] = None
    message: Optional[str] = None


@strawberry.type
class LogFamilyActivityResponse:
    success: bool
    activity_id: Optional[strawberry.ID] = None
    error: Optional[str] = None
    message: Optional[str] = None
    conflict_resolved: Optional[bool] = None


# =============================================================================
# Export Types
# =============================================================================

__all__ = [
    # Enums
    "FamilyType", "MemberRole", "MemberStatus", "AccessLevel",
    "InvitationStatus", "PresenceStatus",

    # Core Types
    "Family", "FamilyMember", "CaregiverInvitation", "CaregiverPresence",
    "FamilySettings", "MemberPermissions", "DeviceInfo",

    # Connection Types
    "FamilyConnection", "FamilyMemberConnection", "CaregiverInvitationConnection",

    # Input Types
    "CreateFamilyInput", "UpdateFamilyInput", "InviteCaregiverInput",
    "UpdateMemberRoleInput", "AddChildToFamilyInput", "UpdatePresenceInput",
    "FamilyActivityInput",

    # Response Types
    "CreateFamilyResponse", "InviteCaregiverResponse", "AcceptInvitationResponse",
    "UpdateFamilyResponse", "UpdateMemberRoleResponse", "AddChildToFamilyResponse",
    "PresenceResponse", "LogFamilyActivityResponse"
]