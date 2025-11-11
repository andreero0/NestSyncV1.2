import requests
import uuid

BASE_URL = "http://localhost:8001/graphql"
TIMEOUT = 30

# Dummy user credentials for authentication (should be replaced with valid test credentials)
TEST_USER_EMAIL = "testuser@example.com"
TEST_USER_PASSWORD = "TestPassword123!"

def authenticate():
    query = """
    mutation Login($email: String!, $password: String!) {
      login(email: $email, password: $password) {
        accessToken
        user {
          id
          email
        }
      }
    }
    """
    variables = {"email": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD}
    response = requests.post(
        BASE_URL,
        json={"query": query, "variables": variables},
        timeout=TIMEOUT
    )
    response.raise_for_status()
    try:
        data = response.json()
    except ValueError:
        assert False, "Response content is not valid JSON"
    assert data and isinstance(data, dict), "Response JSON is empty or invalid"
    assert "data" in data and "login" in data["data"] and data["data"]["login"] is not None, "Authentication failed: login field missing"
    access_token = data["data"]["login"].get("accessToken")
    assert access_token and isinstance(access_token, str), "Authentication failed: accessToken missing"
    return access_token

def create_child_profile(headers):
    mutation = """
    mutation CreateChildProfile($input: ChildProfileCreateInput!) {
      createChildProfile(input: $input) {
        id
        name
        birthDate
      }
    }
    """
    unique_name = "TestChild_" + str(uuid.uuid4())[:8]
    variables = {
        "input": {
            "name": unique_name,
            "birthDate": "2023-01-01",
            "gender": "Female"
        }
    }
    response = requests.post(
        BASE_URL,
        json={"query": mutation, "variables": variables},
        headers=headers,
        timeout=TIMEOUT
    )
    response.raise_for_status()
    data = response.json()
    assert "data" in data and "createChildProfile" in data["data"], "Child profile creation failed"
    child_profile = data["data"]["createChildProfile"]
    assert "id" in child_profile, "Child profile ID missing"
    return child_profile

def delete_child_profile(headers, child_id):
    mutation = """
    mutation DeleteChildProfile($id: ID!) {
      deleteChildProfile(id: $id) {
        success
      }
    }
    """
    variables = {"id": child_id}
    response = requests.post(
        BASE_URL,
        json={"query": mutation, "variables": variables},
        headers=headers,
        timeout=TIMEOUT
    )
    response.raise_for_status()
    data = response.json()
    # Deletion might return success true/false; if false, raise
    assert "data" in data and "deleteChildProfile" in data["data"], "Child profile deletion failed"
    assert data["data"]["deleteChildProfile"]["success"] is True, "Child profile deletion not successful"

def test_reorder_suggestions_endpoints():
    access_token = authenticate()
    headers = {"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}

    # Create a child profile to associate reorder suggestions test with
    child_profile = None
    try:
        child_profile = create_child_profile(headers)
        child_id = child_profile["id"]

        # 1. Test reorder timing suggestion query
        reorder_timing_query = """
        query ReorderTiming($childId: ID!) {
          reorderTiming(childId: $childId) {
            recommendedReorderDate
            urgencyLevel
          }
        }
        """
        variables = {"childId": child_id}
        response = requests.post(
            BASE_URL,
            json={"query": reorder_timing_query, "variables": variables},
            headers=headers,
            timeout=TIMEOUT
        )
        response.raise_for_status()
        data = response.json()
        assert "data" in data and "reorderTiming" in data["data"], "Reorder timing data missing"
        timing = data["data"]["reorderTiming"]
        assert "recommendedReorderDate" in timing and timing["recommendedReorderDate"], "Recommended reorder date missing"
        assert "urgencyLevel" in timing and timing["urgencyLevel"] in ["low", "medium", "high"], "Invalid urgency level"

        # 2. Test size-change prediction query
        size_prediction_query = """
        query SizeChangePrediction($childId: ID!) {
          sizeChangePrediction(childId: $childId) {
            nextRecommendedSize
            predictedChangeDate
          }
        }
        """
        response = requests.post(
            BASE_URL,
            json={"query": size_prediction_query, "variables": variables},
            headers=headers,
            timeout=TIMEOUT
        )
        response.raise_for_status()
        data = response.json()
        assert "data" in data and "sizeChangePrediction" in data["data"], "Size change prediction missing"
        size_pred = data["data"]["sizeChangePrediction"]
        assert "nextRecommendedSize" in size_pred and size_pred["nextRecommendedSize"], "Next size missing"
        assert "predictedChangeDate" in size_pred and size_pred["predictedChangeDate"], "Predicted change date missing"

        # 3. Test retailer price comparisons query
        retailer_comparison_query = """
        query RetailerPriceComparison($childId: ID!) {
          retailerPriceComparison(childId: $childId) {
            retailerName
            price
            available
          }
        }
        """
        response = requests.post(
            BASE_URL,
            json={"query": retailer_comparison_query, "variables": variables},
            headers=headers,
            timeout=TIMEOUT
        )
        response.raise_for_status()
        data = response.json()
        assert "data" in data and "retailerPriceComparison" in data["data"], "Retailer price comparison missing"
        comparisons = data["data"]["retailerPriceComparison"]
        assert isinstance(comparisons, list), "Retailer comparison should be a list"
        assert any(c.get("available") for c in comparisons), "At least one retailer should be available"
        for item in comparisons:
            assert "retailerName" in item and item["retailerName"], "Retailer name missing"
            assert "price" in item and isinstance(item["price"], (int, float)), "Price missing or invalid"
            assert "available" in item and isinstance(item["available"], bool), "Availability missing or invalid"

        # 4. Test emergency order mutation (simulate emergency order placement)
        emergency_order_mutation = """
        mutation EmergencyOrder($childId: ID!, $size: String!, $quantity: Int!) {
          placeEmergencyOrder(childId: $childId, size: $size, quantity: $quantity) {
            orderId
            status
            estimatedDelivery
          }
        }
        """
        mutation_vars = {"childId": child_id, "size": size_pred["nextRecommendedSize"], "quantity": 10}
        response = requests.post(
            BASE_URL,
            json={"query": emergency_order_mutation, "variables": mutation_vars},
            headers=headers,
            timeout=TIMEOUT
        )
        response.raise_for_status()
        data = response.json()
        assert "data" in data and "placeEmergencyOrder" in data["data"], "Emergency order result missing"
        order = data["data"]["placeEmergencyOrder"]
        assert "orderId" in order and order["orderId"], "Order ID missing"
        assert order.get("status") in ["pending", "confirmed", "processing"], "Unexpected order status"
        assert "estimatedDelivery" in order and order["estimatedDelivery"], "Estimated delivery missing"

    finally:
        if child_profile:
            delete_child_profile(headers, child_profile["id"])

test_reorder_suggestions_endpoints()
