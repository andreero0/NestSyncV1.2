"""
GraphQL Notification System Resolvers
PIPEDA-compliant notification preferences, queue, and delivery tracking
"""

import logging
import uuid
import json
from typing import Optional, List
from datetime import datetime, timezone, time, timedelta
import strawberry
from strawberry.types import Info
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, desc, asc, text
from sqlalchemy.orm import selectinload, joinedload

from app.config.database import get_async_session, refresh_database_metadata, verify_table_exists
from app.models import (
    User,
    NotificationPreferences as NotificationPreferencesModel,
    NotificationQueue as NotificationQueueModel,
    NotificationDeliveryLog as NotificationDeliveryLogModel,
    ConsentRecord
)
from app.models.notification import (
    NotificationPriorityType as NotificationPriorityTypeModel,
    NotificationTypeEnum as NotificationTypeEnumModel,
    NotificationChannelEnum as NotificationChannelEnumModel,
    NotificationStatusEnum as NotificationStatusEnumModel
)
from app.graphql.context import require_context_user
from app.utils.data_transformations import TIMEZONE_CANADA
from .types import (
    NotificationPreferences as NotificationPreferencesType,
    NotificationQueue as NotificationQueueType,
    NotificationDeliveryLog as NotificationDeliveryLogType,
    UpdateNotificationPreferencesInput,
    UpdateNotificationPreferencesResponse,
    CreateNotificationInput,
    CreateNotificationResponse,
    RegisterDeviceTokenInput,
    RegisterDeviceTokenResponse,
    TestNotificationResponse,
    NotificationQueueConnection,
    NotificationQueueEdge,
    NotificationDeliveryLogConnection,
    NotificationDeliveryLogEdge,
    PageInfo,
    MutationResponse,
    NotificationPriorityType,
    NotificationTypeEnum,
    NotificationChannelEnum,
    NotificationStatusEnum
)

logger = logging.getLogger(__name__)


def notification_preferences_to_graphql(prefs: NotificationPreferencesModel) -> NotificationPreferencesType:
    """Convert NotificationPreferences model to GraphQL type"""
    return NotificationPreferencesType(
        id=str(prefs.id),
        user_id=str(prefs.user_id),
        notifications_enabled=prefs.notifications_enabled,
        critical_notifications=prefs.critical_notifications,
        important_notifications=prefs.important_notifications,
        optional_notifications=prefs.optional_notifications,
        push_notifications=prefs.push_notifications,
        email_notifications=prefs.email_notifications,
        sms_notifications=prefs.sms_notifications,
        quiet_hours_enabled=prefs.quiet_hours_enabled,
        quiet_hours_start=prefs.quiet_hours_start.strftime("%H:%M") if prefs.quiet_hours_start else None,
        quiet_hours_end=prefs.quiet_hours_end.strftime("%H:%M") if prefs.quiet_hours_end else None,
        stock_alert_enabled=prefs.stock_alert_enabled,
        stock_alert_threshold=prefs.stock_alert_threshold,
        change_reminder_enabled=prefs.change_reminder_enabled,
        change_reminder_interval_hours=prefs.change_reminder_interval_hours,
        expiry_warning_enabled=prefs.expiry_warning_enabled,
        expiry_warning_days=prefs.expiry_warning_days,
        health_tips_enabled=prefs.health_tips_enabled,
        marketing_enabled=prefs.marketing_enabled,
        device_tokens=prefs.device_tokens if prefs.device_tokens else [],
        user_timezone=prefs.user_timezone,
        daily_notification_limit=prefs.daily_notification_limit,
        notification_consent_granted=prefs.notification_consent_granted,
        notification_consent_date=prefs.notification_consent_date,
        marketing_consent_granted=prefs.marketing_consent_granted,
        marketing_consent_date=prefs.marketing_consent_date,
        created_at=prefs.created_at,
        updated_at=prefs.updated_at
    )


