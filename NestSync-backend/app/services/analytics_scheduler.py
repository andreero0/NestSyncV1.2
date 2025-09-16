"""
Analytics Scheduler for NestSync
Handles scheduled analytics processing tasks
"""

import asyncio
import logging
from typing import List
from datetime import datetime, timezone, timedelta
from sqlalchemy import select, distinct, delete, extract, and_

from app.config.database import get_async_session
from app.models.analytics import AnalyticsDailySummary
from app.services.enhanced_analytics_service import AnalyticsBackgroundProcessor
from app.utils.data_transformations import TIMEZONE_CANADA

logger = logging.getLogger(__name__)


class AnalyticsScheduler:
    """
    Scheduler for analytics background processing tasks
    Handles daily and weekly analytics calculations
    """

    def __init__(self):
        self.canadian_tz = TIMEZONE_CANADA
        self.processor = AnalyticsBackgroundProcessor()

    async def run_daily_analytics_processing(self) -> None:
        """
        Run daily analytics processing for all active children
        Should be called daily at midnight (Canadian time)
        """
        try:
            logger.info("Starting daily analytics processing")

            async for session in get_async_session():
                yesterday = (datetime.now(self.canadian_tz) - timedelta(days=1)).date()

                # Get all children who had diaper changes yesterday
                children_query = select(distinct(AnalyticsDailySummary.child_id)).where(
                    AnalyticsDailySummary.date == yesterday
                )

                children_result = await session.execute(children_query)
                child_ids = children_result.scalars().all()

                logger.info(f"Processing daily analytics for {len(child_ids)} children on {yesterday}")

                # Process analytics for each child
                for child_id in child_ids:
                    try:
                        await self.processor.process_daily_analytics(str(child_id), yesterday)
                        logger.debug(f"Processed daily analytics for child {child_id}")
                    except Exception as e:
                        logger.error(f"Failed to process daily analytics for child {child_id}: {e}")

                # Also trigger weekly pattern calculation for Monday
                if yesterday.weekday() == 6:  # Sunday - calculate patterns for the completed week
                    logger.info("Sunday detected - triggering weekly pattern calculations")
                    await self._run_weekly_pattern_calculations(child_ids)

            logger.info("Daily analytics processing completed")

        except Exception as e:
            logger.error(f"Error in daily analytics processing: {e}")
            raise

    async def _run_weekly_pattern_calculations(self, child_ids: List[str]) -> None:
        """
        Calculate weekly patterns for all active children
        """
        try:
            logger.info(f"Calculating weekly patterns for {len(child_ids)} children")

            for child_id in child_ids:
                try:
                    await self.processor.calculate_weekly_patterns(str(child_id))
                    logger.debug(f"Calculated weekly patterns for child {child_id}")
                except Exception as e:
                    logger.error(f"Failed to calculate weekly patterns for child {child_id}: {e}")

        except Exception as e:
            logger.error(f"Error in weekly pattern calculations: {e}")

    async def run_monthly_cost_analysis(self) -> None:
        """
        Run monthly cost analysis for all active children
        Should be called on the 1st of each month
        """
        try:
            logger.info("Starting monthly cost analysis")

            async for session in get_async_session():
                current_month = datetime.now(self.canadian_tz)
                previous_month = (current_month.replace(day=1) - timedelta(days=1))
                month_year = previous_month.strftime("%Y-%m")

                # Get all children who had activity in the previous month
                children_query = select(distinct(AnalyticsDailySummary.child_id)).where(
                    and_(
                        extract('year', AnalyticsDailySummary.date) == previous_month.year,
                        extract('month', AnalyticsDailySummary.date) == previous_month.month
                    )
                )

                children_result = await session.execute(children_query)
                child_ids = children_result.scalars().all()

                logger.info(f"Processing monthly cost analysis for {len(child_ids)} children for {month_year}")

                for child_id in child_ids:
                    try:
                        await self._calculate_monthly_cost_analysis(str(child_id), month_year)
                        logger.debug(f"Calculated monthly cost analysis for child {child_id}")
                    except Exception as e:
                        logger.error(f"Failed to calculate monthly cost analysis for child {child_id}: {e}")

            logger.info("Monthly cost analysis completed")

        except Exception as e:
            logger.error(f"Error in monthly cost analysis: {e}")
            raise

    async def _calculate_monthly_cost_analysis(self, child_id: str, month_year: str) -> None:
        """
        Calculate cost analysis for a specific child and month
        This is a simplified version - would be expanded with actual cost tracking
        """
        try:
            from app.models.analytics import AnalyticsCostTracking
            from decimal import Decimal

            async for session in get_async_session():
                year, month = map(int, month_year.split('-'))

                # Get daily summaries for the month
                monthly_query = select(AnalyticsDailySummary).where(
                    and_(
                        AnalyticsDailySummary.child_id == child_id,
                        extract('year', AnalyticsDailySummary.date) == year,
                        extract('month', AnalyticsDailySummary.date) == month
                    )
                )

                monthly_result = await session.execute(monthly_query)
                monthly_summaries = monthly_result.scalars().all()

                if not monthly_summaries:
                    return

                # Calculate metrics
                total_changes = sum(summary.total_changes for summary in monthly_summaries)
                total_cost = sum(summary.estimated_cost_cad or Decimal('0') for summary in monthly_summaries)
                cost_per_change = total_cost / total_changes if total_changes > 0 else Decimal('0')

                # Calculate weekend vs weekday usage
                weekday_changes = 0
                weekend_changes = 0

                for summary in monthly_summaries:
                    if summary.date.weekday() < 5:  # Mon-Fri
                        weekday_changes += summary.total_changes
                    else:  # Sat-Sun
                        weekend_changes += summary.total_changes

                weekday_avg = weekday_changes / 22 if weekday_changes > 0 else 0  # ~22 weekdays per month
                weekend_avg = weekend_changes / 8 if weekend_changes > 0 else 0   # ~8 weekend days per month
                weekend_ratio = (weekend_avg / weekday_avg * 100) if weekday_avg > 0 else 100

                # Calculate efficiency vs target ($0.20 CAD per change)
                target_cost = Decimal('0.20')
                efficiency_vs_target = min(100, (target_cost / cost_per_change * 100)) if cost_per_change > 0 else 100

                # Find most expensive day
                day_costs = {}
                for summary in monthly_summaries:
                    day_name = summary.date.strftime('%A')
                    day_costs[day_name] = day_costs.get(day_name, Decimal('0')) + (summary.estimated_cost_cad or Decimal('0'))

                most_expensive_day = max(day_costs.items(), key=lambda x: x[1])[0] if day_costs else "Monday"

                # Get or create cost tracking record
                cost_query = select(AnalyticsCostTracking).where(
                    and_(
                        AnalyticsCostTracking.child_id == child_id,
                        AnalyticsCostTracking.month_year == month_year
                    )
                )

                cost_result = await session.execute(cost_query)
                cost_tracking = cost_result.scalar_one_or_none()

                if cost_tracking:
                    # Update existing record
                    cost_tracking.total_cost_cad = total_cost
                    cost_tracking.cost_per_change_cad = cost_per_change
                    cost_tracking.efficiency_vs_target = efficiency_vs_target
                    cost_tracking.weekend_vs_weekday_usage = Decimal(str(weekend_ratio))
                    cost_tracking.most_expensive_day = most_expensive_day
                    cost_tracking.calculated_at = datetime.now(self.canadian_tz)
                else:
                    # Create new record
                    cost_tracking = AnalyticsCostTracking(
                        child_id=child_id,
                        month_year=month_year,
                        total_cost_cad=total_cost,
                        cost_per_change_cad=cost_per_change,
                        efficiency_vs_target=efficiency_vs_target,
                        weekend_vs_weekday_usage=Decimal(str(weekend_ratio)),
                        most_expensive_day=most_expensive_day,
                        cost_trend_7day=Decimal('0'),  # Would be calculated from trend analysis
                        primary_brand="Generic",  # Would be calculated from actual usage data
                        primary_size="Size 2",   # Would be calculated from actual usage data
                        brands_used={},
                        sizes_used={}
                    )
                    session.add(cost_tracking)

                await session.commit()
                logger.info(f"Updated cost tracking for child {child_id}, month {month_year}")

        except Exception as e:
            logger.error(f"Error calculating monthly cost analysis for child {child_id}: {e}")
            raise

    async def cleanup_old_analytics_data(self) -> None:
        """
        Clean up old analytics data according to retention policies
        Should be run monthly
        """
        try:
            logger.info("Starting analytics data cleanup")

            async for session in get_async_session():
                # Delete daily summaries older than 2 years
                retention_date = datetime.now(self.canadian_tz) - timedelta(days=730)

                delete_query = delete(AnalyticsDailySummary).where(
                    AnalyticsDailySummary.date < retention_date.date()
                )

                delete_result = await session.execute(delete_query)
                deleted_count = delete_result.rowcount

                await session.commit()

                logger.info(f"Cleaned up {deleted_count} old daily analytics records")

        except Exception as e:
            logger.error(f"Error in analytics data cleanup: {e}")
            raise


# =============================================================================
# Scheduler Instance
# =============================================================================

analytics_scheduler = AnalyticsScheduler()


# =============================================================================
# Convenience Functions for Manual Triggering
# =============================================================================

async def trigger_daily_analytics() -> None:
    """Manually trigger daily analytics processing"""
    await analytics_scheduler.run_daily_analytics_processing()


async def trigger_monthly_cost_analysis() -> None:
    """Manually trigger monthly cost analysis"""
    await analytics_scheduler.run_monthly_cost_analysis()


async def trigger_data_cleanup() -> None:
    """Manually trigger data cleanup"""
    await analytics_scheduler.cleanup_old_analytics_data()


# =============================================================================
# Export
# =============================================================================

__all__ = [
    "AnalyticsScheduler",
    "analytics_scheduler",
    "trigger_daily_analytics",
    "trigger_monthly_cost_analysis",
    "trigger_data_cleanup"
]