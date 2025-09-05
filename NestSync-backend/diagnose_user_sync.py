#!/usr/bin/env python3
"""
NestSync User Sync Diagnostic Script
Investigates specific user sync issues between Supabase Auth and backend database
"""

import os
import sys
import asyncio
import logging
from datetime import datetime, timezone
from supabase import create_client, Client
import asyncpg
from dotenv import load_dotenv

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Configuration
SUPABASE_URL = "https://huhkefkuamkeoxekzkuf.supabase.co"
SUPABASE_ANON_KEY = os.environ.get('SUPABASE_KEY', '')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY', '')
DATABASE_URL = os.environ.get('DATABASE_URL', '')

class UserSyncDiagnostic:
    def __init__(self):
        self.supabase_client = None
        self.admin_client = None
        
    def initialize_clients(self):
        """Initialize Supabase clients"""
        logger.info("Initializing clients...")
        
        if SUPABASE_ANON_KEY:
            self.supabase_client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
            logger.info("✓ Supabase client initialized")
        
        if SUPABASE_SERVICE_KEY:
            self.admin_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
            logger.info("✓ Admin client initialized")
    
    async def check_user_in_supabase_auth(self, email: str) -> dict:
        """Check if user exists in Supabase Auth"""
        try:
            logger.info(f"Checking Supabase Auth for user: {email}")
            
            if not self.admin_client:
                return {"error": "Admin client not available"}
            
            # Get all users from auth.users table
            auth_users_response = self.admin_client.auth.admin.list_users()
            
            target_user = None
            if hasattr(auth_users_response, 'users'):
                for user in auth_users_response.users:
                    if user.email == email:
                        target_user = user
                        break
            
            if target_user:
                logger.info(f"✓ User found in Supabase Auth")
                logger.info(f"  User ID: {target_user.id}")
                logger.info(f"  Email: {target_user.email}")
                logger.info(f"  Email confirmed: {'✓' if target_user.email_confirmed_at else '❌'}")
                logger.info(f"  Created at: {target_user.created_at}")
                logger.info(f"  Last sign in: {target_user.last_sign_in_at}")
                
                return {
                    "exists": True,
                    "user_id": target_user.id,
                    "email": target_user.email,
                    "email_confirmed": target_user.email_confirmed_at is not None,
                    "created_at": target_user.created_at,
                    "last_sign_in_at": target_user.last_sign_in_at,
                    "metadata": getattr(target_user, 'user_metadata', {})
                }
            else:
                logger.warning(f"❌ User not found in Supabase Auth")
                return {"exists": False}
                
        except Exception as e:
            logger.error(f"❌ Error checking Supabase Auth: {str(e)}")
            return {"error": str(e)}
    
    async def check_user_in_backend_db(self, email: str, supabase_user_id: str = None) -> dict:
        """Check if user exists in backend database"""
        try:
            logger.info(f"Checking backend database for user: {email}")
            
            if not DATABASE_URL:
                return {"error": "DATABASE_URL not configured"}
            
            # Connect to PostgreSQL - fix DSN format
            db_url = DATABASE_URL.replace('postgresql+asyncpg://', 'postgresql://')
            conn = await asyncpg.connect(db_url)
            
            try:
                # Query by email first
                query_email = """
                    SELECT id, email, supabase_user_id, status, email_verified, created_at, 
                           first_name, last_name, display_name
                    FROM users 
                    WHERE email = $1 AND is_deleted = false
                """
                result_email = await conn.fetchrow(query_email, email)
                
                # Query by supabase_user_id if provided
                result_supabase = None
                if supabase_user_id:
                    query_supabase = """
                        SELECT id, email, supabase_user_id, status, email_verified, created_at,
                               first_name, last_name, display_name
                        FROM users 
                        WHERE supabase_user_id = $1 AND is_deleted = false
                    """
                    result_supabase = await conn.fetchrow(query_supabase, supabase_user_id)
                
                if result_email or result_supabase:
                    # Use whichever result we found
                    result = result_email or result_supabase
                    
                    logger.info(f"✓ User found in backend database")
                    logger.info(f"  Backend ID: {result['id']}")
                    logger.info(f"  Email: {result['email']}")
                    logger.info(f"  Supabase User ID: {result['supabase_user_id']}")
                    logger.info(f"  Status: {result['status']}")
                    logger.info(f"  Email verified: {'✓' if result['email_verified'] else '❌'}")
                    logger.info(f"  Created at: {result['created_at']}")
                    logger.info(f"  Name: {result['first_name']} {result['last_name']} ({result['display_name']})")
                    
                    return {
                        "exists": True,
                        "id": str(result['id']),
                        "email": result['email'],
                        "supabase_user_id": str(result['supabase_user_id']) if result['supabase_user_id'] else None,
                        "status": result['status'],
                        "email_verified": result['email_verified'],
                        "created_at": result['created_at'],
                        "first_name": result['first_name'],
                        "last_name": result['last_name'],
                        "display_name": result['display_name']
                    }
                else:
                    logger.warning(f"❌ User not found in backend database")
                    return {"exists": False}
                    
            finally:
                await conn.close()
                
        except Exception as e:
            logger.error(f"❌ Error checking backend database: {str(e)}")
            return {"error": str(e)}
    
    async def diagnose_user_sync_issue(self, email: str) -> dict:
        """Comprehensive diagnosis of user sync issues"""
        logger.info(f"🔍 Starting user sync diagnosis for: {email}")
        logger.info("=" * 60)
        
        # Initialize clients
        self.initialize_clients()
        
        # Check Supabase Auth
        logger.info("\n1. Checking Supabase Auth...")
        supabase_result = await self.check_user_in_supabase_auth(email)
        
        # Check Backend Database
        logger.info("\n2. Checking Backend Database...")
        supabase_user_id = supabase_result.get("user_id") if supabase_result.get("exists") else None
        backend_result = await self.check_user_in_backend_db(email, supabase_user_id)
        
        # Analysis
        logger.info("\n3. Analysis...")
        diagnosis = {
            "email": email,
            "supabase_auth": supabase_result,
            "backend_db": backend_result,
            "sync_status": "unknown",
            "issues": [],
            "recommendations": []
        }
        
        # Determine sync status and issues
        supabase_exists = supabase_result.get("exists", False)
        backend_exists = backend_result.get("exists", False)
        
        if supabase_exists and backend_exists:
            # Check if IDs match
            supabase_id = supabase_result.get("user_id")
            backend_supabase_id = backend_result.get("supabase_user_id")
            
            if str(supabase_id) == str(backend_supabase_id):
                diagnosis["sync_status"] = "synced"
                logger.info("✅ User is properly synced between Supabase Auth and backend")
            else:
                diagnosis["sync_status"] = "id_mismatch"
                diagnosis["issues"].append("Supabase user ID mismatch between auth and backend records")
                diagnosis["recommendations"].append("Update backend record with correct supabase_user_id")
                logger.warning("⚠️  User exists in both systems but with mismatched IDs")
                
        elif supabase_exists and not backend_exists:
            diagnosis["sync_status"] = "orphaned_auth"
            diagnosis["issues"].append("User exists in Supabase Auth but not in backend database")
            diagnosis["recommendations"].append("Create backend user record from Supabase Auth data")
            logger.error("❌ User is orphaned in Supabase Auth (missing backend record)")
            
        elif not supabase_exists and backend_exists:
            diagnosis["sync_status"] = "orphaned_backend"
            diagnosis["issues"].append("User exists in backend database but not in Supabase Auth")
            diagnosis["recommendations"].append("This is unusual - investigate data consistency")
            logger.error("❌ User is orphaned in backend (missing auth record)")
            
        else:
            diagnosis["sync_status"] = "not_found"
            diagnosis["issues"].append("User not found in either system")
            diagnosis["recommendations"].append("User needs to complete registration process")
            logger.error("❌ User not found in either system")
        
        # Summary
        logger.info("\n" + "=" * 60)
        logger.info("📋 DIAGNOSIS SUMMARY")
        logger.info("=" * 60)
        logger.info(f"Email: {email}")
        logger.info(f"Sync Status: {diagnosis['sync_status']}")
        
        if diagnosis["issues"]:
            logger.info("\n🚨 Issues Found:")
            for issue in diagnosis["issues"]:
                logger.info(f"  • {issue}")
        
        if diagnosis["recommendations"]:
            logger.info("\n💡 Recommendations:")
            for rec in diagnosis["recommendations"]:
                logger.info(f"  • {rec}")
        
        return diagnosis

    async def list_all_users(self) -> dict:
        """List all users in both systems for comparison"""
        try:
            logger.info("📋 Listing all users in both systems...")
            
            # Get Supabase Auth users
            supabase_users = []
            if self.admin_client:
                try:
                    auth_response = self.admin_client.auth.admin.list_users()
                    if hasattr(auth_response, 'users'):
                        for user in auth_response.users:
                            supabase_users.append({
                                "id": user.id,
                                "email": user.email,
                                "email_confirmed": user.email_confirmed_at is not None,
                                "created_at": user.created_at,
                                "last_sign_in": user.last_sign_in_at
                            })
                except Exception as e:
                    logger.error(f"Error fetching Supabase users: {e}")
            
            # Get Backend users
            backend_users = []
            if DATABASE_URL:
                try:
                    db_url = DATABASE_URL.replace('postgresql+asyncpg://', 'postgresql://')
                    conn = await asyncpg.connect(db_url)
                    
                    query = """
                        SELECT id, email, supabase_user_id, status, email_verified, 
                               created_at, first_name, last_name, display_name
                        FROM users 
                        WHERE is_deleted = false
                        ORDER BY created_at DESC
                    """
                    
                    rows = await conn.fetch(query)
                    for row in rows:
                        backend_users.append({
                            "id": str(row['id']),
                            "email": row['email'],
                            "supabase_user_id": str(row['supabase_user_id']) if row['supabase_user_id'] else None,
                            "status": row['status'],
                            "email_verified": row['email_verified'],
                            "created_at": row['created_at'],
                            "name": f"{row['first_name']} {row['last_name']} ({row['display_name']})"
                        })
                    
                    await conn.close()
                    
                except Exception as e:
                    logger.error(f"Error fetching backend users: {e}")
            
            logger.info(f"\n📊 SUMMARY:")
            logger.info(f"Supabase Auth users: {len(supabase_users)}")
            logger.info(f"Backend database users: {len(backend_users)}")
            
            if supabase_users:
                logger.info(f"\n🔐 Supabase Auth Users:")
                for user in supabase_users:
                    logger.info(f"  • {user['email']} (ID: {user['id'][:8]}...)")
            
            if backend_users:
                logger.info(f"\n💾 Backend Database Users:")
                for user in backend_users:
                    logger.info(f"  • {user['email']} (Status: {user['status']}) - {user['name']}")
            
            return {
                "supabase_users": supabase_users,
                "backend_users": backend_users
            }
            
        except Exception as e:
            logger.error(f"Error listing users: {e}")
            return {"error": str(e)}

async def main():
    """Main entry point"""
    # Target user for investigation
    target_email = "andre_ero@yahoo.ca"
    
    diagnostic = UserSyncDiagnostic()
    
    # Initialize clients
    diagnostic.initialize_clients()
    
    # First, list all users to understand the current state
    logger.info("🌐 PHASE 1: Listing all users in both systems")
    all_users = await diagnostic.list_all_users()
    
    # Then investigate specific user
    logger.info(f"\n🔍 PHASE 2: Investigating specific user: {target_email}")
    result = await diagnostic.diagnose_user_sync_issue(target_email)
    
    return {
        "all_users": all_users,
        "target_diagnosis": result
    }

if __name__ == "__main__":
    # Run the diagnostic
    result = asyncio.run(main())