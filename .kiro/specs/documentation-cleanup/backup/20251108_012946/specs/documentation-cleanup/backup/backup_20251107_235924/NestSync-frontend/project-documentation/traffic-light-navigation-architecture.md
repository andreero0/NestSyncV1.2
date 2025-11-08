# Traffic Light Card Navigation System - Technical Architecture Specification

**Project**: NestSync v1.2 - Canadian Diaper Management App  
**Feature**: Functional Traffic Light Dashboard Navigation  
**Target Users**: Stressed Canadian parents requiring quick inventory access  
**Compliance**: PIPEDA, Canadian data residency, Psychology-driven UX  

---

## Executive Summary

### Current Problem
The traffic light dashboard cards in `/hooks/useInventoryTrafficLight.ts` (lines 130-132, 146-148, 160-162, 175-177) currently contain only placeholder `console.log()` navigation. These cards represent critical inventory status but provide no actionable navigation for stressed parents who need immediate access to filtered inventory views.

### Proposed Solution
Transform traffic light cards into **actionable navigation elements** that route users to filtered inventory views within the existing Planner tab. This provides immediate value to parents by allowing quick access to:
- Critical items requiring immediate attention (≤3 days expiry)
- Low stock items needing reorder (4-7 days expiry)  
- Well-stocked items for confidence (>7 days remaining)
- Pending orders for supply visibility

### Key Design Principles
1. **Psychology-Driven UX**: Reduce cognitive load for stressed parents
2. **Canadian Context**: PIPEDA compliance and timezone considerations (America/Toronto)
3. **File-based Routing**: Leverage existing Expo Router architecture
4. **Existing GraphQL**: Extend current `GET_INVENTORY_ITEMS_QUERY` infrastructure
5. **Accessibility**: WCAG AA compliance with screen reader support

---

## 1. URL Routing Architecture

### 1.1 Route Structure Design

**Primary Navigation Pattern:**
```
/planner/inventory?filter=FILTER_TYPE&childId=CHILD_ID
```

**Specific Route Examples:**
```typescript
// Critical Items (Red Card)
/planner/inventory?filter=critical&childId=abc123

// Low Stock Items (Amber Card)  
/planner/inventory?filter=low&childId=abc123

// Well Stocked Items (Green Card)
/planner/inventory?filter=stocked&childId=abc123

// Pending Orders (Blue Card)
/planner/inventory?filter=pending&childId=abc123
```

### 1.2 File System Implementation

**New Files Required:**
```
app/
├── (tabs)/
│   ├── planner/
│   │   ├── _layout.tsx           # Planner tab layout with navigation
│   │   ├── index.tsx             # Current planner content (timeline view)
│   │   └── inventory.tsx         # NEW: Filtered inventory screen
│   └── planner.tsx               # MODIFY: Route to planner/index.tsx
```

### 1.3 URL Parameter Schema

```typescript
interface InventoryRouteParams {
  filter: 'critical' | 'low' | 'stocked' | 'pending';
  childId: string;
  sort?: 'expiry' | 'quantity' | 'brand' | 'added_date';
  sortDirection?: 'asc' | 'desc';
}
```

---

## 2. Component Architecture Specifications

### 2.1 Core Components Overview

```typescript
// New component hierarchy for inventory filtering
components/
├── inventory/
│   ├── InventoryList.tsx           # Main inventory display component
│   ├── InventoryItem.tsx           # Individual inventory item card
│   ├── InventoryFilters.tsx        # Filter controls and status bar
│   ├── EmptyInventoryState.tsx     # Empty state for filtered views
│   └── InventoryLoadingState.tsx   # Loading skeleton component
└── navigation/
    └── BackToHomeButton.tsx        # Return to dashboard button
```

### 2.2 InventoryList Component Specification

