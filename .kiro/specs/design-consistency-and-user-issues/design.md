# Design Document

## Overview

This design document outlines the technical approach for resolving critical user-reported issues and establishing design consistency across the NestSync React Native/Expo application. The solution addresses three primary concerns:

1. **Critical User Issues (P0)**: Blocking functionality including child selection state management, subscription cancellation failures, missing navigation elements, and non-functional placeholder content
2. **User Experience Issues (P1-P2)**: Visual inconsistencies, text rendering problems, and design pattern deviations
3. **Design System Compliance**: Systematic application of design tokens across all screens to match reference implementations (home, settings, onboarding)

The design leverages existing architecture including the NestSync color system, GlassUI tokens, GraphQL state management, and React Native/Expo navigation patterns. The solution prioritizes maintainability through logic separation, reusability through shared components, and accessibility through WCAG AA compliance.

## Architecture

### System Context

The NestSync application follows a standard React Native/Expo architecture with:

- **Frontend**: React Native with Expo Router for navigation
- **State Management**: Apollo Client for GraphQL data, Zustand stores for local state, MMKV for persistent storage
- **Styling**: StyleSheet API with centralized design tokens (Colors.ts, GlassUI.ts)
- **Backend**: GraphQL API providing subscription, child, and inventory data

### Design Principles

1. **Separation of Concerns**: Business logic separated from presentation components
2. **Design Token Authority**: All styling references centralized design tokens
3. **Accessibility First**: WCAG AA compliance with 48px minimum touch targets
4. **Progressive Enhancement**: Core functionality works without premium features
5. **Canadian Context**: Tax-inclusive pricing with provincial breakdown
6. **Performance**: Optimized rendering with React.memo and useMemo
7. **Testability**: Playwright visual regression tests for design consistency

## Components and Interfaces

### 1. Trial Banner Logic Module

**File**: `NestSync-frontend/components/subscription/TrialBannerLogic.ts`

**Purpose**: Centralized business logic for determining trial banner visibility and type based on subscription state.

**Exports**:

```typescript
// Type Definitions
export interface SubscriptionState {
  stripeSubscriptionId?: string | null;
  status?: 'active' | 'trialing' | 'canceled' | 'past_due' | null;
  trialEnd?: string | null;
  plan?: {
    id: string;
    displayName: string;
    price: number;
  } | null;
}

export interface TrialProgress {
  isActive: boolean;
  daysRemaining: number;
  trialEnd?: string | null;
}

export type BannerType = 'none' | 'free-trial' | 'subscribed-trial' | 'expired';

// Type Guards
export function isFreeTrialUser(
  trialProgress: TrialProgress | null,
  subscription: SubscriptionState | null
): boolean;

export function isSubscribedTrialUser(
  subscription: SubscriptionState | null
): boolean;

export function isActivePaidUser(
  subscription: SubscriptionState | null
): boolean;

// Banner Determination
export function determineBannerType(
  trialProgress: TrialProgress | null,
  subscription: SubscriptionState | null
): BannerType;
```

**Logic Flow**:

1. Check if user has active paid subscription → return 'none'
2. Check if user has subscription with 'trialing' status → return 'subscribed-trial'
3. Check if user has active free trial without subscription → return 'free-trial'
4. Check if trial expired → return 'expired'
5. Default → return 'none'

**Key Distinctions**:
- **Free Trial User**: `trialProgress.isActive === true` AND `!subscription.stripeSubscriptionId`
- **Subscribed Trial User**: `subscription.status === 'trialing'` AND `subscription.stripeSubscriptionId` exists
- **Active Paid User**: `subscription.status === 'active'` AND `subscription.stripeSubscriptionId` exists


### 2. SubscribedTrialBanner Component

**File**: `NestSync-frontend/components/subscription/SubscribedTrialBanner.tsx`

**Purpose**: Display success-themed banner for users who subscribed during trial, showing activation countdown.

**Props Interface**:

```typescript
interface SubscribedTrialBannerProps {
  subscription: SubscriptionState;
  daysUntilActivation: number;
  onManagePress: () => void;
  style?: ViewStyle;
}
```

**Visual Design**:

- **Background**: Green gradient (`['#059669', '#047857']`) indicating success
- **Icon**: Checkmark circle (`checkmark.circle.fill`) in white
- **Typography**:
  - Title: 14px, semi-bold, white - "Subscription Active"
  - Subtitle: 12px, regular, white 85% opacity - "Your [Plan Name] plan activates in X days"
  - Price: 11px, medium, white 70% opacity - "$X.XX CAD/month (includes XX% GST/PST/HST)"
- **Button**: "Manage" button with 48px minimum touch target, white text on transparent background with border
- **Spacing**: 4px base unit system (8px padding vertical, 12px horizontal)
- **Border**: 1px solid rgba(255, 255, 255, 0.2)
- **Shadow**: Subtle green shadow for depth

**Accessibility**:
- `accessibilityRole="banner"`
- `accessibilityLabel="Subscription confirmed. Your plan activates in X days"`
- `accessibilityHint="Tap Manage to view subscription details"`
- Manage button: 48px minimum touch target

**Canadian Tax Display**:
- Calculate provincial tax based on user's province
- Display format: "$4.99 CAD/month (includes 13% HST)" for Ontario
- Fallback: "includes applicable taxes" for unknown provinces

### 3. Refactored TrialCountdownBanner Component

**File**: `NestSync-frontend/components/reorder/TrialCountdownBanner.tsx`

**Changes**:

1. **Import TrialBannerLogic**:
```typescript
import { determineBannerType, isFreeTrialUser, isSubscribedTrialUser } from '../subscription/TrialBannerLogic';
```

2. **Update Visibility Logic**:
```typescript
const bannerType = determineBannerType(trialProgress, subscription);

if (bannerType === 'none' || bannerType === 'expired') {
  return null;
}

if (bannerType === 'subscribed-trial') {
  return (
    <SubscribedTrialBanner
      subscription={subscription}
      daysUntilActivation={daysRemaining}
      onManagePress={() => router.push('/subscription-management')}
    />
  );
}

// Show free trial banner for 'free-trial' type
```

3. **Remove Contradictory Messaging**:
- Remove "Already subscribed" text from free trial banner
- Ensure banner only shows for truly free trial users

4. **Update Touch Targets**:
- Upgrade button: Minimum 48px height
- Dismiss button: Minimum 48px touch target

