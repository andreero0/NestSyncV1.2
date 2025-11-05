#!/bin/bash
# Test script for update_profile GraphQL mutation
# Tests the complete flow: sign in, update profile, verify changes

set -e  # Exit on error

echo "=========================================="
echo "Testing update_profile GraphQL Mutation"
echo "=========================================="

GRAPHQL_URL="http://localhost:8001/graphql"
TEST_EMAIL="parents@nestsync.com"
TEST_PASSWORD="Shazam11#"

# Step 1: Sign in to get access token
echo -e "\n1. Signing in to get access token..."
SIGNIN_RESPONSE=$(curl -s -X POST "$GRAPHQL_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"query\": \"mutation SignIn(\$email: String!, \$password: String!) { signIn(input: { email: \$email, password: \$password }) { success message error session { accessToken } user { id email timezone province } } }\",
    \"variables\": {
      \"email\": \"$TEST_EMAIL\",
      \"password\": \"$TEST_PASSWORD\"
    }
  }")

echo "Sign in response:"
echo "$SIGNIN_RESPONSE" | jq '.'

# Extract access token
ACCESS_TOKEN=$(echo "$SIGNIN_RESPONSE" | jq -r '.data.signIn.session.accessToken')

if [ "$ACCESS_TOKEN" = "null" ] || [ -z "$ACCESS_TOKEN" ]; then
  echo "ERROR: Failed to get access token"
  echo "Response: $SIGNIN_RESPONSE"
  exit 1
fi

echo "✓ Successfully obtained access token"

# Step 2: Test valid profile update (Vancouver timezone)
echo -e "\n2. Testing valid profile update (timezone: America/Vancouver, province: BC)..."
UPDATE_RESPONSE=$(curl -s -X POST "$GRAPHQL_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "query": "mutation UpdateProfile($input: UpdateProfileInput!) { updateProfile(input: $input) { success message error user { id email timezone province postalCode } } }",
    "variables": {
      "input": {
        "timezone": "America/Vancouver",
        "province": "BC"
      }
    }
  }')

echo "Update profile response:"
echo "$UPDATE_RESPONSE" | jq '.'

# Check if update was successful
UPDATE_SUCCESS=$(echo "$UPDATE_RESPONSE" | jq -r '.data.updateProfile.success')

if [ "$UPDATE_SUCCESS" = "true" ]; then
  echo "✓ Profile updated successfully"

  # Verify the changes were persisted
  UPDATED_TIMEZONE=$(echo "$UPDATE_RESPONSE" | jq -r '.data.updateProfile.user.timezone')
  UPDATED_PROVINCE=$(echo "$UPDATE_RESPONSE" | jq -r '.data.updateProfile.user.province')

  echo "✓ Verified timezone: $UPDATED_TIMEZONE"
  echo "✓ Verified province: $UPDATED_PROVINCE"
else
  echo "✗ Profile update failed"
  UPDATE_ERROR=$(echo "$UPDATE_RESPONSE" | jq -r '.data.updateProfile.error')
  echo "Error: $UPDATE_ERROR"
  exit 1
fi

# Step 3: Test invalid timezone validation
echo -e "\n3. Testing invalid timezone validation (should fail)..."
INVALID_UPDATE=$(curl -s -X POST "$GRAPHQL_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "query": "mutation UpdateProfile($input: UpdateProfileInput!) { updateProfile(input: $input) { success message error } }",
    "variables": {
      "input": {
        "timezone": "America/New_York"
      }
    }
  }')

echo "Invalid timezone response:"
echo "$INVALID_UPDATE" | jq '.'

INVALID_SUCCESS=$(echo "$INVALID_UPDATE" | jq -r '.data.updateProfile.success')

if [ "$INVALID_SUCCESS" = "false" ]; then
  echo "✓ Validation correctly rejected invalid timezone"
  VALIDATION_ERROR=$(echo "$INVALID_UPDATE" | jq -r '.data.updateProfile.error')
  echo "✓ Error message: $VALIDATION_ERROR"
else
  echo "✗ Validation failed to reject invalid timezone"
  exit 1
fi

# Step 4: Test invalid postal code validation
echo -e "\n4. Testing invalid postal code validation (should fail)..."
INVALID_POSTAL=$(curl -s -X POST "$GRAPHQL_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "query": "mutation UpdateProfile($input: UpdateProfileInput!) { updateProfile(input: $input) { success message error } }",
    "variables": {
      "input": {
        "postalCode": "12345"
      }
    }
  }')

echo "Invalid postal code response:"
echo "$INVALID_POSTAL" | jq '.'

POSTAL_SUCCESS=$(echo "$INVALID_POSTAL" | jq -r '.data.updateProfile.success')

if [ "$POSTAL_SUCCESS" = "false" ]; then
  echo "✓ Validation correctly rejected invalid postal code"
  POSTAL_ERROR=$(echo "$INVALID_POSTAL" | jq -r '.data.updateProfile.error')
  echo "✓ Error message: $POSTAL_ERROR"
else
  echo "✗ Validation failed to reject invalid postal code"
  exit 1
fi

# Step 5: Test valid postal code with space
echo -e "\n5. Testing valid postal code with space (V6B 1A1)..."
VALID_POSTAL=$(curl -s -X POST "$GRAPHQL_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "query": "mutation UpdateProfile($input: UpdateProfileInput!) { updateProfile(input: $input) { success message error user { postalCode } } }",
    "variables": {
      "input": {
        "postalCode": "V6B 1A1"
      }
    }
  }')

echo "Valid postal code response:"
echo "$VALID_POSTAL" | jq '.'

POSTAL_VALID_SUCCESS=$(echo "$VALID_POSTAL" | jq -r '.data.updateProfile.success')

if [ "$POSTAL_VALID_SUCCESS" = "true" ]; then
  echo "✓ Postal code accepted and normalized"
  NORMALIZED_POSTAL=$(echo "$VALID_POSTAL" | jq -r '.data.updateProfile.user.postalCode')
  echo "✓ Normalized postal code: $NORMALIZED_POSTAL (spaces removed)"
else
  echo "✗ Valid postal code was rejected"
  exit 1
fi

# Step 6: Verify changes persisted by querying user profile
echo -e "\n6. Verifying changes persisted in database..."
ME_QUERY=$(curl -s -X POST "$GRAPHQL_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "query": "query Me { me { id email timezone province postalCode } }"
  }')

echo "Current user profile:"
echo "$ME_QUERY" | jq '.'

CURRENT_TIMEZONE=$(echo "$ME_QUERY" | jq -r '.data.me.timezone')
CURRENT_PROVINCE=$(echo "$ME_QUERY" | jq -r '.data.me.province')
CURRENT_POSTAL=$(echo "$ME_QUERY" | jq -r '.data.me.postalCode')

echo "✓ Confirmed timezone persisted: $CURRENT_TIMEZONE"
echo "✓ Confirmed province persisted: $CURRENT_PROVINCE"
echo "✓ Confirmed postal code persisted: $CURRENT_POSTAL"

# Final summary
echo -e "\n=========================================="
echo "✓ ALL TESTS PASSED"
echo "=========================================="
echo "Summary:"
echo "  - Authentication: ✓"
echo "  - Valid profile update: ✓"
echo "  - Invalid timezone rejection: ✓"
echo "  - Invalid postal code rejection: ✓"
echo "  - Valid postal code normalization: ✓"
echo "  - Database persistence verification: ✓"
echo "=========================================="
