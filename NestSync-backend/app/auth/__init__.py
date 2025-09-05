"""
Authentication module for NestSync
PIPEDA-compliant Canadian authentication system
"""

from .supabase import SupabaseAuth, supabase_auth
from .dependencies import (
    get_current_user,
    get_current_user_optional,
    require_verified_user,
    require_onboarded_user,
    require_consents,
    get_request_context,
    RequestContext,
    AuthenticationError,
    AuthorizationError
)

__all__ = [
    "SupabaseAuth",
    "supabase_auth",
    "get_current_user",
    "get_current_user_optional",
    "require_verified_user", 
    "require_onboarded_user",
    "require_consents",
    "get_request_context",
    "RequestContext",
    "AuthenticationError",
    "AuthorizationError"
]