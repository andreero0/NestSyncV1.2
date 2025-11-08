# NestSync Analytics Dashboard Technical Architecture

## Executive Summary

This document provides the complete technical architecture for implementing an advanced analytics dashboard within the NestSync diaper planning application. The dashboard will progressively enhance the existing `planner.tsx` implementation with dynamic data visualizations using Victory Native XL, while maintaining PIPEDA compliance and psychology-driven UX principles.

### Key Architectural Decisions

- **Chart Library**: Victory Native XL (React Native compatible, high performance, 126 code snippets, trust score 8.5)
- **Backup Option**: React Native Gifted Charts (324 code snippets, trust score 9.6, simpler API)
- **Data Strategy**: Real-time analytics with intelligent caching for performance
- **Enhancement Approach**: Progressive enhancement of existing static planner.tsx
- **Feature Model**: Free tier with basic analytics, premium tier with ML-powered insights
- **Compliance**: Full PIPEDA compliance with Canadian data residency

## System Architecture Overview

### Component Architecture

```
NestSync Analytics Dashboard
├── Frontend (React Native + Expo)
│   ├── Enhanced planner.tsx (Progressive Enhancement)
│   ├── Victory Native XL Chart Components
│   ├── Analytics Hook Layer (useAnalytics)
│   └── Apollo Client Integration
│
├── Backend (FastAPI + GraphQL)
│   ├── Analytics Resolvers (New)
│   ├── Enhanced Dashboard Stats (Extended)
│   ├── Caching Layer (Redis)
│   └── ML Analytics Service (Premium Features)
│
├── Database (Supabase PostgreSQL)
│   ├── Optimized Indexes for Analytics
│   ├── Analytics Views for Performance
│   └── Usage Log Aggregation Tables
│
└── Data Pipeline
    ├── Real-time Usage Aggregation
    ├── Pattern Analysis (ML)
    └── Predictive Analytics (Premium)
```

## Backend Architecture

### 1. Enhanced GraphQL Analytics Schema

#### New Analytics Types

```python
# app/graphql/analytics_types.py

@strawberry.type
class UsagePatternStats:
    """Usage pattern analytics"""
    average_daily_changes: float
    peak_usage_hours: List[int]
    weekend_vs_weekday_ratio: float
    most_common_intervals: List[int]
    condition_breakdown: DiaperConditionStats

@strawberry.type
class DiaperConditionStats:
    """Diaper condition analytics"""
    wet_only_percentage: float
    soiled_only_percentage: float
    both_percentage: float
    clean_changes_percentage: float

@strawberry.type
class WeeklyTrends:
    """Weekly usage trends"""
    current_week_total: int
    previous_week_total: int
    week_over_week_change: float
    daily_averages: List[DailyUsagePoint]

@strawberry.type
class DailyUsagePoint:
    """Single day usage data point"""
    date: date
    usage_count: int
    average_interval_minutes: Optional[float]

@strawberry.type
class MonthlyAnalytics:
    """Monthly usage analytics"""
    month_total: int
    monthly_average: float
    projected_month_end: int
    size_changes: List[SizeChangeEvent]

@strawberry.type
class SizeChangeEvent:
    """Diaper size change tracking"""
    date: date
    old_size: DiaperSizeType
    new_size: DiaperSizeType
    child_age_days: int

@strawberry.type
class InventoryEfficiencyStats:
    """Inventory usage efficiency"""
    average_product_lifespan_days: float
    waste_percentage: float
    cost_per_change: Optional[float]
    brand_performance_scores: List[BrandPerformance]

@strawberry.type
class BrandPerformance:
    """Brand performance metrics"""
    brand: str
    usage_count: int
    leakage_rate: float
    user_rating: Optional[float]
    would_rebuy_percentage: float

@strawberry.type
class PredictiveInsights:
    """ML-powered predictive insights (Premium Feature)"""
    next_size_change_prediction: Optional[date]
    inventory_depletion_forecast: List[InventoryForecast]
    usage_pattern_anomalies: List[UsageAnomaly]
    optimal_purchase_timing: List[PurchaseRecommendation]

@strawberry.type
class InventoryForecast:
    """Inventory depletion forecast"""
    product_type: str
    brand: str
    size: str
    estimated_depletion_date: date
    recommended_reorder_date: date
    confidence_score: float

@strawberry.type
class UsageAnomaly:
    """Usage pattern anomaly detection"""
    date: date
    anomaly_type: str
    description: str
    severity: str
    suggested_action: Optional[str]

@strawberry.type
class PurchaseRecommendation:
    """Optimized purchase recommendations"""
    product_type: str
    size: str
    recommended_quantity: int
    optimal_purchase_date: date
    estimated_savings: Optional[float]
    reasoning: str

@strawberry.type
class EnhancedDashboardStats:
    """Enhanced dashboard statistics extending basic DashboardStats"""
    # Existing fields from DashboardStats
    days_remaining: Optional[int]
    diapers_left: int
    last_change: Optional[str]
    today_changes: int
    current_size: Optional[str]

    # New analytics fields
    usage_patterns: UsagePatternStats
    weekly_trends: WeeklyTrends
    monthly_analytics: MonthlyAnalytics
    inventory_efficiency: InventoryEfficiencyStats

    # Premium features (subscription required)
    predictive_insights: Optional[PredictiveInsights]

@strawberry.type
class AnalyticsTimeRange:
    """Time range for analytics queries"""
    start_date: date
    end_date: date
    range_type: AnalyticsRangeType

@strawberry.enum
class AnalyticsRangeType(Enum):
    WEEK = "week"
    MONTH = "month"
    QUARTER = "quarter"
    YEAR = "year"
    CUSTOM = "custom"

@strawberry.input
class AnalyticsFilterInput:
    """Analytics filter options"""
    child_id: strawberry.ID
    time_range: AnalyticsTimeRange
    include_predictions: bool = False
    chart_type: Optional[str] = None
```

#### New Analytics Resolvers

