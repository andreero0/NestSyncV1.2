# NestSync Security Remediation Plan
**Status:** ACTIVE REMEDIATION
**Created:** 2025-11-19
**Priority:** IMMEDIATE ACTION REQUIRED

---

## 🎯 Quick Action Summary

### Today (0-24 hours):
- [ ] Remove sensitive data from console logs (CRIT-001)
- [ ] Lock down rate limiting configuration (CRIT-002)
- [ ] Run security audit scripts
- [ ] Deploy fixes to development environment

### This Week (1-7 days):
- [ ] Disable GraphQL introspection (HIGH-001)
- [ ] Fix CORS configuration (HIGH-002)
- [ ] Enforce JWT secret strength (HIGH-003)
- [ ] Implement secure web token storage (HIGH-004)
- [ ] Deploy to staging and test

### This Month (2-4 weeks):
- [ ] Address all 8 MEDIUM severity findings
- [ ] Implement automated security scanning
- [ ] Update security documentation
- [ ] Train team on secure coding practices

---

## 🔴 CRITICAL FIXES - DO FIRST

### CRIT-001: Remove Sensitive Data Logging

#### Step 1: Create Secure Logger Utility

**File:** `NestSync-frontend/lib/utils/secureLogger.ts`

```typescript
/**
 * Secure Logger - Prevents sensitive data exposure
 * Use this instead of console.log throughout the application
 */

const SENSITIVE_KEYWORDS = [
  'token', 'password', 'secret', 'jwt', 'authorization',
  'bearer', 'api_key', 'apikey', 'auth', 'credential',
  'session', 'cookie', 'key', 'private', 'refresh'
];

/**
 * Check if a string contains sensitive data patterns
 */
function containsSensitiveData(str: string): boolean {
  if (typeof str !== 'string') return false;
  const lowerStr = str.toLowerCase();
  return SENSITIVE_KEYWORDS.some(keyword => lowerStr.includes(keyword));
}

/**
 * Recursively sanitize object by redacting sensitive fields
 */
function sanitizeData(data: any, depth: number = 0): any {
  // Prevent infinite recursion
  if (depth > 5) return '[MAX_DEPTH]';

  if (data === null || data === undefined) {
    return data;
  }

  // Handle primitive types
  if (typeof data !== 'object') {
    return data;
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item, depth + 1));
  }

  // Handle objects
  const sanitized: any = {};
  for (const [key, value] of Object.entries(data)) {
    // Redact sensitive keys
    if (containsSensitiveData(key)) {
      sanitized[key] = '[REDACTED]';
      continue;
    }

    // Redact sensitive string values (JWT patterns, etc.)
    if (typeof value === 'string') {
      // JWT pattern: xxx.yyy.zzz
      if (/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/.test(value)) {
        sanitized[key] = '[REDACTED_JWT]';
        continue;
      }
      // Long base64/hex strings (likely tokens)
      if (value.length > 50 && /^[A-Za-z0-9+/=\-_]+$/.test(value)) {
        sanitized[key] = '[REDACTED_TOKEN]';
        continue;
      }
    }

    // Recursively sanitize nested objects
    sanitized[key] = sanitizeData(value, depth + 1);
  }

  return sanitized;
}

/**
 * Secure logger - Only logs in development, always sanitizes data
 */
export const secureLog = {
  debug: (message: string, data?: any) => {
    if (__DEV__) {
      console.debug(`[DEBUG] ${message}`, data ? sanitizeData(data) : '');
    }
  },

  info: (message: string, data?: any) => {
    if (__DEV__) {
      console.info(`[INFO] ${message}`, data ? sanitizeData(data) : '');
    }
  },

  warn: (message: string, data?: any) => {
    if (__DEV__) {
      console.warn(`[WARN] ${message}`, data ? sanitizeData(data) : '');
    }
  },

  error: (message: string, error?: any) => {
    // Errors should be logged in production for monitoring
    // but still sanitized
    const sanitizedError = error instanceof Error
      ? { message: error.message, stack: error.stack }
      : sanitizeData(error);

    console.error(`[ERROR] ${message}`, sanitizedError);
  },

  // NEVER use this in production code - for debugging only
  unsafeLog: (message: string, data?: any) => {
    if (__DEV__ && process.env.EXPO_PUBLIC_UNSAFE_LOGGING === 'true') {
      console.log(`[UNSAFE] ${message}`, data);
    }
  }
};

/**
 * Sanitize function for external use
 */
export function sanitize(data: any): any {
  return sanitizeData(data);
}

/**
 * Check if data contains sensitive information
 */
export function isSensitive(data: any): boolean {
  if (typeof data === 'string') {
    return containsSensitiveData(data);
  }
  if (typeof data === 'object' && data !== null) {
    return Object.keys(data).some(key => containsSensitiveData(key));
  }
  return false;
}

export default secureLog;
```

