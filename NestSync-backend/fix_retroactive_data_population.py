#!/usr/bin/env python3
"""
Retroactive Data Population Fix for NestSync
===========================================

This script fixes the issue with populating historical diaper change data
that causes constraint violations on `time_since_last_change`.

ISSUE:
------
The GraphQL resolver for logDiaperChange calculates time_since_last_change
by finding the most recent diaper change and calculating the time difference.
When populating historical data chronologically, this causes negative values
because it finds changes that occurred AFTER the current timestamp being inserted.

SOLUTION:
---------
1. Temporarily disable the constraint
2. Run the data population
3. Fix the negative values with a post-processing query
4. Re-enable the constraint

Usage:
------
python fix_retroactive_data_population.py --action prepare
python populate_analytics_data.py --days-back 90
python fix_retroactive_data_population.py --action cleanup

Requirements:
-------------
- Docker development environment running
- Backend server accessible
- Test account: parents@nestsync.com / Shazam11#
"""

import asyncio
import subprocess
import sys
import argparse
import logging
from datetime import datetime, timezone
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Database connection string for Supabase local environment
DATABASE_URL = "postgresql://postgres:password@localhost:5432/nestsync"

class RetrospectiveDataFixer:
    """Handles preparation and cleanup for retroactive data population"""

    def __init__(self):
        self.logger = logging.getLogger(__name__)

    def run_sql_command(self, sql_content: str, description: str) -> bool:
        """Run SQL command against the database"""
        try:
            # Write SQL to temporary file
            temp_file = "/tmp/nestsync_temp_sql.sql"
            with open(temp_file, 'w') as f:
                f.write(sql_content)

            # Execute SQL via psql
            result = subprocess.run([
                "psql", DATABASE_URL, "-f", temp_file
            ], capture_output=True, text=True)

            if result.returncode == 0:
                self.logger.info(f"✅ {description} - SUCCESS")
                if result.stdout.strip():
                    self.logger.info(f"Output: {result.stdout.strip()}")
                return True
            else:
                self.logger.error(f"❌ {description} - FAILED")
                self.logger.error(f"Error: {result.stderr}")
                return False

        except Exception as e:
            self.logger.error(f"❌ {description} - EXCEPTION: {e}")
            return False
        finally:
            # Clean up temp file
            if os.path.exists("/tmp/nestsync_temp_sql.sql"):
                os.remove("/tmp/nestsync_temp_sql.sql")

    def prepare_for_retroactive_data(self) -> bool:
        """Prepare database for retroactive data population"""
        self.logger.info("🔧 Preparing database for retroactive data population...")

        # Step 1: Disable the constraint
        disable_constraint_sql = """
-- Temporarily disable time constraint to allow retroactive data population
-- This should only be used for data seeding purposes

-- Drop the constraint
ALTER TABLE usage_logs DROP CONSTRAINT IF EXISTS check_time_since_last_change_positive;

-- Log the action
INSERT INTO public.audit_log (action, details, created_at)
VALUES ('constraint_disabled', 'Disabled check_time_since_last_change_positive for retroactive data population', NOW())
ON CONFLICT DO NOTHING;
"""

        success = self.run_sql_command(
            disable_constraint_sql,
            "Disabling time_since_last_change constraint"
        )

        if success:
            self.logger.info("🎯 Database prepared for retroactive data population")
            self.logger.info("   You can now run: python populate_analytics_data.py --days-back 90")
            return True
        else:
            self.logger.error("❌ Failed to prepare database")
            return False

    def cleanup_after_retroactive_data(self) -> bool:
        """Clean up database after retroactive data population"""
        self.logger.info("🧹 Cleaning up after retroactive data population...")

        # Step 1: Fix negative time_since_last_change values
        fix_negative_values_sql = """
-- Fix negative time_since_last_change values caused by retroactive data insertion
-- This recalculates the values properly by looking at the PREVIOUS change, not the most recent

WITH ordered_logs AS (
    SELECT
        id,
        child_id,
        logged_at,
        LAG(logged_at) OVER (
            PARTITION BY child_id, usage_type
            ORDER BY logged_at
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
AND (
    usage_logs.time_since_last_change < 0
    OR usage_logs.time_since_last_change IS NULL
    OR calculated_times.correct_time_since_last != usage_logs.time_since_last_change
);
"""

        step1_success = self.run_sql_command(
            fix_negative_values_sql,
            "Fixing negative time_since_last_change values"
        )

        if not step1_success:
            self.logger.error("❌ Failed to fix negative values")
            return False

        # Step 2: Re-enable the constraint
        enable_constraint_sql = """
-- Re-enable the time constraint after fixing data
ALTER TABLE usage_logs ADD CONSTRAINT check_time_since_last_change_positive
CHECK (time_since_last_change >= 0);

-- Log the action
INSERT INTO public.audit_log (action, details, created_at)
VALUES ('constraint_enabled', 'Re-enabled check_time_since_last_change_positive after retroactive data population', NOW())
ON CONFLICT DO NOTHING;
"""

        step2_success = self.run_sql_command(
            enable_constraint_sql,
            "Re-enabling time_since_last_change constraint"
        )

        if step2_success:
            self.logger.info("✅ Database cleanup completed successfully")
            return True
        else:
            self.logger.error("❌ Failed to re-enable constraint")
            return False

    def validate_data_integrity(self) -> bool:
        """Validate that the data is in good shape after fixes"""
        self.logger.info("🔍 Validating data integrity...")

        validation_sql = """
-- Validation queries to check data integrity
SELECT
    'Negative time_since_last_change count' as check_type,
    COUNT(*) as count
FROM usage_logs
WHERE time_since_last_change < 0 AND usage_type = 'diaper_change'

UNION ALL

SELECT
    'Total diaper changes' as check_type,
    COUNT(*) as count
FROM usage_logs
WHERE usage_type = 'diaper_change' AND is_deleted = FALSE

UNION ALL

SELECT
    'Diaper changes with time_since_last' as check_type,
    COUNT(*) as count
FROM usage_logs
WHERE usage_type = 'diaper_change'
AND is_deleted = FALSE
AND time_since_last_change IS NOT NULL

UNION ALL

SELECT
    'Average time between changes (minutes)' as check_type,
    ROUND(AVG(time_since_last_change))::INTEGER as count
FROM usage_logs
WHERE usage_type = 'diaper_change'
AND is_deleted = FALSE
AND time_since_last_change IS NOT NULL
AND time_since_last_change > 0;
"""

        success = self.run_sql_command(
            validation_sql,
            "Validating data integrity"
        )

        return success

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="Fix retroactive data population issues")
    parser.add_argument(
        "--action",
        choices=["prepare", "cleanup", "validate"],
        required=True,
        help="Action to perform: prepare (before data population), cleanup (after data population), validate (check data integrity)"
    )

    args = parser.parse_args()

    fixer = RetrospectiveDataFixer()

    try:
        if args.action == "prepare":
            logger.info("🚀 PREPARING FOR RETROACTIVE DATA POPULATION")
            logger.info("=" * 60)
            success = fixer.prepare_for_retroactive_data()
            if success:
                logger.info("\n" + "=" * 60)
                logger.info("✅ PREPARATION COMPLETE")
                logger.info("   Next steps:")
                logger.info("   1. Run: python populate_analytics_data.py --days-back 90")
                logger.info("   2. Then run: python fix_retroactive_data_population.py --action cleanup")
                return 0
            else:
                logger.error("❌ PREPARATION FAILED")
                return 1

        elif args.action == "cleanup":
            logger.info("🧹 CLEANING UP AFTER RETROACTIVE DATA POPULATION")
            logger.info("=" * 60)
            success = fixer.cleanup_after_retroactive_data()
            if success:
                # Also run validation
                fixer.validate_data_integrity()
                logger.info("\n" + "=" * 60)
                logger.info("✅ CLEANUP COMPLETE")
                logger.info("   Your retroactive data population is now complete!")
                logger.info("   Check your analytics dashboard for weekday vs weekend patterns.")
                return 0
            else:
                logger.error("❌ CLEANUP FAILED")
                return 1

        elif args.action == "validate":
            logger.info("🔍 VALIDATING DATA INTEGRITY")
            logger.info("=" * 60)
            success = fixer.validate_data_integrity()
            if success:
                logger.info("✅ VALIDATION COMPLETE")
                return 0
            else:
                logger.error("❌ VALIDATION FAILED")
                return 1

    except KeyboardInterrupt:
        logger.info("\nOperation cancelled by user")
        return 1
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)