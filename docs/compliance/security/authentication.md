# Authentication Security

**Last Updated**: November 8, 2025  
**Status**: Active  
**Security Level**: Critical

---

## Overview

NestSync implements a comprehensive authentication system using Supabase Auth with JWT tokens, secure token storage, and automatic refresh mechanisms to ensure secure user access across all platforms.

## Authentication Architecture

### Components

```
┌─────────────────┐
│   User Login    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Supabase Auth  │ ← Email/Password Verification
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   JWT Tokens    │ ← Access + Refresh Tokens
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Secure Storage  │ ← Expo SecureStore (Mobile)
│                 │   AsyncStorage (Web)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ GraphQL Requests│ ← Authorization Header
└─────────────────┘
```

## Supabase Authentication

### Provider Configuration

**Service**: Supabase Auth  
**Region**: Canada (ca-central-1)  
**Authentication Methods**:
- Email/Password (primary)
- Email verification required
- Password reset via email

### User Registration Flow

1. **User submits registration**:
   - Email address
   - Password (minimum 8 characters)
   - Terms and privacy policy acceptance

2. **Supabase creates auth user**:
   - Generates unique `supabase_user_id`
   - Sends verification email
   - Returns JWT tokens

3. **Backend creates user profile**:
   - Links to `supabase_user_id`
   - Creates user record in database
   - Initializes user preferences

4. **Email verification**:
   - User clicks verification link
   - Supabase confirms email
   - User can access full features

### Sign-In Flow

1. **User submits credentials**:
   ```typescript
   const { data, error } = await supabase.auth.signInWithPassword({
     email: email,
     password: password
   });
   ```

2. **Supabase validates credentials**:
   - Verifies email/password match
   - Checks email verification status
   - Generates new JWT tokens

3. **Tokens stored securely**:
   - Access token (short-lived, 1 hour)
   - Refresh token (long-lived, 30 days)
   - Stored in platform-specific secure storage

4. **User profile loaded**:
   - GraphQL query with JWT token
   - User data fetched from database
   - App navigates to dashboard

## JWT Token Management

### Token Structure

**Access Token**:
```json
{
  "sub": "7e99068d-8d2b-4c6e-b259-a95503ae2e79",
  "email": "user@example.com",
  "role": "authenticated",
  "iat": 1699459200,
  "exp": 1699462800
}
```

**Refresh Token**:
- Opaque token stored securely
- Used to obtain new access tokens
- Expires after 30 days of inactivity

### Token Lifecycle

1. **Token Issuance**: On successful authentication
2. **Token Usage**: Included in Authorization header for all API requests
3. **Token Refresh**: Automatic refresh before expiration
4. **Token Revocation**: On logout or security events

### Automatic Token Refresh

```typescript
// Token refresh logic
async function refreshTokenIfNeeded() {
  const session = await supabase.auth.getSession();
  
  if (!session?.data?.session) {
    return null;
  }
  
  const expiresAt = session.data.session.expires_at;
  const now = Math.floor(Date.now() / 1000);
  
  // Refresh if token expires in less than 5 minutes
  if (expiresAt - now < 300) {
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      // Force re-authentication
      await handleAuthError();
      return null;
    }
    
    return data.session;
  }
  
  return session.data.session;
}
```

## Secure Token Storage

### Platform-Specific Storage

**iOS/Android (React Native)**:
```typescript
import * as SecureStore from 'expo-secure-store';

// Store tokens securely
await SecureStore.setItemAsync('access_token', accessToken);
await SecureStore.setItemAsync('refresh_token', refreshToken);

// Retrieve tokens
const accessToken = await SecureStore.getItemAsync('access_token');
```

**Web**:
```typescript
// Use AsyncStorage with encryption
import AsyncStorage from '@react-native-async-storage/async-storage';

// Store with encryption
await AsyncStorage.setItem('access_token', encryptToken(accessToken));

// Retrieve and decrypt
const encryptedToken = await AsyncStorage.getItem('access_token');
const accessToken = decryptToken(encryptedToken);
```

