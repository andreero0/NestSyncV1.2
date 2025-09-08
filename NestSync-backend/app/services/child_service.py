"""
Child Service for NestSync
Child profile management and onboarding wizard business logic
"""

import logging
import uuid
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone, date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc

from app.models import User, Child
from app.config.settings import settings

logger = logging.getLogger(__name__)


class ChildService:
    """
    Service class for child-related business logic and onboarding wizard
    """
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def create_child(
        self,
        parent: User,
        name: str,
        date_of_birth: date,
        current_diaper_size: str,
        **child_data
    ) -> Child:
        """
        Create a new child profile
        """
        # Validate child limit
        children_count = await self.get_user_children_count(parent.id)
        if children_count >= settings.max_children_per_user:
            raise ValueError(f"Maximum {settings.max_children_per_user} children allowed per user")
        
        # Validate date of birth - allow future dates for expectant parents (up to 9 months)
        from datetime import timedelta
        max_future_date = date.today() + timedelta(days=270)  # ~9 months for pregnancy planning
        if date_of_birth > max_future_date:
            raise ValueError("Due date cannot be more than 9 months in the future")
        
        child = Child(
            parent_id=parent.id,
            name=name.strip(),
            date_of_birth=date_of_birth,
            current_diaper_size=current_diaper_size,
            province=parent.province,  # Inherit from parent
            created_by=parent.id,
            **child_data
        )
        
        # Set recommended daily usage if not provided
        if not child_data.get("daily_usage_count"):
            child.daily_usage_count = child.get_recommended_daily_usage()
        
        self.session.add(child)
        await self.session.flush()
        
        logger.info(f"Child created: {child.id} for parent: {parent.id}")
        return child
    
    async def get_child_by_id(
        self,
        child_id: uuid.UUID,
        parent_user_id: Optional[uuid.UUID] = None
    ) -> Optional[Child]:
        """
        Get child by ID, optionally filtered by parent
        """
        query = select(Child).where(
            and_(
                Child.id == child_id,
                Child.is_deleted == False
            )
        )
        
        if parent_user_id:
            query = query.where(Child.parent_id == parent_user_id)
        
        result = await self.session.execute(query)
        return result.scalar_one_or_none()
    
    async def get_user_children(
        self,
        parent_user_id: uuid.UUID,
        limit: int = 50,
        offset: int = 0,
        active_only: bool = True
    ) -> List[Child]:
        """
        Get all children for a user
        """
        query = select(Child).where(Child.parent_id == parent_user_id)
        
        if active_only:
            query = query.where(Child.is_deleted == False)
        
        query = query.order_by(Child.created_at.desc()).offset(offset).limit(limit)
        
        result = await self.session.execute(query)
        return result.scalars().all()
    
    async def get_user_children_count(self, parent_user_id: uuid.UUID) -> int:
        """
        Get count of children for a user
        """
        from sqlalchemy import func
        
        result = await self.session.execute(
            select(func.count(Child.id)).where(
                and_(
                    Child.parent_id == parent_user_id,
                    Child.is_deleted == False
                )
            )
        )
        return result.scalar() or 0
    
    async def update_child(
        self,
        child: Child,
        updated_by: uuid.UUID,
        **update_data
    ) -> Child:
        """
        Update child information
        """
        child.updated_by = updated_by
        
        # Handle special updates
        if "current_diaper_size" in update_data:
            new_size = update_data.pop("current_diaper_size")
            child.update_diaper_size(new_size)
        
        if "current_weight_kg" in update_data:
            weight = update_data.pop("current_weight_kg")
            child.add_weight_measurement(weight)
        
        if "current_height_cm" in update_data:
            height = update_data.pop("current_height_cm")
            child.add_height_measurement(height)
        
        # Update other fields
        for field, value in update_data.items():
            if hasattr(child, field) and value is not None:
                setattr(child, field, value)
        
        await self.session.commit()
        await self.session.refresh(child)
        
        logger.info(f"Child updated: {child.id}")
        return child
    
    async def delete_child(
        self,
        child: Child,
        deleted_by: uuid.UUID
    ) -> Child:
        """
        Soft delete a child profile (PIPEDA compliance)
        """
        child.soft_delete(deleted_by)
        
        await self.session.commit()
        
        logger.info(f"Child soft deleted: {child.id}")
        return child
    
    async def complete_onboarding_step(
        self,
        child: Child,
        step_name: str,
        step_data: Optional[Dict[str, Any]] = None
    ) -> Child:
        """
        Complete an onboarding wizard step
        """
        child.complete_onboarding_step(step_name, step_data)
        
        # Check if onboarding is complete
        if child.onboarding_completed:
            logger.info(f"Child onboarding completed: {child.id}")
        
        await self.session.commit()
        await self.session.refresh(child)
        
        logger.debug(f"Onboarding step completed: {child.id} - {step_name}")
        return child
    
    async def set_initial_inventory(
        self,
        child: Child,
        inventory_items: List[Dict[str, Any]]
    ) -> Child:
        """
        Set initial diaper inventory from onboarding
        """
        inventory_data = {
            "items": inventory_items,
            "total_diapers": sum(item.get("quantity", 0) for item in inventory_items),
            "unique_brands": list(set(item.get("brand") for item in inventory_items if item.get("brand"))),
            "setup_date": date.today().isoformat()
        }
        
        child.set_initial_inventory(inventory_data)
        
        # Mark inventory step as completed
        child.complete_onboarding_step("initial_inventory", {
            "inventory_count": len(inventory_items),
            "total_diapers": inventory_data["total_diapers"]
        })
        
        await self.session.commit()
        await self.session.refresh(child)
        
        logger.info(f"Initial inventory set for child: {child.id}")
        return child
    
    async def update_usage_pattern(
        self,
        child: Child,
        hourly_usage: Dict[int, int]
    ) -> Child:
        """
        Update child's diaper usage pattern
        """
        # Validate hourly usage (0-23 hours, reasonable quantities)
        for hour, count in hourly_usage.items():
            if not (0 <= hour <= 23):
                raise ValueError(f"Invalid hour: {hour}")
            if not (0 <= count <= 5):  # Max 5 diapers per hour seems reasonable
                raise ValueError(f"Invalid usage count for hour {hour}: {count}")
        
        child.update_usage_pattern(hourly_usage)
        
        # Update daily usage count based on pattern
        child.daily_usage_count = sum(hourly_usage.values())
        
        await self.session.commit()
        await self.session.refresh(child)
        
        logger.info(f"Usage pattern updated for child: {child.id}")
        return child
    
    async def get_child_onboarding_status(self, child: Child) -> Dict[str, Any]:
        """
        Get detailed onboarding status for a child
        """
        wizard_data = child.wizard_data or {}
        
        required_steps = ["basic_info", "size_selection", "usage_pattern", "initial_inventory"]
        completed_steps = list(wizard_data.keys())
        
        status = {
            "child_id": str(child.id),
            "onboarding_completed": child.onboarding_completed,
            "current_step": child.onboarding_step,
            "progress_percentage": int((len(completed_steps) / len(required_steps)) * 100),
            "required_steps": required_steps,
            "completed_steps": completed_steps,
            "remaining_steps": [step for step in required_steps if step not in completed_steps],
            "step_details": wizard_data
        }
        
        return status
    
    async def get_size_recommendations(self, child: Child) -> Dict[str, Any]:
        """
        Get diaper size recommendations based on child's growth
        """
        recommendations = {
            "current_size": child.current_diaper_size,
            "current_fit": "good",  # Would be calculated based on weight/age
            "next_size_recommendation": None,
            "estimated_next_size_date": child.estimated_next_size_date,
            "weight_based_recommendation": None,
            "age_based_recommendation": None
        }
        
        # Weight-based recommendation (simplified logic)
        if child.current_weight_kg:
            weight_kg = child.current_weight_kg
            if weight_kg < 4.5:
                weight_rec = "newborn"
            elif weight_kg < 6:
                weight_rec = "size_1"
            elif weight_kg < 9:
                weight_rec = "size_2"
            elif weight_kg < 12:
                weight_rec = "size_3"
            elif weight_kg < 16:
                weight_rec = "size_4"
            elif weight_kg < 20:
                weight_rec = "size_5"
            else:
                weight_rec = "size_6"
            
            recommendations["weight_based_recommendation"] = weight_rec
        
        # Age-based recommendation (simplified logic)
        age_months = child.age_in_months
        if age_months < 1:
            age_rec = "newborn"
        elif age_months < 4:
            age_rec = "size_1"
        elif age_months < 9:
            age_rec = "size_2"
        elif age_months < 18:
            age_rec = "size_3"
        elif age_months < 24:
            age_rec = "size_4"
        elif age_months < 36:
            age_rec = "size_5"
        else:
            age_rec = "size_6"
        
        recommendations["age_based_recommendation"] = age_rec
        
        # Determine if size change is recommended
        current_sizes = ["newborn", "size_1", "size_2", "size_3", "size_4", "size_5", "size_6"]
        current_index = current_sizes.index(child.current_diaper_size) if child.current_diaper_size in current_sizes else 0
        
        weight_index = current_sizes.index(weight_rec) if weight_rec in current_sizes else current_index
        age_index = current_sizes.index(age_rec) if age_rec in current_sizes else current_index
        
        if max(weight_index, age_index) > current_index:
            recommendations["next_size_recommendation"] = current_sizes[max(weight_index, age_index)]
            recommendations["current_fit"] = "too_small"
        elif min(weight_index, age_index) < current_index:
            recommendations["current_fit"] = "too_large"
        
        return recommendations
    
    async def calculate_usage_statistics(self, child: Child) -> Dict[str, Any]:
        """
        Calculate usage statistics for a child
        """
        stats = {
            "daily_usage": child.daily_usage_count,
            "weekly_usage": child.weekly_usage,
            "monthly_usage": child.monthly_usage,
            "age_in_days": child.age_in_days,
            "age_in_months": child.age_in_months,
            "usage_efficiency": "normal",  # Would be calculated based on age/weight norms
            "cost_per_day": 0.0,  # Would calculate based on diaper costs
            "cost_per_month": 0.0,
            "usage_trend": "stable"  # Would analyze historical data
        }
        
        # Calculate basic cost estimates (example with average diaper cost)
        avg_diaper_cost_cad = 0.35  # Average cost per diaper in CAD
        stats["cost_per_day"] = child.daily_usage_count * avg_diaper_cost_cad
        stats["cost_per_month"] = stats["cost_per_day"] * 30
        
        return stats


# =============================================================================
# Export Service
# =============================================================================

__all__ = ["ChildService"]