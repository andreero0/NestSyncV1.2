# Data Encryption

**Last Updated**: November 8, 2025  
**Status**: Active  
**Security Level**: Critical

---

## Overview

NestSync implements comprehensive encryption for data at rest and in transit to protect user personal information in compliance with PIPEDA security safeguard requirements.

## Encryption Architecture

### Layers of Encryption

```
┌─────────────────────────────────────────┐
│         Application Layer               │
│  - Secure token storage (encrypted)     │
│  - Sensitive field encryption           │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│         Transport Layer                 │
│  - TLS 1.3 (HTTPS)                     │
│  - Certificate pinning                  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│         Database Layer                  │
│  - Supabase encryption at rest         │
│  - AES-256 encryption                   │
└─────────────────────────────────────────┘
```

## Encryption at Rest

### Database Encryption

**Provider**: Supabase PostgreSQL  
**Encryption Standard**: AES-256  
**Key Management**: Supabase managed keys  
**Region**: Canada (ca-central-1)

**Encrypted Data**:
- All user profile data
- Children profiles
- Inventory items
- Usage logs
- Consent records
- Audit logs
- Session data

**Implementation**:
```sql
-- Supabase automatically encrypts all data at rest
-- No additional configuration required
-- Encryption is transparent to application
```

### Backup Encryption

**Backup Storage**: Encrypted with AES-256  
**Backup Location**: Canadian data centers  
**Key Rotation**: Automatic quarterly rotation  
**Access Control**: Restricted to authorized personnel

### File Storage Encryption

**Provider**: Supabase Storage  
**Encryption**: AES-256 at rest  
**Access**: Signed URLs with expiration  
**Use Cases**: 
- User profile photos
- Child photos
- Document uploads

## Encryption in Transit

### TLS/HTTPS

**Protocol**: TLS 1.3  
**Cipher Suites**: Strong ciphers only  
**Certificate**: Let's Encrypt (auto-renewed)  
**HSTS**: Enabled with 1-year max-age

**Configuration**:
```nginx
# TLS configuration
ssl_protocols TLSv1.3;
ssl_ciphers 'ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
ssl_prefer_server_ciphers on;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

### API Communication

**All API Requests**:
- HTTPS only (no HTTP)
- TLS 1.3 encryption
- Certificate validation
- No mixed content

**GraphQL Endpoint**:
```
https://api.nestsync.com/graphql
```

**WebSocket (Subscriptions)**:
```
wss://api.nestsync.com/graphql
```

### Mobile App Security

**Certificate Pinning**:
```typescript
// React Native certificate pinning
const certificatePinning = {
  'api.nestsync.com': {
    certificateHashes: [
      'sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
      'sha256/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB='
    ]
  }
};
```

**Network Security Config (Android)**:
```xml
<network-security-config>
  <domain-config cleartextTrafficPermitted="false">
    <domain includeSubdomains="true">api.nestsync.com</domain>
    <pin-set>
      <pin digest="SHA-256">AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=</pin>
      <pin digest="SHA-256">BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=</pin>
    </pin-set>
  </domain-config>
</network-security-config>
```

## Application-Level Encryption

### Secure Token Storage

**iOS/Android**:
```typescript
import * as SecureStore from 'expo-secure-store';

// Tokens stored in platform keychain (encrypted)
await SecureStore.setItemAsync('access_token', token, {
  keychainAccessible: SecureStore.WHEN_UNLOCKED
});
```

**Web**:
```typescript
// Tokens encrypted before storage
import CryptoJS from 'crypto-js';

const encryptToken = (token: string): string => {
  const key = getDeviceKey(); // Device-specific key
  return CryptoJS.AES.encrypt(token, key).toString();
};

