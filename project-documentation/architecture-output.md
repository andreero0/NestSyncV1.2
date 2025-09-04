# NestSync Technical Architecture Specification

## Executive Summary

This document transforms the NestSync product requirements into comprehensive technical specifications for a mobile-first Canadian diaper planning application with advanced AI capabilities. The architecture addresses core business requirements: ML-powered predictive diaper planning, emergency store locator with real-time inventory, OCR-powered receipt processing, advanced analytics with multi-format exports, biometric authentication, multi-retailer price comparison, PIPEDA compliance, and Canadian data sovereignty.

### Key Technical Decisions
- **Frontend**: React Native via Expo with TypeScript, enhanced with Camera SDK for receipt scanning, Maps integration for emergency store finder, Chart Kit for advanced analytics visualization, and Stripe SDK for seamless payment processing
- **Backend**: FastAPI with GraphQL enhanced by sophisticated ML services including SmartNotificationEngine, ReceiptProcessor with OCR capabilities, EmergencyStoreService with real-time inventory checking, and InventoryCalculationEngine with advanced prediction algorithms
- **Database**: Supabase for real-time sync and Canadian data residency, extended with complex data models for multi-location inventory tracking, advanced analytics, emergency workflows, and collaborative caregiver management
- **Architecture Pattern**: Offline-first with eventual consistency and conflict resolution, enhanced with ML model serving infrastructure and real-time external API integrations
- **Security & Compliance**: PIPEDA-compliant data handling with granular consent management, biometric authentication workflows, PCI compliance for payment processing, and advanced encryption for sensitive data
- **External Integrations**: Canadian retailer APIs (Walmart.ca, Amazon.ca, Shoppers Drug Mart), OCR services (Google Vision API, AWS Textract), multi-channel notification services, and Maps API for location services

### Business Context
- **Target**: 10,000 active users within 6 months, enabled by sophisticated AI predictions and emergency features
- **Engagement**: 70% daily active users through smart notifications and gamification, 25% premium conversion via advanced analytics and emergency services
- **Performance**: 98% stockout prevention through ML-powered predictions, $400 CAD annual user savings via receipt processing and bulk optimization, emergency store access within 15 minutes
- **Advanced Capabilities**: OCR receipt processing with 95% accuracy, real-time emergency store inventory checking, predictive notification optimization based on user behavior patterns, comprehensive analytics with exportable reports

---

## System Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  React Native App (iOS/Android)                                │
│  ├── Expo Framework + Camera SDK (Receipt Scanning)           │
│  ├── TypeScript + NativeBase UI + Chart Kit                   │
│  ├── Zustand (App State) + React Query (Server State)         │
│  ├── Maps Integration + Share SDK + Stripe SDK                │
│  ├── Biometric Authentication (Face ID/Touch ID)              │
│  ├── Offline Storage (SQLite + Expo SecureStore)              │
│  └── Real-time Sync Engine + Receipt Image Processing         │
└─────────────────────────────────────────────────────────────────┘
                                 ↕ HTTPS/WSS
┌─────────────────────────────────────────────────────────────────┐
│                        API GATEWAY LAYER                        │
├─────────────────────────────────────────────────────────────────┤
│  FastAPI Application (Python)                                  │
│  ├── GraphQL Endpoint (Query/Mutation/Subscription)           │
│  ├── Authentication Middleware (Supabase JWT + Biometric)     │
│  ├── Rate Limiting & Security + PCI Compliance                │
│  ├── Request/Response Transformation + OCR Processing         │
│  └── Error Handling & Logging + ML Model Serving             │
└─────────────────────────────────────────────────────────────────┘
                                 ↕
┌─────────────────────────────────────────────────────────────────┐
│                       BUSINESS LOGIC LAYER                      │
├─────────────────────────────────────────────────────────────────┤
│  Sophisticated Services                                         │
│  ├── SmartNotificationEngine (ML-powered timing optimization)  │
│  ├── EmergencyStoreService (Real-time inventory + location)   │
│  ├── ReceiptProcessor (OCR + automatic inventory updates)     │
│  ├── InventoryCalculationEngine (Advanced predictions + bulk)  │
│  ├── ConversionOptimizationService (A/B testing + segments)   │
│  ├── AnalyticsExporter (PDF reports + CSV + chart images)     │
│  ├── BiometricAuthService (Enhanced security workflows)       │
│  ├── Advanced Prediction Engine (ML patterns + size changes)  │
│  ├── Multi-Channel Price Comparison Service                   │
│  └── Enhanced User Management & Granular Consent              │
└─────────────────────────────────────────────────────────────────┘
                                 ↕
┌─────────────────────────────────────────────────────────────────┐
│                         DATA LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│  Supabase (Canadian Region) + Advanced Analytics Database      │
│  ├── PostgreSQL with Complex Data Models                      │
│  ├── Real-time Subscriptions + ML Training Data               │
│  ├── Authentication Service + Biometric Token Management      │
│  ├── Row Level Security (RLS) + Audit Trails                 │
│  ├── Edge Functions + ML Model Storage                        │
│  └── Multi-Location Inventory + Emergency Data + OCR Results  │
└─────────────────────────────────────────────────────────────────┘
                                 ↕
