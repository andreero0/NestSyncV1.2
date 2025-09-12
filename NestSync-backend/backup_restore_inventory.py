#!/usr/bin/env python3
"""
Backup and Restore Utilities for NestSync Inventory Correction
==============================================================

This script provides database backup and restore functionality to ensure
safe execution of historical inventory corrections.

CRITICAL: Always create a backup before running fix_historical_inventory.py

Usage:
    # Create backup
    python backup_restore_inventory.py backup --output inventory_backup_20250109.sql
    
    # List available backups
    python backup_restore_inventory.py list-backups
    
    # Restore from backup (DANGER - only use if correction fails)
    python backup_restore_inventory.py restore --backup inventory_backup_20250109.sql
    
    # Verify backup integrity
    python backup_restore_inventory.py verify --backup inventory_backup_20250109.sql

Author: NestSync Backend Engineering Team
Date: 2025-01-09
"""

import asyncio
import sys
import os
import argparse
import logging
import subprocess
import json
import hashlib
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import tempfile

# Add the app directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.config.database import get_sync_session, init_database
from app.config.settings import settings
from app.models.inventory import InventoryItem, UsageLog
from sqlalchemy import select, func, text

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('backup_restore.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Directory for backups
BACKUP_DIR = Path(__file__).parent / "inventory_backups"
BACKUP_DIR.mkdir(exist_ok=True)


class DatabaseBackupManager:
    """Manages database backup and restore operations"""
    
    def __init__(self):
        self.backup_dir = BACKUP_DIR
        
    def generate_backup_filename(self, prefix: str = "inventory_backup") -> str:
        """Generate timestamped backup filename"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        return f"{prefix}_{timestamp}.sql"
    
    def create_backup(self, output_file: str = None) -> Tuple[str, Dict]:
        """
        Create a comprehensive database backup focusing on inventory data
        
        Returns:
            Tuple of (backup_file_path, backup_metadata)
        """
        if not output_file:
            output_file = self.generate_backup_filename()
        
        backup_path = self.backup_dir / output_file
        
        logger.info(f"Creating database backup: {backup_path}")
        
        try:
            # Extract database connection parameters
            db_url = settings.database_url.replace("postgresql+asyncpg://", "postgresql://")
            
            # Parse the database URL
            import urllib.parse
            parsed_url = urllib.parse.urlparse(db_url)
            
            # Build pg_dump command
            pg_dump_cmd = [
                "pg_dump",
                "--verbose",
                "--no-password",  # Use .pgpass or environment variables
                "--format=custom",  # Use custom format for better compression and partial restore
                "--compress=9",
                f"--host={parsed_url.hostname}",
                f"--port={parsed_url.port}",
                f"--username={parsed_url.username}",
                f"--dbname={parsed_url.path.lstrip('/')}"
            ]
            
            # Set environment variables for authentication
            env = os.environ.copy()
            if parsed_url.password:
                env["PGPASSWORD"] = parsed_url.password
            
            # Execute backup command
            logger.info("Executing pg_dump...")
            with open(backup_path, 'wb') as f:
                result = subprocess.run(
                    pg_dump_cmd,
                    stdout=f,
                    stderr=subprocess.PIPE,
                    env=env,
                    check=True
                )
            
            # Verify backup was created
            if not backup_path.exists() or backup_path.stat().st_size == 0:
                raise RuntimeError("Backup file was not created or is empty")
            
            # Generate backup metadata
            metadata = self._generate_backup_metadata(backup_path)
            
            # Save metadata alongside backup
            metadata_path = backup_path.with_suffix('.json')
            with open(metadata_path, 'w') as f:
                json.dump(metadata, f, indent=2, default=str)
            
            logger.info(f"Backup created successfully: {backup_path}")
            logger.info(f"Backup size: {metadata['file_size_mb']:.2f} MB")
            logger.info(f"Metadata saved: {metadata_path}")
            
            return str(backup_path), metadata
            
        except subprocess.CalledProcessError as e:
            error_msg = f"pg_dump failed: {e.stderr.decode() if e.stderr else str(e)}"
            logger.error(error_msg)
            # Clean up failed backup file
            if backup_path.exists():
                backup_path.unlink()
            raise RuntimeError(error_msg)
        
        except Exception as e:
            logger.error(f"Backup creation failed: {e}")
            if backup_path.exists():
                backup_path.unlink()
            raise
    
    def create_table_specific_backup(self, output_file: str = None) -> Tuple[str, Dict]:
        """
        Create a backup of only inventory-related tables for faster operations
        """
        if not output_file:
            output_file = self.generate_backup_filename("inventory_tables_backup")
        
        backup_path = self.backup_dir / output_file
        
        logger.info(f"Creating inventory tables backup: {backup_path}")
        
        try:
            # Extract database connection parameters
            db_url = settings.database_url.replace("postgresql+asyncpg://", "postgresql://")
            import urllib.parse
            parsed_url = urllib.parse.urlparse(db_url)
            
            # Inventory-related tables
            tables = [
                "inventory_items",
                "usage_logs",
                "stock_thresholds",
                "children",  # Need for foreign key relationships
                "users"      # Need for foreign key relationships
            ]
            
            # Build pg_dump command for specific tables
            pg_dump_cmd = [
                "pg_dump",
                "--verbose",
                "--no-password",
                "--format=custom",
                "--compress=9",
                f"--host={parsed_url.hostname}",
                f"--port={parsed_url.port}",
                f"--username={parsed_url.username}",
                f"--dbname={parsed_url.path.lstrip('/')}"
            ]
            
            # Add table specifications
            for table in tables:
                pg_dump_cmd.extend(["--table", table])
            
            # Set environment variables for authentication
            env = os.environ.copy()
            if parsed_url.password:
                env["PGPASSWORD"] = parsed_url.password
            
            # Execute backup command
            logger.info(f"Backing up tables: {', '.join(tables)}")
            with open(backup_path, 'wb') as f:
                result = subprocess.run(
                    pg_dump_cmd,
                    stdout=f,
                    stderr=subprocess.PIPE,
                    env=env,
                    check=True
                )
            
            # Generate metadata
            metadata = self._generate_backup_metadata(backup_path, tables)
            
            # Save metadata
            metadata_path = backup_path.with_suffix('.json')
            with open(metadata_path, 'w') as f:
                json.dump(metadata, f, indent=2, default=str)
            
            logger.info(f"Table-specific backup created: {backup_path}")
            return str(backup_path), metadata
            
        except Exception as e:
            logger.error(f"Table-specific backup failed: {e}")
            if backup_path.exists():
                backup_path.unlink()
            raise
    
    def _generate_backup_metadata(self, backup_path: Path, tables: List[str] = None) -> Dict:
        """Generate metadata about the backup"""
        
        # File information
        stat = backup_path.stat()
        metadata = {
            "backup_filename": backup_path.name,
            "backup_path": str(backup_path),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "file_size_bytes": stat.st_size,
            "file_size_mb": stat.st_size / (1024 * 1024),
            "backup_type": "table_specific" if tables else "full_database",
            "tables_included": tables or "all_tables"
        }
        
        # Generate file checksum for integrity verification
        with open(backup_path, 'rb') as f:
            file_hash = hashlib.sha256()
            while chunk := f.read(8192):
                file_hash.update(chunk)
            metadata["sha256_checksum"] = file_hash.hexdigest()
        
        # Database statistics at time of backup
        try:
            session = get_sync_session()
            
            # Count inventory items
            inventory_count = session.execute(
                select(func.count(InventoryItem.id)).where(InventoryItem.is_deleted == False)
            ).scalar()
            
            # Count usage logs  
            usage_count = session.execute(
                select(func.count(UsageLog.id)).where(UsageLog.is_deleted == False)
            ).scalar()
            
            # Count diaper changes specifically
            diaper_changes = session.execute(
                select(func.count(UsageLog.id)).where(
                    (UsageLog.usage_type == "diaper_change") & 
                    (UsageLog.is_deleted == False)
                )
            ).scalar()
            
            metadata["database_stats"] = {
                "inventory_items_count": inventory_count,
                "usage_logs_count": usage_count,
                "diaper_changes_count": diaper_changes,
                "snapshot_timestamp": datetime.now(timezone.utc).isoformat()
            }
            
            session.close()
            
        except Exception as e:
            logger.warning(f"Could not collect database statistics: {e}")
            metadata["database_stats"] = {"error": str(e)}
        
        return metadata
    
    def list_backups(self) -> List[Dict]:
        """List all available backups with metadata"""
        backups = []
        
        for backup_file in self.backup_dir.glob("*.sql"):
            metadata_file = backup_file.with_suffix('.json')
            
            backup_info = {
                "filename": backup_file.name,
                "path": str(backup_file),
                "size_mb": backup_file.stat().st_size / (1024 * 1024),
                "created": datetime.fromtimestamp(backup_file.stat().st_ctime),
                "has_metadata": metadata_file.exists()
            }
            
            # Load metadata if available
            if metadata_file.exists():
                try:
                    with open(metadata_file, 'r') as f:
                        metadata = json.load(f)
                    backup_info["metadata"] = metadata
                except Exception as e:
                    backup_info["metadata_error"] = str(e)
            
            backups.append(backup_info)
        
        # Sort by creation time (newest first)
        backups.sort(key=lambda x: x["created"], reverse=True)
        
        return backups
    
    def verify_backup(self, backup_file: str) -> Dict:
        """Verify backup file integrity and readability"""
        backup_path = Path(backup_file)
        if not backup_path.is_absolute():
            backup_path = self.backup_dir / backup_file
        
        verification = {
            "file_exists": backup_path.exists(),
            "is_readable": False,
            "checksum_valid": False,
            "pg_restore_test": False,
            "errors": []
        }
        
        if not verification["file_exists"]:
            verification["errors"].append("Backup file does not exist")
            return verification
        
        # Check if file is readable
        try:
            with open(backup_path, 'rb') as f:
                f.read(1024)  # Read first 1KB
            verification["is_readable"] = True
        except Exception as e:
            verification["errors"].append(f"File not readable: {e}")
        
        # Verify checksum if metadata exists
        metadata_path = backup_path.with_suffix('.json')
        if metadata_path.exists():
            try:
                with open(metadata_path, 'r') as f:
                    metadata = json.load(f)
                
                expected_checksum = metadata.get("sha256_checksum")
                if expected_checksum:
                    with open(backup_path, 'rb') as f:
                        file_hash = hashlib.sha256()
                        while chunk := f.read(8192):
                            file_hash.update(chunk)
                        actual_checksum = file_hash.hexdigest()
                    
                    verification["checksum_valid"] = (expected_checksum == actual_checksum)
                    if not verification["checksum_valid"]:
                        verification["errors"].append("Checksum verification failed")
                
            except Exception as e:
                verification["errors"].append(f"Could not verify checksum: {e}")
        
        # Test with pg_restore --list
        try:
            pg_restore_cmd = ["pg_restore", "--list", str(backup_path)]
            result = subprocess.run(
                pg_restore_cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                check=True
            )
            verification["pg_restore_test"] = True
        except subprocess.CalledProcessError as e:
            verification["errors"].append(f"pg_restore test failed: {e.stderr.decode()}")
        except Exception as e:
            verification["errors"].append(f"Could not test with pg_restore: {e}")
        
        return verification
    
    def restore_from_backup(self, backup_file: str, confirm: bool = False) -> bool:
        """
        Restore database from backup file
        
        WARNING: This will overwrite current database data!
        """
        if not confirm:
            logger.error("Restore operation requires explicit confirmation (--confirm flag)")
            return False
        
        backup_path = Path(backup_file)
        if not backup_path.is_absolute():
            backup_path = self.backup_dir / backup_file
        
        if not backup_path.exists():
            raise FileNotFoundError(f"Backup file not found: {backup_path}")
        
        logger.warning("*" * 60)
        logger.warning("WARNING: RESTORE OPERATION IN PROGRESS")
        logger.warning("This will OVERWRITE current database data!")
        logger.warning("*" * 60)
        
        try:
            # Verify backup first
            verification = self.verify_backup(str(backup_path))
            if not all([verification["file_exists"], verification["is_readable"], verification["pg_restore_test"]]):
                logger.error("Backup verification failed. Cannot proceed with restore.")
                return False
            
            # Extract database connection parameters
            db_url = settings.database_url.replace("postgresql+asyncpg://", "postgresql://")
            import urllib.parse
            parsed_url = urllib.parse.urlparse(db_url)
            
            # Build pg_restore command
            pg_restore_cmd = [
                "pg_restore",
                "--verbose",
                "--clean",  # Drop existing objects before recreating
                "--if-exists",  # Don't error on missing objects
                "--no-password",
                f"--host={parsed_url.hostname}",
                f"--port={parsed_url.port}",
                f"--username={parsed_url.username}",
                f"--dbname={parsed_url.path.lstrip('/')}",
                str(backup_path)
            ]
            
            # Set environment variables for authentication
            env = os.environ.copy()
            if parsed_url.password:
                env["PGPASSWORD"] = parsed_url.password
            
            # Execute restore
            logger.info("Executing pg_restore...")
            result = subprocess.run(
                pg_restore_cmd,
                stderr=subprocess.PIPE,
                env=env,
                check=True
            )
            
            logger.info("Database restore completed successfully")
            logger.info("Please verify that the data has been restored correctly")
            
            return True
            
        except subprocess.CalledProcessError as e:
            error_msg = f"pg_restore failed: {e.stderr.decode() if e.stderr else str(e)}"
            logger.error(error_msg)
            raise RuntimeError(error_msg)
        
        except Exception as e:
            logger.error(f"Restore operation failed: {e}")
            raise


def main():
    parser = argparse.ArgumentParser(description="Database backup and restore utilities")
    subparsers = parser.add_subparsers(dest='command', help='Available commands')
    
    # Backup command
    backup_parser = subparsers.add_parser('backup', help='Create database backup')
    backup_parser.add_argument('--output', help='Output backup filename')
    backup_parser.add_argument('--tables-only', action='store_true', 
                              help='Backup only inventory-related tables (faster)')
    
    # List backups command
    list_parser = subparsers.add_parser('list-backups', help='List available backups')
    
    # Verify backup command
    verify_parser = subparsers.add_parser('verify', help='Verify backup integrity')
    verify_parser.add_argument('--backup', required=True, help='Backup file to verify')
    
    # Restore command (dangerous)
    restore_parser = subparsers.add_parser('restore', help='Restore from backup (DANGEROUS)')
    restore_parser.add_argument('--backup', required=True, help='Backup file to restore from')
    restore_parser.add_argument('--confirm', action='store_true', 
                               help='Confirm that you want to overwrite current data')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        sys.exit(1)
    
    async def run_command():
        try:
            await init_database()
            manager = DatabaseBackupManager()
            
            if args.command == 'backup':
                if args.tables_only:
                    backup_file, metadata = manager.create_table_specific_backup(args.output)
                else:
                    backup_file, metadata = manager.create_backup(args.output)
                
                print(f"\nBackup created successfully!")
                print(f"File: {backup_file}")
                print(f"Size: {metadata['file_size_mb']:.2f} MB")
                print(f"Type: {metadata['backup_type']}")
                if metadata.get('database_stats'):
                    stats = metadata['database_stats']
                    print(f"Inventory items: {stats.get('inventory_items_count', 'N/A')}")
                    print(f"Usage logs: {stats.get('usage_logs_count', 'N/A')}")
                
            elif args.command == 'list-backups':
                backups = manager.list_backups()
                if not backups:
                    print("No backups found.")
                    return
                
                print(f"\nAvailable backups ({len(backups)} found):")
                print("-" * 80)
                for backup in backups:
                    print(f"File: {backup['filename']}")
                    print(f"Size: {backup['size_mb']:.2f} MB")
                    print(f"Created: {backup['created']}")
                    if backup.get('metadata'):
                        metadata = backup['metadata']
                        print(f"Type: {metadata.get('backup_type', 'unknown')}")
                        if metadata.get('database_stats'):
                            stats = metadata['database_stats']
                            print(f"Items: {stats.get('inventory_items_count', 'N/A')} inventory, {stats.get('usage_logs_count', 'N/A')} logs")
                    print("-" * 80)
            
            elif args.command == 'verify':
                verification = manager.verify_backup(args.backup)
                print(f"\nBackup verification results for: {args.backup}")
                print("-" * 50)
                print(f"File exists: {'✓' if verification['file_exists'] else '✗'}")
                print(f"Readable: {'✓' if verification['is_readable'] else '✗'}")
                print(f"Checksum valid: {'✓' if verification['checksum_valid'] else '✗'}")
                print(f"pg_restore test: {'✓' if verification['pg_restore_test'] else '✗'}")
                
                if verification['errors']:
                    print("\nErrors found:")
                    for error in verification['errors']:
                        print(f"  - {error}")
                else:
                    print("\n✓ Backup file appears to be valid")
            
            elif args.command == 'restore':
                success = manager.restore_from_backup(args.backup, args.confirm)
                if success:
                    print("\n✓ Restore operation completed")
                    print("Please verify your data integrity")
                else:
                    print("\n✗ Restore operation failed")
            
        except Exception as e:
            logger.error(f"Command failed: {e}")
            sys.exit(1)
    
    asyncio.run(run_command())


if __name__ == "__main__":
    main()