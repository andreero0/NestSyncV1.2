"""
NestSync Configuration Management
PIPEDA-compliant Canadian diaper planning application
"""

import os
import math
import logging
from typing import Optional, List
from pydantic_settings import BaseSettings
from pydantic import validator, Field
from functools import lru_cache

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    """
    Application settings with Canadian compliance and security configurations
    """
    
    # =============================================================================
    # Application Configuration
    # =============================================================================
    app_name: str = Field(default="NestSync API", env="APP_NAME")
    api_version: str = Field(default="1.0.0", env="API_VERSION")
    environment: str = Field(default="development", env="ENVIRONMENT")
    debug: bool = Field(default=False, env="DEBUG")
    
    # Data residency compliance
    data_region: str = Field(default="canada-central", env="DATA_REGION")
    timezone: str = Field(default="America/Toronto", env="TZ")
    
    # =============================================================================
    # Database Configuration (Supabase PostgreSQL)
    # =============================================================================
    database_url: str = Field(..., env="DATABASE_URL")
    database_pool_size: int = Field(default=20, env="DATABASE_POOL_SIZE")
    database_max_overflow: int = Field(default=30, env="DATABASE_MAX_OVERFLOW")
    database_pool_timeout: int = Field(default=30, env="DATABASE_POOL_TIMEOUT")
    
    # =============================================================================
    # Supabase Configuration
    # =============================================================================
    supabase_url: str = Field(..., env="SUPABASE_URL")
    supabase_key: str = Field(..., env="SUPABASE_ANON_KEY")
    supabase_service_key: str = Field(..., env="SUPABASE_SERVICE_ROLE_KEY")
    supabase_jwt_secret: str = Field(..., env="SUPABASE_JWT_SECRET")
    
    # =============================================================================
    # Redis Configuration (Background Jobs & Caching)
    # =============================================================================
    redis_url: str = Field(default="redis://localhost:6379", env="REDIS_URL")
    redis_db: int = Field(default=0, env="REDIS_DB")
    redis_password: Optional[str] = Field(default=None, env="REDIS_PASSWORD")
    redis_ssl: bool = Field(default=False, env="REDIS_SSL")
    
    # =============================================================================
    # Security Configuration
    # =============================================================================
    secret_key: str = Field(..., env="SECRET_KEY")
    jwt_algorithm: str = Field(default="HS256", env="JWT_ALGORITHM")
    access_token_expire_hours: int = Field(default=24, env="ACCESS_TOKEN_EXPIRE_HOURS")
    refresh_token_expire_days: int = Field(default=30, env="REFRESH_TOKEN_EXPIRE_DAYS")
    
    # Password security
    password_min_length: int = Field(default=8, env="PASSWORD_MIN_LENGTH")
    password_require_uppercase: bool = Field(default=True, env="PASSWORD_REQUIRE_UPPERCASE")
    password_require_lowercase: bool = Field(default=True, env="PASSWORD_REQUIRE_LOWERCASE")
    password_require_numbers: bool = Field(default=True, env="PASSWORD_REQUIRE_NUMBERS")
    password_require_symbols: bool = Field(default=False, env="PASSWORD_REQUIRE_SYMBOLS")
    
    # Rate limiting - Adjusted for development and real-time dashboard updates
    rate_limit_requests: int = Field(default=300, env="RATE_LIMIT_REQUESTS")  # Increased for dashboard polling
    rate_limit_window: int = Field(default=300, env="RATE_LIMIT_WINDOW")  # 5 minutes - more reasonable window
    rate_limiting_enabled: bool = Field(default=True, env="RATE_LIMITING_ENABLED")  # Toggle rate limiting on/off

    @validator("rate_limiting_enabled")
    def validate_rate_limiting_production(cls, v, values):
        """
        Enforce rate limiting in production environments
        SECURITY: Prevents DoS attacks and API abuse - CRITICAL for PIPEDA compliance
        """
        environment = values.get("environment", "development")

        # CRITICAL: Rate limiting cannot be disabled in production
        if environment == "production" and not v:
            raise ValueError(
                "SECURITY ERROR: Rate limiting cannot be disabled in production environment. "
                "This is a critical security requirement for PIPEDA compliance and DoS prevention. "
                "Set RATE_LIMITING_ENABLED=true or remove the environment variable."
            )

        # WARNING: Rate limiting should be enabled in staging
        if environment == "staging" and not v:
            logger.warning(
                "Rate limiting is DISABLED in staging environment. "
                "This should only be done for load testing purposes. "
                "Re-enable before promoting to production."
            )

        return v

    @validator("rate_limit_requests")
    def validate_rate_limit_reasonable(cls, v):
        """Ensure rate limits are reasonable"""
        if v < 10:
            raise ValueError("Rate limit too restrictive (minimum 10 requests)")
        if v > 10000:
            raise ValueError("Rate limit too permissive (maximum 10000 requests)")
        return v

    @validator("secret_key")
    def validate_secret_key_strength(cls, v):
        """
        Validate JWT secret key has adequate entropy
        SECURITY: Prevents token forgery via weak secret brute force
        CWE-798: Use of Hard-coded Credentials
        """
        # Minimum length requirement
        if len(v) < 64:
            raise ValueError(
                f"SECRET_KEY must be at least 64 characters for adequate security. "
                f"Current length: {len(v)}. "
                "Generate a secure key with: openssl rand -base64 64"
            )

        # Maximum length (prevent DoS)
        if len(v) > 512:
            raise ValueError(
                "SECRET_KEY too long (max 512 characters). "
                "This may indicate misconfiguration."
            )

        # Check for common weak patterns
        weak_patterns = [
            "your-production-jwt-secret",
            "change-this-secret",
            "secret-key-here",
            "jwt-secret",
            "12345",
            "password",
            "admin",
            "secret",
            "test",
            "demo",
            "example",
            "sample",
            "default",
            "changeme",
            "placeholder"
        ]

        v_lower = v.lower()
        for pattern in weak_patterns:
            if pattern in v_lower:
                raise ValueError(
                    f"SECRET_KEY contains weak pattern: '{pattern}'. "
                    "Use a cryptographically random secret. "
                    "Generate with: openssl rand -base64 64"
                )

        # Calculate Shannon entropy
        entropy = cls._calculate_entropy(v)
        min_entropy_bits = 256  # Minimum 256 bits of entropy

        if entropy < min_entropy_bits:
            raise ValueError(
                f"SECRET_KEY has insufficient entropy: {entropy:.1f} bits. "
                f"Minimum required: {min_entropy_bits} bits. "
                "Use a cryptographically random secret. "
                "Generate with: openssl rand -base64 64"
            )

        logger.info(f"SECRET_KEY validated: {len(v)} characters, {entropy:.1f} bits entropy")
        return v

    @staticmethod
    def _calculate_entropy(secret: str) -> float:
        """Calculate Shannon entropy of secret string in bits"""
        if not secret:
            return 0.0

        # Count character frequencies
        char_counts = {}
        for char in secret:
            char_counts[char] = char_counts.get(char, 0) + 1

        # Calculate Shannon entropy
        entropy = 0.0
        secret_len = len(secret)

        for count in char_counts.values():
            probability = count / secret_len
            entropy -= probability * math.log2(probability)

        # Multiply by length to get total entropy in bits
        return entropy * secret_len

    @validator("supabase_jwt_secret")
    def validate_supabase_jwt_secret(cls, v):
        """
        Validate Supabase JWT secret strength
        SECURITY: Supabase JWT secrets should be at least 32 characters
        """
        if len(v) < 32:
            raise ValueError(
                "SUPABASE_JWT_SECRET must be at least 32 characters. "
                "This should be provided by Supabase in your project settings."
            )
        return v

    # =============================================================================
    # CORS Configuration
    # =============================================================================
    cors_origins: List[str] = Field(
        default=[
            "http://localhost:3000",
            "http://localhost:8081",
            "http://localhost:8082",
            "http://localhost:8083",
            "http://localhost:8084",
            "http://localhost:8088",
            "http://localhost:19006", 
            "https://nestsync.ca",
            "http://localhost:8000"
        ],
        env="CORS_ORIGINS"
    )
    
    @validator("cors_origins", pre=True)
    def validate_cors_origins(cls, v):
        if isinstance(v, str):
            # Handle JSON array format from environment variables
            if v.startswith('[') and v.endswith(']'):
                import json
                try:
                    return json.loads(v)
                except json.JSONDecodeError:
                    # Fallback to manual parsing for malformed JSON
                    v = v.strip('[]')
                    origins = []
                    for item in v.split(','):
                        item = item.strip().strip('"').strip("'")
                        if item:
                            origins.append(item)
                    return origins
            else:
                # Handle comma-separated format
                return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v
    
    # =============================================================================
    # External Services Configuration
    # =============================================================================
    # Notification services
    sendgrid_api_key: Optional[str] = Field(default=None, env="SENDGRID_API_KEY")
    twilio_account_sid: Optional[str] = Field(default=None, env="TWILIO_ACCOUNT_SID")
    twilio_auth_token: Optional[str] = Field(default=None, env="TWILIO_AUTH_TOKEN")
    twilio_phone_number: Optional[str] = Field(default=None, env="TWILIO_PHONE_NUMBER")
    
    # OCR Services
    google_vision_credentials: Optional[str] = Field(default=None, env="GOOGLE_VISION_CREDENTIALS")
    aws_access_key_id: Optional[str] = Field(default=None, env="AWS_ACCESS_KEY_ID")
    aws_secret_access_key: Optional[str] = Field(default=None, env="AWS_SECRET_ACCESS_KEY")
    aws_region: str = Field(default="ca-central-1", env="AWS_REGION")
    
    # Maps API
    google_maps_api_key: Optional[str] = Field(default=None, env="GOOGLE_MAPS_API_KEY")
    
    # =============================================================================
    # PIPEDA Compliance Configuration
    # =============================================================================
    data_retention_days: int = Field(default=2555, env="DATA_RETENTION_DAYS")  # 7 years
    consent_version: str = Field(default="1.0", env="CONSENT_VERSION")
    privacy_policy_url: str = Field(
        default="https://nestsync.ca/privacy", 
        env="PRIVACY_POLICY_URL"
    )
    terms_of_service_url: str = Field(
        default="https://nestsync.ca/terms", 
        env="TERMS_OF_SERVICE_URL"
    )
    
    # Data subject rights
    data_portability_enabled: bool = Field(default=True, env="DATA_PORTABILITY_ENABLED")
    data_deletion_enabled: bool = Field(default=True, env="DATA_DELETION_ENABLED")
    consent_withdrawal_enabled: bool = Field(default=True, env="CONSENT_WITHDRAWAL_ENABLED")
    
    # =============================================================================
    # Stripe Payment Configuration (Canadian Billing)
    # =============================================================================
    stripe_publishable_key: str = Field(..., env="STRIPE_PUBLISHABLE_KEY")
    stripe_secret_key: str = Field(..., env="STRIPE_SECRET_KEY")
    stripe_webhook_secret: str = Field(..., env="STRIPE_WEBHOOK_SECRET")

    # Stripe price IDs for Canadian subscription tiers
    stripe_basic_price_id: str = Field(..., env="STRIPE_BASIC_PRICE_ID")
    stripe_premium_price_id: str = Field(..., env="STRIPE_PREMIUM_PRICE_ID")
    stripe_family_price_id: str = Field(..., env="STRIPE_FAMILY_PRICE_ID")

    # Canadian marketplace affiliate IDs
    amazon_ca_affiliate_id: Optional[str] = Field(default=None, env="AMAZON_CA_AFFILIATE_ID")
    walmart_ca_partner_id: Optional[str] = Field(default=None, env="WALMART_CA_PARTNER_ID")

    # =============================================================================
    # Monitoring and Logging
    # =============================================================================
    sentry_dsn: Optional[str] = Field(default=None, env="SENTRY_DSN")
    log_level: str = Field(default="INFO", env="LOG_LEVEL")
    log_format: str = Field(
        default="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        env="LOG_FORMAT"
    )
    
    # =============================================================================
    # Feature Flags (for onboarding flow)
    # =============================================================================
    enable_biometric_auth: bool = Field(default=True, env="ENABLE_BIOMETRIC_AUTH")
    enable_analytics_consent: bool = Field(default=True, env="ENABLE_ANALYTICS_CONSENT")
    enable_marketing_consent: bool = Field(default=True, env="ENABLE_MARKETING_CONSENT")
    
    # Onboarding wizard configuration
    max_children_per_user: int = Field(default=10, env="MAX_CHILDREN_PER_USER")
    default_diaper_brands: List[str] = Field(
        default=["Huggies", "Pampers", "Honest", "Kirkland", "Parent's Choice"],
        env="DEFAULT_DIAPER_BRANDS"
    )
    
    @validator("default_diaper_brands", pre=True)
    def validate_diaper_brands(cls, v):
        if isinstance(v, str):
            return v.split(",")
        return v
    
    # =============================================================================
    # Validation Methods
    # =============================================================================
    @validator("environment")
    def validate_environment(cls, v):
        if v not in ["development", "staging", "production"]:
            raise ValueError("Environment must be development, staging, or production")
        return v
    
    @validator("data_region")
    def validate_data_region(cls, v):
        # Ensure Canadian data residency
        canadian_regions = [
            "canada-central", "canada-east", "ca-central-1", "ca-west-1"
        ]
        if v not in canadian_regions:
            raise ValueError(f"Data region must be in Canada: {canadian_regions}")
        return v
    
    @validator("password_min_length")
    def validate_password_length(cls, v):
        if v < 8:
            raise ValueError("Password minimum length must be at least 8 characters")
        return v
    
    class Config:
        env_file = [".env.local", ".env"]  # Load .env.local first, then .env
        env_file_encoding = "utf-8"
        case_sensitive = False
        extra = "ignore"  # Allow extra fields from environment


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached application settings
    """
    return Settings()


# Export commonly used settings
settings = get_settings()