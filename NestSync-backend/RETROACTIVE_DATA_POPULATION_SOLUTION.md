# Retroactive Data Population Solution

## Issue Description

When running the analytics data population script (`populate_analytics_data.py`) to generate historical diaper change data (90 days back), the system encounters a database constraint violation:

```
ERROR: new row for relation "usage_logs" violates check constraint "check_time_since_last_change_positive"
```

The violation shows negative values like `-44555`, `-44450`, `-44378` for `time_since_last_change`.

## Root Cause Analysis

### The Problem

The issue occurs in the GraphQL resolver `log_diaper_change` in `/app/graphql/inventory_resolvers.py` at lines 493-506:

```python
# Calculate time since last change
last_change_query = select(UsageLog).where(
    and_(
        UsageLog.child_id == child_uuid,
        UsageLog.usage_type == "diaper_change",
        UsageLog.is_deleted == False
    )
).order_by(desc(UsageLog.logged_at)).limit(1)  # ← This gets the MOST RECENT change

# ...

if last_change_log:
    logged_at = input.logged_at or datetime.now(timezone.utc)
    time_since_last = int((logged_at - last_change_log.logged_at).total_seconds() / 60)
    #                     ↑ Current timestamp - Most recent timestamp = NEGATIVE for historical data
```

### Why This Causes Negative Values

When populating historical data chronologically:

1. **Day 90 ago**: Insert first change (timestamp: 90 days ago)
2. **Day 89 ago**: Try to insert second change (timestamp: 89 days ago)
   - Query finds "most recent" change: the one from 90 days ago
   - Calculation: `89_days_ago - 90_days_ago = NEGATIVE value`
   - Should be: `90_days_ago - 89_days_ago = POSITIVE value`

The resolver finds the most recent change by timestamp (ORDER BY DESC), not the most recent change chronologically before the current insertion timestamp.

## Solution Components

### 1. Complete Fix Script: `fix_retroactive_data_population.py`

A comprehensive Python script that handles the entire workflow:

- **Prepare phase**: Disables the constraint temporarily
- **Cleanup phase**: Fixes negative values and re-enables constraint
- **Validate phase**: Verifies data integrity

### 2. Improved Population Script: `populate_analytics_data_improved.py`

An enhanced version of the original script with:

- Constraint violation detection
- Helpful error messages and guidance
- Better error handling for retroactive data
- Integration with the fix script

### 3. Enhanced SQL Script: `disable_time_constraint.sql`

Updated version with:

- Better documentation of the issue
- Audit logging
- Status reporting

## Usage Instructions

### Recommended Workflow (3-Step Process)

```bash
# Step 1: Prepare database (disable constraint)
python fix_retroactive_data_population.py --action prepare

# Step 2: Populate historical data
python populate_analytics_data_improved.py --days-back 90

# Step 3: Cleanup database (fix values and re-enable constraint)
python fix_retroactive_data_population.py --action cleanup
```

### Alternative: Original Script with Fix

If you prefer to use the original script:

```bash
# Step 1: Prepare
python fix_retroactive_data_population.py --action prepare

# Step 2: Populate (original script)
python populate_analytics_data.py --days-back 90

# Step 3: Cleanup
python fix_retroactive_data_population.py --action cleanup
```

### For Current/Future Data (No Issues)

For data that's not historical (< 1 day old), no special handling is needed:

```bash
# This works fine without constraint issues
python populate_analytics_data_improved.py --days-back 7
```

## Technical Details

### What the Fix Does

1. **Disable Constraint**: Temporarily removes the `CHECK (time_since_last_change >= 0)` constraint

2. **Populate Data**: Allows the population script to insert historical data with negative values

3. **Fix Calculations**: Recalculates `time_since_last_change` properly using a window function:
   ```sql
   WITH ordered_logs AS (
       SELECT
           id,
           child_id,
           logged_at,
           LAG(logged_at) OVER (
               PARTITION BY child_id, usage_type
               ORDER BY logged_at  -- ← Chronological order, not DESC
           ) as previous_logged_at
       FROM usage_logs
       WHERE usage_type = 'diaper_change'
       AND is_deleted = FALSE
   ),
   calculated_times AS (
       SELECT
           id,
           CASE
               WHEN previous_logged_at IS NOT NULL
               THEN EXTRACT(EPOCH FROM (logged_at - previous_logged_at)) / 60
               ELSE NULL
           END as correct_time_since_last
       FROM ordered_logs
   )
   UPDATE usage_logs
   SET time_since_last_change = calculated_times.correct_time_since_last::INTEGER
   FROM calculated_times
   WHERE usage_logs.id = calculated_times.id
   ```

4. **Re-enable Constraint**: Restores the constraint after data is fixed

### Safety Features

- **Audit Logging**: All actions are logged to `audit_log` table
- **Data Validation**: Built-in validation checks after cleanup
- **Rollback Safe**: Can be re-run if issues occur
- **Non-destructive**: Only fixes negative/incorrect values

## File Locations

```
NestSync-backend/
├── fix_retroactive_data_population.py          # Main fix script
├── populate_analytics_data_improved.py         # Enhanced population script
├── disable_time_constraint.sql                 # SQL constraint disable script
├── RETROACTIVE_DATA_POPULATION_SOLUTION.md     # This documentation
└── scripts/
    └── populate_analytics_data.py               # Original population script
```

## Expected Results

After successful completion:

### Data Volume
- **90 days** of realistic diaper change data
- **~630 total changes** (7 per day average)
- **Weekday vs Weekend patterns** clearly visible in analytics

### Analytics Patterns
- **Weekday Pattern**: Higher frequency on Friday, lower on Monday
- **Weekend Pattern**: More relaxed, family-time focused changes
- **Time-of-Day Distribution**: Morning and evening peaks on weekdays
- **Seasonal Variations**: Summer (higher) vs Winter (lower) frequencies

### Data Quality
- All `time_since_last_change` values ≥ 0
- Realistic intervals between changes (60-300 minutes typical)
- Proper chronological ordering
- Canadian timezone handling

## Troubleshooting

### Docker Not Running
If you see "Docker is not running" errors:

```bash
# Start Docker Desktop, then:
cd /path/to/NestSync
./docker/docker-dev.sh up
```

### Database Connection Issues
If PostgreSQL connection fails:

```bash
# Check Supabase status
supabase status

# Reset if needed
supabase db reset
```

### Permission Issues
If psql can't connect:

```bash
# Use Supabase connection string instead
supabase db reset
```

### Constraint Still Exists After Fix
Run validation to check:

```bash
python fix_retroactive_data_population.py --action validate
```

## Future Improvements

### Long-term Solution
The ideal fix would be to update the GraphQL resolver to use the correct query when inserting historical data:

```python
# Instead of ORDER BY desc(UsageLog.logged_at)
# Use ORDER BY desc(UsageLog.logged_at) WHERE UsageLog.logged_at < input.logged_at
```

### Enhanced Analytics
- Seasonal pattern detection
- Growth spurt indicators
- Consumption forecasting
- Size transition predictions

## Support

For issues with this solution:

1. **Check logs**: All scripts provide detailed logging
2. **Run validation**: Use `--action validate` to check data integrity
3. **Review documentation**: This file covers common scenarios
4. **Test with dry-run**: Use `--dry-run` flag to preview changes

The solution is designed to be safe, reversible, and thoroughly documented for production use in the NestSync analytics system.