def notification_queue_to_graphql(queue: NotificationQueueModel) -> NotificationQueueType:
    """Convert NotificationQueue model to GraphQL type"""
    return NotificationQueueType(
        id=str(queue.id),
        user_id=str(queue.user_id),
        child_id=str(queue.child_id) if queue.child_id else None,
        notification_type=NotificationTypeEnum(queue.notification_type),
        priority=NotificationPriorityType(queue.priority),
        channels=[NotificationChannelEnum(channel) for channel in queue.channels],
        title=queue.title,
        message=queue.message,
        data_payload=json.dumps(queue.data_payload) if queue.data_payload else None,
        scheduled_for=queue.scheduled_for,
        status=NotificationStatusEnum(queue.status),
        attempts=queue.attempts,
        max_attempts=queue.max_attempts,
        last_error=queue.last_error,
        batch_id=str(queue.batch_id) if queue.batch_id else None,
        created_at=queue.created_at
    )


def notification_delivery_log_to_graphql(log: NotificationDeliveryLogModel) -> NotificationDeliveryLogType:
    """Convert NotificationDeliveryLog model to GraphQL type"""
    return NotificationDeliveryLogType(
        id=str(log.id),
        user_id=str(log.user_id),
        queue_item_id=str(log.queue_item_id) if log.queue_item_id else None,
        preferences_id=str(log.preferences_id) if log.preferences_id else None,
        notification_type=NotificationTypeEnum(log.notification_type),
        priority=NotificationPriorityType(log.priority),
        channel=NotificationChannelEnum(log.channel),
        title=log.title,
        message=log.message,
        delivery_status=NotificationStatusEnum(log.delivery_status),
        sent_at=log.sent_at,
        delivered_at=log.delivered_at,
        external_id=log.external_id,
        external_response=json.dumps(log.external_response) if log.external_response else None,
        error_code=log.error_code,
        error_message=log.error_message,
        processing_time_ms=log.processing_time_ms,
        data_retention_date=log.data_retention_date,
        opened_at=log.opened_at,
        clicked_at=log.clicked_at,
        dismissed_at=log.dismissed_at,
        created_at=log.created_at
    )


def parse_time_string(time_str: str) -> time:
    """Parse HH:MM time string to time object"""
    try:
        hour, minute = map(int, time_str.split(':'))
        return time(hour, minute)
    except (ValueError, AttributeError):
        raise ValueError(f"Invalid time format: {time_str}. Expected HH:MM")


async def get_or_create_notification_preferences(user_id: uuid.UUID, session: AsyncSession) -> NotificationPreferencesModel:
    """Get or create notification preferences for a user"""
    try:
        # Try to get existing preferences
        prefs_query = select(NotificationPreferencesModel).where(
            NotificationPreferencesModel.user_id == user_id
        )
        result = await session.execute(prefs_query)
        existing_prefs = result.scalar_one_or_none()

        if existing_prefs:
            logger.debug(f"Found existing notification preferences for user {user_id}")
            return existing_prefs

        # Create default preferences with PIPEDA-compliant defaults
        logger.info(f"Creating default notification preferences for user {user_id}")
        current_time = datetime.now(timezone.utc)

        # Use raw SQL to insert with database-specific fields not in the model
        insert_query = text("""
            INSERT INTO notification_preferences (
                user_id, notifications_enabled, critical_notifications,
                important_notifications, optional_notifications,
                push_notifications, email_notifications, sms_notifications,
                quiet_hours_enabled, quiet_hours_start, quiet_hours_end,
                stock_alert_enabled, stock_alert_threshold,
                change_reminder_enabled, change_reminder_interval_hours,
                expiry_warning_enabled, expiry_warning_days,
                health_tips_enabled, marketing_enabled,
                device_tokens, user_timezone, daily_notification_limit,
                notification_consent_granted, notification_consent_date,
                marketing_consent_granted, marketing_consent_date,
                data_version, data_source, is_deleted, deleted_at,
                created_by, updated_by, deleted_by, deletion_reason
            ) VALUES (
                :user_id, :notifications_enabled, :critical_notifications,
                :important_notifications, :optional_notifications,
                :push_notifications, :email_notifications, :sms_notifications,
                :quiet_hours_enabled, :quiet_hours_start, :quiet_hours_end,
                :stock_alert_enabled, :stock_alert_threshold,
                :change_reminder_enabled, :change_reminder_interval_hours,
                :expiry_warning_enabled, :expiry_warning_days,
                :health_tips_enabled, :marketing_enabled,
                :device_tokens, :user_timezone, :daily_notification_limit,
                :notification_consent_granted, :notification_consent_date,
                :marketing_consent_granted, :marketing_consent_date,
                :data_version, :data_source, :is_deleted, :deleted_at,
                :created_by, :updated_by, :deleted_by, :deletion_reason
            )
            RETURNING id
        """)

        result = await session.execute(insert_query, {
            'user_id': user_id,
            'notifications_enabled': True,
            'critical_notifications': True,
            'important_notifications': True,
            'optional_notifications': False,
            'push_notifications': True,
            'email_notifications': True,
            'sms_notifications': False,
            'quiet_hours_enabled': True,
            'quiet_hours_start': time(22, 0),
            'quiet_hours_end': time(8, 0),
            'stock_alert_enabled': True,
            'stock_alert_threshold': 3,
            'change_reminder_enabled': False,
            'change_reminder_interval_hours': 4,
            'expiry_warning_enabled': True,
            'expiry_warning_days': 7,
            'health_tips_enabled': False,
            'marketing_enabled': False,
            'device_tokens': '[]',
            'user_timezone': 'America/Toronto',
            'daily_notification_limit': 10,
            'notification_consent_granted': True,
            'notification_consent_date': current_time,
            'marketing_consent_granted': False,
            'marketing_consent_date': None,
            'data_version': 1,
            'data_source': 'default_creation',
            'is_deleted': False,
            'deleted_at': None,
            'created_by': None,
            'updated_by': None,
            'deleted_by': None,
            'deletion_reason': None
        })

        new_id = result.scalar()
        await session.commit()

        # Now query back the created record using the model
        prefs_query = select(NotificationPreferencesModel).where(
            NotificationPreferencesModel.id == new_id
        )
        prefs_result = await session.execute(prefs_query)
        default_prefs = prefs_result.scalar_one()

        logger.info(f"Successfully created default notification preferences for user {user_id}")
        return default_prefs

    except Exception as e:
        logger.error(f"Failed to get or create notification preferences for user {user_id}: {e}")
        logger.error(f"Error type: {type(e).__name__}")
        await session.rollback()
        raise