### Storage Security Measures

1. **Encryption at Rest**: All tokens encrypted before storage
2. **Platform Keychain**: iOS Keychain, Android Keystore
3. **No Plain Text**: Tokens never stored in plain text
4. **Automatic Cleanup**: Tokens removed on logout
5. **Secure Deletion**: Overwrite before deletion

## Session Management

### Session Validation

**On App Launch**:
```typescript
async function validateSession() {
  // 1. Check if tokens exist
  const accessToken = await getStoredAccessToken();
  if (!accessToken) {
    return { valid: false, reason: 'no_token' };
  }
  
  // 2. Verify token with Supabase
  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error) {
    return { valid: false, reason: 'invalid_token' };
  }
  
  // 3. Check token expiration
  const session = await supabase.auth.getSession();
  if (isTokenExpired(session)) {
    // Attempt refresh
    const refreshed = await refreshTokenIfNeeded();
    if (!refreshed) {
      return { valid: false, reason: 'refresh_failed' };
    }
  }
  
  return { valid: true, user: data.user };
}
```

### Session Timeout

- **Access Token**: 1 hour expiration
- **Refresh Token**: 30 days expiration
- **Idle Timeout**: None (tokens expire based on time, not activity)
- **Forced Logout**: On security events or password change

### Multi-Device Sessions

- Users can be logged in on multiple devices
- Each device has independent tokens
- Logout on one device doesn't affect others
- Password change invalidates all sessions

## Password Security

### Password Requirements

**Minimum Requirements**:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

**Validation**:
```typescript
function validatePassword(password: string): boolean {
  const minLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return minLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;
}
```

### Password Storage

- **Never Stored Plain Text**: Passwords never stored in our database
- **Supabase Hashing**: Supabase handles password hashing (bcrypt)
- **No Password Transmission**: Passwords only sent to Supabase over HTTPS
- **No Password Logging**: Passwords never logged or cached

### Password Reset

1. **User requests reset**:
   ```typescript
   await supabase.auth.resetPasswordForEmail(email);
   ```

2. **Supabase sends reset email**:
   - Secure reset link with token
   - Token expires in 1 hour
   - One-time use only

3. **User sets new password**:
   - Validates password requirements
   - Supabase updates password hash
   - All existing sessions invalidated

4. **User logs in with new password**:
   - New tokens issued
   - User must re-authenticate on all devices

## Authorization

### GraphQL Authorization

**Authorization Header**:
```http
POST /graphql HTTP/1.1
Host: api.nestsync.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Backend Validation**:
```python
async def get_authenticated_user(info: Info) -> User:
    """Extract and validate user from JWT token"""
    auth_header = info.context.request.headers.get("Authorization")
    
    if not auth_header or not auth_header.startswith("Bearer "):
        raise GraphQLError("Authentication required", 
                          extensions={"code": "UNAUTHENTICATED"})
    
    token = auth_header.replace("Bearer ", "")
    
    # Verify token with Supabase
    user_data = await supabase_client.auth.get_user(token)
    
    if not user_data:
        raise GraphQLError("Invalid token", 
                          extensions={"code": "UNAUTHENTICATED"})
    
    # Load user from database
    user = await get_user_by_supabase_id(user_data.id)
    
    if not user:
        raise GraphQLError("User not found", 
                          extensions={"code": "UNAUTHENTICATED"})
    
    return user
