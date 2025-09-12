/**
 * Activity Color System Hook
 * 
 * Hook implementing the UX-designed activity color system for timeline items.
 * Based on design specifications for baby tracking activities with WCAG AA
 * accessibility compliance and night mode optimization.
 */

import { useColorScheme } from '@/hooks/useColorScheme';
import type { TimelineEventType } from '@/types/timeline';

// Activity color definitions from design specifications
export const activityColors = {
  DIAPER_CHANGE: {
    light: '#3B82F6',
    dark: '#60A5FA',
    background: {
      light: '#EFF6FF',
      dark: '#1E3A8A20'
    }
  },
  WIPE_USE: {
    light: '#06B6D4',
    dark: '#22D3EE',
    background: {
      light: '#ECFEFF',
      dark: '#164E6320'
    }
  },
  CREAM_APPLICATION: {
    light: '#8B5CF6',
    dark: '#A78BFA',
    background: {
      light: '#F5F3FF',
      dark: '#4C1D9520'
    }
  },
  FEEDING: {
    light: '#10B981',
    dark: '#34D399',
    background: {
      light: '#ECFDF5',
      dark: '#064E3B20'
    }
  },
  SLEEP: {
    light: '#6366F1',
    dark: '#818CF8',
    background: {
      light: '#EEF2FF',
      dark: '#312E8120'
    }
  },
  PLAY: {
    light: '#F59E0B',
    dark: '#FCD34D',
    background: {
      light: '#FFFBEB',
      dark: '#92400E20'
    }
  },
  MEDICAL: {
    light: '#EF4444',
    dark: '#F87171',
    background: {
      light: '#FEF2F2',
      dark: '#7F1D1D20'
    }
  },
  NOTE: {
    light: '#6B7280',
    dark: '#9CA3AF',
    background: {
      light: '#F9FAFB',
      dark: '#37415120'
    }
  },
  // Map timeline event types to color categories
  ACCIDENT_CLEANUP: {
    light: '#EF4444',
    dark: '#F87171',
    background: {
      light: '#FEF2F2',
      dark: '#7F1D1D20'
    }
  },
  PREVENTIVE_CHANGE: {
    light: '#3B82F6',
    dark: '#60A5FA',
    background: {
      light: '#EFF6FF',
      dark: '#1E3A8A20'
    }
  },
  OVERNIGHT_CHANGE: {
    light: '#6366F1',
    dark: '#818CF8',
    background: {
      light: '#EEF2FF',
      dark: '#312E8120'
    }
  },
  INVENTORY_UPDATE: {
    light: '#6B7280',
    dark: '#9CA3AF',
    background: {
      light: '#F9FAFB',
      dark: '#37415120'
    }
  },
  SIZE_CHANGE: {
    light: '#F59E0B',
    dark: '#FCD34D',
    background: {
      light: '#FFFBEB',
      dark: '#92400E20'
    }
  },
  GROWTH_MILESTONE: {
    light: '#10B981',
    dark: '#34D399',
    background: {
      light: '#ECFDF5',
      dark: '#064E3B20'
    }
  }
} as const;

// Icon mapping for each activity type
export const activityIcons = {
  DIAPER_CHANGE: 'gear.circle.fill',
  WIPE_USE: 'water.waves',
  CREAM_APPLICATION: 'drop.circle.fill',
  FEEDING: 'heart.circle.fill',
  SLEEP: 'moon.circle.fill',
  PLAY: 'gamecontroller.fill',
  MEDICAL: 'cross.circle.fill',
  NOTE: 'note.text',
  ACCIDENT_CLEANUP: 'exclamationmark.circle.fill',
  PREVENTIVE_CHANGE: 'checkmark.circle.fill',
  OVERNIGHT_CHANGE: 'moon.circle.fill',
  INVENTORY_UPDATE: 'cube.box.fill',
  SIZE_CHANGE: 'arrow.up.circle.fill',
  GROWTH_MILESTONE: 'star.circle.fill'
} as const;

// Activity display names
export const activityDisplayNames = {
  DIAPER_CHANGE: 'Diaper Changed',
  WIPE_USE: 'Wipes Used',
  CREAM_APPLICATION: 'Cream Applied',
  FEEDING: 'Feeding',
  SLEEP: 'Sleep Time',
  PLAY: 'Play Time',
  MEDICAL: 'Medical Care',
  NOTE: 'Note',
  ACCIDENT_CLEANUP: 'Accident Cleanup',
  PREVENTIVE_CHANGE: 'Preventive Change',
  OVERNIGHT_CHANGE: 'Overnight Change',
  INVENTORY_UPDATE: 'Inventory Update',
  SIZE_CHANGE: 'Size Change',
  GROWTH_MILESTONE: 'Growth Milestone'
} as const;

export interface ActivityColorConfig {
  primary: string;
  background: string;
  icon: string;
  displayName: string;
}

/**
 * Hook to get color configuration for an activity type
 * Returns theme-appropriate colors and metadata for timeline items
 */
export function useActivityColors(activityType: TimelineEventType): ActivityColorConfig {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Get color configuration for the activity type
  const colors = activityColors[activityType] || activityColors.NOTE;
  
  return {
    primary: isDark ? colors.dark : colors.light,
    background: isDark ? colors.background.dark : colors.background.light,
    icon: activityIcons[activityType] || activityIcons.NOTE,
    displayName: activityDisplayNames[activityType] || 'Activity'
  };
}

/**
 * Hook to get all activity colors for theme switching
 * Useful for components that need to render multiple activity types
 */
export function useAllActivityColors() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const colorMap: Record<TimelineEventType, ActivityColorConfig> = {} as any;
  
  Object.keys(activityColors).forEach((activityType) => {
    const type = activityType as TimelineEventType;
    const colors = activityColors[type];
    
    colorMap[type] = {
      primary: isDark ? colors.dark : colors.light,
      background: isDark ? colors.background.dark : colors.background.light,
      icon: activityIcons[type] || activityIcons.NOTE,
      displayName: activityDisplayNames[type] || 'Activity'
    };
  });
  
  return colorMap;
}

/**
 * Utility function to check if an activity type has valid colors
 */
export function hasActivityColors(activityType: string): activityType is TimelineEventType {
  return activityType in activityColors;
}

/**
 * Get contrasting text color for an activity background
 * Ensures WCAG AA compliance for text readability
 */
export function getContrastingTextColor(activityType: TimelineEventType, colorScheme: 'light' | 'dark'): string {
  // For activity backgrounds, always use high contrast text
  return colorScheme === 'dark' ? '#FFFFFF' : '#000000';
}