"""
GraphQL Child and Onboarding Resolvers
Child profile creation and onboarding wizard backend
"""

import logging
import uuid
from typing import Optional, List
from datetime import datetime, timezone, date
import strawberry
from strawberry.types import Info
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config.database import get_async_session
from app.models import User, Child
from app.services.child_service import ChildService
from .types import (
    ChildProfile,
    CreateChildInput,
    UpdateChildInput,
    CreateChildResponse,
    UpdateChildResponse,
    OnboardingWizardStepInput,
    InitialInventoryInput,
    OnboardingStatusResponse,
    OnboardingWizardStep,
    MutationResponse,
    ChildConnection,
    PageInfo,
    DiaperSizeType,
    GenderType
)

logger = logging.getLogger(__name__)


def child_to_graphql(child: Child) -> ChildProfile:
    """Convert Child model to GraphQL ChildProfile type"""
    return ChildProfile(
        id=str(child.id),
        name=child.name,
        date_of_birth=child.date_of_birth,
        gender=child.gender,
        current_diaper_size=child.current_diaper_size,
        current_weight_kg=child.current_weight_kg,
        current_height_cm=child.current_height_cm,
        daily_usage_count=child.daily_usage_count,
        has_sensitive_skin=child.has_sensitive_skin,
        has_allergies=child.has_allergies,
        allergies_notes=child.allergies_notes,
        onboarding_completed=child.onboarding_completed,
        province=child.province,
        created_at=child.created_at
    )


