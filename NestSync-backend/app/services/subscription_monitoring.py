"""
Subscription Event Monitoring Service
Tracks and alerts on critical subscription system events
Integrates with NestSync observability infrastructure
"""

import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from enum import Enum

logger = logging.getLogger(__name__)


class SubscriptionEventType(str, Enum):
    """Types of subscription events to monitor"""
    TRIAL_STARTED = "trial_started"
    TRIAL_CONVERTED = "trial_converted"
    TRIAL_EXPIRED = "trial_expired"
    SUBSCRIPTION_CREATED = "subscription_created"
    SUBSCRIPTION_UPGRADED = "subscription_upgraded"
    SUBSCRIPTION_DOWNGRADED = "subscription_downgraded"
    SUBSCRIPTION_CANCELED = "subscription_canceled"
    SUBSCRIPTION_RENEWED = "subscription_renewed"
    PAYMENT_SUCCEEDED = "payment_succeeded"
    PAYMENT_FAILED = "payment_failed"
    REFUND_REQUESTED = "refund_requested"
    REFUND_PROCESSED = "refund_processed"
    TAX_CALCULATION_ERROR = "tax_calculation_error"
    FEATURE_ACCESS_VIOLATION = "feature_access_violation"
    COOLING_OFF_REFUND = "cooling_off_refund"


class SubscriptionEventSeverity(str, Enum):
    """Event severity levels"""
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


