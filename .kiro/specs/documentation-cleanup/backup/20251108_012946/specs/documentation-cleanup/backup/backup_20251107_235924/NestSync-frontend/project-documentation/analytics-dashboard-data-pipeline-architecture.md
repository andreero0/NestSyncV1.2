# Analytics Dashboard Data Pipeline Architecture

## Executive Summary

This document defines a comprehensive data pipeline architecture for implementing a wireframe-compliant Analytics Dashboard in the NestSync React Native/Expo application. The architecture extends the existing FastAPI/GraphQL/Supabase backend to support advanced analytics features including weekly pattern analysis, enhanced cost tracking, detailed peak hours analysis, and ML-based size change predictions.

### Key Architectural Decisions

- **Hybrid Processing Model**: Real-time calculations for immediate data, scheduled aggregations for complex analytics
- **Multi-Level Caching**: Database materialized views, Redis caching, and Apollo Client optimization
- **Privacy-by-Design**: All analytics processing on individual user data with PIPEDA compliance
- **Mobile-First Performance**: Optimized data structures and caching for React Native performance

### Technology Stack Extensions

- **Backend**: FastAPI + Strawberry GraphQL + Supabase PostgreSQL (existing)
- **New Components**: Redis for caching, scheduled background jobs, materialized views
- **ML Integration**: Python libraries for growth predictions (existing numpy, pandas, scikit-learn)
- **Frontend**: Apollo Client with enhanced caching strategies

---

## 1. GraphQL Schema Extensions

### New Core Analytics Types

```python
# app/graphql/types/analytics.py

@strawberry.type
class WeeklyPatternData:
    """Weekly diaper change pattern analysis"""
    daily_counts: List[int] = strawberry.field(description="Daily change counts for last 7 days (Mon-Sun)")
    weekly_average: float = strawberry.field(description="Average changes per day")
    consistency_percentage: float = strawberry.field(description="Pattern consistency percentage")
    pattern_insights: str = strawberry.field(description="Human-readable pattern analysis")
    week_start_date: datetime = strawberry.field(description="Start date of the analyzed week")

@strawberry.type
class PeakHourData:
    """Peak hour analysis with time ranges"""
    time_range: str = strawberry.field(description="Time range (e.g., '7-9am')")
    percentage: float = strawberry.field(description="Percentage of daily changes in this range")
    average_count: float = strawberry.field(description="Average changes during this time")

@strawberry.type
class TimeSlotData:
    """Hourly distribution data"""
    hour: int = strawberry.field(description="Hour of day (0-23)")
    change_count: int = strawberry.field(description="Number of changes in this hour")
    percentage: float = strawberry.field(description="Percentage of daily total")

@strawberry.type
class DetailedPeakHours:
    """Comprehensive peak hours analysis"""
    peak_hours: List[PeakHourData] = strawberry.field(description="Top 3 peak time ranges")
    hourly_distribution: List[TimeSlotData] = strawberry.field(description="24-hour distribution")
    weekend_vs_weekday_ratio: float = strawberry.field(description="Weekend usage vs weekday ratio")

@strawberry.type
class EnhancedCostAnalysis:
    """Advanced cost tracking and efficiency metrics"""
    monthly_cost_cad: float = strawberry.field(description="Monthly cost in CAD")
    cost_per_change_cad: float = strawberry.field(description="Cost per diaper change in CAD")
    efficiency_vs_target: float = strawberry.field(description="Efficiency percentage vs target")
    weekend_vs_weekday_usage: float = strawberry.field(description="Weekend vs weekday usage percentage")
    cost_trend_7day: float = strawberry.field(description="7-day cost trend percentage")
    most_expensive_day: str = strawberry.field(description="Day of week with highest costs")

@strawberry.type
class SizeChangePredictions:
    """ML-based size change predictions"""
    prediction_date_range: str = strawberry.field(description="Predicted date range for size change")
    confidence_score: float = strawberry.field(description="Prediction confidence (0-100)")
    growth_velocity_cm_week: float = strawberry.field(description="Growth velocity in cm/week")
    current_fit_efficiency: float = strawberry.field(description="Current size fit efficiency percentage")
    next_size_recommendation: str = strawberry.field(description="Next recommended size")
    prediction_basis: str = strawberry.field(description="Data points used for prediction")

@strawberry.type
class EnhancedAnalyticsDashboard:
    """Extended analytics dashboard with wireframe compliance"""
    # Existing fields (maintained for backward compatibility)
    overview: AnalyticsOverview
    usage: AnalyticsUsage
    trends: AnalyticsTrends

    # New wireframe-compliant fields
    weekly_patterns: WeeklyPatternData = strawberry.field(description="Your Baby's Patterns section")
    cost_analysis: EnhancedCostAnalysis = strawberry.field(description="Enhanced cost insights")
    peak_hours_detailed: DetailedPeakHours = strawberry.field(description="Detailed peak hours analysis")
    size_predictions: SizeChangePredictions = strawberry.field(description="Smart size change predictions")

    # Metadata
    last_updated: datetime = strawberry.field(description="Last analytics calculation timestamp")
    data_quality_score: float = strawberry.field(description="Data completeness score (0-100)")
```

### Query Extensions

```python
# app/graphql/schema.py

@strawberry.type
class Query:
    # Existing queries...

    @strawberry.field
    async def enhanced_analytics_dashboard(
        self,
        info: Info,
        child_id: str,
        date_range: Optional[int] = 30  # Days to analyze
    ) -> EnhancedAnalyticsDashboard:
        """Get comprehensive analytics dashboard with wireframe compliance"""
        # Implementation delegates to analytics service

    @strawberry.field
    async def weekly_pattern_history(
        self,
        info: Info,
        child_id: str,
        weeks_back: int = 12
    ) -> List[WeeklyPatternData]:
        """Get historical weekly patterns for trend analysis"""

    @strawberry.field
    async def cost_breakdown_detailed(
        self,
        info: Info,
        child_id: str,
        month_year: str  # Format: "2024-01"
    ) -> EnhancedCostAnalysis:
        """Get detailed cost breakdown for specific month"""
```

---

## 2. Database Schema Changes

### New Analytics Tables

