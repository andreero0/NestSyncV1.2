# NestSync Reorder Flow Integration Architecture

**Date:** December 21, 2024
**Version:** 2.0.0
**Scope:** Reorder Flow Extension Architecture
**Type:** Infrastructure Integration Specification

## Executive Summary

This document specifies the technical architecture for extending NestSync's existing infrastructure to support the reorder flow feature. The design prioritizes **integration over replacement**, ensuring the reorder functionality feels like a natural evolution of the NestSync platform while maintaining backward compatibility and Canadian compliance.

### Integration Strategy Overview

- **Extension Pattern**: Leverage Strawberry GraphQL federation to extend existing types with new reorder fields
- **Database Strategy**: Add new e-commerce tables that reference existing user/child entities via foreign keys
- **Service Integration**: New reorder services integrate with existing collaboration, email, and analytics services
- **Cache Architecture**: Extend Apollo Client cache normalization for real-time order tracking
- **Compliance**: Maintain PIPEDA compliance with extended audit trails for financial transactions

### Technology Stack Extensions

| Layer | Existing Infrastructure | Reorder Extensions |
|-------|------------------------|-------------------|
| **GraphQL** | Strawberry schema with User, Child, Activity types | Federation extensions with Order, Product, Retailer types |
| **Database** | users, children, activities, consent_records | orders, order_items, products, retailers, predictions, payment_records |
| **Services** | CollaborationService, EmailService, AnalyticsService | ReorderService, MLPredictionService, RetailerAPIService, PaymentService |
| **Cache** | Apollo Client with user/child normalization | Extended normalization for orders, real-time subscriptions |
| **Background Jobs** | Basic email processing | ML predictions, retailer API calls, order status updates |

### Critical Performance Requirements

- **GraphQL Operations**: <500ms (maintained for existing + new operations)
- **ML Predictions**: <2 seconds for diaper need forecasting
- **Real-time Updates**: <100ms latency for order status changes
- **Cross-platform Storage**: <100ms access time (maintained)
- **Database Queries**: Optimized RLS policies with proper indexing

## 1. Infrastructure Extension Architecture

### 1.1 System Component Integration

```python
# Extended FastAPI application structure
app/
├── existing/
│   ├── auth/              # Supabase authentication (unchanged)
│   ├── graphql/           # Existing GraphQL schema
│   ├── models/            # Existing SQLAlchemy models
│   └── services/          # Existing services
├── reorder/               # NEW: Reorder flow extensions
│   ├── graphql/           # Federation extensions
│   │   ├── order_types.py
│   │   ├── product_types.py
│   │   └── reorder_resolvers.py
│   ├── models/            # New e-commerce models
│   │   ├── orders.py
│   │   ├── products.py
│   │   └── retailers.py
│   ├── services/          # New business logic services
│   │   ├── reorder_service.py
│   │   ├── ml_prediction_service.py
│   │   ├── retailer_api_service.py
│   │   └── payment_service.py
│   └── background/        # Background job handlers
│       ├── prediction_jobs.py
│       └── order_sync_jobs.py
└── shared/                # Shared integration utilities
    ├── federation_utils.py
    └── cache_invalidation.py
```

### 1.2 Service Integration Patterns

```python
# Integration with existing services
class ReorderService:
    def __init__(
        self,
        collaboration_service: CollaborationService,  # Existing
        email_service: EmailService,                  # Existing
        analytics_service: AnalyticsService,          # Existing
        ml_prediction_service: MLPredictionService,   # New
        retailer_api_service: RetailerAPIService,     # New
        payment_service: PaymentService               # New
    ):
        self.collaboration = collaboration_service
        self.email = email_service
        self.analytics = analytics_service
        self.ml_predictions = ml_prediction_service
        self.retailer_api = retailer_api_service
        self.payment = payment_service

    async def create_reorder(self, user_id: str, child_id: str) -> Order:
        # 1. Get ML prediction for diaper needs
        prediction = await self.ml_predictions.predict_diaper_needs(child_id)

        # 2. Get retailer options and pricing
        options = await self.retailer_api.get_product_options(prediction)

        # 3. Create order with collaboration context
        order = await self._create_order(user_id, child_id, options)

        # 4. Notify family members via existing collaboration system
        await self.collaboration.notify_family_order(order)

        # 5. Send confirmation via existing email service
        await self.email.send_order_confirmation(order)

        # 6. Track analytics via existing service
        await self.analytics.track_reorder_event(order)

        return order
```

## 2. GraphQL Schema Extensions

### 2.1 Federation Type Extensions

```python
# app/reorder/graphql/order_types.py
import strawberry
from typing import List, Optional
from datetime import datetime
from decimal import Decimal

@strawberry.federation.type(keys=["id"])
class Order:
    id: strawberry.ID
    user_id: strawberry.ID
    child_id: strawberry.ID
    status: str
    total_amount: Decimal
    currency: str = "CAD"
    created_at: datetime
    estimated_delivery: Optional[datetime]

    # Federation resolver for cross-service data
    @classmethod
    async def resolve_reference(cls, id: strawberry.ID):
        async for session in get_async_session():
            order = await session.get(OrderModel, id)
            return cls(**order.dict()) if order else None

@strawberry.federation.type(keys=["id"])
class Product:
    id: strawberry.ID
    name: str
    brand: str
    size: str
    quantity: int
    price_per_unit: Decimal
    retailer_id: strawberry.ID

@strawberry.federation.type(keys=["id"])
class Retailer:
    id: strawberry.ID
    name: str
    api_endpoint: str
    delivery_time_days: int
    minimum_order_amount: Optional[Decimal]

# Extend existing User type with reorder fields
@strawberry.federation.type(extend=True, keys=["id"])
class User:
    id: strawberry.ID = strawberry.federation.field(external=True)

    # New reorder-related fields
    @strawberry.field
    async def orders(self, info: strawberry.Info) -> List[Order]:
        user_id = self.id
        async for session in get_async_session():
            orders = await session.execute(
                select(OrderModel).where(OrderModel.user_id == user_id)
            )
            return [Order(**order.dict()) for order in orders.scalars()]

    @strawberry.field
    async def reorder_preferences(self, info: strawberry.Info) -> Optional[ReorderPreferences]:
        # Implementation for user's reorder preferences
        pass

# Extend existing Child type with reorder fields
@strawberry.federation.type(extend=True, keys=["id"])
class Child:
    id: strawberry.ID = strawberry.federation.field(external=True)

    @strawberry.field
    async def diaper_predictions(self, info: strawberry.Info) -> List[DiaperPrediction]:
        # ML-powered predictions for this child
        pass

    @strawberry.field
    async def last_order(self, info: strawberry.Info) -> Optional[Order]:
        # Most recent order for this child
        pass
```

