"""
Authentication Health Check Endpoint
Provides real-time monitoring of authentication system health
"""

import logging
import time
from typing import Dict, Any
from fastapi import HTTPException
from datetime import datetime, timezone

from app.auth.supabase import supabase_auth
from app.config.settings import settings

logger = logging.getLogger(__name__)

class AuthHealthChecker:
    """
    Comprehensive authentication system health checker
    Tests critical authentication paths and dependencies
    """

    def __init__(self):
        self.test_email = "health-check@nestsync.internal"
        self.test_password = "HealthCheck123!@#"

    async def check_auth_system_health(self) -> Dict[str, Any]:
        """
        Comprehensive authentication system health check
        Tests all critical authentication paths
        """
        start_time = time.time()
        results = {
            "status": "healthy",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "checks": {},
            "response_time_ms": 0,
            "gotrue_version": None,
            "supabase_connection": False,
            "critical_failures": []
        }

        try:
            # 1. Test Supabase connection
            connection_result = await self._test_supabase_connection()
            results["checks"]["supabase_connection"] = connection_result
            results["supabase_connection"] = connection_result["healthy"]

            # 2. Test gotrue compatibility
            gotrue_result = await self._test_gotrue_compatibility()
            results["checks"]["gotrue_compatibility"] = gotrue_result
            results["gotrue_version"] = gotrue_result.get("version")

            # 3. Test JWT verification
            jwt_result = await self._test_jwt_verification()
            results["checks"]["jwt_verification"] = jwt_result

            # 4. Test field transformation
            transform_result = await self._test_field_transformation()
            results["checks"]["field_transformation"] = transform_result

            # 5. Test authentication flow (if safe)
            if settings.environment == "development":
                auth_flow_result = await self._test_auth_flow()
                results["checks"]["auth_flow"] = auth_flow_result

            # Determine overall health
            failed_checks = [name for name, check in results["checks"].items()
                           if not check.get("healthy", False)]

            if failed_checks:
                results["status"] = "unhealthy"
                results["critical_failures"] = failed_checks

            # Critical failure detection
            critical_checks = ["supabase_connection", "gotrue_compatibility", "jwt_verification"]
            critical_failures = [check for check in failed_checks if check in critical_checks]

            if critical_failures:
                results["status"] = "critical"
                results["critical_failures"] = critical_failures

        except Exception as e:
            logger.error(f"Health check failed with exception: {e}")
            results["status"] = "critical"
            results["error"] = str(e)
            results["critical_failures"] = ["health_check_exception"]

        # Calculate response time
        results["response_time_ms"] = round((time.time() - start_time) * 1000, 2)

        return results

    async def _test_supabase_connection(self) -> Dict[str, Any]:
        """Test basic Supabase connection"""
        try:
            # Test if we can create a client
            client = supabase_auth.client
            if client and hasattr(client, 'auth'):
                return {
                    "healthy": True,
                    "message": "Supabase client connection successful",
                    "url": settings.supabase_url[:50] + "..." if len(settings.supabase_url) > 50 else settings.supabase_url
                }
            else:
                return {
                    "healthy": False,
                    "error": "Supabase client not properly initialized"
                }
        except Exception as e:
            return {
                "healthy": False,
                "error": f"Supabase connection failed: {str(e)}"
            }

    async def _test_gotrue_compatibility(self) -> Dict[str, Any]:
        """Test gotrue version and compatibility"""
        try:
            import gotrue
            version = getattr(gotrue, '__version__', 'unknown')

            # Check if we're running the expected version
            expected_version = "2.5.4"
            version_match = version == expected_version

            return {
                "healthy": version_match,
                "version": version,
                "expected_version": expected_version,
                "message": f"gotrue version {version}" + (" (correct)" if version_match else f" (expected {expected_version})")
            }
        except Exception as e:
            return {
                "healthy": False,
                "error": f"gotrue version check failed: {str(e)}"
            }

    async def _test_jwt_verification(self) -> Dict[str, Any]:
        """Test JWT verification functionality"""
        try:
            # Test with an obviously invalid token
            test_token = "invalid.jwt.token"
            result = supabase_auth.verify_jwt_token(test_token)

            # Should return None for invalid token
            if result is None:
                return {
                    "healthy": True,
                    "message": "JWT verification working correctly (rejected invalid token)"
                }
            else:
                return {
                    "healthy": False,
                    "error": "JWT verification failed to reject invalid token"
                }
        except Exception as e:
            return {
                "healthy": False,
                "error": f"JWT verification test failed: {str(e)}"
            }

    async def _test_field_transformation(self) -> Dict[str, Any]:
        """Test field transformation function"""
        try:
            from app.auth.supabase import _transform_identity_response

            # Test the transformation function exists and is callable
            if callable(_transform_identity_response):
                return {
                    "healthy": True,
                    "message": "Field transformation function available"
                }
            else:
                return {
                    "healthy": False,
                    "error": "Field transformation function not callable"
                }
        except ImportError as e:
            return {
                "healthy": False,
                "error": f"Field transformation function not found: {str(e)}"
            }
        except Exception as e:
            return {
                "healthy": False,
                "error": f"Field transformation test failed: {str(e)}"
            }

    async def _test_auth_flow(self) -> Dict[str, Any]:
        """Test basic authentication flow (development only)"""
        try:
            # Only test with known safe credentials in development
            if settings.environment != "development":
                return {
                    "healthy": True,
                    "message": "Auth flow testing skipped (not development environment)"
                }

            # Test sign in with known test credentials
            test_result = await supabase_auth.sign_in(
                "parents@nestsync.com",
                "Shazam11#"
            )

            if test_result.get("success"):
                return {
                    "healthy": True,
                    "message": "Authentication flow test successful"
                }
            else:
                return {
                    "healthy": False,
                    "error": f"Authentication flow failed: {test_result.get('error', 'unknown error')}"
                }

        except Exception as e:
            return {
                "healthy": False,
                "error": f"Auth flow test failed: {str(e)}"
            }

# Global health checker instance
auth_health_checker = AuthHealthChecker()

async def get_auth_health() -> Dict[str, Any]:
    """
    Get authentication system health status
    Returns comprehensive health check results
    """
    return await auth_health_checker.check_auth_system_health()

async def get_auth_health_simple() -> Dict[str, Any]:
    """
    Simple health check for load balancers and monitoring
    Returns basic status information
    """
    try:
        full_health = await get_auth_health()
        return {
            "status": full_health["status"],
            "healthy": full_health["status"] == "healthy",
            "response_time_ms": full_health["response_time_ms"],
            "critical_failures": full_health.get("critical_failures", [])
        }
    except Exception as e:
        return {
            "status": "critical",
            "healthy": False,
            "error": str(e),
            "critical_failures": ["health_check_exception"]
        }