```sql
-- Migration: 20240116_1400_enhanced_analytics_tables.sql

-- Daily analytics summaries for performance optimization
CREATE TABLE analytics_daily_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    date DATE NOT NULL,

    -- Daily counts and metrics
    total_changes INTEGER NOT NULL DEFAULT 0,
    change_times TIMESTAMP WITH TIME ZONE[] NOT NULL DEFAULT '{}',
    hourly_distribution JSONB NOT NULL DEFAULT '{}', -- {hour: count}

    -- Cost tracking
    estimated_cost_cad DECIMAL(10,2) DEFAULT 0,
    diaper_brand VARCHAR(100),
    diaper_size VARCHAR(10),

    -- Pattern metrics
    time_between_changes_avg INTERVAL,
    longest_gap INTERVAL,
    shortest_gap INTERVAL,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(child_id, date)
);

-- Weekly pattern cache for performance
CREATE TABLE analytics_weekly_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL,

    -- Pattern data
    daily_counts INTEGER[] NOT NULL, -- [mon, tue, wed, thu, fri, sat, sun]
    weekly_average DECIMAL(5,2) NOT NULL,
    consistency_percentage DECIMAL(5,2) NOT NULL,
    pattern_insights TEXT,

    -- Peak hours analysis
    peak_hours JSONB NOT NULL DEFAULT '{}', -- {time_range: percentage}
    hourly_distribution JSONB NOT NULL DEFAULT '{}',

    -- Weekend vs weekday analysis
    weekday_average DECIMAL(5,2),
    weekend_average DECIMAL(5,2),
    weekend_vs_weekday_ratio DECIMAL(5,2),

    -- Metadata
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_quality_score DECIMAL(5,2) DEFAULT 100,

    UNIQUE(child_id, week_start_date)
);

-- Cost analysis tracking
CREATE TABLE analytics_cost_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    month_year VARCHAR(7) NOT NULL, -- Format: "2024-01"

    -- Cost metrics
    total_cost_cad DECIMAL(10,2) NOT NULL DEFAULT 0,
    cost_per_change_cad DECIMAL(6,4) NOT NULL DEFAULT 0,
    efficiency_vs_target DECIMAL(5,2) DEFAULT 100,

    -- Usage patterns
    weekend_vs_weekday_usage DECIMAL(5,2),
    most_expensive_day VARCHAR(9), -- Day of week
    cost_trend_7day DECIMAL(5,2),

    -- Diaper data
    primary_brand VARCHAR(100),
    primary_size VARCHAR(10),
    brands_used JSONB DEFAULT '{}', -- {brand: count}
    sizes_used JSONB DEFAULT '{}', -- {size: count}

    -- Metadata
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(child_id, month_year)
);

-- Growth and size predictions
CREATE TABLE growth_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,

    -- Prediction data
    prediction_date_range VARCHAR(50) NOT NULL,
    confidence_score DECIMAL(5,2) NOT NULL,
    growth_velocity_cm_week DECIMAL(5,2),
    current_fit_efficiency DECIMAL(5,2),

    -- Size recommendations
    current_size VARCHAR(10),
    next_size_recommendation VARCHAR(10),
    prediction_basis TEXT,

    -- ML model metadata
    model_version VARCHAR(20),
    training_data_points INTEGER,
    prediction_created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,

    -- Only keep latest prediction per child
    UNIQUE(child_id)
);

-- Enhanced diaper changes table modifications
ALTER TABLE diaper_changes ADD COLUMN IF NOT EXISTS
    estimated_cost_cad DECIMAL(6,4) DEFAULT 0,
    diaper_brand VARCHAR(100),
    diaper_size VARCHAR(10),
    fit_rating INTEGER CHECK (fit_rating >= 1 AND fit_rating <= 5),
    efficiency_notes TEXT;

-- Indexes for performance
CREATE INDEX idx_analytics_daily_child_date ON analytics_daily_summaries(child_id, date DESC);
CREATE INDEX idx_analytics_weekly_child_week ON analytics_weekly_patterns(child_id, week_start_date DESC);
CREATE INDEX idx_cost_tracking_child_month ON analytics_cost_tracking(child_id, month_year DESC);
CREATE INDEX idx_diaper_changes_analytics ON diaper_changes(child_id, created_at DESC)
    WHERE deleted_at IS NULL;

-- RLS Policies for PIPEDA compliance
ALTER TABLE analytics_daily_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_weekly_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_cost_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_predictions ENABLE ROW LEVEL SECURITY;

-- Users can only access their own analytics data
CREATE POLICY analytics_daily_summaries_user_access ON analytics_daily_summaries
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY analytics_weekly_patterns_user_access ON analytics_weekly_patterns
    FOR ALL USING (child_id IN (SELECT id FROM children WHERE user_id = auth.uid()));

CREATE POLICY analytics_cost_tracking_user_access ON analytics_cost_tracking
    FOR ALL USING (child_id IN (SELECT id FROM children WHERE user_id = auth.uid()));

CREATE POLICY growth_predictions_user_access ON growth_predictions
    FOR ALL USING (child_id IN (SELECT id FROM children WHERE user_id = auth.uid()));
```

### Materialized Views for Performance

```sql
-- Materialized view for frequently accessed analytics
CREATE MATERIALIZED VIEW analytics_dashboard_cache AS
SELECT
    c.id as child_id,
    c.user_id,

    -- Current streak calculation
    (SELECT COUNT(*) FROM analytics_daily_summaries ads
     WHERE ads.child_id = c.id
     AND ads.total_changes > 0
     AND ads.date >= CURRENT_DATE - INTERVAL '30 days') as current_streak,

    -- Weekly average
    (SELECT AVG(total_changes) FROM analytics_daily_summaries ads
     WHERE ads.child_id = c.id
     AND ads.date >= CURRENT_DATE - INTERVAL '7 days') as weekly_average,

    -- Peak hour (most common hour)
    (SELECT hour FROM (
        SELECT hour, SUM(count) as total_count
        FROM analytics_daily_summaries ads,
        LATERAL jsonb_each_text(ads.hourly_distribution) AS h(hour, count)
        WHERE ads.child_id = c.id
        AND ads.date >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY hour
        ORDER BY total_count DESC
        LIMIT 1
    ) peak) as peak_hour,

    -- Monthly cost
    (SELECT total_cost_cad FROM analytics_cost_tracking act
     WHERE act.child_id = c.id
     AND act.month_year = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
     LIMIT 1) as monthly_cost_cad,

    -- Last updated
    GREATEST(
        (SELECT MAX(updated_at) FROM analytics_daily_summaries WHERE child_id = c.id),
        (SELECT MAX(calculated_at) FROM analytics_weekly_patterns WHERE child_id = c.id),
        (SELECT MAX(calculated_at) FROM analytics_cost_tracking WHERE child_id = c.id)
    ) as last_updated

FROM children c
WHERE c.deleted_at IS NULL;

-- Refresh strategy: Updated by triggers and background jobs
CREATE UNIQUE INDEX ON analytics_dashboard_cache (child_id);
```

---

## 3. Data Aggregation Logic

### Real-Time Processing (Triggered on Diaper Change)

```python
# app/services/analytics_service.py

class RealTimeAnalyticsProcessor:
    """Handles immediate analytics updates on diaper change events"""

    async def process_diaper_change_event(
        self,
        child_id: str,
        change_data: DiaperChangeData,
        session: AsyncSession
    ) -> None:
        """Process new diaper change for real-time analytics"""

        today = change_data.timestamp.date()

        # Update or create daily summary
        daily_summary = await self._get_or_create_daily_summary(
            child_id, today, session
        )

        # Update real-time metrics
        daily_summary.total_changes += 1
        daily_summary.change_times.append(change_data.timestamp)

        # Update hourly distribution
        hour = change_data.timestamp.hour
        hourly_dist = daily_summary.hourly_distribution or {}
        hourly_dist[str(hour)] = hourly_dist.get(str(hour), 0) + 1
        daily_summary.hourly_distribution = hourly_dist

        # Update cost estimation
        if change_data.estimated_cost:
            daily_summary.estimated_cost_cad += change_data.estimated_cost

        # Calculate time between changes
        if len(daily_summary.change_times) > 1:
            time_diff = (change_data.timestamp -
                        daily_summary.change_times[-2])
            daily_summary.time_between_changes_avg = self._update_running_average(
                daily_summary.time_between_changes_avg,
                time_diff,
                daily_summary.total_changes
            )

        daily_summary.updated_at = datetime.utcnow()
        await session.commit()

        # Trigger cache invalidation
        await self._invalidate_dashboard_cache(child_id)

    async def _get_or_create_daily_summary(
        self,
        child_id: str,
        date: datetime.date,
        session: AsyncSession
    ) -> AnalyticsDailySummary:
        """Get existing daily summary or create new one"""

        query = select(AnalyticsDailySummary).where(
            AnalyticsDailySummary.child_id == child_id,
            AnalyticsDailySummary.date == date
        )
        result = await session.execute(query)
        summary = result.scalar_one_or_none()

        if not summary:
            summary = AnalyticsDailySummary(
                child_id=child_id,
                date=date,
                total_changes=0,
                change_times=[],
                hourly_distribution={},
                estimated_cost_cad=0
            )
            session.add(summary)

        return summary
```

