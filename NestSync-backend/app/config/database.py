"""
Database Configuration and Connection Management
Supabase PostgreSQL with Canadian data residency
"""

import logging
from typing import AsyncGenerator, Optional
from sqlalchemy import create_engine, MetaData, event, text
from sqlalchemy.ext.asyncio import (
    AsyncEngine, 
    AsyncSession, 
    create_async_engine, 
    async_sessionmaker
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.pool import QueuePool
from sqlalchemy.orm import sessionmaker, Session

from .settings import settings

# Configure logging
logger = logging.getLogger(__name__)

# =============================================================================
# Security Configuration
# =============================================================================

# Allowed Canadian timezones for SQL injection prevention
ALLOWED_TIMEZONES = [
    'America/Toronto',      # Eastern Time (Ontario, Quebec)
    'America/Vancouver',    # Pacific Time (British Columbia)
    'America/Edmonton',     # Mountain Time (Alberta)
    'America/Winnipeg',     # Central Time (Manitoba)
    'America/Halifax',      # Atlantic Time (Nova Scotia, New Brunswick)
    'America/St_Johns',     # Newfoundland Time
    'America/Regina',       # Saskatchewan (no DST)
    'America/Yellowknife',  # Northwest Territories
    'America/Whitehorse',   # Yukon
    'America/Iqaluit',      # Nunavut (Eastern)
    'America/Rankin_Inlet', # Nunavut (Central)
    'UTC',                  # UTC for testing
]


def set_timezone(cursor, timezone: str) -> None:
    """
    Safely set database timezone with validation.
    
    Args:
        cursor: Database cursor
        timezone: Timezone string to set
        
    Raises:
        ValueError: If timezone is not in the allowlist
    """
    if timezone not in ALLOWED_TIMEZONES:
        raise ValueError(
            f"Invalid timezone: {timezone}. "
            f"Must be one of: {', '.join(ALLOWED_TIMEZONES)}"
        )
    # nosemgrep: python.lang.security.audit.formatted-sql-query
    # Security Control: timezone validated against ALLOWED_TIMEZONES allowlist (lines 27-40)
    # Validated By: tests/security/test_sql_injection.py::test_timezone_validation_rejects_invalid
    # Safe to use string formatting here because timezone is validated against allowlist
    # This prevents SQL injection while working with raw DBAPI cursor
    cursor.execute(f"SET timezone = '{timezone}'")


# =============================================================================
# Database Metadata and Base Model
# =============================================================================
metadata = MetaData()
Base = declarative_base(metadata=metadata)

# =============================================================================
# Database Engine Configuration
# =============================================================================

# Async engine for FastAPI
async_engine: Optional[AsyncEngine] = None

# Sync engine for migrations and admin tasks
sync_engine = None

# Session factories
AsyncSessionLocal: Optional[async_sessionmaker[AsyncSession]] = None
SessionLocal: Optional[sessionmaker[Session]] = None


def create_database_engines():
    """
    Create database engines with proper configuration for Canadian compliance
    """
    global async_engine, sync_engine, AsyncSessionLocal, SessionLocal
    
    # Async engine configuration  
    async_engine = create_async_engine(
        settings.database_url,
        pool_size=settings.database_pool_size,
        max_overflow=settings.database_max_overflow,
        pool_recycle=3600,  # Recycle connections every hour
        pool_pre_ping=True,  # Verify connections before use
        echo=settings.debug,  # Log SQL queries in debug mode
        future=True,
        connect_args={
            "server_settings": {
                "application_name": f"{settings.app_name}_v{settings.api_version}",
                "timezone": settings.timezone,
            }
        }
    )
    
    # Sync engine for migrations (convert async URL to sync)
    sync_url = settings.database_url.replace("postgresql+asyncpg://", "postgresql://")
    sync_engine = create_engine(
        sync_url,
        poolclass=QueuePool,
        pool_size=10,
        max_overflow=20,
        pool_timeout=30,
        pool_recycle=3600,
        pool_pre_ping=True,
        echo=settings.debug,
        future=True,
        connect_args={
            "options": f"-c timezone={settings.timezone}"
        }
    )
    
    # Session factories
    AsyncSessionLocal = async_sessionmaker(
        async_engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=True,
        autocommit=False
    )
    
    SessionLocal = sessionmaker(
        sync_engine,
        autocommit=False,
        autoflush=False
    )
    
    # Add event listeners for security and compliance
    setup_database_events()
    
    logger.info(f"Database engines configured for {settings.data_region}")


def setup_database_events():
    """
    Set up database event listeners for auditing and compliance
    """
    
    @event.listens_for(async_engine.sync_engine if async_engine else None, "connect")
    def receive_connect(dbapi_connection, connection_record):
        """Set up connection-level configuration for PIPEDA compliance"""
        connection_record.info['connected_at'] = True
        logger.info("Database connection established")
        
        # Set Canadian timezone with validation
        cursor = dbapi_connection.cursor()
        try:
            # nosemgrep: python.lang.security.audit.formatted-sql-query
            # Security Control: set_timezone() validates against ALLOWED_TIMEZONES allowlist
            # Validated By: tests/security/test_sql_injection.py::test_settings_timezone_in_allowlist
            set_timezone(cursor, settings.timezone)
            cursor.execute("SET statement_timeout = '300s'")  # 5 minute query timeout
            dbapi_connection.commit()
        except ValueError as e:
            logger.error(f"Invalid timezone configuration: {e}")
            cursor.close()
            raise
        finally:
            cursor.close()
            
    
    @event.listens_for(sync_engine if sync_engine else None, "connect")
    def receive_sync_connect(dbapi_connection, connection_record):
        """Set up sync connection configuration"""
        cursor = dbapi_connection.cursor()
        try:
            # nosemgrep: python.lang.security.audit.formatted-sql-query
            # Security Control: set_timezone() validates against ALLOWED_TIMEZONES allowlist
            # Validated By: tests/security/test_sql_injection.py::test_settings_timezone_in_allowlist
            set_timezone(cursor, settings.timezone)
            cursor.execute("SET statement_timeout = '300s'")
            dbapi_connection.commit()
        except ValueError as e:
            logger.error(f"Invalid timezone configuration: {e}")
            cursor.close()
            raise
        finally:
            cursor.close()


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency to get async database session
    """
    if not AsyncSessionLocal:
        raise RuntimeError("Database not initialized. Call create_database_engines() first.")
    
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception as e:
            await session.rollback()
            logger.error(f"Database session error: {e}")
            raise
        finally:
            await session.close()


def get_sync_session() -> Session:
    """
    Get synchronous database session for migrations and admin tasks
    """
    if not SessionLocal:
        raise RuntimeError("Database not initialized. Call create_database_engines() first.")
    
    return SessionLocal()


async def init_database():
    """
    Initialize database connection and verify connectivity
    """
    create_database_engines()
    
    # Verify async connection
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
            logger.info("Async database connection verified")
    except Exception as e:
        logger.error(f"Failed to verify async database connection: {e}")
        raise
    
    # Verify sync connection
    try:
        with SessionLocal() as session:
            session.execute(text("SELECT 1"))
            logger.info("Sync database connection verified")
    except Exception as e:
        logger.error(f"Failed to verify sync database connection: {e}")
        raise


async def close_database():
    """
    Close database connections gracefully
    """
    global async_engine, sync_engine
    
    if async_engine:
        await async_engine.dispose()
        logger.info("Async database engine disposed")
    
    if sync_engine:
        sync_engine.dispose()
        logger.info("Sync database engine disposed")


# =============================================================================
# Database Health Check
# =============================================================================

async def refresh_database_metadata():
    """
    Refresh SQLAlchemy metadata to recognize newly created tables
    This is useful when tables are created after application startup
    """
    try:
        if not async_engine:
            logger.error("Cannot refresh metadata: async engine not initialized")
            return False

        # Reflect the current database schema
        async with async_engine.begin() as conn:
            await conn.run_sync(metadata.reflect)
            logger.info("Database metadata refreshed successfully")
            return True

    except Exception as e:
        logger.error(f"Failed to refresh database metadata: {e}")
        return False


async def verify_table_exists(table_name: str) -> bool:
    """
    Verify if a specific table exists in the database
    """
    try:
        if not AsyncSessionLocal:
            return False

        async with AsyncSessionLocal() as session:
            # Query information_schema to check if table exists
            result = await session.execute(
                text("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_schema = 'public'
                    AND table_name = :table_name
                )
                """),
                {"table_name": table_name}
            )
            exists = result.scalar()
            return bool(exists)

    except Exception as e:
        logger.error(f"Failed to verify table {table_name} exists: {e}")
        return False


