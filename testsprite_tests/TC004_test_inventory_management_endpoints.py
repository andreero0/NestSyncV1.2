import requests
import uuid

BASE_URL = "http://localhost:8001/graphql"
HEADERS = {
    "Content-Type": "application/json",
    # Add auth token here if authentication is required, e.g.
    # "Authorization": "Bearer <token>"
}
TIMEOUT = 30


def graphql_query(query: str, variables=None):
    payload = {"query": query}
    if variables:
        payload["variables"] = variables
    response = requests.post(BASE_URL, json=payload, headers=HEADERS, timeout=TIMEOUT)
    response.raise_for_status()
    return response.json()


def test_inventory_management_endpoints():
    # Step 1: Create a new child profile (required to associate inventory)
    create_child_mutation = """
    mutation CreateChild($input: CreateChildInput!) {
      createChild(input: $input) {
        child {
          id
          name
          birthDate
        }
        success
        errors
      }
    }
    """
    child_name = f"Test Child {uuid.uuid4()}"
    child_birth_date = "2024-01-01"

    try:
        create_child_resp = graphql_query(create_child_mutation, {"input": {"name": child_name, "birthDate": child_birth_date}})
        assert "data" in create_child_resp and create_child_resp["data"] is not None, "Missing data in createChild response"
        create_child_data = create_child_resp["data"].get("createChild")
        assert create_child_data is not None and isinstance(create_child_data, dict), "createChild response data is None or invalid"
        assert create_child_data.get("success") is True, f"Child creation failed: {create_child_data.get('errors')}"
        child_obj = create_child_data.get("child")
        assert child_obj is not None, "Child object is missing in createChild response"
        child_id = child_obj.get("id")
        assert child_id, "Created child ID is empty"

        # Step 2: Add an inventory item (diaper stock)
        add_inventory_mutation = """
        mutation AddInventoryItem($input: AddInventoryInput!) {
          addInventoryItem(input: $input) {
            inventoryItem {
              id
              name
              quantity
              status
            }
            success
            errors
          }
        }
        """
        diaper_name = "Disposable Diapers"
        initial_quantity = 50
        add_inventory_resp = graphql_query(add_inventory_mutation, {"input": {"childId": child_id, "name": diaper_name, "quantity": initial_quantity}})
        assert "data" in add_inventory_resp and add_inventory_resp["data"] is not None, "Missing data in addInventoryItem response"
        add_inventory_data = add_inventory_resp["data"].get("addInventoryItem")
        assert add_inventory_data is not None and isinstance(add_inventory_data, dict), "addInventoryItem response data is None or invalid"
        assert add_inventory_data.get("success") is True, f"Add inventory failed: {add_inventory_data.get('errors')}"
        inventory_item = add_inventory_data.get("inventoryItem")
        assert inventory_item is not None, "Inventory item data is missing"
        inventory_id = inventory_item.get("id")
        assert inventory_id, "Inventory item ID is empty"
        assert inventory_item.get("quantity") == initial_quantity
        assert inventory_item.get("status") in ["red", "yellow", "green"], "Inventory status invalid"

        # Step 3: Query inventory status and traffic light
        inventory_status_query = """
        query InventoryStatus($childId: ID!) {
          inventoryStatus(childId: $childId) {
            id
            name
            quantity
            status
            lastUpdated
          }
        }
        """
        inventory_status_resp = graphql_query(inventory_status_query, {"childId": child_id})
        assert "data" in inventory_status_resp and inventory_status_resp["data"] is not None, "Missing data in inventoryStatus response"
        inventory_items = inventory_status_resp["data"].get("inventoryStatus")
        assert inventory_items is not None, "inventoryStatus data is None"
        assert any(item.get("id") == inventory_id for item in inventory_items), "Created inventory item not found"
        item = next(item for item in inventory_items if item.get("id") == inventory_id)
        assert item.get("quantity") == initial_quantity
        assert item.get("status") in ["red", "yellow", "green"]

        # Step 4: Update inventory quantity to trigger traffic light status change
        update_inventory_mutation = """
        mutation UpdateInventoryQuantity($id: ID!, $quantity: Int!) {
          updateInventoryQuantity(id: $id, quantity: $quantity) {
            inventoryItem {
              id
              quantity
              status
            }
            success
            errors
          }
        }
        """
        # Decrease quantity to low amount (e.g., 5) to expect 'red' or 'yellow' status
        low_quantity = 5
        update_inventory_resp = graphql_query(update_inventory_mutation, {"id": inventory_id, "quantity": low_quantity})
        assert "data" in update_inventory_resp and update_inventory_resp["data"] is not None, "Missing data in updateInventoryQuantity response"
        update_inventory_data = update_inventory_resp["data"].get("updateInventoryQuantity")
        assert update_inventory_data is not None and isinstance(update_inventory_data, dict), "updateInventoryQuantity response data is None or invalid"
        assert update_inventory_data.get("success") is True, f"Update inventory failed: {update_inventory_data.get('errors')}"
        updated_item = update_inventory_data.get("inventoryItem")
        assert updated_item is not None, "Updated inventory item is missing"
        assert updated_item.get("quantity") == low_quantity
        assert updated_item.get("status") in ["red", "yellow"], "Traffic light status did not update as expected for low quantity"

        # Step 5: Simulate real-time synchronization by querying inventory again (pretend from another user/device)
        inventory_status_resp_2 = graphql_query(inventory_status_query, {"childId": child_id})
        assert "data" in inventory_status_resp_2 and inventory_status_resp_2["data"] is not None, "Missing data in second inventoryStatus response"
        inventory_items_2 = inventory_status_resp_2["data"].get("inventoryStatus")
        assert inventory_items_2 is not None, "inventoryStatus data is None in second query"
        assert any(i.get("id") == inventory_id and i.get("quantity") == low_quantity for i in inventory_items_2), "Real-time sync failed; updated inventory not reflected"

        # Step 6: Offline capability test - simulate by querying inventory status (should succeed)
        # Here offline simulation is limited in API test, but verify fetch is successful and data is consistent
        # (Actual offline sync is UI/client-side behavior)

        assert inventory_items_2 is not None and len(inventory_items_2) > 0, "Offline capability: inventory query returned no items"

    finally:
        # Cleanup: delete inventory item and child profile to maintain test isolation
        if 'inventory_id' in locals():
            delete_inventory_mutation = """
            mutation DeleteInventoryItem($id: ID!) {
              deleteInventoryItem(id: $id) {
                success
                errors
              }
            }
            """
            try:
                graphql_query(delete_inventory_mutation, {"id": inventory_id})
            except Exception:
                pass
        if 'child_id' in locals():
            delete_child_mutation = """
            mutation DeleteChild($id: ID!) {
              deleteChild(id: $id) {
                success
                errors
              }
            }
            """
            try:
                graphql_query(delete_child_mutation, {"id": child_id})
            except Exception:
                pass


test_inventory_management_endpoints()
