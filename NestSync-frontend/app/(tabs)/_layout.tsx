import { Tabs } from 'expo-router';
import React, { useEffect } from 'react';
import { secureLog } from '../../lib/utils/secureLogger';
import { Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { ContextAwareFAB } from '@/components/ui/ContextAwareFAB';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useMyFamilies, useCreateFamily } from '@/lib/graphql/collaboration-hooks';
import { useChildren } from '@/hooks/useChildren';
import { useCollaborationStore } from '@/stores/collaborationStore';

// Family Data Initialization Component
function FamilyDataInitializer() {
  // Initialize family data fetching
  const { families, loading: familiesLoading, error: familiesError } = useMyFamilies();
  const { children, loading: childrenLoading } = useChildren();
  const { createFamily, loading: createFamilyLoading } = useCreateFamily();

  // Collaboration store
  const {
    currentFamily,
    currentFamilyId,
    myFamilies,
    setCurrentFamily
  } = useCollaborationStore();

  // Auto-create family if user has children but no families
  useEffect(() => {
    const initializeFamilyData = async () => {
      // Wait for both queries to complete
      if (familiesLoading || childrenLoading) return;

      // If there are children but no families, auto-create a default family
      if (children.length > 0 && families.length === 0 && !familiesError) {
        try {
          if (__DEV__) {
            secureLog.info('FamilyDataInitializer: Creating default family for user with children but no families');
          }

          await createFamily({
            name: 'My Family',
            description: 'Default family for collaboration',
            familyType: 'PERSONAL'
          });
        } catch (error) {
          secureLog.error('Failed to create default family:', error);
        }
      }

      // Auto-select first family if none selected but families exist
      if (families.length > 0 && !currentFamilyId) {
        if (__DEV__) {
          secureLog.info('FamilyDataInitializer: Auto-selecting first family:', families[0]);
        }
        setCurrentFamily(families[0]);
      }
    };

    initializeFamilyData();
  }, [
    families,
    children,
    familiesLoading,
    childrenLoading,
    familiesError,
    currentFamilyId,
    createFamily,
    setCurrentFamily
  ]);

  // Enhanced debug logging for family data state and GraphQL queries
  useEffect(() => {
    if (__DEV__) {
      secureLog.info('[FamilyDataInitializer] Complete family data state:', {
        // Query states
        familiesLoading,
        childrenLoading,
        createFamilyLoading,

        // Data counts
        familiesCount: families.length,
        childrenCount: children.length,
        myFamiliesStoreCount: myFamilies.length,

        // Current selection
        currentFamilyId,
        currentFamilyName: currentFamily?.name,

        // Error states
        familiesError: familiesError?.message,

        // Data details
        familiesData: families.map(f => ({ id: f.id, name: f.name, type: f.familyType })),
        childrenData: children.map(c => ({ id: c.id, name: c.name })),
        storeMyFamilies: myFamilies.map(f => ({ id: f.id, name: f.name })),
      });

      // Separate detailed GraphQL query logging
      if (familiesError) {
        secureLog.error('[FamilyDataInitializer ERROR] MY_FAMILIES_QUERY error:', {
          error: familiesError.message,
          graphQLErrors: familiesError.graphQLErrors?.map(e => e.message),
          networkError: familiesError.networkError?.message,
        });
      }

      if (!familiesLoading && families.length === 0 && !familiesError) {
        secureLog.warn('[FamilyDataInitializer WARN] MY_FAMILIES_QUERY returned empty results - possible authentication issue');
      }

      if (families.length > 0 && myFamilies.length === 0) {
        secureLog.warn('[FamilyDataInitializer WARN] GraphQL returned families but store is empty - sync issue');
      }
    }
  }, [families, children, currentFamily, familiesLoading, childrenLoading, myFamilies, familiesError]);

  return null; // This component doesn't render anything
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* Initialize family data when tabs are loaded */}
      <FamilyDataInitializer />

      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme as keyof typeof Colors ?? 'light'].tint,
          tabBarInactiveTintColor: Colors[colorScheme as keyof typeof Colors ?? 'light'].tabIconDefault,
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
          name="inventory"
          options={{
            title: 'Inventory',
            tabBarIcon: ({ color, focused }) => (
              <IconSymbol
                size={focused ? 30 : 28}
                name={focused ? "cube.box.fill" : "cube.box"}
                color={color}
              />
            ),
            tabBarAccessibilityLabel: 'Inventory tab. Complete inventory management with filters.',
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
            tabBarAccessibilityLabel: 'Planner tab. Future-focused planning with reorder suggestions and analytics.',
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
