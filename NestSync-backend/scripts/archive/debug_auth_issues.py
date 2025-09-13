#!/usr/bin/env python3
"""
NestSync Authentication Issues Debugger
Diagnoses common sign-in problems and provides solutions
"""

import json
import os
import sys
from datetime import datetime
import requests
from supabase import create_client, Client
from typing import Dict, Any, List

# Configuration
SUPABASE_URL = "https://huhkefkuamkeoxekzkuf.supabase.co"
SUPABASE_KEY = os.environ.get('SUPABASE_ANON_KEY', '')

def print_header(title: str):
    """Print formatted section header"""
    print(f"\n{'=' * 60}")
    print(f" {title}")
    print(f"{'=' * 60}")

def print_status(status: str, message: str):
    """Print status with color coding"""
    colors = {
        'SUCCESS': '\033[92m',  # Green
        'ERROR': '\033[91m',    # Red
        'WARNING': '\033[93m',  # Yellow
        'INFO': '\033[94m',     # Blue
    }
    end_color = '\033[0m'
    print(f"{colors.get(status, '')}{status}: {message}{end_color}")

def check_supabase_connection() -> bool:
    """Test connection to Supabase"""
    try:
        response = requests.get(f"{SUPABASE_URL}/rest/v1/", timeout=10)
        if response.status_code == 200:
            print_status('SUCCESS', 'Supabase connection established')
            return True
        else:
            print_status('ERROR', f'Supabase connection failed: {response.status_code}')
            return False
    except Exception as e:
        print_status('ERROR', f'Supabase connection error: {str(e)}')
        return False

def check_user_exists(email: str) -> Dict[str, Any]:
    """Check if user exists in Supabase auth"""
    try:
        # This would require service role key in production
        print_status('INFO', f'Checking user existence for: {email}')
        print_status('WARNING', 'Manual check required in Supabase Dashboard')
        print_status('INFO', 'Go to Authentication → Users in Supabase Dashboard')
        return {'status': 'manual_check_required', 'email': email}
    except Exception as e:
        print_status('ERROR', f'User check failed: {str(e)}')
        return {'status': 'error', 'error': str(e)}

def analyze_common_auth_issues(email: str = "tobe.chukwu.ubah@gmail.com") -> List[Dict[str, Any]]:
    """Analyze common authentication issues"""
    issues = []
    
    # Issue 1: Email confirmation
    issues.append({
        'issue': 'Email Not Confirmed',
        'description': 'User registered but never confirmed email',
        'check': 'Look for "Confirm your mail" email from Supabase',
        'solution': 'Click confirmation link in email, or manually confirm in Dashboard',
        'likelihood': 'HIGH - Most common cause of sign-in failures'
    })
    
    # Issue 2: RLS blocking authentication
    issues.append({
        'issue': 'RLS Policies Blocking Auth',
        'description': 'Row Level Security preventing access to user data',
        'check': 'Check if RLS is enabled but policies are incorrect',
        'solution': 'Apply proper RLS policies from migration file',
        'likelihood': 'HIGH - Your current issue based on earlier analysis'
    })
    
    # Issue 3: Password issues
    issues.append({
        'issue': 'Password Encoding Issues',
        'description': 'Password not matching due to encoding/hashing issues',
        'check': 'Try password reset instead of direct sign-in',
        'solution': 'Use "Forgot Password" flow to reset password',
        'likelihood': 'MEDIUM - Common with manual account creation'
    })
    
    # Issue 4: User table sync issues
    issues.append({
        'issue': 'User Table Sync Problem',
        'description': 'Supabase auth user exists but custom users table record missing',
        'check': 'Compare auth.users with public.users table',
        'solution': 'Ensure registration flow creates both auth and custom user records',
        'likelihood': 'MEDIUM - Integration issue'
    })
    
    # Issue 5: CORS/Network issues
    issues.append({
        'issue': 'Network/CORS Issues',
        'description': 'Client-side network connectivity problems',
        'check': 'Check browser network tab for failed requests',
        'solution': 'Verify Supabase URL and API keys in frontend',
        'likelihood': 'LOW - Usually shows different error'
    })
    
    return issues

