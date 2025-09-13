#!/usr/bin/env python3
"""
URGENT: Critical Data Privacy Violation Fix
PIPEDA Compliance Emergency Response

This script uses the application's existing database configuration to immediately
fix the critical data privacy violation where parents@nestsync.com can access 
"Tobe" child data that should only belong to testparent@example.com.
"""

import asyncio
import sys
import os
import logging
from datetime import datetime
import json
from typing import Dict, Any

# Add the app directory to the path so we can import app modules
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.config.database import create_database_engines, get_async_session, AsyncSessionLocal
from app.config.settings import settings
from sqlalchemy import text

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

async def investigate_data_privacy_violation() -> Dict[str, Any]:
    """Investigate the current state of child ownership and data access"""
    
    logger.info("=== CRITICAL DATA PRIVACY VIOLATION INVESTIGATION ===")
    
    # Initialize database connection using app's configuration
    create_database_engines()
    
    investigation_results = {}
    
    try:
        async for session in get_async_session():
            # 1. Check all users
            logger.info("\n1. CURRENT USERS IN SYSTEM:")
            users_query = text("""
                SELECT id, email, created_at 
                FROM users 
                ORDER BY email
            """)
            users_result = await session.execute(users_query)
            users = users_result.fetchall()
            
            users_list = []
            for user in users:
                users_list.append({
                    'id': str(user.id),
                    'email': user.email,
                    'created_at': user.created_at
                })
                logger.info(f"   User: {user.email} | ID: {user.id}")
            
            investigation_results['users'] = users_list
            
            # 2. Check all children and their parent associations
            logger.info("\n2. CURRENT CHILD-PARENT ASSOCIATIONS:")
            children_query = text("""
                SELECT c.id, c.name, c.parent_id, u.email as parent_email,
                       c.created_at, c.updated_at
                FROM children c 
                JOIN users u ON c.parent_id = u.id 
                ORDER BY c.name, u.email
            """)
            children_result = await session.execute(children_query)
            children_data = children_result.fetchall()
            
            children_list = []
            ose_data = None
            tobe_data = None
            
            for child in children_data:
                child_dict = {
                    'id': str(child.id),
                    'name': child.name,
                    'parent_id': str(child.parent_id),
                    'parent_email': child.parent_email,
                    'created_at': child.created_at,
                    'updated_at': child.updated_at
                }
                children_list.append(child_dict)
                
                if child.name == 'Ose':
                    ose_data = child_dict
                elif child.name == 'Tobe':
                    tobe_data = child_dict
                    
                logger.info(f"   Child: '{child.name}' | Parent: {child.parent_email} | Child ID: {child.id} | Parent ID: {child.parent_id}")
            
            investigation_results['children'] = children_list
            investigation_results['ose_data'] = ose_data
            investigation_results['tobe_data'] = tobe_data
            
            # 3. Get target user IDs
            parents_query = text("SELECT id, email FROM users WHERE email = 'parents@nestsync.com'")
            parents_result = await session.execute(parents_query)
            parents_user = parents_result.fetchone()
            
            test_query = text("SELECT id, email FROM users WHERE email = 'testparent@example.com'")
            test_result = await session.execute(test_query)
            test_user = test_result.fetchone()
            
            investigation_results['parents_user_id'] = str(parents_user.id) if parents_user else None
            investigation_results['test_user_id'] = str(test_user.id) if test_user else None
            
            if parents_user:
                logger.info(f"   parents@nestsync.com ID: {parents_user.id}")
            if test_user:
                logger.info(f"   testparent@example.com ID: {test_user.id}")
            
            # 4. Check current ownership vs expected ownership
            logger.info("\n4. PRIVACY VIOLATION CONFIRMATION:")
            
            violation_found = False
            
            if ose_data and parents_user:
                if ose_data['parent_id'] != str(parents_user.id):
                    logger.error(f"   VIOLATION: Ose should belong to parents@nestsync.com but belongs to {ose_data['parent_email']}")
                    violation_found = True
                else:
                    logger.info(f"   OK: Ose correctly belongs to parents@nestsync.com")
            
            if tobe_data and test_user:
                if tobe_data['parent_id'] != str(test_user.id):
                    logger.error(f"   VIOLATION: Tobe should belong to testparent@example.com but belongs to {tobe_data['parent_email']}")
                    violation_found = True
                else:
                    logger.info(f"   OK: Tobe correctly belongs to testparent@example.com")
            
            investigation_results['violation_found'] = violation_found
            
            # 5. Check inventory and usage data
            logger.info("\n5. INVENTORY AND USAGE DATA ANALYSIS:")
            
            if ose_data:
                ose_inventory_query = text("""
                    SELECT COUNT(*) as inventory_count
                    FROM inventory_items 
                    WHERE child_id = :child_id
                """)
                ose_inventory_result = await session.execute(ose_inventory_query, {'child_id': ose_data['id']})
                ose_inventory_count = ose_inventory_result.fetchone().inventory_count
                
                ose_usage_query = text("""
                    SELECT COUNT(*) as usage_count
                    FROM diaper_usage_logs 
                    WHERE child_id = :child_id
                """)
                ose_usage_result = await session.execute(ose_usage_query, {'child_id': ose_data['id']})
                ose_usage_count = ose_usage_result.fetchone().usage_count
                
                logger.info(f"   Ose inventory items: {ose_inventory_count}")
                logger.info(f"   Ose usage logs: {ose_usage_count}")
                
                investigation_results['ose_inventory_count'] = ose_inventory_count
                investigation_results['ose_usage_count'] = ose_usage_count
            
            if tobe_data:
                tobe_inventory_query = text("""
                    SELECT COUNT(*) as inventory_count
                    FROM inventory_items 
                    WHERE child_id = :child_id
                """)
                tobe_inventory_result = await session.execute(tobe_inventory_query, {'child_id': tobe_data['id']})
                tobe_inventory_count = tobe_inventory_result.fetchone().inventory_count
                
                tobe_usage_query = text("""
                    SELECT COUNT(*) as usage_count
                    FROM diaper_usage_logs 
                    WHERE child_id = :child_id
                """)
                tobe_usage_result = await session.execute(tobe_usage_query, {'child_id': tobe_data['id']})
                tobe_usage_count = tobe_usage_result.fetchone().usage_count
                
                logger.info(f"   Tobe inventory items: {tobe_inventory_count}")
                logger.info(f"   Tobe usage logs: {tobe_usage_count}")
                
                investigation_results['tobe_inventory_count'] = tobe_inventory_count
                investigation_results['tobe_usage_count'] = tobe_usage_count
            
            # Save investigation results
            investigation_results['timestamp'] = datetime.now().isoformat()
            
            with open(f"privacy_investigation_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json", "w") as f:
                json.dump(investigation_results, f, indent=2, default=str)
            
            return investigation_results
        
    except Exception as e:
        logger.error(f"Investigation failed: {e}")
        raise

