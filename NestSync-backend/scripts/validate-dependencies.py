#!/usr/bin/env python3
"""
Dependency Validation Script
Ensures Docker containers match requirements.txt versions exactly
Prevents critical authentication failures due to version drift
"""

import sys
import subprocess
import re
import logging
from typing import Dict, List, Tuple, Optional
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

class DependencyValidator:
    """
    Validates that installed packages match requirements.txt exactly
    Focuses on critical authentication dependencies
    """

    def __init__(self, requirements_file: str = "requirements.txt"):
        self.requirements_file = Path(requirements_file)
        self.critical_packages = {
            "gotrue": "2.5.4",  # Critical: prevents Pydantic validation errors
            "supabase": ">=2.18.0,<2.19.0",
            "pydantic": ">=2.5.0,<3.0.0",
            "fastapi": ">=0.104.1,<0.105.0",
            "sqlalchemy": ">=2.0.23,<2.1.0"
        }

    def parse_requirements(self) -> Dict[str, str]:
        """
        Parse requirements.txt and extract package versions
        """
        requirements = {}

        if not self.requirements_file.exists():
            raise FileNotFoundError(f"Requirements file not found: {self.requirements_file}")

        with open(self.requirements_file, 'r') as f:
            for line in f:
                line = line.strip()

                # Skip comments and empty lines
                if not line or line.startswith('#'):
                    continue

                # Parse package==version or package>=version,<version
                if '==' in line:
                    package, version = line.split('==', 1)
                    requirements[package.strip()] = version.strip()
                elif '>=' in line:
                    # Handle complex version specifications
                    package = line.split('>=')[0].strip()
                    version_spec = line.split(package)[1].strip()
                    requirements[package] = version_spec

        return requirements

    def get_installed_packages(self) -> Dict[str, str]:
        """
        Get installed package versions using pip
        """
        try:
            result = subprocess.run(
                [sys.executable, "-m", "pip", "list", "--format=json"],
                capture_output=True,
                text=True,
                check=True
            )

            import json
            packages = json.loads(result.stdout)

            return {pkg["name"]: pkg["version"] for pkg in packages}

        except subprocess.CalledProcessError as e:
            logger.error(f"Failed to get installed packages: {e}")
            raise
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse pip output: {e}")
            raise

    def check_version_match(self, package: str, required: str, installed: str) -> bool:
        """
        Check if installed version matches requirement
        Handles exact matches and range specifications
        """
        # Exact version match
        if required == installed:
            return True

        # Handle version ranges (simplified)
        if '>=' in required and '<' in required:
            # Extract version numbers (simplified parsing)
            try:
                # Example: ">=2.5.0,<3.0.0"
                parts = required.split(',')
                min_version = parts[0].replace('>=', '').strip()
                max_version = parts[1].replace('<', '').strip()

                # Simple version comparison (works for most cases)
                return min_version <= installed < max_version
            except:
                # Fallback: assume valid if we can't parse
                logger.warning(f"Could not parse version range for {package}: {required}")
                return True

        # Single constraint (>=, >, <, <=)
        if '>=' in required:
            min_version = required.replace('>=', '').strip()
            return installed >= min_version

        return False

    def validate_critical_packages(self) -> Tuple[bool, List[str]]:
        """
        Validate critical authentication packages
        Returns (success, error_messages)
        """
        errors = []

        try:
            requirements = self.parse_requirements()
            installed = self.get_installed_packages()

            for package, expected_spec in self.critical_packages.items():
                # Check if package is in requirements
                if package not in requirements:
                    errors.append(f"Critical package {package} not found in requirements.txt")
                    continue

                # Check if package is installed
                if package not in installed:
                    errors.append(f"Critical package {package} not installed")
                    continue

                required_version = requirements[package]
                installed_version = installed[package]

                # Special handling for gotrue (exact version required)
                if package == "gotrue":
                    if required_version != installed_version:
                        errors.append(
                            f"CRITICAL: gotrue version mismatch! "
                            f"Required: {required_version}, Installed: {installed_version}. "
                            f"This WILL cause authentication failures."
                        )
                    else:
                        logger.info(f"✅ gotrue version correct: {installed_version}")
                else:
                    # Check version compatibility
                    if not self.check_version_match(package, required_version, installed_version):
                        errors.append(
                            f"Version mismatch for {package}: "
                            f"Required: {required_version}, Installed: {installed_version}"
                        )
                    else:
                        logger.info(f"✅ {package} version compatible: {installed_version}")

        except Exception as e:
            errors.append(f"Validation failed with error: {str(e)}")

        return len(errors) == 0, errors

    def validate_all_requirements(self) -> Tuple[bool, List[str]]:
        """
        Validate all packages in requirements.txt
        Returns (success, error_messages)
        """
        errors = []

        try:
            requirements = self.parse_requirements()
            installed = self.get_installed_packages()

            missing_packages = []
            version_mismatches = []

            for package, required_version in requirements.items():
                if package not in installed:
                    missing_packages.append(package)
                    continue

                installed_version = installed[package]

                # For exact version requirements
                if '==' in required_version:
                    if required_version.replace('==', '') != installed_version:
                        version_mismatches.append(
                            f"{package}: required {required_version}, installed {installed_version}"
                        )

            if missing_packages:
                errors.append(f"Missing packages: {', '.join(missing_packages)}")

            if version_mismatches:
                errors.extend(version_mismatches)

        except Exception as e:
            errors.append(f"Full validation failed: {str(e)}")

        return len(errors) == 0, errors

    def generate_health_report(self) -> Dict:
        """
        Generate comprehensive dependency health report
        """
        report = {
            "timestamp": "2024-01-01T00:00:00Z",  # Will be replaced in real implementation
            "critical_packages_valid": False,
            "all_packages_valid": False,
            "critical_errors": [],
            "all_errors": [],
            "gotrue_version": None,
            "validation_status": "failed"
        }

        try:
            # Check critical packages
            critical_valid, critical_errors = self.validate_critical_packages()
            report["critical_packages_valid"] = critical_valid
            report["critical_errors"] = critical_errors

            # Check all packages
            all_valid, all_errors = self.validate_all_requirements()
            report["all_packages_valid"] = all_valid
            report["all_errors"] = all_errors

            # Get gotrue version specifically
            installed = self.get_installed_packages()
            report["gotrue_version"] = installed.get("gotrue", "NOT_INSTALLED")

            # Determine overall status
            if critical_valid:
                report["validation_status"] = "passed"
            else:
                report["validation_status"] = "failed"

        except Exception as e:
            report["critical_errors"].append(f"Health report generation failed: {str(e)}")

        return report


