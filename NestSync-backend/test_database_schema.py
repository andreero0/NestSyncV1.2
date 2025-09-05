#!/usr/bin/env python3
"""
Database Schema Validation Test
Validates database connectivity, table structure, and PIPEDA compliance fields
"""

import asyncio
import sys
import os
from sqlalchemy import inspect, text
from sqlalchemy.exc import OperationalError

# Add the app directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.config.database import init_database, get_async_session, get_sync_session
from app.models.user import User
from app.models.child import Child
from app.models.consent import ConsentRecord, ConsentAuditLog

async def test_database_connectivity():
    """Test basic database connectivity"""
    print("🔌 Testing Database Connectivity...")
    
    try:
        await init_database()
        print("✅ Database initialization successful")
        
        # Test async connection
        async for session in get_async_session():
            result = await session.execute(text("SELECT 1 as test"))
            test_value = result.scalar()
            assert test_value == 1
            print("✅ Async database connection working")
            break
        
        # Test sync connection
        with get_sync_session() as session:
            result = session.execute(text("SELECT 1 as test"))
            test_value = result.scalar()
            assert test_value == 1
            print("✅ Sync database connection working")
        
        return True
        
    except Exception as e:
        print(f"❌ Database connectivity test failed: {e}")
        return False

async def test_table_existence():
    """Test that all required tables exist"""
    print("\n📋 Testing Table Existence...")
    
    expected_tables = [
        'users',
        'children', 
        'consent_records',
        'consent_audit_logs',
        'alembic_version'
    ]
    
    try:
        with get_sync_session() as session:
            inspector = inspect(session.bind)
            existing_tables = inspector.get_table_names()
            
            print(f"📊 Found tables: {existing_tables}")
            
            missing_tables = []
            for table in expected_tables:
                if table in existing_tables:
                    print(f"✅ Table '{table}' exists")
                else:
                    print(f"❌ Table '{table}' missing")
                    missing_tables.append(table)
            
            if missing_tables:
                print(f"❌ Missing tables: {missing_tables}")
                return False
            
            print("✅ All expected tables exist")
            return True
            
    except Exception as e:
        print(f"❌ Table existence test failed: {e}")
        return False

async def test_user_table_structure():
    """Test user table structure and PIPEDA compliance fields"""
    print("\n👤 Testing User Table Structure...")
    
    try:
        with get_sync_session() as session:
            inspector = inspect(session.bind)
            columns = inspector.get_columns('users')
            column_names = [col['name'] for col in columns]
            
            # Required PIPEDA compliance fields
            pipeda_fields = [
                'id', 'email', 'created_at', 'updated_at', 'deleted_at',
                'privacy_policy_accepted', 'privacy_policy_accepted_at',
                'terms_of_service_accepted', 'terms_of_service_accepted_at',
                'marketing_consent', 'analytics_consent', 'data_sharing_consent',
                'data_export_requested', 'data_export_requested_at',
                'data_deletion_requested', 'data_deletion_requested_at',
                'province', 'timezone', 'consent_granted_at', 'consent_withdrawn_at'
            ]
            
            print(f"📊 User table columns: {len(column_names)} columns found")
            
            missing_fields = []
            for field in pipeda_fields:
                if field in column_names:
                    print(f"✅ PIPEDA field '{field}' exists")
                else:
                    print(f"❌ PIPEDA field '{field}' missing")
                    missing_fields.append(field)
            
            if missing_fields:
                print(f"❌ Missing PIPEDA fields: {missing_fields}")
                return False
            
            print("✅ All PIPEDA compliance fields present in users table")
            return True
            
    except Exception as e:
        print(f"❌ User table structure test failed: {e}")
        return False

async def test_consent_table_structure():
    """Test consent tracking table structure"""
    print("\n📝 Testing Consent Table Structure...")
    
    try:
        with get_sync_session() as session:
            inspector = inspect(session.bind)
            
            # Test consent_records table
            consent_columns = inspector.get_columns('consent_records')
            consent_column_names = [col['name'] for col in consent_columns]
            
            required_consent_fields = [
                'id', 'user_id', 'consent_type', 'status', 'consent_version',
                'granted_at', 'withdrawn_at', 'ip_address', 'user_agent',
                'purpose', 'legal_basis', 'jurisdiction', 'province'
            ]
            
            print(f"📊 Consent records table: {len(consent_column_names)} columns found")
            
            missing_consent_fields = []
            for field in required_consent_fields:
                if field in consent_column_names:
                    print(f"✅ Consent field '{field}' exists")
                else:
                    print(f"❌ Consent field '{field}' missing")
                    missing_consent_fields.append(field)
            
            # Test consent_audit_logs table
            audit_columns = inspector.get_columns('consent_audit_logs')
            audit_column_names = [col['name'] for col in audit_columns]
            
            required_audit_fields = [
                'id', 'consent_record_id', 'user_id', 'action', 
                'previous_status', 'new_status', 'ip_address', 'created_at'
            ]
            
            print(f"📊 Consent audit table: {len(audit_column_names)} columns found")
            
            missing_audit_fields = []
            for field in required_audit_fields:
                if field in audit_column_names:
                    print(f"✅ Audit field '{field}' exists")
                else:
                    print(f"❌ Audit field '{field}' missing")
                    missing_audit_fields.append(field)
            
            if missing_consent_fields or missing_audit_fields:
                print(f"❌ Missing consent fields: {missing_consent_fields}")
                print(f"❌ Missing audit fields: {missing_audit_fields}")
                return False
            
            print("✅ All consent tracking fields present")
            return True
            
    except Exception as e:
        print(f"❌ Consent table structure test failed: {e}")
        return False