#### Step 2: Find and Replace All Sensitive Logging

**Script:** `NestSync-frontend/scripts/fix-sensitive-logging.sh`

```bash
#!/bin/bash

echo "🔍 Scanning for sensitive data logging..."

# Find all console.log/error/warn statements with sensitive keywords
grep -rn "console\.\(log\|error\|warn\|debug\|info\)" \
  lib/ components/ app/ hooks/ stores/ \
  | grep -iE "(token|password|secret|jwt|auth|credential|key)" \
  > /tmp/sensitive-logs.txt

if [ -s /tmp/sensitive-logs.txt ]; then
  echo "❌ Found $(wc -l < /tmp/sensitive-logs.txt) instances of sensitive logging:"
  cat /tmp/sensitive-logs.txt
  echo ""
  echo "📝 Manual fix required for each instance:"
  echo "   1. Review the log statement"
  echo "   2. Replace console.log with secureLog.info"
  echo "   3. Ensure data is sanitized"
  echo ""
  echo "Example:"
  echo "  Before: console.log('Token:', token)"
  echo "  After:  secureLog.info('Token validated', { hasToken: !!token, length: token?.length })"
else
  echo "✅ No sensitive logging found!"
fi

# Create ESLint rule to prevent future issues
cat > .eslintrc-security.json <<'EOF'
{
  "rules": {
    "no-console": ["warn", {
      "allow": ["error"]
    }],
    "no-restricted-syntax": [
      "error",
      {
        "selector": "CallExpression[callee.object.name='console'][callee.property.name=/^(log|info|warn|debug)$/] > Literal[value=/(token|password|secret|jwt|auth|key)/i]",
        "message": "Do not log sensitive data. Use secureLog utility instead."
      }
    ]
  }
}
EOF

echo ""
echo "📄 Created .eslintrc-security.json with rules to prevent sensitive logging"
echo "   Add to your main .eslintrc.js: extends: ['./.eslintrc-security.json']"
```

#### Step 3: Update Existing Code

**Manual fixes needed in:**

1. `hooks/useUniversalStorage.ts` - Lines with token logging
2. `lib/graphql/client.ts` - WebSocket URL logging
3. `stores/authStore.ts` - Authentication state logging
4. Any other files identified by the script

**Example fix:**

```typescript
// BEFORE (VULNERABLE):
console.log('Access token:', accessToken);
console.log('Refresh token:', refreshToken);

// AFTER (SECURE):
import { secureLog } from '../lib/utils/secureLogger';

secureLog.info('Token validation', {
  hasAccessToken: !!accessToken,
  hasRefreshToken: !!refreshToken,
  accessTokenLength: accessToken?.length,
  refreshTokenLength: refreshToken?.length
});
```

---

### CRIT-002: Lock Down Rate Limiting

#### Step 1: Add Production Validation

**File:** `NestSync-backend/app/config/settings.py`

Add this validator after line 72:

```python
@validator("rate_limiting_enabled")
def validate_rate_limiting_production(cls, v, values):
    """
    Enforce rate limiting in production environments
    SECURITY: Prevents DoS attacks and API abuse
    """
    environment = values.get("environment", "development")

    # CRITICAL: Rate limiting cannot be disabled in production
    if environment == "production" and not v:
        raise ValueError(
            "SECURITY ERROR: Rate limiting cannot be disabled in production environment. "
            "This is a critical security requirement for PIPEDA compliance and DoS prevention. "
            "Set RATE_LIMITING_ENABLED=true or remove the environment variable."
        )

    # WARNING: Rate limiting should be enabled in staging
    if environment == "staging" and not v:
        logger.warning(
            "Rate limiting is DISABLED in staging environment. "
            "This should only be done for load testing purposes. "
            "Re-enable before promoting to production."
        )

    return v

@validator("rate_limit_requests")
def validate_rate_limit_reasonable(cls, v):
    """Ensure rate limits are reasonable"""
    if v < 10:
        raise ValueError("Rate limit too restrictive (minimum 10 requests)")
    if v > 10000:
        raise ValueError("Rate limit too permissive (maximum 10000 requests)")
    return v
```

