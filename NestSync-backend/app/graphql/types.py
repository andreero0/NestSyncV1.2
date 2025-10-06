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


# =============================================================================
# Child Profile Cleanup Types
# =============================================================================

@strawberry.enum
class DeletionType(Enum):
    """Types of child profile deletion"""
    SOFT_DELETE = "soft_delete"
    HARD_DELETE = "hard_delete"


@strawberry.input
class DeleteChildInput:
    """Input for child profile deletion with options"""
    deletion_type: DeletionType = DeletionType.SOFT_DELETE
    confirmation_text: str
    reason: Optional[str] = None
    retain_audit_logs: bool = True


@strawberry.input
class RecreateChildProfileInput:
    """Input for recreating a child profile after deletion"""
    name: str
    date_of_birth: date
    gender: Optional[GenderType] = None
    current_diaper_size: DiaperSizeType
    current_weight_kg: Optional[float] = None
    current_height_cm: Optional[float] = None
    daily_usage_count: Optional[int] = None
    has_sensitive_skin: bool = False
    has_allergies: bool = False
    allergies_notes: Optional[str] = None
    special_needs: Optional[str] = None
    preferred_brands: Optional[List[str]] = None
    province: Optional[str] = None


@strawberry.type
class DeletionAuditInfo:
    """Audit information for data deletion (PIPEDA compliance)"""
    deleted_at: datetime
    deleted_by: str
    deletion_type: DeletionType
    reason: Optional[str] = None
    items_deleted_summary: str  # Changed from Dict[str, int] to string for GraphQL compatibility
    retention_period_days: Optional[int] = None


@strawberry.type
class DeleteChildResponse(MutationResponse):
    """Enhanced delete child response with audit information"""
    deleted_child_id: Optional[str] = None
    audit_info: Optional[DeletionAuditInfo] = None


@strawberry.type
class RecreateChildProfileResponse(MutationResponse):
    """Response for child profile recreation"""
    child: Optional[ChildProfile] = None
    previous_deletion_info: Optional[DeletionAuditInfo] = None
    data_integrity_verified: bool = False


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


@strawberry.input
class DeleteInventoryItemInput:
    """Delete inventory item input with safety confirmation"""
    confirmation_text: str  # Required confirmation text for safety
    reason: Optional[str] = None  # Optional reason for deletion


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
class DeleteInventoryItemResponse(MutationResponse):
    """Delete inventory item response"""
    deleted_item_id: Optional[str] = None


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
# Notification Types
# =============================================================================

@strawberry.enum
class NotificationPriorityType(Enum):
    """Notification priority levels"""
    CRITICAL = "critical"
    IMPORTANT = "important"
    OPTIONAL = "optional"


@strawberry.enum
class NotificationTypeEnum(Enum):
    """Types of notifications"""
    STOCK_ALERT = "stock_alert"
    DIAPER_CHANGE_REMINDER = "diaper_change_reminder"
    EXPIRY_WARNING = "expiry_warning"
    HEALTH_TIP = "health_tip"
    SYSTEM_UPDATE = "system_update"
    MARKETING = "marketing"


@strawberry.enum
class NotificationChannelEnum(Enum):
    """Notification delivery channels"""
    PUSH = "push"
    EMAIL = "email"
    SMS = "sms"
    IN_APP = "in_app"


@strawberry.enum
class NotificationStatusEnum(Enum):
    """Notification delivery status"""
    PENDING = "pending"
    SENT = "sent"
    DELIVERED = "delivered"
    FAILED = "failed"
    CANCELLED = "cancelled"


@strawberry.type
class DeviceToken:
    """Device token for push notifications"""
    device_token: str
    platform: str  # "ios", "android", "web"


@strawberry.type
class NotificationPreferences:
    """User notification preferences"""
    id: strawberry.ID
    user_id: strawberry.ID
    notifications_enabled: bool
    critical_notifications: bool
    important_notifications: bool
    optional_notifications: bool
    push_notifications: bool
    email_notifications: bool
    sms_notifications: bool
    quiet_hours_enabled: bool
    quiet_hours_start: Optional[str] = None  # Time as string "HH:MM"
    quiet_hours_end: Optional[str] = None    # Time as string "HH:MM"
    stock_alert_enabled: bool
    stock_alert_threshold: Optional[int] = None
    change_reminder_enabled: bool
    change_reminder_interval_hours: Optional[int] = None
    expiry_warning_enabled: bool
    expiry_warning_days: Optional[int] = None
    health_tips_enabled: bool
    marketing_enabled: bool
    device_tokens: List[DeviceToken]
    user_timezone: str
    daily_notification_limit: int
    notification_consent_granted: bool
    notification_consent_date: Optional[datetime] = None
    marketing_consent_granted: bool
    marketing_consent_date: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    # Add field aliases for frontend compatibility
    @strawberry.field(name="notificationsEnabled")
    def notifications_enabled_alias(self) -> bool:
        return self.notifications_enabled

    @strawberry.field(name="stockAlertEnabled")
    def stock_alert_enabled_alias(self) -> bool:
        return self.stock_alert_enabled

    @strawberry.field(name="changeReminderEnabled")
    def change_reminder_enabled_alias(self) -> bool:
        return self.change_reminder_enabled

    @strawberry.field(name="expiryWarningEnabled")
    def expiry_warning_enabled_alias(self) -> bool:
        return self.expiry_warning_enabled


