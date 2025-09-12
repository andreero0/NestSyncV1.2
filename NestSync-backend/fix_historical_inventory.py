#!/usr/bin/env python3
"""
Historical Inventory Correction Script for NestSync
===================================================

This script retroactively applies all historical diaper usage deductions 
to correct inventory quantities. Previous diaper changes were logged but
did NOT deduct from inventory due to bugs.

CRITICAL SAFETY FEATURES:
- Dry-run mode (--dry-run) to preview changes without applying them
- Automatic database backup before any changes (--skip-backup to disable)
- Comprehensive logging and audit trail
- Rollback capability through backup restore
- Data integrity validation before and after corrections

Usage Examples:
    # Preview changes without applying (RECOMMENDED FIRST STEP)
    python fix_historical_inventory.py --dry-run
    
    # Apply corrections with automatic backup
    python fix_historical_inventory.py --apply
    
    # Apply corrections for specific user only
    python fix_historical_inventory.py --apply --user-id USER_UUID
    
    # Skip backup creation (NOT RECOMMENDED)
    python fix_historical_inventory.py --apply --skip-backup

WORKFLOW:
1. Run analyze_historical_usage.py to understand the scope
2. Run backup_restore_inventory.py backup to create safety backup
3. Run this script with --dry-run to preview changes
4. If preview looks correct, run with --apply
5. Verify results in dashboard and with additional analysis

Author: NestSync Backend Engineering Team  
Date: 2025-01-09
"""

import asyncio
import sys
import os
import argparse
import logging
import json
from datetime import datetime, timezone
from typing import Dict, List, Tuple, Optional
from decimal import Decimal
from pathlib import Path

# Add the app directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.config.database import get_async_session, init_database
from app.models.inventory import InventoryItem, UsageLog, UsageType
from app.models.child import Child
from sqlalchemy import select, func, and_, update, text
from sqlalchemy.orm import selectinload

