/**
 * Timeline Utility Functions
 * 
 * Helper functions for timeline calculations, formatting, and visual configuration
 * with Canadian timezone compliance and accessibility support.
 */

import { format, differenceInDays, differenceInHours, addHours, subHours } from 'date-fns';
import { zonedTimeToUtc, toZonedTime } from 'date-fns-tz';
// Import removed - JSX components should be handled in TSX files
import { Colors, NestSyncColors } from '@/constants/Colors';
import type {
  TimelineEvent,
  TimePeriod,
  TimelineRange,
  TimeMarker,
  EventVisualConfig,
  TimelineEventType,
  EventColorsMap,
  TimelinePosition,
} from '@/types/timeline';

// Canadian timezone for compliance
const CANADIAN_TIMEZONE = 'America/Toronto';

// Timeline layout constants
export const TIMELINE_CONSTANTS = {
  AXIS_WIDTH: 4,
  EVENT_CARD_WIDTH: 280,
  EVENT_CARD_HEIGHT: 88,
  PERIOD_HEADER_HEIGHT: 48,
  EVENT_SPACING: 16,
  CURRENT_TIME_INDICATOR_SIZE: 16,
  TIME_MARKER_INTERVAL_HOURS: 2,
  SCROLL_SNAP_THRESHOLD: 50,
  ANIMATION_DURATION: 600,
  PULSE_DURATION: 2000,
};

/**
 * Time Formatting Functions
 */

export function formatTimeForDisplay(date: Date, locale: string = 'en-CA'): string {
  const canadianTime = toZonedTime(date, CANADIAN_TIMEZONE);
  
  return format(canadianTime, 'h:mm a', { locale: undefined });
}

export function formatDateForDisplay(date: Date, locale: string = 'en-CA'): string {
  const canadianTime = toZonedTime(date, CANADIAN_TIMEZONE);
  
  return format(canadianTime, 'MMM d, yyyy', { locale: undefined });
}

export function formatTimeMarker(date: Date): string {
  const canadianTime = toZonedTime(date, CANADIAN_TIMEZONE);
  
  return format(canadianTime, 'h a', { locale: undefined });
}

/**
 * Timeline Position Calculations
 */

export function calculateTimePosition(
  time: Date, 
  timeRange: TimelineRange, 
  totalHeight: number
): number {
  const timeMs = time.getTime();
  const startMs = timeRange.start.getTime();
  const endMs = timeRange.end.getTime();
  
  // Calculate relative position (0-1)
  const relativePosition = (timeMs - startMs) / (endMs - startMs);
  
  // Convert to pixel position
  return Math.max(0, Math.min(totalHeight, relativePosition * totalHeight));
}

export function calculateEventPosition(
  event: TimelineEvent,
  index: number,
  periodStartY: number
): TimelinePosition {
  const side = index % 2 === 0 ? 'left' : 'right';
  const y = periodStartY + TIMELINE_CONSTANTS.PERIOD_HEADER_HEIGHT + 
            (index * (TIMELINE_CONSTANTS.EVENT_CARD_HEIGHT + TIMELINE_CONSTANTS.EVENT_SPACING));
  
  return {
    x: side === 'left' ? 20 : 20, // Will be positioned via style
    y,
    side,
  };
}

export function findNearestEventPosition(
  scrollY: number, 
  layout: { periods: TimePeriod[] }
): number {
  let nearestY = scrollY;
  let minDistance = Infinity;
  
  layout.periods.forEach(period => {
    period.events.forEach((event, index) => {
      const eventY = period.startY + TIMELINE_CONSTANTS.PERIOD_HEADER_HEIGHT + 
                    (index * (TIMELINE_CONSTANTS.EVENT_CARD_HEIGHT + TIMELINE_CONSTANTS.EVENT_SPACING));
      
      const distance = Math.abs(scrollY - eventY);
      if (distance < minDistance) {
        minDistance = distance;
        nearestY = eventY;
      }
    });
  });
  
  return nearestY;
}

/**
 * Timeline Layout Calculations
 */

