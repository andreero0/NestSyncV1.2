# Consent Management System - PIPEDA Compliance

**Last Updated**: November 8, 2025  
**Compliance Framework**: PIPEDA (Personal Information Protection and Electronic Documents Act)  
**Status**: Active - Just-in-Time (JIT) Consent Architecture

---

## Overview

NestSync implements a comprehensive Just-in-Time (JIT) consent management system that provides meaningful, contextual consent in compliance with PIPEDA requirements. Users provide consent when they understand the specific purpose and context of data collection and use.

## JIT Consent Architecture

### Core Principles

1. **Contextual Consent**: Users consent when accessing features, not during registration
2. **Meaningful Understanding**: Clear explanation of purpose, benefits, and risks
3. **Granular Control**: Separate consent for each data use purpose
4. **Easy Withdrawal**: Users can withdraw consent at any time
5. **Server-side Enforcement**: All consent validation occurs server-side

### Consent Types

```typescript
enum ConsentType {
  ANALYTICS = "analytics",           // Usage analytics and insights
  MARKETING = "marketing",           // Marketing communications
  DATA_SHARING = "data_sharing",     // Third-party data sharing
  CHILD_DATA = "child_data",         // Child profile information
  RESEARCH = "research"              // Anonymous research participation
}
```

## Consent Flow

### 1. Feature Access Trigger
```
User attempts to access feature
    ↓
GraphQL middleware checks consent
    ↓
If consent missing → Show JIT consent modal
If consent granted → Allow feature access
```

### 2. Consent Modal Display

**Required Information Shown**:
- **Purpose**: Clear explanation of why consent is needed
- **Data Categories**: Specific types of data collected
- **Benefits**: What the user gains from granting consent
- **Risks**: Potential privacy implications
- **Third Parties**: Any external services involved
- **Retention Period**: How long data is kept
- **Withdrawal Process**: How to revoke consent

**Example Consent Request**:
```json
{
  "consentType": "analytics",
  "purpose": "Analyze your diaper usage patterns to provide personalized insights",
  "dataCategories": [
    "diaper_change_logs",
    "timing_patterns", 
    "usage_statistics"
  ],
  "benefits": [
    "Personalized insights",
    "Usage optimization",
    "Health monitoring"
  ],
  "risks": [
    "Anonymous usage data collection"
  ],
  "retentionPeriod": "12 months",
  "thirdParties": [],
  "canProceedWithoutConsent": true
}
```

### 3. Consent Recording

All consent decisions are recorded with comprehensive audit trail:

```python
consent_record = ConsentRecord(
    user_id=user.id,
    consent_type=ConsentType.ANALYTICS,
    consent_status=ConsentStatus.GRANTED,
    consent_method="jit_modal",
    consent_context="usage_analytics_dashboard",
    consent_evidence={
        "feature_context": "Usage Analytics Dashboard",
        "user_understanding_confirmed": True,
        "context_shown": consent_context,
        "ip_address": request.ip_address,
        "user_agent": request.user_agent
    },
    purpose="Analyze diaper usage patterns for insights",
    granted_at=datetime.now(timezone.utc)
)
```

## Server-Side Enforcement

### GraphQL Middleware

All feature access is protected by server-side consent validation:

```python
@strawberry.field
@requires_consent(
    consent_types=[ConsentType.ANALYTICS],
    feature_name="Usage Analytics Dashboard",
    purpose="Analyze your diaper change patterns to provide insights",
    data_categories=["diaper_changes", "timing_patterns"]
)
async def usage_analytics(self, info: Info) -> UsageAnalyticsResponse:
    # Middleware ensures consent before this executes
    return await get_usage_analytics_for_user(info.context.user_id)
```

### Consent Validation Process

1. **Authentication Check**: Verify user is authenticated
2. **Consent Lookup**: Query consent_records table for user + consent_type
3. **Status Validation**: Verify consent is active and not expired
4. **Audit Logging**: Log consent check in audit trail
5. **Access Decision**: Grant or deny feature access

## Consent Withdrawal

### User-Initiated Withdrawal

Users can withdraw consent at any time through:
- Settings screen consent management section
- Direct GraphQL mutation
- Data export and deletion requests

```graphql
mutation WithdrawConsent {
  withdrawConsent(input: {
    consentType: ANALYTICS
    reason: "No longer want usage tracking"
  }) {
    success
    message
    effectiveDate
  }
}
```

### Withdrawal Effects

**Immediate Actions**:
- Consent status set to WITHDRAWN
- Feature access immediately revoked
- Data collection stops immediately
- Audit log entry created

**Data Retention**:
- Historical consent records preserved for compliance
- Previously collected data handled per retention policy
- User can request deletion of historical data

### Withdrawal Audit Trail

```python
consent_audit_log = ConsentAuditLog(
    consent_record_id=consent.id,
    user_id=user.id,
    action="withdraw",
    ip_address=context.ip_address,
    user_agent=context.user_agent,
    audit_metadata={
        "withdrawal_reason": reason,
        "withdrawal_method": "user_settings",
        "data_retention_explained": True,
        "alternatives_offered": True
    }
)
```

## Consent Contexts

### Analytics Consent
- **Trigger**: Accessing insights dashboard, usage analytics
- **Purpose**: Analyze usage patterns for personalized insights
- **Data**: Diaper change logs, timing patterns, usage statistics
- **Retention**: 12 months
- **Optional**: Yes - users can use app without analytics

### Marketing Consent
- **Trigger**: Enabling push notifications, email preferences
- **Purpose**: Send helpful parenting tips and product updates
- **Data**: Email address, notification preferences, device tokens
- **Retention**: Until withdrawn
- **Optional**: Yes - core features work without marketing