```typescript
// components/inventory/InventoryList.tsx
interface InventoryListProps {
  filter: TrafficLightFilter;
  childId: string;
  onItemPress?: (item: InventoryItem) => void;
  showFilters?: boolean;
  enableSort?: boolean;
}

interface TrafficLightFilter {
  type: 'critical' | 'low' | 'stocked' | 'pending';
  title: string;
  description: string;
  predicate: (item: InventoryItem) => boolean;
  emptyStateMessage: string;
  iconName: string;
  borderColor: string;
}

// Filter definitions matching traffic light logic
const TRAFFIC_LIGHT_FILTERS: Record<string, TrafficLightFilter> = {
  critical: {
    type: 'critical',
    title: 'Critical Items',
    description: 'Items expiring within 3 days or already expired',
    predicate: (item) => item.isExpired || (item.daysUntilExpiry !== null && item.daysUntilExpiry <= 3),
    emptyStateMessage: 'No critical items found. Your inventory is well-managed!',
    iconName: 'exclamationmark.triangle.fill',
    borderColor: NestSyncColors.trafficLight.critical,
  },
  low: {
    type: 'low', 
    title: 'Low Stock',
    description: 'Items expiring in 4-7 days - plan to restock',
    predicate: (item) => item.daysUntilExpiry !== null && item.daysUntilExpiry >= 4 && item.daysUntilExpiry <= 7,
    emptyStateMessage: 'No low stock items. Great inventory planning!',
    iconName: 'clock.fill',
    borderColor: NestSyncColors.trafficLight.low,
  },
  stocked: {
    type: 'stocked',
    title: 'Well Stocked', 
    description: 'Items with more than 7 days remaining',
    predicate: (item) => item.daysUntilExpiry === null || item.daysUntilExpiry > 7,
    emptyStateMessage: 'Add more inventory to see well-stocked items here.',
    iconName: 'checkmark.circle.fill',
    borderColor: NestSyncColors.trafficLight.stocked,
  },
  pending: {
    type: 'pending',
    title: 'Pending Orders',
    description: 'Items on order or incoming deliveries',
    predicate: (item) => item.status === 'ORDERED' || item.status === 'SHIPPED', // Future implementation
    emptyStateMessage: 'No pending orders. Add orders to track incoming inventory.',
    iconName: 'shippingbox.fill',
    borderColor: NestSyncColors.trafficLight.pending,
  },
};
```

### 2.3 InventoryItem Component Specification

```typescript
// components/inventory/InventoryItem.tsx
interface InventoryItemProps {
  item: InventoryItem;
  onPress?: () => void;
  showExpiryBadge?: boolean;
  showQuantityProgress?: boolean;
  compact?: boolean;
}

// Psychology-driven visual indicators
const getExpiryUrgencyStyle = (daysUntilExpiry: number | null): ViewStyle => {
  if (daysUntilExpiry === null) return { backgroundColor: colors.success };
  if (daysUntilExpiry <= 3) return { backgroundColor: colors.error };
  if (daysUntilExpiry <= 7) return { backgroundColor: colors.warning };
  return { backgroundColor: colors.success };
};
```

### 2.4 Filter Bar Component Specification

```typescript  
// components/inventory/InventoryFilters.tsx
interface InventoryFiltersProps {
  activeFilter: TrafficLightFilter;
  totalCount: number;
  onSortChange?: (sort: string, direction: 'asc' | 'desc') => void;
  onClearFilters?: () => void;
}

// Filter status bar shows active filter and count
// Clear visual indication of what's being shown
// Quick access to sorting options
```

---

## 3. State Management & Filter System Design

### 3.1 URL State Management

