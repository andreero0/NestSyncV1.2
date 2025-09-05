-- ============================================================================
-- CRITICAL SECURITY FIX: Enable Row Level Security (RLS) on all public tables
-- This migration fixes the security vulnerability identified by Supabase
-- Created: 2024-09-05
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.children ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.consent_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.alembic_version ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USERS TABLE POLICIES
-- ============================================================================

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- Users can only view their own profile
CREATE POLICY "Users can view own profile" 
ON public.users 
FOR SELECT 
USING (supabase_user_id = auth.uid());

-- Users can only update their own profile
CREATE POLICY "Users can update own profile" 
ON public.users 
FOR UPDATE 
USING (supabase_user_id = auth.uid());

-- Users can insert their own profile during registration
CREATE POLICY "Users can insert own profile" 
ON public.users 
FOR INSERT 
WITH CHECK (supabase_user_id = auth.uid());

-- ============================================================================
-- CHILDREN TABLE POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own children" ON public.children;
DROP POLICY IF EXISTS "Users can insert own children" ON public.children;
DROP POLICY IF EXISTS "Users can update own children" ON public.children;
DROP POLICY IF EXISTS "Users can delete own children" ON public.children;

-- Users can only view their own children
CREATE POLICY "Users can view own children" 
ON public.children 
FOR SELECT 
USING (
    parent_id IN (
        SELECT id FROM public.users 
        WHERE supabase_user_id = auth.uid()
    )
);

-- Users can only insert their own children
CREATE POLICY "Users can insert own children" 
ON public.children 
FOR INSERT 
WITH CHECK (
    parent_id IN (
        SELECT id FROM public.users 
        WHERE supabase_user_id = auth.uid()
    )
);

-- Users can only update their own children
CREATE POLICY "Users can update own children" 
ON public.children 
FOR UPDATE 
USING (
    parent_id IN (
        SELECT id FROM public.users 
        WHERE supabase_user_id = auth.uid()
    )
);

-- Users can only delete their own children
CREATE POLICY "Users can delete own children" 
ON public.children 
FOR DELETE 
USING (
    parent_id IN (
        SELECT id FROM public.users 
        WHERE supabase_user_id = auth.uid()
    )
);

-- ============================================================================
-- CONSENT_RECORDS TABLE POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own consent records" ON public.consent_records;
DROP POLICY IF EXISTS "Users can insert own consent records" ON public.consent_records;
DROP POLICY IF EXISTS "Users can update own consent records" ON public.consent_records;

-- Users can only view their own consent records
CREATE POLICY "Users can view own consent records" 
ON public.consent_records 
FOR SELECT 
USING (
    user_id IN (
        SELECT id FROM public.users 
        WHERE supabase_user_id = auth.uid()
    )
);

-- Users can only insert their own consent records
CREATE POLICY "Users can insert own consent records" 
ON public.consent_records 
FOR INSERT 
WITH CHECK (
    user_id IN (
        SELECT id FROM public.users 
        WHERE supabase_user_id = auth.uid()
    )
);

-- Users can only update their own consent records
CREATE POLICY "Users can update own consent records" 
ON public.consent_records 
FOR UPDATE 
USING (
    user_id IN (
        SELECT id FROM public.users 
        WHERE supabase_user_id = auth.uid()
    )
);

-- ============================================================================
-- CONSENT_AUDIT_LOGS TABLE POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own consent audit logs" ON public.consent_audit_logs;
DROP POLICY IF EXISTS "Users can insert own consent audit logs" ON public.consent_audit_logs;

-- Users can only view their own consent audit logs
CREATE POLICY "Users can view own consent audit logs" 
ON public.consent_audit_logs 
FOR SELECT 
USING (
    user_id IN (
        SELECT id FROM public.users 
        WHERE supabase_user_id = auth.uid()
    )
);

-- Users can only insert their own consent audit logs
CREATE POLICY "Users can insert own consent audit logs" 
ON public.consent_audit_logs 
FOR INSERT 
WITH CHECK (
    user_id IN (
        SELECT id FROM public.users 
        WHERE supabase_user_id = auth.uid()
    )
);

-- ============================================================================
-- ALEMBIC_VERSION TABLE POLICIES
-- ============================================================================

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Service role only" ON public.alembic_version;

-- Only service role can access alembic_version table
-- No user access needed for migration tracking
CREATE POLICY "Service role only" 
ON public.alembic_version 
FOR ALL 
USING (auth.role() = 'service_role');

-- ============================================================================
-- VERIFICATION AND LOGGING
-- ============================================================================

-- Log that RLS has been enabled
DO $$ 
BEGIN 
    RAISE NOTICE 'RLS Security Migration Applied Successfully';
    RAISE NOTICE 'All tables now have Row Level Security enabled';
    RAISE NOTICE 'User access is restricted to own records only';
END $$;