5. **Add Tax Display**:
- Show tax-inclusive pricing: "$4.99 CAD/month (includes 13% HST)"
- Calculate based on user's province from profile

### 4. Child Selection State Management

**Problem**: Dashboard shows child selected, but FAB modal says "Please Select a Child"

**Root Cause Analysis**:
- Child selection state stored in component state (`selectedChildId`)
- State persisted to MMKV storage (`nestsync_selected_child_id`)
- FAB modal may be reading from different state source or not receiving prop

**Solution**:

1. **Centralize Child Selection in Context**:

Create `NestSync-frontend/contexts/ChildSelectionContext.tsx`:

```typescript
interface ChildSelectionContextType {
  selectedChildId: string | null;
  setSelectedChildId: (childId: string) => Promise<void>;
  loading: boolean;
}

export const ChildSelectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedChildId, setSelectedChildIdState] = useState<string | null>(null);
  const [storedChildId, setStoredChildId] = useAsyncStorage('nestsync_selected_child_id');
  const [loading, setLoading] = useState(true);

  // Initialize from storage
  useEffect(() => {
    const init = async () => {
      if (storedChildId) {
        setSelectedChildIdState(storedChildId);
      }
      setLoading(false);
    };
    init();
  }, [storedChildId]);

  const setSelectedChildId = async (childId: string) => {
    setSelectedChildIdState(childId);
    await setStoredChildId(childId);
  };

  return (
    <ChildSelectionContext.Provider value={{ selectedChildId, setSelectedChildId, loading }}>
      {children}
    </ChildSelectionContext.Provider>
  );
};

export const useChildSelection = () => {
  const context = useContext(ChildSelectionContext);
  if (!context) {
    throw new Error('useChildSelection must be used within ChildSelectionProvider');
  }
  return context;
};
```

2. **Update Dashboard to Use Context**:
```typescript
const { selectedChildId, setSelectedChildId } = useChildSelection();
```

3. **Update FAB Modal to Use Context**:
```typescript
const { selectedChildId } = useChildSelection();
```

4. **Wrap App in Provider**:
In `app/_layout.tsx`, wrap with `<ChildSelectionProvider>`.


### 5. Subscription Cancellation Fix

**Problem**: "Cancel Subscription" button shows error: "Failed to Cancel Subscription"

**File**: `NestSync-frontend/app/(subscription)/subscription-management.tsx`

**Investigation Steps**:

1. **Check GraphQL Mutation**:
```typescript
const CANCEL_SUBSCRIPTION_MUTATION = gql`
  mutation CancelSubscription {
    cancelSubscription {
      success
      message
      subscription {
        id
        status
        cancelAtPeriodEnd
      }
    }
  }
`;
```

2. **Check Error Handling**:
```typescript
const [cancelSubscription, { loading: canceling }] = useMutation(CANCEL_SUBSCRIPTION_MUTATION, {
  onCompleted: (data) => {
    if (data.cancelSubscription.success) {
      Alert.alert('Success', data.cancelSubscription.message);
      refetch(); // Refetch subscription data
    } else {
      Alert.alert('Error', data.cancelSubscription.message || 'Failed to cancel subscription');
    }
  },
  onError: (error) => {
    console.error('Cancel subscription error:', error);
    Alert.alert('Error', error.message || 'Failed to cancel subscription');
  }
});
```

3. **Add Confirmation Dialog**:
```typescript
const handleCancelSubscription = () => {
  Alert.alert(
    'Cancel Subscription',
    'Are you sure you want to cancel your subscription? You will retain access until the end of your billing period.',
    [
      { text: 'Keep Subscription', style: 'cancel' },
      {
        text: 'Cancel Subscription',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelSubscription();
          } catch (error) {
            console.error('Cancel subscription error:', error);
            Alert.alert('Error', 'Failed to cancel subscription. Please try again.');
          }
        }
      }
    ]
  );
};
```

4. **Add Loading State**:
```typescript
<TouchableOpacity
  style={[styles.cancelButton, canceling && styles.cancelButtonDisabled]}
  onPress={handleCancelSubscription}
  disabled={canceling}
>
  {canceling ? (
    <ActivityIndicator color="#FFFFFF" />
  ) : (
    <Text style={styles.cancelButtonText}>Cancel Subscription</Text>
  )}
</TouchableOpacity>
```

5. **Backend Verification**:
- Verify Stripe API integration in backend
- Check subscription cancellation endpoint logs
- Ensure proper error messages returned from backend

### 6. Missing Back Buttons

**Problem**: Add Order, View All Items, and Setup New Item screens missing back navigation

**Files to Update**:
- `NestSync-frontend/app/add-order.tsx`
- `NestSync-frontend/app/view-all-items.tsx`
- `NestSync-frontend/app/setup-new-item.tsx`

**Solution**:

Add Stack.Screen configuration with headerShown:

```typescript
import { Stack } from 'expo-router';

export default function AddOrderScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Add Order',
          headerShown: true,
          headerBackTitle: 'Back',
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.tint,
        }}
      />
      {/* Screen content */}
    </>
  );
}
```

**Consistent Header Configuration**:
- All screens should have consistent header styling
- Use design system colors for header background and tint
- Ensure back button is visible and functional
- Test navigation flow on iOS and Android

### 7. Placeholder Reorder Card

**Problem**: "Reorder Now" and "Compare Prices" buttons on Smart Order Suggestions card are non-functional placeholders

**Location**: Dashboard home screen

**Options**:

**Option A: Remove Placeholder Card** (Recommended)
- Remove the Smart Order Suggestions card entirely from dashboard
- Users can access reorder functionality via Quick Actions "Reorder" button
- Cleaner dashboard without confusing placeholder content

**Option B: Add Demo Mode Indicator**
```typescript
<View style={styles.demoCard}>
  <View style={styles.demoBadge}>
    <Text style={styles.demoBadgeText}>DEMO</Text>
  </View>
  <Text style={styles.demoTitle}>Smart Order Suggestions</Text>
  <Text style={styles.demoDescription}>
    This feature will provide personalized reorder recommendations based on your usage patterns.
  </Text>
  <TouchableOpacity
    style={styles.demoButton}
    onPress={() => Alert.alert('Coming Soon', 'This feature is under development')}
  >
    <Text style={styles.demoButtonText}>Learn More</Text>
  </TouchableOpacity>
</View>
```