```typescript
// hooks/useInventoryFilters.ts
interface UseInventoryFiltersResult {
  filter: TrafficLightFilter;
  childId: string;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  updateFilter: (filter: string) => void;
  updateSort: (sort: string, direction: 'asc' | 'desc') => void;
}

export function useInventoryFilters(): UseInventoryFiltersResult {
  const { filter, childId, sort, sortDirection } = useLocalSearchParams<{
    filter: string;
    childId: string; 
    sort?: string;
    sortDirection?: 'asc' | 'desc';
  }>();
  
  const router = useRouter();
  
  // Validate filter parameter
  const activeFilter = useMemo(() => {
    const filterKey = filter?.toLowerCase();
    return TRAFFIC_LIGHT_FILTERS[filterKey] || TRAFFIC_LIGHT_FILTERS.critical;
  }, [filter]);
  
  const updateFilter = useCallback((newFilter: string) => {
    router.setParams({ filter: newFilter });
  }, [router]);
  
  const updateSort = useCallback((newSort: string, newDirection: 'asc' | 'desc') => {
    router.setParams({ sort: newSort, sortDirection: newDirection });
  }, [router]);
  
  return {
    filter: activeFilter,
    childId: childId || '',
    sortBy: sort || 'expiry',
    sortDirection: sortDirection || 'asc',
    updateFilter,
    updateSort,
  };
}
```

### 3.2 Client-Side Filtering Logic

```typescript
// utils/inventoryFilters.ts
export function filterInventoryByTrafficLight(
  items: InventoryItem[], 
  filter: TrafficLightFilter
): InventoryItem[] {
  return items
    .filter(item => item.quantityRemaining > 0) // Only active items
    .filter(filter.predicate)
    .sort((a, b) => {
      // Default sort: most urgent first
      if (a.daysUntilExpiry === null && b.daysUntilExpiry === null) return 0;
      if (a.daysUntilExpiry === null) return 1;
      if (b.daysUntilExpiry === null) return -1;
      return a.daysUntilExpiry - b.daysUntilExpiry;
    });
}

export function sortInventoryItems(
  items: InventoryItem[], 
  sortBy: string, 
  direction: 'asc' | 'desc'
): InventoryItem[] {
  const sorted = [...items].sort((a, b) => {
    switch (sortBy) {
      case 'expiry':
        if (a.daysUntilExpiry === null && b.daysUntilExpiry === null) return 0;
        if (a.daysUntilExpiry === null) return 1;
        if (b.daysUntilExpiry === null) return -1;
        return a.daysUntilExpiry - b.daysUntilExpiry;
      case 'quantity':
        return a.quantityRemaining - b.quantityRemaining;
      case 'brand':
        return a.brand.localeCompare(b.brand);
      case 'added_date':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      default:
        return 0;
    }
  });
  
  return direction === 'desc' ? sorted.reverse() : sorted;
}
```

---

## 4. GraphQL Integration & Query Extensions

### 4.1 Current Query Analysis

**Existing Query**: `GET_INVENTORY_ITEMS_QUERY` in `/lib/graphql/mutations.ts` (lines 272-301)

Current parameters:
- `childId`: Required for child-specific inventory
- `productType`: Optional filter by product type (DIAPER, WIPES, etc.)
- `limit`: Pagination limit (currently 500)  
- `offset`: Pagination offset

### 4.2 Query Extension Requirements

**No Backend Changes Required**: Current GraphQL query already supports needed filtering through client-side processing.

```typescript
// Enhanced query usage for filtered views
const GET_FILTERED_INVENTORY_QUERY = gql`
  query GetFilteredInventory(
    $childId: ID!
    $productType: ProductTypeEnum = DIAPER
    $limit: Int! = 500
    $offset: Int! = 0
  ) {
    getInventoryItems(
      childId: $childId
      productType: $productType
      limit: $limit
      offset: $offset
    ) {
      edges {
        node {
          ...InventoryItemFragment
          # All required fields for filtering already included:
          # - daysUntilExpiry (for traffic light logic)
          # - isExpired (for critical detection)
          # - quantityRemaining (for active items)
          # - brand, size, productType (for display)
          # - createdAt (for sorting)
        }
        cursor
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
        totalCount
      }
    }
  }
  ${INVENTORY_ITEM_FRAGMENT}
