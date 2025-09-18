#!/usr/bin/env python3
"""
Check database state for validation
"""
import sys
import os
sys.path.append('/Users/mayenikhalo/Public/From aEroPartition/Dev/NestSyncv1.2/NestSync-backend')

from sqlalchemy import text
from app.config.database import create_database_engines, get_sync_session

def check_database_state():
    # Initialize database engines
    create_database_engines()

    with get_sync_session() as session:
        print("=== EMMA CHILD CONSOLIDATION CHECK ===")

        # Check children for the test user
        result = session.execute(text('''
            SELECT c.id, c.name, c.parent_id, c.is_deleted, c.created_at
            FROM children c
            JOIN users u ON c.parent_id = u.id
            WHERE u.email = 'parents@nestsync.com'
            ORDER BY c.created_at
        '''))
        children = result.fetchall()
        print(f'Total children found: {len(children)}')

        active_children = [c for c in children if not c.is_deleted]
        deleted_children = [c for c in children if c.is_deleted]

        print(f'Active children: {len(active_children)}')
        print(f'Deleted children: {len(deleted_children)}')

        for child in active_children:
            print(f'  ACTIVE - ID: {child.id}, Name: {child.name}, Created: {child.created_at}')

        for child in deleted_children:
            print(f'  DELETED - ID: {child.id}, Name: {child.name}, Created: {child.created_at}')

        print("\n=== FAMILY COLLABORATION CHECK ===")

        # Check families for the test user
        result = session.execute(text('''
            SELECT f.id, f.name, f.family_type, fm.role
            FROM families f
            JOIN family_members fm ON f.id = fm.family_id
            JOIN users u ON fm.user_id = u.id
            WHERE u.email = 'parents@nestsync.com'
        '''))
        families = result.fetchall()
        print(f'Families found: {len(families)}')

        for family in families:
            print(f'  Family - ID: {family.id}, Name: {family.name}, Type: {family.family_type}, Role: {family.role}')

        print("\n=== USER CHECK ===")

        # Check user details
        result = session.execute(text('''
            SELECT id, email, status, email_verified, onboarding_completed
            FROM users
            WHERE email = 'parents@nestsync.com'
        '''))
        user = result.fetchone()
        if user:
            print(f'User - ID: {user.id}, Email: {user.email}, Status: {user.status}')
            print(f'Email Verified: {user.email_verified}, Onboarding: {user.onboarding_completed}')
        else:
            print('User not found!')

if __name__ == "__main__":
    check_database_state()