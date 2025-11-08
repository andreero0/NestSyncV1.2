# NestSync Notification System Architecture

**Project**: NestSync v1.2 - Canadian Diaper Planning Application
**Component**: Push Notifications & Inventory Threshold Management
**Date**: September 13, 2025
**Architecture Phase**: Technical Specifications & Implementation Blueprint

## Executive Summary

### System Overview
This architecture defines a comprehensive notification system for NestSync that integrates push notifications with inventory management, multi-caregiver coordination, and Canadian PIPEDA compliance. The system provides intelligent diaper stock alerts, quiet hours management, and granular notification preferences while maintaining data sovereignty and audit trails.

### Key Architectural Decisions
- **Database Design**: 5 new tables following existing BaseModel patterns with PIPEDA compliance
- **Push Notification Service**: Expo Notifications with proper token management and multi-platform support
- **Inventory Integration**: Smart threshold-based alerts using existing inventory models
- **Multi-Caregiver Support**: Permission-based notification coordination through child relationships
- **Compliance Framework**: Canadian data residency with comprehensive audit trails

### Technology Stack Integration
- **Backend**: FastAPI + Strawberry GraphQL following existing async patterns
- **Database**: Supabase PostgreSQL with existing BaseModel architecture
- **Frontend**: React Native + Expo SDK ~53 with proper cross-platform handling
- **Push Service**: Expo Push Notifications with secure token management

## Database Schema Architecture

### 1. User Device Tokens Management

#### Table: `device_tokens`
```sql
CREATE TABLE device_tokens (
    -- BaseModel fields (id, created_at, updated_at, deleted_at, etc.)
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    deleted_by UUID REFERENCES users(id),

    -- User relationship
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Device information
    device_id VARCHAR(255) NOT NULL,
    device_name VARCHAR(255) NULL,
    device_platform VARCHAR(50) NOT NULL, -- 'ios', 'android', 'web'
    device_model VARCHAR(255) NULL,

    -- Push token data
    expo_push_token TEXT NOT NULL,
    native_push_token TEXT NULL, -- FCM/APNs token for direct sending
    project_id VARCHAR(255) NOT NULL, -- Expo project ID

    -- Token metadata
    token_status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'expired', 'revoked'
    last_used_at TIMESTAMPTZ NULL,
    expires_at TIMESTAMPTZ NULL,
    token_version VARCHAR(50) NULL,

    -- App information
    app_version VARCHAR(50) NULL,
    expo_sdk_version VARCHAR(50) NULL,
    build_number VARCHAR(50) NULL,

    -- PIPEDA compliance
    consent_granted_at TIMESTAMPTZ NULL,
    consent_withdrawn_at TIMESTAMPTZ NULL,
    consent_ip_address INET NULL,
    consent_user_agent TEXT NULL,
    retention_date TIMESTAMPTZ NULL,

    CONSTRAINT uk_device_tokens_user_device UNIQUE (user_id, device_id),
    CONSTRAINT ck_device_tokens_platform CHECK (device_platform IN ('ios', 'android', 'web')),
    CONSTRAINT ck_device_tokens_status CHECK (token_status IN ('active', 'expired', 'revoked'))
);

CREATE INDEX idx_device_tokens_user ON device_tokens(user_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_device_tokens_platform ON device_tokens(device_platform) WHERE is_deleted = FALSE;
CREATE INDEX idx_device_tokens_status ON device_tokens(token_status) WHERE is_deleted = FALSE;
CREATE INDEX idx_device_tokens_expires ON device_tokens(expires_at) WHERE expires_at IS NOT NULL;
```

### 2. Notification Preferences Management

#### Table: `notification_preferences`
```sql
CREATE TYPE notification_type AS ENUM (
    'low_stock_alert',
    'critical_stock_alert',
    'expiry_warning',
    'diaper_change_reminder',
    'inventory_summary',
    'caregiver_activity',
    'system_updates',
    'tips_and_insights'
);

CREATE TYPE notification_frequency AS ENUM (
    'immediate',
    'hourly',
    'twice_daily',
    'daily',
    'weekly',
    'disabled'
);

CREATE TYPE notification_channel AS ENUM (
    'push_notification',
    'email',
    'sms',
    'in_app'
);

CREATE TABLE notification_preferences (
    -- BaseModel fields
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),

    -- User relationship
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    child_id UUID NULL REFERENCES children(id) ON DELETE CASCADE, -- Child-specific preferences

    -- Notification configuration
    notification_type notification_type NOT NULL,
    frequency notification_frequency NOT NULL DEFAULT 'immediate',
    channels notification_channel[] NOT NULL DEFAULT ARRAY['push_notification'],

    -- Preference details
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    threshold_value INTEGER NULL, -- For stock alerts (e.g., alert when <= 5 diapers)
    advance_days INTEGER NULL, -- For expiry warnings (e.g., 7 days before expiry)

    -- Timing preferences
    respect_quiet_hours BOOLEAN NOT NULL DEFAULT TRUE,
    delivery_timezone VARCHAR(50) NOT NULL DEFAULT 'America/Toronto',
    preferred_delivery_hours INTEGER[] NULL, -- Array of hours (0-23) when notifications are preferred

    -- PIPEDA compliance
    consent_granted_at TIMESTAMPTZ NULL,
    consent_withdrawn_at TIMESTAMPTZ NULL,
    consent_version VARCHAR(50) NULL,

    CONSTRAINT uk_notification_prefs_user_child_type UNIQUE (user_id, child_id, notification_type),
    CONSTRAINT ck_notification_prefs_threshold CHECK (threshold_value IS NULL OR threshold_value >= 0),
    CONSTRAINT ck_notification_prefs_advance_days CHECK (advance_days IS NULL OR advance_days >= 0)
);

CREATE INDEX idx_notification_prefs_user ON notification_preferences(user_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_notification_prefs_child ON notification_preferences(child_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_notification_prefs_type ON notification_preferences(notification_type) WHERE is_deleted = FALSE;
CREATE INDEX idx_notification_prefs_enabled ON notification_preferences(is_enabled) WHERE is_deleted = FALSE;
```

### 3. Quiet Hours Configuration

#### Table: `quiet_hours`
```sql
CREATE TYPE day_of_week AS ENUM (
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
);

CREATE TABLE quiet_hours (
    -- BaseModel fields
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,

    -- User relationship
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Schedule configuration
    days_of_week day_of_week[] NOT NULL DEFAULT ARRAY['monday','tuesday','wednesday','thursday','friday','saturday','sunday'],
    start_time TIME NOT NULL DEFAULT '22:00', -- 10 PM
    end_time TIME NOT NULL DEFAULT '07:00', -- 7 AM
    timezone VARCHAR(50) NOT NULL DEFAULT 'America/Toronto',

    -- Emergency override settings
    allow_critical_alerts BOOLEAN NOT NULL DEFAULT TRUE,
    critical_types notification_type[] NOT NULL DEFAULT ARRAY['critical_stock_alert'],

    -- Schedule metadata
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    description TEXT NULL,

    CONSTRAINT ck_quiet_hours_time_range CHECK (start_time != end_time)
);

CREATE INDEX idx_quiet_hours_user ON quiet_hours(user_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_quiet_hours_active ON quiet_hours(is_active) WHERE is_deleted = FALSE;
```

### 4. Caregiver Notification Permissions

#### Table: `caregiver_notification_permissions`
```sql
CREATE TYPE caregiver_role AS ENUM (
    'primary_parent',
    'partner',
    'grandparent',
    'babysitter',
    'daycare_provider',
    'other'
);

CREATE TABLE caregiver_notification_permissions (
    -- BaseModel fields
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,

    -- Relationships
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    caregiver_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    granted_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Permission configuration
    caregiver_role caregiver_role NOT NULL DEFAULT 'other',
    notification_types notification_type[] NOT NULL DEFAULT ARRAY['low_stock_alert', 'critical_stock_alert'],

    -- Permission status
    permission_status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'active', 'suspended', 'revoked'
    granted_at TIMESTAMPTZ NULL,
    revoked_at TIMESTAMPTZ NULL,

    -- Coordination settings
    can_acknowledge_alerts BOOLEAN NOT NULL DEFAULT FALSE,
    can_modify_inventory BOOLEAN NOT NULL DEFAULT FALSE,
    priority_level INTEGER NOT NULL DEFAULT 2, -- 1=highest, 5=lowest

    -- Emergency contact
    is_emergency_contact BOOLEAN NOT NULL DEFAULT FALSE,
    emergency_phone VARCHAR(20) NULL,

    CONSTRAINT uk_caregiver_permissions_child_user UNIQUE (child_id, caregiver_user_id),
    CONSTRAINT ck_caregiver_permissions_status CHECK (permission_status IN ('pending', 'active', 'suspended', 'revoked')),
    CONSTRAINT ck_caregiver_permissions_priority CHECK (priority_level BETWEEN 1 AND 5)
);

CREATE INDEX idx_caregiver_permissions_child ON caregiver_notification_permissions(child_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_caregiver_permissions_caregiver ON caregiver_notification_permissions(caregiver_user_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_caregiver_permissions_status ON caregiver_notification_permissions(permission_status) WHERE is_deleted = FALSE;
```

### 5. Notification Audit Trail

