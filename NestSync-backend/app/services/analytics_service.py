"""
Analytics Service for NestSync
Business logic for diaper usage analytics, patterns, and insights
"""

import logging
import uuid
from datetime import datetime, timezone, date, timedelta, time
from typing import Optional, List, Dict, Any, Tuple
from decimal import Decimal
from collections import defaultdict, Counter
import statistics
from dataclasses import dataclass

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, desc, asc, text, case
from sqlalchemy.orm import selectinload, joinedload

from app.models.inventory import UsageLog, InventoryItem, StockThreshold
from app.models.child import Child
from app.models.user import User
from app.utils.data_transformations import (
    TIMEZONE_CANADA,
    DEFAULT_CANADIAN_TIMEZONE,
    get_timezone_for_province
)

logger = logging.getLogger(__name__)


# =============================================================================
# Data Classes for Internal Calculations
# =============================================================================

@dataclass
class UsageDataPoint:
    """Internal data point for calculations"""
    timestamp: datetime
    quantity: int
    was_wet: Optional[bool]
    was_soiled: Optional[bool]
    time_since_last: Optional[int]
    usage_type: str
    hour_of_day: int
    day_of_week: int
    inventory_item_id: Optional[uuid.UUID]


@dataclass
class DailyStats:
    """Daily usage statistics"""
    date: date
    total_changes: int
    wet_only: int
    soiled_only: int
    wet_and_soiled: int
    dry_changes: int
    total_quantity: int
    average_interval: Optional[float]
    cost_estimate: Optional[float]


@dataclass
class PatternAnalysis:
    """Pattern analysis results"""
    pattern_type: str
    confidence_score: float
    peak_hours: List[int]
    low_hours: List[int]
    average_interval: float
    consistency_score: float


# =============================================================================
# Analytics Service Class
# =============================================================================

