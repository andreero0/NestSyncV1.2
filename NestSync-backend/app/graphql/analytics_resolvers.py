"""
GraphQL Analytics Resolvers for NestSync
PIPEDA-compliant analytics queries for diaper usage insights
"""

import logging
import uuid
from typing import Optional, List
from datetime import datetime, timezone, date, timedelta
import strawberry
from strawberry.types import Info
from sqlalchemy import select

from app.config.database import get_async_session
from app.graphql.context import require_context_user
from app.services.analytics_service import AnalyticsService
from app.services.analytics_cache import (
    AnalyticsCacheManager,
    performance_monitor,
    QueryOptimizer
)
from app.models.user import User
from app.models.child import Child
from app.utils.data_transformations import (
    TIMEZONE_CANADA,
    DEFAULT_CANADIAN_TIMEZONE,
    get_timezone_for_province
)
import time

from .analytics_types import (
    # Input types
    AnalyticsFilters,
    AnalyticsDateRange,
    AnalyticsPeriodType,
    InsightLevelType,

    # Response types
    UsageAnalyticsResponse,
    WeeklyTrendsResponse,
    DailySummaryResponse,
    UsagePatternsResponse,
    InventoryInsightsResponse,
    AnalyticsDashboardResponse,

    # Core types
    UsageAnalytics,
    WeeklyTrends,
    DailySummary,
    UsagePatterns,
    InventoryInsights,
    AnalyticsDashboard,
    UsageDataPoint,
    TrendDataPoint,
    HourlyUsageDistribution,
    DailyUsageSummary,
    WeeklyTrendPoint,
    UsagePattern,
    InventoryInsight,
    PredictionInsight,
    CostAnalysis,
    ProductCostBreakdown,
    UpcomingPurchase,
    EfficiencyScore,
    HealthInsight,
    UsagePatternType,

    # Enhanced types
    EnhancedAnalyticsDashboard,
    EnhancedAnalyticsDashboardResponse
)

logger = logging.getLogger(__name__)


def convert_usage_data_point(dp) -> UsageDataPoint:
    """Convert service data point to GraphQL type"""
    return UsageDataPoint(
        timestamp=dp.timestamp,
        count=1,  # Each data point represents one usage event
        quantity=dp.quantity,
        hour_of_day=dp.hour_of_day,
        day_of_week=dp.day_of_week,
        was_wet=dp.was_wet,
        was_soiled=dp.was_soiled,
        time_since_last=dp.time_since_last
    )


def convert_hourly_distribution(hour_data: List[dict]) -> List[HourlyUsageDistribution]:
    """Convert hourly distribution data to GraphQL types"""
    return [
        HourlyUsageDistribution(
            hour=data['hour'],
            count=data['count'],
            percentage=data['percentage'],
            is_peak_hour=data['is_peak_hour']
        )
        for data in hour_data
    ]


def convert_daily_summary(daily_stats) -> DailyUsageSummary:
    """Convert daily stats to GraphQL type"""
    return DailyUsageSummary(
        date=daily_stats.date,
        total_changes=daily_stats.total_changes,
        wet_only=daily_stats.wet_only,
        soiled_only=daily_stats.soiled_only,
        wet_and_soiled=daily_stats.wet_and_soiled,
        dry_changes=daily_stats.dry_changes,
        total_quantity=daily_stats.total_quantity,
        average_interval_minutes=daily_stats.average_interval,
        efficiency_score=None,  # Can be enhanced
        cost_estimate=daily_stats.cost_estimate
    )


def convert_usage_pattern(pattern_analysis) -> UsagePattern:
    """Convert pattern analysis to GraphQL type"""
    # Map internal pattern types to GraphQL enum
    pattern_type_mapping = {
        'morning_peak': UsagePatternType.MORNING_PEAK,
        'evening_peak': UsagePatternType.EVENING_PEAK,
        'morning_evening_peak': UsagePatternType.MORNING_PEAK,  # Default to morning
        'consistent': UsagePatternType.CONSISTENT,
        'irregular': UsagePatternType.IRREGULAR,
        'night_heavy': UsagePatternType.NIGHT_HEAVY,
        'day_heavy': UsagePatternType.DAY_HEAVY,
        'insufficient_data': UsagePatternType.IRREGULAR
    }

    pattern_type = pattern_type_mapping.get(pattern_analysis.pattern_type, UsagePatternType.IRREGULAR)

    return UsagePattern(
        pattern_type=pattern_type,
        confidence_score=pattern_analysis.confidence_score,
        description=f"Usage pattern: {pattern_analysis.pattern_type.replace('_', ' ').title()}",
        peak_hours=pattern_analysis.peak_hours,
        low_hours=pattern_analysis.low_hours,
        average_interval_minutes=pattern_analysis.average_interval,
        consistency_score=pattern_analysis.consistency_score
    )


