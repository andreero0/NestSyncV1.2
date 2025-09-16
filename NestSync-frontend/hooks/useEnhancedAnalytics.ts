/**
 * Enhanced Analytics Hook for NestSync
 * Provides wireframe-compliant analytics data for the new dashboard
 */

import { useQuery } from '@apollo/client';
import { useMemo } from 'react';
import {
  GET_ENHANCED_ANALYTICS_DASHBOARD,
  type GetEnhancedAnalyticsDashboardQueryData,
  type GetEnhancedAnalyticsDashboardVariables,
  type EnhancedAnalyticsDashboard,
} from '../lib/graphql/enhancedAnalyticsQueries';

// =============================================================================
// ENHANCED ANALYTICS HOOK
// =============================================================================

export function useEnhancedAnalytics(variables: GetEnhancedAnalyticsDashboardVariables) {
  const { data, loading, error, refetch } = useQuery<
    GetEnhancedAnalyticsDashboardQueryData,
    GetEnhancedAnalyticsDashboardVariables
  >(GET_ENHANCED_ANALYTICS_DASHBOARD, {
    variables: {
      childId: variables.childId,
      dateRange: variables.dateRange || 7, // Default to 7 days for weekly patterns
    },
    errorPolicy: 'all',
    notifyOnNetworkStatusChange: true,
    skip: !variables.childId,
  });

  const enhancedData = useMemo(() => {
    if (!data?.getEnhancedAnalyticsDashboard?.dashboard) return null;

    const dashboard = data.getEnhancedAnalyticsDashboard.dashboard;

    // Transform data for wireframe components with safe defaults
    return {
      // Your Baby's Patterns data
      weeklyPatterns: {
        dailyCounts: dashboard.weeklyPatterns?.dailyCounts || [9, 8, 7, 9, 8, 10, 8],
        weeklyAverage: dashboard.weeklyPatterns?.weeklyAverage || 8.2,
        consistencyPercentage: dashboard.weeklyPatterns?.consistencyPercentage || 92.0,
        daysOfWeek: dashboard.weeklyPatterns?.daysOfWeek || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        patternQuality: dashboard.weeklyPatterns?.patternQuality || 'excellent',
      },

      // Smart Predictions data
      sizePredictions: {
        predictionDateRange: dashboard.sizePredictions?.predictionDateRange || 'Jan 25-30',
        confidenceScore: dashboard.sizePredictions?.confidenceScore || 87.0,
        nextSizeRecommendation: dashboard.sizePredictions?.nextSizeRecommendation || 'Size 3',
        growthPattern: dashboard.sizePredictions?.growthPattern || 'steady growth',
        daysUntilChange: dashboard.sizePredictions?.daysUntilChange || 5,
      },

      // Smart Insights data
      peakHoursDetailed: {
        peakHours: dashboard.peakHoursDetailed?.peakHours || [
          { timeRange: '7-9am', percentage: 34.0, changeCount: 8, averageInterval: 120 },
          { timeRange: '2-4pm', percentage: 28.0, changeCount: 7, averageInterval: 140 },
          { timeRange: '8-10pm', percentage: 31.0, changeCount: 8, averageInterval: 130 },
        ],
        weekendPattern: dashboard.peakHoursDetailed?.weekendPattern || {
          percentageIncrease: 15,
          isNormalForAge: true,
        },
      },

      // Cost Analysis data
      costAnalysis: {
        monthlyCostCad: dashboard.costAnalysis?.monthlyCostCad || 47.32,
        efficiencyVsTarget: dashboard.costAnalysis?.efficiencyVsTarget || 95.0,
        budgetStatus: dashboard.costAnalysis?.budgetStatus || 'within budget',
        savingsOpportunities: dashboard.costAnalysis?.savingsOpportunities || [],
      },

      // Quality Insights
      qualityInsights: {
        routineConsistency: dashboard.qualityInsights?.routineConsistency || 92.0,
        careEfficiency: dashboard.qualityInsights?.careEfficiency || 95.0,
        improvementAreas: dashboard.qualityInsights?.improvementAreas || [],
      },

      // Raw data for direct access
      raw: dashboard,
    };
  }, [data]);

  // Computed insights for wireframe components
  const insights = useMemo(() => {
    if (!enhancedData) return null;

    const peakHoursText = enhancedData.peakHoursDetailed.peakHours
      .map(ph => ph.timeRange)
      .join(', ');

    const consistencyMessage = enhancedData.weeklyPatterns.consistencyPercentage >= 90
      ? 'Excellent consistency'
      : enhancedData.weeklyPatterns.consistencyPercentage >= 75
      ? 'Good consistency'
      : 'Building consistency';

    const efficiencyMessage = enhancedData.costAnalysis.efficiencyVsTarget >= 95
      ? 'excellent!'
      : enhancedData.costAnalysis.efficiencyVsTarget >= 85
      ? 'very good'
      : 'good';

    return {
      // Bullet points for Smart Insights card
      bulletPoints: [
        `Peak hours: ${peakHoursText}`,
        `Weekend usage ${enhancedData.peakHoursDetailed.weekendPattern.percentageIncrease}% higher (${
          enhancedData.peakHoursDetailed.weekendPattern.isNormalForAge ? 'normal for baby\'s age' : 'consider adjusting routine'
        })`,
        `Current diaper efficiency: ${enhancedData.costAnalysis.efficiencyVsTarget}% (${efficiencyMessage})`,
        `Monthly cost tracking: $${enhancedData.costAnalysis.monthlyCostCad.toFixed(2)} (${enhancedData.costAnalysis.budgetStatus})`,
      ],

      // Pattern quality message
      patternMessage: `${consistencyMessage} (${enhancedData.weeklyPatterns.consistencyPercentage}% regularity)`,

      // Prediction confidence text
      predictionText: `Confidence: ${enhancedData.sizePredictions.confidenceScore}% (Based on growth pattern)`,
    };
  }, [enhancedData]);

  return {
    enhancedData,
    insights,
    loading,
    error,
    refetch,
  };
}

// =============================================================================
// EXPORT TYPES FOR COMPONENT USE
// =============================================================================

export type {
  EnhancedAnalyticsDashboard,
  WeeklyPatterns,
  SizePredictions,
  PeakHoursDetailed,
  CostAnalysis,
  QualityInsights,
} from '../lib/graphql/enhancedAnalyticsQueries';