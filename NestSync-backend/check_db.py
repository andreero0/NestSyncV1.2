#!/usr/bin/env python3

import asyncio
from app.config.database import get_async_session
from sqlalchemy import text

async def check_tables():
    async for session in get_async_session():
        # Check if notification tables exist
        result = await session.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%notification%'"))
        tables = result.fetchall()
        print('Notification tables:', [t[0] for t in tables])

        # Check if notification_preferences table has any records
        if any('notification_preferences' in t[0] for t in tables):
            result = await session.execute(text("SELECT COUNT(*) FROM notification_preferences"))
            count = result.fetchone()[0]
            print(f'Records in notification_preferences: {count}')

            # Check if our test user has preferences
            result = await session.execute(text("SELECT id, critical_notifications FROM notification_preferences WHERE user_id = (SELECT id FROM users WHERE email = 'parents@nestsync.com')"))
            user_prefs = result.fetchall()
            print(f'Test user preferences: {user_prefs}')
        break

if __name__ == "__main__":
    asyncio.run(check_tables())