**Decision**: Remove placeholder card to avoid user confusion. Reorder functionality is accessible via Quick Actions.

### 8. Child Name Display Fix

**Problem**: Child name "Damilare" displays as "Damil are" (split across lines)

**File**: `NestSync-frontend/components/ui/ChildSelector.tsx`

**Solution**:

1. **Add Text Wrapping Control**:
```typescript
<Text
  style={styles.childName}
  numberOfLines={1}
  ellipsizeMode="tail"
>
  {child.name}
</Text>
```

2. **Adjust Container Width**:
```typescript
childSelectorContainer: {
  minWidth: 120,
  maxWidth: 200, // Prevent excessive width
},
childName: {
  fontSize: 14,
  fontWeight: '600',
  color: colors.text,
  flexShrink: 1, // Allow text to shrink if needed
}
```

3. **Test Long Names**:
- Test with names of varying lengths (5-20 characters)
- Ensure ellipsis appears for very long names
- Verify no line breaks within names


## Data Models

### Subscription State Model

```typescript
interface SubscriptionState {
  id: string;
  stripeSubscriptionId: string | null;
  status: 'active' | 'trialing' | 'canceled' | 'past_due' | 'incomplete' | null;
  trialEnd: string | null; // ISO 8601 date string
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  plan: {
    id: string;
    displayName: string;
    price: number;
    interval: 'month' | 'year';
    currency: 'CAD';
  } | null;
}
```

### Trial Progress Model

```typescript
interface TrialProgress {
  isActive: boolean;
  daysRemaining: number;
  trialEnd: string | null; // ISO 8601 date string
  trialStart: string | null;
}
```

### Child Selection Model

```typescript
interface ChildSelectionState {
  selectedChildId: string | null;
  loading: boolean;
  error: Error | null;
}
```

### Canadian Tax Model

```typescript
interface ProvincialTax {
  province: 'ON' | 'BC' | 'AB' | 'SK' | 'MB' | 'QC' | 'NB' | 'NS' | 'PE' | 'NL' | 'YT' | 'NT' | 'NU';
  gst: number; // Federal GST percentage
  pst: number; // Provincial PST percentage (0 if none)
  hst: number; // Harmonized HST percentage (0 if GST+PST used)
  displayName: string; // "GST + PST", "HST", "GST"
  totalRate: number; // Combined tax rate
}

const CANADIAN_TAX_RATES: Record<string, ProvincialTax> = {
  ON: { province: 'ON', gst: 0, pst: 0, hst: 13, displayName: 'HST', totalRate: 13 },
  BC: { province: 'BC', gst: 5, pst: 7, hst: 0, displayName: 'GST + PST', totalRate: 12 },
  AB: { province: 'AB', gst: 5, pst: 0, hst: 0, displayName: 'GST', totalRate: 5 },
  // ... other provinces
};
```

### Design Token Model

```typescript
interface DesignTokens {
  colors: {
    primary: { blue: string; blueDark: string; blueLight: string };
    secondary: { green: string; greenLight: string; greenPale: string };
    accent: { orange: string; amber: string; purple: string };
    semantic: { success: string; warning: string; error: string; info: string };
    neutral: Record<50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900, string>;
  };
  spacing: {
    baseUnit: 4; // All spacing is multiple of 4px
    xs: 4;
    sm: 8;
    md: 12;
    lg: 16;
    xl: 20;
    xxl: 24;
  };
  typography: {
    sizes: {
      caption: 11;
      small: 12;
      body: 14;
      subtitle: 16;
      title: 20;
      largeTitle: 28;
    };
    weights: {
      regular: '400';
      medium: '500';
      semibold: '600';
      bold: '700';
    };
  };
  borderRadius: {
    sm: 6;
    md: 8;
    lg: 12;
    xl: 16;
  };
  shadows: {
    sm: { shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 };
    md: { shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 };
    lg: { shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 };
  };
  touchTargets: {
    minimum: 48; // WCAG AA minimum
  };
}
```

## Error Handling

### Subscription Cancellation Errors

**Error Types**:
1. **Network Error**: No internet connection
2. **API Error**: Backend service unavailable
3. **Stripe Error**: Stripe API failure
4. **Authorization Error**: Invalid or expired token
5. **Business Logic Error**: Subscription already canceled

**Error Handling Strategy**:

```typescript
try {
  const result = await cancelSubscription();
  
  if (!result.data?.cancelSubscription?.success) {
    // Business logic error
    const message = result.data?.cancelSubscription?.message || 'Unable to cancel subscription';
    Alert.alert('Cancellation Failed', message);
    return;
  }
  
  // Success
  Alert.alert('Subscription Canceled', 'Your subscription will remain active until the end of your billing period.');
  refetch();
  
} catch (error) {
  if (error.networkError) {
    Alert.alert('Network Error', 'Please check your internet connection and try again.');
  } else if (error.graphQLErrors?.length > 0) {
    const message = error.graphQLErrors[0].message;
    Alert.alert('Error', message);
  } else {
    Alert.alert('Error', 'An unexpected error occurred. Please try again.');
  }
  
  // Log error for debugging
  console.error('Cancel subscription error:', error);
}
```

### Child Selection Errors

**Error Types**:
1. **Storage Error**: MMKV read/write failure
2. **Invalid Child ID**: Selected child no longer exists
3. **Loading Error**: GraphQL query failure

**Error Handling Strategy**:

```typescript
const { selectedChildId, setSelectedChildId, loading, error } = useChildSelection();

if (error) {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>Unable to load child selection</Text>
      <TouchableOpacity onPress={() => refetch()}>
        <Text style={styles.retryText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
}

// Validate child ID exists in children list
useEffect(() => {
  if (selectedChildId && children.length > 0) {
    const childExists = children.some(child => child.id === selectedChildId);
    if (!childExists) {
      // Reset to first child if selected child no longer exists
      setSelectedChildId(children[0].id);
    }
  }
}, [selectedChildId, children]);
```

### Design System Validation Errors

**Error Types**:
1. **Missing Token**: Component references non-existent design token
2. **Invalid Value**: Token value doesn't meet accessibility standards
3. **Inconsistent Usage**: Same element styled differently across screens

**Error Handling Strategy**:

