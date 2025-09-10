"""
GraphQL Inventory Management Resolvers
Dashboard stats, usage logging, and inventory tracking
"""

import logging
import uuid
from typing import Optional, List
from datetime import datetime, timezone, date, timedelta
from decimal import Decimal
import strawberry
from strawberry.types import Info
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, desc, asc
from sqlalchemy.orm import selectinload, joinedload

from app.config.database import get_async_session
from app.models import Child, InventoryItem, UsageLog, StockThreshold
from .types import (
    InventoryItem as InventoryItemType,
    UsageLog as UsageLogType,
    DashboardStats,
    CreateInventoryItemInput,
    CreateInventoryItemResponse,
    LogDiaperChangeInput,
    LogDiaperChangeResponse,
    UpdateInventoryItemInput,
    UpdateInventoryItemResponse,
    InventoryConnection,
    InventoryItemEdge,
    UsageLogConnection,
    UsageLogEdge,
    PageInfo,
    MutationResponse,
    ProductTypeEnum,
    UsageTypeEnum,
    UsageContextEnum
)

logger = logging.getLogger(__name__)


def calculate_changes_ready(diapers_left: int, wipes_left: int, avg_wipes_per_change: float = 4.0) -> int:
    """
    Calculate complete diaper changes possible with current supplies
    Returns minimum of: diapers available OR wipes available / wipes per change
    
    Args:
        diapers_left: Total diapers available
        wipes_left: Total wipes available
        avg_wipes_per_change: Average wipes used per diaper change (default 4.0 based on Canadian parent research)
    
    Returns:
        int: Number of complete diaper changes possible
    """
    logger.info(f"=== CHANGING READINESS CALCULATION START ===")
    logger.info(f"Input: diapers_left={diapers_left}, wipes_left={wipes_left}, avg_wipes_per_change={avg_wipes_per_change}")
    
    if diapers_left <= 0:
        logger.info(f"No diapers available - changes_ready=0")
        return 0
        
    if wipes_left <= 0:
        logger.info(f"No wipes available - changes_ready=0")
        return 0
    
    # Calculate possible changes from each resource
    possible_from_diapers = diapers_left
    possible_from_wipes = int(wipes_left / avg_wipes_per_change)
    
    # Return the limiting factor
    changes_ready = min(possible_from_diapers, possible_from_wipes)
    
    logger.info(f"Calculation: possible_from_diapers={possible_from_diapers}, possible_from_wipes={possible_from_wipes}")
    logger.info(f"Result: changes_ready={changes_ready} (limited by {'diapers' if changes_ready == possible_from_diapers else 'wipes'})")
    logger.info(f"=== CHANGING READINESS CALCULATION END ===")
    
    return changes_ready


def inventory_item_to_graphql(item: InventoryItem) -> InventoryItemType:
    """Convert InventoryItem model to GraphQL type"""
    return InventoryItemType(
        id=str(item.id),
        child_id=str(item.child_id),
        product_type=ProductTypeEnum(item.product_type),
        brand=item.brand,
        product_name=item.product_name,
        size=item.size,
        quantity_total=item.quantity_total,
        quantity_remaining=item.quantity_remaining,
        quantity_reserved=item.quantity_reserved,
        purchase_date=item.purchase_date,
        cost_cad=float(item.cost_cad) if item.cost_cad else None,
        expiry_date=item.expiry_date,
        storage_location=item.storage_location,
        is_opened=item.is_opened,
        opened_date=item.opened_date,
        notes=item.notes,
        quality_rating=item.quality_rating,
        would_rebuy=item.would_rebuy,
        created_at=item.created_at
    )


