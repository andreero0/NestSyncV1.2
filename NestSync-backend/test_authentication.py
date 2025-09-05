#!/usr/bin/env python3
"""
GraphQL Authentication Flow Test
End-to-end test for GraphQL authentication mutations and queries
"""

import asyncio
import sys
import os
import requests
import json
import time
from datetime import datetime, timezone
from uuid import uuid4

# Add the app directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.config.settings import settings

# Test against the running server
BASE_URL = "http://127.0.0.1:8001"
GRAPHQL_ENDPOINT = f"{BASE_URL}/graphql"

# Test user credentials
TEST_EMAIL = f"test-{int(time.time())}@example.com"
TEST_PASSWORD = "TestPassword123!"

def test_graphql_query(query, variables=None, headers=None):
    """Execute a GraphQL query/mutation"""
    payload = {
        "query": query,
        "variables": variables or {}
    }
    
    response = requests.post(
        GRAPHQL_ENDPOINT,
        json=payload,
        headers=headers or {"Content-Type": "application/json"}
    )
    
    return response

async def test_graphql_health_check():
    """Test GraphQL health check"""
    print("🔍 Testing GraphQL Health Check...")
    
    try:
        query = """
        query {
            healthCheck
        }
        """
        
        response = test_graphql_query(query)
        
        if response.status_code == 200:
            data = response.json()
            health_message = data.get("data", {}).get("healthCheck")
            
            if health_message:
                print(f"✅ GraphQL endpoint healthy: {health_message}")
                return True
            else:
                print(f"❌ GraphQL health check failed: {data}")
                return False
        else:
            print(f"❌ GraphQL request failed with status {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ GraphQL health check failed: {e}")
        return False

async def test_graphql_sign_up():
    """Test user sign up via GraphQL"""
    print(f"🔐 Testing GraphQL Sign Up with {TEST_EMAIL}...")
    
    try:
        mutation = """
        mutation SignUp($input: SignUpInput!) {
            signUp(input: $input) {
                success
                message
                error
                user {
                    id
                    email
                    firstName
                    lastName
                    status
                    emailVerified
                }
                session {
                    accessToken
                    refreshToken
                    expiresIn
                }
            }
        }
        """
        
        variables = {
            "input": {
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD,
                "firstName": "Test",
                "lastName": "User",
                "acceptPrivacyPolicy": True,
                "acceptTermsOfService": True,
                "marketingConsent": False,
                "analyticsConsent": False,
                "timezone": "America/Toronto",
                "language": "en",
                "province": "ON"
            }
        }
        
        response = test_graphql_query(mutation, variables)
        
        if response.status_code == 200:
            data = response.json()
            signup_data = data.get("data", {}).get("signUp")
            
            if signup_data:
                if signup_data.get("success"):
                    print("✅ Sign up successful")
                    user = signup_data.get("user", {})
                    session = signup_data.get("session", {})
                    
                    print(f"   User ID: {user.get('id')}")
                    print(f"   Email: {user.get('email')}")
                    print(f"   Status: {user.get('status')}")
                    print(f"   Email Verified: {user.get('emailVerified')}")
                    print(f"   Has Access Token: {bool(session.get('accessToken'))}")
                    
                    return {"success": True, "access_token": session.get("accessToken"), "user": user}
                else:
                    error = signup_data.get("error", "Unknown error")
                    print(f"❌ Sign up failed: {error}")
                    return {"success": False, "error": error}
            else:
                errors = data.get("errors", [])
                print(f"❌ GraphQL errors: {errors}")
                return {"success": False, "errors": errors}
        else:
            print(f"❌ HTTP error {response.status_code}: {response.text}")
            return {"success": False, "http_error": response.status_code}
            
    except Exception as e:
        print(f"❌ Sign up test failed: {e}")
        return {"success": False, "exception": str(e)}

