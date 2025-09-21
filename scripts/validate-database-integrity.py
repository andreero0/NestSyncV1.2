#!/usr/bin/env python3
"""
NestSync Database Integrity Validation System
Prevents database migration corruption and SQLAlchemy metadata caching failures

This script validates complete database consistency to prevent the P0 failures
documented in bottlenecks.md:
1. Database Migration State Corruption
2. SQLAlchemy Metadata Caching Issues
"""

import subprocess
import sys
import asyncio
import json
import psycopg2
from pathlib import Path
from typing import Dict, List, Tuple, Optional, Set
import os
from dataclasses import dataclass
from sqlalchemy import create_engine, text, MetaData
from sqlalchemy.ext.asyncio import create_async_engine
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class MigrationRecord:
    version_num: str
    is_applied: bool
    actual_tables: List[str]
    expected_tables: List[str]
    missing_tables: List[str]


@dataclass
class ValidationResult:
    passed: bool
    issues: List[str]
    warnings: List[str]
    recovery_actions: List[str]


class DatabaseIntegrityValidator:
    def __init__(self, project_root: Path):
        self.project_root = project_root
        self.backend_path = project_root / "NestSync-backend"
        self.alembic_path = self.backend_path / "alembic"

        # Database connection URLs
        self.sync_db_url = "postgresql://postgres:password@localhost:54322/postgres"
        self.async_db_url = "postgresql+asyncpg://postgres:password@localhost:54322/postgres"

        # Expected tables per migration (from bottlenecks.md)
        self.migration_table_map = {
            "002": ["users", "children", "consent_records"],
            "003": ["notification_preferences", "notification_history", "notification_analytics"],
            "004": ["analytics_cache", "weekly_trends", "inventory_insights"]
        }

    def get_alembic_current_version(self) -> Optional[str]:
        """Get current Alembic migration version"""
        try:
            os.chdir(self.backend_path)
            result = subprocess.run(
                ["alembic", "current"],
                capture_output=True,
                text=True,
                check=True
            )

            # Parse alembic current output
            output = result.stdout.strip()
            if "current)" in output:
                # Extract version from format like "003 (current)"
                version = output.split()[0]
                return version
            return None

        except subprocess.CalledProcessError as e:
            logger.error(f"Failed to get Alembic current version: {e}")
            return None

    def get_alembic_history(self) -> List[str]:
        """Get list of all available migrations"""
        try:
            os.chdir(self.backend_path)
            result = subprocess.run(
                ["alembic", "history"],
                capture_output=True,
                text=True,
                check=True
            )

            versions = []
            for line in result.stdout.split('\n'):
                if '->' in line and 'Rev:' in line:
                    # Extract version from format like "Rev: 003"
                    parts = line.split('Rev:')
                    if len(parts) > 1:
                        version = parts[1].strip().split()[0]
                        versions.append(version)

            return versions

        except subprocess.CalledProcessError as e:
            logger.error(f"Failed to get Alembic history: {e}")
            return []

    def get_database_tables(self) -> List[str]:
        """Get list of actual tables in database"""
        try:
            conn = psycopg2.connect(self.sync_db_url)
            cursor = conn.cursor()

            cursor.execute("""
                SELECT tablename
                FROM pg_tables
                WHERE schemaname = 'public'
                ORDER BY tablename;
            """)

            tables = [row[0] for row in cursor.fetchall()]
            conn.close()

            return tables

        except Exception as e:
            logger.error(f"Failed to get database tables: {e}")
            return []

    def verify_table_exists(self, table_name: str) -> bool:
        """Verify specific table exists and is accessible"""
        try:
            conn = psycopg2.connect(self.sync_db_url)
            cursor = conn.cursor()

            cursor.execute("""
                SELECT to_regclass(%s) IS NOT NULL;
            """, (f"public.{table_name}",))

            exists = cursor.fetchone()[0]
            conn.close()

            return exists

        except Exception as e:
            logger.error(f"Failed to verify table {table_name}: {e}")
            return False

    def test_table_access(self, table_name: str) -> Tuple[bool, Optional[str]]:
        """Test if table is accessible for basic operations"""
        try:
            conn = psycopg2.connect(self.sync_db_url)
            cursor = conn.cursor()

            # Test SELECT (should work even if empty)
            cursor.execute(f"SELECT COUNT(*) FROM {table_name};")
            count = cursor.fetchone()[0]

            # Test table structure access
            cursor.execute(f"""
                SELECT column_name, data_type
                FROM information_schema.columns
                WHERE table_name = %s
                AND table_schema = 'public';
            """, (table_name,))

            columns = cursor.fetchall()
            conn.close()

            if len(columns) == 0:
                return False, f"Table {table_name} has no columns"

            return True, f"Table {table_name} accessible with {count} rows, {len(columns)} columns"

        except Exception as e:
            return False, f"Table {table_name} access failed: {e}"

    async def test_sqlalchemy_metadata_cache(self) -> ValidationResult:
        """Test SQLAlchemy metadata cache consistency"""
        issues = []
        warnings = []
        recovery_actions = []

        try:
            # Test sync engine metadata
            sync_engine = create_engine(self.sync_db_url)
            sync_metadata = MetaData()
            sync_metadata.reflect(bind=sync_engine)

            sync_tables = list(sync_metadata.tables.keys())

            # Test async engine metadata
            async_engine = create_async_engine(self.async_db_url)

            async with async_engine.begin() as conn:
                # Create fresh metadata for comparison
                async_metadata = MetaData()
                await conn.run_sync(async_metadata.reflect)
                async_tables = list(async_metadata.tables.keys())

            await async_engine.dispose()

            # Compare metadata consistency
            if set(sync_tables) != set(async_tables):
                issues.append(
                    f"SQLAlchemy metadata inconsistency: "
                    f"sync={len(sync_tables)} tables, async={len(async_tables)} tables"
                )
                recovery_actions.append("refresh_database_metadata()")

            # Test actual database vs metadata
            actual_tables = self.get_database_tables()
            metadata_tables = set(sync_tables)
            actual_table_set = set(actual_tables)

            missing_in_metadata = actual_table_set - metadata_tables
            if missing_in_metadata:
                issues.append(f"Tables missing from metadata cache: {missing_in_metadata}")
                recovery_actions.append("Base.metadata.reflect()")

            extra_in_metadata = metadata_tables - actual_table_set
            if extra_in_metadata:
                warnings.append(f"Stale tables in metadata cache: {extra_in_metadata}")
                recovery_actions.append("Base.metadata.clear()")

        except Exception as e:
            issues.append(f"SQLAlchemy metadata cache test failed: {e}")
            recovery_actions.append("Restart application and refresh metadata")

        return ValidationResult(
            passed=len(issues) == 0,
            issues=issues,
            warnings=warnings,
            recovery_actions=recovery_actions
        )

    def validate_migration_consistency(self) -> ValidationResult:
        """Validate Alembic migration state vs actual database state"""
        issues = []
        warnings = []
        recovery_actions = []

        try:
            # Get current migration version
            current_version = self.get_alembic_current_version()
            if not current_version:
                issues.append("Cannot determine current Alembic version")
                recovery_actions.append("Run 'alembic current' to check migration state")
                return ValidationResult(False, issues, warnings, recovery_actions)

            # Get actual tables
            actual_tables = set(self.get_database_tables())

            # Check expected tables for current migration
            expected_tables = set()
            for version, tables in self.migration_table_map.items():
                if version <= current_version:
                    expected_tables.update(tables)

            # Find missing tables
            missing_tables = expected_tables - actual_tables
            if missing_tables:
                issues.append(
                    f"Migration {current_version} applied but tables missing: {missing_tables}"
                )
                recovery_actions.extend([
                    f"alembic downgrade {current_version}",
                    f"alembic upgrade {current_version}",
                    "Verify table creation with \\dt"
                ])

            # Verify table accessibility for critical tables
            critical_tables = ["users", "notification_preferences"]
            for table in critical_tables:
                if table in actual_tables:
                    accessible, message = self.test_table_access(table)
                    if not accessible:
                        issues.append(f"Critical table {table} not accessible: {message}")
                        recovery_actions.append(f"ANALYZE {table}; VACUUM {table};")

            # Check for orphaned tables
            core_app_tables = {"users", "children", "consent_records", "notification_preferences"}
            orphaned_tables = actual_tables - expected_tables - {
                "alembic_version", "spatial_ref_sys"  # System tables
            }

            if orphaned_tables & core_app_tables:
                warnings.append(f"Unexpected tables found: {orphaned_tables & core_app_tables}")

        except Exception as e:
            issues.append(f"Migration consistency validation failed: {e}")
            recovery_actions.append("Check database connectivity and Alembic configuration")

        return ValidationResult(
            passed=len(issues) == 0,
            issues=issues,
            warnings=warnings,
            recovery_actions=recovery_actions
        )

    def test_database_connectivity(self) -> ValidationResult:
        """Test basic database connectivity and permissions"""
        issues = []
        warnings = []
        recovery_actions = []

        try:
            # Test basic connection
            conn = psycopg2.connect(self.sync_db_url)

            # Test permissions
            cursor = conn.cursor()
            cursor.execute("SELECT current_user, current_database(), version();")
            user, db, version = cursor.fetchone()

            # Test write permissions
            try:
                cursor.execute("CREATE TEMP TABLE test_permissions (id INTEGER);")
                cursor.execute("DROP TABLE test_permissions;")
            except Exception as e:
                issues.append(f"Database write permissions failed: {e}")
                recovery_actions.append("Check database user permissions")

            conn.close()

            logger.info(f"Database connection successful: {user}@{db}")

        except Exception as e:
            issues.append(f"Database connectivity failed: {e}")
            recovery_actions.extend([
                "Check database server is running",
                "Verify connection credentials",
                "Test network connectivity to database"
            ])

        return ValidationResult(
            passed=len(issues) == 0,
            issues=issues,
            warnings=warnings,
            recovery_actions=recovery_actions
        )

    def generate_recovery_script(self, all_issues: List[str],
                                all_recovery_actions: List[str]) -> str:
        """Generate automated recovery script for database issues"""
        script_lines = [
            "#!/bin/bash",
            "# NestSync Database Recovery Script",
            "# Generated by database integrity validation",
            "",
            "set -e  # Exit on first error",
            "",
            "echo '🔧 NestSync Database Recovery Started'",
            "echo '======================================'",
            ""
        ]

        # Add issue documentation
        script_lines.extend([
            "echo '📋 Issues Detected:'",
            *[f"echo '  - {issue}'" for issue in all_issues],
            "echo ''",
            ""
        ])

        # Add recovery commands
        script_lines.extend([
            "echo '🛠️  Applying Recovery Actions:'",
            "echo ''",
            ""
        ])

        # Convert recovery actions to bash commands
        for action in all_recovery_actions:
            if action.startswith("alembic"):
                script_lines.extend([
                    f"echo 'Running: {action}'",
                    f"cd {self.backend_path}",
                    f"{action}",
                    "echo '✅ Command completed'",
                    "echo ''",
                    ""
                ])
            elif "refresh_database_metadata" in action:
                script_lines.extend([
                    "echo 'Refreshing SQLAlchemy metadata cache'",
                    "# Manual intervention required - restart application",
                    "echo '⚠️  Restart backend application to refresh metadata'",
                    "echo ''",
                    ""
                ])

        script_lines.extend([
            "echo '✅ Database recovery completed'",
            "echo 'Please run validation again to verify fixes'",
            ""
        ])

        return "\n".join(script_lines)

    async def run_validation(self) -> bool:
        """Run complete database integrity validation"""
        print("🔍 NestSync Database Integrity Validation")
        print("=" * 50)

        all_passed = True
        all_issues = []
        all_warnings = []
        all_recovery_actions = []

        # 1. Test database connectivity
        print("📡 Testing database connectivity...")
        connectivity_result = self.test_database_connectivity()
        if connectivity_result.passed:
            print("✅ Database connectivity test passed")
        else:
            print("❌ Database connectivity issues:")
            for issue in connectivity_result.issues:
                print(f"   - {issue}")
            all_passed = False

        all_issues.extend(connectivity_result.issues)
        all_warnings.extend(connectivity_result.warnings)
        all_recovery_actions.extend(connectivity_result.recovery_actions)

        # 2. Validate migration consistency
        print("📊 Validating migration consistency...")
        migration_result = self.validate_migration_consistency()
        if migration_result.passed:
            print("✅ Migration consistency validation passed")
        else:
            print("❌ Migration consistency issues:")
            for issue in migration_result.issues:
                print(f"   - {issue}")
            all_passed = False

        all_issues.extend(migration_result.issues)
        all_warnings.extend(migration_result.warnings)
        all_recovery_actions.extend(migration_result.recovery_actions)

        # 3. Test SQLAlchemy metadata cache
        print("🔄 Testing SQLAlchemy metadata cache...")
        metadata_result = await self.test_sqlalchemy_metadata_cache()
        if metadata_result.passed:
            print("✅ SQLAlchemy metadata cache validation passed")
        else:
            print("❌ SQLAlchemy metadata cache issues:")
            for issue in metadata_result.issues:
                print(f"   - {issue}")
            all_passed = False

        all_issues.extend(metadata_result.issues)
        all_warnings.extend(metadata_result.warnings)
        all_recovery_actions.extend(metadata_result.recovery_actions)

        # 4. Show warnings
        if all_warnings:
            print("\n⚠️  Warnings:")
            for warning in all_warnings:
                print(f"   - {warning}")

        # 5. Generate recovery script if needed
        if not all_passed:
            recovery_script = self.generate_recovery_script(all_issues, all_recovery_actions)
            script_path = self.backend_path / "database_recovery.sh"

            with open(script_path, 'w') as f:
                f.write(recovery_script)

            print(f"\n🔧 Recovery script generated: {script_path}")
            print("Run the script to attempt automatic recovery:")
            print(f"  chmod +x {script_path}")
            print(f"  {script_path}")

        # 6. Final status
        print("\n" + "=" * 50)
        if all_passed:
            print("✅ All database integrity validations passed")
            return True
        else:
            print("❌ Database integrity validation failed")
            print(f"\nIssues found: {len(all_issues)}")
            print(f"Recovery actions available: {len(all_recovery_actions)}")
            return False


async def main():
    """Main entry point"""
    if len(sys.argv) > 1:
        project_root = Path(sys.argv[1])
    else:
        project_root = Path(__file__).parent.parent

    validator = DatabaseIntegrityValidator(project_root)

    if not await validator.run_validation():
        sys.exit(1)

    print("\n🎉 Database integrity validation completed successfully!")


if __name__ == "__main__":
    asyncio.run(main())