#### Step 2: Update Environment Template

**File:** `scripts/templates/.env.production.template`

Update line 31:

```bash
# REMOVED - Rate limiting cannot be disabled in production
# RATE_LIMITING_ENABLED is always true in production

# Rate Limiting Configuration (adjust based on usage patterns)
RATE_LIMIT_REQUESTS=150  # Requests per window
RATE_LIMIT_WINDOW=900    # Window in seconds (15 minutes)
```

#### Step 3: Add Infrastructure-Level Rate Limiting

**File:** `NestSync-backend/railway.toml`

Add Cloudflare/Railway rate limiting configuration:

```toml
[build]
# ... existing build config ...

[deploy]
# ... existing deploy config ...

# Infrastructure-level rate limiting (defense in depth)
[deploy.healthcheck]
path = "/health/simple"
timeout = 30

[deploy.ratelimit]
# Cloudflare/Railway rate limiting rules
enabled = true
requests_per_minute = 300
burst_size = 50

# Per-endpoint rate limits
[[deploy.ratelimit.rules]]
path = "/graphql"
requests_per_minute = 200
burst_size = 30

[[deploy.ratelimit.rules]]
path = "/auth/*"
requests_per_minute = 50
burst_size = 10
```

#### Step 4: Add Rate Limit Monitoring

**File:** `NestSync-backend/app/middleware/security.py`

Add monitoring after line 195:

```python
# Log rate limit metrics for monitoring
if self.is_rate_limited(client_id, max_requests, window):
    logger.warning(
        f"Rate limit exceeded for client: {client_id}",
        extra={
            "client_id": client_id,
            "endpoint": request.url.path,
            "limit": max_requests,
            "window": window,
            "alert": "RATE_LIMIT_EXCEEDED"
        }
    )

    # TODO: Integrate with monitoring service (Sentry/Datadog)
    # sentry_sdk.capture_message(
    #     f"Rate limit exceeded: {client_id}",
    #     level="warning",
    #     extras={"client_id": client_id, "endpoint": request.url.path}
    # )

    return JSONResponse(
        status_code=429,
        content={
            "error": "Rate limit exceeded",
            "message": f"Too many requests. Limit: {max_requests} per {window} seconds",
            "retry_after": window
        },
        headers={
            "Retry-After": str(window),
            "X-RateLimit-Limit": str(max_requests),
            "X-RateLimit-Window": str(window)
        }
    )
```

---

## 🟠 HIGH PRIORITY FIXES - THIS WEEK

### HIGH-001: Disable GraphQL Introspection

**File:** `NestSync-backend/main.py`

Replace lines 416-421:

```python
# BEFORE (VULNERABLE):
graphql_app = GraphQLRouter(
    schema=schema,
    context_getter=create_graphql_context,
    graphiql=ENVIRONMENT != "production"  # Still allows introspection in staging!
)

# AFTER (SECURE):
from strawberry.extensions import DisableIntrospection, DisableValidation

# Only enable GraphiQL and introspection in local development
enable_graphiql = ENVIRONMENT == "development" and os.getenv("ENABLE_GRAPHIQL", "false").lower() == "true"
enable_introspection = ENVIRONMENT == "development" and os.getenv("ENABLE_INTROSPECTION", "false").lower() == "true"

# Log GraphQL security configuration
logger.info(f"GraphQL configuration - Environment: {ENVIRONMENT}")
logger.info(f"  GraphiQL: {'enabled' if enable_graphiql else 'disabled'}")
logger.info(f"  Introspection: {'enabled' if enable_introspection else 'disabled'}")

if not enable_introspection and ENVIRONMENT != "development":
    logger.info("  Introspection disabled for security (non-development environment)")

# Configure GraphQL with security extensions
graphql_extensions = []
if not enable_introspection:
    graphql_extensions.append(DisableIntrospection())
    logger.info("  Added DisableIntrospection extension")

graphql_app = GraphQLRouter(
    schema=schema,
    context_getter=create_graphql_context,
    graphiql=enable_graphiql,
    extensions=graphql_extensions
)
```

**Environment Variables:**

```bash
# .env.local (development only)
ENABLE_GRAPHIQL=true
ENABLE_INTROSPECTION=true

# .env.production (never set these)
# ENABLE_GRAPHIQL=false  # Default
# ENABLE_INTROSPECTION=false  # Default
```

