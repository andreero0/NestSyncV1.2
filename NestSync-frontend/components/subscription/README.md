# Subscription Components

This directory contains components related to subscription management and trial banners.

## Components

### SubscribedTrialBanner

**Purpose**: Display activation countdown for users who have already subscribed to a paid plan but are still in their trial period.

**Key Features**:
- ✅ Success-themed green gradient background
- ✅ Checkmark icon indicating successful subscription
- ✅ Clear activation countdown messaging
- ✅ Tax-inclusive pricing with provincial breakdown
- ✅ 48px minimum touch targets (WCAG AAA compliance)
- ✅ 4px base unit spacing system
- ✅ Design system color tokens from NestSyncColors
- ✅ Full accessibility support with labels and hints

**When to Use**:
- User has `stripeSubscriptionId` (already subscribed)
- Subscription status is `TRIALING`
- Trial is still active (`trialProgress.isActive === true`)

**Props**:
```typescript
interface SubscribedTrialBannerProps {
  daysRemaining: number;        // Days until plan activates
  planName: string;             // e.g., "Standard Plan"
  price: number;                // Monthly price in CAD (before tax)
  currency: 'CAD';              // Always CAD for Canadian compliance
  province: CanadianProvince;   // User's province for tax calculation
  onManagePress: () => void;    // Navigate to subscription management
  onDismiss?: () => void;       // Optional dismiss handler
  style?: any;                  // Optional custom styling
}
```

**Example Usage**:
```tsx
import { SubscribedTrialBanner } from './components/subscription/SubscribedTrialBanner';
import { CanadianProvince } from './types/subscription';

<SubscribedTrialBanner
  daysRemaining={7}
  planName="Standard Plan"
  price={4.99}
  currency="CAD"
  province={CanadianProvince.ON}
  onManagePress={() => navigation.navigate('SubscriptionManagement')}
  onDismiss={() => saveDismissalState()}
/>
```

**Tax Calculations**:
The component automatically calculates tax-inclusive pricing based on the user's province:

- **Ontario**: HST 13% → $4.99 + $0.65 = $5.64 CAD/month
- **Quebec**: GST 5% + QST 9.975% → $4.99 + $0.75 = $5.74 CAD/month
- **British Columbia**: GST 5% + PST 7% → $4.99 + $0.60 = $5.59 CAD/month
- **Alberta**: GST 5% → $4.99 + $0.25 = $5.24 CAD/month

**Design System Compliance**:
- Colors: Uses `NestSyncColors.semantic.success` for success theme
- Spacing: 4px base unit system (8px, 12px, 16px, etc.)
- Typography: System fonts with proper weights and sizes
- Shadows: Subtle elevation matching reference screens
- Border Radius: 8px and 12px for consistency

**Accessibility**:
- All buttons have `accessibilityRole="button"`
- Descriptive `accessibilityLabel` for screen readers
- `accessibilityHint` explaining button actions
- 48px minimum touch targets (WCAG AAA)
- Proper color contrast ratios

**Requirements Satisfied**:
- 2.2: Activation countdown display
- 2.3: Plan name and pricing information
- 2.4: "Manage" button instead of "Upgrade"
- 2.5: No contradictory messaging
- 4.1, 4.2, 4.3: Tax-inclusive pricing with breakdown
- 5.1, 5.2, 5.5: 48px minimum touch targets
- 6.1, 6.2, 6.3: Full accessibility support
- 7.2, 7.3: Design system compliance

---

### TrialCountdownBanner

**Purpose**: Display upgrade CTA for free trial users who haven't subscribed yet.

**When to Use**:
- User has NO `stripeSubscriptionId` (not subscribed)
- Trial is active (`trialProgress.isActive === true`)
- User is exploring features without payment commitment

**Key Difference from SubscribedTrialBanner**:
- Shows "Upgrade" button (not "Manage")
- Uses primary blue gradient (not success green)
- Focuses on conversion messaging
- Displays pricing to encourage subscription

---

### TrialBannerLogic

**Purpose**: Centralized logic for determining which banner to display.

**Functions**:
- `determineBannerType()`: Returns which banner type to show
- `isFreeTrialUser()`: Type guard for free trial users
- `isSubscribedTrialUser()`: Type guard for subscribed trial users
- `isActivePaidUser()`: Type guard for active paid users
- `isTrialExpired()`: Type guard for expired trials

**Usage**:
```tsx
import { determineBannerType, isSubscribedTrialUser } from './TrialBannerLogic';

const bannerType = determineBannerType({ subscription, trialProgress });

if (bannerType === 'subscribed-trial-activation') {
  return <SubscribedTrialBanner {...props} />;
} else if (bannerType === 'free-trial-upgrade') {
  return <TrialCountdownBanner {...props} />;
}
```

---

## Testing

See `SubscribedTrialBanner.example.tsx` for usage examples.

Run visual tests:
```bash
npm run test:e2e -- subscribed-trial-banner-visual.spec.ts
```

## Related Documentation

- [Requirements](.kiro/specs/design-consistency-fix/requirements.md)
- [Design Document](.kiro/specs/design-consistency-fix/design.md)
- [Tasks](.kiro/specs/design-consistency-fix/tasks.md)
- [Design Tokens](.kiro/specs/design-consistency-fix/design-tokens-reference.json)
