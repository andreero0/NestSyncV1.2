# Inventory Management Database Schema Design

## Executive Summary

This document provides the comprehensive database schema design for NestSync's inventory management feature, including InventoryItem, UsageLog, and StockThreshold models. The design follows PIPEDA compliance requirements, integrates with existing child profiles, and supports scalable multi-child family tracking.

## Core Models Overview

### 1. InventoryItem Model
Tracks physical diaper inventory with detailed product information and stock levels.

### 2. UsageLog Model  
Records diaper change events and usage patterns for analytics and predictions.

### 3. StockThreshold Model
Manages personalized alert levels and notification preferences.

## Complete SQLAlchemy Model Definitions

### InventoryItem Model

```python
"""
Inventory management models for diaper tracking with Canadian compliance
"""

import uuid
from datetime import datetime, timezone, date
from typing import Optional
from sqlalchemy import Column, String, Integer, ForeignKey, Text, DateTime, Numeric, Boolean, CheckConstraint, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from enum import Enum
from decimal import Decimal

from .base import BaseModel


class ProductType(str, Enum):
    """Product types for inventory tracking"""
    DIAPER = "diaper"
    WIPES = "wipes"
    DIAPER_CREAM = "diaper_cream"
    POWDER = "powder"
    DIAPER_BAGS = "diaper_bags"
    TRAINING_PANTS = "training_pants"
    SWIMWEAR = "swimwear"


class PurchaseSource(str, Enum):
    """Where the product was acquired"""
    STORE_PURCHASE = "store_purchase"
    ONLINE_PURCHASE = "online_purchase"
    GIFT = "gift"
    SAMPLE = "sample"
    SUBSCRIPTION = "subscription"


class InventoryItem(BaseModel):
    """
    Physical inventory tracking for diaper products
    """
    __tablename__ = "inventory_items"
    
    # =============================================================================
    # Relationships
    # =============================================================================
    child_id = Column(
        UUID(as_uuid=True),
        ForeignKey("children.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="Child this inventory belongs to"
    )
    
    # =============================================================================
    # Product Information
    # =============================================================================
    product_type = Column(
        String(50),
        nullable=False,
        index=True,
        comment="Type of product (diaper, wipes, etc.)"
    )
    
    brand = Column(
        String(100),
        nullable=False,
        comment="Product brand name"
    )
    
    product_name = Column(
        String(200),
        nullable=True,
        comment="Specific product name or model"
    )
    
    size = Column(
        String(20),
        nullable=False,
        index=True,
        comment="Product size (newborn, size_1, etc.)"
    )
    
    # =============================================================================
    # Quantity Tracking
    # =============================================================================
    quantity_total = Column(
        Integer,
        nullable=False,
        comment="Total items in package when purchased"
    )
    
    quantity_remaining = Column(
        Integer,
        nullable=False,
        comment="Current stock remaining"
    )
    
    quantity_reserved = Column(
        Integer,
        nullable=False,
        default=0,
        comment="Quantity reserved for specific uses"
    )
    
    # =============================================================================
    # Purchase Information
    # =============================================================================
    purchase_date = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        comment="When product was acquired"
    )
    
    purchase_source = Column(
        String(50),
        nullable=True,
        comment="Where product was acquired"
    )
    
    cost_cad = Column(
        Numeric(10, 2),
        nullable=True,
        comment="Cost in Canadian dollars"
    )
    
    cost_per_unit = Column(
        Numeric(10, 4),
        nullable=True,
        comment="Cost per individual item"
    )
    
    # =============================================================================
    # Product Details
    # =============================================================================
    expiry_date = Column(
        DateTime(timezone=True),
        nullable=True,
        comment="Product expiry date"
    )
    
    batch_number = Column(
        String(100),
        nullable=True,
        comment="Manufacturer batch number for recalls"
    )
    
    barcode = Column(
        String(100),
        nullable=True,
        comment="Product barcode for scanning"
    )
    
    # =============================================================================
    # Storage Information
    # =============================================================================
    storage_location = Column(
        String(100),
        nullable=True,
        comment="Where product is stored (nursery, closet, etc.)"
    )
    
    is_opened = Column(
        Boolean,
        nullable=False,
        default=False,
        comment="Whether package has been opened"
    )
    
    opened_date = Column(
        DateTime(timezone=True),
        nullable=True,
        comment="When package was first opened"
    )
    
    # =============================================================================
    # User Notes and Metadata
    # =============================================================================
    notes = Column(
        Text,
        nullable=True,
        comment="User notes about this inventory item"
    )
    
    # Product quality tracking
    quality_rating = Column(
        Integer,
        nullable=True,
        comment="User rating 1-5 stars"
    )
    
    would_rebuy = Column(
        Boolean,
        nullable=True,
        comment="Whether user would purchase this product again"
    )
    
    # =============================================================================
    # Alert Status
    # =============================================================================
    low_stock_notified_at = Column(
        DateTime(timezone=True),
        nullable=True,
        comment="When low stock notification was last sent"
    )
    
    expiry_notified_at = Column(
        DateTime(timezone=True),
        nullable=True,
        comment="When expiry notification was last sent"
    )
    
    # =============================================================================
    # Relationships
    # =============================================================================
    child = relationship("Child", back_populates="inventory_items")
    usage_logs = relationship("UsageLog", back_populates="inventory_item", lazy="dynamic")
    
    # =============================================================================
    # Table Constraints
    # =============================================================================
    __table_args__ = (
        CheckConstraint('quantity_remaining >= 0', name='check_quantity_remaining_positive'),
        CheckConstraint('quantity_remaining <= quantity_total', name='check_quantity_remaining_lte_total'),
        CheckConstraint('quantity_reserved >= 0', name='check_quantity_reserved_positive'),
        CheckConstraint('quantity_reserved <= quantity_remaining', name='check_quantity_reserved_lte_remaining'),
        CheckConstraint('cost_cad >= 0', name='check_cost_positive'),
        CheckConstraint('quality_rating >= 1 AND quality_rating <= 5', name='check_quality_rating_range'),
        CheckConstraint('expiry_date IS NULL OR expiry_date > purchase_date', name='check_expiry_after_purchase'),
        Index('idx_inventory_child_product', 'child_id', 'product_type'),
        Index('idx_inventory_child_size', 'child_id', 'size'),
        Index('idx_inventory_low_stock', 'child_id', 'quantity_remaining'),
        Index('idx_inventory_expiry', 'expiry_date'),
        Index('idx_inventory_brand_size', 'brand', 'size'),
    )
    
    def __repr__(self):
        return f"<InventoryItem(id={self.id}, child={self.child_id}, product={self.brand} {self.size}, remaining={self.quantity_remaining})>"
    
    @property
    def quantity_available(self) -> int:
        """Available quantity (remaining minus reserved)"""
        return max(0, self.quantity_remaining - self.quantity_reserved)
    
    @property
    def usage_percentage(self) -> float:
        """Percentage of product used"""
        if self.quantity_total == 0:
            return 0.0
        used = self.quantity_total - self.quantity_remaining
        return round((used / self.quantity_total) * 100, 2)
    
    @property
    def is_expired(self) -> bool:
        """Check if product is expired"""
        if not self.expiry_date:
            return False
        return datetime.now(timezone.utc) > self.expiry_date
    
    @property
    def days_until_expiry(self) -> Optional[int]:
        """Days until expiry (negative if expired)"""
        if not self.expiry_date:
            return None
        delta = self.expiry_date - datetime.now(timezone.utc)
        return delta.days
    
    @property
    def cost_per_unit_calculated(self) -> Optional[Decimal]:
        """Calculate cost per unit if not stored"""
        if self.cost_per_unit:
            return self.cost_per_unit
        if self.cost_cad and self.quantity_total > 0:
            return round(self.cost_cad / self.quantity_total, 4)
        return None
    
    def use_quantity(self, quantity: int, usage_date: datetime = None) -> bool:
        """
        Use specified quantity from inventory
        Returns True if successful, False if insufficient stock
        """
        if quantity <= 0:
            return False
        
        if self.quantity_available < quantity:
            return False
        
        self.quantity_remaining -= quantity
        
        # Mark as opened if first use
        if not self.is_opened and quantity > 0:
            self.is_opened = True
            self.opened_date = usage_date or datetime.now(timezone.utc)
        
        return True
    
    def reserve_quantity(self, quantity: int) -> bool:
        """
        Reserve quantity for specific use
        Returns True if successful, False if insufficient available stock
        """
        if quantity <= 0:
            return False
        
        if self.quantity_available < quantity:
            return False
        
        self.quantity_reserved += quantity
        return True
    
    def unreserve_quantity(self, quantity: int) -> bool:
        """
        Release reserved quantity back to available stock
        """
        if quantity <= 0:
            return False
        
        release_quantity = min(quantity, self.quantity_reserved)
        self.quantity_reserved -= release_quantity
        return release_quantity > 0
    
    def add_stock(self, quantity: int) -> bool:
        """
        Add stock (for returns, exchanges, etc.)
        """
        if quantity <= 0:
            return False
        
        self.quantity_remaining += quantity
        self.quantity_total += quantity
        return True
    
    def calculate_days_remaining(self, daily_usage: float) -> Optional[float]:
        """
        Calculate days of stock remaining based on usage rate
        """
        if daily_usage <= 0 or self.quantity_available <= 0:
            return None
        
        return round(self.quantity_available / daily_usage, 1)
    
    def needs_restocking(self, threshold: int) -> bool:
        """
        Check if inventory needs restocking based on threshold
        """
        return self.quantity_available <= threshold
    
    def update_quality_rating(self, rating: int, would_rebuy: bool = None):
        """
        Update product quality rating
        """
        if 1 <= rating <= 5:
            self.quality_rating = rating
        
        if would_rebuy is not None:
            self.would_rebuy = would_rebuy
```

