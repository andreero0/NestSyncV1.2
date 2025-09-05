"""
Security Middleware for NestSync
PIPEDA-compliant security and rate limiting
"""

import time
import logging
from typing import Dict, Any, Optional
from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from app.config.settings import settings

logger = logging.getLogger(__name__)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Add security headers for PIPEDA compliance and general security
    """
    
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # Security headers for Canadian compliance
        security_headers = {
            # HTTPS enforcement
            "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
            
            # Content security
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "X-XSS-Protection": "1; mode=block",
            
            # Content Security Policy for PIPEDA compliance
            "Content-Security-Policy": (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
                "style-src 'self' 'unsafe-inline'; "
                "img-src 'self' data: https:; "
                "font-src 'self' https:; "
                "connect-src 'self' https://api.nestsync.ca wss://api.nestsync.ca; "
                "frame-src 'none'; "
                "object-src 'none'; "
                "base-uri 'self'"
            ),
            
            # Privacy and data protection
            "Referrer-Policy": "strict-origin-when-cross-origin",
            "Permissions-Policy": (
                "geolocation=(self), "
                "microphone=(), "
                "camera=(), "
                "payment=(self), "
                "usb=(), "
                "magnetometer=(), "
                "gyroscope=(), "
                "speaker=()"
            ),
            
            # Canadian compliance headers
            "X-Data-Residency": "Canada",
            "X-Privacy-Compliance": "PIPEDA",
            "X-Content-Language": "en-CA,fr-CA"
        }
        
        # Add headers to response
        for header, value in security_headers.items():
            response.headers[header] = value
        
        return response


class RateLimitingMiddleware(BaseHTTPMiddleware):
    """
    Basic rate limiting middleware for API protection
    """
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
        self.requests: Dict[str, list] = {}
        self.cleanup_interval = 60  # Clean up old requests every minute
        self.last_cleanup = time.time()
    
    def get_client_identifier(self, request: Request) -> str:
        """
        Get client identifier for rate limiting
        """
        # Check for X-Forwarded-For header first (proxy/load balancer)
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        # Check for X-Real-IP header
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip.strip()
        
        # Fall back to direct connection IP
        return request.client.host if request.client else "unknown"
    
    def is_rate_limited(self, client_id: str, max_requests: int = None, window: int = None) -> bool:
        """
        Check if client is rate limited
        """
        max_requests = max_requests or settings.rate_limit_requests
        window = window or settings.rate_limit_window
        
        current_time = time.time()
        
        # Clean up old requests periodically
        if current_time - self.last_cleanup > self.cleanup_interval:
            self.cleanup_old_requests(current_time - window)
            self.last_cleanup = current_time
        
        # Get or create request list for client
        if client_id not in self.requests:
            self.requests[client_id] = []
        
        client_requests = self.requests[client_id]
        
        # Remove requests outside the window
        client_requests[:] = [req_time for req_time in client_requests if current_time - req_time < window]
        
        # Check if limit is exceeded
        if len(client_requests) >= max_requests:
            return True
        
        # Add current request
        client_requests.append(current_time)
        return False
    
    def cleanup_old_requests(self, cutoff_time: float):
        """
        Clean up old request records
        """
        for client_id in list(self.requests.keys()):
            self.requests[client_id] = [
                req_time for req_time in self.requests[client_id] 
                if req_time > cutoff_time
            ]
            
            # Remove empty entries
            if not self.requests[client_id]:
                del self.requests[client_id]
    
    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for health checks
        if request.url.path in ["/health", "/health/simple"]:
            return await call_next(request)
        
        client_id = self.get_client_identifier(request)
        
        # Different limits for different endpoints
        if request.url.path.startswith("/graphql"):
            # More restrictive for GraphQL
            max_requests = 50
            window = 900  # 15 minutes
        elif request.url.path.startswith("/auth"):
            # Very restrictive for auth endpoints
            max_requests = 10
            window = 300  # 5 minutes
        else:
            # Default limits
            max_requests = settings.rate_limit_requests
            window = settings.rate_limit_window
        
        if self.is_rate_limited(client_id, max_requests, window):
            logger.warning(f"Rate limit exceeded for client: {client_id}")
            return JSONResponse(
                status_code=429,
                content={
                    "error": "Rate limit exceeded",
                    "message": f"Too many requests. Limit: {max_requests} per {window} seconds",
                    "retry_after": window
                },
                headers={
                    "Retry-After": str(window),
                    "X-RateLimit-Limit": str(max_requests),
                    "X-RateLimit-Window": str(window)
                }
            )
        
        return await call_next(request)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Log requests for audit trail and PIPEDA compliance
    """
    
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        # Get client info for audit trail
        client_ip = self.get_client_ip(request)
        user_agent = request.headers.get("User-Agent", "unknown")
        
        # Process request
        response = await call_next(request)
        
        # Calculate processing time
        process_time = time.time() - start_time
        
        # Log request for audit trail
        log_data = {
            "method": request.method,
            "url": str(request.url),
            "client_ip": client_ip,
            "user_agent": user_agent,
            "status_code": response.status_code,
            "process_time": round(process_time, 4),
            "content_length": response.headers.get("content-length", 0)
        }
        
        # Log at appropriate level
        if response.status_code >= 500:
            logger.error(f"Request failed: {log_data}")
        elif response.status_code >= 400:
            logger.warning(f"Client error: {log_data}")
        else:
            logger.info(f"Request processed: {log_data}")
        
        # Add processing time header
        response.headers["X-Process-Time"] = str(process_time)
        
        return response
    
    def get_client_ip(self, request: Request) -> str:
        """
        Get client IP for audit trail
        """
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip.strip()
        
        return request.client.host if request.client else "unknown"


