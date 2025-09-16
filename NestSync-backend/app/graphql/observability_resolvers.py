"""
GraphQL resolvers for observability and monitoring system
"""

import logging
import strawberry
from typing import List, Optional
from datetime import datetime, timedelta

from app.graphql.observability_types import (
    MonitoringDashboardType,
    SystemHealthSummaryType,
    HealthCheckType,
    SystemAlertType,
    HealthMetricType,
    CategoryHealthType,
    AlertSummaryType,
    ResolveAlertInput,
    ResolveAlertResponse,
    AlertSeverityType
)
from app.services.observability_service import get_observability_service, AlertSeverity
from app.graphql.context import Info


logger = logging.getLogger(__name__)


@strawberry.type
class ObservabilityQuery:
    """Observability and monitoring queries"""

    @strawberry.field
    async def monitoring_dashboard(self, info: Info) -> MonitoringDashboardType:
        """
        Get comprehensive monitoring dashboard data
        Provides real-time system health, alerts, and compliance status
        """
        try:
            observability = await get_observability_service()

            # Run comprehensive health check
            recent_checks = await observability.run_comprehensive_health_check()

            # Get health summary
            health_summary_data = observability.get_health_summary()

            # Convert categories dict to list
            categories = []
            for cat_name, cat_data in health_summary_data.get("categories", {}).items():
                categories.append(CategoryHealthType(
                    category=cat_name,
                    total_checks=cat_data["total"],
                    healthy_checks=cat_data["healthy"],
                    health_percentage=cat_data["health_percentage"]
                ))

            # Convert alert summary
            alert_data = health_summary_data.get("active_alerts", {})
            alert_summary = AlertSummaryType(
                critical=alert_data.get("CRITICAL", 0),
                high=alert_data.get("HIGH", 0),
                medium=alert_data.get("MEDIUM", 0),
                low=alert_data.get("LOW", 0),
                info=alert_data.get("INFO", 0)
            )

            health_summary = SystemHealthSummaryType(
                status=health_summary_data["status"],
                overall_health_percentage=health_summary_data["overall_health_percentage"],
                total_checks=health_summary_data["total_checks"],
                healthy_checks=health_summary_data["healthy_checks"],
                categories=categories,
                active_alerts=alert_summary,
                last_check=datetime.fromisoformat(health_summary_data["last_check"]) if health_summary_data.get("last_check") else None,
                monitoring_enabled=health_summary_data["monitoring_enabled"]
            )

            # Get active alerts
            active_alerts = [
                SystemAlertType.from_system_alert(alert)
                for alert in observability.get_active_alerts()
            ]

            # Get recent health checks (last 10)
            recent_check_types = [
                HealthCheckType.from_health_check(check)
                for check in recent_checks[-10:]
            ]

            # Get performance metrics from recent checks
            performance_metrics = []
            for check in recent_checks[-5:]:
                for metric in check.metrics:
                    if "time" in metric.name or "usage" in metric.name or "rate" in metric.name:
                        performance_metrics.append(HealthMetricType.from_health_metric(metric))

            # Get compliance status (Canadian/PIPEDA checks)
            compliance_checks = [
                check for check in recent_checks
                if check.category == "Compliance"
            ]
            compliance_status = [
                HealthCheckType.from_health_check(check)
                for check in compliance_checks[-5:]  # Last 5 compliance checks
            ]

            return MonitoringDashboardType(
                health_summary=health_summary,
                recent_checks=recent_check_types,
                active_alerts=active_alerts,
                performance_metrics=performance_metrics[-10:],  # Last 10 performance metrics
                compliance_status=compliance_status
            )

        except Exception as e:
            logger.error(f"Error getting monitoring dashboard: {e}")
            raise

    @strawberry.field
    async def system_health_summary(self, info: Info) -> SystemHealthSummaryType:
        """
        Get quick system health summary
        Fast endpoint for health status checks
        """
        try:
            observability = await get_observability_service()
            health_summary_data = observability.get_health_summary()

            # Convert categories dict to list
            categories = []
            for cat_name, cat_data in health_summary_data.get("categories", {}).items():
                categories.append(CategoryHealthType(
                    category=cat_name,
                    total_checks=cat_data["total"],
                    healthy_checks=cat_data["healthy"],
                    health_percentage=cat_data["health_percentage"]
                ))

            # Convert alert summary
            alert_data = health_summary_data.get("active_alerts", {})
            alert_summary = AlertSummaryType(
                critical=alert_data.get("CRITICAL", 0),
                high=alert_data.get("HIGH", 0),
                medium=alert_data.get("MEDIUM", 0),
                low=alert_data.get("LOW", 0),
                info=alert_data.get("INFO", 0)
            )

            return SystemHealthSummaryType(
                status=health_summary_data["status"],
                overall_health_percentage=health_summary_data["overall_health_percentage"],
                total_checks=health_summary_data["total_checks"],
                healthy_checks=health_summary_data["healthy_checks"],
                categories=categories,
                active_alerts=alert_summary,
                last_check=datetime.fromisoformat(health_summary_data["last_check"]) if health_summary_data.get("last_check") else None,
                monitoring_enabled=health_summary_data["monitoring_enabled"]
            )

        except Exception as e:
            logger.error(f"Error getting system health summary: {e}")
            raise

    @strawberry.field
    async def active_alerts(self, info: Info, severity: Optional[AlertSeverityType] = None) -> List[SystemAlertType]:
        """
        Get active system alerts, optionally filtered by severity
        """
        try:
            observability = await get_observability_service()
            alerts = observability.get_active_alerts()

            if severity:
                alerts = [
                    alert for alert in alerts
                    if alert.severity.value == severity.value
                ]

            return [SystemAlertType.from_system_alert(alert) for alert in alerts]

        except Exception as e:
            logger.error(f"Error getting active alerts: {e}")
            raise

    @strawberry.field
    async def health_checks_by_category(self, info: Info, category: str, limit: int = 10) -> List[HealthCheckType]:
        """
        Get recent health checks for a specific category
        """
        try:
            observability = await get_observability_service()

            # Filter health history by category
            category_checks = [
                check for check in observability.health_history
                if check.category.lower() == category.lower()
            ]

            # Return most recent checks
            recent_checks = category_checks[-limit:] if len(category_checks) > limit else category_checks

            return [HealthCheckType.from_health_check(check) for check in recent_checks]

        except Exception as e:
            logger.error(f"Error getting health checks by category: {e}")
            raise

    @strawberry.field
    async def performance_metrics(self, info: Info, hours: int = 24) -> List[HealthMetricType]:
        """
        Get performance metrics from the last N hours
        """
        try:
            observability = await get_observability_service()

            # Filter health history by time
            since = datetime.utcnow() - timedelta(hours=hours)
            recent_checks = [
                check for check in observability.health_history
                if check.checked_at >= since
            ]

            # Extract performance metrics
            performance_metrics = []
            for check in recent_checks:
                for metric in check.metrics:
                    if any(perf_keyword in metric.name for perf_keyword in [
                        "time", "usage", "rate", "latency", "response", "performance"
                    ]):
                        performance_metrics.append(HealthMetricType.from_health_metric(metric))

            return performance_metrics

        except Exception as e:
            logger.error(f"Error getting performance metrics: {e}")
            raise