### UsageLog Model

```python
class UsageType(str, Enum):
    """Types of usage events"""
    DIAPER_CHANGE = "diaper_change"
    WIPE_USE = "wipe_use"
    CREAM_APPLICATION = "cream_application"
    ACCIDENT_CLEANUP = "accident_cleanup"
    PREVENTIVE_CHANGE = "preventive_change"
    OVERNIGHT_CHANGE = "overnight_change"


class UsageContext(str, Enum):
    """Context where usage occurred"""
    HOME = "home"
    DAYCARE = "daycare"
    OUTING = "outing"
    TRAVEL = "travel"
    GRANDPARENTS = "grandparents"
    OTHER = "other"


class UsageLog(BaseModel):
    """
    Usage tracking for diaper changes and product consumption
    """
    __tablename__ = "usage_logs"
    
    # =============================================================================
    # Relationships
    # =============================================================================
    child_id = Column(
        UUID(as_uuid=True),
        ForeignKey("children.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="Child this usage log belongs to"
    )
    
    inventory_item_id = Column(
        UUID(as_uuid=True),
        ForeignKey("inventory_items.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        comment="Specific inventory item used (optional)"
    )
    
    # =============================================================================
    # Usage Information
    # =============================================================================
    usage_type = Column(
        String(50),
        nullable=False,
        index=True,
        comment="Type of usage event"
    )
    
    logged_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        index=True,
        comment="When the usage occurred"
    )
    
    quantity_used = Column(
        Integer,
        nullable=False,
        default=1,
        comment="Number of items used"
    )
    
    # =============================================================================
    # Context Information
    # =============================================================================
    context = Column(
        String(50),
        nullable=True,
        comment="Where/when usage occurred"
    )
    
    caregiver_name = Column(
        String(100),
        nullable=True,
        comment="Who performed the change"
    )
    
    # =============================================================================
    # Diaper-Specific Information
    # =============================================================================
    was_wet = Column(
        Boolean,
        nullable=True,
        comment="Diaper was wet (for diaper changes)"
    )
    
    was_soiled = Column(
        Boolean,
        nullable=True,
        comment="Diaper was soiled (for diaper changes)"
    )
    
    diaper_condition = Column(
        String(50),
        nullable=True,
        comment="Condition of diaper (light, moderate, heavy)"
    )
    
    # =============================================================================
    # Product Performance
    # =============================================================================
    had_leakage = Column(
        Boolean,
        nullable=True,
        comment="Whether there was leakage"
    )
    
    product_rating = Column(
        Integer,
        nullable=True,
        comment="Rating of product performance for this use (1-5)"
    )
    
    # =============================================================================
    # Time and Duration Tracking
    # =============================================================================
    time_since_last_change = Column(
        Integer,
        nullable=True,
        comment="Minutes since last diaper change"
    )
    
    change_duration = Column(
        Integer,
        nullable=True,
        comment="How long the change took in seconds"
    )
    
    # =============================================================================
    # Notes and Observations
    # =============================================================================
    notes = Column(
        Text,
        nullable=True,
        comment="Additional notes about this usage"
    )
    
    # Health observations
    health_notes = Column(
        Text,
        nullable=True,
        comment="Health-related observations (rash, etc.)"
    )
    
    # =============================================================================
    # Analytics Metadata
    # =============================================================================
    predicted_next_change = Column(
        DateTime(timezone=True),
        nullable=True,
        comment="ML-predicted time for next change"
    )
    
    pattern_deviation = Column(
        Boolean,
        nullable=True,
        comment="Whether this usage deviates from normal pattern"
    )
    
    # =============================================================================
    # Relationships
    # =============================================================================
    child = relationship("Child", back_populates="usage_logs")
    inventory_item = relationship("InventoryItem", back_populates="usage_logs")
    
    # =============================================================================
    # Table Constraints
    # =============================================================================
    __table_args__ = (
        CheckConstraint('quantity_used > 0', name='check_quantity_used_positive'),
        CheckConstraint('product_rating >= 1 AND product_rating <= 5', name='check_product_rating_range'),
        CheckConstraint('time_since_last_change >= 0', name='check_time_since_last_change_positive'),
        CheckConstraint('change_duration >= 0', name='check_change_duration_positive'),
        Index('idx_usage_child_date', 'child_id', 'logged_at'),
        Index('idx_usage_type_date', 'usage_type', 'logged_at'),
        Index('idx_usage_inventory', 'inventory_item_id', 'logged_at'),
        Index('idx_usage_daily_stats', 'child_id', 'usage_type', 'logged_at'),
        Index('idx_usage_pattern_analysis', 'child_id', 'logged_at', 'usage_type', 'quantity_used'),
    )
    
    def __repr__(self):
        return f"<UsageLog(id={self.id}, child={self.child_id}, type={self.usage_type}, quantity={self.quantity_used}, at={self.logged_at})>"
    
    @property
    def hour_of_day(self) -> int:
        """Hour of day when usage occurred"""
        return self.logged_at.hour
    
    @property
    def day_of_week(self) -> int:
        """Day of week when usage occurred (0=Monday)"""
        return self.logged_at.weekday()
    
    @property
    def was_overnight(self) -> bool:
        """Check if usage was overnight (between 10pm and 6am)"""
        hour = self.hour_of_day
        return hour >= 22 or hour < 6
    
    def calculate_time_since_last(self, last_usage_time: datetime) -> int:
        """
        Calculate minutes since last usage
        """
        if not last_usage_time:
            return None
        
        delta = self.logged_at - last_usage_time
        return int(delta.total_seconds() / 60)
    
    def is_pattern_deviation(self, expected_time: datetime, tolerance_minutes: int = 60) -> bool:
        """
        Check if this usage deviates from expected pattern
        """
        if not expected_time:
            return False
        
        delta = abs((self.logged_at - expected_time).total_seconds() / 60)
        return delta > tolerance_minutes
    
    def get_usage_efficiency(self) -> Optional[float]:
        """
        Calculate usage efficiency (time worn vs typical)
        """
        if not self.time_since_last_change:
            return None
        
        # Typical change intervals by time of day
        hour = self.hour_of_day
        if 6 <= hour < 22:  # Daytime
            typical_interval = 180  # 3 hours
        else:  # Nighttime
            typical_interval = 480  # 8 hours
        
        return min(self.time_since_last_change / typical_interval, 2.0)
    
    @classmethod
    def get_daily_stats(cls, session, child_id: uuid.UUID, target_date: date):
        """
        Get daily usage statistics for a child
        """
        start_date = datetime.combine(target_date, datetime.min.time()).replace(tzinfo=timezone.utc)
        end_date = start_date + timedelta(days=1)
        
        return session.query(
            cls.usage_type,
            func.count(cls.id).label('usage_count'),
            func.sum(cls.quantity_used).label('total_quantity')
        ).filter(
            cls.child_id == child_id,
            cls.logged_at >= start_date,
            cls.logged_at < end_date,
            cls.is_deleted == False
        ).group_by(cls.usage_type).all()
```

