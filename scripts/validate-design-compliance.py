#!/usr/bin/env python3
"""
NestSync Design System Compliance Validation
Prevents design deviation failures like the analytics dashboard P1 issue

This script validates adherence to psychology-driven UX design patterns
and Canadian context requirements documented in design-documentation/
"""

import subprocess
import sys
import re
import json
from pathlib import Path
from typing import Dict, List, Set, Tuple, Optional
import requests
from dataclasses import dataclass


@dataclass
class DesignViolation:
    component_path: str
    violation_type: str
    description: str
    severity: str  # 'critical', 'high', 'medium', 'low'
    fix_recommendation: str


@dataclass
class ComplianceResult:
    passed: bool
    violations: List[DesignViolation]
    warnings: List[str]
    canadian_context_score: int  # 0-100


class DesignComplianceValidator:
    def __init__(self, project_root: Path):
        self.project_root = project_root
        self.frontend_path = project_root / "NestSync-frontend"
        self.design_docs_path = project_root / "design-documentation"

        # Psychology-driven UX patterns from CLAUDE.md and bottlenecks.md
        self.required_ux_patterns = {
            "canadian_trust_indicators": [
                "🇨🇦",
                "Data stored in Canada",
                "Canadian",
                "Canada"
            ],
            "psychology_driven_language": [
                "Your baby's",
                "feeding schedule",
                "confidence",
                "normal for baby's age",
                "Excellent",
                "patterns"
            ],
            "stress_reduction_elements": [
                "✅",
                "🌟",
                "Excellent!",
                "normal",
                "healthy",
                "consistent"
            ],
            "core_sections": [
                "📈 Your Baby's Patterns",
                "🔮 Smart Predictions",
                "💡 Smart Insights",
                "Baby's Schedule Today",
                "Feeding Pattern Streak"
            ]
        }

        # Prohibited technical language (should be replaced with psychology-driven alternatives)
        self.prohibited_technical_terms = {
            "Average Daily Changes": "Baby's Schedule Today",
            "Current Streak": "Feeding Pattern Streak",
            "Efficiency": "Diaper Efficiency",
            "Today's Changes": "Baby's Schedule Today",
            "Data": "Insights",
            "Metrics": "Patterns",
            "Statistics": "Your Baby's Progress"
        }

        # Canadian compliance requirements
        self.canadian_requirements = {
            "data_residency_messaging": True,
            "privacy_trust_indicators": True,
            "french_language_support": False,  # Future requirement
            "canadian_timezone_default": True,
            "pipeda_compliance_ui": True
        }

    def scan_frontend_files(self) -> List[Path]:
        """Find all frontend component files to scan"""
        file_patterns = ["**/*.tsx", "**/*.ts", "**/*.jsx", "**/*.js"]
        files = []

        for pattern in file_patterns:
            files.extend(self.frontend_path.glob(pattern))

        # Filter out node_modules and build directories
        filtered_files = [
            f for f in files
            if "node_modules" not in str(f) and "build" not in str(f) and ".expo" not in str(f)
        ]

        return filtered_files

    def analyze_file_content(self, file_path: Path) -> Tuple[str, List[str]]:
        """Analyze file content and extract text elements"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            # Extract text from JSX/TSX elements
            text_patterns = [
                r'<Text[^>]*>([^<]+)</Text>',  # <Text>content</Text>
                r'<.*?title=["\']([^"\']+)["\']',  # title="content"
                r'<.*?placeholder=["\']([^"\']+)["\']',  # placeholder="content"
                r'["\']([^"\']*(?:baby|Baby|feeding|Feeding|diaper|Diaper)[^"\']*)["\']',  # Baby-related strings
                r'["\']([^"\']*(?:🇨🇦|Canada|Canadian)[^"\']*)["\']',  # Canadian content
            ]

            extracted_texts = []
            for pattern in text_patterns:
                matches = re.findall(pattern, content, re.IGNORECASE | re.DOTALL)
                extracted_texts.extend(matches)

            return content, extracted_texts

        except Exception as e:
            return "", []

    def validate_psychology_driven_language(self, file_path: Path, content: str, texts: List[str]) -> List[DesignViolation]:
        """Validate psychology-driven language usage"""
        violations = []

        # Check for prohibited technical terms
        for technical_term, psychology_alternative in self.prohibited_technical_terms.items():
            if technical_term in content:
                violations.append(DesignViolation(
                    component_path=str(file_path.relative_to(self.project_root)),
                    violation_type="technical_language",
                    description=f"Technical term '{technical_term}' used instead of psychology-driven language",
                    severity="high",
                    fix_recommendation=f"Replace '{technical_term}' with '{psychology_alternative}'"
                ))

        # Check for presence of psychology-driven patterns
        psychology_score = 0
        total_patterns = len(self.required_ux_patterns["psychology_driven_language"])

        for pattern in self.required_ux_patterns["psychology_driven_language"]:
            if any(pattern.lower() in text.lower() for text in texts):
                psychology_score += 1

        # If file seems to be a user-facing component but lacks psychology patterns
        is_user_facing = any(keyword in content.lower() for keyword in [
            "baby", "diaper", "feeding", "analytics", "dashboard", "planner"
        ])

        if is_user_facing and psychology_score < (total_patterns * 0.3):  # Less than 30% of patterns
            violations.append(DesignViolation(
                component_path=str(file_path.relative_to(self.project_root)),
                violation_type="missing_psychology_patterns",
                description=f"User-facing component lacks psychology-driven language (score: {psychology_score}/{total_patterns})",
                severity="medium",
                fix_recommendation="Add confidence-building and stress-reduction language from design documentation"
            ))

        return violations

    def validate_canadian_context(self, file_path: Path, content: str, texts: List[str]) -> List[DesignViolation]:
        """Validate Canadian context and trust indicators"""
        violations = []

        # Check for Canadian trust indicators in relevant components
        is_relevant_component = any(keyword in str(file_path).lower() for keyword in [
            "auth", "sign", "privacy", "dashboard", "analytics", "settings", "profile"
        ])

        if is_relevant_component:
            has_canadian_indicators = any(
                indicator in content for indicator in self.required_ux_patterns["canadian_trust_indicators"]
            )

            if not has_canadian_indicators:
                violations.append(DesignViolation(
                    component_path=str(file_path.relative_to(self.project_root)),
                    violation_type="missing_canadian_context",
                    description="Component missing Canadian trust indicators",
                    severity="medium",
                    fix_recommendation="Add '🇨🇦 Data stored in Canada' or similar trust messaging"
                ))

        # Check for timezone handling
        if "timezone" in content.lower() or "time" in content.lower():
            has_canadian_timezone = "america/toronto" in content.lower() or "canada" in content.lower()

            if not has_canadian_timezone:
                violations.append(DesignViolation(
                    component_path=str(file_path.relative_to(self.project_root)),
                    violation_type="missing_canadian_timezone",
                    description="Time handling without Canadian timezone consideration",
                    severity="low",
                    fix_recommendation="Default to America/Toronto timezone for Canadian users"
                ))

        return violations

    def validate_core_section_implementation(self, file_path: Path, content: str) -> List[DesignViolation]:
        """Validate implementation of core design sections"""
        violations = []

        # Check analytics/dashboard components for required sections
        is_analytics_component = any(keyword in str(file_path).lower() for keyword in [
            "analytics", "dashboard", "planner", "insights"
        ])

        if is_analytics_component:
            missing_sections = []
            for section in self.required_ux_patterns["core_sections"]:
                if section not in content:
                    missing_sections.append(section)

            if missing_sections and len(missing_sections) > len(self.required_ux_patterns["core_sections"]) * 0.5:
                violations.append(DesignViolation(
                    component_path=str(file_path.relative_to(self.project_root)),
                    violation_type="missing_core_sections",
                    description=f"Analytics component missing core sections: {missing_sections}",
                    severity="high",
                    fix_recommendation="Implement missing core sections per analytics dashboard design documentation"
                ))

        return violations

    def validate_stress_reduction_patterns(self, file_path: Path, content: str, texts: List[str]) -> List[DesignViolation]:
        """Validate stress-reduction UI patterns"""
        violations = []

        # Look for error or negative messaging
        negative_patterns = [
            "error", "failed", "wrong", "invalid", "cannot", "unable", "problem"
        ]

        stress_indicators = []
        for text in texts:
            text_lower = text.lower()
            for pattern in negative_patterns:
                if pattern in text_lower and len(text) > 10:  # Ignore short technical strings
                    stress_indicators.append(text)

        # Check if negative messaging includes stress-reduction elements
        if stress_indicators:
            has_stress_reduction = any(
                element in content for element in self.required_ux_patterns["stress_reduction_elements"]
            )

            if not has_stress_reduction:
                violations.append(DesignViolation(
                    component_path=str(file_path.relative_to(self.project_root)),
                    violation_type="missing_stress_reduction",
                    description=f"Component has negative messaging without stress-reduction elements: {stress_indicators[:2]}",
                    severity="medium",
                    fix_recommendation="Add reassuring language, positive framing, or helpful guidance"
                ))

        return violations

    def validate_emoji_prohibition(self, file_path: Path, content: str) -> List[DesignViolation]:
        """Validate that no unauthorized emojis are used (per CLAUDE.md)"""
        violations = []

        # Extract emojis from content
        emoji_pattern = r'[\U0001F600-\U0001F64F\U0001F300-\U0001F5FF\U0001F680-\U0001F6FF\U0001F1E0-\U0001F1FF\U00002702-\U000027B0\U000024C2-\U0001F251]+'
        emojis_found = re.findall(emoji_pattern, content)

        if emojis_found:
            # Check if emojis are from approved design system
            approved_emojis = ["🇨🇦", "📈", "🔮", "💡", "✅", "🌟"]
            unauthorized_emojis = [emoji for emoji in emojis_found if emoji not in approved_emojis]

            if unauthorized_emojis:
                violations.append(DesignViolation(
                    component_path=str(file_path.relative_to(self.project_root)),
                    violation_type="unauthorized_emojis",
                    description=f"Unauthorized emojis found: {unauthorized_emojis}",
                    severity="low",
                    fix_recommendation="Replace emojis with design system icons or approved emojis only"
                ))

        return violations

    def calculate_canadian_context_score(self, all_violations: List[DesignViolation]) -> int:
        """Calculate overall Canadian context compliance score"""
        total_files = len(self.scan_frontend_files())
        canadian_violations = [v for v in all_violations if "canadian" in v.violation_type]

        if total_files == 0:
            return 0

        # Base score
        score = 100

        # Deduct points for violations
        for violation in canadian_violations:
            if violation.severity == "critical":
                score -= 20
            elif violation.severity == "high":
                score -= 10
            elif violation.severity == "medium":
                score -= 5
            elif violation.severity == "low":
                score -= 2

        return max(0, min(100, score))

    def generate_compliance_report(self, violations: List[DesignViolation], score: int) -> str:
        """Generate comprehensive compliance report"""
        report_lines = [
            "📋 NestSync Design System Compliance Report",
            "=" * 50,
            "",
            f"📊 Overall Canadian Context Score: {score}/100",
            f"🔍 Total Violations Found: {len(violations)}",
            ""
        ]

        # Group violations by severity
        by_severity = {}
        for violation in violations:
            if violation.severity not in by_severity:
                by_severity[violation.severity] = []
            by_severity[violation.severity].append(violation)

        # Report by severity
        severity_order = ["critical", "high", "medium", "low"]
        for severity in severity_order:
            if severity in by_severity:
                count = len(by_severity[severity])
                icon = {"critical": "🚨", "high": "⚠️", "medium": "🔍", "low": "💡"}[severity]
                report_lines.append(f"{icon} {severity.upper()} ({count} violations):")

                for violation in by_severity[severity][:5]:  # Show first 5
                    report_lines.append(f"  📁 {violation.component_path}")
                    report_lines.append(f"     Type: {violation.violation_type}")
                    report_lines.append(f"     Issue: {violation.description}")
                    report_lines.append(f"     Fix: {violation.fix_recommendation}")
                    report_lines.append("")

                if len(by_severity[severity]) > 5:
                    report_lines.append(f"     ... and {len(by_severity[severity]) - 5} more")
                    report_lines.append("")

        # Recommendations
        report_lines.extend([
            "🔧 Top Recommendations:",
            "1. Review analytics dashboard against design documentation",
            "2. Implement Canadian trust indicators in authentication flows",
            "3. Replace technical language with psychology-driven alternatives",
            "4. Add stress-reduction elements to error messaging",
            "5. Ensure all user-facing text supports overwhelmed parents",
            ""
        ])

        return "\n".join(report_lines)

    def run_validation(self) -> bool:
        """Run complete design compliance validation"""
        print("🎨 NestSync Design System Compliance Validation")
        print("=" * 50)

        all_violations = []
        files_scanned = 0

        # Scan all frontend files
        frontend_files = self.scan_frontend_files()
        print(f"📁 Scanning {len(frontend_files)} frontend files...")

        for file_path in frontend_files:
            try:
                content, texts = self.analyze_file_content(file_path)

                if content:  # Skip empty files
                    files_scanned += 1

                    # Run all validation checks
                    violations = []
                    violations.extend(self.validate_psychology_driven_language(file_path, content, texts))
                    violations.extend(self.validate_canadian_context(file_path, content, texts))
                    violations.extend(self.validate_core_section_implementation(file_path, content))
                    violations.extend(self.validate_stress_reduction_patterns(file_path, content, texts))
                    violations.extend(self.validate_emoji_prohibition(file_path, content))

                    all_violations.extend(violations)

            except Exception as e:
                print(f"⚠️  Error scanning {file_path}: {e}")

        print(f"✅ Scanned {files_scanned} files")

        # Calculate compliance score
        canadian_score = self.calculate_canadian_context_score(all_violations)

        # Generate and display report
        report = self.generate_compliance_report(all_violations, canadian_score)
        print(report)

        # Determine pass/fail
        critical_violations = [v for v in all_violations if v.severity == "critical"]
        high_violations = [v for v in all_violations if v.severity == "high"]

        # Fail conditions
        if critical_violations:
            print("❌ CRITICAL design compliance failures detected")
            return False

        if len(high_violations) > 5:  # More than 5 high-priority violations
            print("❌ Too many HIGH priority design compliance issues")
            return False

        if canadian_score < 70:  # Less than 70% Canadian compliance
            print(f"❌ Canadian context compliance below threshold: {canadian_score}%")
            return False

        print("✅ Design system compliance validation passed")
        return True


def main():
    """Main entry point"""
    if len(sys.argv) > 1:
        project_root = Path(sys.argv[1])
    else:
        project_root = Path(__file__).parent.parent

    validator = DesignComplianceValidator(project_root)

    if not validator.run_validation():
        sys.exit(1)

    print("\n🎉 Design compliance validation completed successfully!")


if __name__ == "__main__":
    main()