@strawberry.type
class ChildMutations:
    """Child profile mutations"""
    
    @strawberry.mutation
    async def create_child(
        self,
        input: CreateChildInput,
        info: Info
    ) -> CreateChildResponse:
        """
        Create new child profile during onboarding
        """
        try:
            # In full implementation, get current user from auth dependency
            # For now, using placeholder logic
            request = info.context["request"]
            # user = await get_current_user(request)  # Would use dependency
            
            # Validate child data
            if not input.name or not input.name.strip():
                return CreateChildResponse(
                    success=False,
                    error="Child name is required"
                )
            
            if input.date_of_birth >= date.today():
                return CreateChildResponse(
                    success=False,
                    error="Date of birth must be in the past"
                )
            
            if input.daily_usage_count < 1 or input.daily_usage_count > 20:
                return CreateChildResponse(
                    success=False,
                    error="Daily usage count must be between 1 and 20"
                )
            
            # Create child record
            async for session in get_async_session():
                # For now, using a placeholder parent_id
                # In full implementation: parent_id = user.id
                parent_id = uuid.uuid4()  # Placeholder
                
                child = Child(
                    parent_id=parent_id,
                    name=input.name.strip(),
                    date_of_birth=input.date_of_birth,
                    gender=input.gender,
                    current_diaper_size=input.current_diaper_size,
                    current_weight_kg=input.current_weight_kg,
                    current_height_cm=input.current_height_cm,
                    daily_usage_count=input.daily_usage_count,
                    has_sensitive_skin=input.has_sensitive_skin,
                    has_allergies=input.has_allergies,
                    allergies_notes=input.allergies_notes,
                    special_needs=input.special_needs,
                    preferred_brands=input.preferred_brands,
                    onboarding_step="basic_info",
                    wizard_data={
                        "basic_info": {
                            "completed_at": datetime.now(timezone.utc).isoformat(),
                            "data": {
                                "name": input.name,
                                "date_of_birth": input.date_of_birth.isoformat(),
                                "gender": input.gender,
                                "current_diaper_size": input.current_diaper_size,
                                "weight_kg": input.current_weight_kg,
                                "height_cm": input.current_height_cm
                            }
                        }
                    }
                )
                
                # Set recommended daily usage if not specified
                if not input.daily_usage_count:
                    child.daily_usage_count = child.get_recommended_daily_usage()
                
                session.add(child)
                await session.commit()
                await session.refresh(child)
                
                logger.info(f"Child created successfully: {child.id}")
                
                return CreateChildResponse(
                    success=True,
                    message="Child profile created successfully",
                    child=child_to_graphql(child)
                )
                
        except Exception as e:
            logger.error(f"Error creating child: {e}")
            return CreateChildResponse(
                success=False,
                error="Failed to create child profile"
            )
    
    @strawberry.mutation
    async def update_child(
        self,
        child_id: strawberry.ID,
        input: UpdateChildInput,
        info: Info
    ) -> UpdateChildResponse:
        """
        Update existing child profile
        """
        try:
            # Get current user (placeholder)
            # user = await get_current_user(request)
            
            async for session in get_async_session():
                # Get child
                result = await session.execute(
                    select(Child).where(
                        Child.id == uuid.UUID(child_id),
                        Child.is_deleted == False
                        # Child.parent_id == user.id  # Ensure user owns child
                    )
                )
                child = result.scalar_one_or_none()
                
                if not child:
                    return UpdateChildResponse(
                        success=False,
                        error="Child not found"
                    )
                
                # Update fields
                if input.name is not None:
                    child.name = input.name.strip()
                if input.current_diaper_size is not None:
                    child.update_diaper_size(input.current_diaper_size)
                if input.current_weight_kg is not None:
                    child.add_weight_measurement(input.current_weight_kg)
                if input.current_height_cm is not None:
                    child.add_height_measurement(input.current_height_cm)
                if input.daily_usage_count is not None:
                    child.daily_usage_count = input.daily_usage_count
                if input.has_sensitive_skin is not None:
                    child.has_sensitive_skin = input.has_sensitive_skin
                if input.has_allergies is not None:
                    child.has_allergies = input.has_allergies
                if input.allergies_notes is not None:
                    child.allergies_notes = input.allergies_notes
                if input.preferred_brands is not None:
                    child.preferred_brands = input.preferred_brands
                if input.special_needs is not None:
                    child.special_needs = input.special_needs
                
                await session.commit()
                await session.refresh(child)
                
                return UpdateChildResponse(
                    success=True,
                    message="Child profile updated successfully",
                    child=child_to_graphql(child)
                )
                
        except Exception as e:
            logger.error(f"Error updating child: {e}")
            return UpdateChildResponse(
                success=False,
                error="Failed to update child profile"
            )
    
    @strawberry.mutation
    async def complete_onboarding_step(
        self,
        child_id: strawberry.ID,
        input: OnboardingWizardStepInput,
        info: Info
    ) -> MutationResponse:
        """
        Complete an onboarding wizard step
        """
        try:
            async for session in get_async_session():
                # Get child
                result = await session.execute(
                    select(Child).where(
                        Child.id == uuid.UUID(child_id),
                        Child.is_deleted == False
                    )
                )
                child = result.scalar_one_or_none()
                
                if not child:
                    return MutationResponse(
                        success=False,
                        error="Child not found"
                    )
                
                # Complete the step
                child.complete_onboarding_step(input.step_name, input.data)
                
                await session.commit()
                
                return MutationResponse(
                    success=True,
                    message=f"Onboarding step '{input.step_name}' completed"
                )
                
        except Exception as e:
            logger.error(f"Error completing onboarding step: {e}")
            return MutationResponse(
                success=False,
                error="Failed to complete onboarding step"
            )
    
    @strawberry.mutation
    async def set_initial_inventory(
        self,
        child_id: strawberry.ID,
        inventory_items: List[InitialInventoryInput],
        info: Info
    ) -> MutationResponse:
        """
        Set initial diaper inventory from onboarding wizard
        """
        try:
            async for session in get_async_session():
                # Get child
                result = await session.execute(
                    select(Child).where(
                        Child.id == uuid.UUID(child_id),
                        Child.is_deleted == False
                    )
                )
                child = result.scalar_one_or_none()
                
                if not child:
                    return MutationResponse(
                        success=False,
                        error="Child not found"
                    )
                
                # Process inventory items
                inventory_data = []
                for item in inventory_items:
                    inventory_data.append({
                        "diaper_size": item.diaper_size,
                        "brand": item.brand,
                        "quantity": item.quantity,
                        "purchase_date": item.purchase_date.isoformat() if item.purchase_date else None,
                        "expiry_date": item.expiry_date.isoformat() if item.expiry_date else None,
                        "added_at": datetime.now(timezone.utc).isoformat()
                    })
                
                # Set initial inventory
                child.set_initial_inventory({"items": inventory_data})
                
                # Mark inventory step as completed
                child.complete_onboarding_step("initial_inventory", {
                    "inventory_count": len(inventory_items),
                    "total_diapers": sum(item.quantity for item in inventory_items)
                })
                
                await session.commit()
                
                return MutationResponse(
                    success=True,
                    message="Initial inventory set successfully"
                )
                
        except Exception as e:
            logger.error(f"Error setting initial inventory: {e}")
            return MutationResponse(
                success=False,
                error="Failed to set initial inventory"
            )
    
    @strawberry.mutation
    async def delete_child(
        self,
        child_id: strawberry.ID,
        info: Info
    ) -> MutationResponse:
        """
        Soft delete a child profile (PIPEDA compliance)
        """
        try:
            async for session in get_async_session():
                # Get child
                result = await session.execute(
                    select(Child).where(
                        Child.id == uuid.UUID(child_id),
                        Child.is_deleted == False
                    )
                )
                child = result.scalar_one_or_none()
                
                if not child:
                    return MutationResponse(
                        success=False,
                        error="Child not found"
                    )
                
                # Soft delete
                child.soft_delete()
                await session.commit()
                
                return MutationResponse(
                    success=True,
                    message="Child profile deleted successfully"
                )
                
        except Exception as e:
            logger.error(f"Error deleting child: {e}")
            return MutationResponse(
                success=False,
                error="Failed to delete child profile"
            )