### StockThreshold Model

```python
class NotificationFrequency(str, Enum):
    """Notification frequency options"""
    IMMEDIATE = "immediate"
    DAILY = "daily"
    TWICE_DAILY = "twice_daily"
    WEEKLY = "weekly"
    DISABLED = "disabled"


class ThresholdType(str, Enum):
    """Types of thresholds"""
    LOW_STOCK = "low_stock"
    CRITICAL_STOCK = "critical_stock"
    DAYS_REMAINING = "days_remaining"
    EXPIRY_WARNING = "expiry_warning"


class StockThreshold(BaseModel):
    """
    Personalized stock thresholds and notification preferences
    """
    __tablename__ = "stock_thresholds"
    
    # =============================================================================
    # Relationships
    # =============================================================================
    child_id = Column(
        UUID(as_uuid=True),
        ForeignKey("children.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="Child these thresholds apply to"
    )
    
    # =============================================================================
    # Product Specification
    # =============================================================================
    product_type = Column(
        String(50),
        nullable=False,
        comment="Product type this threshold applies to"
    )
    
    size = Column(
        String(20),
        nullable=False,
        comment="Product size this threshold applies to"
    )
    
    brand = Column(
        String(100),
        nullable=True,
        comment="Specific brand (optional, null for all brands)"
    )
    
    # =============================================================================
    # Threshold Values
    # =============================================================================
    threshold_type = Column(
        String(50),
        nullable=False,
        comment="Type of threshold"
    )
    
    # Quantity-based thresholds
    low_threshold = Column(
        Integer,
        nullable=True,
        comment="Quantity threshold for low stock warning"
    )
    
    critical_threshold = Column(
        Integer,
        nullable=True,
        comment="Quantity threshold for critical stock alert"
    )
    
    # Time-based thresholds
    days_warning = Column(
        Integer,
        nullable=True,
        comment="Days of supply remaining threshold"
    )
    
    expiry_warning_days = Column(
        Integer,
        nullable=True,
        comment="Days before expiry to warn"
    )
    
    # =============================================================================
    # Notification Settings
    # =============================================================================
    notification_enabled = Column(
        Boolean,
        nullable=False,
        default=True,
        comment="Whether notifications are enabled"
    )
    
    notification_frequency = Column(
        String(50),
        nullable=False,
        default="immediate",
        comment="How often to send notifications"
    )
    
    notification_methods = Column(
        JSON,
        nullable=True,
        comment="Notification methods (push, email, etc.)"
    )
    
    # =============================================================================
    # Auto-Reorder Settings
    # =============================================================================
    auto_reorder_enabled = Column(
        Boolean,
        nullable=False,
        default=False,
        comment="Enable automatic reorder suggestions"
    )
    
    preferred_vendors = Column(
        JSON,
        nullable=True,
        comment="List of preferred vendors for auto-reorder"
    )
    
    reorder_quantity = Column(
        Integer,
        nullable=True,
        comment="Suggested quantity for reorders"
    )
    
    max_stock_level = Column(
        Integer,
        nullable=True,
        comment="Maximum stock level to maintain"
    )
    
    # =============================================================================
    # Notification History
    # =============================================================================
    last_low_notification = Column(
        DateTime(timezone=True),
        nullable=True,
        comment="When low stock notification was last sent"
    )
    
    last_critical_notification = Column(
        DateTime(timezone=True),
        nullable=True,
        comment="When critical stock notification was last sent"
    )
    
    last_expiry_notification = Column(
        DateTime(timezone=True),
        nullable=True,
        comment="When expiry notification was last sent"
    )
    
    notification_count = Column(
        Integer,
        nullable=False,
        default=0,
        comment="Total notifications sent for this threshold"
    )
    
    # =============================================================================
    # Customization
    # =============================================================================
    custom_message = Column(
        Text,
        nullable=True,
        comment="Custom notification message"
    )
    
    priority_level = Column(
        Integer,
        nullable=False,
        default=1,
        comment="Priority level (1=low, 2=medium, 3=high)"
    )
    
    # =============================================================================
    # Seasonal Adjustments
    # =============================================================================
    seasonal_adjustments = Column(
        JSON,
        nullable=True,
        comment="Seasonal threshold adjustments"
    )
    
    # =============================================================================
    # Relationships
    # =============================================================================
    child = relationship("Child", back_populates="stock_thresholds")
    
    # =============================================================================
    # Table Constraints
    # =============================================================================
    __table_args__ = (
        CheckConstraint('low_threshold >= 0', name='check_low_threshold_positive'),
        CheckConstraint('critical_threshold >= 0', name='check_critical_threshold_positive'),
        CheckConstraint('critical_threshold <= low_threshold', name='check_critical_lte_low'),
        CheckConstraint('days_warning >= 0', name='check_days_warning_positive'),
        CheckConstraint('expiry_warning_days >= 0', name='check_expiry_warning_positive'),
        CheckConstraint('priority_level >= 1 AND priority_level <= 3', name='check_priority_level_range'),
        CheckConstraint('reorder_quantity >= 0', name='check_reorder_quantity_positive'),
        CheckConstraint('max_stock_level >= reorder_quantity', name='check_max_stock_gte_reorder'),
        Index('idx_threshold_child_product', 'child_id', 'product_type', 'size'),
        Index('idx_threshold_notifications', 'notification_enabled', 'last_low_notification'),
        Index('idx_threshold_priority', 'priority_level', 'notification_enabled'),
        # Unique constraint for one threshold per child/product/size/type combination
        Index('idx_threshold_unique', 'child_id', 'product_type', 'size', 'threshold_type', unique=True),
    )
    
    def __repr__(self):
        return f"<StockThreshold(id={self.id}, child={self.child_id}, product={self.product_type}, size={self.size}, low={self.low_threshold})>"
    
    @property
    def is_low_stock_due(self) -> bool:
        """Check if low stock notification is due"""
        if not self.notification_enabled or not self.last_low_notification:
            return True
        
        # Check frequency
        if self.notification_frequency == "immediate":
            return True
        elif self.notification_frequency == "daily":
            return (datetime.now(timezone.utc) - self.last_low_notification).days >= 1
        elif self.notification_frequency == "twice_daily":
            return (datetime.now(timezone.utc) - self.last_low_notification).total_seconds() >= 43200  # 12 hours
        elif self.notification_frequency == "weekly":
            return (datetime.now(timezone.utc) - self.last_low_notification).days >= 7
        
        return False
    
    def should_notify(self, current_quantity: int, days_remaining: Optional[float] = None) -> dict:
        """
        Check if notification should be sent based on current stock
        """
        notifications = {
            'low_stock': False,
            'critical_stock': False,
            'days_warning': False,
            'reasons': []
        }
        
        if not self.notification_enabled:
            return notifications
        
        # Check quantity thresholds
        if self.critical_threshold and current_quantity <= self.critical_threshold:
            notifications['critical_stock'] = True
            notifications['reasons'].append(f'Critical stock: {current_quantity} remaining')
        elif self.low_threshold and current_quantity <= self.low_threshold:
            notifications['low_stock'] = self.is_low_stock_due
            if notifications['low_stock']:
                notifications['reasons'].append(f'Low stock: {current_quantity} remaining')
        
        # Check days remaining threshold
        if self.days_warning and days_remaining is not None and days_remaining <= self.days_warning:
            notifications['days_warning'] = True
            notifications['reasons'].append(f'Only {days_remaining:.1f} days remaining')
        
        return notifications
    
    def record_notification_sent(self, notification_type: str):
        """
        Record that a notification was sent
        """
        now = datetime.now(timezone.utc)
        
        if notification_type == 'low_stock':
            self.last_low_notification = now
        elif notification_type == 'critical_stock':
            self.last_critical_notification = now
        elif notification_type == 'expiry':
            self.last_expiry_notification = now
        
        self.notification_count += 1
    
    def get_reorder_suggestion(self, current_quantity: int, daily_usage: float) -> Optional[dict]:
        """
        Get reorder suggestion based on current stock and usage
        """
        if not self.auto_reorder_enabled or daily_usage <= 0:
            return None
        
        if current_quantity > self.low_threshold:
            return None  # Stock is still good
        
        # Calculate suggested order quantity
        if self.reorder_quantity:
            suggested_quantity = self.reorder_quantity
        else:
            # Default to 30 days supply
            suggested_quantity = max(int(daily_usage * 30), 1)
        
        # Don't exceed max stock level
        if self.max_stock_level:
            suggested_quantity = min(suggested_quantity, self.max_stock_level - current_quantity)
        
        return {
            'product_type': self.product_type,
            'size': self.size,
            'brand': self.brand,
            'suggested_quantity': suggested_quantity,
            'current_quantity': current_quantity,
            'daily_usage': daily_usage,
            'preferred_vendors': self.preferred_vendors,
            'priority_level': self.priority_level
        }
    
    def apply_seasonal_adjustment(self, base_threshold: int, season: str) -> int:
        """
        Apply seasonal adjustment to threshold
        """
        if not self.seasonal_adjustments or season not in self.seasonal_adjustments:
            return base_threshold
        
        adjustment = self.seasonal_adjustments[season]
        if isinstance(adjustment, dict):
            multiplier = adjustment.get('multiplier', 1.0)
            offset = adjustment.get('offset', 0)
            return int(base_threshold * multiplier + offset)
        
        return base_threshold
    
    @classmethod
    def get_default_thresholds(cls, product_type: str, size: str) -> dict:
        """
        Get default threshold values for a product type and size
        """
        defaults = {
            'diaper': {
                'low_threshold': 20,
                'critical_threshold': 5,
                'days_warning': 3,
                'expiry_warning_days': 30
            },
            'wipes': {
                'low_threshold': 2,  # 2 packs
                'critical_threshold': 1,
                'days_warning': 7,
                'expiry_warning_days': 60
            },
            'diaper_cream': {
                'low_threshold': 1,
                'critical_threshold': 1,
                'days_warning': 14,
                'expiry_warning_days': 90
            }
        }
        
        return defaults.get(product_type, defaults['diaper'])
```

