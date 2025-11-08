# Backend API Documentation

## Overview

NestSync backend provides a GraphQL API for all client interactions. This documentation covers the complete API surface, including queries, mutations, subscriptions, and implementation patterns.

## Contents

- [GraphQL Schema](./graphql-schema.md) - Complete schema definitions
- [Resolvers](./resolvers.md) - Resolver implementation patterns
- [Mutations](./mutations.md) - Mutation documentation and examples
- [Error Handling](./error-handling.md) - Error response formats and handling
- [Authentication](./authentication.md) - Auth patterns and token management
- [Performance](./performance.md) - Query optimization and caching

## GraphQL API

### Endpoint
```
POST /graphql
```

### Authentication
All API requests require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Key Features

### Family-Based Data Access
All data access is scoped to the authenticated user's family context. Row Level Security (RLS) policies enforce data isolation at the database level.

### Real-Time Updates
Subscriptions are available for real-time updates on:
- Inventory changes
- Notification events
- Collaboration activities

### Batch Operations
The API supports batch operations for efficient data manipulation:
- Bulk inventory updates
- Batch child profile updates
- Multiple notification operations

## Common Patterns

### Querying Data
```graphql
query GetMyChildren {
  myChildren {
    id
    name
    dateOfBirth
    gender
  }
}
```

### Mutations
```graphql
mutation AddInventoryItem($input: InventoryItemInput!) {
  addInventoryItem(input: $input) {
    id
    itemName
    quantity
  }
}
```

### Error Handling
All mutations return standardized error responses:
```graphql
{
  "errors": [{
    "message": "Error description",
    "extensions": {
      "code": "ERROR_CODE",
      "field": "fieldName"
    }
  }]
}
```

## API Sections

### Children Management
- Query children profiles
- Create and update child records
- Manage child-specific data

### Inventory Management
- Query inventory items
- Add, update, and delete items
- Track usage and reorder suggestions

### Analytics
- Query usage analytics
- Generate reports
- Track trends and patterns

### Notifications
- Query notification preferences
- Update notification settings
- Manage notification delivery

### Subscription Management
- Query subscription status
- Manage payment methods
- Handle subscription lifecycle

## Testing

API testing documentation:
- [GraphQL Playground](http://localhost:8000/graphql) - Interactive API explorer
- [Test Queries](./test-queries.md) - Sample queries for testing
- [Integration Tests](../../tests/integration/) - Automated API tests

## Related Documentation

- [Database Schema](../database/schema.md) - Underlying data models
- [Authentication](./authentication.md) - Auth implementation details
- [Deployment](../deployment/) - API deployment configuration

---

[← Back to Backend Docs](../README.md)
