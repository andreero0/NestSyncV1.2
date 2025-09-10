---
title: Integration Strategy with Existing Systems
description: Comprehensive approach for integrating premium feature gating into NestSync's existing architecture
feature: premium-feature-gating
last-updated: 2025-01-09
version: 1.0.0
related-files: 
  - README.md
  - technical-implementation.md
  - visual-specifications.md
  - user-journey.md
dependencies:
  - NestSync existing inventory management system
  - GraphQL backend integration
  - Supabase authentication system
status: approved
---

# Integration Strategy with Existing Systems

## Overview

This document outlines the comprehensive integration approach for premium feature gating within NestSync's existing React Native + Expo frontend, FastAPI + GraphQL backend, and Supabase database architecture, with specific focus on maintaining the psychology-driven UX for stressed Canadian parents.

## Table of Contents

1. [Architecture Integration Overview](#architecture-integration-overview)
2. [Frontend Integration Points](#frontend-integration-points)
3. [Backend Integration Strategy](#backend-integration-strategy)
4. [Database Schema Extensions](#database-schema-extensions)
5. [Authentication & Authorization](#authentication--authorization)
6. [Migration Strategy](#migration-strategy)
7. [Testing & Quality Assurance](#testing--quality-assurance)
8. [Deployment Considerations](#deployment-considerations)

## Architecture Integration Overview

### Current NestSync Architecture

```
Frontend (React Native + Expo)
├── State Management: Zustand
├── GraphQL Client: Apollo Client  
├── Theme: Context-based with AsyncStorage
├── Navigation: File-based routing
└── Storage: Expo SecureStore + AsyncStorage

Backend (FastAPI + GraphQL)
├── GraphQL: Strawberry
├── Database: Supabase PostgreSQL
├── Auth: Supabase Auth with custom user management
├── ORM: SQLAlchemy 2.0 async
└── Migrations: Alembic

Database (Supabase PostgreSQL)
├── Tables: users, children, consent_records
├── Security: Row Level Security (RLS) policies
├── Region: Canadian data residency
└── Compliance: PIPEDA-compliant data handling
```

### Premium Integration Points

```
Premium Gating Layer
├── Frontend Components: PremiumGate, BlurView overlays
├── State Management: Premium status in Zustand store
├── GraphQL Extensions: Subscription queries/mutations
├── Backend Services: Subscription validation, billing
├── Database Schema: Subscription tables, premium features
└── Payment Integration: Stripe/Apple Pay/Google Pay
```

## Frontend Integration Points

### 1. Existing Inventory Management Integration

**Current Structure**
```
app/(tabs)/inventory/
├── _layout.tsx
├── index.tsx (main inventory screen)
├── add-item.tsx
└── [id].tsx (item details)
```

**Premium Integration**
```
app/(tabs)/inventory/
├── _layout.tsx (add premium provider)
├── index.tsx (integrate premium gates)
├── add-item.tsx (premium item types)
├── [id].tsx (premium item details)
├── premium-modal.tsx (new)
└── components/
    ├── PremiumGate.tsx (new)
    ├── PremiumFeatureCard.tsx (new)
    └── BlurOverlay.tsx (new)
```

**Inventory Screen Modifications**

```typescript
// app/(tabs)/inventory/index.tsx - EXISTING FILE MODIFICATION
import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { PremiumGate } from './components/PremiumGate';
import { PremiumFeatureCard } from './components/PremiumFeatureCard';

export default function InventoryScreen() {
  const { colors } = useTheme();

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Existing free diaper tracking - unchanged */}
      <DiaperTrackingSection />
      
      {/* NEW: Premium feature cards */}
      <View style={styles.premiumSection}>
        <PremiumFeatureCard
          title="Baby Bags"
          description="Track diaper bags and travel essentials"
          icon="👜"
          onPress={() => showPremiumModal('baby_bags')}
        />
        
        <PremiumFeatureCard
          title="Powder & Lotion"
          description="Monitor care products and expiry dates"
          icon="🧴"
          onPress={() => showPremiumModal('care_products')}
        />
        
        <PremiumFeatureCard
          title="Wipes & Supplies"
          description="Never run out of cleaning essentials"
          icon="🧻"
          onPress={() => showPremiumModal('supplies')}
        />
      </View>
    </ScrollView>
  );
}

// NEW: Premium section styling
const styles = StyleSheet.create({
  premiumSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  // ... existing styles maintained
});
```

### 2. Navigation Integration

**Tab Navigation Enhancement**
```typescript
// app/(tabs)/_layout.tsx - MODIFICATION
import { PremiumStatusProvider } from '@/contexts/PremiumContext';

export default function TabLayout() {
  return (
    <PremiumStatusProvider>
      <Tabs
        screenOptions={{
          // ... existing options
        }}
      >
        {/* Existing tabs unchanged */}
        <Tabs.Screen name="inventory" options={inventoryOptions} />
        
        {/* Premium indicator in tab bar */}
        <Tabs.Screen 
          name="premium" 
          options={{
            title: 'Premium',
            tabBarIcon: ({ color, focused }) => (
              <View style={styles.premiumTab}>
                <TabBarIcon name="star" color={color} />
                {!isPremium && <PremiumBadge />}
              </View>
            ),
          }}
        />
      </Tabs>
    </PremiumStatusProvider>
  );
}
```

### 3. Context Integration

**Premium Context Provider**
```typescript
// contexts/PremiumContext.tsx - NEW FILE
import React, { createContext, useContext, useEffect } from 'react';
import { usePremiumStore } from '@/stores/premiumStore';
import { useAuth } from '@/contexts/AuthContext';

const PremiumContext = createContext(null);

export function PremiumStatusProvider({ children }) {
  const { user } = useAuth();
  const { 
    isPremium, 
    isLoading, 
    updatePremiumStatus, 
    validateSubscription 
  } = usePremiumStore();

  useEffect(() => {
    if (user) {
      validateSubscription();
    }
  }, [user]);

  return (
    <PremiumContext.Provider 
      value={{ isPremium, isLoading, updatePremiumStatus }}
    >
      {children}
    </PremiumContext.Provider>
  );
}

export const usePremiumContext = () => useContext(PremiumContext);
```

### 4. Zustand Store Integration

**Enhanced Premium Store**
```typescript
// stores/premiumStore.ts - INTEGRATION WITH EXISTING PATTERN
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apolloClient } from '@/lib/graphql/client';

interface PremiumState extends BaseStorePattern {
  // Premium-specific state
  isPremium: boolean;
  subscriptionId: string | null;
  features: PremiumFeature[];
  billingCycle: 'monthly' | 'yearly' | null;
  
  // Integration with existing patterns
  lastSyncedAt: Date | null;
  isValidating: boolean;
  
  // Actions following NestSync patterns
  setPremiumStatus: (status: boolean) => void;
  validateSubscription: () => Promise<void>;
  syncWithBackend: () => Promise<void>;
}

export const usePremiumStore = create<PremiumState>()(
  persist(
    (set, get) => ({
      // State initialization
      isPremium: false,
      subscriptionId: null,
      features: [],
      lastSyncedAt: null,
      isValidating: false,
      
      // Actions
      validateSubscription: async () => {
        set({ isValidating: true });
        try {
          // Follow existing async pattern from auth store
          const result = await validateUserSubscription();
          set({
            isPremium: result.isPremium,
            features: result.features,
            lastSyncedAt: new Date(),
          });
        } catch (error) {
          console.error('Premium validation failed:', error);
          // Graceful fallback - maintain free access
          set({ isPremium: false });
        } finally {
          set({ isValidating: false });
        }
      },
    }),
    {
      name: 'premium-storage',
      storage: {
        // Follow existing NestSync async storage pattern
        getItem: async (name) => {
          const value = await AsyncStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: async (name, value) => {
          await AsyncStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: async (name) => {
          await AsyncStorage.removeItem(name);
        },
      },
    }
  )
);
```

## Backend Integration Strategy

### 1. GraphQL Schema Extensions

**Existing Schema Pattern Integration**
```python
# app/graphql/types/premium.py - NEW FILE
import strawberry
from datetime import datetime
from typing import Optional, List

@strawberry.type
class PremiumFeature:
    id: str
    name: str
    description: str
    category: str
    is_enabled: bool

@strawberry.type  
class SubscriptionStatus:
    is_premium: bool
    subscription_id: Optional[str]
    billing_cycle: Optional[str]
    expires_at: Optional[datetime]
    features: List[PremiumFeature]
    is_trial: bool
    trial_expires_at: Optional[datetime]

@strawberry.type
class PremiumResponse:
    success: bool
    message: str
    subscription: Optional[SubscriptionStatus]
    error: Optional[str]
```

**Query Extensions**
```python
# app/graphql/schema.py - MODIFICATION
@strawberry.type
class Query:
    # ... existing queries unchanged
    me: Optional[UserProfile]
    my_children: ChildConnection
    
    # NEW: Premium queries
    @strawberry.field
    async def subscription_status(self, info: Info) -> SubscriptionStatus:
        """Get current user's premium subscription status"""
        user = await get_current_user(info)
        if not user:
            raise GraphQLError("Authentication required")
        
        return await get_user_subscription_status(user.id)
    
    @strawberry.field
    async def premium_features(self, info: Info) -> List[PremiumFeature]:
        """Get available premium features"""
        return await get_available_premium_features()
```

**Mutation Extensions**
```python
# app/graphql/schema.py - MODIFICATION  
@strawberry.type
class Mutation:
    # ... existing mutations unchanged
    sign_up: AuthResponse
    create_child: CreateChildResponse
    
    # NEW: Premium mutations
    @strawberry.mutation
    async def create_subscription(
        self, 
        info: Info,
        plan_id: str,
        payment_method_id: str
    ) -> PremiumResponse:
        """Create new premium subscription"""
        user = await get_current_user(info)
        if not user:
            raise GraphQLError("Authentication required")
        
        async for session in get_async_session():
            result = await subscription_service.create_subscription(
                session, user.id, plan_id, payment_method_id
            )
            await session.commit()
            return result
```

### 2. Service Layer Integration

**Premium Service Following NestSync Patterns**
```python
# app/services/premium_service.py - NEW FILE
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.premium import Subscription, PremiumFeature
from app.config.settings import settings

class PremiumService:
    """Premium subscription service following NestSync async patterns"""
    
    async def validate_user_subscription(
        self,
        session: AsyncSession,
        user_id: str
    ) -> dict:
        """Validate user's current subscription status"""
        try:
            # Follow existing async pattern
            query = select(Subscription).where(
                Subscription.user_id == user_id,
                Subscription.is_active == True
            )
            result = await session.execute(query)
            subscription = result.scalar_one_or_none()
            
            if not subscription:
                return {
                    "isPremium": False,
                    "features": [],
                    "billingCycle": None
                }
            
            # Validate with payment provider
            is_valid = await self._validate_with_stripe(subscription.stripe_id)
            
            if not is_valid:
                # Follow NestSync error handling pattern
                await self._deactivate_subscription(session, subscription.id)
                return {"isPremium": False, "features": []}
            
            features = await self._get_subscription_features(session, subscription.id)
            
            return {
                "isPremium": True,
                "subscriptionId": subscription.id,
                "features": features,
                "billingCycle": subscription.billing_cycle,
                "expiresAt": subscription.expires_at
            }
            
        except Exception as e:
            # Follow existing error logging pattern
            logger.error(f"Premium validation error: {e}")
            # Return safe fallback
            return {"isPremium": False, "features": []}

premium_service = PremiumService()
```

### 3. Resolver Integration

**Premium Resolvers**
```python
# app/graphql/resolvers/premium.py - NEW FILE
from app.graphql.types.premium import SubscriptionStatus, PremiumResponse
from app.services.premium_service import premium_service
from app.config.database import get_async_session

async def resolve_subscription_status(user_id: str) -> SubscriptionStatus:
    """Resolve user's subscription status following NestSync patterns"""
    # Use existing async session pattern
    async for session in get_async_session():
        status_data = await premium_service.validate_user_subscription(
            session, user_id
        )
        
        return SubscriptionStatus(
            is_premium=status_data["isPremium"],
            subscription_id=status_data.get("subscriptionId"),
            billing_cycle=status_data.get("billingCycle"),
            expires_at=status_data.get("expiresAt"),
            features=status_data.get("features", []),
            is_trial=status_data.get("isTrial", False),
            trial_expires_at=status_data.get("trialExpiresAt")
        )
```

## Database Schema Extensions

### 1. New Premium Tables

**Subscription Table**
```sql
-- migrations/YYYYMMDD_HHMM_add_premium_subscriptions.sql
-- Following NestSync migration naming pattern

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stripe_subscription_id VARCHAR(255) UNIQUE,
    status VARCHAR(50) NOT NULL DEFAULT 'inactive',
    billing_cycle VARCHAR(20) NOT NULL, -- 'monthly' or 'yearly'
    amount_cents INTEGER NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'CAD',
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    trial_start TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Canadian compliance fields
    data_residency_confirmed BOOLEAN NOT NULL DEFAULT TRUE,
    pipeda_consent_date TIMESTAMPTZ,
    
    CONSTRAINT valid_status CHECK (
        status IN ('incomplete', 'incomplete_expired', 'trialing', 
                  'active', 'past_due', 'canceled', 'unpaid')
    ),
    CONSTRAINT valid_currency CHECK (currency IN ('CAD', 'USD')),
    CONSTRAINT valid_billing_cycle CHECK (billing_cycle IN ('monthly', 'yearly'))
);

-- RLS Policy following NestSync pattern
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY subscription_user_access ON subscriptions
    FOR ALL TO authenticated
    USING (auth.uid() = user_id);
```

**Premium Features Table**
```sql
-- Continue in same migration file
CREATE TABLE premium_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_key VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default premium features
INSERT INTO premium_features (feature_key, name, description, category) VALUES
    ('baby_bags', 'Baby Bags Tracking', 'Track diaper bags and travel essentials', 'inventory'),
    ('care_products', 'Care Products', 'Monitor powder, lotion, and care products', 'inventory'),
    ('supplies', 'Wipes & Supplies', 'Track wipes and cleaning supplies', 'inventory'),
    ('smart_reminders', 'Smart Reminders', 'Automatic restocking notifications', 'notifications'),
    ('family_sharing', 'Family Sharing', 'Share lists with family members', 'collaboration');
```

**Subscription Features Junction Table**
```sql
-- Continue in same migration file
CREATE TABLE subscription_features (
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    feature_id UUID NOT NULL REFERENCES premium_features(id) ON DELETE CASCADE,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (subscription_id, feature_id)
);

-- RLS Policy
ALTER TABLE subscription_features ENABLE ROW LEVEL SECURITY;

CREATE POLICY subscription_features_user_access ON subscription_features
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM subscriptions s 
            WHERE s.id = subscription_id AND s.user_id = auth.uid()
        )
    );
```

### 2. User Table Extensions

**Add Premium Fields to Users Table**
```sql
-- migrations/YYYYMMDD_HHMM_add_user_premium_fields.sql
-- Following NestSync migration pattern

ALTER TABLE users ADD COLUMN IF NOT EXISTS 
    premium_onboarded_at TIMESTAMPTZ;

ALTER TABLE users ADD COLUMN IF NOT EXISTS
    premium_trial_used BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE users ADD COLUMN IF NOT EXISTS
    last_subscription_check TIMESTAMPTZ;

-- Update triggers to maintain updated_at
-- (Following existing NestSync trigger pattern)
```

### 3. Inventory Extensions for Premium Items

**Premium Inventory Categories**
```sql
-- migrations/YYYYMMDD_HHMM_add_premium_inventory.sql

-- Extend existing inventory system
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS
    is_premium_feature BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE inventory_categories ADD COLUMN IF NOT EXISTS
    requires_premium BOOLEAN NOT NULL DEFAULT FALSE;

-- Insert premium categories
INSERT INTO inventory_categories (name, description, requires_premium) VALUES
    ('baby_bags', 'Baby Bags & Travel Items', TRUE),
    ('care_products', 'Powder, Lotion & Care Products', TRUE),
    ('supplies', 'Wipes & Cleaning Supplies', TRUE)
ON CONFLICT (name) DO NOTHING;

-- Update RLS policies to check premium access
CREATE OR REPLACE POLICY inventory_premium_access ON inventory_items
    FOR ALL TO authenticated
    USING (
        NOT is_premium_feature OR 
        EXISTS (
            SELECT 1 FROM subscriptions s
            WHERE s.user_id = auth.uid() 
            AND s.is_active = TRUE
        )
    );
```

## Authentication & Authorization

### 1. Premium Access Control

**Middleware Integration**
```python
# app/auth/premium_middleware.py - NEW FILE
from functools import wraps
from app.services.premium_service import premium_service
from app.config.database import get_async_session

def require_premium(feature_key: str = None):
    """Decorator to require premium subscription for specific features"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract user from GraphQL info (following existing pattern)
            info = args[1] if len(args) > 1 else kwargs.get('info')
            user = await get_current_user(info)
            
            if not user:
                raise GraphQLError("Authentication required")
            
            # Check premium status
            async for session in get_async_session():
                status = await premium_service.validate_user_subscription(
                    session, user.id
                )
                
                if not status["isPremium"]:
                    raise GraphQLError(
                        "Premium subscription required",
                        extensions={"code": "PREMIUM_REQUIRED"}
                    )
                
                # Check specific feature if provided
                if feature_key:
                    user_features = [f["key"] for f in status["features"]]
                    if feature_key not in user_features:
                        raise GraphQLError(
                            f"Feature '{feature_key}' not available in your plan",
                            extensions={"code": "FEATURE_NOT_AVAILABLE"}
                        )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator
```

**Premium-Gated Resolvers**
```python
# app/graphql/resolvers/inventory.py - MODIFICATION
from app.auth.premium_middleware import require_premium

@strawberry.type
class Mutation:
    @strawberry.mutation
    @require_premium(feature_key="baby_bags")
    async def create_baby_bag_item(
        self, 
        info: Info,
        input: CreateBabyBagInput
    ) -> CreateItemResponse:
        """Create baby bag item - Premium feature"""
        user = await get_current_user(info)
        
        async for session in get_async_session():
            # Create premium inventory item
            item = await inventory_service.create_premium_item(
                session, user.id, input, category="baby_bags"
            )
            await session.commit()
            return CreateItemResponse(success=True, item=item)
```

### 2. Frontend Authorization

**Premium Route Guards**
```typescript
// hooks/usePremiumGuard.ts - NEW FILE
import { useEffect } from 'react';
import { router } from 'expo-router';
import { usePremiumStatus } from './usePremiumStatus';

export function usePremiumGuard(feature?: string) {
  const { isPremium, isLoading, features } = usePremiumStatus();

  useEffect(() => {
    if (isLoading) return;

    if (!isPremium) {
      // Redirect to premium discovery instead of blocking
      router.push('/premium-discover');
      return;
    }

    // Check specific feature access
    if (feature && !features.includes(feature)) {
      router.push(`/premium-upgrade?feature=${feature}`);
      return;
    }
  }, [isPremium, isLoading, feature, features]);

  return { isPremium: isPremium && (!feature || features.includes(feature)) };
}
```

## Migration Strategy

### 1. Phased Rollout Plan

**Phase 1: Foundation (Week 1-2)**
- Database schema deployment
- Backend GraphQL extensions
- Premium service implementation
- Basic frontend components

**Phase 2: UI Integration (Week 3-4)**
- Inventory screen integration
- Premium gate components
- BlurView implementation
- Modal flows

**Phase 3: Payment Integration (Week 5-6)**
- Stripe integration
- Subscription management
- Canadian payment compliance
- Trial period implementation

**Phase 4: Polish & Launch (Week 7-8)**
- A/B testing implementation
- Analytics integration
- Performance optimization
- Launch preparation

### 2. Feature Flags

**Premium Feature Configuration**
```typescript
// config/featureFlags.ts - INTEGRATION WITH EXISTING
export const featureFlags = {
  // ... existing flags
  
  // Premium feature flags
  PREMIUM_GATING_ENABLED: true,
  PREMIUM_BABY_BAGS: true,
  PREMIUM_CARE_PRODUCTS: true,
  PREMIUM_SUPPLIES: true,
  PREMIUM_SMART_REMINDERS: false, // Gradual rollout
  PREMIUM_FAMILY_SHARING: false,  // Future feature
  
  // A/B testing flags
  PREMIUM_MESSAGING_VARIANT: 'supportive', // 'supportive' | 'feature-focused'
  PREMIUM_PRICING_DISPLAY: 'monthly', // 'monthly' | 'yearly' | 'both'
  PREMIUM_CTA_VARIANT: 'help-organize', // 'help-organize' | 'unlock-tools'
};
```

### 3. Backward Compatibility

**Graceful Degradation Strategy**
```python
# app/services/premium_service.py - ERROR HANDLING
async def validate_user_subscription(self, session: AsyncSession, user_id: str):
    """Premium validation with graceful fallback"""
    try:
        # Attempt premium validation
        return await self._validate_subscription_active(session, user_id)
    except Exception as e:
        # Log error but don't break user experience
        logger.warning(f"Premium validation failed for user {user_id}: {e}")
        
        # Return safe fallback - user keeps free access
        return {
            "isPremium": False,
            "features": [],
            "error": "validation_failed"
        }
```

## Testing & Quality Assurance

### 1. Integration Test Strategy

**Premium Feature Integration Tests**
```python
# tests/integration/test_premium_integration.py
import pytest
from app.services.premium_service import premium_service

class TestPremiumIntegration:
    async def test_premium_inventory_access(self, test_client, premium_user):
        """Test premium user can access premium inventory features"""
        # Create premium subscription
        subscription = await create_test_subscription(premium_user.id)
        
        # Test GraphQL query
        query = """
        query {
            premiumInventoryItems {
                id
                category
                isPremiumFeature
            }
        }
        """
        
        response = await test_client.post("/graphql", json={"query": query})
        assert response.status_code == 200
        assert "premiumInventoryItems" in response.json()["data"]

    async def test_free_user_premium_access_blocked(self, test_client, free_user):
        """Test free user cannot access premium features"""
        query = """
        mutation {
            createBabyBagItem(input: {name: "Test Bag"}) {
                success
                error
            }
        }
        """
        
        response = await test_client.post("/graphql", json={"query": query})
        data = response.json()
        assert data["errors"][0]["extensions"]["code"] == "PREMIUM_REQUIRED"
```

### 2. End-to-End Testing

**Premium User Journey E2E**
```typescript
// e2e/premiumUserJourney.e2e.ts
describe('Premium User Journey', () => {
  it('should complete premium discovery to subscription flow', async () => {
    // Start on inventory screen
    await element(by.text('Inventory')).tap();
    
    // Should see free diaper tracking
    await expect(element(by.text('Diapers'))).toBeVisible();
    
    // Should see premium feature cards
    await expect(element(by.text('Baby Bags'))).toBeVisible();
    await expect(element(by.text('COMING SOON FOR PREMIUM'))).toBeVisible();
    
    // Tap premium feature
    await element(by.text('Baby Bags')).tap();
    
    // Should open premium modal
    await expect(element(by.text('Track Everything Your Family Needs'))).toBeVisible();
    
    // Should show Canadian compliance
    await expect(element(by.text('🇨🇦 Data stored securely in Canada'))).toBeVisible();
    
    // Continue through flow
    await element(by.text('Tell me more')).tap();
    await element(by.text('Help me stay organized')).tap();
    
    // Should reach subscription screen
    await expect(element(by.text('$4.99 CAD per month'))).toBeVisible();
    await expect(element(by.text('Cancel anytime'))).toBeVisible();
  });
});
```

## Deployment Considerations

### 1. Environment Configuration

**Production Environment Variables**
```bash
# Premium-specific environment variables
STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Canadian compliance
PAYMENT_PROCESSING_REGION=canada
DATA_RESIDENCY_REQUIREMENT=canada
PIPEDA_COMPLIANCE_MODE=enabled

# Feature flags
PREMIUM_FEATURES_ENABLED=true
PREMIUM_TRIAL_PERIOD_DAYS=7
PREMIUM_MONTHLY_PRICE_CAD=499  # in cents
```

### 2. Monitoring & Analytics

**Premium Feature Monitoring**
```python
# app/services/analytics_service.py - INTEGRATION
class AnalyticsService:
    async def track_premium_event(
        self,
        user_id: str,
        event: str,
        properties: dict = None
    ):
        """Track premium-related events with Canadian privacy compliance"""
        if not self._has_analytics_consent(user_id):
            # Log locally but don't send to third parties
            logger.info(f"Premium event (not tracked): {event}")
            return
        
        # Sanitize for PIPEDA compliance
        sanitized_props = self._sanitize_for_pipeda(properties or {})
        
        await self._send_event(user_id, f"premium_{event}", sanitized_props)
```

### 3. Database Migration Strategy

**Production Migration Plan**
```sql
-- Production migration checklist
-- 1. Create new tables during maintenance window
-- 2. Populate default premium features
-- 3. Update RLS policies
-- 4. Test premium access control
-- 5. Enable premium features gradually via feature flags

-- Rollback plan
-- 1. Disable premium features via feature flags
-- 2. Preserve user data (subscriptions, premium items)
-- 3. Allow graceful degradation to free tier
-- 4. Maintain audit trail for Canadian compliance
```

## Related Documentation

- [Technical Implementation](technical-implementation.md) - Detailed code specifications
- [Visual Specifications](visual-specifications.md) - UI/UX integration details
- [User Journey](user-journey.md) - End-to-end user experience
- [Messaging Framework](messaging-framework.md) - Copy and content integration

## Last Updated

This integration strategy was developed January 9, 2025, with comprehensive consideration of NestSync's existing architecture patterns, Canadian compliance requirements, and psychology-driven UX principles for stressed parents.