# PIPEDA Consent Flow Design Specification

## Overview
The consent flow establishes trust by transparently explaining data usage while complying with Canadian privacy laws (PIPEDA). This screen must balance legal requirements with user-friendly presentation to prevent abandonment.

## ASCII Wireframes

### Screen 1: Value & Privacy Introduction
```ascii
┌─────────────────────────────────────────────┐
│ [Skip]                              [Help] │ ← Header actions (44px)
├─────────────────────────────────────────────┤
│                                             │
│   Keep diapers coming,                     │ ← Value headline (24px)
│   stress going down                         │
│                                             │
│   ┌─────────────────────────────────────┐  │
│   │        How we help you:             │  │ ← Benefits card (120px)
│   │                                     │  │
│   │  ✓ Predict when to reorder         │  │
│   │  ✓ Find best prices in Canada      │  │
│   │  ✓ Prevent midnight emergencies    │  │
│   └─────────────────────────────────────┘  │
│                                             │
│   ┌─────────────────────────────────────┐  │
│   │     How we protect your privacy:    │  │ ← Privacy card (140px)
│   │                                     │  │
│   │  🇨🇦 Data stored in Canada          │  │
│   │  [LOCK] PIPEDA compliant                │  │
│   │  [USER] You control your data           │  │
│   │  [NO] Never sold to third parties     │  │
│   └─────────────────────────────────────┘  │
│                                             │
│         [Continue to Consent]              │ ← Primary CTA (48px)
│                                             │
│   Already have an account? [Sign In]       │ ← Secondary action
│                                             │
└─────────────────────────────────────────────┐
```

### Screen 2: Granular Consent Controls
```ascii
┌─────────────────────────────────────────────┐
│ [←]           Privacy Settings              │
├─────────────────────────────────────────────┤
│                                             │
│   We need your consent to:                 │ ← Section header (20px)
│                                             │
│   Required for app to work                 │ ← Category (16px)
│   ┌─────────────────────────────────────┐  │
│   │ [✓] Child & diaper usage data      │  │ ← Required item (56px)
│   │     Track changes, predict needs    │  │ ← Description (14px)
│   │                                     │  │
│   │ [✓] Basic account information      │  │
│   │     Email for notifications        │  │
│   └─────────────────────────────────────┘  │
│                                             │
│   Optional - Improve your experience       │
│   ┌─────────────────────────────────────┐  │
│   │ [□] Anonymous analytics            │  │ ← Optional item (56px)
│   │     Help us improve predictions    │  │
│   │                                     │  │
│   │ [□] Product recommendations        │  │
│   │     Personalized diaper suggestions│  │
│   │                                     │  │
│   │ [□] Marketing communications       │  │
│   │     Tips, deals, and updates       │  │
│   └─────────────────────────────────────┘  │
│                                             │
│   Affiliate Disclosure                     │ ← Important notice
│   ┌─────────────────────────────────────┐  │
│   │ ℹ Retail links use affiliate       │  │ ← Disclosure (60px)
│   │   programs (no extra cost to you)  │  │
│   │   [Learn More]                     │  │
│   └─────────────────────────────────────┘  │
│                                             │
│         [Accept & Continue]                │ ← Primary CTA
│                                             │
│   [Privacy Policy] [Terms of Service]      │ ← Legal links
│                                             │
└─────────────────────────────────────────────┘
```

### Screen 3: Consent Confirmation
```ascii
┌─────────────────────────────────────────────┐
│                                             │
│              ✓ All Set!                    │ ← Success state (32px)
│                                             │
│   Your privacy preferences saved:          │
│                                             │
│   ┌─────────────────────────────────────┐  │
│   │ ✓ Essential data only               │  │ ← Summary (100px)
│   │ ✗ Analytics disabled                │  │
│   │ ✗ Marketing disabled                │  │
│   │                                     │  │
│   │ You can change these anytime        │  │
│   │ in Settings → Privacy               │  │
│   └─────────────────────────────────────┘  │
│                                             │
│   Your data rights:                        │
│   • Export your data anytime              │
│   • Delete account and all data           │
│   • Update preferences instantly          │
│                                             │
│         [Get Started]                      │ ← Continue button
│                                             │
└─────────────────────────────────────────────┘
```

## Component Specifications

### Consent Toggle Components
```typescript
interface ConsentToggle {
  height: 56,
  padding: 16,
  borderRadius: 8,
  backgroundColor: {
    required: '#F3F4F6', // Neutral-100
    optional: '#FFFFFF'
  },
  checkbox: {
    size: 24,
    color: {
      checked: '#0891B2', // Primary
      unchecked: '#D1D5DB' // Neutral-300
    }
  }
}
```

### Card Styling
```typescript
const cardStyle = {
  borderWidth: 1,
  borderColor: '#E5E7EB', // Neutral-200
  borderRadius: 12,
  padding: 16,
  marginBottom: 16,
  backgroundColor: '#FFFFFF'
};
```

## Design Psychology

### Trust Building Hierarchy
1. **Value First**: Benefits before privacy requirements
2. **Canadian Identity**: 🇨🇦 flag creates national trust
3. **PIPEDA Compliance**: Legal compliance as trust signal
4. **User Control**: Emphasis on data ownership
5. **Transparency**: Affiliate disclosure upfront