async def create_audit_log(
    user_id: uuid.UUID,
    notification_type: str,
    priority: str,
    channel: str,
    title: str,
    message: str,
    delivery_status: str,
    session: AsyncSession,
    queue_item_id: Optional[uuid.UUID] = None,
    preferences_id: Optional[uuid.UUID] = None,
    external_id: Optional[str] = None,
    external_response: Optional[dict] = None,
    error_code: Optional[str] = None,
    error_message: Optional[str] = None,
    processing_time_ms: Optional[int] = None
) -> NotificationDeliveryLogModel:
    """Create audit log entry for PIPEDA compliance"""
    audit_log = NotificationDeliveryLogModel(
        user_id=user_id,
        queue_item_id=queue_item_id,
        preferences_id=preferences_id,
        notification_type=notification_type,
        priority=priority,
        channel=channel,
        title=title,
        message=message,
        delivery_status=delivery_status,
        sent_at=datetime.now(timezone.utc),
        external_id=external_id,
        external_response=external_response,
        error_code=error_code,
        error_message=error_message,
        processing_time_ms=processing_time_ms,
        # Set retention date to 7 years from now for PIPEDA compliance
        data_retention_date=datetime.now(timezone.utc) + timedelta(days=7*365)
    )

    session.add(audit_log)
    return audit_log