#### Table: `notification_logs`
```sql
CREATE TYPE notification_status AS ENUM (
    'queued',
    'sent',
    'delivered',
    'failed',
    'acknowledged',
    'expired',
    'suppressed'
);

CREATE TABLE notification_logs (
    -- BaseModel fields
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,

    -- Relationships
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    child_id UUID NULL REFERENCES children(id) ON DELETE CASCADE,
    device_token_id UUID NULL REFERENCES device_tokens(id) ON DELETE SET NULL,
    inventory_item_id UUID NULL REFERENCES inventory_items(id) ON DELETE SET NULL,

    -- Notification details
    notification_type notification_type NOT NULL,
    channel notification_channel NOT NULL,
    status notification_status NOT NULL DEFAULT 'queued',

    -- Message content
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data_payload JSONB NULL,

    -- Delivery tracking
    scheduled_for TIMESTAMPTZ NULL,
    sent_at TIMESTAMPTZ NULL,
    delivered_at TIMESTAMPTZ NULL,
    acknowledged_at TIMESTAMPTZ NULL,
    failed_at TIMESTAMPTZ NULL,
    expires_at TIMESTAMPTZ NULL,

    -- External service tracking
    expo_ticket_id VARCHAR(255) NULL,
    expo_receipt_id VARCHAR(255) NULL,
    external_message_id VARCHAR(255) NULL,

    -- Failure details
    failure_reason TEXT NULL,
    retry_count INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 3,

    -- PIPEDA compliance
    retention_date TIMESTAMPTZ NULL,
    retention_reason TEXT NULL,

    CONSTRAINT ck_notification_logs_retry CHECK (retry_count <= max_retries)
);

CREATE INDEX idx_notification_logs_user ON notification_logs(user_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_notification_logs_status ON notification_logs(status) WHERE is_deleted = FALSE;
CREATE INDEX idx_notification_logs_type ON notification_logs(notification_type) WHERE is_deleted = FALSE;
CREATE INDEX idx_notification_logs_scheduled ON notification_logs(scheduled_for) WHERE scheduled_for IS NOT NULL;
CREATE INDEX idx_notification_logs_sent ON notification_logs(sent_at) WHERE sent_at IS NOT NULL;
CREATE INDEX idx_notification_logs_expires ON notification_logs(expires_at) WHERE expires_at IS NOT NULL;
```

## GraphQL Schema Architecture

### 1. GraphQL Types

```python
# app/graphql/notification_types.py
import strawberry
from typing import Optional, List
from datetime import datetime, time
from enum import Enum

@strawberry.enum
class NotificationType(Enum):
    LOW_STOCK_ALERT = "low_stock_alert"
    CRITICAL_STOCK_ALERT = "critical_stock_alert"
    EXPIRY_WARNING = "expiry_warning"
    DIAPER_CHANGE_REMINDER = "diaper_change_reminder"
    INVENTORY_SUMMARY = "inventory_summary"
    CAREGIVER_ACTIVITY = "caregiver_activity"
    SYSTEM_UPDATES = "system_updates"
    TIPS_AND_INSIGHTS = "tips_and_insights"

@strawberry.enum
class NotificationFrequency(Enum):
    IMMEDIATE = "immediate"
    HOURLY = "hourly"
    TWICE_DAILY = "twice_daily"
    DAILY = "daily"
    WEEKLY = "weekly"
    DISABLED = "disabled"

@strawberry.enum
class NotificationChannel(Enum):
    PUSH_NOTIFICATION = "push_notification"
    EMAIL = "email"
    SMS = "sms"
    IN_APP = "in_app"

@strawberry.enum
class DevicePlatform(Enum):
    IOS = "ios"
    ANDROID = "android"
    WEB = "web"

@strawberry.enum
class CaregiverRole(Enum):
    PRIMARY_PARENT = "primary_parent"
    PARTNER = "partner"
    GRANDPARENT = "grandparent"
    BABYSITTER = "babysitter"
    DAYCARE_PROVIDER = "daycare_provider"
    OTHER = "other"

@strawberry.type
class DeviceToken:
    id: strawberry.ID
    device_id: str
    device_name: Optional[str]
    device_platform: DevicePlatform
    device_model: Optional[str]
    expo_push_token: str
    token_status: str
    last_used_at: Optional[datetime]
    app_version: Optional[str]
    created_at: datetime
    updated_at: datetime

@strawberry.type
class NotificationPreference:
    id: strawberry.ID
    user_id: strawberry.ID
    child_id: Optional[strawberry.ID]
    notification_type: NotificationType
    frequency: NotificationFrequency
    channels: List[NotificationChannel]
    is_enabled: bool
    threshold_value: Optional[int]
    advance_days: Optional[int]
    respect_quiet_hours: bool
    delivery_timezone: str
    preferred_delivery_hours: Optional[List[int]]
    created_at: datetime
    updated_at: datetime

@strawberry.type
class QuietHours:
    id: strawberry.ID
    user_id: strawberry.ID
    days_of_week: List[str]
    start_time: time
    end_time: time
    timezone: str
    allow_critical_alerts: bool
    critical_types: List[NotificationType]
    is_active: bool
    description: Optional[str]
    created_at: datetime
    updated_at: datetime

@strawberry.type
class CaregiverNotificationPermission:
    id: strawberry.ID
    child_id: strawberry.ID
    caregiver_user_id: strawberry.ID
    caregiver_role: CaregiverRole
    notification_types: List[NotificationType]
    permission_status: str
    granted_at: Optional[datetime]
    can_acknowledge_alerts: bool
    can_modify_inventory: bool
    priority_level: int
    is_emergency_contact: bool
    emergency_phone: Optional[str]
    created_at: datetime

@strawberry.type
class NotificationLog:
    id: strawberry.ID
    user_id: strawberry.ID
    child_id: Optional[strawberry.ID]
    notification_type: NotificationType
    channel: NotificationChannel
    status: str
    title: str
    message: str
    scheduled_for: Optional[datetime]
    sent_at: Optional[datetime]
    delivered_at: Optional[datetime]
    acknowledged_at: Optional[datetime]
    failed_at: Optional[datetime]
    failure_reason: Optional[str]
    retry_count: int
    created_at: datetime
```

### 2. Input Types

```python
@strawberry.input
class RegisterDeviceTokenInput:
    device_id: str
    device_name: Optional[str] = None
    device_platform: DevicePlatform
    device_model: Optional[str] = None
    expo_push_token: str
    native_push_token: Optional[str] = None
    project_id: str
    app_version: Optional[str] = None
    expo_sdk_version: Optional[str] = None
    build_number: Optional[str] = None

@strawberry.input
class UpdateNotificationPreferenceInput:
    child_id: Optional[strawberry.ID] = None
    notification_type: NotificationType
    frequency: NotificationFrequency
    channels: List[NotificationChannel]
    is_enabled: bool
    threshold_value: Optional[int] = None
    advance_days: Optional[int] = None
    respect_quiet_hours: bool = True
    preferred_delivery_hours: Optional[List[int]] = None

@strawberry.input
class UpdateQuietHoursInput:
    days_of_week: List[str]
    start_time: time
    end_time: time
    timezone: str = "America/Toronto"
    allow_critical_alerts: bool = True
    critical_types: List[NotificationType] = strawberry.field(default_factory=lambda: [NotificationType.CRITICAL_STOCK_ALERT])
    is_active: bool = True
    description: Optional[str] = None

@strawberry.input
class GrantCaregiverPermissionInput:
    child_id: strawberry.ID
    caregiver_user_id: strawberry.ID
    caregiver_role: CaregiverRole
    notification_types: List[NotificationType]
    can_acknowledge_alerts: bool = False
    can_modify_inventory: bool = False
    priority_level: int = 2
    is_emergency_contact: bool = False
    emergency_phone: Optional[str] = None

@strawberry.input
class SendTestNotificationInput:
    notification_type: NotificationType
    child_id: Optional[strawberry.ID] = None
    device_platform: Optional[DevicePlatform] = None
```

### 3. Response Types

```python
@strawberry.type
class RegisterDeviceTokenResponse:
    success: bool
    message: str
    device_token: Optional[DeviceToken] = None
    errors: Optional[List[str]] = None

@strawberry.type
class NotificationPreferenceResponse:
    success: bool
    message: str
    preference: Optional[NotificationPreference] = None
    errors: Optional[List[str]] = None

@strawberry.type
class QuietHoursResponse:
    success: bool
    message: str
    quiet_hours: Optional[QuietHours] = None
    errors: Optional[List[str]] = None

@strawberry.type
class CaregiverPermissionResponse:
    success: bool
    message: str
    permission: Optional[CaregiverNotificationPermission] = None
    errors: Optional[List[str]] = None

@strawberry.type
class SendNotificationResponse:
    success: bool
    message: str
    notification_id: Optional[strawberry.ID] = None
    expo_ticket_id: Optional[str] = None
    errors: Optional[List[str]] = None

@strawberry.type
class NotificationStatsResponse:
    total_notifications: int
    delivered_notifications: int
    failed_notifications: int
    pending_notifications: int
    delivery_rate: float
    average_delivery_time: Optional[float] = None
```

### 4. GraphQL Resolvers Structure