┌─────────────────────────────────────────────────────────────────┐
│                      EXTERNAL SERVICES                          │
├─────────────────────────────────────────────────────────────────┤
│  ├── Canadian Retailer APIs (Amazon.ca, Walmart.ca, SDM)     │
│  ├── OCR Services (Google Vision API, AWS Textract)          │
│  ├── Payment Processing (Stripe, Apple Pay, Google Pay)       │
│  ├── Maps APIs (Google Maps, Apple Maps) for Emergency Stores │
│  ├── Multi-Channel Notifications (SendGrid, Twilio, Expo)     │
│  ├── ML/AI Services (TensorFlow Serving, Prediction APIs)     │
│  ├── Currency Conversion + Canadian Tax Calculation           │
│  └── Background Job Processing (Redis + RQ + ML Pipelines)    │
└─────────────────────────────────────────────────────────────────┘
```

### Core Design Principles

1. **Mobile-First**: Optimized for touch interfaces and mobile usage patterns
2. **Offline-First**: Core functionality available without internet connectivity
3. **Privacy-by-Design**: PIPEDA compliance built into data architecture
4. **Real-time Sync**: Collaborative features with immediate consistency
5. **Canadian Sovereignty**: All user data stored in Canadian data centers

---

## System Components

### Frontend Architecture

#### React Native Application Structure

```
src/
├── app/                    # Expo Router app directory
│   ├── (auth)/            # Authentication screens
│   ├── (tabs)/            # Main app navigation
│   └── _layout.tsx        # Root layout
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components (NativeBase)
│   ├── forms/            # Form components (React Hook Form)
│   └── charts/           # Data visualization
├── services/             # API clients and external services
│   ├── api/              # GraphQL queries/mutations
│   ├── storage/          # Local storage abstractions
│   └── sync/             # Offline sync logic
├── stores/               # Zustand state management
│   ├── auth.ts           # Authentication state
│   ├── children.ts       # Child profiles state
│   ├── inventory.ts      # Diaper inventory state
│   └── sync.ts           # Sync status state
├── utils/                # Helper functions
│   ├── predictions.ts    # Usage prediction algorithms
│   ├── privacy.ts        # PIPEDA compliance helpers
│   └── analytics.ts      # Privacy-first analytics
└── types/                # TypeScript definitions
```

#### Key Frontend Components

**1. Authentication Flow**
- Supabase Auth integration with biometric support
- PIPEDA consent management during onboarding
- Secure token storage using Expo SecureStore

**2. Offline-First Data Layer**
- Local SQLite database for core data
- Zustand for immediate UI state
- React Query for server state with offline support
- Conflict resolution for multi-device sync

**3. Real-time Features**
- GraphQL subscriptions via WebSocket
- Optimistic updates for logging actions
- Real-time inventory updates across devices

**4. Advanced UI/UX Components**
- NativeBase component library with custom design tokens and accessibility support
- React Native Camera integration for barcode scanning and receipt photography
- React Native Chart Kit and SVG for sophisticated analytics visualization
- React Native Maps integration for emergency store locator with real-time directions
- React Native Share for multi-format data export functionality
- Stripe Payment SDK with Apple Pay and Google Pay integration
- React Native Reanimated for smooth animations and micro-interactions
- Gesture Handler for intuitive interactions and swipe-to-action patterns
- Haptic feedback for confirmation actions and accessibility enhancement
- React Native RNFS for local receipt image storage and management
- Biometric authentication UI components with fallback options

### Backend Architecture

#### FastAPI Application Structure

```
app/
├── main.py                # FastAPI application entry point
├── graphql/              # GraphQL schema and resolvers
│   ├── schema.py         # Combined GraphQL schema
│   ├── queries.py        # Query resolvers
│   ├── mutations.py      # Mutation resolvers
│   ├── subscriptions.py  # Subscription resolvers
│   └── types/            # GraphQL type definitions
├── models/               # SQLAlchemy models
│   ├── user.py           # User and authentication
│   ├── child.py          # Child profiles
│   ├── diaper_log.py     # Diaper change logs
│   ├── inventory.py      # Inventory tracking
│   └── analytics.py      # Usage patterns
├── services/             # Business logic services
│   ├── prediction/       # Usage and size prediction
│   ├── pricing/          # Price comparison
│   ├── notifications/    # Push notifications
│   ├── analytics/        # Data analysis
│   └── compliance/       # PIPEDA compliance
├── external/             # External service integrations
│   ├── retailers/        # Affiliate API clients
│   ├── pricing/          # Price monitoring
│   └── notifications/    # Push service clients
├── utils/                # Utility functions
│   ├── encryption.py     # Data encryption
│   ├── privacy.py        # Privacy helpers
│   └── validation.py     # Input validation
└── config/               # Configuration management
```

#### Sophisticated Backend Services

**1. SmartNotificationEngine**
- ML-powered notification timing optimization based on user behavior patterns
- Personalized notification content generation using A/B testing
- User engagement pattern recognition and adaptation
- Multi-channel delivery optimization (push, email, SMS)
- Real-time learning from user interaction feedback

**2. EmergencyStoreService**
- Real-time inventory checking across Canadian retailers
- Location-based emergency store finder using Maps APIs
- Emergency escalation workflows with caregiver notifications
- Store availability prediction using historical data
- Route optimization and estimated arrival time calculations

**3. ReceiptProcessor**
- OCR-powered receipt parsing using Google Vision API and AWS Textract
- Automatic product matching and inventory updates
- Purchase price tracking and cost analysis
- Receipt image storage and retrieval using RNFS
- OCR confidence scoring and manual review workflows

**4. InventoryCalculationEngine**
- Advanced ML-based stock predictions using usage pattern analysis
- Bulk purchase optimization algorithms
- Multi-location inventory tracking and transfer management
- Seasonal demand forecasting with Canadian retail calendar integration
- Dynamic reorder point calculation based on lead times and usage variance

**5. ConversionOptimizationService**
- A/B testing framework for premium feature conversion
- User segmentation based on behavior patterns and demographics
- Premium upgrade flow optimization with personalized messaging
- Conversion funnel analysis and optimization recommendations
- Feature usage analytics to identify premium feature candidates

**6. AnalyticsExporter**
- Multi-format export system supporting PDF reports, CSV data, and chart images
- Advanced analytics visualization using Chart Kit integration
- Scheduled report generation and email delivery
- Custom dashboard creation with drag-and-drop interface
- Privacy-compliant analytics with user consent management

**7. BiometricAuthService**
- Enhanced security with fingerprint and face authentication
- Secure biometric token generation and management
- Fallback authentication methods and recovery workflows
- Biometric enrollment and device registration
- Security audit trails for biometric access attempts

**8. Enhanced Prediction Engine**
- Advanced ML models for usage pattern recognition
- Size transition prediction using growth curve analysis
- Seasonal and environmental factor integration
- Prediction accuracy tracking and model retraining
- Multi-child household optimization algorithms

**9. Multi-Channel Price Comparison Service**
- Real-time price monitoring across 15+ Canadian retailers
- Dynamic pricing alerts and deal notifications
- Bulk pricing analysis and savings calculations
- Affiliate link tracking and commission optimization
- Price history analysis and trend prediction

**10. Enhanced User Management & Consent**
- Granular PIPEDA consent management with versioning
- Collaborative caregiver system with role-based permissions
- Advanced privacy controls and data retention policies
- Automated compliance reporting and audit trails
- User rights management (access, rectification, erasure, portability)

### Database Architecture

#### Supabase PostgreSQL Schema

**Core Tables:**

```sql
-- Users table with PIPEDA compliance fields
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- PIPEDA compliance fields
    consent_version VARCHAR(50) NOT NULL,
    consent_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    data_processing_consent BOOLEAN DEFAULT FALSE,
    analytics_consent BOOLEAN DEFAULT FALSE,
    marketing_consent BOOLEAN DEFAULT FALSE,
    
    -- User preferences
    timezone VARCHAR(100) DEFAULT 'America/Toronto',
    notification_preferences JSONB DEFAULT '{}',
    premium_subscription BOOLEAN DEFAULT FALSE,
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Privacy controls
    data_retention_period INTERVAL DEFAULT '2 years',
    last_data_export TIMESTAMP WITH TIME ZONE,
    deletion_requested_at TIMESTAMP WITH TIME ZONE
);

-- Children profiles
CREATE TABLE children (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    birth_date DATE NOT NULL,
    current_diaper_size VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Physical tracking
    weight_grams INTEGER,
    height_cm INTEGER,
    
    -- Preferences
    preferred_brands TEXT[],
    sensitive_skin BOOLEAN DEFAULT FALSE,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE
);

-- Diaper change logs
CREATE TABLE diaper_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    logged_at TIMESTAMP WITH TIME ZONE NOT NULL,
    change_type VARCHAR(20) NOT NULL CHECK (change_type IN ('wet', 'soiled', 'both')),
    
    -- Optional details
    diaper_size VARCHAR(10),
    brand VARCHAR(100),
    notes TEXT,
    
    -- Metadata
    logged_by_user_id UUID REFERENCES users(id),
    sync_status VARCHAR(20) DEFAULT 'synced',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inventory tracking
CREATE TABLE inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    child_id UUID REFERENCES children(id) ON DELETE CASCADE,
    
    -- Product details
    brand VARCHAR(100) NOT NULL,
    size VARCHAR(10) NOT NULL,
    quantity_remaining INTEGER NOT NULL,
    package_count INTEGER NOT NULL,
    
    -- Purchase information
    purchase_date DATE,
    purchase_price DECIMAL(10,2),
    purchase_location VARCHAR(200),
    expiry_date DATE,
    
    -- Tracking
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced usage patterns with ML features
CREATE TABLE usage_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    
    -- Pattern data
    age_weeks INTEGER NOT NULL,
    average_changes_per_day DECIMAL(4,2) NOT NULL,
    diaper_size VARCHAR(10) NOT NULL,
    
    -- Statistical data
    calculated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    sample_size INTEGER NOT NULL,
    confidence_level DECIMAL(3,2),
    standard_deviation DECIMAL(4,2),
    
    -- Advanced metrics
    peak_usage_hours INTEGER[], -- Hours of day with highest usage
    seasonal_variation DECIMAL(3,2), -- Percentage variation by season
    growth_trend VARCHAR(20) CHECK (growth_trend IN ('increasing', 'stable', 'decreasing')),
    
    -- Machine learning features
    features JSONB DEFAULT '{}',
    ml_cluster_id INTEGER, -- For usage pattern clustering
    similarity_score DECIMAL(3,2), -- Similarity to other children
    
    -- Prediction accuracy
    prediction_accuracy DECIMAL(3,2),
    last_prediction_error DECIMAL(4,2),
    model_confidence DECIMAL(3,2),
    
    -- Multi-location tracking
    location_breakdown JSONB DEFAULT '{}', -- Usage by location
    caregiver_patterns JSONB DEFAULT '{}', -- Usage patterns by caregiver
    
    UNIQUE(child_id, age_weeks, diaper_size)
);

