# 🛡️ Apply RLS Security Policies - Step by Step Guide

## URGENT: Critical Security Fix Required

Your Supabase project currently has **Row Level Security (RLS) disabled** on all public tables. This exposes your data to potential unauthorized access. Follow this guide to secure your database immediately.

## Method 1: Supabase Dashboard (Recommended - Immediate)

### Step 1: Access Supabase Dashboard
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Navigate to your project: `huhkefkuamkeoxekzkuf`

### Step 2: Apply Security Migration
1. Click **SQL Editor** in the left sidebar
2. Click **New Query**
3. Copy and paste the entire contents of: `supabase/migrations/20240905000001_enable_rls_security.sql`
4. Click **Run** to execute the migration
5. Verify success message: "RLS Security Migration Applied Successfully"

### Step 3: Verify RLS is Enabled
1. Go to **Database** → **Tables** in the sidebar
2. Check each table (`users`, `children`, `consent_records`, `consent_audit_logs`)
3. Confirm **RLS** column shows ✅ **Enabled** for each table

## Method 2: Supabase CLI (Advanced)

### Prerequisites
- Docker running
- Supabase CLI installed: `brew install supabase/tap/supabase`

### Step 1: Authenticate
```bash
# Set your access token (get from dashboard)
export SUPABASE_ACCESS_TOKEN="your_token_here"

# OR use interactive login in terminal
supabase login
```

### Step 2: Link Project
```bash
cd NestSync-backend
supabase link --project-ref huhkefkuamkeoxekzkuf
```

### Step 3: Deploy Migration
```bash
supabase db push
```

## Method 3: Direct SQL Execution

If you prefer to run SQL commands directly:

### Enable RLS on Tables
```sql
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alembic_version ENABLE ROW LEVEL SECURITY;
```

### Apply User Policies
```sql
-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (supabase_user_id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (supabase_user_id = auth.uid());
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (supabase_user_id = auth.uid());
```

*(Continue with remaining policies from the migration file)*

## 🔍 Verification Steps

After applying the security policies:

1. **Check RLS Status**:
   ```sql
   SELECT schemaname, tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' 
   AND rowsecurity = true;
   ```

2. **Test User Access**: Try accessing data from your app to ensure policies work correctly

3. **Monitor Logs**: Check for any policy violation errors

## 🚨 Important Notes

- **Apply this immediately** - your data is currently unprotected
- **Test thoroughly** after applying to ensure app functionality
- **Backup first** if you have critical data
- **Monitor authentication** for any issues after RLS is enabled

## 📞 Support

If you encounter issues:
1. Check Supabase logs for detailed error messages
2. Verify your authentication flow still works
3. Ensure `supabase_user_id` fields are properly populated

## Next Steps After RLS is Applied

1. **Test Sign-in Issues**: Debug authentication problems
2. **Configure Custom SMTP**: Prevent email bounce issues
3. **Monitor Security**: Regular security audits