```python
# app/graphql/analytics_resolvers.py

@strawberry.type
class AnalyticsQueries:
    """Advanced analytics queries"""

    @strawberry.field
    async def get_enhanced_dashboard_stats(
        self,
        child_id: strawberry.ID,
        info: Info,
        include_premium: bool = False
    ) -> EnhancedDashboardStats:
        """
        Get comprehensive dashboard analytics
        """
        try:
            async for session in get_async_session():
                child_uuid = uuid.UUID(child_id)

                # Get basic dashboard stats (existing functionality)
                basic_stats = await self._get_basic_dashboard_stats(session, child_uuid)

                # Get usage patterns
                usage_patterns = await self._calculate_usage_patterns(session, child_uuid)

                # Get weekly trends
                weekly_trends = await self._calculate_weekly_trends(session, child_uuid)

                # Get monthly analytics
                monthly_analytics = await self._calculate_monthly_analytics(session, child_uuid)

                # Get inventory efficiency
                inventory_efficiency = await self._calculate_inventory_efficiency(session, child_uuid)

                # Get premium features if requested and user has subscription
                predictive_insights = None
                if include_premium and await self._user_has_premium_subscription(info):
                    predictive_insights = await self._calculate_predictive_insights(session, child_uuid)

                return EnhancedDashboardStats(
                    # Basic stats
                    days_remaining=basic_stats.days_remaining,
                    diapers_left=basic_stats.diapers_left,
                    last_change=basic_stats.last_change,
                    today_changes=basic_stats.today_changes,
                    current_size=basic_stats.current_size,

                    # Analytics
                    usage_patterns=usage_patterns,
                    weekly_trends=weekly_trends,
                    monthly_analytics=monthly_analytics,
                    inventory_efficiency=inventory_efficiency,
                    predictive_insights=predictive_insights
                )

        except Exception as e:
            logger.error(f"Error getting enhanced dashboard stats: {e}")
            # Return basic stats on error
            return await self._get_fallback_stats(child_id)

    async def _calculate_usage_patterns(self, session: AsyncSession, child_uuid: uuid.UUID) -> UsagePatternStats:
        """Calculate usage pattern statistics"""

        # Get last 30 days of usage data
        thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)

        usage_query = select(UsageLog).where(
            and_(
                UsageLog.child_id == child_uuid,
                UsageLog.usage_type == "diaper_change",
                UsageLog.logged_at >= thirty_days_ago,
                UsageLog.is_deleted == False
            )
        ).order_by(UsageLog.logged_at)

        result = await session.execute(usage_query)
        usage_logs = result.scalars().all()

        if not usage_logs:
            return self._get_default_usage_patterns()

        # Calculate average daily changes
        days_count = min(30, (datetime.now(timezone.utc) - thirty_days_ago).days)
        average_daily_changes = len(usage_logs) / days_count if days_count > 0 else 0

        # Calculate peak usage hours
        hour_counts = {}
        for log in usage_logs:
            hour = log.logged_at.hour
            hour_counts[hour] = hour_counts.get(hour, 0) + 1

        peak_hours = sorted(hour_counts.keys(), key=lambda h: hour_counts[h], reverse=True)[:3]

        # Calculate weekend vs weekday ratio
        weekend_changes = sum(1 for log in usage_logs if log.logged_at.weekday() >= 5)
        weekday_changes = len(usage_logs) - weekend_changes
        weekend_vs_weekday_ratio = (weekend_changes / max(weekday_changes, 1)) if weekday_changes > 0 else 0

        # Calculate most common intervals
        intervals = []
        for i in range(1, len(usage_logs)):
            interval = (usage_logs[i].logged_at - usage_logs[i-1].logged_at).total_seconds() / 3600
            if 0.5 <= interval <= 12:  # Filter reasonable intervals
                intervals.append(int(interval))

        interval_counts = {}
        for interval in intervals:
            interval_counts[interval] = interval_counts.get(interval, 0) + 1

        most_common_intervals = sorted(interval_counts.keys(), key=lambda i: interval_counts[i], reverse=True)[:3]

        # Calculate condition breakdown
        condition_stats = self._calculate_condition_breakdown(usage_logs)

        return UsagePatternStats(
            average_daily_changes=round(average_daily_changes, 1),
            peak_usage_hours=peak_hours,
            weekend_vs_weekday_ratio=round(weekend_vs_weekday_ratio, 2),
            most_common_intervals=most_common_intervals,
            condition_breakdown=condition_stats
        )

    async def _calculate_weekly_trends(self, session: AsyncSession, child_uuid: uuid.UUID) -> WeeklyTrends:
        """Calculate weekly usage trends"""

        # Get last 14 days for comparison
        fourteen_days_ago = datetime.now(timezone.utc) - timedelta(days=14)
        seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)

        # Current week
        current_week_query = select(func.count(UsageLog.id)).where(
            and_(
                UsageLog.child_id == child_uuid,
                UsageLog.usage_type == "diaper_change",
                UsageLog.logged_at >= seven_days_ago,
                UsageLog.is_deleted == False
            )
        )
        current_week_result = await session.execute(current_week_query)
        current_week_total = current_week_result.scalar() or 0

        # Previous week
        previous_week_query = select(func.count(UsageLog.id)).where(
            and_(
                UsageLog.child_id == child_uuid,
                UsageLog.usage_type == "diaper_change",
                UsageLog.logged_at >= fourteen_days_ago,
                UsageLog.logged_at < seven_days_ago,
                UsageLog.is_deleted == False
            )
        )
        previous_week_result = await session.execute(previous_week_query)
        previous_week_total = previous_week_result.scalar() or 0

        # Calculate week-over-week change
        week_over_week_change = 0.0
        if previous_week_total > 0:
            week_over_week_change = ((current_week_total - previous_week_total) / previous_week_total) * 100

        # Get daily averages for last 7 days
        daily_averages = await self._calculate_daily_averages(session, child_uuid, 7)

        return WeeklyTrends(
            current_week_total=current_week_total,
            previous_week_total=previous_week_total,
            week_over_week_change=round(week_over_week_change, 1),
            daily_averages=daily_averages
        )

    async def _calculate_monthly_analytics(self, session: AsyncSession, child_uuid: uuid.UUID) -> MonthlyAnalytics:
        """Calculate monthly analytics"""

        # Get current month data
        now = datetime.now(timezone.utc)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        month_total_query = select(func.count(UsageLog.id)).where(
            and_(
                UsageLog.child_id == child_uuid,
                UsageLog.usage_type == "diaper_change",
                UsageLog.logged_at >= month_start,
                UsageLog.is_deleted == False
            )
        )
        month_total_result = await session.execute(month_total_query)
        month_total = month_total_result.scalar() or 0

        # Calculate monthly average (based on days elapsed)
        days_elapsed = (now - month_start).days + 1
        monthly_average = month_total / days_elapsed if days_elapsed > 0 else 0

        # Project month end total
        days_in_month = (month_start.replace(month=month_start.month + 1) - month_start).days
        projected_month_end = int(monthly_average * days_in_month)

        # Get size changes (simplified for now)
        size_changes = []  # TODO: Implement size change tracking

        return MonthlyAnalytics(
            month_total=month_total,
            monthly_average=round(monthly_average, 1),
            projected_month_end=projected_month_end,
            size_changes=size_changes
        )

    async def _calculate_inventory_efficiency(self, session: AsyncSession, child_uuid: uuid.UUID) -> InventoryEfficiencyStats:
        """Calculate inventory efficiency metrics"""

        # Get inventory items with usage data
        inventory_query = select(InventoryItem).where(
            and_(
                InventoryItem.child_id == child_uuid,
                InventoryItem.product_type == "diaper",
                InventoryItem.is_deleted == False
            )
        ).options(selectinload(InventoryItem.usage_logs))

        result = await session.execute(inventory_query)
        inventory_items = result.scalars().all()

        if not inventory_items:
            return self._get_default_efficiency_stats()

        # Calculate metrics
        total_lifespan_days = 0
        total_items = 0
        total_cost = 0
        total_usage = 0
        brand_data = {}

        for item in inventory_items:
            if item.opened_date and item.quantity_remaining == 0:
                # Calculate lifespan for fully used items
                usage_logs = [log for log in item.usage_logs if not log.is_deleted]
                if usage_logs:
                    last_usage = max(log.logged_at for log in usage_logs)
                    lifespan = (last_usage - item.opened_date).days
                    total_lifespan_days += lifespan
                    total_items += 1

            # Cost calculations
            if item.cost_cad:
                total_cost += float(item.cost_cad)
                total_usage += (item.quantity_total - item.quantity_remaining)

            # Brand performance
            brand = item.brand
            if brand not in brand_data:
                brand_data[brand] = {
                    'usage_count': 0,
                    'leakage_count': 0,
                    'ratings': [],
                    'would_rebuy_count': 0,
                    'total_assessments': 0
                }

            usage_logs = [log for log in item.usage_logs if not log.is_deleted]
            brand_data[brand]['usage_count'] += len(usage_logs)
            brand_data[brand]['leakage_count'] += sum(1 for log in usage_logs if log.had_leakage)

            if item.quality_rating:
                brand_data[brand]['ratings'].append(item.quality_rating)

            if item.would_rebuy is not None:
                brand_data[brand]['total_assessments'] += 1
                if item.would_rebuy:
                    brand_data[brand]['would_rebuy_count'] += 1

        # Calculate averages
        average_lifespan = total_lifespan_days / total_items if total_items > 0 else 0
        cost_per_change = total_cost / total_usage if total_usage > 0 else None

        # Build brand performance list
        brand_performances = []
        for brand, data in brand_data.items():
            leakage_rate = (data['leakage_count'] / data['usage_count']) * 100 if data['usage_count'] > 0 else 0
            avg_rating = sum(data['ratings']) / len(data['ratings']) if data['ratings'] else None
            rebuy_percentage = (data['would_rebuy_count'] / data['total_assessments']) * 100 if data['total_assessments'] > 0 else 0

            brand_performances.append(BrandPerformance(
                brand=brand,
                usage_count=data['usage_count'],
                leakage_rate=round(leakage_rate, 1),
                user_rating=round(avg_rating, 1) if avg_rating else None,
                would_rebuy_percentage=round(rebuy_percentage, 1)
            ))

        return InventoryEfficiencyStats(
            average_product_lifespan_days=round(average_lifespan, 1),
            waste_percentage=0.0,  # TODO: Calculate based on expired items
            cost_per_change=round(cost_per_change, 2) if cost_per_change else None,
            brand_performance_scores=brand_performances
        )

    async def _calculate_predictive_insights(self, session: AsyncSession, child_uuid: uuid.UUID) -> PredictiveInsights:
        """Calculate ML-powered predictive insights (Premium Feature)"""

        # TODO: Implement ML predictions using existing numpy/pandas dependencies
        # This is a placeholder that would integrate with the ML pipeline

        return PredictiveInsights(
            next_size_change_prediction=None,
            inventory_depletion_forecast=[],
            usage_pattern_anomalies=[],
            optimal_purchase_timing=[]
        )
```

### 2. Database Optimization Strategy

#### New Indexes for Analytics Performance