def convert_inventory_insights(insights_data: List[dict]) -> List[InventoryInsight]:
    """Convert inventory insights to GraphQL types"""
    return [
        InventoryInsight(
            product_type=insight['product_type'],
            size=insight['size'],
            brand=insight.get('brand'),
            current_stock=insight['current_stock'],
            daily_consumption_rate=insight['daily_consumption_rate'],
            days_remaining=insight.get('days_remaining'),
            predicted_next_purchase=insight.get('predicted_next_purchase'),
            reorder_recommendation=insight.get('reorder_recommendation'),
            cost_per_day=insight.get('cost_per_day'),
            efficiency_rating=insight.get('efficiency_rating')
        )
        for insight in insights_data
    ]


async def get_user_subscription_level(user_id: uuid.UUID) -> str:
    """Get user subscription level for premium features"""
    # Placeholder - in full implementation, this would check subscription status
    # For now, return 'free' as default
    return "free"


async def get_user_timezone(session, user_id: uuid.UUID) -> str:
    """Get user's timezone for proper date/time handling"""
    try:
        user_query = select(User).where(User.id == user_id)
        result = await session.execute(user_query)
        user = result.scalar_one_or_none()

        if user and user.province:
            return get_timezone_for_province(user.province)
        elif user and user.timezone:
            return user.timezone
        else:
            return DEFAULT_CANADIAN_TIMEZONE

    except Exception as e:
        logger.warning(f"Could not determine user timezone: {e}")
        return DEFAULT_CANADIAN_TIMEZONE


