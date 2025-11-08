# State Management Documentation

## Overview

NestSync frontend uses a multi-layered state management approach combining Zustand for app state, Apollo Client for server data, and MMKV for persistent storage.

## Contents

- [Zustand Stores](./zustand-stores.md) - App-wide state management
- [Apollo Cache](./apollo-cache.md) - GraphQL data caching
- [Storage](./storage.md) - Persistent storage patterns
- [State Synchronization](./synchronization.md) - Keeping state in sync

## State Management Layers

### 1. Local Component State
**Use For**: UI-only state that doesn't need to be shared
- Form input values
- Modal open/closed state
- Accordion expanded state
- Local loading indicators

**Implementation**: React `useState` and `useReducer`

```tsx
const [isOpen, setIsOpen] = useState(false);
```

### 2. Zustand Stores
**Use For**: App-wide state that needs to be shared across components
- Authentication state
- Family context
- App preferences
- UI theme

**Implementation**: Zustand stores with persistence

```tsx
const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setUser: (user) => set({ user }),
      logout: () => set({ user: null, token: null }),
    }),
    { name: 'auth-storage' }
  )
);
```

### 3. Apollo Client Cache
**Use For**: Server data that needs to be cached and synchronized
- Children profiles
- Inventory items
- Analytics data
- Notification preferences

**Implementation**: Apollo Client with normalized cache

```tsx
const { data, loading, error } = useQuery(GET_CHILDREN, {
  fetchPolicy: 'cache-and-network',
});
```

### 4. MMKV Storage
**Use For**: Persistent data that needs fast access
- Authentication tokens
- User preferences
- Cached images
- Offline data

**Implementation**: MMKV with encryption

```tsx
const storage = new MMKV({
  id: 'nestsync-storage',
  encryptionKey: 'encryption-key',
});
```

## State Flow

### Data Flow Diagram
```
User Action
    ↓
Component Event Handler
    ↓
Zustand Action / Apollo Mutation
    ↓
API Request (if needed)
    ↓
Update Cache / Store
    ↓
Re-render Components
```

### Read Flow
```
Component Mount
    ↓
Check Zustand Store / Apollo Cache
    ↓
If not cached → Fetch from API
    ↓
Update Cache
    ↓
Render with Data
```

## Zustand Stores

### Auth Store
Manages authentication state:
- User information
- JWT token
- Login/logout actions
- Token refresh

### Family Store
Manages family context:
- Current family
- Family members
- Family switching
- Family permissions

### Preferences Store
Manages app preferences:
- Theme (light/dark)
- Unit preferences (metric/imperial)
- Notification settings
- Language preferences

### Subscription Store
Manages subscription state:
- Subscription status
- Trial information
- Feature access
- Payment status

## Apollo Client Configuration

### Cache Configuration
```tsx
const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        myChildren: {
          merge(existing, incoming) {
            return incoming;
          },
        },
      },
    },
  },
});
```

### Optimistic Updates
```tsx
const [addItem] = useMutation(ADD_INVENTORY_ITEM, {
  optimisticResponse: {
    addInventoryItem: {
      __typename: 'InventoryItem',
      id: 'temp-id',
      itemName: input.itemName,
      quantity: input.quantity,
    },
  },
  update(cache, { data }) {
    // Update cache with new item
  },
});
```

### Error Handling
```tsx
const { data, error } = useQuery(GET_CHILDREN, {
  onError: (error) => {
    if (error.message.includes('Unauthorized')) {
      // Handle auth error
    }
  },
});
```

## Storage Patterns

### Secure Storage
For sensitive data (tokens, keys):
```tsx
const secureStorage = new MMKV({
  id: 'secure-storage',
  encryptionKey: getEncryptionKey(),
});
```

### Cache Storage
For cached data (images, responses):
```tsx
const cacheStorage = new MMKV({
  id: 'cache-storage',
});
```

### Preferences Storage
For user preferences:
```tsx
const preferencesStorage = new MMKV({
  id: 'preferences-storage',
});
```

## State Synchronization

### Cross-Tab Synchronization
Not applicable for mobile apps, but important for web:
- Use BroadcastChannel API
- Sync state changes across tabs
- Handle conflicts

### Offline Synchronization
- Queue mutations when offline
- Retry on reconnection
- Conflict resolution
- Optimistic UI updates

### Real-Time Updates
- GraphQL subscriptions for real-time data
- WebSocket connection management
- Automatic reconnection
- Update cache on subscription events

## Performance Optimization

### Memoization
```tsx
const memoizedValue = useMemo(() => {
  return expensiveComputation(data);
}, [data]);
```

### Selective Re-renders
```tsx
const user = useAuthStore((state) => state.user);
// Only re-renders when user changes
```

### Cache Normalization
- Normalize entities by ID
- Avoid duplicate data
- Efficient cache updates

## Testing

### Store Testing
```tsx
test('auth store login', () => {
  const { result } = renderHook(() => useAuthStore());
  act(() => {
    result.current.login(user, token);
  });
  expect(result.current.user).toEqual(user);
});
```

### Apollo Testing
```tsx
const mocks = [
  {
    request: { query: GET_CHILDREN },
    result: { data: { myChildren: [] } },
  },
];

render(
  <MockedProvider mocks={mocks}>
    <Component />
  </MockedProvider>
);
```

## Related Documentation

- [Components](../components/) - Component patterns
- [Screens](../screens/) - Screen-level state
- [Testing](../testing/) - State testing strategies

---

[← Back to Frontend Docs](../README.md)
