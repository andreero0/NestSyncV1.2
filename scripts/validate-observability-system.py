#!/usr/bin/env python3
"""
Observability System Validation Script
Validates that the monitoring system is working and can detect issues
"""

import asyncio
import sys
import json
import logging
from datetime import datetime
from pathlib import Path

# Add backend to path
sys.path.append(str(Path(__file__).parent.parent / "NestSync-backend"))

from app.services.observability_service import get_observability_service, AlertSeverity
from app.services.continuous_monitoring import ContinuousMonitoringService


async def validate_observability_system():
    """Validate that the observability system is working correctly"""
    print("🔍 Validating NestSync Observability System...")
    print("=" * 60)

    success = True
    validation_results = []

    try:
        # Test 1: Observability service instantiation
        print("📊 Test 1: Observability Service Instantiation")
        try:
            observability = await get_observability_service()
            print("✅ Observability service created successfully")
            validation_results.append({"test": "service_instantiation", "status": "PASS"})
        except Exception as e:
            print(f"❌ Failed to create observability service: {e}")
            validation_results.append({"test": "service_instantiation", "status": "FAIL", "error": str(e)})
            success = False

        # Test 2: Health check execution
        print("\n🏥 Test 2: Comprehensive Health Check Execution")
        try:
            health_checks = await observability.run_comprehensive_health_check()
            print(f"✅ Executed {len(health_checks)} health checks")

            # Analyze results
            failed_checks = [check for check in health_checks if not check.status]
            if failed_checks:
                print(f"⚠️  {len(failed_checks)} health checks failed:")
                for check in failed_checks:
                    print(f"   - {check.check_name}: {check.error_message}")
            else:
                print("✅ All health checks passed")

            validation_results.append({
                "test": "health_check_execution",
                "status": "PASS",
                "total_checks": len(health_checks),
                "failed_checks": len(failed_checks)
            })

        except Exception as e:
            print(f"❌ Failed to execute health checks: {e}")
            validation_results.append({"test": "health_check_execution", "status": "FAIL", "error": str(e)})
            success = False

        # Test 3: Alert generation
        print("\n🚨 Test 3: Alert System Validation")
        try:
            active_alerts = observability.get_active_alerts()
            print(f"📋 Found {len(active_alerts)} active alerts")

            # Check alert severity distribution
            severity_counts = {}
            for alert in active_alerts:
                severity = alert.severity.value
                severity_counts[severity] = severity_counts.get(severity, 0) + 1

            if severity_counts:
                print("   Alert severity distribution:")
                for severity, count in severity_counts.items():
                    print(f"   - {severity}: {count} alerts")

            validation_results.append({
                "test": "alert_system",
                "status": "PASS",
                "active_alerts": len(active_alerts),
                "severity_distribution": severity_counts
            })

        except Exception as e:
            print(f"❌ Failed to validate alert system: {e}")
            validation_results.append({"test": "alert_system", "status": "FAIL", "error": str(e)})
            success = False

        # Test 4: Health summary generation
        print("\n📈 Test 4: Health Summary Generation")
        try:
            health_summary = observability.get_health_summary()
            print(f"✅ Health summary generated: {health_summary['status']} status")
            print(f"   Overall health: {health_summary['overall_health_percentage']:.1f}%")
            print(f"   Total checks: {health_summary['total_checks']}")
            print(f"   Healthy checks: {health_summary['healthy_checks']}")

            validation_results.append({
                "test": "health_summary",
                "status": "PASS",
                "health_percentage": health_summary['overall_health_percentage'],
                "system_status": health_summary['status']
            })

        except Exception as e:
            print(f"❌ Failed to generate health summary: {e}")
            validation_results.append({"test": "health_summary", "status": "FAIL", "error": str(e)})
            success = False

        # Test 5: Continuous monitoring service
        print("\n🔄 Test 5: Continuous Monitoring Service")
        try:
            monitoring_service = ContinuousMonitoringService()
            print("✅ Continuous monitoring service created")

            # Test that intervals are configured
            print(f"   Configured intervals: {list(monitoring_service.intervals.keys())}")

            validation_results.append({
                "test": "continuous_monitoring",
                "status": "PASS",
                "intervals": monitoring_service.intervals
            })

        except Exception as e:
            print(f"❌ Failed to create continuous monitoring service: {e}")
            validation_results.append({"test": "continuous_monitoring", "status": "FAIL", "error": str(e)})
            success = False

        # Test 6: P0/P1 failure detection coverage
        print("\n🛡️ Test 6: P0/P1 Failure Detection Coverage")
        try:
            # Check that all documented failure classes are covered
            covered_failure_classes = [
                "database_health",           # Database migration corruption, SQLAlchemy metadata
                "auth_health",              # Authentication SDK compatibility (gotrue)
                "graphql_schema_health",    # Schema mismatches, field naming issues
                "dependency_health",        # Dependency compatibility, version conflicts
                "data_residency_compliance", # Canadian compliance, PIPEDA requirements
                "pipeda_compliance",        # Privacy and consent management
                "auth_performance",         # Authentication performance
                "analytics_performance",   # Analytics dashboard performance
                "performance_trends",       # Early warning trend detection
                "error_rate_trends"         # Error pattern detection
            ]

            missing_coverage = []
            for check in health_checks:
                if check.check_id in covered_failure_classes:
                    covered_failure_classes.remove(check.check_id)

            if covered_failure_classes:
                missing_coverage = covered_failure_classes

            if missing_coverage:
                print(f"⚠️  Missing coverage for: {missing_coverage}")
            else:
                print("✅ All documented P0/P1 failure classes covered")

            validation_results.append({
                "test": "p0_p1_coverage",
                "status": "PASS" if not missing_coverage else "PARTIAL",
                "missing_coverage": missing_coverage
            })

        except Exception as e:
            print(f"❌ Failed to validate P0/P1 coverage: {e}")
            validation_results.append({"test": "p0_p1_coverage", "status": "FAIL", "error": str(e)})
            success = False

        # Test 7: Canadian compliance validation
        print("\n🇨🇦 Test 7: Canadian Compliance Validation")
        try:
            compliance_checks = await observability._check_canadian_compliance()
            compliance_failures = [check for check in compliance_checks if not check.status]

            if compliance_failures:
                print(f"❌ {len(compliance_failures)} Canadian compliance failures:")
                for check in compliance_failures:
                    print(f"   - {check.check_name}: {check.error_message}")
                success = False
            else:
                print("✅ All Canadian compliance checks passed")

            validation_results.append({
                "test": "canadian_compliance",
                "status": "PASS" if not compliance_failures else "FAIL",
                "total_checks": len(compliance_checks),
                "failed_checks": len(compliance_failures)
            })

        except Exception as e:
            print(f"❌ Failed to validate Canadian compliance: {e}")
            validation_results.append({"test": "canadian_compliance", "status": "FAIL", "error": str(e)})
            success = False

    except Exception as e:
        print(f"\n💥 Critical error during observability validation: {e}")
        success = False

    # Generate validation report
    print("\n" + "=" * 60)
    print("📋 OBSERVABILITY SYSTEM VALIDATION REPORT")
    print("=" * 60)

    passed_tests = sum(1 for result in validation_results if result["status"] == "PASS")
    total_tests = len(validation_results)

    if success and passed_tests == total_tests:
        print("✅ ALL TESTS PASSED - Observability system is fully operational")
        print(f"🎉 {passed_tests}/{total_tests} validation tests successful")
    else:
        print("❌ VALIDATION FAILURES DETECTED")
        print(f"📊 {passed_tests}/{total_tests} validation tests successful")

    # Detailed results
    print("\nDetailed Results:")
    for result in validation_results:
        status_icon = "✅" if result["status"] == "PASS" else "⚠️" if result["status"] == "PARTIAL" else "❌"
        print(f"{status_icon} {result['test']}: {result['status']}")

    # Export validation report
    report = {
        "validation_time": datetime.utcnow().isoformat(),
        "overall_success": success,
        "passed_tests": passed_tests,
        "total_tests": total_tests,
        "success_rate": (passed_tests / total_tests * 100) if total_tests > 0 else 0,
        "results": validation_results
    }

    with open("observability-validation-report.json", "w") as f:
        json.dump(report, f, indent=2)

    print(f"\n📄 Validation report saved to: observability-validation-report.json")

    return success


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)

    try:
        success = asyncio.run(validate_observability_system())
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n🛑 Validation interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Fatal error during validation: {e}")
        sys.exit(1)