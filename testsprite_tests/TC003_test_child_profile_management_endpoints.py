import requests
import uuid

BASE_URL = "http://localhost:8001/graphql"
TIMEOUT = 30

USERNAME = "testuser@example.com"
PASSWORD = "TestPassword123!"

def get_auth_token():
    login_mutation = """
    mutation SignIn($input: SignInInput!) {
      signIn(input: $input) {
        user {
          id
          email
        }
      }
    }
    """
    variables = {"input": {"email": USERNAME, "password": PASSWORD}}
    response = requests.post(
        BASE_URL,
        json={"query": login_mutation, "variables": variables},
        timeout=TIMEOUT
    )
    response.raise_for_status()
    data = response.json()
    assert "errors" not in data, f"Login errors: {data.get('errors')}"

    user = data["data"]["signIn"]["user"]
    assert user is not None, "User missing in login response"
    assert user["email"] == USERNAME
    # As no token is returned per schema error, return None
    return None

def test_child_profile_management_endpoints():
    token = get_auth_token()
    headers = {}
    if token:
        headers = {"Authorization": f"Bearer {token}"}

    create_child_mutation = """
    mutation CreateChildProfile($input: ChildProfileInput!) {
      createChildProfile(input: $input) {
        id
        firstName
        lastName
        birthDate
        gender
      }
    }
    """
    get_child_query = """
    query GetChildProfile($id: ID!) {
      childProfile(id: $id) {
        id
        firstName
        lastName
        birthDate
        gender
      }
    }
    """
    update_child_mutation = """
    mutation UpdateChildProfile($id: ID!, $input: ChildProfileUpdateInput!) {
      updateChildProfile(id: $id, input: $input) {
        id
        firstName
        lastName
        birthDate
        gender
      }
    }
    """
    delete_child_mutation = """
    mutation DeleteChildProfile($id: ID!) {
      deleteChildProfile(id: $id) {
        success
        message
      }
    }
    """

    child_first_name = f"TestChild{uuid.uuid4().hex[:6]}"
    child_create_input = {
        "firstName": child_first_name,
        "lastName": "Tester",
        "birthDate": "2023-01-15",
        "gender": "Female"
    }

    child_id = None
    try:
        create_resp = requests.post(
            BASE_URL,
            headers=headers,
            json={"query": create_child_mutation, "variables": {"input": child_create_input}},
            timeout=TIMEOUT
        )
        create_resp.raise_for_status()
        create_data = create_resp.json()
        assert "errors" not in create_data, f"Create child profile errors: {create_data.get('errors')}"
        created_child = create_data["data"]["createChildProfile"]
        assert created_child["firstName"] == child_create_input["firstName"]
        assert created_child["lastName"] == child_create_input["lastName"]
        assert created_child["birthDate"] == child_create_input["birthDate"]
        assert created_child["gender"] == child_create_input["gender"]
        child_id = created_child["id"]
        assert child_id is not None

        get_resp = requests.post(
            BASE_URL,
            headers=headers,
            json={"query": get_child_query, "variables": {"id": child_id}},
            timeout=TIMEOUT
        )
        get_resp.raise_for_status()
        get_data = get_resp.json()
        assert "errors" not in get_data, f"Get child profile errors: {get_data.get('errors')}"
        fetched_child = get_data["data"]["childProfile"]
        assert fetched_child["id"] == child_id
        assert fetched_child["firstName"] == child_create_input["firstName"]
        assert fetched_child["lastName"] == child_create_input["lastName"]
        assert fetched_child["birthDate"] == child_create_input["birthDate"]
        assert fetched_child["gender"] == child_create_input["gender"]

        updated_first_name = child_first_name + "Updated"
        update_input = {
            "firstName": updated_first_name,
            "lastName": "TesterUpdated",
            "birthDate": "2023-01-20",
            "gender": "Female"
        }
        update_resp = requests.post(
            BASE_URL,
            headers=headers,
            json={"query": update_child_mutation, "variables": {"id": child_id, "input": update_input}},
            timeout=TIMEOUT
        )
        update_resp.raise_for_status()
        update_data = update_resp.json()
        assert "errors" not in update_data, f"Update child profile errors: {update_data.get('errors')}"
        updated_child = update_data["data"]["updateChildProfile"]
        assert updated_child["id"] == child_id
        assert updated_child["firstName"] == update_input["firstName"]
        assert updated_child["lastName"] == update_input["lastName"]
        assert updated_child["birthDate"] == update_input["birthDate"]
        assert updated_child["gender"] == update_input["gender"]

        get_resp_2 = requests.post(
            BASE_URL,
            headers=headers,
            json={"query": get_child_query, "variables": {"id": child_id}},
            timeout=TIMEOUT
        )
        get_resp_2.raise_for_status()
        get_data_2 = get_resp_2.json()
        assert "errors" not in get_data_2, f"Get child profile errors: {get_data_2.get('errors')}"
        fetched_child_2 = get_data_2["data"]["childProfile"]
        assert fetched_child_2["firstName"] == update_input["firstName"]
        assert fetched_child_2["lastName"] == update_input["lastName"]
        assert fetched_child_2["birthDate"] == update_input["birthDate"]
        assert fetched_child_2["gender"] == update_input["gender"]

        no_auth_resp = requests.post(
            BASE_URL,
            json={"query": get_child_query, "variables": {"id": child_id}},
            timeout=TIMEOUT
        )
        assert no_auth_resp.status_code == 200
        no_auth_data = no_auth_resp.json()
        assert "errors" in no_auth_data, "Expected permission error without auth"

    finally:
        if child_id:
            del_resp = requests.post(
                BASE_URL,
                headers=headers,
                json={"query": delete_child_mutation, "variables": {"id": child_id}},
                timeout=TIMEOUT
            )
            if del_resp.status_code == 200:
                _ = del_resp.json()


test_child_profile_management_endpoints()
