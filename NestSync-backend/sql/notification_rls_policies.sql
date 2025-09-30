-- ============================================================================
-- CRITICAL SECURITY FIX: Enable Row Level Security (RLS) on notification tables
-- This script fixes the security vulnerability for notification system tables
-- PIPEDA Compliance: Canadian privacy laws require data isolation per user
-- ============================================================================

-- Enable RLS on notification tables
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_delivery_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- NOTIFICATION_PREFERENCES TABLE POLICIES
-- ============================================================================

-- Users can only view their own notification preferences
CREATE POLICY "Users can view own notification preferences"
ON public.notification_preferences
FOR SELECT
USING (
    user_id IN (
        SELECT id FROM public.users
        WHERE supabase_user_id = auth.uid()
    )
);

-- Users can only insert their own notification preferences
CREATE POLICY "Users can insert own notification preferences"
ON public.notification_preferences
FOR INSERT
WITH CHECK (
    user_id IN (
        SELECT id FROM public.users
        WHERE supabase_user_id = auth.uid()
    )
);

-- Users can only update their own notification preferences
CREATE POLICY "Users can update own notification preferences"
ON public.notification_preferences
FOR UPDATE
USING (
    user_id IN (
        SELECT id FROM public.users
        WHERE supabase_user_id = auth.uid()
    )
);

-- Users can only delete their own notification preferences
CREATE POLICY "Users can delete own notification preferences"
ON public.notification_preferences
FOR DELETE
USING (
    user_id IN (
        SELECT id FROM public.users
        WHERE supabase_user_id = auth.uid()
    )
);

-- ============================================================================
-- NOTIFICATION_QUEUE TABLE POLICIES
-- ============================================================================

-- Users can only view their own queued notifications
CREATE POLICY "Users can view own queued notifications"
ON public.notification_queue
FOR SELECT
USING (
    user_id IN (
        SELECT id FROM public.users
        WHERE supabase_user_id = auth.uid()
    )
);

-- Service role can manage notification queue (for sending notifications)
CREATE POLICY "Service role can manage notification queue"
ON public.notification_queue
FOR ALL
USING (auth.role() = 'service_role');

-- ============================================================================
-- NOTIFICATION_DELIVERY_LOG TABLE POLICIES
-- ============================================================================

-- Users can only view their own notification delivery logs
CREATE POLICY "Users can view own notification delivery logs"
ON public.notification_delivery_log
FOR SELECT
USING (
    user_id IN (
        SELECT id FROM public.users
        WHERE supabase_user_id = auth.uid()
    )
);

-- Service role can manage delivery logs (for tracking notification delivery)
CREATE POLICY "Service role can manage delivery logs"
ON public.notification_delivery_log
FOR ALL
USING (auth.role() = 'service_role');

-- ============================================================================
-- PIPEDA COMPLIANCE NOTES
-- ============================================================================

-- 1. All notification data is isolated per user via RLS policies
-- 2. Service role has access for automated notification delivery
-- 3. Notification logs support data retention and audit requirements
-- 4. Users can view their own notification history (transparency)
-- 5. Data deletion policies respect CASCADE from users table

-- To apply this script:
-- 1. Go to Supabase Dashboard > SQL Editor
-- 2. Paste this script and run it
-- 3. Verify RLS is enabled: SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'notification%';
-- 4. Test policies with test user credentials