```

### Row Level Security (RLS)

All database queries automatically filtered by user:
```sql
-- RLS policy ensures users only see their own data
CREATE POLICY "Users can view own profile" 
ON public.users 
FOR SELECT 
USING (supabase_user_id = auth.uid());
```

See [RLS Policies](./rls-policies.md) for complete implementation.

## Security Best Practices

### Token Security

1. **Short-Lived Access Tokens**: 1-hour expiration minimizes exposure
2. **Secure Refresh Tokens**: Long-lived but stored securely
3. **Token Rotation**: New tokens on each refresh
4. **No Token in URLs**: Tokens only in Authorization headers
5. **HTTPS Only**: All token transmission over HTTPS

### Authentication Security

1. **Email Verification**: Required before full access
2. **Strong Passwords**: Enforced password requirements
3. **Rate Limiting**: Prevent brute force attacks
4. **Account Lockout**: After multiple failed attempts
5. **Audit Logging**: All authentication events logged

### Session Security

1. **Automatic Logout**: On token expiration
2. **Secure Storage**: Platform-specific secure storage
3. **Session Validation**: On app launch and resume
4. **Token Cleanup**: On logout and errors
5. **Multi-Device Support**: Independent sessions per device

## Threat Mitigation

### Brute Force Attacks

**Protection**:
- Rate limiting on login attempts
- Account lockout after 5 failed attempts
- CAPTCHA after 3 failed attempts
- IP-based rate limiting

**Implementation**:
```python
# Supabase handles rate limiting automatically
# Additional backend rate limiting
@rate_limit(max_attempts=5, window=300)  # 5 attempts per 5 minutes
async def sign_in(email: str, password: str):
    return await supabase.auth.sign_in_with_password(email, password)
```

### Token Theft

**Protection**:
- Short-lived access tokens
- Secure token storage
- HTTPS-only transmission
- Token binding to device
- Automatic token rotation

**Detection**:
- Monitor for unusual access patterns
- Alert on multiple simultaneous sessions
- Log all token usage

### Session Hijacking

**Protection**:
- Secure token storage
- No token in URLs or logs
- HTTPS-only communication
- Token expiration
- Session validation

**Detection**:
- Monitor for IP address changes
- Alert on unusual user agent changes
- Log all session activities

### Phishing Attacks

**Protection**:
- Email verification required
- Password reset confirmation
- Security notifications
- User education

**User Notifications**:
- Email on password change
- Email on new device login
- Email on account changes

## Monitoring and Alerts

### Authentication Monitoring

**Monitored Events**:
- Failed login attempts
- Successful logins
- Password resets
- Token refreshes
- Session expirations
- Account lockouts

**Alert Triggers**:
- Multiple failed login attempts
- Login from new location
- Password reset requests
- Unusual access patterns
- Token validation failures

### Audit Logging

All authentication events logged:
```python
auth_audit_log = AuthAuditLog(
    user_id=user.id,
    event_type="login",
    success=True,
    ip_address=request.ip_address,
    user_agent=request.user_agent,
    metadata={
        "method": "email_password",
        "device_type": "mobile",
        "platform": "ios"
    }
)
```

## Incident Response

### Compromised Account

1. **Immediate Actions**:
   - Invalidate all tokens
   - Force password reset
   - Lock account temporarily
   - Notify user via email

2. **Investigation**:
   - Review audit logs
   - Identify unauthorized access
   - Assess data exposure
   - Document incident

3. **Recovery**:
   - User resets password
   - User verifies email
   - User reviews account activity
   - Account unlocked

### Compromised Tokens

1. **Detection**:
   - Unusual access patterns
   - Multiple simultaneous sessions
   - Geographic anomalies

2. **Response**:
   - Invalidate affected tokens
   - Force re-authentication
   - Notify user
   - Review audit logs

3. **Prevention**:
   - Rotate refresh tokens
   - Update security measures
   - User education

## Related Documentation

- [RLS Policies](./rls-policies.md) - Database-level security
- [Encryption](./encryption.md) - Data encryption at rest and in transit
- [Audit Trails](../pipeda/audit-trails.md) - Authentication audit logging
- [Backend Auth](../../../NestSync-backend/docs/api/authentication.md) - Backend implementation

## Support and Contact

**Security Issues**: security@nestsync.com  
**Account Issues**: support@nestsync.com  
**Emergency**: security-emergency@nestsync.com

---

**Document Owner**: Security Team  
**Review Frequency**: Quarterly  
**Next Review**: February 8, 2026