---

### HIGH-002: Fix CORS Configuration

**File:** `NestSync-backend/main.py`

Replace lines 59-86 with:

```python
def get_cors_origins() -> List[str]:
    """
    Get CORS origins with strict security validation
    SECURITY: No dynamic origins, explicit whitelist only
    """
    if ENVIRONMENT == "production":
        # Production: Strict whitelist only
        origins = [
            "https://nestsync.ca",
            "https://www.nestsync.ca",
            "https://app.nestsync.ca"
        ]
        logger.info(f"CORS: Production mode - {len(origins)} whitelisted origins")
        return origins

    elif ENVIRONMENT == "staging":
        # Staging: Production origins + staging domain
        origins = [
            "https://staging.nestsync.ca",
            "https://nestsync-staging.railway.app",
            "http://localhost:8082"  # For testing against staging
        ]
        logger.info(f"CORS: Staging mode - {len(origins)} whitelisted origins")
        return origins

    else:
        # Development: Explicitly defined localhost origins only
        # NO DYNAMIC IP DETECTION for security
        origins = [
            "http://localhost:8082",
            "http://localhost:19006",  # Expo web
            "http://127.0.0.1:8082",
            "http://127.0.0.1:19006",
        ]

        # Allow custom development origin if explicitly configured
        custom_origin = os.getenv("CUSTOM_DEV_ORIGIN")
        if custom_origin:
            # Validate custom origin format
            if custom_origin.startswith(("http://", "https://")):
                origins.append(custom_origin)
                logger.info(f"CORS: Added custom development origin: {custom_origin}")
            else:
                logger.warning(f"CORS: Invalid custom origin format: {custom_origin}")

        logger.info(f"CORS: Development mode - {len(origins)} whitelisted origins")
        return origins


# Update CORS middleware configuration
cors_origins = get_cors_origins()

# Log CORS configuration for audit
logger.info("=" * 60)
logger.info("CORS CONFIGURATION")
logger.info(f"Environment: {ENVIRONMENT}")
logger.info(f"Allowed Origins: {len(cors_origins)}")
for origin in cors_origins:
    logger.info(f"  - {origin}")
logger.info("=" * 60)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,  # Strict whitelist, no wildcards
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Session-ID"],
    expose_headers=["X-RateLimit-Limit", "X-RateLimit-Remaining", "Retry-After"],
    max_age=600  # Cache preflight for 10 minutes
)
```

---

### HIGH-003: Enforce JWT Secret Strength

**File:** `NestSync-backend/app/config/settings.py`

Add after line 57:

```python
import math

@validator("secret_key")
def validate_secret_key_strength(cls, v):
    """
    Validate JWT secret key has adequate entropy
    SECURITY: Prevents token forgery via weak secret brute force
    """
    # Minimum length requirement
    if len(v) < 64:
        raise ValueError(
            "SECRET_KEY must be at least 64 characters for adequate security. "
            "Current length: {len(v)}. "
            "Generate a secure key with: openssl rand -base64 64"
        )

    # Maximum length (prevent DoS)
    if len(v) > 512:
        raise ValueError(
            "SECRET_KEY too long (max 512 characters). "
            "This may indicate misconfiguration."
        )

    # Check for common weak patterns
    weak_patterns = [
        "your-production-jwt-secret",
        "change-this-secret",
        "secret-key-here",
        "jwt-secret",
        "12345",
        "password",
        "admin"
    ]

    for pattern in weak_patterns:
        if pattern in v.lower():
            raise ValueError(
                f"SECRET_KEY contains weak pattern: '{pattern}'. "
                "Use a cryptographically random secret. "
                "Generate with: openssl rand -base64 64"
            )

    # Calculate Shannon entropy
    entropy = cls._calculate_entropy(v)
    min_entropy_bits = 256  # Minimum 256 bits of entropy

    if entropy < min_entropy_bits:
        raise ValueError(
            f"SECRET_KEY has insufficient entropy: {entropy:.1f} bits. "
            f"Minimum required: {min_entropy_bits} bits. "
            "Use a cryptographically random secret. "
            "Generate with: openssl rand -base64 64"
        )

    logger.info(f"SECRET_KEY validated: {len(v)} characters, {entropy:.1f} bits entropy")
    return v

@staticmethod
def _calculate_entropy(secret: str) -> float:
    """Calculate Shannon entropy of secret string in bits"""
    if not secret:
        return 0.0

    # Count character frequencies
    char_counts = {}
    for char in secret:
        char_counts[char] = char_counts.get(char, 0) + 1

    # Calculate Shannon entropy
    entropy = 0.0
    secret_len = len(secret)

    for count in char_counts.values():
        probability = count / secret_len
        entropy -= probability * math.log2(probability)

    # Multiply by length to get total entropy in bits
    return entropy * secret_len

@validator("supabase_jwt_secret")
def validate_supabase_jwt_secret(cls, v):
    """Validate Supabase JWT secret strength"""
    if len(v) < 32:
        raise ValueError(
            "SUPABASE_JWT_SECRET must be at least 32 characters. "
            "This should be provided by Supabase in your project settings."
        )
    return v
```

