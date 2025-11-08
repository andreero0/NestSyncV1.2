# NestSync Premium Reorder System Documentation

## Overview

The NestSync Premium Reorder System is a comprehensive automated diaper ordering platform designed specifically for Canadian families. It combines machine learning predictions, subscription billing through Stripe, and retailer API integrations to provide intelligent, automated diaper reordering with full PIPEDA compliance.

## Architecture Overview

### Core Components

1. **Subscription Management**: Stripe-based subscription billing with Canadian tax handling
2. **ML Prediction Pipeline**: Prophet-based time series forecasting for consumption prediction
3. **Retailer API Integration**: OAuth 2.0 secured connections to Canadian retailers
4. **Real-time Updates**: WebSocket-based order tracking and status updates
5. **Canadian Compliance**: Full PIPEDA compliance with Canadian data residency

### Technology Stack

- **Backend**: FastAPI + Strawberry GraphQL
- **Database**: PostgreSQL with SQLAlchemy ORM
- **ML Framework**: Prophet (Facebook) for time series forecasting
- **Payment Processing**: Stripe with Canadian tax automation
- **Real-time Communication**: WebSockets
- **Retailer APIs**: Amazon Product Advertising API 5.0, Walmart Canada API

## Database Schema

### Core Tables

#### `reorder_subscriptions`
```sql
-- Premium subscription tiers with Canadian billing
CREATE TABLE reorder_subscriptions (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    tier subscription_tier_enum,
    is_active BOOLEAN DEFAULT true,
    stripe_subscription_id VARCHAR,
    stripe_customer_id VARCHAR,
    billing_amount_cad DECIMAL(10,2),
    gst_rate DECIMAL(5,4),
    pst_hst_rate DECIMAL(5,4),
    total_tax_rate DECIMAL(5,4),
    features JSONB,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
);
```

#### `consumption_predictions`
```sql
-- ML-generated consumption forecasts
CREATE TABLE consumption_predictions (
    id UUID PRIMARY KEY,
    child_id UUID REFERENCES children(id),
    model_version VARCHAR,
    confidence_level prediction_confidence_enum,
    current_consumption_rate DECIMAL(5,2),
    predicted_consumption_30d INTEGER,
    predicted_runout_date TIMESTAMP WITH TIME ZONE,
    recommended_reorder_date TIMESTAMP WITH TIME ZONE,
    size_change_probability DECIMAL(5,4),
    feature_importance JSONB,
    created_at TIMESTAMP WITH TIME ZONE
);
```

#### `retailer_configurations`
```sql
-- Retailer API credentials and settings
CREATE TABLE retailer_configurations (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    retailer_type retailer_type_enum,
    is_active BOOLEAN DEFAULT true,
    api_endpoint VARCHAR,
    rate_limit_per_hour INTEGER,
    total_successful_orders INTEGER DEFAULT 0,
    consecutive_failures INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE
);
```

#### `reorder_transactions`
```sql
-- Complete order lifecycle tracking
CREATE TABLE reorder_transactions (
    id UUID PRIMARY KEY,
    subscription_id UUID REFERENCES reorder_subscriptions(id),
    child_id UUID REFERENCES children(id),
    order_number VARCHAR UNIQUE,
    retailer_order_id VARCHAR,
    status order_status_enum,
    products JSONB,
    total_amount_cad DECIMAL(10,2),
    stripe_payment_intent_id VARCHAR,
    tracking_number VARCHAR,
    estimated_delivery_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE
);
```

## GraphQL API

### Core Queries

#### Subscription Dashboard
```graphql
query GetSubscriptionDashboard {
  getSubscriptionDashboard {
    currentSubscription {
      id
      tier
      billingAmountCad
      totalTaxRate
      isActive
    }
    recentPredictions {
      id
      confidenceLevel
      predictedRunoutDate
      recommendedReorderDate
    }
    recentOrders {
      id
      orderNumber
      status
      totalAmountCad
    }
    analytics {
      totalOrders
      totalAmountCad
      averageOrderValueCad
      monthlySavingsCad
    }
  }
}
```