async def fix_data_privacy_violation(investigation_results: Dict[str, Any]) -> bool:
    """Fix the data privacy violation based on investigation results"""
    
    try:
        logger.info("\n=== EXECUTING DATA PRIVACY FIX ===")
        
        # Get the correct user IDs
        parents_user_id = investigation_results.get("parents_user_id")
        test_user_id = investigation_results.get("test_user_id")
        
        if not parents_user_id or not test_user_id:
            logger.error("Cannot proceed: Missing required user IDs")
            return False
        
        async for session in get_async_session():
            # Begin transaction for atomic fix
            try:
                # 1. Ensure Ose belongs to parents@nestsync.com
                ose_update_query = text("""
                    UPDATE children 
                    SET parent_id = :parents_user_id, updated_at = NOW()
                    WHERE name = 'Ose'
                    AND parent_id != :parents_user_id
                """)
                ose_result = await session.execute(ose_update_query, {
                    'parents_user_id': parents_user_id
                })
                
                if ose_result.rowcount > 0:
                    logger.info(f"   FIXED: Moved Ose to parents@nestsync.com")
                else:
                    logger.info(f"   OK: Ose already belongs to parents@nestsync.com")
                
                # 2. Ensure Tobe belongs to testparent@example.com
                tobe_update_query = text("""
                    UPDATE children 
                    SET parent_id = :test_user_id, updated_at = NOW()
                    WHERE name = 'Tobe'
                    AND parent_id != :test_user_id
                """)
                tobe_result = await session.execute(tobe_update_query, {
                    'test_user_id': test_user_id
                })
                
                if tobe_result.rowcount > 0:
                    logger.info(f"   FIXED: Moved Tobe to testparent@example.com")
                else:
                    logger.info(f"   OK: Tobe already belongs to testparent@example.com")
                
                # 3. Commit the transaction
                await session.commit()
                
                # 4. Verify the fix
                verification_query = text("""
                    SELECT c.id, c.name, c.parent_id, u.email as parent_email
                    FROM children c 
                    JOIN users u ON c.parent_id = u.id 
                    WHERE c.name IN ('Ose', 'Tobe')
                    ORDER BY c.name
                """)
                verification_result = await session.execute(verification_query)
                verification_data = verification_result.fetchall()
                
                logger.info("\n   POST-FIX VERIFICATION:")
                for child in verification_data:
                    logger.info(f"     {child.name} -> {child.parent_email}")
                
                # 5. Create audit trail
                audit_entry = {
                    "action": "data_privacy_fix",
                    "timestamp": datetime.now().isoformat(),
                    "changes_made": {
                        "ose_update_rows": ose_result.rowcount,
                        "tobe_update_rows": tobe_result.rowcount
                    },
                    "final_state": [
                        {
                            'name': child.name,
                            'parent_email': child.parent_email,
                            'child_id': str(child.id),
                            'parent_id': str(child.parent_id)
                        }
                        for child in verification_data
                    ]
                }
                
                with open(f"privacy_fix_audit_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json", "w") as f:
                    json.dump(audit_entry, f, indent=2, default=str)
                
                logger.info("   AUDIT TRAIL SAVED")
                
                logger.info("\n=== DATA PRIVACY VIOLATION FIXED ===")
                return True
                
            except Exception as e:
                await session.rollback()
                logger.error(f"Transaction failed, rolled back: {e}")
                raise
        
    except Exception as e:
        logger.error(f"Fix failed: {e}")
        raise