## Database Relationships

```python
# Add to existing Child model
class Child(BaseModel):
    # ... existing fields ...
    
    # New relationships for inventory management
    inventory_items = relationship("InventoryItem", back_populates="child", lazy="dynamic", cascade="all, delete-orphan")
    usage_logs = relationship("UsageLog", back_populates="child", lazy="dynamic", cascade="all, delete-orphan")
    stock_thresholds = relationship("StockThreshold", back_populates="child", lazy="dynamic", cascade="all, delete-orphan")
    
    def get_current_inventory_summary(self) -> dict:
        """Get summary of current inventory for dashboard"""
        from sqlalchemy import func
        
        # This would be implemented in a service layer
        return {
            'total_diapers': 0,  # Sum of diaper inventory
            'days_remaining': 0,  # Based on usage patterns
            'low_stock_alerts': 0,  # Count of items below threshold
            'expiring_soon': 0   # Count of items expiring within warning period
        }
```

## RLS Policies for PIPEDA Compliance

### Policy Implementation SQL

```sql
-- RLS Policy for inventory_items
CREATE POLICY inventory_items_user_isolation ON inventory_items
    FOR ALL
    USING (child_id IN (
        SELECT id FROM children WHERE parent_id = auth.uid()
    ));

-- RLS Policy for usage_logs
CREATE POLICY usage_logs_user_isolation ON usage_logs
    FOR ALL
    USING (child_id IN (
        SELECT id FROM children WHERE parent_id = auth.uid()
    ));

-- RLS Policy for stock_thresholds
CREATE POLICY stock_thresholds_user_isolation ON stock_thresholds
    FOR ALL
    USING (child_id IN (
        SELECT id FROM children WHERE parent_id = auth.uid()
    ));

-- Enable RLS on all tables
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_thresholds ENABLE ROW LEVEL SECURITY;
```

