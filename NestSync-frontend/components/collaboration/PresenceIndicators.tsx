/**
 * Presence Indicators Component
 * Shows real-time presence of active caregivers on the dashboard
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useActiveCaregivers } from '@/stores/collaborationStore';
import { CaregiverPresence } from '@/lib/graphql/queries';

interface PresenceIndicatorsProps {
  childId?: string;
  compact?: boolean;
  showDetails?: boolean;
}

export default function PresenceIndicators({
  childId,
  compact = false,
  showDetails = true
}: PresenceIndicatorsProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const { caregivers, isLoading, lastUpdate } = useActiveCaregivers();
  const [pulseAnimation] = useState(new Animated.Value(1));

  // Memoize filtered caregivers to prevent infinite re-renders
  const relevantCaregivers = useMemo(() => {
    return childId
      ? caregivers.filter(c => !c.childId || c.childId === childId)
      : caregivers;
  }, [caregivers, childId]);

  // Memoize active caregivers (currently caring or online)
  const activeCaregivers = useMemo(() => {
    return relevantCaregivers.filter(
      c => c.status === 'CARING' || c.status === 'ONLINE'
    );
  }, [relevantCaregivers]);

  // Memoize caring caregivers (actively caring for the child)
  const caringCaregivers = useMemo(() => {
    return relevantCaregivers.filter(
      c => c.status === 'CARING'
    );
  }, [relevantCaregivers]);

  // Memoize caregiver names
  const caregiverNames = useMemo(() => {
    return activeCaregivers
      .map(p => p.userDisplayName || 'Unknown Caregiver')
      .filter(Boolean);
  }, [activeCaregivers]);

  // Pulse animation for active status
  useEffect(() => {
    if (activeCaregivers.length > 0) {
      const pulseAnimationLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 0.6,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimationLoop.start();

      return () => pulseAnimationLoop.stop();
    }
  }, [activeCaregivers.length, pulseAnimation]);

  const getPresenceIcon = (status: string) => {
    switch (status) {
      case 'CARING': return 'heart.fill';
      case 'ONLINE': return 'circle.fill';
      case 'AWAY': return 'pause.circle.fill';
      case 'OFFLINE': return 'circle';
      default: return 'circle';
    }
  };

  const getPresenceColor = (status: string) => {
    switch (status) {
      case 'CARING': return '#EF4444'; // Red for actively caring
      case 'ONLINE': return '#10B981'; // Green for online
      case 'AWAY': return '#F59E0B'; // Amber for away
      case 'OFFLINE': return colors.textSecondary; // Gray for offline
      default: return colors.textSecondary;
    }
  };

  const getPresenceLabel = (caregiver: CaregiverPresence) => {
    const name = caregiver.userDisplayName || 'Caregiver';

    switch (caregiver.status) {
      case 'CARING':
        return `${name} is caring for ${childId ? 'your child' : 'a child'}`;
      case 'ONLINE':
        return `${name} is available`;
      case 'AWAY':
        return `${name} is away`;
      case 'OFFLINE':
        return `${name} is offline`;
      default:
        return name;
    }
  };

  const formatLastSeen = (lastSeen: string) => {
    const date = new Date(lastSeen);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  // Don't show if no caregivers or only offline ones
  if (activeCaregivers.length === 0 && !isLoading) {
    return null;
  }

  if (compact) {
    // Compact view for dashboard header
    return (
      <View style={[styles.compactContainer, { backgroundColor: colors.surface }]}>
        <View style={styles.compactIndicators}>
          {activeCaregivers.slice(0, 3).map((caregiver, index) => (
            <Animated.View
              key={caregiver.userId}
              style={[
                styles.compactDot,
                {
                  backgroundColor: getPresenceColor(caregiver.status),
                  opacity: caregiver.status === 'CARING' ? pulseAnimation : 1,
                },
                index > 0 && { marginLeft: -4 }, // Overlap dots
              ]}
            />
          ))}
          {activeCaregivers.length > 3 && (
            <View style={[styles.compactDot, { backgroundColor: colors.textSecondary }]}>
              <Text style={[styles.compactMoreText, { color: colors.background }]}>
                +{activeCaregivers.length - 3}
              </Text>
            </View>
          )}
        </View>

        <ThemedText style={[styles.compactText, { color: colors.textSecondary }]}>
          {activeCaregivers.length} active
        </ThemedText>
      </View>
    );
  }

  // Full view for dashboard body
  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <IconSymbol name="person.3.fill" size={18} color={colors.tint} />
          <ThemedText type="defaultSemiBold" style={styles.headerTitle}>
            Active Caregivers
          </ThemedText>
        </View>

        {lastUpdate > 0 && (
          <ThemedText style={[styles.lastUpdate, { color: colors.textSecondary }]}>
            Updated {formatLastSeen(new Date(lastUpdate).toISOString())}
          </ThemedText>
        )}
      </View>

      {/* Caregiver List */}
      <View style={styles.caregiverList}>
        {activeCaregivers.map((caregiver) => (
          <View key={caregiver.userId} style={styles.caregiverItem}>
            <View style={styles.caregiverInfo}>
              <Animated.View
                style={[
                  styles.presenceIcon,
                  {
                    backgroundColor: `${getPresenceColor(caregiver.status)}20`,
                    opacity: caregiver.status === 'CARING' ? pulseAnimation : 1,
                  },
                ]}
              >
                <IconSymbol
                  name={getPresenceIcon(caregiver.status)}
                  size={14}
                  color={getPresenceColor(caregiver.status)}
                />
              </Animated.View>

              <View style={styles.caregiverDetails}>
                <ThemedText type="defaultSemiBold" style={styles.caregiverName}>
                  {caregiver.userDisplayName || 'Unknown Caregiver'}
                </ThemedText>

                {showDetails && (
                  <>
                    <ThemedText style={[styles.caregiverStatus, { color: colors.textSecondary }]}>
                      {getPresenceLabel(caregiver)}
                    </ThemedText>

                    {caregiver.currentActivity && (
                      <ThemedText style={[styles.currentActivity, { color: colors.textSecondary }]}>
                        {caregiver.currentActivity}
                      </ThemedText>
                    )}
                  </>
                )}
              </View>
            </View>

            <ThemedText style={[styles.lastSeen, { color: colors.textSecondary }]}>
              {formatLastSeen(caregiver.lastSeen)}
            </ThemedText>
          </View>
        ))}
      </View>

      {/* Summary for caring caregivers */}
      {caringCaregivers.length > 0 && (
        <View style={[styles.summaryContainer, { backgroundColor: `${colors.warning}10`, borderColor: colors.warning }]}>
          <IconSymbol name="heart.fill" size={16} color={colors.warning} />
          <ThemedText style={[styles.summaryText, { color: colors.text }]}>
            {caringCaregivers.length === 1
              ? `${caringCaregivers[0].userDisplayName || 'Someone'} is currently caring for your child`
              : `${caringCaregivers.length} caregivers are currently caring for your child`
            }
          </ThemedText>
        </View>
      )}

      {/* Loading state */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ThemedText style={[styles.loadingText, { color: colors.textSecondary }]}>
            Updating presence...
          </ThemedText>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  // Compact view styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  compactIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactMoreText: {
    fontSize: 8,
    fontWeight: '600',
  },
  compactText: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Full view styles
  container: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
  },
  lastUpdate: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  caregiverList: {
    gap: 12,
  },
  caregiverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  caregiverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  presenceIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  caregiverDetails: {
    flex: 1,
  },
  caregiverName: {
    fontSize: 15,
    marginBottom: 2,
  },
  caregiverStatus: {
    fontSize: 13,
    lineHeight: 16,
  },
  currentActivity: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 2,
  },
  lastSeen: {
    fontSize: 12,
    fontWeight: '500',
  },
  summaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 8,
  },
  summaryText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 18,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  loadingText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});