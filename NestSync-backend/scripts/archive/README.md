# Emergency Scripts Archive

This directory contains critical emergency repair scripts developed during the fix branch consolidation phase. These scripts address urgent data integrity, authentication, and privacy compliance issues that were discovered during development.

## Archive Date
September 13, 2025

## Scripts Contained

### Data Privacy & Compliance
- `fix_data_privacy_violation_urgent.py` - Emergency PIPEDA compliance fixes for data access violations
- `fix_child_parent_association.py` - Critical fix for child-parent ownership relationship bugs
- `emergency_revert_child_ownership.py` - Emergency revert tool for child ownership data integrity issues

### Authentication & Security
- `debug_auth_issues.py` - Authentication debugging and diagnostic tools
- `fix_user_status.py` - User status and account state repair utilities

### System Diagnostics
- `auto_fix_supabase.py` - Automated Supabase configuration and connectivity diagnostics
- `emergency_revert_via_api.py` - Emergency API-based data reversion tools

### Data Migration & Integrity
- `fix_historical_inventory.py` - Historical inventory data consistency repairs
- `fix_ose_onboarding.py` - Onboarding flow emergency fixes
- `execute_emergency_revert.py` - Master emergency revert execution script

## Usage Warning
These scripts were developed as emergency measures during critical system failures. They contain direct database manipulation and should only be used:
1. During emergency data integrity situations
2. With full database backup in place
3. By developers familiar with the NestSync data architecture
4. After thorough testing in development environment

## Archival Rationale
These scripts are archived rather than deleted because:
- They contain valuable debugging logic for future issues
- They document critical system failure patterns
- They provide emergency recovery procedures
- They serve as reference for security audit trails

## Related Documentation
- See `bottlenecks.md` for detailed analysis of issues these scripts address
- Reference PIPEDA compliance documentation for privacy violation context
- Check git commit history for detailed usage context of each script

## Safety Notice
All scripts have been tested and validated during the emergency fix phase. However, they should be considered emergency tools only and not part of the regular development workflow.