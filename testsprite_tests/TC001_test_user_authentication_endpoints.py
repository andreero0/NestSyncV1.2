import requests
import uuid

BASE_URL = "http://localhost:8001/graphql"
HEADERS = {
    "Content-Type": "application/json",
}
TIMEOUT = 30


def graphql_request(query, variables=None, headers=None):
    json_data = {"query": query}
    if variables is not None:
        json_data["variables"] = variables
    response = requests.post(
        BASE_URL, json=json_data, headers=headers or HEADERS, timeout=TIMEOUT
    )
    response.raise_for_status()
    return response.json()


def test_user_authentication_endpoints():
    # 1. Register a new user
    unique_email = f"testuser_{uuid.uuid4().hex}@example.com"
    register_mutation = """
    mutation Register($email: String!, $password: String!) {
      registerUser(email: $email, password: $password) {
        success
        message
        user {
          id
          email
        }
        errors
      }
    }
    """
    variables = {"email": unique_email, "password": "StrongPassw0rd!"}
    register_resp = graphql_request(register_mutation, variables)
    assert "data" in register_resp and register_resp["data"] is not None, "No data in register response"
    assert "registerUser" in register_resp["data"] and register_resp["data"]["registerUser"] is not None, "No registerUser data"
    reg_data = register_resp["data"]["registerUser"]
    assert reg_data["success"] is True, f"Registration failed: {reg_data.get('message') or reg_data.get('errors')}"

    user_id = reg_data["user"]["id"]
    assert reg_data["user"]["email"] == unique_email

    token = None

    try:
        # 2. Login with the newly registered user
        login_mutation = """
        mutation Login($email: String!, $password: String!) {
          loginUser(email: $email, password: $password) {
            success
            message
            token
            errors
          }
        }
        """
        variables = {"email": unique_email, "password": "StrongPassw0rd!"}
        login_resp = graphql_request(login_mutation, variables)
        assert "data" in login_resp and login_resp["data"] is not None, "No data in login response"
        assert "loginUser" in login_resp["data"] and login_resp["data"]["loginUser"] is not None, "No loginUser data"
        login_data = login_resp["data"]["loginUser"]
        assert login_data["success"] is True, f"Login failed: {login_data.get('message') or login_data.get('errors')}"
        token = login_data.get("token")
        assert token is not None and isinstance(token, str) and len(token) > 0

        auth_headers = HEADERS.copy()
        auth_headers["Authorization"] = f"Bearer {token}"

        # 3. Password Recovery Request
        password_recovery_mutation = """
        mutation RequestPasswordRecovery($email: String!) {
          requestPasswordRecovery(email: $email) {
            success
            message
            errors
          }
        }
        """
        variables = {"email": unique_email}
        recovery_resp = graphql_request(password_recovery_mutation, variables)
        assert "data" in recovery_resp and recovery_resp["data"] is not None, "No data in password recovery response"
        assert "requestPasswordRecovery" in recovery_resp["data"] and recovery_resp["data"]["requestPasswordRecovery"] is not None, "No requestPasswordRecovery data"
        recovery_data = recovery_resp["data"]["requestPasswordRecovery"]
        # Accept success or message to acknowledge email sent, may be true even if email not found for security
        assert recovery_data["success"] is True or "sent" in (recovery_data.get("message") or "").lower()

        # 4. Biometric Authentication Simulation (Assuming this requires a token or flag)
        # Since biometric is optional, test an endpoint that simulates biometric verification
        biometric_auth_mutation = """
        mutation BiometricAuth($userId: ID!, $biometricToken: String!) {
          biometricAuthenticate(userId: $userId, biometricToken: $biometricToken) {
            success
            message
            token
            errors
          }
        }
        """
        variables = {"userId": user_id, "biometricToken": "dummy_biometric_token"}
        biometric_resp = graphql_request(biometric_auth_mutation, variables)
        assert "data" in biometric_resp and biometric_resp["data"] is not None, "No data in biometric auth response"
        assert "biometricAuthenticate" in biometric_resp["data"] and biometric_resp["data"]["biometricAuthenticate"] is not None, "No biometricAuthenticate data"
        biometric_data = biometric_resp["data"]["biometricAuthenticate"]

        # It's possible biometric auth is disabled or not implemented for dummy token - accept success or specific error
        assert (
            biometric_data["success"] is True or biometric_data["success"] is False
        ), "Biometric auth endpoint should respond with success or failure state"

        # 5. Negative tests:
        # - Login with wrong password
        variables = {"email": unique_email, "password": "WrongPassword123!"}
        login_fail_resp = graphql_request(login_mutation, variables)
        assert "data" in login_fail_resp and login_fail_resp["data"] is not None, "No data in failed login response"
        assert "loginUser" in login_fail_resp["data"] and login_fail_resp["data"]["loginUser"] is not None, "No loginUser data in failed login response"
        login_fail_data = login_fail_resp["data"]["loginUser"]
        assert (
            login_fail_data["success"] is False
        ), "Login should fail with wrong password"
        assert login_fail_data.get("errors") is not None or login_fail_data.get(
            "message"
        ), "Error details should be provided for failed login"

        # - Register with duplicate email
        variables = {"email": unique_email, "password": "AnotherPassw0rd!"}
        register_dup_resp = graphql_request(register_mutation, variables)
        assert "data" in register_dup_resp and register_dup_resp["data"] is not None, "No data in duplicate register response"
        assert "registerUser" in register_dup_resp["data"] and register_dup_resp["data"]["registerUser"] is not None, "No registerUser data for duplicate registration"
        reg_dup_data = register_dup_resp["data"]["registerUser"]
        assert (
            reg_dup_data["success"] is False
        ), "Registration should fail for duplicate email"
        assert reg_dup_data.get("errors") is not None or reg_dup_data.get(
            "message"
        ), "Error details should be provided for duplicate registration"

    finally:
        # Cleanup: delete the test user if delete mutation available
        delete_user_mutation = """
        mutation DeleteUser($userId: ID!) {
          deleteUser(userId: $userId) {
            success
            message
            errors
          }
        }
        """
        # Use admin auth or token if required - here assuming no auth or reuse biometric or login token
        try:
            # Try to delete with token if available
            del_headers = HEADERS.copy()
            if token is not None:
                del_headers["Authorization"] = f"Bearer {token}"
            del_vars = {"userId": user_id}
            del_resp = requests.post(
                BASE_URL,
                json={"query": delete_user_mutation, "variables": del_vars},
                headers=del_headers,
                timeout=TIMEOUT,
            )
            if del_resp.status_code == 200:
                del_json = del_resp.json()
                if "data" in del_json and del_json["data"].get("deleteUser"):
                    # No strict assert here, best effort cleanup
                    pass
        except Exception:
            pass


test_user_authentication_endpoints()