-- Reorder recommendations
CREATE TABLE reorder_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    
    -- Recommendation details
    recommended_at TIMESTAMP WITH TIME ZONE NOT NULL,
    recommended_quantity INTEGER NOT NULL,
    recommended_size VARCHAR(10) NOT NULL,
    days_of_cover_remaining INTEGER NOT NULL,
    urgency_level VARCHAR(20) NOT NULL CHECK (urgency_level IN ('low', 'medium', 'high', 'critical')),
    
    -- Product recommendations
    recommended_products JSONB NOT NULL,
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'viewed', 'dismissed', 'purchased')),
    action_taken_at TIMESTAMP WITH TIME ZONE,
    
    -- Feedback
    user_feedback JSONB DEFAULT '{}'
);

-- Price monitoring
CREATE TABLE price_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Product identification
    brand VARCHAR(100) NOT NULL,
    size VARCHAR(10) NOT NULL,
    package_count INTEGER NOT NULL,
    
    -- Retailer information
    retailer_name VARCHAR(100) NOT NULL,
    retailer_sku VARCHAR(200),
    product_url TEXT,
    
    -- Price data
    price_cad DECIMAL(10,2) NOT NULL,
    price_per_100ct DECIMAL(10,2) NOT NULL,
    is_on_sale BOOLEAN DEFAULT FALSE,
    regular_price_cad DECIMAL(10,2),
    
    -- Availability
    in_stock BOOLEAN DEFAULT TRUE,
    shipping_cost DECIMAL(10,2) DEFAULT 0,
    estimated_delivery_days INTEGER,
    
    -- Tracking
    scraped_at TIMESTAMP WITH TIME ZONE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Affiliate information
    affiliate_link TEXT,
    commission_rate DECIMAL(5,4)
);
```

#### Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE diaper_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_patterns ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Children policies
CREATE POLICY "Users can view own children" ON children
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own children" ON children
    FOR ALL USING (auth.uid() = user_id);

-- Diaper logs policies with caregiver support
CREATE POLICY "Users can view logs for their children" ON diaper_logs
    FOR SELECT USING (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM children 
            WHERE children.id = diaper_logs.child_id 
            AND children.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create logs for their children" ON diaper_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM children 
            WHERE children.id = child_id 
            AND children.user_id = auth.uid()
        )
    );
```

#### Real-time Subscriptions

```sql
-- Create publication for real-time features
CREATE PUBLICATION nestsync_realtime FOR ALL TABLES;

-- Configure real-time for specific tables
ALTER TABLE diaper_logs REPLICA IDENTITY FULL;
ALTER TABLE inventory_items REPLICA IDENTITY FULL;
ALTER TABLE reorder_recommendations REPLICA IDENTITY FULL;
```

---

## API Design & Contracts

### GraphQL Schema

#### Query Types

```graphql
type Query {
  # User and authentication
  currentUser: User
  userBiometricStatus: BiometricAuthStatus!
  
  # Children management
  children: [Child!]!
  child(id: ID!): Child
  
  # Diaper logs
  diaperLogs(childId: ID!, limit: Int = 50, offset: Int = 0): DiaperLogConnection!
  recentLogs(childId: ID!, days: Int = 7): [DiaperLog!]!
  
  # Multi-location inventory and predictions
  inventory(userId: ID!, locationId: ID): [InventoryItem!]!
  inventoryLocations(userId: ID!): [InventoryLocation!]!
  daysOfCover(childId: ID!, locationId: ID): DaysOfCoverResult!
  reorderRecommendations(userId: ID!, urgencyFilter: UrgencyLevel): [ReorderRecommendation!]!
  bulkOptimizationSuggestions(userId: ID!): [BulkPurchaseRecommendation!]!
  
  # Advanced price comparison and emergency store finder
  priceComparison(brand: String!, size: String!, quantity: Int!): [PriceOption!]!
  emergencyStores(latitude: Float!, longitude: Float!, radiusKm: Int = 25): [EmergencyStore!]!
  realTimeInventoryCheck(storeId: ID!, productSpecs: ProductSpecInput!): StoreInventoryResult!
  
  # Receipt processing and OCR
  receipts(userId: ID!, status: ReceiptStatus, limit: Int = 20): [Receipt!]!
  receipt(id: ID!): Receipt!
  receiptProcessingStatus(receiptId: ID!): ReceiptProcessingStatus!
  
  # Advanced analytics and ML predictions
  usagePatterns(childId: ID!, timeframe: TimeFrame!): UsageAnalytics!
  mlPredictions(childId: ID!, predictionTypes: [PredictionType!]): [MLPrediction!]!
  predictionAccuracyReport(childId: ID!, period: Period!): PredictionAccuracyReport!
  costSavings(userId: ID!, period: Period!): CostSavingsReport!
  analyticsExport(userId: ID!, format: ExportFormat!, timeRange: DateRange!): AnalyticsExport!
  
  # Emergency alerts and notifications
  emergencyAlerts(userId: ID!, status: AlertStatus): [EmergencyAlert!]!
  notificationOptimizationStatus(userId: ID!): NotificationOptimization!
  
  # Caregiver collaboration
  caregivers(userId: ID!): [CaregiverRelationship!]!
  caregiverInvitations(userId: ID!): [CaregiverInvitation!]!
  
  # Premium features
  subscriptionStatus(userId: ID!): SubscriptionDetails!
  featureAccess(userId: ID!): FeatureAccessMap!
  conversionOpportunities(userId: ID!): [ConversionOpportunity!]!
}

type Mutation {
  # Enhanced authentication
  signUp(input: SignUpInput!): AuthResult!
  signIn(input: SignInInput!): AuthResult!
  signInWithBiometric(biometricData: BiometricInput!): AuthResult!
  signOut: Boolean!
  setupBiometricAuth(input: BiometricSetupInput!): BiometricSetupResult!
  
  # User management
  updateUser(input: UpdateUserInput!): User!
  updateConsent(input: ConsentInput!): User!
  deleteAccount: Boolean!
  requestDataExport(format: ExportFormat!): DataExportResult!
  
  # Child management
  createChild(input: CreateChildInput!): Child!
  updateChild(id: ID!, input: UpdateChildInput!): Child!
  deleteChild(id: ID!): Boolean!
  
  # Diaper logging
  logDiaperChange(input: DiaperLogInput!): DiaperLog!
  updateDiaperLog(id: ID!, input: UpdateDiaperLogInput!): DiaperLog!
  deleteDiaperLog(id: ID!): Boolean!
  
  # Multi-location inventory management
  createInventoryLocation(input: InventoryLocationInput!): InventoryLocation!
  updateInventory(input: UpdateInventoryInput!): [InventoryItem!]!
  addInventoryItem(input: AddInventoryInput!): InventoryItem!
  transferInventory(input: InventoryTransferInput!): InventoryTransferResult!
  removeInventoryItem(id: ID!): Boolean!
  
  # Receipt processing
  uploadReceipt(input: ReceiptUploadInput!): Receipt!
  processReceiptOCR(receiptId: ID!): ReceiptProcessingResult!
  reviewReceiptItem(receiptItemId: ID!, input: ReceiptItemReviewInput!): ReceiptItem!
  confirmReceiptProcessing(receiptId: ID!): Boolean!
  
  # Emergency alerts and store finder
  createEmergencyAlert(input: EmergencyAlertInput!): EmergencyAlert!
  acknowledgeAlert(alertId: ID!): EmergencyAlert!
  resolveAlert(alertId: ID!, resolution: AlertResolutionInput!): EmergencyAlert!
  findEmergencyStores(input: EmergencyStoreSearchInput!): [EmergencyStore!]!
  
  # Advanced recommendations and ML
  dismissRecommendation(id: ID!): Boolean!
  provideFeedback(recommendationId: ID!, feedback: FeedbackInput!): Boolean!
  requestBulkOptimization(input: BulkOptimizationInput!): [BulkPurchaseRecommendation!]!
  updateMLPreferences(input: MLPreferencesInput!): MLPreferences!
  
  # Caregiver collaboration
  inviteCaregiver(input: CaregiverInviteInput!): CaregiverInvitation!
  acceptCaregiverInvitation(invitationId: ID!): CaregiverRelationship!
  updateCaregiverPermissions(relationshipId: ID!, permissions: CaregiverPermissionsInput!): CaregiverRelationship!
  removeCaregiverAccess(relationshipId: ID!): Boolean!
  
  # Premium features and payments
  subscribeToPremium(input: SubscriptionInput!): SubscriptionResult!
  updatePaymentMethod(input: PaymentMethodInput!): PaymentMethodResult!
  cancelSubscription(reason: String): SubscriptionResult!
  shareChildAccess(childId: ID!, email: String!, role: CaregiverRole!): SharingResult!
  
  # Analytics and exports
  generateAnalyticsReport(input: AnalyticsReportInput!): AnalyticsReport!
  scheduleRecurringReport(input: RecurringReportInput!): RecurringReportSchedule!
  
  # Notification optimization
  updateNotificationPreferences(input: NotificationPreferencesInput!): NotificationOptimization!
  optInToNotificationOptimization(userId: ID!): NotificationOptimization!
}

type Subscription {
  # Real-time updates
  diaperLogAdded(childId: ID!): DiaperLog!
  inventoryUpdated(userId: ID!, locationId: ID): InventoryItem!
  recommendationCreated(userId: ID!): ReorderRecommendation!
  
  # Emergency alerts and notifications
  emergencyAlertCreated(userId: ID!): EmergencyAlert!
  emergencyStoreAvailable(userId: ID!, alertId: ID!): EmergencyStoreUpdate!
  
  # Receipt processing updates
  receiptProcessingUpdate(userId: ID!): ReceiptProcessingUpdate!
  ocrProcessingComplete(receiptId: ID!): Receipt!
  
  # ML predictions and accuracy updates
  predictionUpdated(childId: ID!): MLPrediction!
  accuracyReportAvailable(childId: ID!): PredictionAccuracyUpdate!
  
  # Advanced collaboration features
  childUpdated(childId: ID!): Child!
  caregiverActivityAdded(childId: ID!): CaregiverActivity!
  caregiverInvitationReceived(userId: ID!): CaregiverInvitation!
  inventoryTransferCompleted(userId: ID!): InventoryTransfer!
  
  # Smart notifications
  smartNotificationOptimized(userId: ID!): NotificationOptimization!
  
  # Premium feature updates
  subscriptionStatusChanged(userId: ID!): SubscriptionDetails!
  featureAccessUpdated(userId: ID!): FeatureAccessMap!
}
```