### 2.2 Mutation Extensions

```python
# app/reorder/graphql/reorder_resolvers.py
@strawberry.type
class ReorderMutations:
    @strawberry.mutation
    async def create_reorder(
        self,
        info: strawberry.Info,
        child_id: strawberry.ID,
        retailer_preferences: Optional[List[strawberry.ID]] = None
    ) -> CreateReorderResponse:
        """Create a new reorder based on ML predictions and user preferences."""
        try:
            user_id = await get_authenticated_user_id(info.context)

            async for session in get_async_session():
                reorder_service = get_reorder_service(session)
                order = await reorder_service.create_reorder(
                    user_id=user_id,
                    child_id=child_id,
                    retailer_preferences=retailer_preferences
                )

                # Invalidate Apollo Client cache for real-time updates
                await broadcast_order_update(order)

                return CreateReorderResponse(
                    success=True,
                    order=order,
                    message="Reorder created successfully"
                )

        except Exception as e:
            logger.error(f"Reorder creation failed: {e}")
            return CreateReorderResponse(
                success=False,
                error="Failed to create reorder",
                message=str(e)
            )

# Extend existing schema with reorder mutations
@strawberry.type
class Mutation:
    # Existing mutations (unchanged)
    sign_up: AuthResponse
    create_child: CreateChildResponse
    complete_onboarding_step: MutationResponse

    # New reorder mutations
    create_reorder: CreateReorderResponse
    update_order_status: UpdateOrderStatusResponse
    cancel_order: CancelOrderResponse
    update_reorder_preferences: UpdateReorderPreferencesResponse
```

### 2.3 Real-time Subscriptions

```python
@strawberry.type
class Subscription:
    @strawberry.subscription
    async def order_updates(
        self,
        info: strawberry.Info,
        order_id: strawberry.ID
    ) -> AsyncGenerator[OrderUpdate, None]:
        """Real-time order status updates via WebSocket."""
        user_id = await get_authenticated_user_id(info.context)

        # Verify user owns this order
        async for session in get_async_session():
            order = await session.get(OrderModel, order_id)
            if not order or order.user_id != user_id:
                raise GraphQLError("Unauthorized order access")

        # Subscribe to order updates channel
        async for update in subscribe_to_order_updates(order_id):
            yield OrderUpdate(
                order_id=order_id,
                status=update.status,
                estimated_delivery=update.estimated_delivery,
                tracking_info=update.tracking_info,
                timestamp=datetime.utcnow()
            )
```

## 3. Database Architecture Extensions

### 3.1 New E-commerce Tables

```sql
-- Retailers table for multi-retailer support
CREATE TABLE retailers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    api_endpoint VARCHAR(500),
    api_key_encrypted TEXT,
    delivery_time_days INTEGER DEFAULT 3,
    minimum_order_amount DECIMAL(10,2),
    supported_regions JSONB DEFAULT '["CA"]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products table with Canadian tax information
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    retailer_id UUID REFERENCES retailers(id) ON DELETE CASCADE,
    external_product_id VARCHAR(255) NOT NULL,
    name VARCHAR(500) NOT NULL,
    brand VARCHAR(255),
    size VARCHAR(100),
    quantity INTEGER,
    price_per_unit DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'CAD',
    gst_rate DECIMAL(5,4) DEFAULT 0.05,    -- Canadian GST
    pst_rate DECIMAL(5,4) DEFAULT 0.00,    -- Provincial tax (varies)
    hst_rate DECIMAL(5,4) DEFAULT 0.00,    -- Harmonized tax (some provinces)
    category VARCHAR(100) DEFAULT 'diapers',
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(retailer_id, external_product_id)
);

-- Orders table linking to existing users and children
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    child_id UUID REFERENCES children(id) ON DELETE CASCADE,
    retailer_id UUID REFERENCES retailers(id),
    status VARCHAR(50) DEFAULT 'pending',
    subtotal_amount DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) NOT NULL,
    shipping_amount DECIMAL(10,2) DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'CAD',
    external_order_id VARCHAR(255),
    tracking_number VARCHAR(255),
    estimated_delivery TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order items for detailed tracking
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ML predictions for proactive reordering
CREATE TABLE diaper_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id UUID REFERENCES children(id) ON DELETE CASCADE,
    predicted_run_out_date DATE NOT NULL,
    recommended_quantity INTEGER NOT NULL,
    recommended_size VARCHAR(50) NOT NULL,
    confidence_score DECIMAL(3,2), -- 0.00 to 1.00
    factors_considered JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure one active prediction per child
    UNIQUE(child_id, predicted_run_out_date)
);

-- Payment records for audit trails (PIPEDA compliance)
CREATE TABLE payment_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    payment_method VARCHAR(50) NOT NULL, -- 'stripe', 'paypal', etc.
    payment_intent_id VARCHAR(255),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'CAD',
    status VARCHAR(50) NOT NULL,
    processed_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reorder preferences for personalization
CREATE TABLE reorder_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    child_id UUID REFERENCES children(id) ON DELETE CASCADE,
    preferred_retailers UUID[] DEFAULT '{}',
    auto_reorder_enabled BOOLEAN DEFAULT false,
    lead_time_days INTEGER DEFAULT 7,
    budget_limit_monthly DECIMAL(10,2),
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, child_id)
);
```

### 3.2 RLS Policies for E-commerce Data

```sql
-- Enable RLS on all new tables
ALTER TABLE retailers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE diaper_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE reorder_preferences ENABLE ROW LEVEL SECURITY;

-- Retailers: Public read access for authenticated users
CREATE POLICY "Authenticated users can view active retailers"
ON retailers
FOR SELECT
TO authenticated
USING (is_active = true);

-- Products: Public read access for available products
CREATE POLICY "Authenticated users can view available products"
ON products
FOR SELECT
TO authenticated
USING (is_available = true);

-- Orders: Users can only access their own orders
CREATE POLICY "Users can view their own orders"
ON orders
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create orders for themselves"
ON orders
FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own pending orders"
ON orders
FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = user_id AND status = 'pending');

-- Order items: Access tied to order ownership
CREATE POLICY "Users can view order items for their orders"
ON order_items
FOR SELECT
TO authenticated
USING (
    order_id IN (
        SELECT id FROM orders WHERE user_id = (SELECT auth.uid())
    )
);

-- Diaper predictions: Users can only access predictions for their children
CREATE POLICY "Users can view predictions for their children"
ON diaper_predictions
FOR SELECT
TO authenticated
USING (
    child_id IN (
        SELECT id FROM children WHERE user_id = (SELECT auth.uid())
    )
);

-- Payment records: Restricted access with audit trail
CREATE POLICY "Users can view their own payment records"
ON payment_records
FOR SELECT
TO authenticated
USING (
    order_id IN (
        SELECT id FROM orders WHERE user_id = (SELECT auth.uid())
    )
);

-- Reorder preferences: User-specific access
CREATE POLICY "Users can manage their own reorder preferences"
ON reorder_preferences
FOR ALL
TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

-- Performance indexes for RLS policies
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_child_id ON orders(child_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_diaper_predictions_child_id ON diaper_predictions(child_id);
CREATE INDEX idx_payment_records_order_id ON payment_records(order_id);
CREATE INDEX idx_reorder_preferences_user_child ON reorder_preferences(user_id, child_id);
```

