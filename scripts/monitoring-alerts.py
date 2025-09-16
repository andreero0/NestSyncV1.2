#!/usr/bin/env python3
"""
Real-Time Authentication Monitoring and Alerting System
Prevents business-critical authentication failures through continuous monitoring
"""

import asyncio
import aiohttp
import json
import logging
import time
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from pathlib import Path
import subprocess
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

@dataclass
class AlertConfig:
    """Configuration for monitoring alerts"""
    backend_url: str = "http://localhost:8001"
    test_email: str = "parents@nestsync.com"
    test_password: str = "Shazam11#"
    check_interval: int = 300  # 5 minutes
    alert_threshold: int = 3   # failures before alert
    critical_threshold: int = 1  # critical failures before immediate alert
    log_file: str = "/tmp/auth-monitoring.log"
    enable_slack: bool = False
    slack_webhook: Optional[str] = None

class AuthMonitor:
    """
    Comprehensive authentication monitoring system
    Tracks authentication health and triggers alerts
    """

    def __init__(self, config: AlertConfig):
        self.config = config
        self.failure_count = 0
        self.last_success = None
        self.alert_sent = False

    async def check_backend_health(self) -> Dict[str, Any]:
        """Check backend health endpoint"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{self.config.backend_url}/health",
                    timeout=aiohttp.ClientTimeout(total=30)
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        return {
                            "healthy": True,
                            "status": data.get("status", "unknown"),
                            "response_time": data.get("response_time_ms", 0)
                        }
                    else:
                        return {
                            "healthy": False,
                            "error": f"HTTP {response.status}",
                            "status": "unhealthy"
                        }
        except Exception as e:
            return {
                "healthy": False,
                "error": str(e),
                "status": "error"
            }

    async def check_auth_health(self) -> Dict[str, Any]:
        """Check authentication health endpoint"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{self.config.backend_url}/health/auth",
                    timeout=aiohttp.ClientTimeout(total=30)
                ) as response:
                    data = await response.json()

                    return {
                        "healthy": response.status == 200,
                        "status": data.get("status", "unknown"),
                        "gotrue_version": data.get("gotrue_version"),
                        "critical_failures": data.get("critical_failures", []),
                        "response_time": data.get("response_time_ms", 0)
                    }
        except Exception as e:
            return {
                "healthy": False,
                "error": str(e),
                "status": "error",
                "critical_failures": ["health_check_exception"]
            }

    async def test_authentication_flow(self) -> Dict[str, Any]:
        """Test actual authentication with test credentials"""
        try:
            mutation = {
                "query": """
                mutation SignIn($input: SignInInput!) {
                    signIn(input: $input) {
                        success
                        error
                        user { id email }
                        session { accessToken }
                    }
                }
                """,
                "variables": {
                    "input": {
                        "email": self.config.test_email,
                        "password": self.config.test_password
                    }
                }
            }

            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.config.backend_url}/graphql",
                    json=mutation,
                    timeout=aiohttp.ClientTimeout(total=30),
                    headers={"Content-Type": "application/json"}
                ) as response:

                    if response.status != 200:
                        return {
                            "healthy": False,
                            "error": f"HTTP {response.status}",
                            "critical": False
                        }

                    data = await response.json()

                    if "errors" in data:
                        error_msg = data["errors"][0].get("message", "GraphQL error")
                        return {
                            "healthy": False,
                            "error": error_msg,
                            "critical": "identity_id" in error_msg.lower()
                        }

                    sign_in_result = data.get("data", {}).get("signIn", {})
                    success = sign_in_result.get("success", False)

                    if success:
                        return {
                            "healthy": True,
                            "has_token": bool(sign_in_result.get("session", {}).get("accessToken")),
                            "user_id": sign_in_result.get("user", {}).get("id")
                        }
                    else:
                        error_msg = sign_in_result.get("error", "Authentication failed")
                        return {
                            "healthy": False,
                            "error": error_msg,
                            "critical": "identity_id" in error_msg.lower() or "pydantic" in error_msg.lower()
                        }

        except Exception as e:
            return {
                "healthy": False,
                "error": str(e),
                "critical": False
            }

    async def run_comprehensive_check(self) -> Dict[str, Any]:
        """Run all health checks and return comprehensive report"""
        start_time = time.time()

        results = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "overall_healthy": True,
            "critical_issues": [],
            "warnings": [],
            "checks": {},
            "response_time_ms": 0
        }

        # 1. Backend Health
        backend_health = await self.check_backend_health()
        results["checks"]["backend"] = backend_health
        if not backend_health["healthy"]:
            results["overall_healthy"] = False
            results["critical_issues"].append(f"Backend unhealthy: {backend_health.get('error')}")

        # 2. Auth Health
        auth_health = await self.check_auth_health()
        results["checks"]["auth_health"] = auth_health
        if not auth_health["healthy"]:
            results["overall_healthy"] = False
            if auth_health.get("critical_failures"):
                results["critical_issues"].extend([
                    f"Auth health critical: {failure}"
                    for failure in auth_health["critical_failures"]
                ])

        # 3. Authentication Flow
        auth_flow = await self.test_authentication_flow()
        results["checks"]["auth_flow"] = auth_flow
        if not auth_flow["healthy"]:
            results["overall_healthy"] = False
            if auth_flow.get("critical"):
                results["critical_issues"].append(f"Critical auth flow failure: {auth_flow.get('error')}")
            else:
                results["warnings"].append(f"Auth flow issue: {auth_flow.get('error')}")

        # Calculate total response time
        results["response_time_ms"] = round((time.time() - start_time) * 1000, 2)

        return results

    async def send_alert(self, alert_type: str, message: str, details: Dict[str, Any]):
        """Send alert notifications"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        # Log alert
        logger.error(f"ALERT [{alert_type}]: {message}")

        # Console alert
        print(f"\n🚨 AUTHENTICATION ALERT 🚨")
        print(f"Type: {alert_type}")
        print(f"Time: {timestamp}")
        print(f"Message: {message}")

        if details.get("critical_issues"):
            print(f"Critical Issues:")
            for issue in details["critical_issues"]:
                print(f"  • {issue}")

        if details.get("warnings"):
            print(f"Warnings:")
            for warning in details["warnings"]:
                print(f"  • {warning}")

        print(f"Response Time: {details.get('response_time_ms', 0)}ms")
        print("=" * 50)

        # TODO: Add Slack/email notifications
        if self.config.enable_slack and self.config.slack_webhook:
            await self.send_slack_alert(alert_type, message, details)

    async def send_slack_alert(self, alert_type: str, message: str, details: Dict[str, Any]):
        """Send Slack notification"""
        try:
            webhook_data = {
                "text": f"🚨 NestSync Authentication Alert",
                "attachments": [
                    {
                        "color": "danger" if alert_type == "CRITICAL" else "warning",
                        "fields": [
                            {
                                "title": "Alert Type",
                                "value": alert_type,
                                "short": True
                            },
                            {
                                "title": "Message",
                                "value": message,
                                "short": False
                            },
                            {
                                "title": "Response Time",
                                "value": f"{details.get('response_time_ms', 0)}ms",
                                "short": True
                            }
                        ]
                    }
                ]
            }

            async with aiohttp.ClientSession() as session:
                await session.post(self.config.slack_webhook, json=webhook_data)

        except Exception as e:
            logger.error(f"Failed to send Slack alert: {e}")

    async def monitor_continuous(self):
        """Run continuous monitoring with alerting"""
        logger.info(f"Starting continuous authentication monitoring")
        logger.info(f"Check interval: {self.config.check_interval}s")
        logger.info(f"Backend URL: {self.config.backend_url}")

        while True:
            try:
                results = await self.run_comprehensive_check()

                # Reset failure count on success
                if results["overall_healthy"]:
                    if self.failure_count > 0:
                        logger.info("Authentication system recovered")
                        self.failure_count = 0
                        self.alert_sent = False

                    self.last_success = datetime.now()
                    logger.info("✅ Authentication system healthy")

                else:
                    self.failure_count += 1
                    logger.warning(f"❌ Authentication check failed (count: {self.failure_count})")

                    # Critical alerts (immediate)
                    if results["critical_issues"]:
                        await self.send_alert(
                            "CRITICAL",
                            f"Critical authentication failure detected! User logins will fail.",
                            results
                        )

                    # Standard alerts (after threshold)
                    elif self.failure_count >= self.config.alert_threshold and not self.alert_sent:
                        await self.send_alert(
                            "WARNING",
                            f"Authentication system failing for {self.failure_count} consecutive checks",
                            results
                        )
                        self.alert_sent = True

                # Log detailed results
                logger.debug(f"Check results: {json.dumps(results, indent=2)}")

            except Exception as e:
                logger.error(f"Monitoring check failed: {e}")
                self.failure_count += 1

            # Wait for next check
            await asyncio.sleep(self.config.check_interval)

def main():
    """Main monitoring entry point"""
    import argparse

    parser = argparse.ArgumentParser(description="Authentication Monitoring System")
    parser.add_argument("--backend-url", default="http://localhost:8001", help="Backend URL")
    parser.add_argument("--interval", type=int, default=300, help="Check interval in seconds")
    parser.add_argument("--test-email", default="parents@nestsync.com", help="Test email")
    parser.add_argument("--test-password", default="Shazam11#", help="Test password")
    parser.add_argument("--single", action="store_true", help="Run single check instead of continuous")
    parser.add_argument("--slack-webhook", help="Slack webhook URL for alerts")

    args = parser.parse_args()

    config = AlertConfig(
        backend_url=args.backend_url,
        test_email=args.test_email,
        test_password=args.test_password,
        check_interval=args.interval,
        enable_slack=bool(args.slack_webhook),
        slack_webhook=args.slack_webhook
    )

    monitor = AuthMonitor(config)

    if args.single:
        # Single check mode
        async def run_single():
            results = await monitor.run_comprehensive_check()
            print(json.dumps(results, indent=2))

            if not results["overall_healthy"]:
                if results["critical_issues"]:
                    print("\n🚨 CRITICAL ISSUES DETECTED!")
                    for issue in results["critical_issues"]:
                        print(f"  • {issue}")
                    exit(2)
                else:
                    print("\n⚠️ WARNINGS DETECTED!")
                    for warning in results["warnings"]:
                        print(f"  • {warning}")
                    exit(1)
            else:
                print("\n✅ All authentication checks passed!")
                exit(0)

        asyncio.run(run_single())
    else:
        # Continuous monitoring mode
        try:
            asyncio.run(monitor.monitor_continuous())
        except KeyboardInterrupt:
            logger.info("Monitoring stopped by user")

if __name__ == "__main__":
    main()