`;
```

### 4.3 Apollo Client Integration

```typescript
// hooks/useFilteredInventory.ts
export function useFilteredInventory(childId: string, filter: TrafficLightFilter) {
  const { data, loading, error, refetch } = useQuery(GET_FILTERED_INVENTORY_QUERY, {
    variables: {
      childId,
      productType: 'DIAPER', // Focus on diapers for traffic light system
      limit: 500,
    },
    skip: !childId,
    pollInterval: 30000, // Real-time updates for inventory changes
    errorPolicy: 'all',
    notifyOnNetworkStatusChange: true,
  });

  const filteredItems = useMemo(() => {
    if (!data?.getInventoryItems?.edges) return [];
    
    const items: InventoryItem[] = data.getInventoryItems.edges.map(edge => edge.node);
    return filterInventoryByTrafficLight(items, filter);
  }, [data, filter]);

  return {
    items: filteredItems,
    loading,
    error,
    refetch,
    totalCount: data?.getInventoryItems?.pageInfo?.totalCount || 0,
  };
}
```

---

## 5. User Experience & Navigation Flow

### 5.1 User Journey Specification

**Primary Flow: Critical Items (Red Card)**
1. User sees "Critical Items: 3" on dashboard
2. Taps red traffic light card
3. **Navigation**: Router navigates to `/planner/inventory?filter=critical&childId=abc123`
4. **Screen Transition**: Smooth slide transition to filtered inventory view
5. **Content**: Shows 3 items expiring ≤3 days with clear expiry indicators
6. **Actions**: User can tap individual items for details or quick actions
7. **Return**: Clear back button returns to dashboard

**Secondary Flow: No Items Found**
1. User taps "Pending Orders: 0" 
2. **Navigation**: Routes to `/planner/inventory?filter=pending&childId=abc123`
3. **Empty State**: Shows encouraging message with add order action
4. **Psychology**: Reassuring tone, not alarming for stressed parents

### 5.2 Navigation Implementation

```typescript
// Modified traffic light card navigation in useInventoryTrafficLight.ts
const generateCardNavigation = (statusType: string, childId: string) => {
  return () => {
    // Haptic feedback for tactile confirmation
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    // Navigate to filtered inventory view
    router.push({
      pathname: '/planner/inventory',
      params: { 
        filter: statusType,
        childId: childId,
        source: 'dashboard' // Track navigation source for analytics
      }
    });
  };
};

// Replace console.log statements with actual navigation:
onPress: generateCardNavigation('critical', childId),  // Line 132
onPress: generateCardNavigation('low', childId),       // Line 148  
onPress: generateCardNavigation('stocked', childId),   // Line 162
onPress: generateCardNavigation('pending', childId),   // Line 177
```

### 5.3 Accessibility & Screen Reader Support

```typescript
// Enhanced accessibility for filtered inventory views
const accessibilityLabels = {
  critical: `Critical items screen. ${filteredItems.length} items need attention within 3 days.`,
  low: `Low stock screen. ${filteredItems.length} items need restocking in 4 to 7 days.`,
  stocked: `Well stocked screen. ${filteredItems.length} items with sufficient supply.`,
  pending: `Pending orders screen. ${filteredItems.length} orders currently being processed.`
};

// Screen reader announcements for filter changes
useEffect(() => {
  if (Platform.OS !== 'web') {
    AccessibilityInfo.announceForAccessibility(
      `Showing ${filter.title}. ${filteredItems.length} items found.`
    );
  }
}, [filter, filteredItems.length]);
```

---

## 6. Implementation Plan for Development Teams

### 6.1 For Frontend Engineers (React Native/Expo)

