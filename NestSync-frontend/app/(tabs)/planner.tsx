import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

type TimelineView = 'week' | 'month';

interface PlannerItem {
  id: string;
  date: string;
  type: 'diaper-change' | 'inventory-reminder' | 'size-prediction';
  title: string;
  description?: string;
  status: 'completed' | 'upcoming' | 'overdue';
}

export default function PlannerScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [currentView, setCurrentView] = useState<TimelineView>('week');
  
  // Sample data - in real app, this would come from GraphQL/Apollo
  const plannerItems: PlannerItem[] = [
    {
      id: '1',
      date: '2024-01-15',
      type: 'diaper-change',
      title: 'Next Diaper Change',
      description: 'Based on usual schedule',
      status: 'upcoming'
    },
    {
      id: '2', 
      date: '2024-01-16',
      type: 'inventory-reminder',
      title: 'Running Low on Size 2',
      description: '3 days remaining at current usage',
      status: 'upcoming'
    },
    {
      id: '3',
      date: '2024-01-20',
      type: 'size-prediction',
      title: 'Consider Size 3 Soon',
      description: 'Based on growth patterns',
      status: 'upcoming'
    }
  ];

  const getItemIcon = (type: PlannerItem['type']) => {
    switch (type) {
      case 'diaper-change':
        return 'clock.fill';
      case 'inventory-reminder':
        return 'exclamationmark.triangle.fill';
      case 'size-prediction':
        return 'chart.line.uptrend.xyaxis';
      default:
        return 'calendar';
    }
  };

  const getItemColor = (status: PlannerItem['status']) => {
    switch (status) {
      case 'completed':
        return colors.success;
      case 'upcoming':
        return colors.info;
      case 'overdue':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        {/* Header */}
        <ThemedView style={styles.header}>
          <ThemedText type="title" style={styles.headerTitle}>Planner</ThemedText>
          <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
            Timeline and inventory management
          </ThemedText>
        </ThemedView>

        {/* View Toggle */}
        <ThemedView style={styles.viewToggle}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              { backgroundColor: currentView === 'week' ? colors.tint : colors.surface },
              { borderColor: colors.border }
            ]}
            onPress={() => setCurrentView('week')}
            accessibilityRole="button"
            accessibilityLabel="Switch to weekly view"
          >
            <Text style={[
              styles.toggleText,
              { color: currentView === 'week' ? '#FFFFFF' : colors.text }
            ]}>
              Week
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              { backgroundColor: currentView === 'month' ? colors.tint : colors.surface },
              { borderColor: colors.border }
            ]}
            onPress={() => setCurrentView('month')}
            accessibilityRole="button"
            accessibilityLabel="Switch to monthly view"
          >
            <Text style={[
              styles.toggleText,
              { color: currentView === 'month' ? '#FFFFFF' : colors.text }
            ]}>
              Month
            </Text>
          </TouchableOpacity>
        </ThemedView>

        {/* Timeline Content */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Upcoming Events Section */}
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Upcoming Events
            </ThemedText>
            
            {plannerItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.plannerItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                accessibilityRole="button"
                accessibilityLabel={`${item.title}. ${item.description || ''}`}
              >
                <View style={styles.itemIconContainer}>
                  <IconSymbol 
                    name={getItemIcon(item.type)} 
                    size={24} 
                    color={getItemColor(item.status)} 
                  />
                </View>
                <View style={styles.itemContent}>
                  <ThemedText type="defaultSemiBold" style={styles.itemTitle}>
                    {item.title}
                  </ThemedText>
                  {item.description && (
                    <ThemedText style={[styles.itemDescription, { color: colors.textSecondary }]}>
                      {item.description}
                    </ThemedText>
                  )}
                  <ThemedText style={[styles.itemDate, { color: colors.textSecondary }]}>
                    {new Date(item.date).toLocaleDateString('en-CA', {
                      weekday: 'short',
                      month: 'short', 
                      day: 'numeric'
                    })}
                  </ThemedText>
                </View>
                <IconSymbol 
                  name="chevron.right" 
                  size={16} 
                  color={colors.textSecondary} 
                />
              </TouchableOpacity>
            ))}
          </ThemedView>

          {/* Inventory Overview Section */}
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Inventory Overview
            </ThemedText>
            
            <TouchableOpacity
              style={[styles.inventoryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              accessibilityRole="button"
              accessibilityLabel="View detailed inventory status"
            >
              <View style={styles.inventoryHeader}>
                <IconSymbol name="cube.box.fill" size={28} color={colors.accent} />
                <ThemedText type="defaultSemiBold">Current Stock</ThemedText>
              </View>
              <View style={styles.inventoryStats}>
                <View style={styles.statItem}>
                  <ThemedText type="title" style={[styles.statNumber, { color: colors.success }]}>
                    12
                  </ThemedText>
                  <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
                    Days Remaining
                  </ThemedText>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <ThemedText type="title" style={[styles.statNumber, { color: colors.warning }]}>
                    24
                  </ThemedText>
                  <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
                    Diapers Left
                  </ThemedText>
                </View>
              </View>
            </TouchableOpacity>
          </ThemedView>

          {/* Canadian Trust Indicator */}
          <ThemedView style={[styles.trustIndicator, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <IconSymbol name="checkmark.shield.fill" size={20} color={colors.info} />
            <ThemedText style={[styles.trustText, { color: colors.textSecondary }]}>
              Data stored securely in Canada
            </ThemedText>
          </ThemedView>

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
  header: {
    paddingHorizontal: 20,
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
  viewToggle: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginHorizontal: 4,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  plannerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  itemIconContainer: {
    marginRight: 16,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    marginBottom: 4,
  },
  itemDate: {
    fontSize: 12,
  },
  inventoryCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  inventoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  inventoryStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 20,
  },
  trustIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 20,
    gap: 8,
  },
  trustText: {
    fontSize: 14,
    fontWeight: '500',
  },
});