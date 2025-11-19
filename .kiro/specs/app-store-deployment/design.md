# App Store Deployment Design Document

## Overview

This design outlines the complete workflow for deploying the NestSync mobile application to Apple's App Store via TestFlight using Expo Application Services (EAS). The solution maintains the existing Railway backend infrastructure while enabling iOS app distribution through Apple's ecosystem.

### Key Design Decisions

1. **EAS for Build Management**: Use Expo's cloud build service instead of local Xcode builds for consistency and ease of use
2. **Main Branch Deployment**: Build production and TestFlight releases from the main branch to ensure stability
3. **Environment Separation**: Maintain clear separation between development (local backend) and production (Railway backend) configurations
4. **Automated Submission**: Configure automatic TestFlight submission after successful builds
5. **No Docker Dependency**: EAS builds run independently without requiring local Docker setup

## Architecture

### High-Level Workflow

```
┌─────────────────┐
│  Developer      │
│  Local Machine  │
└────────┬────────┘
         │
         │ 1. eas build --platform ios --profile production
         │
         ▼
┌─────────────────────────────────────────────────────┐
│           Expo Application Services (EAS)            │
│                                                      │
│  ┌──────────────┐    ┌──────────────┐             │
│  │ Source Code  │───▶│ iOS Build    │             │
│  │ Upload       │    │ (Cloud)      │             │
│  └──────────────┘    └──────┬───────┘             │
│                              │                      │
│                              ▼                      │
│                      ┌──────────────┐              │
│                      │ Sign with    │              │
│                      │ Apple Certs  │              │
│                      └──────┬───────┘              │
│                              │                      │
│                              ▼                      │
│                      ┌──────────────┐              │
│                      │ Generate IPA │              │
│                      └──────┬───────┘              │
└──────────────────────────────┼──────────────────────┘
                               │
                               │ 2. Auto-submit
                               ▼
                    ┌──────────────────┐
                    │ App Store Connect│
                    │                  │
                    │  ┌────────────┐  │
                    │  │ Processing │  │
                    │  └─────┬──────┘  │
                    │        │         │
                    │        ▼         │
                    │  ┌────────────┐  │
                    │  │ TestFlight │  │
                    │  └─────┬──────┘  │
                    └────────┼─────────┘
                             │
                             │ 3. Beta Testing
                             ▼
                    ┌──────────────────┐
                    │  Beta Testers    │
                    │  (Internal/      │
                    │   External)      │
                    └──────────────────┘
```

### Backend Integration Architecture