**Helper Script:** `scripts/generate-secure-secrets.sh`

```bash
#!/bin/bash

echo "🔐 Generating Secure Secrets for NestSync"
echo "=========================================="
echo ""

echo "SECRET_KEY (64-byte random):"
openssl rand -base64 64 | tr -d '\n'
echo ""
echo ""

echo "JWT_SECRET (64-byte random):"
openssl rand -base64 64 | tr -d '\n'
echo ""
echo ""

echo "STRIPE_WEBHOOK_SECRET (use from Stripe dashboard):"
echo "  1. Go to https://dashboard.stripe.com/webhooks"
echo "  2. Click on your webhook endpoint"
echo "  3. Copy the 'Signing secret' (starts with whsec_)"
echo ""

echo "Add these to Railway/Supabase secrets (NOT .env files in git!)"
```

---

### HIGH-004: Secure Web Token Storage

**File:** `NestSync-frontend/lib/storage/SecureWebStorage.ts`

```typescript
/**
 * Secure Web Token Storage
 * Uses httpOnly cookies instead of localStorage for XSS protection
 */

export class SecureWebStorage {
  private static COOKIE_NAME = 'nestsync_session';

  /**
   * Initialize secure storage (configure backend cookie settings)
   */
  static async initialize(): Promise<void> {
    // Verify httpOnly cookie support
    const supported = await this.checkCookieSupport();
    if (!supported) {
      console.warn(
        'httpOnly cookies not fully supported. ' +
        'Consider using a fallback authentication method.'
      );
    }
  }

  /**
   * Store authentication session (backend sets httpOnly cookie)
   */
  static async storeSession(accessToken: string, refreshToken: string): Promise<void> {
    // Send tokens to backend, which sets httpOnly cookies
    const response = await fetch('/auth/set-session', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        access_token: accessToken,
        refresh_token: refreshToken
      })
    });

    if (!response.ok) {
      throw new Error('Failed to establish secure session');
    }
  }

  /**
   * Validate current session (backend validates httpOnly cookie)
   */
  static async validateSession(): Promise<{ valid: boolean; user?: any }> {
    const response = await fetch('/auth/validate-session', {
      method: 'GET',
      credentials: 'include',  // Send httpOnly cookies
    });

    if (response.ok) {
      const data = await response.json();
      return { valid: true, user: data.user };
    }

    return { valid: false };
  }

  /**
   * Clear session (backend clears httpOnly cookie)
   */
  static async clearSession(): Promise<void> {
    await fetch('/auth/clear-session', {
      method: 'POST',
      credentials: 'include',
    });
  }

  /**
   * Check if httpOnly cookies are supported
   */
  private static async checkCookieSupport(): Promise<boolean> {
    try {
      // Test cookie functionality
      const response = await fetch('/auth/cookie-test', {
        credentials: 'include'
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
```

**Backend Cookie Endpoints:** `NestSync-backend/app/api/secure_session.py`