@strawberry.type
class ChildQueries:
    """Child profile queries"""
    
    @strawberry.field
    async def my_children(
        self,
        info: Info,
        first: int = 10,
        after: Optional[str] = None
    ) -> ChildConnection:
        """
        Get current user's children
        """
        try:
            # Get current user (placeholder)
            # user = await get_current_user(request)
            
            async for session in get_async_session():
                # For now, returning empty connection
                # In full implementation, query user's children
                return ChildConnection(
                    edges=[],
                    page_info=PageInfo(
                        has_next_page=False,
                        has_previous_page=False,
                        total_count=0
                    )
                )
                
        except Exception as e:
            logger.error(f"Error getting children: {e}")
            return ChildConnection(
                edges=[],
                page_info=PageInfo(
                    has_next_page=False,
                    has_previous_page=False,
                    total_count=0
                )
            )
    
    @strawberry.field
    async def child(
        self,
        child_id: strawberry.ID,
        info: Info
    ) -> Optional[ChildProfile]:
        """
        Get specific child profile
        """
        try:
            async for session in get_async_session():
                result = await session.execute(
                    select(Child).where(
                        Child.id == uuid.UUID(child_id),
                        Child.is_deleted == False
                    )
                )
                child = result.scalar_one_or_none()
                
                if child:
                    return child_to_graphql(child)
                return None
                
        except Exception as e:
            logger.error(f"Error getting child: {e}")
            return None
    
    @strawberry.field
    async def onboarding_status(
        self,
        info: Info
    ) -> OnboardingStatusResponse:
        """
        Get current user's onboarding status
        """
        try:
            # Get current user (placeholder)
            # user = await get_current_user(request)
            
            # For now, returning basic status
            # In full implementation, check user and children onboarding status
            return OnboardingStatusResponse(
                user_onboarding_completed=False,
                current_step="welcome",
                completed_steps=[],
                children_count=0,
                required_consents_given=False
            )
            
        except Exception as e:
            logger.error(f"Error getting onboarding status: {e}")
            return OnboardingStatusResponse(
                user_onboarding_completed=False,
                current_step="error",
                completed_steps=[],
                children_count=0,
                required_consents_given=False
            )


# =============================================================================
# Export Resolvers
# =============================================================================

__all__ = ["ChildMutations", "ChildQueries"]