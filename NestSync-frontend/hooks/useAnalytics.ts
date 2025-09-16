/**
 * Analytics hooks for NestSync
 * Provides comprehensive data fetching for analytics dashboard
 */

import { useQuery } from '@apollo/client';
import { useMemo, useEffect } from 'react';
import {
  GET_USAGE_ANALYTICS_QUERY,
  GET_WEEKLY_TRENDS_QUERY,
  GET_DAILY_SUMMARY_QUERY,
  GET_USAGE_PATTERNS_QUERY,
  GET_INVENTORY_INSIGHTS_QUERY,
  GET_ANALYTICS_DASHBOARD_QUERY,
  type GetUsageAnalyticsVariables,
  type GetUsageAnalyticsQueryData,
  type GetWeeklyTrendsVariables,
  type GetWeeklyTrendsQueryData,
  type GetDailySummaryVariables,
  type GetDailySummaryQueryData,
  type GetUsagePatternsVariables,
  type GetUsagePatternsQueryData,
  type GetInventoryInsightsVariables,
  type GetInventoryInsightsQueryData,
  type GetAnalyticsDashboardVariables,
  type GetAnalyticsDashboardQueryData,
} from '../lib/graphql/analytics-queries';

// =============================================================================
// USAGE ANALYTICS HOOK
// =============================================================================

export function useUsageAnalytics(variables: GetUsageAnalyticsVariables) {
  // Transform variables to match backend schema
  const queryVariables = {
    filters: {
      childId: variables.childId,
      dateRange: null, // Use default 30 days
      period: "DAILY",
      includePredictions: false
    }
  };

  const { data, loading, error, refetch } = useQuery<GetUsageAnalyticsQueryData, any>(
    GET_USAGE_ANALYTICS_QUERY,
    {
      variables: queryVariables,
      errorPolicy: 'all',
      notifyOnNetworkStatusChange: true,
      pollInterval: 30000, // 30 seconds for real-time updates
      skip: !variables.childId, // Skip query if childId is empty
    }
  );

  const analytics = useMemo(() => {
    if (!data?.getUsageAnalytics?.analytics) return null;

    const usageData = data.getUsageAnalytics.analytics;

    // Safe defaults for missing data
    const defaultHourlyDistribution = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: 0,
      percentage: 0,
      isPeakHour: false
    }));

    const defaultWeekdayVsWeekend = {
      weekday: 0,
      weekend: 0
    };

    const defaultQualityMetrics = {
      averageRating: 0,
      improvementTrend: 0
    };

    // Transform data for charts with null safety
    const hourlyDistribution = usageData.hourlyDistribution || defaultHourlyDistribution;
    const hourlyChartData = Array.isArray(hourlyDistribution)
      ? hourlyDistribution.map(item => ({
          x: item?.hour || 0,
          y: item?.count || 0,
          label: `${item?.hour || 0}:00`,
        }))
      : defaultHourlyDistribution.map(item => ({
          x: item.hour,
          y: item.count,
          label: `${item.hour}:00`,
        }));

    // Create weekday vs weekend data from backend breakdown
    const weekdayData = [
      { label: 'Weekdays', value: usageData.weekdayCount || 0, color: '#0891B2' },
      { label: 'Weekends', value: usageData.weekendCount || 0, color: '#06B6D4' },
    ];

    const qualityMetrics = defaultQualityMetrics; // Not available in current backend response
    const currentStreak = usageData.currentStreak || 0; // Now available from backend
    const peakHour = usageData.hourlyDistribution && usageData.hourlyDistribution.length > 0
      ? usageData.hourlyDistribution.reduce((max, curr) => curr.count > max.count ? curr : max).hour
      : 0;

    return {
      raw: usageData,
      charts: {
        hourlyDistribution: hourlyChartData,
        weekdayVsWeekend: weekdayData,
      },
      insights: {
        isGoodStreak: currentStreak >= 7,
        peakHourLabel: `${peakHour}:00`,
        efficiencyTrend: 'stable' as const, // Not available in current backend response
        totalChanges: usageData.totalChanges || 0,
        dailyAverage: usageData.dailyAverage || 0,
      }
    };
  }, [data]);

  return {
    analytics,
    loading,
    error,
    refetch,
  };
}