class SubscriptionMonitoringService:
    """
    Service for monitoring and alerting on subscription events
    Integrates with existing NestSync observability infrastructure
    """

    def __init__(self):
        """Initialize subscription monitoring service"""
        self.logger = logging.getLogger(__name__)
        self.metrics: Dict[str, int] = {}
        self._initialize_metrics()

    def _initialize_metrics(self):
        """Initialize metric counters"""
        for event_type in SubscriptionEventType:
            self.metrics[event_type.value] = 0

    def track_event(
        self,
        event_type: SubscriptionEventType,
        user_id: str,
        metadata: Optional[Dict[str, Any]] = None,
        severity: SubscriptionEventSeverity = SubscriptionEventSeverity.INFO
    ) -> None:
        """
        Track a subscription event

        Args:
            event_type: Type of subscription event
            user_id: User ID associated with event
            metadata: Additional event metadata
            severity: Event severity level
        """
        timestamp = datetime.now(timezone.utc)

        # Increment metric counter
        self.metrics[event_type.value] = self.metrics.get(event_type.value, 0) + 1

        # Log event
        log_data = {
            "event_type": event_type.value,
            "user_id": user_id,
            "timestamp": timestamp.isoformat(),
            "severity": severity.value,
            "metadata": metadata or {}
        }

        log_method = self._get_log_method(severity)
        log_method(
            f"Subscription Event: {event_type.value}",
            extra={"event_data": log_data}
        )

        # Check for alert conditions
        self._check_alert_conditions(event_type, metadata, severity)

    def _get_log_method(self, severity: SubscriptionEventSeverity):
        """Get appropriate logging method for severity"""
        mapping = {
            SubscriptionEventSeverity.INFO: self.logger.info,
            SubscriptionEventSeverity.WARNING: self.logger.warning,
            SubscriptionEventSeverity.ERROR: self.logger.error,
            SubscriptionEventSeverity.CRITICAL: self.logger.critical
        }
        return mapping.get(severity, self.logger.info)

    def _check_alert_conditions(
        self,
        event_type: SubscriptionEventType,
        metadata: Optional[Dict[str, Any]],
        severity: SubscriptionEventSeverity
    ) -> None:
        """
        Check if event triggers alert conditions

        Args:
            event_type: Type of subscription event
            metadata: Event metadata
            severity: Event severity
        """
        # Alert on high-severity events
        if severity in [SubscriptionEventSeverity.ERROR, SubscriptionEventSeverity.CRITICAL]:
            self._send_alert(event_type, metadata, severity)

        # Alert on payment failures
        if event_type == SubscriptionEventType.PAYMENT_FAILED:
            self._send_alert(
                event_type,
                metadata,
                SubscriptionEventSeverity.ERROR,
                message="Payment failure detected - requires immediate attention"
            )

        # Alert on tax calculation errors
        if event_type == SubscriptionEventType.TAX_CALCULATION_ERROR:
            self._send_alert(
                event_type,
                metadata,
                SubscriptionEventSeverity.ERROR,
                message="Canadian tax calculation failed - compliance risk"
            )

        # Alert on feature access violations
        if event_type == SubscriptionEventType.FEATURE_ACCESS_VIOLATION:
            self._send_alert(
                event_type,
                metadata,
                SubscriptionEventSeverity.WARNING,
                message="Unauthorized feature access attempt detected"
            )

        # Monitor conversion rate
        if event_type == SubscriptionEventType.TRIAL_CONVERTED:
            conversion_rate = self._calculate_conversion_rate()
            if conversion_rate < 0.1:  # Less than 10%
                self._send_alert(
                    event_type,
                    {"conversion_rate": conversion_rate},
                    SubscriptionEventSeverity.WARNING,
                    message=f"Low trial conversion rate: {conversion_rate:.1%}"
                )

    def _send_alert(
        self,
        event_type: SubscriptionEventType,
        metadata: Optional[Dict[str, Any]],
        severity: SubscriptionEventSeverity,
        message: Optional[str] = None
    ) -> None:
        """
        Send alert for subscription event

        Args:
            event_type: Type of subscription event
            metadata: Event metadata
            severity: Alert severity
            message: Custom alert message
        """
        alert_data = {
            "alert_type": "subscription_event",
            "event_type": event_type.value,
            "severity": severity.value,
            "message": message or f"Subscription event: {event_type.value}",
            "metadata": metadata or {},
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

        # Log alert
        self.logger.warning(
            f"🚨 SUBSCRIPTION ALERT [{severity.value.upper()}]: {alert_data['message']}",
            extra={"alert_data": alert_data}
        )

        # In production, this would integrate with:
        # - PagerDuty for critical alerts
        # - Slack notifications for warnings
        # - Email notifications for errors
        # - Metrics dashboard updates

    def _calculate_conversion_rate(self) -> float:
        """Calculate trial-to-paid conversion rate"""
        trial_starts = self.metrics.get(SubscriptionEventType.TRIAL_STARTED.value, 0)
        conversions = self.metrics.get(SubscriptionEventType.TRIAL_CONVERTED.value, 0)

        if trial_starts == 0:
            return 0.0

        return conversions / trial_starts

    def get_metrics_summary(self) -> Dict[str, Any]:
        """
        Get summary of subscription metrics

        Returns:
            Dictionary containing metric summaries
        """
        trial_starts = self.metrics.get(SubscriptionEventType.TRIAL_STARTED.value, 0)
        trial_conversions = self.metrics.get(SubscriptionEventType.TRIAL_CONVERTED.value, 0)
        trial_expirations = self.metrics.get(SubscriptionEventType.TRIAL_EXPIRED.value, 0)

        subscription_created = self.metrics.get(SubscriptionEventType.SUBSCRIPTION_CREATED.value, 0)
        subscription_canceled = self.metrics.get(SubscriptionEventType.SUBSCRIPTION_CANCELED.value, 0)

        payment_succeeded = self.metrics.get(SubscriptionEventType.PAYMENT_SUCCEEDED.value, 0)
        payment_failed = self.metrics.get(SubscriptionEventType.PAYMENT_FAILED.value, 0)

        refund_requested = self.metrics.get(SubscriptionEventType.REFUND_REQUESTED.value, 0)
        refund_processed = self.metrics.get(SubscriptionEventType.REFUND_PROCESSED.value, 0)

        return {
            "trial_metrics": {
                "starts": trial_starts,
                "conversions": trial_conversions,
                "expirations": trial_expirations,
                "conversion_rate": self._calculate_conversion_rate()
            },
            "subscription_metrics": {
                "created": subscription_created,
                "canceled": subscription_canceled,
                "churn_rate": subscription_canceled / subscription_created if subscription_created > 0 else 0
            },
            "payment_metrics": {
                "succeeded": payment_succeeded,
                "failed": payment_failed,
                "failure_rate": payment_failed / (payment_succeeded + payment_failed) if (payment_succeeded + payment_failed) > 0 else 0
            },
            "refund_metrics": {
                "requested": refund_requested,
                "processed": refund_processed,
                "fulfillment_rate": refund_processed / refund_requested if refund_requested > 0 else 0
            },
            "error_counts": {
                "tax_calculation_errors": self.metrics.get(SubscriptionEventType.TAX_CALCULATION_ERROR.value, 0),
                "feature_access_violations": self.metrics.get(SubscriptionEventType.FEATURE_ACCESS_VIOLATION.value, 0)
            }
        }

    def get_health_status(self) -> Dict[str, Any]:
        """
        Get health status of subscription system

        Returns:
            Dictionary containing health status
        """
        metrics = self.get_metrics_summary()

        # Check for unhealthy conditions
        issues = []

        if metrics["payment_metrics"]["failure_rate"] > 0.05:  # >5% failure rate
            issues.append({
                "type": "high_payment_failure_rate",
                "severity": "warning",
                "value": metrics["payment_metrics"]["failure_rate"],
                "message": "Payment failure rate exceeds 5%"
            })

        if metrics["trial_metrics"]["conversion_rate"] < 0.1:  # <10% conversion
            issues.append({
                "type": "low_trial_conversion",
                "severity": "warning",
                "value": metrics["trial_metrics"]["conversion_rate"],
                "message": "Trial conversion rate below 10%"
            })

        if metrics["error_counts"]["tax_calculation_errors"] > 0:
            issues.append({
                "type": "tax_calculation_errors",
                "severity": "error",
                "value": metrics["error_counts"]["tax_calculation_errors"],
                "message": "Canadian tax calculation errors detected"
            })

        health_status = "healthy" if len(issues) == 0 else "degraded"

        return {
            "status": health_status,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "metrics": metrics,
            "issues": issues
        }

    def track_trial_started(self, user_id: str, tier: str) -> None:
        """Track trial activation event"""
        self.track_event(
            SubscriptionEventType.TRIAL_STARTED,
            user_id,
            metadata={"tier": tier},
            severity=SubscriptionEventSeverity.INFO
        )

    def track_trial_converted(self, user_id: str, from_tier: str, to_plan: str) -> None:
        """Track successful trial-to-paid conversion"""
        self.track_event(
            SubscriptionEventType.TRIAL_CONVERTED,
            user_id,
            metadata={"from_tier": from_tier, "to_plan": to_plan},
            severity=SubscriptionEventSeverity.INFO
        )

    def track_trial_expired(self, user_id: str, tier: str) -> None:
        """Track trial expiration without conversion"""
        self.track_event(
            SubscriptionEventType.TRIAL_EXPIRED,
            user_id,
            metadata={"tier": tier},
            severity=SubscriptionEventSeverity.INFO
        )

    def track_subscription_created(self, user_id: str, plan_id: str, amount: float, province: str) -> None:
        """Track new subscription creation"""
        self.track_event(
            SubscriptionEventType.SUBSCRIPTION_CREATED,
            user_id,
            metadata={"plan_id": plan_id, "amount": amount, "province": province},
            severity=SubscriptionEventSeverity.INFO
        )

    def track_subscription_canceled(self, user_id: str, plan_id: str, reason: Optional[str] = None) -> None:
        """Track subscription cancellation"""
        self.track_event(
            SubscriptionEventType.SUBSCRIPTION_CANCELED,
            user_id,
            metadata={"plan_id": plan_id, "reason": reason},
            severity=SubscriptionEventSeverity.WARNING
        )

    def track_payment_succeeded(self, user_id: str, amount: float, subscription_id: str) -> None:
        """Track successful payment"""
        self.track_event(
            SubscriptionEventType.PAYMENT_SUCCEEDED,
            user_id,
            metadata={"amount": amount, "subscription_id": subscription_id},
            severity=SubscriptionEventSeverity.INFO
        )

    def track_payment_failed(self, user_id: str, amount: float, error: str) -> None:
        """Track failed payment - triggers alert"""
        self.track_event(
            SubscriptionEventType.PAYMENT_FAILED,
            user_id,
            metadata={"amount": amount, "error": error},
            severity=SubscriptionEventSeverity.ERROR
        )

    def track_refund_requested(self, user_id: str, amount: float, reason: str) -> None:
        """Track refund request"""
        self.track_event(
            SubscriptionEventType.REFUND_REQUESTED,
            user_id,
            metadata={"amount": amount, "reason": reason},
            severity=SubscriptionEventSeverity.WARNING
        )

    def track_refund_processed(self, user_id: str, amount: float) -> None:
        """Track processed refund"""
        self.track_event(
            SubscriptionEventType.REFUND_PROCESSED,
            user_id,
            metadata={"amount": amount},
            severity=SubscriptionEventSeverity.INFO
        )

    def track_tax_calculation_error(self, province: str, amount: float, error: str) -> None:
        """Track Canadian tax calculation error - triggers alert"""
        self.track_event(
            SubscriptionEventType.TAX_CALCULATION_ERROR,
            "system",
            metadata={"province": province, "amount": amount, "error": error},
            severity=SubscriptionEventSeverity.ERROR
        )

    def track_feature_access_violation(self, user_id: str, feature_id: str, required_tier: str) -> None:
        """Track unauthorized feature access attempt"""
        self.track_event(
            SubscriptionEventType.FEATURE_ACCESS_VIOLATION,
            user_id,
            metadata={"feature_id": feature_id, "required_tier": required_tier},
            severity=SubscriptionEventSeverity.WARNING
        )


# Global subscription monitoring instance
_subscription_monitor = None


def get_subscription_monitor() -> SubscriptionMonitoringService:
    """Get global subscription monitoring service instance"""
    global _subscription_monitor
    if _subscription_monitor is None:
        _subscription_monitor = SubscriptionMonitoringService()
        logger.info("📊 Subscription monitoring service initialized")
    return _subscription_monitor