```
┌──────────────────────────────────────────────────┐
│           NestSync iOS App (TestFlight)          │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │  Environment Configuration                 │ │
│  │  - EXPO_PUBLIC_GRAPHQL_URL                │ │
│  │  - EXPO_PUBLIC_SUPABASE_URL               │ │
│  │  - EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY     │ │
│  └────────────────┬───────────────────────────┘ │
└───────────────────┼──────────────────────────────┘
                    │
                    │ GraphQL/REST/WebSocket
                    ▼
┌──────────────────────────────────────────────────┐
│         Railway Production Backend               │
│                                                  │
│  ┌──────────────┐  ┌──────────────┐            │
│  │   FastAPI    │  │  PostgreSQL  │            │
│  │   GraphQL    │  │   Database   │            │
│  └──────┬───────┘  └──────────────┘            │
│         │                                       │
│         │          ┌──────────────┐            │
│         └─────────▶│    Redis     │            │
│                    └──────────────┘            │
│                                                 │
│  ┌──────────────┐  ┌──────────────┐           │
│  │   Supabase   │  │    Stripe    │           │
│  │     Auth     │  │   Payments   │           │
│  └──────────────┘  └──────────────┘           │
└──────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. EAS Configuration (`eas.json`)

**Purpose**: Define build profiles for different environments and platforms

**Structure**:
```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "distribution": "store",
      "autoIncrement": true,
      "env": {
        "EXPO_PUBLIC_GRAPHQL_URL": "https://nestsync-api.railway.app/graphql",
        "EXPO_PUBLIC_BACKEND_URL": "https://nestsync-api.railway.app",
        "EXPO_PUBLIC_SUPABASE_URL": "https://your-project.supabase.co",
        "EXPO_PUBLIC_DEV_MODE": "false"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "your-app-store-connect-id",
        "appleTeamId": "your-team-id"
      }
    }
  }
}
```

**Key Features**:
- `development`: For local testing with development client
- `preview`: For internal testing without simulator
- `production`: For TestFlight and App Store with production backend
- `autoIncrement`: Automatically bumps build number
- Environment variables injected at build time

### 2. App Configuration (`app.json`)

**Purpose**: Define app metadata, capabilities, and platform-specific settings

**Required Updates**:
```json
{
  "expo": {
    "name": "NestSync",
    "slug": "nestsync",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.nestsync.app",
      "buildNumber": "1",
      "supportsTablet": true,
      "infoPlist": {
        "NSCameraUsageDescription": "NestSync needs camera access to scan receipts",
        "NSPhotoLibraryUsageDescription": "NestSync needs photo library access to save receipts"
      }
    },
    "extra": {
      "eas": {
        "projectId": "your-eas-project-id"
      }
    }
  }
}
```

**Key Additions**:
- `bundleIdentifier`: Unique iOS app identifier (must be registered in Apple Developer)
- `buildNumber`: Incremented for each TestFlight submission
- `infoPlist`: iOS permission descriptions required by Apple
- `eas.projectId`: Links app to EAS project

### 3. Environment Configuration

**Purpose**: Manage environment-specific variables for different build profiles

**Development Environment** (`.env.local`):
```bash
# Local backend for development
EXPO_PUBLIC_BACKEND_URL=http://10.0.0.236:8001
EXPO_PUBLIC_GRAPHQL_URL=http://10.0.0.236:8001/graphql
EXPO_PUBLIC_SUPABASE_URL=http://localhost:8000
EXPO_PUBLIC_DEV_MODE=true
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**Production Environment** (injected via `eas.json`):
```bash
# Railway production backend
EXPO_PUBLIC_BACKEND_URL=https://nestsync-api.railway.app
EXPO_PUBLIC_GRAPHQL_URL=https://nestsync-api.railway.app/graphql
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_DEV_MODE=false
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

**Environment Variable Loading Strategy**:
1. Local development: Uses `.env.local` file
2. EAS builds: Uses environment variables from `eas.json` build profile
3. Runtime: Access via `process.env.EXPO_PUBLIC_*` or `expo-constants`

### 4. Apple Developer Account Setup

**Purpose**: Authenticate with Apple and manage certificates/profiles

**Required Components**:

1. **Apple ID**: Developer account with App Store Connect access
2. **App Store Connect App**: Created app record with bundle identifier
3. **Certificates**: iOS Distribution Certificate for App Store
4. **Provisioning Profiles**: App Store provisioning profile
5. **App-Specific Password**: For EAS authentication (2FA accounts)

**EAS Credential Management**:
```bash
# Let EAS manage credentials automatically
eas credentials

# Or configure manually
eas credentials:configure-build --platform ios
```

**Credential Storage**:
- EAS stores credentials securely on their servers
- Credentials are reused across builds
- Can be synced with local Xcode credentials if needed

### 5. Build Scripts and Commands

**Purpose**: Provide convenient npm scripts for common EAS operations

**Package.json Scripts**:
```json
{
  "scripts": {
    "build:ios:dev": "eas build --platform ios --profile development",
    "build:ios:preview": "eas build --platform ios --profile preview",
    "build:ios:production": "eas build --platform ios --profile production",
    "submit:ios": "eas submit --platform ios --profile production",
    "build:submit:ios": "eas build --platform ios --profile production --auto-submit"
  }
}
```

**Command Breakdown**:
- `build:ios:dev`: Build for local testing (simulator)
- `build:ios:preview`: Build for internal testing (device)
- `build:ios:production`: Build for TestFlight/App Store
- `submit:ios`: Submit existing build to App Store Connect
- `build:submit:ios`: Build and auto-submit in one command

## Data Models

### Build Configuration Model

```typescript
interface EASBuildProfile {
  distribution: 'internal' | 'store';
  developmentClient?: boolean;
  autoIncrement?: boolean;
  env?: Record<string, string>;
  ios?: {
    simulator?: boolean;
    bundleIdentifier?: string;
    buildNumber?: string;
  };
}

