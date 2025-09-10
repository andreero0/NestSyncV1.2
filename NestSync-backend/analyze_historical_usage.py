#!/usr/bin/env python3
"""
Historical Usage Analysis Script for NestSync Inventory Correction
==================================================================

This script analyzes the historical diaper usage data to determine
how much inventory quantities need to be corrected retroactively.

The issue: Previous diaper usage logs were recorded but did NOT deduct 
inventory quantities due to bugs. Now we need to calculate and apply 
all missing deductions.

Usage:
    python analyze_historical_usage.py [--detailed] [--user-id USER_ID]

Author: NestSync Backend Engineering Team
Date: 2025-01-09
"""

import asyncio
import sys
import os
import argparse
import logging
from datetime import datetime, timezone
from typing import Dict, List, Tuple, Optional
from decimal import Decimal
import json

# Add the app directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.config.database import get_async_session, init_database
from app.models.inventory import InventoryItem, UsageLog, UsageType
from app.models.child import Child
from app.models.user import User
from sqlalchemy import select, func, and_, desc
from sqlalchemy.orm import selectinload

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('historical_usage_analysis.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)


class HistoricalUsageAnalyzer:
    """Analyzes historical usage data and calculates required corrections"""
    
    def __init__(self):
        self.total_diaper_changes = 0
        self.affected_inventory_items = 0
        self.users_affected = 0
        self.children_affected = 0
        self.corrections_needed = {}  # inventory_item_id -> correction_amount
        self.potential_issues = []
        
    async def analyze_complete_dataset(self) -> Dict:
        """
        Perform comprehensive analysis of all historical usage data
        """
        logger.info("Starting comprehensive historical usage analysis...")
        
        analysis_results = {
            "analysis_timestamp": datetime.now(timezone.utc).isoformat(),
            "summary": {},
            "corrections_needed": {},
            "potential_issues": [],
            "detailed_breakdowns": {},
            "validation_checks": {}
        }
        
        try:
            # Use the correct async pattern as specified in CLAUDE.md
            async for session in get_async_session():
                # 1. Get overall statistics
                await self._analyze_overall_statistics(session, analysis_results)
                
                # 2. Analyze inventory items needing corrections
                await self._analyze_inventory_corrections(session, analysis_results)
                
                # 3. Check for data integrity issues
                await self._validate_data_integrity(session, analysis_results)
                
                # 4. Generate user/child breakdowns
                await self._analyze_user_breakdowns(session, analysis_results)
                
                # 5. Calculate financial impact
                await self._calculate_financial_impact(session, analysis_results)
                
                break  # Exit after successful processing
                
        except Exception as e:
            logger.error(f"Analysis failed: {e}")
            analysis_results["error"] = str(e)
            raise
        
        return analysis_results
    
    async def _analyze_overall_statistics(self, session, results: Dict):
        """Calculate overall usage statistics"""
        logger.info("Analyzing overall usage statistics...")
        
        # Count total diaper changes
        diaper_changes_query = select(func.count(UsageLog.id)).where(
            and_(
                UsageLog.usage_type == UsageType.DIAPER_CHANGE.value,
                UsageLog.is_deleted == False
            )
        )
        diaper_changes_result = await session.execute(diaper_changes_query)
        total_diaper_changes = diaper_changes_result.scalar()
        
        # Count diaper changes with linked inventory
        linked_changes_query = select(func.count(UsageLog.id)).where(
            and_(
                UsageLog.usage_type == UsageType.DIAPER_CHANGE.value,
                UsageLog.inventory_item_id.isnot(None),
                UsageLog.is_deleted == False
            )
        )
        linked_changes_result = await session.execute(linked_changes_query)
        linked_diaper_changes = linked_changes_result.scalar()
        
        # Count affected children
        children_query = select(func.count(func.distinct(UsageLog.child_id))).where(
            and_(
                UsageLog.usage_type == UsageType.DIAPER_CHANGE.value,
                UsageLog.inventory_item_id.isnot(None),
                UsageLog.is_deleted == False
            )
        )
        children_result = await session.execute(children_query)
        affected_children = children_result.scalar()
        
        # Count unique inventory items affected
        inventory_query = select(func.count(func.distinct(UsageLog.inventory_item_id))).where(
            and_(
                UsageLog.usage_type == UsageType.DIAPER_CHANGE.value,
                UsageLog.inventory_item_id.isnot(None),
                UsageLog.is_deleted == False
            )
        )
        inventory_result = await session.execute(inventory_query)
        affected_inventory_items = inventory_result.scalar()
        
        # Store results
        results["summary"] = {
            "total_diaper_changes": total_diaper_changes,
            "linked_diaper_changes": linked_diaper_changes,
            "unlinked_changes": total_diaper_changes - linked_diaper_changes,
            "affected_children": affected_children,
            "affected_inventory_items": affected_inventory_items,
            "correction_efficiency": round((linked_diaper_changes / total_diaper_changes * 100), 2) if total_diaper_changes > 0 else 0
        }
        
        logger.info(f"Found {total_diaper_changes} total diaper changes")
        logger.info(f"Found {linked_diaper_changes} changes with inventory links")
        logger.info(f"Found {affected_children} children affected")
        logger.info(f"Found {affected_inventory_items} inventory items needing correction")
    
    async def _analyze_inventory_corrections(self, session, results: Dict):
        """Calculate specific corrections needed for each inventory item"""
        logger.info("Analyzing inventory correction requirements...")
        
        # Query historical usage grouped by inventory item
        usage_summary_query = select(
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
        
        usage_results = await session.execute(usage_summary_query)
        corrections = {}
        
        for row in usage_results:
            inventory_item_id = str(row.inventory_item_id)
            usage_count = row.usage_count
            total_quantity_used = row.total_quantity_used
            
            # Get current inventory item details
            inventory_query = select(InventoryItem).where(
                InventoryItem.id == row.inventory_item_id
            )
            inventory_result = await session.execute(inventory_query)
            inventory_item = inventory_result.scalar_one_or_none()
            
            if inventory_item:
                correction_data = {
                    "inventory_item_id": inventory_item_id,
                    "current_quantity_remaining": inventory_item.quantity_remaining,
                    "quantity_total": inventory_item.quantity_total,
                    "historical_usage_count": usage_count,
                    "total_quantity_to_deduct": total_quantity_used,
                    "corrected_quantity_remaining": inventory_item.quantity_remaining - total_quantity_used,
                    "brand": inventory_item.brand,
                    "product_name": inventory_item.product_name,
                    "size": inventory_item.size,
                    "child_id": str(inventory_item.child_id)
                }
                
                # Check for negative quantities
                if correction_data["corrected_quantity_remaining"] < 0:
                    correction_data["has_negative_result"] = True
                    correction_data["negative_amount"] = abs(correction_data["corrected_quantity_remaining"])
                    results["potential_issues"].append({
                        "type": "negative_inventory",
                        "inventory_item_id": inventory_item_id,
                        "brand_size": f"{inventory_item.brand} {inventory_item.size}",
                        "negative_amount": correction_data["negative_amount"],
                        "suggestion": "Review usage logs or adjust initial inventory quantities"
                    })
                else:
                    correction_data["has_negative_result"] = False
                
                corrections[inventory_item_id] = correction_data
            else:
                results["potential_issues"].append({
                    "type": "orphaned_usage_logs",
                    "inventory_item_id": inventory_item_id,
                    "usage_count": usage_count,
                    "suggestion": "Usage logs reference deleted inventory item"
                })
        
        results["corrections_needed"] = corrections
        logger.info(f"Calculated corrections for {len(corrections)} inventory items")
    
    async def _validate_data_integrity(self, session, results: Dict):
        """Perform data integrity validation checks"""
        logger.info("Performing data integrity validation...")
        
        validation_checks = {}
        
        # 1. Check for usage logs without inventory items
        orphaned_logs_query = select(func.count(UsageLog.id)).where(
            and_(
                UsageLog.usage_type == UsageType.DIAPER_CHANGE.value,
                UsageLog.inventory_item_id.is_(None),
                UsageLog.is_deleted == False
            )
        )
        orphaned_logs_result = await session.execute(orphaned_logs_query)
        orphaned_logs_count = orphaned_logs_result.scalar()
        
        validation_checks["orphaned_usage_logs"] = {
            "count": orphaned_logs_count,
            "status": "warning" if orphaned_logs_count > 0 else "pass",
            "description": "Usage logs without linked inventory items"
        }
        
        # 2. Check for inventory items with no usage
        unused_inventory_query = select(func.count(InventoryItem.id)).select_from(
            InventoryItem
        ).outerjoin(
            UsageLog, and_(
                InventoryItem.id == UsageLog.inventory_item_id,
                UsageLog.usage_type == UsageType.DIAPER_CHANGE.value,
                UsageLog.is_deleted == False
            )
        ).where(
            and_(
                InventoryItem.product_type == "diaper",
                InventoryItem.is_deleted == False,
                UsageLog.id.is_(None)
            )
        )
        unused_inventory_result = await session.execute(unused_inventory_query)
        unused_inventory_count = unused_inventory_result.scalar()
        
        validation_checks["unused_inventory"] = {
            "count": unused_inventory_count,
            "status": "info" if unused_inventory_count > 0 else "pass",
            "description": "Diaper inventory items with no recorded usage"
        }
        
        # 3. Check for future-dated usage logs
        future_usage_query = select(func.count(UsageLog.id)).where(
            and_(
                UsageLog.usage_type == UsageType.DIAPER_CHANGE.value,
                UsageLog.logged_at > datetime.now(timezone.utc),
                UsageLog.is_deleted == False
            )
        )
        future_usage_result = await session.execute(future_usage_query)
        future_usage_count = future_usage_result.scalar()
        
        validation_checks["future_dated_logs"] = {
            "count": future_usage_count,
            "status": "error" if future_usage_count > 0 else "pass",
            "description": "Usage logs with future dates"
        }
        
        results["validation_checks"] = validation_checks
        logger.info("Data integrity validation completed")
    
    async def _analyze_user_breakdowns(self, session, results: Dict):
        """Generate detailed breakdowns by user and child"""
        logger.info("Generating user and child breakdowns...")
        
        # Query usage by child with user information
        child_usage_query = select(
            Child.id.label('child_id'),
            Child.name.label('child_name'),
            Child.user_id.label('user_id'),
            func.count(UsageLog.id).label('total_changes'),
            func.count(UsageLog.inventory_item_id).label('linked_changes')
        ).select_from(
            Child
        ).join(
            UsageLog, Child.id == UsageLog.child_id
        ).where(
            and_(
                UsageLog.usage_type == UsageType.DIAPER_CHANGE.value,
                UsageLog.is_deleted == False
            )
        ).group_by(
            Child.id, Child.name, Child.user_id
        ).order_by(desc(func.count(UsageLog.id)))
        
        child_results = await session.execute(child_usage_query)
        child_breakdowns = {}
        user_summaries = {}
        
        for row in child_results:
            child_id = str(row.child_id)
            user_id = str(row.user_id)
            
            child_data = {
                "child_id": child_id,
                "child_name": row.child_name,
                "user_id": user_id,
                "total_diaper_changes": row.total_changes,
                "linked_diaper_changes": row.linked_changes,
                "unlinked_changes": row.total_changes - row.linked_changes
            }
            
            child_breakdowns[child_id] = child_data
            
            # Aggregate user summary
            if user_id not in user_summaries:
                user_summaries[user_id] = {
                    "user_id": user_id,
                    "total_changes": 0,
                    "linked_changes": 0,
                    "children_count": 0
                }
            
            user_summaries[user_id]["total_changes"] += row.total_changes
            user_summaries[user_id]["linked_changes"] += row.linked_changes
            user_summaries[user_id]["children_count"] += 1
        
        results["detailed_breakdowns"] = {
            "by_child": child_breakdowns,
            "by_user": user_summaries
        }
        
        logger.info(f"Generated breakdowns for {len(child_breakdowns)} children and {len(user_summaries)} users")
    
    async def _calculate_financial_impact(self, session, results: Dict):
        """Calculate the financial impact of the historical corrections"""
        logger.info("Calculating financial impact...")
        
        total_cost_impact = Decimal('0.00')
        total_units_corrected = 0
        
        for correction in results["corrections_needed"].values():
            quantity_to_deduct = correction["total_quantity_to_deduct"]
            inventory_item_id = correction["inventory_item_id"]
            
            # Get cost information
            inventory_query = select(InventoryItem).where(
                InventoryItem.id == inventory_item_id
            )
            inventory_result = await session.execute(inventory_query)
            inventory_item = inventory_result.scalar_one_or_none()
            
            if inventory_item and inventory_item.cost_per_unit_calculated:
                unit_cost = inventory_item.cost_per_unit_calculated
                item_cost_impact = unit_cost * quantity_to_deduct
                total_cost_impact += item_cost_impact
                correction["cost_impact_cad"] = float(item_cost_impact)
            else:
                correction["cost_impact_cad"] = None
            
            total_units_corrected += quantity_to_deduct
        
        results["financial_impact"] = {
            "total_units_corrected": total_units_corrected,
            "total_cost_impact_cad": float(total_cost_impact),
            "average_cost_per_unit": float(total_cost_impact / total_units_corrected) if total_units_corrected > 0 else None
        }
        
        logger.info(f"Financial impact: ${total_cost_impact:.2f} CAD for {total_units_corrected} units")


async def generate_detailed_report(analyzer_results: Dict, output_file: str = None):
    """Generate a detailed human-readable report"""
    
    if not output_file:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_file = f"historical_usage_analysis_report_{timestamp}.json"
    
    # Save full results as JSON
    with open(output_file, 'w') as f:
        json.dump(analyzer_results, f, indent=2, default=str)
    
    # Generate human-readable summary
    summary_file = output_file.replace('.json', '_summary.txt')
    
    with open(summary_file, 'w') as f:
        f.write("NestSync Historical Usage Analysis Report\n")
        f.write("=" * 45 + "\n")
        f.write(f"Analysis Date: {analyzer_results['analysis_timestamp']}\n\n")
        
        # Summary statistics
        summary = analyzer_results['summary']
        f.write("EXECUTIVE SUMMARY\n")
        f.write("-" * 17 + "\n")
        f.write(f"Total Diaper Changes: {summary['total_diaper_changes']:,}\n")
        f.write(f"Changes with Inventory Links: {summary['linked_diaper_changes']:,}\n")
        f.write(f"Changes Missing Inventory Links: {summary['unlinked_changes']:,}\n")
        f.write(f"Children Affected: {summary['affected_children']}\n")
        f.write(f"Inventory Items Needing Correction: {summary['affected_inventory_items']}\n")
        f.write(f"Data Quality Score: {summary['correction_efficiency']}%\n\n")
        
        # Financial impact
        if 'financial_impact' in analyzer_results:
            financial = analyzer_results['financial_impact']
            f.write("FINANCIAL IMPACT\n")
            f.write("-" * 16 + "\n")
            f.write(f"Total Units to Correct: {financial['total_units_corrected']:,}\n")
            f.write(f"Total Cost Impact: ${financial['total_cost_impact_cad']:,.2f} CAD\n")
            if financial['average_cost_per_unit']:
                f.write(f"Average Cost per Unit: ${financial['average_cost_per_unit']:.4f} CAD\n\n")
        
        # Issues found
        issues = analyzer_results.get('potential_issues', [])
        if issues:
            f.write("POTENTIAL ISSUES\n")
            f.write("-" * 16 + "\n")
            for issue in issues:
                f.write(f"- {issue['type'].upper()}: {issue.get('description', 'See details')}\n")
            f.write("\n")
        
        # Validation results
        validation = analyzer_results.get('validation_checks', {})
        if validation:
            f.write("DATA VALIDATION\n")
            f.write("-" * 15 + "\n")
            for check_name, check_result in validation.items():
                status = check_result['status'].upper()
                count = check_result['count']
                description = check_result['description']
                f.write(f"{status}: {description} ({count:,} items)\n")
            f.write("\n")
        
        f.write("NEXT STEPS\n")
        f.write("-" * 10 + "\n")
        f.write("1. Review this analysis report carefully\n")
        f.write("2. Address any ERROR-level validation issues\n")
        f.write("3. Run backup_restore_inventory.py to create database backup\n")
        f.write("4. Execute fix_historical_inventory.py with --dry-run first\n")
        f.write("5. If dry-run looks correct, run actual correction script\n")
        f.write("6. Validate results and update dashboard calculations\n")
    
    logger.info(f"Analysis report saved to: {output_file}")
    logger.info(f"Summary report saved to: {summary_file}")
    
    return output_file, summary_file


async def analyze_specific_user(user_id: str):
    """Analyze historical usage for a specific user"""
    logger.info(f"Analyzing historical usage for user: {user_id}")
    
    try:
        async for session in get_async_session():
            # Get user's children
            children_query = select(Child).where(
                and_(
                    Child.user_id == user_id,
                    Child.is_deleted == False
                )
            )
            children_result = await session.execute(children_query)
            children = children_result.scalars().all()
            
            if not children:
                logger.warning(f"No children found for user {user_id}")
                return
            
            user_analysis = {
                "user_id": user_id,
                "children": [],
                "total_corrections": 0,
                "total_cost_impact": 0.0
            }
            
            for child in children:
                # Get usage statistics for this child
                usage_query = select(
                    UsageLog.inventory_item_id,
                    func.count(UsageLog.id).label('usage_count'),
                    func.sum(UsageLog.quantity_used).label('total_used')
                ).where(
                    and_(
                        UsageLog.child_id == child.id,
                        UsageLog.usage_type == UsageType.DIAPER_CHANGE.value,
                        UsageLog.inventory_item_id.isnot(None),
                        UsageLog.is_deleted == False
                    )
                ).group_by(UsageLog.inventory_item_id)
                
                usage_results = await session.execute(usage_query)
                
                child_corrections = []
                child_total_corrections = 0
                
                for row in usage_results:
                    inventory_query = select(InventoryItem).where(
                        InventoryItem.id == row.inventory_item_id
                    )
                    inventory_result = await session.execute(inventory_query)
                    inventory_item = inventory_result.scalar_one_or_none()
                    
                    if inventory_item:
                        correction = {
                            "inventory_item_id": str(row.inventory_item_id),
                            "brand": inventory_item.brand,
                            "size": inventory_item.size,
                            "current_remaining": inventory_item.quantity_remaining,
                            "quantity_to_deduct": row.total_used,
                            "corrected_remaining": inventory_item.quantity_remaining - row.total_used
                        }
                        
                        child_corrections.append(correction)
                        child_total_corrections += row.total_used
                
                user_analysis["children"].append({
                    "child_id": str(child.id),
                    "child_name": child.name,
                    "corrections": child_corrections,
                    "total_corrections": child_total_corrections
                })
                
                user_analysis["total_corrections"] += child_total_corrections
            
            # Print user-specific report
            print(f"\nUser Analysis Report for {user_id}")
            print("=" * 50)
            print(f"Total corrections needed: {user_analysis['total_corrections']}")
            print(f"Children affected: {len(user_analysis['children'])}")
            
            for child_data in user_analysis['children']:
                print(f"\nChild: {child_data['child_name']} ({child_data['child_id']})")
                print(f"  Total corrections: {child_data['total_corrections']}")
                for correction in child_data['corrections']:
                    print(f"  - {correction['brand']} {correction['size']}: -{correction['quantity_to_deduct']} (remaining: {correction['current_remaining']} -> {correction['corrected_remaining']})")
            
            break  # Exit after successful processing
            
    except Exception as e:
        logger.error(f"User analysis failed: {e}")
        raise


def main():
    parser = argparse.ArgumentParser(description="Analyze historical diaper usage for inventory correction")
    parser.add_argument('--detailed', action='store_true', help='Generate detailed analysis report')
    parser.add_argument('--user-id', help='Analyze specific user only')
    parser.add_argument('--output', help='Output file path for results')
    
    args = parser.parse_args()
    
    async def run_analysis():
        try:
            # Initialize database connection
            await init_database()
            logger.info("Database connection initialized successfully")
            
            if args.user_id:
                # Analyze specific user
                await analyze_specific_user(args.user_id)
            else:
                # Full analysis
                analyzer = HistoricalUsageAnalyzer()
                results = await analyzer.analyze_complete_dataset()
                
                # Generate reports
                json_file, summary_file = await generate_detailed_report(results, args.output)
                
                # Print summary to console
                summary = results['summary']
                print("\nHISTORICAL USAGE ANALYSIS RESULTS")
                print("=" * 37)
                print(f"Total diaper changes in database: {summary['total_diaper_changes']:,}")
                print(f"Changes with inventory links: {summary['linked_diaper_changes']:,}")
                print(f"Changes without inventory links: {summary['unlinked_changes']:,}")
                print(f"Children affected: {summary['affected_children']}")
                print(f"Inventory items needing correction: {summary['affected_inventory_items']}")
                print(f"Data quality score: {summary['correction_efficiency']}%")
                
                if 'financial_impact' in results:
                    financial = results['financial_impact']
                    print(f"\nTotal units to correct: {financial['total_units_corrected']:,}")
                    print(f"Estimated cost impact: ${financial['total_cost_impact_cad']:,.2f} CAD")
                
                issues = results.get('potential_issues', [])
                if issues:
                    print(f"\nPotential issues found: {len(issues)}")
                    for issue in issues[:5]:  # Show first 5 issues
                        print(f"  - {issue['type']}: {issue.get('suggestion', 'Review details')}")
                    if len(issues) > 5:
                        print(f"  ... and {len(issues) - 5} more issues")
                
                print(f"\nDetailed reports saved:")
                print(f"  JSON: {json_file}")
                print(f"  Summary: {summary_file}")
                print(f"\nNext steps:")
                print("  1. Review the analysis results")
                print("  2. Run backup_restore_inventory.py to create a database backup")
                print("  3. Execute fix_historical_inventory.py --dry-run to preview changes")
                print("  4. If preview looks correct, run the actual correction script")
                
        except Exception as e:
            logger.error(f"Analysis failed: {e}")
            sys.exit(1)
    
    # Run the async analysis
    asyncio.run(run_analysis())


if __name__ == "__main__":
    main()