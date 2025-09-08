#!/usr/bin/env python3
"""
Fix user status for authentication testing
"""

import asyncio
import uuid
import os
import sys

# Add the app directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import select
from app.config.database import create_database_engines, get_async_session
from app.models import User


async def fix_user_status():
    """Fix the test user's status to allow login"""
    
    # Initialize database engines
    create_database_engines()
    
    async for session in get_async_session():
        # Find the test user
        user_id = uuid.UUID('81d16db5-1e88-4080-9435-f64cd5343bb3')
        result = await session.execute(
            select(User).where(User.supabase_user_id == user_id)
        )
        user = result.scalar_one_or_none()
        
        if user:
            print(f"Found user: {user.email}")
            print(f"Current status: {user.status}")
            print(f"Email verified: {user.email_verified}")
            print(f"Is locked: {user.is_locked}")
            print(f"Can login: {user.can_login}")
            
            # Fix the user status to allow login
            user.status = 'active'
            user.email_verified = True
            user.failed_login_attempts = 0
            user.locked_until = None
            
            await session.commit()
            await session.refresh(user)
            
            print("\n✓ User status fixed!")
            print(f"New status: {user.status}")
            print(f"Email verified: {user.email_verified}")
            print(f"Can login: {user.can_login}")
            
        else:
            print(f"❌ User not found with Supabase ID: {user_id}")


if __name__ == "__main__":
    asyncio.run(fix_user_status())