## 4. Service Layer Integration

### 4.1 ML Prediction Service

```python
# app/reorder/services/ml_prediction_service.py
from typing import List, Optional
import asyncio
from datetime import datetime, timedelta
import numpy as np
from fastapi import BackgroundTasks

class MLPredictionService:
    def __init__(self, analytics_service: AnalyticsService):
        self.analytics = analytics_service

    async def predict_diaper_needs(
        self,
        child_id: str,
        background_tasks: BackgroundTasks
    ) -> DiaperPrediction:
        """Predict when child will run out of diapers using ML."""

        # 1. Gather historical activity data (via existing analytics service)
        activities = await self.analytics.get_child_activities(
            child_id=child_id,
            activity_type="diaper_change",
            days_back=30
        )

        # 2. Calculate usage patterns
        daily_usage = self._calculate_daily_usage(activities)
        size_progression = self._analyze_size_progression(activities)

        # 3. ML prediction (simplified - would use actual ML models)
        current_size = self._get_current_size(activities)
        predicted_daily_usage = np.mean(daily_usage[-7:])  # Recent average

        # 4. Estimate run-out date
        estimated_inventory = await self._estimate_current_inventory(child_id)
        days_until_runout = max(1, int(estimated_inventory / predicted_daily_usage))
        predicted_runout = datetime.now() + timedelta(days=days_until_runout)

        # 5. Create prediction record
        prediction = DiaperPrediction(
            child_id=child_id,
            predicted_run_out_date=predicted_runout.date(),
            recommended_quantity=int(predicted_daily_usage * 30),  # 30-day supply
            recommended_size=current_size,
            confidence_score=self._calculate_confidence(activities),
            factors_considered={
                "historical_usage": daily_usage,
                "size_progression": size_progression,
                "recent_pattern_change": self._detect_pattern_changes(activities)
            }
        )

        # 6. Schedule background update of prediction
        background_tasks.add_task(self._store_prediction, prediction)

        return prediction

    def _calculate_daily_usage(self, activities: List[Activity]) -> List[float]:
        """Calculate daily diaper usage from activity logs."""
        # Group by date and count diaper changes
        daily_counts = {}
        for activity in activities:
            date_key = activity.logged_at.date()
            daily_counts[date_key] = daily_counts.get(date_key, 0) + 1

        return list(daily_counts.values())

    async def _estimate_current_inventory(self, child_id: str) -> int:
        """Estimate current diaper inventory based on recent activities."""
        # This could integrate with physical inventory tracking
        # For now, use heuristics based on recent purchase history
        async for session in get_async_session():
            recent_orders = await session.execute(
                select(OrderModel)
                .where(OrderModel.child_id == child_id)
                .where(OrderModel.created_at > datetime.now() - timedelta(days=30))
                .order_by(OrderModel.created_at.desc())
            )

            # Estimate based on last order
            if recent_orders:
                last_order = recent_orders.first()
                # Simple estimation - would be more sophisticated in production
                return 50  # Assume some inventory remains

            return 10  # Conservative estimate if no recent orders
```

### 4.2 Retailer API Service

```python
# app/reorder/services/retailer_api_service.py
import aiohttp
import asyncio
from typing import List, Dict, Optional
from fastapi import BackgroundTasks

class RetailerAPIService:
    def __init__(self):
        self.session: Optional[aiohttp.ClientSession] = None

    async def get_session(self) -> aiohttp.ClientSession:
        if not self.session:
            self.session = aiohttp.ClientSession()
        return self.session

    async def get_product_options(
        self,
        prediction: DiaperPrediction,
        background_tasks: BackgroundTasks
    ) -> List[ProductOption]:
        """Get product options from multiple retailers."""

        # 1. Get active retailers
        async for session in get_async_session():
            retailers = await session.execute(
                select(RetailerModel).where(RetailerModel.is_active == True)
            )
            retailer_list = retailers.scalars().all()

        # 2. Query each retailer API concurrently
        tasks = []
        for retailer in retailer_list:
            task = self._query_retailer_api(retailer, prediction)
            tasks.append(task)

        # 3. Gather results with timeout
        try:
            results = await asyncio.wait_for(
                asyncio.gather(*tasks, return_exceptions=True),
                timeout=5.0  # 5-second timeout for retailer APIs
            )
        except asyncio.TimeoutError:
            logger.warning("Some retailer APIs timed out")
            results = []

        # 4. Process and rank options
        product_options = []
        for result in results:
            if isinstance(result, Exception):
                logger.error(f"Retailer API error: {result}")
                continue
            if result:
                product_options.extend(result)

        # 5. Schedule background price updates
        background_tasks.add_task(self._schedule_price_updates, product_options)

        return self._rank_product_options(product_options)

    async def _query_retailer_api(
        self,
        retailer: RetailerModel,
        prediction: DiaperPrediction
    ) -> List[ProductOption]:
        """Query individual retailer API for products."""
        try:
            session = await self.get_session()

            # Build search parameters
            search_params = {
                "category": "diapers",
                "size": prediction.recommended_size,
                "quantity_min": prediction.recommended_quantity,
                "region": "CA"  # Canadian market
            }

            # API call with authentication
            headers = {
                "Authorization": f"Bearer {retailer.api_key_encrypted}",
                "User-Agent": "NestSync/1.0",
                "Accept": "application/json"
            }

            async with session.get(
                f"{retailer.api_endpoint}/products/search",
                params=search_params,
                headers=headers,
                timeout=3.0
            ) as response:

                if response.status == 200:
                    data = await response.json()
                    return self._parse_retailer_response(retailer, data)
                else:
                    logger.warning(f"Retailer {retailer.name} API error: {response.status}")
                    return []

        except Exception as e:
            logger.error(f"Failed to query {retailer.name}: {e}")
            return []

    def _rank_product_options(self, options: List[ProductOption]) -> List[ProductOption]:
        """Rank product options by price, delivery time, and user preferences."""

        def calculate_score(option: ProductOption) -> float:
            # Multi-factor ranking algorithm
            price_score = 1.0 / (option.total_price + 1.0)  # Lower price = higher score
            delivery_score = 1.0 / (option.delivery_days + 1.0)  # Faster = higher score
            availability_score = 1.0 if option.in_stock else 0.5

            return price_score * 0.4 + delivery_score * 0.3 + availability_score * 0.3

        # Sort by calculated score
        return sorted(options, key=calculate_score, reverse=True)
```

