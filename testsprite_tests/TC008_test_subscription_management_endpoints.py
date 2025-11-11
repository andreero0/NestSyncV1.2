import requests
import json

BASE_URL = "http://localhost:8001/graphql"
AUTH_TOKEN = None  # To be set after login or from environment/config

HEADERS = {
    "Content-Type": "application/json",
    "Authorization": "",  # will be set once auth token acquired
}
TIMEOUT = 30


def graphql_request(query: str, variables: dict = None):
    payload = {"query": query}
    if variables:
        payload["variables"] = variables
    response = requests.post(BASE_URL, headers=HEADERS, json=payload, timeout=TIMEOUT)
    response.raise_for_status()
    result = response.json()
    if "errors" in result:
        raise Exception(f"GraphQL errors: {result['errors']}")
    return result["data"]


def authenticate_user_and_set_token():
    login_mutation = """
    mutation signIn($input: SignInInput!) {
      signIn(input: $input) {
        token
        user {
          id
          email
        }
      }
    }
    """
    variables = {
        "input": {
            "email": "testuser@example.com",
            "password": "TestPassword123!",
        }
    }
    resp = requests.post(
        BASE_URL,
        headers={"Content-Type": "application/json"},
        json={"query": login_mutation, "variables": variables},
        timeout=TIMEOUT,
    )
    resp.raise_for_status()
    data = resp.json()
    assert "errors" not in data, f"Login failed with errors: {data.get('errors')}"
    token = data.get("data", {}).get("signIn", {}).get("token")
    assert token, "No access token received on login"
    global AUTH_TOKEN
    AUTH_TOKEN = token
    HEADERS["Authorization"] = f"Bearer {AUTH_TOKEN}"


def create_subscription_trial():
    mutation = """
    mutation startTrial {
      subscriptionStartTrial {
        trialActive
        trialEndDate
      }
    }
    """
    return graphql_request(mutation)


def create_payment_method(card_number, exp_month, exp_year, cvc):
    mutation = """
    mutation addPaymentMethod($input: PaymentMethodInput!) {
      addPaymentMethod(input: $input) {
        id
        brand
        last4
        expMonth
        expYear
        isDefault
      }
    }
    """
    variables = {
        "input": {
            "cardNumber": card_number,
            "expMonth": exp_month,
            "expYear": exp_year,
            "cvc": cvc,
            "billingCountry": "CA"
        }
    }
    return graphql_request(mutation, variables)


def list_payment_methods():
    query = """
    query {
      paymentMethods {
        id
        brand
        last4
        expMonth
        expYear
        isDefault
      }
    }
    """
    return graphql_request(query)


def activate_feature_access(featureKey: str):
    mutation = """
    mutation activateFeature($featureKey: String!) {
      subscriptionActivateFeatureAccess(featureKey: $featureKey) {
        featureKey
        enabled
      }
    }
    """
    variables = {"featureKey": featureKey}
    return graphql_request(mutation, variables)


def fetch_billing_history():
    query = """
    query {
      billingHistory {
        id
        date
        amount
        currency
        status
        taxAmount
        taxRate
      }
    }
    """
    return graphql_request(query)


def test_subscription_management_endpoints():
    try:
        # Authenticate user and set auth token header
        authenticate_user_and_set_token()

        # Activate Subscription Trial
        trial_data = create_subscription_trial()
        assert "subscriptionStartTrial" in trial_data, "Trial activation failed"
        trial = trial_data["subscriptionStartTrial"]
        assert trial["trialActive"] is True, "Trial is not active after activation"
        assert trial["trialEndDate"], "Trial end date missing"

        # Add a valid Canadian payment method (mock card)
        payment_method_data = create_payment_method(
            card_number="4242424242424242", exp_month=12, exp_year=2026, cvc="123"
        )
        pm = payment_method_data.get("addPaymentMethod")
        assert pm is not None, "Failed to add payment method"
        assert pm["brand"], "Payment method brand missing"
        assert pm["last4"] == "4242", "Payment method last4 incorrect"
        assert pm["expMonth"] == 12, "Expiration month mismatch"
        assert pm["expYear"] == 2026, "Expiration year mismatch"

        # Verify payment method appears in payment methods list
        pm_list_data = list_payment_methods()
        pm_list = pm_list_data.get("paymentMethods", [])
        assert any(p["id"] == pm["id"] for p in pm_list), "Added payment method not in list"

        # Activate a feature access (premium feature)
        feature_key = "premium_feature_ocr_receipt_scanning"
        feature_access_data = activate_feature_access(feature_key)
        fa = feature_access_data.get("subscriptionActivateFeatureAccess")
        assert fa is not None, "Feature access activation failed"
        assert fa["featureKey"] == feature_key, "Feature key mismatch"
        assert fa["enabled"] is True, "Feature access not enabled"

        # Fetch billing history and verify Canadian tax compliance fields
        billing_data = fetch_billing_history()
        history = billing_data.get("billingHistory", [])
        for entry in history:
            assert "taxAmount" in entry, "Tax amount missing in billing history"
            assert entry["taxAmount"] >= 0, "Invalid tax amount"
            assert "taxRate" in entry, "Tax rate missing in billing history"
            # Tax rate expected to be a valid percentage
            assert 0 <= entry["taxRate"] <= 0.15, "Tax rate outside expected Canadian range"

    except Exception as e:
        assert False, f"Test failed with exception: {e}"


test_subscription_management_endpoints()