// =============================================================================
// WEEKLY TRENDS HOOK
// =============================================================================

export function useWeeklyTrends(variables: GetWeeklyTrendsVariables) {
  const { data, loading, error, refetch } = useQuery<GetWeeklyTrendsQueryData, GetWeeklyTrendsVariables>(
    GET_WEEKLY_TRENDS_QUERY,
    {
      variables,
      errorPolicy: 'all',
      notifyOnNetworkStatusChange: true,
      pollInterval: 30000, // 30 seconds for real-time updates
      skip: !variables.childId, // Skip query if childId is empty
    }
  );

  const trends = useMemo(() => {
    if (!data?.getWeeklyTrends?.trends) return null;

    const trendsData = data.getWeeklyTrends.trends;

    // Safe defaults for missing data
    const defaultWeeklyData: any[] = [];

    // Transform for line charts with null safety
    const weeklyData = Array.isArray(trendsData.weeklyData) ? trendsData.weeklyData : defaultWeeklyData;

    const changesChartData = weeklyData.map((week, index) => ({
      x: index,
      y: week?.totalChanges || 0,
      label: `Week ${index + 1}`,
    }));

    const qualityChartData = weeklyData.map((week, index) => ({
      x: index,
      y: week?.dailyAverage || 0,
      label: `Week ${index + 1}`,
    }));

    return {
      raw: trendsData,
      charts: {
        changes: changesChartData,
        quality: qualityChartData,
      },
      insights: {
        changesTrend: trendsData.trendDirection || 'stable',
        qualityTrend: 'stable',
        nextWeekPrediction: trendsData.currentWeekChanges || 0,
        currentWeekChanges: trendsData.currentWeekChanges || 0,
        previousWeekChanges: trendsData.previousWeekChanges || 0,
        changePercentage: trendsData.changePercentage || 0,
      }
    };
  }, [data]);

  return {
    trends,
    loading,
    error,
    refetch,
  };
}

// =============================================================================
// ANALYTICS OVERVIEW HOOK (FOR DASHBOARD SUMMARY)
// =============================================================================

export function useAnalyticsOverview(variables: GetAnalyticsDashboardVariables) {
  const { data, loading, error, refetch } = useQuery<GetAnalyticsDashboardQueryData, GetAnalyticsDashboardVariables>(
    GET_ANALYTICS_DASHBOARD_QUERY,
    {
      variables,
      errorPolicy: 'all',
      notifyOnNetworkStatusChange: true,
      pollInterval: 30000, // 30 seconds for real-time updates
      skip: !variables.childId, // Skip query if childId is empty
    }
  );

  const overview = useMemo(() => {
    if (!data?.getAnalyticsDashboard?.dashboard) return null;

    const dashboardResponse = data.getAnalyticsDashboard;
    const dashboard = dashboardResponse.dashboard;

    // Safe defaults for missing data
    const defaultTopInsight = {
      message: 'No insights available',
      type: 'info',
      priority: 0,
      actionRequired: false
    };

    // Create quick stats from the dashboard data with safe number validation
    const rawDailyAverage = dashboard.recentUsage?.dailyAverage;
    const dailyAverage = (typeof rawDailyAverage === 'number' && !isNaN(rawDailyAverage))
      ? rawDailyAverage
      : 0;
    const statsCards = [
      {
        label: 'Today',
        value: String(dashboard.todayChanges || 0),
        trend: 0,
        trendDirection: 'stable' as const,
        trendIcon: 'minus',
        trendColor: '#6B7280',
      },
      {
        label: 'This Week',
        value: String(dashboard.weekChanges || 0),
        trend: 0,
        trendDirection: 'stable' as const,
        trendIcon: 'minus',
        trendColor: '#6B7280',
      },
      {
        label: 'This Month',
        value: String(dashboard.monthChanges || 0),
        trend: 0,
        trendDirection: 'stable' as const,
        trendIcon: 'minus',
        trendColor: '#6B7280',
      },
      {
        label: 'Daily Average',
        value: dailyAverage.toFixed(1),
        trend: 0,
        trendDirection: 'stable' as const,
        trendIcon: 'minus',
        trendColor: '#6B7280',
      },
    ];

    const topInsight = Array.isArray(dashboard.topInsights) && dashboard.topInsights.length > 0
      ? {
          message: dashboard.topInsights[0],
          type: 'info',
          priority: 1,
          actionRequired: false
        }
      : defaultTopInsight;

    // Calculate efficiency as a percentage (0-1) for progress bar
    const efficiencyProgress = (typeof dailyAverage === 'number' && !isNaN(dailyAverage))
      ? Math.max(0, Math.min(1, dailyAverage / 10))
      : 0;

    return {
      raw: {
        ...dashboard,
        averageEfficiency: efficiencyProgress,
      },
      cards: {
        stats: statsCards,
        insight: topInsight,
      },
      summary: {
        todayChanges: dashboard.todayChanges || 0,
        weekChanges: dashboard.weekChanges || 0,
        monthChanges: dashboard.monthChanges || 0,
        currentStreak: 0, // Not available in backend response
        efficiency: (typeof dailyAverage === 'number' && !isNaN(dailyAverage))
          ? ((dailyAverage / 10) * 100).toFixed(1) + '%'
          : '0.0%',
      }
    };
  }, [data]);

  return {
    overview,
    loading,
    error,
    refetch,
  };
}

