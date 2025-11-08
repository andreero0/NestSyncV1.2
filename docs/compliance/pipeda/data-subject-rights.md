# PIPEDA Data Subject Rights Implementation

## Overview
Implemented two PIPEDA-compliant GraphQL mutations for user data subject rights:
1. `exportUserData` - Right to data portability
2. `deleteUserAccount` - Right to erasure

## Implementation Status

### Task 1: Export User Data Mutation ✅
**Mutation**: `exportUserData(input: ExportUserDataInput!): ExportUserDataResponse!`

**Location**: `/NestSync-backend/app/graphql/auth_resolvers.py:600-810`

**Features Implemented**:
- Comprehensive PIPEDA-compliant JSON export structure
- Includes all user data:
  - User profile information
  - Consent records
  - Children profiles
  - Inventory items
  - Usage logs
  - Notification preferences
- Optional inclusion of soft-deleted records
- Audit trail logging (sets `data_export_requested` flag)
- Export size calculation
- Future-ready for S3 presigned URL integration

**Input Type**: `ExportUserDataInput`
```graphql
input ExportUserDataInput {
  format: String! = "json"  # Future: CSV, XML support
  includeDeleted: Boolean! = false
}
```

**Response Type**: `ExportUserDataResponse`
```graphql
type ExportUserDataResponse {
  success: Boolean!
  message: String
  error: String
  exportUrl: String  # Future: S3 presigned URL
  exportData: String  # Current: JSON string
  exportSizeBytes: Int
  expiresAt: DateTime
}
```

**PIPEDA Compliance**:
- Data residency metadata (Canada)
- Compliance framework identification
- Complete data export including all personal information
- Structured format for easy data portability
- Audit trail for compliance reporting

---

### Task 2: Delete User Account Mutation ✅
**Mutation**: `deleteUserAccount(input: DeleteUserAccountInput!): DeleteUserAccountResponse!`

**Location**: `/NestSync-backend/app/graphql/auth_resolvers.py:812-940`

**Features Implemented**:
- Password re-verification for security (Supabase authentication)
- Confirmation text validation ("DELETE my account")
- Soft delete with 30-day retention period (PIPEDA compliant)
- Cascading soft delete to all related data:
  - All children profiles
  - All inventory items
  - All usage logs
  - Consent records retained for compliance
- User status set to `PENDING_DELETION`
- Comprehensive audit logging via emergency audit system
- Detailed deletion statistics tracking

**Input Type**: `DeleteUserAccountInput`
```graphql
input DeleteUserAccountInput {
  confirmationText: String!  # Must be "DELETE my account"
  password: String!
  reason: String
}
```

**Response Type**: `DeleteUserAccountResponse`
```graphql
type DeleteUserAccountResponse {
  success: Boolean!
  message: String
  error: String
  deletionScheduledAt: DateTime
  dataRetentionPeriodDays: Int! = 30
}
```

**PIPEDA Compliance**:
- 30-day data retention period
- Soft delete preserves audit trail
- Consent records retained for compliance
- Comprehensive audit logging
- Cascading deletion to all personal data
- Security verification (password check)

---

## Files Modified

### 1. `/NestSync-backend/app/graphql/types.py`
**Changes**:
- Added `ExportUserDataInput` input type (lines 1012-1016)
- Added `ExportUserDataResponse` response type (lines 1019-1025)
- Added `DeleteUserAccountInput` input type (lines 1028-1033)
- Added `DeleteUserAccountResponse` response type (lines 1036-1040)
- Updated `__all__` export list to include new types (lines 1142-1146)

### 2. `/NestSync-backend/app/graphql/auth_resolvers.py`
**Changes**:
- Added imports for new types (lines 39-42)
- Implemented `export_user_data` mutation (lines 600-810):
  - Queries all user data from database
  - Builds PIPEDA-compliant JSON structure
  - Includes metadata and data residency information
  - Sets audit flags on user model
  - Returns JSON export with size calculation
- Implemented `delete_user_account` mutation (lines 812-940):
  - Validates confirmation text
  - Verifies password with Supabase
  - Sets user status to PENDING_DELETION
  - Soft deletes all children, inventory, and usage logs
  - Creates comprehensive audit log entry
  - Returns deletion schedule information