### 4.3 Background Task Integration

```python
# app/reorder/background/prediction_jobs.py
from fastapi import BackgroundTasks
import asyncio
from datetime import datetime, timedelta

class PredictionBackgroundJobs:
    def __init__(
        self,
        ml_service: MLPredictionService,
        email_service: EmailService,
        collaboration_service: CollaborationService
    ):
        self.ml_service = ml_service
        self.email_service = email_service
        self.collaboration_service = collaboration_service

    async def schedule_daily_predictions(self, background_tasks: BackgroundTasks):
        """Schedule ML predictions for all active children."""

        async for session in get_async_session():
            # Get children who need prediction updates
            children = await session.execute(
                select(ChildModel)
                .join(UserModel)
                .where(UserModel.is_active == True)
                .where(
                    ~exists(
                        select(DiaperPredictionModel.id)
                        .where(DiaperPredictionModel.child_id == ChildModel.id)
                        .where(DiaperPredictionModel.created_at > datetime.now() - timedelta(days=1))
                    )
                )
            )

            for child in children.scalars():
                background_tasks.add_task(
                    self._generate_child_prediction,
                    child.id
                )

    async def _generate_child_prediction(self, child_id: str):
        """Generate prediction for a specific child."""
        try:
            prediction = await self.ml_service.predict_diaper_needs(child_id)

            # Check if running low (within 3 days)
            if prediction.predicted_run_out_date <= datetime.now().date() + timedelta(days=3):
                await self._send_low_stock_notification(child_id, prediction)

        except Exception as e:
            logger.error(f"Prediction generation failed for child {child_id}: {e}")

    async def _send_low_stock_notification(
        self,
        child_id: str,
        prediction: DiaperPrediction
    ):
        """Send low stock notification to family members."""

        async for session in get_async_session():
            child = await session.get(ChildModel, child_id)
            if not child:
                return

            # Notify via existing collaboration system
            await self.collaboration_service.notify_family_members(
                user_id=child.user_id,
                message=f"Running low on diapers for {child.name}",
                action_type="reorder_suggestion",
                metadata={
                    "child_id": child_id,
                    "prediction": prediction.dict(),
                    "suggested_action": "create_reorder"
                }
            )

            # Send email via existing email service
            await self.email_service.send_reorder_reminder(
                user_id=child.user_id,
                child_name=child.name,
                predicted_runout=prediction.predicted_run_out_date,
                recommended_quantity=prediction.recommended_quantity
            )
```

## 5. Apollo Client Cache Architecture

### 5.1 Cache Normalization Extensions

```typescript
// NestSync-frontend/lib/graphql/cache-config.ts
import { InMemoryCache, FieldPolicy } from '@apollo/client';

export const reorderCacheConfig = {
  typePolicies: {
    // Extend existing User type with reorder fields
    User: {
      fields: {
        orders: {
          merge(existing: any[] = [], incoming: any[], { args }) {
            // Merge order lists with proper pagination
            if (args?.offset) {
              const merged = existing.slice(0);
              const end = args.offset + Math.min(args.limit || 10, incoming.length);
              for (let i = args.offset; i < end; i++) {
                merged[i] = incoming[i - args.offset];
              }
              return merged;
            }
            return incoming;
          },

          read(existing: any[], { args }) {
            // Handle pagination reads
            if (args?.offset && args?.limit) {
              return existing?.slice(args.offset, args.offset + args.limit);
            }
            return existing;
          }
        }
      }
    },

    // New Order type cache configuration
    Order: {
      keyFields: ["id"],
      fields: {
        items: {
          merge(existing: any[] = [], incoming: any[]) {
            // Always replace order items (they don't paginate)
            return incoming;
          }
        },

        // Real-time status updates
        status: {
          merge(existing: string, incoming: string) {
            // Always use the latest status
            return incoming;
          }
        },

        tracking_info: {
          merge: true  // Deep merge tracking information
        }
      }
    },

    // Product cache management
    Product: {
      keyFields: ["id"],
      fields: {
        price_per_unit: {
          merge(existing: number, incoming: number) {
            // Always use latest price
            return incoming;
          }
        },

        is_available: {
          merge(existing: boolean, incoming: boolean) {
            // Always use latest availability
            return incoming;
          }
        }
      }
    },

    // Extend existing Child type
    Child: {
      fields: {
        diaper_predictions: {
          merge(existing: any[] = [], incoming: any[]) {
            // Keep only the latest prediction per date
            const predictionMap = new Map();

            [...existing, ...incoming].forEach(prediction => {
              predictionMap.set(prediction.predicted_run_out_date, prediction);
            });

            return Array.from(predictionMap.values()).sort(
              (a, b) => new Date(a.predicted_run_out_date).getTime() -
                       new Date(b.predicted_run_out_date).getTime()
            );
          }
        }
      }
    },

    // Query-level cache management
    Query: {
      fields: {
        // Retailer product search with cache invalidation
        searchProducts: {
          keyArgs: ["searchQuery", "size", "maxPrice"],
          merge(existing: any[] = [], incoming: any[], { args }) {
            // Cache searches separately by parameters
            return incoming;
          }
        },

        // User's order history with pagination
        orderHistory: {
          keyArgs: ["userId"],
          merge(existing: any[] = [], incoming: any[], { args }) {
            if (args?.offset) {
              const merged = existing.slice(0);
              const startIndex = args.offset;
              incoming.forEach((order, index) => {
                merged[startIndex + index] = order;
              });
              return merged;
            }
            return incoming;
          }
        }
      }
    }
  }
};

// Enhanced cache with reorder extensions
export const createEnhancedCache = () => {
  return new InMemoryCache({
    ...reorderCacheConfig,

    // Custom cache key generation for multi-tenant data
    dataIdFromObject(object: any) {
      switch (object.__typename) {
        case 'Order':
          return `Order:${object.id}`;
        case 'Product':
          return `Product:${object.id}`;
        case 'Retailer':
          return `Retailer:${object.id}`;
        case 'DiaperPrediction':
          return `DiaperPrediction:${object.child_id}:${object.predicted_run_out_date}`;
        default:
          return `${object.__typename}:${object.id}`;
      }
    }
  });
};
```