### Scheduled Aggregation Processing

```python
# app/services/scheduled_analytics.py

class ScheduledAnalyticsProcessor:
    """Handles complex analytics calculations via background jobs"""

    async def calculate_weekly_patterns(self, child_id: str) -> None:
        """Calculate weekly patterns - runs daily at midnight"""

        async for session in get_async_session():
            # Get last 7 days of data
            end_date = datetime.utcnow().date()
            start_date = end_date - timedelta(days=6)
            week_start = start_date - timedelta(days=start_date.weekday())

            # Get daily summaries for the week
            query = select(AnalyticsDailySummary).where(
                AnalyticsDailySummary.child_id == child_id,
                AnalyticsDailySummary.date >= start_date,
                AnalyticsDailySummary.date <= end_date
            ).order_by(AnalyticsDailySummary.date)

            result = await session.execute(query)
            daily_summaries = result.scalars().all()

            # Calculate weekly metrics
            daily_counts = [0] * 7  # Mon-Sun
            total_changes = 0
            hourly_totals = {}

            for summary in daily_summaries:
                day_index = summary.date.weekday()
                daily_counts[day_index] = summary.total_changes
                total_changes += summary.total_changes

                # Aggregate hourly distribution
                for hour, count in summary.hourly_distribution.items():
                    hourly_totals[hour] = hourly_totals.get(hour, 0) + count

            weekly_average = total_changes / 7 if total_changes > 0 else 0
            consistency_percentage = self._calculate_consistency(daily_counts)

            # Calculate peak hours
            peak_hours = self._calculate_peak_hours(hourly_totals, total_changes)

            # Weekend vs weekday analysis
            weekday_avg = sum(daily_counts[:5]) / 5  # Mon-Fri
            weekend_avg = sum(daily_counts[5:]) / 2  # Sat-Sun
            weekend_ratio = (weekend_avg / weekday_avg * 100) if weekday_avg > 0 else 0

            # Update or create weekly pattern record
            await self._upsert_weekly_pattern(
                session, child_id, week_start,
                daily_counts, weekly_average, consistency_percentage,
                peak_hours, hourly_totals, weekend_ratio
            )

            await session.commit()

    async def calculate_cost_analysis(self, child_id: str, month_year: str) -> None:
        """Calculate monthly cost analysis"""

        async for session in get_async_session():
            # Get month's data
            year, month = map(int, month_year.split('-'))
            start_date = datetime(year, month, 1).date()
            end_date = (start_date.replace(month=month+1) if month < 12
                       else start_date.replace(year=year+1, month=1)) - timedelta(days=1)

            # Aggregate cost data
            query = select(
                func.sum(AnalyticsDailySummary.estimated_cost_cad).label('total_cost'),
                func.sum(AnalyticsDailySummary.total_changes).label('total_changes'),
                func.avg(
                    case(
                        (extract('dow', AnalyticsDailySummary.date).in_([0, 6]),
                         AnalyticsDailySummary.total_changes),
                        else_=None
                    )
                ).label('weekend_avg'),
                func.avg(
                    case(
                        (extract('dow', AnalyticsDailySummary.date).between(1, 5),
                         AnalyticsDailySummary.total_changes),
                        else_=None
                    )
                ).label('weekday_avg')
            ).where(
                AnalyticsDailySummary.child_id == child_id,
                AnalyticsDailySummary.date >= start_date,
                AnalyticsDailySummary.date <= end_date
            )

            result = await session.execute(query)
            cost_data = result.first()

            if cost_data.total_changes > 0:
                cost_per_change = cost_data.total_cost / cost_data.total_changes
                weekend_vs_weekday = ((cost_data.weekend_avg / cost_data.weekday_avg * 100)
                                    if cost_data.weekday_avg > 0 else 100)

                # Calculate efficiency vs target (target: $0.20 CAD per change)
                target_cost_per_change = 0.20
                efficiency_vs_target = min(100, (target_cost_per_change / cost_per_change) * 100)

                await self._upsert_cost_analysis(
                    session, child_id, month_year,
                    cost_data.total_cost, cost_per_change,
                    efficiency_vs_target, weekend_vs_weekday
                )

            await session.commit()

    async def generate_size_predictions(self, child_id: str) -> None:
        """Generate ML-based size change predictions"""

        async for session in get_async_session():
            # Get child's growth data
            child_data = await self._get_child_growth_data(session, child_id)

            if len(child_data.measurements) < 3:
                # Not enough data for predictions
                return

            # Use existing ML libraries (numpy, pandas, scikit-learn)
            prediction_result = await self._run_growth_prediction_model(child_data)

            if prediction_result:
                # Store prediction
                prediction = GrowthPrediction(
                    child_id=child_id,
                    prediction_date_range=prediction_result.date_range,
                    confidence_score=prediction_result.confidence,
                    growth_velocity_cm_week=prediction_result.growth_velocity,
                    current_fit_efficiency=prediction_result.fit_efficiency,
                    next_size_recommendation=prediction_result.next_size,
                    prediction_basis=prediction_result.basis,
                    model_version="v1.0",
                    training_data_points=len(child_data.measurements),
                    expires_at=datetime.utcnow() + timedelta(days=7)
                )

                # Replace existing prediction
                await session.execute(
                    delete(GrowthPrediction).where(
                        GrowthPrediction.child_id == child_id
                    )
                )

                session.add(prediction)
                await session.commit()
```

---

## 4. Caching Strategy

### Multi-Level Caching Architecture

```python
# app/services/cache_service.py

class AnalyticsCacheService:
    """Multi-level caching for analytics performance optimization"""

    def __init__(self, redis_client: Redis):
        self.redis = redis_client
        self.cache_ttl = {
            'real_time': 300,      # 5 minutes
            'near_real_time': 1800, # 30 minutes
            'periodic': 3600,       # 1 hour
            'daily': 86400         # 24 hours
        }

    async def get_dashboard_data(
        self,
        child_id: str,
        force_refresh: bool = False
    ) -> Optional[EnhancedAnalyticsDashboard]:
        """Get cached dashboard data with fallback to database"""

        cache_key = f"analytics:dashboard:{child_id}"

        if not force_refresh:
            # Try Redis cache first
            cached_data = await self.redis.get(cache_key)
            if cached_data:
                return EnhancedAnalyticsDashboard.from_json(cached_data)

        # Fallback to database aggregation
        dashboard_data = await self._generate_dashboard_data(child_id)

        # Cache for 30 minutes
        await self.redis.setex(
            cache_key,
            self.cache_ttl['near_real_time'],
            dashboard_data.to_json()
        )

        return dashboard_data

    async def invalidate_child_cache(self, child_id: str) -> None:
        """Invalidate all cache entries for a child"""

        patterns = [
            f"analytics:dashboard:{child_id}",
            f"analytics:weekly:{child_id}:*",
            f"analytics:cost:{child_id}:*",
            f"analytics:predictions:{child_id}"
        ]

        for pattern in patterns:
            keys = await self.redis.keys(pattern)
            if keys:
                await self.redis.delete(*keys)

    async def cache_weekly_patterns(
        self,
        child_id: str,
        patterns: List[WeeklyPatternData]
    ) -> None:
        """Cache weekly patterns with appropriate TTL"""

        for pattern in patterns:
            cache_key = f"analytics:weekly:{child_id}:{pattern.week_start_date}"
            await self.redis.setex(
                cache_key,
                self.cache_ttl['daily'],
                pattern.to_json()
            )
```

