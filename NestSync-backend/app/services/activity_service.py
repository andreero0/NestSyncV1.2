"""
Activity Service for Collaboration Features
Handles activity logging with conflict detection and family context
"""

import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from sqlalchemy import select, and_, or_, func
from sqlalchemy.orm import selectinload, joinedload

from app.config.database import get_async_session
from app.models import (
    Activity, Child, User, Family, FamilyMember, CaregiverPresence,
    CollaborationLog, ActivityType, LogAction
)
from app.services.collaboration_service import CollaborationLogService

logger = logging.getLogger(__name__)


class ActivityCollaborationService:
    """Service for handling collaborative activity logging"""

    @staticmethod
    async def log_activity_with_collaboration(
        child_id: str,
        activity_type: str,
        logged_by_user_id: str,
        family_id: str = None,
        logged_at: datetime = None,
        notes: str = None,
        activity_metadata: dict = None,
        device_info: dict = None
    ) -> Dict[str, Any]:
        """
        Log activity with collaboration features including conflict detection
        """
        async for session in get_async_session():
            try:
                # Get child and family information
                child = await session.get(Child, child_id)
                if not child:
                    raise ValueError("Child not found")

                # Use child's family if not provided
                if not family_id:
                    family_id = str(child.family_id) if child.family_id else None

                # Check for potential conflicts
                conflict_info = await ActivityCollaborationService._detect_activity_conflicts(
                    session, child_id, activity_type, logged_at or datetime.now(timezone.utc)
                )

                # Create activity with collaboration context
                activity = Activity(
                    child_id=child_id,
                    activity_type=activity_type,
                    logged_at=logged_at or datetime.now(timezone.utc),
                    logged_by_user_id=logged_by_user_id,
                    notes=notes,
                    activity_metadata=activity_metadata or {},
                    family_context={
                        'family_id': family_id,
                        'family_context': bool(family_id),
                        'logged_via_collaboration': True,
                        'device_info': device_info
                    } if family_id else {},
                    collaboration_metadata={}
                )

                # Handle conflicts if detected
                if conflict_info['has_conflict']:
                    activity.collaboration_metadata.update({
                        'conflict_detected': True,
                        'conflicting_activities': conflict_info['conflicting_activities'],
                        'conflict_resolution': conflict_info['resolution_type'],
                        'resolved_at': datetime.now(timezone.utc).isoformat()
                    })

                session.add(activity)
                await session.flush()

                # Log collaboration action if in family context
                if family_id:
                    await CollaborationLogService.log_action(
                        session=session,
                        family_id=family_id,
                        actor_user_id=logged_by_user_id,
                        action_type=LogAction.ACTIVITY_LOGGED,
                        target_type="activity",
                        target_id=str(activity.id),
                        details={
                            'activity_type': activity_type,
                            'child_id': child_id,
                            'conflict_detected': conflict_info['has_conflict'],
                            'conflict_resolution': conflict_info.get('resolution_type')
                        }
                    )

                # Update caregiver presence
                if family_id:
                    await ActivityCollaborationService._update_caregiver_activity_presence(
                        session, logged_by_user_id, family_id, child_id, activity_type
                    )

                await session.commit()

                return {
                    'success': True,
                    'activity_id': str(activity.id),
                    'conflict_detected': conflict_info['has_conflict'],
                    'conflict_resolution': conflict_info.get('resolution_type'),
                    'message': 'Activity logged successfully'
                }

            except Exception as e:
                await session.rollback()
                logger.error(f"Failed to log activity: {e}")
                raise

    @staticmethod
    async def _detect_activity_conflicts(
        session,
        child_id: str,
        activity_type: str,
        logged_at: datetime
    ) -> Dict[str, Any]:
        """Detect potential conflicts with other recent activities"""
        conflict_window = timedelta(minutes=30)  # Configurable conflict detection window

        # Get recent activities of the same type
        recent_activities = await session.execute(
            select(Activity)
            .options(selectinload(Activity.logged_by))
            .where(
                Activity.child_id == child_id,
                Activity.activity_type == activity_type,
                Activity.logged_at.between(
                    logged_at - conflict_window,
                    logged_at + conflict_window
                )
            )
            .order_by(Activity.logged_at.desc())
        )
        activities = recent_activities.scalars().all()

        if not activities:
            return {
                'has_conflict': False,
                'conflicting_activities': [],
                'resolution_type': None
            }

        # Analyze conflicts based on activity type
        conflict_analysis = ActivityCollaborationService._analyze_activity_conflicts(
            activities, activity_type, logged_at
        )

        return conflict_analysis

    @staticmethod
    def _analyze_activity_conflicts(
        activities: List[Activity],
        activity_type: str,
        new_activity_time: datetime
    ) -> Dict[str, Any]:
        """Analyze conflicts and determine resolution strategy"""

        if activity_type == "diaper_change":
            # For diaper changes, conflicts are unlikely but possible if:
            # 1. Multiple caregivers log same change within 5 minutes
            # 2. Different logged times for same physical change
            close_activities = [
                a for a in activities
                if abs((a.logged_at - new_activity_time).total_seconds()) <= 300  # 5 minutes
            ]

            if close_activities:
                return {
                    'has_conflict': True,
                    'conflicting_activities': [str(a.id) for a in close_activities],
                    'resolution_type': 'duplicate_detection',
                    'resolution_action': 'keep_most_detailed'
                }

        elif activity_type in ["feeding", "sleep"]:
            # For feeding/sleep, overlapping times are more problematic
            for activity in activities:
                # Check for overlapping duration activities
                activity_duration = activity.duration_minutes or 30  # Default 30 min
                new_activity_end = new_activity_time + timedelta(minutes=activity_duration)
                existing_end = activity.logged_at + timedelta(minutes=activity_duration)

                # Check for overlap
                if (new_activity_time < existing_end and new_activity_end > activity.logged_at):
                    return {
                        'has_conflict': True,
                        'conflicting_activities': [str(activity.id)],
                        'resolution_type': 'time_overlap',
                        'resolution_action': 'adjust_timing'
                    }

        return {
            'has_conflict': False,
            'conflicting_activities': [],
            'resolution_type': None
        }

    @staticmethod
    async def _update_caregiver_activity_presence(
        session,
        user_id: str,
        family_id: str,
        child_id: str,
        activity_type: str
    ):
        """Update caregiver presence based on activity logging"""
        try:
            # Get or create presence record
            presence = await session.execute(
                select(CaregiverPresence)
                .where(
                    CaregiverPresence.user_id == user_id,
                    CaregiverPresence.family_id == family_id
                )
            )
            presence_record = presence.scalar_one_or_none()

            current_activity = f"Logged {activity_type} for child"

            if presence_record:
                presence_record.child_id = child_id
                presence_record.current_activity = current_activity
                presence_record.last_seen = datetime.now(timezone.utc)
                presence_record.status = "caring"
            else:
                new_presence = CaregiverPresence(
                    user_id=user_id,
                    family_id=family_id,
                    child_id=child_id,
                    status="caring",
                    current_activity=current_activity,
                    last_seen=datetime.now(timezone.utc),
                    device_info={}
                )
                session.add(new_presence)

        except Exception as e:
            logger.warning(f"Failed to update presence: {e}")
            # Don't fail the activity logging if presence update fails

    @staticmethod
    async def get_family_activity_feed(
        family_id: str,
        user_id: str,
        limit: int = 50,
        child_id: str = None,
        activity_types: List[str] = None,
        start_date: datetime = None,
        end_date: datetime = None
    ) -> List[Activity]:
        """Get activity feed for family with proper permissions"""
        async for session in get_async_session():
            # Verify user has access to family
            member = await session.execute(
                select(FamilyMember)
                .where(
                    FamilyMember.user_id == user_id,
                    FamilyMember.family_id == family_id,
                    FamilyMember.status == "active"
                )
            )
            if not member.scalar_one_or_none():
                raise PermissionError("User does not have access to this family")

            # Build query based on permissions and filters
            query = select(Activity).options(
                selectinload(Activity.child),
                selectinload(Activity.logged_by)
            )

            # Family context filter
            query = query.where(
                or_(
                    Activity.family_context['family_id'].astext == family_id,
                    Activity.child_id.in_(
                        select(child.id)
                        .select_from(Child)
                        .where(Child.family_id == family_id)
                    )
                )
            )

            # Apply additional filters
            if child_id:
                query = query.where(Activity.child_id == child_id)

            if activity_types:
                query = query.where(Activity.activity_type.in_(activity_types))

            if start_date:
                query = query.where(Activity.logged_at >= start_date)

            if end_date:
                query = query.where(Activity.logged_at <= end_date)

            # Apply role-based restrictions
            member_data = member.scalar_one()
            if member_data.role == "institutional":
                # Institutional users can only see current day
                query = query.where(
                    func.date(Activity.logged_at) == func.current_date()
                )

            query = query.order_by(Activity.logged_at.desc()).limit(limit)

            result = await session.execute(query)
            return result.scalars().all()

    @staticmethod
    async def resolve_activity_conflict(
        activity_id: str,
        resolution_type: str,
        resolved_by_user_id: str,
        resolution_notes: str = None
    ) -> Dict[str, Any]:
        """Manually resolve activity conflicts"""
        async for session in get_async_session():
            try:
                activity = await session.get(Activity, activity_id)
                if not activity:
                    raise ValueError("Activity not found")

                # Update conflict resolution
                if not activity.collaboration_metadata:
                    activity.collaboration_metadata = {}

                activity.collaboration_metadata.update({
                    'conflict_resolved': True,
                    'resolution_type': resolution_type,
                    'resolved_by': resolved_by_user_id,
                    'resolved_at': datetime.now(timezone.utc).isoformat(),
                    'resolution_notes': resolution_notes
                })

                # Log resolution action
                if activity.family_context.get('family_id'):
                    await CollaborationLogService.log_action(
                        session=session,
                        family_id=activity.family_context['family_id'],
                        actor_user_id=resolved_by_user_id,
                        action_type=LogAction.ACTIVITY_LOGGED,
                        target_type="activity_conflict",
                        target_id=activity_id,
                        details={
                            'action': 'conflict_resolved',
                            'resolution_type': resolution_type,
                            'resolution_notes': resolution_notes
                        }
                    )

                await session.commit()

                return {
                    'success': True,
                    'message': 'Conflict resolved successfully'
                }

            except Exception as e:
                await session.rollback()
                logger.error(f"Failed to resolve conflict: {e}")
                raise


# =============================================================================
# Export Service
# =============================================================================

__all__ = ["ActivityCollaborationService"]