### 5.2 Real-time Subscription Integration

```typescript
// NestSync-frontend/hooks/useOrderTracking.ts
import { useSubscription, useQuery, gql } from '@apollo/client';
import { useEffect, useCallback } from 'react';

const ORDER_UPDATES_SUBSCRIPTION = gql`
  subscription OrderUpdates($orderId: ID!) {
    orderUpdates(orderId: $orderId) {
      orderId
      status
      estimatedDelivery
      trackingInfo {
        trackingNumber
        currentLocation
        statusHistory {
          status
          timestamp
          location
        }
      }
      timestamp
    }
  }
`;

const ORDER_DETAILS_QUERY = gql`
  query OrderDetails($orderId: ID!) {
    order(id: $orderId) {
      id
      status
      totalAmount
      estimatedDelivery
      items {
        id
        product {
          name
          size
        }
        quantity
      }
      trackingInfo {
        trackingNumber
        currentLocation
        statusHistory {
          status
          timestamp
          location
        }
      }
    }
  }
`;

export function useOrderTracking(orderId: string) {
  const { data: orderData, loading, error } = useQuery(ORDER_DETAILS_QUERY, {
    variables: { orderId },
    errorPolicy: 'all'
  });

  // Real-time subscription for order updates
  const { data: subscriptionData } = useSubscription(ORDER_UPDATES_SUBSCRIPTION, {
    variables: { orderId },
    shouldResubscribe: true,
    onSubscriptionData: ({ client, subscriptionData }) => {
      if (subscriptionData.data?.orderUpdates) {
        const update = subscriptionData.data.orderUpdates;

        // Update Apollo cache with real-time data
        client.cache.modify({
          id: `Order:${orderId}`,
          fields: {
            status: () => update.status,
            estimatedDelivery: () => update.estimatedDelivery,
            trackingInfo: (existing) => ({
              ...existing,
              ...update.trackingInfo
            })
          }
        });

        // Trigger optimistic UI updates
        if (update.status === 'delivered') {
          // Update local storage for offline access
          localStorage.setItem(`order_${orderId}_delivered`, Date.now().toString());
        }
      }
    }
  });

  // Background sync for offline resilience
  const syncOrderStatus = useCallback(async () => {
    if (!navigator.onLine) return;

    try {
      // Refetch latest order data when coming back online
      await client.refetchQueries({
        include: [ORDER_DETAILS_QUERY]
      });
    } catch (error) {
      console.warn('Order sync failed:', error);
    }
  }, [orderId]);

  useEffect(() => {
    window.addEventListener('online', syncOrderStatus);
    return () => window.removeEventListener('online', syncOrderStatus);
  }, [syncOrderStatus]);

  return {
    order: orderData?.order,
    loading,
    error,
    realTimeUpdate: subscriptionData?.orderUpdates
  };
}
```

### 5.3 Optimistic Updates for Reorder Actions

```typescript
// NestSync-frontend/hooks/useReorderMutations.ts
import { useMutation, gql } from '@apollo/client';
import { useCallback } from 'react';

const CREATE_REORDER_MUTATION = gql`
  mutation CreateReorder($childId: ID!, $retailerPreferences: [ID!]) {
    createReorder(
      childId: $childId,
      retailerPreferences: $retailerPreferences
    ) {
      success
      order {
        id
        status
        totalAmount
        estimatedDelivery
        items {
          id
          product {
            name
            size
          }
          quantity
        }
      }
      message
      error
    }
  }
`;

export function useReorderMutations() {
  const [createReorderMutation, { loading, error }] = useMutation(CREATE_REORDER_MUTATION, {
    // Optimistic response for immediate UI feedback
    optimisticResponse: (variables) => ({
      createReorder: {
        __typename: 'CreateReorderResponse',
        success: true,
        order: {
          __typename: 'Order',
          id: `temp_${Date.now()}`,
          status: 'processing',
          totalAmount: 0,
          estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          items: []
        },
        message: 'Creating your reorder...',
        error: null
      }
    }),

    // Update cache after successful mutation
    update: (cache, { data }) => {
      if (data?.createReorder?.success && data.createReorder.order) {
        const newOrder = data.createReorder.order;

        // Add to user's order list
        cache.modify({
          id: `User:${userId}`,
          fields: {
            orders(existingOrders = []) {
              const newOrderRef = cache.writeFragment({
                data: newOrder,
                fragment: gql`
                  fragment NewOrder on Order {
                    id
                    status
                    totalAmount
                    estimatedDelivery
                  }
                `
              });
              return [newOrderRef, ...existingOrders];
            }
          }
        });

        // Update child's last order
        cache.modify({
          id: `Child:${variables.childId}`,
          fields: {
            lastOrder: () => cache.writeFragment({
              data: newOrder,
              fragment: gql`
                fragment ChildLastOrder on Order {
                  id
                  status
                  totalAmount
                  estimatedDelivery
                }
              `
            })
          }
        });
      }
    },

    // Error handling with cache rollback
    onError: (error) => {
      console.error('Reorder creation failed:', error);

      // Remove optimistic update on error
      cache.evict({
        id: cache.identify({
          __typename: 'Order',
          id: `temp_${Date.now()}`
        })
      });
      cache.gc();
    }
  });

  const createReorder = useCallback(async (childId: string, retailerPreferences?: string[]) => {
    try {
      const result = await createReorderMutation({
        variables: {
          childId,
          retailerPreferences: retailerPreferences || []
        }
      });

      return result.data?.createReorder;
    } catch (error) {
      throw error;
    }
  }, [createReorderMutation]);

  return {
    createReorder,
    loading,
    error
  };
}
```

## 6. Canadian Compliance Architecture

### 6.1 PIPEDA-Compliant Audit Trails

