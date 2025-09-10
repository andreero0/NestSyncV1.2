#!/usr/bin/env python3
"""
Test Diaper Change Logging
Test script to validate diaper change logging and inventory updates
"""

import asyncio
import logging
import uuid
from datetime import datetime, timezone

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

async def test_diaper_change_logging():
    """Test diaper change logging and inventory updates"""
    
    # Import after logging setup
    from app.config.database import get_async_session, create_database_engines
    from app.models import Child, InventoryItem, UsageLog
    from app.graphql.inventory_resolvers import InventoryMutations
    from app.graphql.types import LogDiaperChangeInput, UsageTypeEnum
    from sqlalchemy import select, and_
    
    # Initialize database
    create_database_engines()
    
    logger.info("=== STARTING DIAPER CHANGE LOGGING TEST ===")
    
    async for session in get_async_session():
        # Find a test child
        child_query = select(Child).where(Child.is_deleted == False).limit(1)
        child_result = await session.execute(child_query)
        child = child_result.scalar_one_or_none()
        
        if not child:
            logger.error("No children found in database")
            return
        
        logger.info(f"Testing with child: {child.id} - {child.name}")
        
        # Check current inventory before logging
        inventory_query = select(InventoryItem).where(
            and_(
                InventoryItem.child_id == child.id,
                InventoryItem.product_type == "diaper",
                InventoryItem.is_deleted == False
            )
        )
        inventory_result = await session.execute(inventory_query)
        inventory_items = inventory_result.scalars().all()
        
        logger.info("=== BEFORE DIAPER CHANGE ===")
        total_before = 0
        for item in inventory_items:
            logger.info(f"  - Item {item.id}: {item.brand} {item.size} - Remaining: {item.quantity_remaining}")
            total_before += item.quantity_remaining
        logger.info(f"Total diapers before: {total_before}")
    
    # Test GraphQL mutation
    mutation = InventoryMutations()
    
    # Create test input
    test_input = LogDiaperChangeInput(
        child_id=str(child.id),
        usage_type=UsageTypeEnum.DIAPER_CHANGE,
        logged_at=datetime.now(timezone.utc),
        was_wet=True,
        was_soiled=False,
        caregiver_name="Test Parent",
        notes="Test diaper change"
    )
    
    logger.info("=== LOGGING DIAPER CHANGE ===")
    result = await mutation.log_diaper_change(input=test_input, info=None)
    
    logger.info(f"Mutation result: success={result.success}, message={result.message}")
    if result.error:
        logger.error(f"Error: {result.error}")
    
    if result.updated_inventory_items:
        logger.info(f"Updated inventory items: {len(result.updated_inventory_items)}")
        for item in result.updated_inventory_items:
            logger.info(f"  - Updated item {item.id}: remaining={item.quantity_remaining}")
    
    # Check inventory after logging
    async for session in get_async_session():
        inventory_query = select(InventoryItem).where(
            and_(
                InventoryItem.child_id == child.id,
                InventoryItem.product_type == "diaper",
                InventoryItem.is_deleted == False
            )
        )
        inventory_result = await session.execute(inventory_query)
        inventory_items = inventory_result.scalars().all()
        
        logger.info("=== AFTER DIAPER CHANGE ===")
        total_after = 0
        for item in inventory_items:
            logger.info(f"  - Item {item.id}: {item.brand} {item.size} - Remaining: {item.quantity_remaining}")
            total_after += item.quantity_remaining
        logger.info(f"Total diapers after: {total_after}")
        logger.info(f"Difference: {total_before - total_after}")
        
        # Test dashboard stats after the change
        from app.graphql.inventory_resolvers import InventoryQueries
        queries = InventoryQueries()
        
        logger.info("=== TESTING DASHBOARD STATS AFTER CHANGE ===")
        dashboard_stats = await queries.get_dashboard_stats(child_id=str(child.id), info=None)
        
        logger.info("Dashboard stats after diaper change:")
        logger.info(f"  diapers_left: {dashboard_stats.diapers_left}")
        logger.info(f"  today_changes: {dashboard_stats.today_changes}")
        logger.info(f"  days_remaining: {dashboard_stats.days_remaining}")
        logger.info(f"  last_change: {dashboard_stats.last_change}")
        
        logger.info("=== TEST COMPLETE ===")

if __name__ == "__main__":
    asyncio.run(test_diaper_change_logging())