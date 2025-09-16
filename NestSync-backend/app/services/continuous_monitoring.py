"""
Continuous Monitoring Service for NestSync
Runs periodic health checks and early warning detection
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import signal
import sys

from app.services.observability_service import get_observability_service, AlertSeverity
from app.config.settings import get_settings


class ContinuousMonitoringService:
    """
    Continuous monitoring service that runs health checks periodically
    and provides early warning detection for infrastructure issues
    """

    def __init__(self):
        self.settings = get_settings()
        self.logger = logging.getLogger(__name__)
        self.running = False
        self.task: Optional[asyncio.Task] = None

        # Monitoring intervals (in seconds)
        self.intervals = {
            "health_check": 300,        # 5 minutes - comprehensive health check
            "quick_check": 60,          # 1 minute - quick vital signs
            "performance_check": 180,   # 3 minutes - performance monitoring
            "compliance_check": 900,    # 15 minutes - Canadian compliance validation
            "trend_analysis": 600,      # 10 minutes - trend analysis for early warning
        }

        # Setup signal handlers for graceful shutdown
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)

    def _signal_handler(self, signum, frame):
        """Handle shutdown signals gracefully"""
        self.logger.info(f"Received signal {signum}, shutting down monitoring...")
        self.stop()

    async def start(self) -> None:
        """Start continuous monitoring"""
        if self.running:
            self.logger.warning("Monitoring service already running")
            return

        self.running = True
        self.logger.info("🚀 Starting NestSync Continuous Monitoring Service")

        try:
            observability = await get_observability_service()

            # Perform initial comprehensive health check
            self.logger.info("Performing initial comprehensive health check...")
            await observability.run_comprehensive_health_check()

            # Start monitoring loop
            self.task = asyncio.create_task(self._monitoring_loop())
            await self.task

        except asyncio.CancelledError:
            self.logger.info("Monitoring service cancelled")
        except Exception as e:
            self.logger.error(f"Critical error in monitoring service: {e}")
            raise
        finally:
            self.running = False

    def stop(self) -> None:
        """Stop continuous monitoring"""
        if self.task and not self.task.done():
            self.task.cancel()
        self.running = False

    async def _monitoring_loop(self) -> None:
        """Main monitoring loop with periodic health checks"""
        last_checks = {
            "health_check": datetime.min,
            "quick_check": datetime.min,
            "performance_check": datetime.min,
            "compliance_check": datetime.min,
            "trend_analysis": datetime.min,
        }

        self.logger.info("📊 Monitoring loop started - watching for P0/P1 failure patterns")

        while self.running:
            try:
                current_time = datetime.utcnow()
                observability = await get_observability_service()

                # Check if monitoring is enabled
                if not observability.monitoring_enabled:
                    await asyncio.sleep(30)  # Check every 30 seconds if monitoring is disabled
                    continue

                # Quick vital signs check (every minute)
                if self._should_run_check("quick_check", current_time, last_checks):
                    await self._run_quick_check(observability)
                    last_checks["quick_check"] = current_time

                # Performance monitoring (every 3 minutes)
                if self._should_run_check("performance_check", current_time, last_checks):
                    await self._run_performance_check(observability)
                    last_checks["performance_check"] = current_time

                # Comprehensive health check (every 5 minutes)
                if self._should_run_check("health_check", current_time, last_checks):
                    await self._run_comprehensive_check(observability)
                    last_checks["health_check"] = current_time

                # Trend analysis and early warning (every 10 minutes)
                if self._should_run_check("trend_analysis", current_time, last_checks):
                    await self._run_trend_analysis(observability)
                    last_checks["trend_analysis"] = current_time

                # Canadian compliance check (every 15 minutes)
                if self._should_run_check("compliance_check", current_time, last_checks):
                    await self._run_compliance_check(observability)
                    last_checks["compliance_check"] = current_time

                # Sleep for 10 seconds before next iteration
                await asyncio.sleep(10)

            except asyncio.CancelledError:
                break
            except Exception as e:
                self.logger.error(f"Error in monitoring loop: {e}")
                # Continue monitoring despite errors, but sleep longer
                await asyncio.sleep(30)

        self.logger.info("📊 Monitoring loop stopped")

    def _should_run_check(self, check_type: str, current_time: datetime, last_checks: Dict[str, datetime]) -> bool:
        """Check if enough time has passed to run a specific check"""
        interval = self.intervals.get(check_type, 300)
        last_check = last_checks.get(check_type, datetime.min)
        return (current_time - last_check).total_seconds() >= interval

    async def _run_quick_check(self, observability) -> None:
        """Run quick vital signs check - fastest essential checks"""
        try:
            self.logger.debug("🔍 Running quick vital signs check")

            # Quick database connectivity check
            checks = []
            checks.append(await observability._check_database_health())

            # Quick authentication health
            checks.append(await observability._check_authentication_health())

            # Process any critical alerts
            await observability._process_health_check_alerts(checks)

            # Log critical issues immediately
            critical_issues = [check for check in checks if not check.status and check.severity == AlertSeverity.CRITICAL]
            if critical_issues:
                self.logger.error(f"🚨 CRITICAL ISSUES DETECTED: {len(critical_issues)} critical failures in quick check")

        except Exception as e:
            self.logger.error(f"Error in quick check: {e}")

    async def _run_performance_check(self, observability) -> None:
        """Run performance monitoring - detect degradation early"""
        try:
            self.logger.debug("⚡ Running performance monitoring check")

            # Performance and UX monitoring
            checks = await observability._check_performance_metrics()

            # Process alerts
            await observability._process_health_check_alerts(checks)

            # Log performance warnings
            perf_issues = [check for check in checks if not check.status]
            if perf_issues:
                self.logger.warning(f"⚠️ PERFORMANCE ISSUES: {len(perf_issues)} performance checks failed")

        except Exception as e:
            self.logger.error(f"Error in performance check: {e}")

    async def _run_comprehensive_check(self, observability) -> None:
        """Run comprehensive health check - all systems"""
        try:
            self.logger.debug("🔎 Running comprehensive health check")

            # Full system health check
            checks = await observability.run_comprehensive_health_check()

            # Log summary
            total_checks = len(checks)
            failed_checks = sum(1 for check in checks if not check.status)
            success_rate = ((total_checks - failed_checks) / total_checks * 100) if total_checks > 0 else 0

            if failed_checks > 0:
                self.logger.warning(
                    f"📊 Health check summary: {success_rate:.1f}% success rate "
                    f"({total_checks - failed_checks}/{total_checks} passed, {failed_checks} failed)"
                )
            else:
                self.logger.info(f"✅ All {total_checks} health checks passed ({success_rate:.1f}% success rate)")

        except Exception as e:
            self.logger.error(f"Error in comprehensive check: {e}")

    async def _run_trend_analysis(self, observability) -> None:
        """Run trend analysis for early warning detection"""
        try:
            self.logger.debug("📈 Running trend analysis and early warning detection")

            # Early warning indicators
            checks = await observability._check_early_warning_indicators()

            # Process alerts
            await observability._process_health_check_alerts(checks)

            # Log trend warnings
            trend_issues = [check for check in checks if not check.status]
            if trend_issues:
                self.logger.warning(f"📈 TREND ALERTS: {len(trend_issues)} early warning indicators triggered")

        except Exception as e:
            self.logger.error(f"Error in trend analysis: {e}")

    async def _run_compliance_check(self, observability) -> None:
        """Run Canadian compliance and PIPEDA validation"""
        try:
            self.logger.debug("🇨🇦 Running Canadian compliance check")

            # Canadian compliance monitoring
            checks = await observability._check_canadian_compliance()

            # Process alerts
            await observability._process_health_check_alerts(checks)

            # Log compliance status
            compliance_issues = [check for check in checks if not check.status]
            if compliance_issues:
                self.logger.error(f"🇨🇦 COMPLIANCE ISSUES: {len(compliance_issues)} Canadian compliance failures")
            else:
                self.logger.info("🇨🇦 Canadian compliance validation passed")

        except Exception as e:
            self.logger.error(f"Error in compliance check: {e}")


# Global monitoring service instance
continuous_monitoring = ContinuousMonitoringService()


async def start_monitoring() -> None:
    """Start the continuous monitoring service"""
    await continuous_monitoring.start()


def stop_monitoring() -> None:
    """Stop the continuous monitoring service"""
    continuous_monitoring.stop()


if __name__ == "__main__":
    """Run monitoring service as standalone script"""
    import uvloop

    # Setup logging
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )

    # Use uvloop for better async performance
    uvloop.install()

    try:
        asyncio.run(start_monitoring())
    except KeyboardInterrupt:
        logging.info("Monitoring service stopped by user")
    except Exception as e:
        logging.error(f"Fatal error in monitoring service: {e}")
        sys.exit(1)