def usage_log_to_graphql(log: UsageLog) -> UsageLogType:
    """Convert UsageLog model to GraphQL type"""
    return UsageLogType(
        id=str(log.id),
        child_id=str(log.child_id),
        inventory_item_id=str(log.inventory_item_id) if log.inventory_item_id else None,
        usage_type=UsageTypeEnum(log.usage_type),
        logged_at=log.logged_at,
        quantity_used=log.quantity_used,
        context=UsageContextEnum(log.context) if log.context else None,
        caregiver_name=log.caregiver_name,
        was_wet=log.was_wet,
        was_soiled=log.was_soiled,
        diaper_condition=log.diaper_condition,
        had_leakage=log.had_leakage,
        product_rating=log.product_rating,
        time_since_last_change=log.time_since_last_change,
        change_duration=log.change_duration,
        notes=log.notes,
        health_notes=log.health_notes,
        created_at=log.created_at
    )


def format_time_ago(dt: datetime) -> str:
    """Format datetime as time ago string"""
    if not dt:
        return None
    
    now = datetime.now(timezone.utc)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    
    delta = now - dt
    
    if delta.days > 0:
        return f"{delta.days} day{'s' if delta.days != 1 else ''} ago"
    elif delta.seconds >= 3600:
        hours = delta.seconds // 3600
        return f"{hours} hour{'s' if hours != 1 else ''} ago"
    elif delta.seconds >= 60:
        minutes = delta.seconds // 60
        return f"{minutes} minute{'s' if minutes != 1 else ''} ago"
    else:
        return "Just now"


