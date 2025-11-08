# Authentication Screen Design Specification

## Overview
The authentication screen provides secure, frictionless account creation and sign-in for stressed parents. It must balance security with ease-of-use, offering both traditional and social authentication options.

## ASCII Wireframes

### Sign Up Screen (Default)
```ascii
┌─────────────────────────────────────────────┐
│ [←]                                  [Help] │ ← Navigation (44px)
├─────────────────────────────────────────────┤
│                                             │
│   Welcome to NestSync                      │ ← Heading (28px)
│   Let's keep your baby stocked            │ ← Subheading (16px)
│                                             │
│   Email                                     │ ← Label (14px)
│   ┌─────────────────────────────────────┐  │
│   │ your@email.com                      │  │ ← Input (48px)
│   └─────────────────────────────────────┘  │
│                                             │
│   Password                                  │
│   ┌─────────────────────────────────────┐  │
│   │ ••••••••                    [[EYE]]    │  │ ← Password with toggle
│   └─────────────────────────────────────┘  │
│   8+ characters, 1 number                  │ ← Helper text (12px)
│                                             │
│   Confirm Password                         │
│   ┌─────────────────────────────────────┐  │
│   │ ••••••••                           │  │
│   └─────────────────────────────────────┘  │
│                                             │
│   [ ] I agree to Terms & Privacy Policy    │ ← Checkbox (44px)
│                                             │
│         [Create Account]                    │ ← Primary CTA (48px)
│                                             │
│   ──────── or continue with ────────       │ ← Divider
│                                             │
│    [ Apple ]  [ Google ]  [ Facebook ]     │ ← Social buttons (48px)
│                                             │
│   Already have an account? [Sign In]       │ ← Toggle (16px)
│                                             │
└─────────────────────────────────────────────┘
```

### Sign In Screen
```ascii
┌─────────────────────────────────────────────┐
│ [←]                                  [Help] │
├─────────────────────────────────────────────┤
│                                             │
│   Welcome back!                            │ ← Heading (28px)
│   Sign in to continue                      │
│                                             │
│   Email                                     │
│   ┌─────────────────────────────────────┐  │
│   │ sarah@email.com                     │  │ ← Pre-filled if returning
│   └─────────────────────────────────────┘  │
│                                             │
│   Password                                  │
│   ┌─────────────────────────────────────┐  │
│   │ ••••••••                    [[EYE]]    │  │
│   └─────────────────────────────────────┘  │
│                                             │
│   [ ] Remember me on this device           │ ← Remember option
│                                             │
│            [Sign In]                        │ ← Primary CTA
│                                             │
│         [Forgot Password?]                  │ ← Recovery link
│                                             │
│   ──────── or continue with ────────       │
│                                             │
│    [ Apple ]  [ Google ]  [ Facebook ]     │
│                                             │
│   New to NestSync? [Create Account]        │
│                                             │
└─────────────────────────────────────────────┘
```

### Password Recovery Screen
```ascii
┌─────────────────────────────────────────────┐
│ [←]           Reset Password                │
├─────────────────────────────────────────────┤
│                                             │
│   Forgot your password?                    │
│   No worries, we'll email you a link      │
│                                             │
│   Email                                     │
│   ┌─────────────────────────────────────┐  │
│   │ your@email.com                      │  │
│   └─────────────────────────────────────┘  │
│                                             │
│         [Send Reset Link]                  │
│                                             │
│   ┌─────────────────────────────────────┐  │
│   │ ℹ Check your email for a password   │  │ ← Info box
│   │   reset link. It expires in 1 hour. │  │
│   └─────────────────────────────────────┘  │
│                                             │
│   Remember your password? [Sign In]        │
│                                             │
└─────────────────────────────────────────────┘
```

### Email Verification Screen
```ascii
┌─────────────────────────────────────────────┐
│                                             │
│              📧 Check Your Email           │ ← Icon + heading
│                                             │
│   We sent a verification to:               │
│   sarah@email.com                          │
│                                             │
│   ┌─────────────────────────────────────┐  │
│   │ Enter verification code:            │  │
│   │                                     │  │
│   │  [_] [_] [_] [_] [_] [_]           │  │ ← 6-digit input
│   │                                     │  │
│   └─────────────────────────────────────┘  │
│                                             │
│            [Verify Email]                  │
│                                             │
│   Didn't receive it?                       │
│   [Resend Code] (wait 30s)                │ ← Cooldown timer
│                                             │
│   Wrong email? [Change Email]              │
│                                             │
└─────────────────────────────────────────────┘
```