def generate_debug_sql() -> str:
    """Generate SQL queries for debugging"""
    return '''
-- Debug SQL Queries for Authentication Issues
-- Run these in Supabase SQL Editor

-- 1. Check if RLS is enabled on tables
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN 'RLS ENABLED ✓'
        ELSE 'RLS DISABLED ⚠️'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- 2. Check auth users (requires service role)
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    last_sign_in_at,
    CASE 
        WHEN email_confirmed_at IS NOT NULL THEN 'CONFIRMED ✓'
        ELSE 'UNCONFIRMED ⚠️'
    END as email_status
FROM auth.users 
WHERE email = 'tobe.chukwu.ubah@gmail.com';

-- 3. Check custom users table
SELECT 
    id,
    email,
    supabase_user_id,
    email_verified,
    status,
    created_at
FROM public.users 
WHERE email = 'tobe.chukwu.ubah@gmail.com';

-- 4. Check for orphaned auth users (auth exists but no custom user record)
SELECT 
    au.id as auth_user_id,
    au.email,
    au.email_confirmed_at,
    pu.id as public_user_id,
    CASE 
        WHEN pu.id IS NULL THEN 'ORPHANED - NO PUBLIC RECORD ⚠️'
        ELSE 'LINKED PROPERLY ✓'
    END as sync_status
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.supabase_user_id
WHERE au.email = 'tobe.chukwu.ubah@gmail.com';

-- 5. List all RLS policies on users table
SELECT 
    policyname,
    tablename,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'users';
'''

def create_auth_fix_guide() -> str:
    """Create step-by-step fix guide"""
    return '''
🔧 AUTHENTICATION ISSUES - STEP BY STEP FIX GUIDE

1. IMMEDIATE ACTIONS (Do These First):
   
   a) Apply RLS Security Policies:
      - Go to Supabase Dashboard → SQL Editor
      - Run the migration: supabase/migrations/20240905000001_enable_rls_security.sql
      - Verify RLS shows ✓ Enabled on all tables
   
   b) Check Email Confirmation:
      - Go to Supabase Dashboard → Authentication → Users
      - Find user: tobe.chukwu.ubah@gmail.com
      - Check "Email Confirmed At" column
      - If empty: Click user → manually confirm email OR resend confirmation

2. PASSWORD RESET APPROACH (Recommended):
   
   Instead of using the original password, use the reset flow:
   a) In your app, click "Forgot Password"
   b) Enter: tobe.chukwu.ubah@gmail.com
   c) Check email for reset link
   d) Set new password through the link
   e) Try signing in with new password

3. MANUAL DATABASE CHECK:
   
   Run the debug SQL queries to identify specific issues:
   - Check if user exists in both auth.users and public.users
   - Verify RLS policies are properly applied
   - Look for orphaned records

4. IF STILL FAILING:
   
   a) Create a fresh test account:
      - Use a different email address
      - Complete full registration flow
      - Test sign-in immediately after confirmation
   
   b) Check GraphQL/API responses:
      - Open browser dev tools
      - Monitor network requests during sign-in
      - Look for specific error messages

5. PREVENTION MEASURES:
   
   a) Set up proper email delivery:
      - Configure custom SMTP (SendGrid, AWS SES)
      - This prevents bounce issues and improves deliverability
   
   b) Monitor authentication:
      - Set up logging for auth failures
      - Regular testing of complete auth flow

🎯 EXPECTED RESOLUTION ORDER:
1. Apply RLS policies → Fixes security blocking
2. Confirm email → Enables account access  
3. Reset password → Ensures valid credentials
4. Test sign-in → Verify everything works
'''

def main():
    """Main debugging function"""
    print_header("NestSync Authentication Issues Debugger")
    print(f"Timestamp: {datetime.now().isoformat()}")
    
    # Check Supabase connection
    print_header("1. CONNECTION TEST")
    connection_ok = check_supabase_connection()
    
    if not connection_ok:
        print_status('ERROR', 'Cannot proceed without Supabase connection')
        sys.exit(1)
    
    # Analyze common issues
    print_header("2. COMMON AUTHENTICATION ISSUES ANALYSIS")
    email = "tobe.chukwu.ubah@gmail.com"
    issues = analyze_common_auth_issues(email)
    
    for i, issue in enumerate(issues, 1):
        print(f"\n{i}. {issue['issue']} [{issue['likelihood']}]")
        print(f"   Description: {issue['description']}")
        print(f"   Check: {issue['check']}")
        print(f"   Solution: {issue['solution']}")
    
    # Generate debug SQL
    print_header("3. DEBUG SQL QUERIES")
    print("Copy these queries and run them in Supabase Dashboard → SQL Editor:")
    print(generate_debug_sql())
    
    # Create fix guide
    print_header("4. STEP-BY-STEP FIX GUIDE")
    print(create_auth_fix_guide())
    
    # Summary
    print_header("5. SUMMARY AND NEXT STEPS")
    print_status('INFO', 'Most likely causes for your sign-in issues:')
    print('1. Email not confirmed (check Supabase email)')
    print('2. RLS policies blocking access (apply security migration)')
    print('3. Password issues (use reset flow instead)')
    print('')
    print_status('SUCCESS', 'Debug analysis complete!')
    print('Follow the step-by-step guide above to resolve authentication issues.')

if __name__ == "__main__":
    main()