```typescript
// Design token validation utility
function validateDesignToken(tokenPath: string, value: any): boolean {
  if (!value) {
    console.error(`Missing design token: ${tokenPath}`);
    return false;
  }
  
  // Validate color contrast for text colors
  if (tokenPath.includes('color') && tokenPath.includes('text')) {
    const contrastRatio = calculateContrastRatio(value, backgroundColor);
    if (contrastRatio < 4.5) {
      console.warn(`Low contrast ratio (${contrastRatio}) for ${tokenPath}`);
      return false;
    }
  }
  
  // Validate touch target sizes
  if (tokenPath.includes('touchTarget')) {
    if (value < 48) {
      console.error(`Touch target too small (${value}px) for ${tokenPath}`);
      return false;
    }
  }
  
  return true;
}
```


## Testing Strategy

### Unit Tests

**Trial Banner Logic Tests**:

```typescript
describe('TrialBannerLogic', () => {
  describe('isFreeTrialUser', () => {
    it('returns true for active trial without subscription', () => {
      const trialProgress = { isActive: true, daysRemaining: 7 };
      const subscription = null;
      expect(isFreeTrialUser(trialProgress, subscription)).toBe(true);
    });
    
    it('returns false for active trial with subscription', () => {
      const trialProgress = { isActive: true, daysRemaining: 7 };
      const subscription = { stripeSubscriptionId: 'sub_123', status: 'trialing' };
      expect(isFreeTrialUser(trialProgress, subscription)).toBe(false);
    });
  });
  
  describe('isSubscribedTrialUser', () => {
    it('returns true for trialing subscription', () => {
      const subscription = { stripeSubscriptionId: 'sub_123', status: 'trialing' };
      expect(isSubscribedTrialUser(subscription)).toBe(true);
    });
    
    it('returns false for active subscription', () => {
      const subscription = { stripeSubscriptionId: 'sub_123', status: 'active' };
      expect(isSubscribedTrialUser(subscription)).toBe(false);
    });
  });
  
  describe('determineBannerType', () => {
    it('returns "free-trial" for free trial user', () => {
      const trialProgress = { isActive: true, daysRemaining: 7 };
      const subscription = null;
      expect(determineBannerType(trialProgress, subscription)).toBe('free-trial');
    });
    
    it('returns "subscribed-trial" for subscribed trial user', () => {
      const trialProgress = { isActive: true, daysRemaining: 7 };
      const subscription = { stripeSubscriptionId: 'sub_123', status: 'trialing' };
      expect(determineBannerType(trialProgress, subscription)).toBe('subscribed-trial');
    });
    
    it('returns "none" for active paid user', () => {
      const trialProgress = { isActive: false, daysRemaining: 0 };
      const subscription = { stripeSubscriptionId: 'sub_123', status: 'active' };
      expect(determineBannerType(trialProgress, subscription)).toBe('none');
    });
  });
});
```

**Child Selection Context Tests**:

```typescript
describe('ChildSelectionContext', () => {
  it('initializes with null selectedChildId', () => {
    const { result } = renderHook(() => useChildSelection(), {
      wrapper: ChildSelectionProvider
    });
    expect(result.current.selectedChildId).toBeNull();
  });
  
  it('persists child selection to storage', async () => {
    const { result } = renderHook(() => useChildSelection(), {
      wrapper: ChildSelectionProvider
    });
    
    await act(async () => {
      await result.current.setSelectedChildId('child_123');
    });
    
    expect(result.current.selectedChildId).toBe('child_123');
    expect(StorageHelpers.getItem).toHaveBeenCalledWith('nestsync_selected_child_id');
  });
});
```

### Integration Tests

**Subscription Cancellation Flow**:

```typescript
describe('Subscription Cancellation', () => {
  it('shows confirmation dialog before canceling', async () => {
    render(<SubscriptionManagementScreen />);
    
    const cancelButton = screen.getByText('Cancel Subscription');
    fireEvent.press(cancelButton);
    
    expect(Alert.alert).toHaveBeenCalledWith(
      'Cancel Subscription',
      expect.stringContaining('Are you sure'),
      expect.any(Array)
    );
  });
  
  it('calls cancelSubscription mutation on confirmation', async () => {
    const mockCancelSubscription = jest.fn().mockResolvedValue({
      data: { cancelSubscription: { success: true, message: 'Subscription canceled' } }
    });
    
    render(<SubscriptionManagementScreen />, {
      mocks: [{ request: CANCEL_SUBSCRIPTION_MUTATION, result: mockCancelSubscription }]
    });
    
    const cancelButton = screen.getByText('Cancel Subscription');
    fireEvent.press(cancelButton);
    
    // Confirm in dialog
    const confirmButton = Alert.alert.mock.calls[0][2][1];
    await act(async () => {
      await confirmButton.onPress();
    });
    
    expect(mockCancelSubscription).toHaveBeenCalled();
  });
  
  it('shows error message on cancellation failure', async () => {
    const mockCancelSubscription = jest.fn().mockRejectedValue(new Error('Network error'));
    
    render(<SubscriptionManagementScreen />, {
      mocks: [{ request: CANCEL_SUBSCRIPTION_MUTATION, error: mockCancelSubscription }]
    });
    
    const cancelButton = screen.getByText('Cancel Subscription');
    fireEvent.press(cancelButton);
    
    // Confirm in dialog
    const confirmButton = Alert.alert.mock.calls[0][2][1];
    await act(async () => {
      await confirmButton.onPress();
    });
    
    expect(Alert.alert).toHaveBeenCalledWith('Error', expect.stringContaining('Failed to cancel'));
  });
});
```

### Visual Regression Tests (Playwright)

**Trial Banner States**:

```typescript
test.describe('Trial Banner Visual Regression', () => {
  test('free trial banner displays correctly', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      // Mock free trial state
      window.__MOCK_SUBSCRIPTION_STATE__ = {
        trialProgress: { isActive: true, daysRemaining: 7 },
        subscription: null
      };
    });
    
    await page.waitForSelector('[data-testid="trial-banner"]');
    await expect(page).toHaveScreenshot('free-trial-banner.png');
  });
  
  test('subscribed trial banner displays correctly', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      // Mock subscribed trial state
      window.__MOCK_SUBSCRIPTION_STATE__ = {
        trialProgress: { isActive: true, daysRemaining: 7 },
        subscription: { stripeSubscriptionId: 'sub_123', status: 'trialing', plan: { displayName: 'Premium', price: 4.99 } }
      };
    });
    
    await page.waitForSelector('[data-testid="subscribed-trial-banner"]');
    await expect(page).toHaveScreenshot('subscribed-trial-banner.png');
  });
  
  test('no banner for active paid user', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      // Mock active paid state
      window.__MOCK_SUBSCRIPTION_STATE__ = {
        trialProgress: { isActive: false, daysRemaining: 0 },
        subscription: { stripeSubscriptionId: 'sub_123', status: 'active' }
      };
    });
    
    await expect(page.locator('[data-testid="trial-banner"]')).not.toBeVisible();
  });
});
```