## Component Specifications

### Input Fields
```typescript
const inputStyle = {
  height: 48,
  borderWidth: 1,
  borderColor: '#D1D5DB', // Neutral-300
  borderRadius: 8,
  paddingHorizontal: 16,
  fontSize: 16,
  backgroundColor: '#FFFFFF',
  
  // Focus state
  focusedBorderColor: '#0891B2', // Primary
  focusedBorderWidth: 2,
  
  // Error state
  errorBorderColor: '#EF4444', // Red-500
  errorBackgroundColor: '#FEF2F2' // Red-50
};
```

### Social Authentication Buttons
```typescript
const socialButtonStyle = {
  height: 48,
  flex: 1,
  marginHorizontal: 4,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: '#D1D5DB',
  backgroundColor: '#FFFFFF',
  
  // Platform specific
  apple: {
    backgroundColor: '#000000',
    color: '#FFFFFF'
  },
  google: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D1D5DB'
  },
  facebook: {
    backgroundColor: '#1877F2',
    color: '#FFFFFF'
  }
};
```

## Design Psychology

### Trust Building Elements
1. **Welcoming Language**: "Welcome" vs "Login" reduces anxiety
2. **Value Reminder**: "Keep your baby stocked" reinforces benefit
3. **Social Proof**: Major platform options build credibility
4. **Clear Security**: Password requirements visible upfront
5. **Easy Recovery**: Prominent password reset reduces stress

### Cognitive Load Reduction
- **Single Column Layout**: Linear progression
- **Auto-advance**: Move to next field automatically
- **Smart Defaults**: Remember email, suggest strong password
- **Progressive Disclosure**: Only show what's needed
- **Clear CTAs**: One primary action per screen

### Form Design Best Practices
- **Field Labels**: Above fields for clarity
- **Helper Text**: Inline validation guidance
- **Password Toggle**: Reduce input errors
- **Checkbox Size**: 44px touch target
- **Button States**: Clear disabled/loading states

## Interaction Patterns

### Field Validation
```typescript
const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return {
    isValid: emailRegex.test(email),
    message: emailRegex.test(email) 
      ? '' 
      : 'Please enter a valid email'
  };
};

const validatePassword = (password: string) => {
  const checks = {
    length: password.length >= 8,
    number: /\d/.test(password),
    strength: calculateStrength(password)
  };
  
  return {
    isValid: checks.length && checks.number,
    checks,
    message: getPasswordMessage(checks)
  };
};
```

### Auto-focus Management
```typescript
// Auto-advance to next field
const handleEmailComplete = () => {
  if (validateEmail(email).isValid) {
    passwordRef.current?.focus();
  }
};

// Auto-submit on last field
const handlePasswordConfirmComplete = () => {
  if (canSubmit()) {
    handleSubmit();
  }
};
```

### Social Authentication Flow
```typescript
const handleSocialAuth = async (provider: 'apple' | 'google' | 'facebook') => {
  try {
    // Show loading state
    setAuthenticating(true);
    
    // Provider-specific auth
    const result = await authenticateWithProvider(provider);
    
    // Check if new user
    if (result.isNewUser) {
      // Go to child profile setup
      navigation.navigate('ChildProfileWizard');
    } else {
      // Go to home
      navigation.navigate('Home');
    }
  } catch (error) {
    showError(getProviderErrorMessage(provider, error));
  }
};
```

## Accessibility Implementation

### Form Accessibility
```typescript
<TextInput
  accessible={true}
  accessibilityLabel="Email address"
  accessibilityHint="Enter your email to create an account"
  accessibilityRole="text"
  autoComplete="email"
  textContentType="emailAddress"
  keyboardType="email-address"
  autoCapitalize="none"
/>

<TextInput
  accessible={true}
  accessibilityLabel="Password"
  accessibilityHint="Must be at least 8 characters with 1 number"
  accessibilityRole="text"
  secureTextEntry={!showPassword}
  textContentType="newPassword"
  autoComplete="password-new"
/>
```

### Error Announcements
```typescript
// Announce validation errors
const announceError = (message: string) => {
  if (screenReaderEnabled) {
    AccessibilityInfo.announceForAccessibility(message);
  }
};
```

