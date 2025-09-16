#!/usr/bin/env python3
"""
NestSync GraphQL Schema Drift Detection System
Prevents snake_case/camelCase and field mismatch failures

This script validates that frontend GraphQL queries match backend schema
and catches field naming convention inconsistencies early.
"""

import subprocess
import sys
import json
import re
from pathlib import Path
from typing import Dict, List, Set, Tuple, Optional
import requests
from dataclasses import dataclass


@dataclass
class GraphQLField:
    name: str
    type: str
    parent_type: str
    is_camel_case: bool
    is_snake_case: bool


@dataclass
class ValidationResult:
    passed: bool
    issues: List[str]
    warnings: List[str]


class GraphQLSchemaValidator:
    def __init__(self, project_root: Path):
        self.project_root = project_root
        self.backend_path = project_root / "NestSync-backend"
        self.frontend_path = project_root / "NestSync-frontend"

        # Known problematic patterns from bottlenecks.md
        self.known_mismatches = {
            "childId": "child_id",
            "weeklyData": "weekly_data",
            "currentItems": "current_items",
            "averageWeeklyChanges": "average_weekly_changes"
        }

    def get_backend_schema(self) -> Optional[Dict]:
        """Fetch GraphQL schema from backend using introspection"""
        try:
            response = requests.post(
                "http://localhost:8001/graphql",
                json={
                    "query": """
                    query IntrospectionQuery {
                      __schema {
                        queryType { name }
                        mutationType { name }
                        subscriptionType { name }
                        types {
                          kind
                          name
                          description
                          fields(includeDeprecated: true) {
                            name
                            description
                            args {
                              name
                              description
                              type {
                                kind
                                name
                                ofType {
                                  kind
                                  name
                                }
                              }
                            }
                            type {
                              kind
                              name
                              ofType {
                                kind
                                name
                              }
                            }
                          }
                        }
                      }
                    }
                    """
                },
                headers={"Content-Type": "application/json"},
                timeout=10
            )

            if response.status_code == 200:
                return response.json()
            else:
                print(f"❌ Backend schema fetch failed: HTTP {response.status_code}")
                return None

        except requests.RequestException as e:
            print(f"❌ Cannot connect to GraphQL endpoint: {e}")
            return None

    def extract_backend_fields(self, schema: Dict) -> List[GraphQLField]:
        """Extract all fields from backend GraphQL schema"""
        fields = []

        if "data" not in schema or "__schema" not in schema["data"]:
            return fields

        types = schema["data"]["__schema"]["types"]

        for type_def in types:
            if type_def["kind"] == "OBJECT" and type_def["fields"]:
                type_name = type_def["name"]

                for field in type_def["fields"]:
                    field_name = field["name"]

                    fields.append(GraphQLField(
                        name=field_name,
                        type=type_name,
                        parent_type=type_name,
                        is_camel_case=self.is_camel_case(field_name),
                        is_snake_case=self.is_snake_case(field_name)
                    ))

        return fields

    def find_frontend_queries(self) -> List[Path]:
        """Find all GraphQL query files in frontend"""
        query_files = []

        # Search for .ts, .tsx, .js, .jsx files with GraphQL queries
        for pattern in ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx", "**/*.graphql", "**/*.gql"]:
            query_files.extend(self.frontend_path.glob(pattern))

        return query_files

    def extract_frontend_fields(self) -> List[GraphQLField]:
        """Extract field names from frontend GraphQL queries"""
        fields = []
        query_files = self.find_frontend_queries()

        for file_path in query_files:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()

                # Extract GraphQL queries and mutations
                gql_patterns = [
                    r'gql`([^`]+)`',  # Template literals
                    r'graphql`([^`]+)`',  # Graphql template literals
                    r'query\s+\w+[^{]*{([^}]+)}',  # Query definitions
                    r'mutation\s+\w+[^{]*{([^}]+)}',  # Mutation definitions
                ]

                for pattern in gql_patterns:
                    matches = re.findall(pattern, content, re.DOTALL | re.MULTILINE)

                    for match in matches:
                        # Extract field names from GraphQL content
                        field_names = self.extract_field_names_from_query(match)

                        for field_name in field_names:
                            fields.append(GraphQLField(
                                name=field_name,
                                type="Query",  # Simplified - could be enhanced
                                parent_type=str(file_path),
                                is_camel_case=self.is_camel_case(field_name),
                                is_snake_case=self.is_snake_case(field_name)
                            ))

            except Exception as e:
                print(f"⚠️  Error reading {file_path}: {e}")

        return fields

    def extract_field_names_from_query(self, query_content: str) -> Set[str]:
        """Extract field names from GraphQL query content"""
        field_names = set()

        # Remove comments and whitespace
        cleaned = re.sub(r'#.*$', '', query_content, flags=re.MULTILINE)
        cleaned = re.sub(r'\s+', ' ', cleaned).strip()

        # Extract field names (simple pattern)
        # This pattern looks for words that could be field names
        field_pattern = r'\b([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:\(|{|\s)'
        matches = re.findall(field_pattern, cleaned)

        for match in matches:
            # Filter out GraphQL keywords and common non-field words
            if match.lower() not in ['query', 'mutation', 'subscription', 'fragment', 'on',
                                   'type', 'input', 'enum', 'interface', 'union', 'scalar',
                                   'true', 'false', 'null', 'const', 'let', 'var', 'function']:
                field_names.add(match)

        return field_names

    def is_camel_case(self, name: str) -> bool:
        """Check if field name follows camelCase convention"""
        return bool(re.match(r'^[a-z][a-zA-Z0-9]*$', name) and re.search(r'[A-Z]', name))

    def is_snake_case(self, name: str) -> bool:
        """Check if field name follows snake_case convention"""
        return bool(re.match(r'^[a-z][a-z0-9_]*$', name) and '_' in name)

    def validate_naming_consistency(self, backend_fields: List[GraphQLField],
                                  frontend_fields: List[GraphQLField]) -> ValidationResult:
        """Validate naming convention consistency"""
        issues = []
        warnings = []

        # Check for mixed naming conventions in backend
        backend_camel = [f for f in backend_fields if f.is_camel_case]
        backend_snake = [f for f in backend_fields if f.is_snake_case]

        if backend_camel and backend_snake:
            warnings.append(
                f"Backend has mixed naming: {len(backend_camel)} camelCase, "
                f"{len(backend_snake)} snake_case fields"
            )

        # Check for known problematic patterns
        frontend_field_names = {f.name for f in frontend_fields}

        for frontend_field, backend_equivalent in self.known_mismatches.items():
            if frontend_field in frontend_field_names:
                backend_has_equivalent = any(f.name == backend_equivalent for f in backend_fields)
                backend_has_camel = any(f.name == frontend_field for f in backend_fields)

                if not backend_has_camel and backend_has_equivalent:
                    issues.append(
                        f"Field mismatch: Frontend uses '{frontend_field}' but backend "
                        f"only has '{backend_equivalent}'"
                    )

        return ValidationResult(
            passed=len(issues) == 0,
            issues=issues,
            warnings=warnings
        )

    def validate_field_existence(self, backend_fields: List[GraphQLField],
                                frontend_fields: List[GraphQLField]) -> ValidationResult:
        """Validate that frontend fields exist in backend schema"""
        issues = []
        warnings = []

        backend_field_names = {f.name for f in backend_fields}
        frontend_field_names = {f.name for f in frontend_fields}

        # Check for frontend fields not in backend
        missing_fields = frontend_field_names - backend_field_names

        for field in missing_fields:
            # Skip common non-GraphQL field names
            if field not in ['id', 'key', 'data', 'error', 'loading', 'refetch']:
                issues.append(f"Frontend queries field '{field}' not found in backend schema")

        return ValidationResult(
            passed=len(issues) == 0,
            issues=issues,
            warnings=warnings
        )

    def generate_schema_report(self, backend_fields: List[GraphQLField],
                             frontend_fields: List[GraphQLField]) -> str:
        """Generate comprehensive schema analysis report"""
        report = []
        report.append("📊 GraphQL Schema Analysis Report")
        report.append("=" * 50)

        # Backend analysis
        backend_camel = [f for f in backend_fields if f.is_camel_case]
        backend_snake = [f for f in backend_fields if f.is_snake_case]

        report.append(f"\n📈 Backend Schema:")
        report.append(f"  Total fields: {len(backend_fields)}")
        report.append(f"  camelCase fields: {len(backend_camel)}")
        report.append(f"  snake_case fields: {len(backend_snake)}")

        # Frontend analysis
        frontend_camel = [f for f in frontend_fields if f.is_camel_case]
        frontend_snake = [f for f in frontend_fields if f.is_snake_case]

        report.append(f"\n📱 Frontend Queries:")
        report.append(f"  Total field references: {len(frontend_fields)}")
        report.append(f"  camelCase references: {len(frontend_camel)}")
        report.append(f"  snake_case references: {len(frontend_snake)}")

        # Field overlap analysis
        backend_names = {f.name for f in backend_fields}
        frontend_names = {f.name for f in frontend_fields}

        overlap = backend_names & frontend_names
        frontend_only = frontend_names - backend_names
        backend_only = backend_names - frontend_names

        report.append(f"\n🔗 Field Overlap Analysis:")
        report.append(f"  Matching fields: {len(overlap)}")
        report.append(f"  Frontend-only fields: {len(frontend_only)}")
        report.append(f"  Backend-only fields: {len(backend_only)}")

        if frontend_only:
            report.append(f"\n  ⚠️  Frontend-only fields: {', '.join(sorted(frontend_only))}")

        return "\n".join(report)

    def run_validation(self) -> bool:
        """Run complete GraphQL schema validation"""
        print("🔍 NestSync GraphQL Schema Drift Detection")
        print("=" * 50)

        # 1. Get backend schema
        print("📡 Fetching backend GraphQL schema...")
        schema = self.get_backend_schema()
        if not schema:
            print("❌ Cannot validate without backend schema")
            return False

        backend_fields = self.extract_backend_fields(schema)
        print(f"✅ Extracted {len(backend_fields)} fields from backend schema")

        # 2. Extract frontend fields
        print("📱 Analyzing frontend GraphQL queries...")
        frontend_fields = self.extract_frontend_fields()
        print(f"✅ Extracted {len(frontend_fields)} field references from frontend")

        # 3. Validate naming consistency
        naming_result = self.validate_naming_consistency(backend_fields, frontend_fields)
        if naming_result.passed:
            print("✅ Naming convention validation passed")
        else:
            print("❌ Naming convention issues found:")
            for issue in naming_result.issues:
                print(f"   - {issue}")

        for warning in naming_result.warnings:
            print(f"⚠️  {warning}")

        # 4. Validate field existence
        existence_result = self.validate_field_existence(backend_fields, frontend_fields)
        if existence_result.passed:
            print("✅ Field existence validation passed")
        else:
            print("❌ Field existence issues found:")
            for issue in existence_result.issues:
                print(f"   - {issue}")

        # 5. Generate detailed report
        print("\n" + self.generate_schema_report(backend_fields, frontend_fields))

        # Overall result
        all_passed = naming_result.passed and existence_result.passed

        print("\n" + "=" * 50)
        if all_passed:
            print("✅ GraphQL schema validation passed")
        else:
            print("❌ GraphQL schema validation failed")
            print("\n🔧 Recommended Actions:")
            print("1. Fix field naming mismatches between frontend and backend")
            print("2. Update GraphQL queries to match actual schema")
            print("3. Implement consistent naming convention (camelCase recommended)")
            print("4. Add this validation to CI/CD pipeline")

        return all_passed


def main():
    """Main entry point"""
    if len(sys.argv) > 1:
        project_root = Path(sys.argv[1])
    else:
        project_root = Path(__file__).parent.parent

    validator = GraphQLSchemaValidator(project_root)

    if not validator.run_validation():
        sys.exit(1)

    print("\n🎉 GraphQL schema validation completed successfully!")


if __name__ == "__main__":
    main()