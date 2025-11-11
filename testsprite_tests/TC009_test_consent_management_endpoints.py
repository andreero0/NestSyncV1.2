import requests

BASE_URL = "http://localhost:8001/graphql"
TIMEOUT = 30

# Sample user credentials for authentication (adjust as needed)
TEST_USER_EMAIL = "testuser@example.com"
TEST_USER_PASSWORD = "TestPassword123!"

def authenticate_user(email: str, password: str) -> str:
    """Authenticate user and return auth token."""
    query = """
    mutation($input: SignInInput!) {
      signIn(input: $input) {
        accessToken
        tokenType
      }
    }
    """
    variables = {"input": {"email": email, "password": password}}
    response = requests.post(BASE_URL, json={"query": query, "variables": variables}, timeout=TIMEOUT)
    response.raise_for_status()
    data = response.json()
    assert "errors" not in data, f"Login errors: {data.get('errors')}"
    token = data["data"]["signIn"]["accessToken"]
    assert token, "No access token returned"
    return token

def create_consent(auth_token: str, consent_type: str, granted: bool) -> str:
    """Create a new consent record, returns the consent ID."""
    mutation = """
    mutation($input: ConsentCreateInput!) {
      createConsent(input: $input) {
        id
        consentType
        granted
        timestamp
      }
    }
    """
    variables = {
        "input": {
            "consentType": consent_type,
            "granted": granted
        }
    }
    headers = {"Authorization": f"Bearer {auth_token}"}
    response = requests.post(BASE_URL, json={"query": mutation, "variables": variables}, headers=headers, timeout=TIMEOUT)
    response.raise_for_status()
    data = response.json()
    assert "errors" not in data, f"Create consent errors: {data.get('errors')}"
    consent = data["data"]["createConsent"]
    assert consent["consentType"] == consent_type
    assert consent["granted"] == granted
    assert consent["id"]
    return consent["id"]

def query_consent(auth_token: str, consent_id: str) -> dict:
    """Retrieve consent details by ID."""
    query = """
    query($id: ID!) {
      consent(id: $id) {
        id
        consentType
        granted
        timestamp
        auditTrail {
          change
          changedAt
          changedBy
        }
      }
    }
    """
    variables = {"id": consent_id}
    headers = {"Authorization": f"Bearer {auth_token}"}
    response = requests.post(BASE_URL, json={"query": query, "variables": variables}, headers=headers, timeout=TIMEOUT)
    response.raise_for_status()
    data = response.json()
    assert "errors" not in data, f"Query consent errors: {data.get('errors')}"
    consent = data["data"]["consent"]
    assert consent["id"] == consent_id
    return consent

def update_consent(auth_token: str, consent_id: str, granted: bool) -> dict:
    """Update consent granted status."""
    mutation = """
    mutation($id: ID!, $input: ConsentUpdateInput!) {
      updateConsent(id: $id, input: $input) {
        id
        granted
        timestamp
      }
    }
    """
    variables = {"id": consent_id, "input": {"granted": granted}}
    headers = {"Authorization": f"Bearer {auth_token}"}
    response = requests.post(BASE_URL, json={"query": mutation, "variables": variables}, headers=headers, timeout=TIMEOUT)
    response.raise_for_status()
    data = response.json()
    assert "errors" not in data, f"Update consent errors: {data.get('errors')}"
    updated_consent = data["data"]["updateConsent"]
    assert updated_consent["id"] == consent_id
    assert updated_consent["granted"] == granted
    return updated_consent

def delete_consent(auth_token: str, consent_id: str) -> bool:
    """Delete consent record."""
    mutation = """
    mutation($id: ID!) {
      deleteConsent(id: $id)
    }
    """
    variables = {"id": consent_id}
    headers = {"Authorization": f"Bearer {auth_token}"}
    response = requests.post(BASE_URL, json={"query": mutation, "variables": variables}, headers=headers, timeout=TIMEOUT)
    response.raise_for_status()
    data = response.json()
    assert "errors" not in data, f"Delete consent errors: {data.get('errors')}"
    return data["data"]["deleteConsent"]

def jit_consent_prompt(auth_token: str, prompt_type: str) -> dict:
    """Simulate fetching a just-in-time consent prompt."""
    query = """
    query($promptType: String!) {
      jitConsentPrompt(promptType: $promptType) {
        promptId
        title
        description
        required
      }
    }
    """
    variables = {"promptType": prompt_type}
    headers = {"Authorization": f"Bearer {auth_token}"}
    response = requests.post(BASE_URL, json={"query": query, "variables": variables}, headers=headers, timeout=TIMEOUT)
    response.raise_for_status()
    data = response.json()
    assert "errors" not in data, f"JIT Consent Prompt errors: {data.get('errors')}"
    prompt = data["data"]["jitConsentPrompt"]
    assert prompt["promptId"]
    assert isinstance(prompt["required"], bool)
    return prompt

def request_data_portability(auth_token: str) -> dict:
    """Request user data for data portability."""
    query = """
    mutation {
      requestDataPortability {
        downloadUrl
        expiresAt
      }
    }
    """
    headers = {"Authorization": f"Bearer {auth_token}"}
    response = requests.post(BASE_URL, json={"query": query}, headers=headers, timeout=TIMEOUT)
    response.raise_for_status()
    data = response.json()
    assert "errors" not in data, f"Data portability request errors: {data.get('errors')}"
    portability = data["data"]["requestDataPortability"]
    assert portability["downloadUrl"]
    assert portability["expiresAt"]
    return portability

def test_consent_management_endpoints():
    # Authenticate the test user
    token = authenticate_user(TEST_USER_EMAIL, TEST_USER_PASSWORD)

    # Consent type to test (example: "data_sharing")
    consent_type = "data_sharing"

    consent_id = None
    try:
        # Create consent (grant = True)
        consent_id = create_consent(token, consent_type, True)

        # Retrieve and verify consent and audit trail present
        consent = query_consent(token, consent_id)
        assert consent["consentType"] == consent_type
        assert consent["granted"] is True
        assert isinstance(consent["auditTrail"], list)

        # Update consent to revoke (granted = False)
        updated_consent = update_consent(token, consent_id, False)
        assert updated_consent["granted"] is False

        # Fetch Just-in-Time consent prompt for a privacy setting
        jit_prompt = jit_consent_prompt(token, prompt_type="data_sharing")
        assert "title" in jit_prompt and "description" in jit_prompt

        # Request data portability export for the user
        portability_info = request_data_portability(token)
        assert portability_info["downloadUrl"].startswith("http")
        assert portability_info["expiresAt"]

    finally:
        # Cleanup: delete created consent if exists
        if consent_id:
            try:
                deleted = delete_consent(token, consent_id)
                assert deleted is True
            except Exception:
                pass

test_consent_management_endpoints()