**Phase 1: Core Navigation (2-3 days)**
1. **Create Planner Tab Structure**
   - Convert `/app/(tabs)/planner.tsx` to `/app/(tabs)/planner/index.tsx`
   - Create `/app/(tabs)/planner/_layout.tsx` for nested routing
   - Add `/app/(tabs)/planner/inventory.tsx` for filtered views

2. **Update Traffic Light Navigation** 
   - Modify `useInventoryTrafficLight.ts` lines 130-132, 146-148, 160-162, 175-177
   - Replace `console.log()` with `router.push()` navigation
   - Add haptic feedback and loading states

3. **Create URL Parameter Hook**
   - Implement `useInventoryFilters()` hook  
   - Handle URL parameter parsing and validation
   - Manage filter state and sort options

**Phase 2: Component Development (3-4 days)**
1. **Core Inventory Components**
   - `InventoryList.tsx` - Main list with filtering
   - `InventoryItem.tsx` - Individual item cards with psychology-driven styling
   - `InventoryFilters.tsx` - Filter status and sort controls
   - `EmptyInventoryState.tsx` - Encouraging empty states

2. **Client-Side Filtering Logic**
   - `utils/inventoryFilters.ts` - Filter and sort functions
   - `hooks/useFilteredInventory.ts` - Apollo Client integration
   - Real-time filtering with GraphQL polling

3. **Loading and Error States**
   - `InventoryLoadingState.tsx` - Skeleton loaders
   - Error handling with retry mechanisms
   - Offline state indicators

**Phase 3: Polish & Testing (2-3 days)**
1. **Accessibility Implementation**
   - Screen reader labels and hints
   - Keyboard navigation support
   - High contrast mode compatibility

2. **Performance Optimization**
   - List virtualization for large inventories
   - Memoized filter computations
   - Image lazy loading for product images

3. **Psychology-Driven UX**
   - Calming animations and transitions
   - Stress-reducing color schemes
   - Clear action buttons and confirmations

### 6.2 For Backend Engineers (FastAPI/GraphQL)

**Current Implementation**: No backend changes required initially.

**Future Enhancements (Optional)**:
1. **Server-Side Filtering** (if needed for performance)
   ```python
   # Add filter parameters to existing resolver
   async def get_inventory_items(
       self, 
       childId: str,
       productType: Optional[ProductTypeEnum] = None,
       expiryFilter: Optional[str] = None,  # NEW: 'critical', 'low', 'stocked'
       limit: int = 500,
       offset: int = 0
   ):
   ```

2. **Pending Orders System** 
   ```python
   # New GraphQL types for order tracking
   @strawberry.type
   class PendingOrder:
       id: str
       childId: str
       productType: ProductTypeEnum
       brand: str
       size: str
       quantity: int
       orderDate: datetime
       expectedDeliveryDate: Optional[datetime]
       status: OrderStatusEnum
   ```

### 6.3 For QA Engineers

**Testing Strategy:**

1. **Navigation Flow Testing**
   - Verify each traffic light card navigates correctly
   - Test URL parameter handling and validation
   - Confirm back navigation preserves dashboard state

2. **Filter Accuracy Testing**
   - Verify critical items filter (≤3 days expiry)
   - Confirm low stock filter (4-7 days expiry)
   - Test well-stocked filter (>7 days remaining)
   - Validate pending orders filter (when implemented)

3. **Edge Case Testing**
   - No inventory items scenarios
   - Invalid URL parameters
   - Network connectivity issues
   - Large inventory datasets (500+ items)

4. **Accessibility Testing**
   - Screen reader compatibility (iOS VoiceOver, Android TalkBack)
   - Keyboard navigation support
   - High contrast mode visibility
   - Touch target size compliance (44pt minimum)

5. **Cross-Platform Testing**
   - iOS navigation behavior
   - Android back button handling
   - Web browser URL synchronization

### 6.4 For Security Analysts

**Security Considerations:**

