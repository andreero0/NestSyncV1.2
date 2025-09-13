#!/usr/bin/env python3
"""
Fix Child-Parent Association
Fixes the child ID synchronization issue by correcting parent_id associations
"""

import asyncio
import sys
import uuid
from datetime import datetime, timezone
from app.config.database import create_database_engines, get_async_session
from app.models.user import User
from app.models.child import Child
from app.models.inventory import InventoryItem
from app.models.inventory import UsageLog
from sqlalchemy import select, update

async def fix_child_parent_associations():
    """Fix the child-parent associations for the problematic user"""
    
    print("Initializing database connections...")
    create_database_engines()
    
    # Target user email and child IDs
    target_user_email = "parents@nestsync.com"
    orphaned_child_id = "0961f7cb-5c48-433a-984d-44910ff24f7e"  # Child with inventory data
    existing_child_id = "38e5b650-62f6-4305-aecf-41187514bd54"   # Child returned by MY_CHILDREN_QUERY
    
    async for session in get_async_session():
        try:
            # Get the target user
            user_query = select(User).where(User.email == target_user_email)
            user_result = await session.execute(user_query)
            user = user_result.scalar_one_or_none()
            
            if not user:
                print(f"ERROR: User {target_user_email} not found")
                return False
                
            print(f"Found user: {user.id} ({user.email})")
            
            # Get the orphaned child with inventory data
            orphaned_child_query = select(Child).where(
                Child.id == uuid.UUID(orphaned_child_id),
                Child.is_deleted == False
            )
            orphaned_child_result = await session.execute(orphaned_child_query)
            orphaned_child = orphaned_child_result.scalar_one_or_none()
            
            if not orphaned_child:
                print(f"ERROR: Orphaned child {orphaned_child_id} not found")
                return False
                
            print(f"Found orphaned child: {orphaned_child.id} ('{orphaned_child.name}') - Current parent: {orphaned_child.parent_id}")
            
            # Get the existing child
            existing_child_query = select(Child).where(
                Child.id == uuid.UUID(existing_child_id),
                Child.is_deleted == False
            )
            existing_child_result = await session.execute(existing_child_query)
            existing_child = existing_child_result.scalar_one_or_none()
            
            if existing_child:
                print(f"Found existing child: {existing_child.id} ('{existing_child.name}') - Parent: {existing_child.parent_id}")
            
            # Check inventory and usage data for the orphaned child
            inventory_count_query = select(InventoryItem).where(
                InventoryItem.child_id == uuid.UUID(orphaned_child_id),
                InventoryItem.is_deleted == False
            )
            inventory_result = await session.execute(inventory_count_query)
            inventory_items = inventory_result.scalars().all()
            
            usage_logs_count_query = select(UsageLog).where(
                UsageLog.child_id == uuid.UUID(orphaned_child_id),
                UsageLog.is_deleted == False
            )
            usage_logs_result = await session.execute(usage_logs_count_query)
            usage_logs = usage_logs_result.scalars().all()
            
            print(f"Orphaned child has {len(inventory_items)} inventory items and {len(usage_logs)} usage logs")
            
            # SOLUTION: Transfer ownership of the orphaned child to the target user
            print(f"\nTransferring ownership of child '{orphaned_child.name}' to user {user.id}...")
            
            # Update the child's parent_id
            orphaned_child.parent_id = user.id
            orphaned_child.updated_at = datetime.now(timezone.utc)
            
            # Commit the changes
            await session.commit()
            await session.refresh(orphaned_child)
            
            print(f"✅ Successfully transferred child '{orphaned_child.name}' to user {user.email}")
            print(f"   Child ID: {orphaned_child.id}")
            print(f"   New parent ID: {orphaned_child.parent_id}")
            print(f"   Inventory items: {len(inventory_items)}")
            print(f"   Usage logs: {len(usage_logs)}")
            
            # Verify the fix by checking MY_CHILDREN_QUERY results
            print("\nVerifying fix...")
            children_query = select(Child).where(
                Child.parent_id == user.id,
                Child.is_deleted == False
            )
            children_result = await session.execute(children_query)
            children = children_result.scalars().all()
            
            print(f"User now has {len(children)} children:")
            for child in children:
                print(f"  - {child.id} ('{child.name}')")
                
            return True
            
        except Exception as e:
            print(f"ERROR: {e}")
            await session.rollback()
            return False

if __name__ == "__main__":
    success = asyncio.run(fix_child_parent_associations())
    if success:
        print("\n🎉 Child-parent association fix completed successfully!")
        print("The frontend should now show inventory data correctly.")
    else:
        print("\n❌ Fix failed. Please check the error messages above.")
        sys.exit(1)