## Performance Optimization Indexes

### Recommended Indexes

```sql
-- Dashboard query optimization
CREATE INDEX CONCURRENTLY idx_inventory_dashboard 
ON inventory_items (child_id, product_type, quantity_remaining) 
WHERE is_deleted = false;

-- Usage analytics optimization
CREATE INDEX CONCURRENTLY idx_usage_analytics 
ON usage_logs (child_id, usage_type, logged_at DESC) 
WHERE is_deleted = false;

-- Notification queries optimization  
CREATE INDEX CONCURRENTLY idx_notifications_due
ON stock_thresholds (notification_enabled, last_low_notification)
WHERE notification_enabled = true;

-- Expiry tracking optimization
CREATE INDEX CONCURRENTLY idx_expiry_tracking
ON inventory_items (expiry_date)
WHERE expiry_date IS NOT NULL AND is_deleted = false;

-- Multi-child family queries
CREATE INDEX CONCURRENTLY idx_family_inventory
ON inventory_items (child_id, product_type, size, quantity_remaining);

-- Usage pattern analysis (partitioned by date for large datasets)
CREATE INDEX CONCURRENTLY idx_usage_patterns
ON usage_logs (child_id, date_trunc('day', logged_at), usage_type);
```

## Data Validation Rules

### Application-Level Validations

```python
class InventoryValidationMixin:
    """Validation rules for inventory management"""
    
    @staticmethod
    def validate_inventory_item(data: dict) -> List[str]:
        """Validate inventory item data"""
        errors = []
        
        # Required fields
        required_fields = ['child_id', 'product_type', 'brand', 'size', 'quantity_total']
        for field in required_fields:
            if not data.get(field):
                errors.append(f"{field} is required")
        
        # Quantity validations
        if data.get('quantity_total', 0) <= 0:
            errors.append("quantity_total must be positive")
        
        if data.get('quantity_remaining', 0) < 0:
            errors.append("quantity_remaining cannot be negative")
        
        if data.get('quantity_remaining', 0) > data.get('quantity_total', 0):
            errors.append("quantity_remaining cannot exceed quantity_total")
        
        # Cost validations
        if data.get('cost_cad') is not None and data.get('cost_cad') < 0:
            errors.append("cost_cad cannot be negative")
        
        # Date validations
        if data.get('expiry_date') and data.get('purchase_date'):
            if data['expiry_date'] <= data['purchase_date']:
                errors.append("expiry_date must be after purchase_date")
        
        return errors
    
    @staticmethod
    def validate_usage_log(data: dict) -> List[str]:
        """Validate usage log data"""
        errors = []
        
        # Required fields
        required_fields = ['child_id', 'usage_type', 'quantity_used']
        for field in required_fields:
            if not data.get(field):
                errors.append(f"{field} is required")
        
        # Quantity validation
        if data.get('quantity_used', 0) <= 0:
            errors.append("quantity_used must be positive")
        
        # Rating validation
        rating = data.get('product_rating')
        if rating is not None and not (1 <= rating <= 5):
            errors.append("product_rating must be between 1 and 5")
        
        # Time validations
        if data.get('time_since_last_change') is not None and data.get('time_since_last_change') < 0:
            errors.append("time_since_last_change cannot be negative")
        
        return errors
    
    @staticmethod
    def validate_stock_threshold(data: dict) -> List[str]:
        """Validate stock threshold data"""
        errors = []
        
        # Required fields
        required_fields = ['child_id', 'product_type', 'size', 'threshold_type']
        for field in required_fields:
            if not data.get(field):
                errors.append(f"{field} is required")
        
        # Threshold validations
        low = data.get('low_threshold')
        critical = data.get('critical_threshold')
        
        if low is not None and low < 0:
            errors.append("low_threshold cannot be negative")
        
        if critical is not None and critical < 0:
            errors.append("critical_threshold cannot be negative")
        
        if low is not None and critical is not None and critical > low:
            errors.append("critical_threshold must be less than or equal to low_threshold")
        
        # Priority validation
        priority = data.get('priority_level')
        if priority is not None and not (1 <= priority <= 3):
            errors.append("priority_level must be between 1 and 3")
        
        return errors
```

## Dashboard Calculation Queries

### Efficient Query Patterns for Dashboard

