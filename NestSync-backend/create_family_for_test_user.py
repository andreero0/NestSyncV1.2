#!/usr/bin/env python3
"""
Create Family Records for Test User parents@nestsync.com

This script creates the necessary family infrastructure for the test user
to enable collaboration features testing.
"""

import asyncio
import logging
import sys
import uuid
from datetime import datetime, timezone
from typing import Optional

# Import backend infrastructure
sys.path.append('/Users/mayenikhalo/Public/From aEroPartition/Dev/NestSyncv1.2/NestSync-backend')

from app.config.database import init_database, get_async_session
from app.models.user import User
from app.models.child import Child
from app.models.collaboration import (
    Family, FamilyMember, FamilyChildAccess,
    FamilyType, MemberRole, MemberStatus, AccessLevel
)
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

TEST_USER_EMAIL = "parents@nestsync.com"
FAMILY_NAME = "Sarah Chen's Family"


async def get_user_by_email(session, email: str) -> Optional[User]:
    """Get user by email address"""
    try:
        result = await session.execute(
            select(User).where(
                User.email == email,
                User.is_deleted == False
            )
        )
        return result.scalar_one_or_none()
    except Exception as e:
        logger.error(f"Error fetching user by email {email}: {e}")
        return None


async def get_user_children(session, user_id: uuid.UUID) -> list[Child]:
    """Get all children for a user"""
    try:
        result = await session.execute(
            select(Child).where(
                Child.parent_id == user_id,
                Child.is_deleted == False
            )
        )
        return result.scalars().all()
    except Exception as e:
        logger.error(f"Error fetching children for user {user_id}: {e}")
        return []


async def check_existing_family(session, user_id: uuid.UUID) -> Optional[Family]:
    """Check if user already has a family"""
    try:
        result = await session.execute(
            select(Family)
            .join(FamilyMember)
            .where(
                FamilyMember.user_id == user_id,
                Family.is_deleted == False
            )
        )
        return result.scalar_one_or_none()
    except Exception as e:
        logger.error(f"Error checking existing family for user {user_id}: {e}")
        return None


async def create_family_record(session, user_id: uuid.UUID) -> Family:
    """Create a new family record"""
    family = Family(
        id=uuid.uuid4(),
        name=FAMILY_NAME,
        family_type=FamilyType.PERSONAL,
        description="Default family for collaboration and sharing",
        created_by=user_id,
        settings={}
    )

    session.add(family)
    await session.flush()  # Get the ID without committing
    logger.info(f"Created family record: {family.id}")
    return family


async def create_family_membership(session, family_id: uuid.UUID, user_id: uuid.UUID) -> FamilyMember:
    """Create family membership for the user"""
    member = FamilyMember(
        id=uuid.uuid4(),
        family_id=family_id,
        user_id=user_id,
        role=MemberRole.FAMILY_CORE,
        status=MemberStatus.ACTIVE,
        permissions={
            "can_view_all_data": True,
            "can_edit_children": True,
            "can_manage_inventory": True,
            "can_invite_members": True
        },
        joined_at=datetime.now(timezone.utc),
        granted_by=user_id  # Self-granted as family creator
    )

    session.add(member)
    await session.flush()
    logger.info(f"Created family membership: {member.id}")
    return member


async def create_child_access(session, family_id: uuid.UUID, child_id: uuid.UUID, user_id: uuid.UUID) -> FamilyChildAccess:
    """Create child access record for the family"""
    access = FamilyChildAccess(
        id=uuid.uuid4(),
        family_id=family_id,
        child_id=child_id,
        access_level=AccessLevel.FULL,
        granted_at=datetime.now(timezone.utc),
        granted_by=user_id,
        permissions={
            "can_view": True,
            "can_edit": True,
            "can_manage": True
        }
    )

    session.add(access)
    await session.flush()
    logger.info(f"Created child access record: {access.id} for child {child_id}")
    return access


async def verify_family_setup(session, user_id: uuid.UUID) -> bool:
    """Verify that the family setup is complete and working"""
    try:
        # Check family membership
        family_result = await session.execute(
            select(Family, FamilyMember)
            .join(FamilyMember)
            .where(
                FamilyMember.user_id == user_id,
                Family.is_deleted == False,
                FamilyMember.status == MemberStatus.ACTIVE
            )
        )
        family_data = family_result.first()

        if not family_data:
            logger.error("No active family membership found")
            return False

        family, member = family_data
        logger.info(f"✓ Family membership verified: {family.name} (Role: {member.role})")

        # Check child access
        child_access_result = await session.execute(
            select(Child, FamilyChildAccess)
            .join(FamilyChildAccess, Child.id == FamilyChildAccess.child_id)
            .where(
                FamilyChildAccess.family_id == family.id,
                Child.is_deleted == False
            )
        )
        child_access_data = child_access_result.all()

        if not child_access_data:
            logger.warning("No child access records found")
        else:
            for child, access in child_access_data:
                logger.info(f"✓ Child access verified: {child.name} (Access: {access.access_level})")

        return True

    except Exception as e:
        logger.error(f"Error verifying family setup: {e}")
        return False


async def main():
    """Main execution function"""
    try:
        # Initialize database
        logger.info("Initializing database connection...")
        await init_database()

        # Start transaction
        async for session in get_async_session():
            try:
                # Step 1: Get user by email
                logger.info(f"Looking up user: {TEST_USER_EMAIL}")
                user = await get_user_by_email(session, TEST_USER_EMAIL)

                if not user:
                    logger.error(f"User {TEST_USER_EMAIL} not found!")
                    return False

                logger.info(f"✓ Found user: {user.email} (ID: {user.id})")

                # Step 2: Check if family already exists
                existing_family = await check_existing_family(session, user.id)
                if existing_family:
                    logger.warning(f"User already has a family: {existing_family.name}")
                    # Verify the setup anyway
                    verified = await verify_family_setup(session, user.id)
                    return verified

                # Step 3: Get user's children
                children = await get_user_children(session, user.id)
                logger.info(f"Found {len(children)} children for user")
                for child in children:
                    logger.info(f"  - {child.name} (ID: {child.id})")

                # Step 4: Create family record
                logger.info("Creating family record...")
                family = await create_family_record(session, user.id)

                # Step 5: Create family membership
                logger.info("Creating family membership...")
                member = await create_family_membership(session, family.id, user.id)

                # Step 6: Create child access records
                for child in children:
                    logger.info(f"Creating access record for child: {child.name}")
                    await create_child_access(session, family.id, child.id, user.id)

                # Commit all changes
                await session.commit()
                logger.info("✓ All family records created successfully!")

                # Step 7: Verify the setup
                logger.info("Verifying family setup...")
                verified = await verify_family_setup(session, user.id)

                if verified:
                    logger.info("🎉 Family creation completed successfully!")
                    logger.info(f"Family: {FAMILY_NAME}")
                    logger.info(f"User: {user.email} (Role: FAMILY_CORE)")
                    logger.info(f"Children linked: {len(children)}")
                    return True
                else:
                    logger.error("Family setup verification failed")
                    return False

            except IntegrityError as e:
                await session.rollback()
                logger.error(f"Database integrity error: {e}")
                return False
            except Exception as e:
                await session.rollback()
                logger.error(f"Error during family creation: {e}")
                return False

    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        return False


if __name__ == "__main__":
    success = asyncio.run(main())
    if success:
        print("\n✅ SUCCESS: Family records created for parents@nestsync.com")
        print("The user should now see their family in the collaboration features.")
    else:
        print("\n❌ FAILED: Could not create family records")
        sys.exit(1)