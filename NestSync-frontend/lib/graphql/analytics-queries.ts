/**
 * GraphQL Analytics Queries for NestSync
 * Comprehensive analytics system for diaper tracking and insights
 */

import { gql } from '@apollo/client';
import {
  USAGE_ANALYTICS_FRAGMENT,
  WEEKLY_TRENDS_FRAGMENT,
  DAILY_SUMMARY_FRAGMENT,
  USAGE_PATTERN_FRAGMENT,
  INVENTORY_INSIGHT_FRAGMENT,
} from './fragments';

// =============================================================================
// ANALYTICS QUERIES
// =============================================================================

export const GET_USAGE_ANALYTICS_QUERY = gql`
  query GetUsageAnalytics(
    $filters: AnalyticsFilters
  ) {
    getUsageAnalytics(
      filters: $filters
    ) {
      success
      message
      error
      insightLevel
      dataPointsAnalyzed
      cacheHit
      analytics {
        startDate
        endDate
        childId
        period
        insightLevel
        totalChanges
        totalQuantity
        dailyAverage
        wetOnlyCount
        soiledOnlyCount
        wetAndSoiledCount
        dryChangesCount
        weekdayCount
        weekendCount
        currentStreak
        averageIntervalMinutes
        usagePattern {
          patternType
          confidenceScore
          description
          peakHours
          lowHours
          averageIntervalMinutes
          consistencyScore
        }
        hourlyDistribution {
          hour
          count
          percentage
          isPeakHour
        }
        dailySummaries {
          date
          totalChanges
          wetOnly
          soiledOnly
          wetAndSoiled
          dryChanges
          totalQuantity
          averageIntervalMinutes
          efficiencyScore
          costEstimate
        }
        trendData {
          date
          value
          count
          label
          changePercentage
        }
      }
    }
  }
`;

export const GET_WEEKLY_TRENDS_QUERY = gql`
  query GetWeeklyTrends(
    $childId: String
    $weeksBack: Int = 8
  ) {
    getWeeklyTrends(
      childId: $childId
      weeksBack: $weeksBack
    ) {
      success
      message
      error
      insightLevel
      dataPointsAnalyzed
      trends {
        childId
        weeksAnalyzed
        currentWeekChanges
        previousWeekChanges
        changePercentage
        weeklyData {
          weekStart
          weekEnd
          totalChanges
          dailyAverage
          changeFromPrevious
          patternType
        }
        trendDirection
        seasonalityDetected
        patternConsistency
        peakWeek {
          weekStart
          weekEnd
          totalChanges
          dailyAverage
          changeFromPrevious
          patternType
        }
        lowWeek {
          weekStart
          weekEnd
          totalChanges
          dailyAverage
          changeFromPrevious
          patternType
        }
        averageWeeklyChanges
      }
    }
  }
`;

export const GET_DAILY_SUMMARY_QUERY = gql`
  query GetDailySummary(
    $targetDate: String!
    $childId: String
  ) {
    getDailySummary(
      targetDate: $targetDate
      childId: $childId
    ) {
      success
      message
      error
      insightLevel
      dataPointsAnalyzed
      date
      childId
      totalChanges
      wetOnly
      soiledOnly
      wetAndSoiled
      dryChanges
      totalQuantity
      averageIntervalMinutes
      efficiencyScore
      costEstimate
      hourlyBreakdown {
        hour
        count
        percentage
        isPeakHour
      }
      usageTimeline {
        timestamp
        count
        quantity
        hourOfDay
        dayOfWeek
        wasWet
        wasSoiled
        timeSinceLast
      }
      notablePatterns
      efficiencyNotes
      recommendations
    }
  }
`;

export const GET_USAGE_PATTERNS_QUERY = gql`
  query GetUsagePatterns(
    $childId: String
    $analysisDays: Int = 30
  ) {
    getUsagePatterns(
      childId: $childId
      analysisDays: $analysisDays
    ) {
      success
      message
      error
      insightLevel
      dataPointsAnalyzed
      childId
      analysisPeriodDays
      primaryPattern {
        patternType
        confidenceScore
        description
        peakHours
        lowHours
        averageIntervalMinutes
        consistencyScore
      }
      secondaryPatterns {
        patternType
        confidenceScore
        description
        peakHours
        lowHours
        averageIntervalMinutes
        consistencyScore
      }
      peakHours
      peakDaysOfWeek
      quietHours
      routineConsistencyScore
      intervalConsistencyScore
      patternDeviations
      unusualDays
      routineRecommendations
      optimizationSuggestions
    }
  }
`;