#### Core Types

```graphql
type User {
  id: ID!
  email: String!
  createdAt: DateTime!
  updatedAt: DateTime!
  
  # Consent and privacy
  consentVersion: String!
  consentTimestamp: DateTime!
  dataProcessingConsent: Boolean!
  analyticsConsent: Boolean!
  marketingConsent: Boolean!
  
  # Preferences
  timezone: String!
  notificationPreferences: NotificationPreferences!
  premiumSubscription: Boolean!
  subscriptionExpiresAt: DateTime
  
  # Related data
  children: [Child!]!
  inventory: [InventoryItem!]!
}

type Child {
  id: ID!
  userId: ID!
  name: String!
  birthDate: Date!
  currentDiaperSize: String!
  createdAt: DateTime!
  updatedAt: DateTime!
  
  # Physical tracking
  weightGrams: Int
  heightCm: Int
  
  # Preferences
  preferredBrands: [String!]!
  sensitiveSkin: Boolean!
  
  # Calculated fields
  ageWeeks: Int!
  ageMonths: Int!
  daysOfCover: DaysOfCoverResult!
  recentLogs: [DiaperLog!]!
  usagePattern: UsagePattern
  nextRecommendation: ReorderRecommendation
}

type DiaperLog {
  id: ID!
  childId: ID!
  userId: ID!
  loggedAt: DateTime!
  changeType: ChangeType!
  
  # Optional details
  diaperSize: String
  brand: String
  notes: String
  
  # Metadata
  loggedByUserId: ID
  syncStatus: SyncStatus!
  createdAt: DateTime!
  
  # Relations
  child: Child!
  loggedBy: User
}

type InventoryItem {
  id: ID!
  userId: ID!
  childId: ID
  
  # Product details
  brand: String!
  size: String!
  quantityRemaining: Int!
  packageCount: Int!
  
  # Purchase information
  purchaseDate: Date
  purchasePrice: Decimal
  purchaseLocation: String
  expiryDate: Date
  
  # Calculated
  daysOfCoverContributed: Int!
  costPerChange: Decimal
}

type ReorderRecommendation {
  id: ID!
  userId: ID!
  childId: ID!
  recommendedAt: DateTime!
  
  # Recommendation details
  recommendedQuantity: Int!
  recommendedSize: String!
  daysOfCoverRemaining: Int!
  urgencyLevel: UrgencyLevel!
  
  # Products
  recommendedProducts: [ProductRecommendation!]!
  
  # Status
  status: RecommendationStatus!
  actionTakenAt: DateTime
  userFeedback: FeedbackData
}

type ProductRecommendation {
  brand: String!
  size: String!
  packageCount: Int!
  priceCAD: Decimal!
  pricePer100ct: Decimal!
  retailerName: String!
  productUrl: String!
  affiliateLink: String!
  inStock: Boolean!
  estimatedDeliveryDays: Int!
  isOnSale: Boolean!
  savings: Decimal
}

type DaysOfCoverResult {
  currentStock: Int!
  dailyUsage: Decimal!
  daysRemaining: Int!
  reorderDate: Date!
  stockoutRisk: StockoutRisk!
  recommendations: [String!]!
}

# Input types
input CreateChildInput {
  name: String!
  birthDate: Date!
  currentDiaperSize: String!
  weightGrams: Int
  preferredBrands: [String!]
  sensitiveSkin: Boolean = false
}

input DiaperLogInput {
  childId: ID!
  loggedAt: DateTime
  changeType: ChangeType!
  diaperSize: String
  brand: String
  notes: String
}

input UpdateInventoryInput {
  items: [InventoryItemInput!]!
}

input InventoryItemInput {
  id: ID
  brand: String!
  size: String!
  quantityRemaining: Int!
  packageCount: Int!
  purchaseDate: Date
  purchasePrice: Decimal
}

# Enums
enum ChangeType {
  WET
  SOILED
  BOTH
}

enum UrgencyLevel {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum RecommendationStatus {
  PENDING
  VIEWED
  DISMISSED
  PURCHASED
}

enum StockoutRisk {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum CaregiverRole {
  VIEWER
  LOGGER
  PURCHASER
  ADMIN
}
```

