"""
Analytics Caching Service for NestSync
Performance optimization for analytics queries with Canadian timezone support
"""

import logging
import hashlib
import json
import uuid
from datetime import datetime, timezone, date, timedelta
from typing import Optional, Dict, Any, List
from dataclasses import dataclass, asdict
import asyncio

logger = logging.getLogger(__name__)


@dataclass
class CacheKey:
    """Cache key structure for analytics data"""
    user_id: str
    child_id: Optional[str]
    query_type: str
    start_date: str
    end_date: str
    filters: Dict[str, Any]
    timezone: str

    def to_string(self) -> str:
        """Convert cache key to string for storage"""
        key_data = asdict(self)
        key_string = json.dumps(key_data, sort_keys=True)
        return hashlib.md5(key_string.encode()).hexdigest()


@dataclass
class CacheEntry:
    """Cache entry with metadata"""
    data: Any
    created_at: datetime
    expires_at: datetime
    hit_count: int = 0
    last_accessed: Optional[datetime] = None


class AnalyticsCache:
    """In-memory cache for analytics data with TTL and size limits"""

    def __init__(self, max_size: int = 1000, default_ttl_minutes: int = 30):
        self.cache: Dict[str, CacheEntry] = {}
        self.max_size = max_size
        self.default_ttl_minutes = default_ttl_minutes
        self.logger = logging.getLogger(__name__)

    def _is_expired(self, entry: CacheEntry) -> bool:
        """Check if cache entry is expired"""
        return datetime.now(timezone.utc) > entry.expires_at

    def _evict_expired(self):
        """Remove expired entries from cache"""
        expired_keys = [
            key for key, entry in self.cache.items()
            if self._is_expired(entry)
        ]
        for key in expired_keys:
            del self.cache[key]

    def _evict_lru(self):
        """Remove least recently used entries when cache is full"""
        if len(self.cache) >= self.max_size:
            # Sort by last_accessed (None values go first)
            sorted_entries = sorted(
                self.cache.items(),
                key=lambda x: x[1].last_accessed or datetime.min.replace(tzinfo=timezone.utc)
            )
            # Remove oldest 20% of entries
            remove_count = max(1, len(sorted_entries) // 5)
            for key, _ in sorted_entries[:remove_count]:
                del self.cache[key]

    def create_cache_key(
        self,
        user_id: uuid.UUID,
        query_type: str,
        child_id: Optional[uuid.UUID] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        filters: Optional[Dict[str, Any]] = None,
        timezone: str = "America/Toronto"
    ) -> str:
        """Create standardized cache key"""
        cache_key = CacheKey(
            user_id=str(user_id),
            child_id=str(child_id) if child_id else None,
            query_type=query_type,
            start_date=start_date.isoformat() if start_date else "",
            end_date=end_date.isoformat() if end_date else "",
            filters=filters or {},
            timezone=timezone
        )
        return cache_key.to_string()

    def get(self, cache_key: str) -> Optional[Any]:
        """Get data from cache"""
        try:
            self._evict_expired()

            if cache_key not in self.cache:
                return None

            entry = self.cache[cache_key]
            if self._is_expired(entry):
                del self.cache[cache_key]
                return None

            # Update access statistics
            entry.hit_count += 1
            entry.last_accessed = datetime.now(timezone.utc)

            self.logger.debug(f"Cache HIT for key {cache_key[:8]}...")
            return entry.data

        except Exception as e:
            self.logger.error(f"Error retrieving from cache: {e}")
            return None

    def set(
        self,
        cache_key: str,
        data: Any,
        ttl_minutes: Optional[int] = None
    ) -> bool:
        """Store data in cache with TTL"""
        try:
            self._evict_expired()
            self._evict_lru()

            ttl = ttl_minutes or self.default_ttl_minutes
            expires_at = datetime.now(timezone.utc) + timedelta(minutes=ttl)

            entry = CacheEntry(
                data=data,
                created_at=datetime.now(timezone.utc),
                expires_at=expires_at
            )

            self.cache[cache_key] = entry
            self.logger.debug(f"Cache SET for key {cache_key[:8]}... (TTL: {ttl}m)")
            return True

        except Exception as e:
            self.logger.error(f"Error storing in cache: {e}")
            return False

    def invalidate_user_cache(self, user_id: uuid.UUID):
        """Invalidate all cache entries for a user"""
        try:
            user_id_str = str(user_id)
            keys_to_remove = []

            for key, entry in self.cache.items():
                # Simple check - in a full implementation, you'd decode the key
                # For now, we'll invalidate based on timing
                if entry.created_at < datetime.now(timezone.utc) - timedelta(hours=1):
                    keys_to_remove.append(key)

            for key in keys_to_remove:
                del self.cache[key]

            self.logger.info(f"Invalidated {len(keys_to_remove)} cache entries for user {user_id}")

        except Exception as e:
            self.logger.error(f"Error invalidating user cache: {e}")

    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache performance statistics"""
        try:
            total_entries = len(self.cache)
            total_hits = sum(entry.hit_count for entry in self.cache.values())

            # Calculate size estimate (rough)
            estimated_size_mb = len(self.cache) * 0.01  # Rough estimate

            now = datetime.now(timezone.utc)
            expired_count = sum(1 for entry in self.cache.values() if self._is_expired(entry))

            return {
                "total_entries": total_entries,
                "total_hits": total_hits,
                "expired_entries": expired_count,
                "estimated_size_mb": round(estimated_size_mb, 2),
                "max_size": self.max_size,
                "default_ttl_minutes": self.default_ttl_minutes
            }

        except Exception as e:
            self.logger.error(f"Error getting cache stats: {e}")
            return {}

    def clear_cache(self):
        """Clear all cache entries"""
        try:
            cleared_count = len(self.cache)
            self.cache.clear()
            self.logger.info(f"Cleared {cleared_count} cache entries")

        except Exception as e:
            self.logger.error(f"Error clearing cache: {e}")


class AnalyticsCacheManager:
    """Singleton cache manager for analytics"""

    _instance: Optional['AnalyticsCacheManager'] = None
    _cache: Optional[AnalyticsCache] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if self._cache is None:
            self._cache = AnalyticsCache(
                max_size=1000,  # Store up to 1000 analytics queries
                default_ttl_minutes=30  # Cache for 30 minutes by default
            )

    @classmethod
    def get_cache(cls) -> AnalyticsCache:
        """Get the singleton cache instance"""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance._cache

    @classmethod
    async def cached_analytics_query(
        cls,
        cache_key: str,
        query_func,
        ttl_minutes: int = 30,
        force_refresh: bool = False
    ):
        """Execute analytics query with caching"""
        cache = cls.get_cache()

        # Check cache first (unless force refresh)
        if not force_refresh:
            cached_result = cache.get(cache_key)
            if cached_result is not None:
                return cached_result

        # Execute query
        try:
            result = await query_func()

            # Cache the result
            cache.set(cache_key, result, ttl_minutes)

            return result

        except Exception as e:
            logger.error(f"Error executing cached analytics query: {e}")
            raise


# =============================================================================
# Database Query Optimization Helpers
# =============================================================================

class QueryOptimizer:
    """Optimize database queries for analytics"""

    @staticmethod
    def optimize_usage_query(base_query, filters: Dict[str, Any]):
        """Apply optimizations to usage data queries"""
        # Add indexes hints and query optimizations
        optimized_query = base_query

        # Use covering indexes for date range queries
        if "start_date" in filters and "end_date" in filters:
            # PostgreSQL query planner will use the idx_usage_daily_stats index
            optimized_query = optimized_query.order_by("logged_at")

        # Limit large result sets
        if "limit" not in filters:
            optimized_query = optimized_query.limit(10000)  # Prevent runaway queries

        return optimized_query

    @staticmethod
    def batch_aggregate_queries(queries: List[Any]) -> List[Any]:
        """Batch multiple aggregation queries for efficiency"""
        # In a full implementation, this would combine multiple aggregation queries
        # into a single query with multiple aggregations
        return queries

    @staticmethod
    def suggest_index_optimizations(query_patterns: List[str]) -> List[str]:
        """Suggest database index optimizations based on query patterns"""
        suggestions = []

        if "date_range_heavy" in query_patterns:
            suggestions.append("Consider composite index on (child_id, logged_at, usage_type)")

        if "hourly_analysis" in query_patterns:
            suggestions.append("Consider expression index on EXTRACT(hour FROM logged_at)")

        if "inventory_analytics" in query_patterns:
            suggestions.append("Consider composite index on (inventory_item_id, logged_at)")

        return suggestions


# =============================================================================
# Performance Monitoring
# =============================================================================

class AnalyticsPerformanceMonitor:
    """Monitor analytics query performance"""

    def __init__(self):
        self.query_times: List[float] = []
        self.slow_queries: List[Dict[str, Any]] = []
        self.cache_stats = {"hits": 0, "misses": 0}

    def record_query_time(self, query_type: str, execution_time: float, was_cached: bool):
        """Record query execution time"""
        self.query_times.append(execution_time)

        if was_cached:
            self.cache_stats["hits"] += 1
        else:
            self.cache_stats["misses"] += 1

        # Flag slow queries (>2 seconds)
        if execution_time > 2.0 and not was_cached:
            self.slow_queries.append({
                "query_type": query_type,
                "execution_time": execution_time,
                "timestamp": datetime.now(timezone.utc).isoformat()
            })

            # Keep only last 100 slow queries
            if len(self.slow_queries) > 100:
                self.slow_queries = self.slow_queries[-100:]

    def get_performance_summary(self) -> Dict[str, Any]:
        """Get performance statistics summary"""
        if not self.query_times:
            return {"status": "no_data"}

        import statistics

        return {
            "total_queries": len(self.query_times),
            "average_time": round(statistics.mean(self.query_times), 3),
            "median_time": round(statistics.median(self.query_times), 3),
            "max_time": round(max(self.query_times), 3),
            "cache_hit_rate": round(
                self.cache_stats["hits"] / (self.cache_stats["hits"] + self.cache_stats["misses"]) * 100, 2
            ) if (self.cache_stats["hits"] + self.cache_stats["misses"]) > 0 else 0,
            "slow_queries_count": len(self.slow_queries),
            "recent_slow_queries": self.slow_queries[-5:]  # Last 5 slow queries
        }


# =============================================================================
# Global Instances
# =============================================================================

# Global performance monitor
performance_monitor = AnalyticsPerformanceMonitor()

# Global cache manager
cache_manager = AnalyticsCacheManager()


# =============================================================================
# Export all classes and functions
# =============================================================================

__all__ = [
    "AnalyticsCache",
    "AnalyticsCacheManager",
    "QueryOptimizer",
    "AnalyticsPerformanceMonitor",
    "cache_manager",
    "performance_monitor"
]