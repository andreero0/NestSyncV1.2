#!/usr/bin/env python3
"""
Test script to verify the GraphQL changes_ready field is working
Uses the test account credentials from CLAUDE.md
"""

import asyncio
import httpx
import json

# Test credentials from CLAUDE.md
TEST_EMAIL = "andre_ero@yahoo.ca"
TEST_PASSWORD = "Shazam11#"

async def test_dashboard_with_changes_ready():
    """Test the new changes_ready field in dashboard stats"""
    
    print("Testing GraphQL Dashboard Stats with Changes Ready Field")
    print("=" * 60)
    
    async with httpx.AsyncClient() as client:
        base_url = "http://localhost:8001/graphql"
        
        # Step 1: Sign in to get authentication token
        print("1. Signing in with test account...")
        sign_in_mutation = """
        mutation SignIn($input: SignInInput!) {
            signIn(input: $input) {
                success
                message
                error
                user {
                    id
                    email
                    firstName
                }
                session {
                    accessToken
                    expiresIn
                }
            }
        }
        """
        
        sign_in_response = await client.post(base_url, json={
            "query": sign_in_mutation,
            "variables": {
                "input": {
                    "email": TEST_EMAIL,
                    "password": TEST_PASSWORD
                }
            }
        })
        
        if sign_in_response.status_code != 200:
            print(f"ERROR: HTTP {sign_in_response.status_code}")
            print(sign_in_response.text)
            return
            
        sign_in_data = sign_in_response.json()
        
        if sign_in_data.get("errors"):
            print(f"ERROR: GraphQL errors: {sign_in_data['errors']}")
            return
            
        auth_data = sign_in_data["data"]["signIn"]
        if not auth_data["success"]:
            print(f"ERROR: Sign in failed: {auth_data.get('error')}")
            return
            
        access_token = auth_data["session"]["accessToken"]
        user_id = auth_data["user"]["id"]
        print(f"✓ Signed in successfully as {auth_data['user']['email']}")
        
        # Step 2: Get user's children
        print("\n2. Fetching user's children...")
        children_query = """
        query MyChildren($first: Int) {
            myChildren(first: $first) {
                edges {
                    node {
                        id
                        name
                        currentDiaperSize
                        dailyUsageCount
                    }
                }
            }
        }
        """
        
        children_response = await client.post(base_url, 
            json={
                "query": children_query,
                "variables": {"first": 10}
            },
            headers={"Authorization": f"Bearer {access_token}"}
        )
        
        if children_response.status_code != 200:
            print(f"ERROR: HTTP {children_response.status_code}")
            return
            
        children_data = children_response.json()
        if children_data.get("errors"):
            print(f"ERROR: {children_data['errors']}")
            return
            
        children = children_data["data"]["myChildren"]["edges"]
        if not children:
            print("ERROR: No children found for this user")
            return
            
        child = children[0]["node"]
        child_id = child["id"]
        print(f"✓ Found child: {child['name']} (ID: {child_id})")
        print(f"  - Current diaper size: {child['currentDiaperSize']}")
        print(f"  - Daily usage count: {child['dailyUsageCount']}")
        
        # Step 3: Test the new dashboard stats with changes_ready field
        print("\n3. Testing dashboard stats with changes_ready field...")
        dashboard_query = """
        query GetDashboardStats($childId: ID!) {
            getDashboardStats(childId: $childId) {
                daysRemaining
                diapersLeft
                changesReady
                lastChange
                todayChanges
                currentSize
            }
        }
        """
        
        dashboard_response = await client.post(base_url,
            json={
                "query": dashboard_query,
                "variables": {"childId": child_id}
            },
            headers={"Authorization": f"Bearer {access_token}"}
        )
        
        if dashboard_response.status_code != 200:
            print(f"ERROR: HTTP {dashboard_response.status_code}")
            print(dashboard_response.text)
            return
            
        dashboard_data = dashboard_response.json()
        
        if dashboard_data.get("errors"):
            print(f"ERROR: GraphQL errors: {dashboard_data['errors']}")
            return
            
        stats = dashboard_data["data"]["getDashboardStats"]
        
        print("\n" + "=" * 60)
        print("DASHBOARD STATS RESULT:")
        print("=" * 60)
        print(f"Days Remaining: {stats['daysRemaining']}")
        print(f"Diapers Left: {stats['diapersLeft']}")
        print(f"Changes Ready: {stats['changesReady']} ← NEW FIELD!")
        print(f"Last Change: {stats['lastChange']}")
        print(f"Today Changes: {stats['todayChanges']}")
        print(f"Current Size: {stats['currentSize']}")
        
        # Validate the new field
        if "changesReady" in stats:
            print("\n✓ SUCCESS: changesReady field is present!")
            print(f"✓ UX Impact: Instead of '{stats['diapersLeft']} Diapers Left'")
            print(f"✓ Users will see: 'Ready for {stats['changesReady']} Changes'")
            
            if stats['changesReady'] == 0 and stats['diapersLeft'] > 0:
                print("⚠️  Note: Changes ready is 0 despite having diapers - likely no wipes inventory")
                print("   This correctly prevents parents from thinking they're ready when they need both supplies")
        else:
            print("❌ FAILURE: changesReady field is missing!")
        
        print("\n" + "=" * 60)

if __name__ == "__main__":
    asyncio.run(test_dashboard_with_changes_ready())