// =============================================================================
// INVENTORY INSIGHTS HOOK
// =============================================================================

export function useInventoryInsights(variables: GetInventoryInsightsVariables) {
  const { data, loading, error, refetch } = useQuery<GetInventoryInsightsQueryData, GetInventoryInsightsVariables>(
    GET_INVENTORY_INSIGHTS_QUERY,
    {
      variables,
      errorPolicy: 'all',
      notifyOnNetworkStatusChange: true,
      pollInterval: 60000, // 1 minute for inventory (less critical)
      skip: !variables.childId, // Skip query if childId is empty
    }
  );

  const insights = useMemo(() => {
    if (!data?.getInventoryInsights?.insights) return null;

    const insightsData = data.getInventoryInsights.insights;

    // Transform for chart data with null safety
    const stockLevelsData = Array.isArray(insightsData.currentItems)
      ? insightsData.currentItems.map(stock => ({
          label: stock.size,
          value: stock.currentStock,
          daysRemaining: stock.daysRemaining,
          color: stock.daysRemaining <= 3 ? '#EF4444' :
                 stock.daysRemaining <= 7 ? '#F59E0B' : '#10B981',
        }))
      : [];

    const consumptionData = Array.isArray(insightsData.consumptionTrends)
      ? insightsData.consumptionTrends.map(trend => ({
          date: trend.date,
          value: trend.value,
          count: trend.count,
          label: trend.label,
          changePercentage: trend.changePercentage,
        }))
      : [];

    return {
      raw: insightsData,
      charts: {
        stockLevels: stockLevelsData,
        consumption: consumptionData,
      },
      insights: {
        lowStockItems: stockLevelsData.filter(stock => stock.daysRemaining <= 7),
        reorderAlerts: insightsData.reorderAlerts || [],
        costOptimizationTips: insightsData.costOptimizationTips || [],
        upcomingPurchases: insightsData.upcomingPurchases || [],
      }
    };
  }, [data]);

  return {
    insights,
    loading,
    error,
    refetch,
  };
}

// =============================================================================
// DAILY SUMMARY HOOK
// =============================================================================

