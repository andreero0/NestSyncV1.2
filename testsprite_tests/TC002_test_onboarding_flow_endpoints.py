import requests
import uuid

BASE_URL = "http://localhost:8001/graphql"
TIMEOUT = 30

headers = {
    "Content-Type": "application/json",
}

def graphql_request(query, variables=None, token=None):
    payload = {
        "query": query,
        "variables": variables or {}
    }
    hdrs = headers.copy()
    if token:
        hdrs["Authorization"] = f"Bearer {token}"
    response = requests.post(BASE_URL, json=payload, headers=hdrs, timeout=TIMEOUT)
    response.raise_for_status()
    json_resp = response.json()
    assert "errors" not in json_resp, f"GraphQL errors: {json_resp.get('errors')}"
    return json_resp["data"]

def test_onboarding_flow_endpoints():
    # 1. Register a new user (first-time user)
    register_mutation = """
    mutation RegisterUser($email: String!, $password: String!) {
      registerUser(email: $email, password: $password) {
        success
        user {
          id
          email
        }
        token
      }
    }
    """
    unique_email = f"testuser_{uuid.uuid4().hex[:8]}@example.com"
    register_vars = {
        "email": unique_email,
        "password": "StrongP@ssword123!"
    }
    register_data = graphql_request(register_mutation, register_vars)
    assert register_data["registerUser"]["success"] is True
    user_id = register_data["registerUser"]["user"]["id"]
    token = register_data["registerUser"]["token"]
    assert user_id and token

    # Use try-finally to remove created resources, if deletions are possible
    try:
        # 2. Onboarding: Create child profile for first-time user
        create_child_mutation = """
        mutation CreateChild($input: CreateChildInput!) {
          createChild(input: $input) {
            child {
              id
              name
              birthDate
              gender
            }
          }
        }
        """
        child_name = "BabyOnboard"
        birth_date = "2024-01-01"
        gender = "FEMALE"
        child_vars = {
            "input": {
                "name": child_name,
                "birthDate": birth_date,
                "gender": gender
            }
        }
        child_create_data = graphql_request(create_child_mutation, child_vars, token)
        child = child_create_data["createChild"]["child"]
        assert child["name"] == child_name
        assert child["birthDate"] == birth_date
        assert child["gender"] == gender
        child_id = child["id"]
        assert child_id

        # 3. Onboarding: Initial diaper inventory setup for the child
        create_inventory_mutation = """
        mutation AddInventoryItem($input: AddInventoryItemInput!) {
          addInventoryItem(input: $input) {
            inventoryItem {
              id
              childId
              size
              quantity
              status
            }
          }
        }
        """
        inventory_vars = {
            "input": {
                "childId": child_id,
                "size": "NEWBORN",
                "quantity": 20,
                "status": "GREEN"
            }
        }
        inventory_data = graphql_request(create_inventory_mutation, inventory_vars, token)
        inventory_item = inventory_data["addInventoryItem"]["inventoryItem"]
        assert inventory_item["childId"] == child_id
        assert inventory_item["size"] == "NEWBORN"
        assert inventory_item["quantity"] == 20
        assert inventory_item["status"] == "GREEN"
        inventory_item_id = inventory_item["id"]

        # 4. Query user profile with children and inventory to validate setup
        get_user_profile_query = """
        query GetUserProfile {
          me {
            id
            email
            children {
              id
              name
              birthDate
              gender
              inventory {
                id
                size
                quantity
                status
              }
            }
          }
        }
        """
        profile_data = graphql_request(get_user_profile_query, token=token)
        me = profile_data["me"]
        assert me["id"] == user_id
        # Validate the created child is present
        found_child = next((c for c in me["children"] if c["id"] == child_id), None)
        assert found_child is not None
        assert found_child["name"] == child_name
        # Validate inventory under the child
        inv = found_child["inventory"]
        assert any(i["id"] == inventory_item_id for i in inv)

        # 5. Fetch ML-powered reorder suggestions for the child (simulate first-time suggestions)
        reorder_suggestions_query = """
        query ReorderSuggestions($childId: ID!) {
          reorderSuggestions(childId: $childId) {
            suggestedSize
            recommendedQuantity
            retailerComparisons {
              retailerName
              price
            }
            emergencyOrderAvailable
          }
        }
        """
        reorder_vars = {"childId": child_id}
        reorder_data = graphql_request(reorder_suggestions_query, reorder_vars, token)
        suggestions = reorder_data["reorderSuggestions"]
        # Should return suggestions structure (can be empty but keys present)
        assert "suggestedSize" in suggestions
        assert "recommendedQuantity" in suggestions
        assert isinstance(suggestions.get("retailerComparisons", []), list)
        assert isinstance(suggestions.get("emergencyOrderAvailable"), bool)

        # 6. Fetch analytics dashboard data for the user/child
        analytics_query = """
        query AnalyticsData($childId: ID!) {
          analytics(childId: $childId) {
            usageTrends {
              diaperUsagePerDay
              lastWeekUsage
            }
            costSummary {
              totalSpent
              savings
            }
            sizeChangePredictions {
              predictedSize
              predictedDate
            }
          }
        }
        """
        analytics_vars = {"childId": child_id}
        analytics_data = graphql_request(analytics_query, analytics_vars, token)
        analytics = analytics_data["analytics"]
        # Validate keys exist in analytics response
        assert "usageTrends" in analytics
        assert "costSummary" in analytics
        assert "sizeChangePredictions" in analytics

    finally:
        # Cleanup: delete inventory item
        try:
            delete_inventory_mutation = """
            mutation DeleteInventoryItem($id: ID!) {
              deleteInventoryItem(id: $id) {
                success
              }
            }
            """
            if 'inventory_item_id' in locals():
                graphql_request(delete_inventory_mutation, {"id": inventory_item_id}, token)
        except Exception:
            pass

        # Cleanup: delete child profile
        try:
            delete_child_mutation = """
            mutation DeleteChild($id: ID!) {
              deleteChild(id: $id) {
                success
              }
            }
            """
            if 'child_id' in locals():
                graphql_request(delete_child_mutation, {"id": child_id}, token)
        except Exception:
            pass

        # Cleanup: delete user
        try:
            delete_user_mutation = """
            mutation DeleteUser {
              deleteMe {
                success
              }
            }
            """
            graphql_request(delete_user_mutation, token=token)
        except Exception:
            pass

test_onboarding_flow_endpoints()