```python
# app/graphql/notification_resolvers.py
import strawberry
from typing import List, Optional
from strawberry.types import Info
from app.config.database import get_async_session
from app.models.notification import (
    DeviceToken, NotificationPreference, QuietHours,
    CaregiverNotificationPermission, NotificationLog
)

@strawberry.type
class NotificationQueries:

    @strawberry.field
    async def my_device_tokens(self, info: Info) -> List[DeviceToken]:
        """Get all active device tokens for the current user"""
        # Implementation using async for session in get_async_session()

    @strawberry.field
    async def my_notification_preferences(
        self,
        info: Info,
        child_id: Optional[strawberry.ID] = None
    ) -> List[NotificationPreference]:
        """Get notification preferences for user or specific child"""
        # Implementation

    @strawberry.field
    async def my_quiet_hours(self, info: Info) -> List[QuietHours]:
        """Get quiet hours configuration for current user"""
        # Implementation

    @strawberry.field
    async def caregiver_permissions(
        self,
        info: Info,
        child_id: strawberry.ID
    ) -> List[CaregiverNotificationPermission]:
        """Get caregiver permissions for a specific child"""
        # Implementation

    @strawberry.field
    async def notification_logs(
        self,
        info: Info,
        child_id: Optional[strawberry.ID] = None,
        notification_type: Optional[NotificationType] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[NotificationLog]:
        """Get notification history with filtering"""
        # Implementation

@strawberry.type
class NotificationMutations:

    @strawberry.mutation
    async def register_device_token(
        self,
        info: Info,
        input: RegisterDeviceTokenInput
    ) -> RegisterDeviceTokenResponse:
        """Register or update device push token"""
        try:
            async for session in get_async_session():
                # Implementation following existing patterns
                pass
        except Exception as e:
            return RegisterDeviceTokenResponse(
                success=False,
                message=f"Failed to register device token: {str(e)}",
                errors=[str(e)]
            )

    @strawberry.mutation
    async def update_notification_preference(
        self,
        info: Info,
        input: UpdateNotificationPreferenceInput
    ) -> NotificationPreferenceResponse:
        """Update or create notification preference"""
        # Implementation

    @strawberry.mutation
    async def update_quiet_hours(
        self,
        info: Info,
        input: UpdateQuietHoursInput
    ) -> QuietHoursResponse:
        """Update quiet hours configuration"""
        # Implementation

    @strawberry.mutation
    async def grant_caregiver_permission(
        self,
        info: Info,
        input: GrantCaregiverPermissionInput
    ) -> CaregiverPermissionResponse:
        """Grant notification permissions to a caregiver"""
        # Implementation

    @strawberry.mutation
    async def revoke_caregiver_permission(
        self,
        info: Info,
        permission_id: strawberry.ID
    ) -> CaregiverPermissionResponse:
        """Revoke caregiver notification permissions"""
        # Implementation

    @strawberry.mutation
    async def send_test_notification(
        self,
        info: Info,
        input: SendTestNotificationInput
    ) -> SendNotificationResponse:
        """Send a test notification"""
        # Implementation

    @strawberry.mutation
    async def acknowledge_notification(
        self,
        info: Info,
        notification_id: strawberry.ID
    ) -> MutationResponse:
        """Acknowledge a notification (for caregivers)"""
        # Implementation
```

## Notification Service Architecture

### 1. Core Notification Service

```python
# app/services/notification_service.py
import asyncio
from typing import List, Dict, Optional, Any
from datetime import datetime, timezone, time
from enum import Enum
import json

from app.config.database import get_async_session
from app.models.notification import (
    DeviceToken, NotificationPreference, QuietHours,
    CaregiverNotificationPermission, NotificationLog
)
from app.services.expo_push_service import ExpoPushService
from app.services.inventory_service import InventoryService

class NotificationPriority(Enum):
    LOW = 1
    NORMAL = 2
    HIGH = 3
    CRITICAL = 4

class NotificationService:
    def __init__(self):
        self.expo_service = ExpoPushService()
        self.inventory_service = InventoryService()

    async def send_inventory_threshold_notification(
        self,
        inventory_item_id: str,
        threshold_type: str,
        additional_data: Optional[Dict[str, Any]] = None
    ) -> List[str]:
        """
        Send threshold-based notifications for inventory items
        Returns list of notification IDs
        """
        async for session in get_async_session():
            # Get inventory item details
            inventory_item = await self.inventory_service.get_item_by_id(
                session, inventory_item_id
            )

            if not inventory_item:
                return []

            # Get notification preferences for this child and type
            notification_type = self._map_threshold_to_notification_type(threshold_type)
            preferences = await self._get_notification_preferences(
                session, inventory_item.child_id, notification_type
            )

            # Get all caregivers with permissions for this notification type
            caregivers = await self._get_authorized_caregivers(
                session, inventory_item.child_id, notification_type
            )

            notification_ids = []

            for caregiver in caregivers:
                # Check quiet hours for each caregiver
                if not await self._should_send_now(
                    session, caregiver.user_id, notification_type
                ):
                    # Schedule for later
                    scheduled_time = await self._calculate_next_delivery_time(
                        session, caregiver.user_id
                    )
                    notification_ids.append(
                        await self._schedule_notification(
                            session, caregiver.user_id, inventory_item,
                            notification_type, scheduled_time
                        )
                    )
                    continue

                # Send immediate notification
                notification_ids.append(
                    await self._send_immediate_notification(
                        session, caregiver.user_id, inventory_item,
                        notification_type, additional_data
                    )
                )

            return notification_ids

    async def process_inventory_thresholds(self) -> Dict[str, int]:
        """
        Background task to check all inventory items for threshold breaches
        Returns count of notifications sent by type
        """
        notification_counts = {
            'low_stock': 0,
            'critical_stock': 0,
            'expiry_warning': 0
        }

        async for session in get_async_session():
            # Get all active inventory items
            inventory_items = await self.inventory_service.get_items_for_threshold_check(
                session
            )

            for item in inventory_items:
                # Check low stock threshold
                if await self._check_low_stock_threshold(session, item):
                    notification_ids = await self.send_inventory_threshold_notification(
                        item.id, 'low_stock'
                    )
                    notification_counts['low_stock'] += len(notification_ids)

                # Check critical stock threshold
                if await self._check_critical_stock_threshold(session, item):
                    notification_ids = await self.send_inventory_threshold_notification(
                        item.id, 'critical_stock'
                    )
                    notification_counts['critical_stock'] += len(notification_ids)

                # Check expiry warning threshold
                if await self._check_expiry_threshold(session, item):
                    notification_ids = await self.send_inventory_threshold_notification(
                        item.id, 'expiry_warning'
                    )
                    notification_counts['expiry_warning'] += len(notification_ids)

            return notification_counts

    async def coordinate_multi_caregiver_notification(
        self,
        child_id: str,
        notification_type: str,
        priority: NotificationPriority = NotificationPriority.NORMAL
    ) -> Dict[str, Any]:
        """
        Coordinate notifications among multiple caregivers based on:
        - Priority levels
        - Response time expectations
        - Acknowledgment requirements
        """
        async for session in get_async_session():
            caregivers = await self._get_authorized_caregivers(
                session, child_id, notification_type
            )

            # Sort by priority level (1 = highest priority)
            caregivers.sort(key=lambda c: c.priority_level)

            coordination_result = {
                'notifications_sent': 0,
                'primary_caregivers_notified': 0,
                'backup_caregivers_notified': 0,
                'acknowledgment_required': False
            }

            # Send to primary caregivers first (priority 1-2)
            primary_caregivers = [c for c in caregivers if c.priority_level <= 2]

            for caregiver in primary_caregivers:
                notification_id = await self._send_immediate_notification(
                    session, caregiver.caregiver_user_id, None,
                    notification_type, {'requires_acknowledgment': True}
                )
                if notification_id:
                    coordination_result['notifications_sent'] += 1
                    coordination_result['primary_caregivers_notified'] += 1

            # For critical notifications, also notify backup caregivers
            if priority == NotificationPriority.CRITICAL:
                backup_caregivers = [c for c in caregivers if c.priority_level > 2]

                for caregiver in backup_caregivers:
                    notification_id = await self._send_immediate_notification(
                        session, caregiver.caregiver_user_id, None,
                        notification_type, {'backup_caregiver': True}
                    )
                    if notification_id:
                        coordination_result['backup_caregivers_notified'] += 1

            coordination_result['acknowledgment_required'] = priority.value >= 3

            return coordination_result

    async def _check_low_stock_threshold(
        self,
        session,
        inventory_item
    ) -> bool:
        """Check if item meets low stock threshold criteria"""
        # Get user preferences for this notification type
        preferences = await self._get_notification_preferences(
            session, inventory_item.child_id, 'low_stock_alert'
        )

        if not preferences or not preferences.is_enabled:
            return False

        threshold = preferences.threshold_value or 5  # Default threshold

        # Check if we haven't notified recently
        if inventory_item.low_stock_notified_at:
            hours_since_last = (
                datetime.now(timezone.utc) - inventory_item.low_stock_notified_at
            ).total_seconds() / 3600

            # Don't spam - wait at least based on frequency setting
            min_hours = self._get_min_hours_between_notifications(preferences.frequency)
            if hours_since_last < min_hours:
                return False

        return inventory_item.quantity_remaining <= threshold

    async def _check_critical_stock_threshold(
        self,
        session,
        inventory_item
    ) -> bool:
        """Check if item meets critical stock threshold criteria"""
        # Similar logic but for critical thresholds (typically lower numbers)
        preferences = await self._get_notification_preferences(
            session, inventory_item.child_id, 'critical_stock_alert'
        )

        if not preferences or not preferences.is_enabled:
            return False

        threshold = preferences.threshold_value or 2  # More urgent threshold
        return inventory_item.quantity_remaining <= threshold

    async def _check_expiry_threshold(
        self,
        session,
        inventory_item
    ) -> bool:
        """Check if item is approaching expiry"""
        if not inventory_item.expiry_date:
            return False

        preferences = await self._get_notification_preferences(
            session, inventory_item.child_id, 'expiry_warning'
        )

        if not preferences or not preferences.is_enabled:
            return False

        advance_days = preferences.advance_days or 7  # Default 7 days warning

        # Check if we haven't notified recently
        if inventory_item.expiry_notified_at:
            hours_since_last = (
                datetime.now(timezone.utc) - inventory_item.expiry_notified_at
            ).total_seconds() / 3600

            if hours_since_last < 24:  # Max once per day for expiry warnings
                return False

        days_until_expiry = (
            inventory_item.expiry_date - datetime.now(timezone.utc)
        ).days

        return days_until_expiry <= advance_days and days_until_expiry >= 0

    async def _should_send_now(
        self,
        session,
        user_id: str,
        notification_type: str
    ) -> bool:
        """Check if notification should be sent now based on quiet hours"""
        quiet_hours = await self._get_active_quiet_hours(session, user_id)

        if not quiet_hours:
            return True

        # Check if notification type is allowed during quiet hours
        if (notification_type in ['critical_stock_alert'] and
            quiet_hours.allow_critical_alerts):
            return True

        # Check current time against quiet hours
        user_now = datetime.now(timezone.utc)  # Convert to user timezone
        current_time = user_now.time()

        # Handle quiet hours that span midnight
        if quiet_hours.start_time > quiet_hours.end_time:
            # e.g., 22:00 to 07:00
            return not (current_time >= quiet_hours.start_time or
                       current_time <= quiet_hours.end_time)
        else:
            # e.g., 13:00 to 14:00 (afternoon quiet time)
            return not (quiet_hours.start_time <= current_time <= quiet_hours.end_time)
```