export function useDailySummary(variables: GetDailySummaryVariables) {
  const { data, loading, error, refetch } = useQuery<GetDailySummaryQueryData, GetDailySummaryVariables>(
    GET_DAILY_SUMMARY_QUERY,
    {
      variables,
      errorPolicy: 'all',
      notifyOnNetworkStatusChange: true,
      pollInterval: 30000, // 30 seconds for real-time updates
      skip: !variables.childId, // Skip query if childId is empty
    }
  );

  const summary = useMemo(() => {
    if (!data?.getDailySummary?.summary) return null;

    const summaryData = data.getDailySummary.summary;

    // Transform hourly breakdown for bar chart
    const hourlyChartData = Array.isArray(summaryData.hourlyBreakdown)
      ? summaryData.hourlyBreakdown.map(hour => ({
          x: hour.hour,
          y: hour.count || 0,
          efficiency: hour.percentage || 0,
          label: `${hour.hour}:00`,
        }))
      : [];

    // Create basic caregiver data (not available in current backend response)
    const caregiverData = [{
      name: 'Primary Caregiver',
      changes: summaryData.totalChanges || 0,
      averageTime: summaryData.averageIntervalMinutes || 0,
    }];

    return {
      raw: summaryData,
      charts: {
        hourlyBreakdown: hourlyChartData,
        caregiverStats: caregiverData,
      },
      insights: {
        totalChanges: summaryData.summary?.totalChanges || 0,
        wetOnly: summaryData.summary?.wetOnly || 0,
        soiledOnly: summaryData.summary?.soiledOnly || 0,
        wetAndSoiled: summaryData.summary?.wetAndSoiled || 0,
        dryChanges: summaryData.summary?.dryChanges || 0,
        efficiencyScore: summaryData.summary?.efficiencyScore || 0,
        recommendations: summaryData.recommendations || [],
      },
    };
  }, [data]);

  return {
    summary,
    loading,
    error,
    refetch,
  };
}

// =============================================================================
// COMPREHENSIVE ANALYTICS HOOK (FOR FULL DASHBOARD)
// =============================================================================

export function useAnalyticsDashboard(childId: string) {
  const overview = useAnalyticsOverview({ childId });
  const usageAnalytics = useUsageAnalytics({ childId, timeRange: 'LAST_7_DAYS' });
  const weeklyTrends = useWeeklyTrends({ childId, weeksBack: 8 });
  const inventoryInsights = useInventoryInsights({ childId, includePredictions: true });

  const isLoading = overview.loading || usageAnalytics.loading ||
                   weeklyTrends.loading || inventoryInsights.loading;

  // Enhanced error logging to identify which queries are failing
  const errors = {
    overview: overview.error,
    usageAnalytics: usageAnalytics.error,
    weeklyTrends: weeklyTrends.error,
    inventoryInsights: inventoryInsights.error,
  };

  // Log detailed error information
  useEffect(() => {
    const errorCount = Object.values(errors).filter(Boolean).length;
    const totalQueries = Object.keys(errors).length;

    if (errorCount > 0) {
      console.log(`🚨 [useAnalyticsDashboard] ${errorCount}/${totalQueries} queries failed:`, {
        overview: overview.error ? 'FAILED' : 'OK',
        usageAnalytics: usageAnalytics.error ? 'FAILED' : 'OK',
        weeklyTrends: weeklyTrends.error ? 'FAILED' : 'OK',
        inventoryInsights: inventoryInsights.error ? 'FAILED' : 'OK',
        errors: Object.entries(errors).filter(([, error]) => error).map(([name, error]) => ({
          query: name,
          message: error?.message || 'Unknown error',
          networkError: error?.networkError?.message,
          graphQLErrors: error?.graphQLErrors?.map(e => e.message),
        }))
      });
    } else {
      console.log(`✅ [useAnalyticsDashboard] All ${totalQueries} queries successful`);
    }
  }, [overview.error, usageAnalytics.error, weeklyTrends.error, inventoryInsights.error]);

  // Graceful error handling - only show error when critical queries fail
  // Allow partial data display when some queries succeed
  const hasCriticalError = (overview.error && usageAnalytics.error) ||
                          (!overview.overview && !usageAnalytics.analytics && !weeklyTrends.trends);

  // Count successful queries to determine if we have enough data to display
  const successfulQueries = [
    overview.overview,
    usageAnalytics.analytics,
    weeklyTrends.trends,
    inventoryInsights.insights
  ].filter(Boolean).length;

  // Show error only if we have no usable data (all critical queries failed)
  const hasError = hasCriticalError && successfulQueries === 0;

  const refetchAll = () => {
    overview.refetch();
    usageAnalytics.refetch();
    weeklyTrends.refetch();
    inventoryInsights.refetch();
  };

  return {
    overview: overview.overview,
    usage: usageAnalytics.analytics,
    trends: weeklyTrends.trends,
    inventory: inventoryInsights.insights,
    loading: isLoading,
    error: hasError,
    refetch: refetchAll,
  };
}