"""
GraphQL Analytics Types for NestSync
Comprehensive analytics types for diaper usage tracking and insights
"""

import strawberry
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from enum import Enum


# =============================================================================
# Analytics Enums
# =============================================================================

@strawberry.enum
class AnalyticsPeriodType(Enum):
    """Time period for analytics aggregation"""
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"


@strawberry.enum
class AnalyticsMetricType(Enum):
    """Types of analytics metrics"""
    USAGE_COUNT = "usage_count"
    QUANTITY_CONSUMED = "quantity_consumed"
    AVERAGE_INTERVAL = "average_interval"
    PEAK_HOURS = "peak_hours"
    EFFICIENCY_SCORE = "efficiency_score"
    COST_PER_DAY = "cost_per_day"
    PREDICTED_CONSUMPTION = "predicted_consumption"


@strawberry.enum
class UsagePatternType(Enum):
    """Types of usage patterns"""
    MORNING_PEAK = "morning_peak"
    EVENING_PEAK = "evening_peak"
    CONSISTENT = "consistent"
    IRREGULAR = "irregular"
    NIGHT_HEAVY = "night_heavy"
    DAY_HEAVY = "day_heavy"


@strawberry.enum
class InsightLevelType(Enum):
    """Level of analytics insights available"""
    FREE = "free"
    PREMIUM = "premium"


# =============================================================================
# Core Analytics Types
# =============================================================================

@strawberry.type
class UsageDataPoint:
    """Single data point for usage analytics"""
    timestamp: datetime
    count: int
    quantity: int
    hour_of_day: int
    day_of_week: int
    was_wet: Optional[bool] = None
    was_soiled: Optional[bool] = None
    time_since_last: Optional[int] = None  # minutes


@strawberry.type
class TrendDataPoint:
    """Data point for trend analysis"""
    date: date
    value: float
    count: int
    label: str
    change_percentage: Optional[float] = None


@strawberry.type
class HourlyUsageDistribution:
    """Usage distribution by hour of day"""
    hour: int
    count: int
    percentage: float
    is_peak_hour: bool


@strawberry.type
class DailyUsageSummary:
    """Daily usage summary statistics"""
    date: date
    total_changes: int
    wet_only: int
    soiled_only: int
    wet_and_soiled: int
    dry_changes: int
    total_quantity: int
    average_interval_minutes: Optional[float] = None
    efficiency_score: Optional[float] = None  # 0-100
    cost_estimate: Optional[float] = None  # CAD


@strawberry.type
class WeeklyTrendPoint:
    """Weekly trend data point"""
    week_start: date
    week_end: date
    total_changes: int
    daily_average: float
    change_from_previous: Optional[float] = None  # percentage
    pattern_type: UsagePatternType


@strawberry.type
class UsagePattern:
    """Usage pattern analysis"""
    pattern_type: UsagePatternType
    confidence_score: float  # 0-100
    description: str
    peak_hours: List[int]
    low_hours: List[int]
    average_interval_minutes: float
    consistency_score: float  # 0-100


@strawberry.type
class InventoryInsight:
    """Inventory consumption insights and predictions"""
    product_type: str
    size: str
    brand: Optional[str] = None
    current_stock: int
    daily_consumption_rate: float
    days_remaining: Optional[float] = None
    predicted_next_purchase: Optional[date] = None
    reorder_recommendation: Optional[str] = None
    cost_per_day: Optional[float] = None  # CAD
    efficiency_rating: Optional[str] = None  # excellent, good, fair, poor


@strawberry.type
class PredictionInsight:
    """ML-powered prediction insights (Premium feature)"""
    prediction_type: str
    confidence_level: float  # 0-100
    predicted_value: float
    predicted_date: Optional[date] = None
    factors: List[str]
    recommendation: str
    model_accuracy: Optional[float] = None


@strawberry.type
class ProductCostBreakdown:
    """Cost breakdown by product type"""
    product_type: str
    quantity_used: int
    total_cost: float
    percentage_of_total: float


@strawberry.type
class CostAnalysis:
    """Cost analysis and breakdown"""
    period: str
    total_cost: float  # CAD
    cost_per_change: float  # CAD
    cost_per_day: float  # CAD
    breakdown_by_product: List[ProductCostBreakdown]
    comparison_previous_period: Optional[float] = None  # percentage change
    budget_recommendation: Optional[str] = None


