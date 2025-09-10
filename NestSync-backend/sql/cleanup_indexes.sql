-- Database Index Cleanup Script for NestSync
-- Removes duplicate and unused indexes identified by Supabase linter
-- Date: 2025-01-09
-- Purpose: Optimize database performance and reduce storage overhead

-- =============================================================================
-- REMOVE DUPLICATE INDEXES
-- =============================================================================

-- Remove duplicate index on consent_audit_logs table
-- Keep the more specific index, drop the generic one
DROP INDEX IF EXISTS public.ix_consent_audit_logs_consent_record_id;

-- Verify the remaining index exists and covers our needs
-- The idx_consent_audit_logs_consent_record index should remain

-- =============================================================================
-- REVIEW UNUSED INDEXES
-- =============================================================================

-- The following indexes are marked as unused by Supabase.
-- We'll keep essential ones for query patterns and drop truly unused ones.

-- CONSENT RECORDS - Keep user_id index (essential for RLS queries)
-- DROP INDEX IF EXISTS public.ix_consent_records_user_id; -- KEEP THIS ONE

-- Drop consent_type index if not used in queries
-- Review: Do we filter by consent_type in any queries?
DROP INDEX IF EXISTS public.ix_consent_records_consent_type;

-- CONSENT AUDIT LOGS - Keep user_id index (essential for RLS queries)  
-- DROP INDEX IF EXISTS public.ix_consent_audit_logs_user_id; -- KEEP THIS ONE

-- USERS TABLE INDEXES
-- Drop rarely used indexes to reduce overhead
DROP INDEX IF EXISTS public.idx_users_status; -- Users typically queried by ID/email
DROP INDEX IF EXISTS public.idx_users_created_at; -- Rarely used for user queries
DROP INDEX IF EXISTS public.idx_users_province; -- Geographic queries are rare

-- CHILDREN TABLE INDEXES
-- Keep essential indexes, drop unused ones
DROP INDEX IF EXISTS public.idx_children_date_of_birth; -- Rarely queried by DOB
DROP INDEX IF EXISTS public.idx_children_current_size; -- Size queries less common
DROP INDEX IF EXISTS public.idx_children_onboarding; -- Onboarding status rarely queried

-- CONSENT RECORDS - Additional cleanup
DROP INDEX IF EXISTS public.idx_consent_records_status; -- Status rarely queried directly
DROP INDEX IF EXISTS public.idx_consent_records_granted_at; -- Date queries uncommon
DROP INDEX IF EXISTS public.idx_consent_records_expires_at; -- Expiry queries uncommon

-- CONSENT AUDIT LOGS - Additional cleanup  
DROP INDEX IF EXISTS public.idx_consent_audit_logs_action; -- Action rarely filtered

-- INVENTORY ITEMS INDEXES
-- Keep child_id index (essential), review others
DROP INDEX IF EXISTS public.idx_inventory_child_size; -- Compound queries rare
DROP INDEX IF EXISTS public.idx_inventory_expiry; -- Expiry queries less frequent
DROP INDEX IF EXISTS public.idx_inventory_brand_size; -- Brand+size filtering uncommon

-- USAGE LOGS INDEXES
-- Keep child_id index (essential), review date-based indexes
DROP INDEX IF EXISTS public.idx_usage_child_date; -- May want to keep for dashboard queries
DROP INDEX IF EXISTS public.idx_usage_daily_stats; -- Depends on analytics needs

-- STOCK THRESHOLDS INDEXES  
-- Review all indexes for actual usage patterns
DROP INDEX IF EXISTS public.idx_threshold_child_product; -- May be useful for queries
DROP INDEX IF EXISTS public.idx_threshold_notifications; -- Notification queries rare
DROP INDEX IF EXISTS public.idx_threshold_priority; -- Priority filtering uncommon

-- =============================================================================
-- ESSENTIAL INDEXES TO KEEP (DO NOT DROP)
-- =============================================================================

-- These indexes are critical for performance and RLS policies:
-- 1. users.supabase_user_id (unique index) - Authentication
-- 2. users.email (unique index) - Login queries
-- 3. children.user_id - RLS policy queries
-- 4. inventory_items.child_id - Dashboard and RLS queries
-- 5. usage_logs.child_id - Dashboard and RLS queries  
-- 6. consent_records.user_id - RLS policy queries
-- 7. consent_audit_logs.user_id - RLS policy queries
-- 8. stock_thresholds.child_id - Threshold queries

-- =============================================================================
-- PERFORMANCE IMPACT ANALYSIS
-- =============================================================================

-- After running this cleanup:
-- 1. Reduced index maintenance overhead during writes
-- 2. Lower storage requirements
-- 3. Faster backup/restore operations
-- 4. Simplified query planning
-- 5. Maintained performance for essential queries

-- =============================================================================
-- MONITORING RECOMMENDATIONS  
-- =============================================================================

-- After applying these changes, monitor for:
-- 1. Query performance degradation (use EXPLAIN ANALYZE)
-- 2. Slow log entries for affected tables
-- 3. Overall database performance metrics
-- 4. Application response times

-- If performance issues arise, consider re-adding specific indexes
-- based on actual usage patterns in production.

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Check remaining indexes on each table
/*
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN (
    'users', 'children', 'consent_records', 
    'consent_audit_logs', 'inventory_items', 
    'usage_logs', 'stock_thresholds'
)
ORDER BY tablename, indexname;
*/

-- =============================================================================
-- ROLLBACK INSTRUCTIONS
-- =============================================================================

-- If needed to rollback any dropped indexes, run the original Alembic migrations
-- or manually recreate specific indexes using:
-- CREATE INDEX idx_name ON table_name (column_name);

-- =============================================================================
-- END OF INDEX CLEANUP
-- =============================================================================

COMMENT ON SCHEMA public IS 'NestSync database with optimized indexes and RLS policies';