"""
GraphQL Types for NestSync
PIPEDA-compliant Canadian diaper planning application
"""

import strawberry
from typing import Optional, List, Dict, Any
from datetime import datetime, date, timezone
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
        age_days = (date.today() - self.date_of_birth).days
        return age_days // 30
    
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
# GraphQL Connection Types (Relay Pattern)
# =============================================================================

from typing import Generic, TypeVar

# Generic type for Connection pattern
GenericType = TypeVar("GenericType")

@strawberry.type
class PageInfo:
    """Information to aid in pagination."""
    has_next_page: bool = strawberry.field(
        description="When paginating forwards, are there more items?"
    )
    has_previous_page: bool = strawberry.field(
        description="When paginating backwards, are there more items?"
    )
    start_cursor: Optional[str] = strawberry.field(
        description="When paginating backwards, the cursor to continue."
    )
    end_cursor: Optional[str] = strawberry.field(
        description="When paginating forwards, the cursor to continue."
    )
    total_count: int = strawberry.field(
        description="Total count of items available."
    )


@strawberry.type
class ChildEdge:
    """An edge in a connection."""
    node: ChildProfile = strawberry.field(
        description="The item at the end of the edge."
    )
    cursor: str = strawberry.field(
        description="A cursor for use in pagination."
    )


@strawberry.type
class ChildConnection:
    """A connection to a list of children."""
    page_info: PageInfo = strawberry.field(
        description="Information to aid in pagination."
    )
    edges: List[ChildEdge] = strawberry.field(
        description="A list of edges."
    )


@strawberry.type
class ConsentEdge:
    """An edge in a consent connection."""
    node: UserConsent = strawberry.field(
        description="The item at the end of the edge."
    )
    cursor: str = strawberry.field(
        description="A cursor for use in pagination."
    )


@strawberry.type
class ConsentConnection:
    """A connection to a list of consent records."""
    page_info: PageInfo = strawberry.field(
        description="Information to aid in pagination."
    )
    edges: List[ConsentEdge] = strawberry.field(
        description="A list of edges."
    )


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
# Inventory Types
# =============================================================================

@strawberry.enum
class ProductTypeEnum(Enum):
    DIAPER = "diaper"
    WIPES = "wipes"
    DIAPER_CREAM = "diaper_cream"
    POWDER = "powder"
    DIAPER_BAGS = "diaper_bags"
    TRAINING_PANTS = "training_pants"
    SWIMWEAR = "swimwear"


@strawberry.enum
class UsageTypeEnum(Enum):
    DIAPER_CHANGE = "diaper_change"
    WIPE_USE = "wipe_use"
    CREAM_APPLICATION = "cream_application"
    ACCIDENT_CLEANUP = "accident_cleanup"
    PREVENTIVE_CHANGE = "preventive_change"
    OVERNIGHT_CHANGE = "overnight_change"


@strawberry.enum
class UsageContextEnum(Enum):
    HOME = "home"
    DAYCARE = "daycare"
    OUTING = "outing"
    TRAVEL = "travel"
    GRANDPARENTS = "grandparents"
    OTHER = "other"


@strawberry.type
class InventoryItem:
    """Physical inventory tracking for diaper products"""
    id: strawberry.ID
    child_id: strawberry.ID
    product_type: ProductTypeEnum
    brand: str
    product_name: Optional[str] = None
    size: str
    quantity_total: int
    quantity_remaining: int
    quantity_reserved: int = 0
    purchase_date: datetime
    cost_cad: Optional[float] = None
    expiry_date: Optional[datetime] = None
    storage_location: Optional[str] = None
    is_opened: bool = False
    opened_date: Optional[datetime] = None
    notes: Optional[str] = None
    quality_rating: Optional[int] = None
    would_rebuy: Optional[bool] = None
    created_at: datetime
    
    @strawberry.field
    def quantity_available(self) -> int:
        """Available quantity (remaining minus reserved)"""
        return max(0, self.quantity_remaining - self.quantity_reserved)
    
    @strawberry.field
    def usage_percentage(self) -> float:
        """Percentage of product used"""
        if self.quantity_total == 0:
            return 0.0
        used = self.quantity_total - self.quantity_remaining
        return round((used / self.quantity_total) * 100, 2)
    
    @strawberry.field
    def is_expired(self) -> bool:
        """Check if product is expired"""
        if not self.expiry_date:
            return False
        return datetime.now(timezone.utc) > self.expiry_date
    
    @strawberry.field
    def days_until_expiry(self) -> Optional[int]:
        """Days until expiry (negative if expired)"""
        if not self.expiry_date:
            return None
        delta = self.expiry_date - datetime.now(timezone.utc)
        return delta.days