### REST API Endpoints (Non-GraphQL)

#### Authentication Endpoints

```
POST /auth/signup
POST /auth/signin
POST /auth/signout
POST /auth/refresh
GET  /auth/user
```

#### Health and Status

```
GET  /health
GET  /status
GET  /metrics (admin only)
```

#### Webhook Endpoints

```
POST /webhooks/stripe
POST /webhooks/retailers
POST /webhooks/notifications
```

### API Response Examples

#### Query: Get Child with Current Status

```graphql
query GetChildStatus($childId: ID!) {
  child(id: $childId) {
    id
    name
    ageWeeks
    currentDiaperSize
    daysOfCover {
      currentStock
      dailyUsage
      daysRemaining
      reorderDate
      stockoutRisk
      recommendations
    }
    recentLogs(days: 3) {
      id
      loggedAt
      changeType
    }
    nextRecommendation {
      urgencyLevel
      recommendedQuantity
      recommendedProducts {
        brand
        priceCAD
        pricePer100ct
        retailerName
        affiliateLink
        inStock
      }
    }
  }
}
```

Response:
```json
{
  "data": {
    "child": {
      "id": "child_123",
      "name": "Emma",
      "ageWeeks": 8,
      "currentDiaperSize": "2",
      "daysOfCover": {
        "currentStock": 24,
        "dailyUsage": 8.2,
        "daysRemaining": 3,
        "reorderDate": "2024-01-15",
        "stockoutRisk": "MEDIUM",
        "recommendations": [
          "Reorder within 2 days to avoid stockout",
          "Consider bulk purchase for better pricing"
        ]
      },
      "recentLogs": [
        {
          "id": "log_456",
          "loggedAt": "2024-01-12T14:30:00Z",
          "changeType": "WET"
        }
      ],
      "nextRecommendation": {
        "urgencyLevel": "MEDIUM",
        "recommendedQuantity": 140,
        "recommendedProducts": [
          {
            "brand": "Pampers",
            "priceCAD": 54.99,
            "pricePer100ct": 39.28,
            "retailerName": "Amazon.ca",
            "affiliateLink": "https://amazon.ca/...",
            "inStock": true
          }
        ]
      }
    }
  }
}
```

#### Mutation: Log Diaper Change

```graphql
mutation LogDiaperChange($input: DiaperLogInput!) {
  logDiaperChange(input: $input) {
    id
    loggedAt
    changeType
    child {
      daysOfCover {
        daysRemaining
        stockoutRisk
      }
    }
  }
}
```

Variables:
```json
{
  "input": {
    "childId": "child_123",
    "changeType": "WET",
    "loggedAt": "2024-01-12T15:00:00Z"
  }
}
```

Response:
```json
{
  "data": {
    "logDiaperChange": {
      "id": "log_789",
      "loggedAt": "2024-01-12T15:00:00Z",
      "changeType": "WET",
      "child": {
        "daysOfCover": {
          "daysRemaining": 2,
          "stockoutRisk": "HIGH"
        }
      }
    }
  }
}
```

---

## External Services Integration\n\nNestSync integrates with numerous external services to provide sophisticated functionality while maintaining Canadian data sovereignty and PIPEDA compliance.\n\n### Canadian Retailer APIs\n\n**Amazon.ca Integration**\n- Product Advertising API for real-time pricing and availability\n- Inventory checking via Amazon MWS API for emergency situations\n- Affiliate link generation and commission tracking\n- Prime delivery estimation for urgent orders\n\n**Walmart.ca Integration**\n- Walmart Open API for product catalog and pricing\n- Store locator API for pickup availability\n- Real-time inventory checking for emergency purchases\n- Click & collect integration for convenient pickup\n\n**Shoppers Drug Mart Integration**\n- PC Health API for pharmacy locations and 24/7 availability\n- Real-time inventory for emergency diaper needs\n- Optimum Points integration for rewards tracking\n- Emergency store locator for critical situations\n\n### OCR and Document Processing\n\n**Google Vision API Integration**\n- Optical Character Recognition for receipt processing\n- Text extraction with confidence scoring\n- Line item detection and parsing\n- Canadian receipt format optimization\n\n**AWS Textract Integration (Fallback)**\n- Secondary OCR processing for improved accuracy\n- Table and form detection for structured receipts\n- Canadian data residency compliance\n\n### Payment Processing Integration\n\n**Stripe Integration with Canadian Support**\n- Credit/debit card processing with Canadian banks\n- Apple Pay and Google Pay integration\n- Interac e-Transfer support\n- PCI DSS compliance for secure transactions\n- Automatic Canadian tax calculations\n- Multi-currency support (CAD primary)\n\n### Maps and Location Services\n\n**Google Maps Integration**\n- Emergency store finder with real-time directions\n- Store hours and availability checking\n- Distance calculation and route optimization\n- Canadian location data prioritization\n\n**Apple Maps Integration (iOS)**\n- Native iOS integration for seamless experience\n- Turn-by-turn navigation to emergency stores\n- Real-time traffic and estimated arrival times\n\n### Multi-Channel Notification Services\n\n**SendGrid Email Integration**\n- Transactional email delivery\n- PIPEDA-compliant email marketing\n- Emergency alert notifications\n- Automated report delivery\n\n**Twilio SMS Integration**\n- Emergency SMS notifications\n- Canadian phone number support\n- Opt-in/opt-out management\n- Delivery status tracking\n\n**Expo Push Notifications**\n- Cross-platform push notifications\n- Real-time alert delivery\n- Personalized messaging\n- Smart timing optimization\n\n### ML and AI Services\n\n**TensorFlow Serving**\n- Usage pattern prediction models\n- Size transition forecasting\n- Bulk purchase optimization\n- Notification timing optimization\n\n**Custom ML Pipeline**\n- Canadian usage pattern training data\n- Privacy-preserving federated learning\n- Real-time model serving\n- Prediction accuracy monitoring\n\n### Canadian Tax and Compliance Services\n\n**Provincial Tax Calculation**\n- GST/HST calculation by province\n- PST calculation where applicable\n- Real-time tax rate updates\n- Receipt tax breakdown analysis\n\n**Currency and Exchange Services**\n- CAD-focused pricing optimization\n- Cross-border price comparison\n- Exchange rate monitoring\n- Regional pricing adjustments\n\n---\n\n## Security & Compliance Implementation

### PIPEDA Compliance Framework

#### Data Minimization Principles

1. **Collection Limitation**
   - Only collect data necessary for core functionality
   - Clear purpose statement for each data field
   - User consent required before collection

2. **Use Limitation**
   - Data used only for stated purposes
   - No secondary use without explicit consent
   - Clear retention policies

3. **Transparency Requirements**
   - Privacy policy in plain language
   - Data collection notifications
   - Regular consent reviews

#### Consent Management System

```typescript
interface ConsentData {
  consentVersion: string;
  consentTimestamp: Date;
  
  // Granular consent types
  dataProcessingConsent: boolean;    // Core functionality
  analyticsConsent: boolean;         // Usage analytics
  marketingConsent: boolean;         // Marketing communications
  sharingConsent: boolean;           // Caregiver sharing
  
  // Specific purposes
  predictionAnalytics: boolean;      // Usage pattern analysis
  priceComparison: boolean;          // Retailer price data
  notificationPersonalization: boolean; // Smart notifications
}

interface DataRetentionPolicy {
  userId: string;
  retentionPeriod: number; // months
  automaticDeletion: boolean;
  deletionDate?: Date;
  
  // Granular retention
  logsRetention: number;       // Diaper change logs
  analyticsRetention: number;  // Usage patterns
  accountRetention: number;    // Account data
}
```

