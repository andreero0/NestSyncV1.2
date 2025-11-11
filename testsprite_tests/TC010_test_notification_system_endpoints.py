import requests
import uuid

BASE_URL = "http://localhost:8001/graphql"
TIMEOUT = 30

# Using a sample user for auth workflow - replace with valid test user info if needed
TEST_USER_EMAIL = "testuser@example.com"
TEST_USER_PASSWORD = "TestPass123!"

def graphql_request(query, variables=None, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    payload = {"query": query}
    if variables is not None:
        payload["variables"] = variables
    response = requests.post(BASE_URL, json=payload, headers=headers, timeout=TIMEOUT)
    response.raise_for_status()
    return response.json()

def test_notification_system_endpoints():
    # 1) Authenticate user to get token for notification endpoints
    mutation_login = """
    mutation Login($email: String!, $password: String!) {
      login(email: $email, password: $password) {
        accessToken
        user {
          id
          email
        }
        errors {
          message
        }
      }
    }
    """
    login_vars = {"email": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD}
    login_resp = graphql_request(mutation_login, login_vars)
    assert "data" in login_resp and "login" in login_resp["data"], "Login query failed"
    login_data = login_resp["data"]["login"]
    # Check for errors present and non-empty
    if login_data.get("errors") and len(login_data.get("errors")) > 0:
        assert False, f"Login mutation returned errors: {login_data.get('errors')}"
    assert login_data.get("accessToken") is not None, "Login failed, no access token"
    token = login_data["accessToken"]
    user_id = login_data["user"]["id"]
    assert user_id is not None, "User ID missing after login"

    # 2) Query current notification preferences
    query_preferences = """
    query GetNotificationPreferences {
      notificationPreferences {
        id
        userId
        lowStockAlerts
        reorderReminders
        deliveryPreferences {
          method
          enabled
        }
      }
    }
    """
    pref_resp = graphql_request(query_preferences, token=token)
    assert "data" in pref_resp and "notificationPreferences" in pref_resp["data"], "Failed to fetch notification preferences"
    prefs = pref_resp["data"]["notificationPreferences"]
    assert isinstance(prefs, dict), "Notification preferences should be an object"
    assert prefs.get("userId") == user_id, "Notification preferences userId mismatch"

    # 3) Update notification preferences: Toggle lowStockAlerts to opposite value
    current_low_stock = prefs.get("lowStockAlerts", True)
    mutation_update_pref = """
    mutation UpdateNotificationPreferences($input: NotificationPreferencesInput!) {
      updateNotificationPreferences(input: $input) {
        success
        errors {
          message
        }
        preferences {
          lowStockAlerts
          reorderReminders
        }
      }
    }
    """
    new_low_stock = not current_low_stock
    update_vars = {"input": {"lowStockAlerts": new_low_stock}}
    update_resp = graphql_request(mutation_update_pref, update_vars, token=token)
    assert "data" in update_resp and "updateNotificationPreferences" in update_resp["data"], "Failed to update notification preferences"
    update_result = update_resp["data"]["updateNotificationPreferences"]
    assert update_result["success"] is True, f"Update preferences failed: {update_result.get('errors')}"
    updated_prefs = update_result["preferences"]
    assert updated_prefs["lowStockAlerts"] == new_low_stock, "Preference lowStockAlerts not updated correctly"

    # 4) Simulate sending a push notification for low stock alert (if API supports)
    # We'll create a dummy notification entry and confirm it's created and can be queried
    mutation_create_notification = """
    mutation CreateNotification($input: NotificationInput!) {
      createNotification(input: $input) {
        notification {
          id
          type
          message
          userId
          status
        }
        errors {
          message
        }
      }
    }
    """
    notif_message = f"Low stock alert test message {uuid.uuid4()}"
    notif_vars = {
        "input": {
            "type": "LOW_STOCK_ALERT",
            "message": notif_message,
            "userId": user_id,
            "actionable": True
        }
    }
    create_notif_resp = graphql_request(mutation_create_notification, notif_vars, token=token)
    assert "data" in create_notif_resp and "createNotification" in create_notif_resp["data"], "Failed to create notification"
    notif_data = create_notif_resp["data"]["createNotification"]
    assert notif_data["notification"] is not None, f"Notification creation failed: {notif_data.get('errors')}"
    notif_id = notif_data["notification"]["id"]
    assert notif_id is not None, "Notification ID missing after creation"

    try:
        # 5) Query notification by ID and validate contents
        query_notification = """
        query GetNotification($id: ID!) {
          notification(id: $id) {
            id
            type
            message
            userId
            status
          }
        }
        """
        query_vars = {"id": notif_id}
        query_notif_resp = graphql_request(query_notification, query_vars, token=token)
        assert "data" in query_notif_resp and "notification" in query_notif_resp["data"], "Failed to get notification"
        queried_notif = query_notif_resp["data"]["notification"]
        assert queried_notif["id"] == notif_id, "Queried notification ID mismatch"
        assert queried_notif["message"] == notif_message, "Notification message mismatch"
        assert queried_notif["userId"] == user_id, "Notification userId mismatch"

        # 6) Mark notification as read (actionable response)
        mutation_mark_read = """
        mutation MarkNotificationRead($id: ID!) {
          markNotificationRead(id: $id) {
            success
            errors {
              message
            }
          }
        }
        """
        mark_read_vars = {"id": notif_id}
        mark_resp = graphql_request(mutation_mark_read, mark_read_vars, token=token)
        assert "data" in mark_resp and "markNotificationRead" in mark_resp["data"], "Failed to mark notification read"
        assert mark_resp["data"]["markNotificationRead"]["success"] is True, f"Mark notification read failed: {mark_resp['data']['markNotificationRead'].get('errors')}"

        # 7) Verify notification status changed to read
        verification_resp = graphql_request(query_notification, query_vars, token=token)
        notif_after = verification_resp["data"]["notification"]
        assert notif_after["status"] == "READ", "Notification status did not update to READ"

    finally:
        # 8) Clean up: Delete created notification (if API supports)
        mutation_delete_notification = """
        mutation DeleteNotification($id: ID!) {
          deleteNotification(id: $id) {
            success
            errors {
              message
            }
          }
        }
        """
        try:
            delete_vars = {"id": notif_id}
            del_resp = graphql_request(mutation_delete_notification, delete_vars, token=token)
            assert "data" in del_resp and "deleteNotification" in del_resp["data"], "Failed to delete notification"
            assert del_resp["data"]["deleteNotification"]["success"] is True, f"Failed to delete notification: {del_resp['data']['deleteNotification'].get('errors')}"
        except Exception:
            # Suppress any exception on cleanup to not mask test results
            pass

test_notification_system_endpoints()
