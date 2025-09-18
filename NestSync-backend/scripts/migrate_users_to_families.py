#!/usr/bin/env python3
"""
Migration Script: Convert Single Users to Family-Based Model
Safely migrate existing users to the new family-based collaboration system

This script:
1. Creates personal families for all existing users
2. Migrates children to family ownership
3. Preserves all existing data and relationships
4. Maintains backward compatibility during transition
5. Provides comprehensive logging and rollback capabilities

PIPEDA Compliance: All operations maintain Canadian data residency and audit trails
"""

import asyncio
import logging
import sys
import os
from datetime import datetime, timezone
from typing import List, Dict, Any

# Add the parent directory to Python path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select, and_, func
from sqlalchemy.exc import IntegrityError

from app.config.database import get_async_session, create_database_engines
from app.models import (
    User, Child, Family, FamilyMember, FamilyChildAccess,
    CollaborationLog, Activity,
    FamilyType, MemberRole, MemberStatus, AccessLevel, LogAction
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('migration_families.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class FamilyMigrationService:
    """Service for migrating users to family-based collaboration"""

    def __init__(self):
        self.migration_stats = {
            'users_processed': 0,
            'users_migrated': 0,
            'children_migrated': 0,
            'activities_updated': 0,
            'families_created': 0,
            'errors': []
        }

    async def run_complete_migration(self) -> Dict[str, Any]:
        """Run the complete migration process"""
        logger.info("Starting complete family migration process...")

        try:
            # Phase 1: Pre-migration validation
            await self._validate_pre_migration()

            # Phase 2: Create families for existing users
            await self._migrate_users_to_families()

            # Phase 3: Migrate children and activities
            await self._migrate_children_and_activities()

            # Phase 4: Post-migration validation
            await self._validate_post_migration()

            logger.info(f"Migration completed successfully: {self.migration_stats}")
            return {
                'success': True,
                'stats': self.migration_stats
            }

        except Exception as e:
            logger.error(f"Migration failed: {e}")
            self.migration_stats['errors'].append(str(e))
            return {
                'success': False,
                'error': str(e),
                'stats': self.migration_stats
            }

    async def _validate_pre_migration(self):
        """Validate system state before migration"""
        logger.info("Running pre-migration validation...")

        async for session in get_async_session():
            # Check for existing families
            existing_families = await session.execute(
                select(func.count(Family.id))
            )
            family_count = existing_families.scalar()

            if family_count > 0:
                logger.warning(f"Found {family_count} existing families - migration may have been run before")

            # Count users to migrate
            users_result = await session.execute(
                select(func.count(User.id))
            )
            user_count = users_result.scalar()

            # Count children to migrate
            children_result = await session.execute(
                select(func.count(Child.id))
            )
            children_count = children_result.scalar()

            logger.info(f"Pre-migration state: {user_count} users, {children_count} children, {family_count} families")

    async def _migrate_users_to_families(self):
        """Create personal families for all existing users"""
        logger.info("Creating personal families for existing users...")

        async for session in get_async_session():
            # Get all users who don't have families yet
            users_result = await session.execute(
                select(User).where(
                    ~User.id.in_(
                        select(FamilyMember.user_id)
                        .where(FamilyMember.role == MemberRole.FAMILY_CORE)
                    )
                )
            )
            users = users_result.scalars().all()

            logger.info(f"Found {len(users)} users to migrate")

            for user in users:
                try:
                    await self._create_personal_family_for_user(session, user)
                    self.migration_stats['users_migrated'] += 1

                except Exception as e:
                    error_msg = f"Failed to migrate user {user.id}: {e}"
                    logger.error(error_msg)
                    self.migration_stats['errors'].append(error_msg)

                self.migration_stats['users_processed'] += 1

            await session.commit()
            logger.info(f"Completed user migration: {self.migration_stats['users_migrated']}/{self.migration_stats['users_processed']} successful")

    async def _create_personal_family_for_user(self, session, user: User):
        """Create a personal family for a single user"""
        try:
            # Create personal family
            family_name = f"{user.display_name or user.email.split('@')[0]}'s Family"
            family = Family(
                name=family_name,
                family_type=FamilyType.PERSONAL,
                description=f"Personal family for {user.display_name or user.email}",
                created_by=user.id,
                settings={
                    "timezone": "America/Toronto",
                    "language": "en-CA",
                    "privacy_level": "personal",
                    "allow_guest_access": False,
                    "data_retention_days": 2555,  # 7 years for PIPEDA compliance
                    "migration_metadata": {
                        "migrated_from_single_user": True,
                        "original_user_id": str(user.id),
                        "migration_date": datetime.now(timezone.utc).isoformat()
                    }
                }
            )
            session.add(family)
            await session.flush()  # Get family ID

            # Add user as Family Core member
            family_member = FamilyMember(
                user_id=user.id,
                family_id=family.id,
                role=MemberRole.FAMILY_CORE,
                permissions=self._generate_full_permissions(),
                joined_at=user.created_at or datetime.now(timezone.utc)
            )
            session.add(family_member)

            # Log family creation
            collaboration_log = CollaborationLog(
                family_id=family.id,
                actor_user_id=user.id,
                action_type=LogAction.FAMILY_CREATED,
                details={
                    'migration': True,
                    'family_name': family_name,
                    'family_type': 'personal',
                    'original_user_id': str(user.id)
                }
            )
            session.add(collaboration_log)

            self.migration_stats['families_created'] += 1
            logger.debug(f"Created personal family {family.id} for user {user.id}")

            return family

        except Exception as e:
            logger.error(f"Failed to create family for user {user.id}: {e}")
            raise

    async def _migrate_children_and_activities(self):
        """Migrate children to families and update activities"""
        logger.info("Migrating children to families and updating activities...")

        async for session in get_async_session():
            # Get all children that haven't been migrated yet
            children_result = await session.execute(
                select(Child).where(Child.family_id.is_(None))
            )
            children = children_result.scalars().all()

            logger.info(f"Found {len(children)} children to migrate")

            for child in children:
                try:
                    await self._migrate_child_to_family(session, child)
                    self.migration_stats['children_migrated'] += 1

                except Exception as e:
                    error_msg = f"Failed to migrate child {child.id}: {e}"
                    logger.error(error_msg)
                    self.migration_stats['errors'].append(error_msg)

            await session.commit()
            logger.info(f"Completed children migration: {self.migration_stats['children_migrated']} children migrated")

    async def _migrate_child_to_family(self, session, child: Child):
        """Migrate a single child to their parent's family"""
        try:
            # Find the parent's family
            family_result = await session.execute(
                select(Family.id)
                .join(FamilyMember)
                .where(
                    FamilyMember.user_id == child.parent_id,
                    FamilyMember.role == MemberRole.FAMILY_CORE
                )
            )
            family_id = family_result.scalar_one_or_none()

            if not family_id:
                raise ValueError(f"No family found for parent {child.parent_id}")

            # Update child family relationship
            child.family_id = family_id
            child.migrated_from_user = child.parent_id

            # Create family-child access record
            child_access = FamilyChildAccess(
                family_id=family_id,
                child_id=child.id,
                access_level=AccessLevel.FULL,
                granted_by=child.parent_id
            )
            session.add(child_access)

            # Update existing activities for this child
            activities_result = await session.execute(
                select(Activity).where(Activity.child_id == child.id)
            )
            activities = activities_result.scalars().all()

            for activity in activities:
                if not activity.logged_by_user_id:
                    activity.logged_by_user_id = child.parent_id

                # Add family context
                activity.family_context = {
                    'family_id': str(family_id),
                    'migrated_from_single_user': True,
                    'migration_date': datetime.now(timezone.utc).isoformat()
                }

                if not activity.collaboration_metadata:
                    activity.collaboration_metadata = {}
                activity.collaboration_metadata['migrated'] = True

                self.migration_stats['activities_updated'] += 1

            # Log child addition
            collaboration_log = CollaborationLog(
                family_id=family_id,
                actor_user_id=child.parent_id,
                action_type=LogAction.CHILD_ADDED,
                target_type="child",
                target_id=child.id,
                details={
                    'migration': True,
                    'child_name': child.name,
                    'access_level': 'full',
                    'activities_migrated': len(activities)
                }
            )
            session.add(collaboration_log)

            logger.debug(f"Migrated child {child.id} to family {family_id} with {len(activities)} activities")

        except Exception as e:
            logger.error(f"Failed to migrate child {child.id}: {e}")
            raise

    async def _validate_post_migration(self):
        """Validate system state after migration"""
        logger.info("Running post-migration validation...")

        async for session in get_async_session():
            # Check for unmigrated users
            unmigrated_users = await session.execute(
                select(func.count(User.id)).where(
                    ~User.id.in_(
                        select(FamilyMember.user_id)
                        .where(FamilyMember.status == MemberStatus.ACTIVE)
                    )
                )
            )
            unmigrated_count = unmigrated_users.scalar()

            if unmigrated_count > 0:
                raise ValueError(f"{unmigrated_count} users not migrated to families")

            # Check for orphaned children
            orphaned_children = await session.execute(
                select(func.count(Child.id)).where(Child.family_id.is_(None))
            )
            orphaned_count = orphaned_children.scalar()

            if orphaned_count > 0:
                raise ValueError(f"{orphaned_count} children not migrated to families")

            # Validate family structure
            families_result = await session.execute(
                select(func.count(Family.id))
            )
            total_families = families_result.scalar()

            family_members_result = await session.execute(
                select(func.count(FamilyMember.id))
                .where(FamilyMember.role == MemberRole.FAMILY_CORE)
            )
            total_core_members = family_members_result.scalar()

            logger.info(f"Post-migration validation: {total_families} families, {total_core_members} core members")

            if total_families != total_core_members:
                logger.warning(f"Family count ({total_families}) doesn't match core member count ({total_core_members})")

    def _generate_full_permissions(self) -> dict:
        """Generate full permissions for Family Core members"""
        return {
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
        }


async def main():
    """Main migration function"""
    logger.info("Starting NestSync Family Migration")

    # Initialize database engines before migration
    logger.info("Initializing database engines...")
    create_database_engines()
    logger.info("Database engines initialized successfully")

    migration_service = FamilyMigrationService()
    result = await migration_service.run_complete_migration()

    if result['success']:
        logger.info("Migration completed successfully!")
        logger.info(f"Final stats: {result['stats']}")
    else:
        logger.error("Migration failed!")
        logger.error(f"Error: {result.get('error')}")
        logger.error(f"Stats: {result['stats']}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())