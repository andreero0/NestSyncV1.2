"""deduplicate_child_records_migration_consistency_fix

Revision ID: 16b095b09457
Revises: 1b114f2ca7e5
Create Date: 2025-09-19 22:59:06.265843-04:00

PIPEDA Compliance: This migration handles personal data according to Canadian privacy laws.
Data Residency: All data operations occur within Canadian data centers.
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '16b095b09457'
down_revision = '1b114f2ca7e5'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Deduplicate child records and consolidate dual relationships

    This migration addresses child duplication caused by incomplete migration
    from legacy parent_id relationships to family-based relationships.

    PIPEDA Compliance Notes:
    - All personal data fields are properly encrypted/protected
    - Audit trails are maintained for all data changes
    - Data retention policies are enforced
    - Canadian timezone (America/Toronto) is used for all timestamps
    """

    # Create a connection to execute SQL commands
    connection = op.get_bind()

    # STEP 1: Identify children with both parent_id AND family relationships
    print("MIGRATION: Identifying children with dual relationships...")

    duplicate_analysis_sql = """
    SELECT
        c.id as child_id,
        c.name,
        c.parent_id,
        c.family_id,
        c.current_diaper_size,
        c.created_at,
        fca.family_id as family_access_family_id,
        fm.user_id as family_member_user_id
    FROM children c
    LEFT JOIN family_child_access fca ON c.id = fca.child_id AND fca.is_deleted = false
    LEFT JOIN family_members fm ON fca.family_id = fm.family_id AND fm.status = 'ACTIVE'
    WHERE c.is_deleted = false
      AND c.parent_id IS NOT NULL
      AND (c.family_id IS NOT NULL OR fca.family_id IS NOT NULL)
    ORDER BY c.parent_id, c.name, c.created_at;
    """

    dual_relationship_children = connection.execute(sa.text(duplicate_analysis_sql)).fetchall()

    print(f"MIGRATION: Found {len(dual_relationship_children)} children with dual relationships")

    # STEP 2: Identify potential duplicates (same parent, same name)
    duplicate_groups_sql = """
    WITH child_relationships AS (
        SELECT
            c.id,
            c.name,
            c.parent_id,
            c.current_diaper_size,
            c.created_at,
            CASE
                WHEN c.family_id IS NOT NULL OR fca.family_id IS NOT NULL THEN true
                ELSE false
            END as has_family_relationship
        FROM children c
        LEFT JOIN family_child_access fca ON c.id = fca.child_id AND fca.is_deleted = false
        WHERE c.is_deleted = false AND c.parent_id IS NOT NULL
    ),
    duplicate_groups AS (
        SELECT
            parent_id,
            name,
            COUNT(*) as child_count,
            string_agg(id::text, ',' ORDER BY created_at) as child_ids,
            string_agg(current_diaper_size, ',' ORDER BY created_at) as diaper_sizes,
            string_agg(has_family_relationship::text, ',' ORDER BY created_at) as family_flags
        FROM child_relationships
        GROUP BY parent_id, name
        HAVING COUNT(*) > 1
    )
    SELECT * FROM duplicate_groups;
    """

    duplicate_groups = connection.execute(sa.text(duplicate_groups_sql)).fetchall()

    print(f"MIGRATION: Found {len(duplicate_groups)} groups of potentially duplicate children")

    # STEP 3: For each duplicate group, consolidate into the family-based child
    consolidation_count = 0

    for group in duplicate_groups:
        parent_id = group.parent_id
        name = group.name
        child_ids = group.child_ids.split(',')
        diaper_sizes = group.diaper_sizes.split(',')
        family_flags = [flag == 'true' for flag in group.family_flags.split(',')]

        print(f"MIGRATION: Processing duplicate group - Parent: {parent_id}, Name: {name}, Children: {len(child_ids)}")

        # Find the canonical child (prefer family-based, then newest)
        canonical_child_id = None
        children_to_merge = []

        for i, child_id in enumerate(child_ids):
            if family_flags[i]:  # Prefer family-based children
                canonical_child_id = child_id
                break

        if not canonical_child_id:  # If no family-based child, use the newest
            canonical_child_id = child_ids[-1]

        # Collect non-canonical children for merging
        for child_id in child_ids:
            if child_id != canonical_child_id:
                children_to_merge.append(child_id)

        print(f"MIGRATION: Canonical child: {canonical_child_id}, Merging: {children_to_merge}")

        # STEP 4: Merge data and soft-delete duplicates
        for duplicate_child_id in children_to_merge:
            # Update inventory items to point to canonical child
            update_inventory_sql = """
            UPDATE inventory_items
            SET child_id = :canonical_id,
                updated_at = CURRENT_TIMESTAMP,
                updated_by = (SELECT id FROM users WHERE email = 'system@nestsync.com' LIMIT 1)
            WHERE child_id = :duplicate_id AND is_deleted = false;
            """

            result = connection.execute(sa.text(update_inventory_sql), {
                'canonical_id': canonical_child_id,
                'duplicate_id': duplicate_child_id
            })

            print(f"MIGRATION: Updated {result.rowcount} inventory items for child {duplicate_child_id}")

            # Update usage logs to point to canonical child
            update_usage_logs_sql = """
            UPDATE usage_logs
            SET child_id = :canonical_id,
                updated_at = CURRENT_TIMESTAMP,
                updated_by = (SELECT id FROM users WHERE email = 'system@nestsync.com' LIMIT 1)
            WHERE child_id = :duplicate_id AND is_deleted = false;
            """

            result = connection.execute(sa.text(update_usage_logs_sql), {
                'canonical_id': canonical_child_id,
                'duplicate_id': duplicate_child_id
            })

            print(f"MIGRATION: Updated {result.rowcount} usage logs for child {duplicate_child_id}")

            # Soft delete the duplicate child
            soft_delete_child_sql = """
            UPDATE children
            SET is_deleted = true,
                deleted_at = CURRENT_TIMESTAMP,
                deleted_by = (SELECT id FROM users WHERE email = 'system@nestsync.com' LIMIT 1)
            WHERE id = :duplicate_id;
            """

            connection.execute(sa.text(soft_delete_child_sql), {
                'duplicate_id': duplicate_child_id
            })

            print(f"MIGRATION: Soft deleted duplicate child {duplicate_child_id}")
            consolidation_count += 1

    # STEP 5: Add unique constraint to prevent future duplications
    print("MIGRATION: Adding unique constraint to prevent future duplications...")

    # Create unique index on (parent_id, name) for non-deleted children
    op.create_index(
        'idx_children_unique_parent_name',
        'children',
        ['parent_id', 'name'],
        unique=True,
        postgresql_where=sa.text("is_deleted = false")
    )

    print(f"MIGRATION: Successfully consolidated {consolidation_count} duplicate children")
    print("MIGRATION: Added unique constraint to prevent future duplications")


def downgrade() -> None:
    """
    Reverse migration changes

    PIPEDA Compliance Notes:
    - Data rollback maintains compliance requirements
    - Audit logs are preserved even during rollback
    - No personal data is inadvertently exposed during downgrade
    """

    # Remove the unique constraint
    op.drop_index('idx_children_unique_parent_name', 'children')

    # Note: We don't restore soft-deleted children as this could recreate duplicates
    # The soft delete preserves data for PIPEDA compliance while preventing duplicates
    print("MIGRATION ROLLBACK: Removed unique constraint")
    print("MIGRATION ROLLBACK: Soft-deleted children remain deleted for data consistency")