### 3. `/NestSync-backend/app/graphql/schema.py`
**Changes**:
- Registered `export_user_data` mutation in Mutation class (line 194)
- Registered `delete_user_account` mutation in Mutation class (line 195)

---

## Testing Instructions

### Prerequisites
1. Backend server running: `cd NestSync-backend && uvicorn main:app --host 0.0.0.0 --port 8001 --reload`
2. Test user credentials: `parents@nestsync.com / Shazam11#`
3. GraphQL endpoint: `http://localhost:8001/graphql`

### Test 1: Export User Data

**GraphQL Query**:
```graphql
mutation ExportUserData {
  exportUserData(input: {
    format: "json"
    includeDeleted: false
  }) {
    success
    message
    error
    exportData
    exportSizeBytes
  }
}
```

**Expected Response**:
```json
{
  "data": {
    "exportUserData": {
      "success": true,
      "message": "Data export completed successfully",
      "error": null,
      "exportData": "{\"export_metadata\": {...}, \"user_profile\": {...}, ...}",
      "exportSizeBytes": 15234
    }
  }
}
```

**Validation Checks**:
- Response includes complete user profile
- All children profiles included
- All inventory items included
- All usage logs included
- Notification preferences included
- Consent records included
- Export metadata shows Canadian data residency
- Export size is calculated correctly

**Edge Cases to Test**:
1. Export with `includeDeleted: true` - should include soft-deleted records
2. Export for user with no children - should return empty arrays
3. Export for unauthenticated user - should fail with auth error

---

### Test 2: Delete User Account

**GraphQL Query**:
```graphql
mutation DeleteUserAccount {
  deleteUserAccount(input: {
    confirmationText: "DELETE my account"
    password: "Shazam11#"
    reason: "Testing PIPEDA compliance"
  }) {
    success
    message
    error
    deletionScheduledAt
    dataRetentionPeriodDays
  }
}
```

**Expected Response**:
```json
{
  "data": {
    "deleteUserAccount": {
      "success": true,
      "message": "Account deletion scheduled. Data will be permanently deleted after 30 days.",
      "error": null,
      "deletionScheduledAt": "2025-10-05T12:34:56.789Z",
      "dataRetentionPeriodDays": 30
    }
  }
}
```

**Validation Checks**:
- User status changed to `PENDING_DELETION`
- All children profiles soft-deleted
- All inventory items soft-deleted
- All usage logs soft-deleted
- Consent records preserved
- Audit log entry created
- 30-day retention period set
- Database records have `deleted_at` timestamp

**Edge Cases to Test**:
1. Wrong confirmation text - should fail with validation error
2. Wrong password - should fail with authentication error
3. Already deleted account - should fail gracefully
4. Unauthenticated user - should fail with auth error

---

## Database Verification

### Check User Deletion Status
```sql
SELECT
  id,
  email,
  status,
  data_deletion_requested,
  data_deletion_requested_at,
  deleted_at,
  is_deleted
FROM users
WHERE email = 'parents@nestsync.com';
```

### Check Cascading Soft Deletes
```sql
-- Check children
SELECT id, name, is_deleted, deleted_at
FROM children
WHERE parent_id = (SELECT id FROM users WHERE email = 'parents@nestsync.com');

-- Check inventory items
SELECT COUNT(*) as deleted_count
FROM inventory_items
WHERE is_deleted = true
  AND child_id IN (
    SELECT id FROM children
    WHERE parent_id = (SELECT id FROM users WHERE email = 'parents@nestsync.com')
  );

-- Check usage logs
SELECT COUNT(*) as deleted_count
FROM usage_logs
WHERE is_deleted = true
  AND child_id IN (
    SELECT id FROM children
    WHERE parent_id = (SELECT id FROM users WHERE email = 'parents@nestsync.com')
  );
```

### Check Audit Logs
```sql
SELECT
  action,
  data_type,
  accessed_by_email,
  success,
  details,
  created_at
FROM emergency_audit_logs
WHERE user_id = (SELECT id FROM users WHERE email = 'parents@nestsync.com')
  AND action = 'delete'
ORDER BY created_at DESC
LIMIT 5;
```

---

## Security Considerations

### Export User Data
1. **Authentication Required**: Uses `require_context_user()` to ensure only authenticated users can export their own data
2. **Data Isolation**: Queries filtered by user_id to prevent data leakage
3. **Audit Trail**: Sets `data_export_requested` flag for compliance tracking
4. **Future Enhancement**: Will use S3 presigned URLs with expiry for enhanced security

