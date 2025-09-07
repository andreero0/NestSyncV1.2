import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import DevOnboardingReset from '@/components/dev/DevOnboardingReset';

const { width } = Dimensions.get('window');

interface DashboardStats {
  daysRemaining: number;
  diapersLeft: number;
  lastChange: string;
  todayChanges: number;
  currentSize: string;
}

interface RecentActivity {
  id: string;
  time: string;
  type: 'diaper-change' | 'inventory-update' | 'size-change';
  description: string;
}

interface QuickAction {
  id: string;
  title: string;
  icon: string;
  color: string;
  onPress: () => void;
}

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  // Sample dashboard data - in real app, this would come from GraphQL/Apollo
  const [dashboardStats] = useState<DashboardStats>({
    daysRemaining: 12,
    diapersLeft: 24,
    lastChange: '2 hours ago',
    todayChanges: 5,
    currentSize: 'Size 2'
  });

  const [recentActivity] = useState<RecentActivity[]>([
    {
      id: '1',
      time: '2 hours ago',
      type: 'diaper-change',
      description: 'Diaper changed - wet'
    },
    {
      id: '2',
      time: '5 hours ago',
      type: 'diaper-change',
      description: 'Diaper changed - soiled'
    },
    {
      id: '3',
      time: '1 day ago',
      type: 'inventory-update',
      description: 'Restocked Size 2 diapers'
    }
  ]);

  const quickActions: QuickAction[] = [
    {
      id: 'log-change',
      title: 'Log Change',
      icon: 'plus.circle.fill',
      color: colors.tint,
      onPress: () => console.log('Log diaper change')
    },
    {
      id: 'add-inventory',
      title: 'Add Stock',
      icon: 'cube.box.fill',
      color: colors.success,
      onPress: () => console.log('Add inventory')
    },
    {
      id: 'view-timeline',
      title: 'Timeline',
      icon: 'clock.fill',
      color: colors.accent,
      onPress: () => console.log('View timeline')
    },
    {
      id: 'size-check',
      title: 'Size Guide',
      icon: 'ruler.fill',
      color: colors.premium,
      onPress: () => console.log('Size guide')
    }
  ];

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'diaper-change':
        return 'checkmark.circle.fill';
      case 'inventory-update':
        return 'cube.box.fill';
      case 'size-change':
        return 'arrow.up.circle.fill';
      default:
        return 'circle.fill';
    }
  };

  const getActivityColor = (type: RecentActivity['type']) => {
    switch (type) {
      case 'diaper-change':
        return colors.success;
      case 'inventory-update':
        return colors.tint;
      case 'size-change':
        return colors.accent;
      default:
        return colors.textSecondary;
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <ThemedView style={styles.header}>
            <ThemedText type="title" style={styles.headerTitle}>
              Good morning!
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
              Here's how your little one is doing
            </ThemedText>
          </ThemedView>

          {/* Stats Overview */}
          <ThemedView style={styles.statsContainer}>
            <View style={styles.statsGrid}>
              {/* Days Remaining Card */}
              <View style={[
                styles.statCard, 
                styles.statCardLarge,
                { backgroundColor: colors.surface, borderColor: colors.border }
              ]}>
                <View style={styles.statHeader}>
                  <IconSymbol name="calendar.circle.fill" size={28} color={colors.success} />
                  <ThemedText type="defaultSemiBold" style={styles.statLabel}>
                    Days of Cover
                  </ThemedText>
                </View>
                <ThemedText type="title" style={[styles.statNumber, { color: colors.success }]}>
                  {dashboardStats.daysRemaining}
                </ThemedText>
                <ThemedText style={[styles.statSubtext, { color: colors.textSecondary }]}>
                  At current usage rate
                </ThemedText>
              </View>

              {/* Diapers Left Card */}
              <View style={[
                styles.statCard,
                styles.statCardSmall,
                { backgroundColor: colors.surface, borderColor: colors.border }
              ]}>
                <IconSymbol name="cube.box" size={20} color={colors.tint} />
                <ThemedText type="title" style={[styles.statNumber, { color: colors.tint }]}>
                  {dashboardStats.diapersLeft}
                </ThemedText>
                <ThemedText style={[styles.statText, { color: colors.textSecondary }]}>
                  Diapers Left
                </ThemedText>
              </View>

              {/* Today's Changes Card */}
              <View style={[
                styles.statCard,
                styles.statCardSmall,
                { backgroundColor: colors.surface, borderColor: colors.border }
              ]}>
                <IconSymbol name="checkmark.circle" size={20} color={colors.accent} />
                <ThemedText type="title" style={[styles.statNumber, { color: colors.accent }]}>
                  {dashboardStats.todayChanges}
                </ThemedText>
                <ThemedText style={[styles.statText, { color: colors.textSecondary }]}>
                  Today
                </ThemedText>
              </View>
            </View>
          </ThemedView>

          {/* Quick Actions */}
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Quick Actions
            </ThemedText>
            <View style={styles.quickActionsGrid}>
              {quickActions.map((action) => (
                <TouchableOpacity
                  key={action.id}
                  style={[styles.quickActionButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={action.onPress}
                  accessibilityRole="button"
                  accessibilityLabel={action.title}
                >
                  <IconSymbol name={action.icon} size={24} color={action.color} />
                  <ThemedText style={[styles.quickActionText, { color: colors.text }]}>
                    {action.title}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </ThemedView>

          {/* Recent Activity */}
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Recent Activity
            </ThemedText>
            {recentActivity.map((activity) => (
              <View
                key={activity.id}
                style={[styles.activityItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={styles.activityIcon}>
                  <IconSymbol 
                    name={getActivityIcon(activity.type)} 
                    size={20} 
                    color={getActivityColor(activity.type)} 
                  />
                </View>
                <View style={styles.activityContent}>
                  <ThemedText type="defaultSemiBold" style={styles.activityDescription}>
                    {activity.description}
                  </ThemedText>
                  <ThemedText style={[styles.activityTime, { color: colors.textSecondary }]}>
                    {activity.time}
                  </ThemedText>
                </View>
              </View>
            ))}

            <TouchableOpacity
              style={[styles.viewAllButton, { borderColor: colors.border }]}
              accessibilityRole="button"
              accessibilityLabel="View all activity"
            >
              <ThemedText style={[styles.viewAllText, { color: colors.tint }]}>
                View All Activity
              </ThemedText>
              <IconSymbol name="chevron.right" size={16} color={colors.tint} />
            </TouchableOpacity>
          </ThemedView>

          {/* Current Status */}
          <ThemedView style={[styles.statusCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.statusHeader}>
              <IconSymbol name="info.circle.fill" size={20} color={colors.info} />
              <ThemedText type="defaultSemiBold" style={styles.statusTitle}>
                Current Status
              </ThemedText>
            </View>
            <ThemedText style={[styles.statusText, { color: colors.textSecondary }]}>
              Using {dashboardStats.currentSize} • Last change {dashboardStats.lastChange} • On track with schedule
            </ThemedText>
          </ThemedView>

          {/* Canadian Trust Indicator */}
          <ThemedView style={[styles.trustIndicator, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <IconSymbol name="checkmark.shield.fill" size={20} color={colors.info} />
            <ThemedText style={[styles.trustText, { color: colors.textSecondary }]}>
              Your data is securely stored in Canada
            </ThemedText>
          </ThemedView>

          {/* Development-only onboarding reset tool */}
          <DevOnboardingReset />

          {/* Bottom spacing for tab bar */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
  },
  statsContainer: {
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  statCardLarge: {
    width: '100%',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  statCardSmall: {
    width: (width - 52) / 2, // Responsive width for small stat cards
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  statLabel: {
    fontSize: 16,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  statSubtext: {
    fontSize: 14,
  },
  statText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionButton: {
    width: (width - 52) / 2, // Responsive width accounting for padding and gap
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  activityIcon: {
    marginRight: 16,
  },
  activityContent: {
    flex: 1,
  },
  activityDescription: {
    fontSize: 16,
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  statusTitle: {
    fontSize: 16,
  },
  statusText: {
    fontSize: 14,
    lineHeight: 20,
  },
  trustIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  trustText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
