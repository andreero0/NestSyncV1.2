#!/usr/bin/env python3
"""
System-Wide Demo Reset Script
Comprehensive database cleanup and demo data population for NestSync

This script performs:
1. Complete data backup
2. Orphaned record cleanup  
3. Soft delete all children (CASCADE to related tables)
4. Reset user states to clean slate
5. Create realistic demo user profiles
6. Populate comprehensive test data
7. Verify data integrity

Demo Users Created:
- Sarah (New Parent): parents@nestsync.com
- Mike (Working Dad): mike.demo@nestsync.com  
- Jessica (Organized Planner): jessica.demo@nestsync.com
- Carlos (Tech-Savvy): carlos.demo@nestsync.com
"""

import asyncio
import json
import uuid
from datetime import datetime, timezone, date, timedelta
from typing import Dict, List, Optional, Any
import logging
from pathlib import Path

from app.config.database import create_database_engines, get_async_session
from app.models import (
    User, Child, InventoryItem, UsageLog, StockThreshold, 
    ConsentRecord, NotificationPreferences,
    DiaperSize, Gender, ProductType, PurchaseSource, 
    UsageType, UsageContext, NotificationFrequency, ThresholdType
)
from sqlalchemy import select, delete, func, and_, or_
from sqlalchemy.orm import selectinload

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DemoDataGenerator:
    """Generates realistic demo data for Canadian diaper planning app"""
    
    def __init__(self):
        self.backup_dir = Path("./demo_reset_backups")
        self.backup_dir.mkdir(exist_ok=True)
        self.timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        
    async def execute_full_reset(self):
        """Execute complete system-wide demo reset"""
        logger.info("🚀 Starting System-Wide Demo Reset")
        
        async for session in get_async_session():
            try:
                # Phase 1: Backup and Analysis
                await self.create_complete_backup(session)
                await self.analyze_orphaned_data(session)
                
                # Phase 2: Clean Slate
                await self.clean_orphaned_records(session)
                await self.soft_delete_all_children(session)
                await self.reset_user_states(session)
                
                # Phase 3: Create Demo Users
                demo_users = await self.create_demo_user_profiles(session)
                
                # Phase 4: Populate Test Data
                await self.populate_comprehensive_demo_data(session, demo_users)
                
                # Phase 5: Verification
                await self.verify_data_integrity(session)
                
                await session.commit()
                logger.info("✅ System-Wide Demo Reset Completed Successfully!")
                
            except Exception as e:
                await session.rollback()
                logger.error(f"❌ Error during demo reset: {e}")
                raise
    
    async def create_complete_backup(self, session):
        """Create comprehensive backup of all data before cleanup"""
        logger.info("📁 Creating complete data backup...")
        
        backup_data = {
            "timestamp": self.timestamp,
            "users": [],
            "children": [],
            "inventory_items": [],
            "usage_logs": [],
            "consent_records": []
        }
        
        # Backup users (without eager loading due to dynamic relationship)
        users_result = await session.execute(select(User))
        users = users_result.scalars().all()
        
        for user in users:
            # Count children separately since children is a dynamic relationship
            children_count_result = await session.execute(
                select(func.count(Child.id)).where(
                    and_(Child.parent_id == user.id, Child.is_deleted == False)
                )
            )
            children_count = children_count_result.scalar()
            
            backup_data["users"].append({
                "id": str(user.id),
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "status": user.status,
                "created_at": user.created_at.isoformat() if user.created_at else None,
                "children_count": children_count
            })
        
        # Backup children
        children_result = await session.execute(select(Child))
        children = children_result.scalars().all()
        
        for child in children:
            backup_data["children"].append({
                "id": str(child.id),
                "parent_id": str(child.parent_id),
                "name": child.name,
                "date_of_birth": child.date_of_birth.isoformat() if child.date_of_birth else None,
                "current_diaper_size": child.current_diaper_size,
                "is_deleted": child.is_deleted,
                "created_at": child.created_at.isoformat() if child.created_at else None
            })
        
        # Backup inventory
        inventory_result = await session.execute(select(InventoryItem))
        inventory_items = inventory_result.scalars().all()
        
        for item in inventory_items:
            backup_data["inventory_items"].append({
                "id": str(item.id),
                "child_id": str(item.child_id),
                "product_type": item.product_type,
                "brand": getattr(item, 'brand', None),
                "quantity": getattr(item, 'quantity', None),
                "created_at": item.created_at.isoformat() if item.created_at else None
            })
        
        # Save backup
        backup_file = self.backup_dir / f"complete_backup_{self.timestamp}.json"
        with open(backup_file, 'w') as f:
            json.dump(backup_data, f, indent=2, default=str)
        
        logger.info(f"✅ Backup saved to {backup_file}")
        logger.info(f"   📊 Users: {len(backup_data['users'])}")
        logger.info(f"   👶 Children: {len(backup_data['children'])}")  
        logger.info(f"   📦 Inventory Items: {len(backup_data['inventory_items'])}")
    
    async def analyze_orphaned_data(self, session):
        """Analyze and report orphaned records"""
        logger.info("🔍 Analyzing orphaned data...")
        
        # Find inventory items without valid children
        orphaned_inventory = await session.execute(
            select(InventoryItem).outerjoin(Child).where(Child.id.is_(None))
        )
        orphaned_inventory_count = len(orphaned_inventory.scalars().all())
        
        # Find usage logs without valid children
        orphaned_usage = await session.execute(
            select(UsageLog).outerjoin(Child).where(Child.id.is_(None))
        )
        orphaned_usage_count = len(orphaned_usage.scalars().all())
        
        # Find consent records without valid users
        orphaned_consent = await session.execute(
            select(ConsentRecord).outerjoin(User).where(User.id.is_(None))
        )
        orphaned_consent_count = len(orphaned_consent.scalars().all())
        
        logger.info(f"   🗑️ Orphaned Inventory Items: {orphaned_inventory_count}")
        logger.info(f"   🗑️ Orphaned Usage Logs: {orphaned_usage_count}")
        logger.info(f"   🗑️ Orphaned Consent Records: {orphaned_consent_count}")
    
    async def clean_orphaned_records(self, session):
        """Remove orphaned records from database"""
        logger.info("🧹 Cleaning orphaned records...")
        
        # Clean orphaned inventory items
        orphaned_inventory_result = await session.execute(
            delete(InventoryItem).where(
                InventoryItem.child_id.notin_(
                    select(Child.id).where(Child.is_deleted == False)
                )
            )
        )
        inventory_cleaned = orphaned_inventory_result.rowcount
        
        # Clean orphaned usage logs
        orphaned_usage_result = await session.execute(
            delete(UsageLog).where(
                UsageLog.child_id.notin_(
                    select(Child.id).where(Child.is_deleted == False)
                )
            )
        )
        usage_cleaned = orphaned_usage_result.rowcount
        
        # Clean orphaned stock thresholds
        orphaned_thresholds_result = await session.execute(
            delete(StockThreshold).where(
                StockThreshold.child_id.notin_(
                    select(Child.id).where(Child.is_deleted == False)
                )
            )
        )
        thresholds_cleaned = orphaned_thresholds_result.rowcount
        
        logger.info(f"   ✅ Cleaned {inventory_cleaned} orphaned inventory items")
        logger.info(f"   ✅ Cleaned {usage_cleaned} orphaned usage logs")
        logger.info(f"   ✅ Cleaned {thresholds_cleaned} orphaned thresholds")
    
    async def soft_delete_all_children(self, session):
        """Soft delete all existing children (CASCADE will handle related data)"""
        logger.info("👶 Soft deleting all existing children...")
        
        # Get all active children
        children_result = await session.execute(
            select(Child).where(Child.is_deleted == False)
        )
        children = children_result.scalars().all()
        
        deleted_count = 0
        for child in children:
            child.soft_delete()
            deleted_count += 1
        
        logger.info(f"   ✅ Soft deleted {deleted_count} children (CASCADE will clean related data)")
    
    async def reset_user_states(self, session):
        """Reset all demo users to clean state"""
        logger.info("👤 Resetting user states to clean slate...")
        
        # Get all users
        users_result = await session.execute(select(User))
        users = users_result.scalars().all()
        
        reset_count = 0
        for user in users:
            # Reset onboarding state
            user.onboarding_completed = False
            user.onboarding_step = None
            
            # Clear any wizard data
            if hasattr(user, 'wizard_data'):
                user.wizard_data = None
                
            reset_count += 1
        
        logger.info(f"   ✅ Reset {reset_count} user accounts to clean state")
    
    async def create_demo_user_profiles(self, session) -> Dict[str, User]:
        """Create or update demo user profiles based on personas"""
        logger.info("🎭 Creating demo user profiles...")
        
        demo_users = {}
        
        # Demo user configurations based on project personas
        user_configs = [
            {
                "email": "parents@nestsync.com",
                "persona": "Sarah (New Parent)",
                "first_name": "Sarah",
                "last_name": "Chen",
                "province": "BC",
                "timezone": "America/Vancouver"
            },
            {
                "email": "mike.demo@nestsync.com", 
                "persona": "Mike (Working Dad)",
                "first_name": "Mike",
                "last_name": "Thompson", 
                "province": "ON",
                "timezone": "America/Toronto"
            },
            {
                "email": "jessica.demo@nestsync.com",
                "persona": "Jessica (Organized Planner)",
                "first_name": "Jessica",
                "last_name": "Rodriguez",
                "province": "AB", 
                "timezone": "America/Edmonton"
            },
            {
                "email": "carlos.demo@nestsync.com",
                "persona": "Carlos (Tech-Savvy)",
                "first_name": "Carlos",
                "last_name": "Dubois",
                "province": "QC",
                "timezone": "America/Montreal"
            }
        ]
        
        for config in user_configs:
            # Check if user exists
            user_result = await session.execute(
                select(User).where(User.email == config["email"])
            )
            user = user_result.scalar_one_or_none()
            
            if user:
                logger.info(f"   📝 Updating existing user: {config['persona']}")
            else:
                logger.info(f"   ➕ Creating new user: {config['persona']}")
                user = User()
                user.email = config["email"]
                session.add(user)
            
            # Update user properties
            user.first_name = config["first_name"]
            user.last_name = config["last_name"]
            user.display_name = f"{config['first_name']} {config['last_name']}"
            user.status = "active"
            user.email_verified = True
            user.email_verified_at = datetime.now(timezone.utc)
            user.province = config["province"]
            user.timezone = config["timezone"]
            
            # PIPEDA compliance settings
            user.privacy_policy_accepted = True
            user.privacy_policy_accepted_at = datetime.now(timezone.utc)
            user.terms_of_service_accepted = True
            user.terms_of_service_accepted_at = datetime.now(timezone.utc)
            user.marketing_consent = True
            user.analytics_consent = True
            user.data_sharing_consent = False  # Conservative default
            
            demo_users[config["email"]] = user
        
        await session.flush()  # Get user IDs for children creation
        logger.info(f"   ✅ Created/updated {len(demo_users)} demo user profiles")
        
        return demo_users
    
    async def populate_comprehensive_demo_data(self, session, demo_users: Dict[str, User]):
        """Create comprehensive, realistic demo data for each persona"""
        logger.info("🎪 Populating comprehensive demo data...")
        
        # Child configurations for each persona
        child_configs = [
            {
                "parent_email": "parents@nestsync.com",
                "name": "Emma",
                "age_months": 6,
                "gender": Gender.GIRL,
                "current_size": DiaperSize.SIZE_2,
                "daily_usage": 8,
                "persona_notes": "New parent - basic setup, minimal complexity"
            },
            {
                "parent_email": "mike.demo@nestsync.com",
                "name": "Alex", 
                "age_months": 14,
                "gender": Gender.BOY,
                "current_size": DiaperSize.SIZE_4,
                "daily_usage": 7,
                "persona_notes": "Working dad - mobile-optimized, quick logging"
            },
            {
                "parent_email": "jessica.demo@nestsync.com",
                "name": "Sophie",
                "age_months": 18,
                "gender": Gender.GIRL, 
                "current_size": DiaperSize.SIZE_4,
                "daily_usage": 6,
                "persona_notes": "Organized planner - detailed tracking, analytics"
            },
            {
                "parent_email": "carlos.demo@nestsync.com",
                "name": "Diego",
                "age_months": 24,
                "gender": Gender.BOY,
                "current_size": DiaperSize.SIZE_5,
                "daily_usage": 5,
                "persona_notes": "Tech-savvy - advanced features, bilingual"
            }
        ]
        
        for child_config in child_configs:
            parent_user = demo_users[child_config["parent_email"]]
            
            # Create child
            child = Child()
            child.parent_id = parent_user.id
            child.name = child_config["name"]
            
            # Calculate realistic birth date
            birth_date = date.today() - timedelta(days=child_config["age_months"] * 30)
            child.date_of_birth = birth_date
            
            child.gender = child_config["gender"]
            child.current_diaper_size = child_config["current_size"]
            child.daily_usage_count = child_config["daily_usage"]
            
            # Realistic physical characteristics
            child.current_weight_kg = self.get_realistic_weight(child_config["age_months"])
            child.current_height_cm = self.get_realistic_height(child_config["age_months"])
            
            # Complete onboarding
            child.onboarding_completed = True
            child.onboarding_step = "completed"
            
            # Create wizard completion data
            child.wizard_data = {
                "basic_info": {
                    "completed_at": (datetime.now(timezone.utc) - timedelta(days=30)).isoformat(),
                    "data": {"name": child.name, "birth_date": birth_date.isoformat()}
                },
                "size_selection": {
                    "completed_at": (datetime.now(timezone.utc) - timedelta(days=29)).isoformat(), 
                    "data": {"size": child.current_diaper_size}
                },
                "usage_pattern": {
                    "completed_at": (datetime.now(timezone.utc) - timedelta(days=28)).isoformat(),
                    "data": {"daily_changes": child.daily_usage_count}
                },
                "initial_inventory": {
                    "completed_at": (datetime.now(timezone.utc) - timedelta(days=27)).isoformat(),
                    "data": {"setup_complete": True}
                }
            }
            
            session.add(child)
            await session.flush()  # Get child ID for inventory
            
            # Create realistic inventory based on persona
            await self.create_persona_inventory(session, child, child_config)
            
            # Create usage history based on persona  
            await self.create_persona_usage_history(session, child, child_config)
            
            # Update parent onboarding status
            parent_user.onboarding_completed = True
            parent_user.onboarding_completed_at = datetime.now(timezone.utc) - timedelta(days=27)
            
            logger.info(f"   👶 Created child: {child.name} for {child_config['parent_email']}")
        
        logger.info("   ✅ Demo data population completed")
    
    def get_realistic_weight(self, age_months: int) -> float:
        """Get realistic weight for age in months"""
        # Based on Canadian growth charts
        base_weights = {
            6: 7.8,   # 6 months
            12: 9.6,  # 12 months  
            14: 10.2, # 14 months
            18: 11.0, # 18 months
            24: 12.5  # 24 months
        }
        return base_weights.get(age_months, 10.0)
    
    def get_realistic_height(self, age_months: int) -> float:
        """Get realistic height for age in months"""
        # Based on Canadian growth charts (cm)
        base_heights = {
            6: 67.0,   # 6 months
            12: 76.0,  # 12 months
            14: 78.5,  # 14 months  
            18: 82.0,  # 18 months
            24: 87.0   # 24 months
        }
        return base_heights.get(age_months, 75.0)
    
    async def create_persona_inventory(self, session, child: Child, config: Dict):
        """Create persona-specific inventory data"""
        current_size = config["current_size"]
        
        # Basic inventory for all personas
        basic_quantity = 45 if config["parent_email"] == "parents@nestsync.com" else 85
        inventory_items = [
            {
                "product_type": ProductType.DIAPER,
                "size": current_size,
                "brand": "Pampers",
                "quantity_total": basic_quantity,
                "quantity_remaining": basic_quantity,
                "cost_per_unit": 0.35,
                "purchase_source": PurchaseSource.STORE_PURCHASE
            }
        ]
        
        # Add complexity based on persona
        if config["parent_email"] == "jessica.demo@nestsync.com":
            # Organized planner - multiple brands and sizes
            next_size_qty = 24
            wipes_qty = 480
            inventory_items.extend([
                {
                    "product_type": ProductType.DIAPER,
                    "size": DiaperSize.SIZE_5 if current_size == DiaperSize.SIZE_4 else DiaperSize.SIZE_3,
                    "brand": "Huggies",
                    "quantity_total": next_size_qty,
                    "quantity_remaining": next_size_qty,
                    "cost_per_unit": 0.38,
                    "purchase_source": PurchaseSource.ONLINE_PURCHASE
                },
                {
                    "product_type": ProductType.WIPES,
                    "brand": "Pampers",
                    "size": "standard",  # Wipes don't have diaper sizes
                    "quantity_total": wipes_qty,  # 8 packs of 60
                    "quantity_remaining": wipes_qty,
                    "cost_per_unit": 0.02,
                    "purchase_source": PurchaseSource.SUBSCRIPTION
                }
            ])
        elif config["parent_email"] == "carlos.demo@nestsync.com":
            # Tech-savvy - training pants transition
            training_qty = 32
            inventory_items.extend([
                {
                    "product_type": ProductType.TRAINING_PANTS,
                    "size": current_size,
                    "brand": "Huggies Pull-Ups",
                    "quantity_total": training_qty,
                    "quantity_remaining": training_qty,
                    "cost_per_unit": 0.45,
                    "purchase_source": PurchaseSource.ONLINE_PURCHASE
                }
            ])
        
        for item_data in inventory_items:
            inventory_item = InventoryItem()
            inventory_item.child_id = child.id
            inventory_item.product_type = item_data["product_type"]
            
            # Set additional attributes dynamically based on model
            for key, value in item_data.items():
                if key != "product_type" and hasattr(inventory_item, key):
                    setattr(inventory_item, key, value)
            
            # Set purchase date to recent past (datetime required, not date)
            if hasattr(inventory_item, 'purchase_date'):
                inventory_item.purchase_date = datetime.now(timezone.utc) - timedelta(days=7)
            
            session.add(inventory_item)
    
    async def create_persona_usage_history(self, session, child: Child, config: Dict):
        """Create realistic usage history based on persona"""
        # Create usage logs for the past 7 days
        daily_usage = config["daily_usage"]
        
        for days_ago in range(7):
            log_date = date.today() - timedelta(days=days_ago)
            
            # Vary usage slightly each day
            day_usage = daily_usage + (-1 if days_ago % 3 == 0 else 0 if days_ago % 2 == 0 else 1)
            
            for change_num in range(day_usage):
                usage_log = UsageLog()
                usage_log.child_id = child.id
                usage_log.usage_type = UsageType.DIAPER_CHANGE
                usage_log.quantity = 1
                
                # Spread changes throughout the day
                hours_offset = (change_num * 24) // day_usage
                minutes_offset = (change_num * 60) % 60
                
                log_datetime = datetime.combine(
                    log_date, 
                    datetime.min.time().replace(hour=hours_offset % 24, minute=minutes_offset)
                ).replace(tzinfo=timezone.utc)
                
                if hasattr(usage_log, 'logged_at'):
                    usage_log.logged_at = log_datetime
                if hasattr(usage_log, 'usage_context'):
                    usage_log.usage_context = UsageContext.HOME
                
                session.add(usage_log)
    
    async def verify_data_integrity(self, session):
        """Verify the integrity of created demo data"""
        logger.info("✅ Verifying data integrity...")
        
        # Check user count
        users_result = await session.execute(select(func.count(User.id)))
        user_count = users_result.scalar()
        
        # Check children count
        children_result = await session.execute(
            select(func.count(Child.id)).where(Child.is_deleted == False)
        )
        children_count = children_result.scalar()
        
        # Check inventory count
        inventory_result = await session.execute(select(func.count(InventoryItem.id)))
        inventory_count = inventory_result.scalar()
        
        # Check usage logs count  
        usage_result = await session.execute(select(func.count(UsageLog.id)))
        usage_count = usage_result.scalar()
        
        # Verify parent-child relationships
        orphaned_children_result = await session.execute(
            select(Child).outerjoin(User, Child.parent_id == User.id)
            .where(and_(Child.is_deleted == False, User.id.is_(None)))
        )
        orphaned_children = orphaned_children_result.scalars().all()
        
        logger.info(f"   📊 Final Data Counts:")
        logger.info(f"      👤 Users: {user_count}")
        logger.info(f"      👶 Active Children: {children_count}")
        logger.info(f"      📦 Inventory Items: {inventory_count}")
        logger.info(f"      📋 Usage Logs: {usage_count}")
        logger.info(f"      🚫 Orphaned Children: {len(orphaned_children)}")
        
        if len(orphaned_children) > 0:
            logger.warning(f"   ⚠️ Found {len(orphaned_children)} orphaned children!")
            for child in orphaned_children:
                logger.warning(f"      - Child ID: {child.id}, Parent ID: {child.parent_id}")
        
        # Verify onboarding completion
        incomplete_users_result = await session.execute(
            select(User).where(User.onboarding_completed == False)
        )
        incomplete_users = incomplete_users_result.scalars().all()
        
        if len(incomplete_users) > 0:
            logger.warning(f"   ⚠️ Found {len(incomplete_users)} users with incomplete onboarding")
            for user in incomplete_users:
                logger.warning(f"      - User: {user.email}")
        
        logger.info("   ✅ Data integrity verification completed")

async def main():
    """Main entry point for demo reset script"""
    print("=" * 60)
    print("🚀 NestSync System-Wide Demo Reset")
    print("=" * 60)
    print()
    
    # Initialize database
    create_database_engines()
    
    # Create and execute demo data generator
    generator = DemoDataGenerator()
    await generator.execute_full_reset()
    
    print()
    print("=" * 60)
    print("✅ Demo Reset Complete!")
    print("📧 Demo Login Accounts:")
    print("   • parents@nestsync.com (Sarah - New Parent)")
    print("   • mike.demo@nestsync.com (Mike - Working Dad)")  
    print("   • jessica.demo@nestsync.com (Jessica - Organized Planner)")
    print("   • carlos.demo@nestsync.com (Carlos - Tech-Savvy)")
    print("🔑 Password for all accounts: Shazam11#")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(main())