#### Product Search
```graphql
query SearchProducts(
  $retailerType: RetailerTypeEnum!
  $searchQuery: String!
  $diaperSize: String
  $maxResults: Int = 10
) {
  searchProducts(
    retailerType: $retailerType
    searchQuery: $searchQuery
    diaperSize: $diaperSize
    maxResults: $maxResults
  ) {
    success
    products {
      retailerProductId
      name
      brand
      priceCad
      pricePerUnit
      availability
      estimatedDeliveryDays
    }
  }
}
```

### Core Mutations

#### Create Subscription
```graphql
mutation CreateSubscription($input: CreateSubscriptionInput!) {
  createSubscription(input: $input) {
    success
    subscription {
      id
      tier
      billingAmountCad
      totalTaxRate
    }
    clientSecret
    message
  }
}
```

#### Create Manual Order
```graphql
mutation CreateManualOrder($input: ManualOrderInput!) {
  createManualOrder(input: $input) {
    success
    transaction {
      id
      orderNumber
      status
      totalAmountCad
      trackingNumber
    }
    message
  }
}
```

### Real-time Subscriptions

#### Order Status Updates
```graphql
subscription OrderStatusUpdates($userId: String!) {
  orderStatusUpdates(userId: $userId) {
    orderId
    newStatus
    trackingNumber
    estimatedDelivery
    statusMessage
  }
}
```

## Machine Learning Pipeline

### Prophet-based Forecasting

The ML pipeline uses Facebook's Prophet library for time series forecasting of diaper consumption patterns.

#### Model Features

1. **Historical Usage Patterns**: Daily diaper change frequency
2. **Growth Adjustments**: Age-based consumption rate changes
3. **Seasonal Factors**: Holiday periods and seasonal variations
4. **Day-of-week Effects**: Weekend vs weekday usage patterns

#### Prediction Workflow

```python
# 1. Data Preparation
usage_data = await get_usage_history(child_id, days=90)
df = pd.DataFrame(usage_data)
df['ds'] = pd.to_datetime(df['date'])
df['y'] = df['daily_usage']

# 2. Feature Engineering
df = await add_growth_factors(df, child)
df = await add_seasonal_factors(df)

# 3. Model Training
model = Prophet(
    growth='linear',
    seasonality_mode='multiplicative',
    yearly_seasonality=True,
    weekly_seasonality=True
)
model.add_regressor('growth_factor')
model.add_regressor('seasonal_factor')
model.fit(df)

# 4. Prediction Generation
future = model.make_future_dataframe(periods=30)
forecast = model.predict(future)

# 5. Confidence Assessment
confidence = determine_confidence_level(mae, r2, data_points)
```

#### Confidence Levels

- **VERY_HIGH**: R² > 0.8, MAE < 1.5, 30+ data points
- **HIGH**: R² > 0.7, MAE < 2.0, 30+ data points
- **MEDIUM**: R² > 0.5, MAE < 3.0, 14+ data points
- **LOW**: R² > 0.3, MAE < 4.0, 14+ data points
- **VERY_LOW**: Below threshold or insufficient data

## Stripe Integration

### Canadian Tax Handling

The system automatically calculates Canadian taxes based on province:

```python
canadian_tax_rates = {
    'ON': {'gst': 0.00, 'pst_hst': 0.13},  # HST
    'BC': {'gst': 0.05, 'pst_hst': 0.07},  # GST + PST
    'AB': {'gst': 0.05, 'pst_hst': 0.00},  # GST only
    # ... all provinces
}
```

### Subscription Tiers

#### Basic ($19.99 CAD/month)
- 1 child profile
- Auto-reorder enabled
- ML predictions
- Basic support

#### Premium ($29.99 CAD/month)
- 3 child profiles
- Price comparison
- Bulk discounts
- All Basic features

#### Family ($34.99 CAD/month)
- 10 child profiles
- Priority support
- All Premium features