### Apollo Client Cache Configuration

```typescript
// lib/graphql/cache.ts

import { InMemoryCache, TypePolicies } from '@apollo/client';

const typePolicies: TypePolicies = {
  Query: {
    fields: {
      enhancedAnalyticsDashboard: {
        // Cache based on child_id and date_range
        keyArgs: ['child_id', 'date_range'],
        // Merge new data with existing cache
        merge(existing, incoming, { args }) {
          return incoming;
        }
      },
      weeklyPatternHistory: {
        keyArgs: ['child_id'],
        merge(existing = [], incoming, { args }) {
          // Merge historical data intelligently
          const merged = [...existing];
          incoming.forEach((newPattern: any) => {
            const existingIndex = merged.findIndex(
              (p: any) => p.weekStartDate === newPattern.weekStartDate
            );
            if (existingIndex >= 0) {
              merged[existingIndex] = newPattern;
            } else {
              merged.push(newPattern);
            }
          });
          return merged.sort((a: any, b: any) =>
            new Date(b.weekStartDate).getTime() - new Date(a.weekStartDate).getTime()
          );
        }
      }
    }
  },
  EnhancedAnalyticsDashboard: {
    fields: {
      weeklyPatterns: {
        // Cache weekly patterns separately for granular updates
        merge: true
      },
      costAnalysis: {
        // Cost analysis can be cached longer
        merge: true
      },
      sizePredictions: {
        // Predictions update less frequently
        merge: true
      }
    }
  }
};

export const analyticsCache = new InMemoryCache({
  typePolicies,
  // Enable cache persistence for offline support
  addTypename: true,
  resultCaching: true
});

// Cache policy definitions for different data freshness requirements
export const CACHE_POLICIES = {
  REAL_TIME: 'cache-first',      // Today's data, streaks
  NEAR_REAL_TIME: 'cache-first', // Recent patterns, costs
  PERIODIC: 'cache-first',       // Weekly patterns, trends
  PREDICTIONS: 'cache-first'     // ML predictions, size changes
} as const;
```

### Frontend Hook with Intelligent Caching

```typescript
// hooks/useEnhancedAnalytics.ts

import { useQuery, useLazyQuery } from '@apollo/client';
import { useCallback, useEffect } from 'react';

interface UseEnhancedAnalyticsOptions {
  childId: string;
  dateRange?: number;
  enableRealTimeUpdates?: boolean;
  cachePolicy?: 'cache-first' | 'network-only' | 'cache-only';
}

export function useEnhancedAnalytics({
  childId,
  dateRange = 30,
  enableRealTimeUpdates = true,
  cachePolicy = 'cache-first'
}: UseEnhancedAnalyticsOptions) {

  // Main analytics query with smart caching
  const { data, loading, error, refetch } = useQuery(
    ENHANCED_ANALYTICS_DASHBOARD_QUERY,
    {
      variables: { childId, dateRange },
      fetchPolicy: cachePolicy,
      // Update cache in background every 5 minutes for real-time data
      pollInterval: enableRealTimeUpdates ? 300000 : 0,
      // Enable optimistic UI updates
      notifyOnNetworkStatusChange: true,
      // Error handling for offline scenarios
      errorPolicy: 'all'
    }
  );

  // Lazy query for historical data
  const [fetchHistoricalData, {
    data: historicalData,
    loading: historicalLoading
  }] = useLazyQuery(WEEKLY_PATTERN_HISTORY_QUERY, {
    fetchPolicy: 'cache-first',
    variables: { childId, weeksBack: 12 }
  });

  // Optimistic update for new diaper changes
  const updateAnalyticsOptimistically = useCallback((
    newChangeData: DiaperChangeData
  ) => {
    // Update Apollo cache optimistically
    client.cache.modify({
      id: client.cache.identify({
        __typename: 'EnhancedAnalyticsDashboard',
        childId
      }),
      fields: {
        overview(existing) {
          return {
            ...existing,
            summary: {
              ...existing.summary,
              todayChanges: existing.summary.todayChanges + 1
            }
          };
        }
      }
    });
  }, [childId]);

  // Background refresh for data quality
  useEffect(() => {
    if (enableRealTimeUpdates) {
      // Refetch if data becomes stale (older than 10 minutes)
      const lastUpdate = data?.enhancedAnalyticsDashboard?.lastUpdated;
      if (lastUpdate) {
        const staleThreshold = 10 * 60 * 1000; // 10 minutes
        const timeSinceUpdate = Date.now() - new Date(lastUpdate).getTime();

        if (timeSinceUpdate > staleThreshold) {
          refetch();
        }
      }
    }
  }, [data, enableRealTimeUpdates, refetch]);

  return {
    analytics: data?.enhancedAnalyticsDashboard,
    historicalData: historicalData?.weeklyPatternHistory,
    loading,
    historicalLoading,
    error,
    refetch,
    fetchHistoricalData,
    updateAnalyticsOptimistically,
    // Helper methods for component use
    isDataFresh: () => {
      const lastUpdate = data?.enhancedAnalyticsDashboard?.lastUpdated;
      return lastUpdate ?
        (Date.now() - new Date(lastUpdate).getTime()) < 300000 : false;
    },
    dataQualityScore: data?.enhancedAnalyticsDashboard?.dataQualityScore || 0
  };
}
```

---

## 5. Migration Plan

### Phase 1: Database Schema Migration (Week 1)

```bash
# Migration execution order

# 1. Create new analytics tables
alembic revision --autogenerate -m "create_analytics_tables"
# File: alembic/versions/20240116_1400_create_analytics_tables.py

# 2. Add columns to existing tables
alembic revision --autogenerate -m "enhance_diaper_changes_analytics"
# File: alembic/versions/20240116_1430_enhance_diaper_changes_analytics.py

# 3. Create indexes and constraints
alembic revision --autogenerate -m "add_analytics_indexes"
# File: alembic/versions/20240116_1500_add_analytics_indexes.py

# 4. Create materialized views
alembic revision --autogenerate -m "create_analytics_materialized_views"
# File: alembic/versions/20240116_1530_create_analytics_materialized_views.py

# Execute migrations
alembic upgrade head
```

**Safety Measures:**
- All migrations are non-destructive (additive only)
- New tables have proper RLS policies from creation
- Existing functionality remains unaffected
- Rollback scripts prepared for each migration step

### Phase 2: Background Data Processing (Week 2)

