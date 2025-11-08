# Audit Trails - PIPEDA Compliance

**Last Updated**: November 8, 2025  
**Compliance Framework**: PIPEDA (Personal Information Protection and Electronic Documents Act)  
**Status**: Active

---

## Overview

NestSync maintains comprehensive audit trails for all personal information access, consent decisions, and data operations to ensure PIPEDA compliance and provide accountability for data handling practices.

## Audit Trail Requirements

### PIPEDA Principle 4.9: Accountability

Organizations must be able to demonstrate compliance with PIPEDA principles. Audit trails provide evidence of:
- Who accessed personal information
- When access occurred
- What information was accessed
- Why access was necessary
- What actions were taken

## Audit Log Types

### 1. Consent Audit Logs

**Purpose**: Track all consent-related actions

**Logged Events**:
- Consent granted (with context and evidence)
- Consent withdrawn (with reason)
- Consent checked (feature access attempts)
- Consent expired
- Consent renewed

**Schema**:
```sql
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

**Example Entry**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "consent_record_id": "660e8400-e29b-41d4-a716-446655440001",
  "user_id": "770e8400-e29b-41d4-a716-446655440002",
  "action": "grant",
  "ip_address": "192.168.1.100",
  "user_agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)",
  "audit_metadata": {
    "consent_method": "jit_modal",
    "feature_context": "Usage Analytics Dashboard",
    "user_understanding_confirmed": true,
    "context_shown": {
      "purpose": "Analyze diaper usage patterns",
      "benefits": ["Personalized insights"],
      "risks": ["Anonymous data collection"]
    }
  },
  "created_at": "2025-11-08T12:00:00Z"
}
```

### 2. Emergency Audit Logs

**Purpose**: Track emergency access to user data

**Logged Events**:
- Emergency profile access
- Emergency contact information retrieval
- Emergency data export
- Emergency account actions

**Schema**:
```sql
CREATE TABLE emergency_audit_logs (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    data_type VARCHAR(50),
    accessed_by_email VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent TEXT,
    success BOOLEAN,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Example Entry**:
```json
{
  "id": "880e8400-e29b-41d4-a716-446655440000",
  "user_id": "770e8400-e29b-41d4-a716-446655440002",
  "action": "access",
  "data_type": "emergency_profile",
  "accessed_by_email": "parent@example.com",
  "ip_address": "192.168.1.100",
  "success": true,
  "details": {
    "child_id": "990e8400-e29b-41d4-a716-446655440003",
    "access_reason": "emergency_contact_retrieval",
    "data_accessed": ["emergency_contacts", "medical_info"]
  },
  "created_at": "2025-11-08T12:00:00Z"
}
```

### 3. Data Access Audit Logs

**Purpose**: Track access to personal information

**Logged Events**:
- User profile access
- Child profile access
- Inventory data access
- Usage log access
- Analytics data access

**Implementation**:
```python
async def log_data_access(
    user_id: UUID,
    data_type: str,
    action: str,
    context: RequestContext,
    details: Dict[str, Any]
):
    """Log data access for audit trail"""
    audit_log = DataAccessLog(
        user_id=user_id,
        data_type=data_type,
        action=action,
        ip_address=context.ip_address,
        user_agent=context.user_agent,
        accessed_at=datetime.now(timezone.utc),
        details=details
    )
    await session.add(audit_log)
    await session.commit()
```

### 4. Data Modification Audit Logs

**Purpose**: Track changes to personal information

**Logged Events**:
- Profile updates
- Child profile modifications
- Inventory item changes
- Consent record updates
- Account deletions

**Audit Metadata**:
```json
{
  "action": "update",
  "entity_type": "user_profile",
  "entity_id": "770e8400-e29b-41d4-a716-446655440002",
  "changes": {
    "email": {
      "old": "old@example.com",
      "new": "new@example.com"
    },
    "notification_preferences": {
      "old": {"push_enabled": false},
      "new": {"push_enabled": true}
    }
  },
  "modified_by": "user_self",
  "modification_reason": "user_settings_update"
}
```

## Audit Trail Security

### Access Controls

**Who Can Access Audit Logs**:
- Privacy Officer (full access)
- System Administrators (read-only)
- Compliance Auditors (read-only, time-limited)
- Users (their own audit logs only)

**Access Restrictions**:
```python
@requires_role("privacy_officer")
async def get_audit_logs(
    user_id: Optional[UUID] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
) -> List[AuditLog]:
    """Get audit logs with role-based access control"""