class PIPEDAAuditMiddleware(BaseHTTPMiddleware):
    """
    PIPEDA-specific audit logging middleware
    """
    
    async def dispatch(self, request: Request, call_next):
        # Track sensitive operations for PIPEDA compliance
        sensitive_paths = [
            "/graphql",  # All GraphQL operations
            "/auth",     # Authentication operations
            "/user",     # User data operations
            "/consent",  # Consent management
            "/children"  # Child data operations
        ]
        
        is_sensitive = any(request.url.path.startswith(path) for path in sensitive_paths)
        
        if is_sensitive:
            # Log PIPEDA-relevant information
            audit_info = {
                "timestamp": time.time(),
                "client_ip": self.get_client_ip(request),
                "user_agent": request.headers.get("User-Agent"),
                "method": request.method,
                "path": request.url.path,
                "has_auth": "Authorization" in request.headers,
                "content_type": request.headers.get("Content-Type"),
                "data_residency": "Canada",
                "compliance_framework": "PIPEDA"
            }
            
            logger.info(f"PIPEDA Audit: {audit_info}")
        
        response = await call_next(request)
        
        # Log response for sensitive operations
        if is_sensitive:
            response_audit = {
                "status_code": response.status_code,
                "response_size": response.headers.get("content-length", 0),
                "data_modified": request.method in ["POST", "PUT", "PATCH", "DELETE"],
                "compliance_check": "passed" if response.status_code < 400 else "review_required"
            }
            
            logger.info(f"PIPEDA Response Audit: {response_audit}")
        
        return response
    
    def get_client_ip(self, request: Request) -> str:
        """
        Get client IP for audit trail
        """
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip.strip()
        
        return request.client.host if request.client else "unknown"


def setup_security_middleware(app: FastAPI):
    """
    Set up all security middleware for the application
    """
    # Add middleware in reverse order (last added = first executed)
    
    # 1. PIPEDA audit logging (innermost - closest to routes)
    app.add_middleware(PIPEDAAuditMiddleware)
    
    # 2. Request logging for general audit trail
    app.add_middleware(RequestLoggingMiddleware)
    
    # 3. Rate limiting for API protection
    app.add_middleware(RateLimitingMiddleware)
    
    # 4. Security headers (outermost - applied to all responses)
    app.add_middleware(SecurityHeadersMiddleware)
    
    logger.info("Security middleware configured for PIPEDA compliance")


# =============================================================================
# Export Middleware Components
# =============================================================================

__all__ = [
    "SecurityHeadersMiddleware",
    "RateLimitingMiddleware", 
    "RequestLoggingMiddleware",
    "PIPEDAAuditMiddleware",
    "setup_security_middleware"
]