@strawberry.type
class UsageLog:
    """Usage tracking for diaper changes and product consumption"""
    id: strawberry.ID
    child_id: strawberry.ID
    inventory_item_id: Optional[strawberry.ID] = None
    usage_type: UsageTypeEnum
    logged_at: datetime
    quantity_used: int = 1
    context: Optional[UsageContextEnum] = None
    caregiver_name: Optional[str] = None
    was_wet: Optional[bool] = None
    was_soiled: Optional[bool] = None
    diaper_condition: Optional[str] = None
    had_leakage: Optional[bool] = None
    product_rating: Optional[int] = None
    time_since_last_change: Optional[int] = None
    change_duration: Optional[int] = None
    notes: Optional[str] = None
    health_notes: Optional[str] = None
    created_at: datetime


@strawberry.type
class DashboardStats:
    """Dashboard statistics for the home screen"""
    days_remaining: Optional[int]
    diapers_left: int
    last_change: Optional[str]
    today_changes: int
    current_size: Optional[str]


# =============================================================================
# Inventory Input Types
# =============================================================================

@strawberry.input
class CreateInventoryItemInput:
    """Create inventory item input"""
    child_id: strawberry.ID
    product_type: ProductTypeEnum
    brand: str
    product_name: Optional[str] = None
    size: str
    quantity_total: int
    cost_cad: Optional[float] = None
    expiry_date: Optional[datetime] = None
    storage_location: Optional[str] = None
    notes: Optional[str] = None


@strawberry.input
class LogDiaperChangeInput:
    """Log diaper change input"""
    child_id: strawberry.ID
    usage_type: UsageTypeEnum = UsageTypeEnum.DIAPER_CHANGE
    context: Optional[UsageContextEnum] = None
    caregiver_name: Optional[str] = None
    was_wet: Optional[bool] = None
    was_soiled: Optional[bool] = None
    diaper_condition: Optional[str] = None
    had_leakage: Optional[bool] = None
    notes: Optional[str] = None
    logged_at: Optional[datetime] = None


@strawberry.input
class UpdateInventoryItemInput:
    """Update inventory item input"""
    quantity_remaining: Optional[int] = None
    storage_location: Optional[str] = None
    notes: Optional[str] = None
    quality_rating: Optional[int] = None
    would_rebuy: Optional[bool] = None


# =============================================================================
# Inventory Response Types
# =============================================================================

@strawberry.type
class CreateInventoryItemResponse(MutationResponse):
    """Create inventory item response"""
    inventory_item: Optional[InventoryItem] = None


@strawberry.type
class LogDiaperChangeResponse(MutationResponse):
    """Log diaper change response"""
    usage_log: Optional[UsageLog] = None
    updated_inventory_items: Optional[List[InventoryItem]] = None


@strawberry.type
class UpdateInventoryItemResponse(MutationResponse):
    """Update inventory item response"""
    inventory_item: Optional[InventoryItem] = None


@strawberry.type
class InventoryItemEdge:
    """An edge in an inventory connection."""
    node: InventoryItem = strawberry.field(
        description="The item at the end of the edge."
    )
    cursor: str = strawberry.field(
        description="A cursor for use in pagination."
    )


@strawberry.type
class InventoryConnection:
    """A connection to a list of inventory items."""
    page_info: PageInfo = strawberry.field(
        description="Information to aid in pagination."
    )
    edges: List[InventoryItemEdge] = strawberry.field(
        description="A list of edges."
    )


@strawberry.type
class UsageLogEdge:
    """An edge in a usage log connection."""
    node: UsageLog = strawberry.field(
        description="The item at the end of the edge."
    )
    cursor: str = strawberry.field(
        description="A cursor for use in pagination."
    )


@strawberry.type
class UsageLogConnection:
    """A connection to a list of usage logs."""
    page_info: PageInfo = strawberry.field(
        description="Information to aid in pagination."
    )
    edges: List[UsageLogEdge] = strawberry.field(
        description="A list of edges."
    )


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
    "ProductTypeEnum",
    "UsageTypeEnum",
    "UsageContextEnum",
    
    # User Types
    "UserProfile",
    "UserSession",
    "AuthResponse", 
    "UserConsent",
    
    # Child Types
    "ChildProfile",
    "OnboardingWizardStep",
    
    # Inventory Types
    "InventoryItem",
    "UsageLog",
    "DashboardStats",
    
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
    "CreateInventoryItemInput",
    "LogDiaperChangeInput",
    "UpdateInventoryItemInput",
    
    # Response Types
    "MutationResponse",
    "CreateChildResponse",
    "UpdateChildResponse", 
    "UserProfileResponse",
    "OnboardingStatusResponse",
    "CreateInventoryItemResponse",
    "LogDiaperChangeResponse",
    "UpdateInventoryItemResponse",
    
    # Connection Types
    "PageInfo",
    "ChildEdge",
    "ChildConnection",
    "ConsentEdge",
    "ConsentConnection",
    "InventoryItemEdge",
    "InventoryConnection",
    "UsageLogEdge",
    "UsageLogConnection",
    
    # Error Types
    "ValidationError",
    "ErrorResponse"
]