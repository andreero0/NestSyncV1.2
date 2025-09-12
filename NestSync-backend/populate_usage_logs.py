#!/usr/bin/env python3
"""
Populate Usage Logs Script
Creates realistic usage log data for the timeline display

This script creates meaningful usage log entries that correspond to
existing inventory data, using Canadian timezone compliance.
"""

import os
import sys
import uuid
import random
import logging
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from typing import List, Dict

# Add the app directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.config.database import get_sync_session, create_database_engines
from app.config.settings import settings
from app.models.inventory import UsageLog, InventoryItem, UsageType, UsageContext
from app.models.child import Child

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Canadian timezone (America/Toronto)
CANADIAN_TZ = timezone(timedelta(hours=-5))  # EST (will be adjusted for DST automatically)

# Known child ID from previous investigation
CHILD_ID = "38e5b650-62f6-4305-aecf-41187514bd54"

def convert_to_canadian_time(dt: datetime) -> datetime:
    """Convert datetime to Canadian timezone"""
    # Convert to UTC first if it has timezone info
    if dt.tzinfo is not None:
        dt_utc = dt.astimezone(timezone.utc)
    else:
        dt_utc = dt.replace(tzinfo=timezone.utc)
    
    # For simplicity, using EST (-5). In production, use pytz for proper DST handling
    return dt_utc.astimezone(CANADIAN_TZ)

def create_realistic_usage_patterns() -> List[Dict]:
    """
    Create realistic usage patterns for the past 7 days
    Simulates real parent behavior with varying schedules
    """
    usage_entries = []
    base_time = datetime.now(timezone.utc) - timedelta(days=7)
    
    caregivers = ["Mom", "Dad", "Grandma", "Daycare Staff", "Babysitter"]
    contexts = [UsageContext.HOME, UsageContext.DAYCARE, UsageContext.OUTING, UsageContext.GRANDPARENTS]
    
    # Generate realistic daily patterns
    for day_offset in range(7):
        current_date = base_time + timedelta(days=day_offset)
        
        # Morning routine (6-10 AM)
        morning_changes = random.randint(2, 4)
        for i in range(morning_changes):
            time_offset = random.randint(6*60, 10*60)  # 6-10 AM in minutes
            usage_time = current_date + timedelta(minutes=time_offset)
            
            # Morning diaper changes
            entry = {
                'usage_type': UsageType.DIAPER_CHANGE,
                'logged_at': convert_to_canadian_time(usage_time),
                'quantity_used': 1,
                'context': random.choice([UsageContext.HOME, UsageContext.DAYCARE]),
                'caregiver_name': random.choice(caregivers),
                'was_wet': random.choice([True, False]),
                'was_soiled': random.choice([True, False]),
                'had_leakage': random.choice([True, False]) if random.random() < 0.2 else False,
                'notes': random.choice([
                    "Regular morning change",
                    "Heavy overnight diaper",
                    "Quick change before breakfast",
                    "Good sleep, minimal wetness"
                ]) if random.random() < 0.3 else None,
                'time_since_last_change': random.randint(480, 720) if i == 0 else random.randint(120, 240)  # First change: 8-12h, others: 2-4h
            }
            usage_entries.append(entry)
            
            # Add wipe usage with diaper changes
            if random.random() < 0.8:  # 80% of diaper changes use wipes
                wipe_entry = {
                    'usage_type': UsageType.WIPE_USE,
                    'logged_at': convert_to_canadian_time(usage_time + timedelta(seconds=30)),
                    'quantity_used': random.randint(3, 8),  # 3-8 wipes per change
                    'context': entry['context'],
                    'caregiver_name': entry['caregiver_name'],
                    'notes': f"Used with diaper change - {entry['quantity_used']} wipes"
                }
                usage_entries.append(wipe_entry)
        
        # Daytime changes (10 AM - 8 PM)
        daytime_changes = random.randint(4, 7)
        for i in range(daytime_changes):
            time_offset = random.randint(10*60, 20*60)  # 10 AM - 8 PM
            usage_time = current_date + timedelta(minutes=time_offset)
            
            # Vary usage types during daytime
            usage_type = random.choices([
                UsageType.DIAPER_CHANGE,
                UsageType.PREVENTIVE_CHANGE,
                UsageType.ACCIDENT_CLEANUP,
                UsageType.CREAM_APPLICATION
            ], weights=[70, 15, 10, 5])[0]
            
            entry = {
                'usage_type': usage_type,
                'logged_at': convert_to_canadian_time(usage_time),
                'quantity_used': 1,
                'context': random.choice(contexts),
                'caregiver_name': random.choice(caregivers),
                'time_since_last_change': random.randint(90, 300)  # 1.5-5 hours
            }
            
            # Add type-specific details
            if usage_type == UsageType.DIAPER_CHANGE:
                entry.update({
                    'was_wet': random.choice([True, False]),
                    'was_soiled': random.choice([True, False]),
                    'had_leakage': random.choice([True, False]) if random.random() < 0.15 else False
                })
            elif usage_type == UsageType.ACCIDENT_CLEANUP:
                entry.update({
                    'had_leakage': True,
                    'was_soiled': True,
                    'notes': 'Cleanup after leakage incident'
                })
            elif usage_type == UsageType.CREAM_APPLICATION:
                entry.update({
                    'notes': 'Preventive diaper cream application',
                    'health_notes': 'Applied cream to prevent diaper rash'
                })
            
            usage_entries.append(entry)
        
        # Evening/Overnight routine (8 PM - 12 AM)
        evening_changes = random.randint(1, 3)
        for i in range(evening_changes):
            time_offset = random.randint(20*60, 24*60)  # 8 PM - 12 AM
            usage_time = current_date + timedelta(minutes=time_offset)
            
            usage_type = UsageType.OVERNIGHT_CHANGE if i == evening_changes - 1 else UsageType.DIAPER_CHANGE
            
            entry = {
                'usage_type': usage_type,
                'logged_at': convert_to_canadian_time(usage_time),
                'quantity_used': 1,
                'context': UsageContext.HOME,
                'caregiver_name': random.choice(["Mom", "Dad"]),
                'was_wet': True,
                'was_soiled': random.choice([True, False]),
                'notes': "Bedtime routine" if usage_type == UsageType.OVERNIGHT_CHANGE else "Evening change",
                'time_since_last_change': random.randint(150, 300)  # 2.5-5 hours
            }
            usage_entries.append(entry)
    
    # Sort entries by timestamp
    usage_entries.sort(key=lambda x: x['logged_at'])
    
    return usage_entries