export function calculateTimelineLayout(
  events: TimelineEvent[], 
  timeRange: TimelineRange
): { totalHeight: number; periods: TimePeriod[]; currentTimePosition: number } {
  // Group events by period (this will be handled by useTimelineData)
  const periods: TimePeriod[] = []; // Placeholder - actual grouping done in hook
  
  let totalHeight = 0;
  periods.forEach(period => {
    totalHeight += period.height + TIMELINE_CONSTANTS.EVENT_SPACING;
  });
  
  // Add padding
  totalHeight += 200; // Top and bottom padding
  
  const currentTimePosition = calculateTimePosition(
    new Date(), 
    timeRange, 
    totalHeight
  );
  
  return {
    totalHeight,
    periods,
    currentTimePosition,
  };
}

/**
 * Time Marker Generation
 */

export function generateTimeMarkers(
  timeRange: TimelineRange, 
  totalHeight: number
): TimeMarker[] {
  const markers: TimeMarker[] = [];
  const { start, end } = timeRange;
  
  // Generate markers every 2 hours
  let currentTime = new Date(start);
  
  while (currentTime <= end) {
    const y = calculateTimePosition(currentTime, timeRange, totalHeight);
    
    markers.push({
      id: `marker-${currentTime.getTime()}`,
      time: new Date(currentTime),
      y,
      label: formatTimeMarker(currentTime),
      type: 'HOUR',
    });
    
    currentTime = addHours(currentTime, TIMELINE_CONSTANTS.TIME_MARKER_INTERVAL_HOURS);
  }
  
  return markers;
}

/**
 * Event Visual Configuration
 */

export function getEventColors(type: TimelineEventType, colors: any): EventVisualConfig {
  const eventColorsMap: EventColorsMap = {
    DIAPER_CHANGE: {
      color: colors.success || NestSyncColors.secondary.green,
      accentColor: colors.success || NestSyncColors.secondary.green,
      iconName: 'checkmark.circle.fill',
      statusColor: NestSyncColors.secondary.greenLight,
      borderColor: colors.success || NestSyncColors.secondary.green,
    },
    WIPE_USE: {
      color: colors.info || NestSyncColors.primary.blue,
      accentColor: colors.info || NestSyncColors.primary.blue,
      iconName: 'sparkles',
      statusColor: NestSyncColors.primary.blueLight,
      borderColor: colors.info || NestSyncColors.primary.blue,
    },
    CREAM_APPLICATION: {
      color: colors.accent || NestSyncColors.accent.purple,
      accentColor: colors.accent || NestSyncColors.accent.purple,
      iconName: 'heart.circle.fill',
      statusColor: '#F3E8FF',
      borderColor: colors.accent || NestSyncColors.accent.purple,
    },
    INVENTORY_UPDATE: {
      color: colors.info || NestSyncColors.primary.blue,
      accentColor: colors.info || NestSyncColors.primary.blue,
      iconName: 'cube.box.fill',
      statusColor: NestSyncColors.primary.blueLight,
      borderColor: colors.info || NestSyncColors.primary.blue,
    },
    SIZE_CHANGE: {
      color: colors.warning || NestSyncColors.accent.orange,
      accentColor: colors.warning || NestSyncColors.accent.orange,
      iconName: 'arrow.up.circle.fill',
      statusColor: '#FEF3C7',
      borderColor: colors.warning || NestSyncColors.accent.orange,
    },
    ACCIDENT_CLEANUP: {
      color: colors.warning || NestSyncColors.accent.amber,
      accentColor: colors.warning || NestSyncColors.accent.amber,
      iconName: 'exclamationmark.triangle.fill',
      statusColor: '#FEF3C7',
      borderColor: colors.warning || NestSyncColors.accent.amber,
    },
    PREVENTIVE_CHANGE: {
      color: colors.success || NestSyncColors.secondary.green,
      accentColor: colors.success || NestSyncColors.secondary.green,
      iconName: 'shield.checkered',
      statusColor: NestSyncColors.secondary.greenLight,
      borderColor: colors.success || NestSyncColors.secondary.green,
    },
    OVERNIGHT_CHANGE: {
      color: colors.textSecondary || NestSyncColors.neutral[600],
      accentColor: colors.textSecondary || NestSyncColors.neutral[600],
      iconName: 'moon.fill',
      statusColor: NestSyncColors.neutral[100],
      borderColor: colors.textSecondary || NestSyncColors.neutral[600],
    },
    FEEDING: {
      color: colors.accent || NestSyncColors.accent.orange,
      accentColor: colors.accent || NestSyncColors.accent.orange,
      iconName: 'drop.fill',
      statusColor: '#FEF3C7',
      borderColor: colors.accent || NestSyncColors.accent.orange,
    },
    GROWTH_MILESTONE: {
      color: colors.premium || NestSyncColors.accent.purple,
      accentColor: colors.premium || NestSyncColors.accent.purple,
      iconName: 'star.fill',
      statusColor: '#F3E8FF',
      borderColor: colors.premium || NestSyncColors.accent.purple,
    },
  };
  
  return eventColorsMap[type] || eventColorsMap.DIAPER_CHANGE;
}

