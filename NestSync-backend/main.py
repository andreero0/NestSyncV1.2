"""
NestSync FastAPI Backend - Main Application Entry Point
Canadian Diaper Planning Application with PIPEDA Compliance
"""

import os
import logging
import socket
from contextlib import asynccontextmanager
from typing import Dict, Any, List

from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.openapi.utils import get_openapi
from strawberry.fastapi import GraphQLRouter

# Import application components
from app.config.database import init_database, close_database, check_database_health
from app.config.settings import settings
from app.graphql.schema import schema
from app.graphql.context import create_graphql_context
from app.middleware import setup_security_middleware
from app.api.health import include_health_routes
from app.services.continuous_monitoring import continuous_monitoring
from health import get_health, get_simple_health
from app.health import get_auth_health, get_auth_health_simple

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Application metadata
APP_NAME = settings.app_name
API_VERSION = settings.api_version  
ENVIRONMENT = settings.environment


def get_local_ip_address() -> str:
    """
    Get the local IP address of the machine for development mode
    This helps with cross-platform mobile testing
    """
    try:
        # Connect to a remote address to determine local IP
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("8.8.8.8", 80))
            return s.getsockname()[0]
    except Exception:
        return "127.0.0.1"


def get_development_cors_origins() -> List[str]:
    """
    Get CORS origins for development including dynamic IP detection
    """
    base_origins = settings.cors_origins.copy()
    
    if ENVIRONMENT == "development":
        local_ip = get_local_ip_address()
        logger.info(f"Detected local IP address: {local_ip}")
        
        # Add dynamic IP-based origins for mobile development
        dynamic_origins = [
            f"http://{local_ip}:8001",
            f"http://{local_ip}:8082",
            f"http://{local_ip}:8083",
            f"http://{local_ip}:8084",
            f"http://{local_ip}:8085",
            f"http://{local_ip}:19006",
            f"http://{local_ip}:3000",
            # Add localhost origins for all ports
            "http://localhost:8084",
            "http://localhost:8085"
        ]
        
        base_origins.extend(dynamic_origins)
        logger.info(f"Development CORS origins: {base_origins}")
    
    return base_origins