### Data Sharing Consent
- **Trigger**: Personalized recommendations, research participation
- **Purpose**: Share anonymized data for research or recommendations
- **Data**: Usage patterns, child profiles (anonymized)
- **Retention**: Per research protocol
- **Optional**: Yes - not required for core functionality

### Child Data Consent
- **Trigger**: Creating first child profile
- **Purpose**: Store child information for diaper planning
- **Data**: Child name, birthdate, size information
- **Retention**: Until account deletion
- **Optional**: No - required for core app functionality

## PIPEDA Compliance

### Principle 3: Consent Requirements Met

✅ **Meaningful Consent**
- Users understand purpose before consenting
- Clear explanation of data use
- Context-specific consent requests

✅ **Informed Consent**
- All data categories disclosed
- Benefits and risks explained
- Third-party sharing identified

✅ **Voluntary Consent**
- Optional consents clearly marked
- No penalty for refusing optional consent
- Core features available without optional consents

✅ **Granular Consent**
- Separate consent for each purpose
- Users can grant/deny individually
- Withdrawal doesn't affect other consents

✅ **Documented Consent**
- Complete audit trail
- Evidence of user understanding
- Timestamp and context recorded

### Consent Validity Requirements

**Valid Consent Must Have**:
1. Clear identification of purpose
2. User understanding of implications
3. Voluntary decision (no coercion)
4. Specific to the purpose
5. Documented with audit trail
6. Ability to withdraw

**Invalid Consent Scenarios**:
- Bundled consent (all-or-nothing)
- Pre-checked boxes
- Buried in terms and conditions
- Unclear purpose
- No withdrawal mechanism

## Technical Implementation

### Database Schema

```sql
-- Consent records table
CREATE TABLE consent_records (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    consent_type VARCHAR(50) NOT NULL,
    consent_status VARCHAR(20) NOT NULL,
    consent_method VARCHAR(50),
    consent_context VARCHAR(100),
    consent_evidence JSONB,
    purpose TEXT,
    granted_at TIMESTAMP WITH TIME ZONE,
    withdrawn_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Consent audit logs table
CREATE TABLE consent_audit_logs (
    id UUID PRIMARY KEY,
    consent_record_id UUID REFERENCES consent_records(id),
    user_id UUID NOT NULL REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    audit_metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### ConsentService Methods

```python
class ConsentService:
    async def grant_consent(
        self,
        user: User,
        consent_type: ConsentType,
        context: RequestContext,
        evidence: Dict[str, Any]
    ) -> ConsentRecord:
        """Grant consent with full audit trail"""
        
    async def withdraw_consent(
        self,
        user: User,
        consent_type: ConsentType,
        reason: str,
        context: RequestContext
    ) -> bool:
        """Withdraw consent and log audit trail"""
        
    async def check_consent(
        self,
        user_id: UUID,
        consent_type: ConsentType
    ) -> bool:
        """Check if user has active consent"""
        
    async def get_user_consents(
        self,
        user_id: UUID
    ) -> List[ConsentRecord]:
        """Get all consents for user"""
```

## Monitoring and Reporting

### Consent Metrics

**Tracked Metrics**:
- Consent grant rate by type
- Consent withdrawal rate
- Time to consent decision
- Feature access without consent attempts
- Consent modal abandonment rate

### Compliance Reporting

**Monthly Reports Include**:
- Total active consents by type
- Consent withdrawals and reasons
- Consent bypass attempts (security)
- Audit trail completeness verification
- PIPEDA compliance checklist status

### Audit Queries

```sql
-- Active consents by type
SELECT 
    consent_type,
    COUNT(*) as active_consents
FROM consent_records
WHERE consent_status = 'GRANTED'
    AND (expires_at IS NULL OR expires_at > NOW())
GROUP BY consent_type;

-- Recent withdrawals
SELECT 
    consent_type,
    withdrawn_at,
    consent_evidence->>'withdrawal_reason' as reason
FROM consent_records
WHERE consent_status = 'WITHDRAWN'
    AND withdrawn_at > NOW() - INTERVAL '30 days'
ORDER BY withdrawn_at DESC;
```

## User Interface

### Consent Management Screen

**Location**: Settings → Privacy & Consent

**Features**:
- List of all consent types
- Current status (granted/withdrawn)
- Grant date and context
- Withdrawal button with confirmation
- Link to privacy policy
- Export consent history

### Consent Modal Design

**Accessibility Requirements**:
- Screen reader compatible
- Keyboard navigation support
- High contrast mode support
- Clear focus indicators
- Plain language explanations

**User Experience**:
- Cannot be dismissed without decision (for required consents)
- Clear "Grant" and "Deny" buttons
- "Learn More" link to privacy policy
- Progress indicator for multi-step consent
- Confirmation of decision

## Related Documentation

- [Data Subject Rights](./data-subject-rights.md) - User rights to access and delete data
- [Data Residency](./data-residency.md) - Canadian data storage
- [Audit Trails](./audit-trails.md) - Comprehensive audit logging
- [JIT Consent Architecture](../../project-documentation/jit-consent-architecture.md) - Technical architecture

## Support and Contact

**Privacy Questions**: privacy@nestsync.com  
**Consent Management Support**: support@nestsync.com  
**Office of the Privacy Commissioner of Canada**: 1-800-282-1376

---

**Document Owner**: Privacy Officer  
**Review Frequency**: Quarterly  
**Next Review**: February 8, 2026
