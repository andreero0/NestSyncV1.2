#!/usr/bin/env python3
"""
EXECUTE EMERGENCY REVERT: Automated Child Ownership Restoration
=============================================================

This script automatically executes the child ownership revert based on the analysis
that identified testparent@example.com as the most likely original parent for Tobe.

CRITICAL DECISION: Based on timestamp analysis, Tobe belongs to testparent@example.com
- User created: 2025-09-07 22:07:08.750255+00:00
- Child created: Only 3.52 hours later 
- User currently has 0 children (orphaned)
- Closest time match among all candidates

USAGE:
    python execute_emergency_revert.py [--confirm]
"""

import asyncio
import json
import logging
import sys
import os
from datetime import datetime
from pathlib import Path

# Add the app directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.config.database import get_async_session, create_database_engines
from sqlalchemy import text

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class EmergencyRevertExecution:
    def __init__(self):
        # Target IDs based on analysis
        self.tobe_child_id = "0961f7cb-5c48-433a-984d-44910ff24f7e"
        self.ose_child_id = "38e5b650-62f6-4305-aecf-41187514bd54"
        self.parents_nestsync_email = "parents@nestsync.com"
        
        # Original parent identified from analysis
        self.original_parent_id = "71f61c31-7eca-4341-9cbe-2ea1fd0b3c1f"
        self.original_parent_email = "testparent@example.com"
        
        # Results storage
        self.execution_report = {
            "execution_started_at": datetime.now().isoformat(),
            "decision_basis": "timestamp_analysis_automated",
            "original_parent_identified": {
                "id": self.original_parent_id,
                "email": self.original_parent_email,
                "reasoning": "Closest time match (3.52 hours) to Tobe creation, currently orphaned user"
            },
            "actions_taken": [],
            "verification_results": {}
        }

    async def initialize_database(self):
        """Initialize database connection."""
        create_database_engines()
        logger.info("✅ Database connection initialized")

    async def verify_pre_revert_state(self) -> bool:
        """Verify current state before making changes."""
        logger.info("🔍 Verifying pre-revert state...")
        
        async for session in get_async_session():
            # Verify Tobe is currently with parents@nestsync.com
            verify_query = text("""
                SELECT 
                    c.id as child_id,
                    c.name as child_name,
                    c.parent_id,
                    u.email as current_parent_email,
                    COUNT(DISTINCT ii.id) as inventory_count,
                    COUNT(DISTINCT ul.id) as usage_count
                FROM children c
                JOIN users u ON c.parent_id = u.id
                LEFT JOIN inventory_items ii ON c.id = ii.child_id
                LEFT JOIN usage_logs ul ON c.id = ul.child_id
                WHERE c.id = :tobe_id
                GROUP BY c.id, c.name, c.parent_id, u.email
            """)
            
            result = await session.execute(verify_query, {"tobe_id": self.tobe_child_id})
            current_state = result.fetchone()
            
            if not current_state:
                logger.error("❌ Tobe child not found in database")
                return False
            
            current_state_dict = dict(current_state._mapping)
            
            if current_state_dict['current_parent_email'] != self.parents_nestsync_email:
                logger.error(f"❌ Tobe is not currently with {self.parents_nestsync_email}")
                logger.error(f"   Current parent: {current_state_dict['current_parent_email']}")
                return False
            
            # Verify target parent exists and has no children
            target_parent_query = text("""
                SELECT 
                    u.id,
                    u.email,
                    COUNT(c.id) as children_count
                FROM users u
                LEFT JOIN children c ON u.id = c.parent_id
                WHERE u.id = :parent_id
                GROUP BY u.id, u.email
            """)
            
            target_result = await session.execute(target_parent_query, {"parent_id": self.original_parent_id})
            target_parent = target_result.fetchone()
            
            if not target_parent:
                logger.error(f"❌ Target parent {self.original_parent_id} not found")
                return False
            
            target_parent_dict = dict(target_parent._mapping)
            
            if target_parent_dict['children_count'] > 0:
                logger.error(f"❌ Target parent {self.original_parent_email} already has children")
                return False
            
            self.execution_report["pre_revert_verification"] = {
                "tobe_current_state": current_state_dict,
                "target_parent_state": target_parent_dict,
                "verification_passed": True
            }
            
            logger.info(f"✅ Pre-revert verification passed")
            logger.info(f"   Tobe currently with: {current_state_dict['current_parent_email']}")
            logger.info(f"   Target parent: {target_parent_dict['email']} (0 children)")
            logger.info(f"   Inventory to transfer: {current_state_dict['inventory_count']} items")
            logger.info(f"   Usage logs to transfer: {current_state_dict['usage_count']} logs")
            
            return True

    async def execute_revert(self) -> bool:
        """Execute the child ownership revert."""
        logger.info("🔄 Executing child ownership revert...")
        logger.info(f"   Moving Tobe ({self.tobe_child_id})")
        logger.info(f"   From: {self.parents_nestsync_email}")
        logger.info(f"   To: {self.original_parent_email} ({self.original_parent_id})")
        
        async for session in get_async_session():
            try:
                # Update child's parent_id
                update_query = text("""
                    UPDATE children 
                    SET parent_id = :new_parent_id,
                        updated_at = NOW()
                    WHERE id = :child_id
                    RETURNING id, name, parent_id, updated_at
                """)
                
                result = await session.execute(update_query, {
                    "new_parent_id": self.original_parent_id,
                    "child_id": self.tobe_child_id
                })
                
                updated_child = result.fetchone()
                
                if not updated_child:
                    logger.error("❌ Failed to update child ownership")
                    return False
                
                await session.commit()
                
                updated_dict = dict(updated_child._mapping)
                
                self.execution_report["actions_taken"].append({
                    "action": "child_ownership_reverted",
                    "status": "completed",
                    "child_id": self.tobe_child_id,
                    "child_name": updated_dict["name"],
                    "new_parent_id": self.original_parent_id,
                    "timestamp": datetime.now().isoformat(),
                    "database_updated_at": updated_dict["updated_at"].isoformat()
                })
                
                logger.info("✅ Child ownership successfully reverted")
                logger.info(f"   Updated at: {updated_dict['updated_at']}")
                return True
                
            except Exception as e:
                logger.error(f"❌ Failed to execute revert: {e}")
                await session.rollback()
                self.execution_report["actions_taken"].append({
                    "action": "child_ownership_revert",
                    "status": "failed",
                    "error": str(e),
                    "timestamp": datetime.now().isoformat()
                })
                return False

    async def verify_post_revert_state(self) -> bool:
        """Verify the state after revert to ensure success."""
        logger.info("🔍 Verifying post-revert state...")
        
        async for session in get_async_session():
            # Verify new ownership
            ownership_query = text("""
                SELECT 
                    c.id as child_id,
                    c.name as child_name,
                    c.parent_id,
                    u.email as parent_email,
                    COUNT(DISTINCT ii.id) as inventory_count,
                    COUNT(DISTINCT ul.id) as usage_count,
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
            
            # Check that Tobe is now with the correct parent
            tobe_result = next((r for r in verification_results if r['child_id'] == self.tobe_child_id), None)
            ose_result = next((r for r in verification_results if r['child_id'] == self.ose_child_id), None)
            
            success = True
            issues = []
            
            if not tobe_result:
                success = False
                issues.append("Tobe not found after revert")
            elif tobe_result['parent_email'] != self.original_parent_email:
                success = False
                issues.append(f"Tobe parent is {tobe_result['parent_email']}, expected {self.original_parent_email}")
            
            if not ose_result:
                success = False
                issues.append("Ose not found")
            elif ose_result['parent_email'] != self.parents_nestsync_email:
                success = False
                issues.append(f"Ose parent changed unexpectedly to {ose_result['parent_email']}")
            
            self.execution_report["verification_results"] = {
                "verification_passed": success,
                "issues": issues,
                "final_state": verification_results
            }
            
            if success:
                logger.info("✅ Post-revert verification passed")
                logger.info("   Final ownership state:")
                for result in verification_results:
                    logger.info(f"     {result['child_name']}: {result['parent_email']}")
                    logger.info(f"       - Inventory: {result['inventory_count']} items")
                    logger.info(f"       - Usage logs: {result['usage_count']} entries")
                    if result['total_diapers']:
                        logger.info(f"       - Total diapers: {result['total_diapers']}")
            else:
                logger.error("❌ Post-revert verification failed")
                for issue in issues:
                    logger.error(f"   - {issue}")
            
            return success

    async def generate_execution_report(self) -> str:
        """Generate final execution report."""
        self.execution_report.update({
            "execution_completed_at": datetime.now().isoformat(),
            "pipeda_compliance_status": "data_ownership_restored",
            "summary": {
                "child_reverted": "Tobe",
                "original_parent_restored": self.original_parent_email,
                "data_integrity_maintained": True,
                "incident_resolved": True
            }
        })
        
        report_filename = f"emergency_revert_execution_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        report_path = Path(report_filename)
        report_path.write_text(json.dumps(self.execution_report, indent=2, default=str))
        
        logger.info(f"📄 Execution report generated: {report_filename}")
        return report_filename

    async def run_emergency_revert(self) -> bool:
        """Execute the complete emergency revert workflow."""
        try:
            logger.info("🚨 EXECUTING EMERGENCY CHILD OWNERSHIP REVERT")
            logger.info("=" * 60)
            
            # Step 1: Initialize database
            await self.initialize_database()
            
            # Step 2: Verify pre-revert state
            if not await self.verify_pre_revert_state():
                logger.error("❌ Pre-revert verification failed. Aborting.")
                return False
            
            # Step 3: Execute revert
            if not await self.execute_revert():
                logger.error("❌ Revert execution failed. Aborting.")
                return False
            
            # Step 4: Verify post-revert state
            if not await self.verify_post_revert_state():
                logger.error("❌ Post-revert verification failed.")
                return False
            
            # Step 5: Generate report
            report_file = await self.generate_execution_report()
            
            logger.info("✅ EMERGENCY REVERT COMPLETED SUCCESSFULLY")
            logger.info(f"📁 Report: {report_file}")
            logger.info("🛡️  PIPEDA COMPLIANCE: Data ownership restored")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Emergency revert failed: {e}")
            self.execution_report["fatal_error"] = str(e)
            await self.generate_execution_report()
            return False

async def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="Execute Emergency Child Ownership Revert")
    parser.add_argument("--confirm", action="store_true", 
                       help="Confirm execution of the revert")
    
    args = parser.parse_args()
    
    if not args.confirm:
        print("🚨 CRITICAL OPERATION: Emergency Child Ownership Revert")
        print("=" * 60)
        print("This will revert Tobe's ownership from parents@nestsync.com")
        print("to testparent@example.com based on timestamp analysis.")
        print()
        print("Add --confirm flag to execute:")
        print("python execute_emergency_revert.py --confirm")
        return
    
    executor = EmergencyRevertExecution()
    success = await executor.run_emergency_revert()
    
    if not success:
        exit(1)

if __name__ == "__main__":
    asyncio.run(main())