### 2. Expo Push Service Integration

```python
# app/services/expo_push_service.py
import asyncio
import json
from typing import List, Dict, Optional, Any
from datetime import datetime, timezone
import aiohttp
import logging

from app.config.settings import settings
from app.models.notification import DeviceToken, NotificationLog

logger = logging.getLogger(__name__)

class ExpoPushService:
    def __init__(self):
        self.expo_push_url = "https://exp.host/--/api/v2/push/send"
        self.expo_receipt_url = "https://exp.host/--/api/v2/push/getReceipts"
        self.access_token = settings.EXPO_ACCESS_TOKEN

    async def send_push_notification(
        self,
        device_tokens: List[str],
        title: str,
        body: str,
        data: Optional[Dict[str, Any]] = None,
        sound: str = "default",
        badge: Optional[int] = None,
        priority: str = "default"  # 'default', 'normal', 'high'
    ) -> List[Dict[str, Any]]:
        """
        Send push notifications to multiple device tokens
        Returns list of ticket responses from Expo
        """
        if not device_tokens:
            return []

        # Prepare notification messages
        messages = []
        for token in device_tokens:
            message = {
                "to": token,
                "title": title,
                "body": body,
                "sound": sound,
                "priority": priority,
                "data": data or {}
            }

            if badge is not None:
                message["badge"] = badge

            messages.append(message)

        # Send in batches (Expo recommends max 100 per batch)
        batch_size = 100
        all_tickets = []

        for i in range(0, len(messages), batch_size):
            batch = messages[i:i + batch_size]
            tickets = await self._send_batch(batch)
            all_tickets.extend(tickets)

        return all_tickets

    async def _send_batch(
        self,
        messages: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Send a batch of messages to Expo push service"""
        headers = {
            "Accept": "application/json",
            "Accept-encoding": "gzip, deflate",
            "Content-Type": "application/json"
        }

        if self.access_token:
            headers["Authorization"] = f"Bearer {self.access_token}"

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    self.expo_push_url,
                    headers=headers,
                    json=messages,
                    timeout=aiohttp.ClientTimeout(total=30)
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        return result.get("data", [])
                    else:
                        error_text = await response.text()
                        logger.error(f"Expo push failed: {response.status} - {error_text}")
                        return []

        except Exception as e:
            logger.error(f"Failed to send push notification batch: {e}")
            return []

    async def get_push_receipts(
        self,
        ticket_ids: List[str]
    ) -> Dict[str, Dict[str, Any]]:
        """
        Get delivery receipts from Expo for sent notifications
        Returns dict mapping ticket_id to receipt info
        """
        if not ticket_ids:
            return {}

        headers = {
            "Accept": "application/json",
            "Accept-encoding": "gzip, deflate",
            "Content-Type": "application/json"
        }

        if self.access_token:
            headers["Authorization"] = f"Bearer {self.access_token}"

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    self.expo_receipt_url,
                    headers=headers,
                    json={"ids": ticket_ids},
                    timeout=aiohttp.ClientTimeout(total=30)
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        return result.get("data", {})
                    else:
                        logger.error(f"Failed to get receipts: {response.status}")
                        return {}

        except Exception as e:
            logger.error(f"Failed to get push receipts: {e}")
            return {}

    async def validate_push_tokens(
        self,
        device_tokens: List[str]
    ) -> Dict[str, bool]:
        """
        Validate push tokens by sending a silent notification
        Returns dict mapping token to validity
        """
        messages = []
        for token in device_tokens:
            messages.append({
                "to": token,
                "title": "",
                "body": "",
                "data": {"silent": True},
                "priority": "normal"
            })

        tickets = await self._send_batch(messages)

        # Analyze tickets for token validity
        token_validity = {}
        for i, ticket in enumerate(tickets):
            token = device_tokens[i]

            if ticket.get("status") == "ok":
                token_validity[token] = True
            elif ticket.get("status") == "error":
                error_details = ticket.get("details", {})
                error_code = error_details.get("error")

                # Common invalid token error codes
                if error_code in ["DeviceNotRegistered", "InvalidCredentials", "MessageTooBig"]:
                    token_validity[token] = False
                else:
                    token_validity[token] = True  # Assume valid for other errors
            else:
                token_validity[token] = True  # Assume valid if status unclear

        return token_validity
```

## Inventory Threshold Integration

### 1. Enhanced Inventory Service Integration