```python
# app/services/migration_data_processor.py

class AnalyticsMigrationProcessor:
    """Safely populate analytics tables with historical data"""

    async def migrate_historical_data(self, batch_size: int = 1000) -> None:
        """Process existing diaper changes into analytics tables"""

        # Process in batches to avoid overwhelming database
        async for session in get_async_session():
            # Get all children with diaper changes
            children_query = select(Child.id).distinct().join(
                DiaperChange, Child.id == DiaperChange.child_id
            ).where(DiaperChange.deleted_at.is_(None))

            children_result = await session.execute(children_query)
            child_ids = children_result.scalars().all()

            for child_id in child_ids:
                await self._process_child_historical_data(
                    session, child_id, batch_size
                )

            await session.commit()

    async def _process_child_historical_data(
        self,
        session: AsyncSession,
        child_id: str,
        batch_size: int
    ) -> None:
        """Process historical data for one child"""

        # Get all diaper changes for child, ordered by date
        changes_query = select(DiaperChange).where(
            DiaperChange.child_id == child_id,
            DiaperChange.deleted_at.is_(None)
        ).order_by(DiaperChange.created_at)

        changes_result = await session.execute(changes_query)
        all_changes = changes_result.scalars().all()

        # Group by date and create daily summaries
        changes_by_date = {}
        for change in all_changes:
            date = change.created_at.date()
            if date not in changes_by_date:
                changes_by_date[date] = []
            changes_by_date[date].append(change)

        # Create daily summaries
        for date, changes in changes_by_date.items():
            await self._create_daily_summary_from_changes(
                session, child_id, date, changes
            )

        # Calculate weekly patterns for completed weeks
        await self._calculate_historical_weekly_patterns(
            session, child_id, list(changes_by_date.keys())
        )
```

### Phase 3: GraphQL API Extension (Week 3)

```python
# Gradual API rollout strategy

# 1. Add new resolvers alongside existing ones
@strawberry.field
async def enhanced_analytics_dashboard_beta(
    self,
    info: Info,
    child_id: str
) -> EnhancedAnalyticsDashboard:
    """Beta version of enhanced analytics - feature flag controlled"""

    # Check feature flag
    if not await feature_flag_service.is_enabled(
        "enhanced_analytics",
        info.context.user_id
    ):
        # Return existing analytics with default new fields
        existing = await self.analytics_dashboard(info, child_id)
        return self._extend_with_defaults(existing)

    # Return full enhanced analytics
    return await analytics_service.get_enhanced_dashboard(child_id)

# 2. Implement feature flags for gradual rollout
class FeatureFlagService:
    async def is_enabled(self, flag_name: str, user_id: str) -> bool:
        """Check if feature is enabled for user"""

        # Start with 10% of users
        if flag_name == "enhanced_analytics":
            return hash(user_id) % 10 == 0

        return False
```

### Phase 4: Frontend Integration (Week 4)

```typescript
// Gradual frontend rollout with fallbacks

// hooks/useEnhancedAnalyticsBeta.ts
export function useEnhancedAnalyticsBeta(childId: string) {
  const [isEnhancedEnabled, setIsEnhancedEnabled] = useState(false);

  // Check if user has enhanced analytics enabled
  const { data: featureFlags } = useQuery(USER_FEATURE_FLAGS_QUERY);

  useEffect(() => {
    setIsEnhancedEnabled(
      featureFlags?.userFeatureFlags?.enhancedAnalytics || false
    );
  }, [featureFlags]);

  // Use enhanced or legacy analytics based on feature flag
  const { data, loading, error } = useQuery(
    isEnhancedEnabled
      ? ENHANCED_ANALYTICS_DASHBOARD_QUERY
      : ANALYTICS_DASHBOARD_QUERY,
    {
      variables: { childId },
      fetchPolicy: 'cache-first'
    }
  );

  return {
    analytics: data?.enhancedAnalyticsDashboard || data?.analyticsDashboard,
    isEnhanced: isEnhancedEnabled,
    loading,
    error
  };
}

// Components with progressive enhancement
export function AnalyticsDashboard({ childId }: { childId: string }) {
  const { analytics, isEnhanced, loading } = useEnhancedAnalyticsBeta(childId);

  if (loading) return <AnalyticsLoadingState />;

  return (
    <View>
      {/* Always show existing sections */}
      <OverviewSection data={analytics.overview} />
      <UsageSection data={analytics.usage} />
      <TrendsSection data={analytics.trends} />

      {/* Show enhanced sections only if enabled */}
      {isEnhanced && (
        <>
          <WeeklyPatternsSection data={analytics.weeklyPatterns} />
          <CostAnalysisSection data={analytics.costAnalysis} />
          <PeakHoursSection data={analytics.peakHoursDetailed} />
          <SizePredictionsSection data={analytics.sizePredictions} />
        </>
      )}
    </View>
  );
}
```

### Phase 5: Full Production Rollout (Week 5)

**Monitoring and Validation:**

```python
# Deployment checklist and monitoring

class AnalyticsDeploymentValidator:
    """Validate analytics system health during rollout"""

    async def validate_data_accuracy(self) -> ValidationReport:
        """Compare old vs new analytics calculations"""

        discrepancies = []

        # Sample 100 random children
        sample_children = await self._get_sample_children(100)

        for child_id in sample_children:
            old_analytics = await legacy_analytics.calculate(child_id)
            new_analytics = await enhanced_analytics.calculate(child_id)

            # Compare overlapping metrics
            if abs(old_analytics.weekly_average - new_analytics.weekly_average) > 0.1:
                discrepancies.append({
                    'child_id': child_id,
                    'metric': 'weekly_average',
                    'old_value': old_analytics.weekly_average,
                    'new_value': new_analytics.weekly_average
                })

        return ValidationReport(
            discrepancies=discrepancies,
            accuracy_percentage=(len(sample_children) - len(discrepancies)) / len(sample_children) * 100
        )

    async def monitor_performance_impact(self) -> PerformanceReport:
        """Monitor database and API performance"""

        return PerformanceReport(
            avg_query_time=await self._measure_query_performance(),
            cache_hit_rate=await self._measure_cache_efficiency(),
            database_load=await self._measure_database_impact()
        )
```

### Rollback Strategy

```sql
-- Emergency rollback procedures

-- 1. Disable enhanced analytics via feature flags
UPDATE feature_flags SET enabled = false WHERE flag_name = 'enhanced_analytics';

-- 2. Remove new GraphQL fields (code deployment)
-- Deploy previous version of GraphQL schema

-- 3. Database rollback (if needed)
-- New tables can remain but won't be queried
-- Drop materialized views if causing performance issues
DROP MATERIALIZED VIEW IF EXISTS analytics_dashboard_cache;

-- 4. Cache cleanup
-- Redis keys will expire naturally
-- Force cleanup if needed: FLUSHDB analytics:*
```

---

## 6. PIPEDA Compliance Integration

### Privacy by Design Principles

