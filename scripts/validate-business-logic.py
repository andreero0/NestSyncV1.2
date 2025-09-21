#!/usr/bin/env python3
"""
NestSync Business Logic Validation System
Prevents missing default data and business rule consistency failures

This script validates business logic patterns to prevent P1 failures like:
1. Missing Default Notification Preferences
2. User onboarding flow gaps
3. PIPEDA compliance initialization
4. Canadian context requirements
"""

import sys
import asyncio
import json
import requests
from pathlib import Path
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class BusinessRuleValidation:
    rule_name: str
    passed: bool
    details: str
    severity: str  # 'critical', 'high', 'medium', 'low'
    recovery_action: Optional[str] = None


@dataclass
class UserFlowValidation:
    flow_name: str
    steps_completed: List[str]
    steps_failed: List[str]
    compliance_status: Dict[str, bool]


class BusinessLogicValidator:
    def __init__(self, project_root: Path):
        self.project_root = project_root
        self.backend_url = "http://localhost:8001"
        self.test_credentials = {
            "email": "parents@nestsync.com",
            "password": "Shazam11#"
        }

        # Business rules from bottlenecks.md and CLAUDE.md
        self.required_default_preferences = {
            "notifications_enabled": True,
            "critical_notifications": True,
            "important_notifications": True,
            "optional_notifications": False,
            "push_notifications": True,
            "email_notifications": True,
            "sms_notifications": False,
            "quiet_hours_enabled": True,
            "stock_alert_enabled": True,
            "stock_alert_threshold": 3,
            "change_reminder_enabled": False,
            "expiry_warning_enabled": True,
            "health_tips_enabled": False,
            "marketing_enabled": False,
            "user_timezone": "America/Toronto",
            "daily_notification_limit": 10,
            "notification_consent_granted": False,
            "marketing_consent_granted": False
        }

        # Canadian compliance requirements
        self.pipeda_requirements = {
            "consent_records_table": True,
            "data_residency_canada": True,
            "privacy_policy_acceptance": True,
            "data_deletion_capability": True,
            "audit_trail_logging": True
        }

    async def authenticate_test_user(self) -> Optional[str]:
        """Authenticate test user and return access token"""
        try:
            response = requests.post(
                f"{self.backend_url}/graphql",
                headers={"Content-Type": "application/json"},
                json={
                    "query": """
                        mutation SignIn($email: String!, $password: String!) {
                            signIn(email: $email, password: $password) {
                                success
                                accessToken
                                message
                            }
                        }
                    """,
                    "variables": self.test_credentials
                },
                timeout=10
            )

            if response.status_code == 200:
                data = response.json()
                if data.get("data", {}).get("signIn", {}).get("success"):
                    return data["data"]["signIn"]["accessToken"]

            logger.error(f"Authentication failed: {response.text}")
            return None

        except Exception as e:
            logger.error(f"Authentication error: {e}")
            return None

    async def validate_default_preferences_creation(self, access_token: str) -> BusinessRuleValidation:
        """Validate that default notification preferences are created for users"""
        try:
            # Query user's notification preferences
            response = requests.post(
                f"{self.backend_url}/graphql",
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {access_token}"
                },
                json={
                    "query": """
                        query GetNotificationPreferences {
                            getNotificationPreferences {
                                notificationsEnabled
                                criticalNotifications
                                importantNotifications
                                optionalNotifications
                                pushNotifications
                                emailNotifications
                                smsNotifications
                                quietHoursEnabled
                                stockAlertEnabled
                                stockAlertThreshold
                                changeReminderEnabled
                                expiryWarningEnabled
                                healthTipsEnabled
                                marketingEnabled
                                userTimezone
                                dailyNotificationLimit
                                notificationConsentGranted
                                marketingConsentGranted
                            }
                        }
                    """
                },
                timeout=10
            )

            if response.status_code != 200:
                return BusinessRuleValidation(
                    rule_name="Default Preferences Creation",
                    passed=False,
                    details=f"GraphQL request failed: {response.status_code}",
                    severity="critical",
                    recovery_action="Check GraphQL schema and resolver implementation"
                )

            data = response.json()

            if "errors" in data:
                return BusinessRuleValidation(
                    rule_name="Default Preferences Creation",
                    passed=False,
                    details=f"GraphQL errors: {data['errors']}",
                    severity="critical",
                    recovery_action="Fix GraphQL field naming or resolver logic"
                )

            preferences = data.get("data", {}).get("getNotificationPreferences")

            if not preferences:
                return BusinessRuleValidation(
                    rule_name="Default Preferences Creation",
                    passed=False,
                    details="No notification preferences found for user",
                    severity="critical",
                    recovery_action="Implement get_or_create_notification_preferences pattern"
                )

            # Validate against expected defaults
            validation_details = []
            for key, expected_value in self.required_default_preferences.items():
                # Convert snake_case to camelCase for comparison
                camel_key = self.snake_to_camel(key)
                actual_value = preferences.get(camel_key)

                if actual_value != expected_value:
                    validation_details.append(f"{key}: expected {expected_value}, got {actual_value}")

            if validation_details:
                return BusinessRuleValidation(
                    rule_name="Default Preferences Creation",
                    passed=False,
                    details=f"Default preference mismatches: {validation_details}",
                    severity="high",
                    recovery_action="Update default preference creation logic"
                )

            return BusinessRuleValidation(
                rule_name="Default Preferences Creation",
                passed=True,
                details="All default preferences created correctly",
                severity="low"
            )

        except Exception as e:
            return BusinessRuleValidation(
                rule_name="Default Preferences Creation",
                passed=False,
                details=f"Validation failed: {e}",
                severity="critical",
                recovery_action="Check database connectivity and resolver implementation"
            )

    def snake_to_camel(self, snake_str: str) -> str:
        """Convert snake_case to camelCase"""
        components = snake_str.split('_')
        return components[0] + ''.join(word.capitalize() for word in components[1:])

    async def validate_pipeda_compliance_initialization(self, access_token: str) -> BusinessRuleValidation:
        """Validate PIPEDA compliance requirements are properly initialized"""
        try:
            # Test user profile query to check consent tracking
            response = requests.post(
                f"{self.backend_url}/graphql",
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {access_token}"
                },
                json={
                    "query": """
                        query Me {
                            me {
                                id
                                email
                                profile {
                                    full_name
                                }
                                consentRecords {
                                    consentType
                                    consentGranted
                                    consentDate
                                    dataResidencyRegion
                                }
                            }
                        }
                    """
                },
                timeout=10
            )

            if response.status_code != 200:
                return BusinessRuleValidation(
                    rule_name="PIPEDA Compliance Initialization",
                    passed=False,
                    details=f"Cannot verify compliance: HTTP {response.status_code}",
                    severity="critical",
                    recovery_action="Check GraphQL me query implementation"
                )

            data = response.json()
            user_data = data.get("data", {}).get("me")

            if not user_data:
                return BusinessRuleValidation(
                    rule_name="PIPEDA Compliance Initialization",
                    passed=False,
                    details="Cannot access user data for compliance verification",
                    severity="critical",
                    recovery_action="Check authentication and user resolver"
                )

            compliance_issues = []

            # Check consent records
            consent_records = user_data.get("consentRecords", [])
            if not consent_records:
                compliance_issues.append("No consent records found")

            # Validate Canadian data residency
            canadian_residency = any(
                record.get("dataResidencyRegion") == "Canada"
                for record in consent_records
            )
            if not canadian_residency:
                compliance_issues.append("Canadian data residency not confirmed")

            # Check required consent types
            consent_types = {record.get("consentType") for record in consent_records}
            required_consents = {"privacy_policy", "data_processing", "notifications"}
            missing_consents = required_consents - consent_types

            if missing_consents:
                compliance_issues.append(f"Missing consent types: {missing_consents}")

            if compliance_issues:
                return BusinessRuleValidation(
                    rule_name="PIPEDA Compliance Initialization",
                    passed=False,
                    details=f"PIPEDA compliance issues: {compliance_issues}",
                    severity="critical",
                    recovery_action="Implement proper consent management and Canadian data residency"
                )

            return BusinessRuleValidation(
                rule_name="PIPEDA Compliance Initialization",
                passed=True,
                details="PIPEDA compliance properly initialized",
                severity="low"
            )

        except Exception as e:
            return BusinessRuleValidation(
                rule_name="PIPEDA Compliance Initialization",
                passed=False,
                details=f"PIPEDA validation failed: {e}",
                severity="critical",
                recovery_action="Check consent management implementation"
            )

    async def validate_canadian_context_requirements(self) -> BusinessRuleValidation:
        """Validate Canadian context and timezone requirements"""
        try:
            # Check backend configuration for Canadian settings
            response = requests.get(
                f"{self.backend_url}/health",
                timeout=10
            )

            if response.status_code != 200:
                return BusinessRuleValidation(
                    rule_name="Canadian Context Requirements",
                    passed=False,
                    details="Cannot verify backend Canadian configuration",
                    severity="medium",
                    recovery_action="Implement health endpoint with configuration details"
                )

            # Test timezone handling
            test_response = requests.post(
                f"{self.backend_url}/graphql",
                headers={"Content-Type": "application/json"},
                json={
                    "query": """
                        query TestCanadianContext {
                            __schema {
                                types {
                                    name
                                }
                            }
                        }
                    """
                },
                timeout=10
            )

            if test_response.status_code != 200:
                return BusinessRuleValidation(
                    rule_name="Canadian Context Requirements",
                    passed=False,
                    details="GraphQL endpoint not responding for Canadian context validation",
                    severity="medium",
                    recovery_action="Check GraphQL server configuration"
                )

            # Validate server response headers for Canadian compliance
            headers = test_response.headers
            server_header = headers.get("server", "").lower()

            # Check for Canadian-specific configurations
            canadian_indicators = [
                "canada" in server_header,
                any("toronto" in str(v).lower() for v in headers.values()),
                any("america/toronto" in str(v).lower() for v in headers.values())
            ]

            if not any(canadian_indicators):
                return BusinessRuleValidation(
                    rule_name="Canadian Context Requirements",
                    passed=False,
                    details="No Canadian context indicators found in server configuration",
                    severity="medium",
                    recovery_action="Configure server with Canadian timezone and context headers"
                )

            return BusinessRuleValidation(
                rule_name="Canadian Context Requirements",
                passed=True,
                details="Canadian context requirements satisfied",
                severity="low"
            )

        except Exception as e:
            return BusinessRuleValidation(
                rule_name="Canadian Context Requirements",
                passed=False,
                details=f"Canadian context validation failed: {e}",
                severity="medium",
                recovery_action="Configure Canadian timezone and server settings"
            )

    async def validate_user_onboarding_flow(self, access_token: str) -> UserFlowValidation:
        """Validate complete user onboarding flow"""
        completed_steps = []
        failed_steps = []
        compliance_status = {}

        try:
            # Test onboarding status query
            response = requests.post(
                f"{self.backend_url}/graphql",
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {access_token}"
                },
                json={
                    "query": """
                        query OnboardingStatus {
                            onboardingStatus {
                                currentStep
                                completedSteps
                                isComplete
                                profileComplete
                                childrenAdded
                                notificationPreferencesSet
                                privacyPolicyAccepted
                            }
                        }
                    """
                },
                timeout=10
            )

            if response.status_code == 200:
                data = response.json()
                onboarding_data = data.get("data", {}).get("onboardingStatus")

                if onboarding_data:
                    completed_steps.extend(onboarding_data.get("completedSteps", []))

                    # Check compliance status
                    compliance_status.update({
                        "profile_complete": onboarding_data.get("profileComplete", False),
                        "children_added": onboarding_data.get("childrenAdded", False),
                        "notification_preferences_set": onboarding_data.get("notificationPreferencesSet", False),
                        "privacy_policy_accepted": onboarding_data.get("privacyPolicyAccepted", False)
                    })
                else:
                    failed_steps.append("onboarding_status_query")
            else:
                failed_steps.append("onboarding_status_access")

        except Exception as e:
            failed_steps.append(f"onboarding_validation_error: {e}")

        return UserFlowValidation(
            flow_name="User Onboarding",
            steps_completed=completed_steps,
            steps_failed=failed_steps,
            compliance_status=compliance_status
        )

    async def run_validation(self) -> bool:
        """Run complete business logic validation"""
        print("🔍 NestSync Business Logic Validation")
        print("=" * 50)

        all_passed = True
        critical_failures = []
        high_priority_issues = []

        # 1. Authenticate test user
        print("🔑 Authenticating test user...")
        access_token = await self.authenticate_test_user()

        if not access_token:
            print("❌ Cannot authenticate test user")
            print("🔧 Recovery: Check authentication system and test credentials")
            return False

        print("✅ Test user authenticated successfully")

        # 2. Validate default preferences creation
        print("🎛️  Validating default preferences creation...")
        preferences_validation = await self.validate_default_preferences_creation(access_token)

        if preferences_validation.passed:
            print("✅ Default preferences validation passed")
        else:
            print(f"❌ Default preferences validation failed: {preferences_validation.details}")
            if preferences_validation.severity == "critical":
                critical_failures.append(preferences_validation)
                all_passed = False
            elif preferences_validation.severity == "high":
                high_priority_issues.append(preferences_validation)

        # 3. Validate PIPEDA compliance
        print("🇨🇦 Validating PIPEDA compliance initialization...")
        pipeda_validation = await self.validate_pipeda_compliance_initialization(access_token)

        if pipeda_validation.passed:
            print("✅ PIPEDA compliance validation passed")
        else:
            print(f"❌ PIPEDA compliance validation failed: {pipeda_validation.details}")
            if pipeda_validation.severity == "critical":
                critical_failures.append(pipeda_validation)
                all_passed = False

        # 4. Validate Canadian context
        print("🍁 Validating Canadian context requirements...")
        canadian_validation = await self.validate_canadian_context_requirements()

        if canadian_validation.passed:
            print("✅ Canadian context validation passed")
        else:
            print(f"❌ Canadian context validation failed: {canadian_validation.details}")
            if canadian_validation.severity == "critical":
                critical_failures.append(canadian_validation)
                all_passed = False

        # 5. Validate user onboarding flow
        print("👶 Validating user onboarding flow...")
        onboarding_validation = await self.validate_user_onboarding_flow(access_token)

        if onboarding_validation.steps_failed:
            print(f"❌ Onboarding flow issues: {onboarding_validation.steps_failed}")
            all_passed = False
        else:
            print("✅ User onboarding flow validation passed")

        # Print compliance status
        if onboarding_validation.compliance_status:
            print("📊 Compliance Status:")
            for key, status in onboarding_validation.compliance_status.items():
                print(f"   {key}: {'✅' if status else '❌'}")

        # 6. Generate recovery recommendations
        if critical_failures or high_priority_issues:
            print("\n🔧 Recovery Actions Needed:")

            for failure in critical_failures:
                print(f"🚨 CRITICAL: {failure.rule_name}")
                print(f"   Issue: {failure.details}")
                if failure.recovery_action:
                    print(f"   Action: {failure.recovery_action}")

            for issue in high_priority_issues:
                print(f"⚠️  HIGH: {issue.rule_name}")
                print(f"   Issue: {issue.details}")
                if issue.recovery_action:
                    print(f"   Action: {issue.recovery_action}")

        # Final status
        print("\n" + "=" * 50)
        if all_passed:
            print("✅ All business logic validations passed")
            return True
        else:
            print("❌ Business logic validation failed")
            print(f"Critical failures: {len(critical_failures)}")
            print(f"High priority issues: {len(high_priority_issues)}")
            return False


async def main():
    """Main entry point"""
    if len(sys.argv) > 1:
        project_root = Path(sys.argv[1])
    else:
        project_root = Path(__file__).parent.parent

    validator = BusinessLogicValidator(project_root)

    if not await validator.run_validation():
        sys.exit(1)

    print("\n🎉 Business logic validation completed successfully!")


if __name__ == "__main__":
    asyncio.run(main())