```sql
-- Analytics-optimized indexes for usage_logs table
CREATE INDEX CONCURRENTLY idx_usage_analytics_child_date_type
ON usage_logs (child_id, logged_at DESC, usage_type)
WHERE is_deleted = false;

CREATE INDEX CONCURRENTLY idx_usage_analytics_child_date_condition
ON usage_logs (child_id, logged_at DESC, was_wet, was_soiled, diaper_condition)
WHERE is_deleted = false AND usage_type = 'diaper_change';

CREATE INDEX CONCURRENTLY idx_usage_analytics_time_patterns
ON usage_logs (child_id, EXTRACT(hour FROM logged_at), EXTRACT(dow FROM logged_at))
WHERE is_deleted = false AND usage_type = 'diaper_change';

CREATE INDEX CONCURRENTLY idx_usage_analytics_intervals
ON usage_logs (child_id, logged_at, time_since_last_change)
WHERE is_deleted = false AND usage_type = 'diaper_change';

-- Inventory analytics indexes
CREATE INDEX CONCURRENTLY idx_inventory_analytics_child_product
ON inventory_items (child_id, product_type, brand, created_at DESC)
WHERE is_deleted = false;

CREATE INDEX CONCURRENTLY idx_inventory_analytics_usage_tracking
ON inventory_items (child_id, opened_date, quantity_total, quantity_remaining)
WHERE is_deleted = false AND opened_date IS NOT NULL;
```

#### Analytics Materialized Views

```sql
-- Daily usage aggregation view
CREATE MATERIALIZED VIEW daily_usage_stats AS
SELECT
    child_id,
    DATE(logged_at AT TIME ZONE 'America/Toronto') as usage_date,
    COUNT(*) as daily_changes,
    AVG(time_since_last_change) as avg_interval_minutes,
    COUNT(*) FILTER (WHERE was_wet = true) as wet_changes,
    COUNT(*) FILTER (WHERE was_soiled = true) as soiled_changes,
    COUNT(*) FILTER (WHERE had_leakage = true) as leakage_changes
FROM usage_logs
WHERE usage_type = 'diaper_change' AND is_deleted = false
GROUP BY child_id, DATE(logged_at AT TIME ZONE 'America/Toronto');

CREATE UNIQUE INDEX ON daily_usage_stats (child_id, usage_date);

-- Weekly usage aggregation view
CREATE MATERIALIZED VIEW weekly_usage_stats AS
SELECT
    child_id,
    DATE_TRUNC('week', logged_at AT TIME ZONE 'America/Toronto') as week_start,
    COUNT(*) as weekly_changes,
    AVG(time_since_last_change) as avg_interval_minutes,
    ARRAY_AGG(EXTRACT(hour FROM logged_at) ORDER BY logged_at) as hourly_distribution
FROM usage_logs
WHERE usage_type = 'diaper_change' AND is_deleted = false
GROUP BY child_id, DATE_TRUNC('week', logged_at AT TIME ZONE 'America/Toronto');

CREATE UNIQUE INDEX ON weekly_usage_stats (child_id, week_start);

-- Auto-refresh materialized views
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY daily_usage_stats;
    REFRESH MATERIALIZED VIEW CONCURRENTLY weekly_usage_stats;
END;
$$ LANGUAGE plpgsql;

-- Schedule refresh every hour
SELECT cron.schedule('refresh-analytics', '0 * * * *', 'SELECT refresh_analytics_views();');
```

### 3. Caching Strategy

#### Redis Cache Layer

```python
# app/services/analytics_cache.py

import redis
import json
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import hashlib

class AnalyticsCache:
    """Redis-based caching for analytics data"""

    def __init__(self):
        self.redis_client = redis.Redis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            db=settings.REDIS_ANALYTICS_DB,
            decode_responses=True
        )
        self.default_ttl = 3600  # 1 hour
        self.short_ttl = 300     # 5 minutes for real-time data

    def _generate_cache_key(self, child_id: str, query_type: str, **params) -> str:
        """Generate consistent cache key"""
        key_data = f"{child_id}:{query_type}:{json.dumps(params, sort_keys=True)}"
        key_hash = hashlib.md5(key_data.encode()).hexdigest()
        return f"analytics:{key_hash}"

    def get_enhanced_dashboard_stats(self, child_id: str, include_premium: bool = False) -> Optional[Dict[str, Any]]:
        """Get cached dashboard stats"""
        key = self._generate_cache_key(child_id, "enhanced_dashboard", include_premium=include_premium)
        cached_data = self.redis_client.get(key)

        if cached_data:
            return json.loads(cached_data)
        return None

    def set_enhanced_dashboard_stats(self, child_id: str, data: Dict[str, Any], include_premium: bool = False):
        """Cache dashboard stats"""
        key = self._generate_cache_key(child_id, "enhanced_dashboard", include_premium=include_premium)
        ttl = self.short_ttl if not include_premium else self.default_ttl

        self.redis_client.setex(
            key,
            ttl,
            json.dumps(data, default=str)
        )

    def get_usage_patterns(self, child_id: str, days: int = 30) -> Optional[Dict[str, Any]]:
        """Get cached usage patterns"""
        key = self._generate_cache_key(child_id, "usage_patterns", days=days)
        cached_data = self.redis_client.get(key)

        if cached_data:
            return json.loads(cached_data)
        return None

    def set_usage_patterns(self, child_id: str, data: Dict[str, Any], days: int = 30):
        """Cache usage patterns"""
        key = self._generate_cache_key(child_id, "usage_patterns", days=days)
        self.redis_client.setex(key, self.default_ttl, json.dumps(data, default=str))

    def invalidate_child_cache(self, child_id: str):
        """Invalidate all cache for a child when new data is logged"""
        pattern = f"analytics:*{child_id}*"
        keys = self.redis_client.keys(pattern)
        if keys:
            self.redis_client.delete(*keys)
```

## Frontend Architecture

### 1. Progressive Enhancement of planner.tsx

#### Enhanced Data Layer Integration

```typescript
// hooks/useAnalytics.ts

import { useQuery } from '@apollo/client';
import { ENHANCED_DASHBOARD_STATS_QUERY } from '@/lib/graphql/analytics_queries';

export interface UseAnalyticsOptions {
  childId: string;
  includePremium?: boolean;
  refreshInterval?: number;
}

export interface EnhancedDashboardStats {
  // Basic stats (existing)
  daysRemaining?: number;
  diapersLeft: number;
  lastChange?: string;
  todayChanges: number;
  currentSize?: string;

  // Analytics (new)
  usagePatterns: UsagePatternStats;
  weeklyTrends: WeeklyTrends;
  monthlyAnalytics: MonthlyAnalytics;
  inventoryEfficiency: InventoryEfficiencyStats;
  predictiveInsights?: PredictiveInsights;
}

export function useAnalytics({ childId, includePremium = false, refreshInterval = 300000 }: UseAnalyticsOptions) {
  const { data, loading, error, refetch } = useQuery(ENHANCED_DASHBOARD_STATS_QUERY, {
    variables: {
      childId,
      includePremium
    },
    pollInterval: refreshInterval, // 5 minutes default
    errorPolicy: 'all', // Show partial data on errors
    notifyOnNetworkStatusChange: true,
  });

  return {
    stats: data?.getEnhancedDashboardStats as EnhancedDashboardStats | undefined,
    isLoading: loading,
    error,
    refetch,
    // Helper functions
    hasUsageData: data?.getEnhancedDashboardStats?.usagePatterns?.averageDailyChanges > 0,
    isPremiumUser: !!data?.getEnhancedDashboardStats?.predictiveInsights,
  };
}
```

#### Updated planner.tsx with Analytics Integration

