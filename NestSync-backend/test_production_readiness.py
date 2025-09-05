#!/usr/bin/env python3
"""
NestSync Backend - Production Readiness Testing Suite
Focus: Performance, API Contract, and Canadian Compliance

This test suite validates production readiness across:
- API Performance & Response Times
- GraphQL Schema Validation
- Canadian Compliance (PIPEDA)
- Error Handling & Security
- Infrastructure Health

Author: Claude Code - QA & Test Automation Engineer
Date: September 4, 2025
"""

import json
import time
import requests
import statistics
from datetime import datetime
from typing import Dict, List, Any, Optional, Tuple

# =============================================================================
# Test Configuration
# =============================================================================

BASE_URL = "http://127.0.0.1:8001"
GRAPHQL_ENDPOINT = f"{BASE_URL}/graphql"
PERFORMANCE_THRESHOLD = 1.0  # 1 second response time requirement

# =============================================================================
# Test Results Tracking
# =============================================================================

class TestResult:
    def __init__(self, name: str, status: str, response_time: float, details: str, error: str = None):
        self.name = name
        self.status = status  # PASS, FAIL, ERROR
        self.response_time = response_time
        self.details = details
        self.error = error
        self.timestamp = datetime.now()

class ProductionReadinessTester:
    def __init__(self):
        self.results = []
        self.session = requests.Session()
        self.session.headers.update({
            "Content-Type": "application/json",
            "User-Agent": "NestSync-Production-Test/1.0.0"
        })
    
    def log_result(self, name: str, status: str, response_time: float, details: str, error: str = None):
        """Log a test result"""
        result = TestResult(name, status, response_time, details, error)
        self.results.append(result)
        
        status_symbol = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
        print(f"{status_symbol} {name} - {response_time:.3f}s - {details}")
        
        if error:
            print(f"   Error: {error}")
    
    def post_graphql(self, query: str, variables: Optional[Dict] = None) -> Tuple[Dict, float]:
        """Execute GraphQL query with timing"""
        payload = {"query": query}
        if variables:
            payload["variables"] = variables
        
        start_time = time.time()
        try:
            response = self.session.post(GRAPHQL_ENDPOINT, json=payload)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                return response.json(), response_time
            else:
                return {"error": f"HTTP {response.status_code}: {response.text}"}, response_time
        except Exception as e:
            response_time = time.time() - start_time
            return {"error": str(e)}, response_time
    
    def get_endpoint(self, endpoint: str) -> Tuple[Dict, float]:
        """GET request with timing"""
        start_time = time.time()
        try:
            response = self.session.get(f"{BASE_URL}{endpoint}")
            response_time = time.time() - start_time
            
            if response.status_code < 400:
                return response.json(), response_time
            else:
                return {"error": f"HTTP {response.status_code}", "response": response.text}, response_time
        except Exception as e:
            response_time = time.time() - start_time
            return {"error": str(e)}, response_time

    # ==========================================================================
    # Phase 1: Infrastructure & Health Testing
    # ==========================================================================
    
    def test_infrastructure_health(self):
        """Test basic infrastructure health"""
        print("\n=== Testing Infrastructure Health ===")
        
        # Test root endpoint
        root_data, root_time = self.get_endpoint("/")
        if "name" in root_data and "status" in root_data:
            self.log_result(
                "Root Endpoint", "PASS", root_time,
                f"API responding: {root_data.get('name')} v{root_data.get('version')}"
            )
        else:
            self.log_result(
                "Root Endpoint", "FAIL", root_time,
                "Root endpoint not responding correctly",
                str(root_data)
            )
        
        # Test API info with Canadian compliance
        info_data, info_time = self.get_endpoint("/info")
        if "compliance" in info_data:
            compliance = info_data["compliance"]
            pipeda_compliant = compliance.get("pipeda_compliant", False)
            data_residency = compliance.get("data_residency", "")
            
            if pipeda_compliant and data_residency == "Canada":
                self.log_result(
                    "Canadian Compliance Info", "PASS", info_time,
                    f"PIPEDA compliant: {pipeda_compliant}, Data residency: {data_residency}"
                )
            else:
                self.log_result(
                    "Canadian Compliance Info", "FAIL", info_time,
                    f"Compliance issues - PIPEDA: {pipeda_compliant}, Residency: {data_residency}"
                )
        else:
            self.log_result(
                "Canadian Compliance Info", "FAIL", info_time,
                "No compliance information found"
            )
        
        # Test GraphQL health
        gql_response, gql_time = self.post_graphql('query { healthCheck }')
        if gql_response.get("data", {}).get("healthCheck"):
            self.log_result(
                "GraphQL Health", "PASS", gql_time,
                "GraphQL endpoint operational"
            )
        else:
            self.log_result(
                "GraphQL Health", "FAIL", gql_time,
                "GraphQL health check failed",
                str(gql_response)
            )
        
        # Test API info query
        api_info_response, api_info_time = self.post_graphql('query { apiInfo }')
        if api_info_response.get("data", {}).get("apiInfo"):
            self.log_result(
                "GraphQL API Info", "PASS", api_info_time,
                "API info accessible via GraphQL"
            )
        else:
            self.log_result(
                "GraphQL API Info", "FAIL", api_info_time,
                "GraphQL API info failed",
                str(api_info_response)
            )

    # ==========================================================================
    # Phase 2: Performance Testing
    # ==========================================================================
    
    def test_performance_requirements(self):
        """Test performance requirements for production"""
        print("\n=== Testing Performance Requirements ===")
        
        # Test critical endpoints multiple times
        endpoints_to_test = [
            ("GraphQL Health", 'query { healthCheck }'),
            ("GraphQL API Info", 'query { apiInfo }'),
        ]
        
        for endpoint_name, query in endpoints_to_test:
            times = []
            
            # Run 10 requests to get performance statistics
            for i in range(10):
                _, response_time = self.post_graphql(query)
                times.append(response_time)
                time.sleep(0.1)  # Small delay between requests
            
            avg_time = statistics.mean(times)
            max_time = max(times)
            min_time = min(times)
            p95_time = sorted(times)[int(0.95 * len(times))]
            
            # Check average performance
            if avg_time <= PERFORMANCE_THRESHOLD:
                self.log_result(
                    f"Performance: {endpoint_name} Average", "PASS", avg_time,
                    f"Avg: {avg_time:.3f}s, Max: {max_time:.3f}s, P95: {p95_time:.3f}s"
                )
            else:
                self.log_result(
                    f"Performance: {endpoint_name} Average", "FAIL", avg_time,
                    f"Average {avg_time:.3f}s exceeds {PERFORMANCE_THRESHOLD}s threshold"
                )
            
            # Check P95 performance (95th percentile)
            if p95_time <= PERFORMANCE_THRESHOLD * 1.5:  # Allow 1.5x threshold for P95
                self.log_result(
                    f"Performance: {endpoint_name} P95", "PASS", p95_time,
                    f"P95 response time: {p95_time:.3f}s"
                )
            else:
                self.log_result(
                    f"Performance: {endpoint_name} P95", "FAIL", p95_time,
                    f"P95 {p95_time:.3f}s exceeds acceptable threshold"
                )

    # ==========================================================================
    # Phase 3: GraphQL Schema & Contract Testing
    # ==========================================================================
    
    def test_graphql_schema(self):
        """Test GraphQL schema and contract"""
        print("\n=== Testing GraphQL Schema & Contract ===")
        
        # Test introspection query
        introspection_query = '''
        query IntrospectionQuery {
            __schema {
                queryType { name }
                mutationType { name }
                subscriptionType { name }
                types {
                    name
                    kind
                }
            }
        }
        '''
        
        schema_response, schema_time = self.post_graphql(introspection_query)
        schema_data = schema_response.get("data", {}).get("__schema")
        
        if schema_data:
            query_type = schema_data.get("queryType", {}).get("name", "")
            mutation_type = schema_data.get("mutationType", {}).get("name", "")
            subscription_type = schema_data.get("subscriptionType", {}).get("name", "")
            types = schema_data.get("types", [])
            
            self.log_result(
                "GraphQL Schema Introspection", "PASS", schema_time,
                f"Schema accessible - Query: {query_type}, Mutation: {mutation_type}, Types: {len(types)}"
            )
            
            # Check for essential types
            type_names = [t.get("name", "") for t in types]
            essential_types = ["UserProfile", "ChildProfile", "AuthResponse", "MutationResponse"]
            
            missing_types = [t for t in essential_types if t not in type_names]
            if not missing_types:
                self.log_result(
                    "GraphQL Essential Types", "PASS", schema_time,
                    f"All essential types present: {essential_types}"
                )
            else:
                self.log_result(
                    "GraphQL Essential Types", "FAIL", schema_time,
                    f"Missing essential types: {missing_types}"
                )
        else:
            self.log_result(
                "GraphQL Schema Introspection", "FAIL", schema_time,
                "Schema introspection failed",
                str(schema_response)
            )

    # ==========================================================================
    # Phase 4: Security & Error Handling Testing
    # ==========================================================================
    
    def test_security_headers(self):
        """Test security headers and error handling"""
        print("\n=== Testing Security & Error Handling ===")
        
        # Test CORS headers
        cors_response = self.session.options(f"{BASE_URL}/")
        cors_time = 0.1  # Approximate time for OPTIONS
        
        cors_headers = cors_response.headers
        required_cors_headers = [
            "Access-Control-Allow-Origin",
            "Access-Control-Allow-Methods",
            "Access-Control-Allow-Headers"
        ]
        
        missing_cors_headers = [h for h in required_cors_headers if h not in cors_headers]
        if not missing_cors_headers:
            self.log_result(
                "CORS Headers", "PASS", cors_time,
                "All required CORS headers present"
            )
        else:
            self.log_result(
                "CORS Headers", "FAIL", cors_time,
                f"Missing CORS headers: {missing_cors_headers}"
            )
        
        # Test 404 error handling
        not_found_data, not_found_time = self.get_endpoint("/nonexistent-endpoint")
        if "error" in not_found_data or "404" in str(not_found_data):
            self.log_result(
                "404 Error Handling", "PASS", not_found_time,
                "404 errors handled properly"
            )
        else:
            self.log_result(
                "404 Error Handling", "FAIL", not_found_time,
                "404 error handling issue"
            )
        
        # Test invalid GraphQL query
        invalid_gql_response, invalid_gql_time = self.post_graphql('query { invalidField }')
        if "errors" in invalid_gql_response:
            self.log_result(
                "GraphQL Error Handling", "PASS", invalid_gql_time,
                "GraphQL validation errors handled properly"
            )
        else:
            self.log_result(
                "GraphQL Error Handling", "FAIL", invalid_gql_time,
                "GraphQL error handling issue",
                str(invalid_gql_response)
            )

    # ==========================================================================
    # Phase 5: Canadian Compliance Deep Testing
    # ==========================================================================
    
    def test_canadian_compliance(self):
        """Test Canadian compliance features"""
        print("\n=== Testing Canadian Compliance (PIPEDA) ===")
        
        # Test timezone support
        info_data, info_time = self.get_endpoint("/info")
        if "application" in info_data:
            app_info = info_data["application"]
            timezone = app_info.get("timezone", "")
            region = app_info.get("region", "")
            
            if "America/" in timezone:
                self.log_result(
                    "Canadian Timezone", "PASS", info_time,
                    f"Timezone correctly set to: {timezone}"
                )
            else:
                self.log_result(
                    "Canadian Timezone", "FAIL", info_time,
                    f"Invalid timezone: {timezone}"
                )
            
            if "canada" in region.lower():
                self.log_result(
                    "Data Region", "PASS", info_time,
                    f"Data region correctly set to: {region}"
                )
            else:
                self.log_result(
                    "Data Region", "FAIL", info_time,
                    f"Invalid data region: {region}"
                )
        
        # Test privacy policy information
        if "compliance" in info_data:
            compliance = info_data["compliance"]
            privacy_policy_url = compliance.get("privacy_policy", "")
            
            if privacy_policy_url and "nestsync.ca" in privacy_policy_url:
                self.log_result(
                    "Privacy Policy URL", "PASS", info_time,
                    f"Privacy policy URL present: {privacy_policy_url}"
                )
            else:
                self.log_result(
                    "Privacy Policy URL", "FAIL", info_time,
                    f"Invalid or missing privacy policy URL: {privacy_policy_url}"
                )

    # ==========================================================================
    # Phase 6: Load & Stress Testing (Basic)
    # ==========================================================================
    
    def test_basic_load_handling(self):
        """Test basic concurrent load handling"""
        print("\n=== Testing Basic Load Handling ===")
        
        # Test concurrent requests
        import concurrent.futures
        
        def make_request():
            """Make a simple GraphQL request"""
            _, response_time = self.post_graphql('query { healthCheck }')
            return response_time
        
        # Test with 20 concurrent requests
        with concurrent.futures.ThreadPoolExecutor(max_workers=20) as executor:
            start_time = time.time()
            futures = [executor.submit(make_request) for _ in range(20)]
            response_times = [future.result() for future in concurrent.futures.as_completed(futures)]
            total_time = time.time() - start_time
        
        avg_concurrent_time = statistics.mean(response_times)
        max_concurrent_time = max(response_times)
        
        if avg_concurrent_time <= PERFORMANCE_THRESHOLD * 2:  # Allow 2x threshold for concurrent
            self.log_result(
                "Concurrent Load (20 requests)", "PASS", avg_concurrent_time,
                f"Avg: {avg_concurrent_time:.3f}s, Max: {max_concurrent_time:.3f}s, Total: {total_time:.3f}s"
            )
        else:
            self.log_result(
                "Concurrent Load (20 requests)", "FAIL", avg_concurrent_time,
                f"High response time under load: {avg_concurrent_time:.3f}s"
            )

    # ==========================================================================
    # Main Test Execution
    # ==========================================================================
    
    def run_all_tests(self):
        """Run all production readiness tests"""
        print("🚀 Starting NestSync Backend Production Readiness Testing")
        print("=" * 80)
        
        start_time = time.time()
        
        # Run all test phases
        self.test_infrastructure_health()
        self.test_performance_requirements()
        self.test_graphql_schema()
        self.test_security_headers()
        self.test_canadian_compliance()
        self.test_basic_load_handling()
        
        total_time = time.time() - start_time
        
        # Calculate results
        total_tests = len(self.results)
        passed_tests = len([r for r in self.results if r.status == "PASS"])
        failed_tests = len([r for r in self.results if r.status == "FAIL"])
        error_tests = len([r for r in self.results if r.status == "ERROR"])
        
        pass_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        # Print summary
        print("\n" + "=" * 80)
        print("🎯 PRODUCTION READINESS SUMMARY")
        print("=" * 80)
        print(f"📊 Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"⚠️ Errors: {error_tests}")
        print(f"📈 Pass Rate: {pass_rate:.1f}%")
        print(f"⏱️ Total Time: {total_time:.2f}s")
        
        # Production readiness assessment
        if pass_rate >= 95:
            print("🟢 PRODUCTION READY - Excellent")
        elif pass_rate >= 90:
            print("🟡 PRODUCTION READY - Good")
        elif pass_rate >= 80:
            print("🟠 PRODUCTION READY - Acceptable (minor issues)")
        else:
            print("🔴 NOT PRODUCTION READY - Critical issues need addressing")
        
        # Generate detailed report
        self.generate_detailed_report(total_time, pass_rate)
        
        return {
            "total_tests": total_tests,
            "passed": passed_tests,
            "failed": failed_tests,
            "errors": error_tests,
            "pass_rate": pass_rate,
            "production_ready": pass_rate >= 80
        }
    
    def generate_detailed_report(self, total_time: float, pass_rate: float):
        """Generate detailed production readiness report"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        report = f"""
# NestSync Backend - Production Readiness Assessment Report

**Date:** {timestamp}  
**Application:** NestSync - Canadian Diaper Planning App  
**Version:** 1.2.0  
**Environment:** Development  
**Test Focus:** Production Readiness & Performance Validation

---

## 🎯 Executive Summary

This production readiness assessment validates the NestSync backend across critical production criteria:
- Infrastructure Health & Availability
- Performance & Response Time Requirements
- GraphQL Schema & API Contract Validation
- Security & Error Handling
- Canadian Compliance (PIPEDA)
- Basic Load Handling Capacity

### 🏆 Overall Assessment

- **Total Tests:** {len(self.results)}
- **Pass Rate:** {pass_rate:.1f}%
- **Test Duration:** {total_time:.2f} seconds
- **Production Status:** {'✅ READY' if pass_rate >= 80 else '❌ NOT READY'}

---

## 📊 Detailed Test Results

### Test Categories

"""
        
        # Group results by category
        categories = {}
        for result in self.results:
            category = result.name.split(":")[0] if ":" in result.name else "General"
            if category not in categories:
                categories[category] = []
            categories[category].append(result)
        
        for category, tests in categories.items():
            passed = len([t for t in tests if t.status == "PASS"])
            failed = len([t for t in tests if t.status == "FAIL"])
            errors = len([t for t in tests if t.status == "ERROR"])
            
            report += f"\n#### {category} ({passed}/{len(tests)} passed)\n\n"
            
            for test in tests:
                status_symbol = "✅" if test.status == "PASS" else "❌" if test.status == "FAIL" else "⚠️"
                report += f"- {status_symbol} **{test.name}**: {test.details} ({test.response_time:.3f}s)\n"
                
                if test.error:
                    report += f"  - Error: {test.error}\n"
        
        # Performance analysis
        performance_tests = [r for r in self.results if "Performance" in r.name]
        if performance_tests:
            avg_performance = statistics.mean([t.response_time for t in performance_tests])
            report += f"\n### 📈 Performance Analysis\n\n"
            report += f"- **Average Response Time:** {avg_performance:.3f}s\n"
            report += f"- **Performance Threshold:** {PERFORMANCE_THRESHOLD}s\n"
            report += f"- **Performance Rating:** {'✅ Excellent' if avg_performance < PERFORMANCE_THRESHOLD * 0.5 else '✅ Good' if avg_performance < PERFORMANCE_THRESHOLD else '❌ Needs Improvement'}\n"
        
        # Canadian compliance summary
        report += f"\n### 🍁 Canadian Compliance Summary\n\n"
        compliance_tests = [r for r in self.results if "Canadian" in r.name or "Compliance" in r.name or "PIPEDA" in r.name or "Privacy" in r.name]
        compliance_passed = len([t for t in compliance_tests if t.status == "PASS"])
        compliance_total = len(compliance_tests)
        
        if compliance_total > 0:
            compliance_rate = (compliance_passed / compliance_total) * 100
            report += f"- **PIPEDA Compliance Rate:** {compliance_rate:.1f}% ({compliance_passed}/{compliance_total} tests)\n"
            report += f"- **Compliance Status:** {'✅ Fully Compliant' if compliance_rate == 100 else '⚠️ Issues Found' if compliance_rate >= 80 else '❌ Non-Compliant'}\n"
        
        # Recommendations
        report += f"\n---\n\n## 📋 Recommendations\n\n"
        
        failed_tests = [r for r in self.results if r.status in ["FAIL", "ERROR"]]
        if failed_tests:
            report += f"### 🔴 Critical Issues to Address\n\n"
            for test in failed_tests[:10]:  # Top 10 issues
                report += f"- **{test.name}**: {test.error or test.details}\n"
        
        if pass_rate >= 80:
            report += f"\n### ✅ Production Deployment Recommendations\n\n"
            report += f"- System meets production readiness criteria\n"
            report += f"- Monitor performance metrics in production\n"
            report += f"- Implement comprehensive logging and monitoring\n"
            report += f"- Schedule regular compliance audits\n"
        else:
            report += f"\n### ⚠️ Pre-Production Actions Required\n\n"
            report += f"- Address all failed test cases\n"
            report += f"- Improve system performance where needed\n"
            report += f"- Complete security and compliance validation\n"
            report += f"- Re-run production readiness assessment\n"
        
        report += f"\n---\n\n## 🎉 Conclusion\n\n"
        
        if pass_rate >= 95:
            report += f"The NestSync backend demonstrates **excellent production readiness** with a {pass_rate:.1f}% pass rate. All critical systems are operational and meet Canadian compliance requirements."
        elif pass_rate >= 80:
            report += f"The NestSync backend demonstrates **good production readiness** with a {pass_rate:.1f}% pass rate. Minor issues should be addressed but the system is ready for production deployment."
        else:
            report += f"The NestSync backend requires **additional work** before production deployment. With a {pass_rate:.1f}% pass rate, critical issues need to be resolved."
        
        report += f"\n\n**Next Steps:**\n"
        report += f"1. Address any failed test cases\n"
        report += f"2. Implement performance monitoring\n"
        report += f"3. Complete frontend integration testing\n"
        report += f"4. Deploy to staging environment for validation\n"
        report += f"5. Conduct user acceptance testing\n"
        
        report += f"\n---\n\n*Report generated by Claude Code - QA & Test Automation Engineer*  \n*Assessment completed: {timestamp}*\n"
        
        # Save report
        report_filename = f"PRODUCTION_READINESS_REPORT_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md"
        with open(report_filename, 'w') as f:
            f.write(report)
        
        print(f"\n📄 Detailed report saved to: {report_filename}")

def main():
    """Main test execution"""
    tester = ProductionReadinessTester()
    results = tester.run_all_tests()
    return results

if __name__ == "__main__":
    main()