@strawberry.type
class InventoryQueries:
    """Inventory management queries"""
    
    @strawberry.field
    async def get_dashboard_stats(
        self,
        child_id: strawberry.ID,
        info: Info
    ) -> DashboardStats:
        """
        Get dashboard statistics for the home screen
        """
        try:
            async for session in get_async_session():
                child_uuid = uuid.UUID(child_id)
                logger.info(f"=== DASHBOARD STATS CALCULATION START for child {child_uuid} ===")
                
                # Get current diaper inventory
                diaper_query = select(InventoryItem).where(
                    and_(
                        InventoryItem.child_id == child_uuid,
                        InventoryItem.product_type == "diaper",
                        InventoryItem.is_deleted == False
                    )
                )
                diaper_items = await session.execute(diaper_query)
                diaper_items = diaper_items.scalars().all()
                
                logger.info(f"Found {len(diaper_items)} diaper inventory items")
                for item in diaper_items:
                    logger.info(f"  - Item {item.id}: {item.brand} {item.size}, total={item.quantity_total}, remaining={item.quantity_remaining}, available={item.quantity_available}")
                
                # Get child profile first to get current diaper size (needed for consistent calculations)
                child_query = select(Child).where(
                    and_(
                        Child.id == child_uuid,
                        Child.is_deleted == False
                    )
                )
                child_result = await session.execute(child_query)
                child = child_result.scalar_one_or_none()
                
                current_size = child.current_diaper_size if child else None
                logger.info(f"Child current diaper size: {current_size}")
                
                # Calculate usable diapers left (only diapers matching child's current size)
                usable_diapers_left = 0
                if current_size:
                    # Case-insensitive comparison for diaper size matching
                    usable_diapers_left = sum(
                        item.quantity_remaining for item in diaper_items 
                        if item.size.upper() == current_size.upper()
                    )
                    logger.info(f"Usable diapers left for size {current_size}: {usable_diapers_left}")
                    
                    # Log breakdown by size for clarity
                    size_breakdown = {}
                    for item in diaper_items:
                        if item.size not in size_breakdown:
                            size_breakdown[item.size] = 0
                        size_breakdown[item.size] += item.quantity_remaining
                    logger.info(f"Diaper inventory by size: {size_breakdown}")
                else:
                    logger.warning(f"Child {child_uuid} has no current_diaper_size set")
                
                # Get current wipes inventory
                wipes_query = select(InventoryItem).where(
                    and_(
                        InventoryItem.child_id == child_uuid,
                        InventoryItem.product_type == "wipes",
                        InventoryItem.is_deleted == False,
                        InventoryItem.quantity_remaining > 0
                    )
                )
                wipes_items = await session.execute(wipes_query)
                wipes_items = wipes_items.scalars().all()
                
                logger.info(f"Found {len(wipes_items)} wipes inventory items")
                for item in wipes_items:
                    logger.info(f"  - Item {item.id}: {item.brand} {item.product_name or 'N/A'}, remaining={item.quantity_remaining}")
                
                # Calculate total wipes left
                wipes_left = sum(item.quantity_remaining for item in wipes_items)
                logger.info(f"Total wipes left calculated: {wipes_left}")
                
                # Calculate changes ready using ONLY usable diapers (correct size) and wipes
                changes_ready = calculate_changes_ready(usable_diapers_left, wipes_left, avg_wipes_per_change=4.0)
                logger.info(f"Changes ready calculated: {changes_ready} (usable_diapers={usable_diapers_left}, wipes={wipes_left})")
                
                # Get today's usage logs
                today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
                today_end = today_start + timedelta(days=1)
                
                today_changes_query = select(func.count(UsageLog.id)).where(
                    and_(
                        UsageLog.child_id == child_uuid,
                        UsageLog.usage_type == "diaper_change",
                        UsageLog.logged_at >= today_start,
                        UsageLog.logged_at < today_end,
                        UsageLog.is_deleted == False
                    )
                )
                today_changes_result = await session.execute(today_changes_query)
                today_changes = today_changes_result.scalar() or 0
                logger.info(f"Today's changes count: {today_changes} (from {today_start} to {today_end})")
                
                # Get last change
                last_change_query = select(UsageLog).where(
                    and_(
                        UsageLog.child_id == child_uuid,
                        UsageLog.usage_type == "diaper_change",
                        UsageLog.is_deleted == False
                    )
                ).order_by(desc(UsageLog.logged_at)).limit(1)
                last_change_result = await session.execute(last_change_query)
                last_change_log = last_change_result.scalar_one_or_none()
                
                last_change = format_time_ago(last_change_log.logged_at) if last_change_log else None
                
                # Use child's profile daily usage as primary source (child already fetched above)
                daily_usage = float(child.daily_usage_count) if child and child.daily_usage_count else 8.0
                
                # Calculate average daily usage over last 7 days for comparison
                week_ago = datetime.now(timezone.utc) - timedelta(days=7)
                usage_query = select(func.count(UsageLog.id)).where(
                    and_(
                        UsageLog.child_id == child_uuid,
                        UsageLog.usage_type == "diaper_change",
                        UsageLog.logged_at >= week_ago,
                        UsageLog.is_deleted == False
                    )
                )
                usage_result = await session.execute(usage_query)
                weekly_usage = usage_result.scalar() or 0
                
                # Only use logged usage if we have significant data (minimum 14 logged changes in 7 days)
                # This prevents unrealistic calculations from sparse logging
                if weekly_usage >= 14:  # At least 2 changes per day average
                    logged_daily_usage = weekly_usage / 7.0
                    # Use the higher of profile setting or logged usage for safety
                    daily_usage = max(daily_usage, logged_daily_usage)
                    
                logger.info(f"Dashboard calculation for child {child_uuid}: profile_daily={child.daily_usage_count if child else 'N/A'}, weekly_logged={weekly_usage}, calculated_daily={daily_usage}")
                logger.info(f"Child profile: id={child.id if child else 'N/A'}, name={child.name if child else 'N/A'}, current_size={child.current_diaper_size if child else 'N/A'}")
                
                # Calculate days remaining
                days_remaining = None
                if usable_diapers_left > 0 and daily_usage > 0:
                    days_remaining = int(usable_diapers_left / daily_usage)
                
                dashboard_stats = DashboardStats(
                    days_remaining=days_remaining,
                    diapers_left=usable_diapers_left,
                    wipes_left=wipes_left,
                    changes_ready=changes_ready,
                    last_change=last_change,
                    today_changes=today_changes,
                    current_size=current_size
                )
                
                logger.info(f"=== DASHBOARD STATS RESULT ===")
                logger.info(f"  days_remaining: {days_remaining}")
                logger.info(f"  diapers_left (usable): {usable_diapers_left}")
                logger.info(f"  wipes_left: {wipes_left}")
                logger.info(f"  changes_ready: {changes_ready}")
                logger.info(f"  last_change: {last_change}")
                logger.info(f"  today_changes: {today_changes}")
                logger.info(f"  current_size: {current_size}")
                logger.info(f"=== DASHBOARD STATS CALCULATION END ===")
                
                return dashboard_stats
                
        except Exception as e:
            logger.error(f"Error getting dashboard stats: {e}")
            # Return default stats if error occurs
            return DashboardStats(
                days_remaining=None,
                diapers_left=0,
                wipes_left=0,
                changes_ready=0,
                last_change=None,
                today_changes=0,
                current_size=None
            )
    
    @strawberry.field
    async def get_inventory_items(
        self,
        child_id: strawberry.ID,
        info: Info,
        product_type: Optional[ProductTypeEnum] = None,
        limit: int = 50,
        offset: int = 0
    ) -> InventoryConnection:
        """Get inventory items for a child"""
        try:
            async for session in get_async_session():
                child_uuid = uuid.UUID(child_id)
                
                # Build query
                query = select(InventoryItem).where(
                    and_(
                        InventoryItem.child_id == child_uuid,
                        InventoryItem.is_deleted == False
                    )
                )
                
                if product_type:
                    query = query.where(InventoryItem.product_type == product_type.value)
                
                # Add pagination and ordering
                query = query.order_by(desc(InventoryItem.created_at)).offset(offset).limit(limit + 1)
                
                result = await session.execute(query)
                items = result.scalars().all()
                
                # Check if there are more items
                has_next_page = len(items) > limit
                if has_next_page:
                    items = items[:-1]  # Remove extra item
                
                # Convert to GraphQL types with proper Edge structure
                from base64 import b64encode
                edges = []
                for item in items:
                    cursor = b64encode(f"inventory_item:{item.id}".encode('ascii')).decode('ascii')
                    edges.append(InventoryItemEdge(
                        node=inventory_item_to_graphql(item),
                        cursor=cursor
                    ))
                
                # Get total count
                count_query = select(func.count(InventoryItem.id)).where(
                    and_(
                        InventoryItem.child_id == child_uuid,
                        InventoryItem.is_deleted == False
                    )
                )
                if product_type:
                    count_query = count_query.where(InventoryItem.product_type == product_type.value)
                
                count_result = await session.execute(count_query)
                total_count = count_result.scalar() or 0
                
                # Calculate start and end cursors
                start_cursor = edges[0].cursor if edges else None
                end_cursor = edges[-1].cursor if edges else None
                
                page_info = PageInfo(
                    has_next_page=has_next_page,
                    has_previous_page=offset > 0,
                    start_cursor=start_cursor,
                    end_cursor=end_cursor,
                    total_count=total_count
                )
                
                return InventoryConnection(
                    page_info=page_info,
                    edges=edges
                )
                
        except Exception as e:
            logger.error(f"Error getting inventory items: {e}")
            return InventoryConnection(
                page_info=PageInfo(
                    has_next_page=False,
                    has_previous_page=False,
                    start_cursor=None,
                    end_cursor=None,
                    total_count=0
                ),
                edges=[]
            )
    
    @strawberry.field
    async def get_usage_logs(
        self,
        child_id: strawberry.ID,
        info: Info,
        usage_type: Optional[UsageTypeEnum] = None,
        days_back: int = 7,
        limit: int = 50,
        offset: int = 0
    ) -> UsageLogConnection:
        """Get usage logs for a child"""
        try:
            async for session in get_async_session():
                child_uuid = uuid.UUID(child_id)
                
                # Date range
                start_date = datetime.now(timezone.utc) - timedelta(days=days_back)
                
                # Build query
                query = select(UsageLog).where(
                    and_(
                        UsageLog.child_id == child_uuid,
                        UsageLog.logged_at >= start_date,
                        UsageLog.is_deleted == False
                    )
                )
                
                if usage_type:
                    query = query.where(UsageLog.usage_type == usage_type.value)
                
                # Add pagination and ordering
                query = query.order_by(desc(UsageLog.logged_at)).offset(offset).limit(limit + 1)
                
                result = await session.execute(query)
                logs = result.scalars().all()
                
                # Check if there are more logs
                has_next_page = len(logs) > limit
                if has_next_page:
                    logs = logs[:-1]  # Remove extra log
                
                # Convert to GraphQL types with proper Edge structure
                from base64 import b64encode
                edges = []
                for log in logs:
                    cursor = b64encode(f"usage_log:{log.id}".encode('ascii')).decode('ascii')
                    edges.append(UsageLogEdge(
                        node=usage_log_to_graphql(log),
                        cursor=cursor
                    ))
                
                # Get total count
                count_query = select(func.count(UsageLog.id)).where(
                    and_(
                        UsageLog.child_id == child_uuid,
                        UsageLog.logged_at >= start_date,
                        UsageLog.is_deleted == False
                    )
                )
                if usage_type:
                    count_query = count_query.where(UsageLog.usage_type == usage_type.value)
                
                count_result = await session.execute(count_query)
                total_count = count_result.scalar() or 0
                
                # Calculate start and end cursors
                start_cursor = edges[0].cursor if edges else None
                end_cursor = edges[-1].cursor if edges else None
                
                page_info = PageInfo(
                    has_next_page=has_next_page,
                    has_previous_page=offset > 0,
                    start_cursor=start_cursor,
                    end_cursor=end_cursor,
                    total_count=total_count
                )
                
                return UsageLogConnection(
                    page_info=page_info,
                    edges=edges
                )
                
        except Exception as e:
            logger.error(f"Error getting usage logs: {e}")
            return UsageLogConnection(
                page_info=PageInfo(
                    has_next_page=False,
                    has_previous_page=False,
                    start_cursor=None,
                    end_cursor=None,
                    total_count=0
                ),
                edges=[]
            )