**Data Minimization:**
```python
# app/services/analytics_privacy.py

class AnalyticsPrivacyService:
    """Ensure PIPEDA compliance in analytics processing"""

    async def sanitize_analytics_data(
        self,
        analytics_data: EnhancedAnalyticsDashboard,
        consent_level: ConsentLevel
    ) -> EnhancedAnalyticsDashboard:
        """Sanitize analytics based on user consent"""

        if consent_level == ConsentLevel.MINIMAL:
            # Only basic functionality, no detailed analytics
            return self._minimal_analytics_view(analytics_data)

        elif consent_level == ConsentLevel.ANALYTICS_ONLY:
            # Full analytics but no ML predictions
            analytics_data.size_predictions = None
            return analytics_data

        elif consent_level == ConsentLevel.FULL_FEATURES:
            # All features available
            return analytics_data

    def _minimal_analytics_view(
        self,
        analytics_data: EnhancedAnalyticsDashboard
    ) -> EnhancedAnalyticsDashboard:
        """Create privacy-focused minimal analytics view"""

        return EnhancedAnalyticsDashboard(
            # Keep basic functionality
            overview=analytics_data.overview,

            # Limit detailed tracking
            usage=self._limit_usage_tracking(analytics_data.usage),
            trends=self._limit_trend_tracking(analytics_data.trends),

            # Remove detailed analytics
            weekly_patterns=None,
            cost_analysis=None,
            peak_hours_detailed=None,
            size_predictions=None,

            last_updated=analytics_data.last_updated,
            data_quality_score=analytics_data.data_quality_score
        )
```

**Consent Management Integration:**

```python
# app/models/consent.py

class AnalyticsConsent(Base):
    """Track granular consent for analytics features"""

    __tablename__ = "analytics_consent"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("auth.users.id"), nullable=False)

    # Granular consent levels
    basic_analytics_consent = Column(Boolean, default=True)
    detailed_patterns_consent = Column(Boolean, default=False)
    cost_tracking_consent = Column(Boolean, default=False)
    ml_predictions_consent = Column(Boolean, default=False)

    # Audit trail
    consent_given_at = Column(DateTime(timezone=True), default=func.now())
    consent_updated_at = Column(DateTime(timezone=True), default=func.now())
    consent_version = Column(String(10), default="1.0")

    # Metadata
    ip_address = Column(String(45))  # For audit purposes
    user_agent = Column(Text)

    __table_args__ = (
        Index("idx_analytics_consent_user", "user_id"),
    )

# GraphQL integration
@strawberry.type
class AnalyticsConsentPreferences:
    basic_analytics: bool
    detailed_patterns: bool
    cost_tracking: bool
    ml_predictions: bool
    last_updated: datetime

@strawberry.mutation
async def update_analytics_consent(
    self,
    info: Info,
    preferences: AnalyticsConsentInput
) -> MutationResponse:
    """Update user's analytics consent preferences"""

    user_id = await get_current_user_id(info)

    async for session in get_async_session():
        # Update consent record
        consent = await session.get(AnalyticsConsent, user_id)
        if not consent:
            consent = AnalyticsConsent(user_id=user_id)
            session.add(consent)

        consent.basic_analytics_consent = preferences.basic_analytics
        consent.detailed_patterns_consent = preferences.detailed_patterns
        consent.cost_tracking_consent = preferences.cost_tracking
        consent.ml_predictions_consent = preferences.ml_predictions
        consent.consent_updated_at = datetime.utcnow()

        await session.commit()

        # Invalidate analytics cache to respect new preferences
        await analytics_cache.invalidate_user_cache(user_id)

        return SuccessResponse(message="Analytics preferences updated")
```

**Data Retention and Deletion:**

```python
# app/services/analytics_retention.py

class AnalyticsRetentionService:
    """Handle PIPEDA-compliant data retention and deletion"""

    async def apply_retention_policy(self) -> None:
        """Apply data retention policies - run daily"""

        async for session in get_async_session():
            # Delete analytics summaries older than 2 years
            retention_date = datetime.utcnow() - timedelta(days=730)

            await session.execute(
                delete(AnalyticsDailySummary)
                .where(AnalyticsDailySummary.date < retention_date.date())
            )

            # Delete weekly patterns older than 1 year
            weekly_retention = datetime.utcnow() - timedelta(days=365)

            await session.execute(
                delete(AnalyticsWeeklyPattern)
                .where(AnalyticsWeeklyPattern.week_start_date < weekly_retention.date())
            )

            # Delete expired predictions
            await session.execute(
                delete(GrowthPrediction)
                .where(GrowthPrediction.expires_at < datetime.utcnow())
            )

            await session.commit()

    async def delete_user_analytics_data(self, user_id: str) -> None:
        """Complete deletion of user's analytics data"""

        async for session in get_async_session():
            # Get all child IDs for user
            children_query = select(Child.id).where(Child.user_id == user_id)
            children_result = await session.execute(children_query)
            child_ids = children_result.scalars().all()

            if child_ids:
                # Delete all analytics data for user's children
                await session.execute(
                    delete(AnalyticsDailySummary)
                    .where(AnalyticsDailySummary.child_id.in_(child_ids))
                )

                await session.execute(
                    delete(AnalyticsWeeklyPattern)
                    .where(AnalyticsWeeklyPattern.child_id.in_(child_ids))
                )

                await session.execute(
                    delete(AnalyticsCostTracking)
                    .where(AnalyticsCostTracking.child_id.in_(child_ids))
                )

                await session.execute(
                    delete(GrowthPrediction)
                    .where(GrowthPrediction.child_id.in_(child_ids))
                )

            # Delete consent record
            await session.execute(
                delete(AnalyticsConsent)
                .where(AnalyticsConsent.user_id == user_id)
            )

            await session.commit()

            # Clear cache
            await analytics_cache.invalidate_user_cache(user_id)
```

**Canadian Data Residency Compliance:**

```python
# app/config/analytics_config.py

class AnalyticsConfig:
    """Configuration ensuring Canadian data residency"""

    # All analytics processing must occur in Canadian regions
    SUPABASE_REGION = "ca-central-1"  # Canadian region
    REDIS_REGION = "ca-central-1"     # Canadian Redis instance

    # No third-party analytics services
    GOOGLE_ANALYTICS_ENABLED = False
    MIXPANEL_ENABLED = False
    AMPLITUDE_ENABLED = False

    # Data export compliance
    DATA_EXPORT_ENABLED = True
    DATA_EXPORT_FORMAT = "JSON"  # Machine-readable format as required

    # Audit trail requirements
    AUDIT_ALL_ANALYTICS_ACCESS = True
    AUDIT_LOG_RETENTION_DAYS = 2555  # 7 years as per PIPEDA guidelines

# Security headers for analytics API
ANALYTICS_SECURITY_HEADERS = {
    "X-Data-Residency": "CA",
    "X-Privacy-Policy": "PIPEDA-Compliant",
    "X-Data-Processing": "Canadian-Only",
    "Access-Control-Allow-Origin": "https://nestsync.app",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY"
}
```

---

## 7. Performance Optimization Strategy

### Database Performance Considerations

```sql
-- Optimized indexes for analytics queries
CREATE INDEX CONCURRENTLY idx_analytics_daily_child_date_covering
ON analytics_daily_summaries (child_id, date DESC)
INCLUDE (total_changes, estimated_cost_cad, hourly_distribution);

CREATE INDEX CONCURRENTLY idx_diaper_changes_analytics_covering
ON diaper_changes (child_id, created_at DESC)
INCLUDE (estimated_cost_cad, diaper_size, fit_rating)
WHERE deleted_at IS NULL;

-- Partitioning strategy for large datasets
CREATE TABLE analytics_daily_summaries_partitioned (
    LIKE analytics_daily_summaries INCLUDING ALL
) PARTITION BY RANGE (date);

-- Create monthly partitions
CREATE TABLE analytics_daily_summaries_2024_01
    PARTITION OF analytics_daily_summaries_partitioned
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- Automated partition management
CREATE OR REPLACE FUNCTION create_monthly_partition(table_name text, start_date date)
RETURNS void AS $$
DECLARE
    partition_name text;
    end_date date;
BEGIN
    partition_name := table_name || '_' || to_char(start_date, 'YYYY_MM');
    end_date := start_date + interval '1 month';

    EXECUTE format('CREATE TABLE %I PARTITION OF %I FOR VALUES FROM (%L) TO (%L)',
                   partition_name, table_name, start_date, end_date);
END;
$$ LANGUAGE plpgsql;
```

