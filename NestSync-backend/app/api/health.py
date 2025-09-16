"""
FastAPI Health and Monitoring Endpoints
Provides REST API access to observability system
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import Dict, Any, List, Optional
from datetime import datetime
import logging

from app.services.observability_service import get_observability_service
from app.services.continuous_monitoring import continuous_monitoring


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/health", tags=["health", "monitoring"])


@router.get("/")
async def basic_health_check() -> Dict[str, Any]:
    """
    Basic health check endpoint
    Fast response for load balancers and uptime monitoring
    """
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "NestSync API",
        "version": "1.0.0"
    }


@router.get("/detailed")
async def detailed_health_check() -> Dict[str, Any]:
    """
    Detailed health check with system status
    Includes observability system health summary
    """
    try:
        observability = await get_observability_service()
        health_summary = observability.get_health_summary()

        return {
            "status": health_summary["status"],
            "timestamp": datetime.utcnow().isoformat(),
            "health_percentage": health_summary["overall_health_percentage"],
            "total_checks": health_summary["total_checks"],
            "healthy_checks": health_summary["healthy_checks"],
            "categories": health_summary["categories"],
            "active_alerts": health_summary["active_alerts"],
            "last_check": health_summary.get("last_check"),
            "monitoring_enabled": health_summary["monitoring_enabled"]
        }

    except Exception as e:
        logger.error(f"Detailed health check failed: {e}")
        raise HTTPException(status_code=503, detail=f"Health check failed: {str(e)}")


@router.post("/check")
async def trigger_health_check(background_tasks: BackgroundTasks) -> Dict[str, str]:
    """
    Manually trigger a comprehensive health check
    Runs in background to avoid timeout issues
    """
    try:
        # Run health check in background
        async def run_check():
            observability = await get_observability_service()
            await observability.run_comprehensive_health_check()

        background_tasks.add_task(run_check)

        return {
            "status": "initiated",
            "message": "Comprehensive health check started in background",
            "timestamp": datetime.utcnow().isoformat()
        }

    except Exception as e:
        logger.error(f"Failed to trigger health check: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to trigger health check: {str(e)}")


@router.get("/alerts")
async def get_active_alerts(severity: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Get active system alerts
    Optionally filter by severity level
    """
    try:
        observability = await get_observability_service()
        alerts = observability.get_active_alerts()

        if severity:
            alerts = [alert for alert in alerts if alert.severity.value.lower() == severity.lower()]

        return [
            {
                "alert_id": alert.alert_id,
                "alert_type": alert.alert_type,
                "severity": alert.severity.value,
                "title": alert.title,
                "description": alert.description,
                "affected_components": alert.affected_components,
                "remediation_steps": alert.remediation_steps,
                "created_at": alert.created_at.isoformat(),
                "resolved_at": alert.resolved_at.isoformat() if alert.resolved_at else None
            }
            for alert in alerts
        ]

    except Exception as e:
        logger.error(f"Failed to get active alerts: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get alerts: {str(e)}")


@router.post("/alerts/{alert_id}/resolve")
async def resolve_alert(alert_id: str) -> Dict[str, Any]:
    """
    Manually resolve an active alert
    """
    try:
        observability = await get_observability_service()
        success = await observability.resolve_alert(alert_id)

        if success:
            return {
                "status": "resolved",
                "alert_id": alert_id,
                "resolved_at": datetime.utcnow().isoformat(),
                "message": f"Alert {alert_id} resolved successfully"
            }
        else:
            return {
                "status": "not_found",
                "alert_id": alert_id,
                "message": f"Alert {alert_id} not found or already resolved"
            }

    except Exception as e:
        logger.error(f"Failed to resolve alert {alert_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to resolve alert: {str(e)}")


@router.get("/monitoring/status")
async def get_monitoring_status() -> Dict[str, Any]:
    """
    Get continuous monitoring service status
    """
    return {
        "monitoring_enabled": continuous_monitoring.running,
        "service_status": "running" if continuous_monitoring.running else "stopped",
        "intervals": continuous_monitoring.intervals,
        "timestamp": datetime.utcnow().isoformat()
    }


