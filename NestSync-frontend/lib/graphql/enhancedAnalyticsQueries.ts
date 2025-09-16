/**
 * Enhanced Analytics GraphQL Queries for NestSync
 * Wireframe-compliant analytics system based on backend Enhanced Analytics Dashboard
 */

import { gql } from '@apollo/client';

// =============================================================================
// ENHANCED ANALYTICS DASHBOARD QUERY
// =============================================================================

export const GET_ENHANCED_ANALYTICS_DASHBOARD = gql`
  query GetEnhancedAnalyticsDashboard($childId: ID!, $dateRange: Int) {
    getEnhancedAnalyticsDashboard(childId: $childId, dateRange: $dateRange) {
      success
      message
      dashboard {
        weeklyPatterns {
          dailyCounts
          weeklyAverage
          consistencyPercentage
          daysOfWeek
          patternQuality
        }
        costAnalysis {
          monthlyCostCad
          efficiencyVsTarget
          budgetStatus
          savingsOpportunities
        }
        peakHoursDetailed {
          peakHours {
            timeRange
            percentage
            changeCount
            averageInterval
          }
          weekendPattern {
            percentageIncrease
            isNormalForAge
          }
        }
        sizePredictions {
          predictionDateRange
          confidenceScore
          nextSizeRecommendation
          growthPattern
          daysUntilChange
        }
        qualityInsights {
          routineConsistency
          careEfficiency
          improvementAreas
        }
      }
    }
  }
`;

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface PeakHour {
  timeRange: string;
  percentage: number;
  changeCount: number;
  averageInterval: number;
}

export interface WeekendPattern {
  percentageIncrease: number;
  isNormalForAge: boolean;
}

export interface WeeklyPatterns {
  dailyCounts: number[];
  weeklyAverage: number;
  consistencyPercentage: number;
  daysOfWeek: string[];
  patternQuality: string;
}

export interface CostAnalysis {
  monthlyCostCad: number;
  efficiencyVsTarget: number;
  budgetStatus: string;
  savingsOpportunities: string[];
}

export interface PeakHoursDetailed {
  peakHours: PeakHour[];
  weekendPattern: WeekendPattern;
}

export interface SizePredictions {
  predictionDateRange: string;
  confidenceScore: number;
  nextSizeRecommendation: string;
  growthPattern: string;
  daysUntilChange: number;
}

export interface QualityInsights {
  routineConsistency: number;
  careEfficiency: number;
  improvementAreas: string[];
}

export interface EnhancedAnalyticsDashboard {
  weeklyPatterns: WeeklyPatterns;
  costAnalysis: CostAnalysis;
  peakHoursDetailed: PeakHoursDetailed;
  sizePredictions: SizePredictions;
  qualityInsights: QualityInsights;
}

export interface GetEnhancedAnalyticsDashboardResponse {
  success: boolean;
  message?: string;
  dashboard?: EnhancedAnalyticsDashboard;
}

export interface GetEnhancedAnalyticsDashboardQueryData {
  getEnhancedAnalyticsDashboard: GetEnhancedAnalyticsDashboardResponse;
}

export interface GetEnhancedAnalyticsDashboardVariables {
  childId: string;
  dateRange?: number;
}