```typescript
// app/(tabs)/planner.tsx (Enhanced)

import React, { useState, useMemo, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@apollo/client';
import { useLocalSearchParams } from 'expo-router';

// Existing imports
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { GET_INVENTORY_ITEMS_QUERY, MY_CHILDREN_QUERY } from '@/lib/graphql/queries';
import { NestSyncColors } from '@/constants/Colors';
import { formatDiaperSize } from '@/utils/formatters';
import { EditInventoryModal } from '@/components/modals/EditInventoryModal';
import { useAsyncStorage } from '@/hooks/useUniversalStorage';

// New analytics imports
import { useAnalytics } from '@/hooks/useAnalytics';
import { AnalyticsChartsSection } from '@/components/analytics/AnalyticsChartsSection';
import { UsagePatternCard } from '@/components/analytics/UsagePatternCard';
import { WeeklyTrendsCard } from '@/components/analytics/WeeklyTrendsCard';
import { PredictiveInsightsCard } from '@/components/analytics/PredictiveInsightsCard';

type PlannerView = 'planner' | 'inventory' | 'analytics';
type FilterType = 'all' | 'critical' | 'low' | 'stocked' | 'pending';

export default function PlannerScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const params = useLocalSearchParams<{ filter?: FilterType; childId?: string }>();

  const [currentView, setCurrentView] = useState<PlannerView>('planner');
  const [activeFilter, setActiveFilter] = useState<FilterType>(params.filter || 'all');

  // Existing modal state
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItem | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);

  // Existing child ID logic
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [storedChildId, setStoredChildId] = useAsyncStorage('nestsync_selected_child_id');

  // Fetch children data (existing)
  const { data: childrenData, loading: childrenLoading } = useQuery(MY_CHILDREN_QUERY, {
    variables: { first: 10 },
  });

  const childId = params.childId || storedChildId || childrenData?.myChildren?.edges?.[0]?.node?.id || '';

  // NEW: Analytics data integration
  const { stats: analyticsStats, isLoading: analyticsLoading, error: analyticsError, hasUsageData, isPremiumUser } = useAnalytics({
    childId,
    includePremium: true, // Will only return premium data if user has subscription
    refreshInterval: 300000 // 5 minutes
  });

  // Existing inventory data fetch
  const {
    data: inventoryData,
    loading: inventoryLoading,
    error: inventoryError
  } = useQuery(GET_INVENTORY_ITEMS_QUERY, {
    variables: {
      childId,
      productType: 'DIAPER',
      limit: 500
    },
    skip: !childId,
    pollInterval: 30000,
  });

  // Existing useEffect hooks
  useEffect(() => {
    if (childId && !storedChildId) {
      setStoredChildId(childId);
    }
  }, [childId, storedChildId, setStoredChildId]);

  useEffect(() => {
    if (params.filter && params.filter !== activeFilter) {
      setActiveFilter(params.filter);
      if (params.filter !== 'all') {
        setCurrentView('inventory');
      }
    }
  }, [params.filter]);

  // Existing inventory processing
  const inventoryItems: InventoryItem[] = useMemo(() => {
    if (!inventoryData?.getInventoryItems?.edges) return [];

    return inventoryData.getInventoryItems.edges
      .map((edge: any) => edge.node)
      .filter((item: InventoryItem) => item.quantityRemaining > 0);
  }, [inventoryData]);

  // Enhanced planner items with dynamic analytics data
  const plannerItems: PlannerItem[] = useMemo(() => {
    if (!analyticsStats || !hasUsageData) {
      // Fallback to static data when no analytics available
      return [
        {
          id: '1',
          date: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
          type: 'diaper-change',
          title: 'Next Diaper Change',
          description: 'Based on usual schedule',
          status: 'upcoming'
        },
        {
          id: '2',
          date: new Date(Date.now() + 86400000).toISOString(), // 1 day from now
          type: 'inventory-reminder',
          title: 'Running Low on Stock',
          description: `${analyticsStats?.daysRemaining || 3} days remaining at current usage`,
          status: 'upcoming'
        }
      ];
    }

    const items: PlannerItem[] = [];

    // Dynamic next change prediction
    if (analyticsStats.usagePatterns.averageDailyChanges > 0) {
      const avgInterval = 24 / analyticsStats.usagePatterns.averageDailyChanges;
      const nextChangeTime = new Date(Date.now() + (avgInterval * 3600000));

      items.push({
        id: 'next-change',
        date: nextChangeTime.toISOString(),
        type: 'diaper-change',
        title: 'Next Diaper Change',
        description: `Based on ${analyticsStats.usagePatterns.averageDailyChanges} daily average`,
        status: 'upcoming'
      });
    }

    // Low stock predictions
    if (analyticsStats.daysRemaining && analyticsStats.daysRemaining <= 7) {
      items.push({
        id: 'low-stock',
        date: new Date(Date.now() + (analyticsStats.daysRemaining * 86400000)).toISOString(),
        type: 'inventory-reminder',
        title: `Running Low on ${analyticsStats.currentSize} Diapers`,
        description: `${analyticsStats.daysRemaining} days remaining`,
        status: analyticsStats.daysRemaining <= 3 ? 'overdue' : 'upcoming'
      });
    }

    // Premium: Size change predictions
    if (isPremiumUser && analyticsStats.predictiveInsights?.nextSizeChangePrediction) {
      items.push({
        id: 'size-change',
        date: analyticsStats.predictiveInsights.nextSizeChangePrediction,
        type: 'size-prediction',
        title: 'Consider Next Size Soon',
        description: 'Based on growth patterns and usage trends',
        status: 'upcoming'
      });
    }

    return items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [analyticsStats, hasUsageData, isPremiumUser]);

  // Existing helper functions...
  const getItemIcon = (type: PlannerItem['type']) => {
    switch (type) {
      case 'diaper-change':
        return 'clock.fill';
      case 'inventory-reminder':
        return 'exclamationmark.triangle.fill';
      case 'size-prediction':
        return 'chart.line.uptrend.xyaxis';
      default:
        return 'calendar';
    }
  };

  // ... rest of existing helper functions

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        {/* Enhanced Header with Analytics Toggle */}
        <ThemedView style={styles.header}>
          <ThemedText type="title" style={styles.headerTitle}>Planner</ThemedText>
          <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
            {currentView === 'planner' ? 'Smart planning with usage insights' :
             currentView === 'analytics' ? 'Usage patterns and trends' :
             'Filtered inventory view'}
          </ThemedText>
        </ThemedView>

        {/* Enhanced View Toggle with Analytics */}
        <ThemedView style={styles.viewToggle}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              { backgroundColor: currentView === 'planner' ? colors.tint : colors.surface },
              { borderColor: colors.border }
            ]}
            onPress={() => setCurrentView('planner')}
          >
            <Text style={[
              styles.toggleText,
              { color: currentView === 'planner' ? '#FFFFFF' : colors.text }
            ]}>
              Planner
            </Text>
          </TouchableOpacity>

          {/* NEW: Analytics View Toggle */}
          <TouchableOpacity
            style={[
              styles.toggleButton,
              { backgroundColor: currentView === 'analytics' ? colors.tint : colors.surface },
              { borderColor: colors.border }
            ]}
            onPress={() => setCurrentView('analytics')}
          >
            <Text style={[
              styles.toggleText,
              { color: currentView === 'analytics' ? '#FFFFFF' : colors.text }
            ]}>
              Analytics
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleButton,
              { backgroundColor: currentView === 'inventory' ? colors.tint : colors.surface },
              { borderColor: colors.border }
            ]}
            onPress={() => setCurrentView('inventory')}
          >
            <Text style={[
              styles.toggleText,
              { color: currentView === 'inventory' ? '#FFFFFF' : colors.text }
            ]}>
              Inventory
            </Text>
          </TouchableOpacity>
        </ThemedView>

        {/* Enhanced Content with Analytics View */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {currentView === 'planner' ? (
            /* Enhanced Planner View with Dynamic Data */
            <ThemedView style={styles.section}>
              {/* Planner Header with Analytics Summary */}
              <View style={styles.plannerHeader}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                  Smart Planning
                </ThemedText>
                <ThemedText style={[styles.plannerSubtitle, { color: colors.textSecondary }]}>
                  {hasUsageData ?
                    `Based on ${analyticsStats?.usagePatterns.averageDailyChanges || 0} daily average` :
                    'Add usage data for personalized insights'
                  }
                </ThemedText>
              </View>

              {/* Quick Stats Cards */}
              {analyticsStats && (
                <View style={styles.quickStatsContainer}>
                  <View style={[styles.quickStatCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <ThemedText type="title" style={[styles.quickStatNumber, { color: colors.tint }]}>
                      {analyticsStats.todayChanges}
                    </ThemedText>
                    <ThemedText style={[styles.quickStatLabel, { color: colors.textSecondary }]}>
                      Today
                    </ThemedText>
                  </View>

                  <View style={[styles.quickStatCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <ThemedText type="title" style={[styles.quickStatNumber, { color: colors.tint }]}>
                      {analyticsStats.weeklyTrends?.currentWeekTotal || 0}
                    </ThemedText>
                    <ThemedText style={[styles.quickStatLabel, { color: colors.textSecondary }]}>
                      This Week
                    </ThemedText>
                  </View>

                  <View style={[styles.quickStatCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <ThemedText type="title" style={[styles.quickStatNumber, { color: colors.tint }]}>
                      {analyticsStats.daysRemaining || '—'}
                    </ThemedText>
                    <ThemedText style={[styles.quickStatLabel, { color: colors.textSecondary }]}>
                      Days Left
                    </ThemedText>
                  </View>
                </View>
              )}

              {/* Enhanced Planner Cards with Analytics */}
              {plannerItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.plannerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  {/* Existing planner card content with enhanced descriptions */}
                  <View style={styles.plannerCardHeader}>
                    <View style={[styles.plannerIconContainer, { backgroundColor: getItemColor(item.status) + '15' }]}>
                      <IconSymbol
                        name={getItemIcon(item.type) as any}
                        size={24}
                        color={getItemColor(item.status)}
                      />
                    </View>

                    <View style={styles.plannerCardContent}>
                      <ThemedText type="defaultSemiBold" style={[styles.plannerCardTitle, { color: colors.text }]}>
                        {item.title}
                      </ThemedText>
                      {item.description && (
                        <ThemedText style={[styles.plannerCardDescription, { color: colors.textSecondary }]}>
                          {item.description}
                        </ThemedText>
                      )}
                      <ThemedText style={[styles.plannerCardDate, { color: colors.textSecondary }]}>
                        {new Date(item.date).toLocaleDateString('en-CA', {
                          weekday: 'long',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </ThemedText>
                    </View>

                    <View style={[styles.plannerStatusBadge, { backgroundColor: getItemColor(item.status) }]}>
                      <ThemedText style={[styles.plannerStatusText, { color: '#FFFFFF' }]}>
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </ThemedText>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}

              {/* Usage Pattern Summary Card */}
              {hasUsageData && analyticsStats && (
                <UsagePatternCard
                  usagePatterns={analyticsStats.usagePatterns}
                  colors={colors}
                />
              )}
            </ThemedView>
          ) : currentView === 'analytics' ? (
            /* NEW: Analytics View */
            <ThemedView style={styles.section}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Usage Analytics
              </ThemedText>

              {/* Analytics Loading State */}
              {analyticsLoading && (
                <View style={[styles.loadingContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <ActivityIndicator size="small" color={colors.tint} />
                  <ThemedText style={[styles.loadingText, { color: colors.textSecondary }]}>
                    Loading analytics...
                  </ThemedText>
                </View>
              )}

              {/* Analytics Error State */}
              {analyticsError && (
                <View style={[styles.errorContainer, { backgroundColor: colors.surface, borderColor: colors.error }]}>
                  <IconSymbol name="exclamationmark.triangle.fill" size={20} color={colors.error} />
                  <ThemedText style={[styles.errorText, { color: colors.error }]}>
                    Unable to load analytics. Please try again.
                  </ThemedText>
                </View>
              )}

              {/* Analytics Content */}
              {analyticsStats && hasUsageData && (
                <>
                  {/* Charts Section */}
                  <AnalyticsChartsSection
                    weeklyTrends={analyticsStats.weeklyTrends}
                    usagePatterns={analyticsStats.usagePatterns}
                    colors={colors}
                  />

                  {/* Weekly Trends Card */}
                  <WeeklyTrendsCard
                    weeklyTrends={analyticsStats.weeklyTrends}
                    colors={colors}
                  />

                  {/* Premium: Predictive Insights */}
                  {isPremiumUser && analyticsStats.predictiveInsights && (
                    <PredictiveInsightsCard
                      insights={analyticsStats.predictiveInsights}
                      colors={colors}
                    />
                  )}

                  {/* Inventory Efficiency */}
                  <View style={[styles.analyticsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <ThemedText type="defaultSemiBold" style={styles.analyticsCardTitle}>
                      Inventory Efficiency
                    </ThemedText>

                    <View style={styles.efficiencyMetrics}>
                      <View style={styles.efficiencyMetric}>
                        <ThemedText style={[styles.efficiencyValue, { color: colors.tint }]}>
                          {analyticsStats.inventoryEfficiency.averageProductLifespanDays}
                        </ThemedText>
                        <ThemedText style={[styles.efficiencyLabel, { color: colors.textSecondary }]}>
                          Avg. Days Per Pack
                        </ThemedText>
                      </View>

                      {analyticsStats.inventoryEfficiency.costPerChange && (
                        <View style={styles.efficiencyMetric}>
                          <ThemedText style={[styles.efficiencyValue, { color: colors.tint }]}>
                            ${analyticsStats.inventoryEfficiency.costPerChange}
                          </ThemedText>
                          <ThemedText style={[styles.efficiencyLabel, { color: colors.textSecondary }]}>
                            Cost Per Change
                          </ThemedText>
                        </View>
                      )}
                    </View>
                  </View>
                </>
              )}

              {/* No Data State */}
              {!hasUsageData && !analyticsLoading && (
                <View style={[styles.emptyContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <IconSymbol name="chart.bar.fill" size={32} color={colors.textSecondary} />
                  <ThemedText type="defaultSemiBold" style={[styles.emptyTitle, { color: colors.text }]}>
                    Start Logging Changes
                  </ThemedText>
                  <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
                    Log diaper changes to see personalized analytics and insights
                  </ThemedText>
                </View>
              )}
            </ThemedView>
          ) : (
            /* Existing Inventory View (unchanged) */
            <ThemedView style={styles.section}>
              {/* ... existing inventory view code ... */}
            </ThemedView>
          )}

          {/* Existing components and bottom spacing */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Existing modals */}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

// Enhanced styles
const styles = StyleSheet.create({
  // ... existing styles ...

  // New analytics styles
  quickStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  quickStatCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  quickStatNumber: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  quickStatLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  analyticsCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  analyticsCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  efficiencyMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  efficiencyMetric: {
    alignItems: 'center',
  },
  efficiencyValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  efficiencyLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
});
```

