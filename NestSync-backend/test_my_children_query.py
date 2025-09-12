#!/usr/bin/env python3
"""
Direct GraphQL MY_CHILDREN Query Test
Test the GraphQL endpoint directly to verify data isolation works correctly
"""

import requests
import json
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# GraphQL endpoint
GRAPHQL_URL = "http://localhost:8001/graphql"

# Test users and their expected children
TEST_USERS = {
    "parents@nestsync.com": {
        "password": "testpassword123",  # Update this with actual password
        "expected_children": ["Ose"]
    },
    "testparent@example.com": {
        "password": "testpassword123",  # Update this with actual password  
        "expected_children": ["Tobe"]
    }
}

def authenticate_user(email, password):
    """Authenticate user and get access token"""
    
    sign_in_mutation = """
    mutation SignIn($input: SignInInput!) {
        signIn(input: $input) {
            success
            message
            accessToken
            refreshToken
            user {
                id
                email
            }
        }
    }
    """
    
    variables = {
        "input": {
            "email": email,
            "password": password
        }
    }
    
    try:
        response = requests.post(
            GRAPHQL_URL,
            json={"query": sign_in_mutation, "variables": variables},
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code != 200:
            logger.error(f"HTTP error {response.status_code}: {response.text}")
            return None
            
        data = response.json()
        
        if "errors" in data:
            logger.error(f"GraphQL errors: {data['errors']}")
            return None
            
        sign_in_result = data["data"]["signIn"]
        
        if not sign_in_result["success"]:
            logger.error(f"Sign in failed: {sign_in_result['message']}")
            return None
            
        return sign_in_result["accessToken"]
        
    except Exception as e:
        logger.error(f"Authentication error: {e}")
        return None

def query_my_children(access_token):
    """Query MY_CHILDREN with authentication token"""
    
    my_children_query = """
    query MyChildren {
        myChildren(first: 10) {
            pageInfo {
                totalCount
                hasNextPage
                hasPreviousPage
            }
            edges {
                node {
                    id
                    name
                    dateOfBirth
                    gender
                    currentDiaperSize
                    dailyUsageCount
                    onboardingCompleted
                    createdAt
                }
                cursor
            }
        }
    }
    """
    
    try:
        response = requests.post(
            GRAPHQL_URL,
            json={"query": my_children_query},
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {access_token}"
            }
        )
        
        if response.status_code != 200:
            logger.error(f"HTTP error {response.status_code}: {response.text}")
            return None
            
        data = response.json()
        
        if "errors" in data:
            logger.error(f"GraphQL errors: {data['errors']}")
            return None
            
        return data["data"]["myChildren"]
        
    except Exception as e:
        logger.error(f"Query error: {e}")
        return None

def test_data_privacy_isolation():
    """Test that each user sees only their own children"""
    
    logger.info("=== TESTING DATA PRIVACY ISOLATION ===")
    logger.info("Testing GraphQL MY_CHILDREN query for each user account")
    
    test_results = {}
    
    for email, user_data in TEST_USERS.items():
        logger.info(f"\n--- Testing user: {email} ---")
        
        # Step 1: Authenticate
        access_token = authenticate_user(email, user_data["password"])
        if not access_token:
            logger.error(f"Failed to authenticate {email}")
            test_results[email] = {
                "success": False,
                "error": "Authentication failed"
            }
            continue
            
        logger.info(f"✅ Authentication successful for {email}")
        
        # Step 2: Query children
        my_children_data = query_my_children(access_token)
        if not my_children_data:
            logger.error(f"Failed to query children for {email}")
            test_results[email] = {
                "success": False,
                "error": "Query failed"
            }
            continue
            
        # Step 3: Analyze results
        total_count = my_children_data["pageInfo"]["totalCount"]
        children_names = [edge["node"]["name"] for edge in my_children_data["edges"]]
        expected_children = user_data["expected_children"]
        
        logger.info(f"   Total children returned: {total_count}")
        logger.info(f"   Children names: {children_names}")
        logger.info(f"   Expected children: {expected_children}")
        
        # Step 4: Validate privacy isolation
        privacy_correct = (
            len(children_names) == len(expected_children) and
            set(children_names) == set(expected_children)
        )
        
        if privacy_correct:
            logger.info(f"   ✅ PRIVACY CORRECT: {email} sees only their own children")
            test_results[email] = {
                "success": True,
                "children_returned": children_names,
                "expected_children": expected_children,
                "total_count": total_count
            }
        else:
            logger.error(f"   ❌ PRIVACY VIOLATION: {email} sees incorrect children")
            test_results[email] = {
                "success": False,
                "error": "Privacy violation detected",
                "children_returned": children_names,
                "expected_children": expected_children,
                "total_count": total_count
            }
    
    # Final assessment
    logger.info("\n=== FINAL PRIVACY ASSESSMENT ===")
    
    all_passed = all(result["success"] for result in test_results.values())
    
    if all_passed:
        logger.info("✅ ALL USERS: Data privacy isolation working correctly")
        logger.info("✅ GraphQL MY_CHILDREN query enforces proper access control")
        logger.info("✅ No cross-user data leaks detected")
    else:
        logger.error("❌ PRIVACY VIOLATIONS DETECTED")
        for email, result in test_results.items():
            if not result["success"]:
                logger.error(f"   {email}: {result.get('error', 'Unknown error')}")
    
    # Save test results
    with open(f"privacy_test_results_{int(__import__('time').time())}.json", "w") as f:
        json.dump(test_results, f, indent=2)
    
    return test_results

def main():
    """Main test execution"""
    logger.info("🔒 STARTING DATA PRIVACY ISOLATION TEST")
    logger.info("Testing GraphQL endpoint directly to verify data isolation")
    
    try:
        test_results = test_data_privacy_isolation()
        
        if all(result["success"] for result in test_results.values()):
            logger.info("\n🎉 SUCCESS: Data privacy isolation is working correctly!")
            logger.info("The issue is likely in frontend Apollo Client caching.")
            logger.info("Next steps:")
            logger.info("1. Clear Apollo Client cache")
            logger.info("2. Check authentication state management")
            logger.info("3. Verify frontend query execution")
        else:
            logger.error("\n🚨 CRITICAL: Data privacy violations detected in GraphQL layer!")
            logger.error("Immediate backend investigation required!")
            
    except Exception as e:
        logger.error(f"Test execution failed: {e}")

if __name__ == "__main__":
    main()