#### User Rights Implementation

```typescript
class UserRightsService {
  // Right to Access
  async exportUserData(userId: string): Promise<UserDataExport> {
    return {
      personalData: await this.getPersonalData(userId),
      childrenData: await this.getChildrenData(userId),
      logsData: await this.getLogsData(userId),
      preferencesData: await this.getPreferencesData(userId),
      
      exportDate: new Date(),
      format: 'JSON',
      completeness: 'FULL'
    };
  }
  
  // Right to Rectification
  async updateUserData(userId: string, updates: UserDataUpdates): Promise<void> {
    await this.validateUpdates(updates);
    await this.applyUpdates(userId, updates);
    await this.notifyOfChanges(userId, updates);
  }
  
  // Right to Erasure (Right to be Forgotten)
  async deleteUserAccount(userId: string, reason: string): Promise<void> {
    // Soft delete with grace period
    await this.markForDeletion(userId, reason);
    await this.scheduleDataDeletion(userId, 30); // 30-day grace period
    await this.notifyDeletionScheduled(userId);
  }
  
  // Right to Data Portability
  async generateDataPortabilityExport(userId: string): Promise<PortableDataExport> {
    return {
      standardFormat: 'JSON-LD',
      data: await this.getPortableData(userId),
      machineReadable: true,
      transferReady: true
    };
  }
}
```

### Encryption Implementation

#### Data Encryption Strategy

1. **Data at Rest**
   - AES-256 encryption for sensitive fields
   - Encrypted database storage
   - Encrypted backups

2. **Data in Transit**
   - TLS 1.3 for all API communications
   - Certificate pinning in mobile app
   - End-to-end encryption for sensitive operations

3. **Application-Level Encryption**

```typescript
class EncryptionService {
  private encryptionKey: string;
  
  async encryptSensitiveData(data: any): Promise<EncryptedData> {
    const plaintext = JSON.stringify(data);
    const encrypted = await this.encrypt(plaintext, this.encryptionKey);
    
    return {
      encryptedData: encrypted,
      algorithm: 'AES-256-GCM',
      keyVersion: this.getKeyVersion(),
      timestamp: new Date()
    };
  }
  
  async decryptSensitiveData(encryptedData: EncryptedData): Promise<any> {
    const decrypted = await this.decrypt(
      encryptedData.encryptedData, 
      this.encryptionKey
    );
    return JSON.parse(decrypted);
  }
  
  // Field-level encryption for PII
  async encryptPII(field: string, value: string): Promise<string> {
    const salt = await this.generateSalt();
    return this.encryptField(value, salt);
  }
}
```

#### Key Management

```typescript
interface KeyManagementConfig {
  provider: 'AWS_KMS' | 'AZURE_KEY_VAULT' | 'LOCAL';
  keyRotationPeriod: number; // days
  keyVersions: KeyVersion[];
  
  canadianSovereignty: {
    keyStorageLocation: 'CANADA_CENTRAL';
    complianceCertification: 'SOC2_TYPE2';
  };
}
```

### Authentication & Authorization

#### JWT Token Structure

```typescript
interface NestSyncJWT {
  // Standard claims
  sub: string;    // User ID
  iat: number;    // Issued at
  exp: number;    // Expiration
  aud: string;    // Audience (nestsync-app)
  iss: string;    // Issuer (nestsync-api)
  
  // Custom claims
  role: 'user' | 'admin' | 'caregiver';
  permissions: Permission[];
  premium: boolean;
  children_access: string[]; // Child IDs user can access
  
  // Privacy controls
  consent_version: string;
  data_processing_consent: boolean;
  last_consent_update: number;
}

enum Permission {
  READ_OWN_DATA = 'read:own_data',
  WRITE_OWN_DATA = 'write:own_data',
  READ_CHILD_DATA = 'read:child_data',
  WRITE_CHILD_DATA = 'write:child_data',
  MANAGE_CAREGIVERS = 'manage:caregivers',
  EXPORT_DATA = 'export:data',
  DELETE_ACCOUNT = 'delete:account'
}
```

#### Biometric Authentication

```typescript
class BiometricAuthService {
  async setupBiometricAuth(userId: string): Promise<BiometricSetupResult> {
    const isAvailable = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    
    if (!isAvailable || !isEnrolled) {
      return { success: false, reason: 'BIOMETRIC_NOT_AVAILABLE' };
    }
    
    const biometricKey = await this.generateBiometricKey(userId);
    await SecureStore.setItemAsync(`biometric_${userId}`, biometricKey);
    
    return { success: true, method: 'fingerprint' };
  }
  
  async authenticateWithBiometrics(userId: string): Promise<AuthResult> {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock NestSync',
      cancelLabel: 'Use PIN instead',
      fallbackLabel: 'Use PIN'
    });
    
    if (result.success) {
      const biometricKey = await SecureStore.getItemAsync(`biometric_${userId}`);
      return await this.validateBiometricSession(userId, biometricKey);
    }
    
    return { success: false, error: 'BIOMETRIC_AUTH_FAILED' };
  }
}
```

---

## Infrastructure & Deployment

### Deployment Architecture

#### Railway Deployment Configuration

```dockerfile
# Dockerfile for FastAPI Backend
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd --create-home --shell /bin/bash nestsync
RUN chown -R nestsync:nestsync /app
USER nestsync

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### Railway Configuration

```toml
# railway.toml
[build]
builder = "dockerfile"
dockerfilePath = "Dockerfile"

[deploy]
startCommand = "uvicorn main:app --host 0.0.0.0 --port $PORT"
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3

[env]
ENVIRONMENT = "production"
DATABASE_URL = "${{ Postgres.DATABASE_URL }}"
REDIS_URL = "${{ Redis.REDIS_URL }}"
SUPABASE_URL = "${{ secrets.SUPABASE_URL }}"
SUPABASE_ANON_KEY = "${{ secrets.SUPABASE_ANON_KEY }}"
JWT_SECRET = "${{ secrets.JWT_SECRET }}"
SENTRY_DSN = "${{ secrets.SENTRY_DSN }}"
```

#### Environment Configuration

```python
# config/settings.py
from pydantic import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Application
    app_name: str = "NestSync API"
    environment: str = "production"
    debug: bool = False
    
    # Database
    database_url: str
    database_pool_size: int = 20
    database_max_overflow: int = 30
    
    # Supabase
    supabase_url: str
    supabase_anon_key: str
    supabase_service_key: str
    
    # Redis
    redis_url: str
    redis_pool_size: int = 10
    
    # Security
    jwt_secret: str
    jwt_expiry_hours: int = 24
    encryption_key: str
    
    # External Services
    openai_api_key: Optional[str] = None
    sentry_dsn: Optional[str] = None
    
    # Canadian compliance
    data_region: str = "canada-central"
    data_retention_months: int = 24
    
    # Rate limiting
    rate_limit_requests_per_minute: int = 100
    rate_limit_burst: int = 200
    
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()
```

### CI/CD Pipeline

#### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to Railway

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: nestsync_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
    
    - name: Install dependencies
      run: |
        pip install -r requirements.txt
        pip install -r requirements-dev.txt
    
    - name: Run linting
      run: |
        flake8 app/
        black --check app/
        mypy app/
    
    - name: Run tests
      env:
        DATABASE_URL: postgresql://postgres:test@localhost:5432/nestsync_test
        REDIS_URL: redis://localhost:6379
      run: |
        pytest --cov=app --cov-report=xml
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage.xml

  security-scan:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Run security scan
      uses: securecodewarrior/github-action-add-sarif@v1
      with:
        sarif-file: security-scan-results.sarif
    
    - name: Dependency scan
      run: |
        pip install safety
        safety check -r requirements.txt

  deploy:
    needs: [test, security-scan]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to Railway
      uses: railway-app/railway-action@v1
      with:
        railway-token: ${{ secrets.RAILWAY_TOKEN }}
        command: up --detach
    
    - name: Notify deployment
      uses: 8398a7/action-slack@v3
      with:
        status: ${{ job.status }}
        webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

#### Mobile App Build Pipeline

```yaml
# .github/workflows/mobile.yml
name: Mobile App Build