```python
class DashboardQueries:
    """Optimized queries for dashboard calculations"""
    
    @staticmethod
    async def get_inventory_summary(session, child_id: uuid.UUID) -> dict:
        """Get inventory summary for dashboard"""
        
        # Total stock by product type
        stock_query = select(
            InventoryItem.product_type,
            InventoryItem.size,
            func.sum(InventoryItem.quantity_remaining).label('total_quantity'),
            func.count(InventoryItem.id).label('item_count')
        ).where(
            InventoryItem.child_id == child_id,
            InventoryItem.is_deleted == False,
            InventoryItem.quantity_remaining > 0
        ).group_by(InventoryItem.product_type, InventoryItem.size)
        
        result = await session.execute(stock_query)
        inventory = result.all()
        
        # Daily usage calculation (last 7 days)
        seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
        usage_query = select(
            UsageLog.usage_type,
            func.avg(func.count(UsageLog.id)).over(
                partition_by=func.date_trunc('day', UsageLog.logged_at)
            ).label('avg_daily_usage')
        ).where(
            UsageLog.child_id == child_id,
            UsageLog.logged_at >= seven_days_ago,
            UsageLog.is_deleted == False
        ).group_by(
            UsageLog.usage_type,
            func.date_trunc('day', UsageLog.logged_at)
        )
        
        usage_result = await session.execute(usage_query)
        usage_patterns = usage_result.all()
        
        return {
            'inventory': [
                {
                    'product_type': item.product_type,
                    'size': item.size,
                    'quantity': item.total_quantity,
                    'item_count': item.item_count
                }
                for item in inventory
            ],
            'usage_patterns': [
                {
                    'usage_type': pattern.usage_type,
                    'avg_daily': float(pattern.avg_daily_usage)
                }
                for pattern in usage_patterns
            ]
        }
    
    @staticmethod
    async def get_low_stock_alerts(session, child_id: uuid.UUID) -> List[dict]:
        """Get low stock alerts for dashboard"""
        
        # Join inventory with thresholds to find low stock items
        query = select(
            InventoryItem.id,
            InventoryItem.product_type,
            InventoryItem.size,
            InventoryItem.brand,
            InventoryItem.quantity_remaining,
            StockThreshold.low_threshold,
            StockThreshold.critical_threshold
        ).join(
            StockThreshold,
            and_(
                StockThreshold.child_id == InventoryItem.child_id,
                StockThreshold.product_type == InventoryItem.product_type,
                StockThreshold.size == InventoryItem.size
            )
        ).where(
            InventoryItem.child_id == child_id,
            InventoryItem.is_deleted == False,
            StockThreshold.notification_enabled == True,
            or_(
                InventoryItem.quantity_remaining <= StockThreshold.critical_threshold,
                InventoryItem.quantity_remaining <= StockThreshold.low_threshold
            )
        ).order_by(
            case(
                (InventoryItem.quantity_remaining <= StockThreshold.critical_threshold, 1),
                else_=2
            ),
            InventoryItem.quantity_remaining
        )
        
        result = await session.execute(query)
        alerts = result.all()
        
        return [
            {
                'inventory_item_id': alert.id,
                'product_type': alert.product_type,
                'size': alert.size,
                'brand': alert.brand,
                'quantity_remaining': alert.quantity_remaining,
                'alert_level': 'critical' if alert.quantity_remaining <= alert.critical_threshold else 'low',
                'threshold': alert.critical_threshold if alert.quantity_remaining <= alert.critical_threshold else alert.low_threshold
            }
            for alert in alerts
        ]
    
    @staticmethod
    async def calculate_days_remaining(session, child_id: uuid.UUID, product_type: str, size: str) -> Optional[float]:
        """Calculate days remaining for specific product"""
        
        # Get current inventory
        inventory_query = select(
            func.sum(InventoryItem.quantity_remaining).label('total_quantity')
        ).where(
            InventoryItem.child_id == child_id,
            InventoryItem.product_type == product_type,
            InventoryItem.size == size,
            InventoryItem.is_deleted == False
        )
        
        inventory_result = await session.execute(inventory_query)
        inventory_row = inventory_result.first()
        
        if not inventory_row or not inventory_row.total_quantity:
            return 0
        
        # Get average daily usage (last 14 days)
        fourteen_days_ago = datetime.now(timezone.utc) - timedelta(days=14)
        usage_query = select(
            func.avg(
                func.sum(UsageLog.quantity_used).over(
                    partition_by=func.date_trunc('day', UsageLog.logged_at)
                )
            ).label('avg_daily_usage')
        ).where(
            UsageLog.child_id == child_id,
            UsageLog.usage_type == product_type.replace('_', '_use') if product_type != 'diaper' else 'diaper_change',
            UsageLog.logged_at >= fourteen_days_ago,
            UsageLog.is_deleted == False
        )
        
        usage_result = await session.execute(usage_query)
        usage_row = usage_result.first()
        
        if not usage_row or not usage_row.avg_daily_usage or usage_row.avg_daily_usage <= 0:
            return None
        
        return round(inventory_row.total_quantity / float(usage_row.avg_daily_usage), 1)
```

## Migration Strategy

### Alembic Migration Files