@strawberry.type
class HealthInsight:
    """Health-related insights from usage patterns"""
    insight_type: str
    description: str
    recommendation: Optional[str] = None
    urgency_level: str  # low, medium, high
    pattern_detected: bool
    confidence_score: float  # 0-100


# =============================================================================
# Main Analytics Response Types
# =============================================================================

@strawberry.type
class UsageAnalytics:
    """Main usage analytics response"""
    # Time period and filters
    start_date: date
    end_date: date
    child_id: Optional[str] = None
    period: AnalyticsPeriodType
    insight_level: InsightLevelType

    # Core statistics
    total_changes: int
    total_quantity: int
    daily_average: float

    # Breakdown by condition
    wet_only_count: int
    soiled_only_count: int
    wet_and_soiled_count: int
    dry_changes_count: int

    # Weekday vs Weekend breakdown
    weekday_count: int
    weekend_count: int

    # Streak insights
    current_streak: int

    # Timing insights
    average_interval_minutes: float
    shortest_interval_minutes: Optional[int] = None
    longest_interval_minutes: Optional[int] = None

    # Pattern analysis
    usage_pattern: UsagePattern
    hourly_distribution: List[HourlyUsageDistribution]

    # Trends
    daily_summaries: List[DailyUsageSummary]
    trend_data: List[TrendDataPoint]

    # Cost analysis
    cost_analysis: Optional[CostAnalysis] = None

    # Premium insights (only for premium users)
    predictions: Optional[List[PredictionInsight]] = None
    health_insights: Optional[List[HealthInsight]] = None
    advanced_patterns: Optional[List[str]] = None


@strawberry.type
class WeeklyTrends:
    """Weekly usage trends analysis"""
    child_id: Optional[str] = None
    weeks_analyzed: int
    current_week_changes: int
    previous_week_changes: int
    change_percentage: float

    # Weekly breakdown
    weekly_data: List[WeeklyTrendPoint]

    # Pattern identification
    trend_direction: str  # increasing, decreasing, stable
    seasonality_detected: bool
    pattern_consistency: float  # 0-100

    # Insights
    peak_week: Optional[WeeklyTrendPoint] = None
    low_week: Optional[WeeklyTrendPoint] = None
    average_weekly_changes: float


@strawberry.type
class DailySummary:
    """Detailed daily usage summary"""
    date: date
    child_id: Optional[str] = None

    # Core stats
    summary: DailyUsageSummary
    hourly_breakdown: List[HourlyUsageDistribution]

    # Individual changes
    usage_timeline: List[UsageDataPoint]

    # Insights for the day
    notable_patterns: List[str]
    efficiency_notes: Optional[str] = None
    recommendations: List[str]


@strawberry.type
class UsagePatterns:
    """Comprehensive usage pattern analysis"""
    child_id: Optional[str] = None
    analysis_period_days: int

    # Primary pattern
    primary_pattern: UsagePattern
    secondary_patterns: List[UsagePattern]

    # Peak time analysis
    peak_hours: List[int]
    peak_days_of_week: List[int]
    quiet_hours: List[int]

    # Consistency metrics
    routine_consistency_score: float  # 0-100
    interval_consistency_score: float  # 0-100

    # Deviation detection
    pattern_deviations: List[str]
    unusual_days: List[date]

    # Recommendations
    routine_recommendations: List[str]
    optimization_suggestions: List[str]


@strawberry.type
class UpcomingPurchase:
    """Upcoming purchase prediction"""
    product: str
    predicted_date: str
    confidence: float


@strawberry.type
class EfficiencyScore:
    """Efficiency score for a product"""
    product_key: str
    score: float


@strawberry.type
class InventoryInsights:
    """Comprehensive inventory insights and predictions"""
    child_id: Optional[str] = None
    insight_level: InsightLevelType

    # Current inventory status
    current_items: List[InventoryInsight]

    # Consumption analysis
    consumption_trends: List[TrendDataPoint]
    efficiency_scores: List[EfficiencyScore]

    # Predictions and recommendations
    reorder_alerts: List[str]
    upcoming_purchases: List[UpcomingPurchase]
    cost_optimization_tips: List[str]

    # Premium insights
    ml_predictions: Optional[List[PredictionInsight]] = None
    seasonal_adjustments: Optional[List[str]] = None
    bulk_purchase_recommendations: Optional[List[str]] = None