async def test_foreign_key_constraints():
    """Test foreign key relationships"""
    print("\n🔗 Testing Foreign Key Constraints...")
    
    try:
        with get_sync_session() as session:
            inspector = inspect(session.bind)
            
            # Test consent_records -> users foreign key
            consent_fks = inspector.get_foreign_keys('consent_records')
            user_fk_exists = any(
                fk['referred_table'] == 'users' and 'user_id' in fk['constrained_columns']
                for fk in consent_fks
            )
            
            if user_fk_exists:
                print("✅ consent_records -> users foreign key exists")
            else:
                print("❌ consent_records -> users foreign key missing")
                return False
            
            # Test consent_audit_logs foreign keys
            audit_fks = inspector.get_foreign_keys('consent_audit_logs')
            consent_fk_exists = any(
                fk['referred_table'] == 'consent_records'
                for fk in audit_fks
            )
            user_audit_fk_exists = any(
                fk['referred_table'] == 'users'
                for fk in audit_fks
            )
            
            if consent_fk_exists:
                print("✅ consent_audit_logs -> consent_records foreign key exists")
            else:
                print("❌ consent_audit_logs -> consent_records foreign key missing")
                
            if user_audit_fk_exists:
                print("✅ consent_audit_logs -> users foreign key exists")
            else:
                print("❌ consent_audit_logs -> users foreign key missing")
            
            return user_fk_exists and consent_fk_exists and user_audit_fk_exists
            
    except Exception as e:
        print(f"❌ Foreign key constraint test failed: {e}")
        return False

async def test_canadian_compliance_settings():
    """Test Canadian-specific compliance settings"""
    print("\n🍁 Testing Canadian Compliance Settings...")
    
    try:
        with get_sync_session() as session:
            # Test timezone setting
            result = await session.execute(text("SHOW timezone"))
            timezone = result.scalar()
            print(f"📍 Database timezone: {timezone}")
            
            if 'America' in timezone or 'Canada' in timezone:
                print("✅ Canadian timezone configured")
            else:
                print("⚠️  Non-Canadian timezone detected")
            
            # Test connection encoding
            result = await session.execute(text("SHOW client_encoding"))
            encoding = result.scalar()
            print(f"🔤 Database encoding: {encoding}")
            
            if encoding.upper() == 'UTF8':
                print("✅ UTF-8 encoding configured")
            else:
                print("⚠️  Non-UTF8 encoding detected")
            
            return True
            
    except Exception as e:
        print(f"❌ Canadian compliance test failed: {e}")
        return False

async def test_data_retention_compliance():
    """Test data retention compliance features"""
    print("\n🗓️ Testing Data Retention Compliance...")
    
    try:
        with get_sync_session() as session:
            inspector = inspect(session.bind)
            
            # Check for soft delete fields
            user_columns = inspector.get_columns('users')
            user_column_names = [col['name'] for col in user_columns]
            
            retention_fields = ['deleted_at', 'data_retention_until']
            present_fields = []
            
            for field in retention_fields:
                if field in user_column_names:
                    present_fields.append(field)
                    print(f"✅ Retention field '{field}' exists")
                else:
                    print(f"⚠️  Retention field '{field}' not found")
            
            if present_fields:
                print("✅ Data retention mechanisms present")
                return True
            else:
                print("❌ No data retention mechanisms found")
                return False
            
    except Exception as e:
        print(f"❌ Data retention test failed: {e}")
        return False

async def run_all_tests():
    """Run all database validation tests"""
    print("🚀 Starting NestSync Database Schema Validation Tests\n")
    
    tests = [
        ("Database Connectivity", test_database_connectivity),
        ("Table Existence", test_table_existence),
        ("User Table Structure", test_user_table_structure),
        ("Consent Table Structure", test_consent_table_structure),
        ("Foreign Key Constraints", test_foreign_key_constraints),
        ("Canadian Compliance Settings", test_canadian_compliance_settings),
        ("Data Retention Compliance", test_data_retention_compliance),
    ]
    
    results = {}
    
    for test_name, test_func in tests:
        try:
            result = await test_func()
            results[test_name] = result
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {e}")
            results[test_name] = False
    
    # Summary
    print("\n" + "="*60)
    print("📊 TEST RESULTS SUMMARY")
    print("="*60)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} | {test_name}")
        if result:
            passed += 1
    
    print(f"\n🏆 Overall Score: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All database validation tests PASSED!")
        print("✅ NestSync backend database is ready for production")
        return True
    else:
        print("⚠️  Some tests failed - review issues above")
        return False

if __name__ == "__main__":
    # Run the tests
    success = asyncio.run(run_all_tests())
    sys.exit(0 if success else 1)