interface EASSubmitProfile {
  ios?: {
    appleId: string;
    ascAppId: string;
    appleTeamId: string;
  };
}

interface EASConfig {
  cli: {
    version: string;
  };
  build: Record<string, EASBuildProfile>;
  submit: Record<string, EASSubmitProfile>;
}
```

### App Metadata Model

```typescript
interface AppStoreMetadata {
  name: string;
  subtitle?: string;
  description: string;
  keywords: string[];
  primaryCategory: 'LIFESTYLE' | 'HEALTH_AND_FITNESS';
  secondaryCategory?: string;
  privacyPolicyUrl: string;
  termsOfServiceUrl: string;
  supportUrl: string;
  marketingUrl?: string;
}

interface AppVersion {
  versionString: string; // e.g., "1.0.0"
  buildNumber: string;   // e.g., "1", "2", "3"
  releaseNotes: string;
  whatsNew: string;
}
```

### Environment Configuration Model

```typescript
interface EnvironmentConfig {
  backendUrl: string;
  graphqlUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  stripePublishableKey: string;
  devMode: boolean;
}

// Runtime access
const config: EnvironmentConfig = {
  backendUrl: process.env.EXPO_PUBLIC_BACKEND_URL!,
  graphqlUrl: process.env.EXPO_PUBLIC_GRAPHQL_URL!,
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  stripePublishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  devMode: process.env.EXPO_PUBLIC_DEV_MODE === 'true',
};
```

## Error Handling

### Build Errors

**Common Build Failures**:

1. **Missing Credentials**
   - Error: "No valid iOS Distribution certificate found"
   - Solution: Run `eas credentials` to generate/upload certificates
   - Prevention: Ensure Apple Developer account is properly configured

2. **Bundle Identifier Mismatch**
   - Error: "Bundle identifier doesn't match provisioning profile"
   - Solution: Verify `bundleIdentifier` in app.json matches App Store Connect
   - Prevention: Use consistent bundle identifier across all configurations

3. **Environment Variable Missing**
   - Error: "Required environment variable EXPO_PUBLIC_GRAPHQL_URL not set"
   - Solution: Add missing variable to eas.json build profile
   - Prevention: Validate environment variables before build

4. **Dependency Installation Failure**
   - Error: "npm install failed"
   - Solution: Check package.json for incompatible dependencies
   - Prevention: Test builds locally before pushing to EAS

**Error Handling Strategy**:
```typescript
// In app startup
async function validateEnvironment() {
  const required = [
    'EXPO_PUBLIC_BACKEND_URL',
    'EXPO_PUBLIC_GRAPHQL_URL',
    'EXPO_PUBLIC_SUPABASE_URL',
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing);
    // Show user-friendly error screen
    return false;
  }
  
  return true;
}
```

### Submission Errors

**Common Submission Failures**:

1. **App Store Connect Rejection**
   - Error: "Missing required metadata"
   - Solution: Complete all required fields in App Store Connect
   - Prevention: Use App Store Connect checklist before submission

2. **Binary Processing Failure**
   - Error: "Invalid binary"
   - Solution: Rebuild with correct signing certificates
   - Prevention: Validate build locally before submission

3. **Privacy Policy Missing**
   - Error: "Privacy policy URL required"
   - Solution: Add privacy policy URL to App Store Connect
   - Prevention: Prepare privacy policy before first submission

**Retry Strategy**:
- Automatic retry for transient network errors (3 attempts)
- Manual retry for configuration errors after fix
- Clear error messages with remediation steps

### Runtime Errors

**Backend Connectivity**:
```typescript
async function checkBackendHealth() {
  try {
    const response = await fetch(`${config.backendUrl}/health`, {
      timeout: 5000,
    });
    
    if (!response.ok) {
      throw new Error(`Backend unhealthy: ${response.status}`);
    }
    
    return true;
  } catch (error) {
    console.error('Backend health check failed:', error);
    // Show user-friendly error message
    Alert.alert(
      'Connection Error',
      'Unable to connect to NestSync servers. Please check your internet connection.',
      [{ text: 'Retry', onPress: () => checkBackendHealth() }]
    );
    return false;
  }
}
```

## Testing Strategy

### Pre-Build Testing

**Local Testing Checklist**:
1. Run app on iOS simulator with local backend
2. Verify all features work with production backend URL
3. Test authentication flow with Supabase
4. Validate Stripe payment integration
5. Check GraphQL queries and subscriptions
6. Test offline behavior and error handling

**Automated Tests**:
```bash
# Run before building
npm run lint
npm run test:visual
# Verify no TypeScript errors
npx tsc --noEmit
```

### TestFlight Testing

**Internal Testing** (1-100 testers):
- Immediate availability after build processing
- No App Review required
- Test with team members and stakeholders
- Validate core functionality and critical paths

**External Testing** (up to 10,000 testers):
- Requires App Review (1-2 days)
- Public link for beta testers
- Collect feedback via TestFlight
- Monitor crash reports and analytics

**Testing Phases**:
1. **Alpha** (Internal): Core team testing (1-2 weeks)
2. **Beta** (External): Limited user testing (2-4 weeks)
3. **Release Candidate**: Final validation before App Store

### Production Validation

**Post-Submission Checklist**:
1. Verify app appears in TestFlight
2. Install on physical device and test
3. Check backend connectivity and authentication
4. Validate payment flows with Stripe
5. Monitor error logs and crash reports
6. Collect user feedback from testers

## Deployment Workflow

### Step-by-Step Process

**1. Pre-Deployment Preparation**
```bash
# Ensure on main branch with latest changes
git checkout main
git pull origin main