export const GET_INVENTORY_INSIGHTS_QUERY = gql`
  query GetInventoryInsights(
    $childId: String
    $includePredictions: Boolean = false
  ) {
    getInventoryInsights(
      childId: $childId
      includePredictions: $includePredictions
    ) {
      success
      message
      error
      insightLevel
      dataPointsAnalyzed
      insights {
        childId
        insightLevel
        currentItems {
          productType
          size
          brand
          currentStock
          dailyConsumptionRate
          daysRemaining
          predictedNextPurchase
          reorderRecommendation
          costPerDay
          efficiencyRating
        }
        consumptionTrends {
          date
          value
          count
          label
          changePercentage
        }
        efficiencyScores {
          productKey
          score
        }
        reorderAlerts
        upcomingPurchases {
          product
          predictedDate
          confidence
        }
        costOptimizationTips
        mlPredictions {
          predictionType
          confidenceLevel
          predictedValue
          predictedDate
          factors
          recommendation
          modelAccuracy
        }
        seasonalAdjustments
        bulkPurchaseRecommendations
      }
    }
  }
`;

export const GET_ANALYTICS_DASHBOARD_QUERY = gql`
  query GetAnalyticsDashboard(
    $childId: String
  ) {
    getAnalyticsDashboard(
      childId: $childId
    ) {
      success
      message
      error
      insightLevel
      dataPointsAnalyzed
      cacheHit
      dashboard {
        childId
        lastUpdated
        insightLevel
        todayChanges
        weekChanges
        monthChanges
        recentUsage {
          startDate
          endDate
          childId
          period
          insightLevel
          totalChanges
          totalQuantity
          dailyAverage
          wetOnlyCount
          soiledOnlyCount
          wetAndSoiledCount
          dryChangesCount
          averageIntervalMinutes
          usagePattern {
            patternType
            confidenceScore
            description
            peakHours
            lowHours
            averageIntervalMinutes
            consistencyScore
          }
          hourlyDistribution {
            hour
            count
            percentage
            isPeakHour
          }
          dailySummaries {
            date
            totalChanges
            wetOnly
            soiledOnly
            wetAndSoiled
            dryChanges
            totalQuantity
            averageIntervalMinutes
            efficiencyScore
            costEstimate
          }
          trendData {
            date
            value
            count
            label
            changePercentage
          }
        }
        topInsights
        recommendations
        alerts
        predictions {
          predictionType
          confidenceLevel
          predictedValue
          predictedDate
          factors
          recommendation
          modelAccuracy
        }
        healthInsights {
          insightType
          description
          recommendation
          urgencyLevel
          patternDetected
          confidenceScore
        }
      }
    }
  }
`;

// =============================================================================
// TYPESCRIPT TYPES
// =============================================================================

export interface UsageAnalyticsData {
  totalChanges: number;
  weeklyAverage: number;
  dailyAverage: number;
  peakHour: number;
  averageTimeBetweenChanges: number;
  currentStreak: number;
  longestStreak: number;
  weekdayCount: number; // Added to match backend
  weekendCount: number; // Added to match backend
  weekdayVsWeekend: {
    weekday: number;
    weekend: number;
  };
  hourlyDistribution: Array<{
    hour: number;
    count: number;
    percentage: number; // Added to match backend
    isPeakHour: boolean; // Added to match backend
  }>;
  qualityMetrics: {
    averageRating: number;
    improvementTrend: number;
  };
}

export interface WeeklyTrendsData {
  currentWeekChanges: number; // Added to match backend
  previousWeekChanges: number; // Added to match backend
  changePercentage: number; // Added to match backend
  trendDirection: string; // Added to match backend
  averageWeeklyChanges: number; // Added to match backend
  weeklyData: Array<{
    week: string;
    weekStart: string; // Added to match backend
    weekEnd: string; // Added to match backend
    totalChanges: number;
    dailyAverage: number; // Changed from averageRating to match backend
    averageRating: number;
    leakageCount: number;
    nightChanges: number;
    changeFromPrevious?: number; // Added to match backend
    patternType: string; // Added to match backend
  }>;
  trendAnalysis: {
    changesTrend: number;
    qualityTrend: number;
    efficiencyTrend: number;
  };
  predictions: {
    nextWeekChanges: number;
    confidence: number;
  };
}

export interface DailySummaryData {
  date: string;
  totalChanges: number;
  wetOnly: number; // Added to match backend
  soiledOnly: number; // Added to match backend
  wetAndSoiled: number; // Added to match backend
  dryChanges: number; // Added to match backend
  averageIntervalMinutes: number; // Added to match backend
  efficiencyScore: number; // Added to match backend
  recommendations: string[]; // Added to match backend
  summary: {
    totalChanges: number;
    wetOnly: number;
    soiledOnly: number;
    wetAndSoiled: number;
    dryChanges: number;
    efficiencyScore: number;
  };
  hourlyBreakdown: Array<{
    hour: number;
    changes: number;
    count: number; // Added to match backend
    percentage: number; // Added to match backend
    efficiency: number;
  }>;
  caregiverStats: Array<{
    caregiver: string;
    changes: number;
    averageTime: number;
  }>;
  insights: Array<{
    message: string;
    type: string;
    priority: number;
  }>;
}

