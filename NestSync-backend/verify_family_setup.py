#!/usr/bin/env python3
"""
Verify Family Setup for Test User parents@nestsync.com

This script verifies the family structure is correct and provides detailed information
about the family, membership, and child access records.
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
from sqlalchemy import select, text
from sqlalchemy.orm import selectinload

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

TEST_USER_EMAIL = "parents@nestsync.com"


async def verify_family_setup_detailed(session) -> dict:
    """Comprehensive verification of family setup"""
    result = {
        "user": None,
        "families": [],
        "children": [],
        "issues": []
    }

    try:
        # Get user
        user_result = await session.execute(
            select(User).where(
                User.email == TEST_USER_EMAIL,
                User.is_deleted == False
            )
        )
        user = user_result.scalar_one_or_none()

        if not user:
            result["issues"].append("Test user not found")
            return result

        result["user"] = {
            "id": str(user.id),
            "email": user.email,
            "display_name": user.display_name,
            "onboarding_completed": user.onboarding_completed
        }

        # Get families with detailed information
        family_result = await session.execute(
            select(Family, FamilyMember)
            .join(FamilyMember)
            .where(
                FamilyMember.user_id == user.id,
                Family.is_deleted == False
            )
            .options(
                selectinload(Family.children_access),
                selectinload(Family.members)
            )
        )
        family_data = family_result.all()

        for family, member in family_data:
            family_info = {
                "id": str(family.id),
                "name": family.name,
                "family_type": family.family_type.value,
                "created_by": str(family.created_by),
                "member_role": member.role.value,
                "member_status": member.status.value,
                "joined_at": member.joined_at.isoformat(),
                "permissions": member.permissions,
                "children_access": []
            }

            # Get child access for this family
            child_access_result = await session.execute(
                select(Child, FamilyChildAccess)
                .join(FamilyChildAccess, Child.id == FamilyChildAccess.child_id)
                .where(
                    FamilyChildAccess.family_id == family.id,
                    Child.is_deleted == False
                )
            )
            child_access_data = child_access_result.all()

            for child, access in child_access_data:
                child_access_info = {
                    "child_id": str(child.id),
                    "child_name": child.name,
                    "access_level": access.access_level.value,
                    "granted_at": access.granted_at.isoformat(),
                    "granted_by": str(access.granted_by),
                    "permissions": getattr(access, 'permissions', {})
                }
                family_info["children_access"].append(child_access_info)

            result["families"].append(family_info)

        # Get all children for the user
        children_result = await session.execute(
            select(Child).where(
                Child.parent_id == user.id,
                Child.is_deleted == False
            )
        )
        children = children_result.scalars().all()

        for child in children:
            child_info = {
                "id": str(child.id),
                "name": child.name,
                "date_of_birth": child.date_of_birth.isoformat() if child.date_of_birth else None,
                "gender": child.gender,
                "current_diaper_size": child.current_diaper_size,
                "parent_id": str(child.parent_id),
                "family_id": str(child.family_id) if child.family_id else None,
                "onboarding_completed": child.onboarding_completed
            }
            result["children"].append(child_info)

        # Validate structure
        if not result["families"]:
            result["issues"].append("No families found for user")

        if not result["children"]:
            result["issues"].append("No children found for user")

        for family in result["families"]:
            if not family["children_access"]:
                result["issues"].append(f"Family '{family['name']}' has no child access records")

        # Check MY_FAMILIES_QUERY compatibility
        families_query_result = await session.execute(
            text("""
            SELECT
                f.id as family_id,
                f.name as family_name,
                f.family_type,
                fm.role as user_role,
                fm.status as member_status,
                COUNT(fca.child_id) as child_count
            FROM families f
            JOIN family_members fm ON f.id = fm.family_id
            LEFT JOIN family_child_access fca ON f.id = fca.family_id
            WHERE fm.user_id = :user_id
            AND f.is_deleted = false
            AND fm.status = 'ACTIVE'
            GROUP BY f.id, f.name, f.family_type, fm.role, fm.status
            ORDER BY f.created_at DESC
            """),
            {"user_id": user.id}
        )

        my_families_data = families_query_result.fetchall()
        result["my_families_query"] = [
            {
                "family_id": str(row.family_id),
                "family_name": row.family_name,
                "family_type": row.family_type,
                "user_role": row.user_role,
                "member_status": row.member_status,
                "child_count": row.child_count
            }
            for row in my_families_data
        ]

        return result

    except Exception as e:
        logger.error(f"Error during verification: {e}")
        result["issues"].append(f"Verification error: {str(e)}")
        return result


async def main():
    """Main execution function"""
    try:
        logger.info("Initializing database connection...")
        await init_database()

        async for session in get_async_session():
            logger.info(f"Verifying family setup for: {TEST_USER_EMAIL}")
            result = await verify_family_setup_detailed(session)

            print("\n" + "="*80)
            print("FAMILY SETUP VERIFICATION REPORT")
            print("="*80)

            # User information
            if result["user"]:
                user = result["user"]
                print(f"\n✓ USER: {user['email']}")
                print(f"  ID: {user['id']}")
                print(f"  Display Name: {user['display_name']}")
                print(f"  Onboarding: {'✓ Complete' if user['onboarding_completed'] else '⚠ Incomplete'}")
            else:
                print(f"\n❌ USER: Not found")
                return False

            # Family information
            print(f"\n📋 FAMILIES ({len(result['families'])})")
            for family in result["families"]:
                print(f"  ✓ {family['name']}")
                print(f"    ID: {family['id']}")
                print(f"    Type: {family['family_type']}")
                print(f"    Role: {family['member_role']}")
                print(f"    Status: {family['member_status']}")
                print(f"    Joined: {family['joined_at']}")
                print(f"    Permissions: {list(family['permissions'].keys())}")

                if family["children_access"]:
                    print(f"    Child Access ({len(family['children_access'])}):")
                    for access in family["children_access"]:
                        print(f"      - {access['child_name']}: {access['access_level']}")
                else:
                    print(f"    ⚠ No child access records")

            # Children information
            print(f"\n👶 CHILDREN ({len(result['children'])})")
            for child in result["children"]:
                print(f"  ✓ {child['name']}")
                print(f"    ID: {child['id']}")
                print(f"    Birth Date: {child['date_of_birth']}")
                print(f"    Gender: {child['gender']}")
                print(f"    Diaper Size: {child['current_diaper_size']}")
                print(f"    Family Link: {child['family_id'] or 'None'}")
                print(f"    Onboarding: {'✓ Complete' if child['onboarding_completed'] else '⚠ Incomplete'}")

            # MY_FAMILIES_QUERY result
            print(f"\n🔍 MY_FAMILIES_QUERY RESULT ({len(result['my_families_query'])})")
            for family in result["my_families_query"]:
                print(f"  ✓ {family['family_name']}")
                print(f"    ID: {family['family_id']}")
                print(f"    Type: {family['family_type']}")
                print(f"    Role: {family['user_role']}")
                print(f"    Status: {family['member_status']}")
                print(f"    Children: {family['child_count']}")

            # Issues
            if result["issues"]:
                print(f"\n⚠ ISSUES FOUND ({len(result['issues'])})")
                for issue in result["issues"]:
                    print(f"  - {issue}")
            else:
                print(f"\n✅ NO ISSUES FOUND")

            print("\n" + "="*80)

            # Summary
            is_valid = (
                result["user"] is not None and
                len(result["families"]) > 0 and
                len(result["children"]) > 0 and
                len(result["my_families_query"]) > 0 and
                len(result["issues"]) == 0
            )

            if is_valid:
                print("🎉 FAMILY SETUP IS COMPLETE AND VALID")
                print("The user should be able to access collaboration features.")
            else:
                print("❌ FAMILY SETUP HAS ISSUES")
                print("Collaboration features may not work properly.")

            return is_valid

    except Exception as e:
        logger.error(f"Failed to verify family setup: {e}")
        return False


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)