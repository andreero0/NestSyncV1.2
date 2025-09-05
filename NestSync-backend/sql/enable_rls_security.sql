-- ============================================================================
-- CRITICAL SECURITY FIX: Enable Row Level Security (RLS) on all public tables
-- This script fixes the security vulnerability identified by Supabase
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alembic_version ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USERS TABLE POLICIES
-- ============================================================================

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

-- Only service role can access alembic_version table
-- No user access needed for migration tracking
CREATE POLICY "Service role only" 
ON public.alembic_version 
FOR ALL 
USING (auth.role() = 'service_role');

-- ============================================================================
-- ADDITIONAL SECURITY RECOMMENDATIONS
-- ============================================================================

-- 1. Enable Multi-Factor Authentication (MFA) in Supabase Dashboard
-- 2. Enable Leaked Password Protection in Auth settings
-- 3. Review and remove unused indexes for better performance
-- 4. Consider implementing rate limiting for API calls

-- To apply this script:
-- 1. Go to Supabase Dashboard
-- 2. Navigate to SQL Editor
-- 3. Paste this script and run it
-- 4. Verify RLS is enabled in Database > Tables section