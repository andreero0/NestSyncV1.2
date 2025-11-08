# Emergency Flows Feature

## Overview

The Emergency Flows feature provides critical emergency assistance capabilities for the NestSync parenting app, designed with psychology-driven UX for stressed parents and Canadian healthcare integration.

## Architecture

### Core Components

- **EmergencyModeButton**: Persistent FAB accessible from all screens
- **EmergencyDashboard**: Main emergency interface with large touch targets
- **EmergencyContactCard**: One-tap calling for emergency contacts
- **MedicalInfoCard**: Collapsible medical information display
- **EmergencyShareModal**: QR code generation for first responders

### Storage Architecture

- **MMKV Storage**: 30x faster than AsyncStorage for <100ms emergency data access
- **Encrypted Storage**: Emergency data is encrypted using Expo Crypto
- **Offline-First**: All emergency features work without internet connection
- **Auto-Sync**: Automatic synchronization with existing child data

## Features

### Critical Emergency Actions

- **911 Emergency Services**: Direct dialing with confirmation dialog
- **Poison Control**: Canadian Poison Control Centre (1-800-268-5391)
- **Telehealth Ontario**: Medical advice hotline (811)
- **Emergency Contacts**: One-tap calling to configured contacts

### Medical Information Management

- **Allergies**: Critical allergy information with warning indicators
- **Medical Conditions**: Ongoing health conditions tracking
- **Current Medications**: Medication list with dosages
- **Emergency Medical Info**: Free-form critical medical information
- **Canadian Health Cards**: Provincial health card integration

### Emergency Sharing

- **QR Code Generation**: Medical information QR codes for first responders
- **Text Sharing**: Formatted emergency information for sharing
- **PIPEDA Compliance**: Privacy-by-design emergency data sharing

## Design System

### Emergency Colors

```typescript
const EMERGENCY_COLORS = {
  EMERGENCY_RED: '#FF3B30',
  EMERGENCY_RED_DARK: '#D70015',
  WARNING_ORANGE: '#FF6B00',
  MEDICAL_BLUE: '#007AFF',
  SUCCESS_GREEN: '#34C759',
};
```

### Touch Targets

- **Minimum Size**: 60x60dp for stressed users
- **Emergency Actions**: 120x120dp for critical functions
- **High Contrast**: Emergency red theme for visibility

### Psychology-Driven UX

- **Stress Reduction**: Calming animations and supportive microcopy
- **Clear Hierarchy**: Important actions prominently displayed
- **Immediate Feedback**: Haptic feedback for all interactions
- **Error Prevention**: Confirmation dialogs for critical actions

## Installation

### Dependencies

```bash
npm install react-native-mmkv react-native-qrcode-svg --legacy-peer-deps
```

### Required Permissions

Add to `app.json`:

```json
{
  "expo": {
    "permissions": ["CALL_PHONE", "CAMERA"]
  }
}
```

## Usage

### Basic Implementation

```typescript
import {
  EmergencyModeButton,
  EmergencyDashboard,
  useEmergencyProfiles
} from '@/components/emergency';

function App() {
  return (
    <View style={{ flex: 1 }}>
      {/* Your app content */}

      {/* Emergency FAB - accessible from all screens */}
      <EmergencyModeButton />
    </View>
  );
}
```

### Emergency Dashboard Screen

```typescript
import EmergencyDashboard from '@/components/emergency/EmergencyDashboard';

export default function EmergencyDashboardScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FF3B30' }}>
      <EmergencyDashboard onExitEmergencyMode={() => router.back()} />
    </SafeAreaView>
  );
}
```

### Managing Emergency Profiles

```typescript
import { useEmergencyProfiles } from '@/hooks/useEmergencyProfiles';

function EmergencySettings() {
  const {
    emergencyProfiles,
    updateEmergencyContact,
    updateMedicalInfo,
    isEmergencyDataComplete,
    emergencySetupProgress
  } = useEmergencyProfiles();

  // Add emergency contact
  const addContact = async () => {
    await addEmergencyContact(childId, {
      name: 'Jane Doe',
      phoneNumber: '(555) 123-4567',
      relationship: 'Parent',
      isPrimary: true,
    });
  };

  // Update medical information
  const updateMedical = async () => {
    await updateMedicalInfo(childId, {
      allergies: ['Peanuts', 'Shellfish'],
      bloodType: 'O+',
      emergencyMedicalInfo: 'Epileptic - requires immediate attention',
    });
  };
}
```

