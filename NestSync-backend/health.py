"""
NestSync Backend Health Check Endpoint
Comprehensive health monitoring for Railway deployment
"""

import asyncio
import time
from typing import Dict, Any, Optional
from datetime import datetime, timezone
import os
import psutil

# Import dependencies for health checks
try:
    import redis
except ImportError:
    redis = None

try:
    from sqlalchemy import create_engine, text
except ImportError:
    create_engine = None
    text = None

try:
    from supabase import create_client
except ImportError:
    create_client = None


class HealthChecker:
    """Comprehensive health check service for NestSync backend"""
    
    def __init__(self):
        self.start_time = time.time()
        
    async def get_health_status(self) -> Dict[str, Any]:
        """
        Comprehensive health check covering all critical systems
        Returns detailed status for monitoring and debugging
        """
        health_data = {
            "status": "healthy",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "uptime_seconds": int(time.time() - self.start_time),
            "version": os.getenv("API_VERSION", "1.0.0"),
            "environment": os.getenv("ENVIRONMENT", "unknown"),
            "region": os.getenv("DATA_REGION", "canada-central"),
            "checks": {}
        }
        
        # Run all health checks
        checks = [
            ("system", self._check_system_health),
            ("database", self._check_database),
            ("redis", self._check_redis),
            ("supabase", self._check_supabase),
            ("external_apis", self._check_external_apis),
            ("storage", self._check_storage),
        ]

        # Define critical services that must be healthy for overall health
        critical_services = {"system", "database"}

        overall_healthy = True
        critical_failures = []

        for check_name, check_func in checks:
            try:
                check_result = await check_func()
                health_data["checks"][check_name] = check_result

                # Only consider critical services for overall health status
                if check_name in critical_services and check_result.get("status") not in ["healthy", "warning"]:
                    overall_healthy = False
                    critical_failures.append(f"{check_name}: {check_result.get('error', 'unknown error')}")

            except Exception as e:
                health_data["checks"][check_name] = {
                    "status": "error",
                    "error": str(e),
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
                # Only consider critical service failures
                if check_name in critical_services:
                    overall_healthy = False
                    critical_failures.append(f"{check_name}: {str(e)}")

        health_data["status"] = "healthy" if overall_healthy else "unhealthy"
        if critical_failures:
            health_data["critical_failures"] = critical_failures
        return health_data
    
    async def _check_system_health(self) -> Dict[str, Any]:
        """Check system resources and performance"""
        try:
            # CPU and memory usage
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            # Process information
            process = psutil.Process()
            process_memory = process.memory_info()
            
            status = "healthy"
            warnings = []
            
            # Check for resource constraints
            if cpu_percent > 80:
                warnings.append("High CPU usage")
                status = "warning"
            
            if memory.percent > 85:
                warnings.append("High memory usage")
                status = "warning"
                
            if disk.percent > 85:
                warnings.append("Low disk space")
                status = "warning"
            
            return {
                "status": status,
                "warnings": warnings,
                "metrics": {
                    "cpu_percent": cpu_percent,
                    "memory_percent": memory.percent,
                    "memory_available_mb": memory.available // (1024 * 1024),
                    "disk_percent": disk.percent,
                    "disk_free_gb": disk.free // (1024 * 1024 * 1024),
                    "process_memory_mb": process_memory.rss // (1024 * 1024),
                    "uptime_seconds": int(time.time() - self.start_time)
                },
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
    
    async def _check_database(self) -> Dict[str, Any]:
        """Check PostgreSQL database connectivity"""
        try:
            database_url = os.getenv("DATABASE_URL")
            if not database_url:
                return {
                    "status": "warning",
                    "message": "DATABASE_URL not configured",
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }

            if not create_engine or not text:
                return {
                    "status": "warning",
                    "message": "SQLAlchemy not available for database health check",
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }

            start_time = time.time()

            # Convert async database URL to sync for health check
            sync_database_url = database_url.replace("postgresql+asyncpg://", "postgresql://")

            # Create synchronous connection for health check
            engine = create_engine(sync_database_url)
            with engine.connect() as conn:
                result = conn.execute(text("SELECT 1 as health_check"))
                result.fetchone()

            response_time = (time.time() - start_time) * 1000

            return {
                "status": "healthy",
                "response_time_ms": int(response_time),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }

        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
    
    async def _check_redis(self) -> Dict[str, Any]:
        """Check Redis connectivity and performance"""
        try:
            redis_url = os.getenv("REDIS_URL")
            if not redis_url:
                return {
                    "status": "warning",
                    "message": "REDIS_URL not configured",
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
            
            if not redis:
                return {
                    "status": "warning",
                    "message": "Redis client not available",
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
            
            start_time = time.time()
            
            # Create Redis client and test connectivity
            redis_client = redis.from_url(redis_url, decode_responses=True)
            await asyncio.get_event_loop().run_in_executor(
                None, redis_client.ping
            )
            
            response_time = (time.time() - start_time) * 1000
            
            return {
                "status": "healthy",
                "response_time_ms": int(response_time),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
    
    async def _check_supabase(self) -> Dict[str, Any]:
        """Check Supabase connectivity"""
        try:
            supabase_url = os.getenv("SUPABASE_URL")
            supabase_key = os.getenv("SUPABASE_KEY")

            if not supabase_url or not supabase_key:
                return {
                    "status": "warning",
                    "message": "Supabase credentials not configured",
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }

            if not create_client:
                return {
                    "status": "warning",
                    "message": "Supabase client not available",
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }

            start_time = time.time()

            # Simple health check - try to create client
            supabase_client = create_client(supabase_url, supabase_key)

            response_time = (time.time() - start_time) * 1000

            return {
                "status": "healthy",
                "response_time_ms": int(response_time),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }

        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
    
    async def _check_external_apis(self) -> Dict[str, Any]:
        """Check external API dependencies"""
        try:
            # This would check connectivity to critical external services
            # For now, just verify environment variables are set
            
            required_apis = [
                "OPENAI_API_KEY",
                "STRIPE_SECRET_KEY",
                "SENDGRID_API_KEY"
            ]
            
            configured_apis = []
            missing_apis = []
            
            for api in required_apis:
                if os.getenv(api):
                    configured_apis.append(api)
                else:
                    missing_apis.append(api)
            
            status = "healthy" if not missing_apis else "warning"
            
            return {
                "status": status,
                "configured_apis": len(configured_apis),
                "missing_apis": missing_apis,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
    
    async def _check_storage(self) -> Dict[str, Any]:
        """Check file storage and temporary directories"""
        try:
            # Check that required directories exist and are writable
            required_dirs = [
                "/app/logs",
                "/app/temp",
                "/app/uploads"
            ]
            
            status = "healthy"
            issues = []
            
            for directory in required_dirs:
                if not os.path.exists(directory):
                    issues.append(f"Directory {directory} does not exist")
                    status = "warning"
                elif not os.access(directory, os.W_OK):
                    issues.append(f"Directory {directory} is not writable")
                    status = "warning"
            
            return {
                "status": status,
                "issues": issues,
                "checked_directories": required_dirs,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }


# Global health checker instance
health_checker = HealthChecker()


async def get_health():
    """FastAPI endpoint function for health checks"""
    return await health_checker.get_health_status()


def get_simple_health():
    """Simple synchronous health check for basic monitoring"""
    try:
        return {
            "status": "healthy",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "uptime_seconds": int(time.time() - health_checker.start_time),
            "version": os.getenv("API_VERSION", "1.0.0")
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }


if __name__ == "__main__":
    # Allow running as standalone script for debugging
    import asyncio
    
    async def main():
        health_status = await health_checker.get_health_status()
        import json
        print(json.dumps(health_status, indent=2))
    
    asyncio.run(main())