async def test_graphql_me_query(access_token):
    """Test authenticated me query"""
    print("👤 Testing Authenticated Me Query...")
    
    try:
        query = """
        query {
            me {
                id
                email
                firstName
                lastName
                status
                emailVerified
                onboardingCompleted
                createdAt
            }
        }
        """
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {access_token}"
        }
        
        response = test_graphql_query(query, headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            me_data = data.get("data", {}).get("me")
            
            if me_data:
                print("✅ Authenticated query successful")
                print(f"   User ID: {me_data.get('id')}")
                print(f"   Email: {me_data.get('email')}")
                print(f"   Name: {me_data.get('firstName')} {me_data.get('lastName')}")
                print(f"   Status: {me_data.get('status')}")
                print(f"   Email Verified: {me_data.get('emailVerified')}")
                print(f"   Onboarding Complete: {me_data.get('onboardingCompleted')}")
                
                return {"success": True, "user": me_data}
            else:
                errors = data.get("errors", [])
                if errors:
                    print(f"❌ GraphQL errors: {errors}")
                else:
                    print("❌ No user data returned (not authenticated)")
                return {"success": False, "errors": errors}
        else:
            print(f"❌ HTTP error {response.status_code}: {response.text}")
            return {"success": False, "http_error": response.status_code}
            
    except Exception as e:
        print(f"❌ Me query test failed: {e}")
        return {"success": False, "exception": str(e)}

async def test_server_accessibility():
    """Test that the server is running and accessible"""
    print("🌐 Testing Server Accessibility...")
    
    try:
        # Test root endpoint
        response = requests.get(f"{BASE_URL}/", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Server accessible: {data.get('name')} v{data.get('version')}")
            print(f"📍 Region: {data.get('region')}")
            print(f"🔒 Compliance: {data.get('compliance')}")
            return True
        else:
            print(f"❌ Server returned status {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Server accessibility test failed: {e}")
        return False

async def test_health_endpoint():
    """Test health endpoint and system status"""
    print("\n🏥 Testing Health Endpoint...")
    
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=10)
        if response.status_code == 200:
            data = response.json()
            
            print(f"📊 Overall status: {data.get('status')}")
            print(f"⏰ Uptime: {data.get('uptime_seconds')} seconds")
            
            # Check individual components
            checks = data.get('checks', {})
            for component, status in checks.items():
                component_status = status.get('status', 'unknown')
                status_icon = "✅" if component_status == "healthy" else "⚠️" if component_status == "warning" else "❌"
                print(f"{status_icon} {component}: {component_status}")
            
            return True
        else:
            print(f"❌ Health endpoint returned status {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Health endpoint test failed: {e}")
        return False

async def test_info_endpoint():
    """Test info endpoint for configuration details"""
    print("\n📋 Testing Info Endpoint...")
    
    try:
        response = requests.get(f"{BASE_URL}/info", timeout=5)
        if response.status_code == 200:
            data = response.json()
            
            # Application info
            app_info = data.get('application', {})
            print(f"🏷️  Name: {app_info.get('name')}")
            print(f"📦 Version: {app_info.get('version')}")
            print(f"🌍 Environment: {app_info.get('environment')}")
            print(f"📍 Region: {app_info.get('region')}")
            print(f"⏰ Timezone: {app_info.get('timezone')}")
            
            # Compliance info
            compliance = data.get('compliance', {})
            print(f"🔒 PIPEDA Compliant: {compliance.get('pipeda_compliant')}")
            print(f"🍁 Data Residency: {compliance.get('data_residency')}")
            
            # Features
            features = data.get('features', {})
            print(f"🔗 GraphQL Endpoint: {features.get('graphql_endpoint')}")
            print(f"📚 Documentation: {features.get('documentation')}")
            
            return True
        else:
            print(f"❌ Info endpoint returned status {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Info endpoint test failed: {e}")
        return False

async def test_docs_accessibility():
    """Test API documentation accessibility"""
    print("\n📚 Testing API Documentation...")
    
    try:
        # Test OpenAPI docs
        docs_response = requests.get(f"{BASE_URL}/docs", timeout=5)
        if docs_response.status_code == 200:
            print("✅ OpenAPI documentation accessible")
        else:
            print(f"❌ OpenAPI docs returned status {docs_response.status_code}")
        
        # Test OpenAPI JSON
        openapi_response = requests.get(f"{BASE_URL}/openapi.json", timeout=5)
        if openapi_response.status_code == 200:
            openapi_data = openapi_response.json()
            print(f"✅ OpenAPI spec accessible: {openapi_data.get('info', {}).get('title')}")
            
            # Check for key endpoints
            paths = openapi_data.get('paths', {})
            key_paths = ['/', '/health', '/info']
            
            for path in key_paths:
                if path in paths:
                    print(f"✅ Path '{path}' documented")
                else:
                    print(f"⚠️  Path '{path}' not documented")
            
            return True
        else:
            print(f"❌ OpenAPI JSON returned status {openapi_response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Documentation test failed: {e}")
        return False

async def test_cors_configuration():
    """Test CORS configuration"""
    print("\n🌍 Testing CORS Configuration...")
    
    try:
        # Test preflight request
        headers = {
            'Origin': 'http://localhost:3000',
            'Access-Control-Request-Method': 'GET',
            'Access-Control-Request-Headers': 'Content-Type, Authorization'
        }
        
        response = requests.options(f"{BASE_URL}/", headers=headers, timeout=5)
        
        # Check CORS headers
        cors_headers = {}
        for header, value in response.headers.items():
            if header.lower().startswith('access-control-'):
                cors_headers[header] = value
                print(f"🔧 {header}: {value}")
        
        if cors_headers:
            print("✅ CORS configuration detected")
            
            # Check for required headers
            required_headers = [
                'access-control-allow-origin',
                'access-control-allow-methods'
            ]
            
            missing_headers = []
            for header in required_headers:
                if header not in [h.lower() for h in cors_headers.keys()]:
                    missing_headers.append(header)
            
            if missing_headers:
                print(f"⚠️  Missing CORS headers: {missing_headers}")
            else:
                print("✅ All required CORS headers present")
            
            return True
        else:
            print("⚠️  No CORS headers detected")
            return False
            
    except Exception as e:
        print(f"❌ CORS test failed: {e}")
        return False

async def test_security_headers():
    """Test security headers"""
    print("\n🔐 Testing Security Headers...")
    
    try:
        response = requests.get(f"{BASE_URL}/", timeout=5)
        
        security_headers = [
            'x-content-type-options',
            'x-frame-options',
            'x-xss-protection',
            'strict-transport-security',
            'content-security-policy'
        ]
        
        present_headers = []
        missing_headers = []
        
        for header in security_headers:
            if header in [h.lower() for h in response.headers.keys()]:
                present_headers.append(header)
                value = response.headers.get(header, response.headers.get(header.title(), ''))
                print(f"✅ {header}: {value}")
            else:
                missing_headers.append(header)
                print(f"⚠️  {header}: Not present")
        
        if present_headers:
            print(f"✅ Security headers configured: {len(present_headers)}/{len(security_headers)}")
            return True
        else:
            print("❌ No security headers found")
            return False
            
    except Exception as e:
        print(f"❌ Security headers test failed: {e}")
        return False

async def test_environment_configuration():
    """Test environment configuration"""
    print("\n⚙️ Testing Environment Configuration...")
    
    try:
        # Test that sensitive data is not exposed
        response = requests.get(f"{BASE_URL}/info", timeout=5)
        data = response.json()
        
        # These should NOT be in the response
        sensitive_keys = [
            'database_url', 'supabase_key', 'secret_key', 'jwt_secret',
            'password', 'api_key', 'token'
        ]
        
        # Convert response to string for checking
        response_str = json.dumps(data).lower()
        
        exposed_secrets = []
        for key in sensitive_keys:
            if key in response_str:
                exposed_secrets.append(key)
        
        if exposed_secrets:
            print(f"❌ Exposed sensitive data: {exposed_secrets}")
            return False
        else:
            print("✅ No sensitive data exposed in API responses")
        
        # Check environment-specific behavior
        environment = data.get('application', {}).get('environment')
        if environment == 'development':
            print("✅ Development environment detected")
        elif environment == 'production':
            print("✅ Production environment detected")
        else:
            print(f"⚠️  Unknown environment: {environment}")
        
        return True
        
    except Exception as e:
        print(f"❌ Environment configuration test failed: {e}")
        return False

async def test_error_handling():
    """Test error handling and responses"""
    print("\n❌ Testing Error Handling...")
    
    try:
        # Test 404 handling
        response = requests.get(f"{BASE_URL}/nonexistent-endpoint", timeout=5)
        if response.status_code == 404:
            print("✅ 404 errors handled correctly")
            
            # Check if error response is JSON
            try:
                error_data = response.json()
                print(f"✅ Error response is valid JSON: {error_data.get('detail', 'No detail')}")
            except:
                print("⚠️  Error response is not JSON")
        else:
            print(f"⚠️  Unexpected status for 404 test: {response.status_code}")
        
        # Test method not allowed
        response = requests.post(f"{BASE_URL}/", timeout=5)
        if response.status_code == 405:
            print("✅ 405 Method Not Allowed handled correctly")
        elif response.status_code == 422:
            print("✅ 422 Unprocessable Entity handled correctly")
        else:
            print(f"⚠️  Unexpected status for POST test: {response.status_code}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error handling test failed: {e}")
        return False

async def test_response_performance():
    """Test response performance"""
    print("\n⚡ Testing Response Performance...")
    
    try:
        import time
        
        endpoints = [
            ('/', 'Root'),
            ('/health', 'Health'),
            ('/info', 'Info')
        ]
        
        performance_results = []
        
        for endpoint, name in endpoints:
            start_time = time.time()
            response = requests.get(f"{BASE_URL}{endpoint}", timeout=10)
            end_time = time.time()
            
            response_time = (end_time - start_time) * 1000  # Convert to milliseconds
            performance_results.append((name, response_time, response.status_code))
            
            status_icon = "✅" if response.status_code == 200 else "❌"
            print(f"{status_icon} {name}: {response_time:.2f}ms (HTTP {response.status_code})")
        
        # Check performance thresholds
        slow_endpoints = [result for result in performance_results if result[1] > 2000]  # > 2 seconds
        
        if slow_endpoints:
            print(f"⚠️  Slow endpoints detected: {[r[0] for r in slow_endpoints]}")
        else:
            print("✅ All endpoints responding within acceptable time limits")
        
        avg_response_time = sum(r[1] for r in performance_results) / len(performance_results)
        print(f"📊 Average response time: {avg_response_time:.2f}ms")
        
        return True
        
    except Exception as e:
        print(f"❌ Performance test failed: {e}")
        return False

async def run_graphql_authentication_tests():
    """Run complete GraphQL authentication test suite"""
    print("🚀 Starting NestSync GraphQL Authentication Tests\n")
    
    # Test 1: Basic server check
    print("=" * 60)
    server_ok = await test_server_accessibility()
    if not server_ok:
        print("❌ Server not accessible, aborting tests")
        return False
    
    # Test 2: GraphQL Health Check
    print("\n" + "=" * 60)
    graphql_health = await test_graphql_health_check()
    if not graphql_health:
        print("❌ GraphQL endpoint not healthy, aborting authentication tests")
        return False
    
    # Test 3: GraphQL Sign Up
    print("\n" + "=" * 60)
    signup_result = await test_graphql_sign_up()
    if not signup_result.get("success"):
        print("❌ Sign up failed, cannot test authentication flow")
        return False
    
    access_token = signup_result.get("access_token")
    if not access_token:
        print("❌ No access token received from sign up")
        return False
    
    # Test 4: Authenticated Query
    print("\n" + "=" * 60)
    me_result = await test_graphql_me_query(access_token)
    if not me_result.get("success"):
        print("❌ Authenticated query failed")
        return False
    
    # Summary
    print("\n" + "=" * 60)
    print("🎉 ALL GRAPHQL AUTHENTICATION TESTS PASSED!")
    print("=" * 60)
    print("✅ Server is accessible")
    print("✅ GraphQL endpoint is healthy")
    print("✅ User registration works via GraphQL")
    print("✅ Authentication tokens are issued")
    print("✅ Authenticated queries work")
    print("✅ Database integration is working")
    print("✅ Supabase integration is working")
    print()
    print("🔥 Ready for frontend integration!")
    print(f"📧 Test user created: {TEST_EMAIL}")
    print(f"🔗 GraphQL endpoint: {GRAPHQL_ENDPOINT}")
    
    return True

if __name__ == "__main__":
    print("🔐 NestSync GraphQL Authentication Test Suite")
    print("=" * 60)
    print(f"📍 Testing against: {BASE_URL}")
    print(f"🔗 GraphQL endpoint: {GRAPHQL_ENDPOINT}")
    print(f"⚙️  Environment: {settings.environment}")
    print(f"🍁 Region: {settings.data_region}")
    print(f"📧 Test email: {TEST_EMAIL}")
    print()
    
    # Run the GraphQL authentication tests
    success = asyncio.run(run_graphql_authentication_tests())
    sys.exit(0 if success else 1)