#!/usr/bin/env python3
"""
Debug Dashboard Calculations
Test script to identify issues with dashboard statistics calculation
"""

import asyncio
import logging
import uuid
from datetime import datetime, timezone, timedelta

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

async def debug_dashboard_calculations():
    """Debug dashboard calculation issues"""
    
    # Import after logging setup
    from app.config.database import get_async_session, create_database_engines
    from app.models import Child, InventoryItem, UsageLog
    from sqlalchemy import select, func, and_
    from sqlalchemy.orm import selectinload
    
    # Initialize database
    create_database_engines()
    
    logger.info("=== STARTING DASHBOARD CALCULATION DEBUG ===")
    
    async for session in get_async_session():
        # Find a test child to debug
        child_query = select(Child).where(Child.is_deleted == False).limit(1)
        child_result = await session.execute(child_query)
        child = child_result.scalar_one_or_none()
        
        if not child:
            logger.error("No children found in database")
            return
        
        logger.info(f"Testing with child: {child.id} - {child.name}")
        logger.info(f"Child current diaper size: {child.current_diaper_size}")
        logger.info(f"Child daily usage count: {child.daily_usage_count}")
        
        # Check inventory items
        inventory_query = select(InventoryItem).where(
            and_(
                InventoryItem.child_id == child.id,
                InventoryItem.is_deleted == False
            )
        )
        inventory_result = await session.execute(inventory_query)
        inventory_items = inventory_result.scalars().all()
        
        logger.info(f"Found {len(inventory_items)} inventory items:")
        total_diapers = 0
        for item in inventory_items:
            logger.info(f"  - {item.product_type} | {item.brand} {item.size} | Total: {item.quantity_total} | Remaining: {item.quantity_remaining}")
            if item.product_type == "diaper":
                total_diapers += item.quantity_remaining
        
        logger.info(f"Total diapers calculated: {total_diapers}")
        
        # Check today's usage logs
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)
        
        usage_query = select(UsageLog).where(
            and_(
                UsageLog.child_id == child.id,
                UsageLog.logged_at >= today_start,
                UsageLog.logged_at < today_end,
                UsageLog.is_deleted == False
            )
        )
        usage_result = await session.execute(usage_query)
        usage_logs = usage_result.scalars().all()
        
        logger.info(f"Today's usage logs ({today_start} to {today_end}):")
        diaper_changes_today = 0
        for log in usage_logs:
            logger.info(f"  - {log.usage_type} at {log.logged_at} | Quantity: {log.quantity_used}")
            if log.usage_type == "diaper_change":
                diaper_changes_today += 1
        
        logger.info(f"Diaper changes today: {diaper_changes_today}")
        
        # Check recent usage logs (last 7 days)
        week_ago = datetime.now(timezone.utc) - timedelta(days=7)
        weekly_usage_query = select(func.count(UsageLog.id)).where(
            and_(
                UsageLog.child_id == child.id,
                UsageLog.usage_type == "diaper_change",
                UsageLog.logged_at >= week_ago,
                UsageLog.is_deleted == False
            )
        )
        weekly_usage_result = await session.execute(weekly_usage_query)
        weekly_usage = weekly_usage_result.scalar() or 0
        
        logger.info(f"Diaper changes in last 7 days: {weekly_usage}")
        
        # Calculate days remaining
        daily_usage = float(child.daily_usage_count) if child.daily_usage_count else 8.0
        if weekly_usage >= 14:
            logged_daily_usage = weekly_usage / 7.0
            daily_usage = max(daily_usage, logged_daily_usage)
        
        days_remaining = None
        if total_diapers > 0 and daily_usage > 0:
            days_remaining = int(total_diapers / daily_usage)
        
        logger.info(f"Calculated daily usage: {daily_usage}")
        logger.info(f"Calculated days remaining: {days_remaining}")
        
        # Test GraphQL resolver
        from app.graphql.inventory_resolvers import InventoryQueries
        resolver = InventoryQueries()
        
        logger.info("=== TESTING GRAPHQL RESOLVER ===")
        dashboard_stats = await resolver.get_dashboard_stats(child_id=str(child.id), info=None)
        
        logger.info("=== RESOLVER RESULTS ===")
        logger.info(f"diapers_left: {dashboard_stats.diapers_left}")
        logger.info(f"today_changes: {dashboard_stats.today_changes}")
        logger.info(f"days_remaining: {dashboard_stats.days_remaining}")
        logger.info(f"last_change: {dashboard_stats.last_change}")
        logger.info(f"current_size: {dashboard_stats.current_size}")
        
        logger.info("=== DEBUG COMPLETE ===")

if __name__ == "__main__":
    asyncio.run(debug_dashboard_calculations())