## Canadian Healthcare Integration

### Provincial Health Cards

```typescript
const CANADIAN_PROVINCES = [
  { code: 'ON', name: 'Ontario', healthCardLength: 10 },
  { code: 'BC', name: 'British Columbia', healthCardLength: 10 },
  { code: 'AB', name: 'Alberta', healthCardLength: 9 },
  { code: 'QC', name: 'Quebec', healthCardLength: 12 },
  // ... other provinces
];
```

### Emergency Numbers

```typescript
const CANADIAN_EMERGENCY_NUMBERS = {
  emergency: '911',
  poisonControl: '18002685391',
  telehealth: {
    ON: '8664797', // Telehealth Ontario
    default: '811', // National health line
  },
  kidsHelpPhone: '18006686868',
};
```

## Performance Considerations

### MMKV Storage Performance

- **Target Access Time**: <100ms for emergency data
- **Storage Health Monitoring**: Automatic performance tracking
- **Cache Warming**: Emergency profiles pre-loaded on app start

### Memory Management

- **Lazy Loading**: Medical info sections expand on demand
- **Image Optimization**: QR codes generated on-demand
- **Component Cleanup**: Proper cleanup of animations and timers

## Security & Privacy

### PIPEDA Compliance

- **Data Residency**: All emergency data stored locally on device
- **Encryption**: MMKV storage encrypted with Expo Crypto
- **Consent Management**: Explicit consent for emergency data sharing
- **Audit Trails**: Emergency action logging for compliance

### Data Protection

```typescript
// Emergency storage service with encryption
const emergencyStorage = new EmergencyStorageService({
  encryptionKey: generateSecureKey(),
  storageId: 'emergency-storage',
});
```

## Testing

### Emergency Scenarios

1. **Network Offline**: Verify all emergency features work offline
2. **Performance**: Ensure <100ms emergency data access
3. **Cross-Platform**: Test on iOS, Android, and web
4. **Accessibility**: Verify screen reader compatibility

### Test Data

```typescript
const TEST_EMERGENCY_PROFILE = {
  childId: 'test-child-1',
  childName: 'Test Child',
  dateOfBirth: '2020-01-01',
  emergencyContacts: [
    {
      id: 'contact-1',
      name: 'Test Parent',
      phoneNumber: '(555) 123-4567',
      relationship: 'Parent',
      isPrimary: true,
    },
  ],
  medicalInfo: {
    allergies: ['Peanuts'],
    medications: ['Children\'s Tylenol'],
    medicalConditions: ['Asthma'],
    bloodType: 'O+',
    emergencyMedicalInfo: 'Uses rescue inhaler for asthma attacks',
    healthCardNumber: '1234567890',
    province: 'ON',
  },
};
```

## Development Credentials

Use these test credentials for development:

- **Email**: parents@nestsync.com
- **Password**: Shazam11#

## Troubleshooting

### Common Issues

1. **MMKV Installation**: Use `--legacy-peer-deps` for React Native compatibility
2. **QR Code Generation**: Ensure `react-native-svg` is properly linked
3. **Phone Calls**: Test on physical device (simulator may not support calling)
4. **Performance**: Monitor storage health in development mode

### Debug Logs

```typescript
// Enable emergency debug logging
if (__DEV__) {
  console.log('Emergency storage health:', emergencyStorage.getStorageHealth());
  console.log('Emergency profiles loaded:', emergencyProfiles.length);
}
```

## Future Enhancements

### Planned Features

- **Apple HealthKit Integration**: Sync with iOS Health app
- **Emergency Location Sharing**: GPS coordinates for first responders
- **Multi-Language Support**: French language support for Quebec
- **Wearable Integration**: Apple Watch emergency triggers
- **AI-Powered Triage**: Symptom checker with emergency recommendations

### Technical Debt

- **Code Splitting**: Lazy load emergency components for smaller bundle
- **Background Sync**: Periodic sync of emergency data with backend
- **Offline Queue**: Queue emergency actions when offline
- **Push Notifications**: Emergency alerts for family members

## Contributing

### Code Style

- Follow existing TypeScript patterns
- Use functional components with hooks
- Implement proper error boundaries
- Add comprehensive JSDoc comments

### Testing Requirements

- Unit tests for storage service
- Integration tests for emergency flows
- Accessibility testing with screen readers
- Performance testing for <100ms targets

### Documentation

- Update this README for new features
- Add inline code documentation
- Create user-facing help documentation
- Maintain emergency feature roadmap