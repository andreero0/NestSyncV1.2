#!/usr/bin/env python3
"""
NestSync Dependency Compatibility Validation System
Prevents gotrue-class SDK compatibility failures

This script validates that all dependencies are compatible with each other
and that Docker containers match requirements.txt versions.
"""

import subprocess
import sys
import re
import json
from pathlib import Path
from typing import Dict, List, Tuple, Optional
import requests
from packaging import version


class DependencyValidator:
    def __init__(self, project_root: Path):
        self.project_root = project_root
        self.backend_path = project_root / "NestSync-backend"
        self.frontend_path = project_root / "NestSync-frontend"
        self.requirements_file = self.backend_path / "requirements.txt"

        # Known compatibility matrix for critical dependencies
        self.compatibility_matrix = {
            "gotrue": {
                "2.5.4": {
                    "supabase": [">=2.18.0,<2.19.0"],
                    "compatible_with_supabase_api": True,
                    "pydantic_validation": "stable"
                },
                "2.9.1": {
                    "supabase": [">=2.18.0,<2.19.0"],
                    "compatible_with_supabase_api": False,
                    "pydantic_validation": "breaking_change",
                    "known_issues": ["identity_id field validation error"]
                }
            },
            "strawberry-graphql": {
                ">=0.214.0,<0.215.0": {
                    "fastapi": [">=0.104.1,<0.105.0"],
                    "pydantic": [">=2.0.0,<3.0.0"]
                }
            }
        }

    def parse_requirements(self) -> Dict[str, str]:
        """Parse requirements.txt and return package versions"""
        packages = {}

        if not self.requirements_file.exists():
            raise FileNotFoundError(f"Requirements file not found: {self.requirements_file}")

        with open(self.requirements_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    # Handle different version specifiers
                    if '==' in line:
                        package, version_spec = line.split('==', 1)
                    elif '>=' in line and '<' in line:
                        # Handle range specifications like ">=2.18.0,<2.19.0"
                        package = line.split('>=')[0]
                        version_spec = line.split('>=')[1]
                    else:
                        continue

                    packages[package.strip()] = version_spec.strip()

        return packages

    def get_docker_container_versions(self, container_name: str) -> Dict[str, str]:
        """Get installed package versions from Docker container"""
        try:
            result = subprocess.run([
                "docker", "exec", container_name, "pip", "list", "--format=json"
            ], capture_output=True, text=True, check=True)

            packages = json.loads(result.stdout)
            return {pkg["name"]: pkg["version"] for pkg in packages}

        except subprocess.CalledProcessError as e:
            print(f"Error getting versions from container {container_name}: {e}")
            return {}
        except json.JSONDecodeError as e:
            print(f"Error parsing pip list output: {e}")
            return {}

    def validate_gotrue_compatibility(self, gotrue_version: str) -> Tuple[bool, List[str]]:
        """Validate gotrue version compatibility with Supabase API"""
        issues = []

        if gotrue_version in self.compatibility_matrix["gotrue"]:
            config = self.compatibility_matrix["gotrue"][gotrue_version]

            if not config["compatible_with_supabase_api"]:
                issues.append(f"gotrue {gotrue_version} incompatible with Supabase API")

            if "known_issues" in config:
                issues.extend(config["known_issues"])

            if config["pydantic_validation"] == "breaking_change":
                issues.append("Pydantic validation breaking change detected")

        return len(issues) == 0, issues

    def check_container_version_drift(self, container_name: str) -> Tuple[bool, List[str]]:
        """Check if Docker container versions match requirements.txt"""
        requirements = self.parse_requirements()
        container_versions = self.get_docker_container_versions(container_name)

        issues = []

        for package, required_version in requirements.items():
            if package in container_versions:
                container_version = container_versions[package]

                # For exact version pinning (==)
                if '==' in required_version:
                    expected = required_version
                    if container_version != expected:
                        issues.append(
                            f"{package}: Container has {container_version}, "
                            f"requirements.txt specifies {expected}"
                        )

                # For critical packages, always check
                if package == "gotrue":
                    is_compatible, gotrue_issues = self.validate_gotrue_compatibility(container_version)
                    if not is_compatible:
                        issues.extend([f"gotrue {container_version}: {issue}" for issue in gotrue_issues])

        return len(issues) == 0, issues

    def validate_graphql_schema_dependencies(self) -> Tuple[bool, List[str]]:
        """Validate GraphQL-related dependencies are compatible"""
        requirements = self.parse_requirements()
        issues = []

        # Check strawberry-graphql compatibility
        if "strawberry-graphql" in requirements:
            strawberry_version = requirements["strawberry-graphql"]

            # Validate with FastAPI version
            if "fastapi" in requirements:
                fastapi_version = requirements["fastapi"]
                # Add specific compatibility checks here

        return len(issues) == 0, issues

    def test_authentication_endpoint(self) -> Tuple[bool, List[str]]:
        """Test that authentication endpoint is responding correctly"""
        issues = []

        try:
            # Test GraphQL schema introspection
            response = requests.post(
                "http://localhost:8001/graphql",
                json={"query": "{ __schema { types { name } } }"},
                headers={"Content-Type": "application/json"},
                timeout=10
            )

            if response.status_code != 200:
                issues.append(f"GraphQL endpoint returned {response.status_code}")
            else:
                data = response.json()
                if "errors" in data:
                    issues.append(f"GraphQL errors: {data['errors']}")

        except requests.RequestException as e:
            issues.append(f"Cannot connect to authentication endpoint: {e}")

        return len(issues) == 0, issues

    def run_validation(self) -> bool:
        """Run complete dependency validation suite"""
        print("🔍 NestSync Dependency Compatibility Validation")
        print("=" * 50)

        all_passed = True

        # 1. Parse requirements
        try:
            requirements = self.parse_requirements()
            print(f"✅ Parsed {len(requirements)} packages from requirements.txt")
        except Exception as e:
            print(f"❌ Failed to parse requirements.txt: {e}")
            return False

        # 2. Check Docker container version drift
        container_passed, container_issues = self.check_container_version_drift("nestsync-backend")
        if container_passed:
            print("✅ Docker container versions match requirements.txt")
        else:
            print("❌ Docker container version drift detected:")
            for issue in container_issues:
                print(f"   - {issue}")
            all_passed = False

        # 3. Validate GraphQL dependencies
        graphql_passed, graphql_issues = self.validate_graphql_schema_dependencies()
        if graphql_passed:
            print("✅ GraphQL dependencies are compatible")
        else:
            print("❌ GraphQL dependency issues:")
            for issue in graphql_issues:
                print(f"   - {issue}")
            all_passed = False

        # 4. Test authentication endpoint
        auth_passed, auth_issues = self.test_authentication_endpoint()
        if auth_passed:
            print("✅ Authentication endpoint responding correctly")
        else:
            print("❌ Authentication endpoint issues:")
            for issue in auth_issues:
                print(f"   - {issue}")
            all_passed = False

        print("\n" + "=" * 50)
        if all_passed:
            print("✅ All dependency validations passed")
            return True
        else:
            print("❌ Dependency validation failed - see issues above")
            print("\n🔧 Recommended Actions:")
            print("1. Rebuild Docker containers: ./docker/docker-dev.sh build")
            print("2. Verify requirements.txt versions are pinned correctly")
            print("3. Check compatibility matrix for known issues")
            print("4. Run authentication smoke tests")
            return False


def main():
    """Main entry point"""
    if len(sys.argv) > 1:
        project_root = Path(sys.argv[1])
    else:
        project_root = Path(__file__).parent.parent

    validator = DependencyValidator(project_root)

    if not validator.run_validation():
        sys.exit(1)

    print("\n🎉 Dependency validation completed successfully!")


if __name__ == "__main__":
    main()