**Design System Compliance Tests**:

```typescript
test.describe('Design System Compliance', () => {
  test('premium upgrade flow uses design tokens', async ({ page }) => {
    await page.goto('/subscription-management');
    
    // Check button colors match design system
    const upgradeButton = page.locator('[data-testid="upgrade-button"]');
    const backgroundColor = await upgradeButton.evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    );
    expect(backgroundColor).toBe('rgb(8, 145, 178)'); // NestSyncColors.primary.blue
    
    // Check touch target size
    const buttonBox = await upgradeButton.boundingBox();
    expect(buttonBox.height).toBeGreaterThanOrEqual(48);
  });
  
  test('reorder flow uses consistent spacing', async ({ page }) => {
    await page.goto('/reorder-suggestions-simple');
    
    // Check spacing between elements
    const cards = page.locator('[data-testid="reorder-card"]');
    const firstCard = cards.nth(0);
    const secondCard = cards.nth(1);
    
    const firstBox = await firstCard.boundingBox();
    const secondBox = await secondCard.boundingBox();
    
    const spacing = secondBox.y - (firstBox.y + firstBox.height);
    expect(spacing % 4).toBe(0); // Must be multiple of 4px base unit
  });
  
  test('payment screens match design system', async ({ page }) => {
    await page.goto('/subscription/payment');
    
    // Take screenshot for visual comparison
    await expect(page).toHaveScreenshot('payment-screen.png');
    
    // Check typography
    const heading = page.locator('h1').first();
    const fontSize = await heading.evaluate(el => 
      window.getComputedStyle(el).fontSize
    );
    expect(fontSize).toBe('28px'); // Design system largeTitle
  });
});
```

**Accessibility Tests**:

```typescript
test.describe('Accessibility Compliance', () => {
  test('all buttons meet 48px minimum touch target', async ({ page }) => {
    await page.goto('/');
    
    const buttons = page.locator('button, [role="button"]');
    const count = await buttons.count();
    
    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      const box = await button.boundingBox();
      
      expect(box.width).toBeGreaterThanOrEqual(48);
      expect(box.height).toBeGreaterThanOrEqual(48);
    }
  });
  
  test('trial banners have proper accessibility labels', async ({ page }) => {
    await page.goto('/');
    
    const banner = page.locator('[data-testid="trial-banner"]');
    const role = await banner.getAttribute('role');
    const label = await banner.getAttribute('aria-label');
    
    expect(role).toBe('banner');
    expect(label).toBeTruthy();
    expect(label).toContain('trial');
  });
  
  test('color contrast meets WCAG AA standards', async ({ page }) => {
    await page.goto('/');
    
    // Use axe-core for automated accessibility testing
    const results = await page.evaluate(() => {
      return window.axe.run();
    });
    
    const contrastViolations = results.violations.filter(v => 
      v.id === 'color-contrast'
    );
    
    expect(contrastViolations).toHaveLength(0);
  });
});
```

### Manual Testing Checklist

**P0 Issues**:
- [ ] Child selection persists across dashboard and FAB modal
- [ ] Cancel subscription button works without errors
- [ ] Back buttons present on Add Order, View All Items, Setup New Item screens
- [ ] Placeholder reorder card removed or has demo indicator

**P1 Issues**:
- [ ] Child names display without line breaks (test with "Damilare", "Christopher", "Elizabeth")
- [ ] Button styling consistent across all screens
- [ ] Demo content clearly marked with badges

**P2 Issues**:
- [ ] Order cards match design system
- [ ] Recommendation cards use consistent styling
- [ ] Tab navigation renders clearly
- [ ] Plan cards match design tokens

**Design Consistency**:
- [ ] Premium upgrade flow matches reference screens
- [ ] Reorder flow matches reference screens
- [ ] Size prediction interface matches reference screens
- [ ] Payment screens match reference screens

**Accessibility**:
- [ ] All buttons have 48px minimum touch targets
- [ ] Screen reader announces all interactive elements
- [ ] Keyboard navigation works on web
- [ ] Color contrast meets WCAG AA (4.5:1 minimum)

**Canadian Tax Display**:
- [ ] Tax-inclusive pricing shown for all provinces
- [ ] Correct tax name displayed (GST, PST, HST)
- [ ] Correct tax percentage displayed
- [ ] Fallback works for unknown provinces


## Design System Audit Process

### Reference Screen Analysis

**Reference Screens** (Good Design):
1. **Home/Dashboard** (`app/(tabs)/index.tsx`)
2. **Settings** (`app/(tabs)/settings.tsx`)
3. **Onboarding** (`app/(auth)/onboarding.tsx`)

**Extraction Process**:

1. **Capture Screenshots**:
```typescript
// Using Playwright MCP
await page.goto('/');
await page.screenshot({ path: 'reference-home.png', fullPage: true });

await page.goto('/settings');
await page.screenshot({ path: 'reference-settings.png', fullPage: true });

await page.goto('/onboarding');
await page.screenshot({ path: 'reference-onboarding.png', fullPage: true });
```

2. **Extract Design Tokens**:

Analyze reference screens to document:

**Colors**:
- Primary actions: `#0891B2` (NestSyncColors.primary.blue)
- Success states: `#059669` (NestSyncColors.secondary.green)
- Text primary: `#6B7280` (NestSyncColors.neutral[500])
- Text secondary: `#9CA3AF` (NestSyncColors.neutral[400])
- Background: `#FFFFFF` (light) / `#111827` (dark)
- Surface: `#F9FAFB` (NestSyncColors.neutral[50])
- Border: `#E5E7EB` (NestSyncColors.neutral[200])

**Typography**:
- Large Title: 28px, bold (700)
- Title: 20px, semibold (600)
- Subtitle: 16px, semibold (600)
- Body: 14px, regular (400)
- Small: 12px, regular (400)
- Caption: 11px, medium (500)

**Spacing** (4px base unit):
- xs: 4px (1 unit)
- sm: 8px (2 units)
- md: 12px (3 units)
- lg: 16px (4 units)
- xl: 20px (5 units)
- xxl: 24px (6 units)