@strawberry.type
class NotificationQueue:
    """Notification queue item"""
    id: strawberry.ID
    user_id: strawberry.ID
    child_id: Optional[strawberry.ID] = None
    notification_type: NotificationTypeEnum
    priority: NotificationPriorityType
    channels: List[NotificationChannelEnum]
    title: str
    message: str
    data_payload: Optional[str] = None  # JSON as string
    scheduled_for: datetime
    status: NotificationStatusEnum
    attempts: int
    max_attempts: int
    last_error: Optional[str] = None
    batch_id: Optional[strawberry.ID] = None
    created_at: datetime


@strawberry.type
class NotificationDeliveryLog:
    """Notification delivery audit log"""
    id: strawberry.ID
    user_id: strawberry.ID
    queue_item_id: Optional[strawberry.ID] = None
    preferences_id: Optional[strawberry.ID] = None
    notification_type: NotificationTypeEnum
    priority: NotificationPriorityType
    channel: NotificationChannelEnum
    title: str
    message: str
    delivery_status: NotificationStatusEnum
    sent_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    external_id: Optional[str] = None
    external_response: Optional[str] = None  # JSON as string
    error_code: Optional[str] = None
    error_message: Optional[str] = None
    processing_time_ms: Optional[int] = None
    data_retention_date: Optional[datetime] = None
    opened_at: Optional[datetime] = None
    clicked_at: Optional[datetime] = None
    dismissed_at: Optional[datetime] = None
    created_at: datetime


# =============================================================================
# Notification Input Types
# =============================================================================

@strawberry.input
class UpdateNotificationPreferencesInput:
    """Update notification preferences input"""
    notifications_enabled: Optional[bool] = None
    critical_notifications: Optional[bool] = None
    important_notifications: Optional[bool] = None
    optional_notifications: Optional[bool] = None
    push_notifications: Optional[bool] = None
    email_notifications: Optional[bool] = None
    sms_notifications: Optional[bool] = None
    quiet_hours_enabled: Optional[bool] = None
    quiet_hours_start: Optional[str] = None  # "HH:MM"
    quiet_hours_end: Optional[str] = None    # "HH:MM"
    stock_alert_enabled: Optional[bool] = None
    stock_alert_threshold: Optional[int] = None
    change_reminder_enabled: Optional[bool] = None
    change_reminder_interval_hours: Optional[int] = None
    expiry_warning_enabled: Optional[bool] = None
    expiry_warning_days: Optional[int] = None
    health_tips_enabled: Optional[bool] = None
    marketing_enabled: Optional[bool] = None
    user_timezone: Optional[str] = None
    daily_notification_limit: Optional[int] = None

    # CamelCase aliases for frontend compatibility
    notifications_enabled_alias: Optional[bool] = strawberry.field(name="notificationsEnabled", default=None)
    stock_alert_enabled_alias: Optional[bool] = strawberry.field(name="stockAlertEnabled", default=None)
    change_reminder_enabled_alias: Optional[bool] = strawberry.field(name="changeReminderEnabled", default=None)
    expiry_warning_enabled_alias: Optional[bool] = strawberry.field(name="expiryWarningEnabled", default=None)

    # PIPEDA consent updates
    notification_consent_granted: Optional[bool] = None
    marketing_consent_granted: Optional[bool] = None


@strawberry.input
class CreateNotificationInput:
    """Create notification input"""
    user_id: strawberry.ID
    child_id: Optional[strawberry.ID] = None
    notification_type: NotificationTypeEnum
    priority: NotificationPriorityType
    channels: List[NotificationChannelEnum]
    title: str
    message: str
    data_payload: Optional[str] = None  # JSON as string
    scheduled_for: Optional[datetime] = None


@strawberry.input
class RegisterDeviceTokenInput:
    """Register device token for push notifications"""
    device_token: str
    platform: str  # "ios", "android", "web"


# =============================================================================
# Notification Response Types
# =============================================================================

@strawberry.type
class UpdateNotificationPreferencesResponse(MutationResponse):
    """Update notification preferences response"""
    preferences: Optional[NotificationPreferences] = None


