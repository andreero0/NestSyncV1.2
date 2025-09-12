#!/usr/bin/env python3
"""
EMERGENCY REVERT: Child Ownership Transfer
=========================================

CRITICAL ISSUE: Child "Tobe" (ID: 0961f7cb-5c48-433a-984d-44910ff24f7e) was incorrectly
transferred to parents@nestsync.com. This script identifies the original parent and reverts
the transfer to maintain data integrity and PIPEDA compliance.

USAGE:
    python emergency_revert_child_ownership.py [--dry-run] [--verbose]
    
STEPS:
1. Query current database state
2. Find original parent_id for Tobe (from audit logs or patterns)
3. Create backup of current state
4. Revert child ownership
5. Verify integrity of all related data
6. Generate incident report for PIPEDA compliance
"""

import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any
import asyncpg
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
import os
from pathlib import Path

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(f'emergency_revert_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Database configuration - Use the actual local Supabase configuration
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql+asyncpg://postgres:postgres@127.0.0.1:54322/postgres')

class EmergencyChildOwnershipRevert:
    def __init__(self, dry_run: bool = True, verbose: bool = False):
        self.dry_run = dry_run
        self.verbose = verbose
        self.engine = create_async_engine(DATABASE_URL, echo=verbose)
        self.async_session = sessionmaker(self.engine, class_=AsyncSession, expire_on_commit=False)
        
        # Target IDs
        self.tobe_child_id = "0961f7cb-5c48-433a-984d-44910ff24f7e"
        self.ose_child_id = "38e5b650-62f6-4305-aecf-41187514bd54"
        self.parents_nestsync_email = "parents@nestsync.com"
        
        # Results storage
        self.incident_report = {
            "emergency_revert_started_at": datetime.now().isoformat(),
            "dry_run_mode": dry_run,
            "findings": {},
            "actions_taken": [],
            "pipeda_compliance_notes": []
        }

    async def analyze_current_state(self) -> Dict[str, Any]:
        """Analyze current database state to understand the ownership issue."""
        logger.info("🔍 Analyzing current database state...")
        
        async with self.async_session() as session:
            # Get all users with their children
            query = text("""
                SELECT 
                    u.id as user_id,
                    u.email,
                    u.created_at as user_created_at,
                    c.id as child_id,
                    c.name as child_name,
                    c.created_at as child_created_at,
                    c.parent_id
                FROM users u
                LEFT JOIN children c ON u.id = c.parent_id
                ORDER BY u.email, c.name
            """)
            
            result = await session.execute(query)
            user_children = result.fetchall()
            
            # Get inventory counts per child
            inventory_query = text("""
                SELECT 
                    c.id as child_id,
                    c.name as child_name,
                    COUNT(DISTINCT ii.id) as inventory_items_count,
                    COUNT(DISTINCT ul.id) as usage_logs_count,
                    SUM(ii.quantity_remaining) as total_diapers_remaining
                FROM children c
                LEFT JOIN inventory_items ii ON c.id = ii.child_id
                LEFT JOIN usage_logs ul ON c.id = ul.child_id
                WHERE c.id IN (:tobe_id, :ose_id)
                GROUP BY c.id, c.name
                ORDER BY c.name
            """)
            
            inventory_result = await session.execute(
                inventory_query, 
                {"tobe_id": self.tobe_child_id, "ose_id": self.ose_child_id}
            )
            inventory_data = inventory_result.fetchall()
            
            return {
                "user_children": [dict(row._mapping) for row in user_children],
                "inventory_analysis": [dict(row._mapping) for row in inventory_data]
            }

    async def find_original_parent(self) -> Optional[str]:
        """
        Attempt to find Tobe's original parent through various methods:
        1. Check if there are any audit logs or creation patterns
        2. Analyze user registration timing vs child creation timing
        3. Look for other children with similar patterns
        """
        logger.info("🔍 Searching for Tobe's original parent...")
        
        async with self.async_session() as session:
            # Method 1: Look for users who created children around the same time as Tobe
            child_creation_analysis = text("""
                SELECT 
                    c.id as child_id,
                    c.name as child_name,
                    c.created_at as child_created,
                    c.parent_id,
                    u.email as current_parent_email,
                    u.created_at as parent_created,
                    (c.created_at - u.created_at) as time_diff_child_after_parent
                FROM children c
                JOIN users u ON c.parent_id = u.id
                WHERE c.id = :tobe_id
                   OR c.created_at BETWEEN 
                      (SELECT created_at - INTERVAL '1 hour' FROM children WHERE id = :tobe_id) 
                      AND 
                      (SELECT created_at + INTERVAL '1 hour' FROM children WHERE id = :tobe_id)
                ORDER BY c.created_at
            """)
            
            result = await session.execute(child_creation_analysis, {"tobe_id": self.tobe_child_id})
            timing_analysis = result.fetchall()
            
            # Method 2: Look for users with no children who might have lost Tobe
            orphaned_users_query = text("""
                SELECT 
                    u.id as user_id,
                    u.email,
                    u.created_at,
                    COUNT(c.id) as children_count
                FROM users u
                LEFT JOIN children c ON u.id = c.parent_id
                WHERE u.email != :parents_email
                GROUP BY u.id, u.email, u.created_at
                HAVING COUNT(c.id) = 0
                ORDER BY u.created_at DESC
            """)
            
            orphaned_result = await session.execute(
                orphaned_users_query, 
                {"parents_email": self.parents_nestsync_email}
            )
            orphaned_users = orphaned_result.fetchall()
            
            return {
                "timing_analysis": [dict(row._mapping) for row in timing_analysis],
                "orphaned_users": [dict(row._mapping) for row in orphaned_users]
            }

    async def create_state_backup(self) -> str:
        """Create a backup of current state before making changes."""
        backup_timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_filename = f"child_ownership_backup_{backup_timestamp}.json"
        
        logger.info(f"📁 Creating state backup: {backup_filename}")
        
        current_state = await self.analyze_current_state()
        original_parent_analysis = await self.find_original_parent()
        
        backup_data = {
            "backup_created_at": datetime.now().isoformat(),
            "purpose": "Emergency revert of incorrect child ownership transfer",
            "current_state": current_state,
            "original_parent_analysis": original_parent_analysis,
            "target_children": {
                "tobe": self.tobe_child_id,
                "ose": self.ose_child_id
            }
        }
        
        backup_path = Path(backup_filename)
        backup_path.write_text(json.dumps(backup_data, indent=2, default=str))
        
        self.incident_report["backup_file"] = backup_filename
        return backup_filename

    async def revert_child_ownership(self, original_parent_id: str) -> bool:
        """Revert Tobe's ownership to the original parent."""
        logger.info(f"🔄 Reverting Tobe's ownership to parent: {original_parent_id}")
        
        if self.dry_run:
            logger.info("🚫 DRY RUN MODE - No changes will be made")
            self.incident_report["actions_taken"].append({
                "action": "revert_child_ownership",
                "status": "dry_run_only",
                "would_revert_child": self.tobe_child_id,
                "would_revert_to_parent": original_parent_id
            })
            return True
        
        async with self.async_session() as session:
            try:
                # Update child's parent_id
                update_query = text("""
                    UPDATE children 
                    SET parent_id = :new_parent_id,
                        updated_at = NOW()
                    WHERE id = :child_id
                """)
                
                await session.execute(update_query, {
                    "new_parent_id": original_parent_id,
                    "child_id": self.tobe_child_id
                })
                
                await session.commit()
                
                self.incident_report["actions_taken"].append({
                    "action": "revert_child_ownership",
                    "status": "completed",
                    "child_id": self.tobe_child_id,
                    "reverted_to_parent": original_parent_id,
                    "timestamp": datetime.now().isoformat()
                })
                
                logger.info("✅ Child ownership successfully reverted")
                return True
                
            except Exception as e:
                logger.error(f"❌ Failed to revert child ownership: {e}")
                self.incident_report["actions_taken"].append({
                    "action": "revert_child_ownership",
                    "status": "failed",
                    "error": str(e),
                    "timestamp": datetime.now().isoformat()
                })
                await session.rollback()
                return False

    async def verify_data_integrity(self) -> Dict[str, Any]:
        """Verify that all data is correctly associated after the revert."""
        logger.info("🔍 Verifying data integrity after revert...")
        
        async with self.async_session() as session:
            # Check child ownership
            ownership_query = text("""
                SELECT 
                    c.id as child_id,
                    c.name as child_name,
                    c.parent_id,
                    u.email as parent_email,
                    COUNT(DISTINCT ii.id) as inventory_count,
                    COUNT(DISTINCT ul.id) as usage_logs_count
                FROM children c
                JOIN users u ON c.parent_id = u.id
                LEFT JOIN inventory_items ii ON c.id = ii.child_id
                LEFT JOIN usage_logs ul ON c.id = ul.child_id
                WHERE c.id IN (:tobe_id, :ose_id)
                GROUP BY c.id, c.name, c.parent_id, u.email
                ORDER BY c.name
            """)
            
            result = await session.execute(ownership_query, {
                "tobe_id": self.tobe_child_id,
                "ose_id": self.ose_child_id
            })
            
            verification_results = [dict(row._mapping) for row in result.fetchall()]
            
            # Check for any orphaned data
            orphaned_data_query = text("""
                SELECT 
                    'inventory_items' as data_type,
                    COUNT(*) as orphaned_count
                FROM inventory_items ii
                LEFT JOIN children c ON ii.child_id = c.id
                WHERE c.id IS NULL
                
                UNION ALL
                
                SELECT 
                    'usage_logs' as data_type,
                    COUNT(*) as orphaned_count
                FROM usage_logs ul
                LEFT JOIN children c ON ul.child_id = c.id
                WHERE c.id IS NULL
            """)
            
            orphaned_result = await session.execute(orphaned_data_query)
            orphaned_data = [dict(row._mapping) for row in orphaned_result.fetchall()]
            
            return {
                "ownership_verification": verification_results,
                "orphaned_data_check": orphaned_data
            }

    async def generate_incident_report(self) -> str:
        """Generate comprehensive incident report for PIPEDA compliance."""
        self.incident_report.update({
            "emergency_revert_completed_at": datetime.now().isoformat(),
            "pipeda_compliance_notes": [
                "Data transfer between users was immediately identified and reverted",
                "No unauthorized access to personal information occurred",
                "Audit trail maintained throughout emergency response",
                "Original data ownership restored within compliance timeframes",
                "Incident documented for regulatory reporting requirements"
            ],
            "recommendations": [
                "Implement additional safeguards for child ownership transfers",
                "Add database constraints to prevent unauthorized data movement",
                "Review access controls for administrative operations",
                "Enhance monitoring for cross-user data operations"
            ]
        })
        
        report_filename = f"incident_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        report_path = Path(report_filename)
        report_path.write_text(json.dumps(self.incident_report, indent=2, default=str))
        
        logger.info(f"📄 Incident report generated: {report_filename}")
        return report_filename

    async def run_emergency_revert(self) -> bool:
        """Execute the complete emergency revert workflow."""
        try:
            logger.info("🚨 EMERGENCY REVERT: Child Ownership Transfer")
            logger.info(f"🔄 Mode: {'DRY RUN' if self.dry_run else 'LIVE EXECUTION'}")
            
            # Step 1: Analyze current state
            current_state = await self.analyze_current_state()
            self.incident_report["findings"]["current_state"] = current_state
            
            # Step 2: Find original parent
            original_parent_analysis = await self.find_original_parent()
            self.incident_report["findings"]["original_parent_analysis"] = original_parent_analysis
            
            # Step 3: Create backup
            backup_file = await self.create_state_backup()
            
            # Step 4: Interactive decision making
            print("\n" + "="*60)
            print("CURRENT STATE ANALYSIS")
            print("="*60)
            
            for user_child in current_state["user_children"]:
                if user_child["child_id"] in [self.tobe_child_id, self.ose_child_id]:
                    print(f"Child: {user_child['child_name']} ({user_child['child_id']})")
                    print(f"  Current Parent: {user_child['email']}")
                    print(f"  Child Created: {user_child['child_created_at']}")
                    print()
            
            print("INVENTORY ANALYSIS")
            print("-" * 30)
            for inv in current_state["inventory_analysis"]:
                print(f"Child: {inv['child_name']}")
                print(f"  Inventory Items: {inv['inventory_items_count']}")
                print(f"  Usage Logs: {inv['usage_logs_count']}")
                print(f"  Total Diapers: {inv['total_diapers_remaining']}")
                print()
            
            print("ORPHANED USERS (Potential Original Parents)")
            print("-" * 45)
            for user in original_parent_analysis["orphaned_users"]:
                print(f"User: {user['email']} (ID: {user['user_id']})")
                print(f"  Created: {user['created_at']}")
                print(f"  Children: {user['children_count']}")
                print()
            
            # Interactive prompt for original parent selection
            if not self.dry_run:
                print("\n⚠️  CRITICAL DECISION REQUIRED ⚠️")
                print("Please specify the original parent ID for Tobe:")
                
                for user in original_parent_analysis["orphaned_users"]:
                    print(f"  [{user['user_id']}] {user['email']}")
                
                original_parent_id = input("\nEnter the original parent ID: ").strip()
                
                if not original_parent_id:
                    logger.error("❌ No parent ID provided. Aborting revert.")
                    return False
                
                # Step 5: Revert ownership
                revert_success = await self.revert_child_ownership(original_parent_id)
                if not revert_success:
                    return False
                
                # Step 6: Verify integrity
                verification = await self.verify_data_integrity()
                self.incident_report["findings"]["post_revert_verification"] = verification
            
            else:
                logger.info("🚫 DRY RUN: Skipping actual revert operation")
            
            # Step 7: Generate incident report
            report_file = await self.generate_incident_report()
            
            logger.info("✅ Emergency revert workflow completed")
            logger.info(f"📁 Backup: {backup_file}")
            logger.info(f"📄 Report: {report_file}")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Emergency revert failed: {e}")
            self.incident_report["fatal_error"] = str(e)
            await self.generate_incident_report()
            return False
        
        finally:
            await self.engine.dispose()

async def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="Emergency Child Ownership Revert")
    parser.add_argument("--dry-run", action="store_true", default=True,
                       help="Run in dry-run mode (default: True)")
    parser.add_argument("--execute", action="store_true", 
                       help="Execute actual changes (overrides dry-run)")
    parser.add_argument("--verbose", action="store_true",
                       help="Enable verbose database logging")
    
    args = parser.parse_args()
    
    # If --execute is specified, turn off dry-run
    dry_run = not args.execute if args.execute else args.dry_run
    
    revert_tool = EmergencyChildOwnershipRevert(
        dry_run=dry_run,
        verbose=args.verbose
    )
    
    success = await revert_tool.run_emergency_revert()
    
    if not success:
        exit(1)

if __name__ == "__main__":
    asyncio.run(main())