# Verify no uncommitted changes
git status

# Run tests
npm run lint
npm test
```

**2. Configure EAS (First Time Only)**
```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to Expo account
eas login

# Initialize EAS in project
cd NestSync-frontend
eas init

# Configure build credentials
eas credentials
```

**3. Update Version Numbers**
```json
// app.json
{
  "expo": {
    "version": "1.0.0",  // Increment for App Store releases
    "ios": {
      "buildNumber": "1"  // Auto-incremented by EAS if autoIncrement: true
    }
  }
}
```

**4. Build for TestFlight**
```bash
# Build and submit in one command
npm run build:submit:ios

# Or build first, then submit
npm run build:ios:production
# Wait for build to complete, then:
npm run submit:ios
```

**5. Monitor Build Progress**
```bash
# Check build status
eas build:list

# View build logs
eas build:view <build-id>
```

**6. TestFlight Distribution**
- Build automatically appears in App Store Connect after processing (10-30 minutes)
- Add internal testers in TestFlight section
- For external testing, submit for Beta App Review
- Share TestFlight link with testers

**7. App Store Submission** (After TestFlight validation)
- Complete App Store Connect metadata
- Upload screenshots and app preview
- Submit for App Review
- Monitor review status (typically 1-3 days)

### Continuous Deployment

**Automated Workflow** (Optional):
```yaml
# .github/workflows/ios-deploy.yml
name: iOS Deployment