const decryptToken = (encrypted: string): string => {
  const key = getDeviceKey();
  const bytes = CryptoJS.AES.decrypt(encrypted, key);
  return bytes.toString(CryptoJS.enc.Utf8);
};
```

### Sensitive Field Encryption

**Password Hashing**:
- Handled by Supabase Auth
- bcrypt algorithm
- Automatic salt generation
- Never stored in our database

**Encryption Keys**:
- Device-specific keys for local storage
- Server-managed keys for database
- Key rotation on security events
- No keys stored in code or config

## Key Management

### Key Hierarchy

```
┌─────────────────────────────────────┐
│     Master Encryption Key (MEK)     │
│  - Managed by Supabase              │
│  - Rotated quarterly                │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   Data Encryption Keys (DEK)        │
│  - Per-table encryption             │
│  - Derived from MEK                 │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│     Application Keys                │
│  - Device-specific keys             │
│  - Session keys                     │
└─────────────────────────────────────┘
```

### Key Rotation

**Automatic Rotation**:
- Master keys: Quarterly
- Data encryption keys: On master key rotation
- Session keys: On each authentication
- Device keys: On app reinstall

**Manual Rotation**:
- On security incident
- On key compromise
- On personnel changes
- On compliance requirements

### Key Storage

**Server-Side Keys**:
- Stored in Supabase key management
- Never exposed to application
- Access logged and monitored
- Encrypted at rest

**Client-Side Keys**:
- Derived from device identifiers
- Stored in secure keychain
- Never transmitted to server
- Cleared on logout

## Encryption Standards

### Algorithms

**Symmetric Encryption**:
- **Algorithm**: AES-256-GCM
- **Key Size**: 256 bits
- **Mode**: Galois/Counter Mode (authenticated encryption)
- **Use**: Data at rest, token storage

**Asymmetric Encryption**:
- **Algorithm**: RSA-2048 or ECDSA P-256
- **Use**: TLS certificates, key exchange
- **Signature**: SHA-256 with RSA/ECDSA

**Hashing**:
- **Algorithm**: SHA-256
- **Use**: Data integrity, audit logs
- **Password Hashing**: bcrypt (via Supabase)

### Compliance

**Standards Met**:
- ✅ PIPEDA Principle 7 (Safeguards)
- ✅ NIST SP 800-175B (Key Management)
- ✅ FIPS 140-2 (Cryptographic Modules)
- ✅ TLS 1.3 (Transport Security)

## Data Classification

### Encryption Requirements by Data Type

| Data Type | Encryption at Rest | Encryption in Transit | Additional Protection |
|-----------|-------------------|----------------------|----------------------|
| Passwords | ✅ Hashed (bcrypt) | ✅ TLS 1.3 | Never stored in our DB |
| JWT Tokens | ✅ Secure keychain | ✅ TLS 1.3 | Device-specific encryption |
| User Profiles | ✅ AES-256 | ✅ TLS 1.3 | RLS policies |
| Children Data | ✅ AES-256 | ✅ TLS 1.3 | RLS policies |
| Inventory Data | ✅ AES-256 | ✅ TLS 1.3 | RLS policies |
| Consent Records | ✅ AES-256 | ✅ TLS 1.3 | Immutable audit trail |
| Audit Logs | ✅ AES-256 | ✅ TLS 1.3 | Hash chain integrity |
| Payment Data | ✅ Tokenized (Stripe) | ✅ TLS 1.3 | PCI DSS compliant |

## Security Monitoring

### Encryption Monitoring

**Monitored Metrics**:
- TLS connection failures
- Certificate expiration warnings
- Encryption key rotation status
- Secure storage access failures
- Unusual encryption/decryption patterns

**Alerts**:
- Certificate expiring in 30 days
- TLS handshake failures
- Key rotation failures
- Secure storage access errors

### Audit Logging

**Encryption Events Logged**:
```python
encryption_audit_log = EncryptionAuditLog(
    event_type="key_rotation",
    key_type="data_encryption_key",
    success=True,
    timestamp=datetime.now(timezone.utc),
    metadata={
        "rotation_reason": "scheduled_quarterly",
        "old_key_id": "key_2025_q3",
        "new_key_id": "key_2025_q4"
    }
)
```

## Threat Mitigation

### Man-in-the-Middle (MITM) Attacks

**Protection**:
- TLS 1.3 with strong ciphers
- Certificate pinning (mobile apps)
- HSTS headers
- No mixed content
- Certificate validation

**Detection**:
- Monitor for certificate errors
- Alert on pinning failures
- Log TLS handshake failures

### Data Breach

**Protection**:
- Encryption at rest (data useless without keys)
- Key separation (MEK, DEK, application keys)
- Access controls on keys
- Audit logging of key access

**Response**:
- Immediate key rotation
- Assess data exposure
- Notify affected users
- Incident documentation

### Insider Threats

**Protection**:
- Key access restricted to authorized personnel
- All key access logged
- Separation of duties
- Regular access reviews

**Detection**:
- Monitor key access patterns
- Alert on unusual key access
- Regular audit log reviews

## Best Practices

### Development

1. **Never Store Keys in Code**: Use environment variables or key management
2. **Use Strong Algorithms**: AES-256, RSA-2048 minimum
3. **Validate Certificates**: Always validate TLS certificates
4. **Secure Key Storage**: Use platform keychains
5. **Rotate Keys Regularly**: Implement automatic rotation

### Operations

1. **Monitor Certificate Expiration**: Automated renewal
2. **Test Encryption**: Regular encryption/decryption tests
3. **Audit Key Access**: Review key access logs
4. **Update Dependencies**: Keep crypto libraries updated
5. **Incident Response**: Have key rotation procedures ready

### Compliance

1. **Document Encryption**: Maintain encryption documentation
2. **Regular Audits**: Quarterly encryption audits
3. **Compliance Verification**: Verify PIPEDA compliance
4. **User Transparency**: Inform users of encryption practices
5. **Breach Notification**: Have notification procedures ready

## Testing and Validation

### Encryption Testing

**Regular Tests**:
- TLS configuration validation
- Certificate validation
- Encryption/decryption functionality
- Key rotation procedures
- Secure storage access

**Test Tools**:
```bash
# Test TLS configuration
openssl s_client -connect api.nestsync.com:443 -tls1_3

# Verify certificate
openssl x509 -in certificate.crt -text -noout

# Test cipher suites
nmap --script ssl-enum-ciphers -p 443 api.nestsync.com
```

### Penetration Testing

**Annual Tests**:
- TLS/SSL vulnerability scanning
- Certificate validation testing
- Encryption implementation review
- Key management assessment
- Mobile app security testing

## Related Documentation

- [Authentication](./authentication.md) - Token encryption and secure storage
- [RLS Policies](./rls-policies.md) - Database-level access control
- [Audit Trails](../pipeda/audit-trails.md) - Encryption event logging
- [Data Residency](../pipeda/data-residency.md) - Canadian data storage

## Support and Contact

**Security Issues**: security@nestsync.com  
**Encryption Questions**: security-team@nestsync.com  
**Emergency**: security-emergency@nestsync.com

---

**Document Owner**: Security Team  
**Review Frequency**: Quarterly  
**Next Review**: February 8, 2026