@strawberry.type
class NotificationQueries:
    """Notification system queries"""

    @strawberry.field
    async def get_notification_preferences(
        self,
        info: Info
    ) -> Optional[NotificationPreferencesType]:
        """Get user's current notification preferences"""
        try:
            user = await require_context_user(info)
            user_id = user.id

            # First, verify that the notification_preferences table exists
            table_exists = await verify_table_exists("notification_preferences")
            if not table_exists:
                logger.error("notification_preferences table does not exist - attempting metadata refresh")

                # Try to refresh metadata to recognize newly created tables
                refresh_success = await refresh_database_metadata()
                if not refresh_success:
                    logger.error("Failed to refresh database metadata")
                    raise Exception("Notification system not properly initialized - database schema incomplete")

                # Verify table exists after metadata refresh
                table_exists = await verify_table_exists("notification_preferences")
                if not table_exists:
                    raise Exception("notification_preferences table still not found after metadata refresh")

            async for session in get_async_session():
                prefs = await get_or_create_notification_preferences(user_id, session)
                return notification_preferences_to_graphql(prefs)

        except Exception as e:
            logger.error(f"Error getting notification preferences for user {user_id if 'user_id' in locals() else 'unknown'}: {e}")
            logger.error(f"Error type: {type(e).__name__}")
            logger.error(f"Error details: {str(e)}")
            # Return None to allow frontend to handle gracefully, but log detailed error info
            return None

    @strawberry.field
    async def get_notification_history(
        self,
        info: Info,
        notification_type: Optional[NotificationTypeEnum] = None,
        days_back: int = 30,
        limit: int = 50,
        offset: int = 0
    ) -> NotificationDeliveryLogConnection:
        """Get user's notification delivery history with pagination"""
        try:
            user = await require_context_user(info)
            user_id = user.id

            async for session in get_async_session():
                # Date range
                start_date = datetime.now(timezone.utc) - timedelta(days=days_back)

                # Build query
                query = select(NotificationDeliveryLogModel).where(
                    and_(
                        NotificationDeliveryLogModel.user_id == user_id,
                        NotificationDeliveryLogModel.created_at >= start_date
                    )
                )

                if notification_type:
                    query = query.where(NotificationDeliveryLogModel.notification_type == notification_type.value)

                # Add pagination and ordering
                query = query.order_by(desc(NotificationDeliveryLogModel.created_at)).offset(offset).limit(limit + 1)

                result = await session.execute(query)
                logs = result.scalars().all()

                # Check if there are more logs
                has_next_page = len(logs) > limit
                if has_next_page:
                    logs = logs[:-1]  # Remove extra log

                # Convert to GraphQL types with proper Edge structure
                from base64 import b64encode
                edges = []
                for log in logs:
                    cursor = b64encode(f"notification_log:{log.id}".encode('ascii')).decode('ascii')
                    edges.append(NotificationDeliveryLogEdge(
                        node=notification_delivery_log_to_graphql(log),
                        cursor=cursor
                    ))

                # Get total count
                count_query = select(func.count(NotificationDeliveryLogModel.id)).where(
                    and_(
                        NotificationDeliveryLogModel.user_id == user_id,
                        NotificationDeliveryLogModel.created_at >= start_date
                    )
                )
                if notification_type:
                    count_query = count_query.where(NotificationDeliveryLogModel.notification_type == notification_type.value)

                count_result = await session.execute(count_query)
                total_count = count_result.scalar() or 0

                # Calculate start and end cursors
                start_cursor = edges[0].cursor if edges else None
                end_cursor = edges[-1].cursor if edges else None

                page_info = PageInfo(
                    has_next_page=has_next_page,
                    has_previous_page=offset > 0,
                    start_cursor=start_cursor,
                    end_cursor=end_cursor,
                    total_count=total_count
                )

                return NotificationDeliveryLogConnection(
                    page_info=page_info,
                    edges=edges
                )

        except Exception as e:
            logger.error(f"Error getting notification history: {e}")
            return NotificationDeliveryLogConnection(
                page_info=PageInfo(
                    has_next_page=False,
                    has_previous_page=False,
                    start_cursor=None,
                    end_cursor=None,
                    total_count=0
                ),
                edges=[]
            )

    @strawberry.field
    async def get_pending_notifications(
        self,
        info: Info,
        limit: int = 50,
        offset: int = 0
    ) -> NotificationQueueConnection:
        """Get user's queued notifications"""
        try:
            user = await require_context_user(info)
            user_id = user.id

            async for session in get_async_session():
                # Build query for pending notifications
                query = select(NotificationQueueModel).where(
                    and_(
                        NotificationQueueModel.user_id == user_id,
                        NotificationQueueModel.status.in_([
                            NotificationStatusEnumModel.PENDING.value,
                            NotificationStatusEnumModel.SENT.value
                        ])
                    )
                ).order_by(desc(NotificationQueueModel.scheduled_for)).offset(offset).limit(limit + 1)

                result = await session.execute(query)
                notifications = result.scalars().all()

                # Check if there are more notifications
                has_next_page = len(notifications) > limit
                if has_next_page:
                    notifications = notifications[:-1]  # Remove extra notification

                # Convert to GraphQL types with proper Edge structure
                from base64 import b64encode
                edges = []
                for notification in notifications:
                    cursor = b64encode(f"notification_queue:{notification.id}".encode('ascii')).decode('ascii')
                    edges.append(NotificationQueueEdge(
                        node=notification_queue_to_graphql(notification),
                        cursor=cursor
                    ))

                # Get total count
                count_query = select(func.count(NotificationQueueModel.id)).where(
                    and_(
                        NotificationQueueModel.user_id == user_id,
                        NotificationQueueModel.status.in_([
                            NotificationStatusEnumModel.PENDING.value,
                            NotificationStatusEnumModel.SENT.value
                        ])
                    )
                )
                count_result = await session.execute(count_query)
                total_count = count_result.scalar() or 0

                # Calculate start and end cursors
                start_cursor = edges[0].cursor if edges else None
                end_cursor = edges[-1].cursor if edges else None

                page_info = PageInfo(
                    has_next_page=has_next_page,
                    has_previous_page=offset > 0,
                    start_cursor=start_cursor,
                    end_cursor=end_cursor,
                    total_count=total_count
                )

                return NotificationQueueConnection(
                    page_info=page_info,
                    edges=edges
                )

        except Exception as e:
            logger.error(f"Error getting pending notifications: {e}")
            return NotificationQueueConnection(
                page_info=PageInfo(
                    has_next_page=False,
                    has_previous_page=False,
                    start_cursor=None,
                    end_cursor=None,
                    total_count=0
                ),
                edges=[]
            )