```

### Audit Log Integrity

**Protection Measures**:
1. **Immutable Records**: Audit logs cannot be modified or deleted
2. **Cryptographic Hashing**: Each log entry includes hash of previous entry
3. **Tamper Detection**: Chain validation detects any modifications
4. **Secure Storage**: Audit logs stored in separate, secured database
5. **Backup and Retention**: Audit logs backed up daily, retained for 7 years

**Hash Chain Implementation**:
```python
def calculate_audit_hash(
    previous_hash: str,
    log_entry: AuditLog
) -> str:
    """Calculate hash for audit log entry"""
    data = f"{previous_hash}|{log_entry.id}|{log_entry.created_at}|{log_entry.action}"
    return hashlib.sha256(data.encode()).hexdigest()
```

## Retention Policies

### Audit Log Retention Periods

| Audit Log Type | Retention Period | Reason |
|----------------|------------------|--------|
| Consent Logs | 7 years | PIPEDA compliance requirement |
| Emergency Access | 7 years | Legal and compliance |
| Data Access | 3 years | Security and compliance |
| Data Modification | 7 years | Accountability and disputes |
| Authentication | 1 year | Security monitoring |

### Retention Implementation

```python
# Automated retention policy enforcement
async def enforce_retention_policies():
    """Remove audit logs past retention period"""
    cutoff_dates = {
        "consent_audit_logs": datetime.now() - timedelta(days=7*365),
        "emergency_audit_logs": datetime.now() - timedelta(days=7*365),
        "data_access_logs": datetime.now() - timedelta(days=3*365),
        "auth_logs": datetime.now() - timedelta(days=365)
    }
    
    for table, cutoff_date in cutoff_dates.items():
        await session.execute(
            delete(table).where(table.created_at < cutoff_date)
        )
```

## User Access to Audit Trails

### User Rights

Users can access their own audit trails through:
1. **Data Export**: Includes complete audit history
2. **Settings Screen**: View recent access logs
3. **Privacy Dashboard**: Summary of data access

### Audit Trail Export Format

```json
{
  "user_id": "770e8400-e29b-41d4-a716-446655440002",
  "export_date": "2025-11-08T12:00:00Z",
  "audit_trails": {
    "consent_history": [
      {
        "date": "2025-11-01T10:00:00Z",
        "action": "granted",
        "consent_type": "analytics",
        "context": "Usage Analytics Dashboard"
      }
    ],
    "data_access": [
      {
        "date": "2025-11-08T09:00:00Z",
        "action": "view",
        "data_type": "user_profile",
        "accessed_by": "self"
      }
    ],
    "data_modifications": [
      {
        "date": "2025-11-05T14:00:00Z",
        "action": "update",
        "entity": "notification_preferences",
        "changes": "Push notifications enabled"
      }
    ]
  }
}
```

## Compliance Reporting

### Monthly Audit Reports

**Generated Reports Include**:
1. **Consent Activity Summary**
   - Total consents granted/withdrawn
   - Consent types breakdown
   - Withdrawal reasons analysis

2. **Data Access Summary**
   - Total data access events
   - Access by data type
   - Unusual access patterns

3. **Emergency Access Summary**
   - Emergency profile accesses
   - Emergency contact retrievals
   - Emergency data exports

4. **Compliance Metrics**
   - Audit trail completeness
   - Retention policy compliance
   - Access control violations

### Audit Report Queries

```sql
-- Monthly consent activity
SELECT 
    DATE_TRUNC('month', created_at) as month,
    action,
    COUNT(*) as event_count
FROM consent_audit_logs
WHERE created_at >= NOW() - INTERVAL '12 months'
GROUP BY month, action
ORDER BY month DESC;

-- Data access by type
SELECT 
    data_type,
    COUNT(*) as access_count,
    COUNT(DISTINCT user_id) as unique_users
FROM data_access_logs
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY data_type
ORDER BY access_count DESC;

-- Emergency access events
SELECT 
    action,
    data_type,
    success,
    COUNT(*) as event_count
