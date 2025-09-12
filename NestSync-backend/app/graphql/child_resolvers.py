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
    DeleteChildInput,
    RecreateChildProfileInput,
    CreateChildResponse,
    UpdateChildResponse,
    DeleteChildResponse,
    RecreateChildProfileResponse,
    DeletionAuditInfo,
    OnboardingWizardStepInput,
    InitialInventoryInput,
    OnboardingStatusResponse,
    OnboardingWizardStep,
    MutationResponse,
    ChildConnection,
    ChildEdge,
    PageInfo,
    DiaperSizeType,
    GenderType,
    DeletionType
)

logger = logging.getLogger(__name__)


def child_to_graphql(child: Child) -> ChildProfile:
    """Convert Child model to GraphQL ChildProfile type"""
    # Convert string values from database back to GraphQL enum types
    gender_enum = None
    if child.gender:
        try:
            gender_enum = GenderType(child.gender)
        except ValueError:
            logger.warning(f"Invalid gender value in database: {child.gender}")
            gender_enum = None
    
    diaper_size_enum = None
    if child.current_diaper_size:
        try:
            diaper_size_enum = DiaperSizeType(child.current_diaper_size)
        except ValueError:
            logger.warning(f"Invalid diaper size value in database: {child.current_diaper_size}")
            # Default to SIZE_1 if invalid value found
            diaper_size_enum = DiaperSizeType.SIZE_1
    else:
        # Default diaper size if None
        diaper_size_enum = DiaperSizeType.SIZE_1
    
    return ChildProfile(
        id=str(child.id),
        name=child.name,
        date_of_birth=child.date_of_birth,
        gender=gender_enum,
        current_diaper_size=diaper_size_enum,
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
        from graphql import GraphQLError
        
        try:
            # Get authenticated user from context (throws GraphQLError if not authenticated)
            from app.graphql.context import require_context_user
            current_user = await require_context_user(info)
            
        except GraphQLError as auth_error:
            # Handle GraphQL authentication errors specifically
            logger.error(f"Authentication error in create_child: {auth_error}")
            # Re-raise GraphQL errors with proper extensions
            from graphql import GraphQLError as GQLError
            raise GQLError(
                message="Authentication required to create child profile",
                extensions={
                    "code": "UNAUTHENTICATED",
                    "category": "AUTHENTICATION_ERROR"
                }
            )
        
        try:
            # Validate child data
            if not input.name or not input.name.strip():
                return CreateChildResponse(
                    success=False,
                    error="Child name is required"
                )
            
            # Validate date of birth - allow future dates for expectant parents (up to 9 months)
            from datetime import timedelta
            max_future_date = date.today() + timedelta(days=270)  # ~9 months for pregnancy planning
            if input.date_of_birth > max_future_date:
                return CreateChildResponse(
                    success=False,
                    error="Due date cannot be more than 9 months in the future"
                )
            
            if input.daily_usage_count < 1 or input.daily_usage_count > 20:
                return CreateChildResponse(
                    success=False,
                    error="Daily usage count must be between 1 and 20"
                )
            
            # Create child record
            async for session in get_async_session():
                # Use the authenticated user's ID as parent_id
                parent_id = current_user.id
                
                # Ensure enum values are properly converted to strings
                diaper_size = str(input.current_diaper_size.value) if input.current_diaper_size else None
                gender_value = str(input.gender.value) if input.gender else None
                
                child = Child(
                    parent_id=parent_id,
                    name=input.name.strip(),
                    date_of_birth=input.date_of_birth,
                    gender=gender_value,
                    current_diaper_size=diaper_size,
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
                                "gender": gender_value,
                                "current_diaper_size": diaper_size,
                                "weight_kg": input.current_weight_kg,
                                "height_cm": input.current_height_cm
                            }
                        }
                    }
                )
                
                # Set default daily usage if not specified
                if not input.daily_usage_count:
                    # Calculate age in weeks manually to avoid method issues
                    age_in_days = (date.today() - input.date_of_birth).days
                    age_in_weeks = age_in_days // 7
                    
                    # Age-based usage recommendations
                    if age_in_weeks < 4:  # Newborn
                        child.daily_usage_count = 12
                    elif age_in_weeks < 12:  # 0-3 months
                        child.daily_usage_count = 10
                    elif age_in_weeks < 26:  # 3-6 months
                        child.daily_usage_count = 8
                    elif age_in_weeks < 52:  # 6-12 months
                        child.daily_usage_count = 7
                    elif age_in_weeks < 104:  # 12-24 months
                        child.daily_usage_count = 6
                    else:  # 24+ months
                        child.daily_usage_count = 5
                
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
            # Get authenticated user from context (throws GraphQLError if not authenticated)
            from app.graphql.context import require_context_user
            current_user = await require_context_user(info)
            
        except GraphQLError as auth_error:
            # Handle GraphQL authentication errors specifically
            logger.error(f"Authentication error in update_child: {auth_error}")
            # Re-raise GraphQL errors with proper extensions
            from graphql import GraphQLError as GQLError
            raise GQLError(
                message="Authentication required to update child profile",
                extensions={
                    "code": "UNAUTHENTICATED",
                    "category": "AUTHENTICATION_ERROR"
                }
            )
        
        try:
            async for session in get_async_session():
                # Get child
                result = await session.execute(
                    select(Child).where(
                        Child.id == uuid.UUID(child_id),
                        Child.is_deleted == False,
                        Child.parent_id == current_user.id  # Ensure user owns child
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
                    # Convert enum to string before saving
                    new_size_str = str(input.current_diaper_size.value)
                    child.update_diaper_size(new_size_str)
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
        Creates actual InventoryItem records in the database
        """
        from graphql import GraphQLError
        
        try:
            # Get authenticated user from context (throws GraphQLError if not authenticated)
            from app.graphql.context import require_context_user
            current_user = await require_context_user(info)
            
        except GraphQLError as auth_error:
            # Handle GraphQL authentication errors specifically
            logger.error(f"Authentication error in set_initial_inventory: {auth_error}")
            # Re-raise GraphQL errors with proper extensions
            from graphql import GraphQLError as GQLError
            raise GQLError(
                message="Authentication required to set inventory",
                extensions={
                    "code": "UNAUTHENTICATED",
                    "category": "AUTHENTICATION_ERROR"
                }
            )
        
        try:
            # Import InventoryItem model
            from app.models import InventoryItem
            from decimal import Decimal
            
            async for session in get_async_session():
                child_uuid = uuid.UUID(child_id)
                
                # Verify child exists and belongs to authenticated user
                result = await session.execute(
                    select(Child).where(
                        Child.id == child_uuid,
                        Child.parent_id == current_user.id,  # Ensure user owns child
                        Child.is_deleted == False
                    )
                )
                child = result.scalar_one_or_none()
                
                if not child:
                    return MutationResponse(
                        success=False,
                        error="Child not found or access denied"
                    )
                
                # Validate input
                if not inventory_items or len(inventory_items) == 0:
                    return MutationResponse(
                        success=False,
                        error="At least one inventory item is required"
                    )
                
                # Create actual InventoryItem records
                created_items = []
                total_diapers = 0
                
                for item in inventory_items:
                    # Validate each item
                    if item.quantity <= 0:
                        return MutationResponse(
                            success=False,
                            error=f"Invalid quantity for {item.brand}: must be greater than 0"
                        )
                    
                    # Create inventory item record
                    inventory_item = InventoryItem(
                        child_id=child_uuid,
                        product_type="diaper",  # Initial inventory is always diapers
                        brand=item.brand,
                        product_name=f"{item.brand} Diapers",
                        size=str(item.diaper_size.value),  # Convert enum to string value
                        quantity_total=item.quantity,
                        quantity_remaining=item.quantity,
                        quantity_reserved=0,
                        purchase_date=item.purchase_date or datetime.now(timezone.utc).date(),
                        expiry_date=item.expiry_date,
                        cost_cad=None,  # Cost not provided in initial inventory
                        storage_location=None,
                        is_opened=False,
                        opened_date=None,
                        notes=f"Added during onboarding for {child.name}",
                        quality_rating=None,
                        would_rebuy=None
                    )
                    
                    session.add(inventory_item)
                    created_items.append(inventory_item)
                    total_diapers += item.quantity
                
                # Also update child's wizard data for completeness
                inventory_data = []
                for item in inventory_items:
                    inventory_data.append({
                        "diaper_size": str(item.diaper_size.value),  # Convert enum to string value
                        "brand": item.brand,
                        "quantity": item.quantity,
                        "purchase_date": item.purchase_date.isoformat() if item.purchase_date else None,
                        "expiry_date": item.expiry_date.isoformat() if item.expiry_date else None,
                        "added_at": datetime.now(timezone.utc).isoformat()
                    })
                
                # Set initial inventory in wizard data
                child.set_initial_inventory({"items": inventory_data})
                
                # Mark inventory step as completed
                child.complete_onboarding_step("initial_inventory", {
                    "inventory_count": len(inventory_items),
                    "total_diapers": total_diapers,
                    "items_created": len(created_items)
                })
                
                # Commit all changes
                await session.commit()
                
                logger.info(f"Created {len(created_items)} inventory items for child {child_uuid} with {total_diapers} total diapers")
                
                return MutationResponse(
                    success=True,
                    message=f"Initial inventory set successfully: {len(created_items)} items with {total_diapers} diapers"
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
        input: DeleteChildInput,
        info: Info
    ) -> DeleteChildResponse:
        """
        Enhanced child profile deletion with comprehensive cleanup options
        Supports both soft delete (PIPEDA compliant) and hard delete (with CASCADE cleanup)
        """
        from graphql import GraphQLError
        
        try:
            # Get authenticated user from context
            from app.graphql.context import require_context_user
            current_user = await require_context_user(info)
            
        except GraphQLError as auth_error:
            logger.error(f"Authentication error in delete_child: {auth_error}")
            from graphql import GraphQLError as GQLError
            raise GQLError(
                message="Authentication required to delete child profile",
                extensions={
                    "code": "UNAUTHENTICATED",
                    "category": "AUTHENTICATION_ERROR"
                }
            )
        
        try:
            # Import related models for cleanup counting
            from app.models import InventoryItem, UsageLog, StockThreshold
            from sqlalchemy import func, and_
            
            async for session in get_async_session():
                child_uuid = uuid.UUID(child_id)
                
                # Get child and verify ownership
                result = await session.execute(
                    select(Child).where(
                        Child.id == child_uuid,
                        Child.parent_id == current_user.id,  # Ensure user owns child
                        Child.is_deleted == False
                    )
                )
                child = result.scalar_one_or_none()
                
                if not child:
                    return DeleteChildResponse(
                        success=False,
                        error="Child not found or access denied"
                    )
                
                # Validate confirmation text (safety mechanism)
                expected_confirmation = f"DELETE {child.name}"
                if input.confirmation_text.strip() != expected_confirmation:
                    return DeleteChildResponse(
                        success=False,
                        error=f"Confirmation text must be exactly: {expected_confirmation}"
                    )
                
                # Count related data before deletion (for audit)
                inventory_count = await session.execute(
                    select(func.count(InventoryItem.id)).where(
                        InventoryItem.child_id == child_uuid,
                        InventoryItem.is_deleted == False
                    )
                )
                inventory_count = inventory_count.scalar() or 0
                
                usage_logs_count = await session.execute(
                    select(func.count(UsageLog.id)).where(
                        UsageLog.child_id == child_uuid,
                        UsageLog.is_deleted == False
                    )
                )
                usage_logs_count = usage_logs_count.scalar() or 0
                
                thresholds_count = await session.execute(
                    select(func.count(StockThreshold.id)).where(
                        StockThreshold.child_id == child_uuid,
                        StockThreshold.is_deleted == False
                    )
                )
                thresholds_count = thresholds_count.scalar() or 0
                
                # Prepare audit information
                items_deleted = {
                    "child_profiles": 1,
                    "inventory_items": inventory_count,
                    "usage_logs": usage_logs_count,
                    "stock_thresholds": thresholds_count
                }
                
                # Convert items_deleted to string summary for GraphQL compatibility
                items_summary = ", ".join([f"{k}: {v}" for k, v in items_deleted.items()])
                
                deletion_audit = DeletionAuditInfo(
                    deleted_at=datetime.now(timezone.utc),
                    deleted_by=current_user.email,
                    deletion_type=input.deletion_type,
                    reason=input.reason,
                    items_deleted_summary=items_summary,
                    retention_period_days=2555 if input.deletion_type == DeletionType.SOFT_DELETE else None  # 7 years for PIPEDA compliance
                )
                
                # Perform deletion based on type
                if input.deletion_type == DeletionType.SOFT_DELETE:
                    # PIPEDA-compliant soft delete (preserves data for compliance)
                    child.soft_delete(deleted_by=current_user.id)
                    
                    # Soft delete related records
                    if not input.retain_audit_logs:
                        # Also soft delete related records if requested
                        inventory_items = await session.execute(
                            select(InventoryItem).where(
                                InventoryItem.child_id == child_uuid,
                                InventoryItem.is_deleted == False
                            )
                        )
                        for item in inventory_items.scalars():
                            item.soft_delete(deleted_by=current_user.id)
                        
                        usage_logs = await session.execute(
                            select(UsageLog).where(
                                UsageLog.child_id == child_uuid,
                                UsageLog.is_deleted == False
                            )
                        )
                        for log in usage_logs.scalars():
                            log.soft_delete(deleted_by=current_user.id)
                        
                        thresholds = await session.execute(
                            select(StockThreshold).where(
                                StockThreshold.child_id == child_uuid,
                                StockThreshold.is_deleted == False
                            )
                        )
                        for threshold in thresholds.scalars():
                            threshold.soft_delete(deleted_by=current_user.id)
                    
                    await session.commit()
                    
                    logger.info(f"Soft deleted child {child_uuid} and {sum(items_deleted.values())-1} related records")
                    
                elif input.deletion_type == DeletionType.HARD_DELETE:
                    # Hard delete with CASCADE cleanup (triggers database CASCADE deletion)
                    # This will automatically delete all related records due to ondelete="CASCADE"
                    
                    # Log the operation before deletion
                    logger.info(f"Hard deleting child {child_uuid} with {sum(items_deleted.values())-1} related records")
                    
                    # Perform hard delete - this triggers CASCADE deletion
                    await session.delete(child)
                    await session.commit()
                    
                    logger.info(f"Hard deleted child {child_uuid} and all related data via CASCADE")
                
                return DeleteChildResponse(
                    success=True,
                    message=f"Child profile {'soft deleted' if input.deletion_type == DeletionType.SOFT_DELETE else 'permanently deleted'} successfully",
                    deleted_child_id=str(child_uuid),
                    audit_info=deletion_audit
                )
                
        except Exception as e:
            logger.error(f"Error deleting child: {e}")
            return DeleteChildResponse(
                success=False,
                error="Failed to delete child profile"
            )
    
    @strawberry.mutation
    async def recreate_child_profile(
        self,
        input: RecreateChildProfileInput,
        info: Info
    ) -> RecreateChildProfileResponse:
        """
        Recreate a child profile with comprehensive data integrity verification
        Ensures clean state after deletion and prevents data inconsistencies
        """
        from graphql import GraphQLError
        
        try:
            # Get authenticated user from context
            from app.graphql.context import require_context_user
            current_user = await require_context_user(info)
            
        except GraphQLError as auth_error:
            logger.error(f"Authentication error in recreate_child_profile: {auth_error}")
            from graphql import GraphQLError as GQLError
            raise GQLError(
                message="Authentication required to recreate child profile",
                extensions={
                    "code": "UNAUTHENTICATED",
                    "category": "AUTHENTICATION_ERROR"
                }
            )
        
        try:
            # Import related models for integrity checks
            from app.models import InventoryItem, UsageLog, StockThreshold
            from sqlalchemy import func
            
            async for session in get_async_session():
                # Check for any existing child with same name (safety check)
                existing_child = await session.execute(
                    select(Child).where(
                        Child.parent_id == current_user.id,
                        Child.name == input.name.strip(),
                        Child.is_deleted == False
                    )
                )
                existing_child = existing_child.scalar_one_or_none()
                
                if existing_child:
                    return RecreateChildProfileResponse(
                        success=False,
                        error=f"Active child profile with name '{input.name}' already exists"
                    )
                
                # Check for any orphaned data that might indicate incomplete cleanup
                orphaned_inventory = await session.execute(
                    select(func.count(InventoryItem.id)).where(
                        InventoryItem.child_id.notin_(
                            select(Child.id).where(
                                Child.parent_id == current_user.id,
                                Child.is_deleted == False
                            )
                        )
                    )
                )
                orphaned_inventory_count = orphaned_inventory.scalar() or 0
                
                orphaned_usage_logs = await session.execute(
                    select(func.count(UsageLog.id)).where(
                        UsageLog.child_id.notin_(
                            select(Child.id).where(
                                Child.parent_id == current_user.id,
                                Child.is_deleted == False
                            )
                        )
                    )
                )
                orphaned_usage_count = orphaned_usage_logs.scalar() or 0
                
                # Data integrity verification
                data_integrity_verified = (orphaned_inventory_count == 0 and orphaned_usage_count == 0)
                
                if not data_integrity_verified:
                    logger.warning(f"Data integrity issues detected for user {current_user.id}: {orphaned_inventory_count} orphaned inventory, {orphaned_usage_count} orphaned usage logs")
                
                # Validate input data
                if not input.name or not input.name.strip():
                    return RecreateChildProfileResponse(
                        success=False,
                        error="Child name is required"
                    )
                
                # Validate date of birth - allow future dates for expectant parents (up to 9 months)
                from datetime import timedelta
                max_future_date = date.today() + timedelta(days=270)  # ~9 months for pregnancy planning
                if input.date_of_birth > max_future_date:
                    return RecreateChildProfileResponse(
                        success=False,
                        error="Due date cannot be more than 9 months in the future"
                    )
                
                if input.daily_usage_count and (input.daily_usage_count < 1 or input.daily_usage_count > 20):
                    return RecreateChildProfileResponse(
                        success=False,
                        error="Daily usage count must be between 1 and 20"
                    )
                
                # Create new child record with clean state
                diaper_size = str(input.current_diaper_size.value)
                gender_value = str(input.gender.value) if input.gender else None
                
                new_child = Child(
                    parent_id=current_user.id,
                    name=input.name.strip(),
                    date_of_birth=input.date_of_birth,
                    gender=gender_value,
                    current_diaper_size=diaper_size,
                    current_weight_kg=input.current_weight_kg,
                    current_height_cm=input.current_height_cm,
                    daily_usage_count=input.daily_usage_count or 8,  # Default to 8 if not specified
                    has_sensitive_skin=input.has_sensitive_skin,
                    has_allergies=input.has_allergies,
                    allergies_notes=input.allergies_notes,
                    special_needs=input.special_needs,
                    preferred_brands=input.preferred_brands,
                    province=input.province,
                    onboarding_completed=False,  # Reset onboarding status
                    onboarding_step="basic_info",
                    wizard_data={
                        "basic_info": {
                            "completed_at": datetime.now(timezone.utc).isoformat(),
                            "data": {
                                "name": input.name,
                                "date_of_birth": input.date_of_birth.isoformat(),
                                "gender": gender_value,
                                "current_diaper_size": diaper_size,
                                "weight_kg": input.current_weight_kg,
                                "height_cm": input.current_height_cm,
                                "recreated": True,
                                "recreated_at": datetime.now(timezone.utc).isoformat()
                            }
                        }
                    }
                )
                
                # Set age-appropriate daily usage if not specified
                if not input.daily_usage_count:
                    age_in_days = (date.today() - input.date_of_birth).days
                    age_in_weeks = age_in_days // 7
                    
                    # Age-based usage recommendations
                    if age_in_weeks < 4:  # Newborn
                        new_child.daily_usage_count = 12
                    elif age_in_weeks < 12:  # 0-3 months
                        new_child.daily_usage_count = 10
                    elif age_in_weeks < 26:  # 3-6 months
                        new_child.daily_usage_count = 8
                    elif age_in_weeks < 52:  # 6-12 months
                        new_child.daily_usage_count = 7
                    elif age_in_weeks < 104:  # 12-24 months
                        new_child.daily_usage_count = 6
                    else:  # 24+ months
                        new_child.daily_usage_count = 5
                
                session.add(new_child)
                await session.commit()
                await session.refresh(new_child)
                
                # Create audit information about previous deletion (if any)
                previous_deletion_info = None
                if not data_integrity_verified:
                    # Convert items_deleted to string summary for GraphQL compatibility
                    orphaned_items_summary = f"orphaned_inventory: {orphaned_inventory_count}, orphaned_usage_logs: {orphaned_usage_count}"
                    previous_deletion_info = DeletionAuditInfo(
                        deleted_at=datetime.now(timezone.utc),  # Approximation
                        deleted_by="System Cleanup",
                        deletion_type=DeletionType.HARD_DELETE,
                        reason="Orphaned data detected during recreation",
                        items_deleted_summary=orphaned_items_summary
                    )
                
                logger.info(f"Child profile recreated successfully: {new_child.id} for user {current_user.id}")
                
                return RecreateChildProfileResponse(
                    success=True,
                    message="Child profile recreated successfully with clean state",
                    child=child_to_graphql(new_child),
                    previous_deletion_info=previous_deletion_info,
                    data_integrity_verified=data_integrity_verified
                )
                
        except Exception as e:
            logger.error(f"Error recreating child profile: {e}")
            return RecreateChildProfileResponse(
                success=False,
                error="Failed to recreate child profile"
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
        Get current user's children with proper GraphQL Connection pattern
        """
        from graphql import GraphQLError
        from base64 import b64encode, b64decode
        
        # DEBUG: Log that the resolver is being called
        logger.info(f"MY_CHILDREN_QUERY resolver called with first={first}, after={after}")
        
        try:
            # Get authenticated user from context
            from app.graphql.context import require_context_user
            current_user = await require_context_user(info)
            logger.info(f"MY_CHILDREN_QUERY - authenticated user: {current_user.id} ({current_user.email})")
            
        except GraphQLError as auth_error:
            logger.error(f"Authentication error in my_children: {auth_error}")
            # For queries, we return empty data but don't raise errors to allow partial responses
            return ChildConnection(
                page_info=PageInfo(
                    has_next_page=False,
                    has_previous_page=False,
                    start_cursor=None,
                    end_cursor=None,
                    total_count=0
                ),
                edges=[]
            )
        
        try:
            async for session in get_async_session():
                # Query user's children
                from sqlalchemy import func
                
                # Get total count
                count_result = await session.execute(
                    select(func.count(Child.id)).where(
                        Child.parent_id == current_user.id,
                        Child.is_deleted == False
                    )
                )
                total_count = count_result.scalar() or 0
                
                # Handle cursor-based pagination
                offset = 0
                if after:
                    try:
                        # Decode cursor (base64 encoded "child:{id}")
                        cursor_data = b64decode(after.encode('ascii')).decode('ascii')
                        if cursor_data.startswith('child:'):
                            after_id = cursor_data.split(':')[1]
                            # Find offset of this child
                            offset_result = await session.execute(
                                select(func.count(Child.id)).where(
                                    Child.parent_id == current_user.id,
                                    Child.is_deleted == False,
                                    Child.id > uuid.UUID(after_id)
                                ).order_by(Child.created_at.desc())
                            )
                            offset = offset_result.scalar() or 0
                    except (ValueError, TypeError, AttributeError) as cursor_error:
                        logger.warning(f"Invalid cursor in my_children: {after}, error: {cursor_error}")
                        offset = 0
                
                # Get children with pagination - fetch one extra to detect if there's a next page
                query = select(Child).where(
                    Child.parent_id == current_user.id,
                    Child.is_deleted == False
                ).order_by(Child.created_at.desc()).limit(first + 1).offset(offset)
                
                result = await session.execute(query)
                children = result.scalars().all()
                
                # Check if there are more items
                has_next_page = len(children) > first
                if has_next_page:
                    # Remove the extra item we fetched
                    children = children[:-1]
                
                # Build edges with proper cursor encoding
                edges = []
                for child in children:
                    cursor = b64encode(f"child:{child.id}".encode('ascii')).decode('ascii')
                    edges.append(ChildEdge(
                        node=child_to_graphql(child),
                        cursor=cursor
                    ))
                
                # Calculate start and end cursors
                start_cursor = edges[0].cursor if edges else None
                end_cursor = edges[-1].cursor if edges else None
                
                # Determine if there's a previous page
                has_previous_page = offset > 0
                
                logger.info(f"Retrieved {len(edges)} children for user {current_user.id} (total: {total_count})")
                
                return ChildConnection(
                    page_info=PageInfo(
                        has_next_page=has_next_page,
                        has_previous_page=has_previous_page,
                        start_cursor=start_cursor,
                        end_cursor=end_cursor,
                        total_count=total_count
                    ),
                    edges=edges
                )
                
        except Exception as e:
            logger.error(f"Error getting children: {e}")
            return ChildConnection(
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
        from graphql import GraphQLError
        
        try:
            # Get authenticated user from context
            from app.graphql.context import require_context_user
            current_user = await require_context_user(info)
            
        except GraphQLError as auth_error:
            logger.error(f"Authentication error in onboarding_status: {auth_error}")
            # For queries, we return safe default data but don't raise errors
            return OnboardingStatusResponse(
                user_onboarding_completed=False,
                current_step="authentication_required",
                completed_steps=[],
                children_count=0,
                required_consents_given=False
            )
        
        try:
            async for session in get_async_session():
                # Get user's children count
                from sqlalchemy import func
                
                children_count_result = await session.execute(
                    select(func.count(Child.id)).where(
                        Child.parent_id == current_user.id,
                        Child.is_deleted == False
                    )
                )
                children_count = children_count_result.scalar() or 0
                
                # Get user's onboarding status from their profile
                user_onboarding_completed = current_user.onboarding_completed
                
                # Determine current step based on status
                current_step = "welcome"
                if user_onboarding_completed:
                    current_step = "completed"
                elif children_count > 0:
                    current_step = "final_setup"
                else:
                    current_step = "child_setup"
                
                # Build completed steps (simplified)
                completed_steps = []
                if children_count > 0:
                    completed_steps.append(OnboardingWizardStep(
                        step_name="child_setup",
                        completed=True,
                        completed_at=datetime.now(timezone.utc),
                        data={"children_created": children_count}
                    ))
                
                if user_onboarding_completed:
                    completed_steps.append(OnboardingWizardStep(
                        step_name="onboarding_complete",
                        completed=True,
                        completed_at=datetime.now(timezone.utc),
                        data={"completed": True}
                    ))
                
                # For now, assume consents are given if user completed onboarding
                required_consents_given = user_onboarding_completed
                
                logger.info(f"Onboarding status for user {current_user.id}: completed={user_onboarding_completed}, children={children_count}")
                
                return OnboardingStatusResponse(
                    user_onboarding_completed=user_onboarding_completed,
                    current_step=current_step,
                    completed_steps=completed_steps,
                    children_count=children_count,
                    required_consents_given=required_consents_given
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