```sql
-- Enhanced audit table for financial transactions
CREATE TABLE financial_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    order_id UUID REFERENCES orders(id),
    action_type VARCHAR(100) NOT NULL, -- 'order_created', 'payment_processed', etc.
    data_accessed JSONB DEFAULT '{}',  -- What data was accessed/modified
    purpose TEXT NOT NULL,             -- Business purpose for data processing
    legal_basis VARCHAR(100) NOT NULL, -- PIPEDA legal basis
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    retention_until DATE,              -- Data retention schedule
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Data processing consent for financial transactions
CREATE TABLE financial_consent_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    consent_type VARCHAR(100) NOT NULL, -- 'payment_processing', 'order_tracking', etc.
    consent_given BOOLEAN NOT NULL,
    consent_version VARCHAR(50) NOT NULL,
    purposes_consented TEXT[] DEFAULT '{}',
    data_categories TEXT[] DEFAULT '{}',
    retention_period_months INTEGER DEFAULT 84, -- 7 years for financial records
    withdrawal_date TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies for audit compliance
ALTER TABLE financial_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_consent_records ENABLE ROW LEVEL SECURITY;

-- Users can view their own audit logs
CREATE POLICY "Users can view their own financial audit logs"
ON financial_audit_logs
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- Users can manage their own consent records
CREATE POLICY "Users can manage their own financial consent"
ON financial_consent_records
FOR ALL
TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);
```

### 6.2 Data Retention and Privacy Controls

```python
# app/reorder/services/privacy_service.py
from datetime import datetime, timedelta
from typing import List, Dict, Any

class PrivacyComplianceService:
    def __init__(self):
        self.retention_policies = {
            'financial_records': timedelta(days=7 * 365),  # 7 years
            'order_history': timedelta(days=3 * 365),      # 3 years
            'ml_predictions': timedelta(days=180),          # 6 months
            'audit_logs': timedelta(days=7 * 365),         # 7 years
        }

    async def log_data_access(
        self,
        user_id: str,
        action_type: str,
        data_accessed: Dict[str, Any],
        purpose: str,
        legal_basis: str = "legitimate_interest",
        request_context: Dict[str, Any] = None
    ):
        """Log data access for PIPEDA compliance."""

        async for session in get_async_session():
            audit_log = FinancialAuditLogModel(
                user_id=user_id,
                action_type=action_type,
                data_accessed=data_accessed,
                purpose=purpose,
                legal_basis=legal_basis,
                ip_address=request_context.get('ip_address') if request_context else None,
                user_agent=request_context.get('user_agent') if request_context else None,
                session_id=request_context.get('session_id') if request_context else None,
                retention_until=datetime.now() + self.retention_policies['audit_logs']
            )

            session.add(audit_log)
            await session.commit()

    async def verify_consent_for_processing(
        self,
        user_id: str,
        processing_type: str,
        data_categories: List[str]
    ) -> bool:
        """Verify user has given valid consent for data processing."""

        async for session in get_async_session():
            consent = await session.execute(
                select(FinancialConsentRecordModel)
                .where(FinancialConsentRecordModel.user_id == user_id)
                .where(FinancialConsentRecordModel.consent_type == processing_type)
                .where(FinancialConsentRecordModel.consent_given == True)
                .where(FinancialConsentRecordModel.withdrawal_date.is_(None))
                .order_by(FinancialConsentRecordModel.created_at.desc())
            )

            consent_record = consent.scalar_one_or_none()

            if not consent_record:
                return False

            # Check if all required data categories are covered
            consented_categories = set(consent_record.data_categories)
            required_categories = set(data_categories)

            return required_categories.issubset(consented_categories)

    async def process_data_deletion_request(self, user_id: str) -> Dict[str, Any]:
        """Process user's right to deletion (PIPEDA Article 5)."""

        deletion_report = {
            "user_id": user_id,
            "requested_at": datetime.now(),
            "completed_actions": [],
            "retained_data": [],
            "legal_basis_for_retention": []
        }

        async for session in get_async_session():
            # 1. Delete prediction data (can be deleted)
            predictions = await session.execute(
                select(DiaperPredictionModel)
                .join(ChildModel)
                .where(ChildModel.user_id == user_id)
            )

            for prediction in predictions.scalars():
                await session.delete(prediction)
                deletion_report["completed_actions"].append(f"Deleted prediction {prediction.id}")

            # 2. Anonymize order data (must retain for legal/financial reasons)
            orders = await session.execute(
                select(OrderModel).where(OrderModel.user_id == user_id)
            )

            for order in orders.scalars():
                # Anonymize but retain for financial compliance
                order.user_id = None  # Anonymize relationship
                order.metadata = {"anonymized": True, "original_deletion_request": datetime.now()}
                deletion_report["retained_data"].append(f"Anonymized order {order.id}")
                deletion_report["legal_basis_for_retention"].append(
                    "Financial record retention required by Canadian law (7 years)"
                )

            # 3. Retain audit logs for compliance
            deletion_report["retained_data"].append("Audit logs (required for compliance)")
            deletion_report["legal_basis_for_retention"].append(
                "Audit trail retention for regulatory compliance"
            )

            await session.commit()

        # 4. Log the deletion request
        await self.log_data_access(
            user_id=user_id,
            action_type="data_deletion_request",
            data_accessed={"scope": "all_user_data"},
            purpose="user_requested_deletion",
            legal_basis="user_consent"
        )

        return deletion_report
```

### 6.3 Cross-Border Data Protection

```python
# app/reorder/services/data_residency_service.py
class DataResidencyService:
    """Ensure Canadian data residency compliance for reorder data."""

    def __init__(self):
        self.allowed_regions = ['ca-central-1', 'canada-1']  # Canadian regions only
        self.prohibited_regions = ['us-east-1', 'eu-west-1']  # Non-Canadian regions

    async def validate_retailer_compliance(self, retailer_id: str) -> bool:
        """Ensure retailer APIs comply with Canadian data residency."""

        async for session in get_async_session():
            retailer = await session.get(RetailerModel, retailer_id)

            if not retailer:
                return False

            # Check if retailer endpoint is in Canada
            api_endpoint = retailer.api_endpoint

            # Simple domain-based validation (would be more sophisticated in production)
            canadian_domains = ['.ca', 'canada', 'canadian']
            us_domains = ['.com', '.us', 'amazon.com', 'walmart.com']

            if any(domain in api_endpoint.lower() for domain in canadian_domains):
                return True

            if any(domain in api_endpoint.lower() for domain in us_domains):
                # Log potential compliance concern
                await self._log_compliance_concern(
                    retailer_id=retailer_id,
                    concern_type="data_residency",
                    details=f"Retailer endpoint {api_endpoint} may not comply with Canadian data residency"
                )
                return False

            return True  # Neutral domains allowed with review

    async def encrypt_cross_border_data(self, data: Dict[str, Any]) -> str:
        """Encrypt data before any potential cross-border transmission."""

        # Use Canadian encryption standards
        import cryptography
        from cryptography.fernet import Fernet

        # Generate or retrieve encryption key (stored in Canadian infrastructure)
        key = await self._get_canadian_encryption_key()
        cipher_suite = Fernet(key)

        # Encrypt the data
        encrypted_data = cipher_suite.encrypt(str(data).encode())

        return encrypted_data.decode()

    async def _log_compliance_concern(
        self,
        retailer_id: str,
        concern_type: str,
        details: str
    ):
        """Log potential compliance concerns for review."""

        async for session in get_async_session():
            log_entry = ComplianceLogModel(
                entity_type="retailer",
                entity_id=retailer_id,
                concern_type=concern_type,
                details=details,
                severity="medium",
                requires_review=True,
                created_at=datetime.now()
            )

            session.add(log_entry)
            await session.commit()
```