## Security Considerations

### Password Security
```typescript
// Password strength indicator
const calculateStrength = (password: string): PasswordStrength => {
  let strength = 0;
  
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[^a-zA-Z\d]/.test(password)) strength++;
  
  return {
    score: strength,
    label: getStrengthLabel(strength),
    color: getStrengthColor(strength)
  };
};
```

### Rate Limiting
```typescript
const authRateLimiter = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
  
  checkLimit: (email: string) => {
    const attempts = getAttempts(email);
    return attempts < maxAttempts;
  }
};
```

## Error States

### Invalid Credentials
```ascii
┌─────────────────────────────────────────────┐
│   Email                                     │
│   ┌─────────────────────────────────────┐  │
│   │ sarah@email.com                     │  │
│   └─────────────────────────────────────┘  │
│                                             │
│   Password                                  │
│   ┌─────────────────────────────────────┐  │
│   │ ••••••••                           │  │ ← Red border
│   └─────────────────────────────────────┘  │
│   ❌ Invalid email or password             │ ← Error message
│                                             │
│            [Sign In]                        │
│                                             │
└─────────────────────────────────────────────┘
```

### Network Error
```ascii
┌─────────────────────────────────────────────┐
│                                             │
│   ⚠ Connection Issue                       │
│                                             │
│   Unable to create account.                │
│   Please check your connection.            │
│                                             │
│   [Try Again]    [Continue Offline]       │
│                                             │
└─────────────────────────────────────────────┘
```

## Platform Specific Adaptations

### iOS Specific
```typescript
// iOS Keychain integration
import * as Keychain from 'react-native-keychain';

const saveCredentials = async (email: string, password: string) => {
  if (rememberMe) {
    await Keychain.setInternetCredentials(
      'nestsync.ca',
      email,
      password
    );
  }
};

// Face ID / Touch ID
import * as LocalAuthentication from 'expo-local-authentication';

const useBiometricAuth = async () => {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  
  if (hasHardware && isEnrolled) {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Sign in to NestSync'
    });
    return result.success;
  }
};
```

### Android Specific
```typescript
// Android Keystore
import { getGenericPassword, setGenericPassword } from 'react-native-keychain';

// Android BiometricPrompt
const androidBiometric = {
  title: 'Sign in to NestSync',
  subtitle: 'Use your fingerprint or face',
  description: 'Place your finger on the sensor',
  fallbackLabel: 'Use Password'
};
```

## Testing Requirements

### Authentication Flow Testing
1. **Success Rate**: >95% successful authentications
2. **Time to Complete**: <30 seconds average
3. **Error Recovery**: Users recover within 2 attempts
4. **Social Auth Success**: >90% completion rate
5. **Biometric Adoption**: >60% of eligible users

### Security Testing
- Password strength validation
- Rate limiting verification
- Session management
- Token expiration handling
- Cross-site scripting prevention

## Implementation Notes

### NativeBase Components
```typescript
// Email input with validation
<FormControl isInvalid={emailError}>
  <FormControl.Label>Email</FormControl.Label>
  <Input
    variant="outline"
    size="lg"
    placeholder="your@email.com"
    value={email}
    onChangeText={handleEmailChange}
    autoComplete="email"
  />
  <FormControl.ErrorMessage>
    {emailError}
  </FormControl.ErrorMessage>
</FormControl>

// Social auth buttons
<HStack space={2} mt={4}>
  <Button
    flex={1}
    variant="outline"
    leftIcon={<Icon as={AppleIcon} />}
    onPress={() => handleSocialAuth('apple')}
    bg="black"
    _text={{ color: 'white' }}
  >
    Apple
  </Button>
  <Button
    flex={1}
    variant="outline"
    leftIcon={<Icon as={GoogleIcon} />}
    onPress={() => handleSocialAuth('google')}
  >
    Google
  </Button>
</HStack>
```

## Success Metrics
- **Conversion Rate**: >80% complete authentication
- **Drop-off Rate**: <20% abandon at this screen
- **Social Auth Usage**: >40% use social providers
- **Error Rate**: <5% authentication failures
- **Time to Authenticate**: <30 seconds average
- **Biometric Adoption**: >60% where available

This authentication design balances security with ease-of-use, providing multiple pathways for stressed parents to quickly create accounts and access the app's value.