### Delete User Account
1. **Password Re-verification**: Requires current password to prevent unauthorized deletion
2. **Confirmation Text**: Requires exact match of "DELETE my account" to prevent accidental deletion
3. **Soft Delete**: 30-day retention period allows recovery if deletion was unauthorized
4. **Audit Logging**: Comprehensive audit trail using emergency audit system
5. **Cascading Protection**: Only soft-deletes user's own data, preserves system integrity

---

## Production Readiness Checklist

### Completed ✅
- [x] Input/output types defined with PIPEDA compliance
- [x] Mutations implemented with proper error handling
- [x] Authentication and authorization checks
- [x] Password verification for deletion
- [x] Soft delete with 30-day retention
- [x] Comprehensive audit logging
- [x] Database query optimization (async patterns)
- [x] GraphQL schema registration
- [x] Syntax validation passed

### Future Enhancements 🔄
- [ ] S3 integration for export file storage
- [ ] Presigned URL generation with expiry
- [ ] CSV and XML export format support
- [ ] Background job for scheduled hard deletion (after 30 days)
- [ ] Email notification on data export completion
- [ ] Email notification on account deletion schedule
- [ ] Admin interface for reviewing deletion requests
- [ ] Data retention policy enforcement automation

---

## PIPEDA Compliance Summary

### Right to Data Portability (Export)
- ✅ Provides machine-readable format (JSON)
- ✅ Includes all personal information
- ✅ Includes metadata about data residency
- ✅ Available on-demand
- ✅ Free of charge (no payment required)
- ✅ Audit trail maintained

### Right to Erasure (Delete)
- ✅ User-initiated deletion process
- ✅ 30-day retention period for recovery
- ✅ Cascading deletion to all personal data
- ✅ Preserves consent records for compliance
- ✅ Comprehensive audit trail
- ✅ Security verification (password check)
- ✅ Prevents accidental deletion (confirmation text)

### Data Residency
- ✅ All data stored in Canadian Supabase regions
- ✅ Export metadata identifies Canada as data residency
- ✅ Compliance framework explicitly identified (PIPEDA)

---

## Error Handling

### Export User Data Errors
| Error | Cause | Response |
|-------|-------|----------|
| Authentication Error | No valid session | GraphQLError with UNAUTHENTICATED code |
| Database Error | Query failure | Error message: "Failed to export user data" |
| No Data Found | User has no data | Empty arrays in export structure |

### Delete User Account Errors
| Error | Cause | Response |
|-------|-------|----------|
| Invalid Confirmation | Wrong confirmation text | Error: "Confirmation text must be exactly: DELETE my account" |
| Invalid Password | Wrong password | Error: "Invalid password. Account deletion cancelled." |
| Authentication Error | No valid session | GraphQLError with UNAUTHENTICATED code |
| Already Deleted | User already in PENDING_DELETION | Handled gracefully (idempotent) |

---

## Next Steps

### Immediate Testing
1. Test export mutation with test credentials
2. Test delete mutation with test credentials
3. Verify database soft deletes
4. Verify audit log entries

### Integration Testing
1. Test export mutation from frontend
2. Test delete mutation from frontend
3. Verify UI displays export data correctly
4. Verify UI confirms deletion successfully

### Production Deployment
1. Run database migrations (if needed)
2. Deploy backend changes
3. Update API documentation
4. Monitor audit logs for usage patterns
5. Set up alerts for deletion requests

---

## Support and Documentation

### Related Files
- `/NestSync-backend/app/models/user.py` - User model with PIPEDA fields
- `/NestSync-backend/app/models/base.py` - BaseModel with soft_delete method
- `/NestSync-backend/app/auth/supabase.py` - Supabase authentication
- `/NestSync-backend/app/models/emergency_audit_log.py` - Audit logging

### API Documentation
GraphQL schema documentation available at:
- Development: `http://localhost:8001/graphql`
- Production: `https://nestsync-api.railway.app/graphql`

### PIPEDA Resources
- [PIPEDA Overview](https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/)
- [Data Portability Rights](https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/p_principle/)
- [Right to Erasure](https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/pipeda_brief/)
