# PIPEDA Compliance Documentation

**Last Updated**: November 8, 2025  
**Compliance Framework**: PIPEDA (Personal Information Protection and Electronic Documents Act)  
**Status**: Active

---

## Overview

This directory contains documentation related to NestSync's compliance with PIPEDA (Personal Information Protection and Electronic Documents Act), Canada's federal privacy law for private-sector organizations.

## Quick Navigation

### Core Compliance Documents

1. **[Data Subject Rights](./data-subject-rights.md)** - User rights to access, export, and delete data
2. **[Data Residency](./data-residency.md)** - Canadian data storage requirements and verification
3. **[Consent Management](./consent-management.md)** - JIT consent system and user consent lifecycle
4. **[Audit Trails](./audit-trails.md)** - Comprehensive compliance logging and monitoring

## PIPEDA Principles

### 1. Accountability
**Requirement**: Organization is responsible for personal information under its control

**Implementation**:
- Designated Privacy Officer
- Privacy policies and procedures
- Staff training on privacy practices
- Third-party vendor agreements
- Regular compliance audits

### 2. Identifying Purposes
**Requirement**: Identify purposes for collecting personal information before or at time of collection

**Implementation**:
- Clear privacy policy
- Just-in-time consent prompts
- Purpose-specific data collection
- Transparent data usage explanations

### 3. Consent
**Requirement**: Obtain knowledge and consent for collection, use, or disclosure of personal information

**Implementation**:
- Explicit consent for data collection
- Granular consent options
- Easy consent withdrawal
- Consent history tracking
- Age-appropriate consent for children's data

### 4. Limiting Collection
**Requirement**: Limit collection to what is necessary for identified purposes

**Implementation**:
- Minimal data collection
- Optional vs required fields
- Progressive data collection
- Regular data collection reviews

### 5. Limiting Use, Disclosure, and Retention
**Requirement**: Use or disclose personal information only for purposes consented to

**Implementation**:
- Purpose-bound data usage
- No third-party sharing without consent
- Data retention policies
- Automated data deletion
- Secure data disposal

### 6. Accuracy
**Requirement**: Keep personal information accurate, complete, and up-to-date

**Implementation**:
- User profile editing
- Data validation
- Regular data quality checks
- User notifications for updates

### 7. Safeguards
**Requirement**: Protect personal information with security safeguards

**Implementation**:
- Encryption at rest and in transit
- Row Level Security (RLS)
- Access controls and authentication
- Security monitoring and logging
- Incident response procedures

### 8. Openness
**Requirement**: Make information about policies and practices readily available

**Implementation**:
- Public privacy policy
- Transparent data practices
- Clear terms of service
- Accessible privacy information
- Regular policy updates

### 9. Individual Access
**Requirement**: Provide individuals access to their personal information

**Implementation**:
- User data access portal
- Data export functionality
- Access request procedures
- Response within 30 days

### 10. Challenging Compliance
**Requirement**: Provide means to challenge compliance with principles

**Implementation**:
- Privacy complaint process
- Privacy Officer contact
- Compliance review procedures
- External dispute resolution

## Data Categories

### Personal Information Collected

#### User Account Data
- Email address
- Name
- Password (hashed)
- Account creation date
- Last login date

#### Family Data
- Family name
- Family members
- Relationships

#### Children Data
- Child name
- Date of birth
- Gender
- Physical measurements (height, weight)
- Clothing sizes

#### Inventory Data
- Item names and descriptions
- Quantities and sizes
- Purchase dates
- Usage patterns

#### Usage Data
- App usage analytics
- Feature usage
- Error logs
- Performance metrics

#### Payment Data (Premium Users)
- Payment method (tokenized via Stripe)
- Billing address
- Subscription status
- Payment history

### Data Processing Purposes

1. **Account Management** - Create and manage user accounts
2. **Service Delivery** - Provide inventory tracking and management
3. **Analytics** - Improve app functionality and user experience
4. **Communication** - Send notifications and updates
5. **Payment Processing** - Process subscription payments
6. **Support** - Provide customer support
7. **Compliance** - Meet legal and regulatory requirements

## Consent Management

### Consent Types

#### Essential Consent
Required for core service functionality:
- Account creation
- Service terms acceptance
- Essential data processing

#### Optional Consent
User can opt-in or opt-out:
- Analytics and usage tracking
- Marketing communications
- Non-essential notifications
- Data sharing with family members

### Consent Mechanisms

#### Just-in-Time Consent
- Consent requested when feature is first used
- Clear explanation of data usage
- Easy to understand language
- Granular consent options

#### Consent Withdrawal
- Easy consent withdrawal process
- Immediate effect on data processing
- Clear consequences explained
- Confirmation of withdrawal

### Implementation
See [Consent Management](./consent-management.md) for detailed implementation.

## Data Subject Rights

### Right to Access
Users can request:
- All personal information held
- Data usage purposes
- Data recipients
- Data retention periods

**Implementation**: Data export feature in profile settings

### Right to Correction
Users can:
- Update profile information
- Correct child information
- Update inventory data

**Implementation**: Edit functionality throughout app

### Right to Deletion
Users can request:
- Account deletion
- Specific data deletion
- Consent withdrawal

**Implementation**: Account deletion feature with confirmation

### Right to Portability
Users can export:
- Profile data (JSON/CSV)
- Children data (JSON/CSV)
- Inventory data (JSON/CSV)
- Usage history (JSON/CSV)

**Implementation**: Data export feature in profile settings

### Implementation
See [Data Subject Rights](./data-subject-rights.md) for detailed implementation.

## Data Residency

### Canadian Data Storage
- Database: Supabase Canada region
- Application: Railway Canada region
- Backups: Canadian data centers
- No cross-border transfers

### Data Transfer Restrictions
- No data transfer outside Canada without consent
- Third-party services must store data in Canada
- Vendor agreements include data residency clauses

### Implementation
See [Data Residency](./data-residency.md) for detailed implementation.

## Audit & Compliance

### Audit Trail
All compliance-relevant events are logged:
- User consent actions
- Data access requests
- Data modifications
- Deletion requests
- Privacy policy updates

### Compliance Monitoring
- Regular compliance reviews
- Automated compliance checks
- Privacy impact assessments
- Third-party audits

### Implementation
See [Audit Trails](./audit-trails.md) for detailed implementation.

## Incident Response

### Data Breach Procedures
1. Detect and contain breach
2. Assess risk of harm
3. Notify Privacy Commissioner if required
4. Notify affected individuals if required
5. Document breach and response
6. Implement preventive measures

### Notification Requirements
- Real risk of significant harm triggers notification
- Notify Privacy Commissioner as soon as feasible
- Notify affected individuals as soon as feasible
- Maintain breach records

## Related Documentation

- [Security Documentation](../security/) - Security implementations
- [Audit Reports](../audits/) - Historical compliance audits
- [Backend RLS](../../../NestSync-backend/docs/database/rls-policies.md) - Data isolation

---

[← Back to Compliance](../README.md)