1. **URL Parameter Validation**
   ```typescript
   // Sanitize and validate all URL parameters
   const validateFilterParam = (filter: string): boolean => {
     const validFilters = ['critical', 'low', 'stocked', 'pending'];
     return validFilters.includes(filter?.toLowerCase());
   };
   
   const validateChildId = (childId: string): boolean => {
     // UUID validation and user ownership verification
     return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(childId);
   };
   ```

2. **Data Access Control**
   - Ensure filtered inventory queries respect RLS policies
   - Verify users can only access their own children's data
   - Test unauthorized childId access attempts

3. **PIPEDA Compliance**
   - All inventory data filtering happens client-side (Canadian jurisdiction)
   - No sensitive data exposed in URL parameters (only filter types and IDs)
   - Navigation tracking respects user privacy settings

---

## 7. Success Metrics & Quality Assurance

### 7.1 User Experience Metrics

**Primary Success Indicators:**
- **Navigation Completion Rate**: >95% of traffic light card taps successfully reach filtered views
- **Time to Insight**: <3 seconds from card tap to filtered inventory display
- **Filter Accuracy**: 100% accuracy in showing correct items per filter category
- **Return Navigation**: >90% of users successfully return to dashboard

**Psychology-Driven Success Factors:**
- **Cognitive Load Reduction**: Clear visual indicators reduce decision-making time
- **Stress Reduction**: Calming color schemes and encouraging empty states
- **Confidence Building**: Accurate counts and clear categories build trust

### 7.2 Technical Quality Metrics

**Performance Requirements:**
- **Initial Load**: <2 seconds for filtered inventory views
- **Filter Switching**: <500ms to switch between filter categories
- **Memory Usage**: <100MB additional memory for inventory filtering
- **Battery Impact**: Minimal battery usage with efficient polling

**Reliability Requirements:**
- **Offline Graceful Degradation**: Show cached data when network unavailable
- **Error Recovery**: Automatic retry with exponential backoff
- **Data Consistency**: Real-time updates reflect inventory changes

### 7.3 Accessibility Compliance

**WCAG AA Requirements:**
- **Color Contrast**: 4.5:1 minimum ratio for all text
- **Touch Targets**: 44pt minimum for all interactive elements
- **Screen Reader**: Complete navigation using only screen reader
- **Keyboard Navigation**: Full functionality without touch input

---

## 8. Future Enhancement Roadmap

### 8.1 Short-Term Enhancements (Next Sprint)

1. **Sort and Search Functionality**
   - Sort by expiry date, quantity, brand, or date added
   - Search within filtered results
   - Quick filter toggles (expired only, low quantity only)

2. **Bulk Actions**
   - Mark multiple items as used
   - Bulk inventory updates
   - Quick reorder for multiple items

### 8.2 Medium-Term Enhancements (2-3 Sprints)

1. **Pending Orders System**
   - Track orders from retailers
   - Delivery date predictions
   - Integration with shopping platforms

2. **Smart Notifications**
   - Push notifications for critical items
   - Weekly inventory health reports
   - Personalized restock reminders

### 8.3 Long-Term Vision (Future Releases)

1. **AI-Powered Predictions**
   - Usage pattern analysis
   - Automatic reorder suggestions
   - Size transition predictions

2. **Family Sharing**
   - Multi-caregiver inventory management
   - Shared shopping lists
   - Responsibility assignment

---

## Conclusion

This traffic light navigation system transforms non-functional placeholder cards into a powerful inventory management tool specifically designed for stressed Canadian parents. The architecture leverages existing NestSync infrastructure while adding comprehensive filtering capabilities that follow psychology-driven UX principles.

The implementation plan provides clear, actionable specifications for each development team, ensuring successful delivery of a feature that provides immediate value to users while maintaining PIPEDA compliance and Canadian data residency requirements.

**Key Implementation Priority**: Begin with Phase 1 navigation changes to provide immediate functionality, then iterate with component development and polish phases to create a world-class inventory management experience.