### Webhook Handling

The system processes Stripe webhooks for:

- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `payment_intent.succeeded`

## Retailer API Integration

### Supported Retailers

#### Amazon Canada (Product Advertising API 5.0)
- **Authentication**: AWS4 signature with access keys
- **Rate Limits**: 1000 requests/hour
- **Features**: Product search, pricing, availability
- **Order Flow**: Affiliate links (no direct ordering)

#### Walmart Canada
- **Authentication**: OAuth 2.0 client credentials
- **Rate Limits**: 5000 requests/hour
- **Features**: Product search, pricing, availability
- **Order Flow**: Partner integration (planned)

### API Client Pattern

```python
async with RetailerAPIService(session) as api_client:
    # Search for products
    products = await api_client.search_products(
        retailer_config=config,
        search_query="huggies size 2 diapers",
        diaper_size="Size 2",
        max_results=10
    )

    # Submit order
    result = await api_client.submit_order(
        retailer_config=config,
        products=selected_products,
        delivery_address=address,
        order_reference=order_number
    )
```

## Real-time Features

### WebSocket Service

The WebSocket service provides real-time updates for:

1. **Order Status Changes**: Shipment tracking, delivery updates
2. **Prediction Updates**: New ML forecasts, inventory alerts
3. **Billing Events**: Payment confirmations, subscription changes

#### Connection Management

```javascript
// Frontend WebSocket connection
const ws = new WebSocket('ws://localhost:8002');

ws.onopen = () => {
  // Authenticate
  ws.send(JSON.stringify({
    type: 'authenticate',
    data: { token: userToken }
  }));

  // Subscribe to order updates
  ws.send(JSON.stringify({
    type: 'subscribe_order_updates',
    data: {}
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.type === 'order_status_update') {
    updateOrderStatus(message.data);
  }
};
```

## Testing Framework

### Test Structure

```
tests/
├── conftest.py                    # Test fixtures and configuration
├── unit/
│   ├── services/
│   │   ├── test_reorder_service.py
│   │   └── test_retailer_api_service.py
│   └── graphql/
│       └── test_reorder_resolvers.py
└── integration/
    ├── api/
    │   └── test_stripe_webhooks.py
    └── database/
        └── test_reorder_models.py
```

### Running Tests

```bash
# Run all tests
pytest

# Run specific test categories
pytest -m unit                    # Unit tests only
pytest -m integration            # Integration tests only
pytest -m subscription          # Subscription-related tests
pytest -m canadian             # Canadian compliance tests
pytest -m ml                   # Machine learning tests

# Run with coverage
pytest --cov=app --cov-report=html
```

### Test Fixtures

Key test fixtures available:

- `test_user`: Sample user for testing
- `test_child`: Sample child profile
- `test_subscription`: Active subscription
- `test_retailer_config`: Retailer API configuration
- `mock_stripe`: Mocked Stripe API responses
- `canadian_test_data`: Canadian-specific test data

## Deployment

### Environment Configuration

#### Development (.env.example)
```bash
# Stripe Test Keys
STRIPE_PUBLISHABLE_KEY=pk_test_[your-test-publishable-key]
STRIPE_SECRET_KEY=sk_test_EXAMPLE_REPLACE_WITH_YOUR_TEST_KEY
STRIPE_WEBHOOK_SECRET=whsec_[your-webhook-secret]

# Subscription Price IDs
STRIPE_BASIC_PRICE_ID=price_test_basic
STRIPE_PREMIUM_PRICE_ID=price_test_premium
STRIPE_FAMILY_PRICE_ID=price_test_family

# Retailer APIs
AMAZON_CA_AFFILIATE_ID=your-affiliate-id
WALMART_CA_PARTNER_ID=your-partner-id
```