# Import backup manager
from backup_restore_inventory import DatabaseBackupManager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('historical_inventory_correction.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)


class InventoryCorrectionEngine:
    """Main engine for applying historical inventory corrections"""
    
    def __init__(self, dry_run: bool = True, target_user_id: str = None):
        self.dry_run = dry_run
        self.target_user_id = target_user_id
        self.corrections_applied = []
        self.errors_encountered = []
        self.total_corrections = 0
        self.total_items_affected = 0
        self.total_cost_impact = Decimal('0.00')
        self.backup_file = None
        
    async def execute_correction_workflow(self, skip_backup: bool = False) -> Dict:
        """
        Execute the complete correction workflow with safety measures
        """
        workflow_results = {
            "workflow_started_at": datetime.now(timezone.utc).isoformat(),
            "dry_run_mode": self.dry_run,
            "target_user_id": self.target_user_id,
            "backup_created": None,
            "pre_correction_validation": {},
            "corrections_applied": [],
            "post_correction_validation": {},
            "errors": [],
            "summary": {}
        }
        
        try:
            logger.info("="*60)
            logger.info("STARTING HISTORICAL INVENTORY CORRECTION WORKFLOW")
            logger.info("="*60)
            logger.info(f"Mode: {'DRY RUN' if self.dry_run else 'LIVE APPLICATION'}")
            if self.target_user_id:
                logger.info(f"Target User: {self.target_user_id}")
            
            # Step 1: Create backup (unless dry run or explicitly skipped)
            if not self.dry_run and not skip_backup:
                workflow_results["backup_created"] = await self._create_safety_backup()
            
            # Step 2: Pre-correction validation
            logger.info("Step 2: Running pre-correction validation...")
            workflow_results["pre_correction_validation"] = await self._validate_data_integrity()
            
            # Step 3: Calculate and preview corrections
            logger.info("Step 3: Calculating required corrections...")
            corrections_plan = await self._calculate_corrections()
            workflow_results["corrections_plan"] = corrections_plan
            
            if not corrections_plan["corrections"]:
                logger.info("No corrections needed. All inventory appears to be accurate.")
                workflow_results["summary"] = {"message": "No corrections required"}
                return workflow_results
            
            # Step 4: Preview corrections
            await self._preview_corrections(corrections_plan)
            
            # Step 5: Apply corrections (only if not dry run)
            if not self.dry_run:
                logger.info("Step 5: Applying corrections to database...")
                workflow_results["corrections_applied"] = await self._apply_corrections(corrections_plan)
                
                # Step 6: Post-correction validation
                logger.info("Step 6: Running post-correction validation...")
                workflow_results["post_correction_validation"] = await self._validate_corrections()
                
            else:
                logger.info("DRY RUN MODE: Corrections would be applied here")
                workflow_results["corrections_applied"] = {"dry_run": True, "corrections_count": len(corrections_plan["corrections"])}
            
            # Generate summary
            workflow_results["summary"] = self._generate_summary()
            
            logger.info("="*60)
            logger.info("HISTORICAL INVENTORY CORRECTION WORKFLOW COMPLETED")
            logger.info("="*60)
            
        except Exception as e:
            logger.error(f"Workflow failed: {e}")
            workflow_results["errors"].append({"type": "workflow_failure", "message": str(e)})
            raise
        
        return workflow_results
    
    async def _create_safety_backup(self) -> str:
        """Create database backup before applying corrections"""
        logger.info("Creating safety backup before applying corrections...")
        
        backup_manager = DatabaseBackupManager()
        
        # Create table-specific backup for faster operation
        backup_file, metadata = backup_manager.create_table_specific_backup()
        self.backup_file = backup_file
        
        logger.info(f"Backup created: {backup_file}")
        logger.info(f"Backup size: {metadata['file_size_mb']:.2f} MB")
        
        return backup_file
    
    async def _validate_data_integrity(self) -> Dict:
        """Validate database integrity before corrections"""
        validation_results = {}
        
        async for session in get_async_session():
            # Check for obvious data integrity issues
            
            # 1. Count inventory items
            inventory_count = await session.execute(
                select(func.count(InventoryItem.id)).where(InventoryItem.is_deleted == False)
            )
            validation_results["inventory_items_count"] = inventory_count.scalar()
            
            # 2. Count usage logs
            usage_count = await session.execute(
                select(func.count(UsageLog.id)).where(
                    and_(
                        UsageLog.usage_type == UsageType.DIAPER_CHANGE.value,
                        UsageLog.is_deleted == False
                    )
                )
            )
            validation_results["usage_logs_count"] = usage_count.scalar()
            
            # 3. Check for negative inventory quantities (already present)
            negative_inventory = await session.execute(
                select(func.count(InventoryItem.id)).where(
                    and_(
                        InventoryItem.quantity_remaining < 0,
                        InventoryItem.is_deleted == False
                    )
                )
            )
            validation_results["negative_inventory_items"] = negative_inventory.scalar()
            
            # 4. Check for extremely high inventory quantities (potential data issues)
            high_inventory = await session.execute(
                select(func.count(InventoryItem.id)).where(
                    and_(
                        InventoryItem.quantity_remaining > 1000,  # More than 1000 diapers
                        InventoryItem.product_type == "diaper",
                        InventoryItem.is_deleted == False
                    )
                )
            )
            validation_results["high_inventory_items"] = high_inventory.scalar()
            
            break  # Exit after successful validation
        
        logger.info(f"Pre-correction validation: {validation_results}")
        return validation_results
    
    async def _calculate_corrections(self) -> Dict:
        """Calculate all required corrections"""
        corrections_plan = {
            "calculated_at": datetime.now(timezone.utc).isoformat(),
            "target_user_id": self.target_user_id,
            "corrections": [],
            "total_corrections": 0,
            "total_items_affected": 0,
            "potential_issues": []
        }
        
        async for session in get_async_session():
            # Build query for historical usage
            usage_query = select(
                UsageLog.inventory_item_id,
                func.count(UsageLog.id).label('usage_count'),
                func.sum(UsageLog.quantity_used).label('total_quantity_used')
            ).where(
                and_(
                    UsageLog.usage_type == UsageType.DIAPER_CHANGE.value,
                    UsageLog.inventory_item_id.isnot(None),
                    UsageLog.is_deleted == False
                )
            ).group_by(UsageLog.inventory_item_id)
            
            # Filter by user if specified
            if self.target_user_id:
                # Join with child and then filter by user
                usage_query = usage_query.select_from(
                    UsageLog.__table__.join(Child.__table__, UsageLog.child_id == Child.id)
                ).where(Child.user_id == self.target_user_id)
            
            usage_results = await session.execute(usage_query)
            
            for row in usage_results:
                inventory_item_id = row.inventory_item_id
                total_quantity_to_deduct = row.total_quantity_used
                
                # Get current inventory item
                inventory_query = select(InventoryItem).where(
                    InventoryItem.id == inventory_item_id
                )
                inventory_result = await session.execute(inventory_query)
                inventory_item = inventory_result.scalar_one_or_none()
                
                if not inventory_item:
                    corrections_plan["potential_issues"].append({
                        "type": "missing_inventory_item",
                        "inventory_item_id": str(inventory_item_id),
                        "usage_count": row.usage_count,
                        "message": "Usage logs reference deleted inventory item"
                    })
                    continue
                
                # Calculate correction
                current_remaining = inventory_item.quantity_remaining
                corrected_remaining = current_remaining - total_quantity_to_deduct
                
                correction = {
                    "inventory_item_id": str(inventory_item_id),
                    "child_id": str(inventory_item.child_id),
                    "brand": inventory_item.brand,
                    "product_name": inventory_item.product_name,
                    "size": inventory_item.size,
                    "current_quantity_remaining": current_remaining,
                    "total_quantity_to_deduct": total_quantity_to_deduct,
                    "corrected_quantity_remaining": corrected_remaining,
                    "historical_usage_count": row.usage_count,
                    "needs_correction": total_quantity_to_deduct > 0
                }
                
                # Check for potential issues
                if corrected_remaining < 0:
                    correction["will_be_negative"] = True
                    correction["negative_amount"] = abs(corrected_remaining)
                    corrections_plan["potential_issues"].append({
                        "type": "negative_result",
                        "inventory_item_id": str(inventory_item_id),
                        "brand_size": f"{inventory_item.brand} {inventory_item.size}",
                        "negative_amount": abs(corrected_remaining),
                        "message": "Correction will result in negative inventory"
                    })
                
                # Calculate cost impact if available
                if inventory_item.cost_per_unit_calculated:
                    cost_impact = inventory_item.cost_per_unit_calculated * total_quantity_to_deduct
                    correction["cost_impact_cad"] = float(cost_impact)
                    corrections_plan["total_cost_impact"] = corrections_plan.get("total_cost_impact", 0) + float(cost_impact)
                
                corrections_plan["corrections"].append(correction)
                corrections_plan["total_corrections"] += total_quantity_to_deduct
                corrections_plan["total_items_affected"] += 1
            
            break  # Exit after successful calculation
        
        logger.info(f"Calculated corrections for {corrections_plan['total_items_affected']} inventory items")
        logger.info(f"Total quantity to deduct: {corrections_plan['total_corrections']}")
        
        return corrections_plan
    
    async def _preview_corrections(self, corrections_plan: Dict):
        """Display preview of corrections to be applied"""
        corrections = corrections_plan["corrections"]
        
        logger.info("\n" + "="*60)
        logger.info("CORRECTION PREVIEW")
        logger.info("="*60)
        logger.info(f"Total inventory items to correct: {len(corrections)}")
        logger.info(f"Total quantity deductions: {corrections_plan['total_corrections']}")
        
        if corrections_plan.get("total_cost_impact"):
            logger.info(f"Estimated cost impact: ${corrections_plan['total_cost_impact']:.2f} CAD")
        
        # Show first 10 corrections as examples
        logger.info("\nExample corrections (first 10):")
        logger.info("-" * 80)
        for i, correction in enumerate(corrections[:10]):
            brand_size = f"{correction['brand']} {correction['size']}"
            current = correction['current_quantity_remaining']
            deduct = correction['total_quantity_to_deduct']
            corrected = correction['corrected_quantity_remaining']
            
            status = ""
            if correction.get("will_be_negative"):
                status = " [WILL BE NEGATIVE]"
            
            logger.info(f"{i+1:2d}. {brand_size:<30} {current:3d} - {deduct:3d} = {corrected:3d}{status}")
        
        if len(corrections) > 10:
            logger.info(f"... and {len(corrections) - 10} more corrections")
        
        # Show potential issues
        issues = corrections_plan.get("potential_issues", [])
        if issues:
            logger.info(f"\nPotential issues found: {len(issues)}")
            for issue in issues[:5]:
                logger.info(f"  - {issue['type']}: {issue['message']}")
        
        logger.info("="*60)
    
    async def _apply_corrections(self, corrections_plan: Dict) -> Dict:
        """Apply corrections to the database"""
        application_results = {
            "started_at": datetime.now(timezone.utc).isoformat(),
            "corrections_applied": 0,
            "corrections_failed": 0,
            "failed_corrections": [],
            "success_details": []
        }
        
        corrections = corrections_plan["corrections"]
        
        async for session in get_async_session():
            for i, correction in enumerate(corrections):
                try:
                    inventory_item_id = correction["inventory_item_id"]
                    quantity_to_deduct = correction["total_quantity_to_deduct"]
                    
                    # Update the inventory item
                    update_query = update(InventoryItem).where(
                        InventoryItem.id == inventory_item_id
                    ).values(
                        quantity_remaining=InventoryItem.quantity_remaining - quantity_to_deduct
                    )
                    
                    await session.execute(update_query)
                    
                    application_results["corrections_applied"] += 1
                    application_results["success_details"].append({
                        "inventory_item_id": inventory_item_id,
                        "brand_size": f"{correction['brand']} {correction['size']}",
                        "quantity_deducted": quantity_to_deduct
                    })
                    
                    if (i + 1) % 100 == 0:
                        logger.info(f"Applied {i + 1}/{len(corrections)} corrections...")
                    
                except Exception as e:
                    logger.error(f"Failed to apply correction for item {correction['inventory_item_id']}: {e}")
                    application_results["corrections_failed"] += 1
                    application_results["failed_corrections"].append({
                        "inventory_item_id": correction["inventory_item_id"],
                        "error": str(e)
                    })
            
            # Commit all changes
            await session.commit()
            logger.info("All corrections committed to database")
            
            break  # Exit after successful application
        
        application_results["completed_at"] = datetime.now(timezone.utc).isoformat()
        
        logger.info(f"Corrections applied: {application_results['corrections_applied']}")
        logger.info(f"Corrections failed: {application_results['corrections_failed']}")
        
        return application_results
    
    async def _validate_corrections(self) -> Dict:
        """Validate that corrections were applied correctly"""
        validation_results = {
            "validation_timestamp": datetime.now(timezone.utc).isoformat(),
            "checks_performed": []
        }
        
        async for session in get_async_session():
            # Check 1: Count negative inventory items after correction
            negative_count = await session.execute(
                select(func.count(InventoryItem.id)).where(
                    and_(
                        InventoryItem.quantity_remaining < 0,
                        InventoryItem.product_type == "diaper",
                        InventoryItem.is_deleted == False
                    )
                )
            )
            negative_inventory_count = negative_count.scalar()
            
            validation_results["checks_performed"].append({
                "check": "negative_inventory_after_correction",
                "result": negative_inventory_count,
                "status": "warning" if negative_inventory_count > 0 else "pass"
            })
            
            # Check 2: Verify no usage logs remain without corrections applied
            # This is complex to verify directly, but we can check consistency
            
            # Check 3: Sample validation of specific corrections
            sample_validation = await self._sample_correction_validation(session)
            validation_results["sample_validation"] = sample_validation
            
            break  # Exit after successful validation
        
        return validation_results
    
    async def _sample_correction_validation(self, session) -> Dict:
        """Validate a sample of corrections for accuracy"""
        # Get a few inventory items and verify their usage matches their deductions
        sample_query = select(InventoryItem).where(
            and_(
                InventoryItem.product_type == "diaper",
                InventoryItem.is_deleted == False
            )
        ).limit(5)
        
        sample_items = await session.execute(sample_query)
        validations = []
        
        for item in sample_items.scalars():
            # Count historical usage for this item
            usage_count_query = select(func.count(UsageLog.id)).where(
                and_(
                    UsageLog.inventory_item_id == item.id,
                    UsageLog.usage_type == UsageType.DIAPER_CHANGE.value,
                    UsageLog.is_deleted == False
                )
            )
            usage_count = await session.execute(usage_count_query)
            historical_usage = usage_count.scalar()
            
            # Calculate expected remaining quantity
            expected_remaining = item.quantity_total - historical_usage
            actual_remaining = item.quantity_remaining
            
            validations.append({
                "inventory_item_id": str(item.id),
                "brand_size": f"{item.brand} {item.size}",
                "quantity_total": item.quantity_total,
                "historical_usage_count": historical_usage,
                "expected_remaining": expected_remaining,
                "actual_remaining": actual_remaining,
                "matches_expected": expected_remaining == actual_remaining
            })
        
        return validations
    
    def _generate_summary(self) -> Dict:
        """Generate summary of the correction workflow"""
        return {
            "dry_run_mode": self.dry_run,
            "target_user_id": self.target_user_id,
            "total_corrections_calculated": self.total_corrections,
            "total_items_affected": self.total_items_affected,
            "backup_file": self.backup_file,
            "workflow_completed_at": datetime.now(timezone.utc).isoformat()
        }


def main():
    parser = argparse.ArgumentParser(description="Apply historical inventory corrections")
    
    # Mode selection (mutually exclusive)
    mode_group = parser.add_mutually_exclusive_group(required=True)
    mode_group.add_argument('--dry-run', action='store_true',
                           help='Preview corrections without applying them (SAFE)')
    mode_group.add_argument('--apply', action='store_true',
                           help='Apply corrections to database (PERMANENT)')
    
    # Optional parameters
    parser.add_argument('--user-id', help='Apply corrections for specific user only')
    parser.add_argument('--skip-backup', action='store_true',
                       help='Skip automatic backup creation (NOT RECOMMENDED)')
    parser.add_argument('--output', help='Save results to specific file')
    
    args = parser.parse_args()
    
    async def run_corrections():
        try:
            # Initialize database
            await init_database()
            logger.info("Database connection initialized")
            
            # Create correction engine
            engine = InventoryCorrectionEngine(
                dry_run=args.dry_run,
                target_user_id=args.user_id
            )
            
            # Execute workflow
            results = await engine.execute_correction_workflow(
                skip_backup=args.skip_backup
            )
            
            # Save results
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            mode_suffix = "dry_run" if args.dry_run else "applied"
            output_file = args.output or f"inventory_correction_{mode_suffix}_{timestamp}.json"
            
            with open(output_file, 'w') as f:
                json.dump(results, f, indent=2, default=str)
            
            logger.info(f"Results saved to: {output_file}")
            
            # Print final summary
            print("\n" + "="*60)
            print("INVENTORY CORRECTION SUMMARY")
            print("="*60)
            print(f"Mode: {'DRY RUN' if args.dry_run else 'APPLIED'}")
            
            if results.get("corrections_plan"):
                plan = results["corrections_plan"]
                print(f"Items affected: {plan.get('total_items_affected', 0)}")
                print(f"Total deductions: {plan.get('total_corrections', 0)}")
                
                if plan.get("total_cost_impact"):
                    print(f"Cost impact: ${plan['total_cost_impact']:.2f} CAD")
                
                issues = plan.get("potential_issues", [])
                if issues:
                    print(f"Issues found: {len(issues)}")
            
            if results.get("backup_created"):
                print(f"Backup created: {results['backup_created']}")
            
            if not args.dry_run and results.get("corrections_applied"):
                applied = results["corrections_applied"]
                print(f"Corrections applied: {applied.get('corrections_applied', 0)}")
                print(f"Corrections failed: {applied.get('corrections_failed', 0)}")
            
            print(f"Detailed results: {output_file}")
            
            if args.dry_run:
                print("\nTo apply these corrections:")
                print(f"python {__file__} --apply")
                if args.user_id:
                    print(f"python {__file__} --apply --user-id {args.user_id}")
            else:
                print("\nNext steps:")
                print("1. Verify corrections in the dashboard")
                print("2. Run analyze_historical_usage.py to confirm results")
                print("3. Monitor application for any issues")
            
        except Exception as e:
            logger.error(f"Correction workflow failed: {e}")
            sys.exit(1)
    
    # Run the correction workflow
    asyncio.run(run_corrections())


if __name__ == "__main__":
    main()