```python
# app/services/inventory_threshold_service.py
from typing import List, Dict, Optional, Any
from datetime import datetime, timezone, timedelta
from sqlalchemy import and_, or_, func

from app.config.database import get_async_session
from app.models.inventory import InventoryItem
from app.models.notification import NotificationPreference, NotificationLog
from app.services.notification_service import NotificationService

class InventoryThresholdService:
    def __init__(self):
        self.notification_service = NotificationService()

    async def evaluate_all_inventory_thresholds(self) -> Dict[str, Any]:
        """
        Evaluate all inventory items for threshold breaches
        This runs as a background task (e.g., every hour)
        """
        results = {
            'items_checked': 0,
            'notifications_sent': 0,
            'low_stock_alerts': 0,
            'critical_stock_alerts': 0,
            'expiry_warnings': 0,
            'errors': []
        }

        async for session in get_async_session():
            try:
                # Get all active inventory items
                inventory_items = await session.execute(
                    select(InventoryItem)
                    .where(
                        and_(
                            InventoryItem.is_deleted == False,
                            InventoryItem.quantity_remaining > 0
                        )
                    )
                )
                items = inventory_items.scalars().all()
                results['items_checked'] = len(items)

                for item in items:
                    # Evaluate low stock threshold
                    if await self._should_send_low_stock_alert(session, item):
                        notification_ids = await self.notification_service.send_inventory_threshold_notification(
                            str(item.id), 'low_stock', {
                                'current_quantity': item.quantity_remaining,
                                'product_name': f"{item.brand} {item.size}",
                                'days_remaining': await self._calculate_days_remaining(item)
                            }
                        )
                        results['low_stock_alerts'] += len(notification_ids)
                        results['notifications_sent'] += len(notification_ids)

                        # Update notification timestamp
                        item.low_stock_notified_at = datetime.now(timezone.utc)

                    # Evaluate critical stock threshold
                    if await self._should_send_critical_stock_alert(session, item):
                        notification_ids = await self.notification_service.send_inventory_threshold_notification(
                            str(item.id), 'critical_stock', {
                                'current_quantity': item.quantity_remaining,
                                'product_name': f"{item.brand} {item.size}",
                                'urgency_level': 'critical'
                            }
                        )
                        results['critical_stock_alerts'] += len(notification_ids)
                        results['notifications_sent'] += len(notification_ids)

                    # Evaluate expiry warning
                    if await self._should_send_expiry_warning(session, item):
                        days_until_expiry = (item.expiry_date - datetime.now(timezone.utc)).days
                        notification_ids = await self.notification_service.send_inventory_threshold_notification(
                            str(item.id), 'expiry_warning', {
                                'expiry_date': item.expiry_date.isoformat(),
                                'days_until_expiry': days_until_expiry,
                                'product_name': f"{item.brand} {item.size}"
                            }
                        )
                        results['expiry_warnings'] += len(notification_ids)
                        results['notifications_sent'] += len(notification_ids)

                        # Update notification timestamp
                        item.expiry_notified_at = datetime.now(timezone.utc)

                await session.commit()

            except Exception as e:
                results['errors'].append(str(e))
                await session.rollback()

        return results

    async def _should_send_low_stock_alert(
        self,
        session,
        inventory_item: InventoryItem
    ) -> bool:
        """Determine if low stock alert should be sent"""
        # Get user preferences
        prefs = await session.execute(
            select(NotificationPreference)
            .where(
                and_(
                    NotificationPreference.user_id == inventory_item.child.parent_id,
                    NotificationPreference.child_id == inventory_item.child_id,
                    NotificationPreference.notification_type == 'low_stock_alert',
                    NotificationPreference.is_enabled == True,
                    NotificationPreference.is_deleted == False
                )
            )
        )
        preference = prefs.scalar_one_or_none()

        if not preference:
            return False

        # Check threshold
        threshold = preference.threshold_value or 5
        if inventory_item.quantity_remaining > threshold:
            return False

        # Check if we've already notified recently
        if inventory_item.low_stock_notified_at:
            hours_since_notification = (
                datetime.now(timezone.utc) - inventory_item.low_stock_notified_at
            ).total_seconds() / 3600

            # Respect frequency setting
            min_hours = self._get_frequency_hours(preference.frequency)
            if hours_since_notification < min_hours:
                return False

        return True

    async def _calculate_days_remaining(self, inventory_item: InventoryItem) -> int:
        """
        Calculate estimated days remaining based on usage patterns
        Uses FIFO consumption and historical usage data
        """
        if inventory_item.quantity_remaining <= 0:
            return 0

        # Get recent usage logs to calculate daily consumption rate
        async for session in get_async_session():
            # Calculate average daily usage over the last 7 days
            seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)

            usage_logs = await session.execute(
                select(func.count(UsageLog.id))
                .where(
                    and_(
                        UsageLog.inventory_item_id == inventory_item.id,
                        UsageLog.logged_at >= seven_days_ago,
                        UsageLog.is_deleted == False
                    )
                )
            )
            total_usage = usage_logs.scalar() or 0

            if total_usage == 0:
                # No recent usage data, estimate based on child age
                # Newborns: ~10-12 diapers/day, toddlers: ~6-8 diapers/day
                estimated_daily_usage = 8  # Conservative estimate
            else:
                estimated_daily_usage = total_usage / 7

            if estimated_daily_usage == 0:
                return 999  # Essentially infinite if no usage

            return int(inventory_item.quantity_remaining / estimated_daily_usage)

    def _get_frequency_hours(self, frequency: str) -> int:
        """Convert notification frequency to minimum hours between notifications"""
        frequency_map = {
            'immediate': 0,
            'hourly': 1,
            'twice_daily': 12,
            'daily': 24,
            'weekly': 168,
            'disabled': 999999
        }
        return frequency_map.get(frequency, 24)
```

## Multi-Caregiver Coordination Logic

### 1. Caregiver Permission Management

```python
# app/services/caregiver_service.py
from typing import List, Dict, Optional, Any
from datetime import datetime, timezone
from sqlalchemy import and_, select
from enum import Enum

from app.config.database import get_async_session
from app.models.notification import CaregiverNotificationPermission
from app.models.user import User
from app.models.child import Child

class CaregiverNotificationService:

    async def get_notification_recipients(
        self,
        child_id: str,
        notification_type: str,
        priority_threshold: int = 3
    ) -> List[Dict[str, Any]]:
        """
        Get list of caregivers who should receive a specific notification
        Based on permissions, priority levels, and availability
        """
        async for session in get_async_session():
            # Get all authorized caregivers for this notification type
            caregivers_query = await session.execute(
                select(CaregiverNotificationPermission, User)
                .join(User, CaregiverNotificationPermission.caregiver_user_id == User.id)
                .where(
                    and_(
                        CaregiverNotificationPermission.child_id == child_id,
                        CaregiverNotificationPermission.permission_status == 'active',
                        CaregiverNotificationPermission.notification_types.contains([notification_type]),
                        CaregiverNotificationPermission.priority_level <= priority_threshold,
                        CaregiverNotificationPermission.is_deleted == False,
                        User.is_deleted == False
                    )
                )
            )

            caregivers_data = caregivers_query.all()

            recipients = []
            for permission, user in caregivers_data:
                recipients.append({
                    'user_id': str(user.id),
                    'caregiver_role': permission.caregiver_role,
                    'priority_level': permission.priority_level,
                    'can_acknowledge': permission.can_acknowledge_alerts,
                    'can_modify_inventory': permission.can_modify_inventory,
                    'is_emergency_contact': permission.is_emergency_contact,
                    'emergency_phone': permission.emergency_phone,
                    'user_info': {
                        'first_name': user.first_name,
                        'last_name': user.last_name,
                        'display_name': user.display_name,
                        'timezone': user.timezone
                    }
                })

            # Sort by priority level (lower number = higher priority)
            recipients.sort(key=lambda x: x['priority_level'])

            return recipients

    async def coordinate_cascade_notification(
        self,
        child_id: str,
        notification_type: str,
        message_title: str,
        message_body: str,
        requires_acknowledgment: bool = False,
        escalation_timeout_minutes: int = 30
    ) -> Dict[str, Any]:
        """
        Implement cascade notification system:
        1. Send to primary caregivers first
        2. If no acknowledgment within timeout, escalate to secondary caregivers
        3. Track acknowledgments and escalation
        """
        coordination_result = {
            'cascade_id': str(uuid.uuid4()),
            'child_id': child_id,
            'notification_type': notification_type,
            'primary_notifications_sent': 0,
            'secondary_notifications_sent': 0,
            'total_recipients': 0,
            'requires_acknowledgment': requires_acknowledgment,
            'escalation_timeout': escalation_timeout_minutes,
            'status': 'initiated'
        }

        # Get recipients by priority
        all_recipients = await self.get_notification_recipients(child_id, notification_type)
        coordination_result['total_recipients'] = len(all_recipients)

        if not all_recipients:
            coordination_result['status'] = 'no_recipients'
            return coordination_result

        # Primary caregivers (priority 1-2)
        primary_recipients = [r for r in all_recipients if r['priority_level'] <= 2]
        secondary_recipients = [r for r in all_recipients if r['priority_level'] > 2]

        # Send to primary caregivers
        async for session in get_async_session():
            for recipient in primary_recipients:
                notification_id = await self._send_coordinated_notification(
                    session,
                    recipient['user_id'],
                    child_id,
                    notification_type,
                    message_title,
                    message_body,
                    {
                        'cascade_id': coordination_result['cascade_id'],
                        'requires_acknowledgment': requires_acknowledgment,
                        'recipient_role': recipient['caregiver_role'],
                        'priority_level': recipient['priority_level']
                    }
                )

                if notification_id:
                    coordination_result['primary_notifications_sent'] += 1

        # If acknowledgment is required and we have secondary caregivers,
        # schedule escalation check
        if requires_acknowledgment and secondary_recipients:
            await self._schedule_escalation_check(
                coordination_result['cascade_id'],
                secondary_recipients,
                escalation_timeout_minutes,
                message_title,
                message_body
            )

        return coordination_result

    async def handle_notification_acknowledgment(
        self,
        notification_id: str,
        acknowledged_by_user_id: str
    ) -> Dict[str, Any]:
        """
        Handle acknowledgment of a notification and update cascade status
        """
        async for session in get_async_session():
            # Update notification log
            notification = await session.execute(
                select(NotificationLog)
                .where(NotificationLog.id == notification_id)
            )
            notification_log = notification.scalar_one_or_none()

            if not notification_log:
                return {'success': False, 'error': 'Notification not found'}

            notification_log.acknowledged_at = datetime.now(timezone.utc)
            notification_log.status = 'acknowledged'

            # Get cascade information
            cascade_id = notification_log.data_payload.get('cascade_id')

            if cascade_id:
                # Cancel any pending escalations for this cascade
                await self._cancel_escalation(session, cascade_id)

                # Update other notifications in the cascade
                await session.execute(
                    update(NotificationLog)
                    .where(
                        and_(
                            NotificationLog.data_payload.op('->')('cascade_id').astext == cascade_id,
                            NotificationLog.status.in_(['queued', 'sent'])
                        )
                    )
                    .values(
                        status='superseded',
                        updated_at=datetime.now(timezone.utc)
                    )
                )

            await session.commit()

            return {
                'success': True,
                'cascade_id': cascade_id,
                'acknowledged_by': acknowledged_by_user_id,
                'acknowledged_at': notification_log.acknowledged_at.isoformat()
            }

    async def _schedule_escalation_check(
        self,
        cascade_id: str,
        secondary_recipients: List[Dict[str, Any]],
        timeout_minutes: int,
        message_title: str,
        message_body: str
    ):
        """
        Schedule a background task to check for acknowledgment
        and escalate to secondary caregivers if needed
        """
        # This would integrate with your background task system
        # (e.g., Celery, APScheduler, or custom async task queue)

        escalation_data = {
            'cascade_id': cascade_id,
            'secondary_recipients': secondary_recipients,
            'message_title': f"[ESCALATED] {message_title}",
            'message_body': f"{message_body}\n\nThis is an escalated notification due to no response from primary caregivers.",
            'scheduled_for': datetime.now(timezone.utc) + timedelta(minutes=timeout_minutes)
        }

        # In a real implementation, you'd queue this task
        # For example:
        # await task_queue.schedule_task(
        #     'check_and_escalate_notification',
        #     escalation_data,
        #     delay_seconds=timeout_minutes * 60
        # )

        pass  # Placeholder for actual task scheduling
```

