import requests
import uuid

BASE_URL = "http://localhost:8001/graphql"
TIMEOUT = 30

# Helper function to perform GraphQL queries/mutations
def graphql_request(query, variables=None, headers=None):
    json_payload = {"query": query}
    if variables is not None:
        json_payload["variables"] = variables
    response = requests.post(BASE_URL, json=json_payload, headers=headers, timeout=TIMEOUT)
    response.raise_for_status()
    return response.json()

# Test family collaboration endpoints: presence indicators, shared shopping lists, role-based permissions, conflict-free sync
def test_family_collaboration_endpoints():
    # Authentication: login user to get auth token
    login_mutation = """
    mutation SignInUser($input: SignInInput!) {
      signIn(input: $input) {
        user {
          id
          email
        }
        token
      }
    }
    """
    # Test user email and password, must exist in the system before test
    email = "testuser@example.com"
    password = "StrongP@ssword123"
    login_variables = {
        "input": {
            "email": email,
            "password": password
        }
    }
    login_result = graphql_request(login_mutation, login_variables)
    assert "errors" not in login_result, f"Login failed: {login_result.get('errors')}"
    token = login_result["data"]["signIn"]["token"]
    assert token and isinstance(token, str)

    headers = {"Authorization": f"Bearer {token}"}

    # Create a child profile to associate with family collaboration tests
    create_child_mutation = """
    mutation CreateChild($input: ChildCreateInput!) {
      createChild(input: $input) {
        child {
          id
          name
          birthDate
        }
      }
    }
    """
    child_name = "Test Child"
    child_birth_date = "2024-01-01"
    create_child_variables = {"input": {"name": child_name, "birthDate": child_birth_date}}
    create_child_result = graphql_request(create_child_mutation, create_child_variables, headers)
    assert "errors" not in create_child_result, f"Create child failed: {create_child_result.get('errors')}"
    child = create_child_result["data"]["createChild"]["child"]
    assert child["name"] == child_name
    child_id = child["id"]

    # Use try-finally to clean up created child profile
    try:
        # 1. Test presence indicators: query family members' presence status for the child
        presence_query = """
        query GetPresenceIndicators($childId: ID!) {
          familyPresence(childId: $childId) {
            userId
            userName
            onlineStatus
            lastSeen
          }
        }
        """
        presence_variables = {"childId": child_id}
        presence_result = graphql_request(presence_query, presence_variables, headers)
        assert "errors" not in presence_result, f"Presence indicators query error: {presence_result.get('errors')}"
        presence_list = presence_result["data"]["familyPresence"]
        assert isinstance(presence_list, list), "Presence indicators should be a list"
        # Presence list items have keys userId, userName, onlineStatus, lastSeen (lastSeen may be None)
        for presence in presence_list:
            assert "userId" in presence
            assert "userName" in presence
            assert presence.get("onlineStatus") in ["online", "offline", "away"]

        # 2. Shared Shopping Lists: create shared shopping list, add item, get shopping lists
        create_list_mutation = """
        mutation CreateShoppingList($input: ShoppingListCreateInput!) {
          createShoppingList(input: $input) {
            shoppingList {
              id
              name
              shared
            }
          }
        }
        """
        list_name = "Test Shared Shopping List"
        create_list_variables = {"input": {"name": list_name, "shared": True}}
        create_list_result = graphql_request(create_list_mutation, create_list_variables, headers)
        assert "errors" not in create_list_result, f"Create shopping list failed: {create_list_result.get('errors')}"
        shopping_list = create_list_result["data"]["createShoppingList"]["shoppingList"]
        assert shopping_list["name"] == list_name and shopping_list["shared"] is True
        shopping_list_id = shopping_list["id"]

        # Add item to shared shopping list
        add_item_mutation = """
        mutation AddShoppingListItem($input: ShoppingListItemCreateInput!) {
          addShoppingListItem(input: $input) {
            item {
              id
              name
              quantity
              checked
            }
          }
        }
        """
        item_name = "Diapers Size 3"
        add_item_variables = {"input": {"shoppingListId": shopping_list_id, "name": item_name, "quantity": 3}}
        add_item_result = graphql_request(add_item_mutation, add_item_variables, headers)
        assert "errors" not in add_item_result, f"Add shopping list item failed: {add_item_result.get('errors')}"
        item = add_item_result["data"]["addShoppingListItem"]["item"]
        assert item["name"] == item_name and item["quantity"] == 3 and item["checked"] is False
        item_id = item["id"]

        # Query shopping lists with items
        shopping_lists_query = """
        query ShoppingLists {
          shoppingLists {
            id
            name
            shared
            items {
              id
              name
              quantity
              checked
            }
          }
        }
        """
        shopping_lists_result = graphql_request(shopping_lists_query, headers=headers)
        assert "errors" not in shopping_lists_result, f"Query shopping lists failed: {shopping_lists_result.get('errors')}"
        lists = shopping_lists_result["data"]["shoppingLists"]
        found_list = next((lst for lst in lists if lst["id"] == shopping_list_id), None)
        assert found_list is not None, "Created shopping list not found in query"
        found_item = next((it for it in found_list["items"] if it["id"] == item_id), None)
        assert found_item is not None, "Added item not found in shopping list items"

        # 3. Role-based Permissions: check current user's role and try to update permissions
        get_family_roles_query = """
        query GetFamilyRoles($childId: ID!) {
          familyRoles(childId: $childId) {
            userId
            userName
            role
          }
        }
        """
        family_roles_result = graphql_request(get_family_roles_query, {"childId": child_id}, headers)
        assert "errors" not in family_roles_result, f"Query family roles failed: {family_roles_result.get('errors')}"
        roles = family_roles_result["data"]["familyRoles"]
        assert any(role["userId"] for role in roles), "Roles list should contain userIds"

        # Try to update role for a family member (assign self admin role for test)
        # For safety, check if user has permission (simulate role update)
        update_role_mutation = """
        mutation UpdateFamilyRole($input: FamilyRoleUpdateInput!) {
          updateFamilyRole(input: $input) {
            userId
            role
          }
        }
        """
        # Pick first user from roles list
        target_user_id = roles[0]["userId"]
        new_role = "admin"
        update_role_variables = {"input": {"childId": child_id, "userId": target_user_id, "role": new_role}}
        update_role_result = graphql_request(update_role_mutation, update_role_variables, headers)
        # Either success or permission error, if permission error, validate proper error returned
        if "errors" in update_role_result:
            error_messages = [err["message"].lower() for err in update_role_result["errors"]]
            assert any(
                "permission" in msg or "not authorized" in msg or "forbidden" in msg for msg in error_messages
            ), f"Unexpected errors on role update: {error_messages}"
        else:
            updated_role = update_role_result["data"]["updateFamilyRole"]
            assert updated_role["userId"] == target_user_id
            assert updated_role["role"] == new_role

        # 4. Conflict-free Synchronization: simulate concurrent update on shopping list item checked status
        # Get current checked status and toggle it twice concurrently
        toggle_checked_mutation = """
        mutation UpdateShoppingListItem($input: ShoppingListItemUpdateInput!) {
          updateShoppingListItem(input: $input) {
            item {
              id
              checked
            }
          }
        }
        """
        # Fetch item current checked status
        item_checked = found_item["checked"]
        toggled_value_1 = not item_checked
        toggled_value_2 = item_checked  # revert back

        # Send first update
        variables1 = {"input": {"id": item_id, "checked": toggled_value_1}}
        resp1 = graphql_request(toggle_checked_mutation, variables1, headers)
        assert "errors" not in resp1, f"Error toggling checked status first update: {resp1.get('errors')}"
        updated1 = resp1["data"]["updateShoppingListItem"]["item"]
        assert updated1["checked"] == toggled_value_1

        # Send second update concurrent / immediately after
        variables2 = {"input": {"id": item_id, "checked": toggled_value_2}}
        resp2 = graphql_request(toggle_checked_mutation, variables2, headers)
        assert "errors" not in resp2, f"Error toggling checked status second update: {resp2.get('errors')}"
        updated2 = resp2["data"]["updateShoppingListItem"]["item"]
        assert updated2["checked"] == toggled_value_2

        # Final get to confirm state is consistent (should reflect last update)
        shopping_lists_confirm = graphql_request(shopping_lists_query, headers=headers)
        final_lists = shopping_lists_confirm["data"]["shoppingLists"]
        final_list = next((lst for lst in final_lists if lst["id"] == shopping_list_id), None)
        final_item = next((it for it in final_list["items"] if it["id"] == item_id), None)
        assert final_item["checked"] == toggled_value_2

    finally:
        # Cleanup: delete child profile and shopping list to avoid clutter
        # Delete shopping list
        delete_list_mutation = """
        mutation DeleteShoppingList($id: ID!) {
          deleteShoppingList(id: $id) {
            success
          }
        }
        """
        try:
            graphql_request(delete_list_mutation, {"id": shopping_list_id}, headers)
        except Exception:
            pass
        # Delete child profile
        delete_child_mutation = """
        mutation DeleteChild($id: ID!) {
          deleteChild(id: $id) {
            success
          }
        }
        """
        try:
            graphql_request(delete_child_mutation, {"id": child_id}, headers)
        except Exception:
            pass

# Call the test function to execute
test_family_collaboration_endpoints()