# =============================================================================
# Input Types for Analytics Queries
# =============================================================================

@strawberry.input
class AnalyticsDateRange:
    """Date range for analytics queries"""
    start_date: date
    end_date: date


@strawberry.input
class AnalyticsFilters:
    """Filters for analytics queries"""
    child_id: Optional[str] = None
    product_type: Optional[str] = None
    size: Optional[str] = None
    brand: Optional[str] = None
    usage_type: Optional[str] = None
    date_range: Optional[AnalyticsDateRange] = None
    period: Optional[AnalyticsPeriodType] = None
    include_predictions: bool = False


# =============================================================================
# Analytics Query Response Types
# =============================================================================

@strawberry.type
class AnalyticsResponse:
    """Base analytics response with success/error handling"""
    success: bool
    message: Optional[str] = None
    error: Optional[str] = None
    insight_level: InsightLevelType
    data_points_analyzed: int
    cache_hit: bool = False


@strawberry.type
class UsageAnalyticsResponse(AnalyticsResponse):
    """Usage analytics query response"""
    analytics: Optional[UsageAnalytics] = None


@strawberry.type
class WeeklyTrendsResponse(AnalyticsResponse):
    """Weekly trends query response"""
    trends: Optional[WeeklyTrends] = None


@strawberry.type
class DailySummaryResponse(AnalyticsResponse):
    """Daily summary query response"""
    summary: Optional[DailySummary] = None


@strawberry.type
class UsagePatternsResponse(AnalyticsResponse):
    """Usage patterns query response"""
    patterns: Optional[UsagePatterns] = None


@strawberry.type
class InventoryInsightsResponse(AnalyticsResponse):
    """Inventory insights query response"""
    insights: Optional[InventoryInsights] = None


# =============================================================================
# Analytics Dashboard Types
# =============================================================================

@strawberry.type
class AnalyticsDashboard:
    """Complete analytics dashboard data"""
    child_id: Optional[str] = None
    last_updated: datetime
    insight_level: InsightLevelType

    # Quick stats
    today_changes: int
    week_changes: int
    month_changes: int

    # Recent trends
    recent_usage: UsageAnalytics
    weekly_trends: WeeklyTrends
    inventory_status: InventoryInsights

    # Key insights
    top_insights: List[str]
    recommendations: List[str]
    alerts: List[str]

    # Premium features
    predictions: Optional[List[PredictionInsight]] = None
    health_insights: Optional[List[HealthInsight]] = None


@strawberry.type
class AnalyticsDashboardResponse(AnalyticsResponse):
    """Analytics dashboard query response"""
    dashboard: Optional[AnalyticsDashboard] = None


# =============================================================================
# Enhanced Analytics Types for Wireframe Compliance
# =============================================================================

@strawberry.type
class WeeklyPatternData:
    """Weekly diaper change pattern analysis for wireframe compliance"""
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
class AnalyticsOverviewSummary:
    """Enhanced overview summary with additional metrics"""
    today_changes: int = strawberry.field(description="Changes logged today")
    current_streak: int = strawberry.field(description="Current daily logging streak")
    week_changes: int = strawberry.field(description="Changes this week")
    month_changes: int = strawberry.field(description="Changes this month")
    weekly_average: float = strawberry.field(description="Average changes per day this week")


@strawberry.type
class AnalyticsRawData:
    """Raw analytics data for detailed analysis"""
    total_data_points: int = strawberry.field(description="Total data points available")
    data_quality_score: float = strawberry.field(description="Data quality score (0-100)")
    oldest_data_point: datetime = strawberry.field(description="Oldest data point timestamp")
    newest_data_point: datetime = strawberry.field(description="Newest data point timestamp")
    average_efficiency: float = strawberry.field(description="Average diaper efficiency rating")


@strawberry.type
class AnalyticsOverview:
    """Enhanced analytics overview section"""
    summary: AnalyticsOverviewSummary = strawberry.field(description="Key metrics summary")
    raw: AnalyticsRawData = strawberry.field(description="Raw data metrics")