### 2. Real-time Notification Coordination

```python
# app/services/realtime_coordination_service.py
import asyncio
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone
import json

class RealtimeNotificationCoordination:
    def __init__(self):
        self.active_cascades = {}  # In-memory cache for active notification cascades
        self.acknowledgment_callbacks = {}

    async def initiate_coordinated_notification(
        self,
        child_id: str,
        notification_type: str,
        priority: str,
        message_data: Dict[str, Any]
    ) -> str:
        """
        Initiate a coordinated notification with real-time tracking
        """
        cascade_id = str(uuid.uuid4())

        # Get caregiver hierarchy
        caregiver_service = CaregiverNotificationService()
        recipients = await caregiver_service.get_notification_recipients(
            child_id, notification_type
        )

        # Create cascade tracking
        cascade_info = {
            'cascade_id': cascade_id,
            'child_id': child_id,
            'notification_type': notification_type,
            'priority': priority,
            'initiated_at': datetime.now(timezone.utc),
            'recipients': recipients,
            'current_wave': 1,
            'acknowledged': False,
            'acknowledged_by': None,
            'escalated': False
        }

        self.active_cascades[cascade_id] = cascade_info

        # Send to primary wave (priority 1-2)
        primary_wave = [r for r in recipients if r['priority_level'] <= 2]
        await self._send_notification_wave(
            cascade_id, primary_wave, message_data, wave_number=1
        )

        # Set up acknowledgment timeout if needed
        if priority in ['high', 'critical']:
            timeout_seconds = 300 if priority == 'high' else 180  # 5 min vs 3 min
            asyncio.create_task(self._handle_escalation_timeout(cascade_id, timeout_seconds))

        return cascade_id

    async def handle_acknowledgment(
        self,
        cascade_id: str,
        acknowledged_by_user_id: str,
        acknowledgment_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Handle real-time acknowledgment and cascade cancellation
        """
        if cascade_id not in self.active_cascades:
            return {'success': False, 'error': 'Cascade not found or already completed'}

        cascade_info = self.active_cascades[cascade_id]

        # Mark as acknowledged
        cascade_info['acknowledged'] = True
        cascade_info['acknowledged_by'] = acknowledged_by_user_id
        cascade_info['acknowledged_at'] = datetime.now(timezone.utc)

        # Cancel any pending escalations
        await self._cancel_cascade(cascade_id)

        # Notify other caregivers about acknowledgment
        await self._broadcast_acknowledgment_notification(cascade_id, acknowledged_by_user_id)

        # Clean up
        del self.active_cascades[cascade_id]

        return {
            'success': True,
            'cascade_id': cascade_id,
            'acknowledged_by': acknowledged_by_user_id,
            'cascade_duration_seconds': (
                cascade_info['acknowledged_at'] - cascade_info['initiated_at']
            ).total_seconds()
        }

    async def _handle_escalation_timeout(
        self,
        cascade_id: str,
        timeout_seconds: int
    ):
        """
        Handle escalation after timeout if no acknowledgment received
        """
        # Wait for timeout
        await asyncio.sleep(timeout_seconds)

        # Check if still needs escalation
        if cascade_id not in self.active_cascades:
            return  # Already acknowledged or cancelled

        cascade_info = self.active_cascades[cascade_id]

        if cascade_info['acknowledged']:
            return  # Already acknowledged

        # Escalate to next wave
        all_recipients = cascade_info['recipients']
        next_wave = [r for r in all_recipients if r['priority_level'] > 2]

        if next_wave:
            cascade_info['escalated'] = True
            cascade_info['escalated_at'] = datetime.now(timezone.utc)
            cascade_info['current_wave'] = 2

            # Create escalated message
            escalated_message = {
                'title': f"[URGENT - ESCALATED] {cascade_info.get('original_title', 'Alert')}",
                'body': f"No response received from primary caregivers. Immediate attention required.",
                'data': {
                    'escalated': True,
                    'original_cascade_id': cascade_id,
                    'escalation_reason': 'timeout'
                }
            }

            await self._send_notification_wave(
                cascade_id, next_wave, escalated_message, wave_number=2
            )

    async def _broadcast_acknowledgment_notification(
        self,
        cascade_id: str,
        acknowledged_by_user_id: str
    ):
        """
        Send notification to other caregivers that alert was acknowledged
        """
        cascade_info = self.active_cascades.get(cascade_id)
        if not cascade_info:
            return

        # Get acknowledging user info
        async for session in get_async_session():
            user = await session.execute(
                select(User).where(User.id == acknowledged_by_user_id)
            )
            acknowledging_user = user.scalar_one_or_none()

            if not acknowledging_user:
                return

            # Notify other recipients
            other_recipients = [
                r for r in cascade_info['recipients']
                if r['user_id'] != acknowledged_by_user_id
            ]

            acknowledgment_message = {
                'title': 'Alert Acknowledged',
                'body': f"{acknowledging_user.display_name or acknowledging_user.first_name} has acknowledged the alert.",
                'data': {
                    'type': 'acknowledgment_notification',
                    'cascade_id': cascade_id,
                    'acknowledged_by': acknowledged_by_user_id,
                    'acknowledged_by_name': acknowledging_user.display_name
                }
            }

            # Send low-priority acknowledgment notifications
            for recipient in other_recipients:
                await self.notification_service._send_immediate_notification(
                    session,
                    recipient['user_id'],
                    cascade_info['child_id'],
                    'caregiver_activity',
                    acknowledgment_message['data']
                )
```

## PIPEDA Compliance Architecture

### 1. Data Audit and Retention

