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
from .notification_resolvers import NotificationMutations, NotificationQueries
from .analytics_resolvers import AnalyticsQueries
from .collaboration_resolvers import CollaborationMutations, CollaborationQueries
# from .observability_resolvers import ObservabilityQuery, ObservabilityMutation  # Temporarily disabled for testing
from .types import (
    UserProfile,
    ChildProfile,
    ChildConnection,
    OnboardingStatusResponse,
    MutationResponse,
    DashboardStats,
    InventoryConnection,
    UsageLogConnection,
    NotificationPreferences,
    NotificationQueueConnection,
    NotificationDeliveryLogConnection
)
from .analytics_types import (
    UsageAnalyticsResponse,
    WeeklyTrendsResponse,
    DailySummaryResponse,
    UsagePatternsResponse,
    InventoryInsightsResponse,
    AnalyticsDashboardResponse,
    EnhancedAnalyticsDashboardResponse
)
from .collaboration_types import (
    FamilyConnection,
    FamilyMemberConnection,
    CaregiverInvitationConnection,
    Family as FamilyType,
    CaregiverPresence
)


@strawberry.type
class Query:
    """Root GraphQL Query"""
    
    # Authentication queries
    me: Optional[UserProfile] = strawberry.field(resolver=AuthQueries.me)
    my_consents = strawberry.field(resolver=AuthQueries.my_consents)
    
    # Child and onboarding queries
    my_children: ChildConnection = strawberry.field(resolver=ChildQueries.my_children)
    child: Optional[ChildProfile] = strawberry.field(resolver=ChildQueries.child)
    onboarding_status: OnboardingStatusResponse = strawberry.field(resolver=ChildQueries.onboarding_status)
    
    # Inventory queries
    get_dashboard_stats: DashboardStats = strawberry.field(resolver=InventoryQueries.get_dashboard_stats)
    get_inventory_items: InventoryConnection = strawberry.field(resolver=InventoryQueries.get_inventory_items)
    get_usage_logs: UsageLogConnection = strawberry.field(resolver=InventoryQueries.get_usage_logs)

    # Notification queries
    get_notification_preferences: Optional[NotificationPreferences] = strawberry.field(resolver=NotificationQueries.get_notification_preferences)
    get_notification_history: NotificationDeliveryLogConnection = strawberry.field(resolver=NotificationQueries.get_notification_history)
    get_pending_notifications: NotificationQueueConnection = strawberry.field(resolver=NotificationQueries.get_pending_notifications)

    # Analytics queries
    get_usage_analytics: UsageAnalyticsResponse = strawberry.field(resolver=AnalyticsQueries.get_usage_analytics)
    get_weekly_trends: WeeklyTrendsResponse = strawberry.field(resolver=AnalyticsQueries.get_weekly_trends)
    get_daily_summary: DailySummaryResponse = strawberry.field(resolver=AnalyticsQueries.get_daily_summary)
    get_usage_patterns: UsagePatternsResponse = strawberry.field(resolver=AnalyticsQueries.get_usage_patterns)
    get_inventory_insights: InventoryInsightsResponse = strawberry.field(resolver=AnalyticsQueries.get_inventory_insights)
    get_analytics_dashboard: AnalyticsDashboardResponse = strawberry.field(resolver=AnalyticsQueries.get_analytics_dashboard)
    get_enhanced_analytics_dashboard: EnhancedAnalyticsDashboardResponse = strawberry.field(resolver=AnalyticsQueries.get_enhanced_analytics_dashboard)

    # Collaboration queries
    my_families: FamilyConnection = strawberry.field(resolver=CollaborationQueries.my_families)
    family_details: Optional[FamilyType] = strawberry.field(resolver=CollaborationQueries.family_details)
    family_members: FamilyMemberConnection = strawberry.field(resolver=CollaborationQueries.family_members)
    pending_invitations: CaregiverInvitationConnection = strawberry.field(resolver=CollaborationQueries.pending_invitations)
    family_presence: List[CaregiverPresence] = strawberry.field(resolver=CollaborationQueries.family_presence)

    # Observability queries - Real-time system monitoring
    # Temporarily disabled for testing
    # monitoring_dashboard = strawberry.field(resolver=ObservabilityQuery.monitoring_dashboard)
    # system_health_summary = strawberry.field(resolver=ObservabilityQuery.system_health_summary)
    # active_alerts = strawberry.field(resolver=ObservabilityQuery.active_alerts)
    # health_checks_by_category = strawberry.field(resolver=ObservabilityQuery.health_checks_by_category)
    # performance_metrics = strawberry.field(resolver=ObservabilityQuery.performance_metrics)

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
    recreate_child_profile = strawberry.field(resolver=ChildMutations.recreate_child_profile)
    complete_onboarding_step = strawberry.field(resolver=ChildMutations.complete_onboarding_step)
    set_initial_inventory = strawberry.field(resolver=ChildMutations.set_initial_inventory)
    
    # Inventory mutations
    log_diaper_change = strawberry.field(resolver=InventoryMutations.log_diaper_change)
    create_inventory_item = strawberry.field(resolver=InventoryMutations.create_inventory_item)
    update_inventory_item = strawberry.field(resolver=InventoryMutations.update_inventory_item)
    delete_inventory_item = strawberry.field(resolver=InventoryMutations.delete_inventory_item)

    # Notification mutations
    update_notification_preferences = strawberry.field(resolver=NotificationMutations.update_notification_preferences)
    register_device_token = strawberry.field(resolver=NotificationMutations.register_device_token)
    create_notification = strawberry.field(resolver=NotificationMutations.create_notification)
    mark_notification_read = strawberry.field(resolver=NotificationMutations.mark_notification_read)
    test_notification = strawberry.field(resolver=NotificationMutations.test_notification)

    # Collaboration mutations
    create_family = strawberry.field(resolver=CollaborationMutations.create_family)
    invite_caregiver = strawberry.field(resolver=CollaborationMutations.invite_caregiver)
    accept_invitation = strawberry.field(resolver=CollaborationMutations.accept_invitation)
    add_child_to_family = strawberry.field(resolver=CollaborationMutations.add_child_to_family)
    update_presence = strawberry.field(resolver=CollaborationMutations.update_presence)
    log_family_activity = strawberry.field(resolver=CollaborationMutations.log_family_activity)

    # Observability mutations - System monitoring control
    # Temporarily disabled for testing
    # run_health_check = strawberry.field(resolver=ObservabilityMutation.run_health_check)
    # resolve_alert = strawberry.field(resolver=ObservabilityMutation.resolve_alert)
    # enable_monitoring = strawberry.field(resolver=ObservabilityMutation.enable_monitoring)


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