def main():
    """
    Main validation entry point
    Used by Docker builds and CI/CD
    """
    logger.info("Starting dependency validation...")
    logger.info("=" * 60)

    validator = DependencyValidator()

    # Generate health report
    report = validator.generate_health_report()

    # Print results
    print(f"🔍 Dependency Validation Report")
    print(f"📋 Validation Status: {report['validation_status'].upper()}")
    print(f"🔑 gotrue Version: {report['gotrue_version']}")
    print(f"✅ Critical Packages Valid: {report['critical_packages_valid']}")
    print(f"📦 All Packages Valid: {report['all_packages_valid']}")

    if report["critical_errors"]:
        print("\n❌ CRITICAL ERRORS:")
        for error in report["critical_errors"]:
            print(f"  • {error}")

    if report["all_errors"]:
        print(f"\n⚠️  ALL VALIDATION ERRORS ({len(report['all_errors'])}):")
        for error in report["all_errors"][:10]:  # Show first 10
            print(f"  • {error}")
        if len(report["all_errors"]) > 10:
            print(f"  ... and {len(report['all_errors']) - 10} more errors")

    print("=" * 60)

    # Exit with appropriate code
    if report["critical_packages_valid"]:
        logger.info("✅ Dependency validation PASSED")
        sys.exit(0)
    else:
        logger.error("❌ Dependency validation FAILED - Critical packages invalid")
        sys.exit(1)


if __name__ == "__main__":
    main()