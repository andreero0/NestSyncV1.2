"""
NestSync Configuration Management
PIPEDA-compliant Canadian diaper planning application
"""

import os
from typing import Optional, List
from pydantic_settings import BaseSettings
from pydantic import validator, Field
from functools import lru_cache


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
    supabase_key: str = Field(..., env="SUPABASE_KEY")
    supabase_service_key: str = Field(..., env="SUPABASE_SERVICE_KEY")
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
    
    # Rate limiting
    rate_limit_requests: int = Field(default=100, env="RATE_LIMIT_REQUESTS")
    rate_limit_window: int = Field(default=900, env="RATE_LIMIT_WINDOW")  # 15 minutes
    
    # =============================================================================
    # CORS Configuration
    # =============================================================================
    cors_origins: List[str] = Field(
        default=[
            "http://localhost:3000",
            "http://localhost:19006",
            "http://localhost:8082",
            "http://localhost:8083",
            "http://localhost:8084",
            "http://localhost:8088",
            "https://*.nestsync.ca"
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
        env_file = ".env"
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