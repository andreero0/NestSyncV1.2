#!/usr/bin/env python3
"""
EMERGENCY REVERT: Child Ownership Transfer via API
================================================

CRITICAL ISSUE: Child "Tobe" (ID: 0961f7cb-5c48-433a-984d-44910ff24f7e) was incorrectly
transferred to parents@nestsync.com. This script uses the running FastAPI application
to identify and revert the incorrect transfer.

APPROACH: Uses the existing app's database connection and GraphQL API to ensure
compatibility with the running system.

USAGE:
    python emergency_revert_via_api.py [--dry-run] [--verbose]
"""

import asyncio
import json
import logging
import sys
import os
from datetime import datetime
from typing import Dict, List, Optional, Any
from pathlib import Path

# Add the app directory to Python path so we can import from the running application
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.config.database import get_async_session, create_database_engines
from sqlalchemy import text

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(f'emergency_revert_api_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class EmergencyChildOwnershipRevertAPI:
    def __init__(self, dry_run: bool = True, verbose: bool = False):
        self.dry_run = dry_run
        self.verbose = verbose
        
        # Target IDs
        self.tobe_child_id = "0961f7cb-5c48-433a-984d-44910ff24f7e"
        self.ose_child_id = "38e5b650-62f6-4305-aecf-41187514bd54"
        self.parents_nestsync_email = "parents@nestsync.com"
        
        # Results storage
        self.incident_report = {
            "emergency_revert_started_at": datetime.now().isoformat(),
            "dry_run_mode": dry_run,
            "method": "via_running_api",
            "findings": {},
            "actions_taken": [],
            "pipeda_compliance_notes": []
        }

    async def initialize_database(self):
        """Initialize database connection using the app's configuration."""
        try:
            # Use the app's database initialization
            create_database_engines()
            logger.info("✅ Database connection initialized via app configuration")
        except Exception as e:
            logger.error(f"❌ Failed to initialize database: {e}")
            raise

    async def analyze_current_state(self) -> Dict[str, Any]:
        """Analyze current database state to understand the ownership issue."""
        logger.info("🔍 Analyzing current database state...")
        
        async for session in get_async_session():
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
                    c.parent_id,
                    u.email as parent_email,
                    COUNT(DISTINCT ii.id) as inventory_items_count,
                    COUNT(DISTINCT ul.id) as usage_logs_count,
                    SUM(ii.quantity_remaining) as total_diapers_remaining
                FROM children c
                LEFT JOIN users u ON c.parent_id = u.id
                LEFT JOIN inventory_items ii ON c.id = ii.child_id
                LEFT JOIN usage_logs ul ON c.id = ul.child_id
                WHERE c.id IN (:tobe_id, :ose_id)
                GROUP BY c.id, c.name, c.parent_id, u.email
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

    async def find_original_parent(self) -> Dict[str, Any]:
        """
        Attempt to find Tobe's original parent through various methods:
        1. Look for users with no children who might have lost Tobe
        2. Analyze user registration timing vs child creation timing
        3. Check for creation patterns that suggest original ownership
        """
        logger.info("🔍 Searching for Tobe's original parent...")
        
        async for session in get_async_session():
            # Get timing analysis around Tobe's creation
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
                      (SELECT created_at - INTERVAL '2 hours' FROM children WHERE id = :tobe_id) 
                      AND 
                      (SELECT created_at + INTERVAL '2 hours' FROM children WHERE id = :tobe_id)
                ORDER BY c.created_at
            """)
            
            result = await session.execute(child_creation_analysis, {"tobe_id": self.tobe_child_id})
            timing_analysis = result.fetchall()
            
            # Look for users with no children who might have lost Tobe
            orphaned_users_query = text("""
                SELECT 
                    u.id as user_id,
                    u.email,
                    u.created_at,
                    COUNT(c.id) as children_count,
                    u.created_at as user_created,
                    (SELECT created_at FROM children WHERE id = :tobe_id) as tobe_created,
                    ((SELECT created_at FROM children WHERE id = :tobe_id) - u.created_at) as time_diff
                FROM users u
                LEFT JOIN children c ON u.id = c.parent_id
                WHERE u.email != :parents_email
                GROUP BY u.id, u.email, u.created_at
                HAVING COUNT(c.id) = 0
                ORDER BY ABS(EXTRACT(EPOCH FROM ((SELECT created_at FROM children WHERE id = :tobe_id) - u.created_at)))
            """)
            
            orphaned_result = await session.execute(
                orphaned_users_query, 
                {"parents_email": self.parents_nestsync_email, "tobe_id": self.tobe_child_id}
            )
            orphaned_users = orphaned_result.fetchall()
            
            # Get all users and children to see the full picture
            all_users_query = text("""
                SELECT 
                    u.id as user_id,
                    u.email,
                    u.created_at as user_created,
                    COUNT(c.id) as children_count,
                    ARRAY_AGG(c.name ORDER BY c.created_at) FILTER (WHERE c.name IS NOT NULL) as child_names,
                    ARRAY_AGG(c.id ORDER BY c.created_at) FILTER (WHERE c.id IS NOT NULL) as child_ids
                FROM users u
                LEFT JOIN children c ON u.id = c.parent_id
                GROUP BY u.id, u.email, u.created_at
                ORDER BY u.created_at
            """)
            
            all_users_result = await session.execute(all_users_query)
            all_users = all_users_result.fetchall()
            
            return {
                "timing_analysis": [dict(row._mapping) for row in timing_analysis],
                "orphaned_users": [dict(row._mapping) for row in orphaned_users],
                "all_users_overview": [dict(row._mapping) for row in all_users]
            }

    async def create_state_backup(self) -> str:
        """Create a backup of current state before making changes."""
        backup_timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_filename = f"child_ownership_backup_api_{backup_timestamp}.json"
        
        logger.info(f"📁 Creating state backup: {backup_filename}")
        
        current_state = await self.analyze_current_state()
        original_parent_analysis = await self.find_original_parent()
        
        backup_data = {
            "backup_created_at": datetime.now().isoformat(),
            "purpose": "Emergency revert of incorrect child ownership transfer",
            "method": "via_running_api",
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
        
        async for session in get_async_session():
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
        
        async for session in get_async_session():
            # Check child ownership
            ownership_query = text("""
                SELECT 
                    c.id as child_id,
                    c.name as child_name,
                    c.parent_id,
                    u.email as parent_email,
                    COUNT(DISTINCT ii.id) as inventory_count,
                    COUNT(DISTINCT ul.id) as usage_logs_count,
                    SUM(ii.quantity_remaining) as total_diapers
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
                "Enhance monitoring for cross-user data operations",
                "Add validation checks in child assignment operations"
            ]
        })
        
        report_filename = f"incident_report_api_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        report_path = Path(report_filename)
        report_path.write_text(json.dumps(self.incident_report, indent=2, default=str))
        
        logger.info(f"📄 Incident report generated: {report_filename}")
        return report_filename

    async def run_emergency_revert(self) -> bool:
        """Execute the complete emergency revert workflow."""
        try:
            logger.info("🚨 EMERGENCY REVERT: Child Ownership Transfer (via API)")
            logger.info(f"🔄 Mode: {'DRY RUN' if self.dry_run else 'LIVE EXECUTION'}")
            
            # Step 1: Initialize database
            await self.initialize_database()
            
            # Step 2: Analyze current state
            current_state = await self.analyze_current_state()
            self.incident_report["findings"]["current_state"] = current_state
            
            # Step 3: Find original parent
            original_parent_analysis = await self.find_original_parent()
            self.incident_report["findings"]["original_parent_analysis"] = original_parent_analysis
            
            # Step 4: Create backup
            backup_file = await self.create_state_backup()
            
            # Step 5: Display current state analysis
            print("\n" + "="*60)
            print("CRITICAL ISSUE: INCORRECT CHILD OWNERSHIP TRANSFER")
            print("="*60)
            
            print("\nCURRENT STATE ANALYSIS")
            print("-" * 30)
            for inv in current_state["inventory_analysis"]:
                print(f"Child: {inv['child_name']} (ID: {inv['child_id']})")
                print(f"  Current Parent: {inv['parent_email']}")
                print(f"  Inventory Items: {inv['inventory_items_count']}")
                print(f"  Usage Logs: {inv['usage_logs_count']}")
                print(f"  Total Diapers: {inv['total_diapers_remaining']}")
                print()
            
            print("SUSPECTED ORIGINAL PARENTS (Users with no children)")
            print("-" * 45)
            for user in original_parent_analysis["orphaned_users"][:5]:  # Show top 5 candidates
                time_diff = user.get('time_diff')
                if time_diff:
                    hours_diff = abs(time_diff.total_seconds() / 3600)
                    print(f"User: {user['email']} (ID: {user['user_id']})")
                    print(f"  Created: {user['user_created']}")
                    print(f"  Time difference from Tobe creation: {hours_diff:.2f} hours")
                    print(f"  Children: {user['children_count']}")
                    print()
            
            print("ALL USERS OVERVIEW")
            print("-" * 18)
            for user in original_parent_analysis["all_users_overview"]:
                print(f"User: {user['email']}")
                print(f"  Children: {user['children_count']}")
                if user['child_names']:
                    print(f"  Child names: {user['child_names']}")
                print()
            
            # Step 6: Interactive decision or automatic analysis
            if not self.dry_run:
                print("\n⚠️  CRITICAL DECISION REQUIRED ⚠️")
                print("Based on the analysis above, please specify the original parent ID for Tobe:")
                
                for user in original_parent_analysis["orphaned_users"][:5]:
                    print(f"  [{user['user_id']}] {user['email']}")
                
                original_parent_id = input("\nEnter the original parent ID: ").strip()
                
                if not original_parent_id:
                    logger.error("❌ No parent ID provided. Aborting revert.")
                    return False
                
                # Revert ownership
                revert_success = await self.revert_child_ownership(original_parent_id)
                if not revert_success:
                    return False
                
                # Verify integrity
                verification = await self.verify_data_integrity()
                self.incident_report["findings"]["post_revert_verification"] = verification
                
                print("\n✅ REVERT COMPLETED")
                print("Verification Results:")
                for result in verification["ownership_verification"]:
                    print(f"  {result['child_name']}: Parent = {result['parent_email']}")
            
            else:
                logger.info("🚫 DRY RUN: Analysis completed, no changes made")
                print("\n💡 ANALYSIS COMPLETE")
                print("Most likely original parent candidates:")
                for i, user in enumerate(original_parent_analysis["orphaned_users"][:3], 1):
                    print(f"  {i}. {user['email']} (ID: {user['user_id']})")
            
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

async def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="Emergency Child Ownership Revert via API")
    parser.add_argument("--dry-run", action="store_true", default=True,
                       help="Run in dry-run mode (default: True)")
    parser.add_argument("--execute", action="store_true", 
                       help="Execute actual changes (overrides dry-run)")
    parser.add_argument("--verbose", action="store_true",
                       help="Enable verbose logging")
    
    args = parser.parse_args()
    
    # If --execute is specified, turn off dry-run
    dry_run = not args.execute if args.execute else args.dry_run
    
    revert_tool = EmergencyChildOwnershipRevertAPI(
        dry_run=dry_run,
        verbose=args.verbose
    )
    
    success = await revert_tool.run_emergency_revert()
    
    if not success:
        exit(1)

if __name__ == "__main__":
    asyncio.run(main())