@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager with Canadian compliance
    Handles startup and shutdown events for PIPEDA compliance
    """
    # Startup
    logger.info(f"Starting {APP_NAME} v{API_VERSION} in {ENVIRONMENT} mode")
    logger.info(f"Data region: {settings.data_region}")
    logger.info(f"PIPEDA compliance: Active")
    logger.info(f"Rate limiting enabled: {settings.rate_limiting_enabled}")
    logger.info(f"Environment: {settings.environment}")
    
    try:
        # Initialize database connections
        logger.info("Initializing database connections...")
        await init_database()
        
        # Verify database health
        db_health = await check_database_health()
        if db_health["status"] != "healthy":
            raise Exception(f"Database health check failed: {db_health.get('error')}")
        
        logger.info("Database initialization completed successfully")

        # Initialize observability and continuous monitoring
        logger.info("Starting continuous monitoring service...")

        # Start monitoring in background (non-blocking)
        import asyncio
        asyncio.create_task(continuous_monitoring.start())

        logger.info("Continuous monitoring service started")

        # TODO: Initialize other services
        # - Redis connections for caching and background jobs
        # - External API clients (Supabase, OCR services, etc.)
        # - Background job queues (RQ)
        # - ML model loading for predictions
        # - Notification services setup

        logger.info("Application startup complete - Ready to serve requests")
        
    except Exception as e:
        logger.error(f"Failed to start application: {e}")
        raise
    
    yield
    
    # Shutdown
    logger.info("Starting graceful application shutdown")
    
    try:
        # Stop continuous monitoring
        logger.info("Stopping continuous monitoring...")
        continuous_monitoring.stop()

        # Close database connections
        logger.info("Closing database connections...")
        await close_database()

        # TODO: Clean up other resources
        # - Close Redis connections
        # - Stop background job workers
        # - Clean up temporary files
        # - Flush audit logs
        # - Stop external service connections

        logger.info("Application shutdown complete")
        
    except Exception as e:
        logger.error(f"Error during shutdown: {e}")
        # Continue shutdown even if there are errors


# Create FastAPI application
app = FastAPI(
    title=APP_NAME,
    version=API_VERSION,
    description="Canadian diaper planning application backend API",
    docs_url="/docs" if ENVIRONMENT != "production" else None,
    redoc_url="/redoc" if ENVIRONMENT != "production" else None,
    openapi_url="/openapi.json" if ENVIRONMENT != "production" else None,
    lifespan=lifespan
)

# CORS middleware configuration (PIPEDA compliant)
cors_origins = get_development_cors_origins()
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
)

# Trusted host middleware - only in production for security
if ENVIRONMENT == "production":
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=[
            "localhost",
            "*.railway.app", 
            "*.nestsync.ca"
        ]
    )
else:
    # In development, skip TrustedHostMiddleware to allow flexible IP access
    logger.info("Development mode: TrustedHostMiddleware disabled for flexible IP access")

# Add comprehensive security middleware for PIPEDA compliance
setup_security_middleware(app)

# Custom OpenAPI schema for Canadian compliance
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title=APP_NAME,
        version=API_VERSION,
        description="Canadian diaper planning application API - PIPEDA compliant",
        routes=app.routes,
    )
    
    # Add Canadian compliance information
    openapi_schema["info"]["contact"] = {
        "name": "NestSync Support",
        "email": "support@nestsync.ca",
        "url": "https://nestsync.ca"
    }
    
    openapi_schema["info"]["license"] = {
        "name": "Proprietary",
        "url": "https://nestsync.ca/terms"
    }
    
    # Add server information
    openapi_schema["servers"] = [
        {
            "url": "https://api.nestsync.ca",
            "description": "Production server (Canada Central)"
        },
        {
            "url": "https://staging-api.nestsync.ca", 
            "description": "Staging server (Canada Central)"
        }
    ]
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi


# Health check endpoints
@app.get("/health", tags=["Health"])
async def health_check():
    """
    Comprehensive health check endpoint for monitoring
    Returns detailed system status for Railway health checks
    """
    try:
        health_status = await get_health()
        
        # Return appropriate HTTP status based on health
        if health_status["status"] == "healthy":
            return JSONResponse(content=health_status, status_code=200)
        else:
            return JSONResponse(content=health_status, status_code=503)
            
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return JSONResponse(
            content={
                "status": "error",
                "error": str(e),
                "timestamp": "2024-01-01T00:00:00Z"
            },
            status_code=503
        )


@app.get("/health/simple", tags=["Health"])
async def simple_health_check():
    """
    Simple health check for basic monitoring
    Lightweight endpoint for load balancers
    """
    health_status = get_simple_health()
    status_code = 200 if health_status["status"] == "healthy" else 503
    return JSONResponse(content=health_status, status_code=status_code)


@app.get("/health/auth", tags=["Health", "Authentication"])
async def auth_health_check():
    """
    Comprehensive authentication system health check
    Tests critical auth paths and gotrue compatibility
    """
    try:
        auth_status = await get_auth_health()

        # Return appropriate HTTP status based on auth health
        if auth_status["status"] == "healthy":
            return JSONResponse(content=auth_status, status_code=200)
        elif auth_status["status"] == "unhealthy":
            return JSONResponse(content=auth_status, status_code=503)
        else:  # critical
            return JSONResponse(content=auth_status, status_code=503)

    except Exception as e:
        logger.error(f"Auth health check failed: {str(e)}")
        return JSONResponse(
            content={
                "status": "critical",
                "error": str(e),
                "timestamp": "2024-01-01T00:00:00Z",
                "critical_failures": ["health_check_exception"]
            },
            status_code=503
        )


@app.get("/health/auth/simple", tags=["Health", "Authentication"])
async def simple_auth_health_check():
    """
    Simple authentication health check for monitoring alerts
    Lightweight endpoint for authentication status monitoring
    """
    try:
        auth_status = await get_auth_health_simple()
        status_code = 200 if auth_status["healthy"] else 503
        return JSONResponse(content=auth_status, status_code=status_code)
    except Exception as e:
        logger.error(f"Simple auth health check failed: {str(e)}")
        return JSONResponse(
            content={
                "status": "critical",
                "healthy": False,
                "error": str(e),
                "critical_failures": ["health_check_exception"]
            },
            status_code=503
        )


@app.get("/", tags=["Root"])
async def root():
    """
    Root endpoint with API information
    """
    return {
        "name": APP_NAME,
        "version": API_VERSION,
        "environment": ENVIRONMENT,
        "status": "running",
        "region": "Canada",
        "compliance": "PIPEDA",
        "docs_url": "/docs" if ENVIRONMENT != "production" else None,
        "health_url": "/health"
    }


@app.get("/info", tags=["Info"])
async def app_info():
    """
    Application information endpoint
    """
    return {
        "application": {
            "name": APP_NAME,
            "version": API_VERSION,
            "environment": ENVIRONMENT,
            "region": os.getenv("DATA_REGION", "canada-central"),
            "timezone": os.getenv("TZ", "America/Toronto")
        },
        "compliance": {
            "pipeda_compliant": True,
            "data_residency": "Canada",
            "privacy_policy": "https://nestsync.ca/privacy"
        },
        "features": {
            "graphql_endpoint": "/graphql",
            "health_checks": "/health",
            "documentation": "/docs" if ENVIRONMENT != "production" else None
        }
    }


# Error handlers
@app.exception_handler(404)
async def not_found_handler(request, exc):
    return JSONResponse(
        status_code=404,
        content={
            "error": "Not Found",
            "message": "The requested resource was not found",
            "path": str(request.url.path)
        }
    )


@app.exception_handler(500)
async def internal_server_error_handler(request, exc):
    logger.error(f"Internal server error: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "message": "An unexpected error occurred",
            "request_id": None  # Add request ID if you implement request tracking
        }
    )


# =============================================================================
# GraphQL Endpoint Configuration
# =============================================================================

# Add specific OPTIONS handler for GraphQL endpoint BEFORE mounting router
@app.options("/graphql")
async def graphql_options():
    return {"message": "OK"}

# Configure GraphQL router with custom context
graphql_app = GraphQLRouter(
    schema=schema,
    context_getter=create_graphql_context,
    graphiql=ENVIRONMENT != "production"  # Enable GraphiQL in development
)

# Mount GraphQL endpoint
app.include_router(
    graphql_app,
    prefix="/graphql",
    tags=["GraphQL API", "Authentication", "Onboarding"]
)

# Include observability and monitoring health routes
include_health_routes(app)

# =============================================================================
# Additional API Routes (Future Implementation)
# =============================================================================

# TODO: Add REST API routes for specific functionality
# These would complement the GraphQL API for specific use cases

# Health check routes (already implemented above)
# Authentication routes (implemented via GraphQL)
# Onboarding routes (implemented via GraphQL)
# User management routes (implemented via GraphQL)
# Child management routes (implemented via GraphQL)
# Consent management routes (implemented via GraphQL)

# Future routes to implement:
# - File upload routes (receipt OCR, profile pictures)
# - Webhook routes (Supabase, payment processing)
# - Admin routes (user management, system monitoring)
# - Integration routes (external APIs, data export/import)


if __name__ == "__main__":
    import uvicorn
    
    # Development server configuration
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=ENVIRONMENT == "development",
        log_level="info"
    )