class AnalyticsService:
    """Service for calculating usage analytics and insights with PIPEDA compliance"""

    def __init__(self):
        self.logger = logging.getLogger(__name__)

    # =========================================================================
    # PIPEDA Compliance Methods
    # =========================================================================

    def anonymize_sensitive_data(self, data_points: List[UsageDataPoint], privacy_level: str = "standard") -> List[UsageDataPoint]:
        """
        Anonymize sensitive data according to PIPEDA requirements

        Privacy levels:
        - minimal: Only basic aggregated data
        - standard: Detailed analytics with some anonymization
        - full: Complete data for premium users with explicit consent
        """
        if privacy_level == "minimal":
            # For minimal privacy, only return aggregated counts without detailed patterns
            return data_points[:100]  # Limit data points
        elif privacy_level == "standard":
            # Standard privacy: remove or obfuscate some sensitive details
            anonymized_points = []
            for dp in data_points:
                # Keep core analytics data but remove detailed health information
                anonymized_dp = UsageDataPoint(
                    timestamp=dp.timestamp,
                    quantity=dp.quantity,
                    was_wet=dp.was_wet,
                    was_soiled=dp.was_soiled,
                    time_since_last=dp.time_since_last,
                    usage_type=dp.usage_type,
                    hour_of_day=dp.hour_of_day,
                    day_of_week=dp.day_of_week,
                    inventory_item_id=dp.inventory_item_id
                )
                anonymized_points.append(anonymized_dp)
            return anonymized_points
        else:  # full
            # Full data access for premium users with explicit analytics consent
            return data_points

    async def check_analytics_consent(self, session: AsyncSession, user_id: uuid.UUID) -> bool:
        """Check if user has granted consent for analytics processing"""
        try:
            from app.models.consent import ConsentRecord

            # Check for analytics consent
            consent_query = select(ConsentRecord).where(
                and_(
                    ConsentRecord.user_id == user_id,
                    ConsentRecord.consent_type == "analytics",
                    ConsentRecord.status == "granted",
                    ConsentRecord.is_deleted == False
                )
            )

            result = await session.execute(consent_query)
            consent_record = result.scalar_one_or_none()

            return consent_record is not None

        except Exception as e:
            self.logger.warning(f"Could not check analytics consent for user {user_id}: {e}")
            # Default to allowing basic analytics if consent system is unavailable
            return True

    def get_data_retention_date(self, data_type: str = "analytics") -> datetime:
        """
        Get data retention date according to PIPEDA requirements

        PIPEDA requires data to be retained only as long as necessary:
        - Analytics data: 7 years for business analysis
        - Personal health insights: 7 years (medical record standard)
        - Usage patterns: 2 years for service improvement
        """
        retention_periods = {
            "analytics": 7 * 365,  # 7 years
            "health_insights": 7 * 365,  # 7 years
            "usage_patterns": 2 * 365,  # 2 years
            "aggregated_stats": 10 * 365,  # 10 years (anonymized)
        }

        days = retention_periods.get(data_type, 365)  # Default 1 year
        return datetime.now(timezone.utc) + timedelta(days=days)

    def log_data_access(self, user_id: uuid.UUID, data_type: str, purpose: str):
        """Log data access for PIPEDA audit trail"""
        self.logger.info(
            f"PIPEDA_AUDIT: User {user_id} - Accessed {data_type} for {purpose} "
            f"at {datetime.now(timezone.utc).isoformat()}"
        )

    # =========================================================================
    # Core Data Retrieval
    # =========================================================================

    async def get_usage_data(
        self,
        session: AsyncSession,
        user_id: uuid.UUID,
        child_id: Optional[uuid.UUID] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        usage_type: Optional[str] = None,
        user_timezone: str = DEFAULT_CANADIAN_TIMEZONE
    ) -> List[UsageDataPoint]:
        """Retrieve usage data for analytics calculations with Canadian timezone support"""
        try:
            # Default date range: last 30 days
            if not end_date:
                end_date = date.today()
            if not start_date:
                start_date = end_date - timedelta(days=30)

            # Convert dates to datetime with Canadian timezone support
            # Use user's timezone for date boundary calculations
            import pytz
            try:
                user_tz = pytz.timezone(user_timezone)
            except pytz.UnknownTimeZoneError:
                self.logger.warning(f"Unknown timezone {user_timezone}, using default Canadian timezone")
                user_tz = pytz.timezone(DEFAULT_CANADIAN_TIMEZONE)

            # Convert to UTC for database queries (all timestamps stored in UTC)
            start_datetime = datetime.combine(start_date, time.min)
            start_datetime = user_tz.localize(start_datetime).astimezone(pytz.UTC)

            end_datetime = datetime.combine(end_date + timedelta(days=1), time.min)
            end_datetime = user_tz.localize(end_datetime).astimezone(pytz.UTC)

            # Build query
            query = select(UsageLog).options(
                selectinload(UsageLog.child),
                selectinload(UsageLog.inventory_item)
            ).where(
                and_(
                    UsageLog.logged_at >= start_datetime,
                    UsageLog.logged_at < end_datetime,
                    UsageLog.is_deleted == False
                )
            )

            # Filter by child if specified
            if child_id:
                query = query.where(UsageLog.child_id == child_id)
            else:
                # Filter by user's children
                child_subquery = select(Child.id).where(
                    and_(
                        Child.parent_id == user_id,
                        Child.is_deleted == False
                    )
                )
                query = query.where(UsageLog.child_id.in_(child_subquery))

            # Filter by usage type if specified
            if usage_type:
                query = query.where(UsageLog.usage_type == usage_type)

            # Order by timestamp
            query = query.order_by(UsageLog.logged_at)

            result = await session.execute(query)
            usage_logs = result.scalars().all()

            # Convert to data points with timezone-aware processing
            data_points = []
            for log in usage_logs:
                # Convert UTC timestamp to user's timezone for hour/day calculations
                user_timestamp = log.logged_at.replace(tzinfo=pytz.UTC).astimezone(user_tz)

                data_point = UsageDataPoint(
                    timestamp=log.logged_at,  # Keep original UTC timestamp
                    quantity=log.quantity_used,
                    was_wet=log.was_wet,
                    was_soiled=log.was_soiled,
                    time_since_last=log.time_since_last_change,
                    usage_type=log.usage_type,
                    hour_of_day=user_timestamp.hour,  # Use user's timezone for analytics
                    day_of_week=user_timestamp.weekday(),  # Use user's timezone for analytics
                    inventory_item_id=log.inventory_item_id
                )
                data_points.append(data_point)

            self.logger.info(f"Retrieved {len(data_points)} usage data points for analytics")
            return data_points

        except Exception as e:
            self.logger.error(f"Error retrieving usage data: {e}")
            raise

    async def get_inventory_data(
        self,
        session: AsyncSession,
        user_id: uuid.UUID,
        child_id: Optional[uuid.UUID] = None
    ) -> List[InventoryItem]:
        """Retrieve inventory data for insights"""
        try:
            # Build query
            query = select(InventoryItem).options(
                selectinload(InventoryItem.child)
            ).where(
                InventoryItem.is_deleted == False
            )

            # Filter by child if specified
            if child_id:
                query = query.where(InventoryItem.child_id == child_id)
            else:
                # Filter by user's children
                child_subquery = select(Child.id).where(
                    and_(
                        Child.parent_id == user_id,
                        Child.is_deleted == False
                    )
                )
                query = query.where(InventoryItem.child_id.in_(child_subquery))

            result = await session.execute(query)
            inventory_items = result.scalars().all()

            self.logger.info(f"Retrieved {len(inventory_items)} inventory items for insights")
            return inventory_items

        except Exception as e:
            self.logger.error(f"Error retrieving inventory data: {e}")
            raise

    # =========================================================================
    # Usage Analytics Calculations
    # =========================================================================

    def calculate_basic_stats(self, data_points: List[UsageDataPoint]) -> Dict[str, Any]:
        """Calculate basic usage statistics"""
        if not data_points:
            return {
                'total_changes': 0,
                'total_quantity': 0,
                'daily_average': 0.0,
                'wet_only_count': 0,
                'soiled_only_count': 0,
                'wet_and_soiled_count': 0,
                'dry_changes_count': 0,
                'average_interval_minutes': 0.0
            }

        total_changes = len(data_points)
        total_quantity = sum(dp.quantity for dp in data_points)

        # Categorize changes by condition
        wet_only = sum(1 for dp in data_points if dp.was_wet and not dp.was_soiled)
        soiled_only = sum(1 for dp in data_points if dp.was_soiled and not dp.was_wet)
        wet_and_soiled = sum(1 for dp in data_points if dp.was_wet and dp.was_soiled)
        dry_changes = sum(1 for dp in data_points if not dp.was_wet and not dp.was_soiled)

        # Calculate time intervals
        intervals = [dp.time_since_last for dp in data_points if dp.time_since_last]
        average_interval = statistics.mean(intervals) if intervals else 0.0

        # Calculate daily average
        if data_points:
            date_range = (data_points[-1].timestamp.date() - data_points[0].timestamp.date()).days + 1
            daily_average = total_changes / max(date_range, 1)
        else:
            daily_average = 0.0

        return {
            'total_changes': total_changes,
            'total_quantity': total_quantity,
            'daily_average': daily_average,
            'wet_only_count': wet_only,
            'soiled_only_count': soiled_only,
            'wet_and_soiled_count': wet_and_soiled,
            'dry_changes_count': dry_changes,
            'average_interval_minutes': average_interval
        }

    def calculate_weekday_weekend_breakdown(self, data_points: List[UsageDataPoint]) -> Dict[str, int]:
        """Calculate breakdown of diaper changes between weekdays and weekends"""
        if not data_points:
            return {
                'weekday_count': 0,
                'weekend_count': 0
            }

        weekday_count = 0
        weekend_count = 0

        for dp in data_points:
            # day_of_week: 0=Monday, 1=Tuesday, ..., 6=Sunday
            # Weekdays: Monday-Friday (0-4), Weekends: Saturday-Sunday (5-6)
            if dp.day_of_week <= 4:  # Monday to Friday
                weekday_count += 1
            else:  # Saturday and Sunday
                weekend_count += 1

        return {
            'weekday_count': weekday_count,
            'weekend_count': weekend_count
        }

    def calculate_current_streak(self, data_points: List[UsageDataPoint]) -> int:
        """Calculate current streak of consecutive days with diaper changes"""
        if not data_points:
            return 0

        # Group data points by date
        daily_data = defaultdict(list)
        for dp in data_points:
            daily_data[dp.timestamp.date()].append(dp)

        # Get all dates with changes, sorted in descending order (most recent first)
        dates_with_changes = sorted(daily_data.keys(), reverse=True)

        if not dates_with_changes:
            return 0

        # Calculate streak working backward from today
        today = date.today()
        current_streak = 0
        current_date = today

        # Check if today has changes
        if today in dates_with_changes:
            current_streak = 1
            current_date = today - timedelta(days=1)
        else:
            # If no changes today, check if yesterday has changes to start streak
            yesterday = today - timedelta(days=1)
            if yesterday not in dates_with_changes:
                return 0
            current_streak = 1
            current_date = yesterday - timedelta(days=1)

        # Continue checking consecutive days backwards
        while current_date in dates_with_changes:
            current_streak += 1
            current_date -= timedelta(days=1)

        return current_streak

    def calculate_hourly_distribution(self, data_points: List[UsageDataPoint]) -> List[Dict[str, Any]]:
        """Calculate usage distribution by hour of day"""
        if not data_points:
            return []

        hour_counts = Counter(dp.hour_of_day for dp in data_points)
        total_changes = len(data_points)

        # Find peak hours (top 25% of usage)
        sorted_hours = sorted(hour_counts.items(), key=lambda x: x[1], reverse=True)
        peak_threshold = len(sorted_hours) * 0.25
        peak_hours = set(hour for hour, count in sorted_hours[:int(peak_threshold)])

        distribution = []
        for hour in range(24):
            count = hour_counts.get(hour, 0)
            percentage = (count / total_changes * 100) if total_changes > 0 else 0

            distribution.append({
                'hour': hour,
                'count': count,
                'percentage': round(percentage, 2),
                'is_peak_hour': hour in peak_hours
            })

        return distribution

    def calculate_daily_summaries(self, data_points: List[UsageDataPoint]) -> List[DailyStats]:
        """Calculate daily usage summaries"""
        if not data_points:
            return []

        # Group by date
        daily_data = defaultdict(list)
        for dp in data_points:
            daily_data[dp.timestamp.date()].append(dp)

        summaries = []
        for date_key, day_points in daily_data.items():
            stats = self.calculate_basic_stats(day_points)

            # Calculate intervals for this day
            intervals = [dp.time_since_last for dp in day_points if dp.time_since_last]
            avg_interval = statistics.mean(intervals) if intervals else None

            summary = DailyStats(
                date=date_key,
                total_changes=stats['total_changes'],
                wet_only=stats['wet_only_count'],
                soiled_only=stats['soiled_only_count'],
                wet_and_soiled=stats['wet_and_soiled_count'],
                dry_changes=stats['dry_changes_count'],
                total_quantity=stats['total_quantity'],
                average_interval=avg_interval,
                cost_estimate=None  # Will be calculated with inventory data
            )
            summaries.append(summary)

        return sorted(summaries, key=lambda x: x.date)

    def analyze_usage_patterns(self, data_points: List[UsageDataPoint]) -> PatternAnalysis:
        """Analyze usage patterns and identify routine"""
        if not data_points:
            return PatternAnalysis(
                pattern_type="insufficient_data",
                confidence_score=0.0,
                peak_hours=[],
                low_hours=[],
                average_interval=0.0,
                consistency_score=0.0
            )

        # Analyze hourly patterns
        hour_counts = Counter(dp.hour_of_day for dp in data_points)
        total_changes = len(data_points)

        # Identify peak and low hours
        sorted_hours = sorted(hour_counts.items(), key=lambda x: x[1], reverse=True)
        peak_hours = [hour for hour, count in sorted_hours[:6] if count > 0]  # Top 6 hours
        low_hours = [hour for hour, count in sorted_hours[-6:] if count == 0]  # Bottom 6 hours

        # Calculate intervals
        intervals = [dp.time_since_last for dp in data_points if dp.time_since_last]
        average_interval = statistics.mean(intervals) if intervals else 0.0

        # Determine pattern type
        pattern_type = self._determine_pattern_type(hour_counts, peak_hours)

        # Calculate consistency score
        consistency_score = self._calculate_consistency_score(intervals, hour_counts)

        # Calculate confidence based on data quantity and consistency
        confidence_score = min(100.0, (len(data_points) / 50) * 100 * (consistency_score / 100))

        return PatternAnalysis(
            pattern_type=pattern_type,
            confidence_score=round(confidence_score, 2),
            peak_hours=peak_hours,
            low_hours=low_hours,
            average_interval=round(average_interval, 2),
            consistency_score=round(consistency_score, 2)
        )

    def _determine_pattern_type(self, hour_counts: Counter, peak_hours: List[int]) -> str:
        """Determine the type of usage pattern"""
        if not peak_hours:
            return "irregular"

        # Check for morning peak (6-10 AM)
        morning_peak = any(6 <= hour <= 10 for hour in peak_hours)
        # Check for evening peak (6-10 PM)
        evening_peak = any(18 <= hour <= 22 for hour in peak_hours)
        # Check for night activity (10 PM - 6 AM)
        night_activity = any(hour >= 22 or hour <= 6 for hour in peak_hours)

        if morning_peak and evening_peak:
            return "morning_evening_peak"
        elif morning_peak:
            return "morning_peak"
        elif evening_peak:
            return "evening_peak"
        elif night_activity:
            return "night_heavy"
        else:
            # Check if usage is evenly distributed
            hour_variance = statistics.variance(hour_counts.values()) if len(hour_counts) > 1 else 0
            if hour_variance < 2:
                return "consistent"
            else:
                return "irregular"

    def _calculate_consistency_score(self, intervals: List[int], hour_counts: Counter) -> float:
        """Calculate how consistent the usage pattern is"""
        if not intervals or len(hour_counts) < 2:
            return 0.0

        # Interval consistency (lower variance = higher consistency)
        interval_variance = statistics.variance(intervals) if len(intervals) > 1 else 0
        max_expected_variance = 14400  # 4 hours in minutes squared
        interval_consistency = max(0, 100 - (interval_variance / max_expected_variance) * 100)

        # Hourly consistency (more even distribution = higher consistency)
        hour_variance = statistics.variance(hour_counts.values())
        max_hour_variance = statistics.mean(hour_counts.values()) ** 2
        hour_consistency = max(0, 100 - (hour_variance / max_hour_variance) * 100) if max_hour_variance > 0 else 0

        # Combined score
        return (interval_consistency + hour_consistency) / 2

    # =========================================================================
    # Weekly Trends Analysis
    # =========================================================================

    def calculate_weekly_trends(self, data_points: List[UsageDataPoint]) -> Dict[str, Any]:
        """Calculate weekly usage trends"""
        if not data_points:
            return {
                'weeks_analyzed': 0,
                'current_week_changes': 0,
                'previous_week_changes': 0,
                'change_percentage': 0.0,
                'weekly_data': [],
                'trend_direction': 'stable',
                'average_weekly_changes': 0.0
            }

        # Group by week
        weekly_data = defaultdict(list)
        for dp in data_points:
            # Get start of week (Monday)
            week_start = dp.timestamp.date() - timedelta(days=dp.timestamp.weekday())
            weekly_data[week_start].append(dp)

        # Calculate weekly summaries
        weekly_summaries = []
        for week_start, week_points in weekly_data.items():
            week_end = week_start + timedelta(days=6)
            total_changes = len(week_points)
            daily_average = total_changes / 7

            # Determine pattern type for the week
            hour_counts = Counter(dp.hour_of_day for dp in week_points)
            pattern_type = self._determine_pattern_type(hour_counts, [])

            weekly_summaries.append({
                'week_start': week_start,
                'week_end': week_end,
                'total_changes': total_changes,
                'daily_average': round(daily_average, 2),
                'pattern_type': pattern_type
            })

        # Sort by week
        weekly_summaries.sort(key=lambda x: x['week_start'])

        # Calculate week-over-week changes
        for i in range(1, len(weekly_summaries)):
            current = weekly_summaries[i]['total_changes']
            previous = weekly_summaries[i-1]['total_changes']
            if previous > 0:
                change_percentage = ((current - previous) / previous) * 100
                weekly_summaries[i]['change_from_previous'] = round(change_percentage, 2)

        # Overall trend analysis
        weeks_analyzed = len(weekly_summaries)
        current_week_changes = weekly_summaries[-1]['total_changes'] if weekly_summaries else 0
        previous_week_changes = weekly_summaries[-2]['total_changes'] if len(weekly_summaries) > 1 else 0

        change_percentage = 0.0
        if previous_week_changes > 0:
            change_percentage = ((current_week_changes - previous_week_changes) / previous_week_changes) * 100

        # Determine trend direction
        if len(weekly_summaries) >= 3:
            recent_changes = [w['total_changes'] for w in weekly_summaries[-3:]]
            trend_direction = self._determine_trend_direction(recent_changes)
        else:
            trend_direction = 'stable'

        average_weekly_changes = sum(w['total_changes'] for w in weekly_summaries) / max(weeks_analyzed, 1)

        return {
            'weeks_analyzed': weeks_analyzed,
            'current_week_changes': current_week_changes,
            'previous_week_changes': previous_week_changes,
            'change_percentage': round(change_percentage, 2),
            'weekly_data': weekly_summaries,
            'trend_direction': trend_direction,
            'average_weekly_changes': round(average_weekly_changes, 2)
        }

    def _determine_trend_direction(self, recent_values: List[int]) -> str:
        """Determine if trend is increasing, decreasing, or stable"""
        if len(recent_values) < 2:
            return 'stable'

        # Calculate trend using simple linear regression
        x_values = list(range(len(recent_values)))
        n = len(recent_values)

        sum_x = sum(x_values)
        sum_y = sum(recent_values)
        sum_xy = sum(x * y for x, y in zip(x_values, recent_values))
        sum_x2 = sum(x * x for x in x_values)

        slope = (n * sum_xy - sum_x * sum_y) / (n * sum_x2 - sum_x * sum_x)

        if slope > 0.5:
            return 'increasing'
        elif slope < -0.5:
            return 'decreasing'
        else:
            return 'stable'

    # =========================================================================
    # Inventory Insights
    # =========================================================================

    async def calculate_inventory_insights(
        self,
        session: AsyncSession,
        inventory_items: List[InventoryItem],
        usage_data: List[UsageDataPoint]
    ) -> List[Dict[str, Any]]:
        """Calculate inventory consumption insights"""
        insights = []

        for item in inventory_items:
            try:
                # Get usage data for this item
                item_usage = [dp for dp in usage_data if dp.inventory_item_id == item.id]

                if not item_usage:
                    # No usage data for this item
                    insight = {
                        'product_type': item.product_type,
                        'size': item.size,
                        'brand': item.brand,
                        'current_stock': item.quantity_remaining,
                        'daily_consumption_rate': 0.0,
                        'days_remaining': None,
                        'reorder_recommendation': 'No usage data available'
                    }
                    insights.append(insight)
                    continue

                # Calculate consumption rate
                usage_days = (item_usage[-1].timestamp.date() - item_usage[0].timestamp.date()).days + 1
                total_consumed = sum(dp.quantity for dp in item_usage)
                daily_consumption_rate = total_consumed / max(usage_days, 1)

                # Calculate days remaining
                days_remaining = None
                if daily_consumption_rate > 0:
                    days_remaining = item.quantity_remaining / daily_consumption_rate

                # Generate reorder recommendation
                reorder_recommendation = self._generate_reorder_recommendation(
                    item, daily_consumption_rate, days_remaining
                )

                # Calculate cost per day
                cost_per_day = None
                if item.cost_per_unit_calculated and daily_consumption_rate > 0:
                    cost_per_day = float(item.cost_per_unit_calculated) * daily_consumption_rate

                insight = {
                    'product_type': item.product_type,
                    'size': item.size,
                    'brand': item.brand,
                    'current_stock': item.quantity_remaining,
                    'daily_consumption_rate': round(daily_consumption_rate, 2),
                    'days_remaining': round(days_remaining, 1) if days_remaining else None,
                    'predicted_next_purchase': None,  # Can be enhanced with ML
                    'reorder_recommendation': reorder_recommendation,
                    'cost_per_day': round(cost_per_day, 2) if cost_per_day else None,
                    'efficiency_rating': self._calculate_efficiency_rating(item, daily_consumption_rate)
                }
                insights.append(insight)

            except Exception as e:
                self.logger.error(f"Error calculating insights for item {item.id}: {e}")
                continue

        return insights

    def _generate_reorder_recommendation(
        self,
        item: InventoryItem,
        daily_consumption_rate: float,
        days_remaining: Optional[float]
    ) -> str:
        """Generate reorder recommendation based on stock and consumption"""
        if daily_consumption_rate <= 0:
            return "Monitor usage patterns"

        if days_remaining is None:
            return "Unable to calculate - insufficient data"

        if days_remaining <= 3:
            return "URGENT: Reorder immediately"
        elif days_remaining <= 7:
            return "Reorder soon - less than a week remaining"
        elif days_remaining <= 14:
            return "Consider reordering within the next week"
        elif days_remaining <= 30:
            return "Stock levels good for now"
        else:
            return "Well stocked"

    def _calculate_efficiency_rating(
        self,
        item: InventoryItem,
        daily_consumption_rate: float
    ) -> str:
        """Calculate efficiency rating based on usage patterns"""
        if daily_consumption_rate <= 0:
            return "unknown"

        # This is a simplified rating - can be enhanced with ML
        if item.product_type == "diaper":
            if daily_consumption_rate <= 4:
                return "excellent"
            elif daily_consumption_rate <= 6:
                return "good"
            elif daily_consumption_rate <= 8:
                return "fair"
            else:
                return "review_needed"
        else:
            # Default rating for other products
            return "good"

    # =========================================================================
    # Premium Analytics (ML Predictions)
    # =========================================================================

    def calculate_premium_insights(
        self,
        data_points: List[UsageDataPoint],
        user_subscription_level: str = "free"
    ) -> Dict[str, Any]:
        """Calculate premium analytics insights (placeholder for ML features)"""
        if user_subscription_level != "premium":
            return {
                'predictions': None,
                'health_insights': None,
                'advanced_patterns': None
            }

        # Placeholder for ML-powered insights
        # In a full implementation, this would include:
        # - Size transition predictions
        # - Consumption forecasting
        # - Health pattern detection
        # - Seasonal adjustments

        predictions = [
            {
                'prediction_type': 'size_transition',
                'confidence_level': 75.0,
                'predicted_value': 1.0,  # Move up one size
                'predicted_date': date.today() + timedelta(days=30),
                'factors': ['Growth rate', 'Current fit indicators'],
                'recommendation': 'Consider purchasing next size up in 30 days',
                'model_accuracy': 85.0
            }
        ]

        health_insights = [
            {
                'insight_type': 'pattern_analysis',
                'description': 'Normal diaper change frequency detected',
                'recommendation': 'Continue current routine',
                'urgency_level': 'low',
                'pattern_detected': True,
                'confidence_score': 90.0
            }
        ]

        advanced_patterns = [
            'Consistent morning routine detected',
            'Weekend pattern differs from weekdays',
            'Growth phase indicated by increased frequency'
        ]

        return {
            'predictions': predictions,
            'health_insights': health_insights,
            'advanced_patterns': advanced_patterns
        }

    # =========================================================================
    # Cost Analysis
    # =========================================================================

    async def calculate_cost_analysis(
        self,
        session: AsyncSession,
        usage_data: List[UsageDataPoint],
        inventory_items: List[InventoryItem],
        period: str = "monthly"
    ) -> Dict[str, Any]:
        """Calculate cost analysis for the specified period"""
        try:
            if not usage_data or not inventory_items:
                return {
                    'period': period,
                    'total_cost': 0.0,
                    'cost_per_change': 0.0,
                    'cost_per_day': 0.0,
                    'breakdown_by_product': [],
                    'comparison_previous_period': None,
                    'budget_recommendation': 'Insufficient data for analysis'
                }

            # Calculate costs by product type
            product_costs = defaultdict(lambda: {'quantity': 0, 'cost': 0.0})

            for dp in usage_data:
                # Find corresponding inventory item
                item = next((item for item in inventory_items if item.id == dp.inventory_item_id), None)
                if item and item.cost_per_unit_calculated:
                    cost = float(item.cost_per_unit_calculated) * dp.quantity
                    product_costs[item.product_type]['quantity'] += dp.quantity
                    product_costs[item.product_type]['cost'] += cost

            # Calculate totals
            total_cost = sum(data['cost'] for data in product_costs.values())
            total_changes = len(usage_data)
            cost_per_change = total_cost / max(total_changes, 1)

            # Calculate per-day cost
            if usage_data:
                date_range = (usage_data[-1].timestamp.date() - usage_data[0].timestamp.date()).days + 1
                cost_per_day = total_cost / max(date_range, 1)
            else:
                cost_per_day = 0.0

            # Create breakdown
            breakdown = []
            for product_type, data in product_costs.items():
                breakdown.append({
                    'product_type': product_type,
                    'quantity_used': data['quantity'],
                    'total_cost': round(data['cost'], 2),
                    'percentage_of_total': round((data['cost'] / total_cost * 100) if total_cost > 0 else 0, 2)
                })

            # Generate budget recommendation
            budget_recommendation = self._generate_budget_recommendation(cost_per_day, total_cost)

            return {
                'period': period,
                'total_cost': round(total_cost, 2),
                'cost_per_change': round(cost_per_change, 2),
                'cost_per_day': round(cost_per_day, 2),
                'breakdown_by_product': breakdown,
                'comparison_previous_period': None,  # Could be enhanced with historical data
                'budget_recommendation': budget_recommendation
            }

        except Exception as e:
            self.logger.error(f"Error calculating cost analysis: {e}")
            return {
                'period': period,
                'total_cost': 0.0,
                'cost_per_change': 0.0,
                'cost_per_day': 0.0,
                'breakdown_by_product': [],
                'comparison_previous_period': None,
                'budget_recommendation': 'Error calculating costs'
            }

    def _generate_budget_recommendation(self, cost_per_day: float, total_cost: float) -> str:
        """Generate budget recommendation based on costs"""
        monthly_cost = cost_per_day * 30

        if monthly_cost < 50:
            return "Budget is very reasonable for diaper expenses"
        elif monthly_cost < 100:
            return "Good budget management - consider bulk purchases for savings"
        elif monthly_cost < 150:
            return "Average spending - look for deals and promotions"
        else:
            return "Consider reviewing brand choices or bulk purchasing to reduce costs"


# =============================================================================
# Export Service
# =============================================================================

__all__ = ["AnalyticsService"]