### Consent Design Patterns
- **Pre-checked Required**: Shows necessity, not optional
- **Unchecked Optional**: Respects user choice
- **Descriptive Text**: Explains WHY data is needed
- **Granular Control**: Not all-or-nothing
- **Clear Categorization**: Required vs Optional

### Cognitive Load Reduction
- **Progressive Disclosure**: Two screens instead of wall of text
- **Visual Hierarchy**: Clear sections and groupings
- **Plain Language**: Grade 8 reading level
- **Benefit-Oriented**: Focus on user value, not data collection

## Interaction Patterns

### Toggle Interactions
```typescript
const handleConsentToggle = (consentType: string, value: boolean) => {
  // Required consents cannot be toggled off
  if (consentType.startsWith('required_')) {
    showToast({
      title: "Required for app to function",
      status: "info",
      duration: 2000
    });
    return;
  }
  
  // Optional consents
  updateConsent(consentType, value);
  
  // Haptic feedback
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};
```

### Validation Logic
```typescript
const canProceed = () => {
  // All required consents must be accepted
  const requiredConsents = [
    'child_data',
    'account_information'
  ];
  
  return requiredConsents.every(consent => 
    userConsents[consent] === true
  );
};
```

## Accessibility Implementation

### Screen Reader Labels
```typescript
// Consent toggles
<TouchableOpacity
  accessible={true}
  accessibilityRole="checkbox"
  accessibilityState={{ checked: isChecked }}
  accessibilityLabel="Child and diaper usage data consent"
  accessibilityHint="Required. This data is used to track changes and predict your needs"
>
```

### Focus Management
```typescript
// Auto-focus on first interactive element
useEffect(() => {
  if (screenReaderEnabled) {
    continueButtonRef.current?.focus();
  }
}, []);
```

## PIPEDA Compliance Details

### Required Elements
1. **Purpose Specification**: Clear explanation of data use
2. **Consent Mechanism**: Explicit opt-in for optional data
3. **Access Rights**: Clear path to data export/deletion
4. **Retention Information**: How long data is kept
5. **Third-Party Disclosure**: Affiliate relationship transparency

### Legal Text Integration
```typescript
const legalLinks = {
  privacyPolicy: {
    url: 'https://nestsync.ca/privacy',
    lastUpdated: '2024-01-01'
  },
  termsOfService: {
    url: 'https://nestsync.ca/terms',
    lastUpdated: '2024-01-01'
  }
};
```

## Error Handling

### Network Failure
```ascii
┌─────────────────────────────────────────────┐
│                                             │
│   ⚠ Connection Issue                       │
│                                             │
│   We couldn't save your preferences        │
│                                             │
│   Your selections:                         │
│   • Essential data: Accepted              │
│   • Analytics: Declined                   │
│                                             │
│   [Try Again]    [Continue Offline]       │
│                                             │
└─────────────────────────────────────────────┘
```

## Platform Adaptations

### iOS Specific
- Use iOS-style toggle switches
- Respect iOS privacy indicators
- Support App Tracking Transparency (ATT)

### Android Specific
- Material Design checkboxes
- Android privacy dashboard integration
- Support for Android privacy sandbox

## Testing Requirements

### Consent Flow Testing
1. **Abandonment Rate**: Track where users drop off
2. **Completion Time**: Average 45-60 seconds target
3. **Toggle Interactions**: Verify all combinations work
4. **Legal Compliance**: Lawyer review required
5. **A/B Testing**: Test different consent groupings

### Metrics to Track
```typescript
const consentMetrics = {
  screenViews: ['intro', 'controls', 'confirmation'],
  toggleInteractions: {
    analytics: { enabled: 0, disabled: 0 },
    marketing: { enabled: 0, disabled: 0 }
  },
  completionRate: 0,
  averageTime: 0,
  abandonmentPoint: null
};
```

## Implementation Notes

### State Management
```typescript
// Zustand store for consent
const useConsentStore = create((set) => ({
  consents: {
    required_child_data: true,
    required_account: true,
    optional_analytics: false,
    optional_marketing: false,
    optional_recommendations: false
  },
  consentVersion: '1.0.0',
  consentTimestamp: null,
  
  updateConsent: (type, value) => set((state) => ({
    consents: { ...state.consents, [type]: value }
  })),
  
  saveConsents: async () => {
    // Save to backend with timestamp
  }
}));
```

### NativeBase Components
```typescript
// Consent toggle component
<Box bg="white" p={4} borderRadius="lg" mb={3}>
  <HStack space={3} alignItems="center">
    <Checkbox
      value="analytics"
      isChecked={consents.optional_analytics}
      onChange={(value) => updateConsent('optional_analytics', value)}
      accessibilityLabel="Analytics consent"
    />
    <VStack flex={1}>
      <Text fontSize="md">Anonymous analytics</Text>
      <Text fontSize="sm" color="gray.600">
        Help us improve predictions
      </Text>
    </VStack>
  </HStack>
</Box>
```

## Success Metrics
- **Consent Completion Rate**: >95%
- **Time to Complete**: <60 seconds
- **Optional Consent Rate**: Track for each type
- **Return to Modify**: <5% within first week
- **Legal Compliance**: 100% PIPEDA adherent

This consent flow design balances legal requirements with user experience, building trust through transparency while maintaining Canadian privacy law compliance.