export interface UsagePatternData {
  patternType: string;
  frequency: number;
  timeRange: {
    start: string;
    end: string;
  };
  confidence: number;
  recommendations: Array<{
    message: string;
    actionType: string;
    estimatedImpact: number;
  }>;
}

export interface InventoryInsightData {
  monthlySpend: number; // Added to match frontend usage
  costPerChange: number; // Added to match frontend usage
  currentItems: Array<{ // Added to match backend structure
    size: string;
    currentStock: number;
    daysRemaining: number;
    productType: string;
    brand?: string;
    dailyConsumptionRate: number;
    predictedNextPurchase?: string;
    reorderRecommendation?: string;
    costPerDay?: number;
    efficiencyRating?: string;
  }>;
  currentStock: Array<{
    size: string;
    quantity: number;
    daysRemaining: number;
  }>;
  consumptionTrends: Array<{ // Added to match backend structure
    date: string;
    value: number;
    count: number;
    label: string;
    changePercentage?: number;
  }>;
  consumptionRate: Array<{
    size: string;
    dailyAverage: number;
    weeklyAverage: number;
    trend: number;
  }>;
  reorderAlerts: string[]; // Added to match backend
  costOptimizationTips: string[]; // Added to match backend
  upcomingPurchases: Array<{ // Added to match backend
    product: string;
    predictedDate: string;
    confidence: number;
  }>;
  predictions: Array<{
    size: string;
    predictedRunOut: string;
    reorderRecommendation: string;
    confidence: number;
  }>;
  costAnalysis: {
    monthlySpend: number;
    costPerChange: number;
    savingOpportunities: Array<{
      type: string;
      estimatedSavings: number;
      description: string;
    }>;
  };
}

export interface AnalyticsOverviewData {
  todayChanges: number;
  weekChanges: number;
  monthChanges: number;
  currentStreak: number;
  averageEfficiency: number;
  topInsight: {
    message: string;
    type: string;
    priority: number;
    actionRequired: boolean;
  };
  quickStats: Array<{
    label: string;
    value: string;
    trend: number;
    trendDirection: 'up' | 'down' | 'stable';
  }>;
}

// Query Variables Types
export interface GetUsageAnalyticsVariables {
  childId: string;
  timeRange?: 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'LAST_3_MONTHS' | 'LAST_YEAR';
  includeComparison?: boolean;
}

export interface GetWeeklyTrendsVariables {
  childId: string;
  weeksBack?: number;
}

export interface GetDailySummaryVariables {
  childId: string;
  targetDate: string;
}

export interface GetUsagePatternsVariables {
  childId: string;
  analysisDays?: number;
}

export interface GetInventoryInsightsVariables {
  childId: string;
  includePredictions?: boolean;
}

export interface GetAnalyticsDashboardVariables {
  childId: string;
}

// Query Data Types - Updated to match backend response structure
export interface GetUsageAnalyticsQueryData {
  getUsageAnalytics: {
    success: boolean;
    message?: string;
    error?: string;
    insightLevel: string;
    dataPointsAnalyzed: number;
    cacheHit: boolean;
    analytics?: UsageAnalyticsData;
  };
}

export interface GetWeeklyTrendsQueryData {
  getWeeklyTrends: {
    success: boolean;
    message?: string;
    error?: string;
    insightLevel: string;
    dataPointsAnalyzed: number;
    trends?: WeeklyTrendsData;
  };
}

export interface GetDailySummaryQueryData {
  getDailySummary: {
    success: boolean;
    message?: string;
    error?: string;
    insightLevel: string;
    dataPointsAnalyzed: number;
    summary?: DailySummaryData;
  };
}

export interface GetUsagePatternsQueryData {
  getUsagePatterns: {
    success: boolean;
    message?: string;
    error?: string;
    insightLevel: string;
    dataPointsAnalyzed: number;
    patterns?: UsagePatternData[];
  };
}

export interface GetInventoryInsightsQueryData {
  getInventoryInsights: {
    success: boolean;
    message?: string;
    error?: string;
    insightLevel: string;
    dataPointsAnalyzed: number;
    insights?: InventoryInsightData;
  };
}

export interface GetAnalyticsDashboardQueryData {
  getAnalyticsDashboard: {
    success: boolean;
    message?: string;
    error?: string;
    insightLevel: string;
    dataPointsAnalyzed: number;
    cacheHit: boolean;
    dashboard?: {
      childId: string;
      lastUpdated: string;
      insightLevel: string;
      todayChanges: number;
      weekChanges: number;
      monthChanges: number;
      topInsights: string[];
      recommendations: string[];
      alerts: string[];
    };
  };
}