### Mobile Performance Optimizations

```typescript
// Optimized GraphQL queries with field selection
const OPTIMIZED_ANALYTICS_QUERY = gql`
  query OptimizedAnalyticsDashboard($childId: ID!, $includeDetailed: Boolean = false) {
    enhancedAnalyticsDashboard(childId: $childId) {
      # Always fetch basic data
      overview {
        summary {
          todayChanges
          currentStreak
        }
        raw {
          averageEfficiency
        }
      }

      # Conditionally fetch detailed data
      weeklyPatterns @include(if: $includeDetailed) {
        dailyCounts
        weeklyAverage
        consistencyPercentage
      }

      costAnalysis @include(if: $includeDetailed) {
        monthlyCostCad
        costPerChangeCad
        efficiencyVsTarget
      }

      lastUpdated
      dataQualityScore
    }
  }
`;

// Progressive data loading
export function useProgressiveAnalytics(childId: string) {
  // Load basic data first
  const { data: basicData, loading: basicLoading } = useQuery(
    OPTIMIZED_ANALYTICS_QUERY,
    {
      variables: { childId, includeDetailed: false },
      fetchPolicy: 'cache-first'
    }
  );

  // Load detailed data after basic data loads
  const { data: detailedData, loading: detailedLoading } = useQuery(
    OPTIMIZED_ANALYTICS_QUERY,
    {
      variables: { childId, includeDetailed: true },
      fetchPolicy: 'cache-first',
      skip: basicLoading // Wait for basic data first
    }
  );

  return {
    analytics: detailedData?.enhancedAnalyticsDashboard || basicData?.enhancedAnalyticsDashboard,
    isBasicLoaded: !basicLoading && basicData,
    isFullyLoaded: !detailedLoading && detailedData,
    loading: basicLoading || detailedLoading
  };
}
```

### Background Job Architecture

```python
# app/services/background_jobs.py

from celery import Celery
from celery.schedules import crontab

# Initialize Celery for background processing
celery_app = Celery('nestsync_analytics')

class AnalyticsBackgroundJobs:
    """Background job management for analytics processing"""

    @celery_app.task(bind=True, max_retries=3)
    def process_daily_analytics(self, child_id: str, date: str):
        """Process daily analytics - runs at 1 AM daily"""
        try:
            processor = ScheduledAnalyticsProcessor()
            asyncio.run(processor.calculate_weekly_patterns(child_id))

        except Exception as exc:
            # Retry with exponential backoff
            raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))

    @celery_app.task
    def refresh_materialized_views():
        """Refresh materialized views - runs every 30 minutes"""
        asyncio.run(refresh_analytics_dashboard_cache())

    @celery_app.task
    def cleanup_expired_data():
        """Data retention cleanup - runs daily at 3 AM"""
        retention_service = AnalyticsRetentionService()
        asyncio.run(retention_service.apply_retention_policy())

# Celery beat schedule
celery_app.conf.beat_schedule = {
    'process-daily-analytics': {
        'task': 'app.services.background_jobs.process_daily_analytics',
        'schedule': crontab(hour=1, minute=0),  # 1 AM daily
    },
    'refresh-materialized-views': {
        'task': 'app.services.background_jobs.refresh_materialized_views',
        'schedule': crontab(minute='*/30'),  # Every 30 minutes
    },
    'cleanup-expired-data': {
        'task': 'app.services.background_jobs.cleanup_expired_data',
        'schedule': crontab(hour=3, minute=0),  # 3 AM daily
    }
}
```

---

## 8. Implementation Team Handoff

### For Backend Engineers

**Priority 1: Database Schema Implementation**
- Implement SQL migrations in `/alembic/versions/`
- Add new SQLAlchemy models in `/app/models/analytics.py`
- Ensure all RLS policies are properly configured
- Test migration rollback procedures

**Priority 2: GraphQL Resolver Implementation**
- Extend existing resolvers in `/app/graphql/resolvers/analytics.py`
- Implement new analytics service methods
- Add proper error handling and logging
- Implement feature flag integration

**Priority 3: Background Processing**
- Set up Celery workers for analytics processing
- Implement scheduled job handlers
- Add monitoring and alerting for job failures
- Test data processing accuracy

### For Frontend Engineers

**Priority 1: Component Architecture**
- Create wireframe-compliant dashboard components
- Implement progressive data loading hooks
- Add loading states and error boundaries
- Ensure cross-platform compatibility (iOS/Android/Web)

**Priority 2: State Management**
- Extend Apollo Client cache configuration
- Implement optimistic updates for real-time data
- Add offline support for cached analytics
- Test cache invalidation strategies

**Priority 3: UI/UX Implementation**
- Follow design system patterns for new components
- Implement psychology-driven UX patterns
- Add accessibility compliance (WCAG AA)
- Test on multiple device sizes and orientations

### For QA Engineers

**Testing Strategy Framework:**

```typescript
// Test scenarios for analytics system validation

export const ANALYTICS_TEST_SCENARIOS = {
  // Data accuracy tests
  DATA_ACCURACY: {
    'weekly_pattern_calculation': {
      input: 'Daily changes: [8, 9, 7, 8, 10, 6, 9]',
      expected: 'Weekly average: 8.14, Consistency: 85%'
    },
    'cost_calculation': {
      input: '$0.25 per diaper, 8 changes/day, 30 days',
      expected: 'Monthly cost: $60.00 CAD'
    }
  },

  // Performance tests
  PERFORMANCE: {
    'dashboard_load_time': {
      target: '< 2 seconds for cached data',
      measurement: 'Time to interactive on dashboard'
    },
    'real_time_updates': {
      target: '< 5 seconds for new diaper change reflection',
      measurement: 'Cache invalidation and UI update'
    }
  },

  // Edge cases
  EDGE_CASES: {
    'insufficient_data': {
      scenario: 'New user with < 3 days of data',
      expected: 'Graceful degradation with appropriate messaging'
    },
    'data_gaps': {
      scenario: 'Missing data for certain days',
      expected: 'Interpolation or clear indication of missing data'
    }
  }
};
```

### For Security Analysts

**Security Validation Checklist:**

1. **Data Protection:**
   - Verify all analytics data has proper RLS policies
   - Test that users can only access their own data
   - Validate encryption for data at rest and in transit

2. **PIPEDA Compliance:**
   - Audit consent management implementation
   - Test data export and deletion capabilities
   - Verify Canadian data residency requirements

3. **API Security:**
   - Test GraphQL query complexity limits
   - Validate rate limiting on analytics endpoints
   - Test authentication token handling

4. **Privacy Controls:**
   - Test granular consent preferences
   - Verify data minimization practices
   - Audit data retention policy implementation

---

## 9. Success Metrics and Monitoring