@strawberry.type
class AnalyticsUsageEnhanced:
    """Enhanced usage analytics with additional insights"""
    peak_hour: int = strawberry.field(description="Most active hour of day")
    peak_day: str = strawberry.field(description="Most active day of week")
    average_gap_hours: float = strawberry.field(description="Average time between changes in hours")
    pattern_type: str = strawberry.field(description="Detected usage pattern")
    weekend_pattern: bool = strawberry.field(description="Different weekend pattern detected")


@strawberry.type
class AnalyticsTrendsEnhanced:
    """Enhanced trends analytics"""
    weekly_trend: str = strawberry.field(description="Weekly trend direction")
    monthly_trend: str = strawberry.field(description="Monthly trend direction")
    seasonal_pattern: bool = strawberry.field(description="Seasonal pattern detected")
    growth_indicator: str = strawberry.field(description="Growth-related change indicator")


@strawberry.type
class EnhancedAnalyticsDashboard:
    """Extended analytics dashboard with wireframe compliance"""
    # Existing fields (maintained for backward compatibility)
    overview: AnalyticsOverview = strawberry.field(description="Overview section data")
    usage: AnalyticsUsageEnhanced = strawberry.field(description="Usage patterns section")
    trends: AnalyticsTrendsEnhanced = strawberry.field(description="Trends analysis section")

    # New wireframe-compliant fields
    weekly_patterns: WeeklyPatternData = strawberry.field(description="Your Baby's Patterns section")
    cost_analysis: EnhancedCostAnalysis = strawberry.field(description="Enhanced cost insights")
    peak_hours_detailed: DetailedPeakHours = strawberry.field(description="Detailed peak hours analysis")
    size_predictions: Optional[SizeChangePredictions] = strawberry.field(description="Smart size change predictions")

    # Metadata
    last_updated: datetime = strawberry.field(description="Last analytics calculation timestamp")
    data_quality_score: float = strawberry.field(description="Data completeness score (0-100)")


@strawberry.type
class EnhancedAnalyticsDashboardResponse:
    """Enhanced analytics dashboard query response"""
    success: bool = strawberry.field(description="Query success status")
    message: Optional[str] = strawberry.field(description="Success/error message")
    dashboard: Optional[EnhancedAnalyticsDashboard] = strawberry.field(description="Dashboard data")
    cache_hit: bool = strawberry.field(description="Whether data was served from cache")


# =============================================================================
# Export all types
# =============================================================================

__all__ = [
    # Enums
    "AnalyticsPeriodType",
    "AnalyticsMetricType",
    "UsagePatternType",
    "InsightLevelType",

    # Core data types
    "UsageDataPoint",
    "TrendDataPoint",
    "HourlyUsageDistribution",
    "DailyUsageSummary",
    "WeeklyTrendPoint",
    "UsagePattern",
    "InventoryInsight",
    "PredictionInsight",
    "CostAnalysis",
    "HealthInsight",

    # Main response types
    "UsageAnalytics",
    "WeeklyTrends",
    "DailySummary",
    "UsagePatterns",
    "InventoryInsights",
    "ProductCostBreakdown",
    "UpcomingPurchase",
    "EfficiencyScore",

    # Input types
    "AnalyticsDateRange",
    "AnalyticsFilters",

    # Response wrappers
    "AnalyticsResponse",
    "UsageAnalyticsResponse",
    "WeeklyTrendsResponse",
    "DailySummaryResponse",
    "UsagePatternsResponse",
    "InventoryInsightsResponse",

    # Dashboard types
    "AnalyticsDashboard",
    "AnalyticsDashboardResponse",

    # Enhanced wireframe-compliant types
    "WeeklyPatternData",
    "PeakHourData",
    "TimeSlotData",
    "DetailedPeakHours",
    "EnhancedCostAnalysis",
    "SizeChangePredictions",
    "AnalyticsOverviewSummary",
    "AnalyticsRawData",
    "AnalyticsOverview",
    "AnalyticsUsageEnhanced",
    "AnalyticsTrendsEnhanced",
    "EnhancedAnalyticsDashboard",
    "EnhancedAnalyticsDashboardResponse"
]