### 2. Victory Native XL Chart Components

#### Analytics Charts Section Component

```typescript
// components/analytics/AnalyticsChartsSection.tsx

import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { VictoryChart, VictoryLine, VictoryBar, VictoryArea, VictoryAxis, VictoryTheme } from 'victory-native';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';

const { width: screenWidth } = Dimensions.get('window');
const chartWidth = screenWidth - 40; // Account for padding

interface AnalyticsChartsSectionProps {
  weeklyTrends: WeeklyTrends;
  usagePatterns: UsagePatternStats;
  colors: any;
}

export function AnalyticsChartsSection({ weeklyTrends, usagePatterns, colors }: AnalyticsChartsSectionProps) {

  // Prepare chart data
  const weeklyChartData = weeklyTrends.dailyAverages.map((day, index) => ({
    x: index + 1,
    y: day.usageCount,
    label: day.date.toLocaleDateString('en-CA', { weekday: 'short' })
  }));

  const hourlyDistributionData = usagePatterns.peakUsageHours.map(hour => ({
    x: hour,
    y: 1, // This would be actual usage count per hour from backend
    label: `${hour}:00`
  }));

  return (
    <View style={styles.chartsContainer}>
      {/* Weekly Trends Chart */}
      <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <ThemedText type="defaultSemiBold" style={styles.chartTitle}>
          Weekly Usage Trends
        </ThemedText>

        <VictoryChart
          theme={VictoryTheme.material}
          width={chartWidth}
          height={200}
          padding={{ left: 60, right: 40, top: 20, bottom: 60 }}
        >
          <VictoryAxis
            dependentAxis
            tickFormat={(x) => `${x}`}
            style={{
              tickLabels: { fontSize: 12, fill: colors.textSecondary },
              grid: { stroke: colors.border, strokeWidth: 0.5 }
            }}
          />
          <VictoryAxis
            tickFormat={weeklyChartData.map(d => d.label)}
            style={{
              tickLabels: { fontSize: 12, fill: colors.textSecondary, angle: -45 },
              axis: { stroke: colors.border, strokeWidth: 1 }
            }}
          />
          <VictoryArea
            data={weeklyChartData}
            style={{
              data: {
                fill: colors.tint + '40',
                stroke: colors.tint,
                strokeWidth: 2
              }
            }}
            animate={{
              duration: 1000,
              onLoad: { duration: 500 }
            }}
          />
        </VictoryChart>

        <View style={styles.chartInsight}>
          <ThemedText style={[styles.insightText, { color: colors.textSecondary }]}>
            {weeklyTrends.weekOverWeekChange > 0 ? '↗' : '↘'}
            {Math.abs(weeklyTrends.weekOverWeekChange)}% vs last week
          </ThemedText>
        </View>
      </View>

      {/* Hourly Distribution Chart */}
      <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <ThemedText type="defaultSemiBold" style={styles.chartTitle}>
          Peak Usage Hours
        </ThemedText>

        <VictoryChart
          theme={VictoryTheme.material}
          width={chartWidth}
          height={180}
          padding={{ left: 60, right: 40, top: 20, bottom: 60 }}
          domain={{ x: [0, 23] }}
        >
          <VictoryAxis
            dependentAxis
            tickFormat={() => ''}
            style={{
              axis: { stroke: 'transparent' },
              tickLabels: { fill: 'transparent' }
            }}
          />
          <VictoryAxis
            tickFormat={(hour) => `${hour}h`}
            tickCount={6}
            style={{
              tickLabels: { fontSize: 12, fill: colors.textSecondary },
              axis: { stroke: colors.border, strokeWidth: 1 }
            }}
          />
          <VictoryBar
            data={hourlyDistributionData}
            style={{
              data: {
                fill: colors.accent,
                opacity: 0.8
              }
            }}
            barWidth={15}
            animate={{
              duration: 1000,
              onLoad: { duration: 500 }
            }}
          />
        </VictoryChart>

        <View style={styles.chartInsight}>
          <ThemedText style={[styles.insightText, { color: colors.textSecondary }]}>
            Most active: {usagePatterns.peakUsageHours.map(h => `${h}:00`).join(', ')}
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chartsContainer: {
    marginBottom: 20,
  },
  chartCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  chartInsight: {
    alignItems: 'center',
    marginTop: 8,
  },
  insightText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
```