### Key Performance Indicators

```python
# app/monitoring/analytics_kpis.py

class AnalyticsKPIMonitoring:
    """Monitor analytics system performance and adoption"""

    async def calculate_system_health_metrics(self) -> Dict[str, float]:
        """Calculate system health KPIs"""

        async for session in get_async_session():
            # Data freshness
            avg_data_age = await self._calculate_average_data_age(session)

            # Cache efficiency
            cache_hit_rate = await self._calculate_cache_hit_rate()

            # User engagement
            daily_active_analytics_users = await self._count_daily_analytics_users(session)

            # Data quality
            avg_data_quality_score = await self._calculate_avg_data_quality(session)

            return {
                'data_freshness_minutes': avg_data_age,
                'cache_hit_rate_percentage': cache_hit_rate,
                'daily_active_users': daily_active_analytics_users,
                'data_quality_score': avg_data_quality_score,
                'system_uptime_percentage': await self._calculate_uptime()
            }

    async def calculate_business_metrics(self) -> Dict[str, float]:
        """Calculate business impact KPIs"""

        async for session in get_async_session():
            # Feature adoption
            enhanced_analytics_adoption = await self._calculate_feature_adoption(
                session, 'enhanced_analytics'
            )

            # User retention
            analytics_user_retention = await self._calculate_analytics_retention(session)

            # Cost efficiency
            processing_cost_per_user = await self._calculate_processing_costs(session)

            return {
                'enhanced_analytics_adoption_percentage': enhanced_analytics_adoption,
                'analytics_user_7day_retention': analytics_user_retention,
                'monthly_processing_cost_per_user_cad': processing_cost_per_user
            }
```

### Monitoring Dashboard Configuration

```python
# Prometheus metrics for monitoring
from prometheus_client import Counter, Histogram, Gauge

# Analytics-specific metrics
analytics_queries_total = Counter(
    'analytics_queries_total',
    'Total number of analytics queries',
    ['query_type', 'status']
)

analytics_processing_duration = Histogram(
    'analytics_processing_duration_seconds',
    'Time spent processing analytics',
    ['processing_type']
)

analytics_data_quality = Gauge(
    'analytics_data_quality_score',
    'Current data quality score',
    ['child_id']
)

# Usage in resolvers
@strawberry.field
async def enhanced_analytics_dashboard(self, info: Info, child_id: str) -> EnhancedAnalyticsDashboard:
    start_time = time.time()

    try:
        # Process analytics
        result = await analytics_service.get_enhanced_dashboard(child_id)

        # Record success metrics
        analytics_queries_total.labels(
            query_type='enhanced_dashboard',
            status='success'
        ).inc()

        analytics_data_quality.labels(child_id=child_id).set(
            result.data_quality_score
        )

        return result

    except Exception as e:
        # Record error metrics
        analytics_queries_total.labels(
            query_type='enhanced_dashboard',
            status='error'
        ).inc()
        raise

    finally:
        # Record processing time
        analytics_processing_duration.labels(
            processing_type='dashboard_generation'
        ).observe(time.time() - start_time)
```

---

## 10. Conclusion and Next Steps

### Architecture Summary

This comprehensive data pipeline architecture provides:

1. **Scalable Foundation**: Multi-level caching, efficient database design, and background processing
2. **Mobile-Optimized**: Progressive loading, intelligent caching, and minimal bandwidth usage
3. **PIPEDA Compliant**: Privacy-by-design, granular consent, and Canadian data residency
4. **Production Ready**: Comprehensive monitoring, rollback strategies, and performance optimization

### Technical Deliverables Ready for Implementation

1. **Database Migrations**: Complete SQL scripts for new analytics tables
2. **GraphQL Schema**: Type definitions and resolver specifications
3. **Caching Strategy**: Multi-level caching with intelligent invalidation
4. **Background Jobs**: Scheduled processing for complex analytics
5. **Frontend Integration**: Progressive loading hooks and component architecture

### Immediate Next Actions

**Week 1-2: Foundation**
- Execute database migrations in development environment
- Implement core GraphQL types and basic resolvers
- Set up Redis caching infrastructure

**Week 3-4: Core Features**
- Implement weekly pattern calculations
- Add cost analysis processing
- Create background job processing

**Week 5-6: Frontend Integration**
- Build wireframe-compliant dashboard components
- Implement progressive data loading
- Add comprehensive error handling

### Long-term Roadmap

**Phase 2 (Months 2-3): ML Enhancements**
- Implement growth prediction models using existing ML libraries
- Add anomaly detection for unusual patterns
- Create personalized insights engine

**Phase 3 (Months 4-6): Advanced Analytics**
- Cross-child comparison analytics (with consent)
- Seasonal pattern recognition
- Integration with health tracking APIs

### Risk Mitigation

**Technical Risks:**
- Database performance impact: Mitigated by materialized views and partitioning
- Mobile performance: Addressed by progressive loading and intelligent caching
- Data accuracy: Validated by comprehensive testing and monitoring

**Compliance Risks:**
- PIPEDA violations: Prevented by privacy-by-design architecture
- Data residency: Ensured by Canadian-only infrastructure
- Consent management: Handled by granular preference system

This architecture provides a solid foundation for implementing a world-class analytics dashboard that meets wireframe requirements while maintaining the highest standards of performance, privacy, and scalability.

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"content": "Design comprehensive data pipeline architecture for Analytics Dashboard", "activeForm": "Designing comprehensive data pipeline architecture for Analytics Dashboard", "status": "completed"}, {"content": "Create GraphQL schema extensions for wireframe requirements", "activeForm": "Creating GraphQL schema extensions for wireframe requirements", "status": "completed"}, {"content": "Design database schema changes and new analytics tables", "activeForm": "Designing database schema changes and new analytics tables", "status": "completed"}, {"content": "Define data aggregation logic and processing strategy", "activeForm": "Defining data aggregation logic and processing strategy", "status": "completed"}, {"content": "Design caching strategy for mobile performance optimization", "activeForm": "Designing caching strategy for mobile performance optimization", "status": "completed"}, {"content": "Create migration plan for safe implementation", "activeForm": "Creating migration plan for safe implementation", "status": "completed"}, {"content": "Document PIPEDA compliance integration throughout architecture", "activeForm": "Documenting PIPEDA compliance integration throughout architecture", "status": "completed"}]

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"content": "Design comprehensive data pipeline architecture for Analytics Dashboard", "activeForm": "Designing comprehensive data pipeline architecture for Analytics Dashboard", "status": "completed"}, {"content": "Create GraphQL schema extensions for wireframe requirements", "activeForm": "Creating GraphQL schema extensions for wireframe requirements", "status": "completed"}, {"content": "Design database schema changes and new analytics tables", "activeForm": "Designing database schema changes and new analytics tables", "status": "completed"}, {"content": "Define data aggregation logic and processing strategy", "activeForm": "Defining data aggregation logic and processing strategy", "status": "completed"}, {"content": "Design caching strategy for mobile performance optimization", "activeForm": "Designing caching strategy for mobile performance optimization", "status": "completed"}, {"content": "Create migration plan for safe implementation", "activeForm": "Creating migration plan for safe implementation", "status": "in_progress"}, {"content": "Document PIPEDA compliance integration throughout architecture", "activeForm": "Documenting PIPEDA compliance integration throughout architecture", "status": "pending"}]