#### Production (.env.production.template)
```bash
# Stripe Live Keys
STRIPE_PUBLISHABLE_KEY=pk_live_[your-live-publishable-key]
STRIPE_SECRET_KEY=sk_live_EXAMPLE_REPLACE_WITH_YOUR_LIVE_KEY
STRIPE_WEBHOOK_SECRET=whsec_[your-live-webhook-secret]

# Production Price IDs
STRIPE_BASIC_PRICE_ID=price_live_basic
STRIPE_PREMIUM_PRICE_ID=price_live_premium
STRIPE_FAMILY_PRICE_ID=price_live_family
```

### Database Migrations

```bash
# Create new migration
alembic revision --autogenerate -m "add reorder system"

# Apply migrations
alembic upgrade head

# Rollback if needed
alembic downgrade -1
```

### Health Checks

The system provides comprehensive health checks:

- `/graphql` - GraphQL endpoint health
- `/webhooks/stripe/health` - Stripe webhook health
- Database connectivity
- Redis connectivity
- External API status

## Security Considerations

### PIPEDA Compliance

1. **Data Residency**: All data stored in Canadian regions
2. **Consent Management**: Granular consent for data processing
3. **Data Retention**: Configurable retention periods
4. **Audit Trails**: Complete audit logs for data access

### API Security

1. **Authentication**: JWT-based authentication for GraphQL
2. **Authorization**: Role-based access control
3. **Rate Limiting**: Configurable rate limits per endpoint
4. **Input Validation**: Comprehensive input sanitization

### Payment Security

1. **PCI Compliance**: Stripe handles all payment data
2. **Webhook Security**: Signature verification for all webhooks
3. **Token Management**: Secure storage of API credentials
4. **Audit Logging**: Complete payment audit trails

## Monitoring and Observability

### Key Metrics

1. **Subscription Metrics**:
   - Active subscriptions by tier
   - Monthly recurring revenue (MRR)
   - Churn rate and retention

2. **ML Performance**:
   - Prediction accuracy (MAE, R²)
   - Confidence distribution
   - Model drift detection

3. **Retailer Integration**:
   - API success rates
   - Response time percentiles
   - Error rate by retailer

4. **Order Fulfillment**:
   - Order success rate
   - Average delivery time
   - Customer satisfaction scores

### Alerting

Critical alerts configured for:

- Payment failures (>5% failure rate)
- ML model degradation (accuracy <80%)
- Retailer API outages (>10% error rate)
- Subscription cancellation spikes (>2x normal)

## Future Enhancements

### Planned Features

1. **Enhanced ML Models**:
   - Deep learning models for better accuracy
   - Multi-child household optimization
   - Seasonal demand forecasting

2. **Additional Retailers**:
   - Loblaws/Metro/Sobeys integration
   - Costco Canada partnership
   - Local pharmacy chains

3. **Advanced Features**:
   - Smart bundling and bulk discounts
   - Eco-friendly product recommendations
   - Price optimization algorithms

4. **Mobile Enhancements**:
   - Push notification improvements
   - Offline mode capabilities
   - Barcode scanning for inventory

### Technical Debt

1. **Testing Coverage**: Increase to 95%+ coverage
2. **Performance Optimization**: Database query optimization
3. **Documentation**: API documentation automation
4. **Monitoring**: Enhanced observability metrics

## Support and Maintenance

### Development Team Contacts

- **Backend Lead**: ML pipeline and subscription management
- **Integration Lead**: Retailer APIs and payment processing
- **DevOps Lead**: Deployment and monitoring
- **QA Lead**: Testing and compliance validation

### Issue Escalation

1. **P0 - Critical**: Payment failures, data breaches
2. **P1 - High**: ML model failures, API outages
3. **P2 - Medium**: Feature bugs, performance issues
4. **P3 - Low**: Enhancement requests, documentation

### Maintenance Windows

- **Regular Maintenance**: Sundays 2-4 AM EST
- **Emergency Patches**: As needed with 1-hour notice
- **Major Updates**: Monthly with 2-week notice

---

*This documentation is maintained by the NestSync development team and updated with each major release. For questions or clarifications, please contact the backend team.*