#### Usage Pattern Card Component

```typescript
// components/analytics/UsagePatternCard.tsx

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';

interface UsagePatternCardProps {
  usagePatterns: UsagePatternStats;
  colors: any;
}

export function UsagePatternCard({ usagePatterns, colors }: UsagePatternCardProps) {
  return (
    <View style={[styles.patternCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.patternHeader}>
        <IconSymbol name="chart.bar.fill" size={24} color={colors.accent} />
        <ThemedText type="defaultSemiBold" style={styles.patternTitle}>
          Usage Patterns
        </ThemedText>
      </View>

      <View style={styles.patternMetrics}>
        <View style={styles.patternMetric}>
          <ThemedText style={[styles.metricValue, { color: colors.tint }]}>
            {usagePatterns.averageDailyChanges}
          </ThemedText>
          <ThemedText style={[styles.metricLabel, { color: colors.textSecondary }]}>
            Daily Average
          </ThemedText>
        </View>

        <View style={styles.patternMetric}>
          <ThemedText style={[styles.metricValue, { color: colors.tint }]}>
            {usagePatterns.mostCommonIntervals[0] || '—'}h
          </ThemedText>
          <ThemedText style={[styles.metricLabel, { color: colors.textSecondary }]}>
            Common Interval
          </ThemedText>
        </View>

        <View style={styles.patternMetric}>
          <ThemedText style={[styles.metricValue, { color: colors.tint }]}>
            {Math.round(usagePatterns.weekendVsWeekdayRatio * 100)}%
          </ThemedText>
          <ThemedText style={[styles.metricLabel, { color: colors.textSecondary }]}>
            Weekend Ratio
          </ThemedText>
        </View>
      </View>

      {/* Condition Breakdown */}
      <View style={styles.conditionBreakdown}>
        <ThemedText style={[styles.conditionTitle, { color: colors.text }]}>
          Condition Breakdown
        </ThemedText>

        <View style={styles.conditionBars}>
          <View style={styles.conditionBar}>
            <View
              style={[
                styles.conditionBarFill,
                {
                  backgroundColor: '#3B82F6',
                  width: `${usagePatterns.conditionBreakdown.wetOnlyPercentage}%`
                }
              ]}
            />
            <ThemedText style={[styles.conditionLabel, { color: colors.textSecondary }]}>
              Wet only ({usagePatterns.conditionBreakdown.wetOnlyPercentage}%)
            </ThemedText>
          </View>

          <View style={styles.conditionBar}>
            <View
              style={[
                styles.conditionBarFill,
                {
                  backgroundColor: '#F59E0B',
                  width: `${usagePatterns.conditionBreakdown.soiledOnlyPercentage}%`
                }
              ]}
            />
            <ThemedText style={[styles.conditionLabel, { color: colors.textSecondary }]}>
              Soiled only ({usagePatterns.conditionBreakdown.soiledOnlyPercentage}%)
            </ThemedText>
          </View>

          <View style={styles.conditionBar}>
            <View
              style={[
                styles.conditionBarFill,
                {
                  backgroundColor: '#EF4444',
                  width: `${usagePatterns.conditionBreakdown.bothPercentage}%`
                }
              ]}
            />
            <ThemedText style={[styles.conditionLabel, { color: colors.textSecondary }]}>
              Both ({usagePatterns.conditionBreakdown.bothPercentage}%)
            </ThemedText>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  patternCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  patternHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  patternTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  patternMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  patternMetric: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  conditionBreakdown: {
    marginTop: 16,
  },
  conditionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  conditionBars: {
    gap: 8,
  },
  conditionBar: {
    height: 20,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    overflow: 'hidden',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  conditionBarFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    borderRadius: 10,
  },
  conditionLabel: {
    fontSize: 11,
    fontWeight: '500',
    zIndex: 1,
  },
});
```

## Performance and Caching Strategy

### 1. Real-time vs Cached Data Strategy

```typescript
// services/AnalyticsDataService.ts

import { AnalyticsCache } from '@/lib/cache/AnalyticsCache';
import { apolloClient } from '@/lib/graphql/client';
import { ENHANCED_DASHBOARD_STATS_QUERY } from '@/lib/graphql/analytics_queries';

export class AnalyticsDataService {
  private cache: AnalyticsCache;

  constructor() {
    this.cache = new AnalyticsCache();
  }

  async getEnhancedDashboardStats(childId: string, includePremium: boolean = false) {
    // Check cache first
    const cached = this.cache.getEnhancedDashboardStats(childId, includePremium);
    if (cached) {
      // Return cached data and refresh in background
      this.refreshDataInBackground(childId, includePremium);
      return cached;
    }

    // Fetch fresh data
    return this.fetchFreshData(childId, includePremium);
  }

  private async fetchFreshData(childId: string, includePremium: boolean) {
    try {
      const { data } = await apolloClient.query({
        query: ENHANCED_DASHBOARD_STATS_QUERY,
        variables: { childId, includePremium },
        fetchPolicy: 'network-only'
      });

      const stats = data.getEnhancedDashboardStats;

      // Cache the result
      this.cache.setEnhancedDashboardStats(childId, stats, includePremium);

      return stats;
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      // Return cached data if available, even if stale
      return this.cache.getEnhancedDashboardStats(childId, includePremium);
    }
  }

  private async refreshDataInBackground(childId: string, includePremium: boolean) {
    // Non-blocking background refresh
    setTimeout(() => {
      this.fetchFreshData(childId, includePremium);
    }, 100);
  }

  invalidateCache(childId: string) {
    this.cache.invalidateChildCache(childId);
  }
}
```

### 2. Progressive Loading Strategy

```typescript
// hooks/useProgressiveAnalytics.ts

import { useState, useEffect } from 'react';
import { AnalyticsDataService } from '@/services/AnalyticsDataService';

export function useProgressiveAnalytics(childId: string, includePremium: boolean = false) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        setLoading(true);

        // 1. Load basic dashboard stats first (fast)
        const basicStats = await apolloClient.query({
          query: BASIC_DASHBOARD_STATS_QUERY,
          variables: { childId }
        });

        if (mounted) {
          setData({ basic: basicStats.data.getDashboardStats });
          setLoading(false);
        }

        // 2. Load enhanced analytics (slower)
        const enhancedStats = await new AnalyticsDataService().getEnhancedDashboardStats(childId, includePremium);

        if (mounted) {
          setData(prevData => ({
            ...prevData,
            enhanced: enhancedStats
          }));
        }

      } catch (err) {
        if (mounted) {
          setError(err);
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [childId, includePremium]);

  return { data, loading, error };
}
```

## Free vs Premium Analytics Features

### 1. Feature Differentiation Strategy

#### Free Tier Features
- Basic dashboard stats (existing functionality)
- Current week usage trends
- Simple usage patterns (daily average, peak hours)
- Basic inventory efficiency metrics
- 7-day data retention for charts

#### Premium Tier Features
- ML-powered predictive insights
- Size change predictions based on growth patterns
- Inventory optimization recommendations
- Usage pattern anomaly detection
- Historical data analysis (unlimited retention)
- Advanced charts and visualizations
- Export capabilities for analytics data
- Seasonal usage pattern analysis

### 2. Premium Feature Implementation