```python
# app/services/pipeda_compliance_service.py
from typing import List, Dict, Optional, Any
from datetime import datetime, timezone, timedelta
import json

class PIPEDAComplianceService:
    """
    Service to handle PIPEDA compliance for notification system
    - Data minimization
    - Retention policies
    - Audit trails
    - Consent management
    - User rights (access, correction, deletion)
    """

    async def audit_notification_data_retention(self) -> Dict[str, Any]:
        """
        Audit notification data for PIPEDA retention compliance
        """
        audit_results = {
            'total_records_reviewed': 0,
            'records_eligible_for_deletion': 0,
            'records_deleted': 0,
            'retention_policy_violations': 0,
            'errors': []
        }

        async for session in get_async_session():
            try:
                # Check notification logs older than retention period
                retention_cutoff = datetime.now(timezone.utc) - timedelta(days=365)  # 1 year default

                old_notifications = await session.execute(
                    select(NotificationLog)
                    .where(
                        and_(
                            NotificationLog.created_at < retention_cutoff,
                            NotificationLog.is_deleted == False,
                            or_(
                                NotificationLog.retention_date.is_(None),
                                NotificationLog.retention_date < datetime.now(timezone.utc)
                            )
                        )
                    )
                )

                old_logs = old_notifications.scalars().all()
                audit_results['total_records_reviewed'] = len(old_logs)

                for log in old_logs:
                    # Check if record has specific retention requirements
                    if log.retention_reason:
                        # Extended retention for legal/business reasons
                        continue

                    audit_results['records_eligible_for_deletion'] += 1

                    # Anonymize personal data before soft deletion
                    await self._anonymize_notification_log(session, log)

                    # Soft delete the record
                    log.soft_delete()
                    audit_results['records_deleted'] += 1

                await session.commit()

            except Exception as e:
                audit_results['errors'].append(str(e))
                await session.rollback()

        return audit_results

    async def handle_user_data_export_request(
        self,
        user_id: str,
        request_type: str = "full"  # "full", "notifications_only", "preferences_only"
    ) -> Dict[str, Any]:
        """
        Handle user data export request under PIPEDA Article 23
        """
        async for session in get_async_session():
            export_data = {
                'export_id': str(uuid.uuid4()),
                'user_id': user_id,
                'request_type': request_type,
                'generated_at': datetime.now(timezone.utc).isoformat(),
                'data': {}
            }

            if request_type in ["full", "notifications_only"]:
                # Export notification logs
                notifications = await session.execute(
                    select(NotificationLog)
                    .where(
                        and_(
                            NotificationLog.user_id == user_id,
                            NotificationLog.is_deleted == False
                        )
                    )
                    .order_by(NotificationLog.created_at.desc())
                )

                export_data['data']['notification_history'] = [
                    {
                        'id': str(log.id),
                        'type': log.notification_type,
                        'channel': log.channel,
                        'status': log.status,
                        'title': log.title,
                        'message': log.message,
                        'sent_at': log.sent_at.isoformat() if log.sent_at else None,
                        'delivered_at': log.delivered_at.isoformat() if log.delivered_at else None,
                        'acknowledged_at': log.acknowledged_at.isoformat() if log.acknowledged_at else None,
                        'created_at': log.created_at.isoformat()
                    }
                    for log in notifications.scalars().all()
                ]

            if request_type in ["full", "preferences_only"]:
                # Export notification preferences
                preferences = await session.execute(
                    select(NotificationPreference)
                    .where(
                        and_(
                            NotificationPreference.user_id == user_id,
                            NotificationPreference.is_deleted == False
                        )
                    )
                )

                export_data['data']['notification_preferences'] = [
                    {
                        'id': str(pref.id),
                        'child_id': str(pref.child_id) if pref.child_id else None,
                        'notification_type': pref.notification_type,
                        'frequency': pref.frequency,
                        'channels': pref.channels,
                        'is_enabled': pref.is_enabled,
                        'threshold_value': pref.threshold_value,
                        'advance_days': pref.advance_days,
                        'respect_quiet_hours': pref.respect_quiet_hours,
                        'delivery_timezone': pref.delivery_timezone,
                        'created_at': pref.created_at.isoformat(),
                        'updated_at': pref.updated_at.isoformat()
                    }
                    for pref in preferences.scalars().all()
                ]

                # Export device tokens
                devices = await session.execute(
                    select(DeviceToken)
                    .where(
                        and_(
                            DeviceToken.user_id == user_id,
                            DeviceToken.is_deleted == False
                        )
                    )
                )

                export_data['data']['registered_devices'] = [
                    {
                        'id': str(device.id),
                        'device_name': device.device_name,
                        'device_platform': device.device_platform,
                        'token_status': device.token_status,
                        'last_used_at': device.last_used_at.isoformat() if device.last_used_at else None,
                        'created_at': device.created_at.isoformat()
                    }
                    for device in devices.scalars().all()
                ]

                # Export quiet hours
                quiet_hours = await session.execute(
                    select(QuietHours)
                    .where(
                        and_(
                            QuietHours.user_id == user_id,
                            QuietHours.is_deleted == False
                        )
                    )
                )

                export_data['data']['quiet_hours_settings'] = [
                    {
                        'id': str(qh.id),
                        'days_of_week': qh.days_of_week,
                        'start_time': qh.start_time.isoformat(),
                        'end_time': qh.end_time.isoformat(),
                        'timezone': qh.timezone,
                        'allow_critical_alerts': qh.allow_critical_alerts,
                        'is_active': qh.is_active,
                        'created_at': qh.created_at.isoformat()
                    }
                    for qh in quiet_hours.scalars().all()
                ]

            # Log the export request for audit purposes
            await self._log_data_export_request(session, user_id, request_type, export_data['export_id'])

            return export_data

    async def handle_user_data_deletion_request(
        self,
        user_id: str,
        deletion_type: str = "full"  # "full", "notifications_only", "anonymize"
    ) -> Dict[str, Any]:
        """
        Handle user data deletion request under PIPEDA Right to be Forgotten
        """
        deletion_result = {
            'deletion_id': str(uuid.uuid4()),
            'user_id': user_id,
            'deletion_type': deletion_type,
            'requested_at': datetime.now(timezone.utc).isoformat(),
            'completed': False,
            'records_affected': {
                'notification_logs': 0,
                'notification_preferences': 0,
                'device_tokens': 0,
                'quiet_hours': 0,
                'caregiver_permissions': 0
            },
            'errors': []
        }

        async for session in get_async_session():
            try:
                if deletion_type in ["full", "notifications_only"]:
                    # Delete notification logs
                    notification_logs = await session.execute(
                        select(NotificationLog)
                        .where(NotificationLog.user_id == user_id)
                    )

                    for log in notification_logs.scalars().all():
                        if deletion_type == "anonymize":
                            await self._anonymize_notification_log(session, log)
                        else:
                            log.soft_delete()
                        deletion_result['records_affected']['notification_logs'] += 1

                if deletion_type == "full":
                    # Delete preferences
                    preferences = await session.execute(
                        select(NotificationPreference)
                        .where(NotificationPreference.user_id == user_id)
                    )

                    for pref in preferences.scalars().all():
                        pref.soft_delete()
                        deletion_result['records_affected']['notification_preferences'] += 1

                    # Delete device tokens
                    devices = await session.execute(
                        select(DeviceToken)
                        .where(DeviceToken.user_id == user_id)
                    )

                    for device in devices.scalars().all():
                        device.soft_delete()
                        deletion_result['records_affected']['device_tokens'] += 1

                    # Delete quiet hours
                    quiet_hours = await session.execute(
                        select(QuietHours)
                        .where(QuietHours.user_id == user_id)
                    )

                    for qh in quiet_hours.scalars().all():
                        qh.soft_delete()
                        deletion_result['records_affected']['quiet_hours'] += 1

                    # Handle caregiver permissions
                    caregiver_perms = await session.execute(
                        select(CaregiverNotificationPermission)
                        .where(CaregiverNotificationPermission.caregiver_user_id == user_id)
                    )

                    for perm in caregiver_perms.scalars().all():
                        perm.soft_delete()
                        deletion_result['records_affected']['caregiver_permissions'] += 1

                # Log the deletion request
                await self._log_data_deletion_request(
                    session, user_id, deletion_type, deletion_result['deletion_id']
                )

                await session.commit()
                deletion_result['completed'] = True

            except Exception as e:
                deletion_result['errors'].append(str(e))
                await session.rollback()

        return deletion_result

    async def _anonymize_notification_log(
        self,
        session,
        notification_log: NotificationLog
    ):
        """
        Anonymize notification log while preserving statistical value
        """
        # Replace personal identifiers with anonymized versions
        notification_log.title = f"[ANONYMIZED_{notification_log.notification_type}]"
        notification_log.message = f"Anonymized notification content"

        # Clear personal data from payload
        if notification_log.data_payload:
            anonymized_payload = {
                'anonymized': True,
                'original_type': notification_log.notification_type,
                'anonymized_at': datetime.now(timezone.utc).isoformat()
            }
            notification_log.data_payload = anonymized_payload

        # Clear external identifiers
        notification_log.expo_ticket_id = None
        notification_log.expo_receipt_id = None
        notification_log.external_message_id = None

        notification_log.updated_at = datetime.now(timezone.utc)
```

## Frontend Integration Architecture

### 1. React Native Notification Service

