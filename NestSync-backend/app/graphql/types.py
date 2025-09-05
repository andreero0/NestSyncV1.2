"""
GraphQL Types for NestSync
PIPEDA-compliant Canadian diaper planning application
"""

import strawberry
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from enum import Enum

# =============================================================================
# Enums
# =============================================================================

@strawberry.enum
class UserStatusType(Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    PENDING_VERIFICATION = "pending_verification"
    PENDING_DELETION = "pending_deletion"


@strawberry.enum
class DiaperSizeType(Enum):
    NEWBORN = "newborn"
    SIZE_1 = "size_1"
    SIZE_2 = "size_2"
    SIZE_3 = "size_3"
    SIZE_4 = "size_4"
    SIZE_5 = "size_5"
    SIZE_6 = "size_6"
    SIZE_7 = "size_7"


@strawberry.enum
class GenderType(Enum):
    BOY = "boy"
    GIRL = "girl"
    OTHER = "other"
    PREFER_NOT_TO_SAY = "prefer_not_to_say"


@strawberry.enum
class ConsentStatusType(Enum):
    GRANTED = "granted"
    WITHDRAWN = "withdrawn"
    EXPIRED = "expired"
    PENDING = "pending"


@strawberry.enum
class ConsentTypeEnum(Enum):
    PRIVACY_POLICY = "privacy_policy"
    TERMS_OF_SERVICE = "terms_of_service"
    MARKETING = "marketing"
    ANALYTICS = "analytics"
    DATA_SHARING = "data_sharing"
    COOKIES = "cookies"
    LOCATION_TRACKING = "location_tracking"
    BIOMETRIC_DATA = "biometric_data"
    CHILD_DATA = "child_data"
    EMERGENCY_CONTACTS = "emergency_contacts"


# =============================================================================
# User Types
# =============================================================================

@strawberry.type
class UserProfile:
    """User profile information (public fields only)"""
    id: strawberry.ID
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    display_name: Optional[str] = None
    timezone: str = "America/Toronto"
    language: str = "en"
    currency: str = "CAD"
    province: Optional[str] = None
    status: UserStatusType
    email_verified: bool
    onboarding_completed: bool
    created_at: datetime


@strawberry.type  
class UserSession:
    """User authentication session"""
    access_token: str
    refresh_token: str
    expires_in: int
    token_type: str = "Bearer"


@strawberry.type
class AuthResponse:
    """Authentication response"""
    success: bool
    message: Optional[str] = None
    error: Optional[str] = None
    user: Optional[UserProfile] = None
    session: Optional[UserSession] = None


@strawberry.type
class UserConsent:
    """User consent information"""
    consent_type: ConsentTypeEnum
    status: ConsentStatusType
    granted_at: Optional[datetime] = None
    withdrawn_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    consent_version: str


# =============================================================================
# Child Types
# =============================================================================

@strawberry.type
class ChildProfile:
    """Child profile information"""
    id: strawberry.ID
    name: str
    date_of_birth: date
    gender: Optional[GenderType] = None
    current_diaper_size: DiaperSizeType
    current_weight_kg: Optional[float] = None
    current_height_cm: Optional[float] = None
    daily_usage_count: int
    has_sensitive_skin: bool = False
    has_allergies: bool = False
    allergies_notes: Optional[str] = None
    onboarding_completed: bool = False
    province: Optional[str] = None
    created_at: datetime
    
    # Computed fields
    @strawberry.field
    def age_in_days(self) -> int:
        return (date.today() - self.date_of_birth).days
    
    @strawberry.field
    def age_in_months(self) -> int:
        return self.age_in_days // 30
    
    @strawberry.field
    def weekly_usage(self) -> int:
        return self.daily_usage_count * 7
    
    @strawberry.field
    def monthly_usage(self) -> int:
        return self.daily_usage_count * 30


@strawberry.type
class OnboardingWizardStep:
    """Onboarding wizard step completion"""
    step_name: str
    completed: bool
    completed_at: Optional[datetime] = None
    data: Optional[str] = None  # JSON as string


# =============================================================================
# Input Types
# =============================================================================

@strawberry.input
class SignUpInput:
    """User registration input"""
    email: str
    password: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    timezone: str = "America/Toronto"
    language: str = "en"
    province: Optional[str] = None
    postal_code: Optional[str] = None
    
    # Consent agreements (PIPEDA required)
    accept_privacy_policy: bool
    accept_terms_of_service: bool
    marketing_consent: bool = False
    analytics_consent: bool = False


@strawberry.input
class SignInInput:
    """User sign in input"""
    email: str
    password: str


@strawberry.input
class UpdateProfileInput:
    """Update user profile input"""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    display_name: Optional[str] = None
    timezone: Optional[str] = None
    language: Optional[str] = None
    province: Optional[str] = None
    postal_code: Optional[str] = None
    phone_number: Optional[str] = None


@strawberry.input
class ChangePasswordInput:
    """Change password input"""
    current_password: str
    new_password: str


@strawberry.input
class ResetPasswordInput:
    """Reset password input"""
    email: str


@strawberry.input
class ConsentUpdateInput:
    """Update consent input"""
    consent_type: ConsentTypeEnum
    granted: bool
    consent_version: Optional[str] = None


@strawberry.input
class CreateChildInput:
    """Create child profile input"""
    name: str
    date_of_birth: date
    gender: Optional[GenderType] = None
    current_diaper_size: DiaperSizeType
    current_weight_kg: Optional[float] = None
    current_height_cm: Optional[float] = None
    daily_usage_count: int = 8
    has_sensitive_skin: bool = False
    has_allergies: bool = False
    allergies_notes: Optional[str] = None
    preferred_brands: Optional[List[str]] = None
    special_needs: Optional[str] = None


@strawberry.input
class UpdateChildInput:
    """Update child profile input"""
    name: Optional[str] = None
    current_diaper_size: Optional[DiaperSizeType] = None
    current_weight_kg: Optional[float] = None
    current_height_cm: Optional[float] = None
    daily_usage_count: Optional[int] = None
    has_sensitive_skin: Optional[bool] = None
    has_allergies: Optional[bool] = None
    allergies_notes: Optional[str] = None
    preferred_brands: Optional[List[str]] = None
    special_needs: Optional[str] = None


@strawberry.input
class OnboardingWizardStepInput:
    """Onboarding wizard step input"""
    step_name: str
    data: Optional[str] = None  # JSON as string


@strawberry.input
class InitialInventoryInput:
    """Initial inventory setup input"""
    diaper_size: DiaperSizeType
    brand: str
    quantity: int
    purchase_date: Optional[date] = None
    expiry_date: Optional[date] = None


# =============================================================================
# Response Types
# =============================================================================

@strawberry.type
class MutationResponse:
    """Generic mutation response"""
    success: bool
    message: Optional[str] = None
    error: Optional[str] = None


@strawberry.type
class CreateChildResponse(MutationResponse):
    """Create child response"""
    child: Optional[ChildProfile] = None


@strawberry.type
class UpdateChildResponse(MutationResponse):
    """Update child response"""
    child: Optional[ChildProfile] = None


@strawberry.type
class UserProfileResponse(MutationResponse):
    """User profile response"""
    user: Optional[UserProfile] = None


@strawberry.type
class OnboardingStatusResponse:
    """Onboarding status response"""
    user_onboarding_completed: bool
    current_step: Optional[str] = None
    completed_steps: List[OnboardingWizardStep]
    children_count: int
    required_consents_given: bool


# =============================================================================
# Pagination Types
# =============================================================================

@strawberry.type
class PageInfo:
    """Pagination information"""
    has_next_page: bool
    has_previous_page: bool
    start_cursor: Optional[str] = None
    end_cursor: Optional[str] = None
    total_count: int


@strawberry.type
class ChildConnection:
    """Paginated children list"""
    edges: List[ChildProfile]
    page_info: PageInfo


@strawberry.type
class ConsentConnection:
    """Paginated consent records"""
    edges: List[UserConsent]
    page_info: PageInfo


# =============================================================================
# Error Types
# =============================================================================

@strawberry.type
class ValidationError:
    """Validation error details"""
    field: str
    message: str
    code: Optional[str] = None


@strawberry.type
class ErrorResponse:
    """Error response with details"""
    error: str
    message: str
    details: Optional[List[ValidationError]] = None
    code: Optional[str] = None


# =============================================================================
# Export Types
# =============================================================================

__all__ = [
    # Enums
    "UserStatusType",
    "DiaperSizeType", 
    "GenderType",
    "ConsentStatusType",
    "ConsentTypeEnum",
    
    # User Types
    "UserProfile",
    "UserSession",
    "AuthResponse", 
    "UserConsent",
    
    # Child Types
    "ChildProfile",
    "OnboardingWizardStep",
    
    # Input Types
    "SignUpInput",
    "SignInInput",
    "UpdateProfileInput",
    "ChangePasswordInput",
    "ResetPasswordInput",
    "ConsentUpdateInput",
    "CreateChildInput",
    "UpdateChildInput",
    "OnboardingWizardStepInput",
    "InitialInventoryInput",
    
    # Response Types
    "MutationResponse",
    "CreateChildResponse",
    "UpdateChildResponse", 
    "UserProfileResponse",
    "OnboardingStatusResponse",
    
    # Pagination Types
    "PageInfo",
    "ChildConnection",
    "ConsentConnection",
    
    # Error Types
    "ValidationError",
    "ErrorResponse"
]