@strawberry.type
class NotificationMutations:
    """Notification system mutations"""

    @strawberry.mutation
    async def update_notification_preferences(
        self,
        input: UpdateNotificationPreferencesInput,
        info: Info
    ) -> UpdateNotificationPreferencesResponse:
        """Update user notification preferences with PIPEDA consent validation"""
        try:
            user = await require_context_user(info)
            user_id = user.id

            async for session in get_async_session():
                # Get or create preferences
                prefs = await get_or_create_notification_preferences(user_id, session)

                # Update fields if provided (support both snake_case and camelCase)
                # Check camelCase aliases first, then fall back to snake_case
                notifications_enabled_value = getattr(input, 'notifications_enabled_alias', None) or input.notifications_enabled
                if notifications_enabled_value is not None:
                    prefs.notifications_enabled = notifications_enabled_value

                if input.critical_notifications is not None:
                    prefs.critical_notifications = input.critical_notifications

                if input.important_notifications is not None:
                    prefs.important_notifications = input.important_notifications

                if input.optional_notifications is not None:
                    prefs.optional_notifications = input.optional_notifications

                if input.push_notifications is not None:
                    prefs.push_notifications = input.push_notifications

                if input.email_notifications is not None:
                    prefs.email_notifications = input.email_notifications

                if input.sms_notifications is not None:
                    prefs.sms_notifications = input.sms_notifications

                if input.quiet_hours_enabled is not None:
                    prefs.quiet_hours_enabled = input.quiet_hours_enabled

                if input.quiet_hours_start is not None:
                    prefs.quiet_hours_start = parse_time_string(input.quiet_hours_start)

                if input.quiet_hours_end is not None:
                    prefs.quiet_hours_end = parse_time_string(input.quiet_hours_end)

                # Check camelCase alias first, then fall back to snake_case
                stock_alert_enabled_value = getattr(input, 'stock_alert_enabled_alias', None) or input.stock_alert_enabled
                if stock_alert_enabled_value is not None:
                    prefs.stock_alert_enabled = stock_alert_enabled_value

                if input.stock_alert_threshold is not None:
                    if not (1 <= input.stock_alert_threshold <= 30):
                        return UpdateNotificationPreferencesResponse(
                            success=False,
                            error="Stock alert threshold must be between 1 and 30 days"
                        )
                    prefs.stock_alert_threshold = input.stock_alert_threshold

                # Check camelCase alias first, then fall back to snake_case
                change_reminder_enabled_value = getattr(input, 'change_reminder_enabled_alias', None) or input.change_reminder_enabled
                if change_reminder_enabled_value is not None:
                    prefs.change_reminder_enabled = change_reminder_enabled_value

                if input.change_reminder_interval_hours is not None:
                    if not (1 <= input.change_reminder_interval_hours <= 12):
                        return UpdateNotificationPreferencesResponse(
                            success=False,
                            error="Change reminder interval must be between 1 and 12 hours"
                        )
                    prefs.change_reminder_interval_hours = input.change_reminder_interval_hours

                # Check camelCase alias first, then fall back to snake_case
                expiry_warning_enabled_value = getattr(input, 'expiry_warning_enabled_alias', None) or input.expiry_warning_enabled
                if expiry_warning_enabled_value is not None:
                    prefs.expiry_warning_enabled = expiry_warning_enabled_value

                if input.expiry_warning_days is not None:
                    if not (1 <= input.expiry_warning_days <= 90):
                        return UpdateNotificationPreferencesResponse(
                            success=False,
                            error="Expiry warning days must be between 1 and 90"
                        )
                    prefs.expiry_warning_days = input.expiry_warning_days

                if input.health_tips_enabled is not None:
                    prefs.health_tips_enabled = input.health_tips_enabled

                if input.marketing_enabled is not None:
                    prefs.marketing_enabled = input.marketing_enabled

                if input.user_timezone is not None:
                    prefs.user_timezone = input.user_timezone

                if input.daily_notification_limit is not None:
                    if not (1 <= input.daily_notification_limit <= 50):
                        return UpdateNotificationPreferencesResponse(
                            success=False,
                            error="Daily notification limit must be between 1 and 50"
                        )
                    prefs.daily_notification_limit = input.daily_notification_limit

                # Handle PIPEDA consent updates
                current_time = datetime.now(timezone.utc)

                if input.notification_consent_granted is not None:
                    if input.notification_consent_granted and not prefs.notification_consent_granted:
                        prefs.notification_consent_granted = True
                        prefs.notification_consent_date = current_time
                        logger.info(f"User {user_id} granted notification consent")
                    elif not input.notification_consent_granted and prefs.notification_consent_granted:
                        prefs.notification_consent_granted = False
                        prefs.notification_consent_date = None
                        # Disable all notifications when consent is withdrawn
                        prefs.notifications_enabled = False
                        logger.info(f"User {user_id} withdrew notification consent - notifications disabled")

                if input.marketing_consent_granted is not None:
                    if input.marketing_consent_granted and not prefs.marketing_consent_granted:
                        prefs.marketing_consent_granted = True
                        prefs.marketing_consent_date = current_time
                        logger.info(f"User {user_id} granted marketing consent")
                    elif not input.marketing_consent_granted and prefs.marketing_consent_granted:
                        prefs.marketing_consent_granted = False
                        prefs.marketing_consent_date = None
                        # Disable marketing notifications when consent is withdrawn
                        prefs.marketing_enabled = False
                        logger.info(f"User {user_id} withdrew marketing consent - marketing disabled")

                prefs.updated_at = current_time
                await session.commit()

                # Create audit log for preference changes
                await create_audit_log(
                    user_id=user_id,
                    notification_type="system_update",
                    priority="optional",
                    channel="in_app",
                    title="Notification Preferences Updated",
                    message="User updated their notification preferences",
                    delivery_status="delivered",
                    session=session,
                    preferences_id=prefs.id
                )

                await session.commit()

                return UpdateNotificationPreferencesResponse(
                    success=True,
                    message="Notification preferences updated successfully",
                    preferences=notification_preferences_to_graphql(prefs)
                )

        except ValueError as ve:
            logger.error(f"Validation error updating notification preferences: {ve}")
            return UpdateNotificationPreferencesResponse(
                success=False,
                error=str(ve)
            )
        except Exception as e:
            logger.error(f"Error updating notification preferences: {e}")
            return UpdateNotificationPreferencesResponse(
                success=False,
                error=f"Failed to update notification preferences: {str(e)}"
            )

    @strawberry.mutation
    async def register_device_token(
        self,
        input: RegisterDeviceTokenInput,
        info: Info
    ) -> RegisterDeviceTokenResponse:
        """Register device token for push notifications"""
        try:
            user = await require_context_user(info)
            user_id = user.id

            async for session in get_async_session():
                # Get or create preferences
                prefs = await get_or_create_notification_preferences(user_id, session)

                # Validate platform
                if input.platform not in ["ios", "android", "web"]:
                    return RegisterDeviceTokenResponse(
                        success=False,
                        error="Platform must be 'ios', 'android', or 'web'"
                    )

                # Validate token format (basic validation)
                if not input.device_token or len(input.device_token) < 10:
                    return RegisterDeviceTokenResponse(
                        success=False,
                        error="Invalid device token format"
                    )

                # Add token if not already present
                device_tokens = prefs.device_tokens if prefs.device_tokens else []
                token_data = {
                    "token": input.device_token,
                    "platform": input.platform,
                    "registered_at": datetime.now(timezone.utc).isoformat()
                }

                # Remove any existing tokens for this device/platform
                device_tokens = [
                    token for token in device_tokens
                    if not (isinstance(token, dict) and token.get("token") == input.device_token)
                ]

                # Add new token
                device_tokens.append(token_data)

                # Keep only the last 5 tokens per user to prevent bloat
                device_tokens = device_tokens[-5:]

                prefs.device_tokens = device_tokens
                prefs.updated_at = datetime.now(timezone.utc)

                await session.commit()

                logger.info(f"Registered device token for user {user_id} on platform {input.platform}")

                return RegisterDeviceTokenResponse(
                    success=True,
                    message="Device token registered successfully",
                    preferences=notification_preferences_to_graphql(prefs)
                )

        except Exception as e:
            logger.error(f"Error registering device token: {e}")
            return RegisterDeviceTokenResponse(
                success=False,
                error=f"Failed to register device token: {str(e)}"
            )

    @strawberry.mutation
    async def create_notification(
        self,
        input: CreateNotificationInput,
        info: Info
    ) -> CreateNotificationResponse:
        """Create new notification for user/child"""
        try:
            user = await require_context_user(info)
            requesting_user_id = user.id
            target_user_id = uuid.UUID(input.user_id)

            # Verify user has permission to create notifications for target user
            # For now, only allow users to create notifications for themselves
            if requesting_user_id != target_user_id:
                return CreateNotificationResponse(
                    success=False,
                    error="You can only create notifications for yourself"
                )

            async for session in get_async_session():
                # Validate target user exists
                user_query = select(User).where(
                    and_(
                        User.id == target_user_id,
                        User.status != "deleted"
                    )
                )
                user_result = await session.execute(user_query)
                target_user = user_result.scalar_one_or_none()

                if not target_user:
                    return CreateNotificationResponse(
                        success=False,
                        error="Target user not found"
                    )

                # Get user's notification preferences
                prefs = await get_or_create_notification_preferences(target_user_id, session)

                # Check if notifications are enabled
                if not prefs.notifications_enabled or not prefs.notification_consent_granted:
                    return CreateNotificationResponse(
                        success=False,
                        error="User has not consented to notifications"
                    )

                # Check priority-specific preferences
                if input.priority == NotificationPriorityType.CRITICAL and not prefs.critical_notifications:
                    return CreateNotificationResponse(
                        success=False,
                        error="User has disabled critical notifications"
                    )
                elif input.priority == NotificationPriorityType.IMPORTANT and not prefs.important_notifications:
                    return CreateNotificationResponse(
                        success=False,
                        error="User has disabled important notifications"
                    )
                elif input.priority == NotificationPriorityType.OPTIONAL and not prefs.optional_notifications:
                    return CreateNotificationResponse(
                        success=False,
                        error="User has disabled optional notifications"
                    )

                # Check marketing consent for marketing notifications
                if input.notification_type == NotificationTypeEnum.MARKETING:
                    if not prefs.marketing_consent_granted or not prefs.marketing_enabled:
                        return CreateNotificationResponse(
                            success=False,
                            error="User has not consented to marketing notifications"
                        )

                # Validate child_id if provided
                child_uuid = None
                if input.child_id:
                    child_uuid = uuid.UUID(input.child_id)
                    from app.models import Child
                    child_query = select(Child).where(
                        and_(
                            Child.id == child_uuid,
                            Child.parent_id == target_user_id,
                            Child.is_deleted == False
                        )
                    )
                    child_result = await session.execute(child_query)
                    child = child_result.scalar_one_or_none()

                    if not child:
                        return CreateNotificationResponse(
                            success=False,
                            error="Child not found or not owned by user"
                        )

                # Create notification queue item
                scheduled_for = input.scheduled_for or datetime.now(timezone.utc)

                # Parse data payload if provided
                data_payload = None
                if input.data_payload:
                    try:
                        data_payload = json.loads(input.data_payload)
                    except json.JSONDecodeError:
                        return CreateNotificationResponse(
                            success=False,
                            error="Invalid JSON in data_payload"
                        )

                notification = NotificationQueueModel(
                    user_id=target_user_id,
                    child_id=child_uuid,
                    notification_type=input.notification_type.value,
                    priority=input.priority.value,
                    channels=[channel.value for channel in input.channels],
                    title=input.title,
                    message=input.message,
                    data_payload=data_payload,
                    scheduled_for=scheduled_for,
                    status=NotificationStatusEnumModel.PENDING.value
                )

                session.add(notification)
                await session.commit()

                logger.info(f"Created notification {notification.id} for user {target_user_id}")

                return CreateNotificationResponse(
                    success=True,
                    message="Notification created successfully",
                    notification=notification_queue_to_graphql(notification)
                )

        except Exception as e:
            logger.error(f"Error creating notification: {e}")
            return CreateNotificationResponse(
                success=False,
                error=f"Failed to create notification: {str(e)}"
            )

    @strawberry.mutation
    async def mark_notification_read(
        self,
        notification_id: strawberry.ID,
        action: str,  # "opened", "clicked", "dismissed"
        info: Info
    ) -> MutationResponse:
        """Mark notification as opened, clicked, or dismissed"""
        try:
            user = await require_context_user(info)
            user_id = user.id

            async for session in get_async_session():
                # Find the delivery log entry for this notification
                log_query = select(NotificationDeliveryLogModel).where(
                    and_(
                        NotificationDeliveryLogModel.id == uuid.UUID(notification_id),
                        NotificationDeliveryLogModel.user_id == user_id
                    )
                )
                log_result = await session.execute(log_query)
                delivery_log = log_result.scalar_one_or_none()

                if not delivery_log:
                    return MutationResponse(
                        success=False,
                        error="Notification not found"
                    )

                # Update the appropriate timestamp
                current_time = datetime.now(timezone.utc)

                if action == "opened":
                    delivery_log.opened_at = current_time
                elif action == "clicked":
                    delivery_log.clicked_at = current_time
                elif action == "dismissed":
                    delivery_log.dismissed_at = current_time
                else:
                    return MutationResponse(
                        success=False,
                        error="Action must be 'opened', 'clicked', or 'dismissed'"
                    )

                await session.commit()

                logger.info(f"Marked notification {notification_id} as {action} for user {user_id}")

                return MutationResponse(
                    success=True,
                    message=f"Notification marked as {action}"
                )

        except Exception as e:
            logger.error(f"Error marking notification as read: {e}")
            return MutationResponse(
                success=False,
                error=f"Failed to mark notification: {str(e)}"
            )

    @strawberry.mutation
    async def test_notification(
        self,
        message: str,
        info: Info
    ) -> TestNotificationResponse:
        """Send test notification (development only)"""
        try:
            user = await require_context_user(info)
            user_id = user.id

            # Only allow in development
            from app.config.settings import settings
            if not settings.DEBUG:
                return TestNotificationResponse(
                    success=False,
                    error="Test notifications only available in development mode"
                )

            async for session in get_async_session():
                # Get user preferences
                prefs = await get_or_create_notification_preferences(user_id, session)

                # Create test audit log
                delivery_log = await create_audit_log(
                    user_id=user_id,
                    notification_type="system_update",
                    priority="optional",
                    channel="push",
                    title="Test Notification",
                    message=message,
                    delivery_status="sent",
                    session=session,
                    preferences_id=prefs.id,
                    external_id="test-notification-dev",
                    processing_time_ms=150
                )

                await session.commit()

                logger.info(f"Sent test notification to user {user_id}")

                return TestNotificationResponse(
                    success=True,
                    message="Test notification sent successfully",
                    test_sent=True,
                    delivery_log=notification_delivery_log_to_graphql(delivery_log)
                )

        except Exception as e:
            logger.error(f"Error sending test notification: {e}")
            return TestNotificationResponse(
                success=False,
                error=f"Failed to send test notification: {str(e)}",
                test_sent=False
            )