```python
"""Add inventory management tables

Revision ID: 20240907_1200_inventory_management
Revises: previous_revision
Create Date: 2024-09-07 12:00:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = '20240907_1200_inventory_management'
down_revision = 'previous_revision'
branch_labels = None
depends_on = None

def upgrade():
    # Create inventory_items table
    op.create_table('inventory_items',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('child_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('product_type', sa.String(50), nullable=False),
        sa.Column('brand', sa.String(100), nullable=False),
        sa.Column('product_name', sa.String(200), nullable=True),
        sa.Column('size', sa.String(20), nullable=False),
        sa.Column('quantity_total', sa.Integer, nullable=False),
        sa.Column('quantity_remaining', sa.Integer, nullable=False),
        sa.Column('quantity_reserved', sa.Integer, nullable=False, default=0),
        sa.Column('purchase_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('purchase_source', sa.String(50), nullable=True),
        sa.Column('cost_cad', sa.Numeric(10, 2), nullable=True),
        sa.Column('cost_per_unit', sa.Numeric(10, 4), nullable=True),
        sa.Column('expiry_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('batch_number', sa.String(100), nullable=True),
        sa.Column('barcode', sa.String(100), nullable=True),
        sa.Column('storage_location', sa.String(100), nullable=True),
        sa.Column('is_opened', sa.Boolean, nullable=False, default=False),
        sa.Column('opened_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('notes', sa.Text, nullable=True),
        sa.Column('quality_rating', sa.Integer, nullable=True),
        sa.Column('would_rebuy', sa.Boolean, nullable=True),
        sa.Column('low_stock_notified_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('expiry_notified_at', sa.DateTime(timezone=True), nullable=True),
        
        # Base model fields
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('is_deleted', sa.Boolean, nullable=False, default=False),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('updated_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('deleted_by', postgresql.UUID(as_uuid=True), nullable=True),
        
        # Foreign keys
        sa.ForeignKeyConstraint(['child_id'], ['children.id'], ondelete='CASCADE'),
        
        # Check constraints
        sa.CheckConstraint('quantity_remaining >= 0', name='check_quantity_remaining_positive'),
        sa.CheckConstraint('quantity_remaining <= quantity_total', name='check_quantity_remaining_lte_total'),
        sa.CheckConstraint('quantity_reserved >= 0', name='check_quantity_reserved_positive'),
        sa.CheckConstraint('quantity_reserved <= quantity_remaining', name='check_quantity_reserved_lte_remaining'),
        sa.CheckConstraint('cost_cad >= 0', name='check_cost_positive'),
        sa.CheckConstraint('quality_rating >= 1 AND quality_rating <= 5', name='check_quality_rating_range'),
        sa.CheckConstraint('expiry_date IS NULL OR expiry_date > purchase_date', name='check_expiry_after_purchase'),
    )
    
    # Create usage_logs table
    op.create_table('usage_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('child_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('inventory_item_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('usage_type', sa.String(50), nullable=False),
        sa.Column('logged_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('quantity_used', sa.Integer, nullable=False, default=1),
        sa.Column('context', sa.String(50), nullable=True),
        sa.Column('caregiver_name', sa.String(100), nullable=True),
        sa.Column('was_wet', sa.Boolean, nullable=True),
        sa.Column('was_soiled', sa.Boolean, nullable=True),
        sa.Column('diaper_condition', sa.String(50), nullable=True),
        sa.Column('had_leakage', sa.Boolean, nullable=True),
        sa.Column('product_rating', sa.Integer, nullable=True),
        sa.Column('time_since_last_change', sa.Integer, nullable=True),
        sa.Column('change_duration', sa.Integer, nullable=True),
        sa.Column('notes', sa.Text, nullable=True),
        sa.Column('health_notes', sa.Text, nullable=True),
        sa.Column('predicted_next_change', sa.DateTime(timezone=True), nullable=True),
        sa.Column('pattern_deviation', sa.Boolean, nullable=True),
        
        # Base model fields
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('is_deleted', sa.Boolean, nullable=False, default=False),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('updated_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('deleted_by', postgresql.UUID(as_uuid=True), nullable=True),
        
        # Foreign keys
        sa.ForeignKeyConstraint(['child_id'], ['children.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['inventory_item_id'], ['inventory_items.id'], ondelete='SET NULL'),
        
        # Check constraints
        sa.CheckConstraint('quantity_used > 0', name='check_quantity_used_positive'),
        sa.CheckConstraint('product_rating >= 1 AND product_rating <= 5', name='check_product_rating_range'),
        sa.CheckConstraint('time_since_last_change >= 0', name='check_time_since_last_change_positive'),
        sa.CheckConstraint('change_duration >= 0', name='check_change_duration_positive'),
    )
    
    # Create stock_thresholds table
    op.create_table('stock_thresholds',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('child_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('product_type', sa.String(50), nullable=False),
        sa.Column('size', sa.String(20), nullable=False),
        sa.Column('brand', sa.String(100), nullable=True),
        sa.Column('threshold_type', sa.String(50), nullable=False),
        sa.Column('low_threshold', sa.Integer, nullable=True),
        sa.Column('critical_threshold', sa.Integer, nullable=True),
        sa.Column('days_warning', sa.Integer, nullable=True),
        sa.Column('expiry_warning_days', sa.Integer, nullable=True),
        sa.Column('notification_enabled', sa.Boolean, nullable=False, default=True),
        sa.Column('notification_frequency', sa.String(50), nullable=False, default='immediate'),
        sa.Column('notification_methods', postgresql.JSON, nullable=True),
        sa.Column('auto_reorder_enabled', sa.Boolean, nullable=False, default=False),
        sa.Column('preferred_vendors', postgresql.JSON, nullable=True),
        sa.Column('reorder_quantity', sa.Integer, nullable=True),
        sa.Column('max_stock_level', sa.Integer, nullable=True),
        sa.Column('last_low_notification', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_critical_notification', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_expiry_notification', sa.DateTime(timezone=True), nullable=True),
        sa.Column('notification_count', sa.Integer, nullable=False, default=0),
        sa.Column('custom_message', sa.Text, nullable=True),
        sa.Column('priority_level', sa.Integer, nullable=False, default=1),
        sa.Column('seasonal_adjustments', postgresql.JSON, nullable=True),
        
        # Base model fields
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('is_deleted', sa.Boolean, nullable=False, default=False),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('updated_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('deleted_by', postgresql.UUID(as_uuid=True), nullable=True),
        
        # Foreign keys
        sa.ForeignKeyConstraint(['child_id'], ['children.id'], ondelete='CASCADE'),
        
        # Check constraints
        sa.CheckConstraint('low_threshold >= 0', name='check_low_threshold_positive'),
        sa.CheckConstraint('critical_threshold >= 0', name='check_critical_threshold_positive'),
        sa.CheckConstraint('critical_threshold <= low_threshold', name='check_critical_lte_low'),
        sa.CheckConstraint('days_warning >= 0', name='check_days_warning_positive'),
        sa.CheckConstraint('expiry_warning_days >= 0', name='check_expiry_warning_positive'),
        sa.CheckConstraint('priority_level >= 1 AND priority_level <= 3', name='check_priority_level_range'),
        sa.CheckConstraint('reorder_quantity >= 0', name='check_reorder_quantity_positive'),
        sa.CheckConstraint('max_stock_level >= reorder_quantity', name='check_max_stock_gte_reorder'),
    )
    
    # Create indexes
    op.create_index('idx_inventory_child_product', 'inventory_items', ['child_id', 'product_type'])
    op.create_index('idx_inventory_child_size', 'inventory_items', ['child_id', 'size'])
    op.create_index('idx_inventory_low_stock', 'inventory_items', ['child_id', 'quantity_remaining'])
    op.create_index('idx_inventory_expiry', 'inventory_items', ['expiry_date'])
    op.create_index('idx_inventory_brand_size', 'inventory_items', ['brand', 'size'])
    
    op.create_index('idx_usage_child_date', 'usage_logs', ['child_id', 'logged_at'])
    op.create_index('idx_usage_type_date', 'usage_logs', ['usage_type', 'logged_at'])
    op.create_index('idx_usage_inventory', 'usage_logs', ['inventory_item_id', 'logged_at'])
    op.create_index('idx_usage_daily_stats', 'usage_logs', ['child_id', 'usage_type', 'logged_at'])
    op.create_index('idx_usage_pattern_analysis', 'usage_logs', ['child_id', 'logged_at', 'usage_type', 'quantity_used'])
    
    op.create_index('idx_threshold_child_product', 'stock_thresholds', ['child_id', 'product_type', 'size'])
    op.create_index('idx_threshold_notifications', 'stock_thresholds', ['notification_enabled', 'last_low_notification'])
    op.create_index('idx_threshold_priority', 'stock_thresholds', ['priority_level', 'notification_enabled'])
    op.create_index('idx_threshold_unique', 'stock_thresholds', ['child_id', 'product_type', 'size', 'threshold_type'], unique=True)


def downgrade():
    # Drop indexes
    op.drop_index('idx_threshold_unique')
    op.drop_index('idx_threshold_priority')
    op.drop_index('idx_threshold_notifications')
    op.drop_index('idx_threshold_child_product')
    
    op.drop_index('idx_usage_pattern_analysis')
    op.drop_index('idx_usage_daily_stats')
    op.drop_index('idx_usage_inventory')
    op.drop_index('idx_usage_type_date')
    op.drop_index('idx_usage_child_date')
    
    op.drop_index('idx_inventory_brand_size')
    op.drop_index('idx_inventory_expiry')
    op.drop_index('idx_inventory_low_stock')
    op.drop_index('idx_inventory_child_size')
    op.drop_index('idx_inventory_child_product')
    
    # Drop tables
    op.drop_table('stock_thresholds')
    op.drop_table('usage_logs')
    op.drop_table('inventory_items')
```

