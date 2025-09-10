# NestSync Historical Inventory Correction Tools

## Problem Statement

The NestSync application has been successfully logging diaper usage in the `usage_logs` table, but due to bugs in the inventory deduction logic, these historical usage records were **NOT properly deducting quantities from inventory items**. This has resulted in artificially high inventory counts in the dashboard (e.g., showing 524 diapers when the actual remaining should be much lower after historical usage).

## Solution Overview

This toolkit provides a comprehensive, safe approach to retroactively apply all historical diaper usage deductions to correct inventory quantities while maintaining full data integrity and audit trails.

## Scripts Provided

### 1. `analyze_historical_usage.py` - Data Analysis & Assessment
**Purpose**: Analyze historical usage data to understand the scope of corrections needed.

```bash
# Run comprehensive analysis
python analyze_historical_usage.py --detailed

# Analyze specific user only
python analyze_historical_usage.py --user-id USER_UUID

# Quick analysis without detailed reports  
python analyze_historical_usage.py
```

**Outputs**:
- JSON report with detailed analysis
- Human-readable summary report
- Console output with key statistics

**Key Features**:
- Counts total diaper changes vs. linked inventory items
- Calculates required deductions per inventory item
- Identifies potential data integrity issues
- Estimates financial impact of corrections
- User/child breakdowns
- Data validation checks

### 2. `backup_restore_inventory.py` - Database Safety & Recovery
**Purpose**: Create database backups and provide restore capability for safe operations.

```bash
# Create full database backup
python backup_restore_inventory.py backup

# Create faster table-specific backup (inventory-related tables only)
python backup_restore_inventory.py backup --tables-only

# List all available backups
python backup_restore_inventory.py list-backups

# Verify backup integrity
python backup_restore_inventory.py verify --backup backup_filename.sql

# Restore from backup (DANGEROUS - only if correction fails)
python backup_restore_inventory.py restore --backup backup_filename.sql --confirm
```

**Key Features**:
- Uses PostgreSQL `pg_dump` for reliable backups
- Generates backup metadata and integrity checksums
- Table-specific backups for faster operations
- Comprehensive backup verification
- Safe restore with confirmation requirements

### 3. `fix_historical_inventory.py` - Main Correction Engine
**Purpose**: Apply historical inventory corrections with comprehensive safety measures.

```bash
# STEP 1: Preview corrections without applying (SAFE)
python fix_historical_inventory.py --dry-run

# STEP 2: Apply corrections with automatic backup
python fix_historical_inventory.py --apply

# Apply corrections for specific user only
python fix_historical_inventory.py --apply --user-id USER_UUID

# Skip backup creation (NOT RECOMMENDED)
python fix_historical_inventory.py --apply --skip-backup
```

**Key Safety Features**:
- **Dry-run mode**: Preview all changes before applying
- **Automatic backups**: Creates safety backup before any changes
- **Comprehensive logging**: Full audit trail of all operations
- **Data validation**: Pre and post-correction integrity checks
- **Error handling**: Graceful failure with detailed error reporting
- **Rollback capability**: Restore from backup if needed

## Recommended Workflow

### Phase 1: Assessment and Planning
1. **Analyze the scope**:
   ```bash
   python analyze_historical_usage.py --detailed
   ```
   Review the generated reports to understand:
   - How many inventory items need correction
   - Total quantity deductions required
   - Potential issues (negative quantities, etc.)
   - Financial impact estimate

2. **Review analysis results**:
   - Check the JSON report for detailed breakdowns
   - Read the summary report for key findings
   - Address any ERROR-level validation issues

### Phase 2: Safety Preparation
3. **Create database backup**:
   ```bash
   python backup_restore_inventory.py backup --tables-only
   ```
   This creates a faster backup of inventory-related tables.

4. **Verify backup**:
   ```bash
   python backup_restore_inventory.py verify --backup [backup_filename]
   ```

### Phase 3: Correction Preview
5. **Preview corrections (DRY RUN)**:
   ```bash
   python fix_historical_inventory.py --dry-run
   ```
   This shows exactly what would be changed without applying anything.

6. **Review dry-run results**:
   - Verify the corrections look reasonable
   - Check for any unexpected negative quantities
   - Confirm the scope matches your analysis

### Phase 4: Apply Corrections
7. **Apply corrections**:
   ```bash
   python fix_historical_inventory.py --apply
   ```
   This applies all corrections with automatic backup and validation.

