-- ============================================================================
-- PRODUCTION DATA MIGRATION: Fix Orphaned Children Records
-- ============================================================================
-- Purpose: Link orphaned children records to correct parent user account
-- Issue: children.created_by = NULL preventing user from seeing their data
-- User: parents@nestsync.com (ID: 8c969581-743e-4381-92b7-f8ca3642b512)
-- Children: Zee, Damilare (2 records)
--
-- Safety Measures:
-- - Atomic transaction with automatic rollback on failure
-- - Pre/post verification queries with row count validation
-- - Foreign key constraint verification (user exists in auth.users)
-- - Service role execution bypasses RLS policies
-- - Audit trail with timestamps and comments
-- ============================================================================

-- Start atomic transaction
BEGIN;

-- ============================================================================
-- SECTION 1: Pre-Update Verification
-- ============================================================================

DO $$
DECLARE
    v_user_exists BOOLEAN;
    v_orphaned_count INTEGER;
    v_target_user_id UUID := '8c969581-743e-4381-92b7-f8ca3642b512';
    v_child1_id UUID := 'acc13a59-8a8e-4049-8bb2-c082b1fcd463';
    v_child2_id UUID := '31c0a2c8-18a3-4cd4-92cb-31d7c6f15adc';
BEGIN
    RAISE NOTICE '=== PRE-UPDATE VERIFICATION ===';

    -- Verify target user exists in auth.users
    SELECT EXISTS(
        SELECT 1 FROM auth.users WHERE id = v_target_user_id
    ) INTO v_user_exists;

    IF NOT v_user_exists THEN
        RAISE EXCEPTION 'VERIFICATION FAILED: Target user % does not exist in auth.users', v_target_user_id;
    END IF;

    RAISE NOTICE 'Target user verification: PASSED (user exists in auth.users)';

    -- Verify orphaned children records exist with exact specifications
    SELECT COUNT(*) INTO v_orphaned_count
    FROM children
    WHERE id IN (v_child1_id, v_child2_id)
      AND created_by IS NULL
      AND is_deleted = FALSE;

    IF v_orphaned_count != 2 THEN
        RAISE EXCEPTION 'VERIFICATION FAILED: Expected 2 orphaned children, found %', v_orphaned_count;
    END IF;

    RAISE NOTICE 'Orphaned children verification: PASSED (found 2 records with created_by = NULL)';

    -- Display current state for audit trail
    RAISE NOTICE 'Current state of target children:';
    PERFORM
        id,
        name,
        created_by,
        is_deleted,
        created_at,
        updated_at
    FROM children
    WHERE id IN (v_child1_id, v_child2_id);

    RAISE NOTICE 'Pre-update verification: ALL CHECKS PASSED';

END $$;

-- ============================================================================
-- SECTION 2: Data Migration Update
-- ============================================================================

RAISE NOTICE '=== EXECUTING DATA MIGRATION ===';

-- Update orphaned children records with correct created_by user_id
UPDATE children
SET
    created_by = '8c969581-743e-4381-92b7-f8ca3642b512',
    updated_at = NOW()
WHERE
    id IN ('acc13a59-8a8e-4049-8bb2-c082b1fcd463', '31c0a2c8-18a3-4cd4-92cb-31d7c6f15adc')
    AND created_by IS NULL
    AND is_deleted = FALSE;

-- Verify update affected exactly 2 rows
DO $$
DECLARE
    v_rows_updated INTEGER;
BEGIN
    GET DIAGNOSTICS v_rows_updated = ROW_COUNT;

    IF v_rows_updated != 2 THEN
        RAISE EXCEPTION 'UPDATE FAILED: Expected 2 rows updated, got %', v_rows_updated;
    END IF;

    RAISE NOTICE 'Data migration update: SUCCESS (2 rows updated)';
END $$;

-- ============================================================================
-- SECTION 3: Post-Update Verification
-- ============================================================================

DO $$
DECLARE
    v_verified_count INTEGER;
    v_target_user_id UUID := '8c969581-743e-4381-92b7-f8ca3642b512';
    v_child1_id UUID := 'acc13a59-8a8e-4049-8bb2-c082b1fcd463';
    v_child2_id UUID := '31c0a2c8-18a3-4cd4-92cb-31d7c6f15adc';
BEGIN
    RAISE NOTICE '=== POST-UPDATE VERIFICATION ===';

    -- Verify children now have correct created_by value
    SELECT COUNT(*) INTO v_verified_count
    FROM children
    WHERE id IN (v_child1_id, v_child2_id)
      AND created_by = v_target_user_id
      AND is_deleted = FALSE;

    IF v_verified_count != 2 THEN
        RAISE EXCEPTION 'VERIFICATION FAILED: Expected 2 children with created_by = %, found %',
            v_target_user_id, v_verified_count;
    END IF;

    RAISE NOTICE 'Created_by verification: PASSED (both children now linked to user)';

    -- Display updated state for audit trail
    RAISE NOTICE 'Updated state of target children:';
    PERFORM
        id,
        name,
        created_by,
        is_deleted,
        created_at,
        updated_at
    FROM children
    WHERE id IN (v_child1_id, v_child2_id);

    -- Verify no unintended changes to other records
    SELECT COUNT(*) INTO v_verified_count
    FROM children
    WHERE created_by = v_target_user_id
      AND id NOT IN (v_child1_id, v_child2_id)
      AND updated_at > NOW() - INTERVAL '1 minute';

    IF v_verified_count > 0 THEN
        RAISE WARNING 'WARNING: Found % additional children records modified in last minute', v_verified_count;
        -- Not failing transaction - might be legitimate concurrent updates
    END IF;

    RAISE NOTICE 'Post-update verification: ALL CHECKS PASSED';

END $$;

-- ============================================================================
-- SECTION 4: Audit Trail and Final Verification
-- ============================================================================

DO $$
DECLARE
    v_target_user_id UUID := '8c969581-743e-4381-92b7-f8ca3642b512';
BEGIN
    RAISE NOTICE '=== FINAL AUDIT SUMMARY ===';
    RAISE NOTICE 'Migration Target: parents@nestsync.com (User ID: %)', v_target_user_id;
    RAISE NOTICE 'Children Updated: 2 records (Zee, Damilare)';
    RAISE NOTICE 'Timestamp: %', NOW();
    RAISE NOTICE 'Operation: SET created_by = % WHERE created_by IS NULL', v_target_user_id;
    RAISE NOTICE 'All verification checks: PASSED';
    RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- SECTION 5: Transaction Commit
-- ============================================================================

-- All verifications passed - safe to commit changes
COMMIT;

RAISE NOTICE 'TRANSACTION COMMITTED SUCCESSFULLY';
RAISE NOTICE 'Data migration complete - orphaned children records now linked to parent user';

-- ============================================================================
-- POST-MIGRATION VERIFICATION QUERY (Run separately after commit)
-- ============================================================================
--
-- Run this query after migration to verify user can now access children:
--
-- SELECT
--     c.id,
--     c.name,
--     c.created_by,
--     c.is_deleted,
--     c.created_at,
--     c.updated_at,
--     u.email
-- FROM children c
-- JOIN auth.users u ON c.created_by = u.id
-- WHERE c.created_by = '8c969581-743e-4381-92b7-f8ca3642b512'
--   AND c.is_deleted = FALSE
-- ORDER BY c.created_at DESC;
--
-- Expected Result: 2 rows showing Zee and Damilare linked to parents@nestsync.com
-- ============================================================================