def populate_usage_logs():
    """
    Main function to populate usage logs with realistic data
    """
    try:
        logger.info("Starting usage logs population...")
        
        # Initialize database connection
        create_database_engines()
        session = get_sync_session()
        
        # Verify child exists
        child = session.query(Child).filter(Child.id == uuid.UUID(CHILD_ID)).first()
        if not child:
            logger.error(f"Child with ID {CHILD_ID} not found!")
            return False
        
        logger.info(f"Found child: {child.name}")
        
        # Get existing inventory items for reference
        inventory_items = session.query(InventoryItem).filter(
            InventoryItem.child_id == uuid.UUID(CHILD_ID)
        ).all()
        
        logger.info(f"Found {len(inventory_items)} inventory items")
        for item in inventory_items:
            logger.info(f"  - {item.brand} {item.product_type} (size: {item.size}, remaining: {item.quantity_remaining})")
        
        # Check if usage logs already exist
        existing_logs = session.query(UsageLog).filter(
            UsageLog.child_id == uuid.UUID(CHILD_ID)
        ).count()
        
        if existing_logs > 0:
            logger.warning(f"Found {existing_logs} existing usage logs. Continuing anyway...")
        
        # Generate realistic usage patterns
        usage_patterns = create_realistic_usage_patterns()
        logger.info(f"Generated {len(usage_patterns)} usage log entries")
        
        # Insert usage logs
        created_count = 0
        for pattern in usage_patterns:
            try:
                # Find appropriate inventory item if needed
                inventory_item_id = None
                if pattern['usage_type'] in [UsageType.DIAPER_CHANGE, UsageType.PREVENTIVE_CHANGE, UsageType.OVERNIGHT_CHANGE]:
                    diaper_items = [item for item in inventory_items if item.product_type == 'diaper']
                    if diaper_items:
                        inventory_item_id = random.choice(diaper_items).id
                elif pattern['usage_type'] == UsageType.WIPE_USE:
                    wipe_items = [item for item in inventory_items if item.product_type == 'wipes']
                    if wipe_items:
                        inventory_item_id = random.choice(wipe_items).id
                elif pattern['usage_type'] == UsageType.CREAM_APPLICATION:
                    cream_items = [item for item in inventory_items if item.product_type == 'diaper_cream']
                    if cream_items:
                        inventory_item_id = random.choice(cream_items).id
                
                # Create usage log entry
                usage_log = UsageLog(
                    child_id=uuid.UUID(CHILD_ID),
                    inventory_item_id=inventory_item_id,
                    usage_type=pattern['usage_type'],
                    logged_at=pattern['logged_at'],
                    quantity_used=pattern['quantity_used'],
                    context=pattern.get('context'),
                    caregiver_name=pattern.get('caregiver_name'),
                    was_wet=pattern.get('was_wet'),
                    was_soiled=pattern.get('was_soiled'),
                    had_leakage=pattern.get('had_leakage'),
                    notes=pattern.get('notes'),
                    health_notes=pattern.get('health_notes'),
                    time_since_last_change=pattern.get('time_since_last_change')
                )
                
                session.add(usage_log)
                created_count += 1
                
                # Commit in batches
                if created_count % 10 == 0:
                    session.commit()
                    logger.info(f"Committed {created_count} usage logs...")
                
            except Exception as e:
                logger.error(f"Error creating usage log: {e}")
                session.rollback()
                continue
        
        # Final commit
        session.commit()
        logger.info(f"Successfully created {created_count} usage log entries")
        
        # Update inventory quantities to reflect usage
        logger.info("Updating inventory quantities based on usage...")
        for item in inventory_items:
            if item.product_type == 'diaper':
                # Estimate diaper usage (about 6-8 per day for 7 days)
                diapers_used = random.randint(35, 50)
                if item.quantity_remaining > diapers_used:
                    item.quantity_remaining -= diapers_used
                    logger.info(f"  - Reduced {item.brand} diapers by {diapers_used}")
            elif item.product_type == 'wipes':
                # Estimate wipe usage (about 30-50 per day for 7 days)  
                wipes_used = random.randint(200, 300)
                if item.quantity_remaining > wipes_used:
                    item.quantity_remaining -= wipes_used
                    logger.info(f"  - Reduced {item.brand} wipes by {wipes_used}")
            elif item.product_type == 'diaper_cream':
                # Cream usage is minimal
                cream_used = random.randint(5, 15)
                if item.quantity_remaining > cream_used:
                    item.quantity_remaining -= cream_used
                    logger.info(f"  - Reduced {item.brand} cream by {cream_used}")
        
        session.commit()
        logger.info("Inventory quantities updated successfully")
        
        # Verify the data was created
        final_count = session.query(UsageLog).filter(
            UsageLog.child_id == uuid.UUID(CHILD_ID)
        ).count()
        
        logger.info(f"Total usage logs in database: {final_count}")
        
        # Show recent entries
        recent_logs = session.query(UsageLog).filter(
            UsageLog.child_id == uuid.UUID(CHILD_ID)
        ).order_by(UsageLog.logged_at.desc()).limit(5).all()
        
        logger.info("Recent usage log entries:")
        for log in recent_logs:
            logger.info(f"  - {log.logged_at.strftime('%Y-%m-%d %H:%M')} | {log.usage_type} | {log.caregiver_name} | {log.context}")
        
        session.close()
        return True
        
    except Exception as e:
        logger.error(f"Error populating usage logs: {e}")
        if 'session' in locals():
            session.rollback()
            session.close()
        return False

if __name__ == "__main__":
    logger.info("=" * 60)
    logger.info("NestSync Usage Logs Population Script")
    logger.info("Creating realistic timeline data for Canadian compliance")
    logger.info("=" * 60)
    
    success = populate_usage_logs()
    
    if success:
        logger.info("✅ Usage logs populated successfully!")
        logger.info("Timeline should now display actual activity data")
    else:
        logger.error("❌ Failed to populate usage logs")
        sys.exit(1)