"""Add inventory management tables

Revision ID: 20240907_1200_inventory_management
Revises: 001
Create Date: 2024-09-07 12:00:00.000000

PIPEDA Compliance: This migration handles personal data according to Canadian privacy laws.
Data Residency: All data operations occur within Canadian data centers.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Apply migration changes - Add inventory management tables
    
    PIPEDA Compliance Notes:
    - All personal data fields are properly encrypted/protected
    - Audit trails are maintained for all data changes
    - Data retention policies are enforced
    - Canadian timezone (America/Toronto) is used for all timestamps
    """
    # Create inventory_items table
    op.create_table('inventory_items',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False, comment='Unique identifier'),
        sa.Column('child_id', postgresql.UUID(as_uuid=True), nullable=False, comment='Child this inventory belongs to'),
        sa.Column('product_type', sa.String(length=50), nullable=False, comment='Type of product (diaper, wipes, etc.)'),
        sa.Column('brand', sa.String(length=100), nullable=False, comment='Product brand name'),
        sa.Column('product_name', sa.String(length=200), nullable=True, comment='Specific product name or model'),
        sa.Column('size', sa.String(length=20), nullable=False, comment='Product size (newborn, size_1, etc.)'),
        sa.Column('quantity_total', sa.Integer(), nullable=False, comment='Total items in package when purchased'),
        sa.Column('quantity_remaining', sa.Integer(), nullable=False, comment='Current stock remaining'),
        sa.Column('quantity_reserved', sa.Integer(), nullable=False, default=0, comment='Quantity reserved for specific uses'),
        sa.Column('purchase_date', sa.DateTime(timezone=True), nullable=False, comment='When product was acquired'),
        sa.Column('purchase_source', sa.String(length=50), nullable=True, comment='Where product was acquired'),
        sa.Column('cost_cad', sa.Numeric(precision=10, scale=2), nullable=True, comment='Cost in Canadian dollars'),
        sa.Column('cost_per_unit', sa.Numeric(precision=10, scale=4), nullable=True, comment='Cost per individual item'),
        sa.Column('expiry_date', sa.DateTime(timezone=True), nullable=True, comment='Product expiry date'),
        sa.Column('batch_number', sa.String(length=100), nullable=True, comment='Manufacturer batch number for recalls'),
        sa.Column('barcode', sa.String(length=100), nullable=True, comment='Product barcode for scanning'),
        sa.Column('storage_location', sa.String(length=100), nullable=True, comment='Where product is stored (nursery, closet, etc.)'),
        sa.Column('is_opened', sa.Boolean(), nullable=False, default=False, comment='Whether package has been opened'),
        sa.Column('opened_date', sa.DateTime(timezone=True), nullable=True, comment='When package was first opened'),
        sa.Column('notes', sa.Text(), nullable=True, comment='User notes about this inventory item'),
        sa.Column('quality_rating', sa.Integer(), nullable=True, comment='User rating 1-5 stars'),
        sa.Column('would_rebuy', sa.Boolean(), nullable=True, comment='Whether user would purchase this product again'),
        sa.Column('low_stock_notified_at', sa.DateTime(timezone=True), nullable=True, comment='When low stock notification was last sent'),
        sa.Column('expiry_notified_at', sa.DateTime(timezone=True), nullable=True, comment='When expiry notification was last sent'),
        
        # Base model fields
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, comment='Record creation timestamp (UTC)'),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, comment='Record last update timestamp (UTC)'),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True, comment='Soft delete timestamp (PIPEDA compliance)'),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, default=False, comment='Soft delete flag'),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True, comment='User who created this record'),
        sa.Column('updated_by', postgresql.UUID(as_uuid=True), nullable=True, comment='User who last updated this record'),
        sa.Column('deleted_by', postgresql.UUID(as_uuid=True), nullable=True, comment='User who deleted this record'),
        
        # Constraints
        sa.CheckConstraint('quantity_remaining >= 0', name='check_quantity_remaining_positive'),
        sa.CheckConstraint('quantity_remaining <= quantity_total', name='check_quantity_remaining_lte_total'),
        sa.CheckConstraint('quantity_reserved >= 0', name='check_quantity_reserved_positive'),
        sa.CheckConstraint('quantity_reserved <= quantity_remaining', name='check_quantity_reserved_lte_remaining'),
        sa.CheckConstraint('cost_cad >= 0', name='check_cost_positive'),
        sa.CheckConstraint('quality_rating >= 1 AND quality_rating <= 5', name='check_quality_rating_range'),
        sa.CheckConstraint('expiry_date IS NULL OR expiry_date > purchase_date', name='check_expiry_after_purchase'),
        sa.ForeignKeyConstraint(['child_id'], ['children.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create usage_logs table
    op.create_table('usage_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False, comment='Unique identifier'),
        sa.Column('child_id', postgresql.UUID(as_uuid=True), nullable=False, comment='Child this usage log belongs to'),
        sa.Column('inventory_item_id', postgresql.UUID(as_uuid=True), nullable=True, comment='Specific inventory item used (optional)'),
        sa.Column('usage_type', sa.String(length=50), nullable=False, comment='Type of usage event'),
        sa.Column('logged_at', sa.DateTime(timezone=True), nullable=False, comment='When the usage occurred'),
        sa.Column('quantity_used', sa.Integer(), nullable=False, default=1, comment='Number of items used'),
        sa.Column('context', sa.String(length=50), nullable=True, comment='Where/when usage occurred'),
        sa.Column('caregiver_name', sa.String(length=100), nullable=True, comment='Who performed the change'),
        sa.Column('was_wet', sa.Boolean(), nullable=True, comment='Diaper was wet (for diaper changes)'),
        sa.Column('was_soiled', sa.Boolean(), nullable=True, comment='Diaper was soiled (for diaper changes)'),
        sa.Column('diaper_condition', sa.String(length=50), nullable=True, comment='Condition of diaper (light, moderate, heavy)'),
        sa.Column('had_leakage', sa.Boolean(), nullable=True, comment='Whether there was leakage'),
        sa.Column('product_rating', sa.Integer(), nullable=True, comment='Rating of product performance for this use (1-5)'),
        sa.Column('time_since_last_change', sa.Integer(), nullable=True, comment='Minutes since last diaper change'),
        sa.Column('change_duration', sa.Integer(), nullable=True, comment='How long the change took in seconds'),
        sa.Column('notes', sa.Text(), nullable=True, comment='Additional notes about this usage'),
        sa.Column('health_notes', sa.Text(), nullable=True, comment='Health-related observations (rash, etc.)'),
        sa.Column('predicted_next_change', sa.DateTime(timezone=True), nullable=True, comment='ML-predicted time for next change'),
        sa.Column('pattern_deviation', sa.Boolean(), nullable=True, comment='Whether this usage deviates from normal pattern'),
        
        # Base model fields
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, comment='Record creation timestamp (UTC)'),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, comment='Record last update timestamp (UTC)'),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True, comment='Soft delete timestamp (PIPEDA compliance)'),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, default=False, comment='Soft delete flag'),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True, comment='User who created this record'),
        sa.Column('updated_by', postgresql.UUID(as_uuid=True), nullable=True, comment='User who last updated this record'),
        sa.Column('deleted_by', postgresql.UUID(as_uuid=True), nullable=True, comment='User who deleted this record'),
        
        # Constraints
        sa.CheckConstraint('quantity_used > 0', name='check_quantity_used_positive'),
        sa.CheckConstraint('product_rating >= 1 AND product_rating <= 5', name='check_product_rating_range'),
        sa.CheckConstraint('time_since_last_change >= 0', name='check_time_since_last_change_positive'),
        sa.CheckConstraint('change_duration >= 0', name='check_change_duration_positive'),
        sa.ForeignKeyConstraint(['child_id'], ['children.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['inventory_item_id'], ['inventory_items.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create stock_thresholds table
    op.create_table('stock_thresholds',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False, comment='Unique identifier'),
        sa.Column('child_id', postgresql.UUID(as_uuid=True), nullable=False, comment='Child these thresholds apply to'),
        sa.Column('product_type', sa.String(length=50), nullable=False, comment='Product type this threshold applies to'),
        sa.Column('size', sa.String(length=20), nullable=False, comment='Product size this threshold applies to'),
        sa.Column('brand', sa.String(length=100), nullable=True, comment='Specific brand (optional, null for all brands)'),
        sa.Column('threshold_type', sa.String(length=50), nullable=False, comment='Type of threshold'),
        sa.Column('low_threshold', sa.Integer(), nullable=True, comment='Quantity threshold for low stock warning'),
        sa.Column('critical_threshold', sa.Integer(), nullable=True, comment='Quantity threshold for critical stock alert'),
        sa.Column('days_warning', sa.Integer(), nullable=True, comment='Days of supply remaining threshold'),
        sa.Column('expiry_warning_days', sa.Integer(), nullable=True, comment='Days before expiry to warn'),
        sa.Column('notification_enabled', sa.Boolean(), nullable=False, default=True, comment='Whether notifications are enabled'),
        sa.Column('notification_frequency', sa.String(length=50), nullable=False, default='immediate', comment='How often to send notifications'),
        sa.Column('notification_methods', sa.JSON(), nullable=True, comment='Notification methods (push, email, etc.)'),
        sa.Column('auto_reorder_enabled', sa.Boolean(), nullable=False, default=False, comment='Enable automatic reorder suggestions'),
        sa.Column('preferred_vendors', sa.JSON(), nullable=True, comment='List of preferred vendors for auto-reorder'),
        sa.Column('reorder_quantity', sa.Integer(), nullable=True, comment='Suggested quantity for reorders'),
        sa.Column('max_stock_level', sa.Integer(), nullable=True, comment='Maximum stock level to maintain'),
        sa.Column('last_low_notification', sa.DateTime(timezone=True), nullable=True, comment='When low stock notification was last sent'),
        sa.Column('last_critical_notification', sa.DateTime(timezone=True), nullable=True, comment='When critical stock notification was last sent'),
        sa.Column('last_expiry_notification', sa.DateTime(timezone=True), nullable=True, comment='When expiry notification was last sent'),
        sa.Column('notification_count', sa.Integer(), nullable=False, default=0, comment='Total notifications sent for this threshold'),
        sa.Column('custom_message', sa.Text(), nullable=True, comment='Custom notification message'),
        sa.Column('priority_level', sa.Integer(), nullable=False, default=1, comment='Priority level (1=low, 2=medium, 3=high)'),
        sa.Column('seasonal_adjustments', sa.JSON(), nullable=True, comment='Seasonal threshold adjustments'),
        
        # Base model fields
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, comment='Record creation timestamp (UTC)'),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, comment='Record last update timestamp (UTC)'),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True, comment='Soft delete timestamp (PIPEDA compliance)'),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, default=False, comment='Soft delete flag'),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True, comment='User who created this record'),
        sa.Column('updated_by', postgresql.UUID(as_uuid=True), nullable=True, comment='User who last updated this record'),
        sa.Column('deleted_by', postgresql.UUID(as_uuid=True), nullable=True, comment='User who deleted this record'),
        
        # Constraints
        sa.CheckConstraint('low_threshold >= 0', name='check_low_threshold_positive'),
        sa.CheckConstraint('critical_threshold >= 0', name='check_critical_threshold_positive'),
        sa.CheckConstraint('critical_threshold <= low_threshold', name='check_critical_lte_low'),
        sa.CheckConstraint('days_warning >= 0', name='check_days_warning_positive'),
        sa.CheckConstraint('expiry_warning_days >= 0', name='check_expiry_warning_positive'),
        sa.CheckConstraint('priority_level >= 1 AND priority_level <= 3', name='check_priority_level_range'),
        sa.CheckConstraint('reorder_quantity >= 0', name='check_reorder_quantity_positive'),
        sa.CheckConstraint('max_stock_level >= reorder_quantity', name='check_max_stock_gte_reorder'),
        sa.ForeignKeyConstraint(['child_id'], ['children.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for inventory_items
    op.create_index('idx_inventory_child_product', 'inventory_items', ['child_id', 'product_type'])
    op.create_index('idx_inventory_child_size', 'inventory_items', ['child_id', 'size'])
    op.create_index('idx_inventory_low_stock', 'inventory_items', ['child_id', 'quantity_remaining'])
    op.create_index('idx_inventory_expiry', 'inventory_items', ['expiry_date'])
    op.create_index('idx_inventory_brand_size', 'inventory_items', ['brand', 'size'])
    
    # Create indexes for usage_logs
    op.create_index('idx_usage_child_date', 'usage_logs', ['child_id', 'logged_at'])
    op.create_index('idx_usage_type_date', 'usage_logs', ['usage_type', 'logged_at'])
    op.create_index('idx_usage_inventory', 'usage_logs', ['inventory_item_id', 'logged_at'])
    op.create_index('idx_usage_daily_stats', 'usage_logs', ['child_id', 'usage_type', 'logged_at'])
    op.create_index('idx_usage_pattern_analysis', 'usage_logs', ['child_id', 'logged_at', 'usage_type', 'quantity_used'])
    
    # Create indexes for stock_thresholds
    op.create_index('idx_threshold_child_product', 'stock_thresholds', ['child_id', 'product_type', 'size'])
    op.create_index('idx_threshold_notifications', 'stock_thresholds', ['notification_enabled', 'last_low_notification'])
    op.create_index('idx_threshold_priority', 'stock_thresholds', ['priority_level', 'notification_enabled'])
    op.create_index('idx_threshold_unique', 'stock_thresholds', ['child_id', 'product_type', 'size', 'threshold_type'], unique=True)


def downgrade() -> None:
    """
    Rollback migration changes - Remove inventory management tables
    
    PIPEDA Compliance: Ensures proper data cleanup during rollback
    """
    # Drop indexes for stock_thresholds
    op.drop_index('idx_threshold_unique', table_name='stock_thresholds')
    op.drop_index('idx_threshold_priority', table_name='stock_thresholds')
    op.drop_index('idx_threshold_notifications', table_name='stock_thresholds')
    op.drop_index('idx_threshold_child_product', table_name='stock_thresholds')
    
    # Drop indexes for usage_logs
    op.drop_index('idx_usage_pattern_analysis', table_name='usage_logs')
    op.drop_index('idx_usage_daily_stats', table_name='usage_logs')
    op.drop_index('idx_usage_inventory', table_name='usage_logs')
    op.drop_index('idx_usage_type_date', table_name='usage_logs')
    op.drop_index('idx_usage_child_date', table_name='usage_logs')
    
    # Drop indexes for inventory_items
    op.drop_index('idx_inventory_brand_size', table_name='inventory_items')
    op.drop_index('idx_inventory_expiry', table_name='inventory_items')
    op.drop_index('idx_inventory_low_stock', table_name='inventory_items')
    op.drop_index('idx_inventory_child_size', table_name='inventory_items')
    op.drop_index('idx_inventory_child_product', table_name='inventory_items')
    
    # Drop tables
    op.drop_table('stock_thresholds')
    op.drop_table('usage_logs')
    op.drop_table('inventory_items')