## Integration with GraphQL Schema

### GraphQL Types and Resolvers

```python
# Add to GraphQL schema types
@strawberry.type
class InventoryItemType:
    id: uuid.UUID
    child_id: uuid.UUID
    product_type: str
    brand: str
    size: str
    quantity_total: int
    quantity_remaining: int
    cost_cad: Optional[float]
    purchase_date: datetime
    expiry_date: Optional[datetime]
    quality_rating: Optional[int]
    notes: Optional[str]
    
    @strawberry.field
    def days_remaining(self, info) -> Optional[float]:
        """Calculate days remaining based on usage patterns"""
        # Implementation would calculate based on child's usage patterns
        return None

@strawberry.type
class UsageLogType:
    id: uuid.UUID
    child_id: uuid.UUID
    usage_type: str
    logged_at: datetime
    quantity_used: int
    context: Optional[str]
    notes: Optional[str]

@strawberry.type
class StockThresholdType:
    id: uuid.UUID
    child_id: uuid.UUID
    product_type: str
    size: str
    low_threshold: Optional[int]
    critical_threshold: Optional[int]
    notification_enabled: bool

@strawberry.type
class DashboardSummaryType:
    total_diapers: int
    days_remaining: Optional[float]
    usage_today: int
    low_stock_alerts: List[str]
    expiring_soon: List[str]

# Mutations for inventory management
@strawberry.mutation
async def add_inventory_item(self, input: AddInventoryItemInput, info: Info) -> AddInventoryItemResponse:
    """Add new inventory item"""
    # Implementation follows the async session pattern
    pass

@strawberry.mutation
async def log_usage(self, input: LogUsageInput, info: Info) -> LogUsageResponse:
    """Log diaper change or product usage"""
    # Implementation follows the async session pattern
    pass

@strawberry.mutation
async def update_stock_threshold(self, input: UpdateStockThresholdInput, info: Info) -> UpdateStockThresholdResponse:
    """Update stock alert thresholds"""
    # Implementation follows the async session pattern
    pass

@strawberry.query
async def get_dashboard_summary(self, child_id: uuid.UUID, info: Info) -> DashboardSummaryType:
    """Get dashboard summary for a child"""
    # Implementation uses optimized queries from DashboardQueries class
    pass
```

## Canadian Privacy and Compliance Considerations

### PIPEDA Compliance Features

1. **Data Minimization**: Only collect necessary inventory data
2. **Consent Management**: Clear consent for data collection and analytics
3. **Data Retention**: Automatic cleanup of old usage logs based on retention policies
4. **Audit Trails**: Complete audit trails for all data modifications
5. **User Control**: Users can export or delete all their inventory data

### Privacy-by-Design Implementation

```python
class PrivacyComplianceService:
    """Service for PIPEDA compliance features"""
    
    @staticmethod
    async def export_user_inventory_data(session, parent_id: uuid.UUID) -> dict:
        """Export all inventory data for a user (PIPEDA requirement)"""
        # Implementation to export all inventory, usage, and threshold data
        pass
    
    @staticmethod
    async def anonymize_usage_patterns(session, child_id: uuid.UUID):
        """Anonymize usage patterns for analytics while preserving utility"""
        # Implementation to anonymize personal data for analytics
        pass
    
    @staticmethod
    async def purge_expired_data(session):
        """Purge data that has exceeded retention periods"""
        # Implementation to clean up old data per retention policies
        pass
```

## Testing Strategy

### Unit Tests for Models

```python
import pytest
from datetime import datetime, timezone, timedelta
from app.models.inventory import InventoryItem, UsageLog, StockThreshold

class TestInventoryItem:
    def test_use_quantity_success(self):
        item = InventoryItem(
            quantity_total=50,
            quantity_remaining=30,
            quantity_reserved=0
        )
        assert item.use_quantity(5) == True
        assert item.quantity_remaining == 25
    
    def test_use_quantity_insufficient_stock(self):
        item = InventoryItem(
            quantity_total=50,
            quantity_remaining=3,
            quantity_reserved=0
        )
        assert item.use_quantity(5) == False
        assert item.quantity_remaining == 3

class TestUsageLog:
    def test_calculate_time_since_last(self):
        now = datetime.now(timezone.utc)
        last_usage = now - timedelta(hours=2)
        
        log = UsageLog(logged_at=now)
        assert log.calculate_time_since_last(last_usage) == 120

class TestStockThreshold:
    def test_should_notify_critical_stock(self):
        threshold = StockThreshold(
            low_threshold=20,
            critical_threshold=5,
            notification_enabled=True
        )
        
        result = threshold.should_notify(current_quantity=3)
        assert result['critical_stock'] == True
        assert 'Critical stock' in result['reasons'][0]
```

## Summary

This comprehensive database schema design provides:

1. **Complete SQLAlchemy Models** with proper relationships, constraints, and validation
2. **PIPEDA Compliant RLS Policies** ensuring data isolation between families
3. **Performance Optimized Indexes** for dashboard queries and analytics
4. **Scalable Architecture** supporting multi-child families and large datasets
5. **Integration Ready** with existing Child model and GraphQL schema
6. **Canadian Compliance** with privacy-by-design and data retention features

The schema supports the complete user journey from inventory setup through daily usage tracking, with intelligent notifications and analytics capabilities. All models follow the established NestSync patterns and include comprehensive audit trails for compliance requirements.