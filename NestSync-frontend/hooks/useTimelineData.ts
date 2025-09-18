/**
 * Timeline Data Management Hook
 * 
 * Comprehensive hook for managing timeline data, including GraphQL integration,
 * real-time updates, and Canadian timezone compliance.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@apollo/client';
import { subDays, startOfDay, endOfDay, format, isToday, isYesterday, startOfWeek, endOfWeek } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';

import { GET_USAGE_LOGS_QUERY } from '@/lib/graphql/queries';
import type {
  TimelineEvent,
  TimePeriod,
  TimelineRange,
  TimelineDataState,
  TimelineDataConfig,
  TimelineEventType,
  TimePeriodType,
} from '@/types/timeline';

// Canadian timezone for PIPEDA compliance
const CANADIAN_TIMEZONE = 'America/Toronto';

interface UseTimelineDataProps extends Partial<TimelineDataConfig> {
  daysBack?: number;
  refreshInterval?: number;
  childId?: string;
  eventTypes?: TimelineEventType[];
}

interface UseTimelineDataReturn extends TimelineDataState {
  refetch: () => void;
  loadMore: () => void;
  hasMore: boolean;
  scrollToTime: (time: Date) => void;
  scrollToEvent: (eventId: string) => void;
}

export function useTimelineData({
  daysBack = 30,
  refreshInterval = 60000, // 1 minute
  childId,
  eventTypes,
}: UseTimelineDataProps = {}): UseTimelineDataReturn {
  // Current time in Canadian timezone
  const [currentTime, setCurrentTime] = useState(() => 
    toZonedTime(new Date(), CANADIAN_TIMEZONE)
  );
  
  // Pagination state
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  // Calculate time range in Canadian timezone
  const timeRange = useMemo((): TimelineRange => {
    const now = toZonedTime(new Date(), CANADIAN_TIMEZONE);
    const start = startOfDay(subDays(now, daysBack));
    const end = endOfDay(now);
    
    return {
      start,
      end,
      totalDays: daysBack,
      currentPosition: 0.1, // Position current time 10% from top
    };
  }, [currentTime, daysBack]);

  // GraphQL query for timeline events
  const { data, loading, error, refetch: refetchQuery, fetchMore } = useQuery(GET_USAGE_LOGS_QUERY, {
    variables: {
      childId: childId || '', // Will be handled by the resolver if empty
      daysBack,
      limit: 50,
      offset: 0,
      ...(eventTypes && { usageType: eventTypes[0] }), // Map to existing usage type
    },
    pollInterval: refreshInterval,
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
    notifyOnNetworkStatusChange: true,
  });

  // Update current time periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(toZonedTime(new Date(), CANADIAN_TIMEZONE));
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Transform GraphQL data to timeline events
  const transformUsageLogToTimelineEvent = useCallback((usageLog: any): TimelineEvent => {
    // Use loggedAt instead of timestamp (from USAGE_LOG_FRAGMENT)
    const timestamp = new Date(usageLog.loggedAt);
    
    // Map usage types to timeline event types
    const eventTypeMap: Record<string, TimelineEventType> = {
      'DIAPER_CHANGE': 'DIAPER_CHANGE',
      'WIPE_USE': 'WIPE_USE',
      'CREAM_APPLICATION': 'CREAM_APPLICATION',
      'ACCIDENT_CLEANUP': 'ACCIDENT_CLEANUP',
      'PREVENTIVE_CHANGE': 'PREVENTIVE_CHANGE',
      'OVERNIGHT_CHANGE': 'OVERNIGHT_CHANGE',
    };

    const eventType = eventTypeMap[usageLog.usageType] || 'DIAPER_CHANGE';

    return {
      id: usageLog.id,
      type: eventType,
      timestamp: toZonedTime(timestamp, CANADIAN_TIMEZONE),
      title: generateEventTitle(eventType, usageLog),
      details: generateEventDetails(usageLog),
      status: 'COMPLETED',
      metadata: {
        context: usageLog.context,
        notes: usageLog.notes,
        quantityUsed: usageLog.quantityUsed,
        caregiverName: usageLog.caregiverName,
        wasWet: usageLog.wasWet,
        wasSoiled: usageLog.wasSoiled,
        hadLeakage: usageLog.hadLeakage,
      },
      child: {
        id: usageLog.childId || '',
        name: usageLog.caregiverName || 'Child',
      },
      // Map specific usage log data to timeline event properties
      diaperChange: eventType === 'DIAPER_CHANGE' ? {
        wasAccident: usageLog.notes?.toLowerCase().includes('accident') || usageLog.hadLeakage,
        location: usageLog.context,
      } : undefined,
    };
  }, []);

  // Generate user-friendly event titles with caregiver attribution
  const generateEventTitle = (type: TimelineEventType, usageLog: any): string => {
    const caregiverName = usageLog.caregiverName;
    const baseName = caregiverName || 'Someone';

    switch (type) {
      case 'DIAPER_CHANGE':
        return `${baseName} changed diaper`;
      case 'WIPE_USE':
        return `${baseName} used wipes`;
      case 'CREAM_APPLICATION':
        return `${baseName} applied cream`;
      case 'ACCIDENT_CLEANUP':
        return `${baseName} cleaned up accident`;
      case 'PREVENTIVE_CHANGE':
        return `${baseName} did preventive change`;
      case 'OVERNIGHT_CHANGE':
        return `${baseName} did overnight change`;
      default:
        return `${baseName} logged activity`;
    }
  };

  // Generate event details
  const generateEventDetails = (usageLog: any): string => {
    const details = [];
    
    if (usageLog.quantityUsed) {
      details.push(`Qty: ${usageLog.quantityUsed}`);
    }
    
    if (usageLog.context) {
      details.push(`${usageLog.context}`);
    }

    if (usageLog.caregiverName) {
      details.push(`by ${usageLog.caregiverName}`);
    }

    // Add diaper condition details for diaper changes
    if (usageLog.usageType === 'DIAPER_CHANGE') {
      const conditions = [];
      if (usageLog.wasWet) conditions.push('wet');
      if (usageLog.wasSoiled) conditions.push('soiled');
      if (usageLog.hadLeakage) conditions.push('leaked');
      
      if (conditions.length > 0) {
        details.push(`(${conditions.join(', ')})`);
      }
    }
    
    return details.join(' • ') || 'Activity completed';
  };

  // Process events into timeline format
  const events = useMemo((): TimelineEvent[] => {
    if (!data?.getUsageLogs?.edges) return [];
    
    return data.getUsageLogs.edges
      .map(edge => transformUsageLogToTimelineEvent(edge.node))
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()); // Newest first
  }, [data, transformUsageLogToTimelineEvent]);

  // Group events into time periods
  const groupEventsByPeriod = useCallback((events: TimelineEvent[], currentTime: Date): TimePeriod[] => {
    const periods: TimePeriod[] = [];
    let currentY = 0;
    
    // Group events by time periods
    const eventGroups: Record<TimePeriodType, TimelineEvent[]> = {
      TODAY: [],
      YESTERDAY: [],
      THIS_WEEK: [],
      LAST_WEEK: [],
      EARLIER: [],
    };

    events.forEach(event => {
      const eventDate = event.timestamp;
      
      if (isToday(eventDate)) {
        eventGroups.TODAY.push(event);
      } else if (isYesterday(eventDate)) {
        eventGroups.YESTERDAY.push(event);
      } else if (
        eventDate >= startOfWeek(currentTime) && 
        eventDate <= endOfWeek(currentTime)
      ) {
        eventGroups.THIS_WEEK.push(event);
      } else if (
        eventDate >= startOfWeek(subDays(currentTime, 7)) && 
        eventDate <= endOfWeek(subDays(currentTime, 7))
      ) {
        eventGroups.LAST_WEEK.push(event);
      } else {
        eventGroups.EARLIER.push(event);
      }
    });

    // Create period objects
    const periodTypes: Array<{ type: TimePeriodType; label: string }> = [
      { type: 'TODAY', label: 'Today' },
      { type: 'YESTERDAY', label: 'Yesterday' },
      { type: 'THIS_WEEK', label: 'This Week' },
      { type: 'LAST_WEEK', label: 'Last Week' },
      { type: 'EARLIER', label: 'Earlier' },
    ];

    periodTypes.forEach(({ type, label }) => {
      const periodEvents = eventGroups[type];
      if (periodEvents.length > 0) {
        const period: TimePeriod = {
          id: `period-${type}`,
          type,
          label,
          startDate: new Date(Math.min(...periodEvents.map(e => e.timestamp.getTime()))),
          endDate: new Date(Math.max(...periodEvents.map(e => e.timestamp.getTime()))),
          events: periodEvents,
          startY: currentY,
          height: 48 + (periodEvents.length * 100), // Header + events
        };
        
        periods.push(period);
        currentY += period.height + 16; // Add spacing between periods
      }
    });

    return periods;
  }, []);

  const periods = useMemo(() => {
    return groupEventsByPeriod(events, currentTime);
  }, [events, currentTime, groupEventsByPeriod]);

  // Refetch function
  const refetch = useCallback(() => {
    setOffset(0);
    refetchQuery();
  }, [refetchQuery]);

  // Load more function for pagination
  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      fetchMore({
        variables: {
          offset: offset + 50,
          limit: 50,
        },
      }).then(result => {
        const newEdges = result.data?.getUsageLogs?.edges || [];
        if (newEdges.length < 50) {
          setHasMore(false);
        }
        setOffset(prev => prev + 50);
      });
    }
  }, [hasMore, loading, offset, fetchMore]);

  // Navigation functions
  const scrollToTime = useCallback((time: Date) => {
    // This will be implemented in the TimelineContainer component
    console.log('Scroll to time:', time);
  }, []);

  const scrollToEvent = useCallback((eventId: string) => {
    // This will be implemented in the TimelineContainer component
    console.log('Scroll to event:', eventId);
  }, []);

  return {
    events,
    periods,
    currentTime,
    timeRange,
    loading,
    error,
    lastUpdated: new Date(),
    refetch,
    loadMore,
    hasMore,
    scrollToTime,
    scrollToEvent,
  };
}