async def check_database_health() -> dict:
    """
    Check database connectivity and performance for health checks
    """
    try:
        if not AsyncSessionLocal:
            return {
                "status": "unhealthy",
                "error": "Database not initialized"
            }

        # Test connection and query performance
        import time
        start_time = time.time()

        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))

        response_time = round((time.time() - start_time) * 1000, 2)  # ms

        return {
            "status": "healthy",
            "response_time_ms": response_time,
            "pool_size": settings.database_pool_size,
            "region": settings.data_region,
            "timezone": settings.timezone
        }

    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e)
        }


# =============================================================================
# Context Managers for Transaction Management
# =============================================================================

class DatabaseTransaction:
    """
    Context manager for database transactions with proper error handling
    """
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def __aenter__(self):
        return self.session
    
    async def __afinish__(self, exc_type, exc_val, exc_tb):
        if exc_type:
            await self.session.rollback()
            logger.error(f"Transaction rolled back due to: {exc_val}")
        else:
            await self.session.commit()
            logger.debug("Transaction committed successfully")


# =============================================================================
# Export commonly used components
# =============================================================================

__all__ = [
    "Base",
    "metadata",
    "async_engine",
    "sync_engine",
    "get_async_session",
    "get_sync_session",
    "init_database",
    "close_database",
    "check_database_health",
    "refresh_database_metadata",
    "verify_table_exists",
    "DatabaseTransaction",
    "create_database_engines"
]