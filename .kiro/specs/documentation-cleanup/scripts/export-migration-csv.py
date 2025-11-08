#!/usr/bin/env python3
"""
Export migration plan to CSV for easier review and editing
"""

import json
import csv
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
ANALYSIS_DIR = SCRIPT_DIR.parent / "analysis"
# Fallback to actual location if not found
if not ANALYSIS_DIR.exists():
    WORKSPACE_ROOT = Path(__file__).parent.parent.parent.parent
    ANALYSIS_DIR = WORKSPACE_ROOT / ".kiro" / ".kiro" / "specs" / "documentation-cleanup" / "analysis"

def export_to_csv():
    """Export migration plan to CSV"""
    
    # Load migration plan
    migration_file = ANALYSIS_DIR / "migration-plan.json"
    with open(migration_file, 'r') as f:
        data = json.load(f)
    
    if isinstance(data, dict):
        migrations = data.get('migrations', [])
    else:
        migrations = data
    
    # Export to CSV
    csv_file = ANALYSIS_DIR / "migration-plan.csv"
    
    with open(csv_file, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['Source', 'Destination', 'Reason', 'Priority', 'Action', 'Status'])
        
        for migration in migrations:
            source = migration.get('source', '')
            if isinstance(source, list):
                source = ' | '.join(source)
            
            writer.writerow([
                source,
                migration.get('destination', ''),
                migration.get('reason', ''),
                migration.get('priority', ''),
                migration.get('action', ''),
                'pending'
            ])
    
    print(f"✓ Migration plan exported to: {csv_file}")
    print(f"✓ Total migrations: {len(migrations)}")

if __name__ == "__main__":
    export_to_csv()