## 7. Scalability Architecture

### 7.1 Horizontal Scaling Patterns

```python
# app/reorder/scalability/load_balancing.py
from fastapi import BackgroundTasks
import asyncio
from typing import List, Dict, Any
import redis.asyncio as redis

class ReorderLoadBalancer:
    """Distribute reorder processing across multiple workers."""

    def __init__(self):
        self.redis_client = redis.Redis(host='localhost', port=6379, decode_responses=True)
        self.worker_queues = {
            'ml_predictions': 'queue:ml_predictions',
            'retailer_apis': 'queue:retailer_apis',
            'order_processing': 'queue:order_processing',
            'notifications': 'queue:notifications'
        }

    async def distribute_prediction_workload(
        self,
        child_ids: List[str],
        background_tasks: BackgroundTasks
    ):
        """Distribute ML prediction workload across workers."""

        # Batch child IDs for efficient processing
        batch_size = 50
        batches = [child_ids[i:i + batch_size] for i in range(0, len(child_ids), batch_size)]

        for batch in batches:
            # Add to Redis queue for worker processing
            job_data = {
                'job_type': 'batch_predictions',
                'child_ids': batch,
                'priority': 'normal',
                'created_at': datetime.now().isoformat()
            }

            await self.redis_client.lpush(
                self.worker_queues['ml_predictions'],
                json.dumps(job_data)
            )

    async def scale_retailer_api_calls(
        self,
        api_calls: List[Dict[str, Any]],
        max_concurrent: int = 10
    ) -> List[Any]:
        """Scale retailer API calls with concurrency control."""

        semaphore = asyncio.Semaphore(max_concurrent)

        async def throttled_api_call(call_data):
            async with semaphore:
                return await self._execute_retailer_api_call(call_data)

        # Execute all API calls with concurrency limit
        tasks = [throttled_api_call(call) for call in api_calls]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        return results

    async def implement_circuit_breaker(
        self,
        retailer_id: str,
        operation: callable
    ) -> Any:
        """Implement circuit breaker pattern for retailer APIs."""

        circuit_key = f"circuit_breaker:{retailer_id}"
        failure_count = await self.redis_client.get(f"{circuit_key}:failures") or 0
        failure_count = int(failure_count)

        # Circuit breaker thresholds
        failure_threshold = 5
        timeout_seconds = 300  # 5 minutes

        if failure_count >= failure_threshold:
            # Check if circuit breaker should reset
            last_failure = await self.redis_client.get(f"{circuit_key}:last_failure")
            if last_failure and datetime.now().timestamp() - float(last_failure) > timeout_seconds:
                # Reset circuit breaker
                await self.redis_client.delete(f"{circuit_key}:failures")
                await self.redis_client.delete(f"{circuit_key}:last_failure")
            else:
                # Circuit is open, return fallback
                return await self._get_fallback_response(retailer_id)

        try:
            # Execute operation
            result = await operation()

            # Reset failure count on success
            await self.redis_client.delete(f"{circuit_key}:failures")
            return result

        except Exception as e:
            # Increment failure count
            await self.redis_client.incr(f"{circuit_key}:failures")
            await self.redis_client.set(
                f"{circuit_key}:last_failure",
                datetime.now().timestamp()
            )

            # If threshold reached, log circuit breaker activation
            if failure_count + 1 >= failure_threshold:
                logger.warning(f"Circuit breaker activated for retailer {retailer_id}")

            raise e
```

### 7.2 Database Optimization for Scale

```sql
-- Performance indexes for high-scale operations
CREATE INDEX CONCURRENTLY idx_orders_created_at_status
ON orders(created_at, status)
WHERE status IN ('pending', 'processing');

CREATE INDEX CONCURRENTLY idx_diaper_predictions_runout_date
ON diaper_predictions(predicted_run_out_date)
WHERE predicted_run_out_date <= CURRENT_DATE + INTERVAL '7 days';

CREATE INDEX CONCURRENTLY idx_products_retailer_available
ON products(retailer_id, is_available, price_per_unit)
WHERE is_available = true;

-- Partitioning for large audit tables
CREATE TABLE financial_audit_logs_partitioned (
    LIKE financial_audit_logs INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- Monthly partitions for audit logs
CREATE TABLE financial_audit_logs_2024_12
PARTITION OF financial_audit_logs_partitioned
FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');

-- Connection pooling configuration
-- app/config/database.py
DATABASE_CONFIG = {
    "pool_size": 20,
    "max_overflow": 30,
    "pool_timeout": 30,
    "pool_recycle": 3600,
    "pool_pre_ping": True
}

-- Read replica configuration for analytics
CREATE DATABASE nestsync_replica;
-- Configure streaming replication for read-heavy analytics queries
```

### 7.3 Caching Strategy for Performance