@strawberry.type
class CreateNotificationResponse(MutationResponse):
    """Create notification response"""
    notification: Optional[NotificationQueue] = None


@strawberry.type
class RegisterDeviceTokenResponse(MutationResponse):
    """Register device token response"""
    preferences: Optional[NotificationPreferences] = None


@strawberry.type
class TestNotificationResponse(MutationResponse):
    """Test notification response"""
    test_sent: bool = False
    delivery_log: Optional[NotificationDeliveryLog] = None


# =============================================================================
# Notification Connection Types
# =============================================================================

@strawberry.type
class NotificationQueueEdge:
    """An edge in a notification queue connection."""
    node: NotificationQueue = strawberry.field(
        description="The item at the end of the edge."
    )
    cursor: str = strawberry.field(
        description="A cursor for use in pagination."
    )


@strawberry.type
class NotificationQueueConnection:
    """A connection to a list of notification queue items."""
    page_info: PageInfo = strawberry.field(
        description="Information to aid in pagination."
    )
    edges: List[NotificationQueueEdge] = strawberry.field(
        description="A list of edges."
    )


@strawberry.type
class NotificationDeliveryLogEdge:
    """An edge in a notification delivery log connection."""
    node: NotificationDeliveryLog = strawberry.field(
        description="The item at the end of the edge."
    )
    cursor: str = strawberry.field(
        description="A cursor for use in pagination."
    )


@strawberry.type
class NotificationDeliveryLogConnection:
    """A connection to a list of notification delivery logs."""
    page_info: PageInfo = strawberry.field(
        description="Information to aid in pagination."
    )
    edges: List[NotificationDeliveryLogEdge] = strawberry.field(
        description="A list of edges."
    )


# =============================================================================
# PIPEDA Data Subject Rights Types
# =============================================================================

@strawberry.input
class ExportUserDataInput:
    """Input for PIPEDA-compliant data export"""
    format: str = "json"  # Future: support CSV, XML
    include_deleted: bool = False  # Include soft-deleted records


@strawberry.type
class ExportUserDataResponse(MutationResponse):
    """Response for user data export (PIPEDA right to data portability)"""
    export_url: Optional[str] = None
    export_data: Optional[str] = None  # JSON string until S3 is configured
    export_size_bytes: Optional[int] = None
    expires_at: Optional[datetime] = None


@strawberry.input
class DeleteUserAccountInput:
    """Input for PIPEDA-compliant account deletion"""
    confirmation_text: str  # Must be "DELETE my account"
    password: str  # Re-verify password for security
    reason: Optional[str] = None


@strawberry.type
class DeleteUserAccountResponse(MutationResponse):
    """Response for account deletion (PIPEDA right to erasure)"""
    deletion_scheduled_at: Optional[datetime] = None
    data_retention_period_days: int = 30  # PIPEDA compliance


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
    "DeletionType",
    "NotificationPriorityType",
    "NotificationTypeEnum",
    "NotificationChannelEnum",
    "NotificationStatusEnum",

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

    # Notification Types
    "DeviceToken",
    "NotificationPreferences",
    "NotificationQueue",
    "NotificationDeliveryLog",

    # Input Types
    "SignUpInput",
    "SignInInput",
    "UpdateProfileInput",
    "ChangePasswordInput",
    "ResetPasswordInput",
    "ConsentUpdateInput",
    "CreateChildInput",
    "UpdateChildInput",
    "DeleteChildInput",
    "RecreateChildProfileInput",
    "OnboardingWizardStepInput",
    "InitialInventoryInput",
    "CreateInventoryItemInput",
    "LogDiaperChangeInput",
    "UpdateInventoryItemInput",
    "DeleteInventoryItemInput",
    "UpdateNotificationPreferencesInput",
    "CreateNotificationInput",
    "RegisterDeviceTokenInput",

    # Response Types
    "MutationResponse",
    "CreateChildResponse",
    "UpdateChildResponse",
    "DeleteChildResponse",
    "RecreateChildProfileResponse",
    "DeletionAuditInfo",
    "UserProfileResponse",
    "OnboardingStatusResponse",
    "CreateInventoryItemResponse",
    "LogDiaperChangeResponse",
    "UpdateInventoryItemResponse",
    "DeleteInventoryItemResponse",
    "UpdateNotificationPreferencesResponse",
    "CreateNotificationResponse",
    "RegisterDeviceTokenResponse",
    "TestNotificationResponse",

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
    "NotificationQueueEdge",
    "NotificationQueueConnection",
    "NotificationDeliveryLogEdge",
    "NotificationDeliveryLogConnection",

    # Error Types
    "ValidationError",
    "ErrorResponse",

    # PIPEDA Data Subject Rights Types
    "ExportUserDataInput",
    "ExportUserDataResponse",
    "DeleteUserAccountInput",
    "DeleteUserAccountResponse"
]