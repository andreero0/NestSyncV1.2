"""
GraphQL Schema for NestSync
PIPEDA-compliant Canadian diaper planning application
"""

import strawberry
from typing import Optional, List
from strawberry.types import Info

from .auth_resolvers import AuthMutations, AuthQueries
from .child_resolvers import ChildMutations, ChildQueries
from .inventory_resolvers import InventoryMutations, InventoryQueries
from .types import (
    UserProfile,
    ChildProfile, 
    OnboardingStatusResponse,
    MutationResponse,
    DashboardStats,
    InventoryConnection,
    UsageLogConnection
)


@strawberry.type
class Query:
    """Root GraphQL Query"""
    
    # Authentication queries
    me: Optional[UserProfile] = strawberry.field(resolver=AuthQueries.me)
    my_consents = strawberry.field(resolver=AuthQueries.my_consents)
    
    # Child and onboarding queries  
    my_children = strawberry.field(resolver=ChildQueries.my_children)
    child: Optional[ChildProfile] = strawberry.field(resolver=ChildQueries.child)
    onboarding_status: OnboardingStatusResponse = strawberry.field(resolver=ChildQueries.onboarding_status)
    
    # Inventory queries
    get_dashboard_stats: DashboardStats = strawberry.field(resolver=InventoryQueries.get_dashboard_stats)
    get_inventory_items: InventoryConnection = strawberry.field(resolver=InventoryQueries.get_inventory_items)
    get_usage_logs: UsageLogConnection = strawberry.field(resolver=InventoryQueries.get_usage_logs)
    
    @strawberry.field
    async def health_check(self) -> str:
        """Health check endpoint for GraphQL"""
        return "GraphQL endpoint is healthy"
    
    @strawberry.field
    async def api_info(self) -> str:
        """API information"""
        return "NestSync GraphQL API v1.0.0 - Canadian diaper planning with PIPEDA compliance"


@strawberry.type
class Mutation:
    """Root GraphQL Mutation"""
    
    # Authentication mutations
    sign_up = strawberry.field(resolver=AuthMutations.sign_up)
    sign_in = strawberry.field(resolver=AuthMutations.sign_in)
    sign_out = strawberry.field(resolver=AuthMutations.sign_out)
    reset_password = strawberry.field(resolver=AuthMutations.reset_password)
    change_password = strawberry.field(resolver=AuthMutations.change_password)
    update_profile = strawberry.field(resolver=AuthMutations.update_profile)
    update_consent = strawberry.field(resolver=AuthMutations.update_consent)
    refresh_token = strawberry.field(resolver=AuthMutations.refresh_token)
    complete_onboarding = strawberry.field(resolver=AuthMutations.complete_onboarding)
    
    # Child and onboarding mutations
    create_child = strawberry.field(resolver=ChildMutations.create_child)
    update_child = strawberry.field(resolver=ChildMutations.update_child)
    delete_child = strawberry.field(resolver=ChildMutations.delete_child)
    complete_onboarding_step = strawberry.field(resolver=ChildMutations.complete_onboarding_step)
    set_initial_inventory = strawberry.field(resolver=ChildMutations.set_initial_inventory)
    
    # Inventory mutations
    log_diaper_change = strawberry.field(resolver=InventoryMutations.log_diaper_change)
    create_inventory_item = strawberry.field(resolver=InventoryMutations.create_inventory_item)
    update_inventory_item = strawberry.field(resolver=InventoryMutations.update_inventory_item)


@strawberry.type
class Subscription:
    """Root GraphQL Subscription (for future real-time features)"""
    
    @strawberry.subscription
    async def onboarding_progress(self, info: Info) -> str:
        """Subscribe to onboarding progress updates"""
        # Placeholder for future implementation
        # Will be used for real-time onboarding step updates
        yield "Onboarding progress subscription not yet implemented"


# =============================================================================
# Create Schema
# =============================================================================

schema = strawberry.Schema(
    query=Query,
    mutation=Mutation,
    subscription=Subscription
)


# =============================================================================
# Schema Introspection Utilities
# =============================================================================

def get_schema_sdl() -> str:
    """Get GraphQL Schema Definition Language (SDL)"""
    from strawberry.printer import print_schema
    return print_schema(schema)


def print_schema():
    """Print the GraphQL schema for debugging"""
    print(get_schema_sdl())


# =============================================================================
# Export Schema
# =============================================================================

__all__ = ["schema", "get_schema_sdl", "print_schema"]