**Border Radius**:
- Small: 6px
- Medium: 8px
- Large: 12px
- XLarge: 16px

**Shadows**:
- Small: offset (0, 1), opacity 0.05, radius 2, elevation 1
- Medium: offset (0, 2), opacity 0.1, radius 4, elevation 2
- Large: offset (0, 4), opacity 0.15, radius 8, elevation 4

**Touch Targets**:
- Minimum: 48px height
- Recommended: 48px × 48px

### Inconsistent Screen Analysis

**Inconsistent Screens** (Need Fixing):
1. **Premium Upgrade Flow** (`app/(subscription)/`)
2. **Reorder Flow** (`app/reorder-suggestions.tsx`, `app/reorder-suggestions-simple.tsx`)
3. **Size Prediction** (`app/size-guide.tsx`)
4. **Payment Screens** (`app/subscription/payment.tsx`)

**Audit Process**:

1. **Capture Screenshots**:
```typescript
// Capture all inconsistent screens
const screensToAudit = [
  '/subscription-management',
  '/reorder-suggestions-simple',
  '/size-guide',
  '/subscription/payment'
];

for (const screen of screensToAudit) {
  await page.goto(screen);
  await page.screenshot({ path: `audit-${screen.replace(/\//g, '-')}.png`, fullPage: true });
}
```

2. **Compare Against Reference**:

Create comparison matrix:

| Element | Reference | Inconsistent Screen | Gap |
|---------|-----------|---------------------|-----|
| Primary Button Color | #0891B2 | #3B82F6 | Wrong blue shade |
| Button Border Radius | 12px | 8px | Too small |
| Card Spacing | 16px | 12px | Inconsistent |
| Typography Size | 14px | 16px | Too large |
| Touch Target | 48px | 40px | Below minimum |

3. **Calculate Compliance Score**:

```typescript
interface ComplianceMetrics {
  colorCompliance: number; // % of colors matching design tokens
  typographyCompliance: number; // % of text using correct sizes/weights
  spacingCompliance: number; // % of spacing using 4px base unit
  touchTargetCompliance: number; // % of buttons meeting 48px minimum
  overallScore: number; // Average of all metrics
}

function calculateComplianceScore(screen: string): ComplianceMetrics {
  // Analyze screen elements
  const elements = analyzeScreen(screen);
  
  const colorCompliance = elements.filter(e => 
    designTokens.colors.includes(e.color)
  ).length / elements.length * 100;
  
  const typographyCompliance = elements.filter(e => 
    designTokens.typography.sizes.includes(e.fontSize)
  ).length / elements.length * 100;
  
  const spacingCompliance = elements.filter(e => 
    e.spacing % 4 === 0
  ).length / elements.length * 100;
  
  const touchTargetCompliance = elements.filter(e => 
    e.touchTarget >= 48
  ).length / elements.length * 100;
  
  const overallScore = (
    colorCompliance + 
    typographyCompliance + 
    spacingCompliance + 
    touchTargetCompliance
  ) / 4;
  
  return {
    colorCompliance,
    typographyCompliance,
    spacingCompliance,
    touchTargetCompliance,
    overallScore
  };
}
```

4. **Generate Audit Report**:

```markdown
# Design System Audit Report

## Executive Summary

- **Screens Audited**: 4
- **Overall Compliance**: 62%
- **Critical Issues**: 12
- **Recommended Fixes**: 28

## Screen-by-Screen Analysis

### Premium Upgrade Flow
- **Compliance Score**: 58%
- **Color Compliance**: 45% (9/20 elements)
- **Typography Compliance**: 70% (14/20 elements)
- **Spacing Compliance**: 55% (11/20 elements)
- **Touch Target Compliance**: 60% (12/20 buttons)

**Critical Issues**:
1. Primary button uses wrong blue shade (#3B82F6 instead of #0891B2)
2. Card border radius inconsistent (8px instead of 12px)
3. 8 buttons below 48px minimum touch target

**Recommended Fixes**:
- Replace all color references with NestSyncColors tokens
- Update border radius to 12px for all cards
- Increase button padding to meet 48px minimum

### Reorder Flow
- **Compliance Score**: 65%
- **Color Compliance**: 60% (12/20 elements)
- **Typography Compliance**: 75% (15/20 elements)
- **Spacing Compliance**: 60% (12/20 elements)
- **Touch Target Compliance**: 65% (13/20 buttons)

**Critical Issues**:
1. Inconsistent spacing between cards (14px instead of 16px)
2. Button text size too small (12px instead of 14px)
3. 7 buttons below 48px minimum touch target

**Recommended Fixes**:
- Update card spacing to 16px (4 × 4px base unit)
- Increase button text to 14px
- Add padding to buttons to meet 48px minimum

[Continue for other screens...]
```

### Design Token Documentation

Create comprehensive design token reference:

**File**: `design-documentation/design-system/tokens.md`

```markdown
# NestSync Design Tokens

## Colors

### Primary Colors
- **Primary Blue**: `#0891B2` - Main CTAs, brand elements, primary navigation
- **Primary Blue Dark**: `#0E7490` - Hover states, active states
- **Primary Blue Light**: `#E0F2FE` - Subtle backgrounds, selected states

### Secondary Colors
- **Success Green**: `#059669` - Success states, positive confirmations
- **Success Green Light**: `#D1FAE5` - Success backgrounds
- **Success Green Pale**: `#F0FDF4` - Subtle success states

### Accent Colors
- **Accent Orange**: `#EA580C` - Important actions, reorder notifications
- **Accent Amber**: `#D97706` - Warnings, attention states
- **Accent Purple**: `#7C3AED` - Premium features

### Neutral Colors
- **Neutral 50**: `#F9FAFB` - Backgrounds, subtle dividers
- **Neutral 100**: `#F3F4F6` - Card backgrounds, input fields
- **Neutral 200**: `#E5E7EB` - Borders, dividers
- **Neutral 300**: `#D1D5DB` - Placeholders, disabled states
- **Neutral 400**: `#9CA3AF` - Secondary text, icons (4.6:1 contrast)
- **Neutral 500**: `#6B7280` - Primary text (7.8:1 contrast)
- **Neutral 600**: `#4B5563` - Headings, emphasis (10.4:1 contrast)
- **Neutral 700**: `#374151` - High emphasis text (13.2:1 contrast)
- **Neutral 800**: `#1F2937` - Maximum contrast text (16.8:1 contrast)
- **Neutral 900**: `#111827` - Critical emphasis (19.3:1 contrast)

## Typography

### Font Sizes
- **Caption**: 11px - Small labels, metadata
- **Small**: 12px - Secondary text, captions
- **Body**: 14px - Primary body text
- **Subtitle**: 16px - Section headings, emphasized text
- **Title**: 20px - Screen titles, card headers
- **Large Title**: 28px - Main screen headings

### Font Weights
- **Regular**: 400 - Body text
- **Medium**: 500 - Emphasized text, labels
- **Semibold**: 600 - Headings, buttons
- **Bold**: 700 - Large titles, high emphasis

## Spacing

### Base Unit: 4px

All spacing must be a multiple of 4px:
- **XS**: 4px (1 unit)
- **SM**: 8px (2 units)
- **MD**: 12px (3 units)
- **LG**: 16px (4 units)
- **XL**: 20px (5 units)
- **XXL**: 24px (6 units)

## Border Radius
- **Small**: 6px - Small buttons, badges
- **Medium**: 8px - Input fields, small cards
- **Large**: 12px - Cards, containers
- **XLarge**: 16px - Large cards, modals

## Shadows
- **Small**: shadowOffset (0, 1), opacity 0.05, radius 2, elevation 1
- **Medium**: shadowOffset (0, 2), opacity 0.1, radius 4, elevation 2
- **Large**: shadowOffset (0, 4), opacity 0.15, radius 8, elevation 4

## Touch Targets
- **Minimum**: 48px × 48px (WCAG AA)
- **Recommended**: 48px × 48px or larger

## Usage Examples

### Button Styling
```typescript
const buttonStyle = {
  backgroundColor: NestSyncColors.primary.blue,
  paddingHorizontal: 16, // 4 × 4px
  paddingVertical: 12, // 3 × 4px
  borderRadius: 12, // Large
  minHeight: 48, // Touch target minimum
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 2
};
```

### Card Styling
```typescript
const cardStyle = {
  backgroundColor: NestSyncColors.neutral[50],
  padding: 16, // 4 × 4px
  borderRadius: 12, // Large
  borderWidth: 1,
  borderColor: NestSyncColors.neutral[200],
  marginBottom: 16, // 4 × 4px
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05,
  shadowRadius: 2,
  elevation: 1
};
```

### Typography Styling
```typescript
const headingStyle = {
  fontSize: 20, // Title
  fontWeight: '600', // Semibold
  color: NestSyncColors.neutral[600],
  marginBottom: 8 // 2 × 4px
};

const bodyStyle = {
  fontSize: 14, // Body
  fontWeight: '400', // Regular
  color: NestSyncColors.neutral[500],
  lineHeight: 20 // 1.43 ratio
};
```
```


## Implementation Phases

### Phase 1: Critical User Issues (P0) - Days 1-2

**Priority**: Blocking functionality that prevents users from using core features

**Tasks**:

1. **Child Selection State Management** (Day 1, 4 hours)
   - Create `ChildSelectionContext.tsx`
   - Update `app/_layout.tsx` to wrap with provider
   - Update dashboard to use context
   - Update FAB modal to use context
   - Test state persistence across components

2. **Subscription Cancellation Fix** (Day 1, 3 hours)
   - Investigate GraphQL mutation and backend endpoint
   - Add confirmation dialog
   - Add loading state
   - Improve error handling
   - Test cancellation flow end-to-end

3. **Missing Back Buttons** (Day 1, 2 hours)
   - Add Stack.Screen configuration to `add-order.tsx`
   - Add Stack.Screen configuration to `view-all-items.tsx`
   - Add Stack.Screen configuration to `setup-new-item.tsx`
   - Test navigation flow on iOS and Android

4. **Placeholder Reorder Card** (Day 2, 1 hour)
   - Remove Smart Order Suggestions card from dashboard
   - Verify reorder functionality accessible via Quick Actions
   - Test dashboard layout without card

**Validation**:
- [ ] Child selection persists across all components
- [ ] Cancel subscription completes successfully
- [ ] All screens have functional back buttons
- [ ] No confusing placeholder content on dashboard

### Phase 2: User Experience Improvements (P1) - Day 3

**Priority**: Significant UX issues affecting user satisfaction

**Tasks**:

1. **Child Name Display Fix** (2 hours)
   - Update `ChildSelector.tsx` with `numberOfLines={1}` and `ellipsizeMode="tail"`
   - Adjust container width constraints
   - Test with various name lengths
   - Verify no line breaks in names

2. **Button Styling Standardization** (3 hours)
   - Audit all button implementations across app
   - Create shared button component if needed
   - Update all buttons to use design system tokens
   - Ensure 48px minimum touch targets
   - Test button consistency across screens

3. **Demo Content Indicators** (2 hours)
   - Add demo badges to any remaining placeholder content
   - Create empty states for features without data
   - Test clarity of demo vs real content

**Validation**:
- [ ] Child names display correctly without line breaks
- [ ] All buttons have consistent styling
- [ ] Demo content clearly distinguished from real data

### Phase 3: Design Consistency - Trial Banner (Days 4-5)

**Priority**: Implement trial banner logic and components

**Tasks**:

1. **Trial Banner Logic Module** (Day 4, 3 hours)
   - Create `TrialBannerLogic.ts`
   - Implement type guards (`isFreeTrialUser`, `isSubscribedTrialUser`, `isActivePaidUser`)
   - Implement `determineBannerType` function
   - Write unit tests
   - Document with JSDoc

2. **SubscribedTrialBanner Component** (Day 4, 4 hours)
   - Create `SubscribedTrialBanner.tsx`
   - Implement success-themed styling with green gradient
   - Add checkmark icon and activation countdown
   - Display plan name and tax-inclusive pricing
   - Add "Manage" button with 48px touch target
   - Add accessibility labels
   - Test with different subscription states

3. **Refactor TrialCountdownBanner** (Day 5, 3 hours)
   - Import and use `TrialBannerLogic`
   - Update visibility conditions
   - Add conditional rendering for `SubscribedTrialBanner`
   - Remove contradictory messaging
   - Update touch targets to 48px minimum
   - Add tax-inclusive pricing display
   - Test all banner states

4. **Canadian Tax Calculation** (Day 5, 2 hours)
   - Create `canadianTax.ts` utility
   - Implement provincial tax rates
   - Add tax calculation functions
   - Add tax display formatting
   - Test with all provinces

**Validation**:
- [ ] Free trial users see upgrade banner
- [ ] Subscribed trial users see activation banner
- [ ] Active paid users see no banner
- [ ] Tax calculations correct for all provinces
- [ ] All touch targets meet 48px minimum

### Phase 4: Design System Compliance (Days 6-8)

**Priority**: Apply design tokens across all inconsistent screens

**Tasks**:

1. **Design System Audit** (Day 6, 4 hours)
   - Capture reference screen screenshots
   - Capture inconsistent screen screenshots
   - Extract design tokens from reference screens
   - Generate compliance report
   - Document specific gaps

2. **Premium Upgrade Flow Alignment** (Day 6-7, 6 hours)
   - Audit all premium upgrade components
   - Replace hardcoded colors with design tokens
   - Update typography to match reference
   - Fix spacing to use 4px base unit
   - Apply consistent shadows and borders
   - Update buttons to 48px touch targets
   - Test visual consistency

3. **Reorder Flow Alignment** (Day 7, 4 hours)
   - Audit reorder flow components
   - Apply design system tokens
   - Update typography hierarchy
   - Fix spacing and layout
   - Update buttons to 48px touch targets
   - Test visual consistency

4. **Size Prediction Interface Alignment** (Day 8, 3 hours)
   - Audit size prediction components
   - Apply design system tokens
   - Update iconography
   - Ensure consistent card styling
   - Test visual consistency

5. **Payment Screens Alignment** (Day 8, 3 hours)
   - Audit payment-related screens
   - Replace generic styles with design system
   - Match visual polish of reference screens
   - Ensure consistent form styling
   - Test visual consistency

**Validation**:
- [ ] All screens use design system colors
- [ ] All typography matches design system
- [ ] All spacing uses 4px base unit
- [ ] All buttons meet 48px minimum
- [ ] Visual consistency across all flows

### Phase 5: P2 Issues and Polish (Day 9)

**Priority**: Minor inconsistencies and polish

**Tasks**:

1. **Order Card Design** (2 hours)
   - Review badge styling against design tokens
   - Update PENDING status styling
   - Test visual consistency

2. **Recommendation Card Design** (2 hours)
   - Apply consistent card styling
   - Match design patterns from reference screens
   - Test visual consistency

3. **Tab Navigation Rendering** (2 hours)
   - Ensure scroll indicators visible
   - Review tab styling
   - Test on iOS and Android

4. **Plan Cards Design** (2 hours)
   - Apply design system tokens
   - Ensure consistent styling
   - Test visual consistency

**Validation**:
- [ ] All P2 issues resolved
- [ ] Visual polish matches reference screens

### Phase 6: Testing and Documentation (Days 10-11)

**Priority**: Comprehensive testing and documentation

**Tasks**:

1. **Playwright Visual Regression Tests** (Day 10, 4 hours)
   - Create trial banner state tests
   - Create premium upgrade flow tests
   - Create reorder flow tests
   - Capture baseline screenshots
   - Verify design system compliance

2. **Accessibility Testing** (Day 10, 3 hours)
   - Test screen reader labels
   - Test keyboard navigation
   - Test touch target sizes
   - Verify WCAG AA compliance
   - Test color contrast

3. **Manual Device Testing** (Day 11, 3 hours)
   - Test on iOS physical device
   - Test on Android physical device
   - Test all subscription states
   - Test Canadian tax calculations
   - Verify no regressions

4. **Documentation** (Day 11, 3 hours)
   - Generate design system compliance checklist
   - Create component usage guidelines
   - Archive before/after screenshots
   - Create comprehensive audit report
   - Document lessons learned

**Validation**:
- [ ] All Playwright tests passing
- [ ] Accessibility compliance verified
- [ ] Manual testing complete
- [ ] Documentation complete

### Phase 7: Final Validation and Merge (Day 12)

**Priority**: Final checks and merge to main

**Tasks**:

1. **Final Testing** (3 hours)
   - Run full test suite
   - Manual smoke testing
   - Verify no regressions
   - Check all acceptance criteria

2. **Code Review** (2 hours)
   - Self-review all changes
   - Address any code quality issues
   - Ensure consistent code style

3. **Merge to Main** (1 hour)
   - Create pull request
   - Address review feedback
   - Merge to main branch
   - Verify deployment

**Validation**:
- [ ] All tests passing
- [ ] No regressions
- [ ] Code review approved
- [ ] Successfully merged

## Lessons Learned and Best Practices

### Design System Maintenance

1. **Centralize Design Tokens**: All design decisions should be defined in centralized token files (`Colors.ts`, `GlassUI.ts`)
2. **Document Token Usage**: Every token should have clear documentation explaining when and how to use it
3. **Automated Validation**: Use Playwright tests to catch design system violations early
4. **Regular Audits**: Schedule quarterly design system audits to catch drift

### State Management

1. **Context for Shared State**: Use React Context for state that needs to be shared across multiple components
2. **Persistent Storage**: Use MMKV for state that needs to persist across app restarts
3. **Single Source of Truth**: Avoid duplicating state in multiple places
4. **Type Safety**: Use TypeScript interfaces to ensure type safety for all state

### Component Architecture

1. **Separation of Concerns**: Keep business logic separate from presentation components
2. **Reusable Components**: Create shared components for common patterns
3. **Accessibility First**: Build accessibility into components from the start
4. **Performance**: Use React.memo and useMemo for expensive computations

### Testing Strategy

1. **Unit Tests for Logic**: Test business logic in isolation
2. **Integration Tests for Flows**: Test complete user flows
3. **Visual Regression for Design**: Use Playwright for visual consistency
4. **Manual Testing for UX**: Always test on physical devices

### Error Handling

1. **User-Friendly Messages**: Provide clear, actionable error messages
2. **Graceful Degradation**: Handle errors without breaking the app
3. **Logging**: Log errors for debugging but don't expose technical details to users
4. **Retry Mechanisms**: Provide retry options for transient failures

### Canadian Context

1. **Tax-Inclusive Pricing**: Always show tax-inclusive prices
2. **Provincial Variations**: Account for different tax rates by province
3. **Clear Communication**: Clearly indicate when data is stored in Canada
4. **Compliance**: Ensure PIPEDA compliance for Canadian users

