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
from .emergency_resolvers import EmergencyMutations, EmergencyQueries
from .reorder_resolvers import ReorderMutations, ReorderQueries
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
from .emergency_types import (
    EmergencyContactConnection,
    EmergencyInformationResponse,
    HealthcareProviderConnection,
    EmergencyAccessConnection,
    MedicalInformation,
    HealthCardValidationResult
)
from .reorder_types import (
    ReorderSubscriptionConnection,
    ReorderPreferencesConnection,
    ConsumptionPredictionConnection,
    RetailerConfigurationConnection,
    ProductMappingConnection,
    ReorderTransactionConnection,
    OrderStatusUpdateConnection,
    SubscriptionDashboard,
    ReorderAnalytics,
    ProductSearchResponse,
    OrderResponse,
    ReorderSuggestion,
    SubscriptionStatus
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

    # Emergency queries
    get_emergency_contacts: EmergencyContactConnection = strawberry.field(resolver=EmergencyQueries.get_emergency_contacts)
    get_medical_information: Optional[MedicalInformation] = strawberry.field(resolver=EmergencyQueries.get_medical_information)
    get_healthcare_providers: HealthcareProviderConnection = strawberry.field(resolver=EmergencyQueries.get_healthcare_providers)
    get_emergency_information: EmergencyInformationResponse = strawberry.field(resolver=EmergencyQueries.get_emergency_information)
    get_emergency_access_tokens: EmergencyAccessConnection = strawberry.field(resolver=EmergencyQueries.get_emergency_access_tokens)

    # Reorder system queries
    get_subscription_dashboard: SubscriptionDashboard = strawberry.field(resolver=ReorderQueries.get_subscription_dashboard)
    get_my_subscription: ReorderSubscriptionConnection = strawberry.field(resolver=ReorderQueries.get_my_subscription)
    get_reorder_preferences: ReorderPreferencesConnection = strawberry.field(resolver=ReorderQueries.get_reorder_preferences)
    get_consumption_predictions: ConsumptionPredictionConnection = strawberry.field(resolver=ReorderQueries.get_consumption_predictions)
    get_retailer_configurations: RetailerConfigurationConnection = strawberry.field(resolver=ReorderQueries.get_retailer_configurations)
    search_products: ProductSearchResponse = strawberry.field(resolver=ReorderQueries.search_products)
    get_order_history: ReorderTransactionConnection = strawberry.field(resolver=ReorderQueries.get_order_history)
    get_order_status_updates: OrderStatusUpdateConnection = strawberry.field(resolver=ReorderQueries.get_order_status_updates)
    get_reorder_analytics: ReorderAnalytics = strawberry.field(resolver=ReorderQueries.get_reorder_analytics)

    # New resolvers for frontend compatibility
    get_reorder_suggestions: List[ReorderSuggestion] = strawberry.field(resolver=ReorderQueries.get_reorder_suggestions)
    get_subscription_status: Optional[SubscriptionStatus] = strawberry.field(resolver=ReorderQueries.get_subscription_status)

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

    # Emergency mutations
    create_emergency_contact = strawberry.field(resolver=EmergencyMutations.create_emergency_contact)
    update_emergency_contact = strawberry.field(resolver=EmergencyMutations.update_emergency_contact)
    delete_emergency_contact = strawberry.field(resolver=EmergencyMutations.delete_emergency_contact)
    update_medical_information = strawberry.field(resolver=EmergencyMutations.update_medical_information)
    create_healthcare_provider = strawberry.field(resolver=EmergencyMutations.create_healthcare_provider)
    update_healthcare_provider = strawberry.field(resolver=EmergencyMutations.update_healthcare_provider)
    delete_healthcare_provider = strawberry.field(resolver=EmergencyMutations.delete_healthcare_provider)
    generate_emergency_access_token = strawberry.field(resolver=EmergencyMutations.generate_emergency_access_token)
    revoke_emergency_access_token = strawberry.field(resolver=EmergencyMutations.revoke_emergency_access_token)
    validate_health_card = strawberry.field(resolver=EmergencyMutations.validate_health_card)

    # Reorder system mutations
    create_subscription = strawberry.field(resolver=ReorderMutations.create_subscription)
    update_subscription = strawberry.field(resolver=ReorderMutations.update_subscription)
    cancel_subscription = strawberry.field(resolver=ReorderMutations.cancel_subscription)
    create_reorder_preferences = strawberry.field(resolver=ReorderMutations.create_reorder_preferences)
    update_reorder_preferences = strawberry.field(resolver=ReorderMutations.update_reorder_preferences)
    create_retailer_config = strawberry.field(resolver=ReorderMutations.create_retailer_config)
    update_retailer_config = strawberry.field(resolver=ReorderMutations.update_retailer_config)
    delete_retailer_config = strawberry.field(resolver=ReorderMutations.delete_retailer_config)
    create_manual_order = strawberry.field(resolver=ReorderMutations.create_manual_order)
    cancel_order = strawberry.field(resolver=ReorderMutations.cancel_order)
    trigger_prediction_update = strawberry.field(resolver=ReorderMutations.trigger_prediction_update)

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

    # Reorder system subscriptions
    order_status_updates = strawberry.field(resolver=ReorderQueries.order_status_subscription)
    prediction_updates = strawberry.field(resolver=ReorderQueries.prediction_updates_subscription)
    subscription_billing_events = strawberry.field(resolver=ReorderQueries.subscription_billing_events)


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