@router.post("/monitoring/enable")
async def enable_monitoring() -> Dict[str, str]:
    """
    Enable continuous monitoring
    """
    try:
        observability = await get_observability_service()
        observability.monitoring_enabled = True

        return {
            "status": "enabled",
            "message": "Monitoring enabled successfully",
            "timestamp": datetime.utcnow().isoformat()
        }

    except Exception as e:
        logger.error(f"Failed to enable monitoring: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to enable monitoring: {str(e)}")


@router.post("/monitoring/disable")
async def disable_monitoring() -> Dict[str, str]:
    """
    Disable continuous monitoring
    """
    try:
        observability = await get_observability_service()
        observability.monitoring_enabled = False

        return {
            "status": "disabled",
            "message": "Monitoring disabled successfully",
            "timestamp": datetime.utcnow().isoformat()
        }

    except Exception as e:
        logger.error(f"Failed to disable monitoring: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to disable monitoring: {str(e)}")


@router.get("/compliance")
async def get_compliance_status() -> Dict[str, Any]:
    """
    Get Canadian compliance and PIPEDA status
    """
    try:
        observability = await get_observability_service()

        # Run compliance checks
        compliance_checks = await observability._check_canadian_compliance()

        return {
            "overall_status": "compliant" if all(check.status for check in compliance_checks) else "non_compliant",
            "checks": [
                {
                    "check_name": check.check_name,
                    "status": check.status,
                    "error_message": check.error_message,
                    "remediation_steps": check.remediation_steps
                }
                for check in compliance_checks
            ],
            "timestamp": datetime.utcnow().isoformat()
        }

    except Exception as e:
        logger.error(f"Failed to get compliance status: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get compliance status: {str(e)}")


@router.get("/performance")
async def get_performance_metrics() -> Dict[str, Any]:
    """
    Get current performance metrics
    """
    try:
        observability = await get_observability_service()

        # Run performance checks
        performance_checks = await observability._check_performance_metrics()

        metrics = []
        for check in performance_checks:
            for metric in check.metrics:
                metrics.append({
                    "name": metric.name,
                    "value": metric.value,
                    "unit": metric.unit,
                    "healthy": metric.healthy,
                    "threshold": metric.threshold,
                    "measured_at": metric.measured_at.isoformat()
                })

        return {
            "performance_status": "healthy" if all(check.status for check in performance_checks) else "degraded",
            "metrics": metrics,
            "timestamp": datetime.utcnow().isoformat()
        }

    except Exception as e:
        logger.error(f"Failed to get performance metrics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get performance metrics: {str(e)}")


@router.get("/dashboard")
async def get_monitoring_dashboard() -> Dict[str, Any]:
    """
    Get comprehensive monitoring dashboard data
    Equivalent to GraphQL monitoring_dashboard query but via REST
    """
    try:
        observability = await get_observability_service()

        # Run comprehensive health check
        health_checks = await observability.run_comprehensive_health_check()
        health_summary = observability.get_health_summary()
        active_alerts = observability.get_active_alerts()

        # Format response
        return {
            "health_summary": {
                "status": health_summary["status"],
                "overall_health_percentage": health_summary["overall_health_percentage"],
                "total_checks": health_summary["total_checks"],
                "healthy_checks": health_summary["healthy_checks"],
                "categories": health_summary["categories"],
                "monitoring_enabled": health_summary["monitoring_enabled"],
                "last_check": health_summary.get("last_check")
            },
            "recent_checks": [
                {
                    "check_id": check.check_id,
                    "check_name": check.check_name,
                    "category": check.category,
                    "status": check.status,
                    "error_message": check.error_message,
                    "severity": check.severity.value,
                    "checked_at": check.checked_at.isoformat()
                }
                for check in health_checks[-10:]  # Last 10 checks
            ],
            "active_alerts": [
                {
                    "alert_id": alert.alert_id,
                    "severity": alert.severity.value,
                    "title": alert.title,
                    "description": alert.description,
                    "affected_components": alert.affected_components,
                    "created_at": alert.created_at.isoformat()
                }
                for alert in active_alerts
            ],
            "timestamp": datetime.utcnow().isoformat()
        }

    except Exception as e:
        logger.error(f"Failed to get monitoring dashboard: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get dashboard: {str(e)}")


# Add router to FastAPI app
def include_health_routes(app):
    """Include health and monitoring routes in FastAPI app"""
    app.include_router(router)