FROM emergency_audit_logs
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY action, data_type, success;
```

## Incident Response

### Audit Trail Analysis for Incidents

**Security Incident Investigation**:
1. Identify affected users from audit logs
2. Determine scope of unauthorized access
3. Timeline reconstruction from audit trail
4. Evidence preservation for legal proceedings

**Privacy Breach Investigation**:
1. Identify what data was accessed
2. Determine who accessed the data
3. Verify consent status at time of access
4. Document breach timeline and scope

### Incident Response Queries

```sql
-- Identify unusual access patterns
SELECT 
    user_id,
    ip_address,
    COUNT(*) as access_count,
    COUNT(DISTINCT data_type) as data_types_accessed
FROM data_access_logs
WHERE created_at >= NOW() - INTERVAL '1 hour'
GROUP BY user_id, ip_address
HAVING COUNT(*) > 100;  -- Threshold for unusual activity

-- Track data access after consent withdrawal
SELECT 
    dal.user_id,
    dal.data_type,
    dal.accessed_at,
    cr.withdrawn_at
FROM data_access_logs dal
JOIN consent_records cr ON dal.user_id = cr.user_id
WHERE dal.accessed_at > cr.withdrawn_at
    AND cr.consent_status = 'WITHDRAWN';
```

## Monitoring and Alerts

### Real-time Monitoring

**Monitored Events**:
- Unusual access patterns (high volume, unusual times)
- Failed consent checks (potential bypass attempts)
- Emergency access events
- Audit log integrity violations
- Retention policy violations

### Alert Configuration

```python
# Alert thresholds
ALERT_THRESHOLDS = {
    "high_volume_access": 100,  # Accesses per hour
    "failed_consent_checks": 10,  # Failed checks per hour
    "emergency_access": 1,  # Any emergency access
    "audit_integrity_violation": 1  # Any integrity issue
}

async def check_audit_alerts():
    """Monitor audit logs for alert conditions"""
    # Check for high volume access
    recent_access = await get_recent_access_count(hours=1)
    if recent_access > ALERT_THRESHOLDS["high_volume_access"]:
        await send_alert("High volume data access detected")
```

## Technical Implementation

### Audit Logging Service

```python
class AuditService:
    async def log_consent_action(
        self,
        user_id: UUID,
        consent_record_id: UUID,
        action: str,
        context: RequestContext,
        metadata: Dict[str, Any]
    ):
        """Log consent-related action"""
        
    async def log_data_access(
        self,
        user_id: UUID,
        data_type: str,
        action: str,
        context: RequestContext,
        details: Dict[str, Any]
    ):
        """Log data access event"""
        
    async def log_emergency_access(
        self,
        user_id: UUID,
        action: str,
        data_type: str,
        accessed_by: str,
        context: RequestContext,
        success: bool,
        details: Dict[str, Any]
    ):
        """Log emergency access event"""
        
    async def verify_audit_integrity(self) -> bool:
        """Verify audit log chain integrity"""
```

### Automatic Audit Logging

```python
# Decorator for automatic audit logging
def audit_log(
    action: str,
    data_type: str,
    log_details: bool = True
):
    def decorator(func):
        async def wrapper(*args, **kwargs):
            result = await func(*args, **kwargs)
            
            # Log the action
            await audit_service.log_data_access(
                user_id=get_current_user_id(),
                data_type=data_type,
                action=action,
                context=get_request_context(),
                details={"result": result} if log_details else {}
            )
            
            return result
        return wrapper
    return decorator

# Usage
@audit_log(action="view", data_type="user_profile")
async def get_user_profile(user_id: UUID) -> UserProfile:
    return await fetch_user_profile(user_id)
```

## Related Documentation

- [Data Subject Rights](./data-subject-rights.md) - User rights to access audit trails
- [Consent Management](./consent-management.md) - Consent audit logging
- [Data Residency](./data-residency.md) - Audit log storage location
- [Security Policies](../security/README.md) - Audit log security measures

## Support and Contact

**Privacy Officer**: privacy@nestsync.com  
**Security Team**: security@nestsync.com  
**Audit Questions**: compliance@nestsync.com

---

**Document Owner**: Privacy Officer  
**Review Frequency**: Quarterly  
**Next Review**: February 8, 2026
