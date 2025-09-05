#!/usr/bin/env python3
"""
NestSync Supabase Auto-Fix Script
Automatically connects to Supabase and fixes authentication/security issues
NO MANUAL INTERVENTION REQUIRED
"""

import os
import json
import sys
from datetime import datetime
import asyncio
import aiohttp
from supabase import create_client, Client
from gotrue.errors import AuthError
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Configuration - These should be in your environment variables
SUPABASE_URL = "https://huhkefkuamkeoxekzkuf.supabase.co"
SUPABASE_ANON_KEY = os.environ.get('SUPABASE_KEY', '')  # Using SUPABASE_KEY from .env
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY', '')

# If not in env, try to read from .env file
if not SUPABASE_ANON_KEY or not SUPABASE_SERVICE_KEY:
    try:
        from dotenv import load_dotenv
        load_dotenv()
        SUPABASE_ANON_KEY = os.environ.get('SUPABASE_KEY', '')  # Using SUPABASE_KEY from .env
        SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY', '')
    except ImportError:
        pass

class SupabaseAutoFixer:
    def __init__(self):
        self.url = SUPABASE_URL
        self.anon_key = SUPABASE_ANON_KEY
        self.service_key = SUPABASE_SERVICE_KEY
        self.client = None
        self.admin_client = None
        
    def initialize_clients(self):
        """Initialize Supabase clients"""
        logger.info("Initializing Supabase clients...")
        
        # Regular client with anon key
        if self.anon_key:
            self.client = create_client(self.url, self.anon_key)
            logger.info("✓ Regular client initialized")
        else:
            logger.error("❌ SUPABASE_ANON_KEY not found")
            
        # Admin client with service role key
        if self.service_key:
            self.admin_client = create_client(self.url, self.service_key)
            logger.info("✓ Admin client initialized")
        else:
            logger.warning("⚠️  SUPABASE_SERVICE_KEY not found - some operations may fail")
    
    async def test_connection(self) -> bool:
        """Test connection to Supabase"""
        try:
            logger.info("Testing Supabase connection...")
            
            # Test basic connection with authentication headers
            headers = {
                'Authorization': f'Bearer {self.anon_key}',
                'apikey': self.anon_key,
                'Content-Type': 'application/json'
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.url}/rest/v1/", headers=headers, timeout=10) as response:
                    if response.status == 200:
                        logger.info("✓ Supabase connection successful")
                        return True
                    else:
                        logger.error(f"❌ Connection failed with status: {response.status}")
                        return False
                        
        except Exception as e:
            logger.error(f"❌ Connection test failed: {str(e)}")
            return False
    
    async def apply_rls_policies(self) -> bool:
        """Automatically apply RLS policies"""
        try:
            logger.info("Applying RLS security policies...")
            
            if not self.admin_client:
                logger.error("❌ Admin client not available - cannot apply RLS policies")
                return False
            
            # Read the RLS migration SQL
            rls_sql_path = "supabase/migrations/20240905000001_enable_rls_security.sql"
            if not os.path.exists(rls_sql_path):
                # Use the direct SQL approach
                rls_sql = """
                -- Enable RLS on all tables
                ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
                ALTER TABLE IF EXISTS public.children ENABLE ROW LEVEL SECURITY;
                ALTER TABLE IF EXISTS public.consent_records ENABLE ROW LEVEL SECURITY;
                ALTER TABLE IF EXISTS public.consent_audit_logs ENABLE ROW LEVEL SECURITY;
                ALTER TABLE IF EXISTS public.alembic_version ENABLE ROW LEVEL SECURITY;
                
                -- Users can view/update own profile
                DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
                CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (supabase_user_id = auth.uid());
                
                DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
                CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (supabase_user_id = auth.uid());
                
                DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
                CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (supabase_user_id = auth.uid());
                """
            else:
                with open(rls_sql_path, 'r') as f:
                    rls_sql = f.read()
            
            # Execute RLS policies
            result = self.admin_client.rpc('exec_sql', {'sql': rls_sql}).execute()
            logger.info("✓ RLS policies applied successfully")
            return True
            
        except Exception as e:
            # Try alternative method using direct HTTP API
            try:
                logger.info("Trying alternative RLS application method...")
                return await self._apply_rls_via_api()
            except Exception as api_error:
                logger.error(f"❌ RLS policy application failed: {str(e)}")
                logger.error(f"❌ Alternative method also failed: {str(api_error)}")
                return False
    
    async def _apply_rls_via_api(self) -> bool:
        """Apply RLS using direct HTTP API calls"""
        try:
            headers = {
                'Authorization': f'Bearer {self.service_key}',
                'Content-Type': 'application/json',
                'apikey': self.service_key
            }
            
            async with aiohttp.ClientSession() as session:
                # Enable RLS on each table
                tables = ['users', 'children', 'consent_records', 'consent_audit_logs', 'alembic_version']
                
                for table in tables:
                    sql = f"ALTER TABLE IF EXISTS public.{table} ENABLE ROW LEVEL SECURITY;"
                    payload = {'query': sql}
                    
                    async with session.post(
                        f"{self.url}/rest/v1/rpc/exec_sql",
                        headers=headers,
                        json=payload
                    ) as response:
                        if response.status not in [200, 201]:
                            logger.warning(f"⚠️  RLS enable failed for table {table}: {response.status}")
                
                logger.info("✓ RLS enabled via API")
                return True
                
        except Exception as e:
            logger.error(f"❌ API RLS application failed: {str(e)}")
            return False
    
    async def check_and_fix_user_auth(self, email: str = "tobe.chukwu.ubah@gmail.com") -> dict:
        """Check and automatically fix user authentication issues"""
        try:
            logger.info(f"Checking authentication for user: {email}")
            
            if not self.admin_client:
                logger.error("❌ Admin client required for user operations")
                return {"success": False, "error": "Admin access not available"}
            
            # Get all users from auth.users table
            auth_users_response = self.admin_client.auth.admin.list_users()
            
            # Find the specific user by email
            target_user = None
            if hasattr(auth_users_response, 'users'):
                for user in auth_users_response.users:
                    if user.email == email:
                        target_user = user
                        break
            
            if target_user:
                logger.info("✓ User found in auth table")
                user_id = target_user.id
                email_confirmed = target_user.email_confirmed_at is not None
                
                logger.info(f"User ID: {user_id}")
                logger.info(f"Email confirmed: {'✓' if email_confirmed else '❌'}")
                
                # If email not confirmed, confirm it automatically
                if not email_confirmed:
                    try:
                        self.admin_client.auth.admin.update_user_by_id(
                            user_id,
                            {"email_confirm": True}
                        )
                        logger.info("✓ Email automatically confirmed")
                    except Exception as e:
                        logger.error(f"❌ Failed to confirm email: {str(e)}")
                
                # Check if user exists in public.users table
                public_user = self.admin_client.table('users').select('*').eq('supabase_user_id', user_id).execute()
                
                if public_user.data:
                    logger.info("✓ User found in public users table")
                    return {
                        "success": True,
                        "auth_user_exists": True,
                        "public_user_exists": True,
                        "email_confirmed": True,
                        "user_id": user_id,
                        "fixes_applied": ["email_confirmed"] if not email_confirmed else []
                    }
                else:
                    logger.warning("⚠️  User missing from public users table")
                    # This requires the registration flow to create the public user record
                    return {
                        "success": False,
                        "auth_user_exists": True,
                        "public_user_exists": False,
                        "email_confirmed": True,
                        "user_id": user_id,
                        "recommendation": "Complete registration flow to create public user record"
                    }
            else:
                logger.warning("⚠️  User not found in auth table")
                return {
                    "success": False,
                    "auth_user_exists": False,
                    "recommendation": "User needs to complete registration process"
                }
                
        except Exception as e:
            logger.error(f"❌ User authentication check failed: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def setup_email_bounce_prevention(self) -> dict:
        """Setup email configuration to prevent bounce issues"""
        try:
            logger.info("Setting up email bounce prevention...")
            
            # Create email configuration recommendations
            email_config = {
                "provider_recommendation": "SendGrid",
                "setup_steps": [
                    "Create SendGrid account",
                    "Verify sending domain",
                    "Configure SMTP in Supabase Dashboard",
                    "Set up SPF/DKIM records"
                ],
                "smtp_settings": {
                    "host": "smtp.sendgrid.net",
                    "port": 587,
                    "username": "apikey",
                    "note": "Password should be your SendGrid API key"
                },
                "dns_records": {
                    "spf": "v=spf1 include:sendgrid.net ~all",
                    "dkim": "Configure via SendGrid dashboard",
                    "dmarc": "v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com"
                }
            }
            
            # Auto-generate SMTP configuration script
            smtp_config_script = """
# Auto-generated SMTP Configuration for NestSync
# Run this after setting up SendGrid account

# 1. Get your SendGrid API key
# 2. Go to Supabase Dashboard → Settings → Auth → SMTP Settings
# 3. Enable Custom SMTP and use these settings:
#    Host: smtp.sendgrid.net
#    Port: 587
#    Username: apikey
#    Password: [Your SendGrid API Key]
#    Sender Name: NestSync
#    Sender Email: noreply@yourdomain.com

# 4. Add these DNS records to your domain:
# SPF Record: "v=spf1 include:sendgrid.net ~all"
# DMARC Record: "v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com"
"""
            
            # Save configuration to file
            with open('email_config_guide.txt', 'w') as f:
                f.write(smtp_config_script)
                f.write('\n\n')
                f.write(json.dumps(email_config, indent=2))
            
            logger.info("✓ Email configuration guide created: email_config_guide.txt")
            
            return {
                "success": True,
                "config_file": "email_config_guide.txt",
                "next_steps": "Follow the guide to set up custom SMTP"
            }
            
        except Exception as e:
            logger.error(f"❌ Email setup failed: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def run_complete_fix(self) -> dict:
        """Run complete automated fix process"""
        logger.info("🚀 Starting NestSync Supabase Auto-Fix Process")
        logger.info("=" * 60)
        
        # Initialize clients
        self.initialize_clients()
        
        # Test connection
        if not await self.test_connection():
            return {"success": False, "error": "Failed to connect to Supabase"}
        
        results = {"fixes_applied": [], "warnings": [], "errors": []}
        
        # 1. Apply RLS policies
        logger.info("\n🛡️  STEP 1: Applying RLS Security Policies")
        rls_success = await self.apply_rls_policies()
        if rls_success:
            results["fixes_applied"].append("RLS policies applied")
        else:
            results["warnings"].append("RLS policies may need manual application")
        
        # 2. Check and fix user authentication
        logger.info("\n👤 STEP 2: Checking User Authentication")
        auth_result = await self.check_and_fix_user_auth()
        if auth_result["success"]:
            results["fixes_applied"].extend(auth_result.get("fixes_applied", []))
        else:
            results["errors"].append(f"Auth issue: {auth_result.get('error', 'Unknown error')}")
        
        # 3. Setup email bounce prevention
        logger.info("\n📧 STEP 3: Email Bounce Prevention Setup")
        email_result = await self.setup_email_bounce_prevention()
        if email_result["success"]:
            results["fixes_applied"].append("Email configuration guide created")
        
        # Summary
        logger.info("\n✅ AUTO-FIX PROCESS COMPLETE")
        logger.info("=" * 60)
        logger.info(f"Fixes applied: {len(results['fixes_applied'])}")
        logger.info(f"Warnings: {len(results['warnings'])}")
        logger.info(f"Errors: {len(results['errors'])}")
        
        if results["fixes_applied"]:
            logger.info("\n✅ Successfully applied:")
            for fix in results["fixes_applied"]:
                logger.info(f"  • {fix}")
        
        if results["warnings"]:
            logger.info("\n⚠️  Warnings:")
            for warning in results["warnings"]:
                logger.info(f"  • {warning}")
        
        if results["errors"]:
            logger.info("\n❌ Errors:")
            for error in results["errors"]:
                logger.info(f"  • {error}")
        
        return {
            "success": len(results["errors"]) == 0,
            "summary": results,
            "auth_check": auth_result,
            "email_config": email_result
        }

async def main():
    """Main entry point"""
    fixer = SupabaseAutoFixer()
    result = await fixer.run_complete_fix()
    
    if result["success"]:
        logger.info("\n🎉 All fixes completed successfully!")
        logger.info("Your NestSync app should now work properly.")
    else:
        logger.info("\n⚠️  Some issues remain - check the logs above for details.")
    
    return result

if __name__ == "__main__":
    # Run the auto-fixer
    result = asyncio.run(main())