```typescript
// components/analytics/PremiumInsightsCard.tsx

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { router } from 'expo-router';

interface PremiumInsightsCardProps {
  insights?: PredictiveInsights;
  colors: any;
  isPremiumUser: boolean;
}

export function PremiumInsightsCard({ insights, colors, isPremiumUser }: PremiumInsightsCardProps) {
  if (!isPremiumUser) {
    return (
      <View style={[styles.premiumUpsellCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.premiumHeader}>
          <IconSymbol name="crown.fill" size={24} color="#F59E0B" />
          <ThemedText type="defaultSemiBold" style={styles.premiumTitle}>
            Premium Analytics
          </ThemedText>
        </View>

        <ThemedText style={[styles.premiumDescription, { color: colors.textSecondary }]}>
          Unlock ML-powered insights, size predictions, and advanced analytics
        </ThemedText>

        <View style={styles.premiumFeatures}>
          <View style={styles.premiumFeature}>
            <IconSymbol name="checkmark.circle.fill" size={16} color="#10B981" />
            <ThemedText style={[styles.premiumFeatureText, { color: colors.textSecondary }]}>
              Size change predictions
            </ThemedText>
          </View>
          <View style={styles.premiumFeature}>
            <IconSymbol name="checkmark.circle.fill" size={16} color="#10B981" />
            <ThemedText style={[styles.premiumFeatureText, { color: colors.textSecondary }]}>
              Purchase optimization
            </ThemedText>
          </View>
          <View style={styles.premiumFeature}>
            <IconSymbol name="checkmark.circle.fill" size={16} color="#10B981" />
            <ThemedText style={[styles.premiumFeatureText, { color: colors.textSecondary }]}>
              Pattern anomaly detection
            </ThemedText>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.upgradeButton, { backgroundColor: colors.tint }]}
          onPress={() => router.push('/subscription')}
        >
          <ThemedText style={[styles.upgradeButtonText, { color: '#FFFFFF' }]}>
            Upgrade to Premium
          </ThemedText>
        </TouchableOpacity>
      </View>
    );
  }

  if (!insights) {
    return null;
  }

  return (
    <View style={[styles.insightsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.insightsHeader}>
        <IconSymbol name="brain.head.profile" size={24} color={colors.accent} />
        <ThemedText type="defaultSemiBold" style={styles.insightsTitle}>
          Predictive Insights
        </ThemedText>
        <View style={[styles.premiumBadge, { backgroundColor: '#F59E0B' }]}>
          <ThemedText style={styles.premiumBadgeText}>PREMIUM</ThemedText>
        </View>
      </View>

      {/* Size Change Prediction */}
      {insights.nextSizeChangePrediction && (
        <View style={styles.insight}>
          <IconSymbol name="arrow.up.circle.fill" size={20} color="#3B82F6" />
          <View style={styles.insightContent}>
            <ThemedText style={[styles.insightTitle, { color: colors.text }]}>
              Next Size Change
            </ThemedText>
            <ThemedText style={[styles.insightDescription, { color: colors.textSecondary }]}>
              Predicted for {insights.nextSizeChangePrediction.toLocaleDateString('en-CA')} based on growth patterns
            </ThemedText>
          </View>
        </View>
      )}

      {/* Inventory Forecasts */}
      {insights.inventoryDepletionForecast.length > 0 && (
        <View style={styles.insight}>
          <IconSymbol name="exclamationmark.triangle.fill" size={20} color="#F59E0B" />
          <View style={styles.insightContent}>
            <ThemedText style={[styles.insightTitle, { color: colors.text }]}>
              Inventory Alert
            </ThemedText>
            <ThemedText style={[styles.insightDescription, { color: colors.textSecondary }]}>
              {insights.inventoryDepletionForecast[0].brand} {insights.inventoryDepletionForecast[0].size} running low by{' '}
              {insights.inventoryDepletionForecast[0].estimatedDepletionDate.toLocaleDateString('en-CA')}
            </ThemedText>
          </View>
        </View>
      )}

      {/* Usage Anomalies */}
      {insights.usagePatternAnomalies.length > 0 && (
        <View style={styles.insight}>
          <IconSymbol name="waveform.path.ecg" size={20} color="#EF4444" />
          <View style={styles.insightContent}>
            <ThemedText style={[styles.insightTitle, { color: colors.text }]}>
              Pattern Change Detected
            </ThemedText>
            <ThemedText style={[styles.insightDescription, { color: colors.textSecondary }]}>
              {insights.usagePatternAnomalies[0].description}
            </ThemedText>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  premiumUpsellCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    borderStyle: 'dashed',
  },
  premiumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  premiumTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  premiumDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  premiumFeatures: {
    gap: 8,
    marginBottom: 20,
  },
  premiumFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  premiumFeatureText: {
    fontSize: 13,
  },
  upgradeButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  insightsCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  insightsTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  premiumBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  premiumBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  insight: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  insightDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
});
```

## Security and Privacy Architecture

### 1. PIPEDA Compliance for Analytics

```python
# app/services/privacy_analytics.py

from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional
import hashlib
import logging

logger = logging.getLogger(__name__)

class PrivacyCompliantAnalytics:
    """
    PIPEDA-compliant analytics processing
    """

    def __init__(self):
        self.data_retention_days = 1095  # 3 years maximum
        self.anonymization_threshold = 30  # Days after which data is anonymized

    def process_analytics_data(self, child_id: str, usage_logs: List[UsageLog]) -> Dict[str, Any]:
        """
        Process analytics data with privacy safeguards
        """

        # 1. Data minimization - only include necessary fields
        filtered_logs = self._filter_necessary_data(usage_logs)

        # 2. Anonymization for older data
        anonymized_logs = self._anonymize_old_data(filtered_logs)

        # 3. Aggregation to prevent re-identification
        aggregated_data = self._aggregate_for_privacy(anonymized_logs)

        # 4. Audit logging
        self._log_privacy_access(child_id, len(usage_logs))

        return aggregated_data

    def _filter_necessary_data(self, usage_logs: List[UsageLog]) -> List[Dict[str, Any]]:
        """
        Keep only data necessary for analytics
        """
        necessary_fields = [
            'logged_at', 'quantity_used', 'was_wet', 'was_soiled',
            'diaper_condition', 'time_since_last_change', 'had_leakage'
        ]

        filtered = []
        for log in usage_logs:
            filtered_log = {}
            for field in necessary_fields:
                if hasattr(log, field):
                    filtered_log[field] = getattr(log, field)
            filtered.append(filtered_log)

        return filtered

    def _anonymize_old_data(self, logs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Anonymize data older than threshold
        """
        anonymization_cutoff = datetime.now(timezone.utc) - timedelta(days=self.anonymization_threshold)

        for log in logs:
            if log.get('logged_at') and log['logged_at'] < anonymization_cutoff:
                # Round timestamps to hour granularity
                if isinstance(log['logged_at'], datetime):
                    log['logged_at'] = log['logged_at'].replace(minute=0, second=0, microsecond=0)

                # Remove precise timing data
                if 'time_since_last_change' in log:
                    # Round to nearest 30 minutes
                    if log['time_since_last_change']:
                        rounded = round(log['time_since_last_change'] / 30) * 30
                        log['time_since_last_change'] = rounded

        return logs

    def _aggregate_for_privacy(self, logs: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Aggregate data to prevent re-identification
        """
        if len(logs) < 5:  # Minimum aggregation threshold
            return {}

        # Safe aggregations that don't reveal individual entries
        total_changes = len(logs)
        wet_count = sum(1 for log in logs if log.get('was_wet'))
        soiled_count = sum(1 for log in logs if log.get('was_soiled'))

        return {
            'total_changes': total_changes,
            'wet_percentage': round((wet_count / total_changes) * 100, 1) if total_changes > 0 else 0,
            'soiled_percentage': round((soiled_count / total_changes) * 100, 1) if total_changes > 0 else 0,
            'data_points': min(total_changes, 100)  # Cap reported data points
        }

    def _log_privacy_access(self, child_id: str, record_count: int):
        """
        Log analytics access for PIPEDA audit requirements
        """
        audit_entry = {
            'timestamp': datetime.now(timezone.utc),
            'action': 'analytics_access',
            'child_id_hash': hashlib.sha256(child_id.encode()).hexdigest()[:8],
            'record_count': record_count,
            'purpose': 'usage_analytics_display'
        }

        logger.info(f"Privacy audit: {audit_entry}")
```

### 2. Data Encryption and Storage

```python
# app/services/secure_analytics_storage.py

from cryptography.fernet import Fernet
import os
import json
from typing import Dict, Any, Optional

class SecureAnalyticsStorage:
    """
    Encrypted storage for sensitive analytics data
    """

    def __init__(self):
        self.encryption_key = os.getenv('ANALYTICS_ENCRYPTION_KEY')
        if not self.encryption_key:
            self.encryption_key = Fernet.generate_key()

        self.fernet = Fernet(self.encryption_key)

    def encrypt_analytics_data(self, data: Dict[str, Any]) -> str:
        """
        Encrypt analytics data for storage
        """
        json_data = json.dumps(data, default=str)
        encrypted_data = self.fernet.encrypt(json_data.encode())
        return encrypted_data.decode()

    def decrypt_analytics_data(self, encrypted_data: str) -> Optional[Dict[str, Any]]:
        """
        Decrypt analytics data for processing
        """
        try:
            decrypted_data = self.fernet.decrypt(encrypted_data.encode())
            return json.loads(decrypted_data.decode())
        except Exception as e:
            logger.error(f"Failed to decrypt analytics data: {e}")
            return None
```

