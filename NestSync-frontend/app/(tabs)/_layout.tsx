import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { ContextAwareFAB } from '@/components/ui/ContextAwareFAB';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          tabBarInactiveTintColor: Colors[colorScheme ?? 'light'].tabIconDefault,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarBackground: TabBarBackground,
          tabBarStyle: Platform.select({
            ios: {
              // Use a transparent background on iOS to show the blur effect
              position: 'absolute',
              height: 80, // Psychology-driven design: adequate touch target
            },
            default: {
              height: 80, // Consistent height across platforms
            },
          }),
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
            marginTop: 4,
          },
          tabBarItemStyle: {
            paddingVertical: 8,
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <IconSymbol 
                size={focused ? 30 : 28} 
                name={focused ? "house.fill" : "house"} 
                color={color} 
              />
            ),
            tabBarAccessibilityLabel: 'Home tab. View your dashboard and recent diaper activity.',
          }}
        />
        <Tabs.Screen
          name="planner"
          options={{
            title: 'Planner',
            tabBarIcon: ({ color, focused }) => (
              <IconSymbol 
                size={focused ? 30 : 28} 
                name={focused ? "calendar.circle.fill" : "calendar.circle"} 
                color={color} 
              />
            ),
            tabBarAccessibilityLabel: 'Planner tab. View timeline and inventory management.',
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color, focused }) => (
              <IconSymbol 
                size={focused ? 30 : 28} 
                name={focused ? "gear.circle.fill" : "gear.circle"} 
                color={color} 
              />
            ),
            tabBarAccessibilityLabel: 'Settings tab. Manage account and privacy settings.',
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            href: null, // Hide from tab bar but keep for backward compatibility
          }}
        />
      </Tabs>
      
      {/* Context-Aware FAB Overlay */}
      <ContextAwareFAB />
    </GestureHandlerRootView>
  );
}