export function getEventIcon(type: TimelineEventType) {
  const eventConfig = getEventColors(type, {});
  return {
    iconName: eventConfig.iconName,
    defaultSize: 16,
    defaultColor: '#fff'
  };
}

/**
 * Data Transformation Utilities
 */

export function transformGraphQLEvent(graphqlEvent: any): TimelineEvent {
  // This will be implemented based on the actual GraphQL schema
  return {
    id: graphqlEvent.id,
    type: graphqlEvent.type || 'DIAPER_CHANGE',
    timestamp: new Date(graphqlEvent.timestamp),
    title: graphqlEvent.title || 'Activity',
    details: graphqlEvent.details,
    status: graphqlEvent.status || 'COMPLETED',
    metadata: graphqlEvent.metadata || {},
    child: {
      id: graphqlEvent.child?.id || '',
      name: graphqlEvent.child?.name || 'Child',
    },
  };
}

export function groupEventsByPeriod(
  events: TimelineEvent[], 
  currentTime: Date
): TimePeriod[] {
  // This is implemented in useTimelineData hook
  // Placeholder implementation
  return [];
}

/**
 * Animation and Physics Utilities
 */

export function calculateDecelerationTarget(
  velocity: number, 
  deceleration: number = 0.998
): number {
  // Calculate where the scroll will naturally stop based on velocity and deceleration
  return velocity * deceleration / (1 - deceleration);
}

export function calculateSpringTarget(
  currentPosition: number, 
  targetPosition: number, 
  threshold: number = TIMELINE_CONSTANTS.SCROLL_SNAP_THRESHOLD
): number {
  const distance = Math.abs(currentPosition - targetPosition);
  
  if (distance <= threshold) {
    return targetPosition;
  }
  
  return currentPosition;
}

/**
 * Accessibility Utilities
 */

export function generateAccessibilityLabel(event: TimelineEvent): string {
  const time = formatTimeForDisplay(event.timestamp);
  return `${event.title} at ${time}: ${event.details || 'Activity completed'}`;
}

export function generateTimelineNavigationInstructions(
  totalEvents: number, 
  currentPeriod?: string
): string {
  const instructions = [
    `Timeline with ${totalEvents} activities.`,
    'Swipe up and down to navigate through time.',
    'Double tap any event for more details.',
    'Current time indicator shows the present moment.',
  ];
  
  if (currentPeriod) {
    instructions.unshift(`Currently viewing: ${currentPeriod}.`);
  }
  
  return instructions.join(' ');
}

/**
 * Performance Utilities
 */

export function shouldUseVirtualization(eventCount: number): boolean {
  return eventCount > 100; // Use virtual scrolling for large datasets
}

export function calculateOptimalItemHeight(screenHeight: number): number {
  // Calculate optimal item height based on screen size
  return Math.max(
    TIMELINE_CONSTANTS.EVENT_CARD_HEIGHT,
    Math.floor(screenHeight / 8) // Show ~8 events per screen
  );
}

/**
 * Canadian Compliance Utilities
 */

export function ensureCanadianTimezone(date: Date): Date {
  return toZonedTime(date, CANADIAN_TIMEZONE);
}

export function formatCanadianDateTime(date: Date): string {
  const canadianTime = ensureCanadianTimezone(date);
  return format(canadianTime, 'yyyy-MM-dd HH:mm:ss zzz');
}

/**
 * Error Handling Utilities
 */

export function handleTimelineError(error: any): {
  message: string;
  recoverable: boolean;
  retryAction?: () => void;
} {
  if (error.networkError) {
    return {
      message: 'Unable to load timeline. Please check your connection.',
      recoverable: true,
      retryAction: () => window.location.reload(),
    };
  }
  
  if (error.graphQLErrors?.length > 0) {
    return {
      message: 'Timeline data is temporarily unavailable.',
      recoverable: true,
    };
  }
  
  return {
    message: 'An unexpected error occurred.',
    recoverable: false,
  };
}