@strawberry.type
class InventoryMutations:
    """Inventory management mutations"""
    
    @strawberry.mutation
    async def log_diaper_change(
        self,
        input: LogDiaperChangeInput,
        info: Info
    ) -> LogDiaperChangeResponse:
        """
        Log a diaper change and update inventory
        """
        try:
            async for session in get_async_session():
                child_uuid = uuid.UUID(input.child_id)
                
                # Validate child exists
                child_query = select(Child).where(
                    and_(
                        Child.id == child_uuid,
                        Child.is_deleted == False
                    )
                )
                child_result = await session.execute(child_query)
                child = child_result.scalar_one_or_none()
                
                if not child:
                    return LogDiaperChangeResponse(
                        success=False,
                        error="Child not found"
                    )
                
                # Calculate time since last change
                last_change_query = select(UsageLog).where(
                    and_(
                        UsageLog.child_id == child_uuid,
                        UsageLog.usage_type == "diaper_change",
                        UsageLog.is_deleted == False
                    )
                ).order_by(desc(UsageLog.logged_at)).limit(1)
                last_change_result = await session.execute(last_change_query)
                last_change_log = last_change_result.scalar_one_or_none()
                
                time_since_last = None
                if last_change_log:
                    logged_at = input.logged_at or datetime.now(timezone.utc)
                    time_since_last = int((logged_at - last_change_log.logged_at).total_seconds() / 60)
                
                # Create usage log
                usage_log = UsageLog(
                    child_id=child_uuid,
                    usage_type=input.usage_type.value,
                    logged_at=input.logged_at or datetime.now(timezone.utc),
                    quantity_used=1,
                    context=input.context.value if input.context else None,
                    caregiver_name=input.caregiver_name,
                    was_wet=input.was_wet,
                    was_soiled=input.was_soiled,
                    diaper_condition=input.diaper_condition,
                    had_leakage=input.had_leakage,
                    notes=input.notes,
                    time_since_last_change=time_since_last
                )
                
                session.add(usage_log)
                
                # Find and update diaper inventory
                updated_items = []
                if input.usage_type == UsageTypeEnum.DIAPER_CHANGE:
                    logger.info(f"=== DIAPER CHANGE INVENTORY UPDATE START ===")
                    logger.info(f"Looking for diapers for child {child_uuid}, size: {child.current_diaper_size}")
                    
                    # Use no_autoflush to prevent premature flushing during inventory lookup
                    with session.no_autoflush:
                        # Find available diaper inventory for child's current size (case-insensitive)
                        inventory_query = select(InventoryItem).where(
                            and_(
                                InventoryItem.child_id == child_uuid,
                                InventoryItem.product_type == "diaper",
                                InventoryItem.quantity_remaining > 0,
                                InventoryItem.is_deleted == False
                            )
                        ).order_by(asc(InventoryItem.expiry_date), asc(InventoryItem.created_at))
                        
                        inventory_result = await session.execute(inventory_query)
                        all_inventory_items = inventory_result.scalars().all()
                        
                        # Filter by size (case-insensitive)
                        child_size_upper = child.current_diaper_size.upper()
                        logger.info(f"Searching for size: '{child_size_upper}' among {len(all_inventory_items)} inventory items")
                        for i, item in enumerate(all_inventory_items):
                            logger.info(f"  Item {i}: size='{item.size}', size.upper()='{item.size.upper()}', match={item.size.upper() == child_size_upper}")
                        
                        inventory_item = None
                        for item in all_inventory_items:
                            if item.size.upper() == child_size_upper:
                                inventory_item = item
                                break
                    
                    if inventory_item:
                        logger.info(f"Found inventory item {inventory_item.id}: {inventory_item.brand} {inventory_item.size}")
                        logger.info(f"  Before use: total={inventory_item.quantity_total}, remaining={inventory_item.quantity_remaining}, available={inventory_item.quantity_available}")
                        
                        # Use one diaper from inventory
                        if inventory_item.use_quantity(1, usage_log.logged_at):
                            logger.info(f"  After use: remaining={inventory_item.quantity_remaining}, available={inventory_item.quantity_available}")
                            usage_log.inventory_item_id = inventory_item.id
                            updated_items.append(inventory_item_to_graphql(inventory_item))
                            logger.info(f"Successfully used 1 diaper from inventory item {inventory_item.id}")
                        else:
                            logger.error(f"FAILED to use diaper from inventory item {inventory_item.id} - insufficient stock")
                    else:
                        logger.error(f"No diaper inventory available for child {child_uuid} size {child.current_diaper_size}")
                    
                    logger.info(f"=== DIAPER CHANGE INVENTORY UPDATE END ===")
                
                logger.info(f"Committing diaper change transaction for usage log {usage_log.id}")
                await session.commit()
                logger.info(f"Transaction committed successfully")
                
                return LogDiaperChangeResponse(
                    success=True,
                    message="Diaper change logged successfully",
                    usage_log=usage_log_to_graphql(usage_log),
                    updated_inventory_items=updated_items
                )
                
        except Exception as e:
            logger.error(f"Error logging diaper change: {e}")
            return LogDiaperChangeResponse(
                success=False,
                error=f"Failed to log diaper change: {str(e)}"
            )
    
    @strawberry.mutation
    async def create_inventory_item(
        self,
        input: CreateInventoryItemInput,
        info: Info
    ) -> CreateInventoryItemResponse:
        """
        Create a new inventory item
        """
        try:
            async for session in get_async_session():
                child_uuid = uuid.UUID(input.child_id)
                
                # Validate child exists
                child_query = select(Child).where(
                    and_(
                        Child.id == child_uuid,
                        Child.is_deleted == False
                    )
                )
                child_result = await session.execute(child_query)
                child = child_result.scalar_one_or_none()
                
                if not child:
                    return CreateInventoryItemResponse(
                        success=False,
                        error="Child not found"
                    )
                
                # Validate input
                if input.quantity_total <= 0:
                    return CreateInventoryItemResponse(
                        success=False,
                        error="Quantity must be greater than 0"
                    )
                
                # Create inventory item
                cost_cad_decimal = Decimal(str(input.cost_cad)) if input.cost_cad else None
                
                inventory_item = InventoryItem(
                    child_id=child_uuid,
                    product_type=input.product_type.value,
                    brand=input.brand,
                    product_name=input.product_name,
                    size=input.size,
                    quantity_total=input.quantity_total,
                    quantity_remaining=input.quantity_total,
                    cost_cad=cost_cad_decimal,
                    expiry_date=input.expiry_date,
                    storage_location=input.storage_location,
                    notes=input.notes
                )
                
                session.add(inventory_item)
                await session.commit()
                
                return CreateInventoryItemResponse(
                    success=True,
                    message="Inventory item created successfully",
                    inventory_item=inventory_item_to_graphql(inventory_item)
                )
                
        except Exception as e:
            logger.error(f"Error creating inventory item: {e}")
            return CreateInventoryItemResponse(
                success=False,
                error=f"Failed to create inventory item: {str(e)}"
            )
    
    @strawberry.mutation
    async def update_inventory_item(
        self,
        inventory_item_id: strawberry.ID,
        input: UpdateInventoryItemInput,
        info: Info
    ) -> UpdateInventoryItemResponse:
        """
        Update an existing inventory item
        """
        try:
            async for session in get_async_session():
                item_uuid = uuid.UUID(inventory_item_id)
                
                # Get inventory item
                item_query = select(InventoryItem).where(
                    and_(
                        InventoryItem.id == item_uuid,
                        InventoryItem.is_deleted == False
                    )
                )
                item_result = await session.execute(item_query)
                inventory_item = item_result.scalar_one_or_none()
                
                if not inventory_item:
                    return UpdateInventoryItemResponse(
                        success=False,
                        error="Inventory item not found"
                    )
                
                # Update fields if provided
                if input.quantity_remaining is not None:
                    if input.quantity_remaining < 0 or input.quantity_remaining > inventory_item.quantity_total:
                        return UpdateInventoryItemResponse(
                            success=False,
                            error="Invalid quantity remaining"
                        )
                    inventory_item.quantity_remaining = input.quantity_remaining
                
                if input.storage_location is not None:
                    inventory_item.storage_location = input.storage_location
                
                if input.notes is not None:
                    inventory_item.notes = input.notes
                
                if input.quality_rating is not None:
                    if not (1 <= input.quality_rating <= 5):
                        return UpdateInventoryItemResponse(
                            success=False,
                            error="Quality rating must be between 1 and 5"
                        )
                    inventory_item.quality_rating = input.quality_rating
                
                if input.would_rebuy is not None:
                    inventory_item.would_rebuy = input.would_rebuy
                
                await session.commit()
                
                return UpdateInventoryItemResponse(
                    success=True,
                    message="Inventory item updated successfully",
                    inventory_item=inventory_item_to_graphql(inventory_item)
                )
                
        except Exception as e:
            logger.error(f"Error updating inventory item: {e}")
            return UpdateInventoryItemResponse(
                success=False,
                error=f"Failed to update inventory item: {str(e)}"
            )# Changing Readiness Implementation Complete