on:
  push:
    branches: [main, develop]
    paths: ['mobile/**']

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: mobile/package-lock.json
    
    - name: Install dependencies
      working-directory: ./mobile
      run: npm ci
    
    - name: Run linting
      working-directory: ./mobile
      run: npm run lint
    
    - name: Run type checking
      working-directory: ./mobile
      run: npm run type-check
    
    - name: Run tests
      working-directory: ./mobile
      run: npm run test:coverage
    
    - name: Setup Expo CLI
      run: npm install -g @expo/cli
    
    - name: Build for preview
      working-directory: ./mobile
      if: github.ref != 'refs/heads/main'
      run: |
        expo build:preview --platform all --non-interactive
    
    - name: Build for production
      working-directory: ./mobile
      if: github.ref == 'refs/heads/main'
      run: |
        expo build:production --platform all --non-interactive
      env:
        EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
```

### Monitoring & Observability

#### Application Monitoring

```python
# monitoring/setup.py
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
from sentry_sdk.integrations.redis import RedisIntegration

def setup_monitoring():
    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        environment=settings.environment,
        traces_sample_rate=0.1,
        profiles_sample_rate=0.1,
        integrations=[
            FastApiIntegration(auto_enabling_integrations=True),
            SqlalchemyIntegration(),
            RedisIntegration(),
        ],
        before_send=privacy_filter,
    )

def privacy_filter(event, hint):
    """Filter sensitive data from error reports"""
    if 'request' in event:
        request = event['request']
        
        # Remove sensitive headers
        if 'headers' in request:
            sensitive_headers = ['authorization', 'x-api-key', 'cookie']
            for header in sensitive_headers:
                if header in request['headers']:
                    request['headers'][header] = '[FILTERED]'
        
        # Remove sensitive query parameters
        if 'query_string' in request:
            sensitive_params = ['token', 'key', 'secret']
            # Filter logic here
    
    return event
```

#### Health Checks

```python
# health/checks.py
from typing import Dict, Any
import asyncio
import time

class HealthCheckService:
    async def check_health(self) -> Dict[str, Any]:
        checks = {
            'database': await self.check_database(),
            'redis': await self.check_redis(),
            'supabase': await self.check_supabase(),
            'external_apis': await self.check_external_apis(),
        }
        
        overall_status = 'healthy' if all(
            check['status'] == 'healthy' for check in checks.values()
        ) else 'unhealthy'
        
        return {
            'status': overall_status,
            'timestamp': time.time(),
            'version': settings.app_version,
            'checks': checks
        }
    
    async def check_database(self) -> Dict[str, Any]:
        try:
            start_time = time.time()
            # Simple query to test connection
            await database.fetch_one("SELECT 1")
            response_time = time.time() - start_time
            
            return {
                'status': 'healthy',
                'response_time_ms': int(response_time * 1000),
                'connection_pool': {
                    'active': database.get_active_connections(),
                    'idle': database.get_idle_connections()
                }
            }
        except Exception as e:
            return {
                'status': 'unhealthy',
                'error': str(e)
            }
    
    async def check_redis(self) -> Dict[str, Any]:
        try:
            start_time = time.time()
            await redis.ping()
            response_time = time.time() - start_time
            
            return {
                'status': 'healthy',
                'response_time_ms': int(response_time * 1000),
                'memory_usage': await redis.info('memory')
            }
        except Exception as e:
            return {
                'status': 'unhealthy',
                'error': str(e)
            }
```

### Performance Optimization

#### Database Optimization

```sql
-- Performance indexes
CREATE INDEX CONCURRENTLY idx_diaper_logs_child_logged_at 
ON diaper_logs(child_id, logged_at DESC);

CREATE INDEX CONCURRENTLY idx_diaper_logs_user_created_at 
ON diaper_logs(user_id, created_at DESC);

CREATE INDEX CONCURRENTLY idx_inventory_user_updated 
ON inventory_items(user_id, updated_at DESC);

CREATE INDEX CONCURRENTLY idx_price_data_brand_size_scraped 
ON price_data(brand, size, scraped_at DESC);

-- Partial indexes for active data
CREATE INDEX CONCURRENTLY idx_children_active 
ON children(user_id, updated_at DESC) 
WHERE is_active = true;

CREATE INDEX CONCURRENTLY idx_inventory_current 
ON inventory_items(user_id, child_id, updated_at DESC) 
WHERE quantity_remaining > 0;
```

#### Caching Strategy

```python
# caching/strategy.py
from typing import Optional, Any
import redis
import json
from datetime import timedelta

class CacheManager:
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
    
    async def cache_user_data(self, user_id: str, data: Any, ttl: int = 3600):
        """Cache user-specific data with privacy considerations"""
        cache_key = f"user:{user_id}:data"
        
        # Only cache non-sensitive data
        cacheable_data = self.filter_sensitive_data(data)
        
        await self.redis.setex(
            cache_key, 
            ttl, 
            json.dumps(cacheable_data, default=str)
        )
    
    async def cache_prediction(self, child_id: str, prediction: Any, ttl: int = 7200):
        """Cache prediction results"""
        cache_key = f"prediction:{child_id}"
        await self.redis.setex(
            cache_key,
            ttl,
            json.dumps(prediction, default=str)
        )
    
    async def cache_price_data(self, product_key: str, prices: Any, ttl: int = 1800):
        """Cache price comparison data (30 minutes)"""
        cache_key = f"prices:{product_key}"
        await self.redis.setex(
            cache_key,
            ttl,
            json.dumps(prices, default=str)
        )
    
    def filter_sensitive_data(self, data: Any) -> Any:
        """Remove sensitive data before caching"""
        if isinstance(data, dict):
            sensitive_fields = [
                'email', 'phone', 'address', 'payment_info',
                'exact_location', 'ip_address'
            ]
            return {
                k: v for k, v in data.items() 
                if k not in sensitive_fields
            }
        return data