on:
  push:
    branches: [main]
    tags: ['v*']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install -g eas-cli
      - run: cd NestSync-frontend && npm install
      - run: eas build --platform ios --profile production --non-interactive
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
```

## Version Management

### Versioning Strategy

**Semantic Versioning**:
- **MAJOR** (1.0.0): Breaking changes, major feature releases
- **MINOR** (1.1.0): New features, backward compatible
- **PATCH** (1.0.1): Bug fixes, minor improvements

**Build Numbers**:
- Incremented for every TestFlight submission
- Independent of version string
- Auto-incremented by EAS when `autoIncrement: true`

**Example Progression**:
```
Version 1.0.0, Build 1  → Initial TestFlight
Version 1.0.0, Build 2  → Bug fix for TestFlight
Version 1.0.0, Build 3  → Final TestFlight before App Store
Version 1.0.0, Build 4  → App Store release
Version 1.0.1, Build 5  → Hotfix release
Version 1.1.0, Build 6  → New feature release
```

### Release Notes Management

**TestFlight Release Notes**:
```typescript
// Store in version-notes.json
{
  "1.0.0": {
    "build": 1,
    "date": "2025-11-11",
    "notes": "Initial TestFlight release\n- Core diaper tracking\n- Inventory management\n- Analytics dashboard"
  }
}
```

**App Store What's New**:
- Maximum 4000 characters
- Highlight new features and improvements
- Keep concise and user-friendly
- Update for each version submission

## Security Considerations

### Credential Management

**Sensitive Data**:
- Apple ID credentials: Stored securely in EAS
- Signing certificates: Managed by EAS, encrypted at rest
- Provisioning profiles: Auto-generated and managed
- API keys: Injected at build time, never committed to git

**Best Practices**:
1. Use app-specific passwords for Apple ID (2FA accounts)
2. Never commit `.env` files with production secrets
3. Use EAS Secrets for sensitive environment variables
4. Rotate credentials periodically
5. Limit access to EAS project to authorized team members

### App Transport Security

**iOS Requirements**:
```json
// app.json - Only if needed for development
{
  "ios": {
    "infoPlist": {
      "NSAppTransportSecurity": {
        "NSAllowsArbitraryLoads": false,
        "NSExceptionDomains": {
          "localhost": {
            "NSExceptionAllowsInsecureHTTPLoads": true
          }
        }
      }
    }
  }
}
```

**Production Configuration**:
- All production endpoints use HTTPS
- WebSocket connections use WSS
- No insecure HTTP loads allowed
- Certificate pinning for sensitive operations (optional)

## Monitoring and Analytics

### Build Monitoring

**EAS Build Insights**:
- Build duration and success rate
- Build queue times
- Error frequency and types
- Platform-specific issues

**Alerts**:
- Email notifications for build completion/failure
- Slack/Discord webhooks for team notifications
- Dashboard for build history and trends

### App Performance

**TestFlight Metrics**:
- Crash reports and diagnostics
- Session duration and frequency
- Device and OS version distribution
- Beta tester feedback

**Production Monitoring**:
- Sentry for error tracking
- Analytics for user behavior
- Backend API performance metrics
- GraphQL query performance

## Documentation Requirements

### Developer Documentation

**Setup Guide** (`docs/deployment/ios-setup.md`):
1. Apple Developer account requirements
2. EAS CLI installation and configuration
3. First-time build setup
4. Troubleshooting common issues

**Deployment Guide** (`docs/deployment/ios-deployment.md`):
1. Pre-deployment checklist
2. Build and submission process
3. TestFlight distribution
4. App Store submission workflow

**Environment Guide** (`docs/deployment/environment-config.md`):
1. Environment variable reference
2. Development vs production configuration
3. Backend endpoint configuration
4. Feature flags and toggles

### User-Facing Documentation

**TestFlight Instructions**:
- How to install TestFlight app
- How to accept beta invitation
- How to provide feedback
- Known issues and workarounds

**App Store Metadata**:
- App description (4000 characters max)
- Keywords for search optimization
- Privacy policy and terms of service
- Support contact information

## Success Criteria

### Technical Success

1. ✅ EAS builds complete successfully without errors
2. ✅ App installs and launches on physical iOS devices
3. ✅ Backend connectivity works with Railway production API
4. ✅ Authentication flow completes successfully
5. ✅ Payment integration works with Stripe
6. ✅ No critical crashes or errors in TestFlight

### Process Success

1. ✅ Build time under 30 minutes
2. ✅ TestFlight availability within 1 hour of build completion
3. ✅ Clear documentation for team members
4. ✅ Repeatable deployment process
5. ✅ Version management system in place

### Business Success

1. ✅ Beta testers can access app via TestFlight
2. ✅ Feedback collection mechanism in place
3. ✅ App Store submission ready after beta testing
4. ✅ Compliance with Apple guidelines
5. ✅ PIPEDA compliance maintained in production

---

**Design Version**: 1.0  
**Last Updated**: 2025-11-11  
**Status**: Ready for Review
