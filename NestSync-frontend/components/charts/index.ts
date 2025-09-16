/**
 * Charts Components Barrel Export
 * Centralized export for all analytics chart components
 *
 * Parent-Friendly Components (recommended for stressed parents):
 * - ParentFriendlyProgressCard: Supportive progress indicators
 * - SimpleUsageIndicator: Calming usage patterns (replaces complex bar charts)
 * - ConsistencyCircle: Encouraging routine feedback (replaces pie charts)
 *
 * Legacy Components (complex, for technical users):
 * - AnalyticsBarChart, AnalyticsLineChart, AnalyticsPieChart
 */

// Parent-friendly components (RECOMMENDED)
export { ParentFriendlyProgressCard } from './ParentFriendlyProgressCard';
export { SimpleUsageIndicator } from './SimpleUsageIndicator';
export { ConsistencyCircle } from './ConsistencyCircle';

// Legacy complex components (for technical analysis)
export { default as AnalyticsBarChart } from './AnalyticsBarChart';
export { default as AnalyticsLineChart } from './AnalyticsLineChart';
export { default as AnalyticsPieChart } from './AnalyticsPieChart';
export { default as AnalyticsProgressCard } from './AnalyticsProgressCard';

// Re-export types for convenience
export type {
  // Add chart component prop types here if needed
} from './AnalyticsBarChart';