```

---

## Team Handoffs & Implementation Guide

### Backend Team Deliverables

#### Phase 1: Core Infrastructure (Weeks 1-4)

**Database Setup**
- [ ] Set up Supabase instance in Canadian region
- [ ] Implement database schema with RLS policies
- [ ] Configure real-time subscriptions
- [ ] Set up automated backups and disaster recovery

**FastAPI Application**
- [ ] Create FastAPI project structure
- [ ] Implement GraphQL schema and resolvers
- [ ] Set up authentication middleware
- [ ] Implement rate limiting and security middleware

**Core Services**
- [ ] User management service
- [ ] Child profile management
- [ ] Basic logging service
- [ ] Inventory tracking service

**Testing & Quality**
- [ ] Unit tests for all services (>90% coverage)
- [ ] Integration tests for database operations
- [ ] API documentation (auto-generated from GraphQL schema)
- [ ] Performance baseline testing

#### Phase 2: Business Logic (Weeks 5-8)

**Prediction Engine**
- [ ] Age-based usage calculation
- [ ] Days of cover algorithm
- [ ] Basic size change detection
- [ ] Reorder point calculation

**Price Comparison**
- [ ] Retailer API integrations (Amazon.ca, Walmart.ca)
- [ ] Price normalization ($/100ct)
- [ ] Affiliate link generation
- [ ] Price monitoring background jobs

**Notification System**
- [ ] Push notification service
- [ ] Email notification service
- [ ] Smart notification timing
- [ ] Notification preferences management

#### Phase 3: Premium Features (Weeks 9-12)

**Advanced Analytics**
- [ ] Usage pattern analysis
- [ ] Cost savings calculations
- [ ] Prediction accuracy tracking
- [ ] Privacy-compliant analytics

**Collaboration Features**
- [ ] Caregiver sharing system
- [ ] Role-based access control
- [ ] Real-time activity sync
- [ ] Multi-user conflict resolution

### Frontend Team Deliverables

#### Phase 1: Foundation (Weeks 1-4)

**Project Setup**
- [ ] Expo project initialization with TypeScript
- [ ] Navigation structure (React Navigation)
- [ ] State management setup (Zustand + React Query)
- [ ] Design system implementation (NativeBase + custom tokens)

**Core Screens**
- [ ] Authentication flow (signup/signin)
- [ ] Onboarding sequence
- [ ] Home dashboard
- [ ] Basic settings screen

**Essential Features**
- [ ] Child profile creation
- [ ] Quick logging interface (FAB)
- [ ] Basic inventory display
- [ ] Offline data storage (SQLite)

#### Phase 2: Core Features (Weeks 5-8)

**Logging & Tracking**
- [ ] Enhanced logging interface
- [ ] Time selection (chips: Now/1h/2h/Custom)
- [ ] Change type selection
- [ ] Offline sync with conflict resolution

**Planning & Recommendations**
- [ ] Days of cover display
- [ ] Reorder recommendations
- [ ] Basic price comparison (top 3)
- [ ] Simple timeline view

**Real-time Features**
- [ ] GraphQL subscription setup
- [ ] Real-time inventory updates
- [ ] Push notification handling
- [ ] Optimistic updates

#### Phase 3: Enhanced UX (Weeks 9-12)

**Advanced UI**
- [ ] Smooth animations (React Native Reanimated)
- [ ] Gesture handling for quick actions
- [ ] Haptic feedback
- [ ] Improved accessibility

**Premium Features**
- [ ] Multi-child support
- [ ] Enhanced analytics views
- [ ] Caregiver collaboration UI
- [ ] Advanced settings and preferences

### QA Team Deliverables

#### Testing Strategy

**Automated Testing**
- [ ] Unit test suites for critical business logic
- [ ] Integration tests for API endpoints
- [ ] End-to-end testing with realistic data
- [ ] Performance testing under load

**Privacy & Compliance Testing**
- [ ] PIPEDA compliance verification
- [ ] Data encryption validation
- [ ] Consent flow testing
- [ ] Data export/deletion verification

**Device & Platform Testing**
- [ ] iOS testing (iPhone 12+, iPad)
- [ ] Android testing (Samsung, Google Pixel, budget devices)
- [ ] Cross-platform consistency verification
- [ ] Offline/online sync testing

**Security Testing**
- [ ] Authentication flow security
- [ ] API endpoint security
- [ ] Data transmission encryption
- [ ] Penetration testing

### DevOps Team Deliverables

#### Infrastructure Setup

**Railway Deployment**
- [ ] Production environment setup
- [ ] Staging environment setup
- [ ] Database configuration with Canadian residency
- [ ] SSL certificate setup

**CI/CD Pipeline**
- [ ] GitHub Actions workflow configuration
- [ ] Automated testing pipeline
- [ ] Security scanning integration
- [ ] Mobile app build automation

**Monitoring & Alerting**
- [ ] Sentry error tracking setup
- [ ] Application performance monitoring
- [ ] Database monitoring
- [ ] Uptime monitoring and alerting

#### Security & Compliance

**Data Protection**
- [ ] Encryption key management
- [ ] Database backup encryption
- [ ] Secure API key management
- [ ] Log sanitization

**Compliance Tools**
- [ ] Data retention automation
- [ ] User data export tools
- [ ] Automated consent tracking
- [ ] Privacy audit logging

### Implementation Timeline

#### Pre-Development (Week 0)
- Team onboarding and technical review
- Development environment setup
- Third-party service account setup
- Final architecture review and approval

#### Sprint 1-2 (Weeks 1-2): Foundation
- Database schema implementation
- Basic FastAPI structure
- Expo app initialization
- Authentication flow

#### Sprint 3-4 (Weeks 3-4): Core Features
- User management
- Child profile creation
- Basic logging functionality
- Home dashboard

#### Sprint 5-6 (Weeks 5-6): Business Logic
- Prediction engine implementation
- Inventory tracking
- Days of cover calculation
- Basic notifications

#### Sprint 7-8 (Weeks 7-8): Integration
- Price comparison integration
- Affiliate link system
- Real-time sync
- Push notifications

#### Sprint 9-10 (Weeks 9-10): Polish & Testing
- UI/UX refinements
- Performance optimization
- Comprehensive testing
- Security audit

#### Sprint 11-12 (Weeks 11-12): Launch Preparation
- Beta testing with real users
- Bug fixes and improvements
- App store submission
- Production deployment

### Success Metrics & Definition of Done

#### Technical Metrics
- **Performance**: <3s app launch, <1s for logging actions
- **Reliability**: >99.5% uptime, <0.1% crash rate
- **Security**: Pass all security audits, PIPEDA compliance verified

#### Business Metrics
- **User Experience**: >85% onboarding completion
- **Engagement**: >70% of users log changes within 24 hours
- **Accuracy**: >90% prediction accuracy for reorder timing

#### Definition of Done for MVP
- [ ] All core user stories implemented and tested
- [ ] PIPEDA compliance verified by legal team
- [ ] Performance benchmarks met
- [ ] Security audit passed
- [ ] App store approval received
- [ ] Production deployment successful
- [ ] Monitoring and alerting active
- [ ] User support system ready

This technical architecture provides a comprehensive blueprint for implementing NestSync from concept to production, ensuring Canadian compliance, optimal performance, and successful market entry.

---

## Risk Mitigation & Contingency Plans

### Technical Risk Mitigation

#### High-Priority Risks

**Prediction Algorithm Accuracy**
- **Mitigation**: Conservative initial thresholds, continuous learning system
- **Contingency**: Manual override options, user feedback integration
- **Monitoring**: Accuracy tracking dashboard, user satisfaction surveys

**Real-time Sync Failures**
- **Mitigation**: Robust offline mode, conflict resolution algorithms
- **Contingency**: Graceful degradation to manual sync, clear user feedback
- **Monitoring**: Sync success rate tracking, network failure handling

**Performance on Low-End Devices**
- **Mitigation**: Progressive loading, device-specific optimization
- **Contingency**: Lightweight UI mode, simplified feature set
- **Monitoring**: Device performance metrics, crash reporting

### Compliance Risk Mitigation

**PIPEDA Compliance**
- **Mitigation**: Legal review, conservative data practices, clear consent flows
- **Contingency**: Rapid response team for compliance issues, data correction tools
- **Monitoring**: Compliance audit trail, user consent tracking

**Data Sovereignty Requirements**
- **Mitigation**: Canadian data centers only, verified hosting compliance
- **Contingency**: Rapid data migration procedures, backup Canadian providers
- **Monitoring**: Data location verification, regulatory change tracking

This comprehensive architecture specification provides the technical foundation for building NestSync as a market-leading Canadian diaper planning application, ensuring scalability, compliance, and user success.