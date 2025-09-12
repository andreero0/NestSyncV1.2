/**
 * Timeline Components Index
 * 
 * Centralized exports for the redesigned compact timeline components.
 * Replaces 280×88px cards with 48px list items optimized for stressed parents.
 */

// New compact timeline components
export { TimelineItem } from './TimelineItem';
export { ActivityTimeline } from './ActivityTimeline';
export { TimelinePeriodHeader } from './TimelinePeriodHeader';

// Legacy components (for backward compatibility if needed)
export { TimelineAxis } from './TimelineAxis';

// Re-export types for convenience
export type {
  TimelineEvent as TimelineEventType,
  TimePeriod,
  TimelineRange,
  TimelineAxisProps,
} from '@/types/timeline';