8. **Verify results**:
   - Check the dashboard for updated inventory counts
   - Run the analysis script again to confirm corrections
   - Monitor application for any issues

## Error Recovery

If something goes wrong during corrections:

1. **Check the logs**:
   - `historical_inventory_correction.log` for detailed operation logs
   - JSON output files for specific error details

2. **Restore from backup if needed**:
   ```bash
   python backup_restore_inventory.py restore --backup [backup_filename] --confirm
   ```

3. **Re-run analysis to understand the issue**:
   ```bash
   python analyze_historical_usage.py --detailed
   ```

## Data Integrity Safeguards

### Pre-Correction Validation
- Inventory item counts and validation
- Usage log consistency checks
- Detection of future-dated logs
- Identification of orphaned usage logs

### During Correction
- Transaction-based updates (all-or-nothing)
- Individual item error handling
- Progress logging every 100 corrections
- Automatic rollback on critical failures

### Post-Correction Validation
- Negative inventory detection
- Sample validation of corrections
- Consistency checks between usage logs and quantities
- Final integrity report

## File Outputs

### Analysis Reports
- `historical_usage_analysis_report_YYYYMMDD_HHMMSS.json` - Detailed analysis data
- `historical_usage_analysis_report_YYYYMMDD_HHMMSS_summary.txt` - Human-readable summary

### Correction Results
- `inventory_correction_dry_run_YYYYMMDD_HHMMSS.json` - Dry run results
- `inventory_correction_applied_YYYYMMDD_HHMMSS.json` - Applied correction results

### Backups
- `inventory_backups/inventory_backup_YYYYMMDD_HHMMSS.sql` - Database backup
- `inventory_backups/inventory_backup_YYYYMMDD_HHMMSS.json` - Backup metadata

### Logs
- `historical_usage_analysis.log` - Analysis operation logs
- `historical_inventory_correction.log` - Correction operation logs
- `backup_restore.log` - Backup/restore operation logs

## Expected Impact

### Before Correction
- Dashboard shows artificially high inventory (e.g., 524 diapers)
- "Changes ready" calculations are inaccurate
- Inventory tracking doesn't reflect actual usage

### After Correction
- Dashboard shows realistic inventory based on actual usage
- "Diapers available" reflects true remaining quantities
- Historical usage is properly accounted for in inventory
- Future diaper changes will continue to deduct properly (bugs already fixed)

## Technical Details

### Database Tables Affected
- `inventory_items` - `quantity_remaining` field updated
- `usage_logs` - Read-only analysis (no changes)
- `children` - Read-only for relationships
- `users` - Read-only for user filtering

### Key Query Logic
```sql
-- Find historical usage per inventory item
SELECT 
    inventory_item_id,
    COUNT(*) as usage_count,
    SUM(quantity_used) as total_to_deduct
FROM usage_logs 
WHERE usage_type = 'diaper_change' 
    AND inventory_item_id IS NOT NULL
    AND is_deleted = FALSE
GROUP BY inventory_item_id;

-- Apply corrections
UPDATE inventory_items 
SET quantity_remaining = quantity_remaining - [total_to_deduct]
WHERE id = [inventory_item_id];
```

### Safety Constraints
- Database check constraints prevent negative quantities
- Foreign key relationships are preserved
- All operations use proper async session management
- Full transaction rollback on any failure

## Troubleshooting

### Common Issues

**Issue**: "Database not initialized" error
**Solution**: Ensure the backend server is running and database connections are working

**Issue**: pg_dump not found
**Solution**: Install PostgreSQL client tools or ensure pg_dump is in PATH

**Issue**: Permission denied on backup directory
**Solution**: Check write permissions for `inventory_backups/` directory

**Issue**: Corrections result in negative quantities
**Solution**: Review the analysis report for data integrity issues, may indicate initial inventory quantities were incorrect

### Getting Help

1. Check the log files for detailed error messages
2. Run the analysis script to understand current data state
3. Verify database connectivity and permissions
4. Ensure all required Python packages are installed

### Contact

For technical support or questions about this correction process, contact the NestSync Backend Engineering Team.

---

**IMPORTANT**: Always run the analysis script first and create backups before applying any corrections. The dry-run mode is your friend - use it to preview changes before making them permanent.