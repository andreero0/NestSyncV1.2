/**
 * Timeline Type Definitions
 * 
 * Comprehensive TypeScript types for the airline-style timeline feature,
 * supporting Canadian timezone compliance and NestSync data structures.
 */

// Core Timeline Event Types
export type TimelineEventType = 
  | 'DIAPER_CHANGE'
  | 'WIPE_USE'
  | 'CREAM_APPLICATION'
  | 'INVENTORY_UPDATE'
  | 'SIZE_CHANGE'
  | 'ACCIDENT_CLEANUP'
  | 'PREVENTIVE_CHANGE'
  | 'OVERNIGHT_CHANGE'
  | 'FEEDING'
  | 'GROWTH_MILESTONE';

export type TimelineEventStatus = 'COMPLETED' | 'PENDING' | 'CANCELLED' | 'IN_PROGRESS';

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  timestamp: Date;
  title: string;
  details?: string;
  status?: TimelineEventStatus;
  metadata?: Record<string, any>;
  child: {
    id: string;
    name: string;
  };
  // Extended properties for different event types
  diaperChange?: {
    previousSize?: string;
    newSize?: string;
    wasAccident?: boolean;
    location?: string;
  };
  inventoryUpdate?: {
    action: 'ADD' | 'REMOVE' | 'ADJUST';
    quantity: number;
    brand?: string;
    size?: string;
  };
  sizeChange?: {
    fromSize: string;
    toSize: string;
    reason?: string;
    confidence?: number;
  };
}

// Timeline Period Organization
export type TimePeriodType = 'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'LAST_WEEK' | 'EARLIER';

export interface TimePeriod {
  id: string;
  type: TimePeriodType;
  label: string;
  startDate: Date;
  endDate: Date;
  events: TimelineEvent[];
  startY: number; // Y position in timeline layout
  height: number; // Total height of period section
}

// Timeline Layout and Positioning
export interface TimelineLayout {
  totalHeight: number;
  periods: TimePeriod[];
  currentTimePosition: number;
  eventPositions: Map<string, { x: number; y: number; side: 'left' | 'right' }>;
}

export interface TimelinePosition {
  x: number;
  y: number;
  side: 'left' | 'right';
}

// Animation and Interaction Types
export interface TimelineAnimationConfig {
  scrollDuration: number;
  snapThreshold: number;
  decelerationRate: number;
  springDamping: number;
  springStiffness: number;
}

export interface TimelineScrollState {
  scrollY: number;
  isScrolling: boolean;
  targetY?: number;
  focusedEventId?: string;
}

// Time Range and Navigation
export interface TimelineRange {
  start: Date;
  end: Date;
  totalDays: number;
  currentPosition: number; // 0-1 representing position in range
}

export interface TimeMarker {
  id: string;
  time: Date;
  y: number;
  label: string;
  type: 'HOUR' | 'DAY' | 'WEEK';
}

// Data Fetching and State Management
export interface TimelineDataState {
  events: TimelineEvent[];
  periods: TimePeriod[];
  currentTime: Date;
  timeRange: TimelineRange;
  loading: boolean;
  error?: Error | null;
  lastUpdated?: Date;
}

export interface TimelineDataConfig {
  daysBack: number;
  refreshInterval: number;
  childId?: string;
  eventTypes?: TimelineEventType[];
  timezone: string; // Default: 'America/Toronto' for Canadian compliance
}

// GraphQL Integration Types
export interface TimelineEventsQueryVariables {
  startDate: string; // ISO 8601 format
  endDate: string;   // ISO 8601 format
  childId?: string;
  eventTypes?: TimelineEventType[];
  limit?: number;
  offset?: number;
}

export interface TimelineEventsQueryResponse {
  timelineEvents: {
    edges: Array<{
      node: TimelineEvent;
      cursor: string;
    }>;
    pageInfo: {
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      startCursor?: string;
      endCursor?: string;
      totalCount: number;
    };
  };
}

// Component Props Interfaces
export interface TimelineContainerProps {
  events: TimelineEvent[];
  currentTime: Date;
  timeRange: TimelineRange;
  onEventPress?: (event: TimelineEvent) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  className?: string;
  style?: any;
}

export interface TimelineAxisProps {
  timeRange: TimelineRange;
  currentTime: Date;
  scrollY: any; // SharedValue from react-native-reanimated
  isScrolling: any; // SharedValue from react-native-reanimated
  totalHeight: number;
  markers?: TimeMarker[];
}

export interface TimelineEventProps {
  event: TimelineEvent;
  position: TimelinePosition;
  onPress?: () => void;
  style?: any;
  animated?: boolean;
}

export interface TimePeriodHeaderProps {
  period: TimePeriod;
  style?: any;
  sticky?: boolean;
}

// Accessibility Types
export interface TimelineAccessibilityConfig {
  announceTimeChanges: boolean;
  announceEventFocus: boolean;
  reduceMotion: boolean;
  highContrast: boolean;
  screenReaderSupport: boolean;
}

export interface TimelineAccessibilityState {
  currentlyFocusedEvent?: string;
  currentTimeAnnouncement?: string;
  navigationInstructions: string;
  totalEventsAnnouncement: string;
}

// Event Color and Visual Mapping
export interface EventVisualConfig {
  color: string;
  accentColor: string;
  iconName: string;
  statusColor?: string;
  borderColor?: string;
}

export interface EventColorsMap {
  [K in TimelineEventType]: EventVisualConfig;
}

// Performance and Optimization Types
export interface VirtualScrollConfig {
  itemHeight: number;
  containerHeight: number;
  overscan: number;
  enableVirtualization: boolean;
}

export interface TimelinePerformanceMetrics {
  renderTime: number;
  scrollPerformance: number;
  eventCount: number;
  memoryUsage?: number;
  frameDrops?: number;
}

// Utility and Helper Types
export interface TimelineUtilities {
  formatTimeForDisplay: (date: Date, locale?: string) => string;
  calculateTimePosition: (time: Date, range: TimelineRange, totalHeight: number) => number;
  groupEventsByPeriod: (events: TimelineEvent[], currentTime: Date) => TimePeriod[];
  generateTimeMarkers: (range: TimelineRange, totalHeight: number) => TimeMarker[];
  findNearestEvent: (scrollY: number, events: TimelineEvent[]) => TimelineEvent | null;
}

// Error Types
export type TimelineError = 
  | 'NETWORK_ERROR'
  | 'DATA_FETCH_ERROR' 
  | 'INVALID_TIME_RANGE'
  | 'MISSING_CHILD_DATA'
  | 'ANIMATION_ERROR'
  | 'ACCESSIBILITY_ERROR';

export interface TimelineErrorState {
  type: TimelineError;
  message: string;
  timestamp: Date;
  recoverable: boolean;
  retryAction?: () => void;
}

// Canadian Compliance Types
export interface CanadianComplianceData {
  timezone: 'America/Toronto' | 'America/Vancouver' | 'America/Halifax' | 'America/Winnipeg';
  dataResidency: 'CANADA';
  privacyCompliance: 'PIPEDA';
  language: 'en-CA' | 'fr-CA';
}

// Export utility type for timeline configuration
export interface TimelineConfiguration 
  extends TimelineDataConfig, 
          TimelineAnimationConfig, 
          TimelineAccessibilityConfig,
          CanadianComplianceData {
  performance: VirtualScrollConfig;
  visualization: {
    theme: 'light' | 'dark' | 'system';
    eventColors: EventColorsMap;
    spacing: {
      eventGap: number;
      periodGap: number;
      axisWidth: number;
      cardWidth: number;
    };
  };
}