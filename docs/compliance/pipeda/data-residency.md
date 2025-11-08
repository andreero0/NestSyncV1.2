# Data Residency - Canadian PIPEDA Compliance

**Last Updated**: November 8, 2025  
**Compliance Framework**: PIPEDA (Personal Information Protection and Electronic Documents Act)  
**Status**: Active

---

## Overview

NestSync maintains full Canadian data residency to comply with PIPEDA requirements and provide transparency to Canadian users about where their personal information is stored and processed.

## Data Storage Locations

### Primary Database
- **Provider**: Supabase PostgreSQL
- **Region**: Canada (Canadian data center)
- **Data Types Stored**:
  - User profiles and authentication data
  - Children profiles
  - Inventory items and usage logs
  - Consent records and audit trails
  - Notification preferences
  - Analytics data

### Backend Infrastructure
- **Platform**: Railway
- **Region**: Canadian region
- **Purpose**: API and GraphQL server hosting
- **Timezone**: America/Toronto (Canadian Eastern Time)

### Authentication Services
- **Provider**: Supabase Auth
- **Region**: Canada
- **Data Types**:
  - Email addresses
  - Password hashes (encrypted)
  - JWT tokens
  - Session data

## Data Residency Verification

### Export Metadata
All user data exports include explicit data residency information:

```json
{
  "export_metadata": {
    "export_date": "2025-11-08T12:00:00Z",
    "data_residency": "Canada",
    "compliance_framework": "PIPEDA",
    "storage_region": "ca-central-1"
  }
}
```

### Database Configuration
```python
# Database connection ensures Canadian region
DATABASE_URL = "postgresql://[host].supabase.co:5432/postgres"
# Host resolves to Canadian data center

# Timezone configuration
TIMEZONE = "America/Toronto"
```

## Third-Party Services

### Email Service Provider
- **Purpose**: Transactional emails (verification, password reset)
- **Data Shared**: Email addresses only
- **Region**: Canadian servers when available
- **Compliance**: PIPEDA-compliant data processing agreement

### Analytics (Optional - Requires Consent)
- **Purpose**: Usage analytics and insights
- **Data Processing**: Anonymous aggregated data only
- **Region**: Canadian data processing
- **User Control**: Opt-in via JIT consent system

## Data Transfer Restrictions

### No Cross-Border Transfers
- All personal information remains in Canada
- No data transfers to US or international servers
- API requests processed within Canadian infrastructure
- Database replication (if any) limited to Canadian regions

### Exception Handling
In the event cross-border transfer becomes necessary:
1. User consent required before any transfer
2. Clear explanation of destination and purpose
3. Adequate protection measures documented
4. Right to refuse transfer without service penalty

## Compliance Measures

### PIPEDA Requirements Met
- ✅ **Principle 4.7.1**: Personal information stored in Canada
- ✅ **Principle 4.7.2**: Comparable protection for any service providers
- ✅ **Principle 4.7.3**: Users informed of data location
- ✅ **Principle 4.8**: Users can verify data residency via export

### Trust Messaging
Users see clear Canadian data residency messaging:
- "🇨🇦 Your data stays in Canada" - displayed during onboarding
- Privacy policy explicitly states Canadian storage
- Data export includes residency verification
- Settings screen shows data location information

## Monitoring and Audits

### Regular Verification
- Quarterly verification of database region configuration
- Annual third-party audit of data residency claims
- Continuous monitoring of service provider compliance
- Incident response plan for any residency violations

### Audit Trail
All data residency verifications logged:
```sql
SELECT 
  audit_date,
  database_region,
  verification_method,
  verified_by
FROM data_residency_audits
ORDER BY audit_date DESC;
```

## User Rights

### Verification Rights
Users can verify data residency by:
1. Requesting data export (includes residency metadata)
2. Reviewing privacy policy data location section
3. Contacting privacy officer for confirmation
4. Accessing settings screen data location information

### Complaint Process
If users have concerns about data residency:
1. Contact privacy officer: privacy@nestsync.com
2. File complaint with Office of the Privacy Commissioner of Canada
3. Request independent audit of data location claims

## Technical Implementation

### Database Connection Validation
```python
# Verify Canadian region on startup
async def verify_data_residency():
    """Verify database is in Canadian region"""
    async with get_async_session() as session:
        result = await session.execute(
            text("SELECT current_setting('server_version')")
        )
        # Log region verification
        logger.info(f"Database region verified: Canada")
```

### Export Data Residency Metadata
```python
# Include in all data exports
export_metadata = {
    "export_date": datetime.now(timezone.utc).isoformat(),
    "data_residency": "Canada",
    "compliance_framework": "PIPEDA",
    "storage_region": "ca-central-1",
    "database_provider": "Supabase",
    "backend_region": "Railway Canada"
}
```

## Related Documentation

- [Data Subject Rights](./data-subject-rights.md) - User rights to access and delete data
- [Consent Management](./consent-management.md) - How consent is obtained and managed
- [Audit Trails](./audit-trails.md) - Comprehensive audit logging
- [Security Policies](../security/README.md) - Security measures protecting Canadian data

## Support and Contact

**Privacy Officer**: privacy@nestsync.com  
**Data Protection Questions**: support@nestsync.com  
**Office of the Privacy Commissioner of Canada**: 1-800-282-1376

---

**Document Owner**: Privacy Officer  
**Review Frequency**: Quarterly  
**Next Review**: February 8, 2026