```python
# app/reorder/caching/redis_cache.py
import redis.asyncio as redis
import json
from typing import Any, Optional, Dict
from datetime import timedelta

class ReorderCacheService:
    """Redis-based caching for reorder data."""

    def __init__(self):
        self.redis_client = redis.Redis(
            host='localhost',
            port=6379,
            decode_responses=True,
            max_connections=20
        )

        self.cache_ttl = {
            'product_prices': timedelta(minutes=15),     # Product prices change frequently
            'retailer_availability': timedelta(minutes=5), # Inventory changes rapidly
            'ml_predictions': timedelta(hours=24),       # Predictions valid for a day
            'user_preferences': timedelta(hours=6),      # User preferences change occasionally
        }

    async def cache_product_search(
        self,
        search_key: str,
        products: List[Dict[str, Any]],
        ttl: Optional[timedelta] = None
    ):
        """Cache product search results."""

        cache_key = f"products:search:{search_key}"
        ttl_seconds = int((ttl or self.cache_ttl['product_prices']).total_seconds())

        await self.redis_client.setex(
            cache_key,
            ttl_seconds,
            json.dumps(products, default=str)
        )

    async def get_cached_product_search(self, search_key: str) -> Optional[List[Dict[str, Any]]]:
        """Retrieve cached product search results."""

        cache_key = f"products:search:{search_key}"
        cached_data = await self.redis_client.get(cache_key)

        if cached_data:
            return json.loads(cached_data)

        return None

    async def cache_ml_prediction(
        self,
        child_id: str,
        prediction: Dict[str, Any]
    ):
        """Cache ML prediction results."""

        cache_key = f"ml:prediction:{child_id}"
        ttl_seconds = int(self.cache_ttl['ml_predictions'].total_seconds())

        await self.redis_client.setex(
            cache_key,
            ttl_seconds,
            json.dumps(prediction, default=str)
        )

    async def invalidate_user_cache(self, user_id: str):
        """Invalidate all cache entries for a user."""

        # Pattern-based deletion for user-specific data
        patterns = [
            f"user:{user_id}:*",
            f"orders:{user_id}:*",
            f"preferences:{user_id}:*"
        ]

        for pattern in patterns:
            keys = await self.redis_client.keys(pattern)
            if keys:
                await self.redis_client.delete(*keys)

    async def implement_cache_warming(self):
        """Pre-warm cache with frequently accessed data."""

        # Warm popular product searches
        popular_searches = [
            "diapers:size_3:premium",
            "diapers:size_4:value",
            "diapers:size_2:sensitive"
        ]

        for search in popular_searches:
            # Pre-populate cache with background job
            await self._warm_product_search_cache(search)

    async def _warm_product_search_cache(self, search_term: str):
        """Background task to warm product search cache."""
        # Implementation would fetch and cache popular product searches
        pass
```

## 8. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)
**Priority**: Database schema and core GraphQL extensions

**Backend Tasks:**
1. Create new database tables with RLS policies
2. Implement basic GraphQL type extensions (Order, Product, Retailer)
3. Set up basic ReorderService with dependency injection
4. Configure background task infrastructure

**Frontend Tasks:**
1. Extend Apollo Client cache configuration
2. Create basic reorder UI components
3. Implement universal storage for reorder preferences
4. Set up GraphQL fragments for new types

**Success Criteria:**
- Database schema fully deployed
- Basic order creation flow working
- GraphQL federation properly configured

### Phase 2: ML Predictions & Retailer Integration (Weeks 3-4)
**Priority**: Core business logic and external integrations

**Backend Tasks:**
1. Implement MLPredictionService with historical data analysis
2. Create RetailerAPIService with circuit breaker patterns
3. Set up background jobs for daily predictions
4. Implement basic retailer API mocking for development

**Frontend Tasks:**
1. Create prediction display components
2. Implement retailer comparison interface
3. Add real-time subscription handling
4. Build order tracking components

**Success Criteria:**
- ML predictions generating reasonable forecasts
- Retailer API integration working with at least one mock retailer
- Real-time order updates functioning

### Phase 3: Payment & Compliance (Weeks 5-6)
**Priority**: Canadian compliance and payment processing

**Backend Tasks:**
1. Implement Stripe integration with Canadian tax calculation
2. Create comprehensive audit logging system
3. Set up data retention and privacy controls
4. Implement PIPEDA compliance validation

**Frontend Tasks:**
1. Build payment flow UI with Canadian tax display
2. Implement consent management interface
3. Add privacy controls and data export features
4. Create audit trail viewing for users

**Success Criteria:**
- End-to-end payment processing working
- Full PIPEDA compliance audit passes
- Data retention policies enforced

### Phase 4: Performance & Scaling (Weeks 7-8)
**Priority**: Production readiness and performance optimization

**Backend Tasks:**
1. Implement Redis caching layer
2. Set up database partitioning and optimization
3. Add comprehensive monitoring and alerting
4. Load test and optimize critical paths

**Frontend Tasks:**
1. Implement advanced caching strategies
2. Add offline support for critical features
3. Optimize bundle size and performance
4. Add comprehensive error boundaries

**Success Criteria:**
- All performance requirements met
- System handles 1000+ concurrent users
- Comprehensive monitoring in place

### Phase 5: Integration Testing & Launch (Weeks 9-10)
**Priority**: End-to-end validation and production deployment

**Tasks:**
1. Comprehensive integration testing with existing NestSync features
2. User acceptance testing with real families
3. Security penetration testing
4. Production deployment with gradual rollout

**Success Criteria:**
- All existing NestSync functionality preserved
- Reorder flow seamlessly integrated
- Production deployment successful

## Technical Specifications Summary

### For Backend Engineers

**Key Implementation Points:**
- Use Strawberry federation patterns to extend existing GraphQL schema
- Leverage existing FastAPI dependency injection for service integration
- Implement background tasks using existing FastAPI BackgroundTasks
- Follow existing async/await patterns with proper session management
- Maintain backward compatibility with existing API contracts

**Critical Files to Modify:**
- `app/graphql/schema.py` - Add reorder mutations and subscriptions
- `app/models/` - Add new SQLAlchemy models with proper relationships
- `app/services/` - Create new services that integrate with existing ones
- `alembic/versions/` - Database migrations for new tables

### For Frontend Engineers

**Key Implementation Points:**
- Extend Apollo Client cache configuration without breaking existing caching
- Use existing Zustand stores for reorder state management
- Leverage existing cross-platform storage patterns
- Maintain consistency with existing theme and component systems
- Follow existing navigation patterns for reorder flow integration

**Critical Files to Modify:**
- `lib/graphql/client.ts` - Extend cache configuration
- `lib/graphql/queries.ts` - Add new queries, mutations, subscriptions
- `hooks/` - Create reorder-specific hooks following existing patterns
- `components/` - Add new components following existing design system

### For QA Engineers

**Testing Priorities:**
1. Integration testing between reorder flow and existing features
2. Cross-platform compatibility testing (iOS, Android, Web)
3. Real-time subscription testing with network interruptions
4. Payment flow testing with Canadian tax calculations
5. Performance testing under concurrent load
6. PIPEDA compliance validation testing

### For Security Analysts

**Security Validation Points:**
1. RLS policy effectiveness for multi-tenant e-commerce data
2. Payment data encryption and PCI compliance
3. Canadian data residency validation
4. PIPEDA audit trail completeness
5. API rate limiting and DDoS protection
6. Cross-border data transfer monitoring

This architecture ensures the reorder flow extends NestSync's existing infrastructure seamlessly while maintaining all performance, security, and compliance requirements. The implementation roadmap provides clear technical priorities for each engineering discipline.