```python
"""
Secure Session Management with httpOnly Cookies
Replaces localStorage for web platforms
"""

from fastapi import APIRouter, Request, Response, HTTPException
from fastapi.responses import JSONResponse
from datetime import datetime, timedelta
import logging

from app.auth.supabase import supabase_auth
from app.config.settings import settings

router = APIRouter(prefix="/auth", tags=["Secure Session"])
logger = logging.getLogger(__name__)

@router.post("/set-session")
async def set_secure_session(
    request: Request,
    response: Response,
    access_token: str,
    refresh_token: str
):
    """
    Set httpOnly cookies for secure token storage
    SECURITY: Protects against XSS token theft
    """
    try:
        # Verify tokens before storing
        token_payload = supabase_auth.verify_jwt_token(access_token)
        if not token_payload:
            raise HTTPException(status_code=401, detail="Invalid access token")

        # Set httpOnly cookie for access token
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,  # Prevent JavaScript access
            secure=settings.environment == "production",  # HTTPS only in prod
            samesite="strict",  # CSRF protection
            max_age=3600,  # 1 hour
            path="/"
        )

        # Set httpOnly cookie for refresh token
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=settings.environment == "production",
            samesite="strict",
            max_age=2592000,  # 30 days
            path="/auth"  # Restrict to auth endpoints only
        )

        logger.info("Secure session established via httpOnly cookies")
        return {"success": True, "message": "Secure session established"}

    except Exception as e:
        logger.error(f"Failed to set secure session: {e}")
        raise HTTPException(status_code=500, detail="Session establishment failed")

@router.get("/validate-session")
async def validate_secure_session(request: Request):
    """
    Validate session from httpOnly cookie
    """
    try:
        access_token = request.cookies.get("access_token")

        if not access_token:
            return JSONResponse(
                status_code=401,
                content={"valid": False, "error": "No session found"}
            )

        # Verify token
        token_payload = supabase_auth.verify_jwt_token(access_token)
        if not token_payload:
            return JSONResponse(
                status_code=401,
                content={"valid": False, "error": "Invalid session"}
            )

        user_id = token_payload.get("user_id")

        # Get user from database
        # ... (use existing user lookup logic)

        return {
            "valid": True,
            "user": {
                "id": user_id,
                # ... other safe user data
            }
        }

    except Exception as e:
        logger.error(f"Session validation failed: {e}")
        return JSONResponse(
            status_code=500,
            content={"valid": False, "error": "Validation failed"}
        )

@router.post("/clear-session")
async def clear_secure_session(response: Response):
    """
    Clear httpOnly cookies
    """
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/auth")

    logger.info("Secure session cleared")
    return {"success": True, "message": "Session cleared"}

@router.get("/cookie-test")
async def test_cookie_support(request: Request, response: Response):
    """
    Test httpOnly cookie functionality
    """
    # Set test cookie
    response.set_cookie(
        key="test_cookie",
        value="supported",
        httponly=True,
        max_age=60
    )

    return {"supported": True}
```

---

## 📋 Testing Checklist

### After Implementing Critical Fixes:

```bash
# 1. Test sensitive logging removal
cd NestSync-frontend
npm run lint
./scripts/fix-sensitive-logging.sh

# 2. Test rate limiting enforcement
cd NestSync-backend
python -c "from app.config.settings import Settings; Settings(environment='production', rate_limiting_enabled=False)"
# Should raise ValueError

# 3. Test GraphQL introspection disabled
curl -X POST http://localhost:8001/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __schema { types { name } } }"}'
# Should return error if introspection disabled

# 4. Test CORS restrictions
curl -X OPTIONS http://localhost:8001/graphql \
  -H "Origin: http://evil.com" \
  -H "Access-Control-Request-Method: POST" \
  -v
# Should NOT return Access-Control-Allow-Origin

# 5. Test JWT secret validation
python -c "from app.config.settings import Settings; Settings(secret_key='weak')"
# Should raise ValueError
```

---

## 📊 Progress Tracking

### Critical Issues:
- [ ] CRIT-001: Sensitive logging removed
- [ ] CRIT-002: Rate limiting locked down

### High Priority Issues:
- [ ] HIGH-001: GraphQL introspection disabled
- [ ] HIGH-002: CORS hardened
- [ ] HIGH-003: JWT secrets enforced
- [ ] HIGH-004: Web storage secured

### Verification:
- [ ] All tests passing
- [ ] Security scan clean
- [ ] Manual penetration test rerun
- [ ] PIPEDA compliance verified
- [ ] Deployment to staging successful
- [ ] Production deployment approved

---

## 📚 Additional Resources

- [OWASP Top 10 2021](https://owasp.org/www-project-top-ten/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [PIPEDA Compliance Guide](https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/platform/going-into-prod)
- [GraphQL Security Checklist](https://cheatsheetseries.owasp.org/cheatsheets/GraphQL_Cheat_Sheet.html)

---

**Next Steps:**
1. Review this plan with the development team
2. Assign tasks to team members
3. Set deadlines for each priority level
4. Schedule daily standup to track progress
5. Plan for post-remediation penetration test

**Questions?** Contact security team or review the full penetration test report.