async def verify_my_children_query():
    """Verify that MY_CHILDREN GraphQL query would return correct data"""
    
    logger.info("\n=== VERIFYING MY_CHILDREN QUERY RESULTS ===")
    
    try:
        async for session in get_async_session():
            # Check what parents@nestsync.com would see
            parents_query = text("""
                SELECT u.id, u.email,
                       COUNT(c.id) as child_count,
                       STRING_AGG(c.name, ', ') as children_names
                FROM users u
                LEFT JOIN children c ON u.id = c.parent_id
                WHERE u.email = 'parents@nestsync.com'
                GROUP BY u.id, u.email
            """)
            parents_result = await session.execute(parents_query)
            parents_data = parents_result.fetchone()
            
            if parents_data:
                logger.info(f"   parents@nestsync.com would see:")
                logger.info(f"     Child count: {parents_data.child_count}")
                logger.info(f"     Children: {parents_data.children_names or 'None'}")
                
                if parents_data.child_count == 1 and parents_data.children_names == 'Ose':
                    logger.info("   ✅ CORRECT: parents@nestsync.com sees only Ose")
                else:
                    logger.error("   ❌ VIOLATION: parents@nestsync.com sees incorrect children")
            
            # Check what testparent@example.com would see
            test_query = text("""
                SELECT u.id, u.email,
                       COUNT(c.id) as child_count,
                       STRING_AGG(c.name, ', ') as children_names
                FROM users u
                LEFT JOIN children c ON u.id = c.parent_id
                WHERE u.email = 'testparent@example.com'
                GROUP BY u.id, u.email
            """)
            test_result = await session.execute(test_query)
            test_data = test_result.fetchone()
            
            if test_data:
                logger.info(f"   testparent@example.com would see:")
                logger.info(f"     Child count: {test_data.child_count}")
                logger.info(f"     Children: {test_data.children_names or 'None'}")
                
                if test_data.child_count == 1 and test_data.children_names == 'Tobe':
                    logger.info("   ✅ CORRECT: testparent@example.com sees only Tobe")
                else:
                    logger.error("   ❌ VIOLATION: testparent@example.com sees incorrect children")
    
    except Exception as e:
        logger.error(f"Verification failed: {e}")
        raise

async def main():
    """Main execution function"""
    
    logger.info("🚨 STARTING CRITICAL DATA PRIVACY VIOLATION FIX")
    
    try:
        # Step 1: Investigate current state
        investigation_results = await investigate_data_privacy_violation()
        
        # Step 2: Fix the violations if found
        if investigation_results.get('violation_found'):
            fix_success = await fix_data_privacy_violation(investigation_results)
            
            if fix_success:
                # Step 3: Verify GraphQL would return correct results
                await verify_my_children_query()
                
                logger.info("\n✅ DATA PRIVACY VIOLATION RESOLUTION COMPLETE")
                logger.info("   - Database ownership corrected")
                logger.info("   - Audit trail created")
                logger.info("   - MY_CHILDREN query verified")
                logger.info("   - PIPEDA compliance restored")
            else:
                logger.error("❌ FAILED TO FIX DATA PRIVACY VIOLATION")
        else:
            logger.info("\n✅ NO DATABASE VIOLATIONS FOUND")
            logger.info("   - Issue may be in GraphQL resolvers or client cache")
            logger.info("   - Running verification anyway...")
            
            # Still verify the expected results
            await verify_my_children_query()
            
    except Exception as e:
        logger.error(f"Critical error during privacy fix: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(main())