@strawberry.type
class ObservabilityMutation:
    """Observability and monitoring mutations"""

    @strawberry.mutation
    async def run_health_check(self, info: Info) -> List[HealthCheckType]:
        """
        Manually trigger a comprehensive health check
        """
        try:
            observability = await get_observability_service()
            health_checks = await observability.run_comprehensive_health_check()

            return [HealthCheckType.from_health_check(check) for check in health_checks]

        except Exception as e:
            logger.error(f"Error running health check: {e}")
            raise

    @strawberry.mutation
    async def resolve_alert(self, info: Info, input: ResolveAlertInput) -> ResolveAlertResponse:
        """
        Manually resolve an active alert
        """
        try:
            observability = await get_observability_service()

            # Get the alert before resolving
            alert = observability.active_alerts.get(input.alert_id)

            success = await observability.resolve_alert(input.alert_id)

            if success and alert:
                return ResolveAlertResponse(
                    success=True,
                    message=f"Alert {input.alert_id} resolved successfully",
                    resolved_alert=SystemAlertType.from_system_alert(alert)
                )
            elif success:
                return ResolveAlertResponse(
                    success=True,
                    message=f"Alert {input.alert_id} resolved successfully"
                )
            else:
                return ResolveAlertResponse(
                    success=False,
                    message=f"Alert {input.alert_id} not found or already resolved"
                )

        except Exception as e:
            logger.error(f"Error resolving alert: {e}")
            return ResolveAlertResponse(
                success=False,
                message=f"Error resolving alert: {str(e)}"
            )

    @strawberry.mutation
    async def enable_monitoring(self, info: Info, enabled: bool) -> bool:
        """
        Enable or disable monitoring system
        """
        try:
            observability = await get_observability_service()
            observability.monitoring_enabled = enabled

            logger.info(f"Monitoring {'enabled' if enabled else 'disabled'}")
            return enabled

        except Exception as e:
            logger.error(f"Error toggling monitoring: {e}")
            raise