@strawberry.type
class AnalyticsQueries:
    """Analytics system queries"""

    @strawberry.field
    async def get_usage_analytics(
        self,
        info: Info,
        filters: Optional[AnalyticsFilters] = None
    ) -> UsageAnalyticsResponse:
        """Get comprehensive usage analytics for user's children with caching"""
        start_time = time.time()
        try:
            user = await require_context_user(info)
            user_id = user.id

            # Default filters if not provided
            if not filters:
                end_date = date.today()
                start_date = end_date - timedelta(days=30)
                filters = AnalyticsFilters(
                    date_range=AnalyticsDateRange(start_date=start_date, end_date=end_date),
                    period=AnalyticsPeriodType.DAILY
                )

            # Create cache key for this query
            cache = AnalyticsCacheManager.get_cache()
            child_id = uuid.UUID(filters.child_id) if filters.child_id else None
            start_date = filters.date_range.start_date if filters.date_range else date.today() - timedelta(days=30)
            end_date = filters.date_range.end_date if filters.date_range else date.today()

            cache_key = cache.create_cache_key(
                user_id=user_id,
                query_type="usage_analytics",
                child_id=child_id,
                start_date=start_date,
                end_date=end_date,
                filters={
                    "usage_type": filters.usage_type,
                    "period": filters.period.value if filters.period else "daily",
                    "include_predictions": filters.include_predictions
                }
            )

            # Check cache first
            cached_result = cache.get(cache_key)
            if cached_result:
                execution_time = time.time() - start_time
                performance_monitor.record_query_time("usage_analytics", execution_time, was_cached=True)
                logger.info(f"Cache HIT for usage analytics query (user {user_id}) - {execution_time:.3f}s")
                return cached_result

            async for session in get_async_session():
                analytics_service = AnalyticsService()

                # PIPEDA compliance: Check analytics consent and log data access
                has_consent = await analytics_service.check_analytics_consent(session, user_id)
                if not has_consent:
                    return UsageAnalyticsResponse(
                        success=False,
                        error="Analytics consent required. Please grant analytics consent in your privacy settings.",
                        insight_level=InsightLevelType.FREE,
                        data_points_analyzed=0
                    )

                analytics_service.log_data_access(user_id, "usage_analytics", "dashboard_analytics")

                # Get user's timezone for proper date handling
                user_timezone = await get_user_timezone(session, user_id)

                # Extract filter parameters
                child_id = uuid.UUID(filters.child_id) if filters.child_id else None
                start_date = filters.date_range.start_date if filters.date_range else date.today() - timedelta(days=30)
                end_date = filters.date_range.end_date if filters.date_range else date.today()
                period = filters.period or AnalyticsPeriodType.DAILY

                # Get usage data with timezone support
                usage_data = await analytics_service.get_usage_data(
                    session, user_id, child_id, start_date, end_date, filters.usage_type, user_timezone
                )

                if not usage_data:
                    return UsageAnalyticsResponse(
                        success=True,
                        message="No usage data found for the specified period",
                        insight_level=InsightLevelType.FREE,
                        data_points_analyzed=0,
                        analytics=None
                    )

                # Calculate basic statistics
                basic_stats = analytics_service.calculate_basic_stats(usage_data)

                # Calculate weekday vs weekend breakdown
                weekday_weekend_breakdown = analytics_service.calculate_weekday_weekend_breakdown(usage_data)

                # Calculate current streak
                current_streak = analytics_service.calculate_current_streak(usage_data)

                # Calculate patterns and distributions
                pattern_analysis = analytics_service.analyze_usage_patterns(usage_data)
                hourly_distribution = analytics_service.calculate_hourly_distribution(usage_data)
                daily_summaries = analytics_service.calculate_daily_summaries(usage_data)

                # Get user subscription level and apply PIPEDA data minimization
                subscription_level = await get_user_subscription_level(user_id)
                insight_level = InsightLevelType.PREMIUM if subscription_level == "premium" else InsightLevelType.FREE

                # Apply PIPEDA data minimization based on subscription level
                privacy_level = "full" if subscription_level == "premium" else "standard"
                usage_data = analytics_service.anonymize_sensitive_data(usage_data, privacy_level)

                # Get inventory data for cost analysis
                inventory_items = await analytics_service.get_inventory_data(session, user_id, child_id)
                cost_analysis = await analytics_service.calculate_cost_analysis(
                    session, usage_data, inventory_items, period.value
                )

                # Premium insights
                premium_insights = analytics_service.calculate_premium_insights(usage_data, subscription_level)

                # Convert trend data
                trend_data = []
                for i, daily_stat in enumerate(daily_summaries):
                    change_percentage = None
                    if i > 0:
                        prev_changes = daily_summaries[i-1].total_changes
                        if prev_changes > 0:
                            change_percentage = ((daily_stat.total_changes - prev_changes) / prev_changes) * 100

                    trend_data.append(TrendDataPoint(
                        date=daily_stat.date,
                        value=float(daily_stat.total_changes),
                        count=daily_stat.total_changes,
                        label=daily_stat.date.strftime("%Y-%m-%d"),
                        change_percentage=change_percentage
                    ))

                # Build analytics response
                analytics = UsageAnalytics(
                    start_date=start_date,
                    end_date=end_date,
                    child_id=str(child_id) if child_id else None,
                    period=period,
                    insight_level=insight_level,

                    # Core statistics
                    total_changes=basic_stats['total_changes'],
                    total_quantity=basic_stats['total_quantity'],
                    daily_average=basic_stats['daily_average'],

                    # Breakdown by condition
                    wet_only_count=basic_stats['wet_only_count'],
                    soiled_only_count=basic_stats['soiled_only_count'],
                    wet_and_soiled_count=basic_stats['wet_and_soiled_count'],
                    dry_changes_count=basic_stats['dry_changes_count'],

                    # Weekday vs Weekend breakdown
                    weekday_count=weekday_weekend_breakdown['weekday_count'],
                    weekend_count=weekday_weekend_breakdown['weekend_count'],

                    # Streak insights
                    current_streak=current_streak,

                    # Timing insights
                    average_interval_minutes=basic_stats['average_interval_minutes'],
                    shortest_interval_minutes=None,  # Can be enhanced
                    longest_interval_minutes=None,   # Can be enhanced

                    # Pattern analysis
                    usage_pattern=convert_usage_pattern(pattern_analysis),
                    hourly_distribution=convert_hourly_distribution(hourly_distribution),

                    # Trends and summaries
                    daily_summaries=[convert_daily_summary(ds) for ds in daily_summaries],
                    trend_data=trend_data,

                    # Cost analysis
                    cost_analysis=CostAnalysis(
                        period=cost_analysis['period'],
                        total_cost=cost_analysis['total_cost'],
                        cost_per_change=cost_analysis['cost_per_change'],
                        cost_per_day=cost_analysis['cost_per_day'],
                        breakdown_by_product=[
                            ProductCostBreakdown(
                                product_type=item['product_type'],
                                quantity_used=item['quantity_used'],
                                total_cost=item['total_cost'],
                                percentage_of_total=item['percentage_of_total']
                            ) for item in cost_analysis['breakdown_by_product']
                        ],
                        comparison_previous_period=cost_analysis['comparison_previous_period'],
                        budget_recommendation=cost_analysis['budget_recommendation']
                    ),

                    # Premium insights
                    predictions=premium_insights.get('predictions') if insight_level == InsightLevelType.PREMIUM else None,
                    health_insights=premium_insights.get('health_insights') if insight_level == InsightLevelType.PREMIUM else None,
                    advanced_patterns=premium_insights.get('advanced_patterns') if insight_level == InsightLevelType.PREMIUM else None
                )

                logger.info(f"Generated usage analytics for user {user_id} with {len(usage_data)} data points")

                response = UsageAnalyticsResponse(
                    success=True,
                    message="Usage analytics calculated successfully",
                    insight_level=insight_level,
                    data_points_analyzed=len(usage_data),
                    analytics=analytics,
                    cache_hit=False
                )

                # Cache the result (30 minutes for usage analytics)
                cache.set(cache_key, response, ttl_minutes=30)

                execution_time = time.time() - start_time
                performance_monitor.record_query_time("usage_analytics", execution_time, was_cached=False)
                logger.info(f"Generated and cached usage analytics for user {user_id} - {execution_time:.3f}s")

                return response

        except Exception as e:
            logger.error(f"Error getting usage analytics: {e}")
            return UsageAnalyticsResponse(
                success=False,
                error=f"Failed to calculate usage analytics: {str(e)}",
                insight_level=InsightLevelType.FREE,
                data_points_analyzed=0
            )

    @strawberry.field
    async def get_weekly_trends(
        self,
        info: Info,
        child_id: Optional[str] = None,
        weeks_back: int = 8
    ) -> WeeklyTrendsResponse:
        """Get weekly usage trends analysis"""
        try:
            user = await require_context_user(info)
            user_id = user.id

            async for session in get_async_session():
                analytics_service = AnalyticsService()

                # Calculate date range
                end_date = date.today()
                start_date = end_date - timedelta(weeks=weeks_back)

                child_uuid = uuid.UUID(child_id) if child_id else None

                # Get usage data
                usage_data = await analytics_service.get_usage_data(
                    session, user_id, child_uuid, start_date, end_date
                )

                if not usage_data:
                    return WeeklyTrendsResponse(
                        success=True,
                        message="No usage data found for weekly trends",
                        insight_level=InsightLevelType.FREE,
                        data_points_analyzed=0,
                        trends=None
                    )

                # Calculate weekly trends
                weekly_data = analytics_service.calculate_weekly_trends(usage_data)

                # Convert weekly data points
                weekly_trend_points = []
                for week_data in weekly_data['weekly_data']:
                    pattern_type = getattr(UsagePatternType, week_data['pattern_type'].upper(), UsagePatternType.IRREGULAR)

                    trend_point = WeeklyTrendPoint(
                        week_start=week_data['week_start'],
                        week_end=week_data['week_end'],
                        total_changes=week_data['total_changes'],
                        daily_average=week_data['daily_average'],
                        change_from_previous=week_data.get('change_from_previous'),
                        pattern_type=pattern_type
                    )
                    weekly_trend_points.append(trend_point)

                # Find peak and low weeks
                peak_week = max(weekly_trend_points, key=lambda w: w.total_changes) if weekly_trend_points else None
                low_week = min(weekly_trend_points, key=lambda w: w.total_changes) if weekly_trend_points else None

                trends = WeeklyTrends(
                    child_id=child_id,
                    weeks_analyzed=weekly_data['weeks_analyzed'],
                    current_week_changes=weekly_data['current_week_changes'],
                    previous_week_changes=weekly_data['previous_week_changes'],
                    change_percentage=weekly_data['change_percentage'],
                    weekly_data=weekly_trend_points,
                    trend_direction=weekly_data['trend_direction'],
                    seasonality_detected=False,  # Can be enhanced
                    pattern_consistency=75.0,    # Can be enhanced
                    peak_week=peak_week,
                    low_week=low_week,
                    average_weekly_changes=weekly_data['average_weekly_changes']
                )

                logger.info(f"Generated weekly trends for user {user_id} analyzing {weekly_data['weeks_analyzed']} weeks")

                return WeeklyTrendsResponse(
                    success=True,
                    message="Weekly trends calculated successfully",
                    insight_level=InsightLevelType.FREE,
                    data_points_analyzed=len(usage_data),
                    trends=trends
                )

        except Exception as e:
            logger.error(f"Error getting weekly trends: {e}")
            return WeeklyTrendsResponse(
                success=False,
                error=f"Failed to calculate weekly trends: {str(e)}",
                insight_level=InsightLevelType.FREE,
                data_points_analyzed=0
            )

    @strawberry.field
    async def get_daily_summary(
        self,
        info: Info,
        target_date: date,
        child_id: Optional[str] = None
    ) -> DailySummaryResponse:
        """Get detailed daily usage summary"""
        try:
            user = await require_context_user(info)
            user_id = user.id

            async for session in get_async_session():
                analytics_service = AnalyticsService()
                child_uuid = uuid.UUID(child_id) if child_id else None

                # Get usage data for the specific day
                usage_data = await analytics_service.get_usage_data(
                    session, user_id, child_uuid, target_date, target_date
                )

                if not usage_data:
                    return DailySummaryResponse(
                        success=True,
                        message=f"No usage data found for {target_date}",
                        insight_level=InsightLevelType.FREE,
                        data_points_analyzed=0,
                        summary=None
                    )

                # Calculate daily statistics
                daily_summaries = analytics_service.calculate_daily_summaries(usage_data)
                daily_summary = daily_summaries[0] if daily_summaries else None

                if not daily_summary:
                    return DailySummaryResponse(
                        success=True,
                        message=f"Unable to calculate summary for {target_date}",
                        insight_level=InsightLevelType.FREE,
                        data_points_analyzed=len(usage_data),
                        summary=None
                    )

                # Calculate hourly distribution
                hourly_distribution = analytics_service.calculate_hourly_distribution(usage_data)

                # Convert usage timeline
                usage_timeline = [convert_usage_data_point(dp) for dp in usage_data]

                # Generate insights and recommendations
                notable_patterns = []
                recommendations = []

                # Basic pattern detection
                if daily_summary.total_changes > 10:
                    notable_patterns.append("High frequency day - more changes than usual")
                elif daily_summary.total_changes < 3:
                    notable_patterns.append("Low frequency day - fewer changes than usual")

                if daily_summary.wet_and_soiled > daily_summary.wet_only + daily_summary.soiled_only:
                    notable_patterns.append("Many combined wet and soiled diapers")

                # Generate recommendations
                if daily_summary.average_interval and daily_summary.average_interval < 120:  # Less than 2 hours
                    recommendations.append("Consider checking diaper fit if changes are very frequent")

                recommendations.append("Monitor hydration and feeding patterns")

                summary = DailySummary(
                    date=target_date,
                    child_id=child_id,
                    summary=convert_daily_summary(daily_summary),
                    hourly_breakdown=convert_hourly_distribution(hourly_distribution),
                    usage_timeline=usage_timeline,
                    notable_patterns=notable_patterns,
                    efficiency_notes=None,  # Can be enhanced
                    recommendations=recommendations
                )

                logger.info(f"Generated daily summary for user {user_id} on {target_date}")

                return DailySummaryResponse(
                    success=True,
                    message="Daily summary calculated successfully",
                    insight_level=InsightLevelType.FREE,
                    data_points_analyzed=len(usage_data),
                    summary=summary
                )

        except Exception as e:
            logger.error(f"Error getting daily summary: {e}")
            return DailySummaryResponse(
                success=False,
                error=f"Failed to calculate daily summary: {str(e)}",
                insight_level=InsightLevelType.FREE,
                data_points_analyzed=0
            )

    @strawberry.field
    async def get_usage_patterns(
        self,
        info: Info,
        child_id: Optional[str] = None,
        analysis_days: int = 30
    ) -> UsagePatternsResponse:
        """Get comprehensive usage pattern analysis"""
        try:
            user = await require_context_user(info)
            user_id = user.id

            async for session in get_async_session():
                analytics_service = AnalyticsService()
                child_uuid = uuid.UUID(child_id) if child_id else None

                # Calculate date range
                end_date = date.today()
                start_date = end_date - timedelta(days=analysis_days)

                # Get usage data
                usage_data = await analytics_service.get_usage_data(
                    session, user_id, child_uuid, start_date, end_date
                )

                if not usage_data:
                    return UsagePatternsResponse(
                        success=True,
                        message="No usage data found for pattern analysis",
                        insight_level=InsightLevelType.FREE,
                        data_points_analyzed=0,
                        patterns=None
                    )

                # Analyze patterns
                pattern_analysis = analytics_service.analyze_usage_patterns(usage_data)
                hourly_distribution = analytics_service.calculate_hourly_distribution(usage_data)

                # Extract peak hours and days
                peak_hours = pattern_analysis.peak_hours
                quiet_hours = pattern_analysis.low_hours

                # Analyze day-of-week patterns
                from collections import Counter
                day_counts = Counter(dp.day_of_week for dp in usage_data)
                peak_days = [day for day, count in day_counts.most_common(3)]

                # Generate recommendations
                routine_recommendations = [
                    "Maintain consistent change times during peak hours",
                    "Consider preventive changes before busy periods"
                ]

                optimization_suggestions = [
                    "Stock more supplies during peak usage times",
                    "Plan outings around quieter periods when possible"
                ]

                if pattern_analysis.consistency_score < 50:
                    optimization_suggestions.append("Consider establishing a more regular routine")

                patterns = UsagePatterns(
                    child_id=child_id,
                    analysis_period_days=analysis_days,
                    primary_pattern=convert_usage_pattern(pattern_analysis),
                    secondary_patterns=[],  # Can be enhanced with more sophisticated analysis
                    peak_hours=peak_hours,
                    peak_days_of_week=peak_days,
                    quiet_hours=quiet_hours,
                    routine_consistency_score=pattern_analysis.consistency_score,
                    interval_consistency_score=pattern_analysis.consistency_score,  # Simplified
                    pattern_deviations=[],  # Can be enhanced
                    unusual_days=[],        # Can be enhanced
                    routine_recommendations=routine_recommendations,
                    optimization_suggestions=optimization_suggestions
                )

                logger.info(f"Generated usage patterns for user {user_id} analyzing {analysis_days} days")

                return UsagePatternsResponse(
                    success=True,
                    message="Usage patterns analyzed successfully",
                    insight_level=InsightLevelType.FREE,
                    data_points_analyzed=len(usage_data),
                    patterns=patterns
                )

        except Exception as e:
            logger.error(f"Error getting usage patterns: {e}")
            return UsagePatternsResponse(
                success=False,
                error=f"Failed to analyze usage patterns: {str(e)}",
                insight_level=InsightLevelType.FREE,
                data_points_analyzed=0
            )

    @strawberry.field
    async def get_inventory_insights(
        self,
        info: Info,
        child_id: Optional[str] = None,
        include_predictions: bool = False
    ) -> InventoryInsightsResponse:
        """Get comprehensive inventory insights and predictions"""
        try:
            user = await require_context_user(info)
            user_id = user.id

            async for session in get_async_session():
                analytics_service = AnalyticsService()
                child_uuid = uuid.UUID(child_id) if child_id else None

                # Get inventory and usage data
                inventory_items = await analytics_service.get_inventory_data(session, user_id, child_uuid)

                if not inventory_items:
                    return InventoryInsightsResponse(
                        success=True,
                        message="No inventory items found",
                        insight_level=InsightLevelType.FREE,
                        data_points_analyzed=0,
                        insights=None
                    )

                # Get recent usage data for consumption analysis
                end_date = date.today()
                start_date = end_date - timedelta(days=30)
                usage_data = await analytics_service.get_usage_data(
                    session, user_id, child_uuid, start_date, end_date
                )

                # Calculate inventory insights
                insights_data = await analytics_service.calculate_inventory_insights(
                    session, inventory_items, usage_data
                )

                # Get user subscription level
                subscription_level = await get_user_subscription_level(user_id)
                insight_level = InsightLevelType.PREMIUM if subscription_level == "premium" else InsightLevelType.FREE

                # Generate reorder alerts
                reorder_alerts = []
                upcoming_purchases = []
                cost_optimization_tips = [
                    "Consider bulk purchases for frequently used items",
                    "Compare prices across different brands",
                    "Monitor sales and promotions for your preferred brands"
                ]

                for insight in insights_data:
                    if insight.get('days_remaining', 0) and insight['days_remaining'] <= 7:
                        reorder_alerts.append(f"Low stock: {insight['brand']} {insight['size']} - {insight['days_remaining']:.1f} days remaining")

                    if insight.get('predicted_next_purchase'):
                        upcoming_purchases.append(UpcomingPurchase(
                            product=f"{insight['brand']} {insight['size']}",
                            predicted_date=insight['predicted_next_purchase'].isoformat(),
                            confidence=75.0
                        ))

                # Calculate efficiency scores
                efficiency_scores = []
                for insight in insights_data:
                    key = f"{insight['product_type']}_{insight['size']}"
                    if insight.get('efficiency_rating'):
                        rating_scores = {'excellent': 95, 'good': 80, 'fair': 65, 'poor': 40}
                        score = rating_scores.get(insight['efficiency_rating'], 50)
                        efficiency_scores.append(EfficiencyScore(product_key=key, score=score))

                # Create trend data (simplified)
                consumption_trends = [
                    TrendDataPoint(
                        date=date.today() - timedelta(days=i),
                        value=float(len([dp for dp in usage_data if dp.timestamp.date() == date.today() - timedelta(days=i)])),
                        count=len([dp for dp in usage_data if dp.timestamp.date() == date.today() - timedelta(days=i)]),
                        label=f"Day {i}",
                        change_percentage=None
                    )
                    for i in range(7)
                ]

                # Premium insights
                ml_predictions = None
                seasonal_adjustments = None
                bulk_purchase_recommendations = None

                if insight_level == InsightLevelType.PREMIUM and include_predictions:
                    ml_predictions = [
                        PredictionInsight(
                            prediction_type="consumption_forecast",
                            confidence_level=80.0,
                            predicted_value=25.0,  # Predicted weekly consumption
                            predicted_date=date.today() + timedelta(days=7),
                            factors=["Historical usage", "Growth patterns", "Seasonal trends"],
                            recommendation="Stock up before predicted high-consumption period",
                            model_accuracy=85.0
                        )
                    ]

                    seasonal_adjustments = [
                        "Summer: Increase stock by 15% due to more outdoor activities",
                        "Winter: Standard consumption expected"
                    ]

                    bulk_purchase_recommendations = [
                        "Consider purchasing 2-month supply of current size",
                        "Monitor growth indicators for size transition timing"
                    ]

                insights = InventoryInsights(
                    child_id=child_id,
                    insight_level=insight_level,
                    current_items=convert_inventory_insights(insights_data),
                    consumption_trends=consumption_trends,
                    efficiency_scores=efficiency_scores,
                    reorder_alerts=reorder_alerts,
                    upcoming_purchases=upcoming_purchases,
                    cost_optimization_tips=cost_optimization_tips,
                    ml_predictions=ml_predictions,
                    seasonal_adjustments=seasonal_adjustments,
                    bulk_purchase_recommendations=bulk_purchase_recommendations
                )

                logger.info(f"Generated inventory insights for user {user_id} with {len(inventory_items)} items")

                return InventoryInsightsResponse(
                    success=True,
                    message="Inventory insights calculated successfully",
                    insight_level=insight_level,
                    data_points_analyzed=len(usage_data) + len(inventory_items),
                    insights=insights
                )

        except Exception as e:
            logger.error(f"Error getting inventory insights: {e}")
            return InventoryInsightsResponse(
                success=False,
                error=f"Failed to calculate inventory insights: {str(e)}",
                insight_level=InsightLevelType.FREE,
                data_points_analyzed=0
            )

    @strawberry.field
    async def get_analytics_dashboard(
        self,
        info: Info,
        child_id: Optional[str] = None
    ) -> AnalyticsDashboardResponse:
        """Get complete analytics dashboard data"""
        try:
            user = await require_context_user(info)
            user_id = user.id

            async for session in get_async_session():
                analytics_service = AnalyticsService()
                child_uuid = uuid.UUID(child_id) if child_id else None

                # Get subscription level
                subscription_level = await get_user_subscription_level(user_id)
                insight_level = InsightLevelType.PREMIUM if subscription_level == "premium" else InsightLevelType.FREE

                # Get quick stats for today, this week, this month
                today = date.today()
                week_start = today - timedelta(days=today.weekday())
                month_start = today.replace(day=1)

                # Today's data - get user's timezone for consistency
                user_timezone = await get_user_timezone(session, user_id)
                today_usage = await analytics_service.get_usage_data(
                    session, user_id, child_uuid, today, today,
                    usage_type="diaper_change", user_timezone=user_timezone
                )
                today_changes = len(today_usage)

                logger.info(f"Analytics dashboard timezone calculation for user {user_id}, child {child_id}: timezone={user_timezone}, today_changes={today_changes}")

                # This week's data
                week_usage = await analytics_service.get_usage_data(session, user_id, child_uuid, week_start, today)
                week_changes = len(week_usage)

                # This month's data
                month_usage = await analytics_service.get_usage_data(session, user_id, child_uuid, month_start, today)
                month_changes = len(month_usage)

                # Get recent analytics (last 30 days)
                start_date = today - timedelta(days=30)
                usage_data = await analytics_service.get_usage_data(session, user_id, child_uuid, start_date, today)

                # Calculate recent usage analytics
                if usage_data:
                    basic_stats = analytics_service.calculate_basic_stats(usage_data)
                    pattern_analysis = analytics_service.analyze_usage_patterns(usage_data)
                    hourly_distribution = analytics_service.calculate_hourly_distribution(usage_data)
                    daily_summaries = analytics_service.calculate_daily_summaries(usage_data)

                    recent_usage = UsageAnalytics(
                        start_date=start_date,
                        end_date=today,
                        child_id=child_id,
                        period=AnalyticsPeriodType.DAILY,
                        insight_level=insight_level,
                        total_changes=basic_stats['total_changes'],
                        total_quantity=basic_stats['total_quantity'],
                        daily_average=basic_stats['daily_average'],
                        wet_only_count=basic_stats['wet_only_count'],
                        soiled_only_count=basic_stats['soiled_only_count'],
                        wet_and_soiled_count=basic_stats['wet_and_soiled_count'],
                        dry_changes_count=basic_stats['dry_changes_count'],
                        average_interval_minutes=basic_stats['average_interval_minutes'],
                        usage_pattern=convert_usage_pattern(pattern_analysis),
                        hourly_distribution=convert_hourly_distribution(hourly_distribution),
                        daily_summaries=[convert_daily_summary(ds) for ds in daily_summaries],
                        trend_data=[]  # Simplified for dashboard
                    )
                else:
                    recent_usage = None

                # Get weekly trends
                weekly_data = analytics_service.calculate_weekly_trends(usage_data) if usage_data else None
                weekly_trends = None
                if weekly_data:
                    weekly_trends = WeeklyTrends(
                        child_id=child_id,
                        weeks_analyzed=weekly_data['weeks_analyzed'],
                        current_week_changes=weekly_data['current_week_changes'],
                        previous_week_changes=weekly_data['previous_week_changes'],
                        change_percentage=weekly_data['change_percentage'],
                        weekly_data=[],  # Simplified for dashboard
                        trend_direction=weekly_data['trend_direction'],
                        seasonality_detected=False,
                        pattern_consistency=75.0,
                        average_weekly_changes=weekly_data['average_weekly_changes']
                    )

                # Get inventory insights
                inventory_items = await analytics_service.get_inventory_data(session, user_id, child_uuid)
                insights_data = await analytics_service.calculate_inventory_insights(session, inventory_items, usage_data) if inventory_items and usage_data else []

                inventory_status = InventoryInsights(
                    child_id=child_id,
                    insight_level=insight_level,
                    current_items=convert_inventory_insights(insights_data),
                    consumption_trends=[],  # Simplified for dashboard
                    efficiency_scores={},
                    reorder_alerts=[],
                    upcoming_purchases=[],
                    cost_optimization_tips=[]
                )

                # Generate key insights and recommendations
                top_insights = []
                recommendations = []
                alerts = []

                if recent_usage:
                    if recent_usage.daily_average > 8:
                        top_insights.append("Higher than average daily changes detected")
                    elif recent_usage.daily_average < 4:
                        top_insights.append("Lower than average daily changes detected")

                    recommendations.append("Monitor growth patterns for size adjustments")
                    recommendations.append("Keep emergency supplies when traveling")

                for insight in insights_data:
                    if insight.get('days_remaining', 0) and insight['days_remaining'] <= 3:
                        alerts.append(f"URGENT: {insight['brand']} {insight['size']} needs immediate reorder")

                # Premium features
                predictions = None
                health_insights = None

                if insight_level == InsightLevelType.PREMIUM:
                    predictions = [
                        PredictionInsight(
                            prediction_type="growth_milestone",
                            confidence_level=75.0,
                            predicted_value=1.0,
                            predicted_date=today + timedelta(days=30),
                            factors=["Current growth rate", "Usage patterns"],
                            recommendation="Consider next size up in 30 days",
                            model_accuracy=80.0
                        )
                    ]

                    health_insights = [
                        HealthInsight(
                            insight_type="routine_analysis",
                            description="Healthy routine detected with consistent patterns",
                            recommendation="Maintain current schedule",
                            urgency_level="low",
                            pattern_detected=True,
                            confidence_score=85.0
                        )
                    ]

                dashboard = AnalyticsDashboard(
                    child_id=child_id,
                    last_updated=datetime.now(timezone.utc),
                    insight_level=insight_level,
                    today_changes=today_changes,
                    week_changes=week_changes,
                    month_changes=month_changes,
                    recent_usage=recent_usage,
                    weekly_trends=weekly_trends,
                    inventory_status=inventory_status,
                    top_insights=top_insights,
                    recommendations=recommendations,
                    alerts=alerts,
                    predictions=predictions,
                    health_insights=health_insights
                )

                logger.info(f"Generated analytics dashboard for user {user_id}")

                return AnalyticsDashboardResponse(
                    success=True,
                    message="Analytics dashboard generated successfully",
                    insight_level=insight_level,
                    data_points_analyzed=len(usage_data) if usage_data else 0,
                    dashboard=dashboard
                )

        except Exception as e:
            logger.error(f"Error getting analytics dashboard: {e}")
            return AnalyticsDashboardResponse(
                success=False,
                error=f"Failed to generate analytics dashboard: {str(e)}",
                insight_level=InsightLevelType.FREE,
                data_points_analyzed=0
            )

    @strawberry.field
    async def get_enhanced_analytics_dashboard(
        self,
        info: Info,
        child_id: str,
        date_range: Optional[int] = 30
    ) -> EnhancedAnalyticsDashboardResponse:
        """Get wireframe-compliant enhanced analytics dashboard"""
        try:
            user = await require_context_user(info)
            user_id = str(user.id)

            # Validate child access
            async for session in get_async_session():
                child_query = select(Child).where(
                    and_(Child.id == child_id, Child.parent_id == user.id)
                )
                child_result = await session.execute(child_query)
                child = child_result.scalar_one_or_none()

                if not child:
                    return EnhancedAnalyticsDashboardResponse(
                        success=False,
                        message="Child not found or access denied",
                        dashboard=None,
                        cache_hit=False
                    )

            # Use enhanced analytics service
            from app.services.enhanced_analytics_service import EnhancedAnalyticsService
            enhanced_service = EnhancedAnalyticsService()
            dashboard = await enhanced_service.get_enhanced_analytics_dashboard(
                child_id=child_id,
                date_range=date_range,
                user_id=user_id
            )

            return EnhancedAnalyticsDashboardResponse(
                success=True,
                message="Enhanced analytics dashboard generated successfully",
                dashboard=dashboard,
                cache_hit=False
            )

        except Exception as e:
            logger.error(f"Error getting enhanced analytics dashboard: {e}")
            return EnhancedAnalyticsDashboardResponse(
                success=False,
                message=f"Failed to generate enhanced analytics dashboard: {str(e)}",
                dashboard=None,
                cache_hit=False
            )


# =============================================================================
# Export Queries
# =============================================================================

__all__ = ["AnalyticsQueries"]