## Testing and Quality Assurance

### 1. Analytics Component Testing Strategy

```typescript
// __tests__/analytics/AnalyticsChartsSection.test.tsx

import React from 'react';
import { render } from '@testing-library/react-native';
import { AnalyticsChartsSection } from '@/components/analytics/AnalyticsChartsSection';

const mockWeeklyTrends = {
  currentWeekTotal: 42,
  previousWeekTotal: 38,
  weekOverWeekChange: 10.5,
  dailyAverages: [
    { date: new Date('2024-01-15'), usageCount: 6, averageIntervalMinutes: 180 },
    { date: new Date('2024-01-16'), usageCount: 7, averageIntervalMinutes: 170 },
    // ... more test data
  ]
};

const mockUsagePatterns = {
  averageDailyChanges: 6.2,
  peakUsageHours: [8, 14, 20],
  weekendVsWeekdayRatio: 0.95,
  mostCommonIntervals: [3, 4, 2],
  conditionBreakdown: {
    wetOnlyPercentage: 45,
    soiledOnlyPercentage: 25,
    bothPercentage: 25,
    cleanChangesPercentage: 5
  }
};

const mockColors = {
  tint: '#0891B2',
  accent: '#F59E0B',
  surface: '#FFFFFF',
  border: '#E5E7EB',
  textSecondary: '#6B7280'
};

describe('AnalyticsChartsSection', () => {
  it('renders weekly trends chart correctly', () => {
    const { getByText } = render(
      <AnalyticsChartsSection
        weeklyTrends={mockWeeklyTrends}
        usagePatterns={mockUsagePatterns}
        colors={mockColors}
      />
    );

    expect(getByText('Weekly Usage Trends')).toBeTruthy();
    expect(getByText('↗ 10.5% vs last week')).toBeTruthy();
  });

  it('renders peak usage hours chart correctly', () => {
    const { getByText } = render(
      <AnalyticsChartsSection
        weeklyTrends={mockWeeklyTrends}
        usagePatterns={mockUsagePatterns}
        colors={mockColors}
      />
    );

    expect(getByText('Peak Usage Hours')).toBeTruthy();
    expect(getByText('Most active: 8:00, 14:00, 20:00')).toBeTruthy();
  });

  it('handles empty data gracefully', () => {
    const emptyWeeklyTrends = { ...mockWeeklyTrends, dailyAverages: [] };

    const { getByText } = render(
      <AnalyticsChartsSection
        weeklyTrends={emptyWeeklyTrends}
        usagePatterns={mockUsagePatterns}
        colors={mockColors}
      />
    );

    expect(getByText('Weekly Usage Trends')).toBeTruthy();
    // Should still render but with empty chart
  });
});
```

### 2. Analytics Data Service Testing

```typescript
// __tests__/services/AnalyticsDataService.test.ts

import { AnalyticsDataService } from '@/services/AnalyticsDataService';
import { AnalyticsCache } from '@/lib/cache/AnalyticsCache';

jest.mock('@/lib/cache/AnalyticsCache');
jest.mock('@/lib/graphql/client');

describe('AnalyticsDataService', () => {
  let service: AnalyticsDataService;
  let mockCache: jest.Mocked<AnalyticsCache>;

  beforeEach(() => {
    service = new AnalyticsDataService();
    mockCache = new AnalyticsCache() as jest.Mocked<AnalyticsCache>;
  });

  describe('getEnhancedDashboardStats', () => {
    it('returns cached data when available', async () => {
      const mockCachedData = { daysRemaining: 5, diapersLeft: 12 };
      mockCache.getEnhancedDashboardStats.mockReturnValue(mockCachedData);

      const result = await service.getEnhancedDashboardStats('child-123');

      expect(result).toEqual(mockCachedData);
      expect(mockCache.getEnhancedDashboardStats).toHaveBeenCalledWith('child-123', false);
    });

    it('fetches fresh data when cache is empty', async () => {
      mockCache.getEnhancedDashboardStats.mockReturnValue(null);

      const mockFreshData = { daysRemaining: 7, diapersLeft: 20 };
      // Mock GraphQL response
      require('@/lib/graphql/client').apolloClient.query.mockResolvedValue({
        data: { getEnhancedDashboardStats: mockFreshData }
      });

      const result = await service.getEnhancedDashboardStats('child-123');

      expect(result).toEqual(mockFreshData);
      expect(mockCache.setEnhancedDashboardStats).toHaveBeenCalledWith('child-123', mockFreshData, false);
    });

    it('handles network errors gracefully', async () => {
      mockCache.getEnhancedDashboardStats.mockReturnValue(null);
      require('@/lib/graphql/client').apolloClient.query.mockRejectedValue(new Error('Network error'));

      const result = await service.getEnhancedDashboardStats('child-123');

      expect(result).toBeNull();
      // Should have attempted to get cached data as fallback
      expect(mockCache.getEnhancedDashboardStats).toHaveBeenCalledTimes(2);
    });
  });
});
```

## Deployment and Integration Strategy

### 1. Incremental Rollout Plan

#### Phase 1: Foundation (Week 1-2)
- Deploy enhanced GraphQL schema and basic analytics resolvers
- Implement database optimizations and materialized views
- Add Redis cache layer
- Update existing `get_dashboard_stats` with enhanced data

#### Phase 2: Frontend Integration (Week 3-4)
- Progressive enhancement of planner.tsx with analytics hooks
- Implement Victory Native XL chart components
- Add analytics view toggle and basic charts
- Deploy usage pattern cards and trend visualizations

#### Phase 3: Premium Features (Week 5-6)
- Implement ML analytics service integration
- Add predictive insights components
- Deploy premium feature differentiation
- Implement subscription checks

#### Phase 4: Performance Optimization (Week 7-8)
- Deploy caching optimizations
- Implement progressive loading
- Add background data refresh
- Performance testing and optimization

### 2. Feature Flag Implementation

```typescript
// lib/features/AnalyticsFeatureFlags.ts

export interface AnalyticsFeatureFlags {
  enableEnhancedAnalytics: boolean;
  enablePremiumInsights: boolean;
  enableRealTimeCharts: boolean;
  enableMLPredictions: boolean;
}

export function getAnalyticsFeatureFlags(): AnalyticsFeatureFlags {
  return {
    enableEnhancedAnalytics: process.env.EXPO_PUBLIC_ENABLE_ANALYTICS === 'true',
    enablePremiumInsights: process.env.EXPO_PUBLIC_ENABLE_PREMIUM === 'true',
    enableRealTimeCharts: process.env.EXPO_PUBLIC_ENABLE_REALTIME === 'true',
    enableMLPredictions: process.env.EXPO_PUBLIC_ENABLE_ML === 'true',
  };
}

// Usage in components
const features = getAnalyticsFeatureFlags();
if (features.enableEnhancedAnalytics) {
  // Render analytics components
}
```

## Conclusion

This comprehensive technical architecture provides a complete roadmap for implementing the NestSync analytics dashboard. The design prioritizes:

1. **Progressive Enhancement**: Building on existing planner.tsx functionality
2. **Performance**: Intelligent caching and optimized database queries
3. **User Experience**: Psychology-driven design with <10 second comprehension time
4. **Compliance**: Full PIPEDA compliance with Canadian data residency
5. **Scalability**: Premium feature differentiation and ML integration
6. **Maintainability**: Clean separation of concerns and robust error handling

The architecture leverages Victory Native XL for high-performance charts, implements comprehensive caching strategies, and provides clear free vs premium feature boundaries while maintaining the app's Canadian-focused, psychology-driven approach to stressed parent UX.

## File Structure Summary

```
Enhanced NestSync Analytics Architecture:

Backend:
├── app/graphql/analytics_types.py (New comprehensive types)
├── app/graphql/analytics_resolvers.py (New analytics queries)
├── app/services/analytics_cache.py (Redis caching layer)
├── app/services/privacy_analytics.py (PIPEDA compliance)
└── app/services/secure_analytics_storage.py (Encryption)

Frontend:
├── hooks/useAnalytics.ts (Analytics data hook)
├── components/analytics/AnalyticsChartsSection.tsx (Victory Native XL charts)
├── components/analytics/UsagePatternCard.tsx (Pattern visualization)
├── components/analytics/PremiumInsightsCard.tsx (Premium features)
├── services/AnalyticsDataService.ts (Data service layer)
└── app/(tabs)/planner.tsx (Enhanced with analytics view)

Database:
├── Enhanced indexes for analytics performance
├── Materialized views for aggregated data
└── Auto-refresh procedures for real-time updates
```

This architecture serves as the complete technical blueprint for implementing advanced analytics while maintaining NestSync's core principles of Canadian compliance, psychological UX design, and premium feature differentiation.