```typescript
// NestSync-frontend/lib/services/NotificationService.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { graphqlClient } from '../graphql/client';
import {
  REGISTER_DEVICE_TOKEN_MUTATION,
  UPDATE_NOTIFICATION_PREFERENCE_MUTATION,
  MY_NOTIFICATION_PREFERENCES_QUERY
} from '../graphql/mutations';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const { data } = notification.request.content;

    // Handle different notification priorities
    const priority = data?.priority || 'normal';
    const notificationType = data?.notification_type;

    return {
      shouldShowAlert: true,
      shouldPlaySound: priority === 'critical' || priority === 'high',
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    };
  },
});

export interface NotificationPreference {
  id: string;
  childId?: string;
  notificationType: string;
  frequency: string;
  channels: string[];
  isEnabled: boolean;
  thresholdValue?: number;
  advanceDays?: number;
  respectQuietHours: boolean;
  deliveryTimezone: string;
  preferredDeliveryHours?: number[];
}

export interface DeviceTokenInfo {
  deviceId: string;
  deviceName?: string;
  devicePlatform: 'ios' | 'android' | 'web';
  deviceModel?: string;
  expoPushToken: string;
  nativePushToken?: string;
  projectId: string;
  appVersion?: string;
  expoSdkVersion?: string;
}

class NotificationService {
  private static instance: NotificationService;
  private pushToken: string | null = null;
  private isRegistered: boolean = false;
  private listeners: Notifications.EventSubscription[] = [];

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async initialize(): Promise<void> {
    try {
      // Register for push notifications
      await this.registerForPushNotifications();

      // Set up notification listeners
      this.setupNotificationListeners();

      // Register device token with backend
      if (this.pushToken) {
        await this.registerDeviceTokenWithBackend();
      }

    } catch (error) {
      console.error('Failed to initialize notification service:', error);
    }
  }

  private async registerForPushNotifications(): Promise<string | null> {
    if (!Device.isDevice) {
      console.warn('Push notifications require a physical device');
      return null;
    }

    // Request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      throw new Error('Permission not granted for push notifications');
    }

    // Configure Android notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('nestsync-default', {
        name: 'NestSync Notifications',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#0891B2', // NestSync primary color
      });

      // Create channels for different notification types
      await this.setupAndroidNotificationChannels();
    }

    // Get Expo push token
    try {
      const projectId = Constants?.expoConfig?.extra?.eas?.projectId ??
                      Constants?.easConfig?.projectId;

      if (!projectId) {
        throw new Error('Project ID not found');
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
      this.pushToken = tokenData.data;

      return this.pushToken;
    } catch (error) {
      console.error('Failed to get push token:', error);
      throw error;
    }
  }

  private async setupAndroidNotificationChannels(): Promise<void> {
    const channels = [
      {
        id: 'nestsync-critical',
        name: 'Critical Alerts',
        importance: Notifications.AndroidImportance.MAX,
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250, 250, 250],
        lightColor: '#FF4444'
      },
      {
        id: 'nestsync-stock-alerts',
        name: 'Stock Alerts',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FFA500'
      },
      {
        id: 'nestsync-reminders',
        name: 'Reminders',
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: 'default',
        vibrationPattern: [0, 250],
        lightColor: '#0891B2'
      },
      {
        id: 'nestsync-updates',
        name: 'Updates',
        importance: Notifications.AndroidImportance.LOW,
        sound: null,
        vibrationPattern: null,
        lightColor: '#0891B2'
      }
    ];

    for (const channel of channels) {
      await Notifications.setNotificationChannelAsync(channel.id, channel);
    }
  }

  private setupNotificationListeners(): void {
    // Listener for notifications received while app is in foreground
    const notificationListener = Notifications.addNotificationReceivedListener(
      this.handleNotificationReceived.bind(this)
    );

    // Listener for notification interactions (tap, dismiss, etc.)
    const responseListener = Notifications.addNotificationResponseReceivedListener(
      this.handleNotificationResponse.bind(this)
    );

    // Listener for push token updates
    const tokenListener = Notifications.addPushTokenListener(
      this.handlePushTokenUpdate.bind(this)
    );

    this.listeners = [notificationListener, responseListener, tokenListener];
  }

  private async handleNotificationReceived(
    notification: Notifications.Notification
  ): Promise<void> {
    const { data } = notification.request.content;

    // Log notification received
    console.log('Notification received:', {
      type: data?.notification_type,
      title: notification.request.content.title,
      priority: data?.priority
    });

    // Handle special notification types
    switch (data?.notification_type) {
      case 'critical_stock_alert':
        // Show prominent in-app alert
        await this.showCriticalStockAlert(notification);
        break;

      case 'caregiver_activity':
        // Update caregiver activity UI
        await this.handleCaregiverActivity(data);
        break;

      default:
        // Standard notification handling
        break;
    }
  }

  private async handleNotificationResponse(
    response: Notifications.NotificationResponse
  ): Promise<void> {
    const { notification, actionIdentifier } = response;
    const { data } = notification.request.content;

    // Log user interaction
    console.log('Notification interaction:', {
      action: actionIdentifier,
      type: data?.notification_type,
      cascade_id: data?.cascade_id
    });

    // Handle acknowledgment for cascade notifications
    if (data?.requires_acknowledgment && data?.cascade_id) {
      await this.acknowledgeNotification(data.cascade_id);
    }

    // Navigate to appropriate screen based on notification type
    await this.handleNotificationNavigation(data);
  }

  private async handlePushTokenUpdate(token: Notifications.ExpoPushToken): Promise<void> {
    console.log('Push token updated:', token.data);
    this.pushToken = token.data;
    await this.registerDeviceTokenWithBackend();
  }

  private async registerDeviceTokenWithBackend(): Promise<void> {
    if (!this.pushToken) {
      throw new Error('No push token available');
    }

    try {
      const deviceInfo = await this.getDeviceInfo();

      const { data } = await graphqlClient.mutate({
        mutation: REGISTER_DEVICE_TOKEN_MUTATION,
        variables: {
          input: {
            deviceId: deviceInfo.deviceId,
            deviceName: deviceInfo.deviceName,
            devicePlatform: deviceInfo.devicePlatform,
            deviceModel: deviceInfo.deviceModel,
            expoPushToken: this.pushToken,
            projectId: deviceInfo.projectId,
            appVersion: deviceInfo.appVersion,
            expoSdkVersion: deviceInfo.expoSdkVersion
          }
        }
      });

      if (data?.registerDeviceToken?.success) {
        this.isRegistered = true;
        console.log('Device token registered successfully');
      } else {
        console.error('Failed to register device token:', data?.registerDeviceToken?.errors);
      }
    } catch (error) {
      console.error('Error registering device token:', error);
    }
  }

  private async getDeviceInfo(): Promise<DeviceTokenInfo> {
    const deviceId = await this.getOrCreateDeviceId();
    const projectId = Constants?.expoConfig?.extra?.eas?.projectId ??
                     Constants?.easConfig?.projectId;

    return {
      deviceId,
      deviceName: Device.deviceName || undefined,
      devicePlatform: Platform.OS as 'ios' | 'android' | 'web',
      deviceModel: Device.modelName || undefined,
      expoPushToken: this.pushToken!,
      projectId: projectId!,
      appVersion: Constants.expoConfig?.version,
      expoSdkVersion: Constants.expoConfig?.sdkVersion
    };
  }

  private async getOrCreateDeviceId(): Promise<string> {
    const DEVICE_ID_KEY = '@nestsync_device_id';

    let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);

    if (!deviceId) {
      deviceId = `${Platform.OS}_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
    }

    return deviceId;
  }

  async getNotificationPreferences(childId?: string): Promise<NotificationPreference[]> {
    try {
      const { data } = await graphqlClient.query({
        query: MY_NOTIFICATION_PREFERENCES_QUERY,
        variables: { childId },
        fetchPolicy: 'cache-first'
      });

      return data?.myNotificationPreferences || [];
    } catch (error) {
      console.error('Failed to get notification preferences:', error);
      return [];
    }
  }

  async updateNotificationPreference(
    preference: Partial<NotificationPreference>
  ): Promise<boolean> {
    try {
      const { data } = await graphqlClient.mutate({
        mutation: UPDATE_NOTIFICATION_PREFERENCE_MUTATION,
        variables: { input: preference }
      });

      return data?.updateNotificationPreference?.success || false;
    } catch (error) {
      console.error('Failed to update notification preference:', error);
      return false;
    }
  }

  private async acknowledgeNotification(cascadeId: string): Promise<void> {
    try {
      // Call acknowledgment mutation
      // Implementation would call ACKNOWLEDGE_NOTIFICATION_MUTATION
      console.log('Acknowledging notification cascade:', cascadeId);
    } catch (error) {
      console.error('Failed to acknowledge notification:', error);
    }
  }

  private async showCriticalStockAlert(
    notification: Notifications.Notification
  ): Promise<void> {
    // Show in-app modal or prominent alert for critical notifications
    // This would integrate with your app's alert system
  }

  private async handleCaregiverActivity(data: any): Promise<void> {
    // Handle caregiver activity notifications
    // Update UI, refresh data, etc.
  }

  private async handleNotificationNavigation(data: any): Promise<void> {
    // Navigate to appropriate screen based on notification type
    switch (data?.notification_type) {
      case 'low_stock_alert':
      case 'critical_stock_alert':
        // Navigate to inventory screen
        break;

      case 'expiry_warning':
        // Navigate to inventory with expiry filter
        break;

      default:
        // Navigate to dashboard
        break;
    }
  }

  cleanup(): void {
    // Remove all listeners
    this.listeners.forEach(subscription => subscription.remove());
    this.listeners = [];
  }
}

export default NotificationService.getInstance();
```

## Implementation Roadmap

### Phase 1: Database Schema & Models (Week 1-2)
- [ ] Create database migration scripts for all 5 tables
- [ ] Implement SQLAlchemy models following BaseModel patterns
- [ ] Set up proper indexes and constraints
- [ ] Test database schema with sample data
- [ ] Implement data validation and business rules

### Phase 2: Backend GraphQL API (Week 2-4)
- [ ] Implement GraphQL types and enums
- [ ] Create input and response types
- [ ] Build notification resolvers using async session pattern
- [ ] Implement Expo push service integration
- [ ] Create notification service with inventory integration
- [ ] Add multi-caregiver coordination logic
- [ ] Test all GraphQL endpoints

### Phase 3: Frontend Integration (Week 4-6)
- [ ] Install and configure expo-notifications
- [ ] Implement NotificationService with proper token management
- [ ] Create notification preferences UI components
- [ ] Build quiet hours configuration screen
- [ ] Implement caregiver permission management UI
- [ ] Add notification history and acknowledgment features
- [ ] Test cross-platform functionality (iOS/Android/Web)

### Phase 4: Inventory Integration (Week 6-7)
- [ ] Enhance inventory service with threshold checking
- [ ] Implement background task for threshold monitoring
- [ ] Create smart notification timing logic
- [ ] Test inventory-driven notification flows
- [ ] Validate threshold accuracy and timing

### Phase 5: PIPEDA Compliance (Week 7-8)
- [ ] Implement data audit and retention service
- [ ] Create user data export functionality
- [ ] Build data deletion and anonymization features
- [ ] Add comprehensive audit logging
- [ ] Test compliance workflows
- [ ] Document privacy policies and data handling

### Phase 6: Testing & Production Deployment (Week 8-10)
- [ ] Comprehensive integration testing
- [ ] Performance testing with high notification volumes
- [ ] Security testing for token management
- [ ] User acceptance testing for notification flows
- [ ] Production deployment and monitoring setup
- [ ] Documentation and training materials

## Success Metrics

### Technical Performance
- **Push notification delivery rate**: >95% within 60 seconds
- **Token management accuracy**: >99% valid tokens maintained
- **Background processing**: <5 minute detection-to-notification time
- **Cross-platform compatibility**: 100% feature parity across iOS/Android/Web

### User Experience
- **Notification relevance**: <5% user-reported false positives
- **Quiet hours compliance**: 100% respect for user quiet hours settings
- **Multi-caregiver coordination**: <2 minute average acknowledgment time
- **Preference management**: <3 taps to modify any notification setting

### Compliance & Security
- **PIPEDA compliance**: 100% audit trail coverage
- **Data retention**: Automated retention policy enforcement
- **User rights**: <24 hour response time for data export requests
- **Security**: Zero token exposure incidents

This comprehensive architecture provides a robust foundation for NestSync's notification system that integrates seamlessly with the existing codebase while providing advanced features for inventory management, multi-caregiver coordination, and Canadian privacy compliance.