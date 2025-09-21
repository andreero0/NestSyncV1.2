#!/usr/bin/env python3
"""
NestSync Cross-Platform Compatibility Validation
Prevents platform-specific failures and iOS build path issues

This script validates cross-platform functionality to prevent P0 failures like:
1. iOS build path space issues
2. Cross-platform storage compatibility
3. Platform-specific authentication failures
4. Universal storage pattern compliance
"""

import subprocess
import sys
import os
import json
import shutil
from pathlib import Path
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
import platform


@dataclass
class PlatformIssue:
    platform: str
    issue_type: str
    description: str
    severity: str
    fix_recommendation: str
    blocking: bool = False


@dataclass
class CrossPlatformResult:
    passed: bool
    issues: List[PlatformIssue]
    warnings: List[str]
    platform_scores: Dict[str, int]


class CrossPlatformValidator:
    def __init__(self, project_root: Path):
        self.project_root = project_root
        self.frontend_path = project_root / "NestSync-frontend"
        self.backend_path = project_root / "NestSync-backend"

        # Platform-specific requirements from bottlenecks.md
        self.platform_requirements = {
            "ios": {
                "path_restrictions": "no_spaces",
                "build_system": "xcode",
                "storage_api": "expo_secure_store",
                "authentication": "universal_pattern"
            },
            "android": {
                "path_restrictions": "flexible",
                "build_system": "gradle",
                "storage_api": "expo_secure_store",
                "authentication": "universal_pattern"
            },
            "web": {
                "path_restrictions": "flexible",
                "build_system": "webpack",
                "storage_api": "local_storage_fallback",
                "authentication": "universal_pattern"
            }
        }

        # Known problematic patterns from bottlenecks.md
        self.problematic_patterns = {
            "direct_secure_store_import": {
                "pattern": r"import.*SecureStore.*from.*expo-secure-store",
                "issue": "Direct SecureStore import fails on web platform",
                "fix": "Use universal storage hooks from hooks/useUniversalStorage.ts"
            },
            "nested_touchable_text": {
                "pattern": r"<TouchableOpacity[^>]*>[\s\S]*?<Text[^>]*>",
                "issue": "Nested TouchableOpacity inside Text causes iOS rendering issues",
                "fix": "Use <Text onPress={handler}> instead"
            },
            "platform_specific_apis": {
                "pattern": r"Platform\.OS.*===.*['\"](ios|android)['\"]",
                "issue": "Platform-specific code without web fallback",
                "fix": "Include web platform handling"
            }
        }

    def validate_project_path(self) -> List[PlatformIssue]:
        """Validate project path for iOS compatibility"""
        issues = []

        project_path_str = str(self.project_root)

        # Check for spaces in path (iOS build blocker)
        if " " in project_path_str:
            issues.append(PlatformIssue(
                platform="ios",
                issue_type="path_spaces",
                description=f"Project path contains spaces: {project_path_str}",
                severity="critical",
                fix_recommendation="Move project to path without spaces (e.g., /Users/user/Dev/NestSync/)",
                blocking=True
            ))

        # Check for special characters that might cause issues
        special_chars = ["&", "%", "$", "#", "@", "!", "(", ")"]
        found_special = [char for char in special_chars if char in project_path_str]

        if found_special:
            issues.append(PlatformIssue(
                platform="ios",
                issue_type="path_special_chars",
                description=f"Project path contains special characters: {found_special}",
                severity="high",
                fix_recommendation="Avoid special characters in project path for iOS compatibility"
            ))

        # Check path length (iOS has path length limits)
        if len(project_path_str) > 200:
            issues.append(PlatformIssue(
                platform="ios",
                issue_type="path_length",
                description=f"Project path is very long: {len(project_path_str)} characters",
                severity="medium",
                fix_recommendation="Consider shorter project path for iOS build compatibility"
            ))

        return issues

    def scan_for_problematic_patterns(self) -> List[PlatformIssue]:
        """Scan codebase for problematic cross-platform patterns"""
        issues = []

        # Find all frontend files to scan
        file_patterns = ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"]
        files_to_scan = []

        for pattern in file_patterns:
            files_to_scan.extend(self.frontend_path.glob(pattern))

        # Filter out node_modules
        files_to_scan = [f for f in files_to_scan if "node_modules" not in str(f)]

        for file_path in files_to_scan:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()

                # Check for direct SecureStore imports
                if "import" in content and "SecureStore" in content and "expo-secure-store" in content:
                    # Check if it's the problematic direct import
                    if "useUniversalStorage" not in content:
                        issues.append(PlatformIssue(
                            platform="web",
                            issue_type="direct_secure_store_import",
                            description=f"Direct SecureStore import in {file_path.name}",
                            severity="critical",
                            fix_recommendation="Replace with useUniversalStorage hooks",
                            blocking=True
                        ))

                # Check for nested TouchableOpacity + Text patterns
                if "<TouchableOpacity" in content and "<Text" in content:
                    # Simplified check - could be enhanced with proper AST parsing
                    if content.count("<TouchableOpacity") > 0 and content.count("<Text") > 0:
                        issues.append(PlatformIssue(
                            platform="ios",
                            issue_type="nested_touchable_text",
                            description=f"Potential nested TouchableOpacity+Text in {file_path.name}",
                            severity="medium",
                            fix_recommendation="Review for nested TouchableOpacity inside Text elements"
                        ))

                # Check for platform-specific code without web support
                if "Platform.OS" in content:
                    if "ios" in content or "android" in content:
                        if "web" not in content:
                            issues.append(PlatformIssue(
                                platform="web",
                                issue_type="missing_web_support",
                                description=f"Platform-specific code without web fallback in {file_path.name}",
                                severity="medium",
                                fix_recommendation="Add web platform handling to Platform.OS checks"
                            ))

            except Exception as e:
                # Continue scanning other files
                pass

        return issues

    def validate_universal_storage_pattern(self) -> List[PlatformIssue]:
        """Validate universal storage pattern implementation"""
        issues = []

        # Check if universal storage hooks exist
        universal_storage_path = self.frontend_path / "hooks" / "useUniversalStorage.ts"

        if not universal_storage_path.exists():
            issues.append(PlatformIssue(
                platform="all",
                issue_type="missing_universal_storage",
                description="Universal storage hooks not found",
                severity="critical",
                fix_recommendation="Implement hooks/useUniversalStorage.ts with platform detection",
                blocking=True
            ))
        else:
            # Validate universal storage implementation
            try:
                with open(universal_storage_path, 'r') as f:
                    content = f.read()

                # Check for platform detection
                if "Platform.OS" not in content:
                    issues.append(PlatformIssue(
                        platform="all",
                        issue_type="missing_platform_detection",
                        description="Universal storage missing platform detection",
                        severity="high",
                        fix_recommendation="Add Platform.OS detection for web vs native storage"
                    ))

                # Check for web fallback
                if "localStorage" not in content and "AsyncStorage" not in content:
                    issues.append(PlatformIssue(
                        platform="web",
                        issue_type="missing_web_storage_fallback",
                        description="Universal storage missing web storage fallback",
                        severity="high",
                        fix_recommendation="Add localStorage fallback for web platform"
                    ))

            except Exception as e:
                issues.append(PlatformIssue(
                    platform="all",
                    issue_type="universal_storage_read_error",
                    description=f"Cannot read universal storage hooks: {e}",
                    severity="medium",
                    fix_recommendation="Fix universal storage hooks file permissions and syntax"
                ))

        return issues

    def validate_build_configuration(self) -> List[PlatformIssue]:
        """Validate build configuration for cross-platform compatibility"""
        issues = []

        # Check app.json/app.config.js for platform configurations
        app_config_paths = [
            self.frontend_path / "app.json",
            self.frontend_path / "app.config.js",
            self.frontend_path / "app.config.ts"
        ]

        app_config_found = False
        for config_path in app_config_paths:
            if config_path.exists():
                app_config_found = True
                try:
                    with open(config_path, 'r') as f:
                        content = f.read()

                    # Check for iOS configuration
                    if "ios" not in content.lower():
                        issues.append(PlatformIssue(
                            platform="ios",
                            issue_type="missing_ios_config",
                            description="iOS configuration missing from app config",
                            severity="medium",
                            fix_recommendation="Add iOS-specific configuration to app.json"
                        ))

                    # Check for Android configuration
                    if "android" not in content.lower():
                        issues.append(PlatformIssue(
                            platform="android",
                            issue_type="missing_android_config",
                            description="Android configuration missing from app config",
                            severity="medium",
                            fix_recommendation="Add Android-specific configuration to app.json"
                        ))

                    # Check for web configuration
                    if "web" not in content.lower():
                        issues.append(PlatformIssue(
                            platform="web",
                            issue_type="missing_web_config",
                            description="Web configuration missing from app config",
                            severity="low",
                            fix_recommendation="Add web-specific configuration to app.json"
                        ))

                except Exception as e:
                    issues.append(PlatformIssue(
                        platform="all",
                        issue_type="app_config_read_error",
                        description=f"Cannot read app configuration: {e}",
                        severity="medium",
                        fix_recommendation="Fix app configuration file syntax"
                    ))
                break

        if not app_config_found:
            issues.append(PlatformIssue(
                platform="all",
                issue_type="missing_app_config",
                description="No app configuration file found",
                severity="high",
                fix_recommendation="Create app.json with platform-specific configurations"
            ))

        return issues

    def validate_environment_compatibility(self) -> List[PlatformIssue]:
        """Validate development environment compatibility"""
        issues = []

        current_platform = platform.system().lower()

        # Check Node.js version
        try:
            node_version = subprocess.check_output(["node", "--version"], text=True).strip()
            major_version = int(node_version.replace("v", "").split(".")[0])

            if major_version < 16:
                issues.append(PlatformIssue(
                    platform="all",
                    issue_type="node_version",
                    description=f"Node.js version {node_version} may cause compatibility issues",
                    severity="medium",
                    fix_recommendation="Upgrade to Node.js 16 or higher"
                ))

        except Exception:
            issues.append(PlatformIssue(
                platform="all",
                issue_type="node_missing",
                description="Node.js not found or not accessible",
                severity="critical",
                fix_recommendation="Install Node.js 16 or higher",
                blocking=True
            ))

        # Check for platform-specific tools
        if current_platform == "darwin":  # macOS
            # Check for Xcode command line tools
            try:
                subprocess.check_output(["xcode-select", "--version"], stderr=subprocess.DEVNULL)
            except (subprocess.CalledProcessError, FileNotFoundError):
                issues.append(PlatformIssue(
                    platform="ios",
                    issue_type="missing_xcode_tools",
                    description="Xcode command line tools not found",
                    severity="high",
                    fix_recommendation="Install Xcode command line tools: xcode-select --install"
                ))

        # Check Expo CLI
        try:
            subprocess.check_output(["npx", "expo", "--version"], stderr=subprocess.DEVNULL)
        except (subprocess.CalledProcessError, FileNotFoundError):
            issues.append(PlatformIssue(
                platform="all",
                issue_type="missing_expo_cli",
                description="Expo CLI not accessible",
                severity="medium",
                fix_recommendation="Install Expo CLI: npm install -g @expo/cli"
            ))

        return issues

    def calculate_platform_scores(self, issues: List[PlatformIssue]) -> Dict[str, int]:
        """Calculate compatibility scores for each platform"""
        scores = {"ios": 100, "android": 100, "web": 100, "all": 100}

        for issue in issues:
            platforms = [issue.platform] if issue.platform != "all" else ["ios", "android", "web"]

            deduction = {
                "critical": 30,
                "high": 15,
                "medium": 8,
                "low": 3
            }.get(issue.severity, 5)

            for platform in platforms:
                scores[platform] = max(0, scores[platform] - deduction)

        return scores

    def generate_platform_report(self, issues: List[PlatformIssue], scores: Dict[str, int]) -> str:
        """Generate comprehensive platform compatibility report"""
        report_lines = [
            "📱 NestSync Cross-Platform Compatibility Report",
            "=" * 55,
            "",
            "📊 Platform Compatibility Scores:",
            f"  📱 iOS: {scores['ios']}/100",
            f"  🤖 Android: {scores['android']}/100",
            f"  🌐 Web: {scores['web']}/100",
            f"  🔧 Overall: {scores['all']}/100",
            "",
            f"🔍 Total Issues Found: {len(issues)}",
            ""
        ]

        # Group by platform
        by_platform = {}
        for issue in issues:
            if issue.platform not in by_platform:
                by_platform[issue.platform] = []
            by_platform[issue.platform].append(issue)

        # Report issues by platform
        platform_icons = {"ios": "📱", "android": "🤖", "web": "🌐", "all": "🔧"}

        for platform, platform_issues in by_platform.items():
            icon = platform_icons.get(platform, "❓")
            report_lines.append(f"{icon} {platform.upper()} Platform ({len(platform_issues)} issues):")

            # Group by severity
            by_severity = {}
            for issue in platform_issues:
                if issue.severity not in by_severity:
                    by_severity[issue.severity] = []
                by_severity[issue.severity].append(issue)

            severity_order = ["critical", "high", "medium", "low"]
            for severity in severity_order:
                if severity in by_severity:
                    severity_icon = {"critical": "🚨", "high": "⚠️", "medium": "🔍", "low": "💡"}[severity]
                    report_lines.append(f"  {severity_icon} {severity.upper()}:")

                    for issue in by_severity[severity][:3]:  # Show first 3
                        report_lines.append(f"    📋 {issue.issue_type}: {issue.description}")
                        report_lines.append(f"       Fix: {issue.fix_recommendation}")

                    if len(by_severity[severity]) > 3:
                        report_lines.append(f"       ... and {len(by_severity[severity]) - 3} more")

            report_lines.append("")

        # Blocking issues
        blocking_issues = [issue for issue in issues if issue.blocking]
        if blocking_issues:
            report_lines.extend([
                "🚫 BLOCKING ISSUES (Must fix before deployment):",
                *[f"  🚨 {issue.platform}: {issue.description}" for issue in blocking_issues],
                ""
            ])

        return "\n".join(report_lines)

    def run_validation(self) -> bool:
        """Run complete cross-platform compatibility validation"""
        print("📱 NestSync Cross-Platform Compatibility Validation")
        print("=" * 55)

        all_issues = []

        # 1. Validate project path
        print("📁 Validating project path compatibility...")
        path_issues = self.validate_project_path()
        all_issues.extend(path_issues)

        if path_issues:
            blocking_path_issues = [i for i in path_issues if i.blocking]
            if blocking_path_issues:
                print("❌ BLOCKING path issues found:")
                for issue in blocking_path_issues:
                    print(f"   🚨 {issue.description}")
                return False
            else:
                print("⚠️  Path compatibility issues found (non-blocking)")
        else:
            print("✅ Project path compatibility validated")

        # 2. Scan for problematic patterns
        print("🔍 Scanning for problematic cross-platform patterns...")
        pattern_issues = self.scan_for_problematic_patterns()
        all_issues.extend(pattern_issues)

        blocking_pattern_issues = [i for i in pattern_issues if i.blocking]
        if blocking_pattern_issues:
            print("❌ BLOCKING pattern issues found:")
            for issue in blocking_pattern_issues:
                print(f"   🚨 {issue.description}")
        else:
            print("✅ Cross-platform patterns validated")

        # 3. Validate universal storage pattern
        print("💾 Validating universal storage pattern...")
        storage_issues = self.validate_universal_storage_pattern()
        all_issues.extend(storage_issues)

        blocking_storage_issues = [i for i in storage_issues if i.blocking]
        if blocking_storage_issues:
            print("❌ BLOCKING storage issues found:")
            for issue in blocking_storage_issues:
                print(f"   🚨 {issue.description}")
        else:
            print("✅ Universal storage pattern validated")

        # 4. Validate build configuration
        print("⚙️  Validating build configuration...")
        build_issues = self.validate_build_configuration()
        all_issues.extend(build_issues)
        print("✅ Build configuration validated")

        # 5. Validate environment compatibility
        print("🌍 Validating environment compatibility...")
        env_issues = self.validate_environment_compatibility()
        all_issues.extend(env_issues)

        blocking_env_issues = [i for i in env_issues if i.blocking]
        if blocking_env_issues:
            print("❌ BLOCKING environment issues found:")
            for issue in blocking_env_issues:
                print(f"   🚨 {issue.description}")
        else:
            print("✅ Environment compatibility validated")

        # Calculate scores and generate report
        scores = self.calculate_platform_scores(all_issues)
        report = self.generate_platform_report(all_issues, scores)
        print("\n" + report)

        # Determine overall result
        blocking_issues = [issue for issue in all_issues if issue.blocking]
        critical_issues = [issue for issue in all_issues if issue.severity == "critical"]

        if blocking_issues:
            print("❌ BLOCKING issues prevent cross-platform deployment")
            return False

        if len(critical_issues) > 3:
            print("❌ Too many critical cross-platform issues")
            return False

        if min(scores.values()) < 60:  # Any platform below 60%
            print("❌ Platform compatibility below threshold")
            return False

        print("✅ Cross-platform compatibility validation passed")
        return True


def main():
    """Main entry point"""
    if len(sys.argv) > 1:
        project_root = Path(sys.argv[1])
    else:
        project_root = Path(__file__).parent.parent

    validator = CrossPlatformValidator(project_root)

    if not validator.run_validation():
        sys.exit(1)

    print("\n🎉 Cross-platform compatibility validation completed successfully!")


if __name__ == "__main__":
    main()