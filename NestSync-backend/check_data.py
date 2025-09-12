#!/usr/bin/env python3
import asyncio
import os
import sys
from app.config.database import create_database_engines, get_async_session
from app.models import Child, User
from sqlalchemy import select

async def check_data():
    try:
        # Initialize database
        create_database_engines()
        
        async for session in get_async_session():
            print("=== INVESTIGATING PARENT-CHILD DATA MISMATCH ===")
            
            # Find child with ID we know exists
            print(f"1. Looking for child ID: 38e5b650-62f6-4305-aecf-41187514bd54")
            child_result = await session.execute(
                select(Child).where(Child.id == '38e5b650-62f6-4305-aecf-41187514bd54')
            )
            child = child_result.scalar_one_or_none()
            
            if child:
                print(f"   ✅ Child found: {child.name}")
                print(f"   📍 Child parent_id: {child.parent_id}")
                print(f"   🗑️ Child is_deleted: {child.is_deleted}")
                
                # Find the parent user
                parent_result = await session.execute(
                    select(User).where(User.id == child.parent_id)
                )
                parent = parent_result.scalar_one_or_none()
                if parent:
                    print(f"   👤 Parent: {parent.email} (id: {parent.id})")
                else:
                    print(f"   ❌ Parent NOT found for child's parent_id: {child.parent_id}")
                    
            else:
                print("   ❌ Child with known ID not found")
            
            print()
            print("2. Checking current authenticated user from logs...")
            # Check current authenticated user
            current_user_result = await session.execute(
                select(User).where(User.id == '7e99068d-8d2b-4c6e-b259-a95503ae2e79')
            )
            current_user = current_user_result.scalar_one_or_none()
            if current_user:
                print(f"   ✅ Current user: {current_user.email}")
                print(f"   📍 Current user ID: {current_user.id}")
            else:
                print("   ❌ Current authenticated user not found")
                
            print()
            print("3. Looking for user with email parents@nestsync.com...")
            # Check if there's a different user with parents@nestsync.com email
            email_user_result = await session.execute(
                select(User).where(User.email == 'parents@nestsync.com')
            )
            email_user = email_user_result.scalar_one_or_none()
            if email_user:
                print(f"   ✅ Found user with email: {email_user.email}")
                print(f"   📍 User ID: {email_user.id}")
                
                # Check if this user has children
                children_result = await session.execute(
                    select(Child).where(
                        Child.parent_id == email_user.id,
                        Child.is_deleted == False
                    )
                )
                children = children_result.scalars().all()
                print(f"   👶 Children count for this user: {len(children)}")
                for child in children:
                    print(f"      - {child.name} (id: {child.id})")
                    
            else:
                print("   ❌ No user found with email parents@nestsync.com")
                
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(check_data())