"""
GraphQL types for observability and monitoring system
"""

import strawberry
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

from app.services.observability_service import AlertSeverity, HealthMetric, HealthCheck, SystemAlert


@strawberry.enum
class AlertSeverityType(Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    INFO = "INFO"


@strawberry.type
class HealthMetricType:
    """Individual health metric measurement"""
    name: str
    value: str  # Convert to string for GraphQL compatibility
    unit: str
    healthy: bool
    threshold: Optional[str] = None
    measured_at: datetime

    @classmethod
    def from_health_metric(cls, metric: HealthMetric) -> "HealthMetricType":
        return cls(
            name=metric.name,
            value=str(metric.value),
            unit=metric.unit,
            healthy=metric.healthy,
            threshold=str(metric.threshold) if metric.threshold is not None else None,
            measured_at=metric.measured_at
        )


@strawberry.type
class HealthCheckType:
    """Complete health check result"""
    check_id: str
    check_name: str
    category: str
    status: bool
    metrics: List[HealthMetricType]
    error_message: Optional[str] = None
    remediation_steps: Optional[List[str]] = None
    severity: AlertSeverityType
    checked_at: datetime

    @classmethod
    def from_health_check(cls, check: HealthCheck) -> "HealthCheckType":
        return cls(
            check_id=check.check_id,
            check_name=check.check_name,
            category=check.category,
            status=check.status,
            metrics=[HealthMetricType.from_health_metric(m) for m in check.metrics],
            error_message=check.error_message,
            remediation_steps=check.remediation_steps,
            severity=AlertSeverityType(check.severity.value),
            checked_at=check.checked_at
        )


@strawberry.type
class SystemAlertType:
    """System alert for immediate notification"""
    alert_id: str
    alert_type: str
    severity: AlertSeverityType
    title: str
    description: str
    affected_components: List[str]
    remediation_steps: List[str]
    created_at: datetime
    resolved_at: Optional[datetime] = None

    @classmethod
    def from_system_alert(cls, alert: SystemAlert) -> "SystemAlertType":
        return cls(
            alert_id=alert.alert_id,
            alert_type=alert.alert_type,
            severity=AlertSeverityType(alert.severity.value),
            title=alert.title,
            description=alert.description,
            affected_components=alert.affected_components,
            remediation_steps=alert.remediation_steps,
            created_at=alert.created_at,
            resolved_at=alert.resolved_at
        )


@strawberry.type
class CategoryHealthType:
    """Health summary for a specific category"""
    category: str
    total_checks: int
    healthy_checks: int
    health_percentage: float


@strawberry.type
class AlertSummaryType:
    """Summary of alerts by severity"""
    critical: int
    high: int
    medium: int
    low: int
    info: int


@strawberry.type
class SystemHealthSummaryType:
    """Comprehensive system health summary"""
    status: str  # healthy, degraded, unhealthy
    overall_health_percentage: float
    total_checks: int
    healthy_checks: int
    categories: List[CategoryHealthType]
    active_alerts: AlertSummaryType
    last_check: Optional[datetime] = None
    monitoring_enabled: bool


@strawberry.type
class MonitoringDashboardType:
    """Complete monitoring dashboard data"""
    health_summary: SystemHealthSummaryType
    recent_checks: List[HealthCheckType]
    active_alerts: List[SystemAlertType]
    performance_metrics: List[HealthMetricType]
    compliance_status: List[HealthCheckType]


@strawberry.input
class ResolveAlertInput:
    """Input for resolving an alert"""
    alert_id: str
    resolution_notes: Optional[str] = None


@strawberry.type
class ResolveAlertResponse:
    """Response for alert resolution"""
    success: bool
    message: str
    resolved_alert: Optional[SystemAlertType] = None